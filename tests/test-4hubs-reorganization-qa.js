/**
 * Test QA: Verificación de la Arquitectura de 5 Módulos Directivos Profesionales del ERP
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧭 [TEST QA 5 MÓDULOS PROFESIONALES] Validando arquitectura ejecutiva de 5 secciones...");

const htmlPath = path.join(__dirname, '../organizacion.html');
const jsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. Verificar los 5 módulos profesionales en la barra de navegación del ERP
const navButtons = [
    { tab: 'pactometro', label: 'Reparto de Socios & Simulador' },
    { tab: 'clubs', label: 'Sedes & Negociación' },
    { tab: 'events', label: 'Americanas & Pistas' },
    { tab: 'calendar', label: 'Calendario & Agenda' },
    { tab: 'dashboard', label: 'Contabilidad & Informes' }
];

navButtons.forEach(btn => {
    assert(html.includes(`data-tab="${btn.tab}"`), `Falta el botón de navegación data-tab="${btn.tab}"`);
    assert(html.includes(btn.label), `Falta la etiqueta "${btn.label}" en organizacion.html`);
    console.log(`  ✅ Módulo de Navegación '${btn.label}' verificado en organizacion.html`);
});

// Comprobar que no hay botones dispersos obsoletos en el sidebar
assert(!html.includes('data-tab="newpadelpro"'), "El botón obsoleto newpadelpro sigue en el sidebar");
assert(!html.includes('data-tab="hiring"'), "El botón obsoleto hiring sigue en el sidebar");
assert(!html.includes('data-tab="reports"'), "El botón obsoleto reports sigue en el sidebar");
assert(!html.includes('data-tab="future"'), "El botón obsoleto future sigue en el sidebar");
console.log("  ✅ Eliminación de botones redundantes y dispersos confirmada");

// 2. Verificar redirección inteligente en JS para compatibilidad total
assert(js.includes("tabName === 'newpadelpro'"), "Falta la redirección de newpadelpro -> clubs en navigateTo");
assert(js.includes("state.activeTab = 'clubs'"), "Falta asignar state.activeTab = 'clubs'");
assert(js.includes("tabName === 'hiring'"), "Falta la redirección de hiring -> dashboard en navigateTo");
assert(js.includes("tabName === 'reports'"), "Falta la redirección de reports -> dashboard en navigateTo");
assert(js.includes("tabName === 'future'"), "Falta la redirección de future -> dashboard en navigateTo");
console.log("  ✅ Redirección inteligente de rutas heredadas activa");

// 3. Verificar enrutamiento directo del Pactómetro
assert(js.includes("case 'pactometro':"), "Falta el caso 'pactometro' en renderActiveTab");
assert(js.includes("renderPactometroDashboardView()"), "renderActiveTab no enlaza a renderPactometroDashboardView");
console.log("  ✅ Módulo estrella 'Pactómetro & Simulador' con enrutamiento directo verificado");

// 4. Verificar integración directa de New Padel Pro en Sedes & Negociación
assert(js.includes("else if (state.activeClubTab === 'New Padel Pro')"), "Falta la condición de renderizado para New Padel Pro en renderClubsView");
assert(js.includes("renderNewPadelProView(true)"), "renderClubsView no enlaza directamente a renderNewPadelProView");
console.log("  ✅ Integración directa de New Padel Pro en Sedes & Negociación verificada");

// 5. Verificar sub-pestañas internas en Contabilidad & Informes
assert(js.includes("setDashboardSubTab"), "Falta la función setDashboardSubTab");
assert(js.includes("Balance & Semáforo"), "Falta la sub-pestaña Balance & Semáforo");
assert(js.includes("Personal & Break-Even"), "Falta la sub-pestaña Personal & Break-Even");
assert(js.includes("Informes & Exportación"), "Falta la sub-pestaña Informes & Exportación");
assert(js.includes("Formatos de Expansión"), "Falta la sub-pestaña Formatos de Expansión");
console.log("  ✅ Sub-pestañas ejecutivas en Contabilidad validadas");

console.log("\n🏆 [TEST QA 5 MÓDULOS PROFESIONALES] ¡Arquitectura de 5 Módulos 100% limpia, intuitiva y operativa!\n");
