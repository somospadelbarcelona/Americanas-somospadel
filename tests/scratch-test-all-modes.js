const Engine = require('../js/tournament-engine/TournamentEngine');

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

const modes = ['clasica', 'mexicana', 'mixta', 'twister', 'pozo', 'rey_pista'];

for (const m of modes) {
    try {
        const res = Engine.generateRound({
            players,
            courts: 2,
            roundNum: 2,
            mode: m,
            matchesHistory,
            options: { isMixed: m === 'mixta' }
        });
        console.log(`\n=== MODALIDAD: ${m} ===`);
        res.matches.forEach(match => {
            console.log(`  P${match.court}: ${match.team_a_names ? match.team_a_names.join('/') : match.team_a_ids.join('/')} vs ${match.team_b_names ? match.team_b_names.join('/') : match.team_b_ids.join('/')}`);
        });
    } catch (e) {
        console.log(`\n=== MODALIDAD: ${m} (ERROR: ${e.message}) ===`);
    }
}
