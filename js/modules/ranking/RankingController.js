/**
 * RankingController.js
 */
(function () {
    class RankingController {
        constructor() {
            this.db = window.FirebaseDB;
        }

        async init() {
            console.log("[RankingController] Initializing...");
            const content = document.getElementById('content-area');
            if (content) {
                content.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:60vh;"><div class="loader"></div></div>';
            }

            try {
                const players = await this.db.players.getAll();

                // Sort by level descending
                const sortedPlayers = players.sort((a, b) => {
                    const levA = parseFloat(a.level || a.self_rate_level || 0);
                    const levB = parseFloat(b.level || b.self_rate_level || 0);
                    return levB - levA;
                });

                if (window.RankingView) {
                    window.RankingView.render(sortedPlayers);
                }
            } catch (error) {
                console.error("Error loading ranking:", error);
                if (content) {
                    content.innerHTML = `<div style="padding:40px; text-align:center;">Error al cargar el ranking: ${error.message}</div>`;
                }
            }
        }
    }

    window.RankingController = new RankingController();
    console.log("🎮 RankingController Initialized");
})();
