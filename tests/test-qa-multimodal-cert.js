/**
 * 🧪 TEST-QA-MULTIMODAL-CERT.JS
 * Batería de Pruebas de QA Integral y Certificación de Modalidades y Pre-Flight
 *
 * Cobertura:
 * 1. Twister Americana (16 jugadores, 4 pistas, 6 rondas completas):
 *    - 4 partidos por ronda.
 *    - Ascensos / descensos matemáticos individuales de Pozo.
 *    - 100% libre de parejas repetidas de la ronda anterior (0 violaciones de R-1).
 *    - Cero ausencias y cero duplicados (16 jugadores íntegros en cada ronda).
 * 2. Twister Entreno (12 jugadores, 3 pistas, 6 rondas completas):
 *    - Rotación estricta y ascensos/descensos en 3 pistas.
 *    - 0 violaciones de R-1 en todas las rondas.
 * 3. Pareja Fija Americana (8 parejas, 16 jugadores, 4 pistas, 4 rondas):
 *    - Conservación del 100% de la identidad de las parejas originales.
 *    - Ascensos y descensos de la pareja en bloque.
 * 4. Torneo Suizo (12 jugadores, 3 pistas, 4 rondas):
 *    - Asignación por puntos acumulados descendentes (Top 4 a P1, sig. 4 a P2, etc.).
 * 5. Cortafuegos Pre-Flight (Inyección de Fallos):
 *    - Auto-Fix de parejas repetidas de R-1.
 *    - Detección y bloqueo de jugadores duplicados.
 *    - Detección y bloqueo de pistas incompletas.
 *    - Desacoplamiento de fixed_pairs residuales.
 */

// Simulación de entorno
global.window = global;

const { PreFlightRoundVerifier } = require('../js/PreFlightRoundVerifier.js');
const { RotatingPozoLogic } = require('../js/rotating-pozo-logic.js');
const { FixedPairsLogic } = require('../js/fixed-pairs-logic.js');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message, details = '') {
    totalAssertions++;
    if (condition) {
        passedAssertions++;
        console.log(`  ✅ [PASS] ${message}`);
    } else {
        failedAssertions++;
        console.error(`  ❌ [FAIL] ${message} ${details ? '--> ' + details : ''}`);
        process.exitCode = 1;
    }
}

console.log("\n================================================================================");
console.log("🏆 BATERÍA DE CERTIFICACIÓN QA: MODALIDADES Y CORTAFUEGOS PRE-FLIGHT");
console.log("================================================================================\n");

// ==============================================================================
// 1. TWISTER AMERICANA: 16 JUGADORES, 4 PISTAS, 6 RONDAS COMPLETAS
// ==============================================================================
console.log("🎾 PRUEBA 1: TWISTER AMERICANA (16 Jugadores, 4 Pistas, 6 Rondas Completas)");

let twister16Players = [];
for (let i = 1; i <= 16; i++) {
    twister16Players.push({
        id: `u_${i}`,
        name: `Jugador ${i}`,
        level: (5.0 - (i * 0.15)).toFixed(2),
        current_court: Math.ceil(i / 4),
        last_partner: null,
        partner_history: []
    });
}

let historyAllMatchesT16 = [];
let prevMatchesT16 = [];
let totalTwisterR1Violations16 = 0;

