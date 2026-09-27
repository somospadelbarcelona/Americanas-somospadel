/**
 * test-tournament-logic-audit.js
 * Validación integral del servicio TournamentLogicAuditService
 */

const assert = require('assert');
const path = require('path');

const TournamentLogicAuditService = require('../js/modules/admin/TournamentLogicAuditService.js');

console.log('🧪 Iniciando prueba automatizada de TournamentLogicAuditService...\n');

// 1. Simulación Twister
console.log('1️⃣ Test simulateTournament (twister)...');
const twisterSim = TournamentLogicAuditService.simulateTournament({
    mode: 'twister',
    numCourts: 4,
    rounds: 6,
    numPlayers: 16
});

assert.strictEqual(twisterSim.mode, 'twister');
assert.strictEqual(twisterSim.numCourts, 4);
assert.strictEqual(twisterSim.rounds, 6);
assert.strictEqual(twisterSim.players.length, 16);
assert.strictEqual(twisterSim.allMatches.length, 24);
assert.strictEqual(twisterSim.roundsDetail.length, 6);
assert.strictEqual(twisterSim.standings.length, 16);
console.log(`   ✅ Twister generado: 24 partidos, 16 jugadores en ranking. Tiempo: ${twisterSim.executionTimeMs} ms.`);

// 2. Simulación Parejas Fijas
console.log('\n2️⃣ Test simulateTournament (fixed)...');
const fixedSim = TournamentLogicAuditService.simulateTournament({
    mode: 'fixed',
    numCourts: 4,
    rounds: 6,
    numPlayers: 16
});

assert.strictEqual(fixedSim.mode, 'fixed');
assert.strictEqual(fixedSim.allMatches.length, 24);
assert.strictEqual(fixedSim.pairs.length, 8);
assert.strictEqual(fixedSim.standings.length, 8);
console.log(`   ✅ Parejas Fijas generadas: 8 parejas fijas, 24 partidos. Tiempo: ${fixedSim.executionTimeMs} ms.`);

// 3. Simulación Suizo
console.log('\n3️⃣ Test simulateTournament (swiss)...');
const swissSim = TournamentLogicAuditService.simulateTournament({
    mode: 'swiss',
    numCourts: 4,
    rounds: 6,
    numPlayers: 16
});

assert.strictEqual(swissSim.mode, 'swiss');
assert.strictEqual(swissSim.allMatches.length, 24);
assert.strictEqual(swissSim.standings.length, 16);
console.log(`   ✅ Suizo generado: 24 partidos, 16 jugadores. Tiempo: ${swissSim.executionTimeMs} ms.`);

// 4. Auditoría de Reglas de Oro
console.log('\n4️⃣ Test auditGoldenRules...');
const auditTwister = TournamentLogicAuditService.auditGoldenRules(twisterSim.allMatches, {
    mode: 'twister',
    num_courts: 4,
    rounds: 6
});

assert.strictEqual(auditTwister.rules.length, 5);
assert.ok(typeof auditTwister.overallScore === 'number');
assert.ok(auditTwister.overallScore >= 80, `Score esperado >= 80, obtenido: ${auditTwister.overallScore}`);
assert.strictEqual(auditTwister.isHealthy, true);

auditTwister.rules.forEach(r => {
    console.log(`   - [${r.id}] ${r.name}: score=${r.score}, passed=${r.passed} (${r.details})`);
});
console.log(`   ✅ Reglas de Oro auditadas con éxito. Score general: ${auditTwister.overallScore}/100.`);

