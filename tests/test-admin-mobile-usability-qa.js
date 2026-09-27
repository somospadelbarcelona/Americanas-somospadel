/**
 * 🧪 Test QA: Usabilidad Móvil del Admin (Drawer Off-Canvas, Quick Subnav Superior y Ancho Completo)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================================================');
console.log('📱 QA TEST SUITE: USABILIDAD MÓVIL DEL PANEL ADMIN (DRAWER & QUICK NAV)');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ❌ [FAIL] ${name}\n     -> ${err.message}`);
    }
}

const adminHtmlPath = path.resolve(__dirname, '../admin.html');
const cssPath = path.resolve(__dirname, '../css/style.css');
const adminJsPath = path.resolve(__dirname, '../js/admin.js');

const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');

// 1. Verificación de sintaxis Node
test('Sintaxis de admin.js es 100% válida', () => {
    execSync(`node -c "${adminJsPath}"`);
});

// 2. Elementos DOM de usabilidad móvil en admin.html
test('admin.html incluye la barra horizontal superior móvil (.admin-mobile-subnav)', () => {
    if (!adminHtml.includes('id="admin-mobile-subnav"') || !adminHtml.includes('class="admin-mobile-subnav"')) {
        throw new Error('Falta el elemento nav #admin-mobile-subnav en admin.html');
    }
    if (!adminHtml.includes('id="mobile-subnav-container"')) {
        throw new Error('Falta el contenedor #mobile-subnav-container en admin.html');
    }
});

test('admin.html define y enlaza la función ensureSidebarClosedOnMobile', () => {
    if (!adminHtml.includes('ensureSidebarClosedOnMobile')) {
        throw new Error('No se encontró la función ensureSidebarClosedOnMobile en admin.html');
    }
});

test('admin.html define el catálogo continuo ADMIN_ALL_MOBILE_SUBNAV con ENTRENOS como primera opción', () => {
    if (!adminHtml.includes('ADMIN_ALL_MOBILE_SUBNAV') || !adminHtml.includes('updateMobileSubnav')) {
        throw new Error('Falta ADMIN_ALL_MOBILE_SUBNAV o updateMobileSubnav en admin.html');
    }
    // Verificar que entrenos_mgmt está definido como primer elemento
    const match = adminHtml.match(/ADMIN_ALL_MOBILE_SUBNAV\s*=\s*\[\s*(?:\/\/[^\n]*\s*)*\{\s*view:\s*['"]([^'"]+)['"]/);
    if (!match || match[1] !== 'entrenos_mgmt') {
        throw new Error(`El primer elemento de ADMIN_ALL_MOBILE_SUBNAV debe ser 'entrenos_mgmt' pero se encontró: ${match ? match[1] : 'ninguno'}`);
    }
});

// 3. Reglas CSS en css/style.css
test('css/style.css define .admin-mobile-subnav con scrollbar visible y chips táctiles', () => {
    if (!cssCode.includes('.admin-mobile-subnav')) {
        throw new Error('Falta .admin-mobile-subnav en css/style.css');
    }
    if (!cssCode.includes('.mobile-subnav-container')) {
        throw new Error('Falta .mobile-subnav-container en css/style.css');
    }
    if (!cssCode.includes('.subnav-chip')) {
        throw new Error('Falta .subnav-chip en css/style.css');
    }
    if (!cssCode.includes('scrollbar-color: #ccff00')) {
        throw new Error('Falta scrollbar-color: #ccff00 para scrollbar neón visible en móvil');
    }
});

test('css/style.css y admin.html aseguran que el sidebar está fuera de pantalla por defecto (transform: translateX(-105%))', () => {
    if (!cssCode.includes('transform: translateX(-105%) !important')) {
        throw new Error('Falta transform: translateX(-105%) !important en css/style.css');
    }
    if (!adminHtml.includes('transform: translateX(-105%) !important')) {
        throw new Error('Falta transform: translateX(-105%) !important en admin.html');
    }
});

test('css/style.css y admin.html aseguran que el sidebar solo entra con .open o .active con z-index 9999', () => {
    if (!cssCode.includes('z-index: 9999 !important')) {
        throw new Error('Falta z-index: 9999 !important en css/style.css');
    }
    if (!adminHtml.includes('z-index: 9999 !important')) {
        throw new Error('Falta z-index: 9999 !important en admin.html');
    }
});

test('css/style.css y admin.html aseguran que .main-wrapper y .workspace-area ocupan width 100% y max-width 100vw en móvil', () => {
    if (!cssCode.includes('max-width: 100vw !important')) {
        throw new Error('Falta max-width: 100vw !important en css/style.css');
    }
    if (!adminHtml.includes('max-width: 100vw !important')) {
        throw new Error('Falta max-width: 100vw !important en admin.html');
    }
});

test('css/style.css y admin.html limpian el top-bar en móvil ocultando force-refresh, telemetría y AI', () => {
    if (!cssCode.includes('#force-refresh-btn') || !cssCode.includes('#admin-telemetry-trigger')) {
        throw new Error('Falta regla de ocultación de force-refresh y telemetría en css/style.css');
    }
    if (!adminHtml.includes('#force-refresh-btn') || !adminHtml.includes('#admin-telemetry-trigger')) {
        throw new Error('Falta regla de ocultación de force-refresh y telemetría en admin.html');
    }
});

test('css/style.css y admin.html adaptan .dashboard-header-pro y tabs de resultados a 1 columna en móvil', () => {
    if (!cssCode.includes('.dashboard-header-pro') || !cssCode.includes('grid-template-columns: 1fr !important')) {
        throw new Error('Falta adaptación responsive para .dashboard-header-pro en css/style.css');
    }
    if (!adminHtml.includes('.dashboard-header-pro') || !adminHtml.includes('grid-template-columns: 1fr !important')) {
        throw new Error('Falta adaptación responsive para .dashboard-header-pro en admin.html');
    }
});

// 4. Integración en js/admin.js
test('js/admin.js invoca window.updateMobileSubnav en loadAdminView', () => {
    if (!adminJs.includes('window.updateMobileSubnav(viewName)')) {
        throw new Error('loadAdminView en js/admin.js no invoca window.updateMobileSubnav(viewName)');
    }
});

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL PRUEBAS MÓVILES: ${passed + failed} | EXITOSAS: ${passed} | FALLIDAS: ${failed}`);
console.log('------------------------------------------------------------------------');
if (failed === 0) {
    console.log('🎉 TODAS LAS PRUEBAS DE USABILIDAD MÓVIL HAN PASADO EXITOSAMENTE.\n');
} else {
    process.exit(1);
}
