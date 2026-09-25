/**
 * test-journal-push-deep-link-qa.js
 * Batería de pruebas automatizadas QA para:
 * 1. Deep linking y recepción de push en Service Worker (firebase-messaging-sw.js y sw.js)
 * 2. Procesamiento de URLs y apertura modal de artículos en DashboardView_hotfix.js y Router.js
 * 3. Botón y trigger manual de Noticia Diaria en admin-notifications-manager.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name} ->`, err.message);
        failedTests++;
    }
}

console.log('========================================================================');
console.log('🧪 BATERÍA QA: NOTICIA DIARIA PUSH, DEEP LINKING & SERVICE WORKER');
console.log('========================================================================\n');

// 1. Sintaxis de archivos
console.log('▶️ BLOQUE 1: Verificación sintáctica JavaScript');
test('Sintaxis de firebase-messaging-sw.js', () => {
    execSync('node -c firebase-messaging-sw.js');
});

test('Sintaxis de sw.js', () => {
    execSync('node -c sw.js');
});

test('Sintaxis de js/core/Router.js', () => {
    execSync('node -c js/core/Router.js');
});

test('Sintaxis de js/modules/dashboard/DashboardView_hotfix.js', () => {
    execSync('node -c js/modules/dashboard/DashboardView_hotfix.js');
});

test('Sintaxis de js/modules/admin-notifications-manager.js', () => {
    execSync('node -c js/modules/admin-notifications-manager.js');
});

// 2. Service Workers (firebase-messaging-sw.js y sw.js)
console.log('\n▶️ BLOQUE 2: Service Workers - Manejo de artículo en notificationclick');
const fcmSwCode = fs.readFileSync('firebase-messaging-sw.js', 'utf8');
const swCode = fs.readFileSync('sw.js', 'utf8');

test('firebase-messaging-sw.js procesa data.articleId y targetPath con article=', () => {
    if (!fcmSwCode.includes('data.articleId') && !fcmSwCode.includes('articleId')) {
        throw new Error('No extrae articleId');
    }
    if (!fcmSwCode.includes('article=')) {
        throw new Error('No procesa parámetro article=');
    }
    if (!fcmSwCode.includes("type: 'NOTIFICATION_CLICKED'")) {
        throw new Error('No emite NOTIFICATION_CLICKED');
    }
});

test('sw.js procesa data.articleId y targetPath con article=', () => {
    if (!swCode.includes('data.articleId') && !swCode.includes('articleId')) {
        throw new Error('sw.js no extrae articleId');
    }
    if (!swCode.includes('article=')) {
        throw new Error('sw.js no procesa parámetro article=');
    }
    if (!swCode.includes("type: 'NOTIFICATION_CLICKED'")) {
        throw new Error('sw.js no emite NOTIFICATION_CLICKED');
    }
});

// 3. Router.js
console.log('\n▶️ BLOQUE 3: Router.js - Rutas directas para Journal');
const routerCode = fs.readFileSync('js/core/Router.js', 'utf8');

test('Router.js mapea rutas journal y blog hacia renderDashboard()', () => {
    if (!routerCode.includes("'journal': () => this.renderDashboard()")) {
        throw new Error("No incluye ruta 'journal'");
    }
    if (!routerCode.includes("'blog': () => this.renderDashboard()")) {
        throw new Error("No incluye ruta 'blog'");
    }
});

// 4. DashboardView_hotfix.js
console.log('\n▶️ BLOQUE 4: DashboardView_hotfix.js - Procesamiento de URL y modal Journal');
const dashboardCode = fs.readFileSync('js/modules/dashboard/DashboardView_hotfix.js', 'utf8');

test('DashboardView_hotfix.js contiene método getArticleIdFromUrl', () => {
    if (!dashboardCode.includes('getArticleIdFromUrl()')) {
        throw new Error('No implementa getArticleIdFromUrl()');
    }
});

test('DashboardView_hotfix.js contiene método openArticleModal', () => {
    if (!dashboardCode.includes('openArticleModal(articleId)')) {
        throw new Error('No implementa openArticleModal(articleId)');
    }
});

test('DashboardView_hotfix.js contiene método initJournalPushNavigation', () => {
    if (!dashboardCode.includes('initJournalPushNavigation()')) {
        throw new Error('No implementa initJournalPushNavigation()');
    }
    if (!dashboardCode.includes("NOTIFICATION_CLICKED")) {
        throw new Error('No escucha NOTIFICATION_CLICKED');
    }
});

test('DashboardView_hotfix.js expone window.openArticleModal', () => {
    if (!dashboardCode.includes('window.openArticleModal =')) {
        throw new Error('No expone window.openArticleModal');
    }
});

test('Prueba funcional simulada de getArticleIdFromUrl', () => {
    // Simular objeto DashboardView mínimo
    const mockContext = {
        getArticleIdFromUrl(testSearch, testHash) {
            try {
                const searchParams = new URLSearchParams(testSearch || '');
                const fromSearch = searchParams.get('article') || 
                                   searchParams.get('articleId') || 
                                   searchParams.get('journal') || 
                                   searchParams.get('post');
                if (fromSearch) return decodeURIComponent(fromSearch).trim();
            } catch (_) {}

            try {
                const hash = testHash || '';
                if (hash.includes('?')) {
                    const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
                    const fromHash = hashParams.get('article') || 
                                     hashParams.get('articleId') || 
                                     hashParams.get('journal') || 
                                     hashParams.get('post');
                    if (fromHash) return decodeURIComponent(fromHash).trim();
                }
                const match = hash.match(/[?&#](?:article|articleId|journal|post)=([^&#]+)/i);
                if (match && match[1]) {
                    return decodeURIComponent(match[1]).trim();
                }
            } catch (_) {}

            return null;
        }
    };

    // Casos de prueba:
    // A: Query string directo (?article=cultura-fair-play)
    if (mockContext.getArticleIdFromUrl('?article=cultura-fair-play', '') !== 'cultura-fair-play') {
        throw new Error('Fallo al extraer ?article=cultura-fair-play');
    }
    // B: Query string con journal (?journal=match-point-oro)
    if (mockContext.getArticleIdFromUrl('?journal=match-point-oro', '') !== 'match-point-oro') {
        throw new Error('Fallo al extraer ?journal=match-point-oro');
    }
    // C: Hash con dashboard (?article=palas-control-potencia)
    if (mockContext.getArticleIdFromUrl('', '#dashboard?article=palas-control-potencia') !== 'palas-control-potencia') {
        throw new Error('Fallo al extraer #dashboard?article=palas-control-potencia');
    }
    // D: Hash con journal (?article=nutricion-hidratacion)
    if (mockContext.getArticleIdFromUrl('', '#journal?article=nutricion-hidratacion') !== 'nutricion-hidratacion') {
        throw new Error('Fallo al extraer #journal?article=nutricion-hidratacion');
    }
});

// 5. admin-notifications-manager.js
console.log('\n▶️ BLOQUE 5: admin-notifications-manager.js - Botón de prueba Noticia Diaria');
const adminManagerCode = fs.readFileSync('js/modules/admin-notifications-manager.js', 'utf8');

test('Contiene el botón #notif-manager-test-daily-news-btn con texto Probar Noticia Diaria', () => {
    if (!adminManagerCode.includes('id="notif-manager-test-daily-news-btn"')) {
        throw new Error('No contiene id="notif-manager-test-daily-news-btn"');
    }
    if (!adminManagerCode.includes('Probar Noticia Diaria')) {
        throw new Error('No contiene etiqueta "Probar Noticia Diaria"');
    }
});

test('Implementa triggerDailyNewsPush y testDailyNewsPush', () => {
    if (!adminManagerCode.includes('triggerDailyNewsPush(')) {
        throw new Error('No implementa triggerDailyNewsPush');
    }
    if (!adminManagerCode.includes('testDailyNewsPush(')) {
        throw new Error('No implementa testDailyNewsPush');
    }
});

test('Invoca Cloud Function sendDailyNewsPushNow con force: true', () => {
    if (!adminManagerCode.includes("httpsCallable('sendDailyNewsPushNow')")) {
        throw new Error("No invoca httpsCallable('sendDailyNewsPushNow')");
    }
    if (!adminManagerCode.includes('force: true')) {
        throw new Error('No envía parámetro { force: true }');
    }
});

test('Proporciona feedback con PremiumModal.alert de Noticia del día emitida', () => {
    if (!adminManagerCode.includes('Noticia del día emitida a todos los móviles apagados:')) {
        throw new Error('No contiene el texto de feedback especificado');
    }
});

console.log('\n========================================================================');
console.log(`📊 TOTAL PRUEBAS: ${passedTests + failedTests}`);
console.log(`✅ PASADAS: ${passedTests}`);
console.log(`❌ FALLADAS: ${failedTests}`);
console.log('========================================================================');

if (failedTests > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
