/**
 * WhatsAppService.js
 * Service to generate professional WhatsApp messages for events.
 * Handles formatting, emojis, and deep linking.
 */

window.WhatsAppService = {

    /**
     * Generates a formatted message for an event
     * @param {object} event 
     * @returns {string} Formatted textual message
     */
    /**
     * Generates a formatted message for an event
     * @param {object} event 
     * @param {Array} richPlayers - Optional list of players with full details (team, etc)
     * @returns {string} Formatted textual message
     */
    generateMessage(event, richPlayers = null) {
        if (!event) return '';

        const type = (event.category || 'open').toLowerCase();
        const isMale = type === 'male' || type === 'masculina';
        const isFemale = type === 'female' || type === 'femenina';
        const isMixed = type === 'mixed' || type === 'mixto' || type === 'mixta';

        // Emojis based on category
        let headerEmoji = '🎾';
        if (isMale) headerEmoji = '🎾🚹';
        if (isFemale) headerEmoji = '🎾🚺';
        if (isMixed) headerEmoji = '🎾🚻';

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const location = event.location || 'Pista por asignar';

        // Calculate spots
        const players = event.players || [];
        const maxPlayers = (event.max_courts || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        // Status Line
        let statusLine = '';
        if (spotsLeft === 0) statusLine = '🔴 *COMPLETO* (Apúntate a lista de espera)';
        else if (spotsLeft <= 4) statusLine = `⚠️ *¡ÚLTIMAS ${spotsLeft} PLAZAS!*`;
        else statusLine = `🟢 *${spotsLeft} PLAZAS LIBRES*`;

        // Build Message
        // Translate category
        let catDisplay = (event.category || 'OPEN').toUpperCase();
        if (catDisplay === 'MALE') catDisplay = 'MASCULINO';
        if (catDisplay === 'FEMALE') catDisplay = 'FEMENINO';
        if (catDisplay === 'MIXED') catDisplay = 'MIXTO';

        let msg = `${headerEmoji} *ENTRENO ${catDisplay}*\n`;
        msg += `📅 ${dateStr} - ${timeStr}\n`;
        msg += `📍 ${location}\n\n`;
        msg += `${statusLine}\n\n`;

        msg += `*JUGADORES INSCRITOS (${players.length}/${maxPlayers}):*\n`;

        if (players.length === 0) {
            msg += `_Todavía nadie... ¡Sé el primero!_ 🚀\n`;
        } else {
            // Use richPlayers if provided, otherwise fallback to basic event.players
            const displayList = richPlayers || players;

            displayList.forEach((p, index) => {
                // Name
                let pName = p.name ? p.name.trim() : 'Jugador';

                // Extra Info
                const team = p.team_somospadel || p.team || ''; // Try to find team
                const teamStr = Array.isArray(team) ? team[0] : team; // Take first team if multiple
                const level = p.level || p.playtomic_level || '?.?';

                // Time
                let time = '';
                if (p.joinedAt) {
                    try {
                        const d = new Date(p.joinedAt);
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const hh = String(d.getHours()).padStart(2, '0');
                        const min = String(d.getMinutes()).padStart(2, '0');
                        time = `${dd}/${mm} ${hh}:${min}`;
                    } catch (e) { }
                }

                // Format: 1. Name (Team - Nivel X - Time)
                // Filter out empty parts
                const extras = [];
                if (teamStr) extras.push(teamStr.toUpperCase());
                if (level) extras.push(`N${level}`);
                if (time) extras.push(time);

                const extraStr = extras.length > 0 ? ` (${extras.join(' - ')})` : '';

                msg += `${index + 1}. ${pName}${extraStr}\n`;
            });
        }

        msg += `\n📲 *Inscríbete en la App:* https://somospadelbarcelona.github.io/Americanas-somospadel/#entrenos\n`;

        return msg;
    },

    /**
     * Opens WhatsApp with the pre-filled message
     * @param {object} event 
     */
    async shareStartFromAdmin(event) {
        try {
            console.log("📤 Generating WhatsApp for:", event.name);

            // Fetch rich data for players to show Team
            let richPlayers = null;
            if (event.players && event.players.length > 0) {
                try {
                    const allUsers = await window.FirebaseDB.players.getAll();
                    richPlayers = event.players.map(p => {
                        const user = allUsers.find(u => (u.id === p.id) || (u.uid === p.id));
                        // Prefer fresh user level, fallback to event stored level
                        const freshLevel = user ? (user.level || user.self_rate_level || p.level) : p.level;
                        return {
                            ...p,
                            team: user ? (user.team_somospadel || user.team || '') : '',
                            level: freshLevel,
                            // Ensure we preserve joinedAt from the event player object, not the user profile
                            joinedAt: p.joinedAt
                        };
                    });
                } catch (err) {
                    console.warn("Could not fetch rich player data, using basic data", err);
                }
            }

            const text = this.generateMessage(event, richPlayers);
            const encodedText = encodeURIComponent(text);

            // Use api.whatsapp.com for ensuring it works on Desktop and Mobile universally
            const url = `https://api.whatsapp.com/send?text=${encodedText}`;

            window.open(url, '_blank');
        } catch (e) {
            console.error("Error sharing to WhatsApp:", e);
            alert("Error al generar enlace de WhatsApp");
        }
    },

    /**
     * Helper to format simple string date YYYY-MM-DD to DD/MM
     */
    _formatDate(dateString) {
        if (!dateString) return '';
        try {
            const [y, m, d] = dateString.split('-');
            return `${d}/${m}`;
        } catch (e) { return dateString; }
    }
};

console.log("💬 WhatsAppService Loaded");
