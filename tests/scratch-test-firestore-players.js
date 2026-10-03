const { RotatingPozoLogic } = require('../js/rotating-pozo-logic');

// Datos exactos de Firestore del evento 'U16RGVsSrNMic49p6EUi'
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

console.log("--- TEST 1: updatePlayerCourts con open ---");
const movedOpen = RotatingPozoLogic.updatePlayerCourts(players, r1Matches, 2, 'open');
movedOpen.forEach(p => console.log(`${p.name}: Pista ${p.current_court}`));

console.log("\n--- TEST 2: updatePlayerCourts con mixed ---");
const movedMixed = RotatingPozoLogic.updatePlayerCourts(players, r1Matches, 2, 'mixed');
movedMixed.forEach(p => console.log(`${p.name}: Pista ${p.current_court}`));

console.log("\n--- TEST 3: generateRound con movedOpen ---");
const matchesOpen = RotatingPozoLogic.generateRound(movedOpen, 2, 2, 'open');
matchesOpen.forEach(m => console.log(`P${m.court}: ${m.team_a_names ? m.team_a_names.join('/') : (m.player_a1_name + '/' + m.player_a2_name)} vs ${m.team_b_names ? m.team_b_names.join('/') : (m.player_b1_name + '/' + m.player_b2_name)}`));

console.log("\n--- TEST 4: generateRound con movedMixed ---");
const matchesMixed = RotatingPozoLogic.generateRound(movedMixed, 2, 2, 'mixed');
matchesMixed.forEach(m => console.log(`P${m.court}: ${m.team_a_names ? m.team_a_names.join('/') : (m.player_a1_name + '/' + m.player_a2_name)} vs ${m.team_b_names ? m.team_b_names.join('/') : (m.player_b1_name + '/' + m.player_b2_name)}`));
