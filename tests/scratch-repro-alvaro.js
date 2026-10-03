// Reproducción exacta del caso reportado (R1 -> R2) por los DOS caminos de generación
const Engine = require('../js/tournament-engine/TournamentEngine');

const players = [
    { id: 'adrian', name: 'Adrian Muñoz', gender: 'chico', level: 3.5, current_court: 1 },
    { id: 'agata', name: 'Agata del Real', gender: 'chica', level: 3.5, current_court: 1 },
    { id: 'alvaro', name: 'Alvaro Fernandez', gender: 'chico', level: 3.5, current_court: 1 },
    { id: 'anais', name: 'Anaïs Grebot', gender: 'chica', level: 3.5, current_court: 1 },
    { id: 'adria', name: 'Adria Serrano', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'anas', name: 'Anas Jd', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'alex', name: 'Alex Martínez', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'arnau', name: 'Arnau Santamaria', gender: 'chico', level: 3.5, current_court: 2 }
];
const matches = [
    { round: 1, court: 1, team_a_ids: ['adrian', 'agata'], team_b_ids: ['alvaro', 'anais'], score_a: 2, score_b: 5, status: 'finished' },
    { round: 1, court: 2, team_a_ids: ['adria', 'anas'], team_b_ids: ['alex', 'arnau'], score_a: 4, score_b: 0, status: 'finished' }
];
const name = id => players.find(p => p.id === id).name;
const show = (label, ms) => {
    console.log(`\n=== ${label} ===`);
    ms.sort((a, b) => a.court - b.court).forEach(m =>
        console.log(`P${m.court}: ${m.team_a_ids.map(name).join(' / ')}  vs  ${m.team_b_ids.map(name).join(' / ')}`));
};

const res = Engine.generateRound({ players, courts: 2, roundNum: 2, mode: 'twister', matchesHistory: matches, options: { isMixed: true } });
show('MOTOR LOCAL (TournamentEngine twister)', res.matches);

// Cloud Function (copia literal de functions/index.js calculateRotatingPozoRound R2+)
const courtWinners = {}, courtLosers = {};
matches.forEach(m => {
    const c = parseInt(m.court), sA = parseInt(m.score_a || 0), sB = parseInt(m.score_b || 0);
    courtWinners[c] = sA >= sB ? m.team_a_ids : m.team_b_ids;
    courtLosers[c] = sA >= sB ? m.team_b_ids : m.team_a_ids;
});
const server = [];
for (let c = 1; c <= 2; c++) {
    const cp = c === 1 ? [...courtWinners[1], ...courtWinners[2]] : [...courtLosers[1], ...courtLosers[2]];
    server.push({ court: c, team_a_ids: [cp[0], cp[3]], team_b_ids: [cp[1], cp[2]] });
}
show('CLOUD FUNCTION (servidor)', server);
console.log('\nESPERADO P1: Alvaro, Anaïs, Adria, Anas  |  P2: Adrian, Agata, Alex, Arnau');
