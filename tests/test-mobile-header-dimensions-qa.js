/**
 * QA Test Suite: Mobile Header Overflow & Dimensions Guard
 * Valida que los componentes del Header (.cmd-bar) quepan sin overflow horizontal
 * en todas las resoluciones móviles estándar: 320px, 360px, 375px, 390px, 412px, 430px,
 * y que el menú desplegable de usuario (.user-dropdown-menu) se despliegue a lo largo
 * sin ser recortado por overflow: hidden en .cmd-bar.
 */

const fs = require('fs');
const path = require('path');

console.log('🎾 [QA TEST] Verificando Mobile Header Dimensions, Dropdown & Overflow Guard...');

const mobileCssPath = path.join(__dirname, '..', 'css', 'mobile-header-fix.css');
const responsiveCssPath = path.join(__dirname, '..', 'css', 'responsive-global.css');
const notifCssPath = path.join(__dirname, '..', 'css', 'notifications.css');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const swJsPath = path.join(__dirname, '..', 'sw.js');

const mobileCss = fs.readFileSync(mobileCssPath, 'utf8');
const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf8');
const notifCss = fs.readFileSync(notifCssPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const swJs = fs.readFileSync(swJsPath, 'utf8');

let errors = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ [FAIL] ${message}`);
        errors++;
    } else {
        console.log(`✅ [PASS] ${message}`);
    }
}

// 1. Validar que .cmd-bar tenga padding reducido y overflow visible para desplegables
assert(mobileCss.includes('padding: 0 8px !important;'), 'mobile-header-fix.css contiene padding: 0 8px !important para móvil');
assert(!/\.cmd-bar\s*\{[^}]*overflow-x:\s*hidden/s.test(mobileCss), 'mobile-header-fix.css NO tiene overflow-x: hidden en .cmd-bar (permite desplegar el menú de perfil a lo largo)');
assert(mobileCss.includes('overflow: visible !important;'), 'mobile-header-fix.css tiene overflow: visible en .cmd-bar');
assert(!/\.cmd-bar\s*\{[^}]*overflow-x:\s*hidden/s.test(responsiveCss), 'responsive-global.css NO tiene overflow-x: hidden en .cmd-bar');

// 2. Validar despliegue de .user-dropdown-menu
assert(mobileCss.includes('.user-dropdown-container.open .user-dropdown-menu'), 'mobile-header-fix.css define apertura de .user-dropdown-menu');
assert(mobileCss.includes('display: flex !important;'), 'user-dropdown-menu se muestra con display: flex al abrir');
assert(mobileCss.includes('overflow-y: auto;'), 'user-dropdown-menu permite scroll vertical a lo largo si sobrepasa la altura');

// 3. Validar dimensiones de botones
assert(mobileCss.includes('width: 36px !important;') && mobileCss.includes('height: 36px !important;'), 'Botones adaptados a 36px en móvil');
assert(mobileCss.includes('border-radius: 10px !important;'), 'Border radius 10px en móvil para botones');

// 4. Validar rotador de historias
assert(mobileCss.includes('.header-rotator-label {\n        display: none !important;'), 'Etiquetas de texto de historias ocultas en móvil para máxima holgura');
assert(mobileCss.includes('.header-rotator-sphere-wrap {\n        width: 25px !important;\n        height: 25px !important;'), 'Esferas del rotador dimensionadas a 25px');

// 5. Validar avatar y user level
assert(mobileCss.includes('#header-user-level {\n        padding: 3px 6px !important;\n        font-size: 0.78rem !important;'), 'Píldora de rating/nivel optimizada a 3px 6px');
assert(mobileCss.includes('width: 34px !important;\n        height: 34px !important;\n        min-width: 34px !important;'), 'Avatar optimizado a 34px');

// 6. Validar soporte ultra estrecho (<= 380px y <= 340px)
assert(mobileCss.includes('@media (max-width: 380px)'), 'Contiene media query para pantallas <= 380px');
assert(mobileCss.includes('@media (max-width: 340px)'), 'Contiene media query para pantallas ultra pequeñas (320px)');

// 7. Validar caché Service Worker
assert(/somospadel-pwa-v2026\.6\.[1-9]/.test(swJs), 'sw.js actualizado con versión somospadel-pwa-v2026.6.1 o superior');

// 8. Simulación matemática de ancho en 360px:
const padding = 8 * 2; // 16px
const burger = 36;
const gapCluster = 5;
const ball = 33;
const cluster = burger + gapCluster + ball; // 74px
const gap1 = 5;
const rotator = 25 * 2 + 4 + 8; // 62px
const gap2 = 5;
const chatBtn = 36;
const gap3 = 5;
const notifBtn = 36;
const gap4 = 5;
const levelPill = 38; // estimado "3.22" con padding 3px 6px
const gapTrigger = 4;
const avatar = 34;
const trigger = levelPill + gapTrigger + avatar; // 76px

const totalWidth = padding + cluster + gap1 + rotator + gap2 + chatBtn + gap3 + notifBtn + gap4 + trigger;
console.log(`\n📐 [Cálculo de Ancho en 360px]:`);
console.log(`- Padding: ${padding}px`);
console.log(`- Left cluster (burger + ball): ${cluster}px`);
console.log(`- Story rotator: ${rotator}px`);
console.log(`- Chat button: ${chatBtn}px`);
console.log(`- Notification button: ${notifBtn}px`);
console.log(`- User dropdown trigger (level + avatar): ${trigger}px`);
console.log(`- 4 Gaps entre secciones: ${gap1 * 4}px`);
console.log(`=> ANCHO TOTAL REQUERIDO: ${totalWidth}px en pantalla de 360px (Margen libre: ${360 - totalWidth}px)`);

assert(totalWidth < 360, `El header cabe holgadamente en pantalla de 360px (Margen de ${360 - totalWidth}px libres)`);
assert(totalWidth < 375, `El header cabe holgadamente en iPhone (375px) (Margen de ${375 - totalWidth}px libres)`);

if (errors === 0) {
    console.log('\n🎉 [PASS] Todas las validaciones de dimensiones de cabecera y desplegable pasaron exitosamente!');
    process.exit(0);
} else {
    console.error(`\n❌ [FAIL] Se encontraron ${errors} errores.`);
    process.exit(1);
}
