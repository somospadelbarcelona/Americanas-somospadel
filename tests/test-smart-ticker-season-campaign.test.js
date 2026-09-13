/**
 * test-smart-ticker-season-campaign.test.js
 * Test suite automatizado de QA para la integración reactiva de SmartTicker con SeasonCampaignService.
 */

const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');

// Helper para colores en consola
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ${GREEN}✔ PASS:${RESET} ${message}`);
        passedTests++;
    } else {
        console.error(`  ${RED}✖ FAIL:${RESET} ${message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`  ${GREEN}✔ PASS:${RESET} ${message} [Expected: ${expected}, Got: ${actual}]`);
        passedTests++;
    } else {
        console.error(`  ${RED}✖ FAIL:${RESET} ${message} [Expected: ${expected}, Got: ${actual}]`);
        failedTests++;
    }
}

console.log(`${CYAN}======================================================================${RESET}`);
console.log(`${CYAN} QA TEST SUITE: INTEGRACIÓN REACTIVA TICKER SUPERIOR & CAMPAÑA EQUIPOS ${RESET}`);
console.log(`${CYAN}======================================================================${RESET}\n`);

// -----------------------------------------------------------------------------
// TEST 1: Validación de Sintaxis de los Archivos Clave
// -----------------------------------------------------------------------------
console.log(`${YELLOW}1. Validación de Sintaxis AST de Archivos JavaScript:${RESET}`);
const filesToValidate = [
    'js/core/SmartTicker.js',
    'js/modules/teams/SeasonCampaignService.js',
    'js/modules/admin-season-campaign.js'
];

filesToValidate.forEach(relPath => {
    const fullPath = path.join(ROOT_DIR, relPath);
    try {
        const code = fs.readFileSync(fullPath, 'utf8');
        new vm.Script(code, { filename: relPath });
        assert(true, `Sintaxis válida sin errores: ${relPath}`);
    } catch (e) {
        assert(false, `Error de sintaxis en ${relPath}: ${e.message}`);
    }
});

