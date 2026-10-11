/**
 * qa-exhaustive-cert.js
 * 
 * BATERÍA DE CERTIFICACIÓN Y CONTROL DE CALIDAD EXHAUSTIVO:
 * 1. PAREJA FIJA (8, 12, 16, 20 jugadores en Torneos y Entrenos durante 6 rondas completas):
 *    - Invariante sagrada: 100% de jugadores mantienen a su compañero de R1.
 *    - Dinámica Pozo canónica (Ganadores suben, perdedores bajan, cruces P1 vs P2, etc.).
 *    - Casos extremos de empates globales (4-4 y 5-5 simultáneos en todas las pistas).
 * 2. TWISTER INDIVIDUAL (8, 12, 16, 20 jugadores durante 6 rondas completas):
 *    - Ganadores suben y SE SEPARAN obligatoriamente.
 *    - Perdedores bajan y SE SEPARAN obligatoriamente.
 *    - CERO repeticiones de compañero con la ronda inmediatamente anterior (R-1).
 *    - Casos extremos de empates globales en Twister.
 * 3. SINCRONIZACIÓN E INTEGRIDAD DE CÓDIGO.
 */

const assert = require('assert');
const { FixedPairsLogic } = require('../js/fixed-pairs-logic');
const { PreFlightRoundVerifier } = require('../js/PreFlightRoundVerifier');
const { RotatingPozoLogic } = require('../js/rotating-pozo-logic');
const Engine = require('../js/tournament-engine/TournamentEngine');
const TwisterInvariantGuard = require('../js/tournament-engine/TwisterInvariantGuard');

let totalAssertions = 0;
let passedAssertions = 0;

function check(desc, condition) {
    totalAssertions++;
    if (!condition) {
        console.error(`  ❌ FALLO DE ASSERTION: ${desc}`);
        throw new Error(desc);
    }
    passedAssertions++;
}

console.log("================================================================================");
console.log("🏆 SUITE DE CERTIFICACIÓN ÉLITE QA: PAREJAS FIJAS & TWISTER INDIVIDUAL");
console.log("================================================================================\n");

// ==============================================================================
// 1. CERTIFICACIÓN PAREJA FIJA (TORNEOS Y ENTRENOS: 8, 12, 16, 20 JUGADORES)
// ==============================================================================
console.log("--------------------------------------------------------------------------------");
console.log("📋 FASE 1: CERTIFICACIÓN PAREJAS FIJAS (8, 12, 16, 20 JUGADORES - 6 RONDAS)");
console.log("--------------------------------------------------------------------------------");

const playerCounts = [8, 12, 16, 20];
const eventTypes = ['torneo', 'entreno'];

