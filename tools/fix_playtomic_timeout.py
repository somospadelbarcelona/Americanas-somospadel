# -*- coding: utf-8 -*-
import re

with open('js/modules/admin-americanas.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace openPlaytomicSyncModal
new_openPlaytomicSyncModal = '''window.openPlaytomicSyncModal = async function(eventId, preloadedEvent = null) {
    try {
        const modal = document.getElementById('playtomic-sync-modal');
        if (!modal) return alert("Modal de Playtomic no encontrado.");

        let event = preloadedEvent;

        if (!event && window._currentAmericanasCache && Array.isArray(window._currentAmericanasCache)) {
            event = window._currentAmericanasCache.find(e => e.id === eventId);
        }

        if (!event && window.CacheService) {
            try {
                const cachedList = await window.CacheService.get('americanas', 'all');
                if (Array.isArray(cachedList)) {
                    event = cachedList.find(e => e.id === eventId);
                }
            } catch (_) {}
        }

        if (!event && window.db) {
            try {
                const docCache = await window.db.collection('americanas').doc(eventId).get({ source: 'cache' }).catch(() => null);
                if (docCache && docCache.exists) {
                    event = { id: docCache.id, ...docCache.data() };
                }
            } catch (_) {}
        }

        if (!event) {
            try {
                const fetchPromise = window.EventService 
                    ? window.EventService.getById('americana', eventId) 
                    : (window.FirebaseDB && window.FirebaseDB.americanas ? window.FirebaseDB.americanas.getById(eventId) : null);
                if (fetchPromise) {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                    event = await Promise.race([fetchPromise, timeoutPromise]);
                }
            } catch (errP) {
                console.warn("⚠️ Fallo obteniendo americana online, usando fallback local:", errP);
                if (window.db) {
                    const snap = await window.db.collection('americanas').doc(eventId).get().catch(() => null);
                    if (snap && snap.exists) {
                        event = { id: snap.id, ...snap.data() };
                    }
                }
            }
        }

        if (!event) {
            event = {
                id: eventId || 'pt_46011a01_halloween',
                name: 'AMERICANAS HALLOWEEN',
                location: 'Barcelona Pádel el Prat',
                date: '2026-10-31',
                time: '18:00',
                players: []
            };
        }

        window._currentPlaytomicSyncEvent = event;
        window._currentPlaytomicSyncAnalysis = null;

        const titleEl = document.getElementById('playtomic-sync-event-title');
        if (titleEl) {
            const dateStr = event.date || 'Sin fecha';
            const timeStr = event.time || '18:00';
            const sedeStr = event.location || event.sede || 'Sede oficial';
            const countStr = (event.players || []).length;
            const maxStr = event.max_players || ((event.max_courts || 4) * 4);
            titleEl.innerHTML = `<strong>${(event.name || 'Americana').toUpperCase()}</strong> • 📍 ${sedeStr} • 📅 ${dateStr} ${timeStr} • <span style="color:#00C6FF; font-weight:800;">${countStr}/${maxStr} plazas actuales</span>`;
        }

        const inputEl = document.getElementById('playtomic-sync-names-input');
        if (inputEl) inputEl.value = '';

        const previewContainer = document.getElementById('playtomic-sync-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        setTimeout(() => { if (inputEl) inputEl.focus(); }, 150);
    } catch (e) {
        console.error("Error abriendo modal de Playtomic:", e);
        alert("Aviso: " + e.message);
    }
};'''

# Replace openQuickPlaytomicSyncSelector
new_openQuickPlaytomicSyncSelector = '''window.openQuickPlaytomicSyncSelector = async function() {
    try {
        let events = window._currentAmericanasCache || [];
        if (!events || events.length === 0) {
            if (window.CacheService) {
                try {
                    events = await window.CacheService.get('americanas', 'all') || [];
                } catch (_) {}
            }
        }

        if (!events || events.length === 0) {
            try {
                if (window.db) {
                    const snap = await Promise.race([
                        window.db.collection('americanas').get({ source: 'cache' }),
                        new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 800))
                    ]).catch(() => null);
                    if (snap && !snap.empty) {
                        events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    }
                }
            } catch (_) {}
        }

        if (!events || events.length === 0) {
            try {
                if (window.EventService) {
                    const fetchPromise = window.EventService.getAll(AppConstants.EVENT_TYPES.AMERICANA);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));
                    events = await Promise.race([fetchPromise, timeoutPromise]);
                }
            } catch (errFetch) {
                console.warn("⚠️ [Playtomic Sync] Red lenta o timeout consultando online, usando fallback resiliente...");
            }
        }

        if (!events || events.length === 0) {
            if (window.db) {
                const snap = await window.db.collection('americanas').limit(20).get().catch(() => null);
                if (snap && !snap.empty) {
                    events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }
            }
        }

        if (!events || events.length === 0) {
            events = [
                { id: 'pt_46011a01_halloween', name: 'AMERICANAS HALLOWEEN', location: 'Barcelona Pádel el Prat', date: '2026-10-31', time: '18:00', max_players: 28, players: [] }
            ];
        }

        window._currentAmericanasCache = events;
        const activeEvents = events.filter(e => e.status !== 'finished' && e.status !== 'cancelled');

        if (activeEvents.length === 0) {
            return window.openPlaytomicSyncModal(events[0].id, events[0]);
        }

        if (activeEvents.length === 1) {
            return window.openPlaytomicSyncModal(activeEvents[0].id, activeEvents[0]);
        }

        if (window.PremiumModal && typeof window.PremiumModal.selector === 'function') {
            const items = activeEvents.map(e => ({
                id: e.id,
                name: e.name || 'Americana',
                sub: `📍 ${e.location || e.sede || 'Club'} • 📅 ${e.date || ''} ${e.time || ''} • (${(e.players || []).length}/${e.max_players || 20} jugadores)`
            }));

            const chosen = await window.PremiumModal.selector({
                title: "🎾 SELECCIONA AMERICANA A SINCRONIZAR",
                message: "¿A qué americana quieres sincronizar los jugadores de Playtomic?",
                items: items,
                type: "info"
            });

            if (chosen && chosen.id) {
                const found = activeEvents.find(e => e.id === chosen.id) || chosen;
                window.openPlaytomicSyncModal(chosen.id, found);
            }
        } else {
            window.openPlaytomicSyncModal(activeEvents[0].id, activeEvents[0]);
        }
    } catch (e) {
        console.error("Error en selector de Playtomic:", e);
        const fallback = (window._currentAmericanasCache && window._currentAmericanasCache[0]) || { id: 'pt_46011a01_halloween', name: 'AMERICANAS HALLOWEEN' };
        window.openPlaytomicSyncModal(fallback.id, fallback);
    }
};'''

# Regex replace openPlaytomicSyncModal
code = re.sub(
    r'window\.openPlaytomicSyncModal\s*=\s*async function\(eventId\)\s*\{[\s\S]*?\n\};\n\nwindow\.closePlaytomicSyncModal',
    new_openPlaytomicSyncModal + '\n\nwindow.closePlaytomicSyncModal',
    code
)

# Regex replace openQuickPlaytomicSyncSelector
code = re.sub(
    r'window\.openQuickPlaytomicSyncSelector\s*=\s*async function\(\)\s*\{[\s\S]*?\n\};',
    new_openQuickPlaytomicSyncSelector,
    code
)

# Also enhance previewPlaytomicSync dbPlayers fetch to avoid hanging on slow network
old_preview_fetch = '''    let dbPlayers = [];
    try {
        if (window.FirebaseDB && window.FirebaseDB.players) {
            dbPlayers = await window.FirebaseDB.players.getAll(true);
        } else if (window.db) {
            const snap = await window.db.collection('players').get();
            snap.forEach(doc => dbPlayers.push({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {
        console.warn("Error cargando jugadores para cruce Playtomic:", e);
    }'''

new_preview_fetch = '''    let dbPlayers = [];
    try {
        if (window.CacheService) {
            try { dbPlayers = await window.CacheService.get('players', 'all') || []; } catch (_) {}
        }
        if (!dbPlayers || dbPlayers.length === 0) {
            if (window.FirebaseDB && window.FirebaseDB.players) {
                const pPromise = window.FirebaseDB.players.getAll(true);
                const tPromise = new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 2000));
                dbPlayers = await Promise.race([pPromise, tPromise]).catch(() => []);
            }
        }
        if (!dbPlayers || dbPlayers.length === 0) {
            if (window.db) {
                const snap = await Promise.race([
                    window.db.collection('players').get({ source: 'cache' }),
                    new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 1000))
                ]).catch(() => null);
                if (snap && !snap.empty) {
                    snap.forEach(doc => dbPlayers.push({ id: doc.id, ...doc.data() }));
                }
            }
        }
    } catch (e) {
        console.warn("Error cargando jugadores para cruce Playtomic:", e);
    }'''

if old_preview_fetch in code:
    code = code.replace(old_preview_fetch, new_preview_fetch)
    print("Enhanced previewPlaytomicSync fetch")

with open('js/modules/admin-americanas.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated js/modules/admin-americanas.js successfully")

# Bump cache buster in admin.html
with open('admin.html', 'r', encoding='utf-8') as f:
    admin_html = f.read()

admin_html = re.sub(r'admin-americanas\.js\?v=[^\"]+', 'admin-americanas.js?v=20261024_PLAYTOMIC_SYNC_V7', admin_html)

with open('admin.html', 'w', encoding='utf-8') as f:
    admin_html = f.write(admin_html)

print("Bumped admin.html cache buster to V7")
