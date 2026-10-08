/**
 * tests/test-qa-exact-user-twister-round3.js
 * 
 * AUDITORÍA QA EXHAUSTIVA DEL CASO EXACTO REPORTADO POR EL USUARIO:
 * Evento: "PRUEBA MIXTO 03/10/2026", category="mixed", pair_mode="twister".
 * 8 jugadores:
 *   - Adria Serrano (M)
 *   - Ariadna Majua (F)
 *   - Adrian Boza (M)
 *   - Carlota Calabuig (F)
 *   - Alberto Javier (M)
 *   - Inma Terribas (F)
 *   - Albert Garcia (M)
 *   - Cristina Matamoros (F)
 * 
 * Historial Ronda 2:
 *   P1: Adria Serrano / Ariadna Majua vs Adrian Boza / Carlota Calabuig -> Ganan Adria y Ariadna
 *   P2: Alberto Javier / Inma Terribas vs Albert Garcia / Cristina Matamoros -> Ganan Alberto e Inma
 * 
 * Validación en Ronda 3:
 *   1. Pista 1 (la más alta): juegan Adria Serrano, Ariadna Majua, Alberto Javier, Inma Terribas.
 *      Adria NO juega con Ariadna. Alberto NO juega con Inma.
 *   2. Pista 2 (la más baja): juegan Adrian Boza, Carlota Calabuig, Albert Garcia, Cristina Matamoros.
 *      Adrian NO juega con Carlota. Albert NO juega con Cristina.
 *   3. En Twister no importa el género: no se segrega ni se fuerza mixto por llamarse 'PRUEBA MIXTO' o tener category='mixed'.
 */

const assert = require('assert');
const TournamentEngine = require('../js/tournament-engine/TournamentEngine');
const MatchMakingService = require('../js/MatchMakingService');
const { RotatingPozoLogic } = require('../js/rotating-pozo-logic');

console.log('================================================================================');
console.log('🧪 TEST QA EXACTO: CASO USUARIO "PRUEBA MIXTO 03/10/2026" - GENERACIÓN RONDA 3');
console.log('================================================================================\n');

// 1. Datos de jugadores
const players = [
    { id: 'usr_adria', name: 'Adria Serrano', gender: 'chico', level: 3.5, current_court: 1 },
    { id: 'usr_ariadna', name: 'Ariadna Majua', gender: 'chica', level: 3.5, current_court: 1 },
    { id: 'usr_adrian', name: 'Adrian Boza', gender: 'chico', level: 3.5, current_court: 1 },
    { id: 'usr_carlota', name: 'Carlota Calabuig', gender: 'chica', level: 3.5, current_court: 1 },
    { id: 'usr_alberto', name: 'Alberto Javier', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'usr_inma', name: 'Inma Terribas', gender: 'chica', level: 3.5, current_court: 2 },
    { id: 'usr_albert', name: 'Albert Garcia', gender: 'chico', level: 3.5, current_court: 2 },
    { id: 'usr_cristina', name: 'Cristina Matamoros', gender: 'chica', level: 3.5, current_court: 2 }
];

// 2. Historial de Ronda 2 exactamente según el pantallazo del usuario
const matchesHistory = [
    // Pista 1: Adria Serrano / Ariadna Majua vs Adrian Boza / Carlota Calabuig
    // Ganan Adria y Ariadna (ej. 6 - 2)
    {
        round: 2,
        court: 1,
        team_a_ids: ['usr_adria', 'usr_ariadna'],
        team_b_ids: ['usr_adrian', 'usr_carlota'],
        team_a_names: ['Adria Serrano', 'Ariadna Majua'],
        team_b_names: ['Adrian Boza', 'Carlota Calabuig'],
        score_a: 6,
        score_b: 2,
        winner: 'team_a',
        status: 'finished'
    },
    // Pista 2: Alberto Javier / Inma Terribas vs Albert Garcia / Cristina Matamoros
    // Ganan Alberto e Inma (ej. 6 - 3)
    {
        round: 2,
        court: 2,
        team_a_ids: ['usr_alberto', 'usr_inma'],
        team_b_ids: ['usr_albert', 'usr_cristina'],
        team_a_names: ['Alberto Javier', 'Inma Terribas'],
        team_b_names: ['Albert Garcia', 'Cristina Matamoros'],
        score_a: 6,
        score_b: 3,
        winner: 'team_a',
        status: 'finished'
    }
];

