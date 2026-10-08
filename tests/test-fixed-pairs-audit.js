const assert = require('assert');
const { FixedPairsLogic } = require('../js/fixed-pairs-logic');

console.log("=================================================");
console.log("🧪 AUDITORÍA COMPLETA DE MODALIDAD PAREJA FIJA");
console.log("=================================================");

// --- CASO 1: 8 Jugadores (4 Parejas, 2 Pistas) ---
console.log("\n📋 TEST 1: 8 Jugadores (4 parejas, 2 pistas, 4 rondas)...");

const players8 = [
    { id: 'p1', name: 'Jugador 1', level: 4.0 },
    { id: 'p2', name: 'Jugador 2', level: 4.0 },
    { id: 'p3', name: 'Jugador 3', level: 3.5 },
    { id: 'p4', name: 'Jugador 4', level: 3.5 },
    { id: 'p5', name: 'Jugador 5', level: 3.0 },
    { id: 'p6', name: 'Jugador 6', level: 3.0 },
    { id: 'p7', name: 'Jugador 7', level: 2.5 },
    { id: 'p8', name: 'Jugador 8', level: 2.5 }
];

let pairs = FixedPairsLogic.createFixedPairs(players8, 'open', true);
assert.strictEqual(pairs.length, 4, "Deben generarse 4 parejas fijas");

// Verificar que las parejas tienen pista 1 o 2
assert.strictEqual(pairs[0].current_court, 1);
assert.strictEqual(pairs[1].current_court, 1);
assert.strictEqual(pairs[2].current_court, 2);
assert.strictEqual(pairs[3].current_court, 2);

// Ronda 1
let r1Matches = FixedPairsLogic.generatePozoRound(pairs, 1, 2);
console.log("R1 Matches:", r1Matches.map(m => `P${m.court}: ${m.teamA} vs ${m.teamB}`));
assert.strictEqual(r1Matches.length, 2, "R1 debe tener 2 partidos");

// Simular resultados R1:
// Pista 1: Pareja 0 (gana 6-2) vs Pareja 1 (pierde)
// Pista 2: Pareja 2 (gana 6-1) vs Pareja 3 (pierde)
r1Matches[0].score_a = 6;
r1Matches[0].score_b = 2;
r1Matches[0].status = 'finished';

r1Matches[1].score_a = 6;
r1Matches[1].score_b = 1;
r1Matches[1].status = 'finished';

// Actualizar rankings tras R1
pairs = FixedPairsLogic.updatePozoRankings(pairs, r1Matches, 2);

console.log("Pistas tras R1:", pairs.map(p => `${p.pair_name}: P${p.current_court}`));

// Comprobaciones esperadas:
// Pareja 0: Ganó P1 -> Se queda en P1
// Pareja 1: Perdió P1 -> Baja a P2
// Pareja 2: Ganó P2 -> Sube a P1
// Pareja 3: Perdió P2 -> Se queda en P2
const p0 = pairs.find(p => p.player1_id === 'p1');
const p1 = pairs.find(p => p.player1_id === 'p3');
const p2 = pairs.find(p => p.player1_id === 'p5');
const p3 = pairs.find(p => p.player1_id === 'p7');

assert.strictEqual(p0.current_court, 1, "Ganador P1 debe quedarse en P1");
assert.strictEqual(p2.current_court, 1, "Ganador P2 debe subir a P1");
assert.strictEqual(p1.current_court, 2, "Perdedor P1 debe bajar a P2");
assert.strictEqual(p3.current_court, 2, "Perdedor P2 debe quedarse en P2");

// Ronda 2
let r2Matches = FixedPairsLogic.generatePozoRound(pairs, 2, 2);
console.log("R2 Matches:", r2Matches.map(m => `P${m.court}: ${m.teamA} vs ${m.teamB}`));

const r2p1 = r2Matches.find(m => m.court === 1);
const r2p2 = r2Matches.find(m => m.court === 2);

assert.ok(
    (r2p1.pair_a_id === p0.id && r2p1.pair_b_id === p2.id) ||
    (r2p1.pair_a_id === p2.id && r2p1.pair_b_id === p0.id),
    "En Pista 1 deben enfrentarse los 2 ganadores (Pareja 0 vs Pareja 2)"
);

assert.ok(
    (r2p2.pair_a_id === p1.id && r2p2.pair_b_id === p3.id) ||
    (r2p2.pair_a_id === p3.id && r2p2.pair_b_id === p1.id),
    "En Pista 2 deben enfrentarse los 2 perdedores (Pareja 1 vs Pareja 3)"
);

console.log("✅ TEST 1 Superado: 8 jugadores en 2 pistas funciona al 100%");


// --- CASO 2: 12 Jugadores (6 Parejas, 3 Pistas) ---
console.log("\n📋 TEST 2: 12 Jugadores (6 parejas, 3 pistas)...");

const players12 = Array.from({ length: 12 }, (_, i) => ({
    id: `usr_${i + 1}`,
    name: `Jugador ${i + 1}`,
    level: 4.0 - (i * 0.1)
}));