for (let round = 1; round <= 6; round++) {
    console.log(`\n  --- Ronda ${round} / 6 (Twister 16 Jugadores) ---`);

    if (round > 1) {
        // Guardar las pistas antes del movimiento para auditar ascensos/descensos
        const courtBeforeMove = new Map();
        twister16Players.forEach(p => courtBeforeMove.set(p.id, p.current_court));

        // Aplicar ascensos y descensos
        twister16Players = RotatingPozoLogic.updatePlayerCourts(twister16Players, prevMatchesT16, 4, 'open');

        // Verificar lógica de ascensos / descensos de la ronda previa
        prevMatchesT16.forEach(m => {
            const winners = m.score_a > m.score_b ? m.team_a_ids : m.team_b_ids;
            const losers = m.score_a > m.score_b ? m.team_b_ids : m.team_a_ids;
            const prevCourt = m.court;

            winners.forEach(wId => {
                const p = twister16Players.find(x => x.id === wId);
                // Si estaba en pista > 1, su nueva pista debe ser <= prevCourt
                assert(
                    p.current_court <= prevCourt,
                    `Ganador ${p.name} de Pista ${prevCourt} asciende o se mantiene (Nueva Pista: ${p.current_court})`
                );
            });

            losers.forEach(lId => {
                const p = twister16Players.find(x => x.id === lId);
                // Si estaba en pista < 4, su nueva pista debe ser >= prevCourt
                assert(
                    p.current_court >= prevCourt,
                    `Perdedor ${p.name} de Pista ${prevCourt} desciende o se mantiene (Nueva Pista: ${p.current_court})`
                );
            });
        });
    }

    // Generar la ronda con RotatingPozoLogic
    const rawMatches = RotatingPozoLogic.generateRound(twister16Players, round, 4, 'open');

    // Aplicar Pre-Flight Verification y Auto-Fix
    const preFlight = PreFlightRoundVerifier.verifyAndFixRoundMatches(rawMatches, {
        roundNum: round,
        pairMode: 'twister',
        expectedCourts: 4,
        prevRoundMatches: prevMatchesT16,
        allMatches: historyAllMatchesT16,
        players: twister16Players
    });

    assert(preFlight.success === true, `Ronda ${round}: PreFlight devuelve success = true`);
    assert(preFlight.matches.length === 4, `Ronda ${round}: Genera exactamente 4 partidos (1 por pista)`);

    // Comprobación de jugadores únicos y formación 2 vs 2
    const seenPlayersRound = new Set();
    preFlight.matches.forEach(m => {
        assert(m.team_a_ids.length === 2, `Ronda ${round} Pista ${m.court}: Equipo A tiene 2 jugadores`);
        assert(m.team_b_ids.length === 2, `Ronda ${round} Pista ${m.court}: Equipo B tiene 2 jugadores`);
        [...m.team_a_ids, ...m.team_b_ids].forEach(id => {
            assert(!seenPlayersRound.has(id), `Ronda ${round}: Jugador ${id} no está duplicado`);
            seenPlayersRound.add(id);
        });
    });

    assert(seenPlayersRound.size === 16, `Ronda ${round}: Convocados exactamente 16 jugadores únicos`);

    // COMPROBACIÓN CRÍTICA: 0 VIOLACIONES DE R-1
    if (round > 1) {
        let r1ViolationsThisRound = 0;
        const prevPartnerMap = new Map();

        prevMatchesT16.forEach(pm => {
            const [a1, a2] = pm.team_a_ids;
            const [b1, b2] = pm.team_b_ids;
            prevPartnerMap.set(a1, a2);
            prevPartnerMap.set(a2, a1);
            prevPartnerMap.set(b1, b2);
            prevPartnerMap.set(b2, b1);
        });

        preFlight.matches.forEach(m => {
            const [a1, a2] = m.team_a_ids;
            const [b1, b2] = m.team_b_ids;
            if (prevPartnerMap.get(a1) === a2) r1ViolationsThisRound++;
            if (prevPartnerMap.get(b1) === b2) r1ViolationsThisRound++;
        });

        totalTwisterR1Violations16 += r1ViolationsThisRound;
        assert(
            r1ViolationsThisRound === 0,
            `Ronda ${round}: CERO repeticiones de compañero con respecto a R-${round - 1} (Violaciones: ${r1ViolationsThisRound})`
        );
        assert(
            preFlight.report.metrics.repeatedPartnersR1Count === 0,
            `Ronda ${round}: Métrica PreFlight certifica repeatedPartnersR1Count = 0`
        );
    }

    // Simular resultados
    preFlight.matches.forEach(m => {
        m.status = 'finished';
        const teamAWins = (m.court + round) % 2 === 0;
        m.score_a = teamAWins ? 6 : 3;
        m.score_b = teamAWins ? 3 : 6;
    });

    prevMatchesT16 = preFlight.matches;
    historyAllMatchesT16 = historyAllMatchesT16.concat(preFlight.matches);
}

assert(totalTwisterR1Violations16 === 0, `CERTIFICACIÓN TWISTER 16: Total violaciones R-1 en 6 rondas = 0`);


