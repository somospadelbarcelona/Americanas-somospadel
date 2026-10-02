/**
 * Test unitario para PlayerHistoryService
 */
const assert = require('assert');
const fs = require('fs');

// Mock browser window
global.window = {
    FirebaseDB: {
        matches: {
            getByPlayer: async (playerId) => {
                return [
                    {
                        id: 'm1',
                        court: 1,
                        round: 1,
                        score_a: 18,
                        score_b: 12,
                        status: 'finished',
                        team_a_ids: ['u_123', 'u_partner1'],
                        team_b_ids: ['u_rival1', 'u_rival2'],
                        team_a_names: ['TEST PLAYER', 'COMPAÑERO 1'],
                        team_b_names: ['RIVAL 1', 'RIVAL 2'],
                        collection: 'entrenos_matches'
                    },
                    {
                        id: 'm2',
                        court: 2,
                        round: 2,
                        score_a: 10,
                        score_b: 15,
                        status: 'finished',
                        team_a_ids: ['u_123', 'u_partner2'],
                        team_b_ids: ['u_rival3', 'u_rival4'],
                        team_a_names: ['TEST PLAYER', 'COMPAÑERO 2'],
                        team_b_names: ['RIVAL 3', 'RIVAL 4'],
                        collection: 'matches'
                    }
                ];
            }
        }
    }
};

// Cargar PlayerHistoryService
eval(fs.readFileSync('js/modules/players/PlayerHistoryService.js', 'utf8'));

async function test() {
    console.log("🧪 Iniciando test de PlayerHistoryService...");
    const result = await global.window.PlayerHistoryService.getPlayerRecentMatches('u_123');

    assert.strictEqual(result.matches.length, 2, "Debe tener 2 partidos");
    
    // Partido 1: Victoria 18 - 12
    const m1 = result.matches[0];
    assert.strictEqual(m1.isWin, true, "Partido 1 debe ser victoria");
    assert.strictEqual(m1.resultLabel, 'VICTORIA');
    assert.strictEqual(m1.scoreDisplay, '18 - 12');
    assert.strictEqual(m1.partnerName, 'COMPAÑERO 1');
    assert.strictEqual(m1.rivalNamesStr, 'RIVAL 1 / RIVAL 2');

    // Partido 2: Derrota 10 - 15
    const m2 = result.matches[1];
    assert.strictEqual(m2.isWin, false, "Partido 2 debe ser derrota");
    assert.strictEqual(m2.resultLabel, 'DERROTA');
    assert.strictEqual(m2.scoreDisplay, '10 - 15');

    // Estadísticas
    assert.strictEqual(result.stats.totalMatches, 2);
    assert.strictEqual(result.stats.wins, 1);
    assert.strictEqual(result.stats.losses, 1);
    assert.strictEqual(result.stats.winRate, 50);

    console.log("✅ TODOS LOS TESTS DE PLAYERHISTORYSERVICE PASARON SATISFACTORIAMENTE");
}

test().catch(err => {
    console.error("❌ Test falló:", err);
    process.exit(1);
});
