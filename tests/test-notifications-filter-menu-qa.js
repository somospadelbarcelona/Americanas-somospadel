/**
 * test-notifications-filter-menu-qa.js
 * Test suite to validate:
 * 1. Filter buttons order: 1. Todas, 2. Chat, 3. Avisos Club, 4. Entrenos, 5. Americanas
 * 2. Dynamic badges for each filter category
 * 3. Smooth scroll setup and drag-to-scroll / wheel listeners
 * 4. CSS rules for visible, elegant scrollbar and pill chips
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
console.log('🧪 VERIFICACIÓN QA: MENÚ DE FILTROS Y SCROLL EN NOTIFICACIONES');
console.log('========================================================================\n');

// 1. Leer NotificationUi.js
const notifUiPath = path.join(__dirname, '..', 'js', 'modules', 'ui', 'NotificationUi.js');
const notifUiCode = fs.readFileSync(notifUiPath, 'utf8');

// Test 1: Verificar el orden exacto de los botones en el HTML
const expectedFilters = ['all', 'chat', 'broadcast', 'entrenos', 'matches'];
const filterMatches = [...notifUiCode.matchAll(/data-filter=["']([^"']+)["']/g)].map(m => m[1]);

console.log('Filtros detectados en NotificationUi.js:', filterMatches);

assert(
    JSON.stringify(filterMatches) === JSON.stringify(expectedFilters),
    `El orden de los filtros debe ser exactamente [${expectedFilters.join(', ')}]. Obtenido: [${filterMatches.join(', ')}]`
);

// Test 2: Verificar badges numéricos
expectedFilters.forEach(f => {
    assert(
        notifUiCode.includes(`id="tab-count-${f}"`),
        `Debe existir el badge numérico con id="tab-count-${f}"`
    );
});

// Test 3: Verificar método _initFilterBarScroll
assert(
    notifUiCode.includes('_initFilterBarScroll()'),
    'Debe existir el método _initFilterBarScroll() para inicializar el scroll'
);

// Test 4: Verificar soporte para wheel event horizontal
assert(
    notifUiCode.includes("addEventListener('wheel'"),
    'Debe tener listener de rueda (wheel) para desplazamiento horizontal'
);

// Test 5: Verificar soporte drag to scroll
assert(
    notifUiCode.includes("addEventListener('mousedown'") && notifUiCode.includes("addEventListener('mousemove'"),
    'Debe tener listeners de mousedown y mousemove para drag-to-scroll'
);

// Test 6: Verificar _updateFilterCounts
assert(
    notifUiCode.includes('_updateFilterCounts('),
    'Debe existir _updateFilterCounts para actualizar badges en tiempo real'
);

// Test 7: Verificar scrollIntoView al seleccionar filtro
assert(
    notifUiCode.includes('scrollIntoView'),
    'setFilter debe ejecutar scrollIntoView para centrar el chip activo'
);

// Test 8: Verificar CSS en notifications.css
const cssPath = path.join(__dirname, '..', 'css', 'notifications.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

assert(
    cssCode.includes('.notif-filter-wrapper'),
    'css/notifications.css debe definir .notif-filter-wrapper'
);

assert(
    cssCode.includes('scrollbar-width: thin;'),
    'css/notifications.css debe habilitar scrollbar fino'
);

assert(
    cssCode.includes('.notif-filter-tabs-bar::-webkit-scrollbar'),
    'css/notifications.css debe estilizar .notif-filter-tabs-bar::-webkit-scrollbar'
);

assert(
    !cssCode.includes('.notif-filter-tabs-bar::-webkit-scrollbar {\n    display: none;'),
    'css/notifications.css NO debe tener el scrollbar oculto con display: none'
);

assert(
    cssCode.includes('.notif-tab-badge'),
    'css/notifications.css debe definir estilos para .notif-tab-badge'
);

console.log(`\n========================================================================`);
console.log(`📊 RESULTADO QA: ${passed} pruebas pasadas, ${failed} fallidas.`);
console.log(`========================================================================\n`);

if (failed > 0) {
    process.exit(1);
}
