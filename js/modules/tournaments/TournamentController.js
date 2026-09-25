/**
 * TournamentController.js - v2.0 Enterprise Pro
 * Gestión integral del circuito de torneos de SomosPadel BCN
 */
(function () {
    class TournamentController {
        constructor() {
            this.tournaments = [];
            this.currentFilter = 'all'; // 'all' | 'Abiertas' | 'En juego!' | 'Próximamente' | 'Finalizado'
            this.currentCategoryFilter = 'all'; // 'all' | 'masculina' | 'femenina' | 'mixta' | 'universal'
            this.currentSort = 'newest'; // 'newest' | 'oldest'
            this.viewMode = 'cards'; // 'cards' | 'timeline'
            this.searchTerm = '';
        }

        async init() {
            console.log("🏟️ [TournamentController] Inicializando motor Pro...");
            await this.loadTournaments();
        }

        async loadTournaments() {
            try {
                const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
                let all = [];

                if (db) {
                    const snapshot = await db.collection('tournaments').get();
                    all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                // Si no hay torneos o falla la DB, inicializamos con torneos oficiales de muestra representativos
                if (!all || all.length === 0) {
                    all = [
                        {
                            id: 'torneo-cem-hospitalet',
                            title: 'TORNEO CEM HOSPITALET SOMOSPADEL',
                            poster: 'https://images.unsplash.com/photo-1592910129881-891178e4820c?auto=format&fit=crop&q=80&w=800',
                            category: 'Masculina (3ª y 4ª), Femenino (4ª) y Mixto',
                            location: 'CEM Hospitalet, Barcelona',
                            dates: '05/06/2026 y 06/06/2026',
                            status: 'Abiertas',
                            link: 'https://somospadelbarcelona.com',
                            prize: 'Palas Siux + Trofeos + Lote Material',
                            welcomePack: 'Camiseta técnica + Overgrip + Bebida energética',
                            rankingPoints: 350,
                            description: 'Gran torneo de fin de semana con fase previa de grupos garantizando mínimo 3 partidos y fase eliminatoria principal y consolación.'
                        },
                        {
                            id: 'torneo-siux-anniversary',
                            title: '11º ANIVERSARIO SIUX EVEN PADEL TOUR',
                            poster: 'https://img.freepik.com/vector-premium/cartel-torneo-padel_1284-41144.jpg',
                            category: 'Challenger 2ª, 3ª y 4ª Masculina y Femenina',
                            location: 'Padelarium Club, Gavà',
                            dates: '08/05/2026 - 10/05/2026',
                            status: 'En juego!',
                            link: '#',
                            prize: '800€ en metálico + Material deportivo Siux',
                            welcomePack: 'Bolsa Siux Pro + Toalla microfibra',
                            rankingPoints: 500,
                            description: 'El torneo insignia del año con retransmisión por streaming, welcome pack deluxe y barbacoa el domingo.'
                        },
                        {
                            id: 'torneo-open-primavera',
                            title: 'MASTER FINAL PRIMAVERA SOMOSPADEL BCN',
                            poster: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&q=80&w=800',
                            category: 'Categorías 1ª, 2ª, 3ª, 4ª y Mixta Oro',
                            location: 'Vall Parc Padel Club, Barcelona',
                            dates: '19/07/2026 - 21/07/2026',
                            status: 'Próximamente',
                            link: '#',
                            prize: 'Paleteros Bullpadel + Jamones + Trofeos Pro',
                            welcomePack: 'Gorra técnica + Bote de bolas Bullpadel Pro',
                            rankingPoints: 400,
                            description: 'El Máster de Primavera donde los mejores del ranking SomosPadel se disputan la corona de la temporada.'
                        }
                    ];
                }

                // Normalizador y parseador de fechas inteligente
                const parseTournamentDate = (t) => {
                    if (!t || !t.dates) return new Date(0);
                    const dateStr = t.dates.trim();

                    const dmyRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
                    const dmyMatch = dateStr.match(dmyRegex);
                    if (dmyMatch) {
                        const day = parseInt(dmyMatch[1], 10);
                        const month = parseInt(dmyMatch[2], 10) - 1;
                        let year = parseInt(dmyMatch[3], 10);
                        if (year < 100) year += 2000;
                        return new Date(year, month, day);
                    }

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

                // Ordenación cronológica
                if (this.currentSort === 'newest') {
                    all.sort((a, b) => parseTournamentDate(b) - parseTournamentDate(a));
                } else {
                    all.sort((a, b) => parseTournamentDate(a) - parseTournamentDate(b));
                }

                this.tournaments = all;

                // Cálculo de contadores dinámicos para los filtros
                const counts = {
                    all: all.length,
                    open: all.filter(t => (t.status || '').toLowerCase().includes('abiert')).length,
                    in_game: all.filter(t => (t.status || '').toLowerCase().includes('juego')).length,
                    upcoming: all.filter(t => (t.status || '').toLowerCase().includes('próxim') || (t.status || '').toLowerCase().includes('proxim')).length,
                    finished: all.filter(t => (t.status || '').toLowerCase().includes('finaliz')).length
                };

                // Aplicar filtros activos
                const filtered = this.applyFilters(all);

                if (window.TournamentView) {
                    window.TournamentView.render(filtered, counts, this.currentFilter, this.currentCategoryFilter, this.currentSort, this.viewMode);
                }
            } catch (e) {
                console.error("❌ Error en TournamentController.loadTournaments:", e);
                if (window.TournamentView) window.TournamentView.render([]);
            }
        }

        applyFilters(tournamentsList) {
            const list = tournamentsList || this.tournaments;
            const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

            const query = normalize(this.searchTerm);

            return list.filter(t => {
                // 1. Filtro por Estado
                if (this.currentFilter !== 'all') {
                    const st = (t.status || '').toLowerCase();
                    if (this.currentFilter === 'Abiertas' && !st.includes('abiert')) return false;
                    if (this.currentFilter === 'En juego!' && !st.includes('juego')) return false;
                    if (this.currentFilter === 'Próximamente' && !st.includes('proxim') && !st.includes('próxim')) return false;
                    if (this.currentFilter === 'Finalizado' && !st.includes('finaliz')) return false;
                }

                // 2. Filtro por Categoría
                if (this.currentCategoryFilter !== 'all') {
                    const cat = normalize(t.category || '');
                    if (!cat.includes(normalize(this.currentCategoryFilter))) return false;
                }

                // 3. Filtro por Búsqueda (título, club/ubicación, categorías, fechas)
                if (query) {
                    const titleMatch = normalize(t.title).includes(query);
                    const locMatch = normalize(t.location).includes(query);
                    const catMatch = normalize(t.category).includes(query);
                    const dateMatch = normalize(t.dates).includes(query);
                    if (!titleMatch && !locMatch && !catMatch && !dateMatch) return false;
                }

                return true;
            });
        }

        changeSort(sortValue) {
            this.currentSort = sortValue;
            this.loadTournaments();
        }

        filterByStatus(status) {
            this.currentFilter = status;
            this.loadTournaments();
        }

        filterByCategory(category) {
            this.currentCategoryFilter = category;
            this.loadTournaments();
        }

        setViewMode(mode) {
            this.viewMode = mode;
            this.loadTournaments();
        }

        handleSearch(query) {
            this.searchTerm = query;
            if (window.TournamentView) {
                window.TournamentView.searchTerm = query;
            }
            this.loadTournaments();
        }

        resetFilters() {
            this.searchTerm = '';
            this.currentFilter = 'all';
            this.currentCategoryFilter = 'all';
            if (window.TournamentView) {
                window.TournamentView.searchTerm = '';
            }
            this.loadTournaments();
        }

        // Abre el modal detallado del torneo
        openDetails(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (!t) return;
            if (window.TournamentView && typeof window.TournamentView.showDetailsModal === 'function') {
                window.TournamentView.showDetailsModal(t);
            } else {
                this.showDetails(id);
            }
        }

        showDetails(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (t && t.link && t.link !== '#') {
                window.open(t.link, '_blank', 'noopener,noreferrer');
            } else {
                this.openDetails(id);
            }
        }

        // Compartir torneo por WhatsApp con diseño atractivo
        shareTournament(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (!t) return;

            const appUrl = window.location.origin + window.location.pathname + '#tournaments';
            const text = 
`🎾 *TORNEO OFICIAL SOMOSPADEL BCN* 🎾
🏆 *${t.title}*
📍 *Sede:* ${t.location || 'SomosPadel BCN'}
📅 *Fechas:* ${t.dates || 'Por confirmar'}
🏷️ *Categorías:* ${t.category || 'Open'}
${t.prize ? `🎁 *Premios:* ${t.prize}\n` : ''}${t.rankingPoints ? `⚡ *Puntos Ranking:* +${t.rankingPoints} pts\n` : ''}
🔥 ¡Consulta todos los detalles y apúntate aquí! 👇
${appUrl}`;

            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }

        // Abrir ubicación en Google Maps
        openMaps(location) {
            if (!location) return;
            const query = encodeURIComponent(location + ', Barcelona');
            const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        // Añadir a Google Calendar
        addToCalendar(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (!t) return;

            const title = encodeURIComponent(t.title || 'Torneo SomosPadel BCN');
            const details = encodeURIComponent(`Torneo de Pádel: ${t.category || ''}\nSede: ${t.location || ''}\n${t.link || ''}`);
            const location = encodeURIComponent(t.location || 'Barcelona');

            // Formato de enlace a Google Calendar
            const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
            window.open(gCalUrl, '_blank', 'noopener,noreferrer');
        }

        // Conectar con el servicio "Busco Pareja" para este torneo
        findPartnerForTournament(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (!t) return;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const playerName = currentUser ? (currentUser.name || currentUser.displayName || 'un jugador de la comunidad') : 'un jugador de SomosPadel';
            const playerLevel = currentUser?.level || '3.5';

            const text = 
`👋 ¡Hola SomosPadel BCN!
🎾 Me gustaría apuntarme al *${t.title}* (${t.dates}) pero *busco pareja*.
👤 *Mi Nombre:* ${playerName}
⚡ *Mi Nivel:* ${playerLevel}
🏷️ *Categoría deseada:* ${t.category || 'Cualquiera'}

¿Hay alguien disponible o tenéis bolsa de parejas abierta? ¡Gracias!`;

            const adminPhone = '34674063259'; // Teléfono oficial / WhatsApp de SomosPadel BCN
            const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }

        // Inscripción oficial
        openOfficialLink(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (t && t.link && t.link !== '#') {
                window.open(t.link, '_blank', 'noopener,noreferrer');
            } else {
                // Si no tiene link, abrir el modal de detalles
                this.openDetails(id);
            }
        }
    }

    // Inicializar y exponer
    window.TournamentController = new TournamentController();
    console.log("✅ [TournamentController v2.0] Listo con soporte Pro");
})();
