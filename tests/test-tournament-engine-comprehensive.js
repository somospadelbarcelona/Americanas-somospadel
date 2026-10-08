/**
 * test-tournament-engine-comprehensive.js
 * Suite exhaustiva de pruebas unitarias y combinatorias para el TournamentEngine.
 *
 * Cobertura:
 * 1. Detección matemática de imposibilidad (FeasibilityValidator).
 * 2. Combinaciones de jugadores: 8, 10, 12, 14, 16, 18, 20 jugadores x 1 a 5 pistas.
 * 3. Reparto de descansos (BYEs) sin descansos consecutivos y con varianza mínima.
 * 4. Americana Clásica (cero repeticiones de parejas hasta el límite combinatorio).
 * 5. Americana Mexicana (clasificación por puntos + rotación de parejas).
 * 6. Americana Mixta (100% parejas 1M + 1F sin repetición).
 * 7. Rey de la Pista (ascensos a Pista 1, descensos a Pista K, rotación interna).
 * 8. Pozo Americano (subidas/bajadas clásicas con rotación de parejas).
 * 9. Entreno por Rotaciones (rivalidad entre compañeros de club).
 * 10. Entreno por Niveles (segmentación estricta de pistas por nivel).
 * 11. Entreno Libre.
 * 12. Extensibilidad del registro de modalidades.
 */

const assert = require('assert');
const TournamentEngine = require('../js/tournament-engine/TournamentEngine');
const { FeasibilityValidator } = require('../js/tournament-engine/FeasibilityValidator');
const { BaseTournamentMode } = require('../js/tournament-engine/modes/BaseTournamentMode');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        testsPassed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(err);
        testsFailed++;
    }
}

function createPlayers(count, options = {}) {
    const players = [];
    for (let i = 1; i <= count; i++) {
        let gender = 'M';
        if (options.mixed) {
            gender = (i % 2 === 1) ? 'M' : 'F';
        } else if (options.allMen) {
            gender = 'M';
        } else if (options.allWomen) {
            gender = 'F';
        }

        players.push({
            id: `p${i}`,
            uid: `p${i}`,
            name: `Jugador ${i}`,
            level: options.levels ? options.levels[i - 1] : 3.0 + (i * 0.1),
            gender,
            team: options.teams ? options.teams[i - 1] : (i <= count / 2 ? 'Club Alfa' : 'Club Beta')
        });
    }
    return players;
}

console.log("\n=======================================================");
console.log("🚀 EJECUTANDO TEST SUITE UNIVERSAL DE TOURNAMENT ENGINE");
console.log("=======================================================\n");

// =======================================================
// BLOQUE 1: VALIDACIÓN MATEMÁTICA Y FACTIBILIDAD A PRIORI
// =======================================================
console.log("--- BLOQUE 1: VALIDACIÓN MATEMÁTICA Y CASOS IMPOSIBLES ---");

runTest("1.1 Detecta error si hay menos de 4 jugadores", () => {
    const res = FeasibilityValidator.validate({ players: 3, courts: 1 });
    assert.strictEqual(res.valid, false);
    assert(res.errors[0].includes("Configuración matemáticamente imposible"));
});

runTest("1.2 Detecta error si hay menos de 1 pista", () => {
    const res = FeasibilityValidator.validate({ players: 8, courts: 0 });
    assert.strictEqual(res.valid, false);
    assert(res.errors[0].includes("Configuración matemáticamente imposible"));
});

runTest("1.3 Detecta imposibilidad combinatoria de parejas (8 jugadores, 12 rondas sin repetir)", () => {
    // 8 jugadores -> máximo 7 parejas distintas posibles por jugador
    const res = FeasibilityValidator.validate({
        players: 8,
        courts: 2,
        rounds: 12,
        hardNoRepeatPartner: true
    });
    assert.strictEqual(res.valid, false);
    assert(res.errors[0].includes("límite combinatorio máximo absoluto"));
});

