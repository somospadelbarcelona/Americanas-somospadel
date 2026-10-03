/**
 * test-twister-engine-backend-qa.js
 * Test exhaustivo de backend para verificar la lógica de ascensos/descensos Twister
 * y la integración con TournamentEngine y RotatingPozoLogic.
 */

const assert = require('assert');
const path = require('path');

// 1. Cargar TournamentEngine y sus módulos
const { TournamentEngine } = require('../js/tournament-engine/TournamentEngine');
const { RotatingPozoLogic } = require('../js/rotating-pozo-logic');

console.log('🧪 ========================================================');
console.log('🧪 INICIANDO TEST SUITE BACKEND: TWISTER & TOURNAMENT ENGINE');
console.log('🧪 ========================================================\n');

const engine = new TournamentEngine();

// --- TEST 1: REGLAS SAGRADAS DE TWISTER EN TOURNAMENT ENGINE (2 PISTAS, CATEGORY MIXED) ---
console.log('📋 TEST 1: Americana Twister 8 Jugadores (2 Pistas, Categoría Mixed, Chicos y Chicas)...');
{
    const players = [
        { id: 'h1', name: 'Carlos', gender: 'chico', level: 4.5, current_court: 1 },
        { id: 'm1', name: 'Laura', gender: 'chica', level: 4.2, current_court: 1 },
        { id: 'h2', name: 'Marcos', gender: 'chico', level: 4.0, current_court: 1 },
        { id: 'h3', name: 'David', gender: 'chico', level: 3.8, current_court: 1 },
        { id: 'm2', name: 'Sofia', gender: 'chica', level: 3.5, current_court: 2 },
        { id: 'm3', name: 'Elena', gender: 'chica', level: 3.2, current_court: 2 },
        { id: 'h4', name: 'Javier', gender: 'chico', level: 3.0, current_court: 2 },
        { id: 'm4', name: 'Ana', gender: 'chica', level: 2.8, current_court: 2 }
    ];

    // Ronda 1
    const r1 = engine.generateRound({
        players,
        courts: 2,
        roundNum: 1,
        mode: 'twister',
        matchesHistory: [],
        options: {
            rounds: 4,
            isMixed: false,
            category: 'mixed'
        }
    });

    assert.strictEqual(r1.matches.length, 2, 'Ronda 1 debe tener 2 partidos');
    console.log('   ✅ R1 generada con éxito: 2 pistas.');

    // Simular resultados R1:
    // Pista 1: Team A [Carlos, Laura] gana a Team B [Marcos, David] (6 - 2)
    // Pista 2: Team A [Sofia, Elena] gana a Team B [Javier, Ana] (6 - 4)
    const m1_r1 = r1.matches.find(m => m.court === 1);
    const m2_r1 = r1.matches.find(m => m.court === 2);

    const matchHistoryR1 = [
        {
            ...m1_r1,
            score_a: 6,
            score_b: 2,
            status: 'finished',
            winner: 'team_a'
        },
        {
            ...m2_r1,
            score_a: 6,
            score_b: 4,
            status: 'finished',
            winner: 'team_a'
        }
    ];

    const p1Winners = m1_r1.team_a_ids;
    const p1Losers = m1_r1.team_b_ids;
    const p2Winners = m2_r1.team_a_ids;
    const p2Losers = m2_r1.team_b_ids;

    console.log(`   P1 Ganadores: [${p1Winners.join(', ')}], Perdedores: [${p1Losers.join(', ')}]`);
    console.log(`   P2 Ganadores: [${p2Winners.join(', ')}], Perdedores: [${p2Losers.join(', ')}]`);

    // Generar Ronda 2
    const r2 = engine.generateRound({
        players: r1.updatedPlayers,
        courts: 2,
        roundNum: 2,
        mode: 'twister',
        matchesHistory: matchHistoryR1,
        options: {
            rounds: 4,
            isMixed: false,
            category: 'mixed'
        }
    });

    assert.strictEqual(r2.matches.length, 2, 'Ronda 2 debe tener 2 partidos');

    const m1_r2 = r2.matches.find(m => m.court === 1);
    const m2_r2 = r2.matches.find(m => m.court === 2);

    const r2_p1_players = [...m1_r2.team_a_ids, ...m1_r2.team_b_ids];
    const r2_p2_players = [...m2_r2.team_a_ids, ...m2_r2.team_b_ids];

    console.log(`   R2 Pista 1 Jugadores: [${r2_p1_players.join(', ')}]`);
    console.log(`   R2 Pista 2 Jugadores: [${r2_p2_players.join(', ')}]`);

    // REGLA 3: Ganadores de P1 se quedan en P1
    p1Winners.forEach(id => {
        assert(r2_p1_players.includes(id), `Ganador de P1 (${id}) debe quedarse en P1`);
    });
    // REGLA 1: Ganadores de P2 suben a P1
    p2Winners.forEach(id => {
        assert(r2_p1_players.includes(id), `Ganador de P2 (${id}) debe subir a P1`);
    });
    // REGLA 2: Perdedores de P1 bajan a P2
    p1Losers.forEach(id => {
        assert(r2_p2_players.includes(id), `Perdedor de P1 (${id}) debe bajar a P2`);
    });
    // REGLA 4: Perdedores de P2 se quedan en P2
    p2Losers.forEach(id => {
        assert(r2_p2_players.includes(id), `Perdedor de P2 (${id}) debe quedarse en P2`);
    });

    console.log('   ✅ REGLAS 1, 2, 3 y 4 de ascensos y descensos validadas al 100%.');

    // SEPARACIÓN OBLIGATORIA DE COMPAÑEROS PREVIOS:
    // En Pista 1:
    // Los 2 que ganaron en P1 (p1Winners[0] y p1Winners[1]) NO pueden ser pareja en R2
    const areP1WinnersPartnersInR2 = 
        (m1_r2.team_a_ids.includes(p1Winners[0]) && m1_r2.team_a_ids.includes(p1Winners[1])) ||
        (m1_r2.team_b_ids.includes(p1Winners[0]) && m1_r2.team_b_ids.includes(p1Winners[1]));
    assert(!areP1WinnersPartnersInR2, 'Los 2 ganadores de P1 DEBEN separarse en R2 (uno en Team A y otro en Team B)');

    // Los 2 que ganaron en P2 (p2Winners[0] y p2Winners[1]) NO pueden ser pareja en R2
    const areP2WinnersPartnersInR2 = 
        (m1_r2.team_a_ids.includes(p2Winners[0]) && m1_r2.team_a_ids.includes(p2Winners[1])) ||
        (m1_r2.team_b_ids.includes(p2Winners[0]) && m1_r2.team_b_ids.includes(p2Winners[1]));
    assert(!areP2WinnersPartnersInR2, 'Los 2 ganadores de P2 DEBEN separarse en R2 (uno en Team A y otro en Team B)');

    // En Pista 2:
    // Los 2 perdedores de P1 deben separarse
    const areP1LosersPartnersInR2 = 
        (m2_r2.team_a_ids.includes(p1Losers[0]) && m2_r2.team_a_ids.includes(p1Losers[1])) ||
        (m2_r2.team_b_ids.includes(p1Losers[0]) && m2_r2.team_b_ids.includes(p1Losers[1]));
    assert(!areP1LosersPartnersInR2, 'Los 2 perdedores de P1 DEBEN separarse en R2');

    // Los 2 perdedores de P2 deben separarse
    const areP2LosersPartnersInR2 = 
        (m2_r2.team_a_ids.includes(p2Losers[0]) && m2_r2.team_a_ids.includes(p2Losers[1])) ||
        (m2_r2.team_b_ids.includes(p2Losers[0]) && m2_r2.team_b_ids.includes(p2Losers[1]));
    assert(!areP2LosersPartnersInR2, 'Los 2 perdedores de P2 DEBEN separarse en R2');

    console.log('   ✅ SEPARACIÓN DE PAREJAS: ¡Ninguna pareja de R1 repite en R2! Se separan perfectamente.');
}

