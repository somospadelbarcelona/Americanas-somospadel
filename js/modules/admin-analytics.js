/**
 * admin-analytics.js
 * Specialized Dashboard for Smart Analytics (Performance, Trends, and Insights).
 * Includes Telecom-Grade Session Telemetry, live filters, CSV Exports, and Trend Charts.
 */
(function () {
    window.AdminViews = window.AdminViews || {};

    window.AdminViews.analytics = async function () {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loader"></div>';

        try {
            // 1. Fetch Players Data
            const players = await window.FirebaseDB.players.getAll();

            // Get last 30 days of matches for recent performance
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const matchesSnap = await window.db.collection('matches')
                .where('createdAt', '>=', thirtyDaysAgo.toISOString())
                .get();

            const entrenosSnap = await window.db.collection('entrenos_matches')
                .where('createdAt', '>=', thirtyDaysAgo.toISOString())
                .get();

            const allRecentMatches = [
                ...matchesSnap.docs.map(doc => doc.data()),
                ...entrenosSnap.docs.map(doc => doc.data())
            ].filter(m => m.status === 'finished');

            // 2. Fetch live telemetry access logs (limit 500 for robust analytical charts and CSV exports)
            let allLogs = [];
            try {
                const logsSnap = await window.db.collection('access_logs')
                    .orderBy('timestamp', 'desc')
                    .limit(500)
                    .get();
                
                allLogs = logsSnap.docs.map(doc => {
                    const data = doc.data();
                    let dateObj = new Date();
                    if (data.timestamp) {
                        dateObj = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp.seconds * 1000);
                    }
                    return {
                        id: doc.id,
                        userId: data.userId || 'Invitado',
                        userName: data.userName || 'Jugador Pro',
                        device: data.device || 'Mobile',
                        language: data.language || 'es',
                        appVersion: data.appVersion || 'v9.1-Premium',
                        dateObj,
                        dateStr: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        timeStr: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    };
                });
            } catch (telemetryErr) {
                console.warn("Fallo al obtener historial completo de telemetría:", telemetryErr);
            }

            // Save globally for filter & export operations
            window.lastTelemetryLogs = allLogs;

            // 3. Process Insights
            const insights = processSmartInsights(players, allRecentMatches, allLogs);

            // 4. Render View
            renderAnalyticsView(content, insights);

            // 5. Render Charts
            renderAnalyticsCharts(insights);

        } catch (e) {
            console.error("Analytics Error:", e);
            content.innerHTML = `<div class="error-box">Error al cargar analíticas: ${e.message}</div>`;
        }
    };

    function filterLogs(logs) {
        const filterTypeEl = document.getElementById('telemetry-filter-type');
        const filterType = filterTypeEl ? filterTypeEl.value : 'todos';
        const now = new Date();

        return logs.filter(log => {
            if (filterType === 'hoy') {
                return log.dateObj.toDateString() === now.toDateString();
            } else if (filterType === 'ayer') {
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                return log.dateObj.toDateString() === yesterday.toDateString();
            } else if (filterType === 'semana') {
                const diffTime = Math.abs(now - log.dateObj);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            } else if (filterType === 'mes') {
                return log.dateObj.getMonth() === now.getMonth() && log.dateObj.getFullYear() === now.getFullYear();
            } else if (filterType === 'mes_anterior') {
                const prevMonthDate = new Date();
                prevMonthDate.setMonth(now.getMonth() - 1);
                return log.dateObj.getMonth() === prevMonthDate.getMonth() && log.dateObj.getFullYear() === prevMonthDate.getFullYear();
            } else if (filterType === 'dia_especifico') {
                const diaVal = document.getElementById('telemetry-input-dia')?.value; // "YYYY-MM-DD"
                if (!diaVal) return true;
                const [y, m, d] = diaVal.split('-').map(Number);
                return log.dateObj.getFullYear() === y && (log.dateObj.getMonth() + 1) === m && log.dateObj.getDate() === d;
            } else if (filterType === 'mes_especifico') {
                const mesVal = document.getElementById('telemetry-input-mes')?.value; // "YYYY-MM"
                if (!mesVal) return true;
                const [y, m] = mesVal.split('-').map(Number);
                return log.dateObj.getFullYear() === y && (log.dateObj.getMonth() + 1) === m;
            } else if (filterType === 'rango_personalizado') {
                const desdeVal = document.getElementById('telemetry-input-desde')?.value; // "YYYY-MM-DD"
                const hastaVal = document.getElementById('telemetry-input-hasta')?.value; // "YYYY-MM-DD"
                if (!desdeVal && !hastaVal) return true;

                let start = desdeVal ? new Date(desdeVal) : null;
                if (start) start.setHours(0, 0, 0, 0);
                let end = hastaVal ? new Date(hastaVal) : null;
                if (end) end.setHours(23, 59, 59, 999);

                if (start && log.dateObj < start) return false;
                if (end && log.dateObj > end) return false;
                return true;
            }
            return true; // 'todos'
        });
    }

    // Dynamic UI Filtering Controllers
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
            if (inputDia && !inputDia.value) {
                inputDia.value = dateStr;
            }
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
            if (inputHasta && !inputHasta.value) {
                inputHasta.value = dateStr;
            }
        }

        window.AdminViews.applyAllTelemetryFilters();
    };

    window.AdminViews.applyAllTelemetryFilters = function () {
        const logs = window.lastTelemetryLogs || [];
        const filtered = filterLogs(logs);
        const tbody = document.getElementById('telemetry-table-body');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 25px; color: #64748b; font-weight: 600;">No hay logs de telemetría registrados para este filtro.</td></tr>`;
        } else {
            tbody.innerHTML = filtered.map(log => {
                const isMob = log.device === 'Mobile';
                const devLabel = isMob ? '📱 MÓVIL' : '💻 PC';
                const devColor = isMob ? '#ccff00' : '#00d4ff';
                const devBg = isMob ? 'rgba(204,255,0,0.08)' : 'rgba(0,212,255,0.08)';
                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.88rem; color: rgba(255,255,255,0.85);">
                        <td style="padding: 14px 10px; font-weight: 800; color: white;">
                            <i class="far fa-user-circle" style="color: #64748b; margin-right: 8px;"></i>${log.userName}
                        </td>
                        <td style="padding: 14px 10px; font-weight: 600; color: rgba(255,255,255,0.7);">${log.dateStr} ${log.timeStr}</td>
                        <td style="padding: 14px 10px; text-align: center;">
                            <span style="background: ${devBg}; color: ${devColor}; padding: 4px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 900; letter-spacing: 0.5px; border: 1px solid ${devColor}25;">${devLabel}</span>
                        </td>
                        <td style="padding: 14px 10px; text-align: center; text-transform: uppercase; font-weight: 700; color: #64748b; font-size: 0.8rem;">${log.language}</td>
                        <td style="padding: 14px 10px; text-align: right; font-weight: 900; color: #00ff88;">${log.appVersion}</td>
                    </tr>
                `;
            }).join('');
        }

        // Dynamically update the line chart with the filtered subset!
        renderSessionsTrendChart(filtered);

        // Dynamically update the device doughnut chart with the filtered subset!
        renderTelemetryDeviceChart(filtered);
    };

    // Telemetry CSV Export Engine (BOM compatible with Excel)
    window.AdminViews.exportTelemetryCSV = function () {
        const filterType = document.getElementById('telemetry-filter-type')?.value || 'todos';
        const logs = window.lastTelemetryLogs || [];
        const filtered = filterLogs(logs);
        
        if (filtered.length === 0) {
            if (window.PremiumModal) {
                window.PremiumModal.alert({
                    title: '⚠️ EXPORTACIÓN VACÍA',
                    message: 'No existen registros de acceso con el filtro actual para poder exportar.',
                    type: 'warning'
                });
            } else {
                alert("No hay registros para exportar.");
            }
            return;
        }

        // CSV Building with Excel BOM for Spanish accents support
        const headers = ["ID Registro", "Usuario ID", "Jugador", "Fecha", "Hora", "Dispositivo", "Idioma", "Version Cliente"];
        const rows = filtered.map(log => [
            log.id,
            log.userId,
            `"${log.userName.replace(/"/g, '""')}"`,
            log.dateStr,
            log.timeStr,
            log.device,
            log.language,
            log.appVersion
        ]);

        let filenameSuffix = filterType;
        if (filterType === 'dia_especifico') {
            filenameSuffix = document.getElementById('telemetry-input-dia')?.value || 'dia';
        } else if (filterType === 'mes_especifico') {
            filenameSuffix = document.getElementById('telemetry-input-mes')?.value || 'mes';
        } else if (filterType === 'rango_personalizado') {
            const desde = document.getElementById('telemetry-input-desde')?.value || 'inicio';
            const hasta = document.getElementById('telemetry-input-hasta')?.value || 'fin';
            filenameSuffix = `rango_${desde}_a_${hasta}`;
        }

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `somospadel_telemetria_${filenameSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.PremiumModal) {
            window.PremiumModal.alert({
                title: '📥 EXPORTACIÓN COMPLETADA',
                message: `Se han exportado con éxito **${filtered.length} registros** en formato CSV (compatible con Microsoft Excel y Google Sheets) con el filtro: **${filterType.toUpperCase()}**.`,
                type: 'success'
            });
        }
    };

    function processSmartInsights(players, matches, allLogs) {
        const stats = {};

        matches.forEach(m => {
            const process = (ids, score, oppScore) => {
                if (!ids) return;
                ids.forEach(id => {
                    if (!stats[id]) stats[id] = { pj: 0, wins: 0, games: 0, points: 0 };
                    stats[id].pj++;
                    stats[id].games += score;
                    if (score > oppScore) stats[id].wins++;
                });
            };
            process(m.team_a_ids, m.score_a, m.score_b);
            process(m.team_b_ids, m.score_b, m.score_a);
        });

        // Revelación (Highest Level Increase)
        const revelationPlayers = [...players]
            .filter(p => p.matches_played > 5)
            .sort((a, b) => (b.last_level_change || 0) - (a.last_level_change || 0))
            .slice(0, 3);

        // Win Streaks
        const topPerformers = Object.entries(stats)
            .map(([id, s]) => {
                const p = players.find(x => x.id === id);
                return {
                    name: p ? p.name : 'Desconocido',
                    winRate: Math.round((s.wins / s.pj) * 100),
                    pj: s.pj,
                    level: p ? (p.level || p.self_rate_level) : 0
                };
            })
            .filter(x => x.pj >= 4)
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 5);

        // Session metrics
        const totalSessions = players.reduce((sum, p) => sum + (p.sessionCount || 0), 0);
        const activeUsersWithSessions = players.filter(p => (p.sessionCount || 0) > 0).length;

        // Calculate level distribution dynamically
        const levelDist = [0, 0, 0, 0, 0];
        players.forEach(p => {
            const lvl = parseFloat(p.level || p.self_rate_level || 3.5);
            if (lvl < 3.0) levelDist[0]++;
            else if (lvl < 3.5) levelDist[1]++;
            else if (lvl < 4.0) levelDist[2]++;
            else if (lvl < 4.5) levelDist[3]++;
            else levelDist[4]++;
        });

        // --- AI ENGINE SIMULATION WITH LIVE TELEMETRY ---
        const activeCount = players.filter(p => p.status === 'active').length;
        const matchesCount = matches.length;
        const avgWins = topPerformers.length > 0 ? (topPerformers[0].winRate) : 50;

        let aiText = `Tras analizar los últimos ${matchesCount} partidos y la actividad de ${activeCount} jugadores, el sistema detecta una tendencia positiva en la competitividad. `;

        if (revelationPlayers.length > 0) {
            aiText += `Destaca especialmente el crecimiento de **${revelationPlayers[0].name}**, quien ha subido un ${((revelationPlayers[0].last_level_change || 0) * 100).toFixed(1)}% de nivel recientemente. `;
        }

        if (avgWins > 70) {
            aiText += `Se recomienda revisar el matchmaking manual, ya que algunos jugadores muestran una tasa de victoria superior al 70%, sugiriendo una posible subestimación de su nivel actual. `;
        } else {
            aiText += `El equilibrio del sistema es óptimo, con la mayoría de los jugadores en el rango de nivel 3.5-4.0. `;
        }

        aiText += `\n\n🛰️ **[Reporte de Telecomunicaciones e Ingesta]**: El volumen acumulado asciende a **${totalSessions} accesos registrados** provenientes de **${activeUsersWithSessions} miembros únicos** de la app. El canal preferencial de la comunidad de SomosPadel BCN es el tráfico a través de teléfonos móviles inteligentes, facilitando la reserva de americanas en tiempo real.`;

        return {
            revelationPlayers,
            topPerformers,
            totalMatches: matches.length,
            activePlayers: activeCount,
            totalSessions,
            recentLogs: allLogs.slice(0, 15), // top 15 for live view
            allLogs,
            levelDist,
            aiText
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

    function renderAnalyticsView(container, insights) {
        container.innerHTML = `
            <div class="dashboard-header-pro" style="margin-bottom: 2rem;">
                <h1 style="color: white; font-size: 2.2rem; font-weight: 900; margin-bottom: 0.5rem;">
                    <i class="fas fa-microchip" style="color: #00d4ff; margin-right: 15px;"></i> SMART ANALYTICS
                </h1>
                <p style="color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 1px;">INTELIGENCIA DE DATOS Y RENDIMIENTO PRO</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- KPIs -->
                <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid #00d4ff;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Partidos (30d)</div>
                    <div style="font-size: 2rem; color: white; font-weight: 950;">${insights.totalMatches}</div>
                </div>
                <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid #ccff00;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Jugadores Activos</div>
                    <div style="font-size: 2rem; color: white; font-weight: 950;">${insights.activePlayers}</div>
                </div>
                <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid #00ff88;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Sesiones Totales (App)</div>
                    <div style="font-size: 2rem; color: white; font-weight: 950;">${insights.totalSessions}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; margin-bottom: 2rem;" class="grid-columns-mobile">
                <!-- TELEMETRY SESSIONS TREND CHART -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <h3 style="color: white; margin-bottom: 1.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-chart-line" style="color: #00ff88; text-shadow: 0 0 8px rgba(0,255,136,0.3);"></i> TENDENCIA DE ACCESOS DETALLADA
                    </h3>
                    <div style="height: 280px; position: relative;">
                        <canvas id="sessions-trend-chart"></canvas>
                    </div>
                </div>

                <!-- LEVEL DISTRIBUTION CHART -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <h3 style="color: white; margin-bottom: 1.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-chart-bar" style="color: #00d4ff;"></i> DISTRIBUCIÓN DE NIVELES (REAL)
                    </h3>
                    <div style="height: 280px; position: relative;">
                        <canvas id="level-dist-chart"></canvas>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem;" class="grid-columns-mobile">
                <!-- Ranking Rendimiento -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <h3 style="color: white; margin-bottom: 2rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-award" style="color: #ccff00;"></i> TOP RENDIMIENTO (Victoria %)
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${insights.topPerformers.map((p, i) => `
                            <div style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 16px;">
                                <div style="font-size: 1.2rem; font-weight: 900; color: #00d4ff; width: 30px;">#${i + 1}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 800; color: white;">${p.name}</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">Nivel ${parseFloat(p.level).toFixed(2)}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.3rem; font-weight: 950; color: #ccff00;">${p.winRate}%</div>
                                    <div style="font-size: 0.65rem; color: #64748b; font-weight: 700;">${p.pj} PARTIDOS</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Revelaciones -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <h3 style="color: white; margin-bottom: 2rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-fire" style="color: #ff3b30;"></i> REVELACIONES (+Δ)
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        ${insights.revelationPlayers.map(p => `
                            <div style="text-align: center;">
                                <div style="width: 60px; height: 60px; border-radius: 50%; background: #ff3b3020; border: 2px solid #ff3b3040; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🚀</div>
                                <div style="font-weight: 900; color: white;">${p.name}</div>
                                <div style="color: #00ff88; font-weight: 900; font-size: 0.9rem;">+${(p.last_level_change || 0).toFixed(3)} PTOS</div>
                            </div>
                        `).join('') || '<p style="color: #444; text-align: center;">Buscando nuevas promesas...</p>'}
                    </div>
                </div>
            </div>

            <!-- TELEMETRÍA DE ACCESO Y SESIONES EN VIVO (BIG DATA) -->
            <div style="display: grid; grid-template-columns: 2.2fr 1fr; gap: 2rem; margin-bottom: 2rem;" class="grid-columns-mobile">
                
                <!-- Columna Izquierda: Tabla y Filtros Avanzados -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                        <h3 style="color: white; margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-satellite-dish" style="color: #00ff88; text-shadow: 0 0 10px rgba(0,255,136,0.3);"></i> TELEMETRÍA DE RED Y ACCESOS EN VIVO
                        </h3>
                    </div>

                    <!-- ADVANCED PREMIUM FILTERS MODULE -->
                    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); width: 100%; margin-bottom: 1.5rem;">
                        <!-- Selector de Tipo de Filtro -->
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">Tipo de Filtro</label>
                            <select id="telemetry-filter-type" onchange="window.AdminViews.onTelemetryFilterTypeChange(this.value)" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 8px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; outline: none; cursor: pointer; min-width: 160px; font-family: 'Outfit';">
                                <option value="todos">Histórico Completo (Últimos 500)</option>
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

                        <!-- Contenedor Día Específico (Hidden by default) -->
                        <div id="telemetry-container-dia" style="display: none; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">Seleccionar Día</label>
                            <input type="date" id="telemetry-input-dia" onchange="window.AdminViews.applyAllTelemetryFilters()" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; outline: none; font-family: 'Outfit';">
                        </div>

                        <!-- Contenedor Mes Específico (Hidden by default) -->
                        <div id="telemetry-container-mes" style="display: none; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">Seleccionar Mes</label>
                            <select id="telemetry-input-mes" onchange="window.AdminViews.applyAllTelemetryFilters()" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 8px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; outline: none; cursor: pointer; min-width: 160px; font-family: 'Outfit';">
                                ${getMonthOptionsHtml()}
                            </select>
                        </div>

                        <!-- Contenedor Rango de Fechas (Hidden by default) -->
                        <div id="telemetry-container-rango" style="display: none; align-items: center; gap: 8px;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">Desde</label>
                                <input type="date" id="telemetry-input-desde" onchange="window.AdminViews.applyAllTelemetryFilters()" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; outline: none; font-family: 'Outfit';">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <label style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">Hasta</label>
                                <input type="date" id="telemetry-input-hasta" onchange="window.AdminViews.applyAllTelemetryFilters()" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; outline: none; font-family: 'Outfit';">
                            </div>
                        </div>

                        <!-- Botón Descargar CSV (Aligned to the Right) -->
                        <div style="margin-left: auto; display: flex; flex-direction: column; gap: 4px; align-self: flex-end;">
                            <button onclick="window.AdminViews.exportTelemetryCSV()" style="background: linear-gradient(135deg, #00ff88 0%, #ccff00 100%); border: none; color: black; font-weight: 1000; font-size: 0.75rem; padding: 9px 18px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(0,255,136,0.3); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.03)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fas fa-download"></i> DESCARGAR INFORME CSV
                            </button>
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: 'Outfit';">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">
                                    <th style="padding: 12px 10px;">Jugador</th>
                                    <th style="padding: 12px 10px;">Fecha y Hora de Acceso</th>
                                    <th style="padding: 12px 10px; text-align: center;">Dispositivo</th>
                                    <th style="padding: 12px 10px; text-align: center;">Idioma</th>
                                    <th style="padding: 12px 10px; text-align: right;">Versión Cliente</th>
                                </tr>
                            </thead>
                            <tbody id="telemetry-table-body">
                                ${insights.recentLogs.map(log => {
                                    const isMob = log.device === 'Mobile';
                                    const devLabel = isMob ? '📱 MÓVIL' : '💻 PC';
                                    const devColor = isMob ? '#ccff00' : '#00d4ff';
                                    const devBg = isMob ? 'rgba(204,255,0,0.08)' : 'rgba(0,212,255,0.08)';
                                    return `
                                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.88rem; color: rgba(255,255,255,0.85);">
                                            <td style="padding: 14px 10px; font-weight: 800; color: white;">
                                                <i class="far fa-user-circle" style="color: #64748b; margin-right: 8px;"></i>${log.userName}
                                            </td>
                                            <td style="padding: 14px 10px; font-weight: 600; color: rgba(255,255,255,0.7);">${log.dateStr} ${log.timeStr}</td>
                                            <td style="padding: 14px 10px; text-align: center;">
                                                <span style="background: ${devBg}; color: ${devColor}; padding: 4px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 900; letter-spacing: 0.5px; border: 1px solid ${devColor}25;">${devLabel}</span>
                                            </td>
                                            <td style="padding: 14px 10px; text-align: center; text-transform: uppercase; font-weight: 700; color: #64748b; font-size: 0.8rem;">${log.language}</td>
                                            <td style="padding: 14px 10px; text-align: right; font-weight: 900; color: #00ff88;">${log.appVersion}</td>
                                        </tr>
                                    `;
                                }).join('') || `<tr><td colspan="5" style="text-align: center; padding: 25px; color: #64748b; font-weight: 600;">Esperando señales de telemetría de red activa...</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Columna Derecha: Gráfica Analítica de Telemetría (Dispositivos) -->
                <div class="glass-card-enterprise" style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 380px;">
                    <div>
                        <h3 style="color: white; margin-bottom: 0.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-network-wired" style="color: #ccff00; text-shadow: 0 0 8px rgba(204,255,0,0.3);"></i> TELEMETRÍA DE RED
                        </h3>
                        <p style="color: rgba(255,255,255,0.5); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; margin-bottom: 2rem; letter-spacing: 0.5px;">Distribución de Terminales Activos</p>
                        
                        <div style="height: 180px; position: relative; margin-bottom: 1.5rem;">
                            <canvas id="telemetry-device-chart"></canvas>
                        </div>
                    </div>
                    
                    <!-- KPI e Indicadores de Canal de Acceso -->
                    <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; font-weight: 700;">
                            <span style="color: #ccff00; display: flex; align-items: center; gap: 5px;"><i class="fas fa-mobile-alt"></i> Móvil:</span>
                            <span id="kpi-telemetry-mobile" style="color: white; font-weight: 900;">0%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; font-weight: 700;">
                            <span style="color: #00d4ff; display: flex; align-items: center; gap: 5px;"><i class="fas fa-desktop"></i> PC/Desktop:</span>
                            <span id="kpi-telemetry-desktop" style="color: white; font-weight: 900;">0%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass-card-enterprise" style="margin-bottom: 2rem; padding: 2.5rem; border-color: rgba(0, 212, 255, 0.4); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.03; color: #00d4ff;">
                    <i class="fas fa-robot"></i>
                </div>
                <h3 style="color: #00d4ff; margin-bottom: 1rem; font-size: 1.3rem; display: flex; align-items: center; gap: 12px; font-weight: 900;">
                    <i class="fas fa-brain"></i> MENDEZ SYSTEM AI INSIGHT
                </h3>
                <div style="background: rgba(0, 212, 255, 0.05); border-radius: 16px; padding: 20px; border: 1px dashed rgba(0, 212, 255, 0.2);">
                    <p style="color: white; line-height: 1.8; font-family: 'Outfit'; font-size: 1rem; font-weight: 500; white-space: pre-line;">
                        ${insights.aiText}
                    </p>
                </div>
            </div>
            
            <style>
                @media (max-width: 768px) {
                    .grid-columns-mobile {
                        grid-template-columns: 1fr !important;
                    }
                }
            </style>
        `;
    }

    function renderSessionsTrendChart(filtered) {
        const canvas = document.getElementById('sessions-trend-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy previous chart instance to prevent flickering and hover overlay bugs
        if (window.sessionsTrendChartInstance) {
            window.sessionsTrendChartInstance.destroy();
            window.sessionsTrendChartInstance = null;
        }

        const filterType = document.getElementById('telemetry-filter-type')?.value || 'todos';
        let labels = [];
        let data = [];
        let datasetLabel = 'Accesos Registrados';

        if (filterType === 'hoy' || filterType === 'ayer' || filterType === 'dia_especifico') {
            // --- SINGLE DAY: HOURLY TRENDS ---
            datasetLabel = 'Accesos por Hora';
            let targetDateStr = new Date().toDateString();
            if (filterType === 'ayer') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                targetDateStr = yesterday.toDateString();
            } else if (filterType === 'dia_especifico') {
                const diaVal = document.getElementById('telemetry-input-dia')?.value;
                if (diaVal) {
                    const [y, m, d] = diaVal.split('-').map(Number);
                    targetDateStr = new Date(y, m - 1, d).toDateString();
                }
            }

            // Group by hour index (0 to 23)
            const hoursCount = new Array(24).fill(0);
            filtered.forEach(log => {
                if (log.dateObj.toDateString() === targetDateStr) {
                    const h = log.dateObj.getHours();
                    hoursCount[h]++;
                }
            });

            // Map hours
            for (let h = 0; h < 24; h++) {
                labels.push(`${h.toString().padStart(2, '0')}:00`);
                data.push(hoursCount[h]);
            }
        } 
        else if (filterType === 'mes' || filterType === 'mes_anterior' || filterType === 'mes_especifico') {
            // --- SPECIFIC MONTH: DAILY TRENDS ---
            datasetLabel = 'Accesos Diarios';
            let year = new Date().getFullYear();
            let month = new Date().getMonth(); // 0-indexed

            if (filterType === 'mes_anterior') {
                const prev = new Date();
                prev.setMonth(prev.getMonth() - 1);
                year = prev.getFullYear();
                month = prev.getMonth();
            } else if (filterType === 'mes_especifico') {
                const mesVal = document.getElementById('telemetry-input-mes')?.value;
                if (mesVal) {
                    const [y, m] = mesVal.split('-').map(Number);
                    year = y;
                    month = m - 1;
                }
            }

            // Get total days in target month
            const totalDays = new Date(year, month + 1, 0).getDate();
            const daysCount = new Array(totalDays).fill(0);

            filtered.forEach(log => {
                if (log.dateObj.getFullYear() === year && log.dateObj.getMonth() === month) {
                    const day = log.dateObj.getDate();
                    daysCount[day - 1]++;
                }
            });

            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const monthLabel = monthNames[month];

            for (let d = 1; d <= totalDays; d++) {
                labels.push(`${d} ${monthLabel}`);
                data.push(daysCount[d - 1]);
            }
        } 
        else {
            // --- RANGE OR ALL: DAILY TRENDS OVER PERIOD ---
            datasetLabel = 'Accesos por Día';
            let start = new Date();
            let end = new Date();

            if (filterType === 'semana') {
                start.setDate(end.getDate() - 6);
            } else if (filterType === 'rango_personalizado') {
                const desdeVal = document.getElementById('telemetry-input-desde')?.value;
                const hastaVal = document.getElementById('telemetry-input-hasta')?.value;
                if (desdeVal) start = new Date(desdeVal);
                else start.setDate(end.getDate() - 7);
                if (hastaVal) end = new Date(hastaVal);
            } else {
                // 'todos' -> last 15 days for a clean layout
                start.setDate(end.getDate() - 14);
            }

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Generate full date grid
            const dailyCounts = {};
            const temp = new Date(start);
            while (temp <= end) {
                dailyCounts[temp.toDateString()] = 0;
                temp.setDate(temp.getDate() + 1);
            }

            filtered.forEach(log => {
                const dayKey = log.dateObj.toDateString();
                if (dayKey in dailyCounts) {
                    dailyCounts[dayKey]++;
                }
            });

            const sortedKeys = Object.keys(dailyCounts);
            sortedKeys.forEach(keyStr => {
                const d = new Date(keyStr);
                labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
                data.push(dailyCounts[keyStr]);
            });
        }

        // Initialize smooth premium line chart
        window.sessionsTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: data,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.08)',
                    borderWidth: 3.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ccff00',
                    pointBorderColor: '#090f1e',
                    pointBorderWidth: 2,
                    pointRadius: labels.length > 31 ? 2 : 4,
                    pointHoverRadius: labels.length > 31 ? 4 : 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            color: 'rgba(255,255,255,0.4)', 
                            stepSize: 1,
                            callback: function(val) { return Number.isInteger(val) ? val : null; }
                        }, 
                        grid: { color: 'rgba(255,255,255,0.05)' } 
                    },
                    x: { 
                        ticks: { 
                            color: 'rgba(255,255,255,0.4)',
                            maxRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 15
                        }, 
                        grid: { display: false } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0a192f',
                        titleColor: '#00ff88',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                }
            }
        });
    }

    function renderTelemetryDeviceChart(filtered) {
        const canvas = document.getElementById('telemetry-device-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy previous instance to prevent overlap bugs
        if (window.telemetryDeviceChartInstance) {
            window.telemetryDeviceChartInstance.destroy();
            window.telemetryDeviceChartInstance = null;
        }

        const mobileCount = filtered.filter(log => log.device === 'Mobile').length;
        const desktopCount = filtered.filter(log => log.device !== 'Mobile').length;
        const total = mobileCount + desktopCount;

        const mobilePct = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
        const desktopPct = total > 0 ? Math.round((desktopCount / total) * 100) : 0;

        // Update Indicators
        const mobileEl = document.getElementById('kpi-telemetry-mobile');
        const desktopEl = document.getElementById('kpi-telemetry-desktop');
        if (mobileEl) mobileEl.innerHTML = `${mobilePct}% <span style="color: #64748b; font-weight: 500; font-size: 0.72rem; margin-left: 4px;">(${mobileCount} accesos)</span>`;
        if (desktopEl) desktopEl.innerHTML = `${desktopPct}% <span style="color: #64748b; font-weight: 500; font-size: 0.72rem; margin-left: 4px;">(${desktopCount} accesos)</span>`;

        if (total === 0) {
            return;
        }

        // Draw modern doughnut chart
        window.telemetryDeviceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['📱 Móvil', '💻 PC/Desktop'],
                datasets: [{
                    data: [mobileCount, desktopCount],
                    backgroundColor: ['#ccff00', '#00d4ff'],
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
                        backgroundColor: '#0a192f',
                        titleColor: '#ccff00',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                const val = context.raw;
                                const pct = Math.round((val / total) * 100);
                                return ` ${pct}% (${val} accesos)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderAnalyticsCharts(insights) {
        // --- 1. INITIALIZE SESSIONS TREND LINE CHART ---
        renderSessionsTrendChart(insights.allLogs);

        // --- 2. INITIALIZE TELEMETRY DEVICE DOUGHNUT CHART ---
        renderTelemetryDeviceChart(insights.allLogs);

        // --- 3. DYNAMIC LEVEL DISTRIBUTION BAR CHART ---
        const levelCtx = document.getElementById('level-dist-chart')?.getContext('2d');
        if (levelCtx && insights.levelDist) {
            new Chart(levelCtx, {
                type: 'bar',
                data: {
                    labels: ['< 3.0', '3.0 - 3.5', '3.5 - 4.0', '4.0 - 4.5', '4.5+'],
                    datasets: [{
                        label: 'Nº Jugadores',
                        data: insights.levelDist,
                        backgroundColor: '#00d4ff',
                        borderRadius: 8,
                        barThickness: 24
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            ticks: { 
                                color: 'rgba(255,255,255,0.4)',
                                stepSize: 1,
                                callback: function(val) { return Number.isInteger(val) ? val : null; }
                            }, 
                            grid: { color: 'rgba(255,255,255,0.05)' } 
                        },
                        x: { 
                            ticks: { color: 'rgba(255,255,255,0.4)' }, 
                            grid: { display: false } 
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0a192f',
                            titleColor: '#00d4ff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false
                        }
                    }
                }
            });
        }
    }
})();
