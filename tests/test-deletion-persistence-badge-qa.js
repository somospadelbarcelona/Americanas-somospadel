/**
 * test-deletion-persistence-badge-qa.js
 * 
 * Batería de Pruebas Exhaustivas de Calidad (QA):
 * Persistencia de Eliminación de Notificaciones y Sincronización del Badge tras Recarga Total.
 * 
 * Valida:
 * 1. Inicialización correcta de 8 notificaciones no leídas (Firestore, Broadcast, Eventos Reales, Cancelado).
 * 2. Conteo inicial exacto (getMergedNotifications().length = 8, unreadCount = 8, badge = 8).
 * 3. Eliminación en caliente de 3 notificaciones heterogéneas (Firestore, Evento, Cancelado).
 * 4. Reflejo inmediato en memoria y badges DOM (de 8 a 5).
 * 5. RECARGA TOTAL de la app (nueva instancia de NotificationService + snapshot Firestore):
 *    - getMergedNotifications().length es exactamente 5.
 *    - unreadCount es exactamente 5.
 *    - Las 3 notificaciones eliminadas NO aparecen en la lista.
 *    - El badge refleja fielmente '5' y no '8'.
 * 6. Marcado de lectura (markAsRead):
 *    - 2 notificaciones marcadas como leídas.
 *    - Tras recarga total de la app, permanecen read: true y unreadCount desciende a 3.
 * 7. Vaciado total (deleteAllMyNotifications):
 *    - Tras recarga total de la app, el listado queda en 0 y unreadCount en 0.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const results = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        const res = fn();
        if (res && typeof res.then === 'function') {
            return res.then(
                () => {
                    passCount++;
                    results.push({ name, status: 'PASS' });
                    console.log(`✅ PASS: ${name}`);
                },
                (err) => {
                    failCount++;
                    results.push({ name, status: 'FAIL', error: err.message });
                    console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
                }
            );
        }
        passCount++;
        results.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (err) {
        failCount++;
        results.push({ name, status: 'FAIL', error: err.message });
        console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
    }
}

console.log('========================================================================');
console.log('🧪 QA SUITE: PERSISTENCIA DE ELIMINACIÓN Y SINCRONIZACIÓN DE BADGE');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. Simulación de Entorno del Navegador
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

// Store compartido persistente para emular recargas del navegador
const persistentStorage = new MockLocalStorage();
// Silenciar radar del clima previo para aislar la prueba a las 8 notificaciones exactas
persistentStorage.setItem('sp_radar_relocated_notif_deleted', 'true');

function createDOM() {
    const classListMock = (classes = []) => {
        const set = new Set(classes);
        return {
            add: (c) => set.add(c),
            remove: (c) => set.delete(c),
            contains: (c) => set.has(c),
            toggle: (c) => set.has(c) ? set.delete(c) : set.add(c)
        };
    };

    const dom = {
        'notif-badge': { id: 'notif-badge', style: { display: 'none' }, innerText: '0', classList: classListMock() },
        'notif-bell-icon': { id: 'notif-bell-icon', style: {}, classList: classListMock(), offsetWidth: 12 },
        'drawer-notif-badge': { id: 'drawer-notif-badge', style: { display: 'none' }, innerText: '0', classList: classListMock() },
        'drawer-notif-bell-icon': { id: 'drawer-notif-bell-icon', style: {}, classList: classListMock(), offsetWidth: 12 },
        'notif-list': { id: 'notif-list', innerHTML: '' }
    };

    const doc = {
        getElementById: (id) => dom[id] || null,
        querySelector: (sel) => null,
        querySelectorAll: (sel) => [],
        createElement: (tag) => ({
            tagName: tag,
            className: '',
            style: {},
            innerHTML: '',
            children: [],
            appendChild: () => {},
            remove: () => {},
            classList: classListMock()
        }),
        body: {
            classList: classListMock(),
            appendChild: () => {}
        },
        readyState: 'complete',
        addEventListener: () => {},
        removeEventListener: () => {}
    };

    return { dom, doc };
}

// -----------------------------------------------------------------------------
// 2. Simulación de Base de Datos Firestore
// -----------------------------------------------------------------------------
function createMockFirestore(initialFirestoreDocs = []) {
    let currentDocs = [...initialFirestoreDocs];
    let snapshotListener = null;

    const mockDb = {
        _getDocs: () => currentDocs,
        _triggerSnapshot: () => {
            if (snapshotListener) {
                snapshotListener({
                    empty: currentDocs.length === 0,
                    docs: currentDocs.map(d => ({
                        id: d.id,
                        data: () => ({ ...d }),
                        ref: { path: `players/user_qa_123/notifications/${d.id}` }
                    })),
                    docChanges: () => []
                });
            }
        },
        collection: (colName) => {
            if (colName === 'system_config') {
                return {
                    doc: (docId) => ({
                        onSnapshot: (cb) => {
                            cb({ exists: false, data: () => ({}) });
                            return () => {};
                        },
                        get: async () => ({ exists: false, data: () => ({}) }),
                        set: async () => {}
                    })
                };
            }
            if (colName === 'players') {
                return {
                    doc: (userId) => ({
                        collection: (subName) => {
                            if (subName === 'notifications') {
                                return {
                                    orderBy: () => ({
                                        limit: () => ({
                                            onSnapshot: (cb) => {
                                                snapshotListener = cb;
                                                mockDb._triggerSnapshot();
                                                return () => { snapshotListener = null; };
                                            }
                                        })
                                    }),
                                    get: async () => ({
                                        empty: currentDocs.length === 0,
                                        docs: currentDocs.map(d => ({
                                            id: d.id,
                                            ref: { path: `players/${userId}/notifications/${d.id}` },
                                            data: () => ({ ...d })
                                        }))
                                    }),
                                    doc: (docId) => ({
                                        delete: async () => {
                                            currentDocs = currentDocs.filter(d => d.id !== docId);
                                        },
                                        update: async (fields) => {
                                            const target = currentDocs.find(d => d.id === docId);
                                            if (target) Object.assign(target, fields);
                                        }
                                    })
                                };
                            }
                            return {};
                        }
                    })
                };
            }
            return {
                onSnapshot: () => () => {},
                get: async () => ({ docs: [], empty: true, forEach: () => {} }),
                doc: () => ({
                    get: async () => ({ exists: false }),
                    delete: async () => {},
                    onSnapshot: () => () => {}
                })
            };
        },
        batch: () => {
            const ops = [];
            return {
                delete: (ref) => ops.push({ type: 'delete', ref }),
                commit: async () => {
                    for (const op of ops) {
                        const id = op.ref.path.split('/').pop();
                        currentDocs = currentDocs.filter(d => d.id !== id);
                    }
                }
            };
        }
    };

    return mockDb;
}

// -----------------------------------------------------------------------------
// 3. Cargador de Entorno de Ejecución
// -----------------------------------------------------------------------------
function setupEnvironment(firestoreDocs) {
    const { dom, doc } = createDOM();
    const mockDb = createMockFirestore(firestoreDocs);

    global.window = {
        db: mockDb,
        localStorage: persistentStorage,
        document: doc,
        auth: {
            currentUser: { uid: 'user_qa_123', role: 'player' },
            onAuthStateChanged: (cb) => cb({ uid: 'user_qa_123' })
        },
        Store: {
            getState: (k) => k === 'currentUser' ? { uid: 'user_qa_123', role: 'player' } : null,
            subscribe: () => {}
        },
        addEventListener: () => {},
        matchMedia: () => ({ matches: false }),
        navigator: {
            setAppBadge: async (count) => { global.window._appBadge = count; },
            clearAppBadge: async () => { global.window._appBadge = 0; }
        }
    };

    global.localStorage = persistentStorage;
    global.document = doc;
    global.navigator = global.window.navigator;

    // Cargar NotificationService
    const notifServiceCode = fs.readFileSync(path.join(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
    eval(notifServiceCode);

    global.window.NotificationService = new global.window.NotificationServiceClass();

    // Cargar NotificationUi
    const notifUiCode = fs.readFileSync(path.join(__dirname, '../js/modules/ui/NotificationUi.js'), 'utf8');
    eval(notifUiCode);

    return {
        NotificationServiceClass: global.window.NotificationServiceClass,
        NotificationUi: global.window.NotificationUi,
        mockDb,
        dom,
        doc
    };
}

// -----------------------------------------------------------------------------
// BATERÍA DE PRUEBAS QA
// -----------------------------------------------------------------------------
async function runSuite() {

    // Documentos originales en Firestore (4 normales + 1 broadcast)
    const initialFirestoreDocs = [
        { id: 'notif_fs_1', title: 'Inscripción Confirmada', body: 'Plaza reservada para Americana Cornellà', timestamp: '2026-09-24T18:00:00.000Z', read: false },
        { id: 'notif_fs_2', title: 'Nueva Pista Asignada', body: 'Pista central para tu partido', timestamp: '2026-09-24T18:10:00.000Z', read: false },
        { id: 'notif_fs_3', title: 'Actualización de Nivel', body: 'Tu puntuación ha subido a 3.75', timestamp: '2026-09-24T18:20:00.000Z', read: false },
        { id: 'notif_fs_4', title: 'Recordatorio de Horario', body: 'Llegar 10 min antes al club', timestamp: '2026-09-24T18:30:00.000Z', read: false },
        { id: 'notif_bcast_5', title: '📢 Torneo Fin de Mes', body: 'Gran torneo mensual SomosPadel', timestamp: '2026-09-24T18:40:00.000Z', read: false, data: { broadcastId: 'bcast_fin_mes_01' } }
    ];

    // Eventos en vivo (2 activos)
    const activeEvents = [
        { id: 'evt_new_americana_101', title: '🏆 Nueva Americana Cornellà', body: 'Torneo Viernes Tarde', timestamp: '2026-09-24T18:45:00.000Z', category: 'matches', read: false, data: { eventId: '101' } },
        { id: 'evt_new_entreno_102', title: '💪 Nuevo Entreno Coach Alex', body: 'Sesión Sábado Mañana', timestamp: '2026-09-24T18:50:00.000Z', category: 'entrenos', read: false, data: { eventId: '102' } }
    ];

    // Evento cancelado persistido en log
    const cancelledLogItem = {
        id: 'evt_cancelled_entreno_201',
        title: '⛔ Entreno Cancelado: Coach Alex',
        body: 'La sesión ha sido cancelada por condiciones de lluvia',
        timestamp: '2026-09-24T18:55:00.000Z',
        category: 'entrenos',
        isCancelled: true,
        read: false,
        data: { eventId: '201', isCancelled: true }
    };

    persistentStorage.setItem('sp_cancelled_events_log', JSON.stringify([cancelledLogItem]));

    let env = setupEnvironment(initialFirestoreDocs);

    // Helper para poblar eventos en un NotificationService dado
    function populateFeed(service) {
        service.eventNotifications = [...activeEvents];
        // En _eventsMap para cuando re-procese el feed
        service._eventsMap = new Map();
        service._eventsMap.set('101', {
            type: 'americana',
            event: { id: '101', name: 'Americana Cornellà', date: '2026-09-25', time: '18:00', courts: 4, status: 'open' }
        });
        service._eventsMap.set('102', {
            type: 'entreno',
            event: { id: '102', name: 'Nuevo Entreno Coach Alex', date: '2026-09-26', time: '10:00', courts: 2, status: 'open' }
        });
    }

    // =========================================================================
    // FASE 1: ARRANQUE INICIAL Y VERIFICACIÓN DE 8 NOTIFICACIONES
    // =========================================================================
    let notifService;

    await test('Fase 1.1: Inicialización con 8 notificaciones no leídas activas', () => {
        notifService = new env.NotificationServiceClass();
        populateFeed(notifService);

        // Inicializar Firestore listener
        notifService.init();
        global.window.NotificationService = notifService;
        env.NotificationUi._bindService();

        const merged = notifService.getMergedNotifications();
        assert.strictEqual(merged.length, 8, `Se esperaban 8 notificaciones combinadas, encontradas: ${merged.length}`);
        assert.strictEqual(notifService.unreadCount, 8, `unreadCount esperado 8, obtenido: ${notifService.unreadCount}`);
    });

    await test('Fase 1.2: Sincronización exacta de badges DOM iniciales con "8"', () => {
        env.NotificationUi.updateBadge();
        const headerBadge = env.dom['notif-badge'];
        const drawerBadge = env.dom['drawer-notif-badge'];

        assert.strictEqual(headerBadge.innerText, '8', `Badge header esperado '8', tiene: '${headerBadge.innerText}'`);
        assert.strictEqual(headerBadge.style.display, 'flex', `Badge header debe estar en display flex`);
        assert.strictEqual(drawerBadge.innerText, '8', `Badge drawer esperado '8', tiene: '${drawerBadge.innerText}'`);
        assert.strictEqual(drawerBadge.style.display, 'inline-flex', `Badge drawer debe estar en display inline-flex`);
    });

    // =========================================================================
    // FASE 2: ELIMINACIÓN EN CALIENTE DE 3 NOTIFICACIONES HETEROGÉNEAS
    // =========================================================================
    await test('Fase 2.1: Eliminación de 1 Firestore (notif_fs_1), 1 Evento (evt_new_americana_101) y 1 Cancelado (evt_cancelled_entreno_201)', async () => {
        // Eliminar las 3 notificaciones
        await notifService.deleteNotification('notif_fs_1');
        await notifService.deleteNotification('evt_new_americana_101');
        await notifService.deleteNotification('evt_cancelled_entreno_201');

        const merged = notifService.getMergedNotifications();
        assert.strictEqual(merged.length, 5, `Tras borrar 3 de 8, la lista debe ser 5. Obtenida: ${merged.length}`);
        assert.strictEqual(notifService.unreadCount, 5, `unreadCount debe ser 5. Obtenido: ${notifService.unreadCount}`);

        // Comprobar lápidas locales de borrado en localStorage
        assert.strictEqual(persistentStorage.getItem('sp_deleted_notif_notif_fs_1'), 'true', 'Lápida sp_deleted_notif_notif_fs_1 debe ser true');
        assert.strictEqual(persistentStorage.getItem('sp_evt_deleted_evt_new_americana_101'), 'true', 'Lápida sp_evt_deleted_evt_new_americana_101 debe ser true');
        assert.strictEqual(persistentStorage.getItem('sp_evt_deleted_evt_cancelled_entreno_201'), 'true', 'Lápida sp_evt_deleted_evt_cancelled_entreno_201 debe ser true');
    });

    await test('Fase 2.2: Reflejo en caliente del badge DOM pasando a "5"', () => {
        env.NotificationUi.updateBadge();
        const headerBadge = env.dom['notif-badge'];
        const drawerBadge = env.dom['drawer-notif-badge'];

        assert.strictEqual(headerBadge.innerText, '5', `Badge header en caliente debe ser '5', tiene: '${headerBadge.innerText}'`);
        assert.strictEqual(drawerBadge.innerText, '5', `Badge drawer en caliente debe ser '5', tiene: '${drawerBadge.innerText}'`);
    });

    // =========================================================================
    // FASE 3: SIMULACIÓN DE RECARGA TOTAL DE LA APP
    // =========================================================================
    await test('Fase 3.1: Recarga total con nueva instancia de NotificationService y re-ingesta de Firestore snapshot', () => {
        // Simular reload completo del navegador:
        // Se destruye la instancia anterior y se inicializa una nueva instancia NotificationService,
        // recibiendo el snapshot de Firestore (incluso si la red o cache Firestore incluyera docs originales).
        env = setupEnvironment(initialFirestoreDocs);

        const reloadedService = new env.NotificationServiceClass();
        populateFeed(reloadedService);

        // Iniciar observadores y Firestore
        reloadedService.init();
        global.window.NotificationService = reloadedService;
        env.NotificationUi._bindService();

        const merged = reloadedService.getMergedNotifications();

        assert.strictEqual(merged.length, 5, `Tras recarga total, merged.length debe ser exactamente 5. Obtenido: ${merged.length}`);
        assert.strictEqual(reloadedService.unreadCount, 5, `Tras recarga total, unreadCount debe ser exactamente 5. Obtenido: ${reloadedService.unreadCount}`);

        // Verificar que ninguna de las 3 notificaciones eliminadas reaparece
        const ids = merged.map(n => n.id);
        assert.ok(!ids.includes('notif_fs_1'), 'notif_fs_1 NO debe reaparecer tras recargar');
        assert.ok(!ids.includes('evt_new_americana_101'), 'evt_new_americana_101 NO debe reaparecer tras recargar');
        assert.ok(!ids.includes('evt_cancelled_entreno_201'), 'evt_cancelled_entreno_201 NO debe reaparecer tras recargar');
    });

    await test('Fase 3.2: Sincronización del badge DOM tras recarga total reflejando fielmente "5" y no "8"', () => {
        env.NotificationUi.updateBadge();
        const headerBadge = env.dom['notif-badge'];
        const drawerBadge = env.dom['drawer-notif-badge'];

        assert.strictEqual(headerBadge.innerText, '5', `Badge header tras recarga debe ser '5' (no '8'). Actual: '${headerBadge.innerText}'`);
        assert.strictEqual(drawerBadge.innerText, '5', `Badge drawer tras recarga debe ser '5' (no '8'). Actual: '${drawerBadge.innerText}'`);
        assert.strictEqual(headerBadge.style.display, 'flex');
        assert.strictEqual(drawerBadge.style.display, 'inline-flex');
    });

    // =========================================================================
    // FASE 4: PRUEBA DE MARK AS READ Y PERSISTENCIA TRAS RECARGA
    // =========================================================================
    await test('Fase 4.1: markAsRead de 2 notificaciones en caliente y descenso de unreadCount a 3', async () => {
        const service = global.window.NotificationService;
        // Marcar 1 de Firestore y 1 de Evento como leídas
        await service.markAsRead('notif_fs_2');
        await service.markAsRead('evt_new_entreno_102');

        const merged = service.getMergedNotifications();
        assert.strictEqual(merged.length, 5, `El total sigue siendo 5`);
        assert.strictEqual(service.unreadCount, 3, `unreadCount en caliente debe haber descendido a 3. Obtenido: ${service.unreadCount}`);

        env.NotificationUi.updateBadge();
        assert.strictEqual(env.dom['notif-badge'].innerText, '3', `Badge header debe ser '3'`);
        assert.strictEqual(env.dom['drawer-notif-badge'].innerText, '3', `Badge drawer debe ser '3'`);
    });

    await test('Fase 4.2: Recarga total preservando read: true y unreadCount en 3', () => {
        // Segunda recarga total
        env = setupEnvironment(initialFirestoreDocs);
        const reloadedService2 = new env.NotificationServiceClass();
        populateFeed(reloadedService2);
        reloadedService2.init();
        global.window.NotificationService = reloadedService2;
        env.NotificationUi._bindService();

        const merged = reloadedService2.getMergedNotifications();
        assert.strictEqual(merged.length, 5, `Total de notificaciones sigue siendo 5 tras recarga`);
        assert.strictEqual(reloadedService2.unreadCount, 3, `unreadCount tras recarga debe ser 3. Obtenido: ${reloadedService2.unreadCount}`);

        const item2 = merged.find(n => n.id === 'notif_fs_2');
        const itemEntreno = merged.find(n => n.id === 'evt_new_entreno_102');

        assert.ok(item2 && item2.read === true, 'notif_fs_2 debe continuar leída (read: true) tras recarga');
        assert.ok(itemEntreno && itemEntreno.read === true, 'evt_new_entreno_102 debe continuar leída (read: true) tras recarga');

        env.NotificationUi.updateBadge();
        assert.strictEqual(env.dom['notif-badge'].innerText, '3', `Badge header tras recarga debe ser '3'`);
        assert.strictEqual(env.dom['drawer-notif-badge'].innerText, '3', `Badge drawer tras recarga debe ser '3'`);
    });

    // =========================================================================
    // FASE 5: PRUEBA DE DELETE ALL MY NOTIFICATIONS Y PERSISTENCIA TRAS RECARGA
    // =========================================================================
    await test('Fase 5.1: deleteAllMyNotifications vacía la bandeja y pone unreadCount en 0', async () => {
        const service = global.window.NotificationService;
        await service.deleteAllMyNotifications(true);

        const merged = service.getMergedNotifications();
        assert.strictEqual(merged.length, 0, `Tras deleteAllMyNotifications la lista debe ser 0. Obtenida: ${merged.length}`);
        assert.strictEqual(service.unreadCount, 0, `unreadCount debe ser 0. Obtenido: ${service.unreadCount}`);

        env.NotificationUi.updateBadge();
        assert.strictEqual(env.dom['notif-badge'].style.display, 'none', `Badge header debe ocultarse (display: none)`);
        assert.strictEqual(env.dom['drawer-notif-badge'].style.display, 'none', `Badge drawer debe ocultarse (display: none)`);
    });

    await test('Fase 5.2: Recarga total post vaciado mantiene 0 notificaciones y badges ocultos', () => {
        // Tercera recarga total
        env = setupEnvironment(initialFirestoreDocs);
        const reloadedService3 = new env.NotificationServiceClass();
        populateFeed(reloadedService3);
        reloadedService3.init();
        global.window.NotificationService = reloadedService3;
        env.NotificationUi._bindService();

        const merged = reloadedService3.getMergedNotifications();
        assert.strictEqual(merged.length, 0, `Tras recarga post vaciado, getMergedNotifications() debe seguir en 0. Obtenido: ${merged.length}`);
        assert.strictEqual(reloadedService3.unreadCount, 0, `unreadCount debe seguir en 0. Obtenido: ${reloadedService3.unreadCount}`);

        env.NotificationUi.updateBadge();
        assert.strictEqual(env.dom['notif-badge'].style.display, 'none', `Badge header debe permanecer oculto`);
        assert.strictEqual(env.dom['drawer-notif-badge'].style.display, 'none', `Badge drawer debe permanecer oculto`);
    });

    // =========================================================================
    // RESUMEN FINAL
    // =========================================================================
    console.log('\n========================================================================');
    console.log(`📊 TOTAL PRUEBAS EJECUTADAS: ${results.length}`);
    console.log(`✅ PASADAS: ${passCount}`);
    console.log(`❌ FALLADAS: ${failCount}`);
    console.log('========================================================================');

    if (failCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runSuite().catch(err => {
    console.error("FATAL ERROR EN SUITE QA:", err);
    process.exit(1);
});
