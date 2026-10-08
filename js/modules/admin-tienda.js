/**
 * admin-tienda.js
 * Módulo de Administración Profesional de TIENDA SOMOSPADEL BCN
 * 
 * Acceso restringido por contraseña maestra: "PADEL21"
 * Diseño: Fondo blanco y texto negro de alta legibilidad
 * Proporciona un Backoffice E-Commerce completo:
 * 1. Autenticación de seguridad para la sección de tienda
 * 2. Dashboard con KPIs en tiempo real (facturación, comisiones, pedidos, catálogo, alertas de stock)
 * 3. Gestión integral de Catálogo (CRUD productos, stock +/-, destacados, estado activo/pausado)
 * 4. Gestión de Pedidos y Ventas (órdenes, estados de pago/envío, WhatsApp 1-clic)
 * 5. Campañas y Cupones de descuento (creación, edición, activación)
 * 6. Proveedores y Acuerdos Comerciales (comisiones, contactos, liquidaciones)
 * 7. Configuración global de la tienda (envíos gratis, WhatsApp comercial, banners, backup/restore)
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AdminTienda = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class AdminTiendaController {
        constructor() {
            this.currentTab = 'dashboard'; // 'dashboard' | 'catalogo' | 'pedidos' | 'promos' | 'partners' | 'ajustes'
            this.filterCategory = 'todos';
            this.filterStatus = 'todos';
            this.filterOrderState = 'todos';
            this.searchQuery = '';
            this.containerId = 'content-area';
        }

        get service() {
            return window.TiendaService;
        }

        async init(containerId = 'content-area') {
            this.containerId = containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            // Verificar si el servicio está disponible
            if (!this.service) {
                container.innerHTML = `
                    <div style="padding: 2.5rem; text-align: center; color: #dc2626; background: #ffffff; border-radius: 16px; border: 1.5px solid #fecaca; margin: 20px;">
                        <i class="fas fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 12px; color: #dc2626;"></i>
                        <h3 style="margin: 0 0 8px; font-weight: 900; color: #0f172a;">Error al cargar la tienda</h3>
                        <p style="margin: 0; color: #475569; font-size: 0.9rem;">TiendaService no está cargado. Asegúrate de incluir js/modules/tienda/TiendaService.js en admin.html.</p>
                    </div>`;
                return;
            }

            // Validar autenticación de seguridad con la contraseña PADEL21
            if (!this.service.isStoreAdminAuthenticated()) {
                this.renderLoginScreen();
                return;
            }

            // Si está autenticado, renderizar el panel e-commerce
            this.render();
        }

        // =========================================================================
        // 🔒 PANTALLA DE ACCESO RESTRINGIDO (CONTRASEÑA "PADEL21") - TEMA CLARO
        // =========================================================================
        renderLoginScreen(errorMessage = '') {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div style="min-height: 72vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #f8fafc;">
                    <div style="max-width: 440px; width: 100%; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 24px; padding: 38px 32px; box-shadow: 0 20px 45px rgba(0,0,0,0.06); text-align: center; color: #0f172a; position: relative; overflow: hidden;">
                        
                        <!-- Acentos decorativos de marca -->
                        <div style="position: absolute; top: -45px; right: -45px; width: 130px; height: 130px; background: rgba(204,255,0,0.25); border-radius: 50%; filter: blur(28px); pointer-events: none;"></div>
                        <div style="position: absolute; bottom: -45px; left: -45px; width: 130px; height: 130px; background: rgba(16,185,129,0.15); border-radius: 50%; filter: blur(28px); pointer-events: none;"></div>

                        <div style="width: 76px; height: 76px; margin: 0 auto 20px; background: #f1f5f9; border: 2.5px solid #0f172a; border-radius: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
                            <i class="fas fa-lock" style="font-size: 2rem; color: #0f172a;"></i>
                        </div>

                        <span style="display: inline-block; background: #fef08a; color: #713f12; font-size: 0.72rem; font-weight: 900; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid #fde047;">
                            🔒 Área Restringida
                        </span>

                        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 950; margin: 0 0 8px; color: #0f172a;">
                            ADMIN TIENDA ONLINE
                        </h2>
                        <p style="color: #475569; font-size: 0.85rem; margin: 0 0 24px; line-height: 1.5;">
                            Introduce la clave de administración para acceder al catálogo, pedidos, stock, precios y proveedores oficiales de SomosPadel BCN.
                        </p>

                        ${errorMessage ? `
                            <div style="background: #fef2f2; border: 1.5px solid #fecaca; color: #b91c1c; padding: 11px 14px; border-radius: 12px; font-size: 0.82rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; justify-content: center;">
                                <i class="fas fa-circle-exclamation"></i>
                                <span>${errorMessage}</span>
                            </div>
                        ` : ''}

                        <form onsubmit="window.AdminTienda.handleLogin(event)" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Contraseña de Tienda
                                </label>
                                <div style="position: relative;">
                                    <input type="password" id="sp-tienda-admin-pass" required autofocus placeholder="Introduce la contraseña..." 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 13px 44px 13px 14px; color: #0f172a; font-size: 0.95rem; font-weight: 700; outline: none; transition: border-color 0.2s;"
                                        onfocus="this.style.borderColor='#0f172a'" onblur="this.style.borderColor='#cbd5e1'">
                                    <button type="button" onclick="window.AdminTienda.togglePasswordVisibility()" 
                                        style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; font-size: 1rem;">
                                        <i class="fas fa-eye" id="sp-tienda-eye-icon"></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" 
                                style="width: 100%; background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 13px; border-radius: 12px; font-weight: 950; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); transition: transform 0.15s ease;"
                                onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                                <i class="fas fa-key"></i> DESBLOQUEAR PANEL TIENDA
                            </button>
                        </form>

                        <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                            <a href="tienda.html" style="color: #0f172a; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-arrow-left"></i> Ver Tienda Pública
                            </a>
                            <span style="color: #64748b; font-weight: 600;">Clave requerida</span>
                        </div>
                    </div>
                </div>
            `;
        }

        togglePasswordVisibility() {
            const input = document.getElementById('sp-tienda-admin-pass');
            const icon = document.getElementById('sp-tienda-eye-icon');
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        }

        handleLogin(e) {
            e.preventDefault();
            const input = document.getElementById('sp-tienda-admin-pass');
            const password = input ? input.value : '';

            if (this.service.loginStoreAdmin(password)) {
                this.showToast('¡Acceso concedido al Área de Administración de Tienda! 🎾');
                this.render();
            } else {
                this.renderLoginScreen('Contraseña incorrecta. Contacta con Dirección.');
            }
        }

        handleLogout() {
            if (confirm('¿Deseas bloquear la sección de administración de la tienda? Se volverá a requerir la contraseña.')) {
                this.service.logoutStoreAdmin();
                this.showToast('Sesión de administración de tienda bloqueada.');
                this.renderLoginScreen();
            }
        }

        // =========================================================================
        // 🖥️ RENDER PRINCIPAL DEL BACKOFFICE E-COMMERCE - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        render() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const products = this.service.getProducts();
            const partners = this.service.getPartners();
            const promos = this.service.getPromotions();
            const orders = this.service.getOrders();
            const settings = this.service.getSettings();

            // Cálculos y Métricas
            const totalProducts = products.length;
            const totalOrders = orders.length;

            container.innerHTML = `
                <div class="fade-in" style="padding-bottom: 50px; font-family: 'Inter', -apple-system, sans-serif; color: #0f172a; background: #f8fafc; min-height: 80vh;">
                    
                    <!-- HERO SUPERIOR / HEADER PROFESIONAL DE TIENDA -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 24px 28px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap: wrap;">
                                <span style="background: #CCFF00; color: #000; font-size: 0.7rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; border: 1px solid #000;">
                                    🛍️ E-COMMERCE BACKOFFICE
                                </span>
                                <span style="background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; border: 1px solid #bbf7d0;">
                                    <i class="fas fa-circle-check"></i> TIENDA ACTIVA
                                </span>
                                <span style="color: #64748b; font-size: 0.78rem; font-weight: 700;">SomosPadel BCN Official Store</span>
                            </div>
                            <h1 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.7rem; font-weight: 950; color: #0f172a; line-height: 1.2;">
                                CONTROL TOTAL DE TIENDA <span style="background: #fef08a; padding: 0 6px; border-radius: 6px;">SOMOSPADEL</span>
                            </h1>
                            <p style="margin: 6px 0 0; color: #475569; font-size: 0.85rem;">
                                Gestión centralizada de catálogo, inventario, precios, pedidos, marcas colaboradoras y facturación.
                            </p>
                        </div>

                        <!-- ACCIONES RÁPIDAS SUPERIORES -->
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                            <a href="tienda.html" target="_blank" style="background: #f8fafc; color: #0f172a; text-decoration: none; border: 1.5px solid #cbd5e1; padding: 9px 15px; border-radius: 12px; font-weight: 800; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; transition: background 0.15s;">
                                <i class="fas fa-arrow-up-right-from-square" style="color: #0284c7;"></i> Ver Tienda Pública
                            </a>
                            <button onclick="window.AdminTienda.openCreateProductModal()" style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 9px 16px; border-radius: 12px; font-weight: 950; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                <i class="fas fa-plus"></i> NUEVO PRODUCTO
                            </button>
                            <button onclick="window.AdminTienda.openCreateOrderModal()" style="background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; padding: 9px 15px; border-radius: 12px; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-cart-plus"></i> REGISTRAR PEDIDO
                            </button>
                            <button onclick="window.AdminTienda.handleLogout()" title="Bloquear y salir del modo admin de tienda" style="background: #fef2f2; color: #b91c1c; border: 1.5px solid #fecaca; padding: 9px 14px; border-radius: 12px; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-lock"></i> BLOQUEAR
                            </button>
                        </div>
                    </div>

                    <!-- BARRA DE PESTAÑAS (TABS DEL BACKOFFICE) -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 22px; border-bottom: 1.5px solid #e2e8f0;">
                        <button onclick="window.AdminTienda.switchTab('dashboard')" 
                            style="background: ${this.currentTab === 'dashboard' ? '#CCFF00' : '#ffffff'}; color: #000; border: ${this.currentTab === 'dashboard' ? '1.5px solid #000' : '1px solid #cbd5e1'}; padding: 10px 16px; border-radius: 12px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-chart-pie"></i> DASHBOARD & KPIS
                        </button>
                        <button onclick="window.AdminTienda.switchTab('catalogo')" 
                            style="background: ${this.currentTab === 'catalogo' ? '#CCFF00' : '#ffffff'}; color: #000; border: ${this.currentTab === 'catalogo' ? '1.5px solid #000' : '1px solid #cbd5e1'}; padding: 10px 16px; border-radius: 12px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-boxes-stacked"></i> CATÁLOGO DE PRODUCTOS (${totalProducts})
                        </button>
                        <button onclick="window.AdminTienda.switchTab('pedidos')" 
                            style="background: ${this.currentTab === 'pedidos' ? '#CCFF00' : '#ffffff'}; color: #000; border: ${this.currentTab === 'pedidos' ? '1.5px solid #000' : '1px solid #cbd5e1'}; padding: 10px 16px; border-radius: 12px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-receipt"></i> PEDIDOS & VENTAS (${totalOrders})
                        </button>
                        <button onclick="window.AdminTienda.switchTab('promos')" 
                            style="background: ${this.currentTab === 'promos' ? '#CCFF00' : '#ffffff'}; color: #000; border: ${this.currentTab === 'promos' ? '1.5px solid #000' : '1px solid #cbd5e1'}; padding: 10px 16px; border-radius: 12px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-ticket"></i> CUPONES & PROMOS (${promos.length})
                        </button>
                        <button onclick="window.AdminTienda.switchTab('partners')" 
                            style="background: ${this.currentTab === 'partners' ? '#CCFF00' : '#ffffff'}; color: #000; border: ${this.currentTab === 'partners' ? '1.5px solid #000' : '1px solid #cbd5e1'}; padding: 10px 16px; border-radius: 12px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-handshake"></i> MARCAS & PARTNERS (${partners.length})
                        </button>
                        <button onclick="window.AdminTienda.switchTab('ajustes')" 
                            style="background: ${this.currentTab === 'ajustes' ? '#CCFF00' : '#ffffff'}; color: #000; border: ${this.currentTab === 'ajustes' ? '1.5px solid #000' : '1px solid #cbd5e1'}; padding: 10px 16px; border-radius: 12px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-gears"></i> CONFIGURACIÓN
                        </button>
                    </div>

                    <!-- CONTENIDO DE LA PESTAÑA ACTIVA -->
                    <div id="sp-tienda-tab-content">
                        ${this.renderTabContent()}
                    </div>

                    <!-- CONTENEDOR MODAL DE LA TIENDA -->
                    <div id="sp-tienda-admin-modal-root"></div>
                </div>
            `;
        }

        switchTab(tab) {
            this.currentTab = tab;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        renderTabContent() {
            switch (this.currentTab) {
                case 'dashboard':
                    return this.renderDashboardTab();
                case 'catalogo':
                    return this.renderCatalogoTab();
                case 'pedidos':
                    return this.renderPedidosTab();
                case 'promos':
                    return this.renderPromosTab();
                case 'partners':
                    return this.renderPartnersTab();
                case 'ajustes':
                    return this.renderAjustesTab();
                default:
                    return this.renderDashboardTab();
            }
        }

        // =========================================================================
        // 1. TAB: DASHBOARD & KPIS - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        renderDashboardTab() {
            const products = this.service.getProducts();
            const partners = this.service.getPartners();
            const orders = this.service.getOrders();

            const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
            const totalCommissions = partners.reduce((sum, pt) => sum + (parseFloat(pt.accumulatedCommission) || 0), 0);
            const lowStockProducts = products.filter(p => (p.stock || 0) < 3);

            return `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- TARJETAS DE KPIS PRINCIPALES -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px;">
                        
                        <!-- KPI FACTURACIÓN -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:0.75rem; font-weight:850; color:#475569; text-transform:uppercase; letter-spacing: 0.5px;">Facturación Registrada</span>
                                <div style="width:38px; height:38px; border-radius:12px; background:#fef08a; border: 1px solid #fde047; display:flex; align-items:center; justify-content:center; color:#713f12;">
                                    <i class="fas fa-euro-sign" style="font-weight:900;"></i>
                                </div>
                            </div>
                            <div style="font-family:'Outfit',sans-serif; font-size:1.85rem; font-weight:950; color:#0f172a;">
                                ${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </div>
                            <div style="font-size:0.75rem; color:#16a34a; font-weight:800; margin-top:6px; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-arrow-trend-up"></i> ${orders.length} pedidos procesados
                            </div>
                        </div>

                        <!-- KPI COMISIONES -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:0.75rem; font-weight:850; color:#475569; text-transform:uppercase; letter-spacing: 0.5px;">Beneficio / Comisiones</span>
                                <div style="width:38px; height:38px; border-radius:12px; background:#dcfce7; border: 1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; color:#166534;">
                                    <i class="fas fa-sack-dollar"></i>
                                </div>
                            </div>
                            <div style="font-family:'Outfit',sans-serif; font-size:1.85rem; font-weight:950; color:#16a34a;">
                                ${totalCommissions.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </div>
                            <div style="font-size:0.75rem; color:#64748b; font-weight:700; margin-top:6px;">
                                Rendimiento estimado: 15%
                            </div>
                        </div>

                        <!-- KPI PRODUCTOS -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:0.75rem; font-weight:850; color:#475569; text-transform:uppercase; letter-spacing: 0.5px;">Catálogo Tienda</span>
                                <div style="width:38px; height:38px; border-radius:12px; background:#e0f2fe; border: 1px solid #bae6fd; display:flex; align-items:center; justify-content:center; color:#0369a1;">
                                    <i class="fas fa-boxes-stacked"></i>
                                </div>
                            </div>
                            <div style="font-family:'Outfit',sans-serif; font-size:1.85rem; font-weight:950; color:#0f172a;">
                                ${products.length}
                            </div>
                            <div style="font-size:0.75rem; color:#475569; font-weight:700; margin-top:6px;">
                                ${products.filter(p => p.featured).length} productos en escaparate
                            </div>
                        </div>

                        <!-- KPI ALERTAS INVENTARIO -->
                        <div style="background: #ffffff; border: 1.5px solid ${lowStockProducts.length > 0 ? '#fca5a5' : '#e2e8f0'}; border-radius: 18px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:0.75rem; font-weight:850; color:#475569; text-transform:uppercase; letter-spacing: 0.5px;">Alerta de Inventario</span>
                                <div style="width:38px; height:38px; border-radius:12px; background:${lowStockProducts.length > 0 ? '#fee2e2' : '#f0fdf4'}; border: 1px solid ${lowStockProducts.length > 0 ? '#fecaca' : '#bbf7d0'}; display:flex; align-items:center; justify-content:center; color:${lowStockProducts.length > 0 ? '#dc2626' : '#16a34a'};">
                                    <i class="fas fa-triangle-exclamation"></i>
                                </div>
                            </div>
                            <div style="font-family:'Outfit',sans-serif; font-size:1.85rem; font-weight:950; color:${lowStockProducts.length > 0 ? '#dc2626' : '#16a34a'};">
                                ${lowStockProducts.length}
                            </div>
                            <div style="font-size:0.75rem; color:${lowStockProducts.length > 0 ? '#dc2626' : '#16a34a'}; font-weight:800; margin-top:6px;">
                                ${lowStockProducts.length > 0 ? 'Productos con stock < 3 uds' : 'Stock en niveles óptimos'}
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN INFERIOR: STOCK BAJO & TOP PRODUCTOS -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 20px;">
                        
                        <!-- LISTA DE ALERTA DE STOCK BAJO -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                                <h3 style="font-size:1.05rem; font-weight:950; margin:0; display:flex; align-items:center; gap:8px; color: #0f172a;">
                                    <i class="fas fa-warehouse" style="color:#dc2626;"></i> Alertas de Stock Bajo
                                </h3>
                                <button onclick="window.AdminTienda.switchTab('catalogo')" style="background:none; border:none; color:#0f172a; font-size:0.8rem; font-weight:900; cursor:pointer; text-decoration: underline;">
                                    Gestionar Todo <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>

                            ${lowStockProducts.length === 0 ? `
                                <div style="text-align:center; padding:32px 10px; color:#64748b;">
                                    <i class="fas fa-circle-check" style="font-size:2.2rem; color:#16a34a; margin-bottom:10px;"></i>
                                    <p style="margin:0; font-weight:800; font-size:0.9rem; color:#0f172a;">Todos los productos tienen existencias suficientes.</p>
                                </div>
                            ` : `
                                <div style="display:flex; flex-direction:column; gap:10px;">
                                    ${lowStockProducts.map(p => `
                                        <div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:12px 14px; border-radius:12px; border:1px solid #fee2e2;">
                                            <div style="display:flex; align-items:center; gap:10px;">
                                                <img src="${p.image}" alt="" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #cbd5e1;">
                                                <div>
                                                    <div style="font-size:0.85rem; font-weight:900; color:#0f172a;">${p.name}</div>
                                                    <div style="font-size:0.72rem; color:#64748b;">${p.brand} • ${p.promoPrice}€</div>
                                                </div>
                                            </div>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <span style="background:#fee2e2; color:#dc2626; font-weight:950; font-size:0.75rem; padding:4px 8px; border-radius:6px; border: 1px solid #fecaca;">
                                                    ${p.stock || 0} uds
                                                </span>
                                                <button onclick="window.AdminTienda.quickStockChange('${p.id}', 5)" title="Añadir 5 unidades de stock" 
                                                    style="background:#0f172a; color:#fff; border:none; padding:5px 9px; border-radius:6px; font-weight:900; font-size:0.75rem; cursor:pointer;">
                                                    +5
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>

                        <!-- ÚLTIMOS PEDIDOS REGISTRADOS -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                                <h3 style="font-size:1.05rem; font-weight:950; margin:0; display:flex; align-items:center; gap:8px; color: #0f172a;">
                                    <i class="fas fa-clock-rotate-left" style="color:#0f172a;"></i> Pedidos Recientes
                                </h3>
                                <button onclick="window.AdminTienda.switchTab('pedidos')" style="background:none; border:none; color:#0f172a; font-size:0.8rem; font-weight:900; cursor:pointer; text-decoration: underline;">
                                    Ver Todos <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:10px;">
                                ${orders.slice(0, 4).map(o => `
                                    <div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:12px 14px; border-radius:12px; border:1px solid #e2e8f0;">
                                        <div>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <span style="font-weight:950; font-size:0.82rem; color:#0f172a; font-family: monospace;">${o.id}</span>
                                                <span style="font-size:0.82rem; color:#0f172a; font-weight:800;">${o.customerName}</span>
                                            </div>
                                            <div style="font-size:0.72rem; color:#64748b; margin-top:2px;">
                                                ${o.date} • ${o.paymentMethod}
                                            </div>
                                        </div>
                                        <div style="text-align:right;">
                                            <div style="font-weight:950; font-size:0.92rem; color:#0f172a;">${o.totalAmount}€</div>
                                            <span style="display:inline-block; font-size:0.68rem; font-weight:900; padding:2px 8px; border-radius:6px; margin-top:2px; ${this.getOrderStatusBadgeStyle(o.status)}">
                                                ${o.status}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 2. TAB: CATÁLOGO DE PRODUCTOS (CRUD PROFESIONAL) - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        renderCatalogoTab() {
            const allProducts = this.service.getProducts();
            const categories = this.service.getCategories();
            const partners = this.service.getPartners();

            // Filtrado
            let filtered = allProducts.filter(p => {
                if (this.filterCategory !== 'todos' && p.category !== this.filterCategory) {
                    return false;
                }
                if (this.filterStatus === 'activos' && p.active === false) return false;
                if (this.filterStatus === 'pausados' && p.active !== false) return false;
                if (this.filterStatus === 'sin_stock' && (p.stock || 0) > 0) return false;
                if (this.filterStatus === 'destacados' && !p.featured) return false;

                if (this.searchQuery.trim() !== '') {
                    const q = this.searchQuery.toLowerCase();
                    const text = `${p.name} ${p.brand} ${p.description || ''}`.toLowerCase();
                    if (!text.includes(q)) return false;
                }
                return true;
            });

            return `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- BARRA DE HERRAMIENTAS Y FILTROS -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        
                        <!-- BUSCADOR -->
                        <div style="position: relative; min-width: 250px; flex: 1;">
                            <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.85rem;"></i>
                            <input type="text" placeholder="Buscar por producto, marca o descripción..." 
                                value="${this.searchQuery}"
                                oninput="window.AdminTienda.handleSearch(this.value)"
                                style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 14px 10px 38px; color: #0f172a; font-size: 0.85rem; font-weight: 700; outline: none;">
                        </div>

                        <!-- SELECT DE CATEGORÍA -->
                        <select onchange="window.AdminTienda.handleCategoryFilter(this.value)" 
                            style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; color: #0f172a; font-size: 0.85rem; font-weight: 800; outline: none; cursor: pointer;">
                            ${categories.map(c => `
                                <option value="${c.id}" ${this.filterCategory === c.id ? 'selected' : ''}>${c.name}</option>
                            `).join('')}
                        </select>

                        <!-- SELECT DE ESTADO -->
                        <select onchange="window.AdminTienda.handleStatusFilter(this.value)" 
                            style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; color: #0f172a; font-size: 0.85rem; font-weight: 800; outline: none; cursor: pointer;">
                            <option value="todos" ${this.filterStatus === 'todos' ? 'selected' : ''}>Todos los Estados</option>
                            <option value="activos" ${this.filterStatus === 'activos' ? 'selected' : ''}>Solo Activos</option>
                            <option value="pausados" ${this.filterStatus === 'pausados' ? 'selected' : ''}>Pausados / Ocultos</option>
                            <option value="sin_stock" ${this.filterStatus === 'sin_stock' ? 'selected' : ''}>Sin Stock (0 uds)</option>
                            <option value="destacados" ${this.filterStatus === 'destacados' ? 'selected' : ''}>Destacados ⭐</option>
                        </select>

                        <!-- BOTONES DE ACCIÓN -->
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.AdminTienda.openCreateProductModal()" 
                                style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 18px; border-radius: 10px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                <i class="fas fa-plus"></i> CREAR PRODUCTO
                            </button>
                        </div>
                    </div>

                    <!-- TABLA PROFESIONAL DE PRODUCTOS -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; color: #475569; font-weight: 850; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.5px;">
                                        <th style="padding: 14px 16px;">Producto</th>
                                        <th style="padding: 14px 16px;">Marca & Cat.</th>
                                        <th style="padding: 14px 16px;">Precio PVP / Oferta</th>
                                        <th style="padding: 14px 16px; text-align: center;">Stock</th>
                                        <th style="padding: 14px 16px; text-align: center;">Destacado</th>
                                        <th style="padding: 14px 16px; text-align: center;">Estado</th>
                                        <th style="padding: 14px 16px; text-align: right;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filtered.length === 0 ? `
                                        <tr>
                                            <td colspan="7" style="padding: 44px; text-align: center; color: #64748b;">
                                                <i class="fas fa-box-open" style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"></i>
                                                <p style="margin: 0; font-weight: 800; color: #0f172a;">No se encontraron productos con los filtros seleccionados.</p>
                                            </td>
                                        </tr>
                                    ` : filtered.map(p => {
                                        const partner = partners.find(pt => pt.id === p.partnerId);
                                        const discount = p.originalPrice > p.promoPrice 
                                             ? Math.round(((p.originalPrice - p.promoPrice) / p.originalPrice) * 100) 
                                             : 0;
                                        const isLow = (p.stock || 0) < 3;

                                        return `
                                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                                <!-- FOTO Y NOMBRE -->
                                                <td style="padding: 12px 16px;">
                                                    <div style="display: flex; align-items: center; gap: 12px;">
                                                        <img src="${p.image}" alt="" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1.5px solid #cbd5e1; flex-shrink: 0;">
                                                        <div>
                                                            <div style="font-weight: 850; color: #0f172a; font-size: 0.88rem;">${p.name}</div>
                                                            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                                                                ID: <span style="font-family: monospace; color: #0f172a; font-weight: 700;">${p.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <!-- MARCA Y CATEGORÍA -->
                                                <td style="padding: 12px 16px;">
                                                    <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 850; font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; border: 1px solid #bae6fd;">
                                                        ${p.brand}
                                                    </span>
                                                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px; text-transform: capitalize; font-weight: 600;">
                                                        ${p.category} ${partner ? `• ${partner.name}` : ''}
                                                    </div>
                                                </td>

                                                <!-- PRECIOS -->
                                                <td style="padding: 12px 16px;">
                                                    <div style="display: flex; align-items: baseline; gap: 6px;">
                                                        <span style="font-weight: 950; font-size: 0.98rem; color: #0f172a;">${p.promoPrice}€</span>
                                                        ${p.originalPrice > p.promoPrice ? `
                                                            <span style="font-size: 0.75rem; color: #94a3b8; text-decoration: line-through;">${p.originalPrice}€</span>
                                                            <span style="background: #fee2e2; color: #dc2626; font-weight: 900; font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; border: 1px solid #fecaca;">-${discount}%</span>
                                                        ` : ''}
                                                    </div>
                                                </td>

                                                <!-- STOCK RÁPIDO -->
                                                <td style="padding: 12px 16px; text-align: center;">
                                                    <div style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; padding: 4px 8px; border-radius: 8px; border: 1.5px solid ${isLow ? '#fca5a5' : '#cbd5e1'};">
                                                        <button onclick="window.AdminTienda.quickStockChange('${p.id}', -1)" title="Reducir stock" 
                                                            style="background: none; border: none; color: #0f172a; cursor: pointer; font-weight: 950; font-size: 0.9rem; padding: 0 4px;">-</button>
                                                        <span style="font-weight: 950; font-size: 0.88rem; color: ${isLow ? '#dc2626' : '#0f172a'}; min-width: 24px;">${p.stock || 0}</span>
                                                        <button onclick="window.AdminTienda.quickStockChange('${p.id}', 1)" title="Aumentar stock" 
                                                            style="background: none; border: none; color: #0f172a; cursor: pointer; font-weight: 950; font-size: 0.9rem; padding: 0 4px;">+</button>
                                                    </div>
                                                </td>

                                                <!-- DESTACADO TOGGLE -->
                                                <td style="padding: 12px 16px; text-align: center;">
                                                    <button onclick="window.AdminTienda.toggleFeatured('${p.id}')" title="Alternar destacado" 
                                                        style="background: none; border: none; cursor: pointer; font-size: 1.25rem; color: ${p.featured ? '#eab308' : '#cbd5e1'}; transition: transform 0.1s;">
                                                        <i class="${p.featured ? 'fas' : 'far'} fa-star"></i>
                                                    </button>
                                                </td>

                                                <!-- ESTADO ACTIVO/PAUSADO -->
                                                <td style="padding: 12px 16px; text-align: center;">
                                                    <button onclick="window.AdminTienda.toggleActive('${p.id}')" 
                                                        style="background: ${p.active !== false ? '#dcfce7' : '#fee2e2'}; color: ${p.active !== false ? '#166534' : '#991b1b'}; border: 1.5px solid ${p.active !== false ? '#bbf7d0' : '#fecaca'}; font-size: 0.72rem; font-weight: 950; padding: 4px 11px; border-radius: 20px; cursor: pointer;">
                                                        ${p.active !== false ? '● ACTIVO' : '○ PAUSADO'}
                                                    </button>
                                                </td>

                                                <!-- ACCIONES -->
                                                <td style="padding: 12px 16px; text-align: right;">
                                                    <div style="display: inline-flex; gap: 6px;">
                                                        <button onclick="window.AdminTienda.openEditProductModal('${p.id}')" title="Editar producto" 
                                                            style="background: #f8fafc; color: #0f172a; border: 1.5px solid #cbd5e1; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;">
                                                            <i class="fas fa-pencil"></i>
                                                        </button>
                                                        <button onclick="window.AdminTienda.confirmDeleteProduct('${p.id}')" title="Eliminar producto" 
                                                            style="background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 3. TAB: PEDIDOS & VENTAS (ÓRDENES) - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        renderPedidosTab() {
            const orders = this.service.getOrders();

            let filtered = orders.filter(o => {
                if (this.filterOrderState !== 'todos' && o.status !== this.filterOrderState) {
                    return false;
                }
                return true;
            });

            return `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- BARRA SUPERIOR DE PEDIDOS -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-weight: 850; font-size: 0.85rem; color: #0f172a;">Filtrar por Estado:</span>
                            <select onchange="window.AdminTienda.handleOrderStateFilter(this.value)" 
                                style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 9px 14px; color: #0f172a; font-size: 0.85rem; font-weight: 800; outline: none; cursor: pointer;">
                                <option value="todos" ${this.filterOrderState === 'todos' ? 'selected' : ''}>Todos los Estados</option>
                                <option value="Pendiente" ${this.filterOrderState === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="Pagado" ${this.filterOrderState === 'Pagado' ? 'selected' : ''}>Pagado</option>
                                <option value="Enviado" ${this.filterOrderState === 'Enviado' ? 'selected' : ''}>Enviado</option>
                                <option value="Entregado" ${this.filterOrderState === 'Entregado' ? 'selected' : ''}>Entregado</option>
                                <option value="Cancelado" ${this.filterOrderState === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.AdminTienda.openCreateOrderModal()" 
                                style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 18px; border-radius: 10px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                <i class="fas fa-plus"></i> REGISTRAR VENTA MANUAL
                            </button>
                        </div>
                    </div>

                    <!-- TABLA DE PEDIDOS -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; color: #475569; font-weight: 850; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.5px;">
                                        <th style="padding: 14px 16px;">Pedido ID</th>
                                        <th style="padding: 14px 16px;">Fecha</th>
                                        <th style="padding: 14px 16px;">Cliente</th>
                                        <th style="padding: 14px 16px;">Productos</th>
                                        <th style="padding: 14px 16px;">Total / Comisión</th>
                                        <th style="padding: 14px 16px; text-align: center;">Estado</th>
                                        <th style="padding: 14px 16px; text-align: right;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filtered.length === 0 ? `
                                        <tr>
                                            <td colspan="7" style="padding: 44px; text-align: center; color: #64748b;">
                                                <i class="fas fa-receipt" style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"></i>
                                                <p style="margin: 0; font-weight: 800; color: #0f172a;">No hay pedidos registrados con este criterio.</p>
                                            </td>
                                        </tr>
                                    ` : filtered.map(o => `
                                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 12px 16px; font-weight: 950; color: #0f172a; font-family: monospace;">
                                                ${o.id}
                                            </td>
                                            <td style="padding: 12px 16px; color: #64748b; font-size: 0.78rem; font-weight: 600;">
                                                ${o.date}
                                            </td>
                                            <td style="padding: 12px 16px;">
                                                <div style="font-weight: 850; color: #0f172a;">${o.customerName}</div>
                                                <div style="font-size: 0.72rem; color: #64748b;">${o.customerPhone || 'Sin tel'}</div>
                                            </td>
                                            <td style="padding: 12px 16px;">
                                                ${(o.products || []).map(p => `
                                                    <div style="font-size: 0.78rem; color: #334155; font-weight: 600;">
                                                        • ${p.qty}x ${p.name}
                                                    </div>
                                                `).join('')}
                                            </td>
                                            <td style="padding: 12px 16px;">
                                                <div style="font-weight: 950; color: #0f172a; font-size: 0.95rem;">${o.totalAmount}€</div>
                                                <div style="font-size: 0.72rem; color: #16a34a; font-weight: 800;">Comisión: ${o.commission || 0}€</div>
                                            </td>
                                            <td style="padding: 12px 16px; text-align: center;">
                                                <select onchange="window.AdminTienda.changeOrderStatus('${o.id}', this.value)" 
                                                    style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 5px 9px; color: #0f172a; font-size: 0.78rem; font-weight: 850; cursor: pointer;">
                                                    <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                                    <option value="Pagado" ${o.status === 'Pagado' ? 'selected' : ''}>Pagado</option>
                                                    <option value="Enviado" ${o.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                                                    <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                                                    <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                                </select>
                                            </td>
                                            <td style="padding: 12px 16px; text-align: right;">
                                                <div style="display: inline-flex; gap: 6px;">
                                                    ${o.customerPhone ? `
                                                        <button onclick="window.AdminTienda.sendOrderWhatsApp('${o.id}')" title="Enviar WhatsApp al cliente" 
                                                            style="background: #dcfce7; color: #15803d; border: 1.5px solid #bbf7d0; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;">
                                                            <i class="fab fa-whatsapp"></i>
                                                        </button>
                                                    ` : ''}
                                                    <button onclick="window.AdminTienda.deleteOrder('${o.id}')" title="Eliminar pedido" 
                                                        style="background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        getOrderStatusBadgeStyle(status) {
            switch (status) {
                case 'Pagado':
                    return 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';
                case 'Enviado':
                    return 'background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;';
                case 'Entregado':
                    return 'background: #fef08a; color: #713f12; border: 1px solid #fde047;';
                case 'Cancelado':
                    return 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;';
                case 'Pendiente':
                default:
                    return 'background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa;';
            }
        }

        // =========================================================================
        // 4. TAB: CUPONES & PROMOCIONES - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        renderPromosTab() {
            const promos = this.service.getPromotions();

            return `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 18px 22px; border-radius: 16px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 950; color: #0f172a;">Cupones de Descuento & Promociones Activas</h3>
                            <p style="margin: 4px 0 0; font-size: 0.82rem; color: #475569;">Configura códigos promocionales para la comunidad de jugadores SomosPadel BCN.</p>
                        </div>
                        <button onclick="window.AdminTienda.openCreatePromoModal()" 
                            style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 18px; border-radius: 10px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <i class="fas fa-plus"></i> NUEVO CUPÓN
                        </button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px;">
                        ${promos.map(pr => `
                            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 22px; position: relative; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <span style="background: #fef08a; color: #713f12; font-weight: 950; font-size: 0.72rem; padding: 3px 9px; border-radius: 6px; border: 1px solid #fde047;">
                                        ${pr.badge || 'PROMO'}
                                    </span>
                                    <button onclick="window.AdminTienda.deletePromo('${pr.id}')" title="Eliminar cupón" 
                                        style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 0.95rem;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>

                                <div style="font-weight: 950; font-size: 1.1rem; color: #0f172a; margin-bottom: 6px;">
                                    ${pr.title}
                                </div>
                                <p style="color: #475569; font-size: 0.78rem; margin: 0 0 16px; min-height: 36px; line-height: 1.4;">
                                    ${pr.description}
                                </p>

                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 14px; border-radius: 12px; border: 1.5px dashed #0f172a;">
                                    <div>
                                        <div style="font-size: 0.68rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Código Cupón:</div>
                                        <div style="font-family: monospace; font-weight: 950; font-size: 1.15rem; color: #0f172a;">${pr.code}</div>
                                    </div>
                                    <button onclick="window.AdminTienda.copyCoupon('${pr.code}')" title="Copiar código" 
                                        style="background: #0f172a; color: #fff; border: none; padding: 7px 12px; border-radius: 8px; font-weight: 850; font-size: 0.75rem; cursor: pointer;">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>

                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 0.72rem; color: #64748b;">
                                    <span>Válido hasta: <strong style="color: #0f172a;">${pr.validUntil}</strong></span>
                                    <span style="color: #16a34a; font-weight: 900;">${pr.discountText}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 5. TAB: MARCAS & PARTNERS - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        renderPartnersTab() {
            const partners = this.service.getPartners();

            return `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 18px 22px; border-radius: 16px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 950; color: #0f172a;">Acuerdos Comerciales & Marcas Oficiales</h3>
                            <p style="margin: 4px 0 0; font-size: 0.82rem; color: #475569;">Gestión de comisiones pactadas, contactos y volumen generado con proveedores oficiales.</p>
                        </div>
                        <button onclick="window.AdminTienda.openCreatePartnerModal()" 
                            style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 18px; border-radius: 10px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <i class="fas fa-plus"></i> NUEVO PARTNER
                        </button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
                        ${partners.map(pt => `
                            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; border: 2px solid #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 1rem; color: #0f172a;">
                                            ${pt.logoText || 'SP'}
                                        </div>
                                        <div>
                                            <div style="font-weight: 950; font-size: 1.05rem; color: #0f172a;">${pt.name}</div>
                                            <div style="font-size: 0.72rem; color: #0284c7; font-weight: 800;">${pt.agreementType}</div>
                                        </div>
                                    </div>
                                    <button onclick="window.AdminTienda.openEditPartnerModal('${pt.id}')" title="Editar acuerdo" 
                                        style="background: #f8fafc; color: #0f172a; border: 1.5px solid #cbd5e1; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;">
                                        <i class="fas fa-pencil"></i>
                                    </button>
                                </div>

                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; font-size: 0.8rem; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div>
                                        <span style="color: #64748b; display: block; font-size: 0.68rem; font-weight: 700;">Comisión Pactada:</span>
                                        <strong style="color: #0f172a; font-size: 1rem;">${pt.agreedCommission}</strong>
                                    </div>
                                    <div>
                                        <span style="color: #64748b; display: block; font-size: 0.68rem; font-weight: 700;">Comisiones Acumuladas:</span>
                                        <strong style="color: #16a34a; font-size: 1rem;">${(pt.accumulatedCommission || 0).toLocaleString('es-ES')}€</strong>
                                    </div>
                                    <div style="grid-column: span 2; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                                        <span style="color: #64748b; display: block; font-size: 0.68rem; font-weight: 700;">Contacto:</span>
                                        <span style="color: #0f172a; font-weight: 700;">${pt.contactPerson} (${pt.phone || pt.email})</span>
                                    </div>
                                </div>

                                <p style="font-size: 0.75rem; color: #475569; margin: 0 0 14px; line-height: 1.4;">
                                    ${pt.internalNotes || 'Sin notas internas contractuales.'}
                                </p>

                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
                                    <span style="color: #64748b;">Renovación: <strong style="color: #0f172a;">${pt.renewalDate}</strong></span>
                                    ${pt.web ? `
                                        <a href="${pt.web}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 800;">
                                            Web Oficial <i class="fas fa-external-link-alt" style="font-size: 0.65rem;"></i>
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 6. TAB: CONFIGURACIÓN & AJUSTES DE TIENDA - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        renderAjustesTab() {
            const settings = this.service.getSettings();

            return `
                <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
                    
                    <!-- FORMULARIO DE AJUSTES GENERALES -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                        <h3 style="margin: 0 0 18px; font-size: 1.15rem; font-weight: 950; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-sliders" style="color: #0f172a;"></i> Parámetros de la Tienda Online
                        </h3>

                        <form onsubmit="window.AdminTienda.saveSettingsForm(event)" style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                                    Nombre Público de la Tienda
                                </label>
                                <input type="text" name="storeName" value="${settings.storeName || ''}" required 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                                        WhatsApp Oficial de Atención & Pedidos
                                    </label>
                                    <input type="text" name="whatsappPhone" value="${settings.whatsappPhone || ''}" placeholder="Ej: 34623456789" required 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                                        Email Comercial
                                    </label>
                                    <input type="email" name="emailContact" value="${settings.emailContact || ''}" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                                        Umbral de Envío Gratuito (€)
                                    </label>
                                    <input type="number" step="0.5" name="freeShippingThreshold" value="${settings.freeShippingThreshold || 50}" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                                        Gastos de Envío Estándar (€)
                                    </label>
                                    <input type="number" step="0.05" name="shippingCost" value="${settings.shippingCost || 4.95}" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                                    Banner de Anuncio en Tienda
                                </label>
                                <input type="text" name="announcementBanner" value="${settings.announcementBanner || ''}" 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div style="display: flex; align-items: center; gap: 20px; padding-top: 4px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 800; color: #0f172a;">
                                    <input type="checkbox" name="announcementActive" ${settings.announcementActive ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #0f172a;">
                                    Mostrar banner de anuncio en la portada de la tienda
                                </label>
                            </div>

                            <button type="submit" 
                                style="align-self: flex-start; background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 12px 24px; border-radius: 12px; font-weight: 950; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                <i class="fas fa-floppy-disk"></i> GUARDAR CONFIGURACIÓN
                            </button>
                        </form>
                    </div>

                    <!-- MANTENIMIENTO, COPIAS DE SEGURIDAD & RESTAURACIÓN -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
                        <h3 style="margin: 0 0 14px; font-size: 1.15rem; font-weight: 950; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-database" style="color: #0284c7;"></i> Mantenimiento & Copias de Seguridad
                        </h3>
                        <p style="color: #475569; font-size: 0.82rem; margin: 0 0 18px; line-height: 1.5;">
                            Exporta el catálogo completo, pedidos y configuración en un archivo JSON o restaura los datos a los valores oficiales.
                        </p>

                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="window.AdminTienda.exportBackupJson()" 
                                style="background: #e0f2fe; color: #0369a1; border: 1.5px solid #bae6fd; padding: 11px 18px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-download"></i> EXPORTAR BACKUP (JSON)
                            </button>
                            <button onclick="window.AdminTienda.resetCatalogueDefaults()" 
                                style="background: #fef2f2; color: #b91c1c; border: 1.5px solid #fecaca; padding: 11px 18px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-rotate-left"></i> RESTAURAR CATÁLOGO OFICIAL POR DEFECTO
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 🛠️ MODALES: CREAR & EDITAR PRODUCTO - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        openCreateProductModal() {
            this.renderProductModal(null);
        }

        openEditProductModal(productId) {
            const product = this.service.getProductById(productId);
            if (!product) return;
            this.renderProductModal(product);
        }

        renderProductModal(product = null) {
            const root = document.getElementById('sp-tienda-admin-modal-root');
            if (!root) return;

            const isEdit = !!product;
            const categories = this.service.getCategories();
            const partners = this.service.getPartners();

            root.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 20px;">
                    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 22px; max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.18); color: #0f172a;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 14px;">
                            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 950; color: #0f172a;">
                                ${isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}
                            </h3>
                            <button onclick="window.AdminTienda.closeModal()" style="background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; padding: 4px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <form onsubmit="window.AdminTienda.saveProductForm(event, '${isEdit ? product.id : ''}')" style="display: flex; flex-direction: column; gap: 14px;">
                            
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Nombre del Producto *
                                </label>
                                <input type="text" name="name" required value="${isEdit ? product.name : ''}" placeholder="Ej: Bullpadel Vertex 04 2026"
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Marca *
                                    </label>
                                    <input type="text" name="brand" required value="${isEdit ? product.brand : ''}" placeholder="Ej: Bullpadel, Nox, Head..."
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Categoría *
                                    </label>
                                    <select name="category" required style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 800;">
                                        ${categories.filter(c => c.id !== 'todos').map(c => `
                                            <option value="${c.id}" ${isEdit && product.category === c.id ? 'selected' : ''}>${c.name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Precio PVP (€) *
                                    </label>
                                    <input type="number" step="0.01" name="originalPrice" required value="${isEdit ? product.originalPrice : ''}" placeholder="Ej: 320.00"
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Precio Oferta (€) *
                                    </label>
                                    <input type="number" step="0.01" name="promoPrice" required value="${isEdit ? product.promoPrice : ''}" placeholder="Ej: 249.00"
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Stock (Uds) *
                                    </label>
                                    <input type="number" name="stock" required value="${isEdit && typeof product.stock === 'number' ? product.stock : 12}" placeholder="Ej: 12"
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Proveedor / Marca Asociada
                                    </label>
                                    <select name="partnerId" style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 800;">
                                        ${partners.map(pt => `
                                            <option value="${pt.id}" ${isEdit && product.partnerId === pt.id ? 'selected' : ''}>${pt.name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        URL de Compra / Enlace Externo
                                    </label>
                                    <input type="url" name="externalLink" value="${isEdit ? (product.externalLink || '') : ''}" placeholder="https://..."
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    URL de la Imagen Principal *
                                </label>
                                <input type="url" name="image" required value="${isEdit ? product.image : ''}" placeholder="https://images.unsplash.com/..."
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Descripción Técnica del Producto
                                </label>
                                <textarea name="description" rows="3" placeholder="Detalles, materiales, potencia, control, balance..."
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 600; resize: vertical;">${isEdit ? (product.description || '') : ''}</textarea>
                            </div>

                            <div style="display: flex; gap: 20px; align-items: center; padding-top: 4px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 800; color: #0f172a;">
                                    <input type="checkbox" name="featured" ${isEdit && product.featured ? 'checked' : (!isEdit ? 'checked' : '')} style="width: 18px; height: 18px; accent-color: #0f172a;">
                                    ⭐ Destacar en Escaparate
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 800; color: #0f172a;">
                                    <input type="checkbox" name="active" ${!isEdit || product.active !== false ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #16a34a;">
                                    ● Producto Activo (Visible en Tienda)
                                </label>
                            </div>

                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
                                <button type="button" onclick="window.AdminTienda.closeModal()" 
                                    style="background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; padding: 10px 18px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 22px; border-radius: 10px; font-weight: 950; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                    <i class="fas fa-check"></i> ${isEdit ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }

        saveProductForm(e, productId) {
            e.preventDefault();
            const form = e.target;
            const productData = {
                id: productId || null,
                name: form.name.value.trim(),
                brand: form.brand.value.trim(),
                category: form.category.value,
                originalPrice: parseFloat(form.originalPrice.value) || 0,
                promoPrice: parseFloat(form.promoPrice.value) || 0,
                stock: parseInt(form.stock.value, 10) || 0,
                partnerId: form.partnerId.value,
                externalLink: form.externalLink.value.trim(),
                image: form.image.value.trim(),
                description: form.description.value.trim(),
                featured: form.featured.checked,
                active: form.active.checked,
                badges: form.featured.checked ? ['Recomendado por SomosPadel', 'Top Ventas'] : ['Producto Oficial']
            };

            this.service.saveProduct(productData);
            this.closeModal();
            this.showToast('Producto guardado correctamente en el catálogo');
            this.render();
        }

        quickStockChange(productId, delta) {
            this.service.updateProductStock(productId, delta, true);
            this.render();
        }

        toggleFeatured(productId) {
            this.service.toggleProductFeatured(productId);
            this.render();
        }

        toggleActive(productId) {
            this.service.toggleProductActive(productId);
            this.render();
        }

        confirmDeleteProduct(productId) {
            const product = this.service.getProductById(productId);
            if (!product) return;
            if (confirm(`¿Estás seguro de que deseas eliminar "${product.name}" del catálogo?`)) {
                this.service.deleteProduct(productId);
                this.showToast('Producto eliminado');
                this.render();
            }
        }

        // =========================================================================
        // 🛠️ MODALES: REGISTRAR PEDIDO MANUAL / VENTA - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        openCreateOrderModal() {
            const root = document.getElementById('sp-tienda-admin-modal-root');
            if (!root) return;

            const products = this.service.getProducts();

            root.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 20px;">
                    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 22px; max-width: 580px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.18); color: #0f172a;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 14px;">
                            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 950; color: #0f172a;">
                                Registrar Nuevo Pedido / Venta Manual
                            </h3>
                            <button onclick="window.AdminTienda.closeModal()" style="background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; padding: 4px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <form onsubmit="window.AdminTienda.saveOrderForm(event)" style="display: flex; flex-direction: column; gap: 14px;">
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Nombre del Jugador / Cliente *
                                </label>
                                <input type="text" name="customerName" required placeholder="Ej: Sergio Ramos" 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Teléfono WhatsApp *
                                    </label>
                                    <input type="tel" name="customerPhone" required placeholder="+34 600 000 000" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Método de Pago
                                    </label>
                                    <select name="paymentMethod" style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 800;">
                                        <option value="Bizum">Bizum</option>
                                        <option value="Efectivo en Pista">Efectivo en Pista</option>
                                        <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Producto Seleccionado *
                                </label>
                                <select id="sp-order-product-select" required onchange="window.AdminTienda.autoFillOrderPrice(this)"
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 800;">
                                    <option value="">Selecciona un producto...</option>
                                    ${products.map(p => `
                                        <option value="${p.id}" data-name="${p.name}" data-price="${p.promoPrice}">${p.brand} - ${p.name} (${p.promoPrice}€) [Stock: ${p.stock || 0}]</option>
                                    `).join('')}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Cantidad *
                                    </label>
                                    <input type="number" id="sp-order-qty" name="qty" min="1" value="1" required 
                                        oninput="window.AdminTienda.recalcOrderTotal()"
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Total Importe (€) *
                                    </label>
                                    <input type="number" step="0.01" id="sp-order-total" name="totalAmount" required 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Estado Inicial
                                    </label>
                                    <select name="status" style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 800;">
                                        <option value="Pagado">Pagado</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Entregado">Entregado</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Notas de Entrega / Observaciones
                                </label>
                                <textarea name="notes" rows="2" placeholder="Entregar en pista 3 el viernes..." 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 600;"></textarea>
                            </div>

                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
                                <button type="button" onclick="window.AdminTienda.closeModal()" 
                                    style="background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; padding: 10px 18px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 22px; border-radius: 10px; font-weight: 950; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                    <i class="fas fa-check"></i> Registrar Venta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }

        autoFillOrderPrice(selectEl) {
            const option = selectEl.options[selectEl.selectedIndex];
            if (!option) return;
            const price = parseFloat(option.getAttribute('data-price')) || 0;
            const qty = parseInt(document.getElementById('sp-order-qty').value, 10) || 1;
            document.getElementById('sp-order-total').value = (price * qty).toFixed(2);
        }

        recalcOrderTotal() {
            const selectEl = document.getElementById('sp-order-product-select');
            if (selectEl) this.autoFillOrderPrice(selectEl);
        }

        saveOrderForm(e) {
            e.preventDefault();
            const form = e.target;
            const selectEl = document.getElementById('sp-order-product-select');
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            const productId = selectEl.value;
            const productName = selectedOpt ? selectedOpt.getAttribute('data-name') : 'Producto Tienda';
            const qty = parseInt(form.qty.value, 10) || 1;
            const total = parseFloat(form.totalAmount.value) || 0;

            const orderData = {
                customerName: form.customerName.value.trim(),
                customerPhone: form.customerPhone.value.trim(),
                paymentMethod: form.paymentMethod.value,
                products: [
                    { id: productId, name: productName, qty: qty, price: (total / qty) }
                ],
                totalAmount: total,
                commission: Math.round(total * 0.15 * 100) / 100,
                status: form.status.value,
                notes: form.notes.value.trim()
            };

            // Restar stock
            if (productId) {
                this.service.updateProductStock(productId, -qty, true);
            }

            this.service.saveOrder(orderData);
            this.closeModal();
            this.showToast('Venta registrada y stock actualizado');
            this.render();
        }

        changeOrderStatus(orderId, newStatus) {
            this.service.updateOrderStatus(orderId, newStatus);
            this.showToast(`Estado del pedido ${orderId} actualizado a: ${newStatus}`);
            this.render();
        }

        deleteOrder(orderId) {
            if (confirm(`¿Eliminar pedido ${orderId}?`)) {
                this.service.deleteOrder(orderId);
                this.showToast('Pedido eliminado');
                this.render();
            }
        }

        sendOrderWhatsApp(orderId) {
            const order = this.service.getOrderById(orderId);
            if (!order || !order.customerPhone) return;

            const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
            const msg = `🎾 *SOMOSPADEL BCN - Tienda Oficial*\n\n` +
                `Hola *${order.customerName}*, te contactamos respecto a tu pedido *${order.id}*.\n\n` +
                `📦 *Estado actual:* ${order.status.toUpperCase()}\n` +
                `💰 *Total:* ${order.totalAmount}€ (${order.paymentMethod})\n` +
                `🛍️ *Productos:*\n${order.products.map(p => `• ${p.qty}x ${p.name}`).join('\n')}\n\n` +
                `¡Muchas gracias por confiar en SomosPadel!`;

            const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }

        // =========================================================================
        // 🛠️ MODALES: CUPONES & PROMOS - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        openCreatePromoModal() {
            const root = document.getElementById('sp-tienda-admin-modal-root');
            if (!root) return;

            root.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 20px;">
                    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 22px; max-width: 520px; width: 100%; padding: 28px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.18); color: #0f172a;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 14px;">
                            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 950; color: #0f172a;">
                                Crear Cupón / Promoción
                            </h3>
                            <button onclick="window.AdminTienda.closeModal()" style="background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; padding: 4px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <form onsubmit="window.AdminTienda.savePromoForm(event)" style="display: flex; flex-direction: column; gap: 14px;">
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Título de la Promoción *
                                </label>
                                <input type="text" name="title" required placeholder="Ej: Especial Torneo Fin de Semana" 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Código Cupón *
                                    </label>
                                    <input type="text" name="code" required placeholder="Ej: FINDE20" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-weight: 950; font-family: monospace;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Texto Descuento *
                                    </label>
                                    <input type="text" name="discountText" required placeholder="Ej: 20% DTO" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Etiqueta / Badge
                                    </label>
                                    <input type="text" name="badge" placeholder="Ej: OFERTA FLASH" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Válido Hasta *
                                    </label>
                                    <input type="date" name="validUntil" required value="2027-12-31" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Descripción
                                </label>
                                <textarea name="description" rows="2" placeholder="Condiciones de aplicación del cupón..." 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 600;"></textarea>
                            </div>

                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
                                <button type="button" onclick="window.AdminTienda.closeModal()" 
                                    style="background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; padding: 10px 18px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 22px; border-radius: 10px; font-weight: 950; font-size: 0.88rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                    Guardar Cupón
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }

        savePromoForm(e) {
            e.preventDefault();
            const form = e.target;
            const promoData = {
                title: form.title.value.trim(),
                code: form.code.value.trim().toUpperCase(),
                discountText: form.discountText.value.trim(),
                badge: form.badge.value.trim() || 'OFERTA',
                validUntil: form.validUntil.value,
                description: form.description.value.trim()
            };

            this.service.savePromotion(promoData);
            this.closeModal();
            this.showToast(`Cupón "${promoData.code}" creado con éxito`);
            this.render();
        }

        deletePromo(promoId) {
            if (confirm('¿Eliminar esta promoción?')) {
                this.service.deletePromotion(promoId);
                this.showToast('Promoción eliminada');
                this.render();
            }
        }

        copyCoupon(code) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code).then(() => {
                    this.showToast(`¡Cupón "${code}" copiado! 🎟️`);
                });
            } else {
                this.showToast(`Cupón: ${code}`);
            }
        }

        // =========================================================================
        // 🛠️ MODALES: PARTNERS & PROVEEDORES - FONDO BLANCO & LETRA NEGRA
        // =========================================================================
        openCreatePartnerModal() {
            this.renderPartnerModal(null);
        }

        openEditPartnerModal(partnerId) {
            const partner = this.service.getPartnerById(partnerId);
            if (!partner) return;
            this.renderPartnerModal(partner);
        }

        renderPartnerModal(partner = null) {
            const root = document.getElementById('sp-tienda-admin-modal-root');
            if (!root) return;

            const isEdit = !!partner;

            root.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 20px;">
                    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 22px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.18); color: #0f172a;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 14px;">
                            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 950; color: #0f172a;">
                                ${isEdit ? 'Editar Marca Colaboradora' : 'Nuevo Partner Comercial'}
                            </h3>
                            <button onclick="window.AdminTienda.closeModal()" style="background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; padding: 4px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <form onsubmit="window.AdminTienda.savePartnerForm(event, '${isEdit ? partner.id : ''}')" style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Nombre de la Marca / Empresa *
                                    </label>
                                    <input type="text" name="name" required value="${isEdit ? partner.name : ''}" placeholder="Ej: Bullpadel España" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Siglas Logo
                                    </label>
                                    <input type="text" name="logoText" maxlength="4" value="${isEdit ? (partner.logoText || '') : ''}" placeholder="BP" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-weight: 950; text-transform: uppercase;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Tipo de Convenio *
                                    </label>
                                    <input type="text" name="agreementType" required value="${isEdit ? partner.agreementType : ''}" placeholder="Ej: Patrocinador Oro" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Comisión Pactada *
                                    </label>
                                    <input type="text" name="agreedCommission" required value="${isEdit ? partner.agreedCommission : '15%'}" placeholder="Ej: 15%" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #16a34a; font-weight: 950;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Persona de Contacto
                                    </label>
                                    <input type="text" name="contactPerson" value="${isEdit ? (partner.contactPerson || '') : ''}" placeholder="Marc Soler" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Teléfono de Contacto
                                    </label>
                                    <input type="tel" name="phone" value="${isEdit ? (partner.phone || '') : ''}" placeholder="+34 934 000 000" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Email Comercial
                                </label>
                                <input type="email" name="email" value="${isEdit ? (partner.email || '') : ''}" placeholder="ventas@marca.com" 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Web Oficial
                                    </label>
                                    <input type="url" name="web" value="${isEdit ? (partner.web || '') : ''}" placeholder="https://..." 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                        Fecha de Renovación
                                    </label>
                                    <input type="date" name="renewalDate" value="${isEdit ? (partner.renewalDate || '2027-12-31') : '2027-12-31'}" 
                                        style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 700;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 850; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                                    Notas Internas Contractuales
                                </label>
                                <textarea name="internalNotes" rows="2" placeholder="Descuentos extras, material para premios, condiciones..." 
                                    style="width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; color: #0f172a; font-size: 0.88rem; font-weight: 600;">${isEdit ? (partner.internalNotes || '') : ''}</textarea>
                            </div>

                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
                                <button type="button" onclick="window.AdminTienda.closeModal()" 
                                    style="background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; padding: 10px 18px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    style="background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 10px 22px; border-radius: 10px; font-weight: 950; font-size: 0.88rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                                    Guardar Partner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }

        savePartnerForm(e, partnerId) {
            e.preventDefault();
            const form = e.target;
            const partnerData = {
                id: partnerId || null,
                name: form.name.value.trim(),
                logoText: form.logoText.value.trim().toUpperCase() || 'SP',
                agreementType: form.agreementType.value.trim(),
                agreedCommission: form.agreedCommission.value.trim(),
                contactPerson: form.contactPerson.value.trim(),
                phone: form.phone.value.trim(),
                email: form.email.value.trim(),
                web: form.web.value.trim(),
                renewalDate: form.renewalDate.value,
                internalNotes: form.internalNotes.value.trim()
            };

            this.service.savePartner(partnerData);
            this.closeModal();
            this.showToast('Marca colaboradora guardada correctamente');
            this.render();
        }

        // =========================================================================
        // ⚙️ GUARDADO DE AJUSTES & EXPORTACIÓN
        // =========================================================================
        saveSettingsForm(e) {
            e.preventDefault();
            const form = e.target;
            const settingsData = {
                storeName: form.storeName.value.trim(),
                whatsappPhone: form.whatsappPhone.value.trim(),
                emailContact: form.emailContact.value.trim(),
                freeShippingThreshold: parseFloat(form.freeShippingThreshold.value) || 50,
                shippingCost: parseFloat(form.shippingCost.value) || 4.95,
                announcementBanner: form.announcementBanner.value.trim(),
                announcementActive: form.announcementActive.checked
            };

            this.service.saveSettings(settingsData);
            this.showToast('Ajustes de tienda guardados con éxito');
            this.render();
        }

        exportBackupJson() {
            const backup = this.service.exportFullBackup();
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute('href', dataStr);
            dlAnchor.setAttribute('download', `somospadel_tienda_backup_${new Date().toISOString().slice(0, 10)}.json`);
            dlAnchor.click();
            this.showToast('Copia de seguridad descargada en JSON 💾');
        }

        resetCatalogueDefaults() {
            if (confirm('⚠️ ¿Estás seguro de que deseas restaurar el catálogo por defecto? Se mantendrán las configuraciones de ejemplo oficiales.')) {
                this.service.resetToDefaults();
                this.showToast('Catálogo y datos restaurados por defecto');
                this.render();
            }
        }

        // =========================================================================
        // FILTROS & TOASTS
        // =========================================================================
        handleSearch(query) {
            this.searchQuery = query;
            const content = document.getElementById('sp-tienda-tab-content');
            if (content && this.currentTab === 'catalogo') {
                content.innerHTML = this.renderCatalogoTab();
            }
        }

        handleCategoryFilter(catId) {
            this.filterCategory = catId;
            const content = document.getElementById('sp-tienda-tab-content');
            if (content && this.currentTab === 'catalogo') {
                content.innerHTML = this.renderCatalogoTab();
            }
        }

        handleStatusFilter(status) {
            this.filterStatus = status;
            const content = document.getElementById('sp-tienda-tab-content');
            if (content && this.currentTab === 'catalogo') {
                content.innerHTML = this.renderCatalogoTab();
            }
        }

        handleOrderStateFilter(state) {
            this.filterOrderState = state;
            const content = document.getElementById('sp-tienda-tab-content');
            if (content && this.currentTab === 'pedidos') {
                content.innerHTML = this.renderPedidosTab();
            }
        }

        closeModal() {
            const root = document.getElementById('sp-tienda-admin-modal-root');
            if (root) root.innerHTML = '';
        }

        showToast(message) {
            if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                window.NotificationService.showToast(message, 'success');
            } else {
                const existing = document.getElementById('sp-tienda-admin-toast');
                if (existing) existing.remove();

                const toast = document.createElement('div');
                toast.id = 'sp-tienda-admin-toast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ffffff;
                    border: 2px solid #0f172a;
                    color: #0f172a;
                    padding: 12px 22px;
                    border-radius: 14px;
                    font-size: 0.88rem;
                    font-weight: 850;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    z-index: 1000000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                toast.innerHTML = `<i class="fas fa-circle-check" style="color: #16a34a; font-size: 1.1rem;"></i> <span>${message}</span>`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3200);
            }
        }
    }

    const controllerInstance = new AdminTiendaController();
    window.AdminViews = window.AdminViews || {};
    window.AdminViews.tienda_admin = () => controllerInstance.init();

    return controllerInstance;
}));
