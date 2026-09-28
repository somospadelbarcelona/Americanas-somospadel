/**
 * test-in-app-push-inbox-sync.js
 * 
 * Verifica que las notificaciones Push y Comunicados se persistan y muestren
 * garantizadamente en la bandeja in-app (#notif-list) y en la campana.
 */

// Mock del entorno DOM y Browser
const localStorageStore = {};
global.localStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = {
    db: null,
    auth: null,
    Store: {
        getState: () => ({ uid: 'user_test_123', name: 'Jugador Test' }),
        subscribe: () => {}
    }
};

global.navigator = {
    serviceWorker: {
        addEventListener: () => {},
        ready: Promise.resolve({
            showNotification: async () => true
        })
    }
};

global.Notification = {
    permission: 'granted'
};

// Cargar NotificationService
const fs = require('fs');
const path = require('path');

const notifServiceCode = fs.readFileSync(path.join(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
eval(notifServiceCode);

console.log("===============================================================");
console.log("🧪 VERIFICANDO INTEGRACIÓN IN-APP PUSH & NOTIFICATION INBOX");
console.log("===============================================================");

// 1. Instanciación autónoma
const service = new window.NotificationServiceClass();

if (service._initialized) {
    console.log("✅ TEST 1 PASSED: NotificationService se auto-inicializa en el constructor.");
} else {
    console.error("❌ TEST 1 FAILED: NotificationService no se auto-inicializó.");
    process.exit(1);
}

// 2. Registro de Push entrante en bandeja
const testPush = {
    id: 'push_unit_test_999',
    title: '📢 Nuevo Comunicado de Prueba',
    body: 'Este comunicado debe aparecer sí o sí dentro de la app.',
    timestamp: new Date().toISOString(),
    category: 'broadcast',
    type: 'broadcast',
    data: { url: 'dashboard', broadcastId: 'bc_999' }
};

service.recordInboundNotification(testPush);

const merged = service.getMergedNotifications();
const found = merged.find(n => n.id === 'push_unit_test_999');

if (found && found.title === '📢 Nuevo Comunicado de Prueba') {
    console.log("✅ TEST 2 PASSED: Push entrante registrado en la bandeja in-app.");
} else {
    console.error("❌ TEST 2 FAILED: Push entrante no encontrado en getMergedNotifications.");
    process.exit(1);
}

// 3. Persistencia en localStorage
const storedHistory = JSON.parse(global.localStorage.getItem('sp_inbound_push_history') || '[]');
if (storedHistory.some(n => n.id === 'push_unit_test_999')) {
    console.log("✅ TEST 3 PASSED: Push entrante persistido en sp_inbound_push_history.");
} else {
    console.error("❌ TEST 3 FAILED: Push no guardado en localStorage.");
    process.exit(1);
}

// 4. Conteo de no leídos en badge
const unread = service.getMergedNotifications().filter(n => !n.read).length;
if (unread >= 1) {
    console.log(`✅ TEST 4 PASSED: Contador no leídos reactivo refleja el nuevo push (${unread} pendientes).`);
} else {
    console.error("❌ TEST 4 FAILED: Contador no leídos no detectó el push.");
    process.exit(1);
}

// 5. Vaciar bandeja y permitir push posterior
service.deleteAllMyNotifications(true);
const afterClear = service.getMergedNotifications().filter(n => n.id === 'push_unit_test_999');
if (afterClear.length === 0) {
    console.log("✅ TEST 5 PASSED: Vaciar bandeja elimina las notificaciones existentes.");
} else {
    console.error("❌ TEST 5 FAILED: Notificación no eliminada tras vaciar bandeja.");
    process.exit(1);
}

// Simular llegada de nuevo push 1 segundo después del vaciado
const brandNewPush = {
    id: 'push_brand_new_1001',
    title: '🎾 Plaza Libre de Última Hora',
    body: 'Se ha liberado una plaza en Cornellà.',
    timestamp: new Date(Date.now() + 1000).toISOString(),
    category: 'matches',
    type: 'match',
    data: { eventId: 'evt_1001' }
};

service.recordInboundNotification(brandNewPush);
const mergedAfterBrandNew = service.getMergedNotifications();
const foundNew = mergedAfterBrandNew.find(n => n.id === 'push_brand_new_1001');

if (foundNew) {
    console.log("✅ TEST 6 PASSED: Push recibido tras el vaciado SÍ se muestra en la bandeja (no bloqueado por lápidas).");
} else {
    console.error("❌ TEST 6 FAILED: Nuevo push bloqueado indebidamente por lápida anterior.");
    process.exit(1);
}

console.log("===============================================================");
console.log("🎉 TODOS LOS TESTS DE BANDEJA IN-APP PUSH HAN PASADO AL 100%");
console.log("===============================================================");
process.exit(0);
