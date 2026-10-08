const assert = require('assert');
const Engine = require('../js/tournament-engine/TournamentEngine');
const TwisterGuard = require('../js/tournament-engine/TwisterInvariantGuard');

console.log("=================================================================");
console.log("🧪 VALIDACIÓN DE PARIDAD 100%: TWISTER EN AMERICANAS VS ENTRENOS");
console.log("=================================================================");

// Función de resolución de modo idéntica a MatchMakingService.js (R1 y R2+):
function resolveEngineMode(event, eventType, isSwiss, isTwister, isMixedCat) {
    let engineMode = 'clasica';
    const mode = event.pair_mode;

    // Prioridad 1: Modalidades universales de dinámica específica (Twister, Pozo, Rey, Suiza)
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

// 1. Probar que para Americana con pair_mode: 'twister', el engineMode resuelto es 'twister'
const americanaEvent = {
    id: 'americana_twister_123',
    name: 'AMERICANA TWISTER NOCHE',
    pair_mode: 'twister',
    category: 'mixed', // categoría mixed NO debe interferir en Twister
    max_courts: 2
};

const entrenoEvent = {
    id: 'entreno_twister_456',
    name: 'ENTRENO TWISTER MAÑANA',
    pair_mode: 'twister',
    category: 'mixed',
    max_courts: 2
};

const modeAmericana = resolveEngineMode(americanaEvent, 'americana', false, true, true);
const modeEntreno = resolveEngineMode(entrenoEvent, 'entreno', false, true, true);

console.log(`Modo resuelto para Americana Twister: ${modeAmericana}`);
console.log(`Modo resuelto para Entreno Twister:   ${modeEntreno}`);

assert.strictEqual(modeAmericana, 'twister', "Americana con pair_mode twister DEBE resolver a 'twister'");
assert.strictEqual(modeEntreno, 'twister', "Entreno con pair_mode twister DEBE resolver a 'twister'");
assert.strictEqual(modeAmericana, modeEntreno, "La resolución de modo debe ser 100% IDÉNTICA entre Americana y Entreno");

// 2. Ejecutar simulación con 8 jugadores en Americana y comparar con Entreno
const players = [
    { id: 'u1', name: 'Alvaro Fernandez', gender: 'chico', level: 3.5 },
    { id: 'u2', name: 'Anaïs Grebot', gender: 'chica', level: 3.5 },
    { id: 'u3', name: 'Adria Serrano', gender: 'chico', level: 3.5 },
    { id: 'u4', name: 'Anas Jd', gender: 'chico', level: 3.5 },
    { id: 'u5', name: 'Adrian Muñoz', gender: 'chico', level: 3.5 },
    { id: 'u6', name: 'Agata del Real', gender: 'chica', level: 3.5 },
    { id: 'u7', name: 'Alex Martínez', gender: 'chico', level: 3.5 },
    { id: 'u8', name: 'Arnau Santamaria', gender: 'chico', level: 3.5 }
];

const r1Matches = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['u1', 'u2'],
        team_b_ids: ['u5', 'u6'],
        team_a_names: ['Alvaro Fernandez', 'Anaïs Grebot'],
        team_b_names: ['Adrian Muñoz', 'Agata del Real'],
        score_a: 5,
        score_b: 2,
        status: 'finished'
    },
    {
        round: 1,
        court: 2,
        team_a_ids: ['u3', 'u4'],
        team_b_ids: ['u7', 'u8'],
        team_a_names: ['Adria Serrano', 'Anas Jd'],
        team_b_names: ['Alex Martínez', 'Arnau Santamaria'],
        score_a: 4,
        score_b: 0,
        status: 'finished'
    }
];

// Generar para AMERICANA:
const resAmericana = Engine.generateRound({
    players,
    courts: 2,
    roundNum: 2,
    mode: modeAmericana,
    matchesHistory: r1Matches,
    options: { rounds: 6, hardNoRepeatPartner: false, isMixed: false, category: 'open' }
});

// Generar para ENTRENO:
const resEntreno = Engine.generateRound({
    players,
    courts: 2,
    roundNum: 2,
    mode: modeEntreno,
    matchesHistory: r1Matches,
    options: { rounds: 6, hardNoRepeatPartner: false, isMixed: false, category: 'open' }
});

console.log("\nPartidos R2 generados para Americana:");
resAmericana.matches.forEach(m => console.log(`P${m.court}: ${m.team_a_names.join('/')} vs ${m.team_b_names.join('/')}`));

console.log("\nPartidos R2 generados para Entreno:");
resEntreno.matches.forEach(m => console.log(`P${m.court}: ${m.team_a_names.join('/')} vs ${m.team_b_names.join('/')}`));

// Validar TwisterInvariantGuard en Americana:
const guardAmericana = TwisterGuard.validate(r1Matches, resAmericana.matches, 2);
console.log("\nGuard Americana válido:", guardAmericana.valid, "errores:", guardAmericana.errors);
assert.strictEqual(guardAmericana.valid, true, "TwisterInvariantGuard debe ser 100% válido en Americanas");

// Validar TwisterInvariantGuard en Entreno:
const guardEntreno = TwisterGuard.validate(r1Matches, resEntreno.matches, 2);
console.log("Guard Entreno válido:  ", guardEntreno.valid, "errores:", guardEntreno.errors);
assert.strictEqual(guardEntreno.valid, true, "TwisterInvariantGuard debe ser 100% válido en Entrenos");

// Verificar reglas en Americana:
const p1Match = resAmericana.matches.find(m => parseInt(m.court) === 1);
const p2Match = resAmericana.matches.find(m => parseInt(m.court) === 2);

const p1Pids = [...p1Match.team_a_ids, ...p1Match.team_b_ids];
const p2Pids = [...p2Match.team_a_ids, ...p2Match.team_b_ids];

// Ganadores P1: u1 (Alvaro), u2 (Anaïs). Ganadores P2: u3 (Adria), u4 (Anas).
// Todos deben estar en Pista 1:
assert.ok(p1Pids.includes('u1'), "Alvaro debe estar en P1");
assert.ok(p1Pids.includes('u2'), "Anaïs debe estar en P1");
assert.ok(p1Pids.includes('u3'), "Adria debe subir a P1");
assert.ok(p1Pids.includes('u4'), "Anas debe subir a P1");

// Perdedores P1: u5 (Adrian), u6 (Agata). Perdedores P2: u7 (Alex), u8 (Arnau).
// Todos deben estar en Pista 2:
assert.ok(p2Pids.includes('u5'), "Adrian debe bajar a P2");
assert.ok(p2Pids.includes('u6'), "Agata debe bajar a P2");
assert.ok(p2Pids.includes('u7'), "Alex debe estar en P2");
assert.ok(p2Pids.includes('u8'), "Arnau debe estar en P2");

// Separación de compañeros:
assert.ok(
    !(p1Match.team_a_ids.includes('u1') && p1Match.team_a_ids.includes('u2')) &&
    !(p1Match.team_b_ids.includes('u1') && p1Match.team_b_ids.includes('u2')),
    "Alvaro y Anaïs no deben jugar juntos en R2"
);
assert.ok(
    !(p1Match.team_a_ids.includes('u3') && p1Match.team_a_ids.includes('u4')) &&
    !(p1Match.team_b_ids.includes('u3') && p1Match.team_b_ids.includes('u4')),
    "Adria y Anas no deben jugar juntos en R2"
);

console.log("\n🎉 PARIDAD CONFIRMADA AL 100%: MODO TWISTER ES EXACTAMENTE EL MISMO EN AMERICANAS Y ENTRENOS.");
