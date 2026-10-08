// ============================================================================
// 🧪 QA TEST SUITE: HEADER BALL LOGO & BURGER CLUSTER PERSISTENCE
// Verifica que el logotipo de la pelota oficial de SomosPadel Barcelona
// esté pegado a las 3 rayas (hamburguesa), nunca desaparezca en ningún dispositivo,
// mantenga su color amarillo original (sin filtros invertidos) y tenga fallback seguro.
// ============================================================================

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failedTests++;
    }
}

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN QA: LOGO SOMOSPADEL FIJO JUNTO AL MENÚ HAMBURGUESA');
console.log('========================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const mobileCssPath = path.join(rootDir, 'css', 'mobile-header-fix.css');
const themeCssPath = path.join(rootDir, 'css', 'theme-playtomic.css');
const logoBallPath = path.join(rootDir, 'img', 'logo_somospadel.png');
const officialBallPath = path.join(rootDir, 'img', 'official_ball_logo.png');

const indexHtml = fs.readFileSync(indexPath, 'utf-8');
const mobileCss = fs.readFileSync(mobileCssPath, 'utf-8');
const themeCss = fs.readFileSync(themeCssPath, 'utf-8');

// 1. Archivos de imagen del logo existen y tienen tamaño
assert(fs.existsSync(logoBallPath) && fs.statSync(logoBallPath).size > 1000, 'img/logo_somospadel.png existe y es una imagen válida');
assert(fs.existsSync(officialBallPath) && fs.statSync(officialBallPath).size > 1000, 'img/official_ball_logo.png existe y es una imagen válida');

// 2. Estructura HTML en index.html
assert(indexHtml.includes('header-left-cluster'), 'index.html contiene el contenedor unificado .header-left-cluster');
assert(indexHtml.includes('id="btn-open-side-drawer"'), 'index.html contiene el botón de las 3 rayas (#btn-open-side-drawer)');
assert(indexHtml.includes('id="header-somospadel-ball-logo"'), 'index.html contiene el elemento img con id="header-somospadel-ball-logo"');
assert(indexHtml.includes('onerror="this.onerror=null; this.src=\'img/official_ball_logo.png\';"'), 'El logo tiene fallback automático a official_ball_logo.png en caso de error');

// 3. Proximidad y flex cluster
const leftClusterIndex = indexHtml.indexOf('header-left-cluster');
const burgerIndex = indexHtml.indexOf('id="btn-open-side-drawer"');
const logoIndex = indexHtml.indexOf('id="header-somospadel-ball-logo"');
assert(leftClusterIndex < burgerIndex && burgerIndex < logoIndex, 'El menú hamburguesa y el logo están agrupados conjuntamente en el cluster izquierdo');

// 4. theme-playtomic.css NO invierte los colores del logo a blanco
assert(!themeCss.includes('filter: brightness(0) invert(1)'), 'theme-playtomic.css no aplica filter invertido que vuelva blanco el logo');

// 5. mobile-header-fix.css persistencia y no compresión
assert(mobileCss.includes('.header-left-cluster'), 'mobile-header-fix.css define estilos para .header-left-cluster');
assert(mobileCss.includes('flex-shrink: 0 !important'), 'mobile-header-fix.css impide que el cluster del logo se encoja o colapse');
assert(mobileCss.includes('#header-somospadel-ball-logo'), 'mobile-header-fix.css tiene reglas específicas para #header-somospadel-ball-logo');
assert(mobileCss.includes('visibility: visible !important'), 'mobile-header-fix.css fuerza visibilidad visible para el logo');

console.log('\n========================================================================');
console.log(`📊 RESULTADO QA: ${passedTests} pruebas pasadas, ${failedTests} fallidas.`);
console.log('========================================================================\n');

if (failedTests > 0) {
    process.exit(1);
}