// --- PRUEBA 1: Generación directa con TournamentEngine ---
console.log('--- ETAPA 1: Generación de Ronda 3 con TournamentEngine ---');
const r3Engine = TournamentEngine.generateRound({
    players,
    courts: 2,
    roundNum: 3,
    mode: 'twister',
    matchesHistory,
    options: {
        rounds: 4,
        category: 'mixed',
        isMixed: false
    }
});

assert.strictEqual(r3Engine.matches.length, 2, 'Ronda 3 debe tener exactamente 2 partidos (2 pistas)');

const p1_r3 = r3Engine.matches.find(m => parseInt(m.court) === 1);
const p2_r3 = r3Engine.matches.find(m => parseInt(m.court) === 2);

assert.ok(p1_r3, 'Debe existir partido para Pista 1 en R3');
assert.ok(p2_r3, 'Debe existir partido para Pista 2 en R3');

const p1Players = [...p1_r3.team_a_ids, ...p1_r3.team_b_ids].sort();
const p2Players = [...p2_r3.team_a_ids, ...p2_r3.team_b_ids].sort();

console.log('Pista 1 Jugadores R3:', p1Players);
console.log('Pista 2 Jugadores R3:', p2Players);

// Validar que en Pista 1 juegan: Adria Serrano, Ariadna Majua, Alberto Javier, Inma Terribas
const expectedP1 = ['usr_adria', 'usr_alberto', 'usr_ariadna', 'usr_inma'].sort();
assert.deepStrictEqual(p1Players, expectedP1, 'Pista 1 debe contener a los 4 ganadores: Adria, Ariadna, Alberto, Inma');

// Validar que en Pista 2 juegan: Adrian Boza, Carlota Calabuig, Albert Garcia, Cristina Matamoros
const expectedP2 = ['usr_adrian', 'usr_albert', 'usr_carlota', 'usr_cristina'].sort();
assert.deepStrictEqual(p2Players, expectedP2, 'Pista 2 debe contener a los 4 perdedores: Adrian, Carlota, Albert, Cristina');

// Validar que en Pista 1: Adria NO juega con Ariadna, y Alberto NO juega con Inma
const adriaWithAriadna = (p1_r3.team_a_ids.includes('usr_adria') && p1_r3.team_a_ids.includes('usr_ariadna')) ||
                         (p1_r3.team_b_ids.includes('usr_adria') && p1_r3.team_b_ids.includes('usr_ariadna'));
assert.ok(!adriaWithAriadna, 'Adria Serrano NO debe jugar con Ariadna Majua en R3');

const albertoWithInma = (p1_r3.team_a_ids.includes('usr_alberto') && p1_r3.team_a_ids.includes('usr_inma')) ||
                        (p1_r3.team_b_ids.includes('usr_alberto') && p1_r3.team_b_ids.includes('usr_inma'));
assert.ok(!albertoWithInma, 'Alberto Javier NO debe jugar con Inma Terribas en R3');

// Validar que en Pista 2: Adrian NO juega con Carlota, y Albert NO juega con Cristina
const adrianWithCarlota = (p2_r3.team_a_ids.includes('usr_adrian') && p2_r3.team_a_ids.includes('usr_carlota')) ||
                          (p2_r3.team_b_ids.includes('usr_adrian') && p2_r3.team_b_ids.includes('usr_carlota'));
assert.ok(!adrianWithCarlota, 'Adrian Boza NO debe jugar con Carlota Calabuig en R3');

const albertWithCristina = (p2_r3.team_a_ids.includes('usr_albert') && p2_r3.team_a_ids.includes('usr_cristina')) ||
                           (p2_r3.team_b_ids.includes('usr_albert') && p2_r3.team_b_ids.includes('usr_cristina'));
assert.ok(!albertWithCristina, 'Albert Garcia NO debe jugar con Cristina Matamoros en R3');

console.log('   ✅ [TournamentEngine] Pista 1 y Pista 2 cumplen 100% las reglas sagradas de Twister.');
console.log(`      P1: [${p1_r3.team_a_names.join(' / ')}] vs [${p1_r3.team_b_names.join(' / ')}]`);
console.log(`      P2: [${p2_r3.team_a_names.join(' / ')}] vs [${p2_r3.team_b_names.join(' / ')}]`);

