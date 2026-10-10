const assert = require('assert');
const { FixedPairsLogic } = require('../js/fixed-pairs-logic');

console.log("=== SIMULANDO BUG DE PAREJA FIJA REAL IN SITU ===");

// 8 jugadores (4 parejas) donde se apuntaron con partner_id (is_explicit = true)
const players = [
    { id: 'u1', name: 'Alex', partner_id: 'u2', level: 4.0 },
    { id: 'u2', name: 'Carlos', partner_id: 'u1', level: 4.0 },
    { id: 'u3', name: 'Laura', partner_id: 'u4', level: 3.5 },
    { id: 'u4', name: 'Marta', partner_id: 'u3', level: 3.5 },
    { id: 'u5', name: 'Jordi', partner_id: 'u6', level: 3.0 },
    { id: 'u6', name: 'David', partner_id: 'u6', level: 3.0 },
    { id: 'u7', name: 'Sara', partner_id: 'u8', level: 2.5 },
    { id: 'u8', name: 'Elena', partner_id: 'u7', level: 2.5 },
];

const smartPairs = FixedPairsLogic.createSmartFixedPairs(players, 'open');
console.log("Parejas iniciales creadas:", smartPairs.map(p => `${p.pair_name} (Court: ${p.current_court}, is_explicit: ${p.is_explicit})`));

const r1Matches = FixedPairsLogic.generatePozoRound(smartPairs, 1, 2);
console.log("Partidos R1:", r1Matches.map(m => `P${m.court}: ${m.teamA} vs ${m.teamB}`));

// Simular que en Pista 1 gana Alex/Carlos (6-2) y en Pista 2 gana Jordi/David (6-4)
r1Matches[0].score_a = 6;
r1Matches[0].score_b = 2;
r1Matches[0].status = 'finished';

r1Matches[1].score_a = 6;
r1Matches[1].score_b = 4;
r1Matches[1].status = 'finished';

const updatedPairs = FixedPairsLogic.updatePozoRankings(smartPairs, r1Matches, 2);
console.log("Pistas tras R1 ranking update:", updatedPairs.map(p => `${p.pair_name} -> Pista ${p.current_court}`));

const r2Matches = FixedPairsLogic.generatePozoRound(updatedPairs, 2, 2);
console.log("Partidos R2:", r2Matches.map(m => `P${m.court}: ${m.teamA} vs ${m.teamB}`));

// Ronda 2 con empate:
r2Matches[0].score_a = 5;
r2Matches[0].score_b = 5;
r2Matches[0].status = 'finished';

r2Matches[1].score_a = 6;
r2Matches[1].score_b = 3;
r2Matches[1].status = 'finished';

const r3Pairs = FixedPairsLogic.updatePozoRankings(updatedPairs, r2Matches, 2);
console.log("Pistas tras R2 (con empate en P1):", r3Pairs.map(p => `${p.pair_name} -> Pista ${p.current_court}`));

const r3Matches = FixedPairsLogic.generatePozoRound(r3Pairs, 3, 2);
console.log("Partidos R3:", r3Matches.map(m => `P${m.court}: ${m.teamA} vs ${m.teamB}`));
assert.strictEqual(r3Matches.length, 2, "Debe haber 2 partidos en R3");

