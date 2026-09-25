/**
 * TournamentView.js - v2.0 Premier Sport Edition
 * Interfaz de Alta Competición para Torneos SomosPadel BCN
 */
(function () {
    class TournamentView {
        constructor() {
            this.container = null;
            this.searchTerm = '';
            this.countdownInterval = null;
        }

        render(tournaments, counts = {}, currentFilter = 'all', currentCategoryFilter = 'all', currentSort = 'newest', viewMode = 'cards') {
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            // Limpiar timers de cuenta atrás previos
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }

            const cAll = counts.all !== undefined ? counts.all : tournaments.length;
            const cOpen = counts.open || 0;
            const cInGame = counts.in_game || 0;
            const cUpcoming = counts.upcoming || 0;
            const cFinished = counts.finished || 0;

            // Torneo destacado (el primero abierto o en juego)
            const featuredTournament = tournaments.find(t => (t.status || '').toLowerCase().includes('abiert') || (t.status || '').toLowerCase().includes('juego')) || tournaments[0];

            this.container.innerHTML = `
                <div class="tournaments-pro-root animate-fade-in" style="background: #f1f5f9; min-height: 100vh; padding-bottom: 150px; font-family: 'Outfit', sans-serif;">
                    
                    <!-- 🏆 MODERN CLEAN SPORT HERO BANNER -->
                    <div class="t-hero-wrapper" style="position: relative; overflow: hidden; background: linear-gradient(180deg, #090e17 0%, #0f172a 100%); color: white; padding: 22px 18px 20px 18px; border-bottom: 2px solid rgba(204,255,0,0.4);">
                        <!-- Ambient Glow -->
                        <div style="position: absolute; top: -40px; right: -30px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(204,255,0,0.12) 0%, rgba(0,0,0,0) 70%); pointer-events: none;"></div>
                        <div style="position: absolute; bottom: -50px; left: -30px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(0,0,0,0) 70%); pointer-events: none;"></div>

                        <div style="position: relative; z-index: 2; max-width: 1000px; margin: 0 auto;">
                            <!-- Header Row -->
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #ccff00; box-shadow: 0 0 10px #ccff00;"></div>
                                    <h1 style="margin: 0; font-size: clamp(1.4rem, 4vw, 2rem); font-weight: 950; letter-spacing: -0.3px; text-transform: uppercase; color: #ffffff;">
                                        TORNEOS
                                    </h1>
                                </div>
                                <span style="background: rgba(204,255,0,0.1); color: #ccff00; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(204,255,0,0.3); text-transform: uppercase; letter-spacing: 0.8px;">
                                    OFICIAL
                                </span>
                            </div>

                            <p style="margin: 0; color: #94a3b8; font-size: 0.82rem; font-weight: 600; line-height: 1.35;">
                                Calendario de competiciones oficiales en Barcelona. Consulta fechas e inscríbete.
                            </p>

                            <!-- Horizontal Minimal Metric Chips -->
                            <div style="display: flex; gap: 8px; margin-top: 14px; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch;">
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 10px; font-size: 0.72rem; font-weight: 850; color: #f1f5f9; white-space: nowrap;">
                                    <i class="fas fa-trophy" style="color: #ccff00;"></i> <span>${cAll} Torneos</span>
                                </div>
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 10px; font-size: 0.72rem; font-weight: 850; color: #f1f5f9; white-space: nowrap;">
                                    <i class="fas fa-fire" style="color: #f97316;"></i> <span>${cOpen} Abiertos</span>
                                </div>
                                <div onclick="window.TournamentController.findPartnerForTournament('${featuredTournament ? featuredTournament.id : ''}')"
                                     style="display: inline-flex; align-items: center; gap: 6px; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); padding: 5px 12px; border-radius: 10px; font-size: 0.72rem; font-weight: 850; color: #38bdf8; white-space: nowrap; cursor: pointer;">
                                    <i class="fas fa-users"></i> <span>Bolsa de Parejas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 🌟 SPOTLIGHT FEATURED EVENT (Si existe torneo relevante) -->
                    ${featuredTournament ? `
                    <div style="max-width: 1000px; margin: -15px auto 0 auto; padding: 0 16px; position: relative; z-index: 3;">
                        <div class="t-spotlight-card" onclick="window.TournamentController.openDetails('${featuredTournament.id}')" 
                             style="background: linear-gradient(135deg, #111827 0%, #1e293b 100%); border-radius: 20px; border: 1px solid rgba(204,255,0,0.3); padding: 18px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.25); cursor: pointer; transition: transform 0.25s ease;">
                            
                            <div style="display: flex; align-items: center; gap: 16px; min-width: 260px; flex: 1;">
                                <div style="position: relative; width: 64px; height: 64px; border-radius: 14px; overflow: hidden; flex-shrink: 0; border: 2px solid #ccff00;">
                                    <img src="${featuredTournament.poster}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1592910129881-891178e4820c?auto=format&fit=crop&q=80&w=400'">
                                    <span style="position: absolute; top: 3px; left: 3px; background: #ccff00; color: #000; font-size: 0.55rem; font-weight: 950; padding: 2px 4px; border-radius: 4px;">TOP</span>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="background: rgba(204,255,0,0.2); color: #ccff00; font-size: 0.65rem; font-weight: 950; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">DESTACADO</span>
                                        <span style="color: #94a3b8; font-size: 0.72rem; font-weight: 700;"><i class="far fa-calendar-alt"></i> ${featuredTournament.dates}</span>
                                    </div>
                                    <div style="font-size: 1.05rem; font-weight: 950; color: white; margin-top: 4px; line-height: 1.2;">
                                        ${featuredTournament.title}
                                    </div>
                                    <div style="color: #cbd5e1; font-size: 0.75rem; font-weight: 600; margin-top: 3px;">
                                        <i class="fas fa-map-marker-alt" style="color: #ccff00;"></i> ${featuredTournament.location}
                                    </div>
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <button onclick="event.stopPropagation(); window.TournamentController.findPartnerForTournament('${featuredTournament.id}')"
                                        class="t-btn-partner"
                                        style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 9px 15px; border-radius: 12px; font-weight: 900; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                                    <i class="fas fa-user-friends"></i> Busco Pareja
                                </button>
                                <button onclick="event.stopPropagation(); window.TournamentController.openDetails('${featuredTournament.id}')"
                                        class="t-btn-cta"
                                        style="background: #ccff00; border: none; color: #000; padding: 10px 18px; border-radius: 12px; font-weight: 950; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(204,255,0,0.3); transition: all 0.2s;">
                                    <span>VER TORNEO</span>
                                    <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- 🎛️ CONTROLS BAR: SEARCH, SORTS, CATEGORIES & VIEW SWITCHER -->
                    <div style="max-width: 1000px; margin: 24px auto 0 auto; padding: 0 16px;">
                        
                        <!-- Search & Quick Sort Row -->
                        <div style="background: white; border-radius: 18px; padding: 10px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            
                            <!-- Search Input -->
                            <div style="position: relative; flex: 1; min-width: 220px; display: flex; align-items: center;">
                                <i class="fas fa-search" style="position: absolute; left: 12px; color: #0284c7; font-size: 0.95rem;"></i>
                                <input type="text"
                                       id="tournament-search-input"
                                       placeholder="Buscar torneo, club, nivel o fecha..."
                                       value="${this.searchTerm}"
                                       oninput="window.TournamentController.handleSearch(this.value)"
                                       style="width: 100%; height: 42px; padding: 0 36px 0 38px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 0.9rem; font-weight: 700; color: #0f172a; outline: none; background: #f8fafc; font-family: 'Outfit', sans-serif;">
                                
                                ${this.searchTerm ? `
                                    <button onclick="window.TournamentController.handleSearch('')" 
                                            style="position: absolute; right: 10px; background: none; border: none; color: #94a3b8; font-size: 1rem; cursor: pointer; padding: 4px;">
                                        <i class="fas fa-times-circle"></i>
                                    </button>
                                ` : ''}
                            </div>

                            <!-- Sorter -->
                            <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 6px 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <i class="fas fa-sort-amount-down" style="color: #64748b; font-size: 0.85rem;"></i>
                                <select onchange="window.TournamentController.changeSort(this.value)" 
                                        style="border: none; background: transparent; font-family: 'Outfit', sans-serif; font-size: 0.78rem; font-weight: 850; color: #0f172a; outline: none; cursor: pointer;">
                                    <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Más próximos</option>
                                    <option value="oldest" ${currentSort === 'oldest' ? 'selected' : ''}>Más antiguos</option>
                                </select>
                            </div>

                            <!-- View Mode Switcher -->
                            <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                <button onclick="window.TournamentController.setViewMode('cards')" 
                                        title="Vista Tarjetas"
                                        style="background: ${viewMode === 'cards' ? '#0f172a' : 'transparent'}; color: ${viewMode === 'cards' ? '#ccff00' : '#64748b'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">
                                    <i class="fas fa-th-large"></i>
                                </button>
                                <button onclick="window.TournamentController.setViewMode('timeline')" 
                                        title="Vista Cronograma"
                                        style="background: ${viewMode === 'timeline' ? '#0f172a' : 'transparent'}; color: ${viewMode === 'timeline' ? '#ccff00' : '#64748b'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">
                                    <i class="fas fa-stream"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 🏷️ STATUS FILTER CHIPS (CON CONTADORES) -->
                        <div class="t-chips-row" style="display: flex; gap: 8px; margin-top: 14px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch;">
                            <button onclick="window.TournamentController.filterByStatus('all')" 
                                    class="t-chip-btn ${currentFilter === 'all' ? 'active' : ''}">
                                <span>Todos</span>
                                <span class="t-badge-count">${cAll}</span>
                            </button>
                            <button onclick="window.TournamentController.filterByStatus('Abiertas')" 
                                    class="t-chip-btn ${currentFilter === 'Abiertas' ? 'active' : ''}">
                                <span class="t-dot t-dot-green"></span>
                                <span>Abiertas</span>
                                <span class="t-badge-count">${cOpen}</span>
                            </button>
                            <button onclick="window.TournamentController.filterByStatus('En juego!')" 
                                    class="t-chip-btn ${currentFilter === 'En juego!' ? 'active' : ''}">
                                <span class="t-dot t-dot-red"></span>
                                <span>En juego</span>
                                <span class="t-badge-count">${cInGame}</span>
                            </button>
                            <button onclick="window.TournamentController.filterByStatus('Próximamente')" 
                                    class="t-chip-btn ${currentFilter === 'Próximamente' ? 'active' : ''}">
                                <span>Próximos</span>
                                <span class="t-badge-count">${cUpcoming}</span>
                            </button>
                            <button onclick="window.TournamentController.filterByStatus('Finalizado')" 
                                    class="t-chip-btn ${currentFilter === 'Finalizado' ? 'active' : ''}">
                                <span>Finalizados</span>
                                <span class="t-badge-count">${cFinished}</span>
                            </button>
                        </div>

                        <!-- 🏷️ CATEGORY QUICK FILTER CHIPS -->
                        <div style="display: flex; gap: 6px; margin-top: 10px; overflow-x: auto; padding-bottom: 4px;">
                            <span style="font-size: 0.7rem; font-weight: 900; color: #64748b; text-transform: uppercase; align-self: center; margin-right: 4px;">Categoría:</span>
                            <button onclick="window.TournamentController.filterByCategory('all')" class="t-cat-chip ${currentCategoryFilter === 'all' ? 'active' : ''}">Todas</button>
                            <button onclick="window.TournamentController.filterByCategory('masculina')" class="t-cat-chip ${currentCategoryFilter === 'masculina' ? 'active' : ''}">Masculina</button>
                            <button onclick="window.TournamentController.filterByCategory('femenin')" class="t-cat-chip ${currentCategoryFilter === 'femenin' ? 'active' : ''}">Femenina</button>
                            <button onclick="window.TournamentController.filterByCategory('mixt')" class="t-cat-chip ${currentCategoryFilter === 'mixt' ? 'active' : ''}">Mixta</button>
                        </div>
                    </div>

                    <!-- 🏟️ TOURNAMENT LIST / GRID -->
                    <div style="max-width: 1000px; margin: 20px auto 0 auto; padding: 0 16px;">
                        ${tournaments.length > 0 ? (
                            viewMode === 'cards' 
                                ? `<div class="tournaments-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                                       ${tournaments.map(t => this.renderTournamentCard(t)).join('')}
                                   </div>`
                                : `<div class="tournaments-timeline-list" style="display: flex; flex-direction: column; gap: 14px;">
                                       ${tournaments.map(t => this.renderTournamentTimelineItem(t)).join('')}
                                   </div>`
                        ) : `
                            <div style="background: white; border-radius: 20px; padding: 60px 20px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                                <div style="width: 70px; height: 70px; border-radius: 50%; background: #f8fafc; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #94a3b8; font-size: 2rem;">
                                    <i class="fas fa-medal"></i>
                                </div>
                                <h3 style="margin: 0 0 8px 0; color: #0f172a; font-weight: 900; font-size: 1.25rem;">No se encontraron torneos</h3>
                                <p style="color: #64748b; font-size: 0.85rem; max-width: 350px; margin: 0 auto 20px auto;">
                                    No hay eventos que coincidan con los filtros seleccionados. Prueba a cambiar el término de búsqueda o restablecer los filtros.
                                </p>
                                <button onclick="window.TournamentController.resetFilters()" 
                                        style="background: #0f172a; color: #ccff00; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 900; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <i class="fas fa-redo"></i> Restablecer Filtros
                                </button>
                            </div>
                        `}
                    </div>

                    <!-- 📌 MODAL DE DETALLES DEL TORNEO -->
                    <div id="tournament-detail-modal" class="t-modal-backdrop" style="display: none;" onclick="window.TournamentView.closeDetailsModal()">
                        <div class="t-modal-content" onclick="event.stopPropagation()">
                            <div id="tournament-detail-body"></div>
                        </div>
                    </div>

                    <!-- 🖼️ MODAL LIGHTBOX CARTEL -->
                    <div id="tournament-lightbox-modal" class="t-lightbox-backdrop" style="display: none;" onclick="this.style.display='none'">
                        <img id="tournament-lightbox-img" src="" style="max-width: 90vw; max-height: 85vh; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 2px solid #ccff00;">
                    </div>
                </div>

                <!-- 💎 STYLESHEET EMBEDDED -->
                <style>
                    .t-chip-btn {
                        background: #ffffff;
                        border: 1px solid #cbd5e1;
                        color: #475569;
                        padding: 8px 14px;
                        border-radius: 14px;
                        font-size: 0.78rem;
                        font-weight: 850;
                        white-space: nowrap;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .t-chip-btn:hover {
                        border-color: #94a3b8;
                        background: #f8fafc;
                    }
                    .t-chip-btn.active {
                        background: #0f172a;
                        color: #ffffff;
                        border-color: #0f172a;
                        box-shadow: 0 4px 12px rgba(15,23,42,0.18);
                    }
                    .t-chip-btn.active .t-badge-count {
                        background: #ccff00;
                        color: #000000;
                    }
                    .t-badge-count {
                        background: #f1f5f9;
                        color: #64748b;
                        padding: 1px 7px;
                        border-radius: 10px;
                        font-size: 0.7rem;
                        font-weight: 900;
                    }
                    .t-cat-chip {
                        background: transparent;
                        border: 1px solid #cbd5e1;
                        color: #64748b;
                        padding: 4px 10px;
                        border-radius: 8px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.15s;
                    }
                    .t-cat-chip.active {
                        background: #3b82f6;
                        color: white;
                        border-color: #3b82f6;
                    }
                    .t-dot {
                        width: 7px;
                        height: 7px;
                        border-radius: 50%;
                        display: inline-block;
                    }
                    .t-dot-green { background: #22c55e; }
                    .t-dot-red { background: #ef4444; }

                    .t-live-pulse-dot {
                        animation: tPulse 1.8s infinite;
                    }
                    @keyframes tPulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(204,255,0,0.7); }
                        70% { transform: scale(1.15); box-shadow: 0 0 0 7px rgba(204,255,0,0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(204,255,0,0); }
                    }

                    .t-card-item {
                        background: white;
                        border-radius: 20px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                        transition: all 0.25s ease;
                        position: relative;
                    }
                    .t-card-item:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 30px rgba(0,0,0,0.08);
                        border-color: #cbd5e1;
                    }

                    /* Modal Styles */
                    .t-modal-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(15,23,42,0.75);
                        backdrop-filter: blur(8px);
                        z-index: 99999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 16px;
                    }
                    .t-modal-content {
                        background: #ffffff;
                        width: 100%;
                        max-width: 580px;
                        max-height: 90vh;
                        border-radius: 24px;
                        overflow-y: auto;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.3);
                        position: relative;
                        animation: tModalSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    @keyframes tModalSlide {
                        from { opacity: 0; transform: translateY(20px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .t-lightbox-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0,0,0,0.92);
                        z-index: 100000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        cursor: zoom-out;
                    }
                </style>
            `;
        }

        // Renderizado en formato Card Deportiva Moderna
        renderTournamentCard(t) {
            const st = (t.status || '').toLowerCase();
            let statusBadge = '';

            if (st.includes('juego')) {
                statusBadge = `
                    <span style="background: rgba(239,68,68,0.92); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px);">
                        <span class="t-live-pulse-dot" style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>
                        EN JUEGO LIVE
                    </span>
                `;
            } else if (st.includes('abiert')) {
                statusBadge = `
                    <span style="background: rgba(22,163,74,0.92); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px);">
                        <span class="t-live-pulse-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #ccff00;"></span>
                        INSCRIPCIÓN ABIERTA
                    </span>
                `;
            } else if (st.includes('proxim') || st.includes('próxim')) {
                statusBadge = `
                    <span style="background: rgba(245,158,11,0.92); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px);">
                        PRÓXIMAMENTE
                    </span>
                `;
            } else {
                statusBadge = `
                    <span style="background: rgba(100,116,139,0.92); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px);">
                        FINALIZADO
                    </span>
                `;
            }

            // Desglosar categorías si vienen separadas por coma
            const categories = (t.category || 'Categoría Open').split(/[,y\/]/).map(c => c.trim()).filter(c => c.length > 0);

            return `
                <div class="t-card-item" onclick="window.TournamentController.openDetails('${t.id}')">
                    
                    <!-- 🖼️ COVER / POSTER TOP -->
                    <div style="position: relative; height: 180px; width: 100%; background: #0f172a; overflow: hidden; cursor: pointer;">
                        <img src="${t.poster || 'https://images.unsplash.com/photo-1592910129881-891178e4820c?auto=format&fit=crop&q=80&w=600'}" 
                             alt="${t.title}"
                             onerror="this.src='https://images.unsplash.com/photo-1592910129881-891178e4820c?auto=format&fit=crop&q=80&w=600'"
                             style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;"
                             onmouseover="this.style.transform='scale(1.05)'"
                             onmouseout="this.style.transform='scale(1)'">
                        
                        <!-- Gradient Overlay Sutil -->
                        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.4) 0%, transparent 60%);"></div>

                        <!-- Status Badge Top Right -->
                        <div style="position: absolute; top: 12px; right: 12px; z-index: 2;">
                            ${statusBadge}
                        </div>

                        <!-- Zoom Poster Icon Top Left -->
                        <button onclick="event.stopPropagation(); window.TournamentView.openLightbox('${t.poster}')" 
                                title="Ampliar Cartel"
                                style="position: absolute; top: 12px; left: 12px; z-index: 2; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.25); color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem;">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>

                    <!-- ℹ️ CARD BODY -->
                    <div style="padding: 18px 16px 16px 16px; display: flex; flex-direction: column; flex: 1; justify-content: space-between; gap: 12px;">
                        
                        <div>
                            <!-- Title -->
                            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 1.1rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; letter-spacing: -0.2px;">
                                ${t.title}
                            </h3>

                            <!-- Location & Dates Row -->
                            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 800; color: #0f172a;">
                                    <div style="width: 24px; height: 24px; border-radius: 6px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-map-marker-alt" style="font-size: 0.72rem;"></i>
                                    </div>
                                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.location || 'Sede por confirmar'}</span>
                                    <button onclick="event.stopPropagation(); window.TournamentController.openMaps('${t.location}')" 
                                            title="Ver en Google Maps"
                                            style="background: none; border: none; color: #0284c7; font-size: 0.75rem; cursor: pointer; padding: 2px 4px;">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>

                                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 800; color: #475569;">
                                    <div style="width: 26px; height: 26px; border-radius: 8px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="far fa-calendar-alt" style="font-size: 0.75rem;"></i>
                                    </div>
                                    <span>${t.dates || 'Fechas por determinar'}</span>
                                </div>
                            </div>

                            <!-- Categories Tags -->
                            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                                ${categories.slice(0, 3).map(cat => `
                                    <span style="background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0; font-size: 0.68rem; font-weight: 850; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                                        ${cat}
                                    </span>
                                `).join('')}
                                ${categories.length > 3 ? `
                                    <span style="background: #e2e8f0; color: #475569; font-size: 0.68rem; font-weight: 850; padding: 3px 6px; border-radius: 6px;">
                                        +${categories.length - 3}
                                    </span>
                                ` : ''}
                            </div>

                            <!-- Pro Badges (Ranking, Prizes, Welcome Pack) -->
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 0.72rem; color: #64748b;">
                                <div style="display: flex; align-items: center; gap: 4px; font-weight: 800; color: #059669;">
                                    <i class="fas fa-gift"></i>
                                    <span>${t.welcomePack ? 'Welcome Pack incluido' : 'Welcome Pack oficial'}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; font-weight: 800; color: #d97706;">
                                    <i class="fas fa-bolt"></i>
                                    <span>${t.rankingPoints ? `+${t.rankingPoints} pts Ranking` : 'Puntuable SomosPadel'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 🛠️ ACTIONS ROW -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
                            
                            <!-- Botón WhatsApp y Calendario -->
                            <div style="display: flex; gap: 6px;">
                                <button onclick="event.stopPropagation(); window.TournamentController.shareTournament('${t.id}')" 
                                        title="Compartir por WhatsApp con mi pareja"
                                        style="background: #25D366; color: white; border: none; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; cursor: pointer; box-shadow: 0 3px 8px rgba(37,211,102,0.25); transition: transform 0.15s;">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                                
                                <button onclick="event.stopPropagation(); window.TournamentController.addToCalendar('${t.id}')" 
                                        title="Añadir a mi Google Calendar"
                                        style="background: #f8fafc; color: #0284c7; border: 1px solid #cbd5e1; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; cursor: pointer; transition: all 0.15s;">
                                    <i class="far fa-calendar-plus"></i>
                                </button>
                            </div>

                            <!-- Botón Principal: Ver Detalles o Inscribirme -->
                            <div style="display: flex; gap: 6px; flex: 1; justify-content: flex-end;">
                                <button onclick="event.stopPropagation(); window.TournamentController.openDetails('${t.id}')" 
                                        style="background: #0f172a; color: #ccff00; border: none; padding: 0 16px; height: 38px; border-radius: 10px; font-weight: 950; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.6px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(15,23,42,0.15); transition: all 0.2s;">
                                    <span>INFO & PLAZAS</span>
                                    <i class="fas fa-chevron-right" style="font-size: 0.7rem;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Renderizado en formato Cronograma / Timeline
        renderTournamentTimelineItem(t) {
            const st = (t.status || '').toLowerCase();
            const isOpen = st.includes('abiert');
            const isInGame = st.includes('juego');

            return `
                <div class="t-timeline-item" onclick="window.TournamentController.openDetails('${t.id}')"
                     style="background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); cursor: pointer; transition: transform 0.2s;">
                    
                    <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                        <!-- Date Box -->
                        <div style="background: #0f172a; color: white; border-radius: 12px; width: 62px; height: 62px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; text-align: center; border: 1px solid rgba(204,255,0,0.3);">
                            <span style="font-size: 0.6rem; font-weight: 900; color: #ccff00; text-transform: uppercase;">FECHA</span>
                            <span style="font-size: 0.75rem; font-weight: 950; line-height: 1.1; margin-top: 2px;">${(t.dates || '').substring(0, 5)}</span>
                        </div>

                        <!-- Info -->
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                                <span style="font-size: 0.62rem; font-weight: 950; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background: ${isOpen ? '#dcfce7' : (isInGame ? '#fee2e2' : '#f1f5f9')}; color: ${isOpen ? '#15803d' : (isInGame ? '#b91c1c' : '#475569')};">
                                    ${t.status}
                                </span>
                                <span style="color: #64748b; font-size: 0.72rem; font-weight: 700;">${t.dates}</span>
                            </div>
                            <div style="font-size: 0.95rem; font-weight: 950; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                                ${t.title}
                            </div>
                            <div style="color: #64748b; font-size: 0.74rem; font-weight: 600; margin-top: 3px;">
                                <i class="fas fa-map-marker-alt" style="color: #0284c7;"></i> ${t.location}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button onclick="event.stopPropagation(); window.TournamentController.shareTournament('${t.id}')" 
                                style="background: #25D366; color: white; border: none; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer;">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <i class="fas fa-chevron-right" style="color: #cbd5e1; font-size: 0.9rem;"></i>
                    </div>
                </div>
            `;
        }

        // Modal con vista completa del torneo
        showDetailsModal(t) {
            const modal = document.getElementById('tournament-detail-modal');
            const body = document.getElementById('tournament-detail-body');
            if (!modal || !body) return;

            const st = (t.status || '').toLowerCase();
            const isOpen = st.includes('abiert');
            const hasLink = t.link && t.link !== '#';

            body.innerHTML = `
                <div style="position: relative; overflow: hidden; border-radius: 24px; background: white;">
                    <!-- Close Button -->
                    <button onclick="window.TournamentView.closeDetailsModal()" 
                            style="position: absolute; top: 16px; right: 16px; z-index: 10; background: rgba(0,0,0,0.6); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px);">
                        &times;
                    </button>

                    <!-- Poster Header with Zoom -->
                    <div style="position: relative; height: 260px; background: #0f172a; cursor: zoom-in;" onclick="window.TournamentView.openLightbox('${t.poster}')">
                        <img src="${t.poster || 'https://images.unsplash.com/photo-1592910129881-891178e4820c?auto=format&fit=crop&q=80&w=800'}" 
                             style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.2) 60%, transparent 100%);"></div>
                        
                        <div style="position: absolute; bottom: 16px; left: 20px; right: 20px;">
                            <span style="background: #ccff00; color: #000; font-size: 0.65rem; font-weight: 950; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                                ${t.status}
                            </span>
                            <h2 style="margin: 6px 0 0 0; color: white; font-size: 1.4rem; font-weight: 950; line-height: 1.2; text-transform: uppercase;">
                                ${t.title}
                            </h2>
                        </div>
                    </div>

                    <!-- Modal Details Content -->
                    <div style="padding: 22px 24px; display: flex; flex-direction: column; gap: 18px;">
                        
                        <!-- Fechas y Ubicación Destacadas -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px;">
                                <div style="color: #64748b; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Fechas del Torneo</div>
                                <div style="color: #0f172a; font-size: 0.9rem; font-weight: 950; margin-top: 4px;">
                                    <i class="far fa-calendar-alt" style="color: #d97706;"></i> ${t.dates}
                                </div>
                            </div>

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px;">
                                <div style="color: #64748b; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Sede Oficial</div>
                                <div style="color: #0f172a; font-size: 0.9rem; font-weight: 950; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    <i class="fas fa-map-marker-alt" style="color: #0284c7;"></i> ${t.location}
                                </div>
                                <button onclick="window.TournamentController.openMaps('${t.location}')" 
                                        style="background: none; border: none; color: #0284c7; font-size: 0.72rem; font-weight: 850; padding: 0; margin-top: 4px; cursor: pointer; text-decoration: underline;">
                                    Ver en Google Maps
                                </button>
                            </div>
                        </div>

                        <!-- Categorías en juego -->
                        <div>
                            <div style="font-size: 0.75rem; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                                Categorías Disponibles
                            </div>
                            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 14px; font-weight: 850; font-size: 0.85rem; color: #0f172a;">
                                🎾 ${t.category}
                            </div>
                        </div>

                        <!-- Premios & Welcome Pack -->
                        <div style="background: linear-gradient(135deg, #090e17 0%, #1e293b 100%); border-radius: 16px; padding: 16px; color: white;">
                            <div style="font-size: 0.72rem; font-weight: 900; color: #ccff00; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
                                🎁 PREMIOS & WELCOME PACK
                            </div>
                            <div style="font-size: 0.82rem; margin-bottom: 8px;">
                                <strong style="color: #facc15;">Premios:</strong> ${t.prize || 'Trofeos oficiales + Palas y material deportivo para campeones y subcampeones.'}
                            </div>
                            <div style="font-size: 0.82rem; margin-bottom: 8px;">
                                <strong style="color: #38bdf8;">Welcome Pack:</strong> ${t.welcomePack || 'Camiseta técnica de competición + Obsequios patrocinadores.'}
                            </div>
                            <div style="font-size: 0.82rem;">
                                <strong style="color: #a3e635;">Ranking SomosPadel:</strong> ${t.rankingPoints ? `Reparte +${t.rankingPoints} puntos de ranking oficial.` : 'Puntuable para el ranking general.'}
                            </div>
                        </div>

                        <!-- ¿Buscas Pareja? Sección Pro -->
                        <div style="background: #f0f9ff; border: 1px dashed #38bdf8; border-radius: 14px; padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div>
                                <div style="font-weight: 950; font-size: 0.85rem; color: #0369a1;">¿No tienes pareja para este torneo?</div>
                                <div style="font-size: 0.74rem; color: #0284c7; font-weight: 600;">Te asignamos un jugador/a compatible con tu nivel.</div>
                            </div>
                            <button onclick="window.TournamentController.findPartnerForTournament('${t.id}')"
                                    style="background: #0284c7; color: white; border: none; padding: 8px 14px; border-radius: 10px; font-weight: 900; font-size: 0.72rem; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 10px rgba(2,132,199,0.25);">
                                <i class="fas fa-handshake"></i> BUSCO PAREJA
                            </button>
                        </div>

                        <!-- Botonera Inferior -->
                        <div style="display: flex; gap: 10px; margin-top: 6px;">
                            <button onclick="window.TournamentController.shareTournament('${t.id}')" 
                                    style="flex: 1; background: #25D366; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i>
                                <span>COMPARTIR</span>
                            </button>

                            ${hasLink ? `
                                <button onclick="window.TournamentController.openOfficialLink('${t.id}')" 
                                        style="flex: 2; background: #ccff00; color: #000; border: none; padding: 12px; border-radius: 12px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(204,255,0,0.3);">
                                    <i class="fas fa-ticket-alt"></i>
                                    <span>INSCRIBIRSE AHORA</span>
                                </button>
                            ` : `
                                <button onclick="window.TournamentController.shareTournament('${t.id}')" 
                                        style="flex: 2; background: #0f172a; color: #ccff00; border: none; padding: 12px; border-radius: 12px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <i class="fas fa-info-circle"></i>
                                    <span>SOLICITAR INFO</span>
                                </button>
                            `}
                        </div>

                    </div>
                </div>
            `;

            modal.style.display = 'flex';
        }

        closeDetailsModal() {
            const modal = document.getElementById('tournament-detail-modal');
            if (modal) modal.style.display = 'none';
        }

        openLightbox(imgSrc) {
            const lb = document.getElementById('tournament-lightbox-modal');
            const img = document.getElementById('tournament-lightbox-img');
            if (lb && img) {
                img.src = imgSrc;
                lb.style.display = 'flex';
            }
        }
    }

    window.TournamentView = new TournamentView();
    console.log("✅ [TournamentView v2.0] Premier Sport Edition cargada correctamente");
})();
