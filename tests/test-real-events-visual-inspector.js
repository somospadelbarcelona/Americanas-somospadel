/**
 * test-real-events-visual-inspector.js
 * Test suite for the new Visual Real Events Inspector in Admin Panel
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Setup minimal browser-like environment
global.window = global;
global.document = {
    getElementById: (id) => null,
    querySelector: (sel) => null,
    createElement: (tag) => ({ style: {}, appendChild: () => {}, textContent: '' }),
    body: { appendChild: () => {} }
};

const TournamentLogicAuditService = require('../js/modules/admin/TournamentLogicAuditService.js');
global.TournamentLogicAuditService = TournamentLogicAuditService;

const { PreFlightRoundVerifier } = require('../js/PreFlightRoundVerifier.js');
global.PreFlightRoundVerifier = PreFlightRoundVerifier;

const AdminTournamentLogicLab = require('../js/modules/admin/AdminTournamentLogicLab.js');

console.log("======================================================================");
console.log("🧪 BATERÍA DE PRUEBAS: INSPECTOR VISUAL DE EVENTOS REALES EN ADMIN");
console.log("======================================================================");

(async function runTests() {
    // -------------------------------------------------------------------------
    // TEST 1: diagnoseRealEvent retorna eventDoc y matches completos
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: diagnoseRealEvent con enriquecimiento de matches y doc ---");
    const fakeMatches = [
        { id: 'm1', round: 1, court: 1, team_a_ids: ['p1', 'p2'], team_b_ids: ['p3', 'p4'], score_a: 6, score_b: 3, status: 'finished' },
        { id: 'm2', round: 1, court: 2, team_a_ids: ['p5', 'p6'], team_b_ids: ['p7', 'p8'], score_a: 5, score_b: 4, status: 'finished' },
        { id: 'm3', round: 2, court: 1, team_a_ids: ['p1', 'p2'], team_b_ids: ['p5', 'p6'], score_a: 6, score_b: 4, status: 'finished' },
        { id: 'm4', round: 2, court: 2, team_a_ids: ['p3', 'p4'], team_b_ids: ['p7', 'p8'], score_a: 5, score_b: 5, tie_break_winner_team: 'team_a', status: 'finished' }
    ];

    const fakeEvent = {
        id: 'real_tourn_fixed_001',
        name: 'Americana Parejas Fijas Oficial',
        pair_mode: 'fixed',
        num_courts: 2,
        status: 'finished'
    };

    const diag = await TournamentLogicAuditService.diagnoseRealEvent({
        event: fakeEvent,
        matches: fakeMatches
    }, 'americana');

    assert.ok(diag.eventDoc, "diagnoseRealEvent debe retornar eventDoc");
    assert.strictEqual(diag.eventDoc.name, 'Americana Parejas Fijas Oficial');
    assert.ok(Array.isArray(diag.matches), "diagnoseRealEvent debe retornar matches");
    assert.strictEqual(diag.matches.length, 4, "Debe tener los 4 partidos");
    assert.ok(diag.auditResult, "diagnoseRealEvent debe incluir auditResult");
    console.log(`✅ TEST 1 Superado: Retorno íntegro (Score: ${diag.auditResult.overallScore}/100)`);

    // -------------------------------------------------------------------------
    // TEST 2: Regla 2 en Parejas Fijas audita activamente rupturas de duplas
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Auditoría activa de la Regla 2 en Parejas Fijas ---");
    // Caso A: Parejas 100% intactas
    const rule2A = diag.auditResult.rules.find(r => r.id === 'RULE_NO_PARTNER_REPEAT');
    assert.ok(rule2A, "Regla 2 debe existir");
    assert.strictEqual(rule2A.passed, true, "Regla 2 debe pasar cuando duplas están intactas");
    assert.strictEqual(rule2A.score, 100, "Score debe ser 100 con duplas intactas");

    // Caso B: Pareja rota en Ronda 2 (p1 juega con p8 en vez de p2)
    const brokenMatches = [
        { id: 'bm1', round: 1, court: 1, team_a_ids: ['p1', 'p2'], team_b_ids: ['p3', 'p4'], score_a: 6, score_b: 3, status: 'finished' },
        { id: 'bm2', round: 2, court: 1, team_a_ids: ['p1', 'p8'], team_b_ids: ['p3', 'p4'], score_a: 6, score_b: 4, status: 'finished' }
    ];
    const auditBroken = TournamentLogicAuditService.auditGoldenRules(brokenMatches, { mode: 'fixed', num_courts: 2, rounds: 2 });
    const rule2Broken = auditBroken.rules.find(r => r.id === 'RULE_NO_PARTNER_REPEAT');
    assert.strictEqual(rule2Broken.score < 100, true, "Score debe penalizarse si una pareja fija se rompe");
    assert.ok(rule2Broken.warnings.length > 0, "Debe registrar warnings detallando la ruptura");
    console.log(`✅ TEST 2 Superado: Detección estricta de estabilidad de duplas en modo fijo.`);

    // -------------------------------------------------------------------------
    // TEST 3: Regla 3 no penaliza empates dirimidos por tie-break
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Regla 3 no penaliza empates 5-5 con desempate registrado ---");
    const tieMatches = [
        { id: 'tm1', round: 1, court: 1, team_a_ids: ['p1', 'p2'], team_b_ids: ['p3', 'p4'], score_a: 5, score_b: 5, tie_break_winner_team: 'team_a', status: 'finished' }
    ];
    const auditTie = TournamentLogicAuditService.auditGoldenRules(tieMatches, { mode: 'fixed', num_courts: 1, rounds: 1 });
    const rule3Tie = auditTie.rules.find(r => r.id === 'RULE_SCORE_INTEGRITY');
    assert.strictEqual(rule3Tie.score, 100, "Empate 5-5 dirimido no debe penalizarse como no resuelto");
    console.log(`✅ TEST 3 Superado: Empate dirimido validado con integridad 100/100.`);

    // -------------------------------------------------------------------------
    // TEST 4: Métodos del Inspector Visual en AdminTournamentLogicLab
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Métodos UI del Inspector Visual en AdminTournamentLogicLab ---");
    const lab = global.AdminTournamentLogicLab;
    assert.ok(lab, "AdminTournamentLogicLab instance debe existir");

    lab.lastRealDiagnosis = diag;
    lab.selectedRealEventId = fakeEvent.id;
    lab.selectedRealRound = 2;

    // Test selección de ronda real
    lab.selectRealRound(1);
    assert.strictEqual(lab.selectedRealRound, 1, "Debe seleccionar Ronda 1");

    // Test render de partidos de la ronda real
    const htmlMatchesR1 = lab._renderRealRoundMatches(diag, 1);
    assert.ok(htmlMatchesR1.includes('PISTA 1'), "Debe renderizar PISTA 1");
    assert.ok(htmlMatchesR1.includes('PISTA 2'), "Debe renderizar PISTA 2");
    assert.ok(htmlMatchesR1.includes('👑 REYES DE PISTA 1'), "Debe indicar ascenso o mantenimiento pozo");

    // Test render de matriz de parejas fijas
    const htmlMatrixFixed = lab._renderRealFixedPairsMatrix(diag.matches, diag.eventDoc);
    assert.ok(htmlMatrixFixed.includes('Matriz de Integridad y Trayectoria de Parejas Fijas'), "Debe contener cabecera de la matriz fija");
    assert.ok(htmlMatrixFixed.includes('100% PAREJAS FIJAS INTACTAS ✅'), "Debe mostrar badge de integridad");

    // Test render de matriz Twister
    const htmlMatrixTwister = lab._renderRealTwisterMatrix(fakeMatches, { pair_mode: 'twister' });
    assert.ok(htmlMatrixTwister.includes('Matriz de Rotación Twister'), "Debe contener cabecera Twister");
    assert.ok(htmlMatrixTwister.includes('0 REPETICIONES R-1 ✅'), "Debe validar regla R-1");

    console.log("✅ TEST 4 Superado: Widgets visuales de actas y matrices operando al 100%.");

    // -------------------------------------------------------------------------
    // TEST 5: Ejecución del Escudo PreFlight en Vivo sobre evento real
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Escudo PreFlight Live sobre evento real ---");
    lab.selectRealRound(1);
    lab.runRealPreflightShield();
    assert.ok(lab.realPreflightResult, "realPreflightResult debe estar poblado");
    assert.strictEqual(lab.realPreflightResult.roundNum, 1, "Debe auditar Ronda 1");
    assert.strictEqual(lab.realPreflightResult.result.isValid, true, "Ronda 1 debe ser 100% válida ante PreFlight");

    const htmlPreflight = lab._renderRealPreflightShieldCard(lab.realPreflightResult);
    assert.ok(htmlPreflight.includes('ESCUDO 100% BLINDADO ✅'), "Debe mostrar badge de blindaje");
    assert.ok(htmlPreflight.includes('Aforo 2 vs 2 por Pista'), "Debe confirmar aforo 2v2");
    console.log("✅ TEST 5 Superado: Escudo PreFlight audita ronda real con éxito rotundo.");

    console.log("\n======================================================================");
    console.log("🎉 TODOS LOS 5 TESTS DEL INSPECTOR VISUAL REAL PASARON CON ÉXITO");
    console.log("======================================================================");
})();
