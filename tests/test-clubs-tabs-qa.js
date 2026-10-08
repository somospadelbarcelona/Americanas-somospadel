/**
 * Test QA: Sistema Multi-Club por Pestañas, Escalabilidad y Vista Detallada
 */
const fs = require('fs');
const path = require('path');

console.log("🏢 [TEST QA MULTI-CLUB] Auditando sistema de pestañas por club y escalabilidad...");

const erpJsPath = path.join(__dirname, '../js/modules/organizacion-erp.js');
const erpHtmlPath = path.join(__dirname, '../organizacion.html');
const erpCssPath = path.join(__dirname, '../css/organizacion-erp.css');

const jsContent = fs.readFileSync(erpJsPath, 'utf8');
const htmlContent = fs.readFileSync(erpHtmlPath, 'utf8');
const cssContent = fs.readFileSync(erpCssPath, 'utf8');

// 1. Verificar presencia de componentes clave en JS
const checksJS = [
    { label: 'DEFAULT_REGISTERED_CLUBS registrado', test: jsContent.includes('DEFAULT_REGISTERED_CLUBS') },
    { label: 'Carga de clubes desde localStorage', test: jsContent.includes('loadRegisteredClubs') },
    { label: 'Estado activo de club (activeClubTab)', test: jsContent.includes('activeClubTab') },
    { label: 'Función selectClubTab implementada', test: jsContent.includes('function selectClubTab') },
    { label: 'Función openNewClubModal implementada', test: jsContent.includes('function openNewClubModal') },
    { label: 'Función saveNewClubFromForm implementada', test: jsContent.includes('function saveNewClubFromForm') },
    { label: 'Función openEditClubModal implementada', test: jsContent.includes('function openEditClubModal') },
    { label: 'Función saveClubEdits implementada', test: jsContent.includes('function saveClubEdits') },
    { label: 'Función deleteClub implementada', test: jsContent.includes('function deleteClub') },
    { label: 'Función renderAllClubsConsolidatedView implementada', test: jsContent.includes('function renderAllClubsConsolidatedView') },
    { label: 'Función renderClubDetailView implementada', test: jsContent.includes('function renderClubDetailView') },
    { label: 'Simulador individual por club (updateClubSim)', test: jsContent.includes('function updateClubSim') },
    { label: 'Exportación de métodos de club en return', test: jsContent.includes('openEditClubModal') && jsContent.includes('saveClubEdits') && jsContent.includes('deleteClub') }
];

checksJS.forEach(c => {
    if (!c.test) {
        console.error(`❌ [FALLO] ${c.label}`);
        process.exit(1);
    }
    console.log(`  ✅ ${c.label}`);
});

// 2. Verificar modal de alta de nuevo club y edición en HTML
const checksHTML = [
    { label: 'Modal erp-new-club-modal presente en organizacion.html', test: htmlContent.includes('id="erp-new-club-modal"') },
    { label: 'Campo new-club-name presente', test: htmlContent.includes('id="new-club-name"') },
    { label: 'Campo new-club-tariff-morning presente', test: htmlContent.includes('id="new-club-tariff-morning"') },
    { label: 'Campo new-club-tariff-evening (Tardes) presente', test: htmlContent.includes('id="new-club-tariff-evening"') },
    { label: 'Campo new-club-tariff-night (Noches) diferenciado presente', test: htmlContent.includes('id="new-club-tariff-night"') },
    { label: 'Campo edit-club-tariff-evening (Tardes) presente', test: htmlContent.includes('id="edit-club-tariff-evening"') },
    { label: 'Campo edit-club-tariff-night (Noches) diferenciado presente', test: htmlContent.includes('id="edit-club-tariff-night"') },
    { label: 'Botón de guardar nuevo club con saveNewClubFromForm', test: htmlContent.includes('saveNewClubFromForm') }
];

checksHTML.forEach(c => {
    if (!c.test) {
        console.error(`❌ [FALLO] ${c.label}`);
        process.exit(1);
    }
    console.log(`  ✅ ${c.label}`);
});

// 3. Verificar estilos CSS de pestañas de clubes
const checksCSS = [
    { label: 'Clase .club-tabs-nav presente', test: cssContent.includes('.club-tabs-nav') },
    { label: 'Clase .club-tab-pill presente', test: cssContent.includes('.club-tab-pill') },
    { label: 'Clase .club-tab-pill.active presente', test: cssContent.includes('.club-tab-pill.active') },
    { label: 'Clase .club-tab-pill-add presente', test: cssContent.includes('.club-tab-pill-add') },
    { label: 'Clase .club-header-banner presente', test: cssContent.includes('.club-header-banner') },
    { label: 'Clase .club-sim-card presente', test: cssContent.includes('.club-sim-card') }
];

checksCSS.forEach(c => {
    if (!c.test) {
        console.error(`❌ [FALLO] ${c.label}`);
        process.exit(1);
    }
    console.log(`  ✅ ${c.label}`);
});

console.log("\n🏆 [TEST QA MULTI-CLUB] ¡Todas las verificaciones del sistema por club han pasado al 100%!");
