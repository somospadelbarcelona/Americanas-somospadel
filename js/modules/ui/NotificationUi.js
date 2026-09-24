/**
 * NotificationUi.js - SOMOSPADEL BCN (CLEAN LUXURY WHITE EDITION)
 * 
 * Centro de Notificaciones Profesional con Fondo Blanco,
 * Alta Legibilidad, Distinción Estricta entre Americanas y Entrenos,
 * Icono Oficial de Pala de Pádel para Entrenos y Detección de Sedes
 */

const PALA_ICON_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="display:inline-block;vertical-align:middle;"><g transform="rotate(35, 12, 12)"><path fill-rule="evenodd" d="M 12 1.2 C 6.5 1.2 4.2 4.6 4.2 9.2 C 4.2 12.3 6.3 14.7 9.2 15.6 L 9.2 16.5 L 10.4 16.5 L 10.4 22.0 L 9.6 22.0 C 9.1 22.0 8.8 22.3 8.8 22.8 C 8.8 23.3 9.1 23.7 9.6 23.7 L 14.4 23.7 C 14.9 23.7 15.2 23.3 15.2 22.8 C 15.2 22.3 14.9 22.0 14.4 22.0 L 13.6 22.0 L 13.6 16.5 L 14.8 16.5 L 14.8 15.6 C 17.7 14.7 19.8 12.3 19.8 9.2 C 19.8 4.6 17.5 1.2 12 1.2 Z M 12 13.2 L 10.4 15.4 L 13.6 15.4 Z M 12 5.0 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 9.8 7.1 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 12 7.1 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 14.2 7.1 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 8.4 9.2 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 10.8 9.2 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 13.2 9.2 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 15.6 9.2 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 9.8 11.3 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 12 11.3 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0 M 14.2 11.3 m -0.75,0 a 0.75,0.75 0 1,0 1.5,0 a 0.75,0.75 0 1,0 -1.5,0"/><path d="M 11.2 23.7 C 11.2 25.2 12.8 25.2 12.8 23.7" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/></g></svg>`;

class NotificationUi {
    constructor() {
        this.isOpen = false;
        this.activeFilter = 'all'; // 'all', 'matches', 'entrenos', 'broadcast', 'chat'
        this.lastCount = 0;
        this._isTransitioning = false;
        this._audioCtx = null;
        this._soundEnabled = (typeof localStorage !== 'undefined' && localStorage.getItem('sp_notif_sound_enabled') === 'false') ? false : true;
        this._bindService();
    }

    _bindService() {
        const attach = (service) => {
            if (service && typeof service.onUpdate === 'function') {
                service.onUpdate((data) => {
                    if (this.isOpen) {
                        this.renderList();
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
            if (badge) {
                badge.style.display = 'flex';
                badge.innerText = displayCount;
            }
            if (bell) {
                bell.classList.remove('shake-animation');
                void bell.offsetWidth;
                bell.classList.add('shake-animation');
            }
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
            if (badge) badge.style.display = 'none';
            if (bell) bell.classList.remove('shake-animation');
            if (drawerBadge) drawerBadge.style.display = 'none';
            if (drawerBell) drawerBell.classList.remove('shake-animation');
        }
    }

    toggle() {
        if (this._isTransitioning) return;
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        if (this.isOpen || this._isTransitioning) return;
        this._isTransitioning = true;
        this.isOpen = true;

        if (window.PlayerView?.haptic) {
            window.PlayerView.haptic(15);
        } else if (navigator.vibrate) {
            try { navigator.vibrate(15); } catch (_) {}
        }

        if (typeof window._closeUserDropdown === 'function') window._closeUserDropdown();
        if (typeof window.closeDrawer === 'function') window.closeDrawer();

        const existingOverlay = document.getElementById('notif-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'notif-overlay';
        overlay.className = 'notif-overlay-backdrop';

        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'notif-overlay') this.close();
        });

        const drawer = document.createElement('div');
        drawer.id = 'notif-drawer';
        drawer.className = 'notif-drawer-panel light-mode-clean';

        const isAdmin = Boolean(window.Store?.getState('currentUser')?.role?.includes('admin'));

        drawer.innerHTML = `
            <!-- HEADER BLANCO LIMPIO -->
            <div class="notif-header-pro">
                <div class="notif-header-left">
                    <div class="notif-bell-icon-badge">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div>
                        <div class="notif-header-sub">CENTRO DE ALERTAS</div>
                        <h3 class="notif-header-main-title">NOTIFICACIONES</h3>
                    </div>
                </div>

                <div class="notif-header-actions-pro">
                    <!-- Toggle Sonido -->
                    <button type="button" class="notif-icon-btn" id="btn-toggle-notif-sound" onclick="window.NotificationUi.toggleSound()" title="Silenciar / Activar sonido">
                        <i class="fas ${this._soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}" style="${this._soundEnabled ? 'color:#0284c7;' : 'color:#94a3b8;'}"></i>
                    </button>

                    <!-- Marcar todo leído -->
                    <button type="button" class="notif-icon-btn" onclick="window.NotificationUi.markAllRead()" title="Marcar todo como leído">
                        <i class="fas fa-check-double"></i>
                    </button>

                    <!-- Borrar historial -->
                    <button type="button" class="notif-icon-btn" onclick="window.NotificationUi.deleteAllMy()" title="Vaciar mi bandeja">
                        <i class="fas fa-trash-can"></i>
                    </button>

                    ${isAdmin ? `
                    <!-- SuperAdmin Limpieza Global -->
                    <button type="button" class="notif-icon-btn danger" onclick="window.NotificationUi.confirmGlobalClear()" title="Limpieza Global (Admin)">
                        <i class="fas fa-radiation"></i>
                    </button>` : ''}

                    <!-- Cerrar Drawer -->
                    <button type="button" class="notif-close-btn" onclick="window.NotificationUi.close()" title="Cerrar panel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- PUSH PERMISSION BANNER -->
            <div id="push-permission-box"></div>

            <!-- FILTROS POR CATEGORÍA -->
            <div class="notif-filter-tabs-bar" id="notif-filter-bar">
                <button type="button" class="notif-tab-chip active" data-filter="all" onclick="window.NotificationUi.setFilter('all')">
                    <i class="fas fa-bolt"></i> Todas
                </button>
                <button type="button" class="notif-tab-chip" data-filter="matches" onclick="window.NotificationUi.setFilter('matches')">
                    <i class="fas fa-trophy"></i> Americanas
                </button>
                <button type="button" class="notif-tab-chip" data-filter="entrenos" onclick="window.NotificationUi.setFilter('entrenos')">
                    ${PALA_ICON_SVG} Entrenos
                </button>
                <button type="button" class="notif-tab-chip" data-filter="broadcast" onclick="window.NotificationUi.setFilter('broadcast')">
                    <i class="fas fa-bullhorn"></i> Avisos Club
                </button>
                <button type="button" class="notif-tab-chip" data-filter="chat" onclick="window.NotificationUi.setFilter('chat')">
                    <i class="fas fa-comment-dots"></i> Chat
                </button>
            </div>

            <!-- LISTA DE NOTIFICACIONES (FONDO BLANCO) -->
            <div id="notif-list" class="notif-scrollable-list">
                <div class="notif-loading-state">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <div>Sincronizando notificaciones...</div>
                </div>
            </div>

            <!-- FOOTER CON SIMULADOR EN VIVO -->
            <div class="notif-footer-sim">
                <span class="notif-footer-sim-label">⚡ PROBAR EN VIVO:</span>
                <div class="notif-footer-sim-btns">
                    <button type="button" onclick="window.NotificationUi.testNotification('match')" class="notif-sim-chip match" title="Simular aviso de Americana">
                        <i class="fas fa-trophy"></i> Americana
                    </button>
                    <button type="button" onclick="window.NotificationUi.testNotification('entreno')" class="notif-sim-chip entreno" title="Simular aviso de Entreno">
                        ${PALA_ICON_SVG} Entreno
                    </button>
                    <button type="button" onclick="window.NotificationUi.testNotification('clima')" class="notif-sim-chip clima" title="Simular radar de pistas">
                        <i class="fas fa-cloud-sun"></i> Clima
                    </button>
                    <button type="button" onclick="window.NotificationUi.testNotification('broadcast')" class="notif-sim-chip broadcast" title="Simular comunicado oficial">
                        <i class="fas fa-bullhorn"></i> Aviso
                    </button>
                </div>
            </div>
        `;

        overlay.appendChild(drawer);
        document.body.appendChild(overlay);
        document.body.classList.add('notif-drawer-open');

        requestAnimationFrame(() => {
            overlay.classList.add('show');
            setTimeout(() => { this._isTransitioning = false; }, 300);
        });

        this._escapeHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this._escapeHandler);

        this.renderPushPermissionBox();
        this.renderList();
    }

    close() {
        if (!this.isOpen || this._isTransitioning) return;
        this._isTransitioning = true;
        this.isOpen = false;

        const overlay = document.getElementById('notif-overlay');
        document.body.classList.remove('notif-drawer-open');

        if (this._escapeHandler) {
            document.removeEventListener('keydown', this._escapeHandler);
            this._escapeHandler = null;
        }

        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                this._isTransitioning = false;
            }, 300);
        } else {
            this._isTransitioning = false;
        }
    }

    setFilter(filterName) {
        this.activeFilter = filterName;
        document.querySelectorAll('.notif-tab-chip').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filterName);
        });
        this.renderList();
    }

    toggleSound() {
        this._soundEnabled = !this._soundEnabled;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('sp_notif_sound_enabled', String(this._soundEnabled));
        }

        const icon = document.querySelector('#btn-toggle-notif-sound i');
        if (icon) {
            icon.className = `fas ${this._soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`;
            icon.style.color = this._soundEnabled ? '#0284c7' : '#94a3b8';
        }

        if (this._soundEnabled) {
            this.playNotificationSound();
        }
    }

    playNotificationSound() {
        if (!this._soundEnabled) return;
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

            const tones = [
                { freq: 523.25, time: 0.00, dur: 0.18, gain: 0.25 }, // Do5
                { freq: 783.99, time: 0.08, dur: 0.35, gain: 0.30 }  // Sol5
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
            console.warn("⚠️ [NotificationUi] Fallo de audio:", e);
        }
    }

    renderPushPermissionBox() {
        const box = document.getElementById('push-permission-box');
        if (!box) return;

        const notificationSupported = 'Notification' in window;
        const permission = notificationSupported ? Notification.permission : 'default';

        if (permission === 'granted') {
            box.className = 'notif-perm-box-granted';
            box.innerHTML = `
                <div class="notif-perm-status-row">
                    <div class="notif-perm-badge-ok">
                        <i class="fas fa-circle-check"></i>
                        <span>ALERTAS PUSH ACTIVADAS EN ESTE MÓVIL</span>
                    </div>
                    <span class="notif-perm-pill">🟢 ONLINE</span>
                </div>
            `;
            return;
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        box.className = 'notif-perm-box-prompt';
        box.innerHTML = `
            <div class="notif-perm-header">
                <div class="notif-perm-title">
                    <i class="fas fa-bolt"></i>
                    <span>RECIBE AVISOS EN TU MÓVIL</span>
                </div>
                ${permission === 'denied' ? `
                    <span class="notif-perm-denied-tag">⚠️ Permiso Bloqueado</span>
                ` : `
                    <span class="notif-perm-off-tag">🔴 Desactivado</span>
                `}
            </div>

            <div class="notif-perm-body">
                Entérate al instante cuando haya <strong>nuevas americanas</strong>, <strong>entrenos de tu nivel</strong> o <strong>plazas libres</strong>.
            </div>

            ${(isIOS && !isStandalone) ? `
                <button type="button" class="notif-perm-btn-activate" onclick="window.NotificationUi.showIOSInstructions()">
                    <i class="fas fa-arrow-up-from-bracket"></i> AÑADIR A PANTALLA DE INICIO (IPHONE)
                </button>
            ` : `
                <button type="button" class="notif-perm-btn-activate" onclick="window.NotificationUi.requestPushActivation()">
                    <i class="fas fa-bell"></i> ACTIVAR NOTIFICACIONES PUSH AHORA
                </button>
            `}
        `;
    }

    async requestPushActivation() {
        if (window.NotificationService) {
            try {
                await window.NotificationService.requestPushPermission();
            } catch (err) {
                console.error('[NotifUI] Error solicitando permisos push:', err);
            }
            // Siempre re-renderizar tras cualquier respuesta (granted, denied, dismissed)
            setTimeout(() => {
                this.renderPushPermissionBox();
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    this.playNotificationSound();
                    if (window.NotificationService && window.NotificationService.showInAppToast) {
                        window.NotificationService.showInAppToast(
                            '🔔 ¡Alertas Activadas!',
                            'Recibirás avisos incluso con la app cerrada.',
                            'success'
                        );
                    }
                }
            }, 400);
        }
    }

    showIOSInstructions() {
        if (window.PremiumModal) {
            window.PremiumModal.alert({
                title: "📲 ACTIVAR EN TU IPHONE",
                message: `
                    Para recibir notificaciones con la pantalla bloqueada en tu iPhone:<br><br>
                    <strong>1.</strong> Pulsa el botón <strong>Compartir</strong> (cuadrado con flecha azul abajo).<br>
                    <strong>2.</strong> Elige <strong>'Añadir a pantalla de inicio'</strong> 📲.<br>
                    <strong>3.</strong> Abre SomosPadel desde tu icono y pulsa <strong>'Activar Notificaciones'</strong>.
                `,
                type: 'info'
            });
        }
    }

    renderList() {
        const container = document.getElementById('notif-list');
        if (!container) return;

        let rawItems = window.NotificationService ? window.NotificationService.getMergedNotifications() : [];
        const items = rawItems.map(item => this._normalizeNotificationItem(item));

        // Aplicar filtro seleccionado
        let filteredItems = items;
        if (this.activeFilter === 'matches') {
            filteredItems = items.filter(n => n.category === 'matches');
        } else if (this.activeFilter === 'entrenos') {
            filteredItems = items.filter(n => n.category === 'entrenos');
        } else if (this.activeFilter === 'broadcast') {
            filteredItems = items.filter(n => n.category === 'broadcast' || n.category === 'clima');
        } else if (this.activeFilter === 'chat') {
            filteredItems = items.filter(n => n.category === 'chat');
        }

        if (filteredItems.length === 0) {
            container.innerHTML = `
                <div class="notif-empty-state">
                    <div class="notif-empty-icon-wrap">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <div class="notif-empty-title">BANDEJA AL DÍA</div>
                    <div class="notif-empty-desc">
                        ${this.activeFilter === 'all' ? 'No tienes alertas pendientes. ¡Todo listo para tu próximo partido!' : 'No hay avisos en esta categoría.'}
                    </div>
                </div>
            `;
            return;
        }

        // Agrupación por fechas (Hoy, Ayer, Anteriores)
        const groups = { "Hoy": [], "Ayer": [], "Anteriores": [] };
        const now = new Date();
        const todayStr = now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        filteredItems.forEach(item => {
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

            html += `<div class="notif-date-divider"><span>${groupName} (${groupItems.length})</span></div>`;

            html += groupItems.map(item => {
                const unreadClass = item.read ? '' : 'unread';
                const tag = item.tag;

                // Renderizado del icono: SVG de Pala de pádel o Icono FontAwesome
                const iconContent = tag.isSvg ? tag.svgIcon : `<i class="fas ${tag.icon}"></i>`;
                const badgeIconContent = tag.isSvg ? tag.svgIcon : `<i class="fas ${tag.icon}"></i>`;

                return `
                    <div class="notif-card-row ${unreadClass} ${tag.cardThemeClass}" onclick="window.NotificationUi.handleItemClick('${item.id}', '${item.actionUrl}', '${item.eventId}', '${item.action}')">
                        
                        <!-- Columna Izquierda: Icono Deportivo Destacado -->
                        <div class="notif-card-avatar ${tag.cssClass}">
                            ${iconContent}
                        </div>

                        <!-- Columna Central: Contenido Principal -->
                        <div class="notif-card-center">
                            <div class="notif-card-top-meta">
                                <span class="notif-card-badge-pill ${tag.cssClass}">
                                    ${badgeIconContent} <span>${tag.label}</span>
                                </span>
                                <span class="notif-card-time-text">${item.timeFormatted}</span>
                            </div>

                            <h4 class="notif-card-title-text">${item.title}</h4>
                            <p class="notif-card-desc-text">${item.body}</p>

                            <!-- Chips de Sede Real y Detalles -->
                            <div class="notif-card-meta-chips">
                                <span class="notif-meta-chip sede"><i class="fas fa-location-dot"></i> ${item.sede}</span>
                                ${item.metaPills ? item.metaPills.map(p => `<span class="notif-meta-chip"><i class="fas ${p.icon}"></i> ${p.text}</span>`).join('') : ''}
                            </div>

                            <!-- Botón de Acción Directa -->
                            <div class="notif-card-actions-row">
                                <span class="notif-card-action-btn ${tag.cssClass}">
                                    <span>${item.actionLabel}</span>
                                    <i class="fas fa-arrow-right"></i>
                                </span>
                            </div>
                        </div>

                        <!-- Columna Derecha: Botón de Borrar e Indicador de No Leído -->
                        <div class="notif-card-right-tools">
                            ${!item.read ? `<span class="notif-unread-dot"></span>` : ''}
                            <button type="button" class="notif-card-del-btn" onclick="window.NotificationUi.handleDeleteOne('${item.id}', event)" title="Eliminar notificación">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        });

        container.innerHTML = html;
    }

    _normalizeNotificationItem(item) {
        if (!item) item = {};

        const rawTitle = String(item.title || item.name || item.eventName || item.senderName || item.subject || '').trim();
        const rawBody = String(item.body || item.message || item.text || item.description || item.subtitle || '').trim();
        const rawUrl = item.data?.url || (item.url) || '';
        const eventId = item.data?.eventId || item.eventId || '';
        const action = item.data?.action || item.action || '';
        const rawType = String(item.type || item.category || '').toLowerCase();

        const fullText = `${rawTitle} ${rawBody} ${rawUrl} ${rawType}`.toLowerCase();

        let category = 'default';
        let tag = { label: 'SOMOSPADEL', icon: 'fa-bell', isSvg: false, cssClass: 'tag-default', cardThemeClass: 'theme-default' };
        let actionLabel = 'VER DETALLES';
        let defaultTitle = 'Aviso de SomosPadel';
        let defaultBody = 'Tienes una nueva actualización en tu cuenta de juego.';
        let actionUrl = rawUrl;
        let metaPills = [];

        // -------------------------------------------------------------
        // 1. DETECCIÓN PRECISA DE SEDE / UBICACIÓN
        // -------------------------------------------------------------
        let sede = 'Sede Cornellà';
        if (fullText.includes('prat') || fullText.includes('el prat')) {
            sede = 'Sede El Prat';
        } else if (fullText.includes('delfos') || fullText.includes('cornell')) {
            sede = 'Sede Cornellà';
        } else if (fullText.includes('hospitalet')) {
            sede = 'Sede Hospitalet';
        } else if (fullText.includes('poblenou')) {
            sede = 'Sede Poblenou';
        } else if (fullText.includes('sant boi')) {
            sede = 'Sede Sant Boi';
        }

        // -------------------------------------------------------------
        // 2. CLASIFICACIÓN ESTRICTA: ENTRENOS vs AMERICANAS
        // -------------------------------------------------------------
        
        // A. PRIORIDAD 1: ENTRENOS (Usa Pala Oficial de Pádel)
        if (fullText.includes('entreno') || fullText.includes('entrenamiento') || fullText.includes('coach') || rawType === 'entreno' || rawUrl === 'entrenos') {
            category = 'entrenos';
            tag = { label: 'ENTRENO', isSvg: true, svgIcon: PALA_ICON_SVG, cssClass: 'tag-entreno', cardThemeClass: 'theme-entreno' };
            actionLabel = '💪 VER SESIÓN DE ENTRENO';
            actionUrl = 'entrenos';
            defaultTitle = '💪 Convocatoria de Entreno';
            defaultBody = 'Sesión técnica y táctica en pista para mejorar tu nivel.';
            metaPills.push({ icon: 'fa-star', text: 'Entreno Nivel' });
        }
        // B. PRIORIDAD 2: AMERICANAS Y TORNEOS (Usa Copa Trofeo)
        else if (fullText.includes('americana') || fullText.includes('torneo') || rawType === 'americana' || rawUrl === 'americanas' || rawUrl === 'live' || eventId) {
            category = 'matches';
            tag = { label: 'AMERICANAS', icon: 'fa-trophy', isSvg: false, cssClass: 'tag-americana', cardThemeClass: 'theme-americana' };
            actionLabel = '🎾 VER TORNEO AMERICANAS';
            actionUrl = 'americanas';
            defaultTitle = '🏆 Torneo Americana Confirmado';
            defaultBody = 'Inscripción activa y cuadro de pistas preparado para competir.';
            metaPills.push({ icon: 'fa-stopwatch', text: 'En Vivo' });
        }
        // C. PRIORIDAD 3: RADAR Y CLIMA DE PISTAS
        else if (fullText.includes('clima') || fullText.includes('radar') || fullText.includes('viento') || fullText.includes('lluvia') || rawUrl === 'clima') {
            category = 'clima';
            tag = { label: 'RADAR & CLIMA', icon: 'fa-cloud-sun', isSvg: false, cssClass: 'tag-clima', cardThemeClass: 'theme-clima' };
            actionLabel = '🌦️ VER RADAR PISTAS';
            actionUrl = 'clima';
            defaultTitle = '🌦️ Radar Táctico y Clima de Pistas';
            defaultBody = 'Telemetría de viento, lluvia y estado de pistas en Cornellà y El Prat.';
            metaPills.push({ icon: 'fa-wind', text: 'Viento Óptimo' });
        }
        // D. PRIORIDAD 4: CHAT EN VIVO
        else if (item.isChat || fullText.includes('chat') || String(item.id || '').startsWith('chat_')) {
            category = 'chat';
            tag = { label: 'CHAT DEL CLUB', icon: 'fa-comment-dots', isSvg: false, cssClass: 'tag-chat', cardThemeClass: 'theme-chat' };
            actionLabel = '💬 IR AL CHAT';
            actionUrl = 'chat';
            defaultTitle = '💬 Mensaje de la Comunidad';
            defaultBody = 'Nuevos mensajes en el canal del torneo.';
        }
        // E. PRIORIDAD 5: COMUNICADOS OFICIALES
        else if (fullText.includes('comunicado') || fullText.includes('aviso') || fullText.includes('oficial') || fullText.includes('urgente') || fullText.includes('noticia')) {
            category = 'broadcast';
            tag = { label: 'COMUNICADO', icon: 'fa-bullhorn', isSvg: false, cssClass: 'tag-broadcast', cardThemeClass: 'theme-broadcast' };
            actionLabel = '📢 LEER COMUNICADO';
            actionUrl = 'dashboard';
            defaultTitle = '📢 Comunicado Oficial SomosPadel';
            defaultBody = 'Información importante de la organización y calendario del club.';
        }

        const finalTitle = rawTitle.length > 0 ? rawTitle : defaultTitle;
        const finalBody = rawBody.length > 0 ? rawBody : defaultBody;

        return {
            id: item.id || `notif_${Date.now()}`,
            title: finalTitle,
            body: finalBody,
            read: Boolean(item.read),
            timestamp: item.timestamp,
            timeFormatted: this.timeAgo(item.timestamp),
            category,
            tag,
            sede,
            actionLabel,
            actionUrl: actionUrl || rawUrl,
            eventId,
            action,
            metaPills: metaPills.length > 0 ? metaPills : null
        };
    }

    handleItemClick(id, actionUrl, eventId, action) {
        if (window.NotificationService) {
            window.NotificationService.markAsRead(id);
        }

        this.close();

        if (actionUrl) {
            if (window.Router) {
                window.Router.navigate(actionUrl);
            } else {
                window.location.hash = `#${actionUrl}`;
            }
            return;
        }

        if (eventId) {
            if (window.EventsController && window.EventsController.openLiveEvent) {
                window.EventsController.openLiveEvent(eventId, 'americana', action);
            } else if (window.Router) {
                window.Router.navigate('live', { eventId, action });
            }
        }
    }

    handleDeleteOne(id, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (window.NotificationService) {
            window.NotificationService.deleteNotification(id);
        }
    }

    markAllRead() {
        if (window.NotificationService) {
            window.NotificationService.markAllAsRead();
            this.updateBadge(0);
        }
    }

    async deleteAllMy() {
        if (!window.NotificationService) return;
        const confirm = await window.PremiumModal?.confirm({
            title: "VACIAR BANDEJA",
            message: "¿Deseas borrar todo el historial de notificaciones?",
            confirmText: "VACIAR BANDEJA",
            type: 'danger'
        });
        if (confirm) {
            window.NotificationService.deleteAllMyNotifications(true);
            this.updateBadge(0);
        }
    }

    async confirmGlobalClear() {
        const confirm = await window.PremiumModal?.confirm({
            title: "☢️ LIMPIEZA GLOBAL COMUNIDAD",
            message: "Esta acción de SuperAdmin borrará las notificaciones de TODOS los jugadores.",
            confirmText: "BORRAR TODO",
            type: 'danger'
        });
        if (confirm && window.NotificationService) {
            await window.NotificationService.clearAllCommunityNotifications();
            this.close();
        }
    }

    testNotification(type = 'match') {
        this.playNotificationSound();

        let title = "🏆 Torneo Americana Confirmado";
        let body = "Te has apuntado a Americana Noche en Cornellà. ¡Prepara la pala!";
        let url = "americanas";

        if (type === 'entreno') {
            title = "💪 Nueva Sesión de Entreno";
            body = "Te has apuntado a ENTRENO en El Prat. Nivel 3.0 - 4.2.";
            url = "entrenos";
        } else if (type === 'clima') {
            title = "🌦️ Radar Pistas Cornellà";
            body = "Cielo despejado, 21°C y viento óptimo para jugar hoy.";
            url = "clima";
        } else if (type === 'broadcast') {
            title = "📢 Comunicado SomosPadel";
            body = "¡Pistas cubiertas confirmadas y ranking semanal actualizado!";
            url = "dashboard";
        }

        if (window.NotificationService?.showInAppToast) {
            window.NotificationService.showInAppToast(title, body, 'info', { url });
        }

        const next = (this.lastCount || 0) + 1;
        this.updateBadge(next);

        if ('Notification' in window && Notification.permission === 'granted' && window.NotificationService?.showNativeNotification) {
            window.NotificationService.showNativeNotification(title, body, { url });
        }
    }

    parseTimestamp(ts) {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate();
        if (ts instanceof Date) return ts;
        return new Date(ts);
    }

    timeAgo(timestamp) {
        if (!timestamp) return 'Ahora';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return "Ahora";
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} d`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
}

// Instancia global
window.NotificationUi = new NotificationUi();

/**
 * BINDING DE ALTA FIABILIDAD (MÓVIL & DESKTOP):
 * Handler con debounce para evitar el clásico error de apertura-cierre inmediato
 */
(function setupNotificationTriggers() {
    let lastTapTime = 0;

    function handleOpenTrigger(e) {
        const now = Date.now();
        if (now - lastTapTime < 350) return;
        lastTapTime = now;

        if (e) {
            e.stopPropagation();
            if (e.preventDefault && e.cancelable) e.preventDefault();
        }

        if (window.NotificationUi) {
            window.NotificationUi.toggle();
        }
    }

    function bindElements() {
        const headerBtn = document.getElementById('btn-header-notifications');
        if (headerBtn && !headerBtn._spBound) {
            headerBtn._spBound = true;
            headerBtn.addEventListener('click', handleOpenTrigger);
            headerBtn.addEventListener('touchstart', (e) => {
                if (window.PlayerView?.haptic) window.PlayerView.haptic(10);
            }, { passive: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindElements);
    } else {
        bindElements();
    }
})();
