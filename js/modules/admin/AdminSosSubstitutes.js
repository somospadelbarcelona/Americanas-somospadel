/**
 * AdminSosSubstitutes.js
 * 
 * 🚨 PANEL DE CONVOCATORIAS, SUPLENTES SOS Y MENSAJERÍA MASIVA
 * SomosPádel BCN - Herramienta para Capitanes y Super Administradores
 * 
 * Funcionalidades 100% con datos reales:
 * 1. Control de entrenos masculinos, mixtos y americanas con huecos libres.
 * 2. Herramienta de difusión masiva (Push in-app + WhatsApp) segmentada por género (Masculino / Mixto) y nivel.
 * 3. Gestión y publicación de Alertas SOS de última hora (+150 XP).
 * 4. Censo completo de jugadores reales del club con WhatsApp directo y asignación manual inmediata.
 * 
 * Expuesto en `window.AdminSosSubstitutes`.
 */

(function (global) {
    'use strict';

    class AdminSosSubstitutes {
        constructor() {
            this.container = null;
            this.activeAlerts = [];
            this.substitutes = [];
            this.realPlayers = [];
            this.incompleteEvents = [];
            this.rescuesHistory = [];
            this.filterGender = 'all'; // 'all', 'chico', 'chica'
            this.filterSide = 'all';   // 'all', 'drive', 'reves'
            this.filterGuard = 'all';  // 'all', 'guard'
            this.filterEventCat = 'all'; // 'all', 'male', 'mixed', 'female', 'americana'
            this.searchQuery = '';
            this.initialized = false;
        }

        /**
         * Inicializa y renderiza la vista en el contenedor administrativo
         */
        /**
         * Inicializa y renderiza la vista en el contenedor administrativo
         */
        async render(targetContainer = null) {
            const container = (typeof targetContainer === 'string')
                ? document.querySelector(targetContainer)
                : (targetContainer || document.getElementById('content-area'));

            if (!container) {
                console.error("❌ [AdminSosSubstitutes] No se encontró el contenedor objetivo (#content-area)");
                return;
            }

            this.container = container;
            this.container.innerHTML = this._getLoadingHtml();

            try {
                // Dar hasta 4.5s para que Firebase resuelva consultas reales
                await Promise.race([
                    this._fetchData(),
                    new Promise(resolve => setTimeout(resolve, 4500))
                ]);
            } catch (error) {
                console.warn("⚠️ [AdminSosSubstitutes] Renderizado defensivo tras incidencia:", error);
            }

            this._renderDashboard();
            this._setupListeners();
            this._updateSidebarBadge();

            // Sincronización reactiva en segundo plano por si la red tardó más de 4.5s
            this._fetchData().then(() => {
                if (this.container && this.container.querySelector('#admin-sos-dashboard-root')) {
                    this._renderDashboard();
                    this._setupListeners();
                    this._updateSidebarBadge();
                }
            }).catch(e => console.warn("⚠️ [AdminSosSubstitutes] Error en background sync:", e));
        }

        /**
         * Obtiene la instancia de Firestore disponible
         */
        _getDb() {
            if (typeof window !== 'undefined' && window.db) return window.db;
            if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
                try { return firebase.firestore(); } catch (_) {}
            }
            return null;
        }

        /**
         * Carga datos 100% reales desde Firestore y servicios de la app
         * Ejecución paralela, resiliente y protegida contra timeouts para renderizar siempre de inmediato.
         * @private
         */
        async _fetchData() {
            const service = this._getService();

            const withTimeout = (promise, ms = 4500, fallback = []) => {
                return Promise.race([
                    promise,
                    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
                ]).catch(err => {
                    console.warn("⚠️ [AdminSosSubstitutes] Fallback tras error o timeout:", err.message);
                    return fallback;
                });
            };

            // 1. Memoria instantánea previa (0ms)
            if (Array.isArray(window.allUsersCache) && window.allUsersCache.length > 0) {
                this.realPlayers = this._normalizePlayers(window.allUsersCache);
            } else if (Array.isArray(window._allPlayersCache) && window._allPlayersCache.length > 0) {
                this.realPlayers = this._normalizePlayers(window._allPlayersCache);
            }

            // 2. Ejecución en paralelo de todas las fuentes
            const [alertsRes, playersRes, subsRes, eventsRes, rescuesRes] = await Promise.allSettled([
                withTimeout((async () => {
                    if (service && typeof service.getActiveSosAlerts === 'function') {
                        return await service.getActiveSosAlerts({ realOnly: true, allowMockSeeds: false });
                    }
                    return [];
                })(), 4000, []),

                withTimeout((async () => {
                    if (this.realPlayers && this.realPlayers.length > 0) return this.realPlayers;
                    if (service && typeof service.getClubPlayers === 'function') {
                        return await service.getClubPlayers({ realOnly: true });
                    }
                    if (window.FirebaseDB && window.FirebaseDB.players) {
                        const raw = await window.FirebaseDB.players.getAll(false);
                        return this._normalizePlayers(raw);
                    }
                    return [];
                })(), 4000, this.realPlayers || []),

                withTimeout((async () => {
                    if (service && typeof service.getAvailableSubstitutes === 'function') {
                        return await service.getAvailableSubstitutes(null, null, { realOnly: true, allowMockSeeds: false });
                    }
                    return [];
                })(), 3000, []),

                withTimeout((async () => {
                    return await this._loadIncompleteEvents();
                })(), 4500, []),

                withTimeout((async () => {
                    return await this._loadRealRescuesHistory();
                })(), 2500, [])
            ]);

            if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) this.activeAlerts = alertsRes.value;
            if (playersRes.status === 'fulfilled' && Array.isArray(playersRes.value) && playersRes.value.length > 0) this.realPlayers = playersRes.value;
            if (subsRes.status === 'fulfilled' && Array.isArray(subsRes.value)) this.substitutes = subsRes.value;
            if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) this.incompleteEvents = eventsRes.value;
            if (rescuesRes.status === 'fulfilled' && Array.isArray(rescuesRes.value)) this.rescuesHistory = rescuesRes.value;
        }

        /**
         * Normaliza un array crudo de jugadores
         */
        _normalizePlayers(rawList = []) {
            return (rawList || []).map(p => {
                const uid = p.id || p.uid || `p_${Math.random()}`;
                const rawGender = String(p.gender || p.sexo || '').toLowerCase().trim();
                let gender = 'chico';
                if (rawGender.includes('chica') || rawGender.includes('fem') || rawGender === 'f') {
                    gender = 'chica';
                }

                const rawSide = String(p.side || p.preferred_side || 'any').toLowerCase().trim();
                let side = 'any';
                if (rawSide.includes('dri')) side = 'drive';
                else if (rawSide.includes('rev')) side = 'reves';

                const level = parseFloat(p.level || p.playtomic_level || p.self_rate_level || 3.5);

                return {
                    id: uid,
                    uid: uid,
                    name: (p.name || p.displayName || 'Jugador').toUpperCase(),
                    phone: (p.phone || p.telefono || '').toString().trim(),
                    level: isNaN(level) ? 3.5 : level,
                    side: side,
                    gender: gender,
                    role: p.role || 'player',
                    team_somospadel: p.team_somospadel || [],
                    status: p.status || 'active',
                    photoURL: p.photoURL || p.photo_url || null,
                    isAvailableToday: false,
                    raw: p
                };
            });
        }

        /**
         * Obtiene la lista cruda de entrenos desde todas las fuentes (Memoria, Cache, EventService, FirebaseDB, Firestore)
         */
        async _fetchRawEntrenos() {
            // 1. Memoria rápida
            if (Array.isArray(window._currentEntrenosCache) && window._currentEntrenosCache.length > 0) {
                return window._currentEntrenosCache;
            }
            // 2. Caché persistente CacheService
            if (window.CacheService) {
                try {
                    const cached = await window.CacheService.get('entrenos', 'all');
                    if (Array.isArray(cached) && cached.length > 0) return cached;
                } catch (_) {}
            }
            // 3. EventService
            if (window.EventService && typeof window.EventService.getAll === 'function') {
                try {
                    const evts = await window.EventService.getAll('entreno');
                    if (Array.isArray(evts) && evts.length > 0) {
                        window._currentEntrenosCache = evts;
                        return evts;
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] EventService.getAll('entreno') falló:", e.message);
                }
            }
            // 4. FirebaseDB
            if (window.FirebaseDB && window.FirebaseDB.entrenos) {
                try {
                    const evts = await window.FirebaseDB.entrenos.getAll();
                    if (Array.isArray(evts) && evts.length > 0) {
                        window._currentEntrenosCache = evts;
                        return evts;
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] FirebaseDB.entrenos.getAll() falló:", e.message);
                }
            }
            // 5. Firestore directo sin ordenación restrictiva
            const db = this._getDb();
            if (db) {
                try {
                    const snap = await db.collection('entrenos').get();
                    if (snap && snap.docs && snap.docs.length > 0) {
                        const evts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        window._currentEntrenosCache = evts;
                        return evts;
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] db.collection('entrenos').get() falló:", e.message);
                }
            }
            return [];
        }

        /**
         * Obtiene la lista cruda de americanas desde todas las fuentes
         */
        async _fetchRawAmericanas() {
            // 1. Memoria previa
            if (Array.isArray(window._currentAmericanasCache) && window._currentAmericanasCache.length > 0) {
                return window._currentAmericanasCache;
            }
            // 2. Caché persistente CacheService
            if (window.CacheService) {
                try {
                    const cached = await window.CacheService.get('americanas', 'all');
                    if (Array.isArray(cached) && cached.length > 0) return cached;
                } catch (_) {}
            }
            // 3. EventService
            if (window.EventService && typeof window.EventService.getAll === 'function') {
                try {
                    const evts = await window.EventService.getAll('americana');
                    if (Array.isArray(evts) && evts.length > 0) {
                        window._currentAmericanasCache = evts;
                        return evts;
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] EventService.getAll('americana') falló:", e.message);
                }
            }
            // 4. FirebaseDB
            if (window.FirebaseDB && window.FirebaseDB.americanas) {
                try {
                    const evts = await window.FirebaseDB.americanas.getAll();
                    if (Array.isArray(evts) && evts.length > 0) {
                        window._currentAmericanasCache = evts;
                        return evts;
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] FirebaseDB.americanas.getAll() falló:", e.message);
                }
            }
            // 5. Firestore directo
            const db = this._getDb();
            if (db) {
                try {
                    const snap = await db.collection('americanas').get();
                    if (snap && snap.docs && snap.docs.length > 0) {
                        const evts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        window._currentAmericanasCache = evts;
                        return evts;
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] db.collection('americanas').get() falló:", e.message);
                }
            }
            return [];
        }

        /**
         * Formatea la fecha y hora de forma natural en español:
         * - Si es hoy: 'hoy (18:00h)'
         * - Si es mañana: 'mañana (18:00h)'
         * - Si es otra fecha: 'el sábado 10 de octubre a las 18:00h'
         */
        _formatFriendlyDatePhrase(dateStr, timeStr) {
            if (!dateStr || String(dateStr).trim().toLowerCase() === 'hoy') {
                return timeStr ? `hoy (${timeStr}h)` : 'hoy';
            }
            if (String(dateStr).trim().toLowerCase() === 'mañana') {
                return timeStr ? `mañana (${timeStr}h)` : 'mañana';
            }

            try {
                const now = new Date();
                const yNow = now.getFullYear();
                const mNow = now.getMonth();
                const dNow = now.getDate();
                const todayStr = `${yNow}-${String(mNow + 1).padStart(2, '0')}-${String(dNow).padStart(2, '0')}`;

                const tom = new Date(yNow, mNow, dNow + 1);
                const tomStr = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;

                let clean = String(dateStr).trim();
                let targetY, targetM, targetD;

                if (clean.includes('/')) {
                    const p = clean.split('/').map(Number);
                    if (p.length >= 2) {
                        targetD = p[0];
                        targetM = p[1];
                        targetY = p[2] ? (p[2] < 100 ? 2000 + p[2] : p[2]) : yNow;
                    }
                } else if (clean.includes('-')) {
                    const p = clean.split('-').map(Number);
                    if (p[0] > 1000) {
                        targetY = p[0];
                        targetM = p[1];
                        targetD = p[2];
                    } else {
                        targetD = p[0];
                        targetM = p[1];
                        targetY = p[2] ? (p[2] < 100 ? 2000 + p[2] : p[2]) : yNow;
                    }
                }

                if (targetY && targetM && targetD) {
                    const targetIso = `${targetY}-${String(targetM).padStart(2, '0')}-${String(targetD).padStart(2, '0')}`;
                    if (targetIso === todayStr) {
                        return timeStr ? `hoy (${timeStr}h)` : 'hoy';
                    }
                    if (targetIso === tomStr) {
                        return timeStr ? `mañana (${timeStr}h)` : 'mañana';
                    }

                    const targetDate = new Date(targetY, targetM - 1, targetD);
                    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    const dayWeek = dayNames[targetDate.getDay()] || '';
                    const monthName = monthNames[targetDate.getMonth()] || '';
                    return `el ${dayWeek} ${targetD} de ${monthName}${timeStr ? ` a las ${timeStr}h` : ''}`;
                }
            } catch (_) {}

            return `${dateStr}${timeStr ? ` (${timeStr}h)` : ''}`;
        }

        /**
         * Formatea la fecha corta para badges y selectores (ej: 'Sáb 10 Oct')
         */
        _formatShortDate(dateStr) {
            if (!dateStr || String(dateStr).trim().toLowerCase() === 'hoy') return 'Hoy';
            if (String(dateStr).trim().toLowerCase() === 'mañana') return 'Mañana';
            try {
                let clean = String(dateStr).trim();
                let y, m, d;
                const now = new Date();
                if (clean.includes('/')) {
                    const p = clean.split('/').map(Number);
                    d = p[0]; m = p[1]; y = p[2] ? (p[2] < 100 ? 2000 + p[2] : p[2]) : now.getFullYear();
                } else if (clean.includes('-')) {
                    const p = clean.split('-').map(Number);
                    if (p[0] > 1000) { y = p[0]; m = p[1]; d = p[2]; }
                    else { d = p[0]; m = p[1]; y = p[2] ? (p[2] < 100 ? 2000 + p[2] : p[2]) : now.getFullYear(); }
                }
                if (y && m && d) {
                    const dt = new Date(y, m - 1, d);
                    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                    return `${days[dt.getDay()]} ${d} ${months[dt.getMonth()]}`;
                }
            } catch (_) {}
            return dateStr;
        }

        /**
         * Carga entrenos y americanas que tengan plazas vacantes reales
         */
        async _loadIncompleteEvents() {
            const list = [];
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            // Ejecución en paralelo simultáneo de ambas fuentes para máxima velocidad
            const [rawEntrenos, rawAmericanas] = await Promise.all([
                this._fetchRawEntrenos(),
                this._fetchRawAmericanas()
            ]);

            const processEvent = (e, type) => {
                if (!e || !e.id) return;
                const status = String(e.status || 'open').toLowerCase().trim();

                // Descartar eventos finalizados o cancelados
                if (status === 'cancelled' || status === 'cancelado' || status === 'anulado' ||
                    status === 'finished' || status === 'finalizado' || status === 'completed') {
                    return;
                }

                // Normalización de fecha
                let dateStr = String(e.date || '').trim();
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/').map(p => p.trim());
                    if (parts.length >= 2) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : String(now.getFullYear());
                        dateStr = `${year}-${month}-${day}`;
                    }
                }

                // Si la fecha ya pasó y NO está explícitamente en open/live/pairing, omitir
                const isActiveStatus = (status === 'open' || status === 'live' || status === 'pairing' || status === 'abierta');
                if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && dateStr < todayStr && !isActiveStatus) {
                    return;
                }

                // Cálculo robusto de capacidad y plazas libres
                const maxCourts = parseInt(e.max_courts || e.courts, 10) || 4;
                const maxPlayers = parseInt(e.max_players, 10) || (maxCourts * 4);

                let currentCount = 0;
                if (Array.isArray(e.players)) {
                    currentCount = e.players.length;
                } else if (Array.isArray(e.registeredPlayers)) {
                    currentCount = e.registeredPlayers.length;
                } else if (e.players && typeof e.players === 'object') {
                    currentCount = Object.keys(e.players).length;
                } else if (typeof e.participants_count === 'number') {
                    currentCount = e.participants_count;
                }

                const freeSlots = Math.max(0, maxPlayers - currentCount);

                // Normalización inteligente de categoría (male, mixed, female, open)
                const rawCat = String(e.category || '').toLowerCase().trim();
                const rawName = String(e.name || e.title || '').toLowerCase();
                let category = 'open';
                if (rawCat.includes('masc') || rawCat === 'male' || rawCat === 'chicos' || rawName.includes('masc') || rawName.includes('chico') || rawName.includes('hombre')) {
                    category = 'male';
                } else if (rawCat.includes('fem') || rawCat === 'female' || rawCat === 'chicas' || rawName.includes('fem') || rawName.includes('chica') || rawName.includes('mujer')) {
                    category = 'female';
                } else if (rawCat.includes('mixt') || rawCat === 'mixed' || rawName.includes('mixt')) {
                    category = 'mixed';
                }

                if (freeSlots > 0) {
                    list.push({
                        id: e.id,
                        type,
                        name: (e.name || e.title || (type === 'entreno' ? 'Entreno Táctico' : 'Americana SomosPadel')).toUpperCase(),
                        date: dateStr || e.date || 'Hoy',
                        time: e.time || '19:30',
                        court: e.court || e.pista || e.location || e.club || e.sede || 'Pistas Centrales',
                        category,
                        levelMin: parseFloat(e.level_min || e.level || 3.0),
                        levelMax: parseFloat(e.level_max || e.level || 4.5),
                        maxPlayers,
                        currentPlayers: currentCount,
                        freeSlots,
                        raw: e
                    });
                }
            };

            (rawEntrenos || []).forEach(e => processEvent(e, 'entreno'));
            (rawAmericanas || []).forEach(e => processEvent(e, 'americana'));

            // Ordenar por fecha y hora más cercana
            list.sort((a, b) => {
                const dA = `${a.date} ${a.time}`;
                const dB = `${b.date} ${b.time}`;
                return dA.localeCompare(dB);
            });

            return list;
        }

        /**
         * Carga historial de rescates reales (status: 'filled') desde Firestore y caché local
         */
        async _loadRealRescuesHistory() {
            const list = [];
            const db = (typeof window !== 'undefined' && window.db) ? window.db : null;

            if (db) {
                try {
                    const snap = await Promise.race([
                        db.collection('sos_alerts').where('status', '==', 'filled').limit(15).get(),
                        new Promise(resolve => setTimeout(() => resolve({ empty: true, forEach: () => {} }), 1500))
                    ]);
                    if (snap && !snap.empty) {
                        snap.forEach(doc => {
                            const d = doc.data();
                            list.push({ ...d, id: doc.id });
                        });
                    }
                } catch (e) {
                    console.warn("⚠️ [AdminSosSubstitutes] Error no crítico leyendo rescates:", e.message);
                }
            }

            // Si está vacío, consultar caché local real
            if (list.length === 0 && this._getService() && typeof this._getService()._getCachedAlerts === 'function') {
                try {
                    const cached = this._getService()._getCachedAlerts();
                    const filled = (cached || []).filter(a => a && a.status === 'filled');
                    list.push(...filled);
                } catch (_) {}
            }

            return list;
        }

        /**
         * Renderiza el template completo del panel administrativo
         * @private
         */
        _renderDashboard() {
            const activeSosCount = this.activeAlerts.length;
            const incompleteCount = this.incompleteEvents.length;
            const playersCount = this.realPlayers.length;
            const rescuedCount = this.rescuesHistory.length;

            const maleEventsCount = this.incompleteEvents.filter(e => {
                const cat = String(e.category || '').toLowerCase();
                const name = String(e.name || '').toLowerCase();
                return cat === 'male' || cat.includes('masc') || name.includes('masc') || name.includes('chico') || cat === 'open';
            }).length;
            const mixedEventsCount = this.incompleteEvents.filter(e => {
                const cat = String(e.category || '').toLowerCase();
                const name = String(e.name || '').toLowerCase();
                return cat === 'mixed' || cat.includes('mixt') || name.includes('mixt') || cat === 'open';
            }).length;
            const femEventsCount = this.incompleteEvents.filter(e => {
                const cat = String(e.category || '').toLowerCase();
                const name = String(e.name || '').toLowerCase();
                return cat === 'female' || cat.includes('fem') || name.includes('fem') || name.includes('chica') || cat === 'open';
            }).length;

            const filteredPlayers = this._getFilteredPlayers();
            const filteredEvents = this._getFilteredEvents();

            this.container.innerHTML = `
                <div class="admin-sos-wrapper" style="
                    padding: 24px;
                    max-width: 1440px;
                    margin: 0 auto;
                    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #0f172a;
                    box-sizing: border-box;
                ">
                    <!-- ========================================== -->
                    <!-- A. CABECERA: CONVOCATORIAS & MENSAJERÍA     -->
                    <!-- ========================================== -->
                    <div style="
                        background: linear-gradient(135deg, #090e1a 0%, #0f172a 60%, #1e293b 100%);
                        border: 1.5px solid rgba(239, 68, 68, 0.4);
                        box-shadow: 0 16px 36px -10px rgba(239, 68, 68, 0.25), 0 0 25px rgba(239, 68, 68, 0.1);
                        border-radius: 24px;
                        padding: 28px 30px;
                        margin-bottom: 28px;
                        color: #ffffff;
                        position: relative;
                        overflow: hidden;
                    ">
                        <!-- Brillo estético de fondo -->
                        <div style="position: absolute; top: -70px; right: -70px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none;"></div>

                        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; position: relative; z-index: 2;">
                            <div style="max-width: 760px;">
                                <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); padding: 4px 14px; border-radius: 100px; margin-bottom: 12px;">
                                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #EF4444; box-shadow: 0 0 10px #EF4444; animation: sosPulse 1.4s infinite;"></span>
                                    <span style="font-size: 0.72rem; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: #fca5a5;">Módulo Oficial de Convocatorias & Bajas</span>
                                </div>
                                <h1 style="margin: 0 0 8px 0; font-size: 1.95rem; font-weight: 950; letter-spacing: -0.5px; color: #ffffff; display: flex; align-items: center; gap: 12px;">
                                    <span>🚨 CONVOCATORIAS, SUPLENTES SOS Y MENSAJERÍA MASIVA</span>
                                </h1>
                                <p style="margin: 0; font-size: 0.95rem; color: #94a3b8; line-height: 1.5; font-weight: 450;">
                                    Herramienta para Capitanes y Super Admin: rellena entrenos masculinos y mixtos, publica alertas SOS y manda mensajes directos a todos los jugadores del club.
                                </p>
                            </div>

                            <!-- Botones Acción Principal -->
                            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                                <button id="btn-open-broadcast-modal" style="
                                    background: #CCFF00;
                                    color: #000000;
                                    border: none;
                                    padding: 13px 22px;
                                    border-radius: 14px;
                                    font-size: 0.92rem;
                                    font-weight: 950;
                                    cursor: pointer;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 10px;
                                    box-shadow: 0 8px 24px rgba(204, 255, 0, 0.4);
                                    transition: transform 0.15s ease;
                                " onmouseover="this.style.transform='scale(1.03)';" onmouseout="this.style.transform='scale(1)';">
                                    <i class="fas fa-bullhorn" style="font-size: 1.1rem;"></i>
                                    <span>ENVIAR MENSAJE A JUGADORES</span>
                                </button>

                                <button id="btn-open-create-sos-modal" style="
                                    background: linear-gradient(135deg, #EF4444 0%, #b91c1c 100%);
                                    color: #ffffff;
                                    border: none;
                                    padding: 13px 20px;
                                    border-radius: 14px;
                                    font-size: 0.92rem;
                                    font-weight: 900;
                                    cursor: pointer;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 8px;
                                    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
                                    transition: transform 0.15s ease;
                                " onmouseover="this.style.transform='scale(1.03)';" onmouseout="this.style.transform='scale(1)';">
                                    <i class="fas fa-fire"></i>
                                    <span>PUBLICAR ALERTA SOS</span>
                                </button>

                                <button id="btn-refresh-sos-data" title="Actualizar Datos en Vivo" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    color: #ffffff;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    width: 44px;
                                    height: 44px;
                                    border-radius: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    transition: background 0.15s ease;
                                " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)';">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Grid de KPIs Reales -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 14px 18px;">
                                <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Alertas SOS Activas</div>
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span style="font-size: 1.85rem; font-weight: 950; color: ${activeSosCount > 0 ? '#EF4444' : '#CCFF00'};">${activeSosCount}</span>
                                    <span style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1;">en curso</span>
                                </div>
                            </div>

                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 14px 18px;">
                                <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Entrenos con Huecos</div>
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span style="font-size: 1.85rem; font-weight: 950; color: #f59e0b;">${incompleteCount}</span>
                                    <span style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1;">requieren relleno</span>
                                </div>
                            </div>

                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 14px 18px;">
                                <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Jugadores Reales en BBDD</div>
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span style="font-size: 1.85rem; font-weight: 950; color: #38BDF8;">${playersCount}</span>
                                    <span style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1;">contactables</span>
                                </div>
                            </div>

                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 14px 18px;">
                                <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Plazas Rescatadas</div>
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span style="font-size: 1.85rem; font-weight: 950; color: #10B981;">${rescuedCount}</span>
                                    <span style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1;">éxitos reales</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ============================================================ -->
                    <!-- B. SECCIÓN: ENTRENOS Y AMERICANAS CON PLAZAS LIBRES (RELLENAR)-->
                    <!-- ============================================================ -->
                    <div style="margin-bottom: 34px;">
                        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 16px;">
                            <div>
                                <h2 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 10px;">
                                    <span style="background: #fef3c7; color: #b45309; width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem;">⚡</span>
                                    <span>Entrenos y Americanas con Plazas Libres (${this.incompleteEvents.length})</span>
                                </h2>
                                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">
                                    Selecciona un entreno masculino o mixto para mandar difusión masiva o asignar un jugador real con 1 clic.
                                </p>
                            </div>

                            <!-- Filtro de Categoría de Entreno -->
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn-evt-filter ${this.filterEventCat === 'all' ? 'active' : ''}" data-cat="all" style="
                                    background: ${this.filterEventCat === 'all' ? '#0f172a' : '#f1f5f9'};
                                    color: ${this.filterEventCat === 'all' ? '#ffffff' : '#475569'};
                                    border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 850; cursor: pointer;
                                ">Todos (${this.incompleteEvents.length})</button>

                                <button class="btn-evt-filter ${this.filterEventCat === 'male' ? 'active' : ''}" data-cat="male" style="
                                    background: ${this.filterEventCat === 'male' ? '#0284c7' : '#e0f2fe'};
                                    color: ${this.filterEventCat === 'male' ? '#ffffff' : '#0369a1'};
                                    border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 850; cursor: pointer;
                                ">👦 Masculino (${maleEventsCount})</button>

                                <button class="btn-evt-filter ${this.filterEventCat === 'mixed' ? 'active' : ''}" data-cat="mixed" style="
                                    background: ${this.filterEventCat === 'mixed' ? '#7c3aed' : '#f3e8ff'};
                                    color: ${this.filterEventCat === 'mixed' ? '#ffffff' : '#6d28d9'};
                                    border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 850; cursor: pointer;
                                ">👫 Mixto (${mixedEventsCount})</button>

                                <button class="btn-evt-filter ${this.filterEventCat === 'female' ? 'active' : ''}" data-cat="female" style="
                                    background: ${this.filterEventCat === 'female' ? '#db2777' : '#fce7f3'};
                                    color: ${this.filterEventCat === 'female' ? '#ffffff' : '#be185d'};
                                    border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 850; cursor: pointer;
                                ">👧 Femenino (${femEventsCount})</button>
                            </div>
                        </div>

                        ${filteredEvents.length === 0 ? `
                            <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 20px; padding: 36px 20px; text-align: center; color: #64748b;">
                                <div style="font-size: 2.2rem; margin-bottom: 8px;">🎾✅</div>
                                <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; font-weight: 850; color: #0f172a;">No hay entrenos incompletos con este filtro</h3>
                                <p style="margin: 0; font-size: 0.85rem; color: #64748b;">Todos los entrenos seleccionados tienen sus plazas cubiertas o no hay convocatorias activas.</p>
                            </div>
                        ` : `
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px;">
                                ${filteredEvents.map(evt => this._renderIncompleteEventCard(evt)).join('')}
                            </div>
                        `}
                    </div>

                    <!-- ============================================================ -->
                    <!-- C. SECCIÓN: ALERTAS SOS ACTIVAS EN VIVO (URGENCIAS REALES)    -->
                    <!-- ============================================================ -->
                    <div style="margin-bottom: 34px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div>
                                <h2 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-triangle-exclamation" style="color: #EF4444;"></i>
                                    <span>Llamadas de Emergencia SOS Activas (${this.activeAlerts.length})</span>
                                </h2>
                                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">Alertas publicadas activas en la App de los jugadores esperando suplente.</p>
                            </div>
                            ${this.activeAlerts.length > 0 ? `
                                <span style="background: rgba(239, 68, 68, 0.12); color: #b91c1c; font-size: 0.75rem; font-weight: 850; padding: 4px 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.25);">
                                    ⚡ En Radar de Jugadores
                                </span>
                            ` : ''}
                        </div>

                        ${this.activeAlerts.length === 0 ? `
                            <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 20px; padding: 32px 20px; text-align: center; color: #64748b;">
                                <div style="font-size: 2.2rem; margin-bottom: 8px;">🎾🟢</div>
                                <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; font-weight: 850; color: #0f172a;">Sin alertas SOS urgentes activas</h3>
                                <p style="margin: 0 auto; max-width: 480px; font-size: 0.85rem; color: #64748b;">
                                    No hay incidencias abiertas en este instante. Si surge una baja imprevista, pulsa "Publicar Alerta SOS" o envía un mensaje masivo a los jugadores.
                                </p>
                            </div>
                        ` : `
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px;">
                                ${this.activeAlerts.map(alert => this._renderAlertCard(alert)).join('')}
                            </div>
                        `}
                    </div>

                    <!-- ============================================================ -->
                    <!-- D. SECCIÓN: DIRECTORIO DE JUGADORES REALES & BOLSA DE GUARDIA -->
                    <!-- ============================================================ -->
                    <div style="
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 22px;
                        padding: 24px;
                        margin-bottom: 34px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
                    ">
                        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 20px;">
                            <div>
                                <h2 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-users" style="color: #0284c7;"></i>
                                    <span>Directorio de Jugadores Reales (${this.realPlayers.length}) & Contacto Rápido</span>
                                </h2>
                                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">
                                    Filtra por chicos, chicas o lado para enviar WhatsApp personalizado o convocar directamente a pista.
                                </p>
                            </div>

                            <!-- Filtros y Buscador de Jugadores -->
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                                <!-- Filtro Género -->
                                <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                    <button class="btn-player-gender ${this.filterGender === 'all' ? 'active' : ''}" data-gender="all" style="
                                        background: ${this.filterGender === 'all' ? '#ffffff' : 'transparent'};
                                        border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 850;
                                        color: ${this.filterGender === 'all' ? '#0f172a' : '#64748b'}; cursor: pointer;
                                    ">Todos</button>
                                    <button class="btn-player-gender ${this.filterGender === 'chico' ? 'active' : ''}" data-gender="chico" style="
                                        background: ${this.filterGender === 'chico' ? '#ffffff' : 'transparent'};
                                        border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 850;
                                        color: ${this.filterGender === 'chico' ? '#0284c7' : '#64748b'}; cursor: pointer;
                                    ">👦 Chicos</button>
                                    <button class="btn-player-gender ${this.filterGender === 'chica' ? 'active' : ''}" data-gender="chica" style="
                                        background: ${this.filterGender === 'chica' ? '#ffffff' : 'transparent'};
                                        border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 850;
                                        color: ${this.filterGender === 'chica' ? '#db2777' : '#64748b'}; cursor: pointer;
                                    ">👧 Chicas</button>
                                </div>

                                <!-- Filtro Lado -->
                                <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                    <button class="btn-player-side ${this.filterSide === 'all' ? 'active' : ''}" data-side="all" style="
                                        background: ${this.filterSide === 'all' ? '#ffffff' : 'transparent'};
                                        border: none; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 850;
                                        color: ${this.filterSide === 'all' ? '#0f172a' : '#64748b'}; cursor: pointer;
                                    ">Lado: Todos</button>
                                    <button class="btn-player-side ${this.filterSide === 'drive' ? 'active' : ''}" data-side="drive" style="
                                        background: ${this.filterSide === 'drive' ? '#ffffff' : 'transparent'};
                                        border: none; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 850;
                                        color: ${this.filterSide === 'drive' ? '#0f172a' : '#64748b'}; cursor: pointer;
                                    ">Drive</button>
                                    <button class="btn-player-side ${this.filterSide === 'reves' ? 'active' : ''}" data-side="reves" style="
                                        background: ${this.filterSide === 'reves' ? '#ffffff' : 'transparent'};
                                        border: none; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 850;
                                        color: ${this.filterSide === 'reves' ? '#0f172a' : '#64748b'}; cursor: pointer;
                                    ">Revés</button>
                                </div>

                                <!-- Buscador -->
                                <div style="position: relative;">
                                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
                                    <input type="text" id="admin-sos-search-input" placeholder="Buscar jugador o teléfono..." value="${this.searchQuery}" style="
                                        height: 38px; padding: 6px 12px 6px 34px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.85rem; min-width: 220px;
                                    ">
                                </div>
                            </div>
                        </div>

                        <!-- Tabla de Jugadores Reales -->
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.9rem;">
                                <thead>
                                    <tr style="background: #f8fafc; color: #475569; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.6px;">
                                        <th style="padding: 12px 16px; text-align: left; border-top-left-radius: 12px; border-bottom: 1px solid #e2e8f0;">Jugador Real</th>
                                        <th style="padding: 12px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">Género</th>
                                        <th style="padding: 12px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">Nivel</th>
                                        <th style="padding: 12px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">Lado</th>
                                        <th style="padding: 12px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">Estado</th>
                                        <th style="padding: 12px 16px; text-align: right; border-top-right-radius: 12px; border-bottom: 1px solid #e2e8f0;">Acciones de Convocatoria</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredPlayers.length === 0 ? `
                                        <tr>
                                            <td colspan="6" style="padding: 32px; text-align: center; color: #94a3b8;">
                                                No se encontraron jugadores con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ` : filteredPlayers.slice(0, 50).map(player => this._renderPlayerRow(player)).join('')}
                                </tbody>
                            </table>
                            ${filteredPlayers.length > 50 ? `
                                <div style="padding: 12px; text-align: center; font-size: 0.8rem; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                                    Mostrando los primeros 50 jugadores de ${filteredPlayers.length}. Usa el buscador para afinar.
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- ============================================================ -->
                    <!-- E. SECCIÓN: HISTORIAL DE RESCATES REALES                      -->
                    <!-- ============================================================ -->
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 22px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
                        <h2 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-clock-rotate-left" style="color: #10b981;"></i>
                            <span>Historial de Rescates & Plazas SOS Cubiertas</span>
                        </h2>

                        ${this.rescuesHistory.length === 0 ? `
                            <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                                No se registran rescates cerrados todavía. Cuando un jugador cubra una plaza SOS, aparecerá registrado aquí.
                            </div>
                        ` : `
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;">
                                ${this.rescuesHistory.slice(0, 6).map(item => `
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                                        <div>
                                            <div style="font-size: 0.88rem; font-weight: 850; color: #0f172a;">${this._escapeHtml(item.eventName || 'Evento')}</div>
                                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                                                ${item.date || 'Reciente'} ${item.time ? '• ' + item.time : ''} • ${this._escapeHtml(item.court || 'Pista')}
                                            </div>
                                            <div style="font-size: 0.8rem; font-weight: 750; color: #0284c7; margin-top: 4px;">
                                                👤 Rescatado por: <strong>${this._escapeHtml(item.assignedPlayer?.name || 'Jugador')}</strong>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <span style="background: rgba(16, 185, 129, 0.15); color: #047857; font-weight: 950; font-size: 0.72rem; padding: 4px 8px; border-radius: 6px;">
                                                +${item.bonusXp || 150} XP
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <!-- MODALES ROOT -->
                <div id="admin-sos-modal-root"></div>
            `;
        }

        /**
         * Renderiza la tarjeta de un entreno o americana que necesita jugadores
         */
        _renderIncompleteEventCard(evt) {
            const isMale = evt.category === 'male';
            const isMixed = evt.category === 'mixed';
            const isFemale = evt.category === 'female';

            let catBadge = `<span style="background:#e2e8f0; color:#475569; padding:3px 8px; border-radius:6px; font-size:0.7rem; font-weight:850;">OPEN / TODOS</span>`;
            if (isMale) {
                catBadge = `<span style="background:rgba(2,132,199,0.15); color:#0284c7; border:1px solid rgba(2,132,199,0.3); padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:900;">👦 MASCULINO</span>`;
            } else if (isMixed) {
                catBadge = `<span style="background:rgba(124,58,237,0.15); color:#7c3aed; border:1px solid rgba(124,58,237,0.3); padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:900;">👫 MIXTO</span>`;
            } else if (isFemale) {
                catBadge = `<span style="background:rgba(219,39,119,0.15); color:#db2777; border:1px solid rgba(219,39,119,0.3); padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:900;">👧 FEMENINO</span>`;
            }

            const typeLabel = evt.type === 'entreno' ? 'ENTRENO' : 'AMERICANA';

            return `
                <div class="incomplete-event-card" style="
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 18px;
                    padding: 18px;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.04);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                ">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="background: #0f172a; color: #fff; font-size: 0.68rem; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${typeLabel}</span>
                                ${catBadge}
                            </div>
                            <span style="background: #fee2e2; color: #dc2626; font-size: 0.72rem; font-weight: 950; padding: 3px 8px; border-radius: 8px; border: 1px solid #fca5a5;">
                                ¡FALTA ${evt.freeSlots} ${evt.freeSlots === 1 ? 'PLAZA' : 'PLAZAS'}!
                            </span>
                        </div>

                        <h3 style="margin: 0 0 8px 0; font-size: 1.05rem; font-weight: 900; color: #0f172a; line-height: 1.3;">
                            ${this._escapeHtml(evt.name)}
                        </h3>

                        <!-- Info Detallada -->
                        <div style="background: #f8fafc; border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; font-size: 0.8rem; line-height: 1.6; color: #334155;">
                            <div><i class="far fa-calendar" style="width:16px; color:#64748b;"></i> <strong>Fecha:</strong> ${this._formatShortDate(evt.date)} • ${evt.time}h</div>
                            <div><i class="fas fa-table-tennis-paddle-ball" style="width:16px; color:#64748b;"></i> <strong>Pista:</strong> ${this._escapeHtml(evt.court)}</div>
                            <div><i class="fas fa-chart-line" style="width:16px; color:#64748b;"></i> <strong>Nivel:</strong> ${evt.levelMin.toFixed(2)} - ${evt.levelMax.toFixed(2)}</div>
                            <div><i class="fas fa-users" style="width:16px; color:#64748b;"></i> <strong>Inscritos:</strong> <span style="font-weight: 850; color: #0f172a;">${evt.currentPlayers}</span> / ${evt.maxPlayers}</div>
                        </div>
                    </div>

                    <!-- Botones de Acción Rápida -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn-broadcast-for-event" data-event-id="${evt.id}" data-event-type="${evt.type}" data-event-name="${this._escapeHtml(evt.name)}" data-category="${evt.category}" data-date="${evt.date}" data-time="${evt.time}" data-court="${this._escapeHtml(evt.court)}" data-level-min="${evt.levelMin}" data-level-max="${evt.levelMax}" data-free-slots="${evt.freeSlots}" style="
                            background: #0f172a;
                            color: #CCFF00;
                            border: 1px solid rgba(204, 255, 0, 0.4);
                            padding: 9px 12px;
                            border-radius: 10px;
                            font-size: 0.82rem;
                            font-weight: 900;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.15s ease;
                        " onmouseover="this.style.background='#1e293b';" onmouseout="this.style.background='#0f172a';">
                            <i class="fas fa-bullhorn"></i>
                            <span>Difundir Mensaje a ${isMale ? 'Chicos' : (isMixed ? 'Mixtos' : 'Jugadores')}</span>
                        </button>

                        <div style="display: flex; gap: 8px;">
                            <button class="btn-assign-player-to-event" data-event-id="${evt.id}" data-event-type="${evt.type}" data-event-name="${this._escapeHtml(evt.name)}" style="
                                flex: 1;
                                background: #f1f5f9;
                                color: #0f172a;
                                border: 1px solid #cbd5e1;
                                padding: 8px 10px;
                                border-radius: 8px;
                                font-size: 0.78rem;
                                font-weight: 850;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            " onmouseover="this.style.background='#e2e8f0';" onmouseout="this.style.background='#f1f5f9';">
                                <i class="fas fa-user-plus" style="color: #0284c7;"></i>
                                <span>Asignar Jugador</span>
                            </button>

                            <button class="btn-create-sos-for-event" data-event-id="${evt.id}" data-event-type="${evt.type}" data-event-name="${this._escapeHtml(evt.name)}" data-date="${evt.date}" data-time="${evt.time}" data-court="${this._escapeHtml(evt.court)}" data-level-min="${evt.levelMin}" data-level-max="${evt.levelMax}" title="Lanzar Alerta SOS Urgente (+150 XP)" style="
                                background: rgba(239, 68, 68, 0.1);
                                color: #b91c1c;
                                border: 1px solid rgba(239, 68, 68, 0.25);
                                padding: 8px 12px;
                                border-radius: 8px;
                                font-size: 0.78rem;
                                font-weight: 850;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)';">
                                <i class="fas fa-fire"></i>
                                <span>SOS +150 XP</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza una fila de jugador real en la tabla
         */
        _renderPlayerRow(player) {
            const side = this._formatSide(player.side);
            const levelVal = player.level.toFixed(2);
            const phone = player.phone.replace(/[^0-9]/g, '');
            const isMale = player.gender === 'chico';

            // Mensaje proactivo de WhatsApp para convocar
            const firstName = player.name.split(' ')[0];
            const waText = encodeURIComponent(
                `¡Hola ${firstName}! 🎾 Te contactamos de SomosPádel BCN. Tenemos un hueco disponible en pista para entreno/partido de tu nivel (${levelVal}). ¿Te apetece jugar? ¡Confírmanos por aquí o reserva tu plaza en la App! 🏆`
            );

            let waHref = '#';
            let waClick = '';
            if (phone) {
                const fullPhone = phone.startsWith('34') ? phone : `34${phone}`;
                waHref = `https://wa.me/${fullPhone}?text=${waText}`;
            } else {
                waClick = `alert('⚠️ El jugador ${this._escapeHtml(player.name)} no tiene teléfono registrado.'); return false;`;
            }

            return `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='transparent';">
                    <td style="padding: 12px 16px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="
                                width: 36px;
                                height: 36px;
                                border-radius: 50%;
                                background: ${isMale ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'};
                                color: #ffffff;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 900;
                                font-size: 0.85rem;
                            ">
                                ${this._getInitials(player.name)}
                            </div>
                            <div>
                                <div style="font-weight: 850; color: #0f172a;">${this._escapeHtml(player.name)}</div>
                                <div style="font-size: 0.75rem; color: #64748b;">${phone ? '+' + phone : 'Sin teléfono'}</div>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <span style="background: ${isMale ? 'rgba(2,132,199,0.1)' : 'rgba(219,39,119,0.1)'}; color: ${isMale ? '#0369a1' : '#be185d'}; font-weight: 900; font-size: 0.72rem; padding: 3px 8px; border-radius: 6px;">
                            ${isMale ? '👦 CHICO' : '👧 CHICA'}
                        </span>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <span style="background: #e0f2fe; color: #0369a1; font-weight: 900; font-size: 0.8rem; padding: 4px 8px; border-radius: 8px;">
                            ${levelVal}
                        </span>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <span style="font-weight: 750; color: #475569;">${side}</span>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        ${player.isAvailableToday ? `
                            <span style="background: rgba(16, 185, 129, 0.15); color: #047857; font-weight: 850; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                                Guardia Hoy
                            </span>
                        ` : `
                            <span style="color: #94a3b8; font-size: 0.75rem; font-weight: 600;">Comunidad</span>
                        `}
                    </td>
                    <td style="padding: 12px 16px; text-align: right;">
                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                            <a href="${waHref}" target="_blank" rel="noopener noreferrer" onclick="${waClick}" style="
                                background: #25D366;
                                color: #ffffff;
                                text-decoration: none;
                                padding: 7px 12px;
                                border-radius: 8px;
                                font-size: 0.78rem;
                                font-weight: 850;
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);
                            ">
                                <i class="fab fa-whatsapp"></i>
                                <span>WhatsApp</span>
                            </a>

                            <button class="btn-assign-direct-player" data-player-id="${player.id}" data-player-name="${this._escapeHtml(player.name)}" title="Inscribir en un entreno" style="
                                background: #0f172a;
                                color: #ffffff;
                                border: none;
                                padding: 7px 10px;
                                border-radius: 8px;
                                font-size: 0.78rem;
                                font-weight: 850;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                            ">
                                <i class="fas fa-plus"></i>
                                <span>Convocar</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        /**
         * Renderiza una tarjeta de alerta SOS activa
         */
        _renderAlertCard(alert) {
            const sideLabel = this._formatSide(alert.sideNeeded);
            const levelRange = (alert.levelMin && alert.levelMax)
                ? `${parseFloat(alert.levelMin).toFixed(2)} - ${parseFloat(alert.levelMax).toFixed(2)}`
                : 'Cualquiera';

            const candidates = Array.isArray(alert.candidates) ? alert.candidates : [];

            return `
                <div class="admin-sos-card" data-alert-id="${alert.id}" style="
                    background: #ffffff;
                    border: 1.5px solid #fecaca;
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.08);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                ">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
                            <div style="display: inline-flex; align-items: center; gap: 6px; background: #fee2e2; color: #991b1b; padding: 3px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 900;">
                                <i class="fas fa-fire"></i>
                                <span>${alert.eventType === 'entrenos' ? 'ENTRENO' : 'AMERICANA'}</span>
                            </div>
                            <span style="background: rgba(204, 255, 0, 0.25); color: #3f6212; border: 1px solid rgba(204, 255, 0, 0.6); font-size: 0.72rem; font-weight: 950; padding: 3px 8px; border-radius: 8px;">
                                +${alert.bonusXp || 150} XP
                            </span>
                        </div>

                        <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 900; color: #0f172a; line-height: 1.3;">
                            ${this._escapeHtml(alert.eventName || 'Evento')}
                        </h3>

                        <div style="background: #f8fafc; border-radius: 12px; padding: 12px; margin: 12px 0; font-size: 0.82rem; line-height: 1.6; color: #334155;">
                            <div><i class="far fa-clock" style="color: #64748b; width: 16px;"></i> <strong>Hora:</strong> ${this._formatShortDate(alert.date)} • ${alert.time || '19:30'}h</div>
                            <div><i class="fas fa-table-tennis-paddle-ball" style="color: #64748b; width: 16px;"></i> <strong>Pista:</strong> ${this._escapeHtml(alert.court || 'Pistas Centrales')}</div>
                            <div><i class="fas fa-chart-line" style="color: #64748b; width: 16px;"></i> <strong>Nivel:</strong> ${levelRange}</div>
                            <div><i class="fas fa-arrows-left-right" style="color: #64748b; width: 16px;"></i> <strong>Lado:</strong> <span style="font-weight: 800; color: #b91c1c;">${sideLabel}</span></div>
                        </div>

                        <!-- Postulaciones -->
                        <div style="margin-bottom: 14px;">
                            <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                                Candidatos Postulados (${candidates.length})
                            </div>
                            ${candidates.length === 0 ? `
                                <div style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">
                                    Ningún jugador postulado todavía. Puedes asignar un suplente manual.
                                </div>
                            ` : `
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    ${candidates.map(cand => `
                                        <div style="display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem;">
                                            <span style="font-weight: 750; color: #0f172a;">${this._escapeHtml(cand.name)}</span>
                                            <button class="btn-confirm-assign-candidate" data-alert-id="${alert.id}" data-uid="${cand.uid || cand.id}" style="background: #0f172a; color: #fff; border: none; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 0.72rem; cursor: pointer;">
                                                Aceptar
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="btn-assign-sub-manual" data-alert-id="${alert.id}" style="
                            flex: 1;
                            background: #0f172a;
                            color: #ffffff;
                            border: none;
                            padding: 10px 14px;
                            border-radius: 10px;
                            font-size: 0.82rem;
                            font-weight: 850;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        ">
                            <i class="fas fa-user-check"></i>
                            <span>Asignar Jugador Real</span>
                        </button>

                        <button class="btn-cancel-alert" data-alert-id="${alert.id}" title="Cancelar Alerta" style="
                            background: #fee2e2;
                            color: #991b1b;
                            border: 1px solid #fecaca;
                            width: 38px;
                            height: 38px;
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                        ">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Configura los eventos e interactividad del panel
         */
        _setupListeners() {
            // 1. Botón Abrir Modal de Difusión / Mensajería
            const btnBroadcast = document.getElementById('btn-open-broadcast-modal');
            if (btnBroadcast) {
                btnBroadcast.onclick = () => this.openBroadcastModal();
            }

            // 2. Botón Crear Alerta SOS
            const btnCreateSos = document.getElementById('btn-open-create-sos-modal');
            if (btnCreateSos) {
                btnCreateSos.onclick = () => this.openCreateAlertModal();
            }

            // 3. Botón Refrescar Datos en Vivo
            const btnRefresh = document.getElementById('btn-refresh-sos-data');
            if (btnRefresh) {
                btnRefresh.onclick = () => this.render();
            }

            // 4. Filtros de Categoría de Entrenos
            this.container.querySelectorAll('.btn-evt-filter').forEach(btn => {
                btn.onclick = (e) => {
                    this.filterEventCat = e.currentTarget.getAttribute('data-cat') || 'all';
                    this._renderDashboard();
                    this._setupListeners();
                };
            });

            // 5. Botones "Difundir Mensaje" desde tarjeta de entreno
            this.container.querySelectorAll('.btn-broadcast-for-event').forEach(btn => {
                btn.onclick = (e) => {
                    const ds = e.currentTarget.dataset;
                    this.openBroadcastModal({
                        eventId: ds.eventId,
                        eventType: ds.eventType,
                        eventName: ds.eventName,
                        category: ds.category,
                        date: ds.date,
                        time: ds.time,
                        court: ds.court,
                        levelMin: ds.levelMin,
                        levelMax: ds.levelMax,
                        freeSlots: ds.freeSlots
                    });
                };
            });

            // 6. Botones "Asignar Jugador" a un entreno
            this.container.querySelectorAll('.btn-assign-player-to-event').forEach(btn => {
                btn.onclick = (e) => {
                    const ds = e.currentTarget.dataset;
                    this.openAssignPlayerToEventModal(ds.eventId, ds.eventType, ds.eventName);
                };
            });

            // 7. Botones "Lanzar Alerta SOS" para un entreno
            this.container.querySelectorAll('.btn-create-sos-for-event').forEach(btn => {
                btn.onclick = (e) => {
                    const ds = e.currentTarget.dataset;
                    this.openCreateAlertModal({
                        eventId: ds.eventId,
                        eventType: ds.eventType,
                        eventName: ds.eventName,
                        date: ds.date,
                        time: ds.time,
                        court: ds.court,
                        levelMin: ds.levelMin,
                        levelMax: ds.levelMax
                    });
                };
            });

            // 8. Filtros de Jugadores (Género)
            this.container.querySelectorAll('.btn-player-gender').forEach(btn => {
                btn.onclick = (e) => {
                    this.filterGender = e.currentTarget.getAttribute('data-gender') || 'all';
                    this._renderDashboard();
                    this._setupListeners();
                };
            });

            // 9. Filtros de Jugadores (Lado)
            this.container.querySelectorAll('.btn-player-side').forEach(btn => {
                btn.onclick = (e) => {
                    this.filterSide = e.currentTarget.getAttribute('data-side') || 'all';
                    this._renderDashboard();
                    this._setupListeners();
                };
            });

            // 10. Buscador de Jugadores en Vivo
            const searchInput = document.getElementById('admin-sos-search-input');
            if (searchInput) {
                searchInput.oninput = (e) => {
                    this.searchQuery = e.target.value.toLowerCase().trim();
                    this._renderDashboard();
                    this._setupListeners();
                    const ref = document.getElementById('admin-sos-search-input');
                    if (ref) {
                        ref.focus();
                        ref.setSelectionRange(ref.value.length, ref.value.length);
                    }
                };
            }

            // 11. Botón "Convocar" directo desde la fila de jugador
            this.container.querySelectorAll('.btn-assign-direct-player').forEach(btn => {
                btn.onclick = (e) => {
                    const pid = e.currentTarget.getAttribute('data-player-id');
                    this.openDirectPlayerConvocarModal(pid);
                };
            });

            // 12. Asignar Suplente Manual a Alerta SOS
            this.container.querySelectorAll('.btn-assign-sub-manual').forEach(btn => {
                btn.onclick = (e) => {
                    const alertId = e.currentTarget.getAttribute('data-alert-id');
                    this.openAssignPlayerToAlertModal(alertId);
                };
            });

            // 13. Cancelar Alerta SOS
            this.container.querySelectorAll('.btn-cancel-alert').forEach(btn => {
                btn.onclick = async (e) => {
                    const alertId = e.currentTarget.getAttribute('data-alert-id');
                    if (confirm("¿Estás seguro de cancelar esta alerta SOS? Se retirará de la App.")) {
                        await this._cancelAlert(alertId);
                    }
                };
            });

            // 14. Aceptar candidato postulado
            this.container.querySelectorAll('.btn-confirm-assign-candidate').forEach(btn => {
                btn.onclick = async (e) => {
                    const alertId = e.currentTarget.getAttribute('data-alert-id');
                    const uid = e.currentTarget.getAttribute('data-uid');
                    const targetSub = this.realPlayers.find(p => (p.id || p.uid) === uid);
                    if (targetSub) {
                        await this._assignPlayerToAlert(alertId, targetSub);
                    }
                };
            });
        }

        // =========================================================================
        // MODAL 1: 📢 DIFUSIÓN Y MENSAJES A TODOS LOS JUGADORES (HERRAMIENTA CLAVE)
        // =========================================================================

        /**
         * Abre el modal interactivo de emisión de mensajes a jugadores
         * Con selector de entrenos, filtros por género (masculino/mixto), nivel, WhatsApp y Push
         */
        openBroadcastModal(prefill = null) {
            const modalRoot = document.getElementById('admin-sos-modal-root');
            if (!modalRoot) return;

            // Determinar audiencia predeterminada según el evento
            let defaultAudience = 'all';
            let defaultLevelMin = 1.0;
            let defaultLevelMax = 7.0;

            if (prefill) {
                if (prefill.category === 'male') defaultAudience = 'male';
                else if (prefill.category === 'mixed') defaultAudience = 'mixed';
                else if (prefill.category === 'female') defaultAudience = 'female';

                if (prefill.levelMin) defaultLevelMin = parseFloat(prefill.levelMin);
                if (prefill.levelMax) defaultLevelMax = parseFloat(prefill.levelMax);
            }

            // Generar plantilla de texto dinámica y contextualizada
            const getTemplateText = (aud, evt) => {
                if (evt) {
                    const slots = parseInt(evt.freeSlots || evt.free || evt.free_slots || 1, 10);
                    const catRaw = String(evt.category || evt.cat || aud || 'all').toLowerCase();
                    let catName = 'DE PÁDEL';
                    if (catRaw.includes('masc') || catRaw === 'male' || catRaw === 'chicos') catName = 'MASCULINO';
                    else if (catRaw.includes('mixt') || catRaw === 'mixed') catName = 'MIXTO';
                    else if (catRaw.includes('fem') || catRaw === 'female' || catRaw === 'chicas') catName = 'FEMENINO';

                    const isAmericana = evt.type === 'americana' || (evt.name && String(evt.name).toUpperCase().includes('AMERICANA'));
                    const typeName = isAmericana ? 'la Americana' : 'el Entreno';
                    const courtName = evt.court || evt.pista || evt.location || evt.club || evt.sede || 'Pistas Centrales';
                    const timeStr = evt.time || '19:30';
                    const dateStr = evt.date || '';
                    const datePhrase = this._formatFriendlyDatePhrase(dateStr, timeStr);
                    const lMin = parseFloat(evt.levelMin || evt.lmin || defaultLevelMin || 1.0);
                    const lMax = parseFloat(evt.levelMax || evt.lmax || defaultLevelMax || 7.0);

                    return {
                        title: `⚡ ¡Hueco urgente en ${typeName} ${catName}!`,
                        body: `¡Hola padeleros! Tenemos ${slots} ${slots === 1 ? 'plaza libre' : 'plazas libres'} para ${typeName} ${catName} ${datePhrase} (en ${courtName}). Nivel: ${lMin.toFixed(2)} - ${lMax.toFixed(2)}. ¡Inscríbete ya en la App antes de que vuele!`
                    };
                }
                if (aud === 'male') {
                    return {
                        title: `🎾 Plaza disponible en Entreno Masculino`,
                        body: `¡Atención chicos! Tenemos plazas disponibles para completar entreno masculino esta semana. Revisa la sección Entrenos en la App y únete.`
                    };
                }
                if (aud === 'mixed') {
                    return {
                        title: `👫 Convocatoria Entreno Mixto SomosPadel`,
                        body: `Buscamos jugadores y jugadoras para completar las pistas del entreno mixto. ¡Ven a entrenar y disfrutar de un gran ambiente!`
                    };
                }
                return {
                    title: `📢 Convocatoria Abierta SomosPadel BCN`,
                    body: `Nuevas plazas abiertas para entrenos y torneos de esta semana. ¡Reserva tu plaza desde la App oficial!`
                };
            };

            const initialTmpl = getTemplateText(defaultAudience, prefill);

            // Asegurar que si prefill existe, esté en la lista y seleccionado
            const eventsOptions = [...this.incompleteEvents];
            if (prefill && prefill.eventId && !eventsOptions.some(e => String(e.id) === String(prefill.eventId))) {
                eventsOptions.unshift({
                    id: prefill.eventId,
                    type: prefill.eventType || 'entreno',
                    name: prefill.eventName || 'Entreno',
                    category: prefill.category || 'male',
                    date: prefill.date || 'Hoy',
                    time: prefill.time || '19:30',
                    court: prefill.court || 'Pistas Centrales',
                    levelMin: parseFloat(prefill.levelMin || 3.0),
                    levelMax: parseFloat(prefill.levelMax || 4.5),
                    freeSlots: parseInt(prefill.freeSlots || 1, 10)
                });
            }

            modalRoot.innerHTML = `
                <div id="sos-broadcast-overlay" style="
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
                    z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
                ">
                    <div style="
                        background: #ffffff; border-radius: 24px; max-width: 720px; width: 100%;
                        max-height: 92vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                        border: 1px solid #cbd5e1; font-family: 'Outfit', 'Inter', sans-serif; color: #0f172a;
                    ">
                        <!-- Cabecera -->
                        <div style="background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%); padding: 22px 26px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(204, 255, 0, 0.15); display: flex; align-items: center; justify-content: center; color: #CCFF00; font-size: 1.25rem;">
                                    <i class="fas fa-bullhorn"></i>
                                </div>
                                <div>
                                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 950; color: #ffffff;">MANDAR MENSAJE A JUGADORES</h3>
                                    <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #94a3b8;">Herramienta para Capitanes y Admin: rellenar entrenos mixtos y masculinos</p>
                                </div>
                            </div>
                            <button id="btn-close-broadcast-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">&times;</button>
                        </div>

                        <!-- Formulario de Envío -->
                        <form id="form-sos-broadcast" style="padding: 24px; display: flex; flex-direction: column; gap: 18px;">
                            <!-- Paso 1: Seleccionar Entreno a rellenar -->
                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                    1. Entreno / Convocatoria a Rellenar
                                </label>
                                <select id="broadcast-event-select" class="pro-input" style="width: 100%; height: 44px; border-radius: 12px; border: 1.5px solid #cbd5e1; padding: 0 12px; font-weight: 700; font-size: 0.88rem;">
                                    <option value="none">-- Mensaje General / Sin vincular a un entreno específico --</option>
                                    ${eventsOptions.map(evt => `
                                        <option value="${evt.id}" data-type="${evt.type}" data-name="${this._escapeHtml(evt.name)}" data-cat="${evt.category}" data-date="${evt.date}" data-time="${evt.time}" data-court="${this._escapeHtml(evt.court)}" data-lmin="${evt.levelMin}" data-lmax="${evt.levelMax}" data-free="${evt.freeSlots}" ${prefill && String(prefill.eventId) === String(evt.id) ? 'selected' : ''}>
                                            [${(evt.category || 'OPEN').toUpperCase()}] ${evt.name} • ${this._formatShortDate(evt.date)} ${evt.time}h (${evt.freeSlots} plazas libres)
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <!-- Paso 2: Selección de Audiencia / Destinatarios -->
                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                                    2. ¿A quién enviar el mensaje? (Filtro de Destinatarios)
                                </label>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
                                    <label style="border: 1.5px solid ${defaultAudience === 'all' ? '#0f172a' : '#e2e8f0'}; background: ${defaultAudience === 'all' ? '#f8fafc' : '#fff'}; border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.82rem;">
                                        <input type="radio" name="targetAudience" value="all" ${defaultAudience === 'all' ? 'checked' : ''} style="accent-color: #0f172a;">
                                        <span>🎾 Todos</span>
                                    </label>

                                    <label style="border: 1.5px solid ${defaultAudience === 'male' ? '#0284c7' : '#e2e8f0'}; background: ${defaultAudience === 'male' ? '#f0f9ff' : '#fff'}; border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.82rem;">
                                        <input type="radio" name="targetAudience" value="male" ${defaultAudience === 'male' ? 'checked' : ''} style="accent-color: #0284c7;">
                                        <span style="color: #0369a1;">👦 Solo Chicos</span>
                                    </label>

                                    <label style="border: 1.5px solid ${defaultAudience === 'mixed' ? '#7c3aed' : '#e2e8f0'}; background: ${defaultAudience === 'mixed' ? '#faf5ff' : '#fff'}; border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.82rem;">
                                        <input type="radio" name="targetAudience" value="mixed" ${defaultAudience === 'mixed' ? 'checked' : ''} style="accent-color: #7c3aed;">
                                        <span style="color: #6d28d9;">👫 Mixtos</span>
                                    </label>

                                    <label style="border: 1.5px solid ${defaultAudience === 'female' ? '#db2777' : '#e2e8f0'}; background: ${defaultAudience === 'female' ? '#fdf2f8' : '#fff'}; border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.82rem;">
                                        <input type="radio" name="targetAudience" value="female" ${defaultAudience === 'female' ? 'checked' : ''} style="accent-color: #db2777;">
                                        <span style="color: #be185d;">👧 Solo Chicas</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Filtro de Rango de Nivel -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 4px;">Nivel Mínimo</label>
                                    <input type="number" step="0.25" id="broadcast-level-min" value="${defaultLevelMin}" class="pro-input" style="width: 100%; height: 38px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 10px; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 4px;">Nivel Máximo</label>
                                    <input type="number" step="0.25" id="broadcast-level-max" value="${defaultLevelMax}" class="pro-input" style="width: 100%; height: 38px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 10px; font-weight: 700;">
                                </div>
                            </div>

                            <!-- Contador de Jugadores Destinatarios en Vivo -->
                            <div id="broadcast-audience-counter-badge" style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 12px; padding: 10px 14px; font-size: 0.82rem; color: #0369a1; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-user-group" style="font-size: 1.1rem;"></i>
                                <span>Calculando audiencia de jugadores reales...</span>
                            </div>

                            <!-- Selector de Plantillas Rápidas (Clima, Journal, Noticia del Día) -->
                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                    ⚡ Plantillas Rápidas (1 Clic)
                                </label>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    <button type="button" class="btn-quick-tpl" data-tpl="clima" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 850; cursor: pointer; transition: transform 0.1s ease;">
                                        🌤️ Tiempo & Clima de Pistas
                                    </button>
                                    <button type="button" class="btn-quick-tpl" data-tpl="journal_bajada" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 850; cursor: pointer; transition: transform 0.1s ease;">
                                        📰 Journal: Bajada de Pared
                                    </button>
                                    <button type="button" class="btn-quick-tpl" data-tpl="journal_material" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 850; cursor: pointer; transition: transform 0.1s ease;">
                                        🎾 Journal: Material & Pelotas
                                    </button>
                                    <button type="button" class="btn-quick-tpl" data-tpl="noticia_dia" style="background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 850; cursor: pointer; transition: transform 0.1s ease;">
                                        🔥 Noticia Relevante del Día
                                    </button>
                                    <button type="button" class="btn-quick-tpl" data-tpl="convocatoria" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 7px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 850; cursor: pointer; transition: transform 0.1s ease;">
                                        📢 Convocatoria General
                                    </button>
                                </div>
                            </div>

                            <!-- Paso 3: Mensaje -->
                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                    3. Título del Mensaje / Notificación
                                </label>
                                <input type="text" id="broadcast-title-input" required value="${this._escapeHtml(initialTmpl.title)}" class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px; font-weight: 700; font-size: 0.9rem;">
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                    Cuerpo del Mensaje (Push, Notificaciones y WhatsApp)
                                </label>
                                <textarea id="broadcast-body-input" rows="7" required class="pro-input" style="width: 100%; border-radius: 10px; border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 0.9rem; line-height: 1.4; resize: vertical; min-height: 140px; color: #0f172a; background: #ffffff; font-family: 'Outfit', 'Inter', sans-serif;">${this._escapeHtml(initialTmpl.body)}</textarea>
                            </div>

                            <!-- Opciones Adicionales de Envío -->
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <p style="margin: 0 0 4px 0; font-size: 0.75rem; font-weight: 850; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">4. Opciones de Envío</p>

                                <label for="check-send-push" style="display: flex; align-items: center; gap: 14px; background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 12px 14px; cursor: pointer;">
                                    <input type="checkbox" id="check-send-push" checked style="width: 18px; height: 18px; min-width: 18px; accent-color: #0284c7; cursor: pointer;">
                                    <div>
                                        <div style="font-size: 0.88rem; font-weight: 800; color: #0369a1;">📱 Notificación Push + In-App</div>
                                        <div style="font-size: 0.75rem; color: #0284c7; margin-top: 2px;">Envía una notificación a la app de los jugadores seleccionados</div>
                                    </div>
                                </label>

                                <label for="check-create-sos-alert" style="display: flex; align-items: center; gap: 14px; background: #fff5f5; border: 1.5px solid #fecaca; border-radius: 12px; padding: 12px 14px; cursor: pointer;">
                                    <input type="checkbox" id="check-create-sos-alert" checked style="width: 18px; height: 18px; min-width: 18px; accent-color: #EF4444; cursor: pointer;">
                                    <div>
                                        <div style="font-size: 0.88rem; font-weight: 800; color: #dc2626;">🚨 Publicar Alerta SOS en la App</div>
                                        <div style="font-size: 0.75rem; color: #ef4444; margin-top: 2px;">Aparece en el feed de SOS para todos + bonificación de +150 XP</div>
                                    </div>
                                </label>
                            </div>

                            <!-- Herramienta de WhatsApp Copia Rápida -->
                            <div style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 14px; padding: 14px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-weight: 850; font-size: 0.82rem; color: #15803d; display: flex; align-items: center; gap: 6px;">
                                        <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i>
                                        <span>DIFUSIÓN WHATSAPP DIRECTA</span>
                                    </span>
                                    <div style="display: flex; gap: 8px;">
                                        <button type="button" id="btn-copy-wa-text" style="background: #25D366; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 850; cursor: pointer;">
                                            <i class="far fa-copy"></i> Copiar Texto
                                        </button>
                                        <button type="button" id="btn-open-wa-web" style="background: #0f172a; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 850; cursor: pointer;">
                                            <i class="fab fa-whatsapp"></i> Abrir WhatsApp
                                        </button>
                                    </div>
                                </div>
                                <div id="wa-preview-text" style="font-family: monospace; font-size: 0.82rem; color: #1e293b; background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #bbf7d0; max-height: 160px; overflow-y: auto; line-height: 1.5;"></div>
                            </div>

                            <!-- Botones Acción Final -->
                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                                <button type="button" id="btn-cancel-broadcast" style="background: #f1f5f9; color: #475569; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 800; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit" id="btn-submit-broadcast" style="background: #CCFF00; color: #000; border: none; padding: 12px 26px; border-radius: 12px; font-weight: 950; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(204, 255, 0, 0.4);">
                                    <i class="fas fa-paper-plane"></i>
                                    <span>🚀 ENVIAR MENSAJE AHORA</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            // Vincular Lógica Interactiva del Modal
            const overlay = document.getElementById('sos-broadcast-overlay');
            const closeBtn = document.getElementById('btn-close-broadcast-modal');
            const cancelBtn = document.getElementById('btn-cancel-broadcast');
            const form = document.getElementById('form-sos-broadcast');
            const eventSelect = document.getElementById('broadcast-event-select');
            const titleInput = document.getElementById('broadcast-title-input');
            const bodyInput = document.getElementById('broadcast-body-input');
            const levelMinInput = document.getElementById('broadcast-level-min');
            const levelMaxInput = document.getElementById('broadcast-level-max');
            const badgeCounter = document.getElementById('broadcast-audience-counter-badge');
            const waPreview = document.getElementById('wa-preview-text');
            const copyWaBtn = document.getElementById('btn-copy-wa-text');
            const openWaBtn = document.getElementById('btn-open-wa-web');

            const closeModal = async () => { 
                modalRoot.innerHTML = ''; 
                try {
                    await this.render();
                } catch (rErr) {
                    console.warn("Aviso al refrescar tras cerrar modal:", rErr);
                }
            };
            closeBtn.onclick = closeModal;
            cancelBtn.onclick = closeModal;
            overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

            // Función para actualizar contador de audiencia y preview de WhatsApp
            const updateAudienceAndPreview = () => {
                const aud = form.querySelector('input[name="targetAudience"]:checked')?.value || 'all';
                const lMin = parseFloat(levelMinInput.value) || 1.0;
                const lMax = parseFloat(levelMaxInput.value) || 7.0;

                const matching = this.realPlayers.filter(p => {
                    if (aud === 'male' && p.gender !== 'chico') return false;
                    if (aud === 'female' && p.gender !== 'chica') return false;
                    if (p.level < lMin || p.level > lMax) return false;
                    return true;
                });

                let audLabel = 'Todos los jugadores';
                if (aud === 'male') audLabel = 'Jugadores Masculinos (Chicos)';
                else if (aud === 'mixed') audLabel = 'Jugadores Mixtos (Chicos y Chicas)';
                else if (aud === 'female') audLabel = 'Jugadoras Femeninas (Chicas)';

                badgeCounter.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.1rem;"></i>
                    <span>Audiencia: <strong>${matching.length} jugadores reales</strong> (${audLabel} • Nivel ${lMin.toFixed(2)} a ${lMax.toFixed(2)})</span>
                `;

                // Preview WhatsApp
                const t = titleInput.value.trim();
                const b = bodyInput.value.trim();
                const fullWa = `*${t}*\n\n${b}\n\n👉 *SomosPádel BCN*`;
                waPreview.textContent = fullWa;
            };

            // Event Listeners
            form.querySelectorAll('input[name="targetAudience"]').forEach(r => {
                r.onchange = () => {
                    const aud = r.value;
                    const opt = eventSelect.options[eventSelect.selectedIndex];
                    const foundEvt = opt.value !== 'none'
                        ? (eventsOptions.find(e => String(e.id) === String(opt.value)) || opt.dataset)
                        : null;
                    const tmpl = getTemplateText(aud, foundEvt);
                    titleInput.value = tmpl.title;
                    bodyInput.value = tmpl.body;
                    updateAudienceAndPreview();
                };
            });

            levelMinInput.oninput = updateAudienceAndPreview;
            levelMaxInput.oninput = updateAudienceAndPreview;
            titleInput.oninput = updateAudienceAndPreview;
            bodyInput.oninput = updateAudienceAndPreview;

            // Gestión de Plantillas Rápidas (Clima, Journal, Noticia del Día)
            form.querySelectorAll('.btn-quick-tpl').forEach(btn => {
                btn.onclick = () => {
                    const tpl = btn.dataset.tpl;
                    const sosCheck = document.getElementById('check-create-sos-alert');

                    if (tpl === 'clima') {
                        titleInput.value = '🌤️ Previsión del Tiempo: Pistas 100% Jugables';
                        bodyInput.value = 'Condiciones excelentes hoy en Cornellà y El Prat: 21°C, 0% probabilidad de lluvia y brisa suave de 11 km/h. Pistas descubiertas en estado perfecto para jugar.';
                        if (sosCheck) sosCheck.checked = false;
                    } else if (tpl === 'journal_bajada') {
                        titleInput.value = '📰 SomosPadel Journal: Dominar la Bajada de Pared';
                        bodyInput.value = 'Técnica Pro: cómo anticipar el rebote tras el cristal, cargar el peso del cuerpo y acelerar de arriba a abajo para definir o forzar el error del rival.';
                        if (sosCheck) sosCheck.checked = false;
                    } else if (tpl === 'journal_material') {
                        titleInput.value = '🎾 SomosPadel Journal: Palas de Carbono y Salida de Bola';
                        bodyInput.value = 'Guía de Material: cómo influye la humedad nocturna de Barcelona en la fibra de carbono 12K y el rebote en la moqueta azul oficial del club.';
                        if (sosCheck) sosCheck.checked = false;
                    } else if (tpl === 'noticia_dia') {
                        titleInput.value = '🔥 Noticia Relevante: Nueva Temporada & Ranking XP';
                        bodyInput.value = '¡Ya activo en la App! Estrenamos tabla de clasificación en vivo con ascensos de división, cromos PadelFut dinámicos y bonus XP en cada partido.';
                        if (sosCheck) sosCheck.checked = false;
                    } else if (tpl === 'convocatoria') {
                        const aud = form.querySelector('input[name="targetAudience"]:checked')?.value || 'all';
                        const opt = eventSelect.options[eventSelect.selectedIndex];
                        const foundEvt = opt.value !== 'none'
                            ? (eventsOptions.find(e => String(e.id) === String(opt.value)) || opt.dataset)
                            : null;
                        const tmpl = getTemplateText(aud, foundEvt);
                        titleInput.value = tmpl.title;
                        bodyInput.value = tmpl.body;
                    }

                    // Destacar visualmente el botón seleccionado
                    form.querySelectorAll('.btn-quick-tpl').forEach(b => b.style.outline = 'none');
                    btn.style.outline = '2.5px solid #0f172a';
                    updateAudienceAndPreview();
                };
            });

            // Al cambiar de entreno
            eventSelect.onchange = () => {
                const opt = eventSelect.options[eventSelect.selectedIndex];
                if (opt.value !== 'none') {
                    const ds = opt.dataset;
                    const foundEvt = eventsOptions.find(e => String(e.id) === String(opt.value)) || {
                        id: opt.value,
                        type: ds.type,
                        name: ds.name,
                        category: ds.cat,
                        date: ds.date,
                        time: ds.time,
                        court: ds.court,
                        levelMin: ds.lmin,
                        levelMax: ds.lmax,
                        freeSlots: ds.free
                    };

                    const cat = String(foundEvt.category || ds.cat || '').toLowerCase();
                    if (cat === 'male' || cat.includes('masc')) {
                        const rMale = form.querySelector('input[name="targetAudience"][value="male"]');
                        if (rMale) rMale.checked = true;
                    } else if (cat === 'mixed' || cat.includes('mixt')) {
                        const rMix = form.querySelector('input[name="targetAudience"][value="mixed"]');
                        if (rMix) rMix.checked = true;
                    } else if (cat === 'female' || cat.includes('fem')) {
                        const rFem = form.querySelector('input[name="targetAudience"][value="female"]');
                        if (rFem) rFem.checked = true;
                    }

                    if (foundEvt.levelMin !== undefined) levelMinInput.value = foundEvt.levelMin;
                    else if (ds.lmin) levelMinInput.value = ds.lmin;

                    if (foundEvt.levelMax !== undefined) levelMaxInput.value = foundEvt.levelMax;
                    else if (ds.lmax) levelMaxInput.value = ds.lmax;

                    const tmpl = getTemplateText(foundEvt.category || ds.cat, foundEvt);
                    titleInput.value = tmpl.title;
                    bodyInput.value = tmpl.body;
                } else {
                    const aud = form.querySelector('input[name="targetAudience"]:checked')?.value || 'all';
                    const tmpl = getTemplateText(aud, null);
                    titleInput.value = tmpl.title;
                    bodyInput.value = tmpl.body;
                }
                updateAudienceAndPreview();
            };

            // Copiar texto para WhatsApp
            copyWaBtn.onclick = () => {
                const text = waPreview.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    alert("📋 ¡Mensaje copiado al portapapeles! Ya puedes pegarlo en los grupos de WhatsApp de SomosPádel.");
                }).catch(() => {
                    alert("Texto: \n" + text);
                });
            };

            // Abrir WhatsApp Web
            openWaBtn.onclick = () => {
                const text = encodeURIComponent(waPreview.textContent);
                window.open(`https://wa.me/?text=${text}`, '_blank');
            };

            // Inicializar cálculos
            updateAudienceAndPreview();

            // Submit del Formulario de Difusión
            form.onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('btn-submit-broadcast');
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>EMITIENDO MENSAJE...</span>`;

                const targetAud = form.querySelector('input[name="targetAudience"]:checked')?.value || 'all';
                const lMin = parseFloat(levelMinInput.value) || 1.0;
                const lMax = parseFloat(levelMaxInput.value) || 7.0;
                const title = titleInput.value.trim();
                const body = bodyInput.value.trim();
                const sendPush = document.getElementById('check-send-push').checked;
                const createSos = document.getElementById('check-create-sos-alert').checked;

                const selOpt = eventSelect.options[eventSelect.selectedIndex];
                const eventId = selOpt.value !== 'none' ? selOpt.value : null;
                const foundEvt = eventId ? eventsOptions.find(e => String(e.id) === String(eventId)) : null;

                const eventType = foundEvt?.type || selOpt.dataset?.type || 'entrenos';
                const eventName = foundEvt?.name || selOpt.dataset?.name || title;
                const eventDate = foundEvt?.date || selOpt.dataset?.date || new Date().toISOString().split('T')[0];
                const eventTime = foundEvt?.time || selOpt.dataset?.time || '19:30';
                const eventCourt = foundEvt?.court || selOpt.dataset?.court || 'Pistas Centrales';

                try {
                    const service = this._getService();
                    if (!service) throw new Error("Servicio SosSubstitutesService no disponible.");

                    const res = await service.broadcastConvocatoria({
                        title,
                        body,
                        url: eventType === 'americana' ? 'americanas' : 'entrenos',
                        targetAudience: targetAud,
                        levelMin: lMin,
                        levelMax: lMax,
                        eventId,
                        eventType,
                        eventName,
                        date: eventDate,
                        time: eventTime,
                        court: eventCourt,
                        sendPush,
                        createSosAlert: createSos
                    });

                    // Feedback sonoro y toast en pantalla
                    if (window.NotificationService) {
                        try {
                            if (typeof window.NotificationService.showInAppToast === 'function') {
                                window.NotificationService.showInAppToast("📢 ¡Mensaje Enviado!", `${res.recipientCount} jugadores reales notificados.`);
                            }
                            if (typeof window.NotificationService.showNativeNotification === 'function') {
                                window.NotificationService.showNativeNotification(title, body, { url: eventType === 'americana' ? 'americanas' : 'entrenos' });
                            }
                        } catch (_) {}
                    }
                    if (window.NotificationUi && typeof window.NotificationUi.playNotificationSound === 'function') {
                        try { window.NotificationUi.playNotificationSound(); } catch (_) {}
                    }

                    // Pantalla de confirmación detallada dentro del modal
                    const formEl = document.getElementById('form-sos-broadcast');
                    if (formEl) {
                        formEl.innerHTML = `
                            <div style="text-align: center; padding: 10px 0 20px 0;">
                                <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #d1fae5, #6ee7b7); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 2.2rem; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);">
                                    ✅
                                </div>
                                <h2 style="margin: 0 0 6px 0; font-size: 1.4rem; font-weight: 950; color: #0f172a;">¡Mensaje enviado con éxito!</h2>
                                <p style="margin: 0; font-size: 0.88rem; color: #64748b;">El comunicado ha sido procesado y registrado correctamente.</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 12px;">

                                <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px;">
                                    <div style="font-size: 1.8rem;">👥</div>
                                    <div>
                                        <div style="font-size: 0.78rem; font-weight: 800; color: #16a34a; text-transform: uppercase;">Jugadores notificados en la App</div>
                                        <div style="font-size: 1.45rem; font-weight: 950; color: #15803d;">${res.recipientCount} jugadores reales</div>
                                        <div style="font-size: 0.75rem; color: #16a34a; margin-top: 2px;">Notificación In-App registrada en el buzón de cada jugador ✓</div>
                                    </div>
                                </div>

                                ${sendPush ? `
                                <div style="background: #f0f9ff; border: 1.5px solid #7dd3fc; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px;">
                                    <div style="font-size: 1.8rem;">📱</div>
                                    <div>
                                        <div style="font-size: 0.78rem; font-weight: 800; color: #0284c7; text-transform: uppercase;">Notificación Push y Móvil</div>
                                        <div style="font-size: 0.95rem; font-weight: 800; color: #0369a1;">Procesada para ${res.notifiedCount || res.recipientCount} dispositivos ✓</div>
                                        <div style="font-size: 0.75rem; color: #0284c7; margin-top: 2px;">Aparecerá en los teléfonos con la PWA o permisos de notificación activos</div>
                                    </div>
                                </div>
                                ` : `
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; opacity: 0.7;">
                                    <div style="font-size: 1.8rem;">📵</div>
                                    <div style="font-size: 0.88rem; color: #64748b; font-weight: 600;">Push desactivada — no se emitió push al móvil</div>
                                </div>
                                `}

                                ${createSos ? `
                                <div style="background: #fff5f5; border: 1.5px solid #fca5a5; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px;">
                                    <div style="font-size: 1.8rem;">🚨</div>
                                    <div>
                                        <div style="font-size: 0.78rem; font-weight: 800; color: #dc2626; text-transform: uppercase;">Alerta SOS publicada en el feed</div>
                                        <div style="font-size: 0.95rem; font-weight: 800; color: #b91c1c;">${res.sosAlert ? 'ID: ' + res.sosAlert.id : 'Publicada'} ✓</div>
                                        <div style="font-size: 0.75rem; color: #dc2626; margin-top: 2px;">+150 XP de bonificación activados para quien responda</div>
                                    </div>
                                </div>
                                ` : `
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; opacity: 0.6;">
                                    <div style="font-size: 1.8rem;">🔕</div>
                                    <div style="font-size: 0.85rem; color: #94a3b8;">Alerta SOS no activada — no se publicó en el feed</div>
                                </div>
                                `}

                                <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                    <div>
                                        <div style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase;">ID de Registro en Firestore</div>
                                        <code style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">${res.broadcastId || '—'}</code>
                                    </div>
                                    <i class="fas fa-database" style="color: #94a3b8; font-size: 1.1rem;"></i>
                                </div>

                            </div>

                            <div style="margin-top: 24px; display: flex; justify-content: center;">
                                <button id="btn-close-broadcast-success" type="button" style="background: #0f172a; color: #CCFF00; border: none; padding: 14px 34px; border-radius: 14px; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.25);">
                                    <i class="fas fa-check"></i> <span>Cerrar y volver al panel</span>
                                </button>
                            </div>
                        `;
                        document.getElementById('btn-close-broadcast-success')?.addEventListener('click', closeModal);
                    } else {
                        alert("✅ ¡Mensaje enviado con éxito a " + res.recipientCount + " jugadores!");
                        closeModal();
                    }
                } catch (err) {
                    console.error("❌ Error emitiendo convocatoria:", err);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> <span>Reintentar Envío</span>`;
                    alert("Error al enviar el mensaje: " + err.message);
                }
            };
        }

        // =========================================================================
        // MODAL 2: 👤 ASIGNAR JUGADOR REAL A UN ENTRENO
        // =========================================================================

        /**
         * Abre modal para seleccionar y asignar un jugador real a un entreno incompleto
         */
        openAssignPlayerToEventModal(eventId, eventType, eventName) {
            const modalRoot = document.getElementById('admin-sos-modal-root');
            if (!modalRoot) return;

            modalRoot.innerHTML = `
                <div id="assign-player-event-overlay" style="
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
                    z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
                ">
                    <div style="
                        background: #ffffff; border-radius: 24px; max-width: 600px; width: 100%;
                        max-height: 88vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                        border: 1px solid #cbd5e1; font-family: 'Outfit', 'Inter', sans-serif;
                    ">
                        <div style="background: #0f172a; padding: 20px 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
                            <div>
                                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 900; color: #ffffff;">Asignar Jugador Real a Convocatoria</h3>
                                <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #94a3b8;">${this._escapeHtml(eventName)}</p>
                            </div>
                            <button id="btn-close-assign-event-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">&times;</button>
                        </div>

                        <div style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <input type="text" id="assign-event-search-input" placeholder="Buscar jugador por nombre o teléfono..." style="
                                    width: 100%; height: 42px; border-radius: 12px; border: 1px solid #cbd5e1; padding: 0 14px; font-size: 0.88rem; font-weight: 600;
                                ">
                            </div>

                            <div id="assign-event-players-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto;">
                                <!-- Se rellena dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const overlay = document.getElementById('assign-player-event-overlay');
            const closeBtn = document.getElementById('btn-close-assign-event-modal');
            const searchInput = document.getElementById('assign-event-search-input');
            const listEl = document.getElementById('assign-event-players-list');

            const closeModal = () => { modalRoot.innerHTML = ''; };
            closeBtn.onclick = closeModal;
            overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

            const renderList = (filter = '') => {
                const q = filter.toLowerCase().trim();
                const matched = this.realPlayers.filter(p => !q || p.name.toLowerCase().includes(q) || p.phone.includes(q));

                if (matched.length === 0) {
                    listEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #94a3b8;">No se encontraron jugadores reales con ese criterio.</div>`;
                    return;
                }

                listEl.innerHTML = matched.slice(0, 30).map(p => `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${p.gender === 'chico' ? '#0284c7' : '#db2777'}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem;">
                                ${this._getInitials(p.name)}
                            </div>
                            <div>
                                <div style="font-weight: 850; font-size: 0.88rem; color: #0f172a;">${this._escapeHtml(p.name)}</div>
                                <div style="font-size: 0.75rem; color: #64748b;">Nivel ${p.level.toFixed(2)} • ${this._formatSide(p.side)} ${p.phone ? '• ' + p.phone : ''}</div>
                            </div>
                        </div>

                        <button class="btn-do-assign-player" data-player-id="${p.id}" style="background: #0f172a; color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-weight: 850; font-size: 0.78rem; cursor: pointer;">
                            Inscribir
                        </button>
                    </div>
                `).join('');

                listEl.querySelectorAll('.btn-do-assign-player').forEach(btn => {
                    btn.onclick = async (e) => {
                        const pid = e.currentTarget.dataset.playerId;
                        const playerObj = this.realPlayers.find(p => p.id === pid);
                        if (!playerObj) return;

                        btn.disabled = true;
                        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

                        try {
                            if (window.ParticipantService && typeof window.ParticipantService.addPlayer === 'function') {
                                await window.ParticipantService.addPlayer(eventId, eventType, playerObj.raw || playerObj);
                            } else {
                                throw new Error("ParticipantService no disponible para registrar jugador.");
                            }

                            closeModal();
                            await this.render();
                            alert(`✅ ¡Jugador ${playerObj.name} inscrito con éxito en ${eventName}!`);
                        } catch (err) {
                            alert("❌ Error al inscribir jugador: " + err.message);
                            btn.disabled = false;
                            btn.textContent = "Inscribir";
                        }
                    };
                });
            };

            searchInput.oninput = (e) => renderList(e.target.value);
            renderList();
        }

        /**
         * Abre modal para convocar a un jugador específico a alguno de los entrenos con plazas libres
         */
        openDirectPlayerConvocarModal(playerId) {
            const player = this.realPlayers.find(p => p.id === playerId);
            if (!player) return;

            if (this.incompleteEvents.length === 0) {
                alert(`⚠️ No hay entrenos ni americanas con plazas libres en este momento para asignar a ${player.name}.`);
                return;
            }

            const modalRoot = document.getElementById('admin-sos-modal-root');
            if (!modalRoot) return;

            modalRoot.innerHTML = `
                <div id="direct-convocar-overlay" style="
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
                    z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
                ">
                    <div style="background: #ffffff; border-radius: 24px; max-width: 520px; width: 100%; padding: 24px; font-family: 'Outfit', sans-serif;">
                        <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 900; color: #0f172a;">
                            Inscribir a ${this._escapeHtml(player.name)}
                        </h3>
                        <p style="margin: 0 0 16px 0; font-size: 0.82rem; color: #64748b;">
                            Nivel ${player.level.toFixed(2)} • ${player.gender === 'chico' ? 'Chico' : 'Chica'} • ${this._formatSide(player.side)}
                        </p>

                        <div style="font-size: 0.78rem; font-weight: 850; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                            Selecciona la Convocatoria / Entreno:
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                            ${this.incompleteEvents.map(evt => `
                                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 850; font-size: 0.88rem; color: #0f172a;">${this._escapeHtml(evt.name)}</div>
                                        <div style="font-size: 0.75rem; color: #64748b;">${evt.date} ${evt.time}h • ${evt.court} (${evt.freeSlots} plazas)</div>
                                    </div>
                                    <button class="btn-confirm-direct-enroll" data-event-id="${evt.id}" data-event-type="${evt.type}" data-event-name="${this._escapeHtml(evt.name)}" style="background: #0f172a; color: #fff; border: none; padding: 7px 12px; border-radius: 8px; font-weight: 850; font-size: 0.78rem; cursor: pointer;">
                                        Asignar
                                    </button>
                                </div>
                            `).join('')}
                        </div>

                        <div style="display: flex; justify-content: flex-end;">
                            <button id="btn-cancel-direct-convocar" style="background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; cursor: pointer;">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const overlay = document.getElementById('direct-convocar-overlay');
            const cancelBtn = document.getElementById('btn-cancel-direct-convocar');
            const closeModal = () => { modalRoot.innerHTML = ''; };

            cancelBtn.onclick = closeModal;
            overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

            overlay.querySelectorAll('.btn-confirm-direct-enroll').forEach(btn => {
                btn.onclick = async (e) => {
                    const ds = e.currentTarget.dataset;
                    btn.disabled = true;
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

                    try {
                        if (window.ParticipantService && typeof window.ParticipantService.addPlayer === 'function') {
                            await window.ParticipantService.addPlayer(ds.eventId, ds.eventType, player.raw || player);
                        } else {
                            throw new Error("ParticipantService no disponible.");
                        }

                        closeModal();
                        await this.render();
                        alert(`✅ ¡${player.name} asignado con éxito a ${ds.eventName}!`);
                    } catch (err) {
                        alert("❌ Error: " + err.message);
                        btn.disabled = false;
                        btn.textContent = "Asignar";
                    }
                };
            });
        }

        // =========================================================================
        // MODAL 3: 🚨 CREAR ALERTA SOS URGENTE
        // =========================================================================

        /**
         * Abre modal para crear una nueva alerta SOS
         */
        openCreateAlertModal(prefill = null) {
            const modalRoot = document.getElementById('admin-sos-modal-root');
            if (!modalRoot) return;

            const today = new Date().toISOString().split('T')[0];

            modalRoot.innerHTML = `
                <div id="create-sos-modal-backdrop" style="
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(6px);
                    z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
                ">
                    <div style="
                        background: #ffffff; border-radius: 24px; max-width: 550px; width: 100%;
                        overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
                        border: 1px solid #cbd5e1; font-family: 'Outfit', 'Inter', sans-serif; color: #0f172a;
                    ">
                        <div style="background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%); padding: 20px 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 1.4rem;">🚨</span>
                                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 900; color: #ffffff;">Publicar Alerta SOS Urgente</h3>
                            </div>
                            <button id="btn-close-sos-create-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">&times;</button>
                        </div>

                        <form id="form-create-sos-alert" style="padding: 24px;">
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                    Tipo de Evento
                                </label>
                                <select name="eventType" class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px; font-weight: 600;">
                                    <option value="entrenos" ${prefill && prefill.eventType === 'entreno' ? 'selected' : ''}>🎓 Sesión de Entreno</option>
                                    <option value="americana" ${prefill && prefill.eventType === 'americana' ? 'selected' : ''}>🏆 Torneo Americano</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                    Nombre del Evento
                                </label>
                                <input type="text" name="eventName" required placeholder="Ej: Entreno Masculino de Competición" value="${prefill ? this._escapeHtml(prefill.eventName) : 'Entreno SomosPádel BCN'}" class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px; font-weight: 600;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Fecha</label>
                                    <input type="date" name="date" value="${prefill && prefill.date ? prefill.date : today}" required class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Horario</label>
                                    <input type="text" name="time" value="${prefill && prefill.time ? prefill.time : '19:30'}" placeholder="19:30" required class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Pista Asignada</label>
                                    <input type="text" name="court" value="${prefill && prefill.court ? this._escapeHtml(prefill.court) : 'Pista 1'}" placeholder="Ej: Pista 2" required class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Lado Requerido</label>
                                    <select name="sideNeeded" class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px; font-weight: 600;">
                                        <option value="any">🔄 Cualquiera / Indiferente</option>
                                        <option value="reves">🛡️ Revés (Izquierda)</option>
                                        <option value="drive">🎯 Drive (Derecha)</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Nivel Mínimo</label>
                                    <input type="number" step="0.25" name="levelMin" value="${prefill && prefill.levelMin ? prefill.levelMin : 3.0}" class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Nivel Máximo</label>
                                    <input type="number" step="0.25" name="levelMax" value="${prefill && prefill.levelMax ? prefill.levelMax : 4.5}" class="pro-input" style="width: 100%; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                                </div>
                            </div>

                            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px; margin-bottom: 20px; font-size: 0.8rem; color: #991b1b; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-award" style="font-size: 1.3rem;"></i>
                                <span>La plaza incluirá automáticamente <strong>+150 XP de honor</strong> para premiar al suplente que la rescate.</span>
                            </div>

                            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                                <button type="button" id="btn-cancel-create-sos" style="background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 750; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit" style="background: linear-gradient(135deg, #EF4444 0%, #b91c1c 100%); color: #ffffff; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 900; cursor: pointer;">
                                    🚀 Publicar Alerta Inmediata
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            const closeBtn = document.getElementById('btn-close-sos-create-modal');
            const cancelBtn = document.getElementById('btn-cancel-create-sos');
            const backdrop = document.getElementById('create-sos-modal-backdrop');
            const form = document.getElementById('form-create-sos-alert');
            const closeModal = () => { modalRoot.innerHTML = ''; };

            if (closeBtn) closeBtn.onclick = closeModal;
            if (cancelBtn) cancelBtn.onclick = closeModal;
            if (backdrop) {
                backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
            }

            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const alertData = {
                    eventId: prefill?.eventId || null,
                    eventType: formData.get('eventType'),
                    eventName: formData.get('eventName'),
                    date: formData.get('date'),
                    time: formData.get('time'),
                    court: formData.get('court'),
                    sideNeeded: formData.get('sideNeeded'),
                    levelMin: parseFloat(formData.get('levelMin')) || 3.0,
                    levelMax: parseFloat(formData.get('levelMax')) || 4.5,
                    bonusXp: 150
                };

                try {
                    const service = this._getService();
                    if (service) {
                        await service.createSosAlert(alertData);
                    }
                    closeModal();
                    await this.render();
                    alert("✅ Alerta SOS publicada con éxito en la App.");
                } catch (err) {
                    alert("❌ Error al publicar alerta SOS: " + err.message);
                }
            };
        }

        // =========================================================================
        // MODAL 4: 👤 ASIGNAR JUGADOR REAL A ALERTA SOS
        // =========================================================================

        openAssignPlayerToAlertModal(alertId) {
            const alertObj = this.activeAlerts.find(a => a.id === alertId);
            if (!alertObj) return;

            const modalRoot = document.getElementById('admin-sos-modal-root');
            if (!modalRoot) return;

            modalRoot.innerHTML = `
                <div id="assign-alert-overlay" style="
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
                    z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
                ">
                    <div style="background: #ffffff; border-radius: 24px; max-width: 600px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); font-family: 'Outfit', sans-serif;">
                        <div style="background: #0f172a; padding: 20px 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
                            <div>
                                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 900; color: #ffffff;">Asignar Jugador a Alerta SOS</h3>
                                <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #94a3b8;">${this._escapeHtml(alertObj.eventName)} (${alertObj.time})</p>
                            </div>
                            <button id="btn-close-alert-assign-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">&times;</button>
                        </div>

                        <div style="padding: 20px;">
                            <input type="text" id="assign-alert-search" placeholder="Buscar jugador por nombre..." style="width: 100%; height: 40px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px; margin-bottom: 12px; font-size: 0.85rem;">
                            
                            <div id="assign-alert-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 350px; overflow-y: auto;">
                                <!-- Se rellena dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const overlay = document.getElementById('assign-alert-overlay');
            const closeBtn = document.getElementById('btn-close-alert-assign-modal');
            const searchInput = document.getElementById('assign-alert-search');
            const listEl = document.getElementById('assign-alert-list');
            const closeModal = () => { modalRoot.innerHTML = ''; };

            closeBtn.onclick = closeModal;
            overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

            const renderPlayers = (filter = '') => {
                const q = filter.toLowerCase().trim();
                const matched = this.realPlayers.filter(p => !q || p.name.toLowerCase().includes(q) || p.phone.includes(q));

                listEl.innerHTML = matched.slice(0, 30).map(p => `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 850; font-size: 0.88rem; color: #0f172a;">${this._escapeHtml(p.name)}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">Nivel ${p.level.toFixed(2)} • ${this._formatSide(p.side)}</div>
                        </div>
                        <button class="btn-do-assign-to-alert" data-player-id="${p.id}" style="background: #0f172a; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 850; font-size: 0.78rem; cursor: pointer;">
                            Cubrir Plaza
                        </button>
                    </div>
                `).join('');

                listEl.querySelectorAll('.btn-do-assign-to-alert').forEach(btn => {
                    btn.onclick = async (e) => {
                        const pid = e.currentTarget.dataset.playerId;
                        const targetSub = this.realPlayers.find(p => p.id === pid);
                        if (!targetSub) return;
                        closeModal();
                        await this._assignPlayerToAlert(alertId, targetSub);
                    };
                });
            };

            searchInput.oninput = (e) => renderPlayers(e.target.value);
            renderPlayers();
        }

        async _assignPlayerToAlert(alertId, player) {
            try {
                const service = this._getService();
                if (service) {
                    await service.joinSosAlert(alertId, player.raw || player);
                }
                await this.render();
                alert(`🎉 ¡Plaza cubierta con éxito por ${player.name}! Se le han otorgado +150 XP de honor.`);
            } catch (err) {
                alert("❌ Error al asignar suplente: " + err.message);
            }
        }

        async _cancelAlert(alertId) {
            try {
                const service = this._getService();
                if (service) {
                    await service.cancelSosAlert(alertId, "Cancelada por la administración");
                }
                await this.render();
            } catch (err) {
                alert("❌ Error al cancelar alerta: " + err.message);
            }
        }

        _getFilteredPlayers() {
            return this.realPlayers.filter(p => {
                if (this.filterGender !== 'all' && p.gender !== this.filterGender) return false;

                if (this.filterSide !== 'all') {
                    if (this.filterSide === 'drive' && p.side !== 'drive' && p.side !== 'any') return false;
                    if (this.filterSide === 'reves' && p.side !== 'reves' && p.side !== 'any') return false;
                }

                if (this.filterGuard === 'guard' && !p.isAvailableToday) return false;

                if (this.searchQuery) {
                    const q = this.searchQuery;
                    if (!p.name.toLowerCase().includes(q) && !p.phone.includes(q)) return false;
                }

                return true;
            });
        }

        _getFilteredEvents() {
            return this.incompleteEvents.filter(evt => {
                if (this.filterEventCat === 'all') return true;
                const cat = String(evt.category || '').toLowerCase();
                const name = String(evt.name || '').toLowerCase();
                if (this.filterEventCat === 'male') {
                    return cat === 'male' || cat.includes('masc') || name.includes('masc') || name.includes('chico') || cat === 'open';
                }
                if (this.filterEventCat === 'mixed') {
                    return cat === 'mixed' || cat.includes('mixt') || name.includes('mixt') || cat === 'open';
                }
                if (this.filterEventCat === 'female') {
                    return cat === 'female' || cat.includes('fem') || name.includes('fem') || name.includes('chica') || cat === 'open';
                }
                return true;
            });
        }

        _updateSidebarBadge() {
            const badge = document.getElementById('sidebar-sos-badge');
            if (badge) {
                const count = this.activeAlerts.length;
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }

        _getService() {
            return (typeof window !== 'undefined' && window.SosSubstitutesService)
                ? window.SosSubstitutesService
                : null;
        }

        _formatSide(side) {
            if (!side) return 'Cualquiera';
            const s = String(side).toLowerCase();
            if (s.includes('rev')) return 'Revés';
            if (s.includes('dri')) return 'Drive';
            return 'Cualquiera';
        }

        _getInitials(name) {
            if (!name) return 'SP';
            const parts = name.trim().split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.slice(0, 2).toUpperCase();
        }

        _escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        _getLoadingHtml() {
            return `
                <div style="padding: 70px 20px; text-align: center;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 16px;"></i>
                    <div style="font-weight: 850; font-size: 1.15rem; color: #0f172a;">Sincronizando Convocatorias y Jugadores Reales...</div>
                    <div style="font-size: 0.85rem; color: #64748b; margin-top: 6px;">Conectando con la base de datos de SomosPádel BCN</div>
                </div>
            `;
        }

        _getErrorHtml(msg) {
            return `
                <div style="padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">⚠️</div>
                    <h3 style="margin: 0 0 8px 0; color: #b91c1c; font-weight: 900;">Error al cargar Convocatorias SOS</h3>
                    <p style="margin: 0 0 16px 0; font-size: 0.88rem; color: #64748b;">${this._escapeHtml(msg)}</p>
                    <button onclick="window.AdminSosSubstitutes.render()" class="btn-primary-pro" style="padding: 10px 20px; border-radius: 10px; font-weight: 850; cursor: pointer;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    // Instanciación del módulo y registro global
    const adminSosInstance = new AdminSosSubstitutes();
    global.AdminSosSubstitutes = adminSosInstance;

    if (!global.AdminViews) {
        global.AdminViews = {};
    }
    global.AdminViews.sos_substitutes = () => adminSosInstance.render();

    console.log('🚨 [AdminSosSubstitutes] Módulo de Convocatorias, Bajas y Mensajería Real cargado con éxito.');

})(typeof window !== 'undefined' ? window : this);
