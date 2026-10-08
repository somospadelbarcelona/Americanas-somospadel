/**
 * test-chat-notifications-integration-qa.js
 * Comprehensive QA Integration Test Suite for Chat Notifications in SomosPadel Barcelona
 * 
 * Verifies:
 * 1. Dispatch in ChatService.sendMessage:
 *    a) General chat writes to collection 'broadcasts' with category: 'chat', chatId: 'general_somospadel'.
 *    b) Event chat writes to 'players/{targetUid}/notifications' for registered participants (excluding sender).
 *    c) Private direct chat writes to 'players/{otherUid}/notifications' for recipient with title '💬 Mensaje de ...'.
 * 2. Processing & Reception in NotificationService:
 *    a) Detection of new messages with read: false.
 *    b) Increment of unreadCount.
 *    c) Invocation of toast, sound, native push and notifySubscribers.
 *    d) Exclusion of self-sent messages.
 * 3. Normalization & Interaction in NotificationUi:
 *    a) _normalizeNotificationItem tags: 'MENSAJE PRIVADO', 'CHAT PARTIDO', 'CHAT COMUNIDAD' with appropriate styles.
 *    b) handleItemClick correctly routes to ChatView:
 *       - Private chat -> window.ChatView.openDirectChat
 *       - Event chat -> window.ChatView.openEventChat
 *       - General community chat -> window.ChatView.openGeneralCommunityChat
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
    console.log("========================================================================");
    console.log(" 💬 SOMOSPADEL BARCELONA - QA INTEGRATION: CHAT NOTIFICATIONS PIPELINE");
    console.log("========================================================================\n");

    // ─────────────────────────────────────────────────────────────
    // 1. IN-MEMORY FIRESTORE & BROWSER RUNTIME ENVIRONMENT SETUP
    // ─────────────────────────────────────────────────────────────
    console.log("▶️ [1/4] Configuración del entorno de prueba simulado...");

    const mockDbStore = {
        chats: {},
        broadcasts: {},
        players: {} // uid -> { notifications: {} }
    };

    const mockDocRef = (colName, docId) => {
        return {
            id: docId,
            async get() {
                const data = mockDbStore[colName]?.[docId];
                return {
                    exists: !!data,
                    id: docId,
                    data: () => (data ? JSON.parse(JSON.stringify(data)) : null)
                };
            },
            async set(data, options) {
                mockDbStore[colName] = mockDbStore[colName] || {};
                if (options && options.merge && mockDbStore[colName][docId]) {
                    mockDbStore[colName][docId] = {
                        ...mockDbStore[colName][docId],
                        ...JSON.parse(JSON.stringify(data))
                    };
                } else {
                    mockDbStore[colName][docId] = JSON.parse(JSON.stringify(data));
                }
            },
            async update(data) {
                if (!mockDbStore[colName]?.[docId]) {
                    mockDbStore[colName] = mockDbStore[colName] || {};
                    mockDbStore[colName][docId] = {};
                }
                mockDbStore[colName][docId] = {
                    ...mockDbStore[colName][docId],
                    ...JSON.parse(JSON.stringify(data))
                };
            },
            onSnapshot(cb) {
                const data = mockDbStore[colName]?.[docId];
                if (typeof cb === 'function') {
                    cb({
                        exists: !!data,
                        id: docId,
                        data: () => (data ? JSON.parse(JSON.stringify(data)) : null)
                    });
                }
                return () => {};
            },
            collection(subColName) {
                return {
                    doc(subDocId = 'sub_' + Math.random().toString(36).substring(2)) {
                        return {
                            id: subDocId,
                            async set(subData) {
                                const compositeKey = `${colName}_${docId}_${subColName}`;
                                mockDbStore[compositeKey] = mockDbStore[compositeKey] || {};
                                mockDbStore[compositeKey][subDocId] = JSON.parse(JSON.stringify(subData));
                            },
                            async update(patch) {
                                const compositeKey = `${colName}_${docId}_${subColName}`;
                                if (mockDbStore[compositeKey]?.[subDocId]) {
                                    mockDbStore[compositeKey][subDocId] = {
                                        ...mockDbStore[compositeKey][subDocId],
                                        ...JSON.parse(JSON.stringify(patch))
                                    };
                                }
                            },
                            async delete() {
                                const compositeKey = `${colName}_${docId}_${subColName}`;
                                if (mockDbStore[compositeKey]?.[subDocId]) {
                                    delete mockDbStore[compositeKey][subDocId];
                                }
                            }
                        };
                    },
                    orderBy() { return this; },
                    limit() { return this; },
                    onSnapshot(cb) {
                        return () => {};
                    }
                };
            }
        };
    };

    const mockDb = {
        collection(colName) {
            return {
                doc(id = 'doc_' + Math.random().toString(36).substring(2)) {
                    if (colName === 'players') {
                        // Support players/{uid}/collection('notifications')
                        return {
                            id: id,
                            collection(subCol) {
                                return {
                                    doc(subId = 'notif_' + Math.random().toString(36).substring(2)) {
                                        return {
                                            id: subId,
                                            async set(notifData) {
                                                mockDbStore.players[id] = mockDbStore.players[id] || { notifications: {} };
                                                mockDbStore.players[id].notifications[subId] = JSON.parse(JSON.stringify(notifData));
                                            },
                                            async update(patch) {
                                                if (mockDbStore.players[id]?.notifications?.[subId]) {
                                                    mockDbStore.players[id].notifications[subId] = {
                                                        ...mockDbStore.players[id].notifications[subId],
                                                        ...JSON.parse(JSON.stringify(patch))
                                                    };
                                                }
                                            }
                                        };
                                    },
                                    orderBy() { return this; },
                                    limit() { return this; },
                                    onSnapshot(cb) {
                                        const notifsObj = mockDbStore.players[id]?.notifications || {};
                                        const docs = Object.entries(notifsObj).map(([nid, ndata]) => ({
                                            id: nid,
                                            data: () => ndata
                                        }));
                                        cb({ docs, docChanges: () => [] });
                                        return () => {};
                                    }
                                };
                            }
                        };
                    }
                    return mockDocRef(colName, id);
                },
                where() { return this; },
                orderBy() { return this; },
                limit() { return this; },
                onSnapshot(cb) {
                    const colData = mockDbStore[colName] || {};
                    const docs = Object.entries(colData).map(([id, d]) => ({
                        id,
                        data: () => d
                    }));
                    cb({ docs, docChanges: () => [] });
                    return () => {};
                }
            };
        },
        batch() {
            const queue = [];
            return {
                set(ref, data, opts) {
                    queue.push(() => ref.set(data, opts));
                },
                async commit() {
                    for (const fn of queue) {
                        await fn();
                    }
                }
            };
        }
    };

    let currentUser = {
        id: 'user_alex_sender',
        uid: 'user_alex_sender',
        name: 'Alex Coscolin',
        displayName: 'Alex Coscolin',
        photo_url: 'https://somospadel.com/img/alex.jpg',
        role: 'admin'
    };

    // Global localStorage mock
    const localStorageData = {};
    const mockLocalStorage = {
        getItem: (k) => localStorageData[k] || null,
        setItem: (k, v) => { localStorageData[k] = String(v); },
        removeItem: (k) => { delete localStorageData[k]; },
        clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
    };

    // Spies for UI and Notification feedback
    const spies = {
        toasts: [],
        soundsPlayed: 0,
        nativePushes: [],
        subscriberCalls: [],
        chatViewCalls: []
    };

    // Mock ChatView
    const mockChatView = {
        getCurrentUser: () => currentUser,
        openDirectChat: (player) => {
            spies.chatViewCalls.push({ action: 'openDirectChat', target: player });
        },
        openEventChat: (event) => {
            spies.chatViewCalls.push({ action: 'openEventChat', target: event });
        },
        openGeneralCommunityChat: () => {
            spies.chatViewCalls.push({ action: 'openGeneralCommunityChat' });
        }
    };

    // Browser Context Construction
    const contextObj = {
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Math,
        JSON,
        Set,
        Map,
        Promise,
        localStorage: mockLocalStorage,
        location: {
            hash: '',
            href: 'https://somospadel.barcelona'
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        navigator: {
            serviceWorker: {
                addEventListener: () => {},
                ready: Promise.resolve({
                    getNotifications: async () => []
                })
            },
            setAppBadge: async () => {},
            clearAppBadge: async () => {}
        },
        document: {
            readyState: 'complete',
            getElementById: (id) => ({
                id,
                innerText: '',
                innerHTML: '',
                classList: {
                    add: () => {},
                    remove: () => {},
                    toggle: () => {},
                    contains: () => false
                },
                style: {},
                setAttribute: () => {},
                addEventListener: () => {}
            }),
            querySelectorAll: () => [],
            addEventListener: () => {},
            createElement: (tag) => ({
                tagName: tag,
                className: '',
                innerHTML: '',
                style: {},
                appendChild: () => {},
                setAttribute: () => {}
            }),
            body: {
                appendChild: () => {}
            }
        },
        window: {},
        firebase: {
            firestore: {
                FieldValue: {
                    serverTimestamp: () => new Date(),
                    arrayUnion: (...items) => items
                }
            }
        }
    };

    contextObj.window = contextObj;
    contextObj.window.db = mockDb;
    contextObj.window.auth = { currentUser };
    contextObj.window.ChatView = mockChatView;
    contextObj.window.Store = {
        getState: (k) => (k === 'currentUser' ? currentUser : null)
    };

    const vmContext = vm.createContext(contextObj);

    // Load ChatService.js
    const chatServiceCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/chat/ChatService.js'), 'utf8');
    vm.runInContext(chatServiceCode, vmContext);
    assert(!!vmContext.window.ChatService, "ChatService.js cargado correctamente en contexto");

    // Load NotificationService.js
    const notifServiceCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/common/NotificationService.js'), 'utf8');
    vm.runInContext(notifServiceCode, vmContext);
    assert(!!vmContext.window.NotificationServiceClass, "NotificationServiceClass definido correctamente");

    // Load NotificationUi.js
    const notifUiCode = fs.readFileSync(path.resolve(__dirname, '../js/modules/ui/NotificationUi.js'), 'utf8');
    vm.runInContext(notifUiCode, vmContext);
    assert(!!vmContext.window.NotificationUi, "NotificationUi instanciado y expuesto correctamente");

    const chatService = vmContext.window.ChatService;
    const notificationService = vmContext.window.NotificationService;
    const notificationUi = vmContext.window.NotificationUi;

    // Attach spies
    notificationService.showInAppToast = (title, body, type, url) => {
        spies.toasts.push({ title, body, type, url });
    };
    notificationService.showNativeNotification = (title, body, data) => {
        spies.nativePushes.push({ title, body, data });
    };
    notificationUi.playNotificationSound = () => {
        spies.soundsPlayed++;
    };
    notificationService.onUpdate((state) => {
        spies.subscriberCalls.push(state);
    });

    console.log("  ✅ Entorno VM y spies configurados correctamente.");

    // ─────────────────────────────────────────────────────────────
    // 2. TEST SECTION A: DESPACHO EN ChatService.sendMessage
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [2/4] Verificando despacho de notificaciones en ChatService.sendMessage...");

    // 2.a: Chat General -> colección 'broadcasts'
    mockDbStore.chats['general_somospadel'] = {
        id: 'general_somospadel',
        type: 'general',
        title: 'Chat General SomosPadel'
    };

    const genMsgResult = await chatService.sendMessage('general_somospadel', '¡Bienvenidos al torneo de Americanas!');
    assert(genMsgResult.success === true, "ChatService.sendMessage exitoso para general_somospadel");

    // Give microtasks time to complete dispatchChatNotifications
    await new Promise(r => setTimeout(r, 100));

    const broadcastEntries = Object.values(mockDbStore.broadcasts || {});
    assert(broadcastEntries.length > 0, "Notificación registrada en colección 'broadcasts'");
    const generalNotif = broadcastEntries.find(b => b.chatId === 'general_somospadel');
    assert(!!generalNotif, "Se encontró entrada con chatId === 'general_somospadel' en broadcasts");
    assert(generalNotif?.category === 'chat', "Categoría de broadcast para chat general es 'chat'");
    assert(generalNotif?.senderId === currentUser.uid, "Remitente en broadcast coincide con currentUser.uid");
    assert(generalNotif?.body?.includes('Alex Coscolin: ¡Bienvenidos al torneo'), "Cuerpo de broadcast incluye 'Remitente: Mensaje'");

    // 2.b: Chat de Evento -> 'players/{targetUid}/notifications' (excluyendo remitente)
    const eventChatId = 'event_torneo_sabado_cornell';
    const playerA = 'user_alex_sender'; // Sender
    const playerB = 'user_marta_padel';
    const playerC = 'user_marc_drive';

    mockDbStore.chats[eventChatId] = {
        id: eventChatId,
        type: 'event',
        eventId: 'torneo_sabado_cornell',
        title: 'Americana Cornellà Sábado',
        participants: [playerA, playerB, playerC]
    };

    const evtMsgResult = await chatService.sendMessage(eventChatId, 'Recordad llegar 15 minutos antes para el calentamiento');
    assert(evtMsgResult.success === true, "ChatService.sendMessage exitoso para chat de evento");
    await new Promise(r => setTimeout(r, 100));

    // Player B (destinatario)
    const playerBNotifs = Object.values(mockDbStore.players[playerB]?.notifications || {});
    assert(playerBNotifs.length > 0, "Jugadora Marta recibió notificación en players/user_marta_padel/notifications");
    const martaEvtNotif = playerBNotifs.find(n => n.data?.chatId === eventChatId);
    assert(!!martaEvtNotif, "Marta tiene notificación para event_torneo_sabado_cornell");
    assert(martaEvtNotif?.read === false, "Notificación de evento recibida con read: false");
    assert(martaEvtNotif?.category === 'chat', "Categoría de notificación de evento es 'chat'");
    assert(martaEvtNotif?.title?.includes('Americana Cornellà Sábado'), "Título incluye el nombre del evento");

    // Player C (destinatario)
    const playerCNotifs = Object.values(mockDbStore.players[playerC]?.notifications || {});
    assert(playerCNotifs.length > 0, "Jugador Marc recibió notificación en players/user_marc_drive/notifications");

    // Player A (remitente) -> NO DEBE RECIBIR NOTIFICACIÓN
    const playerANotifs = Object.values(mockDbStore.players[playerA]?.notifications || {});
    const alexEvtNotif = playerANotifs.find(n => n.data?.chatId === eventChatId);
    assert(!alexEvtNotif, "El remitente (Alex) fue debidamente EXCLUIDO de recibir notificación de su propio mensaje");

    // 2.c: Chat Privado 1 a 1 -> 'players/{otherUid}/notifications'
    const directChatId = 'direct_user_alex_sender_user_sergi_padel';
    const otherUserUid = 'user_sergi_padel';

    mockDbStore.chats[directChatId] = {
        id: directChatId,
        type: 'direct',
        participants: [playerA, otherUserUid]
    };

    const directMsgResult = await chatService.sendMessage(directChatId, '¿Jugamos un partido este viernes a las 19h?');
    assert(directMsgResult.success === true, "ChatService.sendMessage exitoso para chat privado 1 a 1");
    await new Promise(r => setTimeout(r, 100));

    const sergiNotifs = Object.values(mockDbStore.players[otherUserUid]?.notifications || {});
    assert(sergiNotifs.length > 0, "Destinatario Sergi recibió notificación en players/user_sergi_padel/notifications");
    const sergiMsgNotif = sergiNotifs.find(n => n.data?.chatId === directChatId);
    assert(!!sergiMsgNotif, "Se encontró notificación de chat directo en el buzón de Sergi");
    assert(sergiMsgNotif?.title === '💬 Mensaje de Alex Coscolin', "Título de chat privado es '💬 Mensaje de Alex Coscolin'");
    assert(sergiMsgNotif?.read === false, "read: false en notificación privada");
    assert(sergiMsgNotif?.data?.chatType === 'direct', "data.chatType es 'direct'");
    assert(sergiMsgNotif?.body === '¿Jugamos un partido este viernes a las 19h?', "Cuerpo coincide con el texto exacto enviado");

    // ─────────────────────────────────────────────────────────────
    // 3. TEST SECTION B: PROCESAMIENTO Y RECEPCIÓN EN NotificationService
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [3/4] Verificando procesamiento y recepción en NotificationService...");

    // Limpiar espías antes de pruebas de recepción
    spies.toasts = [];
    spies.soundsPlayed = 0;
    spies.nativePushes = [];
    spies.subscriberCalls = [];

    // B.1: Recepción de mensaje nuevo entrante en _processIncomingChatMessage
    const initialUnreadCount = notificationService.unreadCount;
    notificationService.serviceStartTime = Date.now() - 1000;

    notificationService._processIncomingChatMessage({
        chatId: 'direct_user_sergi_padel_user_alex_sender',
        chatTitle: 'Sergi Padel',
        chatType: 'direct',
        currentUid: currentUser.uid,
        changeDoc: {
            id: 'msg_incoming_001',
            data: () => ({
                senderId: 'user_sergi_padel',
                senderName: 'Sergi Padel',
                text: '¡Hecho, quedamos el viernes a las 19h!',
                timestamp: new Date()
            })
        }
    });

    const addedItem = notificationService.chatNotifications.find(n => n.id.includes('msg_incoming_001'));
    assert(!!addedItem, "Mensaje entrante agregado a chatNotifications");
    assert(addedItem?.read === false, "Mensaje entrante tiene read === false");
    assert(notificationService.unreadCount > initialUnreadCount, 
        `unreadCount incrementado correctamente (${initialUnreadCount} -> ${notificationService.unreadCount})`);

    assert(spies.toasts.length > 0, "Toast in-app emitido al recibir mensaje nuevo");
    assert(spies.toasts[0].title === '💬 Mensaje de Sergi Padel', "Título del toast coincide");
    assert(spies.soundsPlayed > 0, "Tono de aviso (sonido) reproducido");
    assert(spies.nativePushes.length > 0, "Notificación nativa / push emitida");
    assert(spies.subscriberCalls.length > 0, "notifySubscribers fue invocado notificando a la UI");

    // B.2: Verificación de no-autoalerta (filtro de mensajes propios)
    const toastsBeforeSelf = spies.toasts.length;
    notificationService._processIncomingChatMessage({
        chatId: 'direct_user_sergi_padel_user_alex_sender',
        chatTitle: 'Sergi Padel',
        chatType: 'direct',
        currentUid: currentUser.uid,
        changeDoc: {
            id: 'msg_self_002',
            data: () => ({
                senderId: currentUser.uid, // Mismo UID del usuario conectado
                senderName: currentUser.name,
                text: 'Mensaje que me envié yo mismo',
                timestamp: new Date()
            })
        }
    });
    assert(spies.toasts.length === toastsBeforeSelf, "Mensajes enviados por uno mismo son ignorados sin disparar alerta ni toast");

    // ─────────────────────────────────────────────────────────────
    // 4. TEST SECTION C: NORMALIZACIÓN E INTERACCIÓN EN NotificationUi
    // ─────────────────────────────────────────────────────────────
    console.log("\n▶️ [4/4] Verificando normalización y enrutamiento en NotificationUi...");

    // C.1: Normalización de etiquetas de categorías de Chat
    // Chat Privado
    const directChatItem = {
        id: 'chat_direct_paula_alex_msg_99',
        category: 'chat',
        type: 'chat',
        title: '💬 Mensaje de Paula Badosa',
        body: '¿Entrenamos revés hoy?',
        data: {
            chatId: 'direct_paula_alex',
            chatType: 'direct',
            senderId: 'user_paula_badosa',
            senderName: 'Paula Badosa',
            url: 'chat'
        }
    };
    const directNormalized = notificationUi._normalizeNotificationItem(directChatItem);
    assert(directNormalized.tag.label === 'MENSAJE PRIVADO', "Etiqueta para chat privado es 'MENSAJE PRIVADO'");
    assert(directNormalized.tag.cssClass === 'tag-chat-direct', "Clase CSS es 'tag-chat-direct'");
    assert(directNormalized.tag.cardThemeClass === 'theme-chat', "Tema de tarjeta es 'theme-chat'");

    // Chat de Evento / Partido
    const eventChatItem = {
        id: 'chat_event_americana_35_cornella_msg_88',
        category: 'chat',
        type: 'chat',
        title: '🎾 Americana Nivel 3.5 Cornellà',
        body: 'Marta: Ya tengo pista asignada',
        data: {
            chatId: 'event_americana_35_cornella',
            chatType: 'event',
            eventId: 'americana_35_cornella',
            url: 'chat'
        }
    };
    const eventNormalized = notificationUi._normalizeNotificationItem(eventChatItem);
    assert(eventNormalized.tag.label === 'CHAT PARTIDO', "Etiqueta para chat de evento es 'CHAT PARTIDO'");
    assert(eventNormalized.tag.cssClass === 'tag-chat-event', "Clase CSS es 'tag-chat-event'");

    // Chat General de la Comunidad
    const generalChatItem = {
        id: 'chat_general_somospadel_msg_77',
        category: 'chat',
        type: 'chat',
        title: '💬 Chat General SomosPadel',
        body: 'Admin: Gran jornada hoy en todas las pistas',
        data: {
            chatId: 'general_somospadel',
            chatType: 'general',
            url: 'chat'
        }
    };
    const generalNormalized = notificationUi._normalizeNotificationItem(generalChatItem);
    assert(generalNormalized.tag.label === 'CHAT COMUNIDAD', "Etiqueta para chat general es 'CHAT COMUNIDAD'");
    assert(generalNormalized.tag.cssClass === 'tag-chat-general', "Clase CSS es 'tag-chat-general'");

    // Registrar los elementos en notificationService.chatNotifications para la prueba de clic
    notificationService.chatNotifications = [directChatItem, eventChatItem, generalChatItem];

    // C.2: Enrutamiento en handleItemClick
    spies.chatViewCalls = [];

    // Click en Chat Privado
    notificationUi.handleItemClick('chat_direct_paula_alex_msg_99', 'chat', '', '');
    const directRouteCall = spies.chatViewCalls.find(c => c.action === 'openDirectChat');
    assert(!!directRouteCall, "handleItemClick enruta chat privado hacia window.ChatView.openDirectChat");
    assert(directRouteCall?.target?.id === 'user_paula_badosa', "UID del jugador remitente pasado a openDirectChat");
    assert(directRouteCall?.target?.name === 'Paula Badosa', "Nombre de jugador remitente pasado a openDirectChat");

    // Click en Chat de Evento
    spies.chatViewCalls = [];
    notificationUi.handleItemClick('chat_event_americana_35_cornella_msg_88', 'chat', 'americana_35_cornella', '');
    const eventRouteCall = spies.chatViewCalls.find(c => c.action === 'openEventChat');
    assert(!!eventRouteCall, "handleItemClick enruta chat de evento hacia window.ChatView.openEventChat");
    assert(eventRouteCall?.target?.id === 'americana_35_cornella', "ID del evento pasado a openEventChat");

    // Click en Chat General Comunidad
    spies.chatViewCalls = [];
    notificationUi.handleItemClick('chat_general_somospadel_msg_77', 'chat', '', '');
    const generalRouteCall = spies.chatViewCalls.find(c => c.action === 'openGeneralCommunityChat');
    assert(!!generalRouteCall, "handleItemClick enruta chat general hacia window.ChatView.openGeneralCommunityChat");

    // ─────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ─────────────────────────────────────────────────────────────
    console.log("\n========================================================================");
    console.log(" RESUMEN DE PRUEBAS DE INTEGRACIÓN QA:");
    console.log(`  PASADAS: ${passedTests}`);
    console.log(`  FALLIDAS: ${failedTests}`);
    console.log("========================================================================");

    if (failedTests === 0) {
        console.log("🏆 CERTIFICACIÓN DE CALIDAD: NOTIFICACIONES DE CHAT 100% VALIDADAS Y EN PRODUCCIÓN READY.\n");
        process.exit(0);
    } else {
        console.error("❌ SE ENCONTRARON FALLOS EN LA VERIFICACIÓN QA.\n");
        process.exit(1);
    }
}

runTestSuite().catch(err => {
    console.error("❌ Excepción en ejecución del test suite:", err);
    process.exit(1);
});
