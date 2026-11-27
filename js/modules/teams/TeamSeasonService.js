/**
 * TeamSeasonService.js
 * Servicio Multi-Temporada para Equipos del Club (SomosPádel Barcelona)
 *
 * Gestiona:
 * 1. Catálogo de temporadas en Firestore (`team_seasons/{seasonId}`) con fallback local seguro.
 * 2. Equipos agrupados por temporada (`team_seasons/{seasonId}/teams/{teamId}`), manteniendo
 *    retrocompatibilidad total con `club_teams` y `window.ClubTeamsData` para Temporada 2026.
 * 3. Archivo (snapshot congelado) de Temporada 2026 y creación/activación de Temporada 2027+.
 * 4. Motor de comparación de plantillas entre temporadas:
 *    - Renovados (siguen en el mismo equipo)
 *    - Cambios de equipo (suben/bajan o cambian de categoría)
 *    - Nuevos fichajes (altas en la nueva temporada)
 *    - Bajas (participaron en la temporada anterior y no continúan)
 * 5. Sincronización del historial de equipo (`teamHistory`) en la colección `players`.
 *
 * Expuesto globalmente en `window.TeamSeasonService`.
 */
(function (global) {
    'use strict';

    const CONFIG = {
        SEASONS_COLLECTION: 'team_seasons',
        TEAMS_SUBCOLLECTION: 'teams',
        LEGACY_TEAMS_COLLECTION: 'club_teams',
        STORAGE_SELECTED_KEY: 'sp_selected_team_season',
        STORAGE_SEASONS_CACHE: 'sp_team_seasons_cache_v3',
        DEFAULT_LEGACY_SEASON_ID: '2026',
        DEFAULT_LEAGUE_NAME: 'Lliga GuinotPrunera'
    };

    const DEFAULT_2026_SEASON = {
        id: '2026',
        label: 'Temporada 2026',
        shortLabel: '2026',
        period: 'Ene 2026 – Nov 2026',
        startDate: '2026-01-01',
        endDate: '2026-11-30',
        leagueName: 'Lliga GuinotPrunera',
        status: 'archived', // Temporada 2026 finalizada (Ene-Nov 2026) y sellada para el histórico
        isDefault: true,
        order: 2026,
        previousSeasonId: null,
        archivedAt: '2026-11-27'
    };

    const DEMO_2027_SEASON = {
        id: '2027',
        label: 'Temporada 2027',
        shortLabel: '2027',
        period: 'Ene 2027 – Nov 2027',
        startDate: '2027-01-01',
        endDate: '2027-11-30',
        leagueName: 'Lliga GuinotPrunera',
        status: 'draft', // Modo pruebas hasta cargar Excel definitivo 2027
        isDefault: false,
        order: 2027,
        previousSeasonId: '2026',
        isDemo: true
    };

    /**
     * Directorio oficial de Capitanes y Subcapitanes — Temporada 2027 (SomosPádel BCN)
     * Incluye alias frecuentes (diminutivos/variantes) para emparejar con el perfil logueado.
     */
    const OFFICIAL_CAPTAINS_2027 = {
        '3m':  { captain: 'Carlos Canosa', subcaptain: 'David Coca', aliases: ['carlos canosa', 'david coca'] },
        '3ma': { captain: 'Carlos Canosa', subcaptain: 'David Coca', aliases: ['carlos canosa', 'david coca'] },
        '4m':  { captain: 'Miguel Muñoz', subcaptain: 'Alex Coscolin', aliases: ['miguel munoz', 'miquel munoz', 'alex coscolin', 'alejandro coscolin'] },
        '4ma': { captain: 'Miguel Muñoz', subcaptain: 'Alex Coscolin', aliases: ['miguel munoz', 'miquel munoz', 'alex coscolin', 'alejandro coscolin'] },
        '2f':  { captain: 'Silvia Serrano', subcaptain: '', aliases: ['silvia serrano'] },
        '2fa': { captain: 'Silvia Serrano', subcaptain: '', aliases: ['silvia serrano'] },
        '3f':  { captain: 'Gemma Saavedra', subcaptain: 'Cris Matamala', aliases: ['gemma saavedra', 'cris matamala', 'cristina matamala'] },
        '3fa': { captain: 'Gemma Saavedra', subcaptain: 'Cris Matamala', aliases: ['gemma saavedra', 'cris matamala', 'cristina matamala'] },
        '4f':  { captain: 'Gemma Saavedra', subcaptain: 'Nadia Costa', aliases: ['gemma saavedra', 'nadia costa'] },
        '4fa': { captain: 'Gemma Saavedra', subcaptain: 'Nadia Costa', aliases: ['gemma saavedra', 'nadia costa'] },
        '3x':  { captain: 'Toni Millan', subcaptain: 'Sonia Lopez', aliases: ['toni millan', 'antonio millan', 'sonia lopez'] },
        '3xa': { captain: 'Toni Millan', subcaptain: 'Sonia Lopez', aliases: ['toni millan', 'antonio millan', 'sonia lopez'] },
        '4xa': { captain: 'Miguel Muñoz', subcaptain: 'Sonia Rodriguez', aliases: ['miguel munoz', 'miquel munoz', 'sonia rodriguez'] },
        '4xb': { captain: 'Javier Frauca', subcaptain: 'Natalia Guash', aliases: ['javier frauca', 'natalia guash', 'natalia guasch'] }
    };

    const DEMO_2027_TEAMS = [
        {
            id: 'somos-padel-bcn-4m',
            name: 'SOMOS PÁDEL BCN 4M (PRUEBA)',
            category: 'Masculina',
            division: 'Cuarta',
            group: 'PRUEBA TEMPORADA 2027',
            captain: 'Miguel Muñoz',
            subcaptain: 'Alex Coscolin',
            logo: 'img/logo_somospadel.png',
            ranking: 1,
            points: 0,
            seasonId: '2027',
            stats: { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0 },
            standings: [],
            schedule: [
                {
                    j: 1,
                    date: 'Sáb 16 Ene',
                    time: '11:00h',
                    opponent: 'CRAZYXPADEL 4M DEMO',
                    location: 'Padel BCN - El Prat',
                    isHome: true,
                    status: 'pending'
                }
            ],
            roster: [
                { name: 'Alejandro Coscolin Peregrin', pts: 0, seasonStatus: 'renovado' },
                { name: 'Oscar Coscolín Génova', pts: 0, seasonStatus: 'renovado' },
                { name: 'David Díaz Cotes', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Miquel Muñoz Gaudes', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Carlos Lopez Mestre', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Abraham Rosell Claveras', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Toni Palau Zaragoza', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Álvaro Fernández Serrano', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Pablo Kellermann', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Víctor Illana Rodríguez', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Raul Garcia Alvarez', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Arnau Santamaria Piñol', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Carlos David Asmadt', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Alex Espinosa Espinosa Touzon', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Vicenç López Aguilar', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Eloy Arrabal', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Marcos Clemente Molinero', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Adrian Muñoz Perez', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Joel Sanchez Portillo', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Sergio Martín Canales', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Juanjo Ruiz', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Jan Pastor', pts: 0, seasonStatus: 'cambio_equipo' },
                { name: 'Alex Cuadra Cabezas', pts: 0, seasonStatus: 'renovado' },
                { name: 'Alex Martínez Roda', pts: 0, seasonStatus: 'renovado' },
                { name: 'Marc Soler Navarro', pts: 0, seasonStatus: 'fichaje' },
                { name: 'Pol Ferrer Vidal', pts: 0, seasonStatus: 'fichaje' },
                { name: 'Oriol Puig Costa', pts: 0, seasonStatus: 'fichaje' },
                { name: 'Dani Moreno Ruiz', pts: 0, seasonStatus: 'fichaje' }
            ]
        },
        {
            id: 'somos-padel-bcn-4xa',
            name: 'SOMOS PÁDEL BCN 4XA (PRUEBA)',
            category: 'Mixta',
            division: 'Cuarta',
            group: 'PRUEBA TEMPORADA 2027',
            captain: 'Miguel Muñoz',
            subcaptain: 'Sonia Rodriguez',
            logo: 'img/logo_somospadel.png',
            ranking: 1,
            points: 0,
            seasonId: '2027',
            stats: { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0 },
            standings: [],
            schedule: [
                {
                    j: 1,
                    date: 'Dom 17 Ene',
                    time: '17:30h',
                    opponent: 'PADELAND MIXTO DEMO',
                    location: 'Padeland El Papiol',
                    isHome: false,
                    status: 'pending'
                }
            ],
            roster: [
                { name: 'Alejandro Coscolin Peregrin', pts: 0, seasonStatus: 'renovado' },
                { name: 'David Díaz Cotes', pts: 0, seasonStatus: 'renovado' },
                { name: 'Jugadora Fichaje 2027 A', pts: 0, seasonStatus: 'fichaje' },
                { name: 'Jugadora Fichaje 2027 B', pts: 0, seasonStatus: 'fichaje' },
                { name: 'Jugador Fichaje 2027 C', pts: 0, seasonStatus: 'fichaje' },
                { name: 'Jugadora Fichaje 2027 C', pts: 0, seasonStatus: 'fichaje' }
            ]
        }
    ];

    function normalizeName(name) {
        return String(name || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function cloneDeep(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return obj;
        }
    }

    class TeamSeasonService {
        constructor() {
            this.config = CONFIG;
            this.seasons = [cloneDeep(DEFAULT_2026_SEASON)];
            this.activeSeasonId = CONFIG.DEFAULT_LEGACY_SEASON_ID;
            this.selectedSeasonId = this._readStoredSelectedSeason() || CONFIG.DEFAULT_LEGACY_SEASON_ID;
            this.teamsBySeasonCache = {};
            this._initialized = false;

            // Guardar snapshot inmutable de los datos locales iniciales de 2026 si ya existen
            if (typeof window !== 'undefined' && Array.isArray(window.ClubTeamsData) && window.ClubTeamsData.length > 0 && !window._InitialClubTeamsData2026) {
                window._InitialClubTeamsData2026 = cloneDeep(window.ClubTeamsData);
            }
        }

        _getDb() {
            if (typeof window !== 'undefined') {
                if (window.db && typeof window.db.collection === 'function') return window.db;
                if (window.firebase && typeof window.firebase.firestore === 'function') return window.firebase.firestore();
            }
            return null;
        }

        _withTimeout(promise, ms = 3500, label = 'Firestore') {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms))
            ]);
        }

        _readStoredSelectedSeason() {
            try {
                return sessionStorage.getItem(CONFIG.STORAGE_SELECTED_KEY) || null;
            } catch (e) {
                return null;
            }
        }

        _writeStoredSelectedSeason(seasonId) {
            try {
                if (seasonId) sessionStorage.setItem(CONFIG.STORAGE_SELECTED_KEY, String(seasonId));
            } catch (e) {}
        }

        _ensureInitial2026Snapshot() {
            if (typeof window !== 'undefined') {
                if (Array.isArray(window.ClubTeamsData2026) && window.ClubTeamsData2026.length > 0) {
                    return cloneDeep(window.ClubTeamsData2026);
                }
                if (window.ClubTeamsArchive && Array.isArray(window.ClubTeamsArchive['2026']) && window.ClubTeamsArchive['2026'].length > 0) {
                    return cloneDeep(window.ClubTeamsArchive['2026']);
                }
                if (Array.isArray(window.ClubTeamsData) && window.ClubTeamsData.length > 0 && !window._InitialClubTeamsData2026) {
                    window._InitialClubTeamsData2026 = cloneDeep(window.ClubTeamsData);
                }
                if (Array.isArray(window._InitialClubTeamsData2026)) {
                    return cloneDeep(window._InitialClubTeamsData2026);
                }
            }
            return [];
        }

        /**
         * Calcula KPIs resumidos de un array de equipos.
         */
        computeSummary(teams) {
            const list = Array.isArray(teams) ? teams : [];
            let played = 0;
            let wins = 0;
            let top2 = 0;
            let clubPoints = 0;
            const uniquePlayers = new Set();

            list.forEach(t => {
                const rank = parseInt(t.ranking || t.pos, 10) || 0;
                if (rank > 0 && rank <= 2) top2++;
                clubPoints += Number(t.points) || 0;

                const st = t.stats || {};
                const pg = Number(st.pg) || 0;
                const pp = Number(st.pp) || 0;
                const pj = Number(st.pj) || (pg + pp);
                played += pj;
                wins += pg;

                (t.roster || []).forEach(p => {
                    const n = normalizeName(typeof p === 'string' ? p : p.name);
                    if (n) uniquePlayers.add(n);
                });
            });

            return {
                teamsCount: list.length,
                top2Count: top2,
                winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
                clubPoints,
                playersCount: uniquePlayers.size
            };
        }

        /**
         * Carga y devuelve la lista de temporadas desde Firestore (con fallback seguro a 2026).
         */
        async getSeasons(forceRefresh = false) {
            if (this._initialized && !forceRefresh && this.seasons.length > 0) {
                return cloneDeep(this.seasons);
            }

            const db = this._getDb();
            let loaded = [];

            if (db) {
                try {
                    const snap = await this._withTimeout(
                        db.collection(CONFIG.SEASONS_COLLECTION).get(),
                        3500,
                        'team_seasons.get'
                    );
                    if (!snap.empty) {
                        loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    }
                } catch (err) {
                    console.warn('⚠️ [TeamSeasonService] No se pudo leer team_seasons de Firestore, usando caché/fallback:', err.message);
                }
            }

            if (loaded.length === 0) {
                // Intentar caché local si existe
                try {
                    const cached = localStorage.getItem(CONFIG.STORAGE_SEASONS_CACHE);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) loaded = parsed;
                    }
                } catch (e) {}
            }

            if (loaded.length === 0) {
                const base2026 = cloneDeep(DEFAULT_2026_SEASON);
                base2026.summary = this.computeSummary(this._ensureInitial2026Snapshot());
                const demo2027 = cloneDeep(DEMO_2027_SEASON);
                demo2027.summary = this.computeSummary(DEMO_2027_TEAMS);
                loaded = [demo2027, base2026];
            } else {
                // Asegurar que siempre exista al menos la referencia a 2026 si hay datos locales
                const has2026 = loaded.some(s => String(s.id) === '2026');
                if (!has2026 && this._ensureInitial2026Snapshot().length > 0) {
                    const base2026 = cloneDeep(DEFAULT_2026_SEASON);
                    base2026.status = 'archived';
                    base2026.isDefault = false;
                    base2026.summary = this.computeSummary(this._ensureInitial2026Snapshot());
                    loaded.push(base2026);
                }
                const has2027 = loaded.some(s => String(s.id) === '2027');
                if (!has2027) {
                    const demo2027 = cloneDeep(DEMO_2027_SEASON);
                    demo2027.summary = this.computeSummary(DEMO_2027_TEAMS);
                    loaded.push(demo2027);
                }
            }

            // La Temporada 2026 (Ene 2026 - Nov 2026) está oficialmente finalizada y sellada
            const full2026Summary = this.computeSummary(this._ensureInitial2026Snapshot());
            loaded = loaded.map(s => {
                const sid = String(s.id);
                const base = {
                    ...s,
                    id: sid,
                    label: s.label || `Temporada ${sid}`,
                    shortLabel: s.shortLabel || sid
                };
                if (sid === '2026') {
                    const existingCount = base.summary && Number(base.summary.teamsCount) || 0;
                    return {
                        ...base,
                        status: 'archived',
                        period: base.period || 'Ene 2026 – Nov 2026',
                        startDate: base.startDate || '2026-01-01',
                        endDate: base.endDate || '2026-11-30',
                        summary: existingCount >= full2026Summary.teamsCount ? base.summary : full2026Summary
                    };
                }
                return base;
            });

            // Orden descendente (2027, 2026, ...)
            loaded.sort((a, b) => (Number(b.order || b.id) || 0) - (Number(a.order || a.id) || 0));

            this.seasons = loaded;
            this._initialized = true;

            const active = loaded.find(s => s.isDefault) || loaded.find(s => s.status === 'active') || loaded[0];
            this.activeSeasonId = active ? String(active.id) : CONFIG.DEFAULT_LEGACY_SEASON_ID;

            // Si el seleccionado en sesión no existe en la lista, usar la temporada activa
            if (!loaded.some(s => String(s.id) === String(this.selectedSeasonId))) {
                this.selectedSeasonId = this.activeSeasonId;
                this._writeStoredSelectedSeason(this.selectedSeasonId);
            }

            try {
                localStorage.setItem(CONFIG.STORAGE_SEASONS_CACHE, JSON.stringify(loaded));
            } catch (e) {}

            return cloneDeep(this.seasons);
        }

        getSeasonsSync() {
            return cloneDeep(this.seasons);
        }

        getSeasonByIdSync(seasonId) {
            const id = String(seasonId || this.selectedSeasonId || this.activeSeasonId);
            return this.seasons.find(s => String(s.id) === id) || cloneDeep(DEFAULT_2026_SEASON);
        }

        getActiveSeasonId() {
            return String(this.activeSeasonId || CONFIG.DEFAULT_LEGACY_SEASON_ID);
        }

        getSelectedSeasonId() {
            return String(this.selectedSeasonId || this.activeSeasonId || CONFIG.DEFAULT_LEGACY_SEASON_ID);
        }

        isSeasonArchived(seasonId) {
            const s = this.getSeasonByIdSync(seasonId);
            return s && s.status === 'archived';
        }

        setSelectedSeasonId(seasonId, emitEvent = true) {
            const id = String(seasonId || this.activeSeasonId);
            this.selectedSeasonId = id;
            this._writeStoredSelectedSeason(id);
            if (emitEvent && typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('somospadel:season_changed', {
                    detail: { seasonId: id, season: this.getSeasonByIdSync(id) }
                }));
            }
            return id;
        }

        /**
         * Devuelve la temporada inmediatamente anterior a la indicada (para comparar plantillas).
         */
        getPreviousSeasonId(seasonId) {
            const current = this.getSeasonByIdSync(seasonId);
            if (current && current.previousSeasonId) return String(current.previousSeasonId);

            const sorted = [...this.seasons].sort((a, b) => (Number(b.order || b.id) || 0) - (Number(a.order || a.id) || 0));
            const idx = sorted.findIndex(s => String(s.id) === String(seasonId));
            if (idx !== -1 && idx + 1 < sorted.length) {
                return String(sorted[idx + 1].id);
            }
            return null;
        }

        /**
         * Fusiona equipos de Firestore con backup local (solo aplica para la Temporada 2026).
         */
        _mergeWithLocal2026(firestoreTeams) {
            const localBackup = this._ensureInitial2026Snapshot();
            if (!Array.isArray(firestoreTeams) || firestoreTeams.length === 0) {
                return localBackup;
            }
            const merged = cloneDeep(localBackup);
            firestoreTeams.forEach(ft => {
                const idx = merged.findIndex(t => t.id === ft.id);
                if (idx !== -1) {
                    const existingCap = merged[idx].captain;
                    const existingSub = merged[idx].subcaptain;
                    merged[idx] = { ...merged[idx], ...ft };
                    if (!merged[idx].captain || String(merged[idx].captain).includes('Pendiente') || String(merged[idx].captain).includes('definir')) {
                        merged[idx].captain = existingCap || (window.getTeamCaptain ? window.getTeamCaptain(merged[idx]) : 'Por definir');
                    }
                    if (!merged[idx].subcaptain || String(merged[idx].subcaptain).includes('Pendiente') || String(merged[idx].subcaptain).includes('definir')) {
                        merged[idx].subcaptain = existingSub || (window.getTeamSubcaptain ? window.getTeamSubcaptain(merged[idx]) : 'Por definir');
                    }
                } else {
                    merged.push(ft);
                }
            });
            return merged;
        }

        /**
         * Obtiene los equipos de una temporada concreta (lectura puntual).
         */
        async getSeasonTeams(seasonId, forceRefresh = false) {
            const sid = String(seasonId || this.getSelectedSeasonId());
            if (!forceRefresh && Array.isArray(this.teamsBySeasonCache[sid])) {
                return cloneDeep(this.teamsBySeasonCache[sid]);
            }

            const db = this._getDb();
            let teams = [];

            if (db) {
                try {
                    const snap = await this._withTimeout(
                        db.collection(CONFIG.SEASONS_COLLECTION)
                            .doc(sid)
                            .collection(CONFIG.TEAMS_SUBCOLLECTION)
                            .get(),
                        3500,
                        `team_seasons/${sid}/teams.get`
                    );

                    if (!snap.empty) {
                        const docTeams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        teams = sid === '2026' ? this._mergeWithLocal2026(docTeams) : docTeams;
                    } else if (sid === '2026') {
                        // Retrocompatibilidad: leer de club_teams + fallback local 2026
                        const legacySnap = await this._withTimeout(
                            db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).get(),
                            3500,
                            'club_teams.get'
                        );
                        const legacyTeams = legacySnap.empty ? [] : legacySnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        teams = this._mergeWithLocal2026(legacyTeams);
                    } else if (sid === '2027') {
                        teams = cloneDeep(DEMO_2027_TEAMS);
                    }
                } catch (err) {
                    console.warn(`⚠️ [TeamSeasonService] Error cargando equipos de temporada ${sid}:`, err.message);
                    if (sid === '2026') {
                        teams = this._ensureInitial2026Snapshot();
                    } else if (sid === '2027') {
                        teams = cloneDeep(DEMO_2027_TEAMS);
                    }
                }
            } else if (sid === '2026') {
                teams = this._ensureInitial2026Snapshot();
            } else if (sid === '2027') {
                teams = cloneDeep(DEMO_2027_TEAMS);
            }

            this.teamsBySeasonCache[sid] = cloneDeep(teams);
            return cloneDeep(teams);
        }

        /**
         * Suscripción en tiempo real a los equipos de una temporada.
         */
        subscribeSeasonTeams(seasonId, callback) {
            const sid = String(seasonId || this.getSelectedSeasonId());
            const db = this._getDb();

            // Emisión instantánea si hay caché o si es 2026 con datos locales
            if (Array.isArray(this.teamsBySeasonCache[sid])) {
                callback(cloneDeep(this.teamsBySeasonCache[sid]));
            } else if (sid === '2026') {
                const local2026 = this._ensureInitial2026Snapshot();
                if (local2026.length > 0) callback(local2026);
            }

            if (!db) {
                return () => {};
            }

            let legacyUnsub = null;
            const seasonTeamsRef = db.collection(CONFIG.SEASONS_COLLECTION)
                .doc(sid)
                .collection(CONFIG.TEAMS_SUBCOLLECTION);

            const mainUnsub = seasonTeamsRef.onSnapshot((snap) => {
                if (!snap.empty) {
                    if (legacyUnsub) {
                        try { legacyUnsub(); } catch (e) {}
                        legacyUnsub = null;
                    }
                    const rawList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    const list = sid === '2026' ? this._mergeWithLocal2026(rawList) : rawList;
                    this.teamsBySeasonCache[sid] = cloneDeep(list);
                    callback(list);
                } else if (sid === '2026') {
                    // Fallback en tiempo real a club_teams mientras no esté archivada 2026
                    if (!legacyUnsub) {
                        legacyUnsub = db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).onSnapshot((legacySnap) => {
                            const legacyList = legacySnap.empty ? [] : legacySnap.docs.map(d => ({ id: d.id, ...d.data() }));
                            const merged = this._mergeWithLocal2026(legacyList);
                            this.teamsBySeasonCache[sid] = cloneDeep(merged);
                            callback(merged);
                        }, (err) => {
                            console.error('❌ [TeamSeasonService] Error en listener legacy club_teams:', err);
                        });
                    }
                } else if (sid === '2027') {
                    const demo = cloneDeep(DEMO_2027_TEAMS);
                    this.teamsBySeasonCache[sid] = demo;
                    callback(demo);
                } else {
                    this.teamsBySeasonCache[sid] = [];
                    callback([]);
                }
            }, (err) => {
                console.error(`❌ [TeamSeasonService] Error en listener temporada ${sid}:`, err);
            });

            return () => {
                try { mainUnsub(); } catch (e) {}
                if (legacyUnsub) {
                    try { legacyUnsub(); } catch (e) {}
                }
            };
        }

        /**
         * Congela (archiva) la Temporada 2026 actual en `team_seasons/2026` + subcolección `teams`.
         */
        async archiveSeason2026(customTeams = null) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');

            let teams = Array.isArray(customTeams) ? cloneDeep(customTeams) : null;
            if (!teams || teams.length === 0) {
                const legacySnap = await db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).get();
                const legacyList = legacySnap.empty ? [] : legacySnap.docs.map(d => ({ id: d.id, ...d.data() }));
                teams = this._mergeWithLocal2026(legacyList);
            }

            if (!teams || teams.length === 0) {
                throw new Error('No se encontraron equipos de la Temporada 2026 para archivar.');
            }

            const nowIso = new Date().toISOString();
            const seasonRef = db.collection(CONFIG.SEASONS_COLLECTION).doc('2026');
            const summary = this.computeSummary(teams);

            await seasonRef.set({
                id: '2026',
                label: 'Temporada 2026',
                shortLabel: '2026',
                period: 'Ene 2026 – Nov 2026',
                startDate: '2026-01-01',
                endDate: '2026-11-30',
                leagueName: CONFIG.DEFAULT_LEAGUE_NAME,
                status: 'archived',
                isDefault: false,
                order: 2026,
                previousSeasonId: null,
                archivedAt: nowIso,
                updatedAt: nowIso,
                summary
            }, { merge: true });

            const batch = db.batch();
            teams.forEach(team => {
                const tid = String(team.id || '').trim();
                if (!tid) return;
                const cleanRoster = (team.roster || []).map(p => {
                    const obj = typeof p === 'string' ? { name: p, pts: 0 } : { ...p };
                    return {
                        name: obj.name || 'Jugador',
                        pts: Number(obj.pts) || 0,
                        uid: obj.uid || null,
                        seasonStatus: obj.seasonStatus || 'participante'
                    };
                });
                const docRef = seasonRef.collection(CONFIG.TEAMS_SUBCOLLECTION).doc(tid);
                batch.set(docRef, {
                    ...team,
                    id: tid,
                    seasonId: '2026',
                    roster: cleanRoster,
                    archivedAt: nowIso
                });
            });
            await batch.commit();

            this.teamsBySeasonCache['2026'] = cloneDeep(teams);
            await this.getSeasons(true);
            return { seasonId: '2026', teamsCount: teams.length, summary };
        }

        /**
         * Crea una nueva temporada (ej: Temporada 2027) clonando opcionalmente equipos y plantillas.
         */
        async createSeason({ id, label, leagueName, cloneFromSeasonId = '2026', copyRoster = true, setActive = false }) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');

            const sid = String(id || '').trim();
            if (!sid) throw new Error('El ID de temporada es obligatorio (ej: 2027).');

            const nowIso = new Date().toISOString();
            const seasonRef = db.collection(CONFIG.SEASONS_COLLECTION).doc(sid);

            let baseTeams = [];
            if (cloneFromSeasonId) {
                const sourceTeams = await this.getSeasonTeams(cloneFromSeasonId, true);
                baseTeams = sourceTeams.map(t => ({
                    id: t.id,
                    name: t.name,
                    category: t.category || 'Masculina',
                    division: t.division || 'Tercera',
                    group: `Pendiente asignación ${sid}`,
                    captain: t.captain || 'Por definir',
                    subcaptain: t.subcaptain || 'Por definir',
                    logo: t.logo || 'img/logo_somospadel.png',
                    ranking: 0,
                    points: 0,
                    stats: { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0 },
                    standings: [],
                    schedule: [],
                    seasonId: sid,
                    roster: copyRoster
                        ? (t.roster || []).map(p => ({
                            name: typeof p === 'string' ? p : (p.name || 'Jugador'),
                            pts: 0,
                            uid: (typeof p === 'object' && p.uid) ? p.uid : null,
                            seasonStatus: 'renovado'
                        }))
                        : []
                }));
            }

            const summary = this.computeSummary(baseTeams);
            const numericOrder = parseInt(sid.replace(/\D/g, ''), 10) || Date.now();

            await seasonRef.set({
                id: sid,
                label: label || `Temporada ${sid}`,
                shortLabel: sid,
                leagueName: leagueName || CONFIG.DEFAULT_LEAGUE_NAME,
                status: setActive ? 'active' : 'draft',
                isDefault: !!setActive,
                order: numericOrder,
                previousSeasonId: cloneFromSeasonId || null,
                createdAt: nowIso,
                updatedAt: nowIso,
                summary
            }, { merge: true });

            if (baseTeams.length > 0) {
                const batch = db.batch();
                baseTeams.forEach(t => {
                    batch.set(seasonRef.collection(CONFIG.TEAMS_SUBCOLLECTION).doc(t.id), t);
                });
                await batch.commit();
            }

            if (setActive) {
                await this.setActiveSeason(sid);
            } else {
                await this.getSeasons(true);
            }

            this.teamsBySeasonCache[sid] = cloneDeep(baseTeams);
            return { seasonId: sid, teamsCount: baseTeams.length };
        }

        /**
         * Activa una temporada como temporada en curso (default en la app) y sincroniza `club_teams`.
         */
        async setActiveSeason(seasonId) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');

            const sid = String(seasonId);
            const seasons = await this.getSeasons(true);
            const nowIso = new Date().toISOString();

            const batch = db.batch();
            seasons.forEach(s => {
                const ref = db.collection(CONFIG.SEASONS_COLLECTION).doc(String(s.id));
                if (String(s.id) === sid) {
                    batch.set(ref, { status: 'active', isDefault: true, updatedAt: nowIso }, { merge: true });
                } else {
                    const nextStatus = s.status === 'active' ? 'archived' : (s.status || 'archived');
                    batch.set(ref, { status: nextStatus, isDefault: false, updatedAt: nowIso }, { merge: true });
                }
            });
            await batch.commit();

            // Reflejar equipos de la nueva temporada activa en `club_teams` (compatibilidad con módulos legados)
            const activeTeams = await this.getSeasonTeams(sid, true);
            await this._mirrorTeamsToLegacyCollection(activeTeams, sid);

            this.activeSeasonId = sid;
            this.setSelectedSeasonId(sid, true);
            await this.getSeasons(true);
            return sid;
        }

        /**
         * Refleja los equipos de la temporada activa en `club_teams` para mantener compatibilidad.
         */
        async _mirrorTeamsToLegacyCollection(teams, seasonId) {
            const db = this._getDb();
            if (!db || !Array.isArray(teams)) return;
            try {
                const legacySnap = await db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).get();
                const batch = db.batch();
                legacySnap.docs.forEach(doc => batch.delete(doc.ref));
                teams.forEach(t => {
                    if (!t || !t.id) return;
                    batch.set(db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).doc(t.id), {
                        ...t,
                        seasonId: String(seasonId)
                    });
                });
                await batch.commit();
            } catch (err) {
                console.warn('⚠️ [TeamSeasonService] Aviso reflejando en club_teams:', err.message);
            }
        }

        /**
         * Guarda o actualiza un equipo dentro de una temporada y recalcula el summary de la temporada.
         */
        async saveTeamToSeason(seasonId, teamData) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');

            const sid = String(seasonId);
            const tid = String(teamData.id || '').trim();
            if (!tid) throw new Error('ID de equipo requerido.');

            const nowIso = new Date().toISOString();
            const payload = {
                ...teamData,
                id: tid,
                seasonId: sid,
                updatedAt: nowIso
            };

            await db.collection(CONFIG.SEASONS_COLLECTION)
                .doc(sid)
                .collection(CONFIG.TEAMS_SUBCOLLECTION)
                .doc(tid)
                .set(payload, { merge: true });

            // Si es la temporada activa, actualizar también club_teams
            if (sid === this.getActiveSeasonId()) {
                await db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).doc(tid).set(payload, { merge: true });
            }

            const updatedTeams = await this.getSeasonTeams(sid, true);
            const summary = this.computeSummary(updatedTeams);
            await db.collection(CONFIG.SEASONS_COLLECTION).doc(sid).set({
                summary,
                updatedAt: nowIso
            }, { merge: true });

            await this.getSeasons(true);
            return payload;
        }

        /**
         * Elimina un equipo de una temporada concreta.
         */
        async deleteTeamFromSeason(seasonId, teamId) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');

            const sid = String(seasonId);
            await db.collection(CONFIG.SEASONS_COLLECTION)
                .doc(sid)
                .collection(CONFIG.TEAMS_SUBCOLLECTION)
                .doc(String(teamId))
                .delete();

            if (sid === this.getActiveSeasonId()) {
                try {
                    await db.collection(CONFIG.LEGACY_TEAMS_COLLECTION).doc(String(teamId)).delete();
                } catch (e) {}
            }

            const updatedTeams = await this.getSeasonTeams(sid, true);
            await db.collection(CONFIG.SEASONS_COLLECTION).doc(sid).set({
                summary: this.computeSummary(updatedTeams),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            await this.getSeasons(true);
        }

        /**
         * Sincroniza datos extraídos por el Robot Summapadel (`ExtractedTeamsData`) SOLO a la temporada activa.
         * Nunca sobrescribe temporadas archivadas.
         */
        async syncBotDataToSeason(extractedTeams, targetSeasonId = null) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');
            if (!Array.isArray(extractedTeams) || extractedTeams.length === 0) {
                throw new Error('No hay equipos válidos en el archivo del bot.');
            }

            await this.getSeasons(true);
            const sid = String(targetSeasonId || this.getActiveSeasonId());
            const targetSeason = this.getSeasonByIdSync(sid);

            if (targetSeason && targetSeason.status === 'archived') {
                throw new Error(`La ${targetSeason.label || sid} está ARCHIVADA (solo lectura). Activa primero la temporada en curso antes de sincronizar el robot.`);
            }

            const seasonRef = db.collection(CONFIG.SEASONS_COLLECTION).doc(sid);
            const subRef = seasonRef.collection(CONFIG.TEAMS_SUBCOLLECTION);
            const existingSnap = await subRef.get();
            const existingMap = {};
            existingSnap.docs.forEach(d => { existingMap[d.id] = d.data(); });

            const nowIso = new Date().toISOString();
            const batch = db.batch();

            const finalTeams = extractedTeams.map(equipo => {
                const prev = existingMap[equipo.id] || {};
                // Conservar etiquetas de temporada (renovado/fichaje/cambio_equipo) de jugadores ya configurados
                const prevStatusByNorm = {};
                (prev.roster || []).forEach(p => {
                    const n = normalizeName(p.name);
                    if (n && p.seasonStatus) prevStatusByNorm[n] = p.seasonStatus;
                });

                const mergedRoster = (equipo.roster || []).map(p => {
                    const name = typeof p === 'string' ? p : (p.name || 'Jugador');
                    const n = normalizeName(name);
                    return {
                        ...(typeof p === 'object' ? p : { name, pts: 0 }),
                        seasonStatus: (typeof p === 'object' && p.seasonStatus) || prevStatusByNorm[n] || 'participante'
                    };
                });

                const mergedTeam = {
                    ...prev,
                    ...equipo,
                    seasonId: sid,
                    roster: mergedRoster,
                    updatedAt: nowIso
                };

                batch.set(subRef.doc(equipo.id), mergedTeam);
                return mergedTeam;
            });

            batch.set(seasonRef, {
                id: sid,
                label: (targetSeason && targetSeason.label) || `Temporada ${sid}`,
                shortLabel: sid,
                leagueName: (targetSeason && targetSeason.leagueName) || CONFIG.DEFAULT_LEAGUE_NAME,
                status: 'active',
                isDefault: true,
                order: parseInt(sid.replace(/\D/g, ''), 10) || 2026,
                summary: this.computeSummary(finalTeams),
                updatedAt: nowIso
            }, { merge: true });

            await batch.commit();

            if (sid === this.getActiveSeasonId()) {
                await this._mirrorTeamsToLegacyCollection(finalTeams, sid);
            }

            this.teamsBySeasonCache[sid] = cloneDeep(finalTeams);
            await this.getSeasons(true);
            return { seasonId: sid, count: finalTeams.length };
        }

        /**
         * Motor de comparación de plantillas entre una temporada y su temporada anterior.
         * Calcula: Renovados, Cambios de Equipo, Nuevos Fichajes y Bajas (global y por equipo).
         */
        computeSeasonMovements(currentTeams, previousTeams) {
            const curr = Array.isArray(currentTeams) ? currentTeams : [];
            const prev = Array.isArray(previousTeams) ? previousTeams : [];

            const prevByPlayer = {}; // normName -> { name, teams: [{ id, name }] }
            const currByPlayer = {}; // normName -> { name, teams: [{ id, name, pts, seasonStatus }] }

            prev.forEach(t => {
                (t.roster || []).forEach(p => {
                    const name = typeof p === 'string' ? p : (p.name || '');
                    const norm = normalizeName(name);
                    if (!norm) return;
                    if (!prevByPlayer[norm]) prevByPlayer[norm] = { name, norm, teams: [] };
                    if (!prevByPlayer[norm].teams.some(x => x.id === t.id)) {
                        prevByPlayer[norm].teams.push({ id: t.id, name: t.name, pts: Number(p.pts) || 0 });
                    }
                });
            });

            curr.forEach(t => {
                (t.roster || []).forEach(p => {
                    const name = typeof p === 'string' ? p : (p.name || '');
                    const norm = normalizeName(name);
                    if (!norm) return;
                    if (!currByPlayer[norm]) currByPlayer[norm] = { name, norm, teams: [] };
                    if (!currByPlayer[norm].teams.some(x => x.id === t.id)) {
                        currByPlayer[norm].teams.push({
                            id: t.id,
                            name: t.name,
                            pts: Number(p.pts) || 0,
                            seasonStatus: (typeof p === 'object' && p.seasonStatus) ? p.seasonStatus : null
                        });
                    }
                });
            });

            const byTeam = {};
            curr.forEach(t => {
                byTeam[t.id] = {
                    teamId: t.id,
                    teamName: t.name,
                    stayed: [],
                    joined: [],
                    switchedIn: [],
                    left: [],
                    switchedOut: []
                };
            });
            prev.forEach(t => {
                if (!byTeam[t.id]) {
                    byTeam[t.id] = {
                        teamId: t.id,
                        teamName: t.name,
                        stayed: [],
                        joined: [],
                        switchedIn: [],
                        left: [],
                        switchedOut: []
                    };
                }
            });

            const playersReport = [];
            let stayedCount = 0;
            let joinedCount = 0;
            let switchedCount = 0;
            let leftCount = 0;

            const hasPrevious = prev.length > 0;

            // 1. Analizar jugadores presentes en la temporada actual
            Object.keys(currByPlayer).forEach(norm => {
                const c = currByPlayer[norm];
                const p = prevByPlayer[norm];

                if (!hasPrevious) {
                    // Primera temporada registrada (ej. 2026 sin 2025)
                    c.teams.forEach(ct => {
                        byTeam[ct.id].stayed.push({ name: c.name, pts: ct.pts, status: 'participante' });
                    });
                    stayedCount++;
                    playersReport.push({
                        name: c.name,
                        status: 'participante',
                        currentTeams: c.teams.map(x => x.name),
                        previousTeams: [],
                        currentTeamIds: c.teams.map(x => x.id),
                        previousTeamIds: []
                    });
                    return;
                }

                if (!p) {
                    // Fichaje nuevo
                    joinedCount++;
                    c.teams.forEach(ct => {
                        byTeam[ct.id].joined.push({ name: c.name, pts: ct.pts, status: 'fichaje' });
                    });
                    playersReport.push({
                        name: c.name,
                        status: 'fichaje',
                        currentTeams: c.teams.map(x => x.name),
                        previousTeams: [],
                        currentTeamIds: c.teams.map(x => x.id),
                        previousTeamIds: []
                    });
                } else {
                    const prevIds = p.teams.map(x => x.id);
                    const currIds = c.teams.map(x => x.id);
                    const sameSomeTeam = currIds.some(id => prevIds.includes(id));

                    c.teams.forEach(ct => {
                        if (prevIds.includes(ct.id)) {
                            byTeam[ct.id].stayed.push({ name: c.name, pts: ct.pts, status: 'renovado' });
                        } else {
                            byTeam[ct.id].switchedIn.push({
                                name: c.name,
                                pts: ct.pts,
                                status: 'cambio_equipo',
                                fromTeams: p.teams.map(x => x.name)
                            });
                        }
                    });

                    p.teams.forEach(pt => {
                        if (!currIds.includes(pt.id) && byTeam[pt.id]) {
                            byTeam[pt.id].switchedOut.push({
                                name: c.name,
                                pts: pt.pts,
                                status: 'cambio_equipo',
                                toTeams: c.teams.map(x => x.name)
                            });
                        }
                    });

                    if (sameSomeTeam) {
                        stayedCount++;
                        playersReport.push({
                            name: c.name,
                            status: 'renovado',
                            currentTeams: c.teams.map(x => x.name),
                            previousTeams: p.teams.map(x => x.name),
                            currentTeamIds: currIds,
                            previousTeamIds: prevIds
                        });
                    } else {
                        switchedCount++;
                        playersReport.push({
                            name: c.name,
                            status: 'cambio_equipo',
                            currentTeams: c.teams.map(x => x.name),
                            previousTeams: p.teams.map(x => x.name),
                            currentTeamIds: currIds,
                            previousTeamIds: prevIds
                        });
                    }
                }
            });

            // 2. Analizar bajas (estuvieron en la anterior y no están en la actual)
            if (hasPrevious) {
                Object.keys(prevByPlayer).forEach(norm => {
                    if (!currByPlayer[norm]) {
                        const p = prevByPlayer[norm];
                        leftCount++;
                        p.teams.forEach(pt => {
                            if (byTeam[pt.id]) {
                                byTeam[pt.id].left.push({ name: p.name, pts: pt.pts, status: 'baja' });
                            }
                        });
                        playersReport.push({
                            name: p.name,
                            status: 'baja',
                            currentTeams: [],
                            previousTeams: p.teams.map(x => x.name),
                            currentTeamIds: [],
                            previousTeamIds: p.teams.map(x => x.id)
                        });
                    }
                });
            }

            const totalPrevious = Object.keys(prevByPlayer).length;
            const totalCurrent = Object.keys(currByPlayer).length;
            const retainedTotal = stayedCount + switchedCount;
            const retentionRate = (hasPrevious && totalPrevious > 0)
                ? Math.round((retainedTotal / totalPrevious) * 100)
                : 100;

            return {
                hasPrevious,
                global: {
                    totalCurrent,
                    totalPrevious,
                    stayedCount,
                    switchedCount,
                    joinedCount,
                    leftCount,
                    retainedTotal,
                    retentionRate
                },
                byTeam,
                players: playersReport.sort((a, b) => a.name.localeCompare(b.name, 'es'))
            };
        }

        /**
         * Sincroniza `teamHistory[seasonId]` (y `teams_somospadel` si es temporada activa) en `players`.
         */
        async syncPlayersSeasonHistory(seasonId, teams) {
            const db = this._getDb();
            if (!db || !Array.isArray(teams)) return { matched: 0 };

            const sid = String(seasonId);
            const isActive = sid === this.getActiveSeasonId();
            const playersSnap = await db.collection('players').get();
            if (playersSnap.empty) return { matched: 0 };

            // Construir mapa normName -> [{ id, name }]
            const rosterMap = {};
            teams.forEach(t => {
                (t.roster || []).forEach(p => {
                    const name = typeof p === 'string' ? p : (p.name || '');
                    const norm = normalizeName(name);
                    if (!norm) return;
                    if (!rosterMap[norm]) rosterMap[norm] = [];
                    if (!rosterMap[norm].some(x => x.id === t.id)) {
                        rosterMap[norm].push({ id: t.id, name: t.name, shortName: t.name.replace(/SOMOS\s*P[AÁ]DEL\s*BCN\s*/i, '').trim() });
                    }
                });
            });

            let matched = 0;
            let batch = db.batch();
            let ops = 0;

            for (const doc of playersSnap.docs) {
                const data = doc.data() || {};
                const norm = normalizeName(data.name || data.displayName || '');
                const assigned = rosterMap[norm];

                if (assigned && assigned.length > 0) {
                    const history = { ...(data.teamHistory || {}) };
                    history[sid] = {
                        teams: assigned.map(x => x.id),
                        teamNames: assigned.map(x => x.name),
                        status: isActive ? 'active' : 'completed',
                        updatedAt: new Date().toISOString()
                    };

                    const updateObj = { teamHistory: history };
                    if (isActive) {
                        updateObj.teams_somospadel = assigned.map(x => x.shortName || x.name);
                        updateObj.team_somospadel = assigned[0].shortName || assigned[0].name;
                    }

                    batch.set(doc.ref, updateObj, { merge: true });
                    matched++;
                    ops++;

                    if (ops >= 400) {
                        await batch.commit();
                        batch = db.batch();
                        ops = 0;
                    }
                }
            }

            if (ops > 0) {
                await batch.commit();
            }

            return { matched };
        }

        /**
         * Aplica masivamente un paquete de temporada generado desde Excel (`season_2027_import_payload.json`):
         * - Crea nuevos jugadores en `players` con rol `player_somospadel` (o `captain`) y su equipo 2027.
         * - Actualiza jugadores existentes que siguen o cambian de equipo + guarda `teamHistory`.
         * - Retira el permiso de jugador de equipo (`teams_somospadel: []`, rol `player`) a las bajas de 2026
         *   (respetando siempre roles staff: admin, superadmin, organizador) conservando su histórico de 2026.
         * - Con `dryRun: true`, devuelve la vista previa exacta sin modificar Firestore.
         */
        async applyBulkSeasonImport(payload, { dryRun = true, activateSeason = false } = {}) {
            const db = this._getDb();
            if (!db) throw new Error('Firestore no está disponible.');
            if (!payload || !payload.seasonId || !Array.isArray(payload.teams)) {
                throw new Error('Paquete de importación inválido (faltan seasonId o teams).');
            }

            const sid = String(payload.seasonId).trim();
            const prevSid = String(payload.previousSeasonId || '2026').trim();
            const staffRoles = new Set(['admin', 'admin_player', 'super_admin', 'superadmin', 'organizador', 'organizer', 'organizador_bcn', 'organizer_bcn']);
            const normPhone = (p) => {
                let d = String(p || '').replace(/\D+/g, '');
                if (d.length > 9 && d.startsWith('34')) d = d.slice(2);
                return d;
            };

            const playersSnap = await this._withTimeout(db.collection('players').get(), 8000, 'players.get');
            const byPhone = {};
            const byName = {};
            const allExistingDocs = [];

            playersSnap.docs.forEach(doc => {
                const data = doc.data() || {};
                const rec = { id: doc.id, ref: doc.ref, data };
                allExistingDocs.push(rec);
                const ph = normPhone(data.phone || data.telefono || data.whatsapp);
                const nm = normalizeName(data.name || data.displayName);
                if (ph && ph.length >= 9) byPhone[ph] = rec;
                if (nm) byName[nm] = rec;
            });

            // Índice de jugadores de 2026 (archivo inmutable)
            const teams2026 = await this.getSeasonTeams(prevSid);
            const prevRosterByName = {};
            teams2026.forEach(t => {
                (t.roster || []).forEach(p => {
                    const nm = normalizeName(typeof p === 'string' ? p : p.name);
                    if (!nm) return;
                    if (!prevRosterByName[nm]) prevRosterByName[nm] = { ids: [], names: [] };
                    if (!prevRosterByName[nm].ids.includes(t.id)) {
                        prevRosterByName[nm].ids.push(t.id);
                        prevRosterByName[nm].names.push(t.name);
                    }
                });
            });

            // Construir directorio de jugadores entrantes del paquete 2027
            const incomingList = Array.isArray(payload.playersDirectory) && payload.playersDirectory.length > 0
                ? payload.playersDirectory
                : (() => {
                    const map = {};
                    payload.teams.forEach(t => {
                        (t.roster || []).forEach(p => {
                            const name = typeof p === 'string' ? p : p.name;
                            const nm = normalizeName(name);
                            if (!nm) return;
                            if (!map[nm]) map[nm] = { name, teams: [], teamNames: [], isCaptain: false };
                            if (!map[nm].teams.includes(t.id)) {
                                map[nm].teams.push(t.id);
                                map[nm].teamNames.push(t.name);
                            }
                        });
                    });
                    return Object.values(map);
                })();

            const incomingByName = {};
            const toCreate = [];
            const toUpdate = [];
            const toRevoke = [];

            incomingList.forEach(p => {
                const nm = normalizeName(p.name);
                if (!nm) return;
                incomingByName[nm] = p;

                const ph = normPhone(p.phone);
                const match = (ph && byPhone[ph]) || byName[nm] || null;
                const shortTeams = (p.teamNames || p.teams || []).map(n => String(n).replace(/SOMOS\s*P[AÁ]DEL\s*BCN\s*/i, '').trim());

                if (!match) {
                    toCreate.push({
                        name: p.name,
                        phone: ph || '',
                        email: p.email || '',
                        level: p.level || 3.0,
                        gender: p.gender || '',
                        role: p.isCaptain ? 'captain' : 'player_somospadel',
                        status: 'active',
                        teams_somospadel: shortTeams,
                        team_somospadel: shortTeams[0] || '',
                        teamHistory: {
                            [sid]: {
                                teams: p.teams || [],
                                teamNames: p.teamNames || [],
                                status: 'active',
                                updatedAt: new Date().toISOString()
                            }
                        },
                        source: `season_${sid}_excel_import`,
                        createdAt: new Date().toISOString()
                    });
                } else {
                    const currentRole = String(match.data.role || 'player').toLowerCase().trim();
                    const nextRole = staffRoles.has(currentRole)
                        ? match.data.role
                        : (p.isCaptain ? 'captain' : 'player_somospadel');

                    const history = { ...(match.data.teamHistory || {}) };
                    if (prevRosterByName[nm] && !history[prevSid]) {
                        history[prevSid] = {
                            teams: prevRosterByName[nm].ids,
                            teamNames: prevRosterByName[nm].names,
                            status: 'completed'
                        };
                    }
                    history[sid] = {
                        teams: p.teams || [],
                        teamNames: p.teamNames || [],
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    };

                    toUpdate.push({
                        docId: match.id,
                        ref: match.ref,
                        name: match.data.name || p.name,
                        update: {
                            role: nextRole,
                            teams_somospadel: shortTeams,
                            team_somospadel: shortTeams[0] || '',
                            teamHistory: history
                        }
                    });
                }
            });

            // Detectar bajas: estaban en 2026 o tenían rol/equipo somospadel pero NO están en el Excel 2027
            allExistingDocs.forEach(rec => {
                const nm = normalizeName(rec.data.name || rec.data.displayName);
                if (!nm || incomingByName[nm]) return;

                const currentRole = String(rec.data.role || '').toLowerCase().trim();
                const hadTeamField = (Array.isArray(rec.data.teams_somospadel) && rec.data.teams_somospadel.length > 0) || Boolean(rec.data.team_somospadel);
                const wasIn2026 = Boolean(prevRosterByName[nm]);
                const hadTeamRole = currentRole === 'player_somospadel' || currentRole === 'captain';

                if (wasIn2026 || hadTeamField || hadTeamRole) {
                    const history = { ...(rec.data.teamHistory || {}) };
                    if (wasIn2026 && !history[prevSid]) {
                        history[prevSid] = {
                            teams: prevRosterByName[nm].ids,
                            teamNames: prevRosterByName[nm].names,
                            status: 'completed'
                        };
                    }
                    const nextRole = staffRoles.has(currentRole)
                        ? rec.data.role
                        : (hadTeamRole ? 'player' : (rec.data.role || 'player'));

                    toRevoke.push({
                        docId: rec.id,
                        ref: rec.ref,
                        name: rec.data.name || rec.data.displayName || rec.id,
                        previousRole: rec.data.role || 'player',
                        nextRole,
                        update: {
                            role: nextRole,
                            teams_somospadel: [],
                            team_somospadel: '',
                            teamHistory: history
                        }
                    });
                }
            });

            const report = {
                dryRun,
                seasonId: sid,
                teamsCount: payload.teams.length,
                createCount: toCreate.length,
                updateCount: toUpdate.length,
                revokeCount: toRevoke.length,
                sampleCreate: toCreate.slice(0, 15).map(x => x.name),
                sampleRevoke: toRevoke.slice(0, 15).map(x => `${x.name} (${x.previousRole} → ${x.nextRole})`)
            };

            if (dryRun) {
                return report;
            }

            // 1. Asegurar que Temporada 2026 queda archivada en Firestore para siempre
            await this.archiveSeason2026();

            // 2. Guardar la nueva temporada y sus equipos
            const nowIso = new Date().toISOString();
            const seasonRef = db.collection(CONFIG.SEASONS_COLLECTION).doc(sid);
            await seasonRef.set({
                id: sid,
                label: payload.label || `Temporada ${sid}`,
                shortLabel: sid,
                leagueName: payload.leagueName || CONFIG.DEFAULT_LEAGUE_NAME,
                status: activateSeason ? 'active' : 'draft',
                isDefault: !!activateSeason,
                order: parseInt(sid.replace(/\D/g, ''), 10) || Date.now(),
                previousSeasonId: prevSid,
                summary: this.computeSummary(payload.teams),
                updatedAt: nowIso
            }, { merge: true });

            const teamBatch = db.batch();
            payload.teams.forEach(t => {
                teamBatch.set(seasonRef.collection(CONFIG.TEAMS_SUBCOLLECTION).doc(t.id), {
                    ...t,
                    seasonId: sid,
                    updatedAt: nowIso
                });
            });
            await teamBatch.commit();

            // 3. Aplicar altas, actualizaciones y revocaciones en `players` por lotes de 400
            const opsList = [
                ...toCreate.map(data => ({ type: 'create', data })),
                ...toUpdate.map(item => ({ type: 'update', ref: item.ref, data: item.update })),
                ...toRevoke.map(item => ({ type: 'update', ref: item.ref, data: item.update }))
            ];

            for (let i = 0; i < opsList.length; i += 400) {
                const chunk = opsList.slice(i, i + 400);
                const batch = db.batch();
                chunk.forEach(op => {
                    if (op.type === 'create') {
                        const newRef = db.collection('players').doc();
                        batch.set(newRef, { ...op.data, id: newRef.id });
                    } else {
                        batch.set(op.ref, op.data, { merge: true });
                    }
                });
                await batch.commit();
            }

            if (activateSeason) {
                await this.setActiveSeason(sid);
            } else {
                await this.getSeasons(true);
            }

            return report;
        }

        /**
         * Exporta el registro de movimientos de jugadores entre temporadas a CSV.
         */
        exportMovementsCSV(seasonLabel, prevLabel, movements) {
            if (!movements || !Array.isArray(movements.players)) return;
            const statusLabels = {
                renovado: 'Renovado',
                fichaje: 'Nuevo Fichaje',
                cambio_equipo: 'Cambio de Equipo',
                baja: 'Baja',
                participante: 'Participante'
            };

            const rows = [
                ['Jugador', 'Estado', `Equipo ${seasonLabel}`, `Equipo ${prevLabel || 'Anterior'}`]
            ];

            movements.players.forEach(p => {
                rows.push([
                    `"${String(p.name || '').replace(/"/g, '""')}"`,
                    `"${statusLabels[p.status] || p.status}"`,
                    `"${(p.currentTeams || []).join(' / ').replace(/"/g, '""')}"`,
                    `"${(p.previousTeams || []).join(' / ').replace(/"/g, '""')}"`
                ]);
            });

            const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `registro_jugadores_${String(seasonLabel || 'temporada').replace(/\s+/g, '_').toLowerCase()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    const serviceInstance = new TeamSeasonService();
    serviceInstance.officialCaptains2027 = OFFICIAL_CAPTAINS_2027;
    global.TeamSeasonService = serviceInstance;
    console.log('📅 [TeamSeasonService] Servicio Multi-Temporada inicializado.');
})(typeof window !== 'undefined' ? window : globalThis);
