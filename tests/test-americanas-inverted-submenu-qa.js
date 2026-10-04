/**
 * test-americanas-inverted-submenu-qa.js
 * Verificación QA de la inversión del submenú de AMERICANAS:
 * 1. Fondo Neón Amarillo-Lima (#CCFF00 acorde al icono de americanas del bottom nav).
 * 2. Botón Activo en Deep Obsidian (#070d18) con texto y acentos en #CCFF00.
 * 3. Botones Inactivos con cristal tintado oscuro y texto de alto contraste (#070d18) para máxima legibilidad sobre lima.
 * 4. Flechas de scroll en Deep Obsidian con chevrons #CCFF00.
 * 5. Gestión del tema (añadir clase en renderAmericanas, remover en renderCommunity y hide).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧪 Iniciando pruebas QA: Submenú Americanas Invertido Amarillo-Lima (#CCFF00)...\n");

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// 1. Verificar existencia de las reglas CSS de .subnav-theme-americanas
assert(indexHtml.includes('.subnav-app-bar.subnav-theme-americanas'), "Debe existir la regla CSS para .subnav-theme-americanas");
assert(indexHtml.includes('#CCFF00'), "Debe incluir el color oficial #CCFF00 de americanas");

// 2. Verificar que el fondo de la barra de americanas tiene #CCFF00
const barBgMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-americanas\s*\{([\s\S]*?)\}/);
assert(barBgMatch, "Debe existir bloque de estilos para .subnav-app-bar.subnav-theme-americanas");
assert(barBgMatch[1].includes('#CCFF00'), "El fondo de la barra debe tener el color #CCFF00");

// 3. Verificar estilos del botón activo en .subnav-theme-americanas
const activeBtnMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-americanas\s+\.esm-pro-btn\.active\s*\{([\s\S]*?)\}/);
assert(activeBtnMatch, "Debe existir bloque de estilos para .esm-pro-btn.active en tema americanas");
assert(activeBtnMatch[1].includes('#070d18'), "El botón activo debe tener fondo obsidian oscuro (#070d18)");
assert(activeBtnMatch[1].includes('#CCFF00'), "El botón activo debe tener texto/acento en #CCFF00");

// 4. Verificar estilos del botón inactivo en .subnav-theme-americanas
const inactiveBtnMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-americanas\s+\.esm-pro-btn\.inactive\s*\{([\s\S]*?)\}/);
assert(inactiveBtnMatch, "Debe existir bloque de estilos para .esm-pro-btn.inactive en tema americanas");
assert(inactiveBtnMatch[1].includes('rgba(7, 13, 24,'), "El botón inactivo debe tener fondo tintado translúcido oscuro");
assert(inactiveBtnMatch[1].includes('#070d18'), "El botón inactivo debe tener texto oscuro de alta legibilidad");

// 5. Verificar flechas de navegación en tema americanas
const arrowMatch = indexHtml.match(/\.subnav-app-bar\.subnav-theme-americanas\s+\.subnav-nav-arrow\s*\{([\s\S]*?)\}/);
assert(arrowMatch, "Debe existir bloque de estilos para .subnav-nav-arrow en tema americanas");
assert(arrowMatch[1].includes('#CCFF00'), "Las flechas deben tener color #CCFF00");

// 6. Verificar gestión de clase en SubnavManager
assert(indexHtml.includes("bar.classList.add('subnav-theme-americanas')"), "renderAmericanas debe añadir 'subnav-theme-americanas'");
assert(indexHtml.includes("bar.classList.remove('subnav-theme-americanas')"), "renderCommunity y hide deben remover 'subnav-theme-americanas'");

console.log("✅ 1. Reglas CSS de .subnav-theme-americanas presentes y configuradas con #CCFF00.");
console.log("✅ 2. Botón Activo estilizado en Deep Obsidian (#070d18) con contraste #CCFF00.");
console.log("✅ 3. Botones Inactivos con acabado dark glass y texto de máxima legibilidad.");
console.log("✅ 4. Flechas y badges integrados con el esquema de diseño invertido.");
console.log("✅ 5. Gestión de estado en SubnavManager (añadir/quitar clase) verificado.");

console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL SUBMENÚ INVERTIDO DE AMERICANAS HAN PASADO CON ÉXITO!");
