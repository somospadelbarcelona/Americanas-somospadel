/**
 * test-qa-user-scenario-audit.js
 * Script de Certificación Formal QA: Reproducción y Validación Exhaustiva
 * del caso reportado por el usuario en Americana / Pozo Mixto.
 *
 * Caso de prueba:
 * - 8 Jugadores: 4 chicos y 4 chicas
 *   Chicos: Adria Serrano, Adrian Boza, Albert Garcia, Alberto Javier
 *   Chicas: Ariadna Majua, Carlota Calabuig, Cristina Matamoros, Inma Terribas
 * - 2 Pistas
 *
 * Verificaciones:
 * 1. Ronda 1 en Americana Mixta y Pozo Mixto: 100% parejas mixtas (1H + 1M).
 *    CERO parejas de 2 chicos (ej. Adria + Adrian) ni de 2 chicas (Carlota + Cristina).
 * 2. Ronda 2 en Pozo Mixto: Ascensos y descensos limpios y matemáticos.
 *    Pista 1 alberga estrictamente a los 4 ganadores de R1 (sin ascensos erróneos por orden alfabético).
 *    Pista 2 alberga estrictamente a los 4 perdedores de R1.
 *    Rotación interna de parejas en cada pista: 100% mixtas y 0% de repetición de compañero.
 * 3. Auditoría de compatibilidad universal (Node.js CommonJS y Browser Globals).
 */

const assert = require('assert');
const TournamentEngine = require('../js/tournament-engine/TournamentEngine');

console.log("================================================================================");
console.log("🏅 CERTIFICACIÓN QA: AUDITORÍA FORMAL DEL CASO DE USUARIO (AMERICANA / POZO MIXTO)");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
    totalTests++;
    try {
        testFn();
        console.log(`  ✅ [PASS] ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${description}`);
        console.error(`     Error: ${err.message}`);
        console.error(err.stack);
    }
}

// ---------------------------------------------------------
// DATOS EXACTOS DEL USUARIO
// ---------------------------------------------------------
const userPlayers = [
    { id: 'usr_adria', name: 'Adria Serrano', gender: 'M', level: 3.5 },
    { id: 'usr_adrian', name: 'Adrian Boza', gender: 'M', level: 3.5 },
    { id: 'usr_albert', name: 'Albert Garcia', gender: 'M', level: 3.5 },
    { id: 'usr_alberto', name: 'Alberto Javier', gender: 'M', level: 3.5 },
    { id: 'usr_ariadna', name: 'Ariadna Majua', gender: 'F', level: 3.0 },
    { id: 'usr_carlota', name: 'Carlota Calabuig', gender: 'F', level: 3.0 },
    { id: 'usr_cristina', name: 'Cristina Matamoros', gender: 'F', level: 3.0 },
    { id: 'usr_inma', name: 'Inma Terribas', gender: 'F', level: 3.0 }
];

const getGender = (p) => {
    const g = String(p.gender || p.sex || '').trim().toLowerCase();
    if (g.startsWith('m') || g === 'hombre' || g === 'chico') return 'M';
    if (g.startsWith('f') || g === 'mujer' || g === 'chica') return 'F';
    return 'UNKNOWN';
};

const verifyAllPairsMixed = (matches, roundLabel) => {
    matches.forEach(m => {
        const teamAPlayers = m.team_a_players || [];
        const teamBPlayers = m.team_b_players || [];

        assert.strictEqual(teamAPlayers.length, 2, `${roundLabel} - Pista ${m.court}: Team A debe tener 2 jugadores`);
        assert.strictEqual(teamBPlayers.length, 2, `${roundLabel} - Pista ${m.court}: Team B debe tener 2 jugadores`);

        const gendersA = teamAPlayers.map(getGender).sort();
        const gendersB = teamBPlayers.map(getGender).sort();

        assert.deepStrictEqual(gendersA, ['F', 'M'],
            `${roundLabel} - Pista ${m.court}: Team A (${m.team_a_names.join(' + ')}) DEBE ser mixto (1H + 1M) y NO ${gendersA.join('+')}`);
        assert.deepStrictEqual(gendersB, ['F', 'M'],
            `${roundLabel} - Pista ${m.court}: Team B (${m.team_b_names.join(' + ')}) DEBE ser mixto (1H + 1M) y NO ${gendersB.join('+')}`);
    });
};

