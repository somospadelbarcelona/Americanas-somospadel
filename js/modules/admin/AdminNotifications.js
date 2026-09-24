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
                /* Broadcast Bar & Modal Styles */
                .admin-broadcast-quick-bar {
                    padding: 10px 12px;
                    background: linear-gradient(135deg, rgba(204, 255, 0, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .admin-broadcast-btn {
                    width: 100%;
                    background: #CCFF00;
                    color: #000;
                    border: none;
                    border-radius: 10px;
                    padding: 9px 12px;
                    font-weight: 900;
                    font-size: 0.78rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: 'Outfit', sans-serif;
                    box-shadow: 0 0 14px rgba(204, 255, 0, 0.3);
                    transition: all 0.2s ease;
                }
                .admin-broadcast-btn:hover {
                    background: #d4ff1a;
                    transform: translateY(-1px);
                    box-shadow: 0 0 18px rgba(204, 255, 0, 0.5);
                }
                .sp-broadcast-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    box-sizing: border-box;
                }
                .sp-broadcast-overlay.show {
                    opacity: 1;
                    pointer-events: auto;
                }
                .sp-broadcast-modal {
                    width: 100%;
                    max-width: 520px;
                    background: #0f172a;
                    border: 1px solid rgba(204, 255, 0, 0.3);
                    border-radius: 20px;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(204, 255, 0, 0.12);
                    overflow: hidden;
                    transform: translateY(12px) scale(0.96);
                    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    box-sizing: border-box;
                }
                .sp-broadcast-overlay.show .sp-broadcast-modal {
                    transform: translateY(0) scale(1);
                }
                .sp-broadcast-modal-header {
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .sp-broadcast-close-btn {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.4rem;
                    cursor: pointer;
                    line-height: 1;
                    transition: color 0.15s;
                }
                .sp-broadcast-close-btn:hover {
                    color: #fff;
                }
                .sp-broadcast-chip {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #cbd5e1;
                    border-radius: 8px;
                    padding: 5px 10px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s;
                    font-family: 'Outfit', sans-serif;
                }
                .sp-broadcast-chip:hover {
                    background: rgba(204, 255, 0, 0.15);
                    border-color: rgba(204, 255, 0, 0.4);
                    color: #CCFF00;
                }
                .sp-broadcast-input, .sp-broadcast-textarea {
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    padding: 10px 14px;
                    color: #fff;
                    font-size: 0.82rem;
                    font-family: inherit;
                    outline: none;
                    transition: all 0.2s;
                }
                .sp-broadcast-input:focus, .sp-broadcast-textarea:focus {
                    border-color: #CCFF00;
                    box-shadow: 0 0 12px rgba(204, 255, 0, 0.2);
                    background: rgba(255, 255, 255, 0.08);
                }
                .sp-broadcast-url-tag {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    border-radius: 6px;
                    padding: 2px 7px;
                    font-size: 0.68rem;
                    cursor: pointer;
                    font-family: monospace;
                    transition: all 0.15s;
                }
                .sp-broadcast-url-tag:hover {
                    background: rgba(204, 255, 0, 0.12);
                    color: #CCFF00;
                    border-color: rgba(204, 255, 0, 0.3);
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
                    <div class="admin-broadcast-quick-bar">
                        <button type="button" id="admin-open-broadcast-modal-btn" class="admin-broadcast-btn" title="Emitir Comunicado Push a Todos">
                            <i class="fas fa-bullhorn"></i>
                            <span>📢 Emitir Comunicado Push a Todos</span>
                        </button>
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

            const broadcastBtn = container.querySelector('#admin-open-broadcast-modal-btn');
            if (broadcastBtn) {
                broadcastBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.close();
                    this.openBroadcastModal();
                });
            }

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

        /**
         * Abre el modal interactivo de emisión de comunicados push globales
         */
        openBroadcastModal() {
            const existingModal = document.getElementById('admin-broadcast-modal-overlay');
            if (existingModal) existingModal.remove();

            const overlay = document.createElement('div');
            overlay.id = 'admin-broadcast-modal-overlay';
            overlay.className = 'sp-broadcast-overlay';

            const templates = {
                americana: {
                    title: '🎾 ¡Nueva Americana disponible en SomosPadel!',
                    body: 'Se acaban de abrir plazas para una nueva americana. ¡Inscríbete antes de que se agoten!',
                    url: 'americanas'
                },
                entreno: {
                    title: '⚡ ¡Nuevo Entreno Táctico publicado!',
                    body: 'Plazas abiertas para sesión de entreno y perfeccionamiento técnico por niveles.',
                    url: 'entrenos'
                },
                comunicado: {
                    title: '📢 Comunicado Oficial SomosPadel',
                    body: 'Información importante sobre el club y los próximos eventos de la semana.',
                    url: 'dashboard'
                },
                torneo: {
                    title: '🏆 ¡Nueva Convocatoria de Torneo!',
                    body: 'Consulta las bases y asegura la plaza de tu pareja en el próximo torneo oficial del club.',
                    url: 'torneos'
                }
            };

            overlay.innerHTML = `
                <div class="sp-broadcast-modal">
                    <!-- HEADER -->
                    <div class="sp-broadcast-modal-header">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(204, 255, 0, 0.15); display: flex; align-items: center; justify-content: center; color: #CCFF00; font-size: 1.15rem; box-shadow: 0 0 15px rgba(204, 255, 0, 0.2);">
                                <i class="fas fa-bullhorn"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 0.95rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">📢 EMITIR COMUNICADO PUSH A TODOS</h3>
                                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Notificación instantánea a los teléfonos de todos los jugadores del club</div>
                            </div>
                        </div>
                        <button id="sp-broadcast-close-btn" class="sp-broadcast-close-btn" title="Cerrar">&times;</button>
                    </div>

                    <!-- TEMPLATE CHIPS -->
                    <div style="padding: 14px 20px 0 20px;">
                        <div style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">Plantillas Rápidas:</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button type="button" class="sp-broadcast-chip" data-template="americana">🎾 Nueva Americana</button>
                            <button type="button" class="sp-broadcast-chip" data-template="entreno">⚡ Nuevo Entreno</button>
                            <button type="button" class="sp-broadcast-chip" data-template="comunicado">📢 Comunicado Club</button>
                            <button type="button" class="sp-broadcast-chip" data-template="torneo">🏆 Torneo Especial</button>
                        </div>
                    </div>

                    <!-- FORM BODY -->
                    <form id="sp-broadcast-form" style="padding: 16px 20px 20px 20px; display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #e2e8f0; margin-bottom: 6px;">
                                TÍTULO DEL COMUNICADO <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="text" id="sp-broadcast-title" class="sp-broadcast-input" placeholder="Ej: ⚡ ¡Nueva Americana Viernes Noche!" required maxlength="90" />
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #e2e8f0; margin-bottom: 6px;">
                                CUERPO DEL MENSAJE (PUSH + BANDEJA) <span style="color: #ef4444;">*</span>
                            </label>
                            <textarea id="sp-broadcast-body" class="sp-broadcast-textarea" rows="3" placeholder="Describe brevemente el anuncio para los jugadores..." required maxlength="250"></textarea>
                            <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                                <span id="sp-broadcast-chars" style="font-size: 0.68rem; color: #64748b;">0/250</span>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #e2e8f0; margin-bottom: 6px;">
                                DESTINO / ENLACE AL PULSAR
                            </label>
                            <input type="text" id="sp-broadcast-url" class="sp-broadcast-input" value="americanas" placeholder="americanas, entrenos, dashboard o URL completa" />
                            <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; align-items: center;">
                                <span style="font-size: 0.68rem; color: #64748b;">Sugerencias:</span>
                                <button type="button" class="sp-broadcast-url-tag" data-url="americanas">americanas</button>
                                <button type="button" class="sp-broadcast-url-tag" data-url="entrenos">entrenos</button>
                                <button type="button" class="sp-broadcast-url-tag" data-url="ranking">ranking</button>
                                <button type="button" class="sp-broadcast-url-tag" data-url="dashboard">dashboard</button>
                            </div>
                        </div>

                        <!-- AUDIENCE INFO -->
                        <div style="padding: 10px 14px; background: rgba(204, 255, 0, 0.05); border: 1px solid rgba(204, 255, 0, 0.15); border-radius: 12px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-users" style="color: #CCFF00; font-size: 1.1rem; flex-shrink: 0;"></i>
                            <div style="font-size: 0.73rem; color: #cbd5e1; line-height: 1.35;">
                                <strong style="color: #fff;">Audiencia:</strong> Todos los jugadores registrados en SomosPadel.<br>
                                Se registrará en la colección <code style="color: #CCFF00; background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 4px;">broadcasts</code> y se enviará notificación push.
                            </div>
                        </div>

                        <!-- ACTIONS -->
                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                            <button type="button" id="sp-broadcast-cancel-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; padding: 10px 16px; border-radius: 12px; font-weight: 800; font-size: 0.78rem; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.15s;">
                                CANCELAR
                            </button>
                            <button type="submit" id="sp-broadcast-submit-btn" style="background: #CCFF00; color: #000; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 900; font-size: 0.8rem; cursor: pointer; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 18px rgba(204, 255, 0, 0.4); transition: transform 0.15s ease;">
                                <i class="fas fa-paper-plane"></i>
                                <span>🚀 EMITIR PUSH AHORA</span>
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('show'), 10);

            // Bind Elements
            const titleInput = overlay.querySelector('#sp-broadcast-title');
            const bodyInput = overlay.querySelector('#sp-broadcast-body');
            const urlInput = overlay.querySelector('#sp-broadcast-url');
            const charsCounter = overlay.querySelector('#sp-broadcast-chars');
            const submitBtn = overlay.querySelector('#sp-broadcast-submit-btn');

            const closeModal = () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 250);
            };

            overlay.querySelector('#sp-broadcast-close-btn').addEventListener('click', closeModal);
            overlay.querySelector('#sp-broadcast-cancel-btn').addEventListener('click', closeModal);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });

            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            // Live Char counter
            bodyInput.addEventListener('input', () => {
                charsCounter.textContent = `${bodyInput.value.length}/250`;
            });

            // Template Chips click
            overlay.querySelectorAll('.sp-broadcast-chip').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tmplKey = btn.dataset.template;
                    const tmpl = templates[tmplKey];
                    if (tmpl) {
                        titleInput.value = tmpl.title;
                        bodyInput.value = tmpl.body;
                        urlInput.value = tmpl.url;
                        charsCounter.textContent = `${bodyInput.value.length}/250`;
                        titleInput.focus();
                    }
                });
            });

            // URL Tags click
            overlay.querySelectorAll('.sp-broadcast-url-tag').forEach(btn => {
                btn.addEventListener('click', () => {
                    urlInput.value = btn.dataset.url;
                });
            });

            // Form Submit
            overlay.querySelector('#sp-broadcast-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                const title = titleInput.value.trim();
                const body = bodyInput.value.trim();
                const url = urlInput.value.trim() || 'dashboard';

                if (!title || !body) return;

                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>EMITIENDO PUSH...</span>`;

                try {
                    await this.submitBroadcast(title, body, url);
                    closeModal();

                    if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                        window.NotificationService.showToast("📢 Comunicado push emitido con éxito a todos los jugadores.", "success");
                    }

                    if (window.PremiumModal && typeof window.PremiumModal.alert === 'function') {
                        window.PremiumModal.alert({
                            title: "📢 COMUNICADO ENVIADO",
                            message: "El comunicado se ha guardado en 'broadcasts' y enviado a todos los jugadores del club.",
                            type: 'success'
                        });
                    }
                } catch (err) {
                    console.error("❌ [AdminNotifications] Error emitiendo broadcast:", err);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> <span>🚀 REINTENTAR ENVÍO</span>`;
                    alert("Error al emitir el comunicado: " + (err.message || err));
                }
            });
        }

        /**
         * Guarda el comunicado en la colección 'broadcasts' y activa el fan-out de notificaciones
         */
        async submitBroadcast(title, body, url) {
            if (!window.db) {
                throw new Error("Base de datos Firestore no disponible.");
            }

            const currentUser = (window.Store && window.Store.getState('currentUser')) || window.auth?.currentUser || {};
            const authorName = currentUser.name || currentUser.displayName || 'Administración SomosPadel';
            const authorId = currentUser.uid || 'admin';
            const targetUrl = url ? url.trim() : 'dashboard';
            const timestamp = (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : new Date();

            // 1. Guardar documento en la colección 'broadcasts' (título, cuerpo, url, timestamp)
            const broadcastPayload = {
                title: title.trim(),
                body: body.trim(),
                url: targetUrl,
                timestamp: timestamp,
                createdAt: new Date().toISOString(),
                authorName: authorName,
                createdBy: authorId,
                status: 'published',
                type: 'broadcast'
            };

            const broadcastRef = await window.db.collection('broadcasts').add(broadcastPayload);
            console.log("📢 [AdminNotifications] Documento guardado en 'broadcasts':", broadcastRef.id);

            // 2. Replicar a la subcolección de notificaciones de todos los jugadores
            // para activar tanto el Cloud Function Push (FCM multi-dispositivo) como la bandeja in-app
            try {
                const playersSnap = await window.db.collection('players').get();
                if (!playersSnap.empty) {
                    const batches = [];
                    let currentBatch = window.db.batch();
                    let opCount = 0;

                    playersSnap.docs.forEach(pDoc => {
                        const notifRef = window.db.collection('players').doc(pDoc.id).collection('notifications').doc();
                        currentBatch.set(notifRef, {
                            title: title.trim(),
                            body: body.trim(),
                            read: false,
                            timestamp: timestamp,
                            icon: 'bullhorn',
                            data: {
                                url: targetUrl,
                                broadcastId: broadcastRef.id
                            }
                        });
                        opCount++;
                        if (opCount >= 450) {
                            batches.push(currentBatch.commit());
                            currentBatch = window.db.batch();
                            opCount = 0;
                        }
                    });

                    if (opCount > 0) {
                        batches.push(currentBatch.commit());
                    }
                    await Promise.all(batches);
                    console.log(`📢 [AdminNotifications] Replicado a ${playersSnap.size} jugadores con éxito.`);
                }
            } catch (err) {
                console.warn("⚠️ [AdminNotifications] Error en fan-out de jugadores:", err);
            }

            return broadcastRef.id;
        }
    }

    window.AdminNotifications = new AdminNotificationsManager();
    window.toggleAdminNotifications = () => window.AdminNotifications.toggle();
    window.emitAdminBroadcast = () => window.AdminNotifications.openBroadcastModal();

    // Auto-arranque
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AdminNotifications.init());
    } else {
        window.AdminNotifications.init();
    }
})();