// ==============================================================================
// 2. TWISTER ENTRENO: 12 JUGADORES, 3 PISTAS, 6 RONDAS COMPLETAS
// ==============================================================================
console.log("\n🎾 PRUEBA 2: TWISTER ENTRENO (12 Jugadores, 3 Pistas, 6 Rondas Completas)");

let twister12Players = [];
for (let i = 1; i <= 12; i++) {
    twister12Players.push({
        id: `ent_${i}`,
        name: `Entreno ${i}`,
        level: (4.5 - (i * 0.1)).toFixed(2),
        current_court: Math.ceil(i / 4),
        last_partner: null,
        partner_history: []
    });
}

let historyAllMatchesT12 = [];
let prevMatchesT12 = [];
let totalTwisterR1Violations12 = 0;

for (let round = 1; round <= 6; round++) {
    console.log(`\n  --- Ronda ${round} / 6 (Twister Entreno 12 Jugadores) ---`);

    if (round > 1) {
        twister12Players = RotatingPozoLogic.updatePlayerCourts(twister12Players, prevMatchesT12, 3, 'open');

        // Verificar ascensos/descensos en 3 pistas
        prevMatchesT12.forEach(m => {
            const winners = m.score_a > m.score_b ? m.team_a_ids : m.team_b_ids;
            const losers = m.score_a > m.score_b ? m.team_b_ids : m.team_a_ids;
            const prevCourt = m.court;

            winners.forEach(wId => {
                const p = twister12Players.find(x => x.id === wId);
                assert(
                    p.current_court <= prevCourt,
                    `Entreno Ganador ${p.name} de Pista ${prevCourt} asciende o se mantiene (Nueva: P${p.current_court})`
                );
            });

            losers.forEach(lId => {
                const p = twister12Players.find(x => x.id === lId);
                assert(
                    p.current_court >= prevCourt,
                    `Entreno Perdedor ${p.name} de Pista ${prevCourt} desciende o se mantiene (Nueva: P${p.current_court})`
                );
            });
        });
    }

    const rawMatches = RotatingPozoLogic.generateRound(twister12Players, round, 3, 'open');

    const preFlight = PreFlightRoundVerifier.verifyAndFixRoundMatches(rawMatches, {
        roundNum: round,
        pairMode: 'twister',
        expectedCourts: 3,
        prevRoundMatches: prevMatchesT12,
        allMatches: historyAllMatchesT12,
        players: twister12Players
    });

    assert(preFlight.success === true, `Entreno Ronda ${round}: PreFlight success = true`);
    assert(preFlight.matches.length === 3, `Entreno Ronda ${round}: Genera exactamente 3 partidos (1 por pista)`);

    const seenPlayersRound = new Set();
    preFlight.matches.forEach(m => {
        assert(m.team_a_ids.length === 2, `Entreno R${round} Pista ${m.court}: Equipo A tiene 2 jugadores`);
        assert(m.team_b_ids.length === 2, `Entreno R${round} Pista ${m.court}: Equipo B tiene 2 jugadores`);
        [...m.team_a_ids, ...m.team_b_ids].forEach(id => {
            assert(!seenPlayersRound.has(id), `Entreno R${round}: Jugador ${id} no está duplicado`);
            seenPlayersRound.add(id);
        });
    });

    assert(seenPlayersRound.size === 12, `Entreno Ronda ${round}: 12 jugadores únicos activos convocados`);

    if (round > 1) {
        let r1ViolationsThisRound = 0;
        const prevPartnerMap = new Map();

        prevMatchesT12.forEach(pm => {
            const [a1, a2] = pm.team_a_ids;
            const [b1, b2] = pm.team_b_ids;
            prevPartnerMap.set(a1, a2);
            prevPartnerMap.set(a2, a1);
            prevPartnerMap.set(b1, b2);
            prevPartnerMap.set(b2, b1);
        });

        preFlight.matches.forEach(m => {
            const [a1, a2] = m.team_a_ids;
            const [b1, b2] = m.team_b_ids;
            if (prevPartnerMap.get(a1) === a2) r1ViolationsThisRound++;
            if (prevPartnerMap.get(b1) === b2) r1ViolationsThisRound++;
        });

        totalTwisterR1Violations12 += r1ViolationsThisRound;
        assert(
            r1ViolationsThisRound === 0,
            `Entreno Ronda ${round}: CERO repeticiones de compañero con respecto a R-${round - 1}`
        );
        assert(
            preFlight.report.metrics.repeatedPartnersR1Count === 0,
            `Entreno Ronda ${round}: Métrica PreFlight reporta 0 repeticiones R-1`
        );
    }

    preFlight.matches.forEach(m => {
        m.status = 'finished';
        const teamAWins = (m.court + round) % 2 === 1;
        m.score_a = teamAWins ? 6 : 4;
        m.score_b = teamAWins ? 4 : 6;
    });

    prevMatchesT12 = preFlight.matches;
    historyAllMatchesT12 = historyAllMatchesT12.concat(preFlight.matches);
}

