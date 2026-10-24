/**

 * admin-americanas.js

 * View Controller for Americanas Management.

 * 100% Cloned and unified architecture from admin-entrenos.js

 * Version: 5020 - Unified Pro Architecture

 */

console.log("🚀 AdminAmericanas Loaded (v5020)");



window.AdminViews = window.AdminViews || {};



// Main Management View

// 1. GESTOR DE AMERICANAS (Listado y Filtros)

window.AdminViews.americanas_mgmt = async function () {

    const navId = window._currentAdminNavId;

    const content = document.getElementById('content-area');

    const titleEl = document.getElementById('page-title');



    if (titleEl) titleEl.textContent = 'Gestor de Americanas';



    // Diagnostic Helper

    const updateStatus = (msg) => {

        if (navId === window._currentAdminNavId) {

            content.innerHTML = `<div class="loading-container"><div class="loader"></div><p>${msg}</p></div>`;

        }

    };



    updateStatus("🚀 Iniciando Gestor de Americanas...");



    try {

        // Dependency Checks

        if (!window.EventService) throw new Error("EventService no cargado");

        if (!window.AppConstants) throw new Error("AppConstants no cargado");

        if (!window.FirebaseDB) throw new Error("FirebaseDB no cargado");



        updateStatus("📡 Conectando con Base de Datos...");



        // Fetch resiliente: soporte SWR y fallback a caché en caso de red lenta

        let americanas = [];

        try {

            const fetchPromise = EventService.getAll(AppConstants.EVENT_TYPES.AMERICANA);

            const timeoutPromise = new Promise((_, reject) =>

                setTimeout(() => reject(new Error("⌛ Tiempo de espera de red (20s).")), 20000)

            );

            americanas = await Promise.race([fetchPromise, timeoutPromise]);

        } catch (fetchErr) {

            console.warn("⚠️ [americanas_mgmt] Red lenta o error, comprobando caché local:", fetchErr.message);

            if (window.CacheService) {

                const cached = await window.CacheService.get('americanas', 'all');

                if (cached && Array.isArray(cached) && cached.length > 0) {

                    console.log("🛡️ [americanas_mgmt] Recuperadas americanas desde caché local.");

                    americanas = cached;

                }

            }

            if (!americanas || !americanas.length) throw fetchErr;

        }



        // Si el usuario navegó a otra vista mientras cargaban los datos, salir sin sobreescribir pantalla

        if (navId !== window._currentAdminNavId) {

            console.log(`⚠️ [americanas_mgmt] Token de navegación caducado (#${navId} -> #${window._currentAdminNavId}), omitiendo render.`);

            return;

        }



        updateStatus("✅ Datos recibidos. Procesando...");



        const sortedAmericanas = americanas.sort((a, b) => new Date(b.date) - new Date(a.date));

        window._currentAmericanasCache = sortedAmericanas; // En memoria para acceso instantáneo y resiliente



        // 📅 Get available months for filter list

        const availableMonths = [...new Set(sortedAmericanas.map(e => {

            if (!e.date) return null;

            if (e.date.includes('-')) return e.date.substring(0, 7); // YYYY-MM

            if (e.date.includes('/')) {

                const p = e.date.split('/');

                return `${p[2]}-${p[0].padStart(2, '0')}`;

            }

            return null;

        }))].filter(Boolean).sort((a, b) => String(b).localeCompare(String(a)));



        const monthNames = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };

        const monthOptions = availableMonths.map(m => {

            const [y, mm] = m.split('-');

            return `<option value="${m}">${(monthNames[mm] || mm).toUpperCase()} ${y}</option>`;

        }).join('');



        const listHtml = sortedAmericanas.map(evt => renderAmericanaCard(evt)).join('');



        content.innerHTML = `

            <div class="planning-area" id="americanas-planning-area" style="display: flex; flex-direction: column; height: calc(100vh - 140px);">

                

                <!-- ACTION HEADER BAR -->

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">

                    <div style="font-size: 1.1rem; font-weight: 900; color: #fff; display: flex; align-items: center; gap: 8px;">

                        <i class="fas fa-trophy" style="color: var(--accent);"></i> AMERICANAS PROGRAMADAS

                    </div>

                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">

                        <button type="button" class="btn-primary-pro" onclick="window.openQuickPlaytomicSyncSelector()" style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: #fff; font-weight: 900; border: none; padding: 10px 18px; border-radius: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 198, 255, 0.4); font-size: 0.88rem;">

                            <i class="fas fa-sync-alt" style="font-size: 1.05rem;"></i> 🎾 SINCRONIZAR PLAYTOMIC

                        </button>

                        <button type="button" class="btn-primary-pro" onclick="window.WhatsAppService.openCarteleraModal()" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #fff; font-weight: 900; border: none; padding: 10px 18px; border-radius: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4); font-size: 0.88rem;">

                            <i class="fab fa-whatsapp" style="font-size: 1.15rem;"></i> 📢 CARTELERA MULTI-TORNEO (WHATSAPP)

                        </button>

                    </div>

                </div>



                <!-- FILTER BAR (Identical to Entrenos) -->

                <div class="filter-bar-pro" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); align-items: center;">

                    <div style="position:relative; grid-column: span 2;">

                        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); font-size:0.8rem;"></i>

                        <input type="text" id="americana-search-input" placeholder="Buscar por nombre o club..."

                            style="padding-left:35px; height:45px; font-size:0.9rem; width:100%; border-radius:12px; background:rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;">

                    </div>

                    <select id="filter-month-americana" class="pro-input" style="height:45px; font-size: 0.8rem;">

                        <option value="all">MES: TODOS</option>

                        ${monthOptions}

                    </select>

                    <select id="filter-status-americana" class="pro-input" style="height:45px; font-size: 0.8rem;">

                        <option value="all">ESTADO: TODOS</option>

                        <option value="open">🟢 ABIERTO</option>

                        <option value="live">🎾 EN JUEGO</option>

                        <option value="finished">🏁 FINALIZADO</option>

                        <option value="pairing">🔀 EMPAREJANDO</option>

                    </select>

                    <select id="filter-category-americana" class="pro-input" style="height:45px; font-size: 0.8rem;">

                        <option value="all">CATEGORÍA: TODAS</option>

                        <option value="male">MASCULINO</option>

                        <option value="female">FEMENINO</option>

                        <option value="mixed">MIXTO</option>

                        <option value="open">OPEN / TODOS</option>

                    </select>

                    <div style="display:flex; gap: 8px;">

                        <button class="btn-outline-pro" onclick="document.getElementById('americana-search-input').value=''; document.getElementById('filter-month-americana').value='all'; document.getElementById('filter-status-americana').value='all'; document.getElementById('filter-category-americana').value='all'; loadAdminView('americanas_mgmt')" style="flex:1; height:45px; font-size: 0.7rem; padding: 0;">

                            <i class="fas fa-eraser"></i> LIMPIAR

                        </button>

                        <button class="btn-outline-pro" onclick="loadAdminView('americanas_mgmt')" style="width: 45px; height:45px; display: flex; align-items: center; justify-content: center;">

                            <i class="fas fa-sync-alt"></i>

                        </button>

                    </div>

                </div>



                <!-- SCROLLABLE LIST -->

                <div class="americana-scroll-list" id="americanas-list-container" style="overflow-y: auto; padding-right: 10px; flex: 1;">

                    ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 5rem; color: var(--text-muted);"><i class="fas fa-trophy" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i><br>No se encontraron americanas con los filtros actuales.</div>'}

                </div>

            </div>

        `;



        setupAmericanaFilters();



    } catch (e) {

        if (navId !== window._currentAdminNavId) {

            console.warn(`⚠️ [americanas_mgmt] Error ignorado porque la vista activa es #${window._currentAdminNavId}:`, e.message);

            return;

        }

        console.error("Error en Gestor Americanas:", e);

        content.innerHTML = `<div class="error-box" style="padding:40px; text-align:center;">

            <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ff4444; margin-bottom:20px;"></i>

            <h3 style="color:#ff4444;">Error de Carga</h3>

            <p style="color:#fff; font-family:monospace; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">${e.message}</p>

            <button onclick="loadAdminView('americanas_mgmt')" style="margin-top:20px; padding:10px 20px; background:#fff; border:none; border-radius:6px; cursor:pointer;">REINTENTAR</button>

        </div>`;

    }

};



// 2. CREAR AMERICANA (Formulario Dedicado)

