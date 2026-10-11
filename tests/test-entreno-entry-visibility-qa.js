/**
 * tests/test-entreno-entry-visibility-qa.js
 * 
 * Certificación de Calidad (QA) Automatizada:
 * Visibilidad de acceso a entrenos y torneos ("ENTRAR AL ENTRENO" / "ENTRAR AL TORNEO").
 * 
 * Verificaciones:
 * 1. sw.js contiene la versión de caché 'somospadel-pwa-v2026.6.2'.
 * 2. renderCard genera el Hero Banner de entrada neón con openLiveEvent y texto ENTRAR AL ENTRENO (o TORNEO).
 * 3. renderCard genera el botón interactivo ENTRAR ➜ en el encabezado/título de la tarjeta.
 * 4. Cuando isJoined === true, genera el botón principal prioritario ENTRAR AL ENTRENO / TORNEO con llamada a openLiveEvent,
 *    además del botón secundario de estado de inscripción INSCRITO.
 * 5. En la vista minimizada/compacta existe el botón compacto [🎾 ENTRAR ➜] con llamada a openLiveEvent.
 * 6. Consistencia entre eventos tipo 'entreno' y tipo 'americana'.
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

console.log("\n========================================================================");
console.log("🧪 QA TEST: VISIBILIDAD DE ACCESO A ENTRENOS Y TORNEOS (ENTRAR AL ENTRENO)");
console.log("========================================================================\n");

// -----------------------------------------------------------------------------
// 1. Verificación de Service Worker (sw.js)
// -----------------------------------------------------------------------------
console.log("--- 1. Verificación de Versión de Caché PWA en sw.js ---");
const swPath = path.join(__dirname, '..', 'sw.js');
assert(fs.existsSync(swPath), "El archivo sw.js existe en la raíz del proyecto");

const swContent = fs.readFileSync(swPath, 'utf8');
const cacheMatch = swContent.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
assert(cacheMatch !== null, "sw.js define la constante CACHE_NAME");
assert(
    cacheMatch && /^somospadel-pwa-v\d+\.\d+\.\d+$/.test(cacheMatch[1]),
    `CACHE_NAME en sw.js tiene un formato de versión PWA válido (detectado: '${cacheMatch ? cacheMatch[1] : 'ninguno'}')`
);

// -----------------------------------------------------------------------------
// 2. Inicialización de Entorno de Pruebas (Mock VM) para EventsController_V6
// -----------------------------------------------------------------------------
console.log("\n--- 2. Carga y Sintaxis de EventsController_V6.js ---");
const controllerPath = path.join(__dirname, '..', 'js', 'modules', 'americanas', 'EventsController_V6.js');
assert(fs.existsSync(controllerPath), "El archivo EventsController_V6.js existe");

const controllerCode = fs.readFileSync(controllerPath, 'utf8');
assert(controllerCode.length > 50000, `EventsController_V6.js leído con éxito (${controllerCode.length} bytes)`);

// Configurar mocks de navegador para instanciar EventsController en Node VM
class MockElement {
    constructor(tag = 'div', id = '') {
        this.tagName = tag.toUpperCase();
        this.id = id;
        this.style = {};
        this.classList = {
            classes: new Set(),
            add: (...c) => c.forEach(x => this.classList.classes.add(x)),
            remove: (...c) => c.forEach(x => this.classList.classes.delete(x)),
            contains: (c) => this.classList.classes.has(c)
        };
        this.innerHTML = '';
        this.innerText = '';
    }
    setAttribute() {}
    getAttribute() { return null; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
}

const windowMock = {
    console: {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {}
    },
    setTimeout: (fn) => typeof fn === 'function' && fn(),
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    document: {
        body: new MockElement('body'),
        createElement: (tag) => new MockElement(tag),
        getElementById: () => null,
        querySelectorAll: () => []
    },
    navigator: { userAgent: 'Node.js QA Test Runner' },
    db: {
        collection: () => ({
            onSnapshot: () => () => {},
            doc: () => ({
                get: async () => ({ exists: false, data: () => ({}) })
            })
        })
    }
};
windowMock.window = windowMock;
windowMock.document.defaultView = windowMock;

let controller = null;
try {
    const context = vm.createContext({
        ...windowMock,
        setTimeout: windowMock.setTimeout,
        clearTimeout: windowMock.clearTimeout,
        setInterval: windowMock.setInterval,
        clearInterval: windowMock.clearInterval
    });
    vm.runInContext(controllerCode, context);
    controller = context.window.EventsController || windowMock.EventsController;
    assert(controller !== null && typeof controller === 'object', "EventsController instanciado correctamente");
    assert(typeof (context.window.openLiveEvent || windowMock.openLiveEvent) === 'function', "Función global window.openLiveEvent exportada correctamente");
} catch (err) {
    assert(false, `Error ejecutando EventsController_V6.js: ${err.message}`);
}

if (!controller) {
    console.error("❌ No se pudo instanciar EventsController. Abortando pruebas.");
    process.exit(1);
}

// -----------------------------------------------------------------------------
// 3. Verificación de Hero Banner y Encabezado en Tarjeta Expandida (Entreno)
// -----------------------------------------------------------------------------
console.log("\n--- 3. Verificación de Hero Banner y Título en Vista Detallada (Entreno) ---");
const entrenoEvent = {
    id: 'entreno_qa_101',
    name: 'Entreno Táctico Avanzado M3.5',
    type: 'entreno',
    date: '2026-10-15',
    time: '19:00',
    time_end: '20:30',
    status: 'open',
    max_courts: 2,
    sede: 'SomosPadel Prat',
    price_members: '15',
    price_external: '18',
    players: [
        { uid: 'jugador_1', name: 'Laura Gómez' },
        { uid: 'jugador_2', name: 'Marc Puig' }
    ]
};

// Forzar vista expandida
controller.state.viewMode = 'expanded';
controller.state.collapsedCards = new Set();
controller.state.expandedCards = new Set(['entreno_qa_101']);
controller.state.currentUser = { uid: 'otro_usuario', name: 'Espectador' };

const renderedEntrenoHtml = controller.renderCard(entrenoEvent);

// A) Título interactivo y limpio (sin pegote redundante de 'ENTRAR ➜')
assert(
    renderedEntrenoHtml.includes(`window.EventsController.openLiveEvent('entreno_qa_101', 'entreno')`),
    "El encabezado del evento tiene llamada interactiva a openLiveEvent con el ID y tipo correcto"
);
assert(
    !renderedEntrenoHtml.includes('box-shadow: 0 0 10px rgba(204,255,0,0.25);') &&
    renderedEntrenoHtml.includes('<h3') && renderedEntrenoHtml.includes('Entreno Táctico Avanzado M3.5'),
    "El título <h3> del entreno se renderiza de forma limpia y prominente sin badge redundante pegado"
);

// B) Eliminación de duplicidad: ausencia del Hero Banner intermedio que saturaba la tarjeta
assert(
    !renderedEntrenoHtml.includes('Ver pistas, compañeros y marcador en directo'),
    "El Hero Banner gigante intermedio ha sido retirado con éxito para simplificar la tarjeta"
);
assert(
    !renderedEntrenoHtml.includes('>DIRECTO</span>'),
    "No existe el micro-badge duplicado 'DIRECTO' intermedio"
);

// C) Grid de 2 Columnas Limpio y Optimizado (Horario y Plazas)
assert(
    renderedEntrenoHtml.includes('HORARIO') && renderedEntrenoHtml.includes('19:00 - 20:30'),
    "El Grid contiene la columna de Horario limpia y bien estructurada"
);
assert(
    renderedEntrenoHtml.includes('id="event-players-label-entreno_qa_101"') &&
    renderedEntrenoHtml.includes('id="event-progress-bar-entreno_qa_101"'),
    "El Grid contiene la columna interactiva de Plazas y Ocupación con barra de progreso"
);

// -----------------------------------------------------------------------------
// 4. Verificación de Estructura Limpia en Vista Detallada (Americana / Torneo)
// -----------------------------------------------------------------------------
console.log("\n--- 4. Verificación de Estructura Limpia en Vista Detallada (Americana / Torneo) ---");
const americanaEvent = {
    id: 'americana_qa_202',
    name: 'Torneo Twister Viernes Noche',
    type: 'americana',
    date: '2026-10-16',
    time: '20:00',
    time_end: '22:30',
    status: 'open',
    max_courts: 4,
    sede: 'SomosPadel Barcelona',
    players: []
};

controller.state.expandedCards.add('americana_qa_202');
const renderedAmericanaHtml = controller.renderCard(americanaEvent);

assert(
    renderedAmericanaHtml.includes(`window.EventsController.openLiveEvent('americana_qa_202', 'americana')`),
    "En torneos el título interactivo llama a openLiveEvent con el ID y tipo 'americana'"
);
assert(
    renderedAmericanaHtml.includes('id="event-players-label-americana_qa_202"'),
    "En torneos el Grid contiene el indicador interactivo de plazas y aforo"
);

// -----------------------------------------------------------------------------
// 5. Verificación de Botón Prioritario cuando el Jugador está Inscrito (isJoined === true)
// -----------------------------------------------------------------------------
console.log("\n--- 5. Verificación de Botones cuando el usuario está Inscrito (isJoined === true) ---");
const currentUserUid = 'user_inscrito_qa';
controller.state.currentUser = { uid: currentUserUid, name: 'Alex Coscolin' };

const entrenoInscrito = {
    ...entrenoEvent,
    id: 'entreno_inscrito_303',
    players: [
        { uid: currentUserUid, name: 'Alex Coscolin' },
        { uid: 'otro_jugador', name: 'Compañero' }
    ]
};

controller.state.expandedCards.add('entreno_inscrito_303');
const renderedInscritoEntrenoHtml = controller.renderCard(entrenoInscrito);

assert(
    renderedInscritoEntrenoHtml.includes('ENTRAR AL ENTRENO'),
    "Cuando el jugador está inscrito en un entreno, se genera el botón principal prioritario 'ENTRAR AL ENTRENO'"
);
assert(
    renderedInscritoEntrenoHtml.includes(`window.EventsController.openLiveEvent('entreno_inscrito_303', 'entreno')`),
    "El botón principal 'ENTRAR AL ENTRENO' ejecuta la llamada a openLiveEvent('entreno_inscrito_303', 'entreno')"
);
assert(
    renderedInscritoEntrenoHtml.includes(`id="event-fab-entreno_inscrito_303"`),
    "Existe el botón secundario FAB para gestión de estado (id='event-fab-entreno_inscrito_303')"
);
assert(
    renderedInscritoEntrenoHtml.includes('INSCRITO') && renderedInscritoEntrenoHtml.includes('fa-check-circle'),
    "El botón secundario muestra el estado 'INSCRITO' con icono de check"
);
assert(
    renderedInscritoEntrenoHtml.includes(`leaveEvent('entreno_inscrito_303'`),
    "El botón secundario de estado permite darse de baja mediante leaveEvent"
);

// Comprobar también para Americana con isJoined === true
const americanaInscrito = {
    ...americanaEvent,
    id: 'americana_inscrito_404',
    players: [
        { uid: currentUserUid, name: 'Alex Coscolin' }
    ]
};
controller.state.expandedCards.add('americana_inscrito_404');
const renderedInscritoAmericanaHtml = controller.renderCard(americanaInscrito);

assert(
    renderedInscritoAmericanaHtml.includes('ENTRAR AL TORNEO'),
    "Cuando el jugador está inscrito en un torneo, el botón prioritario muestra 'ENTRAR AL TORNEO'"
);
assert(
    renderedInscritoAmericanaHtml.includes(`window.EventsController.openLiveEvent('americana_inscrito_404', 'americana')`),
    "El botón 'ENTRAR AL TORNEO' ejecuta openLiveEvent('americana_inscrito_404', 'americana')"
);
assert(
    renderedInscritoAmericanaHtml.includes(`id="event-fab-americana_inscrito_404"`),
    "Existe el botón secundario de gestión para la americana inscrita"
);

// -----------------------------------------------------------------------------
// 6. Verificación de Vista Minimizada / Compacta (Compact View)
// -----------------------------------------------------------------------------
console.log("\n--- 6. Verificación de Vista Minimizada / Compacta ---");
// Configurar modo compacto
controller.state.viewMode = 'compact';
controller.state.expandedCards = new Set(); // Ninguna expandida
controller.state.collapsedCards = new Set();

const renderedMinEntrenoHtml = controller.renderCard(entrenoEvent);

assert(
    renderedMinEntrenoHtml.includes('card-view-minimized'),
    "La tarjeta en modo compacto tiene la clase 'card-view-minimized'"
);
assert(
    !renderedMinEntrenoHtml.includes('btn-neon-enter-pulse') && !renderedMinEntrenoHtml.includes('>ENTRAR</span>'),
    "La vista compacta/minimizada NO incluye el botón ENTRAR para evitar confusión y saturación visual"
);
assert(
    renderedMinEntrenoHtml.includes(`id="event-fab-entreno_qa_101"`),
    "La vista compacta mantiene accesible el botón FAB de estado de inscripción"
);
assert(
    renderedMinEntrenoHtml.includes('toggleCardExpansion'),
    "La vista compacta permite ampliar detalles mediante toggleCardExpansion"
);

// Verificación de que en vista ampliada SÍ sale el botón ENTRAR tanto en entrenos como en americanas (incluso sin estar inscrito)
console.log("\n--- 6.1. Verificación de Botón ENTRAR en Vista Ampliada (No Inscrito) ---");
controller.state.viewMode = 'expanded';
controller.state.expandedCards = new Set(['entreno_qa_101', 'americana_qa_202']);
controller.state.currentUser = { uid: 'user_espectador', name: 'Espectador' };

const renderedExpandedEntreno = controller.renderCard(entrenoEvent);
assert(
    renderedExpandedEntreno.includes('ENTRAR AL ENTRENO') && renderedExpandedEntreno.includes(`window.EventsController.openLiveEvent('entreno_qa_101', 'entreno')`),
    "En vista ampliada (entreno no inscrito), SÍ sale el botón 'ENTRAR AL ENTRENO'"
);
assert(
    renderedExpandedEntreno.includes('btn-blue-enter-pulse') || renderedExpandedEntreno.includes('btn-neon-enter-pulse'),
    "El botón 'ENTRAR AL ENTRENO' en vista ampliada tiene el estilo de pulso 'btn-blue-enter-pulse'"
);
assert(
    renderedExpandedEntreno.includes('#38bdf8') || renderedExpandedEntreno.includes('#0284c7'),
    "El botón 'ENTRAR AL ENTRENO' tiene color Azul Eléctrico Pista para no confundirse con APUNTARME"
);

const renderedExpandedAmericana = controller.renderCard(americanaEvent);
assert(
    renderedExpandedAmericana.includes('ENTRAR AL TORNEO') && renderedExpandedAmericana.includes(`window.EventsController.openLiveEvent('americana_qa_202', 'americana')`),
    "En vista ampliada (americana no inscrita), SÍ sale el botón 'ENTRAR AL TORNEO'"
);

// -----------------------------------------------------------------------------
// 7. Resumen Final
// -----------------------------------------------------------------------------
console.log("\n========================================================================");
console.log(`📊 RESULTADO QA: ${passCount} pruebas pasadas, ${failCount} fallidas.`);
console.log("========================================================================\n");

if (failCount === 0) {
    console.log("🎉 CERTIFICACIÓN QA EXITOSA: Todos los criterios de visibilidad de entrada a entrenos/torneos están validados.\n");
    process.exit(0);
} else {
    console.error(`❌ CERTIFICACIÓN QA FALLIDA: Se encontraron ${failCount} errores.\n`);
    process.exit(1);
}
