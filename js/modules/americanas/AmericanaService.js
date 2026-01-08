/**
 * AmericanaService.js (Global Version)
 */
(function () {
    class AmericanaService {
        constructor() {
            // Wait for createService to be available
            if (window.createService) {
                this.db = window.createService('americanas');
            } else {
                // Retry or defer
                setTimeout(() => {
                    if (window.createService) this.db = window.createService('americanas');
                }, 100);
            }
        }

        async getActiveAmericanas() {
            try {
                if (!this.db) return [];
                const all = await this.db.getAll();
                // Return all for now, sorted by date/time?
                // Ideally sort by date ASC
                return all
                    .filter(a => a.status !== 'finished')
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            } catch (error) {
                console.error("Error fetching active americanas:", error);
                return [];
            }
        }

        async addPlayer(americanaId, user) {
            try {
                const americana = await this.db.getById(americanaId);
                if (!americana) throw new Error("Evento no encontrado");

                // Check BOTH arrays for legacy/current compatibility
                const players = americana.players || [];
                const regPlayers = americana.registeredPlayers || [];

                // Unified check for existing UID
                const exists = (players.find(p => p.uid === user.uid || p.id === user.uid)) ||
                    (regPlayers.find(p => p.uid === user.uid || p.id === user.uid));

                if (exists) {
                    throw new Error("Ya estás inscrito en este evento.");
                }

                // CAPACITY CHECK - DISABLED FOR DYNAMIC SCALING
                // We now allow unlimited registrations, courts will scale automatically.
                // const maxPlayers = (americana.max_courts || 0) * 4;
                // if (players.length >= maxPlayers) {
                //    throw new Error("Lo sentimos, este evento ya está completo.");
                // }

                // GENDER CHECK
                const userGender = user.gender || 'M'; // Default to M if unknown, ideally fetch from profile
                if (americana.category === 'male' && userGender !== 'M') {
                    throw new Error("Este torneo es exclusivo para categoría MASCULINA.");
                }
                if (americana.category === 'female' && userGender !== 'F') {
                    throw new Error("Este torneo es exclusivo para categoría FEMENINA.");
                }

                const newPlayerData = {
                    id: user.uid,
                    uid: user.uid,
                    name: user.name || user.displayName || user.email || 'Jugador',
                    level: user.level || user.self_rate_level || '3.5',
                    joinedAt: new Date().toISOString()
                };

                players.push(newPlayerData);

                await this.db.update(americanaId, {
                    players: players,
                    registeredPlayers: players // Sync both
                });

                // --- NOTIFICATIONS ---
                this.notifyAdminOfRegistration(americana, user);

                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        notifyAdminOfRegistration(evt, user) {
            // "cuando el jugador se apunta a la americana necesito que automaticamente me llege un mensaje de confirmación al admin"
            const adminPhone = "34649219350"; // Based on admin.js master user
            const msg = `🎾 *NUEVA INSCRIPCIÓN* %0A%0A👤 Jugador: ${user.name} %0A🏆 Evento: ${evt.name} %0A📅 Fecha: ${evt.date} ${evt.time}`;

            // "y al jugaror que le llege tambien una notificacion de que se ha apuntado por whats app"
            // To automate this from client side without user clicking is hard, but we can open one for the ADMIN to see.
            // Ideally, the user sees a "Success" screen with a button "RECIBIR CONFIRMACIÓN" to chat with self or bot.

            // For now, we attempt to open the Admin notification in background or new tab if allowed, 
            // OR allow the user to send it.
            // Since the user asked for "automatic", and we are client-side:
            console.log("🔔 Notifying Admin via WA Link generation...");

            // We can't auto-send. We can only prep result.
            // Let's rely on the Admin Panel 'CHAT' buttons for manual follow up if needed, 
            // BUT here we can try `window.open` if context allows, though it might be blocked.

            const waLink = `https://wa.me/${adminPhone}?text=${msg}`;

            // Hack: Trigger a tiny popup or just console log if we can't force it.
            // A clearer UX is alerting the user "Inscripción Correcta. Avisando al admin..."
            const win = window.open(waLink, '_blank');
        }

        async removePlayer(americanaId, userId) {
            try {
                const americana = await this.db.getById(americanaId);
                if (!americana) throw new Error("Evento no encontrado");

                const players = americana.registeredPlayers || [];
                const newPlayers = players.filter(p => p.uid !== userId);

                await this.db.update(americanaId, { registeredPlayers: newPlayers });
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        async createAmericana(data) {
            if (!data.name || !data.date) throw new Error("Invalid Americana Data");
            return await this.db.create({
                ...data,
                status: 'draft',
                registeredPlayers: []
            });
        }
    }

    window.AmericanaService = new AmericanaService();
    console.log("🏆 AmericanaService Global Loaded");
})();
