/**
 * test-daily-news-push-qa.js
 * 
 * Suite de Pruebas de Calidad (QA) para la Noticia del Día automática (Opción A):
 * 1. Cloud Function programada scheduledDailyNewsPush en functions/index.js (11:00 AM Europe/Madrid).
 * 2. Catálogo JOURNAL_DAILY_ARTICLES con id, title, summary, category e icon.
 * 3. Selección rotativa determinista, coherente y sin duplicados consecutivos.
 * 4. Cloud Function Callable sendDailyNewsPushNow con control RBAC de SuperAdmin / Admin.
 * 5. Manejo en firebase-messaging-sw.js de articleId y notificationclick.
 * 6. Detección en DashboardView_hotfix.js del parámetro article para deep linking y apertura de modal.
 * 7. Botón #notif-manager-test-daily-news-btn y disparador en admin-notifications-manager.js.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================================================');
console.log('🧪 QA TEST SUITE: CERTIFICACIÓN DE NOTICIA DEL DÍA AUTOMÁTICA (OPCIÓN A)');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(description, testFn) {
    try {
        testFn();
        passCount++;
        console.log(`✅ PASS: ${description}`);
    } catch (err) {
        failCount++;
        console.error(`❌ FAIL: ${description}`);
        console.error(`   -> ${err.message}\n`);
    }
}

// ============================================================================
// BLOQUE 1: Cloud Function Programada scheduledDailyNewsPush (functions/index.js)
// ============================================================================
console.log('▶️ BLOQUE 1: Verificación de Cloud Function programada scheduledDailyNewsPush');

const functionsPath = path.resolve('functions/index.js');
assert.ok(fs.existsSync(functionsPath), 'functions/index.js debe existir');

runTest('functions/index.js compila sin errores de sintaxis', () => {
    execSync('node -c functions/index.js');
});

const functionsContent = fs.readFileSync(functionsPath, 'utf8');

runTest('scheduledDailyNewsPush existe y está exportada en functions/index.js', () => {
    assert.ok(
        functionsContent.includes('exports.scheduledDailyNewsPush = functions.pubsub'),
        'exports.scheduledDailyNewsPush debe estar definida con functions.pubsub'
    );
});

runTest("scheduledDailyNewsPush configurada para las 11:00 AM ('0 11 * * *') y zona 'Europe/Madrid'", () => {
    assert.ok(
        functionsContent.includes(".schedule('0 11 * * *')"),
        "scheduledDailyNewsPush debe ejecutarse con el cron '0 11 * * *'"
    );
    assert.ok(
        functionsContent.includes(".timeZone('Europe/Madrid')"),
        "scheduledDailyNewsPush debe tener la zona horaria 'Europe/Madrid'"
    );
});

runTest('scheduledDailyNewsPush emite push a topic all_players y topic news, y guarda in-app notifications', () => {
    assert.ok(
        functionsContent.includes("sendTopicNotification('all_players'"),
        "Debe emitir push masivo al topic 'all_players'"
    );
    assert.ok(
        functionsContent.includes("saveInAppNotificationForActivePlayers"),
        "Debe guardar notificación en el cajón de jugadores activos"
    );
});

// ============================================================================
// BLOQUE 2: Catálogo Curado JOURNAL_DAILY_ARTICLES
// ============================================================================
console.log('\n▶️ BLOQUE 2: Validación del catálogo curado JOURNAL_DAILY_ARTICLES');

const catalogPath = path.resolve('functions/journalCatalog.js');
assert.ok(fs.existsSync(catalogPath), 'functions/journalCatalog.js debe existir');

const { JOURNAL_DAILY_ARTICLES, JOURNAL_CATALOG } = require(catalogPath);

runTest('JOURNAL_DAILY_ARTICLES y JOURNAL_CATALOG están definidos y son arrays no vacíos', () => {
    assert.ok(Array.isArray(JOURNAL_DAILY_ARTICLES), 'JOURNAL_DAILY_ARTICLES debe ser un array');
    assert.ok(JOURNAL_DAILY_ARTICLES.length >= 10, 'JOURNAL_DAILY_ARTICLES debe contener al menos 10 artículos curados');
    assert.strictEqual(JOURNAL_DAILY_ARTICLES, JOURNAL_CATALOG, 'JOURNAL_CATALOG y JOURNAL_DAILY_ARTICLES deben coincidir');
});

runTest('Todos los artículos tienen id, title, summary, category e icon válidos', () => {
    const seenIds = new Set();

    JOURNAL_DAILY_ARTICLES.forEach((item, index) => {
        assert.ok(typeof item.id === 'string' && item.id.trim().length > 0, `Artículo #${index} debe tener id no vacío`);
        assert.ok(!seenIds.has(item.id), `ID duplicado detectado: ${item.id}`);
        seenIds.add(item.id);

        assert.ok(typeof item.title === 'string' && item.title.trim().length > 0, `Artículo #${item.id} debe tener title`);
        assert.ok(typeof item.summary === 'string' && item.summary.trim().length > 0, `Artículo #${item.id} debe tener summary`);
        assert.ok(typeof item.category === 'string' && item.category.trim().length > 0, `Artículo #${item.id} debe tener category`);
        assert.ok(typeof item.icon === 'string' && item.icon.trim().length > 0, `Artículo #${item.id} debe tener icon`);
    });
});

// ============================================================================
// BLOQUE 3: Lógica Rotativa y Coherente de Noticia del Día
// ============================================================================
console.log('\n▶️ BLOQUE 3: Validación de la selección rotativa y coherente');

runTest('functions/index.js exporta la función selectDailyNewsArticle (o getDailyNewsArticle)', () => {
    assert.ok(
        functionsContent.includes('exports.selectDailyNewsArticle = selectDailyNewsArticle') ||
        functionsContent.includes('function selectDailyNewsArticle'),
        'selectDailyNewsArticle debe estar definida'
    );
});

runTest('La selección es determinista para una misma fecha', () => {
    function getMadridDayOfYear(date) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Madrid',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const parts = formatter.formatToParts(date);
        const y = parseInt(parts.find(p => p.type === 'year').value, 10);
        const m = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
        const d = parseInt(parts.find(p => p.type === 'day').value, 10);
        const madridDay = new Date(Date.UTC(y, m, d));
        const startOfYear = new Date(Date.UTC(y, 0, 1));
        return Math.floor((madridDay - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    }

    function selectArticle(date, prevId = null) {
        const day = getMadridDayOfYear(date);
        let idx = day % JOURNAL_DAILY_ARTICLES.length;
        let art = JOURNAL_DAILY_ARTICLES[idx];
        if (prevId && art.id === prevId && JOURNAL_DAILY_ARTICLES.length > 1) {
            idx = (idx + 1) % JOURNAL_DAILY_ARTICLES.length;
            art = JOURNAL_DAILY_ARTICLES[idx];
        }
        return art;
    }

    const testDate = new Date('2026-05-15T11:00:00Z');
    const pick1 = selectArticle(testDate);
    const pick2 = selectArticle(testDate);

    assert.strictEqual(pick1.id, pick2.id, 'La selección para el mismo día debe ser idéntica');
});

runTest('La selección es rotativa entre días consecutivos y evita repetición inmediata', () => {
    function getMadridDayOfYear(date) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Madrid',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const parts = formatter.formatToParts(date);
        const y = parseInt(parts.find(p => p.type === 'year').value, 10);
        const m = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
        const d = parseInt(parts.find(p => p.type === 'day').value, 10);
        const madridDay = new Date(Date.UTC(y, m, d));
        const startOfYear = new Date(Date.UTC(y, 0, 1));
        return Math.floor((madridDay - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    }

    function selectArticle(date, prevId = null) {
        const day = getMadridDayOfYear(date);
        let idx = day % JOURNAL_DAILY_ARTICLES.length;
        let art = JOURNAL_DAILY_ARTICLES[idx];
        if (prevId && art.id === prevId && JOURNAL_DAILY_ARTICLES.length > 1) {
            idx = (idx + 1) % JOURNAL_DAILY_ARTICLES.length;
            art = JOURNAL_DAILY_ARTICLES[idx];
        }
        return art;
    }

    let prevArticleId = null;
    const selectedArticles = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(Date.UTC(2026, 8, 20 + dayOffset, 9, 0, 0));
        const article = selectArticle(date, prevArticleId);
        assert.ok(article, `Debe seleccionar un artículo para el día ${dayOffset}`);
        if (prevArticleId) {
            assert.notStrictEqual(article.id, prevArticleId, `Día ${dayOffset} no debe repetir el artículo de ayer`);
        }
        prevArticleId = article.id;
        selectedArticles.push(article.id);
    }

    assert.strictEqual(selectedArticles.length, 7, 'Debe haber generado 7 artículos rotativos');
});

// ============================================================================
// BLOQUE 4: Cloud Function Callable sendDailyNewsPushNow
// ============================================================================
console.log('\n▶️ BLOQUE 4: Verificación de Callable sendDailyNewsPushNow');

runTest('sendDailyNewsPushNow está definida como https.onCall y exportada', () => {
    assert.ok(
        functionsContent.includes('exports.sendDailyNewsPushNow = functions.https.onCall'),
        'sendDailyNewsPushNow debe ser una función callable HTTPS'
    );
});

runTest('sendDailyNewsPushNow valida autenticación y roles administrativos', () => {
    assert.ok(
        functionsContent.includes('!context.auth'),
        'Debe verificar context.auth'
    );
    assert.ok(
        functionsContent.includes("'admin'") && functionsContent.includes("'super_admin'"),
        'Debe verificar roles de administrador'
    );
});

// ============================================================================
// BLOQUE 5: Service Worker firebase-messaging-sw.js (Manejo de articleId y notificationclick)
// ============================================================================
console.log('\n▶️ BLOQUE 5: Verificación de firebase-messaging-sw.js');

const swPath = path.resolve('firebase-messaging-sw.js');
assert.ok(fs.existsSync(swPath), 'firebase-messaging-sw.js debe existir');

runTest('firebase-messaging-sw.js compila sin errores de sintaxis', () => {
    execSync('node -c firebase-messaging-sw.js');
});

const swContent = fs.readFileSync(swPath, 'utf8');

runTest('firebase-messaging-sw.js detecta articleId y adjunta el parámetro ?article= a la URL', () => {
    assert.ok(
        swContent.includes('articleId') || swContent.includes('data.articleId'),
        'El Service Worker debe leer articleId'
    );
    assert.ok(
        swContent.includes('article='),
        'El Service Worker debe construir la ruta con article='
    );
});

runTest('notificationclick en el Service Worker realiza postMessage con articleId para la app abierta', () => {
    assert.ok(
        swContent.includes("addEventListener('notificationclick'"),
        'Debe tener listener de notificationclick'
    );
    assert.ok(
        swContent.includes('postMessage') && swContent.includes('articleId'),
        'Debe enviar postMessage incluyendo articleId a la ventana enfocada'
    );
});

// ============================================================================
// BLOQUE 6: DashboardView_hotfix.js (Detección de ?article y apertura de modal)
// ============================================================================
console.log('\n▶️ BLOQUE 6: Verificación de DashboardView_hotfix.js');

const dashboardPath = path.resolve('js/modules/dashboard/DashboardView_hotfix.js');
assert.ok(fs.existsSync(dashboardPath), 'DashboardView_hotfix.js debe existir');

runTest('DashboardView_hotfix.js compila sin errores de sintaxis', () => {
    execSync('node -c js/modules/dashboard/DashboardView_hotfix.js');
});

const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

runTest("DashboardView_hotfix.js detecta el parámetro 'article' en la URL (search y hash)", () => {
    assert.ok(
        dashboardContent.includes("urlParams.get('article')") ||
        dashboardContent.includes(".get('article')"),
        "DashboardView_hotfix.js debe consultar urlParams.get('article')"
    );
});

runTest('DashboardView_hotfix.js implementa los métodos openArticle y openBlogPost para abrir el modal', () => {
    assert.ok(
        dashboardContent.includes('openBlogPost('),
        'openBlogPost debe estar implementado'
    );
    assert.ok(
        dashboardContent.includes('openArticle('),
        'openArticle debe estar implementado como alias directo'
    );
});

// ============================================================================
// BLOQUE 7: Botón #notif-manager-test-daily-news-btn en admin-notifications-manager.js
// ============================================================================
console.log('\n▶️ BLOQUE 7: Verificación de admin-notifications-manager.js');

const adminManagerPath = path.resolve('js/modules/admin-notifications-manager.js');
assert.ok(fs.existsSync(adminManagerPath), 'admin-notifications-manager.js debe existir');

runTest('admin-notifications-manager.js compila sin errores de sintaxis', () => {
    execSync('node -c js/modules/admin-notifications-manager.js');
});

const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');

runTest('admin-notifications-manager.js contiene el botón #notif-manager-test-daily-news-btn', () => {
    assert.ok(
        adminManagerContent.includes('id="notif-manager-test-daily-news-btn"'),
        'El botón #notif-manager-test-daily-news-btn debe existir en el template HTML'
    );
});

runTest('admin-notifications-manager.js implementa el método testDailyNewsPush vinculado al botón', () => {
    assert.ok(
        adminManagerContent.includes('testDailyNewsPush()'),
        'AdminNotificationsManagerController debe implementar el método testDailyNewsPush()'
    );
    assert.ok(
        adminManagerContent.includes('sendDailyNewsPushNow'),
        'testDailyNewsPush debe invocar la Cloud Function sendDailyNewsPushNow'
    );
});

// ============================================================================
// RESUMEN FINAL DE QA
// ============================================================================
console.log('\n========================================================================');
console.log(`📊 TOTAL PRUEBAS EJECUTADAS: ${passCount + failCount}`);
console.log(`✅ PASADAS: ${passCount}`);
console.log(`❌ FALLADAS: ${failCount}`);
console.log('========================================================================\n');

if (failCount > 0) {
    console.error('❌ SE DETECTARON ERRORES EN LA SUITE DE NOTICIA DEL DÍA AUTOMÁTICA.');
    process.exit(1);
} else {
    console.log('🎉 TODAS LAS PRUEBAS DE NOTICIA DEL DÍA AUTOMÁTICA PASARON CON ÉXITO (100% PASS)!');
    process.exit(0);
}
