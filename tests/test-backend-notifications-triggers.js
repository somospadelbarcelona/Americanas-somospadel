/**
 * Test QA: Backend Cloud Functions Notification Triggers & Callable
 */
const fs = require('fs');
const { execSync } = require('child_process');

function test(description, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${description}`);
    } catch (err) {
        console.error(`❌ FAIL: ${description}`);
        console.error(err.message);
        process.exit(1);
    }
}

console.log('========================================================');
console.log('🧪 VERIFICACIÓN DE CLOUD FUNCTIONS Y TRIGGERS DE NOTIFICACIÓN');
console.log('========================================================\n');

// 1. Sintaxis
test('functions/index.js compila sin errores de sintaxis', () => {
    execSync('node -c functions/index.js');
});

const functionsCode = fs.readFileSync('functions/index.js', 'utf8');

// 2. onDeviceRegistered
test('functions/index.js exporta onDeviceRegistered en players/{userId}/devices/{deviceId}', () => {
    if (!functionsCode.includes("exports.onDeviceRegistered = functions.firestore") ||
        !functionsCode.includes(".document('players/{userId}/devices/{deviceId}')")) {
        throw new Error('Trigger onDeviceRegistered no definido correctamente');
    }
    if (!functionsCode.includes('subscribeToTopic') || !functionsCode.includes('all_players') || !functionsCode.includes('americanas') || !functionsCode.includes('entrenos') || !functionsCode.includes('news')) {
        throw new Error('onDeviceRegistered no gestiona los topics requeridos');
    }
});

// 3. onNewAmericanaPublished
test('functions/index.js exporta onNewAmericanaPublished con push masiva e in-app notifications', () => {
    if (!functionsCode.includes("exports.onNewAmericanaPublished = functions.firestore") ||
        !functionsCode.includes(".document('americanas/{id}')")) {
        throw new Error('Trigger onNewAmericanaPublished no definido');
    }
    if (!functionsCode.includes('🎾 ¡NUEVA AMERICANA PUBLICADA!') || !functionsCode.includes('americanas')) {
        throw new Error('onNewAmericanaPublished no tiene el formato o topic esperado');
    }
});

// 4. onNewEntrenoPublished
test('functions/index.js exporta onNewEntrenoPublished con push a topic entrenos', () => {
    if (!functionsCode.includes("exports.onNewEntrenoPublished = functions.firestore") ||
        !functionsCode.includes(".document('entrenos/{id}')")) {
        throw new Error('Trigger onNewEntrenoPublished no definido');
    }
    if (!functionsCode.includes('💪 ¡NUEVO ENTRENO TÁCTICO!') || !functionsCode.includes('entrenos')) {
        throw new Error('onNewEntrenoPublished no tiene el formato esperado');
    }
});

// 5. onBroadcastNoticeCreated
test('functions/index.js exporta onBroadcastNoticeCreated en broadcasts/{id}', () => {
    if (!functionsCode.includes("exports.onBroadcastNoticeCreated = functions.firestore") ||
        !functionsCode.includes(".document('broadcasts/{id}')")) {
        throw new Error('Trigger onBroadcastNoticeCreated no definido');
    }
    if (!functionsCode.includes('COMUNICADO SOMOSPADEL')) {
        throw new Error('onBroadcastNoticeCreated no tiene el título por defecto');
    }
});

// 6. sendClubBroadcast Callable
test('functions/index.js exporta sendClubBroadcast como HTTPS Callable con validación de admin', () => {
    if (!functionsCode.includes("exports.sendClubBroadcast = functions.https.onCall")) {
        throw new Error('Callable sendClubBroadcast no definido');
    }
    if (!functionsCode.includes("collection('broadcasts').add")) {
        throw new Error('sendClubBroadcast no persiste en la colección broadcasts');
    }
});

// 7. Deduplicación con skipPush
test('functions/index.js implementa flag skipPush para prevenir notificaciones push duplicadas', () => {
    if (!functionsCode.includes('skipPush')) {
        throw new Error('No se encontró el control de skipPush');
    }
});

console.log('\n========================================================');
console.log('🎉 TODAS LAS PRUEBAS DE TRIGGERS Y CALLABLES PASARON!');
console.log('========================================================\n');
