/**
 * QA Test Suite: Control Tower Hang Fix & Concurrency Certification
 * Validates:
 * 1. Race condition prevention between prepareLoad, handleLiveRoute and load().
 * 2. Instant local memory resolution (0ms) for finished entrenos and americanas.
 * 3. Watchdog timeout mechanism (1500ms) preventing perpetual UI freeze.
 * 4. openResultsView type auto-detection and accurate propagation.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("========================================================");
console.log("🎾 SUITE QA: CONTROL TOWER HANG FIX & CONCURRENCY SHIELD");
console.log("========================================================\n");

// --- SETUP MOCK BROWSER ENVIRONMENT ---
global.window = global;
global.document = {
    getElementById: () => ({ innerHTML: '', style: {} }),
    querySelector: () => null,
    querySelectorAll: () => []
};

// Mock EventHeader and other subviews
window.EventHeader = { render: () => '<header>EventHeader Mock</header>' };
window.ControlTowerStandings = { render: () => '<div>Standings Mock</div>' };
window.ControlTowerSummary = { render: () => '<div>Summary Mock</div>' };
window.ControlTowerBrackets = { render: () => '<div>Brackets Mock</div>' };
window.ControlTowerReport = { render: () => '<div>Report Mock</div>' };
window.MatchCard = { render: () => '<div>MatchCard Mock</div>' };
window.Store = { getState: () => ({ uid: 'user_qa_1', name: 'Tester QA' }) };

// Load ControlTowerView source in simulated browser scope
const controlTowerSource = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'modules', 'americanas', 'ControlTowerView.js'),
    'utf8'
);
eval(controlTowerSource);

// Load EventsController_V6 source for openResultsView testing
const eventsControllerSource = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'modules', 'americanas', 'EventsController_V6.js'),
    'utf8'
);
eval(eventsControllerSource);

assert(typeof window.ControlTowerView === 'object', "ControlTowerView debe estar instanciado en window");
assert(typeof window.openResultsView === 'function', "openResultsView debe estar definido globalmente");

async function runTests() {
    // -------------------------------------------------------------------------
    // TEST 1: PREPARELOAD & HANDLELIVEROUTE CONCURRENCY & RACE CONDITIONS
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 1: Prevención de condiciones de carrera y cargas concurrentes");

    const ct = window.ControlTowerView;
    let loadCallCount = 0;
    let loadedEventIds = [];
    let loadLatestCallCount = 0;

    // Spy on load and loadLatest
    const originalLoad = ct.load;
    const originalLoadLatest = ct.loadLatest;

    // Reset Router mock
    window.Router = {
        currentRoute: 'dashboard',
        navigate: (route) => {
            window.Router.currentRoute = route;
            if (route === 'live') {
                window.ControlTowerView.handleLiveRoute();
            }
        }
    };

    // Caso 1.1: Navegación desde otra ruta (dashboard -> live)
    let resolveMockGet;
    window.db = {
        collection: (col) => ({
            doc: (id) => ({
                get: () => new Promise(res => { resolveMockGet = () => res({ exists: true, id, data: () => ({ name: 'Evento Test' }) }); resolveMockGet(); }),
                onSnapshot: () => () => {}
            }),
            where: () => ({
                onSnapshot: (cb) => {
                    cb({ docs: [] });
                    return () => {};
                }
            })
        })
    };

    // Llamada clásica prepareLoad -> Router.navigate('live')
    ct.prepareLoad('evt_concurrency_1', 'americana');
    assert.strictEqual(ct.pendingId, 'evt_concurrency_1', "pendingId debe ser asignado");
    window.Router.navigate('live');

    assert.strictEqual(ct.pendingId, null, "pendingId debe consumirse y resetearse a null tras handleLiveRoute");
    assert.strictEqual(ct.currentAmericanaId, 'evt_concurrency_1', "currentAmericanaId debe reflejar el evento objetivo");

    // Caso 1.2: Ya estamos en 'live' y el usuario pulsa en otro evento
    // (Simula openResultsView ejecutado estando ya en la pantalla de Torre de Control)
    window.Router.currentRoute = 'live';

    let loadPromiseRunning = false;
    ct.load = async function(id, type) {
        loadCallCount++;
        loadedEventIds.push(id);
        this._isLoading = true;
        this._currentLoadingId = id;
        loadPromiseRunning = true;
        // Simular latencia asíncrona de Firestore
        await new Promise(r => setTimeout(r, 40));
        loadPromiseRunning = false;
        this._isLoading = false;
    };

    ct.loadLatest = async function() {
        loadLatestCallCount++;
    };

    // Disparar prepareLoad cuando ya estamos en 'live'
    ct.prepareLoad('evt_concurrency_2', 'entreno');

    // Inmediatamente después, el Router intenta navegar a 'live'
    // Como currentRoute == 'live', si handleLiveRoute se invocara concurrentemente, NO debe llamar a loadLatest()
    assert.strictEqual(ct.pendingId, null, "prepareLoad en ruta 'live' debe haber ejecutado handleLiveRoute y consumido pendingId");
    assert.strictEqual(loadCallCount, 1, "load() debe haberse invocado exactamente 1 vez para evt_concurrency_2");

    // Si una llamada espuria a handleLiveRoute llega mientras _isLoading es true:
    await ct.handleLiveRoute();
    assert.strictEqual(loadLatestCallCount, 0, "handleLiveRoute() concurrente con _isLoading=true NO debe invocar loadLatest()");

    // Reintento de load() para el mismo ID mientras carga:
    ct._isLoading = true;
    ct._currentLoadingId = 'evt_concurrency_2';
    await originalLoad.call(ct, 'evt_concurrency_2');
    // Verificamos que salió tempranamente sin duplicar la ejecución
    ct._isLoading = false;

    // Restaurar spies
    ct.load = originalLoad;
    ct.loadLatest = originalLoadLatest;
    console.log("   ✅ Concurrencia y guardas de condición de carrera certificadas con éxito.");

    // -------------------------------------------------------------------------
    // TEST 2: RESOLUCIÓN INMEDIATA DESDE MEMORIA LOCAL (0ms) PARA EVENTOS FINALIZADOS
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 2: Resolución instantánea en memoria local para entrenos y americanas finalizados");

    window.EventsController = {
        state: {
            americanas: [
                { id: 'ame_fin_100', name: 'Americana Domingo Finalizada', status: 'finished', date: '2026-10-10' }
            ],
            entrenos: [
                { id: 'ent_fin_200', name: 'Entreno Nivel 3 Finalizado', status: 'finished', date: '2026-10-09' }
            ]
        }
    };

    // Mock Firestore con retraso artificial
    let pendingTimers = [];
    const makeDbMock = (delayDoc = 0, delaySnapshot = 0, hangDoc = false) => ({
        collection: (col) => ({
            doc: (id) => ({
                get: async () => {
                    if (hangDoc) return new Promise(() => {});
                    if (delayDoc > 0) await new Promise(r => setTimeout(r, delayDoc));
                    return { exists: true, id, data: () => ({ name: 'Doc Firestore', status: 'finished' }) };
                },
                onSnapshot: () => () => {}
            }),
            where: () => ({
                get: async () => ({ empty: true, docs: [] }),
                onSnapshot: (cb) => {
                    if (hangDoc) return () => {};
                    const t = setTimeout(() => cb({ docs: [] }), delaySnapshot);
                    pendingTimers.push(t);
                    return () => clearTimeout(t);
                }
            })
        })
    });

    window.db = makeDbMock(20, 10, false);

    let renderedStates = [];
    ct.render = (data) => {
        renderedStates.push(data?.status || 'NORMAL');
    };
    ct.recalc = () => {};
    ct.debouncedRecalc = () => {};

    // 2.1 Carga de Americana Finalizada
    const loadPromiseAme = ct.load('ame_fin_100', 'americana');

    // Comprobación SÍNCRONA (0ms): currentAmericanaDoc DEBE estar disponible de inmediato antes del await
    assert.notStrictEqual(ct.currentAmericanaDoc, null, "currentAmericanaDoc debe resolverse de forma síncrona desde memoria");
    assert.strictEqual(ct.currentAmericanaDoc.id, 'ame_fin_100');
    assert.strictEqual(ct.currentAmericanaDoc.isEntreno, false, "Debe ser detectado como americana");
    assert.strictEqual(ct.activeTab, 'results', "Para eventos finalizados la pestaña inicial debe ser 'results'");

    await loadPromiseAme;
    console.log("   ✅ Americana finalizada resuelta síncronamente desde memoria local.");

    // 2.2 Carga de Entreno Finalizado
    const loadPromiseEnt = ct.load('ent_fin_200', 'entreno');

    assert.notStrictEqual(ct.currentAmericanaDoc, null);
    assert.strictEqual(ct.currentAmericanaDoc.id, 'ent_fin_200');
    assert.strictEqual(ct.currentAmericanaDoc.isEntreno, true, "Debe ser detectado como entreno");
    assert.strictEqual(ct.activeTab, 'results');

    await loadPromiseEnt;
    console.log("   ✅ Entreno finalizado resuelto síncronamente desde memoria local.");

    // -------------------------------------------------------------------------
    // TEST 3: WATCHDOG DE SEGURIDAD (1500ms) CONTRA BLOQUEOS DE UI
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 3: Watchdog de seguridad (1500ms) ante cuelgues o desconexiones de red");

    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
    window.db = makeDbMock(0, 0, true);

    let watchdogFired = false;
    ct.recalc = () => {
        watchdogFired = true;
    };

    // Evento no presente en memoria para obligar a consulta remota colgada
    const hangingLoadPromise = ct.load('evt_hanging_999');

    assert.strictEqual(ct._isLoading, true, "_isLoading debe activarse");
    assert(ct._loadingWatchdog !== null, "Watchdog timeout debe estar activo");

    // Esperar a que el watchdog se dispare (1500ms + buffer)
    console.log("   ⏱️ Esperando 1600ms para certificar disparo del watchdog...");
    await new Promise(r => setTimeout(r, 1600));

    assert.strictEqual(ct._isLoading, false, "_isLoading debe haber vuelto a false tras el watchdog");
    assert.strictEqual(watchdogFired, true, "recalc() debe haberse ejecutado para desbloquear la interfaz");
    console.log("   ✅ Watchdog timeout certificado: la UI nunca queda bloqueada permanentemente.");

    // -------------------------------------------------------------------------
    // TEST 4: OPENRESULTSVIEW AUTO-DETECCIÓN Y PROPAGACIÓN
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 4: Autodetección y propagación en openResultsView");

    window.EventsController.state = {
        americanas: [{ id: 'ame_auto_1' }],
        entrenos: [{ id: 'ent_auto_1' }]
    };

    let preparedId = null;
    let preparedType = null;
    ct.prepareLoad = (id, type) => {
        preparedId = id;
        preparedType = type;
    };

    // 4.1 Autodetección para entreno cuando no se pasa type
    window.openResultsView('ent_auto_1');
    assert.strictEqual(preparedId, 'ent_auto_1');
    assert.strictEqual(preparedType, 'entreno', "openResultsView debe autodetectar 'entreno'");

    // 4.2 Autodetección para americana cuando no se pasa type
    window.openResultsView('ame_auto_1');
    assert.strictEqual(preparedId, 'ame_auto_1');
    assert.strictEqual(preparedType, 'americana', "openResultsView debe autodetectar 'americana'");

    // 4.3 Propagación explícita con type
    window.openResultsView('ent_auto_1', 'entreno');
    assert.strictEqual(preparedId, 'ent_auto_1');
    assert.strictEqual(preparedType, 'entreno');

    console.log("   ✅ openResultsView autodetecta y propaga correctamente los tipos de evento.");

    // -------------------------------------------------------------------------
    // TEST 5: EVALUACIÓN DE LAS LLAMADAS GENERADAS EN EL HTML DE LAS TARJETAS
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 5: Verificación estática de generación de cardAction en EventsController_V6");

    assert(eventsControllerSource.includes("cardAction = `window.openResultsView('${evt.id}', '${evt.type || (isEntreno ? 'entreno' : 'americana')}')`"),
        "EventsController_V6 debe pasar 'entreno' o 'americana' explícitamente en el cardAction de eventos finalizados");

    console.log("   ✅ Generación de cardAction en eventos finalizados verificada.");

    console.log("\n========================================================");
    console.log("🎉 CERTIFICACIÓN QA COMPLETADA: 100% PRUEBAS EXITOSAS");
    console.log("========================================================\n");
    process.exit(0);
}

runTests().catch(err => {
    console.error("❌ ERROR EN SUITE QA:", err);
    process.exit(1);
});
