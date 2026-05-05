/**
 * JornadasController.js - Manages Global Calendar Logic
 */
(function () {
    class JornadasController {
        constructor() {
            this.teams = [];
        }

        init() {
            console.log("📅 [JornadasController] Initializing...");
            this.teams = window.ClubTeamsData || [];
            this.render();
        }

        render() {
            if (window.JornadasView) {
                window.JornadasView.render(this.teams);
            }
        }
    }

    window.JornadasController = new JornadasController();
})();