playerCounts.forEach(numPlayers => {
    eventTypes.forEach(evType => {
        const courts = numPlayers / 4;
        console.log(`\n🔹 [Parejas Fijas] Simulando ${evType.toUpperCase()} con ${numPlayers} jugadores (${courts} pistas, 6 rondas)...`);

        // Crear jugadores de prueba
        const players = [];
        for (let i = 1; i <= numPlayers; i++) {
            players.push({
                id: `player_${numPlayers}_${i}`,
                name: `Jugador ${i}`,
                level: 2.0 + (i % 7) * 0.5,
                gender: i % 2 === 0 ? 'chica' : 'chico'
            });
        }

        // Crear parejas iniciales
        const isEntreno = evType === 'entreno';
        let pairs = FixedPairsLogic.createFixedPairs(players, 'open', isEntreno);
        check(`Total de parejas creadas para ${numPlayers} jugadores debe ser ${numPlayers / 2}`, pairs.length === numPlayers / 2);

        // Guardar el mapa sagrado de parejas de Ronda 1
        const r1PartnerMap = new Map();
        pairs.forEach(p => {
            r1PartnerMap.set(String(p.player1_id), String(p.player2_id));
            r1PartnerMap.set(String(p.player2_id), String(p.player1_id));
        });

        let tournamentMatches = [];

        for (let round = 1; round <= 6; round++) {
            // Generar ronda pozo parejas fijas
            const roundMatches = FixedPairsLogic.generatePozoRound(pairs, round, courts);
            check(`Ronda ${round} debe tener exactamente ${courts} partidos`, roundMatches.length === courts);

            // AUDITORÍA PREFLIGHT: Invariante sagrada de compañeros
            const preFlightAudit = PreFlightRoundVerifier.auditRound(roundMatches, {
                roundNum: round,
                pairMode: 'fixed',
                allMatches: tournamentMatches,
                fixedPairs: pairs
            });
            check(`PreFlight en Ronda ${round} debe certificar 100% de validez`, preFlightAudit.isValid);
            check(`PreFlight no debe registrar errores`, preFlightAudit.errors.length === 0);

            // VERIFICACIÓN MANUAL DE LA INVARIANTE SAGRADA (100% de jugadores conservan su pareja de R1)
            roundMatches.forEach(m => {
                const teamA = m.team_a_ids || [];
                const teamB = m.team_b_ids || [];
                check(`Equipo A de pista ${m.court} debe tener 2 jugadores`, teamA.length === 2);
                check(`Equipo B de pista ${m.court} debe tener 2 jugadores`, teamB.length === 2);

                const partnerA = r1PartnerMap.get(String(teamA[0]));
                check(`Jugador A1 conserva pareja original de R1 en ronda ${round}`, partnerA === String(teamA[1]));

                const partnerB = r1PartnerMap.get(String(teamB[0]));
                check(`Jugador B1 conserva pareja original de R1 en ronda ${round}`, partnerB === String(teamB[1]));
            });

            // SIMULAR RESULTADOS (con puntuaciones reales)
            roundMatches.forEach((m, cIdx) => {
                // Simular resultado con ganador claro
                const aWins = (round + cIdx) % 2 === 0;
                m.score_a = aWins ? 6 : 3;
                m.score_b = aWins ? 3 : 6;
                m.status = 'finished';
            });

            // Si es ronda < 6, actualizar ranking y verificar cruces canónicos de la siguiente ronda
            if (round < 6) {
                // Guardar quién ganó y perdió en cada pista antes de actualizar
                const prevCourtWinners = new Map();
                const prevCourtLosers = new Map();

                roundMatches.forEach(m => {
                    const c = parseInt(m.court);
                    const winnerId = m.score_a > m.score_b ? m.pair_a_id : m.pair_b_id;
                    const loserId = m.score_a > m.score_b ? m.pair_b_id : m.pair_a_id;
                    prevCourtWinners.set(c, winnerId);
                    prevCourtLosers.set(c, loserId);
                });

                pairs = FixedPairsLogic.updatePozoRankings(pairs, roundMatches, courts);
                tournamentMatches.push(...roundMatches);

                // Generar siguiente ronda preliminar para auditar los cruces Pozo canónicos
                const nextMatches = FixedPairsLogic.generatePozoRound(pairs, round + 1, courts);

                // VERIFICAR CRUCES CANÓNICOS POZO:
                // Pista 1: Ganador P1 vs Ganador P2
                const p1Match = nextMatches.find(m => parseInt(m.court) === 1);
                check(`Pista 1 debe contener al Ganador de P1 de la ronda anterior`, 
                    p1Match.pair_a_id === prevCourtWinners.get(1) || p1Match.pair_b_id === prevCourtWinners.get(1));
                check(`Pista 1 debe contener al Ganador de P2 de la ronda anterior`, 
                    p1Match.pair_a_id === prevCourtWinners.get(2) || p1Match.pair_b_id === prevCourtWinners.get(2));

                // Pistas intermedias k: Perdedor P(k-1) vs Ganador P(k+1)
                for (let k = 2; k < courts; k++) {
                    const pkMatch = nextMatches.find(m => parseInt(m.court) === k);
                    const expectedLoser = prevCourtLosers.get(k - 1);
                    const expectedWinner = prevCourtWinners.get(k + 1);
                    check(`Pista ${k} debe incluir al Perdedor de P${k - 1}`, 
                        pkMatch.pair_a_id === expectedLoser || pkMatch.pair_b_id === expectedLoser);
                    check(`Pista ${k} debe incluir al Ganador de P${k + 1}`, 
                        pkMatch.pair_a_id === expectedWinner || pkMatch.pair_b_id === expectedWinner);
                }

                // Pista última (courts): Perdedor P(courts-1) vs Perdedor P(courts)
                if (courts > 1) {
                    const pLastMatch = nextMatches.find(m => parseInt(m.court) === courts);
                    const expectedPenultLoser = prevCourtLosers.get(courts - 1);
                    const expectedLastLoser = prevCourtLosers.get(courts);
                    check(`Última pista ${courts} debe incluir al Perdedor de P${courts - 1}`, 
                        pLastMatch.pair_a_id === expectedPenultLoser || pLastMatch.pair_b_id === expectedPenultLoser);
                    check(`Última pista ${courts} debe incluir al Perdedor de P${courts}`, 
                        pLastMatch.pair_a_id === expectedLastLoser || pLastMatch.pair_b_id === expectedLastLoser);
                }
            }
        }
        console.log(`  ✅ 6 Rondas superadas con 100% de respeto a la pareja inicial y cruces canónicos exactos.`);
    });
});

