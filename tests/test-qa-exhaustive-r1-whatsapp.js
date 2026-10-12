/**
 * Comprehensive QA Test Suite for:
 * 1. Ronda 1 Official Match Court Synchronization (Americanas & Entrenos & ControlTowerView fallback)
 * 2. Provisional Preview (No Round 1 matches) with informative badges
 * 3. Match schema variety handling (team_a_ids, player_a1_id, array team_a, string team_a)
 * 4. WhatsApp Structured Text Generation & Fallback Channels (Web Share, Clipboard, wa.me)
 * 5. WhatsApp Image HD Generation & Fallback Channels (html2canvas, Web Share with Files, Anchor Download)
 * 6. Cache busting in index.html
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n========================================================================');
console.log('🧪 QA EXHAUSTIVE TEST: RONDA 1 COURTS SYNC & WHATSAPP DUAL-SHARE ENGINE');
console.log('========================================================================\n');

const projectRoot = path.join(__dirname, '..');
const controllerPath = path.join(projectRoot, 'js', 'modules', 'americanas', 'EventsController_V6.js');
const indexHtmlPath = path.join(projectRoot, 'index.html');

// -----------------------------------------------------------------------------
// TEST 1: File integrity & Syntax validation
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Verificación de Integridad de Archivos y Sintaxis ---');
assert.ok(fs.existsSync(controllerPath), 'EventsController_V6.js debe existir');
assert.ok(fs.existsSync(indexHtmlPath), 'index.html debe existir');

const controllerCode = fs.readFileSync(controllerPath, 'utf8');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

assert.doesNotThrow(() => {
    new Function(controllerCode);
}, 'EventsController_V6.js debe compilar limpiamente sin errores de sintaxis');
console.log('✅ EventsController_V6.js sintaxis verificada correctamente.');

// -----------------------------------------------------------------------------
// TEST 2: index.html Cache Buster check
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Comprobación de Cache Buster en index.html ---');
const expectedScriptTag = 'js/modules/americanas/EventsController_V6.js?v=IG_STORY_FLYER_WHITE_HD_V24';
assert.ok(
    indexHtmlContent.includes(expectedScriptTag),
    `index.html debe contener la versión actualizada ${expectedScriptTag}`
);
console.log('✅ index.html incluye el cache buster V24 para garantizar refresco inmediato en clientes.');

// -----------------------------------------------------------------------------
// Helper to build sandbox environment
// -----------------------------------------------------------------------------
function createSandbox(initialConfig = {}) {
    const registeredElements = {};
    const mockDocument = {
        elements: registeredElements,
        fullscreenElement: null,
        getElementById(id) {
            if (registeredElements[id]) return registeredElements[id];
            // Check if any element contains this id in innerHTML
            for (const key of Object.keys(registeredElements)) {
                const parent = registeredElements[key];
                if (parent && parent.innerHTML && parent.innerHTML.includes(`id="${id}"`)) {
                    // Create and cache child element
                    const child = {
                        id,
                        style: {},
                        innerHTML: '',
                        disabled: false,
                        tagName: 'DIV',
                        classList: { add: () => {}, remove: () => {}, has: () => false }
                    };
                    registeredElements[id] = child;
                    return child;
                }
            }
            return null;
        },
        querySelectorAll(selector) {
            return [];
        },
        createElement(tag) {
            const el = {
                tagName: tag.toUpperCase(),
                style: {},
                _innerHTML: '',
                get innerHTML() { return this._innerHTML; },
                set innerHTML(val) {
                    this._innerHTML = val;
                    // Detect child elements with IDs
                    const idMatches = val.matchAll(/id="([^"]+)"/g);
                    for (const m of idMatches) {
                        const childId = m[1];
                        if (!registeredElements[childId]) {
                            registeredElements[childId] = {
                                id: childId,
                                style: {},
                                innerHTML: '',
                                disabled: false,
                                tagName: 'DIV',
                                classList: { add: () => {}, remove: () => {}, has: () => false }
                            };
                        }
                    }
                },
                classList: {
                    _set: new Set(),
                    add(c) { this._set.add(c); },
                    remove(c) { this._set.delete(c); },
                    has(c) { return this._set.has(c); }
                },
                attributes: {},
                setAttribute(k, v) { this.attributes[k] = String(v); },
                getAttribute(k) { return this.attributes[k] || null; },
                appendChild(child) {
                    if (child && child.id) registeredElements[child.id] = child;
                },
                removeChild(child) {
                    if (child && child.id) delete registeredElements[child.id];
                },
                click() {
                    if (this.onclick) this.onclick();
                }
            };
            return el;
        },
        head: {
            appendChild(child) {
                if (child && child.src && child.onload) {
                    setTimeout(() => child.onload(), 0);
                }
            }
        },
        body: {
            appendChild(child) {
                if (child && child.id) registeredElements[child.id] = child;
            },
            removeChild(child) {
                if (child && child.id) delete registeredElements[child.id];
            }
        }
    };

    const windowMock = {
        document: mockDocument,
        navigator: {
            clipboard: {
                writeText: async (text) => {
                    windowMock._lastCopiedText = text;
                    return true;
                }
            },
            share: async (data) => {
                windowMock._lastShareData = data;
                if (windowMock._throwOnShare) {
                    const err = new Error('Share canceled or unsupported');
                    err.name = 'NotAllowedError';
                    throw err;
                }
                return true;
            },
            canShare: (data) => {
                if (windowMock._canShareFiles === false) return false;
                return Boolean(data && data.files && data.files.length > 0);
            }
        },
        localStorage: {
            getItem: (k) => initialConfig.localStorage?.[k] || null,
            setItem: () => {}
        },
        location: { href: 'https://somospadel.com' },
        open: (url, target) => {
            windowMock._lastOpenedUrl = url;
            windowMock._lastOpenedTarget = target;
        },
        alert: (msg) => {
            windowMock._lastAlert = msg;
        },
        addEventListener: () => {},
        playBattleAudio: (sound) => {
            windowMock._lastAudio = sound;
        },
        html2canvas: async (el, opts) => {
            windowMock._lastHtml2CanvasTarget = el;
            windowMock._lastHtml2CanvasOpts = opts;
            return {
                toBlob: (cb, type) => {
                    const mockBlob = { size: 1024, type: type || 'image/png' };
                    cb(mockBlob);
                }
            };
        },
        File: class MockFile {
            constructor(parts, name, opts) {
                this.parts = parts;
                this.name = name;
                this.type = opts?.type || 'image/png';
            }
        },
        URL: {
            createObjectURL: (blob) => 'blob:mock-url-' + Math.random().toString(36).substring(2),
            revokeObjectURL: () => {}
        },
        db: {
            collection: (colName) => {
                windowMock._queriedCollection = colName;
                return {
                    onSnapshot: () => () => {},
                    doc: (docId) => ({
                        get: async () => {
                            if (colName === 'players') {
                                const found = (initialConfig.playersDb || []).find(p => p.id === docId);
                                if (found) return { exists: true, id: docId, data: () => found };
                                return { exists: false, id: docId, data: () => ({}) };
                            }
                            return { exists: false, id: docId, data: () => ({}) };
                        }
                    }),
                    where: (field, op, val) => ({
                        where: (field2, op2, val2) => ({
                            get: async () => {
                                const matches = (initialConfig.collections?.[colName] || []);
                                const filtered = matches.filter(m => {
                                    const matchAmericana = String(m[field]) === String(val);
                                    const matchRound = String(m[field2]) === String(val2);
                                    return matchAmericana && matchRound;
                                });
                                return {
                                    empty: filtered.length === 0,
                                    docs: filtered.map(item => ({ id: item.id || 'doc_' + Math.random(), data: () => item }))
                                };
                            }
                        }),
                        get: async () => {
                            if (colName === 'players' && op === 'in') {
                                const uids = Array.isArray(val) ? val : [];
                                const foundList = (initialConfig.playersDb || []).filter(p => uids.includes(p.id));
                                return {
                                    empty: foundList.length === 0,
                                    docs: foundList.map(p => ({ id: p.id, data: () => p })),
                                    forEach: (cb) => {
                                        foundList.forEach(p => cb({ id: p.id, data: () => p }));
                                    }
                                };
                            }
                            return { empty: true, docs: [], forEach: () => {} };
                        }
                    })
                };
            }
        }
    };

    const context = vm.createContext({
        window: windowMock,
        document: mockDocument,
        navigator: windowMock.navigator,
        File: windowMock.File,
        URL: windowMock.URL,
        alert: (msg) => { windowMock._lastAlert = msg; },
        console,
        setTimeout: (cb, ms) => { cb(); },
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        requestAnimationFrame: (cb) => cb(),
        Array, Object, String, Number, Boolean, Math, Date, RegExp, Set, Map, Promise
    });

    vm.runInContext(controllerCode, context);
    return { windowMock, mockDocument };
}

(async () => {
    try {
        // -----------------------------------------------------------------------------
        // TEST 3: Torneo Americano con partidos oficiales en coleccion 'matches'
        // -----------------------------------------------------------------------------
        console.log('\n--- TEST 3: Torneo Americano con Partidos Oficiales de R1 en Firestore ---');
        const playersDb3 = [
            { id: 'u1', name: 'Carlos Alcaraz', level: '5.5', position: 'Revés' },
            { id: 'u2', name: 'Rafa Nadal', level: '5.8', position: 'Drive' },
            { id: 'u3', name: 'Novak Djokovic', level: '5.9', position: 'Revés' },
            { id: 'u4', name: 'Roger Federer', level: '6.0', position: 'Drive' }
        ];

        const matchesR1_3 = [
            {
                id: 'm1_c1',
                americana_id: 'torneo_101',
                round: 1,
                court: 1,
                team_a_ids: ['u1', 'u2'],
                team_a_names: ['Carlos Alcaraz', 'Rafa Nadal'],
                team_b_ids: ['u3', 'u4'],
                team_b_names: ['Novak Djokovic', 'Roger Federer']
            }
        ];

        const env3 = createSandbox({
            playersDb: playersDb3,
            collections: { matches: matchesR1_3 }
        });

        const evtAmericano = {
            id: 'torneo_101',
            type: 'americana',
            name: 'Grand Slam SomosPadel BCN',
            date: '2026-10-25',
            time: '18:30',
            sede: 'Pádel Indoor Hospitalet',
            max_courts: 1,
            players: playersDb3.map(p => ({ uid: p.id, name: p.name, level: p.level }))
        };

        env3.windowMock.EventsController.state.americanas = [evtAmericano];
        await env3.windowMock.EventsController.showInscritosModal('torneo_101', 'americana', false);

        const modalContent3 = env3.mockDocument.elements['inscritos-modal'].innerHTML.toUpperCase();
        assert.ok(modalContent3.includes('CRUCES OFICIALES • RONDA 1'), 'Debe marcarse como CRUCES OFICIALES • RONDA 1');
        assert.ok(modalContent3.includes('⚡ OFICIAL R1'), 'La Pista 1 debe tener badge ⚡ OFICIAL R1');
        assert.ok(modalContent3.includes('CARLOS ALCARAZ'), 'Debe incluir a Carlos Alcaraz');
        assert.ok(modalContent3.includes('ROGER FEDERER'), 'Debe incluir a Roger Federer');
        console.log('✅ Torneo Americano mapeó correctamente los cruces oficiales de R1');

        // WhatsApp Texto
        env3.windowMock.shareCourtsWhatsAppText();
        await new Promise(r => setTimeout(r, 20));
        const txt3 = env3.windowMock._lastCopiedText || env3.windowMock._lastShareData?.text;
        assert.ok(txt3.includes('GRAND SLAM SOMOSPADEL BCN'), 'Texto debe tener nombre de torneo');
        assert.ok(txt3.includes('PISTA 1'), 'Texto debe tener PISTA 1');
        assert.ok(txt3.includes('Carlos Alcaraz'), 'Texto debe tener a Carlos Alcaraz');
        assert.ok(txt3.includes('Roger Federer'), 'Texto debe tener a Roger Federer');
        assert.ok(txt3.includes('somospadel.com'), 'Texto debe contener enlace a la app');
        console.log('✅ Generación de WhatsApp Texto validada para Torneo Americano');

        // WhatsApp Imagen HD
        await env3.windowMock.shareCourtsWhatsAppImage();
        await new Promise(r => setTimeout(r, 20));
        assert.ok(env3.windowMock._lastHtml2CanvasTarget, 'html2canvas debe haber sido invocado sobre capture-area');
        assert.ok(env3.windowMock._lastShareData?.files?.length === 1, 'navigator.share debe haber recibido el archivo de imagen PNG');
        console.log('✅ Compartir imagen HD mediante Web Share Files verificado con éxito');

        // -----------------------------------------------------------------------------
        // TEST 4: Entreno con partidos oficiales en coleccion 'entrenos_matches'
        // -----------------------------------------------------------------------------
        console.log('\n--- TEST 4: Entreno con Partidos Oficiales de R1 en entrenos_matches ---');
        const playersDb4 = [
            { id: 'e1', name: 'Marc López', level: '4.2', position: 'Drive' },
            { id: 'e2', name: 'David Ferrer', level: '4.5', position: 'Revés' },
            { id: 'e3', name: 'Feliciano López', level: '4.1', position: 'Revés' },
            { id: 'e4', name: 'Fernando Verdasco', level: '4.3', position: 'Drive' }
        ];

        const entrenoMatchesR1 = [
            {
                id: 'entreno_m_c1',
                americana_id: 'entreno_202',
                round: 1,
                court: 1,
                player_a1_id: 'e1',
                player_a1_name: 'Marc López',
                player_a2_id: 'e2',
                player_a2_name: 'David Ferrer',
                player_b1_id: 'e3',
                player_b1_name: 'Feliciano López',
                player_b2_id: 'e4',
                player_b2_name: 'Fernando Verdasco'
            }
        ];

        const env4 = createSandbox({
            playersDb: playersDb4,
            collections: { entrenos_matches: entrenoMatchesR1 }
        });

        const evtEntreno = {
            id: 'entreno_202',
            type: 'entreno',
            name: 'Entreno Táctico Avanzado SomosPadel',
            date: '2026-10-26',
            time: '20:00',
            sede: 'Padel Nou Barris',
            max_courts: 1,
            players: playersDb4.map(p => ({ uid: p.id, name: p.name, level: p.level }))
        };

        env4.windowMock.EventsController.state.entrenos = [evtEntreno];
        await env4.windowMock.EventsController.showInscritosModal('entreno_202', 'entreno', false);

        assert.strictEqual(env4.windowMock._queriedCollection, 'entrenos_matches', 'Para tipo entreno debe consultar la colección entrenos_matches');

        const modalContent4 = env4.mockDocument.elements['inscritos-modal'].innerHTML.toUpperCase();
        assert.ok(modalContent4.includes('CRUCES OFICIALES • RONDA 1'), 'Entreno debe tener badge CRUCES OFICIALES • RONDA 1');
        assert.ok(modalContent4.includes('MARC LÓPEZ'), 'Debe incluir a Marc López');
        assert.ok(modalContent4.includes('FERNANDO VERDASCO'), 'Debe incluir a Fernando Verdasco');
        console.log('✅ Entrenos consulta correctamente entrenos_matches y sincroniza pistas con esquema alternativo player_a1_id');

        // -----------------------------------------------------------------------------
        // TEST 5: Fallback de ControlTowerView en memoria cuando Firestore no tiene datos
        // -----------------------------------------------------------------------------
        console.log('\n--- TEST 5: Fallback de ControlTowerView en memoria cuando Firestore está vacío ---');
        const playersDb5 = [
            { id: 'p1', name: 'Alex Corretja', level: '4.8', position: 'Revés' },
            { id: 'p2', name: 'Albert Costa', level: '4.7', position: 'Drive' },
            { id: 'p3', name: 'Carlos Moyá', level: '5.0', position: 'Drive' },
            { id: 'p4', name: 'Juan Carlos Ferrero', level: '5.2', position: 'Revés' }
        ];

        const env5 = createSandbox({
            playersDb: playersDb5,
            collections: { matches: [] }
        });

        env5.windowMock.ControlTowerView = {
            currentAmericanaDoc: { id: 'torneo_ctv_303' },
            allMatches: [
                {
                    id: 'ctv_m1',
                    round: 1,
                    court: 1,
                    team_a: ['Alex Corretja', 'Albert Costa'],
                    team_b: ['Carlos Moyá', 'Juan Carlos Ferrero']
                }
            ]
        };

        const evt5 = {
            id: 'torneo_ctv_303',
            type: 'americana',
            name: 'Torneo Leyendas SomosPadel',
            date: '2026-10-27',
            time: '19:00',
            sede: 'Prat Pádel',
            max_courts: 1,
            players: playersDb5.map(p => ({ uid: p.id, name: p.name, level: p.level }))
        };

        env5.windowMock.EventsController.state.americanas = [evt5];
        await env5.windowMock.EventsController.showInscritosModal('torneo_ctv_303', 'americana', false);

        const modalContent5 = env5.mockDocument.elements['inscritos-modal'].innerHTML.toUpperCase();
        assert.ok(modalContent5.includes('CRUCES OFICIALES • RONDA 1'), 'Debe sincronizar vía ControlTowerView');
        assert.ok(modalContent5.includes('ALEX CORRETJA'), 'Debe resolver nombres desde array team_a');
        assert.ok(modalContent5.includes('JUAN CARLOS FERRERO'), 'Debe resolver nombres desde array team_b');
        console.log('✅ Fallback a ControlTowerView en memoria comprobado con soporte de arrays team_a/team_b');

        // -----------------------------------------------------------------------------
        // TEST 6: Previa provisional cuando NO existen partidos generados
        // -----------------------------------------------------------------------------
        console.log('\n--- TEST 6: Previa Provisional Sin Partidos Oficiales ---');
        const playersDb6 = [
            { id: 'pv1', name: 'Pedro Solo', level: '3.2', position: 'Drive' },
            { id: 'pv2', name: 'Pablo Solo', level: '3.5', position: 'Revés' }
        ];

        const env6 = createSandbox({
            playersDb: playersDb6,
            collections: { matches: [] }
        });

        const evtPrevia = {
            id: 'torneo_previa_404',
            type: 'americana',
            name: 'Torneo Abierto Inscripciones',
            date: '2026-10-30',
            time: '17:00',
            sede: 'SomosPadel Club',
            max_courts: 1,
            players: [
                { uid: 'pv1', name: 'Pedro Solo', level: '3.2' },
                { uid: 'pv2', name: 'Pablo Solo', level: '3.5' }
            ]
        };

        env6.windowMock.EventsController.state.americanas = [evtPrevia];
        await env6.windowMock.EventsController.showInscritosModal('torneo_previa_404', 'americana', false);

        const modalContent6 = env6.mockDocument.elements['inscritos-modal'].innerHTML;
        assert.ok(modalContent6.includes('PREVIA PROVISIONAL • PENDIENTE DE SORTEO R1'), 'Debe indicar PREVIA PROVISIONAL');
        assert.ok(modalContent6.includes('🕒 PROVISIONAL'), 'En la pista debe indicar 🕒 PROVISIONAL');
        assert.ok(modalContent6.includes('Plaza Libre'), 'Debe contener slots de Plaza Libre');

        // Comprobar texto WhatsApp con Previa Provisional
        env6.windowMock.shareCourtsWhatsAppText();
        await new Promise(r => setTimeout(r, 20));
        const txt6 = env6.windowMock._lastCopiedText || env6.windowMock._lastShareData?.text;
        assert.ok(txt6.includes('(Previa Provisional)'), 'El texto de WhatsApp debe aclarar Previa Provisional');
        assert.ok(txt6.includes('_Plaza Libre_'), 'El texto de WhatsApp debe reflejar las plazas libres');
        console.log('✅ Previa provisional muestra badges y genera texto de WhatsApp adecuado con plazas libres');

        // -----------------------------------------------------------------------------
        // TEST 7: Canales de Fallback para WhatsApp Texto (Clipboard y wa.me)
        // -----------------------------------------------------------------------------
        console.log('\n--- TEST 7: Canales Fallback para WhatsApp Texto ---');
        const env7 = createSandbox({
            playersDb: [{ id: 'p1', name: 'Test P1', level: '4.0' }],
            collections: { matches: [] }
        });

        // Simular navegador sin navigator.share
        delete env7.windowMock.navigator.share;
        env7.windowMock.EventsController.state.americanas = [{
            id: 't_fall',
            name: 'Test Fallback',
            max_courts: 1,
            players: [{ uid: 'p1', name: 'Test P1', level: '4.0' }]
        }];
        await env7.windowMock.EventsController.showInscritosModal('t_fall', 'americana', false);

        env7.windowMock.shareCourtsWhatsAppText();
        await new Promise(r => setTimeout(r, 30));
        assert.ok(env7.windowMock._lastCopiedText, 'Debe haber copiado en clipboard');
        assert.ok(env7.windowMock._lastAlert.includes('portapapeles'), 'Debe notificar con alerta al usuario');
        console.log('✅ Fallback a Clipboard funciona');

        // Simular navegador sin share ni clipboard -> fallback a wa.me
        delete env7.windowMock.navigator.clipboard;
        env7.windowMock.shareCourtsWhatsAppText();
        await new Promise(r => setTimeout(r, 30));
        assert.ok(env7.windowMock._lastOpenedUrl.startsWith('https://wa.me/?text='), 'Debe abrir https://wa.me/?text=');
        console.log('✅ Fallback final a wa.me URL funciona');

        // -----------------------------------------------------------------------------
        // TEST 8: Canales de Fallback para WhatsApp Imagen HD (Descarga con enlace <a>)
        // -----------------------------------------------------------------------------
        console.log('\n--- TEST 8: Fallback de Descarga para WhatsApp Imagen HD ---');
        const env8 = createSandbox({
            playersDb: [{ id: 'p1', name: 'Test P1', level: '4.0' }],
            collections: { matches: [] }
        });

        // Navegador no permite compartir archivos directamente
        env8.windowMock._canShareFiles = false;

        env8.windowMock.EventsController.state.americanas = [{
            id: 't_img_fall',
            name: 'Torneo Imagen Download',
            max_courts: 1,
            players: [{ uid: 'p1', name: 'Test P1', level: '4.0' }]
        }];
        await env8.windowMock.EventsController.showInscritosModal('t_img_fall', 'americana', false);

        await env8.windowMock.shareCourtsWhatsAppImage();
        await new Promise(r => setTimeout(r, 30));
        assert.ok(env8.windowMock._lastAlert.includes('descargada'), 'Debe avisar de que la imagen fue descargada');
        console.log('✅ Fallback de descarga automática de imagen PNG validado');

        console.log('\n========================================================================');
        console.log('🏆 TODOS LOS 8 CASOS DE PRUEBA EXHAUSTIVOS DE QA FUERON SATISFACTORIOS');
        console.log('========================================================================\n');
    } catch (err) {
        console.error('❌ Error en test exhaustivo:', err);
        process.exit(1);
    }
})();