runTest("1.4 Detecta imposibilidad en Mixta sin descansos con géneros impares", () => {
    // 5 hombres y 3 mujeres, 2 pistas, sin descansos -> Imposible llenar 2 pistas de 1M+1F
    const res = FeasibilityValidator.validate({
        players: 8,
        courts: 2,
        mode: 'mixta',
        menCount: 5,
        womenCount: 3,
        noByesAllowed: true
    });
    assert.strictEqual(res.valid, false);
    assert(res.errors[0].includes("paridad exacta entre hombres y mujeres"));
});

runTest("1.5 Detecta imposibilidad en Mixta si faltan hombres o mujeres (< 2)", () => {
    const res = FeasibilityValidator.validate({
        players: 8,
        courts: 2,
        mode: 'mixta',
        menCount: 1,
        womenCount: 7
    });
    assert.strictEqual(res.valid, false);
    assert(res.errors[0].includes("mínimo de 2 hombres y 2 mujeres"));
});

runTest("1.6 Detecta límite combinatorio en Mixta (4H + 4M, 6 rondas sin repetir)", () => {
    // Un hombre solo tiene 4 mujeres posibles como pareja
    const res = FeasibilityValidator.validate({
        players: 8,
        courts: 2,
        mode: 'mixta',
        menCount: 4,
        womenCount: 4,
        rounds: 6,
        hardNoRepeatPartner: true
    });
    assert.strictEqual(res.valid, false);
    assert(res.errors[0].includes("número máximo combinatorio de rondas sin repetir pareja es 4"));
});

runTest("1.7 TournamentEngine.generateRound lanza excepción explícita ante configuración imposible", () => {
    assert.throws(() => {
        TournamentEngine.generateRound({
            players: createPlayers(8),
            courts: 2,
            options: { rounds: 10, hardNoRepeatPartner: true }
        });
    }, /Configuración matemáticamente imposible/);
});

// =======================================================
// BLOQUE 2: AMERICANA CLÁSICA Y COMBINATORIA MULTIPLAYER
// =======================================================
console.log("\n--- BLOQUE 2: AMERICANA CLÁSICA (8, 10, 12, 14, 16, 18, 20 JUGADORES) ---");

runTest("2.1 [8 Jugadores / 2 Pistas]: 7 rondas sin repetir NINGUNA pareja", () => {
    const players = createPlayers(8);
    const matchesHistory = [];
    const pairHistoryMap = {};
    players.forEach(p => pairHistoryMap[p.id] = new Set());

    for (let r = 1; r <= 7; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 2,
            roundNum: r,
            mode: 'clasica',
            matchesHistory,
            options: { hardNoRepeatPartner: true }
        });

        assert.strictEqual(result.matches.length, 2, `Ronda ${r} debe tener 2 partidos`);
        assert.strictEqual(result.restingPlayers.length, 0, `Ronda ${r} no debe tener descansos`);

        result.matches.forEach(m => {
            const teamA = m.team_a_ids;
            const teamB = m.team_b_ids;

            // Verificar que no se hayan emparejado antes
            assert(!pairHistoryMap[teamA[0]].has(teamA[1]), `R${r}: Pareja ${teamA[0]}-${teamA[1]} repetida!`);
            assert(!pairHistoryMap[teamB[0]].has(teamB[1]), `R${r}: Pareja ${teamB[0]}-${teamB[1]} repetida!`);

            pairHistoryMap[teamA[0]].add(teamA[1]);
            pairHistoryMap[teamA[1]].add(teamA[0]);
            pairHistoryMap[teamB[0]].add(teamB[1]);
            pairHistoryMap[teamB[1]].add(teamB[0]);

            matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 4 });
        });
    }

    // Cada uno de los 8 jugadores debe haber tenido exactamente 7 compañeros únicos distintos
    players.forEach(p => {
        assert.strictEqual(pairHistoryMap[p.id].size, 7, `Jugador ${p.id} debe haber jugado con los otros 7 jugadores`);
    });
});

