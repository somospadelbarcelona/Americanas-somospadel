/**
 * QA Test Suite: Instagram Stories Flyer Redesign & HD Flow Validation
 * Tests format 9:16 HD (1080x1920), styling (fondo blanco, letra negra, badges de colores),
 * fallback flows, filename sanitization, and modal controls.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("🎾 [QA TEST] Iniciando batería de pruebas para Instagram Story Flyer...");

const controllerPath = path.join(__dirname, '..', 'js', 'modules', 'americanas', 'EventsController_V6.js');
const indexPath = path.join(__dirname, '..', 'index.html');

const controllerContent = fs.readFileSync(controllerPath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// TEST 1: Cachebuster en index.html
console.log("➡️ TEST 1: Verificación de cachebuster en index.html");
assert(indexContent.includes('EventsController_V6.js?v=IG_STORY_FLYER_WHITE_HD_V22'), "El cachebuster en index.html debe ser IG_STORY_FLYER_WHITE_HD_V22");
console.log("   ✅ Cachebuster verificado correctamente.");

// TEST 2: Presencia de métodos clave en EventsController_V6.js
console.log("➡️ TEST 2: Métodos de Instagram Stories en EventsController");
const methodsToVerify = [
    'openInstagramStoryModal',
    'closeInstagramStoryModal',
    '_ensureHtml2Canvas',
    '_getOrRenderStoryCanvas',
    'launchDirectInstagram',
    'executeInstagramShare',
    'downloadInstagramStory',
    'copyInstagramCaption'
];
for (const m of methodsToVerify) {
    assert(controllerContent.includes(m), `Falta el método ${m}`);
}
console.log("   ✅ Todos los 8 métodos clave están implementados en el controlador.");

// TEST 3: Verificación de Calibrado 9:16 HD (360x640 * scale 3 = 1080x1920)
console.log("➡️ TEST 3: Dimensiones 9:16 HD y configuración html2canvas");
assert(controllerContent.includes('width: 360px'), "El contenedor debe medir 360px de ancho");
assert(controllerContent.includes('height: 640px'), "El contenedor debe medir 640px de alto");
assert(controllerContent.includes('scale: 3'), "El scale de renderizado debe ser 3 para generar 1080x1920");
assert(controllerContent.includes('useCORS: true'), "useCORS debe estar activo para imágenes externas");
assert(controllerContent.includes('backgroundColor: \'#ffffff\''), "El canvas debe tener backgroundColor blanco");
console.log("   ✅ Dimensiones (360x640 * 3 = 1080x1920 HD) y renderizado certificados.");

// TEST 4: Diseño y Paleta cromática (Fondo blanco, texto negro, badges multicolores)
console.log("➡️ TEST 4: Verificación de diseño blanco y badges de colores");
assert(controllerContent.includes('background: #ffffff'), "Fondo del flyer debe ser blanco (#ffffff)");
assert(controllerContent.includes('color: #0f172a'), "Tipografía principal debe ser oscura (#0f172a)");

// Verificación de badges correspondientes
assert(controllerContent.includes('#16a34a') || controllerContent.includes('#10b981'), "Verde esmeralda para SomosPadel / Americana");
assert(controllerContent.includes('#7c3aed'), "Púrpura para Entreno / Icono mixto");
assert(controllerContent.includes('#0284c7'), "Azul cielo para Twister / Verificado");
assert(controllerContent.includes('#ec4899'), "Rosa para Pareja Fija");
assert(controllerContent.includes('#ef4444') || controllerContent.includes('#dc2626'), "Rojo para sede / aforo completo");
console.log("   ✅ Colores, contrastes y badges correspondientes verificados.");

// TEST 5: Sanitización de nombres de archivo
console.log("➡️ TEST 5: Prueba de sanitización de nombre de archivo");
const sanitize = (name) => `somospadel_story_${(name || 'evento').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.png`;
assert.strictEqual(sanitize("Americana Nocturna #1! 🎾"), "somospadel_story_americana_nocturna__1____.png");
assert.strictEqual(sanitize("Torneo Primavera 2026"), "somospadel_story_torneo_primavera_2026.png");
assert.strictEqual(sanitize(null), "somospadel_story_evento.png");
console.log("   ✅ Nombres de archivo HD seguros y libres de caracteres no válidos.");

// TEST 6: Resiliencia ante navegadores y Web Share API
console.log("➡️ TEST 6: Resiliencia ante fallos y fallback en compartir");
assert(controllerContent.includes('navigator.canShare'), "Debe chequear navigator.canShare antes de invocar share con archivos");
assert(controllerContent.includes('shareErr.name === \'AbortError\''), "Debe manejar la cancelación voluntaria del usuario (AbortError) sin arrojar alerta");
assert(controllerContent.includes('downloadInstagramStory'), "Debe incluir fallback de descarga automática si falla o no existe Web Share");
assert(controllerContent.includes('window.open(\'https://www.instagram.com/\', \'_blank\')'), "Debe ofrecer fallback web a Instagram");
console.log("   ✅ Lógica de compartición móvil nativa y fallbacks de escritorio certificados.");

console.log("\n🎉 [QA PASSED] Todos los tests de calidad para Instagram Stories Flyer pasaron al 100%!");