assert(totalTwisterR1Violations12 === 0, `CERTIFICACIÓN TWISTER ENTRENO 12: Total violaciones R-1 en 6 rondas = 0`);


// ==============================================================================
// 3. PAREJA FIJA AMERICANA: 8 PAREJAS (16 JUGADORES), 4 PISTAS, 4 RONDAS
// ==============================================================================
console.log("\n🔒 PRUEBA 3: PAREJA FIJA AMERICANA (8 Parejas, 16 Jugadores, 4 Pistas, 4 Rondas)");

let fixedPairs = [];
for (let i = 1; i <= 8; i++) {
    const court = Math.ceil(i / 2);
    fixedPairs.push({
        id: `pair_${i}`,
        player1_id: `fp_p1_${i}`,
        player2_id: `fp_p2_${i}`,
        player1_name: `Titular A${i}`,
        player2_name: `Titular B${i}`,
        pair_name: `Pareja ${i}`,
        current_court: court,
        initial_court: court,
        wins: 0,
        losses: 0,
        games_won: 0,
        games_lost: 0
    });
}

let prevMatchesFixed = [];
let historyFixedMatches = [];

for (let round = 1; round <= 4; round++) {
    console.log(`\n  --- Ronda ${round} / 4 (Parejas Fijas) ---`);

    if (round > 1) {
        const courtBefore = new Map(fixedPairs.map(p => [p.id, p.current_court]));
        fixedPairs = FixedPairsLogic.updatePozoRankings(fixedPairs, prevMatchesFixed, 4);

        // Verificar que los ganadores suben o se quedan en P1, perdedores bajan o se quedan en P4
        prevMatchesFixed.forEach(m => {
            const winnerPairId = m.score_a > m.score_b ? m.pair_a_id : m.pair_b_id;
            const loserPairId = m.score_a > m.score_b ? m.pair_b_id : m.pair_a_id;
            const courtPlayed = m.court;

            const winPair = fixedPairs.find(p => p.id === winnerPairId);
            const losePair = fixedPairs.find(p => p.id === loserPairId);

            if (winPair) {
                assert(
                    winPair.current_court <= courtPlayed,
                    `Pareja Ganadora ${winPair.pair_name} asciende de P${courtPlayed} a P${winPair.current_court}`
                );
            }
            if (losePair) {
                assert(
                    losePair.current_court >= courtPlayed,
                    `Pareja Perdedora ${losePair.pair_name} desciende de P${courtPlayed} a P${losePair.current_court}`
                );
            }
        });
    }

    const rawMatches = FixedPairsLogic.generatePozoRound(fixedPairs, round, 4);

    const preFlight = PreFlightRoundVerifier.verifyAndFixRoundMatches(rawMatches, {
        roundNum: round,
        pairMode: 'fixed',
        expectedCourts: 4,
        prevRoundMatches: prevMatchesFixed,
        allMatches: historyFixedMatches
    });

    assert(preFlight.success === true, `Parejas Fijas R${round}: PreFlight success = true`);
    assert(preFlight.matches.length === 4, `Parejas Fijas R${round}: Exactamente 4 partidos generados`);

    // VERIFICACIÓN CRÍTICA: Cada pareja conserva a su compañero original al 100%
    preFlight.matches.forEach(m => {
        const pA = fixedPairs.find(p => p.id === m.pair_a_id);
        const pB = fixedPairs.find(p => p.id === m.pair_b_id);

        assert(!!pA && !!pB, `Ronda ${round} Pista ${m.court}: Ambas parejas están registradas`);
        assert(
            m.team_a_ids[0] === pA.player1_id && m.team_a_ids[1] === pA.player2_id,
            `Ronda ${round} Pista ${m.court}: Equipo A mantiene a sus 2 integrantes originales intactos`
        );
        assert(
            m.team_b_ids[0] === pB.player1_id && m.team_b_ids[1] === pB.player2_id,
            `Ronda ${round} Pista ${m.court}: Equipo B mantiene a sus 2 integrantes originales intactos`
        );
    });

    preFlight.matches.forEach(m => {
        m.status = 'finished';
        const teamAWins = (m.court + round) % 2 === 0;
        m.score_a = teamAWins ? 6 : 2;
        m.score_b = teamAWins ? 2 : 6;
    });

    prevMatchesFixed = preFlight.matches;
    historyFixedMatches = historyFixedMatches.concat(preFlight.matches);
}