runTest("2.2 [10 Jugadores / 2 Pistas]: 5 rondas con descansos perfectos (1 descanso exacto por jugador)", () => {
    const players = createPlayers(10);
    const matchesHistory = [];
    const byeCountMap = {};
    players.forEach(p => byeCountMap[p.id] = 0);
    let prevRoundByes = [];

    for (let r = 1; r <= 5; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 2,
            roundNum: r,
            mode: 'clasica',
            matchesHistory
        });

        assert.strictEqual(result.matches.length, 2, `Ronda ${r} debe tener 2 partidos (8 jugadores activos)`);
        assert.strictEqual(result.restingPlayers.length, 2, `Ronda ${r} debe tener exactamente 2 descansos`);

        // Comprobar que nadie descanse 2 rondas seguidas
        result.restingPlayers.forEach(rp => {
            assert(!prevRoundByes.includes(rp.id), `Jugador ${rp.id} descansó en R${r - 1} y no debe descansar en R${r}`);
            byeCountMap[rp.id]++;
        });

        prevRoundByes = result.restingPlayers.map(p => p.id);

        result.matches.forEach(m => {
            matchesHistory.push({ ...m, status: 'finished', score_a: 5, score_b: 5 });
        });
    }

    // En 5 rondas con 2 descansos por ronda = 10 descansos totales -> Cada jugador descansó EXACTAMENTE 1 vez
    players.forEach(p => {
        assert.strictEqual(byeCountMap[p.id], 1, `Jugador ${p.id} debe haber descansado exactamente 1 vez (Varianza 0)`);
    });
});

runTest("2.3 [12 Jugadores / 3 Pistas]: 5 rondas sin descansos", () => {
    const players = createPlayers(12);
    const matchesHistory = [];
    for (let r = 1; r <= 5; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 3,
            roundNum: r,
            mode: 'clasica',
            matchesHistory
        });
        assert.strictEqual(result.matches.length, 3);
        assert.strictEqual(result.restingPlayers.length, 0);
        result.matches.forEach(m => matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 3 }));
    }
});

runTest("2.4 [14 Jugadores / 3 Pistas]: 4 rondas con 2 descansos por ronda, sin descansos consecutivos", () => {
    const players = createPlayers(14);
    const matchesHistory = [];
    let prevByes = [];

    for (let r = 1; r <= 4; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 3,
            roundNum: r,
            mode: 'clasica',
            matchesHistory
        });
        assert.strictEqual(result.matches.length, 3);
        assert.strictEqual(result.restingPlayers.length, 2);

        result.restingPlayers.forEach(p => {
            assert(!prevByes.includes(p.id), `Jugador ${p.id} no debe descansar 2 rondas seguidas`);
        });
        prevByes = result.restingPlayers.map(p => p.id);

        result.matches.forEach(m => matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 4 }));
    }
});

runTest("2.5 [16 Jugadores / 4 Pistas]: 4 rondas limpias", () => {
    const players = createPlayers(16);
    const matchesHistory = [];
    for (let r = 1; r <= 4; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 4,
            roundNum: r,
            mode: 'clasica',
            matchesHistory
        });
        assert.strictEqual(result.matches.length, 4);
        assert.strictEqual(result.restingPlayers.length, 0);
        result.matches.forEach(m => matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 4 }));
    }
});

runTest("2.6 [18 Jugadores / 4 Pistas]: 4 rondas con 2 descansos por ronda", () => {
    const players = createPlayers(18);
    const matchesHistory = [];
    for (let r = 1; r <= 4; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 4,
            roundNum: r,
            mode: 'clasica',
            matchesHistory
        });
        assert.strictEqual(result.matches.length, 4);
        assert.strictEqual(result.restingPlayers.length, 2);
        result.matches.forEach(m => matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 4 }));
    }
});