// ==============================================================================
// 1.1 CASOS EXTREMOS DE EMPATES EN PAREJAS FIJAS (4-4 y 5-5 EN TODAS LAS PISTAS)
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("⚖️ CASOS EXTREMOS DE EMPATES: TODAS LAS PISTAS EMPATADAS (4-4 Y 5-5)");
console.log("--------------------------------------------------------------------------------");

[8, 16, 20].forEach(numPlayers => {
    const courts = numPlayers / 4;
    console.log(`\n🔹 [Empate Extremo Parejas Fijas] ${numPlayers} jugadores (${courts} pistas): Todas empatadas simultáneamente...`);

    const players = [];
    for (let i = 1; i <= numPlayers; i++) {
        players.push({ id: `tie_p_${numPlayers}_${i}`, name: `P${i}`, level: 3.5 });
    }

    let pairs = FixedPairsLogic.createFixedPairs(players, 'open', false);
    const r1PartnerMap = new Map();
    pairs.forEach(p => {
        r1PartnerMap.set(String(p.player1_id), String(p.player2_id));
        r1PartnerMap.set(String(p.player2_id), String(p.player1_id));
    });

    for (let round = 1; round <= 4; round++) {
        const roundMatches = FixedPairsLogic.generatePozoRound(pairs, round, courts);

        // FORZAR EMPATE EN TODAS LAS PISTAS (4-4 en R1, 5-5 en R2, 3-3 en R3...)
        const tieScore = round % 2 === 0 ? 5 : 4;
        roundMatches.forEach(m => {
            m.score_a = tieScore;
            m.score_b = tieScore;
            m.status = 'finished';
        });

        // Actualizar rankings pozo - NO DEBE LANZAR ERROR Y DEBE RESOLVER DETERMINÍSTICAMENTE
        pairs = FixedPairsLogic.updatePozoRankings(pairs, roundMatches, courts);

        // Validar que todas las parejas tienen asignada una pista válida (1 <= current_court <= courts)
        pairs.forEach(p => {
            check(`Pareja ${p.pair_name} tiene pista válida tras empate`, p.current_court >= 1 && p.current_court <= courts);
        });

        // Verificar que en la siguiente ronda siguen intactas las parejas
        const nextRoundMatches = FixedPairsLogic.generatePozoRound(pairs, round + 1, courts);
        nextRoundMatches.forEach(m => {
            const teamA = m.team_a_ids || [];
            const teamB = m.team_b_ids || [];
            check(`Jugadores A conservan pareja tras empate masivo`, r1PartnerMap.get(String(teamA[0])) === String(teamA[1]));
            check(`Jugadores B conservan pareja tras empate masivo`, r1PartnerMap.get(String(teamB[0])) === String(teamB[1]));
        });
    }
    console.log(`  ✅ Empates extremos resueltos con éxito determinista y 100% fidelidad de parejas.`);
});


