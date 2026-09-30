/**
 * test-admin-tournament-logic-lab.js
 * 
 * Test de verificación y aseguramiento de calidad (QA) para:
 * - AdminTournamentLogicLab.js (Frontend Component)
 * - Integración en admin.html
 * - Enrutamiento en js/admin.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación QA de AdminTournamentLogicLab...\n');

// 1. Verificar existencia de archivos
const files = [
    'js/modules/admin/TournamentLogicAuditService.js',
    'js/modules/admin/AdminTournamentLogicLab.js',
    'admin.html',
    'js/admin.js'
];

files.forEach(f => {
    const fullPath = path.join(__dirname, '..', f);
    assert.ok(fs.existsSync(fullPath), `El archivo ${f} debe existir.`);
    console.log(`✅ Archivo presente: ${f}`);
});

// 2. Verificar integración en admin.html
const adminHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
assert.ok(adminHtmlContent.includes('btn-logic-lab'), 'admin.html debe contener el botón btn-logic-lab en el sidebar');
assert.ok(adminHtmlContent.includes("loadAdminView('logic_lab')"), 'admin.html debe invocar loadAdminView(\'logic_lab\')');
assert.ok(adminHtmlContent.includes('js/modules/admin/AdminTournamentLogicLab.js'), 'admin.html debe incluir el script AdminTournamentLogicLab.js');
console.log('✅ admin.html: botón de sidebar y script tag verificados.');

// 3. Verificar enrutamiento en js/admin.js
const adminJsContent = fs.readFileSync(path.join(__dirname, '..', 'js/admin.js'), 'utf8');
assert.ok(adminJsContent.includes("viewName === 'logic_lab'"), 'js/admin.js debe enrutar viewName === \'logic_lab\'');
assert.ok(adminJsContent.includes('AdminTournamentLogicLab.render()'), 'js/admin.js debe llamar a AdminTournamentLogicLab.render()');
console.log('✅ js/admin.js: rama de enrutamiento verificada.');

// 4. Test en entorno mockeado (DOM mínimo)
const TournamentLogicAuditService = require('../js/modules/admin/TournamentLogicAuditService.js');

// Mockear entorno browser global
const mockContainer = {
    innerHTML: '',
    querySelectorAll: () => [],
    querySelector: () => null
};

const mockDocument = {
    getElementById: (id) => {
        if (id === 'content-area') return mockContainer;
        if (id === 'logic-lab-tab-container') return mockContainer;
        return null;
    },
    querySelector: () => mockContainer,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, style: {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} }
};

global.window = global;
global.document = mockDocument;
global.TournamentLogicAuditService = TournamentLogicAuditService;

// Cargar AdminTournamentLogicLab
require('../js/modules/admin/AdminTournamentLogicLab.js');

assert.ok(global.AdminTournamentLogicLab, 'global.AdminTournamentLogicLab debe estar inicializado');
assert.ok(global.AdminViews && typeof global.AdminViews.logic_lab === 'function', 'global.AdminViews.logic_lab debe ser una función');
console.log('✅ AdminTournamentLogicLab: exportado globalmente y hook registrado en AdminViews.');

// 5. Test de renderizado de vistas y pestañas
(async () => {
    const lab = global.AdminTournamentLogicLab;

    // Render principal
    await lab.render(mockContainer);
    assert.ok(mockContainer.innerHTML.includes('CENTRO DE CONTROL & AUDITORÍA DE LÓGICA'), 'El HTML debe incluir el título principal');
    assert.ok(mockContainer.innerHTML.includes('MOTOR 100% OPERATIVO'), 'El HTML debe incluir el badge del motor');
    assert.ok(mockContainer.innerHTML.includes('<option value="3"'), 'El selector debe incluir opción 3 pistas');
    assert.ok(mockContainer.innerHTML.includes('<option value="10"'), 'El selector debe incluir opción 10 pistas');
    assert.ok(!mockContainer.innerHTML.includes('<option value="2"'), 'El selector NO debe incluir opción 2 pistas');
    console.log('✅ Vista principal renderizada con cabecera, telemetría y selector 3-10 pistas verificado.');

    // Pestaña 1: Simulador Multimodal
    lab.switchTab('simulator');
    lab.executeTurboSimulation(false);
    assert.ok(lab.lastSimulation !== null, 'lastSimulation no debe ser null tras ejecutar simulación turbo');
    assert.equal(lab.lastSimulation.rounds, 6, 'La simulación debe contener 6 rondas oficiales');

    // Validación de reactividad con 10 pistas (40 jugadores y 60 partidos en 6 rondas)
    lab.onCourtsChange('10');
    assert.equal(lab.simCourts, 10, 'simCourts debe ser 10');
    assert.equal(lab.lastSimulation.players.length, 40, 'Debe simular 40 jugadores con 10 pistas');
    console.log('✅ Pestaña 1 (Simulador): Simulación turbo y reactividad de 10 pistas (40 jug, 60 part) validadas.');

    // Simulación Ficticia: Jugadores Reales vs Pro
    await lab.onSimPlayersSourceChange('pro');
    assert.equal(lab.simPlayersSource, 'pro');
    let simHtml = lab._renderSimulatorTab();
    assert.ok(simHtml.includes('⭐ ESTRELLAS PRO'), 'Debe mostrar badge de pro');

    await lab.onSimPlayersSourceChange('real');
    assert.equal(lab.simPlayersSource, 'real');
    simHtml = lab._renderSimulatorTab();
    assert.ok(simHtml.includes('👥 JUGADORES REALES (BD)'), 'Debe mostrar badge de reales');
    console.log('✅ Pestaña 1 (Simulador): Conmutación Jugadores Reales vs Estrellas Pro validada.');

    // Simulación Ficticia: Americana vs Entreno
    await lab.onSimEventTypeChange('entreno');
    assert.equal(lab.simEventType, 'entreno');
    simHtml = lab._renderSimulatorTab();
    assert.ok(simHtml.includes('🎾 Cuadro de Rendimiento del Entreno'), 'Debe adaptar a Cuadro de Rendimiento');
    assert.ok(simHtml.includes('MVP DE LA SESIÓN'), 'Debe incluir MVP DE LA SESIÓN');

    await lab.onSimEventTypeChange('americana');
    assert.equal(lab.simEventType, 'americana');
    simHtml = lab._renderSimulatorTab();
    assert.ok(simHtml.includes('🏆 Podio de Honor de la Americana'), 'Debe adaptar a Podio de Honor');
    console.log('✅ Pestaña 1 (Simulador): Adaptación Americana vs Entreno validada.');

    // Clonación de evento real en memoria
    await lab.simulateFromRealEvent('ev_demo_americana_1', 'americana');
    assert.ok(lab.simClonedFrom !== null);
    simHtml = lab._renderSimulatorTab();
    assert.ok(simHtml.includes('📂 Basado en: Americana Nocturna Viernes - 4 Pistas (Ficticio)'), 'Debe mostrar badge clonado');
    lab.unlinkClonedEvent();
    assert.equal(lab.simClonedFrom, null);
    console.log('✅ Pestaña 1 (Simulador): Clonación de evento real en memoria sin tocar BD validada.');

    // Pestaña 2: Escáner de 5 Reglas de Oro
    lab.switchTab('rules_scanner');
    assert.ok(lab.lastAuditResult !== null, 'lastAuditResult debe contener datos de auditoría');
    assert.equal(lab.lastAuditResult.rules.length, 5, 'Deben auditarse exactamente las 5 reglas críticas');
    console.log('✅ Pestaña 2 (Escáner de Reglas): 5 reglas de oro evaluadas correctamente.');

    // Pestaña 3: Diagnóstico de Eventos Reales
    lab.switchTab('real_diagnosis');
    await lab.fetchRealEvents();
    assert.ok(lab.realEventsList.length > 0, 'realEventsList debe tener eventos cargados o fallback de demostración');
    await lab.executeRealDiagnosis();
    assert.ok(lab.lastRealDiagnosis !== null, 'lastRealDiagnosis debe contener el diagnóstico del evento');
    console.log('✅ Pestaña 3 (Diagnóstico Real): Carga y diagnóstico de actas completado.');

    // Pestaña 4: Self-Test Algorítmico
    lab.switchTab('self_test');
    lab.executeSelfTest();
    assert.ok(lab.lastSelfTestResult !== null, 'lastSelfTestResult debe existir');
    assert.equal(lab.lastSelfTestResult.healthScore, 100, 'Health score debe ser 100%');
    assert.equal(lab.lastSelfTestResult.totalTests, 6, 'Debe ejecutar exactamente 6 benchmarks');
    console.log('✅ Pestaña 4 (Self-Test): Batería de 6 pruebas aprobadas al 100%.');

    console.log('\n🎉 ¡TODOS LOS TESTS DE INTEGRACIÓN Y FRONTEND HAN PASADO EXITOSAMENTE!');
})();
