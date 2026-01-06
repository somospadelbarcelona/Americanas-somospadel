/**
 * AgendaController.js
 */
(function () {
    class AgendaController {
        constructor() {
            this.db = window.FirebaseDB;
        }

        async init() {
            console.log("[AgendaController] Initializing...");
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) return Router.navigate('dashboard');

            try {
                const americanas = await this.db.americanas.getAll();

                // Filter events where user is registered
                const myEvents = americanas.filter(a =>
                    a.players && a.players.includes(user.id) ||
                    a.registeredPlayers && a.registeredPlayers.includes(user.id)
                );

                // Featured events (open and not joined)
                const upcoming = americanas.filter(a =>
                    a.status === 'open' &&
                    !(a.players && a.players.includes(user.id))
                ).slice(0, 3);

                if (window.AgendaView) {
                    window.AgendaView.render(myEvents, upcoming);
                }
            } catch (error) {
                console.error("Error loading agenda:", error);
            }
        }
    }

    window.AgendaController = new AgendaController();
    console.log("🗓️ AgendaController Initialized");
})();
