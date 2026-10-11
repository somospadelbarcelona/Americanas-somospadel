/**
 * admin-dashboard.js
 * INICIO - EL MOTOR DE OPERACIONES DEL ADMIN
 * Arquitectura Enterprise Matte, 100% Responsiva (Móvil, Tablet, PC).
 * Sincronización Reactiva en Tiempo Real con Firestore & Visual Media Cards.
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.dashboard_home = async function () {
    const content = document.getElementById('content-area');
    if (!content) return;

    // Limpiar listeners anteriores para prevenir memory leaks y duplicidades
    if (window._motorUnsubscribers && Array.isArray(window._motorUnsubscribers)) {
        window._motorUnsubscribers.forEach(unsub => {
            try { if (typeof unsub === 'function') unsub(); } catch (e) {}
        });
    }
    window._motorUnsubscribers = [];

    // Actualizar título de la página
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'INICIO • MOTOR DE OPERACIONES';

    const currentUser = window.AdminAuth?.user || JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem('currentUser') || '{}');
    const role = (currentUser.role || '').toString().toLowerCase().trim();
    const isOrganizer = ['organizer', 'organizador', 'organizadores', 'organizers'].includes(role);
    const isSuperAdmin = ['super_admin', 'superadmin'].includes(role);

    // Saludo dinámico según la hora del día
    const currentHour = new Date().getHours();
    let timeGreeting = '¡Buenos días';
    if (currentHour >= 13 && currentHour < 20) timeGreeting = '¡Buenas tardes';
    else if (currentHour >= 20 || currentHour < 6) timeGreeting = '¡Buenas noches';

    const adminName = currentUser.name ? currentUser.name.split(' ')[0] : 'Administrador';

    // Inyectar esqueleto estructural
    content.innerHTML = `
        <div class="motor-dashboard-wrapper">
            <!-- 🌟 1. HERO HEADER DE BIENVENIDA Y ACCIONES RÁPIDAS -->
            <section class="motor-hero-card">
                <div class="motor-hero-main">
                    <div class="motor-hero-greeting-box">
                        <div class="motor-cloud-pill">
                            <span class="motor-cloud-dot"></span>
                            <span class="motor-cloud-text">CLOUD FIRESTORE CONECTADO</span>
                            <span class="motor-role-tag">${isOrganizer ? 'ORGANIZADOR CLUB' : (isSuperAdmin ? 'SUPERADMIN' : 'EXECUTIVE ADMIN')}</span>
                        </div>
                        <h1 class="motor-hero-title">${timeGreeting}, <span class="motor-highlight-name">${adminName}</span> 👋</h1>
                        <p class="motor-hero-subtitle">Centro de Mando Somospadel BCN. Todo el control de competiciones, socios, marketing y lógica del sistema en un solo lugar.</p>
                    </div>

                    <div class="motor-hero-quick-actions">
                        <a href="index.html" class="motor-btn-quick" title="Ver App Jugador">
                            <i class="fas fa-mobile-screen-button"></i>
                            <span>App Jugador</span>
                        </a>
                        <button type="button" class="motor-btn-quick" onclick="window.loadAdminView('dashboard_home')" title="Actualizar Datos">
                            <i class="fas fa-arrows-rotate"></i>
                            <span>Refrescar</span>
                        </button>
                        ${!isOrganizer ? `
                        <a href="promo-studio.html?mode=copilot" target="_blank" class="motor-btn-quick motor-btn-quick-accent" title="Copiloto de Marketing para Alex">
                            <i class="fas fa-bolt"></i>
                            <span>Copiloto AI</span>
                        </a>
                        ` : ''}
                    </div>
                </div>

                <!-- 📊 2. LIVE METRICS CARDS (MÉTRICAS EN TIEMPO REAL) -->
                <div class="motor-metrics-grid">
                    <div class="motor-metric-card" onclick="${!isOrganizer ? "window.loadAdminView('users')" : ''}">
                        <div class="motor-metric-icon-box metric-blue">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="motor-metric-data">
                            <span class="motor-metric-label">JUGADORES TOTALES</span>
                            <div class="motor-metric-value-row">
                                <span class="motor-metric-value" id="motor-stat-players">--</span>
                                <span class="motor-metric-trend">BBDD Activa</span>
                            </div>
                        </div>
                    </div>

                    <div class="motor-metric-card" onclick="window.loadAdminView('americanas_mgmt')">
                        <div class="motor-metric-icon-box metric-amber">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="motor-metric-data">
                            <span class="motor-metric-label">AMERICANAS ACTIVAS</span>
                            <div class="motor-metric-value-row">
                                <span class="motor-metric-value" id="motor-stat-americanas">--</span>
                                <span class="motor-metric-trend text-amber">En Curso</span>
                            </div>
                        </div>
                    </div>

                    <div class="motor-metric-card" onclick="${!isOrganizer ? "window.loadAdminView('entrenos_mgmt')" : ''}">
                        <div class="motor-metric-icon-box metric-lime">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="motor-metric-data">
                            <span class="motor-metric-label">ENTRENOS HOY</span>
                            <div class="motor-metric-value-row">
                                <span class="motor-metric-value" id="motor-stat-entrenos">--</span>
                                <span class="motor-metric-trend text-lime">Sesiones</span>
                            </div>
                        </div>
                    </div>

                    <div class="motor-metric-card" onclick="${!isOrganizer ? "window.loadAdminView('sos_substitutes')" : ''}">
                        <div class="motor-metric-icon-box metric-red">
                            <i class="fas fa-handshake-angle"></i>
                        </div>
                        <div class="motor-metric-data">
                            <span class="motor-metric-label">SUPLENTES SOS / ALERTAS</span>
                            <div class="motor-metric-value-row">
                                <span class="motor-metric-value" id="motor-stat-sos">--</span>
                                <span class="motor-metric-trend text-red">En Espera</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 🔥 3. EVENTOS ACTIVOS & EN PISTA (SINCRONIZACIÓN EN DIRECTO) -->
            <section class="motor-live-events-section" id="motor-live-events-wrapper">
                <div class="motor-live-header">
                    <div class="motor-live-header-info">
                        <div class="motor-live-radar-badge">
                            <span class="motor-radar-pulse"></span>
                            <span class="motor-live-tag">EN DIRECTO • LIVE RADAR</span>
                        </div>
                        <h2 class="motor-live-title">🔥 EVENTOS ACTIVOS & EN PISTA (SINCRONIZACIÓN EN DIRECTO)</h2>
                        <p class="motor-live-subtitle">Monitor reactivo en tiempo real conectado a Firestore. Detección instantánea de americanas en juego, inscripciones abiertas y entrenos programados para hoy.</p>
                    </div>
                    <div class="motor-live-controls">
                        <button type="button" class="motor-live-refresh-btn" onclick="window.refreshMotorLiveEvents && window.refreshMotorLiveEvents()" title="Re-escanear eventos">
                            <i class="fas fa-satellite-dish"></i> <span>Escanear Ahora</span>
                        </button>
                    </div>
                </div>

                <!-- Contenedor dinámico de eventos en vivo -->
                <div id="motor-live-events-container" class="motor-live-events-grid">
                    <div class="motor-live-loading-state">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        <span>Sintonizando eventos activos en Firestore...</span>
                    </div>
                </div>
            </section>

            <!-- 🕹️ 4. "EL MOTOR DE OPERACIONES": COMMAND CENTER CATEGORIZADO -->
            <section class="motor-command-center">
                
                <!-- CATEGORÍA 1: 🎾 COMPETICIONES & DEPORTE -->
                <div class="motor-category-block">
                    <div class="motor-category-banner banner-sport">
                        <div class="motor-category-banner-bg" style="background-image: url('img/pista_padel_azul.png');"></div>
                        <div class="motor-category-banner-overlay"></div>
                        <div class="motor-category-banner-content">
                            <div class="motor-category-title-wrap">
                                <div class="motor-category-icon-pill cat-sport">🎾</div>
                                <div>
                                    <div class="motor-category-eyebrow">MODALIDADES & MATCHPLAY</div>
                                    <h2 class="motor-category-title">COMPETICIONES & DEPORTE</h2>
                                    <p class="motor-category-desc">Americanas, Entrenamientos dirigidos, Partidas Abiertas y Torneos oficiales del club.</p>
                                </div>
                            </div>
                            <span class="motor-category-count">11 Herramientas</span>
                        </div>
                    </div>

                    <div class="motor-cards-grid">
                        <!-- Americanas Gestor -->
                        <div class="motor-action-card border-blue" onclick="window.loadAdminView('americanas_mgmt')">
                            <div class="motor-card-media">
                                <img src="img/americana-pro.png" alt="Gestor de Americanas" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-blue">CORE</span>
                                <div class="motor-card-floating-icon bg-blue"><i class="fas fa-calendar-days"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Gestor de Americanas</h3>
                                <p class="motor-card-desc">Control integral de americanas activas, convocatorias, pistas, horarios y listados de jugadores.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Acceder al Gestor <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Crear Americana -->
                        <div class="motor-action-card border-blue" onclick="window.loadAdminView('americanas_create')">
                            <div class="motor-card-media">
                                <img src="img/padel-event.jpg" alt="Crear Americana" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-blue">CREAR</span>
                                <div class="motor-card-floating-icon bg-blue-sub"><i class="fas fa-circle-plus"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Crear Nueva Americana</h3>
                                <p class="motor-card-desc">Asistente guiado de configuración de evento: sede, niveles, límite de plazas, cuota y fecha.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Crear Evento <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Resultados Americanas -->
                        <div class="motor-action-card border-blue" onclick="window.loadAdminView('matches')">
                            <div class="motor-card-media">
                                <img src="img/portfolio_results.png" alt="Resultados & Marcadores" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-indigo">LIVE</span>
                                <div class="motor-card-floating-icon bg-indigo"><i class="fas fa-square-poll-vertical"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Resultados Americanas</h3>
                                <p class="motor-card-desc">Carga rápida de tanteos por ronda, clasificación acumulada, puntos y cierre oficial de jornada.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Gestionar Tanteos <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Simulador Americanas -->
                        <div class="motor-action-card border-purple" onclick="window.loadAdminView('simulator_empty')">
                            <div class="motor-card-media">
                                <img src="img/pista_padel_azul.png" alt="Simulador Rotaciones" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-purple">SIMULADOR</span>
                                <div class="motor-card-floating-icon bg-purple"><i class="fas fa-gamepad"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Simulador de Rotaciones</h3>
                                <p class="motor-card-desc">Simulador interactivo de cruces, algoritmo twister y cuadrantes sin repetición de parejas.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Probar Simulador <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        ${!isOrganizer ? `
                        <!-- Entrenos Gestor -->
                        <div class="motor-action-card border-lime" onclick="window.loadAdminView('entrenos_mgmt')">
                            <div class="motor-card-media">
                                <img src="img/entreno todo delfos.jpg" alt="Gestor de Entrenos" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-lime">ACADEMIA</span>
                                <div class="motor-card-floating-icon bg-lime"><i class="fas fa-graduation-cap"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Gestor de Entrenos</h3>
                                <p class="motor-card-desc">Administración de clases técnicas grupales, pistas reservadas, cupos e inscripciones.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Ver Entrenos <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Crear Entreno -->
                        <div class="motor-action-card border-lime" onclick="window.loadAdminView('entrenos_create')">
                            <div class="motor-card-media">
                                <img src="img/entreno mixto prat.jpg" alt="Crear Entreno" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-lime">CREAR</span>
                                <div class="motor-card-floating-icon bg-lime-sub"><i class="fas fa-calendar-plus"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Crear Nuevo Entreno</h3>
                                <p class="motor-card-desc">Programar sesión de técnica con profesor asignado, rango de nivel de juego y precio de plaza.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Lanzar Entreno <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Resultados Entrenos -->
                        <div class="motor-action-card border-lime" onclick="window.loadAdminView('entrenos_results')">
                            <div class="motor-card-media">
                                <img src="img/entreno masculino prat.jpg" alt="Resultados Entrenos" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-lime">EVALUACIÓN</span>
                                <div class="motor-card-floating-icon bg-olive"><i class="fas fa-clipboard-check"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Resultados de Entrenos</h3>
                                <p class="motor-card-desc">Control de asistencia, calibración de progresión de nivel y cierre de clases concluidas.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Evaluar Alumnos <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Partidas Abiertas Gestor -->
                        <div class="motor-action-card border-orange" onclick="window.loadAdminView('open_matches_mgmt')">
                            <div class="motor-card-media">
                                <img src="img/blog_racket_ball.png" alt="Partidas Abiertas" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-orange">OPEN</span>
                                <div class="motor-card-floating-icon bg-orange"><i class="fas fa-table-tennis-paddle-ball"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Partidas Abiertas</h3>
                                <p class="motor-card-desc">Supervisión de retos y partidos creados por los jugadores, pistas y plazas libres por completar.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Ver Partidas <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Crear Partida Abierta -->
                        <div class="motor-action-card border-orange" onclick="window.loadAdminView('open_matches_create')">
                            <div class="motor-card-media">
                                <img src="img/blog_action_smash.png" alt="Crear Partida Abierta" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-orange">RETO</span>
                                <div class="motor-card-floating-icon bg-orange-sub"><i class="fas fa-plus"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Crear Partida Abierta</h3>
                                <p class="motor-card-desc">Publicar una partida oficial abierta para que 4 jugadores de nivel homogéneo se apunten.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Publicar Partida <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Resultados Partidas Abiertas -->
                        <div class="motor-action-card border-orange" onclick="window.loadAdminView('open_matches_results')">
                            <div class="motor-card-media">
                                <img src="img/ball.png" alt="Resultados Partidas Abiertas" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-orange">HISTÓRICO</span>
                                <div class="motor-card-floating-icon bg-rust"><i class="fas fa-trophy"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Resultados Open</h3>
                                <p class="motor-card-desc">Validación de resultados y sets introducidos por los socios en partidas abiertas.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Revisar Scores <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Gestor de Torneos -->
                        <div class="motor-action-card border-gold" onclick="window.loadAdminView('tournaments_mgmt')">
                            <div class="motor-card-media">
                                <img src="img/blog_player_victory.png" alt="Gestor de Torneos" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-gold">OFICIAL</span>
                                <div class="motor-card-floating-icon bg-gold"><i class="fas fa-award"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Gestor de Torneos</h3>
                                <p class="motor-card-desc">Cuadros de eliminatorias, fases previas y torneos de fin de semana con trofeos.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Panel Torneos <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${!isOrganizer ? `
                <!-- CATEGORÍA 2: 👥 JUGADORES & CLUB -->
                <div class="motor-category-block">
                    <div class="motor-category-banner banner-users">
                        <div class="motor-category-banner-bg" style="background-image: url('img/portfolio_profile.png');"></div>
                        <div class="motor-category-banner-overlay"></div>
                        <div class="motor-category-banner-content">
                            <div class="motor-category-title-wrap">
                                <div class="motor-category-icon-pill cat-users">👥</div>
                                <div>
                                    <div class="motor-category-eyebrow">SOCIOS & COMUNIDAD</div>
                                    <h2 class="motor-category-title">JUGADORES & CLUB</h2>
                                    <p class="motor-category-desc">Censo de socios, bolsa de emergencia SOS y formación de equipos de competición.</p>
                                </div>
                            </div>
                            <span class="motor-category-count">3 Herramientas</span>
                        </div>
                    </div>

                    <div class="motor-cards-grid">
                        <!-- Base de Datos -->
                        <div class="motor-action-card border-sky" onclick="window.loadAdminView('users')">
                            <div class="motor-card-media">
                                <img src="img/portfolio_profile.png" alt="Base de Datos Jugadores" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-sky">BBDD</span>
                                <div class="motor-card-floating-icon bg-sky"><i class="fas fa-users-gear"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Base de Datos de Jugadores</h3>
                                <p class="motor-card-desc">Padrón general, asignación y ajuste de niveles ELO, roles (Admin/Jugador) y exportación a Excel.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Gestionar Socios <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Suplentes SOS -->
                        <div class="motor-action-card border-red" onclick="window.loadAdminView('sos_substitutes')">
                            <div class="motor-card-media">
                                <img src="img/blog_court_night.png" alt="Bolsa Suplentes SOS" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-red">EMERGENCIA</span>
                                <div class="motor-card-floating-icon bg-red"><i class="fas fa-handshake-angle"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Bolsa de Suplentes SOS</h3>
                                <p class="motor-card-desc">Reemplazo instantáneo de bajas de última hora con disparador de mensajes y convocatorias.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Ver Suplentes SOS <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Equipos Temporada 2027 -->
                        <div class="motor-action-card border-emerald" onclick="window.loadAdminView('season_campaign')">
                            <div class="motor-card-media">
                                <img src="img/flyer_temporada_2027.jpg" alt="Equipos Temporada 2027" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-emerald">TEMPORADA</span>
                                <div class="motor-card-floating-icon bg-emerald"><i class="fas fa-users-rays"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Equipos Temporada 2027</h3>
                                <p class="motor-card-desc">Campaña de inscripción de equipos, capitanes, selección de sedes y listas de titulares.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Abrir Campaña <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CATEGORÍA 3: ⚡ MARKETING & COPILOTO -->
                <div class="motor-category-block">
                    <div class="motor-category-banner banner-ai">
                        <div class="motor-category-banner-bg" style="background-image: url('img/brain_ball_mascot_3d.png');"></div>
                        <div class="motor-category-banner-overlay"></div>
                        <div class="motor-category-banner-content">
                            <div class="motor-category-title-wrap">
                                <div class="motor-category-icon-pill cat-ai">⚡</div>
                                <div>
                                    <div class="motor-category-eyebrow">CREATIVIDAD & INTELIGENCIA ARTIFICIAL</div>
                                    <h2 class="motor-category-title">MARKETING & COPILOTO</h2>
                                    <p class="motor-category-desc">Herramientas de difusión masiva, copys de WhatsApp, analítica de retención y blog.</p>
                                </div>
                            </div>
                            <span class="motor-category-count">3 Herramientas</span>
                        </div>
                    </div>

                    <div class="motor-cards-grid">
                        <!-- Copiloto Alex -->
                        <div class="motor-action-card border-neon" onclick="window.open('promo-studio.html?mode=copilot', '_blank')">
                            <div class="motor-card-media">
                                <img src="img/brain_ball_mascot_3d.png" alt="Marketing & Copiloto Alex" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-neon">IA COPILOT</span>
                                <div class="motor-card-floating-icon bg-neon"><i class="fas fa-bolt"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Marketing & Copiloto Alex</h3>
                                <p class="motor-card-desc">Generador de creatividades con IA, automatización de convocatorias WhatsApp y copys de alto impacto.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Lanzar Copiloto <i class="fas fa-arrow-up-right-from-square"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Smart Analytics -->
                        <div class="motor-action-card border-cyan" onclick="window.loadAdminView('analytics')">
                            <div class="motor-card-media">
                                <img src="img/portfolio_results.png" alt="Smart Analytics" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-cyan">METRICS</span>
                                <div class="motor-card-floating-icon bg-cyan"><i class="fas fa-chart-pie"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Smart Analytics</h3>
                                <p class="motor-card-desc">Métricas de ocupación de pistas, evolución de inscripciones, retención de jugadores y horas punta.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Consultar Métricas <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Gestor de Blog -->
                        <div class="motor-action-card border-sky" onclick="window.loadAdminView('blog_posts')">
                            <div class="motor-card-media">
                                <img src="img/blog_club_lounge.png" alt="Gestor de Blog" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-sky">CONTENIDO</span>
                                <div class="motor-card-floating-icon bg-sky-sub"><i class="fas fa-newspaper"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Gestor de Blog y Noticias</h3>
                                <p class="motor-card-desc">Editor de publicaciones para la comunidad, crónicas de torneos y novedades oficiales.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Redactar Post <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CATEGORÍA 4: 🛠️ LÓGICA, SISTEMA & MANTENIMIENTO -->
                <div class="motor-category-block">
                    <div class="motor-category-banner banner-sys">
                        <div class="motor-category-banner-bg" style="background-image: url('img/logo_neon.png');"></div>
                        <div class="motor-category-banner-overlay"></div>
                        <div class="motor-category-banner-content">
                            <div class="motor-category-title-wrap">
                                <div class="motor-category-icon-pill cat-sys">🛠️</div>
                                <div>
                                    <div class="motor-category-eyebrow">NÚCLEO & TELEMETRÍA</div>
                                    <h2 class="motor-category-title">LÓGICA, SISTEMA & MANTENIMIENTO</h2>
                                    <p class="motor-category-desc">Laboratorio de algoritmos, recálculos ELO cronológicos, telemetría y diagnósticos de base de datos.</p>
                                </div>
                            </div>
                            <span class="motor-category-count">6 Herramientas</span>
                        </div>
                    </div>

                    <div class="motor-cards-grid">
                        <!-- Auditoría de Lógica (Lab) -->
                        <div class="motor-action-card border-sky" onclick="window.loadAdminView('logic_lab')">
                            <div class="motor-card-media">
                                <img src="img/logo_neon.png" alt="Auditoría de Lógica Lab" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-sky">LABORATORIO</span>
                                <div class="motor-card-floating-icon bg-sky"><i class="fas fa-flask-vial"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Auditoría de Lógica (Lab)</h3>
                                <p class="motor-card-desc">Suite de pruebas sintéticas para auditar emparejamientos, cálculo de puntos y reglas de rotación.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Abrir Lab <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Recálculo ELO -->
                        <div class="motor-action-card border-purple" onclick="if (window.runUnifiedRecalculation) window.runUnifiedRecalculation(this); else window.loadAdminView('users');">
                            <div class="motor-card-media">
                                <img src="img/official_ball_logo.png" alt="Recálculo Niveles ELO" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-purple">CANÓNICO</span>
                                <div class="motor-card-floating-icon bg-purple"><i class="fas fa-rotate"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Recálculo Niveles ELO</h3>
                                <p class="motor-card-desc">Ejecuta el recálculo cronológico matemático de todos los historiales de partidos de la comunidad.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Ejecutar Recálculo <i class="fas fa-bolt"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Telemetría & Caché -->
                        <div class="motor-action-card border-emerald" onclick="window.loadAdminView('system_telemetry')">
                            <div class="motor-card-media">
                                <img src="img/blog_ball_glass.png" alt="Telemetría & Caché" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-emerald">TELEMETRÍA</span>
                                <div class="motor-card-floating-icon bg-emerald"><i class="fas fa-heartbeat"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Telemetría & Caché</h3>
                                <p class="motor-card-desc">Diagnóstico de latencia de red, rendimiento de consultas Firestore y purga de caché local.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Ver Estado <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Diagnóstico BD -->
                        <div class="motor-action-card border-slate" onclick="window.loadAdminView('database_health')">
                            <div class="motor-card-media">
                                <img src="img/pista_padel_azul.png" alt="Diagnóstico BD" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-slate">SALUD BD</span>
                                <div class="motor-card-floating-icon bg-slate"><i class="fas fa-stethoscope"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Diagnóstico de Base de Datos</h3>
                                <p class="motor-card-desc">Detección de registros huérfanos, inconsistencias en marcadores y reparación de documentos.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Inspeccionar BD <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Purgar Alertas Superadmin -->
                        <div class="motor-action-card border-crimson" onclick="window.loadAdminView('notifications_manager')">
                            <div class="motor-card-media">
                                <img src="img/blog_action_smash.png" alt="Purgar Alertas" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-crimson">SUPERADMIN</span>
                                <div class="motor-card-floating-icon bg-crimson"><i class="fas fa-bell-slash"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Purgar Alertas & Notificaciones</h3>
                                <p class="motor-card-desc">Herramienta masiva para limpiar alertas residuales, notificaciones caducadas y cola push.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Administrar Alertas <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>

                        <!-- Reparar Jugadores -->
                        <div class="motor-action-card border-amber" onclick="window.loadAdminView('fix_players')">
                            <div class="motor-card-media">
                                <img src="img/portfolio_agenda.png" alt="Reparar Jugadores" class="motor-card-img" loading="lazy" decoding="async">
                                <div class="motor-card-media-overlay"></div>
                                <span class="motor-card-floating-badge badge-amber">REPARACIÓN</span>
                                <div class="motor-card-floating-icon bg-amber"><i class="fas fa-wrench"></i></div>
                            </div>
                            <div class="motor-card-body">
                                <h3 class="motor-card-title">Reparar Jugadores</h3>
                                <p class="motor-card-desc">Saneamiento de identificadores UID, teléfonos mal formateados y duplicados de usuarios.</p>
                                <div class="motor-card-footer">
                                    <span class="motor-card-link">Reparar Datos <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

            </section>
        </div>

        <style>
            /* =========================================================
               ESTILOS ENTERPRISE MATTE: MOTOR DE OPERACIONES ADMIN
               ========================================================= */
            .motor-dashboard-wrapper {
                display: flex;
                flex-direction: column;
                gap: 2rem;
                width: 100%;
                max-width: 1400px;
                margin: 0 auto;
                animation: fadeInMotor 0.35s ease-out;
                overflow-x: hidden !important;
            }

            @keyframes fadeInMotor {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* --- 1. HERO HEADER --- */
            .motor-hero-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 1.75rem;
                box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .motor-hero-main {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1.5rem;
                flex-wrap: wrap;
            }

            .motor-hero-greeting-box {
                flex: 1;
                min-width: 280px;
            }

            .motor-cloud-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.72rem;
                font-weight: 800;
                color: #334155;
                margin-bottom: 0.85rem;
            }

            .motor-cloud-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #22c55e;
                box-shadow: 0 0 8px #22c55e;
                display: inline-block;
                animation: pulseGreen 2s infinite ease-in-out;
            }

            @keyframes pulseGreen {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.7; }
            }

            .motor-role-tag {
                background: #0f172a;
                color: #ccff00;
                padding: 2px 7px;
                border-radius: 6px;
                font-size: 0.65rem;
                font-weight: 900;
                letter-spacing: 0.5px;
            }

            .motor-hero-title {
                font-size: 1.85rem;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: -0.02em;
                margin: 0 0 0.5rem 0;
                line-height: 1.2;
            }

            .motor-highlight-name {
                color: #0284c7;
            }

            .motor-hero-subtitle {
                font-size: 0.95rem;
                color: #64748b;
                margin: 0;
                line-height: 1.5;
                max-width: 720px;
            }

            .motor-hero-quick-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .motor-btn-quick {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 12px;
                color: #0f172a;
                font-size: 0.85rem;
                font-weight: 700;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .motor-btn-quick:hover {
                background: #e2e8f0;
                color: #000000;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            .motor-btn-quick-accent {
                background: #ccff00 !important;
                border-color: #0f172a !important;
                color: #0f172a !important;
                font-weight: 900 !important;
            }

            .motor-btn-quick-accent:hover {
                background: #bbf000 !important;
                box-shadow: 0 4px 15px rgba(204, 255, 0, 0.4) !important;
            }

            /* --- 2. METRICS ROW --- */
            .motor-metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.25rem;
                border-top: 1px solid #f1f5f9;
                padding-top: 1.5rem;
            }

            .motor-metric-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 1.25rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .motor-metric-card:hover {
                background: #ffffff;
                border-color: #cbd5e1;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
            }

            .motor-metric-icon-box {
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.3rem;
                flex-shrink: 0;
            }

            .metric-blue { background: #e0f2fe; color: #0284c7; }
            .metric-amber { background: #fef3c7; color: #d97706; }
            .metric-lime { background: #ecfccb; color: #65a30d; }
            .metric-red { background: #fee2e2; color: #dc2626; }

            .motor-metric-data {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .motor-metric-label {
                font-size: 0.68rem;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #64748b;
                text-transform: uppercase;
                margin-bottom: 2px;
            }

            .motor-metric-value-row {
                display: flex;
                align-items: baseline;
                gap: 8px;
            }

            .motor-metric-value {
                font-size: 1.7rem;
                font-weight: 900;
                color: #0f172a;
                line-height: 1;
            }

            .motor-metric-trend {
                font-size: 0.72rem;
                font-weight: 700;
                color: #64748b;
            }

            .text-amber { color: #d97706 !important; }
            .text-lime { color: #65a30d !important; }
            .text-red { color: #dc2626 !important; }

            /* --- 🔥 3. EVENTOS ACTIVOS & EN PISTA (LIVE RADAR) --- */
            .motor-live-events-section {
                background: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 20px;
                padding: 1.75rem;
                color: #ffffff;
                box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.4);
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                position: relative;
                overflow: hidden;
            }

            .motor-live-events-section::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 380px;
                height: 380px;
                background: radial-gradient(circle, rgba(204, 255, 0, 0.08) 0%, transparent 70%);
                pointer-events: none;
            }

            .motor-live-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1.5rem;
                flex-wrap: wrap;
                position: relative;
                z-index: 2;
            }

            .motor-live-header-info {
                flex: 1;
                min-width: 280px;
            }

            .motor-live-radar-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(204, 255, 0, 0.12);
                border: 1px solid rgba(204, 255, 0, 0.35);
                padding: 4px 12px;
                border-radius: 20px;
                margin-bottom: 0.65rem;
            }

            .motor-radar-pulse {
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background: #ccff00;
                box-shadow: 0 0 10px #ccff00;
                display: inline-block;
                animation: radarBlink 1.4s infinite ease-in-out;
            }

            @keyframes radarBlink {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(1.4); }
            }

            .motor-live-tag {
                font-size: 0.72rem;
                font-weight: 900;
                letter-spacing: 0.8px;
                color: #ccff00;
            }

            .motor-live-title {
                font-size: 1.45rem;
                font-weight: 900;
                color: #ffffff;
                margin: 0 0 0.35rem 0;
                letter-spacing: -0.01em;
            }

            .motor-live-subtitle {
                font-size: 0.88rem;
                color: #94a3b8;
                margin: 0;
                line-height: 1.45;
                max-width: 780px;
            }

            .motor-live-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .motor-live-refresh-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #e2e8f0;
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 0.82rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .motor-live-refresh-btn:hover {
                background: rgba(255, 255, 255, 0.16);
                color: #ffffff;
                transform: translateY(-2px);
            }

            /* LIVE EVENTS GRID */
            .motor-live-events-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 1.25rem;
                position: relative;
                z-index: 2;
            }

            /* Loading State */
            .motor-live-loading-state {
                grid-column: 1 / -1;
                padding: 2.5rem;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 12px;
                color: #94a3b8;
                font-size: 0.95rem;
                font-weight: 700;
            }

            .motor-live-loading-state i {
                font-size: 2rem;
                color: #38bdf8;
            }

            /* Empty State: Radar Scan */
            .motor-live-empty-state {
                grid-column: 1 / -1;
                background: rgba(255, 255, 255, 0.03);
                border: 1px dashed rgba(255, 255, 255, 0.12);
                border-radius: 16px;
                padding: 2rem;
                display: flex;
                align-items: center;
                gap: 2rem;
                flex-wrap: wrap;
            }

            .motor-radar-scanner-box {
                width: 76px;
                height: 76px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(204, 255, 0, 0.15) 0%, rgba(15, 23, 42, 0.8) 70%);
                border: 2px solid rgba(204, 255, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
                box-shadow: 0 0 20px rgba(204, 255, 0, 0.2);
            }

            .motor-radar-sweep {
                position: absolute;
                inset: 0;
                background: conic-gradient(from 0deg, transparent 0deg, rgba(204, 255, 0, 0.4) 60deg, transparent 70deg);
                animation: radarRotate 3s linear infinite;
            }

            @keyframes radarRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .motor-radar-icon {
                font-size: 1.6rem;
                color: #ccff00;
                position: relative;
                z-index: 2;
            }

            .motor-live-empty-content {
                flex: 1;
                min-width: 260px;
            }

            .motor-empty-title {
                font-size: 1.15rem;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 0.35rem 0;
            }

            .motor-empty-desc {
                font-size: 0.85rem;
                color: #94a3b8;
                margin: 0 0 1.25rem 0;
                line-height: 1.5;
            }

            .motor-empty-actions {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            /* LIVE CARD COMPONENT */
            .motor-live-card {
                position: relative;
                border-radius: 16px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: #1e293b;
                display: flex;
                flex-direction: column;
                min-height: 250px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
            }

            .motor-live-card:hover {
                transform: translateY(-4px);
                border-color: rgba(204, 255, 0, 0.5);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
            }

            .motor-live-card-bg {
                position: absolute;
                inset: 0;
                background-size: cover;
                background-position: center;
                transition: transform 0.5s ease;
            }

            .motor-live-card:hover .motor-live-card-bg {
                transform: scale(1.05);
            }

            .motor-live-card-glass {
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.88) 55%, #0f172a 100%);
            }

            .motor-live-card-content {
                position: relative;
                z-index: 2;
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                flex: 1;
                justify-content: space-between;
                gap: 0.75rem;
            }

            .motor-live-card-topbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .motor-live-badge-live {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.7rem;
                font-weight: 900;
                letter-spacing: 0.5px;
            }

            .badge-en-pista {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.6);
                color: #f87171;
            }

            .badge-abierta {
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.6);
                color: #4ade80;
            }

            .badge-entreno {
                background: rgba(204, 255, 0, 0.2);
                border: 1px solid rgba(204, 255, 0, 0.6);
                color: #ccff00;
            }

            .badge-proximo {
                background: rgba(14, 165, 233, 0.2);
                border: 1px solid rgba(14, 165, 233, 0.6);
                color: #38bdf8;
            }

            .motor-badge-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: currentColor;
                display: inline-block;
                animation: liveBlink 1.2s infinite ease-in-out;
            }

            @keyframes liveBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }

            .motor-live-type-pill {
                background: rgba(255, 255, 255, 0.12);
                color: #f1f5f9;
                font-size: 0.65rem;
                font-weight: 800;
                padding: 3px 8px;
                border-radius: 6px;
                letter-spacing: 0.5px;
            }

            .motor-live-card-title {
                font-size: 1.15rem;
                font-weight: 800;
                color: #ffffff;
                margin: 0;
                line-height: 1.25;
            }

            .motor-live-card-meta {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 0.78rem;
                color: #cbd5e1;
            }

            .motor-live-card-meta span {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .motor-live-card-meta i {
                color: #38bdf8;
                width: 14px;
            }

            .motor-live-occupancy-wrap {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .motor-live-occupancy-labels {
                display: flex;
                justify-content: space-between;
                font-size: 0.72rem;
                color: #94a3b8;
            }

            .motor-live-occupancy-labels strong {
                color: #f8fafc;
            }

            .motor-live-occupancy-pct {
                font-weight: 900;
                color: #ccff00;
            }

            .motor-live-progress-bar-track {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                overflow: hidden;
            }

            .motor-live-progress-bar-fill {
                height: 100%;
                border-radius: 10px;
                transition: width 0.4s ease;
            }

            .bar-green { background: linear-gradient(90deg, #10b981, #34d399); }
            .bar-amber { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
            .bar-blue { background: linear-gradient(90deg, #0284c7, #38bdf8); }
            .bar-lime { background: linear-gradient(90deg, #65a30d, #ccff00); }

            .motor-live-card-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
            }

            .motor-live-btn-action {
                flex: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 8px 12px;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                font-size: 0.76rem;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .motor-live-btn-action:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: #ffffff;
                transform: translateY(-1px);
            }

            .btn-action-live {
                background: #ccff00 !important;
                border-color: #ccff00 !important;
                color: #0f172a !important;
                font-weight: 900 !important;
            }

            .btn-action-live:hover {
                background: #bbf000 !important;
                box-shadow: 0 0 12px rgba(204, 255, 0, 0.5) !important;
            }

            .btn-action-entreno {
                background: #38bdf8 !important;
                border-color: #38bdf8 !important;
                color: #0f172a !important;
                font-weight: 900 !important;
            }

            /* --- 4. COMMAND CENTER & CATEGORY BANNERS --- */
            .motor-command-center {
                display: flex;
                flex-direction: column;
                gap: 2.5rem;
            }

            .motor-category-block {
                display: flex;
                flex-direction: column;
                gap: 1.25rem;
            }

            /* CATEGORY HEADER BANNER */
            .motor-category-banner {
                position: relative;
                border-radius: 18px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                background: #0f172a;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
            }

            .motor-category-banner-bg {
                position: absolute;
                inset: 0;
                background-size: cover;
                background-position: center;
                opacity: 0.22;
                transition: transform 0.6s ease;
            }

            .motor-category-banner:hover .motor-category-banner-bg {
                transform: scale(1.03);
            }

            .motor-category-banner-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.78) 50%, rgba(15, 23, 42, 0.92) 100%);
            }

            .motor-category-banner-content {
                position: relative;
                z-index: 2;
                padding: 1.25rem 1.75rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1.5rem;
                flex-wrap: wrap;
            }

            .motor-category-title-wrap {
                display: flex;
                align-items: center;
                gap: 14px;
            }

            .motor-category-icon-pill {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.35rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(4px);
            }

            .motor-category-eyebrow {
                font-size: 0.65rem;
                font-weight: 900;
                letter-spacing: 1px;
                color: #ccff00;
                text-transform: uppercase;
                margin-bottom: 2px;
            }

            .motor-category-title {
                font-size: 1.25rem;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: -0.01em;
                margin: 0;
            }

            .motor-category-desc {
                font-size: 0.82rem;
                color: #94a3b8;
                margin: 3px 0 0 0;
            }

            .motor-category-count {
                font-size: 0.72rem;
                font-weight: 800;
                color: #e2e8f0;
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.15);
                padding: 4px 12px;
                border-radius: 20px;
                backdrop-filter: blur(4px);
            }

            /* CARDS GRID */
            .motor-cards-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.25rem;
            }

            /* INDIVIDUAL ACTION CARD CON MEDIA CONTAINER */
            .motor-action-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 18px;
                padding: 0;
                display: flex;
                flex-direction: column;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
                position: relative;
                overflow: hidden;
            }

            .motor-action-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
                border-color: #cbd5e1;
            }

            .motor-action-card:active {
                transform: scale(0.98);
            }

            /* MEDIA CONTAINER DE LA CARD (IMAGEN PROPORCIONADA) */
            .motor-card-media {
                position: relative;
                width: 100%;
                height: 120px;
                background: #0f172a;
                overflow: hidden;
            }

            .motor-card-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                transition: transform 0.4s ease;
            }

            .motor-action-card:hover .motor-card-img {
                transform: scale(1.05);
            }

            .motor-card-media-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.72) 100%);
                pointer-events: none;
            }

            .motor-card-floating-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 2;
                font-size: 0.65rem;
                font-weight: 900;
                padding: 3px 8px;
                border-radius: 6px;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            }

            .motor-card-floating-icon {
                position: absolute;
                bottom: 10px;
                left: 12px;
                z-index: 2;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.05rem;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
            }

            /* Icon Color Varieties */
            .bg-blue { background: #dbeafe; color: #2563eb; }
            .bg-blue-sub { background: #eff6ff; color: #3b82f6; }
            .bg-indigo { background: #e0e7ff; color: #4f46e5; }
            .bg-purple { background: #ede9fe; color: #7c3aed; }
            .bg-lime { background: #ecfccb; color: #65a30d; }
            .bg-lime-sub { background: #f7fee7; color: #84cc16; }
            .bg-olive { background: #f0fdf4; color: #16a34a; }
            .bg-orange { background: #ffedd5; color: #ea580c; }
            .bg-orange-sub { background: #fff7ed; color: #f97316; }
            .bg-rust { background: #fee2e2; color: #c2410c; }
            .bg-gold { background: #fef9c3; color: #ca8a04; }
            .bg-sky { background: #e0f2fe; color: #0284c7; }
            .bg-sky-sub { background: #f0f9ff; color: #0369a1; }
            .bg-red { background: #fee2e2; color: #dc2626; }
            .bg-emerald { background: #d1fae5; color: #059669; }
            .bg-neon { background: #0f172a; color: #ccff00; }
            .bg-cyan { background: #cffafe; color: #0891b2; }
            .bg-slate { background: #f1f5f9; color: #475569; }
            .bg-crimson { background: #ffe4e6; color: #e11d48; }
            .bg-amber { background: #fef3c7; color: #d97706; }

            .badge-blue { background: #dbeafe; color: #1d4ed8; }
            .badge-indigo { background: #e0e7ff; color: #4338ca; }
            .badge-purple { background: #ede9fe; color: #6d28d9; }
            .badge-lime { background: #ecfccb; color: #4d7c0f; }
            .badge-orange { background: #ffedd5; color: #c2410c; }
            .badge-gold { background: #fef9c3; color: #a16207; }
            .badge-sky { background: #e0f2fe; color: #0369a1; }
            .badge-red { background: #fee2e2; color: #b91c1c; }
            .badge-emerald { background: #d1fae5; color: #047857; }
            .badge-neon { background: #0f172a; color: #ccff00; }
            .badge-cyan { background: #cffafe; color: #0e7490; }
            .badge-slate { background: #f1f5f9; color: #334155; }
            .badge-crimson { background: #ffe4e6; color: #be123c; }
            .badge-amber { background: #fef3c7; color: #b45309; }

            /* CARD BODY */
            .motor-card-body {
                padding: 1.15rem 1.25rem;
                display: flex;
                flex-direction: column;
                flex: 1;
            }

            .motor-card-title {
                font-size: 0.98rem;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 0.4rem 0;
                line-height: 1.25;
            }

            .motor-card-desc {
                font-size: 0.8rem;
                color: #64748b;
                margin: 0 0 1.25rem 0;
                line-height: 1.45;
                flex: 1;
            }

            .motor-card-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                border-top: 1px solid #f1f5f9;
                padding-top: 0.75rem;
                margin-top: auto;
            }

            .motor-card-link {
                font-size: 0.78rem;
                font-weight: 800;
                color: #0284c7;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: transform 0.2s ease;
            }

            .motor-action-card:hover .motor-card-link {
                transform: translateX(4px);
                color: #0369a1;
            }

            /* --- 5. RESPONSIVE BREAKPOINTS (PC, TABLET, MOBILE) --- */

            /* PC / Laptops Medianas (1025px - 1280px) */
            @media (max-width: 1280px) {
                .motor-cards-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
            }

            /* Tablet (769px - 1024px) */
            @media (max-width: 1024px) {
                .motor-metrics-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .motor-cards-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                .motor-live-events-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            /* Móvil (< 768px) */
            @media (max-width: 768px) {
                .motor-dashboard-wrapper {
                    gap: 1.5rem;
                }

                .motor-hero-card {
                    padding: 1.25rem;
                    border-radius: 16px;
                }

                .motor-hero-title {
                    font-size: 1.45rem;
                }

                .motor-hero-quick-actions {
                    width: 100%;
                }

                .motor-btn-quick {
                    flex: 1;
                    justify-content: center;
                    padding: 8px 12px;
                    font-size: 0.8rem;
                }

                .motor-metrics-grid {
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }

                .motor-metric-card {
                    padding: 1rem;
                }

                .motor-live-events-section {
                    padding: 1.25rem;
                    border-radius: 16px;
                }

                .motor-live-title {
                    font-size: 1.25rem;
                }

                .motor-live-events-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .motor-live-empty-state {
                    padding: 1.25rem;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .motor-category-banner-content {
                    padding: 1rem 1.25rem;
                }

                .motor-cards-grid {
                    grid-template-columns: 1fr;
                    gap: 0.85rem;
                }
            }
        </style>
    `;

    // ⚡ SISTEMA DE SINCRONIZACIÓN REACTIVA EN TIEMPO REAL CON FIRESTORE
    let liveAmericanasData = [];
    let liveEntrenosData = [];

    function renderLiveEventsCards() {
        const container = document.getElementById('motor-live-events-container');
        if (!container) return;

        const totalActive = liveAmericanasData.length + liveEntrenosData.length;

        if (totalActive === 0) {
            container.innerHTML = `
                <div class="motor-live-empty-state">
                    <div class="motor-radar-scanner-box">
                        <div class="motor-radar-sweep"></div>
                        <i class="fas fa-satellite-dish motor-radar-icon"></i>
                    </div>
                    <div class="motor-live-empty-content">
                        <h4 class="motor-empty-title">Radar de Pista Activo • Sin eventos en juego ahora mismo</h4>
                        <p class="motor-empty-desc">Firestore está sincronizado en tiempo real. Cuando una americana o entreno pase a estar activo o en pista, aparecerá aquí inmediatamente con métricas en directo.</p>
                        <div class="motor-empty-actions">
                            <button class="motor-btn-quick motor-btn-quick-accent" onclick="window.loadAdminView('americanas_create')">
                                <i class="fas fa-plus-circle"></i> Crear Nueva Americana
                            </button>
                            <button class="motor-btn-quick" onclick="window.loadAdminView('entrenos_create')">
                                <i class="fas fa-calendar-plus"></i> Crear Nuevo Entreno
                            </button>
                            <button class="motor-btn-quick" onclick="window.loadAdminView('open_matches_create')">
                                <i class="fas fa-table-tennis-paddle-ball"></i> Crear Partida Abierta
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        let cardsHtml = '';
        const todayStr = new Date().toISOString().split('T')[0];

        // Helper para fechas amigables en español
        function formatFriendlyDate(dateStr, timeStr) {
            if (!dateStr || dateStr === 'Hoy') return timeStr ? `${timeStr}h` : 'Hora por confirmar';
            if (dateStr === todayStr) {
                return `Hoy • ${timeStr || '18:00'}h`;
            }
            try {
                let y, m, d;
                if (dateStr.includes('-')) {
                    [y, m, d] = dateStr.split('-').map(Number);
                } else if (dateStr.includes('/')) {
                    const p = dateStr.split('/').map(Number);
                    [d, m, y] = [p[0], p[1], p[2]];
                }
                if (y && m && d) {
                    const dt = new Date(y, m - 1, d);
                    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    const dayName = days[dt.getDay()] || '';
                    const monthName = months[dt.getMonth()] || '';
                    return `${dayName} ${d} ${monthName} • ${timeStr || '18:00'}h`;
                }
            } catch(e) {}
            return `${dateStr} • ${timeStr || ''}`;
        }

        // 1. Tarjetas de Americanas Activas
        liveAmericanasData.forEach(ev => {
            // Sincronización 100% con cartel real del torneo
            const poster = (() => {
                const raw = ev.image_url || ev.imageUrl || ev.poster || ev.posterUrl || ev.cover || ev.flyer;
                if (raw && typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
                const title = (ev.name || ev.title || '').toLowerCase();
                const gender = (ev.gender || ev.category || '').toLowerCase();
                if (gender.includes('fem') || title.includes('femenin')) return 'img/americana femeninas.jpg';
                if (gender.includes('masc') || title.includes('masculin') || title.includes('nocturna') || title.includes('pro')) return 'img/americana masculina.jpg';
                return 'img/americana mixta.jpg';
            })();
            const name = ev.name || ev.title || 'Americana Somospadel';
            const club = ev.location || ev.club || ev.venue || 'Club Somospadel BCN';
            const date = ev.date || 'Hoy';
            const time = ev.time || ev.startTime || '18:00';
            const format = (ev.format || ev.type || 'Twister').toString().toUpperCase();
            
            // Pistas y Plazas reales de la americana
            const courts = parseInt(ev.max_courts || ev.courts || ev.num_courts || 0);
            const registered = Array.isArray(ev.registeredPlayers) 
                ? ev.registeredPlayers.length 
                : (Array.isArray(ev.players) ? ev.players.length : (ev.currentPlayers || 0));
            const max = parseInt(ev.max_players || ev.maxPlayers || ev.totalSlots || (courts > 0 ? courts * 4 : 16));
            const pct = Math.min(100, Math.round((registered / (max || 1)) * 100));

            const rawStatus = (ev.status || '').toLowerCase();
            const isEnPista = ['in_progress', 'live', 'en_curso', 'jugando'].includes(rawStatus);
            const isToday = (ev.date || '') === todayStr;
            const isFull = registered >= max;

            let badgeText = '🟢 ABIERTA';
            let badgeClass = 'badge-abierta';
            if (isEnPista) {
                badgeText = '🔴 EN PISTA';
                badgeClass = 'badge-en-pista';
            } else if (isToday) {
                badgeText = '🎾 HOY EN PISTA';
                badgeClass = 'badge-en-pista';
            } else if (ev.date && ev.date > todayStr) {
                badgeText = '📅 PRÓXIMA';
                badgeClass = 'badge-proximo';
            }

            const barColor = isFull ? 'bar-green' : (isEnPista ? 'bar-amber' : 'bar-blue');

            cardsHtml += `
                <div class="motor-live-card live-card-americana" onclick="window.loadAdminView('americanas_mgmt')">
                    <div class="motor-live-card-bg" style="background-image: url('${poster}');">
                        <div class="motor-live-card-glass"></div>
                    </div>
                    <div class="motor-live-card-content">
                        <div class="motor-live-card-topbar">
                            <span class="motor-live-badge-live ${badgeClass}">
                                <span class="motor-badge-dot"></span> ${badgeText}
                            </span>
                            <span class="motor-live-type-pill">${format}</span>
                        </div>
                        <h4 class="motor-live-card-title">${name}</h4>
                        <div class="motor-live-card-meta">
                            <span><i class="fas fa-location-dot"></i> ${club}</span>
                            <span><i class="fas fa-table-tennis-paddle-ball"></i> <strong>${courts > 0 ? `${courts} Pistas` : '4 Pistas'}</strong></span>
                            <span><i class="fas fa-clock"></i> ${formatFriendlyDate(date, time)}</span>
                        </div>
                        <div class="motor-live-occupancy-wrap">
                            <div class="motor-live-occupancy-labels">
                                <span>Inscripción: <strong>${registered}/${max} Jugadores</strong> ${courts > 0 ? `(${courts} Pistas)` : ''}</span>
                                <span class="motor-live-occupancy-pct">${pct}%</span>
                            </div>
                            <div class="motor-live-progress-bar-track">
                                <div class="motor-live-progress-bar-fill ${barColor}" style="width: ${pct}%"></div>
                            </div>
                        </div>
                        <div class="motor-live-card-actions" onclick="event.stopPropagation()">
                            <button type="button" class="motor-live-btn-action" onclick="window.loadAdminView('americanas_mgmt')">
                                <i class="fas fa-sliders"></i> Gestionar
                            </button>
                            <button type="button" class="motor-live-btn-action btn-action-live" onclick="window.loadAdminView('matches')">
                                <i class="fas fa-tv"></i> Marcador en Vivo
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // 2. Tarjetas de Entrenos Activos / Próximos
        liveEntrenosData.forEach(en => {
            const poster = en.posterUrl || en.imageUrl || en.image_url || 'img/entreno todo delfos.jpg';
            const title = en.title || en.name || 'Entrenamiento Técnico Somospadel';
            const club = en.location || en.club || en.sede || 'Club Somospadel BCN';
            const date = en.date || 'Hoy';
            const time = en.time || en.startTime || '18:00';
            
            // Pistas y Plazas reales del entreno (max_courts * 4 alumnos por pista)
            const courts = parseInt(en.max_courts || en.courts || en.num_courts || en.pistas || 0);
            const registered = Array.isArray(en.registeredPlayers) 
                ? en.registeredPlayers.length 
                : (Array.isArray(en.players) ? en.players.length : (en.currentPlayers || 0));
            const max = parseInt(en.max_players || en.maxPlayers || en.slots || (courts > 0 ? courts * 4 : (en.players && en.players.length > 8 ? 12 : 8)));
            const pct = Math.min(100, Math.round((registered / (max || 1)) * 100));

            const rawStatus = (en.status || '').toLowerCase();
            const isEnPista = ['in_progress', 'live', 'en_curso', 'jugando'].includes(rawStatus);
            const isToday = (en.date || '') === todayStr;
            const isFull = registered >= max;

            let badgeText = '🟢 CONVOCATORIA ABIERTA';
            let badgeClass = 'badge-abierta';
            if (isEnPista) {
                badgeText = '🔴 EN PISTA';
                badgeClass = 'badge-en-pista';
            } else if (isToday) {
                badgeText = '🎾 ENTRENO HOY';
                badgeClass = 'badge-entreno';
            } else if (en.date && en.date > todayStr) {
                badgeText = '📅 PRÓXIMO ENTRENO';
                badgeClass = 'badge-proximo';
            }

            const barColor = isFull ? 'bar-green' : (isEnPista ? 'bar-amber' : 'bar-lime');

            cardsHtml += `
                <div class="motor-live-card live-card-entreno" onclick="window.loadAdminView('entrenos_mgmt')">
                    <div class="motor-live-card-bg" style="background-image: url('${poster}');">
                        <div class="motor-live-card-glass"></div>
                    </div>
                    <div class="motor-live-card-content">
                        <div class="motor-live-card-topbar">
                            <span class="motor-live-badge-live ${badgeClass}">
                                <span class="motor-badge-dot"></span> ${badgeText}
                            </span>
                            <span class="motor-live-type-pill">ACADEMIA</span>
                        </div>
                        <h4 class="motor-live-card-title">${title}</h4>
                        <div class="motor-live-card-meta">
                            <span><i class="fas fa-location-dot"></i> ${club}</span>
                            <span><i class="fas fa-table-tennis-paddle-ball"></i> <strong>${courts > 0 ? `${courts} Pistas` : (max >= 12 ? '3 Pistas' : '2 Pistas')}</strong></span>
                            <span><i class="fas fa-clock"></i> ${formatFriendlyDate(date, time)}</span>
                        </div>
                        <div class="motor-live-occupancy-wrap">
                            <div class="motor-live-occupancy-labels">
                                <span>Plazas: <strong>${registered}/${max} Alumnos</strong> ${courts > 0 ? `(${courts} Pistas)` : ''}</span>
                                <span class="motor-live-occupancy-pct">${pct}%</span>
                            </div>
                            <div class="motor-live-progress-bar-track">
                                <div class="motor-live-progress-bar-fill ${barColor}" style="width: ${pct}%"></div>
                            </div>
                        </div>
                        <div class="motor-live-card-actions" onclick="event.stopPropagation()">
                            <button type="button" class="motor-live-btn-action btn-action-entreno" onclick="window.loadAdminView('entrenos_mgmt')">
                                <i class="fas fa-graduation-cap"></i> Ver Entreno
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = cardsHtml;
    }

    // Función de escaneo y sincronización en vivo
    window.refreshMotorLiveEvents = function () {
        if (!window.db) return;

        const todayStr = new Date().toISOString().split('T')[0];

        // Recarga de americanas activas
        window.db.collection('americanas').get().then(snap => {
            let activeEvents = [];
            let countTotalActive = 0;
            snap.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                const st = (data.status || '').toLowerCase();
                const isTodayOrFuture = !data.date || data.date >= todayStr;
                const isClosed = ['finished', 'cancelled', 'completed', 'finalizada'].includes(st);

                if (!isClosed && (['active', 'open', 'in_progress', 'en_curso', 'live', 'draft'].includes(st) || isTodayOrFuture)) {
                    countTotalActive++;
                    activeEvents.push(data);
                }
            });

            activeEvents.sort((a, b) => {
                const aLive = ['in_progress', 'live', 'en_curso'].includes((a.status || '').toLowerCase());
                const bLive = ['in_progress', 'live', 'en_curso'].includes((b.status || '').toLowerCase());
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return (a.date || '').localeCompare(b.date || '');
            });

            liveAmericanasData = activeEvents.slice(0, 6);
            const el = document.getElementById('motor-stat-americanas');
            if (el) el.textContent = countTotalActive;
            renderLiveEventsCards();
        }).catch(err => console.warn("Error escaneando americanas:", err));

        // Recarga de entrenos
        window.db.collection('entrenos').get().then(snap => {
            let activeTrainings = [];
            let countActive = 0;
            snap.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                const st = (data.status || '').toLowerCase();
                const isClosed = ['finished', 'cancelled', 'completed', 'finalizada'].includes(st);
                const isTodayOrFuture = !data.date || data.date >= todayStr;
                if (!isClosed && (isTodayOrFuture || ['active', 'open', 'in_progress', 'live'].includes(st))) {
                    countActive++;
                    activeTrainings.push(data);
                }
            });

            activeTrainings.sort((a, b) => {
                const aLive = ['in_progress', 'live', 'en_curso'].includes((a.status || '').toLowerCase());
                const bLive = ['in_progress', 'live', 'en_curso'].includes((b.status || '').toLowerCase());
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return (a.date || '').localeCompare(b.date || '');
            });

            liveEntrenosData = activeTrainings.slice(0, 4);
            const el = document.getElementById('motor-stat-entrenos');
            if (el) el.textContent = countActive;
            renderLiveEventsCards();
        }).catch(err => console.warn("Error escaneando entrenos:", err));
    };

    // Subscripción a Listeners de Firestore en Tiempo Real
    try {
        if (!window.db) return;

        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Sincronización en vivo: JUGADORES TOTALES
        const unsubPlayers = window.db.collection('players').onSnapshot(snap => {
            const el = document.getElementById('motor-stat-players');
            if (el) el.textContent = snap.size || '0';
        }, err => {
            console.warn("Snapshot players fallback get:", err);
            window.db.collection('players').get().then(snap => {
                const el = document.getElementById('motor-stat-players');
                if (el) el.textContent = snap.size || '0';
            }).catch(() => {});
        });
        window._motorUnsubscribers.push(unsubPlayers);

        // 2. Sincronización en vivo: AMERICANAS ACTIVAS & EN PISTA
        const unsubAmericanas = window.db.collection('americanas').onSnapshot(snap => {
            let activeEvents = [];
            let countActive = 0;

            snap.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                const st = (data.status || '').toLowerCase();
                const isTodayOrFuture = !data.date || data.date >= todayStr;
                const isClosed = ['finished', 'cancelled', 'completed', 'finalizada'].includes(st);

                if (!isClosed && (['active', 'open', 'in_progress', 'en_curso', 'live', 'draft'].includes(st) || isTodayOrFuture)) {
                    countActive++;
                    activeEvents.push(data);
                }
            });

            // Ordenar: primero 'in_progress'/'live', luego fecha próxima
            activeEvents.sort((a, b) => {
                const aLive = ['in_progress', 'live', 'en_curso'].includes((a.status || '').toLowerCase());
                const bLive = ['in_progress', 'live', 'en_curso'].includes((b.status || '').toLowerCase());
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return (a.date || '').localeCompare(b.date || '');
            });

            liveAmericanasData = activeEvents.slice(0, 6);

            const statEl = document.getElementById('motor-stat-americanas');
            if (statEl) statEl.textContent = countActive;

            renderLiveEventsCards();
        }, err => {
            console.warn("Snapshot americanas fallback:", err);
            window.refreshMotorLiveEvents();
        });
        window._motorUnsubscribers.push(unsubAmericanas);

        // 3. Sincronización en vivo: ENTRENOS HOY & ACTIVOS
        const unsubEntrenos = window.db.collection('entrenos').onSnapshot(snap => {
            let activeTrainings = [];
            let countActive = 0;

            snap.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                const st = (data.status || '').toLowerCase();
                const isClosed = ['finished', 'cancelled', 'completed', 'finalizada'].includes(st);
                const isTodayOrFuture = !data.date || data.date >= todayStr;
                if (!isClosed && (isTodayOrFuture || ['active', 'open', 'in_progress', 'live'].includes(st))) {
                    countActive++;
                    activeTrainings.push(data);
                }
            });

            activeTrainings.sort((a, b) => {
                const aLive = ['in_progress', 'live', 'en_curso'].includes((a.status || '').toLowerCase());
                const bLive = ['in_progress', 'live', 'en_curso'].includes((b.status || '').toLowerCase());
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return (a.date || '').localeCompare(b.date || '');
            });

            liveEntrenosData = activeTrainings.slice(0, 4);

            const statEl = document.getElementById('motor-stat-entrenos');
            if (statEl) statEl.textContent = countActive;

            renderLiveEventsCards();
        }, err => {
            console.warn("Snapshot entrenos fallback:", err);
            window.refreshMotorLiveEvents();
        });
        window._motorUnsubscribers.push(unsubEntrenos);

        // 4. Sincronización en vivo: SUPLENTES SOS / SOLICITUDES ACTIVAS
        const unsubSos = window.db.collection('sos_requests')
            .where('status', '==', 'active')
            .onSnapshot(snap => {
                const el = document.getElementById('motor-stat-sos');
                if (el) el.textContent = snap.size || '0';
            }, () => {
                // Fallback a sos_substitutes o get directo
                if (window.db.collection('sos_substitutes')) {
                    window.db.collection('sos_substitutes').get().then(snap => {
                        const el = document.getElementById('motor-stat-sos');
                        if (el) el.textContent = snap.size || '0';
                    }).catch(() => {
                        const el = document.getElementById('motor-stat-sos');
                        if (el) el.textContent = '0';
                    });
                }
            });
        window._motorUnsubscribers.push(unsubSos);

    } catch (err) {
        console.error("Error al suscribir listeners reactivos en Motor Admin:", err);
        window.refreshMotorLiveEvents();
    }
};
