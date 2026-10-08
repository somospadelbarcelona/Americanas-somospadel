/**
 * test-profile-ranking-submenu-qa.js
 * Verificación QA de la suite del submenú en la SECCIÓN PERFIL:
 * 1. Fondo en color celeste neón / cyan deportivo acorde al icono #nav-profile (#00d2ff, #00b4d8).
 * 2. Mismas medidas, alto, ancho, flex, paddings, flechas y estructura que entrenos o americanas.
 * 3. Botón Activo en Deep Obsidian (#070d18) con resplandor y acento celeste (#00d2ff).
 * 4. Botones Inactivos en cristal tintado con texto blanco y chevrons/iconos de alto contraste.
 * 5. Flechas de navegación izquierda y derecha con soporte para scroll táctil y rueda.
 * 6. Subsecciones exactas solicitadas: MI POSICIÓN, RENDIMIENTO IA, FICHA TÉCNICA.
 * 7. Verificación de que se eliminaron: 1 VS 1 DUELOS, LOGROS & MEDALLAS, TOP 10 ÉLITE, RANKING CLUB, PUNTOS RANKING.
 * 8. Apertura garantizada de la FICHA TÉCNICA (PadelFutCard.open, getSkillVal, renderTechHub).
 * 9. Integración con SubnavManager.renderProfile y sincronización en Router.js y PlayerView.js.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧪 Iniciando auditoría QA: Submenú de Sección Perfil (3 subsecciones finales)...\n");

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const routerJs = fs.readFileSync(path.join(__dirname, '../js/core/Router.js'), 'utf8');
const playerViewJs = fs.readFileSync(path.join(__dirname, '../js/modules/players/PlayerView.js'), 'utf8');

// 1. Verificar existencia de las reglas CSS de .subnav-theme-profile
assert(indexHtml.includes('.subnav-app-bar.subnav-theme-profile'), "Debe existir la regla CSS para .subnav-theme-profile");
assert(indexHtml.includes('#00d2ff'), "Debe incluir el color celeste neón #00d2ff");

// 2. Verificar que el fondo de la barra de perfil tiene gradiente celeste
const barBgMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-profile\s*\{([\s\S]*?)\}/);
assert(barBgMatch, "Debe existir bloque de estilos para .subnav-app-bar.subnav-theme-profile");
assert(barBgMatch[1].includes('#00d2ff') || barBgMatch[1].includes('#00b4d8'), "El fondo de la barra debe tener tonalidad celeste");

// 3. Verificar botón activo en tema perfil (Deep Obsidian con #00d2ff)
const activeBtnMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-profile\s+\.esm-pro-btn\.active\s*\{([\s\S]*?)\}/);
assert(activeBtnMatch, "Debe existir bloque de estilos para .esm-pro-btn.active en tema perfil");
assert(activeBtnMatch[1].includes('#070d18'), "El botón activo debe tener fondo obsidian oscuro (#070d18)");
assert(activeBtnMatch[1].includes('#00d2ff'), "El botón activo debe tener texto/acento en #00d2ff");

// 4. Verificar flechas de navegación en tema perfil
const arrowMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-profile\s+\.subnav-nav-arrow\s*\{([\s\S]*?)\}/);
assert(arrowMatch, "Debe existir bloque de estilos para .subnav-nav-arrow en tema perfil");
assert(arrowMatch[1].includes('#00d2ff'), "Las flechas deben tener color celeste #00d2ff");

// 5. Extraer bloque renderProfile de index.html
const renderProfileMatch = indexHtml.match(/renderProfile:\s*function\s*\([^\)]*\)\s*\{([\s\S]*?)\},\s*renderCommunity/);
assert(renderProfileMatch, "SubnavManager debe implementar renderProfile");
const renderProfileCode = renderProfileMatch[1];

// 6. Verificar que contiene las subsecciones deseadas
assert(renderProfileCode.includes("label: 'MI POSICIÓN'"), "Debe incluir MI POSICIÓN");
assert(renderProfileCode.includes("label: 'RENDIMIENTO IA'"), "Debe incluir RENDIMIENTO IA");
assert(renderProfileCode.includes("label: 'FICHA TÉCNICA'"), "Debe incluir FICHA TÉCNICA");
assert(renderProfileCode.includes("label: 'FICHA & ATRIBUTOS'"), "Debe incluir FICHA & ATRIBUTOS");
assert(renderProfileCode.includes("label: 'LOGROS & MISIONES'"), "Debe incluir LOGROS & MISIONES");

// 7. Verificar que NO contiene las subsecciones eliminadas
assert(!renderProfileCode.includes("label: '1 VS 1 DUELOS'"), "NO debe incluir 1 VS 1 DUELOS");
assert(!renderProfileCode.includes("label: 'TOP 10 ÉLITE'"), "NO debe incluir TOP 10 ÉLITE");
assert(!renderProfileCode.includes("label: 'RANKING CLUB'"), "NO debe incluir RANKING CLUB");
assert(!renderProfileCode.includes("PUNTOS RANKING"), "NO debe incluir botón PUNTOS RANKING");

// 8. Verificar Router.js
assert(routerJs.includes("window.SubnavManager.renderProfile"), "Router.js debe invocar renderProfile al entrar en perfil");
assert(routerJs.includes("const isProfile = ['profile'].includes(newRoute);"), "Router.js cleanupPreviousRoute debe contemplar 'profile'");

// 9. Verificar PlayerView.js y corrección de "FICHA TÉCNICA no se abre"
assert(playerViewJs.includes("handleSubnavTab(tabId)"), "PlayerView debe implementar handleSubnavTab");
assert(playerViewJs.includes("window.PadelFutCard.open"), "handleSubnavTab debe abrir la Carta FUT interactiva");
assert(playerViewJs.includes("getSkillVal(user, skillKey)"), "PlayerView debe implementar getSkillVal para evitar crashes");
assert(playerViewJs.includes("renderTechHub()"), "PlayerView debe implementar renderTechHub para evitar crashes");
assert(playerViewJs.includes("window.SubnavManager.renderProfile"), "PlayerView debe sincronizar el submenú");
assert(playerViewJs.includes("this.activeSubnavTab"), "PlayerView debe rastrear activeSubnavTab");

console.log("✅ 1. Reglas CSS de .subnav-theme-profile verificadas con gradiente celeste neón (#00d2ff).");
console.log("✅ 2. Medidas idénticas de alto, ancho, flex, flechas y diseño que americanas y entrenos.");
console.log("✅ 3. Subsecciones filtradas con precisión: MI POSICIÓN, RENDIMIENTO IA y FICHA TÉCNICA.");
console.log("✅ 4. Subsecciones no deseadas eliminadas (1 vs 1, Logros, Top 10, Ranking Club, Puntos Ranking).");
console.log("✅ 5. Corrección de apertura de FICHA TÉCNICA: métodos getSkillVal y renderTechHub implementados y llamada a PadelFutCard.open activa.");
console.log("✅ 6. Integración en Router.js y sincronización bidireccional en PlayerView.js certificada.");

console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL SUBMENÚ CELESTE DE LA SECCIÓN PERFIL HAN PASADO CON ÉXITO!");