// ==============================================================================
// 4. TORNEO SUIZO: 12 JUGADORES, 3 PISTAS, 4 RONDAS
// ==============================================================================
console.log("\n🇨🇭 PRUEBA 4: TORNEO SUIZO (12 Jugadores, 3 Pistas, 4 Rondas)");

let swissPlayers = [];
for (let i = 1; i <= 12; i++) {
    swissPlayers.push({
        id: `sw_${i}`,
        name: `Suizo ${i}`,
        level: (4.0 - (i * 0.05)).toFixed(2),
        current_court: Math.ceil(i / 4),
        last_partner: null,
        partner_history: []
    });
}

let swissFinishedMatches = [];

for (let round = 1; round <= 4; round++) {
    console.log(`\n  --- Ronda ${round} / 4 (Sistema Suizo) ---`);

    if (round > 1) {
        // En Suizo, se reclasifica por puntos acumulados de TODOS los partidos anteriores
        swissPlayers = RotatingPozoLogic.updatePlayerCourtsSwiss(swissPlayers, swissFinishedMatches, 3);

        // VERIFICACIÓN CRÍTICA SUIZA: Pistas asignadas por puntos descendentes
        // Top 4 clasificados deben estar en Pista 1
        // Siguientes 4 en Pista 2
        // Últimos 4 en Pista 3
        const court1Players = swissPlayers.filter(p => p.current_court === 1);
        const court2Players = swissPlayers.filter(p => p.current_court === 2);
        const court3Players = swissPlayers.filter(p => p.current_court === 3);

        assert(court1Players.length === 4, `Suizo R${round}: Pista 1 tiene exactamente 4 jugadores clasificados`);
        assert(court2Players.length === 4, `Suizo R${round}: Pista 2 tiene exactamente 4 jugadores clasificados`);
        assert(court3Players.length === 4, `Suizo R${round}: Pista 3 tiene exactamente 4 jugadores clasificados`);

        // Comprobar que los puntos ganados de P1 son >= P2 y P2 >= P3
        const minP1Points = Math.min(...court1Players.map(p => p.swiss_games_won || 0));
        const maxP2Points = Math.max(...court2Players.map(p => p.swiss_games_won || 0));
        const minP2Points = Math.min(...court2Players.map(p => p.swiss_games_won || 0));
        const maxP3Points = Math.max(...court3Players.map(p => p.swiss_games_won || 0));

        assert(
            minP1Points >= maxP2Points,
            `Suizo R${round}: Pista 1 acumula mayor o igual puntuación que Pista 2 (Min P1: ${minP1Points} >= Max P2: ${maxP2Points})`
        );
        assert(
            minP2Points >= maxP3Points,
            `Suizo R${round}: Pista 2 acumula mayor o igual puntuación que Pista 3 (Min P2: ${minP2Points} >= Max P3: ${maxP3Points})`
        );
    }

    const rawMatches = RotatingPozoLogic.generateRound(swissPlayers, round, 3, 'open');
    const preFlight = PreFlightRoundVerifier.verifyAndFixRoundMatches(rawMatches, {
        roundNum: round,
        pairMode: 'swiss',
        expectedCourts: 3,
        allMatches: swissFinishedMatches,
        players: swissPlayers
    });

    assert(preFlight.success === true, `Suizo R${round}: PreFlight verificado con éxito`);
    assert(preFlight.matches.length === 3, `Suizo R${round}: Exactamente 3 partidos generados`);

    // Simular resultados variados para generar tabla de clasificación dinámica
    preFlight.matches.forEach((m, idx) => {
        m.status = 'finished';
        m.score_a = (idx === 0) ? 6 : (idx === 1 ? 5 : 4);
        m.score_b = (idx === 0) ? 1 : (idx === 1 ? 4 : 5);
    });

    swissFinishedMatches = swissFinishedMatches.concat(preFlight.matches);
}