// --- PRUEBA 2: Validación a través del flujo completo de MatchMakingService ---
console.log('\n--- ETAPA 2: Simulación de Evento completo con MatchMakingService ---');
(async () => {
    // Mock event exactamente como en Firestore
    const mockEvent = {
        id: 'evt_prueba_mixto_03102026',
        name: 'PRUEBA MIXTO 03/10/2026',
        title: 'PRUEBA MIXTO 03/10/2026',
        category: 'mixed',
        pair_mode: 'twister',
        courts_count: 2,
        rounds_count: 4,
        players: players
    };

    let createdMatches = null;

    // Configurar entorno global simulado si no existe
    if (typeof global.window === 'undefined') {
        global.window = {};
    }
    global.window.TournamentEngine = TournamentEngine;

    global.window.FirebaseDB = {
        americanas: {
            getById: async (id) => mockEvent,
            update: async (id, data) => {}
        },
        matches: {
            getByAmericana: async (id) => matchesHistory
        }
    };

    global.window.db = {
        collection: (collName) => ({
            where: (field, op, val) => ({
                where: (field2, op2, val2) => ({
                    get: async () => ({ empty: true, docs: [] })
                })
            })
        })
    };

    const originalCreateMatches = MatchMakingService._createMatches;
    MatchMakingService._createMatches = async (eventId, matches, eventType) => {
        createdMatches = matches;
        return matches;
    };

    try {
        const genResult = await MatchMakingService.generateRound(
            mockEvent.id,
            'americana',
            3,
            true // force = true
        );

        assert.ok(createdMatches, 'MatchMakingService debe haber creado partidos');
        assert.strictEqual(createdMatches.length, 2, 'MatchMakingService debe generar 2 partidos');

        const m1 = createdMatches.find(m => parseInt(m.court) === 1);
        const m2 = createdMatches.find(m => parseInt(m.court) === 2);

        const m1Players = [...m1.team_a_ids, ...m1.team_b_ids].sort();
        const m2Players = [...m2.team_a_ids, ...m2.team_b_ids].sort();

        assert.deepStrictEqual(m1Players, expectedP1, 'MatchMakingService: Pista 1 debe tener los 4 ganadores');
        assert.deepStrictEqual(m2Players, expectedP2, 'MatchMakingService: Pista 2 debe tener los 4 perdedores');

        // Comprobar no repetición de pareja
        const m1AdriaWithAriadna = (m1.team_a_ids.includes('usr_adria') && m1.team_a_ids.includes('usr_ariadna')) ||
                                   (m1.team_b_ids.includes('usr_adria') && m1.team_b_ids.includes('usr_ariadna'));
        assert.ok(!m1AdriaWithAriadna, 'MatchMakingService: Adria NO juega con Ariadna');

        const m1AlbertoWithInma = (m1.team_a_ids.includes('usr_alberto') && m1.team_a_ids.includes('usr_inma')) ||
                                  (m1.team_b_ids.includes('usr_alberto') && m1.team_b_ids.includes('usr_inma'));
        assert.ok(!m1AlbertoWithInma, 'MatchMakingService: Alberto NO juega con Inma');

        const m2AdrianWithCarlota = (m2.team_a_ids.includes('usr_adrian') && m2.team_a_ids.includes('usr_carlota')) ||
                                    (m2.team_b_ids.includes('usr_adrian') && m2.team_b_ids.includes('usr_carlota'));
        assert.ok(!m2AdrianWithCarlota, 'MatchMakingService: Adrian NO juega con Carlota');

        const m2AlbertWithCristina = (m2.team_a_ids.includes('usr_albert') && m2.team_a_ids.includes('usr_cristina')) ||
                                     (m2.team_b_ids.includes('usr_albert') && m2.team_b_ids.includes('usr_cristina'));
        assert.ok(!m2AlbertWithCristina, 'MatchMakingService: Albert NO juega con Cristina');

        console.log('   ✅ [MatchMakingService] Generación R3 validada al 100% sin importar category="mixed".');
        console.log(`      P1: [${m1.team_a_names.join(' / ')}] vs [${m1.team_b_names.join(' / ')}]`);
        console.log(`      P2: [${m2.team_a_names.join(' / ')}] vs [${m2.team_b_names.join(' / ')}]`);
    } finally {
        MatchMakingService._createMatches = originalCreateMatches;
    }

    console.log('\n================================================================================');
    console.log('🎉 CERTIFICACIÓN QA DEL CASO DE USUARIO: 100% EXITOSA Y APROBADA');
    console.log('================================================================================');
})();
