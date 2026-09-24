/**
 * NotificationUi.js
 * 
 * Gestiona la interfaz visual de las notificaciones:
 * - Renderiza el modal/drawer de lista de notificaciones
 * - Muestra items leídos/no leídos
 * - Botonera de "Marcar todo leído"
 * - Sincroniza badges en Header principal y Side Drawer
 */
class NotificationUi {
    constructor() {
        this.isOpen = false;
        this.lastCount = 0;
        this._boundEscapeHandler = null;
        this._audioCtx = null;
        this._bindService();
    }

    _bindService() {
        const attach = (service) => {
            if (service && typeof service.onUpdate === 'function') {
                service.onUpdate((data) => {
                    if (this.isOpen) {
                        this.renderList(data.items);
                    }
                    this.updateBadge(data.count);
                });
                if (typeof service.unreadCount === 'number') {
                    this.updateBadge(service.unreadCount);
                }
            }
        };

        if (window.NotificationService) {
            attach(window.NotificationService);
        } else {
            // Polling de sincronización temprana por si NotificationService se instancia instantes después
            const checkTimer = setInterval(() => {
                if (window.NotificationService) {
                    clearInterval(checkTimer);
                    attach(window.NotificationService);
                }
            }, 200);
            setTimeout(() => clearInterval(checkTimer), 15000);
        }
    }

