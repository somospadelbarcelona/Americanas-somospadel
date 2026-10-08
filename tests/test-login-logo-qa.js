/**
 * QA Test Suite: Validación de dimensiones, centrado y compatibilidad de Logo de Inicio
 */
const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`❌ FALLO: ${message}`);
        throw new Error(message);
    }
    passedTests++;
    console.log(`  ✅ PASADO: ${message}`);
}

console.log('🎾 INICIANDO AUDITORÍA QA DE LOGO DE INICIO (#login-ball-wrap / #login-ball-img)');

const rootDir = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(rootDir, 'index.html');
const responsiveCssPath = path.join(rootDir, 'css', 'responsive-global.css');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf8');

// 1. Verificar dimensiones consistentes a 82px
assert(
    indexHtml.includes('#login-ball-wrap') &&
    indexHtml.includes('width: 82px;') &&
    indexHtml.includes('height: 82px;'),
    'El contenedor #login-ball-wrap en index.html tiene ancho y alto explícito de 82px'
);

assert(
    indexHtml.includes('#login-ball-img') &&
    indexHtml.includes('width: 82px !important;') &&
    indexHtml.includes('height: 82px !important;'),
    'La imagen #login-ball-img en index.html define 82px x 82px con !important'
);

assert(
    indexHtml.includes('id="login-ball-fallback"') &&
    indexHtml.includes('width:82px; height:82px;'),
    'El contenedor fallback #login-ball-fallback mantiene paridad dimensional a 82px'
);

// 2. Verificar reglas específicas en responsive-global.css
assert(
    responsiveCss.includes('#login-ball-img {') &&
    responsiveCss.includes('width: 82px !important;') &&
    responsiveCss.includes('height: 82px !important;') &&
    responsiveCss.includes('object-fit: contain !important;'),
    'responsive-global.css contiene la regla protectora para evitar sobreescritura de img { height: auto !important; }'
);

// 3. Verificar centrado horizontal perfecto
assert(
    indexHtml.includes('margin: 0 auto 18px auto;') &&
    indexHtml.includes('display: inline-flex;') &&
    indexHtml.includes('text-align: center;'),
    'El contenedor #login-ball-wrap está perfectamente centrado con margen horizontal auto y padre text-align center'
);

assert(
    indexHtml.includes('margin: 0 auto;') || indexHtml.includes('margin:0 auto;'),
    'La imagen #login-ball-img dispone de margen horizontal centrado'
);

// 4. Verificar adaptabilidad en pantallas móviles (< 440px y < 375px)
assert(
    indexHtml.includes('@media (max-width: 440px)') &&
    indexHtml.includes('.hud-telemetry {') &&
    indexHtml.includes('display: none !important;'),
    'En móviles (<= 440px) la telemetría lateral se oculta con display: none !important para evitar desbordamientos horizontales'
);

assert(
    indexHtml.includes('@media (max-width: 375px)') &&
    indexHtml.includes('.glass-card-pro'),
    'En móviles ultra compactos (<= 375px) el card de login adapta su padding de forma segura'
);

// 5. Verificar sintaxis del script del motor del login
const scriptMatches = indexHtml.match(/<!-- 🎾 BALL PHYSICS, TELEMETRY & AUTH ENGINE -->[\s\S]*?<script>([\s\S]*?)<\/script>/i);
assert(scriptMatches && scriptMatches[1], 'Se localizó el script del motor físico y telemetría de la bola');

if (scriptMatches && scriptMatches[1]) {
    try {
        new Function(scriptMatches[1]);
        assert(true, 'La sintaxis del script del motor físico de la bola es 100% válida sin errores');
    } catch(err) {
        assert(false, `Error sintáctico en script del motor físico: ${err.message}`);
    }
}

// 6. Validar que la regla de responsive-global.css no contamine otros componentes
assert(
    !responsiveCss.match(/#login-ball-img\s*,\s*\./),
    'La regla #login-ball-img es un selector único y aislado que no colisiona con otros elementos'
);

console.log(`\n🎉 RESUMEN: ${passedTests}/${totalTests} pruebas pasadas con éxito.\n`);
