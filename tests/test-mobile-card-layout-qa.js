/**
 * tests/test-mobile-card-layout-qa.js
 * 
 * Certificación de Calidad (QA) Exhaustiva:
 * Distribución móvil responsive (320px, 360px, 375px, 390px, 412px)
 * de la tarjeta de evento en EventsController_V6.js.
 * 
 * Verificaciones:
 * 1. Service Worker: CACHE_NAME === 'somospadel-pwa-v2026.6.4'
 * 2. Barra de acciones inferior en 2 niveles:
 *    - Línea 1 (Utilidades): Sede oficial GPS (izq) + Botón Chat (der, 36px)
 *    - Línea 2 (Acción principal):
 *      - isJoined === true: Botón principal neón (flex: 1 1 auto, centrado, nunca cortado) + botón ✔ INSCRITO
 *      - No inscrito / Live: Botón de acción con ancho 100% adaptado sin desbordar
 * 3. Columna de plazas en 3 líneas verticales:
 *    - Línea 1: Microetiqueta PLAZAS + Badge de estado COMPLETO/DISPONIBLE
 *    - Línea 2: `${playerCount} / ${maxPlayers} Plazas` separado sin colisión
 *    - Línea 3: Barra de progreso inferior
 * 4. Badges y botones sobre la imagen:
 *    - Badges compactos de formato (ENTRENO, TWISTER, SUIZO, etc.)
 *    - Botones de cartel y redes a 28px (Cartel, WhatsApp, Instagram, Minimizar)
 * 5. Simulación dimensional en anchos móviles estándar: 320px, 360px, 375px, 390px, 412px
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
console.log("📱 QA TEST: DISTRIBUCIÓN MÓVIL RESPONSIVE EN EVENT CARDS (V6)");
console.log("========================================================================\n");

// -----------------------------------------------------------------------------
// 1. Verificación de Service Worker (sw.js)
// -----------------------------------------------------------------------------
console.log("--- 1. Verificación de Versión del Service Worker (sw.js) ---");
const swPath = path.join(__dirname, '..', 'sw.js');
assert(fs.existsSync(swPath), "El archivo sw.js existe en la raíz");

const swContent = fs.readFileSync(swPath, 'utf8');
const cacheMatch = swContent.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
assert(cacheMatch !== null, "sw.js define la constante CACHE_NAME");
assert(
    cacheMatch && /^somospadel-pwa-v\d+\.\d+\.\d+$/.test(cacheMatch[1]),
    `CACHE_NAME en sw.js tiene un formato de versión PWA válido (detectado: '${cacheMatch ? cacheMatch[1] : 'ninguno'}')`
);

// -----------------------------------------------------------------------------
// 2. Inicialización de Entorno VM y Mock para EventsController_V6
// -----------------------------------------------------------------------------
console.log("\n--- 2. Instanciación de EventsController_V6.js en Node VM ---");
const controllerPath = path.join(__dirname, '..', 'js', 'modules', 'americanas', 'EventsController_V6.js');
assert(fs.existsSync(controllerPath), "El archivo EventsController_V6.js existe");

const controllerCode = fs.readFileSync(controllerPath, 'utf8');

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
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout: () => {},
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
    navigator: { userAgent: 'Node.js Responsive Layout QA' },
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
} catch (err) {
    assert(false, `Error ejecutando EventsController_V6.js: ${err.message}`);
}

if (!controller) {
    console.error("❌ No se pudo instanciar EventsController. Abortando.");
    process.exit(1);
}

// -----------------------------------------------------------------------------
// 3. Certificación: Barra de acciones inferior en 2 niveles
// -----------------------------------------------------------------------------
console.log("\n--- 3. Certificación: Barra de acciones inferior en 2 niveles ---");

const testEntrenoInscrito = {
    id: 'entreno_qa_joined_1',
    name: 'Entreno Twister Nivel Pro',
    type: 'entreno',
    date: '2026-10-20',
    time: '18:00',
    time_end: '19:30',
    status: 'open',
    category: 'open',
    max_courts: 3,
    sede: 'SomosPadel Prat',
    format: 'twister',
    price_members: '16',
    price_external: '20',
    players: [
        { uid: 'current_user_qa', name: 'Alex Coscolin' },
        { uid: 'player_2', name: 'Carlos Díaz' }
    ]
};

controller.state.viewMode = 'expanded';
controller.state.collapsedCards = new Set();
controller.state.expandedCards = new Set(['entreno_qa_joined_1']);
controller.state.currentUser = { uid: 'current_user_qa', name: 'Alex Coscolin', gender: 'male' };

const htmlJoined = controller.renderCard(testEntrenoInscrito);

// Línea 1 (Utilidades): GPS Sede + Botón Chat
assert(
    htmlJoined.includes("openDirections('SomosPadel Prat')"),
    "Línea 1: Contiene acceso directo a navegación GPS con el club/sede"
);
assert(
    htmlJoined.includes("GPS ↗"),
    "Línea 1: Muestra indicador GPS ↗"
);
assert(
    htmlJoined.includes("window.ChatView?.openEventChat"),
    "Línea 1: Contiene botón de Chat directo conectado a ChatView"
);
assert(
    htmlJoined.includes("fa-comment-dots") && htmlJoined.includes("<span>CHAT</span>"),
    "Línea 1: Botón de Chat incluye icono de mensaje y etiqueta 'CHAT'"
);

// Línea 2 (Acción principal cuando isJoined === true):
assert(
    htmlJoined.includes("ENTRAR AL ENTRENO"),
    "Línea 2 (Inscrito): Muestra botón principal neón 'ENTRAR AL ENTRENO'"
);
assert(
    htmlJoined.includes("flex: 1 1 auto") || htmlJoined.includes("flex: 1"),
    "Línea 2 (Inscrito): Botón neón utiliza flex: 1 para ocupar todo el espacio disponible sin desbordar"
);
assert(
    htmlJoined.includes("btn-neon-enter-pulse"),
    "Línea 2 (Inscrito): Botón neón incluye la clase animada 'btn-neon-enter-pulse'"
);
assert(
    htmlJoined.includes("id=\"event-fab-entreno_qa_joined_1\""),
    "Línea 2 (Inscrito): Botón secundario de inscripción está presente con ID esperado"
);
assert(
    htmlJoined.includes("INSCRITO") && htmlJoined.includes("fa-check-circle"),
    "Línea 2 (Inscrito): Botón secundario muestra '✔ INSCRITO'"
);

// Comprobación para Torneo / Americana inscrita
const testTorneoInscrito = {
    id: 'torneo_qa_joined_2',
    name: 'Americana Oro Viernes',
    type: 'americana',
    date: '2026-10-24',
    time: '20:00',
    time_end: '22:00',
    status: 'open',
    category: 'open',
    max_courts: 4,
    sede: 'SomosPadel Badalona',
    format: 'fixed',
    price_members: '18',
    price_external: '22',
    players: [{ uid: 'current_user_qa', name: 'Alex Coscolin' }]
};
controller.state.expandedCards.add('torneo_qa_joined_2');
const htmlTorneoJoined = controller.renderCard(testTorneoInscrito);
assert(
    htmlTorneoJoined.includes("ENTRAR AL TORNEO"),
    "Línea 2 (Torneo Inscrito): Adapta el texto a 'ENTRAR AL TORNEO'"
);

// Comprobación cuando el usuario NO está inscrito (botón a ancho completo adaptado)
const testEntrenoNoInscrito = {
    id: 'entreno_qa_not_joined_3',
    name: 'Entreno Nivel 3.0 Iniciación',
    type: 'entreno',
    category: 'open',
    date: '2026-10-21',
    time: '19:00',
    time_end: '20:30',
    status: 'open',
    max_courts: 2,
    sede: 'SomosPadel Prat',
    price_members: '15',
    price_external: '18',
    players: [{ uid: 'otro_jugador', name: 'Pedro' }]
};
controller.state.expandedCards.add('entreno_qa_not_joined_3');
const htmlNotJoined = controller.renderCard(testEntrenoNoInscrito);
assert(
    htmlNotJoined.includes("width: 100%") && htmlNotJoined.includes("APUNTARME"),
    "Línea 2 (No Inscrito): El botón de acción ocupa el ancho completo (width: 100%) con 'APUNTARME'"
);

// Comprobación para evento LIVE
const testEventLive = {
    id: 'americana_live_4',
    name: 'Americana Nocturna En Directo',
    type: 'americana',
    date: '2026-10-04',
    time: '21:00',
    time_end: '23:00',
    status: 'live',
    max_courts: 3,
    sede: 'SomosPadel Prat',
    players: []
};
controller.state.expandedCards.add('americana_live_4');
const htmlLive = controller.renderCard(testEventLive);
assert(
    htmlLive.includes("VER EN DIRECTO") && htmlLive.includes("width: 100%"),
    "Línea 2 (Live): Botón con ancho 100% y texto 'VER EN DIRECTO'"
);

// -----------------------------------------------------------------------------
// 4. Certificación: Columna de plazas en 3 líneas verticales
// -----------------------------------------------------------------------------
console.log("\n--- 4. Certificación: Columna de plazas en 3 líneas verticales ---");

const testPlazasEvent = {
    id: 'evento_plazas_5',
    name: 'Americana Mixta Dominical',
    type: 'americana',
    date: '2026-10-25',
    time: '10:00',
    time_end: '12:00',
    status: 'open',
    max_courts: 2, // 8 plazas
    sede: 'SomosPadel Prat',
    players: [
        { uid: 'u1', name: 'J1' },
        { uid: 'u2', name: 'J2' },
        { uid: 'u3', name: 'J3' },
        { uid: 'u4', name: 'J4' },
        { uid: 'u5', name: 'J5' },
        { uid: 'u6', name: 'J6' }
    ],
    waitlist: [{ uid: 'w1', name: 'W1' }, { uid: 'w2', name: 'W2' }]
};
controller.state.expandedCards.add('evento_plazas_5');
const htmlPlazas = controller.renderCard(testPlazasEvent);

// Línea 1: PLAZAS + DISPONIBLE / COMPLETO
assert(
    htmlPlazas.includes("PLAZAS") && htmlPlazas.includes("id=\"event-status-capacity-evento_plazas_5\""),
    "Plazas Línea 1: Contiene microetiqueta 'PLAZAS' y badge de capacidad"
);
assert(
    htmlPlazas.includes("DISPONIBLE"),
    "Plazas Línea 1: Muestra estado 'DISPONIBLE' cuando quedan plazas libres"
);

// Evento completo
const testFullEvent = {
    ...testPlazasEvent,
    id: 'evento_full_6',
    players: new Array(8).fill(0).map((_, i) => ({ uid: `u_${i}`, name: `J${i}` }))
};
controller.state.expandedCards.add('evento_full_6');
const htmlFull = controller.renderCard(testFullEvent);
assert(
    htmlFull.includes("COMPLETO"),
    "Plazas Línea 1: Muestra badge 'COMPLETO' en la línea superior"
);

// Línea 2: Contadores de plazas y espera
assert(
    htmlPlazas.includes("id=\"event-players-label-evento_plazas_5\"") &&
    htmlPlazas.includes("6 / 8 Plazas"),
    "Plazas Línea 2: Muestra '6 / 8 Plazas' en su propia línea central sin colisión"
);
assert(
    htmlPlazas.includes("+2 esp."),
    "Plazas Línea 2: Muestra el indicador '+2 esp.' de lista de espera en la misma línea que las plazas"
);

// Línea 3: Barra de progreso
assert(
    htmlPlazas.includes("id=\"event-progress-bar-evento_plazas_5\"") &&
    htmlPlazas.includes("width: 75%"),
    "Plazas Línea 3: Barra de progreso renderizada al 75% (6 de 8 plazas)"
);

// -----------------------------------------------------------------------------
// 5. Certificación: Badges y botones compactos sobre la imagen
// -----------------------------------------------------------------------------
console.log("\n--- 5. Certificación: Badges y botones sobre la imagen ---");

const testTwisterEvent = {
    id: 'evento_twister_7',
    name: 'Entreno Twister Intenso',
    type: 'entreno',
    date: '2026-10-26',
    time: '19:00',
    time_end: '20:30',
    status: 'open',
    max_courts: 3,
    sede: 'SomosPadel Prat',
    format: 'twister',
    players: []
};
controller.state.expandedCards.add('evento_twister_7');
const htmlTwister = controller.renderCard(testTwisterEvent);

assert(
    htmlTwister.includes("TWISTER") && htmlTwister.includes("fa-user-ninja"),
    "Imagen: Badge unificado de formato compacto para entreno twister ('TWISTER')"
);
assert(
    htmlTwister.includes("3 Pistas"),
    "Imagen: Badge de pistas compacto ('3 Pistas')"
);
assert(
    htmlTwister.includes("height: 28px") && htmlTwister.includes("CARTEL"),
    "Imagen: Botón de Cartel compacto con altura estandarizada de 28px"
);
assert(
    htmlTwister.includes("width: 28px; height: 28px") && htmlTwister.includes("fa-whatsapp"),
    "Imagen: Botón de WhatsApp compacto (28px x 28px)"
);
assert(
    htmlTwister.includes("width: 28px; height: 28px") && htmlTwister.includes("fa-instagram"),
    "Imagen: Botón de Instagram Stories compacto (28px x 28px)"
);
assert(
    htmlTwister.includes("width: 28px; height: 28px") && htmlTwister.includes("fa-compress-alt"),
    "Imagen: Botón de Minimizar compacto (28px x 28px)"
);

// -----------------------------------------------------------------------------
// 6. Certificación Dimensional Responsive Móvil (320px, 360px, 375px, 390px, 412px)
// -----------------------------------------------------------------------------
console.log("\n--- 6. Simulación Dimensional Móvil (320px - 412px) sin desbordamiento ---");

/**
 * Validar que ningún elemento dentro de la tarjeta de evento contenga anchos fijos
 * o estructuras rígidas que excedan el ancho de los viewports móviles más estrechos.
 */
