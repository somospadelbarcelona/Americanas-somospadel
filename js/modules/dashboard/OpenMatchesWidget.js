/**
 * OpenMatchesWidget.js (Premium Light Theme v3.0)
 * 🎾 Widget Profesional de Partidas Abiertas para el Dashboard de Inicio
 * Diseño oficial de la app: fondo blanco, textos en negro oscuro, acentos en verde lima.
 * Carga partidas en tiempo real desde Firestore, calcula la compatibilidad de nivel,
 * simula una pista de pádel holográfica e integra el logo oficial.
 */
(function () {
    'use strict';

    class OpenMatchesWidget {
        constructor() {
            this.containerId = 'open-matches-widget-root';
            this.unsubscribe = null;
            this.allMatches = [];
            this.hasInitialized = false;
            this.selectedWeatherLocation = 'EL_PRAT';
            this.weatherData = null;
            this.isWeatherLoading = false;
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.warn(`⚠️ [OpenMatchesWidget] Container #${this.containerId} not found`);
                return;
            }

            this.injectStyles();
            
            // Mostrar esqueleto shimmer de carga en la primera inicialización
            if (!this.hasInitialized) {
                this.renderSkeleton();
            }
            
            this.startRealTimeSync();
        }

        injectStyles() {
            if (document.getElementById('open-matches-widget-styles')) return;
            const style = document.createElement('style');
            style.id = 'open-matches-widget-styles';
            style.textContent = `
                /* Animaciones de entrada, pulso y shimmer */
                @keyframes pulseNeonOrange {
                    0% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0.4); transform: scale(1); }
                    70% { box-shadow: 0 0 0 8px rgba(255, 85, 0, 0); transform: scale(1.03); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0); transform: scale(1); }
                }
                @keyframes pulseDotLive {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
                @keyframes shimmerEffect {
                    0% { background-position: -200px 0; }
                    100% { background-position: 200px 0; }
                }
                @keyframes fomoBlink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(1.02); }
                }
                
                /* Shimmer */
                .skeleton-shimmer {
                    background: linear-gradient(90deg, rgba(15, 23, 42, 0.02) 25%, rgba(15, 23, 42, 0.08) 50%, rgba(15, 23, 42, 0.02) 75%);
                    background-size: 200px 100%;
                    animation: shimmerEffect 1.5s infinite;
                }
                
                /* Contenedor del widget (MODO CLARO) */
                .open-matches-widget-container {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 28px;
                    padding: 22px;
                    box-shadow: 0 10px 30px rgba(10, 25, 47, 0.03);
                    position: relative;
                    overflow: hidden;
                    margin: 0 15px 12px !important;
                }
                
                /* Layout wrapper adaptativo */
                .widget-layout-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .widget-left-column {
                    width: 100%;
                    min-width: 0;
                }
                .widget-right-column {
                    width: 100%;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 18px;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                
                @media (min-width: 768px) {
                    .widget-layout-wrapper {
                        flex-direction: row;
                        align-items: stretch;
                        gap: 22px;
                    }
                    .widget-left-column {
                        flex: 1 1 100%;
                    }
                    .widget-right-column {
                        display: none;
                    }
                    .match-promo-card {
                        flex: 0 0 100% !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
                
                /* Clima tab selector style */
                .weather-tab-item {
                    color: #64748B;
                    background: transparent;
                    transition: all 0.2s ease;
                }
                .weather-tab-item.active {
                    color: #0a192f !important;
                    background: #ffffff !important;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
                }
                
                /* Carrusel horizontal */
                .matches-carousel {
                    display: flex;
                    gap: 14px;
                    overflow-x: auto;
                    padding: 8px 2px 16px;
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none;  /* IE/Edge */
                }
                .matches-carousel::-webkit-scrollbar {
                    display: none; /* Safari/Chrome */
                }
                
                /* Tarjeta individual de partida (MODO CLARO) */
                .match-promo-card {
                    scroll-snap-align: start;
                    flex: 0 0 100%;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 22px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    position: relative;
                    transition: transform 0.25s cubic-bezier(0.165, 0.84, 0.44, 1), border-color 0.25s, box-shadow 0.25s;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }
                .match-promo-card:active {
                    transform: scale(0.97);
                }
                .match-promo-card:hover {
                    border-color: #99cc00;
                    box-shadow: 0 8px 24px rgba(153, 204, 0, 0.12);
                }
                
                /* Calendario / Badge de fecha (MODO CLARO CON DEGRADE LIMA) */
                .match-date-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, rgba(204, 255, 0, 0.22) 0%, rgba(204, 255, 0, 0.05) 100%);
                    border: 1.5px solid #99cc00;
                    flex-shrink: 0;
                }
                .match-date-day {
                    font-size: 1.15rem;
                    font-weight: 900;
                    color: #0a192f;
                    line-height: 1;
                }
                .match-date-month {
                    font-size: 0.55rem;
                    font-weight: 800;
                    color: #556677;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-top: 2px;
                }
                
                /* 🎾 PISTA DE PÁDEL TÁCTICA (Luz de pista verde) */
                .padel-court-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 10px 1fr 1fr;
                    background: rgba(0, 227, 109, 0.02);
                    border: 1.5px solid rgba(0, 227, 109, 0.16);
                    border-radius: 16px;
                    padding: 10px 8px;
                    align-items: center;
                    position: relative;
                    box-shadow: inset 0 0 10px rgba(0, 227, 109, 0.03);
                }
                .court-couple-left {
                    grid-column: 1 / span 2;
                    display: flex;
                    justify-content: space-around;
                    gap: 4px;
                }
                .court-couple-right {
                    grid-column: 4 / span 5;
                    display: flex;
                    justify-content: space-around;
                    gap: 4px;
                }
                .court-net {
                    grid-column: 3;
                    height: 34px;
                    border-left: 2px dashed rgba(0, 227, 109, 0.25);
                    margin: 0 auto;
                    position: relative;
                }
                
                /* Player Slot */
                .player-slot {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    position: relative;
                }
                .player-dot {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.62rem;
                    font-weight: 900;
                }
                .player-dot.occupied {
                    background: rgba(204, 255, 0, 0.25);
                    border: 1.5px solid #99cc00;
                    color: #0a192f;
                }
                .player-dot.vacant {
                    background: rgba(255, 85, 0, 0.05);
                    border: 1.5px dashed rgba(255, 85, 0, 0.5);
                    color: #FF5500;
                    animation: pulseNeonOrange 2s infinite ease-in-out;
                }
                .player-slot-name {
                    font-size: 0.52rem;
                    color: #556677;
                    font-weight: 600;
                    max-width: 52px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-align: center;
                }
                
                /* Badges (Light Mode) */
                .level-badge {
                    background: rgba(0, 227, 109, 0.1);
                    border: 1px solid #00E36D;
                    color: #008a3d;
                    font-size: 0.62rem;
                    font-weight: 900;
                    padding: 3px 8px;
                    border-radius: 8px;
                    width: fit-content;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .level-badge.incompatible {
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    color: #475569;
                }
                .fomo-badge {
                    background: rgba(255, 45, 85, 0.1);
                    border: 1px solid #FF2D55;
                    color: #ff1241;
                    font-size: 0.62rem;
                    font-weight: 950;
                    padding: 3px 8px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    box-shadow: 0 0 10px rgba(255, 45, 85, 0.1);
                    animation: fomoBlink 1.5s infinite ease-in-out;
                }
                
                /* Carousel Dots */
                .carousel-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #cbd5e1;
                    transition: all 0.25s ease;
                }
                .carousel-dot.active {
                    background: #99cc00;
                    width: 14px;
                    border-radius: 4px;
                    box-shadow: 0 0 8px rgba(153, 204, 0, 0.4);
                }
                
                /* Empty state */
                .empty-matches-card {
                    background: #f8fafc;
                    border: 1.5px dashed #cbd5e1;
                    border-radius: 22px;
                    padding: 30px 20px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                }
            `;
            document.head.appendChild(style);
        }

        renderSkeleton() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="open-matches-widget-container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: #cbd5e1; border-radius: 50%;"></span>
                            <span style="font-size: 0.85rem; font-weight: 950; color: #94a3b8; letter-spacing: -0.5px; text-transform: uppercase;">
                                Partidas Abiertas
                            </span>
                        </div>
                    </div>
                    <div class="matches-carousel" style="overflow: hidden;">
                        <div class="match-promo-card" style="opacity: 0.5; border-color: #f1f5f9; pointer-events: none;">
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <div style="width: 52px; height: 52px; border-radius: 14px; background: #f1f5f9;" class="skeleton-shimmer"></div>
                                <div style="flex: 1;">
                                    <div style="height: 12px; width: 60%; background: #f1f5f9; border-radius: 4px;" class="skeleton-shimmer"></div>
                                    <div style="height: 8px; width: 80%; background: #f1f5f9; border-radius: 4px; margin-top: 6px;" class="skeleton-shimmer"></div>
                                </div>
                            </div>
                            <div style="height: 48px; background: #f8fafc; border-radius: 12px;" class="skeleton-shimmer"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                                <div style="height: 14px; width: 40%; background: #f1f5f9; border-radius: 4px;" class="skeleton-shimmer"></div>
                                <div style="height: 24px; width: 30%; background: #f1f5f9; border-radius: 8px;" class="skeleton-shimmer"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        startRealTimeSync() {
            if (!window.db) {
                console.warn("⏳ [OpenMatchesWidget] Waiting for Firebase DB to initialize...");
                setTimeout(() => this.startRealTimeSync(), 1000);
                return;
            }

            if (this.unsubscribe) {
                this.unsubscribe();
            }

            const todayStr = new Date().toISOString().split('T')[0];

            try {
                this.unsubscribe = window.db.collection('open_matches')
                    .where('status', '==', 'active')
                    .onSnapshot(snapshot => {
                        const matches = [];
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.date && data.date >= todayStr) {
                                matches.push({ id: doc.id, ...data });
                            }
                        });

                        // Sort matches by date and time
                        matches.sort((a, b) => {
                            const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                            const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                            return dateA - dateB;
                        });

                        this.allMatches = matches;
                        this.hasInitialized = true;
                        this.updateUI();
                    }, error => {
                        console.error("❌ [OpenMatchesWidget] Firestore loading failed:", error);
                        this.renderErrorState();
                    });
            } catch (err) {
                console.error("❌ [OpenMatchesWidget] Error in sync process:", err);
            }
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myLevel = currentUser ? parseFloat(currentUser.level || 3.5) : 3.5;

            // Render Header HTML (incorporando Logo Oficial de SomosPadel)
            let html = `
                <div class="open-matches-widget-container">
                    <!-- BACKGROUND GLOW EFFECTS (SUBTLE LIGHT GREEN) -->
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(204, 255, 0, 0.15) 0%, transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(0, 210, 255, 0.05) 0%, transparent 70%); pointer-events: none;"></div>

                    <!-- WIDGET HEADER (SOMOSPADEL BRANDING) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 2;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="img/logo_somospadel.png" alt="SomosPadel" style="height: 30px; width: auto; object-fit: contain; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.1));">
                            <span style="font-size: 0.85rem; font-weight: 950; color: #0a192f; letter-spacing: -0.5px; text-transform: uppercase; margin-left: 2px;">
                                Partidas Abiertas
                            </span>
                            <span style="display: inline-block; width: 8px; height: 8px; background: #00E36D; border-radius: 50%; animation: pulseDotLive 1.8s infinite ease-in-out; box-shadow: 0 0 8px #00E36D; margin-left: 2px;"></span>
                            ${this.allMatches.length > 0 ? `<span style="background: rgba(153, 204, 0, 0.12); border: 1px solid rgba(153, 204, 0, 0.25); color: #72a800; font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 6px; margin-left: 4px;">${this.allMatches.length} EN VIVO</span>` : ''}
                        </div>
                        <button onclick="window.PlayerView?.haptic?.(20); window.dashNavigate('partidas_abiertas')" style="background: transparent; border: none; color: #72a800; font-weight: 800; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0;">
                            Ver todas <i class="fas fa-chevron-right" style="font-size: 0.65rem;"></i>
                        </button>
                    </div>
                    
                    <div class="widget-layout-wrapper">
                        <div class="widget-left-column">
            `;

            if (this.allMatches.length === 0) {
                // Empty state card
                html += `
                    <div class="empty-matches-card">
                        <div style="width: 46px; height: 46px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                            <i class="fas fa-table-tennis-paddle-ball" style="color: #cbd5e1; font-size: 1.25rem;"></i>
                        </div>
                        <h4 style="margin: 0; color: #0a192f; font-weight: 900; font-size: 0.95rem; letter-spacing: -0.3px;">¡Ninguna partida activa hoy!</h4>
                        <p style="margin: 0; color: #556677; font-size: 0.7rem; line-height: 1.4; max-width: 250px;">
                            Comparte tu partida de Playtomic en WhatsApp o añádela en la sección de Partidas Abiertas para reclutar jugadores.
                        </p>
                        <button onclick="window.PlayerView?.haptic?.(20); window.dashNavigate('partidas_abiertas')" class="shimmer-btn" style="
                            margin-top: 4px;
                            background: #CCFF00;
                            border: 1px solid #99cc00;
                            color: #0a192f;
                            padding: 8px 18px;
                            border-radius: 12px;
                            font-size: 0.72rem;
                            font-weight: 900;
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(204,255,0,0.25);
                        ">
                            COMPARTIR PARTIDA 🎾
                        </button>
                    </div>
                `;
            } else {
                // Render carousel
                html += `<div class="matches-carousel">`;
                
                this.allMatches.forEach(match => {
                    // Date parsing
                    let dayNum = '--';
                    let monthStr = '---';
                    try {
                        if (match.date) {
                            const [year, month, day] = match.date.split('-');
                            dayNum = parseInt(day).toString();
                            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            monthStr = months[parseInt(month) - 1];
                        }
                    } catch (e) {
                        console.warn("Date parse error", e);
                    }

                    // Level compatibility badge check
                    const levelMin = parseFloat(match.level_min || 0);
                    const levelMax = parseFloat(match.level_max || 7.0);
                    const isLevelCompatible = myLevel >= levelMin && myLevel <= levelMax;
                    
                    const spotsLeft = parseInt(match.spots_needed) || 0;
                    const totalPlayers = Array.isArray(match.players) ? match.players : [];
                    
                    // Create spots array of 4 players
                    const slots = [];
                    for (let i = 0; i < 4; i++) {
                        if (i < totalPlayers.length) {
                            slots.push({ occupied: true, name: totalPlayers[i] });
                        } else if (i < totalPlayers.length + spotsLeft) {
                            slots.push({ occupied: false, name: '+ Únete' });
                        } else {
                            slots.push({ occupied: false, name: 'Libre' });
                        }
                    }

                    // Badges logic
                    let badgesHtml = '';
                    if (isLevelCompatible) {
                        badgesHtml += `<span class="level-badge"><i class="fas fa-check-circle"></i> ¡APTO PARA TI!</span>`;
                    } else {
                        badgesHtml += `<span class="level-badge incompatible"><i class="fas fa-circle-nodes"></i> Nivel ${levelMin.toFixed(2)} - ${levelMax.toFixed(2)}</span>`;
                    }

                    // FOMO: Alert if only 1 spot is left
                    if (spotsLeft === 1) {
                        badgesHtml += ` <span class="fomo-badge"><i class="fas fa-fire"></i> ¡ÚLTIMA PLAZA!</span>`;
                    }

                    html += `
                        <div class="match-promo-card" onclick="window.PlayerView?.haptic?.(20); window.OpenMatchesWidget.openMatch('${match.id}')">
                            <!-- TOP BLOCK -->
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <div class="match-date-badge">
                                    <span class="match-date-day">${dayNum}</span>
                                    <span class="match-date-month">${monthStr}</span>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-size: 0.95rem; font-weight: 900; color: #0a192f; display: flex; align-items: center; gap: 6px;">
                                        <i class="far fa-clock" style="color: #99cc00; font-size: 0.85rem;"></i>
                                        <span>${match.time || '19:00'}</span>
                                        <span style="font-size: 0.65rem; color: #556677; font-weight: 600;">(${match.duration || 90} min)</span>
                                    </div>
                                    <div style="font-size: 0.72rem; color: #556677; font-weight: 700; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        <i class="fas fa-map-marker-alt" style="color: #00d2ff; margin-right: 4px;"></i>${match.club || 'Somos Padel BCN'}
                                    </div>
                                </div>
                            </div>

                            <!-- MIDDLE: HOLOGRAPHIC PADEL COURT GRID -->
                            <div class="padel-court-grid">
                                <div class="court-couple-left">
                                    <!-- Pareja 1: Slot 1 y 2 -->
                                    <div class="player-slot">
                                        <div class="player-dot ${slots[0].occupied ? 'occupied' : 'vacant'}">
                                            ${slots[0].occupied ? (slots[0].name.substring(0, 2).toUpperCase()) : `+`}
                                        </div>
                                        <span class="player-slot-name">${slots[0].name}</span>
                                    </div>
                                    <div class="player-slot">
                                        <div class="player-dot ${slots[1].occupied ? 'occupied' : 'vacant'}">
                                            ${slots[1].occupied ? (slots[1].name.substring(0, 2).toUpperCase()) : `+`}
                                        </div>
                                        <span class="player-slot-name">${slots[1].name}</span>
                                    </div>
                                </div>
                                
                                <div class="court-net"></div>
                                
                                <div class="court-couple-right">
                                    <!-- Pareja 2: Slot 3 y 4 -->
                                    <div class="player-slot">
                                        <div class="player-dot ${slots[2].occupied ? 'occupied' : 'vacant'}">
                                            ${slots[2].occupied ? (slots[2].name.substring(0, 2).toUpperCase()) : `+`}
                                        </div>
                                        <span class="player-slot-name">${slots[2].name}</span>
                                    </div>
                                    <div class="player-slot">
                                        <div class="player-dot ${slots[3].occupied ? 'occupied' : 'vacant'}">
                                            ${slots[3].occupied ? (slots[3].name.substring(0, 2).toUpperCase()) : `+`}
                                        </div>
                                        <span class="player-slot-name">${slots[3].name}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- BOTTOM BLOCK: LEVEL & CTA -->
                            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 2px;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    ${badgesHtml}
                                </div>
                                
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    ${match.playtomic_url ? `
                                        <button onclick="event.stopPropagation(); window.PlayerView?.haptic?.(20); window.open('${match.playtomic_url}', '_blank');" style="width: 28px; height: 28px; border-radius: 8px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); color: #2563eb; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.7rem; transition: all 0.2s;" title="Ver en Playtomic" onmouseover="this.style.background='rgba(59, 130, 246, 0.15)'" onmouseout="this.style.background='rgba(59, 130, 246, 0.08)'">
                                            <i class="fas fa-external-link-alt"></i>
                                        </button>
                                    ` : ''}
                                    <button style="background: #CCFF00; border: 1px solid #99cc00; color: #0a192f; font-size: 0.68rem; font-weight: 900; padding: 6px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 4px;" onmouseover="this.style.background='#99cc00';" onmouseout="this.style.background='#CCFF00';">
                                        ÚNETE <i class="fas fa-arrow-right" style="font-size: 0.55rem;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;

                // Add scroll indicator dots if there's more than one match
                if (this.allMatches.length > 1) {
                    html += `
                        <div class="carousel-dots-container" style="display:flex; justify-content:center; gap:6px; margin-top:-8px; padding-bottom:8px;">
                            ${this.allMatches.map((_, idx) => `<span class="carousel-dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}
                        </div>
                    `;
                }
            }

            html += `</div>`;
            container.innerHTML = html;

            // Setup listeners for carousel dot activation
            if (this.allMatches.length > 1) {
                setTimeout(() => this.setupCarouselScrollListener(), 100);
            }
        }

        setupCarouselScrollListener() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const carousel = container.querySelector('.matches-carousel');
            const dots = container.querySelectorAll('.carousel-dot');
            if (!carousel || dots.length === 0) return;

            carousel.addEventListener('scroll', () => {
                const scrollLeft = carousel.scrollLeft;
                const cardWidth = carousel.querySelector('.match-promo-card')?.offsetWidth || 1;
                const gap = 14;
                const activeIndex = Math.round(scrollLeft / (cardWidth + gap));
                
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === activeIndex);
                });
            }, { passive: true });
        }

        openMatch(matchId) {
            console.log(`🎾 [OpenMatchesWidget] Navigating to match details: ${matchId}`);
            
            // Native Haptic
            if (window.PlayerView?.haptic) {
                window.PlayerView.haptic(30);
            } else if (navigator.vibrate) {
                navigator.vibrate(20);
            }

            // 1. Navigate to the partidas_abiertas route
            if (window.Router) {
                window.Router.navigate('partidas_abiertas');
                
                // 2. Wait for content to render and trigger the detail drawer
                setTimeout(() => {
                    if (window.OpenMatchesView && typeof window.OpenMatchesView.openDetailDrawer === 'function') {
                        window.OpenMatchesView.openDetailDrawer(matchId);
                    } else {
                        console.warn("⚠️ [OpenMatchesWidget] OpenMatchesView.openDetailDrawer not ready yet, retrying...");
                        setTimeout(() => {
                            if (window.OpenMatchesView && typeof window.OpenMatchesView.openDetailDrawer === 'function') {
                                window.OpenMatchesView.openDetailDrawer(matchId);
                            }
                        }, 250);
                    }
                }, 300);
            }
        }

        renderErrorState() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="open-matches-widget-container" style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="color: #ff5500; font-size: 1.5rem; margin-bottom: 8px;"></i>
                    <div style="font-size: 0.8rem; color: #0a192f; font-weight: 700;">Error al cargar partidas</div>
                    <div style="font-size: 0.65rem; color: #556677; margin-top: 4px;">Revisa tu conexión a internet o reintenta.</div>
                </div>
            `;
        }

        destroy() {
            console.log("🧹 [OpenMatchesWidget] Cleaning up database subscriptions...");
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
        }
    }

    window.OpenMatchesWidget = new OpenMatchesWidget();
    console.log('🎾 Open Matches Widget (Light Theme v3) Loaded');
})();
