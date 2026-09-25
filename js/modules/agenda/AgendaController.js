/**
 * AgendaController.js
 * Orquesta la Agenda Unificada (Entrenos + Americanas + Liga)
 * y el Sistema de Notificaciones Inteligentes (Pop-up In-App y Push del Navegador).
 */
(function () {
    'use strict';

    class AgendaController {
        constructor() {
            this.db = window.FirebaseDB;
            this.activeEvents = [];
            this.hasRequestedPush = false;
        }

        async init() {
            console.log("[AgendaController] Initializing Unified Agenda...");
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) {
                if (window.Router) return window.Router.navigate('dashboard');
                return;
            }

            const uid = user.id || user.uid;
            const userName = (user.name || user.displayName || '').toLowerCase().trim();
            const isTeamMember = user.role !== 'player_americanas';

            try {
                // 1. Obtener eventos de Americanas y Entrenos concurrentemente
                const promises = [];
                if (this.db && this.db.americanas && typeof this.db.americanas.getAll === 'function') {
                    promises.push(this.db.americanas.getAll().catch(() => []));
                } else {
                    promises.push(Promise.resolve([]));
                }

                if (this.db && this.db.entrenos && typeof this.db.entrenos.getAll === 'function') {
                    promises.push(this.db.entrenos.getAll().catch(() => []));
                } else {
                    promises.push(Promise.resolve([]));
                }

                const [rawAmericanas, rawEntrenos] = await Promise.all(promises);

                // Normalizar eventos
                const allEvents = [];

                (rawAmericanas || []).forEach(a => {
                    allEvents.push({
                        ...a,
                        type: 'americana',
                        badgeType: 'AMERICANA'
                    });
                });

                (rawEntrenos || []).forEach(e => {
                    allEvents.push({
                        ...e,
                        type: 'entreno',
                        badgeType: 'ENTRENO'
                    });
                });

                // Auto-detectar eventos que ya terminaron y actualizar en Firestore silenciosamente
                if (window.EventService && typeof window.EventService.autoCheckAndFinishEvents === 'function') {
                    window.EventService.autoCheckAndFinishEvents(allEvents);
                }

                // Helper para saber si un evento ha acabado
                const isFinished = (ev) => {
                    if (window.EventService && typeof window.EventService.isEventFinished === 'function') {
                        return window.EventService.isEventFinished(ev);
                    }
                    const st = (ev.status || '').toLowerCase();
                    if (st === 'finished' || st === 'finalizado' || st === 'cancelled') return true;
                    return false;
                };

                // Helper para saber si el usuario está inscrito
                const isUserInEvent = (ev) => {
                    const players = ev.players || ev.registeredPlayers || [];
                    return players.some(p => {
                        if (!p) return false;
                        if (typeof p === 'string') {
                            return p === uid || (userName && p.toLowerCase().trim() === userName);
                        }
                        if (typeof p === 'object') {
                            const pUid = p.id || p.uid;
                            const pName = (p.name || p.displayName || '').toLowerCase().trim();
                            return pUid === uid || (userName && pName === userName);
                        }
                        return false;
                    });
                };

                // Normalizar fechas para ordenación fiable
                allEvents.forEach(ev => {
                    ev.normDate = window.EventService ? window.EventService.normalizeDate(ev.date) : (ev.date || '');
                    ev.isFinished = isFinished(ev);
                });

                // 1. Mis Eventos Próximos (Apuntado, hoy o futuros, no finalizados)
                const myUpcomingEvents = allEvents.filter(ev => {
                    if (ev.isFinished) return false;
                    return isUserInEvent(ev);
                }).sort((a, b) => {
                    const diffDate = (a.normDate || '').localeCompare(b.normDate || '');
                    if (diffDate !== 0) return diffDate;
                    return (a.time || '').localeCompare(b.time || '');
                });

                // 2. Historial de Mis Eventos Finalizados (Apuntado y ya concluidos)
                const myFinishedEvents = allEvents.filter(ev => {
                    if (!ev.isFinished) return false;
                    return isUserInEvent(ev);
                }).sort((a, b) => {
                    // Orden inverso: los más recientes primero
                    const diffDate = (b.normDate || '').localeCompare(a.normDate || '');
                    if (diffDate !== 0) return diffDate;
                    return (b.time || '').localeCompare(a.time || '');
                });

                // 3. Próximos recomendados (a los que no estoy apuntado aún y NO están acabados)
                const upcoming = allEvents.filter(ev => {
                    if (ev.isFinished) return false;
                    if (isUserInEvent(ev)) return false;
                    // Si es jugador solo americanas, no recomendar entrenos exclusivos de equipo
                    if (!isTeamMember && ev.type === 'entreno') return false;
                    return true;
                }).sort((a, b) => {
                    const diffDate = (a.normDate || '').localeCompare(b.normDate || '');
                    if (diffDate !== 0) return diffDate;
                    return (a.time || '').localeCompare(b.time || '');
                }).slice(0, 4);

                this.activeEvents = myUpcomingEvents;
                this.finishedEvents = myFinishedEvents;

                // Renderizar la vista
                if (window.AgendaView) {
                    window.AgendaView.render(myUpcomingEvents, upcoming, user, myFinishedEvents);
                }

                // Disparar comprobación de notificaciones automáticas (Push + Pop-up In-App)
                this.checkEventReminders(myUpcomingEvents, user);

            } catch (error) {
                console.error("[AgendaController] Error cargando la agenda:", error);
                if (window.AgendaView) {
                    window.AgendaView.render([], [], user, []);
                }
            }
        }

        /**
         * Sistema Inteligente de Alertas y Pop-ups de Próximos Eventos
         * Si el usuario es de equipo -> le avisa de Entrenos
         * Si es externo -> le avisa de Americanas
         */
        checkEventReminders(myEvents, user) {
            if (!myEvents || myEvents.length === 0) return;

            const isTeamMember = user && user.role !== 'player_americanas';
            const now = new Date();

            // Buscar el evento más inminente
            for (const ev of myEvents) {
                const evType = ev.type || 'evento';
                const isEntreno = evType === 'entreno';
                const isAmericana = evType === 'americana';

                // Filtrar según el perfil requerido por el usuario:
                if (isTeamMember && !isEntreno) {
                    // Puede avisar de ambos, pero prioriza entreno
                }

                let evDate = null;
                if (window.EventService && typeof window.EventService.getEventTimes === 'function') {
                    const times = window.EventService.getEventTimes(ev.date, ev.time, ev.time_end);
                    if (times) evDate = times.start;
                }
                if (!evDate) {
                    const normDate = window.EventService ? window.EventService.normalizeDate(ev.date) : ev.date;
                    if (!normDate) continue;
                    evDate = new Date(`${normDate}T${ev.time || '10:00'}:00`);
                }
                if (isNaN(evDate.getTime())) continue;

                const diffHours = (evDate - now) / (1000 * 60 * 60);

                // Si es un evento en las próximas 48 horas (o que es hoy)
                if (diffHours >= -1 && diffHours <= 48) {
                    const sessionKey = `sp_agenda_popup_${ev.id}_${ev.date}`;
                    if (!sessionStorage.getItem(sessionKey)) {
                        sessionStorage.setItem(sessionKey, 'shown');
                        setTimeout(() => {
                            this.showInAppReminderPopup(ev, diffHours);
                        }, 700);
                        break; // Mostrar solo el más prioritario
                    }
                }
            }
        }

        /**
         * Pop-up In-App Moderno y Deportivo
         */
        showInAppReminderPopup(ev, diffHours) {
            const existing = document.getElementById('sp-agenda-reminder-modal');
            if (existing) existing.remove();

            const isToday = diffHours <= 14 && diffHours >= -2;
            const timeLabel = isToday ? '¡ES HOY!' : 'PRÓXIMO ENCUENTRO';
            const isEntreno = ev.type === 'entreno';

            const modal = document.createElement('div');
            modal.id = 'sp-agenda-reminder-modal';
            modal.style = `
                position: fixed; inset: 0; z-index: 100000;
                background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                display: flex; align-items: center; justify-content: center; padding: 18px;
                animation: fadeInModal 0.25s ease-out; font-family: 'Outfit', sans-serif;
            `;

            modal.innerHTML = `
                <div style="background: linear-gradient(165deg, #0f172a 0%, #1e293b 100%);
                            border: 2px solid ${isEntreno ? '#ff007f' : '#CCFF00'};
                            box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 35px ${isEntreno ? 'rgba(255,0,127,0.35)' : 'rgba(204,255,0,0.3)'};
                            border-radius: 26px; max-width: 400px; width: 100%; padding: 22px 20px; color: white; text-align: center;">
                    
                    <div style="width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 50%;
                                background: ${isEntreno ? 'rgba(255,0,127,0.18)' : 'rgba(204,255,0,0.18)'};
                                border: 1.5px solid ${isEntreno ? '#ff007f' : '#CCFF00'};
                                display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
                        ${isEntreno ? '🎾' : '🏆'}
                    </div>

                    <div style="display: inline-block; background: ${isToday ? '#ef4444' : (isEntreno ? '#ff007f' : '#CCFF00')};
                                color: ${isToday || isEntreno ? '#fff' : '#000'}; font-size: 0.62rem; font-weight: 1000;
                                padding: 3px 10px; border-radius: 20px; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">
                        🔔 RECORDATORIO DE TU AGENDA • ${timeLabel}
                    </div>

                    <h3 style="margin: 4px 0 8px; font-size: 1.25rem; font-weight: 1000; color: #fff; line-height: 1.25;">
                        ${ev.name || 'Tu Sesión de Pádel'}
                    </h3>

                    <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0 0 16px; line-height: 1.4;">
                        Estás apuntado a este ${isEntreno ? 'entreno de equipo' : 'torneo americano'}. Prepara tu pala y llega con 10 min de antelación.
                    </p>

                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 12px; margin-bottom: 18px; display: flex; justify-content: space-around; text-align: left;">
                        <div>
                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800;">FECHA / HORA</div>
                            <div style="font-size: 0.85rem; font-weight: 900; color: #CCFF00;">${ev.date || 'Hoy'} • ${ev.time || '10:00'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800;">SEDE</div>
                            <div style="font-size: 0.85rem; font-weight: 900; color: #38bdf8;">${ev.location || 'SomosPadel BCN'}</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button type="button" onclick="document.getElementById('sp-agenda-reminder-modal').remove()"
                                style="flex: 1; padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-weight: 850; font-size: 0.75rem; cursor: pointer;">
                            ENTENDIDO
                        </button>
                        <button type="button" onclick="document.getElementById('sp-agenda-reminder-modal').remove(); window.Router.navigate('${isEntreno ? 'entrenos' : 'americanas'}');"
                                style="flex: 1.4; padding: 12px; border-radius: 14px; background: ${isEntreno ? 'linear-gradient(135deg, #ff007f 0%, #e11d48 100%)' : 'linear-gradient(135deg, #CCFF00 0%, #84cc16 100%)'};
                                       border: none; color: ${isEntreno ? '#fff' : '#000'}; font-weight: 1000; font-size: 0.78rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                            VER CONVOCATORIA ➔
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // También lanzar notificación Push del navegador si está concedida
            this.sendNativePushNotification(ev);
        }

        /**
         * Notificación Push del Navegador (Web Notification API)
         */
        async requestPushPermission() {
            if (!('Notification' in window)) {
                alert("Tu navegador no soporta notificaciones push.");
                return false;
            }
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                        window.NotificationService.showToast("🔔 ¡Recordatorios activados con éxito!", "success");
                    } else {
                        alert("🔔 ¡Recordatorios activados! Te avisaremos de tus partidos y entrenos.");
                    }
                    if (window.AgendaView) {
                        this.init(); // Re-renderizar estado de permiso
                    }
                    return true;
                } else {
                    alert("Has bloqueado los avisos. Actívalos en los ajustes del navegador.");
                    return false;
                }
            } catch (e) {
                console.error("Error pidiendo permiso de notificación:", e);
                return false;
            }
        }

        sendNativePushNotification(ev) {
            if (!('Notification' in window) || Notification.permission !== 'granted') {
                return;
            }
            try {
                const title = `🎾 Recordatorio SomosPadel: ${ev.name || 'Partido'}`;
                const options = {
                    body: `Tu ${ev.type === 'entreno' ? 'entreno de equipo' : 'torneo'} es ${ev.date || 'hoy'} a las ${ev.time || 'tu hora'}. ¡Puntualidad en pista!`,
                    icon: 'https://somospadelbarcelona.github.io/Americanas-somospadel/favicon.ico',
                    badge: 'https://somospadelbarcelona.github.io/Americanas-somospadel/favicon.ico',
                    vibrate: [200, 100, 200]
                };
                new Notification(title, options);
            } catch (err) {
                console.log("[AgendaPush] No se pudo emitir la notificación nativa:", err);
            }
        }
    }

    window.AgendaController = new AgendaController();
    console.log("🗓️ AgendaController Initialized");
})();
