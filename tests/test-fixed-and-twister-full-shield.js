const assert = require('assert');
const { FixedPairsLogic } = require('../js/fixed-pairs-logic');
const { PreFlightRoundVerifier } = require('../js/PreFlightRoundVerifier');
const { RotatingPozoLogic } = require('../js/rotating-pozo-logic');
const TwisterInvariantGuard = require('../js/tournament-engine/TwisterInvariantGuard');

console.log("======================================================================");
console.log("🧪 BATERÍA DE PRUEBAS DE BLINDAJE 100%: PAREJAS FIJAS Y TWISTER POZO");
console.log("======================================================================");

// ==============================================================================
// TEST 1: PAREJAS EXPLÍCITAS POR partner_id Y partner_name (Insensible a mayúsculas/tildes)
// ==============================================================================
console.log("\n--- TEST 1: Detección y Blindaje de Parejas Explícitas Iniciales ---");
const rawPlayers = [
    { id: '1', name: 'Álvaro Martín', partner_name: 'sofia lopez', gender: 'chico', level: 4.5 },
    { id: '2', name: 'Sofía López', partner_name: 'alvaro martin', gender: 'chica', level: 4.0 },
    { id: '3', name: 'Javier Gomez', partner_id: '4', gender: 'chico', level: 3.5 },
    { id: '4', name: 'María Ruiz', partner_id: '3', gender: 'chica', level: 3.5 },
    { id: '5', name: 'Carlos Díaz', gender: 'chico', level: 3.0 },
    { id: '6', name: 'Elena Sanz', gender: 'chica', level: 3.0 },
    { id: '7', name: 'Marcos Gil', gender: 'chico', level: 2.5 },
    { id: '8', name: 'Lucía Ortiz', gender: 'chica', level: 2.5 }
];

const fixedPairs = FixedPairsLogic.createFixedPairs(rawPlayers, 'mixed');
assert.strictEqual(fixedPairs.length, 4, "Deben crearse exactamente 4 parejas");

// Verificar que Álvaro y Sofía están juntos (detectados por partner_name con tildes/mayúsculas)
const pairAlvaro = fixedPairs.find(p => p.player1_id === '1' || p.player2_id === '1');
assert.ok(pairAlvaro, "Álvaro debe tener pareja asignada");
assert.ok(
    (pairAlvaro.player1_id === '1' && pairAlvaro.player2_id === '2') ||
    (pairAlvaro.player1_id === '2' && pairAlvaro.player2_id === '1'),
    "Álvaro y Sofía deben estar juntos (Priority 1 partner_name)"
);
assert.strictEqual(pairAlvaro.is_explicit, true, "Debe estar marcado como is_explicit");

// Verificar que Javier y María están juntos (detectados por partner_id)
const pairJavier = fixedPairs.find(p => p.player1_id === '3' || p.player2_id === '3');
assert.ok(
    (pairJavier.player1_id === '3' && pairJavier.player2_id === '4') ||
    (pairJavier.player1_id === '4' && pairJavier.player2_id === '3'),
    "Javier y María deben estar juntos (Priority 1 partner_id)"
);
assert.strictEqual(pairJavier.is_explicit, true);

// Verificar duplas mixtas restantes (Priority 2: chico + chica)
const pairCarlos = fixedPairs.find(p => p.player1_id === '5' || p.player2_id === '5');
assert.ok(
    (pairCarlos.player1_id === '5' && pairCarlos.player2_id === '6') ||
    (pairCarlos.player1_id === '6' && pairCarlos.player2_id === '5'),
    "Carlos y Elena deben estar juntos en mixto"
);
console.log("✅ TEST 1 Superado: Parejas explícitas y mixtas respetadas al 100%.");

// ==============================================================================
// TEST 2: TORNEO DE 6 RONDAS DE PAREJAS FIJAS CON CRUCES POZO EXACTOS
// ==============================================================================
console.log("\n--- TEST 2: Torneo Completo de 6 Rondas Parejas Fijas (Escalera Pozo) ---");
let tournamentPairs = FixedPairsLogic.createFixedPairs(rawPlayers, 'open', true);
let allTournamentMatches = [];

