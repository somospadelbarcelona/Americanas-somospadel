/**
 * test-real-events-feed-qa.js
 * 
 * Batería de Pruebas de Calidad (QA) para:
 * 1. Verificación de fechas reales vs dinámicas ("Pone que es ahora y es mentira").
 *    - NotificationService.js NO genera new Date().toISOString() dinámicamente para system_radar_clima_relocated.
 *    - Un evento de hace 7 horas genera '7 h' mediante NotificationUi.prototype.timeAgo() y NO 'Ahora'.
 * 2. Sincronización de eventos reales en drawer y fuera de la app ("Han pasado cosas importantes y no lo ha registrado").
 *    - initEventsFeedObserver() procesa americanas y entrenos en tiempo real.
 *    - Genera notificaciones evt_new_... y evt_spot_... con categorías matches y entrenos.
 * 3. Persistencia de lectura (markAsRead) y borrado (deleteNotification) en localStorage y getMergedNotifications().
 * 4. Despacho de push nativo (showNativeNotification) cuando entra un nuevo evento o plaza libre.
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
// Entorno Simulado de Navegador y Firebase
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

    const mockDocument = {
        hidden: false,
        getElementById: () => null,
        querySelectorAll: () => [],
        createElement: (tag) => ({
            tagName: tag,
            className: '',
            style: {},
            innerHTML: '',
            children: [],
            appendChild: () => {},
            remove: () => {},
            classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }
        }),
        body: {
            classList: { add: () => {}, remove: () => {} },
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
        nativePushCalls
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
        Set: Set
    };

    // Global bindings expected by scripts
    env.mockWindow.localStorage = env.mockStorage;
    env.mockWindow.document = env.mockDocument;

    vm.createContext(sandbox);

    // 1. Load NotificationService.js
    const notifServiceCode = fs.readFileSync(path.join(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
    vm.runInContext(notifServiceCode, sandbox);

    // Instantiate default service on window to prevent NotificationUi 15s polling timer
    sandbox.window.NotificationService = new sandbox.window.NotificationServiceClass();

    // 2. Load NotificationUi.js
    const notifUiCode = fs.readFileSync(path.join(__dirname, '../js/modules/ui/NotificationUi.js'), 'utf8');
    vm.runInContext(notifUiCode, sandbox);

    return {
        NotificationServiceClass: sandbox.window.NotificationServiceClass,
        NotificationUi: sandbox.window.NotificationUi,
        sandbox
    };
}

// -----------------------------------------------------------------------------
// Batería de Pruebas
// -----------------------------------------------------------------------------
async function runAll() {
    console.log('========================================================================');
    console.log('🧪 QA MASTER SUITE: REDESARROLLO DE FEED DE EVENTOS Y PUSH NOTIFICATIONS');
    console.log('========================================================================\n');

    // 1. Verificación Estática del Código Fuente
    await test('NotificationService.js NO contiene dynamic Date().toISOString() para radar de pistas', () => {
        const fileContent = fs.readFileSync(path.join(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
        // Asegurar que radarTs no asigna new Date().toISOString()
        const radarRegex = /radarTs\s*=\s*localStorage\.getItem\(['"]sp_radar_relocated_notif_ts['"]\)\s*\|\|\s*new\s+Date\(\)\.toISOString\(\)/;
        if (radarRegex.test(fileContent)) {
            throw new Error('NotificationService.js sigue recalculando dynamic new Date().toISOString() para radar!');
        }
        if (!fileContent.includes("'2026-09-21T09:00:00.000Z'")) {
            throw new Error('No se encontró fecha histórica estática de referencia para radar clima');
        }
    });

    // 2. Verificación Dinámica de getMergedNotifications() para radar clima
    await test('getMergedNotifications() devuelve timestamp estático y timeAgo NO devuelve "Ahora"', () => {
        const env = createBrowserEnvironment();
        const { NotificationServiceClass, NotificationUi } = loadNotificationModules(env);
        const service = new NotificationServiceClass();

        const itemsFirst = service.getMergedNotifications();
        const radarItem = itemsFirst.find(i => i.id === 'system_radar_clima_relocated');
        if (!radarItem) {
            throw new Error('system_radar_clima_relocated no encontrado en getMergedNotifications()');
        }
        if (radarItem.timestamp.startsWith(new Date().toISOString().substring(0, 10))) {
            throw new Error(`El timestamp es de hoy (${radarItem.timestamp}), debería ser histórico para no falsear el tiempo`);
        }

        const formatted = NotificationUi.timeAgo(radarItem.timestamp);
        if (formatted === 'Ahora') {
            throw new Error('timeAgo devolvió "Ahora" falsamente para el aviso histórico de radar clima!');
        }
    });

    // 3. Verificación de cálculo de tiempo para evento de hace exactamente 7 horas
    await test('Evento creado hace 7 horas calcula exactamente "7 h" en NotificationUi.timeAgo() (NO "Ahora")', () => {
        const env = createBrowserEnvironment();
        const { NotificationUi } = loadNotificationModules(env);

        const sevenHoursAgoMs = Date.now() - (7 * 3600 * 1000);
        const sevenHoursAgoIso = new Date(sevenHoursAgoMs).toISOString();

        const calculated = NotificationUi.timeAgo(sevenHoursAgoIso);
        if (calculated !== '7 h') {
            throw new Error(`Esperado '7 h', pero se obtuvo: '${calculated}'`);
        }

        // Probar también con 1 hora y 45 minutos
        const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
        if (NotificationUi.timeAgo(oneHourAgo) !== '1 h') {
            throw new Error(`Esperado '1 h', pero se obtuvo: '${NotificationUi.timeAgo(oneHourAgo)}'`);
        }

        // Probar con 30 segundos (este sí debe ser 'Ahora')
        const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
        if (NotificationUi.timeAgo(thirtySecsAgo) !== 'Ahora') {
            throw new Error(`Esperado 'Ahora' para evento reciente de 30s, pero se obtuvo: '${NotificationUi.timeAgo(thirtySecsAgo)}'`);
        }
    });

    // 4. Observer de Feed de Eventos: Americanas y Entrenos en Tiempo Real
    await test('initEventsFeedObserver() procesa snapshot de americanas y entrenos generando evt_new_... y evt_spot_...', async () => {
        const env = createBrowserEnvironment();
        const firestoreListeners = {};

        // Simular Firestore con onSnapshot reactivo
        env.mockWindow.db = {
            collection: (colName) => ({
                onSnapshot: (callback) => {
                    firestoreListeners[colName] = callback;
                    return () => { delete firestoreListeners[colName]; };
                }
            })
        };

        const { NotificationServiceClass, sandbox } = loadNotificationModules(env);
        const service = new NotificationServiceClass();
        sandbox.window.NotificationService = service;

        // Iniciar observador de feed
        service.initEventsFeedObserver();

        if (!firestoreListeners['americanas'] || !firestoreListeners['entrenos']) {
            throw new Error('initEventsFeedObserver no se suscribió a ambas colecciones: americanas y entrenos');
        }

        // Emitir un evento de Americana con plazas libres
        const ameDocData = {
            name: 'Americana Oro Noche',
            date: '2026-09-25',
            time: '20:00',
            courts: 4,
            max_players: 16,
            players: ['p1', 'p2', 'p3'], // 13 plazas libres
            status: 'open',
            location: 'Cornellà',
            createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
        };

        firestoreListeners['americanas']({
            docChanges: () => [{
                type: 'added',
                doc: { id: 'ame_99', data: () => ameDocData }
            }]
        });

        // Emitir un evento de Entreno con plazas libres
        const entDocData = {
            name: 'Entreno Nivel Avanzado',
            date: '2026-09-25',
            time: '18:30',
            courts: 1,
            max_players: 4,
            players: ['p1'], // 3 plazas libres
            status: 'open',
            location: 'El Prat',
            createdAt: new Date(Date.now() - 7200 * 1000).toISOString()
        };

        firestoreListeners['entrenos']({
            docChanges: () => [{
                type: 'added',
                doc: { id: 'ent_77', data: () => entDocData }
            }]
        });

        const merged = service.getMergedNotifications();

        // 4.1 Comprobar generación de nuevo evento y plazas libres para Americana
        const newAme = merged.find(n => n.id === 'evt_new_americana_ame_99');
        const spotAme = merged.find(n => n.id === 'evt_spot_americana_ame_99');
        if (!newAme) throw new Error('No se generó notificación evt_new_americana_ame_99');
        if (!spotAme) throw new Error('No se generó notificación evt_spot_americana_ame_99');
        if (newAme.category !== 'matches') throw new Error(`Categoría de americana esperada 'matches', obtenida '${newAme.category}'`);
        if (spotAme.category !== 'matches') throw new Error(`Categoría de plaza libre americana esperada 'matches', obtenida '${spotAme.category}'`);
        if (!spotAme.title.includes('13 Plazas Libres')) throw new Error(`Título no indica 13 plazas libres: ${spotAme.title}`);

        // 4.2 Comprobar generación de nuevo evento y plazas libres para Entreno
        const newEnt = merged.find(n => n.id === 'evt_new_entreno_ent_77');
        const spotEnt = merged.find(n => n.id === 'evt_spot_entreno_ent_77');
        if (!newEnt) throw new Error('No se generó notificación evt_new_entreno_ent_77');
        if (!spotEnt) throw new Error('No se generó notificación evt_spot_entreno_ent_77');
        if (newEnt.category !== 'entrenos') throw new Error(`Categoría de entreno esperada 'entrenos', obtenida '${newEnt.category}'`);
        if (spotEnt.category !== 'entrenos') throw new Error(`Categoría de plaza libre entreno esperada 'entrenos', obtenida '${spotEnt.category}'`);
        if (!spotEnt.title.includes('3 Plazas Libres')) throw new Error(`Título no indica 3 plazas libres: ${spotEnt.title}`);
    });

    // 5. Normalización y UI: Distinción Estricta Pala de Pádel para Entrenos y Copa para Americanas
    await test('NotificationUi._normalizeNotificationItem() distingue icono de pala para entrenos y copa para americanas', () => {
        const env = createBrowserEnvironment();
        const { NotificationUi } = loadNotificationModules(env);

        const entrenoItem = {
            id: 'evt_new_entreno_test',
            title: '💪 Nuevo Entreno: Técnica de Salida de Pared',
            body: 'Entreno intensivo en El Prat',
            category: 'entrenos',
            timestamp: new Date().toISOString()
        };

        const normalizedEnt = NotificationUi._normalizeNotificationItem(entrenoItem);
        if (normalizedEnt.category !== 'entrenos') {
            throw new Error(`Categoría normalizada incorrecta: ${normalizedEnt.category}`);
        }
        if (!normalizedEnt.tag.isSvg || !normalizedEnt.tag.svgIcon.includes('svg')) {
            throw new Error('Entreno no utiliza el icono SVG oficial de Pala de Pádel');
        }
        if (normalizedEnt.sede !== 'Sede El Prat') {
            throw new Error(`Sede esperada 'Sede El Prat', obtenida: ${normalizedEnt.sede}`);
        }

        const americanaItem = {
            id: 'evt_new_americana_test',
            title: '🏆 Nueva Americana Noche',
            body: 'Torneo 16 jugadores en Cornellà',
            category: 'matches',
            timestamp: new Date().toISOString()
        };

        const normalizedAme = NotificationUi._normalizeNotificationItem(americanaItem);
        if (normalizedAme.category !== 'matches') {
            throw new Error(`Categoría normalizada incorrecta: ${normalizedAme.category}`);
        }
        if (normalizedAme.tag.icon !== 'fa-trophy') {
            throw new Error('Americana no utiliza el icono de Trofeo');
        }
        if (normalizedAme.sede !== 'Sede Cornellà') {
            throw new Error(`Sede esperada 'Sede Cornellà', obtenida: ${normalizedAme.sede}`);
        }
    });

    // 6. Persistencia de lectura (markAsRead) y borrado (deleteNotification)
    await test('markAsRead() y deleteNotification() persisten en localStorage y actualizan getMergedNotifications() y unreadCount', async () => {
        const env = createBrowserEnvironment();
        const { NotificationServiceClass, sandbox } = loadNotificationModules(env);
        const service = new NotificationServiceClass();
        sandbox.window.NotificationService = service;

        // Inyectar eventos de prueba
        service.eventNotifications = [
            {
                id: 'evt_new_americana_001',
                title: '🏆 Americana Viernes',
                body: 'Torneo semanal',
                category: 'matches',
                read: false,
                timestamp: '2026-09-24T10:00:00.000Z'
            },
            {
                id: 'evt_spot_americana_001',
                title: '⚡ ¡2 Plazas Libres!',
                body: 'Quedan plazas vacantes',
                category: 'matches',
                read: false,
                timestamp: '2026-09-24T10:00:00.000Z'
            }
        ];

        service.notifySubscribers();
        const initialCount = service.unreadCount;
        if (initialCount === 0) throw new Error('unreadCount inicial debería ser mayor que 0');

        // 6.1 Marcar como leído
        await service.markAsRead('evt_new_americana_001');

        if (env.mockStorage.getItem('sp_evt_read_evt_new_americana_001') !== 'true') {
            throw new Error('markAsRead no persistió en localStorage la clave sp_evt_read_evt_new_americana_001');
        }

        const mergedAfterRead = service.getMergedNotifications();
        const itemRead = mergedAfterRead.find(n => n.id === 'evt_new_americana_001');
        if (!itemRead || itemRead.read !== true) {
            throw new Error('El item marcado como leído no figura con read: true en getMergedNotifications()');
        }
        if (service.unreadCount !== initialCount - 1) {
            throw new Error(`unreadCount debería haberse decrementado en 1. Esperado ${initialCount - 1}, actual ${service.unreadCount}`);
        }

        // 6.2 Borrar notificación
        await service.deleteNotification('evt_spot_americana_001');

        if (env.mockStorage.getItem('sp_evt_deleted_evt_spot_americana_001') !== 'true') {
            throw new Error('deleteNotification no persistió en localStorage la clave sp_evt_deleted_evt_spot_americana_001');
        }

        const mergedAfterDelete = service.getMergedNotifications();
        const itemDeleted = mergedAfterDelete.find(n => n.id === 'evt_spot_americana_001');
        if (itemDeleted) {
            throw new Error('deleteNotification no eliminó el item de getMergedNotifications()');
        }

        // 6.3 Probar borrado de radar clima
        await service.deleteNotification('system_radar_clima_relocated');
        if (env.mockStorage.getItem('sp_radar_relocated_notif_deleted') !== 'true') {
            throw new Error('deleteNotification no persistió borrado de radar clima');
        }
        const mergedAfterRadarDel = service.getMergedNotifications();
        if (mergedAfterRadarDel.some(n => n.id === 'system_radar_clima_relocated')) {
            throw new Error('system_radar_clima_relocated sigue apareciendo tras ser borrado');
        }
    });

    // 7. Notificaciones Push Nativas FUERA DE LA APP
    await test('showNativeNotification() se invoca cuando entra un nuevo evento o plaza y el permiso está concedido', () => {
        const env = createBrowserEnvironment();
        let nativePushCalled = false;
        let lastNotifArgs = null;

        const { NotificationServiceClass, sandbox } = loadNotificationModules(env);
        const service = new NotificationServiceClass();
        sandbox.window.NotificationService = service;

        // Espiar showNativeNotification
        service.showNativeNotification = (title, body, data) => {
            nativePushCalled = true;
            lastNotifArgs = { title, body, data };
        };

        // Permiso push activo
        env.mockStorage.setItem('somospadel_push_enabled', 'true');

        const testNotif = {
            id: 'evt_new_americana_push_test',
            title: '🏆 Nueva Americana Cornellà',
            body: '¡Inscripciones abiertas!',
            data: { url: 'americanas', eventId: 'ame_push_1' }
        };

        service._checkAndTriggerPush(testNotif);

        if (!nativePushCalled) {
            throw new Error('showNativeNotification no fue llamado a pesar de estar somospadel_push_enabled=true');
        }
        if (!lastNotifArgs.title.includes('Nueva Americana')) {
            throw new Error(`Título enviado a push nativo inesperado: ${lastNotifArgs.title}`);
        }
        if (env.mockStorage.getItem('sp_pushed_evt_new_americana_push_test') !== 'true') {
            throw new Error('No se guardó el registro de deduplicación sp_pushed_...');
        }

        // Verificar que no se repite si ya fue enviado (deduplicación anti-spam)
        nativePushCalled = false;
        service._checkAndTriggerPush(testNotif);
        if (nativePushCalled) {
            throw new Error('Push se disparó doblemente ignorando la flag sp_pushed_...');
        }
    });

    // 8. Eventos concluidos o antiguos no generan notificaciones falsas
    await test('Eventos concluidos (finished, cancelled) no generan notificaciones de plazas libres', () => {
        const env = createBrowserEnvironment();
        const { NotificationServiceClass } = loadNotificationModules(env);
        const service = new NotificationServiceClass();

        // Evento finalizado hace 5 días
        const finishedEvt = {
            id: 'evt_old_finished',
            name: 'Americana Pasada',
            status: 'finished',
            date: '2026-09-10',
            time: '19:00',
            max_players: 16,
            players: ['p1'],
            createdAt: '2026-09-10T10:00:00.000Z'
        };

        service._eventsMap.set('evt_old_finished', { event: finishedEvt, type: 'americana' });
        service._processEventsFeed();

        const notifs = service.eventNotifications;
        if (notifs.some(n => n.id.includes('evt_old_finished'))) {
            throw new Error('Un evento terminado hace días generó notificaciones en el feed!');
        }
    });

    // -------------------------------------------------------------------------
    // Resumen
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 TOTAL PRUEBAS EJECUTADAS: ${results.length}`);
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLADAS: ${failed}`);
    console.log('========================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runAll().catch(err => {
    console.error('Fatal error running suite:', err);
    process.exit(1);
});