// --- TEST 2: ESCENARIO 3 PISTAS (K = 3) CON DIVERSAS ESTRUCTURAS DE PARTIDO ---
console.log('\n📋 TEST 2: Americana Twister 12 Jugadores (3 Pistas, K=3, Formatos heterogéneos de score)...');
{
    const players12 = [];
    for (let i = 1; i <= 12; i++) {
        players12.push({
            id: `p${i}`,
            name: `Jugador ${i}`,
            level: 3.5,
            gender: i % 2 === 0 ? 'chica' : 'chico',
            current_court: Math.floor((i - 1) / 4) + 1
        });
    }

    const r1 = engine.generateRound({
        players: players12,
        courts: 3,
        roundNum: 1,
        mode: 'twister',
        matchesHistory: []
    });

    assert.strictEqual(r1.matches.length, 3, 'R1 debe tener 3 pistas');

    // Simular diferentes formatos de datos en R1:
    // Pista 1 usa score_a / score_b
    // Pista 2 usa games_a / games_b
    // Pista 3 usa winner: 'team_b' con player_b1_id / player_b2_id
    const prevMatches = [
        {
            court: 1,
            round: 1,
            team_a_ids: r1.matches[0].team_a_ids,
            team_b_ids: r1.matches[0].team_b_ids,
            score_a: 7,
            score_b: 3,
            status: 'finished'
        },
        {
            court: 2,
            round: 1,
            team_a_ids: r1.matches[1].team_a_ids,
            team_b_ids: r1.matches[1].team_b_ids,
            games_a: 2,
            games_b: 6,
            status: 'finished'
        },
        {
            court: 3,
            round: 1,
            player_a1_id: r1.matches[2].team_a_ids[0],
            player_a2_id: r1.matches[2].team_a_ids[1],
            player_b1_id: r1.matches[2].team_b_ids[0],
            player_b2_id: r1.matches[2].team_b_ids[1],
            winner: 'team_a',
            status: 'finished'
        }
    ];

    const r2 = engine.generateRound({
        players: r1.updatedPlayers,
        courts: 3,
        roundNum: 2,
        mode: 'twister',
        matchesHistory: prevMatches
    });

    assert.strictEqual(r2.matches.length, 3, 'R2 debe tener 3 pistas');

    const p1Winners = prevMatches[0].team_a_ids; // Ganó A
    const p1Losers = prevMatches[0].team_b_ids;
    const p2Winners = prevMatches[1].team_b_ids; // Ganó B
    const p2Losers = prevMatches[1].team_a_ids;
    const p3Winners = [prevMatches[2].player_a1_id, prevMatches[2].player_a2_id]; // Ganó A
    const p3Losers = [prevMatches[2].player_b1_id, prevMatches[2].player_b2_id];

    const r2_c1 = [...r2.matches[0].team_a_ids, ...r2.matches[0].team_b_ids];
    const r2_c2 = [...r2.matches[1].team_a_ids, ...r2.matches[1].team_b_ids];
    const r2_c3 = [...r2.matches[2].team_a_ids, ...r2.matches[2].team_b_ids];

    // P1: Ganadores P1 + Ganadores P2
    p1Winners.forEach(id => assert(r2_c1.includes(id), `Ganador P1 ${id} debe estar en P1`));
    p2Winners.forEach(id => assert(r2_c1.includes(id), `Ganador P2 ${id} debe subir a P1`));

    // P2: Perdedores P1 + Ganadores P3
    p1Losers.forEach(id => assert(r2_c2.includes(id), `Perdedor P1 ${id} debe bajar a P2`));
    p3Winners.forEach(id => assert(r2_c2.includes(id), `Ganador P3 ${id} debe subir a P2`));

    // P3: Perdedores P2 + Perdedores P3
    p2Losers.forEach(id => assert(r2_c3.includes(id), `Perdedor P2 ${id} debe bajar a P3`));
    p3Losers.forEach(id => assert(r2_c3.includes(id), `Perdedor P3 ${id} debe quedarse en P3`));

    console.log('   ✅ 3 Pistas (K=3) verificadas: Ascensos, Descensos y Permanencias correctas.');
}