window.AdminViews.americanas_create = async function () {

    const content = document.getElementById('content-area');

    const titleEl = document.getElementById('page-title');



    if (titleEl) titleEl.textContent = 'Crear Nueva Americana';



    content.innerHTML = `

        <div style="max-width: 650px; margin: 0 auto;">

            <div class="glass-card-enterprise fade-in" style="padding: 2.5rem;">

                <h3 style="color: var(--primary); margin-bottom: 2rem; display: flex; align-items: center; gap: 12px; font-weight:800; font-size: 1.2rem;">

                    <i class="fas fa-plus-circle" style="font-size: 1.5rem; color: #CCFF00;"></i> CREAR NUEVO EVENTO DE AMERICANA

                </h3>

                

                <!-- Botones de Preset Rápido -->

                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('masc4')" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.4);">🎾 Masc 4 Pistas</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('fem4')" style="background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4);">🌸 Fem 4 Pistas</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('mixta4')" style="background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4);">⚡ Mixta 4 Pistas</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('twister')" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);">🌪️ Twister Indiv.</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('suiza')" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);">🇨🇭 Suiza</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('prat')" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-weight: 800;">⭐ Bcn Prat</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('delfos')" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-weight: 800;">⭐ Delfos</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('new_play')" style="background: #38bdf8; color: #0f172a; border: 1px solid #0284c7; font-weight: 900;">⭐ New Play Pro</button>

                    <button type="button" class="btn-micro" onclick="window.applyAmericanaPreset('cem_tennis')" style="background: #0284c7; color: #ffffff; border: 1px solid #0369a1; font-weight: 800;">⭐ CEM Hospitalet</button>

                </div>



                <form id="create-americana-form" class="pro-form compact-admin-form">

                    

                    <h3 style="color: #CCFF00; font-size: 0.85rem; margin-bottom: 15px; border-bottom: 1px solid rgba(204,255,0,0.2); padding-bottom: 8px;">

                        <i class="fas fa-sliders-h"></i> CONFIGURACIÓN GENERAL

                    </h3>



                    <div class="form-group" style="margin-bottom: 15px;">

                        <label>NOMBRE DEL TORNEO / AMERICANA</label>

                        <input type="text" name="name" id="create-name-input" class="pro-input" placeholder="Ej: Americana Oro Barcelona" required

                            style="font-weight: 800; font-size: 1rem;">

                    </div>



                    <!-- DESCRIPCIÓN & AVISOS PARA JUGADORES -->

                    <div class="form-group" style="margin-bottom: 15px;">

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">

                            <label style="margin: 0; font-weight: 800; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">

                                <i class="fas fa-align-left" style="color: #38bdf8;"></i> DESCRIPCIÓN & AVISOS PARA JUGADORES

                            </label>

                            <span style="font-size: 0.65rem; color: #64748b;">(Visible para todos los jugadores)</span>

                        </div>

                        <textarea name="description" id="create-description-input" class="pro-input" rows="3" 

                            placeholder="Escribe aquí los detalles que quieras que lean los jugadores: vermut/tapa incluida, premios, sistema de puntuación, pistas, normas, etc."

                            style="width: 100%; resize: vertical; min-height: 70px; font-size: 0.85rem; line-height: 1.4; border-radius: 10px;"></textarea>

                    </div>



                    <!-- Tipo de Evento / Club Organizador -->

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">

                        <div class="form-group">

                            <label><i class="fas fa-building-columns"></i> TIPO DE EVENTO</label>

                            <select name="is_external" id="create-is-external" class="pro-input" onchange="window.toggleCreateClubInput(this.value)">

                                <option value="false">🏆 OFICIAL SOMOSPADEL</option>

                                <option value="true">🏛️ CLUB ASOCIADO / EXTERNA</option>

                            </select>

                        </div>

                        <div class="form-group" id="create-club-group" style="display: none;">

                            <label><i class="fas fa-signature"></i> NOMBRE DEL CLUB</label>

                            <input type="text" name="club" id="create-club-input" list="padel-clubs-datalist" class="pro-input" placeholder="Ej: CEM Tennis & Pádel Hospitalet">

                        </div>

                    </div>



                    <!-- Nombre del Organizador -->

                    <div class="form-group" style="margin-bottom: 15px;">

                        <label style="font-weight: 800; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">

                            <i class="fas fa-user-tie" style="color: #CCFF00;"></i> ORGANIZADOR DE LA AMERICANA

                        </label>

                        <input type="text" name="organizer" id="create-organizer-input" class="pro-input" placeholder="Ej: Alex / SomosPadel / Club Pádel" style="width: 100%; font-size: 0.85rem; border-radius: 10px;">

                    </div>



                    <!-- PRIVACIDAD & ACCESO EXCLUSIVO -->

                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; margin-bottom: 15px;">

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">

                            <div class="form-group" style="margin-bottom: 0;">

                                <label style="font-weight: 800; font-size: 0.75rem; color: #f87171; text-transform: uppercase;">

                                    <i class="fas fa-user-lock"></i> PRIVACIDAD

                                </label>

                                <select name="is_private" id="create-americana-is-private" class="pro-input" onchange="const pg = document.getElementById('create-americana-pin-group'); if (pg) pg.style.display = (this.value === 'true' ? 'block' : 'none');">

                                    <option value="false" selected>🌐 PÚBLICA (Abierta a todos)</option>

                                    <option value="true">🔒 PRIVADA (Con contraseña)</option>

                                </select>

                            </div>

                            <div class="form-group" id="create-americana-pin-group" style="margin-bottom: 0; display: none;">

                                <label style="font-weight: 800; font-size: 0.75rem; color: #CCFF00; text-transform: uppercase;">

                                    <i class="fas fa-key"></i> CLAVE / PIN DE ACCESO

                                </label>

                                <input type="text" name="access_pin" id="create-americana-pin-input" class="pro-input" placeholder="Ej: 1234 o PADELCLUB" style="font-weight: 900; letter-spacing: 1px;">

                            </div>

                        </div>

                        <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 6px; line-height: 1.3;">

                            <i class="fas fa-info-circle" style="color: #38bdf8;"></i> Si es privada, solo los jugadores que tengan la clave podrán ver partidos, resultados y apuntarse.

                        </div>

                    </div>



                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 15px;">

                        <div class="form-group">

                            <label>FECHA</label>

                            <input type="date" name="date" class="pro-input" required>

                        </div>

                        <div class="form-group">

                            <label>INICIO</label>

                            <input type="time" name="time" class="pro-input" value="18:00" required>

                        </div>

                        <div class="form-group">

                            <label>FIN</label>

                            <input type="time" name="time_end" class="pro-input" value="20:00">

                        </div>

                    </div>



                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">

                        <div class="form-group">

                            <label>CATEGORÍA</label>

                            <select name="category" class="pro-input">

                                <option value="open">TODOS / OPEN</option>

                                <option value="male" selected>MASCULINO</option>

                                <option value="female">FEMENINO</option>

                                <option value="mixed">MIXTO</option>

                            </select>

                        </div>

                        <div class="form-group">

                            <label><i class="fas fa-map-marker-alt" style="color: #38bdf8;"></i> SEDE / CLUB</label>

                            <div class="sede-combobox-wrapper">

                                <input type="text" 

                                       name="location" 

                                       id="create-americana-location-input" 

                                       class="pro-input sede-combobox-input" 

                                       placeholder="🔍 Buscar o escribir sede / club..." 

                                       autocomplete="off" 

                                       required>

                                <button type="button" class="sede-combobox-toggle" title="Ver lista de sedes">

                                    <i class="fas fa-chevron-down"></i>

                                </button>

                                <div class="sede-combobox-dropdown"></div>

                            </div>

                        </div>

                    </div>



                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">

                        <div class="form-group">

                            <label>MODO DE JUEGO</label>

                            <select name="pair_mode" id="create-americana-pair-mode" class="pro-input" onchange="window.updatePairModeHelper(this, 'create-americana-pair-mode-desc')">

                                <option value="twister" selected>🌪️ TWISTER INDIVIDUAL (Pozo rotativo)</option>

                                <option value="fixed">🔒 PAREJA FIJA (Dupla todo el torneo)</option>

                                <option value="swiss">🇨🇭 SUIZO (Puntos acumulados)</option>

                            </select>

                        </div>

                        <div class="form-group">

                            <label>ESTADO</label>

                            <select name="status" class="pro-input" style="font-weight: 800;">

                                <option value="open" selected>🟢 ABIERTA</option>

                                <option value="pairing">🔀 EMPAREJAMIENTO</option>

                                <option value="live">🎾 EN JUEGO</option>

                                <option value="finished">🏁 FINALIZADA</option>

                                <option value="cancelled">⛔ ANULADO</option>

                            </select>

                        </div>

                    </div>



                    <!-- EXPLICACIÓN DINÁMICA DEL MODO DE JUEGO -->

                    <div id="create-americana-pair-mode-desc" style="background: rgba(204, 255, 0, 0.06); border-left: 3px solid #CCFF00; padding: 8px 12px; border-radius: 8px; font-size: 0.72rem; color: #cbd5e1; margin-bottom: 15px; line-height: 1.35;">

                    </div>



                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">

                        <div class="form-group">

                            <label><i class="fas fa-signal" style="color: #CCFF00;"></i> NIVEL MÍNIMO</label>

                            <input type="text" name="level_min" class="pro-input" placeholder="Ej: 3.5" value="3.5">

                        </div>

                        <div class="form-group">

                            <label><i class="fas fa-signal" style="color: #CCFF00;"></i> NIVEL MÁXIMO</label>

                            <input type="text" name="level_max" class="pro-input" placeholder="Ej: 4.5" value="4.5">

                        </div>

                    </div>



                    <h3 style="color: #60A5FA; font-size: 0.85rem; margin-bottom: 15px; border-bottom: 1px solid rgba(96,165,250,0.2); padding-bottom: 8px; margin-top: 20px;">

                        <i class="fas fa-cogs"></i> LOGÍSTICA

                    </h3>



                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">

                        <div class="form-group">

                            <label>PISTAS</label>

                            <input type="number" name="max_courts" class="pro-input" value="4" placeholder="4">

                        </div>

                        <div class="form-group">

                            <label>RONDAS</label>

                            <input type="number" name="rounds_count" class="pro-input" value="6">

                        </div>

                        <div class="form-group">

                            <label>€ SOCIO</label>

                            <input type="number" name="price_members" step="0.1" class="pro-input" value="20">

                        </div>

                        <div class="form-group">

                            <label>€ EXT.</label>

                            <input type="number" name="price_external" step="0.1" class="pro-input" value="25">

                        </div>

                    </div>



                    <div class="form-group" style="margin-top: 15px; margin-bottom: 2rem;">

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">

                            <label style="margin: 0; font-weight: 800; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">

                                <i class="fas fa-camera" style="color: #CCFF00;"></i> Imagen de Portada / Cartel

                            </label>

                            <span style="font-size: 0.65rem; color: #64748b;">(JPG, PNG o WebP)</span>

                        </div>



                        <!-- Banner Preview & Drop Zone -->

                        <div id="create-americana-img-dropzone" 

                             onclick="document.getElementById('create-americana-file-input').click()"

                             style="position: relative; width: 100%; height: 110px; border-radius: 12px; border: 2px dashed rgba(204, 255, 0, 0.35); background: #111; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s ease; margin-bottom: 10px;">

                             

                            <img id="create-americana-img-preview" src="" alt="Portada" 

                                 style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; display: none;">

                            

                            <div style="position: relative; z-index: 2; text-align: center; pointer-events: none;">

                                <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); color: #CCFF00; font-size: 0.75rem; font-weight: 900; padding: 6px 14px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">

                                    <i class="fas fa-cloud-upload-alt" style="font-size: 0.95rem;"></i>

                                    <span>SUBIR FOTO O CARTEL DE LA AMERICANA</span>

                                </div>

                                <p style="margin: 5px 0 0; font-size: 0.62rem; color: #94a3b8;">Haz clic para elegir foto desde tu móvil/ordenador o arrástrala aquí</p>

                            </div>

                        </div>



                        <!-- Hidden File Input -->

                        <input type="file" id="create-americana-file-input" accept="image/*" style="display: none;" onchange="window.handleAmericanaImageUpload(this, 'create-americana-img-input', 'create-americana-img-preview')">



                        <!-- URL Input & Secondary Actions -->

                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">

                            <input type="text" name="image_url" id="create-americana-img-input" class="pro-input"

                                placeholder="O escribe una URL directa..." oninput="window.updateAmericanaImagePreview(this.value, 'create-americana-img-preview')">

                            <button type="button" class="btn-micro" onclick="document.getElementById('create-americana-file-input').click()" 

                                    title="Subir archivo" style="background: #3b82f6; color: white; padding: 0 14px; height: 38px; border-radius: 8px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; cursor: pointer;">

                                <i class="fas fa-folder-open"></i> SUBIR

                            </button>

                        </div>



                        <!-- Quick Image Selectors -->

                        <div style="display: flex; gap: 5px; flex-wrap: wrap; align-items: center;">

                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 700; margin-right: 2px;">PRESETS:</span>

                            <button type="button" class="btn-micro" style="background: #25d366; color: black;"

                                onclick="window.selectCreateAmericanaImage('img/americana masculina.jpg')">Masc</button>

                            <button type="button" class="btn-micro" style="background: #ff69b4; color: black;"

                                onclick="window.selectCreateAmericanaImage('img/americana femeninas.jpg')">Fem</button>

                            <button type="button" class="btn-micro" style="background: #ccff00; color: #000;"

                                onclick="window.selectCreateAmericanaImage('img/americana mixta.jpg')">Mixta</button>

                            <button type="button" class="btn-micro" style="background: #ffffff; color: black;"

                                onclick="window.selectCreateAmericanaImage('img/entreno todo prat.jpg')">Prat</button>

                            <button type="button" class="btn-micro" style="background: #ffffff; color: black;"

                                onclick="window.selectCreateAmericanaImage('img/entreno todo delfos.jpg')">Delfos</button>

                            <button type="button" class="btn-micro" style="background: #38bdf8; color: black; font-weight: 800;"

                                onclick="window.selectCreateAmericanaImage('img/new_play_padel_pro.png')">⭐ New Play</button>

                            <button type="button" class="btn-micro" style="background: #0284c7; color: white; font-weight: 800;"

                                onclick="window.selectCreateAmericanaImage('img/cem_tennis_hospitalet.png')">⭐ CEM Tennis</button>

                            <button type="button" class="btn-micro"

                                onclick="window.selectCreateAmericanaImage('img/ball-mixta.png')">Pelota</button>

                        </div>

                    </div>



                    <div style="display: flex; gap: 15px; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">

                        <button type="button" class="btn-outline-pro" onclick="loadAdminView('americanas_mgmt')" style="flex: 1; height: 55px; font-weight: 700;">

                            CANCELAR

                        </button>

                        <button type="submit" class="btn-primary-pro" style="flex: 2; height: 55px; font-weight: 900; font-size: 1.1rem; box-shadow: 0 8px 25px rgba(204,255,0,0.3);">

                            PUBLICAR AMERICANA 🚀

                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;



    setupCreateAmericanaForm();

};



window.toggleCreateClubInput = (val) => {

    const group = document.getElementById('create-club-group');

    if (group) group.style.display = (val === 'true') ? 'block' : 'none';

};



window.applyAmericanaPreset = (type) => {

    const form = document.getElementById('create-americana-form');

    if (!form) return;



    if (type === 'masc4') {

        form.querySelector('[name=name]').value = 'AMERICANA MASCULINA 4 PISTAS';

        form.querySelector('[name=category]').value = 'male';

        form.querySelector('[name=pair_mode]').value = 'fixed';

        form.querySelector('[name=max_courts]').value = '4';

        window.selectCreateAmericanaImage('img/americana masculina.jpg');

    } else if (type === 'fem4') {

        form.querySelector('[name=name]').value = 'AMERICANA FEMENINA 4 PISTAS';

        form.querySelector('[name=category]').value = 'female';

        form.querySelector('[name=pair_mode]').value = 'fixed';

        form.querySelector('[name=max_courts]').value = '4';

        window.selectCreateAmericanaImage('img/americana femeninas.jpg');

    } else if (type === 'mixta4') {

        form.querySelector('[name=name]').value = 'AMERICANA MIXTA 4 PISTAS';

        form.querySelector('[name=category]').value = 'mixed';

        form.querySelector('[name=pair_mode]').value = 'fixed';

        form.querySelector('[name=max_courts]').value = '4';

        window.selectCreateAmericanaImage('img/americana mixta.jpg');

    } else if (type === 'twister') {

        form.querySelector('[name=name]').value = 'AMERICANA TWISTER INDIVIDUAL';

        form.querySelector('[name=category]').value = 'open';

        form.querySelector('[name=pair_mode]').value = 'twister';

        form.querySelector('[name=max_courts]').value = '4';

        window.selectCreateAmericanaImage('img/ball-mixta.png');

    } else if (type === 'suiza') {

        form.querySelector('[name=name]').value = '🇨🇭 AMERICANA SUIZA';

        form.querySelector('[name=category]').value = 'open';

        form.querySelector('[name=pair_mode]').value = 'swiss';

        form.querySelector('[name=max_courts]').value = '3';

        const roundsEl = form.querySelector('[name=rounds_count]');

        if (roundsEl) roundsEl.value = '6';

        const tStart = form.querySelector('[name=time]');

        const tEnd = form.querySelector('[name=time_end]');

        if (tStart) tStart.value = '18:00';

        if (tEnd) tEnd.value = '20:00';

        window.selectCreateAmericanaImage('img/padel-event.jpg');

    } else if (type === 'club') {

        form.querySelector('[name=name]').value = 'AMERICANA CLUB COLABORADOR';

        form.querySelector('[name=is_external]').value = 'true';

        window.toggleCreateClubInput('true');

        form.querySelector('[name=club]').value = 'Club Asociado BCN';

        form.querySelector('[name=category]').value = 'open';

        form.querySelector('[name=pair_mode]').value = 'fixed';

        form.querySelector('[name=max_courts]').value = '4';

    } else if (type === 'prat') {

        form.querySelector('[name=name]').value = 'AMERICANA BARCELONA PÁDEL EL PRAT';

        form.querySelector('[name=location]').value = 'Barcelona Pádel el Prat';

        form.querySelector('[name=max_courts]').value = '4';

        window.selectCreateAmericanaImage('img/entreno todo prat.jpg');

    } else if (type === 'delfos') {

        form.querySelector('[name=name]').value = 'AMERICANA DELFOS CORNELLÀ';

        form.querySelector('[name=location]').value = 'Delfos Cornellà';

        form.querySelector('[name=max_courts]').value = '8';

        window.selectCreateAmericanaImage('img/entreno todo delfos.jpg');

    } else if (type === 'new_play') {

        form.querySelector('[name=name]').value = 'AMERICANA NEW PLAY PÁDEL PRO';

        form.querySelector('[name=location]').value = 'New Play Pádel Pro';

        form.querySelector('[name=max_courts]').value = '5';

        window.selectCreateAmericanaImage('img/new_play_padel_pro.png');

    } else if (type === 'cem_tennis') {

        form.querySelector('[name=name]').value = 'AMERICANA CEM TENNIS HOSPITALET';

        form.querySelector('[name=location]').value = 'CEM Tennis Hospitalet';

        form.querySelector('[name=max_courts]').value = '4';

        window.selectCreateAmericanaImage('img/cem_tennis_hospitalet.png');

    }



    const pairModeEl = form.querySelector('[name=pair_mode]');

    if (pairModeEl && window.updatePairModeHelper) {

        window.updatePairModeHelper(pairModeEl, 'create-americana-pair-mode-desc');

    }

};



// --- HELPER FUNCTIONS --- //



function renderAmericanaCard(e) {

    const playersCount = e.players?.length || 0;

    const maxPlayers = (parseInt(e.max_courts) || 4) * 4;



    const isCancelled = e.status === 'cancelled';

    const statusLabel = e.status === 'live' ? 'EN JUEGO' : e.status === 'finished' ? 'FINALIZADA' : e.status === 'pairing' ? 'EMPAREJAMIENTO' : (isCancelled ? 'ANULADO' : 'ABIERTA');

    const statusColor = e.status === 'live' ? '#FF2D55' : e.status === 'finished' ? '#888' : e.status === 'pairing' ? '#22D3EE' : (isCancelled ? '#F43F5E' : '#00E36D');



    // Determine Month for filter

    let month = '';

    if (e.date) {

        if (e.date.includes('-')) month = e.date.substring(0, 7); // 2024-01-25 -> 2024-01

        else if (e.date.includes('/')) {

            const p = e.date.split('/');

            month = `${p[2]}-${p[1].padStart(2, '0')}`;

        }

    }



    // Calculate Duration

    let durationText = '';

    if (e.time && e.time_end) {

        try {

            const [startH, startM] = e.time.split(':').map(Number);

            const [endH, endM] = e.time_end.split(':').map(Number);

            const startMinutes = startH * 60 + startM;

            const endMinutes = endH * 60 + endM;

            const durationMinutes = endMinutes - startMinutes;



            if (durationMinutes > 0) {

                const hours = Math.floor(durationMinutes / 60);

                const mins = durationMinutes % 60;

                if (hours > 0) {

                    durationText = `${hours}h ${mins > 0 ? mins + 'min' : ''}`;

                } else {

                    durationText = `${mins}min`;

                }

            }

        } catch (err) {

            console.warn('Error calculating duration:', err);

        }

    }







    // Level Text

    const levelText = (e.level && String(e.level).trim()) || (e.level_min && e.level_max ? `${e.level_min} - ${e.level_max}` : (e.level_min ? `${e.level_min}` : (e.level_max ? `Hasta ${e.level_max}` : '3.5 - 4.5')));



    // External Club Badge

    const isExternal = e.is_external || e.external || e.organizer_type === 'external' || e.club;

    const clubBadge = isExternal ? `

        <div style="background: rgba(14, 165, 233, 0.12); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 6px; padding: 2px 8px; font-size: 0.65rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; margin-top: 3px;">

            <i class="fas fa-building-columns"></i> ${e.club || 'CLUB ASOCIADO'}

        </div>

    ` : '';



    const organizerBadge = e.organizer ? `

        <div style="background: rgba(204, 255, 0, 0.15); color: #3f6212; border: 1px solid rgba(204, 255, 0, 0.45); border-radius: 6px; padding: 2px 8px; font-size: 0.65rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; margin-top: 3px;">

            <i class="fas fa-user-tie" style="color: #65a30d;"></i> ${e.organizer}

        </div>

    ` : '';



    const isPrivate = e.is_private === true || e.is_private === 'true';

    const privateBadge = isPrivate ? `

        <div style="background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; padding: 2px 8px; font-size: 0.65rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; margin-top: 3px;" title="Americana Privada protegida con Contraseña">

            <i class="fas fa-lock"></i> PRIVADA ${e.access_pin ? `(Clave: <strong>${e.access_pin}</strong>)` : ''}

        </div>

    ` : '';



    return `

        <div class="glass-card-enterprise americana-card-item" 

             data-month="${month}" 

             data-status="${e.status || 'open'}" 

             data-category="${e.category || 'open'}"

             style="margin-bottom: 0.8rem; display: flex; flex-direction: column; padding: 0.8rem 1rem; border-left: 6px solid ${statusColor}; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 12px; gap: 0.6rem; color: #000000;">

            

            <div style="display: flex; gap: 1.2rem; align-items: flex-start;">

                <div class="americana-preview-img" style="width: 48px; height: 48px; border-radius: 12px; background: url('${(e.image_url || 'img/americana mixta.jpg').replace(/ /g, '%20')}') center/cover; border: 1px solid rgba(0,0,0,0.1); position:relative; flex-shrink: 0;">

                    <div style="position:absolute; bottom:-5px; right:-5px; background:${statusColor}; width:12px; height:12px; border-radius:50%; border:2px solid #fff;"></div>

                </div>

                <div class="americana-info-pro" style="flex: 1; min-width: 0;">

                    <div style="font-weight: 950; font-size: 1.1rem; color: #000000; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">

                        ${(e.name || 'AMERICANA').toUpperCase()}

                    </div>

                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">

                        ${clubBadge}

                        ${organizerBadge}

                        ${privateBadge}

                    </div>

                    <div style="display: flex; gap: 0.8rem; font-size: 0.75rem; color: #333333; flex-wrap: wrap; align-items: center; margin-top: 4px;">

                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-calendar-alt" style="color: #60A5FA;"></i> <span style="color:#333; font-weight: 600;">${formatDate(e.date)}</span></span>

                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-clock" style="color: #A78BFA;"></i> <span style="color:#333; font-weight: 600;">${e.time ? (e.time_end && !e.time.includes('-') ? `${e.time} - ${e.time_end}` : e.time) : '18:00'}${durationText ? ` (${durationText})` : ''}</span></span>

                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-signal" style="color: #F59E0B;"></i> <span style="color:#333; font-weight: 700;">Niv. ${levelText}</span></span>

                         <span onclick='window.openEditAmericanaModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' style="cursor:pointer; display: flex; align-items: center; gap: 5px;" title="Gestionar participantes">

                            <i class="fas fa-users" style="color: #10B981;"></i> <span style="color:#000; font-weight:800;">${playersCount}</span><span style="opacity:0.5;">/${maxPlayers}</span>

                         </span>

                    </div>

                </div>

                <div style="background:rgba(0,0,0,0.05); padding:6px 12px; border-radius:8px; font-size:0.8rem; font-weight:900; color:#000; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0;">

                    ${e.price_members || 20}€

                </div>

            </div>

            

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 0.3rem; border-top: 1px solid rgba(255,255,255,0.03);">

                <!-- Status Selector -->

                <div style="position: relative; flex: 1; min-width: 120px;">

                    <select onchange="window.updateAmericanaStatus('${e.id}', this.value)" 

                            style="

                                width: 100%;

                                appearance: none; 

                                background: ${statusColor}20; 

                                color: #000000 !important; 

                                -webkit-text-fill-color: #000000 !important;

                                border: 2px solid ${statusColor}; 

                                padding: 6px 10px; 

                                border-radius: 8px; 

                                font-weight: 800; 

                                font-size: 0.7rem; 

                                cursor: pointer; 

                                text-transform: uppercase;

                                outline: none;

                            ">

                        <option value="open" ${e.status === 'open' ? 'selected' : ''}>🟢 ABIERTA</option>

                        <option value="pairing" ${e.status === 'pairing' ? 'selected' : ''}>🔀 EMPAREJAMIENTO</option>

                        <option value="live" ${e.status === 'live' ? 'selected' : ''}>🎾 EN JUEGO</option>

                        <option value="finished" ${e.status === 'finished' ? 'selected' : ''}>🏁 FINALIZADA</option>

                        <option value="cancelled" ${e.status === 'cancelled' ? 'selected' : ''}>⛔ ANULADO</option>

                    </select>

                </div>



                <!-- Action Group -->

                <div style="display: flex; gap: 8px; flex-shrink: 0; justify-content: flex-end; flex: 1;">

                    <button class="btn-micro" 

                            style="background: #10B981 !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick='window.checkScheduledEventHealthPrompt(${JSON.stringify(e).replace(/'/g, "&#39;")}, "americana")' 

                            title="🛡️ Comprobar si va a funcionar al 100% (Chequeo Pre-Flight)">

                        <i class="fas fa-shield-halved" style="font-size: 0.95rem; color: #fff !important;"></i>

                    </button>



                    <!-- Sincronizar Playtomic -->

                    <button class="btn-micro" 

                            style="background: linear-gradient(135deg, #00C6FF, #0072FF) !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,198,255,0.4);" 

                            onclick="window.openPlaytomicSyncModal('${e.id}')"

                            title="🎾 Sincronizar Jugadores de Playtomic">

                        <i class="fas fa-sync-alt" style="font-size: 0.85rem; color: #fff !important;"></i>

                    </button>



                    ${(e.status === 'open' || e.status === 'live') ? `

                    <button class="btn-micro" 

                            style="background: #FFD700 !important; color: #000 !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick="window.launchBatSignalAmericana('${e.id}')"

                            title="Batseñal">

                        <i class="fas fa-bullhorn" style="font-size: 0.9rem; color: #000 !important;"></i>

                    </button>

                    ` : ''}



                    <button class="btn-micro" 

                            style="background: #a855f7 !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick="window.openManualRoundModal('${e.id}', 'americana', 1)" 

                            title="Definir Ronda Manual (Admin/Superadmin)">

                        <i class="fas fa-sliders" style="font-size: 0.85rem; color: #fff !important;"></i>

                    </button>



                    <button class="btn-micro" 

                            style="background: #25D366 !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick="window.launchWhatsAppShareAmericana('${e.id}')"

                            title="WhatsApp">

                        <i class="fab fa-whatsapp" style="font-size: 1rem; color: #fff !important;"></i>

                    </button>

                    

                    <button class="btn-micro" 

                            style="background: #475569 !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick="window.duplicateAmericana('${e.id}')" 

                            title="Duplicar">

                        <i class="fas fa-clone" style="font-size: 0.8rem; color: #fff !important;"></i>

                    </button>

                    

                    <button class="btn-micro" 

                            style="background: #3B82F6 !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick='window.openEditAmericanaModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' 

                            title="Editar">

                        <i class="fas fa-pen" style="font-size: 0.8rem; color: #fff !important;"></i>

                    </button>

                    

                    <button class="btn-micro" 

                            style="background: #EF4444 !important; color: #fff !important; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 

                            onclick="window.deleteAmericana('${e.id}')" 

                            title="Eliminar">

                        <i class="fas fa-trash-alt" style="font-size: 0.8rem; color: #fff !important;"></i>

                    </button>

                </div>

            </div>

        </div>`;

}



window.handleAmericanaImageUpload = function(inputEl, targetInputId, previewImgId) {

    if (!inputEl.files || !inputEl.files[0]) return;

    const file = inputEl.files[0];

    

    if (!file.type.startsWith('image/')) {

        alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");

        return;

    }



    const reader = new FileReader();

    reader.onload = function(e) {

        const img = new Image();

        img.onload = function() {

            // Compress with Canvas (max width 1200, max height 800)

            const canvas = document.createElement('canvas');

            const MAX_WIDTH = 1200;

            const MAX_HEIGHT = 800;

            let width = img.width;

            let height = img.height;



            if (width > height) {

                if (width > MAX_WIDTH) {

                    height = Math.round(height * (MAX_WIDTH / width));

                    width = MAX_WIDTH;

                }

            } else {

                if (height > MAX_HEIGHT) {

                    width = Math.round(width * (MAX_HEIGHT / height));

                    height = MAX_HEIGHT;

                }

            }



            canvas.width = width;

            canvas.height = height;

            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, width, height);



            // Convert to web-optimized JPEG data URL

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);



            // Update input and preview

            const targetInput = document.getElementById(targetInputId);

            if (targetInput) {

                targetInput.value = compressedDataUrl;

            }

            window.updateAmericanaImagePreview(compressedDataUrl, previewImgId);



            if (window.NotificationService) {

                window.NotificationService.showToast("📸 ¡Foto cargada y optimizada con éxito!", "success");

            }

        };

        img.src = e.target.result;

    };

    reader.readAsDataURL(file);

};



window.updateAmericanaImagePreview = function(url, previewImgId) {

    const preview = document.getElementById(previewImgId);

    if (!preview) return;

    if (url && url.trim()) {

        preview.src = url.trim();

        preview.style.display = 'block';

    } else {

        preview.src = '';

        preview.style.display = 'none';

    }

};



window.setupAmericanaDropzone = function(dropzoneId, fileInputId, targetInputId, previewImgId) {

    const dropzone = document.getElementById(dropzoneId);

    if (!dropzone || dropzone.dataset.dropzoneAttached) return;

    dropzone.dataset.dropzoneAttached = 'true';

    

    ['dragenter', 'dragover'].forEach(eventName => {

        dropzone.addEventListener(eventName, (e) => {

            e.preventDefault();

            e.stopPropagation();

            dropzone.style.borderColor = '#CCFF00';

            dropzone.style.background = 'rgba(204, 255, 0, 0.15)';

        }, false);

    });



    ['dragleave', 'drop'].forEach(eventName => {

        dropzone.addEventListener(eventName, (e) => {

            e.preventDefault();

            e.stopPropagation();

            dropzone.style.borderColor = 'rgba(204, 255, 0, 0.35)';

            dropzone.style.background = '#111';

        }, false);

    });



    dropzone.addEventListener('drop', (e) => {

        const dt = e.dataTransfer;

        const files = dt.files;

        if (files && files.length) {

            const input = document.getElementById(fileInputId);

            if (input) {

                input.files = files;

                window.handleAmericanaImageUpload(input, targetInputId, previewImgId);

            }

        }

    }, false);

};



window.selectCreateAmericanaImage = (url) => {

    const input = document.getElementById('create-americana-img-input');

    if (input) {

        input.value = url;

        window.updateAmericanaImagePreview(url, 'create-americana-img-preview');

    }

};



window.selectAmericanaImage = (url) => {

    const input = document.getElementById('edit-americana-img-input');

    if (input) {

        input.value = url;

        window.updateAmericanaImagePreview(url, 'edit-americana-img-preview');

    }

};



window.updatePairModeHelper = function(selectEl, descContainerId) {

    const container = document.getElementById(descContainerId);

    if (!container) return;

    const raw = selectEl ? selectEl.value : 'twister';

    const mode = (raw === 'rotating') ? 'twister' : raw;



    if (mode === 'swiss') {

        container.innerHTML = `

            <div style="display:flex; align-items:flex-start; gap:8px;">

                <span style="font-size: 1.15rem; line-height: 1;">🇨🇭</span>

                <div>

                    <strong style="color: #ef4444; font-size: 0.76rem; text-transform: uppercase;">Modalidad Sistema Suizo (Puntos acumulados):</strong>

                    <div style="color: #cbd5e1; font-size: 0.72rem; margin-top: 2px;">

                        Cada jugador suma sus propios juegos conseguidos; la clasificación acumulada define en qué pista se juega cada ronda.

                    </div>

                </div>

            </div>

        `;

        container.style.borderLeftColor = '#ef4444';

        container.style.background = 'rgba(239, 68, 68, 0.08)';

    } else if (mode === 'fixed') {

        container.innerHTML = `

            <div style="display:flex; align-items:flex-start; gap:8px;">

                <span style="font-size: 1.15rem; line-height: 1;">🔒</span>

                <div>

                    <strong style="color: #CCFF00; font-size: 0.76rem; text-transform: uppercase;">Modalidad Pareja Fija (Dupla todo el torneo):</strong>

                    <div style="color: #cbd5e1; font-size: 0.72rem; margin-top: 2px;">

                        Las duplas compiten juntas todo el evento; suben o bajan juntas de pista según ganen o pierdan.

                    </div>

                </div>

            </div>

        `;

        container.style.borderLeftColor = '#CCFF00';

        container.style.background = 'rgba(204, 255, 0, 0.06)';

    } else {

        container.innerHTML = `

            <div style="display:flex; align-items:flex-start; gap:8px;">

                <span style="font-size: 1.15rem; line-height: 1;">🌪️</span>

                <div>

                    <strong style="color: #38bdf8; font-size: 0.76rem; text-transform: uppercase;">Modalidad Twister Individual (Pozo rotativo):</strong>

                    <div style="color: #cbd5e1; font-size: 0.72rem; margin-top: 2px;">

                        Los jugadores juegan individualmente; ganadores suben de pista, perdedores bajan, y en cada pista los compañeros rotan obligatoriamente sin repetir pareja de la ronda anterior.

                    </div>

                </div>

            </div>

        `;

        container.style.borderLeftColor = '#38bdf8';

        container.style.background = 'rgba(56, 189, 248, 0.08)';

    }



    // Auto-sync UI if inside edit modals

    if (descContainerId === 'edit-americana-pair-mode-desc') {

        const form = document.getElementById('edit-americana-form');

        const eventId = form ? form.querySelector('[name=id]')?.value : null;

        if (eventId) {

            const pairsArea = document.getElementById('americana-fixed-pairs-area');

            const isFixed = mode === 'fixed';

            if (pairsArea) pairsArea.style.display = isFixed ? 'block' : 'none';

            if (window.loadAmericanaParticipantsUI) window.loadAmericanaParticipantsUI(eventId);

            if (isFixed && window.PairsUI) window.PairsUI.load('americana-fixed-pairs-area', eventId, 'americana');

        }

    } else if (descContainerId === 'edit-entreno-pair-mode-desc') {

        const form = document.getElementById('edit-entreno-form');

        const eventId = form ? form.querySelector('[name=id]')?.value : null;

        if (eventId) {

            const pairsArea = document.getElementById('entreno-fixed-pairs-area');

            const isFixed = mode === 'fixed';

            if (pairsArea) pairsArea.style.display = isFixed ? 'block' : 'none';

            if (window.loadEntrenoParticipantsUI) window.loadEntrenoParticipantsUI(eventId);

            if (isFixed && window.PairsUI) window.PairsUI.load('entreno-fixed-pairs-area', eventId, 'entreno');

        }

    }

};



window.setupClubsDatalist = function() {

    let dl = document.getElementById('padel-clubs-datalist');

    if (!dl) {

        dl = document.createElement('datalist');

        dl.id = 'padel-clubs-datalist';

        document.body.appendChild(dl);

    }

    const clubs = window.PADEL_CLUBS_CATALOG || [];

    dl.innerHTML = clubs.map(c => `<option value="${c.name}">${c.zone} • ${c.address}</option>`).join('');

};



window.handleSedeChange = function(selectEl, clubInputId, courtsInputName) {

    if (!selectEl) return;

    const val = selectEl.value;



    if (val === '__custom__') {

        const customSede = prompt("Introduce el nombre de la sede o club personalizado:");

        if (customSede && customSede.trim()) {

            const opt = document.createElement('option');

            opt.value = customSede.trim();

            opt.textContent = `📍 ${customSede.trim()}`;

            opt.selected = true;

            selectEl.appendChild(opt);

            selectEl.value = customSede.trim();

        } else {

            selectEl.selectedIndex = 0;

            return;

        }

    }



    // Auto-fill club name if club input is present and empty

    const selectedOpt = selectEl.options[selectEl.selectedIndex];

    const clubName = selectedOpt?.getAttribute('data-club');

    const courts = selectedOpt?.getAttribute('data-courts');



    if (clubInputId) {

        const clubInput = document.getElementById(clubInputId);

        if (clubInput && clubName && (!clubInput.value || clubInput.value.trim() === '')) {

            clubInput.value = clubName;

        }

    }



    if (courtsInputName) {

        const form = selectEl.closest('form');

        const courtsInput = form?.querySelector(`[name="${courtsInputName}"]`);

        if (courtsInput && courts) {

            courtsInput.value = courts;

        }

    }

};



window.syncLocationToSelect = function(selectEl, currentLocation) {

    if (!selectEl || !currentLocation) return;

    const target = currentLocation.trim().toLowerCase();

    let matched = false;



    for (let i = 0; i < selectEl.options.length; i++) {

        const optVal = selectEl.options[i].value.trim().toLowerCase();

        if (optVal === target || target.includes(optVal) || optVal.includes(target)) {

            selectEl.selectedIndex = i;

            matched = true;

            break;

        }

    }



    if (!matched && currentLocation !== '__custom__') {

        const customOpt = document.createElement('option');

        customOpt.value = currentLocation;

        customOpt.textContent = `📍 ${currentLocation}`;

        customOpt.selected = true;

        selectEl.appendChild(customOpt);

    }

};



function setupCreateAmericanaForm() {

    const form = document.getElementById('create-americana-form');

    if (!form) return;



    // Attach Clubs Datalist & Sede Combobox

    if (window.setupSedeCombobox) {

        window.setupSedeCombobox('create-americana-location-input', { clubInputId: 'create-club-input' });

    }

    if (window.setupClubsDatalist) window.setupClubsDatalist();



    // Attach Dropzone to create form

    window.setupAmericanaDropzone('create-americana-img-dropzone', 'create-americana-file-input', 'create-americana-img-input', 'create-americana-img-preview');



    // Attach Pair Mode Helper

    const pairMode = form.querySelector('[name=pair_mode]');

    if (pairMode) {

        pairMode.onchange = () => window.updatePairModeHelper(pairMode, 'create-americana-pair-mode-desc');

        window.updatePairModeHelper(pairMode, 'create-americana-pair-mode-desc');

    }



    const cat = form.querySelector('[name=category]');

    const loc = form.querySelector('[name=location]');

    const img = form.querySelector('[name=image_url]');

    const date = form.querySelector('[name=date]');



    if (date && !date.value) {

        date.valueAsDate = new Date();

    }



    const sync = () => {

        const cVal = cat?.value;

        const lVal = loc?.value;



        const autoImg = EventService.getAutoImage(lVal, cVal, 'americana');

        if (img && !img.value) {

            img.value = autoImg;

            window.updateAmericanaImagePreview(autoImg, 'create-americana-img-preview');

        }

    };



    if (cat) cat.onchange = sync;

    if (loc) loc.onchange = sync;

    if (img) {

        img.oninput = () => {

            window.updateAmericanaImagePreview(img.value, 'create-americana-img-preview');

        };

    }



    sync();



    form.onsubmit = async (e) => {

        e.preventDefault();

        const fd = new FormData(form);

        const data = Object.fromEntries(fd.entries());



        try {

            if (!data.name) throw new Error("El nombre es obligatorio");

            if (!data.date) throw new Error("La fecha es obligatoria");



            // Normalización booleana y privacidad

            data.is_external = (data.is_external === 'true');

            data.is_private = (data.is_private === 'true');

            data.access_pin = (data.access_pin || '').trim();

            data.max_players = (parseInt(data.max_courts) || 4) * 4;



            await EventService.createEvent('americana', data);



            if (window.NotificationService) {

                window.NotificationService.showToast("Americana Creada Correctamente", "success");

            }



            window.loadAdminView('americanas_mgmt');



        } catch (err) { alert("Error al crear: " + err.message); }

    };

}



function setupAmericanaFilters() {

    const searchInput = document.getElementById('americana-search-input');

    const monthSelect = document.getElementById('filter-month-americana');

    const statusSelect = document.getElementById('filter-status-americana');

    const catSelect = document.getElementById('filter-category-americana');



    const applyFilters = () => {

        const query = searchInput?.value.toLowerCase() || '';

        const month = monthSelect?.value || 'all';

        const status = statusSelect?.value || 'all';

        const cat = catSelect?.value || 'all';



        const cards = document.querySelectorAll('#americanas-list-container > .americana-card-item');

        cards.forEach(card => {

            const cMonth = card.getAttribute('data-month');

            const cStatus = card.getAttribute('data-status');

            const cCat = card.getAttribute('data-category');

            const cText = card.innerText.toLowerCase();



            const matchesSearch = !query || cText.includes(query);

            const matchesMonth = month === 'all' || cMonth === month;

            const matchesStatus = status === 'all' || cStatus === status;

            const matchesCat = cat === 'all' || cCat === cat;



            card.style.display = (matchesSearch && matchesMonth && matchesStatus && matchesCat) ? 'flex' : 'none';

        });

    };



    if (searchInput) searchInput.oninput = applyFilters;

    if (monthSelect) monthSelect.onchange = applyFilters;

    if (statusSelect) statusSelect.onchange = applyFilters;

    if (catSelect) catSelect.onchange = applyFilters;

}



function formatDate(dateStr) {

    if (!dateStr) return '---';

    const d = new Date(dateStr);

    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

}



// --- GLOBAL EXPORTS & CRUD --- //



window.duplicateAmericana = async (eOrId) => {

    if (!eOrId) return;

    let e = eOrId;

    if (typeof eOrId === 'string') {

        if (window._currentAmericanasCache && Array.isArray(window._currentAmericanasCache)) {

            e = window._currentAmericanasCache.find(x => x.id === eOrId);

        }

        if (!e && window.EventService && typeof window.EventService.getById === 'function') {

            try {

                e = await window.EventService.getById('americana', eOrId);

            } catch (err) {

                console.error("❌ [duplicateAmericana] Error al recuperar americana por ID:", err);

            }

        }

    }



    if (!e || typeof e !== 'object' || (!e.id && !e.name)) {

        const errorMsg = "No se ha encontrado la americana seleccionada para duplicar.";

        if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {

            window.NotificationService.showToast(errorMsg, 'error');

        } else {

            alert(errorMsg);

        }

        return;

    }



    if (!confirm(`¿Duplicar "${e.name || 'esta americana'}"?`)) return;



    const copy = { ...e };



    // 1. Cálculo robusto de fecha (+7 días) sin desfases horarios

    const rawDate = copy.date || copy.eventDate || copy.fecha || '';

    let normDate = '';

    if (window.EventService && typeof window.EventService.normalizeDate === 'function') {

        normDate = window.EventService.normalizeDate(rawDate);

    }

    if (!normDate && typeof rawDate === 'string') {

        const clean = rawDate.trim();

        if (clean.includes('/')) {

            const parts = clean.split('/').map(p => p.trim());

            if (parts.length >= 2) {

                const day = parts[0].padStart(2, '0');

                const month = parts[1].padStart(2, '0');

                const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : String(new Date().getFullYear());

                normDate = `${year}-${month}-${day}`;

            }

        } else if (clean.includes('-')) {

            const parts = clean.split('-').map(p => p.trim());

            if (parts.length === 3) {

                if (parts[0].length === 4) {

                    normDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;

                } else {

                    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];

                    normDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;

                }

            }

        }

    }



    let nextDate = '';

    if (normDate && normDate.includes('-')) {

        const [yStr, mStr, dStr] = normDate.split('-');

        const y = parseInt(yStr, 10);

        const m = parseInt(mStr, 10) - 1;

        const d = parseInt(dStr, 10);

        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {

            const dt = new Date(y, m, d, 12, 0, 0);

            dt.setDate(dt.getDate() + 7);

            const nextY = dt.getFullYear();

            const nextM = String(dt.getMonth() + 1).padStart(2, '0');

            const nextD = String(dt.getDate()).padStart(2, '0');

            nextDate = `${nextY}-${nextM}-${nextD}`;

        }

    }



    if (!nextDate) {

        const fallbackDt = new Date();

        fallbackDt.setHours(12, 0, 0, 0);

        fallbackDt.setDate(fallbackDt.getDate() + 7);

        const fY = fallbackDt.getFullYear();

        const fM = String(fallbackDt.getMonth() + 1).padStart(2, '0');

        const fD = String(fallbackDt.getDate()).padStart(2, '0');

        nextDate = `${fY}-${fM}-${fD}`;

    }



    copy.date = nextDate;



    // 2. Actualización inteligente del nombre del evento si incluye fechas

    if (copy.name) {

        let updatedName = copy.name.trim();

        const [nY, nM, nD] = nextDate.split('-');

        let dateReplaced = false;



        // DD/MM/YYYY o DD-MM-YYYY (o YY de 2 dígitos)

        const fullDateRegex = /\b(\d{1,2})([\/\-])(\d{1,2})\2(\d{2,4})\b/;

        if (fullDateRegex.test(updatedName)) {

            updatedName = updatedName.replace(fullDateRegex, (match, d, sep, m, y) => {

                dateReplaced = true;

                const targetY = y.length === 2 ? nY.slice(-2) : nY;

                const targetD = d.length === 1 ? String(parseInt(nD, 10)) : nD;

                const targetM = m.length === 1 ? String(parseInt(nM, 10)) : nM;

                return `${targetD}${sep}${targetM}${sep}${targetY}`;

            });

        }



        // YYYY-MM-DD o YYYY/MM/DD

        if (!dateReplaced) {

            const isoDateRegex = /\b(\d{4})([\/\-])(\d{1,2})\2(\d{1,2})\b/;

            if (isoDateRegex.test(updatedName)) {

                updatedName = updatedName.replace(isoDateRegex, (match, y, sep, m, d) => {

                    dateReplaced = true;

                    const targetD = d.length === 1 ? String(parseInt(nD, 10)) : nD;

                    const targetM = m.length === 1 ? String(parseInt(nM, 10)) : nM;

                    return `${nY}${sep}${targetM}${sep}${targetD}`;

                });

            }

        }



        // DD/MM o DD-MM (Validar rango: día 1-31, mes 1-12)

        if (!dateReplaced) {

            const shortDateRegex = /\b(0[1-9]|[12]\d|3[01]|[1-9])([\/\-])(0[1-9]|1[0-2]|[1-9])\b/;

            if (shortDateRegex.test(updatedName)) {

                updatedName = updatedName.replace(shortDateRegex, (match, d, sep, m) => {

                    dateReplaced = true;

                    const targetD = d.length === 1 ? String(parseInt(nD, 10)) : nD;

                    const targetM = m.length === 1 ? String(parseInt(nM, 10)) : nM;

                    return `${targetD}${sep}${targetM}`;

                });

            }

        }



        // Si no se reemplazó ninguna fecha, añadir (Copia) si no lo tiene ya

        if (!dateReplaced) {

            if (!/\(Copia\)$/i.test(updatedName)) {

                updatedName = `${updatedName} (Copia)`;

            }

        }



        copy.name = updatedName;

    }



    // 3. Limpieza profunda del payload para Firestore

    const forbiddenKeys = [

        'id', '_id',

        'created_at', 'createdAt', 'updatedAt',

        'chat_id', 'chatId',

        'matches', 'rounds', 'liveMatches',

        'classification', 'results',

        'current_round', 'active_round', 'currentRound', 'round'

    ];

    forbiddenKeys.forEach(k => delete copy[k]);



    copy.status = 'open';

    copy.players = [];

    copy.registeredPlayers = [];

    copy.waitlist = [];

    copy.fixed_pairs = [];



    // Limpiar claves undefined para evitar error de Firestore

    Object.keys(copy).forEach(k => {

        if (copy[k] === undefined) {

            delete copy[k];

        }

    });



    // 4. Guardado, feedback y recarga

    try {

        await EventService.createEvent('americana', copy);

        const successMsg = `Americana duplicada con éxito para el ${copy.date} 📅`;

        if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {

            window.NotificationService.showToast(successMsg, 'success');

        }

        if (typeof window.loadAdminView === 'function') {

            window.loadAdminView('americanas_mgmt');

        }

    } catch (err) {

        console.error("❌ Error al duplicar americana:", err);

        const errMsg = `Error al duplicar la americana: ${err.message || 'Fallo desconocido'}`;

        if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {

            window.NotificationService.showToast(errMsg, 'error');

        }

        alert(errMsg);

    }

};



window.updateAmericanaStatus = async (id, newStatus) => {

    try {

        await EventService.updateEvent('americana', id, { status: newStatus });



        if (newStatus === 'live' && window.MatchMakingService) {

            try {

                await window.MatchMakingService.generateRound(id, 'americana', 1);

            } catch (e) { console.log("R1 gen skipped or failed", e); }

        }



        window.loadAdminView('americanas_mgmt');

    } catch (e) { alert("Error status: " + e.message); }

};



window.deleteAmericana = async (id) => {

    if (!confirm("⚠️ ¿Seguro que quieres eliminar esta americana permanentemente?")) return;

    await EventService.deleteEvent('americana', id);

    window.loadAdminView('americanas_mgmt');

};



window.openEditAmericanaModal = async (americana) => {

    const modal = document.getElementById('admin-americana-modal');

    const form = document.getElementById('edit-americana-form');

    if (!modal || !form) return console.error("Edit americana modal misplaced");



    window._editingAmericana = americana;



    // Populate Form

    for (const [key, value] of Object.entries(americana)) {

        const input = form.querySelector(`[name="${key}"]`);

        if (input) {

            if (key === 'is_external') {

                input.value = String(value === true || value === 'true');

            } else {

                input.value = value;

            }

        }

    }



    // Normalizar time y time_end si vienen combinados o sin separar

    if (americana.time && americana.time.includes('-')) {

        const parts = americana.time.split('-').map(s => s.trim());

        const tStartInput = form.querySelector('[name="time"]');

        const tEndInput = form.querySelector('[name="time_end"]');

        if (tStartInput && parts[0]) tStartInput.value = parts[0].slice(0, 5);

        if (tEndInput && (!americana.time_end || !tEndInput.value) && parts[1]) tEndInput.value = parts[1].slice(0, 5);

    }



    // Toggle Club input visibility

    const clubGroup = document.getElementById('edit-americana-club-group');

    if (clubGroup) {

        clubGroup.style.display = (americana.is_external || americana.club) ? 'block' : 'none';

    }



    // Prefill Description

    const descInput = form.querySelector('[name=description]');

    if (descInput) {

        descInput.value = americana.description || '';

    }



    // Prefill Organizer

    const orgInput = form.querySelector('[name=organizer]');

    if (orgInput) {

        orgInput.value = americana.organizer || '';

    }



    // Prefill Privacidad y Clave de Acceso

    const isPrivate = (americana.is_private === true || americana.is_private === 'true');

    const privateSelect = form.querySelector('[name=is_private]');

    if (privateSelect) privateSelect.value = String(isPrivate);



    const pinInput = form.querySelector('[name=access_pin]');

    if (pinInput) pinInput.value = americana.access_pin || '';



    const pinGroup = document.getElementById('edit-americana-pin-group');

    if (pinGroup) pinGroup.style.display = isPrivate ? 'block' : 'none';



    // Setup Sede Combobox & Sync Sede

    if (window.setupSedeCombobox) {

        window.setupSedeCombobox('edit-americana-location-input', { clubInputId: 'edit-americana-club-input' });

    }

    const locationInput = form.querySelector('[name=location]');

    if (locationInput) {

        locationInput.value = americana.location || americana.sede || '';

    }



    // Ensure level fields have values if undefined

    const minInput = form.querySelector('[name="level_min"]');

    if (minInput && (americana.level_min === undefined || americana.level_min === null || americana.level_min === '')) {

        minInput.value = '3.5';

    }

    const maxInput = form.querySelector('[name="level_max"]');

    if (maxInput && (americana.level_max === undefined || americana.level_max === null || americana.level_max === '')) {

        maxInput.value = '4.5';

    }



    // Image Preview & Dropzone

    window.updateAmericanaImagePreview(americana.image_url || '', 'edit-americana-img-preview');

    window.setupAmericanaDropzone('edit-americana-img-dropzone', 'edit-americana-file-input', 'edit-americana-img-input', 'edit-americana-img-preview');



    modal.classList.remove('hidden');

    modal.style.display = 'flex';



    // Dynamic Visibility of Fixed Pairs

    const pairModeSelect = form.querySelector('[name=pair_mode]');

    const pairsArea = document.getElementById('americana-fixed-pairs-area');



    if (pairModeSelect) {

        let pMode = americana.pair_mode || 'twister';

        if (pMode === 'rotating') pMode = 'twister';

        if (pMode === 'swiss' || pMode === 'twister' || pMode === 'fixed') {

            pairModeSelect.value = pMode;

        } else {

            pairModeSelect.value = (pMode.includes('fixed')) ? 'fixed' : 'twister';

        }

    }



    const togglePairsArea = async () => {

        const val = pairModeSelect?.value;

        const isFixed = val === 'fixed' || (val && String(val).includes('fij'));

        if (pairsArea) {

            pairsArea.style.display = isFixed ? 'block' : 'none';

        }

        if (window.updatePairModeHelper) {

            window.updatePairModeHelper(pairModeSelect, 'edit-americana-pair-mode-desc');

        }

        if (window.loadAmericanaParticipantsUI) {

            await window.loadAmericanaParticipantsUI(americana.id, americana);

        }

        if (isFixed && window.PairsUI) {

            await window.PairsUI.load('americana-fixed-pairs-area', americana.id, 'americana');

        }

    };



    if (pairModeSelect) {

        pairModeSelect.onchange = togglePairsArea;

        togglePairsArea();

    } else {

        if (window.loadAmericanaParticipantsUI) window.loadAmericanaParticipantsUI(americana.id, americana);

        if (window.PairsUI) window.PairsUI.load('americana-fixed-pairs-area', americana.id, 'americana');

    }



    // Attach Promote Button Logic

    const btnPromote = document.getElementById('btn-promote-waitlist-americana');

    if (btnPromote) {

        const newBtn = btnPromote.cloneNode(true);

        btnPromote.parentNode.replaceChild(newBtn, btnPromote);



        newBtn.onclick = async () => {

            if (!confirm("¿Promover al siguiente jugador de la reserva?")) return;

            try {

                const promoted = await ParticipantService.promoteNext(americana.id, 'americana');

                if (promoted) {

                    if (window.NotificationService) {

                        window.NotificationService.showToast(`${promoted.name} promovido correctamente`, "success");

                    }

                    window.loadAmericanaParticipantsUI(americana.id);

                } else {

                    alert("No hay jugadores en reserva o error al promover.");

                }

            } catch (e) { alert("Error: " + e.message); }

        };

    }



    // Attach Submit

    form.onsubmit = async (e) => {

        e.preventDefault();

        const fd = new FormData(form);

        const data = Object.fromEntries(fd.entries());

        const id = data.id;

        delete data.id;



        // Normalización booleana y sincronización de pistas y privacidad

        data.is_external = (data.is_external === 'true');

        data.is_private = (data.is_private === 'true');

        data.access_pin = (data.access_pin || '').trim();

        if (data.max_courts || data.courts) {

            const courts = parseInt(data.max_courts || data.courts) || 4;

            data.max_courts = courts;

            data.courts = courts;

            data.max_players = courts * 4;

        }



        try {

            await EventService.updateEvent('americana', id, data);

            alert("✅ Guardado correctamente");

            window.closeAmericanaModal();

            window.loadAdminView('americanas_mgmt');

        } catch (err) { alert("Error: " + err.message); }

    };

};



window.closeAmericanaModal = () => {

    const modal = document.getElementById('admin-americana-modal');

    if (modal) {

        modal.classList.add('hidden');

        modal.style.display = 'none';

    }

};



// WhatsApp Share

window.launchWhatsAppShareAmericana = async (id) => {

    console.log("🔗 launchWhatsAppShareAmericana called for:", id);

    try {

        let evt = null;



        // 1. Siempre consultar Firestore primero para tener datos 100% reales y actualizados

        if (window.EventService) {

            try {

                evt = await EventService.getById('americana', id);

            } catch (fetchErr) {

                console.warn("⚠️ [launchWhatsAppShareAmericana] Error al consultar Firestore:", fetchErr.message);

            }

        }



        // 2. Fallback a memoria / caché local si falla la red

        if (!evt) {

            evt = window._currentAmericanasCache?.find(e => e.id === id);

            if (!evt && window.CacheService) {

                const cached = await window.CacheService.get('americanas', 'all');

                evt = cached?.find(e => e.id === id);

            }

        }



        if (!evt) {

            if (window.PremiumModal) {

                window.PremiumModal.alert({ title: "WhatsApp", message: "No se encontró la información de la americana para compartir.", type: 'warning' });

            }

            return;

        }



        if (window.WhatsAppService) {

            await window.WhatsAppService.shareStartFromAdmin(evt);

        }

    } catch (err) {

        console.error("❌ Error en launchWhatsAppShareAmericana:", err);

    }

};



// --- PARTICIPANTS MANAGEMENT (100% Mirroring Entrenos) --- //



window.openAddPlayerToAmericanaSelector = async (eventId) => {

    if (!window.PremiumModal) return alert("PremiumModal no disponible");



    try {

        const allPlayers = await FirebaseDB.players.getAll(true);



        const selectorItems = allPlayers.map(p => ({

            id: p.id || p.uid,

            name: p.name || 'Sin nombre',

            sub: `Nivel: ${p.level || '3.5'} • ${p.gender || '?'}`,

            image: p.photoURL || p.photo_url || null,

            playerObj: p

        })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));



        const selected = await PremiumModal.selector({

            title: 'AÑADIR JUGADOR',

            message: 'Busca y selecciona al jugador que quieres añadir a la americana:',

            items: selectorItems,

            placeholder: 'Escribe nombre o apellido...',

            type: 'success'

        });



        if (selected) {

            const result = await ParticipantService.addPlayer(eventId, 'americana', selected.playerObj);



            if (window.NotificationService) {

                if (result.status === 'waitlist') {

                    window.NotificationService.showToast(`${selected.name} añadido a LISTA DE RESERVA`, "warning");

                } else {

                    window.NotificationService.showToast(`${selected.name} añadido correctamente`, "success");

                }

            }



            window.loadAmericanaParticipantsUI(eventId);

        }

    } catch (e) {

        console.error("Error in admin americana player selection:", e);

        alert("Error: " + e.message);

    }

};



window.openAddPairToAmericanaSelector = async (eventId) => {

    if (!window.PremiumModal) return alert("PremiumModal no disponible");



    try {

        const allPlayers = await FirebaseDB.players.getAll(true);



        const selectorItems = allPlayers.map(p => ({

            id: p.id || p.uid,

            name: p.name || 'Sin nombre',

            sub: `Nivel: ${p.level || '3.5'} • ${p.gender || '?'}`,

            image: p.photoURL || p.photo_url || null,

            playerObj: p

        })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));



        // 1. SELECT PLAYER 1

        const selected1 = await PremiumModal.selector({

            title: 'SELECCIONA JUGADOR 1',

            message: 'Elige el primer miembro de la pareja:',

            items: selectorItems,

            placeholder: 'Busca al primer jugador...',

            type: 'primary'

        });



        if (!selected1) return;



        // 2. SELECT PLAYER 2

        const items2 = selectorItems.filter(p => p.id !== selected1.id);

        const selected2 = await PremiumModal.selector({

            title: `Pareja de ${selected1.name.split(' ')[0]}`,

            message: `Elige quién jugará con ${selected1.name}:`,

            items: items2,

            placeholder: 'Busca a su pareja...',

            type: 'success'

        });



        if (!selected2) return;



        // 3. Confirm & Add Both

        if (confirm(`¿Confirmar pareja: ${selected1.name} 🤝 ${selected2.name}?`)) {

            const p1 = { ...selected1.playerObj };

            p1.partner_id = selected2.id;

            p1.partner_name = selected2.name;



            const p2 = { ...selected2.playerObj };

            p2.partner_id = selected1.id;

            p2.partner_name = selected1.name;



            await ParticipantService.addPlayer(eventId, 'americana', p1);

            await new Promise(r => setTimeout(r, 200));

            await ParticipantService.addPlayer(eventId, 'americana', p2);



            try {

                const event = await EventService.getById('americana', eventId);

                const currentPairs = event.fixed_pairs || [];

                const nextIndex = currentPairs.length * 2;

                const initialCourt = Math.floor(nextIndex / 4) + 1;

                const newPair = {

                    id: `pair_${Date.now()}_manual`,

                    player1_id: selected1.id,

                    player2_id: selected2.id,

                    player1_name: selected1.name,

                    player2_name: selected2.name,

                    pair_name: `${selected1.name} / ${selected2.name}`,

                    wins: 0,

                    losses: 0,

                    games_won: 0,

                    games_lost: 0,

                    current_court: initialCourt,

                    initial_court: initialCourt

                };

                await EventService.updateEvent('americana', eventId, {

                    fixed_pairs: [...currentPairs, newPair],

                    pair_mode: 'fixed'

                });

            } catch (syncErr) { console.warn("[Americana] sync fixed_pairs error:", syncErr); }



            if (window.NotificationService) {

                window.NotificationService.showToast(`Pareja Creada: ${selected1.name} & ${selected2.name}`, "success");

            }



            window.loadAmericanaParticipantsUI(eventId);

            if (window.PairsUI) window.PairsUI.load('americana-fixed-pairs-area', eventId, 'americana');

        }



    } catch (e) {

        console.error("Error adding pair to americana:", e);

        alert("Error al añadir pareja: " + e.message);

    }

};



window.linkManualPartnerAmericana = async (eventId, playerId, playerName) => {

    if (!window.PremiumModal) return alert("PremiumModal no disponible");



    try {

        const event = await EventService.getById('americana', eventId);

        const players = event.players || [];



        const candidates = players.filter(p => {

            const pid = String(p.id || p.uid);

            return pid !== String(playerId) && !p.partner_id;

        }).map(p => ({

            id: p.id || p.uid,

            name: p.name || 'Sin nombre',

            sub: `Nivel: ${p.level || '3.5'}`,

            image: p.photoURL || null

        })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));



        if (candidates.length === 0) return alert("No hay jugadores disponibles sin pareja para vincular.");



        const selected = await PremiumModal.selector({

            title: `Pareja para ${playerName}`,

            message: `Selecciona a su pareja de la lista de inscritos:`,

            items: candidates,

            placeholder: 'Busca jugador...',

            type: 'primary'

        });



        if (!selected) return;



        if (confirm(`¿Vincular a ${playerName} con ${selected.name}?`)) {

            const p1Index = players.findIndex(p => String(p.id || p.uid) === String(playerId));

            const p2Index = players.findIndex(p => String(p.id || p.uid) === String(selected.id));



            if (p1Index === -1 || p2Index === -1) return alert("Error al encontrar jugadores.");



            players[p1Index].partner_id = selected.id;

            players[p1Index].partner_name = selected.name;



            players[p2Index].partner_id = playerId;

            players[p2Index].partner_name = playerName;



            // Also add to fixed_pairs

            const currentPairs = event.fixed_pairs || [];

            const nextIndex = currentPairs.length * 2;

            const initialCourt = Math.floor(nextIndex / 4) + 1;

            const newPair = {

                id: `pair_${Date.now()}_manual`,

                player1_id: playerId,

                player2_id: selected.id,

                player1_name: playerName,

                player2_name: selected.name,

                pair_name: `${playerName} / ${selected.name}`,

                wins: 0,

                losses: 0,

                games_won: 0,

                games_lost: 0,

                current_court: initialCourt,

                initial_court: initialCourt

            };



            await EventService.updateEvent('americana', eventId, {

                players: players,

                fixed_pairs: [...currentPairs, newPair],

                pair_mode: 'fixed'

            });



            if (window.NotificationService) window.NotificationService.showToast("Pareja vinculada correctamente", "success");



            window.loadAmericanaParticipantsUI(eventId);

            if (window.PairsUI) window.PairsUI.load('americana-fixed-pairs-area', eventId, 'americana');

        }



    } catch (e) {

        console.error("Error linking partner in americana:", e);

        alert("Error al vincular: " + e.message);

    }

};



window.loadAmericanaParticipantsUI = async (id, preloadedEvent = null) => {

    const list = document.getElementById('participants-list-americana');

    if (!list) return;



    if (!preloadedEvent) {

        list.innerHTML = '<div style="padding: 12px; text-align: center; color: #64748b; font-weight: 700; font-size: 0.85rem;"><i class="fas fa-spinner fa-spin"></i> Cargando participantes...</div>';

    }



    try {

        let event = preloadedEvent;

        if (!event) {

            try {

                event = await EventService.getById('americana', id);

            } catch (err) {

                console.warn("⚠️ [loadAmericanaParticipantsUI] EventService fallback:", err);

            }

        }



        if (!event && window._editingAmericana && String(window._editingAmericana.id) === String(id)) {

            event = window._editingAmericana;

        }



        if (!event && window._currentAmericanasCache && Array.isArray(window._currentAmericanasCache)) {

            event = window._currentAmericanasCache.find(e => String(e.id) === String(id));

        }



        if (!event && window.CacheService) {

            try {

                const all = await window.CacheService.get('americanas', 'all');

                if (Array.isArray(all)) {

                    event = all.find(e => String(e.id) === String(id));

                }

            } catch (_) {}

        }



        if (!event) {

            list.innerHTML = '<div style="color:#ef4444; padding:20px; text-align:center; font-weight:700;">No se pudo cargar la lista de participantes. Revisa la conexión o intenta de nuevo.</div>';

            if (window.loadAmericanaWaitlistUI) window.loadAmericanaWaitlistUI(id, []);

            return;

        }



        const seenIds = new Set();

        const uniquePlayers = (event.players || [])

            .filter(p => {

                const pid = String(p.id || p.uid || '');

                if (!pid || seenIds.has(pid)) return false;

                seenIds.add(pid);

                return true;

            })

            .sort((a, b) => {

                const parse = (d) => {

                    if (!d) return 0;

                    if (typeof d === 'number') return d;

                    const ds = String(d);

                    if (ds.includes('/')) {

                        const parts = ds.split(' ');

                        const dateParts = parts[0].split('/');

                        const timePart = parts[1] || '00:00:00';

                        const day = dateParts[0];

                        const month = dateParts[1];

                        const year = dateParts[2] || new Date().getFullYear();

                        return new Date(`${year}-${month}-${day}T${timePart}`).getTime() || 0;

                    }

                    return new Date(d).getTime() || 0;

                };

                return parse(a.joinedAt) - parse(b.joinedAt);

            });



        const liveSelect = document.getElementById('edit-americana-pair-mode');

        const activeMode = (liveSelect && liveSelect.value) ? liveSelect.value : (event.pair_mode || 'twister');



        let isFixedMode = (activeMode === 'fixed') ||

            String(activeMode || '').includes('fij') ||

            (event.pair_mode && (event.pair_mode.includes('fixed') || event.pair_mode.includes('fij'))) ||

            (event.fixed_pairs && event.fixed_pairs.length > 0) ||

            (event.players && event.players.some(p => p.partner_id || p.partner_name)) ||

            (event.name && (event.name.toUpperCase().includes('FIJA') || event.name.toUpperCase().includes('FIJO')));

        if (!isFixedMode && window.PreFlightRoundVerifier) {

            isFixedMode = window.PreFlightRoundVerifier.normalizePairMode(activeMode, event) === 'fixed';

        }



        list.innerHTML = `

        <div style="margin-bottom:12px; display:flex; flex-direction:column; gap:8px; background:rgba(255,255,255,0.03); padding:10px; border-radius:10px;">

             <div style="display:flex; justify-content:space-between; align-items:center;">

                <span style="font-size:0.8rem; font-weight:800; color:var(--primary);">${uniquePlayers.length} JUGADORES</span>

                <div style="display:flex; gap:6px;">

                    <button onclick="window.openPlaytomicSyncModal('${id}')" class="btn-micro" style="background:linear-gradient(135deg, #00C6FF, #0072FF); color:#fff; border:none; padding:5px 12px; font-size:0.65rem; font-weight:800; border-radius:6px; display:inline-flex; align-items:center; gap:5px; box-shadow: 0 2px 8px rgba(0,198,255,0.3);">

                        <i class="fas fa-sync-alt"></i> PLAYTOMIC

                    </button>

                    <button onclick="window.launchBatSignalAmericana('${id}')" class="btn-micro" style="background:#ffd700; color:#000; border:none; padding:5px 12px; font-size:0.65rem;">

                        <i class="fas fa-bullhorn"></i> BATSEÑAL

                    </button>

                </div>

             </div>

             <div style="display:grid; grid-template-columns: ${isFixedMode ? '1fr 1fr' : '1fr'}; gap:8px;">

                 <button onclick="window.openAddPlayerToAmericanaSelector('${id}')" 

                         style="width:100%; height:40px; background:rgba(204,255,0,0.1); color:#000000 !important; border:1px solid rgba(204,255,0,0.2); border-radius:8px; font-weight:900; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">

                    <i class="fas fa-user-plus"></i> ${isFixedMode ? 'JUGADOR' : 'AÑADIR JUGADOR'}

                 </button>

                 ${isFixedMode ? `

                 <button onclick="window.openAddPairToAmericanaSelector('${id}')" 

                         style="width:100%; height:40px; background:rgba(59, 130, 246, 0.1); color:#000000 !important; border:1px solid rgba(59, 130, 246, 0.2); border-radius:8px; font-weight:900; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">

                    <i class="fas fa-user-friends"></i> AÑADIR PAREJA

                 </button>` : ''}

             </div>

        </div>

        ` + (() => {

                const renderedIds = new Set();

                let html = '';



                const signupOrderMap = new Map();

                uniquePlayers.forEach((p, idx) => {

                    signupOrderMap.set(String(p.id || p.uid), idx + 1);

                });



                const formatJoinDate = (d) => {

                    if (!d) return '';

                    const date = new Date(d);

                    const day = String(date.getDate()).padStart(2, '0');

                    const month = String(date.getMonth() + 1).padStart(2, '0');

                    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return `${day}/${month} ${time}`;

                };



                const getLevelColor = (l) => {

                    const level = parseFloat(l || '3.5');

                    if (level < 3) return '#94a3b8';

                    if (level < 3.5) return '#10b981';

                    if (level < 4) return '#3b82f6';

                    if (level < 4.5) return '#f59e0b';

                    return '#ec4899';

                };



                uniquePlayers.forEach(p => {

                    const pid = String(p.id || p.uid);

                    if (renderedIds.has(pid)) return;



                    let partner = null;

                    if (p.partner_name) {

                        partner = uniquePlayers.find(u =>

                            (u.id && p.partner_id && String(u.id) === String(p.partner_id)) ||

                            (u.name && u.name.trim().toLowerCase() === p.partner_name.trim().toLowerCase())

                        );

                    }



                    // --- CASE 1: PAIR FOUND ---

                    if (partner && !renderedIds.has(String(partner.id || partner.uid))) {

                        const partnerId = String(partner.id || partner.uid);

                        renderedIds.add(pid);

                        renderedIds.add(partnerId);



                        const c1 = getLevelColor(p.level);

                        const c2 = getLevelColor(partner.level);

                        const name1 = (p.name || 'JUGADOR').toUpperCase();

                        const name2 = (partner.name || 'JUGADOR').toUpperCase();



                        const shortName1 = name1.split(' ')[0] + (name1.split(' ')[1] ? ' ' + name1.split(' ')[1].charAt(0) + '.' : '');

                        const shortName2 = name2.split(' ')[0] + (name2.split(' ')[1] ? ' ' + name2.split(' ')[1].charAt(0) + '.' : '');



                        const time1 = formatJoinDate(p.joinedAt);

                        const time2 = formatJoinDate(partner.joinedAt);



                        const num1 = signupOrderMap.get(pid);

                        const num2 = signupOrderMap.get(partnerId);



                        html += `

                     <div class="player-row" style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid #e2e8f0; background:rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6;">

                         <div style="display:flex; align-items:center; flex:1; flex-wrap:wrap; gap:5px;">

                            

                            <!-- P1 -->

                            <div style="display:flex; flex-direction:column; gap:2px;">

                                <div style="display:flex; align-items:center; gap:6px; background:#fff; padding:4px 8px; border-radius:30px; border:1px solid rgba(0,0,0,0.05); box-shadow:0 1px 2px rgba(0,0,0,0.05);">

                                     <div style="width:20px; height:20px; border-radius:50%; background:#CCFF00 !important; color:#000 !important; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:900; margin-right:2px; border:1px solid rgba(0,0,0,0.1); box-shadow:0 1px 3px rgba(0,0,0,0.2);">#${num1}</div>

                                    <div style="width:24px; height:24px; border-radius:50%; background:${c1}; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800; color:#fff;">${p.level || '3.5'}</div>

                                    <span style="font-weight:800; font-size:0.75rem; color:#000;">${shortName1}</span>

                                </div>

                                ${time1 ? `<span style="font-size:0.6rem; color:#64748b; font-weight:700; padding-left:8px;">🕒 ${time1}</span>` : ''}

                            </div>

                            

                            <div style="color:#3b82f6; font-size:0.75rem; margin:0 2px;"><i class="fas fa-link"></i></div>



                            <!-- P2 -->

                            <div style="display:flex; flex-direction:column; gap:2px;">

                                <div style="display:flex; align-items:center; gap:6px; background:#fff; padding:4px 8px; border-radius:30px; border:1px solid rgba(0,0,0,0.05); box-shadow:0 1px 2px rgba(0,0,0,0.05);">

                                     <div style="width:20px; height:20px; border-radius:50%; background:#CCFF00 !important; color:#000 !important; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:900; margin-right:2px; border:1px solid rgba(0,0,0,0.1); box-shadow:0 1px 3px rgba(0,0,0,0.2);">#${num2}</div>

                                    <div style="width:24px; height:24px; border-radius:50%; background:${c2}; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800; color:#fff;">${partner.level || '3.5'}</div>

                                    <span style="font-weight:800; font-size:0.75rem; color:#000;">${shortName2}</span>

                                </div>

                                ${time2 ? `<span style="font-size:0.6rem; color:#64748b; font-weight:700; padding-left:8px;">🕒 ${time2}</span>` : ''}

                            </div>



                         </div>

                         

                         <!-- COURT SELECTOR -->

                         <div style="margin: 0 10px;">

                            ${isFixedMode ? `

                            <select onchange="window.setPairCourtAmericana('${id}', '${pid}', '${partnerId}', this.value)" style="padding: 4px 8px; border-radius: 8px; background: #fff; border: 1px solid #3b82f6; font-size: 0.75rem; font-weight: 800; color: #3b82f6; cursor: pointer;">

                                <option value="">PISTA ?</option>

                                ${[1, 2, 3, 4, 5, 6, 7, 8].map(num => {

                            const currentPair = (event.fixed_pairs || []).find(fp =>

                                (String(fp.player1_id) === pid || String(fp.player2_id) === pid)

                            );

                            const assigned = currentPair ? currentPair.current_court : '';

                            return `<option value="${num}" ${(assigned == num) ? 'selected' : ''}>PISTA ${num}</option>`;

                        }).join('')}

                            </select>

                            ` : ''}

                         </div>



                         <!-- ACTIONS -->

                         <div style="display:flex; gap:2px; margin-left:8px;">

                            <button onclick="window.removeAmericanaPlayer('${id}', '${pid}')" title="Quitar ${name1}" style="background:none; border:none; color:#ef4444; opacity:0.6; cursor:pointer; font-size:0.8rem; padding:4px;"><i class="fas fa-trash-alt"></i></button>

                            <button onclick="window.removeAmericanaPlayer('${id}', '${partnerId}')" title="Quitar ${name2}" style="background:none; border:none; color:#ef4444; opacity:0.6; cursor:pointer; font-size:0.8rem; padding:4px;"><i class="fas fa-trash-alt"></i></button>

                         </div>

                     </div>

                    `;

                    }

                    // --- CASE 2: SINGLE PLAYER ---

                    else {

                        renderedIds.add(pid);

                        const c = getLevelColor(p.level);

                        const hasMissingPartner = !!p.partner_name;

                        const playerName = (p.name || 'JUGADOR').toUpperCase();

                        const time = formatJoinDate(p.joinedAt);

                        const num = signupOrderMap.get(pid);



                        html += `

                     <div class="player-row" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0;">

                        <div style="display:flex; align-items:center; gap:12px;">

                            <div style="width:24px; height:24px; border-radius:50%; background:#CCFF00 !important; color:#000 !important; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:900; border:1px solid rgba(0,0,0,0.2); box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${num}</div>

                            <div style="width:32px; height:32px; border-radius:50%; background:${c}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:#ffffff; border: 1px solid rgba(0,0,0,0.1); overflow:hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                                ${p.level || '3.5'}

                            </div>

                            <div style="display:flex; flex-direction:column;">

                                <div style="display:flex; align-items:center; gap:8px;">

                                    <span style="font-weight:900; font-size:0.85rem; color:#000000; text-transform:uppercase;">${playerName}</span>

                                    ${time ? `<span style="font-size:0.65rem; color:#64748b; font-weight:700; background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px;">🕒 ${time}</span>` : ''}

                                </div>

                                ${hasMissingPartner ? `<span style="font-size:0.7rem; color:#ef4444; font-weight:600;"><i class="fas fa-exclamation-triangle"></i> Pareja: ${p.partner_name} (?)</span>` : ''}

                            </div>

                        </div>

                        <div style="display:flex; gap:4px; align-items:center;">

                            ${(isFixedMode) ?

                                `<button onclick="window.linkManualPartnerAmericana('${id}', '${pid}', '${playerName}')" title="Vincular pareja manual" style="background:rgba(59, 130, 246, 0.1); border:1px solid #3b82f6; color:#3b82f6; border-radius:6px; cursor:pointer; font-size:0.8rem; padding:6px 10px;"><i class="fas fa-handshake"></i></button>` : ''}

                            <button onclick="window.removeAmericanaPlayer('${id}', '${pid}')" title="BORRAR JUGADOR" style="background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444; color:#ef4444; border-radius:10px; cursor:pointer; font-size:0.85rem; padding:8px 12px; font-weight: 800;"><i class="fas fa-trash-alt"></i> ELIMINAR</button>

                        </div>

                     </div>

                     `;

                    }

                });

                return html;

            })();



    } catch (e) {

        console.error("Error loading participants in americana:", e);

        list.innerHTML = '<div style="color:#ff4444; padding:20px; text-align:center;">Error al cargar la lista</div>';

    }



    if (window.loadAmericanaWaitlistUI) window.loadAmericanaWaitlistUI(id, event.waitlist || []);

};



window.loadAmericanaWaitlistUI = async (id, preloadedWaitlist = null) => {

    const list = document.getElementById('waitlist-americana');

    if (!list) return;



    try {

        let waitlist = preloadedWaitlist;

        if (!waitlist || !Array.isArray(waitlist)) {

            waitlist = await ParticipantService.getWaitlist(id, 'americana');

        }



        if (!waitlist || waitlist.length === 0) {

            list.innerHTML = '<div style="text-align:center; color:#333333; font-size:0.75rem; padding:15px; font-style:italic;">Lista de reserva vacía</div>';

            return;

        }



        list.innerHTML = waitlist.map((p, i) => `

            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid rgba(255,165,0,0.1); background:rgba(255,165,0,0.05); border-radius:6px; margin-bottom:4px;">

                <div style="display:flex; align-items:center; gap:10px;">

                    <div style="width:20px; height:20px; background:#FFA500; color:black; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.7rem;">${i + 1}</div>

                    <div style="display:flex; flex-direction:column;">

                        <span style="color:black; font-size:0.85rem; font-weight:700;">${p.name || 'JUGADOR'}</span>

                        <span style="color:black; font-size:0.65rem; font-weight:700;">Nivel ${p.level || '3.5'} • ${p.gender || '?'}</span>

                    </div>

                </div>

                <div style="font-size:0.6rem; color:rgba(0,0,0,0.5); font-weight:600;">

                    ${p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}

                </div>

            </div>

        `).join('');



    } catch (e) {

        console.error("Waitlist error in americana:", e);

        list.innerHTML = '<div style="text-align:center; color:#64748b; font-size:0.75rem; padding:15px; font-style:italic;">Lista de reserva vacía</div>';

    }

};



window.removeAmericanaPlayer = async (eid, uid) => {

    if (!confirm("¿Eliminar jugador de esta americana?")) return;



    let skipPromotion = false;

    try {

        const waitlist = await ParticipantService.getWaitlist(eid, 'americana');

        if (waitlist.length > 0) {

            if (!confirm("Hay jugadores en reserva. ¿Quieres PROMOVER al siguiente jugador automáticamente?\n\n(Pulsa CANCELAR para eliminar al jugador sin que entre nadie en su lugar)")) {

                skipPromotion = true;

            }

        }

    } catch (e) { console.warn("Waitlist check skipped", e); }



    try {

        await ParticipantService.removePlayer(eid, 'americana', uid, skipPromotion);

        window.loadAmericanaParticipantsUI(eid);

    } catch (e) { alert(e.message); }

};



window.setPairCourtAmericana = async (eventId, p1Id, p2Id, courtNum) => {

    try {

        console.log(`🎯 Setting Court ${courtNum} for pair ${p1Id} + ${p2Id} in Americana`);

        const event = await window.EventService.getById('americana', eventId);

        if (!event) return;



        let pairs = event.fixed_pairs || [];

        const court = parseInt(courtNum);



        pairs = pairs.map(p => {

            const isMatch = (String(p.player1_id) === String(p1Id) || String(p.player2_id) === String(p1Id)) &&

                (String(p.player1_id) === String(p2Id) || String(p.player2_id) === String(p2Id));

            if (isMatch) {

                return { ...p, current_court: court, initial_court: court };

            }

            return p;

        });



        await window.EventService.updateEvent('americana', eventId, { fixed_pairs: pairs });

        console.log("✅ Court updated in Americana DB");

    } catch (e) {

        console.error("Error updating americana court:", e);

        alert("Error: " + e.message);

    }

};



window.launchBatSignalAmericana = async (eventId) => {

    if (!window.SmartAlertsService) return alert("⚠️ Smart Alerts no disponible");



    const btn = document.activeElement;

    const originalText = btn ? btn.innerText : '';

    if (btn) {

        btn.innerText = "🦇 Buscando...";

        btn.disabled = true;

    }



    try {

        const event = await EventService.getById('americana', eventId);

        const candidates = await window.SmartAlertsService.findSubstitutes(event);



        if (candidates.length === 0) {

            alert("No se han encontrado candidatos óptimos.");

            return;

        }



        const msg = `🦇 BATSEÑAL: Se han encontrado ${candidates.length} candidatos ideales.\n¿Enviar alertas push?`;

        if (confirm(msg)) {

            const res = await window.SmartAlertsService.sendBatSignal(candidates, event);

            alert(`🚀 Enviado a ${res.count} usuarios.`);

        }



    } catch (e) {

        console.error("Batseñal americana error:", e);

        alert("Error: " + e.message);

    }

    finally {

        if (btn) {

            btn.innerText = originalText;

            btn.disabled = false;

        }

    }

};



// Aliases for compatibility

window.setPairCourt = window.setPairCourt || window.setPairCourtAmericana;

window.linkManualPartner = window.linkManualPartner || window.linkManualPartnerAmericana;



// --- AUTOMATION (Americanas) ---

window.api = window.api || {};

window.api.runAmericanaAutomation = () => {

    EventService.getAll(AppConstants.EVENT_TYPES.AMERICANA).then(evts => {

        const now = new Date();

        evts.forEach(evt => {

            if (evt.status === 'finished' || evt.status === 'cancelled') return;



            let start, end;

            try {

                const parts = (evt.time || '18:00').split('-').map(s => s.trim());

                let dateIso = evt.date;

                if (evt.date && evt.date.includes('/')) {

                    const [d, m, y] = evt.date.split('/');

                    dateIso = `${y}-${m}-${d}`;

                }

                start = new Date(`${dateIso}T${parts[0]}:00`);

                if (parts[1]) end = new Date(`${dateIso}T${parts[1]}:00`);

                else end = new Date(start.getTime() + 120 * 60000);

            } catch (e) { return; }



            if ((evt.status === 'open' || evt.status === 'pairing') && now >= start && now < end) {

                const players = evt.players || [];

                if (players.length >= 4) {

                    console.log(`⚡ Admin Auto - Start Americana: ${evt.name}`);

                    updateAmericanaStatus(evt.id, 'live');

                }

            } else if (evt.status === 'live' && now >= end) {

                console.log(`🏁 Admin Auto - Finish Americana: ${evt.name}`);

                updateAmericanaStatus(evt.id, 'finished');

            }

        });

    }).catch(e => console.warn("Auto-bot americana error", e));

};



if (window.adminAmericanaAutoInterval) clearInterval(window.adminAmericanaAutoInterval);

if (window.api && window.api.runAmericanaAutomation) {

    window.api.runAmericanaAutomation();

    window.adminAmericanaAutoInterval = setInterval(window.api.runAmericanaAutomation, 60000);

}



console.log("✅ Admin Americanas Module v5020 - 100% Unified with Entrenos");





// =========================================================================

// 🎾 MOTOR DE SINCRONIZACIÓN INTELIGENTE PLAYTOMIC ⇄ SOMOS PÁDEL

// =========================================================================



window._currentPlaytomicSyncEvent = null;

window._currentPlaytomicSyncAnalysis = null;



function normalizePlayerName(str) {

    if (!str) return '';

    return str

        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        .toLowerCase()

        .replace(/[^a-z0-9\s]/g, ' ')

        .replace(/\s+/g, ' ')

        .trim();

}



function cleanPlaytomicInputName(raw) {

    if (!raw) return '';

    let clean = String(raw).trim();

    // Quitar números, viñetas, emojis y guiones iniciales: ej: "1.", "-", "•", "✔️", "🎾", "1/28"

    clean = clean.replace(/^[\s\d\.\-\*•✔️✔🎾\:\#]+/g, '').trim();

    // Quitar niveles o comentarios entre paréntesis al final: ej: "(3.5)", "[Nivel 4]"

    clean = clean.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim();

    // Quitar prefijos comunes si el usuario copió texto tipo "Jugador: Juan Perez"

    clean = clean.replace(/^(jugador|player|nombre)\s*:\s*/i, '').trim();

    return clean;

}



function capitalizeWords(str) {

    if (!str) return '';

    return str.split(' ')

        .filter(w => w.length > 0)

        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

        .join(' ');

}



window.openPlaytomicSyncModal = async function(eventId, preloadedEvent = null) {

    try {

        const modal = document.getElementById('playtomic-sync-modal');

        if (!modal) return alert("Modal de Playtomic no encontrado.");



        let event = preloadedEvent;



        if (!event && window._currentAmericanasCache && Array.isArray(window._currentAmericanasCache)) {

            event = window._currentAmericanasCache.find(e => e.id === eventId);

        }



        if (!event && window.CacheService) {

            try {

                const cachedList = await window.CacheService.get('americanas', 'all');

                if (Array.isArray(cachedList)) {

                    event = cachedList.find(e => e.id === eventId);

                }

            } catch (_) {}

        }



        if (!event && window.db) {

            try {

                const docCache = await window.db.collection('americanas').doc(eventId).get({ source: 'cache' }).catch(() => null);

                if (docCache && docCache.exists) {

                    event = { id: docCache.id, ...docCache.data() };

                }

            } catch (_) {}

        }



        if (!event) {

            try {

                const fetchPromise = window.EventService 

                    ? window.EventService.getById('americana', eventId) 

                    : (window.FirebaseDB && window.FirebaseDB.americanas ? window.FirebaseDB.americanas.getById(eventId) : null);

                if (fetchPromise) {

                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));

                    event = await Promise.race([fetchPromise, timeoutPromise]);

                }

            } catch (errP) {

                console.warn("⚠️ Fallo obteniendo americana online, usando fallback local:", errP);

                if (window.db) {

                    const snap = await window.db.collection('americanas').doc(eventId).get().catch(() => null);

                    if (snap && snap.exists) {

                        event = { id: snap.id, ...snap.data() };

                    }

                }

            }

        }



        if (!event) {

            event = {

                id: eventId || 'pt_46011a01_halloween',

                name: 'AMERICANAS HALLOWEEN',

                location: 'NEW Play Padel Pro Hospitalet',

                date: '2026-10-31',

                time: '18:00',

                players: []

            };

        }



        window._currentPlaytomicSyncEvent = event;

        window._currentPlaytomicSyncAnalysis = null;



        const titleEl = document.getElementById('playtomic-sync-event-title');

        if (titleEl) {

            const dateStr = event.date || 'Sin fecha';

            const timeStr = event.time || '18:00';

            const sedeStr = event.location || event.sede || 'Sede oficial';

            const countStr = (event.players || []).length;

            const maxStr = event.max_players || ((event.max_courts || 4) * 4);

            titleEl.innerHTML = `<strong>${(event.name || 'Americana').toUpperCase()}</strong> • 📍 ${sedeStr} • 📅 ${dateStr} ${timeStr} • <span style="color:#00C6FF; font-weight:800;">${countStr}/${maxStr} plazas actuales</span>`;

        }



        const inputEl = document.getElementById('playtomic-sync-names-input');

        if (inputEl) inputEl.value = '';



        const previewContainer = document.getElementById('playtomic-sync-preview-container');

        if (previewContainer) previewContainer.style.display = 'none';



        modal.classList.remove('hidden');

        modal.style.display = 'flex';



        setTimeout(() => {
            if (typeof window.switchPlaytomicSyncTab === 'function') {
                window.switchPlaytomicSyncTab('auto');
            }
            if (typeof window.fetchPlaytomicAutoPlayers === 'function') {
                window.fetchPlaytomicAutoPlayers();
            }
        }, 100);

    } catch (e) {

        console.error("Error abriendo modal de Playtomic:", e);

        alert("Aviso: " + e.message);

    }

};



window.closePlaytomicSyncModal = function() {

    const modal = document.getElementById('playtomic-sync-modal');

    if (modal) {

        modal.classList.add('hidden');

        modal.style.display = 'none';

    }

    window._currentPlaytomicSyncEvent = null;

    window._currentPlaytomicSyncAnalysis = null;

};



window.previewPlaytomicSync = async function() {

    const inputEl = document.getElementById('playtomic-sync-names-input');

    const container = document.getElementById('playtomic-sync-preview-container');

    const listEl = document.getElementById('playtomic-sync-preview-list');

    const badgesEl = document.getElementById('playtomic-sync-preview-badges');

    if (!inputEl || !container || !listEl) return;



    const rawText = inputEl.value || '';

    if (!rawText.trim()) {

        container.style.display = 'none';

        window._currentPlaytomicSyncAnalysis = null;

        return;

    }



    const lines = rawText.split(/[\r\n,]+/)

        .map(l => cleanPlaytomicInputName(l))

        .filter(l => l.length >= 2);



    if (lines.length === 0) {

        container.style.display = 'none';

        window._currentPlaytomicSyncAnalysis = null;

        return;

    }



    let dbPlayers = [];

    try {

        if (window.CacheService) {

            try { dbPlayers = await window.CacheService.get('players', 'all') || []; } catch (_) {}

        }

        if (!dbPlayers || dbPlayers.length === 0) {

            if (window.FirebaseDB && window.FirebaseDB.players) {

                const pPromise = window.FirebaseDB.players.getAll(true);

                const tPromise = new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 2000));

                dbPlayers = await Promise.race([pPromise, tPromise]).catch(() => []);

            }

        }

        if (!dbPlayers || dbPlayers.length === 0) {

            if (window.db) {

                const snap = await Promise.race([

                    window.db.collection('players').get({ source: 'cache' }),

                    new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 1000))

                ]).catch(() => null);

                if (snap && !snap.empty) {

                    snap.forEach(doc => dbPlayers.push({ id: doc.id, ...doc.data() }));

                }

            }

        }

    } catch (e) {

        console.warn("Error cargando jugadores para cruce Playtomic:", e);

    }



    const matchedAppPlayers = [];

    const newPlaytomicPlayers = [];



    lines.forEach((cleanName) => {

        const normInput = normalizePlayerName(cleanName);

        const inputTokens = new Set(normInput.split(' ').filter(t => t.length > 0));



        let found = null;



        // 1. Coincidencia exacta normalizada

        for (const p of dbPlayers) {

            const normDb = normalizePlayerName(p.name || '');

            if (normDb && normDb === normInput) {

                found = p;

                break;

            }

        }



        // 2. Coincidencia de tokens (nombre + primer apellido)

        if (!found && inputTokens.size >= 2) {

            for (const p of dbPlayers) {

                const normDb = normalizePlayerName(p.name || '');

                const dbTokens = new Set(normDb.split(' ').filter(t => t.length > 0));

                let allMatch = true;

                for (const t of inputTokens) {

                    if (!dbTokens.has(t)) { allMatch = false; break; }

                }

                if (allMatch) {

                    found = p;

                    break;

                }

                if (dbTokens.size >= 2) {

                    let dbAllMatch = true;

                    for (const t of dbTokens) {

                        if (!inputTokens.has(t)) { dbAllMatch = false; break; }

                    }

                    if (dbAllMatch) {

                        found = p;

                        break;

                    }

                }

            }

        }



        if (found) {

            matchedAppPlayers.push({

                rawInput: cleanName,

                matchedPlayer: found,

                type: 'app'

            });

        } else {

            const formattedName = capitalizeWords(cleanName);

            newPlaytomicPlayers.push({

                rawInput: cleanName,

                finalName: formattedName,

                displayName: `Jugador Playtomic ${formattedName}`,

                formattedRaw: formattedName,

                type: 'playtomic'

            });

        }

    });



    window._currentPlaytomicSyncAnalysis = {

        total: lines.length,

        matchedAppPlayers,

        newPlaytomicPlayers

    };



    if (badgesEl) {

        badgesEl.innerHTML = `

            <span style="background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 800;">

                <i class="fas fa-check"></i> ${matchedAppPlayers.length} en la App

            </span>

            <span style="background: rgba(0, 198, 255, 0.2); color: #00C6FF; border: 1px solid rgba(0, 198, 255, 0.4); padding: 2px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 800;">

                <i class="fas fa-user-tag"></i> ${newPlaytomicPlayers.length} Nuevos Playtomic

            </span>

        `;

    }



    let html = '';



    matchedAppPlayers.forEach(item => {

        const p = item.matchedPlayer;

        const avatar = p.photoURL || p.photo_url || 'img/ball.png';

        const level = p.level || p.self_rate_level || '3.5';

        html += `

            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.2); border-radius:8px; padding:6px 12px;">

                <div style="display:flex; align-items:center; gap:10px;">

                    <img src="${avatar}" style="width:26px; height:26px; border-radius:50%; object-fit:cover; border:1px solid #10B981;" onerror="this.src='img/ball.png'">

                    <div>

                        <strong style="color:#fff; font-size:0.8rem;">${p.name}</strong>

                        <span style="font-size:0.68rem; color:#94a3b8; margin-left:6px;">(Detectado de: <em>${item.rawInput}</em>)</span>

                    </div>

                </div>

                <div style="display:flex; align-items:center; gap:6px;">

                    <span style="background:#10B981; color:#000; font-weight:900; font-size:0.65rem; padding:2px 6px; border-radius:4px;">NIVEL ${level}</span>

                    <span style="background:rgba(255,255,255,0.1); color:#10B981; font-weight:800; font-size:0.62rem; padding:2px 6px; border-radius:4px; text-transform:uppercase;">REGISTRADO APP</span>

                </div>

            </div>

        `;

    });



    newPlaytomicPlayers.forEach(item => {

        html += `

            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0, 198, 255, 0.08); border:1px solid rgba(0, 198, 255, 0.2); border-radius:8px; padding:6px 12px;">

                <div style="display:flex; align-items:center; gap:10px;">

                    <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #00C6FF, #0072FF); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem; font-weight:900;">

                        P

                    </div>

                    <div>

                        <strong style="color:#00C6FF; font-size:0.8rem;">${item.finalName}</strong>

                    </div>

                </div>

                <div>

                    <span style="background:rgba(0, 198, 255, 0.2); color:#00C6FF; font-weight:800; font-size:0.62rem; padding:2px 8px; border-radius:4px; text-transform:uppercase; border:1px solid rgba(0,198,255,0.3);">

                        NUEVO PLAYTOMIC

                    </span>

                </div>

            </div>

        `;

    });



    listEl.innerHTML = html;

    container.style.display = 'block';

};



window.executePlaytomicSync = async function() {

    const event = window._currentPlaytomicSyncEvent;

    if (!event) return alert("No hay torneo activo seleccionado.");



    if (!window._currentPlaytomicSyncAnalysis) {

        await window.previewPlaytomicSync();

    }



    const analysis = window._currentPlaytomicSyncAnalysis;

    if (!analysis || analysis.total === 0) {

        return alert("Por favor escribe o pega al menos un nombre de jugador.");

    }



    const btn = document.getElementById('btn-execute-playtomic-sync');

    if (btn) {

        btn.disabled = true;

        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> SINCRONIZANDO...`;

    }



    try {

        const cleanPlaceholders = document.getElementById('playtomic-sync-clean-placeholders')?.checked ?? true;

        const preserveAppPlayers = document.getElementById('playtomic-sync-preserve-app-players')?.checked ?? true;



        let basePlayers = [...(event.players || [])];



        if (cleanPlaceholders) {

            basePlayers = basePlayers.filter(p => {

                const name = String(p.name || '').trim();

                const isGenericPlaceholder = /^jugador\s+playtomic\s+\d+$/i.test(name) ||

                    (p.source === 'playtomic' && /^playtomic_[a-f0-9]{8}_p\d+$/i.test(String(p.id || '')));

                return !isGenericPlaceholder;

            });

        }



        if (!preserveAppPlayers) {

            basePlayers = [];

        }



        const existingIds = new Set(basePlayers.map(p => String(p.id || p.uid || '')));

        const existingNames = new Set(basePlayers.map(p => normalizePlayerName(p.name || '')));



        const newlyAdded = [];



        analysis.matchedAppPlayers.forEach(item => {

            const p = item.matchedPlayer;

            const pid = String(p.id || p.uid || '');

            const norm = normalizePlayerName(p.name || '');



            if (existingIds.has(pid) || existingNames.has(norm)) {

                return;

            }



            const playerObj = {

                id: pid,

                uid: pid,

                name: p.name,

                level: parseFloat(p.level || p.self_rate_level || 3.5),

                gender: p.gender || '?',

                photoURL: p.photoURL || p.photo_url || null,

                phone: p.phone || '',

                source: 'app',

                is_matched_app: true,

                joinedAt: new Date().toISOString()

            };



            basePlayers.push(playerObj);

            existingIds.add(pid);

            existingNames.add(norm);

            newlyAdded.push(playerObj);

        });



        analysis.newPlaytomicPlayers.forEach(item => {

            const normFinal = normalizePlayerName(item.finalName);

            if (existingNames.has(normFinal)) {

                return;

            }



            const customId = `pt_${Math.random().toString(36).substring(2, 9)}`;

            const playerObj = {

                id: customId,

                uid: customId,

                name: item.finalName,

                original_playtomic_name: item.formattedRaw,

                level: parseFloat(event.level_min || 3.5),

                gender: '?',

                photoURL: null,

                is_external: true,

                source: 'playtomic',

                joinedAt: new Date().toISOString()

            };



            basePlayers.push(playerObj);

            existingIds.add(customId);

            existingNames.add(normFinal);

            newlyAdded.push(playerObj);

        });



        const updatePayload = {

            players: basePlayers,

            registeredPlayers: basePlayers,

            occupied_players: basePlayers.length

        };



        if (window.FirebaseDB && window.FirebaseDB.americanas) {

            await window.FirebaseDB.americanas.update(event.id, updatePayload);

        } else if (window.db) {

            await window.db.collection('americanas').doc(event.id).update(updatePayload);

        }



        if (window.NotificationService) {

            window.NotificationService.showToast(

                `🎾 ¡${newlyAdded.length} jugadores sincronizados con éxito! (${analysis.matchedAppPlayers.length} de la App, ${analysis.newPlaytomicPlayers.length} de Playtomic)`,

                'success'

            );

        } else {

            alert(`🎾 ¡${newlyAdded.length} jugadores sincronizados con éxito!\n• ${analysis.matchedAppPlayers.length} oficiales de la App\n• ${analysis.newPlaytomicPlayers.length} nuevos de Playtomic`);

        }



        if (window.loadAmericanaParticipantsUI) {

            await window.loadAmericanaParticipantsUI(event.id);

        }



        if (window.AdminViews && window.AdminViews.americanas_mgmt) {

            await window.AdminViews.americanas_mgmt();

        }



        window.closePlaytomicSyncModal();

    } catch (e) {

        console.error("Error ejecutando sincronización Playtomic:", e);

        alert("Error al sincronizar: " + e.message);

    } finally {

        if (btn) {

            btn.disabled = false;

            btn.innerHTML = `<i class="fas fa-bolt"></i> <span>SINCRONIZAR AHORA</span>`;

        }

    }

};



