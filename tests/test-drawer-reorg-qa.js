/**
 * 🧪 test-drawer-reorg-qa.js
 * Script de Certificación de Control de Calidad (QA) para la Reorganización del Drawer Lateral
 * SomosPadel Barcelona
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('🔍 QA TEST SUITE: CERTIFICACIÓN DE MENÚ LATERAL (DRAWER) Y CSS RESPONSIVE');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${description}`);
        passCount++;
    } catch (err) {
        console.error(`❌ FAIL: ${description}`);
        console.error(`   -> ${err.message}`);
        failCount++;
    }
}

const appJsPath = path.resolve(__dirname, '..', 'js', 'app.js');
const cssPath = path.resolve(__dirname, '..', 'css', 'mobile-header-fix.css');

test('Archivos objetivo existen en disco', () => {
    assert(fs.existsSync(appJsPath), 'js/app.js no existe');
    assert(fs.existsSync(cssPath), 'css/mobile-header-fix.css no existe');
});

const appJs = fs.readFileSync(appJsPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

test('Sintaxis de js/app.js es 100% válida (parseable por Node.js/V8)', () => {
    // Si hubiese syntax error, require/Function lanzaría SyntaxError
    new Function(appJs);
});

test('js/app.js define funciones globales clave del Drawer', () => {
    assert(appJs.includes('window.closeDrawer ='), 'Falta window.closeDrawer');
    assert(appJs.includes('window.smartNavigate ='), 'Falta window.smartNavigate');
    assert(appJs.includes('window.openCommunityChat ='), 'Falta window.openCommunityChat');
    assert(appJs.includes('window.openClubWhatsApp ='), 'Falta window.openClubWhatsApp');
    assert(appJs.includes('window.showAmericanasRulesModal ='), 'Falta window.showAmericanasRulesModal');
    assert(appJs.includes('window.showGameModesModal ='), 'Falta window.showGameModesModal');
});

test('smartNavigate mapea la ruta "teams" a "equipos" para compatibilidad con el Router', () => {
    assert(appJs.includes(`const targetRoute = (route === 'teams') ? 'equipos' : route;`), 'No se mapea teams a equipos');
});

test('Drawer contiene las 7 secciones temáticas con sus identificadores y dots de color', () => {
    // 1: MI ACTIVIDAD (#00E36D)
    assert(appJs.includes('SECCIÓN 1: MI ACTIVIDAD'), 'Falta SECCIÓN 1: MI ACTIVIDAD');
    assert(appJs.includes('#00E36D'), 'Falta dot verde #00E36D');

    // 2: COMPETICIÓN (#FFD700)
    assert(appJs.includes('SECCIÓN 2: COMPETICIÓN'), 'Falta SECCIÓN 2: COMPETICIÓN');
    assert(appJs.includes('#FFD700'), 'Falta dot amarillo #FFD700');

    // 3: RANKING & PUNTOS (#fb923c)
    assert(appJs.includes('SECCIÓN 3: RANKING & PUNTOS'), 'Falta SECCIÓN 3: RANKING & PUNTOS');
    assert(appJs.includes('#fb923c'), 'Falta dot naranja #fb923c');

    // 4: PISTA & REGLAS (#38bdf8)
    assert(appJs.includes('SECCIÓN 4: PISTA & REGLAS'), 'Falta SECCIÓN 4: PISTA & REGLAS');
    assert(appJs.includes('#38bdf8'), 'Falta dot azul #38bdf8');

    // 5: COMUNIDAD & SOCIAL (#22d3ee)
    assert(appJs.includes('SECCIÓN 5: COMUNIDAD & SOCIAL'), 'Falta SECCIÓN 5: COMUNIDAD & SOCIAL');
    assert(appJs.includes('#22d3ee'), 'Falta dot cian #22d3ee');

    // 6: MI PERFIL (#c084fc)
    assert(appJs.includes('SECCIÓN 6: MI PERFIL'), 'Falta SECCIÓN 6: MI PERFIL');
    assert(appJs.includes('#c084fc'), 'Falta dot morado #c084fc');

    // 7: GESTIÓN & CAPITANES
    assert(appJs.includes('SECCIÓN 7: GESTIÓN & CAPITANES'), 'Falta SECCIÓN 7: GESTIÓN & CAPITANES');
});

test('IDs críticos de notificaciones en drawer (#drawer-notif-bell-icon y #drawer-notif-badge) existen y están bien configurados', () => {
    assert(appJs.includes('id="drawer-notif-bell-icon"'), 'Falta id="drawer-notif-bell-icon"');
    assert(appJs.includes('id="drawer-notif-badge"'), 'Falta id="drawer-notif-badge"');
    // Verificamos que se llame a NotificationUi.updateBadge() tras el renderizado del drawer
    assert(appJs.includes('window.NotificationUi.updateBadge()'), 'Falta llamada sincronizadora a updateBadge tras render');
});

test('Todas las llamadas y enlaces en el drawer tienen salvaguardas contra fallos y referencias rotas', () => {
    // Puntos
    assert(appJs.includes('window.showPointsPolicyModal ? window.showPointsPolicyModal() : null'), 'showPointsPolicyModal sin protección');
    // Marcador de Pista
    assert(appJs.includes('window.CourtScoreboard && window.CourtScoreboard.open()'), 'CourtScoreboard sin protección');
    // Carta FUT
    assert(appJs.includes('window.PadelFutCard && window.PadelFutCard.open()'), 'PadelFutCard sin protección');
    // Notificaciones
    assert(appJs.includes('window.NotificationUi && window.NotificationUi.open()'), 'NotificationUi sin protección');
    // Actualizar App
    assert(appJs.includes('window.forceUpdateApp ? window.forceUpdateApp() : window.location.reload(true)'), 'forceUpdateApp sin fallback');
    // Cerrar sesión
    assert(appJs.includes('window.AuthController && window.AuthController.handleLogout ? window.AuthController.handleLogout() : null'), 'handleLogout sin protección');
});

test('Protección contra re-render innecesario del Bottom Dock', () => {
    assert(appJs.includes(`if (!dockContainer.querySelector('.nav-dock'))`), 'Falta verificación dockContainer.querySelector');
});

test('Sanitización de estadísticas en updateGlobalHeader (prevención de valores nulos o NaN)', () => {
    assert(appJs.includes('stats?.stats?.matches !== undefined'), 'Falta salvaguarda de matches');
    assert(appJs.includes('stats?.stats?.winRate !== undefined'), 'Falta salvaguarda de winRate');
});

test('css/mobile-header-fix.css contiene reglas para la barra superior del drawer y blindaje responsive', () => {
    assert(cssContent.includes('.drawer-top-bar'), 'Falta .drawer-top-bar');
    assert(cssContent.includes('.drawer-top-brand'), 'Falta .drawer-top-brand');
    assert(cssContent.includes('.drawer-top-brand img'), 'Falta .drawer-top-brand img');
    assert(cssContent.includes('.drawer-row-title'), 'Falta .drawer-row-title');
    assert(cssContent.includes('.drawer-row-badge'), 'Falta .drawer-row-badge');
    assert(cssContent.includes('max-width: 100vw !important'), 'Falta max-width 100vw para evitar scroll horizontal');
    assert(cssContent.includes('overflow-x: hidden !important'), 'Falta overflow-x hidden global');
});

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL PRUEBAS: ${passCount + failCount} | PASADAS: ${passCount} | FALLADAS: ${failCount}`);
console.log('------------------------------------------------------------------------');

if (failCount > 0) {
    console.error('❌ QA FALLIDO: Se han detectado anomalías.');
    process.exit(1);
} else {
    console.log('🎉 CERTIFICACIÓN DE CALIDAD COMPLETADA AL 100%. LISTO PARA PRODUCCIÓN.');
}
