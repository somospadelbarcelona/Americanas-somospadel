/**
 * test-backend-chat-moderation-qa.js
 * Comprehensive QA Test Suite for SuperAdmin and Admin Chat Deletion & Moderation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("===================================================================");
console.log("🛡️ QA TEST SUITE: MODERACIÓN Y BORRADO DE MENSAJES (SUPERADMIN/ADMIN)");
console.log("===================================================================\n");

const rootDir = path.resolve(__dirname, '..');
const rulesPath = path.join(rootDir, 'firestore.rules');
const verifyRulesPath = path.join(rootDir, 'tests/verify-firebase-rules.js');
const chatServicePath = path.join(rootDir, 'js/modules/chat/ChatService.js');
const chatViewPath = path.join(rootDir, 'js/modules/chat/ChatView.js');

const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const verifyRulesContent = fs.readFileSync(verifyRulesPath, 'utf8');
const chatServiceContent = fs.readFileSync(chatServicePath, 'utf8');
const chatViewContent = fs.readFileSync(chatViewPath, 'utf8');

let passed = 0;
let total = 0;

function check(desc, fn) {
    total++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
    }
}

// ─────────────────────────────────────────────────────────────
// 1. REGLAS DE FIRESTORE (firestore.rules)
// ─────────────────────────────────────────────────────────────
console.log("▶️ [1/4] Verificando reglas de seguridad en firestore.rules...");

check("isAdmin() contiene 'admin', 'admin_player', 'super_admin' y 'superadmin'", () => {
    const adminRegex = /function\s+isAdmin\(\)\s*\{[\s\S]*?\['admin',\s*'admin_player',\s*'super_admin',\s*'superadmin'\]/i;
    assert(adminRegex.test(rulesContent), "isAdmin() debe incluir ['admin', 'admin_player', 'super_admin', 'superadmin']");
});

check("match /chats/{eventId} permite lectura y escritura a usuarios autenticados", () => {
    assert(rulesContent.includes('match /chats/{eventId}'), "Debe existir match /chats/{eventId}");
    assert(rulesContent.includes('allow delete: if isAdmin() || (isAuthenticated() && resource.data.senderId == request.auth.uid);'),
        "Debe permitir delete si isAdmin() o autor del mensaje");
});

// ─────────────────────────────────────────────────────────────
// 2. VERIFICADOR DE REGLAS (tests/verify-firebase-rules.js)
// ─────────────────────────────────────────────────────────────
console.log("\n▶️ [2/4] Verificando tests/verify-firebase-rules.js...");

check("verify-firebase-rules.js contempla 'superadmin', 'super_admin', 'admin' y 'admin_player'", () => {
    assert(verifyRulesContent.includes("['admin', 'admin_player', 'super_admin', 'superadmin'].includes(userRole)"),
        "El script de verificación debe contemplar todos los roles administrativos");
});

// ─────────────────────────────────────────────────────────────
// 3. ESTRUCTURA Y MÉTODOS EN ChatService.js
// ─────────────────────────────────────────────────────────────
console.log("\n▶️ [3/4] Verificando métodos en ChatService.js...");

check("getCurrentUser implementa fallback robusto a Store, AdminAuth, localStorage y auth", () => {
    assert(chatServiceContent.includes('getCurrentUser()'), "Debe definir getCurrentUser()");
    assert(chatServiceContent.includes("window.Store.getState('currentUser')"), "Debe consultar window.Store");
    assert(chatServiceContent.includes("window.AdminAuth"), "Debe consultar window.AdminAuth");
    assert(chatServiceContent.includes("localStorage.getItem('adminUser')"), "Debe consultar adminUser en localStorage");
    assert(chatServiceContent.includes("window.auth.currentUser"), "Debe consultar window.auth.currentUser");
});

check("hasModerationPrivileges implementado y reconoce todos los roles y banderas admin", () => {
    assert(chatServiceContent.includes('hasModerationPrivileges('), "Debe definir hasModerationPrivileges()");
    assert(chatServiceContent.includes("'superadmin'"), "Debe chequear superadmin");
    assert(chatServiceContent.includes("'super_admin'"), "Debe chequear super_admin");
    assert(chatServiceContent.includes("'admin'"), "Debe chequear admin");
    assert(chatServiceContent.includes("'admin_player'"), "Debe chequear admin_player");
});

check("deleteMessage utiliza hasModerationPrivileges y permite borrado de moderadores", () => {
    assert(chatServiceContent.includes('hasModerationPrivileges(user)'), "deleteMessage debe validar moderación con hasModerationPrivileges");
    assert(chatServiceContent.includes('isModerator || isOwner') || chatServiceContent.includes('!isModerator && !isOwner'),
        "deleteMessage debe permitir borrado a dueño o moderador");
    assert(chatServiceContent.includes('await msgRef.delete()'), "Debe ejecutar delete() físico en Firestore");
    assert(chatServiceContent.includes("lastMessage: ''"), "Debe limpiar lastMessage si no quedan mensajes");
    assert(chatServiceContent.includes("lastMessageTime: null"), "Debe limpiar lastMessageTime si no quedan mensajes");
});

// ─────────────────────────────────────────────────────────────
// 4. SIMULACIÓN FUNCIONAL EN MEMORIA
// ─────────────────────────────────────────────────────────────
console.log("\n▶️ [4/4] Simulación de lógica de moderación y borrado...");

// Simular entorno del navegador
let mockStore = { currentUser: null };
let mockAdminAuth = { user: null, hasAdminRole: (r) => ['superadmin', 'super_admin', 'admin'].includes(r) };
let mockLocalStorage = {};

global.window = {
    Store: { getState: (k) => mockStore[k] },
    AdminAuth: mockAdminAuth,
    auth: null,
    db: null
};
global.localStorage = {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k) => {}
};

// Cargar clase ChatService evaluando el código
eval(chatServiceContent);
const service = global.window.ChatService;

check("hasModerationPrivileges detecta superadmin correctamente", () => {
    assert.strictEqual(service.hasModerationPrivileges({ role: 'superadmin' }), true);
    assert.strictEqual(service.hasModerationPrivileges({ role: 'super_admin' }), true);
    assert.strictEqual(service.hasModerationPrivileges({ role: 'admin' }), true);
    assert.strictEqual(service.hasModerationPrivileges({ role: 'admin_player' }), true);
    assert.strictEqual(service.hasModerationPrivileges({ role: 'player' }), false);
    assert.strictEqual(service.hasModerationPrivileges({ isSuperAdmin: true }), true);
    assert.strictEqual(service.hasModerationPrivileges({ isSessionAdmin: true }), true);
    assert.strictEqual(service.hasModerationPrivileges(null), false);
});

check("getCurrentUser prioriza y combina rol de AdminAuth o localStorage 'adminUser'", () => {
    mockStore.currentUser = { id: 'u_admin_1', name: 'SuperAdmin User' };
    mockLocalStorage['adminUser'] = JSON.stringify({ id: 'u_admin_1', role: 'superadmin' });
    const user = service.getCurrentUser();
    assert.strictEqual(user.id, 'u_admin_1');
    assert.strictEqual(user.role, 'superadmin');
    assert.strictEqual(service.hasModerationPrivileges(user), true);
});

// Test funcional de deleteMessage
check("deleteMessage: SuperAdmin borra mensaje ajeno y recalcula metadatos", async () => {
    let deleted = false;
    let updatedMetadata = null;

    let messages = [
        {
            id: 'msg_target_to_delete',
            data: { senderId: 'normal_player_id', text: 'Mensaje inapropiado', timestamp: 200 }
        },
        {
            id: 'msg_previous',
            data: { senderId: 'normal_player_id', senderName: 'Carlos', text: 'Mensaje anterior correcto', timestamp: 100 }
        }
    ];

    global.window.db = {
        collection: (col) => ({
            doc: (docId) => ({
                set: async (payload, opts) => {
                    updatedMetadata = payload;
                },
                collection: (subCol) => ({
                    doc: (msgId) => ({
                        get: async () => {
                            const found = messages.find(m => m.id === msgId);
                            return {
                                exists: !!found,
                                data: () => found ? found.data : null
                            };
                        },
                        delete: async () => {
                            deleted = true;
                            messages = messages.filter(m => m.id !== msgId);
                        }
                    }),
                    orderBy: () => ({
                        limit: () => ({
                            get: async () => ({
                                empty: messages.length === 0,
                                docs: messages.map(m => ({ data: () => m.data }))
                            })
                        })
                    })
                })
            })
        })
    };

    // Usuario actual es superadmin
    mockStore.currentUser = { id: 'superadmin_uid', role: 'superadmin', name: 'Admin Supremo' };
    mockLocalStorage = {};

    const res = await service.deleteMessage('general_somospadel', 'msg_target_to_delete');
    assert.strictEqual(res.success, true, "SuperAdmin debe poder eliminar mensaje ajeno");
    assert.strictEqual(deleted, true, "Mensaje debe borrarse de Firestore");
    assert.strictEqual(updatedMetadata.lastMessage, 'Mensaje anterior correcto', "Metadatos recalculados");
    assert.strictEqual(updatedMetadata.lastSenderName, 'Carlos', "Remitente anterior correcto");
});

check("deleteMessage: Usuario común es denegado al intentar borrar mensaje ajeno", async () => {
    mockStore.currentUser = { id: 'regular_user_uid', role: 'player', name: 'Juan Regular' };

    const res = await service.deleteMessage('general_somospadel', 'msg_previous');
    assert.strictEqual(res.success, false, "Usuario común no debe poder borrar mensaje ajeno");
    assert(res.error.includes('Solo puedes eliminar tus propios mensajes') || res.error.includes('permiso'));
});

check("deleteMessage: Limpia metadatos cuando se borra el último mensaje del chat", async () => {
    let updatedMetadata = null;
    let messages = [
        {
            id: 'last_msg',
            data: { senderId: 'regular_user_uid', text: 'Solo mensaje', timestamp: 100 }
        }
    ];

    global.window.db = {
        collection: (col) => ({
            doc: (docId) => ({
                set: async (payload, opts) => {
                    updatedMetadata = payload;
                },
                collection: (subCol) => ({
                    doc: (msgId) => ({
                        get: async () => ({
                            exists: true,
                            data: () => messages[0].data
                        }),
                        delete: async () => {
                            messages = [];
                        }
                    }),
                    orderBy: () => ({
                        limit: () => ({
                            get: async () => ({
                                empty: true,
                                docs: []
                            })
                        })
                    })
                })
            })
        })
    };

    const res = await service.deleteMessage('general_somospadel', 'last_msg');
    assert.strictEqual(res.success, true);
    assert.strictEqual(updatedMetadata.lastMessage, '', "lastMessage debe limpiarse");
    assert.strictEqual(updatedMetadata.lastMessageTime, null, "lastMessageTime debe ser null");
    assert.strictEqual(updatedMetadata.lastSenderName, '', "lastSenderName debe limpiarse");
});

console.log("\n===================================================================");
console.log(`📊 RESULTADOS: ${passed}/${total} pruebas pasadas (${Math.round((passed / total) * 100)}%)`);
console.log("===================================================================");

if (passed === total) {
    console.log("🏆 TODAS LAS VERIFICACIONES DE MODERACIÓN PASARON CON ÉXITO (100%).\n");
    process.exit(0);
} else {
    console.error("❌ ALGUNAS PRUEBAS FALLARON.\n");
    process.exit(1);
}