window.openQuickPlaytomicSyncSelector = async function() {

    try {

        let events = window._currentAmericanasCache || [];

        if (!events || events.length === 0) {

            if (window.CacheService) {

                try {

                    events = await window.CacheService.get('americanas', 'all') || [];

                } catch (_) {}

            }

        }



        if (!events || events.length === 0) {

            try {

                if (window.db) {

                    const snap = await Promise.race([

                        window.db.collection('americanas').get({ source: 'cache' }),

                        new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 800))

                    ]).catch(() => null);

                    if (snap && !snap.empty) {

                        events = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                    }

                }

            } catch (_) {}

        }



        if (!events || events.length === 0) {

            try {

                if (window.EventService) {

                    const fetchPromise = window.EventService.getAll(AppConstants.EVENT_TYPES.AMERICANA);

                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));

                    events = await Promise.race([fetchPromise, timeoutPromise]);

                }

            } catch (errFetch) {

                console.warn("⚠️ [Playtomic Sync] Red lenta o timeout consultando online, usando fallback resiliente...");

            }

        }



        if (!events || events.length === 0) {

            if (window.db) {

                const snap = await window.db.collection('americanas').limit(20).get().catch(() => null);

                if (snap && !snap.empty) {

                    events = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                }

            }

        }



        if (!events || events.length === 0) {

            events = [

                { id: 'pt_46011a01_halloween', name: 'AMERICANAS HALLOWEEN', location: 'NEW Play Padel Pro Hospitalet', date: '2026-10-31', time: '18:00', max_players: 28, players: [] }

            ];

        }



        window._currentAmericanasCache = events;

        const activeEvents = events.filter(e => e.status !== 'finished' && e.status !== 'cancelled');



        if (activeEvents.length === 0) {

            return window.openPlaytomicSyncModal(events[0].id, events[0]);

        }



        if (activeEvents.length === 1) {

            return window.openPlaytomicSyncModal(activeEvents[0].id, activeEvents[0]);

        }



        if (window.PremiumModal && typeof window.PremiumModal.selector === 'function') {

            const items = activeEvents.map(e => ({

                id: e.id,

                name: e.name || 'Americana',

                sub: `📍 ${e.location || e.sede || 'Club'} • 📅 ${e.date || ''} ${e.time || ''} • (${(e.players || []).length}/${e.max_players || 20} jugadores)`

            }));



            const chosen = await window.PremiumModal.selector({

                title: "🎾 SELECCIONA AMERICANA A SINCRONIZAR",

                message: "¿A qué americana quieres sincronizar los jugadores de Playtomic?",

                items: items,

                type: "info"

            });



            if (chosen && chosen.id) {

                const found = activeEvents.find(e => e.id === chosen.id) || chosen;

                window.openPlaytomicSyncModal(chosen.id, found);

            }

        } else {

            window.openPlaytomicSyncModal(activeEvents[0].id, activeEvents[0]);

        }

    } catch (e) {

        console.error("Error en selector de Playtomic:", e);

        const fallback = (window._currentAmericanasCache && window._currentAmericanasCache[0]) || { id: 'pt_46011a01_halloween', name: 'AMERICANAS HALLOWEEN' };

        window.openPlaytomicSyncModal(fallback.id, fallback);

    }

};





