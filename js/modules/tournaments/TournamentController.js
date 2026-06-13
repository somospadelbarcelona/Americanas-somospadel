/**
 * TournamentController.js
 */
(function () {
    class TournamentController {
        constructor() {
            this.tournaments = [];
            this.currentFilter = 'all';
            this.currentSort = 'newest'; // Predeterminado: Más actuales primero
        }

        async init() {
            console.log("🏟️ TournamentController Initialized");
            await this.loadTournaments();
        }

        async loadTournaments() {
            try {
                const db = window.db || firebase.firestore();
                // Obtenemos todos los torneos para ordenarlos localmente con precisión cronológica
                const snapshot = await db.collection('tournaments').get();
                const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Seed con torneo oficial si la DB está vacía
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

                // Función inteligente de parseo de fechas para ordenar de verdad cronológicamente
                const parseTournamentDate = (t) => {
                    if (!t || !t.dates) return new Date(0);
                    const dateStr = t.dates.trim();
                    
                    // 1. Intentar patrón dd/mm/yy o dd/mm/yyyy (ej: 05/06/26 o 05/06/2026)
                    const dmyRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
                    const dmyMatch = dateStr.match(dmyRegex);
                    if (dmyMatch) {
                        const day = parseInt(dmyMatch[1], 10);
                        const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
                        let year = parseInt(dmyMatch[3], 10);
                        if (year < 100) year += 2000; // Asumir siglo 21
                        return new Date(year, month, day);
                    }
                    
                    // 2. Intentar patrón de texto con meses (ej: 08 May - 10 May, 12 de Octubre)
                    const monthsMap = {
                        jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5, jul: 6,
                        aug: 7, ago: 7, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11
                    };
                    
                    const textRegex = /(\d{1,2})\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚ]{3,})/i;
                    const textMatch = dateStr.match(textRegex);
                    if (textMatch) {
                        const day = parseInt(textMatch[1], 10);
                        const monthStr = textMatch[2].toLowerCase().substring(0, 3);
                        const month = monthsMap[monthStr] !== undefined ? monthsMap[monthStr] : new Date().getMonth();
                        const yearRegex = /\b(20\d{2})\b/;
                        const yearMatch = dateStr.match(yearRegex);
                        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
                        return new Date(year, month, day);
                    }
                    
                    if (t.createdAt) {
                        if (typeof t.createdAt.toDate === 'function') return t.createdAt.toDate();
                        return new Date(t.createdAt);
                    }
                    
                    return new Date(0);
                };

                // Aplicar ordenamiento cronológico local
                if (this.currentSort === 'newest') {
                    all.sort((a, b) => parseTournamentDate(b) - parseTournamentDate(a)); // Más actual a más antigua
                } else if (this.currentSort === 'oldest') {
                    all.sort((a, b) => parseTournamentDate(a) - parseTournamentDate(b)); // Más antigua a más actual
                }

                this.tournaments = all;

                // Aplicar filtro de estado
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

        changeSort(sortValue) {
            this.currentSort = sortValue;
            this.loadTournaments();
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
