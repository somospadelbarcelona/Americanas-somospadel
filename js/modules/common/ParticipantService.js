/**
 * ParticipantService.js
 * Centralized logic for managing players in events (Americanas & Entrenos).
 * Handles: Adding, Removing, Waitlist Promotion, and Validation.
 */

window.ParticipantService = {

    /**
     * Add a player to an event
     * @param {string} eventId 
     * @param {string} eventType - 'americana' or 'entreno'
     * @param {object} player - User object from DB
     * @returns {Promise<object>} Updated player list result
     */
    async addPlayer(eventId, eventType, player) {
        if (!eventId || !player) throw new Error("Invalid parameters");

        const collectionName = eventType === AppConstants.EVENT_TYPES.AMERICANA ? 'americanas' : 'entrenos';
        const docRef = db.collection(collectionName).doc(eventId);

        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) throw new Error("Event not found");

            const event = doc.data();
            const maxPlayers = (event.max_courts || 4) * 4;
            let players = event.players || [];
            let waitlist = event.waitlist || [];

            const targetId = player.id || player.uid;
            if (!targetId) throw new Error("Player object has no ID or UID");

            // Check if already in participants or waitlist
            if (players.some(p => String(p.id || p.uid) === String(targetId))) {
                throw new Error("Player already enrolled");
            }
            if (waitlist.some(p => String(p.id || p.uid) === String(targetId))) {
                throw new Error("Player already in waitlist");
            }

            const newPlayer = {
                id: targetId,
                uid: targetId,
                name: (player.name || player.displayName || 'JUGADOR').toUpperCase(),
                level: parseFloat(player.level || player.playtomic_level || player.self_rate_level || 3.5),
                gender: player.gender || '?',
                photoURL: player.photoURL || player.photo_url || null,
                joinedAt: new Date().toISOString()
            };

            if (players.length < maxPlayers) {
                players.push(newPlayer);
                transaction.update(docRef, {
                    players,
                    registeredPlayers: players
                });

                // Trigger Intelligent Substitution if live (Safe to run after transaction)
                this._handleLiveSubstitution(eventId, eventType, event.status, newPlayer);

                return { status: 'enrolled', count: players.length };
            } else {
                waitlist.push(newPlayer);
                transaction.update(docRef, { waitlist });
                return { status: 'waitlist', position: waitlist.length };
            }
        });
    },

    // Helper to keep addPlayer clean
    async _handleLiveSubstitution(eventId, eventType, status, newPlayer) {
        if (['live', 'en_juego', 'in_game'].includes(status)) {
            if (window.MatchmakingService && window.MatchmakingService.substitutePlayerInMatchesRobust) {
                const aliases = ['VACANT', '🔴 VACANTE', 'VACANTE'];
                for (const alias of aliases) {
                    await window.MatchmakingService.substitutePlayerInMatchesRobust(
                        eventId, 'vacante_id', alias, newPlayer.id, newPlayer.name, eventType
                    );
                }
            }
        }
    },

    /**
     * Remove a player from an event.
     * Uses a direct get+update (2 ops) instead of a transaction to avoid Quota Exceeded errors.
     */
    async removePlayer(eventId, eventType, playerId, skipPromotion = false) {
        if (!eventId || !playerId) throw new Error("Invalid parameters");

        const collectionName = eventType === AppConstants.EVENT_TYPES.AMERICANA ? 'americanas' : 'entrenos';
        const docRef = db.collection(collectionName).doc(eventId);

        // --- DIRECT READ (1 op) ---
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("Event not found");

        const event = doc.data();
        let players = [...(event.players || [])];
        let waitlist = [...(event.waitlist || [])];
        let fixedPairs = [...(event.fixed_pairs || [])];

        const playerIndex = players.findIndex(p => String(p?.id || p?.uid || '') === String(playerId));

        let removed = null;

        if (playerIndex === -1) {
            // Not in main list — check waitlist
            const wIndex = waitlist.findIndex(p => String(p?.id || p?.uid || '') === String(playerId));
            if (wIndex !== -1) {
                removed = waitlist.splice(wIndex, 1)[0];
                // --- DIRECT WRITE (1 op) ---
                await docRef.update({ waitlist });
                return { removed, status: 'removed_from_waitlist' };
            }
            throw new Error("Jugador no encontrado en el evento");
        }

        // Remove from main list
        removed = players.splice(playerIndex, 1)[0];

        // Cleanup Fixed Pairs referencing this player
        fixedPairs = fixedPairs.filter(pair => {
            const p1Id = String(pair?.player1?.id || pair?.player1?.uid || '');
            const p2Id = String(pair?.player2?.id || pair?.player2?.uid || '');
            return p1Id !== String(playerId) && p2Id !== String(playerId);
        });

        // Also clean partner_id/partner_name from remaining players
        players = players.map(p => {
            if (String(p.partner_id) === String(playerId)) {
                const updated = { ...p };
                delete updated.partner_id;
                delete updated.partner_name;
                return updated;
            }
            return p;
        });

        // Promote from waitlist (optional)
        let promoted = null;
        const maxPlayers = (event.max_courts || 4) * 4;
        if (!skipPromotion && players.length < maxPlayers && waitlist.length > 0) {
            promoted = waitlist.shift();
            if (promoted && !promoted.level) promoted.level = 3.5;
            players.push(promoted);
        }

        // --- DIRECT WRITE (1 op) ---
        await docRef.update({
            players,
            registeredPlayers: players,
            fixed_pairs: fixedPairs,
            waitlist
        });

        // Post-write: substitute in live matches (async, non-blocking)
        if (['live', 'en_juego', 'in_game'].includes(event.status)) {
            this._handlePlayerExitSubstitution(eventId, eventType, removed, promoted);
        }

        return { removed, promoted };
    },

    async _handlePlayerExitSubstitution(eventId, eventType, removed, promoted) {
        if (window.MatchmakingService && window.MatchmakingService.substitutePlayerInMatchesRobust) {
            const oldUid = removed.id || removed.uid;
            const newUid = promoted ? (promoted.id || promoted.uid) : 'vacante_id';
            const newName = promoted ? promoted.name : 'VACANTE';

            await window.MatchmakingService.substitutePlayerInMatchesRobust(
                eventId, oldUid, removed.name, newUid, newName, eventType
            );
        }
    },

    /**
     * Manually promote next player from waitlist
     */
    async promoteNext(eventId, eventType) {
        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);

        let waitlist = event.waitlist || [];
        if (waitlist.length === 0) return null;

        const promoted = waitlist.shift();
        if (promoted && !promoted.level) promoted.level = 3.5; // Ensure level
        const players = event.players || [];
        players.push(promoted);

        await collection.update(eventId, {
            players,
            waitlist,
            registeredPlayers: players
        });

        return promoted;
    },

    /**
     * Get Waitlist
     */
    async getWaitlist(eventId, eventType) {
        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);
        return event.waitlist || [];
    }
};
console.log("🚀 ParticipantService Loaded");