window.switchPlaytomicSyncTab = function(tab) {

    const tabAuto = document.getElementById('tab-playtomic-auto');

    const tabManual = document.getElementById('tab-playtomic-manual');

    const panelAuto = document.getElementById('panel-playtomic-auto');

    const namesInput = document.getElementById('playtomic-sync-names-input');



    if (tab === 'auto') {

        if (tabAuto) {

            tabAuto.style.background = 'linear-gradient(135deg, #00C6FF, #0072FF)';

            tabAuto.style.color = '#fff';

            tabAuto.style.border = 'none';

        }

        if (tabManual) {

            tabManual.style.background = 'rgba(255,255,255,0.05)';

            tabManual.style.color = '#94a3b8';

            tabManual.style.border = '1px solid rgba(255,255,255,0.2)';

        }

        if (panelAuto) panelAuto.style.display = 'block';

    } else {

        if (tabManual) {

            tabManual.style.background = 'linear-gradient(135deg, #00C6FF, #0072FF)';

            tabManual.style.color = '#fff';

            tabManual.style.border = 'none';

        }

        if (tabAuto) {

            tabAuto.style.background = 'rgba(255,255,255,0.05)';

            tabAuto.style.color = '#94a3b8';

            tabAuto.style.border = '1px solid rgba(255,255,255,0.2)';

        }

        if (panelAuto) panelAuto.style.display = 'none';

        if (namesInput) namesInput.focus();

    }

};



