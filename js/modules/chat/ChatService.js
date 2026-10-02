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
         * Helper to get current authenticated user safely from Store or Firebase Auth
         */
        getCurrentUser() {
            if (window.Store && typeof window.Store.getState === 'function') {
                const user = window.Store.getState('currentUser');
                if (user) return user;
            }
            if (window.auth && window.auth.currentUser) {
                const fbUser = window.auth.currentUser;
                return {
                    id: fbUser.uid,
                    uid: fbUser.uid,
                    name: fbUser.displayName || 'Jugador',
                    photo_url: fbUser.photoURL || null
                };
            }
            return null;
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
                const isAdmin = (user.role === 'admin' || user.role === 'admin_player');
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

                return { success: true, messageId: newMsgRef.id };
            } catch (e) {
                console.error("❌ Send Failed:", e);
                return { success: false, error: e.message };
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
         * Delete a message (Admin only)
         */
        async deleteMessage(chatId, messageId) {
            try {
                await window.db.collection('chats').doc(chatId).collection('messages').doc(messageId).delete();
                return { success: true };
            } catch (e) {
                console.error("❌ Delete Failed:", e);
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