// --- TEST 3: VALIDACIÓN DIRECTA DE ROTATINGPOZOLOGIC SIN DISCRIMINACIÓN DE GÉNERO ---
console.log('\n📋 TEST 3: Validación directa de RotatingPozoLogic con category="mixed"...');
{
    const playersMixed = [
        { id: 'm1', name: 'H1', gender: 'chico', current_court: 1 },
        { id: 'm2', name: 'H2', gender: 'chico', current_court: 1 },
        { id: 'f1', name: 'M1', gender: 'chica', current_court: 1 },
        { id: 'f2', name: 'M2', gender: 'chica', current_court: 1 },
        { id: 'm3', name: 'H3', gender: 'chico', current_court: 2 },
        { id: 'm4', name: 'H4', gender: 'chico', current_court: 2 },
        { id: 'f3', name: 'M3', gender: 'chica', current_court: 2 },
        { id: 'f4', name: 'M4', gender: 'chica', current_court: 2 }
    ];

    // En P1 juegan [H1, H2] (dos chicos) vs [M1, M2] (dos chicas) -> Ganan [H1, H2]
    // En P2 juegan [H3, M3] (mixto) vs [H4, M4] (mixto) -> Ganan [H3, M3]
    const matchesMixed = [
        { round: 1, court: 1, team_a_ids: ['m1', 'm2'], team_b_ids: ['f1', 'f2'], score_a: 6, score_b: 1, status: 'finished' },
        { round: 1, court: 2, team_a_ids: ['m3', 'f3'], team_b_ids: ['m4', 'f4'], score_a: 6, score_b: 3, status: 'finished' }
    ];

    // Pasamos category='mixed' explícitamente:
    // Ganadores de P1 (H1, H2) se quedan en P1
    // Ganadores de P2 (H3, M3) suben a P1
    // Perdedores de P1 (M1, M2) bajan a P2
    // Perdedores de P2 (H4, M4) se quedan en P2
    const updated = RotatingPozoLogic.updatePlayerCourts(playersMixed, matchesMixed, 2, 'mixed');

    const p1Players = updated.filter(p => p.current_court === 1).map(p => p.id);
    const p2Players = updated.filter(p => p.current_court === 2).map(p => p.id);

    console.log(`   Pista 1 actualizada: [${p1Players.join(', ')}]`);
    console.log(`   Pista 2 actualizada: [${p2Players.join(', ')}]`);

    assert(p1Players.includes('m1') && p1Players.includes('m2'), 'H1 y H2 deben estar en P1');
    assert(p1Players.includes('m3') && p1Players.includes('f3'), 'H3 y M3 deben haber subido a P1');
    assert(p2Players.includes('f1') && p2Players.includes('f2'), 'M1 y M2 deben haber bajado a P2');
    assert(p2Players.includes('m4') && p2Players.includes('f4'), 'H4 y M4 deben estar en P2');

    // Generar partidos en RotatingPozoLogic
    const nextMatches = RotatingPozoLogic.generateRound(updated, 2, 2, 'mixed');
    assert.strictEqual(nextMatches.length, 2, 'Deben generarse 2 partidos');

    // En P1 juegan H1, H2, H3, M3 (3 chicos y 1 chica).
    // ¡La lógica antigua fallaba o forzaba chico-chica!
    // Ahora smartPairs forma parejas sin segregar por género:
    const m1TeamA = nextMatches[0].team_a_ids;
    const m1TeamB = nextMatches[0].team_b_ids;
    
    // H1 y H2 que jugaron juntos en R1 NO deben jugar juntos en R2
    const h1h2Together = (m1TeamA.includes('m1') && m1TeamA.includes('m2')) || (m1TeamB.includes('m1') && m1TeamB.includes('m2'));
    assert(!h1h2Together, 'H1 y H2 NO deben volver a ser pareja en R2');

    console.log('   ✅ RotatingPozoLogic no segrega por género y separa parejas previas correctamente.');
}

console.log('\n🎉 ========================================================');
console.log('🎉 TODOS LOS TESTS BACKEND DE TWISTER PASARON EXITOSAMENTE!');
console.log('🎉 ========================================================');
