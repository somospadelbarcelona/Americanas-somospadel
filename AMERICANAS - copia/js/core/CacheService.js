/**
 * CacheService.js (Pro Edition - IndexedDB Engine)
 * High-performance persistent storage for a lag-free experience.
 */
(function () {
    class CacheService {
        constructor() {
            this.dbName = 'SomospadelDB_Cache';
            this.dbVersion = 3;
            this.db = null;
            this.TTL = 1000 * 60 * 60 * 24; // 24H default
            this._initDB();
        }

        _initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    // Create stores if they don't exist
                    const stores = ['players', 'matches', 'americanas', 'entrenos', 'config', 'general', 'database'];
                    stores.forEach(name => {
                        if (!db.objectStoreNames.contains(name)) {
                            db.createObjectStore(name);
                        }
                    });
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log("📦 [CacheService] IndexedDB Ready.");
                    resolve(this.db);
                };

                request.onerror = (e) => {
                    console.error("❌ [CacheService] IndexedDB Error:", e);
                    reject(e);
                };
            });
        }

        async _getDB() {
            if (this.db) return this.db;
            return await this._initDB();
        }

        /**
         * Set data in cache
         */
        async set(storeName, key, data, ttl = null) {
            const db = await this._getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                const entry = {
                    val: data,
                    expires: Date.now() + (ttl || this.TTL)
                };

                const request = store.put(entry, key);
                request.onsuccess = () => resolve(true);
                request.onerror = (e) => reject(e);
            });
        }

        /**
         * Get data from cache
         */
        async get(storeName, key) {
            const db = await this._getDB();
            return new Promise((resolve) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = () => {
                    const entry = request.result;
                    if (!entry) return resolve(null);

                    if (Date.now() > entry.expires) {
                        this.remove(storeName, key);
                        return resolve(null);
                    }
                    resolve(entry.val);
                };
                request.onerror = () => resolve(null);
            });
        }

        /**
         * Delete specific key
         */
        async remove(storeName, key) {
            const db = await this._getDB();
            const transaction = db.transaction([storeName], 'readwrite');
            transaction.objectStore(storeName).delete(key);
        }

        /**
         * Stale-While-Revalidate Pattern
         * 1. Returns cached immediately if exists.
         * 2. Runs fetchFn in background and updates cache.
         * 3. Calls onUpdate callback if fresh data is different.
         */
        async swr(storeName, key, fetchFn, onUpdate = null, ttl = null) {
            const cached = await this.get(storeName, key);

            // Background fetch
            const promiseFresh = fetchFn().then(fresh => {
                if (fresh) {
                    // Optimized: only notify and update if data changed (deep comparison if needed)
                    // For now, simplicity: always update cache
                    this.set(storeName, key, fresh, ttl);
                    if (onUpdate && JSON.stringify(cached) !== JSON.stringify(fresh)) {
                        onUpdate(fresh);
                    }
                }
                return fresh;
            });

            return cached || await promiseFresh;
        }

        async clearStore(storeName) {
            const db = await this._getDB();
            const transaction = db.transaction([storeName], 'readwrite');
            transaction.objectStore(storeName).clear();
        }

        async clearAll() {
            const stores = ['players', 'matches', 'americanas', 'entrenos', 'config', 'general'];
            for (const s of stores) {
                await this.clearStore(s);
            }
            console.log("🧹 [CacheService] All caches cleared.");
        }
    }

    window.CacheService = new CacheService();
})();
