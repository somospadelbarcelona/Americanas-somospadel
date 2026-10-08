const Engine = require('../js/tournament-engine/TournamentEngine');

const players = [
    { id: 'u_656989230', name: 'ABRAHAM ROSELL CLAVERAS', gender: 'chico', level: 3.5, current_court: 1 },
    { id: 'u_609405289', name: 'AGATA DEL REAL PEÑA', gender: 'chica', level: 3.5, current_court: 1 },
    { id: 'u_640677832', name: 'ALVARO FERNANDEZ SERRANO', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'u_660103947', name: 'CARLES GARCIA CASTELLANOS', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'u_699572103', name: 'ARNAU SANTAMARIA PIÑOL', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'u_699217479', name: 'YOLANDA SANZ GONZALEZ', gender: 'chica', level: 3.5, current_court: 2 },
    { id: 'u_664020122', name: 'LUIS PINO VAZQUEZ', gender: 'chico', level: 3.5, current_court: 1 },
    { id: 'u_608209007', name: 'JUAN JOSÉ JIMÉNEZ', gender: 'chico', level: 3.5, current_court: 1 }
];

const r1Matches = [
    {
        round: 1,
        court: 1,
        team_a_ids: ['u_656989230', 'u_609405289'],
        team_b_ids: ['u_664020122', 'u_608209007'],
        score_a: 3,
        score_b: 2,
        status: 'finished'
    },
    {
        round: 1,
        court: 2,
        team_a_ids: ['u_640677832', 'u_660103947'],
        team_b_ids: ['u_699572103', 'u_699217479'],
        score_a: 4,
        score_b: 0,
        status: 'finished'
    }
];

console.log("=== EJECUTANDO CON entreno_rotaciones ===");
const resRot = Engine.generateRound({
    players,
    courts: 2,
    roundNum: 2,
    mode: 'entreno_rotaciones',
    matchesHistory: r1Matches,
    options: {
        rounds: 6,
        isMixed: false
    }
});
resRot.matches.forEach(m => {
    console.log(`P${m.court}: ${m.team_a_names.join('/')} vs ${m.team_b_names.join('/')}`);
});
