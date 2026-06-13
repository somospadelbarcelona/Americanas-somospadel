/**
 * TournamentView.js
 * Premium "Even Padel Tour" Style Interface
 */
(function () {
    class TournamentView {
        constructor() {
            this.container = null;
            this.searchTerm = '';
        }

        render(tournaments) {
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            const filtered = tournaments.filter(t => 
                t.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                t.location.toLowerCase().includes(this.searchTerm.toLowerCase())
            );

            this.container.innerHTML = `
                <div class="tournaments-view-container animate-fade-in" style="background: #f8f9fa; min-height: 100vh; padding-bottom: 100px;">
                    
                    <!-- 🏟️ VIBRANT BLUE PADEL COURT BANNER -->
                    <div style="width: 100%; height: 140px; background: #004d99; overflow: hidden; position: relative; border-bottom: 3px solid #ccff00;">
                        <!-- The Image with Blue tint -->
                        <div style="position: absolute; inset: 0; background: #003366;">
                            <img src="img/pista_padel_azul.png" 
                                 onerror="this.style.display='none'; this.parentElement.style.background='#004d99';"
                                 style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; filter: saturate(1.2) brightness(0.8);">
                        </div>
                        
                        <!-- Padel Court Lines (CSS) - Blue Court Theme -->
                        <div style="position: absolute; inset: 0; pointer-events: none; opacity: 0.4;">
                            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 3px; background: white; box-shadow: 0 0 10px rgba(255,255,255,0.5);"></div>
                            <div style="position: absolute; top: 0; left: 50%; width: 3px; height: 100%; background: white; box-shadow: 0 0 10px rgba(255,255,255,0.5);"></div>
                        </div>

                        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(to bottom, rgba(0,51,102,0.2), rgba(0,0,0,0.5));">
                            <div style="text-align: center;">
                                <div style="font-size: 1.8rem; font-weight: 950; color: #ccff00; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 20px rgba(204,255,0,0.6);">TORNEOS</div>
                                <div style="font-size: 0.7rem; color: white; font-weight: 800; letter-spacing: 4px; opacity: 0.8;">SOMOSPADEL BCN</div>
                            </div>
                        </div>
                    </div>

                    <!-- 🔍 SEARCH BAR (EVEN STYLE) -->
                    <div style="background: #eef105; padding: 12px 20px; font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">
                        BUSCADOR
                    </div>
                    <div style="padding: 15px 20px; background: white; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                            <div style="flex: 1; border-right: 1px solid #eee; padding-right: 10px;">
                                <input type="text" 
                                       placeholder="Buscador de eventos" 
                                       onkeyup="window.TournamentView.handleSearch(this.value)"
                                       value="${this.searchTerm}"
                                       style="width: 100%; border: none; font-size: 1.1rem; color: #333; outline: none; font-family: 'Outfit', sans-serif;">
                            </div>
                            <!-- ⚡ PREMIUM SORT SELECTOR -->
                            <div style="position: relative; flex-shrink: 0; display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <i class="fas fa-sort-amount-down" style="color: #64748b; font-size: 0.85rem;"></i>
                                <select onchange="window.TournamentController.changeSort(this.value)" 
                                        style="border: none; font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 900; color: #111; outline: none; background: transparent; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <option value="newest" ${window.TournamentController.currentSort === 'newest' ? 'selected' : ''}>Más actuales</option>
                                    <option value="oldest" ${window.TournamentController.currentSort === 'oldest' ? 'selected' : ''}>Más antiguas</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- 🏷️ FILTER CHIPS -->
                        <div class="filter-chips" style="display: flex; gap: 8px; margin-top: 15px; overflow-x: auto; padding-bottom: 5px;">
                            <button onclick="window.TournamentController.filterByStatus('all', this)" class="t-filter-chip ${window.TournamentController.currentFilter === 'all' ? 'active' : ''}">Todas</button>
                            <button onclick="window.TournamentController.filterByStatus('Abiertas', this)" class="t-filter-chip ${window.TournamentController.currentFilter === 'Abiertas' ? 'active' : ''}">Abiertas</button>
                            <button onclick="window.TournamentController.filterByStatus('En juego!', this)" class="t-filter-chip ${window.TournamentController.currentFilter === 'En juego!' ? 'active' : ''}">En juego</button>
                            <button onclick="window.TournamentController.filterByStatus('Finalizado', this)" class="t-filter-chip ${window.TournamentController.currentFilter === 'Finalizado' ? 'active' : ''}">Finalizadas</button>
                        </div>
                    </div>

                    <style>
                        .t-filter-chip {
                            background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b;
                            padding: 6px 14px; border-radius: 20px; font-size: 0.7rem; font-weight: 800;
                            white-space: nowrap; cursor: pointer; transition: 0.2s;
                        }
                        .t-filter-chip.active {
                            background: #111; border-color: #111; color: #eef105;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        }
                    </style>

                    <!-- 🏟️ TOURNAMENT LIST -->
                    <div style="padding: 15px; display: flex; flex-direction: column; gap: 15px;">
                        ${filtered.length > 0 ? filtered.map(t => this.renderTournamentCard(t)).join('') : `
                            <div style="padding: 50px; text-align: center; color: #999;">
                                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.3;"></i>
                                <p>No se encontraron torneos disponibles</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderTournamentCard(t) {
            const statusColor = t.status === 'En juego!' ? '#00d2ff' : (t.status === 'Abiertas' ? '#84cc16' : '#999');
            
            return `
                <div class="tournament-card" 
                     onclick="window.TournamentController.showDetails('${t.id}')"
                     style="background: white; border-radius: 16px; display: flex; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #eee; transition: transform 0.2s ease; cursor: pointer; min-height: 200px;">
                    
                    <!-- 🖼️ POSTER LEFT (OPTIMIZED SIZE) -->
                    <div style="width: 150px; flex-shrink: 0; position: relative; background: #000;">
                        <img src="${t.poster || 'https://images.unsplash.com/photo-1592910129881-891178e4820c?auto=format&fit=crop&q=80&w=400'}" 
                             style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
                        
                        <!-- Left Status Accent -->
                        <div style="position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: ${statusColor};"></div>
                    </div>

                    <!-- ℹ️ INFO RIGHT (PREMIUM STYLE) -->
                    <div style="flex: 1; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                        <div>
                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 900; color: #111; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.3px;">
                                ${t.title}
                            </h3>
                            
                            <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
                                <span style="background: #eef105; color: black; padding: 4px 10px; border-radius: 15px; font-weight: 900; font-size: 0.65rem; text-transform: uppercase; border: 1px solid #000;">
                                    ${t.category || 'Torneo Open'}
                                </span>
                            </div>

                            <!-- DETAILS ROW -->
                            <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 6px;">
                                <div style="display: flex; align-items: center; gap: 8px; color: #555; font-size: 0.75rem; font-weight: 700;">
                                    <i class="fas fa-map-marker-alt" style="width: 14px; color: #888;"></i>
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.location}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; color: #555; font-size: 0.75rem; font-weight: 700;">
                                    <i class="far fa-calendar-alt" style="width: 14px; color: #888;"></i>
                                    <span>${t.dates}</span>
                                </div>
                            </div>
                        </div>

                        <!-- FOOTER ROW -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px;">
                            <div style="display: flex; gap: 8px;">
                                <button onclick="event.stopPropagation(); window.TournamentController.shareTournament('${t.id}')" 
                                        style="background: #25D366; color: white; border: none; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 10px rgba(37,211,102,0.2);">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                                <a href="${t.link || '#'}" target="_blank" onclick="event.stopPropagation()" 
                                   style="background: #111; color: #eef105; padding: 8px 14px; border-radius: 10px; font-weight: 950; font-size: 0.7rem; text-decoration: none; border: none; text-transform: uppercase; letter-spacing: 0.5px;">
                                    INFO
                                </a>
                            </div>

                            <span style="background: ${statusColor}15; color: ${statusColor}; padding: 3px 10px; border-radius: 6px; font-weight: 950; font-size: 0.6rem; border: 1px solid ${statusColor}44; text-transform: uppercase;">
                                ${t.status}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }

        handleSearch(query) {
            this.searchTerm = query;
            window.TournamentController.loadTournaments();
        }
    }

    window.TournamentView = new TournamentView();
})();