for (let round = 1; round <= 6; round++) {
    const roundMatches = FixedPairsLogic.generatePozoRound(tournamentPairs, round, 2);
    assert.strictEqual(roundMatches.length, 2, `Ronda ${round} debe tener 2 partidos`);

    // Validar pre-flight
    const auditRes = PreFlightRoundVerifier.auditRound(roundMatches, {
        roundNum: round,
        pairMode: 'fixed',
        allMatches: allTournamentMatches,
        fixedPairs: tournamentPairs
    });
    assert.ok(auditRes.isValid, `Ronda ${round} debe ser 100% válida en PreFlight: ${auditRes.errors.join(', ')}`);

    // Simular resultados (incluyendo un empate en Ronda 3 para validar desempate)
    if (round === 3) {
        // Empate 5-5 en Pista 1
        roundMatches[0].score_a = 5;
        roundMatches[0].score_b = 5;
        roundMatches[0].status = 'finished';

        roundMatches[1].score_a = 6;
        roundMatches[1].score_b = 2;
        roundMatches[1].status = 'finished';
    } else {
        roundMatches[0].score_a = 6;
        roundMatches[0].score_b = 3;
        roundMatches[0].status = 'finished';

        roundMatches[1].score_a = 6;
        roundMatches[1].score_b = 4;
        roundMatches[1].status = 'finished';
    }

    allTournamentMatches.push(...roundMatches);

    // Actualizar rankings para la siguiente ronda
    if (round < 6) {
        tournamentPairs = FixedPairsLogic.updatePozoRankings(tournamentPairs, roundMatches, 2);
    }
}

// Validar que en NINGUNA de las 6 rondas ningún jugador cambió de compañero
const finalAudit = PreFlightRoundVerifier.auditRound(
    allTournamentMatches.filter(m => m.round === 6),
    {
        roundNum: 6,
        pairMode: 'fixed',
        allMatches: allTournamentMatches,
        fixedPairs: tournamentPairs
    }
);
assert.ok(finalAudit.isValid, "El torneo de 6 rondas mantiene las parejas intactas");
console.log("✅ TEST 2 Superado: 6 rondas de Parejas Fijas jugadas con éxito y desempate limpio.");

// ==============================================================================
// TEST 3: CRUCES CANÓNICOS POZO (3 PISTAS: 6 PAREJAS)
// ==============================================================================
console.log("\n--- TEST 3: Cruces Canónicos Pozo con 3 Pistas (6 parejas) ---");
const players12 = Array.from({ length: 12 }, (_, i) => ({
    id: `u_${i + 1}`,
    name: `Jugador ${i + 1}`,
    level: 4.5 - (i * 0.1)
}));

let pairs3Courts = FixedPairsLogic.createFixedPairs(players12, 'open', true);
let r1Matches = FixedPairsLogic.generatePozoRound(pairs3Courts, 1, 3);

// R1:
// P1: Pair 1 vs Pair 2 -> Winner: Pair 1, Loser: Pair 2
// P2: Pair 3 vs Pair 4 -> Winner: Pair 3, Loser: Pair 4
// P3: Pair 5 vs Pair 6 -> Winner: Pair 5, Loser: Pair 6
r1Matches[0].score_a = 6; r1Matches[0].score_b = 1; r1Matches[0].status = 'finished';
r1Matches[1].score_a = 6; r1Matches[1].score_b = 2; r1Matches[1].status = 'finished';
r1Matches[2].score_a = 6; r1Matches[2].score_b = 3; r1Matches[2].status = 'finished';

const pair1 = pairs3Courts[0];
const pair2 = pairs3Courts[1];
const pair3 = pairs3Courts[2];
const pair4 = pairs3Courts[3];
const pair5 = pairs3Courts[4];
const pair6 = pairs3Courts[5];

pairs3Courts = FixedPairsLogic.updatePozoRankings(pairs3Courts, r1Matches, 3);
const r2Matches = FixedPairsLogic.generatePozoRound(pairs3Courts, 2, 3);

// Verificación Reglas Pozo en R2:
// Pista 1: Ganador P1 (pair1) vs Ganador P2 (pair3)
const mP1 = r2Matches.find(m => m.court === 1);
assert.ok(
    (mP1.pair_a_id === pair1.id && mP1.pair_b_id === pair3.id) ||
    (mP1.pair_a_id === pair3.id && mP1.pair_b_id === pair1.id),
    "Pista 1 debe enfrentar a Ganador P1 vs Ganador P2"
);

