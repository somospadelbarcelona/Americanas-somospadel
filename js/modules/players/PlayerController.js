/**
 * PlayerController.js (Global Version)
 */
(function () {
    class PlayerController {
        constructor() {
            this.state = {
                currentMatch: null
            };
            if (window.Store) {
                window.Store.subscribe('currentUser', (user) => {
                    if (user) this.fetchPlayerData(user);
                });
            }
        }

        fetchPlayerData(user) {
            // Mock Data
            this.state.currentMatch = {
                id: 101,
                court: "Pista 5",
                time: "19:00",
                partner: { name: "Alex Galán", level: 4.5 },
                opponents: [],
                status: "scheduled"
            };
            if (window.Store) window.Store.setState('playerData', this.state);
        }
    }

    window.PlayerController = new PlayerController();
    console.log("📱 PlayerController Global Loaded");
})();
