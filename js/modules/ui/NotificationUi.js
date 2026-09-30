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
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('sp_push_permission_changed', () => this.renderPushPermissionBox());
        }
    }

    _bindService() {
        const attach = (service) => {
            if (service && typeof service.onUpdate === 'function') {
                this.service = service;
                service.onUpdate((data) => {
                    if (this.isOpen) {
                        this.renderList();
                    }
                    const accurateCount = (typeof service.getMergedNotifications === 'function')
                        ? service.getMergedNotifications().filter(n => !n.read).length
                        : (typeof data.count === 'number' ? data.count : (service.unreadCount || 0));
                    this.updateBadge(accurateCount);
                });

                const initialCount = (typeof service.getMergedNotifications === 'function')
                    ? service.getMergedNotifications().filter(n => !n.read).length
                    : (typeof service.unreadCount === 'number' ? service.unreadCount : 0);
                this.updateBadge(initialCount);
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
        const s = this.service || window.NotificationService;
        if (s && typeof s.getMergedNotifications === 'function') {
            count = s.getMergedNotifications().filter(n => !n.read).length;
        } else if (typeof count === 'number') {
            this.lastCount = count;
        } else if (typeof this.lastCount === 'number') {
            count = this.lastCount;
        } else if (s && typeof s.unreadCount === 'number') {
            count = s.unreadCount;
        } else {
            count = 0;
        }

        this.lastCount = count;

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

    goToHome() {
        this.close();
        if (window.Router && typeof window.Router.navigate === 'function') {
            window.Router.navigate('dashboard');
        } else {
            window.location.hash = '#dashboard';
        }
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (_) {}
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
                    <!-- Botón Inicio en Header -->
                    <button type="button" class="notif-header-home-btn" onclick="window.NotificationUi.goToHome()" title="Volver al Inicio">
                        <i class="fas fa-house"></i>
                        <span>Inicio</span>
                    </button>

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

            <!-- FOOTER FIJO: VOLVER AL INICIO -->
            <div class="notif-drawer-bottom-bar">
                <button type="button" class="btn-notif-go-home" onclick="window.NotificationUi.goToHome()">
                    <i class="fas fa-house"></i>
                    <span>VOLVER AL INICIO</span>
                </button>
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
        const rawPermission = notificationSupported ? Notification.permission : 'default';
        const pushStoredEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('somospadel_push_enabled') === 'true';
        const isGranted = rawPermission === 'granted' || (pushStoredEnabled && rawPermission !== 'denied');
        const isDenied = rawPermission === 'denied';

        if (isGranted) {
            box.className = 'notif-perm-box-granted';
            box.innerHTML = `
                <div class="notif-perm-status-row">
                    <div class="notif-perm-badge-ok">
                        <i class="fas fa-circle-check"></i>
                        <span>ALERTAS PUSH ACTIVADAS EN ESTE MÓVIL</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="notif-perm-pill">🟢 ONLINE</span>
                        <button type="button" class="notif-perm-test-btn" onclick="window.NotificationUi.testPushAlert()" title="Lanzar aviso de prueba">
                            <i class="fas fa-paper-plane"></i> Probar aviso
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        if (isDenied) {
            box.className = 'notif-perm-box-prompt notif-perm-box-denied';
            box.innerHTML = `
                <div class="notif-perm-header">
                    <div class="notif-perm-title" style="color: #dc2626;">
                        <i class="fas fa-lock"></i>
                        <span>PERMISO BLOQUEADO</span>
                    </div>
                    <span class="notif-perm-denied-tag">⚠️ Permiso Bloqueado en Navegador</span>
                </div>
                <div class="notif-perm-body">
                    Las notificaciones están bloqueadas en tu navegador.<br>
                    Para activarlas: pulsa el icono de <strong>candado 🔒</strong> en la barra de direcciones superior, cambia <em>Notificaciones</em> a <strong>'Permitir'</strong> y recarga la página.
                </div>
                <button type="button" class="notif-perm-btn-activate" style="background: #475569;" onclick="window.location.reload()">
                    <i class="fas fa-rotate-right"></i> RECARGAR TRAS DESBLOQUEAR
                </button>
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
                <span class="notif-perm-off-tag">🔴 Desactivado</span>
            </div>

            <div class="notif-perm-body">
                Entérate al instante cuando haya <strong>nuevas americanas</strong>, <strong>entrenos de tu nivel</strong> o <strong>plazas libres</strong>.
            </div>

            ${(isIOS && !isStandalone) ? `
                <button type="button" class="notif-perm-btn-activate" onclick="window.NotificationUi.showIOSInstructions()">
                    <i class="fas fa-arrow-up-from-bracket"></i> AÑADIR A PANTALLA DE INICIO (IPHONE)
                </button>
            ` : `
                <button type="button" class="notif-perm-btn-activate" id="btn-activate-push-notif" onclick="window.NotificationUi.requestPushActivation(this)">
                    <i class="fas fa-bell"></i> ACTIVAR NOTIFICACIONES PUSH AHORA
                </button>
            `}
        `;
    }

    async requestPushActivation(btn = null) {
        const targetBtn = btn || document.getElementById('btn-activate-push-notif');
        if (targetBtn) {
            targetBtn.disabled = true;
            targetBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> ACTIVANDO...';
            targetBtn.style.opacity = '0.85';
            targetBtn.style.pointerEvents = 'none';
        }

        if (window.NotificationService) {
            try {
                await window.NotificationService.requestPushPermission();
            } catch (err) {
                console.error('[NotifUI] Error solicitando permisos push:', err);
            }
        }

        // Re-renderizado inmediato de la caja de permisos
        this.renderPushPermissionBox();

        const notificationSupported = 'Notification' in window;
        const rawPermission = notificationSupported ? Notification.permission : 'default';
        const pushStoredEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('somospadel_push_enabled') === 'true';
        const isGranted = rawPermission === 'granted' || (pushStoredEnabled && rawPermission !== 'denied');

        if (isGranted) {
            this.playNotificationSound();
            if (window.NotificationService && window.NotificationService.showInAppToast) {
                window.NotificationService.showInAppToast(
                    '🔔 ¡Alertas Activadas!',
                    'Recibirás avisos incluso con la app cerrada.',
                    'success'
                );
            } else if (window.Toast) {
                window.Toast.show('🔔 ¡Alertas Activadas!', 'success');
            }
        }
    }

    async testPushAlert() {
        try {
            if (this._soundEnabled) {
                this.playNotificationSound();
            }
            if (window.PlayerView?.haptic) {
                window.PlayerView.haptic(15);
            }

            // 1. Si no hay permisos concedidos, solicitarlos activamente
            const notificationSupported = typeof Notification !== 'undefined';
            if (notificationSupported && Notification.permission !== 'granted') {
                if (window.NotificationService && typeof window.NotificationService.requestPushPermission === 'function') {
                    const granted = await window.NotificationService.requestPushPermission();
                    if (!granted) {
                        if (window.NotificationService.showInAppToast) {
                            window.NotificationService.showInAppToast(
                                '⚠️ Permiso no concedido',
                                'Para recibir alertas en tu dispositivo, pulsa "Permitir" en el navegador.',
                                'warning'
                            );
                        }
                        this.renderPushPermissionBox();
                        return;
                    }
                }
            }

            // 2. Feedback in-app inmediato
            if (window.NotificationService && window.NotificationService.showInAppToast) {
                window.NotificationService.showInAppToast(
                    '🎾 Notificación de prueba enviada',
                    'Alerta emitida a tu dispositivo y sincronizada en tu bandeja.',
                    'success'
                );
            } else if (window.Toast) {
                window.Toast.show('🎾 Notificación de prueba enviada', 'success');
            }

            // 3. Enviar notificación al dispositivo y registrar en la bandeja
            if (window.NotificationService && typeof window.NotificationService.sendWelcomeNotification === 'function') {
                await window.NotificationService.sendWelcomeNotification();
            }

            this.renderPushPermissionBox();
            if (this.isOpen) {
                this.renderList();
            }
        } catch (err) {
            console.warn('[NotificationUi] Error al enviar notificación de prueba:', err);
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
        // 2. CLASIFICACIÓN ESTRICTA: CANCELADOS, ENTRENOS vs AMERICANAS
        // -------------------------------------------------------------
        const isEnt = fullText.includes('entreno') || fullText.includes('entrenamiento') || fullText.includes('coach') || rawType === 'entreno' || rawUrl === 'entrenos';
        const isCancelled = item.isCancelled || item.data?.isCancelled || rawType === 'event_cancelled' || item.type === 'event_cancelled' || fullText.includes('cancelad') || fullText.includes('suspendid') || fullText.includes('eliminad') || fullText.includes('anulad');

        // PRIORIDAD MÁXIMA: EVENTOS CANCELADOS, SUSPENDIDOS O ELIMINADOS
        if (isCancelled) {
            category = isEnt ? 'entrenos' : 'matches';
            tag = {
                label: fullText.includes('suspend') ? 'SUSPENDIDO' : (fullText.includes('eliminad') ? 'ELIMINADO' : 'CANCELADO'),
                icon: 'fa-calendar-xmark',
                isSvg: false,
                cssClass: 'tag-cancelled',
                cardThemeClass: 'theme-cancelled'
            };
            actionLabel = isEnt ? '📅 CALENDARIO ENTRENOS' : '📅 CALENDARIO AMERICANAS';
            actionUrl = isEnt ? 'entrenos' : 'americanas';
            defaultTitle = isEnt ? '❌ Convocatoria de Entreno Anulada' : '❌ Torneo Americana Cancelado';
            defaultBody = 'Esta convocatoria ha sido cancelada o eliminada del calendario del club.';
            metaPills.push({ icon: 'fa-circle-exclamation', text: 'Convocatoria Anulada' });
        }
        // A. PRIORIDAD 1: ENTRENOS (Usa Pala Oficial de Pádel)
        else if (isEnt) {
            category = 'entrenos';
            tag = { label: 'ENTRENO', isSvg: true, svgIcon: PALA_ICON_SVG, cssClass: 'tag-entreno', cardThemeClass: 'theme-entreno' };
            actionLabel = '💪 VER ENTRENO';
            actionUrl = 'entrenos';
            defaultTitle = '💪 Convocatoria de Entreno';
            defaultBody = 'Sesión técnica y táctica en pista para mejorar tu nivel.';
            metaPills.push({ icon: 'fa-star', text: 'Entreno Nivel' });
        }
        // B. PRIORIDAD 2: AMERICANAS Y TORNEOS (Usa Copa Trofeo)
        else if (fullText.includes('americana') || fullText.includes('torneo') || rawType === 'americana' || rawUrl === 'americanas' || rawUrl === 'live' || eventId) {
            category = 'matches';
            tag = { label: 'AMERICANAS', icon: 'fa-trophy', isSvg: false, cssClass: 'tag-americana', cardThemeClass: 'theme-americana' };
            actionLabel = '🎾 VER AMERICANA';
            actionUrl = 'americanas';
            defaultTitle = '🏆 Torneo Americana Confirmado';
            defaultBody = 'Inscripción activa y cuadro de pistas preparado para competir.';
            metaPills.push({ icon: 'fa-stopwatch', text: 'En Vivo' });
        }
        // C. PRIORIDAD 3: RADAR Y CLIMA DE PISTAS
        else if (fullText.includes('clima') || fullText.includes('radar') || fullText.includes('viento') || fullText.includes('lluvia') || rawUrl === 'clima') {
            category = 'clima';
            tag = { label: 'RADAR & CLIMA', icon: 'fa-cloud-sun', isSvg: false, cssClass: 'tag-clima', cardThemeClass: 'theme-clima' };
            actionLabel = '🌦️ VER RADAR';
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
        // E. PRIORIDAD 5: NOTICIAS DEL JOURNAL SOMOSPADEL
        else if (fullText.includes('journal') || rawType === 'daily_news' || rawUrl === 'journal' || rawUrl === 'noticias') {
            category = 'broadcast';
            tag = { label: 'SOMOSPADEL JOURNAL', icon: 'fa-newspaper', isSvg: false, cssClass: 'tag-news', cardThemeClass: 'theme-broadcast' };
            actionLabel = '📰 LEER JOURNAL';
            actionUrl = 'journal';
            defaultTitle = '📰 SomosPadel Journal';
            defaultBody = 'Actualidad, consejos técnicos y guías de material para la comunidad.';
            metaPills.push({ icon: 'fa-book-open', text: 'Journal Oficial' });
        }
        // F. PRIORIDAD 6: NOTICIA RELEVANTE / COMUNICADOS OFICIALES
        else if (fullText.includes('relevante') || fullText.includes('destacad') || fullText.includes('comunicado') || fullText.includes('aviso') || fullText.includes('oficial') || fullText.includes('urgente') || fullText.includes('noticia')) {
            const isHot = fullText.includes('relevante') || fullText.includes('destacad') || fullText.includes('ranking') || fullText.includes('temporada');
            category = 'broadcast';
            tag = { 
                label: isHot ? 'NOTICIA DEL DÍA' : 'COMUNICADO', 
                icon: isHot ? 'fa-fire' : 'fa-bullhorn', 
                isSvg: false, 
                cssClass: isHot ? 'tag-hot' : 'tag-broadcast', 
                cardThemeClass: 'theme-broadcast' 
            };
            actionLabel = isHot ? '🔥 VER NOTICIA' : '📢 VER AVISO';
            actionUrl = rawUrl || 'dashboard';
            defaultTitle = isHot ? '🔥 Noticia Relevante del Día' : '📢 Comunicado Oficial SomosPadel';
            defaultBody = 'Información importante de la organización y novedades de la app.';
            if (isHot) {
                metaPills.push({ icon: 'fa-fire', text: 'Destacada Hoy' });
            }
        }

        const finalTitle = rawTitle.length > 0 ? rawTitle : defaultTitle;
        const finalBody = rawBody.length > 0 ? rawBody : defaultBody;
        const rawTimestamp = item.timestamp || item.createdAt || item.data?.timestamp || item.data?.createdAt || new Date();

        return {
            id: item.id || `notif_${Date.now()}`,
            title: finalTitle,
            body: finalBody,
            read: Boolean(item.read),
            timestamp: rawTimestamp,
            timeFormatted: this.timeAgo(rawTimestamp),
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

        // 1. Obtener objeto completo de la notificación
        const allNotifs = window.NotificationService ? (window.NotificationService.getMergedNotifications() || []) : [];
        const rawItem = allNotifs.find(n => n && (n.id === id || n.data?.broadcastId === id || n.data?.eventId === id));
        const item = this._normalizeNotificationItem(rawItem || { id, actionUrl, eventId, action });

        const fullText = `${item.title} ${item.body} ${item.actionUrl || ''}`.toLowerCase();
        const itemId = String(id || '');

        // 2. CASO A: NOTIFICACIÓN DE CLIMA / RADAR METEOROLÓGICO
        if (item.category === 'clima' || itemId.includes('weather') || itemId.includes('clima') || itemId.includes('radar') || actionUrl === 'clima' || fullText.includes('meteorol')) {
            if (window.EventWeatherModal && typeof window.EventWeatherModal.open === 'function') {
                window.EventWeatherModal.open({ court: item.sede || 'El Prat', name: 'Pistas SomosPádel' });
                return;
            }
            if (window.Router) {
                window.Router.navigate('clima');
                return;
            }
            this.showDetailModal(item);
            return;
        }

        // 3. CASO B: NOTICIA DEL JOURNAL (BAJADA DE PARED, MATERIAL, CONSEJOS)
        if (itemId.includes('journal') || item.tag?.label?.includes('JOURNAL') || fullText.includes('journal') || rawItem?.type === 'daily_news') {
            this.showJournalArticleModal(item);
            return;
        }

        // 4. CASO C: NOTICIA RELEVANTE DEL DÍA / TITULARES APP
        if (itemId.includes('headline') || fullText.includes('relevante') || item.tag?.label?.includes('NOTICIA DEL DÍA')) {
            this.showHeadlineNewsModal(item);
            return;
        }

        // 5. CASO D: EVENTO EN VIVO / AMERICANA / ENTRENO CON EVENT ID
        const resolvedEventId = eventId || item.eventId || item.data?.eventId;
        if (resolvedEventId) {
            if (window.EventsController && typeof window.EventsController.openLiveEvent === 'function') {
                const eventType = item.category === 'entrenos' ? 'entreno' : 'americana';
                window.EventsController.openLiveEvent(resolvedEventId, eventType, action);
                return;
            }
            if (window.Router) {
                window.Router.navigate('live', { eventId: resolvedEventId, action });
                return;
            }
            if (window.loadAdminView) {
                window.loadAdminView('events');
                return;
            }
        }

        // 6. CASO E: RUTAS ESPECÍFICAS DE SECCIÓN (americanas, entrenos, ranking, comunidad, etc.)
        if (actionUrl && !['dashboard', 'home', 'inicio'].includes(actionUrl.toLowerCase())) {
            if (window.Router) {
                window.Router.navigate(actionUrl);
                return;
            }
            if (window.loadAdminView) {
                window.loadAdminView(actionUrl);
                return;
            }
            window.location.hash = `#${actionUrl}`;
            return;
        }

        // 7. CASO F: COMUNICADO GENERAL / AVISO (Si es dashboard o no tiene destino específico, abrir el visor modal para leerlo completo)
        this.showDetailModal(item);
    }

    /**
     * Muestra un modal de lectura completo para artículos del Journal
     */
    showJournalArticleModal(item) {
        document.getElementById('notif-content-modal-overlay')?.remove();

        const isWallSmash = String(item.id || '').includes('wall_smash') || String(item.title || '').toLowerCase().includes('bajada');
        const isCarbon = String(item.id || '').includes('carbon_padel') || String(item.title || '').toLowerCase().includes('carbono');

        let imgUrl = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop';
        let fullArticleHtml = '';

        if (isWallSmash) {
            imgUrl = 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=1200&auto=format&fit=crop';
            fullArticleHtml = `
                <p style="margin: 0 0 14px 0; font-size: 0.95rem; line-height: 1.6; color: #334155;">
                    Cuando el rival lanza un globo corto que rebota alto en el cristal de fondo, tienes la oportunidad de oro para ejecutar una <strong>bajada de pared ofensiva</strong>.
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                    <strong style="color: #047857; display: block; margin-bottom: 4px;">💡 Regla de Oro en Pista:</strong>
                    <span style="color: #065f46; font-size: 0.9rem;">No busques reventar la bola; una bajada dirigida al cuerpo del rival en la red o hacia el espacio central entre ambos genera un punto casi seguro o una volea forzada fácil de rematar.</span>
                </div>
                <h4 style="margin: 18px 0 8px 0; font-size: 1.05rem; color: #0f172a; font-weight: 850;">Técnica Paso a Paso:</h4>
                <ul style="margin: 0 0 16px 20px; padding: 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">
                    <li><strong>Armado Alto Inmediato:</strong> Prepara la pala arriba antes de que la bola impacte en el cristal de fondo.</li>
                    <li><strong>Apoyo Firme:</strong> Carga el peso en el pie trasero y transfiérelo hacia adelante en el punto de contacto.</li>
                    <li><strong>Aceleración de Muñeca:</strong> Acompaña el golpe de arriba hacia abajo para generar efecto cortado y mantener la bola baja.</li>
                </ul>
            `;
        } else if (isCarbon) {
            imgUrl = 'https://images.unsplash.com/photo-1617083934555-563d61a29f8f?q=80&w=1200&auto=format&fit=crop';
            fullArticleHtml = `
                <p style="margin: 0 0 14px 0; font-size: 0.95rem; line-height: 1.6; color: #334155;">
                    Jugar en las pistas de Barcelona (El Prat y Cornellà) cerca de la costa significa que la <strong>humedad nocturna</strong> modifica sensiblemente el comportamiento de la bola y los materiales de tu pala.
                </p>
                <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                    <strong style="color: #047857; display: block; margin-bottom: 4px;">🔬 Material Science:</strong>
                    <span style="color: #065f46; font-size: 0.9rem;">El carbono 12K y 24K aporta rigidez estructural, pero con humedad alta la bola pesa más. Una goma Black EVA Soft proporciona la salida extra necesaria para no perder profundidad en las pistas con moqueta azul rápida.</span>
                </div>
                <h4 style="margin: 18px 0 8px 0; font-size: 1.05rem; color: #0f172a; font-weight: 850;">Consejos para la Moqueta Azul:</h4>
                <ul style="margin: 0 0 16px 20px; padding: 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">
                    <li><strong>Presión de Pelotas:</strong> Utiliza botes presurizados para contrarrestar la pérdida de rebote en los cristales fríos.</li>
                    <li><strong>Suela de Espiga (Clay):</strong> Esencial para un agarre firme en la moqueta rizada con arena de sílice sin resbalar en arrancadas rápidas.</li>
                </ul>
            `;
        } else {
            fullArticleHtml = `
                <p style="margin: 0 0 14px 0; font-size: 0.95rem; line-height: 1.6; color: #334155;">
                    ${item.body}
                </p>
            `;
        }

        const overlay = document.createElement('div');
        overlay.id = 'notif-content-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);
            z-index: 100000; display: flex; align-items: center; justify-content: center;
            padding: 16px; box-sizing: border-box; font-family: 'Outfit', 'Inter', sans-serif;
        `;

        overlay.innerHTML = `
            <div style="
                background: #ffffff; border-radius: 24px; max-width: 620px; width: 100%;
                max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
                border: 1px solid #cbd5e1; position: relative;
            ">
                <!-- Cabecera con Imagen HD -->
                <div style="
                    height: 190px; width: 100%; position: relative; overflow: hidden;
                    border-top-left-radius: 24px; border-top-right-radius: 24px;
                    background: url('${imgUrl}') center/cover no-repeat;
                ">
                    <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%);"></div>
                    <button id="btn-close-notif-modal" type="button" style="
                        position: absolute; top: 14px; right: 14px; width: 36px; height: 36px;
                        border-radius: 50%; background: rgba(0,0,0,0.5); color: #ffffff; border: 1px solid rgba(255,255,255,0.2);
                        cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
                    ">&times;</button>
                    <div style="position: absolute; bottom: 16px; left: 20px; right: 20px;">
                        <span style="background: #10b981; color: #ffffff; font-size: 0.72rem; font-weight: 900; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
                            <i class="fas fa-newspaper"></i> SOMOSPADEL JOURNAL
                        </span>
                        <h2 style="margin: 8px 0 0 0; font-size: 1.25rem; font-weight: 950; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.6); line-height: 1.3;">
                            ${item.title}
                        </h2>
                    </div>
                </div>

                <!-- Contenido -->
                <div style="padding: 22px 24px;">
                    <div style="display: flex; gap: 14px; margin-bottom: 16px; font-size: 0.78rem; font-weight: 750; color: #64748b; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                        <span><i class="far fa-clock"></i> 3 min lectura</span>
                        <span><i class="fas fa-award"></i> Técnica & Material</span>
                        <span><i class="fas fa-feather-pointed"></i> Editorial SomosPádel</span>
                    </div>

                    ${fullArticleHtml}

                    <div style="margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 18px;">
                        <button id="btn-modal-dismiss" type="button" style="
                            background: #f1f5f9; color: #475569; border: none; padding: 11px 20px;
                            border-radius: 12px; font-weight: 800; font-size: 0.88rem; cursor: pointer;
                        ">
                            Cerrar
                        </button>
                        <button id="btn-modal-action" type="button" style="
                            background: #0f172a; color: #CCFF00; border: none; padding: 11px 24px;
                            border-radius: 12px; font-weight: 950; font-size: 0.9rem; cursor: pointer;
                            display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(15,23,42,0.25);
                        ">
                            <i class="fas fa-book-open"></i> <span>Ver más en el Journal</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        overlay.querySelector('#btn-close-notif-modal')?.addEventListener('click', closeModal);
        overlay.querySelector('#btn-modal-dismiss')?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        overlay.querySelector('#btn-modal-action')?.addEventListener('click', () => {
            closeModal();
            if (window.Router) {
                window.Router.navigate('journal');
            } else if (window.loadAdminView) {
                window.loadAdminView('dashboard_home');
            } else {
                window.location.hash = '#journal';
            }
        });
    }

    /**
     * Muestra un modal de lectura completo para la Noticia Relevante del Día
     */
    showHeadlineNewsModal(item) {
        document.getElementById('notif-content-modal-overlay')?.remove();

        const imgUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop';
        const overlay = document.createElement('div');
        overlay.id = 'notif-content-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);
            z-index: 100000; display: flex; align-items: center; justify-content: center;
            padding: 16px; box-sizing: border-box; font-family: 'Outfit', 'Inter', sans-serif;
        `;

        overlay.innerHTML = `
            <div style="
                background: #ffffff; border-radius: 24px; max-width: 620px; width: 100%;
                max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
                border: 1px solid #cbd5e1; position: relative;
            ">
                <!-- Cabecera con Imagen HD -->
                <div style="
                    height: 190px; width: 100%; position: relative; overflow: hidden;
                    border-top-left-radius: 24px; border-top-right-radius: 24px;
                    background: url('${imgUrl}') center/cover no-repeat;
                ">
                    <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%);"></div>
                    <button id="btn-close-notif-modal" type="button" style="
                        position: absolute; top: 14px; right: 14px; width: 36px; height: 36px;
                        border-radius: 50%; background: rgba(0,0,0,0.5); color: #ffffff; border: 1px solid rgba(255,255,255,0.2);
                        cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
                    ">&times;</button>
                    <div style="position: absolute; bottom: 16px; left: 20px; right: 20px;">
                        <span style="background: #ea580c; color: #ffffff; font-size: 0.72rem; font-weight: 900; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
                            <i class="fas fa-fire"></i> NOTICIA RELEVANTE DEL DÍA
                        </span>
                        <h2 style="margin: 8px 0 0 0; font-size: 1.25rem; font-weight: 950; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.6); line-height: 1.3;">
                            ${item.title}
                        </h2>
                    </div>
                </div>

                <!-- Contenido -->
                <div style="padding: 22px 24px;">
                    <div style="display: flex; gap: 14px; margin-bottom: 16px; font-size: 0.78rem; font-weight: 750; color: #64748b; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                        <span><i class="fas fa-calendar-day"></i> Hoy</span>
                        <span><i class="fas fa-bolt"></i> Sistema SomosPádel</span>
                        <span><i class="fas fa-trophy"></i> Temporada 2026/2027</span>
                    </div>

                    <p style="margin: 0 0 14px 0; font-size: 0.95rem; line-height: 1.6; color: #334155;">
                        La comunidad de <strong>SomosPádel Barcelona</strong> abre la nueva temporada competitiva con un sistema de juego totalmente renovado tanto para entrenos como para torneos.
                    </p>

                    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 14px 16px; border-radius: 10px; margin: 16px 0;">
                        <strong style="color: #c2410c; display: block; margin-bottom: 6px; font-size: 0.92rem;">✨ Novedades Principales en la App:</strong>
                        <ul style="margin: 0 0 0 18px; padding: 0; color: #7c2d12; font-size: 0.88rem; line-height: 1.5;">
                            <li><strong>Ranking Interactivo en Vivo:</strong> Puntos actualizados en cada ronda y tabla de ascensos/descensos.</li>
                            <li><strong>Cromos PadelFut Oficiales:</strong> Ficha coleccionable con tus estadísticas de smash, defensa y resistencia.</li>
                            <li><strong>Bonus +150 XP en Alertas SOS:</strong> Recompensas especiales para quienes cubran bajas de última hora.</li>
                        </ul>
                    </div>

                    <p style="margin: 0 0 14px 0; font-size: 0.92rem; line-height: 1.6; color: #475569;">
                        Ya puedes consultar tu ficha de jugador, revisar el calendario de americanas abiertas y apuntarte a las próximas sesiones en pista desde la barra de navegación.
                    </p>

                    <div style="margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 18px;">
                        <button id="btn-close-headline-dismiss" type="button" style="
                            background: #f1f5f9; color: #475569; border: none; padding: 11px 20px;
                            border-radius: 12px; font-weight: 800; font-size: 0.88rem; cursor: pointer;
                        ">
                            Cerrar
                        </button>
                        <button id="btn-headline-action" type="button" style="
                            background: #0f172a; color: #CCFF00; border: none; padding: 11px 24px;
                            border-radius: 12px; font-weight: 950; font-size: 0.9rem; cursor: pointer;
                            display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(15,23,42,0.25);
                        ">
                            <i class="fas fa-trophy"></i> <span>Ver Ranking & Torneos</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        overlay.querySelector('#btn-close-notif-modal')?.addEventListener('click', closeModal);
        overlay.querySelector('#btn-close-headline-dismiss')?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        overlay.querySelector('#btn-headline-action')?.addEventListener('click', () => {
            closeModal();
            if (window.Router) {
                window.Router.navigate('ranking');
            } else if (window.loadAdminView) {
                window.loadAdminView('results');
            } else {
                window.location.hash = '#ranking';
            }
        });
    }

    /**
     * Muestra un modal de lectura general para cualquier comunicado o aviso oficial
     */
    showDetailModal(item) {
        document.getElementById('notif-content-modal-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'notif-content-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);
            z-index: 100000; display: flex; align-items: center; justify-content: center;
            padding: 16px; box-sizing: border-box; font-family: 'Outfit', 'Inter', sans-serif;
        `;

        overlay.innerHTML = `
            <div style="
                background: #ffffff; border-radius: 24px; max-width: 560px; width: 100%;
                max-height: 88vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
                border: 1px solid #cbd5e1; position: relative; padding: 26px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 4px 12px; border-radius: 100px;">
                        <span style="font-size: 0.75rem; font-weight: 850; color: #475569; text-transform: uppercase;">
                            ${item.tag?.label || 'AVISO SOMOSPADEL'}
                        </span>
                    </div>
                    <button id="btn-close-detail-modal" type="button" style="
                        background: transparent; border: none; font-size: 1.4rem; color: #94a3b8;
                        cursor: pointer; line-height: 1; padding: 4px;
                    ">&times;</button>
                </div>

                <h3 style="margin: 0 0 12px 0; font-size: 1.25rem; font-weight: 950; color: #0f172a; line-height: 1.35;">
                    ${item.title}
                </h3>

                <div style="display: flex; gap: 12px; font-size: 0.75rem; color: #64748b; margin-bottom: 16px;">
                    <span><i class="far fa-clock"></i> ${item.timeFormatted || 'Reciente'}</span>
                    <span><i class="fas fa-location-dot"></i> ${item.sede || 'SomosPádel BCN'}</span>
                </div>

                <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; white-space: pre-line; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
                    ${item.body}
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="btn-detail-dismiss" type="button" style="
                        background: #0f172a; color: #CCFF00; border: none; padding: 12px 28px;
                        border-radius: 12px; font-weight: 950; font-size: 0.9rem; cursor: pointer;
                    ">
                        Entendido
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        overlay.querySelector('#btn-close-detail-modal')?.addEventListener('click', closeModal);
        overlay.querySelector('#btn-detail-dismiss')?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    }

    handleDeleteOne(id, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (window.NotificationService) {
            window.NotificationService.deleteNotification(id);
        }
        this.updateBadge();
        if (this.isOpen) {
            this.renderList();
        }
    }

    markAllRead() {
        if (window.NotificationService) {
            window.NotificationService.markAllAsRead();
        }
        this.updateBadge(0);
        if (this.isOpen) {
            this.renderList();
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
            await window.NotificationService.deleteAllMyNotifications(true);
            this.updateBadge(0);
            if (this.isOpen) {
                this.renderList();
            }
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

    /**
     * @deprecated Simulador de notificaciones falsas retirado de producción para evitar confusión.
     * Para pruebas técnicas legítimas de conectividad Push, utilizar testPushAlert().
     */
    testNotification(type = 'match') {
        console.warn('[NotificationUi] testNotification() está deshabilitado en producción para evitar avisos ficticios. Utiliza testPushAlert().');
    }

    parseTimestamp(ts) {
        if (!ts) return new Date();
        try {
            if (typeof ts.toDate === 'function') return ts.toDate();
            if (ts instanceof Date) return isNaN(ts.getTime()) ? new Date() : ts;
            const d = new Date(ts);
            return isNaN(d.getTime()) ? new Date() : d;
        } catch (_) {
            return new Date();
        }
    }

    timeAgo(timestamp) {
        if (!timestamp) return 'Ahora';
        try {
            const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
            if (isNaN(date.getTime())) return 'Ahora';
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 0) return "Ahora";
            if (seconds < 60) return "Ahora";
            const mins = Math.floor(seconds / 60);
            if (mins < 60) return `${mins} min`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `${hours} h`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days} d`;
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        } catch (_) {
            return 'Ahora';
        }
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
