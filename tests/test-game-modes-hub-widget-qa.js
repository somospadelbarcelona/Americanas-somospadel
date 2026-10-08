/**
 * tests/test-game-modes-hub-widget-qa.js
 *
 * QA del widget conjunto "Modos de Juego & Reglamento":
 *  1. EventsController.renderGameModesHubWidget() genera los 4 bloques (cabecera, 3 formatos,
 *     reglamento oficial y botón de guía).
 *  2. RankingView.js lo incluye al final de la lista del ranking.
 *  3. Ya no se duplica en las pestañas de Americanas/Entrenos ni en el Inicio.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function assert(c, m) { if (c) { console.log(`  ✅ PASS: ${m}`); pass++; } else { console.error(`  ❌ FAIL: ${m}`); fail++; } }

const root = path.join(__dirname, '..');
const evPath = path.join(root, 'js', 'modules', 'americanas', 'EventsController_V6.js');
const rkPath = path.join(root, 'js', 'modules', 'ranking', 'RankingView.js');
const dbPath = path.join(root, 'js', 'modules', 'dashboard', 'DashboardView_hotfix.js');
const evCode = fs.readFileSync(evPath, 'utf8');
const rkCode = fs.readFileSync(rkPath, 'utf8');
const dbCode = fs.readFileSync(dbPath, 'utf8');

class MockElement {
    constructor(tag = 'div') {
        this.tagName = tag.toUpperCase(); this.style = {}; this.innerHTML = ''; this.innerText = '';
        this.classList = { add() {}, remove() {}, contains() { return false; } };
    }
    setAttribute() {} getAttribute() { return null; } querySelector() { return null; } querySelectorAll() { return []; }
}
const w = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    setTimeout() {}, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
    localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
    addEventListener() {}, removeEventListener() {},
    document: { body: new MockElement('body'), createElement: t => new MockElement(t), getElementById: () => null, querySelectorAll: () => [] },
    navigator: { userAgent: 'QA' },
    db: { collection: () => ({ onSnapshot: () => () => {}, doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) }
};
w.window = w; w.document.defaultView = w;
const ctx = vm.createContext({ ...w });
vm.runInContext(evCode, ctx);
const controller = ctx.window.EventsController || w.EventsController;

console.log('\n--- 1. Widget conjunto generado por EventsController ---');
assert(controller && typeof controller.renderGameModesHubWidget === 'function', 'Existe renderGameModesHubWidget()');
const html = controller.renderGameModesHubWidget();
assert(html.includes('id="game-modes-hub-widget"'), 'Contenedor único del widget');
assert(html.includes('Modos de Juego') && html.includes('3 FORMATOS'), 'Cabecera Modos de Juego con 3 FORMATOS');
assert(html.includes("showGameModesModal('pareja')") && html.includes("showGameModesModal('twister')") && html.includes("showGameModesModal('suizo')"), 'Tarjetas Pareja Fija / Twister / Suizo');
assert(html.includes('Puntos Ranking') && html.includes('showPointsPolicyModal'), 'Acceso a Puntos Ranking');
assert(html.includes('REGLAMENTO OFICIAL') && html.includes('Ver Baremo'), 'Tarjeta Reglamento oficial con Baremo & Simulador');
assert(html.includes('¿CÓMO FUNCIONAN LOS FORMATOS?'), 'Botón ¿Cómo funcionan los formatos?');
assert(html.includes('id="points-policy-card-root"'), 'Se conserva el id points-policy-card-root');
assert((html.match(/id="game-modes-hub-widget"/g) || []).length === 1, 'El widget no se duplica en su propio HTML');

console.log('\n--- 1b. Calidad y coherencia de iconos ---');
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
assert(!emojiRe.test(html), 'Sin emojis: todos los iconos son vectoriales (SVG / Font Awesome)');
['pair', 'twister', 'swiss', 'medal', 'cap'].forEach(id => {
    assert(html.includes(`id="gmh-${id}"`) && html.includes(`url(#gmh-${id})`), `Icono SVG propio con degradado: ${id}`);
});
assert(!html.includes('fa-user-group') && !html.includes('fa-wind'), 'Los formatos ya no usan glifos planos de Font Awesome');
assert(html.includes('linear-gradient(145deg, #090e1a 0%, #17243c 100%)'), 'Cuadros de icono con el mismo degradado oscuro del menú del Inicio');
assert(html.includes('drop-shadow(0 0 5px'), 'Iconos con brillo (drop-shadow) como el menú del Inicio');
assert(html.includes('width: 58px; height: 58px'), 'Cuadros de formato de 58px, igual que el menú del Inicio');
assert(html.includes('viewBox="0 0 48 48"') && !/<svg[^>]*\swidth="\d+"[^>]*\sheight="\d+"[^>]*>(?![\s\S]*viewBox)/.test(html), 'SVG escalables con viewBox (nítidos en cualquier densidad)');

console.log('\n--- 2. Integración en el Ranking ---');
assert(rkCode.includes('renderGameModesHubWidget'), 'RankingView invoca renderGameModesHubWidget');
assert(rkCode.includes('id="ranking-game-modes-hub"') && rkCode.includes('${modesHubHtml}'), 'RankingView pinta el widget');
assert(rkCode.indexOf('${listHtml}') < rkCode.indexOf('${modesHubHtml}'), 'El widget va DESPUÉS de la lista del ranking (al final)');

console.log('\n--- 3. Sin duplicados en otras vistas ---');
assert(!evCode.includes('SELECTOR VISUAL PREMIUM DE MODOS DE JUEGO'), 'Quitado de Americanas/Entrenos (selector)');
const evRender = evCode.replace(/renderGameModesHubWidget\(\) \{[\s\S]*?\n        renderAgendaView/, 'renderAgendaView');
assert(!evRender.includes('id="points-policy-card-root"'), 'Tarjeta de reglamento ya no está en Americanas/Entrenos');
assert(!dbCode.includes('game-modes-hub-root'), 'No se muestra en el Inicio');

console.log(`\n📊 RESULTADO QA: ${pass} pruebas pasadas, ${fail} fallidas.\n`);
process.exit(fail ? 1 : 0);
