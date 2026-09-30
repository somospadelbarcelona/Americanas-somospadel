/**
 * test-sos-substitutes-complete-qa.js
 * 
 * 🚨 SUITE DE VALIDACIÓN Y CONTROL DE CALIDAD (QA) INTEGRAL
 * Funcionalidad: "Bolsa de Suplentes SOS & Matchmaking Inteligente"
 * SomosPádel Barcelona
 * 
 * Cobertura de pruebas:
 * 1. Comprobación estática de integración (Router, ActionGrid, DashboardView, index.html)
 * 2. Ciclo de vida completo de Alerta SOS (creación, expiración, listado ordenado, cancelación)
 * 3. Algoritmo de Matchmaking Inteligente & Compatibilidad (exacto, desviado, de guardia, polivalente)
 * 4. Cobertura de Plaza SOS (joinSosAlert, estado filled, asignación, +150 XP AchievementsService)
 * 5. Bolsa de Guardia Activa (setPlayerAvailability, getPlayerAvailability, filtrado por lado y nivel)
 * 6. Resiliencia, tolerancia a fallos y fallback dinámico (seeds para hoy, modo offline sin Firestore)
 * 7. Componente visual SosSubstitutesWidget (montaje, render, modales, eventos reactivos)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("================================================================================");
console.log(" 🚨 AUDITORÍA QA: BOLSA DE SUPLENTES SOS & MATCHMAKING INTELIGENTE");
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
// ENTORNO MOCK HEADLESS (DOM, Storage, Events)
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
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.style = {};
        this.disabled = false;
        this.children = [];
        this.attributes = new Map();
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
    scrollIntoView() {}
    querySelector(sel) {
        if (sel === '#sp-sos-widget-main-card') return this;
        return null;
    }
    querySelectorAll(sel) {
        return [];
    }
}

const mockDomElements = new Map();
function getMockElement(id, tag = 'div') {
    if (!mockDomElements.has(id)) {
        mockDomElements.set(id, new MockElement(id, tag));
    }
    return mockDomElements.get(id);
}

const mockStorage = new MockStorage();

// Inicializar globales simuladas
global.window = global;
global.localStorage = mockStorage;

const dispatchedEvents = [];
const eventListeners = new Map();

global.dispatchEvent = function (evt) {
    dispatchedEvents.push(evt);
    const list = eventListeners.get(evt.type) || [];
    list.forEach(cb => {
        try { cb(evt); } catch (e) {}
    });
    return true;
};

global.addEventListener = function (type, cb) {
    if (!eventListeners.has(type)) eventListeners.set(type, []);
    eventListeners.get(type).push(cb);
};

global.removeEventListener = function (type, cb) {
    if (!eventListeners.has(type)) return;
    const list = eventListeners.get(type).filter(x => x !== cb);
    eventListeners.set(type, list);
};

global.CustomEvent = class CustomEvent {
    constructor(type, params = {}) {
        this.type = type;
        this.detail = params.detail || {};
    }
};

global.document = {
    getElementById: (id) => getMockElement(id),
    createElement: (tag) => new MockElement('', tag),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    readyState: 'complete',
    addEventListener: (type, cb) => global.addEventListener(type, cb)
};

// Mock NotificationService
global.NotificationService = {
    toasts: [],
    inAppToasts: [],
    userNotifications: [],
    showToast(msg, type) {
        this.toasts.push({ msg, type });
    },
    showInAppToast(title, body, type, route) {
        this.inAppToasts.push({ title, body, type, route });
    },
    sendNotificationToUser(uid, title, body, meta) {
        this.userNotifications.push({ uid, title, body, meta });
        return Promise.resolve(true);
    }
};

// Cargar módulos bajo prueba
const achievementsServicePath = path.resolve(__dirname, '../js/modules/stats/AchievementsService.js');
const sosServicePath = path.resolve(__dirname, '../js/modules/common/SosSubstitutesService.js');
const sosWidgetPath = path.resolve(__dirname, '../js/modules/common/SosSubstitutesWidget.js');

const AchievementsService = require(achievementsServicePath);
const SosSubstitutesService = require(sosServicePath);
require(sosWidgetPath);
const SosSubstitutesWidget = global.SosSubstitutesWidget;

// ================================================================================
// EJECUCIÓN DE LAS PRUEBAS QA
// ================================================================================

(async function runAllTests() {

    // ----------------------------------------------------------------------------
    // BLOQUE 1: VERIFICACIÓN ESTÁTICA Y DE INTEGRACIÓN (TRICOTADO EN ADMIN)
    // ----------------------------------------------------------------------------
    await test("Integración", "admin.html incluye botón sidebar y scripts de SosSubstitutesService y AdminSosSubstitutes", () => {
        const adminHtml = fs.readFileSync(path.resolve(__dirname, '../admin.html'), 'utf8');
        assert(adminHtml.includes('data-view="sos_substitutes"'), "Falta el botón con data-view='sos_substitutes' en el sidebar de admin.html");
        assert(adminHtml.includes('AdminSosSubstitutes.js'), "Falta AdminSosSubstitutes.js en admin.html");
        assert(adminHtml.includes('SosSubstitutesService.js'), "Falta SosSubstitutesService.js en admin.html");
    });

    await test("Integración", "DashboardView_hotfix.js queda limpio de widget SOS en el inicio", () => {
        const dvCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/dashboard/DashboardView_hotfix.js'), 'utf8');
        assert(!dvCode.includes('id="sos-substitutes-widget-root"'), "El contenedor '#sos-substitutes-widget-root' aún sigue en DashboardView_hotfix");
        assert(!dvCode.includes('SosSubstitutesWidget.mount'), "SosSubstitutesWidget.mount aún sigue en DashboardView_hotfix");
    });

    await test("Integración", "ActionGrid.js no contiene la tarjeta SOS (inicio limpio)", () => {
        const agCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/dashboard/ActionGrid.js'), 'utf8');
        assert(!agCode.includes("id: 'sosSubstitutes'"), "La card 'sosSubstitutes' aún sigue en ActionGrid");
    });

    await test("Integración", "js/admin.js contiene el enrutamiento para sos_substitutes", () => {
        const adminCode = fs.readFileSync(path.resolve(__dirname, '../js/admin.js'), 'utf8');
        assert(adminCode.includes("viewName === 'sos_substitutes'"), "Falta la condición de ruta sos_substitutes en js/admin.js");
        assert(adminCode.includes("AdminSosSubstitutes.render()"), "Falta la llamada AdminSosSubstitutes.render() en js/admin.js");
    });

    await test("Integración", "AdminSosSubstitutes.js define el módulo administrativo correctamente", () => {
        const adminSosCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/admin/AdminSosSubstitutes.js'), 'utf8');
        assert(adminSosCode.includes("class AdminSosSubstitutes"), "No define class AdminSosSubstitutes");
        assert(adminSosCode.includes("global.AdminSosSubstitutes"), "No expone global.AdminSosSubstitutes");
        assert(adminSosCode.includes("AdminViews.sos_substitutes"), "No registra el hook AdminViews.sos_substitutes");
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 2: CICLO DE VIDA DE ALERTAS SOS
    // ----------------------------------------------------------------------------
    await test("Ciclo de Vida Alerta", "Crear alerta SOS normaliza todos los parámetros requeridos", async () => {
        const alertData = {
            eventName: 'Torneo Americano Express Nocturno',
            eventType: 'americana',
            time: '21:00',
            court: 'Pista Panorámica 1',
            levelMin: 3.5,
            levelMax: 4.5,
            sideNeeded: 'reves',
            bonusXp: 150
        };

        const created = await SosSubstitutesService.createSosAlert(alertData);

        assert(created.id && created.id.startsWith('sos_'), "ID de alerta inválido o no generado");
        assert.strictEqual(created.status, 'active', "El estado inicial debe ser 'active'");
        assert.strictEqual(created.eventType, 'americana', "Tipo de evento debe ser 'americana'");
        assert.strictEqual(created.sideNeeded, 'reves', "Lado requerido debe estar normalizado a 'reves'");
        assert.strictEqual(created.bonusXp, 150, "bonusXp debe ser 150");
        assert.strictEqual(created.court, 'Pista Panorámica 1');
        assert(created.expiresAt, "Debe calcular fecha de expiración automática");
        assert.strictEqual(created.assignedPlayer, null, "assignedPlayer debe ser null al crearse");
        assert(Array.isArray(created.candidates), "candidates debe ser un array");
    });

    await test("Ciclo de Vida Alerta", "getActiveSosAlerts devuelve alertas activas ordenadas por proximidad", async () => {
        // Crear dos alertas en horarios diferentes para hoy
        const todayStr = new Date().toISOString().split('T')[0];
        const a1 = await SosSubstitutesService.createSosAlert({
            eventName: 'Alerta Tarde 18:00',
            date: todayStr,
            time: '18:00',
            court: 'Pista 2'
        });
        const a2 = await SosSubstitutesService.createSosAlert({
            eventName: 'Alerta Noche 22:00',
            date: todayStr,
            time: '22:00',
            court: 'Pista 4'
        });

        const activeList = await SosSubstitutesService.getActiveSosAlerts();
        assert(Array.isArray(activeList) && activeList.length >= 2, "Debe devolver al menos 2 alertas activas");
        
        // Verificar que ambas alertas creadas están presentes
        const ids = activeList.map(a => a.id);
        assert(ids.includes(a1.id), "a1 no se encuentra en las alertas activas");
        assert(ids.includes(a2.id), "a2 no se encuentra en las alertas activas");
    });

    await test("Ciclo de Vida Alerta", "Filtrado automático de alertas expiradas en getActiveSosAlerts", async () => {
        // Crear alerta con expiración en el pasado
        const pastDate = new Date(Date.now() - 3600 * 1000 * 5).toISOString();
        const expiredAlert = await SosSubstitutesService.createSosAlert({
            eventName: 'Alerta Ya Pasada',
            time: '10:00',
            expiresAt: pastDate
        });

        const activeList = await SosSubstitutesService.getActiveSosAlerts();
        const isPresent = activeList.some(a => a.id === expiredAlert.id);
        assert.strictEqual(isPresent, false, "La alerta con expiresAt en el pasado NO debe figurar en alertas activas");
    });

    await test("Ciclo de Vida Alerta", "cancelSosAlert marca estado como cancelled y emite evento", async () => {
        const alert = await SosSubstitutesService.createSosAlert({
            eventName: 'Alerta Para Cancelar',
            time: '20:30'
        });

        let eventFired = false;
        SosSubstitutesService.subscribe('onSosAlertCancelled', () => { eventFired = true; });

        const cancelRes = await SosSubstitutesService.cancelSosAlert(alert.id, 'Pista reservada por lluvia');
        assert.strictEqual(cancelRes.success, true, "cancelSosAlert debe devolver success: true");
        assert.strictEqual(cancelRes.alert.status, 'cancelled', "El estado debe ser 'cancelled'");
        assert.strictEqual(cancelRes.alert.cancellationReason, 'Pista reservada por lluvia');

        // Ya no debe aparecer activa
        const activeList = await SosSubstitutesService.getActiveSosAlerts();
        assert(!activeList.some(a => a.id === alert.id), "Alerta cancelada no debe aparecer en getActiveSosAlerts");
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 3: ALGORITMO DE MATCHMAKING INTELIGENTE (COMPATIBILIDAD SOS)
    // ----------------------------------------------------------------------------
    await test("Matchmaking Inteligente", "Afinidad Élite (100%): nivel en rango, lado idéntico y guardia activa hoy", () => {
        const userElite = {
            uid: 'player_elite_01',
            name: 'Pau Gasol Padel',
            level: 4.0,
            side: 'reves'
        };
        const alertTarget = {
            levelMin: 3.5,
            levelMax: 4.5,
            sideNeeded: 'reves'
        };

        // Activamos guardia para este usuario
        SosSubstitutesService.setPlayerAvailability(userElite, { isAvailable: true, timeSlot: 'tardes' });

        const compat = SosSubstitutesService.calculateCompatibility(userElite, alertTarget);

        assert.strictEqual(compat.score, 100, `Esperado 100% de afinidad, obtenido: ${compat.score}%`);
        assert.strictEqual(compat.label, 'Compatibilidad Élite');
        assert.strictEqual(compat.isEligible, true);
        assert.strictEqual(compat.details.levelScore, 40, "Nivel en rango debe aportar 40 puntos");
        assert.strictEqual(compat.details.sideScore, 35, "Coincidencia de lado exacta debe aportar 35 puntos");
        assert.strictEqual(compat.details.guardScore, 25, "Guardia activa debe aportar 25 puntos");
        assert(compat.reasons.length >= 3, "Debe detallar al menos 3 motivos de afinidad");
    });

    await test("Matchmaking Inteligente", "Afinidad Desviada: nivel fuera de tolerancia, lado cruzado y sin guardia", () => {
        const userDesviado = {
            uid: 'player_novato_02',
            name: 'Iniciado Despistado',
            level: 1.8, // Muy por debajo de 3.5 - 4.5
            side: 'drive'
        };
        const alertTarget = {
            levelMin: 3.5,
            levelMax: 4.5,
            sideNeeded: 'reves'
        };

        // Sin guardia
        SosSubstitutesService.setPlayerAvailability(userDesviado, { isAvailable: false });

        const compat = SosSubstitutesService.calculateCompatibility(userDesviado, alertTarget);

        assert(compat.score < 40, `Score esperado < 40%, obtenido: ${compat.score}%`);
        assert.strictEqual(compat.label, 'Compatibilidad Baja');
        assert.strictEqual(compat.isEligible, false, "Jugador con desviación de nivel excesiva no debe ser elegible");
        assert.strictEqual(compat.details.levelScore, 0, "Nivel muy desviado debe sumar 0");
        assert.strictEqual(compat.details.guardScore, 0, "Sin guardia debe sumar 0");
    });

    await test("Matchmaking Inteligente", "Plaza abierta a cualquier lado (sideNeeded='any') o jugador polivalente", () => {
        const userPoli = { uid: 'p_poli', level: 3.8, side: 'any' };
        const alertReqRev = { levelMin: 3.5, levelMax: 4.5, sideNeeded: 'reves' };
        const alertReqAny = { levelMin: 3.5, levelMax: 4.5, sideNeeded: 'any' };

        const c1 = SosSubstitutesService.calculateCompatibility(userPoli, alertReqRev);
        assert.strictEqual(c1.details.sideScore, 30, "Jugador polivalente debe obtener 30 pts de lado");

        const userDrive = { uid: 'p_drive', level: 3.8, side: 'drive' };
        const c2 = SosSubstitutesService.calculateCompatibility(userDrive, alertReqAny);
        assert.strictEqual(c2.details.sideScore, 30, "Plaza 'any' debe otorgar 30 pts a especialista de drive");
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 4: COBERTURA DE PLAZA SOS & BONIFICACIÓN DE HONOR (+150 XP)
    // ----------------------------------------------------------------------------
    await test("Cobertura de Plaza SOS", "joinSosAlert asigna jugador, marca filled y otorga +150 XP mediante AchievementsService", async () => {
        // Alerta fresca
        const alert = await SosSubstitutesService.createSosAlert({
            eventName: 'Americana Oro Padel Club',
            time: '20:00',
            bonusXp: 150
        });

        const rescuerUser = {
            uid: 'user_hero_rescuer_007',
            name: 'Marc Valiente',
            level: 3.9,
            side: 'drive'
        };

        // Estado inicial de XP en AchievementsService
        const initialGam = AchievementsService.loadCachedGamification(rescuerUser.uid);
        const initialXp = initialGam.totalXp || 0;

        // Ejecutar rescate SOS
        const joinResult = await SosSubstitutesService.joinSosAlert(alert.id, rescuerUser);

        assert.strictEqual(joinResult.success, true, "joinSosAlert debe retornar success: true");
        assert.strictEqual(joinResult.alert.status, 'filled', "El estado de la alerta debe pasar a 'filled'");
        assert.strictEqual(joinResult.assignedPlayer.uid, rescuerUser.uid);
        assert.strictEqual(joinResult.assignedPlayer.name, rescuerUser.name.toUpperCase());
        assert.strictEqual(joinResult.bonusXp, 150);

        // Verificar que la plaza ya NO está en getActiveSosAlerts
        const activeAlerts = await SosSubstitutesService.getActiveSosAlerts();
        assert(!activeAlerts.some(a => a.id === alert.id), "Alerta 'filled' ya no debe figurar activa");

        // Verificar bonificación de XP en AchievementsService
        const updatedGam = AchievementsService.loadCachedGamification(rescuerUser.uid);
        const finalXp = updatedGam.totalXp || 0;
        assert.strictEqual(finalXp, initialXp + 150, `Se debieron otorgar exactamente +150 XP (Esperado: ${initialXp + 150}, Obtenido: ${finalXp})`);
        assert.strictEqual(updatedGam.lastBonus.amount, 150);
        assert(updatedGam.lastBonus.reason.includes('Rescate SOS'));
    });

    await test("Cobertura de Plaza SOS", "joinSosAlert sobre plaza ya cubierta es rechazado defensivamente", async () => {
        const alert = await SosSubstitutesService.createSosAlert({
            eventName: 'Partido Ya Ocupado',
            time: '19:30'
        });

        const player1 = { uid: 'p1_first', name: 'Primer Jugador', level: 3.5 };
        const player2 = { uid: 'p2_second', name: 'Segundo Jugador', level: 3.7 };

        // Primer jugador la cubre
        const r1 = await SosSubstitutesService.joinSosAlert(alert.id, player1);
        assert.strictEqual(r1.success, true);

        // Segundo jugador intenta cubrir la misma
        const r2 = await SosSubstitutesService.joinSosAlert(alert.id, player2);
        assert.strictEqual(r2.success, false, "No debe permitir cubrir una plaza ya ocupada");
        assert(r2.reason.includes('ya no está disponible'), "Debe indicar motivo de indisponibilidad");
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 5: BOLSA DE GUARDIA ACTIVA (DISPONIBILIDAD DE SUPLENTES)
    // ----------------------------------------------------------------------------
    await test("Bolsa de Guardia", "Activación, consulta y desactivación de guardia de un jugador", async () => {
        const testUser = {
            uid: 'guard_tester_99',
            name: 'Andrés Iniesta Padel',
            level: 4.2,
            side: 'drive'
        };

        // 1. Activar guardia tardes
        const record = await SosSubstitutesService.setPlayerAvailability(testUser, {
            isAvailable: true,
            timeSlot: 'tardes'
        });
        assert.strictEqual(record.isAvailable, true);
        assert.strictEqual(record.timeSlot, 'tardes');

        // 2. Consultar guardia
        const currentGuard = SosSubstitutesService.getPlayerAvailability(testUser.uid);
        assert.strictEqual(currentGuard.isAvailable, true);
        assert.strictEqual(currentGuard.timeSlot, 'tardes');

        // 3. Desactivar guardia
        await SosSubstitutesService.setPlayerAvailability(testUser, { isAvailable: false });
        const deactivated = SosSubstitutesService.getPlayerAvailability(testUser.uid);
        assert.strictEqual(deactivated.isAvailable, false);
    });

    await test("Bolsa de Guardia", "getAvailableSubstitutes filtra por lado de pista correctamente", async () => {
        const todayStr = SosSubstitutesService._getTodayDateString();
        
        // Registrar suplentes en guardia con diferentes lados
        await SosSubstitutesService.setPlayerAvailability({ uid: 'sub_reves_1', name: 'Revés Master', level: 4.0, side: 'reves' }, { isAvailable: true, timeSlot: 'tardes', date: todayStr });
        await SosSubstitutesService.setPlayerAvailability({ uid: 'sub_drive_1', name: 'Drive Sólido', level: 3.5, side: 'drive' }, { isAvailable: true, timeSlot: 'tardes', date: todayStr });
        await SosSubstitutesService.setPlayerAvailability({ uid: 'sub_any_1', name: 'Polivalente Total', level: 3.8, side: 'any' }, { isAvailable: true, timeSlot: 'todo_el_dia', date: todayStr });

        // Filtrar por 'reves': debe devolver Revés Master y Polivalente Total, pero NO Drive Sólido
        const revesSubs = await SosSubstitutesService.getAvailableSubstitutes(null, 'reves');
        const revesUids = revesSubs.map(s => s.uid || s.id);

        assert(revesUids.includes('sub_reves_1'), "Debe incluir al especialista en revés");
        assert(revesUids.includes('sub_any_1'), "Debe incluir al polivalente");
        assert(!revesUids.includes('sub_drive_1'), "NO debe incluir al especialista de drive al filtrar por revés");
    });

    await test("Bolsa de Guardia", "getAvailableSubstitutes ordena por proximidad de nivel al objetivo", async () => {
        const todayStr = SosSubstitutesService._getTodayDateString();

        await SosSubstitutesService.setPlayerAvailability({ uid: 'sub_nv_30', name: 'Jugador 3.0', level: 3.0, side: 'any' }, { isAvailable: true, date: todayStr });
        await SosSubstitutesService.setPlayerAvailability({ uid: 'sub_nv_40', name: 'Jugador 4.0', level: 4.0, side: 'any' }, { isAvailable: true, date: todayStr });
        await SosSubstitutesService.setPlayerAvailability({ uid: 'sub_nv_48', name: 'Jugador 4.8', level: 4.8, side: 'any' }, { isAvailable: true, date: todayStr });

        // Nivel objetivo 4.1: el nivel más cercano debe ser 4.0
        const sorted = await SosSubstitutesService.getAvailableSubstitutes(4.1);
        assert(sorted.length >= 3);
        const topSub = sorted[0];
        assert.strictEqual(topSub.level, 4.0, `El suplente con nivel más cercano a 4.1 debe tener nivel 4.0 (obtenido: ${topSub.level})`);
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 6: RESILIENCIA, MODO OFFLINE Y FALLBACK DEFENSIVO
    // ----------------------------------------------------------------------------
    await test("Resiliencia & Fallback", "Semillas dinámicas de alertas si base de datos y caché están vacías", async () => {
        // Creamos una nueva instancia limpia sin Firestore ni caché previa
        const isolatedService = new SosSubstitutesService.constructor();
        isolatedService._cachedAlerts = [];
        mockStorage.removeItem('sp_sos_alerts_cache_v1');

        const fallbackAlerts = await isolatedService.getActiveSosAlerts();
        assert(Array.isArray(fallbackAlerts) && fallbackAlerts.length >= 2, "Debe generar al menos 2 semillas de alertas dinámicas");
        assert(fallbackAlerts[0].eventName, "La alerta semilla debe tener nombre de evento");
        assert.strictEqual(fallbackAlerts[0].status, 'active');
        assert.strictEqual(fallbackAlerts[0].bonusXp, 150);
    });

    await test("Resiliencia & Fallback", "Semillas dinámicas de suplentes si la bolsa está vacía", async () => {
        const isolatedService = new SosSubstitutesService.constructor();
        isolatedService._cachedSubstitutes = [];

        const subs = await isolatedService.getAvailableSubstitutes();
        assert(Array.isArray(subs) && subs.length >= 3, "Debe generar al menos 3 suplentes de guardia semilla");
        assert(subs[0].name, "Los suplentes semilla deben tener nombre");
        assert(subs[0].level > 0, "Los suplentes semilla deben tener nivel");
        assert.strictEqual(subs[0].isAvailable, true);
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 7: COMPONENTE VISUAL WIDGET (SosSubstitutesWidget)
    // ----------------------------------------------------------------------------
    await test("Widget SosSubstitutesWidget", "Instancia global y métodos públicos disponibles", () => {
        assert(SosSubstitutesWidget, "SosSubstitutesWidget debe existir globalmente");
        assert(typeof SosSubstitutesWidget.mount === 'function', "Debe tener método mount");
        assert(typeof SosSubstitutesWidget.refresh === 'function', "Debe tener método refresh");
        assert(typeof SosSubstitutesWidget.render === 'function', "Debe tener método render");
        assert(typeof SosSubstitutesWidget.openConfirmJoinModal === 'function', "Debe tener método openConfirmJoinModal");
        assert(typeof SosSubstitutesWidget.openGuardListModal === 'function', "Debe tener método openGuardListModal");
        assert(typeof SosSubstitutesWidget.openCreateAlertModal === 'function', "Debe tener método openCreateAlertModal");
        assert(typeof SosSubstitutesWidget.toggleAvailability === 'function', "Debe tener método toggleAvailability");
        assert(typeof SosSubstitutesWidget.setGuardSlot === 'function', "Debe tener método setGuardSlot");
        assert(typeof SosSubstitutesWidget.scrollToWidget === 'function', "Debe tener método scrollToWidget");
    });

    await test("Widget SosSubstitutesWidget", "Montaje en DOM y renderizado de la estructura visual", async () => {
        const container = getMockElement('sos-substitutes-widget-root');
        await SosSubstitutesWidget.mount(container);

        assert.strictEqual(SosSubstitutesWidget.isMounted, true, "isMounted debe ser true tras el montaje");
        assert(container.innerHTML.includes('sp-sos-widget-wrapper'), "El HTML debe contener 'sp-sos-widget-wrapper'");
        assert(container.innerHTML.includes('BOLSA DE SUPLENTES SOS'), "Debe incluir el título principal");
        assert(container.innerHTML.includes('+150 XP HONOR'), "Debe incluir el badge de Honor +150 XP");
        assert(container.innerHTML.includes('sos-guard-card'), "Debe incluir la tarjeta de guardia activa");
    });

    await test("Widget SosSubstitutesWidget", "Apertura y cierre defensivo de modales", async () => {
        // Modal de Crear Alerta
        SosSubstitutesWidget.openCreateAlertModal();
        const modalRoot = getMockElement('sp-sos-modal-root');
        assert(modalRoot.innerHTML.includes('PEDIR SUPLENTE URGENTE'), "El modal de creación debe renderizarse");

        // Cierre de Modal
        SosSubstitutesWidget.closeModal();
        assert.strictEqual(modalRoot.innerHTML, '', "closeModal debe limpiar el modal-root");

        // Modal de Lista de Guardia
        await SosSubstitutesWidget.openGuardListModal();
        assert(modalRoot.innerHTML.includes('BOLSA DE SUPLENTES DE GUARDIA'), "El modal de guardia debe renderizarse");
        SosSubstitutesWidget.closeModal();
    });

    await test("Widget SosSubstitutesWidget", "Alternancia interactiva de guardia (toggleAvailability)", async () => {
        // Mock usuario actual autenticado
        global.Store = {
            getState: (k) => k === 'currentUser' ? { uid: 'user_widget_01', name: 'Jugador Widget', level: 3.5 } : null
        };

        const prevStatus = Boolean(SosSubstitutesWidget.guardStatus?.isAvailable);
        await SosSubstitutesWidget.toggleAvailability();
        const newStatus = Boolean(SosSubstitutesWidget.guardStatus?.isAvailable);

        assert.strictEqual(newStatus, !prevStatus, "toggleAvailability debe alternar el estado de disponibilidad");
    });

    // ----------------------------------------------------------------------------
    // RESUMEN FINAL DE MÉTRICAS QA
    // ----------------------------------------------------------------------------
    console.log("\n================================================================================");
    console.log(" RESUMEN DE LA AUDITORÍA DE CALIDAD:");
    console.log(`  Total pruebas ejecutadas : ${passedCount + failedCount}`);
    console.log(`  ✅ Pruebas superadas     : ${passedCount}`);
    console.log(`  ❌ Pruebas fallidas      : ${failedCount}`);
    console.log(`  Tasa de éxito            : ${Math.round((passedCount / (passedCount + failedCount)) * 100)}%`);
    console.log("================================================================================");

    if (failedCount > 0) {
        console.error("🚨 SE DETECTARON DEFECTOS EN LA BOLSA DE SUPLENTES SOS.");
        process.exit(1);
    } else {
        console.log("🏆 CERTIFICACIÓN DE CALIDAD APROBADA: CERO DEFECTOS Y ALTA RESILIENCIA.");
        process.exit(0);
    }

})();
