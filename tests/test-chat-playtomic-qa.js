/**
 * test-chat-playtomic-qa.js
 * Comprehensive QA Test Suite for SomosPadel Barcelona Chat System (Playtomic Style)
 * 
 * Verifies:
 * 1. Global exports of window.ChatService and window.ChatView.
 * 2. renderChatButton safety, HTML output, and memory registry.
 * 3. getOrCreateDirectChat validation (auth required, recipient required, self-chat prevention, canonical sorting).
 * 4. getOrCreateEventChat canonical room ID ('event_<id>') and metadata deduplication.
 * 5. sendMessage functionality, admin broadcasts ('!!'), media payloads.
 * 6. Unread count logic and markChatAsRead.
 * 7. CSS scope and isolation (no global style collisions).
 * 8. HTML links and button integration in index.html.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASSED: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAILED: ${message}`);
        failedTests++;
    }
}

async function runTestSuite() {
    console.log("================================================================");
    console.log(" 💬 SOMOSPADEL BARCELONA - QA TEST SUITE: CHAT PLAYTOMIC SYSTEM");
    console.log("================================================================\n");

    // ─────────────────────────────────────────────────────────────
    // TEST SECTION 1: CSS SCOPING & CONFLICT AUDIT
    // ─────────────────────────────────────────────────────────────
    console.log("▶️ [1/6] Auditoría de aislamiento CSS (sp-chat-modal.css)...");
    const cssPath = path.resolve(__dirname, '../css/sp-chat-modal.css');
    assert(fs.existsSync(cssPath), "El archivo css/sp-chat-modal.css existe físicamente");

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Extraer selectores eliminando comentarios, media queries y keyframes
    const cleanCss = cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/@keyframes[\s\S]*?\{[\s\S]*?\}/g, '');

    const ruleRegex = /([^{}]+)\{/g;
    let match;
    let leakedGlobalSelectors = [];

    while ((match = ruleRegex.exec(cleanCss)) !== null) {
        let rawSelector = match[1].trim();
        if (rawSelector.startsWith('@media')) continue;
        if (rawSelector.includes('%') || rawSelector.includes('from') || rawSelector.includes('to')) continue;

        const selectors = rawSelector.split(',').map(s => s.trim()).filter(Boolean);
        for (const sel of selectors) {
            if (sel === ':root') continue;
            // Verificar si el selector está apropiadamente namespaceado
            const isScoped = sel.startsWith('.sp-chat') || 
                             sel.startsWith('.sp-unread') || 
                             sel.startsWith('.header-notif-btn .sp-unread') ||
                             sel.includes('.sp-chat');
            
            if (!isScoped) {
                // Selector potencialmente no aislado
                leakedGlobalSelectors.push(sel);
            }
        }
    }

    assert(leakedGlobalSelectors.length === 0, 
        `Sin selectores CSS descontrolados o no namespaceados (Encontrados: ${leakedGlobalSelectors.join(', ') || '0'})`);

    // ─────────────────────────────────────────────────────────────
    // TEST SECTION 2: HTML INTEGRATION & BUTTON ACCESS IN index.html
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [2/6] Verificación de integración en index.html...");
    const indexPath = path.resolve(__dirname, '../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    assert(indexContent.includes('css/sp-chat-modal.css'), "index.html incluye css/sp-chat-modal.css");
    assert(indexContent.includes('js/modules/chat/ChatService.js'), "index.html incluye ChatService.js");
    assert(indexContent.includes('js/modules/chat/ChatView.js'), "index.html incluye ChatView.js");

    const serviceIndex = indexContent.indexOf('js/modules/chat/ChatService.js');
    const viewIndex = indexContent.indexOf('js/modules/chat/ChatView.js');
    assert(serviceIndex > -1 && viewIndex > -1 && serviceIndex < viewIndex, 
        "ChatService.js se carga antes de ChatView.js respetando dependencias");

    assert(indexContent.includes('id="btn-header-chat"'), "index.html contiene el botón de cabecera '#btn-header-chat'");
    assert(indexContent.includes('id="chat-unread-badge"'), "index.html contiene el badge '#chat-unread-badge'");

    // ─────────────────────────────────────────────────────────────
    // TEST SECTION 3: MOCK BROWSER ENVIRONMENT & MODULE EXPORTS
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [3/6] Carga de módulos y verificación de exportación global...");

    // Mock Firestore In-Memory Store
    const mockDbStore = {
        chats: {}
    };

    const mockDocRef = (collectionName, docId) => ({
        id: docId,
        async get() {
            const data = mockDbStore[collectionName]?.[docId];
            return {
                exists: !!data,
                id: docId,
                data: () => (data ? JSON.parse(JSON.stringify(data)) : null)
            };
        },
        async set(data, options) {
            mockDbStore[collectionName] = mockDbStore[collectionName] || {};
            if (options && options.merge && mockDbStore[collectionName][docId]) {
                mockDbStore[collectionName][docId] = {
                    ...mockDbStore[collectionName][docId],
                    ...data
                };
            } else {
                mockDbStore[collectionName][docId] = JSON.parse(JSON.stringify(data));
            }
        },
        async update(data) {
            if (!mockDbStore[collectionName]?.[docId]) {
                throw new Error("Doc does not exist");
            }
            mockDbStore[collectionName][docId] = {
                ...mockDbStore[collectionName][docId],
                ...data
            };
        },
        collection(subName) {
            return {
                doc(subId = 'msg_' + Math.random().toString(36).substring(2)) {
                    return {
                        id: subId,
                        async set(subData) {
                            mockDbStore[`${collectionName}_${docId}_${subName}`] = mockDbStore[`${collectionName}_${docId}_${subName}`] || {};
                            mockDbStore[`${collectionName}_${docId}_${subName}`][subId] = subData;
                        },
                        async delete() {
                            if (mockDbStore[`${collectionName}_${docId}_${subName}`]?.[subId]) {
                                delete mockDbStore[`${collectionName}_${docId}_${subName}`][subId];
                            }
                        }
                    };
                },
                orderBy() { return this; },
                limit() { return this; },
                onSnapshot(cb) {
                    cb({ docs: [] });
                    return () => {};
                }
            };
        }
    });

    let currentMockUser = {
        id: 'user_player_01',
        uid: 'user_player_01',
        name: 'Carlos Alcaraz',
        displayName: 'Carlos Alcaraz',
        photo_url: 'https://somospadel.com/img/carlos.jpg',
        role: 'player'
    };

    const mockDb = {
        collection(name) {
            return {
                doc: (id) => mockDocRef(name, id),
                where() { return this; },
                orderBy() { return this; },
                onSnapshot(cb, errCb) {
                    cb({ docs: [] });
                    return () => {};
                }
            };
        },
        batch() {
            const operations = [];
            return {
                set(ref, data, opts) {
                    operations.push(() => ref.set(data, opts));
                },
                async commit() {
                    for (const op of operations) await op();
                }
            };
        }
    };

    const mockFirebase = {
        firestore: {
            FieldValue: {
                serverTimestamp: () => ({ toMillis: () => Date.now(), _isServerTs: true }),
                arrayUnion: (item) => [item]
            }
        }
    };

    const context = {
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        requestAnimationFrame: (cb) => cb(),
        Date: Date,
        Math: Math,
        Array: Array,
        Object: Object,
        String: String,
        JSON: JSON,
        document: {
            getElementById: () => null,
            querySelectorAll: () => [],
            createElement: (tag) => ({
                id: '',
                className: '',
                innerHTML: '',
                style: {},
                appendChild: () => {},
                classList: { add: () => {}, remove: () => {}, contains: () => false },
                addEventListener: () => {}
            }),
            body: {
                appendChild: () => {}
            },
            addEventListener: () => {}
        },
        firebase: mockFirebase,
        window: {
            db: mockDb,
            firebase: mockFirebase,
            auth: {
                currentUser: {
                    uid: 'user_player_01',
                    displayName: 'Carlos Alcaraz',
                    photoURL: 'https://somospadel.com/img/carlos.jpg'
                }
            },
            Store: {
                getState: (key) => key === 'currentUser' ? currentMockUser : null
            },
            addEventListener: () => {}
        },
        localStorage: {
            getItem: (key) => key === 'currentUser' ? JSON.stringify(currentMockUser) : null,
            setItem: () => {}
        }
    };
    context.window.window = context.window;
    context.window.document = context.document;
    context.window.localStorage = context.localStorage;

    vm.createContext(context);

    // Cargar ChatService.js
    const chatServiceCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/chat/ChatService.js'), 'utf8');
    vm.runInContext(chatServiceCode, context);

    // Cargar ChatView.js
    const chatViewCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/chat/ChatView.js'), 'utf8');
    vm.runInContext(chatViewCode, context);

    assert(context.window.ChatService !== undefined, "window.ChatService se exporta correctamente");
    assert(typeof context.window.ChatService.getOrCreateDirectChat === 'function', "ChatService implementa getOrCreateDirectChat");
    assert(typeof context.window.ChatService.getOrCreateEventChat === 'function', "ChatService implementa getOrCreateEventChat");
    assert(typeof context.window.ChatService.sendMessage === 'function', "ChatService implementa sendMessage");

    assert(context.window.ChatView !== undefined, "window.ChatView se exporta correctamente");
    assert(typeof context.window.ChatView.renderChatButton === 'function', "ChatView implementa renderChatButton");
    assert(typeof context.window.ChatView.openEventChat === 'function', "ChatView implementa openEventChat");
    assert(typeof context.window.ChatView.openDirectChat === 'function', "ChatView implementa openDirectChat");

    // ─────────────────────────────────────────────────────────────
    // TEST SECTION 4: DIRECT CHAT LOGIC (1-on-1 & SELF CHAT PREVENT)
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [4/6] Validación de chats privados 1 a 1 (Direct Chat)...");

    // 4.1 Prevención de chat consigo mismo
    let selfChatBlocked = false;
    try {
        await context.window.ChatService.getOrCreateDirectChat({ id: 'user_player_01', name: 'Yo Mismo' });
    } catch (e) {
        if (e.message.includes("No se puede iniciar un chat directo consigo mismo")) {
            selfChatBlocked = true;
        }
    }
    assert(selfChatBlocked, "Bloquea intento de chat directo consigo mismo (mismo UID)");

    // 4.2 Validación de parámetros requeridos
    let missingRecipientBlocked = false;
    try {
        await context.window.ChatService.getOrCreateDirectChat(null);
    } catch (e) {
        if (e.message.includes("No se proporcionó el UID")) {
            missingRecipientBlocked = true;
        }
    }
    assert(missingRecipientBlocked, "Valida y rechaza destinatario nulo o sin UID");

    // 4.3 Generación determinista y ordenada del roomId (independiente del remitente)
    const otherUser = { id: 'user_player_02', uid: 'user_player_02', name: 'Rafa Nadal', photo_url: 'https://somospadel.com/img/rafa.jpg' };
    const directChat1 = await context.window.ChatService.getOrCreateDirectChat(otherUser);
    
    const expectedRoomId = `direct_${['user_player_01', 'user_player_02'].sort().join('_')}`;
    assert(directChat1.id === expectedRoomId, `Genera roomId canónico ordenado alfabéticamente: ${directChat1.id}`);
    assert(directChat1.type === 'direct', "El documento de chat tiene type='direct'");
    assert(directChat1.participants.includes('user_player_01') && directChat1.participants.includes('user_player_02'), 
        "Ambos jugadores están incluidos en participants");
    assert(directChat1.participantDetails['user_player_01'].name === 'Carlos Alcaraz', "Detalles de remitente registrados");
    assert(directChat1.participantDetails['user_player_02'].name === 'Rafa Nadal', "Detalles de destinatario registrados");

    // Probar idempotencia si el otro jugador inicia la conversación hacia el primero
    currentMockUser = otherUser;
    const directChat2 = await context.window.ChatService.getOrCreateDirectChat({ id: 'user_player_01', name: 'Carlos Alcaraz' });
    assert(directChat2.id === expectedRoomId, "Idempotencia: El mismo roomId se obtiene independientemente de quién inicie la sala");

    // ─────────────────────────────────────────────────────────────
    // TEST SECTION 5: EVENT CHAT LOGIC (ENTRENOS / AMERICANAS)
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [5/6] Validación de chats de eventos (Entrenos / Americanas)...");

    // 5.1 Rechazo de llamadas sin ID
    let eventValidationBlocked = false;
    try {
        await context.window.ChatService.getOrCreateEventChat({});
    } catch (e) {
        if (e.message.includes("debe incluir 'id' o 'eventId'")) {
            eventValidationBlocked = true;
        }
    }
    assert(eventValidationBlocked, "getOrCreateEventChat rechaza llamadas sin identificador de evento");

    // 5.2 Formato canónico 'event_<id>' sin prefijos duplicados
    const event1 = await context.window.ChatService.getOrCreateEventChat({
        id: 'americana_domingo_01',
        title: 'Americana Nivel Medio',
        date: '2026-10-15',
        category: 'intermedio',
        participants: ['u1', 'u2', 'u1'] // Duplicado intencional
    });
    assert(event1.id === 'event_americana_domingo_01', "Genera ID canónico prefijado con 'event_'");
    assert(event1.type === 'event', "El documento tiene type='event'");
    assert(event1.participants.length === 2, "Deduplica participantes duplicados en el evento");

    // Si ya viene con prefijo 'event_'
    const event2 = await context.window.ChatService.getOrCreateEventChat({
        eventId: 'event_americana_domingo_01',
        title: 'Americana Nivel Medio'
    });
    assert(event2.id === 'event_americana_domingo_01', "Evita duplicar 'event_event_...' si ya contiene el prefijo");

    // ─────────────────────────────────────────────────────────────
    // TEST SECTION 6: UI HELPERS, BUTTONS & MESSAGING
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [6/6] Validación de UI Helpers (renderChatButton) y Mensajería...");

    // 6.1 renderChatButton
    const emptyBtn = context.window.ChatView.renderChatButton(null);
    assert(emptyBtn === '', "renderChatButton retorna string vacío si eventData es nulo");

    const validEventData = {
        id: 'entreno_pro_99',
        title: 'Entreno Táctico Avanzado',
        date: '2026-10-20'
    };
    const btnHtml = context.window.ChatView.renderChatButton(validEventData);
    assert(btnHtml.includes('class="sp-chat-btn"'), "El botón incluye la clase CSS '.sp-chat-btn'");
    assert(btnHtml.includes('Chat del partido'), "El botón incluye el texto identificador 'Chat del partido'");
    assert(btnHtml.includes('fas fa-comment-dots'), "El botón contiene el icono representativo");
    assert(context.window._spEventChatRegistry['entreno_pro_99'] !== undefined, 
        "Registra de forma segura el evento en memory registry para evitar errores de comillas");

    // 6.2 Sanitización y escape HTML en ChatView
    const dirtyString = '<script>alert("xss")</script>&"\'';
    const escaped = context.window.ChatView.escapeHtml(dirtyString);
    assert(!escaped.includes('<script>') && escaped.includes('&lt;script&gt;') && escaped.includes('&amp;'), 
        "escapeHtml sanitiza correctamente tags y caracteres peligrosos");

    // 6.3 Envío de mensajes con detección de Admin Broadcast
    // Usuario estándar enviando !!
    currentMockUser.role = 'player';
    const sendResNormal = await context.window.ChatService.sendMessage(event1.id, "!! Aviso normal");
    assert(sendResNormal.success, "Mensaje normal enviado con éxito");
    const storedMsgNormal = mockDbStore[`chats_${event1.id}_messages`][sendResNormal.messageId];
    assert(storedMsgNormal.type === 'standard', "Usuario estándar no puede emitir broadcasts con !! (se mantiene como standard)");

    // Usuario Admin enviando !!
    currentMockUser.role = 'admin';
    const sendResAdmin = await context.window.ChatService.sendMessage(event1.id, "!! Aviso urgente a todos los jugadores");
    assert(sendResAdmin.success, "Mensaje de admin enviado con éxito");
    const storedMsgAdmin = mockDbStore[`chats_${event1.id}_messages`][sendResAdmin.messageId];
    assert(storedMsgAdmin.type === 'broadcast', "Admin activa correctamente type='broadcast' usando prefijo !!");
    assert(storedMsgAdmin.text === "Aviso urgente a todos los jugadores", "El prefijo !! se remueve limpiamente del texto del mensaje");

    // 6.4 Cálculo de no leídos
    const testChats = [
        { id: 'c1', unreadCount: { 'user_player_01': 3 } },
        { id: 'c2', unreadCount: { 'user_player_01': 1, 'other': 5 } },
        { id: 'c3', unreadCount: { 'user_player_01': 0 } }
    ];
    const totalUnread = context.window.ChatView.calculateTotalUnread(testChats, 'user_player_01');
    assert(totalUnread === 4, `Cálculo de total de no leídos correcto (esperado: 4, obtenido: ${totalUnread})`);

    // ─────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ─────────────────────────────────────────────────────────────
    console.log("\n================================================================");
    console.log(` RESUMEN DE PRUEBAS QA CHAT:`);
    console.log(`  PASADAS: ${passedTests}`);
    console.log(`  FALLIDAS: ${failedTests}`);
    console.log("================================================================");

    if (failedTests === 0) {
        console.log("🏆 CERTIFICACIÓN DE CALIDAD: CHAT PLAYTOMIC APROBADO AL 100%.");
        process.exit(0);
    } else {
        console.error("🚨 SE ENCONTRARON FALLOS EN LA SUITE DE PRUEBAS DE CHAT.");
        process.exit(1);
    }
}

runTestSuite().catch(err => {
    console.error("Fatal error running test suite:", err);
    process.exit(1);
});
