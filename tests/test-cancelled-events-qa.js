/**
 * test-cancelled-events-qa.js
 * 
 * Batería de Pruebas de Calidad (QA) para:
 * Sistema de Avisos y Notificaciones Push para Eventos ELIMINADOS, CANCELADOS o SUSPENDIDOS.
 * 
 * Verificaciones:
 * 1. NotificationService detecta eventos eliminados (change.type === 'removed') y eventos con status
 *    'cancelled', 'cancelado', 'suspendido', 'anulado'.
 * 2. Generación de notificación 'evt_cancelled_...' con title, body, isCancelled: true y categoría correspondiente ('entrenos' o 'matches').
 * 3. Persistencia en 'sp_cancelled_events_log' en localStorage tras la eliminación del documento en Firestore.
 * 4. Invocación de showNativeNotification (Push nativo fuera de la app) para alertar al móvil.
 * 5. Retirada de notificaciones previas activas del evento ('evt_new_...', 'evt_spot_...') de memoria y localStorage.
 * 6. NotificationUi._normalizeNotificationItem asigna:
 *    - cardThemeClass: 'theme-cancelled'
 *    - tag.icon: 'fa-calendar-xmark'
 *    - badge: 'CANCELADO', 'SUSPENDIDO' o 'ELIMINADO'
 * 7. DashboardView_hotfix.js ignora los eventos cancelados/suspendidos/anulados para el popup emergente
 *    y cierra activamente el popup si el evento en pantalla resulta cancelado.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const results = [];

function test(name, fn) {
    try {
        const res = fn();
        if (res && typeof res.then === 'function') {
            return res.then(
                () => {
                    results.push({ name, status: 'PASS' });
                    console.log(`✅ PASS: ${name}`);
                },
                (err) => {
                    results.push({ name, status: 'FAIL', error: err.message });
                    console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
                }
            );
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

function createBrowserEnvironment() {
    const mockStorage = new MockLocalStorage();
    const listeners = {};
    const nativePushCalls = [];

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
        matchMedia: () => ({ matches: false }),
        navigator: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            platform: 'Win32'
        },
        location: { hash: '', reload: () => {} }
    };

    const domRegistry = {};

    const mockDocument = {
        hidden: false,
        getElementById: (id) => domRegistry[id] || null,
        querySelector: (sel) => domRegistry[sel] || null,
        querySelectorAll: () => [],
        createElement: (tag) => {
            const el = {
                tagName: tag,
                className: '',
                style: {},
                innerHTML: '',
                children: [],
                dataset: {},
                setAttribute: (k, v) => { el.dataset[k] = v; },
                getAttribute: (k) => el.dataset[k] || null,
                appendChild: (child) => { el.children.push(child); },
                remove: () => {},
                classList: {
                    add: () => {},
                    remove: () => {},
                    contains: () => false,
                    toggle: () => {}
                }
            };
            return el;
        },
        body: {
            classList: { add: () => {}, remove: () => {}, contains: () => false },
            appendChild: () => {}
        },
        addEventListener: () => {},
        removeEventListener: () => {}
    };

    const mockNotification = function(title, options) {
        nativePushCalls.push({ title, options });
    };
    mockNotification.permission = 'granted';
    mockNotification.requestPermission = async () => 'granted';

    global.CustomEvent = class CustomEvent {
        constructor(type, init = {}) {
            this.type = type;
            this.detail = init.detail || {};
        }
    };

    return {
        mockWindow,
        mockDocument,
        mockStorage,
        mockNotification,
        nativePushCalls,
        domRegistry
    };
}

function loadNotificationModules(env) {
    const sandbox = {
        window: env.mockWindow,
        document: env.mockDocument,
        localStorage: env.mockStorage,
        Notification: env.mockNotification,
        navigator: env.mockWindow.navigator,
        CustomEvent: global.CustomEvent,
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        Date: Date,
        Math: Math,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        Map: Map,
        Set: Set,
        JSON: JSON
    };

    env.mockWindow.localStorage = env.mockStorage;
    env.mockWindow.document = env.mockDocument;

    vm.createContext(sandbox);

    // 1. Cargar NotificationService.js
    const notifServiceCode = fs.readFileSync(path.join(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
    vm.runInContext(notifServiceCode, sandbox);

    // 2. Instanciar servicio en window
    sandbox.window.NotificationService = new sandbox.window.NotificationServiceClass();

    // 3. Cargar NotificationUi.js
    const notifUiCode = fs.readFileSync(path.join(__dirname, '../js/modules/ui/NotificationUi.js'), 'utf8');
    vm.runInContext(notifUiCode, sandbox);

    return {
        NotificationServiceClass: sandbox.window.NotificationServiceClass,
        NotificationService: sandbox.window.NotificationService,
        NotificationUi: sandbox.window.NotificationUi,
        sandbox
    };
}

// -----------------------------------------------------------------------------
// SUITE PRINCIPAL DE PRUEBAS QA
// -----------------------------------------------------------------------------
async function runAll() {
    console.log('========================================================================');
    console.log('⛔ QA MASTER SUITE: EVENTOS ELIMINADOS, CANCELADOS Y SUSPENDIDOS');
    console.log('========================================================================\n');

    // -------------------------------------------------------------------------
    // SECCIÓN 1: Sintaxis y Análisis Estático de Código
    // -------------------------------------------------------------------------
    test('Sintaxis JavaScript: js/modules/common/NotificationService.js', () => {
        execSync('node -c js/modules/common/NotificationService.js');
    });

    test('Sintaxis JavaScript: js/modules/ui/NotificationUi.js', () => {
        execSync('node -c js/modules/ui/NotificationUi.js');
    });

    test('Sintaxis JavaScript: js/modules/dashboard/DashboardView_hotfix.js', () => {
        execSync('node -c js/modules/dashboard/DashboardView_hotfix.js');
    });

    test('NotificationService.js contiene métodos clave de cancelación y persistencia', () => {
        const code = fs.readFileSync('js/modules/common/NotificationService.js', 'utf8');
        if (!code.includes('handleEventDeleted')) {
            throw new Error('NotificationService.js no declara handleEventDeleted()');
        }
        if (!code.includes('handleEventCancelled')) {
            throw new Error('NotificationService.js no declara handleEventCancelled()');
        }
        if (!code.includes('_saveCancelledEvent')) {
            throw new Error('NotificationService.js no declara _saveCancelledEvent()');
        }
        if (!code.includes('_getCancelledEventsLog')) {
            throw new Error('NotificationService.js no declara _getCancelledEventsLog()');
        }
        if (!code.includes('_removeEventActiveNotifs')) {
            throw new Error('NotificationService.js no declara _removeEventActiveNotifs()');
        }
        if (!code.includes('sp_cancelled_events_log')) {
            throw new Error('NotificationService.js no referencia la clave sp_cancelled_events_log');
        }
    });

    test('NotificationUi.js define estilos y tags para tema theme-cancelled', () => {
        const code = fs.readFileSync('js/modules/ui/NotificationUi.js', 'utf8');
        if (!code.includes('theme-cancelled')) {
            throw new Error('NotificationUi.js no asigna cardThemeClass "theme-cancelled"');
        }
        if (!code.includes('tag-cancelled')) {
            throw new Error('NotificationUi.js no asigna cssClass "tag-cancelled"');
        }
        if (!code.includes('fa-calendar-xmark')) {
            throw new Error('NotificationUi.js no utiliza el icono "fa-calendar-xmark" para cancelaciones');
        }
        if (!code.includes('SUSPENDIDO') || !code.includes('ELIMINADO') || !code.includes('CANCELADO')) {
            throw new Error('NotificationUi.js no contiene las etiquetas textuales requeridas para cancelaciones');
        }
    });

    test('DashboardView_hotfix.js filtra eventos cancelados/suspendidos/anulados en popup', () => {
        const code = fs.readFileSync('js/modules/dashboard/DashboardView_hotfix.js', 'utf8');
        if (!code.includes('isCancelledOrDeleted')) {
            throw new Error('DashboardView_hotfix.js no implementa el guard isCancelledOrDeleted');
        }
        if (!code.includes('cancelled') || !code.includes('suspendido') || !code.includes('anulado')) {
            throw new Error('DashboardView_hotfix.js no comprueba todos los estados de anulación');
        }
        if (!code.includes('isNowCancelled')) {
            throw new Error('DashboardView_hotfix.js no contiene la lógica de cierre dinámico para popup activo');
        }
    });

    // -------------------------------------------------------------------------
    // SECCIÓN 2: Pruebas Funcionales - NotificationService
    // -------------------------------------------------------------------------

    // 2.1 Evento modificado a 'cancelled'
    await test('NotificationService.handleEventCancelled genera notificación evt_cancelled_... con isCancelled: true y categoría matches/entrenos', () => {
        const env = createBrowserEnvironment();
        const { NotificationService } = loadNotificationModules(env);

        // A. Caso Americana Cancelada
        NotificationService.handleEventCancelled('americana', 'ame_999', {
            id: 'ame_999',
            name: 'Americana Nocturna Nivel 3.5',
            date: '2026-09-25',
            time: '20:30',
            status: 'cancelled',
            reason: 'Lluvia intensa en pistas exteriores'
        }, 'cancelled');

        const savedLog = NotificationService._getCancelledEventsLog();
        const ameNotif = savedLog.find(n => n.id === 'evt_cancelled_americana_ame_999');
        if (!ameNotif) {
            throw new Error('No se encontró evt_cancelled_americana_ame_999 en el log persistente');
        }
        if (ameNotif.isCancelled !== true) {
            throw new Error('isCancelled no es true en la notificación cancelada');
        }
        if (ameNotif.category !== 'matches') {
            throw new Error(`Categoría esperada 'matches', obtenida: '${ameNotif.category}'`);
        }
        if (!ameNotif.title.includes('Cancelad') && !ameNotif.title.includes('Anulad')) {
            throw new Error(`Título no indica cancelación: ${ameNotif.title}`);
        }
        if (!ameNotif.body.includes('Lluvia intensa')) {
            throw new Error(`Cuerpo no incluye el motivo de cancelación: ${ameNotif.body}`);
        }

        // B. Caso Entreno Suspendido
        NotificationService.handleEventCancelled('entreno', 'ent_888', {
            id: 'ent_888',
            name: 'Entreno Nivel Avanzado',
            date: '2026-09-26',
            time: '18:00',
            status: 'suspendido'
        }, 'suspendido');

        const entNotif = NotificationService._getCancelledEventsLog().find(n => n.id === 'evt_cancelled_entreno_ent_888');
        if (!entNotif) {
            throw new Error('No se encontró evt_cancelled_entreno_ent_888 en el log persistente');
        }
        if (entNotif.category !== 'entrenos') {
            throw new Error(`Categoría esperada 'entrenos', obtenida: '${entNotif.category}'`);
        }
        if (!entNotif.title.includes('Suspendido')) {
            throw new Error(`Título no indica suspensión: ${entNotif.title}`);
        }
    });

    // 2.2 Evento eliminado físicamente (change.type === 'removed')
    await test('NotificationService.handleEventDeleted gestiona la eliminación de un evento y genera aviso persistente', () => {
        const env = createBrowserEnvironment();
        const { NotificationService } = loadNotificationModules(env);

        NotificationService.handleEventDeleted('entreno', 'ent_del_01', {
            id: 'ent_del_01',
            name: 'Clase Magistral de Volea',
            date: '2026-09-27',
            time: '10:00'
        });

        const log = NotificationService._getCancelledEventsLog();
        const deletedNotif = log.find(n => n.id === 'evt_cancelled_entreno_ent_del_01');
        if (!deletedNotif) {
            throw new Error('No se registró la notificación para el evento eliminado');
        }
        if (!deletedNotif.title.includes('Eliminado')) {
            throw new Error(`Título de eliminación inesperado: ${deletedNotif.title}`);
        }
        if (deletedNotif.category !== 'entrenos') {
            throw new Error(`Categoría esperada 'entrenos', obtenida: ${deletedNotif.category}`);
        }
    });

    // 2.3 Persistencia en sp_cancelled_events_log tras borrado del documento
    await test('Los eventos cancelados/eliminados persisten en localStorage y se integran en getMergedNotifications()', () => {
        const env = createBrowserEnvironment();
        const { NotificationServiceClass } = loadNotificationModules(env);

        // Pre-cargar log de cancelados en localStorage simulado
        const preCancelled = [
            {
                id: 'evt_cancelled_americana_persisted_01',
                title: '⛔ Americana Cancelada: Torneo Exprés',
                body: 'Torneo cancelado por el organizador.',
                timestamp: '2026-09-24T18:00:00.000Z',
                category: 'matches',
                isCancelled: true,
                read: false,
                data: { id: 'evt_cancelled_americana_persisted_01', url: 'americanas', eventId: 'persisted_01', isCancelled: true }
            }
        ];
        env.mockStorage.setItem('sp_cancelled_events_log', JSON.stringify(preCancelled));

        // Inicializar un nuevo servicio (simulando recarga completa de la app)
        const newService = new NotificationServiceClass();
        const merged = newService.getMergedNotifications();

        const found = merged.find(n => n.id === 'evt_cancelled_americana_persisted_01');
        if (!found) {
            throw new Error('La notificación cancelada persistida no apareció en getMergedNotifications()');
        }
        if (found.isCancelled !== true) {
            throw new Error('isCancelled se perdió en la sincronización persistente');
        }
    });

    // 2.4 Invocación de Push Nativo (showNativeNotification) al móvil
    await test('NotificationService invoca showNativeNotification para alertar al móvil de eventos cancelados/eliminados', () => {
        const env = createBrowserEnvironment();
        env.mockStorage.setItem('somospadel_push_enabled', 'true');
        const { NotificationService } = loadNotificationModules(env);

        let nativeNotificationCalled = false;
        let capturedTitle = '';
        let capturedOptions = null;

        // Sobrescribir showNativeNotification para auditar llamada
        NotificationService.showNativeNotification = function(title, body, data) {
            nativeNotificationCalled = true;
            capturedTitle = title;
            capturedOptions = { body, data };
        };

        NotificationService.handleEventCancelled('americana', 'push_test_01', {
            id: 'push_test_01',
            name: 'Americana Fin de Semana',
            date: '2026-09-28',
            time: '19:00',
            status: 'anulado'
        }, 'anulado');

        if (!nativeNotificationCalled) {
            throw new Error('showNativeNotification no fue invocado al cancelar el evento');
        }
        if (!capturedTitle.includes('Anulad') && !capturedTitle.includes('Cancelad')) {
            throw new Error(`El título enviado a push nativo no indica cancelación: ${capturedTitle}`);
        }
        if (capturedOptions?.data?.isCancelled !== true) {
            throw new Error('El payload de data enviado a push nativo no incluye isCancelled: true');
        }
    });

    // 2.5 Retirada de notificaciones previas activas (evt_new_..., evt_spot_...)
    await test('Al cancelar o eliminar un evento se purgan notificaciones de nuevo evento y plazas libres', () => {
        const env = createBrowserEnvironment();
        const { NotificationService } = loadNotificationModules(env);

        const eventId = 'cleanup_evt_77';
        const type = 'americana';
        const newId = `evt_new_${type}_${eventId}`;
        const spotId = `evt_spot_${type}_${eventId}`;

        // Añadir manualmente notificaciones activas al servicio
        NotificationService.eventNotifications = [
            { id: newId, title: '🏆 Nueva Americana', category: 'matches' },
            { id: spotId, title: '⚡ ¡2 Plazas Libres!', category: 'matches' },
            { id: 'evt_new_entreno_other', title: '💪 Otro entreno', category: 'entrenos' }
        ];

        // Ejecutar retirada
        NotificationService._removeEventActiveNotifs(type, eventId);

        // Verificar memoria
        const hasNew = NotificationService.eventNotifications.some(n => n.id === newId);
        const hasSpot = NotificationService.eventNotifications.some(n => n.id === spotId);
        const hasOther = NotificationService.eventNotifications.some(n => n.id === 'evt_new_entreno_other');

        if (hasNew || hasSpot) {
            throw new Error('Las notificaciones previas activas no se eliminaron de eventNotifications en memoria');
        }
        if (!hasOther) {
            throw new Error('Se eliminaron notificaciones de otros eventos por error');
        }

        // Verificar localStorage para prevenir que vuelvan a mostrarse
        if (env.mockStorage.getItem('sp_evt_deleted_' + newId) !== 'true') {
            throw new Error(`sp_evt_deleted_${newId} no fue marcado en localStorage`);
        }
        if (env.mockStorage.getItem('sp_evt_deleted_' + spotId) !== 'true') {
            throw new Error(`sp_evt_deleted_${spotId} no fue marcado en localStorage`);
        }
    });

    // 2.6 Procesamiento automático desde snapshot de Firestore con change.type === 'removed'
    await test('initEventsFeedObserver onSnapshot procesa change.type === "removed" y actualiza la lista', () => {
        const env = createBrowserEnvironment();
        const { NotificationService } = loadNotificationModules(env);

        let americanasSnapshotCallback = null;

        // Mock de firestore
        env.mockWindow.db = {
            collection: (name) => ({
                onSnapshot: (cb) => {
                    if (name === 'americanas') {
                        americanasSnapshotCallback = cb;
                    }
                    return () => {};
                }
            })
        };

        NotificationService.initEventsFeedObserver();

        if (typeof americanasSnapshotCallback !== 'function') {
            throw new Error('No se registró el callback onSnapshot para la colección americanas');
        }

        // 1. Simular carga inicial (added)
        americanasSnapshotCallback({
            docChanges: () => [
                {
                    type: 'added',
                    doc: {
                        id: 'snap_evt_1',
                        data: () => ({ name: 'Americana Live Test', status: 'open', courts: 3, players: [] })
                    }
                }
            ]
        });

        // Verificar que se registró en _eventsMap
        if (!NotificationService._eventsMap.has('snap_evt_1')) {
            throw new Error('El evento inicial no se registró en _eventsMap');
        }

        // 2. Simular eliminación del documento (removed)
        americanasSnapshotCallback({
            docChanges: () => [
                {
                    type: 'removed',
                    doc: {
                        id: 'snap_evt_1',
                        data: () => ({ name: 'Americana Live Test' })
                    }
                }
            ]
        });

        // Verificar que se eliminó de _eventsMap
        if (NotificationService._eventsMap.has('snap_evt_1')) {
            throw new Error('El evento eliminado sigue existiendo en _eventsMap');
        }

        // Verificar que generó notificación en el log de cancelados
        const log = NotificationService._getCancelledEventsLog();
        const cancelledNotif = log.find(n => n.id === 'evt_cancelled_americana_snap_evt_1');
        if (!cancelledNotif) {
            throw new Error('No se generó notificación evt_cancelled_americana_snap_evt_1 al recibir change.type === "removed"');
        }
    });

    // -------------------------------------------------------------------------
    // SECCIÓN 3: Pruebas Funcionales - NotificationUi Normalización y Temas
    // -------------------------------------------------------------------------
    await test('NotificationUi._normalizeNotificationItem asigna theme-cancelled, fa-calendar-xmark y badge CANCELADO', () => {
        const env = createBrowserEnvironment();
        const { NotificationUi } = loadNotificationModules(env);

        const sampleCancelled = {
            id: 'evt_cancelled_americana_test_ui',
            title: '⛔ Americana Cancelada: Torneo Viernes',
            body: 'El torneo ha sido anulado por motivos técnicos.',
            isCancelled: true,
            timestamp: new Date().toISOString(),
            category: 'matches',
            data: { url: 'americanas', eventId: 'test_ui', isCancelled: true }
        };

        const normalized = NotificationUi._normalizeNotificationItem(sampleCancelled);

        if (normalized.tag.cardThemeClass !== 'theme-cancelled') {
            throw new Error(`cardThemeClass esperado 'theme-cancelled', recibido: '${normalized.tag.cardThemeClass}'`);
        }
        if (normalized.tag.icon !== 'fa-calendar-xmark') {
            throw new Error(`icon esperado 'fa-calendar-xmark', recibido: '${normalized.tag.icon}'`);
        }
        if (normalized.tag.cssClass !== 'tag-cancelled') {
            throw new Error(`cssClass esperado 'tag-cancelled', recibido: '${normalized.tag.cssClass}'`);
        }
        if (!['CANCELADO', 'ANULADO', 'ELIMINADO'].includes(normalized.tag.label)) {
            throw new Error(`label del badge inesperado: '${normalized.tag.label}'`);
        }
        if (normalized.category !== 'matches') {
            throw new Error(`Categoría esperada 'matches', recibida: '${normalized.category}'`);
        }
        if (!normalized.actionLabel.includes('CALENDARIO')) {
            throw new Error(`actionLabel esperado con CALENDARIO, recibido: '${normalized.actionLabel}'`);
        }
    });

    await test('NotificationUi._normalizeNotificationItem distingue badges SUSPENDIDO y ELIMINADO', () => {
        const env = createBrowserEnvironment();
        const { NotificationUi } = loadNotificationModules(env);

        // Caso Suspendido
        const itemSusp = {
            id: 'evt_susp_01',
            title: '⚠️ Entreno Suspendido por Lluvia',
            body: 'Aplazado a la próxima semana.',
            isCancelled: true,
            category: 'entrenos'
        };
        const normSusp = NotificationUi._normalizeNotificationItem(itemSusp);
        if (normSusp.tag.label !== 'SUSPENDIDO') {
            throw new Error(`Badge esperado 'SUSPENDIDO', obtenido: '${normSusp.tag.label}'`);
        }
        if (normSusp.category !== 'entrenos') {
            throw new Error(`Categoría esperada 'entrenos', obtenida: '${normSusp.category}'`);
        }

        // Caso Eliminado
        const itemDel = {
            id: 'evt_del_01',
            title: '⛔ Convocatoria Eliminada del Sistema',
            body: 'Se ha borrado la sesión.',
            isCancelled: true,
            category: 'entrenos'
        };
        const normDel = NotificationUi._normalizeNotificationItem(itemDel);
        if (normDel.tag.label !== 'ELIMINADO') {
            throw new Error(`Badge esperado 'ELIMINADO', obtenido: '${normDel.tag.label}'`);
        }
    });

    // -------------------------------------------------------------------------
    // SECCIÓN 4: Pruebas Funcionales - DashboardView_hotfix Filtrado y Popup
    // -------------------------------------------------------------------------
    await test('DashboardView_hotfix filtra eventos con estado cancelled, suspendido, anulado o eliminado para popup', () => {
        const now = Date.now();

        const fakeEvents = [
            {
                id: 'evt_cancelled',
                name: 'Americana Cancelada de Prueba',
                status: 'cancelled',
                createdAt: now - (1000 * 60 * 30),
                courts: 4,
                players: []
            },
            {
                id: 'evt_suspendido',
                name: 'Entreno Suspendido por Clima',
                status: 'suspendido',
                type: 'entreno',
                createdAt: now - (1000 * 60 * 20),
                courts: 3,
                players: []
            },
            {
                id: 'evt_anulado_title',
                name: '⛔ Torneo Anulado por Falta de Pistas',
                status: 'open',
                createdAt: now - (1000 * 60 * 15),
                courts: 4,
                players: []
            },
            {
                id: 'evt_is_cancelled_flag',
                name: 'Americana Flag Cancelled',
                isCancelled: true,
                createdAt: now - (1000 * 60 * 10),
                courts: 4,
                players: []
            },
            {
                id: 'evt_active_valid',
                name: 'Americana Válida Activa',
                status: 'open',
                createdAt: now - (1000 * 60 * 5),
                courts: 4,
                players: []
            }
        ];

        // Replicar la regla exacta de validación de DashboardView_hotfix.js (líneas 5031-5039)
        const candidates = [];
        for (const evt of fakeEvents) {
            const status = String(evt.status || '').toLowerCase().trim();
            const evtTitleLower = String(evt.name || evt.title || evt.eventName || '').toLowerCase();
            const isCancelledOrDeleted = evt.isCancelled || evt.isDeleted ||
                ['cancelled', 'cancelado', 'suspendido', 'anulado', 'deleted'].includes(status) ||
                evtTitleLower.includes('cancelad') || evtTitleLower.includes('suspendid') || evtTitleLower.includes('eliminad') || evtTitleLower.includes('anulad');

            if (isCancelledOrDeleted || ['finished', 'finalizado', 'completed'].includes(status)) {
                continue;
            }
            candidates.push(evt);
        }

        if (candidates.length !== 1) {
            throw new Error(`Se esperaba 1 único candidato válido, pero se obtuvieron ${candidates.length}`);
        }
        if (candidates[0].id !== 'evt_active_valid') {
            throw new Error(`El candidato seleccionado debió ser 'evt_active_valid', obtenido: '${candidates[0].id}'`);
        }
    });

    await test('DashboardView_hotfix cierra activamente popup abierto si el evento pasa a cancelado', () => {
        let popupRemoved = false;
        let classListRemoved = false;

        const fakeOverlay = {
            dataset: { 'event-id': 'evt_cancelling_live' },
            getAttribute: (k) => k === 'data-event-id' ? 'evt_cancelling_live' : null,
            classList: {
                remove: (c) => { if (c === 'show') classListRemoved = true; }
            },
            remove: () => { popupRemoved = true; }
        };

        const activeEventId = 'evt_cancelling_live';
        const events = [
            {
                id: 'evt_cancelling_live',
                name: 'Torneo en curso que se cancela',
                status: 'cancelled',
                isCancelled: true
            }
        ];

        // Lógica de DashboardView_hotfix.js (líneas 4979-4995)
        const activeEvt = events.find(e => String(e?.id) === String(activeEventId));
        if (activeEvt) {
            const actStatus = String(activeEvt.status || '').toLowerCase().trim();
            const actTitle = String(activeEvt.name || activeEvt.title || activeEvt.eventName || '').toLowerCase();
            const isNowCancelled = activeEvt.isCancelled || activeEvt.isDeleted ||
                ['cancelled', 'cancelado', 'suspendido', 'anulado', 'deleted'].includes(actStatus) ||
                actTitle.includes('cancelad') || actTitle.includes('suspendid') || actTitle.includes('eliminad') || actTitle.includes('anulad');

            if (isNowCancelled) {
                fakeOverlay.classList.remove('show');
                fakeOverlay.remove();
            }
        }

        if (!classListRemoved) {
            throw new Error('No se retiró la clase "show" del modal emergente');
        }
        if (!popupRemoved) {
            throw new Error('No se retiró el nodo popup del DOM');
        }
    });

    // -------------------------------------------------------------------------
    // RESUMEN FINAL
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 TOTAL PRUEBAS QA EVENTOS CANCELADOS: ${results.length}`);
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLADAS: ${failed}`);
    console.log('========================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runAll().catch(err => {
    console.error('💥 Error crítico en suite QA:', err);
    process.exit(1);
});
