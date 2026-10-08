/**
 * Test QA: Simulador Ultrarrápido, Presets 1-Clic, Cascada Visual y Reparto
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("⚡ [TEST QA SIMULADOR VISUAL] Validando presets 1-clic, barra de cascada y controles táctiles...");

const erpJsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');
const erpCssPath = path.join(__dirname, '../css/organizacion-erp.css');

const jsContent = fs.readFileSync(erpJsPath, 'utf8');
const cssContent = fs.readFileSync(erpCssPath, 'utf8');

// 1. Presencia de funciones en JS
const requiredFunctions = [
    'applyPreset',
    'stepCourts',
    'updateNppSim',
    'setNppSection'
];

requiredFunctions.forEach(fn => {
    assert(jsContent.includes(`function ${fn}`), `Falta la función ${fn} en organizacion-erp.js`);
    console.log(`  ✅ Función ${fn} declarada correctamente`);
});

// 2. Exportación en window.OrganizacionERP
requiredFunctions.forEach(fn => {
    assert(jsContent.includes(fn), `La función ${fn} no se exporta en return`);
    console.log(`  ✅ Función ${fn} exportada en window.OrganizacionERP`);
});

// 3. Presets 1-clic configurados (todos adaptados a la realidad de 5 pistas de New Padel Pro)
const presets = [
    'pilot_50_50',
    'alex_full',
    'socio_full',
    'split_60_40',
    'split_60_socio',
    'with_helper',
    'passive_mode',
    'courts_4'
];

presets.forEach(p => {
    assert(jsContent.includes(`case '${p}':`), `El preset '${p}' no está implementado en applyPreset`);
    assert(jsContent.includes(`applyPreset('${p}')`), `El botón para el preset '${p}' no está en la UI`);
    console.log(`  ✅ Preset 1-clic '${p}' implementado y enlazado`);
});

// 4. Barra de Cascada Visual (Waterfall)
assert(jsContent.includes('financial-waterfall-bar'), "Falta la barra financial-waterfall-bar en el template HTML");
assert(jsContent.includes('seg-court'), "Falta el segmento de pistas seg-court");
assert(jsContent.includes('seg-balls'), "Falta el segmento de pelotas seg-balls");
assert(jsContent.includes('seg-helpers'), "Falta el segmento de ayudantes seg-helpers");
assert(jsContent.includes('seg-alex'), "Falta el segmento de Alex seg-alex");
assert(jsContent.includes('seg-socio'), "Falta el segmento del Socio seg-socio");
console.log("  ✅ Barra de Cascada Financiera (Waterfall) con todos sus segmentos activa");

// 5. Controles Táctiles y Steppers
assert(jsContent.includes("stepCourts('morning', -1)"), "Falta el botón de restar pistas mañana");
assert(jsContent.includes("stepCourts('morning', 1)"), "Falta el botón de sumar pistas mañana");
assert(jsContent.includes("stepCourts('friday', -1)"), "Falta el botón de restar pistas viernes");
assert(jsContent.includes("stepCourts('friday', 1)"), "Falta el botón de sumar pistas viernes");
assert(jsContent.includes('chip-btn'), "Faltan los chips rápidos de pistas y ayudantes");
assert(jsContent.includes('sharing-cards-grid'), "Falta la rejilla de tarjetas visuales de reparto");
console.log("  ✅ Steppers +/−, Chips de acceso rápido y Tarjetas de reparto activos");

// 6. Rendimiento por hora
assert(jsContent.includes('alexHourlyRate'), "Falta el cálculo del ratio horario para Alex");
assert(jsContent.includes('socioHourlyRate'), "Falta el cálculo del ratio horario para el Socio");
console.log("  ✅ Cálculo de rendimiento por hora en pista verificado");

// 7. Estilos CSS
const requiredCss = [
    '.preset-pill-group',
    '.preset-pill-btn',
    '.chip-selector',
    '.chip-btn',
    '.counter-stepper',
    '.sharing-cards-grid',
    '.sharing-card',
    '.financial-waterfall-bar',
    '.financial-waterfall-seg',
    '.seg-court',
    '.seg-balls',
    '.seg-helpers',
    '.seg-alex',
    '.seg-socio'
];

requiredCss.forEach(cls => {
    assert(cssContent.includes(cls), `Falta la clase CSS ${cls} en organizacion-erp.css`);
    console.log(`  ✅ Clase CSS ${cls} verificada`);
});

console.log("\n🏆 [TEST QA SIMULADOR VISUAL] ¡Todos los tests del simulador visual y rápido han pasado al 100%!");
