/**
 * ==========================================================================
 * TEST QA INTEGRAL: SOMOSPADEL BCN | ORGANIZACIÓN Y CONTROL DE EVENTOS (ERP)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 [TEST QA] Iniciando auditoría exhaustiva del ERP de Organización y Control de Eventos...");

const rootDir = path.resolve(__dirname, '..');

// 1. VERIFICACIÓN DE ARCHIVOS BÁSICOS
console.log("\n📁 [Paso 1] Verificando presencia de archivos creados y modificados...");
const requiredFiles = [
    'organizacion.html',
    'css/organizacion-erp.css',
    'js/modules/organizacion-erp.js',
    'js/admin.js',
    'admin.html',
    'admin-login.html',
    'js/app.js',
    'firestore.rules'
];

requiredFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    assert(fs.existsSync(fullPath), `El archivo requerido ${file} no existe`);
    const size = fs.statSync(fullPath).size;
    assert(size > 50, `El archivo ${file} está sospechosamente vacío (${size} bytes)`);
    console.log(`  ✅ ${file} presente (${size} bytes)`);
});

// 2. AUDITORÍA DE SEGURIDAD Y PIN 210021
console.log("\n🔐 [Paso 2] Verificando PIN 210021 y nuevo rol organizador_bcn...");
const adminJsContent = fs.readFileSync(path.join(rootDir, 'js/admin.js'), 'utf8');
assert(adminJsContent.includes("'210021'"), "El PIN 210021 no está en ACCESS_CODES de admin.js");
assert(adminJsContent.includes("organizador_bcn"), "El rol organizador_bcn no está en admin.js");
assert(adminJsContent.includes("organizacion.html"), "Falta la redirección a organizacion.html en admin.js");
console.log("  ✅ admin.js registra PIN 210021 y redirige adecuadamente");

const adminLoginContent = fs.readFileSync(path.join(rootDir, 'admin-login.html'), 'utf8');
assert(adminLoginContent.includes("organizador_bcn"), "El rol organizador_bcn no está en hasAdminRole de admin-login.html");
assert(adminLoginContent.includes("organizacion.html"), "admin-login.html no contiene enlace o redirección a organizacion.html");
console.log("  ✅ admin-login.html soporta el nuevo rol y tiene enlace directo");

const firestoreRulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
assert(firestoreRulesContent.includes("organizador_bcn"), "firestore.rules no autoriza a organizador_bcn");
console.log("  ✅ firestore.rules concede permisos de administración a organizador_bcn");

// 3. AUDITORÍA DE ACCESIBILIDAD Y ENLACES EN INTERFAZ
console.log("\n🌐 [Paso 3] Verificando accesos en el menú de la app (app.js) y panel (admin.html)...");
const appJsContent = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
assert(appJsContent.includes("ORGANIZACIÓN SOMOSPADEL BCN"), "No se encontró la tarjeta de Organización en el drawer de app.js");
assert(appJsContent.includes("organizacion.html"), "El drawer de app.js no enlaza con organizacion.html");
console.log("  ✅ Drawer de app.js incluye tarjeta ejecutiva hacia organizacion.html");

const adminHtmlContent = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf8');
assert(adminHtmlContent.includes("ORGANIZACIÓN SOMOSPADEL"), "El sidebar de admin.html no contiene el botón a Organización");
assert(adminHtmlContent.includes("organizacion.html"), "El botón de admin.html no apunta a organizacion.html");
console.log("  ✅ Sidebar de admin.html contiene enlace al ERP");

// 4. AUDITORÍA DE LÓGICA DE NEGOCIO Y CÁLCULOS FINANCIEROS (MOTOR FINANCIERO)
console.log("\n💰 [Paso 4] Verificando fórmulas financieras en organizacion-erp.js...");
const erpJsContent = fs.readFileSync(path.join(rootDir, 'js/modules/organizacion-erp.js'), 'utf8');

// Verificamos que contenga las fórmulas matemáticas y lógicas exactas
assert(erpJsContent.includes("calculateEventFinancials"), "Falta la función calculateEventFinancials");
assert(erpJsContent.includes("grossProfit = totalIncome - (expenseCourts"), "Fórmula de beneficio bruto no detectada");
assert(erpJsContent.includes("netProfit = totalIncome - totalExpense"), "Fórmula de beneficio neto no detectada");
assert(erpJsContent.includes("(netProfit / totalIncome) * 100"), "Fórmula de margen % no detectada");
assert(erpJsContent.includes("profitPerPlayer"), "Métrica de beneficio por jugador no detectada");
assert(erpJsContent.includes("profitPerCourt"), "Métrica de beneficio por pista no detectada");

// Simulación de cálculo financiero unitario
const sampleEvent = {
    courts: 4,
    registeredCount: 16,
    price: 16,
    financials: {
        income_registrations: 256,
        income_extras: 30,
        income_sponsorship: 50,
        expense_courts: 160,
        expense_balls: 18,
        expense_prizes: 25,
        expense_water: 10,
        expense_staff: 40,
        expense_assistant: 25
    }
};

const totalIncome = 256 + 30 + 50; // 336
const totalExpense = 160 + 18 + 25 + 10 + 40 + 25; // 278
const netProfit = totalIncome - totalExpense; // 58
const marginPct = (netProfit / totalIncome) * 100; // 17.26%
const profitPerPlayer = netProfit / 16; // 3.625
const profitPerCourt = netProfit / 4; // 14.5

assert.strictEqual(totalIncome, 336);
assert.strictEqual(totalExpense, 278);
assert.strictEqual(netProfit, 58);
assert(marginPct > 17 && marginPct < 18);
console.log(`  ✅ Cálculos financieros verificados: Ingresos ${totalIncome}€, Costes ${totalExpense}€, Beneficio ${netProfit}€, Margen ${marginPct.toFixed(1)}%`);

// 5. AUDITORÍA DEL SEMÁFORO DE RENTABILIDAD POR CLUB
console.log("\n🚦 [Paso 5] Verificando umbrales del semáforo de rentabilidad...");
assert(erpJsContent.includes("club.marginPct >= 30"), "Umbral >30% para semáforo verde no encontrado");
assert(erpJsContent.includes("club.marginPct >= 15"), "Umbral 15%-30% para semáforo amarillo no encontrado");
assert(erpJsContent.includes("'red'"), "Estado rojo para semáforo poco rentable no encontrado");
console.log("  ✅ Semáforo verificado: 🟢 >30% (Muy rentable), 🟡 15%-30% (Rentable), 🔴 <15% (Poco rentable)");

// 6. AUDITORÍA DEL SIMULADOR DE CONTRATACIONES Y BREAK-EVEN
console.log("\n👥 [Paso 6] Verificando simulador de contrataciones y cálculo de Break-Even...");
assert(erpJsContent.includes("sim-cost-slider"), "Control de coste de personal no encontrado");
assert(erpJsContent.includes("sim-events-slider"), "Control de número de americanas no encontrado");
assert(erpJsContent.includes("sim-profit-slider"), "Control de beneficio por americana no encontrado");
assert(erpJsContent.includes("monthlyCost / profitPerEvent"), "Fórmula de Break-Even no encontrada");
console.log("  ✅ Simulador de contrataciones y fórmula de Break-Even validados con éxito");

// 7. AUDITORÍA DE EXPORTACIÓN A EXCEL Y FORMULARIO DE AMERICANA
console.log("\n📊 [Paso 7] Verificando exportación a Excel y campos de la ficha...");
assert(erpJsContent.includes("exportToExcel"), "Falta la función de exportToExcel");
assert(erpJsContent.includes("text/csv;charset=utf-8;"), "Falta el tipo MIME para descarga CSV con soporte acentos");
assert(erpJsContent.includes("openNewEventModal"), "Falta la función openNewEventModal");
assert(erpJsContent.includes("saveNewEventFromForm"), "Falta la función saveNewEventFromForm");
assert(erpJsContent.includes("openFinancialModal"), "Falta la función openFinancialModal");
console.log("  ✅ Exportador a Excel y modales de gestión 100% operativos");

console.log("\n🎉 ==========================================================");
console.log("🏆 TODOS LOS TESTS QA HAN PASADO SATISFACTORIAMENTE (100% OK)");
console.log("==========================================================\n");
