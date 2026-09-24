/**
 * test-finished-events-detection.js
 * Suite de verificación para la detección inteligente de eventos y entrenos acabados.
 */
const assert = require('assert');

// Simular entorno global necesario para EventService
global.window = global;
global.AppConstants = {
    DEFAULTS: { MAX_COURTS: 4, PRICE_MEMBERS: 12, PRICE_EXTERNAL: 15 },
    STATUS: { OPEN: 'open' },
    EVENT_TYPES: { AMERICANA: 'americana', ENTRENO: 'entreno' },
    IMAGES: { AMERICANA: {}, PRAT: {}, DELFOS: {}, BALLS: {} }
};
global.FirebaseDB = {
    americanas: { getAll: async () => [], update: async () => {} },
    entrenos: { getAll: async () => [], update: async () => {} }
};

// Cargar EventService
require('../js/modules/common/EventService.js');
const EventService = global.EventService;

console.log("🎾 Iniciando pruebas de detección de americanas y entrenos acabados...\n");

// 1. Prueba de normalización de fechas
console.log("Test 1: Normalización de fechas");
const year = new Date().getFullYear();
assert.strictEqual(EventService.normalizeDate('23/09/2026'), '2026-09-23', 'Fallo al normalizar DD/MM/YYYY');
assert.strictEqual(EventService.normalizeDate('24/09/26'), '2026-09-24', 'Fallo al normalizar DD/MM/YY');
assert.strictEqual(EventService.normalizeDate('23/09'), `${year}-09-23`, 'Fallo al normalizar DD/MM sin año');
assert.strictEqual(EventService.normalizeDate('2026-09-23'), '2026-09-23', 'Fallo al normalizar YYYY-MM-DD');
console.log("✅ Test 1 superado con éxito.\n");

// 2. Prueba del entreno del 23 de septiembre mostrado en la captura del usuario
console.log("Test 2: Detección de entreno pasado (caso de la captura: 'MIÉ 23 SEPT 20:00')");
const pastEventScreenshot = {
    id: 'entreno_fem_23',
    name: 'ENTRENO FEMENINO 23/09',
    type: 'entreno',
    date: '23/09/2026',
    time: '20:00',
    status: 'open'
};
// Suponiendo hoy >= 24/09/2026
const isPastFinished = EventService.isEventFinished(pastEventScreenshot);
assert.strictEqual(isPastFinished, true, 'El entreno del 23/09 en formato DD/MM/YYYY debe considerarse ACABADO.');
console.log("✅ Test 2 superado: El entreno del 23/09 se detecta como ACABADO y no aparecerá en 'Disponibles'.\n");

// 3. Prueba de evento futuro
console.log("Test 3: Evento futuro (debe detectarse como NO acabado)");
const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
const yF = futureDate.getFullYear();
const mF = String(futureDate.getMonth() + 1).padStart(2, '0');
const dF = String(futureDate.getDate()).padStart(2, '0');
const futureEvent = {
    id: 'americana_futura',
    name: 'AMERICANA DOMINICAL',
    type: 'americana',
    date: `${dF}/${mF}/${yF}`,
    time: '18:00',
    status: 'open'
};
assert.strictEqual(EventService.isEventFinished(futureEvent), false, 'Un evento en fecha futura NO debe estar acabado.');
console.log("✅ Test 3 superado con éxito.\n");

// 4. Prueba de evento celebrado hoy cuyo horario ya expiró
console.log("Test 4: Evento de HOY que ya terminó su horario");
const today = new Date();
const yT = today.getFullYear();
const mT = String(today.getMonth() + 1).padStart(2, '0');
const dT = String(today.getDate()).padStart(2, '0');
// Creamos un evento que inició a las 00:01 y terminó a las 00:05 de hoy
const pastStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 1, 0);
const pastEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 5, 0);
const hStartStr = `${String(pastStart.getHours()).padStart(2, '0')}:${String(pastStart.getMinutes()).padStart(2, '0')}`;
const hEndStr = `${String(pastEnd.getHours()).padStart(2, '0')}:${String(pastEnd.getMinutes()).padStart(2, '0')}`;

const finishedTodayEvent = {
    id: 'entreno_hoy_vencido',
    name: 'ENTRENO HOY YA JUGADO',
    type: 'entreno',
    date: `${yT}-${mT}-${dT}`,
    time: `${hStartStr} - ${hEndStr}`,
    status: 'open' // En la BD seguía open
};
assert.strictEqual(EventService.isEventFinished(finishedTodayEvent), true, 'El evento de hoy con horario vencido debe considerarse ACABADO.');
console.log("✅ Test 4 superado: Evento de hoy con horario vencido se detecta como ACABADO.\n");

// 5. Prueba de autoCheckAndFinishEvents
console.log("\nTest 5: Auto-finalización en lote");
let updatedId = null;
let updatedStatus = null;
EventService.updateEvent = async (type, id, data) => {
    updatedId = id;
    updatedStatus = data.status;
    return true;
};

const eventsBatch = [pastEventScreenshot, futureEvent];
EventService.autoCheckAndFinishEvents(eventsBatch);

assert.strictEqual(pastEventScreenshot.status, 'finished', 'El evento expirado debió mutar su status a finished en memoria.');
assert.strictEqual(updatedId, 'entreno_fem_23', 'Se debió invocar updateEvent para el evento expirado.');
assert.strictEqual(updatedStatus, 'finished', 'Se debió actualizar a status finished.');
assert.strictEqual(futureEvent.status, 'open', 'El evento futuro NO debe cambiar de estado.');
console.log("✅ Test 5 superado: Auto-finalización actualiza silenciosamente eventos expirados.\n");

console.log("🎉 ¡TODOS LOS TESTS DE DETECCIÓN DE EVENTOS ACABADOS HAN PASADO CON ÉXITO!");
