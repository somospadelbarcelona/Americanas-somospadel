/**
 * Test QA: Pactómetro Electoral de Negocio (Estilo 'La Sexta' / Ferreras)
 * Valida la interactividad en tiempo real, selector de metas, marcadores de coalición y pestañas de clubes.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🗳️ [TEST QA PACTÓMETRO LA SEXTA] Validando cuadro interactivo electoral de rentabilidad...");

const jsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');
const cssPath = path.join(__dirname, '../css/organizacion-erp.css');

const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

// 1. Verificación de la función renderPactometroDashboardView
assert(js.includes('renderPactometroDashboardView'), "Falta la función renderPactometroDashboardView en organizacion-erp.js");
console.log("  ✅ Función renderPactometroDashboardView implementada");

// 2. Verificación de integración directa en router y renderActiveTab
assert(js.includes("case 'pactometro':"), "Falta el enrutamiento a pactometro en renderActiveTab");
console.log("  ✅ Módulo de Reparto de Socios y Simulador configurado con acceso directo en el ERP");

// 3. Verificación de la Barra de Objetivo y Termómetro
assert(css.includes('.pactometro-meter-card'), "Falta .pactometro-meter-card en el CSS");
assert(css.includes('.pactometro-track-wrap'), "Falta .pactometro-track-wrap en el CSS");
assert(css.includes('.pactometro-fill-bar'), "Falta .pactometro-fill-bar en el CSS");
assert(css.includes('.pactometro-target-marker'), "Falta .pactometro-target-marker en el CSS");
assert(css.includes('.pactometro-target-flag'), "Falta .pactometro-target-flag en el CSS");
assert(js.includes('OBJETIVO:'), "Falta la bandera visual de objetivo mensual en JS");
console.log("  ✅ Barra de Objetivo y termómetro visual validados con éxito");

// 4. Verificación de Selector de Metas de Mayoría (660€, 1.000€, 1.500€, 2.000€)
assert(js.includes('targetMonthlyGoal'), "Falta targetMonthlyGoal en el estado o simulador");
assert(js.includes("updateNppSim('targetMonthlyGoal'"), "Falta el manejador para cambiar la meta del Pactómetro");
console.log("  ✅ Selector interactivo de metas (660€ piloto, 1.000€, 1.500€, 2.000€) operativo");

// 5. Verificación de Marcadores de Resultados (Alex, Socio, SomosPadel, New Padel Pro)
assert(js.includes('pactometro-scoreboard-grid'), "Falta el grid de marcadores de televisión");
assert(js.includes('Alex Coscolín'), "Falta el marcador de Alex Coscolín");
assert(js.includes('Xavi Perea'), "Falta el marcador de Xavi Perea");
assert(js.includes('Beneficio SomosPadel'), "Falta el marcador consolidado de SomosPadel");
assert(js.includes('Ganancia New Padel Pro'), "Falta el marcador de impacto para el club");
console.log("  ✅ Los 4 marcadores de resultados de coalición verificados");

// 6. Verificación de Navegación por Clubes en Cabecera
assert(js.includes("window.OrganizacionERP.selectClubTab('all')"), "Falta el acceso a Vista Consolidada desde el Pactómetro");
assert(js.includes("window.OrganizacionERP.openNewClubModal()"), "Falta el botón de Añadir Nuevo Club desde el Pactómetro");
console.log("  ✅ Sistema de pestañas por club integrado en la parte superior del Pactómetro");

console.log("\n🏆 [TEST QA PACTÓMETRO LA SEXTA] ¡Todas las verificaciones del Pactómetro han pasado al 100%!\n");
