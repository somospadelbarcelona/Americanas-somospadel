/**
 * admin-notifications-manager.js
 * Gestor Global de Notificaciones (SuperAdmin)
 * Permite purgar alertas y notificaciones masivas de TODAS las cuentas de jugadores en SomosPadel.
 */

(function () {
    'use strict';

    window.AdminViews = window.AdminViews || {};

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'Fecha desconocida';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (_) {
            return String(dateStr);
        }
    }

    class AdminNotificationsManagerController {
        constructor() {
            this.items = [];
            this.filteredItems = [];
            this.purgedCount = 0;
            this.searchQuery = '';
            this.selectedCategory = 'all';
            this.isLoading = false;
            this.deletingId = null;
        }

        hasPrivileges() {
            const user = window.AdminAuth && window.AdminAuth.user;
            if (!user) return false;
            const role = (user.role || '').toString().toLowerCase().trim();
            // Los organizadores estándar no deben acceder a la purga masiva de jugadores
            if (['organizer', 'organizador', 'organizadores', 'organizers'].includes(role)) {
                return false;
            }
            if (typeof window.AdminAuth.hasAdminRole === 'function') {
                return window.AdminAuth.hasAdminRole(role);
            }
            return ['super_admin', 'superadmin', 'admin', 'admin_player'].includes(role);
        }

        async init() {
            if (typeof document === 'undefined') return;
            const container = document.getElementById('content-area');
            if (!container) return;

            if (!this.hasPrivileges()) {
                container.innerHTML = `
                    <div class="glass-card-enterprise animate-fade-in" style="padding: 3.5rem 2rem; text-align: center; max-width: 650px; margin: 3rem auto; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px;">
                        <div style="font-size: 3.5rem; color: #ef4444; margin-bottom: 1.25rem;">
                            <i class="fas fa-shield-halved"></i>
                        </div>
                        <h2 style="color: #ef4444; font-weight: 900; margin-bottom: 0.75rem; letter-spacing: 0.5px;">ACCESO RESTRINGIDO A SUPERADMIN</h2>
                        <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
                            El Gestor Global de Notificaciones requiere permisos elevados de SuperAdmin para evitar alteraciones no deseadas en las bandejas de entrada de los jugadores.
                        </p>
                        <button onclick="window.loadAdminView && window.loadAdminView('users')" class="btn-micro" style="padding: 10px 20px !important; font-size: 0.85rem !important; background: #0f172a; color: #fff;">
                            <i class="fas fa-arrow-left"></i> Volver a Base de Datos
                        </button>
                    </div>
                `;
                return;
            }

            // Spinner de carga inicial
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 380px; gap: 15px;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 2.5rem; color: #ef4444;"></i>
                    <span style="font-weight: 700; color: #64748b; font-size: 0.95rem; letter-spacing: 0.5px;">Cargando Centro Global de Notificaciones...</span>
                </div>
            `;

            await this.loadData();
            this.render();
        }

        async loadData() {
            this.isLoading = true;
            try {
                // 1. Obtener lista consolidada de notificaciones globales
                if (window.AdminNotifications && typeof window.AdminNotifications.fetchGlobalList === 'function') {
                    this.items = await window.AdminNotifications.fetchGlobalList();
                } else if (window.NotificationService && typeof window.NotificationService.fetchAllGlobalNotifications === 'function') {
                    this.items = await window.NotificationService.fetchAllGlobalNotifications();
                } else {
                    this.items = [];
                }

                // 2. Obtener conteo de purgas realizadas
                this.purgedCount = await this.fetchPurgedCount();
            } catch (err) {
                console.error("❌ [AdminNotificationsManager] Error al cargar datos:", err);
                this.items = [];
            } finally {
                this.isLoading = false;
                this.applyFilters();
            }
        }

        async fetchPurgedCount() {
            try {
                if (window.db) {
                    const snap = await window.db.collection('system_config').doc('purged_notifications').get();
                    if (snap.exists && Array.isArray(snap.data()?.purgedIds)) {
                        return snap.data().purgedIds.length;
                    }
                }
                if (window.NotificationService?.globalPurgedIds) {
                    return window.NotificationService.globalPurgedIds.size;
                }
            } catch (e) {
                console.warn("⚠️ [AdminNotificationsManager] No se pudo leer purged_notifications:", e);
            }
            return 0;
        }

        applyFilters() {
            const query = (this.searchQuery || '').toLowerCase().trim();
            const cat = this.selectedCategory;

            this.filteredItems = this.items.filter(item => {
                // Filtro por categoría
                if (cat === 'broadcast' && item.type !== 'broadcast') return false;
                if (cat === 'system' && item.type !== 'system') return false;

                // Filtro por texto
                if (query) {
                    const titleText = (item.title || '').toLowerCase();
                    const bodyText = (item.body || '').toLowerCase();
                    const authorText = (item.authorName || '').toLowerCase();
                    const targetText = (item.targetCount || '').toLowerCase();
                    if (!titleText.includes(query) && !bodyText.includes(query) && !authorText.includes(query) && !targetText.includes(query)) {
                        return false;
                    }
                }

                return true;
            });
        }

        onSearch(val) {
            this.searchQuery = val;
            this.applyFilters();
            this.renderListOnly();
        }

        onCategoryChange(val) {
            this.selectedCategory = val;
            this.applyFilters();
            this.renderListOnly();
        }

        async refresh() {
            const refreshBtn = document.getElementById('notif-manager-refresh-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-rotate fa-spin"></i> Refrescando...';
                refreshBtn.disabled = true;
            }
            await this.loadData();
            this.render();
        }

        async confirmDelete(itemId) {
            const item = this.items.find(i => String(i.id) === String(itemId));
            if (!item) {
                console.warn("Notificación no encontrada:", itemId);
                return;
            }

            let confirmed = false;
            if (window.PremiumModal && typeof window.PremiumModal.confirm === 'function') {
                confirmed = await window.PremiumModal.confirm({
                    title: "¿Eliminar esta notificación de TODAS las cuentas?",
                    message: "Esta acción eliminará el mensaje permanentemente de la bandeja y teléfonos de todos los jugadores del club.",
                    confirmText: "ELIMINAR DE TODAS LAS CUENTAS",
                    cancelText: "CANCELAR",
                    type: 'danger'
                });
            } else {
                confirmed = window.confirm("¿Eliminar esta notificación de TODAS las cuentas?\n\nEsta acción eliminará el mensaje permanentemente de la bandeja y teléfonos de todos los jugadores del club.");
            }

            if (!confirmed) return;

            this.deletingId = itemId;
            this.updateCardLoading(itemId, true);

            try {
                const broadcastId = item.broadcastId || item.data?.broadcastId || item.id;
                let result = null;

                if (window.AdminNotifications && typeof window.AdminNotifications.deleteGlobal === 'function') {
                    result = await window.AdminNotifications.deleteGlobal(item.id, {
                        broadcastId: broadcastId,
                        title: item.title
                    });
                } else if (window.NotificationService && typeof window.NotificationService.deleteNotificationGlobally === 'function') {
                    result = await window.NotificationService.deleteNotificationGlobally(item.id, {
                        broadcastId: broadcastId,
                        title: item.title
                    });
                } else {
                    throw new Error("El servicio de eliminación global no está disponible en este momento.");
                }

                // Feedback visual de éxito
                const deletedCount = result?.deletedFromPlayersCount || 0;
                if (window.PremiumModal && typeof window.PremiumModal.alert === 'function') {
                    await window.PremiumModal.alert({
                        title: "🗑️ PURGA GLOBAL COMPLETADA",
                        message: `La notificación "<strong>${escapeHtml(item.title)}</strong>" se ha eliminado permanentemente de todas las cuentas (${deletedCount} alertas retiradas).`,
                        type: 'success'
                    });
                } else {
                    alert(`✅ Notificación purgada con éxito (${deletedCount} alertas retiradas).`);
                }

                // Refrescar lista sin recargar la página entera
                await this.loadData();
                this.render();
            } catch (err) {
                console.error("❌ Error durante la purga global:", err);
                if (window.PremiumModal && typeof window.PremiumModal.alert === 'function') {
                    await window.PremiumModal.alert({
                        title: "❌ ERROR EN LA PURGA",
                        message: "Ocurrió un error al eliminar la notificación: " + (err.message || err),
                        type: 'danger'
                    });
                } else {
                    alert("Error: " + (err.message || err));
                }
                this.updateCardLoading(itemId, false);
            } finally {
                this.deletingId = null;
            }
        }

        updateCardLoading(itemId, isLoading) {
            const btn = document.getElementById(`btn-purge-${itemId}`);
            if (btn) {
                if (isLoading) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Purgando de todas las cuentas...';
                    btn.style.opacity = '0.7';
                } else {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-trash-alt"></i> ELIMINAR DE TODAS LAS CUENTAS';
                    btn.style.opacity = '1';
                }
            }
        }

        render() {
            if (typeof document === 'undefined') return;
            const container = document.getElementById('content-area');
            if (!container) return;

            const totalActive = this.items.length;
            const officialBroadcasts = this.items.filter(i => i.type === 'broadcast').length;
            const purgesDone = this.purgedCount;

            container.innerHTML = `
                <div class="glass-card-enterprise animate-fade-in" style="padding: 2.5rem; max-width: 1200px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                    
                    <!-- 1. CABECERA ENTERPRISE & DEPORTIVA -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.5rem;">
                        <div style="max-width: 780px;">
                            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.1); color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px; border: 1px solid rgba(239, 68, 68, 0.2);">
                                <i class="fas fa-shield-virus"></i> Seguridad & Moderación Global
                            </div>
                            <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 1.85rem; font-weight: 950; display: flex; align-items: center; gap: 12px; letter-spacing: -0.5px;">
                                <span>🔔 GESTOR GLOBAL DE NOTIFICACIONES</span>
                                <span style="background: #ef4444; color: #ffffff; font-size: 0.65rem; font-weight: 950; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;">SUPERADMIN</span>
                            </h2>
                            <p style="color: #64748b; font-size: 0.95rem; margin: 0; line-height: 1.5;">
                                Elimina notificaciones masivas de TODAS las cuentas de jugadores para mantener la bandeja limpia y sin avisos innecesarios.
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                            <button onclick="window.emitAdminBroadcast ? window.emitAdminBroadcast() : (window.AdminNotifications && window.AdminNotifications.openBroadcastModal())" 
                                    class="btn-primary-pro" 
                                    style="background: #CCFF00 !important; color: #000000 !important; border: 1px solid #99cc00 !important; font-weight: 900 !important; font-size: 0.88rem !important; padding: 11px 18px !important; border-radius: 12px !important; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(204, 255, 0, 0.35); cursor: pointer; transition: transform 0.15s ease;">
                                <i class="fas fa-bullhorn"></i> 📢 Emitir Comunicado Push
                            </button>
                            <button id="notif-manager-refresh-btn" 
                                    onclick="window.AdminNotificationsManagerCtrl.refresh()" 
                                    style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; font-weight: 800; font-size: 0.88rem; padding: 11px 16px; border-radius: 12px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.15s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                                <i class="fas fa-rotate"></i> Refrescar
                            </button>
                        </div>
                    </div>

                    <!-- 2. TARJETAS DE MÉTRICAS -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                        <!-- Métrica 1 -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.4rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                            <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(56, 189, 248, 0.15); color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                                <i class="fas fa-bell"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Notificaciones Activas</div>
                                <div style="font-size: 2rem; font-weight: 950; color: #0f172a; line-height: 1.1; margin-top: 4px;">${totalActive}</div>
                                <div style="font-size: 0.72rem; color: #0284c7; font-weight: 700; margin-top: 2px;">En bandejas de entrada</div>
                            </div>
                        </div>

                        <!-- Métrica 2 -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.4rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                            <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(204, 255, 0, 0.2); color: #65a30d; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                                <i class="fas fa-bullhorn"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Comunicados Oficiales</div>
                                <div style="font-size: 2rem; font-weight: 950; color: #0f172a; line-height: 1.1; margin-top: 4px;">${officialBroadcasts}</div>
                                <div style="font-size: 0.72rem; color: #65a30d; font-weight: 700; margin-top: 2px;">Canal masivo broadcast</div>
                            </div>
                        </div>

                        <!-- Métrica 3 -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.4rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                            <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(239, 68, 68, 0.15); color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                                <i class="fas fa-trash-can"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Purgas Realizadas</div>
                                <div style="font-size: 2rem; font-weight: 950; color: #0f172a; line-height: 1.1; margin-top: 4px;">${purgesDone}</div>
                                <div style="font-size: 0.72rem; color: #dc2626; font-weight: 700; margin-top: 2px;">Bloqueadas globalmente</div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. BARRA DE HERRAMIENTAS Y FILTROS -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem 1.25rem; margin-bottom: 2rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;">
                        <div style="display: flex; gap: 1rem; flex: 1; min-width: 280px; align-items: center;">
                            <!-- Buscador en tiempo real -->
                            <div style="position: relative; flex: 1;">
                                <i class="fas fa-magnifying-glass" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.9rem;"></i>
                                <input type="text" 
                                       id="notif-search-input" 
                                       value="${escapeHtml(this.searchQuery)}"
                                       placeholder="Buscar por título, contenido o autor..." 
                                       oninput="window.AdminNotificationsManagerCtrl.onSearch(this.value)"
                                       style="padding-left: 38px !important; height: 42px !important; border-radius: 10px !important; border: 1px solid #cbd5e1 !important; background: #ffffff !important; font-size: 0.9rem !important;">
                            </div>

                            <!-- Selector por Categoría -->
                            <div style="min-width: 200px;">
                                <select id="notif-category-filter" 
                                        onchange="window.AdminNotificationsManagerCtrl.onCategoryChange(this.value)"
                                        style="height: 42px !important; border-radius: 10px !important; border: 1px solid #cbd5e1 !important; background: #ffffff !important; font-weight: 700 !important; font-size: 0.88rem !important;">
                                    <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>📁 Todas las categorías</option>
                                    <option value="broadcast" ${this.selectedCategory === 'broadcast' ? 'selected' : ''}>📢 Comunicados Oficiales</option>
                                    <option value="system" ${this.selectedCategory === 'system' ? 'selected' : ''}>⚙️ Avisos del Sistema</option>
                                </select>
                            </div>
                        </div>

                        <!-- Info Contador filtrado -->
                        <div id="notif-counter-label" style="font-size: 0.82rem; font-weight: 800; color: #64748b;">
                            Mostrando <span style="color: #0f172a; font-weight: 900;">${this.filteredItems.length}</span> de ${this.items.length} notificaciones
                        </div>
                    </div>

                    <!-- 4. CONTENEDOR DE LA LISTA / TABLA DE NOTIFICACIONES -->
                    <div id="notifications-list-container">
                        ${this.renderListHTML()}
                    </div>

                </div>
            `;
        }

        renderListOnly() {
            if (typeof document === 'undefined') return;
            const listEl = document.getElementById('notifications-list-container');
            if (listEl) {
                listEl.innerHTML = this.renderListHTML();
            }
            const counterEl = document.getElementById('notif-counter-label');
            if (counterEl) {
                counterEl.innerHTML = `Mostrando <span style="color: #0f172a; font-weight: 900;">${this.filteredItems.length}</span> de ${this.items.length} notificaciones`;
            }
        }

        renderListHTML() {
            if (this.isLoading) {
                return `
                    <div style="text-align: center; padding: 4rem 1rem; color: #64748b;">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                        <p style="font-weight: 700; margin: 0;">Actualizando listado de notificaciones...</p>
                    </div>
                `;
            }

            if (this.filteredItems.length === 0) {
                return `
                    <div style="text-align: center; padding: 4rem 2rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px;">
                        <div style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;">
                            <i class="fas fa-bell-slash"></i>
                        </div>
                        <h3 style="font-size: 1.25rem; font-weight: 900; color: #0f172a; margin: 0 0 6px 0;">No se encontraron notificaciones</h3>
                        <p style="color: #64748b; font-size: 0.9rem; max-width: 450px; margin: 0 auto;">
                            ${this.searchQuery || this.selectedCategory !== 'all' 
                                ? 'No hay avisos que coincidan con los filtros aplicados. Prueba a borrar la búsqueda.' 
                                : 'Actualmente no hay notificaciones globales activas en las bandejas del club.'}
                        </p>
                    </div>
                `;
            }

            return `
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                    ${this.filteredItems.map(item => this.renderItemCard(item)).join('')}
                </div>
            `;
        }

        renderItemCard(item) {
            const isBroadcast = item.type === 'broadcast';
            const isSystem = item.type === 'system';

            let typeBadgeStyle = 'background: rgba(147, 51, 234, 0.1); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.2);';
            let typeLabel = '<i class="fas fa-bell"></i> Notificación';

            if (isBroadcast) {
                typeBadgeStyle = 'background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25);';
                typeLabel = '<i class="fas fa-bullhorn"></i> Comunicado Oficial';
            } else if (isSystem) {
                typeBadgeStyle = 'background: rgba(14, 165, 233, 0.12); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.25);';
                typeLabel = '<i class="fas fa-gears"></i> Aviso del Sistema';
            }

            const isCurrentDeleting = this.deletingId === item.id;

            return `
                <div class="notif-item-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.03); transition: transform 0.15s ease, box-shadow 0.15s ease;">
                    
                    <!-- Fila Superior: Badge tipo + Fecha + Metadatos -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem;">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="${typeBadgeStyle} font-size: 0.72rem; font-weight: 900; text-transform: uppercase; padding: 4px 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                                ${typeLabel}
                            </span>
                            <span style="font-size: 0.78rem; font-weight: 700; color: #64748b; display: inline-flex; align-items: center; gap: 5px;">
                                <i class="far fa-clock"></i> ${formatDate(item.createdAt)}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 0.78rem; color: #64748b; font-weight: 700;">
                            <span title="Emisor del mensaje">
                                <i class="fas fa-user-shield" style="color: #0f172a;"></i> ${escapeHtml(item.authorName || 'SuperAdmin')}
                            </span>
                            <span>•</span>
                            <span title="Alcance del mensaje">
                                <i class="fas fa-users" style="color: #0f172a;"></i> Alcance: <strong style="color: #0f172a;">${escapeHtml(item.targetCount || 'Todos')}</strong>
                            </span>
                        </div>
                    </div>

                    <!-- Fila Central: Título y Cuerpo -->
                    <div style="margin-bottom: 1.25rem;">
                        <h3 style="margin: 0 0 6px 0; font-size: 1.2rem; font-weight: 900; color: #0f172a; line-height: 1.35;">
                            ${escapeHtml(item.title)}
                        </h3>
                        <p style="margin: 0; font-size: 0.92rem; color: #475569; line-height: 1.55; white-space: pre-line;">
                            ${escapeHtml(item.body || 'Sin descripción adicional')}
                        </p>
                    </div>

                    <!-- Fila Inferior: Acciones Destructivas & Meta IDs -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
                        <div style="font-size: 0.72rem; font-family: monospace; color: #94a3b8; display: flex; gap: 10px; align-items: center;">
                            <span>ID: <strong style="color: #64748b;">${escapeHtml(item.id)}</strong></span>
                            ${item.data?.broadcastId ? `<span>• BroadcastID: <strong style="color: #64748b;">${escapeHtml(item.data.broadcastId)}</strong></span>` : ''}
                        </div>

                        <!-- Botón destructivo destacado -->
                        <button id="btn-purge-${escapeHtml(item.id)}"
                                onclick="window.AdminNotificationsManagerCtrl.confirmDelete('${escapeHtml(item.id)}')"
                                ${isCurrentDeleting ? 'disabled' : ''}
                                style="background: #fee2e2; color: #b91c1c; border: 1px solid #f87171; border-radius: 10px; padding: 10px 18px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);"
                                onmouseover="if (!this.disabled) { this.style.background='#ef4444'; this.style.color='#ffffff'; }"
                                onmouseout="if (!this.disabled) { this.style.background='#fee2e2'; this.style.color='#b91c1c'; }">
                            ${isCurrentDeleting 
                                ? '<i class="fas fa-spinner fa-spin"></i> Purgando de todas las cuentas...' 
                                : '<i class="fas fa-trash-alt"></i> ELIMINAR DE TODAS LAS CUENTAS'}
                        </button>
                    </div>

                </div>
            `;
        }
    }

    const controller = new AdminNotificationsManagerController();
    window.AdminNotificationsManagerCtrl = controller;
    window.AdminViews.notifications_manager = async function () {
        await controller.init();
    };

    console.log("🔔 [AdminNotificationsManager] Módulo Gestor Global de Notificaciones cargado con éxito.");
})();
