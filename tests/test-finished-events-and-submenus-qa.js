/**
 * test-finished-events-and-submenus-qa.js
 * Verificación QA de:
 * 1. Eventos y entrenos finalizados muestran 'FINALIZADA' / 'FINALIZADO' en lugar de 'ESPERA'.
 * 2. Posicionamiento de la opción 'FINALIZADAS' inmediatamente después de 'AMERICANAS' y 'ENTRENOS' en los submenús.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧪 Iniciando pruebas QA: Entrenos/Americanas Finalizadas y Orden de Submenús...\n");

// 1. Verificar index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Comprobar orden en SubnavManager.renderAmericanas
const amSubnavMatch = indexHtml.match(/renderAmericanas:[\s\S]*?const tabs = \[\s*([\s\S]*?)\];/);
assert(amSubnavMatch, "Debe existir renderAmericanas con tabs en index.html");
const amTabsContent = amSubnavMatch[1];
const amTabIds = [...amTabsContent.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
console.log("📋 Tabs detectadas en index.html (Americanas):", amTabIds);
assert.strictEqual(amTabIds[0], 'events', "Primera tab debe ser 'events'");
assert.strictEqual(amTabIds[1], 'finished_americanas', "Segunda tab debe ser 'finished_americanas'");

// 2. Verificar EventsController_V6.js
const eventsControllerJs = fs.readFileSync(path.join(__dirname, '../js/modules/americanas/EventsController_V6.js'), 'utf8');

// A) Comprobar orden en tabs de americanas en EventsController_V6
const ecAmMatch = eventsControllerJs.match(/const tabs = isAmericanasSection \? \[\s*([\s\S]*?)\] : \[\];/);
assert(ecAmMatch, "Debe existir tabs de americanas en EventsController_V6.js");
const ecAmTabIds = [...ecAmMatch[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
console.log("📋 Tabs detectadas en EventsController_V6 (Americanas):", ecAmTabIds);
assert.strictEqual(ecAmTabIds[0], 'events', "Primera tab debe ser 'events'");
assert.strictEqual(ecAmTabIds[1], 'finished_americanas', "Segunda tab debe ser 'finished_americanas'");

// B) Comprobar orden en entrenosTabs en EventsController_V6
const ecEntrenosMatch = eventsControllerJs.match(/const entrenosTabs = \[\s*([\s\S]*?)\];/);
assert(ecEntrenosMatch, "Debe existir entrenosTabs en EventsController_V6.js");
const ecEntrenosTabIds = [...ecEntrenosMatch[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
console.log("📋 Tabs detectadas en EventsController_V6 (Entrenos):", ecEntrenosTabIds);
assert.strictEqual(ecEntrenosTabIds[0], 'entrenos', "Primera tab debe ser 'entrenos'");
assert.strictEqual(ecEntrenosTabIds[1], 'finished', "Segunda tab debe ser 'finished'");

// C) Comprobar que en renderCard no se cuela 'ESPERA' cuando isFinished es true o el evento ya terminó
// Simulamos el renderCard básico de EventsController
function testRenderCardLogic() {
    // Extraemos o probamos la lógica de renderCard
    const mockController = {
        state: { currentUser: { uid: 'user_123', role: 'player' } },
        isEventFinished: function(evt) {
            if (evt.status === 'finished') return true;
            if (evt.date && evt.date < '2026-09-01') return true;
            return false;
        },
        hasEventStarted: function() { return true; },
        _parseDate: function() { return { start: new Date('2026-08-31T18:00:00'), end: new Date('2026-08-31T20:00:00'), normDate: '2026-08-31' }; },
        formatEventTime: function() { return '18:00 - 20:00'; },
        checkGenderEligibility: function() { return { eligible: true }; },
        isAmericanaUnlocked: function() { return true; },
        getNormalizedCategory: function() { return 'male'; }
    };

    // Evaluar la cadena en EventsController_V6 para renderCard
    assert(eventsControllerJs.includes("const isFinishedEffective = isFinished || this.isEventFinished(evt)"), 
        "EventsController_V6 debe calcular isFinishedEffective considerando isEventFinished(evt)");
    assert(eventsControllerJs.includes("btnLabel = isEntreno ? 'FINALIZADO' : 'FINALIZADA'"), 
        "btnLabel para eventos finalizados debe ser FINALIZADO o FINALIZADA");
    assert(eventsControllerJs.includes("${isFinished ? btnLabel : (isCancelled ? 'ANULADO'"), 
        "La vista compacta debe priorizar isFinished sobre ESPERA/UNIRME");
    assert(eventsControllerJs.includes("sp_events_view_mode', 'compact'"), 
        "viewMode debe inicializarse en compact por defecto tanto para americanas como entrenos");

    console.log("✅ Lógica de renderCard correctamente protegida contra 'ESPERA' en eventos terminados.");
    console.log("✅ Vista compacta/minimizada configurada como predeterminada.");
}

testRenderCardLogic();

console.log("\n🎉 ¡TODAS LAS PRUEBAS DE FINALIZADAS Y SUBMENÚS HAN PASADO EXITOSAMENTE!");
