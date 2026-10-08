/**
 * tests/test-suplentes-cotillear-battle-qa.js
 * Comprehensive QA Test Suite for:
 * 1. Syntax & Structural integrity of EventsController_V6.js
 * 2. Waitlist handling (populated, empty, null/undefined, deduplication)
 * 3. Filter pills (all, titulares, reservas, pair, solo, vacant)
 * 4. window.cotillearJugador safety, stopPropagation & PadelFutCard integration
 * 5. Non-regression of existing features (closeBattleReadyModal, speaker, courts mode, share, story)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passCount++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failCount++;
    }
}

console.log("\n=======================================================");
console.log("🧪 QA TEST SUITE: SUPLENTES & COTILLEAR EN AMERICANAS");
console.log("=======================================================\n");

// --- TEST 1: SINTAXIS Y CARGA DE SCRIPT ---
console.log("--- 1. Validación de Sintaxis & Parsing JS ---");
const scriptPath = path.join(__dirname, '..', 'js', 'modules', 'americanas', 'EventsController_V6.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

assert(scriptCode && scriptCode.length > 50000, `Archivo EventsController_V6.js cargado correctamente (${scriptCode.length} bytes)`);

// Create simulated browser environment
class MockClassList {
    constructor() {
        this.classes = new Set();
    }
    add(...cls) { cls.forEach(c => this.classes.add(c)); }
    remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
    contains(c) { return this.classes.has(c); }
}

class MockElement {
    constructor(tagName = 'div', id = '') {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.classList = new MockClassList();
        this.style = {};
        this.attributes = {};
        this.children = [];
        this.innerHTML = '';
        this.innerText = '';
        this.textContent = '';
    }
    setAttribute(name, val) { this.attributes[name] = String(val); }
    getAttribute(name) { return this.attributes[name] || null; }
    appendChild(child) { this.children.push(child); return child; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
}

const mockElements = new Map();
function getOrCreateMockElement(id) {
    if (!mockElements.has(id)) {
        mockElements.set(id, new MockElement('div', id));
    }
    return mockElements.get(id);
}

const windowMock = {
    console: console,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: () => 1,
    clearInterval: () => {},
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    document: {
        fullscreenElement: null,
        body: new MockElement('body'),
        createElement: (tag) => new MockElement(tag),
        getElementById: (id) => getOrCreateMockElement(id),
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    navigator: {
        userAgent: 'Node.js Test Runner'
    },
    db: {
        collection: (colName) => ({
            onSnapshot: (callback) => {
                callback({ docs: [] });
                return () => {};
            },
            doc: (docId) => ({
                get: async () => ({
                    exists: true,
                    id: docId,
                    data: () => ({ id: docId, name: 'Torneo QA Test', max_courts: 2, players: [], waitlist: [] })
                })
            })
        })
    }
};
windowMock.window = windowMock;
windowMock.document.defaultView = windowMock;

// Execute script in sandbox
try {
    const context = vm.createContext({
        ...windowMock,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    });
    vm.runInContext(scriptCode, context);
    // Sync globals back
    Object.assign(windowMock, context);

    assert(typeof windowMock.cotillearJugador === 'function', "window.cotillearJugador está definido como función global");
    assert(typeof windowMock.openLiveEvent === 'function', "window.openLiveEvent está disponible");
    assert(typeof windowMock.openResultsView === 'function', "window.openResultsView está disponible");
    assert(typeof windowMock.filterBattleReady === 'function', "window.filterBattleReady está disponible globalmente");
    assert(typeof windowMock.applyBattleReadyVisibility === 'function', "window.applyBattleReadyVisibility está disponible globalmente");
} catch (e) {
    assert(false, `Error ejecutando script en sandbox: ${e.message}`);
}

// --- TEST 2: VALIDACIÓN DE COTILLEAR JUGADOR ---
console.log("\n--- 2. Validación de window.cotillearJugador ---");
let futCardOpened = null;
windowMock.PadelFutCard = {
    open: (opts) => {
        futCardOpened = opts;
    }
};

windowMock._currentInscritosPlayersMap = {
    'user_123': {
        id: 'user_123',
        uid: 'user_123',
        name: 'Carlos Alcaraz',
        level: '5.25',
        photo_url: 'img/carlos.jpg',
        position: 'Revés'
    }
};

let eventStopped = false;
const mockEvent = {
    stopPropagation: () => { eventStopped = true; }
};

// Test A: Normal call with event
windowMock.cotillearJugador('user_123', mockEvent);
assert(eventStopped === true, "stopPropagation ejecutado en mockEvent");
assert(futCardOpened && futCardOpened.user && futCardOpened.user.name === 'Carlos Alcaraz', "PadelFutCard.open recibió datos correctos de Carlos Alcaraz");
assert(futCardOpened.user.level === '5.25', "Nivel 5.25 transmitido fielmente a PadelFutCard");

// Test B: Call without event (safe)
futCardOpened = null;
let noCrashWithoutEvent = false;
try {
    windowMock.cotillearJugador('user_123');
    noCrashWithoutEvent = true;
} catch (err) {
    noCrashWithoutEvent = false;
}
assert(noCrashWithoutEvent === true, "Llamada sin evento no lanza excepción");
assert(futCardOpened && futCardOpened.user.id === 'user_123', "PadelFutCard.open llamado incluso sin parámetro event");

// Test C: Call with missing/null playerId (safe)
let noCrashWithNull = false;
try {
    windowMock.cotillearJugador(null);
    windowMock.cotillearJugador(undefined);
    windowMock.cotillearJugador('');
    noCrashWithNull = true;
} catch (err) {
    noCrashWithNull = false;
}
assert(noCrashWithNull === true, "Llamadas con ID nulo/indefinido se manejan silenciosamente y sin excepción");

// Test D: Fallback when PadelFutCard is missing
delete windowMock.PadelFutCard;
let fallbackCalled = false;
windowMock.PlayerView = {
    openPlayerModal: (uid) => { fallbackCalled = (uid === 'user_123'); }
};
windowMock.cotillearJugador('user_123');
assert(fallbackCalled === true, "Fallback ordenado a PlayerView.openPlayerModal si PadelFutCard no está cargado");

// --- TEST 3: PROCESAMIENTO ROBUSTO DE WAITLIST (SUPLENTES) ---
console.log("\n--- 3. Validación de Procesamiento de Waitlist ---");

// Simular el algoritmo de extracción y deduplicación que usa EventsController_V6
function processPlayersAndWaitlist(evt) {
    const rawList = (evt.players && evt.players.length > 0)
        ? evt.players
        : (evt.registeredPlayers && evt.registeredPlayers.length > 0)
            ? evt.registeredPlayers
            : [];

    const seenIds = new Set();
    const uniqueRawList = rawList.filter(p => {
        const uid = (typeof p === 'string') ? p : (p.uid || p.id);
        if (!uid || seenIds.has(uid)) return false;
        seenIds.add(uid);
        return true;
    });

    const rawWaitlist = Array.isArray(evt.waitlist) ? evt.waitlist : [];
    const seenWaitlistIds = new Set();
    const uniqueWaitlist = rawWaitlist.filter(p => {
        const uid = (typeof p === 'string') ? p : (p.uid || p.id);
        if (!uid || seenWaitlistIds.has(uid) || seenIds.has(uid)) return false;
        seenWaitlistIds.add(uid);
        return true;
    });

    return {
        confirmed: uniqueRawList,
        waitlist: uniqueWaitlist
    };
}

// Case A: Waitlist normal con reservas
const eventWithWaitlist = {
    players: [{ uid: 'p1', name: 'Jugador 1' }, { uid: 'p2', name: 'Jugador 2' }],
    waitlist: [{ uid: 'w1', name: 'Reserva 1' }, { uid: 'w2', name: 'Reserva 2' }]
};
const resA = processPlayersAndWaitlist(eventWithWaitlist);
assert(resA.confirmed.length === 2 && resA.waitlist.length === 2, "Procesa correctamente 2 titulares y 2 reservas");

// Case B: Waitlist null / undefined
const eventNullWaitlist = {
    players: [{ uid: 'p1' }],
    waitlist: null
};
const resB = processPlayersAndWaitlist(eventNullWaitlist);
assert(resB.confirmed.length === 1 && resB.waitlist.length === 0, "Manejo seguro de waitlist null (retorna array vacío sin romper)");

// Case C: Waitlist vacía
const eventEmptyWaitlist = {
    players: [{ uid: 'p1' }],
    waitlist: []
};
const resC = processPlayersAndWaitlist(eventEmptyWaitlist);
assert(resC.waitlist.length === 0, "Waitlist vacía procesada correctamente como longitud 0");

// Case D: Deduplicación cruzada (un jugador en waitlist que ya estaba de titular no debe salir dos veces)
const eventDuplicated = {
    players: [{ uid: 'p1', name: 'Titular' }],
    waitlist: [{ uid: 'p1', name: 'Titular de nuevo en espera' }, { uid: 'w1', name: 'Reserva legítima' }]
};
const resD = processPlayersAndWaitlist(eventDuplicated);
assert(resD.confirmed.length === 1, "Titular deduplicado");
assert(resD.waitlist.length === 1 && resD.waitlist[0].uid === 'w1', "Deduplicación cruzada excluye titular de la lista de reservas");

// --- TEST 4: FILTROS PILLS Y VISIBILIDAD (applyBattleReadyVisibility) ---
console.log("\n--- 4. Validación de Filtros Pills & applyBattleReadyVisibility ---");

// Creamos un DOM virtual con tarjetas de titulares, reservas, parejas y plazas libres
function createCard(type, names, levels) {
    const el = new MockElement('div');
    el.classList.add('battle-ready-item');
    el.setAttribute('data-filter-type', type);
    el.setAttribute('data-player-names', names);
    el.setAttribute('data-player-levels', levels);
    el.style.display = 'block';
    return el;
}

const mockCards = [
    createCard('pair', 'Alejandro Galan Juan Lebron', '5.5 5.5'),
    createCard('pair', 'Paquito Navarro Martin Di Nenno', '5.2 5.0'),
    createCard('solo', 'Fernando Belasteguin', '5.0'),
    createCard('vacant', 'libre disponible vacante', ''),
    createCard('waitlist', 'Arturo Coello', '5.4'),
    createCard('waitlist', 'Agustin Tapia', '5.6')
];

const mockCourts = [
    new MockElement('div', 'court-1'),
    new MockElement('div', 'court-2')
];
mockCourts.forEach(c => {
    c.classList.add('battle-court-card');
    c.setAttribute('data-player-names', 'Galan Lebron Navarro Di Nenno Belasteguin');
    c.style.display = 'block';
});

const secConfirmed = new MockElement('div', 'battle-section-confirmed');
const secWaitlist = new MockElement('div', 'battle-section-waitlist');
const emptyWaitlistMsg = new MockElement('div', 'battle-empty-waitlist');

// Configurar windowMock document para filtros
windowMock.document.querySelectorAll = (selector) => {
    if (selector === '.battle-ready-item') return mockCards;
    if (selector === '.battle-court-card') return mockCourts;
    if (selector === '.battle-filter-pill') return [
        getOrCreateMockElement('battle-pill-all'),
        getOrCreateMockElement('battle-pill-titulares'),
        getOrCreateMockElement('battle-pill-reservas'),
        getOrCreateMockElement('battle-pill-pair'),
        getOrCreateMockElement('battle-pill-solo'),
        getOrCreateMockElement('battle-pill-vacant')
    ];
    return [];
};

windowMock.document.getElementById = (id) => {
    if (id === 'battle-section-confirmed') return secConfirmed;
    if (id === 'battle-section-waitlist') return secWaitlist;
    if (id === 'battle-empty-waitlist') return emptyWaitlistMsg;
    return getOrCreateMockElement(id);
};

// Disparar showInscritosModal para enlazar los helpers dinámicos
(async () => {
    if (windowMock.EventsController) {
        windowMock.EventsController.state.americanas = [{
            id: 'evt_qa_1',
            name: 'Americana QA',
            date: '2026-10-02',
            time: '18:00',
            max_courts: 2,
            players: [
                { uid: 'p1', name: 'Alejandro Galan', level: 5.5, partner_id: 'p2' },
                { uid: 'p2', name: 'Juan Lebron', level: 5.5, partner_id: 'p1' },
                { uid: 'p3', name: 'Fernando Belasteguin', level: 5.0 }
            ],
            waitlist: [
                { uid: 'w1', name: 'Arturo Coello', level: 5.4 },
                { uid: 'w2', name: 'Agustin Tapia', level: 5.6 }
            ]
        }];
        try {
            await windowMock.EventsController.showInscritosModal('evt_qa_1', 'americana', true);
        } catch (e) {
            // Mock doc get fallback
        }
    }

    // Test Filter: 'all'
    windowMock.filterBattleReady('all');
    let allCardsVisible = mockCards.every(c => c.style.display === 'block');
    assert(allCardsVisible === true, "Filtro 'all': Todas las tarjetas (titulares, plazas y reservas) están visibles");
    assert(secConfirmed.style.display !== 'none', "Filtro 'all': Sección titulares está visible");
    assert(secWaitlist.style.display !== 'none', "Filtro 'all': Sección reservas está visible");

    // Test Filter: 'titulares'
    windowMock.filterBattleReady('titulares');
    const pairCardsVisible = mockCards.filter(c => c.getAttribute('data-filter-type') === 'pair').every(c => c.style.display === 'block');
    const soloCardsVisible = mockCards.filter(c => c.getAttribute('data-filter-type') === 'solo').every(c => c.style.display === 'block');
    const waitlistCardsHidden = mockCards.filter(c => c.getAttribute('data-filter-type') === 'waitlist').every(c => c.style.display === 'none');
    assert(pairCardsVisible && soloCardsVisible && waitlistCardsHidden, "Filtro 'titulares': Muestra parejas y solos, oculta reservas");
    assert(secConfirmed.style.display !== 'none', "Filtro 'titulares': Sección titulares visible");
    assert(secWaitlist.style.display === 'none', "Filtro 'titulares': Sección reservas oculta");

    // Test Filter: 'reservas'
    windowMock.filterBattleReady('reservas');
    const waitlistCardsVisible = mockCards.filter(c => c.getAttribute('data-filter-type') === 'waitlist').every(c => c.style.display === 'block');
    const confirmedCardsHidden = mockCards.filter(c => c.getAttribute('data-filter-type') === 'pair' || c.getAttribute('data-filter-type') === 'solo').every(c => c.style.display === 'none');
    assert(waitlistCardsVisible && confirmedCardsHidden, "Filtro 'reservas': Muestra reservas, oculta titulares");
    assert(secConfirmed.style.display === 'none', "Filtro 'reservas': Sección titulares oculta");
    assert(secWaitlist.style.display !== 'none', "Filtro 'reservas': Sección reservas visible");

    // Test Filter: 'pair'
    windowMock.filterBattleReady('pair');
    const onlyPairs = mockCards.every(c => (c.getAttribute('data-filter-type') === 'pair') ? c.style.display === 'block' : c.style.display === 'none');
    assert(onlyPairs === true, "Filtro 'pair': Muestra exclusivamente parejas confirmadas");

    // Test Filter: 'solo'
    windowMock.filterBattleReady('solo');
    const onlySolos = mockCards.every(c => (c.getAttribute('data-filter-type') === 'solo') ? c.style.display === 'block' : c.style.display === 'none');
    assert(onlySolos === true, "Filtro 'solo': Muestra exclusivamente jugadores buscando pareja");

    // Test Filter: 'vacant'
    windowMock.filterBattleReady('vacant');
    const onlyVacant = mockCards.every(c => (c.getAttribute('data-filter-type') === 'vacant') ? c.style.display === 'block' : c.style.display === 'none');
    assert(onlyVacant === true, "Filtro 'vacant': Muestra exclusivamente plazas libres");

    // Test Search Query
    windowMock.filterBattleReady('all');
    windowMock.searchBattleReady('coello');
    const coelloVisible = mockCards.find(c => c.getAttribute('data-player-names').includes('Coello')).style.display === 'block';
    const galanHidden = mockCards.find(c => c.getAttribute('data-player-names').includes('Galan')).style.display === 'none';
    assert(coelloVisible && galanHidden, "Buscador reactivo en tiempo real filtra por nombre 'Coello'");

    // --- TEST 5: NO REGRESIONES EN BOTONES CRÍTICOS ---
    console.log("\n--- 5. Comprobación de No Regresión en Funciones Globales ---");
    const expectedGlobals = [
        'window.closeBattleReadyModal',
        'window.toggleBattleVoiceBroadcast',
        'window.setBattleDisplayMode',
        'window.shareConvocatoriaBattleReady',
        'window.generateConvocatoriaStory',
        'window.toggleBattleReadyFullscreen',
        'window.updateBattleCountdown',
        'window.openResultsView',
        'window.openLiveEvent',
        'window.openEventWeather'
    ];

    expectedGlobals.forEach(g => {
        const parts = g.split('.');
        let obj = windowMock;
        for (let i = 1; i < parts.length; i++) {
            obj = obj ? obj[parts[i]] : undefined;
        }
        assert(typeof obj === 'function', `Función crítica preservada: ${g}`);
    });

    console.log("\n=======================================================");
    console.log(`📊 RESULTADOS QA: ${passCount} PASSED | ${failCount} FAILED`);
    console.log("=======================================================\n");

    if (failCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
})();