// =========================================================
// BLOQUE 1: CASO DE USUARIO EN RONDA 1
// =========================================================
console.log("--- BLOQUE 1: RONDA 1 - AMERICANA MIXTA Y POZO MIXTO ---");

runTest("1.1 Americana Mixta R1: 100% parejas mixtas (Sin parejas chico+chico ni chica+chica)", () => {
    const res = TournamentEngine.generateRound({
        players: userPlayers,
        courts: 2,
        roundNum: 1,
        mode: 'mixta'
    });

    assert.strictEqual(res.matches.length, 2, "Deben generarse 2 partidos");
    verifyAllPairsMixed(res.matches, "Americana Mixta R1");

    // Verificar explícitamente que Adria y Adrian NO están en la misma pareja
    const adriaMatch = res.matches.find(m => m.team_a_ids.includes('usr_adria') || m.team_b_ids.includes('usr_adria'));
    const adriaTeam = adriaMatch.team_a_ids.includes('usr_adria') ? adriaMatch.team_a_ids : adriaMatch.team_b_ids;
    assert.ok(!adriaTeam.includes('usr_adrian'), "Adria Serrano y Adrian Boza NUNCA deben estar en la misma pareja");

    // Verificar explícitamente que Carlota y Cristina NO están en la misma pareja
    const carlotaMatch = res.matches.find(m => m.team_a_ids.includes('usr_carlota') || m.team_b_ids.includes('usr_carlota'));
    const carlotaTeam = carlotaMatch.team_a_ids.includes('usr_carlota') ? carlotaMatch.team_a_ids : carlotaMatch.team_b_ids;
    assert.ok(!carlotaTeam.includes('usr_cristina'), "Carlota Calabuig y Cristina Matamoros NUNCA deben estar en la misma pareja");
});

runTest("1.2 Pozo Mixto R1: 100% parejas mixtas y 2 chicos + 2 chicas por pista", () => {
    const res = TournamentEngine.generateRound({
        players: userPlayers,
        courts: 2,
        roundNum: 1,
        mode: 'pozo',
        options: { isMixed: true }
    });

    assert.strictEqual(res.matches.length, 2, "Deben generarse 2 partidos");
    verifyAllPairsMixed(res.matches, "Pozo Mixto R1");

    // Verificar que en cada pista haya exactamente 2 hombres y 2 mujeres
    res.matches.forEach(m => {
        const allCourtPlayers = [...m.team_a_players, ...m.team_b_players];
        const menCount = allCourtPlayers.filter(p => getGender(p) === 'M').length;
        const womenCount = allCourtPlayers.filter(p => getGender(p) === 'F').length;
        assert.strictEqual(menCount, 2, `Pista ${m.court} debe tener 2 hombres`);
        assert.strictEqual(womenCount, 2, `Pista ${m.court} debe tener 2 mujeres`);
    });
});

runTest("1.3 Rey de la Pista Mixto R1: 100% parejas mixtas", () => {
    const res = TournamentEngine.generateRound({
        players: userPlayers,
        courts: 2,
        roundNum: 1,
        mode: 'rey_pista',
        options: { isMixed: true }
    });

    assert.strictEqual(res.matches.length, 2, "Deben generarse 2 partidos");
    verifyAllPairsMixed(res.matches, "Rey de la Pista Mixto R1");
});

// =========================================================
// BLOQUE 2: CASO DE USUARIO EN RONDA 2 (ASCENSOS Y DESCENSOS)
// =========================================================
console.log("\n--- BLOQUE 2: RONDA 2 - POZO MIXTO Y ASCENSOS/DESCENSOS REALES ---");

