/**
 * admin-season-campaign.js
 * Módulo de Administración para la Campaña de Temporada Octubre - Noviembre 2026.
 * SomosPadel Barcelona
 *
 * Permite al Administrador:
 * 1. Visualizar métricas en tiempo real (total solicitudes, pendientes, confirmadas, nivel medio).
 * 2. Gestionar solicitudes: cambiar estado (Pendiente / Contactado / Confirmado / Descartado).
 * 3. Enviar WhatsApp en 1-clic con plantillas personalizadas (bienvenida, prueba de nivel, plaza confirmada).
 * 4. Registrar solicitudes manuales (para llamadas o inscripciones a pie de pista).
 * 5. Filtrar por categoría, estado y búsqueda por nombre o teléfono.
 * 6. Exportar listados a CSV y copiar teléfonos para difusión.
 */

(function () {
    'use strict';
    console.log('🚀 [AdminSeasonCampaign] Cargando módulo de administración de campaña...');

    window.AdminViews = window.AdminViews || {};

    class AdminSeasonCampaignController {
        constructor() {
            this.inscriptions = [];
            this.filteredInscriptions = [];
            this.stats = null;
            this.activeCategoryFilter = 'all';
            this.activeStatusFilter = 'all';
            this.searchQuery = '';
            this.isLoading = false;
            this.isCampaignActive = false;
        }

        async init() {
            const contentArea = document.getElementById('content-area');
            if (!contentArea) return;

            contentArea.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;min-height:300px;"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem;color:#CCFF00;"></i></div>';

            await this.loadData();
            this.render();
        }

        async loadData() {
            this.isLoading = true;
            try {
                if (window.SeasonCampaignService) {
                    this.inscriptions = await window.SeasonCampaignService.getAllInscriptions();
                    this.stats = await window.SeasonCampaignService.getCampaignStats();
                    this.isCampaignActive = await window.SeasonCampaignService.isCampaignActive();
                } else {
                    this.inscriptions = [];
                    this.stats = { total: 0, byCategory: {}, byStatus: {}, averageLevel: 0 };
                    this.isCampaignActive = false;
                }
            } catch (err) {
                console.error('Error cargando inscripciones en admin:', err);
                this.inscriptions = [];
                this.isCampaignActive = false;
            } finally {
                this.isLoading = false;
                this._applyFilters();
            }
        }

        _applyFilters() {
            this.filteredInscriptions = this.inscriptions.filter(item => {
                // Filtro por categoría
                if (this.activeCategoryFilter !== 'all') {
                    const filter = this.activeCategoryFilter.toLowerCase();
                    const itemCat = ((item.category || '') + ' ' + (item.preferredDivision || '') + ' ' + (item.categoryId || '')).toLowerCase();
                    
                    if (filter === 'femenina') {
                        if (!itemCat.includes('femenin')) return false;
                    } else if (filter === 'mixta') {
                        if (!itemCat.includes('mixt')) return false;
                    } else if (filter === 'masculina') {
                        if (!itemCat.includes('masculin')) return false;
                    } else if (filter === 'femenina-2') {
                        if (!itemCat.includes('femenin') || (!itemCat.includes('2') && !itemCat.includes('segunda'))) return false;
                    } else if (filter === 'femenina-3') {
                        if (!itemCat.includes('femenin') || (!itemCat.includes('3') && !itemCat.includes('tercera'))) return false;
                    } else if (filter === 'femenina-4') {
                        if (!itemCat.includes('femenin') || (!itemCat.includes('4') && !itemCat.includes('cuarta'))) return false;
                    } else if (filter === 'mixta-3') {
                        if (!itemCat.includes('mixt') || (!itemCat.includes('3') && !itemCat.includes('tercera'))) return false;
                    } else if (filter === 'mixta-4') {
                        if (!itemCat.includes('mixt') || (!itemCat.includes('4') && !itemCat.includes('cuarta'))) return false;
                    } else if (filter === 'masculina-3') {
                        if (!itemCat.includes('masculin') || (!itemCat.includes('3') && !itemCat.includes('tercera'))) return false;
                    } else if (filter === 'masculina-4') {
                        if (!itemCat.includes('masculin') || (!itemCat.includes('4') && !itemCat.includes('cuarta'))) return false;
                    } else if (!itemCat.includes(filter)) {
                        return false;
                    }
                }

                // Filtro por estado
                if (this.activeStatusFilter !== 'all') {
                    const itemStatus = (item.status || 'pending').toLowerCase();
                    if (itemStatus !== this.activeStatusFilter.toLowerCase()) {
                        return false;
                    }
                }

                // Búsqueda por texto
                if (this.searchQuery.trim() !== '') {
                    const q = this.searchQuery.toLowerCase().trim();
                    const name = (item.name || '').toLowerCase();
                    const phone = (item.phone || '').toLowerCase();
                    const comments = (item.comments || '').toLowerCase();
                    if (!name.includes(q) && !phone.includes(q) && !comments.includes(q)) {
                        return false;
                    }
                }

                return true;
            });
        }

        render() {
            const contentArea = document.getElementById('content-area');
            if (!contentArea) return;

            const total = this.inscriptions.length;
            const pendingCount = this.inscriptions.filter(i => (i.status || 'pending') === 'pending').length;
            const contactedCount = this.inscriptions.filter(i => i.status === 'contacted').length;
            const confirmedCount = this.inscriptions.filter(i => i.status === 'confirmed').length;
            const avgLevel = this.stats ? (this.stats.averageLevel || 0) : 0;

            contentArea.innerHTML = `
                <div class="fade-in" style="padding-bottom: 40px; font-family: 'Outfit', sans-serif;">
                    <!-- HEADER HERO -->
                    <div style="background: linear-gradient(135deg, #090e1a 0%, #152238 100%); border: 1px solid rgba(204,255,0,0.3); border-radius: 20px; padding: 26px 28px; margin-bottom: 22px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                <span style="background:#CCFF00; color:#000; font-size:0.65rem; font-weight:950; padding:3px 9px; border-radius:8px; text-transform:uppercase;">
                                    🔥 TEMPORADA 2027 | EQUIPOS
                                </span>
                                <span style="color:#94a3b8; font-size:0.75rem; font-weight:700;">Inscripciones Oficiales SomosPadel BCN</span>
                            </div>
                            <h1 style="margin: 0; font-size: 1.55rem; font-weight: 950; color: #fff; line-height: 1.2;">
                                INSCRIPCIONES EQUIPOS <span style="color:#CCFF00;">TEMPORADA 2027</span>
                            </h1>
                            <p style="margin: 6px 0 0; color: #94a3b8; font-size: 0.8rem;">
                                Convocatoria y selección de plazas para los equipos de competición (Octubre - Noviembre 2027).
                            </p>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button onclick="window.AdminSeasonCampaign.openManualModal()" style="background:#CCFF00; color:#000; border:none; padding:10px 16px; border-radius:12px; font-weight:900; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(204,255,0,0.3);">
                                <i class="fas fa-user-plus"></i> AÑADIR JUGADOR
                            </button>
                            <button onclick="window.AdminSeasonCampaign.exportExcel()" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.4); padding:10px 15px; border-radius:12px; font-weight:800; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(34,197,94,0.15);">
                                <i class="fas fa-file-excel" style="color:#22c55e; font-size:0.95rem;"></i> EXPORTAR EXCEL
                            </button>
                            <button onclick="window.AdminSeasonCampaign.copyPhones()" style="background:rgba(255,255,255,0.08); color:#fff; border:1px solid rgba(255,255,255,0.15); padding:10px 14px; border-radius:12px; font-weight:800; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <i class="fab fa-whatsapp" style="color:#25d366;"></i> COPIAR TELÉFONOS
                            </button>
                            <button onclick="window.AdminSeasonCampaign.init()" title="Recargar" style="background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1); width:40px; height:40px; border-radius:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-rotate"></i>
                            </button>
                        </div>
                    </div>

                    <!-- BANNER INTERRUPTOR DE VISIBILIDAD EN INICIO -->
                    <div style="background: ${this.isCampaignActive ? 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}; border: 1.5px solid ${this.isCampaignActive ? '#22c55e' : '#475569'}; border-radius: 16px; padding: 18px 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: ${this.isCampaignActive ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.1)'}; color: ${this.isCampaignActive ? '#4ade80' : '#94a3b8'}; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                                <i class="${this.isCampaignActive ? 'fas fa-eye' : 'fas fa-eye-slash'}"></i>
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 900; font-size: 0.95rem; color: #ffffff;">VISIBILIDAD EN EL MENÚ DE INICIO</span>
                                    <span style="background: ${this.isCampaignActive ? '#22c55e' : '#64748b'}; color: ${this.isCampaignActive ? '#000000' : '#ffffff'}; font-size: 0.65rem; font-weight: 950; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.5px;">
                                        ${this.isCampaignActive ? '🟢 ACTIVADA (VISIBLE EN INICIO)' : '🔴 DESACTIVADA (OCULTA EN INICIO)'}
                                    </span>
                                </div>
                                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem;">
                                    ${this.isCampaignActive ? 'El banner promocional y el modal de inscripciones están actualmente visibles para todos los jugadores en la app.' : 'El banner de la campaña está actualmente oculto para los jugadores. Actívalo cuando quieras abrir inscripciones.'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <button onclick="window.AdminSeasonCampaign.toggleCampaignActive()" style="
                                background: ${this.isCampaignActive ? 'rgba(239,68,68,0.15)' : '#CCFF00'};
                                color: ${this.isCampaignActive ? '#fca5a5' : '#000000'};
                                border: 1px solid ${this.isCampaignActive ? 'rgba(239,68,68,0.4)' : '#CCFF00'};
                                padding: 11px 22px;
                                border-radius: 12px;
                                font-weight: 950;
                                font-size: 0.85rem;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                box-shadow: ${this.isCampaignActive ? 'none' : '0 4px 18px rgba(204,255,0,0.3)'};
                                transition: all 0.2s;
                            ">
                                <i class="${this.isCampaignActive ? 'fas fa-eye-slash' : 'fas fa-rocket'}"></i>
                                ${this.isCampaignActive ? 'OCULTAR / DESACTIVAR DE INICIO' : 'ACTIVAR EN INICIO 🚀'}
                            </button>
                        </div>
                    </div>

                    <!-- KPI CARDS -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 22px;">
                        <!-- Total -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase;">Total Solicitudes</span>
                                <span style="background:rgba(59,130,246,0.1); color:#3b82f6; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.85rem;"><i class="fas fa-users"></i></span>
                            </div>
                            <div style="font-size:1.8rem; font-weight:950; color:#0f172a;">${total}</div>
                            <div style="font-size:0.7rem; color:#10b981; font-weight:700; margin-top:2px;">Campaña Activa</div>
                        </div>

                        <!-- Pendientes -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase;">Pendientes</span>
                                <span style="background:rgba(245,158,11,0.1); color:#f59e0b; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.85rem;"><i class="fas fa-clock"></i></span>
                            </div>
                            <div style="font-size:1.8rem; font-weight:950; color:#f59e0b;">${pendingCount}</div>
                            <div style="font-size:0.7rem; color:#64748b; font-weight:600; margin-top:2px;">Por revisar / contactar</div>
                        </div>

                        <!-- Contactados -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase;">En Prueba / Hablados</span>
                                <span style="background:rgba(14,165,233,0.1); color:#0ea5e9; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.85rem;"><i class="fas fa-comments"></i></span>
                            </div>
                            <div style="font-size:1.8rem; font-weight:950; color:#0ea5e9;">${contactedCount}</div>
                            <div style="font-size:0.7rem; color:#64748b; font-weight:600; margin-top:2px;">Seguimiento en curso</div>
                        </div>

                        <!-- Confirmados -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase;">Plazas Confirmadas</span>
                                <span style="background:rgba(16,185,129,0.1); color:#10b981; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.85rem;"><i class="fas fa-check-circle"></i></span>
                            </div>
                            <div style="font-size:1.8rem; font-weight:950; color:#10b981;">${confirmedCount}</div>
                            <div style="font-size:0.7rem; color:#10b981; font-weight:700; margin-top:2px;">Listos para competir</div>
                        </div>

                        <!-- Nivel Promedio -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase;">Nivel Medio</span>
                                <span style="background:rgba(168,85,247,0.1); color:#a855f7; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.85rem;"><i class="fas fa-chart-line"></i></span>
                            </div>
                            <div style="font-size:1.8rem; font-weight:950; color:#a855f7;">${avgLevel > 0 ? avgLevel.toFixed(1) : '3.5'}</div>
                            <div style="font-size:0.7rem; color:#64748b; font-weight:600; margin-top:2px;">Rango 1.0 - 7.0</div>
                        </div>
                    </div>

                    <!-- FILTROS Y BUSCADOR -->
                    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:16px 20px; margin-bottom:18px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                        <!-- Buscador -->
                        <div style="flex:1; min-width:220px; position:relative;">
                            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;"></i>
                            <input type="text" placeholder="Buscar por nombre, teléfono o notas..." value="${this.searchQuery}" oninput="window.AdminSeasonCampaign.onSearch(this.value)" style="width:100%; padding:9px 12px 9px 34px; border-radius:10px; border:1px solid #cbd5e1; font-size:0.82rem; font-family:'Outfit',sans-serif; outline:none; box-sizing:border-box;">
                        </div>

                        <!-- Filtro Categoría -->
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:0.75rem; font-weight:800; color:#64748b;">Categoría:</span>
                            <select onchange="window.AdminSeasonCampaign.onCategoryFilter(this.value)" style="padding:9px 12px; border-radius:10px; border:1px solid #cbd5e1; font-size:0.8rem; font-family:'Outfit',sans-serif; background:#fff; font-weight:700; outline:none;">
                                <option value="all" ${this.activeCategoryFilter === 'all' ? 'selected' : ''}>Todas las categorías</option>
                                <optgroup label="🚺 Femenina">
                                    <option value="femenina" ${this.activeCategoryFilter === 'femenina' ? 'selected' : ''}>Todas Femeninas</option>
                                    <option value="femenina-2" ${this.activeCategoryFilter === 'femenina-2' ? 'selected' : ''}>2ª Femenina (3.5 - 4.5)</option>
                                    <option value="femenina-3" ${this.activeCategoryFilter === 'femenina-3' ? 'selected' : ''}>3ª Femenina (2.75 - 3.5)</option>
                                    <option value="femenina-4" ${this.activeCategoryFilter === 'femenina-4' ? 'selected' : ''}>4ª Femenina (2.0 - 2.75)</option>
                                </optgroup>
                                <optgroup label="🚻 Mixta">
                                    <option value="mixta" ${this.activeCategoryFilter === 'mixta' ? 'selected' : ''}>Todas Mixtas</option>
                                    <option value="mixta-3" ${this.activeCategoryFilter === 'mixta-3' ? 'selected' : ''}>3ª Mixta (2.75 - 3.75)</option>
                                    <option value="mixta-4" ${this.activeCategoryFilter === 'mixta-4' ? 'selected' : ''}>4ª Mixta (2.0 - 2.75)</option>
                                </optgroup>
                                <optgroup label="🏆 Masculina">
                                    <option value="masculina" ${this.activeCategoryFilter === 'masculina' ? 'selected' : ''}>Todas Masculinas</option>
                                    <option value="masculina-3" ${this.activeCategoryFilter === 'masculina-3' ? 'selected' : ''}>3ª Masculina (3.0 - 3.75)</option>
                                    <option value="masculina-4" ${this.activeCategoryFilter === 'masculina-4' ? 'selected' : ''}>4ª Masculina (2.0 - 3.0)</option>
                                </optgroup>
                                <optgroup label="Módulos de Apoyo">
                                    <option value="entreno" ${this.activeCategoryFilter === 'entreno' ? 'selected' : ''}>🎯 Entrenos Tecnificación</option>
                                    <option value="american" ${this.activeCategoryFilter === 'american' ? 'selected' : ''}>⚡ Americanas Express</option>
                                </optgroup>
                            </select>
                        <!-- Filtro Estado -->
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:0.75rem; font-weight:800; color:#64748b;">Estado:</span>
                            <select onchange="window.AdminSeasonCampaign.onStatusFilter(this.value)" style="padding:9px 12px; border-radius:10px; border:1px solid #cbd5e1; font-size:0.8rem; font-family:'Outfit',sans-serif; background:#fff; font-weight:700; outline:none;">
                                <option value="all" ${this.activeStatusFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
                                <option value="pending" ${this.activeStatusFilter === 'pending' ? 'selected' : ''}>⏳ Pendiente</option>
                                <option value="contacted" ${this.activeStatusFilter === 'contacted' ? 'selected' : ''}>💬 Contactado / Prueba</option>
                                <option value="confirmed" ${this.activeStatusFilter === 'confirmed' ? 'selected' : ''}>✅ Confirmado</option>
                                <option value="rejected" ${this.activeStatusFilter === 'rejected' ? 'selected' : ''}>❌ Descartado</option>
                            </select>
                        </div>
                    </div>

                    <!-- BOTONES DE FILTRO RÁPIDO POR DIVISIÓN -->
                    <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:18px; scrollbar-width:thin;">
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('all')" style="background:${this.activeCategoryFilter === 'all' ? '#0f172a' : '#ffffff'}; color:${this.activeCategoryFilter === 'all' ? '#CCFF00' : '#475569'}; border:1px solid ${this.activeCategoryFilter === 'all' ? '#0f172a' : '#cbd5e1'}; padding:7px 14px; border-radius:12px; font-weight:900; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s; box-shadow:0 2px 5px rgba(0,0,0,0.03);">
                            Todas (${total})
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('femenina-2')" style="background:${this.activeCategoryFilter === 'femenina-2' ? '#db2777' : '#ffffff'}; color:${this.activeCategoryFilter === 'femenina-2' ? '#ffffff' : '#db2777'}; border:1px solid #f472b6; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🚺 2ª Femenina
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('femenina-3')" style="background:${this.activeCategoryFilter === 'femenina-3' ? '#db2777' : '#ffffff'}; color:${this.activeCategoryFilter === 'femenina-3' ? '#ffffff' : '#db2777'}; border:1px solid #f472b6; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🚺 3ª Femenina
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('femenina-4')" style="background:${this.activeCategoryFilter === 'femenina-4' ? '#db2777' : '#ffffff'}; color:${this.activeCategoryFilter === 'femenina-4' ? '#ffffff' : '#db2777'}; border:1px solid #f472b6; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🚺 4ª Femenina
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('mixta-3')" style="background:${this.activeCategoryFilter === 'mixta-3' ? '#0284c7' : '#ffffff'}; color:${this.activeCategoryFilter === 'mixta-3' ? '#ffffff' : '#0284c7'}; border:1px solid #38bdf8; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🚻 3ª Mixta
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('mixta-4')" style="background:${this.activeCategoryFilter === 'mixta-4' ? '#0284c7' : '#ffffff'}; color:${this.activeCategoryFilter === 'mixta-4' ? '#ffffff' : '#0284c7'}; border:1px solid #38bdf8; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🚻 4ª Mixta
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('masculina-3')" style="background:${this.activeCategoryFilter === 'masculina-3' ? '#15803d' : '#ffffff'}; color:${this.activeCategoryFilter === 'masculina-3' ? '#ffffff' : '#15803d'}; border:1px solid #4ade80; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🏆 3ª Masculina
                        </button>
                        <button onclick="window.AdminSeasonCampaign.onCategoryFilter('masculina-4')" style="background:${this.activeCategoryFilter === 'masculina-4' ? '#15803d' : '#ffffff'}; color:${this.activeCategoryFilter === 'masculina-4' ? '#ffffff' : '#15803d'}; border:1px solid #4ade80; padding:7px 14px; border-radius:12px; font-weight:800; font-size:0.75rem; cursor:pointer; white-space:nowrap; transition:all 0.15s;">
                            🏆 4ª Masculina
                        </button>
                    </div>

                    <!-- TABLA PRINCIPAL DE SOLICITUDES -->
                    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
                        <div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-weight:900; font-size:0.9rem; color:#0f172a; display:flex; align-items:center; gap:8px;">
                                <span>SOLICITUDES REGISTRADAS</span>
                                <span style="background:#f1f5f9; color:#475569; font-size:0.75rem; padding:2px 8px; border-radius:10px;">
                                    ${this.filteredInscriptions.length} de ${total}
                                </span>
                            </div>
                        </div>

                        ${this._renderTableHtml()}
                    </div>
                </div>

                <!-- MODAL PARA ALTA MANUAL DE JUGADOR -->
                <div id="modal-manual-campaign-inscription" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:99999; align-items:center; justify-content:center; padding:15px;">
                    <div style="background:#0f172a; border:1px solid rgba(204,255,0,0.3); border-radius:20px; max-width:480px; width:100%; color:#fff; padding:24px; box-shadow:0 25px 50px rgba(0,0,0,0.6); position:relative;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                            <div style="font-weight:900; font-size:1.05rem; color:#CCFF00;">➕ REGISTRAR PRE-INSCRIPCIÓN MANUAL</div>
                            <button onclick="window.AdminSeasonCampaign.closeManualModal()" style="background:none; border:none; color:#94a3b8; font-size:1.1rem; cursor:pointer;">✕</button>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            <div>
                                <label style="font-size:0.7rem; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">NOMBRE DEL JUGADOR *</label>
                                <input type="text" id="manual-player-name" placeholder="Ej: Alex Cascolín" style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:#fff; box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="font-size:0.7rem; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">TELÉFONO MÓVIL *</label>
                                <input type="tel" id="manual-player-phone" placeholder="Ej: 649219350" style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:#fff; box-sizing:border-box;">
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                <div>
                                    <label style="font-size:0.7rem; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">NIVEL (1.0 - 7.0)</label>
                                    <input type="number" id="manual-player-level" step="0.5" value="3.5" min="1.0" max="7.0" style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:#fff; box-sizing:border-box;">
                                </div>
                                <div>
                                    <label style="font-size:0.7rem; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">ESTADO INICIAL</label>
                                    <select id="manual-player-status" style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); background:#1e293b; color:#fff; box-sizing:border-box;">
                                        <option value="confirmed">✅ Confirmado</option>
                                        <option value="contacted">💬 Contactado</option>
                                        <option value="pending" selected>⏳ Pendiente</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style="font-size:0.7rem; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">CATEGORÍA / EQUIPO *</label>
                                <select id="manual-player-category" style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); background:#1e293b; color:#fff; box-sizing:border-box;">
                                    <optgroup label="🚺 Equipos Femeninos">
                                        <option value="Femenina 2ª División" selected>🚺 Femenina 2ª División (3.5 - 4.5)</option>
                                        <option value="Femenina 3ª División">🎾 Femenina 3ª División (2.75 - 3.5)</option>
                                        <option value="Femenina 4ª División">✨ Femenina 4ª División (2.0 - 2.75)</option>
                                    </optgroup>
                                    <optgroup label="🚻 Equipos Mixtos">
                                        <option value="Mixta 3ª División">🚻 Mixta 3ª División (2.75 - 3.75)</option>
                                        <option value="Mixta 4ª División">⚡ Mixta 4ª División (2.0 - 2.75)</option>
                                    </optgroup>
                                    <optgroup label="🏆 Equipos Masculinos">
                                        <option value="Masculina 3ª División">🏆 Masculina 3ª División (3.0 - 3.75)</option>
                                        <option value="Masculina 4ª División">🛡️ Masculina 4ª División (2.0 - 3.0)</option>
                                    </optgroup>
                                    <optgroup label="Módulos de Apoyo">
                                        <option value="Entrenos de Tecnificación">🎯 Entrenos de Tecnificación</option>
                                        <option value="Americanas Express">⚡ Americanas Express</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.7rem; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">NOTAS / DISPONIBILIDAD</label>
                                <textarea id="manual-player-comments" placeholder="Ej: Juega en el revés, prefiere entrenar martes y jueves..." style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:#fff; min-height:60px; box-sizing:border-box;"></textarea>
                            </div>
                            <div id="manual-modal-error" style="color:#ef4444; font-size:0.75rem; font-weight:800; display:none;"></div>
                            <div style="display:flex; gap:10px; margin-top:8px;">
                                <button onclick="window.AdminSeasonCampaign.submitManualForm()" style="flex:1; background:#CCFF00; color:#000; border:none; padding:12px; border-radius:10px; font-weight:900; cursor:pointer;">GUARDAR EN BASE DE DATOS</button>
                                <button onclick="window.AdminSeasonCampaign.closeManualModal()" style="background:rgba(255,255,255,0.1); color:#fff; border:none; padding:12px 18px; border-radius:10px; font-weight:800; cursor:pointer;">CANCELAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _renderTableHtml() {
            if (this.filteredInscriptions.length === 0) {
                return `
                    <div style="text-align:center; padding:50px 20px; color:#64748b;">
                        <i class="fas fa-inbox" style="font-size:2.5rem; color:#cbd5e1; margin-bottom:12px; display:block;"></i>
                        <div style="font-weight:800; font-size:0.95rem; color:#0f172a;">No hay solicitudes que coincidan</div>
                        <div style="font-size:0.8rem; margin-top:4px;">Prueba a cambiar los filtros o registra la primera pre-inscripción.</div>
                    </div>
                `;
            }

            return `
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.8rem;">
                        <thead>
                            <tr style="background:#f8fafc; color:#64748b; font-weight:800; text-transform:uppercase; font-size:0.68rem; letter-spacing:0.5px;">
                                <th style="padding:12px 16px;">Jugador</th>
                                <th style="padding:12px 16px;">Nivel</th>
                                <th style="padding:12px 16px;">Categoría / Preferencia</th>
                                <th style="padding:12px 16px;">Contacto</th>
                                <th style="padding:12px 16px;">Estado</th>
                                <th style="padding:12px 16px;">Notas</th>
                                <th style="padding:12px 16px; text-align:right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.filteredInscriptions.map(item => this._renderRowHtml(item)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        _renderRowHtml(item) {
            const id = item.id || '';
            const name = item.name || 'Sin nombre';
            const phone = item.phone || '';
            const level = parseFloat(item.level || 3.5).toFixed(1);
            const category = item.category || 'General';
            const division = item.preferredDivision || '';
            const comments = item.comments || '—';
            const status = item.status || 'pending';

            let statusBadge = '';
            if (status === 'confirmed') {
                statusBadge = '<span style="background:#dcfce7; color:#15803d; padding:4px 9px; border-radius:8px; font-weight:900; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-check"></i> CONFIRMADO</span>';
            } else if (status === 'contacted') {
                statusBadge = '<span style="background:#e0f2fe; color:#0369a1; padding:4px 9px; border-radius:8px; font-weight:900; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-comments"></i> CONTACTADO</span>';
            } else if (status === 'rejected') {
                statusBadge = '<span style="background:#fee2e2; color:#b91c1c; padding:4px 9px; border-radius:8px; font-weight:900; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-times"></i> DESCARTADO</span>';
            } else {
                statusBadge = '<span style="background:#fef3c7; color:#b45309; padding:4px 9px; border-radius:8px; font-weight:900; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-clock"></i> PENDIENTE</span>';
            }

            let waUrl = '#';
            if (window.SeasonCampaignService && phone) {
                waUrl = window.SeasonCampaignService.buildPlayerContactWhatsApp(item, 'welcome');
            }

            return `
                <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding:12px 16px;">
                        <div style="font-weight:800; color:#0f172a;">${name}</div>
                        <div style="font-size:0.68rem; color:#94a3b8;">${this._formatDate(item.createdAt || item.clientTimestamp)}</div>
                    </td>
                    <td style="padding:12px 16px;">
                        <span style="background:#0f172a; color:#CCFF00; font-weight:900; padding:3px 8px; border-radius:6px; font-size:0.75rem;">
                            ${level}
                        </span>
                    </td>
                    <td style="padding:12px 16px;">
                        <div style="font-weight:700; color:#1e293b;">${category}</div>
                        ${division ? `<div style="font-size:0.68rem; color:#64748b;">${division}</div>` : ''}
                    </td>
                    <td style="padding:12px 16px;">
                        <div style="font-family:monospace; font-weight:700; color:#334155;">${phone}</div>
                    </td>
                    <td style="padding:12px 16px;">
                        ${statusBadge}
                    </td>
                    <td style="padding:12px 16px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#64748b;" title="${comments}">
                        ${comments}
                    </td>
                    <td style="padding:12px 16px; text-align:right;">
                        <div style="display:inline-flex; gap:6px; align-items:center;">
                            <!-- WhatsApp -->
                            <a href="${waUrl}" target="_blank" title="Abrir chat WhatsApp con jugador" style="background:#25d366; color:#fff; width:30px; height:30px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; font-size:0.85rem; box-shadow:0 2px 6px rgba(37,211,102,0.3);">
                                <i class="fab fa-whatsapp"></i>
                            </a>

                            <!-- Selector de estado rápido -->
                            <select onchange="window.AdminSeasonCampaign.changeStatus('${id}', this.value)" style="padding:5px 8px; border-radius:8px; border:1px solid #cbd5e1; font-size:0.72rem; font-family:'Outfit',sans-serif; background:#fff; font-weight:700; outline:none;">
                                <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Pendiente</option>
                                <option value="contacted" ${status === 'contacted' ? 'selected' : ''}>💬 Contactado</option>
                                <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>✅ Confirmado</option>
                                <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>❌ Descartar</option>
                            </select>

                            <!-- Eliminar -->
                            <button onclick="window.AdminSeasonCampaign.deleteItem('${id}', '${name.replace(/'/g, "\\'")}')" title="Eliminar solicitud" style="background:rgba(239,68,68,0.08); color:#ef4444; border:1px solid rgba(239,68,68,0.2); width:30px; height:30px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        _formatDate(dateVal) {
            if (!dateVal) return 'Fecha desc.';
            try {
                if (dateVal.toDate) dateVal = dateVal.toDate();
                else if (typeof dateVal === 'string') dateVal = new Date(dateVal);
                return dateVal.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                return 'Reciente';
            }
        }

        onSearch(val) {
            this.searchQuery = val || '';
            this._applyFilters();
            const container = document.querySelector('#content-area table tbody');
            if (container) {
                container.innerHTML = this.filteredInscriptions.map(item => this._renderRowHtml(item)).join('');
            } else {
                this.render();
            }
        }

        onCategoryFilter(cat) {
            this.activeCategoryFilter = cat;
            this._applyFilters();
            this.render();
        }

        onStatusFilter(st) {
            this.activeStatusFilter = st;
            this._applyFilters();
            this.render();
        }

        async changeStatus(id, newStatus) {
            if (!id) return;
            try {
                if (window.SeasonCampaignService) {
                    await window.SeasonCampaignService.updateInscriptionStatus(id, newStatus);
                }
                const item = this.inscriptions.find(i => i.id === id);
                if (item) item.status = newStatus;
                this._applyFilters();
                this.render();
            } catch (e) {
                alert('Error al actualizar estado: ' + e.message);
            }
        }

        async deleteItem(id, name) {
            if (!confirm(`¿Eliminar la solicitud de ${name}? Esta acción no se puede deshacer.`)) return;
            try {
                if (window.SeasonCampaignService) {
                    await window.SeasonCampaignService.deleteInscription(id);
                }
                this.inscriptions = this.inscriptions.filter(i => i.id !== id);
                this._applyFilters();
                this.render();
            } catch (e) {
                alert('Error al eliminar: ' + e.message);
            }
        }

        openManualModal() {
            const modal = document.getElementById('modal-manual-campaign-inscription');
            if (modal) modal.style.display = 'flex';
        }

        closeManualModal() {
            const modal = document.getElementById('modal-manual-campaign-inscription');
            if (modal) modal.style.display = 'none';
        }

        async submitManualForm() {
            const name = (document.getElementById('manual-player-name')?.value || '').trim();
            const phone = (document.getElementById('manual-player-phone')?.value || '').trim();
            const level = parseFloat(document.getElementById('manual-player-level')?.value || 3.5);
            const status = document.getElementById('manual-player-status')?.value || 'confirmed';
            const category = document.getElementById('manual-player-category')?.value || 'Masculina 2ª División';
            const comments = (document.getElementById('manual-player-comments')?.value || '').trim();
            const errEl = document.getElementById('manual-modal-error');

            if (!name || name.length < 2) {
                if (errEl) { errEl.textContent = 'Indica el nombre del jugador.'; errEl.style.display = 'block'; }
                return;
            }
            if (!phone || phone.replace(/\D/g, '').length < 9) {
                if (errEl) { errEl.textContent = 'Indica un teléfono móvil válido (mínimo 9 dígitos).'; errEl.style.display = 'block'; }
                return;
            }

            try {
                const payload = {
                    name,
                    phone,
                    level,
                    category,
                    status,
                    comments: comments || 'Alta manual por dirección / administración',
                    preferredDivision: category,
                    source: 'admin_manual'
                };

                if (window.SeasonCampaignService) {
                    const res = await window.SeasonCampaignService.submitTeamInscription(payload);
                    if (res && res.id && status !== 'pending') {
                        await window.SeasonCampaignService.updateInscriptionStatus(res.id, status);
                    }
                }

                this.closeManualModal();
                await this.loadData();
                this.render();
            } catch (e) {
                if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
            }
        }

        exportExcel() {
            if (this.inscriptions.length === 0) {
                alert('No hay solicitudes de equipos para exportar.');
                return;
            }

            const formattedRows = this.inscriptions.map((item, index) => {
                let st = 'Pendiente';
                if (item.status === 'confirmed') st = 'Confirmado';
                else if (item.status === 'contacted') st = 'Contactado / Prueba';
                else if (item.status === 'rejected') st = 'Descartado';

                return {
                    'Nº': index + 1,
                    'Temporada': '2027 (Oct-Nov)',
                    'Jugador': item.name || '',
                    'Teléfono': item.phone || '',
                    'Nivel': parseFloat(item.level || 3.5),
                    'Categoría Equipo': item.category || '',
                    'Preferencia / División': item.preferredDivision || '',
                    'Estado': st,
                    'Disponibilidad / Notas': item.comments || '',
                    'Fecha Registro': this._formatDate(item.createdAt || item.clientTimestamp)
                };
            });

            // Si SheetJS (XLSX) está disponible globalmente en admin.html
            if (typeof window.XLSX !== 'undefined') {
                try {
                    const ws = window.XLSX.utils.json_to_sheet(formattedRows);
                    ws['!cols'] = [
                        { wch: 5 },  // Nº
                        { wch: 16 }, // Temporada
                        { wch: 25 }, // Jugador
                        { wch: 14 }, // Teléfono
                        { wch: 8 },  // Nivel
                        { wch: 28 }, // Categoría
                        { wch: 24 }, // División
                        { wch: 20 }, // Estado
                        { wch: 40 }, // Notas
                        { wch: 18 }  // Fecha
                    ];
                    const wb = window.XLSX.utils.book_new();
                    window.XLSX.utils.book_append_sheet(wb, ws, "Equipos Temporada 2027");
                    const dateStr = new Date().toISOString().slice(0, 10);
                    window.XLSX.writeFile(wb, `Inscripciones_Equipos_Temporada_2027_SomosPadel_${dateStr}.xlsx`);
                    return;
                } catch (err) {
                    console.warn('Fallo SheetJS, usando fallback XML Excel:', err);
                }
            }

            // Fallback nativo: Hoja de cálculo Excel XML (.xls/.xlsx compatible con MS Excel)
            const headers = Object.keys(formattedRows[0]);
            let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
            xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
            xml += '<Worksheet ss:Name="Equipos 2027"><Table>';
            xml += '<Row>' + headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('') + '</Row>';
            formattedRows.forEach(row => {
                xml += '<Row>' + headers.map(h => {
                    const val = String(row[h] || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const type = typeof row[h] === 'number' ? 'Number' : 'String';
                    return `<Cell><Data ss:Type="${type}">${val}</Data></Cell>`;
                }).join('') + '</Row>';
            });
            xml += '</Table></Worksheet></Workbook>';

            const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Inscripciones_Equipos_Temporada_2027_SomosPadel_${new Date().toISOString().slice(0, 10)}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        }

        copyPhones() {
            const phones = this.inscriptions
                .map(i => (i.phone || '').replace(/\D/g, ''))
                .filter(p => p.length >= 9);

            const uniquePhones = Array.from(new Set(phones));

            if (uniquePhones.length === 0) {
                alert('No hay teléfonos disponibles.');
                return;
            }

            const text = uniquePhones.join(', ');
            navigator.clipboard.writeText(text).then(() => {
                alert(`✅ Copiados ${uniquePhones.length} teléfonos al portapapeles para difusión o WhatsApp.`);
            }).catch(() => {
                prompt('Copia los teléfonos aquí:', text);
            });
        }

        async toggleCampaignActive() {
            const newState = !this.isCampaignActive;
            const confirmMsg = newState
                ? '¿Quieres ACTIVAR y publicar la campaña de la nueva temporada en la pantalla de INICIO para todos los jugadores?'
                : '¿Quieres DESACTIVAR y ocultar la campaña de la pantalla de INICIO para los jugadores?';

            if (!confirm(confirmMsg)) return;

            try {
                if (window.SeasonCampaignService) {
                    await window.SeasonCampaignService.setCampaignActive(newState);
                }
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sp_campaign_status_changed', { detail: { active: newState } }));
                    if (window.SmartTicker && typeof window.SmartTicker.update === 'function') {
                        window.SmartTicker.update();
                    }
                }
                this.isCampaignActive = newState;
                this.render();
                alert(newState 
                    ? '✅ Campaña ACTIVADA en la pantalla de INICIO. Los jugadores ya pueden ver el banner e inscribirse.' 
                    : '🔒 Campaña DESACTIVADA de la pantalla de INICIO. El banner ha sido ocultado para los jugadores.'
                );
            } catch (err) {
                alert('Error al cambiar estado de la campaña: ' + err.message);
            }
        }
    }

    const controllerInstance = new AdminSeasonCampaignController();
    window.AdminSeasonCampaign = controllerInstance;
    window.AdminViews.season_campaign = () => controllerInstance.init();

    console.log('✅ [AdminSeasonCampaign] Controlador de Administración registrado.');
})();
