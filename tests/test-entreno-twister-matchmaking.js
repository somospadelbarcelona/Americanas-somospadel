const assert = require('assert');
const Engine = require('../js/tournament-engine/TournamentEngine');
const TwisterGuard = require('../js/tournament-engine/TwisterInvariantGuard');

// Simulamos la resolución de engineMode idéntica a MatchMakingService.js:
function resolveEngineMode(event, eventType, mode, isSwiss, isTwister, isMixedCat) {
    let engineMode = 'clasica';
    if (isTwister || mode === 'twister' || mode === 'rotating') {
        engineMode = 'twister';
    } else if (mode === 'pozo') {
        engineMode = 'pozo';
    } else if (mode === 'rey_pista' || mode === 'rey_de_la_pista') {
        engineMode = 'rey_pista';
    } else if (isSwiss || mode === 'swiss') {
        engineMode = 'mexicana';
    } else if (eventType === 'entreno') {
        engineMode = 'entreno_rotaciones';
        if (event.format === 'niveles' || event.entreno_type === 'niveles') engineMode = 'entreno_niveles';
        if (event.format === 'libre' || event.entreno_type === 'libre') engineMode = 'entreno_libre';
    } else if (isMixedCat) {
        engineMode = 'mixta';
    }
    return engineMode;
}

console.log("=== VERIFICANDO RESOLUCIÓN DE MODO EN ENTRENO TWISTER ===");

const testEvent = {
    id: 'U16RGVsSrNMic49p6EUi',
    name: 'prueba MIXTO 03/10/2026',
    pair_mode: 'twister',
    category: 'mixed',
    max_courts: 2
};

const mode = 'twister';
const isTwister = true;
const isSwiss = false;
const isMixedCat = true;

const resolvedMode = resolveEngineMode(testEvent, 'entreno', mode, isSwiss, isTwister, isMixedCat);
console.log(`Modo resuelto para entreno con pair_mode=twister: ${resolvedMode}`);
assert.strictEqual(resolvedMode, 'twister', "El modo para entreno con pair_mode twister DEBE ser 'twister' y NO 'entreno_rotaciones'");

// Datos del caso real del usuario
const players = [
    { id: 'u_656989230', name: 'ABRAHAM ROSELL CLAVERAS', gender: 'chico', level: 3.5 },
    { id: 'u_609405289', name: 'AGATA DEL REAL PEÑA', gender: 'chica', level: 3.5 },
    { id: 'u_640677832', name: 'ALVARO FERNANDEZ SERRANO', gender: 'chico', level: 3.5 },
    { id: 'u_660103947', name: 'CARLES GARCIA CASTELLANOS', gender: 'chico', level: 3.5 },
    { id: 'u_699572103', name: 'ARNAU SANTAMARIA PIÑOL', gender: 'chico', level: 3.5 },
    { id: 'u_699217479', name: 'YOLANDA SANZ GONZALEZ', gender: 'chica', level: 3.5 },
    { id: 'u_664020122', name: 'LUIS PINO VAZQUEZ', gender: 'chico', level: 3.5 },
    { id: 'u_608209007', name: 'JUAN JOSÉ JIMÉNEZ', gender: 'chico', level: 3.5 }
];

const r1Matches = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['u_656989230', 'u_609405289'],
        team_b_ids: ['u_664020122', 'u_608209007'],
        team_a_names: ['ABRAHAM ROSELL CLAVERAS', 'AGATA DEL REAL PEÑA'],
        team_b_names: ['LUIS PINO VAZQUEZ', 'JUAN JOSÉ JIMÉNEZ'],
        score_a: 3,
        score_b: 2,
        status: 'finished'
    },
    {
        round: 1,
        court: 2,
        team_a_ids: ['u_640677832', 'u_660103947'],
        team_b_ids: ['u_699572103', 'u_699217479'],
        team_a_names: ['ALVARO FERNANDEZ SERRANO', 'CARLES GARCIA CASTELLANOS'],
        team_b_names: ['ARNAU SANTAMARIA PIÑOL', 'YOLANDA SANZ GONZALEZ'],
        score_a: 4,
        score_b: 0,
        status: 'finished'
    }
];

const engineRes = Engine.generateRound({
    players,
    courts: 2,
    roundNum: 2,
    mode: resolvedMode,
    matchesHistory: r1Matches,
    options: {
        rounds: 6,
        hardNoRepeatPartner: false,
        isMixed: false,
        category: 'open'
    }
});

console.log("\nPartidos R2 generados:");
engineRes.matches.forEach(m => {
    console.log(`P${m.court}: ${m.team_a_names.join('/')} vs ${m.team_b_names.join('/')}`);
});

const guardRes = TwisterGuard.validate(r1Matches, engineRes.matches, 2);
console.log("\nTwisterInvariantGuard valid:", guardRes.valid, "errors:", guardRes.errors);
assert.strictEqual(guardRes.valid, true, "TwisterInvariantGuard debe ser 100% válido");

// Verificaciones sagradas:
const p1Match = engineRes.matches.find(m => parseInt(m.court) === 1);
const p2Match = engineRes.matches.find(m => parseInt(m.court) === 2);

const p1Players = [...p1Match.team_a_ids, ...p1Match.team_b_ids];
const p2Players = [...p2Match.team_a_ids, ...p2Match.team_b_ids];

// Ganadores P1: Abraham, Agata. Ganadores P2: Alvaro, Carles.
// Todos deben estar en Pista 1:
assert.ok(p1Players.includes('u_656989230'), "Abraham debe estar en Pista 1");
assert.ok(p1Players.includes('u_609405289'), "Agata debe estar en Pista 1");
assert.ok(p1Players.includes('u_640677832'), "Alvaro debe subir a Pista 1");
assert.ok(p1Players.includes('u_660103947'), "Carles debe subir a Pista 1");

// Perdedores P1: Luis, Juan José. Perdedores P2: Arnau, Yolanda.
// Todos deben estar en Pista 2:
assert.ok(p2Players.includes('u_664020122'), "Luis Pino debe bajar a Pista 2");
assert.ok(p2Players.includes('u_608209007'), "Juan José debe bajar a Pista 2");
assert.ok(p2Players.includes('u_699572103'), "Arnau debe quedarse en Pista 2 (NO SUBIR)");
assert.ok(p2Players.includes('u_699217479'), "Yolanda debe quedarse en Pista 2");

// Separación de parejas: Abraham y Agata NO juntos; Alvaro y Carles NO juntos:
assert.ok(
    !(p1Match.team_a_ids.includes('u_656989230') && p1Match.team_a_ids.includes('u_609405289')) &&
    !(p1Match.team_b_ids.includes('u_656989230') && p1Match.team_b_ids.includes('u_609405289')),
    "Abraham y Agata no deben jugar juntos en R2"
);
assert.ok(
    !(p1Match.team_a_ids.includes('u_640677832') && p1Match.team_a_ids.includes('u_660103947')) &&
    !(p1Match.team_b_ids.includes('u_640677832') && p1Match.team_b_ids.includes('u_660103947')),
    "Alvaro y Carles no deben jugar juntos en R2"
);

console.log("\n🎉 ¡TODAS LAS ASERCIONES CUMPLIDAS AL 100%! ARNAU NO SUBE, ABRAHAM NO BAJA, PAREJAS SEPARADAS.");