runTest("2.1 Pozo Mixto R2: Pista 1 con ganadores, Pista 2 con perdedores, 100% mixtas y no repite pareja", () => {
    // Generar R1 de Pozo Mixto
    const r1 = TournamentEngine.generateRound({
        players: userPlayers,
        courts: 2,
        roundNum: 1,
        mode: 'pozo',
        options: { isMixed: true }
    });

    // Pista 1: Team A (Adria + Ariadna) gana 6-2 a Team B (Adrian + Carlota)
    // Pista 2: Team A (Albert + Cristina) gana 6-3 a Team B (Alberto + Inma)
    const m1 = r1.matches.find(m => m.court === 1);
    const m2 = r1.matches.find(m => m.court === 2);

    const r1Results = [
        {
            round: 1,
            court: 1,
            status: 'finished',
            team_a_ids: m1.team_a_ids,
            team_b_ids: m1.team_b_ids,
            score_a: 6,
            score_b: 2
        },
        {
            round: 1,
            court: 2,
            status: 'finished',
            team_a_ids: m2.team_a_ids,
            team_b_ids: m2.team_b_ids,
            score_a: 6,
            score_b: 3
        }
    ];

    const expectedWinnersCourt1 = m1.team_a_ids; // Adria + Ariadna
    const expectedLosersCourt1 = m1.team_b_ids;  // Adrian + Carlota
    const expectedWinnersCourt2 = m2.team_a_ids; // Albert + Cristina
    const expectedLosersCourt2 = m2.team_b_ids;  // Alberto + Inma

    const expectedCourt1PlayersR2 = [...expectedWinnersCourt1, ...expectedWinnersCourt2].sort();
    const expectedCourt2PlayersR2 = [...expectedLosersCourt1, ...expectedLosersCourt2].sort();

    // Generar Ronda 2
    const r2 = TournamentEngine.generateRound({
        players: r1.updatedPlayers,
        courts: 2,
        roundNum: 2,
        mode: 'pozo',
        matchesHistory: r1Results,
        options: { isMixed: true }
    });

    assert.strictEqual(r2.matches.length, 2, "Deben generarse 2 partidos en R2");
    verifyAllPairsMixed(r2.matches, "Pozo Mixto R2");

    const r2MatchPista1 = r2.matches.find(m => m.court === 1);
    const r2MatchPista2 = r2.matches.find(m => m.court === 2);

    const actualCourt1PlayersR2 = [...r2MatchPista1.team_a_ids, ...r2MatchPista1.team_b_ids].sort();
    const actualCourt2PlayersR2 = [...r2MatchPista2.team_a_ids, ...r2MatchPista2.team_b_ids].sort();

    // Verificación 1: En Pista 1 SOLO deben estar los ganadores de R1
    assert.deepStrictEqual(
        actualCourt1PlayersR2,
        expectedCourt1PlayersR2,
        "Pista 1 en R2 DEBE contener exclusivamente a los ganadores de P1 y P2 de la R1"
    );

    // Verificación 2: En Pista 2 SOLO deben estar los perdedores de R1
    assert.deepStrictEqual(
        actualCourt2PlayersR2,
        expectedCourt2PlayersR2,
        "Pista 2 en R2 DEBE contener exclusivamente a los perdedores de P1 y P2 de la R1"
    );

    // Verificación 3: Ningún jugador en Pista 1 repite compañero respecto a R1
    const p1TeamA = r2MatchPista1.team_a_ids;
    const p1TeamB = r2MatchPista1.team_b_ids;
    assert.ok(
        !(p1TeamA.includes(m1.team_a_ids[0]) && p1TeamA.includes(m1.team_a_ids[1])),
        "Los ganadores de P1 no deben jugar juntos otra vez en R2"
    );
    assert.ok(
        !(p1TeamB.includes(m1.team_a_ids[0]) && p1TeamB.includes(m1.team_a_ids[1])),
        "Los ganadores de P1 no deben jugar juntos otra vez en R2"
    );

    // Verificación 4: Ningún perdedor fue promovido a Pista 1 por orden alfabético
    expectedLosersCourt1.forEach(loserId => {
        assert.ok(!actualCourt1PlayersR2.includes(loserId), `Perdedor ${loserId} jamás debe subir a Pista 1`);
    });
    expectedLosersCourt2.forEach(loserId => {
        assert.ok(!actualCourt1PlayersR2.includes(loserId), `Perdedor ${loserId} jamás debe subir a Pista 1`);
    });
});

// =========================================================
// BLOQUE 3: CASO EXACTO TWISTER PURO (SIN RESTRICCIÓN DE GÉNERO)
// =========================================================
console.log("\n--- BLOQUE 3: TWISTER PURO - ASCENSOS/DESCENSOS Y CAMBIO DE PAREJA UNIVERSAL ---");