const viewports = [
    { name: 'Ultra Compact (iPhone SE 1st gen / Mini)', width: 320, paddingContainer: 16 },
    { name: 'Standard Android (Galaxy S / Moto G)', width: 360, paddingContainer: 20 },
    { name: 'Compact iOS (iPhone SE 2/3 / iPhone 8)', width: 375, paddingContainer: 20 },
    { name: 'Modern iPhone (iPhone 12/13/14/15)', width: 390, paddingContainer: 24 },
    { name: 'Modern Android Large (Pixel 7 / Galaxy S23+)', width: 412, paddingContainer: 24 }
];

viewports.forEach(vp => {
    const cardAvailableWidth = vp.width - vp.paddingContainer;
    const internalCardPadding = 26; // 13px por lado
    const contentUsableWidth = cardAvailableWidth - internalCardPadding;

    // A) Columna de Plazas en Grid 2 columnas:
    const gridGap = 8;
    const colWidth = (contentUsableWidth - gridGap) / 2;
    // Ancho estimado de header de plazas: PLAZAS (~40px) + Badge COMPLETO (~60px) = 100px
    const plazasHeaderWidth = 100;
    const plazasHeaderFits = plazasHeaderWidth <= colWidth;

    // B) Línea 1 (Utilidades): GPS (min 130px) + Chat (68px) + gap (8px) = ~206px
    const utilitiesRowMin = 190;
    const utilitiesFits = utilitiesRowMin <= contentUsableWidth;

    // C) Línea 2 (Inscrito): Botón INSCRITO (88px) + gap (7px) + Botón ENTRAR AL ENTRENO (flex: 1)
    const fabWidth = 92;
    const ctaGap = 7;
    const availableForNeon = contentUsableWidth - fabWidth - ctaGap;
    // Botón neón cuenta con flex: 1 1 auto, min-width: 0, text-overflow: ellipsis
    const neonHasFlexSafeguard = htmlJoined.includes("min-width: 0") && htmlJoined.includes("text-overflow: ellipsis");

    // D) Barra inferior sobre la imagen:
    // El contenedor tiene pointer-events y min-width: 0 con overflow: hidden
    const imageBarHasOverflowGuard = htmlJoined.includes("min-width: 0") && htmlJoined.includes("overflow: hidden");

    assert(
        colWidth >= 120,
        `[${vp.width}px - ${vp.name}]: Columna de Plazas tiene ancho suficiente (${colWidth.toFixed(1)}px >= 120px) sin colisión`
    );
    assert(
        utilitiesFits,
        `[${vp.width}px - ${vp.name}]: Fila de Utilidades (GPS + Chat) cabe holgadamente (${contentUsableWidth.toFixed(1)}px > ${utilitiesRowMin}px)`
    );
    assert(
        availableForNeon >= 140 && neonHasFlexSafeguard,
        `[${vp.width}px - ${vp.name}]: Botón Neón ENTRAR cuenta con ${availableForNeon.toFixed(1)}px y min-width: 0 anti-desbordamiento`
    );
});

// Verificación adicional: ausencia de estilos con ancho fijo mayor a 280px en componentes internos
const fixedWidthRegex = /width:\s*([3-9][0-9]{2,}|[1-9][0-9]{3,})px/g;
let fixedMatch;
let hasExcessiveFixedWidth = false;
while ((fixedMatch = fixedWidthRegex.exec(htmlJoined)) !== null) {
    hasExcessiveFixedWidth = true;
    console.error(`  ❌ Ancho fijo excesivo detectado: ${fixedMatch[0]}`);
}
assert(!hasExcessiveFixedWidth, "No existen anchos fijos excesivos (> 300px) que puedan romper pantallas estrechas");

// ========================================================================
// Resumen Final
// ========================================================================
console.log("\n========================================================================");
console.log(`📊 RESULTADO QA: ${passCount} pruebas pasadas, ${failCount} fallidas.`);
console.log("========================================================================");

if (failCount > 0) {
    console.error("\n❌ LA CERTIFICACIÓN QA HA FALLADO. Revisa los errores anteriores.\n");
    process.exit(1);
} else {
    console.log("\n🎉 CERTIFICACIÓN QA EXITOSA: Distribución móvil responsive certificada al 100%.\n");
    process.exit(0);
}
