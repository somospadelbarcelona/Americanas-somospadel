/**
 * QA Test Suite: Verificación y Certificación de Duplicación de Eventos
 * Módulos: js/modules/admin-entrenos.js (duplicateEntreno) y js/modules/admin-americanas.js (duplicateAmericana)
 * Y sintaxis de admin.html
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function createMockEnvironment() {
    let createdPayload = null;
    let toastMessage = null;
    let toastType = null;
    let loadedAdminView = null;
    const eventsDb = {};

    const mockWindow = {
        _currentEntrenosCache: [],
        _currentAmericanasCache: [],
        _eventsDb: eventsDb,
        confirm: () => true,
        alert: (msg) => {
            toastMessage = msg;
            toastType = 'error';
        },
        NotificationService: {
            showToast: (msg, type) => {
                toastMessage = msg;
                toastType = type;
            }
        },
        EventService: {
            normalizeDate: (d) => {
                if (!d || typeof d !== 'string') return '';
                const clean = d.trim();
                if (clean.includes('/')) {
                    const parts = clean.split('/').map(p => p.trim());
                    if (parts.length >= 2) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : '2026';
                        return `${year}-${month}-${day}`;
                    }
                }
                return clean;
            },
            createEvent: async (type, data) => {
                createdPayload = { type, data: JSON.parse(JSON.stringify(data)) };
                return { id: 'new_id_123', ...data };
            },
            getAll: async () => [],
            getById: async (type, id) => {
                return eventsDb[id] || null;
            }
        },
        loadAdminView: (view) => {
            loadedAdminView = view;
        },
        AdminViews: {},
        AppConstants: {
            EVENT_TYPES: {
                ENTRENO: 'entreno',
                AMERICANA: 'americana'
            },
            STATUS: {
                OPEN: 'open'
            },
            DEFAULTS: {
                MAX_COURTS: 3,
                PRICE_MEMBERS: 0,
                PRICE_EXTERNAL: 0
            }
        },
        api: {},
        setInterval: (fn) => fn,
        clearInterval: () => {},
        setTimeout: (fn) => fn,
        clearTimeout: () => {},
        console: console
    };

    mockWindow.window = mockWindow;
    mockWindow.document = {
        getElementById: () => null
    };

    const ctx = vm.createContext(mockWindow);
    ctx.AppConstants = mockWindow.AppConstants;
    ctx.EventService = mockWindow.EventService;
    ctx.NotificationService = mockWindow.NotificationService;
    ctx.loadAdminView = mockWindow.loadAdminView;

    return {
        context: ctx,
        getCreatedPayload: () => createdPayload,
        resetCreatedPayload: () => { createdPayload = null; },
        getToast: () => ({ message: toastMessage, type: toastType }),
        resetToast: () => { toastMessage = null; toastType = null; },
        getView: () => loadedAdminView,
        setRemoteEvent: (id, evt) => { eventsDb[id] = evt; }
    };
}

const adminEntrenosCode = fs.readFileSync('js/modules/admin-entrenos.js', 'utf8');
const adminAmericanasCode = fs.readFileSync('js/modules/admin-americanas.js', 'utf8');
const adminHtmlCode = fs.readFileSync('admin.html', 'utf8');

console.log('🧪 [QA] INICIANDO CERTIFICACIÓN DE DUPLICACIÓN DE EVENTOS...');

// TEST 1: Carga y exposición de funciones
const envEntrenos = createMockEnvironment();
vm.runInContext(adminEntrenosCode, envEntrenos.context);
assert.strictEqual(typeof envEntrenos.context.window.duplicateEntreno, 'function');

const envAmericanas = createMockEnvironment();
vm.runInContext(adminAmericanasCode, envAmericanas.context);
assert.strictEqual(typeof envAmericanas.context.window.duplicateAmericana, 'function');
console.log('  ✅ T1: Funciones window.duplicateEntreno y window.duplicateAmericana expuestas correctamente.');

(async () => {
    // TEST 2: Evento con fecha en título DD/MM/YYYY y fecha YYYY-MM-DD
    const inputEvent = {
        id: 'entreno_old_01',
        _id: 'entreno_old_01',
        name: 'ENTRENO MIXTO 11/10/2026',
        date: '2026-10-11',
        time: '10:00',
        courts: 3,
        created_at: '2026-10-01T10:00:00Z',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-02T10:00:00Z',
        chat_id: 'chat_999',
        chatId: 'chat_999',
        matches: [{ id: 'm1' }],
        rounds: [1, 2],
        liveMatches: [{ id: 'lm1' }],
        classification: [{ player: 'Alex', pts: 10 }],
        results: { alex: 10 },
        current_round: 2,
        active_round: 2,
        currentRound: 2,
        round: 2,
        players: ['Alex', 'Juan'],
        registeredPlayers: ['Alex', 'Juan'],
        waitlist: ['Pedro'],
        fixed_pairs: [['Alex', 'Juan']],
        status: 'finished',
        someUndefinedField: undefined
    };

    await envEntrenos.context.window.duplicateEntreno(inputEvent);
    const result = envEntrenos.getCreatedPayload();

    assert.strictEqual(result.data.date, '2026-10-18');
    assert.strictEqual(result.data.name, 'ENTRENO MIXTO 18/10/2026');
    assert.ok(!result.data.name.includes('(Copia)'));
    assert.strictEqual(result.data.status, 'open');
    assert.deepStrictEqual(result.data.players, []);
    assert.deepStrictEqual(result.data.registeredPlayers, []);
    assert.deepStrictEqual(result.data.waitlist, []);
    assert.deepStrictEqual(result.data.fixed_pairs, []);

    const forbidden = [
        'id', '_id', 'created_at', 'createdAt', 'updatedAt',
        'chat_id', 'chatId', 'matches', 'rounds', 'liveMatches',
        'classification', 'results', 'current_round', 'active_round',
        'currentRound', 'round', 'someUndefinedField'
    ];
    for (const key of forbidden) {
        assert.strictEqual(result.data[key], undefined);
        assert.ok(!Object.prototype.hasOwnProperty.call(result.data, key));
    }
    console.log('  ✅ T2: Título con fecha "ENTRENO MIXTO 11/10/2026" migrado a "18/10/2026" sin (Copia) y payload limpio.');

    // TEST 3: Evento con fecha europea en campo date
    const inputEuro = {
        id: 'americana_euro_01',
        name: 'AMERICANA FEMENINA 11/10/2026',
        date: '11/10/2026',
        courts: 4,
        status: 'live'
    };
    await envAmericanas.context.window.duplicateAmericana(inputEuro);
    const resEuro = envAmericanas.getCreatedPayload();
    assert.strictEqual(resEuro.data.date, '2026-10-18');
    assert.strictEqual(resEuro.data.name, 'AMERICANA FEMENINA 18/10/2026');
    console.log('  ✅ T3: Fecha en formato europeo "11/10/2026" normalizada y sumada a "2026-10-18".');

    // TEST 4: Evento sin fecha en título añade (Copia) idénticamente e idempotentemente
    const inputNoDate = {
        id: 'ev_nodate',
        name: 'AMERICANA POZO INICIAL',
        date: '2026-10-11'
    };
    await envAmericanas.context.window.duplicateAmericana(inputNoDate);
    const resNoDate = envAmericanas.getCreatedPayload();
    assert.strictEqual(resNoDate.data.name, 'AMERICANA POZO INICIAL (Copia)');
    assert.strictEqual(resNoDate.data.date, '2026-10-18');

    await envAmericanas.context.window.duplicateAmericana(resNoDate.data);
    const resNoDate2 = envAmericanas.getCreatedPayload();
    assert.strictEqual(resNoDate2.data.name, 'AMERICANA POZO INICIAL (Copia)');
    assert.strictEqual(resNoDate2.data.date, '2026-10-25');
    console.log('  ✅ T4: Título sin fecha añade "(Copia)" de forma idempotente.');

    // TEST 5: Formatos DD/MM (ej. 10/10, 20/10, 05/10)
    const inputShort10 = { id: 's1', name: 'TORNEO 10/10', date: '2026-10-10' };
    await envEntrenos.context.window.duplicateEntreno(inputShort10);
    assert.strictEqual(envEntrenos.getCreatedPayload().data.name, 'TORNEO 17/10');

    const inputShort20 = { id: 's2', name: 'TORNEO 20/10', date: '2026-10-20' };
    await envEntrenos.context.window.duplicateEntreno(inputShort20);
    assert.strictEqual(envEntrenos.getCreatedPayload().data.name, 'TORNEO 27/10');
    console.log('  ✅ T5: Casos borde de días 10/10 y 20/10 procesados sin falso positivo ni sufijo "(Copia)".');

    // TEST 6: Bisiestos y cambio de año
    const inputLeap = { id: 'l1', name: 'EVENTO 25/02/2024', date: '2024-02-25' };
    await envEntrenos.context.window.duplicateEntreno(inputLeap);
    assert.strictEqual(envEntrenos.getCreatedPayload().data.date, '2024-03-03');
    assert.strictEqual(envEntrenos.getCreatedPayload().data.name, 'EVENTO 03/03/2024');

    const inputYearEnd = { id: 'y1', name: 'FIN DE AÑO 28/12/2026', date: '2026-12-28' };
    await envAmericanas.context.window.duplicateAmericana(inputYearEnd);
    assert.strictEqual(envAmericanas.getCreatedPayload().data.date, '2027-01-04');
    assert.strictEqual(envAmericanas.getCreatedPayload().data.name, 'FIN DE AÑO 04/01/2027');
    console.log('  ✅ T6: Cálculo exacto de años bisiestos y transición de fin de año.');

    // TEST 7: Resistencia a zonas horarias y DST
    const timezones = ['UTC', 'Europe/Madrid', 'America/New_York', 'Asia/Tokyo'];
    for (const tz of timezones) {
        process.env.TZ = tz;
        for (let m = 1; m <= 12; m++) {
            const mStr = String(m).padStart(2, '0');
            const testEv = { id: 'tz', name: `TEST ${mStr}`, date: `2026-${mStr}-10` };
            await envEntrenos.context.window.duplicateEntreno(testEv);
            const res = envEntrenos.getCreatedPayload();
            const dayNum = parseInt(res.data.date.split('-')[2], 10);
            assert.strictEqual(dayNum, 17, `Fallo en TZ ${tz} mes ${m}`);
        }
    }
    console.log('  ✅ T7: Resistencia a zonas horarias y transiciones DST verificada.');

    // TEST 8: Llamada pasando ID de string resolviendo desde cache local (_currentEntrenosCache y _currentAmericanasCache)
    envEntrenos.resetCreatedPayload();
    envEntrenos.context.window._currentEntrenosCache = [
        { id: 'entreno_cached_01', name: 'ENTRENO TÁCTICO 14/10/2026', date: '2026-10-14', courts: 3 }
    ];
    await envEntrenos.context.window.duplicateEntreno('entreno_cached_01');
    const resEntrenoCache = envEntrenos.getCreatedPayload();
    assert.ok(resEntrenoCache, 'El payload de duplicación de entreno desde cache no debe ser nulo');
    assert.strictEqual(resEntrenoCache.type, 'entreno');
    assert.strictEqual(resEntrenoCache.data.date, '2026-10-21');
    assert.strictEqual(resEntrenoCache.data.name, 'ENTRENO TÁCTICO 21/10/2026');

    envAmericanas.resetCreatedPayload();
    envAmericanas.context.window._currentAmericanasCache = [
        { id: 'americana_cached_01', name: 'AMERICANA NOCTURNA 14/10/2026', date: '2026-10-14', courts: 4 }
    ];
    await envAmericanas.context.window.duplicateAmericana('americana_cached_01');
    const resAmericanaCache = envAmericanas.getCreatedPayload();
    assert.ok(resAmericanaCache, 'El payload de duplicación de americana desde cache no debe ser nulo');
    assert.strictEqual(resAmericanaCache.type, 'americana');
    assert.strictEqual(resAmericanaCache.data.date, '2026-10-21');
    assert.strictEqual(resAmericanaCache.data.name, 'AMERICANA NOCTURNA 21/10/2026');
    console.log('  ✅ T8: Duplicación por ID string resolviendo desde cache local exitosa.');

    // TEST 9: Llamada pasando ID de string resolviendo fallback vía EventService.getById
    envEntrenos.resetCreatedPayload();
    envEntrenos.context.window._currentEntrenosCache = []; // Vacío para forzar fetch remoto
    envEntrenos.setRemoteEvent('entreno_remote_99', {
        id: 'entreno_remote_99',
        name: 'ENTRENO SUNDAY 01/11/2026',
        date: '2026-11-01',
        courts: 2
    });
    await envEntrenos.context.window.duplicateEntreno('entreno_remote_99');
    const resEntrenoRemote = envEntrenos.getCreatedPayload();
    assert.ok(resEntrenoRemote, 'El payload de duplicación de entreno remoto no debe ser nulo');
    assert.strictEqual(resEntrenoRemote.type, 'entreno');
    assert.strictEqual(resEntrenoRemote.data.date, '2026-11-08');
    assert.strictEqual(resEntrenoRemote.data.name, 'ENTRENO SUNDAY 08/11/2026');

    envAmericanas.resetCreatedPayload();
    envAmericanas.context.window._currentAmericanasCache = []; // Vacío para forzar fetch remoto
    envAmericanas.setRemoteEvent('americana_remote_99', {
        id: 'americana_remote_99',
        name: 'AMERICANA SUNDAY 01/11/2026',
        date: '2026-11-01',
        courts: 5
    });
    await envAmericanas.context.window.duplicateAmericana('americana_remote_99');
    const resAmericanaRemote = envAmericanas.getCreatedPayload();
    assert.ok(resAmericanaRemote, 'El payload de duplicación de americana remota no debe ser nulo');
    assert.strictEqual(resAmericanaRemote.type, 'americana');
    assert.strictEqual(resAmericanaRemote.data.date, '2026-11-08');
    assert.strictEqual(resAmericanaRemote.data.name, 'AMERICANA SUNDAY 08/11/2026');
    console.log('  ✅ T9: Duplicación por ID string resolviendo fallback vía EventService.getById exitosa.');

    // TEST 10: Llamada pasando objeto directamente (retrocompatibilidad)
    envEntrenos.resetCreatedPayload();
    const directEntrenoObj = {
        id: 'entreno_direct_77',
        name: 'ENTRENO DIRECT OBJ 05/12/2026',
        date: '2026-12-05',
        courts: 3
    };
    await envEntrenos.context.window.duplicateEntreno(directEntrenoObj);
    const resDirectEntreno = envEntrenos.getCreatedPayload();
    assert.strictEqual(resDirectEntreno.data.date, '2026-12-12');
    assert.strictEqual(resDirectEntreno.data.name, 'ENTRENO DIRECT OBJ 12/12/2026');

    envAmericanas.resetCreatedPayload();
    const directAmericanaObj = {
        id: 'americana_direct_77',
        name: 'AMERICANA DIRECT OBJ 05/12/2026',
        date: '2026-12-05',
        courts: 4
    };
    await envAmericanas.context.window.duplicateAmericana(directAmericanaObj);
    const resDirectAmericana = envAmericanas.getCreatedPayload();
    assert.strictEqual(resDirectAmericana.data.date, '2026-12-12');
    assert.strictEqual(resDirectAmericana.data.name, 'AMERICANA DIRECT OBJ 12/12/2026');
    console.log('  ✅ T10: Retrocompatibilidad pasando objeto de evento directamente verificada.');

    // TEST 11: Comprobación estática del botón en HTML de tarjetas
    const entrenoCardPattern = /onclick="window\.duplicateEntreno\('\$\{e\.id\}'\)"/;
    const americanaCardPattern = /onclick="window\.duplicateAmericana\('\$\{e\.id\}'\)"/;

    assert.ok(entrenoCardPattern.test(adminEntrenosCode), 
        "js/modules/admin-entrenos.js debe contener onclick=\"window.duplicateEntreno('${e.id}')\"");
    assert.ok(americanaCardPattern.test(adminAmericanasCode), 
        "js/modules/admin-americanas.js debe contener onclick=\"window.duplicateAmericana('${e.id}')\"");

    // Asegurar que no se usa JSON.stringify inline inseguro para duplicar en ninguno de los dos
    assert.ok(!adminEntrenosCode.includes('duplicateEntreno(${JSON.stringify(e)}'), 
        "js/modules/admin-entrenos.js no debe contener JSON.stringify inline en duplicateEntreno");
    assert.ok(!adminAmericanasCode.includes('duplicateAmericana(${JSON.stringify(e)}'), 
        "js/modules/admin-americanas.js no debe contener JSON.stringify inline en duplicateAmericana");
    console.log('  ✅ T11: Marcado HTML en tarjetas de Entrenos y Americanas verificado: uso de ID seguro.');

    // TEST 12: Manejo de errores cuando el ID no existe o argumentos inválidos
    envEntrenos.resetCreatedPayload();
    envEntrenos.resetToast();
    await envEntrenos.context.window.duplicateEntreno('non_existent_id');
    assert.strictEqual(envEntrenos.getCreatedPayload(), null, 'No debe crear evento si el ID no existe');
    assert.strictEqual(envEntrenos.getToast().type, 'error');

    envAmericanas.resetCreatedPayload();
    envAmericanas.resetToast();
    await envAmericanas.context.window.duplicateAmericana('non_existent_id');
    assert.strictEqual(envAmericanas.getCreatedPayload(), null, 'No debe crear evento si el ID no existe');
    assert.strictEqual(envAmericanas.getToast().type, 'error');

    // Comprobación de argumento undefined / null / vacío
    envEntrenos.resetCreatedPayload();
    await envEntrenos.context.window.duplicateEntreno(null);
    assert.strictEqual(envEntrenos.getCreatedPayload(), null);

    envAmericanas.resetCreatedPayload();
    await envAmericanas.context.window.duplicateAmericana(null);
    assert.strictEqual(envAmericanas.getCreatedPayload(), null);
    console.log('  ✅ T12: Manejo de errores y argumentos inválidos validado.');

    // TEST 13: Comprobación sintáctica de admin-entrenos.js, admin-americanas.js y admin.html
    new vm.Script(adminEntrenosCode, { filename: 'admin-entrenos.js' });
    new vm.Script(adminAmericanasCode, { filename: 'admin-americanas.js' });
    
    // Validar sintaxis de todos los bloques <script> inline de admin.html
    const scriptTagRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let inlineCount = 0;
    while ((match = scriptTagRegex.exec(adminHtmlCode)) !== null) {
        inlineCount++;
        const inlineCode = match[1];
        if (inlineCode.trim()) {
            new vm.Script(inlineCode, { filename: `admin.html_inline_${inlineCount}.js` });
        }
    }
    assert.ok(inlineCount > 0, 'admin.html debe contener scripts');
    console.log(`  ✅ T13: Sintaxis verificada al 100% en admin-entrenos.js, admin-americanas.js y ${inlineCount} scripts inline de admin.html.`);

    console.log('\n🏆 [QA CERTIFICACIÓN] TODOS LOS TESTS PASARON AL 100% (13/13)');
})().catch(err => {
    console.error('❌ ERROR:', err);
    process.exit(1);
});