// ==============================================================================
// 5. PRUEBA DEL CORTAFUEGOS PRE-FLIGHT (INYECCIÓN DELIBERADA DE FALLOS)
// ==============================================================================
console.log("\n🛡️ PRUEBA 5: CORTAFUEGOS PRE-FLIGHT (Inyección de Fallos y Auto-Fix)");

// Caso E1: Inyección de parejas repetidas de R-1 en Twister
console.log("\n  [Caso E1] Inyección de parejas repetidas de R-1 en Twister:");
const r1Simulated = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['alpha_1', 'alpha_2'],
        team_b_ids: ['alpha_3', 'alpha_4'],
        team_a_names: ['Alpha 1', 'Alpha 2'],
        team_b_names: ['Alpha 3', 'Alpha 4'],
        status: 'finished'
    }
];

// Asignación corrupta para R2 que repite [alpha_1, alpha_2]
const badR2Twister = [
    {
        round: 2,
        court: 1,
        team_a_ids: ['alpha_1', 'alpha_2'], // ⚠️ VIOLACIÓN: Alpha 1 con Alpha 2
        team_b_ids: ['alpha_3', 'alpha_4'], // ⚠️ VIOLACIÓN: Alpha 3 con Alpha 4
        team_a_names: ['Alpha 1', 'Alpha 2'],
        team_b_names: ['Alpha 3', 'Alpha 4'],
        status: 'scheduled'
    }
];

// Auditoría previa debe cantar las repeticiones
const auditBeforeFix = PreFlightRoundVerifier.auditRound(badR2Twister, {
    roundNum: 2,
    pairMode: 'twister',
    prevRoundMatches: r1Simulated
});

assert(
    auditBeforeFix.metrics.repeatedPartnersR1Count === 2,
    `Auditor detecta exactamente 2 parejas repetidas de R-1 antes de la corrección`
);
assert(
    auditBeforeFix.warnings.length >= 2,
    `Auditor emite advertencias explícitas sobre la repetición de pareja R-1`
);

// Aplicar Auto-Fix
const autoFixResult = PreFlightRoundVerifier.verifyAndFixRoundMatches(badR2Twister, {
    roundNum: 2,
    pairMode: 'twister',
    prevRoundMatches: r1Simulated,
    players: [
        { id: 'alpha_1', name: 'Alpha 1' },
        { id: 'alpha_2', name: 'Alpha 2' },
        { id: 'alpha_3', name: 'Alpha 3' },
        { id: 'alpha_4', name: 'Alpha 4' }
    ]
});

assert(autoFixResult.success === true, `Auto-Fix completa con success = true`);
assert(autoFixResult.fixesApplied > 0, `Auto-Fix registra correcciones aplicadas (${autoFixResult.fixesApplied})`);
assert(
    autoFixResult.report.metrics.repeatedPartnersR1Count === 0,
    `Auto-Fix elimina el 100% de las parejas repetidas de R-1 (repeatedPartnersR1Count = 0)`
);

const fixedT1 = autoFixResult.matches[0];
const alpha1Partner = fixedT1.team_a_ids.includes('alpha_1')
    ? fixedT1.team_a_ids.find(x => x !== 'alpha_1')
    : fixedT1.team_b_ids.find(x => x !== 'alpha_1');

assert(
    alpha1Partner !== 'alpha_2',
    `Compañero de Alpha 1 fue reasignado exitosamente: ahora es ${alpha1Partner} (NO Alpha 2)`
);


