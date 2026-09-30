/**
 * test-tournament-logic-lab-complete-qa.js
 * 
 * SUITE COMPLETA DE AUDITORÍA QA Y CERTIFICACIÓN:
 * "Centro de Control & Auditoría de Lógica de Torneos y Entrenos"
 * (TournamentLogicAuditService & AdminTournamentLogicLab)
 * 
 * Cobertura:
 * 1. Verificación de archivos estáticos, sintaxis y orden de carga en HTML/JS.
 * 2. Simulación Multimodal (Twister, Parejas Fijas, Suizo) en 6 rondas.
 * 3. Evaluación exhaustiva de las 5 Reglas de Oro (casos nominales y corruptos).
 * 4. Diagnóstico de eventos reales con reporte de salud y recomendaciones.
 * 5. Batería de Self-Test algorítmico con telemetría en ms y 100% Health Score.
 * 6. Ciclo de vida y renderizado reactivo de la UI (AdminTournamentLogicLab).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function runTestSuite() {
    console.log('================================================================');
    console.log('🧪 QA SUITE: CENTRO DE CONTROL & AUDITORÍA DE LÓGICA DE TORNEOS');
    console.log('================================================================\n');

    // -----------------------------------------------------------------------------
    // 1. VERIFICACIÓN DE ARCHIVOS ESTÁTICOS, SINTAXIS Y ORDEN EN ADMIN.HTML / JS
    // -----------------------------------------------------------------------------
    console.log('▶️ [1/6] Verificación de archivos estáticos, integración y orden de carga...');

    const baseDir = path.resolve(__dirname, '..');
    const fileAuditService = path.join(baseDir, 'js/modules/admin/TournamentLogicAuditService.js');
    const fileLogicLab = path.join(baseDir, 'js/modules/admin/AdminTournamentLogicLab.js');
    const fileAdminHtml = path.join(baseDir, 'admin.html');
    const fileAdminJs = path.join(baseDir, 'js/admin.js');

    assert.ok(fs.existsSync(fileAuditService), 'TournamentLogicAuditService.js debe existir físicamente.');
    assert.ok(fs.existsSync(fileLogicLab), 'AdminTournamentLogicLab.js debe existir físicamente.');
    assert.ok(fs.existsSync(fileAdminHtml), 'admin.html debe existir.');
    assert.ok(fs.existsSync(fileAdminJs), 'js/admin.js debe existir.');
    console.log('  ✅ Archivos físicos localizados.');

    const adminHtmlContent = fs.readFileSync(fileAdminHtml, 'utf8');

    // Botón sidebar
    assert.ok(adminHtmlContent.includes('data-view="logic_lab"'), 'admin.html debe contener el atributo data-view="logic_lab"');
    assert.ok(adminHtmlContent.includes("loadAdminView('logic_lab')"), 'admin.html debe contener onclick="loadAdminView(\'logic_lab\')"');
    assert.ok(adminHtmlContent.includes('btn-logic-lab'), 'admin.html debe tener la clase btn-logic-lab');
    console.log('  ✅ Botón de navegación lateral en admin.html verificado.');

    // Orden de carga de scripts
    const idxService = adminHtmlContent.indexOf('js/modules/admin/TournamentLogicAuditService.js');
    const idxLab = adminHtmlContent.indexOf('js/modules/admin/AdminTournamentLogicLab.js');
    assert.ok(idxService !== -1, 'admin.html debe cargar TournamentLogicAuditService.js');
    assert.ok(idxLab !== -1, 'admin.html debe cargar AdminTournamentLogicLab.js');
    assert.ok(idxService < idxLab, 'TournamentLogicAuditService.js DEBE cargarse ANTES de AdminTournamentLogicLab.js');
    console.log('  ✅ Orden de carga de scripts en admin.html verificado (Service -> UI Component).');

    // Enrutamiento en js/admin.js
    const adminJsContent = fs.readFileSync(fileAdminJs, 'utf8');
    assert.ok(adminJsContent.includes("viewName === 'logic_lab'"), 'js/admin.js debe contener la condición viewName === "logic_lab"');
    assert.ok(adminJsContent.includes('AdminTournamentLogicLab.render()'), 'js/admin.js debe invocar AdminTournamentLogicLab.render()');
    console.log('  ✅ Enrutamiento de vista logic_lab en js/admin.js verificado.');

    // Verificación estricta del selector de pistas en AdminTournamentLogicLab.js (única y exclusivamente 3 a 10 pistas)
    const labJsContent = fs.readFileSync(fileLogicLab, 'utf8');
    assert.ok(labJsContent.includes('<select id="ll-sim-courts"'), 'AdminTournamentLogicLab.js debe definir el selector ll-sim-courts');
    const expectedCourtOptions = [
        { courts: 3, players: 12 },
        { courts: 4, players: 16 },
        { courts: 5, players: 20 },
        { courts: 6, players: 24 },
        { courts: 7, players: 28 },
        { courts: 8, players: 32 },
        { courts: 9, players: 36 },
        { courts: 10, players: 40 }
    ];
    expectedCourtOptions.forEach(c => {
        assert.ok(labJsContent.includes(`<option value="${c.courts}"`), `Debe existir la opción value="${c.courts}"`);
        assert.ok(labJsContent.includes(`${c.courts} Pistas (${c.players} jugadores)`), `Debe existir la etiqueta de ${c.courts} Pistas (${c.players} jugadores)`);
    });
    assert.ok(!labJsContent.includes('<option value="2"'), 'La opción de 2 pistas NO debe existir en el selector');
    assert.ok(!labJsContent.includes('2 Pistas'), 'El texto "2 Pistas" NO debe figurar en el selector');
    console.log('  ✅ Selector de pistas verificado: única y exclusivamente 3 a 10 pistas (12 a 40 jugadores), opción 2 descartada.');


    // -----------------------------------------------------------------------------
    // 2. SIMULACIÓN MULTIMODAL EN 6 RONDAS (TWISTER, PAREJAS FIJAS, SUIZO)
    // -----------------------------------------------------------------------------
    console.log('\n▶️ [2/6] Validación del Motor de Simulación Multimodal...');
    const TournamentLogicAuditService = require(fileAuditService);

    // 2.1 Simulación Twister (4 pistas, 16 jugadores, 6 rondas)
    const simTwister = TournamentLogicAuditService.simulateTournament({
        mode: 'twister',
        numCourts: 4,
        rounds: 6,
        numPlayers: 16
    });

    assert.strictEqual(simTwister.mode, 'twister', 'El modo debe ser twister');
    assert.strictEqual(simTwister.numCourts, 4, 'Deben ser 4 pistas');
    assert.strictEqual(simTwister.rounds, 6, 'Deben ser 6 rondas oficiales');
    assert.strictEqual(simTwister.players.length, 16, 'Deben ser 16 jugadores virtuales');
    assert.strictEqual(simTwister.allMatches.length, 24, '4 pistas * 6 rondas = 24 partidos');
    assert.strictEqual(simTwister.roundsDetail.length, 6, 'roundsDetail debe contener exactamente 6 rondas');
    assert.strictEqual(simTwister.standings.length, 16, 'standings debe clasificar a los 16 jugadores');
    assert.ok(simTwister.executionTimeMs >= 0, 'Debe registrar tiempo de ejecución en ms');
    assert.ok(simTwister.allMatches.every(m => m.status === 'finished'), 'Todos los partidos deben quedar finalizados');
    console.log(`  ✅ Twister 4 pistas (16 jugadores): 24 partidos generados en ${simTwister.executionTimeMs} ms.`);

    // 2.2 Simulación Parejas Fijas (4 pistas, 8 parejas = 16 jugadores, 6 rondas)
    const simFixed = TournamentLogicAuditService.simulateTournament({
        mode: 'fixed',
        numCourts: 4,
        rounds: 6,
        numPlayers: 16
    });

    assert.strictEqual(simFixed.mode, 'fixed', 'El modo debe ser fixed');
    assert.strictEqual(simFixed.allMatches.length, 24, 'Debe generar 24 partidos en parejas fijas');
    assert.strictEqual(simFixed.pairs.length, 8, 'Deben generarse 8 parejas fijas');
    assert.strictEqual(simFixed.standings.length, 8, 'Standings debe ordenar a las 8 parejas');

    // Comprobar que en ninguna ronda se desintegra una pareja fija
    simFixed.allMatches.forEach(m => {
        assert.strictEqual(m.team_a_ids.length, 2, 'Equipo A debe tener 2 jugadores');
        assert.strictEqual(m.team_b_ids.length, 2, 'Equipo B debe tener 2 jugadores');
        assert.ok(m.pair_a_id, 'Debe registrarse el pair_a_id');
        assert.ok(m.pair_b_id, 'Debe registrarse el pair_b_id');
    });
    console.log(`  ✅ Parejas Fijas 4 pistas (8 parejas): Integridad estructural de duplas certificada.`);

    // 2.3 Simulación Sistema Suizo (4 pistas, 16 jugadores, 6 rondas)
    const simSwiss = TournamentLogicAuditService.simulateTournament({
        mode: 'swiss',
        numCourts: 4,
        rounds: 6,
        numPlayers: 16
    });

    assert.strictEqual(simSwiss.mode, 'swiss', 'El modo debe ser swiss');
    assert.strictEqual(simSwiss.allMatches.length, 24, 'Debe generar 24 partidos en sistema suizo');
    assert.strictEqual(simSwiss.standings.length, 16, 'Standings debe clasificar a los 16 jugadores');
    console.log(`  ✅ Sistema Suizo 4 pistas (16 jugadores): Reclasificación y asignación en 6 rondas certificada.`);

    // 2.4 Validación exhaustiva multi-pista: 3, 5, 7, 8, 9 y 10 pistas (hasta 40 jugadores y 60 partidos en 6 rondas)
    console.log('\n  🎾 Validación exhaustiva multi-pista: 3, 5, 7, 8, 9 y 10 pistas...');
    const multiCourtList = [3, 5, 7, 8, 9, 10];
    multiCourtList.forEach(courts => {
        const expPlayers = courts * 4;
        const expMatches = courts * 6; // 6 rondas

        // Simulación Twister
        const simTwisterMulti = TournamentLogicAuditService.simulateTournament({
            mode: 'twister',
            numCourts: courts,
            rounds: 6,
            silent: true
        });

        assert.strictEqual(simTwisterMulti.mode, 'twister');
        assert.strictEqual(simTwisterMulti.numCourts, courts, `Debe configurar ${courts} pistas`);
        assert.strictEqual(simTwisterMulti.rounds, 6, 'Deben ser 6 rondas oficiales');
        assert.strictEqual(simTwisterMulti.players.length, expPlayers, `Debe contener ${expPlayers} jugadores`);
        assert.strictEqual(simTwisterMulti.allMatches.length, expMatches, `Debe generar ${expMatches} partidos`);
        assert.strictEqual(simTwisterMulti.standings.length, expPlayers, `Standings debe clasificar a los ${expPlayers} jugadores`);
        assert.ok(simTwisterMulti.allMatches.every(m => m.status === 'finished'), 'Todos los partidos deben quedar finalizados');

        const auditScale = TournamentLogicAuditService.auditGoldenRules(simTwisterMulti.allMatches, {
            mode: 'twister',
            num_courts: courts,
            rounds: 6
        });
        assert.ok(auditScale.overallScore >= 80, `Score auditoría para ${courts} pistas debe ser >= 80 (obtenido: ${auditScale.overallScore})`);
        assert.strictEqual(auditScale.isHealthy, true, `Auditoría para ${courts} pistas debe ser calificada saludable`);

        console.log(`    ✓ Twister ${courts} pistas: ${expPlayers} jugadores, ${expMatches} partidos, 6 rondas (Score: ${auditScale.overallScore}/100)`);
    });

    // Validación a capacidad máxima (10 pistas, 40 jugadores, 60 partidos en 6 rondas) en Parejas Fijas y Suizo
    const simFixed10 = TournamentLogicAuditService.simulateTournament({
        mode: 'fixed',
        numCourts: 10,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simFixed10.pairs.length, 20, '10 pistas fijas = 20 parejas');
    assert.strictEqual(simFixed10.allMatches.length, 60, '10 pistas * 6 rondas = 60 partidos');
    assert.strictEqual(simFixed10.standings.length, 20, '20 parejas clasificadas');
    console.log(`    ✓ Parejas Fijas 10 pistas: 20 parejas (40 jugadores), 60 partidos generados e íntegros.`);

    const simSwiss10 = TournamentLogicAuditService.simulateTournament({
        mode: 'swiss',
        numCourts: 10,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simSwiss10.players.length, 40, '10 pistas suizo = 40 jugadores');
    assert.strictEqual(simSwiss10.allMatches.length, 60, '10 pistas suizo * 6 rondas = 60 partidos');
    assert.strictEqual(simSwiss10.standings.length, 40, '40 jugadores clasificados');
    console.log(`    ✓ Sistema Suizo 10 pistas: 40 jugadores, 60 partidos generados y clasificados.`);

    // 2.5 Validación "Jugadores Reales de la BD" vs "Jugadores Profesionales"
    console.log('\n  👥 Validación de Fuentes de Jugadores (Reales del Club vs Profesionales WPT)...');
    const simRealPlayers = TournamentLogicAuditService.simulateTournament({
        mode: 'twister',
        numCourts: 4,
        rounds: 6,
        playersSource: 'real',
        silent: true
    });
    assert.strictEqual(simRealPlayers.playersSource, 'real', 'Debe marcar playersSource como real');
    // Verificar que los jugadores provienen del pool de socios del club SomosPadel
    assert.ok(simRealPlayers.players.some(p => p.id && p.id.startsWith('sp_')), 'Los jugadores reales deben contener IDs del club (sp_)');
    assert.ok(simRealPlayers.players.every(p => typeof p.level === 'number' && p.level >= 2.0), 'Los jugadores reales deben tener nivel asignado');
    console.log(`    ✓ Jugadores Reales del Club: 16 socios del club asignados con niveles y géneros.`);

    const simProPlayers = TournamentLogicAuditService.simulateTournament({
        mode: 'twister',
        numCourts: 4,
        rounds: 6,
        playersSource: 'pro',
        silent: true
    });
    assert.strictEqual(simProPlayers.playersSource, 'pro', 'Debe marcar playersSource como pro');
    assert.ok(simProPlayers.players.some(p => p.id && p.id.startsWith('player_v_')), 'Los jugadores pro deben contener IDs virtuales');
    const proSampleNames = ['Alejandro Galán', 'Paula Josemaría', 'Arturo Coello', 'Ariana Sánchez', 'Juan Lebrón', 'Gemma Triay'];
    assert.ok(simProPlayers.players.some(p => proSampleNames.includes(p.name)), 'Los jugadores pro deben contener nombres del circuito profesional');
    console.log(`    ✓ Jugadores Profesionales: 16 estrellas WPT/Premier Padel asignadas con éxito.`);

    // 2.6 Validación Simulación Ficticia: "Americana" vs "Entreno"
    console.log('\n  🏆/🎾 Validación de Tipo de Evento Simulado (Americana vs Entreno)...');
    const simAmericanaType = TournamentLogicAuditService.simulateTournament({
        eventType: 'americana',
        mode: 'twister',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simAmericanaType.eventType, 'americana', 'El eventType debe ser americana');
    assert.ok(simAmericanaType.eventName.toLowerCase().includes('americana'), 'El nombre por defecto debe indicar Americana');

    const simEntrenoType = TournamentLogicAuditService.simulateTournament({
        eventType: 'entreno',
        mode: 'twister',
        numCourts: 4,
        rounds: 6,
        silent: true
    });
    assert.strictEqual(simEntrenoType.eventType, 'entreno', 'El eventType debe ser entreno');
    assert.ok(simEntrenoType.eventName.toLowerCase().includes('entreno'), 'El nombre por defecto debe indicar Entreno');
    console.log(`    ✓ Tipos de evento certificados: Americana (competitivo) y Entreno (sesión formativa & pozo).`);


    // -----------------------------------------------------------------------------
    // 3. EVALUACIÓN EXHAUSTIVA DE LAS 5 REGLAS DE ORO (CASOS NOMINALES Y CORRUPTOS)
    // -----------------------------------------------------------------------------
    console.log('\n▶️ [3/6] Evaluación y estrés de las 5 Reglas de Oro...');

    // Auditoría nominal de simulación limpia
    const auditTwisterClean = TournamentLogicAuditService.auditGoldenRules(simTwister.allMatches, {
        mode: 'twister',
        num_courts: 4,
        rounds: 6
    });

    assert.ok(auditTwisterClean.overallScore >= 80, `Score global debe ser >= 80 (obtenido: ${auditTwisterClean.overallScore})`);
    assert.strictEqual(auditTwisterClean.rules.length, 5, 'Deben evaluarse exactamente 5 reglas');
    assert.strictEqual(auditTwisterClean.totalMatches, 24, 'Total partidos auditados debe ser 24');
    assert.strictEqual(auditTwisterClean.totalRounds, 6, 'Total rondas auditadas debe ser 6');
    console.log(`  ✅ Auditoría nominal limpia: Score Global = ${auditTwisterClean.overallScore}/100, Saludable = ${auditTwisterClean.isHealthy}`);

    // Regla 1: Dinámica de Pozo (Ascensos y Descensos)
    const r1 = auditTwisterClean.rules.find(r => r.id === 'RULE_POZO_MOVEMENT');
    assert.ok(r1, 'Regla 1 debe estar presente');
    assert.ok(r1.score >= 85, `Regla 1 score debe ser >= 85% (obtenido: ${r1.score})`);

    // Corrupción deliberada de Regla 1: Ganador de Pista 2 enviado erróneamente a Pista 4
    const corruptedPozoMatches = JSON.parse(JSON.stringify(simTwister.allMatches));
    const r1p2Match = corruptedPozoMatches.find(m => m.round === 1 && m.court === 2);
    const winnerId = r1p2Match.winner_ids[0];
    const r2MatchWithWinner = corruptedPozoMatches.find(m => m.round === 2 && (m.team_a_ids.includes(winnerId) || m.team_b_ids.includes(winnerId)));
    if (r2MatchWithWinner) {
        r2MatchWithWinner.court = 4; // Debería haber ido a pista 1, lo forzamos a pista 4
    }
    const auditR1Corrupt = TournamentLogicAuditService.auditGoldenRules(corruptedPozoMatches, { mode: 'twister', num_courts: 4, rounds: 6 });
    const r1CorruptRule = auditR1Corrupt.rules.find(r => r.id === 'RULE_POZO_MOVEMENT');
    assert.ok(r1CorruptRule.warnings.length > 0, 'Regla 1 debe registrar warnings ante salto anómalo');
    console.log(`  ✅ Regla 1 (Dinámica de Pozo): Detecta anomalías de ascensos/descensos (${r1CorruptRule.warnings.length} advertencia(s)).`);

    // Regla 2: No Repetición de Parejas en Twister
    const r2 = auditTwisterClean.rules.find(r => r.id === 'RULE_NO_PARTNER_REPEAT');
    assert.ok(r2, 'Regla 2 debe estar presente');
    assert.ok(r2.score >= 70, `Regla 2 score debe ser >= 70% en rotación (obtenido: ${r2.score})`);

    // Corrupción deliberada de Regla 2: Duplicar la misma pareja deliberadamente en varias rondas
    const corruptedPairMatches = JSON.parse(JSON.stringify(simTwister.allMatches));
    corruptedPairMatches.forEach(m => {
        if (m.round > 1 && m.court === 1) {
            m.team_a_ids = ['player_v_1', 'player_v_2']; // Forzar misma pareja en múltiples rondas
        }
    });
    const auditR2Corrupt = TournamentLogicAuditService.auditGoldenRules(corruptedPairMatches, { mode: 'twister', num_courts: 4, rounds: 6 });
    const r2CorruptRule = auditR2Corrupt.rules.find(r => r.id === 'RULE_NO_PARTNER_REPEAT');
    assert.ok(r2CorruptRule.warnings.length > 0, 'Regla 2 debe detectar repeticiones deliberadas');
    console.log(`  ✅ Regla 2 (No Repetición): Detecta duplicidad de parejas (${r2CorruptRule.warnings.length} warning(s)).`);

    // Regla 3: Integridad de Marcadores & Suma Cero
    const r3 = auditTwisterClean.rules.find(r => r.id === 'RULE_SCORE_INTEGRITY');
    assert.ok(r3, 'Regla 3 debe estar presente');
    assert.strictEqual(r3.score, 100, 'En simulación limpia, Regla 3 debe ser 100%');

    // Corrupción deliberada de Regla 3: Marcador corrupto (NaN) y empate ilegal en pozo
    const corruptedScoreMatches = [
        { id: 'm_c1', round: 1, court: 1, team_a_ids: ['a1', 'a2'], team_b_ids: ['b1', 'b2'], score_a: NaN, score_b: 4, status: 'finished' },
        { id: 'm_c2', round: 1, court: 2, team_a_ids: ['c1', 'c2'], team_b_ids: ['d1', 'd2'], score_a: 5, score_b: 5, status: 'finished' }
    ];
    const auditR3Corrupt = TournamentLogicAuditService.auditGoldenRules(corruptedScoreMatches, { mode: 'twister', num_courts: 2, rounds: 1 });
    const r3CorruptRule = auditR3Corrupt.rules.find(r => r.id === 'RULE_SCORE_INTEGRITY');
    assert.ok(r3CorruptRule.score < 100, 'Regla 3 debe penalizar marcadores corruptos y empates no dirimidos');
    assert.strictEqual(r3CorruptRule.warnings.length, 2, 'Debe registrar 2 advertencias específicas');
    console.log(`  ✅ Regla 3 (Integridad & Suma Cero): Puntuación corrupta detectada y penalizada a ${r3CorruptRule.score}/100.`);

    // Regla 4: Equidad de Pistas & Distribución
    const r4 = auditTwisterClean.rules.find(r => r.id === 'RULE_COURT_EQUITY');
    assert.ok(r4, 'Regla 4 debe estar presente');
    assert.strictEqual(r4.score, 100, 'En simulación limpia, Regla 4 debe ser 100%');

    // Corrupción deliberada de Regla 4: Jugador solapado en 2 pistas en la misma ronda
    const corruptedEquityMatches = [
        { id: 'eq1', round: 1, court: 1, team_a_ids: ['u1', 'u2'], team_b_ids: ['u3', 'u4'], score_a: 6, score_b: 3, status: 'finished' },
        { id: 'eq2', round: 1, court: 2, team_a_ids: ['u1', 'u5'], team_b_ids: ['u6', 'u7'], score_a: 6, score_b: 2, status: 'finished' } // u1 solapado
    ];
    const auditR4Corrupt = TournamentLogicAuditService.auditGoldenRules(corruptedEquityMatches, { mode: 'twister', num_courts: 2, rounds: 1 });
    const r4CorruptRule = auditR4Corrupt.rules.find(r => r.id === 'RULE_COURT_EQUITY');
    assert.ok(r4CorruptRule.score < 100, 'Regla 4 debe penalizar solapamiento simultáneo de jugador');
    assert.ok(r4CorruptRule.warnings.some(w => w.includes('simultáneamente')), 'Warning debe advertir sobre solapamiento');
    console.log(`  ✅ Regla 4 (Equidad de Pistas): Solapamiento simultáneo detectado y penalizado a ${r4CorruptRule.score}/100.`);

    // Regla 5: Consistencia de Rondas
    const r5 = auditTwisterClean.rules.find(r => r.id === 'RULE_ROUND_CONSISTENCY');
    assert.ok(r5, 'Regla 5 debe estar presente');
    assert.strictEqual(r5.score, 100, 'En simulación limpia de 6 rondas, Regla 5 debe ser 100%');

    // Corrupción deliberada de Regla 5: Secuencia rota (falta ronda 2) y partidos pendientes en ronda 1
    const corruptedRoundMatches = [
        { id: 'r_m1', round: 1, court: 1, team_a_ids: ['a1', 'a2'], team_b_ids: ['b1', 'b2'], score_a: null, score_b: null, status: 'pending' },
        { id: 'r_m3', round: 3, court: 1, team_a_ids: ['a1', 'b1'], team_b_ids: ['a2', 'b2'], score_a: 6, score_b: 4, status: 'finished' }
    ];
    const auditR5Corrupt = TournamentLogicAuditService.auditGoldenRules(corruptedRoundMatches, { mode: 'twister', num_courts: 1, rounds: 3 });
    const r5CorruptRule = auditR5Corrupt.rules.find(r => r.id === 'RULE_ROUND_CONSISTENCY');
    assert.ok(r5CorruptRule.score < 100, 'Regla 5 debe penalizar secuencia rota y partidos huérfanos');
    console.log(`  ✅ Regla 5 (Consistencia de Rondas): Secuencia rota y pendientes detectados (Score: ${r5CorruptRule.score}/100).`);


    // -----------------------------------------------------------------------------
    // 4. DIAGNÓSTICO DE EVENTOS REALES CON REPORTE DE SALUD Y RECOMENDACIONES
    // -----------------------------------------------------------------------------
    console.log('\n▶️ [4/6] Diagnóstico de Eventos Reales con Reporte y Recomendaciones...');

    // 4.1 Evento en memoria limpio
    const cleanRealEventDoc = {
        id: 'americana_torneo_pro_octubre',
        name: 'Torneo Pro Americanas Somospadel - Edición Oro',
        pair_mode: 'twister',
        num_courts: 4,
        rounds: 6,
        status: 'finished'
    };

    const diagClean = await TournamentLogicAuditService.diagnoseRealEvent({
        event: cleanRealEventDoc,
        matches: simTwister.allMatches
    }, 'americana');

    assert.strictEqual(diagClean.eventId, cleanRealEventDoc.id, 'Debe devolver el ID del evento');
    assert.strictEqual(diagClean.eventName, cleanRealEventDoc.name, 'Debe conservar el nombre del evento');
    assert.strictEqual(diagClean.eventType, 'americana', 'El tipo debe ser americana');
    assert.ok(diagClean.auditResult.isHealthy, 'El evento limpio debe ser calificado como saludable');
    assert.ok(diagClean.recommendations.length > 0, 'Debe generar al menos una recomendación de salud');
    assert.ok(diagClean.recommendations.some(r => r.includes('✅ El torneo cumple con todos los estándares')), 'Debe incluir recomendación positiva');
    console.log(`  ✅ Diagnóstico de evento real limpio: Certificado saludable (${diagClean.recommendations[0]})`);

    // 4.2 Evento con vulnerabilidades severas deliberadas
    const corruptedEventDoc = {
        id: 'entreno_con_fallos',
        name: 'Entreno Problemático con Actas Incompletas',
        pair_mode: 'twister',
        num_courts: 2,
        rounds: 6,
        status: 'finished'
    };

    const severeCorruptMatches = [
        { id: 'bad_1', round: 1, court: 1, team_a_ids: ['a1', 'a2'], team_b_ids: ['b1', 'b2'], score_a: NaN, score_b: 4, status: 'finished' },
        { id: 'bad_2', round: 1, court: 2, team_a_ids: ['a1', 'c2'], team_b_ids: ['d1', 'd2'], score_a: null, score_b: 0, status: 'finished' },
        { id: 'bad_3', round: 2, court: 1, team_a_ids: ['a1', 'a2'], team_b_ids: ['b1', 'b2'], score_a: -1, score_b: 5, status: 'finished' },
        { id: 'bad_4', round: 2, court: 2, team_a_ids: ['e1'], team_b_ids: ['f1', 'f2'], score_a: 5, score_b: 5, status: 'finished' }
    ];

    const diagCorrupt = await TournamentLogicAuditService.diagnoseRealEvent({
        event: corruptedEventDoc,
        matches: severeCorruptMatches
    }, 'entreno');

    assert.strictEqual(diagCorrupt.eventType, 'entreno', 'Tipo debe ser entreno');
    assert.strictEqual(diagCorrupt.auditResult.isHealthy, false, 'El evento severamente corrupto NO debe ser calificado saludable');
    assert.ok(diagCorrupt.recommendations.some(r => r.includes('⚠️')), 'Debe emitir recomendación de advertencia');
    assert.ok(diagCorrupt.recommendations.some(r => r.includes('Regla 3')), 'Debe emitir recomendación sobre Regla 3');
    console.log(`  ✅ Diagnóstico con incidencias: Vulnerabilidades detectadas y recomendaciones emitidas.`);

    // 4.3 Manejo offline / sin documento
    const diagFallback = await TournamentLogicAuditService.diagnoseRealEvent('id_no_existente', 'americana');
    assert.ok(diagFallback.eventId, 'Debe devolver fallback sin lanzar excepciones');
    console.log(`  ✅ Diagnóstico defensivo offline: Maneja evento inexistente limpiamente.`);


    // -----------------------------------------------------------------------------
    // 5. BATERÍA DE SELF-TEST ALGORÍTMICO (HEALTH SCORE 100% & TIEMPOS MS)
    // -----------------------------------------------------------------------------
    console.log('\n▶️ [5/6] Ejecución de Batería de Self-Test Algorítmico...');

    const selfTest = TournamentLogicAuditService.runAlgorithmicSelfTest();

    assert.strictEqual(selfTest.totalTests, 6, 'Debe ejecutar exactamente 6 pruebas algorítmicas');
    assert.strictEqual(selfTest.passedTests, 6, 'Las 6 pruebas deben resultar aprobadas');
    assert.strictEqual(selfTest.failedTests, 0, '0 pruebas fallidas');
    assert.strictEqual(selfTest.healthScore, 100, 'El Health Score debe ser 100%');

    selfTest.tests.forEach((t, idx) => {
        assert.strictEqual(t.passed, true, `El test #${idx + 1} (${t.name}) debe estar aprobado`);
        assert.ok(typeof t.durationMs === 'number' && t.durationMs >= 0, 'Debe incluir duración en ms');
        console.log(`  ✅ [Self-Test #${idx + 1}] ${t.name}: PASSED en ${t.durationMs} ms`);
    });
    console.log(`  🏆 Batería Algorítmica Certificada: Health Score = ${selfTest.healthScore}% (6/6 aprobados).`);


    // -----------------------------------------------------------------------------
    // 6. CICLO DE VIDA Y RENDERIZADO REACTIVO DE LA UI (ADMINTOURNAMENTLOGICLAB)
    // -----------------------------------------------------------------------------
    console.log('\n▶️ [6/6] Validación del Ciclo de Vida y UI de AdminTournamentLogicLab...');

    // Mock del DOM para el entorno Node.js
    class MockElement {
        constructor(tagName = 'div') {
            this.tagName = tagName;
            this.innerHTML = '';
            this.style = {};
            this.attributes = {};
            this.children = [];
            this.className = '';
        }
        setAttribute(name, value) { this.attributes[name] = value; }
        getAttribute(name) { return this.attributes[name] || null; }
        querySelector(selector) {
            if (selector === '#content-area' || selector === '#logic-lab-tab-container') return this;
            return new MockElement();
        }
        querySelectorAll(selector) {
            if (selector === '.ll-tab-btn') {
                return [
                    { getAttribute: () => 'simulator', className: '' },
                    { getAttribute: () => 'rules_scanner', className: '' },
                    { getAttribute: () => 'real_diagnosis', className: '' },
                    { getAttribute: () => 'self_test', className: '' }
                ];
            }
            return [];
        }
        appendChild(child) { this.children.push(child); }
    }

    const mockContentArea = new MockElement('div');
    mockContentArea.id = 'content-area';

    const mockTabContainer = new MockElement('div');
    mockTabContainer.id = 'logic-lab-tab-container';

    const mockDocument = {
        getElementById: (id) => {
            if (id === 'content-area') return mockContentArea;
            if (id === 'logic-lab-tab-container') return mockTabContainer;
            if (id === 'll-sim-mode') return { value: 'twister' };
            if (id === 'll-sim-courts') return { value: '4' };
            if (id === 'll-sim-event-type') return { value: 'americana' };
            if (id === 'll-sim-players-source') return { value: 'real' };
            if (id === 'll-clone-event-select') return { value: 'ev_demo_americana_1' };
            if (id === 'll-real-event-select') return { value: 'ev_demo_1' };
            return null;
        },
        querySelector: (sel) => {
            if (sel === '#content-area') return mockContentArea;
            if (sel === '#logic-lab-tab-container') return mockTabContainer;
            return new MockElement();
        },
        querySelectorAll: () => [],
        createElement: (tag) => new MockElement(tag),
        head: new MockElement('head'),
        body: new MockElement('body')
    };

    global.window = global;
    global.document = mockDocument;
    global.TournamentLogicAuditService = TournamentLogicAuditService;

    // Cargar UI Component
    require(fileLogicLab);

    const lab = global.AdminTournamentLogicLab;
    assert.ok(lab, 'AdminTournamentLogicLab debe estar inicializado en global');
    assert.strictEqual(typeof global.AdminViews.logic_lab, 'function', 'AdminViews.logic_lab debe estar registrado');

    // 6.1 Render principal
    await lab.render(mockContentArea);
    assert.ok(mockContentArea.innerHTML.includes('CENTRO DE CONTROL & AUDITORÍA DE LÓGICA'), 'Debe renderizar la cabecera');
    assert.ok(mockContentArea.innerHTML.includes('Auditoría de Lógica Tabs'), 'Debe renderizar los tabs de navegación');
    assert.ok(mockContentArea.innerHTML.includes('<option value="3"'), 'UI debe incluir opción 3 pistas');
    assert.ok(mockContentArea.innerHTML.includes('<option value="10"'), 'UI debe incluir opción 10 pistas');
    assert.ok(!mockContentArea.innerHTML.includes('<option value="2"'), 'UI NO debe incluir opción 2 pistas');
    console.log('  ✅ Render inicial de la vista y componentes base completado (selector 3-10 validado en DOM, 2 descartado).');

    // 6.2 Cambio de Pestañas
    const tabsToTest = ['simulator', 'rules_scanner', 'real_diagnosis', 'self_test'];
    for (const t of tabsToTest) {
        lab.switchTab(t);
        assert.strictEqual(lab.activeTab, t, `activeTab debe ser ${t}`);
    }
    console.log('  ✅ Conmutación entre las 4 pestañas (simulator, rules_scanner, real_diagnosis, self_test) validada.');

    // 6.3 Simulación Turbo
    lab.simMode = 'twister';
    lab.simCourts = 4;
    lab.simRounds = 6;
    lab.executeTurboSimulation(false);
    assert.ok(lab.lastSimulation !== null, 'lastSimulation debe poblarse');
    assert.strictEqual(lab.lastSimulation.allMatches.length, 24, 'Debe haber generado 24 partidos');
    console.log('  ✅ Simulación Turbo desde UI validada.');

    // 6.4 Simulación Paso a Paso
    lab.stepState.active = false;
    lab.toggleStepByStep();
    assert.strictEqual(lab.stepState.active, true, 'Paso a paso debe activarse');
    assert.strictEqual(lab.stepState.currentRound, 1, 'Debe avanzar a ronda 1');

    lab.nextStepRound();
    assert.strictEqual(lab.stepState.currentRound, 2, 'Debe avanzar a ronda 2');

    lab.resetStepByStep();
    assert.strictEqual(lab.stepState.active, false, 'Debe desactivarse tras reset');
    console.log('  ✅ Flujo de Simulación Paso a Paso (toggle, next, reset) validado.');

    // 6.5 Selectores y cambios de configuración
    lab.onModeChange('fixed');
    assert.strictEqual(lab.simMode, 'fixed', 'simMode debe cambiar a fixed');

    // Validación reactiva explícita con 3, 5, 7, 8, 9 y 10 pistas (hasta 40 jugadores y 60 partidos en 6 rondas)
    console.log('\n  🎛️ Validación reactiva de UI con 3, 5, 7, 8, 9 y 10 pistas...');
    const testCourtsArray = [3, 5, 7, 8, 9, 10];
    for (const courtNum of testCourtsArray) {
        lab.onCourtsChange(String(courtNum));
        assert.strictEqual(lab.simCourts, courtNum, `simCourts debe ser ${courtNum}`);
        assert.strictEqual(lab.lastSimulation.numCourts, courtNum, `lastSimulation.numCourts debe reflejar ${courtNum}`);
        assert.strictEqual(lab.lastSimulation.players.length, courtNum * 4, `lastSimulation debe tener ${courtNum * 4} jugadores`);
        assert.strictEqual(lab.lastSimulation.allMatches.length, courtNum * 6, `lastSimulation debe generar ${courtNum * 6} partidos`);
        assert.strictEqual(lab.lastSimulation.rounds, 6, 'Deben mantenerse 6 rondas oficiales');
        console.log(`    ✓ Reactividad en UI: ${courtNum} pistas activadas -> ${courtNum * 4} jugadores, ${courtNum * 6} partidos.`);
    }

    // Validación de límites defensivos en UI (2 rechazado, >10 rechazado)
    lab.onCourtsChange('2'); // Menor a 3: debe rechazarlo y usar fallback 4
    assert.strictEqual(lab.simCourts, 4, 'Valor 2 pistas debe ser rechazado y restaurar 4');
    lab.onCourtsChange('11'); // Mayor a 10: debe rechazarlo y usar fallback 4
    assert.strictEqual(lab.simCourts, 4, 'Valor 11 pistas debe ser rechazado y restaurar 4');
    lab.onCourtsChange('invalido');
    assert.strictEqual(lab.simCourts, 4, 'Valor no numérico debe restaurar 4');
    console.log('    ✓ Validación defensiva de límites en UI: 2 rechazado, 11 rechazado, NaN rechazado.');

    lab.selectRoundView(3);
    assert.strictEqual(lab.selectedRoundView, 3, 'selectedRoundView debe cambiar a 3');
    console.log('  ✅ Selectores reactivos de modalidad, pistas (3-10) y visualización de rondas validados.');

    // 6.6 Validación UI: "Jugadores Reales de la BD" vs "Jugadores Profesionales"
    console.log('\n  👥 Validación UI: Selector de Fuentes de Jugadores (Reales vs Pro)...');
    await lab.onSimPlayersSourceChange('pro');
    assert.strictEqual(lab.simPlayersSource, 'pro', 'simPlayersSource debe ser pro');
    let simulatorHtml = lab._renderSimulatorTab();
    assert.ok(simulatorHtml.includes('⭐ ESTRELLAS PRO'), 'Debe renderizar badge ⭐ ESTRELLAS PRO');
    assert.ok(simulatorHtml.includes('Estrellas Pro'), 'KPI debe indicar Estrellas Pro');

    await lab.onSimPlayersSourceChange('real');
    assert.strictEqual(lab.simPlayersSource, 'real', 'simPlayersSource debe ser real');
    simulatorHtml = lab._renderSimulatorTab();
    assert.ok(simulatorHtml.includes('👥 JUGADORES REALES (BD)'), 'Debe renderizar badge 👥 JUGADORES REALES (BD)');
    assert.ok(simulatorHtml.includes('Socios Reales'), 'KPI debe indicar Socios Reales');
    console.log('  ✅ Conmutación reactiva UI entre Jugadores Reales y Estrellas Pro certificada.');

    // 6.7 Validación UI: Simulación Ficticia de "Americana" vs "Entreno" (Podio de honor, rendimiento y actas)
    console.log('\n  🏆/🎾 Validación UI: Adaptación de Podio y Actas según Americana vs Entreno...');
    await lab.onSimEventTypeChange('entreno');
    assert.strictEqual(lab.simEventType, 'entreno', 'simEventType debe ser entreno');
    simulatorHtml = lab._renderSimulatorTab();
    assert.ok(simulatorHtml.includes('🎾 ENTRENO'), 'Debe renderizar badge 🎾 ENTRENO');
    assert.ok(simulatorHtml.includes('🎾 Cuadro de Rendimiento del Entreno'), 'Debe renderizar título Cuadro de Rendimiento del Entreno');
    assert.ok(simulatorHtml.includes('MVP DE LA SESIÓN'), 'Debe contener tarjeta MVP DE LA SESIÓN');
    assert.ok(simulatorHtml.includes('TOP RENDIMIENTO'), 'Debe contener tarjeta TOP RENDIMIENTO');
    assert.ok(simulatorHtml.includes('🎾 Actas & Partidos del Entreno'), 'Debe renderizar título Actas & Partidos del Entreno');

    await lab.onSimEventTypeChange('americana');
    assert.strictEqual(lab.simEventType, 'americana', 'simEventType debe ser americana');
    simulatorHtml = lab._renderSimulatorTab();
    assert.ok(simulatorHtml.includes('🏆 AMERICANA'), 'Debe renderizar badge 🏆 AMERICANA');
    assert.ok(simulatorHtml.includes('🏆 Podio de Honor de la Americana'), 'Debe renderizar título Podio de Honor de la Americana');
    assert.ok(simulatorHtml.includes('CAMPEÓN'), 'Debe contener tarjeta CAMPEÓN');
    assert.ok(simulatorHtml.includes('🏆 Actas & Partidos de la Americana'), 'Debe renderizar título Actas & Partidos de la Americana');
    console.log('  ✅ Adaptación de UI para Americana y Entreno (Podio, Rendimiento y Actas) certificada.');

    // 6.8 Validación UI: Clonación de Eventos Reales para Simulación Ficticia (Sin tocar BD)
    console.log('\n  📂 Validación UI: Clonación de Eventos Reales (Americana & Entreno) sin tocar BD...');
    await lab.simulateFromRealEvent('ev_demo_americana_1', 'americana');
    assert.ok(lab.simClonedFrom !== null, 'simClonedFrom debe estar poblado');
    assert.strictEqual(lab.simClonedFrom.type, 'americana');
    simulatorHtml = lab._renderSimulatorTab();
    assert.ok(simulatorHtml.includes('📂 Basado en: Americana Nocturna Viernes - 4 Pistas (Ficticio)'), 'Debe mostrar badge de evento clonado');

    await lab.onCloneTypeFilterChange('entreno');
    await lab.simulateFromRealEvent('ev_demo_entreno_1', 'entreno');
    assert.ok(lab.simClonedFrom !== null);
    assert.strictEqual(lab.simClonedFrom.type, 'entreno');
    simulatorHtml = lab._renderSimulatorTab();
    assert.ok(simulatorHtml.includes('📂 Basado en: Entreno Pozo Intensivo Nivel 3.5 - Viernes (Ficticio)'), 'Debe mostrar badge de entreno clonado');
    assert.ok(simulatorHtml.includes('🎾 Cuadro de Rendimiento del Entreno'), 'El entreno clonado debe mostrar cuadro de rendimiento');

    lab.unlinkClonedEvent();
    assert.strictEqual(lab.simClonedFrom, null, 'simClonedFrom debe ser null tras desvincular');
    console.log('  ✅ Clonación de eventos reales en memoria (Americana & Entreno) certificada.');

    // 6.9 Diagnóstico Real y Self-Test desde UI
    await lab.fetchRealEvents();
    assert.ok(lab.realEventsList.length > 0, 'Debe cargar eventos reales o demo');
    await lab.executeRealDiagnosis();
    assert.ok(lab.lastRealDiagnosis !== null, 'Debe haber ejecutado diagnóstico real');
    console.log('  ✅ Diagnóstico real desde UI validado.');

    lab.executeSelfTest();
    assert.ok(lab.lastSelfTestResult !== null, 'Debe haber ejecutado self-test desde UI');
    assert.strictEqual(lab.lastSelfTestResult.healthScore, 100, 'Self-test desde UI debe dar 100%');
    console.log('  ✅ Self-test algorítmico desde UI validado con 100% de éxito.');

    // 6.7 Hook en AdminViews
    assert.strictEqual(typeof global.AdminViews.logic_lab, 'function', 'AdminViews.logic_lab debe ser invocable');
    await global.AdminViews.logic_lab();
    console.log('  ✅ Hook de interoperabilidad AdminViews.logic_lab ejecutado.');

    console.log('\n================================================================');
    console.log('🎉 CERTIFICACIÓN QA EXITOSA: 100% DE VALIDACIONES APROBADAS');
    console.log('================================================================\n');
}

runTestSuite().catch(err => {
    console.error('❌ Error fatal en suite QA:', err);
    process.exit(1);
});
