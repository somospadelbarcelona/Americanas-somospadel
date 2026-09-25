/**
 * test-purge-and-expired-cancelled-events-qa.js
 * 
 * Batería de Pruebas de Calidad (QA) Exhaustiva para:
 * 1. Detección y descarte automático de eventos cancelados antiguos (> 48h) por TTL.
 * 2. Prevención de fecha falsa de "HOY" en notificaciones de cancelaciones pasadas (ej. 2026-01-18).
 * 3. Limpieza automática y reactiva en 'sp_cancelled_events_log' en localStorage.
 * 4. Inclusión de eventos cancelados en fetchAllGlobalNotifications() para el SuperAdmin.
 * 5. Expansión y borrado de firmas derivadas en deleteNotificationGlobally().
 * 6. Purga masiva con purgeExpiredAndOldNotifications().
 * 7. Integración y disparo de purga masiva desde el botón del Gestor Global de Notificaciones.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("========================================================================");
console.log("🧪 QA TEST SUITE: PURGA Y CADUCIDAD DE EVENTOS CANCELADOS Y NOTIFICACIONES");
console.log("========================================================================\n");

const results = [];

async function test(name, fn) {
    try {
        const res = fn();
        if (res && typeof res.then === 'function') {
            await res;
        }
        results.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (err) {
        results.push({ name, status: 'FAIL', error: err.message });
        console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
    }
}

// -----------------------------------------------------------------------------
// Entorno Simulado de Navegador, LocalStorage y Firebase
// -----------------------------------------------------------------------------
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    }
    setItem(key, val) {
        this.store[key] = String(val);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

function createTestEnvironment() {
    const mockStorage = new MockLocalStorage();
    const listeners = {};

    const mockCollections = {
        broadcasts: new Map(),
        system_config: new Map(),
        players: new Map(),
        americanas: new Map(),
        entrenos: new Map()
    };

    const mockDb = {
        _collections: mockCollections,
        collection(name) {
            if (!this._collections[name]) {
                this._collections[name] = new Map();
            }
            const col = this._collections[name];
            return {
                doc: (docId) => ({
                    id: docId,
                    get: async () => {
                        const data = col.get(docId);
                        return {
                            exists: Boolean(data),
                            data: () => data || {}
                        };
                    },
                    set: async (val, options) => {
                        if (options && options.merge && col.has(docId)) {
                            col.set(docId, { ...col.get(docId), ...val });
                        } else {
                            col.set(docId, val);
                        }
                    },
                    delete: async () => {
                        col.delete(docId);
                    },
                    collection: (subName) => {
                        const subKey = `${name}/${docId}/${subName}`;
                        if (!this._collections[subKey]) {
                            this._collections[subKey] = new Map();
                        }
                        const subCol = this._collections[subKey];
                        return {
                            doc: (subDocId) => {
                                const finalSubDocId = subDocId || 'subdoc_' + Math.random().toString(36).substr(2, 7);
                                return {
                                    id: finalSubDocId,
                                    ref: { path: `${subKey}/${finalSubDocId}`, delete: async () => subCol.delete(finalSubDocId) },
                                    get: async () => {
                                        const d = subCol.get(finalSubDocId);
                                        return {
                                            exists: Boolean(d),
                                            id: finalSubDocId,
                                            ref: { path: `${subKey}/${finalSubDocId}`, delete: async () => subCol.delete(finalSubDocId) },
                                            data: () => d || {}
                                        };
                                    },
                                    set: async (val) => {
                                        subCol.set(finalSubDocId, val);
                                    },
                                    delete: async () => {
                                        subCol.delete(finalSubDocId);
                                    }
                                };
                            },
                            where: (field, op, val) => ({
                                get: async () => {
                                    const results = [];
                                    for (const [k, d] of subCol.entries()) {
                                        const parts = field.split('.');
                                        let cur = d;
                                        for (const p of parts) cur = cur ? cur[p] : undefined;
                                        if (cur === val) {
                                            results.push({
                                                id: k,
                                                ref: { path: `${subKey}/${k}`, delete: async () => subCol.delete(k) },
                                                data: () => d
                                            });
                                        }
                                    }
                                    return {
                                        empty: results.length === 0,
                                        forEach: (cb) => results.forEach(cb),
                                        docs: results
                                    };
                                }
                            }),
                            get: async () => {
                                const docs = [];
                                for (const [k, d] of subCol.entries()) {
                                    docs.push({
                                        id: k,
                                        ref: { path: `${subKey}/${k}`, delete: async () => subCol.delete(k) },
                                        data: () => d
                                    });
                                }
                                return {
                                    empty: docs.length === 0,
                                    forEach: (cb) => docs.forEach(cb),
                                    docs
                                };
                            }
                        };
                    }
                }),
                where: (field, op, val) => ({
                    get: async () => {
                        const results = [];
                        for (const [k, d] of col.entries()) {
                            const parts = field.split('.');
                            let cur = d;
                            for (const p of parts) cur = cur ? cur[p] : undefined;
                            if (cur === val) {
                                results.push({
                                    id: k,
                                    ref: { path: `${name}/${k}`, delete: async () => col.delete(k) },
                                    data: () => d
                                });
                            }
                        }
                        return {
                            empty: results.length === 0,
                            forEach: (cb) => results.forEach(cb),
                            docs: results
                        };
                    }
                }),
                orderBy: () => ({
                    limit: () => ({
                        get: async () => {
                            const docs = [];
                            for (const [k, d] of col.entries()) {
                                docs.push({
                                    id: k,
                                    ref: { path: `${name}/${k}`, delete: async () => col.delete(k) },
                                    data: () => d
                                });
                            }
                            return {
                                empty: docs.length === 0,
                                forEach: (cb) => docs.forEach(cb),
                                docs
                            };
                        }
                    })
                }),
                limit: () => ({
                    get: async () => {
                        const docs = [];
                        for (const [k, d] of col.entries()) {
                            docs.push({
                                id: k,
                                ref: { path: `${name}/${k}`, delete: async () => col.delete(k) },
                                data: () => d
                            });
                        }
                        return {
                            empty: docs.length === 0,
                            forEach: (cb) => docs.forEach(cb),
                            docs
                        };
                    }
                }),
                get: async () => {
                    const docs = [];
                    for (const [k, d] of col.entries()) {
                        docs.push({
                            id: k,
                            ref: { path: `${name}/${k}`, delete: async () => col.delete(k) },
                            data: () => d
                        });
                    }
                    return {
                        empty: docs.length === 0,
                        forEach: (cb) => docs.forEach(cb),
                        docs
                    };
                }
            };
        },
        batch() {
            const operations = [];
            return {
                delete(docRef) {
                    operations.push(() => docRef.delete && docRef.delete());
                },
                set(docRef, data, options) {
                    operations.push(() => docRef.set && docRef.set(data, options));
                },
                commit: async () => {
                    for (const op of operations) {
                        await op();
                    }
                }
            };
        }
    };

    const elementsMap = new Map();
    function createMockElement(id = '', tag = 'div') {
        const el = {
            id,
            tagName: tag.toUpperCase(),
            _innerHTML: '',
            style: {},
            value: '',
            disabled: false,
            dataset: {},
            children: [],
            get innerHTML() { return this._innerHTML; },
            set innerHTML(val) {
                this._innerHTML = val;
                const idMatches = [...val.matchAll(/id=["']([^"']+)["']/g)];
                for (const match of idMatches) {
                    if (!elementsMap.has(match[1])) {
                        elementsMap.set(match[1], createMockElement(match[1]));
                    }
                }
            },
            querySelector: () => null,
            querySelectorAll: () => [],
            appendChild(c) { this.children.push(c); return c; },
            setAttribute: () => {},
            getAttribute: () => null,
            addEventListener: () => {}
        };
        if (id) elementsMap.set(id, el);
        return el;
    }

    const mockDocument = {
        getElementById: (id) => elementsMap.get(id) || null,
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: (tag) => createMockElement('', tag),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        readyState: 'complete',
        addEventListener: () => {}
    };

    const mockWindow = {
        addEventListener: (event, handler) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        },
        removeEventListener: (event, handler) => {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(h => h !== handler);
        },
        dispatchEvent: (event) => {
            const list = listeners[event.type] || [];
            list.forEach(h => h(event));
        },
        document: mockDocument,
        localStorage: mockStorage,
        location: { hash: '' },
        navigator: { userAgent: 'Chrome/120' },
        db: mockDb,
        firebase: {
            firestore: {
                FieldValue: {
                    serverTimestamp: () => new Date().toISOString(),
                    arrayUnion: (...arr) => arr
                }
            }
        },
        Store: {
            getState: (key) => {
                if (key === 'currentUser') return { uid: 'admin_test_1', email: 'admin@somospadel.com', role: 'super_admin' };
                return null;
            }
        },
        AuthService: {
            currentUser: { uid: 'admin_test_1', email: 'admin@somospadel.com', role: 'super_admin' }
        },
        AdminAuth: {
            user: { uid: 'admin_test_1', role: 'super_admin' },
            hasAdminRole: (r) => ['super_admin', 'superadmin', 'admin', 'admin_player'].includes(r)
        },
        PremiumModal: {
            confirm: async () => true,
            alert: async () => true
        },
        AdminViews: {}
    };

    return {
        mockWindow,
        mockStorage,
        mockDb,
        elementsMap,
        mockDocument
    };
}

function loadAllModules(env) {
    const sandbox = {
        window: env.mockWindow,
        document: env.mockDocument,
        localStorage: env.mockStorage,
        navigator: env.mockWindow.navigator,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        setInterval: global.setInterval,
        clearInterval: global.clearInterval
    };

    vm.createContext(sandbox);

    // 1. NotificationService.js
    const notifServicePath = path.resolve('js/modules/common/NotificationService.js');
    const notifServiceCode = fs.readFileSync(notifServicePath, 'utf8');
    vm.runInContext(notifServiceCode, sandbox);

    // 2. NotificationUi.js
    const notifUiPath = path.resolve('js/modules/ui/NotificationUi.js');
    const notifUiCode = fs.readFileSync(notifUiPath, 'utf8');
    vm.runInContext(notifUiCode, sandbox);

    // 3. AdminNotifications.js
    const adminNotifsPath = path.resolve('js/modules/admin/AdminNotifications.js');
    const adminNotifsCode = fs.readFileSync(adminNotifsPath, 'utf8');
    vm.runInContext(adminNotifsCode, sandbox);

    // 4. admin-notifications-manager.js
    const adminManagerPath = path.resolve('js/modules/admin-notifications-manager.js');
    const adminManagerCode = fs.readFileSync(adminManagerPath, 'utf8');
    vm.runInContext(adminManagerCode, sandbox);

    if (env.mockWindow.NotificationServiceClass && !env.mockWindow.NotificationService) {
        env.mockWindow.NotificationService = new env.mockWindow.NotificationServiceClass();
    }

    return {
        NotificationService: env.mockWindow.NotificationService,
        NotificationServiceClass: env.mockWindow.NotificationServiceClass,
        NotificationUi: env.mockWindow.NotificationUi,
        AdminNotifications: env.mockWindow.AdminNotifications,
        AdminNotificationsManagerCtrl: env.mockWindow.AdminNotificationsManagerCtrl
    };
}

// -----------------------------------------------------------------------------
// EJECUCIÓN DE PRUEBAS
// -----------------------------------------------------------------------------
async function runSuite() {
    // -------------------------------------------------------------------------
    // TEST 1: Entreno cancelado antiguo de enero 2026-01-18 no se genera como activa
    // -------------------------------------------------------------------------
    await test('1. Entreno cancelado antiguo (2026-01-18) NO se genera como notificación activa en getMergedNotifications()', () => {
        const env = createTestEnvironment();
        const { NotificationServiceClass } = loadAllModules(env);
        const service = new NotificationServiceClass();

        // Simular evento antiguo cancelado (caso real reportado por el usuario: previsto para 2026-01-18)
        const oldCancelledEvent = {
            id: 'ent_mixto_1801',
            name: 'ENTRENO MIXTO 18/01',
            status: 'cancelled',
            date: '2026-01-18',
            time: '10:00',
            createdAt: '2026-01-10T12:00:00.000Z'
        };

        // Procesar en feed
        service._eventsMap.set(oldCancelledEvent.id, { event: oldCancelledEvent, type: 'entreno' });
        service._processEventsFeed();

        const merged = service.getMergedNotifications();
        const found = merged.find(n => n.id === 'evt_cancelled_entreno_ent_mixto_1801' || (n.data && n.data.eventId === 'ent_mixto_1801'));

        assert.strictEqual(Boolean(found), false, 'El entreno cancelado antiguo NO debe aparecer en getMergedNotifications()');
    });

    // -------------------------------------------------------------------------
    // TEST 2: No se asigna fecha falsa de HOY y no se agrupa en "Hoy"
    // -------------------------------------------------------------------------
    await test('2. Evento cancelado antiguo NO recibe fecha falsa de HOY y NotificationUi.timeAgo() no devuelve "Ahora" ni "10 h"', () => {
        const env = createTestEnvironment();
        const { NotificationServiceClass, NotificationUi } = loadAllModules(env);
        const service = new NotificationServiceClass();

        const pastEvent = {
            id: 'ent_fem_2309',
            name: 'ENTRENO FEMENINO 23/09',
            status: 'cancelled',
            date: '2026-09-21',
            time: '18:00',
            createdAt: '2026-09-20T10:00:00.000Z'
        };

        const extractedTs = service._extractEventTimestamp(pastEvent);
        assert.ok(!extractedTs.startsWith(new Date().toISOString().substring(0, 10)), 'No debe asignar la fecha de hoy');
        assert.ok(extractedTs.includes('2026-09-20') || extractedTs.includes('2026-09-21'), 'Debe reflejar la fecha real del evento');

        // Comprobar que NotificationUi.timeAgo refleja días, no "Ahora" ni horas de hoy
        const label = NotificationUi.timeAgo(extractedTs);
        assert.ok(!label.includes('Ahora'), 'No debe decir Ahora para un evento pasado');
    });

    // -------------------------------------------------------------------------
    // TEST 3: sp_cancelled_events_log limpia automáticamente caducados (>48h) o purgados
    // -------------------------------------------------------------------------
    await test('3. sp_cancelled_events_log limpia reactivamente eventos con > 48h de antigüedad o purgados', () => {
        const env = createTestEnvironment();

        // Inyectar en localStorage 3 eventos cancelados:
        // 1. Uno de enero 2026 (> 48h) -> debe ser purgado automáticamente
        // 2. Uno de hace 12 horas (< 48h) -> debe conservarse
        // 3. Uno purgado globalmente en globalPurgedIds -> debe ser eliminado
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const initialLog = [
            {
                id: 'evt_cancelled_entreno_old_january',
                title: '⛔ Entreno Cancelado: ENTRENO MIXTO 18/01',
                timestamp: '2026-01-18T10:00:00.000Z',
                category: 'entrenos',
                data: { eventId: 'old_january' }
            },
            {
                id: 'evt_cancelled_entreno_recent_12h',
                title: '⛔ Entreno Cancelado: ENTRENO HOY RECIENTE',
                timestamp: twelveHoursAgo,
                category: 'entrenos',
                data: { eventId: 'recent_12h' }
            },
            {
                id: 'evt_cancelled_americana_purged_1',
                title: '⛔ Americana Cancelada: TORNEO PURGADO',
                timestamp: twelveHoursAgo,
                category: 'matches',
                data: { eventId: 'purged_1' }
            }
        ];

        env.mockStorage.setItem('sp_cancelled_events_log', JSON.stringify(initialLog));

        const { NotificationServiceClass } = loadAllModules(env);
        const service = new NotificationServiceClass();
        service.globalPurgedIds = new Set(['evt_cancelled_americana_purged_1', 'purged_1']);

        // Invocamos _getCancelledEventsLog()
        const cleaned = service._getCancelledEventsLog();

        // Debe conservar únicamente el reciente (12h) no purgado
        assert.strictEqual(cleaned.length, 1, 'Debe haber exactamente 1 evento cancelado activo en el log');
        assert.strictEqual(cleaned[0].id, 'evt_cancelled_entreno_recent_12h', 'El evento conservado debe ser el reciente');

        // Verificar que localStorage se actualizó automáticamente
        const updatedStorage = JSON.parse(env.mockStorage.getItem('sp_cancelled_events_log'));
        assert.strictEqual(updatedStorage.length, 1, 'LocalStorage debe haberse saneado');
        assert.strictEqual(updatedStorage[0].id, 'evt_cancelled_entreno_recent_12h');
    });

    // -------------------------------------------------------------------------
    // TEST 4: fetchAllGlobalNotifications() lista los eventos cancelados activos para SuperAdmin
    // -------------------------------------------------------------------------
    await test('4. fetchAllGlobalNotifications() incluye eventos cancelados activos con type "event_cancelled"', async () => {
        const env = createTestEnvironment();

        // Añadir una convocatoria cancelada en Firestore y otra reciente en localStorage
        const recentTime = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
        env.mockDb._collections.entrenos.set('ent_live_cancelled', {
            name: 'ENTRENO MAÑANERO CANCELADO',
            status: 'cancelled',
            date: '2026-09-25',
            time: '11:00',
            updatedAt: recentTime
        });

        env.mockStorage.setItem('sp_cancelled_events_log', JSON.stringify([
            {
                id: 'evt_cancelled_americana_amer_44',
                title: '⛔ Americana Cancelada: AMERICANA NOCTURNA',
                body: 'Suspendida por lluvia',
                timestamp: recentTime,
                category: 'matches',
                data: { eventId: 'amer_44' }
            }
        ]));

        const { NotificationServiceClass } = loadAllModules(env);
        const service = new NotificationServiceClass();

        const globalList = await service.fetchAllGlobalNotifications();

        const cancelledItems = globalList.filter(item => item.type === 'event_cancelled' || item.isCancelled);
        assert.ok(cancelledItems.length >= 1, 'Debe listar al menos 1 evento cancelado en la vista de SuperAdmin');
        
        const foundAmericana = cancelledItems.find(i => i.id === 'evt_cancelled_americana_amer_44' || i.data?.eventId === 'amer_44');
        assert.ok(Boolean(foundAmericana), 'Debe incluir la americana cancelada en la vista global');
    });

    // -------------------------------------------------------------------------
    // TEST 5: deleteNotificationGlobally() purga firmas ampliadas y localStorage
    // -------------------------------------------------------------------------
    await test('5. deleteNotificationGlobally() purga el evento y sus firmas derivadas (evt_cancelled_..., evt_new_...) y limpia sp_cancelled_events_log', async () => {
        const env = createTestEnvironment();

        const targetEvtId = 'evt_test_999';
        const notifId = `evt_cancelled_entreno_${targetEvtId}`;

        // Guardar en sp_cancelled_events_log
        env.mockStorage.setItem('sp_cancelled_events_log', JSON.stringify([
            { id: notifId, title: '⛔ Entreno Cancelado: PRUEBA 999', data: { eventId: targetEvtId } }
        ]));

        // Simular que 2 jugadores tenían notificaciones de este evento
        const p1Col = env.mockDb.collection('players').doc('p1').collection('notifications');
        await p1Col.doc(notifId).set({ title: 'Entreno Cancelado', data: { eventId: targetEvtId } });
        const p2Col = env.mockDb.collection('players').doc('p2').collection('notifications');
        await p2Col.doc(`evt_new_entreno_${targetEvtId}`).set({ title: 'Nuevo Entreno', data: { eventId: targetEvtId } });

        const { NotificationServiceClass } = loadAllModules(env);
        const service = new NotificationServiceClass();

        // Ejecutar purga global
        const res = await service.deleteNotificationGlobally(notifId, { eventId: targetEvtId, title: 'PRUEBA 999' });

        assert.strictEqual(res.success, true, 'deleteNotificationGlobally debe retornar success: true');

        // 1. Debe haberse limpiado de sp_cancelled_events_log
        const logAfter = JSON.parse(env.mockStorage.getItem('sp_cancelled_events_log') || '[]');
        assert.ok(!logAfter.some(l => l.id === notifId), 'El evento debe haberse retirado de sp_cancelled_events_log');

        // 2. Debe haberse marcado sp_evt_deleted_
        assert.strictEqual(env.mockStorage.getItem('sp_evt_deleted_' + notifId), 'true');
        assert.strictEqual(env.mockStorage.getItem('sp_evt_deleted_' + `evt_new_entreno_${targetEvtId}`), 'true');

        // 3. Debe haberse registrado en system_config/purged_notifications
        const cfgDoc = await env.mockDb.collection('system_config').doc('purged_notifications').get();
        const purgedIds = cfgDoc.data().purgedIds || [];
        assert.ok(purgedIds.includes(notifId), 'Debe incluir el ID purgado');
        assert.ok(purgedIds.includes(`evt_cancelled_entreno_${targetEvtId}`), 'Debe incluir firma evt_cancelled_');
        assert.ok(purgedIds.includes(`evt_new_entreno_${targetEvtId}`), 'Debe incluir firma evt_new_');
    });

    // -------------------------------------------------------------------------
    // TEST 6: purgeExpiredAndOldNotifications() purga masivamente notificaciones obsoletas
    // -------------------------------------------------------------------------
    await test('6. purgeExpiredAndOldNotifications() purga en masa notificaciones obsoletas (>48h) y registros de eventos antiguos', async () => {
        const env = createTestEnvironment();

        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

        // Registrar jugador en colección 'players'
        await env.mockDb.collection('players').doc('player_alpha').set({ name: 'Alpha' });

        // Subcolección de jugador con 1 vieja (>48h) y 1 nueva (<48h)
        const p1Notifs = env.mockDb.collection('players').doc('player_alpha').collection('notifications');
        await p1Notifs.doc('notif_old_1').set({ title: 'Aviso Antiguo', timestamp: fiveDaysAgo });
        await p1Notifs.doc('notif_fresh_1').set({ title: 'Aviso Nuevo', timestamp: oneHourAgo });

        // Log con 1 evento viejo y 1 nuevo
        env.mockStorage.setItem('sp_cancelled_events_log', JSON.stringify([
            { id: 'evt_cancelled_entreno_old_7d', title: 'Cancelado hace 7d', timestamp: fiveDaysAgo },
            { id: 'evt_cancelled_entreno_new_1h', title: 'Cancelado hace 1h', timestamp: oneHourAgo }
        ]));

        const { NotificationServiceClass } = loadAllModules(env);
        const service = new NotificationServiceClass();

        const purgeResult = await service.purgeExpiredAndOldNotifications();

        assert.strictEqual(purgeResult.success, true, 'purgeExpiredAndOldNotifications debe retornar success: true');
        assert.ok(purgeResult.purgedCancelledEventsCount >= 1, 'Debe haber purgado cancelaciones antiguas');
        assert.ok(purgeResult.deletedFromPlayersCount >= 1, 'Debe haber eliminado notificaciones viejas de jugadores');

        // Comprobar que en localStorage solo queda la reciente
        const remainingLog = JSON.parse(env.mockStorage.getItem('sp_cancelled_events_log'));
        assert.strictEqual(remainingLog.length, 1);
        assert.strictEqual(remainingLog[0].id, 'evt_cancelled_entreno_new_1h');
    });

    // -------------------------------------------------------------------------
    // TEST 7: Botón del Gestor Global de Notificaciones y filtro de categoría
    // -------------------------------------------------------------------------
    await test('7. El botón "🧹 Purgar Antiguas y Caducadas" y el filtro de canceladas del Gestor Global funcionan y purgan', async () => {
        const env = createTestEnvironment();

        // Crear contenedor en el DOM simulado
        const contentArea = env.mockDocument.createElement('div');
        contentArea.id = 'content-area';
        env.elementsMap.set('content-area', contentArea);

        const { AdminNotificationsManagerCtrl } = loadAllModules(env);

        // Inicializar controlador en la vista
        await AdminNotificationsManagerCtrl.init();

        // 1. Comprobar que el HTML renderizado contiene el botón de purga masiva
        assert.ok(
            contentArea.innerHTML.includes('🧹 Purgar Antiguas y Caducadas'),
            'El panel del SuperAdmin debe contener el botón "🧹 Purgar Antiguas y Caducadas"'
        );

        // 2. Comprobar que contiene la opción de filtro para eventos cancelados
        assert.ok(
            contentArea.innerHTML.includes('Convocatorias Canceladas') || contentArea.innerHTML.includes('event_cancelled'),
            'El selector de categorías debe contener el filtro de convocatorias canceladas'
        );

        // 3. Ejecutar purga masiva a través del controlador
        let purgeExecuted = false;
        env.mockWindow.NotificationService.purgeExpiredAndOldNotifications = async () => {
            purgeExecuted = true;
            return { success: true, purgedCount: 5, deletedFromPlayersCount: 3, purgedCancelledEventsCount: 2 };
        };

        await AdminNotificationsManagerCtrl.purgeExpiredAndOld();
        assert.strictEqual(purgeExecuted, true, 'purgeExpiredAndOld() debe disparar NotificationService.purgeExpiredAndOldNotifications()');
    });

    // -------------------------------------------------------------------------
    // RESUMEN FINAL
    // -------------------------------------------------------------------------
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    console.log("\n========================================================================");
    console.log(`📊 TOTAL PRUEBAS EJECUTADAS: ${total}`);
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLADAS: ${failed}`);
    console.log("========================================================================\n");

    process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch(err => {
    console.error("FATAL ERROR EN SUITE QA:", err);
    process.exit(1);
});
