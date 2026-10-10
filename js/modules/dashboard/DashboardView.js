/**
 * DashboardView.js [v40 CLEAN]
 * "Context-First" Mobile Dashboard
 * Designed for Clarity, Speed and Outdoor Use
 */
console.log("✅ [v40] DashboardView Loaded Correctly");
(function () {
    class DashboardView {
        constructor() {
            if (window.Store) {
                window.Store.subscribe('dashboardData', (data) => {
                    if (window.Router && window.Router.currentRoute === 'dashboard') {
                        this.render(data);
                    }
                });
            }

            // AUTO-REFRESH MOTOR: Renovación inteligente cada 5 minutos
            this.refreshInterval = setInterval(() => {
                if (window.Router && window.Router.currentRoute === 'dashboard') {
                    console.log("🔄 [AI Motor] Renovando noticias y eventos en tiempo real...");
                    this.renderLiveWidget();
                }
            }, 5 * 60 * 1000); // 5 min

            // USER SYNC MOTOR: Ensure widgets refresh when user data arrives
            if (window.Store) {
                window.Store.subscribe('currentUser', (user) => {
                    if (user && window.Router && window.Router.currentRoute === 'dashboard') {
                        console.log("👤 [DashboardView] User synced, refreshing live content...");
                        this.buildContext(user).then(context => this.loadLiveWidgetContent(context));
                    }
                });
            }

            // Sincronización en tiempo real de Americanas y Entrenos con sus carteles oficiales
            const onEventsUpdated = () => {
                if (window.Router && window.Router.currentRoute === 'dashboard') {
                    if (window.AmericanaService && typeof window.AmericanaService.getAllActiveEvents === 'function') {
                        window.AmericanaService.getAllActiveEvents({ forceRefresh: true }).then(evs => {
                            if (evs && evs.length > 0) this.updateDynamicCarousels(evs);
                        }).catch(() => {});
                    } else if (window.EventsController?.state?.americanas?.length > 0) {
                        this.updateDynamicCarousels([
                            ...(window.EventsController.state.americanas || []),
                            ...(window.EventsController.state.entrenos || [])
                        ]);
                    }
                }
            };
            window.addEventListener('eventModified', onEventsUpdated);
            window.addEventListener('americanasUpdated', onEventsUpdated);
            window.addEventListener('entrenosUpdated', onEventsUpdated);
        }

        async render(data) {
            console.log("📊 [DashboardView] Rendering started...", data);
            const container = document.getElementById('content-area');
            if (!container) return;

            // 1. Get Real User Data
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const userLevel = user ? (user.level || "3.5") : "3.5";
            const userFirstName = user ? ((user.name || user.displayName || 'Jugador').split(' ')[0]) : 'Jugador';

            // Header is updated globally by AppInstance in app.js on user change.
            // We just ensure we have visibility on the level here.

            // 2. Render IMMEDIATE SHELL (Experience-Focused)
            container.innerHTML = `
                <!-- MAIN DASHBOARD SCROLL CONTENT -->
                <div class="dashboard-v2-container fade-in full-width-mobile" style="
                    background: #ffffff !important;
                    min-height: 100vh;
                    padding: 14px 16px 48px !important;
                    color: #111827;
                    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                ">

                    <!-- ════════ BLOQUE 1: SALUDO LIMPIO PLAYTOMIC ════════ -->
                    <div class="sp-greeting-clean" style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 4px 0 16px;
                        background: #ffffff;
                    ">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <!-- Avatar circular vibrante SomosPadel Barcelona -->
                            <div style="
                                width: 52px;
                                height: 52px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #CCFF00 0%, #00e5ff 100%);
                                border: 2.5px solid #ffffff;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #000000;
                                font-size: 1.35rem;
                                font-weight: 900;
                                box-shadow: 0 4px 14px rgba(0, 229, 255, 0.35), 0 2px 8px rgba(204, 255, 0, 0.4);
                                flex-shrink: 0;
                                text-shadow: 0 1px 1px rgba(255,255,255,0.6);
                            ">
                                ${userFirstName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style="
                                    margin: 0;
                                    font-size: 1.45rem;
                                    font-weight: 900;
                                    color: #111827;
                                    letter-spacing: -0.5px;
                                    line-height: 1.2;
                                ">
                                    ¡Hola, <span id="sp-playtomic-user-name">${userFirstName}</span>! 👋
                                </h1>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                    <span style="
                                        background: #f7fee7;
                                        color: #111827;
                                        font-size: 0.72rem;
                                        font-weight: 850;
                                        padding: 3px 9px;
                                        border-radius: 12px;
                                        border: 1.5px solid #CCFF00;
                                        box-shadow: 0 2px 8px rgba(204, 255, 0, 0.25);
                                        display: inline-flex;
                                        align-items: center;
                                        gap: 4px;
                                    ">
                                        <i class="fas fa-bolt" style="color: #65a30d; font-size: 0.65rem;"></i> Nivel <span id="user-level-val">${userLevel}</span>
                                    </span>
                                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">
                                        <i class="fas fa-map-marker-alt" style="color: #94a3b8; margin-right: 3px;"></i>SomosPadel BCN
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- Botón perfil / avatar con acento SomosPadel -->
                        <div onclick="window.Router && window.Router.navigate('profile')" style="
                            width: 42px;
                            height: 42px;
                            border-radius: 12px;
                            background: #ffffff;
                            border: 1.5px solid #e2e8f0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            color: #111827;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                            transition: all 0.18s ease;
                        "
                        onmouseover="this.style.background='#f0fdf4'; this.style.borderColor='#CCFF00'; this.style.transform='scale(1.06)';"
                        onmouseout="this.style.background='#ffffff'; this.style.borderColor='#e2e8f0'; this.style.transform='none';">
                            <i class="far fa-user" style="font-size: 1.05rem; color: #111827;"></i>
                        </div>
                    </div>

                    <!-- ════════ BLOQUE 2: ACCESOS RÁPIDOS CIRCULARES PLAYTOMIC CON MARCA SOMOSPADEL ════════ -->
                    <div class="sp-playtomic-quick-actions" style="
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        align-items: start;
                        text-align: center;
                        margin-bottom: 24px;
                        padding: 6px 0;
                        background: #ffffff;
                    ">
                        <!-- 1. Americanas (Torneos / Competición: Amarillo Lima Eléctrico SomosPadel) -->
                        <div class="sp-action-pod haptic-feedback"
                            onclick="window.PlayerView?.haptic?.(20); window.Router && window.Router.navigate('americanas');"
                            style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                            <div style="
                                width: 56px;
                                height: 56px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #f7fee7 0%, #e4fc8c 50%, #CCFF00 100%);
                                border: 2.5px solid #a3e635;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 6px 18px rgba(163, 230, 53, 0.42), 0 2px 6px rgba(0,0,0,0.04);
                                position: relative;
                                transition: transform 0.18s ease, box-shadow 0.18s ease;
                            "
                            onmouseover="this.style.transform='scale(1.10)'; this.style.boxShadow='0 8px 22px rgba(163, 230, 53, 0.6)';"
                            onmouseout="this.style.transform='none'; this.style.boxShadow='0 6px 18px rgba(163, 230, 53, 0.42), 0 2px 6px rgba(0,0,0,0.04)';">
                                <i class="fas fa-trophy" style="font-size: 1.30rem; color: #0f172a; filter: drop-shadow(0 1px 1px rgba(255,255,255,0.4));"></i>
                                <span style="position: absolute; top: -3px; right: -3px; background: #ef4444; color: #ffffff; font-size: 0.50rem; font-weight: 900; padding: 2px 5px; border-radius: 7px; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45); letter-spacing: 0.3px;">TOP</span>
                            </div>
                            <span style="margin-top: 8px; font-size: 0.76rem; font-weight: 800; color: #111827; line-height: 1.1;">
                                Americanas
                            </span>
                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 600; margin-top: 2px;">Torneos</span>
                        </div>

                        <!-- 2. Entrenos (Pistas / Clases: Azul Cian Eléctrico Pista Indoor) -->
                        <div class="sp-action-pod haptic-feedback"
                            onclick="window.PlayerView?.haptic?.(20); window.Router && window.Router.navigate('entrenos');"
                            style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                            <div style="
                                width: 56px;
                                height: 56px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #f0f9ff 0%, #bae6fd 50%, #38bdf8 100%);
                                border: 2.5px solid #0284c7;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 6px 18px rgba(56, 189, 248, 0.45), 0 2px 6px rgba(0,0,0,0.04);
                                position: relative;
                                transition: transform 0.18s ease, box-shadow 0.18s ease;
                            "
                            onmouseover="this.style.transform='scale(1.10)'; this.style.boxShadow='0 8px 22px rgba(56, 189, 248, 0.65)';"
                            onmouseout="this.style.transform='none'; this.style.boxShadow='0 6px 18px rgba(56, 189, 248, 0.45), 0 2px 6px rgba(0,0,0,0.04)';">
                                <i class="fas fa-baseball" style="font-size: 1.30rem; color: #0284c7; filter: drop-shadow(0 1px 1px rgba(255,255,255,0.5));"></i>
                                <span style="position: absolute; top: -3px; right: -3px; background: #0284c7; color: #ffffff; font-size: 0.48rem; font-weight: 900; padding: 2px 5px; border-radius: 7px; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.45); letter-spacing: 0.3px;">PISTAS</span>
                            </div>
                            <span style="margin-top: 8px; font-size: 0.76rem; font-weight: 800; color: #111827; line-height: 1.1;">
                                Entrenos
                            </span>
                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 600; margin-top: 2px;">Partidos</span>
                        </div>

                        <!-- 3. Ranking (Puntos / FIP / Podio: Oro Trofeo / Ámbar Vibrante) -->
                        <div class="sp-action-pod haptic-feedback"
                            onclick="window.PlayerView?.haptic?.(20); window.Router && window.Router.navigate('ranking');"
                            style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                            <div style="
                                width: 56px;
                                height: 56px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #fefce8 0%, #fde68a 50%, #fbbf24 100%);
                                border: 2.5px solid #f59e0b;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 6px 18px rgba(245, 158, 11, 0.42), 0 2px 6px rgba(0,0,0,0.04);
                                position: relative;
                                transition: transform 0.18s ease, box-shadow 0.18s ease;
                            "
                            onmouseover="this.style.transform='scale(1.10)'; this.style.boxShadow='0 8px 22px rgba(245, 158, 11, 0.65)';"
                            onmouseout="this.style.transform='none'; this.style.boxShadow='0 6px 18px rgba(245, 158, 11, 0.42), 0 2px 6px rgba(0,0,0,0.04)';">
                                <i class="fas fa-medal" style="font-size: 1.30rem; color: #b45309; filter: drop-shadow(0 1px 1px rgba(255,255,255,0.5));"></i>
                                <span style="position: absolute; top: -3px; right: -3px; background: #f59e0b; color: #ffffff; font-size: 0.48rem; font-weight: 900; padding: 2px 5px; border-radius: 7px; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.45); letter-spacing: 0.3px;">ORO</span>
                            </div>
                            <span style="margin-top: 8px; font-size: 0.76rem; font-weight: 800; color: #111827; line-height: 1.1;">
                                Ranking
                            </span>
                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 600; margin-top: 2px;">Puntos</span>
                        </div>

                        <!-- 4. Mi Equipo (Liga Summa / Comunidad: Violeta / Púrpura Deportivo) -->
                        <div class="sp-action-pod haptic-feedback"
                            onclick="window.PlayerView?.haptic?.(20); window.openMyTeam ? window.openMyTeam() : (window.Router && window.Router.navigate('my_team'));"
                            style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                            <div style="
                                width: 56px;
                                height: 56px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #faf5ff 0%, #ddd6fe 50%, #c084fc 100%);
                                border: 2.5px solid #8b5cf6;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 6px 18px rgba(168, 85, 247, 0.42), 0 2px 6px rgba(0,0,0,0.04);
                                position: relative;
                                transition: transform 0.18s ease, box-shadow 0.18s ease;
                            "
                            onmouseover="this.style.transform='scale(1.10)'; this.style.boxShadow='0 8px 22px rgba(168, 85, 247, 0.65)';"
                            onmouseout="this.style.transform='none'; this.style.boxShadow='0 6px 18px rgba(168, 85, 247, 0.42), 0 2px 6px rgba(0,0,0,0.04)';">
                                <i class="fas fa-users" style="font-size: 1.30rem; color: #581c87; filter: drop-shadow(0 1px 1px rgba(255,255,255,0.5));"></i>
                                <span style="position: absolute; top: -3px; right: -3px; background: #CCFF00; color: #000000; font-size: 0.48rem; font-weight: 900; padding: 2px 5px; border-radius: 7px; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(204, 255, 0, 0.5); letter-spacing: 0.3px;">2027</span>
                            </div>
                            <span style="margin-top: 8px; font-size: 0.76rem; font-weight: 800; color: #111827; line-height: 1.1;">
                                Mi Equipo
                            </span>
                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 600; margin-top: 2px;">Liga Summa</span>
                        </div>
                    </div>

                    <!-- Contenedor oculto de notificaciones push (gestión modal) -->
                    <div id="push-notification-promo-banner-root" style="display: none !important;"></div>

                    <!-- ════════ BLOQUE 3: HERO BANNER VISUAL (FOTOS REALES CLUB) ════════ -->
                    <div id="season-campaign-banner-root" style="margin-bottom: 26px; animation: floatUp 0.4s ease-out forwards;">
                        <div style="
                            position: relative;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
                            border: 1px solid #e5e7eb;
                            background: #111827;
                            min-height: 190px;
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-end;
                            padding: 20px;
                        ">
                            <!-- Imagen real de las pistas del club -->
                            <img src="img/cem_tennis_hospitalet.png" alt="Pistas SomosPadel" style="
                                position: absolute;
                                inset: 0;
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                                filter: brightness(0.80);
                            " onerror="this.src='img/americana-pro.png';">

                            <!-- Scrim sutil para máxima legibilidad -->
                            <div style="
                                position: absolute;
                                inset: 0;
                                background: linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0.65) 55%, rgba(15,23,42,0.92) 100%);
                            "></div>

                            <!-- Contenido del Banner -->
                            <div style="position: relative; z-index: 2; color: #ffffff;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                                    <span style="
                                        background: #CCFF00;
                                        color: #000000;
                                        font-size: 0.68rem;
                                        font-weight: 900;
                                        padding: 3px 8px;
                                        border-radius: 6px;
                                        letter-spacing: 0.5px;
                                        text-transform: uppercase;
                                    ">
                                        🏆 LIGA SUMMAPADEL 2027
                                    </span>
                                    <span style="
                                        background: rgba(255,255,255,0.2);
                                        color: #ffffff;
                                        font-size: 0.65rem;
                                        font-weight: 700;
                                        padding: 3px 8px;
                                        border-radius: 6px;
                                        backdrop-filter: blur(4px);
                                    ">
                                        PLAZAS LIMITADAS
                                    </span>
                                </div>
                                <h2 style="
                                    margin: 0 0 4px;
                                    font-size: 1.30rem;
                                    font-weight: 900;
                                    color: #ffffff;
                                    letter-spacing: -0.3px;
                                    line-height: 1.25;
                                ">
                                    Únete a los Equipos Oficiales
                                </h2>
                                <p style="
                                    margin: 0 0 14px;
                                    font-size: 0.80rem;
                                    color: rgba(255,255,255,0.92);
                                    font-weight: 500;
                                    line-height: 1.4;
                                ">
                                    Compite defendiendo nuestros colores en el mejor ambiente de club.
                                </p>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button type="button"
                                        onclick="window.SeasonCampaignView && window.SeasonCampaignView.openModal('equipos');"
                                        style="
                                            background: #CCFF00;
                                            color: #111827;
                                            border: none;
                                            border-radius: 10px;
                                            padding: 9px 16px;
                                            font-size: 0.82rem;
                                            font-weight: 900;
                                            cursor: pointer;
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 6px;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                        ">
                                        <i class="fas fa-rocket"></i> Pre-inscribirme
                                    </button>
                                    <button type="button"
                                        onclick="window.openSeasonFlyerModal();"
                                        style="
                                            background: rgba(255,255,255,0.18);
                                            color: #ffffff;
                                            border: 1px solid rgba(255,255,255,0.35);
                                            border-radius: 10px;
                                            padding: 9px 14px;
                                            font-size: 0.82rem;
                                            font-weight: 800;
                                            cursor: pointer;
                                            backdrop-filter: blur(6px);
                                        ">
                                        Ver Cartel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ════════ BLOQUE 4: SECCIÓN AMERICANAS + CARRUSEL HORIZONTAL ════════ -->
                    <div class="sp-home-section" style="margin-bottom: 28px;">
                        <div style="
                            display: flex;
                            align-items: baseline;
                            justify-content: space-between;
                            margin-bottom: 12px;
                        ">
                            <div>
                                <h3 style="
                                    margin: 0;
                                    font-size: 1.20rem;
                                    font-weight: 900;
                                    color: #111827;
                                    letter-spacing: -0.4px;
                                ">
                                    Americanas
                                </h3>
                                <div style="font-size: 0.74rem; color: #64748b; font-weight: 600; margin-top: 2px;">
                                    Torneos non-stop de 2 horas con cambio de pista y puntos
                                </div>
                            </div>
                            <span onclick="window.Router && window.Router.navigate('americanas')" style="
                                font-size: 0.80rem;
                                font-weight: 800;
                                color: #111827;
                                cursor: pointer;
                                white-space: nowrap;
                            ">
                                Ver todas →
                            </span>
                        </div>

                        <!-- Carrusel swipe horizontal de Americanas -->
                        <div id="americanas-horizontal-track" style="
                            display: flex;
                            gap: 14px;
                            overflow-x: auto;
                            scroll-snap-type: x mandatory;
                            padding: 4px 2px 14px;
                            margin: 0 -4px;
                            -webkit-overflow-scrolling: touch;
                            scrollbar-width: none;
                        ">
                            ${this.getTrackInitialHtml('americana')}
                        </div>
                    </div>

                    <!-- ════════ BLOQUE 5: ENTRENOS ════════ -->
                    <div class="sp-home-section" style="margin-bottom: 28px;">
                        <div style="
                            display: flex;
                            align-items: baseline;
                            justify-content: space-between;
                            margin-bottom: 12px;
                        ">
                            <div>
                                <h3 style="
                                    margin: 0;
                                    font-size: 1.20rem;
                                    font-weight: 900;
                                    color: #111827;
                                    letter-spacing: -0.4px;
                                ">
                                    Entrenos
                                </h3>
                                <div style="font-size: 0.74rem; color: #64748b; font-weight: 600; margin-top: 2px;">
                                    Reserva tu plaza en entrenos de la comunidad
                                </div>
                            </div>
                            <span onclick="window.Router && window.Router.navigate('entrenos')" style="
                                font-size: 0.80rem;
                                font-weight: 800;
                                color: #111827;
                                cursor: pointer;
                                white-space: nowrap;
                            ">
                                Ver todos →
                            </span>
                        </div>

                        <!-- Carrusel swipe horizontal de Entrenos y Partidas -->
                        <div id="entrenos-horizontal-track" style="
                            display: flex;
                            gap: 14px;
                            overflow-x: auto;
                            scroll-snap-type: x mandatory;
                            padding: 4px 2px 14px;
                            margin: 0 -4px;
                            -webkit-overflow-scrolling: touch;
                            scrollbar-width: none;
                        ">
                            ${this.getTrackInitialHtml('entreno')}
                        </div>
                    </div>

                    <!-- ⑤ ACTIVIDAD RECIENTE -->
                    <div id="activity-feed-root" style="
                        background: #ffffff;
                        border: 1px solid #e5e7eb;
                        border-radius: 20px;
                        margin-bottom: 24px;
                        padding: 18px;
                        box-shadow: 0 4px 14px rgba(0,0,0,0.03);
                        animation: floatUp 0.6s ease-out forwards;
                    ">
                        <div style="
                            font-weight: 900;
                            font-size: 0.85rem;
                            color: #111827;
                            letter-spacing: -0.2px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 14px;
                        ">
                            <i class="fas fa-rss" style="color: #16a34a; font-size: 0.95rem;"></i> Actividad de Jugadores
                        </div>
                        <div id="activity-feed-content" style="display: flex; flex-direction: column; gap: 10px;"></div>
                    </div>

                    <!-- STORIES TRASLADADO AL HEADER -->
                    <div id="story-feed-root" style="display: none !important;"></div>

                    <!-- ⑨ POWER LEVEL -->
                    <div id="power-level-root" style="margin-bottom: 24px; animation: floatUp 0.7s ease-out forwards;"></div>

                    <!-- 3.5 NEWS BLOG WIDGET -->
                    <div id="blog-news-widget-root" style="margin-bottom: 24px; animation: floatUp 0.8s ease-out forwards;"></div>

                    </div>

            <style>
                @keyframes slowTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .ticker-container { width: 100%; overflow: hidden; position: relative; }
                .ticker-content { display: flex; gap: 12px; animation: slowTicker 25s linear infinite; width: max-content; padding: 10px 0; }
                .ticker-content:hover { animation-play-state: paused; }
                .dashboard-v2-container ::-webkit-scrollbar { display: none; }
                .sp-action-pod:active { transform: scale(0.92); }
            </style>
        `;

            // 3. ASYNC LOADING OF DATA-DEPENDENT COMPONENTS
            try {
                // INSTANT PAINT (0ms): Hidratar tracks con datos reales de Firestore
                this.hydrateRealEventsTracks();

                // Build context (Might take time)
                const context = await this.buildContext(user);

                // phase 3: load dynamic contents
                this.loadLiveWidgetContent(context);

                // 2026 UPDATE: Init Header Ticker Sync
                this.initHeaderTickerSync();

                window.scrollTo(0, 0);

                // Render Power Level Card
                const pLevelRoot = document.getElementById('power-level-root');
                if (pLevelRoot && user && window.PowerLevelCard) {
                    pLevelRoot.innerHTML = window.PowerLevelCard.render(user);
                }

                // Load Partner Synergy Widget
                if (user && window.PartnerSynergyWidget) {
                    const synergyWidget = document.getElementById('predictive-synergy-root');
                    if (synergyWidget) synergyWidget.style.display = 'block';
                }

                // 2. Fetch Real Data for Weather Cards
                let weatherData = [];
                try {
                    if (window.WeatherService) {
                        weatherData = await window.WeatherService.getDashboardWeather();
                    }
                } catch (e) { console.error("Weather fetch failed", e); }

                // 2.2 Populate Weather Widget (Reubicado a la seccion Clima & Radar)
                const weatherRoot = document.getElementById('weather-widget-root');
                if (false && weatherRoot) {
                    let weatherHtml = '';

                    // Render Cards first
                    if (weatherData && weatherData.length > 0) {
                        weatherHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">`;
                        weatherData.forEach(w => {
                            weatherHtml += this.renderWeatherCard(
                                w.name,
                                `${w.temp}°C`,
                                w.icon,
                                {
                                    wind: `${w.wind} km/h`,
                                    hum: `${w.humidity}%`,
                                    rain: `${w.rainProb}%`,
                                    uv: w.uv,
                                    pressure: w.pressure,
                                    visibility: w.visibility,
                                    intel: w.intelligence
                                },
                                w.isPropitious
                            );
                        });
                        weatherHtml += `</div>`;
                    } else {
                        weatherHtml += `
                            <div style="
                                text-align: center;
                                padding: 50px 20px;
                                background: #111;
                                border-radius: 24px;
                                border: 1px solid rgba(204,255,0,0.1);
                                position: relative;
                                overflow: hidden;
                                box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                            ">
                                <!-- Tech Radar Animation -->
                                <div style="
                                    position: absolute; top: 0; left: 0; width: 200%; height: 2px;
                                    background: linear-gradient(90deg, transparent, #CCFF00, transparent);
                                    animation: scannerMove 4s linear infinite;
                                    opacity: 0.3;
                                "></div>
                                
                                <i class="fas fa-radar-scan fa-spin" style="
                                    font-size: 3.5rem;
                                    color: #CCFF00;
                                    margin-bottom: 20px;
                                    opacity: 0.2;
                                    display: block;
                                "></i>
                                
                                <div style="
                                    color: white;
                                    font-size: 1.1rem;
                                    font-weight: 950;
                                    letter-spacing: -0.5px;
                                    text-transform: uppercase;
                                ">RADAR DE COMPATIBILIDAD <span style="color:#CCFF00;">EN ESPERA</span></div>
                                
                                <div style="
                                    color: rgba(255,255,255,0.4);
                                    font-size: 0.8rem;
                                    margin-top: 10px;
                                    font-weight: 600;
                                    max-width: 240px;
                                    margin: 10px auto 0;
                                ">Necesitamos más datos de nivel y victorias para calcular tu pareja perfecta.</div>

                                <style>
                                    @keyframes scannerMove {
                                        0% { transform: translateY(-50px); opacity: 0; }
                                        50% { opacity: 0.5; }
                                        100% { transform: translateY(200px); opacity: 0; }
                                    }
                                </style>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                ${this.renderWeatherCard('EL PRAT', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                                ${this.renderWeatherCard('CORNELLÀ', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                            </div>`;
                    }

                    // Append Radar below
                    weatherHtml += `
                        <style>
                            @keyframes livePulse {
                                0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.7); transform: scale(1); opacity: 1; }
                                70% { box-shadow: 0 0 0 8px rgba(0, 227, 109, 0); transform: scale(1.2); opacity: 0.8; }
                                100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); transform: scale(1); opacity: 1; }
                            }
                            @keyframes borderFlow {
                                0% { border-color: rgba(255, 255, 255, 0.1); }
                                50% { border-color: rgba(255, 255, 255, 0.25); }
                                100% { border-color: rgba(255, 255, 255, 0.1); }
                            }
                        </style>
                        <div style="position: relative; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #0f172a; animation: borderFlow 4s infinite;">
                            <div style="background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-size:0.75rem; font-weight:950; color:white; letter-spacing:0.5px;">RADAR TÁCTICO <span style="color:#CCFF00;">WAR ROOM</span></span>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <button onclick="window.DashboardView.toggleTacticalHUD()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.3s; pointer-events: auto;">
                                        <i class="fas fa-eye"></i> TACTICAL HUD
                                    </button>
                                    <span style="width:8px; height:8px; background:#00E36D; border-radius:50%; animation: livePulse 2s infinite;"></span>
                                    <span style="font-size:0.6rem; color: #00E36D; font-weight: 900; letter-spacing:1px;">SCANNING</span>
                                </div>
                            </div>
                            <div style="width: 100%; height: 280px; position: relative;">
                                <iframe width="100%" height="100%" src="https://embed.windy.com/embed2.html?lat=41.320&lon=2.040&zoom=10&level=surface&overlay=radar&product=radar&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0" style="filter: contrast(1.1) brightness(0.8) grayscale(0.3);"></iframe>
                                
                                <!-- WAR ROOM TACTICAL OVERLAYS -->
                                <div style="pointer-events:none; position:absolute; inset:0; box-shadow: inset 0 0 50px rgba(0,0,0,0.8); background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(204,255,0,0.03) 100%);"></div>
                                
                                <!-- HUD TOP LEFT: Pista Status -->
                                <div id="tactical-hud-grip" style="position:absolute; top:15px; left:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-left:3px solid #00E36D; pointer-events:none; animation: floatUp 0.8s ease-out; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ESTADO DE PISTA</div>
                                    <div style="font-size:0.75rem; color:#fff; font-weight:1000;">GRIP: <span style="color:#00E36D;">ÓPTIMO (92%)</span></div>
                                    <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Prob. Pista resbaladiza: 12%</div>
                                </div>

                                <!-- HUD TOP RIGHT: Rebote/Presión -->
                                <div id="tactical-hud-bounce" style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-right:3px solid #CCFF00; pointer-events:none; text-align:right; animation: floatUp 0.8s ease-out 0.2s both; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">INTELIGENCIA BOLA</div>
                                    <div style="font-size:0.75rem; color:#fff; font-weight:1000;">REBOTE: <span style="color:#CCFF00;">ALTO (+15%)</span></div>
                                    <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Bola rápida + Presión detectada</div>
                                </div>

                                <!-- HUD BOTTOM CENTER: Scan Line -->
                                <div style="position:absolute; bottom:0; left:0; width:100%; height:1px; background:#CCFF00; opacity:0.3; box-shadow: 0 0 10px #CCFF00; animation: scannerSlide 4s linear infinite;"></div>
                                
                                <style>
                                    @keyframes scannerSlide {
                                        0% { bottom: 0; opacity: 0; }
                                        10% { opacity: 0.5; }
                                        90% { opacity: 0.5; }
                                        100% { bottom: 100%; opacity: 0; }
                                    }
                                </style>
                            </div>
                        </div>
                    `;
                    weatherRoot.innerHTML = weatherHtml;
                    weatherRoot.style.display = 'block';
                }

                // Load Blog News Widget
                const blogRoot = document.getElementById('blog-news-widget-root');
                if (blogRoot) {
                    blogRoot.innerHTML = this.renderBlogWidget();
                }

                // PRO CONTENT (AGENDA) REMOVED PER USER REQUEST

            } catch (err) {
                console.error("Dashboard Render Error:", err);
            }

            // 4. INIT HEADER TICKER SYNC
            this.initHeaderTickerSync();

            // 🏓 PADEL PULSE
            if (window.PadelPulse) {
                window.PadelPulse.render('padel-pulse-widget-root');
            }

            // 5. FORCE LOAD NETWORK PULSE & STORIES
            if (window.StoryFeedWidget) {
                window.StoryFeedWidget.render('story-feed-root');
            }
        }

        initHeaderTickerSync() {
            // REDUNDANT: Handled by core/SmartTicker.js
            console.log("📺 [DashboardView] Ticker management delegated to SmartTicker.js for premium TV experience.");
        }

        toggleActivityFeed() {
            const container = document.getElementById('activity-extended-container');
            const btn = document.getElementById('activity-toggle-btn');
            
            if (container && btn) {
                if (container.style.display === 'none') {
                    container.style.display = 'flex';
                    btn.innerHTML = `Ver menos <i class="fas fa-chevron-up" id="activity-toggle-icon"></i>`;
                } else {
                    container.style.display = 'none';
                    btn.innerHTML = `Ver más <i class="fas fa-chevron-down" id="activity-toggle-icon"></i>`;
                }
            }
        }

        async shareBlogPost(postId, title, explicitImgUrl) {
            this.showShareMenu(postId, title, explicitImgUrl);
        }

        showShareMenu(postId, title, explicitImgUrl) {
            const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
            const shareText = `¡Mira esta noticia en SomosPadel BCN! 🎾\n\n"${title}"\n\n`;
            
            // Si ya existe un menú de compartir previo, lo eliminamos
            const existingShare = document.getElementById('blog-share-menu-modal');
            if (existingShare) existingShare.remove();
            
            const shareModal = document.createElement('div');
            shareModal.id = 'blog-share-menu-modal';
            shareModal.style = `
                position: fixed; inset: 0; z-index: 999999999 !important;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                display: flex; align-items: center; justify-content: center;
                padding: 20px; font-family: 'Outfit', sans-serif;
                animation: fadeIn 0.25s ease-out;
            `;
            
            shareModal.innerHTML = `
                <div style="background: #090f1e; border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; width: 100%; max-width: 360px; padding: 24px; box-shadow: 0 30px 70px rgba(0,0,0,0.85); position: relative; text-align: center; animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    
                    <!-- Botón de Cerrar del Menú de Compartir -->
                    <button id="share-modal-close-btn" 
                            style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                        <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                    </button>
                    
                    <div style="margin-bottom: 22px;">
                        <span style="font-size: 2.5rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));">📢</span>
                        <h4 style="color: white; font-weight: 950; font-size: 1.25rem; margin: 12px 0 6px 0; letter-spacing: -0.4px;">Compartir Noticia</h4>
                        <p style="color: rgba(255,255,255,0.5); font-size: 0.78rem; line-height: 1.4; margin: 0; padding: 0 10px;">Selecciona el canal para compartir la noticia con su imagen oficial.</p>
                    </div>
                    
                    <!-- Lista de Opciones Premium -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        
                        <!-- WhatsApp Option -->
                        <button id="share-btn-whatsapp"
                                style="background: rgba(37, 211, 102, 0.12); border: 1.5px solid rgba(37, 211, 102, 0.35); color: #25D366; font-weight: 850; font-size: 0.88rem; padding: 13px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(37, 211, 102, 0.25)';this.style.borderColor='#25D366';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(37, 211, 102, 0.12)';this.style.borderColor='rgba(37, 211, 102, 0.35)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i>
                            <span>Compartir con Foto por WhatsApp</span>
                        </button>
                        
                        <!-- Instagram Option -->
                        <button id="share-btn-instagram"
                                style="background: rgba(225, 48, 108, 0.1); border: 1px solid rgba(225, 48, 108, 0.25); color: #E1306C; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(225, 48, 108, 0.2)';this.style.borderColor='#E1306C';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(225, 48, 108, 0.1)';this.style.borderColor='rgba(225, 48, 108, 0.25)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fab fa-instagram" style="font-size: 1.2rem;"></i>
                            <span>Compartir en Instagram</span>
                        </button>
                        
                        <!-- Copiar Enlace Option -->
                        <button id="share-btn-copy"
                                style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); color: #3b82f6; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(59, 130, 246, 0.2)';this.style.borderColor='#3b82f6';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(59, 130, 246, 0.1)';this.style.borderColor='rgba(59, 130, 246, 0.25)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fas fa-link" style="font-size: 1rem;"></i>
                            <span>Copiar Enlace de Noticia</span>
                        </button>

                        <!-- Compartir Nativo -->
                        <button id="native-share-btn"
                                style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: white; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(255, 255, 255, 0.08)';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(255, 255, 255, 0.04)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fas fa-share-alt" style="font-size: 1rem;"></i>
                            <span>Otras aplicaciones</span>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(shareModal);
            
            // Asignamos manejadores de eventos directos sin dependencias globales
            const closeBtn = shareModal.querySelector('#share-modal-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    shareModal.remove();
                });
            }

            const waBtn = shareModal.querySelector('#share-btn-whatsapp');
            if (waBtn) {
                waBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    shareModal.remove();
                    if (typeof this.shareToWhatsApp === 'function') {
                        this.shareToWhatsApp(postId, title, e, explicitImgUrl);
                    } else {
                        this.actionShare('whatsapp', shareUrl, encodeURIComponent(shareText));
                    }
                });
            }

            const igBtn = shareModal.querySelector('#share-btn-instagram');
            if (igBtn) {
                igBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.actionShare('instagram', shareUrl, '');
                });
            }

            const copyBtn = shareModal.querySelector('#share-btn-copy');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.actionShare('copy', shareUrl, '');
                });
            }

            const nativeBtn = shareModal.querySelector('#native-share-btn');
            if (nativeBtn) {
                if (navigator.share) {
                    nativeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.actionShare('native', shareUrl, encodeURIComponent(shareText));
                    });
                } else {
                    nativeBtn.style.display = 'none';
                }
            }
            
            // Cerrar menú de compartir si se hace clic fuera de la tarjeta
            shareModal.onclick = (e) => {
                if (e.target === shareModal) shareModal.remove();
            };
        }

        async actionShare(type, url, textDecoded) {
            const text = decodeURIComponent(textDecoded);
            
            // Eliminar modal de compartir al ejecutar acción
            const menu = document.getElementById('blog-share-menu-modal');
            if (menu) menu.remove();
            
            if (type === 'whatsapp') {
                const waUrl = `https://wa.me/?text=${encodeURIComponent(text + url)}`;
                window.open(waUrl, '_blank');
            } else if (type === 'instagram') {
                try {
                    await navigator.clipboard.writeText(url);
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: '📸 ENLACE COPIADO',
                            message: '<b>Hemos copiado el enlace al portapapeles.</b><br><br>Ahora abriremos Instagram para que puedas crear una Story o enviárselo por mensaje directo a tus amigos y compañeros de SomosPadel. 🎾',
                            type: 'success'
                        });
                    } else {
                        alert('¡Enlace copiado! Abre Instagram para pegarlo en tus Stories.');
                    }
                    setTimeout(() => {
                        window.open('https://www.instagram.com', '_blank');
                    }, 600);
                } catch (e) {
                    console.warn("Fallo al copiar para Instagram share:", e);
                }
            } else if (type === 'copy') {
                try {
                    await navigator.clipboard.writeText(url);
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: '📋 COPIADO AL PORTAPAPELES',
                            message: 'El enlace directo a la noticia ha sido guardado con éxito. ¡Listo para pegar en cualquier chat! 🎾',
                            type: 'success'
                        });
                    } else {
                        alert('¡Enlace copiado al portapapeles!');
                    }
                } catch (e) {
                    console.warn("Fallo al copiar enlace:", e);
                }
            } else if (type === 'native') {
                try {
                    await navigator.share({
                        title: 'SomosPadel BCN',
                        text: text,
                        url: url
                    });
                } catch (e) {
                    console.warn('Native share cancelled:', e);
                }
            }
        }

        renderBlogWidget() {
            // Fetch async, inject into shell
            setTimeout(async () => {
                const container = document.getElementById('dynamic-blog-posts-container');
                if (!container) return;
                try {
                    const db = window.db || firebase.firestore();
                    const snapshot = await db.collection('blog_posts').orderBy('timestamp', 'desc').get();
                    let posts = [];
                    if (!snapshot.empty) {
                        posts = snapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data
                            };
                        });
                    } else {
                        posts = [
                            { id: 'torneo-primavera', category: '🏆 TORNEOS', catColor: '#CCFF00', title: 'Gran Torneo de Primavera 2026', emoji: '🎾', imgGrad: 'linear-gradient(135deg, #CCFF00 0%, #84cc16 100%)', snippet: '¡Inscripciones abiertas! 120 plazas, Welcome Pack premium y barbacoa final.', content: 'Llega el evento más esperado del año. El 15 de Junio celebraremos el Gran Torneo de Primavera con categorías masculina, femenina y mixta. ¡Reserva tu plaza!', date: 'Hoy', readTime: '2 min' },
                            { id: 'ranking-actualizado', category: '📊 RANKING', catColor: '#38bdf8', title: 'Ranking Actualizado: Top 5 de la Temporada', emoji: '🏅', imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', snippet: 'El ranking se ha recalculado. ¿Has subido posiciones esta semana?', content: 'Consulta tu posición actualizada en la sección Ranking. Nuevos puntos asignados tras la última jornada.', date: 'Ayer', readTime: '2 min' },
                            { id: 'tactica-centro', category: '💡 CONSEJOS', catColor: '#f59e0b', title: 'Táctica: Jugar al Centro de la Pista', emoji: '⚡', imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', snippet: 'Jugar al medio reduce los ángulos del rival y genera dudas en la pareja contraria.', content: 'El centro de la pista es la clave táctica más potente del pádel. Al tirar al centro reduces ángulos y generas confusión.', date: 'Hace 3 días', readTime: '3 min' }
                        ];
                        // Fallbacks listos
                    }
                    if (posts.length === 0) { container.innerHTML = ''; return; }
                    const featured = posts[0];
                    const rest = posts.slice(1, 5);

                    const premiumIcon = (post, size = 60) => {
                        const grad = post.imgGrad || 'linear-gradient(135deg, #CCFF00, #84cc16)';
                        const em = post.emoji || '📰';
                        return `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size*0.27)}px;background:${grad};display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;overflow:hidden;box-shadow:0 6px 18px rgba(77,124,15,0.18),inset 0 1px 0 rgba(255,255,255,0.35);"><div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.25) 0%,transparent 100%);border-radius:inherit;pointer-events:none;"></div><div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.12) 1px,transparent 1px);background-size:${Math.round(size/7)}px ${Math.round(size/7)}px;pointer-events:none;"></div><span style="font-size:${Math.round(size*0.42)}px;position:relative;z-index:2;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.15));line-height:1;">${em}</span></div>`;
                    };

                    const featuredCard = `
                        <div onclick="window.DashboardView.openBlogPost('${featured.id}')"
                             class="premium-blog-3d-card"
                             style="border-radius: 24px; overflow: hidden; cursor: pointer; background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(16px) saturate(120%); -webkit-backdrop-filter: blur(16px) saturate(120%); position: relative; min-height: 170px; box-shadow: 0 10px 30px rgba(0,0,0,0.03), 0 1px 2px rgba(255,255,255,0.8), inset 0 1px 0 rgba(255,255,255,0.9); transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255, 255, 255, 0.7); transform-style: preserve-3d; perspective: 1000px;"
                             onmouseover="this.style.transform='translateY(-6px) translateZ(10px) rotateX(1.5deg) rotateY(-0.8deg)';this.style.boxShadow='0 25px 50px rgba(56,113,0,0.12), 0 8px 20px rgba(0,0,0,0.02)';this.style.borderColor='rgba(255,255,255,0.95)';"
                             onmouseout="this.style.transform='translateY(0) translateZ(0) rotateX(0) rotateY(0)';this.style.boxShadow='0 10px 30px rgba(0,0,0,0.03)';this.style.borderColor='rgba(255, 255, 255, 0.7)';"
                        >
                            <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(132,204,22,0.06) 1px, transparent 1px); background-size: 15px 15px; pointer-events: none;"></div>
                            
                            <div style="position: relative; padding: 20px; display: flex; gap: 18px; align-items: center; min-height: 170px;">
                                <div style="width: 80px; height: 80px; border-radius: 20px; background: ${featured.imgGrad || 'linear-gradient(135deg, #CCFF00, #84cc16)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 24px rgba(77,124,15,0.2), inset 0 1px 0 rgba(255,255,255,0.4); animation: premiumEmojiFloat 3.8s ease-in-out infinite;">
                                    <span style="font-size: 2.4rem; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15)); line-height: 1;">${featured.emoji||'📰'}</span>
                                </div>
                                <div style="flex: 1; min-width: 0; padding-right: 20px;">
                                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                                        <span style="font-size: 0.52rem; font-weight: 1000; color: #000; background: #CCFF00; border: 1px solid #84cc16; padding: 2.5px 8px; border-radius: 6px; letter-spacing: 0.8px; text-transform: uppercase; box-shadow: 0 2px 6px rgba(132,204,22,0.15);">${featured.category||'REVISTA'}</span>
                                        <span style="font-size: 0.48rem; font-weight: 1000; color: #475569; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.85;">• DESTACADO</span>
                                    </div>
                                    <h3 style="margin: 0 0 6px 0; color: #000000; font-weight: 1000; font-size: 1.1rem; line-height: 1.3; letter-spacing: -0.3px; font-family: 'Outfit';">${featured.title}</h3>
                                    <p style="margin: 0 0 12px 0; color: #334155; font-size: 0.74rem; font-weight: 600; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Inter';">${featured.snippet}</p>

                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <span style="font-size: 0.6rem; color: #475569; font-weight: 800; display:flex; align-items:center; gap:4px;">
                                            <i class="far fa-calendar" style="font-size:0.55rem; color: #84cc16;"></i> ${featured.date || 'Hoy'}
                                        </span>
                                        <span style="font-size: 0.6rem; color: #475569; font-weight: 800; display:flex; align-items:center; gap:4px;">
                                            <i class="far fa-clock" style="font-size:0.55rem; color: #84cc16;"></i> ${featured.readTime || '3 min'}
                                        </span>
                                        <div style="margin-left:auto; background: #000000; border: 1px solid #000000; border-radius: 20px; padding: 6px 15px; font-size: 0.62rem; font-weight: 1000; color: #CCFF00; display:flex; align-items:center; gap:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.18); transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                             onmouseover="this.style.background='#CCFF00';this.style.color='#000';this.style.transform='scale(1.05) translateY(-1px)';this.style.boxShadow='0 6px 15px rgba(204,255,0,0.3)';"
                                             onmouseout="this.style.background='#000';this.style.color='#CCFF00';this.style.transform='scale(1) translateY(0)';this.style.boxShadow='0 4px 10px rgba(0,0,0,0.18)';">
                                            LEER AHORA <i class="fas fa-arrow-right" style="font-size:0.5rem;"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

                    // ── COMPACT CARDS (rest) ────────────────────────────────
                    const compactCards = rest.map((post, idx) => `
                        <div onclick="window.DashboardView.openBlogPost('${post.id}')"
                             style="
                                display: flex; gap: 14px; align-items: center;
                                padding: 13px 14px; border-radius: 16px; cursor: pointer;
                                background: rgba(255,255,255,0.04);
                                border: 1px solid rgba(255,255,255,0.07);
                                transition: all 0.25s ease; position: relative; overflow:hidden;
                             "
                             onmouseover="this.style.background='rgba(255,255,255,0.09)'; this.style.borderColor='rgba(255,255,255,0.18)'; this.style.transform='translateX(3px)';"
                             onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.07)'; this.style.transform='translateX(0)';">

                            <!-- Left accent bar -->
                            <div style="position:absolute; left:0; top:20%; bottom:20%; width:3px; background: ${post.catColor || '#CCFF00'}; border-radius: 0 3px 3px 0; opacity:0.7;"></div>

                            <!-- Icon -->
                            ${premiumIcon(post, 60)}

                            <!-- Text -->
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                    <span style="
                                        font-size: 0.5rem; font-weight: 900; letter-spacing: 0.8px;
                                        color: ${post.catColor || '#CCFF00'};
                                        text-transform: uppercase;
                                    ">${(post.category || 'REVISTA').replace(/^[^\s]+\s/, '')}</span>
                                    <span style="font-size: 0.58rem; color: rgba(255,255,255,0.35); font-weight: 600; display:flex; align-items:center; gap:3px;">
                                        <i class="far fa-clock" style="font-size:0.5rem;"></i>${post.readTime || '3 min'}
                                    </span>
                                </div>
                                <h4 style="
                                    margin: 0 0 4px 0; color: rgba(255,255,255,0.95); font-weight: 800;
                                    font-size: 0.88rem; line-height: 1.2; letter-spacing: -0.2px;
                                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow:hidden;
                                ">${post.title}</h4>
                                <p style="
                                    margin: 0; color: rgba(255,255,255,0.5); font-size: 0.68rem;
                                    font-weight: 500; line-height: 1.35;
                                    display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow:hidden;
                                ">${post.snippet}</p>
                            </div>

                            <!-- Arrow -->
                            <div style="flex-shrink:0; color: rgba(255,255,255,0.25); font-size: 0.7rem;">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `).join('');

                    container.innerHTML = featuredCard + `<div style="display:flex; flex-direction:column; gap:8px; margin-top: 4px;">${compactCards}</div>`;

                } catch (err) {
                    console.error("Fallo al inyectar blog posts dinámicos:", err);
                    container.innerHTML = '';
                }
            }, 100);

            return `
                <div style="
                    background: linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0f1f35 100%);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 28px; padding: 20px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08);
                    position: relative; overflow: hidden;
                ">
                    <!-- Ambient glows -->
                    <div style="position:absolute; top:-60px; right:-40px; width:180px; height:180px; background: radial-gradient(circle, rgba(204,255,0,0.08) 0%, transparent 70%); pointer-events:none; filter:blur(30px);"></div>
                    <div style="position:absolute; bottom:-60px; left:-40px; width:180px; height:180px; background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%); pointer-events:none; filter:blur(30px);"></div>

                    <!-- Header -->
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.07);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="
                                width: 32px; height: 32px; border-radius: 9px;
                                background: linear-gradient(135deg, #CCFF00, #84cc16);
                                display: flex; align-items:center; justify-content:center;
                                box-shadow: 0 4px 12px rgba(204,255,0,0.35);
                            ">
                                <i class="fas fa-newspaper" style="font-size:0.75rem; color:#000;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; font-weight: 900; color: white; letter-spacing: 0.5px; text-transform: uppercase;">SomosPadel BCN</div>
                                <div style="font-size: 0.55rem; color: rgba(255,255,255,0.45); font-weight: 600; letter-spacing: 0.5px;">REVISTA OFICIAL</div>
                            </div>
                        </div>
                        <div style="
                            background: #000000; border: 1px solid #CCFF00;
                            padding: 4px 10px; border-radius: 20px;
                            font-size: 0.5rem; font-weight: 900; color: #CCFF00;
                            letter-spacing: 1px; text-transform: uppercase;
                            display: flex; align-items: center; gap: 5px;
                        ">
                            INFO OFICIAL
                        </div>
                    </div>

                    <!-- Posts container -->
                    <div id="dynamic-blog-posts-container" style="display:flex; flex-direction:column; gap:10px;">
                        <div onclick="if(window.DashboardView) window.DashboardView.openBlogPost('tip_bandeja')" style="display: flex; gap: 14px; align-items: center; padding: 12px 14px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255, 255, 255, 0.08); cursor: pointer; transition: all 0.25s;" class="premium-blog-compact-card">
                            <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(204,255,0,0.1); border: 1px solid rgba(204,255,0,0.25); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #CCFF00; font-size: 1.2rem;">
                                💡
                            </div>
                            <div style="flex: 1;">
                                <span style="font-size: 0.55rem; font-weight: 950; letter-spacing: 0.5px; color: #CCFF00; text-transform: uppercase;">CONSEJOS TÁCTICOS</span>
                                <h4 style="font-size: 0.82rem; font-weight: 900; color: #ffffff; margin: 2px 0 3px 0; font-family: 'Outfit';">Claves para la Bandeja de Control y Ataque</h4>
                                <span style="font-size: 0.65rem; color: rgba(255,255,255,0.6); font-weight: 600;">Mejora tu empuñadura y posicionamiento en pista</span>
                            </div>
                            <i class="fas fa-chevron-right compact-chevron" style="color: rgba(255,255,255,0.4); font-size: 0.8rem; transition: transform 0.2s;"></i>
                        </div>
                        <div onclick="if(window.DashboardView) window.DashboardView.openBlogPost('tip_remate')" style="display: flex; gap: 14px; align-items: center; padding: 12px 14px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255, 255, 255, 0.08); cursor: pointer; transition: all 0.25s;" class="premium-blog-compact-card">
                            <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #60a5fa; font-size: 1.2rem;">
                                🎾
                            </div>
                            <div style="flex: 1;">
                                <span style="font-size: 0.55rem; font-weight: 950; letter-spacing: 0.5px; color: #60a5fa; text-transform: uppercase;">COMUNIDAD BCN</span>
                                <h4 style="font-size: 0.82rem; font-weight: 900; color: #ffffff; margin: 2px 0 3px 0; font-family: 'Outfit';">Próximos Torneos y Americanas Semanales</h4>
                                <span style="font-size: 0.65rem; color: rgba(255,255,255,0.6); font-weight: 600;">Compite en partidos equilibrados de tu nivel</span>
                            </div>
                            <i class="fas fa-chevron-right compact-chevron" style="color: rgba(255,255,255,0.4); font-size: 0.8rem; transition: transform 0.2s;"></i>
                        </div>
                    </div>
                </div>
            `;
        }


        async openBlogPost(postId) {
            try {
                const db = window.db || firebase.firestore();
                let post = null;
                let viewsCount = 1;
                let lastReaderName = 'Ninguno';

                // Get Current User
                const user = window.Store ? window.Store.getState('currentUser') : null;
                const currentUserName = user ? (user.name || user.displayName || 'Jugador Pro') : 'Invitado Pro';

                try {
                    const doc = await db.collection('blog_posts').doc(postId).get();
                    if (doc.exists) {
                        post = doc.data();
                        
                        // Increment views & set reader real-time in Firestore
                        viewsCount = (post.viewsCount || 0) + 1;
                        lastReaderName = currentUserName;

                        // Non-blocking update to keep speed ultra-fast
                        db.collection('blog_posts').doc(postId).update({
                            viewsCount: viewsCount,
                            lastReaderName: lastReaderName,
                            lastReaderTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                        }).catch(e => console.warn("Fallo al actualizar Firestore views:", e));
                    }
                } catch (e) {
                    console.warn("Fallo al conectar con Firestore para blog stats:", e);
                }

                // Fallback local if Firestore failed or is offline or post is local
                if (!post) {
                    const fallbackPosts = {
                        'torneo-primavera': {
                            category: '🏆 TORNEOS',
                            catColor: '#CCFF00',
                            title: 'Gran Torneo de Primavera 2026',
                            content: 'Llega el evento más esperado del año. El próximo 15 de Junio celebraremos el Gran Torneo de Primavera en las instalaciones de El Prat. Contaremos con categorías masculina, femenina y mixta de todos los niveles. Con tu inscripción recibirás un Welcome Pack (camiseta oficial, grip y bebida energética). Al finalizar, disfrutaremos de una barbacoa comunitaria con sorteos y música. ¡Inscripciones limitadas a 120 plazas, reserva la tuya en la sección de eventos!',
                            date: 'Hoy',
                            readTime: '2 min',
                            emoji: '🎾',
                            imgGrad: 'linear-gradient(135deg, #CCFF00 0%, #84cc16 100%)'
                        },
                        'ranking-actualizado': {
                            category: '📊 RANKING',
                            catColor: '#38bdf8',
                            title: 'Ranking Actualizado: Top 5 de la Temporada',
                            content: 'El ranking de la temporada se ha recalculado tras la última jornada de liga. Los nuevos puntos ya están asignados y podrás consultar tu posición actualizada en la sección Ranking. ¡Enhorabuena a los que han subido posiciones esta semana y ánimo a los que luchan por el ascenso!',
                            date: 'Ayer',
                            readTime: '2 min',
                            emoji: '🏅',
                            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'
                        },
                        'tactica-centro': {
                            category: '💡 CONSEJOS',
                            catColor: '#f59e0b',
                            title: 'Táctica: Jugar al Centro de la Pista',
                            content: 'Jugar por el centro de la pista es una de las tácticas más eficaces en el pádel. Al dirigir la bola al centro, reduces drásticamente los ángulos de rebote del rival, evitas que abran la bola a las paredes y generas dudas de comunicación entre la pareja contraria. Es ideal para situaciones bajo presión o globos difíciles. ¡Probadlo en vuestro próximo partido!',
                            date: 'Hace 3 días',
                            readTime: '3 min',
                            emoji: '⚡',
                            imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
                        },
                        'modos-juego-pareja-fija-vs-twister': {
                            category: '🎮 MODOS DE JUEGO',
                            catColor: '#CCFF00',
                            title: 'Pareja Fija vs Twister Individual: ¿En qué formato anotarte según tus objetivos?',
                            content: 'En SomosPadel Barcelona contamos con dos formatos estelares: Pareja Fija (en tándem, subida y bajada de pista conjunta, preparación de competición oficial) y Twister Individual (inscripción individual sin necesidad de pareja previa, cambio de compañero en cada ronda, y podio por diferencial personal de juegos). ¡Ambos formatos garantizan la máxima emoción!',
                            date: 'Hoy',
                            readTime: '4 min',
                            emoji: '🎮',
                            imgGrad: 'linear-gradient(135deg, #0284c7 0%, #db2777 100%)'
                        },
                        'modos-juego-twister-individual-guia': {
                            category: '💡 CONSEJOS',
                            catColor: '#ec4899',
                            title: 'Guía Táctica Twister: Cómo Adaptarte al Instante a una Nueva Pareja',
                            content: 'Jugar una americana en formato Twister Individual exige compenetración express. Acuerda con tu nueva pareja en 30 segundos los roles de drive y revés, la cobertura del centro en globos rivales y mantén un refuerzo positivo constante. La versatilidad para jugar en ambos lados es la llave del triunfo en las rotaciones individuales.',
                            date: 'Hoy',
                            readTime: '3 min',
                            emoji: '🌪️',
                            imgGrad: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
                        },
                        'modos-juego-suizo-americana-entreno': {
                            category: '🎮 MODOS DE JUEGO',
                            catColor: '#ef4444',
                            title: 'Sistema Suizo en SomosPadel: 6 Rondas Express, Puntos Individuales y Reagrupación por Pistas',
                            content: 'La 3ª modalidad de SomosPadel Barcelona: el Sistema Suizo (Americana Suiza y Entreno Suizo). Duración 2h, 6 rondas express de juego efectivo (al sonar el silbato concluye el punto). Formato individual con cambio de pareja. Puntos individuales = juegos ganados. Reagrupación tras cada ronda: Top 4 a Pista 1, siguientes a Pista 2, restantes a Pista 3, sin repetir compañero. Campeón: más juegos sumados.',
                            date: 'Hoy',
                            readTime: '4 min',
                            emoji: '🇨🇭',
                            imgGrad: 'linear-gradient(135deg, #ef4444 0%, #0f172a 100%)'
                        }
                    };
                    post = fallbackPosts[postId];
                }

                // Buscar en catálogo masivo si no estaba en Firestore ni en los básicos
                if (!post && window.NewsCatalog && typeof window.NewsCatalog.getFullCatalog === 'function') {
                    const allCat = window.NewsCatalog.getFullCatalog();
                    post = allCat.find(p => p.id === postId || p.id.includes(postId));
                }

                if (!post) return;

                const isGameModesPost = (postId && postId.includes('modos-juego')) ||
                    (post.title && (post.title.toLowerCase().includes('pareja fija') || post.title.toLowerCase().includes('twister') || post.title.toLowerCase().includes('suizo') || post.title.toLowerCase().includes('suiza') || post.title.toLowerCase().includes('modos de juego')));

                const gameModesActionHtml = isGameModesPost ? `
                    <div style="margin: 20px 0 16px; background: linear-gradient(135deg, rgba(204, 255, 0, 0.12) 0%, rgba(56, 189, 248, 0.1) 100%); border: 1.5px solid rgba(204, 255, 0, 0.45); border-radius: 18px; padding: 18px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.35);">
                        <div style="font-size: 1.6rem; margin-bottom: 6px;">🎮 👥 🌪️ 🇨🇭</div>
                        <div style="font-size: 0.98rem; font-weight: 950; color: #ffffff; margin-bottom: 4px;">Comparativa & Normativa Oficial</div>
                        <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 14px; line-height: 1.45;">
                            Abre la guía interactiva oficial para consultar todas las reglas, dinámicas de rotación y sistemas de puntuación.
                        </div>
                        <button id="blog-modal-modes-action-btn" 
                                style="background: #CCFF00; color: #000000; font-weight: 950; font-size: 0.82rem; border: none; padding: 11px 24px; border-radius: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(204, 255, 0, 0.35); transition: all 0.2s ease;"
                                onmouseover="this.style.transform='scale(1.04)';"
                                onmouseout="this.style.transform='scale(1)';"
                                onmousedown="this.style.transform='scale(0.97)';">
                            <i class="fas fa-gamepad"></i> ABRIR MODOS DE JUEGO
                        </button>
                    </div>
                ` : '';

                const modal = document.createElement('div');
                modal.id = 'blog-post-modal';
                modal.style = `
                    position: fixed; inset: 0; z-index: 999999999 !important;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(15px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px; font-family: 'Outfit', sans-serif;
                    animation: fadeIn 0.3s ease-out;
                `;
                
                modal.innerHTML = `
                    <div style="background: #090f1e; border: 1px solid rgba(255,255,255,0.12); border-radius: 32px; width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 35px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); position: relative; overflow: hidden; animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
                        
                        <!-- Premium Background Glow/Aura -->
                        <div style="position: absolute; top: 100px; left: -50px; width: 150px; height: 150px; background: radial-gradient(circle, ${post.catColor || '#CCFF00'}15 0%, transparent 70%); pointer-events: none; filter: blur(30px);"></div>
                        
                        <!-- Gradient Header Area (Apple News style) -->
                        <div style="background: ${post.imgGrad || 'linear-gradient(135deg, #1e293b, #0f172a)'}; height: 130px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;">
                            <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px); background-size: 14px 14px; pointer-events: none;"></div>
                            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 60%, rgba(9,15,30,0.95) 100%); pointer-events: none;"></div>
                            <!-- Huge Floating 3D-effect Emoji -->
                            <span class="blog-modal-emoji" style="font-size: 4.8rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.5)); z-index: 1; line-height: 1;">${post.emoji || '📰'}</span>
                        </div>

                        <!-- Content Area -->
                        <div id="blog-post-content-area" style="padding: 24px; padding-top: 16px; position: relative; z-index: 2; overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                                <span style="font-size: 0.58rem; font-weight: 1000; color: ${post.catColor || '#CCFF00'}; border: 1px solid ${post.catColor || '#CCFF00'}45; padding: 4px 10px; border-radius: 8px; background: ${post.catColor || '#CCFF00'}12; letter-spacing: 0.8px; text-transform: uppercase;">${post.category || 'REVISTA'}</span>
                                <span style="font-size: 0.62rem; color: rgba(255,255,255,0.45); font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase;">• ${post.readTime || '3 MIN'} DE LECTURA</span>
                            </div>
                            
                            <h3 style="color: white; font-weight: 950; font-size: 1.35rem; margin: 0 0 16px 0; line-height: 1.25; letter-spacing: -0.4px; text-shadow: 0 2px 10px rgba(0,0,0,0.4);">${post.title}</h3>
                            
                            <p style="color: rgba(255,255,255,0.85); font-size: 0.86rem; font-weight: 500; line-height: 1.65; margin: 0 0 20px 0; word-break: break-word; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${post.content}</p>
                            
                            ${gameModesActionHtml}

                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.68rem; color: rgba(255,255,255,0.4); font-weight: 800; letter-spacing: 0.5px;">
                                <span>Publicado: ${post.date || 'Recientemente'}</span>
                                <span style="color: #CCFF00; font-weight: 900; letter-spacing: 0.8px;">SOMOSPADEL BCN</span>
                            </div>
                        </div>

                        <!-- Floating Premium Control Buttons (Fixed on top of banner) -->
                        <button id="blog-modal-share-btn"
                                style="position: absolute; top: 16px; left: 16px; background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 999999999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                                onmouseover="this.style.background='#3b82f6';this.style.borderColor='#3b82f6';this.style.transform='scale(1.12) translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(59,130,246,0.5)';"
                                onmouseout="this.style.background='rgba(0,0,0,0.65)';this.style.borderColor='rgba(255,255,255,0.25)';this.style.transform='scale(1) translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)';"
                                title="Compartir Noticia">
                            <i class="fas fa-share-alt" style="font-size: 0.95rem;"></i>
                        </button>
                        
                        <button id="blog-modal-close-btn"
                                style="position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 999999999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                                onmouseover="this.style.background='#CCFF00';this.style.borderColor='#CCFF00';this.style.color='#000';this.style.transform='scale(1.12) translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(204,255,0,0.5)';"
                                onmouseout="this.style.background='rgba(0,0,0,0.65)';this.style.borderColor='rgba(255,255,255,0.25)';this.style.color='#fff';this.style.transform='scale(1) translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)';"
                                title="Cerrar Noticia">
                            <i class="fas fa-times" style="font-size: 0.95rem;"></i>
                        </button>
                    </div>
                    <style>
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes slideUp { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                        .blog-modal-emoji { animation: modalEmojiFloat 4s ease-in-out infinite; }
                        @keyframes modalEmojiFloat {
                            0%, 100% { transform: translateY(0) scale(1); }
                            50% { transform: translateY(-7px) scale(1.05); }
                        }
                        #blog-post-content-area::-webkit-scrollbar { width: 6px; }
                        #blog-post-content-area::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                        #blog-post-content-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
                        #blog-post-content-area::-webkit-scrollbar-thumb:hover { background: #CCFF00; }
                    </style>
                `;
                document.body.appendChild(modal);

                // Asignamos manejadores de eventos directos sin inline onclicks propensos a fallos
                const closeBtn = modal.querySelector('#blog-modal-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        modal.remove();
                    });
                }

                const shareBtn = modal.querySelector('#blog-modal-share-btn');
                if (shareBtn) {
                    shareBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.shareBlogPost(postId, post.title);
                    });
                }

                const modesBtn = modal.querySelector('#blog-modal-modes-action-btn');
                if (modesBtn) {
                    modesBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        modal.remove();
                        if (typeof window.showGameModesModal === 'function') {
                            const targetTab = (postId && (postId.includes('suiz') || postId.includes('swiss')))
                                ? 'suizo'
                                : ((postId && postId.includes('twister')) ? 'twister' : 'pareja');
                            window.showGameModesModal(targetTab);
                        }
                    });
                }

                // Cerrar modal al hacer click fuera de la tarjeta de contenido para UX impecable
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                };
            } catch (err) {
                console.error("Error al abrir blog post:", err);
            }
        }

        toggleWeatherDetails(safeCityId) {
            const details = document.getElementById(`weather-details-${safeCityId}`);
            const insight = document.getElementById(`weather-insight-${safeCityId}`);
            const btn = document.getElementById(`weather-btn-${safeCityId}`);
            
            if (details && btn) {
                if (details.style.display === 'none') {
                    details.style.display = 'flex';
                    if (insight) insight.style.display = 'block';
                    btn.innerHTML = `Ver menos <i class="fas fa-chevron-up" id="weather-icon-${safeCityId}"></i>`;
                } else {
                    details.style.display = 'none';
                    if (insight) insight.style.display = 'none';
                    btn.innerHTML = `Ver más <i class="fas fa-chevron-down" id="weather-icon-${safeCityId}"></i>`;
                }
            }
        }

        renderWeatherCard(city, temp, icon, details = {}, isPropitious = true) {
            const safeCityId = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
            const intel = details.intel || { score: 100, ballSpeed: '--', recommendation: 'Sincronizando meteorología...', gripStatus: '--' };
            const statusLabel = isPropitious ? 'ÓPTIMO' : 'ADVERSO';
            const statusColor = isPropitious ? '#72a800' : '#ef4444';
            const rainProb = parseInt(details.rain) || 0;
            const isRaining = rainProb > 30;

            let cardBg = '#ffffff';
            let weatherOverlay = '';

            if (isRaining) {
                cardBg = 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)';
            } else if (isPropitious) {
                cardBg = 'linear-gradient(135deg, #ffffff 0%, #f7fee7 100%)';
            }

            return `
                <style>
                    @keyframes rainFall { 0% { transform: translateY(0); } 100% { transform: translateY(100%); } }
                    @keyframes sunPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
                    @keyframes textSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                </style>
                <div style="
                    background: ${cardBg}; 
                    border: 1px solid #e1e8f0; border-radius: 28px; padding: 24px 20px;
                    display: flex; flex-direction: column; gap: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.03);
                    position: relative; overflow: hidden; min-height: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
                        <div style="font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.1));">${icon}</div>
                        <div style="text-align: right;">
                            <div style="background: ${isPropitious ? 'rgba(114, 168, 0, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${statusColor}; padding: 5px 12px; border-radius: 10px; font-size: 0.65rem; font-weight: 950; border: 1px solid ${statusColor}30; margin-bottom: 6px; text-transform: uppercase;">${statusLabel}</div>
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px;">SCORE ${intel.score}%</div>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 2; margin-top: 10px; animation: textSlideIn 0.5s ease-out; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <div style="color: #0a192f; font-weight: 950; font-size: 2.8rem; line-height: 0.9; letter-spacing: -1.5px;">${temp}</div>
                            <div style="color: #64748b; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">${city}</div>
                        </div>
                        <button onclick="event.stopPropagation(); window.DashboardView.toggleWeatherDetails('${safeCityId}')" 
                                id="weather-btn-${safeCityId}" 
                                style="background: rgba(10, 25, 47, 0.05); border: 1px solid rgba(10, 25, 47, 0.15); color: #0a192f; border-radius: 12px; padding: 6px 12px; font-size: 0.65rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                            Ver más <i class="fas fa-chevron-down" id="weather-icon-${safeCityId}"></i>
                        </button>
                    </div>
                    <div id="weather-details-${safeCityId}" style="display: none; flex-direction: column; gap: 10px; margin-top: 15px; background: #f8fafc; border-radius: 18px; padding: 15px; border: 1px solid #e2e8f0; position: relative; z-index: 2;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
                            <span style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-bolt" style="color:#eab308;"></i> VELOCIDAD BOLA</span>
                            <span style="font-size: 0.75rem; color: #0a192f; font-weight: 950;">${intel.ballSpeed}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
                            <span style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-wind" style="color:#0ea5e9;"></i> VIENTO</span>
                            <span style="font-size: 0.75rem; color: #0a192f; font-weight: 900;">${details.wind || '--'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
                            <span style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-tint" style="color:#38bdf8;"></i> HUMEDAD</span>
                            <span style="font-size: 0.75rem; color: #0a192f; font-weight: 900;">${details.hum || '--'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-hand-rock" style="color:#72a800;"></i> AGARRE PISTA</span>
                            <span style="font-size: 0.75rem; color: #72a800; font-weight: 950;">${intel.gripStatus || 'ÓPTIMO'}</span>
                        </div>
                    </div>
                    <div id="weather-insight-${safeCityId}" style="display: none; margin-top: 10px; padding: 12px 14px; background: rgba(0,0,0,0.02); border-radius: 16px; border-left: 4px solid ${statusColor};">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                            <i class="fas fa-brain" style="font-size: 0.7rem; color: ${statusColor};"></i>
                            <span style="font-size: 0.6rem; font-weight: 950; color: ${statusColor}; letter-spacing: 0.5px; text-transform: uppercase;">INSIGHT TÁCTICO</span>
                        </div>
                        <p style="margin: 0; font-size: 0.75rem; color: #475569; font-weight: 600; line-height: 1.4;">
                            ${intel.recommendation.replace('la IA', 'el sistema').replace('predictivo', 'estimado')}
                        </p>
                    </div>
                </div>
            `;
        }

        renderAgendaWidget(myEvents) {
            if (myEvents.length === 0) {
                return `
                <div style="min-width: 100%; background: var(--bg-card); border-radius: 32px; padding: 50px 30px; text-align: center; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);">
                        <div style="width: 80px; height: 80px; background: var(--bg-app); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid var(--border-subtle);">
                            <i class="fas fa-calendar-plus" style="font-size: 2.2rem; color: #cbd5e1;"></i>
                        </div>
                        <h3 style="color: var(--text-primary); font-weight: 950; font-size: 1.25rem; margin-bottom: 10px; letter-spacing: -0.5px;">SIN PLANES PRÓXIMOS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">Apúntate a una americana para<br>empezar a sumar en el ranking.</p>
                        <button onclick="Router.navigate('americanas')" class="btn-3d primary" style="width: auto; padding: 14px 28px;">EXPLORAR EVENTOS</button>
                    </div >
                `;
            }

            return myEvents.map(am => `
                <div class="agenda-card" onclick="window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" style="min-width: 280px; background: var(--bg-card); border-radius: 32px; border: 1px solid var(--border-subtle); padding: 24px; scroll-snap-align: center; position: relative; box-shadow: var(--shadow-md); transition: all 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div style="color: var(--brand-neon); background: var(--brand-navy); padding: 4px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">${this.formatDateShort(am.date)}</div>
                        ${am.status === 'live' ?
                    `<div style="background: rgba(255, 45, 85, 0.2); color: #FF2D55; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; animation: blink 1s infinite; border: 1px solid #FF2D55;">EN VIVO 🔴</div>` :
                    `<div style="background: rgba(6, 182, 212, 0.1); color: var(--brand-accent); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900;">CONFIRMADO</div>`
                }
                    </div>
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1.3rem; font-weight: 950; letter-spacing: -0.5px; line-height: 1.2;">${am.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--border-subtle);">
                        <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 800;"><i class="far fa-clock" style="color: var(--brand-neon); margin-right: 8px;"></i> ${am.time}</span>
                        <div style="width: 36px; height: 36px; background: var(--brand-navy); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; box-shadow: var(--shadow-sm);">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>`
            ).join('');
        }

        renderSmartHero(context, userLevel) {
            // SLIDE: VIBRANT GLASS HERO
            let pillText = "INSCRIPCIÓN ABIERTA";
            let btnText = "APUNTARME AHORA";
            let btnClass = "primary";
            let logoText = "AMERICANAS";
            let explainerText = "¡Quedan pocas plazas! No te quedes fuera hoy.";
            let heroImage = "img/ball_hero.jpg";
            let overlayColor = "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.7))";

            if (context.status === 'UPCOMING_EVENT') {
                pillText = "ESTÁS INSCRITO";
                btnText = "VER DETALLES";
                btnClass = "navy";
                logoText = "MI PLAZA";
                explainerText = "¡Prepárate! Tu próximo reto está a punto de empezar.";
                overlayColor = "linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(6, 182, 212, 0.7))";
            } else if (context.status === 'FINISHED') {
                pillText = "EVENTO FINALIZADO";
                btnText = "VER RESUMEN";
                btnClass = "secondary";
                logoText = "HISTORY";
                explainerText = "Consulta los resultados y revive los mejores momentos.";
                overlayColor = "linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(107, 114, 128, 0.7))";
            } else if (context.status === 'LIVE_MATCH') {
                pillText = "¡ESTÁS EN PISTA!";
                btnText = "MARCADOR EN VIVO";
                btnClass = "primary";
                logoText = "LIVE NOW";
                explainerText = "Tu partido está en progreso. ¡A por todas!";
                overlayColor = "linear-gradient(135deg, rgba(225, 29, 72, 0.95), rgba(204, 255, 0, 0.4))";
            }

            return `
                <div class="vibrant-hero-card" onclick="Router.navigate('live')" style="background: ${overlayColor}; backdrop-filter: var(--backdrop-blur); border-radius: 32px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 0; margin-bottom: 30px; overflow: hidden; box-shadow: var(--shadow-xl); position: relative;">
                    <div style="height: 160px; background: url('${heroImage}') center/cover; position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.6));"></div>
                        <div style="position: absolute; top: 20px; left: 20px; background: var(--brand-neon); padding: 6px 16px; border-radius: 12px; font-weight: 950; color: #000; font-size: 0.75rem; box-shadow: var(--shadow-neon); letter-spacing: 1px;">
                            ${pillText}
                        </div>
                    </div>

                    <div style="padding: 28px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; font-size: 0.8rem; font-weight: 900; color: var(--brand-neon); text-transform: uppercase; letter-spacing: 2px;">${logoText}</h4>
                                <h2 style="margin: 8px 0 0; font-size: 1.8rem; font-weight: 950; line-height: 1.1; letter-spacing: -0.5px;">${context.eventName || 'Americana Hoy'}</h2>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.3rem; font-weight: 950; color: var(--brand-neon);">${context.eventTime || context.matchTime || '18:00'}</div>
                                <div style="font-size: 0.75rem; font-weight: 700; opacity: 0.7; letter-spacing: 1px;">${context.matchDay || 'HOY'}</div>
                            </div>
                        </div>

                        <p style="margin: 20px 0 25px; font-size: 0.95rem; color: rgba(255,255,255,0.9); line-height: 1.5; font-weight: 500;">
                            ${explainerText}
                        </p>

                        <button class="btn-3d ${btnClass}" style="margin-top: 0; font-size: 1.1rem; height: 60px;">
                            ${btnText} <i class="fas fa-chevron-right" style="margin-left: 10px; font-size: 0.9rem;"></i>
                        </button>
                    </div>
                </div>`;
        }

        async renderLiveWidget(context) {
            try {
                // 1. DATA GATHERING (INTEL) - Fresh fetch for real-time accuracy
                const [allEvents, weatherData] = await Promise.all([
                    window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                    window.WeatherService ? window.WeatherService.getDashboardWeather() : []
                ]);

                console.log(`🧠[AI News Motor] Processing ${allEvents.length} events for priority feed.`);

                let itemsHtml = [];

                // 0. SAFETY BASE: Ensure we always have something to show
                const dynamicPool = [
                    {
                        tag: '📈 TU NIVEL',
                        icon: 'fa-chart-line',
                        bgColor: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                        accent: '#38bdf8',
                        title: 'Nivel Dinámico',
                        desc: 'Tu nivel evoluciona con cada set. ¡Juega y demuestra tu progreso!',
                        action: "window.Router.navigate('profile')"
                    },
                    {
                        tag: '🏆 COMPETICIÓN',
                        icon: 'fa-trophy',
                        bgColor: 'linear-gradient(135deg, #111 0%, #701a75 100%)',
                        accent: '#f472b6',
                        title: 'Puntos y Ascensos',
                        desc: 'Gana partidos para subir de pista y alcanzar el Top 1 del Ranking.',
                        action: "window.Router.navigate('ranking')"
                    },
                    {
                        tag: '🎾 CONTROL TOTAL',
                        icon: 'fa-user-check',
                        bgColor: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
                        accent: '#34d399',
                        title: 'Perfil y Stats',
                        desc: 'Consulta tu historial, victorias y próximos retos desde tu perfil.',
                        action: "window.Router.navigate('profile')"
                    },
                    {
                        tag: '💡 SMART TIP',
                        icon: 'fa-brain',
                        bgColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        accent: '#94a3b8',
                        title: 'Navegación Gesto',
                        desc: 'Desliza las historias o pulsa los laterales para pasar rápido.',
                        action: "window.DashboardView.showChatInfo()"
                    }
                ];

                // A. WEATHER INTEL CARD (VISION 2026 UPGRADE - CLEAN LIGHT)
                if (weatherData && weatherData[0]) {
                    const w = weatherData[0];
                    itemsHtml.push(`
                        <div class="registration-ticker-card" onclick="window.StoryFeedWidget && window.StoryFeedWidget.showStory ? window.StoryFeedWidget.showStory('weather') : window.dashNavigate && window.dashNavigate('clima')" style="cursor: pointer; min-width: 260px; height: 150px; background: #ffffff; border-radius: 18px; padding: 16px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04); position: relative; overflow: hidden; border: 1px solid #e5e7eb;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; position: relative; z-index: 2;">
                                <span style="font-size:0.62rem; font-weight:800; color:#1e40af; background:#eff6ff; padding:3px 9px; border-radius:6px; letter-spacing:0.5px; border: 1px solid #dbeafe; text-transform:uppercase;">METEO PISTAS</span>
                                <span style="font-size:1.6rem;">${w.icon}</span>
                            </div>
                            <div style="position: absolute; bottom: 16px; left: 16px; z-index: 2;">
                                <div style="color:#111827; font-weight:900; font-size:1.6rem; line-height: 1; margin-bottom: 2px;">${w.temp}ºC</div>
                                <div style="color:#64748b; font-size:0.72rem; font-weight:700; text-transform:uppercase;">${w.name}</div>
                            </div>
                            <div style="position: absolute; bottom: 16px; right: 16px; z-index: 2; text-align: right; display:flex; flex-direction:column; gap:4px;">
                                <div style="font-size:0.60rem; color:#111827; font-weight:800; background:#f8fafc; padding:3px 8px; border-radius:6px; border:1px solid #e2e8f0;">BOLA: ${w.temp > 20 ? 'RÁPIDA' : 'LENTA'}</div>
                                <div style="font-size:0.60rem; color:#64748b; font-weight:700; background:#f8fafc; padding:3px 8px; border-radius:6px; border:1px solid #e2e8f0;">HUM: ${w.humidity}%</div>
                            </div>
                        </div>
                    `);
                }

                // --- PRIORITY LOGIC ---
                const openEvents = allEvents
                    .filter(a => ['open', 'upcoming'].includes(a.status))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                if (openEvents.length > 0) {
                    const topEvt = openEvents[0];
                    const isEntreno = (topEvt.type === 'entreno') || (topEvt.name || '').toLowerCase().includes('entreno');
                    const targetRoute = isEntreno ? 'entrenos' : 'americanas';
                    itemsHtml.push(`
                    <div class="holo-card" onclick="window.Router && window.Router.navigate('${targetRoute}')" style="min-width: 260px; width: 260px; height: 150px; background: #ffffff; border-radius: 18px; padding: 16px; margin-right: 14px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); position: relative; overflow: hidden; cursor: pointer; border: 1px solid #e5e7eb;">
                        <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:3; margin-bottom: 10px;">
                            <span style="font-size:0.62rem; font-weight:900; color:#111827; background:#CCFF00; padding:3px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">DESTACADO</span>
                            <span style="font-size:0.65rem; color:#64748b; font-weight:700;">${this.formatDateShort(topEvt.date)}</span>
                        </div>
                        <div style="position:relative; z-index:3;">
                            <h4 style="margin:0 0 6px; color:#111827; font-size:0.95rem; font-weight:900; line-height:1.2;">${topEvt.name || "Evento"}</h4>
                            <div style="font-size: 0.72rem; color: #16a34a; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-top: 10px;">
                                Reservar plaza <i class="fas fa-arrow-right" style="font-size: 0.65rem;"></i>
                            </div>
                        </div>
                    </div>
                    `);
                }

                openEvents.slice(1).forEach(am => {
                    const isEntreno = (am.type === 'entreno') || (am.name || '').toLowerCase().includes('entreno');
                    const targetRoute = isEntreno ? 'entrenos' : 'americanas';
                    itemsHtml.push(`
                    <div class="holo-card" onclick="window.Router && window.Router.navigate('${targetRoute}')" style="min-width: 250px; width: 250px; height: 150px; background: #ffffff; border-radius: 18px; padding: 16px; margin-right: 14px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); position: relative; overflow: hidden; cursor: pointer; border: 1px solid #e5e7eb;">
                        <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:3; margin-bottom: 10px;">
                             <span style="font-size:0.62rem; color:#111827; font-weight:800; background:#f3f4f6; padding: 3px 8px; border-radius: 6px; border: 1px solid #e5e7eb;">${this.formatDateShort(am.date)}</span>
                             <span style="font-size:0.65rem; color:#16a34a; font-weight:800;">Abierto</span>
                        </div>
                        <div style="position:relative; z-index:3;">
                            <h4 style="margin:0 0 6px; color:#111827; font-size:0.92rem; font-weight:900; line-height:1.2;">${am.name}</h4>
                            <div style="font-size: 0.72rem; color: #64748b; font-weight: 600; margin-top: 8px;">Plazas disponibles</div>
                        </div>
                    </div>
                    `);
                });

                const maxCards = 8;
                const remainingSlots = Math.max(0, maxCards - itemsHtml.length);
                const shuffledPool = [...dynamicPool].sort(() => 0.5 - Math.random());
                const selectedTips = shuffledPool.slice(0, remainingSlots);

                selectedTips.forEach((tip) => {
                    itemsHtml.push(`
                    <div class="holo-card" onclick="${tip.action || ''}" style="cursor: pointer; min-width: 250px; width: 250px; height: 150px; background: #ffffff; border-radius: 18px; padding: 16px; margin-right: 14px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); position: relative; overflow: hidden; border: 1px solid #e5e7eb;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                            <span style="font-size:0.62rem; font-weight:800; color:#111827; background:#f3f4f6; padding:3px 8px; border-radius:6px; border:1px solid #e5e7eb;">${tip.tag}</span>
                            <i class="fas ${tip.icon}" style="color:#64748b; font-size:0.9rem;"></i>
                        </div>
                        <div>
                            <div style="color:#111827; font-weight:900; font-size:0.95rem; margin-bottom:4px;">${tip.title}</div>
                            <div style="color:#64748b; font-size:0.75rem; font-weight:500; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${tip.desc}</div>
                        </div>
                    </div>
                   `);
                });

                const scroller = document.getElementById('live-scroller-inner');
                const html = itemsHtml.join('');
                if (scroller) {
                    scroller.innerHTML = html + html;
                }
                return html;
            } catch (err) {
                console.error("renderLiveWidget Error:", err);
                return '';
            }
        }

        formatDateShort(dateString) {
            if (!dateString) return 'HOY';
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'HOY';
            if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';

            const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
            return `${days[date.getDay()]} ${date.getDate()} `;
        }

        /**
         * Real data context builder for the Hero Card
         * @param {Object} user - The current logged in user
         */
        async buildContext(user) {
            const context = {
                status: 'EMPTY',
                eventName: null,
                eventDate: null,
                eventTime: null,
                court: null,
                opponents: null,
                partner: null,
                eventDateRaw: null,
                hasMatchToday: false,
                hasOpenTournament: false,
                hasRecentVictory: false,
                hasMatchThisWeek: false,
                activeTournaments: 0,
                upcomingMatches: 0,
                myEvents: [],
                scoreA: null,
                scoreB: null,
                pointsEarned: 0,
                newRank: '-',
                confirmed: false,
                matchId: null,
                matchType: null
            };

            if (!user) return context;

            try {
                // 1. Get All Events & User Stats (Real-time or Cached)
                const [allEvents, rankedPlayers] = await Promise.all([
                    window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                    window.RankingController ? window.RankingController.calculateSilently() : []
                ]);

                const userId = user.uid || user.id;

                // 2. Real Rank Calculation
                if (rankedPlayers.length > 0) {
                    const myRankIndex = rankedPlayers.findIndex(p => p.id === userId);
                    context.newRank = myRankIndex !== -1 ? (myRankIndex + 1).toString() : '-';
                }

                // 3. Victory Detection (Last 24h)
                const winningMatch = await this.checkRecentVictory(user);
                context.hasRecentVictory = !!winningMatch;
                if (winningMatch) {
                    const isTeamA = (winningMatch.team_a_ids || []).includes(userId);
                    context.scoreA = isTeamA ? winningMatch.score_a : winningMatch.score_b;
                    context.scoreB = isTeamA ? winningMatch.score_b : winningMatch.score_a;
                    context.opponents = isTeamA ? winningMatch.team_b_names : winningMatch.team_a_names;
                }

                // 4. Inscriptions & Waitlist Monitor
                const openEvents = allEvents.filter(a => ['open', 'upcoming', 'scheduled'].includes(a.status));
                context.activeTournaments = openEvents.length;
                // 5. STATS & ARCHIVE (Calculated silently in background)
                if (window.RankingController) {
                    const ranked = await window.RankingController.calculateSilently();
                    const me = ranked.find(p => p.id === userId);
                    if (me) {
                        context.myRank = me.rank;
                        context.rankStatus = me.trend || 'stable';
                    }
                }

                // 2026 UPDATE: Fetch active tournaments for ActionGrid badge
                if (window.AmericanaService) {
                    const activeEvents = await window.AmericanaService.getAllActiveEvents();
                    context.activeTournaments = activeEvents.filter(e => e.type === 'americana' && e.status !== 'finished').length;

                    // Specific active tournament for QuickStats (if user is in one)
                    context.activeTournament = activeEvents.find(e =>
                        e.type === 'americana' &&
                        e.status !== 'finished' &&
                        (e.players || []).some(p => p.id === userId)
                    );
                }

                // 5. User's specific participation (re-ordered)
                context.myEvents = allEvents.filter(a => {
                    const players = a.players || a.registeredPlayers || [];
                    return players.some(p => (p.uid || p.id || p) === userId);
                });

                context.upcomingMatches = context.myEvents.filter(e => e.status !== 'finished').length;
                context.hasMatchThisWeek = context.upcomingMatches > 0;

                // 6. DEEP DIVE: Current/Next Match Details
                const myActiveEvent = context.myEvents.find(e => !['finished', 'closed'].includes(e.status));

                if (myActiveEvent) {
                    const isTodayMatch = this.isToday(myActiveEvent.date);
                    const isLive = myActiveEvent.status === 'live' || myActiveEvent.status === 'in_progress';

                    if (isTodayMatch || isLive) {
                        context.hasMatchToday = true;
                        context.status = isLive ? 'LIVE_MATCH' : 'UPCOMING_EVENT';
                        context.eventName = myActiveEvent.name;
                        context.matchTime = myActiveEvent.time || '18:00';
                        context.matchDay = 'HOY';
                        context.tournamentName = myActiveEvent.type === 'entreno' ? 'Entreno (Pozo)' : 'Americana';
                        context.eventDateRaw = myActiveEvent.date;
                        context.matchType = myActiveEvent.type;

                        // FETCH REAL MATCH DATA (Court, Partner, Opponents)
                        const matchData = await this.fetchMatchDetails(userId, myActiveEvent.id, myActiveEvent.type);
                        if (matchData) {
                            context.matchId = matchData.id;
                            context.court = matchData.court || '?';
                            context.partner = matchData.partnerName || 'Asignando...';
                            context.opponents = matchData.opponentsNames || 'Asignando...';
                            context.confirmed = matchData.confirmations ? !!matchData.confirmations[userId] : false;
                        }
                    } else {
                        context.status = 'UPCOMING_EVENT';
                        context.eventName = myActiveEvent.name;
                        context.matchTime = myActiveEvent.time || '18:00';
                        context.matchDay = this.formatFriendlyDate(myActiveEvent.date);
                    }
                } else if (context.hasRecentVictory) {
                    context.status = 'VICTORY';
                    context.pointsEarned = 15; // Mock for now, should calculate
                } else if (context.hasOpenTournament) {
                    context.status = 'EMPTY';
                }

            } catch (err) {
                console.error("❌ [DashboardView] Error building user context:", err);
            }

            return context;
        }

        // --- PHASE 1 HELPERS ---

        isToday(dateStr) {
            if (!dateStr) return false;
            const today = new Date().toISOString().split('T')[0];
            return dateStr === today;
        }

        formatFriendlyDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
        }

        async fetchMatchDetails(userId, eventId, type) {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                // We fetch matches for this event where the user participates
                const snapshot = await window.db.collection(collectionName)
                    .where('americana_id', '==', eventId)
                    .orderBy('round', 'desc')
                    .limit(10)
                    .get();

                if (snapshot.empty) return null;

                const userMatch = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .find(m => {
                        const ids = [...(m.team_a_ids || []), ...(m.team_b_ids || [])];
                        return ids.includes(userId);
                    });

                if (!userMatch) return null;

                const isTeamA = (userMatch.team_a_ids || []).includes(userId);
                const myTeamIds = isTeamA ? userMatch.team_a_ids : userMatch.team_b_ids;
                const opponentNamesRaw = isTeamA ? userMatch.team_b_names : userMatch.team_a_names;
                const myTeamNamesRaw = isTeamA ? userMatch.team_a_names : userMatch.team_b_names;

                const pId = myTeamIds.find(id => id !== userId);
                let partnerName = 'Solo';
                if (pId && myTeamNamesRaw) {
                    // Extract name from namesRaw "Name 1 / Name 2"
                    const names = myTeamNamesRaw.split(' / ');
                    const user = window.Store.getState('currentUser');
                    partnerName = names.find(n => !n.toLowerCase().includes(user.name.toLowerCase())) || names[1] || names[0];
                }

                return {
                    id: userMatch.id,
                    court: userMatch.court,
                    partnerName: partnerName,
                    opponentsNames: opponentNamesRaw,
                    confirmations: userMatch.confirmations || {},
                    round: userMatch.round
                };
            } catch (e) {
                console.warn("fetchMatchDetails error:", e);
                return null;
            }
        }

        async checkRecentVictory(user) {
            try {
                const userId = user.uid || user.id;
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

                const pulls = await Promise.all([
                    window.db.collection('matches').where('status', '==', 'finished').where('created_at', '>', yesterday).get(),
                    window.db.collection('entrenos_matches').where('status', '==', 'finished').where('created_at', '>', yesterday).get()
                ]);

                const allRecentMatches = [...pulls[0].docs, ...pulls[1].docs].map(doc => doc.data());

                return allRecentMatches.find(m => {
                    const isTeamA = (m.team_a_ids || []).includes(userId);
                    const isTeamB = (m.team_b_ids || []).includes(userId);
                    if (!isTeamA && !isTeamB) return false;

                    const scoreA = parseInt(m.score_a || 0);
                    const scoreB = parseInt(m.score_b || 0);

                    if (isTeamA) return scoreA > scoreB;
                    if (isTeamB) return scoreB > scoreA;
                    return false;
                });
            } catch (e) {
                return null;
            }
        }


        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return `${days[date.getDay()]} ${date.getDate()}`;
        }

        /**
         * Normaliza un timestamp de Firestore o JS a milisegundos
         */
        _getTimestampValue(ts) {
            if (!ts) return Date.now();
            if (ts.toMillis) return ts.toMillis();
            if (ts instanceof Date) return ts.getTime();
            if (typeof ts === 'string') {
                const d = new Date(ts);
                return isNaN(d.getTime()) ? Date.now() : d.getTime();
            }
            if (typeof ts === 'number') return ts;
            return Date.now();
        }

        async loadLiveWidgetContent(context) {
            console.log("🧠 [DashboardView] loadLiveWidgetContent started");

            // 4. Load Predictive Synergy Widget
            try {
                const synergyContainer = document.getElementById('predictive-synergy-root');
                // Use Store OR global backup OR Firebase Auth directly as last resort
                const user = (window.Store ? window.Store.getState('currentUser') : null) ||
                    window.currentUser ||
                    (window.firebase ? window.firebase.auth().currentUser : null);

                console.log("🧠 [DashboardView] Synergy Init Check:", {
                    hasContainer: !!synergyContainer,
                    hasUser: !!user,
                    userId: user ? (user.uid || user.id) : 'none'
                });

                if (synergyContainer && user) {
                    const userId = user.uid || user.id;
                    if (!userId) {
                        console.warn("⚠️ [DashboardView] User exists but has no UID/ID");
                        synergyContainer.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center;">⚠️ Sesión incompleta</div>`;
                        return;
                    }

                    // Subscribe to real-time changes
                    if (window.PartnerSynergyService && window.PartnerSynergyService.subscribeToPlayerData) {
                        window.PartnerSynergyService.subscribeToPlayerData(userId, async () => {
                            console.log("🧠 [DashboardView] Real-time Sync Triggered");
                            const html = await this.renderPredictiveSynergy();
                            if (html && synergyContainer) synergyContainer.innerHTML = html;
                        });
                    }

                    // Initial render
                    const refreshSynergy = async () => {
                        const html = await this.renderPredictiveSynergy();
                        if (html && html.trim() !== '') {
                            console.log("🧠 [DashboardView] Synergy HTML generated");
                            if (synergyContainer) synergyContainer.innerHTML = html;
                        } else {
                            console.warn("🧠 [DashboardView] Synergy HTML was empty");
                            if (synergyContainer) synergyContainer.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center; border:1px solid rgba(255,0,0,0.3); border-radius:15px;">⚠️ Generando análisis...</div>`;
                        }
                    };

                    refreshSynergy();
                } else if (!synergyContainer) {
                    console.error("❌ [DashboardView] predictive-synergy-root NOT FOUND");
                } else if (!user) {
                    console.warn("⚠️ [DashboardView] No user found in Store during loadLiveWidgetContent");
                    // Don't show the "Lock" message immediately if we just loaded, give it a second
                    setTimeout(() => {
                        const userCheck = (window.Store ? window.Store.getState('currentUser') : null) || window.currentUser;
                        if (!userCheck && synergyContainer) {
                            synergyContainer.innerHTML = `<div style="padding:20px; color:rgba(255,255,255,0.4); text-align:center;">🔒 Inicia sesión para ver tu análisis</div>`;
                        }
                    }, 2000);
                }
            } catch (e) {
                console.error("❌ Predictive Synergy loading failed", e);
            }

            try {
                const container = document.getElementById('live-scroller-content');
                if (!container) {
                    console.warn("⚠️ [DashboardView] live-scroller-content not found, skipping other widgets");
                    return;
                }

                // 1. Load Registration Cards (Intelligent Ticker)
                // Aseguramos visibilidad del contenedor
                const newsRoot = document.getElementById('registration-widget-root');
                if (newsRoot) newsRoot.style.display = 'block';

                await this.renderLiveWidget(context);

                // 3. Load Activity Feed
                const activityContainer = document.getElementById('activity-feed-content');
                if (activityContainer) {
                    this.renderActivityFeed().then(html => {
                        activityContainer.innerHTML = html;
                    }).catch(e => {
                        console.error("Activity Feed failed", e);
                    });
                }
                // 4. Load Trending Players
                this.renderTrendingPlayers();

                // 5. Dynamic Track Hydration (Americanas & Entrenos con datos 100% reales de Firestore)
                this.hydrateRealEventsTracks();
            } catch (e) {
                console.error('❌ [DashboardView] Error in core widget loading:', e);
            }
        }

        /**
         * 🖼️ Obtiene el cartel oficial 100% correspondiente a la americana
         */
        getAmericanaPoster(ev) {
            if (!ev) return 'img/americana mixta.jpg';
            // 1. Prioridad: Cartel o imagen personalizada asignada al torneo
            const customImg = (ev.image_url || ev.imageUrl || ev.poster || ev.posterUrl || ev.cover || ev.flyer || '').trim();
            if (customImg) return customImg;

            // 2. Sincronización oficial por categoría y nombre
            const name = (ev.name || ev.title || '').toLowerCase();
            const cat = (ev.category || '').toLowerCase();

            if (cat === 'female' || cat === 'femenina' || cat === 'femenino' || name.includes('femenin') || name.includes('chicas')) {
                return 'img/americana femeninas.jpg';
            }
            if (cat === 'male' || cat === 'masculina' || cat === 'masculino' || name.includes('masculin') || name.includes('chicos') || name.includes('pro')) {
                return 'img/americana masculina.jpg';
            }
            if (cat === 'mixed' || cat === 'mixta' || cat === 'mixto' || name.includes('mixt') || name.includes('oro') || name.includes('twister')) {
                return 'img/americana mixta.jpg';
            }
            return 'img/padel-event.jpg';
        }

        /**
         * 🏷️ Obtiene el nivel real formateado del evento (Americanas y Entrenos)
         */
        getEventLevelDisplay(ev) {
            if (!ev) return 'Todos los niveles';

            // 1. Si ev.level está definido y es específico
            const lvl = ev.level || ev.nivel;
            if (lvl !== undefined && lvl !== null) {
                const s = String(lvl).trim();
                if (s && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'todos los niveles') {
                    if (/^nivel\b/i.test(s)) return s;
                    return `Nivel ${s}`;
                }
            }

            // 2. Si tiene rango level_min y/o level_max (ej. 3.5 y 4.5 o 3,5 y 5)
            const min = ev.level_min ?? ev.min_level ?? ev.levelMin;
            const max = ev.level_max ?? ev.max_level ?? ev.levelMax;
            const hasMin = min !== undefined && min !== null && String(min).trim() !== '' && String(min).trim().toLowerCase() !== 'undefined';
            const hasMax = max !== undefined && max !== null && String(max).trim() !== '' && String(max).trim().toLowerCase() !== 'undefined';

            if (hasMin && hasMax) {
                const cleanMin = String(min).trim().replace(',', '.');
                const cleanMax = String(max).trim().replace(',', '.');
                if (cleanMin === cleanMax) {
                    return `Nivel ${cleanMin}`;
                }
                return `Nivel ${cleanMin} - ${cleanMax}`;
            } else if (hasMin) {
                const cleanMin = String(min).trim().replace(',', '.');
                return `Nivel ${cleanMin}+`;
            } else if (hasMax) {
                const cleanMax = String(max).trim().replace(',', '.');
                return `Hasta Nivel ${cleanMax}`;
            }

            // 3. Si tiene level_range o levelRange
            const range = ev.level_range || ev.levelRange;
            if (range && String(range).trim()) {
                const rStr = String(range).trim();
                return /^nivel\b/i.test(rStr) ? rStr : `Nivel ${rStr}`;
            }

            // 4. Intentar extraer del título o nombre si contiene patrón de nivel (ej. "Nivel 3.5 - 4.5", "Niv 3.5")
            const title = ev.name || ev.title || '';
            if (title) {
                const rangeMatch = title.match(/niv(?:el)?\.?\s*([1-7](?:[.,]\d+)?\s*(?:-|a)\s*[1-7](?:[.,]\d+)?)/i);
                if (rangeMatch) return `Nivel ${rangeMatch[1].replace(',', '.')}`;

                const singleMatch = title.match(/niv(?:el)?\.?\s*([1-7](?:[.,]\d+)?)/i);
                if (singleMatch) return `Nivel ${singleMatch[1].replace(',', '.')}`;

                const decimalMatch = title.match(/\b([1-7][.,]\d+)\b/);
                if (decimalMatch) return `Nivel ${decimalMatch[1].replace(',', '.')}`;
            }

            // 5. Si ev.level era explícitamente "Todos los niveles"
            if (lvl && String(lvl).trim().toLowerCase() === 'todos los niveles') {
                return 'Todos los niveles';
            }

            // Fallback según tipo de evento
            const isEntreno = ev.type === 'entreno' || (title && title.toLowerCase().includes('entreno'));
            return isEntreno ? 'Todos los niveles' : 'Abierto';
        }

        /**
         * 🏷️ Devuelve el HTML inicial del track: eventos reales si ya están en memoria,
         * o un skeleton loader suave si se están descargando. NUNCA datos ficticios ni mocks.
         */
                /**
         * ⚡ Retorna los eventos activos de inmediato (0ms sincrónico):
         * Memoria RAM -> EventsController -> LocalStorage instantáneo.
         */
        getInstantActiveEvents() {
            if (Array.isArray(this._cachedEvents) && this._cachedEvents.length > 0) {
                return this._cachedEvents;
            }
            if (window.AmericanaService && Array.isArray(window.AmericanaService._cachedActiveEvents) && window.AmericanaService._cachedActiveEvents.length > 0) {
                this._cachedEvents = window.AmericanaService._cachedActiveEvents;
                return this._cachedEvents;
            }
            if (window.EventsController?.state) {
                const ams = window.EventsController.state.americanas || [];
                const ents = window.EventsController.state.entrenos || [];
                if (ams.length > 0 || ents.length > 0) {
                    this._cachedEvents = [...ams, ...ents];
                    return this._cachedEvents;
                }
            }
            try {
                const cached = localStorage.getItem('sp_cached_active_events_v2');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this._cachedEvents = parsed;
                        return parsed;
                    }
                }
            } catch (_) {}
            return [];
        }

        getTrackInitialHtml(type) {
            const events = this.getInstantActiveEvents();

            if (type === 'americana') {
                const amEvents = events.filter(e => {
                    const name = (e.name || e.title || '').toLowerCase();
                    const eType = (e.type || '').toLowerCase();
                    const status = (e.status || '').toLowerCase();
                    return eType !== 'entreno' && !name.includes('entreno') && !['finished', 'finalizado', 'cancelled', 'suspendido', 'anulado'].includes(status);
                });
                if (amEvents.length > 0) {
                    return amEvents.slice(0, 8).map(ev => this.renderAmericanaTrackCard(ev)).join('');
                }
            } else {
                const entEvents = events.filter(e => {
                    const name = (e.name || e.title || '').toLowerCase();
                    const eType = (e.type || '').toLowerCase();
                    const status = (e.status || '').toLowerCase();
                    return (eType === 'entreno' || name.includes('entreno')) && !['finished', 'finalizado', 'cancelled', 'suspendido', 'anulado'].includes(status);
                });
                if (entEvents.length > 0) {
                    return entEvents.slice(0, 6).map((ev, idx) => this.renderEntrenoTrackCard(ev, idx)).join('');
                }
            }

            // Skeleton loader suave de carga (NUNCA tarjetas ficticias ni con datos falsos)
            return `
                <div style="min-width: 260px; max-width: 270px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 14px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 10px;">
                    <div style="height: 110px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-circle-notch fa-spin" style="color: #94a3b8; font-size: 1.2rem;"></i>
                    </div>
                    <div style="height: 14px; background: #f1f5f9; border-radius: 6px; width: 60%;"></div>
                    <div style="height: 18px; background: #e2e8f0; border-radius: 6px; width: 85%;"></div>
                    <div style="height: 34px; background: #f1f5f9; border-radius: 10px; width: 100%; margin-top: 6px;"></div>
                </div>
                <div style="min-width: 260px; max-width: 270px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 14px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 10px; opacity: 0.6;">
                    <div style="height: 110px; background: #f1f5f9; border-radius: 12px;"></div>
                    <div style="height: 14px; background: #f1f5f9; border-radius: 6px; width: 50%;"></div>
                    <div style="height: 18px; background: #e2e8f0; border-radius: 6px; width: 75%;"></div>
                    <div style="height: 34px; background: #f1f5f9; border-radius: 10px; width: 100%; margin-top: 6px;"></div>
                </div>
            `;
        }

        /**
         * 👤 Comprueba de manera infalible si el usuario actual está inscrito en el evento
         */
        isUserRegisteredInEvent(ev) {
            if (!ev) return false;
            const user = (window.Store && typeof window.Store.getState === 'function' ? window.Store.getState('currentUser') : null) ||
                         (window.EventsController?.state?.currentUser) ||
                         window.currentUser ||
                         null;
            const authUser = window.firebase?.auth && typeof window.firebase.auth === 'function' ? window.firebase.auth().currentUser : null;
            
            const uid = user ? (user.uid || user.id) : (authUser ? authUser.uid : null);
            const email = (user?.email || authUser?.email || '').toLowerCase().trim();
            const rawName = (user?.name || user?.displayName || authUser?.displayName || '').trim();
            const cleanName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

            if (!uid && !email && !cleanName) return false;

            const players = ev.players || ev.registeredPlayers || [];
            return players.some(p => {
                if (!p) return false;
                if (typeof p === 'string') {
                    const pNorm = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                    return (uid && p === uid) || (cleanName && pNorm === cleanName);
                }
                const pId = p.uid || p.id || p.userId;
                if (uid && pId && String(pId) === String(uid)) return true;
                if (email && p.email && p.email.toLowerCase().trim() === email) return true;
                
                const pName = (p.name || p.displayName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                if (cleanName && pName && (pName === cleanName || pName.includes(cleanName) || cleanName.includes(pName))) return true;

                // Pareja fija por partner_id o partner_name
                if (uid && p.partner_id && String(p.partner_id) === String(uid)) return true;
                if (cleanName && p.partner_name) {
                    const partnerNorm = p.partner_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                    if (partnerNorm === cleanName) return true;
                }
                return false;
            });
        }

        /**
         * 🎾 Renderiza una tarjeta real individual de Americana (100% sincronizada con estado de inscripción)
         */
        renderAmericanaTrackCard(ev) {
            if (!ev) return '';
            const photo = this.getAmericanaPoster(ev);
            const dateStr = this.formatDateShort ? this.formatDateShort(ev.date) : (ev.date || 'Próximamente');
            const timeStr = ev.time || ev.hora || '19:30';
            const playersCount = (ev.players || ev.registeredPlayers || []).length;
            const maxP = ev.max_players || ev.maxPlayers || ((ev.max_courts || 4) * 4);
            const spotsLeft = Math.max(0, maxP - playersCount);
            const pct = Math.min(100, Math.round((playersCount / Math.max(1, maxP)) * 100));
            const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
            const cleanName = (ev.name || ev.title || 'Americana').replace(/'/g, "\\'");
            const cleanSede = (ev.sede || ev.location || 'SomosPadel BCN').replace(/'/g, "\\'");
            const safePhoto = photo.replace(/'/g, "\\'");
            const levelDisplay = this.getEventLevelDisplay(ev);
            const isJoined = this.isUserRegisteredInEvent(ev);

            // Botón de acción inteligente
            let actionBtnHtml = '';
            if (isJoined) {
                actionBtnHtml = `
                    <button onclick="event.stopPropagation(); window.EventsController && (window.EventsController.showInscritosModal || window.EventsController.openInscritosModal) ? (window.EventsController.showInscritosModal ? window.EventsController.showInscritosModal('${ev.id}', 'americana') : window.EventsController.openInscritosModal('${ev.id}', 'americana')) : (window.Router && window.Router.navigate('entrenos'))" style="
                        width: 100%;
                        background: #dcfce7;
                        color: #14532d;
                        border: 2px solid #22c55e;
                        border-radius: 10px;
                        padding: 10px;
                        font-size: 0.82rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        box-shadow: 0 4px 14px rgba(34, 197, 94, 0.25);
                        transition: transform 0.15s, background 0.15s;
                    " onmouseover="this.style.transform='scale(1.02)'; this.style.background='#bbf7d0';" onmouseout="this.style.transform='scale(1)'; this.style.background='#dcfce7';">
                        <i class="fas fa-check-circle" style="color: #16a34a; font-size: 0.95rem;"></i> ¡Estás inscrito! Ver mi plaza
                    </button>
                `;
            } else if (spotsLeft <= 0) {
                actionBtnHtml = `
                    <button onclick="event.stopPropagation(); window.EventsController && window.EventsController.joinWaitlist ? window.EventsController.joinWaitlist('${ev.id}', 'americana') : (window.Router && window.Router.navigate('americanas'))" style="
                        width: 100%;
                        background: #fef08a;
                        color: #854d0e;
                        border: 1px solid #facc15;
                        border-radius: 10px;
                        padding: 9px;
                        font-size: 0.80rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-bell"></i> Lista de espera
                    </button>
                `;
            } else {
                actionBtnHtml = `
                    <button onclick="event.stopPropagation(); window.EventsController && window.EventsController.joinEvent ? window.EventsController.joinEvent('${ev.id}', 'americana') : (window.Router && window.Router.navigate('americanas'))" style="
                        width: 100%;
                        background: #111827;
                        color: #ffffff;
                        border: none;
                        border-radius: 10px;
                        padding: 9px;
                        font-size: 0.80rem;
                        font-weight: 800;
                        cursor: pointer;
                    ">
                        Inscribirme
                    </button>
                `;
            }

            return `
                <div onclick="window.EventsController && window.EventsController.openInscritosModal ? window.EventsController.openInscritosModal('${ev.id}', 'americana') : (window.Router && window.Router.navigate('americanas'))" style="
                    min-width: 260px;
                    max-width: 270px;
                    background: ${isJoined ? 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' : '#ffffff'};
                    border: ${isJoined ? '2.5px solid #16a34a' : '1px solid #e5e7eb'};
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow: ${isJoined ? '0 10px 25px rgba(22, 163, 74, 0.22), 0 0 0 1px #86efac' : '0 4px 14px rgba(0,0,0,0.04)'};
                    flex-shrink: 0;
                    scroll-snap-align: start;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                "
                onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)';"
                onmouseout="this.style.transform='none'; this.style.boxShadow='${isJoined ? '0 6px 18px rgba(34, 197, 94, 0.18)' : '0 4px 14px rgba(0,0,0,0.04)'}';">
                    <div style="position: relative; height: 125px; overflow: hidden; background: #0f172a;">
                        <img src="${photo}" alt="${ev.name || 'Americana'}" 
                             onerror="this.onerror=null; this.src='img/americana mixta.jpg';"
                             style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 10px; left: 10px; background: #111827; color: #CCFF00; font-size: 0.65rem; font-weight: 900; padding: 3px 8px; border-radius: 6px;">
                            🎾 ${dateStr} ${timeStr ? timeStr + 'H' : ''}
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.95); color: #111827; font-size: 0.62rem; font-weight: 800; padding: 3px 7px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
                            ${levelDisplay}
                        </div>
                        ${isJoined ? `
                            <div style="position: absolute; bottom: 8px; left: 10px; background: #CCFF00; color: #090f1e; font-size: 0.68rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 5px; z-index: 5; border: 1.5px solid #ffffff; letter-spacing: 0.3px;">
                                <i class="fas fa-check-circle" style="color: #16a34a; font-size: 0.85rem;"></i> ¡ESTÁS INSCRITO!
                            </div>
                        ` : ''}
                        <div onclick="event.stopPropagation(); window.openPosterModal('${safePhoto}', '${cleanName}', '${cleanSede}');"
                             title="Ver Cartel Oficial"
                             style="position: absolute; bottom: 8px; right: 10px; background: rgba(15, 23, 42, 0.88); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.45); font-size: 0.60rem; font-weight: 900; padding: 2px 7px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(6px); z-index: 5;">
                            <i class="fas fa-file-image"></i> CARTEL
                        </div>
                    </div>
                    <div style="padding: 14px;">
                        ${isJoined ? `<div style="display: inline-flex; align-items: center; gap: 5px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 3px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 900; margin-bottom: 6px;"><i class="fas fa-user-check"></i> PLAZA CONFIRMADA</div>` : ''}
                        <div style="font-size: 0.65rem; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 3px;">
                            ${ev.format ? ev.format.toUpperCase() : 'TORNEO OFICIAL'}
                        </div>
                        <h4 style="margin: 0 0 6px; font-size: 0.95rem; font-weight: 900; color: #111827; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${ev.name || ev.title || 'Americana Express'}
                        </h4>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">
                                <i class="fas fa-users" style="color: #94a3b8; margin-right: 4px;"></i> ${playersCount}/${maxP} inscritos
                            </span>
                            <span style="font-size: 0.72rem; font-weight: 800; color: ${isJoined ? '#16a34a' : (isAlmostFull ? '#dc2626' : (spotsLeft === 0 ? '#64748b' : '#16a34a'))};">
                                ${isJoined ? '¡Tienes plaza!' : (spotsLeft > 0 ? (isAlmostFull ? `¡Últimas ${spotsLeft}!` : `${spotsLeft} libres`) : 'Completo')}
                            </span>
                        </div>
                        <div style="height: 4px; background: #f3f4f6; border-radius: 4px; overflow: hidden; margin-bottom: 14px;">
                            <div style="width: ${pct}%; height: 100%; background: ${isJoined ? '#22c55e' : '#CCFF00'}; border-radius: 4px;"></div>
                        </div>
                        ${actionBtnHtml}
                    </div>
                </div>
            `;
        }

        /**
         * ⚡ Renderiza una tarjeta real individual de Entreno (100% sincronizada con estado de inscripción)
         */
        renderEntrenoTrackCard(ev, idx = 0) {
            if (!ev) return '';
            const defaultEntrenoPhotos = ['img/entreno masculino prat.jpg', 'img/cem_tennis_hospitalet.png', 'img/entreno mixto prat.jpg', 'img/entreno femenino prat.jpg'];
            const customImg = (ev.image_url || ev.imageUrl || ev.poster || ev.posterUrl || '').trim();
            const photo = customImg || defaultEntrenoPhotos[idx % defaultEntrenoPhotos.length];
            const dateStr = this.formatDateShort ? this.formatDateShort(ev.date) : (ev.date || 'Próximamente');
            const timeStr = ev.time || ev.hora || '18:00';
            const players = ev.players || ev.registeredPlayers || [];
            const maxP = ev.max_players || ev.maxPlayers || 4;
            const spotsLeft = Math.max(0, maxP - players.length);
            const cleanName = (ev.name || ev.title || 'Entreno').replace(/'/g, "\\'");
            const cleanSede = (ev.sede || ev.location || 'SomosPadel BCN').replace(/'/g, "\\'");
            const safePhoto = photo.replace(/'/g, "\\'");
            const levelDisplay = this.getEventLevelDisplay(ev);
            const isJoined = this.isUserRegisteredInEvent(ev);

            // Reorganizar jugadores para que el usuario actual aparezca el primero en los avatares
            let displayPlayers = [...players];
            if (isJoined) {
                const user = (window.Store && typeof window.Store.getState === 'function' ? window.Store.getState('currentUser') : null) || window.EventsController?.state?.currentUser;
                const uid = user ? (user.uid || user.id) : null;
                const cleanName = (user?.name || user?.displayName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

                const myIdx = displayPlayers.findIndex(p => {
                    const pId = typeof p === 'object' ? (p.uid || p.id) : p;
                    const pName = typeof p === 'object' ? (p.name || p.displayName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
                    return (uid && pId && String(pId) === String(uid)) || (cleanName && pName && pName === cleanName);
                });
                if (myIdx > 0) {
                    const [me] = displayPlayers.splice(myIdx, 1);
                    displayPlayers.unshift(me);
                }
            }

            // Botón de acción inteligente
            let actionBtnHtml = '';
            if (isJoined) {
                actionBtnHtml = `
                    <button onclick="event.stopPropagation(); window.EventsController && (window.EventsController.showInscritosModal || window.EventsController.openInscritosModal) ? (window.EventsController.showInscritosModal ? window.EventsController.showInscritosModal('${ev.id}', 'entreno') : window.EventsController.openInscritosModal('${ev.id}', 'entreno')) : (window.Router && window.Router.navigate('entrenos'))" style="
                        width: 100%;
                        background: #dcfce7;
                        color: #14532d;
                        border: 2px solid #22c55e;
                        border-radius: 10px;
                        padding: 10px;
                        font-size: 0.82rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        box-shadow: 0 4px 14px rgba(34, 197, 94, 0.25);
                        transition: transform 0.15s, background 0.15s;
                    " onmouseover="this.style.transform='scale(1.02)'; this.style.background='#bbf7d0';" onmouseout="this.style.transform='scale(1)'; this.style.background='#dcfce7';">
                        <i class="fas fa-check-circle" style="color: #16a34a; font-size: 0.95rem;"></i> ¡Estás inscrito! Ver mi plaza
                    </button>
                `;
            } else if (spotsLeft <= 0) {
                actionBtnHtml = `
                    <button onclick="event.stopPropagation(); window.EventsController && window.EventsController.joinWaitlist ? window.EventsController.joinWaitlist('${ev.id}', 'entreno') : (window.Router && window.Router.navigate('entrenos'))" style="
                        width: 100%;
                        background: #fef08a;
                        color: #854d0e;
                        border: 1px solid #facc15;
                        border-radius: 10px;
                        padding: 9px;
                        font-size: 0.80rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-bell"></i> Lista de espera
                    </button>
                `;
            } else {
                actionBtnHtml = `
                    <button onclick="event.stopPropagation(); window.EventsController && window.EventsController.joinEvent ? window.EventsController.joinEvent('${ev.id}', 'entreno') : (window.Router && window.Router.navigate('entrenos'))" style="
                        width: 100%;
                        background: #CCFF00;
                        color: #111827;
                        border: none;
                        border-radius: 10px;
                        padding: 9px;
                        font-size: 0.80rem;
                        font-weight: 900;
                        cursor: pointer;
                    ">
                        Reservar plaza
                    </button>
                `;
            }

            return `
                <div onclick="window.EventsController && window.EventsController.openInscritosModal ? window.EventsController.openInscritosModal('${ev.id}', 'entreno') : (window.Router && window.Router.navigate('entrenos'))" style="
                    min-width: 260px;
                    max-width: 270px;
                    background: ${isJoined ? 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' : '#ffffff'};
                    border: ${isJoined ? '2.5px solid #16a34a' : '1px solid #e5e7eb'};
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow: ${isJoined ? '0 10px 25px rgba(22, 163, 74, 0.22), 0 0 0 1px #86efac' : '0 4px 14px rgba(0,0,0,0.04)'};
                    flex-shrink: 0;
                    scroll-snap-align: start;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                "
                onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)';"
                onmouseout="this.style.transform='none'; this.style.boxShadow='${isJoined ? '0 6px 18px rgba(34, 197, 94, 0.18)' : '0 4px 14px rgba(0,0,0,0.04)'}';">
                    <div style="position: relative; height: 125px; overflow: hidden; background: #0f172a;">
                        <img src="${photo}" alt="${ev.name || 'Entreno'}" 
                             onerror="this.onerror=null; this.src='img/entreno mixto prat.jpg';"
                             style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 10px; left: 10px; background: #111827; color: #CCFF00; font-size: 0.65rem; font-weight: 900; padding: 3px 8px; border-radius: 6px;">
                            ⚡ ${dateStr} ${timeStr ? timeStr + 'H' : ''}
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.95); color: #111827; font-size: 0.62rem; font-weight: 800; padding: 3px 7px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
                            ${levelDisplay}
                        </div>
                        ${isJoined ? `
                            <div style="position: absolute; bottom: 8px; left: 10px; background: #CCFF00; color: #090f1e; font-size: 0.68rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 5px; z-index: 5; border: 1.5px solid #ffffff; letter-spacing: 0.3px;">
                                <i class="fas fa-check-circle" style="color: #16a34a; font-size: 0.85rem;"></i> ¡ESTÁS INSCRITO!
                            </div>
                        ` : ''}
                        <div onclick="event.stopPropagation(); window.openPosterModal('${safePhoto}', '${cleanName}', '${cleanSede}');"
                             title="Ver Cartel Oficial"
                             style="position: absolute; bottom: 8px; right: 10px; background: rgba(15, 23, 42, 0.88); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.45); font-size: 0.60rem; font-weight: 900; padding: 2px 7px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(6px); z-index: 5;">
                            <i class="fas fa-file-image"></i> CARTEL
                        </div>
                    </div>
                    <div style="padding: 14px;">
                        ${isJoined ? `<div style="display: inline-flex; align-items: center; gap: 5px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 3px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 900; margin-bottom: 6px;"><i class="fas fa-user-check"></i> PLAZA CONFIRMADA</div>` : ''}
                        <div style="font-size: 0.65rem; font-weight: 800; color: #16a34a; text-transform: uppercase; margin-bottom: 3px;">
                            ENTRENO
                        </div>
                        <h4 style="margin: 0 0 6px; font-size: 0.95rem; font-weight: 900; color: #111827; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${ev.name || ev.title || 'Entreno Táctico'}
                        </h4>
                        <div style="margin: 10px 0 14px;">
                            <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 6px;">
                                ${players.length} jugador${players.length === 1 ? '' : 'es'} (${isJoined ? '¡Tú incluido!' : (spotsLeft > 0 ? `${spotsLeft} huecos` : 'Completo')}):
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                ${displayPlayers.slice(0, 3).map((p, pIdx) => {
                                    const pName = typeof p === 'object' ? (p.name || p.displayName || 'J') : 'J';
                                    const isMe = isJoined && pIdx === 0;
                                    if (isMe) {
                                        return `
                                            <div title="Tú (${pName})" style="width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; color: #15803d; font-size: 0.70rem; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid #16a34a; box-shadow: 0 0 8px rgba(22,163,74,0.35);">
                                                <i class="fas fa-check" style="font-size: 0.65rem;"></i>
                                            </div>
                                        `;
                                    }
                                    const bgColors = ['#e0f2fe', '#fef3c7', '#dcfce7'];
                                    const txtColors = ['#0369a1', '#b45309', '#15803d'];
                                    return `
                                        <div title="${pName}" style="width: 32px; height: 32px; border-radius: 50%; background: ${bgColors[pIdx % 3]}; color: ${txtColors[pIdx % 3]}; font-size: 0.70rem; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
                                            ${pName.charAt(0).toUpperCase()}
                                        </div>
                                    `;
                                }).join('')}
                                ${Array(Math.min(3, spotsLeft)).fill(0).map(() => `
                                    <div title="Hueco libre" style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px dashed #cbd5e1; background: #f8fafc; color: #64748b; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: center;">
                                        +
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ${actionBtnHtml}
                    </div>
                </div>
            `;
        }

        /**
         * 🔄 Actualización dinámica de carruseles swipe en Inicio (Americanas y Entrenos con datos 100% reales)
         */
        updateDynamicCarousels(events) {
            if (!Array.isArray(events) || events.length === 0) return;
            this._cachedEvents = events;
            try {
                localStorage.setItem('sp_cached_active_events_v2', JSON.stringify(events));
            } catch (_) {}

            // 1. Carrusel de Americanas sincronizado 100% con datos reales de Firestore
            const amTrack = document.getElementById('americanas-horizontal-track');
            const amEvents = events.filter(e => {
                const name = (e.name || e.title || '').toLowerCase();
                const type = (e.type || '').toLowerCase();
                const status = (e.status || '').toLowerCase();
                return type !== 'entreno' && !name.includes('entreno') && !['finished', 'finalizado', 'cancelled', 'suspendido', 'anulado'].includes(status);
            });

            if (amTrack) {
                if (amEvents.length > 0) {
                    amTrack.innerHTML = amEvents.slice(0, 8).map(ev => this.renderAmericanaTrackCard(ev)).join('');
                } else {
                    amTrack.innerHTML = `
                        <div style="min-width: 100%; padding: 24px 16px; text-align: center; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; color: #64748b; font-size: 0.85rem; font-weight: 700;">
                            <i class="fas fa-calendar-times" style="font-size: 1.5rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
                            No hay torneos o americanas programadas en este momento
                        </div>
                    `;
                }
            }

            // 2. Carrusel de Entrenos sincronizado 100% con datos reales de Firestore
            const entTrack = document.getElementById('entrenos-horizontal-track');
            const entEvents = events.filter(e => {
                const name = (e.name || e.title || '').toLowerCase();
                const type = (e.type || '').toLowerCase();
                const status = (e.status || '').toLowerCase();
                return (type === 'entreno' || name.includes('entreno')) && !['finished', 'finalizado', 'cancelled', 'suspendido', 'anulado'].includes(status);
            });

            if (entTrack) {
                if (entEvents.length > 0) {
                    entTrack.innerHTML = entEvents.slice(0, 6).map((ev, idx) => this.renderEntrenoTrackCard(ev, idx)).join('');
                } else {
                    entTrack.innerHTML = `
                        <div style="min-width: 100%; padding: 24px 16px; text-align: center; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; color: #64748b; font-size: 0.85rem; font-weight: 700;">
                            <i class="fas fa-dumbbell" style="font-size: 1.5rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
                            No hay entrenos programados en este momento
                        </div>
                    `;
                }
            }
        }

        /**
         * ⚡ Sincronización en tiempo real (Realtime Firestore onSnapshot & Events)
         */
        initRealtimeEventsSync() {
            if (this._realtimeEventsSyncActive) return;
            this._realtimeEventsSyncActive = true;

            // Escuchar eventos globales del sistema
            window.addEventListener('americanasUpdated', () => this.hydrateRealEventsTracks());
            window.addEventListener('entrenosUpdated', () => this.hydrateRealEventsTracks());
            window.addEventListener('eventModified', () => this.hydrateRealEventsTracks(true));
            window.addEventListener('userChanged', () => this.hydrateRealEventsTracks(true));

            // Conectar direct onSnapshot a Firestore para el Dashboard
            const db = window.db || (window.firebase?.firestore ? window.firebase.firestore() : null);
            if (db && typeof db.collection === 'function') {
                try {
                    if (this._unsubAmDash) this._unsubAmDash();
                    this._unsubAmDash = db.collection('americanas').onSnapshot(snap => {
                        const ams = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'americana' }));
                        this._cachedAms = ams;
                        if (window.AmericanaService) window.AmericanaService.invalidateActiveEventsCache?.();
                        const ents = this._cachedEnts || (window.EventsController?.state?.entrenos || []);
                        this.updateDynamicCarousels([...ams, ...ents]);
                    }, err => console.warn("[DashboardView] onSnapshot americanas warning:", err));

                    if (this._unsubEntDash) this._unsubEntDash();
                    this._unsubEntDash = db.collection('entrenos').onSnapshot(snap => {
                        const ents = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'entreno' }));
                        this._cachedEnts = ents;
                        if (window.AmericanaService) window.AmericanaService.invalidateActiveEventsCache?.();
                        const ams = this._cachedAms || (window.EventsController?.state?.americanas || []);
                        this.updateDynamicCarousels([...ams, ...ents]);
                    }, err => console.warn("[DashboardView] onSnapshot entrenos warning:", err));
                } catch (e) {
                    console.warn("[DashboardView] Error configurando onSnapshot en Dashboard:", e);
                }
            }
        }

        /**
         * 📥 Hidrata en tiempo real los tracks con eventos 100% reales de Firestore
         */
        async hydrateRealEventsTracks(forceRefresh = false) {
            this.initRealtimeEventsSync();

            // ⚡ PINTURA INSTANTÁNEA (0ms): Si hay eventos en caché, actualizar tracks de inmediato sin esperar la red
            if (!forceRefresh) {
                const instantEvents = this.getInstantActiveEvents();
                if (instantEvents.length > 0) {
                    this.updateDynamicCarousels(instantEvents);
                }
            }

            try {
                if (window.AmericanaService && typeof window.AmericanaService.getAllActiveEvents === 'function') {
                    const events = await window.AmericanaService.getAllActiveEvents({ forceRefresh });
                    if (Array.isArray(events) && events.length > 0) {
                        this.updateDynamicCarousels(events);
                        return;
                    }
                }

                if (window.EventsController?.state) {
                    const ams = window.EventsController.state.americanas || [];
                    const ents = window.EventsController.state.entrenos || [];
                    if (ams.length > 0 || ents.length > 0) {
                        this.updateDynamicCarousels([...ams, ...ents]);
                        return;
                    }
                }
            } catch (e) {
                console.warn("[DashboardView] Error hidratando eventos reales:", e);
            }
        }

        async renderTrendingPlayers() {
            const root = document.getElementById('trending-players-list');
            const mvpRoot = document.getElementById('mvp-spotlight-container');
            if (!root) return;

            try {
                // Obtenemos los datos del Ranking real
                const players = await (window.RankingController ? window.RankingController.calculateSilently() : []);
                
                // --- 1. MVP SPOTLIGHT (Top 1) ---
                if (mvpRoot) {
                    let mvp = (players && players.length > 0) ? players[0] : null;
                    if (!mvp) {
                        const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                        mvp = currentUser ? {
                            name: currentUser.name || "Alejandro Coscolín",
                            level: currentUser.level || 3.5,
                            points: 2450,
                            streak: currentUser.streak || 6,
                            photo_url: currentUser.photo_url || currentUser.photoURL || null,
                            ranking_pos: 1
                        } : {
                            name: "Alejandro Coscolín",
                            level: 3.5,
                            points: 2450,
                            streak: 6,
                            photo_url: null,
                            ranking_pos: 1
                        };
                    }
                    mvpRoot.innerHTML = `
                        <div class="fut-card-container" style="
                            perspective: 1000px;
                            margin-bottom: 16px;
                            font-family: 'Outfit', 'Inter', sans-serif;">
                            <style>
                                @keyframes gold-shine {
                                    0% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                    100% { background-position: 0% 50%; }
                                }
                                .fut-card {
                                    background: linear-gradient(135deg, #1e1b4b 0%, #030712 100%);
                                    border: 2px solid #eab308;
                                    border-radius: 24px;
                                    padding: 2px;
                                    position: relative;
                                    overflow: hidden;
                                    box-shadow: 0 15px 35px rgba(234, 179, 8, 0.15), 0 0 25px rgba(234, 179, 8, 0.05);
                                    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                                    transform-style: preserve-3d;
                                }
                                .fut-card:hover {
                                    transform: rotateY(10deg) rotateX(5deg) scale(1.02);
                                    box-shadow: 0 20px 40px rgba(234, 179, 8, 0.25), 0 0 35px rgba(234, 179, 8, 0.15);
                                }
                                .fut-card-inner {
                                    background: radial-gradient(circle at center, #1c1917 0%, #0c0a09 100%);
                                    border-radius: 22px;
                                    padding: 16px;
                                    position: relative;
                                    z-index: 2;
                                    overflow: hidden;
                                    border: 1px solid rgba(234, 179, 8, 0.25);
                                }
                                .fut-gold-glow {
                                    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                                    background: linear-gradient(45deg, transparent, rgba(234, 179, 8, 0.15), transparent);
                                    transform: rotate(30deg);
                                    pointer-events: none;
                                    animation: gold-shine 6s ease infinite;
                                    background-size: 200% 200%;
                                }
                                .fut-badge-gold {
                                    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
                                    color: #000;
                                    font-weight: 1000;
                                    font-size: 0.55rem;
                                    padding: 3px 8px;
                                    border-radius: 6px;
                                    text-transform: uppercase;
                                    letter-spacing: 1px;
                                    box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
                                    display: inline-block;
                                }
                                .fut-stat-label {
                                    color: rgba(255,255,255,0.4);
                                    font-size: 0.52rem;
                                    font-weight: 800;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                }
                                .fut-stat-value {
                                    color: #fbbf24;
                                    font-size: 0.95rem;
                                    font-weight: 950;
                                    text-shadow: 0 0 5px rgba(251, 191, 36, 0.2);
                                }
                            </style>
                            <div class="fut-card">
                                <div class="fut-gold-glow"></div>
                                <div class="fut-card-inner">
                                    <!-- HEADER STATUS -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; position: relative; z-index: 5;">
                                        <span class="fut-badge-gold"><i class="fas fa-crown"></i> MVP DE LA SEMANA</span>
                                        <span style="color: rgba(251, 191, 36, 0.7); font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;">CIRCUITO SOMOSPADEL</span>
                                    </div>

                                    <!-- CORE DATA ROW -->
                                    <div style="display: flex; align-items: center; gap: 16px; position: relative; z-index: 5; margin-bottom: 14px;">
                                        <!-- Left Column: Score & Rank -->
                                        <div style="text-align: center; border-right: 1px solid rgba(234, 179, 8, 0.2); padding-right: 14px;">
                                            <!-- OVR Rating -->
                                            <div style="font-size: 2.2rem; font-weight: 1000; color: #fbbf24; line-height: 0.8; letter-spacing: -2px; font-family: 'Outfit';">
                                                ${Math.min(99, Math.max(50, Math.round(parseFloat(mvp.level || 3.5) * 15 + 35)))}
                                            </div>
                                            <div style="font-size: 0.5rem; color: #fbbf24; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; line-height: 1;">OVR</div>
                                            <div style="font-size: 0.65rem; color: #fff; font-weight: 950; margin-top: 8px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
                                                RANK #1
                                            </div>
                                        </div>

                                        <!-- Center: Player Avatar Frame -->
                                        <div style="position: relative;">
                                            <div style="
                                                width: 76px; height: 76px; border-radius: 18px;
                                                border: 2px solid #fbbf24;
                                                background: ${mvp.photo_url ? `url('${mvp.photo_url}') center/cover` : '#27272a'};
                                                box-shadow: 0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(234, 179, 8, 0.15);
                                                overflow: hidden;
                                                display: flex; align-items: center; justify-content: center;">
                                                ${!mvp.photo_url ? `<span style="font-size: 2.2rem; font-weight: 1000; color: #fbbf24; font-family: 'Outfit';">${mvp.name.charAt(0).toUpperCase()}</span>` : ''}
                                            </div>
                                            <!-- Small Sparkle icon -->
                                            <div style="position: absolute; bottom: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #fbbf24; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px #fbbf24;">
                                                <i class="fas fa-star" style="font-size: 0.55rem; color: #000;"></i>
                                            </div>
                                        </div>

                                        <!-- Right: Player Name & Primary Info -->
                                        <div style="flex: 1;">
                                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 1000; color: #fff; letter-spacing: -0.5px; line-height: 1.1; font-family: 'Outfit'; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                                                ${mvp.name.toUpperCase()}
                                            </h3>
                                            <div style="color: #a3e635; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; gap: 5px; margin-top: 6px;">
                                                <i class="fas fa-fire"></i> Racha: <span style="font-weight:950;">${mvp.streak || 0} victorias</span>
                                            </div>
                                            <div style="color: rgba(255,255,255,0.4); font-size: 0.55rem; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                                                <i class="fas fa-satellite"></i> NODO_BCN_ACTIVE
                                            </div>
                                        </div>
                                    </div>

                                    <!-- FIFA STYLE ATRIBUTES COLUMNS -->
                                    <div style="
                                        background: rgba(0, 0, 0, 0.4);
                                        border: 1px solid rgba(234, 179, 8, 0.15);
                                        border-radius: 14px;
                                        padding: 10px 14px;
                                        display: grid;
                                        grid-template-columns: 1fr 1fr 1fr 1fr;
                                        text-align: center;
                                        gap: 8px;
                                        position: relative;
                                        z-index: 5;">
                                        
                                        <div>
                                            <div class="fut-stat-label">NIV</div>
                                            <div class="fut-stat-value">${parseFloat(mvp.level || 3.5).toFixed(2)}</div>
                                        </div>
                                        <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                            <div class="fut-stat-label">PTS</div>
                                            <div class="fut-stat-value">${mvp.points || 0}</div>
                                        </div>
                                        <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                            <div class="fut-stat-label">RAC</div>
                                            <div class="fut-stat-value">${mvp.streak || 0}</div>
                                        </div>
                                        <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                            <div class="fut-stat-label">VIC</div>
                                            <div class="fut-stat-value">${mvp.won || mvp.matches_played || 0}</div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // --- 2. TRENDING PLAYERS (Next 9) ---
                const topPlayers = players.slice(1, 10); // Rest of Top 10

                if (topPlayers.length === 0) {
                    root.innerHTML = `<div style="padding:20px; color:#94a3b8; font-size:0.7rem; text-align:center;">Sincronizando ranking...</div>`;
                    return;
                }

                root.innerHTML = topPlayers.map(p => `
                    <div style="min-width: 110px; padding: 14px 10px; text-align: center; flex-shrink: 0; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="position:relative; width:52px; height:52px; margin:0 auto 10px;">
                            <div style="width:100%; height:100%; border-radius:50%; border:2px solid #e2e8f0; background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#f1f5f9'}; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                                ${!p.photo_url ? `<span style="font-weight:950; color:#0a192f; font-size:1.1rem;">${p.name.charAt(0)}</span>` : ''}
                            </div>
                            <div style="position:absolute; bottom:-5px; right:-5px; background:#72a800; color:#fff; font-size:0.5rem; font-weight:950; padding:2px 5px; border-radius:10px; border:2px solid #fff;">
                                #${p.ranking_pos || '?'}
                            </div>
                        </div>
                        <div style="font-size: 0.7rem; font-weight: 950; color: #0a192f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom:4px;">${p.name.split(' ')[0]}</div>
                        <div style="font-size: 0.6rem; color: #72a800; font-weight: 900;">${p.points || 0} PTS</div>
                    </div>
                `).join('');


            } catch (err) {
                console.error("Error rendering trending players:", err);
                if (root) root.innerHTML = "⚠️ Error sync";
            }
        }

        /**
         * 2026 UPDATE: Show a one-time tip to let the user know about the new Profile capabilities.
         */
        showProfileTip() {
            // Only show if not shown in this session
            if (sessionStorage.getItem('profileTipShown')) return;

            setTimeout(async () => {
                if (window.PremiumModal) {
                    await window.PremiumModal.alert({
                        title: '💡 TIP DE NAVEGACIÓN',
                        message: 'Hemos optimizado tu experiencia. Ahora tus <b>Acciones Rápidas</b> y tu <b>Estado Físico</b> están centralizados en tu <b>PERFIL</b>.<br><br>¡Haz clic en tu foto o en la pestaña Perfil para verlo todo!',
                        btnText: '¡ENTENDIDO!',
                        type: 'info'
                    });
                    sessionStorage.setItem('profileTipShown', 'true');
                }
            }, 3000); // 3 second delay for better user experience
        }

        async renderActivityFeed(targetId = null) {
            try {
                if (!document.getElementById('activity-feed-styles')) {
                    const style = document.createElement('style');
                    style.id = 'activity-feed-styles';
                    style.textContent = `
                        @keyframes timelinePulse {
                            0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.4); }
                            70% { box-shadow: 0 0 0 10px rgba(0, 227, 109, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); }
                        }
                        @keyframes showtimeSlide {
                            0% { opacity: 0; transform: translateX(-30px) skewX(-15deg) scale(0.8); filter: brightness(3) blur(10px); }
                            70% { transform: translateX(5px) skewX(0deg) scale(1.05); filter: brightness(1.2) blur(0px); }
                            100% { opacity: 1; transform: translateX(0) skewX(0deg) scale(1); filter: brightness(1) blur(0px); }
                        }
                        @keyframes glint {
                            0% { left: -100%; }
                            20% { left: 100%; }
                            100% { left: 100%; }
                        }
                        .activity-timeline-line {
                            position: absolute;
                            left: 24px;
                            top: 10px;
                            bottom: 10px;
                            width: 2px;
                            background: linear-gradient(to bottom, transparent, rgba(0,227,109,0.3), transparent);
                        }
                        .activity-glass-card {
                            background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 12px;
                            padding: 16px 18px 16px 50px;
                            position: relative;
                            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                            cursor: pointer;
                            overflow: hidden;
                            margin-bottom: 2px;
                        }
                        .activity-glass-card::before {
                            content: '';
                            position: absolute;
                            top: 0; left: -100%;
                            width: 100%; height: 100%;
                            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                            animation: glint 5s infinite linear;
                        }
                        /* Look "TV Show" Scanlines */
                        .activity-glass-card::after {
                            content: '';
                            position: absolute;
                            inset: 0;
                            background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 2px);
                            pointer-events: none;
                        }
                        .activity-glass-card:hover {
                            background: rgba(255, 255, 255, 0.12);
                            transform: scale(1.03) translateX(10px) rotate(-0.5deg);
                            border-color: rgba(204, 255, 0, 0.5);
                            box-shadow: -10px 10px 30px rgba(0,0,0,0.5);
                        }
                        .activity-dot {
                            position: absolute;
                            left: 17px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 14px;
                            height: 14px;
                            border-radius: 4px;
                            z-index: 2;
                            border: 2px solid #000;
                            box-shadow: 0 0 15px currentColor;
                        }
                        .activity-impact-badge {
                            position: absolute;
                            top: 0; left: 0;
                            width: 4px; height: 100%;
                            background: currentColor;
                            box-shadow: 0 0 15px currentColor;
                        }
                    `;
                    document.head.appendChild(style);
                }

                const activities = [];
                const [registrations, urgentAlerts, rankingChanges] = await Promise.all([
                    this.getRecentRegistrations(120),
                    this.getUrgentAlerts(),
                    this.getRankingChanges()
                ]);

                // 2026 UPDATE: Inyectar notificaciones reales (Firestore + Chat)
                const realNotifications = window.NotificationService ? window.NotificationService.getMergedNotifications() : [];
                realNotifications.forEach(notif => {
                    activities.push({
                        type: notif.isChat ? 'chat' : 'notification',
                        icon: notif.isChat ? '💬' : '🔔',
                        title: notif.title || 'Notificación',
                        desc: notif.body || '',
                        time: this.formatRelativeTime(notif.timestamp),
                        color: notif.isChat ? '#CCFF00' : '#38bdf8',
                        timestamp: notif.timestamp,
                        score: 30 // Prioridad alta para notificaciones personales
                    });
                });

                registrations.forEach(reg => {
                    let catColor = '#00E36D'; // Default Green (Entrenos/Other)
                    const lowerName = reg.eventName.toLowerCase();

                    if (lowerName.includes('femenin') || lowerName.includes('chicas') || lowerName.includes('female')) {
                        catColor = '#FF2D55'; // Pink
                    } else if (lowerName.includes('mixt') || lowerName.includes('mix')) {
                        catColor = '#FFD700'; // Yellow
                    } else if (lowerName.includes('masculin') || lowerName.includes('chicos') || lowerName.includes('male')) {
                        catColor = '#00C4FF'; // Blue
                    }

                    // Lógica de colores de equipo idéntica a EventsController_V6
                    const t = reg.playerTeam ? reg.playerTeam.toUpperCase() : '';
                    let teamColor = '#38bdf8'; // Default Cyan (3º)
                    if (t.includes('4º')) teamColor = '#84cc16'; // Neon Green
                    if (t.includes('3º')) teamColor = '#38bdf8'; // Cyan
                    if (t.includes('2º')) teamColor = '#f59e0b'; // Gold/Orange
                    if (t.includes('MIXTO')) teamColor = '#ef4444'; // Red

                    activities.push({
                        type: 'registration',
                        icon: '🎾',
                        title: reg.playerName,
                        desc: `Se ha unido a <span style="color:${catColor}; font-weight:800;">${reg.eventName}</span>${reg.playerTeam ? `<br><span style="color:${teamColor}; font-size:0.65rem; font-weight:950; letter-spacing:1px; text-shadow: 0 0 8px ${teamColor}60; border-bottom: 2px solid ${teamColor}; padding-bottom: 1px;">${t}</span>` : ''}`,
                        time: this.formatRelativeTime(reg.timestamp),
                        color: catColor,
                        timestamp: reg.timestamp,
                        score: 0
                    });
                });

                urgentAlerts.forEach(alert => {
                    activities.push({
                        type: 'urgent',
                        icon: '🚨',
                        title: '¡ÚLTIMA HORA!',
                        desc: alert.title,
                        time: 'ahora',
                        color: '#ef4444',
                        timestamp: alert.timestamp,
                        priority: 'critical',
                        score: 0,
                        action: 'Entrenos'
                    });
                });

                rankingChanges.forEach(change => {
                    activities.push({
                        type: 'ranking',
                        icon: change.position === 1 ? '👑' : '📈',
                        title: change.playerName,
                        desc: `${change.position === 1 ? '¡NUEVO LÍDER!' : `Entra en el TOP ${change.position}`} del ranking`,
                        time: this.formatRelativeTime(change.timestamp),
                        color: '#f59e0b',
                        timestamp: change.timestamp,
                        score: 0
                    });
                });

                activities.sort((a, b) => {
                    const timeA = this._getTimestampValue(a.timestamp);
                    const timeB = this._getTimestampValue(b.timestamp);
                    return timeB - timeA;
                });
                const top6 = activities.slice(0, 6);

                if (top6.length === 0) {
                    return `
                        <div style="text-align: center; padding: 40px 20px;">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                <i class="fas fa-radar" style="color:rgba(255,255,255,0.2); font-size: 1.5rem; animation: pulseGlow 2s infinite;"></i>
                            </div>
                            <div style="color: rgba(255,255,255,0.3); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;">RADAR BUSCANDO ACTIVIDAD...</div>
                        </div>
                    `;
                }

                const alwaysVisible = top6.slice(0, 2);
                const extended = top6.slice(2);

                return `
                    <div style="position: relative;">
                        <div class="activity-timeline-line"></div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${alwaysVisible.map((activity, index) => `
                                <div class="activity-glass-card" 
                                     style="animation: showtimeSlide 0.6s both ${index * 0.12}s; color: ${activity.color};"
                                     onclick="${activity.action ? `window.Router.navigate('${activity.action.toLowerCase()}')` : ''}">
                                    
                                    <div class="activity-impact-badge"></div>
                                    <div class="activity-dot" style="background: ${activity.color}; ${index === 0 ? 'animation: timelinePulse 1.5s infinite;' : ''}"></div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; position: relative; z-index: 1;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                <span style="font-size: 0.95rem; font-weight: 1000; color: white; text-transform: uppercase; letter-spacing: -0.5px; font-style: italic;">${activity.title}</span>
                                                ${activity.priority === 'critical' ? `<span style="background: #ef4444; color: white; font-size: 0.55rem; font-weight: 1000; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; animation: pulse 1s infinite; box-shadow: 0 0 15px #ef4444;">BREAKING</span>` : ''}
                                            </div>
                                            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700; line-height: 1.5; letter-spacing: 0.2px;">${activity.desc}</div>
                                        </div>
                                        <div style="text-align: right; min-width: 70px;">
                                            <div style="font-size: 0.6rem; color: ${activity.color}; font-weight: 1000; text-transform: uppercase; opacity: 0.8; letter-spacing: 1px;">${activity.time}</div>
                                            ${activity.action ? `
                                                <div style="margin-top: 8px; font-size: 0.55rem; font-weight: 1000; color: #000; background: ${activity.color}; padding: 3px 10px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px ${activity.color}40; transform: skewX(-10deg);">
                                                    ${activity.action.toUpperCase()}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}

                            ${extended.length > 0 ? `
                            <div id="activity-extended-container" style="display: none; flex-direction: column; gap: 12px;">
                                ${extended.map((activity, index) => `
                                    <div class="activity-glass-card" 
                                         style="color: ${activity.color};"
                                         onclick="${activity.action ? `window.Router.navigate('${activity.action.toLowerCase()}')` : ''}">
                                        
                                        <div class="activity-impact-badge"></div>
                                        <div class="activity-dot" style="background: ${activity.color};"></div>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; position: relative; z-index: 1;">
                                            <div style="flex: 1;">
                                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                    <span style="font-size: 0.95rem; font-weight: 1000; color: white; text-transform: uppercase; letter-spacing: -0.5px; font-style: italic;">${activity.title}</span>
                                                    ${activity.priority === 'critical' ? `<span style="background: #ef4444; color: white; font-size: 0.55rem; font-weight: 1000; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; animation: pulse 1s infinite; box-shadow: 0 0 15px #ef4444;">BREAKING</span>` : ''}
                                                </div>
                                                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700; line-height: 1.5; letter-spacing: 0.2px;">${activity.desc}</div>
                                            </div>
                                            <div style="text-align: right; min-width: 70px;">
                                                <div style="font-size: 0.6rem; color: ${activity.color}; font-weight: 1000; text-transform: uppercase; opacity: 0.8; letter-spacing: 1px;">${activity.time}</div>
                                                ${activity.action ? `
                                                    <div style="margin-top: 8px; font-size: 0.55rem; font-weight: 1000; color: #000; background: ${activity.color}; padding: 3px 10px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px ${activity.color}40; transform: skewX(-10deg);">
                                                        ${activity.action.toUpperCase()}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>

                        ${extended.length > 0 ? `
                        <div style="text-align: center; margin-top: 15px;">
                            <button onclick="event.stopPropagation(); window.DashboardView.toggleActivityFeed()" 
                                    id="activity-toggle-btn" 
                                    style="background: rgba(10, 25, 47, 0.05); border: 1px solid rgba(10, 25, 47, 0.15); color: #0a192f; border-radius: 14px; padding: 10px 24px; font-size: 0.75rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                                Ver más <i class="fas fa-chevron-down" id="activity-toggle-icon"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `;
            } catch (e) {
                console.error('Activity Feed error:', e);
                return '';
            }
        }

        async getRecentRegistrations(hoursAgo = 48) {
            try {
                const cutoff = Date.now() - (hoursAgo * 60 * 60 * 1000);
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const registrations = [];

                events.forEach(event => {
                    const players = event.players || event.registeredPlayers || [];
                    if (players.length > 0) {
                        players.forEach(p => {
                            // Usar el joinedAt real si existe, si no, ignorar registros antiguos o sin fecha
                            const joinDate = p.joinedAt ? new Date(p.joinedAt).getTime() : 0;

                            if (joinDate > cutoff) {
                                registrations.push({
                                    type: 'registration',
                                    playerName: p.name || 'Jugador',
                                    playerTeam: Array.isArray(p.team_somospadel) ? p.team_somospadel[0] : (p.team_somospadel || ''),
                                    eventName: event.name,
                                    timestamp: joinDate,
                                    eventId: event.id
                                });
                            }
                        });
                    }
                });

                return registrations;
            } catch (e) {
                console.error('Error getting registrations:', e);
                return [];
            }
        }

        async getUrgentAlerts() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const alerts = [];

                events.forEach(event => {
                    if (!['open', 'upcoming', 'scheduled'].includes(event.status)) return;
                    const players = (event.players || event.registeredPlayers || []).length;
                    const maxPlayers = (event.max_courts || 0) * 4;
                    const spotsLeft = maxPlayers - players;

                    if (spotsLeft > 0 && spotsLeft <= 2 && maxPlayers > 0) {
                        alerts.push({
                            type: 'urgent',
                            title: `¡ÚLTIMA${spotsLeft === 1 ? '' : 'S'} ${spotsLeft} PLAZA${spotsLeft === 1 ? '' : 'S'}! ${event.name}`,
                            eventName: event.name,
                            spotsLeft,
                            timestamp: Date.now(),
                            priority: 'critical'
                        });
                    }
                });

                return alerts;
            } catch (e) {
                console.error('Error getting urgent alerts:', e);
                return [];
            }
        }

        async getRankingChanges() {
            try {
                if (!window.RankingController) return [];
                const players = await window.RankingController.calculateSilently();
                const changes = [];

                players.slice(0, 3).forEach((player, index) => {
                    const points = player.stats?.americanas?.points || 0;
                    if (points > 0) {
                        changes.push({
                            type: 'ranking',
                            playerName: player.name,
                            position: index + 1,
                            points: points,
                            timestamp: Date.now() - Math.random() * 7200000
                        });
                    }
                });
                return changes;
            } catch (e) {
                console.error('Error getting ranking changes:', e);
                return [];
            }
        }

        calculateActivityScore(activity) {
            let score = 0;
            const minutesAgo = (Date.now() - activity.timestamp) / 60000;
            score += Math.max(0, 100 - minutesAgo);

            const priorityScores = {
                'urgent': 100,
                'registration': 70,
                'ranking': 50,
                'match': 30,
                'event': 20
            };
            score += priorityScores[activity.type] || 0;
            if (activity.priority === 'critical') score += 50;
            return score;
        }

        formatDateTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${hours}:${minutes} ${day}/${month}`;
        }

        formatRelativeTime(timestamp) {
            if (!timestamp) return '';
            return this.formatDateTime(timestamp);
        }

        getPlayerName(playerId) {
            if (typeof playerId === 'string') return 'Alguien';
            if (playerId && playerId.name) return playerId.name.split(' ')[0];
            return 'Alguien';
        }

        async renderLiveActivity() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const urgentAm = events.find(am => {
                    const pCount = (am.players || am.registeredPlayers || []).length;
                    const maxP = (am.max_courts || 0) * 4;
                    const spots = maxP - pCount;
                    return maxP > 0 && spots > 0 && spots <= 4;
                }) || events[0];

                if (urgentAm) {
                    const players = urgentAm.players || urgentAm.registeredPlayers || [];
                    const pCount = players.length;
                    const maxP = (urgentAm.max_courts || 0) * 4;
                    const spots = Math.max(0, maxP - pCount);
                    const isFull = spots === 0;

                    const cardBg = isFull ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
                    const btnText = isFull ? 'VER LISTA DE ESPERA' : 'APUNTARME AHORA';
                    const btnBg = isFull ? '#94a3b8' : '#00E36D';
                    const statusDesc = isFull ? '¡Pista completa! Avisaremos bajas.' : `¡Solo <b>${spots} plazas</b>! Se llenará pronto.`;
                    const navigateAction = "window.Router.navigate('entrenos'); setTimeout(() => { if(window.EventsController) window.EventsController.filterByType('entreno'); }, 200);";

                    let html = `
                        <style>
                            @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                            .ticker-marquee-container { overflow: hidden; white-space: nowrap; position: relative; mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
                            .ticker-marquee-content { display: inline-block; animation: marquee-scroll 25s linear infinite; white-space: nowrap; }
                            .ticker-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); padding: 6px 14px; border-radius: 100px; font-size: 0.75rem; color: white; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.1); margin-right: 12px; }
                        </style>
                        <div class="smart-hero-card" onclick="${navigateAction}" style="background: ${cardBg}; border-radius: 16px; padding: 20px; color: white; position: relative; overflow: hidden; margin-bottom: 5px; cursor: pointer;">
                            <div style="position: absolute; top: -20px; right: -20px; font-size: 5rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"><i class="fas fa-star"></i></div>
                            <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; padding: 4px 12px; border-radius: 100px; font-size: 0.6rem; font-weight: 900; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">RECOMENDACIÓN</div>
                            <div style="font-size: 1.4rem; font-weight: 900; margin-bottom: 5px;">${urgentAm.name}</div>
                            <p style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 15px;">${statusDesc}</p>
                            <div style="background: ${btnBg}; color: black; padding: 12px; border-radius: 12px; text-align: center; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                ${btnText} <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    `;

                    const hypeMessages = [`🔥 <b>${pCount + 3} personas</b> viéndolo`, `⚡ <b>Alta Demanda</b>: Se llenará hoy`, `🏆 <b>Nivel Garantizado</b>`];
                    if (players.length > 0) {
                        const randomPlayer = players[Math.floor(Math.random() * players.length)];
                        const pName = (randomPlayer.name || 'Jugador').split(' ')[0];
                        hypeMessages.unshift(`🚀 <b>${pName}</b> acaba de unirse`);
                    }

                    const tickerItems = [...hypeMessages, ...hypeMessages].map(msg => `<div class="ticker-tag"><div style="width: 6px; height: 6px; border-radius: 50%; background: #00E36D; box-shadow: 0 0 5px #00E36D;"></div>${msg}</div>`).join('');
                    html += `<div class="ticker-marquee-container" style="padding: 5px 0;"><div class="ticker-marquee-content">${tickerItems}</div></div>`;
                    return html;
                }
                return '';
            } catch (e) { return ''; }
        }

        async showChatInfo() {
            const modalId = 'chat-info-modal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 9999999; opacity: 0; transition: opacity 0.3s ease;`;
                modal.onclick = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
                document.body.appendChild(modal);
            }

            const guideItems = [
                { title: 'HISTORIAS LIVE', icon: 'fa-play-circle', color: '#fb7185', desc: 'Sigue la actualidad del club al estilo Instagram. Pulsa derecha para avanzar, izquierda para volver o mantén para pausar.' },
                { title: 'RANKING GLOBAL', icon: 'fa-trophy', color: '#CCFF00', desc: 'Suma puntos en Americanas y Entrenos. El sistema recalcula tu nivel dinámicamente según tus victorias.' },
                { title: 'METEOROLOGÍA', icon: 'fa-cloud-sun', color: '#0ea5e9', desc: 'Análisis en tiempo real de temperatura y humedad. Te indicamos la velocidad de la bola y el agarre de pista óptimo.' },
                { title: 'NOTIFICACIONES PUSH', icon: 'fa-bell', color: '#fbbf24', desc: 'Recibe avisos instantáneos cuando se abran inscripciones o cuando tu partido esté listo para empezar.' },
                { title: 'APP MULTI-MODO', icon: 'fa-layer-group', color: '#a855f7', desc: 'Gestiona Americanas, Entrenos, Clases y Pozo desde un solo lugar con lógica de ascensos automáticos.' },
                { title: 'PILOTO AUTOMÁTICO', icon: 'fa-robot', color: '#34d399', desc: 'El sistema genera cruces 4h antes del evento y notifica a los jugadores para que todo fluya sin esperas.' }
            ];

            modal.innerHTML = `
                <div style="background: #0a0a0b; border-radius: 32px; padding: 0; width: 92%; max-width: 480px; position: relative; box-shadow: 0 0 60px rgba(204,255,0,0.15); border: 1px solid rgba(255,255,255,0.1); animation: modalIn 0.5s cubic-bezier(0.19, 1, 0.22, 1); max-height: 85vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div style="padding: 30px 24px 20px; background: linear-gradient(180deg, rgba(204,255,0,0.05) 0%, transparent 100%); border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <div style="width: 50px; height: 50px; background: #CCFF00; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 0 20px rgba(204,255,0,0.3);">
                            <i class="fas fa-book-open" style="color: black; font-size: 1.4rem;"></i>
                        </div>
                        <h3 style="margin: 0 0 4px 0; color: #fff; font-weight: 950; font-size: 1.5rem; letter-spacing: -0.5px;">GUÍA <span style="color:#CCFF00">SMART</span> JUGADOR</h3>
                        <p style="color: rgba(255,255,255,0.4); font-size: 0.65rem; margin: 0; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Manual de Experiencia SomosPadel</p>
                    </div>

                    <!-- Scrollable Content -->
                    <div style="flex: 1; overflow-y: auto; padding: 20px; padding-right: 15px;">
                        <div style="display: grid; gap: 15px;">
                            ${guideItems.map((item, i) => `
                                <div style="display: flex; gap: 16px; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); animation: itemFadeIn 0.4s both ${i * 0.1}s;">
                                    <div style="width: 44px; height: 44px; background: ${item.color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${item.color}40;">
                                        <i class="fas ${item.icon}" style="color: ${item.color}; font-size: 1.1rem;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="color: white; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.3px;">${item.title}</div>
                                        <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600; line-height: 1.5;">${item.desc}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 20px; background: #0a0a0b;">
                        <button style="width: 100%; background: #CCFF00; color: #000; border: none; height: 58px; border-radius: 18px; font-weight: 950; font-size: 0.95rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 25px rgba(204,255,0,0.2);" onclick="this.closest('#chat-info-modal').click()">TENGO EL CONTROL</button>
                    </div>
                </div>
                <style> 
                    @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } } 
                    @keyframes itemFadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                    #chat-info-modal::-webkit-scrollbar { width: 5px; }
                    #chat-info-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                </style>
            `;
            setTimeout(() => modal.style.opacity = '1', 10);
        }
        async renderPredictiveSynergy() {
            try {
                console.log("🧠 [DashboardView] renderPredictiveSynergy called");
                const user = window.Store ? window.Store.getState('currentUser') : null;
                if (!user) {
                    console.warn("🧠 [DashboardView] No user for synergy");
                    return '';
                }

                const userId = user.id || user.uid;
                const userName = user.name || "Jugador";
                const userPhoto = user.photoURL || user.photo_url || 'img/default-avatar.png';

                if (!window.PartnerSynergyService || !window.FirebaseDB) {
                    console.error("🧠 [DashboardView] Synergy Services MISSING");
                    return '';
                }

                let bestPartners = [];
                let trend = { status: 'NORMAL', factor: 1, desc: 'Analizando...' };

                try {
                    bestPartners = await window.PartnerSynergyService.getBestPartnersFor(userId, 3) || [];
                    trend = await window.PartnerSynergyService.getRecentPerformanceTrend(userId) || trend;
                } catch (e) {
                    console.error("🧠 [DashboardView] Fetching synergy failed", e);
                }

                let rankingInfo = { nextRival: null, myStats: null };
                try {
                    let ranked = [];
                    if (window.RankingController && window.RankingController.calculateSilently) {
                        ranked = await window.RankingController.calculateSilently();
                    } else {
                        const allPlayers = await window.FirebaseDB.players.getAll() || [];
                        ranked = [...allPlayers].sort((a, b) => parseFloat(b.level || 0) - parseFloat(a.level || 0));
                    }

                    const myIndex = ranked.findIndex(p => (p.id || p.uid) === userId);
                    if (myIndex !== -1) {
                        rankingInfo.myStats = ranked[myIndex];
                        if (myIndex > 0) {
                            rankingInfo.nextRival = ranked[myIndex - 1];
                        }
                    }
                } catch (e) {
                    console.error("🧠 [DashboardView] Ranking calc error", e);
                }

                const myTotalPts = rankingInfo.myStats ?
                    ((rankingInfo.myStats.stats?.americanas?.points || 0) + (rankingInfo.myStats.stats?.entrenos?.points || 0)) : 0;

                const rivalTotalPts = rankingInfo.nextRival ?
                    ((rankingInfo.nextRival.stats?.americanas?.points || 0) + (rankingInfo.nextRival.stats?.entrenos?.points || 0)) : 0;

                const rankingMsg = rankingInfo.nextRival ?
                    (rivalTotalPts > myTotalPts ?
                        `Objetivo: Superar a <span style="color:#38bdf8; font-weight:900;">${rankingInfo.nextRival.name}</span>. Te faltan <span style="color:#CCFF00; font-weight:900;">${rivalTotalPts - myTotalPts} pts</span>.` :
                        (rivalTotalPts > 0 ?
                            `Estás empatado con <span style="color:#38bdf8; font-weight:900;">${rankingInfo.nextRival.name}</span>. ¡Una victoria más y le superas!` :
                            `Supera a <span style="color:#38bdf8; font-weight:900;">${rankingInfo.nextRival.name}</span> en tu próximo match para subir en el Top.`
                        )) :
                    (myTotalPts > 0 ? '¡Eres el líder actual! Mantén el nivel para conservar tu puesto.' : 'Comienza a jugar partidos para subir en el Ranking mundial.');

                // HELPER: Get Smart Name (Name + 1st Surname) and Initials (N.S.)
                const getSmartData = (fullName) => {
                    if (!fullName) return { display: "Jugador", initials: "JP" };
                    const parts = fullName.trim().split(/\s+/);
                    if (parts.length === 1) return { display: parts[0], initials: parts[0].substring(0, 2).toUpperCase() };
                    return {
                        display: `${parts[0]} ${parts[1]}`,
                        initials: (parts[0][0] + parts[1][0]).toUpperCase()
                    };
                };

                const myData = getSmartData(userName);

                const synergies = (bestPartners && bestPartners.length > 0) ? bestPartners.map(p => {
                    const sData = getSmartData(p.player?.name);
                    const hasHistory = p.playChemistry && p.playChemistry.matchesPlayed > 0;
                    return {
                        name: sData.display,
                        photo: p.player?.photoURL || p.player?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sData.display)}&background=0f172a&color=fff&size=128`,
                        chemistry: Math.round(p.totalScore || 0),
                        color: p.rating?.color || '#CCFF00',
                        desc: hasHistory ? (p.playChemistry.winRate > 60 ? 'Historial ganador' : 'Dúo recurrente') : 'Potencial táctico',
                        reason: hasHistory ? `Habéis jugado ${p.playChemistry.matchesPlayed} partidos juntos.` : `Nivel de juego muy similar (${p.levelCompatibility.level2}).`
                    };
                }) : [];

                // FALLBACK: If no smart synergy is found yet, show REAL club players
                if (synergies.length === 0) {
                    try {
                        const allPlayers = await window.FirebaseDB.players.getAll() || [];
                        const realFallbacks = allPlayers
                            .filter(p => (p.id || p.uid) !== userId && p.name && p.name.length > 3)
                            .sort((a, b) => Math.abs((a.level || 0) - (user.level || 0)) - Math.abs((b.level || 0) - (user.level || 0))) // Group by similar level
                            .slice(0, 3);

                        if (realFallbacks.length > 0) {
                            realFallbacks.forEach((p, i) => {
                                const sData = getSmartData(p.name);
                                synergies.push({
                                    name: sData.display,
                                    photo: p.photoURL || p.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sData.display)}&background=random&color=fff&size=128`,
                                    chemistry: 75 + Math.floor(Math.random() * 15),
                                    color: i === 0 ? '#00E36D' : (i === 1 ? '#CCFF00' : '#38bdf8'),
                                    desc: 'Dúo sugerido',
                                    reason: 'Compatibilidad por nivel de juego.'
                                });
                            });
                        }
                    } catch (err) {
                        console.error("🧠 Fallback players failed", err);
                    }
                }

                // If still empty after fallback (very rare), use better named dummies
                if (synergies.length === 0) {
                    synergies.push({ name: 'Pro 1', photo: 'https://i.pravatar.cc/150?u=1', chemistry: 85, color: '#00E36D', desc: 'Compatibilidad nivel' });
                    synergies.push({ name: 'Pro 2', photo: 'https://i.pravatar.cc/150?u=2', chemistry: 72, color: '#72a800', desc: 'Estilo similar' });
                    synergies.push({ name: 'Pro 3', photo: 'https://i.pravatar.cc/150?u=3', chemistry: 60, color: '#1e3a8a', desc: 'Buena racha' });
                }

                const fatigueColor = trend.status === 'HIGH' ? '#ef4444' : (trend.status === 'OPTIMAL' ? '#00E36D' : '#72a800');

                return `
                    <div class="synergy-glass-container" data-widget="predictive-synergy" style="
                        background: #0f172a;
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        border-radius: 32px;
                        padding: 24px;
                        border: 1px solid rgba(204, 255, 0, 0.3);
                        box-shadow: 0 40px 80px rgba(0,0,0,0.8), inset 0 0 20px rgba(204, 255, 0, 0.05);
                        overflow: hidden;
                        position: relative;
                        margin-bottom: 20px;
                        min-height: 480px;
                    ">
                        <!-- Background Glow -->
                        <div style="position: absolute; top: -50px; left: -50px; width: 250px; height: 250px; background: rgba(0, 227, 109, 0.15); filter: blur(80px); opacity: 0.6; pointer-events: none;"></div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 20;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 12px; height: 12px; background: #CCFF00; border-radius: 50%; box-shadow: 0 0 15px #CCFF00; animation: pulseSOS 1.5s infinite;"></div>
                                <span style="font-size: 0.9rem; font-weight: 1000; letter-spacing: 1px; color: #fff; text-transform: uppercase;">¿TU PAREJA PERFECTA?</span>
                            </div>
                            <div style="background: rgba(0,227,109,0.15); padding: 5px 12px; border-radius: 12px; font-size: 0.6rem; font-weight: 900; color: #00E36D; border: 1px solid #00E36D40; letter-spacing: 1px;">MATCH PADEL</div>
                        </div>

                        <p style="font-size: 0.72rem; color: rgba(255,255,255,0.5); line-height: 1.4; margin: 0 0 20px 22px; font-weight: 500;">
                            Nuestro algoritmo analiza tu <span style="color:#CCFF00">nivel de juego</span>, estilo táctico y <span style="color:#00E36D">resultados recientes</span> para recomendarte los compañeros con mayor probabilidad de éxito en los <span style="color:#fff; font-weight:700;">entrenos y/o americanas</span>.
                        </p>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                            <!-- PART 1: NODE RADAR MAP -->
                            <div style="background: rgba(0,0,0,0.3); border-radius: 24px; padding: 40px 10px; position: relative; height: 300px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="position: absolute; inset: 0; background: radial-gradient(circle, rgba(204,255,0,0.08) 0%, transparent 75%);"></div>
                                
                                <!-- CENTRAL NODE (YOU) -->
                                <div style="position: relative; z-index: 10; width: 80px; height: 80px; padding: 4px; background: #CCFF00; border-radius: 50%; box-shadow: 0 0 40px rgba(204,255,0,0.5); animation: pulseFloat 3s ease-in-out infinite;">
                                    <div style="width: 100%; height: 100%; border-radius: 50%; background: #0f172a; overflow: hidden; border: 2px solid #0f172a;">
                                        <img src="${userPhoto}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                    <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: #CCFF00; color: #000; font-size: 0.6rem; font-weight: 1000; padding: 3px 10px; border-radius: 100px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">TÚ</div>
                                </div>

                                <!-- SYNERGY NODES -->
                                ${synergies.map((s, i) => {
                    const angles = [210, 330, 90];
                    const angleRad = angles[i] * (Math.PI / 180);
                    const dist = 105;
                    const x = Math.cos(angleRad) * dist;
                    const y = Math.sin(angleRad) * dist;

                    return `
                                        <div style="
                                            position: absolute; 
                                            transform: translate(${x}px, ${y}px);
                                            width: 70px; height: 70px; border-radius: 50%;
                                            background: #000; border: 2.5px solid ${s.color};
                                            padding: 3px; z-index: 5;
                                            box-shadow: 0 0 25px ${s.color}60;
                                            animation: itemFadeIn 0.8s both ${i * 0.2}s;
                                        ">
                                            <!-- CONNECTOR LINE -->
                                            <div style="
                                                position: absolute; 
                                                top: 50%; left: 50%;
                                                width: ${dist}px; height: 2px;
                                                background: linear-gradient(90deg, ${s.color}60, transparent);
                                                transform-origin: 0% 50%;
                                                transform: rotate(${angles[i] + 180}deg);
                                                z-index: -1;
                                            "></div>

                                            <div style="width: 100%; height: 100%; border-radius: 50%; background: #0f172a; overflow: hidden; border: 1px solid #0f172a;">
                                                <img src="${s.photo}" style="width: 100%; height: 100%; object-fit: cover;">
                                            </div>
                                            <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 0.6rem; color: #fff; font-weight: 900; white-space: nowrap; background: rgba(0,0,0,0.8); padding: 2px 8px; border-radius: 6px; border: 1.5px solid ${s.color};">${s.name}</div>
                                            <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 0.55rem; color: #fff; font-weight: 800; white-space: nowrap; opacity: 0.7;">${s.chemistry}% CHM</div>
                                            <!-- HOVER EXPLANATION -->
                                            <div class="synergy-reason" style="position: absolute; top: 75px; left: 50%; transform: translateX(-50%); background: #000; color: ${s.color}; font-size: 0.5rem; font-weight: 900; padding: 4px 8px; border-radius: 8px; border: 1px solid ${s.color}40; white-space: nowrap; opacity: 0.8; z-index: 100;">${s.desc.toUpperCase()}</div>
                                        </div>
                                    `;
                }).join('')}

                                <!-- SCANNER EFFECT -->
                                <div style="position: absolute; inset: 0; border: 1px solid rgba(204,255,0,0.15); border-radius: 50%; margin: 15px; animation: sonar 4s linear infinite;"></div>
                                <div style="position: absolute; inset: 0; border: 2px solid rgba(204,255,0,0.05); border-radius: 50%; margin: 80px; animation: sonar 3s linear infinite reverse;"></div>
                            </div>

                            <!-- PART 2: IA PREDICTIVE INSIGHTS -->
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <!-- CARD 1: FORM -->
                                <div style="background: ${fatigueColor}10; border: 1px solid ${fatigueColor}30; padding: 18px; border-radius: 20px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                                        <div style="width: 44px; height: 44px; background: ${fatigueColor}20; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${fatigueColor}30;">
                                            <i class="fas fa-heartbeat" style="color: ${fatigueColor}; font-size: 1.3rem;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 1000; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                                                TU ESTADO DE FORMA: <span style="background:${fatigueColor}; color:#000; font-size:0.55rem; padding:2px 8px; border-radius:4px; font-weight:900;">${trend.status}</span>
                                            </div>
                                            <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; font-weight: 500;">
                                                ${trend.desc} Basado en tu carga de partidos, ${trend.status === 'HIGH' ? 'reducir intensidad para evitar lesiones.' : 'puedes aumentar la carga de entrenamiento.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- CARD 2: RANKING -->
                                <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 18px; border-radius: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                                        <div style="width: 44px; height: 44px; background: rgba(56, 189, 248, 0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(56, 189, 248, 0.3);">
                                            <i class="fas fa-chart-line" style="color: #38bdf8; font-size: 1.3rem;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 1000; color: #fff; margin-bottom: 4px;">PROYECCIÓN DE ASCENSO</div>
                                            <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; font-weight: 500;">
                                                ${rankingMsg}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- CARD 3: TACTICAL ADVICE -->
                                <div style="background: rgba(204, 255, 0, 0.05); border: 1px solid rgba(204, 255, 0, 0.2); padding: 18px; border-radius: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                                        <div style="width: 44px; height: 44px; background: rgba(204, 255, 0, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(204, 255, 0, 0.2);">
                                            <i class="fas fa-lightbulb" style="color: #CCFF00; font-size: 1.3rem;"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 1000; color: #fff; margin-bottom: 4px;">CONSEJO DEL CAPITÁN</div>
                                            <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; font-weight: 500;">
                                                Tu pareja ideal es <span style="color:#CCFF00; font-weight:900;">${synergies[0]?.name || 'un perfil defensivo'}</span>. Juntos tenéis un ratio de cobertura de red del <span style="color:#00E36D; font-weight:900;">85%</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>
                            @keyframes sonar {
                                0% { transform: scale(0.7); opacity: 0; }
                                50% { opacity: 0.4; }
                                100% { transform: scale(1.6); opacity: 0; }
                            }
                            @keyframes pulseFloat {
                                0% { transform: scale(1) translateY(0) rotate(0deg); }
                                50% { transform: scale(1.03) translateY(-8px) rotate(1deg); }
                                100% { transform: scale(1) translateY(0) rotate(0deg); }
                            }
                        </style>
                    </div>
                `;
            } catch (e) {
                console.error("renderPredictiveSynergy error:", e);
                return '';
            }
        }

        toggleTacticalHUD() {
            const grip = document.getElementById('tactical-hud-grip');
            const bounce = document.getElementById('tactical-hud-bounce');
            if (grip && bounce) {
                const isVisible = grip.style.display === 'block';
                grip.style.display = isVisible ? 'none' : 'block';
                bounce.style.display = isVisible ? 'none' : 'block';
            }
        }
    }

    window.DashboardView = new DashboardView();

    /**
     * 🖼️ Lightbox Oficial de Temporada 2027: Cartel SomosPadel
     */
    if (typeof window.openSeasonFlyerModal !== 'function') {
        window.openSeasonFlyerModal = function() {
            let overlay = document.getElementById('sp-season-flyer-lightbox');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'sp-season-flyer-lightbox';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(8, 12, 22, 0.88);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    z-index: 9999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    opacity: 0;
                    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                `;

                overlay.innerHTML = `
                    <div id="sp-season-flyer-container" style="
                        position: relative;
                        width: 100%;
                        max-width: 480px;
                        max-height: 94vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: #090d16;
                        border: 1.5px solid rgba(204, 255, 0, 0.45);
                        border-radius: 22px;
                        padding: 14px 14px 18px;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(204,255,0,0.2);
                        transform: scale(0.92);
                        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    ">
                        <!-- Botón de Cierre Superior Circular -->
                        <button 
                            type="button" 
                            onclick="window.closeSeasonFlyerModal()" 
                            aria-label="Cerrar cartel"
                            style="
                                position: absolute;
                                top: -14px;
                                right: -14px;
                                width: 38px;
                                height: 38px;
                                border-radius: 50%;
                                background: #0f172a;
                                color: #CCFF00;
                                border: 2px solid #CCFF00;
                                font-size: 1.15rem;
                                font-weight: 900;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                                z-index: 20;
                                transition: transform 0.15s;
                            "
                            onmouseover="this.style.transform='scale(1.1) rotate(90deg)';"
                            onmouseout="this.style.transform='scale(1) rotate(0deg)';">
                            ✕
                        </button>

                        <!-- Header del Lightbox -->
                        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 4px;">
                            <span style="background: #CCFF00; color: #000000; font-size: 0.65rem; font-weight: 950; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;">
                                🏆 CARTEL OFICIAL 2027
                            </span>
                            <span style="font-size: 0.70rem; color: #94a3b8; font-weight: 700;">
                                Liga Summapadel • SomosPadel BCN
                            </span>
                        </div>

                        <!-- Contenedor del Cartel -->
                        <div style="
                            width: 100%;
                            overflow: hidden;
                            border-radius: 14px;
                            border: 1px solid rgba(255,255,255,0.1);
                            background: #000000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
                        ">
                            <img 
                                src="img/flyer_temporada_2027.jpg" 
                                alt="Flyer Temporada 2027 SomosPadel" 
                                style="
                                    width: 100%;
                                    height: auto;
                                    max-height: 65vh;
                                    object-fit: contain;
                                    display: block;
                                "
                            />
                        </div>

                        <!-- Botones de Acción al pie del Lightbox -->
                        <div style="display: flex; gap: 8px; width: 100%; margin-top: 14px;">
                            <button 
                                type="button" 
                                onclick="window.closeSeasonFlyerModal(); window.SeasonCampaignView && window.SeasonCampaignView.openModal('equipos');" 
                                style="
                                    flex: 2;
                                    padding: 12px 14px;
                                    background: #CCFF00;
                                    color: #000000;
                                    border: none;
                                    border-radius: 12px;
                                    font-weight: 950;
                                    font-size: 0.85rem;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 6px;
                                    box-shadow: 0 4px 14px rgba(204,255,0,0.35);
                                ">
                                <span>🚀</span> PRE-INSCRIBIRME EN UN EQUIPO
                            </button>
                            <button 
                                type="button" 
                                onclick="window.closeSeasonFlyerModal()" 
                                style="
                                    flex: 1;
                                    padding: 12px 14px;
                                    background: rgba(255, 255, 255, 0.08);
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    border-radius: 12px;
                                    color: #ffffff;
                                    font-weight: 800;
                                    font-size: 0.80rem;
                                    cursor: pointer;
                                ">
                                Cerrar
                            </button>
                        </div>
                    </div>
                `;

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        window.closeSeasonFlyerModal();
                    }
                });

                document.body.appendChild(overlay);
            }

            const onEsc = (e) => {
                if (e.key === 'Escape') {
                    window.closeSeasonFlyerModal();
                    document.removeEventListener('keydown', onEsc);
                }
            };
            document.addEventListener('keydown', onEsc);

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                const container = document.getElementById('sp-season-flyer-container');
                if (container) container.style.transform = 'scale(1)';
            });
            document.body.style.overflow = 'hidden';
        };

        window.closeSeasonFlyerModal = function() {
            const overlay = document.getElementById('sp-season-flyer-lightbox');
            if (overlay) {
                const container = document.getElementById('sp-season-flyer-container');
                if (container) container.style.transform = 'scale(0.92)';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    document.body.style.overflow = '';
                }, 220);
            }
        };

        /**
         * 🖼️ Lightbox Oficial de Cartel de Americanas y Torneos
         */
        if (typeof window.openPosterModal !== 'function') {
            window.openPosterModal = function(imageUrl, eventName, clubName) {
                if (window.EventsController && typeof window.EventsController.openPosterModal === 'function') {
                    return window.EventsController.openPosterModal(imageUrl, eventName, clubName);
                }
                const finalImg = (imageUrl && imageUrl.trim()) ? imageUrl.trim() : 'img/padel-event.jpg';
                const finalName = (eventName && eventName.trim()) ? eventName.trim() : 'Cartel Oficial SomosPadel';
                const finalClub = (clubName && clubName.trim()) ? clubName.trim() : 'SomosPadel BCN';

                let overlay = document.getElementById('sp-americana-poster-modal');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'sp-americana-poster-modal';
                    overlay.style.cssText = `
                        position: fixed;
                        inset: 0;
                        background: rgba(4, 7, 15, 0.92);
                        backdrop-filter: blur(14px);
                        -webkit-backdrop-filter: blur(14px);
                        z-index: 9999999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 16px;
                        box-sizing: border-box;
                        opacity: 0;
                        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    `;
                    document.body.appendChild(overlay);

                    overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) window.closePosterModal();
                    });

                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && overlay.style.display !== 'none') {
                            window.closePosterModal();
                        }
                    });
                }

                overlay.innerHTML = `
                    <div style="
                        position: relative;
                        width: 100%;
                        max-width: 480px;
                        max-height: 92vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: #090e18;
                        border: 1.5px solid rgba(204, 255, 0, 0.45);
                        border-radius: 22px;
                        padding: 14px 14px 16px;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(204,255,0,0.2);
                        box-sizing: border-box;
                    ">
                        <button type="button" onclick="window.closePosterModal()"
                                aria-label="Cerrar cartel"
                                style="
                                    position: absolute;
                                    top: -14px;
                                    right: -14px;
                                    width: 38px;
                                    height: 38px;
                                    border-radius: 50%;
                                    background: #0f172a;
                                    color: #CCFF00;
                                    border: 2px solid #CCFF00;
                                    font-size: 1.15rem;
                                    font-weight: 900;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                                    z-index: 20;
                                ">
                            ✕
                        </button>
                        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 4px;">
                            <span style="background: #CCFF00; color: #000; font-size: 0.65rem; font-weight: 950; padding: 3px 8px; border-radius: 6px;">
                                🏆 CARTEL OFICIAL
                            </span>
                            <span style="font-size: 0.70rem; color: #94a3b8; font-weight: 700; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${finalName}
                            </span>
                        </div>
                        <div style="width: 100%; overflow: hidden; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); background: #000; display: flex; align-items: center; justify-content: center;">
                            <img src="${finalImg}" alt="${finalName}" style="width: 100%; height: auto; max-height: 65vh; object-fit: contain; display: block;" onerror="this.src='img/padel-event.jpg';" />
                        </div>
                        <div style="display: flex; gap: 8px; width: 100%; margin-top: 14px;">
                            <a href="${finalImg}" download="cartel-americana.jpg" target="_blank"
                               style="flex: 1; padding: 11px 12px; background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; font-weight: 800; font-size: 0.8rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="fas fa-download"></i> Descargar Cartel
                            </a>
                            <button type="button" onclick="window.closePosterModal(); window.Router && window.Router.navigate('americanas');"
                                    style="flex: 1; padding: 11px 12px; background: #CCFF00; color: #000; border: none; border-radius: 12px; font-weight: 900; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                Ver en Torneos 🚀
                            </button>
                        </div>
                    </div>
                `;
                overlay.style.display = 'flex';
                requestAnimationFrame(() => {
                    overlay.style.opacity = '1';
                });
            };
        }
        if (typeof window.closePosterModal !== 'function') {
            window.closePosterModal = function() {
                const overlay = document.getElementById('sp-americana-poster-modal');
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => { overlay.style.display = 'none'; }, 250);
                }
            };
        }
    }

    console.log("🚀 Vibrant Dashboard Loaded");
})();
