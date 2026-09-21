/**
 * AgendaView.js
 * Vista deportiva premium de "Mi Agenda"
 * Secciones: Próximos partidos/entrenos apuntados, recomendados y control de avisos push.
 */
(function () {
    'use strict';

    class AgendaView {
        render(myEvents, upcomingEvents, user) {
            const container = document.getElementById('content-area');
            if (!container) return;

            const isTeamMember = user && user.role !== 'player_americanas';
            const hasPush = ('Notification' in window) && Notification.permission === 'granted';

            container.innerHTML = `
                <div class="agenda-container fade-in" style="background: #080e1a; min-height: 100vh; padding-bottom: 120px; font-family: 'Outfit', sans-serif; color: #ffffff; box-sizing: border-box;">
                    <style>
                        .agenda-container * { box-sizing: border-box; }
                        @keyframes agFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                        .ag-card-anim { animation: agFadeIn 0.3s ease both; }
                        .ag-card-anim:nth-child(2) { animation-delay: 0.08s; }
                        .ag-card-anim:nth-child(3) { animation-delay: 0.16s; }
                        .ag-card-anim:nth-child(4) { animation-delay: 0.24s; }
                    </style>

                    <!-- HEADER HERO -->
                    <div style="background: radial-gradient(ellipse at 85% 15%, rgba(204,255,0,0.16) 0%, transparent 60%), radial-gradient(ellipse at 15% 85%, rgba(56,189,248,0.14) 0%, transparent 55%), linear-gradient(150deg, #0f172a 0%, #1e293b 100%);
                                border-bottom: 1.5px solid rgba(204,255,0,0.25); padding: 36px 20px 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap;">
                            <div>
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(204,255,0,0.12); border: 1px solid rgba(204,255,0,0.35); color: #CCFF00; padding: 4px 10px; border-radius: 20px; font-size: 0.62rem; font-weight: 1000; letter-spacing: 0.8px; text-transform: uppercase;">
                                    <span>🎾</span> ${isTeamMember ? 'EQUIPO & COMUNIDAD' : 'JUGADOR EXTERNO'}
                                </div>
                                <h1 style="font-weight: 1000; font-size: 1.8rem; margin: 8px 0 2px; color: #ffffff; letter-spacing: -0.5px;">
                                    Mi <span style="color: #CCFF00;">Agenda</span>
                                </h1>
                                <p style="color: #94a3b8; font-size: 0.75rem; margin: 0;">
                                    Tus convocatorias confirmadas de entrenos y partidos.
                                </p>
                            </div>

                            <!-- Botón Activar Notificaciones Push -->
                            <button type="button" onclick="window.AgendaController.requestPushPermission()"
                                    style="background: ${hasPush ? 'rgba(34,197,94,0.15)' : 'rgba(204,255,0,0.15)'};
                                           border: 1px solid ${hasPush ? 'rgba(34,197,94,0.4)' : 'rgba(204,255,0,0.4)'};
                                           color: ${hasPush ? '#4ade80' : '#CCFF00'};
                                           padding: 8px 12px; border-radius: 12px; font-size: 0.68rem; font-weight: 900;
                                           display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: transform 0.15s;"
                                    onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas ${hasPush ? 'fa-check-circle' : 'fa-bell'}"></i>
                                <span>${hasPush ? 'AVISOS ACTIVADOS' : 'ACTIVAR RECORDATORIOS'}</span>
                            </button>
                        </div>
                    </div>

                    <!-- SECCIÓN: PRÓXIMAS CITAS CONFIRMADAS -->
                    <div style="padding: 20px 16px 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px;">
                                <span style="width: 5px; height: 14px; background: #CCFF00; border-radius: 3px;"></span>
                                CITAS A LAS QUE ESTÁS APUNTADO (${myEvents.length})
                            </div>
                        </div>

                        ${myEvents.length === 0 ? `
                            <div style="background: rgba(255,255,255,0.03); border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 22px; padding: 40px 20px; text-align: center; color: #94a3b8;">
                                <div style="font-size: 2.4rem; margin-bottom: 10px;">📅</div>
                                <div style="font-weight: 950; color: #fff; font-size: 1rem;">No tienes citas confirmadas</div>
                                <p style="font-size: 0.74rem; color: #64748b; margin: 6px auto 18px; max-width: 320px; line-height: 1.4;">
                                    ${isTeamMember 
                                        ? 'No estás inscrito en ningún entreno de equipo ni americana próxima.' 
                                        : 'Aún no te has apuntado a ninguna americana disponible.'}
                                </p>
                                <button onclick="window.Router.navigate('${isTeamMember ? 'entrenos' : 'americanas'}')"
                                        style="background: #CCFF00; color: #000; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 950; font-size: 0.74rem; cursor: pointer; box-shadow: 0 4px 15px rgba(204,255,0,0.3);">
                                    VER ${isTeamMember ? 'ENTRENOS DEL CLUB' : 'AMERICANAS DISPONIBLES'}
                                </button>
                            </div>
                        ` : myEvents.map(ev => this.renderEventCard(ev, true)).join('')}
                    </div>

                    <!-- SECCIÓN: RECOMENDADOS PARA TI -->
                    ${upcomingEvents && upcomingEvents.length > 0 ? `
                        <div style="padding: 16px 16px 20px;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
                                <span style="width: 5px; height: 14px; background: #38bdf8; border-radius: 3px;"></span>
                                DISPONIBLES PARA APUNTARTE
                            </div>
                            ${upcomingEvents.map(ev => this.renderEventCard(ev, false)).join('')}
                        </div>
                    ` : ''}

                </div>
            `;
        }

        renderEventCard(event, isReserved) {
            const dateStr = event.date || '';
            let dayNum = '--';
            let monthName = 'PAD';
            let dayOfWeek = '';

            if (dateStr) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    dayNum = d.getDate();
                    monthName = d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
                    dayOfWeek = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                }
            }

            const isEntreno = event.type === 'entreno' || (event.badgeType === 'ENTRENO');
            const badgeColor = isEntreno ? '#ff007f' : '#CCFF00';
            const badgeBg = isEntreno ? 'rgba(255,0,127,0.15)' : 'rgba(204,255,0,0.15)';
            const location = event.location || 'Sede SomosPadel';
            const time = event.time || 'Horario a confirmar';

            return `
                <div class="ag-card-anim" style="
                    background: linear-gradient(145deg, #0f172a 0%, #162035 100%);
                    border: 1.5px solid ${isReserved ? (isEntreno ? 'rgba(255,0,127,0.45)' : 'rgba(204,255,0,0.45)') : 'rgba(255,255,255,0.08)'};
                    border-radius: 20px; padding: 14px; margin-bottom: 12px;
                    display: flex; align-items: center; gap: 14px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.45);
                    position: relative; overflow: hidden;
                    transition: transform 0.2s, border-color 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                    
                    <!-- Glow lateral de estado -->
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${isReserved ? badgeColor : '#38bdf8'};"></div>

                    <!-- Bloque Fecha Izquierdo -->
                    <div style="
                        background: ${isReserved ? badgeBg : 'rgba(255,255,255,0.05)'};
                        border: 1px solid ${isReserved ? badgeColor : 'rgba(255,255,255,0.1)'};
                        color: #ffffff;
                        padding: 8px; border-radius: 14px; text-align: center;
                        min-width: 58px; flex-shrink: 0;
                    ">
                        <div style="font-size: 0.55rem; font-weight: 900; color: ${isReserved ? badgeColor : '#94a3b8'}; letter-spacing: 0.5px;">${dayOfWeek}</div>
                        <div style="font-size: 1.35rem; font-weight: 1000; line-height: 1; margin: 2px 0;">${dayNum}</div>
                        <div style="font-size: 0.60rem; font-weight: 850; color: #94a3b8;">${monthName}</div>
                    </div>

                    <!-- Contenido Central -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
                            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.58rem; font-weight: 950; padding: 2px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
                                ${isEntreno ? 'ENTRENO' : 'AMERICANA'}
                            </span>
                            ${isReserved ? `
                                <span style="background: rgba(34,197,94,0.15); color: #4ade80; font-size: 0.58rem; font-weight: 950; padding: 2px 7px; border-radius: 6px;">
                                    ● CONFIRMADO
                                </span>
                            ` : ''}
                        </div>
                        <div style="font-weight: 1000; color: #ffffff; font-size: 0.94rem; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${event.name}
                        </div>
                        <div style="font-size: 0.70rem; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="far fa-clock" style="color: #38bdf8;"></i> ${time}</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="fas fa-map-marker-alt" style="color: #f43f5e;"></i> ${location}</span>
                        </div>
                    </div>

                    <!-- Acción Derecha -->
                    <div style="flex-shrink: 0;">
                        ${isReserved ? `
                            <button type="button" onclick="window.Router.navigate('${isEntreno ? 'entrenos' : 'americanas'}')"
                                    style="width: 36px; height: 36px; border-radius: 11px; background: ${badgeColor}; color: #000; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px ${isEntreno ? 'rgba(255,0,127,0.4)' : 'rgba(204,255,0,0.4)'};">
                                <i class="fas fa-chevron-right" style="font-size: 0.85rem;"></i>
                            </button>
                        ` : `
                            <button type="button" onclick="window.Router.navigate('${isEntreno ? 'entrenos' : 'americanas'}')"
                                    style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); color: #fff; padding: 7px 11px; border-radius: 10px; font-weight: 900; font-size: 0.68rem; cursor: pointer;">
                                APUNTARME
                            </button>
                        `}
                    </div>

                </div>
            `;
        }
    }

    window.AgendaView = new AgendaView();
    console.log("📅 AgendaView Initialized");
})();