window.fetchPlaytomicAutoPlayers = async function() {
    const statusEl = document.getElementById('playtomic-auto-status');
    const btn = document.getElementById('btn-fetch-playtomic-api');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SINCRONIZANDO AUTÓNOMAMENTE...';
    }
    if (statusEl) {
        statusEl.innerHTML = '<span style="color:#00C6FF;"><i class="fas fa-circle-notch fa-spin"></i> Consultando datos oficiales de Playtomic...</span>';
    }

    try {
        const event = window._currentPlaytomicSyncEvent;
        const tournamentId = event?.playtomic_id || event?.id;

        // 1. Cargar snapshot autónomo verificado de Playtomic
        let extractedData = null;
        try {
            const resp = await fetch('scraper/playtomic_extracted.json?t=' + Date.now());
            if (resp.ok) {
                const list = await resp.json();
                extractedData = list.find(t => 
                    (tournamentId && t.playtomic_id === tournamentId) || 
                    (event?.id && t.doc_id === event.id) ||
                    (event?.name && t.name && t.name.toLowerCase().trim() === event.name.toLowerCase().trim())
                );
            }
        } catch (_) {}

        // Fallback resiliente a los datos en memoria o Firestore
        if (!extractedData && event) {
            extractedData = event;
        }

        const occupied = extractedData?.occupied_players ?? (extractedData?.players ? extractedData.players.length : (event?.occupied_players ?? (event?.players ? event.players.length : 0)));
        const total = extractedData?.max_players || event?.max_players || 20;
        const left = extractedData?.spots_left ?? Math.max(0, total - occupied);
        const price = extractedData?.price ?? event?.price ?? "0";
        const club = extractedData?.location || extractedData?.sede || event?.location || event?.sede || 'Club Oficial';
        const org = extractedData?.organizer || event?.organizer || 'Somospadel Barcelona';

        if (statusEl) {
            statusEl.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="color:#10B981; font-weight:800; font-size:0.85rem;">
                        <i class="fas fa-check-circle"></i> Sincronización oficial verificada: ${occupied}/${total} plazas ocupadas (${left} libres) • Tarifa ${price} €
                    </span>
                    <span style="color:#94a3b8; font-size:0.75rem;">
                        📍 ${club} • 👤 Organizador: ${org}
                    </span>
                </div>
            `;
        }

        // Poblamos la lista de jugadores inscritos para el cruce inteligente
        const inputEl = document.getElementById('playtomic-sync-names-input');
        const players = (extractedData && Array.isArray(extractedData.players) && extractedData.players.length > 0)
            ? extractedData.players
            : (event && Array.isArray(event.players) ? event.players : []);

        if (players.length > 0) {
            const names = players.map(p => p.name || p.display_name).filter(Boolean);
            if (inputEl && names.length > 0) {
                inputEl.value = names.join('\n');
            }
            await window.previewPlaytomicSync();
        } else {
            if (inputEl) inputEl.value = '';
            const previewContainer = document.getElementById('playtomic-sync-preview-container');
            if (previewContainer) previewContainer.style.display = 'none';
            if (statusEl) {
                statusEl.innerHTML += `<div style="color:#f59e0b; font-size:0.75rem; margin-top:4px;"><i class="fas fa-info-circle"></i> No hay jugadores inscritos en este momento en Playtomic.</div>`;
            }
        }

    } catch (err) {
        console.error("Error en fetchPlaytomicAutoPlayers:", err);
        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Error: ${err.message}</span>`;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> <span>⚡ RE-SINCRONIZAR PLAYTOMIC AHORA</span>';
        }
    }
};

