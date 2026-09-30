/**
 * CommunityHomeController.js
 * Controlador oficial del Inicio de Comunidad de SomosPadel Barcelona
 * Gestiona el HUB de bienvenida, KPIs del club, filtro de noticias,
 * integración de artículos curados + Firestore blog_posts, y accesos directos.
 */

(function (global) {
    'use strict';

    class CommunityHomeController {
        constructor() {
            this.state = {
                activeCategory: 'todas',
                articles: [],
                stats: {
                    totalPlayers: '+250',
                    totalTeams: '7',
                    activeEntrenos: 'Semanal',
                    fairPlayRate: '100%'
                },
                whatsappGroupLink: 'https://wa.me/34649219350?text=Hola%20Alex,%20quiero%20unirme%20al%20grupo%20oficial%20de%20la%20Comunidad%20SomosPadel',
                campaignActive: false,
                loading: false
            };

            this.adminPhone = '34649219350';
            this.campaignListener = null;
        }

        /**
         * Inicializa la vista de Inicio de Comunidad
         */
        async init() {
            console.log("👥 [CommunityHomeController] Inicializando Inicio de Comunidad...");
            this.state.loading = true;

            // 1. Obtener estado de campaña de inscripciones
            this.syncCampaignStatus();

            // 2. Cargar enlace de WhatsApp oficial de la comunidad si está configurado en Firestore
            await this.loadWhatsAppConfig();

            // 3. Cargar estadísticas reactivas del club
            await this.loadCommunityStats();

            // 4. Cargar y combinar artículos (curados + Firestore blog_posts)
            await this.loadArticles();

            // 5. Renderizar vista
            this.state.loading = false;
            if (window.CommunityHomeView) {
                window.CommunityHomeView.render(this.state);
            }

            // 6. Escuchar cambios de campaña en tiempo real
            if (!this.campaignListener) {
                this.campaignListener = (e) => {
                    const active = !!(e.detail && e.detail.active);
                    this.state.campaignActive = active;
                    if (window.CommunityHomeView) {
                        window.CommunityHomeView.render(this.state);
                    }
                };
                window.addEventListener('sp_campaign_status_changed', this.campaignListener);
            }
        }

        /**
         * Sincroniza estado de la campaña de inscripciones
         */
        syncCampaignStatus() {
            if (window.SeasonCampaignService && typeof window.SeasonCampaignService.isCampaignActiveSync === 'function') {
                this.state.campaignActive = window.SeasonCampaignService.isCampaignActiveSync();
            } else {
                this.state.campaignActive = false;
            }
        }

        /**
         * Obtiene configuración del grupo de WhatsApp desde system_config
         */
        async loadWhatsAppConfig() {
            try {
                if (window.db) {
                    const doc = await window.db.collection('system_config').doc('whatsapp').get();
                    if (doc.exists && doc.data().group_link) {
                        this.state.whatsappGroupLink = doc.data().group_link;
                    }
                }
            } catch (err) {
                console.warn("[CommunityHomeController] No se pudo leer system_config/whatsapp, usando fallback:", err);
            }
        }

        /**
         * Carga estadísticas del club en tiempo real
         */
        async loadCommunityStats() {
            try {
                // Total equipos de liga
                if (window.ClubTeamsData && Array.isArray(window.ClubTeamsData)) {
                    this.state.stats.totalTeams = String(window.ClubTeamsData.length);
                } else if (window.TeamController && Array.isArray(window.TeamController.teams)) {
                    this.state.stats.totalTeams = String(window.TeamController.teams.length);
                } else {
                    this.state.stats.totalTeams = '7';
                }

                // Total de jugadores registrados (sincronizado con la base de datos oficial del club / Foto 2)
                const teamsData = (window.TeamController && Array.isArray(window.TeamController.teams) && window.TeamController.teams.length > 0)
                    ? window.TeamController.teams
                    : (window.ClubTeamsData || []);
                
                let rosterPlayersCount = 0;
                if (Array.isArray(teamsData) && teamsData.length > 0) {
                    rosterPlayersCount = teamsData.reduce((acc, t) => acc + (t.roster ? t.roster.length : 0), 0);
                }

                if (rosterPlayersCount > 0) {
                    this.state.stats.totalPlayers = String(rosterPlayersCount);
                } else if (window.RankingController && Array.isArray(window.RankingController.players) && window.RankingController.players.length > 0) {
                    this.state.stats.totalPlayers = String(window.RankingController.players.length);
                } else if (window.Store && Array.isArray(window.Store.getState('players')) && window.Store.getState('players').length > 0) {
                    this.state.stats.totalPlayers = String(window.Store.getState('players').length);
                } else {
                    this.state.stats.totalPlayers = '191';
                }

                // Entrenos semanales activos
                if (window.EventsController && window.EventsController.state && Array.isArray(window.EventsController.state.events)) {
                    const entrenosCount = window.EventsController.state.events.filter(e => e.type === 'entreno' || (e.title && e.title.toLowerCase().includes('entreno'))).length;
                    if (entrenosCount > 0) {
                        this.state.stats.activeEntrenos = `${entrenosCount} Activos`;
                    }
                }
            } catch (e) {
                console.warn("[CommunityHomeController] Error calculando estadísticas de comunidad:", e);
            }
        }

        /**
         * Catálogo de artículos curados oficiales de la comunidad
         */
        getCuratedArticles() {
            return [
                {
                    id: 'fair-play-honor',
                    categoryKey: 'valores',
                    categoryLabel: '🤝 VALORES & FAIR PLAY',
                    catColor: '#CCFF00',
                    catBg: 'rgba(204, 255, 0, 0.15)',
                    title: 'Código Fair Play: La Regla de Oro en Bolas Dudosas',
                    emoji: '⚖️',
                    imgGrad: 'linear-gradient(135deg, #1e293b 0%, #064e3b 100%)',
                    snippet: 'En SomosPadel la deportividad y la nobleza están por encima de cualquier marcador. Repasamos la regla de honor en bolas dudosas.',
                    content: `El pádel es un deporte de caballeros y damas donde la deportividad debe ser siempre el valor protagonista. En SomosPadel Barcelona creemos que un triunfo sin respeto carece de valor, mientras que un partido competido con nobleza engrandece a todos los participantes.

### 1. La Regla de Oro de las Bolas Dudosas
Cuando haya una bola ajustada a la línea o cristal donde no haya un acuerdo unánime y claro entre ambas parejas:
• Se concede el punto al rival con cortesía, o bien
• Se repite el punto («dos bolas») sin discusión alguna ni aspavientos.

### 2. El Apoyo Incondicional al Compañero
En nuestro club no se juzgan los fallos. El pádel es un deporte de errores no forzados; reprochar una mala bola a tu pareja solo genera tensión y resta rendimiento.
• Anima con un choque de palas en cada punto.
• Transmite calma en los momentos de presión del tie-break.

### 3. El Respeto al Club y a las Instalaciones
Cuidar las pistas, no golpear los cristales con la pala por frustración y dejar la pista impecable al terminar. El orgullo de club se demuestra en cada pequeño detalle.`,
                    date: 'Esta Semana',
                    readTime: '2 min',
                    timestamp: Date.now() - 1000 * 60 * 60 * 24
                },
                {
                    id: 'equipos-liga-26-27',
                    categoryKey: 'equipos',
                    categoryLabel: '👥 LIGA & EQUIPOS',
                    catColor: '#ff5e00',
                    catBg: 'rgba(255, 94, 0, 0.15)',
                    title: 'Equipos de Liga 2026/27: ¡Unión y Compromiso de Club!',
                    emoji: '🛡️',
                    imgGrad: 'linear-gradient(135deg, #431407 0%, #1e1b4b 100%)',
                    snippet: 'Nuestras 7 plantillas oficiales compiten al máximo nivel en FCFP y SNP. Conoce cómo confirmar tus convocatorias en «Mi Equipo».',
                    content: `SomosPadel Barcelona cuenta con una de las estructuras de competición más sólidas y vibrantes de la ciudad. Con 7 equipos oficiales repartidos en Femenina, Mixta y Masculina, cada fin de semana defendemos nuestros colores con pasión.

### Cómo funcionan las convocatorias:
• El Capitán publica la alineación en la pestaña «Mi Equipo» con antelación suficiente.
• Cada jugador convocado debe confirmar su disponibilidad con el botón de asistencia en tiempo real.
• Si no puedes asistir por causa de fuerza mayor, avisa con al menos 72 horas para activar a los reservas.

### El Orgullo de Representar al Club
Jugar una serie de liga no es solo pisar la pista; es llegar 20 minutos antes para apoyar al equipo que juega el primer turno, animar desde la valla y celebrar juntos en el tercer tiempo. ¡Força SomosPadel!`,
                    date: 'Ayer',
                    readTime: '3 min',
                    timestamp: Date.now() - 1000 * 60 * 60 * 48
                },
                {
                    id: 'clinics-tecnicos-semanales',
                    categoryKey: 'entrenos',
                    categoryLabel: '🎾 ENTRENOS',
                    catColor: '#ff007f',
                    catBg: 'rgba(255, 0, 127, 0.15)',
                    title: 'Entrenos Semanales: Transición Ataque-Defensa y Bandeja',
                    emoji: '🎾',
                    imgGrad: 'linear-gradient(135deg, #500724 0%, #0f172a 100%)',
                    snippet: 'Descubre cómo nuestras sesiones guiadas por técnicos del club te ayudarán a ganar consistencia táctica y reducir errores en pista.',
                    content: `La diferencia entre ganar y perder un partido reñido suele estar en la toma de decisiones bajo presión y en la automatización de los gestos técnicos. Por ello, nuestros entrenos semanales están diseñados por bloques temáticos.

### Claves del Bloque Técnico Actual:
• **Salida de Pared Fluida**: Dejar pasar la bola, leer la velocidad del rebote y armar antes del bote para no pegar forzado.
• **La Bandeja de Contención**: No busques ganar el punto con la bandeja; el objetivo principal es mantener la red y obligar al rival a jugar una bola por debajo de la cintura.
• **Posicionamiento en Paralelo**: Sincronización milimétrica con tu pareja para cerrar los huecos centrales.

Puedes consultar los horarios y reservar tu plaza directamente en la subsección **Entrenos** del menú superior.`,
                    date: 'Hace 3 días',
                    readTime: '3 min',
                    timestamp: Date.now() - 1000 * 60 * 60 * 72
                },
                {
                    id: 'inscriptions-nueva-temporada',
                    categoryKey: 'equipos',
                    categoryLabel: '📝 INSCRIPCIONES',
                    catColor: '#10b981',
                    catBg: 'rgba(16, 185, 129, 0.15)',
                    title: 'Inscripciones Temporada 27/28: ¡Sé Parte de la Familia!',
                    emoji: '📋',
                    imgGrad: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
                    snippet: 'El club prepara la nueva temporada de ligas oficiales. Categorías 2ª, 3ª y 4ª Femenina, Mixta y Masculina con pruebas de nivel.',
                    content: `¿Quieres competir con SomosPadel Barcelona la próxima temporada? Abrimos el proceso oficial para configurar los equipos federados y de Series Nacionales.

### Categorías Oficiales:
• **Femenina**: 2ª, 3ª y 4ª División.
• **Mixta**: 3ª y 4ª División.
• **Masculina**: 3ª y 4ª División.

### ¿Qué incluye ser jugador de SomosPadel?
1. Equipación oficial del club (camiseta técnica de alta gama con patrocinadores oficiales).
2. Ficha federativa y gestión integral de actas por Capitanía.
3. Descuentos exclusivos en entrenos técnicos y pistas de entreno.
4. Acceso al sistema inteligente de convocatorias y estadísticas ELO.

Contacta con Capitanía o pulsa en **Inscripciones 27/28** para registrar tu solicitud formal.`,
                    date: 'Esta Semana',
                    readTime: '2 min',
                    timestamp: Date.now() - 1000 * 60 * 60 * 96
                },
                {
                    id: 'tercer-tiempo-familia',
                    categoryKey: 'valores',
                    categoryLabel: '🍻 CONVIVENCIA & CLUB',
                    catColor: '#a855f7',
                    catBg: 'rgba(168, 85, 247, 0.15)',
                    title: 'El Tercer Tiempo: Donde Realmente Se Gana el Partido',
                    emoji: '🍻',
                    imgGrad: 'linear-gradient(135deg, #3b0764 0%, #0f172a 100%)',
                    snippet: 'La competición une en la pista, pero el tercer tiempo crea la hermandad que distingue a SomosPadel de cualquier otro club.',
                    content: `Si algo nos hace diferentes en SomosPadel es que el pitido final no marca la despedida, sino el inicio de lo mejor de la jornada: sentarse con compañeros y rivales a comentar las mejores jugadas entre risas, bravas y refrescos.

### Las Leyes del Tercer Tiempo SomosPadel:
• Los puntos polémicos de la pista se convierten en anécdotas divertidas en la mesa.
• El ganador invita o comparte con el mismo cariño que si hubiera perdido.
• Prohibido marcharse corriendo sin al menos 15 minutos de charla y desconexión con el grupo.

Porque el pádel es un deporte fabuloso, pero los amigos con los que lo compartes son para toda la vida.`,
                    date: 'Hace 5 días',
                    readTime: '2 min',
                    timestamp: Date.now() - 1000 * 60 * 60 * 120
                }
            ];
        }

        /**
         * Carga artículos combinando curados con la colección 'blog_posts' de Firestore
         */
        async loadArticles() {
            const curated = this.getCuratedArticles();
            let firestorePosts = [];

            try {
                if (window.db) {
                    const snap = await window.db.collection('blog_posts')
                        .orderBy('timestamp', 'desc')
                        .limit(10)
                        .get();

                    if (!snap.empty) {
                        firestorePosts = snap.docs.map(doc => {
                            const data = doc.data();
                            let catKey = 'valores';
                            const lowerCat = (data.category || '').toLowerCase();
                            if (lowerCat.includes('equipo') || lowerCat.includes('liga') || lowerCat.includes('torneo')) {
                                catKey = 'equipos';
                            } else if (lowerCat.includes('entreno') || lowerCat.includes('clinic')) {
                                catKey = 'entrenos';
                            }

                            return {
                                id: doc.id,
                                categoryKey: catKey,
                                categoryLabel: data.category || 'NOTICIA CLUB',
                                catColor: data.catColor || '#CCFF00',
                                catBg: 'rgba(204, 255, 0, 0.15)',
                                title: data.title || 'Actualidad SomosPadel',
                                emoji: data.emoji || '🎾',
                                imgGrad: data.imgGrad || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                snippet: data.snippet || (data.content ? data.content.slice(0, 100) + '...' : ''),
                                content: data.content || data.snippet || '',
                                date: data.date || 'Reciente',
                                readTime: data.readTime || '2 min',
                                timestamp: data.timestamp || Date.now()
                            };
                        });
                    }
                }
            } catch (err) {
                console.warn("[CommunityHomeController] Consulta a blog_posts omitida o error de índice:", err);
            }

            // Unir y evitar duplicados de ID
            const map = new Map();
            curated.forEach(item => map.set(item.id, item));
            firestorePosts.forEach(item => {
                if (!map.has(item.id)) {
                    map.set(item.id, item);
                }
            });

            this.state.articles = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }

        /**
         * Cambia el filtro de categoría activo
         */
        setCategoryFilter(category) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            this.state.activeCategory = category;
            if (window.CommunityHomeView) {
                window.CommunityHomeView.updateNewsGrid(this.state.articles, category);
            }
        }

        /**
         * Abre el visor modal del artículo
         */
        openArticleModal(articleId) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            const article = this.state.articles.find(a => a.id === articleId);
            if (article && window.CommunityHomeView) {
                window.CommunityHomeView.showArticleModal(article);
            }
        }

        /**
         * Cierra el visor modal del artículo
         */
        closeArticleModal() {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(10);
            if (window.CommunityHomeView) {
                window.CommunityHomeView.closeArticleModal();
            }
        }

        /**
         * Comparte el artículo por WhatsApp
         */
        shareArticleWhatsApp(articleId) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(25);
            const article = this.state.articles.find(a => a.id === articleId);
            if (!article) return;

            const text = encodeURIComponent(
                `🎾 *SOMOSPADEL BARCELONA • NOTICIA DE COMUNIDAD*\n\n` +
                `📌 *${article.title}*\n\n` +
                `${article.snippet || ''}\n\n` +
                `🔗 Léelo al completo en nuestra App SomosPadel Barcelona.`
            );
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }

        /**
         * Navega a una subsección de la comunidad
         */
        navigateTo(subtab) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            if (window.Router && typeof window.Router.navigate === 'function') {
                window.Router.navigate(subtab);
            }
        }

        /**
         * Contacto directo con Capitanía por WhatsApp
         */
        contactStaff(tipo = 'general') {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            const msg = encodeURIComponent(
                `Hola Alex, te escribo desde la sección Comunidad de SomosPadel Barcelona con una consulta/sugerencia sobre el club 🎾👥:`
            );
            window.open(`https://wa.me/${this.adminPhone}?text=${msg}`, '_blank');
        }

        /**
         * Modal de sugerencia rápida
         */
        openSuggestionModal() {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            const suggestion = prompt("¿Qué sugerencia o idea tienes para mejorar la comunidad SomosPadel Barcelona?");
            if (suggestion && suggestion.trim()) {
                const msg = encodeURIComponent(
                    `💡 *SUGERENCIA DE LA COMUNIDAD SOMOSPADEL*:\n\n"${suggestion.trim()}"`
                );
                window.open(`https://wa.me/${this.adminPhone}?text=${msg}`, '_blank');
            }
        }

        /**
         * Limpieza de recursos al salir de la ruta
         */
        destroy() {
            if (this.campaignListener) {
                window.removeEventListener('sp_campaign_status_changed', this.campaignListener);
                this.campaignListener = null;
            }
            if (window.CommunityHomeView) {
                window.CommunityHomeView.closeArticleModal();
            }
        }
    }

    global.CommunityHomeController = new CommunityHomeController();
})(window);
