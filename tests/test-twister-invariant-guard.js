/**
 * test-twister-invariant-guard.js
 * 
 * Suite de Pruebas de Calidad Élite para:
 * 1. Caso exacto del usuario (Álvaro / Anaïs ganan P1, Adrià / Anas ganan P2)
 * 2. Detección y rechazo de empates (Anti-empate estricto)
 * 3. Detección de anomalías por TwisterInvariantGuard (rechazo de resultados invertidos)
 * 4. Property-based testing de 200 iteraciones sobre 6 rondas encadenadas (8, 12 y 16 jugadores)
 * 5. Manejo con descansos (10 jugadores, 2 pistas)
 */

const assert = require('assert');
const Engine = require('../js/tournament-engine/TournamentEngine');
const TwisterInvariantGuard = require('../js/tournament-engine/TwisterInvariantGuard');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASSED: ${name}`);
        testsPassed++;
    } catch (e) {
        console.error(`  ❌ FAILED: ${name}`);
        console.error(`     Error: ${e.message}`);
        testsFailed++;
    }
}

console.log('🧪 ========================================================');
console.log('🧪 EJECUTANDO SUITE DE TESTS: TWISTER INVARIANT GUARD');
console.log('🧪 ========================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Caso exacto del usuario reportado en el pantallazo
// -----------------------------------------------------------------------------
runTest('Caso de producción: Álvaro y Anaïs ganan P1 (2-5), Adrià y Anas ganan P2 (4-0)', () => {
    const players = [
        { id: 'adrian', name: 'Adrian Muñoz', level: 3.5, current_court: 1 },
        { id: 'agata', name: 'Agata del Real', level: 3.5, current_court: 1 },
        { id: 'alvaro', name: 'Alvaro Fernandez', level: 3.5, current_court: 1 },
        { id: 'anais', name: 'Anaïs Grebot', level: 3.5, current_court: 1 },
        { id: 'adria', name: 'Adria Serrano', level: 3.5, current_court: 2 },
        { id: 'anas', name: 'Anas Jd', level: 3.5, current_court: 2 },
        { id: 'alex', name: 'Alex Martínez', level: 3.5, current_court: 2 },
        { id: 'arnau', name: 'Arnau Santamaria', level: 3.5, current_court: 2 }
    ];

    const r1Matches = [
        {
            round: 1,
            court: 1,
            team_a_ids: ['adrian', 'agata'],
            team_b_ids: ['alvaro', 'anais'],
            score_a: 2,
            score_b: 5,
            status: 'finished'
        },
        {
            round: 1,
            court: 2,
            team_a_ids: ['adria', 'anas'],
            team_b_ids: ['alex', 'arnau'],
            score_a: 4,
            score_b: 0,
            status: 'finished'
        }
    ];

    const r2Result = Engine.generateRound({
        players,
        courts: 2,
        roundNum: 2,
        mode: 'twister',
        matchesHistory: r1Matches,
        options: { isMixed: true }
    });

    assert(r2Result && r2Result.matches && r2Result.matches.length === 2, 'Deben generarse 2 partidos');

    const mP1 = r2Result.matches.find(m => m.court === 1);
    const mP2 = r2Result.matches.find(m => m.court === 2);

    const p1Players = [...mP1.team_a_ids, ...mP1.team_b_ids];
    const p2Players = [...mP2.team_a_ids, ...mP2.team_b_ids];

    // Verificar quién está en cada pista
    assert(p1Players.includes('alvaro'), 'Álvaro debe estar en Pista 1');
    assert(p1Players.includes('anais'), 'Anaïs debe estar en Pista 1');
    assert(p1Players.includes('adria'), 'Adrià debe estar en Pista 1');
    assert(p1Players.includes('anas'), 'Anas debe estar en Pista 1');

    assert(p2Players.includes('adrian'), 'Adrián debe estar en Pista 2');
    assert(p2Players.includes('agata'), 'Ágata debe estar en Pista 2');
    assert(p2Players.includes('alex'), 'Álex debe estar en Pista 2');
    assert(p2Players.includes('arnau'), 'Arnau debe estar en Pista 2');

    // Verificar separación estricta de parejas previas
    const alvaroTeam = mP1.team_a_ids.includes('alvaro') ? 'A' : 'B';
    const anaisTeam = mP1.team_a_ids.includes('anais') ? 'A' : 'B';
    assert.notStrictEqual(alvaroTeam, anaisTeam, 'Álvaro y Anaïs deben estar en equipos opuestos');

    const adriaTeam = mP1.team_a_ids.includes('adria') ? 'A' : 'B';
    const anasTeam = mP1.team_a_ids.includes('anas') ? 'A' : 'B';
    assert.notStrictEqual(adriaTeam, anasTeam, 'Adrià y Anas deben estar en equipos opuestos');

    const adrianTeam = mP2.team_a_ids.includes('adrian') ? 'A' : 'B';
    const agataTeam = mP2.team_a_ids.includes('agata') ? 'A' : 'B';
    assert.notStrictEqual(adrianTeam, agataTeam, 'Adrián y Ágata deben estar en equipos opuestos');

    const alexTeam = mP2.team_a_ids.includes('alex') ? 'A' : 'B';
    const arnauTeam = mP2.team_a_ids.includes('arnau') ? 'A' : 'B';
    assert.notStrictEqual(alexTeam, arnauTeam, 'Álex y Arnau deben estar en equipos opuestos');

    // Validar con el Invariant Guard
    const guardValidation = TwisterInvariantGuard.validate(r1Matches, r2Result.matches, 2);
    assert.strictEqual(guardValidation.valid, true, `Guard debe ser válido: ${guardValidation.errors.join(', ')}`);
    assert.strictEqual(guardValidation.errors.length, 0);
});

// -----------------------------------------------------------------------------
// TEST 2: Invariant Guard detecta y bloquea los emparejamientos corruptos
// -----------------------------------------------------------------------------
runTest('TwisterInvariantGuard detecta y rechaza la ronda corrupta del pantallazo antiguo', () => {
    const r1Matches = [
        { round: 1, court: 1, team_a_ids: ['adrian', 'agata'], team_b_ids: ['alvaro', 'anais'], score_a: 2, score_b: 5, status: 'finished' },
        { round: 1, court: 2, team_a_ids: ['adria', 'anas'], team_b_ids: ['alex', 'arnau'], score_a: 4, score_b: 0, status: 'finished' }
    ];

    // Ronda 2 errónea (la del pantallazo)
    const corruptR2Matches = [
        { round: 2, court: 1, team_a_ids: ['adrian', 'anas'], team_b_ids: ['adria', 'agata'] },
        { round: 2, court: 2, team_a_ids: ['alvaro', 'arnau'], team_b_ids: ['anais', 'alex'] }
    ];

    const guardValidation = TwisterInvariantGuard.validate(r1Matches, corruptR2Matches, 2);
    assert.strictEqual(guardValidation.valid, false, 'Guard debe detectar la corrupción');
    assert(guardValidation.errors.length > 0, 'Debe haber errores reportados');
    assert(guardValidation.errors.some(err => err.includes('adrian') || err.includes('Pista 1')), 'Debe reportar error con adrian o Pista 1');
});

// -----------------------------------------------------------------------------
// TEST 3: Rechazo estricto de empates en ronda previa
// -----------------------------------------------------------------------------
runTest('Bloqueo estricto cuando un partido previo está empatado (score_a === score_b)', () => {
    const players = [
        { id: 'p1', name: 'P1', current_court: 1 },
        { id: 'p2', name: 'P2', current_court: 1 },
        { id: 'p3', name: 'P3', current_court: 1 },
        { id: 'p4', name: 'P4', current_court: 1 }
    ];
    const tiedMatches = [
        { round: 1, court: 1, team_a_ids: ['p1', 'p2'], team_b_ids: ['p3', 'p4'], score_a: 3, score_b: 3, status: 'finished' }
    ];

    let threwError = false;
    try {
        Engine.generateRound({
            players,
            courts: 1,
            roundNum: 2,
            mode: 'twister',
            matchesHistory: tiedMatches
        });
    } catch (e) {
        threwError = true;
        assert(e.message.includes('ganador válido') || e.message.includes('3-3'), 'El error debe indicar la ausencia de ganador válido');
    }

    assert.strictEqual(threwError, true, 'Debe lanzar un error cuando hay empate en Twister');

    // TwisterInvariantGuard también debe rechazarlo
    const guardValidation = TwisterInvariantGuard.validate(tiedMatches, tiedMatches, 1);
    assert.strictEqual(guardValidation.valid, false);
    assert(guardValidation.errors.some(e => e.includes('ganador válido')));
});

// -----------------------------------------------------------------------------
// TEST 4: Property-Based Testing con 200 iteraciones durante 6 rondas encadenadas
// -----------------------------------------------------------------------------
runTest('Property-based testing: 200 iteraciones sobre 6 rondas consecutivas (8, 12 y 16 jugadores)', () => {
    const configs = [
        { totalPlayers: 8, courts: 2 },
        { totalPlayers: 12, courts: 3 },
        { totalPlayers: 16, courts: 4 }
    ];

    let totalRoundsValidated = 0;

    for (const cfg of configs) {
        for (let iter = 0; iter < 50; iter++) {
            const players = [];
            for (let i = 1; i <= cfg.totalPlayers; i++) {
                players.push({
                    id: `p_${i}`,
                    name: `Jugador ${i}`,
                    level: 3.0 + (i % 5) * 0.25,
                    current_court: Math.floor((i - 1) / 4) + 1
                });
            }

            let history = [];

            // Generar R1
            const r1 = Engine.generateRound({
                players,
                courts: cfg.courts,
                roundNum: 1,
                mode: 'twister',
                matchesHistory: [],
                options: { isMixed: false }
            });

            // Simular resultados aleatorios para R1
            r1.matches.forEach(m => {
                const aWins = Math.random() > 0.5;
                m.score_a = aWins ? 6 : 2;
                m.score_b = aWins ? 2 : 6;
                m.status = 'finished';
                history.push(m);
            });

            // Rondas 2 a 6 consecutivas
            for (let r = 2; r <= 6; r++) {
                const prevRoundMatches = history.filter(m => m.round === r - 1);
                const nextRound = Engine.generateRound({
                    players,
                    courts: cfg.courts,
                    roundNum: r,
                    mode: 'twister',
                    matchesHistory: history,
                    options: { isMixed: false }
                });

                // Validar invariantes matemáticos con TwisterInvariantGuard
                const guard = TwisterInvariantGuard.validate(prevRoundMatches, nextRound.matches, cfg.courts);
                assert.strictEqual(
                    guard.valid,
                    true,
                    `Iteración ${iter}, Ronda ${r}, Pistas ${cfg.courts}: Invariante violado -> ${guard.errors.join(' | ')}`
                );

                totalRoundsValidated++;

                // Simular resultados para esta ronda
                nextRound.matches.forEach(m => {
                    const aWins = Math.random() > 0.5;
                    m.score_a = aWins ? 5 : 1;
                    m.score_b = aWins ? 1 : 5;
                    m.status = 'finished';
                    history.push(m);
                });
            }
        }
    }

    console.log(`      -> Total rondas encadenadas validadas con 0 errores: ${totalRoundsValidated}`);
});

// -----------------------------------------------------------------------------
// TEST 5: Descansos (BYEs) - 10 jugadores en 2 pistas
// -----------------------------------------------------------------------------
runTest('Descansos (BYEs): 10 jugadores en 2 pistas (8 activos, 2 descansan)', () => {
    const players = [];
    for (let i = 1; i <= 10; i++) {
        players.push({
            id: `p_${i}`,
            name: `Jugador ${i}`,
            level: 3.5,
            current_court: i <= 8 ? (Math.floor((i - 1) / 4) + 1) : null
        });
    }

    // R1
    const r1 = Engine.generateRound({
        players,
        courts: 2,
        roundNum: 1,
        mode: 'twister',
        matchesHistory: []
    });

    assert.strictEqual(r1.matches.length, 2, 'Debe haber 2 pistas activas');
    assert.strictEqual(r1.restingPlayers.length, 2, 'Deben descansar 2 jugadores');

    // Marcar resultados
    const history = [];
    r1.matches.forEach(m => {
        m.score_a = 5;
        m.score_b = 2;
        m.status = 'finished';
        history.push(m);
    });

    // R2
    const r2 = Engine.generateRound({
        players,
        courts: 2,
        roundNum: 2,
        mode: 'twister',
        matchesHistory: history
    });

    assert.strictEqual(r2.matches.length, 2, 'R2 debe tener 2 pistas activas');
    assert.strictEqual(r2.restingPlayers.length, 2, 'R2 debe tener 2 descansos');

    // Comprobar que nadie se duplica entre pista y descanso
    const activeIds = new Set();
    r2.matches.forEach(m => {
        [...m.team_a_ids, ...m.team_b_ids].forEach(id => {
            assert(!activeIds.has(id), `Jugador ${id} duplicado en R2`);
            activeIds.add(id);
        });
    });

    r2.restingPlayers.forEach(p => {
        assert(!activeIds.has(p.id), `Jugador que descansa ${p.id} está activo a la vez`);
    });
});

console.log('\n========================================================');
console.log(`🏁 RESULTADOS: ${testsPassed} PASADOS | ${testsFailed} FALLADOS`);
console.log('========================================================\n');

if (testsFailed > 0) {
    process.exit(1);
}
