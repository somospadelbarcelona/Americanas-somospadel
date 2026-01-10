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

        async addPlayer(americanaId, user, type = 'americana') {
            try {
                // Determine which collection service to use
                const service = (type === 'entreno') ? window.createService('entrenos') : this.db;

                if (!service) throw new Error("Servicio de base de datos no disponible");

                const event = await service.getById(americanaId);
                if (!event) throw new Error("Evento no encontrado (" + type + ")");

                // Check BOTH arrays for legacy/current compatibility
                const players = event.players || [];
                const regPlayers = event.registeredPlayers || [];

                // Unified check for existing UID
                const exists = (players.find(p => p.uid === user.uid || p.id === user.uid)) ||
                    (regPlayers.find(p => p.uid === user.uid || p.id === user.uid));

                if (exists) {
                    throw new Error("Ya estás inscrito en este evento.");
                }

                // GENDER CHECK
                const userGender = user.gender || 'M';
                const cat = event.category || 'open';

                if (cat === 'male' && userGender !== 'M' && userGender !== 'chico') {
                    throw new Error("Este evento es exclusivo para categoría MASCULINA.");
                }
                if (cat === 'female' && userGender !== 'F' && userGender !== 'chica') {
                    throw new Error("Este evento es exclusivo para categoría FEMENINA.");
                }

                const newPlayerData = {
                    id: user.uid,
                    uid: user.uid,
                    name: user.name || user.displayName || user.email || 'Jugador',
                    level: user.level || user.self_rate_level || '3.5',
                    joinedAt: new Date().toISOString()
                };

                players.push(newPlayerData);

                // USE THE CORRECT SERVICE (Americanas or Entrenos)
                await service.update(americanaId, {
                    players: players,
                    registeredPlayers: players // Sync both
                });

                // --- NOTIFICATIONS (DISABLED BY REQUEST) ---
                // this.notifyAdminOfRegistration(event, user);

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
            // const win = window.open(waLink, '_blank');
        }

        async removePlayer(americanaId, userId, type = 'americana') {
            try {
                const service = (type === 'entreno') ? window.createService('entrenos') : this.db;
                if (!service) throw new Error("Servicio de base de datos no disponible");

                const event = await service.getById(americanaId);
                if (!event) throw new Error("Evento no encontrado");

                const players = event.registeredPlayers || [];
                const newPlayers = players.filter(p => p.uid !== userId);

                await service.update(americanaId, {
                    registeredPlayers: newPlayers,
                    players: newPlayers // Sync both
                });
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
