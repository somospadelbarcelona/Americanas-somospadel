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
                    <!-- HERO SECTION: Tarjeta deportiva de élite -->
                    <header class="ch-hero-section">
                        <div class="ch-hero-glow"></div>
                        <div class="ch-hero-badge">
                            <span class="ch-pulse-dot"></span>
                            <span class="ch-badge-text">HUB OFICIAL SOMOSPADEL BARCELONA</span>
                        </div>
                        <div class="ch-hero-title-row">
                            <h1 class="ch-hero-title">
                                COMUNIDAD SOMOSPADEL
                            </h1>
                            <button type="button" 
                                    class="ch-hero-dropdown-btn" 
                                    id="ch-hero-dropdown-btn" 
                                    onclick="window.CommunityHomeView?.toggleDropdown(event);" 
                                    aria-expanded="false" 
                                    title="Ver desplegable de secciones">
                                <i class="fas fa-layer-group"></i>
                                <span>Ver Desplegable</span>
                                <i class="fas fa-chevron-down ch-hero-dropdown-chevron" id="ch-hero-dropdown-chevron"></i>
                            </button>
                        </div>

                        <!-- DESPLEGABLE EVOLUCIONADO DE SECCIONES (SÓLO CUANDO SE CLICA EL BOTÓN) -->
                        <div id="ch-hero-dropdown-panel" class="ch-hero-dropdown-panel" style="display: none;">
                            <div class="ch-dp-header">
                                <div class="ch-dp-header-left">
                                    <span class="ch-dp-pulse-dot"></span>
                                    <span class="ch-dp-header-title">SUBSECCIONES OFICIALES</span>
                                </div>
                                <button type="button" class="ch-dp-close-btn" onclick="window.CommunityHomeView?.closeDropdown();" title="Cerrar desplegable">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            <div class="ch-dp-options">
                                <!-- 0. CHAT GENERAL DE LA COMUNIDAD -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('chat');" style="--dp-accent: #10b981; --dp-accent-bg: rgba(16, 185, 129, 0.16);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-comments"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">CHAT GENERAL COMUNIDAD</span>
                                            <span class="ch-dp-badge ch-dp-badge-online">
                                                <span class="ch-dp-badge-dot"></span> ONLINE
                                            </span>
                                        </div>
                                        <div class="ch-dp-desc">Habla con todos los integrantes de SomosPadel</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 1. INICIO COMUNIDAD -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('comunidad');" style="--dp-accent: #CCFF00; --dp-accent-bg: rgba(204, 255, 0, 0.16);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-home"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">1. INICIO COMUNIDAD</span>
                                            <span class="ch-dp-badge ch-dp-badge-active">ACTUAL</span>
                                        </div>
                                        <div class="ch-dp-desc">Hub oficial, noticias y código de honor</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 2. ENTRENOS -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('entrenos');" style="--dp-accent: #ff007f; --dp-accent-bg: rgba(255, 0, 127, 0.16);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-dumbbell"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">2. ENTRENOS</span>
                                        </div>
                                        <div class="ch-dp-desc">Convocatorias y sesiones semanales</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 3. EQUIPOS -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('equipos');" style="--dp-accent: #38bdf8; --dp-accent-bg: rgba(56, 189, 248, 0.16);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-shield-alt"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">3. EQUIPOS</span>
                                            <span class="ch-dp-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">7 EQUIPOS</span>
                                        </div>
                                        <div class="ch-dp-desc">Liga, clasificaciones y plantillas</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 4. MI EQUIPO (DIRECTO) -->
                                <div class="ch-dp-item ch-dp-item-highlight" onclick="window.CommunityHomeView?.handleDropdownNav('my_team');" style="--dp-accent: #ff5e00; --dp-accent-bg: rgba(255, 94, 0, 0.18);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-users-cog"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title" style="color: #ff8c42;">4. MI EQUIPO</span>
                                            <span class="ch-dp-badge ch-dp-badge-direct">DIRECTO</span>
                                        </div>
                                        <div class="ch-dp-desc">Tu plantilla, alineación y partidos</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 5. INSCRIPCIONES 27/28 -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('inscriptions');" style="--dp-accent: ${campaignActive ? '#059669' : '#ef4444'}; --dp-accent-bg: ${campaignActive ? 'rgba(5, 150, 105, 0.16)' : 'rgba(239, 68, 68, 0.16)'};">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-file-signature"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">5. INSCRIPCIONES 27/28</span>
                                            <span class="ch-dp-badge" style="background: ${campaignActive ? '#059669' : '#ef4444'}; color: #fff;">
                                                ${campaignActive ? 'ABIERTA' : 'DESACTIVADA'}
                                            </span>
                                        </div>
                                        <div class="ch-dp-desc">Convocatoria oficial para la nueva temporada</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 6. MI AGENDA -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('agenda');" style="--dp-accent: #16a34a; --dp-accent-bg: rgba(22, 163, 74, 0.16);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">6. MI AGENDA</span>
                                        </div>
                                        <div class="ch-dp-desc">Tus convocatorias, partidos y avisos</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>

                                <!-- 7. RÉCORDS & MVP -->
                                <div class="ch-dp-item" onclick="window.CommunityHomeView?.handleDropdownNav('records');" style="--dp-accent: #a855f7; --dp-accent-bg: rgba(168, 85, 247, 0.16);">
                                    <div class="ch-dp-icon-box">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div class="ch-dp-text-box">
                                        <div class="ch-dp-title-row">
                                            <span class="ch-dp-title">7. RÉCORDS & MVP</span>
                                            <span class="ch-dp-badge" style="background: rgba(168, 85, 247, 0.25); color: #c084fc;">HALL OF FAME</span>
                                        </div>
                                        <div class="ch-dp-desc">Ranking histórico, MVPs y leyendas</div>
                                    </div>
                                    <i class="fas fa-chevron-right ch-dp-arrow"></i>
                                </div>
                            </div>
                        </div>
                        <p class="ch-hero-subtitle">
                            El punto de encuentro oficial del club: convocatorias de entrenos, ligas federadas, vestuario y tercer tiempo.
                        </p>

                        <!-- QUICK STATS / KPIS (Compacto, elegante y equilibrado) -->
                        <div class="ch-stats-grid">
                            <div class="ch-stat-card" style="--accent-color: #a78bfa;">
                                <div class="ch-stat-icon-wrap" style="color: #c4b5fd; background: rgba(167, 139, 250, 0.18);">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">${stats.totalPlayers || '191'}</span>
                                    <span class="ch-stat-lbl">Jugadores</span>
                                </div>
                            </div>

                            <div class="ch-stat-card" style="--accent-color: #f97316;">
                                <div class="ch-stat-icon-wrap" style="color: #fdba74; background: rgba(249, 115, 22, 0.18);">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">${stats.totalTeams || '7'}</span>
                                    <span class="ch-stat-lbl">Equipos Liga</span>
                                </div>
                            </div>

                            <div class="ch-stat-card" style="--accent-color: #ec4899;">
                                <div class="ch-stat-icon-wrap" style="color: #f472b6; background: rgba(236, 72, 153, 0.18);">
                                    <i class="fas fa-dumbbell"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">${stats.activeEntrenos || 'Semanal'}</span>
                                    <span class="ch-stat-lbl">Entrenos</span>
                                </div>
                            </div>

                            <div class="ch-stat-card" style="--accent-color: #0ea5e9;">
                                <div class="ch-stat-icon-wrap" style="color: #38bdf8; background: rgba(14, 165, 233, 0.18);">
                                    <i class="fas fa-handshake"></i>
                                </div>
                                <div class="ch-stat-info">
                                    <span class="ch-stat-num">100%</span>
                                    <span class="ch-stat-lbl">Fair Play</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <!-- SECCIÓN 2: HUB DE SUBSECCIONES (BANNER INTERACTIVO + ACCESOS DIRECTOS) -->
                    <section class="ch-hub-section">
                        <div class="ch-section-header ch-hub-header">
                            <div class="ch-section-badge-pill">
                                <i class="fas fa-th-large"></i> HERRAMIENTAS & CONVOCATORIAS
                            </div>
                            <h2 class="ch-section-title">
                                Subsecciones de la Comunidad
                            </h2>
                            <p class="ch-section-subtitle">Explora todo el club: convocatorias, ligas, vestuario y actualidad</p>
                        </div>

                        <!-- BANNER DINÁMICO INTERACTIVO TIPO CARRUSEL (SUBSECCIONES) -->
                        <div class="ch-subsections-banner-widget" id="ch-subsections-banner-widget">
                            <div class="ch-sb-container" id="ch-sb-container">
                                <!-- Renderizado dinámicamente por renderBannerSlide() -->
                            </div>
                            <!-- Controles y Paginación interactiva -->
                            <div class="ch-sb-controls">
                                <button type="button" class="ch-sb-arrow-btn" onclick="window.CommunityHomeView?.prevBannerSlide(true);" aria-label="Sección anterior">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <div class="ch-sb-indicators" id="ch-sb-indicators">
                                    <!-- Dots dinámicos -->
                                </div>
                                <button type="button" class="ch-sb-arrow-btn" onclick="window.CommunityHomeView?.nextBannerSlide(true);" aria-label="Siguiente sección">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>

                        <div class="ch-hub-grid">
                            <!-- 1. ENTRENOS -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('entrenos');" style="--card-theme: #db2777;">
                                <div class="ch-hub-card-top">
                                    <div class="ch-hub-icon-box" style="background: rgba(219, 39, 119, 0.12); color: #db2777; border-color: rgba(219, 39, 119, 0.25);">
                                        <i class="fas fa-dumbbell"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8;">
                                        Abierto
                                    </span>
                                </div>
                                <div class="ch-hub-card-info">
                                    <h3 class="ch-hub-card-title">🎾 Entrenos</h3>
                                    <p class="ch-hub-card-sub">Sesiones semanales</p>
                                </div>
                            </div>

                            <!-- 2. EQUIPOS DE LIGA -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('equipos');" style="--card-theme: #ea580c;">
                                <div class="ch-hub-card-top">
                                    <div class="ch-hub-icon-box" style="background: rgba(234, 88, 12, 0.12); color: #ea580c; border-color: rgba(234, 88, 12, 0.25);">
                                        <i class="fas fa-shield-alt"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;">
                                        7 Equipos
                                    </span>
                                </div>
                                <div class="ch-hub-card-info">
                                    <h3 class="ch-hub-card-title">👥 Equipos Liga</h3>
                                    <p class="ch-hub-card-sub">SNP & FCFP</p>
                                </div>
                            </div>

                            <!-- 3. MI EQUIPO (DESTACADO / ACCESO DIRECTO VIP) -->
                            <div class="ch-hub-card ch-hub-card-featured" onclick="window.CommunityHomeController?.navigateTo('my_team');" style="--card-theme: #0284c7;">
                                <div class="ch-hub-card-top">
                                    <div class="ch-hub-icon-box" style="background: rgba(2, 132, 199, 0.15); color: #0284c7; border-color: rgba(2, 132, 199, 0.35);">
                                        <i class="fas fa-users-cog"></i>
                                    </div>
                                    <span class="ch-hub-badge ch-badge-featured">
                                        ⚡ Directo
                                    </span>
                                </div>
                                <div class="ch-hub-card-info">
                                    <h3 class="ch-hub-card-title">🛡️ Mi Vestuario</h3>
                                    <p class="ch-hub-card-sub">Alineación y táctica</p>
                                </div>
                            </div>

                            <!-- 4. MI AGENDA -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('agenda');" style="--card-theme: #16a34a;">
                                <div class="ch-hub-card-top">
                                    <div class="ch-hub-icon-box" style="background: rgba(22, 163, 74, 0.12); color: #16a34a; border-color: rgba(22, 163, 74, 0.25);">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7;">
                                        Agenda
                                    </span>
                                </div>
                                <div class="ch-hub-card-info">
                                    <h3 class="ch-hub-card-title">📅 Mi Agenda</h3>
                                    <p class="ch-hub-card-sub">Partidos y fechas</p>
                                </div>
                            </div>

                            <!-- 5. INSCRIPCIONES 27/28 -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('inscriptions');" style="--card-theme: ${campaignActive ? '#059669' : '#64748b'};">
                                <div class="ch-hub-card-top">
                                    <div class="ch-hub-icon-box" style="background: ${campaignActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(100, 116, 139, 0.12)'}; color: ${campaignActive ? '#047857' : '#64748b'}; border-color: ${campaignActive ? 'rgba(5, 150, 105, 0.25)' : 'rgba(100, 116, 139, 0.25)'};">
                                        <i class="fas fa-file-signature"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: ${campaignActive ? '#ecfdf5' : '#f1f5f9'}; color: ${campaignActive ? '#047857' : '#475569'}; border: 1px solid ${campaignActive ? '#a7f3d0' : '#e2e8f0'};">
                                        ${campaignActive ? '🟢 Activa' : 'Próxima'}
                                    </span>
                                </div>
                                <div class="ch-hub-card-info">
                                    <h3 class="ch-hub-card-title">📝 Inscripciones</h3>
                                    <p class="ch-hub-card-sub">Temporada 27/28</p>
                                </div>
                            </div>

                            <!-- 6. RÉCORDS TEMPORADA -->
                            <div class="ch-hub-card" onclick="window.CommunityHomeController?.navigateTo('records');" style="--card-theme: #7e22ce;">
                                <div class="ch-hub-card-top">
                                    <div class="ch-hub-icon-box" style="background: rgba(126, 34, 206, 0.12); color: #7e22ce; border-color: rgba(126, 34, 206, 0.25);">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <span class="ch-hub-badge" style="background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff;">
                                        Hall of Fame
                                    </span>
                                </div>
                                <div class="ch-hub-card-info">
                                    <h3 class="ch-hub-card-title">🏆 Récords & MVP</h3>
                                    <p class="ch-hub-card-sub">Muro de honor</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- SECCIÓN 3: NOTICIAS & ACTUALIDAD DE LA COMUNIDAD -->
                    <section class="ch-news-section">
                        <div class="ch-section-header ch-news-header">
                            <div class="ch-section-badge-pill">
                                <i class="fas fa-newspaper"></i> ACTUALIDAD
                            </div>
                            <h2 class="ch-section-title">
                                Noticias y Actualidad del Club
                            </h2>
                            <p class="ch-section-subtitle">Últimas novedades, crónicas de partidos, directrices de capitanía y vida del club</p>
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
                            <div class="ch-section-badge-pill" style="color: #059669; background: #ecfdf5; border-color: #a7f3d0;">
                                <i class="fas fa-award"></i> VALORES SOMOSPADEL
                            </div>
                            <h2 class="ch-section-title">
                                CÓDIGO DE HONOR SOMOSPADEL
                            </h2>
                            <p class="ch-section-subtitle">Los cuatro pilares que definen el orgullo y el respeto de vestir nuestra camiseta</p>
                        </div>

                        <div class="ch-values-grid">
                            <div class="ch-value-card">
                                <div class="ch-value-top-row">
                                    <span class="ch-value-step">01</span>
                                    <div class="ch-value-icon">⚖️</div>
                                </div>
                                <h4>Fair Play & Duda Arbitral</h4>
                                <p>En caso de duda en una bola dudosa, <strong>siempre se repite el punto</strong> o se concede al rival. La honestidad deportiva define al verdadero campeón.</p>
                            </div>

                            <div class="ch-value-card">
                                <div class="ch-value-top-row">
                                    <span class="ch-value-step">02</span>
                                    <div class="ch-value-icon">🤝</div>
                                </div>
                                <h4>Apoyo Total a la Pareja</h4>
                                <p>Cero reproches en la pista. Si el compañero falla, choque de palas y cabeza arriba. El pádel se gana construyendo confianza mutua en cada punto.</p>
                            </div>

                            <div class="ch-value-card">
                                <div class="ch-value-top-row">
                                    <span class="ch-value-step">03</span>
                                    <div class="ch-value-icon">⏱️</div>
                                </div>
                                <h4>Puntualidad & Compromiso</h4>
                                <p>Llegar con 15 minutos de antelación para calentar y respetar las convocatorias. Tu equipo cuenta contigo y el tiempo de los demás es sagrado.</p>
                            </div>

                            <div class="ch-value-card">
                                <div class="ch-value-top-row">
                                    <span class="ch-value-step">04</span>
                                    <div class="ch-value-icon">🍻</div>
                                </div>
                                <h4>El Tercer Tiempo</h4>
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

                    <!-- SECCIÓN 6: CANALES OFICIALES & COMUNIDAD EN REDES -->
                    <section class="ch-social-showcase-section">
                        <div class="ch-section-header">
                            <div class="ch-section-badge-pill" style="color: #059669; background: #ecfdf5; border-color: #a7f3d0;">
                                <i class="fab fa-whatsapp"></i> CANALES OFICIALES & REDES
                            </div>
                            <h2 class="ch-section-title">
                                SOMOSPADEL EN REDES SOCIALES & CANALES OFICIALES
                            </h2>
                            <p class="ch-section-subtitle">Únete al grupo de WhatsApp para avisos urgentes, fotos de las americanas y el tercer tiempo</p>
                        </div>

                        <div class="ch-social-banner-box">
                            <div class="ch-social-banner-glow"></div>

                            <!-- BANNER DESTACADO: GRUPO OFICIAL DE WHATSAPP -->
                            <a href="${whatsappGroupLink || 'https://wa.me/34649219350?text=Hola%20Alex,%20quiero%20unirme%20al%20grupo%20oficial%20de%20la%20Comunidad%20SomosPadel'}"
                               target="_blank" rel="noopener noreferrer"
                               class="ch-btn-whatsapp-hero"
                               style="margin-bottom: 22px;"
                               onclick="window.PlayerView?.haptic?.(25);">
                                <div class="ch-wa-pulse-icon">
                                    <i class="fab fa-whatsapp"></i>
                                </div>
                                <div class="ch-wa-text-box">
                                    <div class="ch-wa-headline">
                                        <span class="ch-wa-main-title">GRUPO OFICIAL DE WHATSAPP</span>
                                        <span class="ch-wa-badge-pill"><span class="ch-dot-live"></span> OFICIAL</span>
                                    </div>
                                    <span class="ch-wa-sub-title">Noticias en directo, sustituciones urgentes y tercer tiempo</span>
                                </div>
                                <div class="ch-wa-arrow-box">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            </a>

                            <div class="ch-social-banner-header">
                                <div>
                                    <span class="ch-social-banner-pill">
                                        📸 SÉ PROTAGONISTA
                                    </span>
                                    <h3 class="ch-social-banner-title">
                                        ¡Etiquétanos y sal en la app!
                                    </h3>
                                    <p class="ch-social-banner-desc">
                                        Sube tus fotos y vídeos mencionando a <strong style="color: #CCFF00;">@somospadelbarcelona_</strong> con el hashtag <strong style="color: #38bdf8;">#SomosPadelBCN</strong>.
                                    </p>
                                </div>
                                <button type="button" onclick="window.SocialChannelsService?.copyTag(this)" class="ch-social-copy-btn">
                                    <i class="fas fa-copy"></i> Copiar @somospadelbarcelona_
                                </button>
                            </div>

                            <div class="ch-social-cards-duo">
                                <!-- Instagram Box -->
                                <div onclick="window.openClubInstagram ? window.openClubInstagram() : window.open('https://www.instagram.com/somospadelbarcelona_/?hl=es', '_blank')"
                                     class="ch-social-card-item ch-card-ig-item">
                                    <div class="ch-social-card-top">
                                        <div class="ch-social-card-avatar ch-avatar-ig">
                                            <i class="fab fa-instagram"></i>
                                        </div>
                                        <div>
                                            <div class="ch-social-card-name">Instagram Oficial</div>
                                            <div class="ch-social-card-sub ch-sub-ig">@somospadelbarcelona_</div>
                                        </div>
                                    </div>
                                    <p class="ch-social-card-text">
                                        Fotos oficiales de tus partidos, los mejores puntazos en Reels y todos los podios de cada fin de semana.
                                    </p>
                                    <div class="ch-social-card-cta ch-cta-ig">
                                        <span>Seguir en Instagram</span>
                                        <i class="fas fa-arrow-right"></i>
                                    </div>
                                </div>

                                <!-- Facebook Box -->
                                <div onclick="window.openClubFacebook ? window.openClubFacebook() : window.open('https://www.facebook.com/?locale=es_ES', '_blank')"
                                     class="ch-social-card-item ch-card-fb-item">
                                    <div class="ch-social-card-top">
                                        <div class="ch-social-card-avatar ch-avatar-fb">
                                            <i class="fab fa-facebook-f"></i>
                                        </div>
                                        <div>
                                            <div class="ch-social-card-name">Facebook Oficial</div>
                                            <div class="ch-social-card-sub ch-sub-fb">Somos Padel Barcelona</div>
                                        </div>
                                    </div>
                                    <p class="ch-social-card-text">
                                        Álbumes completos de torneos en alta definición, eventos del club y toda la actualidad de la comunidad.
                                    </p>
                                    <div class="ch-social-card-cta ch-cta-fb">
                                        <span>Visitar Facebook</span>
                                        <i class="fas fa-arrow-right"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- BANNER CONCURSO MENSUAL: FOTO & PUNTAZO DEL MES -->
                            <div class="ch-social-contest-box">
                                <div class="ch-social-contest-left">
                                    <div class="ch-social-contest-trophy">🏆</div>
                                    <div>
                                        <div class="ch-social-contest-tag">
                                            Concurso Mensual de la Comunidad
                                        </div>
                                        <div class="ch-social-contest-title">
                                            El Puntazo y La Foto del Mes
                                        </div>
                                        <div class="ch-social-contest-desc">
                                            Gana una <strong>Americana gratis</strong> participando en Instagram con <strong style="color: #38bdf8;">#SomosPadelBCN</strong>.
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onclick="window.openSocialContestModal ? window.openSocialContestModal() : null" class="ch-social-contest-btn">
                                    <i class="fas fa-trophy"></i> Ver Bases & Participar
                                </button>
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

            // Inicializar carrusel dinámico auto-play de subsecciones
            this.initSubsectionsBanner(campaignActive);
        }

        /**
         * Inicializa el carrusel dinámico de subsecciones
         */
        initSubsectionsBanner(campaignActive = false) {
            this.destroy();

            this._slides = [
                {
                    id: 'entrenos',
                    icon: 'fa-dumbbell',
                    theme: '#db2777',
                    themeBg: 'rgba(219, 39, 119, 0.16)',
                    badge: '🎾 CONVOCATORIAS ABIERTAS',
                    badgeBg: '#fdf2f8',
                    badgeColor: '#be185d',
                    title: '2. Entrenos Semanales',
                    desc: 'Sesiones semanales en pista organizadas por capitanes para mejorar técnica individual y cohesión de equipo.',
                    cta: 'Ver Entrenos Abiertos',
                    action: "window.CommunityHomeController?.navigateTo('entrenos');"
                },
                {
                    id: 'equipos',
                    icon: 'fa-shield-alt',
                    theme: '#ea580c',
                    themeBg: 'rgba(234, 88, 12, 0.16)',
                    badge: '👥 LIGA SNP & FCFP',
                    badgeBg: '#fff7ed',
                    badgeColor: '#c2410c',
                    title: '3. Equipos de Liga',
                    desc: 'Nuestras 7 plantillas oficiales compitiendo en ligas federadas: Femeninos, Mixtos y Masculinos. Actas y rivales.',
                    cta: 'Explorar Equipos y Plantillas',
                    action: "window.CommunityHomeController?.navigateTo('equipos');"
                },
                {
                    id: 'my_team',
                    icon: 'fa-users-cog',
                    theme: '#0284c7',
                    themeBg: 'rgba(2, 132, 199, 0.18)',
                    badge: '⚡ ACCESO VIP DIRECTO',
                    badgeBg: '#f0f9ff',
                    badgeColor: '#0369a1',
                    title: '4. Mi Vestuario',
                    desc: 'Tu vestuario inteligente: confirma tu asistencia a la próxima serie, consulta tu pareja asignada y la táctica.',
                    cta: 'Entrar a Mi Vestuario',
                    action: "window.CommunityHomeController?.navigateTo('my_team');"
                },
                {
                    id: 'chat',
                    icon: 'fa-comments',
                    theme: '#10b981',
                    themeBg: 'rgba(16, 185, 129, 0.16)',
                    badge: '🟢 COMUNIDAD ONLINE',
                    badgeBg: '#ecfdf5',
                    badgeColor: '#047857',
                    title: 'Chat General Comunidad',
                    desc: 'Habla al instante con todos los jugadores y capitanes del club en tiempo real. ¡Comparte fotos, dudas y victorias!',
                    cta: 'Abrir Chat Oficial',
                    action: "window.ChatView?.openGeneralCommunityChat();"
                },
                {
                    id: 'inscriptions',
                    icon: 'fa-file-signature',
                    theme: campaignActive ? '#059669' : '#64748b',
                    themeBg: campaignActive ? 'rgba(5, 150, 105, 0.16)' : 'rgba(100, 116, 139, 0.16)',
                    badge: campaignActive ? '🟢 INSCRIPCIONES ABIERTAS' : '🔴 PRÓXIMA TEMPORADA',
                    badgeBg: campaignActive ? '#ecfdf5' : '#f1f5f9',
                    badgeColor: campaignActive ? '#047857' : '#475569',
                    title: '5. Inscripciones 27/28',
                    desc: 'Campaña oficial de renovación y nuevas altas para competir con SomosPadel en la próxima temporada.',
                    cta: campaignActive ? 'Inscribirme Ahora' : 'Ver Información de Campaña',
                    action: "window.CommunityHomeController?.navigateTo('inscriptions');"
                },
                {
                    id: 'agenda',
                    icon: 'fa-calendar-check',
                    theme: '#16a34a',
                    themeBg: 'rgba(22, 163, 74, 0.16)',
                    badge: '📅 CALENDARIO OFICIAL',
                    badgeBg: '#f0fdf4',
                    badgeColor: '#15803d',
                    title: '6. Mi Agenda',
                    desc: 'Tus horarios de liga, entrenamientos confirmados, eventos del club y avisos de convocatoria en un solo lugar.',
                    cta: 'Ver Mi Calendario',
                    action: "window.CommunityHomeController?.navigateTo('agenda');"
                },
                {
                    id: 'records',
                    icon: 'fa-trophy',
                    theme: '#7e22ce',
                    themeBg: 'rgba(126, 34, 206, 0.16)',
                    badge: '🏆 HALL OF FAME',
                    badgeBg: '#faf5ff',
                    badgeColor: '#7e22ce',
                    title: '7. Récords & MVP',
                    desc: 'Máximos anotadores de liga, imbatibilidad por parejas, MVPs de la temporada y el muro de honor de las leyendas.',
                    cta: 'Ver Muro de Honor',
                    action: "window.CommunityHomeController?.navigateTo('records');"
                }
            ];

            this._bannerIndex = 0;
            this.renderBannerSlide(0, false);

            // Iniciar auto-slide cada 3.3 segundos
            this._bannerTimer = setInterval(() => {
                if (!this._isPaused) {
                    this.nextBannerSlide(false);
                }
            }, 3300);

            // Pausa en interacción táctil o ratón
            const widget = document.getElementById('ch-subsections-banner-widget');
            if (widget && typeof widget.addEventListener === 'function' && !widget._listenersAttached) {
                widget._listenersAttached = true;
                const pauseOnTouch = () => this.pauseSubsectionsBanner(5000);
                widget.addEventListener('touchstart', pauseOnTouch, { passive: true });
                widget.addEventListener('mousedown', pauseOnTouch, { passive: true });
                widget.addEventListener('mouseenter', () => { this._isPaused = true; });
                widget.addEventListener('mouseleave', () => this.pauseSubsectionsBanner(2000));
            }
        }

        renderBannerSlide(index, animate = true) {
            const container = document.getElementById('ch-sb-container');
            const indicators = document.getElementById('ch-sb-indicators');
            if (!container || !this._slides || !this._slides.length) return;

            this._bannerIndex = (index + this._slides.length) % this._slides.length;
            const slide = this._slides[this._bannerIndex];

            container.innerHTML = `
                <div class="ch-sb-card ${animate ? 'ch-sb-slide-enter' : ''}"
                     onclick="${slide.action}"
                     style="--sb-accent: ${slide.theme};">
                    <div class="ch-sb-glow" style="background: radial-gradient(circle, ${slide.themeBg} 0%, transparent 70%);"></div>
                    <div class="ch-sb-top-bar">
                        <div class="ch-sb-badge" style="background: ${slide.badgeBg}; color: ${slide.badgeColor}; border: 1px solid ${slide.theme};">
                            ${slide.badge}
                        </div>
                        <div class="ch-sb-counter">
                            <span class="ch-sb-pulse-dot" style="background: ${slide.theme};"></span>
                            SECCIÓN ${this._bannerIndex + 1} DE ${this._slides.length}
                        </div>
                    </div>
                    <div class="ch-sb-body">
                        <div class="ch-sb-icon-box" style="background: ${slide.themeBg}; color: ${slide.theme}; border: 1.5px solid ${slide.theme};">
                            <i class="fas ${slide.icon}"></i>
                        </div>
                        <div class="ch-sb-info">
                            <h3 class="ch-sb-title">${slide.title}</h3>
                            <p class="ch-sb-desc">${slide.desc}</p>
                        </div>
                    </div>
                    <div class="ch-sb-footer">
                        <span class="ch-sb-cta" style="color: ${slide.theme};">
                            ${slide.cta} <i class="fas fa-arrow-right"></i>
                        </span>
                        <span class="ch-sb-auto-hint">
                            <i class="fas fa-play-circle" style="color: ${slide.theme};"></i> Auto Banner
                        </span>
                    </div>
                </div>
            `;

            if (indicators) {
                indicators.innerHTML = this._slides.map((s, i) => `
                    <button type="button"
                            class="ch-sb-dot ${i === this._bannerIndex ? 'active' : ''}"
                            style="${i === this._bannerIndex ? `--dot-accent: ${s.theme};` : ''}"
                            onclick="event.stopPropagation(); window.CommunityHomeView?.goToBannerSlide(${i});"
                            aria-label="Ir a sección ${i + 1}">
                    </button>
                `).join('');
            }
        }

        nextBannerSlide(manual = false) {
            if (manual) this.pauseSubsectionsBanner(6000);
            this.renderBannerSlide(this._bannerIndex + 1, true);
        }

        prevBannerSlide(manual = false) {
            if (manual) this.pauseSubsectionsBanner(6000);
            this.renderBannerSlide(this._bannerIndex - 1, true);
        }

        goToBannerSlide(index) {
            this.pauseSubsectionsBanner(6000);
            this.renderBannerSlide(index, true);
        }

        pauseSubsectionsBanner(ms = 5000) {
            this._isPaused = true;
            if (this._bannerPauseTimer) clearTimeout(this._bannerPauseTimer);
            this._bannerPauseTimer = setTimeout(() => {
                this._isPaused = false;
            }, ms);
        }

        /**
         * Control del desplegable evolucionado de secciones
         */
        toggleDropdown(e) {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            const panel = document.getElementById('ch-hero-dropdown-panel');
            const btn = document.getElementById('ch-hero-dropdown-btn');
            const chevron = document.getElementById('ch-hero-dropdown-chevron');
            if (!panel) return;

            const isOpen = panel.style.display !== 'none';
            if (isOpen) {
                this.closeDropdown();
            } else {
                panel.style.display = 'block';
                panel.classList.add('ch-dp-enter');
                if (btn) {
                    btn.classList.add('active');
                    btn.setAttribute('aria-expanded', 'true');
                    const span = btn.querySelector('span');
                    if (span) span.textContent = 'Cerrar Desplegable';
                }
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                }
                // Escuchar click fuera para cerrar
                if (this._outsideClickFn && typeof document.removeEventListener === 'function') {
                    document.removeEventListener('click', this._outsideClickFn);
                }
                this._outsideClickFn = (evt) => {
                    const p = document.getElementById('ch-hero-dropdown-panel');
                    const b = document.getElementById('ch-hero-dropdown-btn');
                    if (p && !p.contains(evt.target) && (!b || !b.contains(evt.target))) {
                        this.closeDropdown();
                    }
                };
                setTimeout(() => {
                    if (this._outsideClickFn && typeof document.addEventListener === 'function') {
                        document.addEventListener('click', this._outsideClickFn);
                    }
                }, 50);
            }
        }

        closeDropdown() {
            const panel = document.getElementById('ch-hero-dropdown-panel');
            const btn = document.getElementById('ch-hero-dropdown-btn');
            const chevron = document.getElementById('ch-hero-dropdown-chevron');
            if (panel) {
                panel.style.display = 'none';
                panel.classList.remove('ch-dp-enter');
            }
            if (btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
                const span = btn.querySelector('span');
                if (span) span.textContent = 'Ver Desplegable';
            }
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
            if (this._outsideClickFn && typeof document.removeEventListener === 'function') {
                document.removeEventListener('click', this._outsideClickFn);
                this._outsideClickFn = null;
            }
        }

        handleDropdownNav(route) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            this.closeDropdown();
            if (route === 'chat') {
                if (window.ChatView?.openGeneralCommunityChat) {
                    window.ChatView.openGeneralCommunityChat();
                } else if (window.Router?.navigate) {
                    window.Router.navigate('chat');
                }
            } else if (window.CommunityHomeController?.navigateTo) {
                window.CommunityHomeController.navigateTo(route);
            } else if (window.Router?.navigate) {
                window.Router.navigate(route);
            }
        }

        destroy() {
            this.closeDropdown();
            if (this._bannerTimer) {
                clearInterval(this._bannerTimer);
                this._bannerTimer = null;
            }
            if (this._bannerPauseTimer) {
                clearTimeout(this._bannerPauseTimer);
                this._bannerPauseTimer = null;
            }
            this._isPaused = false;
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
                        max-width: 1080px;
                        margin: 0 auto;
                        padding: 16px 14px 80px;
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        box-sizing: border-box;
                    }

                    /* HERO SECTION: BLOQUE DEPORTIVO DE ÉLITE */
                    .ch-hero-section {
                        position: relative;
                        background: linear-gradient(145deg, #091122 0%, #0f1c3f 55%, #080f1e 100%);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 24px;
                        padding: 28px 20px 24px;
                        margin-bottom: 28px;
                        box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.25);
                        overflow: hidden;
                        text-align: center;
                    }

                    .ch-hero-glow {
                        position: absolute;
                        top: -70px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 340px;
                        height: 160px;
                        background: radial-gradient(ellipse, rgba(204, 255, 0, 0.15) 0%, rgba(204, 255, 0, 0) 70%);
                        pointer-events: none;
                        filter: blur(35px);
                    }

                    .ch-hero-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(204, 255, 0, 0.08);
                        border: 1px solid rgba(204, 255, 0, 0.3);
                        padding: 5px 14px;
                        border-radius: 999px;
                        margin-bottom: 14px;
                    }

                    .ch-pulse-dot {
                        width: 7px;
                        height: 7px;
                        border-radius: 50%;
                        background: #CCFF00;
                        box-shadow: 0 0 8px #CCFF00;
                        animation: chPulse 1.8s infinite;
                    }

                    @keyframes chPulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.4; transform: scale(1.3); }
                    }

                    .ch-badge-text {
                        font-size: 0.65rem;
                        font-weight: 800;
                        letter-spacing: 1px;
                        color: #CCFF00;
                        text-transform: uppercase;
                    }

                    .ch-hero-title-row {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        flex-wrap: wrap;
                        margin-bottom: 10px;
                    }

                    .ch-hero-title {
                        font-size: 1.85rem;
                        font-weight: 800;
                        line-height: 1.2;
                        letter-spacing: -0.4px;
                        margin: 0;
                        color: #ffffff;
                    }

                    .ch-hero-dropdown-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        padding: 7px 14px;
                        border-radius: 999px;
                        background: linear-gradient(135deg, rgba(255, 94, 0, 0.22) 0%, rgba(204, 255, 0, 0.16) 100%);
                        border: 1.5px solid rgba(255, 94, 0, 0.55);
                        color: #ffffff;
                        font-family: inherit;
                        font-size: 0.74rem;
                        font-weight: 800;
                        letter-spacing: 0.3px;
                        cursor: pointer;
                        box-shadow: 0 4px 14px rgba(255, 94, 0, 0.25);
                        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                        -webkit-tap-highlight-color: transparent;
                        user-select: none;
                    }

                    .ch-hero-dropdown-btn:hover {
                        background: linear-gradient(135deg, rgba(255, 94, 0, 0.38) 0%, rgba(204, 255, 0, 0.25) 100%);
                        border-color: #ff8c42;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 18px rgba(255, 94, 0, 0.4);
                    }

                    .ch-hero-dropdown-btn:active {
                        transform: scale(0.96);
                    }

                    .ch-hero-dropdown-btn.active {
                        background: linear-gradient(135deg, #ff5e00 0%, #ea580c 100%);
                        border-color: #ffedd5;
                        box-shadow: 0 0 20px rgba(255, 94, 0, 0.6);
                    }

                    .ch-hero-dropdown-chevron {
                        font-size: 0.7rem;
                        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    /* PANEL DESPLEGABLE EVOLUCIONADO */
                    .ch-hero-dropdown-panel {
                        width: 100%;
                        max-width: 580px;
                        margin: 14px auto 18px;
                        background: rgba(10, 17, 36, 0.96);
                        backdrop-filter: blur(28px) saturate(190%);
                        -webkit-backdrop-filter: blur(28px) saturate(190%);
                        border: 1.5px solid rgba(255, 94, 0, 0.45);
                        border-radius: 20px;
                        padding: 14px 12px;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(255, 94, 0, 0.2);
                        box-sizing: border-box;
                        text-align: left;
                    }

                    .ch-dp-enter {
                        animation: chDpSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes chDpSlideDown {
                        0% {
                            opacity: 0;
                            transform: translateY(-12px) scale(0.97);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    .ch-dp-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 4px 10px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        margin-bottom: 10px;
                    }

                    .ch-dp-header-left {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .ch-dp-pulse-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #ff5e00;
                        box-shadow: 0 0 10px #ff5e00;
                        animation: chPulse 1.8s infinite;
                    }

                    .ch-dp-header-title {
                        font-size: 0.72rem;
                        font-weight: 900;
                        letter-spacing: 0.8px;
                        color: #cbd5e1;
                        text-transform: uppercase;
                    }

                    .ch-dp-close-btn {
                        background: rgba(255, 255, 255, 0.06);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        color: #94a3b8;
                        width: 26px;
                        height: 26px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .ch-dp-close-btn:hover {
                        background: rgba(239, 68, 68, 0.2);
                        color: #ef4444;
                        border-color: rgba(239, 68, 68, 0.4);
                    }

                    .ch-dp-options {
                        display: flex;
                        flex-direction: column;
                        gap: 7px;
                    }

                    .ch-dp-item {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 14px;
                        padding: 10px 12px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        -webkit-tap-highlight-color: transparent;
                        user-select: none;
                    }

                    .ch-dp-item:hover {
                        background: rgba(255, 255, 255, 0.08);
                        border-color: var(--dp-accent, rgba(255, 255, 255, 0.3));
                        transform: translateX(4px);
                        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
                    }

                    .ch-dp-item:active {
                        transform: scale(0.98);
                    }

                    .ch-dp-item-highlight {
                        background: linear-gradient(135deg, rgba(255, 94, 0, 0.12) 0%, rgba(255, 140, 66, 0.04) 100%);
                        border: 1.2px solid rgba(255, 94, 0, 0.45);
                    }

                    .ch-dp-item-highlight:hover {
                        border-color: rgba(255, 94, 0, 0.7);
                        background: linear-gradient(135deg, rgba(255, 94, 0, 0.2) 0%, rgba(255, 140, 66, 0.08) 100%);
                    }

                    .ch-dp-icon-box {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        background: var(--dp-accent-bg, rgba(255, 255, 255, 0.1));
                        border: 1.2px solid var(--dp-accent, rgba(255, 255, 255, 0.2));
                        color: var(--dp-accent, #ffffff);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.95rem;
                        flex-shrink: 0;
                    }

                    .ch-dp-text-box {
                        flex: 1;
                        min-width: 0;
                    }

                    .ch-dp-title-row {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        flex-wrap: wrap;
                    }

                    .ch-dp-title {
                        font-size: 0.82rem;
                        font-weight: 800;
                        color: #ffffff;
                        letter-spacing: 0.3px;
                        line-height: 1.2;
                    }

                    .ch-dp-desc {
                        font-size: 0.7rem;
                        color: #94a3b8;
                        margin-top: 2px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1.2;
                    }

                    .ch-dp-badge {
                        font-size: 0.58rem;
                        font-weight: 900;
                        padding: 2px 6px;
                        border-radius: 5px;
                        letter-spacing: 0.4px;
                        text-transform: uppercase;
                        line-height: 1;
                    }

                    .ch-dp-badge-online {
                        background: #CCFF00;
                        color: #000;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .ch-dp-badge-dot {
                        width: 5px;
                        height: 5px;
                        border-radius: 50%;
                        background: #000;
                    }

                    .ch-dp-badge-active {
                        background: rgba(204, 255, 0, 0.15);
                        border: 1px solid rgba(204, 255, 0, 0.4);
                        color: #CCFF00;
                    }

                    .ch-dp-badge-direct {
                        background: #ff5e00;
                        color: #ffffff;
                    }

                    .ch-dp-arrow {
                        font-size: 0.72rem;
                        color: #64748b;
                        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
                        flex-shrink: 0;
                    }

                    .ch-dp-item:hover .ch-dp-arrow {
                        color: var(--dp-accent, #ffffff);
                        transform: translateX(3px);
                    }

                    .ch-hero-subtitle {
                        max-width: 580px;
                        margin: 0 auto 22px;
                        font-size: 0.88rem;
                        line-height: 1.5;
                        color: #94a3b8;
                    }

                    /* QUICK STATS / KPIS */
                    .ch-stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        margin-bottom: 22px;
                        width: 100%;
                        max-width: 760px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .ch-stat-card {
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 16px;
                        padding: 12px 14px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        transition: all 0.2s ease;
                        backdrop-filter: blur(8px);
                    }

                    .ch-stat-card:hover {
                        border-color: var(--accent-color, #CCFF00);
                        transform: translateY(-2px);
                        background: rgba(255, 255, 255, 0.07);
                    }

                    .ch-stat-icon-wrap {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.95rem;
                        flex-shrink: 0;
                    }

                    .ch-stat-info {
                        display: flex;
                        flex-direction: column;
                        text-align: left;
                        min-width: 0;
                    }

                    .ch-stat-num {
                        font-size: 1.2rem;
                        font-weight: 800;
                        color: #ffffff;
                        line-height: 1.1;
                    }

                    .ch-stat-lbl {
                        font-size: 0.65rem;
                        font-weight: 600;
                        color: #94a3b8;
                        margin-top: 2px;
                        text-transform: uppercase;
                        letter-spacing: 0.4px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* HERO CTA & REDES SOCIALES WRAPPER */
                    .ch-hero-cta-wrap {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 10px;
                        width: 100%;
                        max-width: 580px;
                        margin: 0 auto;
                        box-sizing: border-box;
                    }

                    .ch-btn-whatsapp-hero {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: #ffffff;
                        text-decoration: none;
                        padding: 12px 18px;
                        border-radius: 16px;
                        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        width: 100%;
                        box-sizing: border-box;
                        cursor: pointer;
                    }

                    .ch-btn-whatsapp-hero:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 28px rgba(16, 185, 129, 0.35);
                    }

                    .ch-btn-whatsapp-hero:active {
                        transform: scale(0.98);
                    }

                    .ch-wa-pulse-icon {
                        width: 38px;
                        height: 38px;
                        border-radius: 10px;
                        background: rgba(255, 255, 255, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.25rem;
                        flex-shrink: 0;
                        color: #ffffff;
                    }

                    .ch-wa-text-box {
                        display: flex;
                        flex-direction: column;
                        text-align: left;
                        flex: 1;
                        min-width: 0;
                    }

                    .ch-wa-headline {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        flex-wrap: wrap;
                    }

                    .ch-wa-main-title {
                        font-weight: 800;
                        font-size: 0.84rem;
                        letter-spacing: 0.2px;
                        line-height: 1.2;
                        color: #ffffff;
                    }

                    .ch-wa-badge-pill {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        background: rgba(0, 0, 0, 0.25);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 2px 7px;
                        border-radius: 999px;
                        font-size: 0.6rem;
                        font-weight: 800;
                        color: #CCFF00;
                        letter-spacing: 0.5px;
                    }

                    .ch-dot-live {
                        width: 5px;
                        height: 5px;
                        border-radius: 50%;
                        background: #CCFF00;
                        display: inline-block;
                    }

                    .ch-wa-sub-title {
                        font-size: 0.72rem;
                        color: rgba(255, 255, 255, 0.9);
                        margin-top: 2px;
                        font-weight: 500;
                        line-height: 1.3;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .ch-wa-arrow-box {
                        width: 30px;
                        height: 30px;
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.15);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.85rem;
                        color: #ffffff;
                        flex-shrink: 0;
                        transition: transform 0.2s ease;
                    }

                    .ch-btn-whatsapp-hero:hover .ch-wa-arrow-box {
                        transform: translateX(3px);
                    }

                    /* SOCIAL SUBGRID */
                    .ch-social-subgrid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .ch-social-card {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        border-radius: 14px;
                        padding: 10px 14px;
                        text-decoration: none;
                        color: #ffffff;
                        transition: all 0.2s ease;
                        box-sizing: border-box;
                        cursor: pointer;
                        min-width: 0;
                    }

                    .ch-social-card:hover {
                        transform: translateY(-2px);
                    }

                    .ch-social-card:active {
                        transform: scale(0.98);
                    }

                    .ch-social-card-ig {
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(225, 48, 108, 0.35);
                        box-shadow: 0 4px 14px rgba(225, 48, 108, 0.1);
                    }

                    .ch-social-card-fb {
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(24, 119, 242, 0.35);
                        box-shadow: 0 4px 14px rgba(24, 119, 242, 0.1);
                    }

                    .ch-social-icon-ig {
                        width: 32px;
                        height: 32px;
                        border-radius: 9px;
                        background: linear-gradient(45deg, #f09433, #dc2743, #bc1888);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1rem;
                        color: #fff;
                        flex-shrink: 0;
                    }

                    .ch-social-icon-fb {
                        width: 32px;
                        height: 32px;
                        border-radius: 9px;
                        background: #1877f2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1rem;
                        color: #fff;
                        flex-shrink: 0;
                    }

                    .ch-social-info {
                        text-align: left;
                        min-width: 0;
                        flex: 1;
                    }

                    .ch-social-title {
                        font-size: 0.78rem;
                        font-weight: 800;
                        line-height: 1.1;
                        color: #ffffff;
                    }

                    .ch-social-handle {
                        font-size: 0.65rem;
                        font-weight: 600;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1.2;
                        margin-top: 1px;
                    }

                    .ch-social-card-ig .ch-social-handle {
                        color: #f472b6;
                    }

                    .ch-social-card-fb .ch-social-handle {
                        color: #60a5fa;
                    }

                    .ch-social-ext-icon {
                        font-size: 0.65rem;
                        opacity: 0.5;
                        color: #ffffff;
                        flex-shrink: 0;
                    }

                    /* SECTION GENERAL HEADERS */
                    .ch-section-header {
                        margin-bottom: 16px;
                        text-align: left;
                    }

                    .ch-section-badge-pill {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: rgba(2, 132, 199, 0.08);
                        border: 1px solid rgba(2, 132, 199, 0.25);
                        color: #0284c7;
                        padding: 4px 10px;
                        border-radius: 999px;
                        font-size: 0.65rem;
                        font-weight: 800;
                        letter-spacing: 0.6px;
                        margin-bottom: 6px;
                    }

                    .ch-section-title {
                        font-size: 1.25rem !important;
                        font-weight: 800 !important;
                        letter-spacing: -0.2px;
                        color: #0f172a !important;
                        margin: 0 0 4px;
                    }

                    .ch-section-subtitle {
                        font-size: 0.82rem !important;
                        font-weight: 500 !important;
                        color: #64748b !important;
                        margin: 0;
                    }

                    /* BANNER INTERACTIVO Y ROTATIVO DE SUBSECCIONES */
                    .ch-subsections-banner-widget {
                        position: relative;
                        margin-bottom: 18px;
                    }

                    .ch-sb-card {
                        background: linear-gradient(145deg, #091122 0%, #172554 100%);
                        border: 1.5px solid var(--sb-accent, #38bdf8);
                        border-radius: 18px;
                        padding: 16px 18px;
                        cursor: pointer;
                        box-shadow: 0 10px 28px -6px rgba(15, 23, 42, 0.4), 0 0 20px -8px var(--sb-accent, #38bdf8);
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        position: relative;
                        overflow: hidden;
                        user-select: none;
                    }

                    .ch-sb-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 14px 34px -6px rgba(15, 23, 42, 0.5), 0 0 28px -6px var(--sb-accent, #38bdf8);
                    }

                    .ch-sb-card:active {
                        transform: scale(0.985);
                    }

                    .ch-sb-slide-enter {
                        animation: chSbSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes chSbSlideIn {
                        from { opacity: 0; transform: translateX(18px); }
                        to { opacity: 1; transform: translateX(0); }
                    }

                    .ch-sb-top-bar {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 12px;
                    }

                    .ch-sb-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.65rem;
                        font-weight: 800;
                        padding: 4px 10px;
                        border-radius: 999px;
                        letter-spacing: 0.4px;
                    }

                    .ch-sb-pulse-dot {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        display: inline-block;
                        animation: chPulse 1.8s infinite;
                    }

                    .ch-sb-counter {
                        font-size: 0.7rem;
                        font-weight: 700;
                        color: #94a3b8;
                        background: rgba(255, 255, 255, 0.08);
                        padding: 2px 8px;
                        border-radius: 999px;
                    }

                    .ch-sb-body {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        margin-bottom: 14px;
                    }

                    .ch-sb-icon-box {
                        width: 48px;
                        height: 48px;
                        border-radius: 14px;
                        border: 1.5px solid;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.35rem;
                        flex-shrink: 0;
                    }

                    .ch-sb-info {
                        flex: 1;
                        min-width: 0;
                        text-align: left;
                    }

                    .ch-sb-title {
                        font-size: 1.12rem !important;
                        font-weight: 800 !important;
                        color: #ffffff !important;
                        margin: 0 0 4px !important;
                        line-height: 1.25;
                    }

                    .ch-sb-desc {
                        font-size: 0.8rem !important;
                        color: #cbd5e1 !important;
                        margin: 0 !important;
                        line-height: 1.35;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .ch-sb-footer {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255, 255, 255, 0.08);
                    }

                    .ch-sb-cta {
                        font-size: 0.8rem;
                        font-weight: 800;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: gap 0.2s ease;
                    }

                    .ch-sb-card:hover .ch-sb-cta {
                        gap: 10px;
                    }

                    .ch-sb-auto-hint {
                        font-size: 0.65rem;
                        color: #94a3b8;
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .ch-sb-controls {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-top: 10px;
                    }

                    .ch-sb-arrow-btn {
                        background: #ffffff;
                        border: 1px solid #cbd5e1;
                        color: #334155;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .ch-sb-arrow-btn:hover {
                        background: #0f172a;
                        color: #ffffff;
                        border-color: #0f172a;
                    }

                    .ch-sb-indicators {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .ch-sb-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 4px;
                        background: #cbd5e1;
                        border: none;
                        padding: 0;
                        cursor: pointer;
                        transition: all 0.25s ease;
                    }

                    .ch-sb-dot.active {
                        width: 22px;
                        background: var(--dot-accent, #0284c7);
                    }

                    /* HUB GRID (SUBSECCIONES COMPACTAS) */
                    .ch-hub-section {
                        margin-bottom: 24px;
                    }

                    .ch-hub-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                    }

                    .ch-hub-card {
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 14px;
                        padding: 12px 14px;
                        cursor: pointer;
                        position: relative;
                        overflow: hidden;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        min-height: 84px;
                        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04) !important;
                        text-align: left;
                        box-sizing: border-box;
                    }

                    .ch-hub-card:hover {
                        border-color: #cbd5e1 !important;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08) !important;
                    }

                    .ch-hub-card:active {
                        transform: scale(0.97);
                    }

                    .ch-hub-card-featured {
                        background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                        border: 1.5px solid #0284c7 !important;
                        box-shadow: 0 2px 10px rgba(2, 132, 199, 0.12) !important;
                    }

                    .ch-hub-card-featured:hover {
                        border-color: #0369a1 !important;
                        box-shadow: 0 8px 20px rgba(2, 132, 199, 0.18) !important;
                    }

                    .ch-hub-card-featured .ch-hub-card-title {
                        color: #0369a1 !important;
                    }

                    .ch-hub-card-featured .ch-hub-card-sub {
                        color: #0284c7 !important;
                    }

                    .ch-hub-card-top {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 6px;
                    }

                    .ch-hub-icon-box {
                        width: 32px;
                        height: 32px;
                        border-radius: 9px;
                        border: 1px solid;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9rem;
                        flex-shrink: 0;
                    }

                    .ch-hub-badge {
                        font-size: 0.6rem;
                        font-weight: 800;
                        padding: 2px 7px;
                        border-radius: 999px;
                        letter-spacing: 0.3px;
                        white-space: nowrap;
                    }

                    .ch-badge-featured {
                        background: #0284c7 !important;
                        color: #ffffff !important;
                        border: 1px solid #0284c7 !important;
                    }

                    .ch-hub-card-info {
                        display: flex;
                        flex-direction: column;
                    }

                    .ch-hub-card-title {
                        font-size: 0.88rem !important;
                        font-weight: 800 !important;
                        color: #0f172a !important;
                        margin: 0 0 2px !important;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1.25;
                    }

                    .ch-hub-card-sub {
                        font-size: 0.7rem !important;
                        font-weight: 500 !important;
                        color: #64748b !important;
                        margin: 0 !important;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1.2;
                    }

                    /* NOTICIAS */
                    .ch-news-section {
                        margin-bottom: 32px;
                    }

                    .ch-filter-pills {
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        padding: 2px 2px 14px;
                        scrollbar-width: none;
                    }

                    .ch-filter-pills::-webkit-scrollbar {
                        display: none;
                    }

                    .ch-pill-btn {
                        background: #ffffff !important;
                        border: 1px solid #cbd5e1 !important;
                        color: #334155 !important;
                        padding: 7px 15px;
                        border-radius: 999px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        cursor: pointer;
                        white-space: nowrap;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s ease;
                        font-family: inherit;
                        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
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
                        gap: 14px;
                    }

                    .ch-empty-news {
                        grid-column: 1 / -1;
                        padding: 36px 20px;
                        text-align: center;
                        background: #ffffff;
                        border: 1.5px dashed #cbd5e1;
                        border-radius: 18px;
                        color: #64748b;
                    }

                    .ch-news-card {
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: 0 3px 14px rgba(15, 23, 42, 0.04) !important;
                        border-radius: 18px;
                        overflow: hidden;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .ch-news-card:hover {
                        border-color: #cbd5e1 !important;
                        transform: translateY(-3px);
                        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
                    }

                    .ch-news-card:active {
                        transform: scale(0.98);
                    }

                    .ch-news-cover {
                        height: 110px;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        box-sizing: border-box;
                    }

                    .ch-news-category-tag {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        font-size: 0.6rem;
                        font-weight: 800;
                        padding: 3px 9px;
                        border-radius: 999px;
                        border: 1px solid;
                        letter-spacing: 0.4px;
                    }

                    .ch-news-cover-emoji {
                        font-size: 2.5rem;
                        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));
                    }

                    .ch-news-body {
                        padding: 14px;
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                    }

                    .ch-news-meta {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 0.68rem !important;
                        font-weight: 600 !important;
                        color: #64748b !important;
                        margin-bottom: 6px;
                    }

                    .ch-news-title {
                        font-size: 0.98rem !important;
                        font-weight: 800 !important;
                        color: #0f172a !important;
                        line-height: 1.3;
                        margin: 0 0 6px;
                    }

                    .ch-news-snippet {
                        font-size: 0.8rem !important;
                        font-weight: 500;
                        line-height: 1.45;
                        color: #475569 !important;
                        margin: 0 0 12px;
                        flex: 1;
                    }

                    .ch-news-footer {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-top: 10px;
                        border-top: 1px solid #f1f5f9;
                    }

                    .ch-news-readmore {
                        font-size: 0.76rem !important;
                        font-weight: 800 !important;
                        color: #0284c7 !important;
                    }

                    .ch-news-arrow {
                        font-size: 0.75rem;
                        color: #0284c7 !important;
                        transition: transform 0.2s ease;
                    }

                    .ch-news-card:hover .ch-news-arrow {
                        transform: translateX(4px);
                    }

                    /* PILARES / CÓDIGO DE HONOR */
                    .ch-values-section {
                        margin-bottom: 32px;
                    }

                    .ch-values-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                    }

                    .ch-value-card {
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03) !important;
                        border-radius: 16px;
                        padding: 16px 14px;
                        text-align: left;
                        transition: all 0.2s ease;
                    }

                    .ch-value-card:hover {
                        border-color: #cbd5e1 !important;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06) !important;
                    }

                    .ch-value-top-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 8px;
                    }

                    .ch-value-step {
                        font-size: 0.72rem;
                        font-weight: 800;
                        color: #059669;
                        background: #ecfdf5;
                        padding: 2px 8px;
                        border-radius: 999px;
                        border: 1px solid #a7f3d0;
                    }

                    .ch-value-icon {
                        font-size: 1.4rem;
                    }

                    .ch-value-card h4 {
                        font-size: 0.92rem !important;
                        font-weight: 800 !important;
                        color: #0f172a !important;
                        margin: 0 0 6px;
                    }

                    .ch-value-card p {
                        font-size: 0.78rem !important;
                        line-height: 1.45;
                        color: #475569 !important;
                        margin: 0;
                    }

                    /* CONTACTO / SUGERENCIAS */
                    .ch-contact-section {
                        margin-bottom: 28px;
                    }

                    .ch-contact-card {
                        background: linear-gradient(135deg, #091122 0%, #0f1c3f 100%) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        padding: 22px 20px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 16px;
                        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
                    }

                    .ch-contact-content {
                        flex: 1;
                        text-align: left;
                    }

                    .ch-contact-badge {
                        display: inline-block;
                        background: rgba(204, 255, 0, 0.12);
                        color: #CCFF00;
                        font-size: 0.62rem;
                        font-weight: 800;
                        padding: 3px 10px;
                        border-radius: 999px;
                        letter-spacing: 0.5px;
                        margin-bottom: 8px;
                    }

                    .ch-contact-card h3 {
                        font-size: 1.1rem;
                        font-weight: 800 !important;
                        color: #ffffff !important;
                        margin: 0 0 6px;
                    }

                    .ch-contact-card p {
                        font-size: 0.8rem;
                        line-height: 1.45;
                        color: #94a3b8 !important;
                        margin: 0 0 14px;
                        max-width: 540px;
                    }

                    .ch-contact-actions {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .ch-contact-btn {
                        padding: 9px 16px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.76rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s ease;
                        font-family: inherit;
                        border: none;
                    }

                    .ch-contact-btn:active {
                        transform: scale(0.97);
                    }

                    .ch-contact-btn-wa {
                        background: #25D366;
                        color: #ffffff;
                    }

                    .ch-contact-btn-wa:hover {
                        background: #20ba59;
                        transform: translateY(-2px);
                    }

                    .ch-contact-btn-outline {
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #ffffff;
                    }

                    .ch-contact-btn-outline:hover {
                        background: rgba(255, 255, 255, 0.14);
                    }

                    .ch-contact-visual {
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background: rgba(204, 255, 0, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.7rem;
                        color: #CCFF00;
                        flex-shrink: 0;
                    }

                    /* REDES SOCIALES SHOWCASE SECTION */
                    .ch-social-showcase-section {
                        margin-bottom: 24px;
                    }

                    .ch-social-banner-box {
                        background: linear-gradient(145deg, #091122 0%, #162447 100%);
                        border-radius: 20px;
                        padding: 20px;
                        color: #ffffff;
                        border: 1px solid rgba(204, 255, 0, 0.25);
                        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
                        position: relative;
                        overflow: hidden;
                    }

                    .ch-social-banner-glow {
                        position: absolute;
                        top: -30px;
                        right: -30px;
                        width: 140px;
                        height: 140px;
                        background: radial-gradient(circle, rgba(225, 48, 108, 0.2) 0%, transparent 70%);
                        pointer-events: none;
                    }

                    .ch-social-banner-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 12px;
                        margin-bottom: 14px;
                        flex-wrap: wrap;
                        text-align: left;
                    }

                    .ch-social-banner-pill {
                        background: rgba(204, 255, 0, 0.12);
                        color: #CCFF00;
                        border: 1px solid rgba(204, 255, 0, 0.35);
                        padding: 3px 9px;
                        border-radius: 999px;
                        font-size: 0.65rem;
                        font-weight: 800;
                        letter-spacing: 0.5px;
                    }

                    .ch-social-banner-title {
                        margin: 6px 0 4px;
                        font-size: 1.1rem;
                        font-weight: 800;
                        color: #ffffff;
                    }

                    .ch-social-banner-desc {
                        margin: 0;
                        font-size: 0.78rem;
                        color: #94a3b8;
                        line-height: 1.4;
                    }

                    .ch-social-copy-btn {
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #ffffff;
                        padding: 7px 12px;
                        border-radius: 10px;
                        font-size: 0.72rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    }

                    .ch-social-copy-btn:hover {
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .ch-social-cards-duo {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                        gap: 10px;
                        margin-bottom: 12px;
                    }

                    .ch-social-card-item {
                        background: rgba(255, 255, 255, 0.04);
                        border-radius: 16px;
                        padding: 14px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: left;
                    }

                    .ch-social-card-item:hover {
                        transform: translateY(-2px);
                    }

                    .ch-card-ig-item {
                        border: 1px solid rgba(225, 48, 108, 0.35);
                    }

                    .ch-card-fb-item {
                        border: 1px solid rgba(24, 119, 242, 0.35);
                    }

                    .ch-social-card-top {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 8px;
                    }

                    .ch-social-card-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.15rem;
                        color: #fff;
                        flex-shrink: 0;
                    }

                    .ch-avatar-ig {
                        background: linear-gradient(45deg, #f09433, #dc2743, #bc1888);
                        box-shadow: 0 3px 10px rgba(220, 39, 67, 0.3);
                    }

                    .ch-avatar-fb {
                        background: #1877f2;
                        box-shadow: 0 3px 10px rgba(24, 119, 242, 0.3);
                    }

                    .ch-social-card-name {
                        font-weight: 800;
                        font-size: 0.88rem;
                        color: #fff;
                    }

                    .ch-social-card-sub {
                        font-size: 0.68rem;
                        font-weight: 600;
                    }

                    .ch-sub-ig {
                        color: #f472b6;
                    }

                    .ch-sub-fb {
                        color: #60a5fa;
                    }

                    .ch-social-card-text {
                        font-size: 0.74rem;
                        color: #cbd5e1;
                        margin: 0 0 8px;
                        line-height: 1.35;
                    }

                    .ch-social-card-cta {
                        font-weight: 800;
                        font-size: 0.74rem;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .ch-cta-ig {
                        color: #CCFF00;
                    }

                    .ch-cta-fb {
                        color: #60a5fa;
                    }

                    /* CONCURSO MENSUAL */
                    .ch-social-contest-box {
                        background: linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(225, 48, 108, 0.12) 100%);
                        border: 1px dashed rgba(234, 179, 8, 0.4);
                        border-radius: 16px;
                        padding: 12px 16px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        flex-wrap: wrap;
                        text-align: left;
                    }

                    .ch-social-contest-left {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        min-width: 220px;
                        flex: 1;
                    }

                    .ch-social-contest-trophy {
                        font-size: 1.8rem;
                        line-height: 1;
                    }

                    .ch-social-contest-tag {
                        color: #facc15;
                        font-size: 0.68rem;
                        font-weight: 800;
                        letter-spacing: 0.4px;
                        text-transform: uppercase;
                    }

                    .ch-social-contest-title {
                        color: #ffffff;
                        font-size: 0.92rem;
                        font-weight: 800;
                        margin: 2px 0;
                    }

                    .ch-social-contest-desc {
                        color: #cbd5e1;
                        font-size: 0.72rem;
                        line-height: 1.3;
                    }

                    .ch-social-contest-btn {
                        background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
                        color: #0f172a;
                        border: none;
                        padding: 8px 14px;
                        border-radius: 10px;
                        font-weight: 800;
                        font-size: 0.74rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
                        transition: transform 0.2s;
                    }

                    .ch-social-contest-btn:hover {
                        transform: scale(1.02);
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
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 20px;
                        max-width: 600px;
                        width: 100%;
                        max-height: 88vh;
                        overflow-y: auto;
                        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35) !important;
                        position: relative;
                        animation: chScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes chScaleIn {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }

                    .ch-modal-header {
                        height: 130px;
                        position: relative;
                        display: flex;
                        align-items: flex-end;
                        padding: 18px;
                        box-sizing: border-box;
                    }

                    .ch-modal-close-btn {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: rgba(0, 0, 0, 0.6);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.85rem;
                        transition: all 0.2s ease;
                    }

                    .ch-modal-close-btn:hover {
                        background: #ef4444;
                        transform: scale(1.08);
                    }

                    .ch-modal-header-badge {
                        font-size: 0.65rem;
                        font-weight: 800;
                        padding: 3px 10px;
                        border-radius: 999px;
                        letter-spacing: 0.4px;
                        text-transform: uppercase;
                    }

                    .ch-modal-header-emoji {
                        position: absolute;
                        right: 20px;
                        bottom: 12px;
                        font-size: 3rem;
                        opacity: 0.9;
                    }

                    .ch-modal-body {
                        padding: 20px;
                        text-align: left;
                    }

                    .ch-modal-meta-row {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-size: 0.72rem;
                        color: #64748b !important;
                        margin-bottom: 10px;
                        flex-wrap: wrap;
                        font-weight: 600;
                    }

                    .ch-modal-title {
                        font-size: 1.25rem;
                        font-weight: 800 !important;
                        color: #0f172a !important;
                        line-height: 1.3;
                        margin: 0 0 16px;
                    }

                    .ch-modal-content-pro {
                        font-size: 0.88rem;
                        line-height: 1.65;
                        color: #1e293b !important;
                        margin-bottom: 20px;
                    }

                    .ch-modal-content-pro p {
                        margin: 0 0 12px;
                        color: #1e293b !important;
                    }

                    .ch-modal-content-pro ul {
                        margin: 0 0 14px;
                        padding-left: 18px;
                        color: #1e293b !important;
                    }

                    .ch-modal-content-pro li {
                        margin-bottom: 5px;
                    }

                    .ch-modal-content-pro h4 {
                        font-size: 0.95rem;
                        font-weight: 800;
                        color: #0f172a !important;
                        margin: 16px 0 6px;
                    }

                    .ch-modal-footer {
                        display: flex;
                        align-items: center;
                        justify-content: flex-end;
                        gap: 10px;
                        padding-top: 14px;
                        border-top: 1px solid #f1f5f9;
                    }

                    .ch-modal-share-btn {
                        background: #25D366;
                        color: #ffffff;
                        border: none;
                        padding: 9px 16px;
                        border-radius: 10px;
                        font-weight: 800;
                        font-size: 0.78rem;
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
                        padding: 9px 16px;
                        border-radius: 10px;
                        font-weight: 700;
                        font-size: 0.78rem;
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
                            padding: 10px 10px 75px;
                        }
                        .ch-hero-section {
                            padding: 22px 14px 18px;
                            border-radius: 20px;
                            margin-bottom: 22px;
                        }
                        .ch-hero-title {
                            font-size: 1.45rem;
                        }
                        .ch-hero-title-row {
                            gap: 8px;
                        }
                        .ch-hero-dropdown-btn {
                            padding: 5px 11px;
                            font-size: 0.68rem;
                        }
                        .ch-hero-dropdown-panel {
                            padding: 10px 8px;
                            border-radius: 16px;
                        }
                        .ch-dp-item {
                            padding: 8px 10px;
                            gap: 10px;
                            border-radius: 12px;
                        }
                        .ch-dp-icon-box {
                            width: 32px;
                            height: 32px;
                            font-size: 0.85rem;
                            border-radius: 8px;
                        }
                        .ch-dp-title {
                            font-size: 0.78rem;
                        }
                        .ch-dp-desc {
                            font-size: 0.65rem;
                        }
                        .ch-hero-subtitle {
                            font-size: 0.8rem;
                            margin-bottom: 16px;
                        }
                        .ch-stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 8px;
                            margin-bottom: 16px;
                        }
                        .ch-stat-card {
                            padding: 10px 10px;
                            border-radius: 12px;
                            gap: 8px;
                        }
                        .ch-stat-num {
                            font-size: 1.05rem;
                        }
                        .ch-stat-lbl {
                            font-size: 0.6rem;
                        }
                        .ch-stat-icon-wrap {
                            width: 32px;
                            height: 32px;
                            font-size: 0.85rem;
                        }
                        .ch-sb-card {
                            padding: 13px 14px;
                            border-radius: 16px;
                        }
                        .ch-sb-icon-box {
                            width: 40px;
                            height: 40px;
                            font-size: 1.15rem;
                            border-radius: 11px;
                        }
                        .ch-sb-title {
                            font-size: 0.98rem !important;
                        }
                        .ch-sb-desc {
                            font-size: 0.74rem !important;
                        }
                        .ch-sb-cta {
                            font-size: 0.74rem;
                        }
                        .ch-hub-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 8px !important;
                        }
                        .ch-hub-card {
                            padding: 10px 10px !important;
                            border-radius: 12px !important;
                            min-height: 76px !important;
                        }
                        .ch-hub-icon-box {
                            width: 28px !important;
                            height: 28px !important;
                            font-size: 0.8rem !important;
                            border-radius: 8px !important;
                        }
                        .ch-hub-badge {
                            font-size: 0.55rem !important;
                            padding: 2px 5px !important;
                        }
                        .ch-hub-card-title {
                            font-size: 0.8rem !important;
                        }
                        .ch-hub-card-sub {
                            font-size: 0.65rem !important;
                        }
                        .ch-news-grid {
                            grid-template-columns: 1fr;
                            gap: 12px;
                        }
                        .ch-values-grid {
                            grid-template-columns: 1fr;
                            gap: 10px;
                        }
                        .ch-social-subgrid {
                            grid-template-columns: 1fr 1fr;
                            gap: 8px;
                        }
                        .ch-social-card {
                            padding: 9px 10px;
                            border-radius: 12px;
                            gap: 8px;
                        }
                        .ch-social-icon-ig, .ch-social-icon-fb {
                            width: 28px;
                            height: 28px;
                            font-size: 0.9rem;
                        }
                        .ch-social-title {
                            font-size: 0.74rem;
                        }
                        .ch-social-handle {
                            font-size: 0.6rem;
                        }
                        .ch-btn-whatsapp-hero {
                            padding: 11px 14px;
                            border-radius: 14px;
                        }
                        .ch-wa-pulse-icon {
                            width: 34px;
                            height: 34px;
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
