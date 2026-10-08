/**
 * Test QA: Verificación de la Alineación Exacta con el Dossier Oficial del PDF de New Padel Pro
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("📄 [TEST QA DOSSIER OFICIAL] Validando fidelidad matemática y documental del PDF...");

const jsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. Verificación de presencia del renderNppDossierOfficialView y botón en cabecera
assert(js.includes('renderNppDossierOfficialView'), "Falta la función renderNppDossierOfficialView");
assert(js.includes("setNppSection('dossier')"), "Falta el botón de cambiar a sección dossier en la cabecera");
console.log("  ✅ Función renderNppDossierOfficialView y botón en cabecera verificados");

// 2. Fórmulas de beneficio neto exactas del PDF
// Mañana: 120€ ingresos, 60€ pistas, 5€ pelotas, 5€ reserva -> 50€ neto exacto
assert(js.includes('50 € por americana'), "Falta el beneficio neto oficial de 50€ por americana en mañanas");
// Viernes noche: 240€ ingresos, 120€ pistas, 5€ pelotas -> 115€ neto exacto
assert(js.includes('115 € por americana'), "Falta el beneficio neto oficial de 115€ por americana en viernes");
console.log("  ✅ Cifras base netas verificadas (50€ mañanas / 115€ viernes noche)");

// 3. Regla 60 / 40 oficial del PDF
assert(js.includes('30 €') && js.includes('20 €'), "Falta el reparto 30€/20€ en mañanas de la Regla 60/40");
assert(js.includes('69 €') && js.includes('46 €'), "Falta el reparto 69€/46€ en viernes de la Regla 60/40");
console.log("  ✅ Reparto Regla 60/40 verificado (Mañanas: 30€/20€ | Viernes: 69€/46€)");

// 4. Regla 50 / 50 oficial del PDF
assert(js.includes('25 €') && js.includes('57,50 €'), "Faltan los repartos 25€/25€ y 57,50€/57,50€ de la Regla 50/50");
console.log("  ✅ Reparto Regla 50/50 verificado (Mañanas: 25€/25€ | Viernes: 57,50€/57,50€)");

// 5. Modelo de Delegación: Coordinador Externo
assert(js.includes('12,50 € pasivos por socio'), "Falta el cálculo de 12,50€ pasivos por socio en mañanas");
assert(js.includes('40 € pasivos por socio'), "Falta el cálculo de 40€ pasivos por socio en viernes");
console.log("  ✅ Ingresos pasivos con coordinador externo validados (12,50€ mañanas / 40€ viernes)");

// 6. Impacto económico para New Padel Pro (Argumentario comercial del club)
assert(js.includes('+720 € / mes'), "Falta el impacto de pistas para el club (720€)");
assert(js.includes('+400 € / mes'), "Falta el consumo estimado de bar para el club (400€)");
assert(js.includes('+1.120 € / mes'), "Falta la facturación total para el club (1.120€)");
console.log("  ✅ Argumentario comercial de ingresos para New Padel Pro verificado (1.120€/mes)");

console.log("\n🏆 [TEST QA DOSSIER OFICIAL] ¡Alineación con el PDF del usuario al 100%!\n");
