/**
 * CommunityHomeView.js
 * Vista oficial de Inicio de la Comunidad SomosPadel Barcelona
 * Diseño limpio, profesional y de alto contraste sobre fondo claro (#f8fafc)
 * con Hero deportivo premium y componentes accesibles.
 */

(function (global) {
    'use strict';

    class CommunityHomeView {
        constructor() {
            this.containerId = 'content-area';
        }

        /**
         * Renderiza la vista completa de Inicio de Comunidad
         */
        render(state) {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            // Asegurar fondo general claro para consistencia visual
            container.style.background = '#f8fafc';

            const {
                activeCategory = 'todas',
                articles = [],
                stats = {},
                whatsappGroupLink = '',
                campaignActive = false
            } = state;

            const filteredArticles = this.filterArticles(articles, activeCategory);

            container.innerHTML = `
                <div class="community-home-wrapper">
                    <!-- HERO SECTION (Bloque oscuro deportivo premium) -->
                    <header class="ch-hero-section">
                        <div class="ch-hero-glow"></div>
                        <div class="ch-hero-badge">
                            <span class="ch-pulse-dot"></span>
                            <span class="ch-badge-text">HUB OFICIAL SOMOSPADEL BARCELONA</span>
                        </div>
                        <h1 class="ch-hero-title">
                            COMUNIDAD SOMOSPADEL <span class="ch-neon-gradient">👥🎾</span>
                        </h1>
                        <p class="ch-hero-subtitle">
                            Pasión por el pádel, espíritu de equipo y la mejor energía dentro y fuera de la pista.
                            Aquí late el corazón de nuestro club: noticias, valores, entrenos y ligas en un solo lugar.
                        </p>

                        <!-- QUICK STATS / KPIS -->
                        <div class="ch-stats-grid">
                            <div class="ch-stat-card" style="--accent-color: #a78bfa;">
                                <div class="ch-stat-icon-wrap" style="color: #a78bfa; background: rgba(167, 139, 250, 0.15);">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">${stats.totalPlayers || '191'}</span>
                                    <span class="ch-stat-lbl">Jugadores</span>
                                </div>
                            </div>

                            <div class="ch-stat-card" style="--accent-color: #ff5e00;">
                                <div class="ch-stat-icon-wrap" style="color: #ff5e00; background: rgba(255, 94, 0, 0.15);">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">${stats.totalTeams || '7'}</span>
                                    <span class="ch-stat-lbl">Equipos de Liga</span>
                                </div>
                            </div>

                            <div class="ch-stat-card" style="--accent-color: #ff007f;">
                                <div class="ch-stat-icon-wrap" style="color: #ff007f; background: rgba(255, 0, 127, 0.15);">
                                    <i class="fas fa-dumbbell"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">${stats.activeEntrenos || 'Semanal'}</span>
                                    <span class="ch-stat-lbl">Entrenos</span>
                                </div>
                            </div>

                            <div class="ch-stat-card" style="--accent-color: #0ea5e9;">
                                <div class="ch-stat-icon-wrap" style="color: #0ea5e9; background: rgba(14, 165, 233, 0.15);">
                                    <i class="fas fa-handshake"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">100%</span>
                                    <span class="ch-stat-lbl">Fair Play & Club</span>
                                </div>
                            </div>
                        </div>

                        <!-- CTA WHATSAPP OFICIAL -->
                        <div class="ch-hero-cta-wrap">
                            <a href="${whatsappGroupLink || 'https://wa.me/34649219350?text=Hola%20Alex,%20quiero%20unirme%20al%20grupo%20oficial%20de%20la%20Comunidad%20SomosPadel'}"
                               target="_blank" rel="noopener noreferrer"
                               class="ch-btn-whatsapp-hero"
                               onclick="window.PlayerView?.haptic?.(25);">
                                <div class="ch-wa-pulse-icon">
                                    <i class="fab fa-whatsapp"></i>
                                </div>
                                <div class="ch-wa-text-box">
                                    <span class="ch-wa-main-title">UNIRSE AL GRUPO OFICIAL DE WHATSAPP</span>
                                    <span class="ch-wa-sub-title">Noticias en directo, sustituciones y tercer tiempo</span>
                                </div>
                                <i class="fas fa-arrow-right ch-wa-arrow"></i>
                            </a>
                        </div>
                    </header>

                    <!-- SECCIÓN 2: HUB DE SUBSECCIONES (ACCESOS DIRECTOS) -->
                    <section class="ch-hub-section">
                        <div class="ch-section-header">
                            <div>
                                <h2 class="ch-section-title">
                                    <i class="fas fa-th-large" style="color: #0284c7; margin-right: 8px;"></i>
                                    ACCESOS DIRECTOS DE LA COMUNIDAD
                                </h2>
                                <p class="ch-section-subtitle">Explora todas las herramientas, entrenamientos y competiciones del club</p>
                            </div>
                        </div>

                        <div class="ch-hub-grid">
                            <!-- 1. ENTRENOS -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('entrenos');" style="--card-neon: #db2777;">
                                <div class="ch-hub-card-header">
                                    <div class="ch-hub-icon-box" style="background: rgba(219, 39, 119, 0.1); color: #be185d; border-color: rgba(219, 39, 119, 0.25);">
                                        <i class="fas fa-baseball-ball"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8;">
                                        CONVOCATORIAS
                                    </span>
                                </div>
                                <h3 class="ch-hub-card-title">🎾 Entrenos</h3>
                                <p class="ch-hub-card-desc">Sesiones organizadas por los capitanes de los equipos, donde mejoramos la cohesión con el equipo, técnica individual y mucho más.</p>
                                <div class="ch-hub-card-footer">
                                    <span class="ch-hub-action-lbl">Ver sesiones abiertas</span>
                                    <i class="fas fa-chevron-right ch-hub-card-arrow"></i>
                                </div>
                            </div>

                            <!-- 2. EQUIPOS DE LIGA -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('equipos');" style="--card-neon: #ea580c;">
                                <div class="ch-hub-card-header">
                                    <div class="ch-hub-icon-box" style="background: rgba(234, 88, 12, 0.1); color: #c2410c; border-color: rgba(234, 88, 12, 0.25);">
                                        <i class="fas fa-shield-alt"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;">
                                        LIGA SNP & FCFP
                                    </span>
                                </div>
                                <h3 class="ch-hub-card-title">👥 Equipos de Liga</h3>
                                <p class="ch-hub-card-desc">Conoce nuestras 7 plantillas oficiales: Femeninos, Mixtos y Masculinos. Actas, rivales y clasificaciones.</p>
                                <div class="ch-hub-card-footer">
                                    <span class="ch-hub-action-lbl">Explorar plantillas</span>
                                    <i class="fas fa-chevron-right ch-hub-card-arrow"></i>
                                </div>
                            </div>

                            <!-- 3. MI EQUIPO (DESTACADO) -->
                            <div class="ch-hub-card ch-hub-card-featured" onclick="window.CommunityHomeController?.navigateTo('my_team');" style="--card-neon: #0284c7;">
                                <div class="ch-hub-card-header">
                                    <div class="ch-hub-icon-box" style="background: rgba(2, 132, 199, 0.15); color: #0284c7; border-color: rgba(2, 132, 199, 0.35);">
                                        <i class="fas fa-users-cog"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #0284c7; color: #ffffff; border: 1px solid #0284c7; font-weight: 950;">
                                        ⚡ ACCESO DIRECTO
                                    </span>
                                </div>
                                <h3 class="ch-hub-card-title">🛡️ Mi Equipo</h3>
                                <p class="ch-hub-card-desc">Tu vestuario personal: confirma disponibilidad para la próxima serie de liga, consulta tu pareja y táctica.</p>
                                <div class="ch-hub-card-footer">
                                    <span class="ch-hub-action-lbl">Ir a mi vestuario</span>
                                    <i class="fas fa-chevron-right ch-hub-card-arrow"></i>
                                </div>
                            </div>

                            <!-- 4. MI AGENDA -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('agenda');" style="--card-neon: #65a30d;">
                                <div class="ch-hub-card-header">
                                    <div class="ch-hub-icon-box" style="background: rgba(101, 163, 13, 0.12); color: #3f6212; border-color: rgba(101, 163, 13, 0.25);">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #f7fee7; color: #3f6212; border: 1px solid #d9f99d;">
                                        SINCRONIZADA
                                    </span>
                                </div>
                                <h3 class="ch-hub-card-title">📅 Mi Agenda</h3>
                                <p class="ch-hub-card-desc">Tus convocatorias oficiales, partidos de liga, entrenamientos y recordatorios automáticos.</p>
                                <div class="ch-hub-card-footer">
                                    <span class="ch-hub-action-lbl">Ver mi calendario</span>
                                    <i class="fas fa-chevron-right ch-hub-card-arrow"></i>
                                </div>
                            </div>

                            <!-- 5. INSCRIPCIONES 27/28 -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('inscriptions');" style="--card-neon: ${campaignActive ? '#059669' : '#475569'};">
                                <div class="ch-hub-card-header">
                                    <div class="ch-hub-icon-box" style="background: ${campaignActive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(100, 116, 139, 0.1)'}; color: ${campaignActive ? '#047857' : '#475569'}; border-color: ${campaignActive ? 'rgba(5, 150, 105, 0.25)' : 'rgba(100, 116, 139, 0.25)'};">
                                        <i class="fas fa-file-signature"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: ${campaignActive ? '#ecfdf5' : '#f1f5f9'}; color: ${campaignActive ? '#047857' : '#475569'}; border: 1px solid ${campaignActive ? '#a7f3d0' : '#e2e8f0'}; font-weight: 900;">
                                        ${campaignActive ? '🟢 ABIERTA' : '🔴 PRÓXIMAMENTE'}
                                    </span>
                                </div>
                                <h3 class="ch-hub-card-title">📝 Inscripciones 27/28</h3>
                                <p class="ch-hub-card-desc">Campaña oficial de renovación y nuevas altas para competir con el club la próxima temporada.</p>
                                <div class="ch-hub-card-footer">
                                    <span class="ch-hub-action-lbl">${campaignActive ? 'Inscribirme ahora' : 'Ver información'}</span>
                                    <i class="fas fa-chevron-right ch-hub-card-arrow"></i>
                                </div>
                            </div>

                            <!-- 6. RÉCORDS TEMPORADA -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('records');" style="--card-neon: #7e22ce;">
                                <div class="ch-hub-card-header">
                                    <div class="ch-hub-icon-box" style="background: rgba(126, 34, 206, 0.1); color: #7e22ce; border-color: rgba(126, 34, 206, 0.25);">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff;">
                                        HALL OF FAME
                                    </span>
                                </div>
                                <h3 class="ch-hub-card-title">🏆 Récords Temporada</h3>
                                <p class="ch-hub-card-desc">Máximos anotadores, imbatibilidad, MVPs de liga y la vitrina de leyendas de SomosPadel.</p>
                                <div class="ch-hub-card-footer">
                                    <span class="ch-hub-action-lbl">Ver muro de honor</span>
                                    <i class="fas fa-chevron-right ch-hub-card-arrow"></i>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- SECCIÓN 3: NOTICIAS & ACTUALIDAD DE LA COMUNIDAD -->
                    <section class="ch-news-section">
                        <div class="ch-section-header ch-news-header">
                            <div>
                                <h2 class="ch-section-title">
                                    <i class="fas fa-newspaper" style="color: #ea580c; margin-right: 8px;"></i>
                                    NOTICIAS Y ACTUALIDAD DEL CLUB
                                </h2>
                                <p class="ch-section-subtitle">Últimas novedades, crónicas de partidos, directrices de capitanía y vida del club</p>
                            </div>
                        </div>

                        <!-- FILTROS POR CATEGORÍA -->
                        <div class="ch-filter-pills" id="ch-filter-pills">
                            <button class="ch-pill-btn ${activeCategory === 'todas' ? 'active' : ''}"
                                    onclick="window.CommunityHomeController?.setCategoryFilter('todas');">
                                <i class="fas fa-fire"></i> Todas las Noticias
                            </button>
                            <button class="ch-pill-btn ${activeCategory === 'valores' ? 'active' : ''}"
                                    onclick="window.CommunityHomeController?.setCategoryFilter('valores');">
                                <i class="fas fa-handshake"></i> 🤝 Valores & Club
                            </button>
                            <button class="ch-pill-btn ${activeCategory === 'equipos' ? 'active' : ''}"
                                    onclick="window.CommunityHomeController?.setCategoryFilter('equipos');">
                                <i class="fas fa-shield-alt"></i> 👥 Liga & Equipos
                            </button>
                            <button class="ch-pill-btn ${activeCategory === 'entrenos' ? 'active' : ''}"
                                    onclick="window.CommunityHomeController?.setCategoryFilter('entrenos');">
                                <i class="fas fa-dumbbell"></i> 🎾 Entrenos
                            </button>
                        </div>

                        <!-- GRID DE ARTÍCULOS -->
                        <div class="ch-news-grid" id="ch-news-grid">
                            ${this.renderArticlesGrid(filteredArticles)}
                        </div>
                    </section>

                    <!-- SECCIÓN 4: PILARES & CÓDIGO DE HONOR DE LA COMUNIDAD -->
                    <section class="ch-values-section">
                        <div class="ch-section-header">
                            <div>
                                <h2 class="ch-section-title">
                                    <i class="fas fa-award" style="color: #059669; margin-right: 8px;"></i>
                                    CÓDIGO DE HONOR SOMOSPADEL
                                </h2>
                                <p class="ch-section-subtitle">Los cuatro pilares que definen el orgullo de vestir nuestra camiseta</p>
                            </div>
                        </div>

                        <div class="ch-values-grid">
                            <div class="ch-value-card">
                                <div class="ch-value-icon">⚖️</div>
                                <h4>1. Fair Play & Duda Arbitral</h4>
                                <p>En caso de duda en una bola dudosa, <strong>siempre se repite el punto</strong> o se concede al rival. La honestidad deportiva define al verdadero campeón.</p>
                            </div>

                            <div class="ch-value-card">
                                <div class="ch-value-icon">🤝</div>
                                <h4>2. Apoyo Total a la Pareja</h4>
                                <p>Cero reproches en la pista. Si el compañero falla, choque de palas y cabeza arriba. El pádel se gana construyendo confianza mutua en cada punto.</p>
                            </div>

                            <div class="ch-value-card">
                                <div class="ch-value-icon">⏱️</div>
                                <h4>3. Puntualidad & Compromiso</h4>
                                <p>Llegar con 15 minutos de antelación para calentar y respetar las convocatorias. Tu equipo cuenta contigo y el tiempo de los demás es sagrado.</p>
                            </div>

                            <div class="ch-value-card">
                                <div class="ch-value-icon">🍻</div>
                                <h4>4. El Tercer Tiempo</h4>
                                <p>La rivalidad termina con el apretón de manos. El tercer tiempo en el club es donde se forjan las amistades duraderas y la unión de SomosPadel.</p>
                            </div>
                        </div>
                    </section>

                    <!-- SECCIÓN 5: BUZÓN DE SUGERENCIAS & CAPITANÍA -->
                    <section class="ch-contact-section">
                        <div class="ch-contact-card">
                            <div class="ch-contact-content">
                                <div class="ch-contact-badge">CAPITANÍA SOMOSPADEL</div>
                                <h3>¿Tienes una idea, sugerencia o consulta para el club?</h3>
                                <p>Estamos en constante evolución para ofrecer la mejor experiencia deportiva de Barcelona. Tu opinión hace grande a la comunidad.</p>
                                <div class="ch-contact-actions">
                                    <button class="ch-contact-btn ch-contact-btn-wa" onclick="window.CommunityHomeController?.contactStaff('sugerencia');">
                                        <i class="fab fa-whatsapp"></i> Hablar con Capitanía
                                    </button>
                                    <button class="ch-contact-btn ch-contact-btn-outline" onclick="window.CommunityHomeController?.openSuggestionModal();">
                                        <i class="fas fa-lightbulb"></i> Dejar Sugerencia
                                    </button>
                                </div>
                            </div>
                            <div class="ch-contact-visual">
                                <i class="fas fa-comments"></i>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- CONTENEDOR MODAL DE LECTURA DE ARTÍCULO -->
                <div id="ch-article-modal-overlay" class="ch-modal-overlay" style="display: none;" onclick="window.CommunityHomeController?.closeArticleModal();">
                    <div class="ch-modal-container" onclick="event.stopPropagation();" id="ch-article-modal-content">
                        <!-- Inyectado dinámicamente -->
                    </div>
                </div>

                <!-- ESTILOS ENCAPSULADOS PARA COMMUNITY HOME -->
                ${this.renderStyles()}
            `;
        }

        /**
         * Filtra artículos según categoría
         */
        filterArticles(articles, category) {
            if (!category || category === 'todas') return articles;
            return articles.filter(a => a.categoryKey === category || a.category === category);
        }

        /**
         * Renderiza el grid de artículos
         */
        renderArticlesGrid(articles) {
            if (!articles || articles.length === 0) {
                return `
                    <div class="ch-empty-news">
                        <i class="fas fa-bullhorn" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 12px;"></i>
                        <p>No hay artículos en esta categoría por el momento.</p>
                    </div>
                `;
            }

            return articles.map(art => {
                const coverStyle = art.imgGrad
                    ? `background: ${art.imgGrad};`
                    : 'background: linear-gradient(135deg, #0b1329 0%, #1e293b 100%);';

                return `
                    <article class="ch-news-card" onclick="window.CommunityHomeController?.openArticleModal('${art.id}');">
                        <div class="ch-news-cover" style="${coverStyle}">
                            <span class="ch-news-category-tag" style="background: ${art.catBg || 'rgba(0,0,0,0.6)'}; color: ${art.catColor || '#CCFF00'}; border-color: ${art.catColor || '#CCFF00'};">
                                ${art.categoryLabel || art.category || 'NOTICIA'}
                            </span>
                            <div class="ch-news-cover-emoji">${art.emoji || '🎾'}</div>
                        </div>
                        <div class="ch-news-body">
                            <div class="ch-news-meta">
                                <span class="ch-news-date"><i class="far fa-calendar-alt"></i> ${art.date || 'Reciente'}</span>
                                <span class="ch-news-readtime"><i class="far fa-clock"></i> ${art.readTime || '2 min'}</span>
                            </div>
                            <h3 class="ch-news-title">${art.title}</h3>
                            <p class="ch-news-snippet">${art.snippet || (art.content ? art.content.slice(0, 110) + '...' : '')}</p>
                            <div class="ch-news-footer">
                                <span class="ch-news-readmore">Leer artículo completo</span>
                                <i class="fas fa-arrow-right ch-news-arrow"></i>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        }

        /**
         * Muestra el modal interactivo con el artículo seleccionado
         */
        showArticleModal(article) {
            const overlay = document.getElementById('ch-article-modal-overlay');
            const container = document.getElementById('ch-article-modal-content');
            if (!overlay || !container || !article) return;

            const coverStyle = article.imgGrad
                ? `background: ${article.imgGrad};`
                : 'background: linear-gradient(135deg, #0b1329 0%, #1e293b 100%);';

            container.innerHTML = `
                <div class="ch-modal-header" style="${coverStyle}">
                    <button class="ch-modal-close-btn" onclick="window.CommunityHomeController?.closeArticleModal();" aria-label="Cerrar artículo">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="ch-modal-header-badge" style="color: ${article.catColor || '#CCFF00'}; background: rgba(0,0,0,0.55);">
                        ${article.categoryLabel || article.category || 'COMUNIDAD SOMOSPADEL'}
                    </div>
                    <div class="ch-modal-header-emoji">${article.emoji || '🎾'}</div>
                </div>

                <div class="ch-modal-body">
                    <div class="ch-modal-meta-row">
                        <span><i class="far fa-calendar-alt"></i> ${article.date || 'Hoy'}</span>
                        <span><i class="far fa-clock"></i> ${article.readTime || '3 min'} de lectura</span>
                        <span><i class="fas fa-check-circle" style="color: #059669;"></i> Oficial SomosPadel</span>
                    </div>

                    <h2 class="ch-modal-title">${article.title}</h2>

                    <div class="ch-modal-content-pro">
                        ${this.formatArticleContent(article.content || article.snippet || '')}
                    </div>

                    <div class="ch-modal-footer">
                        <button class="ch-modal-share-btn" onclick="window.CommunityHomeController?.shareArticleWhatsApp('${article.id}');">
                            <i class="fab fa-whatsapp"></i> Compartir con mi equipo
                        </button>
                        <button class="ch-modal-btn-dismiss" onclick="window.CommunityHomeController?.closeArticleModal();">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        /**
         * Cierra el modal de lectura
         */
        closeArticleModal() {
            const overlay = document.getElementById('ch-article-modal-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            document.body.style.overflow = '';
        }

        /**
         * Formatea el texto del artículo con saltos de línea y párrafos enriquecidos
         */
        formatArticleContent(rawText) {
            if (!rawText) return '';
            const paragraphs = rawText.split('\n\n');
            return paragraphs.map(p => {
                const trimmed = p.trim();
                if (!trimmed) return '';
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    const items = trimmed.split('\n').map(item => `<li>${item.replace(/^[•\-]\s*/, '')}</li>`).join('');
                    return `<ul>${items}</ul>`;
                }
                if (trimmed.startsWith('###')) {
                    return `<h4>${trimmed.replace(/^###\s*/, '')}</h4>`;
                }
                return `<p>${trimmed}</p>`;
            }).join('');
        }

        /**
         * Actualiza el grid de noticias tras cambiar de categoría
         */
        updateNewsGrid(articles, activeCategory) {
            const pillsContainer = document.getElementById('ch-filter-pills');
            const gridContainer = document.getElementById('ch-news-grid');

            if (pillsContainer) {
                pillsContainer.querySelectorAll('.ch-pill-btn').forEach(btn => {
                    const match = btn.getAttribute('onclick')?.includes(`'${activeCategory}'`);
                    btn.classList.toggle('active', !!match);
                });
            }

            if (gridContainer) {
                gridContainer.innerHTML = this.renderArticlesGrid(this.filterArticles(articles, activeCategory));
            }
        }

        /**
         * Estilos CSS avanzados, accesibles y responsivos con contraste óptimo
         */
        renderStyles() {
            return `
                <style id="community-home-custom-styles">
                    /* CONTENEDOR PRINCIPAL */
                    .community-home-wrapper {
                        background: #f8fafc;
                        color: #0f172a;
                        min-height: 100vh;
                        max-width: 1100px;
                        margin: 0 auto;
                        padding: 16px 14px 80px;
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        box-sizing: border-box;
                    }

                    /* HERO SECTION (BLOQUE OSCURO DEPORTIVO PREMIUM) */
                    .ch-hero-section {
                        position: relative;
                        background: linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #162447 100%);
                        border: 1.5px solid rgba(255, 255, 255, 0.12);
                        border-radius: 28px;
                        padding: 34px 24px 28px;
                        margin-bottom: 32px;
                        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25), 0 0 35px rgba(204, 255, 0, 0.05);
                        overflow: hidden;
                        text-align: center;
                    }

                    .ch-hero-glow {
                        position: absolute;
                        top: -60px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 320px;
                        height: 180px;
                        background: radial-gradient(ellipse, rgba(204, 255, 0, 0.18) 0%, rgba(204, 255, 0, 0) 70%);
                        pointer-events: none;
                        filter: blur(30px);
                    }

                    .ch-hero-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(204, 255, 0, 0.1);
                        border: 1px solid rgba(204, 255, 0, 0.35);
                        padding: 6px 16px;
                        border-radius: 999px;
                        margin-bottom: 16px;
                    }

                    .ch-pulse-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #CCFF00;
                        box-shadow: 0 0 10px #CCFF00;
                        animation: chPulse 1.8s infinite;
                    }

                    @keyframes chPulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.4; transform: scale(1.3); }
                    }

                    .ch-badge-text {
                        font-size: 0.68rem;
                        font-weight: 900;
                        letter-spacing: 1.2px;
                        color: #CCFF00;
                        text-transform: uppercase;
                    }

                    .ch-hero-title {
                        font-size: 2rem;
                        font-weight: 950;
                        line-height: 1.15;
                        letter-spacing: -0.5px;
                        margin: 0 0 14px;
                        color: #ffffff;
                    }

                    .ch-neon-gradient {
                        display: inline-block;
                        filter: drop-shadow(0 0 16px rgba(204, 255, 0, 0.4));
                    }

                    .ch-hero-subtitle {
                        max-width: 680px;
                        margin: 0 auto 26px;
                        font-size: 0.95rem;
                        line-height: 1.55;
                        color: #cbd5e1;
                    }

                    /* QUICK STATS */
                    .ch-stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        margin-bottom: 26px;
                    }

                    .ch-stat-card {
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        border-radius: 18px;
                        padding: 14px 10px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        transition: all 0.25s ease;
                    }

                    .ch-stat-card:hover {
                        border-color: var(--accent-color, #CCFF00);
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                    }

                    .ch-stat-icon-wrap {
                        width: 42px;
                        height: 42px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.15rem;
                        flex-shrink: 0;
                    }

                    .ch-stat-info {
                        display: flex;
                        flex-direction: column;
                        text-align: left;
                    }

                    .ch-stat-num {
                        font-size: 1.25rem;
                        font-weight: 950;
                        color: #ffffff;
                        line-height: 1;
                    }

                    .ch-stat-lbl {
                        font-size: 0.68rem;
                        font-weight: 700;
                        color: #cbd5e1;
                        margin-top: 3px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    /* HERO WHATSAPP CTA */
                    .ch-hero-cta-wrap {
                        display: flex;
                        justify-content: center;
                    }

                    .ch-btn-whatsapp-hero {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        background: #25D366;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 14px 26px;
                        border-radius: 20px;
                        box-shadow: 0 10px 28px rgba(37, 211, 102, 0.35);
                        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                        border: 1px solid rgba(255, 255, 255, 0.25);
                        max-width: 520px;
                        width: 100%;
                        box-sizing: border-box;
                        font-weight: 950;
                    }

                    .ch-btn-whatsapp-hero:hover {
                        transform: translateY(-2px) scale(1.01);
                        box-shadow: 0 14px 34px rgba(37, 211, 102, 0.5);
                    }

                    .ch-wa-pulse-icon {
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.4rem;
                        flex-shrink: 0;
                        color: #ffffff;
                    }

                    .ch-wa-text-box {
                        display: flex;
                        flex-direction: column;
                        text-align: left;
                        flex: 1;
                    }

                    .ch-wa-main-title {
                        font-weight: 950;
                        font-size: 0.88rem;
                        letter-spacing: 0.3px;
                        line-height: 1.2;
                        color: #ffffff;
                    }

                    .ch-wa-sub-title {
                        font-size: 0.72rem;
                        opacity: 0.95;
                        margin-top: 2px;
                        color: #ffffff;
                        font-weight: 600;
                    }

                    .ch-wa-arrow {
                        font-size: 1rem;
                        opacity: 0.95;
                        color: #ffffff;
                        transition: transform 0.2s ease;
                    }

                    .ch-btn-whatsapp-hero:hover .ch-wa-arrow {
                        transform: translateX(4px);
                    }

                    /* SECTION GENERAL */
                    .ch-section-header {
                        margin-bottom: 18px;
                    }

                    .ch-section-title {
                        font-size: 1.25rem !important;
                        font-weight: 950 !important;
                        letter-spacing: 0.3px;
                        color: #0f172a !important;
                        margin: 0 0 6px;
                        display: flex;
                        align-items: center;
                    }

                    .ch-section-subtitle {
                        font-size: 0.85rem !important;
                        font-weight: 600 !important;
                        color: #475569 !important;
                        margin: 0;
                    }

                    /* HUB GRID (SUBSECCIONES) */
                    .ch-hub-section {
                        margin-bottom: 36px;
                    }

                    .ch-hub-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 16px;
                    }

                    .ch-hub-card {
                        background: #ffffff !important;
                        border: 1.5px solid #e2e8f0 !important;
                        border-radius: 22px;
                        padding: 22px 20px;
                        cursor: pointer;
                        position: relative;
                        overflow: hidden;
                        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06) !important;
                    }

                    .ch-hub-card:hover {
                        border-color: #cbd5e1 !important;
                        transform: translateY(-4px);
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12) !important;
                    }

                    .ch-hub-card-featured {
                        background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                        border: 2px solid #0284c7 !important;
                        box-shadow: 0 6px 24px rgba(2, 132, 199, 0.12) !important;
                    }

                    .ch-hub-card-featured:hover {
                        border-color: #0369a1 !important;
                        box-shadow: 0 14px 32px rgba(2, 132, 199, 0.2) !important;
                    }

                    .ch-hub-card-featured .ch-hub-card-title {
                        color: #0369a1 !important;
                        font-weight: 950 !important;
                    }

                    .ch-hub-card-featured .ch-hub-card-desc {
                        color: #0f172a !important;
                        font-weight: 500 !important;
                    }

                    .ch-hub-card-featured .ch-hub-action-lbl {
                        color: #0284c7 !important;
                        font-weight: 950 !important;
                    }

                    .ch-hub-card-featured .ch-hub-card-arrow {
                        color: #0284c7 !important;
                    }

                    .ch-hub-card-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 14px;
                    }

                    .ch-hub-icon-box {
                        width: 44px;
                        height: 44px;
                        border-radius: 14px;
                        border: 1px solid;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                    }

                    .ch-hub-badge {
                        font-size: 0.65rem;
                        font-weight: 900;
                        padding: 4px 10px;
                        border-radius: 999px;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }

                    .ch-hub-card-title {
                        font-size: 1.15rem !important;
                        font-weight: 950 !important;
                        color: #0f172a !important;
                        margin: 0 0 8px;
                    }

                    .ch-hub-card-desc {
                        font-size: 0.86rem !important;
                        font-weight: 500 !important;
                        line-height: 1.55;
                        color: #334155 !important;
                        margin: 0 0 16px;
                        flex: 1;
                    }

                    .ch-hub-card-footer {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-top: 12px;
                        border-top: 1.5px solid #f1f5f9 !important;
                    }

                    .ch-hub-action-lbl {
                        font-size: 0.84rem !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                    }

                    .ch-hub-card-arrow {
                        font-size: 0.85rem;
                        color: #0284c7;
                        transition: transform 0.2s ease;
                    }

                    .ch-hub-card:hover .ch-hub-card-arrow {
                        transform: translateX(4px);
                    }

                    /* NOTICIAS */
                    .ch-news-section {
                        margin-bottom: 36px;
                    }

                    .ch-filter-pills {
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        padding: 2px 2px 16px;
                        scrollbar-width: none;
                    }

                    .ch-filter-pills::-webkit-scrollbar {
                        display: none;
                    }

                    .ch-pill-btn {
                        background: #ffffff !important;
                        border: 1.5px solid #cbd5e1 !important;
                        color: #334155 !important;
                        padding: 8px 16px;
                        border-radius: 999px;
                        font-size: 0.78rem;
                        font-weight: 800;
                        cursor: pointer;
                        white-space: nowrap;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s ease;
                        font-family: inherit;
                        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
                    }

                    .ch-pill-btn:hover {
                        background: #f1f5f9 !important;
                        color: #0f172a !important;
                        border-color: #94a3b8 !important;
                    }

                    .ch-pill-btn.active {
                        background: #0f172a !important;
                        color: #CCFF00 !important;
                        border-color: #0f172a !important;
                        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15) !important;
                    }

                    .ch-news-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 16px;
                    }

                    .ch-empty-news {
                        grid-column: 1 / -1;
                        padding: 40px 20px;
                        text-align: center;
                        background: #ffffff;
                        border: 1.5px dashed #cbd5e1;
                        border-radius: 20px;
                        color: #64748b;
                    }

                    .ch-news-card {
                        background: #ffffff !important;
                        border: 1.5px solid #e2e8f0 !important;
                        box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05) !important;
                        border-radius: 20px;
                        overflow: hidden;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .ch-news-card:hover {
                        border-color: #cbd5e1 !important;
                        transform: translateY(-4px);
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1) !important;
                    }

                    .ch-news-cover {
                        height: 120px;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 12px;
                        box-sizing: border-box;
                    }

                    .ch-news-category-tag {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        font-size: 0.62rem;
                        font-weight: 900;
                        padding: 3px 10px;
                        border-radius: 999px;
                        border: 1px solid;
                        letter-spacing: 0.4px;
                    }

                    .ch-news-cover-emoji {
                        font-size: 2.8rem;
                        filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
                    }

                    .ch-news-body {
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                    }

                    .ch-news-meta {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-size: 0.72rem !important;
                        font-weight: 700 !important;
                        color: #64748b !important;
                        margin-bottom: 8px;
                    }

                    .ch-news-title {
                        font-size: 1.05rem !important;
                        font-weight: 950 !important;
                        color: #0f172a !important;
                        line-height: 1.35;
                        margin: 0 0 8px;
                    }

                    .ch-news-snippet {
                        font-size: 0.84rem !important;
                        font-weight: 500;
                        line-height: 1.55;
                        color: #334155 !important;
                        margin: 0 0 16px;
                        flex: 1;
                    }

                    .ch-news-footer {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-top: 12px;
                        border-top: 1.5px solid #f1f5f9;
                    }

                    .ch-news-readmore {
                        font-size: 0.82rem !important;
                        font-weight: 900 !important;
                        color: #0284c7 !important;
                    }

                    .ch-news-arrow {
                        font-size: 0.82rem;
                        color: #0284c7 !important;
                        transition: transform 0.2s ease;
                    }

                    .ch-news-card:hover .ch-news-arrow {
                        transform: translateX(4px);
                    }

                    /* PILARES / CÓDIGO DE HONOR */
                    .ch-values-section {
                        margin-bottom: 36px;
                    }

                    .ch-values-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 14px;
                    }

                    .ch-value-card {
                        background: #ffffff !important;
                        border: 1.5px solid #e2e8f0 !important;
                        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04) !important;
                        border-radius: 18px;
                        padding: 20px 16px;
                        text-align: center;
                        transition: all 0.25s ease;
                    }

                    .ch-value-card:hover {
                        background: #ffffff !important;
                        border-color: #cbd5e1 !important;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
                    }

                    .ch-value-icon {
                        font-size: 2.2rem;
                        margin-bottom: 10px;
                    }

                    .ch-value-card h4 {
                        font-size: 1rem !important;
                        font-weight: 950 !important;
                        color: #0f172a !important;
                        margin: 0 0 8px;
                    }

                    .ch-value-card p {
                        font-size: 0.84rem !important;
                        line-height: 1.55;
                        color: #334155 !important;
                        margin: 0;
                    }

                    /* CONTACTO / SUGERENCIAS */
                    .ch-contact-section {
                        margin-bottom: 24px;
                    }

                    .ch-contact-card {
                        background: linear-gradient(135deg, #0b1329 0%, #0f172a 100%) !important;
                        border: 1.5px solid rgba(255, 255, 255, 0.12);
                        border-radius: 24px;
                        padding: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 20px;
                        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.18);
                    }

                    .ch-contact-content {
                        flex: 1;
                    }

                    .ch-contact-badge {
                        display: inline-block;
                        background: rgba(204, 255, 0, 0.15);
                        color: #CCFF00;
                        font-size: 0.68rem;
                        font-weight: 900;
                        padding: 4px 12px;
                        border-radius: 6px;
                        letter-spacing: 0.6px;
                        margin-bottom: 10px;
                    }

                    .ch-contact-card h3 {
                        font-size: 1.25rem;
                        font-weight: 950 !important;
                        color: #ffffff !important;
                        margin: 0 0 8px;
                    }

                    .ch-contact-card p {
                        font-size: 0.86rem;
                        line-height: 1.55;
                        color: #cbd5e1 !important;
                        margin: 0 0 18px;
                        max-width: 580px;
                    }

                    .ch-contact-actions {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                    }

                    .ch-contact-btn {
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-weight: 900;
                        font-size: 0.8rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s ease;
                        font-family: inherit;
                        border: none;
                    }

                    .ch-contact-btn-wa {
                        background: #25D366;
                        color: #ffffff;
                        font-weight: 950;
                    }

                    .ch-contact-btn-wa:hover {
                        background: #20ba59;
                        transform: translateY(-2px);
                    }

                    .ch-contact-btn-outline {
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #ffffff;
                        font-weight: 800;
                    }

                    .ch-contact-btn-outline:hover {
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .ch-contact-visual {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: rgba(204, 255, 0, 0.12);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.2rem;
                        color: #CCFF00;
                        flex-shrink: 0;
                    }

                    /* MODAL ARTICLE */
                    .ch-modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(3, 7, 18, 0.82);
                        backdrop-filter: blur(14px);
                        -webkit-backdrop-filter: blur(14px);
                        z-index: 100000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 16px;
                        box-sizing: border-box;
                        animation: chFadeIn 0.2s ease-out;
                    }

                    @keyframes chFadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .ch-modal-container {
                        background: #ffffff !important;
                        border: 1.5px solid #e2e8f0 !important;
                        border-radius: 24px;
                        max-width: 620px;
                        width: 100%;
                        max-height: 88vh;
                        overflow-y: auto;
                        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35) !important;
                        position: relative;
                        animation: chScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes chScaleIn {
                        from { transform: scale(0.94); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }

                    .ch-modal-header {
                        height: 140px;
                        position: relative;
                        display: flex;
                        align-items: flex-end;
                        padding: 20px;
                        box-sizing: border-box;
                    }

                    .ch-modal-close-btn {
                        position: absolute;
                        top: 14px;
                        right: 14px;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: rgba(0, 0, 0, 0.6);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.2s ease;
                    }

                    .ch-modal-close-btn:hover {
                        background: #ef4444;
                        transform: scale(1.1);
                    }

                    .ch-modal-header-badge {
                        font-size: 0.68rem;
                        font-weight: 950;
                        padding: 4px 12px;
                        border-radius: 999px;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }

                    .ch-modal-header-emoji {
                        position: absolute;
                        right: 24px;
                        bottom: 14px;
                        font-size: 3.5rem;
                        opacity: 0.9;
                    }

                    .ch-modal-body {
                        padding: 24px;
                    }

                    .ch-modal-meta-row {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        font-size: 0.74rem;
                        color: #64748b !important;
                        margin-bottom: 12px;
                        flex-wrap: wrap;
                        font-weight: 600;
                    }

                    .ch-modal-title {
                        font-size: 1.35rem;
                        font-weight: 950 !important;
                        color: #0f172a !important;
                        line-height: 1.25;
                        margin: 0 0 18px;
                    }

                    .ch-modal-content-pro {
                        font-size: 0.9rem;
                        line-height: 1.7;
                        color: #1e293b !important;
                        margin-bottom: 24px;
                    }

                    .ch-modal-content-pro p {
                        margin: 0 0 14px;
                        color: #1e293b !important;
                    }

                    .ch-modal-content-pro ul {
                        margin: 0 0 16px;
                        padding-left: 20px;
                        color: #1e293b !important;
                    }

                    .ch-modal-content-pro li {
                        margin-bottom: 6px;
                    }

                    .ch-modal-content-pro h4 {
                        font-size: 1rem;
                        font-weight: 950;
                        color: #0f172a !important;
                        margin: 18px 0 8px;
                    }

                    .ch-modal-footer {
                        display: flex;
                        align-items: center;
                        justify-content: flex-end;
                        gap: 12px;
                        padding-top: 18px;
                        border-top: 1.5px solid #f1f5f9;
                    }

                    .ch-modal-share-btn {
                        background: #25D366;
                        color: #ffffff;
                        border: none;
                        padding: 10px 18px;
                        border-radius: 12px;
                        font-weight: 950;
                        font-size: 0.82rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s ease;
                        font-family: inherit;
                    }

                    .ch-modal-share-btn:hover {
                        background: #20ba59;
                        transform: translateY(-2px);
                    }

                    .ch-modal-btn-dismiss {
                        background: #f1f5f9 !important;
                        border: 1px solid #cbd5e1 !important;
                        color: #334155 !important;
                        padding: 10px 18px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.82rem;
                        cursor: pointer;
                        font-family: inherit;
                        transition: all 0.2s ease;
                    }

                    .ch-modal-btn-dismiss:hover {
                        background: #e2e8f0 !important;
                        color: #0f172a !important;
                    }

                    /* RESPONSIVE QUERIES */
                    @media (max-width: 900px) {
                        .ch-stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .ch-hub-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .ch-news-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .ch-values-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .ch-contact-card {
                            flex-direction: column;
                            text-align: center;
                        }
                        .ch-contact-actions {
                            justify-content: center;
                        }
                        .ch-contact-visual {
                            display: none;
                        }
                    }

                    @media (max-width: 580px) {
                        .community-home-wrapper {
                            padding: 12px 10px 70px;
                        }
                        .ch-hero-section {
                            padding: 24px 16px 20px;
                            border-radius: 22px;
                            margin-bottom: 24px;
                        }
                        .ch-hero-title {
                            font-size: 1.45rem;
                        }
                        .ch-hero-subtitle {
                            font-size: 0.85rem;
                        }
                        .ch-stats-grid {
                            grid-template-columns: 1fr;
                            gap: 8px;
                        }
                        .ch-hub-grid {
                            grid-template-columns: 1fr;
                            gap: 12px;
                        }
                        .ch-news-grid {
                            grid-template-columns: 1fr;
                        }
                        .ch-values-grid {
                            grid-template-columns: 1fr;
                        }
                        .ch-btn-whatsapp-hero {
                            padding: 12px 16px;
                        }
                        .ch-wa-pulse-icon {
                            width: 36px;
                            height: 36px;
                            font-size: 1.15rem;
                        }
                        .ch-wa-main-title {
                            font-size: 0.78rem;
                        }
                        .ch-wa-sub-title {
                            font-size: 0.68rem;
                        }
                    }
                </style>
            `;
        }
    }

    global.CommunityHomeView = new CommunityHomeView();
})(window);
