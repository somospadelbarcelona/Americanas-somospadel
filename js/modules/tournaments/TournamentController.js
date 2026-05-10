/**
 * TournamentController.js
 */
(function () {
    class TournamentController {
        constructor() {
            this.tournaments = [];
            this.currentFilter = 'all';
        }

        async init() {
            console.log("🏟️ TournamentController Initialized");
            await this.loadTournaments();
        }

        async loadTournaments() {
            try {
                const db = window.db || firebase.firestore();
                const snapshot = await db.collection('tournaments').orderBy('dates', 'desc').get();
                const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Seed with official tournament if DB is empty
                if (all.length === 0) {
                    all.push({
                        id: 'seed-siux-11',
                        title: '11º ANIVERSARIO SIUX EVEN PADEL TOUR',
                        poster: 'https://img.freepik.com/vector-premium/cartel-torneo-padel_1284-41144.jpg',
                        category: 'Torneo Challenger',
                        location: 'Padelarium',
                        dates: '08 May - 10 May',
                        status: 'En juego!',
                        link: '#'
                    });
                }

                this.tournaments = all;

                // Apply Status Filter
                let filtered = all;
                if (this.currentFilter !== 'all') {
                    filtered = all.filter(t => t.status === this.currentFilter);
                }

                if (window.TournamentView) {
                    window.TournamentView.render(filtered);
                }
            } catch (e) {
                console.error("Error loading tournaments from Firebase:", e);
                if (window.TournamentView) window.TournamentView.render([]);
            }
        }

        filterByStatus(status, btn) {
            this.currentFilter = status;
            this.loadTournaments();
        }

        shareTournament(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (!t) return;
            
            const text = `🎾 *TORNEO SOMOSPADEL* 🎾\n\n🏆 *${t.title}*\n📍 ${t.location}\n📅 ${t.dates}\n🏷️ ${t.category}\n\n🔥 ¡Apúntate ya aquí! 👇\n${window.location.origin}/#tournaments`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }

        handleSearch(query) {
            if (window.TournamentView) {
                window.TournamentView.searchTerm = query;
                this.loadTournaments();
            }
        }

        showDetails(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (t && t.link && t.link !== '#') {
                window.open(t.link, '_blank');
            } else {
                console.log("No link for tournament:", id);
            }
        }
    }

    // Initialize and expose
    window.TournamentController = new TournamentController();
    console.log("✅ TournamentController fully loaded with filterByStatus");
})();
