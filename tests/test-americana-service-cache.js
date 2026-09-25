/**
 * Test Suite: AmericanaService Optimization & Cache Verification
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runAmericanaServiceTests() {
    console.log("========================================================================");
    console.log("🎾 PRUEBAS: OPTIMIZACIÓN Y CACHÉ EN AMERICANA SERVICE");
    console.log("========================================================================");

    let passed = 0;
    let failed = 0;

    function assert(desc, condition) {
        if (condition) {
            console.log(`✅ PASS: ${desc}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${desc}`);
            failed++;
        }
    }

    // Preparar entorno simulado
    const sandbox = {
        window: {
            addEventListener: (evt, fn) => {
                sandbox.window._listeners = sandbox.window._listeners || {};
                sandbox.window._listeners[evt] = sandbox.window._listeners[evt] || [];
                sandbox.window._listeners[evt].push(fn);
            },
            dispatchEvent: (event) => {
                const list = sandbox.window._listeners?.[event.type] || [];
                list.forEach(fn => fn(event));
            },
            db: null,
            EventService: {
                normalizeDate: (d) => d,
                isEventFinished: (e) => e.status === 'finished'
            },
            CacheService: null
        },
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Date: Date
    };

    const code = fs.readFileSync(path.join(__dirname, '../js/modules/americanas/AmericanaService.js'), 'utf8');
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    const AmericanaServiceClass = sandbox.window.AmericanaServiceClass;
    assert('AmericanaServiceClass está definida', typeof AmericanaServiceClass === 'function');

    const service = new AmericanaServiceClass();
    assert('Tiene propiedad _cachedActiveEvents inicializada a null', service._cachedActiveEvents === null);
    assert('Tiene propiedad _lastEventsCacheTime inicializada a 0', service._lastEventsCacheTime === 0);
    assert('Tiene _eventsCacheTTL entre 45 y 60 segundos', service._eventsCacheTTL >= 45000 && service._eventsCacheTTL <= 60000);

    // Mock de Firestore con rastreador de consultas
    let queryLog = [];
    const mockFirestore = {
        collection: (name) => {
            queryLog.push({ action: 'collection', name });
            return {
                orderBy: (field, dir) => {
                    queryLog.push({ action: 'orderBy', field, dir });
                    return {
                        limit: (lim) => {
                            queryLog.push({ action: 'limit', lim });
                            return {
                                get: async () => {
                                    queryLog.push({ action: 'get' });
                                    if (name === 'americanas') {
                                        return {
                                            docs: [
                                                { id: 'am1', data: () => ({ name: 'Americana 1', date: '2026-09-27', time: '10:00', status: 'open' }) },
                                                { id: 'am2', data: () => ({ name: 'Americana Pasada', date: '2026-09-20', time: '10:00', status: 'finished' }) }
                                            ]
                                        };
                                    } else {
                                        return {
                                            docs: [
                                                { id: 'ent1', data: () => ({ name: 'Entreno 1', date: '2026-09-28', time: '18:00', status: 'open' }) }
                                            ]
                                        };
                                    }
                                }
                            };
                        }
                    };
                }
            };
        }
    };
    sandbox.window.db = mockFirestore;

    // Test 1: Primera llamada a getAllActiveEvents ejecuta consultas acotadas y filtra terminados
    const res1 = await service.getAllActiveEvents();
    assert('getAllActiveEvents devuelve eventos activos filtrados (sin finished)', res1.length === 2);
    assert('Evento activo 1 es Americana 1', res1.find(e => e.id === 'am1') !== undefined);
    assert('Evento finalizado fue excluido', res1.find(e => e.id === 'am2') === undefined);
    assert('Evento entreno está incluido y marcado como tipo entreno', res1.find(e => e.id === 'ent1')?.type === 'entreno');

    // Verificar que usó limit(40) y orderBy(date, desc)
    const limits = queryLog.filter(q => q.action === 'limit');
    assert('Las consultas a Firestore están acotadas con limit(40)', limits.length === 2 && limits[0].lim === 40);
    assert('Caché en memoria fue poblada', service._cachedActiveEvents !== null && service._cachedActiveEvents.length === 2);

    // Test 2: Segunda llamada inmediata utiliza caché en memoria (0 consultas adicionales)
    const initialQueryCount = queryLog.length;
    const res2 = await service.getAllActiveEvents();
    assert('Segunda llamada devuelve mismos resultados desde caché', res2.length === 2);
    assert('Segunda llamada NO realiza ninguna consulta a Firestore (0ms / 0 queries)', queryLog.length === initialQueryCount);

    // Test 3: forceRefresh salta la memoria caché
    const res3 = await service.getAllActiveEvents({ forceRefresh: true });
    assert('Llamada con forceRefresh: true ejecuta nueva consulta', queryLog.length > initialQueryCount);

    // Test 4: invalidateActiveEventsCache() limpia la memoria
    service.invalidateActiveEventsCache();
    assert('invalidateActiveEventsCache() resetea _cachedActiveEvents a null', service._cachedActiveEvents === null);
    assert('invalidateActiveEventsCache() resetea _lastEventsCacheTime a 0', service._lastEventsCacheTime === 0);

    // Test 5: eventModified evento global invalida la caché
    await service.getAllActiveEvents();
    assert('Caché poblada de nuevo', service._cachedActiveEvents !== null);
    sandbox.window.dispatchEvent({ type: 'eventModified' });
    assert('Evento eventModified disparó la invalidación de la caché', service._cachedActiveEvents === null);

    // Test 6: Retrocompatibilidad de getActiveAmericanas
    const amsOnly = await service.getActiveAmericanas();
    assert('getActiveAmericanas devuelve solo eventos tipo americana', amsOnly.length === 1 && amsOnly[0].id === 'am1');

    console.log("========================================================================");
    console.log(`📊 TOTAL PRUEBAS: ${passed + failed}`);
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLADAS: ${failed}`);
    console.log("========================================================================");

    if (failed > 0) process.exit(1);
}

runAmericanaServiceTests().catch(err => {
    console.error("FATAL ERROR EN TESTS:", err);
    process.exit(1);
});