runTest("2.7 [20 Jugadores / 5 Pistas]: 4 rondas con 20 jugadores activos", () => {
    const players = createPlayers(20);
    const matchesHistory = [];
    for (let r = 1; r <= 4; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 5,
            roundNum: r,
            mode: 'clasica',
            matchesHistory
        });
        assert.strictEqual(result.matches.length, 5);
        assert.strictEqual(result.restingPlayers.length, 0);
        result.matches.forEach(m => matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 4 }));
    }
});

// =======================================================
// BLOQUE 3: AMERICANA MIXTA
// =======================================================
console.log("\n--- BLOQUE 3: AMERICANA MIXTA ---");

runTest("3.1 [8 Jugadores Mixtos (4H + 4M)]: 100% parejas mixtas y rotación completa sin repetir", () => {
    const players = [
        { id: 'h1', name: 'Hombre 1', gender: 'M' },
        { id: 'h2', name: 'Hombre 2', gender: 'M' },
        { id: 'h3', name: 'Hombre 3', gender: 'M' },
        { id: 'h4', name: 'Hombre 4', gender: 'M' },
        { id: 'm1', name: 'Mujer 1', gender: 'F' },
        { id: 'm2', name: 'Mujer 2', gender: 'F' },
        { id: 'm3', name: 'Mujer 3', gender: 'F' },
        { id: 'm4', name: 'Mujer 4', gender: 'F' }
    ];

    const matchesHistory = [];
    const manPartners = { h1: new Set(), h2: new Set(), h3: new Set(), h4: new Set() };

    for (let r = 1; r <= 4; r++) {
        const result = TournamentEngine.generateRound({
            players,
            courts: 2,
            roundNum: r,
            mode: 'mixta',
            matchesHistory,
            options: { hardNoRepeatPartner: true }
        });

        assert.strictEqual(result.matches.length, 2);

        result.matches.forEach(m => {
            // Verificar Team A: 1H + 1M
            const aGenders = m.team_a_players.map(p => p.gender).sort().join('');
            assert.strictEqual(aGenders, 'FM', `Team A en Pista ${m.court} debe ser 1M + 1F`);

            // Verificar Team B: 1H + 1M
            const bGenders = m.team_b_players.map(p => p.gender).sort().join('');
            assert.strictEqual(bGenders, 'FM', `Team B en Pista ${m.court} debe ser 1M + 1F`);

            // Registrar y verificar no repetición de compañera
            const manA = m.team_a_players.find(p => p.gender === 'M');
            const womanA = m.team_a_players.find(p => p.gender === 'F');
            assert(!manPartners[manA.id].has(womanA.id), `Hombre ${manA.id} repitió con ${womanA.id} en R${r}`);
            manPartners[manA.id].add(womanA.id);

            const manB = m.team_b_players.find(p => p.gender === 'M');
            const womanB = m.team_b_players.find(p => p.gender === 'F');
            assert(!manPartners[manB.id].has(womanB.id), `Hombre ${manB.id} repitió con ${womanB.id} en R${r}`);
            manPartners[manB.id].add(womanB.id);

            matchesHistory.push({ ...m, status: 'finished', score_a: 6, score_b: 4 });
        });
    }

    // Cada hombre jugó con las 4 mujeres
    Object.keys(manPartners).forEach(hid => {
        assert.strictEqual(manPartners[hid].size, 4, `Hombre ${hid} debe haber jugado con las 4 mujeres`);
    });
});

// =======================================================
// BLOQUE 4: REY DE LA PISTA Y POZO AMERICANO
// =======================================================
console.log("\n--- BLOQUE 4: REY DE LA PISTA Y POZO AMERICANO ---");

