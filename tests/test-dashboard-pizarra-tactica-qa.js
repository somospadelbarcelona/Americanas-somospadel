/**
 * test-dashboard-pizarra-tactica-qa.js
 * 
 * Batería de Pruebas de Calidad (QA) para:
 * Pizarra Táctica de Pistas & Club en DashboardView_hotfix.js (renderLiveWidget).
 * 
 * Verificaciones:
 * 1. Comprobación sintáctica estricta de DashboardView_hotfix.js.
 * 2. Validación de que cuando el usuario tiene partido/convocatoria confirmada y ADEMÁS existen
 *    otros entrenos y americanas activos, se renderizan TODOS los eventos en el carril táctico:
 *    - La convocatoria destacada ("TU PISTA ASIGNADA") se ubica en primer lugar con sus detalles.
 *    - Todos los demás eventos activos aparecen a continuación sin truncamiento ni omisión.
 * 3. Operatividad completa de los filtros tácticos de tiza (filterPizarraTactics):
 *    - 'todos', 'entrenos', 'americanas', 'mi_pista'.
 *    - Manejo de estado vacío filtrado ('pizarra-empty-filtered').
 * 4. Operatividad de scroll horizontal táctico (scrollPizarraTrack).
 * 5. Fallback limpio cuando no existen eventos activos ni partidos del usuario.
 * 6. Soporte multi-evento masivo sin partido de usuario: todas las tarjetas visibles y contadores exactos.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

let passedCount = 0;
let failedCount = 0;
const results = [];

function it(desc, fn) {
    try {
        const res = fn();
        if (res && typeof res.then === 'function') {
            return res.then(
                () => {
                    console.log(`  ✅ [PASS] ${desc}`);
                    passedCount++;
                    results.push({ desc, status: 'PASS' });
                },
                (err) => {
                    console.error(`  ❌ [FAIL] ${desc}\n     -> ${err.message}`);
                    failedCount++;
                    results.push({ desc, status: 'FAIL', error: err.message });
                }
            );
        }
        console.log(`  ✅ [PASS] ${desc}`);
        passedCount++;
        results.push({ desc, status: 'PASS' });
    } catch (err) {
        console.error(`  ❌ [FAIL] ${desc}\n     -> ${err.message}`);
        failedCount++;
        results.push({ desc, status: 'FAIL', error: err.message });
    }
}

// -----------------------------------------------------------------------------
// Entorno Simulado de DOM y Navegador
// -----------------------------------------------------------------------------
function createMockEnvironment() {
    const elementsById = {};
    const elementsByClass = {};
    const elementsByQuery = {};

    class MockElement {
        constructor(tagName) {
            this.tagName = (tagName || 'div').toUpperCase();
            this.id = '';
            this.className = '';
            this.style = {};
            this._innerHTML = '';
            this.children = [];
            this.dataset = {};
            this.attributes = {};
            this.scrollCalls = [];
            this.scrollByCalls = [];
        }

        get innerHTML() {
            return this._innerHTML;
        }

        set innerHTML(val) {
            this._innerHTML = String(val);
            this._parseChildrenFromHtml(this._innerHTML);
        }

        setAttribute(k, v) {
            this.attributes[k] = String(v);
            if (k === 'id') this.id = v;
            if (k === 'class') this.className = v;
            if (k.startsWith('data-')) {
                const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                this.dataset[prop] = String(v);
            }
        }

        getAttribute(k) {
            return this.attributes[k] !== undefined ? this.attributes[k] : null;
        }

        appendChild(child) {
            this.children.push(child);
            if (child.id) elementsById[child.id] = child;
        }

        scrollTo(opt) {
            this.scrollCalls.push(opt);
        }

        scrollBy(opt) {
            this.scrollByCalls.push(opt);
        }

        querySelectorAll(selector) {
            const found = [];
            function traverse(node) {
                if (!node || !node.children) return;
                for (const child of node.children) {
                    if (selector.startsWith('.')) {
                        const cls = selector.slice(1);
                        if (child.className && child.className.split(/\s+/).includes(cls)) {
                            found.push(child);
                        }
                    } else if (selector.startsWith('#')) {
                        const id = selector.slice(1);
                        if (child.id === id) found.push(child);
                    }
                    traverse(child);
                }
            }
            traverse(this);
            return found;
        }

        querySelector(selector) {
            const res = this.querySelectorAll(selector);
            return res.length > 0 ? res[0] : null;
        }

        _parseChildrenFromHtml(html) {
            this.children = [];
            
            // Si el HTML contiene el carril de tarjetas
            if (html.includes('id="pizarra-cards-track"')) {
                const track = new MockElement('div');
                track.id = 'pizarra-cards-track';
                track.setAttribute('id', 'pizarra-cards-track');
                elementsById['pizarra-cards-track'] = track;
                this.children.push(track);

                // Extraer todas las tarjetas .pizarra-card
                const cardRegex = /<div class="pizarra-card"([^>]*)>/g;
                let cm;
                while ((cm = cardRegex.exec(html)) !== null) {
                    const rawAttrs = cm[1];
                    const cardEl = new MockElement('div');
                    cardEl.className = 'pizarra-card';
                    cardEl.setAttribute('class', 'pizarra-card');

                    const attrRegex = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g;
                    let am;
                    while ((am = attrRegex.exec(rawAttrs)) !== null) {
                        cardEl.setAttribute(am[1], am[2]);
                    }
                    track.appendChild(cardEl);
                }
            }

            // Extraer todos los botones de filtro .pizarra-filter-pill
            const pillRegex = /<button class="pizarra-filter-pill"([^>]*)>/g;
            let pm;
            while ((pm = pillRegex.exec(html)) !== null) {
                const rawAttrs = pm[1];
                const pillEl = new MockElement('button');
                pillEl.className = 'pizarra-filter-pill';
                pillEl.setAttribute('class', 'pizarra-filter-pill');

                const attrRegex = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g;
                let am;
                while ((am = attrRegex.exec(rawAttrs)) !== null) {
                    pillEl.setAttribute(am[1], am[2]);
                }
                this.children.push(pillEl);
            }
        }
    }

    const mockDocument = {
        getElementById: (id) => elementsById[id] || null,
        querySelector: (sel) => {
            if (sel.startsWith('#')) return elementsById[sel.slice(1)] || null;
            if (elementsByQuery[sel]) return elementsByQuery[sel];
            for (const id in elementsById) {
                const q = elementsById[id].querySelector(sel);
                if (q) return q;
            }
            return null;
        },
        querySelectorAll: (sel) => {
            const results = [];
            for (const id in elementsById) {
                const list = elementsById[id].querySelectorAll(sel);
                results.push(...list);
            }
            return results;
        },
        createElement: (tag) => new MockElement(tag),
        body: new MockElement('body')
    };

    // Live scroller container required by renderLiveWidget
    const liveScrollerInner = new MockElement('div');
    liveScrollerInner.id = 'live-scroller-inner';
    elementsById['live-scroller-inner'] = liveScrollerInner;

    const mockStorage = {
        _data: {},
        getItem: (k) => mockStorage._data[k] || null,
        setItem: (k, v) => { mockStorage._data[k] = String(v); },
        removeItem: (k) => { delete mockStorage._data[k]; },
        clear: () => { mockStorage._data = {}; }
    };

    const listeners = {};
    const mockWindow = {
        document: mockDocument,
        localStorage: mockStorage,
        addEventListener: (evt, fn) => {
            listeners[evt] = listeners[evt] || [];
            listeners[evt].push(fn);
        },
        removeEventListener: (evt, fn) => {
            if (!listeners[evt]) return;
            listeners[evt] = listeners[evt].filter(f => f !== fn);
        },
        dispatchEvent: (evt) => {
            const list = listeners[evt.type || evt] || [];
            list.forEach(fn => fn(evt));
        },
        matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
        navigator: { userAgent: 'test', platform: 'Win32' },
        location: { href: 'http://localhost/', hash: '' },
        _lastDashboardContext: null,
        _lastEventsData: null,
        _lastWeatherData: null,
        _ccEventsFetchedRecently: false,
        AmericanaService: {
            getAllActiveEvents: async () => []
        },
        WeatherService: {
            getDashboardWeather: async () => [{ temp: 22, icon: '☀️', name: 'BARCELONA' }]
        },
        Router: {
            navigate: () => {},
            currentRoute: 'dashboard'
        },
        dashNavigate: () => {},
        showWeatherDetails: () => {},
        clearDatabaseCache: () => {},
        CacheService: {
            remove: () => {}
        }
    };

    return {
        mockWindow,
        mockDocument,
        elementsById,
        liveScrollerInner
    };
}

async function runQaSuite() {
    console.log("================================================================================");
    console.log(" 🧪 AUDITORÍA QA: PIZARRA TÁCTICA DE PISTAS & CLUB (DashboardView_hotfix)");
    console.log("================================================================================\n");

    const hotfixPath = path.resolve(__dirname, '../js/modules/dashboard/DashboardView_hotfix.js');

    // 1. SINTAXIS
    console.log("▶️ FASE 1: Verificación de sintaxis de código");
    it("DashboardView_hotfix.js compila sin errores sintácticos (node -c)", () => {
        execSync(`node -c "${hotfixPath}"`);
    });

    const fileContent = fs.readFileSync(hotfixPath, 'utf8');

    it("DashboardView_hotfix.js define e implementa el método renderLiveWidget", () => {
        if (!fileContent.includes('async renderLiveWidget(context = {}, force = false)')) {
            throw new Error("No se encontró la firma esperada de renderLiveWidget");
        }
    });

    it("DashboardView_hotfix.js define filterPizarraTactics y scrollPizarraTrack", () => {
        if (!fileContent.includes('window.filterPizarraTactics = function')) {
            throw new Error("Falta la definición de window.filterPizarraTactics");
        }
        if (!fileContent.includes('window.scrollPizarraTrack = function')) {
            throw new Error("Falta la definición de window.scrollPizarraTrack");
        }
    });

    // 2. EJECUCIÓN EN VM Y TEST FUNCIONALES
    console.log("\n▶️ FASE 2: Pruebas Funcionales de Integración en Entorno DOM");

    const env = createMockEnvironment();
    const sandbox = {
        window: env.mockWindow,
        document: env.mockDocument,
        navigator: env.mockWindow.navigator,
        localStorage: env.mockWindow.localStorage,
        console: { log: () => {}, error: () => {}, warn: () => {} },
        setTimeout: (fn) => 1,
        clearTimeout: () => {},
        setInterval: (fn) => 1,
        clearInterval: () => {},
        requestAnimationFrame: (fn) => 1,
        cancelAnimationFrame: () => {},
        Promise: Promise,
        Date: Date,
        Math: Math,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        RegExp: RegExp,
        parseInt: parseInt,
        parseFloat: parseFloat
    };
    sandbox.window.setTimeout = sandbox.setTimeout;
    sandbox.window.clearTimeout = sandbox.clearTimeout;
    sandbox.window.setInterval = sandbox.setInterval;
    sandbox.window.clearInterval = sandbox.clearInterval;
    sandbox.window.window = sandbox.window;
    vm.createContext(sandbox);

    // Cargar script en el sandbox
    vm.runInContext(fileContent, sandbox);

    const dashboardView = sandbox.window.DashboardView;
    if (!dashboardView || typeof dashboardView.renderLiveWidget !== 'function') {
        throw new Error("No se pudo instanciar DashboardView en el sandbox o falta renderLiveWidget");
    }

    // TEST CASO 1: Usuario con partido confirmado + otros 4 eventos activos
    await it("Caso 1: Convocatoria confirmada del usuario + múltiples eventos activos: Renderiza TODOS los eventos con el del usuario primero", async () => {
        const mockAllEvents = [
            { id: 'evt_1', name: 'Americana Mixta Oro', type: 'americana', date: '2026-10-05', time: '20:00', max_players: 16, players: ['u1', 'u2'] },
            { id: 'evt_2', name: 'Entreno Femenino Avanzado', type: 'entreno', date: '2026-10-04', time: '18:00', max_players: 8, players: ['u3'] },
            { id: 'evt_3', name: 'Torneo Express Sábado', type: 'americana', date: '2026-10-06', time: '11:00', max_players: 20, players: ['u4', 'u5', 'u6'] },
            { id: 'evt_4', name: 'Pozo Dinámico Mixto', type: 'pozo', date: '2026-10-07', time: '19:30', max_players: 12, players: ['u7'] }
        ];

        sandbox.window.AmericanaService.getAllActiveEvents = async () => mockAllEvents;

        const userContext = {
            hasMatchToday: true,
            matchId: 'user_m_99',
            eventName: 'Entreno Táctico VIP',
            matchType: 'entreno',
            court: 'Pista 4',
            matchTime: '19:00',
            partner: 'Sergio Ramos',
            opponents: 'Carlos & Marc'
        };

        const html = await dashboardView.renderLiveWidget(userContext, true);

        // 1. Debe generar contenedor pizarra
        if (!html.includes('pizarra-tactica-container')) {
            throw new Error("No contiene la clase pizarra-tactica-container");
        }

        // 2. Debe renderizar 5 eventos en total (1 del usuario + 4 existentes)
        const userCardMatches = (html.match(/⭐ TU PISTA ASIGNADA/g) || []).length;
        if (userCardMatches !== 1) {
            throw new Error(`Se esperaba 1 tarjeta VIP de usuario, encontradas: ${userCardMatches}`);
        }

        if (!html.includes('Pista 4')) {
            throw new Error("La tarjeta del usuario no incluye la Pista 4 asignada");
        }
        if (!html.includes('Sergio Ramos')) {
            throw new Error("La tarjeta del usuario no incluye al compañero Sergio Ramos");
        }
        if (!html.includes('Carlos & Marc')) {
            throw new Error("La tarjeta del usuario no incluye a los rivales Carlos & Marc");
        }

        // 3. Los otros 4 eventos deben estar presentes en el carril
        if (!html.includes('Americana Mixta Oro')) throw new Error("Falta 'Americana Mixta Oro'");
        if (!html.includes('Entreno Femenino Avanzado')) throw new Error("Falta 'Entreno Femenino Avanzado'");
        if (!html.includes('Torneo Express Sábado')) throw new Error("Falta 'Torneo Express Sábado'");
        if (!html.includes('Pozo Dinámico Mixto')) throw new Error("Falta 'Pozo Dinámico Mixto'");

        // 4. Contadores de la pizarra
        if (!html.includes('5 ACTIVOS')) {
            throw new Error("El contador global no indica '5 ACTIVOS'");
        }
        if (!html.includes('TODOS</span> <span style="opacity: 0.85; font-size: 0.50rem;">(5)')) {
            throw new Error("El botón TODOS no muestra (5)");
        }
        // Entrenos: 'Entreno Táctico VIP' + 'Entreno Femenino Avanzado' + 'Pozo Dinámico Mixto' = 3
        if (!html.includes('ENTRENOS</span> <span style="opacity: 0.7; font-size: 0.50rem;">(3)')) {
            throw new Error("El botón ENTRENOS no muestra (3)");
        }
        // Americanas: 'Americana Mixta Oro' + 'Torneo Express Sábado' = 2
        if (!html.includes('AMERICANAS</span> <span style="opacity: 0.7; font-size: 0.50rem;">(2)')) {
            throw new Error("El botón AMERICANAS no muestra (2)");
        }
        // Botón VIP Mi Pista
        if (!html.includes('data-filter="mi_pista"')) {
            throw new Error("Falta el botón de filtro VIP ⭐ MI PISTA cuando el usuario tiene partido");
        }

        // 5. Verificar que la tarjeta del usuario es la primera en #pizarra-cards-track
        const trackStartIdx = html.indexOf('id="pizarra-cards-track"');
        const firstCardMatch = html.slice(trackStartIdx).match(/<div class="pizarra-card"([^>]*)>/);
        if (!firstCardMatch || !firstCardMatch[1].includes('data-is-user="true"')) {
            throw new Error("La tarjeta del usuario no está en la primera posición del carril");
        }
    });

    // TEST CASO 2: Operatividad de los filtros tácticos de tiza (filterPizarraTactics)
    it("Caso 2: Operatividad de filterPizarraTactics ('entrenos', 'americanas', 'mi_pista', 'todos')", () => {
        // Obtenemos los elementos montados en el live-scroller-inner
        const track = env.mockDocument.getElementById('pizarra-cards-track');
        if (!track) throw new Error("No se encontró el elemento pizarra-cards-track");

        const cards = track.querySelectorAll('.pizarra-card');
        if (cards.length !== 5) {
            throw new Error(`Se esperaban 5 tarjetas en el track, se encontraron: ${cards.length}`);
        }

        const pills = env.mockDocument.querySelectorAll('.pizarra-filter-pill');
        const entrenosPill = pills.find(p => p.getAttribute('data-filter') === 'entrenos');
        const americanasPill = pills.find(p => p.getAttribute('data-filter') === 'americanas');
        const miPistaPill = pills.find(p => p.getAttribute('data-filter') === 'mi_pista');
        const todosPill = pills.find(p => p.getAttribute('data-filter') === 'todos');

        // Filtrar por ENTRENOS
        sandbox.window.filterPizarraTactics('entrenos', entrenosPill);
        let visibleCards = cards.filter(c => c.style.display !== 'none');
        if (visibleCards.length !== 3) {
            throw new Error(`Filtro 'entrenos': se esperaban 3 tarjetas visibles, hay: ${visibleCards.length}`);
        }
        for (const c of visibleCards) {
            const cat = c.getAttribute('data-category');
            const type = c.getAttribute('data-type');
            if (cat !== 'entrenos' && type !== 'entreno') {
                throw new Error(`Tarjeta visible no es entreno: cat=${cat}, type=${type}`);
            }
        }

        // Filtrar por AMERICANAS
        sandbox.window.filterPizarraTactics('americanas', americanasPill);
        visibleCards = cards.filter(c => c.style.display !== 'none');
        if (visibleCards.length !== 2) {
            throw new Error(`Filtro 'americanas': se esperaban 2 tarjetas visibles, hay: ${visibleCards.length}`);
        }
        for (const c of visibleCards) {
            const cat = c.getAttribute('data-category');
            const type = c.getAttribute('data-type');
            if (cat !== 'americanas' && type !== 'americana') {
                throw new Error(`Tarjeta visible no es americana: cat=${cat}, type=${type}`);
            }
        }

        // Filtrar por MI PISTA
        sandbox.window.filterPizarraTactics('mi_pista', miPistaPill);
        visibleCards = cards.filter(c => c.style.display !== 'none');
        if (visibleCards.length !== 1) {
            throw new Error(`Filtro 'mi_pista': se esperaba 1 tarjeta visible, hay: ${visibleCards.length}`);
        }
        if (visibleCards[0].getAttribute('data-is-user') !== 'true') {
            throw new Error("La tarjeta visible no tiene data-is-user='true'");
        }

        // Volver a TODOS
        sandbox.window.filterPizarraTactics('todos', todosPill);
        visibleCards = cards.filter(c => c.style.display !== 'none');
        if (visibleCards.length !== 5) {
            throw new Error(`Filtro 'todos': se esperaban 5 tarjetas visibles, hay: ${visibleCards.length}`);
        }
    });

    // TEST CASO 3: Operatividad de scrollPizarraTrack
    it("Caso 3: Operatividad de scrollPizarraTrack desplaza suavemente +/- 280px", () => {
        const track = env.mockDocument.getElementById('pizarra-cards-track');
        if (!track) throw new Error("No se encontró pizarra-cards-track");

        track.scrollByCalls = [];
        sandbox.window.scrollPizarraTrack(1); // Next
        if (track.scrollByCalls.length !== 1 || track.scrollByCalls[0].left !== 280) {
            throw new Error("scrollPizarraTrack(1) no llamó a scrollBy con left: 280");
        }

        sandbox.window.scrollPizarraTrack(-1); // Prev
        if (track.scrollByCalls.length !== 2 || track.scrollByCalls[1].left !== -280) {
            throw new Error("scrollPizarraTrack(-1) no llamó a scrollBy con left: -280");
        }
    });

    // TEST CASO 4: Fallback limpio cuando no hay eventos activos
    await it("Caso 4: Fallback limpio cuando no hay eventos activos ni partido de usuario", async () => {
        sandbox.window.AmericanaService.getAllActiveEvents = async () => [];
        const emptyContext = { hasMatchToday: false, hasMatchThisWeek: false };

        const html = await dashboardView.renderLiveWidget(emptyContext, true);

        if (!html.includes('pizarra-tactica-container')) {
            throw new Error("El fallback no incluye la pizarra-tactica-container");
        }
        if (!html.includes('PIZARRA DE PISTAS & CLUB')) {
            throw new Error("El fallback no incluye el título 'PIZARRA DE PISTAS & CLUB'");
        }
        if (!html.includes('PRÓXIMAMENTE')) {
            throw new Error("El fallback no incluye el badge 'PRÓXIMAMENTE'");
        }
        if (!html.includes('VER CALENDARIO')) {
            throw new Error("El fallback no incluye el botón 'VER CALENDARIO'");
        }
        if (!html.includes("dashNavigate('entrenos', 'pizarra_empty')")) {
            throw new Error("El botón del fallback no redirige a entrenos/calendario");
        }
        // No debe contener track de cards
        if (html.includes('id="pizarra-cards-track"')) {
            throw new Error("El fallback no debería tener un track de tarjetas de partidos");
        }
    });

    // TEST CASO 5: Múltiples eventos sin partido de usuario (Multi-evento masivo)
    await it("Caso 5: Múltiples eventos sin partido de usuario: todas las tarjetas visibles, contadores exactos, sin botón 'Mi Pista'", async () => {
        const sixEvents = [
            { id: 'am_1', name: 'Americana Nivel 3.0', type: 'americana', date: '2026-10-08', time: '18:00', max_players: 16, players: [] },
            { id: 'am_2', name: 'Americana Oro Nocturna', type: 'americana', date: '2026-10-08', time: '21:00', max_players: 16, players: [] },
            { id: 'am_3', name: 'Torneo Twister Domingo', type: 'americana', date: '2026-10-09', time: '10:00', max_players: 24, players: [] },
            { id: 'en_1', name: 'Entreno Femenino Iniciación', type: 'entreno', date: '2026-10-08', time: '17:00', max_players: 8, players: [] },
            { id: 'en_2', name: 'Entreno Transición Red', type: 'entreno', date: '2026-10-09', time: '19:00', max_players: 8, players: [] },
            { id: 'en_3', name: 'Pozo Americano Viernes', type: 'pozo', date: '2026-10-10', time: '20:00', max_players: 12, players: [] }
        ];

        sandbox.window.AmericanaService.getAllActiveEvents = async () => sixEvents;
        const noUserMatchContext = { hasMatchToday: false, hasMatchThisWeek: false };

        const html = await dashboardView.renderLiveWidget(noUserMatchContext, true);

        // Contadores
        if (!html.includes('6 ACTIVOS')) throw new Error("Contador debe indicar '6 ACTIVOS'");
        if (!html.includes('(6)')) throw new Error("Botón TODOS debe mostrar (6)");
        if (!html.includes('(3)')) throw new Error("Botones ENTRENOS y AMERICANAS deben mostrar (3)");

        // No debe aparecer ⭐ MI PISTA
        if (html.includes('data-filter="mi_pista"')) {
            throw new Error("No debe mostrarse el filtro ⭐ MI PISTA si el usuario no tiene partido programado");
        }

        // Ninguna tarjeta debe ser de usuario
        if (html.includes('data-is-user="true"')) {
            throw new Error("No debe haber ninguna tarjeta con data-is-user='true'");
        }

        // Deben figurar los 6 eventos
        for (const evt of sixEvents) {
            if (!html.includes(evt.name)) {
                throw new Error(`El evento '${evt.name}' no está presente en el render`);
            }
        }
    });

    console.log("\n================================================================================");
    console.log(` RESULTADOS QA PIZARRA TÁCTICA:`);
    console.log(` ✅ PASADAS: ${passedCount}`);
    console.log(` ❌ FALLIDAS: ${failedCount}`);
    console.log("================================================================================");

    if (failedCount > 0) {
        process.exit(1);
    } else {
        console.log("🎉 AUDITORÍA QA SUPERADA: La Pizarra Táctica cumple todos los requisitos de calidad.");
        process.exit(0);
    }
}

runQaSuite().catch(err => {
    console.error("FATAL ERROR EN QA SUITE:", err);
    process.exit(1);
});
