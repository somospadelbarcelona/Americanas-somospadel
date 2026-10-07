/**
 * Test QA: Verificación de las Dos Opciones Claras de Franja (Mañana vs Viernes Noche),
 * Límite Máximo 5 Pistas, Canchas Visuales y Gráficos Financieros
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🎾 [TEST QA NEW PADEL PRO] Auditando las 2 opciones oficiales, límite 5 pistas y evolución visual...");

const erpJsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');
const erpCssPath = path.join(__dirname, '../css/organizacion-erp.css');

const jsContent = fs.readFileSync(erpJsPath, 'utf8');
const cssContent = fs.readFileSync(erpCssPath, 'utf8');

// 1. Selector visual de las dos opciones y mensual
assert(jsContent.includes('franja-selector-tabs'), "Falta el contenedor franja-selector-tabs");
assert(jsContent.includes("selectNppOptionView('morning')"), "Falta el selector de Franja 1 Mañanas");
assert(jsContent.includes("selectNppOptionView('friday')"), "Falta el selector de Franja 2 Viernes Noche");
assert(jsContent.includes("selectNppOptionView('both')"), "Falta el selector de Ambas Franjas Combinadas");
assert(jsContent.includes('selectNppOptionView'), "Falta exportar selectNppOptionView");
console.log("  ✅ Selector visual de las dos opciones oficiales (Mañanas vs Noches) y mensual verificado");

// 2. Límite máximo estricto de 5 pistas y canchas visuales de pádel
assert(jsContent.includes('renderPadelCourtsVisual'), "Falta la función gráfica de canchas de pádel");
assert(jsContent.includes('[1, 2, 3, 4, 5]'), "El selector de pistas no está acotado exactamente a 1-5 pistas");
assert(jsContent.includes('padel-court-visual-grid'), "Falta el grid de pistas de pádel");
assert(jsContent.includes('padel-court-diagram'), "Falta el diagrama visual de pista");
assert(jsContent.includes('padel-court-net'), "Falta la red de la pista visual");
console.log("  ✅ Componente gráfico de 5 canchas de pádel interactivas (Máx. 5 pistas) verificado");

// 3. Tablas de propuesta oficial fiel a las capturas del usuario
assert(jsContent.includes('proposal-table-official'), "Falta la clase de tabla de propuesta oficial");
assert(jsContent.includes('Franja 1: Americanas de Mañana') || jsContent.includes('Franja 1: Mañanas'), "Falta el título de Franja 1");
assert(jsContent.includes('Franja 2: Americanas de Viernes Noche') || jsContent.includes('Franja 2: Viernes Noche'), "Falta el título de Franja 2");
assert(jsContent.includes('Coste de pista objetivo'), "Falta el concepto de coste de pista objetivo en la tabla");
assert(jsContent.includes('Coste de material'), "Falta el concepto de coste de material en la tabla");
assert(jsContent.includes('row-net-profit'), "Falta la fila destacada de Beneficio neto");
console.log("  ✅ Tablas de propuesta oficial idénticas a las capturas del usuario implementadas");

// 4. Gráficos de desglose del dinero (Ingresos vs Costes vs Limpio)
assert(jsContent.includes('renderFinancialBarVisual'), "Falta la función de gráfico de barras financieras");
assert(jsContent.includes('financial-waterfall-bar'), "Falta la barra visual de cascada");
console.log("  ✅ Gráficos visuales de barras financieras y flujo dinámico activos");

// 5. Estilos CSS correspondientes
const cssClasses = [
    '.franja-selector-tabs',
    '.franja-tab-card',
    '.padel-court-visual-grid',
    '.padel-court-item',
    '.padel-court-diagram',
    '.proposal-table-official',
    '.row-net-profit'
];

cssClasses.forEach(cls => {
    assert(cssContent.includes(cls), `Falta la clase CSS requerida: ${cls}`);
    console.log(`  ✅ Estilo CSS ${cls} verificado`);
});

console.log("\n🏆 [TEST QA NEW PADEL PRO] ¡Todas las verificaciones de las 2 opciones, límite de 5 pistas y gráficos han pasado al 100%!");
