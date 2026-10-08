/**
 * TEST QA: Verificación de Integridad de Selectores e IDs de Interfaz Móvil y Desktop
 */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const requiredIds = [
    'subnav-app-bar',
    'btn-open-side-drawer',
    'btn-header-notifications',
    'user-dropdown-container',
    'side-drawer-menu',
    'community-popup-menu',
    'nav-dashboard',
    'nav-americanas',
    'nav-entrenos',
    'nav-ranking',
    'nav-community',
    'nav-profile'
];

let failed = 0;
console.log('--- AUDITORÍA DE SELECTORES E IDS CLAVE EN INDEX.HTML ---');
requiredIds.forEach(id => {
    const pattern = new RegExp(`id=["']${id}["']`);
    if (pattern.test(indexHtml)) {
        console.log(`  ✅ [PRESENTE] #${id}`);
    } else {
        console.error(`  ❌ [FALTANTE] #${id}`);
        failed++;
    }
});

// Comprobar selectores CSS en archivos de estilo
const cssChecks = [
    { file: 'css/mobile-header-fix.css', selectors: ['.user-dropdown-container', '#side-drawer-menu'] },
    { file: 'css/nav-mobile.css', selectors: ['.bottom-nav-bar', '.nav-item'] },
    { file: 'css/player-enterprise.css', selectors: ['.glass-card', '.americana-card', '.dashboard-card'] }
];

console.log('\n--- AUDITORÍA DE SELECTORES CLAVE EN ARCHIVOS CSS ---');
cssChecks.forEach(check => {
    const filePath = path.join(__dirname, '..', check.file);
    const cssContent = fs.readFileSync(filePath, 'utf8');
    check.selectors.forEach(sel => {
        if (cssContent.includes(sel)) {
            console.log(`  ✅ [OK] ${check.file} contiene "${sel}"`);
        } else {
            console.error(`  ❌ [FALTA] ${check.file} no contiene "${sel}"`);
            failed++;
        }
    });
});

if (failed > 0) {
    console.error(`\n❌ Error: ${failed} verificaciones fallaron.`);
    process.exit(1);
} else {
    console.log('\n🎉 Todos los IDs y selectores requeridos están 100% íntegros y validados.');
}