    updateBadge(count) {
        if (typeof count === 'number') {
            this.lastCount = count;
        } else if (typeof this.lastCount === 'number') {
            count = this.lastCount;
        } else if (window.NotificationService && typeof window.NotificationService.unreadCount === 'number') {
            count = window.NotificationService.unreadCount;
        } else {
            count = 0;
        }

        const badge = document.getElementById('notif-badge');
        const bell = document.getElementById('notif-bell-icon');
        const drawerBadge = document.getElementById('drawer-notif-badge');
        const drawerBell = document.getElementById('drawer-notif-bell-icon');

        const displayCount = count > 99 ? '99+' : String(count);

        if (count > 0) {
            // 1. Header principal
            if (badge) {
                badge.style.display = 'flex';
                badge.innerText = displayCount;
            }
            if (bell) {
                bell.classList.remove('shake-animation');
                void bell.offsetWidth; // Forzar reflow para reiniciar la animación
                bell.classList.add('shake-animation');
            }

            // 2. Menú lateral (Side Drawer)
            if (drawerBadge) {
                drawerBadge.style.display = 'inline-flex';
                drawerBadge.innerText = displayCount;
            }
            if (drawerBell) {
                drawerBell.classList.remove('shake-animation');
                void drawerBell.offsetWidth;
                drawerBell.classList.add('shake-animation');
            }
        } else {
            // 1. Header principal
            if (badge) {
                badge.style.display = 'none';
            }
            if (bell) {
                bell.classList.remove('shake-animation');
            }

            // 2. Menú lateral (Side Drawer)
            if (drawerBadge) {
                drawerBadge.style.display = 'none';
            }
            if (drawerBell) {
                drawerBell.classList.remove('shake-animation');
            }
        }
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;

        // Cerrar dropdown de usuario y drawer lateral si estuvieran abiertos
        if (typeof window._closeUserDropdown === 'function') window._closeUserDropdown();
        if (typeof window.closeDrawer === 'function') window.closeDrawer();

        const existingOverlay = document.getElementById('notif-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'notif-overlay';
        overlay.onclick = (e) => { if (e.target.id === 'notif-overlay') this.close(); };

        const drawer = document.createElement('div');
        drawer.id = 'notif-drawer';

        drawer.innerHTML = `
            <!-- HEADER -->
            <div class="notif-header">
                <h3 class="notif-header-title">NOTIFICACIONES</h3>
                <div class="notif-header-actions">
                    ${(window.Store?.getState('currentUser')?.role?.includes('admin')) ?
                `<button class="notif-action-btn danger" onclick="window.NotificationUi.confirmGlobalClear()" title="LIMPIEZA GLOBAL (ADMIN)"><i class="fas fa-radiation"></i></button>` : ''}
                    <button class="notif-action-btn" onclick="window.NotificationUi.deleteAllMy()" title="Limpiar mi bandeja"><i class="fas fa-trash"></i></button>
                    <button class="notif-action-btn" onclick="window.NotificationUi.markAllRead()" title="Marcar todo como leído"><i class="fas fa-check-double"></i></button>
                    <button class="notif-action-btn" onclick="window.NotificationUi.close()"><i class="fas fa-times"></i></button>
                </div>
            </div>

            <!-- PERMISSIONS PROMPT -->
            <div id="push-permission-box" style="display:none;"></div>

            <!-- LIST -->
            <div id="notif-list" style="flex: 1; overflow-y: auto;">
                <div style="padding: 60px 20px; text-align: center; color: #475569;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div style="font-size:0.8rem; font-weight:700;">Sincronizando...</div>
                </div>
            </div>
        `;

        overlay.appendChild(drawer);
        document.body.appendChild(overlay);

        // Animate In using class
        setTimeout(() => overlay.classList.add('show'), 10);

        // Escape key listener
        this._boundEscapeHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', this._boundEscapeHandler);

        // Render push permission banner & quick test button
        this.renderPushPermissionBox();

        // Render content
        if (window.NotificationService) {
            this.renderList(window.NotificationService.getMergedNotifications());
        }
    }

    close() {
        this.isOpen = false;
        if (this._boundEscapeHandler) {
            document.removeEventListener('keydown', this._boundEscapeHandler);
            this._boundEscapeHandler = null;
        }
        const overlay = document.getElementById('notif-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 400);
        }
    }

    markAllRead() {
        if (window.NotificationService) window.NotificationService.markAllAsRead();
    }

    async deleteAllMy() {
        if (!window.NotificationService) return;
        const confirm = await window.PremiumModal.confirm({
            title: "LIMPIAR BANDEJA",
            message: "¿Seguro que quieres borrar todas tus notificaciones? Esta acción no se puede deshacer.",
            confirmText: "BORRAR TODO",
            type: 'danger'
        });
        if (confirm) window.NotificationService.deleteAllMyNotifications(true);
    }

    handleItemClick(id, actionUrl, eventId, action) {
        if (window.NotificationService) window.NotificationService.markAsRead(id);

        if (actionUrl) {
            this.close();
            console.log(`🚀 [NotificationUi] Navigating to URL: ${actionUrl}`);
            if (window.Router) {
                window.Router.navigate(actionUrl);
            }
            return;
        }

        if (eventId) {
            this.close();
            console.log(`🚀 [NotificationUi] Opening event ${eventId} with action: ${action}`);

            if (window.EventsController && window.EventsController.openLiveEvent) {
                window.EventsController.openLiveEvent(eventId, 'americana', action);
            } else if (window.openLiveEvent) {
                window.openLiveEvent(eventId, 'americana', action);
            } else if (window.Router) {
                window.Router.navigate('live', { eventId, action });
            }
        }
    }

    handleDeleteOne(id, event) {
        console.log("🛑 [NotificationUi] Manual Delete Click for:", id);
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (window.NotificationService) {
            window.NotificationService.deleteNotification(id);
        }
    }

    async confirmGlobalClear() {
        const confirm = await window.PremiumModal.confirm({
            title: "☢️ LIMPIEZA GLOBAL",
            message: "¿ESTÁS SEGURO? Esto borrará las notificaciones de TODOS los usuarios de la comunidad. Esta es una acción de Super Admin.",
            confirmText: "BORRAR COMUNIDAD",
            type: 'danger'
        });

        if (!confirm) return;

        try {
            if (window.NotificationService) {
                await window.NotificationService.clearAllCommunityNotifications();
                window.PremiumModal.alert({
                    title: "ÉXITO",
                    message: "Bandeja de la comunidad restaurada correctamente.",
                    type: 'success'
                });
                this.close();
            }
        } catch (e) {
            window.PremiumModal.alert({
                title: "ERROR",
                message: e.message,
                type: 'danger'
            });
        }
    }

    renderList(items) {
        const container = document.getElementById('notif-list');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `<div style="padding: 80px 20px; text-align: center; opacity: 0.3;">
                    <img src="/img/no-notifications.png" onerror="this.style.display='none'" style="width: 64px; height: 64px; margin-bottom: 20px;">
                    <div style="color: white; font-weight: 800; font-size: 1rem; letter-spacing:1px;">BANDEJA VACÍA</div>
                    <div style="color: #94a3b8; font-size: 0.8rem; margin-top:5px;">No tienes notificaciones pendientes</div>
                </div>`;
            return;
        }

        // grouping by date
        const groups = { "Hoy": [], "Ayer": [], "Anteriores": [] };
        const now = new Date();
        const todayStr = now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        items.forEach(item => {
            const date = this.parseTimestamp(item.timestamp);
            const dateStr = date.toDateString();
            if (dateStr === todayStr) groups["Hoy"].push(item);
            else if (dateStr === yesterdayStr) groups["Ayer"].push(item);
            else groups["Anteriores"].push(item);
        });

        let html = '';
        Object.keys(groups).forEach(groupName => {
            const groupItems = groups[groupName];
            if (groupItems.length === 0) return;

            html += `<div class="notif-group-header">${groupName}</div>`;

            html += groupItems.map(item => `
                <div class="notif-item ${item.read ? '' : 'unread'}" 
                     onclick="window.NotificationUi.handleItemClick('${item.id}', '${item.data?.url || ''}', '${item.data?.eventId || ''}', '${item.data?.action || ''}')">
                    
                    <button class="notif-delete-btn" onclick="window.NotificationUi.handleDeleteOne('${item.id}', event)">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    
                    <div class="notif-icon-box">
                        <i class="fas fa-${item.icon || 'bolt'}"></i>
                    </div>
                    
                    <div class="notif-content">
                        <div class="notif-title">${item.title}</div>
                        <div class="notif-body">${item.body}</div>
                        <div class="notif-meta">${this.timeAgo(item.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        });

        container.innerHTML = html;
    }

    parseTimestamp(ts) {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate();
        if (ts instanceof Date) return ts;
        return new Date(ts);
    }

    timeAgo(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return "Ahora";
    }
    renderPushPermissionBox() {
        const box = document.getElementById('push-permission-box');
        if (!box) return;

        const notificationSupported = 'Notification' in window;
        const permission = notificationSupported ? Notification.permission : 'default';

        if (permission === 'granted') {
            box.style.display = 'block';
            box.style.background = 'rgba(16, 185, 129, 0.08)';
            box.style.borderBottom = '1px solid rgba(16, 185, 129, 0.25)';
            box.style.padding = '14px 18px';
            box.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #10b981; font-size: 0.8rem; font-weight: 800; line-height: 1.3;">
                        <i class="fas fa-check-circle" style="font-size: 1rem; color: #10b981;"></i>
                        <span>✅ Alertas push activadas en este dispositivo</span>
                    </div>
                    <button type="button" class="notif-test-btn" onclick="window.NotificationUi.testNotification()" style="background: rgba(204, 255, 0, 0.12); border: 1px solid rgba(204, 255, 0, 0.35); color: #ccff00; padding: 7px 14px; border-radius: 10px; font-size: 0.74rem; font-weight: 850; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: 'Outfit', sans-serif; transition: all 0.2s; box-shadow: 0 0 10px rgba(204, 255, 0, 0.15);">
                        <i class="fas fa-bell"></i> 🔔 Probar Notificación
                    </button>
                </div>
            `;
            return;
        }

        box.style.display = 'block';
        box.style.background = 'linear-gradient(135deg, rgba(204, 255, 0, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)';
        box.style.borderBottom = '1px solid rgba(204, 255, 0, 0.2)';
        box.style.padding = '16px 18px';

        box.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="color: #ccff00; font-size: 0.82rem; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-bolt" style="font-size: 0.85rem;"></i> ⚡ ALERTAS EN TU MÓVIL (PWA)
                </div>
                ${permission === 'denied' ?
                    `<span style="font-size: 0.68rem; color: #ef4444; font-weight: 800; background: rgba(239, 68, 68, 0.12); padding: 2px 8px; border-radius: 6px;">⚠️ Permiso bloqueado</span>` : ''}
            </div>
            <div style="color: #cbd5e1; font-size: 0.75rem; line-height: 1.45; margin-bottom: 14px;">
                Recibe avisos al instante cuando se publique una nueva americana, entrenos tácticos de tu nivel o comunicados oficiales del club.
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" onclick="window.NotificationUi.dismissPushPrompt(true)" style="flex: 1; min-width: 180px; background: #ccff00; color: #000; border: none; padding: 11px 14px; border-radius: 12px; font-weight: 900; font-size: 0.76rem; cursor: pointer; font-family:'Outfit', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 0 16px rgba(204, 255, 0, 0.35); transition: transform 0.15s ease;">
                    <i class="fas fa-bell"></i> ACTIVAR NOTIFICACIONES PUSH
                </button>
                <button type="button" class="notif-test-btn" onclick="window.NotificationUi.testNotification()" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.18); color: #fff; padding: 11px 14px; border-radius: 12px; font-size: 0.74rem; font-weight: 800; cursor: pointer; font-family:'Outfit', sans-serif; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    🔔 Probar Notificación
                </button>
            </div>
        `;
    }

    playNotificationSound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this._audioCtx) {
                this._audioCtx = new AudioCtx();
            }
            if (this._audioCtx.state === 'suspended') {
                this._audioCtx.resume().catch(() => {});
            }
            const ctx = this._audioCtx;
            const now = ctx.currentTime;

            // Chime armónico de 2 tonos de alta fidelidad
            const tones = [
                { freq: 523.25, time: 0.00, dur: 0.22, gain: 0.18 }, // Do5
                { freq: 783.99, time: 0.12, dur: 0.38, gain: 0.22 }  // Sol5
            ];

            tones.forEach(t => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + t.time;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(t.freq, start);
                gain.gain.setValueAtTime(t.gain, start);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + t.dur);
            });
        } catch (e) {
            console.warn("⚠️ [NotificationUi] No se pudo reproducir el sonido:", e);
        }
    }

    testNotification() {
        console.log("🔔 [NotificationUi] Probando notificación (sonido, badge y toast)...");

        // 1. Sonido envolvente
        this.playNotificationSound();

        // 2. Incrementar badge y activar animación de campana
        const nextCount = (this.lastCount || 0) + 1;
        this.updateBadge(nextCount);

        // 3. Toast visual en pantalla
        if (window.NotificationService && typeof window.NotificationService.showInAppToast === 'function') {
            window.NotificationService.showInAppToast('🎾 ¡Prueba SomosPadel!', 'Sonido, alertas y badge funcionando a la perfección.');
        } else if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
            window.NotificationService.showToast('🔔 ¡Prueba de Notificación SomosPadel con éxito!', 'success');
        }

        // 4. Si hay permiso de notificación nativo, disparar aviso del sistema
        if ('Notification' in window && Notification.permission === 'granted') {
            if (window.NotificationService && typeof window.NotificationService.showNativeNotification === 'function') {
                window.NotificationService.showNativeNotification('🎾 SomosPadel Barcelona', '¡Notificaciones push activadas correctamente!');
            }
        }
    }

    async dismissPushPrompt(accepted) {
        if (accepted && window.NotificationService) {
            try {
                await window.NotificationService.requestPushPermission();
            } catch (err) {
                console.warn("⚠️ [NotificationUi] Error solicitando permiso:", err);
            }
        }
        localStorage.setItem('pushPromptDismissed', 'true');
        this.renderPushPermissionBox();
    }
}

window.NotificationUi = new NotificationUi();

