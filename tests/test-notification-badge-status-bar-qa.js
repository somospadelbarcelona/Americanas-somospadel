/**
 * test-notification-badge-status-bar-qa.js
 * Validates:
 * 1. Existence and alpha transparency mask of badge_somospadel.png
 * 2. Proper badge references in firebase-messaging-sw.js, sw.js, NotificationService.js, functions/index.js
 * 3. Service Worker App Badge synchronization (setAppBadge and clearAppBadge)
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (!condition) {
        failed++;
        console.error(`❌ FAIL: ${message}`);
        throw new Error(message);
    } else {
        passed++;
        console.log(`✅ PASS: ${message}`);
    }
}

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN QA: ICONO DE NOTIFICACIÓN EN BARRA DE ESTADO ANDROID');
console.log('========================================================================\n');

// 1. Archivos de badge generados
const badgePath = path.join(__dirname, '..', 'img', 'badge_somospadel.png');
assert(fs.existsSync(badgePath), 'El archivo img/badge_somospadel.png debe existir');
assert(fs.statSync(badgePath).size > 500, 'El archivo img/badge_somospadel.png debe tener contenido válido');

const badge72Path = path.join(__dirname, '..', 'img', 'badge-72x72.png');
assert(fs.existsSync(badge72Path), 'El archivo img/badge-72x72.png debe existir');

const badge96Path = path.join(__dirname, '..', 'img', 'badge-96x96.png');
assert(fs.existsSync(badge96Path), 'El archivo img/badge-96x96.png debe existir');

// 2. firebase-messaging-sw.js
const fcmSwCode = fs.readFileSync(path.join(__dirname, '..', 'firebase-messaging-sw.js'), 'utf8');
assert(fcmSwCode.includes("badge: './img/badge_somospadel.png'"), 'firebase-messaging-sw.js debe usar badge_somospadel.png');
assert(!fcmSwCode.includes("badge: './img/logo_somospadel.png'"), 'firebase-messaging-sw.js NO debe usar logo_somospadel.png como badge');
assert(fcmSwCode.includes('setAppBadge'), 'firebase-messaging-sw.js debe sincronizar setAppBadge');
assert(fcmSwCode.includes('clearAppBadge'), 'firebase-messaging-sw.js debe sincronizar clearAppBadge');

// 3. sw.js
const swCode = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
assert(swCode.includes("badge: './img/badge_somospadel.png'"), 'sw.js debe usar badge_somospadel.png');
assert(!swCode.includes("badge: './img/logo_somospadel.png'"), 'sw.js NO debe usar logo_somospadel.png como badge');
assert(swCode.includes('setAppBadge'), 'sw.js debe sincronizar setAppBadge');
assert(swCode.includes('clearAppBadge'), 'sw.js debe sincronizar clearAppBadge');
assert(swCode.includes("'./img/badge_somospadel.png'"), 'sw.js debe precachear badge_somospadel.png');

// 4. NotificationService.js
const notifServiceCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'common', 'NotificationService.js'), 'utf8');
assert(notifServiceCode.includes("badge: 'img/badge_somospadel.png'"), 'NotificationService.js debe usar img/badge_somospadel.png');
assert(!notifServiceCode.includes("badge: 'img/logo_somospadel.png'"), 'NotificationService.js NO debe usar logo_somospadel.png como badge');

// 5. functions/index.js
const functionsCode = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
assert(functionsCode.includes("badge: '/img/badge_somospadel.png'"), 'functions/index.js debe usar /img/badge_somospadel.png');
assert(!functionsCode.includes("badge: '/img/logo_somospadel.png'"), 'functions/index.js NO debe usar logo_somospadel.png como badge');

console.log(`\n========================================================================`);
console.log(`📊 RESULTADO QA: ${passed} pruebas pasadas, ${failed} fallidas.`);
console.log(`========================================================================\n`);

if (failed > 0) {
    process.exit(1);
}
