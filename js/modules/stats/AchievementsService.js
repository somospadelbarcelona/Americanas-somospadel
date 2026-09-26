/**
 * AchievementsService.js
 * Motor de Gamificación, Logros (Badges) y Misiones Semanales de SomosPádel BCN.
 * 
 * Funcionalidades:
 * 1. Catálogo Oficial de Logros con tiers, XP, categorías y evaluadores reactivos.
 * 2. Misiones Semanales Dinámicas rotadas por semana ISO (con cálculo de tiempo y progreso).
 * 3. Evaluación integral de estado de jugador (desbloqueados vs en progreso).
 * 4. Persistencia híbrida defensiva (localStorage caché instantánea + Firestore `users/{uid}/gamification`).
 * 5. Notificación reactiva mediante evento custom 'onAchievementUnlocked' con fanfarria y detalles.
 * 
 * Compatible con carga diferida en index.html y exposición global en `window.AchievementsService`.
 */

(function (global) {
    'use strict';

    // Constantes de configuración
    const CONFIG = {
        STORAGE_PREFIX: 'sp_gamification_',
        FIRESTORE_COLLECTION: 'users',
        FIRESTORE_SUBCOLLECTION: 'gamification',
        EVENT_UNLOCKED: 'onAchievementUnlocked',
        EVENT_MISSION_COMPLETED: 'onWeeklyMissionCompleted',
        TIERS: {
            BRONZE: 'bronze',
            SILVER: 'silver',
            GOLD: 'gold',
            DIAMOND: 'diamond'
        },
        CATEGORIES: {
            MATCH: 'match',
            STREAK: 'streak',
            LOYALTY: 'loyalty',
            LEVEL: 'level',
            SPECIAL: 'special'
        },
        LEVEL_THRESHOLDS: [
            { level: 1, title: 'Iniciado del Club', minXp: 0, icon: '🥉' },
            { level: 2, title: 'Jugador Promesa', minXp: 200, icon: '🥈' },
            { level: 3, title: 'Competidor Habitual', minXp: 500, icon: '🥇' },
            { level: 4, title: 'Veterano de Pista', minXp: 1000, icon: '🏆' },
            { level: 5, title: 'Maestro de la Red', minXp: 1800, icon: '⚡' },
            { level: 6, title: 'Élite SomosPadel', minXp: 3000, icon: '💎' },
            { level: 7, title: 'Leyenda de Oro', minXp: 5000, icon: '👑' }
        ]
    };

    /**
     * Catálogo Oficial de Logros / Insignias
     */
    const BADGES_CATALOG = [
        {
            id: 'rey_del_pozo',
            title: 'Rey del Pozo',
            description: 'Ganar 3 partidos seguidos o disputar partidos en la Pista 1.',
            icon: '👑',
            category: CONFIG.CATEGORIES.SPECIAL,
            tier: CONFIG.TIERS.GOLD,
            xp: 250,
            requirement: 3,
            evaluate: (stats = {}, history = [], user = {}) => {
                const court1 = Math.max(stats.court1Wins || 0, stats.court1Count || 0);
                const streak = Math.max(stats.currentStreak || 0, stats.maxStreak || 0);
                const isCourt1Met = court1 >= 1;
                const isStreakMet = streak >= 3;
                const unlocked = isCourt1Met || isStreakMet;
                const progress = unlocked ? 100 : Math.min(100, Math.round((Math.max(court1 > 0 ? 3 : 0, streak) / 3) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: isCourt1Met ? `Pista 1 (${court1})` : `${streak} seguidos`,
                    targetValue: '3 seguidos o Pista 1'
                };
            }
        },
        {
            id: 'racha_fuego',
            title: 'En Racha',
            description: 'Encadena una racha de 3 o más victorias consecutivas.',
            icon: '🔥',
            category: CONFIG.CATEGORIES.STREAK,
            tier: CONFIG.TIERS.SILVER,
            xp: 150,
            requirement: 3,
            evaluate: (stats = {}, history = [], user = {}) => {
                const streak = Math.max(stats.currentStreak || 0, stats.maxStreak || 0);
                const unlocked = streak >= 3;
                const progress = Math.min(100, Math.round((streak / 3) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: streak,
                    targetValue: 3
                };
            }
        },
        {
            id: 'incombustible',
            title: 'Incombustible',
            description: 'Jugar 5 o más eventos oficiales (Americanas o Entrenos) en el club.',
            icon: '⚡',
            category: CONFIG.CATEGORIES.LOYALTY,
            tier: CONFIG.TIERS.SILVER,
            xp: 200,
            requirement: 5,
            evaluate: (stats = {}, history = [], user = {}) => {
                const events = stats.eventsPlayed || 0;
                const unlocked = events >= 5;
                const progress = Math.min(100, Math.round((events / 5) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: events,
                    targetValue: 5
                };
            }
        },
        {
            id: 'maestro_red',
            title: 'Muralla en la Red',
            description: 'Acumula 10 o más partidos ganados en SomosPádel.',
            icon: '🎯',
            category: CONFIG.CATEGORIES.MATCH,
            tier: CONFIG.TIERS.GOLD,
            xp: 300,
            requirement: 10,
            evaluate: (stats = {}, history = [], user = {}) => {
                const won = stats.totalWon || 0;
                const unlocked = won >= 10;
                const progress = Math.min(100, Math.round((won / 10) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: won,
                    targetValue: 10
                };
            }
        },
        {
            id: 'meteoro',
            title: 'Ascenso Meteórico',
            description: 'Alcanzar un nivel de juego 3.5 o superior.',
            icon: '🚀',
            category: CONFIG.CATEGORIES.LEVEL,
            tier: CONFIG.TIERS.GOLD,
            xp: 350,
            requirement: 3.5,
            evaluate: (stats = {}, history = [], user = {}) => {
                const lvl = parseFloat(user?.level || user?.nivel || stats?.level || 0) || 0;
                const unlocked = lvl >= 3.5;
                const progress = unlocked ? 100 : Math.min(99, Math.round((lvl / 3.5) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: lvl.toFixed(2),
                    targetValue: '3.50'
                };
            }
        },
        {
            id: 'veterano',
            title: 'Leyenda de SomosPádel',
            description: 'Participar en más de 20 eventos en SomosPádel BCN.',
            icon: '🌟',
            category: CONFIG.CATEGORIES.LOYALTY,
            tier: CONFIG.TIERS.DIAMOND,
            xp: 600,
            requirement: 20,
            evaluate: (stats = {}, history = [], user = {}) => {
                const events = stats.eventsPlayed || 0;
                const unlocked = events >= 20;
                const progress = Math.min(100, Math.round((events / 20) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: events,
                    targetValue: 20
                };
            }
        },
        {
            id: 'guerrero_invicto',
            title: 'Invicto en Torneo',
            description: 'Completar una Americana o Torneo con 100% de victorias (mínimo 3 partidos disputados).',
            icon: '🛡️',
            category: CONFIG.CATEGORIES.SPECIAL,
            tier: CONFIG.TIERS.DIAMOND,
            xp: 500,
            requirement: 1,
            evaluate: (stats = {}, history = [], user = {}) => {
                const perfects = stats.perfectTournaments || 0;
                const unlocked = perfects >= 1;
                const progress = unlocked ? 100 : 0;
                return {
                    unlocked,
                    progress,
                    currentValue: perfects,
                    targetValue: 1
                };
            }
        },
        {
            id: 'fair_play',
            title: 'Espíritu Deportivo',
            description: 'Jugar y competir con 3 o más parejas distintas en la comunidad.',
            icon: '🤝',
            category: CONFIG.CATEGORIES.SPECIAL,
            tier: CONFIG.TIERS.BRONZE,
            xp: 100,
            requirement: 3,
            evaluate: (stats = {}, history = [], user = {}) => {
                const partners = stats.uniquePartnersCount || 0;
                const unlocked = partners >= 3;
                const progress = Math.min(100, Math.round((partners / 3) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: partners,
                    targetValue: 3
                };
            }
        },
        // Logros complementarios de alto engagement
        {
            id: 'primera_victoria',
            title: 'Bautismo de Fuego',
            description: 'Consigue tu primera victoria oficial en SomosPádel.',
            icon: '🥉',
            category: CONFIG.CATEGORIES.MATCH,
            tier: CONFIG.TIERS.BRONZE,
            xp: 50,
            requirement: 1,
            evaluate: (stats = {}, history = [], user = {}) => {
                const won = stats.totalWon || 0;
                const unlocked = won >= 1;
                return {
                    unlocked,
                    progress: unlocked ? 100 : 0,
                    currentValue: won,
                    targetValue: 1
                };
            }
        },
        {
            id: 'centurion',
            title: 'Club de los 50',
            description: 'Disputar 50 o más partidos en la comunidad.',
            icon: '💯',
            category: CONFIG.CATEGORIES.LOYALTY,
            tier: CONFIG.TIERS.DIAMOND,
            xp: 750,
            requirement: 50,
            evaluate: (stats = {}, history = [], user = {}) => {
                const played = stats.totalPlayed || 0;
                const unlocked = played >= 50;
                const progress = Math.min(100, Math.round((played / 50) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: played,
                    targetValue: 50
                };
            }
        },
        {
            id: 'top_player',
            title: 'Élite SomosPadel',
            description: 'Alcanzar un nivel de juego 4.5 o superior.',
            icon: '💎',
            category: CONFIG.CATEGORIES.LEVEL,
            tier: CONFIG.TIERS.DIAMOND,
            xp: 800,
            requirement: 4.5,
            evaluate: (stats = {}, history = [], user = {}) => {
                const lvl = parseFloat(user?.level || user?.nivel || stats?.level || 0) || 0;
                const unlocked = lvl >= 4.5;
                const progress = unlocked ? 100 : Math.min(99, Math.round((lvl / 4.5) * 100));
                return {
                    unlocked,
                    progress,
                    currentValue: lvl.toFixed(2),
                    targetValue: '4.50'
                };
            }
        }
    ];

    /**
     * Catálogo base de misiones semanales rotativas
     */
    const WEEKLY_MISSIONS_POOL = [
        {
            id: 'mission_americana_weekend',
            title: 'Fin de Semana Activo',
            description: 'Juega al menos 1 Americana este fin de semana.',
            icon: '🎾',
            category: 'attendance',
            requirement: 1,
            xp: 100,
            evaluate: (stats = {}, history = [], user = {}, weekMatches = []) => {
                const matches = Array.isArray(weekMatches) ? weekMatches : [];
                const americanasThisWeek = matches.filter(m => {
                    if (!m) return false;
                    const t = (m.type || m.category || m.club || m.title || '').toLowerCase();
                    return t.includes('amer') || t.includes('torneo');
                }).length;
                const completed = americanasThisWeek >= 1;
                return {
                    completed,
                    progress: Math.min(100, americanasThisWeek * 100),
                    currentValue: americanasThisWeek,
                    targetValue: 1
                };
            }
        },
        {
            id: 'mission_entrenos_wins',
            title: 'Doble Victoria en Entrenos',
            description: 'Suma 2 o más victorias en partidos o entrenos durante la semana.',
            icon: '⚔️',
            category: 'victory',
            requirement: 2,
            xp: 125,
            evaluate: (stats = {}, history = [], user = {}, weekMatches = []) => {
                const matches = Array.isArray(weekMatches) ? weekMatches : [];
                const isWin = (m) => {
                    if (!m) return false;
                    if (m.isWon !== undefined) return Boolean(m.isWon);
                    if (m.won !== undefined) return Boolean(m.won);
                    const res = String(m.result || m.res || '').trim().toUpperCase();
                    return res === 'W' || res === 'V' || res.startsWith('VICT') || res.includes('WIN');
                };
                const winsThisWeek = matches.filter(isWin).length;
                const completed = winsThisWeek >= 2;
                return {
                    completed,
                    progress: Math.min(100, Math.round((winsThisWeek / 2) * 100)),
                    currentValue: winsThisWeek,
                    targetValue: 2
                };
            }
        },
        {
            id: 'mission_high_efficiency',
            title: 'Francotirador',
            description: 'Alcanza un 60% o superior de efectividad en tus últimos 3 partidos.',
            icon: '🎯',
            category: 'performance',
            requirement: 60,
            xp: 150,
            evaluate: (stats = {}, history = [], user = {}, weekMatches = []) => {
                const safeHistory = Array.isArray(history) ? history.filter(Boolean) : [];
                const isWin = (m) => {
                    if (!m) return false;
                    if (m.isWon !== undefined) return Boolean(m.isWon);
                    if (m.won !== undefined) return Boolean(m.won);
                    const res = String(m.result || m.res || '').trim().toUpperCase();
                    return res === 'W' || res === 'V' || res.startsWith('VICT') || res.includes('WIN');
                };
                const recent = safeHistory.slice(0, 3);
                if (recent.length < 3) {
                    return {
                        completed: false,
                        progress: Math.round((recent.length / 3) * 50),
                        currentValue: `${recent.length}/3 partidos jugados`,
                        targetValue: '60% en 3 partidos'
                    };
                }
                const wins = recent.filter(isWin).length;
                const winRate = Math.round((wins / 3) * 100);
                const completed = winRate >= 60;
                return {
                    completed,
                    progress: completed ? 100 : Math.min(99, Math.round((winRate / 60) * 100)),
                    currentValue: `${winRate}% (${wins}/3)`,
                    targetValue: '60%'
                };
            }
        },
        {
            id: 'mission_new_partner',
            title: 'Espíritu de Equipo',
            description: 'Disputa un partido con un compañero nuevo esta semana.',
            icon: '🤝',
            category: 'social',
            requirement: 1,
            xp: 80,
            evaluate: (stats = {}, history = [], user = {}, weekMatches = []) => {
                const userName = (user?.name || user?.displayName || '').trim().toLowerCase();
                const matches = Array.isArray(weekMatches) ? weekMatches : [];
                const partnersThisWeek = new Set(
                    matches.map(m => m?.partner).filter(p => {
                        if (!p) return false;
                        const pLow = p.trim().toLowerCase();
                        return pLow !== 'compañero' && pLow !== 'compañera' && pLow !== userName;
                    })
                );
                const completed = partnersThisWeek.size >= 1;
                return {
                    completed,
                    progress: completed ? 100 : 0,
                    currentValue: partnersThisWeek.size,
                    targetValue: 1
                };
            }
        },
        {
            id: 'mission_volume_warrior',
            title: 'Imparable en Pistas',
            description: 'Disputa al menos 4 partidos oficiales a lo largo de la semana.',
            icon: '⚡',
            category: 'volume',
            requirement: 4,
            xp: 160,
            evaluate: (stats = {}, history = [], user = {}, weekMatches = []) => {
                const matches = Array.isArray(weekMatches) ? weekMatches : [];
                const played = matches.length;
                const completed = played >= 4;
                return {
                    completed,
                    progress: Math.min(100, Math.round((played / 4) * 100)),
                    currentValue: played,
                    targetValue: 4
                };
            }
        }
    ];

    /**
     * Clase AchievementsService
     */
    class AchievementsService {
        constructor() {
            this.catalog = BADGES_CATALOG;
            this.missionsPool = WEEKLY_MISSIONS_POOL;
            this._listeners = [];
            this._initialized = false;
        }

        /**
         * Inicialización del servicio
         */
        init() {
            if (this._initialized) return;
            this._initialized = true;
            console.log("🎮 [AchievementsService] Motor de Gamificación y Logros activado.");
        }

        /**
         * Retorna la semana ISO y fechas de inicio/fin de la semana actual
         * @param {Date} [targetDate=new Date()]
         * @returns {{ year: number, week: number, weekKey: string, startOfWeek: Date, endOfWeek: Date, remainingHours: number, remainingDays: number }}
         */
        getISOWeekDetails(targetDate = new Date()) {
            const date = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
            // Día de la semana (1 = lunes, 7 = domingo)
            const dayNr = (date.getUTCDay() + 6) % 7;
            date.setUTCDate(date.getUTCDate() - dayNr + 3);
            const firstThursday = date.getTime();
            date.setUTCMonth(0, 1);
            if (date.getUTCDay() !== 4) {
                date.setUTCMonth(0, 1 + ((4 - date.getUTCDay()) + 7) % 7);
            }
            const weekNumber = 1 + Math.ceil((firstThursday - date.getTime()) / 604800000);
            const year = date.getUTCFullYear();

            // Fechas de inicio (lunes 00:00:00) y fin (domingo 23:59:59)
            const now = new Date(targetDate);
            const currentDay = (now.getDay() + 6) % 7; // Lunes = 0
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - currentDay);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const remainingMs = Math.max(0, endOfWeek.getTime() - now.getTime());
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remainingDays = Math.floor(remainingHours / 24);

            return {
                year,
                week: weekNumber,
                weekKey: `${year}-W${String(weekNumber).padStart(2, '0')}`,
                startOfWeek,
                endOfWeek,
                remainingHours,
                remainingDays
            };
        }

        /**
         * Obtiene las misiones dinámicas de la semana rotadas matemáticamente
         * @param {Date} [targetDate=new Date()]
         * @returns {Array} Array con las 3 misiones activas de la semana
         */
        getActiveWeeklyMissions(targetDate = new Date()) {
            const weekInfo = this.getISOWeekDetails(targetDate);
            const poolSize = this.missionsPool.length;
            const weekSeed = (weekInfo.year * 53 + weekInfo.week);

            // Seleccionar 3 misiones deterministas según la semana
            const selected = [];
            for (let i = 0; i < 3; i++) {
                const index = (weekSeed + i * 2) % poolSize;
                selected.push(this.missionsPool[index]);
            }

            return selected.map(mission => ({
                ...mission,
                weekKey: weekInfo.weekKey,
                expiresAt: weekInfo.endOfWeek.toISOString(),
                remainingTimeText: weekInfo.remainingDays > 0 
                    ? `${weekInfo.remainingDays}d ${weekInfo.remainingHours % 24}h restantes` 
                    : `${weekInfo.remainingHours}h restantes`
            }));
        }

        /**
         * Normaliza defensivamente las estadísticas, usuario e historial
         * @private
         */
        /**
         * Helper para parsear fechas de partido en múltiples formatos de forma segura
         * @private
         */
        _parseDateSafe(val) {
            if (!val) return null;
            if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
            if (typeof val.toDate === 'function') {
                const d = val.toDate();
                return isNaN(d.getTime()) ? null : d;
            }
            if (typeof val === 'number') {
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            }
            if (typeof val === 'string') {
                const trimmed = val.trim();
                const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (dmyMatch) {
                    const day = parseInt(dmyMatch[1], 10);
                    const month = parseInt(dmyMatch[2], 10) - 1;
                    const year = parseInt(dmyMatch[3], 10);
                    const d = new Date(year, month, day);
                    return isNaN(d.getTime()) ? null : d;
                }
                const d = new Date(trimmed);
                return isNaN(d.getTime()) ? null : d;
            }
            return null;
        }

        /**
         * Helper para verificar si un partido fue ganado por el jugador
         * @private
         */
        _isMatchWon(m) {
            if (!m) return false;
            if (m.isWon !== undefined) return Boolean(m.isWon);
            if (m.won !== undefined) return Boolean(m.won);
            const res = String(m.result || m.res || '').trim().toUpperCase();
            return res === 'W' || res === 'V' || res.startsWith('VICT') || res.includes('WIN');
        }

        /**
         * Normaliza defensivamente las estadísticas, usuario e historial
         * @private
         */
        _normalizeStats(stats = {}, user = {}, history = []) {
            const safeStats = stats || {};
            const safeUser = user || {};
            const safeHistory = Array.isArray(history) ? history.filter(Boolean) : [];

            // Partidos jugados y ganados
            const amerPlayed = safeStats.americanas?.played || 0;
            const amerWon = safeStats.americanas?.won || 0;
            const entrPlayed = safeStats.entrenos?.played || 0;
            const entrWon = safeStats.entrenos?.won || 0;

            let totalPlayed = safeStats.totalPlayed ?? safeStats.matches;
            if (totalPlayed === undefined || totalPlayed === null) {
                if (safeStats.won !== undefined && safeStats.lost !== undefined) {
                    totalPlayed = safeStats.won + safeStats.lost;
                } else if ((amerPlayed + entrPlayed) > 0) {
                    totalPlayed = amerPlayed + entrPlayed;
                } else if (safeUser.matches_played !== undefined && safeUser.matches_played !== null) {
                    totalPlayed = safeUser.matches_played;
                } else {
                    totalPlayed = safeHistory.length;
                }
            }

            let totalWon = safeStats.totalWon ?? safeStats.won;
            if (totalWon === undefined || totalWon === null) {
                if ((amerWon + entrWon) > 0) {
                    totalWon = amerWon + entrWon;
                } else if (safeUser.wins !== undefined && safeUser.wins !== null) {
                    totalWon = safeUser.wins;
                } else {
                    totalWon = safeHistory.filter(m => this._isMatchWon(m)).length;
                }
            }

            // Pista 1
            const court1InHistory = safeHistory.filter(m => {
                if (!m) return false;
                const c = String(m.court ?? m.pista ?? '').trim().toLowerCase();
                return c === '1' || c === 'pista 1' || c.includes('pista 1');
            }).length;

            const court1Wins = Math.max(
                (safeStats.court1Wins ?? safeStats.court1Count ?? 0) + 
                (safeStats.americanas?.court1Count || 0) + 
                (safeStats.entrenos?.court1Count || 0),
                court1InHistory
            );

            // Rachas (consecutivas victorias)
            // Si el historial tiene fechas, ordenamos descendente (más reciente primero) para evaluar racha actual
            const sortedHistory = [...safeHistory];
            const hasDates = sortedHistory.some(m => m && (m.date || m.dateRaw || m.timestamp || m.created_at));
            if (hasDates) {
                sortedHistory.sort((a, b) => {
                    const da = a ? (this._parseDateSafe(a.dateRaw || a.date || a.timestamp || a.created_at)?.getTime() || 0) : 0;
                    const db = b ? (this._parseDateSafe(b.dateRaw || b.date || b.timestamp || b.created_at)?.getTime() || 0) : 0;
                    return db - da; // Descendente: más reciente primero
                });
            }

            let currentStreak = 0;
            let maxStreak = safeStats.maxStreak || safeUser.max_streak || 0;
            let runningStreak = 0;

            // Historial ordenado desc (más reciente primero)
            for (let i = 0; i < sortedHistory.length; i++) {
                const match = sortedHistory[i];
                if (match && this._isMatchWon(match)) {
                    runningStreak++;
                    if (runningStreak > maxStreak) maxStreak = runningStreak;
                } else {
                    runningStreak = 0;
                }
            }

            // Racha activa actual (desde el último partido jugado hacia atrás)
            for (let i = 0; i < sortedHistory.length; i++) {
                const match = sortedHistory[i];
                if (match && this._isMatchWon(match)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            if (safeStats.currentStreak) currentStreak = Math.max(currentStreak, safeStats.currentStreak);

            // Eventos jugados (mínimo calculado o número de eventos registrados)
            const distinctEventsInHistory = new Set();
            safeHistory.forEach(m => {
                if (!m) return;
                const id = m.eventId || m.event_id || m.americana_id || (m.date ? String(m.date).slice(0, 10) : null);
                if (id) distinctEventsInHistory.add(id);
            });

            const eventsPlayed = safeStats.eventsPlayed || safeUser.events_played || safeUser.total_events ||
                Math.max(
                    distinctEventsInHistory.size,
                    (amerPlayed > 0 ? Math.ceil(amerPlayed / 4) : 0) + (entrPlayed > 0 ? Math.ceil(entrPlayed / 4) : 0),
                    Math.ceil(totalPlayed / 4),
                    (amerPlayed ? 1 : 0) + (entrPlayed ? 1 : 0)
                );

            // Parejas únicas registradas en historial
            const userName = (safeUser.name || safeUser.displayName || '').trim().toLowerCase();
            const partnersSet = new Set();
            safeHistory.forEach(m => {
                if (m && m.partner) {
                    const p = m.partner.trim().toLowerCase();
                    if (p && p !== 'compañero' && p !== 'compañera' && p !== userName) {
                        partnersSet.add(p);
                    }
                }
            });
            const uniquePartnersCount = Math.max(partnersSet.size, safeStats.uniquePartnersCount || safeUser.partners_count || 0);

            // Torneos invictos (100% victorias en un evento con >= 3 partidos)
            const eventGroups = {};
            safeHistory.forEach(m => {
                if (!m) return;
                const groupKey = m.eventId || m.event_id || m.americana_id || (m.dateRaw ? String(m.dateRaw).slice(0, 10) : (m.date ? String(m.date).slice(0, 10) : 'default'));
                if (!eventGroups[groupKey]) eventGroups[groupKey] = [];
                eventGroups[groupKey].push(m);
            });

            let perfectTournaments = safeStats.perfectTournaments || safeUser.perfect_tournaments || 0;
            Object.values(eventGroups).forEach(group => {
                if (group.length >= 3 && group.every(m => this._isMatchWon(m))) {
                    perfectTournaments++;
                }
            });

            const level = parseFloat(safeUser.level || safeUser.nivel || safeStats.level || 0) || 0;

            return {
                totalPlayed,
                totalWon,
                court1Wins,
                court1Count: court1Wins,
                currentStreak,
                maxStreak,
                eventsPlayed,
                uniquePartnersCount,
                perfectTournaments,
                level,
                amerPlayed,
                entrPlayed
            };
        }

        /**
         * Obtiene los partidos correspondientes a la semana ISO actual
         * @private
         */
        _filterMatchesThisWeek(history = [], weekInfo) {
            if (!Array.isArray(history)) return [];
            const startMs = weekInfo.startOfWeek.getTime();
            const endMs = weekInfo.endOfWeek.getTime();

            return history.filter(m => {
                if (!m) return false;
                const rawVal = m.dateRaw || m.date || m.timestamp || m.created_at;
                const matchDate = this._parseDateSafe(rawVal);
                if (!matchDate) return false;
                const time = matchDate.getTime();
                return time >= startMs && time <= endMs;
            });
        }

        /**
         * Carga los datos de gamificación cacheados del usuario
         * @param {string} userId
         * @returns {Object} Estado guardado
         */
        loadCachedGamification(userId) {
            if (!userId || typeof localStorage === 'undefined') return { unlockedBadges: {}, completedMissions: {}, totalXp: 0 };
            try {
                const key = `${CONFIG.STORAGE_PREFIX}${userId}`;
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : { unlockedBadges: {}, completedMissions: {}, totalXp: 0 };
            } catch (e) {
                console.warn("[AchievementsService] Error al leer localStorage:", e);
                return { unlockedBadges: {}, completedMissions: {}, totalXp: 0 };
            }
        }

        /**
         * Guarda en caché local el estado de gamificación
         * @param {string} userId 
         * @param {Object} data 
         */
        saveCachedGamification(userId, data) {
            if (!userId || typeof localStorage === 'undefined') return;
            try {
                const key = `${CONFIG.STORAGE_PREFIX}${userId}`;
                localStorage.setItem(key, JSON.stringify({
                    ...data,
                    lastUpdated: new Date().toISOString()
                }));
            } catch (e) {
                console.warn("[AchievementsService] Error al escribir localStorage:", e);
            }
        }

        /**
         * Sincroniza el estado de gamificación con Firestore
         * Compatible con `users/{uid}/gamification`
         * @param {string} userId 
         * @param {Object} gamificationData 
         */
        async syncWithFirestore(userId, gamificationData) {
            if (!userId || typeof window === 'undefined' || !window.db) return;
            try {
                const docRef = window.db
                    .collection(CONFIG.FIRESTORE_COLLECTION)
                    .doc(userId)
                    .collection(CONFIG.FIRESTORE_SUBCOLLECTION)
                    .doc('summary');

                const payload = {
                    totalXp: gamificationData.totalXp || 0,
                    levelInfo: gamificationData.level || {},
                    unlockedBadgesCount: gamificationData.unlockedBadges.length,
                    unlockedBadgeIds: gamificationData.unlockedBadges.map(b => b.id),
                    unlockedDetails: gamificationData.unlockedBadges.map(b => ({
                        id: b.id,
                        unlockedAt: b.unlockedAt,
                        xp: b.xp
                    })),
                    completedMissions: gamificationData.weeklyMissions.filter(m => m.completed).map(m => ({
                        id: m.id,
                        weekKey: m.weekKey,
                        xp: m.xp
                    })),
                    updatedAt: (window.firebase?.firestore?.FieldValue?.serverTimestamp) ? 
                        window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                };

                await docRef.set(payload, { merge: true });
                console.log("☁️ [AchievementsService] Sincronizado exitosamente con Firestore");
            } catch (error) {
                console.warn("⚠️ [AchievementsService] No se pudo sincronizar en Firestore (modo offline o sin permisos):", error.message);
            }
        }

        /**
         * Calcula el rango/nivel de gamificación a partir de los puntos XP
         * @param {number} xp 
         * @returns {Object} Nivel actual, título y progreso
         */
        calculateLevel(xp = 0) {
            const thresholds = CONFIG.LEVEL_THRESHOLDS;
            let current = thresholds[0];
            let next = thresholds[1] || null;

            for (let i = thresholds.length - 1; i >= 0; i--) {
                if (xp >= thresholds[i].minXp) {
                    current = thresholds[i];
                    next = thresholds[i + 1] || null;
                    break;
                }
            }

            let progressPercent = 100;
            let xpToNext = 0;
            if (next) {
                const range = next.minXp - current.minXp;
                const earned = xp - current.minXp;
                progressPercent = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
                xpToNext = next.minXp - xp;
            }

            return {
                level: current.level,
                title: current.title,
                icon: current.icon,
                currentXp: xp,
                minXp: current.minXp,
                nextXp: next ? next.minXp : current.minXp,
                xpToNext,
                progressPercent,
                isMaxLevel: !next
            };
        }

        /**
         * Dispara eventos custom y notificaciones en pantalla al desbloquear insignias
         * @private
         */
        _notifyUnlock(badge, user, totalXp) {
            const eventPayload = {
                badge,
                user: {
                    uid: user.uid || user.id,
                    name: user.name || user.displayName || 'Jugador'
                },
                totalXp,
                timestamp: new Date().toISOString()
            };

            // 1. Disparar Evento en DOM para que vistas o sistemas reactivos lo escuchen
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
                try {
                    const customEvent = new CustomEvent(CONFIG.EVENT_UNLOCKED, {
                        bubbles: true,
                        detail: eventPayload
                    });
                    window.dispatchEvent(customEvent);
                } catch (e) {
                    console.warn("[AchievementsService] Error despachando evento custom:", e);
                }
            }

            // 2. Disparar a través de NotificationService si existe
            if (typeof window !== 'undefined' && window.NotificationService && typeof window.NotificationService.createLocalToast === 'function') {
                window.NotificationService.createLocalToast({
                    title: `¡Insignia Desbloqueada! ${badge.icon}`,
                    message: `${badge.title}: +${badge.xp} XP`,
                    type: 'success',
                    icon: badge.icon
                });
            } else if (typeof document !== 'undefined') {
                this._showDefaultCelebrationToast(badge);
            }

            // 3. Notificar a listeners registrados
            this._listeners.forEach(cb => {
                try { cb(eventPayload); } catch (err) { console.error(err); }
            });

            console.log(`🎉 [AchievementsService] ¡LOGRO DESBLOQUEADO! "${badge.title}" (+${badge.xp} XP) para`, user.name || user.displayName || user.uid);
        }

        /**
         * Renderiza un toast flotante de celebración visual con fanfarria
         * @private
         */
        _showDefaultCelebrationToast(badge) {
            if (typeof document === 'undefined') return;

            let container = document.getElementById('sp-achievements-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'sp-achievements-toast-container';
                container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:999999; display:flex; flex-direction:column; gap:12px; pointer-events:none; font-family:"Outfit",sans-serif;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.style.cssText = `
                background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
                border: 2px solid #ccff00;
                border-radius: 16px;
                padding: 16px 20px;
                color: #ffffff;
                box-shadow: 0 10px 30px rgba(204, 255, 0, 0.25), 0 4px 12px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                gap: 16px;
                max-width: 360px;
                pointer-events: auto;
                transform: translateX(120%);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
                opacity: 0;
            `;

            toast.innerHTML = `
                <div style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(204,255,0,0.5));">${badge.icon}</div>
                <div style="flex:1;">
                    <div style="font-size: 0.7rem; font-weight: 800; color: #ccff00; text-transform: uppercase; letter-spacing: 0.8px;">¡NUEVO LOGRO DESBLOQUEADO!</div>
                    <div style="font-size: 1rem; font-weight: 900; color: #ffffff; margin: 2px 0;">${badge.title}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">${badge.description}</div>
                </div>
                <div style="background: rgba(204,255,0,0.15); border: 1px solid #ccff00; border-radius: 10px; padding: 6px 10px; font-size: 0.75rem; font-weight: 900; color: #ccff00; white-space: nowrap;">
                    +${badge.xp} XP
                </div>
            `;

            container.appendChild(toast);

            // Animación de entrada segura
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => {
                    toast.style.transform = 'translateX(0)';
                    toast.style.opacity = '1';
                });
            } else {
                setTimeout(() => {
                    toast.style.transform = 'translateX(0)';
                    toast.style.opacity = '1';
                }, 50);
            }

            // Auto-ocultar tras 4.5 segundos
            setTimeout(() => {
                toast.style.transform = 'translateX(120%)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 400);
            }, 4500);
        }

        /**
         * Registra un callback para escuchar cuando se desbloquee un logro
         * @param {Function} callback 
         * @returns {Function} Función para cancelar suscripción
         */
        listenAchievementUnlocked(callback) {
            if (typeof callback === 'function') {
                this._listeners.push(callback);
            }
            return () => {
                this._listeners = this._listeners.filter(cb => cb !== callback);
            };
        }

        /**
         * MÉTODO PRINCIPAL: Evalúa el catálogo de logros y misiones semanales de un jugador.
         * @param {Object} user - Datos del usuario actual (uid, level, name, etc.)
         * @param {Object} [stats] - Estadísticas acumuladas
         * @param {Array} [matchHistory] - Historial de partidos
         * @returns {Promise<Object>} Resultado consolidado con logros desbloqueados, en progreso y XP
         */
        async evaluatePlayerAchievements(user, stats = {}, matchHistory = []) {
            if (!user) {
                user = (typeof window !== 'undefined' && window.Store && typeof window.Store.getState === 'function') ? window.Store.getState('currentUser') : null;
            }
            const safeUser = user || { uid: 'guest', name: 'Invitado', level: 0 };
            const userId = safeUser.uid || safeUser.id || 'anonymous';
            const safeStats = stats || {};
            const safeHistory = Array.isArray(matchHistory) ? matchHistory : [];

            // 1. Normalizar estadísticas
            const normalizedStats = this._normalizeStats(safeStats, safeUser, safeHistory);

            // 2. Cargar estado previo de caché
            const cachedData = this.loadCachedGamification(userId);
            const previouslyUnlocked = cachedData.unlockedBadges || {};

            let totalXp = 0;
            const newlyUnlocked = [];
            const evaluatedBadges = [];
            const unlockedBadges = [];
            const inProgressBadges = [];

            // 3. Evaluar cada insignia del Catálogo Oficial
            for (const badge of this.catalog) {
                let evalResult = { unlocked: false, progress: 0, currentValue: 0, targetValue: badge.requirement };
                try {
                    evalResult = badge.evaluate(normalizedStats, safeHistory, safeUser);
                } catch (err) {
                    console.warn(`[AchievementsService] Error evaluando insignia ${badge.id}:`, err);
                }

                const wasAlreadyUnlocked = Boolean(previouslyUnlocked[badge.id]);
                const isNowUnlocked = evalResult.unlocked || wasAlreadyUnlocked;
                const unlockedAt = isNowUnlocked ? (previouslyUnlocked[badge.id]?.unlockedAt || new Date().toISOString()) : null;

                const evaluatedBadge = {
                    id: badge.id,
                    title: badge.title,
                    description: badge.description,
                    icon: badge.icon,
                    category: badge.category,
                    tier: badge.tier,
                    xp: badge.xp,
                    requirement: badge.requirement,
                    unlocked: isNowUnlocked,
                    unlockedAt,
                    progress: isNowUnlocked ? 100 : Math.min(100, Math.max(0, evalResult.progress || 0)),
                    currentValue: evalResult.currentValue,
                    targetValue: evalResult.targetValue
                };

                evaluatedBadges.push(evaluatedBadge);

                if (isNowUnlocked) {
                    unlockedBadges.push(evaluatedBadge);
                    totalXp += badge.xp;

                    // Si se acaba de desbloquear por primera vez en esta sesión
                    if (!wasAlreadyUnlocked) {
                        newlyUnlocked.push(evaluatedBadge);
                        previouslyUnlocked[badge.id] = {
                            id: badge.id,
                            unlockedAt,
                            xp: badge.xp
                        };
                        this._notifyUnlock(evaluatedBadge, safeUser, totalXp);
                    }
                } else {
                    inProgressBadges.push(evaluatedBadge);
                }
            }

            // 4. Evaluar Misiones Semanales Dinámicas
            const weekInfo = this.getISOWeekDetails();
            const weekMatches = this._filterMatchesThisWeek(matchHistory, weekInfo);
            const activeWeeklyMissions = this.getActiveWeeklyMissions();
            const evaluatedMissions = [];

            for (const mission of activeWeeklyMissions) {
                let mResult = { completed: false, progress: 0, currentValue: 0, targetValue: mission.requirement };
                try {
                    mResult = mission.evaluate(normalizedStats, matchHistory, safeUser, weekMatches);
                } catch (err) {
                    console.warn(`[AchievementsService] Error evaluando misión ${mission.id}:`, err);
                }

                if (mResult.completed) {
                    totalXp += mission.xp;
                }

                evaluatedMissions.push({
                    id: mission.id,
                    title: mission.title,
                    description: mission.description,
                    icon: mission.icon,
                    category: mission.category,
                    xp: mission.xp,
                    completed: mResult.completed,
                    progress: mResult.completed ? 100 : Math.min(100, Math.max(0, mResult.progress || 0)),
                    currentValue: mResult.currentValue,
                    targetValue: mResult.targetValue,
                    weekKey: mission.weekKey,
                    remainingTimeText: mission.remainingTimeText
                });
            }

            // 5. Nivel de Gamificación
            const levelInfo = this.calculateLevel(totalXp);

            // 6. Preparar paquete consolidado
            const result = {
                userId,
                totalXp,
                level: levelInfo,
                levelInfo: levelInfo,
                badges: evaluatedBadges,
                unlockedBadges,
                inProgressBadges,
                allBadges: evaluatedBadges,
                unlockedCount: unlockedBadges.length,
                totalBadges: evaluatedBadges.length,
                newlyUnlocked,
                weeklyMissions: evaluatedMissions,
                normalizedStats,
                timestamp: new Date().toISOString()
            };

            // 7. Persistencia rápida en localStorage
            this.saveCachedGamification(userId, {
                unlockedBadges: previouslyUnlocked,
                totalXp,
                level: levelInfo,
                lastEvaluated: new Date().toISOString()
            });

            // 8. Sincronización asíncrona con Firestore (background)
            if (userId !== 'guest' && userId !== 'anonymous') {
                this.syncWithFirestore(userId, result).catch(err => {
                    console.warn("[AchievementsService] Error en sync Firestore:", err);
                });
            }

            return result;
        }

        /**
         * Retorna el catálogo completo oficial de logros
         */
        getCatalog() {
            return [...this.catalog];
        }

        /**
         * Retorna las misiones de la semana actual (alias de getActiveWeeklyMissions)
         */
        getWeeklyMissions(targetDate = new Date()) {
            return this.getActiveWeeklyMissions(targetDate);
        }

        /**
         * Toast visual de felicitación (alias público)
         */
        showUnlockToast(badge) {
            this._showDefaultCelebrationToast(badge);
        }

        /**
         * Retorna un logro específico por su identificador
         * @param {string} id 
         */
        getBadgeById(id) {
            return this.catalog.find(b => b.id === id) || null;
        }

        /**
         * Helper para renderizar la sección visual de Gamificación y Logros en formato HTML limpio y responsive
         * @param {Object} evalResult - Objeto devuelto por evaluatePlayerAchievements
         * @returns {string} Código HTML listo para inyectar en contenedores
         */
        renderGamificationHTML(evalResult) {
            if (!evalResult) return '';

            const { totalXp, level, unlockedBadges, inProgressBadges, weeklyMissions } = evalResult;

            // Renderizado de Insignias (Grid moderno)
            const renderBadgeCard = (badge) => {
                const isUnlocked = badge.unlocked;
                const tierColors = {
                    bronze: '#cd7f32',
                    silver: '#c0c0c0',
                    gold: '#ffd700',
                    diamond: '#00e5ff'
                };
                const borderColor = tierColors[badge.tier] || '#ccff00';

                return `
                    <div style="background: ${isUnlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isUnlocked ? borderColor : 'rgba(255,255,255,0.08)'}; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; ${isUnlocked ? `box-shadow: 0 4px 16px ${borderColor}22;` : 'filter: grayscale(85%); opacity: 0.7;'}">
                        ${isUnlocked ? `<div style="position:absolute; top:8px; right:8px; background:${borderColor}; color:#000; font-size:0.6rem; font-weight:900; padding:2px 8px; border-radius:10px; text-transform:uppercase;">${badge.tier}</div>` : ''}
                        
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <div style="font-size:2rem; width:46px; height:46px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:14px; border:1px solid rgba(255,255,255,0.08);">
                                ${badge.icon}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:0.9rem; font-weight:800; color:white;">${badge.title}</div>
                                <div style="font-size:0.7rem; color:#a1a1aa; line-height:1.2;">${badge.description}</div>
                            </div>
                        </div>

                        <!-- Barra de progreso -->
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:0.65rem; font-weight:700; color:#a1a1aa; margin-bottom:4px;">
                                <span>${isUnlocked ? '¡Completado!' : `Progreso: ${badge.progress}%`}</span>
                                <span style="color:#ccff00;">+${badge.xp} XP</span>
                            </div>
                            <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                                <div style="width:${badge.progress}%; height:100%; background:${isUnlocked ? borderColor : '#ccff00'}; border-radius:3px; transition:width 0.6s ease;"></div>
                            </div>
                        </div>
                    </div>
                `;
            };

            // Renderizado de Misiones Semanales
            const renderMissionCard = (mission) => {
                return `
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid ${mission.completed ? '#ccff00' : 'rgba(255,255,255,0.08)'}; border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                        <div style="font-size: 1.8rem;">${mission.icon}</div>
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="font-size:0.85rem; font-weight:800; color:white;">${mission.title}</div>
                                ${mission.completed ? '<span style="background:#ccff00; color:#000; font-size:0.6rem; font-weight:900; padding:1px 6px; border-radius:8px;">HECHO</span>' : ''}
                            </div>
                            <div style="font-size:0.72rem; color:#94a3b8; margin:2px 0 6px;">${mission.description}</div>
                            
                            <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                                <div style="width:${mission.progress}%; height:100%; background:#ccff00; border-radius:3px;"></div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.85rem; font-weight:900; color:#ccff00;">+${mission.xp} XP</div>
                            <div style="font-size:0.65rem; color:#64748b;">${mission.remainingTimeText}</div>
                        </div>
                    </div>
                `;
            };

            return `
                <div class="gamification-dashboard-widget" style="margin: 20px; font-family: 'Outfit', sans-serif;">
                    
                    <!-- Cabecera de Nivel y Honor XP -->
                    <div style="background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 22px; margin-bottom: 24px; position:relative; overflow:hidden;">
                        <div style="position:absolute; top:0; right:0; width:150px; height:150px; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%); pointer-events:none;"></div>
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; position:relative; z-index:2;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="font-size:2rem; width:52px; height:52px; display:flex; align-items:center; justify-content:center; background:rgba(204,255,0,0.1); border:1px solid #ccff00; border-radius:16px;">
                                    ${level.icon}
                                </div>
                                <div>
                                    <div style="font-size:0.7rem; font-weight:800; color:#ccff00; text-transform:uppercase; letter-spacing:0.8px;">NIVEL ${level.level} • GAMIFICACIÓN</div>
                                    <div style="font-size:1.3rem; font-weight:900; color:white;">${level.title}</div>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:1.4rem; font-weight:900; color:#ccff00;">${totalXp} <span style="font-size:0.8rem; color:#94a3b8;">XP</span></div>
                                <div style="font-size:0.7rem; color:#94a3b8;">${level.isMaxLevel ? 'Rango Máximo' : `Faltan ${level.xpToNext} XP`}</div>
                            </div>
                        </div>

                        <!-- Barra de experiencia de nivel -->
                        <div style="position:relative; z-index:2;">
                            <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
                                <div style="width:${level.progressPercent}%; height:100%; background:linear-gradient(90deg, #ccff00 0%, #00e5ff 100%); border-radius:4px; transition:width 0.8s ease;"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#64748b; font-weight:700; margin-top:5px;">
                                <span>${level.minXp} XP</span>
                                <span>${level.progressPercent}% completado</span>
                                <span>${level.isMaxLevel ? 'MAX' : `${level.nextXp} XP`}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Misiones Semanales Dinámicas -->
                    <div style="margin-bottom: 24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <div style="font-size:0.85rem; font-weight:900; color:white; letter-spacing:0.5px; text-transform:uppercase;">
                                🎯 Misiones Semanales
                            </div>
                            <span style="font-size:0.7rem; color:#94a3b8; font-weight:700;">Rotación Semanal</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${weeklyMissions.map(m => renderMissionCard(m)).join('')}
                        </div>
                    </div>

                    <!-- Insignias y Logros -->
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                            <div style="font-size:0.85rem; font-weight:900; color:white; letter-spacing:0.5px; text-transform:uppercase;">
                                🏆 Logros e Insignias (${unlockedBadges.length}/${evalResult.allBadges.length})
                            </div>
                            <div style="font-size:0.7rem; color:#ccff00; font-weight:800;">
                                ${Math.round((unlockedBadges.length / evalResult.allBadges.length) * 100)}% Desbloqueado
                            </div>
                        </div>

                        <!-- Grid de Logros -->
                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
                            ${evalResult.allBadges.map(b => renderBadgeCard(b)).join('')}
                        </div>
                    </div>

                </div>
            `;
        }
    }

    // Instancia única singleton
    const serviceInstance = new AchievementsService();
    serviceInstance.init();

    // Exportar al ámbito global de navegador
    if (typeof global !== 'undefined') {
        global.AchievementsService = serviceInstance;
    }

    // Exportar módulo en entornos CommonJS / Node si aplica
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = serviceInstance;
    }

})(typeof window !== 'undefined' ? window : this);
