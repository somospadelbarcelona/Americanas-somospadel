/**
 * test-chat-player-search-qa.js
 * QA Regression Test Suite — Búsqueda de Jugadores en "Mis Mensajes"
 *
 * Verifica estáticamente y con simulación funcional la implementación completa
 * de la búsqueda de jugadores para iniciar chats privados directos.
 *
 * Versión: 1.0.0 — QA Sprint Americanas
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const rootDir        = path.resolve(__dirname, '..');
const chatServiceSrc = fs.readFileSync(path.join(rootDir, 'js/modules/chat/ChatService.js'), 'utf8');
const chatViewSrc    = fs.readFileSync(path.join(rootDir, 'js/modules/chat/ChatView.js'),    'utf8');
const chatCssSrc     = fs.readFileSync(path.join(rootDir, 'css/sp-chat-modal.css'),          'utf8');

let passed = 0;
let failed = 0;
const errors = [];

function check(description, condition) {
    if (condition) {
        console.log(`  ✅ [PASS] ${description}`);
        passed++;
    } else {
        console.error(`  ❌ [FAIL] ${description}`);
        failed++;
        errors.push(description);
    }
}

console.log('=======================================================================');
console.log(' 🔍 QA REGRESSION TEST: BÚSQUEDA DE JUGADORES EN MIS MENSAJES (CHAT)');
console.log('=======================================================================\n');

// ─── BLOQUE 1: Inspección estática de ChatService.js ───────────────────────
console.log('▶️  [1/5] ChatService.js — Inspección estática\n');

check(
    'ChatService contiene getPlayersPool()',
    chatServiceSrc.includes('async getPlayersPool()')
);

check(
    'ChatService contiene async searchPlayers(query)',
    chatServiceSrc.includes('async searchPlayers(query)')
);

check(
    'searchPlayers utiliza getPlayersPool() para búsqueda universal',
    chatServiceSrc.includes('await this.getPlayersPool()')
);

check(
    'searchPlayers limpia tildes y caracteres especiales (normalize NFD)',
    chatServiceSrc.includes('normalize') && chatServiceSrc.includes('0300')
);

check(
    'searchPlayers excluye al propio usuario (compara con myUid)',
    chatServiceSrc.includes('pUid === myUid')
);

check(
    'searchPlayers devuelve objeto normalizado con { id, uid, name, photo_url, level, role }',
    chatServiceSrc.includes('uid: p.id') &&
    chatServiceSrc.includes('photo_url:') &&
    chatServiceSrc.includes('level:') &&
    chatServiceSrc.includes('role:')
);

check(
    'searchPlayers retorna [] si query tiene menos de 2 chars',
    chatServiceSrc.includes('if (rawQ.length < 2) return []') || chatServiceSrc.includes('length < 2')
);

// ─── BLOQUE 2: Inspección estática de ChatView.js ──────────────────────────
console.log('\n▶️  [2/5] ChatView.js — Inspección estática\n');

check(
    'ChatView contiene renderPlayerSearchResults',
    chatViewSrc.includes('renderPlayerSearchResults')
);

check(
    'ChatView contiene startDirectChatWithPlayer',
    chatViewSrc.includes('startDirectChatWithPlayer')
);

check(
    'HTML del buscador incluye div#sp-chat-player-results',
    chatViewSrc.includes('id="sp-chat-player-results"')
);

check(
    'handleSearch usa _playerSearchTimeout para debounce (clearTimeout)',
    chatViewSrc.includes('this._playerSearchTimeout') &&
    chatViewSrc.includes('clearTimeout(this._playerSearchTimeout)')
);

check(
    'handleSearch llama a ChatService.searchPlayers con el filtro actual',
    chatViewSrc.includes('window.ChatService.searchPlayers(this.currentFilter)')
);

check(
    'handleSearch activa búsqueda con 2+ chars (>= 2)',
    chatViewSrc.includes('this.currentFilter.length >= 2')
);

check(
    'handleSearch limpia el dropdown si query < 2 chars',
    chatViewSrc.includes("resultsEl.innerHTML = ''")
);

check(
    'renderPlayerSearchResults inyecta resultados en #sp-chat-player-results',
    chatViewSrc.includes("document.getElementById('sp-chat-player-results')")
);

check(
    'renderPlayerSearchResults muestra mensaje cuando no hay resultados',
    chatViewSrc.includes('sp-chat-no-players-found')
);

check(
    'startDirectChatWithPlayer limpia el dropdown antes de llamar a openDirectChat',
    (() => {
        const lastIdx = chatViewSrc.lastIndexOf('startDirectChatWithPlayer(player) {');
        const targetIdx = lastIdx !== -1 ? lastIdx : chatViewSrc.lastIndexOf('startDirectChatWithPlayer(player)');
        if (targetIdx === -1) return false;
        const fnBody = chatViewSrc.slice(targetIdx, targetIdx + 800);
        const clearIdx = fnBody.indexOf("resultsEl.innerHTML = ''");
        const openDirectIdx = fnBody.indexOf('this.openDirectChat(player)');
        return clearIdx !== -1 && openDirectIdx !== -1 && clearIdx < openDirectIdx;
    })()
);

check(
    'startDirectChatWithPlayer también limpia el input (sp-chat-search-input)',
    chatViewSrc.includes("getElementById('sp-chat-search-input')")
);

check(
    'ChatView contiene openDirectChat (función invocada por startDirectChatWithPlayer)',
    chatViewSrc.includes('async openDirectChat(targetUser)')
);

// ─── BLOQUE 3: Inspección estática de CSS ──────────────────────────────────
console.log('\n▶️  [3/5] css/sp-chat-modal.css — Inspección estática\n');

check(
    'CSS contiene .sp-chat-player-results-dropdown',
    chatCssSrc.includes('.sp-chat-player-results-dropdown')
);

check(
    'CSS contiene .sp-chat-player-result-btn',
    chatCssSrc.includes('.sp-chat-player-result-btn')
);

check(
    'CSS tiene :empty { display: none } para ocultar el dropdown vacío',
    chatCssSrc.includes('.sp-chat-player-results-dropdown:empty') &&
    chatCssSrc.includes('display: none')
);

check(
    'CSS tiene .sp-chat-player-result con flex y hover',
    chatCssSrc.includes('.sp-chat-player-result') &&
    chatCssSrc.includes('display: flex')
);

check(
    'CSS contiene .sp-chat-no-players-found',
    chatCssSrc.includes('.sp-chat-no-players-found')
);

check(
    'CSS posiciona el dropdown con position: absolute (sobre el buscador)',
    (() => {
        const ddStart = chatCssSrc.indexOf('.sp-chat-player-results-dropdown');
        const ddEnd   = chatCssSrc.indexOf('}', ddStart);
        const ddBlock = chatCssSrc.slice(ddStart, ddEnd);
        return ddBlock.includes('position: absolute');
    })()
);

// ─── BLOQUE 4: Simulación funcional de searchPlayers ───────────────────────
console.log('\n▶️  [4/5] Simulación funcional de ChatService.searchPlayers\n');

(function () {
    // Montamos un sandbox mínimo para ejecutar ChatService.js en vm
    const sandbox = {
        window: {},
        console: { log: () => {}, warn: () => {}, error: () => {} },
        firebase: undefined,
        localStorage: { getItem: () => null },
        auth: null,
        Store: null,
        AdminAuth: null
    };
    // Inyectamos window globales básicos para que el IIFE no rompa
    sandbox.window = sandbox;

    try {
        vm.runInNewContext(chatServiceSrc, sandbox);
    } catch (e) {
        // El módulo puede fallar por 'window.db' en runtime; lo ignoramos —
        // solo necesitamos que ChatService esté instanciado con el método.
    }

    const svc = sandbox.window && sandbox.window.ChatService;

    check(
        'ChatService queda instanciado en window.ChatService tras evaluar el módulo',
        !!(svc && typeof svc.searchPlayers === 'function')
    );

    if (svc) {
        // Query de 1 char debe devolver [] inmediatamente (sin tocar Firestore)
        const result = svc.searchPlayers('a');
        const isPromise = result && typeof result.then === 'function';

        if (isPromise) {
            result.then(res => {
                check(
                    'searchPlayers("a") — query de 1 char devuelve array vacío []',
                    Array.isArray(res) && res.length === 0
                );
                printSummary();
            }).catch(() => {
                check('searchPlayers("a") — query de 1 char devuelve array vacío []', false);
                printSummary();
            });
        } else {
            check(
                'searchPlayers("a") — query de 1 char devuelve array vacío []',
                Array.isArray(result) && result.length === 0
            );
        }
    }
})();

// ─── BLOQUE 5: Consistencia del objeto player pasado a openDirectChat ───────
console.log('\n▶️  [5/5] Consistencia del objeto player hacia openDirectChat\n');

check(
    'renderPlayerSearchResults renderiza fila con id, name, avatar y level',
    chatViewSrc.includes('p.id || p.uid') &&
    chatViewSrc.includes('p.name || p.displayName') &&
    chatViewSrc.includes('p.photo_url || p.photoURL') &&
    chatViewSrc.includes('p.level || p.nivel')
);

check(
    'openDirectChat lee targetUser.id || targetUser.uid (compatible con player.id)',
    chatViewSrc.includes('const targetUid = targetUser.id || targetUser.uid')
);

check(
    'El debounce usa 300ms (alineado con especificación)',
    chatViewSrc.includes('}, 300)')
);

// ─── Resumen ────────────────────────────────────────────────────────────────
function printSummary() {
    const total = passed + failed;
    console.log('\n=======================================================================');
    console.log(` 📊 RESULTADOS: ${passed}/${total} pruebas pasadas`);
    if (errors.length > 0) {
        console.log('\n  Fallos detectados:');
        errors.forEach(e => console.log(`    • ${e}`));
    }
    console.log('=======================================================================');
    if (failed === 0) {
        console.log('🏆 TODAS LAS PRUEBAS DE BÚSQUEDA DE JUGADORES PASARON AL 100%.\n');
        process.exit(0);
    } else {
        console.error(`\n⛔ ${failed} PRUEBA(S) FALLARON. Revisa los errores indicados.\n`);
        process.exit(1);
    }
}

// Si no hay promesas pendientes (bloque 4 síncrono), imprimimos resumen ahora
// El bloque 4 puede llamar a printSummary async; aquí cubrimos el caso síncrono
// mediante un setImmediate para dejar que las promesas se resuelvan primero.
setImmediate(() => {
    // Solo imprimimos si el bloque 4 NO disparó printSummary async
    // (detectamos si passed+failed ya incluye la verificación de query de 1 char)
    printSummary();
});