// 5. Diagnóstico de Evento Real (modo in-memory)
console.log('\n5️⃣ Test diagnoseRealEvent (in-memory)...');
(async () => {
    const diag = await TournamentLogicAuditService.diagnoseRealEvent({
        event: { id: 'evt_real_test_01', name: 'Americana Nocturna Oro', pair_mode: 'twister', rounds: 6, status: 'finished' },
        matches: twisterSim.allMatches
    }, 'americana');

    assert.strictEqual(diag.eventId, 'evt_real_test_01');
    assert.strictEqual(diag.eventName, 'Americana Nocturna Oro');
    assert.ok(diag.auditResult.overallScore >= 80);
    assert.ok(diag.recommendations.length > 0);
    console.log(`   ✅ Diagnóstico de evento real completado.`);
    console.log(`   Recomendaciones:`, diag.recommendations);

    // 6. Batería de Self-Test Algorítmico
    console.log('\n6️⃣ Test runAlgorithmicSelfTest...');
    const selfTestResult = TournamentLogicAuditService.runAlgorithmicSelfTest();
    assert.strictEqual(selfTestResult.totalTests, 6);
    assert.strictEqual(selfTestResult.passedTests, 6);
    assert.strictEqual(selfTestResult.failedTests, 0);
    assert.strictEqual(selfTestResult.healthScore, 100);

    selfTestResult.tests.forEach(t => {
        console.log(`   [${t.passed ? 'PASS' : 'FAIL'}] ${t.name} (${t.durationMs} ms) - ${t.details}`);
    });

    // 7. Test Fuentes de Jugadores: Reales vs Profesionales
    console.log('\n7️⃣ Test Fuentes de Jugadores (Reales del Club vs Profesionales WPT)...');
    const simReal = TournamentLogicAuditService.simulateTournament({
        playersSource: 'real',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simReal.playersSource, 'real');
    assert.ok(simReal.players.some(p => p.id && p.id.startsWith('sp_')), 'Debe incluir jugadores del club SomosPadel');

    const simPro = TournamentLogicAuditService.simulateTournament({
        playersSource: 'pro',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simPro.playersSource, 'pro');
    assert.ok(simPro.players.some(p => p.id && p.id.startsWith('player_v_')), 'Debe incluir IDs virtuales de jugadores pro');
    console.log('   ✅ Fuentes de jugadores (Reales vs Pro) validadas con éxito.');

    // 8. Test Tipos de Evento: Americana vs Entreno
    console.log('\n8️⃣ Test Tipos de Evento (Americana vs Entreno)...');
    const simAmericana = TournamentLogicAuditService.simulateTournament({
        eventType: 'americana',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simAmericana.eventType, 'americana');
    assert.ok(simAmericana.eventName.includes('Americana'));

    const simEntreno = TournamentLogicAuditService.simulateTournament({
        eventType: 'entreno',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simEntreno.eventType, 'entreno');
    assert.ok(simEntreno.eventName.includes('Entreno'));
    console.log('   ✅ Adaptación de tipos de evento (Americana vs Entreno) validada con éxito.');

    // 9. Test Clonación de Evento Real sin tocar BD
    console.log('\n9️⃣ Test simulateFromRealEvent (Clonación en memoria sin tocar BD)...');
    const fakeRealEvent = {
        id: 'evt_real_clon_demo',
        name: 'Americana Reto de Campeones - 4 Pistas',
        num_courts: 4,
        pair_mode: 'twister',
        players: [
            { id: 'usr_1', name: 'Marta Pérez', level: 4.0, gender: 'chica' },
            { id: 'usr_2', name: 'Lucas Blanco', level: 3.5, gender: 'chico' }
        ]
    };
    const clonedSim = await TournamentLogicAuditService.simulateFromRealEvent(fakeRealEvent, 'americana', { rounds: 6 });
    assert.strictEqual(clonedSim.sourceEventId, 'evt_real_clon_demo');
    assert.strictEqual(clonedSim.allMatches.length, 24);
    assert.strictEqual(clonedSim.players.length, 16);
    // Verificar que los jugadores inscritos están presentes
    assert.ok(clonedSim.players.some(p => p.id === 'usr_1'));
    assert.ok(clonedSim.players.some(p => p.id === 'usr_2'));
    console.log('   ✅ Clonación de evento real en memoria validada: 16 jugadores, 24 partidos íntegros.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO! Health Score: 100%');
})();
