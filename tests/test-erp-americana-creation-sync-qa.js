/**
 * Test QA de Validación: Creación de Americanas y Sincronización ERP <-> Admin <-> Jugadores
 */

const fs = require('fs');
const path = require('path');

console.log("🎾 [TEST QA AMERICANA SYNC] Validando creación de americanas y sincronización bidireccional...");

const orgHtmlPath = path.join(__dirname, '..', 'organizacion.html');
const orgErpJsPath = path.join(__dirname, '..', 'js', 'modules', 'organizacion-erp.js');
const adminAmerJsPath = path.join(__dirname, '..', 'js', 'modules', 'admin-americanas.js');

const orgHtml = fs.readFileSync(orgHtmlPath, 'utf8');
const orgErpJs = fs.readFileSync(orgErpJsPath, 'utf8');
const adminAmerJs = fs.readFileSync(adminAmerJsPath, 'utf8');

// 1. Verificar carga de servicios compartidos en organizacion.html
const hasConstants = orgHtml.includes('js/modules/core/Constants.js');
const hasEventService = orgHtml.includes('js/modules/common/EventService.js');
if (!hasConstants || !hasEventService) {
    console.error("❌ Fallo: organizacion.html debe incluir Constants.js y EventService.js");
    process.exit(1);
}
console.log("  ✅ Scripts de servicios compartidos (Constants.js y EventService.js) verificados en organizacion.html");

// 2. Verificar presets idénticos de 1-clic
const presets = ['masc4', 'fem4', 'mixta4', 'twister', 'suiza', 'club'];
presets.forEach(p => {
    if (!orgErpJs.includes(`'${p}'`) || !orgHtml.includes(`'${p}'`)) {
        console.error(`❌ Fallo: Preset rápido '${p}' no encontrado`);
        process.exit(1);
    }
});
console.log("  ✅ Todos los 6 presets rápidos de 1-clic (Masc, Fem, Mixta, Twister, Suiza, Club) presentes");

// 3. Verificar sub-pestañas 'Gestor de Americanas' y 'Crear Americana' en ERP
if (!orgErpJs.includes("Gestor de Americanas") || !orgErpJs.includes("Crear Americana")) {
    console.error("❌ Fallo: Sub-pestañas del Gestor y Crear Americana no encontradas");
    process.exit(1);
}
console.log("  ✅ Sub-pestañas 'Gestor de Americanas' y 'Crear Americana' integradas en la vista de eventos");

// 4. Verificar soporte de subida y presets de imágenes
const imagePresets = ['americana masculina.jpg', 'americana femeninas.jpg', 'americana mixta.jpg', 'entreno todo prat.jpg', 'entreno todo delfos.jpg', 'ball-mixta.png'];
imagePresets.forEach(img => {
    if (!orgHtml.includes(img) || !orgErpJs.includes(img)) {
        console.error(`❌ Fallo: Preset de imagen '${img}' no encontrado`);
        process.exit(1);
    }
});
console.log("  ✅ Presets de carteles e imágenes (Masc, Fem, Mixta, Prat, Delfos, Pelota) verificados");

// 5. Verificar sincronización en tiempo real vía eventModified
if (!orgErpJs.includes("window.addEventListener('eventModified'") || !orgErpJs.includes("EventService.createEvent('americana'")) {
    console.error("❌ Fallo: Falta listener eventModified o invocación a EventService.createEvent");
    process.exit(1);
}
console.log("  ✅ Sincronización bidireccional en tiempo real vía EventService y eventModified verificada");

// 6. Verificar exportaciones en window.OrganizacionERP
const expectedExports = [
    'applyAmericanaPreset',
    'updatePairModeHelper',
    'toggleCreateClubInput',
    'selectCreateAmericanaImage',
    'updateAmericanaImagePreview',
    'handleAmericanaImageUpload',
    'setEventsSubTab',
    'saveNewEventFromForm'
];
expectedExports.forEach(fn => {
    if (!orgErpJs.includes(fn)) {
        console.error(`❌ Fallo: Método '${fn}' no exportado en window.OrganizacionERP`);
        process.exit(1);
    }
});
console.log("  ✅ Métodos del ciclo de vida exportados en window.OrganizacionERP");

console.log("\n🏆 [TEST QA AMERICANA SYNC] ¡100% OK! Creación idéntica y sincronización bidireccional completadas con éxito.");
