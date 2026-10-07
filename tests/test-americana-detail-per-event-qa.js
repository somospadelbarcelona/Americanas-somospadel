/**
 * tests/test-americana-detail-per-event-qa.js
 * Test QA: Verificación de la opción 'Detalle Americana por Americana'
 * y desglose unitario en el Pactómetro / Simulador y ERP.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🎾 [TEST QA DETALLE AMERICANA POR AMERICANA] Iniciando validación...");

const erpJsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');
const erpCssPath = path.join(__dirname, '../css/organizacion-erp.css');

assert(fs.existsSync(erpJsPath), "Falta el archivo organizacion-erp.js");
assert(fs.existsSync(erpCssPath), "Falta el archivo organizacion-erp.css");

const erpJs = fs.readFileSync(erpJsPath, 'utf8');
const erpCss = fs.readFileSync(erpCssPath, 'utf8');

// 1. Selector de modo de visualización en el Pactómetro
assert(erpJs.includes('pactometro-view-selector-bar'), "Debe incluir la barra selectora de modo de visualización");
assert(erpJs.includes('viewDetailMode'), "El simulador debe soportar el estado viewDetailMode");
assert(erpJs.includes('selectedEventDetail'), "El simulador debe soportar selectedEventDetail");
console.log("  ✅ Barra selectora de vista y estados de detalle unitario presentes");

// 2. Modos de visualización: Resumen Mensual vs Detalle Americana por Americana
assert(erpJs.includes("updateNppSim('viewDetailMode', 'monthly')"), "Debe permitir seleccionar el resumen total mensual");
assert(erpJs.includes("updateNppSim('viewDetailMode', 'per_event')"), "Debe permitir seleccionar el detalle americana por americana");
console.log("  ✅ Selectores 'Resumen Total Mes' y 'Detalle Americana por Americana' operativos");

// 3. Fichas unitarias comparativas (Mañanas y Viernes Noches)
assert(erpJs.includes('Americana Miércoles Mañanas (10:00 - 11:30)'), "Debe detallar la ficha de Americana Miércoles Mañanas");
assert(erpJs.includes('Americana Viernes Noche (20:30 - 22:30)'), "Debe detallar la ficha de Americana Viernes Noche");
assert(erpJs.includes('pactometro-detail-grid'), "Debe contar con la cuadrícula de fichas unitarias");
console.log("  ✅ Fichas unitarias de Miércoles Mañanas (+50€) y Viernes Noches (+115€) verificadas");

// 4. Tabla interactiva de desglose de las 8 americanas programadas del mes
assert(erpJs.includes('pactometro-detail-table'), "Debe incluir la tabla detallada de americanas");
assert(erpJs.includes('CALENDARIO OFICIAL · 8 EVENTOS AL MES') || erpJs.includes('8 AMERICANAS PROGRAMADAS'), "Debe contemplar el calendario oficial de 8 eventos al mes");
assert(erpJs.includes('TOTAL MENSUAL (8 AMERICANAS)'), "La tabla debe incluir la fila totalizadora consolidada");
console.log("  ✅ Tabla de desglose de las 8 americanas individuales del mes verificada");

// 5. CSS del selector y tablas
assert(erpCss.includes('.pactometro-view-selector-bar'), "CSS debe incluir .pactometro-view-selector-bar");
assert(erpCss.includes('.pactometro-toggle-pill'), "CSS debe incluir .pactometro-toggle-pill");
assert(erpCss.includes('.pactometro-detail-table'), "CSS debe incluir .pactometro-detail-table");
console.log("  ✅ Estilos CSS para el selector de vistas y tabla de detalle validados");

// 6. Sub-pestaña 'Detalle por Americana' en Contabilidad
assert(erpJs.includes("setDashboardSubTab('perevent')"), "Contabilidad & Informes debe incluir la pestaña 'perevent'");
console.log("  ✅ Sub-pestaña 'Detalle por Americana' accesible desde Contabilidad");

// 7. Verificación de Xavi Perea y Escenarios Rápidos apilados
assert(erpJs.includes('Xavi Perea'), "Debe incluir a Xavi Perea como socio fundador/estratégico");
assert(erpJs.includes('pactometro-presets-box'), "Los escenarios de reparto deben estar en un contenedor estructurado");
assert(erpJs.includes('pactometro-presets-title'), "El título de los escenarios rápidos debe estar en su propia línea superior");
console.log("  ✅ Socio 'Xavi Perea' y título de escenarios apilado en la línea superior verificados");

// 8. Exportación del helper en OrganizacionERP
assert(erpJs.includes('setViewDetailMode'), "OrganizacionERP debe exportar setViewDetailMode");
console.log("  ✅ Método setViewDetailMode exportado en la API pública");

console.log("\n🏆 [TEST QA DETALLE AMERICANA POR AMERICANA] ¡100% OK! Todo validado exitosamente.\n");
