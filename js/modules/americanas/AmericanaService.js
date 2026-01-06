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