let pairs12 = FixedPairsLogic.createFixedPairs(players12, 'open', true);
assert.strictEqual(pairs12.length, 6, "Deben generarse 6 parejas fijas");

let r1_12 = FixedPairsLogic.generatePozoRound(pairs12, 1, 3);
assert.strictEqual(r1_12.length, 3, "Deben generarse 3 partidos");

// Simular resultados:
// P1: Pareja 0 gana a Pareja 1 (6-3) -> W1 = Pareja 0, L1 = Pareja 1
// P2: Pareja 2 gana a Pareja 3 (6-4) -> W2 = Pareja 2, L2 = Pareja 3
// P3: Pareja 4 gana a Pareja 5 (6-2) -> W3 = Pareja 4, L3 = Pareja 5
r1_12[0].score_a = 6; r1_12[0].score_b = 3; r1_12[0].status = 'finished';
r1_12[1].score_a = 6; r1_12[1].score_b = 4; r1_12[1].status = 'finished';
r1_12[2].score_a = 6; r1_12[2].score_b = 2; r1_12[2].status = 'finished';

pairs12 = FixedPairsLogic.updatePozoRankings(pairs12, r1_12, 3);
console.log("Pistas tras R1 (3 pistas):", pairs12.map(p => `${p.pair_name}: P${p.current_court}`));

const w1 = pairs12.find(p => p.id === r1_12[0].pair_a_id);
const l1 = pairs12.find(p => p.id === r1_12[0].pair_b_id);
const w2 = pairs12.find(p => p.id === r1_12[1].pair_a_id);
const l2 = pairs12.find(p => p.id === r1_12[1].pair_b_id);
const w3 = pairs12.find(p => p.id === r1_12[2].pair_a_id);
const l3 = pairs12.find(p => p.id === r1_12[2].pair_b_id);

assert.strictEqual(w1.current_court, 1, "W1 debe quedarse en P1");
assert.strictEqual(w2.current_court, 1, "W2 debe subir a P1");
assert.strictEqual(l1.current_court, 2, "L1 debe bajar a P2");
assert.strictEqual(w3.current_court, 2, "W3 debe subir a P2");
assert.strictEqual(l2.current_court, 3, "L2 debe bajar a P3");
assert.strictEqual(l3.current_court, 3, "L3 debe quedarse en P3");

let r2_12 = FixedPairsLogic.generatePozoRound(pairs12, 2, 3);
console.log("R2 Matches (3 pistas):", r2_12.map(m => `P${m.court}: ${m.teamA} vs ${m.teamB}`));

const r2_12_p1 = r2_12.find(m => m.court === 1);
const r2_12_p2 = r2_12.find(m => m.court === 2);
const r2_12_p3 = r2_12.find(m => m.court === 3);

assert.ok([r2_12_p1.pair_a_id, r2_12_p1.pair_b_id].includes(w1.id) && [r2_12_p1.pair_a_id, r2_12_p1.pair_b_id].includes(w2.id), "P1 tiene W1 y W2");
assert.ok([r2_12_p2.pair_a_id, r2_12_p2.pair_b_id].includes(l1.id) && [r2_12_p2.pair_a_id, r2_12_p2.pair_b_id].includes(w3.id), "P2 tiene L1 y W3");
assert.ok([r2_12_p3.pair_a_id, r2_12_p3.pair_b_id].includes(l2.id) && [r2_12_p3.pair_a_id, r2_12_p3.pair_b_id].includes(l3.id), "P3 tiene L2 y L3");

console.log("✅ TEST 2 Superado: 12 jugadores en 3 pistas funciona al 100%");


// --- CASO 3: Verificación de Integridad de Parejas (LOS COMPAÑEROS NUNCA SE SEPARAN) ---
console.log("\n📋 TEST 3: Verificación de Invariante de Parejas Fijas...");
[...r1Matches, ...r2Matches, ...r1_12, ...r2_12].forEach(m => {
    assert.strictEqual(m.team_a_ids.length, 2, `Team A en P${m.court} debe tener 2 jugadores`);
    assert.strictEqual(m.team_b_ids.length, 2, `Team B en P${m.court} debe tener 2 jugadores`);
    
    // Verificar que los 2 jugadores de Team A forman una pareja existente
    const pairA = pairs.find(p => p.player1_id === m.team_a_ids[0] && p.player2_id === m.team_a_ids[1]) ||
                  pairs12.find(p => p.player1_id === m.team_a_ids[0] && p.player2_id === m.team_a_ids[1]);
    assert.ok(pairA, `Los jugadores de Team A ${m.team_a_names} deben ser una pareja fija válida`);
    
    const pairB = pairs.find(p => p.player1_id === m.team_b_ids[0] && p.player2_id === m.team_b_ids[1]) ||
                  pairs12.find(p => p.player1_id === m.team_b_ids[0] && p.player2_id === m.team_b_ids[1]);
    assert.ok(pairB, `Los jugadores de Team B ${m.team_b_names} deben ser una pareja fija válida`);
});

console.log("✅ TEST 3 Superado: Invariante de compañeros fijos 100% respetada.");