// ==============================================================================
// 2. CERTIFICACIÓN TWISTER INDIVIDUAL (8, 12, 16, 20 JUGADORES - 6 RONDAS)
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("🌀 FASE 2: CERTIFICACIÓN TWISTER INDIVIDUAL (8, 12, 16, 20 JUGADORES - 6 RONDAS)");
console.log("--------------------------------------------------------------------------------");

playerCounts.forEach(numPlayers => {
    const courts = numPlayers / 4;
    console.log(`\n🔹 [Twister Individual] Simulando ${numPlayers} jugadores (${courts} pistas, 6 rondas)...`);

    const players = [];
    for (let i = 1; i <= numPlayers; i++) {
        players.push({
            id: `twister_p_${numPlayers}_${i}`,
            name: `Twister ${i}`,
            level: 2.5 + (i % 6) * 0.4,
            current_court: Math.floor((i - 1) / 4) + 1
        });
    }

    let allMatches = [];

    // Ronda 1
    const r1 = Engine.generateRound({
        players,
        courts,
        roundNum: 1,
        mode: 'twister',
        matchesHistory: [],
        options: { isMixed: false }
    });
    check(`Ronda 1 Twister debe tener ${courts} partidos`, r1.matches.length === courts);

    // Simular resultados R1
    r1.matches.forEach((m, idx) => {
        const aWins = idx % 2 === 0;
        m.score_a = aWins ? 6 : 2;
        m.score_b = aWins ? 2 : 6;
        m.status = 'finished';
    });
    allMatches.push(...r1.matches);

    // Rondas 2 a 6
    for (let r = 2; r <= 6; r++) {
        const prevRoundMatches = allMatches.filter(m => parseInt(m.round) === r - 1);

        // Extraer compañeros de la ronda inmediatamente anterior (R-1)
        const prevPartners = new Map();
        prevRoundMatches.forEach(m => {
            const teamA = m.team_a_ids || [];
            const teamB = m.team_b_ids || [];
            if (teamA.length === 2) {
                prevPartners.set(String(teamA[0]), String(teamA[1]));
                prevPartners.set(String(teamA[1]), String(teamA[0]));
            }
            if (teamB.length === 2) {
                prevPartners.set(String(teamB[0]), String(teamB[1]));
                prevPartners.set(String(teamB[1]), String(teamB[0]));
            }
        });

        // Generar ronda Twister con TournamentEngine
        const nextRound = Engine.generateRound({
            players,
            courts,
            roundNum: r,
            mode: 'twister',
            matchesHistory: allMatches,
            options: { isMixed: false }
        });

        check(`Ronda ${r} debe generar exactamente ${courts} partidos`, nextRound.matches.length === courts);

        // PASO 1: VALIDACIÓN CON TWISTER INVARIANT GUARD
        const guardReport = TwisterInvariantGuard.validate(prevRoundMatches, nextRound.matches, courts);
        check(`TwisterInvariantGuard certifica validez en Ronda ${r} (${numPlayers} jugadores): ${guardReport.errors.join(' | ')}`, guardReport.valid);

        // PASO 2: VALIDACIÓN CON PREFLIGHT ROUND VERIFIER
        const preFlightReport = PreFlightRoundVerifier.auditRound(nextRound.matches, {
            roundNum: r,
            pairMode: 'twister',
            allMatches,
            prevRoundMatches
        });
        check(`PreFlightRoundVerifier certifica validez en Ronda ${r}`, preFlightReport.isValid);

        // PASO 3: VERIFICACIÓN INDEPENDIENTE DE REGLAS SAGRADAS TWISTER:
        // A) CERO repeticiones con el compañero de la ronda anterior (R-1)
        nextRound.matches.forEach(m => {
            const teamA = m.team_a_ids || [];
            const teamB = m.team_b_ids || [];

            if (teamA.length === 2) {
                const p1 = String(teamA[0]);
                const p2 = String(teamA[1]);
                const prevP1 = prevPartners.get(p1);
                check(`Ronda ${r} Pista ${m.court}: ${p1} NO debe repetir compañero con R-1 (${prevP1})`, prevP1 !== p2);
            }

            if (teamB.length === 2) {
                const p1 = String(teamB[0]);
                const p2 = String(teamB[1]);
                const prevP1 = prevPartners.get(p1);
                check(`Ronda ${r} Pista ${m.court}: ${p1} NO debe repetir compañero con R-1 (${prevP1})`, prevP1 !== p2);
            }
        });

        // B) Ganadores suben y se separan, perdedores bajan y se separan
        prevRoundMatches.forEach(prevM => {
            const courtNum = parseInt(prevM.court);
            const teamAWon = prevM.score_a > prevM.score_b;
            const winners = teamAWon ? prevM.team_a_ids : prevM.team_b_ids;
            const losers = teamAWon ? prevM.team_b_ids : prevM.team_a_ids;

            // Encontrar en qué pistas y equipos quedaron los 2 ganadores en la nueva ronda
            const w1 = String(winners[0]);
            const w2 = String(winners[1]);

            let w1Match = nextRound.matches.find(m => (m.team_a_ids || []).includes(w1) || (m.team_b_ids || []).includes(w1));
            let w2Match = nextRound.matches.find(m => (m.team_a_ids || []).includes(w2) || (m.team_b_ids || []).includes(w2));

            check(`Ganador 1 de Pista ${courtNum} debe tener partido en R${r}`, !!w1Match);
            check(`Ganador 2 de Pista ${courtNum} debe tener partido en R${r}`, !!w2Match);

            // Deben jugar en la misma pista (ambos subieron o se quedaron en P1)
            check(`Los dos ganadores de P${courtNum} deben asignarse a la misma pista destino`, w1Match.court === w2Match.court);

            // Pero DEBEN SEPARARSE (no pueden ser compañeros de equipo en la nueva ronda)
            const w1InTeamA = (w1Match.team_a_ids || []).includes(w1);
            const w2InTeamA = (w1Match.team_a_ids || []).includes(w2);
            check(`Los ganadores de P${courtNum} DEBEN SEPARARSE en R${r}`, w1InTeamA !== w2InTeamA);

            // Lo mismo para los perdedores:
            const l1 = String(losers[0]);
            const l2 = String(losers[1]);

            let l1Match = nextRound.matches.find(m => (m.team_a_ids || []).includes(l1) || (m.team_b_ids || []).includes(l1));
            let l2Match = nextRound.matches.find(m => (m.team_a_ids || []).includes(l2) || (m.team_b_ids || []).includes(l2));

            check(`Perdedor 1 de Pista ${courtNum} debe tener partido en R${r}`, !!l1Match);
            check(`Perdedor 2 de Pista ${courtNum} debe tener partido en R${r}`, !!l2Match);

            // Deben jugar en la misma pista (ambos bajaron o se quedaron en última pista)
            check(`Los dos perdedores de P${courtNum} deben asignarse a la misma pista destino`, l1Match.court === l2Match.court);

            // Pero DEBEN SEPARARSE
            const l1InTeamA = (l1Match.team_a_ids || []).includes(l1);
            const l2InTeamA = (l1Match.team_a_ids || []).includes(l2);
            check(`Los perdedores de P${courtNum} DEBEN SEPARARSE en R${r}`, l1InTeamA !== l2InTeamA);
        });

        // Simular resultados para la ronda actual
        nextRound.matches.forEach((m, idx) => {
            const aWins = (r + idx) % 2 === 0;
            m.score_a = aWins ? 5 : 3;
            m.score_b = aWins ? 3 : 5;
            m.status = 'finished';
        });

        allMatches.push(...nextRound.matches);
    }
    console.log(`  ✅ 6 Rondas Twister validadas: Ganadores/perdedores se separan, 0 repeticiones con R-1.`);
});