// -----------------------------------------------------------------------------
// TEST 2: Verificación del Marcado Estático en index.html (#ticker-track)
// -----------------------------------------------------------------------------
console.log(`\n${YELLOW}2. Verificación del marcado inicial en index.html (#ticker-track):${RESET}`);
try {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    
    // Extraer bloque #ticker-track
    const trackMatch = indexHtml.match(/<div[^>]*id=["']ticker-track["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
    assert(!!trackMatch, 'Se encontró el contenedor #ticker-track en index.html');
    
    if (trackMatch) {
        const trackHtml = trackMatch[1];
        const containsEquipos2027 = trackHtml.toUpperCase().includes('EQUIPOS 2027');
        const containsTagEquipos = trackHtml.includes('tag-equipos');
        const containsEquiposLabel = trackHtml.includes('EQUIPOS') && trackHtml.includes('ticker-label-tag');

        assertEqual(containsEquipos2027, false, '#ticker-track NO contiene el tag estático "EQUIPOS 2027"');
        assertEqual(containsTagEquipos, false, '#ticker-track NO contiene la clase CSS "tag-equipos"');
        assertEqual(containsEquiposLabel, false, '#ticker-track NO tiene hardcodeada la categoría EQUIPOS en el HTML estático');
    }
} catch (e) {
    assert(false, `Error leyendo index.html: ${e.message}`);
}

// -----------------------------------------------------------------------------
// Mock Environment para ejecutar la lógica en entorno controlado
// -----------------------------------------------------------------------------
function createMockEnvironment() {
    const storage = new Map();
    const listeners = new Map();

    const mockLocalStorage = {
        getItem: (k) => storage.has(k) ? storage.get(k) : null,
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
        clear: () => storage.clear()
    };

    const mockWindow = {
        addEventListener: (event, cb) => {
            if (!listeners.has(event)) listeners.set(event, []);
            listeners.get(event).push(cb);
        },
        removeEventListener: (event, cb) => {
            if (listeners.has(event)) {
                listeners.set(event, listeners.get(event).filter(f => f !== cb));
            }
        },
        dispatchEvent: (event) => {
            const list = listeners.get(event.type) || [];
            list.forEach(cb => cb(event));
            return true;
        },
        localStorage: mockLocalStorage,
        console: console,
        document: {
            querySelector: (sel) => ({
                classList: { add: () => {}, remove: () => {} },
                querySelector: () => null,
                appendChild: () => {},
                setAttribute: () => {},
                addEventListener: () => {},
                remove: () => {}
            }),
            getElementById: (id) => ({
                id,
                innerHTML: '',
                classList: { add: () => {}, remove: () => {} },
                remove: () => {},
                setAttribute: () => {},
                appendChild: () => {}
            }),
            createElement: (tag) => ({
                tagName: tag,
                setAttribute: () => {},
                classList: { add: () => {}, remove: () => {} },
                innerHTML: '',
                appendChild: () => {},
                addEventListener: () => {},
                remove: () => {}
            }),
            head: { appendChild: () => {} },
            body: { style: {}, appendChild: () => {} },
            addEventListener: () => {},
            readyState: 'complete'
        },
        CustomEvent: class CustomEvent {
            constructor(type, params) {
                this.type = type;
                this.detail = params?.detail;
            }
        },
        requestAnimationFrame: (cb) => cb(),
        setInterval: () => 1,
        clearInterval: () => {}
    };

    const context = vm.createContext({
        window: mockWindow,
        global: mockWindow,
        document: mockWindow.document,
        localStorage: mockLocalStorage,
        CustomEvent: mockWindow.CustomEvent,
        console: {
            log: () => {},
            warn: () => {},
            error: () => {},
            info: () => {}
        },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: () => 1,
        clearInterval: () => {}
    });

    return { context, mockWindow, mockLocalStorage };
}

// -----------------------------------------------------------------------------
// TEST 3: SeasonCampaignService.isCampaignActiveSync()
// -----------------------------------------------------------------------------
console.log(`\n${YELLOW}3. Pruebas unitarias sobre SeasonCampaignService.isCampaignActiveSync():${RESET}`);
const { context: envSeason, mockLocalStorage } = createMockEnvironment();

// Cargar SeasonCampaignService.js en el sandbox
const seasonCode = fs.readFileSync(path.join(ROOT_DIR, 'js/modules/teams/SeasonCampaignService.js'), 'utf8');
vm.runInContext(seasonCode, envSeason);

const SeasonCampaignService = envSeason.window.SeasonCampaignService;
assert(!!SeasonCampaignService, 'SeasonCampaignService se instancia e inicializa correctamente');

// 3.1 Sin valor en localStorage
mockLocalStorage.clear();
assertEqual(
    SeasonCampaignService.isCampaignActiveSync(),
    false,
    'isCampaignActiveSync() devuelve false por defecto cuando la clave no existe en localStorage'
);

// 3.2 Valor 'false'
mockLocalStorage.setItem('sp_season_campaign_active', 'false');
assertEqual(
    SeasonCampaignService.isCampaignActiveSync(),
    false,
    'isCampaignActiveSync() devuelve false cuando sp_season_campaign_active es "false"'
);

// 3.3 Valor 'true'
mockLocalStorage.setItem('sp_season_campaign_active', 'true');
assertEqual(
    SeasonCampaignService.isCampaignActiveSync(),
    true,
    'isCampaignActiveSync() devuelve true cuando sp_season_campaign_active es "true"'
);

// 3.4 Valores inválidos o aleatorios
mockLocalStorage.setItem('sp_season_campaign_active', '0');
assertEqual(SeasonCampaignService.isCampaignActiveSync(), false, 'isCampaignActiveSync() devuelve false con valor "0"');

mockLocalStorage.setItem('sp_season_campaign_active', '');
assertEqual(SeasonCampaignService.isCampaignActiveSync(), false, 'isCampaignActiveSync() devuelve false con valor vacío');

// -----------------------------------------------------------------------------
// TEST 4: SmartTicker.generateMassiveContent() con campaña INACTIVA y ACTIVA
// -----------------------------------------------------------------------------
console.log(`\n${YELLOW}4. Pruebas de integración reactiva en SmartTicker.generateMassiveContent():${RESET}`);

async function runSmartTickerTests() {
    const { context: envFull, mockLocalStorage: storageFull, mockWindow } = createMockEnvironment();

    // Cargar SeasonCampaignService y SmartTicker
    vm.runInContext(seasonCode, envFull);
    const tickerCode = fs.readFileSync(path.join(ROOT_DIR, 'js/core/SmartTicker.js'), 'utf8');
    vm.runInContext(tickerCode, envFull);

    const smartTicker = envFull.window.SmartTicker;
    assert(!!smartTicker, 'SmartTicker cargado e instanciado en el entorno');

    // 4.1 Caso Campaña INACTIVA (null)
    storageFull.clear();
    let content = await smartTicker.generateMassiveContent();
    let equiposItems = content.filter(item => item.category === 'equipos');
    assertEqual(equiposItems.length, 0, 'Campaña inactiva (null): generateMassiveContent() NO genera items de categoría "equipos"');

    // 4.2 Caso Campaña INACTIVA ('false')
    storageFull.setItem('sp_season_campaign_active', 'false');
    content = await smartTicker.generateMassiveContent();
    equiposItems = content.filter(item => item.category === 'equipos');
    assertEqual(equiposItems.length, 0, 'Campaña inactiva ("false"): generateMassiveContent() NO genera items de categoría "equipos"');

    // 4.3 Caso Campaña ACTIVA ('true')
    storageFull.setItem('sp_season_campaign_active', 'true');
    content = await smartTicker.generateMassiveContent();
    equiposItems = content.filter(item => item.category === 'equipos');
    assertEqual(equiposItems.length, 1, 'Campaña activa ("true"): generateMassiveContent() genera 1 item de categoría "equipos"');

    const item = equiposItems[0];
    assertEqual(item.id, 'equipos-campaign', 'El item tiene el id "equipos-campaign"');
    assertEqual(item.label, 'EQUIPOS', 'El item tiene el badge label "EQUIPOS"');
    assertEqual(item.class, 'tag-equipos', 'El item tiene la clase "tag-equipos"');
    assertEqual(item.title, 'Inscripciones Equipos SomosPadel 2027', 'El item tiene el título esperado para Temporada 2027');
    assert(typeof item.action?.handler === 'function', 'El item contiene un action.handler ejecutable');

    // 4.4 Reactividad mediante eventos 'sp_campaign_status_changed' y SeasonCampaignService.setCampaignActive
    console.log(`\n${YELLOW}5. Prueba de Reactividad Dinámica (Cambio de Estado en Tiempo Real):${RESET}`);
    
    // Desactivamos vía setCampaignActive(false)
    await envFull.window.SeasonCampaignService.setCampaignActive(false);
    content = await smartTicker.generateMassiveContent();
    equiposItems = content.filter(item => item.category === 'equipos');
    assertEqual(equiposItems.length, 0, 'Tras setCampaignActive(false), el item de equipos desaparece inmediatamente');

    // Activamos vía setCampaignActive(true)
    await envFull.window.SeasonCampaignService.setCampaignActive(true);
    content = await smartTicker.generateMassiveContent();
    equiposItems = content.filter(item => item.category === 'equipos');
    assertEqual(equiposItems.length, 1, 'Tras setCampaignActive(true), el item de equipos aparece dinámicamente');

    // Resumen final
    console.log(`\n${CYAN}======================================================================${RESET}`);
    console.log(`${CYAN} RESUMEN DE EJECUCIÓN QA: ${RESET}`);
    console.log(`  Tests Totales: ${passedTests + failedTests}`);
    console.log(`  ${GREEN}Exitosos (PASS): ${passedTests}${RESET}`);
    if (failedTests > 0) {
        console.log(`  ${RED}Fallidos (FAIL): ${failedTests}${RESET}`);
    } else {
        console.log(`  ${GREEN}Todos los tests pasaron exitosamente al 100%.${RESET}`);
    }
    console.log(`${CYAN}======================================================================${RESET}\n`);

    if (failedTests > 0) {
        process.exit(1);
    }
}

runSmartTickerTests().catch(err => {
    console.error('Error fatal durante la ejecución de los tests:', err);
    process.exit(1);
});
