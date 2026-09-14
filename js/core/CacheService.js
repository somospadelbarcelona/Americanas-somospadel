/**
 * CacheService.js (Pro Edition - IndexedDB Engine)
 * High-performance persistent storage for a lag-free experience.
 * Fully resilient against QuotaExceededError, version locking, and storage quota restrictions.
 */
(function () {
    class CacheService {
        constructor() {
            this.dbName = 'SomospadelDB_Cache';
            this.dbVersion = 3;
            this.db = null;
            this._initPromise = null;
            this._fallbackMemory = {}; // Fallback if IndexedDB is blocked, full, or in private browsing
            this._isFallback = false;
            this.TTL = 1000 * 60 * 60 * 24; // 24H default
            this.STORES = ['players', 'matches', 'americanas', 'entrenos', 'config', 'general', 'database'];

            // Initialize DB connection and schedule background garbage collection
            this._getDB().catch(() => {});
            this._scheduleBackgroundGC();
        }

        _initDB() {
            if (typeof indexedDB === 'undefined') {
                console.warn("⚠️ [CacheService] IndexedDB unavailable in this context. Using in-memory fallback.");
                this._isFallback = true;
                return Promise.resolve(null);
            }

            return new Promise((resolve) => {
                let request;
                try {
                    request = indexedDB.open(this.dbName, this.dbVersion);
                } catch (e) {
                    console.warn("⚠️ [CacheService] Exception opening IndexedDB:", e);
                    this._isFallback = true;
                    return resolve(null);
                }

                // Database upgrade / schema setup
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    this.STORES.forEach(name => {
                        if (!db.objectStoreNames.contains(name)) {
                            db.createObjectStore(name);
                        }
                    });
                };

                // Prevent hanging if another tab has an older version open
                request.onblocked = (e) => {
                    console.warn("⚠️ [CacheService] IndexedDB upgrade blocked by another active tab/window.");
                    if (typeof e?.preventDefault === 'function') e.preventDefault();
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;

                    // Handle graceful close if another tab upgrades the database
                    this.db.onversionchange = () => {
                        console.warn("⚠️ [CacheService] Database version change detected in another tab. Closing connection.");
                        try {
                            this.db.close();
                        } catch (_) {}
                        this.db = null;
                    };

                    this.db.onclose = () => {
                        this.db = null;
                    };

                    console.log("📦 [CacheService] IndexedDB Ready.");
                    resolve(this.db);
                };

                request.onerror = (e) => {
                    console.warn("❌ [CacheService] IndexedDB error. Using in-memory fallback:", e?.target?.error || e);
                    if (typeof e?.preventDefault === 'function') e.preventDefault();
                    this._isFallback = true;
                    resolve(null); // Resolve cleanly to prevent unhandled rejection
                };
            });
        }

        async _getDB() {
            if (this.db) return this.db;
            if (this._isFallback) return null;
            if (!this._initPromise) {
                this._initPromise = this._initDB().finally(() => {
                    this._initPromise = null;
                });
            }
            return await this._initPromise;
        }

        /**
         * Safe in-memory fallback stores
         */
        _setMemory(storeName, key, data, ttl) {
            if (!this._fallbackMemory[storeName]) {
                this._fallbackMemory[storeName] = new Map();
            }
            this._fallbackMemory[storeName].set(key, {
                val: data,
                time: Date.now(),
                expires: Date.now() + (ttl || this.TTL)
            });
        }

        _getMemory(storeName, key) {
            const store = this._fallbackMemory[storeName];
            if (!store) return null;
            const entry = store.get(key);
            if (!entry) return null;
            if (Date.now() > entry.expires) {
                store.delete(key);
                return null;
            }
            return entry;
        }

        _removeMemory(storeName, key) {
            if (this._fallbackMemory[storeName]) {
                this._fallbackMemory[storeName].delete(key);
            }
        }

        _clearMemory(storeName) {
            if (this._fallbackMemory[storeName]) {
                this._fallbackMemory[storeName].clear();
            }
        }

        /**
         * Set data in cache with full QuotaExceededError and error suppression.
         */
        async set(storeName, key, data, ttl = null) {
            if (this._isFallback) {
                this._setMemory(storeName, key, data, ttl);
                return true;
            }

            try {
                const db = await this._getDB();
                if (!db) {
                    this._setMemory(storeName, key, data, ttl);
                    return true;
                }

                return new Promise((resolve) => {
                    try {
                        const transaction = db.transaction([storeName], 'readwrite');
                        const store = transaction.objectStore(storeName);

                        const entry = {
                            val: data,
                            time: Date.now(),
                            expires: Date.now() + (ttl || this.TTL)
                        };

                        const request = store.put(entry, key);

                        request.onsuccess = () => resolve(true);

                        request.onerror = (e) => {
                            const err = request.error || e?.target?.error;
                            const isQuota = err && (
                                err.name === 'QuotaExceededError' ||
                                err.code === 22 ||
                                (err.message && err.message.toLowerCase().includes('quota'))
                            );

                            if (isQuota) {
                                console.warn(`⚠️ [CacheService] Storage quota exceeded while caching "${storeName}:${key}". Triggering GC...`);
                                if (typeof e?.preventDefault === 'function') e.preventDefault();
                                // Clean expired caches to reclaim quota
                                this.cleanExpired().catch(() => {});
                            } else {
                                console.warn(`⚠️ [CacheService] Write error for "${storeName}:${key}":`, err?.message || err);
                            }
                            // Store in fallback memory so user session doesn't lose state
                            this._setMemory(storeName, key, data, ttl);
                            resolve(false);
                        };

                        transaction.onerror = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(false);
                        };

                        transaction.onabort = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(false);
                        };
                    } catch (txErr) {
                        console.warn(`⚠️ [CacheService] Transaction exception for "${storeName}":`, txErr?.message || txErr);
                        this._setMemory(storeName, key, data, ttl);
                        resolve(false);
                    }
                });
            } catch (err) {
                console.warn(`⚠️ [CacheService] Set failed:`, err);
                this._setMemory(storeName, key, data, ttl);
                return false;
            }
        }

        /**
         * Get data from cache
         */
        async get(storeName, key) {
            const entry = await this.getEntry(storeName, key);
            return entry ? entry.val : null;
        }

        /**
         * Get full entry from cache (including metadata)
         */
        async getEntry(storeName, key) {
            if (this._isFallback) {
                return this._getMemory(storeName, key);
            }

            try {
                const db = await this._getDB();
                if (!db) {
                    return this._getMemory(storeName, key);
                }

                return new Promise((resolve) => {
                    try {
                        const transaction = db.transaction([storeName], 'readonly');
                        const store = transaction.objectStore(storeName);
                        const request = store.get(key);

                        request.onsuccess = () => {
                            const entry = request.result;
                            if (!entry) {
                                return resolve(this._getMemory(storeName, key));
                            }

                            if (entry.expires && Date.now() > entry.expires) {
                                this.remove(storeName, key).catch(() => {});
                                return resolve(null);
                            }
                            resolve(entry);
                        };

                        request.onerror = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(this._getMemory(storeName, key));
                        };

                        transaction.onerror = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(this._getMemory(storeName, key));
                        };
                    } catch (txErr) {
                        resolve(this._getMemory(storeName, key));
                    }
                });
            } catch (err) {
                return this._getMemory(storeName, key);
            }
        }

        /**
         * Delete specific key from cache
         */
        async remove(storeName, key) {
            this._removeMemory(storeName, key);

            if (this._isFallback) return;

            try {
                const db = await this._getDB();
                if (!db) return;

                return new Promise((resolve) => {
                    try {
                        const transaction = db.transaction([storeName], 'readwrite');
                        const store = transaction.objectStore(storeName);
                        const request = store.delete(key);
                        request.onsuccess = () => resolve(true);
                        request.onerror = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(false);
                        };
                        transaction.onerror = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(false);
                        };
                    } catch (_) {
                        resolve(false);
                    }
                });
            } catch (_) {
                // Silently handle
            }
        }

        /**
         * Stale-While-Revalidate Pattern
         * 1. Returns cached immediately if exists.
         * 2. Runs fetchFn in background and updates cache.
         * 3. Calls onUpdate callback if fresh data is different.
         */
        async swr(storeName, key, fetchFn, onUpdate = null, staleThreshold = 1000 * 60 * 5) {
            const entry = await this.getEntry(storeName, key);
            const cachedValue = entry ? entry.val : null;

            const now = Date.now();
            const isStale = !entry || (now - entry.time > staleThreshold);

            if (!isStale) {
                console.log(`📡 [Cache] Data for ${storeName}:${key} is FRESH (< ${Math.round(staleThreshold / 60000)}min). Skipping revalidation.`);
                return cachedValue;
            }

            console.log(`🔄 [Cache] Data for ${storeName}:${key} is STALE. Revalidating...`);

            // Background fetch safely wrapped
            const promiseFresh = (async () => {
                try {
                    const fresh = await fetchFn();
                    if (fresh) {
                        await this.set(storeName, key, fresh);
                        if (onUpdate && JSON.stringify(cachedValue) !== JSON.stringify(fresh)) {
                            onUpdate(fresh);
                        }
                    }
                    return fresh;
                } catch (fetchErr) {
                    console.warn(`⚠️ [CacheService] SWR background revalidation failed for ${storeName}:${key}:`, fetchErr?.message || fetchErr);
                    return cachedValue; // Return cached value as fallback on network error
                }
            })();

            return cachedValue || await promiseFresh;
        }

        /**
         * Garbage Collection: Safely deletes expired cache entries without touching valid data or clearing whole DB.
         * @param {string|null} [targetStore=null] - Specific store or all stores if null
         * @returns {Promise<{ deleted: number, storesScanned: number }>}
         */
        async cleanExpired(targetStore = null) {
            let totalDeleted = 0;
            const storesToScan = targetStore ? [targetStore] : this.STORES;
            const now = Date.now();

            // 1. Clean fallback memory
            storesToScan.forEach(s => {
                if (this._fallbackMemory[s]) {
                    for (const [k, v] of this._fallbackMemory[s].entries()) {
                        if (v && v.expires && now > v.expires) {
                            this._fallbackMemory[s].delete(k);
                            totalDeleted++;
                        }
                    }
                }
            });

            if (this._isFallback) {
                return { deleted: totalDeleted, storesScanned: storesToScan.length };
            }

            // 2. Clean IndexedDB stores via cursor
            try {
                const db = await this._getDB();
                if (!db) return { deleted: totalDeleted, storesScanned: storesToScan.length };

                for (const storeName of storesToScan) {
                    if (!db.objectStoreNames.contains(storeName)) continue;

                    await new Promise((resolve) => {
                        try {
                            const transaction = db.transaction([storeName], 'readwrite');
                            const store = transaction.objectStore(storeName);
                            const request = store.openCursor();

                            request.onsuccess = (event) => {
                                const cursor = event.target.result;
                                if (cursor) {
                                    const entry = cursor.value;
                                    if (entry && entry.expires && now > entry.expires) {
                                        cursor.delete();
                                        totalDeleted++;
                                    }
                                    cursor.continue();
                                } else {
                                    resolve();
                                }
                            };

                            request.onerror = (e) => {
                                if (typeof e?.preventDefault === 'function') e.preventDefault();
                                resolve();
                            };

                            transaction.onerror = (e) => {
                                if (typeof e?.preventDefault === 'function') e.preventDefault();
                                resolve();
                            };

                            transaction.onabort = (e) => {
                                if (typeof e?.preventDefault === 'function') e.preventDefault();
                                resolve();
                            };
                        } catch (_) {
                            resolve();
                        }
                    });
                }

                if (totalDeleted > 0) {
                    console.log(`🧹 [CacheService] Garbage collection freed ${totalDeleted} expired entries.`);
                }
            } catch (err) {
                console.warn("⚠️ [CacheService] Error during cleanExpired:", err);
            }

            return { deleted: totalDeleted, storesScanned: storesToScan.length };
        }

        /**
         * Clear a specific object store completely.
         */
        async clearStore(storeName) {
            this._clearMemory(storeName);
            if (this._isFallback) return;

            try {
                const db = await this._getDB();
                if (!db || !db.objectStoreNames.contains(storeName)) return;

                return new Promise((resolve) => {
                    try {
                        const transaction = db.transaction([storeName], 'readwrite');
                        const store = transaction.objectStore(storeName);
                        store.clear();
                        transaction.oncomplete = () => resolve(true);
                        transaction.onerror = (e) => {
                            if (typeof e?.preventDefault === 'function') e.preventDefault();
                            resolve(false);
                        };
                    } catch (_) {
                        resolve(false);
                    }
                });
            } catch (_) {}
        }

        /**
         * Clear all configured object stores.
         */
        async clearAll() {
            for (const s of this.STORES) {
                await this.clearStore(s);
            }
            console.log("🧹 [CacheService] All caches cleared.");
        }

        /**
         * Schedule background garbage collection on idle or startup.
         */
        _scheduleBackgroundGC() {
            const runGC = () => {
                this.cleanExpired().catch(() => {});
            };

            if (typeof window !== 'undefined') {
                if (typeof window.requestIdleCallback === 'function') {
                    window.requestIdleCallback(runGC, { timeout: 10000 });
                } else {
                    setTimeout(runGC, 4000);
                }
            }
        }
    }

    window.CacheService = new CacheService();
})();
