/**
 * NotificationUi.js
 * 
 * Gestiona la interfaz visual de las notificaciones:
 * - Renderiza el modal/drawer de lista de notificaciones
 * - Muestra items leídos/no leídos
 * - Botonera de "Marcar todo leído"
 */
class NotificationUi {
    constructor() {
        this.isOpen = false;
        // Suscribirse al servicio para actualizar la UI si estamos abiertos
        if (window.NotificationService) {
            window.NotificationService.onUpdate((data) => {
                if (this.isOpen) {
                    this.renderList(data.items);
                }
                this.updateBadge(data.count);
            });
        }
    }

    updateBadge(count) {
        const badge = document.getElementById('notif-badge');
        const bell = document.getElementById('notif-bell-icon');

        if (!badge || !bell) return;

        if (count > 0) {
            badge.style.display = 'flex';
            badge.innerText = count > 99 ? '99+' : count;
            bell.classList.add('shake-animation'); // Agregar animación si hay nuevas
        } else {
            badge.style.display = 'none';
            bell.classList.remove('shake-animation');
        }
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;

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
            <div id="push-permission-box" style="display:none; padding: 20px; background: rgba(204, 255, 0, 0.05); border-bottom: 1px solid rgba(204, 255, 0, 0.1);">
                <div style="color: #ccff00; font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px;">🔔 ACTIVAR ALERTAS</div>
                <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 15px; line-height: 1.4;">Recibe avisos al instante cuando empiecen tus partidos.</div>
                <button onclick="window.NotificationUi.dismissPushPrompt(true)" style="width: 100%; background: #ccff00; color: #000; border: none; padding: 12px; border-radius: 12px; font-weight: 900; cursor: pointer; font-family:'Outfit';">ACTIVAR PUSH</button>
            </div>

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

        // Check Permissions status for banner
        const isDismissed = localStorage.getItem('pushPromptDismissed');
        const notificationSupported = 'Notification' in window;
        if (notificationSupported && Notification.permission === 'default' && window.messaging && !isDismissed) {
            document.getElementById('push-permission-box').style.display = 'block';
        }

        // Render content
        if (window.NotificationService) {
            this.renderList(window.NotificationService.getMergedNotifications());
        }
    }

    close() {
        this.isOpen = false;
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
            container.innerHTML = `
                <div style="padding: 80px 20px; text-align: center; opacity: 0.3;">
                    <i class="fas fa-bell-slash" style="font-size: 4rem; color: #64748b; margin-bottom: 20px;"></i>
                    <div style="color: white; font-weight: 800; font-size: 1rem; letter-spacing:1px;">BANDEJA VACÍA</div>
                    <div style="color: #94a3b8; font-size: 0.8rem; margin-top:5px;">No tienes notificaciones pendientes</div>
                </div>
            `;
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
                        <i class="fas fa-${item.icon || 'bell'}"></i>
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
    dismissPushPrompt(accepted) {
        if (accepted && window.NotificationService) {
            window.NotificationService.requestPushPermission();
        }
        localStorage.setItem('pushPromptDismissed', 'true');
        const box = document.getElementById('push-permission-box');
        if (box) box.style.display = 'none';
    }
}

window.NotificationUi = new NotificationUi();