// ==============================================================================
// 2.1 CASOS EXTREMOS DE EMPATES EN TWISTER (TODAS LAS PISTAS EMPATADAS)
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("🌀⚖️ CASOS EXTREMOS DE EMPATES EN TWISTER: RESOLUCIÓN LIMPIA SIN BLOQUEOS");
console.log("--------------------------------------------------------------------------------");

[8, 12, 16, 20].forEach(numPlayers => {
    const courts = numPlayers / 4;
    console.log(`\n🔹 [Empate Extremo Twister] ${numPlayers} jugadores (${courts} pistas): Todas empatadas (4-4 y 5-5)...`);

    const players = [];
    for (let i = 1; i <= numPlayers; i++) {
        players.push({
            id: `tw_tie_${numPlayers}_${i}`,
            name: `Jugador ${i}`,
            level: 3.5,
            current_court: Math.floor((i - 1) / 4) + 1
        });
    }

    let allMatches = [];

    // R1
    const r1 = Engine.generateRound({
        players,
        courts,
        roundNum: 1,
        mode: 'twister',
        matchesHistory: [],
        options: { isMixed: false }
    });

    // Forzar empate en todas las pistas de R1
    r1.matches.forEach(m => {
        m.score_a = 4;
        m.score_b = 4;
        m.status = 'finished';
    });
    allMatches.push(...r1.matches);

    // R2 generada sobre empates masivos
    const r2 = Engine.generateRound({
        players,
        courts,
        roundNum: 2,
        mode: 'twister',
        matchesHistory: allMatches,
        options: { isMixed: false }
    });

    check(`R2 tras empate debe generar ${courts} partidos sin bloquearse`, r2.matches.length === courts);

    // Validar con TwisterInvariantGuard
    const guardR2 = TwisterInvariantGuard.validate(r1.matches, r2.matches, courts);
    check(`TwisterInvariantGuard debe confirmar resolución limpia del empate`, guardR2.valid);

    // Forzar empate también en R2 (5-5 en todas las pistas)
    r2.matches.forEach(m => {
        m.score_a = 5;
        m.score_b = 5;
        m.status = 'finished';
    });
    allMatches.push(...r2.matches);

    // R3 generada sobre empates consecutivos
    const r3 = Engine.generateRound({
        players,
        courts,
        roundNum: 3,
        mode: 'twister',
        matchesHistory: allMatches,
        options: { isMixed: false }
    });

    check(`R3 tras segundo empate debe generar ${courts} partidos sin bloquearse`, r3.matches.length === courts);
    const guardR3 = TwisterInvariantGuard.validate(r2.matches, r3.matches, courts);
    check(`TwisterInvariantGuard debe confirmar resolución limpia de R3`, guardR3.valid);

    console.log(`  ✅ Empates extremos en Twister resueltos limpiamente sin errores ni excepciones.`);
});


