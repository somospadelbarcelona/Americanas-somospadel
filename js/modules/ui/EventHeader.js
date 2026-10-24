/**
 * EventHeader.js
 * Extracted UI logic for rendering the tournament header and sub-navigation.
 * SomosPadel BCN - Pro Sports Edition
 */
(function () {
    window.EventHeader = {
        render(americanaDoc, options = {}) {
            const { activeTab, isPlayingHere } = options;
            const amName = americanaDoc ? americanaDoc.name : "Americana Activa";
            const isEntreno = !!americanaDoc?.isEntreno;
            const isFemale = (americanaDoc?.category === 'female');
            const isMixed = (americanaDoc?.category === 'mixed');
            const isMale = (americanaDoc?.category === 'male');

            const categoryLabel = isMale ? 'MASCULINO' : isFemale ? 'FEMENINO' : isMixed ? 'MIXTO' : 'CATEGORÍA OPEN';
            const categoryEmoji = isFemale ? '♀️' : isMale ? '♂️' : isMixed ? '👥' : '🎾';

            // Theme dinámico de alta fidelidad deportiva
            const heroBg = isEntreno 
                ? 'linear-gradient(145deg, #0a0f1d 0%, #172033 50%, #1e1b4b 100%)' 
                : 'linear-gradient(145deg, #042f2e 0%, #064e3b 50%, #0f172a 100%)';
            const heroAccent = isEntreno ? '#a855f7' : '#ccff00';
            const heroAccentText = isEntreno ? '#d8b4fe' : '#ccff00';

            // Modo de juego: PAREJA FIJA, TWISTER o SUIZO
            const isSwissEvent = !!(americanaDoc?.pair_mode === 'swiss' || (americanaDoc?.name || '').toUpperCase().includes('SUIZ'));
            const isFixedEvent = !isSwissEvent && !!(americanaDoc?.is_fija || (americanaDoc?.pair_mode || '').toLowerCase().includes('fix') || (americanaDoc?.name || '').toUpperCase().includes('FIJA'));
            const eventBadgeLabel = isSwissEvent ? 'SUIZO' : (isFixedEvent ? 'PAREJA FIJA' : 'TWISTER');

            // Cartel Oficial del Torneo
            const rawPosterUrl = americanaDoc?.image_url || americanaDoc?.imageUrl || americanaDoc?.poster_url || '';
            const hasCustomPoster = !!(rawPosterUrl && rawPosterUrl.trim() && !rawPosterUrl.includes('logo_somospadel.png'));
            const displayImg = hasCustomPoster ? rawPosterUrl.trim() : 'img/logo_somospadel.png';
            const safePosterUrl = (displayImg).replace(/'/g, "\\'");
            const safeAmName = (amName || '').replace(/'/g, "\\'");
            const safeSede = (americanaDoc?.sede || americanaDoc?.location || americanaDoc?.club || '').replace(/'/g, "\\'");
            const eventDate = americanaDoc?.date || 'Fecha por confirmar';
            const eventTime = americanaDoc?.time || americanaDoc?.horario || americanaDoc?.schedule || '';
            const eventSede = americanaDoc?.sede || americanaDoc?.location || americanaDoc?.club || '';

            return `
                <div class="tour-header-context" style="background: ${heroBg}; padding: 22px 16px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; color: #ffffff;">
                    <!-- Ambient dynamic glows -->
                    <div style="position: absolute; top: -70px; left: 50%; transform: translateX(-50%); width: 280px; height: 170px; background: ${isEntreno ? 'rgba(168, 85, 247, 0.22)' : 'rgba(204, 255, 0, 0.18)'}; filter: blur(75px); border-radius: 50%; pointer-events: none;"></div>
                    <div style="position: absolute; bottom: -40px; right: -20px; width: 150px; height: 150px; background: rgba(0, 227, 109, 0.12); filter: blur(55px); border-radius: 50%; pointer-events: none;"></div>

                    <!-- Top Action Bar (Modalidad + Acciones Rápidas) -->
                    <div class="tour-header-action-bar" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 14px; position: relative; z-index: 10; width: 100%; min-width: 0;">
                        <!-- Event Badge Tag -->
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.14); padding: 6px 13px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); flex-shrink: 0;">
                            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${heroAccent}; box-shadow: 0 0 10px ${heroAccent};"></span>
                            <span style="font-size: 0.68rem; font-weight: 950; letter-spacing: 0.8px; text-transform: uppercase; color: ${heroAccentText};">
                                ${eventBadgeLabel}
                            </span>
                        </div>

                        <!-- Action Buttons Pill Grid (Carrusel con scroll táctil suave) -->
                        <div class="tour-header-action-grid" style="display: flex; gap: 8px; align-items: center; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; flex: 1; min-width: 0; padding-right: 14px;">
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.openEventSummaryFlyer() : window.openSessionFlyer('${americanaDoc?.id}')" 
                                    title="Ver resumen y flyer de clasificación para compartir en WhatsApp e Instagram"
                                    style="background: linear-gradient(135deg, rgba(204, 255, 0, 0.22) 0%, rgba(204, 255, 0, 0.08) 100%); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #CCFF00; padding: 7px 12px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(204, 255, 0, 0.45); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(204,255,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.75rem;"></i>
                                <span>FLYER / PODIO</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.openChronicleAI() : (window.TournamentChronicleModal?.open())" 
                                    title="Crónica Épica de la Jornada con IA"
                                    style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(204, 255, 0, 0.12) 100%); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #CCFF00; padding: 7px 12px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(139, 92, 246, 0.5); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(139,92,246,0.2); flex-shrink: 0; white-space: nowrap;">
                                <span>✨</span>
                                <span>CRÓNICA ÉPICA</span>
                            </button>
                            <button type="button" 
                                    onclick="window.ChatView?.openEventChat({ id: '${americanaDoc?.id}', name: '${(americanaDoc?.name || '').replace(/'/g, "\\'")}', date: '${americanaDoc?.date || ''}', category: '${americanaDoc?.category || ''}', club: '${(americanaDoc?.sede || americanaDoc?.location || americanaDoc?.club || '').replace(/'/g, "\\'")}', type: '${isEntreno ? 'entreno' : 'americana'}' })"
                                    title="Chat en vivo de los participantes"
                                    style="background: linear-gradient(135deg, rgba(204, 255, 0, 0.18) 0%, rgba(15, 23, 42, 0.8) 100%); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #CCFF00; padding: 7px 12px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; cursor: pointer; border: 1.5px solid #CCFF00; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(204,255,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-comment-dots" style="color: #CCFF00; font-size: 0.75rem;"></i>
                                <span>CHAT DEL EVENTO</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.switchTab('live_feed') : window.openTVMode('${americanaDoc?.id}', '${isEntreno ? 'entreno' : 'americana'}')" 
                                    title="Abrir Centro en Vivo y Minuto a Minuto"
                                    style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 12px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-broadcast-tower" style="color: #ef4444; font-size: 0.75rem;"></i>
                                <span>EN VIVO / TV</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView.replayShuffleAnimation()" 
                                    title="Repetir animación de sorteo"
                                    style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 12px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-random" style="color: ${heroAccent}; font-size: 0.75rem;"></i>
                                <span>SORTEO</span>
                            </button>
                        </div>
                    </div>

                    <!-- Live User Playing Banner -->
                    ${isPlayingHere ? `
                        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.18); border: 1px solid rgba(74, 222, 128, 0.45); color: #86efac; padding: 6px 16px; border-radius: 30px; font-size: 0.7rem; font-weight: 950; margin-bottom: 14px; letter-spacing: 0.8px; text-transform: uppercase; box-shadow: 0 0 20px rgba(34, 197, 94, 0.25);">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; animation: livePulseDot 1.5s infinite;"></span>
                            ESTÁS CONVOCADO EN ESTE EVENTO ★
                        </div>
                    ` : ''}

                    <!-- Center Hero Info: Cartel Protagonista + Info (Modo Responsive Híbrido Pro) -->
                    <div class="center-hero-container" style="display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2; width: 100%;">
                        ${hasCustomPoster ? `
                            <!-- Póster Vertical Deportivo Pro Prominente -->
                            <div class="event-poster-wrapper" 
                                 onclick="window.EventHeader.openPosterModal('${safePosterUrl}', '${safeAmName}', '${safeSede}')"
                                 title="Toca para ver el cartel oficial en pantalla completa"
                                 style="position: relative; display: inline-block; cursor: pointer; max-width: 92%; transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);">
                                
                                <!-- Halo luminoso envolvente reactivo -->
                                <div style="position: absolute; inset: -4px; border-radius: 20px; background: linear-gradient(135deg, ${heroAccent} 0%, rgba(0, 227, 109, 0.6) 100%); filter: blur(14px); opacity: 0.45; transition: opacity 0.3s ease; pointer-events: none;"></div>

                                <!-- Marco principal del cartel con elevación premium -->
                                <div class="event-poster-card" style="position: relative; z-index: 2; border-radius: 16px; overflow: hidden; border: 2px solid rgba(255, 255, 255, 0.25); box-shadow: 0 18px 40px rgba(0,0,0,0.6), 0 0 28px ${isEntreno ? 'rgba(168, 85, 247, 0.25)' : 'rgba(204, 255, 0, 0.2)'}; background: #0b1120; line-height: 0;">
                                    <img src="${displayImg}" 
                                         alt="${amName}" 
                                         class="event-poster-image"
                                         style="display: block; width: auto; max-width: 240px; max-height: clamp(230px, 42vh, 310px); min-height: 180px; object-fit: contain; margin: 0 auto; transition: transform 0.3s ease;"
                                         onerror="this.src='img/logo_somospadel.png'; this.style.maxHeight='140px';">

                                    <!-- Gradiente sutil inferior -->
                                    <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 40%); pointer-events: none;"></div>

                                    <!-- Badge Categoría superior izquierda -->
                                    <div class="poster-cat-badge" style="position: absolute; top: 8px; left: 8px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.22); border-radius: 10px; padding: 4px 8px; font-size: 0.66rem; font-weight: 900; color: #ffffff; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); pointer-events: none;">
                                        <span>${categoryEmoji}</span>
                                        <span>${categoryLabel}</span>
                                    </div>

                                    <!-- Botón flotante para ampliar en pantalla completa -->
                                    <div class="poster-expand-badge" style="position: absolute; bottom: 8px; right: 8px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); border-radius: 16px; padding: 4px 10px; font-size: 0.65rem; font-weight: 900; color: #ffffff; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: all 0.2s;">
                                        <i class="fas fa-expand-arrows-alt" style="color: ${heroAccent}; font-size: 0.68rem;"></i>
                                        <span style="letter-spacing: 0.3px;">AMPLIAR CARTEL</span>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <!-- Escudo Deportivo Pro (cuando no hay cartel personalizado) -->
                            <div class="event-poster-wrapper" style="position: relative; display: inline-block;">
                                <div style="position: absolute; inset: -3px; border-radius: 24px; background: linear-gradient(135deg, ${heroAccent} 0%, #00e36d 100%); filter: blur(10px); opacity: 0.45; pointer-events: none;"></div>
                                <div class="event-poster-card" style="position: relative; z-index: 2; width: 110px; height: 110px; border-radius: 20px; background: rgba(15, 23, 42, 0.92); border: 2px solid rgba(255, 255, 255, 0.25); display: flex; align-items: center; justify-content: center; padding: 12px; box-shadow: 0 16px 36px rgba(0,0,0,0.5);">
                                    <img src="img/logo_somospadel.png" 
                                         alt="SomosPadel Logo" 
                                         class="event-poster-image"
                                         style="width: 100%; height: 100%; object-fit: contain;">
                                </div>
                                <div style="position: absolute; bottom: -4px; right: -4px; background: #ffffff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); z-index: 3; border: 2px solid #0f172a;">
                                    <span style="font-size: 0.9rem; line-height: 1;">${categoryEmoji}</span>
                                </div>
                            </div>
                        `}

                        <!-- Título y Píldoras de Información de Alta Legibilidad -->
                        <div class="hero-details-column" style="display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 94%;">
                            <h1 style="color: #ffffff; margin: 0; font-family: 'Outfit', sans-serif; font-weight: 1000; font-size: clamp(1.25rem, 4vw, 1.55rem); letter-spacing: -0.5px; line-height: 1.25; text-shadow: 0 2px 14px rgba(0,0,0,0.6);">
                                ${amName.toUpperCase()}
                            </h1>
                            <div class="hero-chips-row" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; max-width: 600px;">
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.14); font-size: 0.72rem; font-weight: 800; color: #ffffff;">
                                    <i class="fas fa-calendar-alt" style="color: ${heroAccent}; font-size: 0.72rem;"></i>
                                    <span>${eventDate}</span>
                                </div>
                                ${eventTime ? `
                                    <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.14); font-size: 0.72rem; font-weight: 800; color: #ffffff;">
                                        <i class="fas fa-clock" style="color: ${heroAccent}; font-size: 0.72rem;"></i>
                                        <span>${eventTime}</span>
                                    </div>
                                ` : ''}
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.14); font-size: 0.72rem; font-weight: 800; color: #ffffff;">
                                    <span>${categoryEmoji}</span>
                                    <span>${categoryLabel}</span>
                                </div>
                                ${eventSede ? `
                                    <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.14); font-size: 0.72rem; font-weight: 800; color: #e2e8f0;">
                                        <i class="fas fa-map-marker-alt" style="color: #38bdf8; font-size: 0.72rem;"></i>
                                        <span>${eventSede}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sub Navigation Bar (RESULTADOS | POSICIONES | RESUMEN) -->
                <div class="tour-sub-nav" style="background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 8px 10px; display: flex; gap: 5px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 50px; z-index: 1001; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow-x: auto; scrollbar-width: none;">
                    <button class="tour-subnav-btn ${activeTab === 'results' ? 'active' : ''}" 
                            onclick="window.ControlTowerView.switchTab('results')"
                            style="${activeTab === 'results' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                        <i class="fas fa-clipboard-check" style="${activeTab === 'results' ? `color: ${heroAccent};` : ''}"></i>
                        <span>RESULTADOS</span>
                    </button>
                    ${americanaDoc?.status !== 'scheduled' ? `
                        <button class="tour-subnav-btn ${activeTab === 'standings' ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('standings')"
                                style="${activeTab === 'standings' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-trophy" style="${activeTab === 'standings' ? 'color: #fbbf24;' : ''}"></i>
                            <span>POSICIONES</span>
                        </button>
                        <button class="tour-subnav-btn ${(activeTab === 'resumen' || activeTab === 'summary' || activeTab === 'stats') ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('resumen')"
                                style="${(activeTab === 'resumen' || activeTab === 'summary' || activeTab === 'stats') ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-chart-line" style="${(activeTab === 'resumen' || activeTab === 'summary' || activeTab === 'stats') ? 'color: #10b981;' : ''}"></i>
                            <span>RESUMEN</span>
                        </button>
                    ` : ''}
                </div>

                <style>
                    .tour-sub-nav::-webkit-scrollbar { display: none; }
                    .tour-subnav-btn {
                        flex: 1;
                        min-width: 80px;
                        padding: 8px 6px;
                        border-radius: 12px;
                        font-size: 0.65rem;
                        font-weight: 950;
                        border: 1px solid;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        cursor: pointer;
                        transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
                        letter-spacing: 0.3px;
                        white-space: nowrap;
                    }
                    .tour-subnav-btn:active {
                        transform: scale(0.96);
                    }
                    .event-poster-wrapper:hover .event-poster-image {
                        transform: scale(1.03);
                    }
                    .event-poster-wrapper:hover .poster-expand-badge {
                        background: rgba(15, 23, 42, 0.98);
                        border-color: ${heroAccent};
                        transform: translateY(-1px);
                    }
                    .event-poster-wrapper:active {
                        transform: scale(0.985);
                    }
                    @keyframes livePulseDot {
                        0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                        70% { transform: scale(1.4); opacity: 0.7; box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
                        100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                    }

                    /* 📱 MÓVIL RESPONSIVE ULTRA-ERGONÓMICO: Hero Deportivo Compacto */
                    @media (max-width: 680px) {
                        .tour-header-context {
                            padding: 12px 12px 14px !important;
                        }
                        .center-hero-container {
                            flex-direction: row !important;
                            align-items: center !important;
                            justify-content: flex-start !important;
                            text-align: left !important;
                            gap: 12px !important;
                            padding: 2px 4px !important;
                        }
                        .center-hero-container .event-poster-wrapper {
                            max-width: 95px !important;
                            flex-shrink: 0 !important;
                        }
                        .center-hero-container .event-poster-card {
                            border-radius: 12px !important;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
                        }
                        .center-hero-container .event-poster-image {
                            max-height: 125px !important;
                            min-height: 105px !important;
                            max-width: 90px !important;
                            border-radius: 10px !important;
                        }
                        .center-hero-container .poster-cat-badge {
                            top: 4px !important;
                            left: 4px !important;
                            padding: 2px 5px !important;
                            font-size: 0.58rem !important;
                            border-radius: 6px !important;
                        }
                        .center-hero-container .poster-expand-badge {
                            bottom: 4px !important;
                            right: 4px !important;
                            padding: 2px 6px !important;
                            font-size: 0.52rem !important;
                            border-radius: 10px !important;
                        }
                        .center-hero-container .hero-details-column {
                            align-items: flex-start !important;
                            text-align: left !important;
                            flex: 1 !important;
                            min-width: 0 !important;
                            gap: 6px !important;
                        }
                        .center-hero-container h1 {
                            font-size: clamp(0.95rem, 3.8vw, 1.15rem) !important;
                            text-align: left !important;
                            line-height: 1.2 !important;
                            letter-spacing: -0.3px !important;
                        }
                        .center-hero-container .hero-chips-row {
                            justify-content: flex-start !important;
                            gap: 4px !important;
                        }
                        .center-hero-container .hero-chips-row > div {
                            padding: 3px 8px !important;
                            font-size: 0.64rem !important;
                            border-radius: 8px !important;
                        }
                    }
                </style>
            `;
        },

        /**
         * Abre el modal / lightbox del cartel oficial en resolución completa
         */
        openPosterModal(imageUrl, eventName, clubName) {
            if (typeof window.openPosterModal === 'function') {
                return window.openPosterModal(imageUrl, eventName, clubName);
            }
            if (window.EventsController && typeof window.EventsController.openPosterModal === 'function') {
                return window.EventsController.openPosterModal(imageUrl, eventName, clubName);
            }

            // Fallback lightbox fullscreen
            let modal = document.getElementById('sp-event-poster-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'sp-event-poster-modal';
                modal.style.cssText = `
                    position: fixed; inset: 0; background: rgba(4, 7, 15, 0.94);
                    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                    z-index: 9999999; display: flex; align-items: center; justify-content: center;
                    padding: 16px; box-sizing: border-box; font-family: 'Outfit', sans-serif;
                    opacity: 0; transition: opacity 0.25s ease;
                `;
                document.body.appendChild(modal);
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.closest('.close-poster-btn')) {
                        modal.style.opacity = '0';
                        setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 250);
                    }
                });
            }

            const img = imageUrl || 'img/logo_somospadel.png';
            modal.innerHTML = `
                <div style="position: relative; max-width: 92vw; max-height: 92vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <button type="button" class="close-poster-btn" style="position: absolute; top: -14px; right: -14px; width: 38px; height: 38px; border-radius: 50%; background: #0f172a; color: #ffffff; border: 2px solid #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.6); z-index: 10;">✕</button>
                    <img src="${img}" alt="${eventName || 'Cartel'}" style="max-width: 90vw; max-height: 82vh; border-radius: 14px; box-shadow: 0 20px 50px rgba(0,0,0,0.85); object-fit: contain; border: 2px solid rgba(255,255,255,0.2);">
                    ${eventName ? `<div style="color: #ffffff; font-weight: 1000; font-size: 0.95rem; margin-top: 12px; text-align: center; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">${eventName}</div>` : ''}
                </div>
            `;
            const rAF = (typeof window !== 'undefined' && window.requestAnimationFrame) || (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout);
            rAF(() => { modal.style.opacity = '1'; });
        },

        renderRoundTabs(rounds, currentNum, americanaDoc, allMatches) {
            const matchesArr = Array.isArray(allMatches) ? allMatches : [];
            const isEntreno = !!americanaDoc?.isEntreno;
            const neonColor = isEntreno ? '#c084fc' : '#CCFF00';
            const neonGlow = isEntreno ? 'rgba(192, 132, 252, 0.35)' : 'rgba(204, 255, 0, 0.35)';

            let effectiveRounds = Array.isArray(rounds) && rounds.length > 0 ? [...rounds] : [];
            const minRounds = 6;
            if (effectiveRounds.length < minRounds) {
                const highestNum = effectiveRounds.length > 0 
                    ? Math.max(...effectiveRounds.map(r => parseInt(r.number || 0))) 
                    : 0;
                const targetCount = Math.max(minRounds, highestNum);
                effectiveRounds = Array.from({ length: targetCount }, (_, i) => ({ number: i + 1 }));
            }

            return `
                <div class="round-tabs-container" style="display: flex; gap: 6px; align-items: center; padding: 4px 6px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -webkit-overflow-scrolling: touch; width: 100%;">
                    ${effectiveRounds.map(r => {
                        const rNum = parseInt(r.number);
                        const isSel = rNum === parseInt(currentNum);
                        const roundMatches = matchesArr.filter(m => parseInt(m.round) === rNum);
                        const isFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished' || m.status === 'finalizado' || m.isFinished === true);
                        const hasLiveMatch = roundMatches.some(m => (m.status === 'live' || m.status === 'en juego') && !m.isFinished);

                        let chipBg = '#f8fafc';
                        let chipText = '#64748b';
                        let chipBorder = '#e2e8f0';
                        let chipShadow = 'none';
                        let badgeMarkup = '';

                        if (isSel) {
                            chipBg = '#0f172a';
                            chipText = '#ffffff';
                            chipBorder = neonColor;
                            chipShadow = `0 4px 16px ${neonGlow}`;
                            if (isFinished) {
                                badgeMarkup = `<span style="color: #22c55e; font-weight: 950; font-size: 0.75rem; margin-left: 2px;">✓</span>`;
                            } else if (hasLiveMatch) {
                                badgeMarkup = `<span style="color: #00E36D; font-size: 0.65rem; line-height: 1; margin-left: 2px; animation: pulseRoundLive 1.5s infinite;">●</span>`;
                            }
                        } else if (isFinished) {
                            chipBg = '#f0fdf4';
                            chipText = '#15803d';
                            chipBorder = '#bbf7d0';
                            badgeMarkup = `<span style="color: #16a34a; font-weight: 950; font-size: 0.75rem; margin-left: 2px;">✓</span>`;
                        } else if (hasLiveMatch) {
                            chipBg = '#f0fdf4';
                            chipText = '#166534';
                            chipBorder = '#86efac';
                            chipShadow = '0 2px 8px rgba(34, 197, 94, 0.15)';
                            badgeMarkup = `<span style="color: #22c55e; font-size: 0.65rem; line-height: 1; margin-left: 2px; animation: pulseRoundLive 1.5s infinite;">●</span>`;
                        } else {
                            // Ronda Pendiente
                            chipBg = '#f8fafc';
                            chipText = '#64748b';
                            chipBorder = '#e2e8f0';
                        }

                        return `
                            <button type="button" 
                                    class="round-tab ${isSel ? 'active' : ''}" 
                                    data-round="${r.number}"
                                    onclick="window.ControlTowerView.goToRound(${r.number}, event)"
                                    style="background: ${chipBg}; 
                                           color: ${chipText}; 
                                           border: 1.5px solid ${chipBorder};
                                           padding: 6px 12px; border-radius: 12px; font-family: 'Outfit', sans-serif; font-weight: 950; cursor: pointer; transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); min-width: 50px;
                                           box-shadow: ${chipShadow};
                                           position: relative; font-size: 0.78rem; display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; white-space: nowrap;">
                                <span style="${isSel ? `color: ${neonColor}; font-weight: 1000;` : ''}">R${r.number}</span>
                                ${badgeMarkup}
                            </button>
                        `;
                    }).join('')}
                </div>
                <style>
                    .round-tabs-container::-webkit-scrollbar { display: none; }
                    .round-tab:active { transform: scale(0.96); }
                    @keyframes pulseRoundLive {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.35); opacity: 0.6; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                </style>
            `;
        }
    };
})();
