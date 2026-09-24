/**
 * test-card-flex-and-dedup-qa.js
 * 
 * Verifica:
 * 1. Que las reglas CSS de .notif-card-row tengan flex-shrink: 0, min-height: fit-content y overflow: visible.
 * 2. Que .notif-scrollable-list tenga flex: 1 1 auto, overflow-y: auto y no restrinja verticalmente las tarjetas.
 * 3. Que NotificationService.getMergedNotifications() deduplique rigurosamente evitando spam de tarjetas idénticas.
 * 4. Que _getCancelledEventsLog() y _saveCancelledEvent() sanean duplicados en sp_cancelled_events_log.
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ PASS: ${message}`);
    } else {
        failedTests++;
        console.error(`❌ FAIL: ${message}`);
    }
}

console.log('========================================================================');
console.log('🛡️ QA SUITE: FLEX EXPANSION, NO-SQUISH & DEDUPLICATION');
console.log('========================================================================\n');

// 1. Validar reglas CSS en css/notifications.css
const cssPath = path.resolve(__dirname, '../css/notifications.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(
    cssContent.includes('.notif-card-row') &&
    cssContent.includes('flex-shrink: 0 !important') &&
    cssContent.includes('min-height: fit-content !important'),
    'css/notifications.css define flex-shrink: 0 !important y min-height: fit-content en .notif-card-row'
);

assert(
    cssContent.includes('@media (max-width: 600px)') &&
    cssContent.includes('.notif-card-row') &&
    cssContent.includes('overflow: visible !important'),
    'css/notifications.css en móvil (<=600px) asegura overflow: visible !important en las tarjetas'
);

assert(
    cssContent.includes('.notif-scrollable-list') &&
    cssContent.includes('flex: 1 1 auto !important') &&
    cssContent.includes('overflow-y: auto !important'),
    'css/notifications.css define flex: 1 1 auto y overflow-y: auto en .notif-scrollable-list'
);

// 2. Simular entorno navegador para NotificationService
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
        _getStore: () => store
    };
})();

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { hash: '', reload: () => {} },
    Notification: { permission: 'granted' },
    navigator: { serviceWorker: { ready: Promise.resolve({ showNotification: () => Promise.resolve() }) } },
    document: { hidden: false }
};
global.localStorage = localStorageMock;
global.document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ appendChild: () => {}, style: {} }),
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }
};

// Cargar NotificationService
const notifServiceCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
eval(notifServiceCode);

const service = new window.NotificationServiceClass();

// 3. Probar deduplicación de múltiples cancelaciones idénticas
localStorageMock.clear();

// Simular que en localStorage se guardaron 6 eventos cancelados idénticos o repetidos
const duplicateCancelledEntries = [
    {
        id: 'evt_cancelled_americana_dup1',
        title: '⛔ Americana Cancelada: Convocatoria',
        body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
        timestamp: '2026-09-24T18:00:00.000Z',
        isCancelled: true,
        data: { eventId: 'evt_dup_999' }
    },
    {
        id: 'evt_cancelled_americana_dup2',
        title: '⛔ Americana Cancelada: Convocatoria',
        body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
        timestamp: '2026-09-24T18:05:00.000Z',
        isCancelled: true,
        data: { eventId: 'evt_dup_999' }
    },
    {
        id: 'evt_cancelled_americana_dup3',
        title: '⛔ Americana Cancelada: Convocatoria',
        body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
        timestamp: '2026-09-24T18:10:00.000Z',
        isCancelled: true,
        data: { eventId: 'evt_dup_999' }
    },
    {
        id: 'evt_cancelled_americana_dup4',
        title: '⛔ Americana Cancelada: Convocatoria',
        body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
        timestamp: '2026-09-24T18:15:00.000Z',
        isCancelled: true,
        data: { eventId: 'evt_dup_999' }
    },
    {
        id: 'evt_cancelled_americana_dup5',
        title: '⛔ Americana Cancelada: Convocatoria',
        body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
        timestamp: '2026-09-24T18:20:00.000Z',
        isCancelled: true,
        data: { eventId: 'evt_dup_999' }
    },
    {
        id: 'evt_cancelled_americana_dup6',
        title: '⛔ Americana Cancelada: Convocatoria',
        body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
        timestamp: '2026-09-24T18:25:00.000Z',
        isCancelled: true,
        data: { eventId: 'evt_dup_999' }
    }
];

localStorageMock.setItem('sp_cancelled_events_log', JSON.stringify(duplicateCancelledEntries));

// Probar saneamiento en _getCancelledEventsLog()
const sanitizedLogs = service._getCancelledEventsLog();
assert(
    sanitizedLogs.length === 1,
    `_getCancelledEventsLog() sanea automáticamente las 6 cancelaciones repetidas a 1 sola (longitud: ${sanitizedLogs.length})`
);

// Probar deduplicación en getMergedNotifications()
const merged = service.getMergedNotifications();
const cancelledInMerged = merged.filter(n => n.title && n.title.includes('Americana Cancelada'));
assert(
    cancelledInMerged.length === 1,
    `getMergedNotifications() colapsa duplicados y devuelve exactamente 1 notificación de cancelación (encontradas: ${cancelledInMerged.length})`
);

// Probar que _saveCancelledEvent() no agrega duplicados si se llama repetidamente
service._saveCancelledEvent({
    id: 'evt_cancelled_americana_dup_new',
    title: '⛔ Americana Cancelada: Convocatoria',
    body: 'El evento previsto para el 25/09/2026 a las 18:00 ha sido cancelado por la organización.',
    timestamp: '2026-09-24T18:30:00.000Z',
    isCancelled: true,
    data: { eventId: 'evt_dup_999' }
});

const logsAfterSave = service._getCancelledEventsLog();
assert(
    logsAfterSave.length === 1,
    `_saveCancelledEvent() actualiza en lugar de insertar un duplicado (longitud actual: ${logsAfterSave.length})`
);

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL PRUEBAS: ${totalTests} | EXITOSAS: ${passedTests} | FALLIDAS: ${failedTests}`);
console.log('------------------------------------------------------------------------');

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log('🎉 TODAS LAS PRUEBAS DE FLEX EXPANSION Y DEDUPLICACIÓN HAN PASADO SATISFACTORIAMENTE.\n');
    process.exit(0);
}
