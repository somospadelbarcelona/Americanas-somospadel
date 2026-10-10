/**
 * test-dashboard-redesign-qa.js
 * 
 * Batería de Pruebas de Calidad (QA) para el Rediseño de la Sección INICIO:
 * 1. Verificación sintáctica estricta de DashboardView.js y DashboardView_hotfix.js (node -c).
 * 2. Comprobación de existencia de todos los assets gráficos e imágenes reales.
 * 3. Verificación de diseño:
 *    - Fondo blanco (#ffffff)
 *    - Tipografía oscura (#111827 / #0f172a)
 *    - 4 accesos rápidos circulares estilo Playtomic (Americanas, Entrenos, Ranking, Mi Equipo)
 *    - Carruseles swipe táctiles (Americanas, Entrenos)
 *    - Slots interactivos con avatares y huecos libres '+'
 * 4. Verificación de integridad de rutas de navegación:
 *    - 'americanas', 'entrenos', 'ranking', 'my_team'.
 * 5. Consistencia entre DashboardView.js y DashboardView_hotfix.js.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${description}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${description}\n     -> ${err.message}`);
        failed++;
    }
}

console.log("================================================================================");
console.log(" 🧪 AUDITORÍA QA: REDISEÑO DE SECCIÓN INICIO (PLAYTOMIC / PÁDEL INDOOR HOSPITALET)");
console.log("================================================================================\n");

const dashboardViewPath = path.resolve(__dirname, '../js/modules/dashboard/DashboardView.js');
const hotfixViewPath = path.resolve(__dirname, '../js/modules/dashboard/DashboardView_hotfix.js');
const routerPath = path.resolve(__dirname, '../js/core/Router.js');

// 1. SINTAXIS
console.log("▶️ FASE 1: Verificación de sintaxis de código");
test("DashboardView.js compila sin errores sintácticos (node -c)", () => {
    execSync(`node -c "${dashboardViewPath}"`);
});

test("DashboardView_hotfix.js compila sin errores sintácticos (node -c)", () => {
    execSync(`node -c "${hotfixViewPath}"`);
});

test("Router.js compila sin errores sintácticos (node -c)", () => {
    execSync(`node -c "${routerPath}"`);
});

// 2. EXISTENCIA DE IMÁGENES REALES
console.log("\n▶️ FASE 2: Verificación de existencia de assets e imágenes reales");
const requiredImages = [
    'img/cem_tennis_hospitalet.png',
    'img/americana-pro.png',
    'img/americana-night.png',
    'img/americana-mixed.png',
    'img/americana mixta.jpg',
    'img/americana femeninas.jpg',
    'img/entreno masculino prat.jpg',
    'img/entreno mixto prat.jpg'
];

requiredImages.forEach(imgPath => {
    test(`Asset físico existe en el proyecto: ${imgPath}`, () => {
        const fullPath = path.resolve(__dirname, '..', imgPath);
        assert(fs.existsSync(fullPath), `El archivo de imagen no existe: ${imgPath}`);
    });
});

// 3. REQUISITOS DE DISEÑO Y COLOR
console.log("\n▶️ FASE 3: Validación de Requisitos UI/UX (Fondo blanco, tipografía, estilo Playtomic)");
const codeDashboard = fs.readFileSync(dashboardViewPath, 'utf8');
const codeHotfix = fs.readFileSync(hotfixViewPath, 'utf8');

[
    { name: 'DashboardView.js', code: codeDashboard },
    { name: 'DashboardView_hotfix.js', code: codeHotfix }
].forEach(({ name, code }) => {
    test(`[${name}] Fondo blanco (#ffffff) establecido como base en contenedor y bloques`, () => {
        assert(code.includes('background: #ffffff !important'), "Falta background: #ffffff !important en el contenedor principal");
        assert(code.includes('class="sp-greeting-clean"'), "Falta contenedor sp-greeting-clean");
        assert(code.includes('class="sp-playtomic-quick-actions"'), "Falta contenedor sp-playtomic-quick-actions");
    });

    test(`[${name}] Tipografía oscura (#111827 / #0f172a) establecida para máxima legibilidad`, () => {
        assert(code.includes('color: #111827'), "Falta color: #111827");
        assert(code.includes("font-family: 'Outfit', 'Inter'"), "Falta tipografía premium Outfit / Inter");
    });

    test(`[${name}] 4 accesos circulares estilo Playtomic implementados con sus badges y etiquetas`, () => {
        assert(code.includes("navigate('americanas')"), "Falta acceso circular a 'americanas'");
        assert(code.includes("navigate('entrenos')"), "Falta acceso circular a 'entrenos'");
        assert(code.includes("navigate('ranking')"), "Falta acceso circular a 'ranking'");
        assert(code.includes("navigate('my_team')"), "Falta acceso circular a 'my_team'");
        assert(code.includes('border-radius: 50%'), "Los accesos deben ser circulares (border-radius: 50%)");
        assert(code.includes('sp-action-pod'), "Debe incluir clase sp-action-pod");
    });

    test(`[${name}] Carrusel swipe horizontal de Americanas implementado (tipo Pádel Indoor Hospitalet)`, () => {
        assert(code.includes('id="americanas-horizontal-track"'), "Falta carril horizontal de americanas");
        assert(code.includes('overflow-x: auto'), "Carrusel debe tener scroll horizontal");
        assert(code.includes('scroll-snap-type: x mandatory'), "Carrusel debe usar scroll-snap táctil");
        assert(code.includes('Americana Pro Nocturna'), "Debe contener tarjeta de Americana Pro Nocturna");
        assert(code.includes('Americana Oro Fin de Semana'), "Debe contener tarjeta de Americana Oro");
        assert(code.includes('Americana Mixta Express'), "Debe contener tarjeta de Americana Mixta");
        assert(code.includes('Americana Femenina Club'), "Debe contener tarjeta de Americana Femenina");
    });

    test(`[${name}] Carrusel swipe horizontal de Entrenos implementado con slots de jugadores y hueco '+'`, () => {
        assert(code.includes('id="entrenos-horizontal-track"'), "Falta carril horizontal de entrenos");
        assert(code.includes('Táctica: Bandeja & Red'), "Debe contener entreno guiado");
        assert(code.includes('Indoor Hospitalet'), "Debe contener partida abierta en Indoor Hospitalet");
        assert(code.includes('Pozo Suizo Dinámico'), "Debe contener entreno mixto");
        assert(code.includes('Hueco libre'), "Debe incluir slots estilo Playtomic con hueco libre");
        assert(code.includes('+'), "Debe incluir símbolo '+' para huecos disponibles");
    });
});

// 4. VERIFICACIÓN DE RUTAS EN ROUTER.JS
console.log("\n▶️ FASE 4: Validación de Rutas y Navegación en Router.js");
const routerCode = fs.readFileSync(routerPath, 'utf8');

test("Router.js maneja la ruta 'americanas'", () => {
    assert(routerCode.includes("'americanas':"), "Router no tiene definida la ruta 'americanas'");
});

test("Router.js maneja la ruta 'entrenos'", () => {
    assert(routerCode.includes("'entrenos':"), "Router no tiene definida la ruta 'entrenos'");
});

test("Router.js maneja la ruta 'ranking'", () => {
    assert(routerCode.includes("'ranking':"), "Router no tiene definida la ruta 'ranking'");
});

test("Router.js maneja la ruta 'my_team'", () => {
    assert(routerCode.includes("'my_team':"), "Router no tiene definida la ruta 'my_team'");
});

console.log("\n================================================================================");
console.log(` RESULTADOS QA REDISEÑO INICIO:`);
console.log(` ✅ PASADAS: ${passed}`);
console.log(` ❌ FALLIDAS: ${failed}`);
console.log("================================================================================\n");

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