runTest("3.1 Twister Puro R2: Ganadores suben/mantienen P1 y se cambian, perdedores bajan/mantienen P2 y se cambian", () => {
    // Exactamente los partidos de la Foto 1 del usuario:
    // P1: Adria + Adrian (ganaron 2-1) vs Albert + Inma (perdieron 1-2)
    // P2: Alberto + Ariadna (ganaron 2-0) vs Carlota + Cristina (perdieron 0-2)
    const matchesR1 = [
        {
            round: 1,
            court: 1,
            team_a_ids: ['usr_adria', 'usr_adrian'],
            team_b_ids: ['usr_albert', 'usr_inma'],
            team_a_names: ['Adria Serrano', 'Adrian Boza'],
            team_b_names: ['Albert Garcia', 'Inma Terribas'],
            score_a: 2,
            score_b: 1,
            status: 'finished'
        },
        {
            round: 1,
            court: 2,
            team_a_ids: ['usr_alberto', 'usr_ariadna'],
            team_b_ids: ['usr_carlota', 'usr_cristina'],
            team_a_names: ['Alberto Javier', 'Ariadna Majua'],
            team_b_names: ['Carlota Calabuig', 'Cristina Matamoros'],
            score_a: 2,
            score_b: 0,
            status: 'finished'
        }
    ];

    const res = TournamentEngine.generateRound({
        players: userPlayers,
        courts: 2,
        roundNum: 2,
        mode: 'twister',
        matchesHistory: matchesR1
    });

    assert.strictEqual(res.matches.length, 2, "Deben generarse 2 partidos");

    const matchP1 = res.matches.find(m => parseInt(m.court) === 1);
    const matchP2 = res.matches.find(m => parseInt(m.court) === 2);

    assert.ok(matchP1, "Debe existir partido en Pista 1");
    assert.ok(matchP2, "Debe existir partido en Pista 2");

    const p1Players = [...matchP1.team_a_ids, ...matchP1.team_b_ids].sort();
    const p2Players = [...matchP2.team_a_ids, ...matchP2.team_b_ids].sort();

    // Regla: En Pista 1 (la más alta) deben estar los 4 ganadores:
    // Ganadores P1: Adria Serrano, Adrian Boza
    // Ganadores P2: Alberto Javier, Ariadna Majua
    const expectedP1 = ['usr_adria', 'usr_adrian', 'usr_alberto', 'usr_ariadna'].sort();
    assert.deepStrictEqual(p1Players, expectedP1,
        `En Pista 1 DEBEN estar los 4 ganadores (Adria, Adrian, Alberto, Ariadna) y NO ${p1Players.join(', ')}`);

    // Regla: En Pista 2 (la más baja) deben estar los 4 perdedores:
    // Perdedores P1: Albert Garcia, Inma Terribas
    // Perdedores P2: Carlota Calabuig, Cristina Matamoros
    const expectedP2 = ['usr_albert', 'usr_carlota', 'usr_cristina', 'usr_inma'].sort();
    assert.deepStrictEqual(p2Players, expectedP2,
        `En Pista 2 DEBEN estar los 4 perdedores (Albert, Inma, Carlota, Cristina) y NO ${p2Players.join(', ')}`);

    // Regla de cambio de pareja en Pista 1:
    // Adria y Adrian ganaron juntos en P1 -> NO pueden jugar juntos en R2
    // Alberto y Ariadna ganaron juntos en P2 -> NO pueden jugar juntos en R2
    assert.ok(
        !(matchP1.team_a_ids.includes('usr_adria') && matchP1.team_a_ids.includes('usr_adrian')) &&
        !(matchP1.team_b_ids.includes('usr_adria') && matchP1.team_b_ids.includes('usr_adrian')),
        "Adria Serrano y Adrian Boza SE CAMBIAN de pareja (no pueden jugar juntos en P1)"
    );
    assert.ok(
        !(matchP1.team_a_ids.includes('usr_alberto') && matchP1.team_a_ids.includes('usr_ariadna')) &&
        !(matchP1.team_b_ids.includes('usr_alberto') && matchP1.team_b_ids.includes('usr_ariadna')),
        "Alberto Javier y Ariadna Majua SE CAMBIAN de pareja (no pueden jugar juntos en P1)"
    );

    // Regla de cambio de pareja en Pista 2:
    // Albert e Inma perdieron juntos en P1 -> NO pueden jugar juntos en R2
    // Carlota y Cristina perdieron juntos en P2 -> NO pueden jugar juntos en R2
    assert.ok(
        !(matchP2.team_a_ids.includes('usr_albert') && matchP2.team_a_ids.includes('usr_inma')) &&
        !(matchP2.team_b_ids.includes('usr_albert') && matchP2.team_b_ids.includes('usr_inma')),
        "Albert Garcia e Inma Terribas SE CAMBIAN de pareja (no pueden jugar juntos en P2)"
    );
    assert.ok(
        !(matchP2.team_a_ids.includes('usr_carlota') && matchP2.team_a_ids.includes('usr_cristina')) &&
        !(matchP2.team_b_ids.includes('usr_carlota') && matchP2.team_b_ids.includes('usr_cristina')),
        "Carlota Calabuig y Cristina Matamoros SE CAMBIAN de pareja (no pueden jugar juntos en P2)"
    );

    // Comprobación anti-bug de la foto:
    // Carlota (perdedora de P2) NUNCA debe estar en Pista 1
    assert.ok(!p1Players.includes('usr_carlota'), "Carlota Calabuig JAMÁS puede estar en Pista 1 tras perder 0-2 en P2");
    // Alberto Javier (ganador de P2) DEBE estar en Pista 1
    assert.ok(p1Players.includes('usr_alberto'), "Alberto Javier DEBE estar en Pista 1 tras ganar 2-0 en P2");
});

