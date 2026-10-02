/**
 * ChatService.js
 * Secure Communication Protocol & Messaging Architecture for SomosPadel Barcelona.
 * Handles Event Chats, 1-on-1 Direct Chats, Real-time Observers, Tactical SOS & User Presence.
 * VERSION: Pro Expert v7.0
 */
(function () {
    const getFieldValue = () => {
        if (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue) {
            return window.firebase.firestore.FieldValue;
        }
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
            return firebase.firestore.FieldValue;
        }
        return {
            serverTimestamp: () => new Date(),
            arrayUnion: (...items) => items
        };
    };

    class ChatService {
        constructor() {
            this.activeUnsubscribe = null;
            this.presenceInterval = null;
        }

        /**
         * Helper to get current authenticated user safely from Store, AdminAuth, localStorage or Firebase Auth.
         * Robust extraction of uid, name, role and administrative flags.
         */
        getCurrentUser() {
            let user = null;

            // 1. From Store if available
            if (window.Store && typeof window.Store.getState === 'function') {
                const storeUser = window.Store.getState('currentUser');
                if (storeUser && (storeUser.id || storeUser.uid)) {
                    user = { ...storeUser };
                }
            }

            // 2. From AdminAuth if available
            if (window.AdminAuth && window.AdminAuth.user) {
                user = user ? { ...user, ...window.AdminAuth.user } : { ...window.AdminAuth.user };
            }

            // 3. From localStorage ('adminUser' or 'currentUser')
            try {
                const rawAdmin = localStorage.getItem('adminUser');
                const rawCurrent = localStorage.getItem('currentUser');
                const localAdmin = rawAdmin ? JSON.parse(rawAdmin) : null;
                const localCurrent = rawCurrent ? JSON.parse(rawCurrent) : null;
                const localUser = localAdmin || localCurrent;

                if (localUser) {
                    user = user ? { ...localUser, ...user } : { ...localUser };
                    if (localAdmin && localAdmin.role) {
                        user.role = localAdmin.role;
                    } else if (localCurrent && localCurrent.role && !user.role) {
                        user.role = localCurrent.role;
                    }
                }
            } catch (e) { }

            // 4. From Firebase Auth
            if (window.auth && window.auth.currentUser) {
                const fbUser = window.auth.currentUser;
                if (!user) {
                    user = {
                        id: fbUser.uid,
                        uid: fbUser.uid,
                        name: fbUser.displayName || 'Jugador',
                        photo_url: fbUser.photoURL || null
                    };
                } else {
                    user.id = user.id || fbUser.uid;
                    user.uid = user.uid || fbUser.uid;
                    user.name = user.name || fbUser.displayName || 'Jugador';
                    user.photo_url = user.photo_url || fbUser.photoURL || null;
                }
            }

            if (!user) return null;

            const uid = user.id || user.uid;
            if (!uid) return null;
            user.id = uid;
            user.uid = uid;

            // Ensure role is extracted if still missing
            if (!user.role) {
                try {
                    const localAdmin = JSON.parse(localStorage.getItem('adminUser') || 'null');
                    const localCurrent = JSON.parse(localStorage.getItem('currentUser') || 'null');
                    user.role = (localAdmin && localAdmin.role) || (localCurrent && localCurrent.role) || null;
                } catch (e) { }
            }

            return user;
        }

        /**
         * Checks if the user has chat moderation privileges (superadmin, admin, etc.)
         * @param {Object} [user] - User object to inspect; defaults to getCurrentUser()
         * @returns {boolean}
         */
        hasModerationPrivileges(user = null) {
            const targetUser = user || this.getCurrentUser();
            if (!targetUser) return false;

            const role = (targetUser.role || '').toString().toLowerCase().trim();
            const adminRoles = ['superadmin', 'super_admin', 'admin', 'admin_player'];

            if (adminRoles.includes(role)) return true;

            if (targetUser.isSessionAdmin === true || targetUser.isAdmin === true || targetUser.isSuperAdmin === true) {
                return true;
            }

            if (window.AdminAuth && typeof window.AdminAuth.hasAdminRole === 'function') {
                if (window.AdminAuth.hasAdminRole(role)) return true;
                if (window.AdminAuth.user && window.AdminAuth.hasAdminRole(window.AdminAuth.user.role)) return true;
            }

            return false;
        }

        /**
         * 1-on-1 Direct Chat: Get or initialize private room between logged-in user and another player
         * @param {Object} otherUser - { id/uid, name, photo_url/avatar }
         * @returns {Promise<Object>} The direct chat room document data
         */
        async getOrCreateDirectChat(otherUser) {
            const currentUser = this.getCurrentUser();
            if (!currentUser) throw new Error("No hay usuario autenticado en la sesión.");

            const myUid = currentUser.id || currentUser.uid;
            const otherUid = otherUser ? (otherUser.id || otherUser.uid) : null;

            if (!myUid) throw new Error("No se pudo identificar el UID del usuario actual.");
            if (!otherUid) throw new Error("No se proporcionó el UID del usuario destinatario.");
            if (myUid === otherUid) throw new Error("No se puede iniciar un chat directo consigo mismo.");

            const participants = [myUid, otherUid].sort();
            const roomId = `direct_${participants.join('_')}`;
            const chatRef = window.db.collection('chats').doc(roomId);

            const myDetails = {
                name: currentUser.name || currentUser.displayName || 'Jugador',
                avatar: currentUser.photo_url || currentUser.photoURL || currentUser.avatar || null
            };
            const otherDetails = {
                name: otherUser.name || otherUser.displayName || 'Jugador',
                avatar: otherUser.photo_url || otherUser.photoURL || otherUser.avatar || null
            };

            const docSnap = await chatRef.get();
            const serverTs = getFieldValue().serverTimestamp();

            if (docSnap.exists) {
                const existing = docSnap.data();
                const updatedDetails = {
                    ...(existing.participantDetails || {}),
                    [myUid]: myDetails,
                    [otherUid]: otherDetails
                };

                await chatRef.update({
                    participantDetails: updatedDetails,
                    participants: participants,
                    updatedAt: serverTs
                });

                return { id: roomId, ...existing, participantDetails: updatedDetails, participants };
            } else {
                const newChat = {
                    id: roomId,
                    type: 'direct',
                    participants: participants,
                    participantDetails: {
                        [myUid]: myDetails,
                        [otherUid]: otherDetails
                    },
                    lastMessage: '',
                    lastMessageTime: serverTs,
                    lastSenderName: '',
                    lastSenderId: '',
                    createdAt: serverTs,
                    updatedAt: serverTs,
                    unreadCount: {
                        [myUid]: 0,
                        [otherUid]: 0
                    }
                };

                await chatRef.set(newChat);
                return newChat;
            }
        }

        /**
         * Event Chat: Get or register/update metadata for Entrenos or Americanas
         * @param {Object} eventData - { id/eventId, title/name, date, category, participants/participantIds }
         * @returns {Promise<Object>} The event chat room document data
         */
        async getOrCreateEventChat(eventData) {
            if (!eventData) throw new Error("eventData es requerido");
            const rawId = eventData.eventId || eventData.id;
            if (!rawId) throw new Error("eventData debe incluir 'id' o 'eventId'");

            const cleanEventId = String(rawId).replace(/^event_/, '');
            const roomId = String(rawId).startsWith('event_') ? String(rawId) : `event_${cleanEventId}`;
            const chatRef = window.db.collection('chats').doc(roomId);

            const rawParticipants = Array.isArray(eventData.participants)
                ? eventData.participants
                : (Array.isArray(eventData.participantIds) ? eventData.participantIds : []);
            const participants = Array.from(new Set(rawParticipants));

            const title = eventData.title || eventData.name || 'Evento';
            const date = eventData.date || null;
            const category = eventData.category || 'open';
            const serverTs = getFieldValue().serverTimestamp();

            const docSnap = await chatRef.get();

            if (docSnap.exists) {
                const existing = docSnap.data();
                const updatePayload = {
                    type: 'event',
                    eventId: cleanEventId,
                    title: title,
                    date: date,
                    category: category,
                    participants: participants,
                    updatedAt: serverTs
                };
                await chatRef.update(updatePayload);
                return { id: roomId, ...existing, ...updatePayload };
            } else {
                const newEventChat = {
                    id: roomId,
                    type: 'event',
                    eventId: cleanEventId,
                    title: title,
                    date: date,
                    category: category,
                    participants: participants,
                    lastMessage: '',
                    lastMessageTime: serverTs,
                    lastSenderName: '',
                    lastSenderId: '',
                    createdAt: serverTs,
                    updatedAt: serverTs
                };
                await chatRef.set(newEventChat);
                return newEventChat;
            }
        }

        /**
         * Listen to real-time chats where the user is a participant
         * Uses composite index orderBy('lastMessageTime', 'desc') with automatic client-side fallback if unindexed.
         * @param {string} uid - User unique identifier
         * @param {Function} callback - Function receiving sorted chat list
         * @returns {Function} Unsubscribe function
         */
        getUserChats(uid, callback) {
            if (!uid) {
                console.warn("[ChatService] getUserChats: uid is required");
                callback([]);
                return () => {};
            }

            const chatsCol = window.db.collection('chats');
            let unsub = null;
            let isFallback = false;

            const parseAndSortDocs = (snapshot) => {
                let chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (isFallback) {
                    chats.sort((a, b) => {
                        const getMillis = (ts) => {
                            if (!ts) return 0;
                            if (typeof ts.toMillis === 'function') return ts.toMillis();
                            if (ts instanceof Date) return ts.getTime();
                            if (typeof ts === 'number') return ts;
                            return 0;
                        };
                        return getMillis(b.lastMessageTime) - getMillis(a.lastMessageTime);
                    });
                }
                return chats;
            };

            try {
                // Try indexed query first
                unsub = chatsCol
                    .where('participants', 'array-contains', uid)
                    .orderBy('lastMessageTime', 'desc')
                    .onSnapshot(
                        snapshot => {
                            callback(parseAndSortDocs(snapshot));
                        },
                        err => {
                            console.warn("[ChatService] Indexed getUserChats query failed (composite index pending). Using client-side sort fallback.", err);
                            isFallback = true;
                            unsub = chatsCol
                                .where('participants', 'array-contains', uid)
                                .onSnapshot(
                                    fallbackSnap => {
                                        callback(parseAndSortDocs(fallbackSnap));
                                    },
                                    fallbackErr => {
                                        console.error("❌ [ChatService] getUserChats fallback query failed:", fallbackErr);
                                        callback([]);
                                    }
                                );
                        }
                    );
            } catch (e) {
                console.error("❌ [ChatService] Error in getUserChats:", e);
                callback([]);
            }

            return () => {
                if (unsub) {
                    unsub();
                    unsub = null;
                }
            };
        }

        /**
         * Subscribe to messages in a specific chat room in real-time
         * @param {string} chatId - Document ID in 'chats'
         * @param {Function} callback - Receives array of messages
         * @returns {Function} Unsubscribe function
         */
        subscribeToMessages(chatId, callback) {
            if (!chatId) {
                console.warn("[ChatService] subscribeToMessages: chatId is required");
                callback([]);
                return () => {};
            }

            return window.db.collection('chats')
                .doc(chatId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .limit(150)
                .onSnapshot(
                    snapshot => {
                        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        callback(messages);
                    },
                    error => {
                        console.error(`📡 [ChatService] subscribeToMessages error on ${chatId}:`, error);
                    }
                );
        }

        /**
         * Legacy Subscribe: Subscribes to messages and starts user presence heartbeat
         * @param {string} eventIdOrChatId - Event or Chat identifier
         * @param {Function} callback - Receives array of messages
         * @returns {Function} Unsubscribe function
         */
        subscribe(eventIdOrChatId, callback) {
            if (this.activeUnsubscribe) {
                this.activeUnsubscribe();
                this.activeUnsubscribe = null;
            }

            this.activeUnsubscribe = this.subscribeToMessages(eventIdOrChatId, callback);
            this.startPresenceHeartbeat(eventIdOrChatId);
            return this.activeUnsubscribe;
        }

        /**
         * Real-time User Presence (Heartbeat)
         */
        async startPresenceHeartbeat(chatId) {
            const user = this.getCurrentUser();
            if (!user) return;

            const uid = user.id || user.uid;
            const presenceRef = window.db.collection('chats').doc(chatId).collection('presence').doc(uid);

            const reportStatus = async () => {
                try {
                    await presenceRef.set({
                        name: user.name || user.displayName || 'Jugador',
                        photo: user.photo_url || user.photoURL || null,
                        lastSeen: getFieldValue().serverTimestamp(),
                        status: 'online'
                    });
                } catch (e) {
                    console.warn("[ChatService] Presence heartbeat failed", e);
                }
            };

            // First report
            await reportStatus();

            // Interval every 2 minutes
            if (this.presenceInterval) clearInterval(this.presenceInterval);
            this.presenceInterval = setInterval(reportStatus, 120000);
        }

        /**
         * Subscribe to who's online right now
         */
        subscribePresence(chatId, callback) {
            return window.db.collection('chats').doc(chatId).collection('presence')
                .onSnapshot(snapshot => {
                    const now = Date.now();
                    const fiveMinutes = 5 * 60 * 1000;

                    const onlineUsers = snapshot.docs
                        .map(doc => ({ uid: doc.id, ...doc.data() }))
                        .filter(u => {
                            if (!u.lastSeen) return false;
                            const lastSeenMillis = u.lastSeen.toMillis ? u.lastSeen.toMillis() : u.lastSeen;
                            return (now - lastSeenMillis) < fiveMinutes;
                        });

                    callback(onlineUsers);
                }, error => {
                    console.error("📡 [ChatService] Presence subscription error:", error);
                });
        }

        /**
         * Send a tactical message (supports text, media attachments, audio, and admin broadcasts)
         * Atomically updates message document and parent chat metadata (lastMessage, lastMessageTime, lastSenderName, lastSenderId).
         * @param {string} chatId - Target chat document ID
         * @param {string} text - Message text
         * @param {Object|null} media - { type: 'image'|'audio', data: base64 }
         */
        async sendMessage(chatId, text, media = null) {
            const user = this.getCurrentUser();
            if (!user) return { success: false, error: 'Unauthorized' };

            const uid = user.id || user.uid;
            if (!uid) return { success: false, error: 'Unauthorized' };

            try {
                const isAdmin = this.hasModerationPrivileges(user);
                let messageType = isAdmin ? 'admin' : 'standard';

                // Broadcast Detection (Admin Only via !! prefix)
                let cleanedText = String(text || '');
                if (isAdmin && cleanedText.startsWith('!!')) {
                    messageType = 'broadcast';
                    cleanedText = cleanedText.substring(2).trim();
                }

                if (media) {
                    messageType = media.type === 'audio' ? 'audio' : 'media';
                }

                let previewText = cleanedText;
                if (!previewText && media) {
                    previewText = media.type === 'audio' ? '🎤 Audio' : '📷 Imagen';
                }

                const senderName = user.name || user.displayName || 'Jugador';
                const senderAvatar = user.photo_url || user.photoURL || user.avatar || null;
                const senderTeam = user.team || user.team_name || user.membership || user.category || 'PLAYER';
                const senderLevel = user.level || user.nivel || user.playtomic_level || (user.stats && user.stats.level) || null;
                const serverTs = getFieldValue().serverTimestamp();

                const messageData = {
                    text: cleanedText,
                    attachment: media ? media.data : null,
                    attachmentType: media ? media.type : null,
                    senderId: uid,
                    senderName: senderName,
                    senderTeam: senderTeam,
                    senderAvatar: senderAvatar,
                    senderLevel: senderLevel,
                    timestamp: serverTs,
                    type: messageType,
                    isAdmin: isAdmin
                };

                const batch = window.db.batch();
                const chatDocRef = window.db.collection('chats').doc(chatId);
                const newMsgRef = chatDocRef.collection('messages').doc();

                batch.set(newMsgRef, messageData);
                batch.set(chatDocRef, {
                    lastMessage: previewText,
                    lastMessageTime: serverTs,
                    lastSenderName: senderName,
                    lastSenderId: uid,
                    updatedAt: serverTs
                }, { merge: true });

                await batch.commit();

                // Despacho asíncrono y seguro de notificaciones a participantes sin bloquear la respuesta de envío
                this.dispatchChatNotifications({
                    chatId,
                    previewText,
                    senderName,
                    uid
                }).catch(err => console.warn("⚠️ [ChatService] Non-blocking notification dispatch notice:", err));

                return { success: true, messageId: newMsgRef.id };
            } catch (e) {
                console.error("❌ Send Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Despacha notificaciones a los participantes del chat según el tipo de canal
         * (General, Evento o Directo 1 a 1), integrado con broadcasts y players/{uid}/notifications.
         * @param {Object} params - { chatId, previewText, senderName, uid }
         */
        async dispatchChatNotifications({ chatId, previewText, senderName, uid }) {
            if (!window.db || !chatId || !uid) return;

            try {
                // Obtener metadatos del canal para determinar tipo y participantes
                let chatData = null;
                try {
                    const chatDocSnap = await window.db.collection('chats').doc(chatId).get();
                    if (chatDocSnap && chatDocSnap.exists) {
                        chatData = chatDocSnap.data() || {};
                    }
                } catch (readErr) {
                    console.warn("[ChatService] Warning fetching chat doc for notifications:", readErr);
                }
                chatData = chatData || {};

                const chatType = chatData.type || (
                    (chatId === 'general_somospadel' || chatId === 'general') ? 'general' :
                    (chatId.startsWith('event_') ? 'event' :
                    (chatId.startsWith('direct_') ? 'direct' : 'standard'))
                );

                const serverTs = getFieldValue().serverTimestamp();

                // 1. Chat General SomosPadel -> Guardar en 'broadcasts' para todos los usuarios
                if (chatId === 'general_somospadel' || chatType === 'general') {
                    const broadcastRef = window.db.collection('broadcasts').doc();
                    await broadcastRef.set({
                        title: `💬 Chat General SomosPadel`,
                        body: `${senderName}: ${previewText}`,
                        timestamp: serverTs,
                        type: 'chat',
                        category: 'chat',
                        chatId: 'general_somospadel',
                        senderId: uid,
                        url: 'chat'
                    });
                    return;
                }

                // 2. Chat de Evento -> Notificar a todos los participantes excepto al emisor
                if (chatType === 'event' || chatId.startsWith('event_')) {
                    const cleanEventId = chatData.eventId || chatId.replace(/^event_/, '');
                    let participants = Array.isArray(chatData.participants) ? [...chatData.participants] : [];

                    // Fallback a AmericanaService si el chat no tenía la lista completa en memoria
                    if (participants.length === 0 && window.AmericanaService && typeof window.AmericanaService.getEventById === 'function') {
                        try {
                            const evt = await window.AmericanaService.getEventById(cleanEventId);
                            if (evt) {
                                const rawParts = evt.participants || evt.players || evt.registeredPlayers || [];
                                participants = rawParts.map(p => typeof p === 'string' ? p : (p?.id || p?.uid || p?.playerId)).filter(Boolean);
                            }
                        } catch (_) {}
                    }

                    const otherParticipants = Array.from(new Set(participants)).filter(pUid => pUid && pUid !== uid);
                    if (otherParticipants.length === 0) return;

                    const eventTitle = chatData.title || chatData.name || null;
                    const notifPayload = {
                        title: `🎾 ${eventTitle || 'Chat de Partido'}`,
                        body: `${senderName}: ${previewText}`,
                        read: false,
                        timestamp: serverTs,
                        type: 'chat',
                        category: 'chat',
                        icon: 'comment-dots',
                        data: {
                            chatId: chatId,
                            eventId: chatData.eventId || cleanEventId || null,
                            chatType: 'event',
                            senderId: uid,
                            senderName: senderName,
                            url: 'chat'
                        }
                    };

                    // Guardado eficiente por lotes (batches de hasta 450 para respetar límite de Firestore)
                    const batchSize = 450;
                    for (let i = 0; i < otherParticipants.length; i += batchSize) {
                        const chunk = otherParticipants.slice(i, i + batchSize);
                        const batch = (typeof window.db.batch === 'function') ? window.db.batch() : null;
                        for (const pUid of chunk) {
                            const notifRef = window.db.collection('players').doc(pUid).collection('notifications').doc();
                            if (batch) {
                                batch.set(notifRef, notifPayload);
                            } else {
                                await notifRef.set(notifPayload);
                            }
                        }
                        if (batch && typeof batch.commit === 'function') {
                            await batch.commit();
                        }
                    }
                    return;
                }

                // 3. Chat Privado 1 a 1 -> Guardar en players/{otherUid}/notifications
                if (chatType === 'direct' || chatId.startsWith('direct_')) {
                    let participants = Array.isArray(chatData.participants) ? [...chatData.participants] : [];
                    if (participants.length === 0 && chatId.startsWith('direct_')) {
                        participants = chatId.replace(/^direct_/, '').split('_');
                    }
                    const otherUid = participants.find(p => p && p !== uid);
                    if (!otherUid) return;

                    const notifRef = window.db.collection('players').doc(otherUid).collection('notifications').doc();
                    await notifRef.set({
                        title: `💬 Mensaje de ${senderName}`,
                        body: previewText,
                        read: false,
                        timestamp: serverTs,
                        type: 'chat',
                        category: 'chat',
                        icon: 'comment-dots',
                        data: {
                            chatId: chatId,
                            chatType: 'direct',
                            senderId: uid,
                            senderName: senderName,
                            url: 'chat'
                        }
                    });
                }
            } catch (err) {
                console.warn("⚠️ [ChatService] Error en dispatchChatNotifications:", err);
            }
        }

        /**
         * Update user's last read timestamp and reset unread counts
         * @param {string} chatId - Target chat document ID
         * @param {string} uid - User unique identifier
         */
        async markChatAsRead(chatId, uid) {
            if (!chatId || !uid) return { success: false, error: 'chatId and uid are required' };

            try {
                const chatDocRef = window.db.collection('chats').doc(chatId);
                await chatDocRef.set({
                    readTimestamps: {
                        [uid]: getFieldValue().serverTimestamp()
                    },
                    unreadCount: {
                        [uid]: 0
                    }
                }, { merge: true });

                return { success: true };
            } catch (e) {
                console.error("❌ markChatAsRead Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Close presence room and cleanup subscriptions
         */
        async closeRoom(chatId) {
            const user = this.getCurrentUser();
            if (user) {
                const uid = user.id || user.uid;
                try {
                    await window.db.collection('chats').doc(chatId).collection('presence').doc(uid).delete();
                } catch (e) { }
            }
            this.unsubscribe();
        }

        /**
         * Delete a single message (Owner or Moderator/Admin/SuperAdmin)
         * @param {string} chatId - Target chat document ID
         * @param {string} messageId - Target message ID
         * @returns {Promise<{ success: boolean, error?: string }>}
         */
        async deleteMessage(chatId, messageId) {
            const user = this.getCurrentUser();
            if (!user) return { success: false, error: 'Unauthorized' };
            const uid = user.id || user.uid;
            if (!uid) return { success: false, error: 'Unauthorized' };

            try {
                const chatRef = window.db.collection('chats').doc(chatId);
                const msgRef = chatRef.collection('messages').doc(messageId);
                const msgSnap = await msgRef.get();

                if (!msgSnap.exists) return { success: true };
                const msgData = msgSnap.data();

                const isModerator = this.hasModerationPrivileges(user);
                const isOwner = msgData.senderId === uid;

                if (!isModerator && !isOwner) {
                    return { success: false, error: 'Solo puedes eliminar tus propios mensajes.' };
                }

                // Borrar por completo de Firestore
                await msgRef.delete();

                // Recalcular el último mensaje si el eliminado era el último o actualizar metadatos
                try {
                    const remainingSnap = await chatRef.collection('messages')
                        .orderBy('timestamp', 'desc')
                        .limit(1)
                        .get();

                    if (!remainingSnap.empty) {
                        const latest = remainingSnap.docs[0].data();
                        let preview = latest.text || '';
                        if (!preview && latest.attachment) {
                            preview = latest.attachmentType === 'audio' ? '🎤 Audio' : '📷 Imagen';
                        }
                        await chatRef.set({
                            lastMessage: preview,
                            lastMessageTime: latest.timestamp || getFieldValue().serverTimestamp(),
                            lastSenderName: latest.senderName || '',
                            lastSenderId: latest.senderId || '',
                            updatedAt: getFieldValue().serverTimestamp()
                        }, { merge: true });
                    } else {
                        // Limpiar campos si no quedan mensajes
                        await chatRef.set({
                            lastMessage: '',
                            lastMessageTime: null,
                            lastSenderName: '',
                            lastSenderId: '',
                            updatedAt: getFieldValue().serverTimestamp()
                        }, { merge: true });
                    }
                } catch (metaErr) {
                    console.warn("[ChatService] Error recalculando metadatos tras borrar mensaje:", metaErr);
                }

                return { success: true };
            } catch (e) {
                console.error("❌ Delete Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Busca jugadores por nombre en la colección 'players' de Firestore.
         * Excluye al propio usuario autenticado de los resultados.
         * @param {string} query - Término de búsqueda (mínimo 2 caracteres)
         * @returns {Promise<Array>} Array de objetos jugador { id, name, photo_url, level, role }
         */
        async searchPlayers(query) {
            const user = this.getCurrentUser();
            const myUid = user ? (user.id || user.uid) : null;
            const q = (query || '').trim().toLowerCase();
            if (q.length < 2) return [];

            try {
                if (!window.db) return [];
                // Firestore no soporta búsqueda full-text, usamos rangos de nombre (case-insensitive workaround)
                const snap = await window.db.collection('players')
                    .where('status', '==', 'active')
                    .orderBy('name')
                    .startAt(q)
                    .endAt(q + '\uf8ff')
                    .limit(15)
                    .get();

                // También buscamos por name en minúsculas si hay campo name_lower
                let results = [];
                snap.docs.forEach(doc => {
                    const d = { id: doc.id, ...doc.data() };
                    if (d.id !== myUid) results.push(d);
                });

                // Fallback: si no devuelve resultados, buscar en un campo 'name_lower' si existe
                if (results.length === 0) {
                    const snapLower = await window.db.collection('players')
                        .where('status', '==', 'active')
                        .orderBy('name_lower')
                        .startAt(q)
                        .endAt(q + '\uf8ff')
                        .limit(15)
                        .get();
                    snapLower.docs.forEach(doc => {
                        const d = { id: doc.id, ...doc.data() };
                        if (d.id !== myUid && !results.find(r => r.id === d.id)) results.push(d);
                    });
                }

                // Normalización del resultado
                return results.map(p => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name || p.displayName || 'Jugador',
                    photo_url: p.photo_url || p.photoURL || p.avatar || null,
                    level: p.level ?? p.self_rate_level ?? null,
                    role: p.role || 'player'
                }));

            } catch (err) {
                console.warn('[ChatService] searchPlayers error:', err.message);
                // Fallback: búsqueda cliente en caché si Firestore falla
                return [];
            }
        }

        /**
         * Delete an entire chat conversation and all its messages
         * @param {string} chatId - Target chat document ID
         * @returns {Promise<{ success: boolean, error?: string }>}
         */
        async deleteChat(chatId) {
            const user = this.getCurrentUser();
            if (!user) return { success: false, error: 'Unauthorized' };
            const uid = user.id || user.uid;
            if (!uid) return { success: false, error: 'Unauthorized' };

            try {
                const chatRef = window.db.collection('chats').doc(chatId);
                const chatSnap = await chatRef.get();
                if (!chatSnap.exists) return { success: true };

                const chatData = chatSnap.data();
                const isAdmin = this.hasModerationPrivileges(user);
                const isParticipant = Array.isArray(chatData.participants) && chatData.participants.includes(uid);

                if (!isAdmin && !isParticipant) {
                    return { success: false, error: 'No tienes permiso para eliminar esta conversación.' };
                }

                // Borrar mensajes de la subcolección
                const msgsSnap = await chatRef.collection('messages').get();
                const batch = window.db.batch();
                msgsSnap.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                // Borrar documento de chat
                batch.delete(chatRef);
                await batch.commit();

                return { success: true };
            } catch (e) {
                console.error("❌ deleteChat Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Toggle SOS Status (Need Partner)
         */
        async toggleSOS(chatId, isActive) {
            const user = this.getCurrentUser();
            if (!user) return;

            const uid = user.id || user.uid;
            const chatRef = window.db.collection('chats').doc(chatId);

            try {
                if (isActive) {
                    await chatRef.set({
                        sos_signals: getFieldValue().arrayUnion({
                            uid: uid,
                            name: user.name || user.displayName || 'Jugador',
                            timestamp: Date.now()
                        })
                    }, { merge: true });
                } else {
                    const doc = await chatRef.get();
                    if (doc.exists) {
                        let signals = doc.data().sos_signals || [];
                        signals = signals.filter(s => s.uid !== uid);
                        await chatRef.update({ sos_signals: signals });
                    }
                }
            } catch (e) {
                console.error("SOS Signal Error:", e);
            }
        }

        /**
         * Listen to SOS signals
         */
        subscribeSOS(chatId, callback) {
            return window.db.collection('chats').doc(chatId)
                .onSnapshot(doc => {
                    callback(doc.exists ? (doc.data().sos_signals || []) : []);
                });
        }

        /**
         * Global unsubscribe for presence and active message stream
         */
        unsubscribe() {
            if (this.activeUnsubscribe) {
                this.activeUnsubscribe();
                this.activeUnsubscribe = null;
            }
            if (this.presenceInterval) {
                clearInterval(this.presenceInterval);
                this.presenceInterval = null;
            }
        }
    }

    window.ChatService = new ChatService();
    console.log("📡 Ops Room Comms & Direct Chat Service Linked (vPro 7.0)");
})();
