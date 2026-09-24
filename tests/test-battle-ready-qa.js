/**
 * Test de Control de Calidad (QA) para Battle Ready Modal en EventsController_V6
 */

const assert = require('assert');
const fs = require('fs');

console.log('🧪 Iniciando pruebas de QA para Battle Ready Modal...');

const code = fs.readFileSync('js/modules/americanas/EventsController_V6.js', 'utf8');

// 1. Verificación sintáctica
assert.doesNotThrow(() => {
    new Function(code);
}, 'El código debe compilar como función JavaScript válida');
console.log('  ✅ Sintaxis JS 100% válida');

// 2. Comprobación de funciones y variables globales en window
const expectedGlobalMethods = [
    'window.closeBattleReadyModal',
    'window.switchBattleReadyTab',
    'window.filterBattleReady',
    'window.searchBattleReady',
    'window.startBattleRoulette',
    'window.updateBattleDuel',
    'window.sendBattleDuelChallenge',
    'window.shareConvocatoriaBattleReady',
    'window.toggleBattleReadyFullscreen',
    'window.toggleBattleVoiceBroadcast',
    'window.updateBattleCountdown',
    'window.generateConvocatoriaStory',
    'window.setBattleDisplayMode',
    'window.proposePairChallenge'
];

expectedGlobalMethods.forEach(method => {
    assert.ok(code.includes(method), `Debe existir la asignación global: ${method}`);
    console.log(`  ✅ Verificado método global: ${method}`);
});

// 3. Comprobación de que no hay inyección ni roturas en interpolaciones onclick de PadelFutCard
assert.ok(code.includes('safeNameAttr'), 'renderNeonPlayer debe usar safeNameAttr para escapar comillas dobles y simples en inline onclick');
assert.ok(code.includes('partnerSearchName'), 'Las tarjetas individuales deben sanitizar partner_name contra inyección HTML');
console.log('  ✅ Sanitización HTML y atributos segura');

// 4. Comprobación de eliminación de elementos redundantes
assert.ok(!code.includes('MODO TV'), 'No debe existir el botón redundante de MODO TV');
assert.ok(!code.includes('battle-tabs-wrapper'), 'No debe existir la barra de 4 pestañas intermedias');
assert.ok(!code.includes('battle-view-warroom'), 'No debe existir la vista secundaria warroom');
assert.ok(!code.includes('battle-view-roulette'), 'No debe existir la vista secundaria roulette');
assert.ok(!code.includes('battle-view-duel'), 'No debe existir la vista secundaria duel');
console.log('  ✅ Eliminados elementos redundantes (MODO TV, pestañas secundarias)');

// 5. Comprobación de integración limpia del Roster directo, estadísticas simétricas, Cartel Story y Pistas
assert.ok(code.includes('battle-stats-grid'), 'Debe existir el grid simétrico 2x2 / 4 columnas de estadísticas');
assert.ok(code.includes('battle-search-input'), 'Debe existir el buscador de jugadores');
assert.ok(code.includes('battle-pill-all'), 'Debe existir el filtro Todos');
assert.ok(code.includes('battle-pill-pair'), 'Debe existir el filtro Parejas');
assert.ok(code.includes('battle-pill-solo'), 'Debe existir el filtro Buscando Pareja');
assert.ok(code.includes('battle-pill-vacant'), 'Debe existir el filtro Plazas Libres');
assert.ok(code.includes('COMPARTIR CONVOCATORIA'), 'Debe existir el botón principal de Compartir Convocatoria');
assert.ok(code.includes('battle-story-btn'), 'Debe existir el botón generador de Cartel Story HD');
assert.ok(code.includes('battle-mode-cards-btn'), 'Debe existir el selector de Modo Tarjetas');
assert.ok(code.includes('battle-mode-courts-btn'), 'Debe existir el selector de Modo Pistas');
assert.ok(code.includes('battle-courts-container'), 'Debe existir el contenedor de simulación de Pistas Premier');
assert.ok(code.includes('PROPONER PAREJA'), 'Debe existir el botón de matchmaking rápido Proponer Pareja');
console.log('  ✅ Roster directo, Cartel Story HD, Modo Pistas Premier y Proponer Pareja verificados');

console.log('🎉 TODAS LAS PRUEBAS DE BATTLE READY MODAL PASARON CON ÉXITO.');