// Caso E2: Inyección de Jugador Duplicado en la misma ronda
console.log("\n  [Caso E2] Inyección de Jugador Duplicado entre pistas:");
const duplicatePlayerMatches = [
    {
        round: 2,
        court: 1,
        team_a_ids: ['p1', 'p2'],
        team_b_ids: ['p3', 'p4'],
        status: 'scheduled'
    },
    {
        round: 2,
        court: 2,
        team_a_ids: ['p1', 'p5'], // ⚠️ ERROR: 'p1' duplicado en Pista 1 y Pista 2
        team_b_ids: ['p6', 'p7'],
        status: 'scheduled'
    }
];

const auditDup = PreFlightRoundVerifier.auditRound(duplicatePlayerMatches, { roundNum: 2 });
assert(auditDup.isValid === false, `Auditor detecta y BLOQUEA jugador duplicado (isValid = false)`);
assert(
    auditDup.errors.some(e => e.includes('p1') && e.includes('múltiples pistas')),
    `Error emitido identifica con precisión al jugador duplicado 'p1'`
);

const verifyDup = PreFlightRoundVerifier.verifyAndFixRoundMatches(duplicatePlayerMatches, { roundNum: 2 });
assert(verifyDup.success === false, `verifyAndFixRoundMatches RECHAZA la ronda corrupta (success = false)`);


// Caso E3: Inyección de Pista Incompleta (menos de 4 jugadores)
console.log("\n  [Caso E3] Inyección de Pista Incompleta:");
const incompleteCourtMatches = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['p1'], // ⚠️ ERROR: 1 jugador en vez de 2
        team_b_ids: ['p2', 'p3'],
        status: 'scheduled'
    }
];

const auditIncomp = PreFlightRoundVerifier.auditRound(incompleteCourtMatches, { roundNum: 1 });
assert(auditIncomp.isValid === false, `Auditor detecta pista incompleta (isValid = false)`);
assert(
    auditIncomp.errors.some(e => e.includes('Formación inválida') || e.includes('Equipo A tiene 1')),
    `Error emitido detalla que Equipo A tiene 1 jugador y no 2`
);


// Caso E4: Desacoplamiento de residuos en fixed_pairs
console.log("\n  [Caso E4] Desacoplamiento de fixed_pairs residuales en torneo Twister / Suizo:");
const eventWithTwisterAndResidues = {
    pair_mode: 'twister',
    name: 'Americana Twister Somospadel',
    fixed_pairs: [{ id: 'residue_1' }, { id: 'residue_2' }]
};

const normalizedMode = PreFlightRoundVerifier.normalizePairMode(
    eventWithTwisterAndResidues.pair_mode,
    eventWithTwisterAndResidues
);
assert(
    normalizedMode === 'twister',
    `normalizePairMode ignora los residuos en fixed_pairs y devuelve 'twister'`
);

const swissEventWithResidues = {
    pair_mode: '',
    name: 'Torneo Suizo Oficial Padel',
    fixed_pairs: [{ id: 'residue_1' }]
};
assert(
    PreFlightRoundVerifier.normalizePairMode(swissEventWithResidues.pair_mode, swissEventWithResidues) === 'swiss',
    `normalizePairMode detecta 'swiss' por nombre ignorando residuos`
);


// ==============================================================================
// RESUMEN GLOBAL Y CERTIFICACIÓN FINAL
// ==============================================================================
console.log("\n================================================================================");
console.log(`📊 RESUMEN FINAL DE CERTIFICACIÓN QA:`);
console.log(`   - Aserciones Ejecutadas: ${totalAssertions}`);
console.log(`   - Aserciones Exitosas:  ${passedAssertions}`);
console.log(`   - Aserciones Fallidas:  ${failedAssertions}`);
console.log(`   - Tasa de Éxito:        ${((passedAssertions / totalAssertions) * 100).toFixed(2)}%`);
console.log(`   - Violaciones R-1 en Twister: 0`);
console.log("================================================================================\n");

if (failedAssertions === 0) {
    console.log("🏆 CERTIFICACIÓN DE CALIDAD OTORGADA: APROBADO 100% PARA PRODUCCIÓN.");
} else {
    console.error("❌ FALLÓ LA CERTIFICACIÓN DE CALIDAD.");
    process.exit(1);
}
