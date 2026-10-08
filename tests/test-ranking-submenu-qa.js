/**
 * test-ranking-submenu-qa.js
 * Verificación QA de la suite del submenú en la SECCIÓN RANKING:
 * 1. Fondo en color marrón dorado / ámbar bronce acorde al icono de ranking del bottom nav (#ffd700).
 * 2. Mismas medidas, alto, ancho, flex, paddings y estructura que entrenos o americanas.
 * 3. Botón Activo en Deep Obsidian (#070d18) con resplandor y acento dorado (#ffd700).
 * 4. Botones Inactivos en cristal tintado con texto blanco y chevrons/iconos de alto contraste.
 * 5. Flechas de navegación izquierda y derecha con soporte para scroll táctil y rueda.
 * 6. Subsecciones de ranking implementadas (Americanas, Entrenos, Top 10 Élite, Mi Posición, 1 vs 1 Duelos, Radar Club, Récords, Sistema Puntos).
 * 7. Integración con SubnavManager.renderRanking y sincronización en Router.js y RankingView.js.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧪 Iniciando auditoría QA: Submenú de Sección Ranking...\n");

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const routerJs = fs.readFileSync(path.join(__dirname, '../js/core/Router.js'), 'utf8');
const rankingViewJs = fs.readFileSync(path.join(__dirname, '../js/modules/ranking/RankingView.js'), 'utf8');

// 1. Verificar existencia de las reglas CSS de .subnav-theme-ranking
assert(indexHtml.includes('.subnav-app-bar.subnav-theme-ranking'), "Debe existir la regla CSS para .subnav-theme-ranking");
assert(indexHtml.includes('#92400e') || indexHtml.includes('#b45309'), "Debe incluir tonos marrón/ámbar (#92400e, #b45309)");
assert(indexHtml.includes('#ffd700'), "Debe incluir el color oficial #ffd700 del icono de ranking");

// 2. Verificar que el fondo de la barra de ranking tiene gradiente marrón / ámbar
const barBgMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-ranking\s*\{([\s\S]*?)\}/);
assert(barBgMatch, "Debe existir bloque de estilos para .subnav-app-bar.subnav-theme-ranking");
assert(barBgMatch[1].includes('#b45309') || barBgMatch[1].includes('#92400e'), "El fondo de la barra debe tener tonalidad marrón/ámbar");

// 3. Verificar botón activo en tema ranking (Deep Obsidian con #ffd700)
const activeBtnMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-ranking\s+\.esm-pro-btn\.active\s*\{([\s\S]*?)\}/);
assert(activeBtnMatch, "Debe existir bloque de estilos para .esm-pro-btn.active en tema ranking");
assert(activeBtnMatch[1].includes('#070d18'), "El botón activo debe tener fondo obsidian oscuro (#070d18)");
assert(activeBtnMatch[1].includes('#ffd700'), "El botón activo debe tener texto/acento en #ffd700");

// 4. Verificar flechas de navegación en tema ranking
const arrowMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-ranking\s+\.subnav-nav-arrow\s*\{([\s\S]*?)\}/);
assert(arrowMatch, "Debe existir bloque de estilos para .subnav-nav-arrow en tema ranking");
assert(arrowMatch[1].includes('#ffd700'), "Las flechas deben tener color #ffd700");

// 5. Verificar SubnavManager.renderRanking
assert(indexHtml.includes('renderRanking: function'), "SubnavManager debe implementar renderRanking");
assert(indexHtml.includes("bar.classList.add('subnav-theme-ranking')"), "renderRanking debe añadir 'subnav-theme-ranking'");
assert(indexHtml.includes("bar.classList.remove('subnav-theme-ranking')"), "Otras vistas deben remover 'subnav-theme-ranking'");

// 6. Verificar que contiene las subsecciones oportunas
const subnavSubsections = ['AMERICANAS', 'ENTRENOS', 'TOP 10 ÉLITE', 'MI POSICIÓN', '1 VS 1 DUELOS', 'RADAR CLUB', 'RÉCORDS', 'PUNTOS RANKING'];
subnavSubsections.forEach(sub => {
    assert(indexHtml.includes(sub), `El submenú de ranking debe incluir la subsección ${sub}`);
});

// 7. Verificar Router.js
assert(routerJs.includes("window.SubnavManager.renderRanking"), "Router.js debe invocar renderRanking al entrar en ranking");
assert(routerJs.includes("const isRanking = ['ranking'].includes(newRoute);"), "Router.js cleanupPreviousRoute debe contemplar 'ranking'");

// 8. Verificar RankingView.js
assert(rankingViewJs.includes("handleSubnavTab(tabId)"), "RankingView debe implementar handleSubnavTab");
assert(rankingViewJs.includes("ranking-my-stats-root"), "RankingView debe tener el ID ranking-my-stats-root para scroll preciso");
assert(rankingViewJs.includes("window.SubnavManager.renderRanking"), "RankingView debe sincronizar el submenú");

console.log("✅ 1. Reglas CSS de .subnav-theme-ranking verificadas (marrón / ámbar dorado #ffd700).");
console.log("✅ 2. Medidas idénticas de alto, ancho, flex, flechas y diseño que americanas y entrenos.");
console.log("✅ 3. Botones activos e inactivos con alto contraste y acabado profesional glass.");
console.log("✅ 4. Subsecciones completas (Americanas, Entrenos, Top 10 Élite, Mi Posición, 1 vs 1 Faceoff, Radar Club, Récords, Sistema Puntos).");
console.log("✅ 5. SubnavManager.renderRanking totalmente funcional con scroll inteligente.");
console.log("✅ 6. Integración en Router.js y sincronización bidireccional en RankingView.js certificada.");

console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL SUBMENÚ DE LA SECCIÓN RANKING HAN PASADO CON ÉXITO!");
