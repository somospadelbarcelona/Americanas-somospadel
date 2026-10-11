/**
 * test-control-tower-standings-qa.js
 * Suite de Certificación QA para ControlTowerStandings.js
 * 
 * Verificaciones:
 * 1. Sintaxis e integridad de ControlTowerStandings.js.
 * 2. Carga y disponibilidad de StandingsService y ControlTowerStandings en el entorno global.
 * 3. Renderizado con datos reales de partidos:
 *    - Fondo blanco #ffffff en la tarjeta del podio (.sp-podium-card).
 *    - Ausencia total de estilos oscuros obsoletos (#0d1829).
 *    - Medallas 1º, 2º y 3º y pills de puntuación claras (gold, silver, bronze).
 *    - Columnas técnicas completas en la tabla: PJ, PG, DIF, PTS, % EFIC, etc.
 *    - Barra superior con navegación y botones (Normas, Puntos ranking, Compartir).
 * 4. Verificación de variantes de evento:
 *    - Torneo Estándar / Americana
 *    - Entreno (con badge de pista y normas de entreno)
 *    - Torneo Suizo (con normas y títulos suizos)
 *    - Sin partidos finalizados (empty state seguro)
 * 5. Ejecución y no-rotura de todos los métodos públicos:
 *    - shareStandings (navigator.share y fallback clipboard)
 *    - toggleRulesBanner (expansión y colapso)
 *    - toggleRulesModal (apertura y cierre)
 *    - setViewMode / setTableViewMode ('quick' y 'full')
 *    - openPlayerCard / showPlayerDetailModal
 *    - closePlayerCard / hidePlayerDetailModal
 *    - filterTable
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('🎾 ========================================================');
console.log('   SUITE DE CERTIFICACIÓN QA: ControlTowerStandings.js');
console.log('========================================================\n');

// 1. Configuración del entorno simulado de navegador (DOM + globals)
const elements = new Map();

function createMockElement(id, tag = 'div') {
    const el = {
        id,
        tagName: tag.toUpperCase(),
        style: { display: '', overflow: '' },
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
        },
        children: [],
        innerHTML: '',
        textContent: '',
        querySelector(sel) {
            if (sel === 'span') return { textContent: '' };
            return null;
        },
        querySelectorAll(sel) {
            return [];
        },
        getAttribute(attr) { return ''; },
        setAttribute(attr, val) {}
    };
    elements.set(id, el);
    return el;
}

const mockDocument = {
    body: { style: { overflow: '' } },
    getElementById: (id) => {
        if (!elements.has(id)) {
            elements.set(id, createMockElement(id));
        }
        return elements.get(id);
    },
    querySelectorAll: (sel) => {
        return [];
    }
};

let clipboardText = '';
let shareCalledWith = null;

const mockWindow = {
    document: mockDocument,
    navigator: {
        share: async (data) => {
            shareCalledWith = data;
            return true;
        },
        clipboard: {
            writeText: async (txt) => {
                clipboardText = txt;
                return true;
            }
        }
    },
    getComputedStyle: (el) => el.style || {},
    alert: (msg) => console.log('  [Alert Mock]:', msg),
    ControlTowerView: {
        switchTab: (tab) => console.log('  [ControlTowerView.switchTab]:', tab),
        currentAmericanaDoc: { id: 'evt-test-123', name: 'Americana Nivel 3.5' }
    }
};
mockWindow.window = mockWindow;

const context = vm.createContext({
    window: mockWindow,
    global: mockWindow,
    document: mockDocument,
    navigator: mockWindow.navigator,
    alert: mockWindow.alert,
    console: console,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Array: Array,
    Object: Object,
    String: String,
    Date: Date,
    Set: Set,
    Map: Map,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
});

// 2. Cargar StandingsService en el contexto
const standingsServicePath = path.join(__dirname, '../js/modules/common/StandingsService.js');
const standingsServiceCode = fs.readFileSync(standingsServicePath, 'utf8');
vm.runInContext(standingsServiceCode, context);
assert(mockWindow.StandingsService, 'StandingsService debe estar expuesto en window');
console.log('✅ StandingsService cargado correctamente en el entorno de pruebas.');

// 3. Cargar ControlTowerStandings en el contexto
const standingsModulePath = path.join(__dirname, '../js/modules/americanas/ControlTowerStandings.js');
const standingsModuleCode = fs.readFileSync(standingsModulePath, 'utf8');
vm.runInContext(standingsModuleCode, context);
assert(mockWindow.ControlTowerStandings, 'ControlTowerStandings debe estar expuesto en window');
console.log('✅ ControlTowerStandings cargado correctamente en el entorno de pruebas.');

const ControlTowerStandings = mockWindow.ControlTowerStandings;

// 4. Datos de prueba realistas
const mockPlayers = [
    { id: 'p1', uid: 'p1', name: 'Alex Coscolin', level: 4.2 },
    { id: 'p2', uid: 'p2', name: 'Marc Torrecillas', level: 4.0 },
    { id: 'p3', uid: 'p3', name: 'Carlos Gomez', level: 3.8 },
    { id: 'p4', uid: 'p4', name: 'David Martinez', level: 3.5 },
    { id: 'p5', uid: 'p5', name: 'Laura Sole', level: 3.2 },
    { id: 'p6', uid: 'p6', name: 'Elena Vidal', level: 3.0 }
];

const mockMatches = [
    {
        round: 1,
        court: 1,
        status: 'finished',
        team_a_names: ['Alex Coscolin', 'Marc Torrecillas'],
        team_b_names: ['Carlos Gomez', 'David Martinez'],
        score_a: 6,
        score_b: 2
    },
    {
        round: 1,
        court: 2,
        status: 'finished',
        team_a_names: ['Laura Sole', 'Elena Vidal'],
        team_b_names: ['Laura Sole', 'Elena Vidal'], // match 2
        score_a: 5,
        score_b: 4
    },
    {
        round: 2,
        court: 1,
        status: 'finished',
        team_a_names: ['Alex Coscolin', 'Carlos Gomez'],
        team_b_names: ['Marc Torrecillas', 'David Martinez'],
        score_a: 6,
        score_b: 3
    },
    {
        round: 3,
        court: 1,
        status: 'finished',
        team_a_names: ['Alex Coscolin', 'David Martinez'],
        team_b_names: ['Marc Torrecillas', 'Carlos Gomez'],
        score_a: 4,
        score_b: 5
    }
];

const mockEventDoc = {
    id: 'evt-qa-001',
    name: 'Torneo Americano SomosPadel BCN',
    date: '11/10/2026',
    players: mockPlayers,
    isEntreno: false,
    pair_mode: 'individual'
};

// ==========================================================
// TEST 1: Comprobación de Estilos Claros y Ausencia de Oscuros
// ==========================================================
console.log('\n--- TEST 1: Estilos Claros y Ausencia de Estilos Oscuros ---');
const renderedHtml = ControlTowerStandings.render(mockMatches, mockEventDoc);

// Verificar ausencia de #0d1829
assert.strictEqual(
    renderedHtml.includes('#0d1829'),
    false,
    'El marcado generado NO debe contener el color oscuro obsoleto #0d1829'
);
console.log('✅ Verificado: Sin rastro del color oscuro `#0d1829`.');

// Verificar fondo blanco en el podio
assert(
    renderedHtml.includes('.sp-podium-card {') && renderedHtml.includes('background: #ffffff;'),
    'La tarjeta del podio debe tener fondo blanco #ffffff en sus estilos'
);
assert(
    renderedHtml.includes('class="sp-podium-card"'),
    'El marcado debe renderizar el contenedor .sp-podium-card'
);
console.log('✅ Verificado: La tarjeta del podio posee fondo blanco `#ffffff`.');

// ==========================================================
// TEST 2: Podio de Honor, Medallas 1º, 2º y 3º y Pills de Puntuación
// ==========================================================
console.log('\n--- TEST 2: Podio de Honor y Medallas 1º, 2º y 3º ---');

// Comprobar estructura de columnas del podio
assert(renderedHtml.includes('sp-podium-col gold'), 'Debe contener la columna de oro para el 1º puesto');
assert(renderedHtml.includes('sp-podium-col silver'), 'Debe contener la columna de plata para el 2º puesto');
assert(renderedHtml.includes('sp-podium-col bronze'), 'Debe contener la columna de bronce para el 3º puesto');

// Comprobar medallas numéricas y corona
assert(renderedHtml.includes('sp-podium-crown') && renderedHtml.includes('👑'), 'El 1º puesto debe tener la corona');
assert(renderedHtml.includes('<div class="sp-podium-badge-medal">1</div>'), 'El 1º puesto debe tener la medalla 1');
assert(renderedHtml.includes('<div class="sp-podium-badge-medal">2</div>'), 'El 2º puesto debe tener la medalla 2');
assert(renderedHtml.includes('<div class="sp-podium-badge-medal">3</div>'), 'El 3º puesto debe tener la medalla 3');

// Comprobar pills de puntuación
assert(renderedHtml.includes('sp-podium-score-pill'), 'Debe contener pills de puntuación');
assert(
    renderedHtml.includes('pts •') && renderedHtml.includes('V</div>'),
    'Las pills del podio deben mostrar el formato "X pts • YV"'
);

// Comprobar estilos de las pills en CSS
assert(renderedHtml.includes('.sp-podium-col.gold .sp-podium-score-pill {'), 'Debe contener estilos para pill oro');
assert(renderedHtml.includes('background: #fef08a;'), 'Pill oro debe tener fondo claro #fef08a');
assert(renderedHtml.includes('.sp-podium-col.silver .sp-podium-score-pill {'), 'Debe contener estilos para pill plata');
assert(renderedHtml.includes('background: #f1f5f9;'), 'Pill plata debe tener fondo claro #f1f5f9');
assert(renderedHtml.includes('.sp-podium-col.bronze .sp-podium-score-pill {'), 'Debe contener estilos para pill bronce');
assert(renderedHtml.includes('background: #ffedd5;'), 'Pill bronce debe tener fondo claro #ffedd5');

console.log('✅ Verificado: Medallas 1º, 2º y 3º y pills con gradientes y tonos claros conformes.');

// ==========================================================
// TEST 3: Tabla de Clasificación Técnica (Columnas y Semántica)
// ==========================================================
console.log('\n--- TEST 3: Tabla Técnica de Posiciones ---');

const expectedColumns = ['#', 'JUGADOR', 'PJ', 'PG', 'PP', 'JF', 'JC', 'DIF', 'PTS', '% EFIC'];
expectedColumns.forEach(col => {
    assert(
        renderedHtml.includes(`>${col}</th>`) || renderedHtml.includes(`>${col} </th>`),
        `La cabecera de la tabla debe contener la columna ${col}`
    );
});
console.log('✅ Verificado: Todas las columnas requeridas (PJ, PG, DIF, PTS, % EFIC, etc.) están presentes.');

// Comprobar clases semánticas
assert(renderedHtml.includes('class="sp-col-pos"'), 'Debe incluir clase sp-col-pos');
assert(renderedHtml.includes('class="sp-col-player"'), 'Debe incluir clase sp-col-player');
assert(renderedHtml.includes('class="sp-col-pts"'), 'Debe incluir clase sp-col-pts');
assert(renderedHtml.includes('class="sp-col-efic"'), 'Debe incluir clase sp-col-efic');
assert(renderedHtml.includes('sp-efic-bar-wrap'), 'Debe incluir la barra visual de efectividad');
assert(renderedHtml.includes('sp-player-row'), 'Debe incluir filas clicables sp-player-row');

console.log('✅ Verificado: Clases semánticas y componentes visuales de la tabla correctos.');

// ==========================================================
// TEST 4: Barra Superior y Botones de Acción
// ==========================================================
console.log('\n--- TEST 4: Barra Superior y Botones ---');

assert(renderedHtml.includes('sp-standings-top-bar'), 'Debe contener la barra superior');
assert(renderedHtml.includes('sp-btn-nav-back') && renderedHtml.includes('VER RESULTADOS'), 'Botón Volver / Ver Resultados');
assert(renderedHtml.includes('sp-btn-rules') && renderedHtml.includes('REGLAS OFICIALES'), 'Botón Reglas Oficiales');
assert(renderedHtml.includes('sp-btn-points') && renderedHtml.includes('PUNTOS RANKING'), 'Botón Puntos Ranking');
assert(renderedHtml.includes('sp-btn-share-ranking') && renderedHtml.includes('COMPARTIR'), 'Botón Compartir Ranking');

console.log('✅ Verificado: Barra superior y botones de acción renderizados adecuadamente.');

// ==========================================================
// TEST 5: Modalidades Especiales (Entreno y Suizo)
// ==========================================================
console.log('\n--- TEST 5: Variantes Entreno y Suizo ---');

// 5.1 Entreno
const entrenoDoc = { ...mockEventDoc, isEntreno: true, name: 'Entreno Nivel 4.0' };
const entrenoHtml = ControlTowerStandings.render(mockMatches, entrenoDoc);
assert(entrenoHtml.includes('NORMAS DEL ENTRENO'), 'Debe indicar NORMAS DEL ENTRENO en el botón');
assert(entrenoHtml.includes('Objetivo del Entreno'), 'Debe describir el objetivo formativo del entreno');
assert(entrenoHtml.includes('Disputar la Victoria (Pista 1)'), 'Debe incluir norma de Pista 1');
console.log('✅ Verificado: Modo Entreno genera reglas y nomenclaturas correspondientes.');

// 5.2 Suizo
const swissDoc = { ...mockEventDoc, pair_mode: 'swiss', name: 'Torneo Suizo Express' };
const swissHtml = ControlTowerStandings.render(mockMatches, swissDoc);
assert(swissHtml.includes('SISTEMA SUIZO EXPRESS (6 RONDAS)'), 'Debe titular Sistema Suizo Express');
assert(swissHtml.includes('Reagrupación Suiza'), 'Debe incluir regla de Reagrupación Suiza');
console.log('✅ Verificado: Modo Suizo genera reglas de cruces suizos correspondientes.');

// 5.3 Sin partidos ni jugadores (Estado Vacío Seguro)
const emptyDoc = { ...mockEventDoc, players: [] };
const emptyHtml = ControlTowerStandings.render([], emptyDoc);
assert(emptyHtml.includes('Aún no se han disputado partidos en este evento'), 'Debe mostrar mensaje de estado vacío seguro');
console.log('✅ Verificado: Estado vacío renderiza sin errores.');

// ==========================================================
// TEST 6: API Pública y Métodos Estáticos
// ==========================================================
console.log('\n--- TEST 6: API Pública y Métodos Estáticos ---');

const publicMethods = [
    'render',
    'setViewMode',
    'setTableViewMode',
    'openPlayerCard',
    'showPlayerDetailModal',
    'closePlayerCard',
    'hidePlayerDetailModal',
    'toggleRulesBanner',
    'toggleRulesModal',
    'filterTable',
    'shareStandings'
];

publicMethods.forEach(method => {
    assert.strictEqual(
        typeof ControlTowerStandings[method],
        'function',
        `ControlTowerStandings.${method} debe ser una función válida`
    );
});
console.log(`✅ Verificado: Todos los ${publicMethods.length} métodos públicos existen.`);

// 6.1 Probar toggleRulesBanner()
console.log('  Testing toggleRulesBanner()...');
const rulesBody = createMockElement('sp-rules-body-content');
rulesBody.style.display = 'none';
const rulesBtn = createMockElement('sp-rules-toggle-btn');
const rulesIcon = createMockElement('sp-rules-toggle-icon');
ControlTowerStandings.toggleRulesBanner();
assert.strictEqual(rulesBody.style.display, 'grid', 'Al abrir el banner, display debe ser grid');
ControlTowerStandings.toggleRulesBanner();
assert.strictEqual(rulesBody.style.display, 'none', 'Al cerrar el banner, display debe ser none');
console.log('  ✅ toggleRulesBanner() funciona correctamente.');

// 6.2 Probar toggleRulesModal()
console.log('  Testing toggleRulesModal()...');
const rulesModal = createMockElement('sp-rules-modal-overlay');
ControlTowerStandings.toggleRulesModal(true);
assert.strictEqual(rulesModal.style.display, 'flex');
assert.strictEqual(mockDocument.body.style.overflow, 'hidden');
ControlTowerStandings.toggleRulesModal(false);
assert.strictEqual(rulesModal.style.display, 'none');
assert.strictEqual(mockDocument.body.style.overflow, '');
console.log('  ✅ toggleRulesModal() abre y cierra sin fallos.');

// 6.3 Probar setViewMode()
console.log('  Testing setViewMode()...');
const tblRankings = createMockElement('sp-table-rankings');
const btnQuick = createMockElement('sp-btn-view-quick');
const btnFull = createMockElement('sp-btn-view-full');
const scrollHint = createMockElement('sp-scroll-hint');

ControlTowerStandings.setViewMode('full');
assert(tblRankings.classList.contains('sp-force-full'), 'En modo full la tabla debe tener sp-force-full');
assert(btnFull.classList.contains('active'), 'Botón full debe estar activo');
assert(!btnQuick.classList.contains('active'), 'Botón quick no debe estar activo');

ControlTowerStandings.setViewMode('quick');
assert(!tblRankings.classList.contains('sp-force-full'), 'En modo quick la tabla no debe tener sp-force-full');
assert(btnQuick.classList.contains('active'), 'Botón quick debe estar activo');

// Compatibilidad con setTableViewMode
ControlTowerStandings.setTableViewMode('full');
assert(tblRankings.classList.contains('sp-force-full'));
console.log('  ✅ setViewMode() y alias setTableViewMode() funcionan correctamente.');

// 6.4 Probar openPlayerCard() y closePlayerCard()
console.log('  Testing openPlayerCard() / closePlayerCard()...');
ControlTowerStandings.render(mockMatches, mockEventDoc); // Asegura lastRankingData con jugadores
const playerOverlay = createMockElement('sp-player-modal-overlay');
ControlTowerStandings.openPlayerCard(0);
assert.strictEqual(playerOverlay.style.display, 'flex');
assert(playerOverlay.innerHTML.includes('sp-player-modal-card'), 'El modal del jugador debe inyectar la tarjeta técnica');
assert.strictEqual(mockDocument.body.style.overflow, 'hidden');

ControlTowerStandings.closePlayerCard();
assert.strictEqual(playerOverlay.style.display, 'none');
assert.strictEqual(mockDocument.body.style.overflow, '');

// Aliases
ControlTowerStandings.showPlayerDetailModal(0);
assert.strictEqual(playerOverlay.style.display, 'flex');
ControlTowerStandings.hidePlayerDetailModal();
assert.strictEqual(playerOverlay.style.display, 'none');
console.log('  ✅ openPlayerCard() / closePlayerCard() y sus alias funcionan sin errores.');

// 6.5 Probar filterTable()
console.log('  Testing filterTable()...');
assert.doesNotThrow(() => {
    ControlTowerStandings.filterTable('alex');
    ControlTowerStandings.filterTable('');
});
console.log('  ✅ filterTable() ejecuta sin errores.');

// 6.6 Probar shareStandings()
console.log('  Testing shareStandings()...');
(async () => {
    shareCalledWith = null;
    await ControlTowerStandings.shareStandings(mockWindow.ControlTowerStandings.lastRankingData, mockEventDoc);
    assert(shareCalledWith, 'shareStandings debe haber invocado navigator.share');
    assert(shareCalledWith.text.includes('CLASIFICACIÓN OFICIAL SOMOSPADEL BCN'));
    assert(shareCalledWith.text.includes('🥇'));
    console.log('  ✅ shareStandings() invoca la API nativa de compartir con formato correcto.');

    // Probar fallback de portapapeles cuando navigator.share no está disponible
    mockWindow.navigator.share = null;
    clipboardText = '';
    await ControlTowerStandings.shareStandings(mockWindow.ControlTowerStandings.lastRankingData, mockEventDoc);
    assert(clipboardText.includes('CLASIFICACIÓN OFICIAL SOMOSPADEL BCN'), 'Debe haber copiado al portapapeles');
    console.log('  ✅ shareStandings() fallback a portapapeles verificado con éxito.');

    console.log('\n========================================================');
    console.log('🏆 CERTIFICACIÓN QA COMPLETADA: 100% PRUEBAS EXITOSAS');
    console.log('========================================================\n');
})();
