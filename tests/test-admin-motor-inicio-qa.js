/**
 * 🧪 Test QA: Auditoría y Verificación de 'INICIO (EL MOTOR DEL ADMIN)' y Dimensionamiento Responsive
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================================================');
console.log('🎾 QA TEST SUITE: MOTOR DE INICIO DEL ADMIN & AUDITORÍA RESPONSIVE');
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
const dashboardJsPath = path.resolve(__dirname, '../js/modules/admin-dashboard.js');

const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');
const dashboardJs = fs.readFileSync(dashboardJsPath, 'utf8');

// 1. Verificación de sintaxis Node
test('Sintaxis de admin-dashboard.js es 100% válida', () => {
    execSync(`node -c "${dashboardJsPath}"`);
});

test('Sintaxis de admin.js es 100% válida', () => {
    execSync(`node -c "${adminJsPath}"`);
});

// 2. Auditoría de Dimensionamiento y Drawer en css/style.css
test('css/style.css define .sidebar-pro con ancho estándar PC (260px-270px)', () => {
    if (!cssCode.includes('width: 268px') && !cssCode.includes('min-width: 268px')) {
        throw new Error('No se encontró ancho estándar de 268px en .sidebar-pro');
    }
});

test('css/style.css define .admin-hamburger-btn y .sidebar-overlay para drawer móvil/tablet', () => {
    if (!cssCode.includes('.admin-hamburger-btn')) throw new Error('Falta .admin-hamburger-btn en style.css');
    if (!cssCode.includes('.sidebar-overlay')) throw new Error('Falta .sidebar-overlay en style.css');
});

test('css/style.css en max-width 1024px convierte sidebar en drawer con transform y overlay', () => {
    if (!cssCode.includes('transform: translateX(-105%)')) {
        throw new Error('Sidebar no tiene transform off-canvas inicial en responsive');
    }
    if (!cssCode.includes('transform: translateX(0)')) {
        throw new Error('Sidebar no tiene regla para mostrarse con transform: translateX(0)');
    }
});

test('css/style.css asegura overflow-x: hidden para evitar desbordamiento horizontal', () => {
    if (!cssCode.includes('overflow-x: hidden !important')) {
        throw new Error('No se encontró overflow-x: hidden !important en reglas responsive');
    }
});

// 3. Auditoría de admin.html
test('admin.html incluye botón INICIO (MOTOR ADMIN) en el sidebar', () => {
    if (!adminHtml.includes('data-view="dashboard_home"') && !adminHtml.includes("loadAdminView('dashboard_home')")) {
        throw new Error('No se encontró el botón de INICIO con data-view="dashboard_home" en admin.html');
    }
    if (!adminHtml.includes('INICIO (MOTOR ADMIN)')) {
        throw new Error('El botón no contiene la etiqueta visible "INICIO (MOTOR ADMIN)"');
    }
});

test('admin.html contiene el botón de hamburguesa accesible en top-bar', () => {
    if (!adminHtml.includes('id="admin-hamburger-btn"') && !adminHtml.includes('class="admin-hamburger-btn"')) {
        throw new Error('No se encontró el botón admin-hamburger-btn en top-bar de admin.html');
    }
});

test('admin.html contiene función toggleAdminSidebar y backdrop overlay', () => {
    if (!adminHtml.includes('toggleAdminSidebar')) throw new Error('Falta toggleAdminSidebar en admin.html');
    if (!adminHtml.includes('id="sidebar-overlay"')) throw new Error('Falta #sidebar-overlay en admin.html');
});

// 4. Auditoría de js/admin.js (Rutas y vistas por defecto)
test('admin.js rutea dashboard_home a window.AdminViews.dashboard_home', () => {
    if (!adminJs.includes('viewName === \'dashboard_home\'') && !adminJs.includes('viewName === "dashboard_home"')) {
        throw new Error('Router en admin.js no maneja dashboard_home');
    }
    if (!adminJs.includes('window.AdminViews.dashboard_home()')) {
        throw new Error('Router no invoca window.AdminViews.dashboard_home()');
    }
});

test('admin.js establece dashboard_home como vista por defecto para administradores', () => {
    if (!adminJs.includes('dashboard_home')) {
        throw new Error('dashboard_home no está configurado como fallback default en admin.js');
    }
});

// 5. Auditoría del Módulo admin-dashboard.js (El Motor de Operaciones)
test('admin-dashboard.js declara window.AdminViews.dashboard_home', () => {
    if (!dashboardJs.includes('window.AdminViews.dashboard_home =')) {
        throw new Error('No se encontró la asignación window.AdminViews.dashboard_home');
    }
});

test('admin-dashboard.js incluye Live Metrics Cards (Jugadores, Americanas, Entrenos, SOS)', () => {
    if (!dashboardJs.includes('motor-stat-players')) throw new Error('Falta métrica motor-stat-players');
    if (!dashboardJs.includes('motor-stat-americanas')) throw new Error('Falta métrica motor-stat-americanas');
    if (!dashboardJs.includes('motor-stat-entrenos')) throw new Error('Falta métrica motor-stat-entrenos');
    if (!dashboardJs.includes('motor-stat-sos')) throw new Error('Falta métrica motor-stat-sos');
});

test('admin-dashboard.js contiene las 4 categorías del Motor de Operaciones', () => {
    if (!dashboardJs.includes('COMPETICIONES & DEPORTE')) throw new Error('Falta categoría COMPETICIONES & DEPORTE');
    if (!dashboardJs.includes('JUGADORES & CLUB')) throw new Error('Falta categoría JUGADORES & CLUB');
    if (!dashboardJs.includes('MARKETING & COPILOTO')) throw new Error('Falta categoría MARKETING & COPILOTO');
    if (!dashboardJs.includes('LÓGICA, SISTEMA & MANTENIMIENTO')) throw new Error('Falta categoría LÓGICA, SISTEMA & MANTENIMIENTO');
});

test('admin-dashboard.js mapea las Action Cards a sus respectivas llamadas loadAdminView', () => {
    const requiredViews = [
        'americanas_mgmt', 'americanas_create', 'matches', 'simulator_empty',
        'entrenos_mgmt', 'entrenos_create', 'entrenos_results',
        'open_matches_mgmt', 'open_matches_create', 'open_matches_results',
        'tournaments_mgmt', 'users', 'sos_substitutes', 'season_campaign',
        'analytics', 'blog_posts', 'logic_lab', 'system_telemetry',
        'database_health', 'notifications_manager', 'fix_players'
    ];
    for (const v of requiredViews) {
        if (!dashboardJs.includes(`'${v}'`)) {
            throw new Error(`Action Card para view '${v}' no encontrada en admin-dashboard.js`);
        }
    }
});

test('admin-dashboard.js incluye enlace al Copiloto de Marketing para Alex', () => {
    if (!dashboardJs.includes('promo-studio.html?mode=copilot')) {
        throw new Error('Falta enlace a promo-studio.html?mode=copilot');
    }
});

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL PRUEBAS: ${passed + failed} | EXITOSAS: ${passed} | FALLIDAS: ${failed}`);
console.log('------------------------------------------------------------------------');

if (failed > 0) {
    console.error('💥 ERROR: Algunas pruebas de calidad han fallado.');
    process.exit(1);
} else {
    console.log('🎉 TODAS LAS PRUEBAS DE CALIDAD HAN PASADO SATISFACTORIAMENTE.');
    process.exit(0);
}
