/**
 * ChatService.js
 * Secure Communication Protocol for Event Operations.
 * Handles real-time messaging, SOS signals, and admin broadcasts.
 */
(function () {
    class ChatService {
        constructor() {
            this.activeUnsubscribe = null;
        }

        /**
         * Subscribe to an event's chat channel
         */
        subscribe(eventId, callback) {
            if (this.activeUnsubscribe) this.activeUnsubscribe();

            // Listen to messages ordered by time
            this.activeUnsubscribe = window.db.collection('chats')
                .doc(eventId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .limit(100)
                .onSnapshot(snapshot => {
                    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(messages);
                }, error => {
                    console.error("📡 [Chat Comms Lost]", error);
                });
        }

        /**
         * Send a tactical message
         */
        async sendMessage(eventId, text) {
            const user = window.Store.getState('currentUser');
            if (!user) return { success: false, error: 'Unauthorized' };

            try {
                const isAdmin = (user.role === 'admin' || user.role === 'admin_player');

                await window.db.collection('chats').doc(eventId).collection('messages').add({
                    text: text,
                    senderId: user.id || user.uid,
                    senderName: user.name,
                    senderAvatar: user.photo_url || null,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    type: isAdmin ? 'admin' : 'standard',
                    isAdmin: isAdmin
                });
                return { success: true };
            } catch (e) {
                console.error("❌ Send Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Delete a message (Admin only)
         */
        async deleteMessage(eventId, messageId) {
            try {
                await window.db.collection('chats').doc(eventId).collection('messages').doc(messageId).delete();
                return { success: true };
            } catch (e) {
                console.error("❌ Delete Failed:", e);
                return { success: false, error: e.message };
            }
        }

        /**
         * Toggle SOS Status (Need Partner)
         * This updates the main chat document, not a message
         */
        async toggleSOS(eventId, isActive) {
            const user = window.Store.getState('currentUser');
            if (!user) return;

            const chatRef = window.db.collection('chats').doc(eventId);

            try {
                if (isActive) {
                    await chatRef.set({
                        sos_signals: firebase.firestore.FieldValue.arrayUnion({
                            uid: user.id || user.uid,
                            name: user.name,
                            timestamp: Date.now()
                        })
                    }, { merge: true });
                } else {
                    // Remove is harder in arrays with objects, we might need to read-modify-write
                    // For simplicity in V1, we'll try arrayRemove if exact match, or just read/filter/write
                    // Let's use a subcollection for active SOS if arrays get tricky, simpler.
                    // Actually, let's use a specific 'sos_active' active list.

                    // Simple approach: Read, Filter, Write
                    const doc = await chatRef.get();
                    if (doc.exists) {
                        let signals = doc.data().sos_signals || [];
                        signals = signals.filter(s => s.uid !== (user.id || user.uid));
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
        subscribeSOS(eventId, callback) {
            return window.db.collection('chats').doc(eventId)
                .onSnapshot(doc => {
                    callback(doc.exists ? (doc.data().sos_signals || []) : []);
                });
        }

        unsubscribe() {
            if (this.activeUnsubscribe) {
                this.activeUnsubscribe();
                this.activeUnsubscribe = null;
            }
        }
    }

    window.ChatService = new ChatService();
    console.log("📡 Ops Room Comms Linked");
})();
