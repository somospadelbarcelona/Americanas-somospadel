/**
 * test-logic-lab-frontend-enhancements.js
 * 
 * Batería de validación integral para las mejoras de Frontend en AdminTournamentLogicLab:
 * 1. Estado inicial de clase: simEventType, simPlayersSource, simClonedFrom
 * 2. Selectores de tipo de evento ficticio y fuente de jugadores en el panel de control
 * 3. Barra de clonación/simulación desde eventos reales (cero escritura en BD)
 * 4. Adaptación del Podio/Cuadro de Rendimiento y encabezados según simEventType
 * 5. Badges identificadores de telemetría (Americana/Entreno, Reales/Pro, Clonado)
 * 6. Soporte asíncrono y paso a paso con jugadores reales
 */

const fs = require('fs');
const path = require('path');

async function runTests() {
    console.log('🧪 Iniciando test suite: AdminTournamentLogicLab Frontend Enhancements...\n');

    // 1. Simulación de entorno DOM mínimo
    global.document = {
        head: { appendChild: () => {} },
        getElementById: () => null,
        createElement: () => ({ style: {} }),
        body: { appendChild: () => {} }
    };

    const TournamentLogicAuditService = require('../js/modules/admin/TournamentLogicAuditService.js');
    global.TournamentLogicAuditService = TournamentLogicAuditService;

    // Cargar módulo
    const labCode = fs.readFileSync(path.join(__dirname, '../js/modules/admin/AdminTournamentLogicLab.js'), 'utf8');
    eval(labCode);

    const lab = global.AdminTournamentLogicLab;

    // Test 1: Comprobar estado inicial
    console.log('Test 1: Comprobando propiedades de estado...');
    if (lab.simEventType !== 'americana') throw new Error(`simEventType inicial incorrecto: ${lab.simEventType}`);
    if (lab.simPlayersSource !== 'real') throw new Error(`simPlayersSource inicial incorrecto: ${lab.simPlayersSource}`);
    if (lab.simClonedFrom !== null) throw new Error(`simClonedFrom inicial incorrecto: ${lab.simClonedFrom}`);
    console.log('✅ Test 1 Superado: Estado inicial verificado correctamente.\n');

    // Test 2: HTML del Simulador y Selectores en .ll-controls-grid
    console.log('Test 2: Validando selectores en _renderSimulatorTab()...');
    await lab.executeTurboSimulation(false);
    const htmlAmericana = lab._renderSimulatorTab();

    if (!htmlAmericana.includes('id="ll-sim-event-type"')) throw new Error('Falta el selector #ll-sim-event-type');
    if (!htmlAmericana.includes('🏆 Americana (Competición Oficial)')) throw new Error('Falta opción Americana en #ll-sim-event-type');
    if (!htmlAmericana.includes('🎾 Entreno (Sesión Formativa & Pozo)')) throw new Error('Falta opción Entreno en #ll-sim-event-type');
    if (!htmlAmericana.includes('id="ll-sim-players-source"')) throw new Error('Falta el selector #ll-sim-players-source');
    if (!htmlAmericana.includes('👥 Jugadores Reales del Club (BD Firestore)')) throw new Error('Falta opción Jugadores Reales en #ll-sim-players-source');
    if (!htmlAmericana.includes('⭐ Jugadores Profesionales (WPT / Premier Padel)')) throw new Error('Falta opción Jugadores Profesionales en #ll-sim-players-source');
    if (!htmlAmericana.includes('id="ll-sim-courts"')) throw new Error('Falta el selector #ll-sim-courts');
    if (!htmlAmericana.includes('id="ll-sim-mode"')) throw new Error('Falta el selector #ll-sim-mode');
    console.log('✅ Test 2 Superado: Selectores requeridos presentes en el DOM generado.\n');

    // Test 3: Sección de Clonación y Simulación Ficticia
    console.log('Test 3: Validando sección de carga desde evento real...');
    if (!htmlAmericana.includes('Cargar Simulación desde un Evento Real')) throw new Error('Falta título de sección de clonación');
    if (!htmlAmericana.includes('Clonar & Simular Ficticiamente (Sin tocar la BD)')) throw new Error('Falta botón de clonar');
    console.log('✅ Test 3 Superado: Barra de clonación con botón interactivo presente.\n');

    // Test 4: Podio de Honor de Americana vs Cuadro de Rendimiento de Entreno
    console.log('Test 4: Comprobando adaptación del Podio y títulos...');
    if (!htmlAmericana.includes('🏆 Podio de Honor de la Americana')) throw new Error('Falta título "🏆 Podio de Honor de la Americana"');
    if (!htmlAmericana.includes('CAMPEÓN')) throw new Error('Falta título CAMPEÓN en podio de americana');

    // Cambiar a entreno
    await lab.onSimEventTypeChange('entreno');
    const htmlEntreno = lab._renderSimulatorTab();
    if (!htmlEntreno.includes('🎾 Cuadro de Rendimiento del Entreno')) throw new Error('Falta título "🎾 Cuadro de Rendimiento del Entreno"');
    if (!htmlEntreno.includes('MVP DE LA SESIÓN')) throw new Error('Falta título MVP DE LA SESIÓN en podio de entreno');
    if (!htmlEntreno.includes('TOP RENDIMIENTO')) throw new Error('Falta título TOP RENDIMIENTO en podio de entreno');
    console.log('✅ Test 4 Superado: Encabezados y podio adaptados dinámicamente según simEventType.\n');

    // Test 5: Badges Identificadores en Telemetría
    console.log('Test 5: Comprobando badges identificadores de telemetría...');
    if (!htmlEntreno.includes('🎾 ENTRENO')) throw new Error('Falta badge 🎾 ENTRENO');
    if (!htmlEntreno.includes('👥 JUGADORES REALES (BD)')) throw new Error('Falta badge 👥 JUGADORES REALES (BD)');

    await lab.onSimPlayersSourceChange('pro');
    const htmlPro = lab._renderSimulatorTab();
    if (!htmlPro.includes('⭐ ESTRELLAS PRO')) throw new Error('Falta badge ⭐ ESTRELLAS PRO');

    // Simular clonado
    await lab.simulateFromRealEvent('ev_demo_americana_1', 'americana');
    const htmlCloned = lab._renderSimulatorTab();
    if (!htmlCloned.includes('📂 Basado en: Americana Nocturna Viernes - 4 Pistas (Ficticio)')) {
        throw new Error('Falta badge de clonado con nombre del evento');
    }
    console.log('✅ Test 5 Superado: Badges identificadores verificados para tipo, fuente y clonado.\n');

    // Test 6: Simulación paso a paso con jugadores reales
    console.log('Test 6: Validando modo paso a paso...');
    lab.toggleStepByStep();
    if (!lab.stepState.active) throw new Error('stepState no está activo');
    await lab.nextStepRound();
    if (lab.stepState.currentRound !== 2) throw new Error(`currentRound esperado 2, obtenido: ${lab.stepState.currentRound}`);
    if (lab.lastSimulation.allMatches.length !== 8) throw new Error(`matches esperados 8, obtenidos: ${lab.lastSimulation.allMatches.length}`);
    console.log('✅ Test 6 Superado: Modo paso a paso operativo con tipo y participantes reales.\n');

    console.log('🎉 TODOS LOS TESTS DE FRONTEND LOGIC LAB HAN SIDO SUPERADOS EXITOSAMENTE.');
}

runTests().catch(err => {
    console.error('❌ Error en tests:', err);
    process.exit(1);
});
