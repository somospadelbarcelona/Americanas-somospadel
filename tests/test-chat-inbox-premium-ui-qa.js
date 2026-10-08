/**
 * test-chat-inbox-premium-ui-qa.js
 * Certificación de calidad: Rediseño visual premium, Carrusel de conexión rápida,
 * Pestaña de no leídos, Respuestas rápidas de pádel y cache-busting.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const chatViewCode = fs.readFileSync(path.join(rootDir, 'js/modules/chat/ChatView.js'), 'utf8');
const chatCssCode = fs.readFileSync(path.join(rootDir, 'css/sp-chat-modal.css'), 'utf8');
const indexHtmlCode = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const swCode = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');

console.log("\n=======================================================");
console.log("💎 QA TEST SUITE: REDISEÑO VISUAL & NUEVAS FUNCIONES CHAT");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
        failed++;
    }
}

console.log("▶️ [1/4] Verificando nuevas funciones en ChatView.js...");

test("Precarga de jugadores en openInbox() para respuesta en 0ms", () => {
    assert(chatViewCode.includes("window.ChatService.getPlayersPool"), "openInbox debe invocar getPlayersPool");
});

test("Carrusel de conexión rápida presente en el HTML y método loadQuickPlayersBar", () => {
    assert(chatViewCode.includes("sp-chat-quick-players-bar"), "HTML debe contener el contenedor del carrusel");
    assert(chatViewCode.includes("loadQuickPlayersBar"), "Debe existir método loadQuickPlayersBar()");
    assert(chatViewCode.includes("sp-chat-quick-player-item"), "Debe renderizar items del carrusel");
});

test("Botón de limpiar búsqueda (sp-chat-search-clear) y método clearSearch()", () => {
    assert(chatViewCode.includes("sp-chat-search-clear"), "Buscador debe tener botón sp-chat-search-clear");
    assert(chatViewCode.includes("clearSearch()"), "Debe implementar clearSearch()");
});

test("Método focusSearchInput() disponible para estados vacíos y explorador", () => {
    assert(chatViewCode.includes("focusSearchInput()"), "Debe existir focusSearchInput()");
});

test("Pestaña y filtro 'Solo No Leídos' (sp-chat-tab-unread)", () => {
    assert(chatViewCode.includes("id=\"sp-chat-tab-unread\""), "Debe existir la pestaña sp-chat-tab-unread");
    assert(chatViewCode.includes("this.activeTab === 'unread'"), "renderInboxList debe filtrar cuando activeTab es unread");
    assert(chatViewCode.includes("¡Estás al día!"), "Debe mostrar estado vacío cuando no hay mensajes no leídos");
});

test("Cálculo y renderizado dinámico de badges de no leídos en pestañas", () => {
    assert(chatViewCode.includes("calculateTabUnreadCounts"), "Debe calcular unreads por pestaña");
    assert(chatViewCode.includes("updateTabBadges"), "Debe actualizar badges en el DOM");
});

test("Padel Quick Chips (Respuestas Rápidas) en la sala de conversación", () => {
    assert(chatViewCode.includes("sp-chat-quick-replies"), "Dock debe incluir contenedor de quick replies");
    assert(chatViewCode.includes("sp-chat-quick-reply-chip"), "Debe contener chips de respuestas");
    assert(chatViewCode.includes("insertQuickReply"), "Debe implementar insertQuickReply");
    assert(chatViewCode.includes("🎾 ¡Nos vemos en la pista!"), "Debe incluir respuestas típicas de pádel");
});

test("Indicador de doble check ✓✓ en mensajes propios", () => {
    assert(chatViewCode.includes("✓✓"), "renderChatCardHtml debe incluir doble check ✓✓");
});

console.log("\n▶️ [2/4] Verificando estilos CSS en sp-chat-modal.css...");

test("Estilos del carrusel de conexión rápida namespaceados", () => {
    assert(chatCssCode.includes(".sp-chat-quick-players-bar"), "CSS debe estilizar el carrusel");
    assert(chatCssCode.includes(".sp-chat-quick-player-item"), "CSS debe estilizar los items");
    assert(chatCssCode.includes(".sp-chat-quick-player-avatar"), "CSS debe estilizar el avatar con aro neon");
    assert(chatCssCode.includes(".sp-chat-quick-player-badge"), "CSS debe estilizar el badge de nivel");
});

test("Estilos de badges de pestañas namespaceados", () => {
    assert(chatCssCode.includes(".sp-chat-tab-badge"), "CSS debe definir .sp-chat-tab-badge");
    assert(chatCssCode.includes(".sp-chat-tab-badge-highlight"), "CSS debe definir .sp-chat-tab-badge-highlight");
});

test("Estilos de respuestas rápidas y botón de acción vacía", () => {
    assert(chatCssCode.includes(".sp-chat-quick-replies"), "CSS debe definir .sp-chat-quick-replies");
    assert(chatCssCode.includes(".sp-chat-quick-reply-chip"), "CSS debe definir chips de respuesta");
    assert(chatCssCode.includes(".sp-chat-quick-start-btn"), "CSS debe definir el botón de acción rápida");
});

test("Animaciones de pulso en vivo y badges", () => {
    assert(chatCssCode.includes(".sp-chat-live-pulse-dot"), "CSS debe contener .sp-chat-live-pulse-dot");
    assert(chatCssCode.includes(".sp-chat-unread-pulse"), "CSS debe contener .sp-chat-unread-pulse");
});

console.log("\n▶️ [3/4] Verificando Cache-Busting e Invalidación PWA...");

test("index.html incluye sp-chat-modal.css con versión v=3.0_PREMIUM_REDESIGN", () => {
    assert(indexHtmlCode.includes('css/sp-chat-modal.css?v=3.0_PREMIUM_REDESIGN'), "CSS debe tener versión 3.0");
});

test("index.html incluye ChatService.js y ChatView.js con versión v=3.0_PREMIUM_REDESIGN", () => {
    assert(indexHtmlCode.includes('js/modules/chat/ChatService.js?v=3.0_PREMIUM_REDESIGN'), "ChatService debe tener versión 3.0");
    assert(indexHtmlCode.includes('js/modules/chat/ChatView.js?v=3.0_PREMIUM_REDESIGN'), "ChatView debe tener versión 3.0");
});

test("sw.js tiene CACHE_NAME actualizado para forzar refresh en navegadores y PWA", () => {
    assert(swCode.includes("somospadel-pwa-v2.1.0"), "sw.js debe tener la nueva versión somospadel-pwa-v2.1.0");
});

console.log("\n▶️ [4/4] Verificando sintaxis y ejecución en runtime...");

test("ChatView.js evalúa limpiamente sin errores de sintaxis", () => {
    new Function('window', 'document', chatViewCode);
});

console.log("\n=======================================================");
console.log(`📊 RESULTADOS: ${passed}/${passed + failed} pruebas pasadas (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log("=======================================================");

if (failed > 0) {
    console.error(`\n⛔ ${failed} PRUEBA(S) FALLARON.`);
    process.exit(1);
} else {
    console.log("\n🏆 TODAS LAS COMPROBACIONES PASARON CON ÉXITO (100%).\n");
    process.exit(0);
}
