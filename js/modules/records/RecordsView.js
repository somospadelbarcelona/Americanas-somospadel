/**
 * RecordsView.js
 * SOMOSPADEL WORLD TOUR - SALÓN DE LA FAMA LEYENDAS V2.0 🏆
 */
(function () {
    class RecordsView {
        constructor() {
            this.activeCategory = 'all'; // 'all' | 'court' | 'combat' | 'grit' | 'mine'
            this.searchQuery = '';
            this.expandedCards = new Set();
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) return;
            const records = window.RecordsController ? window.RecordsController.getRecords() : null;

            if (!records && window.RecordsController) {
                container.innerHTML = `
                    <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; color: #0a192f; text-align: center; padding: 20px;">
                        <div style="width: 70px; height: 70px; border-radius: 24px; background: linear-gradient(135deg, #fef08a, #f59e0b); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.35); margin-bottom: 20px;">
                            <i class="fas fa-trophy fa-bounce" style="color: #ffffff; font-size: 2rem;"></i>
                        </div>
                        <h2 style="font-family: 'Outfit', sans-serif; font-weight: 950; font-size: 1.4rem; letter-spacing: -0.5px; margin: 0 0 8px; color: #0f172a;">
                            COMPILANDO EL SALÓN DE LA FAMA
                        </h2>
                        <span style="font-family: 'Outfit', sans-serif; font-size: 0.85rem; color: #64748b; font-weight: 600;">
                            Analizando partidos, dominancias en Pista 1 y marcas históricas...
                        </span>
                    </div>
                `;
                window.RecordsController.init();
                return;
            }

            const currentUser = (window.Store ? window.Store.getState('currentUser') : null) || window.currentUser || null;
            const summary = window.RecordsController ? window.RecordsController.getSummary() : null;
            const recordList = records ? Object.values(records) : [];

            // Filtrado
            const filteredRecords = this.filterRecords(recordList, currentUser);

            container.innerHTML = `
                <div class="records-wrapper fade-in" style="
                    background: #f8fafc; 
                    min-height: 100vh; 
                    padding-bottom: calc(150px + env(safe-area-inset-bottom, 20px)); 
                    font-family: 'Outfit', sans-serif; 
                    color: #0a192f; 
                    position: relative;
                    overflow-x: hidden;
                ">
                    <!-- Luces ambientales de fondo -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 450px; background: radial-gradient(circle at 15% 10%, rgba(245, 158, 11, 0.12) 0%, transparent 60%); pointer-events: none;"></div>
                    <div style="position: absolute; top: 120px; right: -80px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(132, 204, 22, 0.1) 0%, transparent 60%); pointer-events: none;"></div>
                    
                    <!-- 1. HEADER ÉPICO -->
                    <div style="padding: 40px 20px 25px; max-width: 760px; margin: 0 auto; position: relative; z-index: 2;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 5px 14px; border-radius: 999px;">
                                <span style="font-size: 0.95rem;">👑</span>
                                <span style="font-size: 0.65rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #b45309;">
                                    TEMPORADA 2026 • LEYENDAS OFICIALES
                                </span>
                            </div>

                            <button onclick="window.RecordsView.shareHallOfFame()" 
                                style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; padding: 9px 16px; border-radius: 14px; font-weight: 900; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 6px 18px rgba(37, 211, 102, 0.3); cursor: pointer; transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'"
                                onmouseout="this.style.transform='translateY(0)'">
                                <i class="fab fa-whatsapp" style="font-size: 1.05rem;"></i>
                                <span>COMPARTIR</span>
                            </button>
                        </div>

                        <h1 class="hof-main-title">
                            SALÓN DE LA FAMA
                        </h1>
                        <p style="color: #64748b; margin: 8px 0 0; font-size: 0.88rem; font-weight: 500; line-height: 1.5; max-width: 540px;">
                            Las marcas históricas, reyes de la pista central y récords de mayor impacto registrados en la historia de SomosPadel BCN.
                        </p>

                        <!-- HERO MVP CARD (Si existe un jugador con más récords vigentes) -->
                        ${summary && summary.mvp ? `
                            <div style="
                                margin-top: 24px;
                                background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
                                border: 1px solid #fde68a;
                                border-radius: 24px;
                                padding: 18px 20px;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                gap: 16px;
                                box-shadow: 0 10px 25px rgba(245, 158, 11, 0.08);
                                position: relative;
                                overflow: hidden;
                            ">
                                <div style="position: absolute; right: -15px; bottom: -20px; font-size: 6rem; opacity: 0.08; pointer-events: none;">👑</div>
                                
                                <div style="display: flex; align-items: center; gap: 14px; z-index: 2;">
                                    <div style="position: relative;">
                                        <div style="
                                            width: 56px; height: 56px; border-radius: 18px;
                                            border: 2px solid #f59e0b;
                                            background: ${summary.mvp.photo_url ? `url('${summary.mvp.photo_url}') center/cover` : '#fef3c7'};
                                            display: flex; align-items: center; justify-content: center;
                                            overflow: hidden;
                                            box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
                                        ">
                                            ${!summary.mvp.photo_url ? `<span style="font-weight: 950; color: #b45309; font-size: 1.1rem;">${(summary.mvp.name || 'SP').substring(0, 2).toUpperCase()}</span>` : ''}
                                        </div>
                                        <span style="position: absolute; top: -8px; left: -8px; font-size: 1.1rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">👑</span>
                                    </div>

                                    <div>
                                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                                            <span style="font-size: 0.65rem; font-weight: 950; text-transform: uppercase; letter-spacing: 1.5px; color: #b45309;">
                                                LÍDER DEL SALÓN 2026
                                            </span>
                                        </div>
                                        <div style="font-weight: 950; font-size: 1.15rem; color: #0f172a; line-height: 1.2;">
                                            ${summary.mvp.name}
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 800;">
                                                LVL ${summary.mvp.level ? summary.mvp.level.toFixed(2) : '3.50'}
                                            </span>
                                            ${window.RoleService && summary.mvp.role ? window.RoleService.getBadgeHtml(summary.mvp.role, true) : ''}
                                        </div>
                                    </div>
                                </div>

                                <div style="text-align: right; z-index: 2;">
                                    <div style="background: #f59e0b; color: white; padding: 6px 14px; border-radius: 12px; font-weight: 950; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                                        <span>${summary.mvp.titles}</span>
                                        <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">RÉCORDS</span>
                                    </div>
                                    <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; margin-top: 5px; text-transform: uppercase;">
                                        TITÁN VIGENTE
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- 2. BARRA DE HERRAMIENTAS: Búsqueda y Filtros de Categoría -->
                        <div style="margin-top: 25px; display: flex; flex-direction: column; gap: 14px;">
                            <!-- Input de búsqueda -->
                            <div style="position: relative;">
                                <i class="fas fa-search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.95rem;"></i>
                                <input type="text" 
                                    id="hof-search-input"
                                    placeholder="Buscar récord o jugador..." 
                                    value="${this.searchQuery}"
                                    oninput="window.RecordsView.onSearchChange(this.value)"
                                    style="
                                        width: 100%;
                                        box-sizing: border-box;
                                        background: #ffffff;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 16px;
                                        padding: 12px 42px 12px 44px;
                                        font-family: 'Outfit', sans-serif;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        color: #0f172a;
                                        outline: none;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
                                        transition: all 0.2s;
                                    "
                                    onfocus="this.style.borderColor='#f59e0b'; this.style.boxShadow='0 0 0 3px rgba(245, 158, 11, 0.15)';"
                                    onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.02)';"
                                />
                                ${this.searchQuery ? `
                                    <button onclick="window.RecordsView.clearSearch()" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 6px;">
                                        <i class="fas fa-times-circle"></i>
                                    </button>
                                ` : ''}
                            </div>

                            <!-- Píldoras de Filtro de Categoría -->
                            <div class="hof-filter-scroll" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch;">
                                ${this.renderFilterChip('all', '🌟 Todos', recordList.length)}
                                ${this.renderFilterChip('court', '👑 Pista & Puntos', recordList.filter(r => r.category === 'court').length)}
                                ${this.renderFilterChip('combat', '⚔️ Letalidad', recordList.filter(r => r.category === 'combat').length)}
                                ${this.renderFilterChip('grit', '🛡️ Resistencia', recordList.filter(r => r.category === 'grit').length)}
                                ${currentUser ? this.renderFilterChip('mine', '⭐ Mis Récords', this.countUserRecords(recordList, currentUser)) : ''}
                            </div>
                        </div>
                    </div>

                    <!-- 3. LISTADO DE TARJETAS DE RÉCORD -->
                    <div style="padding: 0 16px; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 2;">
                        ${filteredRecords.length > 0 ? (
                            filteredRecords.map((data, index) => this.renderRecordCard(data, index, currentUser)).join('')
                        ) : `
                            <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 24px; padding: 40px 20px; text-align: center; color: #64748b;">
                                <div style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.6;">🔍</div>
                                <div style="font-weight: 950; font-size: 1.1rem; color: #0f172a; margin-bottom: 6px;">No se encontraron récords</div>
                                <div style="font-size: 0.85rem;">Prueba a cambiar el filtro de categoría o borrar el término de búsqueda.</div>
                                <button onclick="window.RecordsView.resetFilters()" style="margin-top: 15px; background: #0f172a; color: white; border: none; padding: 8px 18px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
                                    Restablecer Filtros
                                </button>
                            </div>
                        `}
                    </div>
                </div>

                <style>
                    .hof-main-title {
                        font-family: 'Montserrat', 'Outfit', sans-serif;
                        font-weight: 950;
                        font-size: 2.5rem;
                        text-transform: uppercase;
                        color: #0f172a;
                        margin: 0;
                        letter-spacing: -1.5px;
                        line-height: 1.05;
                    }
                    @media (max-width: 480px) {
                        .hof-main-title { font-size: 2.1rem; }
                    }

                    .hof-filter-scroll::-webkit-scrollbar { display: none; }
                    .hof-filter-scroll { -ms-overflow-style: none; scrollbar-width: none; }

                    .hof-card {
                        background: #ffffff;
                        border-radius: 24px;
                        border: 1px solid #e2e8f0;
                        padding: 24px 22px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .hof-card:hover {
                        box-shadow: 0 12px 32px rgba(0,0,0,0.06);
                    }

                    .hof-toggle-btn {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        color: #0f172a;
                        padding: 10px 18px;
                        border-radius: 14px;
                        font-size: 0.75rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s ease;
                        letter-spacing: 0.5px;
                    }
                    .hof-toggle-btn:hover {
                        background: #f1f5f9;
                        border-color: #cbd5e1;
                    }

                    .hof-share-btn {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        color: #128C7E;
                        padding: 10px 14px;
                        border-radius: 14px;
                        font-size: 0.75rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s ease;
                    }
                    .hof-share-btn:hover {
                        background: #ecfdf5;
                        border-color: #a7f3d0;
                    }

                    .hof-analysis-tray {
                        max-height: 0;
                        opacity: 0;
                        overflow: hidden;
                        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .hof-analysis-tray.expanded {
                        max-height: 800px;
                        opacity: 1;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #f1f5f9;
                    }

                    @keyframes floatSlow {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-8px) rotate(3deg); }
                    }
                </style>
            `;
        }

        renderFilterChip(key, label, count) {
            const isActive = this.activeCategory === key;
            return `
                <button onclick="window.RecordsView.setFilter('${key}')" style="
                    background: ${isActive ? '#0f172a' : '#ffffff'};
                    color: ${isActive ? '#ffffff' : '#475569'};
                    border: 1px solid ${isActive ? '#0f172a' : '#e2e8f0'};
                    padding: 8px 16px;
                    border-radius: 14px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    white-space: nowrap;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                    box-shadow: ${isActive ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'};
                ">
                    <span>${label}</span>
                    <span style="
                        font-size: 0.65rem;
                        background: ${isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9'};
                        color: ${isActive ? '#ffffff' : '#64748b'};
                        padding: 2px 7px;
                        border-radius: 8px;
                    ">${count}</span>
                </button>
            `;
        }

        renderRecordCard(data, index, currentUser) {
            if (!data) return '';
            const isVacant = data.name === 'VACANTE';
            const color = data.color || '#f59e0b';
            const cardId = `rec-card-${data.key || index}`;
            const isExpanded = this.expandedCards.has(cardId);

            const isCurrentUserWinner = currentUser && data.id && (String(currentUser.id) === String(data.id) || (currentUser.name && currentUser.name.toLowerCase() === data.name.toLowerCase()));
            const isCurrentUserInPodium = currentUser && data.top3 && data.top3.some(p => String(p.id) === String(currentUser.id) || (currentUser.name && currentUser.name.toLowerCase() === p.name.toLowerCase()));

            // Categoría badge
            let catLabel = 'RÉCORD';
            if (data.category === 'court') catLabel = 'PISTA & PUNTOS';
            else if (data.category === 'combat') catLabel = 'LETALIDAD';
            else if (data.category === 'grit') catLabel = 'RESISTENCIA';

            const player = data.player || null;
            const photoUrl = player?.photo_url || null;
            const levelVal = player?.level ? player.level.toFixed(2) : null;
            const roleVal = player?.role || null;

            return `
                <div class="hof-card" style="border-left: 6px solid ${color};">
                    <!-- Icono flotante con sombra suave de fondo -->
                    <div style="
                        position: absolute; 
                        right: 15px; 
                        top: 15px; 
                        font-size: 4.5rem; 
                        opacity: 0.15; 
                        pointer-events: none;
                        animation: floatSlow 6s ease-in-out infinite;
                        filter: drop-shadow(0 4px 10px ${color}40);
                    ">
                        ${data.icon || '🏆'}
                    </div>

                    <div style="position: relative; z-index: 2;">
                        <!-- Fila superior: Categoría + Badges -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="
                                    font-size: 0.65rem; 
                                    font-weight: 950; 
                                    text-transform: uppercase; 
                                    letter-spacing: 1.2px; 
                                    padding: 3px 9px; 
                                    border-radius: 8px;
                                    background: ${color}15;
                                    color: ${color};
                                    border: 1px solid ${color}35;
                                ">
                                    ${catLabel}
                                </span>
                            </div>

                            ${isCurrentUserWinner ? `
                                <span style="font-size: 0.65rem; font-weight: 950; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 3px 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);">
                                    👑 ¡ERES EL REY ACTUAL!
                                </span>
                            ` : (isCurrentUserInPodium ? `
                                <span style="font-size: 0.65rem; font-weight: 950; background: #f1f5f9; color: #0284c7; border: 1px solid #bae6fd; padding: 3px 9px; border-radius: 8px;">
                                    🔥 ¡ESTÁS EN EL TOP 3!
                                </span>
                            ` : '')}
                        </div>

                        <!-- Título del Récord -->
                        <div style="font-weight: 950; font-size: 1.45rem; color: #0f172a; letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 14px;">
                            ${data.title}
                        </div>

                        <!-- Perfil del Campeón (Avatar + Nombre + Nivel) -->
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
                            <div style="
                                width: 48px; 
                                height: 48px; 
                                border-radius: 16px; 
                                border: 2px solid ${color}; 
                                background: ${photoUrl ? `url('${photoUrl}') center/cover` : '#f1f5f9'};
                                display: flex; 
                                align-items: center; 
                                justify-content: center;
                                overflow: hidden;
                                flex-shrink: 0;
                                box-shadow: 0 4px 12px ${color}25;
                            ">
                                ${!photoUrl ? `<span style="font-weight: 950; color: #0f172a; font-size: 0.95rem;">${isVacant ? '?' : data.name.substring(0, 2).toUpperCase()}</span>` : ''}
                            </div>

                            <div style="min-width: 0; flex: 1;">
                                <div style="font-weight: 950; font-size: 1.1rem; color: ${isVacant ? '#94a3b8' : '#0f172a'}; line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${data.name}
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px; flex-wrap: wrap;">
                                    ${levelVal ? `
                                        <span style="font-size: 0.68rem; font-weight: 900; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 6px;">
                                            LVL ${levelVal}
                                        </span>
                                    ` : ''}
                                    ${roleVal && window.RoleService ? window.RoleService.getBadgeHtml(roleVal, true) : ''}
                                    ${isVacant ? `<span style="font-size: 0.7rem; color: #94a3b8; font-weight: 700;">Sin poseedor todavía</span>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Métrica Impactante -->
                        <div style="
                            background: linear-gradient(135deg, ${color}0D 0%, #f8fafc 100%); 
                            border: 1px solid ${color}25; 
                            border-radius: 18px; 
                            padding: 14px 18px; 
                            display: flex; 
                            align-items: baseline; 
                            gap: 10px;
                            margin-bottom: 14px;
                        ">
                            <span style="font-size: 2.2rem; font-weight: 950; color: #0f172a; line-height: 1; letter-spacing: -1px;">
                                ${data.value}
                            </span>
                            <span style="font-size: 0.78rem; font-weight: 900; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${data.unit || data.count || ''}
                            </span>
                        </div>

                        <!-- Descripción narrativa -->
                        <p style="color: #64748b; font-size: 0.85rem; line-height: 1.55; margin: 0 0 18px; font-weight: 500;">
                            ${data.desc}
                        </p>

                        <!-- Botones de Acción -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${!isVacant ? `
                                <button onclick="window.RecordsView.toggleCard('${cardId}')" class="hof-toggle-btn" style="flex: 1; justify-content: center;">
                                    <i class="fas fa-trophy" style="color: ${color};"></i>
                                    <span>${isExpanded ? 'OCULTAR PODIO' : 'VER ANÁLISIS & TOP 3'}</span>
                                    <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}" style="font-size: 0.7rem; color: #94a3b8;"></i>
                                </button>

                                <button onclick="window.RecordsView.shareSingleRecord('${data.key}')" class="hof-share-btn" title="Compartir este récord">
                                    <i class="fab fa-whatsapp" style="font-size: 0.95rem;"></i>
                                    <span style="font-size: 0.7rem; font-weight: 900;">RETAR</span>
                                </button>
                            ` : `
                                <div style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">
                                    Compite en los próximos eventos para inscribir tu nombre aquí.
                                </div>
                            `}
                        </div>

                        <!-- Bandeja Desplegable: Análisis Táctico & Podio Top 3 -->
                        ${!isVacant ? `
                            <div id="${cardId}" class="hof-analysis-tray ${isExpanded ? 'expanded' : ''}">
                                <!-- Análisis Táctico -->
                                <div style="
                                    background: #f8fafc;
                                    border: 1px solid #e2e8f0;
                                    border-left: 4px solid ${color};
                                    border-radius: 14px;
                                    padding: 12px 16px;
                                    font-size: 0.85rem;
                                    color: #1e293b;
                                    line-height: 1.6;
                                    margin-bottom: 18px;
                                ">
                                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                                        <i class="fas fa-quote-left" style="color: ${color}; font-size: 0.95rem; margin-top: 3px; opacity: 0.8;"></i>
                                        <div>${data.deepAnalysis}</div>
                                    </div>
                                </div>

                                <!-- Podio Top 3 -->
                                ${data.top3 && data.top3.length > 0 ? `
                                    <div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                            <span style="font-size: 0.7rem; color: #64748b; font-weight: 950; text-transform: uppercase; letter-spacing: 1.5px;">
                                                PODIO DE EXCELENCIA
                                            </span>
                                            <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 800;">
                                                TOP 3 CLUB
                                            </span>
                                        </div>

                                        <div style="display: flex; flex-direction: column; gap: 10px;">
                                            ${data.top3.map((p, idx) => {
                                                const max = parseFloat(data.top3[0].raw) || 1;
                                                const rawVal = parseFloat(p.raw || 0);
                                                const width = max > 0 ? Math.max(12, Math.min(100, (rawVal / max) * 100)) : 12;
                                                const isUser = currentUser && (String(p.id) === String(currentUser.id) || (currentUser.name && currentUser.name.toLowerCase() === p.name.toLowerCase()));
                                                
                                                let medal = '🥇';
                                                let medalColor = '#f59e0b';
                                                if (idx === 1) { medal = '🥈'; medalColor = '#64748b'; }
                                                else if (idx === 2) { medal = '🥉'; medalColor = '#b45309'; }

                                                return `
                                                    <div style="
                                                        background: ${isUser ? '#fefce8' : '#ffffff'};
                                                        border: 1px solid ${isUser ? '#fef08a' : '#f1f5f9'};
                                                        border-radius: 14px;
                                                        padding: 10px 14px;
                                                        display: flex;
                                                        align-items: center;
                                                        gap: 12px;
                                                    ">
                                                        <span style="font-size: 1.1rem; width: 24px; text-align: center;">${medal}</span>
                                                        
                                                        <div style="flex: 1; min-width: 0;">
                                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                                                <span style="font-weight: 900; font-size: 0.85rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                                    ${p.name} ${isUser ? `<span style="background: #f59e0b; color: white; font-size: 0.55rem; padding: 1px 5px; border-radius: 4px; margin-left: 4px;">TÚ</span>` : ''}
                                                                </span>
                                                                <span style="font-weight: 950; font-size: 0.82rem; color: ${idx === 0 ? color : '#334155'};">
                                                                    ${p.value.split(' ')[0]}
                                                                </span>
                                                            </div>

                                                            <div style="width: 100%; background: #f1f5f9; height: 6px; border-radius: 999px; overflow: hidden;">
                                                                <div style="width: ${width}%; background: ${idx === 0 ? color : medalColor}; height: 100%; border-radius: 999px;"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        filterRecords(recordList, currentUser) {
            return recordList.filter(rec => {
                // Filtro por categoría
                if (this.activeCategory === 'court' && rec.category !== 'court') return false;
                if (this.activeCategory === 'combat' && rec.category !== 'combat') return false;
                if (this.activeCategory === 'grit' && rec.category !== 'grit') return false;
                if (this.activeCategory === 'mine') {
                    if (!currentUser) return false;
                    const isWinner = rec.id && (String(rec.id) === String(currentUser.id) || (currentUser.name && currentUser.name.toLowerCase() === rec.name.toLowerCase()));
                    const inPodium = rec.top3 && rec.top3.some(p => String(p.id) === String(currentUser.id) || (currentUser.name && currentUser.name.toLowerCase() === p.name.toLowerCase()));
                    if (!isWinner && !inPodium) return false;
                }

                // Filtro por texto de búsqueda
                if (this.searchQuery.trim()) {
                    const q = this.searchQuery.toLowerCase().trim();
                    const titleMatch = (rec.title || '').toLowerCase().includes(q);
                    const nameMatch = (rec.name || '').toLowerCase().includes(q);
                    const descMatch = (rec.desc || '').toLowerCase().includes(q);
                    const topMatch = rec.top3 && rec.top3.some(p => (p.name || '').toLowerCase().includes(q));
                    if (!titleMatch && !nameMatch && !descMatch && !topMatch) return false;
                }

                return true;
            });
        }

        countUserRecords(recordList, currentUser) {
            if (!currentUser) return 0;
            return recordList.filter(rec => {
                const isWinner = rec.id && (String(rec.id) === String(currentUser.id) || (currentUser.name && currentUser.name.toLowerCase() === rec.name.toLowerCase()));
                const inPodium = rec.top3 && rec.top3.some(p => String(p.id) === String(currentUser.id) || (currentUser.name && currentUser.name.toLowerCase() === p.name.toLowerCase()));
                return isWinner || inPodium;
            }).length;
        }

        setFilter(category) {
            this.activeCategory = category;
            this.render();
        }

        onSearchChange(val) {
            this.searchQuery = val;
            this.render();
            // Mantener el foco en el input
            const input = document.getElementById('hof-search-input');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }

        clearSearch() {
            this.searchQuery = '';
            this.render();
        }

        resetFilters() {
            this.activeCategory = 'all';
            this.searchQuery = '';
            this.render();
        }

        toggleCard(cardId) {
            if (this.expandedCards.has(cardId)) {
                this.expandedCards.delete(cardId);
            } else {
                this.expandedCards.add(cardId);
            }
            const el = document.getElementById(cardId);
            if (el) {
                el.classList.toggle('expanded');
                // Actualizar texto del botón si se encuentra
                const btn = el.parentElement.querySelector('.hof-toggle-btn');
                if (btn) {
                    const isExp = el.classList.contains('expanded');
                    btn.innerHTML = `
                        <i class="fas fa-trophy"></i>
                        <span>${isExp ? 'OCULTAR PODIO' : 'VER ANÁLISIS & TOP 3'}</span>
                        <i class="fas fa-chevron-${isExp ? 'up' : 'down'}" style="font-size: 0.7rem; color: #94a3b8;"></i>
                    `;
                }
            } else {
                this.render();
            }
        }

        shareHallOfFame() {
            const records = window.RecordsController ? window.RecordsController.getRecords() : null;
            if (records && window.WhatsAppService) {
                window.WhatsAppService.shareHallOfFame(records);
            }
        }

        shareSingleRecord(recordKey) {
            const records = window.RecordsController ? window.RecordsController.getRecords() : null;
            if (!records || !records[recordKey]) return;
            const rec = records[recordKey];

            const msg = [
                `🏆 *RÉCORD OFICIAL SOMOSPADEL BCN* 🏆`,
                `👑 *${rec.title.toUpperCase()}*`,
                `👤 Campeón: *${rec.name}*`,
                `📊 Marca Registrada: *${rec.count || rec.value}*`,
                `💬 _"${rec.desc}"_`,
                ``,
                `¿Crees que puedes superarlo? 🔥`,
                `🔗 https://somospadelbarcelona.github.io/Americanas-somospadel/#records`
            ].join('\n');

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

            if (isMobile && navigator.share) {
                navigator.share({
                    title: `Récord SomosPadel: ${rec.title}`,
                    text: msg
                }).catch(() => {});
                return;
            }

            const url = "https://api.whatsapp.com/send?text=" + encodeURIComponent(msg);
            if (window.WhatsAppService && window.WhatsAppService._openUrlSafely) {
                window.WhatsAppService._openUrlSafely(url);
            } else {
                window.open(url, '_blank');
            }
        }
    }

    window.RecordsView = new RecordsView();
    window.RecordsView.shareHallOfFame = window.RecordsView.shareHallOfFame.bind(window.RecordsView);
    window.RecordsView.shareSingleRecord = window.RecordsView.shareSingleRecord.bind(window.RecordsView);
    window.RecordsView.setFilter = window.RecordsView.setFilter.bind(window.RecordsView);
    window.RecordsView.toggleCard = window.RecordsView.toggleCard.bind(window.RecordsView);
    window.RecordsView.onSearchChange = window.RecordsView.onSearchChange.bind(window.RecordsView);
    window.RecordsView.clearSearch = window.RecordsView.clearSearch.bind(window.RecordsView);
    window.RecordsView.resetFilters = window.RecordsView.resetFilters.bind(window.RecordsView);
})();