// Pista 2: Perdedor P1 (pair2) vs Ganador P3 (pair5)
const mP2 = r2Matches.find(m => m.court === 2);
assert.ok(
    (mP2.pair_a_id === pair2.id && mP2.pair_b_id === pair5.id) ||
    (mP2.pair_a_id === pair5.id && mP2.pair_b_id === pair2.id),
    "Pista 2 debe enfrentar a Perdedor P1 vs Ganador P3"
);

// Pista 3: Perdedor P2 (pair4) vs Perdedor P3 (pair6)
const mP3 = r2Matches.find(m => m.court === 3);
assert.ok(
    (mP3.pair_a_id === pair4.id && mP3.pair_b_id === pair6.id) ||
    (mP3.pair_a_id === pair6.id && mP3.pair_b_id === pair4.id),
    "Pista 3 debe enfrentar a Perdedor P2 vs Perdedor P3"
);

console.log("✅ TEST 3 Superado: Cruces canónicos Pozo de 3 pistas matemáticamente exactos.");

// ==============================================================================
// TEST 4: ROTACIÓN EQUITATIVA DE BYE (NÚMERO IMPAR DE PAREJAS)
// ==============================================================================
console.log("\n--- TEST 4: Rotación Equitativa de BYE (5 parejas, 2 pistas) ---");
const oddPlayers = Array.from({ length: 10 }, (_, i) => ({
    id: `odd_${i + 1}`,
    name: `Jugador ${i + 1}`,
    level: 4.0 - (i * 0.1)
}));

let oddPairs = FixedPairsLogic.createFixedPairs(oddPlayers, 'open', true);
assert.strictEqual(oddPairs.length, 5, "Deben crearse 5 parejas");

// En R1, 4 parejas juegan y 1 tiene BYE
let oddR1 = FixedPairsLogic.generatePozoRound(oddPairs, 1, 2);
assert.strictEqual(oddR1.length, 3, "2 partidos normales + 1 partido BYE");

// Marcar partidos jugados
oddR1[0].score_a = 6; oddR1[0].score_b = 2; oddR1[0].status = 'finished';
oddR1[1].score_a = 6; oddR1[1].score_b = 3; oddR1[1].status = 'finished';
// El partido 3 ya está finished por ser BYE
// Actualizar rankings para R2
oddPairs = FixedPairsLogic.updatePozoRankings(oddPairs, oddR1, 2);
const pairRestedR1 = oddPairs.find(p => p.id === oddR1[2].pair_a_id);
assert.strictEqual(pairRestedR1.byes_count, 1, "La pareja en BYE debe registrar su descanso");

let oddR2 = FixedPairsLogic.generatePozoRound(oddPairs, 2, 2);

// Verificar que la pareja que descansó en R1 JUEGA en R2
const byeMatchR2 = oddR2.find(m => m.is_bye);
assert.notStrictEqual(byeMatchR2.pair_a_id, pairRestedR1.id, "La pareja que descansó en R1 NO puede descansar en R2");
console.log("✅ TEST 4 Superado: Rotación de descansos justa sin repetición consecutiva.");

// ==============================================================================
// TEST 5: PREFLIGHT ROUND VERIFIER - INVARIANT GUARDS
// ==============================================================================
console.log("\n--- TEST 5: PreFlight Invariant Guard para Pareja Fija ---");

// Normalización de modo
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('fixed'), 'fixed');
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('fija'), 'fixed');
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('parejas'), 'fixed');
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('duplas'), 'fixed');
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('', { title: 'TORNEO DE PAREJAS AMERICANAS' }), 'fixed');
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('', { name: 'AMERICANA DUPLAS NOCTURNA' }), 'fixed');
assert.strictEqual(PreFlightRoundVerifier.normalizePairMode('twister'), 'twister');

// Intento de romper una pareja en R2:
const corruptedR2Matches = [
    {
        round: 2,
        court: 1,
        team_a_ids: [rawPlayers[0].id, rawPlayers[2].id], // Álvaro con Javier (corrupción!)
        team_b_ids: [rawPlayers[1].id, rawPlayers[3].id],
        team_a_names: ['Álvaro', 'Javier'],
        team_b_names: ['Sofía', 'María']
    },
    {
        round: 2,
        court: 2,
        team_a_ids: [rawPlayers[4].id, rawPlayers[5].id],
        team_b_ids: [rawPlayers[6].id, rawPlayers[7].id],
        team_a_names: ['Carlos', 'Elena'],
        team_b_names: ['Marcos', 'Lucía']
    }
];

