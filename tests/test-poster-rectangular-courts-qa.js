/**
 * Test QA de Validación: Póster HD Rectangular y Layout Sin Cortes de Pistas
 */
const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('🧪 QA TEST: PÓSTER HD RECTANGULAR Y GRID DE PISTAS SIN CORTES');
console.log('========================================================================\n');

// 1. Verificación estática de código
const code = fs.readFileSync('js/modules/americanas/EventsController_V6.js', 'utf8');

assert.ok(code.includes('exportWidth = 1180'), 'Debe calibrar el ancho de exportación en 1180px');
assert.ok(code.includes('battle-courts-export-poster'), 'Debe crear contenedor off-screen dedicado battle-courts-export-poster');
assert.ok(code.includes('renderPosterPlayerSlot'), 'Debe contar con helper renderPosterPlayerSlot para slots HD');
assert.ok(code.includes('grid-template-columns: ${gridColumns}'), 'Debe disponer las pistas en cuadrícula de 2 columnas');
assert.ok(code.includes('.battle-courts-grid'), 'Debe definir clase responsive battle-courts-grid');
assert.ok(code.includes('@media (min-width: 768px)'), 'Debe contener media query para tablets/desktop');
assert.ok(code.includes('min-width: 0; overflow: hidden;'), 'Las columnas de Pareja A y Pareja B deben tener min-width 0 y overflow hidden');
console.log('✅ Verificaciones estáticas de estructura y diseño superadas al 100%');

// 2. Verificación de index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('EventsController_V6.js?v=IG_STORY_FLYER_WHITE_HD_V25'), 'Cachebuster debe ser V25');
console.log('✅ Verificación de cachebuster V25 en index.html superada con éxito.');

console.log('\n🏆 TODOS LOS TESTS DE PÓSTER HD RECTANGULAR Y DISEÑO SIN CORTES HAN PASADO.');
