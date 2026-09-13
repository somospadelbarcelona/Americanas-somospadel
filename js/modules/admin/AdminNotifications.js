/**
 * AdminNotifications.js
 * 🔔 CENTRO DE NOTIFICACIONES Y ALERTAS PARA ADMINISTRADORES
 * Gestiona alertas en tiempo real, solicitudes de registro pendientes y eventos críticos.
 */

(function () {
    'use strict';

    class AdminNotificationsManager {
        constructor() {
            this.isOpen = false;
            this.notifications = [];
            this.pendingPlayersCount = 0;
            this.intervalId = null;
        }

        init() {
            console.log("🔔 [AdminNotifications] Inicializando Centro de Notificaciones...");
            this.injectStyles();
            this.injectBellUI();
            this.setupEventListeners();

            // Primera carga tras 1.5s
            setTimeout(() => this.fetchNotifications(), 1500);

            // Sondeo periódico cada 90s
            this.intervalId = setInterval(() => this.fetchNotifications(), 90000);

            // Refresco cuando la ventana recupera el foco
            window.addEventListener('focus', () => this.fetchNotifications());
        }

        injectStyles() {
            if (document.getElementById('admin-notif-styles')) return;

            const style = document.createElement('style');
            style.id = 'admin-notif-styles';
            style.textContent = `
                .admin-notif-wrapper {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                .admin-notif-bell-btn {
                    position: relative;
                    width: 38px;
                    height: 38px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                    color: #e2e8f0;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .admin-notif-bell-btn:hover {
                    background: rgba(204, 255, 0, 0.12);
                    border-color: #CCFF00;
                    color: #CCFF00;
                    transform: translateY(-1px);
                }
                .admin-notif-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #CCFF00;
                    color: #000;
                    font-weight: 900;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 17px;
                    text-align: center;
                    box-shadow: 0 0 10px rgba(204, 255, 0, 0.6);
                    animation: notifPulse 2s infinite ease-in-out;
                }
                @keyframes notifPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); box-shadow: 0 0 14px rgba(204, 255, 0, 0.9); }
                }
                .admin-notif-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 360px;
                    max-width: 90vw;
                    background: rgba(15, 23, 42, 0.96);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), 0 0 20px rgba(204, 255, 0, 0.08);
                    z-index: 10000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    opacity: 0;
                    transform: translateY(-8px) scale(0.97);
                    pointer-events: none;
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .admin-notif-dropdown.show {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: auto;
                }
                .admin-notif-header {
                    padding: 14px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                }
                .admin-notif-header-title {
                    font-size: 0.85rem;
                    font-weight: 850;
                    letter-spacing: 0.8px;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                }
                .admin-notif-body {
                    padding: 10px;
                    max-height: 380px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .admin-notif-card {
                    padding: 12px 14px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.2s ease;
                }
                .admin-notif-card.urgent {
                    background: rgba(245, 158, 11, 0.1);
                    border-color: rgba(245, 158, 11, 0.4);
                }
                .admin-notif-card.warning {
                    background: rgba(239, 68, 68, 0.08);
                    border-color: rgba(239, 68, 68, 0.3);
                }
                .admin-notif-card:hover {
                    background: rgba(255, 255, 255, 0.08);
                }
                .admin-notif-btn {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.72rem;
                    font-weight: 800;
                    cursor: pointer;
                    border: none;
                    transition: all 0.15s;
                }
                .admin-notif-btn.primary {
                    background: #CCFF00;
                    color: #000;
                }
                .admin-notif-btn.primary:hover {
                    box-shadow: 0 0 10px rgba(204, 255, 0, 0.4);
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);
        }

        injectBellUI() {
            if (document.getElementById('admin-notif-bell-container')) return;

            const topActions = document.querySelector('.top-actions');
            if (!topActions) {
                setTimeout(() => this.injectBellUI(), 500);
                return;
            }

            const container = document.createElement('div');
            container.id = 'admin-notif-bell-container';
            container.className = 'admin-notif-wrapper';

            container.innerHTML = `
                <button id="admin-notif-bell-btn" class="admin-notif-bell-btn" title="Centro de Notificaciones" aria-label="Notificaciones">
                    <i class="fas fa-bell"></i>
                    <span id="admin-notif-badge" class="admin-notif-badge" style="display: none;">0</span>
                </button>

                <div id="admin-notif-dropdown" class="admin-notif-dropdown">
                    <div class="admin-notif-header">
                        <div class="admin-notif-header-title">
                            <i class="fas fa-bell" style="color: #CCFF00;"></i>
                            <span>Notificaciones</span>
                            <span id="admin-notif-header-count" style="font-size: 0.65rem; background: rgba(204,255,0,0.15); color: #CCFF00; padding: 2px 7px; border-radius: 8px;">0</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button id="admin-notif-refresh-btn" class="btn-micro" title="Actualizar" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:0.85rem;">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button id="admin-notif-close-btn" class="btn-micro" title="Cerrar" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem; line-height:1;">
                                &times;
                            </button>
                        </div>
                    </div>
                    <div id="admin-notif-body" class="admin-notif-body">
                        <div style="padding: 25px 15px; text-align: center; color: #64748b; font-size: 0.8rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 1.3rem; margin-bottom: 8px;"></i>
                            <div>Comprobando notificaciones...</div>
                        </div>
                    </div>
                </div>
            `;

            topActions.prepend(container);

            // Bind clicks
            container.querySelector('#admin-notif-bell-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            container.querySelector('#admin-notif-close-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });

            container.querySelector('#admin-notif-refresh-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const icon = container.querySelector('#admin-notif-refresh-btn i');
                if (icon) icon.classList.add('fa-spin');
                this.fetchNotifications().then(() => {
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                    }, 500);
                });
            });
        }

        setupEventListeners() {
            document.addEventListener('click', (e) => {
                const container = document.getElementById('admin-notif-bell-container');
                if (container && !container.contains(e.target) && this.isOpen) {
                    this.close();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        open() {
            this.isOpen = true;
            const dropdown = document.getElementById('admin-notif-dropdown');
            if (dropdown) dropdown.classList.add('show');
            this.renderNotifications();
        }

        close() {
            this.isOpen = false;
            const dropdown = document.getElementById('admin-notif-dropdown');
            if (dropdown) dropdown.classList.remove('show');
        }

        async fetchNotifications() {
            if (!window.db) return;

            try {
                const items = [];

                // 1. Jugadores pendientes de validación
                const pSnap = await window.db.collection('players').where('status', '==', 'pending').get();
                this.pendingPlayersCount = pSnap.size;

                if (pSnap.size > 0) {
                    const count = pSnap.size;
                    const desc = count === 1
                        ? 'Hay 1 jugador registrado a la espera de validación.'
                        : `Hay ${count} jugadores registrados a la espera de validación.`;

                    items.push({
                        id: 'pending_players',
                        type: 'urgent',
                        icon: 'fa-user-clock',
                        iconColor: '#f59e0b',
                        title: 'Jugadores por Validar',
                        desc: desc,
                        actionLabel: 'VALIDAR AHORA',
                        action: () => {
                            this.close();
                            if (window.loadAdminView) {
                                window.loadAdminView('users').then(() => {
                                    setTimeout(() => {
                                        if (window.togglePendingUsersFilter) window.togglePendingUsersFilter();
                                        else if (window.checkAndApplyPendingFocus) window.checkAndApplyPendingFocus();
                                    }, 200);
                                });
                            }
                        }
                    });
                }

                // 2. Americanas activas con baja ocupación
                const aSnap = await window.db.collection('americanas').where('status', '==', 'active').get();
                aSnap.forEach(doc => {
                    const data = doc.data();
                    const playersCount = (data.players || []).length;
                    const maxPlayers = data.maxPlayers || 16;
                    const pct = Math.round((playersCount / maxPlayers) * 100);

                    if (playersCount / maxPlayers < 0.5) {
                        items.push({
                            id: `low_occ_${doc.id}`,
                            type: 'warning',
                            icon: 'fa-triangle-exclamation',
                            iconColor: '#ef4444',
                            title: 'Baja Ocupación',
                            desc: `"${data.name || 'Americana'}" está al ${pct}% (${playersCount}/${maxPlayers} inscritos).`,
                            actionLabel: 'GESTIONAR',
                            action: () => {
                                this.close();
                                if (window.loadAdminView) window.loadAdminView('americanas_mgmt');
                            }
                        });
                    }
                });

                this.notifications = items;
                this.updateBadge(items.length);
                this.updateSidebarPendingBadge(this.pendingPlayersCount);

                if (this.isOpen) {
                    this.renderNotifications();
                }
            } catch (err) {
                console.warn("🔔 Error fetching admin notifications:", err);
            }
        }

        updateBadge(count) {
            const badge = document.getElementById('admin-notif-badge');
            const headerCount = document.getElementById('admin-notif-header-count');
            if (badge) {
                if (count > 0) {
                    badge.style.display = 'block';
                    badge.textContent = count > 99 ? '99+' : count;
                } else {
                    badge.style.display = 'none';
                }
            }
            if (headerCount) {
                headerCount.textContent = count;
            }
        }

        updateSidebarPendingBadge(count) {
            const sidebarBadge = document.getElementById('sidebar-pending-badge');
            if (sidebarBadge) {
                if (count > 0) {
                    sidebarBadge.style.display = 'inline-block';
                    sidebarBadge.textContent = count;
                } else {
                    sidebarBadge.style.display = 'none';
                }
            }

            const tableCounter = document.getElementById('pending-counter-badge');
            if (tableCounter) {
                tableCounter.textContent = count;
                if (count > 0) {
                    tableCounter.style.background = '#f59e0b';
                } else {
                    tableCounter.style.background = '#64748b';
                }
            }
        }

        updatePendingCount(count) {
            this.pendingPlayersCount = count;
            this.updateSidebarPendingBadge(count);
            // Si el conteo cambió, refrescar lista
            const hasPendingItem = this.notifications.some(n => n.id === 'pending_players');
            if ((count > 0 && !hasPendingItem) || (count === 0 && hasPendingItem)) {
                this.fetchNotifications();
            }
        }

        renderNotifications() {
            const body = document.getElementById('admin-notif-body');
            if (!body) return;

            if (this.notifications.length === 0) {
                body.innerHTML = `
                    <div style="padding: 30px 15px; text-align: center; color: #94a3b8;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; margin-bottom: 10px;"></i>
                        <div style="font-weight: 800; font-size: 0.9rem; color: #fff; margin-bottom: 4px;">Todo al día</div>
                        <div style="font-size: 0.78rem; color: #64748b;">No hay jugadores pendientes ni alertas activas en este momento.</div>
                    </div>
                `;
                return;
            }

            body.innerHTML = '';
            this.notifications.forEach(item => {
                const card = document.createElement('div');
                card.className = `admin-notif-card ${item.type}`;
                card.innerHTML = `
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <div style="font-size: 1.2rem; color: ${item.iconColor}; flex-shrink: 0; padding-top: 2px;">
                            <i class="fas ${item.icon}"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 800; font-size: 0.85rem; color: #fff; margin-bottom: 3px;">${item.title}</div>
                            <div style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.4; margin-bottom: 10px;">${item.desc}</div>
                            <button class="admin-notif-btn primary" id="notif-btn-${item.id}">
                                ${item.actionLabel}
                            </button>
                        </div>
                    </div>
                `;
                card.querySelector(`#notif-btn-${item.id}`).addEventListener('click', () => {
                    if (item.action) item.action();
                });
                body.appendChild(card);
            });
        }
    }

    window.AdminNotifications = new AdminNotificationsManager();
    window.toggleAdminNotifications = () => window.AdminNotifications.toggle();

    // Auto-arranque
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AdminNotifications.init());
    } else {
        window.AdminNotifications.init();
    }
})();
