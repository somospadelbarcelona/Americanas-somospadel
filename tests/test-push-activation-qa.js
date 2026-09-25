/**
 * Automated QA Suite: Push Notification Activation & Discovery System
 * 
 * Validates:
 * 1. NotificationUi.js:
 *    - Implements testPushAlert()
 *    - Reads/handles somospadel_push_enabled
 *    - Renders the "Probar aviso" button with .notif-perm-test-btn
 * 2. NotificationService.js:
 *    - Implements savePushSubscriptionStatus()
 *    - Implements sendWelcomeNotification()
 *    - Dispatches sp_push_permission_changed CustomEvent
 * 3. DashboardView_hotfix.js:
 *    - Contains #push-notification-promo-banner-root in the DOM template
 *    - Implements renderPushDiscoveryBanner()
 *    - Implements showPushNotificationPopup()
 *    - Implements checkAndShowPushPopup()
 * 4. NewsCatalog.js:
 *    - Contains article with id 'app-noticia-notificaciones-push-movil'
 * 5. css/notifications.css:
 *    - Contains .notif-perm-test-btn
 *    - Contains banner styles (.sp-push-discovery-banner)
 *    - Contains popup styles (.sp-push-popup-overlay, .sp-push-popup-modal)
 * 6. Syntax and reference integrity check across all modified files.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const results = [];

async function test(name, fn) {
    try {
        const res = fn();
        if (res && typeof res.then === 'function') {
            await res;
        }
        results.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (err) {
        results.push({ name, status: 'FAIL', error: err.message });
        console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
    }
}

(async function runAllTests() {
    console.log('========================================================================');
    console.log('🧪 BATERÍA QA: ACTIVACIÓN Y PROMOCIÓN DE NOTIFICACIONES PUSH SOMOSPADEL');
    console.log('========================================================================\n');

    // -----------------------------------------------------------------------------
    // 1. Sintaxis de los archivos involucrados
    // -----------------------------------------------------------------------------
    await test('Sintaxis JavaScript: js/modules/ui/NotificationUi.js', () => {
        execSync('node -c js/modules/ui/NotificationUi.js');
    });

    await test('Sintaxis JavaScript: js/modules/common/NotificationService.js', () => {
        execSync('node -c js/modules/common/NotificationService.js');
    });

    await test('Sintaxis JavaScript: js/modules/dashboard/DashboardView_hotfix.js', () => {
        execSync('node -c js/modules/dashboard/DashboardView_hotfix.js');
    });

    await test('Sintaxis JavaScript: js/modules/dashboard/NewsCatalog.js', () => {
        execSync('node -c js/modules/dashboard/NewsCatalog.js');
    });

    // -----------------------------------------------------------------------------
    // 2. NotificationUi.js
    // -----------------------------------------------------------------------------
    const notifUiCode = fs.readFileSync('js/modules/ui/NotificationUi.js', 'utf8');

    await test('NotificationUi.js contiene el método testPushAlert', () => {
        if (!notifUiCode.includes('testPushAlert')) {
            throw new Error('NotificationUi.js no contiene el método testPushAlert');
        }
        if (!/testPushAlert\s*\(/.test(notifUiCode)) {
            throw new Error('testPushAlert no está declarado como función o método');
        }
    });

    await test('NotificationUi.js maneja la clave de persistencia somospadel_push_enabled', () => {
        if (!notifUiCode.includes('somospadel_push_enabled')) {
            throw new Error('NotificationUi.js no maneja somospadel_push_enabled en localStorage');
        }
    });

    await test('NotificationUi.js contiene y renderiza el botón de probar aviso con clase notif-perm-test-btn', () => {
        if (!notifUiCode.includes('notif-perm-test-btn')) {
            throw new Error('NotificationUi.js no incluye la clase notif-perm-test-btn para el botón');
        }
        if (!notifUiCode.includes('NotificationUi.testPushAlert()')) {
            throw new Error('El botón no enlaza a window.NotificationUi.testPushAlert()');
        }
    });

    await test('NotificationUi.js prueba funcional: testPushAlert ejecuta correctamente', async () => {
        let playedSound = false;
        let toastSent = false;
        let welcomeSent = false;

        const mockStorage = {
            'somospadel_push_enabled': 'true'
        };

        const sandbox = {
            window: {
                addEventListener: () => {},
                NotificationService: {
                    unreadCount: 0,
                    onUpdate: () => {},
                    sendWelcomeNotification: async () => { welcomeSent = true; },
                    showInAppToast: () => { toastSent = true; }
                },
                localStorage: {
                    getItem: (k) => mockStorage[k] || null,
                    setItem: (k, v) => { mockStorage[k] = v; }
                }
            },
            document: {
                getElementById: () => null,
                addEventListener: () => {}
            },
            localStorage: {
                getItem: (k) => mockStorage[k] || null,
                setItem: (k, v) => { mockStorage[k] = v; }
            },
            Notification: {
                permission: 'granted'
            },
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout
        };

        vm.createContext(sandbox);
        vm.runInContext(notifUiCode, sandbox);

        const ui = sandbox.window.NotificationUi;
        if (!ui) throw new Error('NotificationUi no disponible en window');

        ui.playNotificationSound = () => { playedSound = true; };
        await ui.testPushAlert();

        if (!playedSound) throw new Error('testPushAlert no ejecutó playNotificationSound');
        if (!toastSent) throw new Error('testPushAlert no disparó toast informativo');
        if (!welcomeSent) throw new Error('testPushAlert no disparó sendWelcomeNotification');
    });

    // -----------------------------------------------------------------------------
    // 3. NotificationService.js
    // -----------------------------------------------------------------------------
    const notifServiceCode = fs.readFileSync('js/modules/common/NotificationService.js', 'utf8');

    await test('NotificationService.js contiene savePushSubscriptionStatus', () => {
        if (!notifServiceCode.includes('savePushSubscriptionStatus')) {
            throw new Error('NotificationService.js no contiene savePushSubscriptionStatus');
        }
        if (!/async\s+savePushSubscriptionStatus\s*\(/.test(notifServiceCode)) {
            throw new Error('savePushSubscriptionStatus no está declarado como async method');
        }
    });

    await test('NotificationService.js contiene sendWelcomeNotification', () => {
        if (!notifServiceCode.includes('sendWelcomeNotification')) {
            throw new Error('NotificationService.js no contiene sendWelcomeNotification');
        }
        if (!/async\s+sendWelcomeNotification\s*\(/.test(notifServiceCode)) {
            throw new Error('sendWelcomeNotification no está declarado como async method');
        }
    });

    await test('NotificationService.js emite el evento global sp_push_permission_changed', () => {
        if (!notifServiceCode.includes('sp_push_permission_changed')) {
            throw new Error('NotificationService.js no despacha el evento sp_push_permission_changed');
        }
        const count = (notifServiceCode.match(/sp_push_permission_changed/g) || []).length;
        if (count < 2) {
            throw new Error(`sp_push_permission_changed esperado en flujos concedido/denegado, encontrado ${count} veces`);
        }
    });

    // -----------------------------------------------------------------------------
    // 4. DashboardView_hotfix.js
    // -----------------------------------------------------------------------------
    const dashboardCode = fs.readFileSync('js/modules/dashboard/DashboardView_hotfix.js', 'utf8');

    await test('DashboardView_hotfix.js contiene push-notification-promo-banner-root', () => {
        if (!dashboardCode.includes('push-notification-promo-banner-root')) {
            throw new Error('DashboardView_hotfix.js no contiene el id push-notification-promo-banner-root');
        }
    });

    await test('DashboardView_hotfix.js contiene el método renderPushDiscoveryBanner', () => {
        if (!dashboardCode.includes('renderPushDiscoveryBanner')) {
            throw new Error('DashboardView_hotfix.js no contiene renderPushDiscoveryBanner');
        }
        if (!/renderPushDiscoveryBanner\s*\(/.test(dashboardCode)) {
            throw new Error('renderPushDiscoveryBanner no está declarado como método');
        }
    });

    await test('DashboardView_hotfix.js contiene el método showPushNotificationPopup', () => {
        if (!dashboardCode.includes('showPushNotificationPopup')) {
            throw new Error('DashboardView_hotfix.js no contiene showPushNotificationPopup');
        }
        if (!/showPushNotificationPopup\s*\(/.test(dashboardCode)) {
            throw new Error('showPushNotificationPopup no está declarado como método');
        }
    });

    await test('DashboardView_hotfix.js contiene el método checkAndShowPushPopup', () => {
        if (!dashboardCode.includes('checkAndShowPushPopup')) {
            throw new Error('DashboardView_hotfix.js no contiene checkAndShowPushPopup');
        }
        if (!/checkAndShowPushPopup\s*\(/.test(dashboardCode)) {
            throw new Error('checkAndShowPushPopup no está declarado como método');
        }
    });

    await test('DashboardView_hotfix.js integra listeners para sp_push_permission_changed', () => {
        if (!dashboardCode.includes("addEventListener('sp_push_permission_changed'")) {
            throw new Error('DashboardView_hotfix.js no escucha sp_push_permission_changed para reactividad');
        }
    });

    // -----------------------------------------------------------------------------
    // 5. NewsCatalog.js
    // -----------------------------------------------------------------------------
    const newsCode = fs.readFileSync('js/modules/dashboard/NewsCatalog.js', 'utf8');

    await test('NewsCatalog.js contiene el artículo app-noticia-notificaciones-push-movil', () => {
        if (!newsCode.includes('app-noticia-notificaciones-push-movil')) {
            throw new Error('NewsCatalog.js no contiene el artículo app-noticia-notificaciones-push-movil');
        }
    });

    await test('NewsCatalog.js carga y valida estructura del artículo de Notificaciones Push', () => {
        const sandbox = {
            window: {}
        };
        vm.createContext(sandbox);
        vm.runInContext(newsCode, sandbox);

        const catalog = sandbox.window.NewsCatalog;
        if (!catalog || !Array.isArray(catalog.articles)) {
            throw new Error('NewsCatalog.articles no es un array exportado en window');
        }

        const article = catalog.articles.find(a => a.id === 'app-noticia-notificaciones-push-movil');
        if (!article) {
            throw new Error('Artículo app-noticia-notificaciones-push-movil no encontrado en catalog.articles');
        }
        if (!article.title || !article.title.includes('Notificaciones Push')) {
            throw new Error(`Título inválido del artículo: ${article.title}`);
        }
        if (!article.snippet || article.snippet.length < 20) {
            throw new Error('Snippet del artículo incompleto');
        }
        if (!article.contentTemplate || !article.contentTemplate.includes('PROBAR AVISO')) {
            throw new Error('El artículo no incluye instrucciones del botón PROBAR AVISO');
        }
    });

    // -----------------------------------------------------------------------------
    // 6. css/notifications.css
    // -----------------------------------------------------------------------------
    const notifCss = fs.readFileSync('css/notifications.css', 'utf8');

    await test('css/notifications.css contiene la clase de estilo .notif-perm-test-btn', () => {
        if (!notifCss.includes('.notif-perm-test-btn')) {
            throw new Error('css/notifications.css no contiene la regla .notif-perm-test-btn');
        }
    });

    await test('css/notifications.css contiene estilos para el banner promocional (.sp-push-discovery-banner)', () => {
        if (!notifCss.includes('.sp-push-discovery-banner')) {
            throw new Error('css/notifications.css no contiene .sp-push-discovery-banner');
        }
        if (!notifCss.includes('.sp-push-banner-glow')) {
            throw new Error('css/notifications.css no contiene .sp-push-banner-glow');
        }
    });

    await test('css/notifications.css contiene estilos para el popup modal (.sp-push-popup-overlay, .sp-push-popup-modal)', () => {
        if (!notifCss.includes('.sp-push-popup-overlay')) {
            throw new Error('css/notifications.css no contiene .sp-push-popup-overlay');
        }
        if (!notifCss.includes('.sp-push-popup-modal')) {
            throw new Error('css/notifications.css no contiene .sp-push-popup-modal');
        }
    });

    // -----------------------------------------------------------------------------
    // 7. Verificación de referencias cruzadas entre módulos
    // -----------------------------------------------------------------------------
    await test('index.html incluye css/notifications.css', () => {
        const indexHtml = fs.readFileSync('index.html', 'utf8');
        if (!indexHtml.includes('css/notifications.css')) {
            throw new Error('index.html no incluye css/notifications.css en el head');
        }
    });

    await test('index.html incluye js/modules/dashboard/NewsCatalog.js', () => {
        const indexHtml = fs.readFileSync('index.html', 'utf8');
        if (!indexHtml.includes('js/modules/dashboard/NewsCatalog.js')) {
            throw new Error('index.html no carga js/modules/dashboard/NewsCatalog.js');
        }
    });

    await test('index.html incluye js/modules/dashboard/DashboardView_hotfix.js', () => {
        const indexHtml = fs.readFileSync('index.html', 'utf8');
        if (!indexHtml.includes('js/modules/dashboard/DashboardView_hotfix.js')) {
            throw new Error('index.html no carga js/modules/dashboard/DashboardView_hotfix.js');
        }
    });

    // -----------------------------------------------------------------------------
    // Resumen
    // -----------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 TOTAL PRUEBAS COMPLEMENTARIAS: ${results.length}`);
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLADAS: ${failed}`);
    console.log('========================================================================');

    if (failed > 0) {
        process.exit(1);
    }
})();
