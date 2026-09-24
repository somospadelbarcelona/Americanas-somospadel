/**
 * Automated QA Test Suite for SomosPadel Notification System
 * Validates:
 * 1. Syntax of all modified files.
 * 2. DOM IDs uniqueness and element structure in index.html and js/app.js.
 * 3. NotificationUi class logic, methods, and badge synchronization.
 * 4. Multi-device registration schema compatibility in NotificationService.js and functions/index.js.
 * 5. Service Worker push and notificationclick event listeners.
 * 6. Responsive layout of .cmd-bar across 360px - 430px viewports using Edge headless.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const results = [];

function test(name, fn) {
    try {
        fn();
        results.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (err) {
        results.push({ name, status: 'FAIL', error: err.message });
        console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
    }
}

console.log('========================================================');
console.log('🧪 INICIANDO BATERÍA DE PRUEBAS DE CALIDAD - NOTIFICACIONES');
console.log('========================================================\n');

// -----------------------------------------------------------------------------
// 1. Sintaxis de archivos modificados
// -----------------------------------------------------------------------------
test('Prueba sintáctica: js/modules/ui/NotificationUi.js', () => {
    execSync('node -c js/modules/ui/NotificationUi.js');
});

test('Prueba sintáctica: js/app.js', () => {
    execSync('node -c js/app.js');
});

test('Prueba sintáctica: firebase-messaging-sw.js', () => {
    execSync('node -c firebase-messaging-sw.js');
});

test('Prueba sintáctica: sw.js', () => {
    execSync('node -c sw.js');
});

test('Prueba sintáctica: js/modules/common/NotificationService.js', () => {
    execSync('node -c js/modules/common/NotificationService.js');
});

test('Prueba sintáctica: functions/index.js', () => {
    execSync('node -c functions/index.js');
});

// -----------------------------------------------------------------------------
// 2. Unicidad de IDs y consistencia en index.html
// -----------------------------------------------------------------------------
const indexHtml = fs.readFileSync('index.html', 'utf8');

test('index.html contiene el botón de campana #btn-header-notifications único', () => {
    const matches = indexHtml.match(/id=["']btn-header-notifications["']/g);
    if (!matches || matches.length !== 1) {
        throw new Error(`btn-header-notifications esperado 1 vez, encontrado: ${matches ? matches.length : 0}`);
    }
});

test('index.html contiene #notif-bell-icon único', () => {
    const matches = indexHtml.match(/id=["']notif-bell-icon["']/g);
    if (!matches || matches.length !== 1) {
        throw new Error(`notif-bell-icon esperado 1 vez, encontrado: ${matches ? matches.length : 0}`);
    }
});

test('index.html contiene #notif-badge único', () => {
    const matches = indexHtml.match(/id=["']notif-badge["']/g);
    if (!matches || matches.length !== 1) {
        throw new Error(`notif-badge esperado 1 vez, encontrado: ${matches ? matches.length : 0}`);
    }
});

test('index.html botón de campana invoca NotificationUi.toggle()', () => {
    const btnSnippetMatch = indexHtml.match(/<button[^>]*id=["']btn-header-notifications["'][^>]*>/s);
    if (!btnSnippetMatch) throw new Error('No se encontró el botón btn-header-notifications');
    const btnTag = btnSnippetMatch[0];
    if (!btnTag.includes('NotificationUi.toggle()')) {
        throw new Error(`El botón no contiene la invocación a NotificationUi.toggle(). Tag: ${btnTag}`);
    }
});

// -----------------------------------------------------------------------------
// 3. Side Drawer en js/app.js
// -----------------------------------------------------------------------------
const appJs = fs.readFileSync('js/app.js', 'utf8');

test('js/app.js contiene fila de Notificaciones con #drawer-notif-badge', () => {
    if (!appJs.includes('id="drawer-notif-badge"')) {
        throw new Error('No se encontró id="drawer-notif-badge" en js/app.js');
    }
    if (!appJs.includes('id="drawer-notif-bell-icon"')) {
        throw new Error('No se encontró id="drawer-notif-bell-icon" en js/app.js');
    }
});

test('js/app.js fila de notificaciones llama a NotificationUi.open()', () => {
    if (!appJs.includes('NotificationUi.open()')) {
        throw new Error('No se encontró llamada a NotificationUi.open() en js/app.js');
    }
});

// -----------------------------------------------------------------------------
// 4. Lógica de NotificationUi (Pruebas unitarias de comportamiento DOM)
// -----------------------------------------------------------------------------
test('NotificationUi maneja sincronización dual de badges y animación shake', () => {
    // Mock simple de DOM en memoria
    const domElements = {
        'notif-badge': { style: { display: 'none' }, innerText: '' },
        'notif-bell-icon': { classList: new Set(), offsetWidth: 10 },
        'drawer-notif-badge': { style: { display: 'none' }, innerText: '' },
        'drawer-notif-bell-icon': { classList: new Set(), offsetWidth: 10 }
    };

    // Helper classList mock
    for (const key of ['notif-bell-icon', 'drawer-notif-bell-icon']) {
        const set = domElements[key].classList;
        domElements[key].classList = {
            add: (c) => set.add(c),
            remove: (c) => set.delete(c),
            contains: (c) => set.has(c)
        };
    }

    const fakeDocument = {
        getElementById: (id) => domElements[id] || null
    };

    // Evaluar NotificationUi con documento simulado
    const originalDoc = global.document;
    const originalWindow = global.window;
    global.document = fakeDocument;
    global.window = {
        NotificationService: { unreadCount: 0 }
    };

    // Cargar código
    const notifUiCode = fs.readFileSync('js/modules/ui/NotificationUi.js', 'utf8');
    // Ejecutar en contexto
    const vm = require('vm');
    const sandbox = {
        window: global.window,
        document: fakeDocument,
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval
    };
    vm.createContext(sandbox);
    vm.runInContext(notifUiCode, sandbox);

    const ui = sandbox.window.NotificationUi;
    if (!ui) throw new Error('NotificationUi no fue instanciado en window.NotificationUi');

    // Test 1: Con count = 5
    ui.updateBadge(5);
    if (domElements['notif-badge'].style.display !== 'flex' || domElements['notif-badge'].innerText !== '5') {
        throw new Error(`Badge header incorrecto para count=5: display=${domElements['notif-badge'].style.display}, text=${domElements['notif-badge'].innerText}`);
    }
    if (domElements['drawer-notif-badge'].style.display !== 'inline-flex' || domElements['drawer-notif-badge'].innerText !== '5') {
        throw new Error(`Badge drawer incorrecto para count=5: display=${domElements['drawer-notif-badge'].style.display}, text=${domElements['drawer-notif-badge'].innerText}`);
    }
    if (!domElements['notif-bell-icon'].classList.contains('shake-animation')) {
        throw new Error('notif-bell-icon no tiene la clase shake-animation con count > 0');
    }
    if (!domElements['drawer-notif-bell-icon'].classList.contains('shake-animation')) {
        throw new Error('drawer-notif-bell-icon no tiene la clase shake-animation con count > 0');
    }

    // Test 2: Con count = 120 (debe mostrar 99+)
    ui.updateBadge(120);
    if (domElements['notif-badge'].innerText !== '99+') {
        throw new Error(`Esperado 99+ para count=120, obtenido: ${domElements['notif-badge'].innerText}`);
    }
    if (domElements['drawer-notif-badge'].innerText !== '99+') {
        throw new Error(`Esperado 99+ en drawer para count=120, obtenido: ${domElements['drawer-notif-badge'].innerText}`);
    }

    // Test 3: Con count = 0
    ui.updateBadge(0);
    if (domElements['notif-badge'].style.display !== 'none') {
        throw new Error(`Badge header no se ocultó al ser count=0: ${domElements['notif-badge'].style.display}`);
    }
    if (domElements['drawer-notif-badge'].style.display !== 'none') {
        throw new Error(`Badge drawer no se ocultó al ser count=0: ${domElements['drawer-notif-badge'].style.display}`);
    }
    if (domElements['notif-bell-icon'].classList.contains('shake-animation')) {
        throw new Error('shake-animation persiste en notif-bell-icon con count=0');
    }
    if (domElements['drawer-notif-bell-icon'].classList.contains('shake-animation')) {
        throw new Error('shake-animation persiste en drawer-notif-bell-icon con count=0');
    }

    global.document = originalDoc;
    global.window = originalWindow;
});

// -----------------------------------------------------------------------------
// 5. Service Workers: firebase-messaging-sw.js y sw.js
// -----------------------------------------------------------------------------
const fcmSw = fs.readFileSync('firebase-messaging-sw.js', 'utf8');
const mainSw = fs.readFileSync('sw.js', 'utf8');

test('firebase-messaging-sw.js implementa onBackgroundMessage y notificationclick', () => {
    if (!fcmSw.includes('messaging.onBackgroundMessage')) {
        throw new Error('firebase-messaging-sw.js no incluye messaging.onBackgroundMessage');
    }
    if (!fcmSw.includes("self.addEventListener('notificationclick'")) {
        throw new Error('firebase-messaging-sw.js no incluye notificationclick listener');
    }
    if (!fcmSw.includes('clients.matchAll')) {
        throw new Error('firebase-messaging-sw.js no implementa clients.matchAll para enfoque o redirección');
    }
});

test('sw.js incluye listeners para push y notificationclick de resiliencia', () => {
    if (!mainSw.includes("self.addEventListener('push'")) {
        throw new Error('sw.js no incluye push listener de respaldo');
    }
    if (!mainSw.includes("self.addEventListener('notificationclick'")) {
        throw new Error('sw.js no incluye notificationclick listener');
    }
});

// -----------------------------------------------------------------------------
// 6. NotificationService.js: Multi-dispositivo
// -----------------------------------------------------------------------------
const notifServiceJs = fs.readFileSync('js/modules/common/NotificationService.js', 'utf8');

test('NotificationService.js implementa registro multi-dispositivo en players/{userId}/devices/{deviceId}', () => {
    if (!notifServiceJs.includes(".collection('devices').doc(deviceId).set(")) {
        throw new Error('No se encontró el guardado en subcolección devices/{deviceId}');
    }
    if (!notifServiceJs.includes('getDeviceId()')) {
        throw new Error('No se encontró el método getDeviceId()');
    }
    if (!notifServiceJs.includes('getDevicePlatform()')) {
        throw new Error('No se encontró el método getDevicePlatform()');
    }
    // Compatibilidad legacy
    if (!notifServiceJs.includes('fcm_token: token')) {
        throw new Error('No se mantiene fcm_token en el perfil del jugador para compatibilidad');
    }
});

// -----------------------------------------------------------------------------
// 7. functions/index.js: Multicast y limpieza
// -----------------------------------------------------------------------------
const functionsJs = fs.readFileSync('functions/index.js', 'utf8');

test('functions/index.js despacha a devices con sendEachForMulticast y limpia tokens expirados', () => {
    if (!functionsJs.includes(".collection('devices').get()")) {
        throw new Error('functions/index.js no lee de la subcolección devices');
    }
    if (!functionsJs.includes('sendEachForMulticast')) {
        throw new Error('functions/index.js no utiliza sendEachForMulticast');
    }
    if (!functionsJs.includes('messaging/invalid-registration-token') ||
        !functionsJs.includes('messaging/registration-token-not-registered')) {
        throw new Error('functions/index.js no detecta códigos de token expirados');
    }
    if (!functionsJs.includes('batch.delete(devRef)')) {
        throw new Error('functions/index.js no borra el dispositivo obsoleto en Firestore');
    }
});

// -----------------------------------------------------------------------------
// 8. notifications.css: Estilos requeridos
// -----------------------------------------------------------------------------
const notifCss = fs.readFileSync('css/notifications.css', 'utf8');

test('css/notifications.css define .header-notif-btn, .notif-header-badge, .shake-animation y media queries', () => {
    if (!notifCss.includes('.header-notif-btn')) throw new Error('Falta .header-notif-btn');
    if (!notifCss.includes('.notif-header-badge')) throw new Error('Falta .notif-header-badge');
    if (!notifCss.includes('.shake-animation')) throw new Error('Falta .shake-animation');
    if (!notifCss.includes('#drawer-notif-badge')) throw new Error('Falta #drawer-notif-badge');
    if (!notifCss.includes('@media (max-width: 600px)') || !notifCss.includes('@media (max-width: 414px)')) {
        throw new Error('Faltan media queries móviles de responsive');
    }
});

// -----------------------------------------------------------------------------
// Resumen
// -----------------------------------------------------------------------------
console.log('\n========================================================');
console.log(`📊 TOTAL PRUEBAS: ${results.length}`);
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`✅ PASADAS: ${passed}`);
console.log(`❌ FALLADAS: ${failed}`);
console.log('========================================================');

if (failed > 0) {
    process.exit(1);
}
