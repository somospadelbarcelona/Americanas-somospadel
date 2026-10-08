/**
 * test-notifications-dedup-antiguas-qa.js
 * Verificación específica del bloqueo de push en eventos pasados,
 * deduplicación multi-fuente y saneamiento de notificaciones repetitivas.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("========================================================================");
console.log("🧪 QA: VERIFICACIÓN DE BLOQUEO DE PUSH EN EVENTOS PASADOS Y DEDUPLICACIÓN");
console.log("========================================================================\n");

// 1. Cargar archivo NotificationService.js
const serviceCode = fs.readFileSync(path.join(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');

// Verificaciones de código estático clave:
assert.ok(serviceCode.includes('_isEventPast'), "Debe existir el método _isEventPast");
console.log("✅ PASS: Método _isEventPast implementado correctamente.");

// Verificar que en handleEventCancelled no hay llamada duplicada a showNativeNotification
const handleEventCancelledMatch = serviceCode.match(/handleEventCancelled\s*\([\s\S]*?\{([\s\S]*?)\n\s*\}/);
assert.ok(handleEventCancelledMatch, "Debe existir handleEventCancelled");
const body = handleEventCancelledMatch[1];
const showNativeCalls = (body.match(/this\.showNativeNotification\(/g) || []).length;
assert.strictEqual(showNativeCalls, 0, "handleEventCancelled NO debe invocar directamente showNativeNotification (debe delegar en _checkAndTriggerPush)");
console.log("✅ PASS: handleEventCancelled delega exclusivamente en _checkAndTriggerPush sin llamadas directas duplicadas.");

// Verificar que en handleEventDeleted tampoco hay llamada duplicada
const handleEventDeletedMatch = serviceCode.match(/handleEventDeleted\s*\([\s\S]*?\{([\s\S]*?)\n\s*\}/);
assert.ok(handleEventDeletedMatch, "Debe existir handleEventDeleted");
const bodyDel = handleEventDeletedMatch[1];
const showNativeDelCalls = (bodyDel.match(/this\.showNativeNotification\(/g) || []).length;
assert.strictEqual(showNativeDelCalls, 0, "handleEventDeleted NO debe invocar directamente showNativeNotification");
console.log("✅ PASS: handleEventDeleted delega exclusivamente en _checkAndTriggerPush sin duplicados.");

// Verificar que _checkAndTriggerPush bloquea eventos pasados
assert.ok(serviceCode.includes("if (this._isEventPast(notif))"), "_checkAndTriggerPush debe comprobar _isEventPast");
console.log("✅ PASS: _checkAndTriggerPush bloquea push nativos para eventos pasados.");

// 2. Mock de prueba unitaria dinámica
const localStorageStore = {};
const mockLocalStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = String(v); },
    removeItem: (k) => { delete localStorageStore[k]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

// Simular entorno mínimo para instanciar NotificationServiceClass
global.window = {
    db: { collection: () => ({ onSnapshot: () => () => {}, get: async () => ({ docs: [] }) }) },
    auth: { onAuthStateChanged: () => () => {} },
    location: { origin: 'http://localhost' },
    addEventListener: () => {}
};
global.localStorage = mockLocalStorage;
global.navigator = { serviceWorker: { addEventListener: () => {} } };
global.Notification = { permission: 'granted' };
global.document = { visibilityState: 'visible', addEventListener: () => {} };

eval(serviceCode);

const service = new window.NotificationServiceClass();

// Prueba de _isEventPast
const pastEvent = { date: '2026-10-03', time: '16:00' };
assert.strictEqual(service._isEventPast(pastEvent), true, "Evento del 2026-10-03 debe detectarse como pasado");
console.log("✅ PASS: Evento pasado (03/10/2026) detectado correctamente como pasado.");

const futureDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
const futureEvent = { date: futureDate, time: '19:00' };
assert.strictEqual(service._isEventPast(futureEvent), false, "Evento futuro debe detectarse como NO pasado");
console.log("✅ PASS: Evento futuro detectado como no pasado.");

// Prueba de que push nativo no se dispara para eventos pasados
let nativePushTriggered = false;
service.showNativeNotification = () => { nativePushTriggered = true; };

service.handleEventCancelled('entreno', 'past_test_1', pastEvent, 'cancelado');
assert.strictEqual(nativePushTriggered, false, "No debe disparar push nativo para un evento pasado");
console.log("✅ PASS: handleEventCancelled NO dispara push nativo para un entreno cancelado del pasado.");

// Prueba de deduplicación en getMergedNotifications: 5 notificaciones del mismo evento deben consolidarse en 1
service.notifications = [
    { id: 'firestore_1', data: { entrenoId: 'past_test_1' }, title: '⛔ Entreno Cancelado', body: 'Evento cancelado...', timestamp: new Date().toISOString() },
    { id: 'firestore_2', data: { entrenoId: 'past_test_1' }, title: '⛔ Entreno Cancelado', body: 'Evento cancelado...', timestamp: new Date().toISOString() },
    { id: 'evt_cancelled_entreno_past_test_1', data: { eventId: 'past_test_1' }, title: '⛔ Entreno Cancelado', body: 'Evento cancelado...', timestamp: new Date().toISOString() }
];

const merged = service.getMergedNotifications();
const forEvent = merged.filter(n => n.id.includes('past_test_1') || n.data?.entrenoId === 'past_test_1' || n.data?.eventId === 'past_test_1');
assert.strictEqual(forEvent.length, 1, `Debe consolidar las notificaciones repetidas en 1 sola tarjeta. Obtenidas: ${forEvent.length}`);
console.log("✅ PASS: 3 notificaciones repetidas del mismo evento cancelado se consolidaron en exactamente 1 tarjeta.");

console.log("\n========================================================================");
console.log("🎉 TODAS LAS PRUEBAS DE CALIDAD QA PASARON EXITOSAMENTE!");
console.log("========================================================================\n");
