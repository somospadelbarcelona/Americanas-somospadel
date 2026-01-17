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

        // Header Decoration
        let headerTitle = 'ENTRENO';
        let headerEmoji = '🎾';

        if (isMale) { headerEmoji = '🎾🚹'; headerTitle = 'ENTRENO MASCULINO'; }
        else if (isFemale) { headerEmoji = '🎾🚺'; headerTitle = 'ENTRENO FEMENINO'; }
        else if (isMixed) { headerEmoji = '🎾🚻'; headerTitle = 'ENTRENO MIXTO'; }

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? ` - ${event.time_end}` : '';
        const location = event.location || 'Pista por asignar';

        // Calculate spots
        const players = event.players || [];
        const maxPlayers = (event.max_courts || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        // EXTRA for Mixed: Gender Count
        let mixedStats = '';
        if (isMixed && richPlayers) {
            const males = richPlayers.filter(p => {
                const g = (p.gender || '').toLowerCase();
                return g === 'male' || g === 'chico' || g === 'hombre' || g === 'masculino';
            }).length;
            const females = richPlayers.filter(p => {
                const g = (p.gender || '').toLowerCase();
                return g === 'female' || g === 'chica' || g === 'mujer' || g === 'femenino';
            }).length;

            if (males + females > 0) {
                mixedStats = `⚖️ *Balance:* 🚹 ${males}  -  🚺 ${females}\n\n`;
            }
        }

        // Status Line
        let statusLine = '';
        if (spotsLeft === 0) statusLine = '🔴 *COMPLETO* (Apúntate a lista de espera)';
        else if (spotsLeft <= 4) statusLine = `⚠️ *¡ÚLTIMAS ${spotsLeft} PLAZAS!*`;
        else statusLine = `🟢 *${spotsLeft} PLAZAS LIBRES*`;

        // --- BUILD MESSAGE ---
        let msg = `✨ ${headerEmoji} *${headerTitle}* ${headerEmoji} ✨\n`;
        msg += `➖➖➖➖➖➖➖➖➖➖\n`;
        msg += `📅 *Fecha:* ${dateStr}\n`;
        msg += `⏰ *Hora:* ${timeStr}${endTimeStr}\n`;
        msg += `📍 *Lugar:* ${location}\n`;
        msg += `➖➖➖➖➖➖➖➖➖➖\n\n`;

        msg += `${statusLine}\n\n`;
        if (mixedStats) msg += mixedStats;

        msg += `👥 *JUGADORES INSCRITOS (${players.length}/${maxPlayers}):*\n`;

        if (players.length === 0) {
            msg += `_Todavía nadie... ¡Sé el primero!_ 🚀\n`;
        } else {
            const displayList = richPlayers || players;
            displayList.forEach((p, index) => {
                let pName = p.name ? p.name.trim() : 'Jugador';

                // Extra Info icons
                const team = p.team_somospadel || p.team || ''; // Try to find team
                const teamStr = Array.isArray(team) ? team[0] : team; // Take first team if multiple
                const level = p.level || p.playtomic_level || '?.?';

                // Gender Icon for Mixed
                let genderIcon = '';
                if (isMixed && p.gender) {
                    const g = (p.gender || '').toLowerCase();
                    if (g === 'male' || g === 'chico' || g === 'hombre' || g === 'masculino') genderIcon = '🚹 ';
                    else if (g === 'female' || g === 'chica' || g === 'mujer' || g === 'femenino') genderIcon = '🚺 ';
                }

                // Helpers for formatting
                const parts = [];
                // Team with Shield
                if (teamStr) parts.push(`🛡️ ${teamStr.toUpperCase()}`);
                // Level with Lightning
                if (level) parts.push(`⚡ N${level}`);

                // Construct line
                // 1️⃣ Name (Team - Level)
                const numberIcon = this._getNumberEmoji(index + 1);
                const extras = parts.length > 0 ? ` (${parts.join(' - ')})` : '';

                msg += `${numberIcon} ${genderIcon}${pName}${extras}\n`;
            });
        }

        msg += `\n👇 *INSCRÍBETE AQUÍ:*\n`;
        msg += `🔗 https://somospadelbarcelona.github.io/Americanas-somospadel/#entrenos\n`;

        return msg;
    },

    // Helper for number emojis
    _getNumberEmoji(num) {
        const digitMap = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
        // Special 10 emoji
        if (num === 10) return '🔟';

        return num.toString().split('').map(d => digitMap[parseInt(d)]).join('');
    },

    /**
     * Opens WhatsApp with the pre-filled message
     * @param {object} event 
     */
    async shareStartFromAdmin(event) {
        try {
            console.log("📤 Generating WhatsApp for:", event.name);

            // Fetch rich data for players to show Team & Gender
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
                            gender: user ? user.gender : null, // FETCH GENDER
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
