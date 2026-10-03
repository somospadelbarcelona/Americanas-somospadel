const Engine = require('../js/tournament-engine/TournamentEngine');
const { RotatingPozoLogic } = require('../js/rotating-pozo-logic');

const players = [
    { id: 'abraham', name: 'Abraham Rosell', gender: 'chico' },
    { id: 'agata', name: 'Agata del Real', gender: 'chica' },
    { id: 'juan_jose', name: 'Juan José', gender: 'chico' },
    { id: 'luis_pino', name: 'Luis Pino', gender: 'chico' },
    { id: 'alvaro', name: 'Alvaro Fernandez', gender: 'chico' },
    { id: 'carles', name: 'Carles Garcia', gender: 'chico' },
    { id: 'arnau', name: 'Arnau Santamaria', gender: 'chico' },
    { id: 'yolanda', name: 'Yolanda Sanz', gender: 'chica' }
];

const matchesHistory = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['abraham', 'agata'],
        team_b_ids: ['juan_jose', 'luis_pino'],
        team_a_names: ['Abraham Rosell', 'Agata del Real'],
        team_b_names: ['Juan José', 'Luis Pino'],
        score_a: 3,
        score_b: 2,
        winner: 'team_a',
        status: 'finished'
    },
    {
        round: 1,
        court: 2,
        team_a_ids: ['alvaro', 'carles'],
        team_b_ids: ['arnau', 'yolanda'],
        team_a_names: ['Alvaro Fernandez', 'Carles Garcia'],
        team_b_names: ['Arnau Santamaria', 'Yolanda Sanz'],
        score_a: 4,
        score_b: 0,
        winner: 'team_a',
        status: 'finished'
    }
];

console.log("=== PROBANDO TOURNAMENT ENGINE TWISTER ===");
try {
    const resEngine = Engine.generateRound({
        players,
        courts: 2,
        roundNum: 2,
        mode: 'twister',
        matchesHistory,
        options: { isMixed: false }
    });
    console.log("Engine Matches:");
    resEngine.matches.forEach(m => console.log(`P${m.court}: ${m.team_a_names.join('/')} vs ${m.team_b_names.join('/')}`));
} catch (e) {
    console.error("Engine Error:", e.message);
}

console.log("\n=== PROBANDO ROTATING POZO LOGIC ===");
try {
    const moved = RotatingPozoLogic.updatePlayerCourts(players, matchesHistory, 2, 'mixed');
    console.log("Moved players (mixed):", moved.map(p => `${p.name}: P${p.current_court}`));
    const r2Matches = RotatingPozoLogic.generateRound(moved, 2, 2, 'mixed');
    r2Matches.forEach(m => console.log(`P${m.court}: ${m.team_a_names?.join('/') || m.player_a1_name} vs ${m.team_b_names?.join('/') || m.player_b1_name}`));
} catch (e) {
    console.error("RotatingPozo Error:", e.message);
}
