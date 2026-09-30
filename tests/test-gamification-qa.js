/**
 * test-gamification-qa.js
 * Test Suite Oficial de Integración y Calidad (QA) para Sistema de Gamificación SomosPádel BCN
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const statsService = require(path.resolve(__dirname, '../js/modules/stats/AchievementsService.js'));
const proxyService = require(path.resolve(__dirname, '../js/modules/players/AchievementsService.js'));

(async function () {
    // 1. Módulos y Singleton
    assert(statsService, 'AchievementsService debe estar definido');
    assert(typeof statsService.evaluatePlayerAchievements === 'function', 'evaluatePlayerAchievements debe ser función');
    assert(proxyService, 'Proxy AchievementsService debe estar definido');
    assert.strictEqual(statsService, proxyService, 'El proxy debe resolver a la misma instancia');

    // 2. Catálogo oficial
    const catalog = statsService.getCatalog();
    assert(Array.isArray(catalog) && catalog.length >= 10, 'Catálogo debe tener >= 10 insignias');
    const validTiers = ['bronze', 'silver', 'gold', 'diamond'];
    const validCategories = ['match', 'streak', 'loyalty', 'level', 'special'];

    catalog.forEach(badge => {
        assert(badge.id && typeof badge.id === 'string', `Badge id inválido: ${badge.id}`);
        assert(badge.title && typeof badge.title === 'string', `Badge ${badge.id} sin título`);
        assert(badge.description && typeof badge.description === 'string', `Badge ${badge.id} sin descripción`);
        assert(badge.icon && typeof badge.icon === 'string', `Badge ${badge.id} sin icono`);
        assert(validTiers.includes(badge.tier), `Badge ${badge.id} tier inválido: ${badge.tier}`);
        assert(validCategories.includes(badge.category), `Badge ${badge.id} categoría inválida: ${badge.category}`);
        assert(typeof badge.xp === 'number' && badge.xp > 0, `Badge ${badge.id} XP inválido: ${badge.xp}`);
        assert(typeof badge.evaluate === 'function', `Badge ${badge.id} debe tener función evaluate`);

        const noArgsRes = badge.evaluate();
        assert(typeof noArgsRes.unlocked === 'boolean', `Badge ${badge.id} evaluate() sin args falló`);
    });

    // 3. Usuario Nuevo
    const newUser = { uid: 'user_novato_qa_001', name: 'Novato Test', level: 1.5 };
    const resNew = await statsService.evaluatePlayerAchievements(newUser, {}, []);
    assert.strictEqual(resNew.totalXp, 0, 'Total XP debe ser 0 para usuario nuevo');
    assert.strictEqual(resNew.level.level, 1, 'Nivel debe ser 1');
    assert.strictEqual(resNew.level.title, 'Iniciado del Club', 'Título de nivel debe ser Iniciado del Club');
    assert.strictEqual(resNew.unlockedBadges.length, 0, 'No debe tener insignias desbloqueadas');

    // 4. Usuario Activo
    const activeUser = { uid: 'user_crack_qa_002', name: 'Alex Pro', level: 3.8 };
    const now = new Date();
    const history = [];
    const partners = ['Carlos M.', 'Marc G.', 'Laura S.', 'David R.'];
    for (let i = 0; i < 12; i++) {
        history.push({
            id: `match_qa_${i}`,
            eventId: i < 4 ? 'torneo_final_1' : `event_${i}`,
            date: new Date(now.getTime() - i * 3600 * 1000 * 24).toISOString(),
            won: true,
            partner: partners[i % partners.length],
            court: i === 0 ? 'Pista 1' : 'Pista 2'
        });
    }
    const resActive = await statsService.evaluatePlayerAchievements(activeUser, { totalPlayed: 15, court1Wins: 1 }, history);
    const unlockedIds = resActive.unlockedBadges.map(b => b.id);
    assert(unlockedIds.includes('primera_victoria'));
    assert(unlockedIds.includes('maestro_red'));
    assert(unlockedIds.includes('racha_fuego'));
    assert(unlockedIds.includes('rey_del_pozo'));
    assert(unlockedIds.includes('fair_play'));
    assert(unlockedIds.includes('meteoro'));
    assert(unlockedIds.includes('guerrero_invicto'));
    assert(resActive.totalXp > 1000);
    assert(resActive.level.level >= 4);

    // 5. Misiones Semanales (Determinismo)
    const d1 = new Date('2026-09-21T10:00:00Z');
    const d2 = new Date('2026-09-24T18:00:00Z');
    const m1 = statsService.getActiveWeeklyMissions(d1);
    const m2 = statsService.getActiveWeeklyMissions(d2);
    assert.strictEqual(m1.length, 3);
    assert.strictEqual(m1[0].id, m2[0].id);
    assert(m1[0].remainingTimeText.includes('restantes'));

    // 6. Resiliencia & Fechas españolas
    const weirdHistory = [
        null,
        { id: 'm1', date: '26/09/2026', result: 'W', partner: 'Rafa N.' },
        { id: 'm2', dateRaw: '25-09-2026', res: 'V', partner: 'Carlos A.' },
        { id: 'm3', timestamp: Date.now() - 50000, isWon: true, partner: 'Ferrer' }
    ];
    const resWeird = await statsService.evaluatePlayerAchievements({ id: 'u_weird', level: 3.6 }, null, weirdHistory);
    assert.strictEqual(resWeird.normalizedStats.totalWon, 3);
    assert.strictEqual(resWeird.normalizedStats.currentStreak, 3);

    // 7. No-regresión en PlayerView
    const pvCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/players/PlayerView.js'), 'utf8');
    assert(pvCode.includes('data-tab="ai_performance"'));
    assert(pvCode.includes('data-tab="attributes"'));
    assert(pvCode.includes('data-tab="achievements"'));
    assert(pvCode.includes('renderAiHistoryHtml('));
    assert(pvCode.includes('renderAttributesTabHtml('));
    assert(pvCode.includes('renderAchievementsTab('));

    // 8. index.html
    const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    assert(indexHtml.includes('AchievementsService.js'));
    assert(indexHtml.indexOf('AchievementsService.js') < indexHtml.indexOf('PlayerView.js'));

    process.exit(0);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
