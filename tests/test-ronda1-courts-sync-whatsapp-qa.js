/**
 * Test QA: Sincronización de Cruces de Ronda 1 y Compartir por WhatsApp (Texto e Imagen)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n=======================================================');
console.log('🎾 QA TEST: RONDA 1 COURTS SYNC & WHATSAPP SHARING (TEXTO/IMAGEN)');
console.log('=======================================================\n');

const controllerPath = path.join(__dirname, '..', 'js', 'modules', 'americanas', 'EventsController_V6.js');
const code = fs.readFileSync(controllerPath, 'utf8');

// 1. Sintaxis
assert.doesNotThrow(() => {
    new Function(code);
}, 'EventsController_V6.js debe ser sintácticamente válido');
console.log('✅ 1. Sintaxis JS 100% válida');

// 2. Verificación estática de los nuevos métodos y selectores
assert.ok(code.includes('window.shareCourtsWhatsAppText'), 'Debe existir window.shareCourtsWhatsAppText');
assert.ok(code.includes('window.shareCourtsWhatsAppImage'), 'Debe existir window.shareCourtsWhatsAppImage');
assert.ok(code.includes('battle-courts-capture-area'), 'Debe existir contenedor #battle-courts-capture-area');
assert.ok(code.includes('CRUCES OFICIALES • RONDA 1'), 'Debe existir el badge de Cruces Oficiales Ronda 1');
assert.ok(code.includes('PREVIA PROVISIONAL • PENDIENTE DE SORTEO R1'), 'Debe existir el badge de Previa Provisional');
assert.ok(code.includes('CRUCES TEXTO'), 'Debe existir botón CRUCES TEXTO');
assert.ok(code.includes('PISTAS IMAGEN HD'), 'Debe existir botón PISTAS IMAGEN HD');
console.log('✅ 2. Verificaciones estáticas completadas con éxito');

// 3. Test de ejecución en VM simulando evento con partidos oficiales de Ronda 1
const mockDOM = {
    elements: {},
    getElementById(id) {
        return this.elements[id] || null;
    },
    createElement(tag) {
        const el = {
            tagName: tag,
            style: {},
            innerHTML: '',
            classList: { add: () => {}, remove: () => {} },
            appendChild: (child) => { if (child && child.id) mockDOM.elements[child.id] = child; },
            removeChild: () => {},
            setAttribute: () => {},
            getAttribute: () => null
        };
        return el;
    },
    body: {
        appendChild: (child) => {
            if (child && child.id) mockDOM.elements[child.id] = child;
        },
        removeChild: () => {}
    }
};

const mockMatchesR1 = [
    {
        id: 'match_r1_c1',
        americana_id: 'evt_sync_1',
        round: 1,
        court: 1,
        team_a_ids: ['p1', 'p2'],
        team_a_names: ['Ale Galán', 'Fede Chingotto'],
        team_b_ids: ['p3', 'p4'],
        team_b_names: ['Juan Lebrón', 'Paquito Navarro']
    },
    {
        id: 'match_r1_c2',
        americana_id: 'evt_sync_1',
        round: 1,
        court: 2,
        team_a_ids: ['p5', 'p6'],
        team_a_names: ['Arturo Coello', 'Agustín Tapia'],
        team_b_ids: ['p7', 'p8'],
        team_b_names: ['Franco Stupaczuk', 'Martin Di Nenno']
    }
];

const mockPlayersDb = [
    { id: 'p1', name: 'Ale Galán', level: '5.8', position: 'Revés' },
    { id: 'p2', name: 'Fede Chingotto', level: '5.6', position: 'Drive' },
    { id: 'p3', name: 'Juan Lebrón', level: '5.7', position: 'Drive' },
    { id: 'p4', name: 'Paquito Navarro', level: '5.6', position: 'Revés' },
    { id: 'p5', name: 'Arturo Coello', level: '6.0', position: 'Drive' },
    { id: 'p6', name: 'Agustín Tapia', level: '6.0', position: 'Revés' },
    { id: 'p7', name: 'Franco Stupaczuk', level: '5.5', position: 'Revés' },
    { id: 'p8', name: 'Martin Di Nenno', level: '5.5', position: 'Drive' }
];

const windowMock = {
    document: mockDOM,
    navigator: {
        clipboard: {
            writeText: async (t) => { windowMock._copiedText = t; }
        }
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    location: { href: 'https://somospadel.com' },
    open: () => {},
    alert: () => {},
    addEventListener: () => {},
    playBattleAudio: () => {},
    db: {
        collection: (col) => {
            return {
                onSnapshot: () => () => {},
                doc: (id) => ({
                    get: async () => {
                        if (col === 'players') {
                            const pFound = mockPlayersDb.find(p => p.id === id) || { id, name: 'Jugador', level: '3.5' };
                            return { exists: true, id, data: () => pFound };
                        }
                        return {
                            exists: true,
                            id,
                            data: () => ({
                                id,
                                name: 'Torneo Premier SomosPadel BCN',
                                date: '2026-10-15',
                                time: '19:00',
                                sede: 'Barcelona Pádel el Prat',
                                max_courts: 2,
                                players: mockPlayersDb.map(p => ({ uid: p.id, name: p.name, level: p.level }))
                            })
                        };
                    }
                }),
                where: (field, op, val) => {
                    return {
                        where: (field2, op2, val2) => ({
                            get: async () => {
                                if (windowMock._hasRound1Matches !== false && field === 'americana_id' && field2 === 'round' && (val2 === 1 || val2 === '1')) {
                                    return {
                                        empty: false,
                                        docs: mockMatchesR1.map(m => ({ id: m.id, data: () => m }))
                                    };
                                }
                                return { empty: true, docs: [] };
                            }
                        }),
                        get: async () => {
                            if (col === 'players' && op === 'in') {
                                return {
                                    forEach: (cb) => {
                                        val.forEach(uid => {
                                            const found = mockPlayersDb.find(p => p.id === uid);
                                            if (found) cb({ id: uid, data: () => found });
                                        });
                                    }
                                };
                            }
                            return { empty: true, docs: [], forEach: () => {} };
                        }
                    };
                }
            };
        }
    }
};

const context = vm.createContext({
    window: windowMock,
    document: mockDOM,
    navigator: windowMock.navigator,
    console,
    setTimeout: (cb) => { cb(); },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: (cb) => cb(),
    Array, Object, String, Number, Boolean, Math, Date, RegExp, Set, Map, Promise
});

vm.runInContext(code, context);

(async () => {
    try {
        console.log('\n--- 3. Verificando renderizado con partidos oficiales de Ronda 1 ---');
        windowMock.EventsController.state.americanas = [{
            id: 'evt_sync_1',
            name: 'Torneo Premier SomosPadel BCN',
            date: '2026-10-15',
            time: '19:00',
            sede: 'Barcelona Pádel el Prat',
            max_courts: 2,
            players: mockPlayersDb.map(p => ({ uid: p.id, name: p.name, level: p.level }))
        }];
        await windowMock.EventsController.showInscritosModal('evt_sync_1', 'americana', false);

        const modalHtml = mockDOM.elements['inscritos-modal'].innerHTML;
        assert.ok(modalHtml.includes('CRUCES OFICIALES • RONDA 1'), 'El modal debe contener el indicador CRUCES OFICIALES • RONDA 1');
        assert.ok(modalHtml.includes('PISTA 1'), 'Debe renderizar la Pista 1');
        assert.ok(modalHtml.includes('PISTA 2'), 'Debe renderizar la Pista 2');
        assert.ok(modalHtml.includes('ALE GALÁN') || modalHtml.includes('Ale Galán'), 'Pista 1 debe contener a Ale Galán');
        assert.ok(modalHtml.includes('FEDE CHINGOTTO') || modalHtml.includes('Fede Chingotto'), 'Pista 1 debe contener a Fede Chingotto');
        assert.ok(modalHtml.includes('ARTURO COELLO') || modalHtml.includes('Arturo Coello'), 'Pista 2 debe contener a Arturo Coello');
        assert.ok(modalHtml.includes('AGUSTÍN TAPIA') || modalHtml.includes('Agustín Tapia'), 'Pista 2 debe contener a Agustín Tapia');
        console.log('✅ Partidos oficiales de R1 sincronizados exactamente en cada pista');

        console.log('\n--- 4. Verificando formato de WhatsApp en Texto ---');
        assert.ok(typeof windowMock.shareCourtsWhatsAppText === 'function', 'shareCourtsWhatsAppText debe ser función');
        windowMock.shareCourtsWhatsAppText();
        assert.ok(windowMock._copiedText, 'Debe haber copiado texto al portapapeles');
        console.log('📄 Texto generado para WhatsApp:\n' + windowMock._copiedText);

        assert.ok(windowMock._copiedText.includes('SOMOSPADEL BCN • CRUCES RONDA 1'), 'El texto debe tener la cabecera SOMOSPADEL BCN • CRUCES RONDA 1');
        assert.ok(windowMock._copiedText.includes('PISTA 1'), 'El texto debe contener PISTA 1');
        assert.ok(windowMock._copiedText.includes('PISTA 2'), 'El texto debe contener PISTA 2');
        assert.ok(windowMock._copiedText.includes('Pareja A:'), 'El texto debe identificar Pareja A');
        assert.ok(windowMock._copiedText.includes('Pareja B:'), 'El texto debe identificar Pareja B');
        assert.ok(windowMock._copiedText.includes('somospadel.com'), 'El texto debe incluir enlace a somospadel.com');
        console.log('✅ Formato de WhatsApp en texto validado con éxito');

        console.log('\n--- 5. Verificando botón de WhatsApp Imagen HD y contenedor capturable ---');
        assert.ok(typeof windowMock.shareCourtsWhatsAppImage === 'function', 'shareCourtsWhatsAppImage debe ser función');
        assert.ok(modalHtml.includes('battle-courts-capture-area'), 'Debe contener battle-courts-capture-area');
        assert.ok(modalHtml.includes('btn-share-courts-img-header'), 'Debe existir el botón de imagen en el encabezado de pistas');
        assert.ok(modalHtml.includes('battle-courts-img-btn'), 'Debe existir el botón de imagen en la botonera de acciones');
        console.log('✅ Botones y contenedor capturable HD validados con éxito');

        console.log('\n--- 6. Verificando previa provisional cuando aún NO hay partidos de Ronda 1 ---');
        windowMock._hasRound1Matches = false;
        windowMock.EventsController.state.americanas = [{
            id: 'evt_sync_2',
            name: 'Torneo Previa Test',
            date: '2026-10-20',
            time: '18:00',
            sede: 'Pádel Club Barcelona',
            max_courts: 1,
            players: [mockPlayersDb[0], mockPlayersDb[1], mockPlayersDb[2], mockPlayersDb[3]]
        }];
        await windowMock.EventsController.showInscritosModal('evt_sync_2', 'americana', false);
        const modalHtmlPrevia = mockDOM.elements['inscritos-modal'].innerHTML;
        assert.ok(modalHtmlPrevia.includes('PREVIA PROVISIONAL • PENDIENTE DE SORTEO R1'), 'Debe mostrar badge de Previa Provisional');
        windowMock.shareCourtsWhatsAppText();
        assert.ok(windowMock._copiedText.includes('Previa Provisional'), 'El texto de WhatsApp debe indicar Previa Provisional');
        console.log('✅ Previa provisional verificada con éxito');

        console.log('\n🎉 TODOS LOS TESTS DE SINCRONIZACIÓN Y WHATSAPP PASARON AL 100%');
    } catch (err) {
        console.error('❌ Error en test QA:', err);
        process.exit(1);
    }
})();