// ==============================================================================
// 3. AUDITORÍA DE ARCHIVOS DUALES Y PARIDAD
// ==============================================================================
console.log("\n--------------------------------------------------------------------------------");
console.log("📂 FASE 3: AUDITORÍA DE SINCRONIZACIÓN DE ARCHIVOS DUALES");
console.log("--------------------------------------------------------------------------------");

const fs = require('fs');

const dualPairs = [
    { root: 'js/MatchMakingService.js', module: 'js/modules/logic/MatchMakingService.js' },
    { root: 'js/PreFlightRoundVerifier.js', module: 'js/modules/logic/PreFlightRoundVerifier.js' }
];

dualPairs.forEach(pair => {
    const rootContent = fs.readFileSync(pair.root, 'utf8');
    const moduleContent = fs.readFileSync(pair.module, 'utf8');
    const isExact = rootContent === moduleContent;
    check(`Archivo raíz ${pair.root} y módulo ${pair.module} deben ser idénticos byte a byte`, isExact);
    console.log(`  ✅ ${pair.root} <---> ${pair.module}: 100% Sincronizados (${rootContent.length} bytes)`);
});

console.log("\n================================================================================");
console.log(`🎉 CERTIFICACIÓN QA COMPLETADA CON ÉXITO ROTUNDO:`);
console.log(`   - Total Comprobaciones Realizadas: ${totalAssertions}`);
console.log(`   - Comprobaciones Exitosas:         ${passedAssertions}`);
console.log(`   - Comprobaciones Fallidas:         0`);
console.log(`   - Tasa de Éxito:                   100.0%`);
console.log("================================================================================");
