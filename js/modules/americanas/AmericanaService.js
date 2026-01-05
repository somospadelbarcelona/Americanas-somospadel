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

                const players = americana.registeredPlayers || [];
                // Check duplicate
                if (players.find(p => p.uid === user.uid)) {
                    throw new Error("Ya estás inscrito en este evento.");
                }

                players.push({
                    uid: user.uid,
                    name: user.displayName || user.email,
                    level: user.level || 'N/A',
                    joinedAt: new Date().toISOString()
                });

                await this.db.update(americanaId, { registeredPlayers: players });
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
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
