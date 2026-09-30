/**
 * 🧪 TEST AUTOMATIZADO DE PRE-FLIGHT VERIFIER & MODALIDADES TWISTER / ENTRENO
 * Valida la corrección de los bugs de modalidad y la garantía de 0 repeticiones en R-1.
 */

const fs = require('fs');
const path = require('path');

// Mocks de entorno de navegador
global.window = {};
const origLog = console.log.bind(console);
const origWarn = console.warn.bind(console);
const origErr = console.error.bind(console);

global.console.log = (...args) => origLog('[LOG]', ...args);
global.console.warn = (...args) => origWarn('[WARN]', ...args);
global.console.error = (...args) => origErr('[ERR]', ...args);

const { PreFlightRoundVerifier: Verifier } = require('../js/PreFlightRoundVerifier.js');
const { RotatingPozoLogic: RotatingPozo } = require('../js/rotating-pozo-logic.js');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message}`);
        process.exitCode = 1;
    }
}

console.log("\n==========================================================");
console.log("🚀 EJECUTANDO TEST SUITE: PRE-FLIGHT VERIFIER & TWISTER");
console.log("==========================================================\n");

// --- 1. TEST NORMALIZADOR DE MODALIDAD ---
console.log("--- 1. Pruebas de Normalización de Modalidad ---");

assert(
    Verifier.normalizePairMode('twister', {}) === 'twister',
    "normalizePairMode('twister') -> 'twister'"
);

assert(
    Verifier.normalizePairMode('rotating', {}) === 'twister',
    "normalizePairMode('rotating') -> 'twister'"
);

assert(
    Verifier.normalizePairMode('pozo_individual', {}) === 'twister',
    "normalizePairMode('pozo_individual') -> 'twister'"
);

assert(
    Verifier.normalizePairMode('swiss', {}) === 'swiss',
    "normalizePairMode('swiss') -> 'swiss'"
);

assert(
    Verifier.normalizePairMode('suizo', {}) === 'swiss',
    "normalizePairMode('suizo') -> 'swiss'"
);

assert(
    Verifier.normalizePairMode('', { name: 'Gran Torneo Suizo Primavera' }) === 'swiss',
    "Detección de 'suizo' por nombre de evento"
);

assert(
    Verifier.normalizePairMode('fixed', {}) === 'fixed',
    "normalizePairMode('fixed') -> 'fixed'"
);

assert(
    Verifier.normalizePairMode('fija', {}) === 'fixed',
    "normalizePairMode('fija') -> 'fixed'"
);

// EL CASO CRÍTICO: Residuos en fixed_pairs no deben contaminar cuando el usuario eligió twister
assert(
    Verifier.normalizePairMode('twister', { fixed_pairs: [{ id: 'pair_1' }, { id: 'pair_2' }] }) === 'twister',
    "CRÍTICO: pair_mode='twister' con residuos en fixed_pairs DEBE devolver 'twister'"
);

assert(
    Verifier.normalizePairMode('rotating', { fixed_pairs: [{ id: 'pair_1' }] }) === 'twister',
    "CRÍTICO: pair_mode='rotating' con residuos en fixed_pairs DEBE devolver 'twister'"
);

assert(
    Verifier.normalizePairMode('', { pair_mode: 'twister', name: 'Entreno Nivel Medio', fixed_pairs: [{ id: 'p1' }] }) === 'twister',
    "CRÍTICO: Entreno con pair_mode='twister' y residuos en fixed_pairs devuelve 'twister'"
);

// --- 2. TEST AUTO-FIX DE PAREJAS EN TWISTER ---
console.log("\n--- 2. Pruebas de Auto-Fix de Parejas Repetidas en Twister ---");

// Supongamos que en R1, en la Pista 1 jugaron:
// Pista 1: [U1, U2] vs [U3, U4]
// U1 jugó con U2 (R1)
// U3 jugó con U4 (R1)
const r1Matches = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['u1', 'u2'],
        team_b_ids: ['u3', 'u4'],
        team_a_names: ['Jugador 1', 'Jugador 2'],
        team_b_names: ['Jugador 3', 'Jugador 4'],
        score_a: 6,
        score_b: 2,
        status: 'finished'
    }
];

// Supongamos que por un error aleatorio o mala permutación, la propuesta de R2 vuelve a emparejar a U1 con U2:
const proposedR2Bad = [
    {
        round: 2,
        court: 1,
        team_a_ids: ['u1', 'u2'], // ⚠️ ERROR: Repiten pareja de R1!
        team_b_ids: ['u3', 'u4'], // ⚠️ ERROR: Repiten pareja de R1!
        team_a_names: ['Jugador 1', 'Jugador 2'],
        team_b_names: ['Jugador 3', 'Jugador 4'],
        status: 'scheduled'
    }
];

// Audit pre-fix debe detectar el warning / repetición
const auditBefore = Verifier.auditRound(proposedR2Bad, {
    roundNum: 2,
    pairMode: 'twister',
    prevRoundMatches: r1Matches
});

assert(
    auditBefore.metrics.repeatedPartnersR1Count === 2,
    "Auditor detecta 2 repeticiones de pareja R-1 en la propuesta mala"
);

// Ejecutar verifyAndFixRoundMatches
const fixResult = Verifier.verifyAndFixRoundMatches(proposedR2Bad, {
    roundNum: 2,
    pairMode: 'twister',
    prevRoundMatches: r1Matches,
    players: [
        { id: 'u1', name: 'Jugador 1' },
        { id: 'u2', name: 'Jugador 2' },
        { id: 'u3', name: 'Jugador 3' },
        { id: 'u4', name: 'Jugador 4' }
    ]
});

assert(fixResult.success === true, "Auto-Fix se completó con success = true");
const fixedMatch = fixResult.matches[0];
const newTeamA = fixedMatch.team_a_ids.sort();
const newTeamB = fixedMatch.team_b_ids.sort();

console.log(`Pista corregida: Team A = [${newTeamA.join(', ')}], Team B = [${newTeamB.join(', ')}]`);

const u1Partner = fixedMatch.team_a_ids.includes('u1') 
    ? fixedMatch.team_a_ids.find(id => id !== 'u1')
    : fixedMatch.team_b_ids.find(id => id !== 'u1');

assert(
    u1Partner !== 'u2',
    "Auto-Fix reordenó la pista: U1 ya NO juega con U2 (0 repeticiones en R-1)"
);

assert(
    fixResult.report.metrics.repeatedPartnersR1Count === 0,
    "Reporte final tras Auto-Fix confirma 0 repeticiones en R-1"
);


// --- 3. SIMULACIÓN COMPLETA DE 4 RONDAS EN MODO TWISTER (16 JUGADORES, 4 PISTAS) ---
console.log("\n--- 3. Simulación Completa de 4 Rondas Twister (Americanas / Entrenos) ---");

// Crear 16 jugadores
let players = [];
for (let i = 1; i <= 16; i++) {
    players.push({
        id: `usr_${i}`,
        name: `Jugador ${i}`,
        level: (5.0 - (i * 0.1)).toFixed(2),
        current_court: Math.ceil(i / 4),
        last_partner: null,
        partner_history: []
    });
}

let allTournamentMatches = [];
let prevMatches = [];

for (let round = 1; round <= 4; round++) {
    console.log(`\n--- DISPUTANDO RONDA ${round} ---`);

    if (round > 1) {
        // Actualizar ascensos y descensos
        players = RotatingPozo.updatePlayerCourts(players, prevMatches, 4, 'open');
    }

    // Generar partidos
    let generatedMatches = RotatingPozo.generateRound(players, round, 4, 'open');

    // Pasar por el sistema de verificación Pre-Flight y Auto-Fix
    const preFlight = Verifier.verifyAndFixRoundMatches(generatedMatches, {
        roundNum: round,
        pairMode: 'twister',
        prevRoundMatches: prevMatches,
        allMatches: allTournamentMatches,
        players: players
    });

    assert(preFlight.success === true, `Ronda ${round}: Pre-Flight verificado exitosamente`);
    assert(
        preFlight.report.metrics.repeatedPartnersR1Count === 0,
        `Ronda ${round}: 0 REPETICIONES DE COMPAÑERO respecto a R-${round - 1}`
    );

    // Verificar integridad de las 4 pistas
    const roundMatches = preFlight.matches;
    assert(roundMatches.length === 4, `Ronda ${round}: Generó exactamente 4 partidos`);

    const playersInRound = new Set();
    roundMatches.forEach(m => {
        assert(m.team_a_ids.length === 2, `Ronda ${round} Pista ${m.court}: Team A tiene 2 jugadores`);
        assert(m.team_b_ids.length === 2, `Ronda ${round} Pista ${m.court}: Team B tiene 2 jugadores`);
        [...m.team_a_ids, ...m.team_b_ids].forEach(pid => {
            assert(!playersInRound.has(pid), `Ronda ${round}: Jugador ${pid} no está duplicado en la ronda`);
            playersInRound.add(pid);
        });

        // Simular resultado del partido (Team A gana 6-3 o Team B gana 6-4)
        m.status = 'finished';
        const teamAWins = (m.court + round) % 2 === 0;
        m.score_a = teamAWins ? 6 : 3;
        m.score_b = teamAWins ? 3 : 6;
    });

    assert(playersInRound.size === 16, `Ronda ${round}: Los 16 jugadores están convocados sin ausencias ni duplicados`);

    prevMatches = roundMatches;
    allTournamentMatches = allTournamentMatches.concat(roundMatches);
}

console.log("\n==========================================================");
console.log(`📊 RESULTADOS FINALES: ${passedTests} / ${totalTests} PRUEBAS SUPERADAS`);
console.log("==========================================================\n");

if (passedTests === totalTests) {
    console.log("🎉 ¡TODAS LAS PRUEBAS PASARON CON ÉXITO! Sistema Pre-Flight y Twister 100% Blindado.");
} else {
    console.error("❌ Fallaron pruebas críticas.");
}
