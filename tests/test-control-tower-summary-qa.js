/**
 * test-control-tower-summary-qa.js
 * Suite de Certificación QA para ControlTowerSummary.js
 * 
 * Verificaciones:
 * 1. Comprobación de sintaxis de ControlTowerSummary.js.
 * 2. Disponibilidad de métodos estáticos y API pública:
 *    - render, copyViralWhatsApp, openInstagramFlyerModal, shareWhatsApp,
 *    - downloadFlyer, shareFlyerToStory, shareInstagramStory, openChronicleAI,
 *    - closeInstagramFlyerModal, copyChronicleText, toggleEvolutionMode,
 *    - selectEvolutionPlayer, toggleCompetitivenessCategory.
 * 3. Ejecución de render() con datos mock completos (Americanas & Entrenos):
 *    - Paleta clara: presencia de fondos (#ffffff, #f8fafc) y textos oscuros (#0f172a, #1e293b, #334155, #475569).
 *    - Cálculo y marcado de los 4 KPIs Big Data (Partidos, Juegos totales, Media j/p, Intensidad/Ritmo).
 *    - Podio de Honor Estelar (1º Campeón, 2º Subcampeón, 3º Tercero) y Tarjeta MVP oficial.
 *    - Cálculo íntegro y sin fallos de las 8 insignias ("Datos que Nadie Ve").
 *    - Gráficos SVG interactivos (Evolución por rondas, Donut de competitividad, Actividad por pistas)
 *      sin valores NaN, null o undefined en atributos y coordenadas.
 * 4. Test con estado vacío (sin partidos finalizados) y eventos tipo Entreno.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('🎾 ========================================================');
console.log('   SUITE DE CERTIFICACIÓN QA: ControlTowerSummary.js');
console.log('========================================================\n');

// 1. Cargar el entorno global emulado para Node.js
const mockWindow = {
    location: { href: 'https://somospadel.app' },
    alert: (msg) => console.log('  [Alert Mock]:', msg)
};
mockWindow.window = mockWindow;

const context = vm.createContext({
    window: mockWindow,
    global: mockWindow,
    console: console,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Array: Array,
    Object: Object,
    String: String,
    Date: Date,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
});

const filePath = path.join(__dirname, '../js/modules/americanas/ControlTowerSummary.js');
const fileCode = fs.readFileSync(filePath, 'utf8');

// Ejecutar en el contexto de VM
vm.runInContext(fileCode, context);

const ControlTowerSummary = mockWindow.ControlTowerSummary;

// Test 1: Comprobación de existencia del módulo y sus métodos públicos
console.log('📋 [TEST 1] Verificación de la API y Funciones Públicas');
assert.ok(ControlTowerSummary, 'ControlTowerSummary debe estar definido en window');
assert.strictEqual(typeof ControlTowerSummary.render, 'function', 'render debe ser función');
assert.strictEqual(typeof ControlTowerSummary.copyViralWhatsApp, 'function', 'copyViralWhatsApp debe ser función');
assert.strictEqual(typeof ControlTowerSummary.openInstagramFlyerModal, 'function', 'openInstagramFlyerModal debe ser función');
assert.strictEqual(typeof ControlTowerSummary.shareWhatsApp, 'function', 'shareWhatsApp debe ser función');
assert.strictEqual(typeof ControlTowerSummary.downloadFlyer, 'function', 'downloadFlyer debe ser función');
assert.strictEqual(typeof ControlTowerSummary.shareFlyerToStory, 'function', 'shareFlyerToStory debe ser función');
assert.strictEqual(typeof ControlTowerSummary.shareInstagramStory, 'function', 'shareInstagramStory debe ser función');
assert.strictEqual(typeof ControlTowerSummary.openChronicleAI, 'function', 'openChronicleAI debe ser función');
assert.strictEqual(typeof ControlTowerSummary.closeInstagramFlyerModal, 'function', 'closeInstagramFlyerModal debe ser función');
assert.strictEqual(typeof ControlTowerSummary.toggleEvolutionMode, 'function', 'toggleEvolutionMode debe ser función');
assert.strictEqual(typeof ControlTowerSummary.selectEvolutionPlayer, 'function', 'selectEvolutionPlayer debe ser función');
assert.strictEqual(typeof ControlTowerSummary.toggleCompetitivenessCategory, 'function', 'toggleCompetitivenessCategory debe ser función');
console.log('   ✅ Todas las funciones públicas requeridas están definidas correctamente.\n');

// Mock data realista para torneo Americana
const mockEventDoc = {
    id: 'evt-test-101',
    name: 'Americana Oro Fin de Semana',
    date: '2026-10-10',
    category: 'male',
    isEntreno: false,
    pair_mode: 'individual'
};

const mockMatches = [
    // Ronda 1
    {
        round: 1, court: 1, status: 'finished',
        team_a_names: ['Alex', 'Carlos'], team_b_names: ['Dani', 'Marcos'],
        score_a: 6, score_b: 4
    },
    {
        round: 1, court: 2, status: 'finished',
        team_a_names: ['Elena', 'Laura'], team_b_names: ['Sonia', 'Marta'],
        score_a: 6, score_b: 5
    },
    // Ronda 2
    {
        round: 2, court: 1, status: 'finished',
        team_a_names: ['Alex', 'Dani'], team_b_names: ['Carlos', 'Marcos'],
        score_a: 7, score_b: 5
    },
    {
        round: 2, court: 2, status: 'finished',
        team_a_names: ['Elena', 'Sonia'], team_b_names: ['Laura', 'Marta'],
        score_a: 6, score_b: 2
    },
    // Ronda 3
    {
        round: 3, court: 1, status: 'finished',
        team_a_names: ['Alex', 'Elena'], team_b_names: ['Carlos', 'Laura'],
        score_a: 6, score_b: 3
    },
    {
        round: 3, court: 2, status: 'finished',
        team_a_names: ['Dani', 'Sonia'], team_b_names: ['Marcos', 'Marta'],
        score_a: 4, score_b: 6
    },
    // Ronda 4
    {
        round: 4, court: 1, status: 'finished',
        team_a_names: ['Alex', 'Marta'], team_b_names: ['Carlos', 'Sonia'],
        score_a: 6, score_b: 4
    },
    {
        round: 4, court: 2, status: 'finished',
        team_a_names: ['Dani', 'Laura'], team_b_names: ['Elena', 'Marcos'],
        score_a: 5, score_b: 5
    }
];

// Test 2: Invocación de render y comprobación del marcado con la paleta clara
console.log('🎨 [TEST 2] Verificación de la Paleta Clara (fondos claros y textos oscuros)');
const htmlOutput = ControlTowerSummary.render(mockMatches, mockEventDoc);
assert.ok(htmlOutput && typeof htmlOutput === 'string', 'El renderizado debe devolver un string HTML no vacío');

// Verificación de contenedor principal y fondos claros
assert.ok(htmlOutput.includes('background:#f8fafc'), 'El contenedor debe tener fondo claro #f8fafc');
assert.ok(htmlOutput.includes('color:#0f172a'), 'El color de texto principal debe ser #0f172a');
assert.ok(htmlOutput.includes('.sp-hero2{background:#ffffff'), 'Hero card debe tener fondo blanco #ffffff');
assert.ok(htmlOutput.includes('.sp-kpi2-card{background:#ffffff'), 'Tarjetas KPI deben tener fondo blanco #ffffff');
assert.ok(htmlOutput.includes('.sp-badge2{background:#ffffff'), 'Insignias deben tener fondo blanco #ffffff');
assert.ok(htmlOutput.includes('.sp-chronicle2{background:#ffffff'), 'Crónica debe tener fondo blanco #ffffff');
assert.ok(htmlOutput.includes('.sp-chart-card2{background:#ffffff'), 'Cards de gráficos deben tener fondo blanco #ffffff');

// Verificación de textos oscuros
assert.ok(htmlOutput.includes('color:#0f172a'), 'Presencia de color texto oscuro #0f172a');
assert.ok(htmlOutput.includes('color:#1e293b') || htmlOutput.includes('color:#334155'), 'Presencia de color texto slate #1e293b / #334155');
console.log('   ✅ Paleta clara validada: backgrounds #ffffff / #f8fafc y textos legibles #0f172a / #1e293b / #334155.\n');

// Test 3: Verificación de los 4 KPIs del Big Data
console.log('📊 [TEST 3] Verificación de los 4 KPIs del Big Data');
// Cálculo esperado:
// Partidos disputados = 8
// Juegos totales = (6+4) + (6+5) + (7+5) + (6+2) + (6+3) + (4+6) + (6+4) + (5+5) = 10 + 11 + 12 + 8 + 9 + 10 + 10 + 10 = 80
// Media juegos/partido = 80 / 8 = 10.0
// Nivel de intensidad: 10.0 >= 6.4 => "Frenética" (color: #ef4444)
assert.strictEqual(ControlTowerSummary.lastSummaryData.totalMatches, 8, 'Total matches debe ser 8');
assert.strictEqual(ControlTowerSummary.lastSummaryData.totalGames, 80, 'Total games debe ser 80');
assert.strictEqual(ControlTowerSummary.lastSummaryData.avgGamesPerMatch, '10.0', 'Media games/match debe ser 10.0');
assert.strictEqual(ControlTowerSummary.lastSummaryData.intensityLevel, 'Frenética (Tensión Máxima)', 'Nivel de intensidad correcto');
assert.ok(Array.isArray(ControlTowerSummary.lastSummaryData.matches) && ControlTowerSummary.lastSummaryData.matches.length === 8, 'lastSummaryData.matches debe ser un array de 8 partidos finalizados');
assert.ok(Array.isArray(ControlTowerSummary.lastSummaryData.allMatches) && ControlTowerSummary.lastSummaryData.allMatches.length === 8, 'lastSummaryData.allMatches debe ser un array de partidos');

// Comprobar que aparecen en el marcado HTML generado
assert.ok(htmlOutput.includes('MÉTRICAS BIG DATA DEL EVENTO'), 'Sección Big Data presente en HTML');
assert.ok(htmlOutput.includes('Partidos disputados'), 'Label partidos disputados presente');
assert.ok(htmlOutput.includes('Juegos totales'), 'Label juegos totales presente');
assert.ok(htmlOutput.includes('Media juegos/partido'), 'Label media juegos presente');
assert.ok(htmlOutput.includes('Intensidad / Ritmo'), 'Label intensidad presente');
assert.ok(htmlOutput.includes('>80<'), 'Valor 80 juegos en el marcado');
assert.ok(htmlOutput.includes('>10.0<'), 'Valor 10.0 media en el marcado');
console.log('   ✅ Los 4 KPIs del Big Data calculados y presentados con exactitud.\n');

// Test 4: Verificación del Podio y Tarjeta MVP
console.log('🏆 [TEST 4] Verificación de Podio de Honor y Tarjeta MVP');
const ranking = ControlTowerSummary.lastRanking;
assert.ok(ranking && ranking.length >= 3, 'El ranking debe contener al menos 3 jugadores');

const p1 = ranking[0];
const p2 = ranking[1];
const p3 = ranking[2];

console.log(`   🥇 1º Puesto: ${p1.name} (${p1.points} pts, ${p1.won}V-${p1.lost}D, diff: ${p1.diff})`);
console.log(`   🥈 2º Puesto: ${p2.name} (${p2.points} pts, ${p2.won}V-${p2.lost}D, diff: ${p2.diff})`);
console.log(`   🥉 3º Puesto: ${p3.name} (${p3.points} pts, ${p3.won}V-${p3.lost}D, diff: ${p3.diff})`);

// Validar que Alex es el campeón (ha ganado sus 4 partidos: 6, 7, 6, 6 = 25 pts)
assert.strictEqual(p1.name, 'Alex', 'Alex debe liderar el podio con 4 victorias');
assert.strictEqual(p1.won, 4, 'Alex debe tener 4 victorias');
assert.strictEqual(p1.points, 25, 'Alex debe tener 25 puntos');

// Comprobar Podio en HTML
assert.ok(htmlOutput.includes('PODIO DE HONOR ESTELAR'), 'Título del podio presente');
assert.ok(htmlOutput.includes('👑 1º CAMPEÓN'), 'Distintivo de 1º Campeón presente');
assert.ok(htmlOutput.includes('2º SUBCAMPEÓN'), 'Distintivo de 2º Subcampeón presente');
assert.ok(htmlOutput.includes('3ER PUESTO'), 'Distintivo de 3er puesto presente');
assert.ok(htmlOutput.includes(p1.name), 'Nombre de p1 en el podio');
assert.ok(htmlOutput.includes(p2.name), 'Nombre de p2 en el podio');
assert.ok(htmlOutput.includes(p3.name), 'Nombre de p3 en el podio');

// Comprobar Tarjeta MVP en HTML
assert.ok(htmlOutput.includes('MVP OFICIAL DE LA JORNADA'), 'Pill MVP presente');
assert.ok(htmlOutput.includes('MVP DE LA JORNADA'), 'Título MVP presente');
assert.ok(htmlOutput.includes('Victorias'), 'Chip de victorias MVP presente');
assert.ok(htmlOutput.includes('Juegos ganados'), 'Chip de juegos ganados MVP presente');
assert.ok(htmlOutput.includes('Efectividad'), 'Chip de efectividad MVP presente');
assert.ok(htmlOutput.includes('en Pista 1'), 'Alex jugó en pista 1 y debe tener el chip correspondiente');
console.log('   ✅ Podio y Tarjeta MVP construidos adecuadamente.\n');

// Test 5: Verificación de las 8 Insignias Secretas ("Datos que Nadie Ve")
console.log('🎖️ [TEST 5] Verificación de las 8 Insignias ("Datos que Nadie Ve")');
const badges = ControlTowerSummary.lastSummaryData.badges;
assert.ok(badges, 'Badges object debe existir');

const badgeKeys = [
    'court1King',
    'defenseWall',
    'unbeatableStreak',
    'epicMatch',
    'deadlyTandem',
    'dieselEffect',
    'topScorer',
    'eloImpact'
];

badgeKeys.forEach(k => {
    assert.ok(badges[k], `La insignia ${k} debe estar calculada`);
    assert.ok(badges[k].name || badges[k].title, `La insignia ${k} debe tener nombre/título`);
    assert.ok(badges[k].detail, `La insignia ${k} debe tener detalle`);
    console.log(`   - [${k}]: ${badges[k].name || badges[k].title} -> ${badges[k].detail}`);
});

// Comprobar que las 8 insignias aparecen en el HTML generado
assert.ok(htmlOutput.includes('DATOS QUE NADIE VE'), 'Sección insignia presente');
assert.ok(htmlOutput.includes('8 INSIGNIAS'), 'Etiqueta 8 INSIGNIAS presente');
assert.ok(htmlOutput.includes('REY / REINA PISTA 1'), 'Badge 1 presente');
assert.ok(htmlOutput.includes('MURALLA DEFENSIVA'), 'Badge 2 presente');
assert.ok(htmlOutput.includes('RACHA IMBATIBLE'), 'Badge 3 presente');
assert.ok(htmlOutput.includes('PARTIDO MÁS ÉPICO'), 'Badge 4 presente');
assert.ok(htmlOutput.includes('TÁNDEM MÁS LETAL'), 'Badge 5 presente');
assert.ok(htmlOutput.includes('EFECTO DIÉSEL'), 'Badge 6 presente');
assert.ok(htmlOutput.includes('MÁXIMO CAÑONERO'), 'Badge 7 presente');
assert.ok(htmlOutput.includes('IMPACTO ELO'), 'Badge 8 presente');
console.log('   ✅ Las 8 insignias calculadas y renderizadas sin errores.\n');

// Test 6: Verificación de Gráficos SVG Interactivos sin NaN ni errores
console.log('📈 [TEST 6] Verificación de los Gráficos SVG (Evolución, Donut, Pistas)');

// 1. Gráfico de evolución
const evolutionSVG = ControlTowerSummary._renderEvolutionChartSVG(mockMatches, ranking);
assert.ok(evolutionSVG.includes('<svg'), 'Evolución debe generar un tag <svg>');
assert.ok(!evolutionSVG.includes('NaN'), 'El SVG de Evolución no debe contener valores NaN');
assert.ok(!evolutionSVG.includes('undefined'), 'El SVG de Evolución no debe contener valores undefined');
assert.ok(!evolutionSVG.includes('null'), 'El SVG de Evolución no debe contener valores null');
assert.ok(evolutionSVG.includes('toggleEvolutionMode'), 'Botones interactivos de modo (Acumulados / Por ronda) presentes');
assert.ok(evolutionSVG.includes('selectEvolutionPlayer'), 'Selector interactivo de jugadores Top 4 presente');
assert.ok(evolutionSVG.includes('Puntos Acumulados'), 'Etiqueta Puntos Acumulados presente');
assert.ok(evolutionSVG.includes('Juegos por Ronda'), 'Etiqueta Juegos por Ronda presente');

// 2. Gráfico Donut de Competitividad
const donutSVG = ControlTowerSummary._renderCompetitivenessDonutSVG(mockMatches);
assert.ok(donutSVG.includes('<svg'), 'Donut debe generar un tag <svg>');
assert.ok(!donutSVG.includes('NaN'), 'El SVG Donut no debe contener valores NaN');
assert.ok(!donutSVG.includes('undefined'), 'El SVG Donut no debe contener valores undefined');
assert.ok(donutSVG.includes('circle'), 'Donut debe contener elementos circle SVG');
assert.ok(donutSVG.includes('PARTIDOS'), 'Donut center text presente');
assert.ok(donutSVG.includes('Partidos de Infarto'), 'Categoría infarto presente');
assert.ok(donutSVG.includes('Partidos Disputados'), 'Categoría disputados presente');
assert.ok(donutSVG.includes('Victorias Cómodas'), 'Categoría cómodos presente');

// Comprobación de estado activo del Donut
ControlTowerSummary.activeCompetitivenessCategory = 'tight';
const donutTightSVG = ControlTowerSummary._renderCompetitivenessDonutSVG(mockMatches);
assert.ok(donutTightSVG.includes('INFARTO'), 'Texto central del Donut muestra INFARTO al seleccionar tight');
assert.ok(!donutTightSVG.includes('NaN'), 'Donut activo no debe contener NaN');
ControlTowerSummary.activeCompetitivenessCategory = null; // reset

// 3. Actividad por Pistas
const courtsBars = ControlTowerSummary._renderCourtsActivityBars(mockMatches);
assert.ok(courtsBars.includes('PISTA 1 (CENTRAL)'), 'Pista 1 identificada');
assert.ok(courtsBars.includes('PISTA 2'), 'Pista 2 identificada');
assert.ok(!courtsBars.includes('NaN'), 'Barras de pistas no deben contener NaN');

console.log('   ✅ Gráficos SVG interactivos renderizados de forma limpia, sin NaN ni valores inválidos.\n');

// Test 7: Verificación del Estado Vacío (Empty State)
console.log('🛡️ [TEST 7] Verificación de Casos Límite: Estado Vacío');
const emptyHtml = ControlTowerSummary.render([], mockEventDoc);
assert.ok(emptyHtml.includes('RESUMEN DE COMPETICIÓN EN PREPARACIÓN'), 'Empty state debe mostrar título amigable');
assert.ok(emptyHtml.includes('se generarán automáticamente en cuanto se confirmen los marcadores'), 'Empty state explica que faltan marcadores');
assert.ok(emptyHtml.includes('IR A RESULTADOS Y MARCADORES'), 'Botón a resultados presente');
console.log('   ✅ Estado vacío gestionado con éxito.\n');

// Test 8: Verificación en modo Entreno
console.log('🏋️ [TEST 8] Verificación en Modalidad Entreno');
const entrenoDoc = { ...mockEventDoc, name: 'Entreno Nivel 3.5', isEntreno: true };
const entrenoHtml = ControlTowerSummary.render(mockMatches, entrenoDoc);
assert.ok(entrenoHtml.includes('Temple y dominio en Pista 1'), 'Entreno debe adaptar la descripción del MVP para entrenos');
assert.ok(entrenoHtml.includes('Crónica oficial de Entreno Nivel 3.5'), 'Crónica oficial nombra el entreno adecuadamente');
console.log('   ✅ Modalidad Entreno adaptada a la perfección.\n');

// Test 9: Formateo de Texto Viral para WhatsApp
console.log('📲 [TEST 9] Verificación de Generación de Textos Virales');
assert.ok(ControlTowerSummary.lastChronicleText, 'Texto viral de WhatsApp debe estar preparado');
assert.ok(ControlTowerSummary.lastChronicleText.includes('PODIO DE HONOR'), 'Texto WhatsApp contiene podio');
assert.ok(ControlTowerSummary.lastChronicleText.includes('DATOS QUE NADIE VE'), 'Texto WhatsApp contiene datos secretos');
assert.ok(ControlTowerSummary.lastChronicleText.includes('Alex'), 'Texto WhatsApp contiene al ganador Alex');
console.log('   ✅ Texto para compartir en WhatsApp generado y formateado correctamente.\n');

console.log('🎉 ========================================================');
console.log('   CERTIFICACIÓN QA COMPLETADA: 9/9 PRUEBAS EXITOSAS (100%)');
console.log('========================================================');