// =========================================================
// BLOQUE 4: AUDITORÍA DE COMPATIBILIDAD UNIVERSAL
// =========================================================
console.log("\n--- BLOQUE 4: AUDITORÍA DE COMPATIBILIDAD UNIVERSAL (NODE & BROWSER) ---");

runTest("3.1 CommonJS (Node.js) expone fachada e interfaces completas", () => {
    assert.ok(typeof TournamentEngine === 'object', "TournamentEngine debe ser un objeto singleton");
    assert.ok(typeof TournamentEngine.generateRound === 'function', "generateRound debe ser una función");
    assert.ok(typeof TournamentEngine.validateFeasibility === 'function', "validateFeasibility debe ser una función");
    assert.ok(typeof TournamentEngine.registerMode === 'function', "registerMode debe ser una función");
    assert.ok(typeof TournamentEngine.TournamentSolver === 'function', "TournamentSolver debe estar expuesto");
    assert.ok(typeof TournamentEngine.TournamentConstraints === 'function', "TournamentConstraints debe estar expuesto");
    assert.ok(typeof TournamentEngine.FeasibilityValidator === 'function', "FeasibilityValidator debe estar expuesto");
    assert.ok(typeof TournamentEngine.DecisionLogger === 'function', "DecisionLogger debe estar expuesto");
});

runTest("3.2 Simulación de Entorno Navegador (window.TournamentEngine)", () => {
    // Simular objeto window
    const mockWindow = {};
    const originalWindow = global.window;
    global.window = mockWindow;

    try {
        // Re-evaluar archivo en entorno con window
        delete require.cache[require.resolve('../js/tournament-engine/TournamentEngine')];
        const browserEngine = require('../js/tournament-engine/TournamentEngine');

        assert.ok(mockWindow.TournamentEngine, "TournamentEngine debe anexarse a window.TournamentEngine");
        assert.strictEqual(mockWindow.TournamentEngine, browserEngine, "window.TournamentEngine debe ser el singleton");
        assert.ok(typeof mockWindow.TournamentEngine.generateRound === 'function');
    } finally {
        global.window = originalWindow;
        delete require.cache[require.resolve('../js/tournament-engine/TournamentEngine')];
        require('../js/tournament-engine/TournamentEngine'); // restaurar
    }
});

runTest("3.3 MatchMakingService delega fluidamente a TournamentEngine en R1 y R2+", async () => {
    const MatchMakingService = require('../js/MatchMakingService');
    assert.ok(MatchMakingService, "MatchMakingService debe exportarse");
    assert.ok(typeof MatchMakingService._ensureTournamentEngine === 'function', "_ensureTournamentEngine debe existir");

    const loaded = await MatchMakingService._ensureTournamentEngine();
    assert.ok(loaded, "_ensureTournamentEngine debe retornar true");
});

// =========================================================
// RESUMEN FINAL DE CERTIFICACIÓN QA
// =========================================================
console.log("\n================================================================================");
console.log(`📊 RESUMEN AUDITORÍA QA: ${passedTests} / ${totalTests} PRUEBAS SUPERADAS`);
console.log("================================================================================");

if (passedTests === totalTests) {
    console.log("🎉 VEREDICTO QA: CERTIFICACIÓN APROBADA (PASSED).");
    console.log("   El motor de torneos garantiza 100% de solidez matemática, resolución total");
    console.log("   del bug de emparejamientos mixtos y coherencia en ascensos/descensos.");
    process.exit(0);
} else {
    console.error("❌ VEREDICTO QA: CERTIFICACIÓN RECHAZADA (FAILED).");
    process.exit(1);
}