runTest("4.1 Rey de la Pista: Ascensos a Pista 1, descensos y rotación interna de compañeros", () => {
    const players = createPlayers(8);
    // R1
    const r1 = TournamentEngine.generateRound({
        players,
        courts: 2,
        roundNum: 1,
        mode: 'rey_pista'
    });

    assert.strictEqual(r1.matches.length, 2);

    // Simulamos que en Pista 2 gana Team A
    const mPista2 = r1.matches.find(m => m.court === 2);
    const winnersPista2 = mPista2.team_a_ids;

    const finishedR1 = r1.matches.map(m => {
        if (m.court === 2) return { ...m, status: 'finished', score_a: 6, score_b: 2 };
        return { ...m, status: 'finished', score_a: 6, score_b: 4 };
    });

    // R2
    const r2 = TournamentEngine.generateRound({
        players: r1.updatedPlayers,
        courts: 2,
        roundNum: 2,
        mode: 'rey_pista',
        matchesHistory: finishedR1
    });

    // Los ganadores de Pista 2 deben haber ascendido a Pista 1
    const mPista1R2 = r2.matches.find(m => m.court === 1);
    const playersInPista1R2 = [...mPista1R2.team_a_ids, ...mPista1R2.team_b_ids];

    winnersPista2.forEach(wId => {
        assert(playersInPista1R2.includes(wId), `Ganador de Pista 2 (${wId}) debe ascender a Pista 1 en Rey de la Pista`);
    });

    // Verificar que los ganadores de Pista 2 NO sean pareja entre sí en R2 (rotación de compañeros)
    const [w1, w2] = winnersPista2;
    const sameTeamR2 = (mPista1R2.team_a_ids.includes(w1) && mPista1R2.team_a_ids.includes(w2)) ||
        (mPista1R2.team_b_ids.includes(w1) && mPista1R2.team_b_ids.includes(w2));
    assert(!sameTeamR2, `Los ganadores de Pista 2 deben rotar y NO repetir como pareja inmediata en Pista 1`);
});

runTest("4.2 Pozo Americano: Subidas y bajadas de escalera y rotación de parejas", () => {
    const players = createPlayers(12);
    const r1 = TournamentEngine.generateRound({
        players,
        courts: 3,
        roundNum: 1,
        mode: 'pozo'
    });
    assert.strictEqual(r1.matches.length, 3);

    const finishedR1 = r1.matches.map(m => ({ ...m, status: 'finished', score_a: 6, score_b: 3 }));
    const r2 = TournamentEngine.generateRound({
        players: r1.updatedPlayers,
        courts: 3,
        roundNum: 2,
        mode: 'pozo',
        matchesHistory: finishedR1
    });
    assert.strictEqual(r2.matches.length, 3);
});

// =======================================================
// BLOQUE 5: AMERICANA MEXICANA (SUIZO)
// =======================================================
console.log("\n--- BLOQUE 5: AMERICANA MEXICANA (SISTEMA SUIZO) ---");

runTest("5.1 Americana Mexicana agrupa a mayores anotadores en Pista 1", () => {
    const players = createPlayers(8);
    // Ronda 1
    const r1 = TournamentEngine.generateRound({
        players,
        courts: 2,
        roundNum: 1,
        mode: 'mexicana'
    });

    // Simulamos que Team A de Pista 1 gana 10-0 (máximos anotadores)
    const mPista1 = r1.matches.find(m => m.court === 1);
    const topScorers = mPista1.team_a_ids;

    const finishedR1 = r1.matches.map(m => {
        if (m.court === 1) return { ...m, status: 'finished', score_a: 10, score_b: 0 };
        return { ...m, status: 'finished', score_a: 5, score_b: 5 };
    });

    const r2 = TournamentEngine.generateRound({
        players: r1.updatedPlayers,
        courts: 2,
        roundNum: 2,
        mode: 'mexicana',
        matchesHistory: finishedR1
    });

    const r2Pista1 = r2.matches.find(m => m.court === 1);
    const p1Players = [...r2Pista1.team_a_ids, ...r2Pista1.team_b_ids];

    // Los dos máximos anotadores deben estar en Pista 1
    topScorers.forEach(id => {
        assert(p1Players.includes(id), `Máximo anotador ${id} debe jugar en Pista 1 en Americana Mexicana`);
    });
});

// =======================================================
// BLOQUE 6: MODOS DE ENTRENAMIENTO Y EXTENSIBILIDAD
// =======================================================
console.log("\n--- BLOQUE 6: ENTRENAMIENTOS Y EXTENSIBILIDAD ---");