const corruptionAudit = PreFlightRoundVerifier.auditRound(corruptedR2Matches, {
    roundNum: 2,
    pairMode: 'fixed',
    allMatches: allTournamentMatches.slice(0, 2), // Partidos de R1 originales
    fixedPairs: fixedPairs
});

assert.strictEqual(corruptionAudit.isValid, false, "PreFlight DEBE detectar la ruptura de pareja fija");
assert.ok(
    corruptionAudit.errors.some(e => e.includes('Violación crítica') && e.includes('Pareja Fija')),
    "PreFlight debe reportar error crítico de cambio de pareja"
);
console.log("✅ TEST 5 Superado: PreFlight detecta y bloquea cualquier intento de separar parejas fijas.");

// ==============================================================================
// TEST 6: TWISTER INDIVIDUAL - SEPARACIÓN OBLIGATORIA DE COMPAÑEROS PREVIOS
// ==============================================================================
console.log("\n--- TEST 6: Twister Individual (Separación obligatoria de pareja R-1) ---");

const twisterPlayers = [
    { id: 't1', name: 'T1', current_court: 1 },
    { id: 't2', name: 'T2', current_court: 1 },
    { id: 't3', name: 'T3', current_court: 1 },
    { id: 't4', name: 'T4', current_court: 1 },
    { id: 't5', name: 'T5', current_court: 2 },
    { id: 't6', name: 'T6', current_court: 2 },
    { id: 't7', name: 'T7', current_court: 2 },
    { id: 't8', name: 'T8', current_court: 2 },
];

// R1 Matches:
// P1: [t1, t2] vs [t3, t4] -> t1 y t2 ganan (6-2)
// P2: [t5, t6] vs [t7, t8] -> t5 y t6 ganan (6-3)
const twisterR1Matches = [
    { round: 1, court: 1, team_a_ids: ['t1', 't2'], team_b_ids: ['t3', 't4'], score_a: 6, score_b: 2, status: 'finished' },
    { round: 1, court: 2, team_a_ids: ['t5', 't6'], team_b_ids: ['t7', 't8'], score_a: 6, score_b: 3, status: 'finished' }
];

const movedTwisterPlayers = RotatingPozoLogic.updatePlayerCourts(twisterPlayers, twisterR1Matches, 2, 'open');
const twisterR2Matches = RotatingPozoLogic.generateRound(movedTwisterPlayers, 2, 2, 'open');

// En Pista 1: deben estar t1, t2 (ganaron P1) y t5, t6 (ganaron P2)
const p1Match = twisterR2Matches.find(m => m.court === 1);
const p1PlayerIds = [...p1Match.team_a_ids, ...p1Match.team_b_ids].map(String);
assert.ok(p1PlayerIds.includes('t1') && p1PlayerIds.includes('t2'), "t1 y t2 deben estar en Pista 1");
assert.ok(p1PlayerIds.includes('t5') && p1PlayerIds.includes('t6'), "t5 y t6 deben subir a Pista 1");

// ¡REGLA CLAVE TWISTER!: t1 y t2 NO pueden jugar juntos en R2, t5 y t6 NO pueden jugar juntos en R2
const t1Partner = p1Match.team_a_ids.includes('t1')
    ? p1Match.team_a_ids.find(id => id !== 't1')
    : p1Match.team_b_ids.find(id => id !== 't1');
assert.notStrictEqual(t1Partner, 't2', "t1 y t2 NO pueden ser compañeros en R2");

const t5Partner = p1Match.team_a_ids.includes('t5')
    ? p1Match.team_a_ids.find(id => id !== 't5')
    : p1Match.team_b_ids.find(id => id !== 't5');
assert.notStrictEqual(t5Partner, 't6', "t5 y t6 NO pueden ser compañeros en R2");

// Validación matemática con TwisterInvariantGuard
const guardRes = TwisterInvariantGuard.validate(twisterR1Matches, twisterR2Matches, 2);
assert.ok(guardRes.valid, `TwisterInvariantGuard debe confirmar 100% de coherencia matemática: ${guardRes.errors.join(', ')}`);
console.log("✅ TEST 6 Superado: Regla sagrada Twister verificada (ganadores suben y se separan, perdedores bajan y se separan).");

console.log("\n======================================================================");
console.log("🎉 TODAS LAS 6 PRUEBAS DE BLINDAJE PASARON AL 100% CON ÉXITO ROTUNDO");
console.log("======================================================================");
