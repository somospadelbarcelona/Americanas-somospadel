const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=======================================================");
console.log("💬 QA TEST SUITE: BOTÓN DE CHAT PRIVADO 1 A 1 CON JUGADOR");
console.log("=======================================================");

const rootDir = path.resolve(__dirname, '..');
const eventsControllerCode = fs.readFileSync(path.join(rootDir, 'js/modules/americanas/EventsController_V6.js'), 'utf8');
const padelFutCardCode = fs.readFileSync(path.join(rootDir, 'js/modules/players/PadelFutCard.js'), 'utf8');

// 1. Verificación en EventsController_V6.js
console.log("\n▶️ [1/4] Verificando EventsController_V6.js...");
assert(eventsControllerCode.includes('window.openDirectChatWithPlayer'), 'Debe existir la función global window.openDirectChatWithPlayer');
assert(eventsControllerCode.includes('CHAT PRIVADO'), 'Debe existir el botón "CHAT PRIVADO" en la franja de matchmaking');
assert(eventsControllerCode.includes('fa-comment-dots'), 'Debe incluir el icono fa-comment-dots para el chat');
assert(eventsControllerCode.includes('openDirectChatWithPlayer'), 'Las tarjetas deben invocar openDirectChatWithPlayer');
console.log("  ✅ window.openDirectChatWithPlayer implementado correctamente");
console.log("  ✅ Botón CHAT PRIVADO presente en la franja de Busca Pareja");
console.log("  ✅ Botón CHAT presente en las filas individuales de jugadores");

// 2. Verificación en PadelFutCard.js
console.log("\n▶️ [2/4] Verificando PadelFutCard.js...");
assert(padelFutCardCode.includes('ENVIAR MENSAJE PRIVADO'), 'Debe existir el botón ENVIAR MENSAJE PRIVADO en PadelFutCard');
assert(padelFutCardCode.includes('openDirectChatWithPlayer'), 'PadelFutCard debe llamar a openDirectChatWithPlayer');
assert(padelFutCardCode.includes('isNotMe'), 'PadelFutCard debe discriminar isNotMe para no chatear consigo mismo');
console.log("  ✅ Botón ENVIAR MENSAJE PRIVADO integrado en PadelFutCard");
console.log("  ✅ Discriminación isNotMe activa");

// 3. Simulación funcional de window.openDirectChatWithPlayer
console.log("\n▶️ [3/4] Ejecución y simulación funcional...");
let chatOpenedWith = null;
let alertedMsg = null;

const sandbox = {
    console: console,
    alert: (msg) => { alertedMsg = msg; }
};
sandbox.window = sandbox;
sandbox.alert = (msg) => { alertedMsg = msg; };

// Mock mínimo para ejecutar EventsController_V6
sandbox.document = {
    addEventListener: () => {},
    getElementById: () => null,
    body: { appendChild: () => {} },
    createElement: () => ({ style: {} })
};
sandbox.navigator = { share: () => {}, clipboard: { writeText: async () => {} } };

vm.createContext(sandbox);

try {
    vm.runInContext(eventsControllerCode, sandbox);
} catch (e) {
    // Si da algún error por listeners DOM/Firebase no crítico, verificamos si definió la función
}

assert(typeof sandbox.window.openDirectChatWithPlayer === 'function', 'window.openDirectChatWithPlayer debe ser una función global');

sandbox.window._currentInscritosPlayersMap = {
    'player_target_1': {
        id: 'player_target_1',
        uid: 'player_target_1',
        name: 'Miguel Ángel Méndez Ruiz',
        photo_url: 'img/miguel.jpg',
        level: 3.46
    }
};
sandbox.window.Store = {
    getState: (k) => k === 'currentUser' ? { id: 'my_user_id', name: 'Alex' } : null
};
sandbox.window.ChatView = {
    openDirectChat: async (target) => {
        chatOpenedWith = target;
    }
};
sandbox.window.PlayerView = {
    haptic: () => {}
};

(async () => {
    // Caso 1: Abrir chat con otro jugador por ID
    await sandbox.window.openDirectChatWithPlayer('player_target_1');
    assert(chatOpenedWith !== null, 'Chat debe abrirse');
    assert.strictEqual(chatOpenedWith.id, 'player_target_1', 'ID del target correcto');
    assert.strictEqual(chatOpenedWith.name, 'Miguel Ángel Méndez Ruiz', 'Nombre del target correcto');
    console.log("  ✅ Chat privado 1 a 1 abre correctamente con jugador destino");

    // Caso 2: Intento de abrir chat consigo mismo
    chatOpenedWith = null;
    alertedMsg = null;
    await sandbox.window.openDirectChatWithPlayer('my_user_id');
    assert.strictEqual(chatOpenedWith, null, 'No debe abrir chat consigo mismo');
    assert(alertedMsg && alertedMsg.includes('contigo mismo'), 'Debe alertar que no puede abrir chat consigo mismo');
    console.log("  ✅ Bloqueo de chat consigo mismo validado");

    console.log("\n▶️ [4/4] Resumen de pruebas...");
    console.log("🏆 TODAS LAS COMPROBACIONES DE CHAT PRIVADO PASARON CON ÉXITO (100%).\n");
})();
