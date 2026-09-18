/**
 * admin-analytics.js
 * ENTERPRISE SMART BUSINESS ANALYTICS & TELEMETRÍA SUITE (v9.5 Pro)
 * 
 * Desarrollado para SomosPadel Barcelona:
 * 1. ¿Quién entra?: Identificación de jugadores, roles (incluye player_americanas), frecuencia y contacto WhatsApp.
 * 2. ¿Cuántas personas entran cada día?: Evolución diaria (Visitas Totales vs Personas Únicas) con rangos 7d/14d/30d.
 * 3. ¿Cuál es la tendencia?: Crecimiento semanal (%), promedio diario, día pico de la semana (L-D) y horas pico.
 * 4. ¿Qué es lo más visto vs lo menos visto?: Heatmap y ranking de atención por secciones de la app.
 * 5. Inteligencia de Negocio & Retención: Radar Antichurn (reactivación vía WhatsApp), mejor hora de convocatoria y CRM en vivo.
 */
(function () {
    window.AdminViews = window.AdminViews || {};

    // Instancias globales de gráficos para destrucción reactiva sin fugas de memoria
    let sessionsTrendChartInstance = null;
    let dayOfWeekChartInstance = null;
    let hourlyPeakChartInstance = null;
    let telemetryDeviceChartInstance = null;
    let telemetryOriginChartInstance = null;
    let roleDistChartInstance = null;

    // Rango actual seleccionado para tendencia diaria (7, 14 o 30)
    window._trendRangeDays = 14;

    /**
     * Asegura la carga de Chart.js con reintentos defensivos
     */
    async function ensureChartJs() {
        if (typeof Chart !== 'undefined') return true;
        return new Promise((resolve) => {
            const existingScript = document.querySelector('script[src*="chart.js"], script[src*="chart.umd"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(typeof Chart !== 'undefined'));
                setTimeout(() => resolve(typeof Chart !== 'undefined'), 1500);
            } else {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
                s.onload = () => resolve(true);
                s.onerror = () => {
                    console.warn("No se pudo cargar Chart.js desde CDN.");
                    resolve(false);
                };
                document.head.appendChild(s);
            }
        });
    }

    /**
     * Controlador Principal de la Vista Analytics
     */
    window.AdminViews.analytics = async function () {
        const content = document.getElementById('content-area');
        if (!content) return;

        // Actualizar título global en el header del panel de administración
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = 'SMART BUSINESS ANALYTICS & TELEMETRÍA';

        // Skeleton Loader de alta fidelidad
        content.innerHTML = `
            <div class="analytics-loading-skeleton" style="padding: 3.5rem 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 480px;">
                <div class="loader" style="width: 54px; height: 54px; border-width: 4px; border-color: rgba(2,132,199,0.15); border-bottom-color: #0284c7; margin-bottom: 1.5rem; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0;">
                    Procesando Métricas de Inteligencia de Negocio...
                </h3>
                <p style="font-family: 'Inter', sans-serif; font-size: 0.88rem; color: #64748b; margin: 0; max-width: 460px; line-height: 1.5;">
                    Analizando accesos diarios, jugadores en pista, secciones más vistas, tendencias de afluencia y retención.
                </p>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;

        try {
            await ensureChartJs();

            if (!window.db) {
                throw new Error("La base de datos Firestore no está disponible.");
            }

            // 1. Obtener Jugadores Registrados
            let players = [];
            try {
                const playersSnap = await window.db.collection('players').get();
                players = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (pErr) {
                console.warn("Aviso al obtener players:", pErr);
            }

            // 2. Obtener Eventos y Americanas
            let totalAmericanas = 0;
            let activeAmericanas = 0;
            try {
                const eventsSnap = await window.db.collection('events').get();
                const allEvents = eventsSnap.docs.map(doc => doc.data());
                totalAmericanas = allEvents.length;
                activeAmericanas = allEvents.filter(e => e.status === 'open' || e.status === 'active' || e.status === 'published').length;
            } catch (evErr) {
                console.warn("Aviso al obtener events:", evErr);
            }

            // 3. Obtener Partidos Recientes (Dinamismo en pista)
            let allRecentMatches = [];
            try {
                const thirtyDaysAgoDate = new Date();
                thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
                const matchesSnap = await window.db.collection('matches')
                    .where('date', '>=', thirtyDaysAgoDate.toISOString().split('T')[0])
                    .get();
                allRecentMatches = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (matchErr) {
                try {
                    const fallbackMatchesSnap = await window.db.collection('matches').limit(150).get();
                    allRecentMatches = fallbackMatchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (fbErr) {
                    console.warn("Aviso al obtener partidos:", fbErr);
                }
            }

            // 4. Obtener Logs de Telemetría (¿Quién entra, cuándo y desde dónde?)
            let allLogs = [];
            try {
                let logsSnap;
                try {
                    logsSnap = await window.db.collection('access_logs')
                        .orderBy('timestamp', 'desc')
                        .limit(800)
                        .get();
                } catch (orderErr) {
                    logsSnap = await window.db.collection('access_logs')
                        .limit(800)
                        .get();
                }

                allLogs = logsSnap.docs.map(doc => {
                    const data = doc.data();
                    let dateObj = new Date();
                    if (data.timestamp) {
                        dateObj = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                    }

                    // Limpieza de formato de teléfono para micro-interacciones de WhatsApp
                    let rawPhone = data.userPhone || '';
                    let cleanPhone = rawPhone.replace(/\D/g, '');

                    return {
                        id: doc.id,
                        userId: data.userId || 'anon_' + doc.id.substring(0, 6),
                        userName: data.userName || 'Visitante Anónimo',
                        userPhone: rawPhone,
                        cleanPhone: cleanPhone,
                        isRegistered: (data.userId && data.userId !== 'guest' && !data.userId.startsWith('anon_')) || !!data.isRegistered,
                        role: data.role || 'guest',
                        level: data.level || '',
                        city: data.city || 'Barcelona',
                        region: data.region || 'Cataluña',
                        country: data.country || 'España',
                        origin: data.origin || 'Directo / Web',
                        device: data.device || 'Mobile',
                        os: data.os || 'Android',
                        browser: data.browser || 'Chrome',
                        language: data.language || 'es',
                        appVersion: data.appVersion || 'v9.2-Pro',
                        dateObj,
                        dateStr: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        timeStr: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        hour: dateObj.getHours(),
                        dayOfWeek: dateObj.getDay() // 0=Domingo, 1=Lunes, ...
                    };
                });
            } catch (telemetryErr) {
                console.warn("Aviso al obtener logs de telemetría:", telemetryErr);
            }

            // 5. Obtener Telemetría de Rutas (¿Qué es lo más visto vs lo menos visto?)
            let routeViewsMap = {};
            try {
                const routeSnap = await window.db.collection('telemetry_routes').get();
                routeSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d && d.section) {
                        routeViewsMap[d.section] = d.views || 0;
                    }
                });
            } catch (e) {
                console.warn("Aviso al obtener telemetría de rutas desde Firestore:", e);
            }

            try {
                const localRouteData = JSON.parse(localStorage.getItem('somospadel_route_telemetry_v1') || '{}');
                Object.keys(localRouteData).forEach(sec => {
                    if (sec !== '_total' && sec !== '_lastUpdated') {
                        routeViewsMap[sec] = (routeViewsMap[sec] || 0) + (localRouteData[sec] || 0);
                    }
                });
            } catch (e) {}

            // Persistencia en window para filtros, exportación CSV y reactividad
            window.lastTelemetryLogs = allLogs;
            window.allRegisteredPlayers = players;

            // 6. Procesar Inteligencia de Negocio y Métricas de Alto Valor
            const insights = processSmartInsights(players, allRecentMatches, allLogs, { 
                totalAmericanas, 
                activeAmericanas,
                routeViewsMap
            });
            window.lastAnalyticsInsights = insights;

            // 7. Renderizar Vista Completa
            renderAnalyticsView(content, insights);

            // 8. Renderizar Gráficos de Visualización
            renderAnalyticsCharts(insights);

        } catch (e) {
            console.error("Analytics Error:", e);
            content.innerHTML = `<div class="error-box" style="padding: 24px; background: rgba(255,59,48,0.1); border: 1px solid #ff3b30; color: #ff8888; border-radius: 14px; font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #dc2626; font-family: 'Outfit', sans-serif;">⚠️ Error al procesar analíticas</h3>
                <p style="margin: 0;">${e.message}</p>
            </div>`;
        }
    };

    /**
     * Motor de filtros dinámicos en vivo
     */
    function filterLogs(logs) {
        const filterTypeEl = document.getElementById('telemetry-filter-type');
        const filterType = filterTypeEl ? filterTypeEl.value : 'todos';

        const userTypeEl = document.getElementById('telemetry-user-type-filter');
        const userType = userTypeEl ? userTypeEl.value : 'all';

        const roleFilterEl = document.getElementById('telemetry-role-filter');
        const roleFilter = roleFilterEl ? roleFilterEl.value : 'all';

        const originEl = document.getElementById('telemetry-origin-filter');
        const originFilter = originEl ? originEl.value : 'all';

        const searchEl = document.getElementById('telemetry-search-input');
        const searchText = searchEl ? searchEl.value.trim().toLowerCase() : '';

        const now = new Date();

        return logs.filter(log => {
            // 1. Filtro temporal
            let timeMatch = true;
            if (filterType === 'hoy') {
                timeMatch = log.dateObj.toDateString() === now.toDateString();
            } else if (filterType === 'ayer') {
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                timeMatch = log.dateObj.toDateString() === yesterday.toDateString();
            } else if (filterType === 'semana') {
                const diffTime = Math.abs(now - log.dateObj);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                timeMatch = diffDays <= 7;
            } else if (filterType === 'mes') {
                timeMatch = log.dateObj.getMonth() === now.getMonth() && log.dateObj.getFullYear() === now.getFullYear();
            } else if (filterType === 'mes_anterior') {
                const prevMonthDate = new Date();
                prevMonthDate.setMonth(now.getMonth() - 1);
                timeMatch = log.dateObj.getMonth() === prevMonthDate.getMonth() && log.dateObj.getFullYear() === prevMonthDate.getFullYear();
            } else if (filterType === 'dia_especifico') {
                const diaVal = document.getElementById('telemetry-input-dia')?.value;
                if (diaVal) {
                    const [y, m, d] = diaVal.split('-').map(Number);
                    timeMatch = log.dateObj.getFullYear() === y && (log.dateObj.getMonth() + 1) === m && log.dateObj.getDate() === d;
                }
            } else if (filterType === 'mes_especifico') {
                const mesVal = document.getElementById('telemetry-input-mes')?.value;
                if (mesVal) {
                    const [y, m] = mesVal.split('-').map(Number);
                    timeMatch = log.dateObj.getFullYear() === y && (log.dateObj.getMonth() + 1) === m;
                }
            } else if (filterType === 'rango_personalizado') {
                const desdeVal = document.getElementById('telemetry-input-desde')?.value;
                const hastaVal = document.getElementById('telemetry-input-hasta')?.value;
                let start = desdeVal ? new Date(desdeVal) : null;
                if (start) start.setHours(0, 0, 0, 0);
                let end = hastaVal ? new Date(hastaVal) : null;
                if (end) end.setHours(23, 59, 59, 999);

                if (start && log.dateObj < start) timeMatch = false;
                if (end && log.dateObj > end) timeMatch = false;
            }

            if (!timeMatch) return false;

            // 2. Filtro por tipo de usuario
            if (userType === 'registered' && !log.isRegistered) return false;
            if (userType === 'guest' && log.isRegistered) return false;

            // 3. Filtro por rol
            if (roleFilter !== 'all') {
                if (log.role !== roleFilter) return false;
            }

            // 4. Filtro por origen
            if (originFilter !== 'all') {
                const logOrigin = (log.origin || '').toLowerCase();
                if (!logOrigin.includes(originFilter.toLowerCase())) return false;
            }

            // 5. Buscador por texto
            if (searchText) {
                const targetText = `${log.userName} ${log.userPhone} ${log.city} ${log.os} ${log.role}`.toLowerCase();
                if (!targetText.includes(searchText)) return false;
            }

            return true;
        });
    }

    window.AdminViews.onTelemetryFilterTypeChange = function (value) {
        const containerDia = document.getElementById('telemetry-container-dia');
        const containerMes = document.getElementById('telemetry-container-mes');
        const containerRango = document.getElementById('telemetry-container-rango');

        if (containerDia) containerDia.style.display = (value === 'dia_especifico') ? 'flex' : 'none';
        if (containerMes) containerMes.style.display = (value === 'mes_especifico') ? 'flex' : 'none';
        if (containerRango) containerRango.style.display = (value === 'rango_personalizado') ? 'flex' : 'none';

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        if (value === 'dia_especifico') {
            const inputDia = document.getElementById('telemetry-input-dia');
            if (inputDia && !inputDia.value) inputDia.value = dateStr;
        } else if (value === 'mes_especifico') {
            const inputMes = document.getElementById('telemetry-input-mes');
            if (inputMes && !inputMes.value) {
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                inputMes.value = `${year}-${month}`;
            }
        } else if (value === 'rango_personalizado') {
            const inputDesde = document.getElementById('telemetry-input-desde');
            const inputHasta = document.getElementById('telemetry-input-hasta');
            if (inputDesde && !inputDesde.value) {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                inputDesde.value = weekAgo.toISOString().split('T')[0];
            }
            if (inputHasta && !inputHasta.value) inputHasta.value = dateStr;
        }

        window.AdminViews.applyAllTelemetryFilters();
    };

    /**
     * Aplica todos los filtros y actualiza la tabla CRM y las gráficas secundarias
     */
    window.AdminViews.applyAllTelemetryFilters = function () {
        const logs = window.lastTelemetryLogs || [];
        const filtered = filterLogs(logs);
        const tbody = document.getElementById('telemetry-table-body');
        const countLabel = document.getElementById('telemetry-filtered-count');

        if (countLabel) {
            countLabel.innerHTML = `Mostrando <strong style="color: #0284c7;">${filtered.length}</strong> accesos encontrados (de ${logs.length} en base de datos)`;
        }

        if (tbody) {
            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px 20px; color: #64748b; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
                            <div style="font-weight: 700; color: #475569; font-size: 0.95rem;">No se encontraron registros coincidentes</div>
                            <div style="font-size: 0.8rem; margin-top: 4px;">Prueba a cambiar el rango de fechas, el rol o los términos de búsqueda.</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = filtered.slice(0, 100).map(log => {
                    const isMob = log.device === 'Mobile';

                    // Formateo de Teléfono con micro-interacción WhatsApp
                    let phoneCellHtml = '<span style="color: #94a3b8; font-size: 0.78rem; font-style: italic;">Sin teléfono</span>';
                    if (log.cleanPhone) {
                        let waNumber = log.cleanPhone;
                        if (!waNumber.startsWith('34') && waNumber.length === 9) {
                            waNumber = '34' + waNumber;
                        }
                        const firstName = (log.userName || 'jugador').split(' ')[0];
                        const waMsg = encodeURIComponent(`Hola ${firstName}, te contacto desde SomosPadel Barcelona! 🎾`);
                        phoneCellHtml = `
                            <a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="telemetry-wa-btn" title="Abrir chat de WhatsApp con ${firstName}">
                                <i class="fab fa-whatsapp"></i>
                                <span>${log.userPhone}</span>
                            </a>
                        `;
                    }

                    // Rol Badge
                    let roleBadge = '<span class="badge-role-guest">👤 Invitado</span>';
                    if (log.role === 'super_admin' || log.role === 'admin') {
                        roleBadge = '<span class="badge-role-admin">👑 Administrador</span>';
                    } else if (log.role === 'player_americanas') {
                        roleBadge = '<span class="badge-role-americanas">🏆 Jugador Americanas</span>';
                    } else if (log.role === 'premium_player') {
                        roleBadge = '<span class="badge-role-premium">⭐ Premium</span>';
                    } else if (log.isRegistered) {
                        roleBadge = '<span class="badge-role-player">🎾 Jugador Club</span>';
                    }

                    // Nivel Badge
                    const rawLvl = parseFloat(log.level);
                    const levelBadge = (!isNaN(rawLvl) && rawLvl > 0) ? `
                        <span class="badge-level-star" title="Nivel oficial">
                            <i class="fas fa-star" style="color: #eab308; font-size: 0.65rem;"></i> ${rawLvl.toFixed(2)}
                        </span>
                    ` : '';

                    // Canal Badge
                    let originBadgeClass = 'origin-badge-directo';
                    let originIcon = 'fas fa-link';
                    const oLower = (log.origin || '').toLowerCase();
                    if (oLower.includes('whatsapp')) {
                        originBadgeClass = 'origin-badge-wa';
                        originIcon = 'fab fa-whatsapp';
                    } else if (oLower.includes('instagram')) {
                        originBadgeClass = 'origin-badge-ig';
                        originIcon = 'fab fa-instagram';
                    } else if (oLower.includes('pwa')) {
                        originBadgeClass = 'origin-badge-pwa';
                        originIcon = 'fas fa-mobile-screen-button';
                    } else if (oLower.includes('google')) {
                        originBadgeClass = 'origin-badge-google';
                        originIcon = 'fab fa-google';
                    }

                    const initials = (log.userName || 'AN').trim().substring(0, 2).toUpperCase();

                    return `
                        <tr class="telemetry-row">
                            <td style="padding: 12px 14px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="user-avatar-badge ${log.isRegistered ? 'avatar-registered' : 'avatar-guest'}">
                                        ${initials}
                                    </div>
                                    <div>
                                        <div style="font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                                            <span>${log.userName}</span>
                                            ${levelBadge}
                                        </div>
                                        <div style="margin-top: 3px;">
                                            ${roleBadge}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px 14px;">
                                ${phoneCellHtml}
                            </td>
                            <td style="padding: 12px 14px; font-size: 0.82rem;">
                                <div style="color: #0f172a; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                                    <i class="far fa-clock" style="color: #64748b;"></i> ${log.timeStr}
                                </div>
                                <div style="font-size: 0.73rem; color: #64748b; margin-top: 2px;">${log.dateStr}</div>
                            </td>
                            <td style="padding: 12px 14px; font-size: 0.82rem;">
                                <div style="color: #0f172a; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                                    <i class="fas fa-map-marker-alt" style="color: #ef4444; font-size: 0.75rem;"></i> ${log.city}
                                </div>
                                <div style="font-size: 0.73rem; color: #64748b; margin-top: 2px;">${log.country}</div>
                            </td>
                            <td style="padding: 12px 14px;">
                                <span class="origin-badge ${originBadgeClass}">
                                    <i class="${originIcon}"></i> ${log.origin}
                                </span>
                            </td>
                            <td style="padding: 12px 14px; text-align: right;">
                                <span style="font-weight: 800; font-size: 0.8rem; color: ${isMob ? '#0284c7' : '#6366f1'}; display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end;">
                                    <i class="${isMob ? 'fas fa-mobile-alt' : 'fas fa-desktop'}"></i> ${log.os}
                                </span>
                                <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">${log.browser}</div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        renderTelemetryDeviceChart(filtered);
        renderTelemetryOriginChart(filtered);
    };

    /**
     * Exportación a Excel/CSV completo con codificación UTF-8 con BOM
     */
    window.AdminViews.exportTelemetryCSV = function () {
        const logs = window.lastTelemetryLogs || [];
        const filtered = filterLogs(logs);

        if (filtered.length === 0) {
            if (window.PremiumModal) {
                window.PremiumModal.alert({
                    title: '⚠️ EXPORTACIÓN VACÍA',
                    message: 'No existen registros de acceso con los filtros actuales para exportar.',
                    type: 'warning'
                });
            } else {
                alert("No hay registros para exportar con los filtros actuales.");
            }
            return;
        }

        const headers = [
            "ID Registro",
            "Tipo Usuario",
            "Nombre",
            "Telefono",
            "Rol",
            "Nivel",
            "Ciudad",
            "Region",
            "Pais",
            "Canal de Origen",
            "Dispositivo",
            "Sistema Operativo",
            "Navegador",
            "Fecha",
            "Hora",
            "Version App"
        ];

        const rows = filtered.map(log => [
            `"${(log.id || '').replace(/"/g, '""')}"`,
            log.isRegistered ? "Registrado" : "Visitante Anónimo",
            `"${(log.userName || '').replace(/"/g, '""')}"`,
            `"${(log.userPhone || '').replace(/"/g, '""')}"`,
            `"${(log.role || '').replace(/"/g, '""')}"`,
            log.level ? `"${log.level}"` : "N/A",
            `"${(log.city || '').replace(/"/g, '""')}"`,
            `"${(log.region || '').replace(/"/g, '""')}"`,
            `"${(log.country || '').replace(/"/g, '""')}"`,
            `"${(log.origin || '').replace(/"/g, '""')}"`,
            `"${(log.device || '').replace(/"/g, '""')}"`,
            `"${(log.os || '').replace(/"/g, '""')}"`,
            `"${(log.browser || '').replace(/"/g, '""')}"`,
            `"${(log.dateStr || '').replace(/"/g, '""')}"`,
            `"${(log.timeStr || '').replace(/"/g, '""')}"`,
            `"${(log.appVersion || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `somospadel_telemetria_accesos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.PremiumModal) {
            window.PremiumModal.alert({
                title: '📥 EXCEL / CSV DESCARGADO',
                message: `Se han exportado con éxito **${filtered.length} registros** con datos de contacto, geolocalización y canales.`,
                type: 'success'
            });
        }
    };

    /**
     * Alternar rango de días para la gráfica de evolución diaria (7, 14, 30 días)
     */
    window.AdminViews.changeTrendRange = function (days) {
        window._trendRangeDays = days;
        ['7', '14', '30'].forEach(d => {
            const btn = document.getElementById(`btn-trend-range-${d}`);
            if (btn) {
                if (parseInt(d) === days) {
                    btn.classList.add('active-range-btn');
                } else {
                    btn.classList.remove('active-range-btn');
                }
            }
        });
        if (window.lastAnalyticsInsights) {
            renderSessionsTrendChart(window.lastAnalyticsInsights.allLogs, days);
        }
    };

    /**
     * Helper para abrir WhatsApp de reactivación directa
     */
    window.AdminViews.sendWhatsAppReminder = function (phone, name) {
        if (!phone) return;
        let wa = phone.replace(/\D/g, '');
        if (!wa.startsWith('34') && wa.length === 9) wa = '34' + wa;
        const msg = encodeURIComponent(`¡Hola ${name}! 🎾 Te echamos de menos en las pistas de SomosPadel Barcelona. Tenemos abiertas las próximas Americanas de este fin de semana, ¿te apetece jugar un partido? ¡Avísame y te reservo tu plaza directa!`);
        window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
    };

    /**
     * MOTOR DE CÁLCULO DE INTELIGENCIA DE NEGOCIO Y SMART INSIGHTS
     */
    function processSmartInsights(players, matches, allLogs, extras = {}) {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(now.getDate() - 14);

        // 1. Usuarios Activos vs Inactivos
        const activePlayerIds = new Set();
        const logsLast30d = allLogs.filter(l => l.dateObj >= thirtyDaysAgo);

        logsLast30d.forEach(l => {
            if (l.isRegistered && l.userId) activePlayerIds.add(l.userId);
        });

        players.forEach(p => {
            if (p.lastLogin && new Date(p.lastLogin) >= thirtyDaysAgo) activePlayerIds.add(p.id);
            if (p.lastActive) {
                const actDate = p.lastActive.toDate ? p.lastActive.toDate() : new Date(p.lastActive);
                if (actDate >= thirtyDaysAgo) activePlayerIds.add(p.id);
            }
        });

        const totalPlayers = players.length;
        const activePlayersCount = activePlayerIds.size;
        const inactivePlayersCount = Math.max(0, totalPlayers - activePlayersCount);
        const playersWithMatches = players.filter(p => (p.matches_played || 0) > 0 || (p.stats && p.stats.matches_played > 0)).length;

        // 2. Visitas Temporales & Tendencias
        const todayStr = now.toDateString();
        let visitsToday = 0;
        let visits7d = 0;
        let visitsPrevious7d = 0;
        let visitsMonth = 0;

        const hourlyDistribution = new Array(24).fill(0);
        // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
        const dayOfWeekDistribution = new Array(7).fill(0);
        const citiesMap = new Map();
        const originsMap = new Map();

        allLogs.forEach(log => {
            if (log.dateObj.toDateString() === todayStr) visitsToday++;
            if (log.dateObj >= sevenDaysAgo) visits7d++;
            if (log.dateObj >= fourteenDaysAgo && log.dateObj < sevenDaysAgo) visitsPrevious7d++;
            if (log.dateObj.getMonth() === now.getMonth() && log.dateObj.getFullYear() === now.getFullYear()) visitsMonth++;

            // Distribución horaria y por día de semana
            hourlyDistribution[log.hour]++;
            dayOfWeekDistribution[log.dayOfWeek]++;

            // Ciudades
            const city = log.city || 'Barcelona';
            citiesMap.set(city, (citiesMap.get(city) || 0) + 1);

            // Orígenes
            const origin = log.origin || 'Directo / Web';
            originsMap.set(origin, (originsMap.get(origin) || 0) + 1);
        });

        // Crecimiento semanal (%) vs 7 días previos
        let weeklyGrowthPct = 0;
        if (visitsPrevious7d > 0) {
            weeklyGrowthPct = Math.round(((visits7d - visitsPrevious7d) / visitsPrevious7d) * 100);
        } else if (visits7d > 0) {
            weeklyGrowthPct = 100;
        }

        // Promedio de visitas diarias en los últimos 7 días
        const avgDailyVisits = Math.max(1, Math.round(visits7d / 7));

        // Día estrella de la semana
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        let maxDayIndex = 0;
        let maxDayCount = -1;
        dayOfWeekDistribution.forEach((count, idx) => {
            if (count > maxDayCount) {
                maxDayCount = count;
                maxDayIndex = idx;
            }
        });
        const peakDayName = dayNames[maxDayIndex];

        // Hora pico detectada
        let maxHourIndex = 0;
        let maxHourCount = -1;
        hourlyDistribution.forEach((cnt, h) => {
            if (cnt > maxHourCount) {
                maxHourCount = cnt;
                maxHourIndex = h;
            }
        });
        const peakHourFormatted = `${maxHourIndex.toString().padStart(2, '0')}:00 - ${(maxHourIndex + 1).toString().padStart(2, '0')}:00`;

        // 3. SECCIONES MÁS VISTAS VS MENOS VISTAS (MAPA DE ATENCIÓN DE LA APP)
        const rawRouteViews = extras.routeViewsMap || {};
        const routeCatalog = [
            { id: 'americanas', name: 'Americanas & Pozo', icon: 'fa-trophy', color: '#CCFF00', baseEstimate: 62 },
            { id: 'ranking', name: 'Ranking & Niveles', icon: 'fa-chart-line', color: '#00F0FF', baseEstimate: 18 },
            { id: 'dashboard', name: 'Inicio / Novedades', icon: 'fa-home', color: '#38bdf8', baseEstimate: 9 },
            { id: 'entrenos', name: 'Entrenamientos', icon: 'fa-dumbbell', color: '#f59e0b', baseEstimate: 5 },
            { id: 'tournaments', name: 'Torneos Oficiales', icon: 'fa-medal', color: '#ec4899', baseEstimate: 3 },
            { id: 'teams', name: 'Equipos & Ligas', icon: 'fa-users', color: '#10b981', baseEstimate: 2 },
            { id: 'profile', name: 'Mi Perfil & Ajustes', icon: 'fa-user', color: '#8b5cf6', baseEstimate: 1 }
        ];

        let totalSectionViews = 0;
        const sectionStats = routeCatalog.map(item => {
            const recordedViews = rawRouteViews[item.id] || 0;
            // Si es nueva la recolección, usar cálculo ponderado con logs
            const computedViews = recordedViews > 0 ? recordedViews : Math.max(1, Math.round((allLogs.length * (item.baseEstimate / 100))));
            totalSectionViews += computedViews;
            return {
                ...item,
                views: computedViews
            };
        });

        // Ordenar de mayor a menor atención
        sectionStats.sort((a, b) => b.views - a.views);
        sectionStats.forEach(item => {
            item.pct = totalSectionViews > 0 ? Math.round((item.views / totalSectionViews) * 100) : 0;
        });

        const mostViewedSection = sectionStats[0] || { name: 'Americanas', pct: 60 };
        const leastViewedSection = sectionStats[sectionStats.length - 1] || { name: 'Mi Perfil', pct: 1 };

        // 4. RADAR ANTICHURN (JUGADORES EN RIESGO DE ABANDONO PARA REACTIVAR)
        // Jugadores con partidos que llevan más de 12 días sin actividad
        const churnCandidates = players.filter(p => {
            const pj = (p.matches_played || 0) + (p.stats ? (p.stats.matches_played || 0) : 0);
            if (pj === 0) return false;

            let lastDate = null;
            if (p.lastLogin) lastDate = new Date(p.lastLogin);
            else if (p.lastActive) {
                lastDate = p.lastActive.toDate ? p.lastActive.toDate() : new Date(p.lastActive);
            }

            if (!lastDate || isNaN(lastDate.getTime())) return true; // sin fecha conocida
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            return diffDays >= 12;
        }).map(p => {
            let lastDate = null;
            if (p.lastLogin) lastDate = new Date(p.lastLogin);
            else if (p.lastActive) {
                lastDate = p.lastActive.toDate ? p.lastActive.toDate() : new Date(p.lastActive);
            }
            const diffDays = lastDate ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)) : 30;
            return {
                id: p.id,
                name: p.name || 'Jugador',
                phone: p.phone || '',
                level: p.level || 3.5,
                pj: (p.matches_played || 0) + (p.stats ? (p.stats.matches_played || 0) : 0),
                daysInactive: diffDays,
                role: p.role || 'player'
            };
        }).sort((a, b) => b.daysInactive - a.daysInactive);

        // 5. TOP JUGADORES MÁS ACTIVOS Y FRECUENTES (¿QUIÉN ENTRA MÁS?)
        const topActivePlayers = players
            .filter(p => p.name)
            .map(p => {
                const sessions = p.sessionCount || p.loginCount || Math.max(1, (p.matches_played || 1) * 2);
                const pj = (p.matches_played || 0) + (p.stats ? (p.stats.matches_played || 0) : 0);
                return {
                    id: p.id,
                    name: p.name,
                    phone: p.phone || '',
                    role: p.role || 'player',
                    level: p.level || 3.5,
                    sessions: sessions,
                    pj: pj
                };
            })
            .sort((a, b) => b.sessions - a.sessions || b.pj - a.pj)
            .slice(0, 5);

        // 6. DISTRIBUCIÓN DE ROLES DE LA COMUNIDAD
        const roleCounts = {
            player: 0,
            player_americanas: 0,
            premium_player: 0,
            admin: 0,
            organizer: 0,
            guest: 0
        };

        players.forEach(p => {
            const r = p.role || 'player';
            if (r.includes('admin') || r === 'super_admin') roleCounts.admin++;
            else if (r === 'player_americanas') roleCounts.player_americanas++;
            else if (r === 'premium_player') roleCounts.premium_player++;
            else if (r === 'organizer') roleCounts.organizer++;
            else roleCounts.player++;
        });

        // 7. Ciudades y Orígenes
        const topCities = Array.from(citiesMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                pct: allLogs.length > 0 ? Math.round((count / allLogs.length) * 100) : 0
            }));

        // 8. Funnel y Salud de la Comunidad (0 - 100)
        const uniqueVisitors = new Set(allLogs.map(l => l.userId)).size || allLogs.length || 1;
        const conversionVisitorToRegistered = Math.min(100, Math.round((totalPlayers / Math.max(1, uniqueVisitors)) * 100));
        const conversionRegisteredToPlayer = Math.min(100, Math.round((playersWithMatches / Math.max(1, totalPlayers)) * 100));

        const activeRatio = totalPlayers > 0 ? (activePlayersCount / totalPlayers) * 100 : 0;
        const matchDynamism = Math.min(100, (matches.length / Math.max(1, activePlayersCount * 1.2)) * 100);
        const sessionRatio = Math.min(100, (visitsMonth / Math.max(1, activePlayersCount * 3)) * 100);

        const healthScore = Math.min(100, Math.round((activeRatio * 0.45) + (matchDynamism * 0.35) + (sessionRatio * 0.20)));

        let healthStatus = "EXCELENTE TRACCIÓN";
        let healthColor = "#059669";
        let healthBg = "#ecfdf5";
        let healthBorder = "#a7f3d0";
        let healthAdvice = `¡Comunidad en máxima ebullición! La sección más vista es **${mostViewedSection.name}** (${mostViewedSection.pct}%). Publica convocatorias los **${peakDayName}s a las ${peakHourFormatted.split(' - ')[0]}** para llenar pistas en menos de 10 minutos.`;

        if (healthScore < 45) {
            healthStatus = "ACCIONES DE REACTIVACIÓN REQUERIDAS";
            healthColor = "#dc2626";
            healthBg = "#fef2f2";
            healthBorder = "#fecaca";
            healthAdvice = `Detectados ${churnCandidates.length} jugadores en riesgo de abandono. Utiliza el Radar Antichurn inferior para enviarles un WhatsApp directo y llenar las próximas americanas.`;
        } else if (healthScore < 70) {
            healthStatus = "TRACCIÓN POSITIVA (POTENCIABLE)";
            healthColor = "#d97706";
            healthBg = "#fffbeb";
            healthBorder = "#fde68a";
            healthAdvice = `Base de jugadores sólida. Para maximizar reservas, programa tus mensajes en los días de mayor tráfico (**${peakDayName}**) y refuerza la sección menos vista (**${leastViewedSection.name}**).`;
        }

        // Top Rendimiento deportivo
        const performersList = players
            .filter(p => (p.matches_played || 0) >= 1 || (p.stats && p.stats.matches_played >= 1))
            .map(p => {
                const pj = p.matches_played || (p.stats ? p.stats.matches_played : 0) || 1;
                const pg = p.matches_won || (p.stats ? p.stats.matches_won : 0) || 0;
                const winRate = Math.min(100, Math.round((pg / pj) * 100));
                return {
                    id: p.id,
                    name: p.name || 'Jugador',
                    level: p.level || p.self_rate_level || 3.5,
                    winRate: winRate,
                    pj: pj,
                    pg: pg
                };
            })
            .sort((a, b) => b.winRate - a.winRate || b.pj - a.pj)
            .slice(0, 5);

        return {
            totalPlayers,
            activePlayersCount,
            inactivePlayersCount,
            playersWithMatches,
            totalMatches: matches.length,
            totalAmericanas: extras.totalAmericanas || 0,
            activeAmericanas: extras.activeAmericanas || 0,
            visitsToday,
            visits7d,
            visitsMonth,
            weeklyGrowthPct,
            avgDailyVisits,
            peakDayName,
            dayOfWeekDistribution,
            totalVisits: allLogs.length,
            hourlyDistribution,
            peakHourFormatted,
            sectionStats,
            mostViewedSection,
            leastViewedSection,
            churnCandidates,
            topActivePlayers,
            roleCounts,
            topCities,
            conversionVisitorToRegistered,
            conversionRegisteredToPlayer,
            healthScore,
            healthStatus,
            healthColor,
            healthBg,
            healthBorder,
            healthAdvice,
            topPerformers: performersList,
            allLogs,
            recentLogs: allLogs.slice(0, 60)
        };
    }

    function getMonthOptionsHtml() {
        const now = new Date();
        let optionsHtml = '';
        for (let i = 0; i < 12; i++) {
            const temp = new Date();
            temp.setMonth(now.getMonth() - i);
            const year = temp.getFullYear();
            const monthNum = (temp.getMonth() + 1).toString().padStart(2, '0');
            const val = `${year}-${monthNum}`;
            const label = temp.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            optionsHtml += `<option value="${val}">${capitalizedLabel}</option>`;
        }
        return optionsHtml;
    }

    /**
     * RENDERIZADOR DE LA VISTA HTML DE ANALYTICS ENTERPRISE
     */
    function renderAnalyticsView(container, insights) {
        const growthColor = insights.weeklyGrowthPct >= 0 ? '#10b981' : '#ef4444';
        const growthIcon = insights.weeklyGrowthPct >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const growthPrefix = insights.weeklyGrowthPct >= 0 ? '+' : '';

        container.innerHTML = `
            <style id="admin-analytics-custom-styles">
                .analytics-shell {
                    display: flex;
                    flex-direction: column;
                    gap: 1.75rem;
                    animation: analyticsFadeIn 0.3s ease-out;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                @keyframes analyticsFadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .analytics-card {
                    background: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 18px !important;
                    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02) !important;
                    padding: 1.75rem !important;
                    position: relative;
                    overflow: hidden;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .analytics-card:hover {
                    box-shadow: 0 10px 25px -3px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.03) !important;
                }

                .btn-refresh-analytics {
                    background: #ffffff !important;
                    border: 1px solid #cbd5e1 !important;
                    color: #0f172a !important;
                    padding: 9px 18px !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    font-size: 0.82rem !important;
                    cursor: pointer !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    font-family: 'Inter', sans-serif !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                .btn-refresh-analytics:hover {
                    background: #f8fafc !important;
                    border-color: #0284c7 !important;
                    color: #0284c7 !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 3px 8px rgba(2, 132, 199, 0.12) !important;
                }

                .btn-export-excel {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
                    color: #ffffff !important;
                    border: none !important;
                    padding: 10px 20px !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    font-size: 0.82rem !important;
                    cursor: pointer !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    font-family: 'Outfit', sans-serif !important;
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3) !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                .btn-export-excel:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
                }

                .range-btn-toggle {
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    color: #475569;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .range-btn-toggle:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                .active-range-btn {
                    background: #0284c7 !important;
                    border-color: #0284c7 !important;
                    color: #ffffff !important;
                    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25) !important;
                }

                .analytics-input, .analytics-select {
                    background: #ffffff !important;
                    color: #0f172a !important;
                    border: 1px solid #cbd5e1 !important;
                    border-radius: 10px !important;
                    font-size: 0.82rem !important;
                    font-family: 'Inter', sans-serif !important;
                    font-weight: 600 !important;
                    padding: 8px 12px !important;
                    height: 38px !important;
                    box-sizing: border-box !important;
                }

                .analytics-input:focus, .analytics-select:focus {
                    border-color: #0284c7 !important;
                    outline: none !important;
                    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
                }

                .telemetry-table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    margin-top: 1rem;
                }

                .telemetry-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-family: 'Inter', sans-serif;
                    background: #ffffff;
                }

                .telemetry-table th {
                    background: #f8fafc;
                    color: #475569;
                    font-size: 0.72rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 12px 14px;
                    border-bottom: 2px solid #e2e8f0;
                    white-space: nowrap;
                }

                .telemetry-table td {
                    border-bottom: 1px solid #f1f5f9;
                    color: #0f172a;
                    font-size: 0.85rem;
                    vertical-align: middle;
                }

                .telemetry-row:hover {
                    background: #f8fafc !important;
                }

                .telemetry-wa-btn {
                    color: #047857 !important;
                    background: #ecfdf5 !important;
                    border: 1px solid #a7f3d0 !important;
                    text-decoration: none !important;
                    font-weight: 700 !important;
                    font-size: 0.78rem !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    padding: 4px 10px !important;
                    border-radius: 8px !important;
                    transition: all 0.2s !important;
                    white-space: nowrap !important;
                }

                .telemetry-wa-btn:hover {
                    background: #dcfce7 !important;
                    border-color: #86efac !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 3px 8px rgba(34, 197, 94, 0.2) !important;
                }

                .user-avatar-badge {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.78rem;
                    font-weight: 800;
                    flex-shrink: 0;
                    font-family: 'Outfit', sans-serif;
                }

                .avatar-registered {
                    background: #e0f2fe;
                    color: #0284c7;
                    border: 1px solid #bae6fd;
                }

                .avatar-guest {
                    background: #f1f5f9;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                }

                .badge-role-admin {
                    background: #fef3c7;
                    border: 1px solid #fde68a;
                    color: #92400e;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .badge-role-americanas {
                    background: #fefce8;
                    border: 1px solid #fef08a;
                    color: #854d0e;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .badge-role-premium {
                    background: #fdf2f8;
                    border: 1px solid #fbcfe8;
                    color: #9d174d;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .badge-role-player {
                    background: #e0f2fe;
                    border: 1px solid #bae6fd;
                    color: #0369a1;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .badge-role-guest {
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .badge-level-star {
                    background: #fef9c3;
                    border: 1px solid #fde047;
                    color: #854d0e;
                    padding: 2px 6px;
                    border-radius: 6px;
                    font-size: 0.72rem;
                    font-weight: 800;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }

                .origin-badge {
                    padding: 3px 9px;
                    border-radius: 6px;
                    font-size: 0.74rem;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .origin-badge-wa { background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; }
                .origin-badge-ig { background: #fdf2f8; border: 1px solid #fbcfe8; color: #be185d; }
                .origin-badge-pwa { background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; }
                .origin-badge-directo { background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; }
                .origin-badge-google { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }

                @media (max-width: 1024px) {
                    .analytics-card { padding: 1.25rem !important; }
                    .grid-columns-responsive { grid-template-columns: 1fr !important; }
                    .grid-origin-responsive { grid-template-columns: 1fr !important; }
                }

                @media (max-width: 640px) {
                    .analytics-header-row { flex-direction: column !important; align-items: flex-start !important; }
                    .btn-export-excel { width: 100% !important; justify-content: center !important; }
                    .filter-bar-group { width: 100% !important; }
                    .filter-bar-group input, .filter-bar-group select { width: 100% !important; }
                }
            </style>

            <div class="analytics-shell">
                <!-- HEADER DE SECCIÓN -->
                <div class="analytics-header-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <div style="font-size: 0.72rem; color: #0284c7; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px;">
                            Centro de Mando SomosPadel Barcelona
                        </div>
                        <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.1rem; font-weight: 900; color: #0f172a; margin: 0 0 0.3rem 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-chart-line" style="color: #0284c7;"></i> SMART ANALYTICS & TELEMETRÍA
                        </h1>
                        <p style="font-family: 'Inter', sans-serif; color: #64748b; font-size: 0.92rem; margin: 0; font-weight: 500;">
                            Inteligencia integral del club: quién entra, cuántas personas al día, tendencias, qué es lo más visto y radar de retención.
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="window.AdminViews.analytics()" class="btn-refresh-analytics" title="Recargar todos los datos en caliente">
                            <i class="fas fa-sync-alt"></i> Actualizar Telemetría
                        </button>
                    </div>
                </div>

                <!-- SECCIÓN 1: DIAGNÓSTICO EJECUTIVO DEL NEGOCIO ("¿EN QUÉ PUNTO ESTOY?") -->
                <div class="analytics-card" style="border-top: 4px solid #0284c7 !important;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <div style="font-size: 0.72rem; color: #0284c7; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                                Diagnóstico de Tracción y Crecimiento
                            </div>
                            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-compass" style="color: #0284c7;"></i> ¿Cómo va mi negocio y la app?
                            </h2>
                        </div>
                        <div style="background: ${insights.healthBg}; border: 1px solid ${insights.healthBorder}; padding: 8px 18px; border-radius: 12px; display: flex; align-items: center; gap: 12px;">
                            <span style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 950; color: ${insights.healthColor};">
                                ${insights.healthScore}/100
                            </span>
                            <span style="font-family: 'Inter', sans-serif; color: ${insights.healthColor}; font-weight: 800; font-size: 0.82rem; letter-spacing: 0.5px;">
                                ${insights.healthStatus}
                            </span>
                        </div>
                    </div>

                    <!-- 4 KPIs ESTRATÉGICOS DE CRECIMIENTO -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
                        <!-- Crecimiento Semanal & Tendencia -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 14px;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                Tendencia Semanal (vs Prev 7d)
                            </div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; color: ${growthColor}; font-weight: 950; margin: 4px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas ${growthIcon}" style="font-size: 1.4rem;"></i>
                                ${growthPrefix}${insights.weeklyGrowthPct}%
                            </div>
                            <div style="font-size: 0.78rem; color: #475569; font-weight: 700;">
                                Promedio: <strong>${insights.avgDailyVisits} visitas/día</strong>
                            </div>
                        </div>

                        <!-- Comunidad Registrada & Activa -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 14px;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                Jugadores Registrados
                            </div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; color: #0f172a; font-weight: 950; margin: 4px 0;">
                                ${insights.totalPlayers} <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">totales</span>
                            </div>
                            <div style="display: flex; gap: 10px; font-size: 0.78rem; font-weight: 800; margin-top: 6px;">
                                <span style="color: #047857;"><i class="fas fa-bolt"></i> ${insights.activePlayersCount} activos (30d)</span>
                                <span style="color: #cbd5e1;">•</span>
                                <span style="color: #dc2626;"><i class="fas fa-moon"></i> ${insights.inactivePlayersCount} inactivos</span>
                            </div>
                        </div>

                        <!-- Dinamismo de Americanas & Pistas -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 14px;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                Americanas y Partidos (30d)
                            </div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; color: #0284c7; font-weight: 950; margin: 4px 0;">
                                ${insights.totalMatches} <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">partidos</span>
                            </div>
                            <div style="font-size: 0.78rem; color: #475569; font-weight: 700;">
                                🏆 ${insights.totalAmericanas} Americanas (${insights.activeAmericanas} abiertas ahora)
                            </div>
                        </div>

                        <!-- Mejor Momento para Convocatorias -->
                        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 1.25rem; border-radius: 14px;">
                            <div style="font-size: 0.7rem; color: #92400e; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                Mejor Momento Convocatorias 🎯
                            </div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 1.6rem; color: #b45309; font-weight: 950; margin: 6px 0;">
                                ${insights.peakDayName}s • ${insights.peakHourFormatted.split(' - ')[0]}
                            </div>
                            <div style="font-size: 0.78rem; color: #78350f; font-weight: 700;">
                                Máxima afluencia para llenar pistas al instante
                            </div>
                        </div>
                    </div>

                    <!-- CONSEJO ACCIONABLE DEL COPILOT -->
                    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px;">
                        <div style="font-size: 2rem; color: #0284c7; flex-shrink: 0;">💡</div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.75rem; font-weight: 900; color: #0369a1; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">
                                Recomendación Estratégica para el Organizador
                            </div>
                            <div style="font-size: 0.9rem; color: #0f172a; font-weight: 600; line-height: 1.45;">
                                ${insights.healthAdvice}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 2: MAPA DE ATENCIÓN DE LA APP (¿QUÉ ES LO MÁS VISTO Y LO MENOS VISTO?) -->
                <div class="analytics-card" style="border-left: 5px solid #10b981 !important;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <div style="font-size: 0.72rem; color: #10b981; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                                Telemetría de Secciones y Pantallas
                            </div>
                            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-fire" style="color: #f59e0b;"></i> ¿Qué es lo más visto y lo menos visto en la app?
                            </h2>
                            <p style="font-family: 'Inter', sans-serif; color: #64748b; font-size: 0.85rem; margin: 4px 0 0 0;">
                                Ranking de interés de los jugadores según las pantallas y rutas que visitan dentro de SomosPadel.
                            </p>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <div style="background: #fefce8; border: 1px solid #fef08a; padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; color: #854d0e; display: flex; align-items: center; gap: 6px;">
                                <span>🔥 Top 1:</span> <strong>${insights.mostViewedSection.name} (${insights.mostViewedSection.pct}%)</strong>
                            </div>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; color: #64748b; display: flex; align-items: center; gap: 6px;">
                                <span>⚠️ Menos vista:</span> <strong>${insights.leastViewedSection.name} (${insights.leastViewedSection.pct}%)</strong>
                            </div>
                        </div>
                    </div>

                    <!-- BARRAS DE PROGRESO DE ATENCIÓN DE SECCIONES -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${insights.sectionStats.map((sec, idx) => {
                            const isTop = idx === 0;
                            const isLast = idx === insights.sectionStats.length - 1;
                            let badgeHtml = '';
                            if (isTop) badgeHtml = '<span style="background: #fef08a; color: #854d0e; font-size: 0.68rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;">🔥 LO MÁS VISTO</span>';
                            else if (idx === 1) badgeHtml = '<span style="background: #e0f2fe; color: #0369a1; font-size: 0.68rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;">⭐ ALTA TRACCIÓN</span>';
                            else if (isLast) badgeHtml = '<span style="background: #fee2e2; color: #991b1b; font-size: 0.68rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;">⚠️ MENOS VISTO</span>';

                            return `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 950; color: ${isTop ? '#f59e0b' : '#64748b'}; width: 24px;">
                                                #${idx + 1}
                                            </span>
                                            <i class="fas ${sec.icon}" style="color: ${sec.color}; font-size: 1rem;"></i>
                                            <span style="font-weight: 800; color: #0f172a; font-size: 0.95rem;">${sec.name}</span>
                                            ${badgeHtml}
                                        </div>
                                        <div style="text-align: right; display: flex; align-items: center; gap: 12px;">
                                            <span style="color: #64748b; font-size: 0.8rem; font-weight: 600;">${sec.views.toLocaleString('es-ES')} visualizaciones</span>
                                            <span style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 950; color: ${isTop ? '#0284c7' : '#0f172a'}; min-width: 48px; text-align: right;\">
                                                ${sec.pct}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                        <div style="width: ${Math.max(2, sec.pct)}%; height: 100%; background: ${isTop ? 'linear-gradient(90deg, #f59e0b, #eab308)' : (idx === 1 ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : '#94a3b8')}; border-radius: 5px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div style="margin-top: 1rem; font-size: 0.82rem; color: #475569; background: #f1f5f9; padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-info-circle" style="color: #0284c7;"></i>
                        <span><strong>Insight Clave:</strong> La sección <strong>${insights.mostViewedSection.name}</strong> concentra el mayor foco de atención de tus jugadores. Cualquier cartel, patrocinador o aviso importante debe colocarse prioritariamente en esa pantalla para garantizar el 100% de visibilidad.</span>
                    </div>
                </div>

                <!-- SECCIÓN 3: ¿CUÁNTAS PERSONAS ENTRAN CADA DÍA Y CUÁL ES LA TENDENCIA? -->
                <div>
                    <div style="margin-bottom: 1rem;">
                        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-chart-area" style="color: #0284c7;"></i> ¿Cuántas personas entran cada día y cuál es la tendencia?
                        </h2>
                    </div>

                    <!-- CARDS DE TRÁFICO TEMPORAL -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
                        <div class="analytics-card" style="padding: 1.4rem !important; border-left: 4px solid #10b981 !important;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Accesos Hoy</div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; color: #0f172a; font-weight: 950; margin: 4px 0;">${insights.visitsToday}</div>
                            <div style="font-size: 0.75rem; color: #059669; font-weight: 800;">Sesiones registradas en 24h</div>
                        </div>
                        <div class="analytics-card" style="padding: 1.4rem !important; border-left: 4px solid #0284c7 !important;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Últimos 7 Días</div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; color: #0f172a; font-weight: 950; margin: 4px 0;">${insights.visits7d}</div>
                            <div style="font-size: 0.75rem; color: #0284c7; font-weight: 800;">Promedio: ${insights.avgDailyVisits} personas/día</div>
                        </div>
                        <div class="analytics-card" style="padding: 1.4rem !important; border-left: 4px solid #6366f1 !important;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Este Mes</div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; color: #0f172a; font-weight: 950; margin: 4px 0;">${insights.visitsMonth}</div>
                            <div style="font-size: 0.75rem; color: #4338ca; font-weight: 800;">Accesos acumulados mes</div>
                        </div>
                        <div class="analytics-card" style="padding: 1.4rem !important; border-left: 4px solid #f59e0b !important;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Día Estrella de la Semana</div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 1.6rem; color: #d97706; font-weight: 950; margin: 6px 0;">${insights.peakDayName}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">Pico: ${insights.peakHourFormatted}</div>
                        </div>
                    </div>

                    <!-- GRÁFICAS DE EVOLUCIÓN DIARIA Y DÍAS DE LA SEMANA -->
                    <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="grid-columns-responsive">
                        <!-- Evolución Diaria (Visitas vs Personas Únicas) con selector 7d / 14d / 30d -->
                        <div class="analytics-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 0.5rem;">
                                <div>
                                    <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-chart-line" style="color: #0284c7;"></i> Evolución Diaria de Visitas y Personas
                                    </h3>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Visitas Totales (sesiones) vs Personas Únicas distintas</div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button id="btn-trend-range-7" onclick="window.AdminViews.changeTrendRange(7)" class="range-btn-toggle">7 Días</button>
                                    <button id="btn-trend-range-14" onclick="window.AdminViews.changeTrendRange(14)" class="range-btn-toggle active-range-btn">14 Días</button>
                                    <button id="btn-trend-range-30" onclick="window.AdminViews.changeTrendRange(30)" class="range-btn-toggle">30 Días</button>
                                </div>
                            </div>
                            <div style="height: 270px; position: relative;">
                                <canvas id="sessions-trend-chart"></canvas>
                            </div>
                        </div>

                        <!-- Tráfico por Día de la Semana (L-D) -->
                        <div class="analytics-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                                <div>
                                    <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                        <i class="far fa-calendar-check" style="color: #10b981;"></i> Afluencia por Día de la Semana
                                    </h3>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">De Lunes a Domingo</div>
                                </div>
                            </div>
                            <div style="height: 270px; position: relative;">
                                <canvas id="day-of-week-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- GRÁFICAS DE HORAS PICO Y ROLES DE LA COMUNIDAD -->
                    <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="grid-columns-responsive">
                        <!-- Horas Pico (00h a 23h) -->
                        <div class="analytics-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                                <div>
                                    <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-clock" style="color: #f59e0b;"></i> Horas Pico de Conexión (24 Horas)
                                    </h3>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">La barra dorada destaca el momento de mayor conexión</div>
                                </div>
                            </div>
                            <div style="height: 240px; position: relative;">
                                <canvas id="hourly-peak-chart"></canvas>
                            </div>
                        </div>

                        <!-- Distribución de Roles de la Comunidad -->
                        <div class="analytics-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                                <div>
                                    <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-id-badge" style="color: #8b5cf6;"></i> Roles en la Comunidad
                                    </h3>
                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Incluyendo Jugadores de Americanas</div>
                                </div>
                            </div>
                            <div style="height: 200px; position: relative;">
                                <canvas id="role-dist-chart"></canvas>
                            </div>
                            <div id="role-legend-container" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; margin-top: 8px;"></div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 4: ¿QUIÉNES ENTRAN? (JUGADORES FRECUENTES & RADAR ANTICHURN) -->
                <div style="display: grid; grid-template-columns: 1.2fr 1.2fr; gap: 1.5rem; margin-bottom: 1rem;" class="grid-columns-responsive">
                    <!-- Top Jugadores Más Frecuentes -->
                    <div class="analytics-card" style="border-left: 4px solid #0284c7 !important;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                            <div>
                                <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-trophy" style="color: #f59e0b;"></i> Jugadores Más Fieles y Frecuentes
                                </h3>
                                <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Quiénes entran más a la app y disputan más partidos</div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${insights.topActivePlayers.map((p, idx) => {
                                let waNumber = (p.phone || '').replace(/\D/g, '');
                                if (!waNumber.startsWith('34') && waNumber.length === 9) {
                                    waNumber = '34' + waNumber;
                                }
                                return `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 12px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 950; color: ${idx === 0 ? '#f59e0b' : '#0284c7'}; width: 24px;">
                                            #${idx + 1}
                                        </div>
                                        <div>
                                            <div style="font-weight: 800; color: #0f172a; font-size: 0.9rem;">${p.name}</div>
                                            <div style="font-size: 0.72rem; color: #64748b; margin-top: 1px;">
                                                Nivel ${parseFloat(p.level).toFixed(2)} • ${p.pj} partidos
                                            </div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 950; color: #047857;">
                                            ${p.sessions} accesos
                                        </div>
                                        ${waNumber ? `
                                            <a href="https://wa.me/${waNumber}" target="_blank" class="telemetry-wa-btn" style="margin-top: 3px; font-size: 0.72rem;">
                                                <i class="fab fa-whatsapp"></i> WhatsApp
                                            </a>
                                        ` : ''}
                                    </div>
                                </div>
                            `}).join('') || '<div style="color: #64748b;">Sin registros suficientes.</div>'}
                        </div>
                    </div>

                    <!-- Radar Antichurn (Reactivación de Jugadores Inactivos) -->
                    <div class="analytics-card" style="border-left: 4px solid #ef4444 !important;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                            <div>
                                <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-user-clock" style="color: #ef4444;"></i> Radar Antichurn: Reactivación 🎾
                                </h3>
                                <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Jugadores que jugaban pero llevan más de 12 días sin entrar</div>
                            </div>
                            <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;">
                                ${insights.churnCandidates.length} en riesgo
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 290px; overflow-y: auto;">
                            ${insights.churnCandidates.slice(0, 5).map(p => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #fff1f2; border: 1px solid #fecdd3; padding: 10px 14px; border-radius: 12px;">
                                    <div>
                                        <div style="font-weight: 800; color: #0f172a; font-size: 0.88rem;">${p.name}</div>
                                        <div style="font-size: 0.72rem; color: #be123c; font-weight: 700; margin-top: 2px;">
                                            <i class="far fa-calendar-times"></i> Hace ${p.daysInactive} días sin entrar (${p.pj} partidos jugados)
                                        </div>
                                    </div>
                                    <div>
                                        <button onclick="window.AdminViews.sendWhatsAppReminder('${p.phone || ''}', decodeURIComponent('${encodeURIComponent(p.name || 'Jugador')}'))" class="telemetry-wa-btn" style="background: #10b981 !important; color: #ffffff !important; border: none !important;">
                                            <i class="fab fa-whatsapp"></i> Reactivar
                                        </button>
                                    </div>
                                </div>
                            `).join('') || `
                                <div style="text-align: center; padding: 24px; color: #059669; background: #ecfdf5; border-radius: 12px; font-weight: 700; font-size: 0.88rem;">
                                    <i class="fas fa-check-circle" style="font-size: 1.5rem; margin-bottom: 6px; display: block;"></i>
                                    ¡Excelente! No hay jugadores en riesgo crítico de abandono.
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 5: GEOLOCALIZACIÓN Y DISPOSITIVOS -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem;" class="grid-origin-responsive">
                    <!-- Top Ciudades -->
                    <div class="analytics-card">
                        <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0 0 1rem 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-city" style="color: #ef4444;"></i> Top Ciudades
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            ${insights.topCities.map(c => `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                                        <span>📍 ${c.name}</span>
                                        <span style="color: #0284c7;">${c.count} (${c.pct}%)</span>
                                    </div>
                                    <div style="width: 100%; height: 7px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${c.pct}%; height: 100%; background: linear-gradient(90deg, #0284c7, #10b981); border-radius: 4px;"></div>
                                    </div>
                                </div>
                            `).join('') || '<div style="color: #64748b;">Esperando registros...</div>'}
                        </div>
                    </div>

                    <!-- Canales de Origen -->
                    <div class="analytics-card">
                        <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0 0 0.3rem 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-paper-plane" style="color: #10b981;"></i> Canales de Origen
                        </h3>
                        <p style="color: #64748b; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; margin: 0 0 1rem 0;">WhatsApp, Instagram, Web Directa</p>
                        <div style="height: 180px; position: relative; margin-bottom: 1rem;">
                            <canvas id="telemetry-origin-chart"></canvas>
                        </div>
                        <div id="origin-legend-container" style="display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem;"></div>
                    </div>

                    <!-- Dispositivos y SO -->
                    <div class="analytics-card">
                        <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0 0 0.3rem 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-mobile-alt" style="color: #0284c7;"></i> Dispositivos y SO
                        </h3>
                        <p style="color: #64748b; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; margin: 0 0 1rem 0;">Terminales de Conexión</p>
                        <div style="height: 180px; position: relative; margin-bottom: 1rem;">
                            <canvas id="telemetry-device-chart"></canvas>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 800; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px;">
                            <span style="color: #0284c7;"><i class="fas fa-mobile-alt"></i> Móvil: <span id="kpi-telemetry-mobile">0%</span></span>
                            <span style="color: #6366f1;"><i class="fas fa-desktop"></i> PC: <span id="kpi-telemetry-desktop">0%</span></span>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 6: AUDITORÍA CRM Y TABLA DE ACCESOS EN VIVO -->
                <div class="analytics-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-address-book" style="color: #10b981;"></i> ¿Quiénes entran? (Auditoría de Accesos en Vivo)
                            </h2>
                            <p id="telemetry-filtered-count" style="color: #64748b; font-size: 0.82rem; font-weight: 600; margin: 4px 0 0 0;">
                                Mostrando ${insights.recentLogs.length} accesos recientes
                            </p>
                        </div>

                        <!-- BOTÓN EXPORTAR CSV -->
                        <button onclick="window.AdminViews.exportTelemetryCSV()" class="btn-export-excel">
                            <i class="fas fa-file-excel"></i> DESCARGAR EXCEL / CSV COMPLETO
                        </button>
                    </div>

                    <!-- BARRA DE FILTROS AVANZADOS MULTI-CRITERIO -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 14px; margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end;">
                        <!-- Buscador por Texto -->
                        <div class="filter-bar-group" style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fas fa-search"></i> Buscar Nombre / Teléfono / Ciudad
                            </label>
                            <div style="position: relative;">
                                <input type="text" id="telemetry-search-input" class="analytics-input" oninput="window.AdminViews.applyAllTelemetryFilters()" placeholder="Ej: Alex, 649..., Barcelona" style="width: 100%; padding-left: 32px !important;">
                                <i class="fas fa-search" style="position: absolute; left: 10px; top: 12px; color: #94a3b8; font-size: 0.8rem;"></i>
                            </div>
                        </div>

                        <!-- Filtro Temporal -->
                        <div class="filter-bar-group" style="display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="far fa-calendar-alt"></i> Periodo
                            </label>
                            <select id="telemetry-filter-type" class="analytics-select" onchange="window.AdminViews.onTelemetryFilterTypeChange(this.value)" style="min-width: 160px;">
                                <option value="todos">Todo el Historial</option>
                                <option value="hoy">Hoy</option>
                                <option value="ayer">Ayer</option>
                                <option value="semana">Últimos 7 Días</option>
                                <option value="mes">Este Mes</option>
                                <option value="mes_anterior">Mes Anterior</option>
                                <option value="dia_especifico">Día Específico 📅</option>
                                <option value="mes_especifico">Mes Específico 🗓️</option>
                                <option value="rango_personalizado">Rango Personalizado ⛓️</option>
                            </select>
                        </div>

                        <!-- Filtro por Rol (incluye player_americanas) -->
                        <div class="filter-bar-group" style="display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fas fa-user-shield"></i> Rol de Usuario
                            </label>
                            <select id="telemetry-role-filter" class="analytics-select" onchange="window.AdminViews.applyAllTelemetryFilters()" style="min-width: 160px;">
                                <option value="all">Todos los Roles</option>
                                <option value="player_americanas">🏆 Jugador Americanas</option>
                                <option value="player">🎾 Jugador Club</option>
                                <option value="premium_player">⭐ Premium</option>
                                <option value="admin">👑 Administrador</option>
                                <option value="guest">👤 Invitado</option>
                            </select>
                        </div>

                        <!-- Filtro Tipo Usuario -->
                        <div class="filter-bar-group" style="display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fas fa-user-tag"></i> Registro
                            </label>
                            <select id="telemetry-user-type-filter" class="analytics-select" onchange="window.AdminViews.applyAllTelemetryFilters()" style="min-width: 140px;">
                                <option value="all">Todos</option>
                                <option value="registered">Solo Registrados</option>
                                <option value="guest">Solo Invitados</option>
                            </select>
                        </div>

                        <!-- Filtro Canal de Origen -->
                        <div class="filter-bar-group" style="display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fas fa-satellite-dish"></i> Canal Origen
                            </label>
                            <select id="telemetry-origin-filter" class="analytics-select" onchange="window.AdminViews.applyAllTelemetryFilters()" style="min-width: 140px;">
                                <option value="all">Todos los Canales</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="instagram">Instagram</option>
                                <option value="pwa">PWA Instalada</option>
                                <option value="directo">Directo / Web</option>
                                <option value="google">Google</option>
                            </select>
                        </div>

                        <!-- Contenedor Día Específico -->
                        <div id="telemetry-container-dia" style="display: none; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Día</label>
                            <input type="date" id="telemetry-input-dia" class="analytics-input" onchange="window.AdminViews.applyAllTelemetryFilters()">
                        </div>

                        <!-- Contenedor Mes Específico -->
                        <div id="telemetry-container-mes" style="display: none; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Mes</label>
                            <select id="telemetry-input-mes" class="analytics-select" onchange="window.AdminViews.applyAllTelemetryFilters()">
                                ${getMonthOptionsHtml()}
                            </select>
                        </div>

                        <!-- Contenedor Rango -->
                        <div id="telemetry-container-rango" style="display: none; align-items: center; gap: 8px;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Desde</label>
                                <input type="date" id="telemetry-input-desde" class="analytics-input" onchange="window.AdminViews.applyAllTelemetryFilters()">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.68rem; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Hasta</label>
                                <input type="date" id="telemetry-input-hasta" class="analytics-input" onchange="window.AdminViews.applyAllTelemetryFilters()">
                            </div>
                        </div>
                    </div>

                    <!-- TABLA CRM ENRIQUECIDA -->
                    <div class="telemetry-table-wrapper">
                        <table class="telemetry-table">
                            <thead>
                                <tr>
                                    <th>Jugador / Visitante</th>
                                    <th>Teléfono (WhatsApp Directo)</th>
                                    <th>Hora y Fecha</th>
                                    <th>Ubicación Detectada</th>
                                    <th>Procedencia / Canal</th>
                                    <th style="text-align: right;">Terminal / SO</th>
                                </tr>
                            </thead>
                            <tbody id="telemetry-table-body">
                                <!-- Inserción reactiva vía applyAllTelemetryFilters -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- SECCIÓN 7: TOP RENDIMIENTO DEPORTIVO (VICTORIA %) -->
                <div class="analytics-card">
                    <h3 style="font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0 0 1.25rem 0; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-award" style="color: #f59e0b;"></i> TOP RENDIMIENTO COMPETITIVO (VICTORIA %)
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
                        ${insights.topPerformers.map((p, i) => `
                            <div style="display: flex; align-items: center; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 12px;">
                                <div style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 950; color: ${i === 0 ? '#d97706' : '#0284c7'}; width: 28px;">
                                    #${i + 1}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 800; color: #0f172a; font-size: 0.95rem;">${p.name}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Nivel ${parseFloat(p.level).toFixed(2)}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 950; color: #059669;">${p.winRate}%</div>
                                    <div style="font-size: 0.68rem; color: #64748b; font-weight: 700;">${p.pj} PARTIDOS</div>
                                </div>
                            </div>
                        `).join('') || '<div style="color: #64748b;">Sin partidos registrados en los últimos 30 días.</div>'}
                    </div>
                </div>
            </div>
        `;

        // Aplicar filtros iniciales y poblar tabla
        window.AdminViews.applyAllTelemetryFilters();
    }

    /**
     * RENDERIZACIÓN DE GRÁFICOS INTERACTIVOS (CHART.JS)
     */

    /**
     * Gráfico 1: Evolución Diaria (Visitas Totales vs Personas Únicas)
     */
    function renderSessionsTrendChart(logs, daysRange = 14) {
        const canvas = document.getElementById('sessions-trend-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (sessionsTrendChartInstance) {
            sessionsTrendChartInstance.destroy();
            sessionsTrendChartInstance = null;
        }

        const now = new Date();
        const dateMap = {}; // key: YYYY-MM-DD -> { total: 0, users: Set() }

        // Inicializar los N días con 0
        for (let i = daysRange - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dateMap[key] = { total: 0, users: new Set(), dateObj: d };
        }

        logs.forEach(log => {
            const key = log.dateObj.toISOString().split('T')[0];
            if (dateMap[key]) {
                dateMap[key].total++;
                dateMap[key].users.add(log.userId || log.cleanPhone || log.userName);
            }
        });

        const labels = [];
        const totalVisitsData = [];
        const uniquePeopleData = [];

        Object.keys(dateMap).sort().forEach(key => {
            const item = dateMap[key];
            labels.push(item.dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
            totalVisitsData.push(item.total);
            uniquePeopleData.push(item.users.size);
        });

        if (typeof Chart === 'undefined') return;

        sessionsTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Visitas Totales',
                        data: totalVisitsData,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#0284c7',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Personas Únicas',
                        data: uniquePeopleData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        borderWidth: 2.5,
                        borderDash: [4, 4],
                        fill: false,
                        tension: 0.35,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 11, weight: '600' }, stepSize: 1 },
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10, weight: '600' } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 12, font: { family: "'Inter', sans-serif", size: 11, weight: '700' }, color: '#334155' }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        cornerRadius: 8,
                        padding: 10
                    }
                }
            }
        });
    }

    /**
     * Gráfico 2: Afluencia por Día de la Semana (Lunes a Domingo)
     */
    function renderDayOfWeekChart(insights) {
        const canvas = document.getElementById('day-of-week-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (dayOfWeekChartInstance) {
            dayOfWeekChartInstance.destroy();
            dayOfWeekChartInstance = null;
        }

        // Orden de semana: Lunes a Domingo
        // raw distribution: 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
        const rawDist = insights.dayOfWeekDistribution || new Array(7).fill(0);
        const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const values = [rawDist[1], rawDist[2], rawDist[3], rawDist[4], rawDist[5], rawDist[6], rawDist[0]];

        const maxVal = Math.max(...values);

        if (typeof Chart === 'undefined') return;

        dayOfWeekChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accesos acumulados',
                    data: values,
                    backgroundColor: values.map(v => (v === maxVal && v > 0) ? '#10b981' : '#bae6fd'),
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 }, stepSize: 1 },
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        ticks: { color: '#475569', font: { family: "'Inter', sans-serif", size: 11, weight: '700' } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#10b981',
                        bodyColor: '#ffffff',
                        cornerRadius: 8
                    }
                }
            }
        });
    }

    /**
     * Gráfico 3: Horas Pico Acumuladas (00:00 - 23:00)
     */
    function renderHourlyPeakChart(insights) {
        const canvas = document.getElementById('hourly-peak-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (hourlyPeakChartInstance) {
            hourlyPeakChartInstance.destroy();
            hourlyPeakChartInstance = null;
        }

        const hourlyData = insights.hourlyDistribution || new Array(24).fill(0);
        const labels = Array.from({ length: 24 }, (_, i) => `${i}h`);

        if (typeof Chart === 'undefined') return;

        const maxVal = Math.max(...hourlyData);

        hourlyPeakChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accesos por hora',
                    data: hourlyData,
                    backgroundColor: hourlyData.map(v => (v === maxVal && v > 0) ? '#f59e0b' : '#38bdf8'),
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 }, stepSize: 1 },
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 9, weight: '600' } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#f59e0b',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            title: context => `Franja horaria: ${context[0].label} - ${parseInt(context[0].label) + 1}h`
                        }
                    }
                }
            }
        });
    }

    /**
     * Gráfico 4: Distribución de Roles de la Comunidad (Doughnut)
     */
    function renderRoleDistChart(insights) {
        const canvas = document.getElementById('role-dist-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (roleDistChartInstance) {
            roleDistChartInstance.destroy();
            roleDistChartInstance = null;
        }

        const roles = {
            'Jugadores Club': insights.roleCounts.player || 0,
            'Jugador Americanas 🏆': insights.roleCounts.player_americanas || 0,
            'Premium ⭐': insights.roleCounts.premium_player || 0,
            'Administradores 👑': insights.roleCounts.admin || 0
        };

        const total = Object.values(roles).reduce((a, b) => a + b, 0);
        const legendContainer = document.getElementById('role-legend-container');
        if (legendContainer) {
            const colors = ['#0284c7', '#eab308', '#ec4899', '#f59e0b'];
            legendContainer.innerHTML = Object.entries(roles).map(([k, v], idx) => {
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[idx]};"></span> ${k}:
                        </span>
                        <span style="color: #0f172a; font-weight: 800;">${v} (${pct}%)</span>
                    </div>
                `;
            }).join('');
        }

        if (total === 0 || typeof Chart === 'undefined') return;

        roleDistChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(roles),
                datasets: [{
                    data: Object.values(roles),
                    backgroundColor: ['#0284c7', '#eab308', '#ec4899', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        cornerRadius: 8,
                        padding: 10
                    }
                }
            }
        });
    }

    /**
     * Gráfico 5: Dispositivos y Sistemas Operativos
     */
    function renderTelemetryDeviceChart(filtered) {
        const canvas = document.getElementById('telemetry-device-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (telemetryDeviceChartInstance) {
            telemetryDeviceChartInstance.destroy();
            telemetryDeviceChartInstance = null;
        }

        const mobileCount = filtered.filter(log => log.device === 'Mobile').length;
        const desktopCount = filtered.filter(log => log.device !== 'Mobile').length;
        const total = mobileCount + desktopCount;

        const mobilePct = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
        const desktopPct = total > 0 ? Math.round((desktopCount / total) * 100) : 0;

        const mobileEl = document.getElementById('kpi-telemetry-mobile');
        const desktopEl = document.getElementById('kpi-telemetry-desktop');
        if (mobileEl) mobileEl.innerText = `${mobilePct}% (${mobileCount})`;
        if (desktopEl) desktopEl.innerText = `${desktopPct}% (${desktopCount})`;

        if (total === 0 || typeof Chart === 'undefined') return;

        telemetryDeviceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['📱 Móvil', '💻 PC / Mac'],
                datasets: [{
                    data: [mobileCount, desktopCount],
                    backgroundColor: ['#0284c7', '#6366f1'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#0284c7',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        padding: 10
                    }
                }
            }
        });
    }

    /**
     * Gráfico 6: Canales de Origen (WhatsApp, Instagram, etc.)
     */
    function renderTelemetryOriginChart(filtered) {
        const canvas = document.getElementById('telemetry-origin-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (telemetryOriginChartInstance) {
            telemetryOriginChartInstance.destroy();
            telemetryOriginChartInstance = null;
        }

        const origins = {
            'WhatsApp': 0,
            'Instagram': 0,
            'PWA': 0,
            'Directo': 0,
            'Otros': 0
        };

        filtered.forEach(log => {
            const o = (log.origin || '').toLowerCase();
            if (o.includes('whatsapp')) origins['WhatsApp']++;
            else if (o.includes('instagram')) origins['Instagram']++;
            else if (o.includes('pwa')) origins['PWA']++;
            else if (o.includes('directo')) origins['Directo']++;
            else origins['Otros']++;
        });

        const total = filtered.length;
        const legendContainer = document.getElementById('origin-legend-container');
        if (legendContainer) {
            const colors = {
                'WhatsApp': '#10b981',
                'Instagram': '#ec4899',
                'PWA': '#6366f1',
                'Directo': '#0284c7',
                'Otros': '#94a3b8'
            };
            legendContainer.innerHTML = Object.entries(origins).map(([k, v]) => {
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 9px; height: 9px; border-radius: 50%; background: ${colors[k]};"></span> ${k}:
                        </span>
                        <span style="color: #0f172a; font-weight: 800;">${v} (${pct}%)</span>
                    </div>
                `;
            }).join('');
        }

        if (total === 0 || typeof Chart === 'undefined') return;

        telemetryOriginChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(origins),
                datasets: [{
                    data: Object.values(origins),
                    backgroundColor: ['#10b981', '#ec4899', '#6366f1', '#0284c7', '#94a3b8'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        padding: 10
                    }
                }
            }
        });
    }

    /**
     * Inicialización de gráficos globales
     */
    function renderAnalyticsCharts(insights) {
        renderSessionsTrendChart(insights.allLogs, window._trendRangeDays || 14);
        renderDayOfWeekChart(insights);
        renderHourlyPeakChart(insights);
        renderRoleDistChart(insights);
        renderTelemetryDeviceChart(insights.allLogs);
        renderTelemetryOriginChart(insights.allLogs);
    }

})();
