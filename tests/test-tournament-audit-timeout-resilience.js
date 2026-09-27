/**
 * test-tournament-audit-timeout-resilience.js
 * 
 * Batería de pruebas de resiliencia y timeouts para TournamentLogicAuditService:
 * 1. fetchRealPlayers timeout estricto de 1200ms ante DB colgada / offline.
 * 2. fetchRealPlayers resolución inmediata con pool de 48 socios de SOMOSPADEL_MEMBERS.
 * 3. simulateFromRealEvent timeout estricto de 1500ms con fallback seguro a evento y participantes demo.
 * 4. simulateTournament 100% síncrono y de cálculo puro en memoria (0 delay).
 * 5. getGlobalScope() resolución robusta sin excepciones ni estados pendientes.
 */

const assert = require('assert');
const path = require('path');

const servicePath = path.join(__dirname, '../js/modules/admin/TournamentLogicAuditService.js');
const TournamentLogicAuditService = require(servicePath);

async function runResilienceTests() {
    console.log('🛡️ Iniciando pruebas de resiliencia y timeouts estrictos en TournamentLogicAuditService...\n');

    // ----------------------------------------------------
    // TEST 1: simulateTournament es 100% síncrono (0 delay)
    // ----------------------------------------------------
    console.log('1️⃣ Test simulateTournament 100% síncrono...');
    const t0Sync = Date.now();
    const syncResult = TournamentLogicAuditService.simulateTournament({
        mode: 'twister',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    const syncDuration = Date.now() - t0Sync;

    assert.ok(syncResult && typeof syncResult === 'object', 'simulateTournament debe retornar un objeto.');
    assert.strictEqual(syncResult instanceof Promise, false, 'simulateTournament NUNCA debe ser una Promesa.');
    assert.strictEqual(typeof syncResult.then, 'undefined', 'simulateTournament no debe tener método .then.');
    assert.strictEqual(syncResult.allMatches.length, 24, 'Debe generar 24 partidos para 4 pistas y 6 rondas.');
    assert.strictEqual(syncResult.players.length, 16, 'Debe contar con 16 jugadores.');
    assert.ok(syncDuration < 50, `El cálculo síncrono en memoria debe tardar menos de 50ms (tardó ${syncDuration}ms).`);
    console.log(`   ✅ simulateTournament es 100% síncrono, cálculo puro en ${syncDuration}ms (0 delay).`);

    // ----------------------------------------------------
    // TEST 2: fetchRealPlayers con base de datos rápida / normal
    // ----------------------------------------------------
    console.log('\n2️⃣ Test fetchRealPlayers sin BD conectada (fallback SOMOSPADEL_MEMBERS)...');
    delete global.db;
    delete global.FirebaseDB;

    const t0Fallback = Date.now();
    const fallbackPlayers = await TournamentLogicAuditService.fetchRealPlayers(40);
    const durationFallback = Date.now() - t0Fallback;

    assert.ok(Array.isArray(fallbackPlayers), 'Debe retornar un array.');
    assert.ok(fallbackPlayers.length >= 48, `Debe contener al menos 48 socios (tiene ${fallbackPlayers.length}).`);
    assert.strictEqual(fallbackPlayers[0].name, 'Carlos Martínez');
    assert.ok(durationFallback < 200, `Sin BD debe resolver al instante (<200ms, tardó ${durationFallback}ms).`);
    console.log(`   ✅ fetchRealPlayers resolvió ${fallbackPlayers.length} socios en ${durationFallback}ms.`);

    // ----------------------------------------------------
    // TEST 3: fetchRealPlayers con BD colgada (Hanging Promise) - Timeout 1200ms
    // ----------------------------------------------------
    console.log('\n3️⃣ Test fetchRealPlayers con db.collection("players").get() colgada infinitamente...');
    // Simulamos una promesa de Firestore que NUNCA resuelve (colgada)
    global.db = {
        collection: (colName) => {
            return {
                get: () => new Promise(() => {}) // Nunca resuelve
            };
        }
    };

    const t0Hang = Date.now();
    const hungPlayers = await TournamentLogicAuditService.fetchRealPlayers(40);
    const durationHang = Date.now() - t0Hang;

    assert.ok(Array.isArray(hungPlayers), 'Debe retornar un array.');
    assert.strictEqual(hungPlayers.length, 48, `Debe resolver con los 48 socios de SOMOSPADEL_MEMBERS (obtenidos ${hungPlayers.length}).`);
    assert.ok(durationHang >= 1150 && durationHang <= 1450, `Debe cortar por timeout cerca de 1200ms (tardó ${durationHang}ms).`);
    console.log(`   ✅ fetchRealPlayers cortó a los ${durationHang}ms y retornó ${hungPlayers.length} socios reales de SomosPadel.`);

    // Limpiar mock de db
    delete global.db;

    // ----------------------------------------------------
    // TEST 4: simulateFromRealEvent con DB colgada - Timeout 1500ms
    // ----------------------------------------------------
    console.log('\n4️⃣ Test simulateFromRealEvent con FirebaseDB colgada infinitamente...');
    // Simulamos FirebaseDB colgado en getById
    global.FirebaseDB = {
        americanas: {
            getById: () => new Promise(() => {}) // Promesa colgada
        },
        tournaments: {
            getById: () => new Promise(() => {})
        }
    };

    const t0SimHang = Date.now();
    const simHungResult = await TournamentLogicAuditService.simulateFromRealEvent('hung_event_id', 'americana', {
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    const durationSimHang = Date.now() - t0SimHang;

    assert.ok(simHungResult && typeof simHungResult === 'object', 'Debe retornar resultado de simulación.');
    assert.strictEqual(simHungResult.isClonedFromReal, true, 'isClonedFromReal debe ser true.');
    assert.strictEqual(simHungResult.allMatches.length, 24, 'Debe haber generado 24 partidos seguros en memoria.');
    assert.strictEqual(simHungResult.players.length, 16, 'Debe haber completado 16 jugadores en memoria.');
    assert.ok(durationSimHang >= 1450 && durationSimHang <= 1800, `Debe cortar por timeout cerca de 1500ms (tardó ${durationSimHang}ms).`);
    console.log(`   ✅ simulateFromRealEvent cortó a los ${durationSimHang}ms con fallback demo de 16 jugadores y 24 partidos.`);

    // Limpiar mock de FirebaseDB
    delete global.FirebaseDB;

    // ----------------------------------------------------
    // TEST 5: diagnoseRealEvent con DB colgada - Timeout 1500ms
    // ----------------------------------------------------
    console.log('\n5️⃣ Test diagnoseRealEvent con Firestore colgado infinitamente...');
    global.db = {
        collection: () => ({
            doc: () => ({
                get: () => new Promise(() => {}) // Promesa colgada
            }),
            where: () => ({
                get: () => new Promise(() => {}) // Promesa colgada
            })
        })
    };

    const t0DiagHang = Date.now();
    const diagHungResult = await TournamentLogicAuditService.diagnoseRealEvent('hung_diag_id', 'americana');
    const durationDiagHang = Date.now() - t0DiagHang;

    assert.ok(diagHungResult && typeof diagHungResult === 'object');
    assert.ok(diagHungResult.auditResult, 'Debe contener auditResult.');
    assert.ok(durationDiagHang >= 1450 && durationDiagHang <= 1800, `diagnoseRealEvent debe cortar cerca de 1500ms (tardó ${durationDiagHang}ms).`);
    console.log(`   ✅ diagnoseRealEvent cortó a los ${durationDiagHang}ms y devolvió diagnóstico seguro.`);

    delete global.db;

    // ----------------------------------------------------
    // TEST 6: simulateFromRealEvent con objeto en memoria inmediato (0ms)
    // ----------------------------------------------------
    console.log('\n6️⃣ Test simulateFromRealEvent con objeto en memoria directo...');
    const memoryEvent = {
        id: 'mem_event_1',
        name: 'Americana Fin de Semana',
        num_courts: 3,
        pair_mode: 'fixed',
        players: [
            { id: 'p1', name: 'Ana', level: 3.5, gender: 'chica' },
            { id: 'p2', name: 'Beto', level: 4.0, gender: 'chico' }
        ]
    };
    const t0Mem = Date.now();
    const memResult = await TournamentLogicAuditService.simulateFromRealEvent(memoryEvent, 'americana', { rounds: 4, silent: true });
    const durationMem = Date.now() - t0Mem;

    assert.strictEqual(memResult.sourceEventId, 'mem_event_1');
    assert.strictEqual(memResult.numCourts, 3);
    assert.strictEqual(memResult.allMatches.length, 12);
    assert.ok(durationMem < 100, `En memoria directa debe resolver en menos de 100ms (tardó ${durationMem}ms).`);
    console.log(`   ✅ simulateFromRealEvent en memoria completado en ${durationMem}ms.`);

    console.log('\n================================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE RESILIENCIA Y TIMEOUTS APROBADAS AL 100%');
    console.log('================================================================');
}

runResilienceTests().catch(err => {
    console.error('❌ Error en pruebas de resiliencia:', err);
    process.exit(1);
});
