/**
 * test-weather-radar-complete-qa.js
 * 
 * 🏆 SUITE DE VALIDACIÓN Y CONTROL DE CALIDAD (QA) INTEGRAL
 * Funcionalidad: "6. 📊 Radar de Climatología Avanzado & Alertas de Lluvia"
 * SomosPádel Barcelona
 * 
 * Módulos auditados:
 * 1. js/modules/common/WeatherService.js
 * 2. js/modules/common/EventWeatherModal.js
 * 3. js/modules/americanas/EventsController_V6.js
 * 4. index.html & admin.html (inclusión de scripts y referencias)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log("================================================================================");
console.log(" 🏆 AUDITORÍA QA: RADAR DE CLIMATOLOGÍA AVANZADO & ALERTAS DE LLUVIA");
console.log("    SomosPádel BCN - Control de Calidad y Estabilidad Técnica");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;
const testResults = [];

async function test(group, name, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] [${group}] ${name}`);
        passedCount++;
        testResults.push({ group, name, passed: true });
    } catch (err) {
        console.error(`  ❌ [FAIL] [${group}] ${name}`);
        console.error(`     Error: ${err.message}`);
        if (err.stack) {
            const stackLine = err.stack.split('\n')[1];
            if (stackLine) console.error(`    ${stackLine.trim()}`);
        }
        failedCount++;
        testResults.push({ group, name, passed: false, error: err.message });
    }
}

// ================================================================================
// MOCK ENVIRONMENT SETUP (DOM, Storage, NotificationService, Window)
// ================================================================================

class MockStorage {
    constructor() {
        this.store = new Map();
    }
    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }
    setItem(key, value) {
        this.store.set(key, String(value));
    }
    removeItem(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
}

class MockElement {
    constructor(tagName = 'div', id = '') {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.className = '';
        this.innerHTML = '';
        this.textContent = '';
        this.style = {};
        this.disabled = false;
        this.children = [];
        this.parentNode = null;
        this.attributes = new Map();
        this.listeners = new Map();
        this.classList = {
            _classes: new Set(),
            add: (c) => this.classList._classes.add(c),
            remove: (c) => this.classList._classes.delete(c),
            contains: (c) => this.classList._classes.has(c),
            toggle: (c) => {
                if (this.classList._classes.has(c)) this.classList._classes.delete(c);
                else this.classList._classes.add(c);
            }
        };
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) || null; }
    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }
    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
            this.children.splice(idx, 1);
            child.parentNode = null;
        }
        return child;
    }
    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }
    addEventListener(evt, fn) {
        if (!this.listeners.has(evt)) this.listeners.set(evt, []);
        this.listeners.get(evt).push(fn);
    }
    removeEventListener(evt, fn) {
        if (this.listeners.has(evt)) {
            this.listeners.set(evt, this.listeners.get(evt).filter(f => f !== fn));
        }
    }
    dispatchEvent(evt) {
        const fns = this.listeners.get(evt.type) || [];
        fns.forEach(fn => fn(evt));
    }
    querySelector(selector) {
        // Selector sencillo por ID o clase
        if (selector.startsWith('#')) {
            const searchId = selector.substring(1);
            if (this.id === searchId) return this;
            for (const child of this.children) {
                if (child.querySelector) {
                    const res = child.querySelector(selector);
                    if (res) return res;
                }
            }
        }
        if (selector.startsWith('.')) {
            const cls = selector.substring(1);
            if (this.className.includes(cls) || this.classList.contains(cls)) return this;
            for (const child of this.children) {
                if (child.querySelector) {
                    const res = child.querySelector(selector);
                    if (res) return res;
                }
            }
        }
        return null;
    }
}

class MockDocument {
    constructor() {
        this.body = new MockElement('body', 'mock-body');
        this.head = new MockElement('head', 'mock-head');
        this.listeners = new Map();
        this._elementsById = new Map();
    }
    createElement(tag) {
        return new MockElement(tag);
    }
    getElementById(id) {
        // Buscar en mapa o recursivamente en body y head
        const findInTree = (node) => {
            if (node.id === id) return node;
            for (const ch of node.children) {
                const f = findInTree(ch);
                if (f) return f;
            }
            return null;
        };
        return findInTree(this.body) || findInTree(this.head) || this._elementsById.get(id) || null;
    }
    addEventListener(evt, fn) {
        if (!this.listeners.has(evt)) this.listeners.set(evt, []);
        this.listeners.get(evt).push(fn);
    }
    removeEventListener(evt, fn) {
        if (this.listeners.has(evt)) {
            this.listeners.set(evt, this.listeners.get(evt).filter(f => f !== fn));
        }
    }
    triggerKeyDown(key) {
        const fns = this.listeners.get('keydown') || [];
        fns.forEach(fn => fn({ key }));
    }
}

// ================================================================================
// EJECUCIÓN DE PRUEBAS
// ================================================================================

async function runWeatherRadarSuite() {

    // ----------------------------------------------------------------------------
    // GRUPO 1: SINTAXIS Y REFERENCIAS DE ARCHIVOS
    // ----------------------------------------------------------------------------
    await test("Integridad", "Los archivos JS requeridos existen físicamente", () => {
        assert.ok(fs.existsSync(path.resolve(__dirname, '../js/modules/common/WeatherService.js')), 'WeatherService.js debe existir');
        assert.ok(fs.existsSync(path.resolve(__dirname, '../js/modules/common/EventWeatherModal.js')), 'EventWeatherModal.js debe existir');
        assert.ok(fs.existsSync(path.resolve(__dirname, '../js/modules/americanas/EventsController_V6.js')), 'EventsController_V6.js debe existir');
    });

    await test("Integridad", "index.html y admin.html incluyen WeatherService y EventWeatherModal", () => {
        const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
        const adminHtml = fs.readFileSync(path.resolve(__dirname, '../admin.html'), 'utf8');

        assert.ok(indexHtml.includes('js/modules/common/WeatherService.js'), 'index.html debe cargar WeatherService.js');
        assert.ok(indexHtml.includes('js/modules/common/EventWeatherModal.js'), 'index.html debe cargar EventWeatherModal.js');
        assert.ok(adminHtml.includes('js/modules/common/WeatherService.js'), 'admin.html debe cargar WeatherService.js');
        assert.ok(adminHtml.includes('js/modules/common/EventWeatherModal.js'), 'admin.html debe cargar EventWeatherModal.js');
    });

    // Cargar WeatherService directamente
    const WeatherService = require('../js/modules/common/WeatherService.js');

    // ----------------------------------------------------------------------------
    // GRUPO 2: GEOLOCALIZACIÓN DE SEDES Y RESOLUCIÓN INTELIGENTE
    // ----------------------------------------------------------------------------
    await test("Geolocalización", "Resuelve sede Cornellà correctamente por string y objeto", () => {
        const loc1 = WeatherService.resolveLocation("Padel Cornellà Indoor");
        assert.strictEqual(loc1.name, 'CORNELLÀ');
        assert.strictEqual(loc1.lat, 41.3574);
        assert.strictEqual(loc1.lon, 2.0707);

        const loc2 = WeatherService.resolveLocation({ sede: "Cornellà de Llobregat" });
        assert.strictEqual(loc2.name, 'CORNELLÀ');
        assert.strictEqual(loc2.lat, 41.3574);

        const loc3 = WeatherService.resolveLocation({ club: "Club Padel Cornella" });
        assert.strictEqual(loc3.name, 'CORNELLÀ');
    });

    await test("Geolocalización", "Resuelve sede El Prat de Llobregat correctamente por string y objeto", () => {
        const loc1 = WeatherService.resolveLocation("Padel El Prat Exterior");
        assert.strictEqual(loc1.name, 'EL PRAT');
        assert.strictEqual(loc1.lat, 41.3278);
        assert.strictEqual(loc1.lon, 2.0947);

        const loc2 = WeatherService.resolveLocation({ venue: "Sede Prat" });
        assert.strictEqual(loc2.name, 'EL PRAT');
    });

    await test("Geolocalización", "Conserva coordenadas numéricas explícitas si se suministran", () => {
        const customLoc = WeatherService.resolveLocation({ lat: 41.401, lon: 2.185, name: 'Sede Diagonal' });
        assert.strictEqual(customLoc.lat, 41.401);
        assert.strictEqual(customLoc.lon, 2.185);
        assert.strictEqual(customLoc.name, 'Sede Diagonal');

        const customLoc2 = WeatherService.resolveLocation({ latitude: 41.38, longitude: 2.12 });
        assert.strictEqual(customLoc2.lat, 41.38);
        assert.strictEqual(customLoc2.lon, 2.12);
    });

    await test("Geolocalización", "Fallback seguro a El Prat ante sedes desconocidas, null o vacío", () => {
        const fallback1 = WeatherService.resolveLocation(null);
        assert.strictEqual(fallback1.name, 'EL PRAT');
        assert.strictEqual(fallback1.lat, 41.3278);

        const fallback2 = WeatherService.resolveLocation("Sede Desconocida Sin Mapeo");
        assert.strictEqual(fallback2.name, 'EL PRAT');

        const fallback3 = WeatherService.resolveLocation({});
        assert.strictEqual(fallback3.name, 'EL PRAT');
    });

    // ----------------------------------------------------------------------------
    // GRUPO 3: PARSING DE FECHA Y FRANJA HORARIA (CON BUFFER DE CALENTAMIENTO)
    // ----------------------------------------------------------------------------
    await test("Tramo Horario", "Normalización de fechas a formato YYYY-MM-DD", () => {
        assert.strictEqual(WeatherService._normalizeDate('2026-09-28'), '2026-09-28');
        assert.strictEqual(WeatherService._normalizeDate('28/09/2026'), '2026-09-28');
        assert.strictEqual(WeatherService._normalizeDate('28-09-2026'), '2026-09-28');
        
        const dateObj = new Date(2026, 8, 28);
        assert.strictEqual(WeatherService._normalizeDate(dateObj), '2026-09-28');

        // Fecha por defecto no vacía
        assert.match(WeatherService._normalizeDate(null), /^\d{4}-\d{2}-\d{2}$/);
    });

    await test("Tramo Horario", "Extracción numérica de hora segura", () => {
        assert.strictEqual(WeatherService._extractHour('18:30'), 18);
        assert.strictEqual(WeatherService._extractHour('09:00'), 9);
        assert.strictEqual(WeatherService._extractHour(20), 20);
        assert.strictEqual(WeatherService._extractHour(null, 19), 19);
        assert.strictEqual(WeatherService._extractHour('horario-invalido', 18), 18);
        assert.strictEqual(WeatherService._extractHour('25:00', 18), 23); // Acotado a 23
    });

    // ----------------------------------------------------------------------------
    // GRUPO 4: PREDICCIÓN HORARIA EXACTA, BUFFER ±1H Y MÉTRICAS
    // ----------------------------------------------------------------------------
    await test("Predicción Horaria", "Extracción de ventana exacta con 1h antes (calentamiento) y 1h después", async () => {
        // Mock de Open-Meteo API response para 7 días
        const mockHourlyTimes = [];
        const mockTemps = [];
        const mockHums = [];
        const mockProbs = [];
        const mockPrecips = [];
        const mockCodes = [];
        const mockWinds = [];
        const mockGusts = [];

        const testDate = '2026-09-28';
        for (let h = 0; h < 24; h++) {
            const hStr = String(h).padStart(2, '0');
            mockHourlyTimes.push(`${testDate}T${hStr}:00`);
            mockTemps.push(20 + Math.sin(h / 3) * 5); // 15-25°C
            mockHums.push(60);
            mockProbs.push(h === 19 ? 75 : 15);      // 75% a las 19:00
            mockPrecips.push(h === 19 ? 1.8 : 0);
            mockCodes.push(h === 19 ? 61 : 1);       // 61 = Lluvia débil
            mockWinds.push(18);
            mockGusts.push(26);
        }

        // Interceptar fetch en el entorno
        const originalFetch = global.fetch;
        global.fetch = async (url) => {
            return {
                ok: true,
                json: async () => ({
                    hourly: {
                        time: mockHourlyTimes,
                        temperature_2m: mockTemps,
                        relative_humidity_2m: mockHums,
                        precipitation_probability: mockProbs,
                        precipitation: mockPrecips,
                        weather_code: mockCodes,
                        wind_speed_10m: mockWinds,
                        wind_gusts_10m: mockGusts
                    }
                })
            };
        };

        try {
            // Evento de 18:00 a 20:00 (inicio 18, fin 20)
            const eventDoc = {
                id: 'evt_qa_001',
                sede: 'EL PRAT',
                date: testDate,
                time: '18:00',
                time_end: '20:00'
            };

            const forecast = await WeatherService.getEventWeatherForecast(eventDoc);

            assert.strictEqual(forecast.isFallback, false);
            assert.strictEqual(forecast.location.name, 'EL PRAT');
            assert.strictEqual(forecast.timeRange, '18:00 - 20:00');
            assert.strictEqual(forecast.bufferRange, '17:00 - 21:00'); // 1h antes (17) y 1h después (21)

            // Debe contener 5 horas analizadas: 17:00, 18:00, 19:00, 20:00, 21:00
            assert.strictEqual(forecast.hours.length, 5);
            assert.strictEqual(forecast.hours[0].hour, '17:00');
            assert.strictEqual(forecast.hours[0].isEventWindow, false); // Buffer pre
            assert.strictEqual(forecast.hours[1].hour, '18:00');
            assert.strictEqual(forecast.hours[1].isEventWindow, true);  // Partido
            assert.strictEqual(forecast.hours[2].hour, '19:00');
            assert.strictEqual(forecast.hours[2].isEventWindow, true);  // Partido (pico lluvia)
            assert.strictEqual(forecast.hours[3].hour, '20:00');
            assert.strictEqual(forecast.hours[3].isEventWindow, true);  // Partido
            assert.strictEqual(forecast.hours[4].hour, '21:00');
            assert.strictEqual(forecast.hours[4].isEventWindow, false); // Buffer post

            // Validar métricas extraídas en cada hora
            forecast.hours.forEach(h => {
                assert.ok(typeof h.temp === 'number', 'temp debe ser numérico');
                assert.ok(typeof h.rainProb === 'number', 'rainProb debe ser numérico');
                assert.ok(typeof h.windSpeed === 'number', 'windSpeed debe ser numérico');
                assert.ok(typeof h.windGusts === 'number', 'windGusts debe ser numérico');
                assert.ok(typeof h.icon === 'string', 'icon debe ser string emoji');
                assert.ok(typeof h.condition === 'string', 'condition debe ser texto descriptivo');
            });

            // maxRainProb en la ventana de juego debe ser 75%
            assert.strictEqual(forecast.maxRainProb, 75);
            // Nivel de riesgo debe ser 'high' porque maxRainProb >= 70%
            assert.strictEqual(forecast.riskLevel, 'high');
            assert.strictEqual(forecast.isIndoorRecommended, true);
        } finally {
            global.fetch = originalFetch;
        }
    });

    // ----------------------------------------------------------------------------
    // GRUPO 5: EVALUACIÓN DE NIVELES DE RIESGO Y FÍSICA DE BOLA (PADEL SCIENCE)
    // ----------------------------------------------------------------------------
    await test("Padel Science", "Nivel de riesgo meteorológico (safe, moderate, high)", () => {
        // Test directo de heurística en calculatePadelIntelligence
        const safeData = { temp: 22, humidity: 55, pressure: 1013, wind: 10, rain: 5, uv: 3, isDay: 1, weatherCode: 0 };
        const safeIntel = WeatherService.calculatePadelIntelligence(safeData);
        assert.ok(safeIntel.score >= 80, `Puntaje debe ser óptimo (>80), obtenido: ${safeIntel.score}`);
        assert.strictEqual(safeIntel.gripStatus, 'SECO');

        // Viento fuerte
        const windyData = { temp: 20, humidity: 50, pressure: 1013, wind: 32, rain: 0, uv: 2, isDay: 1, weatherCode: 1 };
        const windyIntel = WeatherService.calculatePadelIntelligence(windyData);
        assert.ok(windyIntel.recommendation.includes('Vendaval') || windyIntel.recommendation.includes('abajo'));

        // Lluvia activa
        const rainData = { temp: 18, humidity: 90, pressure: 1010, wind: 15, rain: 80, uv: 0, isDay: 1, weatherCode: 65 };
        const rainIntel = WeatherService.calculatePadelIntelligence(rainData);
        assert.strictEqual(rainIntel.gripStatus, 'HÚMEDO');
        assert.ok(rainIntel.recommendation.includes('indoor') || rainIntel.recommendation.includes('mojada') || rainIntel.recommendation.includes('impracticable'));
    });

    await test("Padel Science", "Física de bola: rápida con calor (>26°C), lenta con frío (<14°C)", async () => {
        const makeForecastMock = (temp, hum) => ({
            time: ['2026-09-28T18:00', '2026-09-28T19:00', '2026-09-28T20:00'],
            temperature_2m: [temp, temp, temp],
            relative_humidity_2m: [hum, hum, hum],
            precipitation_probability: [10, 10, 10],
            precipitation: [0, 0, 0],
            weather_code: [0, 0, 0],
            wind_speed_10m: [10, 10, 10],
            wind_gusts_10m: [14, 14, 14]
        });

        // 1. Calor
        const origCache = WeatherService._getWeatherCache;
        WeatherService._getWeatherCache = () => makeForecastMock(28, 50);
        try {
            const fcHeat = await WeatherService.getEventWeatherForecast({ date: '2026-09-28', time: '18:00' });
            assert.strictEqual(fcHeat.ballPhysics.speed, 'RÁPIDA');
            assert.strictEqual(fcHeat.ballPhysics.reactivity, 'Muy Alta');
            assert.ok(fcHeat.ballPhysics.description.includes('viva y rápida'));

            // 2. Frío y humedad
            WeatherService._getWeatherCache = () => makeForecastMock(10, 88);
            const fcCold = await WeatherService.getEventWeatherForecast({ date: '2026-09-28', time: '18:00' });
            assert.strictEqual(fcCold.ballPhysics.speed, 'LENTA');
            assert.strictEqual(fcCold.ballPhysics.reactivity, 'Baja');
            assert.ok(fcCold.ballPhysics.description.includes('pesada'));
            assert.ok(fcCold.ballPhysics.description.includes('resbaladizos'));
        } finally {
            WeatherService._getWeatherCache = origCache;
        }
    });

    // ----------------------------------------------------------------------------
    // GRUPO 6: DETECCIÓN DE AVISO PREVENTIVO (LLUVIA >= 70%)
    // ----------------------------------------------------------------------------
    await test("Aviso Preventivo", "checkPreventiveAlert activa alerta si lluvia >= 70%", async () => {
        const mockForecastHighRain = {
            maxRainProb: 75,
            riskLevel: 'high',
            location: { name: 'CORNELLÀ' }
        };

        // Evento con forceCheck activado para validar la lógica pura
        const checkResult = await WeatherService.checkPreventiveAlert(
            { id: 'evt_test', time: '18:00', date: '2026-09-28' },
            { forecast: mockForecastHighRain, forceCheck: true }
        );

        assert.strictEqual(checkResult.alertNeeded, true);
        assert.strictEqual(checkResult.alertType, 'RAIN_RISK');
        assert.strictEqual(checkResult.maxRainProb, 75);
        assert.ok(checkResult.message.includes('75% de lluvia prevista'));
        assert.ok(checkResult.message.includes('CORNELLÀ'));
    });

    await test("Aviso Preventivo", "checkPreventiveAlert NO activa alerta si lluvia < 70%", async () => {
        const mockForecastLowRain = {
            maxRainProb: 45,
            riskLevel: 'moderate',
            location: { name: 'EL PRAT' }
        };

        const checkResult = await WeatherService.checkPreventiveAlert(
            { id: 'evt_test', time: '18:00', date: '2026-09-28' },
            { forecast: mockForecastLowRain, forceCheck: true }
        );

        assert.strictEqual(checkResult.alertNeeded, false);
        assert.strictEqual(checkResult.maxRainProb, 45);
    });

    // ----------------------------------------------------------------------------
    // GRUPO 7: ENVÍO DE AVISO, INTEGRACIÓN NOTIFICATION SERVICE Y ANTI-SPAM
    // ----------------------------------------------------------------------------
    await test("Aviso Preventivo", "sendPreventiveAlert notifica e implementa bloqueo anti-spam de 2 horas", async () => {
        // Limpiar storage de tests previos
        WeatherService._memoryStorage.clear();

        const mockEvent = {
            id: 'evt_rain_qa_999',
            sede: 'Cornellà Indoor',
            time: '19:00',
            players: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]
        };

        const mockForecast = {
            maxRainProb: 85,
            location: { name: 'CORNELLÀ' }
        };

        // 1. Primer envío -> Debe tener éxito
        const res1 = await WeatherService.sendPreventiveAlert(mockEvent, mockForecast);
        assert.strictEqual(res1.success, true);
        assert.strictEqual(res1.notifiedCount, 4);
        assert.strictEqual(res1.notificationPayload.maxRainProb, 85);
        assert.strictEqual(res1.notificationPayload.type, 'weather_alert');

        // 2. Segundo envío inmediato (< 2 horas) -> Debe ser bloqueado por anti-spam
        const res2 = await WeatherService.sendPreventiveAlert(mockEvent, mockForecast);
        assert.strictEqual(res2.success, false);
        assert.strictEqual(res2.reason, 'ALREADY_SENT_RECENTLY');
        assert.strictEqual(res2.notifiedCount, 0);

        // 3. Simular que transcurrieron 2 horas y 5 minutos (125 minutos)
        const alertKey = `sp_rain_alert_sent_${mockEvent.id}`;
        const pastTimestamp = Date.now() - (125 * 60 * 1000);
        WeatherService._storageSet(alertKey, pastTimestamp.toString());

        // 4. Tercer envío tras 2 horas -> Debe volver a permitirse
        const res3 = await WeatherService.sendPreventiveAlert(mockEvent, mockForecast);
        assert.strictEqual(res3.success, true);
        assert.strictEqual(res3.notifiedCount, 4);
    });

    await test("Aviso Preventivo", "Integración transparente con window.NotificationService", async () => {
        WeatherService._memoryStorage.clear();

        let toastCalled = false;
        let eventNotificationCalled = false;

        global.window = {
            NotificationService: {
                showInAppToast: (title, msg, type) => {
                    toastCalled = true;
                    assert.ok(title.includes('AVISO PREVENTIVO'));
                    assert.strictEqual(type, 'weather');
                },
                createEventNotification: (payload) => {
                    eventNotificationCalled = true;
                    assert.strictEqual(payload.type, 'weather_alert');
                }
            }
        };

        try {
            const res = await WeatherService.sendPreventiveAlert(
                { id: 'evt_notif_test', sede: 'EL PRAT', time: '18:00' },
                { maxRainProb: 80, location: { name: 'EL PRAT' } }
            );

            assert.strictEqual(res.success, true);
            assert.strictEqual(toastCalled, true, 'Debe invocar showInAppToast');
            assert.strictEqual(eventNotificationCalled, true, 'Debe invocar createEventNotification');
        } finally {
            delete global.window;
        }
    });

    // ----------------------------------------------------------------------------
    // GRUPO 8: ESCANEO DE EVENTOS PRÓXIMOS (scanAllUpcomingEvents)
    // ----------------------------------------------------------------------------
    await test("Escaneo Global", "scanAllUpcomingEvents identifica y prioriza eventos con riesgo de lluvia", async () => {
        const todayStr = WeatherService._normalizeDate(new Date());

        const origGetForecast = WeatherService.getEventWeatherForecast;
        WeatherService.getEventWeatherForecast = async (evt) => {
            if (evt.id === 'evt_safe') {
                return { riskLevel: 'safe', maxRainProb: 10, isIndoorRecommended: false };
            }
            if (evt.id === 'evt_mod') {
                return { riskLevel: 'moderate', maxRainProb: 45, isIndoorRecommended: false, tacticalAdvice: 'Posible llovizna' };
            }
            if (evt.id === 'evt_high') {
                return { riskLevel: 'high', maxRainProb: 80, isIndoorRecommended: true, tacticalAdvice: 'Lluvia intensa' };
            }
            return { riskLevel: 'safe', maxRainProb: 5 };
        };

        try {
            const dateSafe = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const dateMod = new Date(Date.now() + 4 * 60 * 60 * 1000);
            const dateHigh = new Date(Date.now() + 6 * 60 * 60 * 1000);

            const events = [
                { id: 'evt_safe', date: WeatherService._normalizeDate(dateSafe), time: `${String(dateSafe.getHours()).padStart(2, '0')}:00` },
                { id: 'evt_mod', date: WeatherService._normalizeDate(dateMod), time: `${String(dateMod.getHours()).padStart(2, '0')}:00` },
                { id: 'evt_high', date: WeatherService._normalizeDate(dateHigh), time: `${String(dateHigh.getHours()).padStart(2, '0')}:00` }
            ];

            const riskyEvents = await WeatherService.scanAllUpcomingEvents(events);

            // Debe excluir evt_safe y ordenar evt_high antes que evt_mod
            assert.strictEqual(riskyEvents.length, 2);
            assert.strictEqual(riskyEvents[0].event.id, 'evt_high');
            assert.strictEqual(riskyEvents[0].riskLevel, 'high');
            assert.strictEqual(riskyEvents[1].event.id, 'evt_mod');
            assert.strictEqual(riskyEvents[1].riskLevel, 'moderate');
        } finally {
            WeatherService.getEventWeatherForecast = origGetForecast;
        }
    });

    // ----------------------------------------------------------------------------
    // GRUPO 9: INTEGRACIÓN EN EVENTSCONTROLLER Y TAG METEOROLÓGICO
    // ----------------------------------------------------------------------------
    await test("EventsController Tag", "renderWeatherRadarTag genera tag dinámico en tarjeta de evento", () => {
        // Cargar EventsController en sandbox con entorno mock
        const code = fs.readFileSync(path.resolve(__dirname, '../js/modules/americanas/EventsController_V6.js'), 'utf8');
        const mockDoc = new MockDocument();
        const sandbox = {
            window: {},
            document: mockDoc,
            localStorage: new MockStorage(),
            db: { collection: () => ({ onSnapshot: () => () => {}, doc: () => ({ onSnapshot: () => () => {} }) }) },
            console: { log: () => {}, warn: () => {}, error: () => {} },
            Date: Date,
            WeatherService: WeatherService,
            setTimeout: (fn) => setTimeout(fn, 10),
            clearTimeout: clearTimeout,
            setInterval: () => 123,
            clearInterval: clearInterval
        };
        sandbox.window = sandbox;
        sandbox.window.db = sandbox.db;
        sandbox.window.WeatherService = WeatherService;

        vm.runInNewContext(code, sandbox);

        const controller = sandbox.EventsController;
        assert.ok(controller, 'EventsController debe inicializarse');
        assert.strictEqual(typeof controller.renderWeatherRadarTag, 'function');
        assert.strictEqual(typeof controller.openEventWeather, 'function');

        // 1. Tag normal (clima favorable)
        const normalEvt = { id: 'evt_normal_1', weatherTemp: 22, weatherRainProb: 15 };
        const normalTag = controller.renderWeatherRadarTag(normalEvt, false);
        assert.ok(normalTag.includes('22ºC • RADAR'), 'Debe mostrar temperatura y RADAR');
        assert.ok(normalTag.includes("openEventWeather('evt_normal_1')"), 'Debe enlazar openEventWeather con el id');
        assert.ok(!normalTag.includes('LLUVIA • RADAR'), 'No debe mostrar alerta de lluvia');

        // 2. Tag con alerta activa de lluvia (>=70% o high)
        const rainyEvt = { id: 'evt_rainy_2', weatherRainProb: 80, weatherRiskLevel: 'high' };
        const rainyTag = controller.renderWeatherRadarTag(rainyEvt, true);
        assert.ok(rainyTag.includes('80% LLUVIA • RADAR'), 'Debe destacar 80% LLUVIA • RADAR');
        assert.ok(rainyTag.includes('rgba(239, 68, 68'), 'Debe usar tono rojo de alerta');

        // 3. Manejador global window.openEventWeather
        assert.strictEqual(typeof sandbox.window.openEventWeather, 'function');
    });

    // ----------------------------------------------------------------------------
    // GRUPO 10: CICLO DE VIDA Y ACCIONES DEL MODAL EVENTWEATHERMODAL
    // ----------------------------------------------------------------------------
    await test("EventWeatherModal", "Ciclo de vida completo: open, render, windy, push alert, close", async () => {
        // Cargar EventWeatherModal en sandbox
        const modalCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/common/EventWeatherModal.js'), 'utf8');
        const mockDoc = new MockDocument();
        const mockStorage = new MockStorage();

        const sandbox = {
            window: {},
            document: mockDoc,
            localStorage: mockStorage,
            console: console,
            Date: Date,
            WeatherService: WeatherService,
            setTimeout: (fn, delay) => {
                // Ejecución inmediata controlada para tests
                fn();
                return 1;
            },
            clearTimeout: clearTimeout,
            encodeURIComponent: encodeURIComponent
        };
        sandbox.window = sandbox;
        sandbox.window.document = mockDoc;
        sandbox.window.WeatherService = WeatherService;

        vm.runInNewContext(modalCode, sandbox);

        const modal = sandbox.EventWeatherModal;
        assert.ok(modal, 'EventWeatherModal debe existir globalmente');
        assert.strictEqual(typeof modal.open, 'function');
        assert.strictEqual(typeof modal.close, 'function');

        // 1. Abrir modal para un evento con riesgo de lluvia
        const testEvent = {
            id: 'evt_modal_qa',
            name: 'Americana Nocturna Viernes',
            sede: 'Cornellà',
            date: '2026-09-28',
            time: '19:00',
            time_end: '21:00',
            players: [{ name: 'Carlos' }, { name: 'Laura' }]
        };

        // Forzar pronóstico representativo
        const origGetForecast = WeatherService.getEventWeatherForecast;
        WeatherService.getEventWeatherForecast = async () => ({
            location: { name: 'CORNELLÀ', lat: 41.3574, lon: 2.0707 },
            date: '2026-09-28',
            timeRange: '19:00 - 21:00',
            bufferRange: '18:00 - 22:00',
            hours: [
                { hour: '18:00', isEventWindow: false, temp: 22, rainProb: 20, windSpeed: 14, windGusts: 18, icon: '🌤️', condition: 'Despejado' },
                { hour: '19:00', isEventWindow: true, temp: 21, rainProb: 75, windSpeed: 22, windGusts: 32, icon: '🌧️', condition: 'Lluvia Moderada' },
                { hour: '20:00', isEventWindow: true, temp: 20, rainProb: 80, windSpeed: 20, windGusts: 28, icon: '🌧️', condition: 'Lluvia Moderada' },
                { hour: '21:00', isEventWindow: true, temp: 19, rainProb: 60, windSpeed: 16, windGusts: 22, icon: '🌦️', condition: 'Chubascos' },
                { hour: '22:00', isEventWindow: false, temp: 18, rainProb: 15, windSpeed: 12, windGusts: 16, icon: '🌙', condition: 'Despejado' }
            ],
            maxRainProb: 80,
            avgWind: 21,
            maxWindGust: 32,
            avgTemp: 20,
            riskLevel: 'high',
            isIndoorRecommended: true,
            ballPhysics: {
                speed: 'MEDIA',
                reactivity: 'Media equilibrada',
                description: 'Humedad alta: cristales resbaladizos.'
            },
            tacticalAdvice: '⚠️ Condiciones adversas de viento/lluvia. Muy recomendado jugar en pista cubierta.',
            isFallback: false
        });

        try {
            await modal.open(testEvent);

            const overlay = mockDoc.getElementById('sp-event-weather-modal');
            assert.ok(overlay, 'El elemento overlay del modal debe estar en el DOM');

            const dialog = overlay.children.find(c => c.className.includes('sp-weather-modal-dialog'));
            assert.ok(dialog, 'El diálogo interior debe existir');

            // Verificar contenido renderizado
            assert.ok(dialog.innerHTML.includes('Americana Nocturna Viernes'), 'Debe mostrar el nombre del evento');
            assert.ok(dialog.innerHTML.includes('CORNELLÀ'), 'Debe mostrar la sede Cornellà');
            assert.ok(dialog.innerHTML.includes('RIESGO DE LLUVIA'), 'Debe mostrar el badge de riesgo alto');
            assert.ok(dialog.innerHTML.includes('PREDICCIÓN HORARIA EXACTA'), 'Debe contener la sección de la gráfica horaria');
            assert.ok(dialog.innerHTML.includes('TELEMETRÍA TÁCTICA'), 'Debe contener telemetría táctica');
            assert.ok(dialog.innerHTML.includes('ALERTA PREVENTIVA METEOROLÓGICA'), 'Debe mostrar el banner de alerta preventiva');
            assert.ok(dialog.innerHTML.includes('RADAR SATELITAL EN VIVO (WINDY)'), 'Debe contener la sección de radar Windy');

            // 2. Probar despliegue interactivo de Windy Radar
            // Crear elementos simulados de Windy en mockDoc para la prueba
            const radarContainer = new MockElement('div', 'sp-windy-radar-container');
            const toggleBadge = new MockElement('div', 'sp-windy-toggle-badge');
            const iframeWrapper = new MockElement('div', 'sp-windy-iframe-wrapper');
            const btnPush = new MockElement('button', 'sp-btn-send-preventive-push');
            
            mockDoc.body.appendChild(radarContainer);
            mockDoc.body.appendChild(toggleBadge);
            mockDoc.body.appendChild(iframeWrapper);
            mockDoc.body.appendChild(btnPush);

            modal.toggleWindyRadar();
            assert.strictEqual(modal._windyVisible, true, 'El radar debe pasar a estar visible');
            assert.strictEqual(radarContainer.style.display, 'flex');
            assert.ok(iframeWrapper.innerHTML.includes('embed.windy.com'), 'Debe inyectar el iframe oficial de Windy');
            assert.ok(iframeWrapper.innerHTML.includes('overlay=rain'), 'Debe usar overlay rain por defecto');

            // 3. Probar conmutación de capa a Viento
            modal.switchWindyLayer('wind');
            assert.strictEqual(modal._windyLayer, 'wind');
            assert.ok(iframeWrapper.innerHTML.includes('overlay=wind'), 'Debe cambiar el iframe al overlay wind');

            // 4. Probar envío de Push Alert desde el modal
            await modal.sendPushAlert();
            assert.ok(btnPush.innerHTML.includes('AVISO PUSH ENVIADO'), 'Debe actualizar el botón confirmando el envío');

            // 5. Probar generación de enlace WhatsApp
            let openedUrl = '';
            sandbox.window.open = (url) => { openedUrl = url; };
            modal.shareWhatsAppAlert();
            assert.ok(openedUrl.startsWith('https://api.whatsapp.com/send?text='), 'Debe invocar window.open con WhatsApp API');
            assert.ok(openedUrl.includes(encodeURIComponent('Americana Nocturna Viernes')));

            // 6. Probar cierre por método close y tecla ESC
            modal.close();
            // Tras close, overlay debe marcarse con closing
            assert.ok(overlay.classList.contains('sp-weather-modal-closing'), 'Debe aplicar animación sp-weather-modal-closing');

            // Simular tecla ESC
            mockDoc.triggerKeyDown('Escape');
        } finally {
            WeatherService.getEventWeatherForecast = origGetForecast;
        }
    });

    // ----------------------------------------------------------------------------
    // GRUPO 11: TOLERANCIA A FALLOS Y MODO DEFENSIVO (API OFFLINE)
    // ----------------------------------------------------------------------------
    await test("Tolerancia a Fallos", "Comportamiento defensivo si fetch de Open-Meteo falla o está offline", async () => {
        // Limpiar caché previa
        WeatherService._memoryCache.clear();

        const origWarn = console.warn;
        const origError = console.error;
        console.warn = () => {};
        console.error = () => {};

        const originalFetch = global.fetch;
        global.fetch = async () => {
            throw new Error('Network offline or DNS error');
        };

        try {
            const fallbackFc = await WeatherService.getEventWeatherForecast({
                sede: 'Sede Remota',
                date: '2026-10-05',
                time: '18:00'
            });

            // No debe lanzar excepción y debe proveer un fallback coherente
            assert.strictEqual(fallbackFc.isFallback, true);
            assert.ok(Array.isArray(fallbackFc.hours), 'Debe proveer array de horas fallback');
            assert.strictEqual(fallbackFc.hours.length, 5); // 17, 18, 19, 20, 21
            assert.ok(fallbackFc.avgTemp > 0, 'Temperatura fallback debe ser válida');
            assert.strictEqual(fallbackFc.riskLevel, 'safe');
            assert.ok(fallbackFc.tacticalAdvice.length > 0);
        } finally {
            global.fetch = originalFetch;
            console.warn = origWarn;
            console.error = origError;
        }
    });

    await test("Tolerancia a Fallos", "getDashboardWeather responde defensivamente ante fallos de red", async () => {
        const origWarn = console.warn;
        const origError = console.error;
        console.warn = () => {};
        console.error = () => {};

        const originalFetch = global.fetch;
        global.fetch = async () => {
            throw new Error('Fetch rejected');
        };

        try {
            const list = await WeatherService.getDashboardWeather();
            assert.ok(Array.isArray(list), 'Debe devolver un array de sedes');
            assert.strictEqual(list.length, 2); // EL PRAT y CORNELLÀ
            list.forEach(item => {
                assert.strictEqual(item.temp, '--');
                assert.strictEqual(item.isPropitious, false);
            });
        } finally {
            global.fetch = originalFetch;
            console.warn = origWarn;
            console.error = origError;
        }
    });

    // ============================================================================
    // RESUMEN FINAL
    // ============================================================================
    console.log("\n================================================================================");
    console.log(` 📊 RESUMEN AUDITORÍA QA: RADAR METEOROLÓGICO`);
    console.log(`    Total Pruebas: ${passedCount + failedCount}`);
    console.log(`    Aprobadas:     ${passedCount} ✅`);
    console.log(`    Fallidas:      ${failedCount} ❌`);
    console.log("================================================================================");

    if (failedCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

// Ejecutar suite
runWeatherRadarSuite().catch(err => {
    console.error("FATAL ERROR EN QA SUITE:", err);
    process.exit(1);
});