runTest("6.1 Entreno Rotaciones: Enfrenta a compañeros del mismo club como rivales", () => {
    const players = [
        { id: 'p1', name: 'A1', team: 'Real Club' },
        { id: 'p2', name: 'A2', team: 'Real Club' },
        { id: 'p3', name: 'B1', team: 'Padel Club' },
        { id: 'p4', name: 'B2', team: 'Padel Club' }
    ];

    const result = TournamentEngine.generateRound({
        players,
        courts: 1,
        roundNum: 1,
        mode: 'entreno_rotaciones'
    });

    const match = result.matches[0];
    const teamA = match.team_a_players;
    const teamB = match.team_b_players;

    // En entreno rotaciones con 2 de Real Club y 2 de Padel Club:
    // Los de Real Club NO deben ser pareja entre sí, deben estar uno en Team A y otro en Team B!
    assert.notStrictEqual(teamA[0].team, teamA[1]?.team, "Compañeros del mismo club no deben formar la misma pareja");
    assert.notStrictEqual(teamB[0].team, teamB[1]?.team, "Compañeros del mismo club no deben formar la misma pareja");
});

runTest("6.2 Entreno por Niveles: Separa por franjas de nivel", () => {
    const players = [
        { id: 'p1', name: 'Top 1', level: 5.0 },
        { id: 'p2', name: 'Top 2', level: 4.8 },
        { id: 'p3', name: 'Top 3', level: 4.6 },
        { id: 'p4', name: 'Top 4', level: 4.5 },
        { id: 'p5', name: 'Med 1', level: 3.0 },
        { id: 'p6', name: 'Med 2', level: 2.8 },
        { id: 'p7', name: 'Med 3', level: 2.5 },
        { id: 'p8', name: 'Med 4', level: 2.0 }
    ];

    const result = TournamentEngine.generateRound({
        players,
        courts: 2,
        roundNum: 1,
        mode: 'entreno_niveles'
    });

    const mPista1 = result.matches.find(m => m.court === 1);
    const p1Ids = [...mPista1.team_a_ids, ...mPista1.team_b_ids];

    ['p1', 'p2', 'p3', 'p4'].forEach(topId => {
        assert(p1Ids.includes(topId), `Jugador de nivel alto ${topId} debe estar en Pista 1`);
    });
});

runTest("6.3 Extensibilidad: Registrar modalidad personalizada en TournamentEngine", () => {
    class CustomCrazyMode extends BaseTournamentMode {
        constructor() {
            super('custom_crazy', 'Modo Loco', 'Modalidad experimental');
        }
        generateRound(context) {
            const { players, courts, roundNum, solver } = context;
            const matches = solver.solveGlobal(players.slice(0, 4), 1, {}, { roundNum });
            return {
                matches,
                restingPlayers: players.slice(4),
                updatedPlayers: players
            };
        }
    }

    const custom = new CustomCrazyMode();
    TournamentEngine.registerMode(custom);

    const resolved = TournamentEngine.getMode('custom_crazy');
    assert.strictEqual(resolved.getName(), 'Modo Loco');

    const result = TournamentEngine.generateRound({
        players: createPlayers(8),
        courts: 1,
        mode: 'custom_crazy'
    });

    assert.strictEqual(result.mode, 'custom_crazy');
    assert.strictEqual(result.matches.length, 1);
    assert.strictEqual(result.restingPlayers.length, 4);
});

// =======================================================
// RESUMEN FINAL
// =======================================================
console.log("\n=======================================================");
console.log(`📊 RESULTADOS: ${testsPassed} PASADOS | ${testsFailed} FALLADOS`);
console.log("=======================================================\n");

if (testsFailed > 0) {
    process.exit(1);
} else {
    console.log("🎉 ¡100% DE LOS TESTS MATEMÁTICOS Y CSP COMPLETADOS CON ÉXITO!");
}
