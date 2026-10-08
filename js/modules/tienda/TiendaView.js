/**
 * TiendaView.js - Renderizado Visual de la Tienda SomosPadel BCN
 * Interfaz ultra-deportiva, responsive, accesible y conectada
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./TiendaService'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./TiendaService'));
    } else {
        root.TiendaView = factory(root.TiendaService);
    }
}(typeof self !== 'undefined' ? self : this, function (TiendaService) {

    class TiendaViewClass {
        constructor() {
            this.activeTab = 'catalogo'; // 'catalogo' | 'partners' | 'promociones' | 'analytics'
            this.selectedCategory = 'todos';
            this.selectedBrand = 'Todas';
            this.selectedTag = 'todos';
            this.searchQuery = '';
            this.sortBy = 'popular';
            this.selectedPeriod = 'monthly';
            this.modalProduct = null;
            this.appliedCoupon = null;
        }

        render(containerId = 'content-area') {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="sp-tienda-container">
                    ${this.renderHeader()}
                    
                    <div id="sp-tienda-tab-content">
                        ${this.renderActiveTabContent()}
                    </div>

                    ${this.renderTrustFooter()}
                </div>

                <!-- Modal Container for Product Details -->
                <div id="sp-tienda-modal-root"></div>

                <!-- Drawer / Modal for Shopping Cart -->
                <div id="sp-tienda-cart-root"></div>
            `;

            this.bindEvents();
        }

        // =========================================================================
        // 🚧 PANTALLA DE SECCIÓN EN CONSTRUCCIÓN (ACCESO CON CONTRASEÑA "PADEL21")
        // =========================================================================
        renderUnderConstructionGate(containerId = 'content-area', errorMessage = '') {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="sp-tienda-container" style="min-height: 75vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 24px;">

                    <div style="max-width: 480px; width: 100%; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 24px; padding: 36px 28px; box-shadow: 0 16px 40px rgba(0,0,0,0.06); text-align: center; color: #0f172a; margin: 10px auto; position: relative; overflow: hidden; box-sizing: border-box;">
                        
                        <!-- Acentos decorativos sutiles de la marca -->
                        <div style="position: absolute; top: -45px; right: -45px; width: 130px; height: 130px; background: rgba(204,255,0,0.28); border-radius: 50%; filter: blur(28px); pointer-events: none;"></div>
                        <div style="position: absolute; bottom: -45px; left: -45px; width: 130px; height: 130px; background: rgba(16,185,129,0.18); border-radius: 50%; filter: blur(28px); pointer-events: none;"></div>

                        <div style="width: 82px; height: 82px; margin: 0 auto 18px; background: #fef08a; border: 2.5px solid #0f172a; border-radius: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
                            <i class="fas fa-hammer" style="font-size: 2.3rem; color: #0f172a;"></i>
                        </div>

                        <span style="display: inline-block; background: #fef08a; color: #713f12; font-size: 0.72rem; font-weight: 950; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid #fde047;">
                            🚧 Sección en Construcción
                        </span>

                        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.7rem; font-weight: 950; margin: 0 0 10px; color: #0f172a; line-height: 1.2;">
                            TIENDA SOMOSPADEL BCN
                        </h2>

                        <p style="color: #334155; font-size: 0.92rem; line-height: 1.55; margin: 0 0 16px; font-weight: 500;">
                            ¡Hola, jugador! 🎾 Estamos construyendo la <strong>Tienda Oficial de SomosPadel Barcelona</strong>.
                        </p>

                        <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 13px 16px; margin-bottom: 22px; display: flex; align-items: center; gap: 12px; text-align: left;">
                            <i class="fas fa-clock" style="font-size: 1.4rem; color: #16a34a; flex-shrink: 0;"></i>
                            <div style="font-size: 0.82rem; color: #166534; font-weight: 750; line-height: 1.45;">
                                <strong>Pronto estará visible para todos los jugadores</strong> con palas oficiales, equipación técnica y ofertas exclusivas de colaboradores.
                            </div>
                        </div>

                        <!-- Formulario de Desbloqueo con Contraseña -->
                        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 20px; text-align: left;">
                            <div style="display: flex; align-items: center; gap: 7px; margin-bottom: 6px;">
                                <i class="fas fa-key" style="color: #0f172a; font-size: 0.85rem;"></i>
                                <span style="font-size: 0.78rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Acceso con Contraseña
                                </span>
                            </div>
                            <p style="margin: 0 0 12px; font-size: 0.76rem; color: #64748b;">
                                Si dispones de la clave de acceso anticipado o eres administrador, introdúcela para desbloquear:
                            </p>

                            ${errorMessage ? `
                                <div style="background: #fef2f2; border: 1.5px solid #fecaca; color: #b91c1c; padding: 10px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-circle-exclamation"></i>
                                    <span>${errorMessage}</span>
                                </div>
                            ` : ''}

                            <form onsubmit="window.TiendaController && window.TiendaController.handleGateLogin(event)" style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="position: relative;">
                                    <input type="password" id="sp-tienda-gate-pass" required autofocus placeholder="Introduce la contraseña..." 
                                        style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px 44px 12px 14px; color: #0f172a; font-size: 0.95rem; font-weight: 700; outline: none; transition: border-color 0.2s;"
                                        onfocus="this.style.borderColor='#0f172a'" onblur="this.style.borderColor='#cbd5e1'">
                                    <button type="button" onclick="window.TiendaController && window.TiendaController.toggleGatePasswordVisibility()" 
                                        style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; font-size: 1rem;">
                                        <i class="fas fa-eye" id="sp-tienda-gate-eye-icon"></i>
                                    </button>
                                </div>

                                <button type="submit" 
                                    style="width: 100%; background: #CCFF00; color: #000; border: 1.5px solid #000; padding: 13px; border-radius: 12px; font-weight: 950; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: transform 0.15s ease;"
                                    onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                                    <i class="fas fa-unlock-keyhole"></i> DESBLOQUEAR TIENDA
                                </button>
                            </form>

                            <button type="button" onclick="window.TiendaController && window.TiendaController.goBackToApp()" 
                                style="margin-top: 10px; width: 100%; background: #ffffff; color: #334155; border: 1.5px solid #cbd5e1; padding: 11px; border-radius: 12px; font-weight: 850; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 0.15s;">
                                <i class="fas fa-arrow-left"></i> VOLVER AL INICIO
                            </button>
                        </div>

                        <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem;">
                            <a href="admin.html#tienda_admin" style="color: #0284c7; text-decoration: none; font-weight: 800; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-shield"></i> Ir al Admin de Tienda
                            </a>
                            <span style="color: #64748b; font-weight: 600;">SomosPadel Barcelona</span>
                        </div>
                    </div>
                </div>
            `;
        }

        renderPlatformSectionsBar() {
            const isStandAlone = window.location.pathname.includes('tienda.html');
            return `
                <div class="sp-platform-sections-nav" aria-label="Secciones Principales de SomosPadel Barcelona">
                    <a href="index.html" class="sp-platform-nav-btn ${!isStandAlone && window.location.hash !== '#tienda' ? 'active' : ''}">
                        <i class="fas fa-mobile-screen"></i>
                        <span>1. Jugador</span>
                    </a>
                    <a href="admin.html" class="sp-platform-nav-btn">
                        <i class="fas fa-shield-halved"></i>
                        <span>2. Administración</span>
                    </a>
                    <a href="organizacion.html" class="sp-platform-nav-btn">
                        <i class="fas fa-chart-line"></i>
                        <span>3. Organización BCN</span>
                    </a>
                    <a href="${isStandAlone ? '#' : 'tienda.html'}" onclick="${!isStandAlone ? "window.Router && window.Router.navigate('tienda'); return false;" : ''}" class="sp-platform-nav-btn ${isStandAlone || window.location.hash === '#tienda' ? 'active' : ''}">
                        <i class="fas fa-store"></i>
                        <span>4. Tienda BCN</span>
                    </a>
                </div>
            `;
        }

        // =========================================================================
        // 🛍️ TICKER SUPERIOR Y CABECERA E-COMMERCE PROFESIONAL
        // =========================================================================
        renderAnnouncementBar() {
            return `
                <div class="sp-store-ticker" aria-label="Información de envíos y garantías">
                    <div class="sp-store-ticker-item">
                        <i class="fas fa-ticket"></i>
                        <span><strong>CUPÓN 15% DTO:</strong> SOMOSPADEL15</span>
                    </div>
                    <span class="sp-store-ticker-divider">•</span>
                    <div class="sp-store-ticker-item">
                        <i class="fas fa-truck-fast"></i>
                        <span><strong>ENVÍO GRATIS</strong> a partir de 50€</span>
                    </div>
                    <span class="sp-store-ticker-divider">•</span>
                    <div class="sp-store-ticker-item">
                        <i class="fas fa-bolt"></i>
                        <span>Entrega rápida <strong>24/48 horas</strong> a domicilio o en club</span>
                    </div>
                    <span class="sp-store-ticker-divider">•</span>
                    <div class="sp-store-ticker-item">
                        <i class="fas fa-shield-halved"></i>
                        <span>Garantía Oficial <strong>3 Años</strong></span>
                    </div>
                    <span class="sp-store-ticker-divider">•</span>
                    <div class="sp-store-ticker-item">
                        <i class="fab fa-whatsapp"></i>
                        <span><strong>¿Dudas? Habla con nosotros</strong></span>
                    </div>
                </div>
            `;
        }

        renderHeader() {
            const summary = TiendaService.getCartSummary ? TiendaService.getCartSummary() : { count: 0, total: 0 };
            return `
                <header class="sp-store-navbar">
                    <div class="sp-store-brand">
                        <img src="img/logo_somospadel.png" class="sp-store-brand-logo-img" alt="SomosPadel Barcelona" onerror="this.src='img/badge_somospadel.png'">
                        <div class="sp-store-brand-info">
                            <h1 class="sp-store-brand-title">SOMOSPADEL <span>STORE</span></h1>
                            <div class="sp-store-brand-sub">
                                <span class="sp-store-brand-badge"><i class="fas fa-certificate"></i> OFICIAL BCN</span>
                                <span class="sp-store-brand-subtxt">TIENDA SOMOSPADEL BCN</span>
                            </div>
                        </div>
                    </div>

                    <div class="sp-store-nav-actions">
                        <button type="button" class="sp-store-advisor-btn" onclick="window.TiendaController && window.TiendaController.consultWhatsApp()" title="¿Dudas con qué pala o equipación comprar? Escríbenos directamente por WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                            <span class="sp-advisor-text">
                                <span class="sp-advisor-text-full">¿Dudas? Habla con nosotros</span>
                                <span class="sp-advisor-text-short">¿Dudas?</span>
                            </span>
                        </button>

                        <button type="button" class="sp-store-cart-trigger" id="sp-cart-trigger-btn" onclick="window.TiendaController && window.TiendaController.openCart()" title="Ver los artículos de tu cesta">
                            <i class="fas fa-cart-shopping"></i>
                            <span class="sp-cart-text-label">Mi Cesta</span>
                            <span class="sp-store-cart-badge" id="sp-header-cart-count">${summary.count || 0}</span>
                            <span class="sp-cart-total-amount" id="sp-header-cart-total">${(summary.total || 0).toFixed(2)}€</span>
                        </button>

                        <button type="button" onclick="window.TiendaController && window.TiendaController.lockStore()" class="sp-store-lock-btn" title="Bloquear tienda y activar modo en construcción">
                            <i class="fas fa-lock"></i>
                        </button>
                    </div>
                </header>
            `;
        }

        renderBrandsBar() {
            const brands = ['Todas', 'Bullpadel', 'NOX', 'HEAD', 'Wilson', 'Babolat', 'Asics', 'SomosPadel'];
            return `
                <div class="sp-brands-row">
                    <span class="sp-brands-title"><i class="fas fa-tags"></i> Marcas:</span>
                    <div class="sp-brands-chips">
                        ${brands.map(b => `
                            <button type="button" class="sp-brand-chip-btn ${this.selectedBrand === b || (b === 'Todas' && (!this.selectedBrand || this.selectedBrand === 'Todas')) ? 'active' : ''}"
                                onclick="window.TiendaController && window.TiendaController.handleBrand('${b}')">
                                ${b}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderActiveTabContent() {
            switch (this.activeTab) {
                case 'partners':
                    return this.renderPartnersTab();
                case 'promociones':
                    return this.renderPromotionsTab();
                case 'analytics':
                    return this.renderAnalyticsTab();
                case 'catalogo':
                default:
                    return this.renderCatalogTab();
            }
        }

        // ==========================================
        // PESTAÑA: CATÁLOGO COMERCIAL PROFESIONAL
        // ==========================================
        renderCatalogTab() {
            const products = this.getFilteredProducts();
            return `
                ${this.renderBrandsBar()}
                
                <div class="sp-shop-filter-bar">
                    <div class="sp-shop-search-row">
                        <div class="sp-shop-search-input-wrap">
                            <i class="fas fa-magnifying-glass"></i>
                            <input type="text" id="sp-search-input" class="sp-shop-search-input" 
                                placeholder="Buscar por pala, zapatilla, overgrip, marca (Bullpadel, Nox, Head)..." 
                                value="${this.escapeHtml(this.searchQuery)}"
                                oninput="window.TiendaController && window.TiendaController.handleSearch(this.value)">
                        </div>
                    </div>

                    <!-- Pills de Categorías (11 Tipos Requeridos) -->
                    <div class="sp-category-pills">
                        ${TiendaService.getCategories().map(cat => `
                            <button class="sp-category-pill ${this.selectedCategory === cat.id ? 'active' : ''}" 
                                onclick="window.TiendaController && window.TiendaController.handleCategory('${cat.id}')">
                                <i class="fas ${cat.icon}"></i>
                                <span>${cat.name}</span>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Filtros por Etiquetas Rápidas y Contador -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div class="sp-tag-filters">
                            <button class="sp-tag-pill ${this.selectedTag === 'todos' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.handleTag('todos')">Todas las Etiquetas</button>
                            <button class="sp-tag-pill ${this.selectedTag === 'Recomendado por SomosPadel' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.handleTag('Recomendado por SomosPadel')">⭐ Recomendado por SomosPadel</button>
                            <button class="sp-tag-pill ${this.selectedTag === 'Oferta' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.handleTag('Oferta')">🔥 Ofertas Especiales</button>
                            <button class="sp-tag-pill ${this.selectedTag === 'Producto oficial' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.handleTag('Producto oficial')">🏆 Producto Oficial</button>
                            <button class="sp-tag-pill ${this.selectedTag === 'Top ventas' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.handleTag('Top ventas')">🚀 Top Ventas</button>
                        </div>
                        <div style="font-size: 0.76rem; font-weight: 800; color: #64748b; white-space: nowrap;">
                            Mostrando <span style="color: #0f172a;" id="sp-products-count">${products.length}</span> productos
                        </div>
                    </div>
                </div>

                <!-- Grid de Productos Filtrados -->
                <div class="sp-products-grid" id="sp-products-grid">
                    ${this.renderProductCards()}
                </div>
            `;
        }

        renderHeroBanner() {
            return `
                <div class="sp-store-hero" id="sp-store-hero-banner">
                    <div class="sp-store-hero-left">
                        <span class="sp-store-hero-badge"><i class="fas fa-bolt"></i> -15% DTO</span>
                        <div class="sp-store-hero-title">
                            Usa el cupón oficial <span>SOMOSPADEL15</span> en tu cesta
                        </div>
                        <span class="sp-store-hero-desc">(Descuento exclusivo en palas, zapatillas y material oficial)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="sp-store-coupon-pill" onclick="window.TiendaController && window.TiendaController.copyCoupon('SOMOSPADEL15')" title="Clic para copiar cupón">
                            <span class="sp-store-coupon-code">SOMOSPADEL15</span>
                            <span class="sp-store-coupon-label"><i class="fas fa-copy"></i> Copiar</span>
                        </div>
                        <button type="button" onclick="document.getElementById('sp-store-hero-banner')?.remove()" style="background: none; border: none; color: #94a3b8; font-size: 0.85rem; cursor: pointer; padding: 4px;" title="Ocultar aviso">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        renderSponsorsStrip() {
            const partners = TiendaService.getPartners();
            return `
                <div class="sp-sponsors-strip">
                    <div class="sp-sponsors-header">
                        <span class="sp-sponsors-title">
                            <i class="fas fa-handshake-simple"></i> Colaboradores y Patrocinadores Oficiales
                        </span>
                        <span style="font-size: 0.72rem; color: #10B981; font-weight: 700;">Acuerdos 2026/2027</span>
                    </div>
                    <div class="sp-sponsors-logos">
                        ${partners.map(p => `
                            <div class="sp-sponsor-chip" onclick="window.TiendaController && window.TiendaController.filterByPartner('${p.id}')">
                                <div class="sp-sponsor-logo-circle">${p.logoText || 'SP'}</div>
                                <span class="sp-sponsor-name">${p.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        getFilteredProducts() {
            let products = TiendaService.getProducts();

            // Filtrar marca
            if (this.selectedBrand && this.selectedBrand !== 'Todas') {
                const b = this.selectedBrand.toLowerCase();
                products = products.filter(p => p.brand.toLowerCase() === b || (b === 'head' && p.brand.toLowerCase().includes('head')));
            }

            // Filtrar categoría
            if (this.selectedCategory !== 'todos') {
                products = products.filter(p => p.category === this.selectedCategory);
            }

            // Filtrar etiqueta
            if (this.selectedTag !== 'todos') {
                products = products.filter(p => p.badges && p.badges.includes(this.selectedTag));
            }

            // Filtrar búsqueda
            if (this.searchQuery && this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase();
                products = products.filter(p => 
                    p.name.toLowerCase().includes(q) || 
                    p.brand.toLowerCase().includes(q) || 
                    p.description.toLowerCase().includes(q)
                );
            }

            // Ordenación
            if (this.sortBy === 'price-asc') {
                products.sort((a, b) => (a.promoPrice || a.originalPrice) - (b.promoPrice || b.originalPrice));
            } else if (this.sortBy === 'price-desc') {
                products.sort((a, b) => (b.promoPrice || b.originalPrice) - (a.promoPrice || a.originalPrice));
            } else if (this.sortBy === 'discount') {
                products.sort((a, b) => {
                    const descA = a.originalPrice - a.promoPrice;
                    const descB = b.originalPrice - b.promoPrice;
                    return descB - descA;
                });
            } else {
                // popular por clics/visitas
                products.sort((a, b) => ((b.views || 0) + (b.clicks || 0) * 2) - ((a.views || 0) + (a.clicks || 0) * 2));
            }

            return products;
        }

        renderProductCards() {
            const products = this.getFilteredProducts();

            if (products.length === 0) {
                return `
                    <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: #ffffff; border-radius: 18px; border: 1.5px dashed #cbd5e1; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <i class="fas fa-box-open" style="font-size: 2.8rem; color: #94a3b8; margin-bottom: 12px;"></i>
                        <h3 style="font-size: 1.15rem; color: #0f172a; margin: 0 0 6px 0; font-weight: 900;">No se encontraron productos</h3>
                        <p style="font-size: 0.85rem; color: #475569; margin: 0 0 16px 0;">Prueba a cambiar los filtros de marca o el texto de búsqueda.</p>
                        <button type="button" class="sp-btn-view-quick" onclick="window.TiendaController && window.TiendaController.resetFilters()">
                            Mostrar todos los productos
                        </button>
                    </div>
                `;
            }

            return products.map(p => {
                const discount = p.originalPrice > p.promoPrice ? Math.round(((p.originalPrice - p.promoPrice) / p.originalPrice) * 100) : 0;
                const reviewCount = Math.floor((p.views || 100) / 4) + 12;

                return `
                    <div class="sp-product-card" id="card-${p.id}">
                        <div class="sp-product-badge-wrap">
                            ${discount > 0 ? `<span class="sp-product-badge sp-badge-offer">-${discount}% DTO</span>` : ''}
                            ${p.badges.map(b => {
                                let bClass = 'sp-badge-recommended';
                                if (b.includes('Oferta')) bClass = 'sp-badge-offer';
                                else if (b.includes('oficial')) bClass = 'sp-badge-official';
                                else if (b.includes('Top')) bClass = 'sp-badge-top';
                                return `<span class="sp-product-badge ${bClass}">${b}</span>`;
                            }).join('')}
                        </div>

                        <div class="sp-product-image-container" onclick="window.TiendaController && window.TiendaController.openProductModal('${p.id}')" style="cursor: pointer;">
                            <img src="${p.image}" alt="${this.escapeHtml(p.name)}" class="sp-product-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=700&q=80'">
                        </div>

                        <div>
                            <div class="sp-product-brand-tag">${this.escapeHtml(p.brand)}</div>
                            <h3 class="sp-product-title" onclick="window.TiendaController && window.TiendaController.openProductModal('${p.id}')" style="cursor: pointer;" title="${this.escapeHtml(p.name)}">
                                ${this.escapeHtml(p.name)}
                            </h3>

                            <div class="sp-rating-row">
                                <span class="sp-stars-yellow">★★★★★</span>
                                <span class="sp-rating-score">4.9</span>
                                <span class="sp-rating-count">(${reviewCount} opiniones)</span>
                            </div>

                            <div class="sp-stock-badge">
                                <span class="sp-stock-dot"></span>
                                <span>En stock · Entrega 24/48h</span>
                            </div>

                            <p class="sp-product-desc-short">${this.escapeHtml(p.description)}</p>

                            <div class="sp-product-pricing">
                                <span class="sp-product-price-promo">${p.promoPrice.toFixed(2)}€</span>
                                ${p.originalPrice > p.promoPrice ? `
                                    <span class="sp-product-price-original">${p.originalPrice.toFixed(2)}€</span>
                                    <span class="sp-product-discount-pill">-${discount}% DTO</span>
                                ` : ''}
                            </div>
                        </div>

                        <div class="sp-card-action-bar">
                            <button type="button" class="sp-btn-add-cart" onclick="window.TiendaController && window.TiendaController.addToCart('${p.id}', 1)" title="Añadir directamente a mi cesta de compra">
                                <i class="fas fa-cart-shopping"></i> Añadir a Cesta
                            </button>
                            <button type="button" class="sp-btn-view-quick" onclick="window.TiendaController && window.TiendaController.openProductModal('${p.id}')" title="Ver ficha técnica completa">
                                <i class="fas fa-eye"></i> Ficha
                            </button>
                            <button type="button" class="sp-btn-share-mini" onclick="window.TiendaController && window.TiendaController.shareWhatsApp('${p.id}')" title="Compartir este producto por WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ==========================================
        // GESTOR DE ERRORES DE IMÁGENES (FALLBACK SVG PROFESIONAL)
        // ==========================================
        handleImgError(imgEl, title = 'SomosPadel BCN') {
            if (!imgEl || imgEl._hasErrored) return;
            imgEl._hasErrored = true;
            const safeTitle = (title || 'SomosPadel BCN').substring(0, 26);
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
                <defs>
                    <linearGradient id="spGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0f172a"/>
                        <stop offset="50%" stop-color="#1e293b"/>
                        <stop offset="100%" stop-color="#090d16"/>
                    </linearGradient>
                    <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#CCFF00"/>
                        <stop offset="100%" stop-color="#10B981"/>
                    </linearGradient>
                </defs>
                <rect width="600" height="600" fill="url(#spGrad)"/>
                <circle cx="300" cy="230" r="130" fill="none" stroke="rgba(204,255,0,0.18)" stroke-width="2"/>
                <circle cx="300" cy="230" r="95" fill="rgba(204,255,0,0.06)"/>
                <circle cx="270" cy="210" r="50" fill="none" stroke="url(#neonGlow)" stroke-width="8"/>
                <path d="M 305 245 L 360 300" stroke="url(#neonGlow)" stroke-width="12" stroke-linecap="round"/>
                <circle cx="350" cy="170" r="22" fill="#CCFF00"/>
                <text x="300" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">SOMOSPADEL BCN</text>
                <text x="300" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" text-anchor="middle">${safeTitle}</text>
                <rect x="200" y="450" width="200" height="34" rx="17" fill="rgba(204,255,0,0.12)" stroke="#CCFF00" stroke-width="1.5"/>
                <text x="300" y="472" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#CCFF00" text-anchor="middle" letter-spacing="1">PRODUCTO OFICIAL</text>
            </svg>`.trim().replace(/\n/g, '').replace(/\s+/g, ' ');
            imgEl.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        }

        // ==========================================
        // MODAL DE FICHA DETALLADA DE PRODUCTO (TOP E-COMMERCE LUXURY APP)
        // ==========================================
        renderProductModal(productId, options = {}) {
            const product = TiendaService.getProductById(productId);
            if (!product) return '';

            // Registrar vista automáticamente
            TiendaService.recordView(productId);

            const partner = TiendaService.getPartnerById(product.partnerId);
            const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];
            const isFav = TiendaService.isFavorite ? TiendaService.isFavorite(product.id) : false;
            const cartSummary = TiendaService.getCartSummary ? TiendaService.getCartSummary() : { count: 0, total: 0 };
            
            // Variantes y precios activos
            const variants = product.variants && product.variants.length ? product.variants : [];
            const activeVariant = options.currentVariant || (variants.length ? variants[0] : null);
            const activePrice = activeVariant ? activeVariant.price : product.promoPrice;
            const activeOriginalPrice = activeVariant && activeVariant.originalPrice ? activeVariant.originalPrice : product.originalPrice;
            const discount = activeOriginalPrice > activePrice ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100) : 0;
            const savings = (activeOriginalPrice - activePrice).toFixed(2);
            
            const currentQty = options.currentQty || 1;
            const activeTab = options.activeTab || 'rendimiento';
            const galleryIndex = options.galleryIndex || 0;
            const currentMainImg = gallery[galleryIndex] || gallery[0];

            const categories = TiendaService.getCategories ? TiendaService.getCategories() : [];
            const catObj = categories.find(c => c.id === product.category);
            const categoryName = catObj ? catObj.name : (product.category ? product.category.toUpperCase() : 'MATERIAL');

            // Productos relacionados (Cross-sell para completar equipación)
            const allProducts = TiendaService.getProducts ? TiendaService.getProducts() : [];
            const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 3);

            return `
                <div class="sp-modal-backdrop" id="sp-detail-backdrop" onclick="if(event.target === this) window.TiendaController && window.TiendaController.closeModal()">
                    <div class="sp-product-detail-modal" id="sp-product-detail-sheet" role="dialog" aria-modal="true" aria-label="${this.escapeHtml(product.name)}">
                        
                        <!-- 1. BARRA SUPERIOR FIJA (STICKY TOP APP BAR) -->
                        <div class="sp-detail-top-bar">
                            <button type="button" class="sp-detail-top-back-btn" onclick="window.TiendaController && window.TiendaController.closeModal()" title="Volver al catálogo de la tienda">
                                <i class="fas fa-arrow-left"></i>
                                <span>Volver a la Tienda</span>
                            </button>

                            <div class="sp-detail-top-crumb">
                                <span class="sp-top-crumb-brand">${this.escapeHtml(product.brand)}</span>
                                <i class="fas fa-chevron-right sp-top-crumb-sep"></i>
                                <span class="sp-top-crumb-cat">${this.escapeHtml(categoryName)}</span>
                            </div>

                            <div class="sp-detail-top-actions">
                                <button type="button" class="sp-detail-head-btn sp-btn-fav ${isFav ? 'is-fav' : ''}" 
                                    onclick="window.TiendaController && window.TiendaController.toggleFavorite('${product.id}')" 
                                    title="${isFav ? 'Eliminar de favoritos' : 'Guardar en deseados'}" 
                                    id="sp-fav-btn-${product.id}">
                                    <i class="${isFav ? 'fas fa-heart' : 'far fa-heart'}"></i>
                                </button>
                                <button type="button" class="sp-detail-head-btn" 
                                    onclick="window.TiendaController && window.TiendaController.shareWhatsApp('${product.id}')" 
                                    title="Compartir por WhatsApp">
                                    <i class="fas fa-share-nodes"></i>
                                </button>
                                <button type="button" class="sp-detail-head-btn sp-detail-cart-btn" 
                                    onclick="window.TiendaController && window.TiendaController.openCart()" 
                                    title="Ver mi cesta de compra">
                                    <i class="fas fa-cart-shopping"></i>
                                    <span class="sp-detail-cart-badge" id="sp-detail-cart-badge">${cartSummary.count || 0}</span>
                                </button>
                                <button type="button" class="sp-detail-head-btn sp-detail-close-btn" 
                                    onclick="window.TiendaController && window.TiendaController.closeModal()" 
                                    title="Cerrar ficha">
                                    <i class="fas fa-xmark"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 2. CONTENIDO PRINCIPAL CON SCROLL FLUIDO -->
                        <div class="sp-detail-content-scroll" id="sp-detail-content-scroll">
                            <div class="sp-detail-main-layout">
                                
                                <!-- =================================================== -->
                                <!-- 1. FOTO DEL PRODUCTO CENTRADA (HERO GALLERY) -->
                                <!-- =================================================== -->
                                <div class="sp-detail-gallery-col sp-gallery-centered">
                                    <div class="sp-gallery-stage">
                                        <!-- Badges flotantes en fila horizontal (Glassmorphism) -->
                                        <div class="sp-gallery-badges">
                                            ${discount > 0 ? `<span class="sp-gal-badge sp-gal-badge-discount"><i class="fas fa-tag"></i> -${discount}% DTO</span>` : ''}
                                            <span class="sp-gal-badge sp-gal-badge-official"><i class="fas fa-shield-check"></i> OFICIAL BCN</span>
                                            <span class="sp-gal-badge sp-gal-badge-bestseller"><i class="fas fa-fire"></i> TOP VENTAS</span>
                                        </div>

                                        <!-- Indicador numérico de imagen -->
                                        <div class="sp-gallery-counter" id="sp-gal-counter">
                                            <span id="sp-gal-curr-idx">${galleryIndex + 1}</span> / ${gallery.length}
                                        </div>

                                        <!-- Flechas de navegación en el Hero -->
                                        ${gallery.length > 1 ? `
                                            <button type="button" class="sp-gal-nav-arrow sp-gal-prev" onclick="window.TiendaController && window.TiendaController.prevGalleryImage()" title="Foto anterior">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <button type="button" class="sp-gal-nav-arrow sp-gal-next" onclick="window.TiendaController && window.TiendaController.nextGalleryImage()" title="Foto siguiente">
                                                <i class="fas fa-chevron-right"></i>
                                            </button>
                                        ` : ''}

                                        <!-- Contenedor de la Imagen Principal con Zoom -->
                                        <div class="sp-gal-main-wrap" onclick="window.TiendaController && window.TiendaController.openLightbox()" title="Pulsa para ver en pantalla completa">
                                            <img src="${currentMainImg}" id="sp-detail-main-img" class="sp-gal-main-img" alt="${this.escapeHtml(product.name)}"
                                                onerror="window.TiendaView && window.TiendaView.handleImgError(this, '${this.escapeHtml(product.name)}')">
                                            <div class="sp-gal-zoom-hint">
                                                <i class="fas fa-magnifying-glass-plus"></i>
                                                <span>Ver en alta resolución</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Puntos indicadores táctiles de galería (Mobile Dots) -->
                                    ${gallery.length > 1 ? `
                                        <div class="sp-gallery-dots">
                                            ${gallery.map((_, idx) => `
                                                <button type="button" class="sp-gallery-dot ${idx === galleryIndex ? 'active' : ''}" 
                                                    onclick="window.TiendaController && window.TiendaController.setGalleryImage(${idx})"
                                                    aria-label="Ver imagen ${idx + 1}"></button>
                                            `).join('')}
                                        </div>
                                    ` : ''}

                                    <!-- Carrusel de Miniaturas Interactivo -->
                                    ${gallery.length > 1 ? `
                                        <div class="sp-gallery-thumbnails sp-thumbs-centered" id="sp-gal-thumbs">
                                            ${gallery.map((img, idx) => `
                                                <button type="button" class="sp-gal-thumb-btn ${idx === galleryIndex ? 'active' : ''}" 
                                                    onclick="window.TiendaController && window.TiendaController.setGalleryImage(${idx})"
                                                    data-idx="${idx}"
                                                    title="Ver ángulo ${idx + 1}">
                                                    <img src="${img}" alt="Miniatura ${idx + 1}"
                                                        onerror="window.TiendaView && window.TiendaView.handleImgError(this, '${this.escapeHtml(product.name)}')">
                                                </button>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- =================================================== -->
                                <!-- 2. CABECERA DE PRODUCTO: MARCA, TÍTULO, RATING, PRECIO Y FORMATO -->
                                <!-- (DEBAJO DE LA FOTO DEL PRODUCTO) -->
                                <!-- =================================================== -->
                                <div class="sp-detail-header-block">
                                    <!-- Identificador de Marca & Sello Oficial -->
                                    <div class="sp-detail-brand-strip">
                                        <span class="sp-brand-capsule">
                                            <i class="fas fa-certificate"></i> ${this.escapeHtml(product.brand)}
                                        </span>
                                        <span class="sp-club-verified">
                                            <i class="fas fa-circle-check"></i> Producto Oficial SomosPadel BCN
                                        </span>
                                    </div>

                                    <h1 class="sp-detail-title">${this.escapeHtml(product.name)}</h1>

                                    <!-- Valoraciones y Prueba Social -->
                                    <div class="sp-detail-rating-strip">
                                        <div class="sp-stars-box">
                                            <span class="sp-stars-filled">★★★★★</span>
                                            <span class="sp-rating-score-num">4.9</span>
                                        </div>
                                        <span class="sp-rating-divider">·</span>
                                        <span class="sp-rating-reviews-txt">128 opiniones de jugadores</span>
                                        <span class="sp-rating-divider">·</span>
                                        <span class="sp-recommended-tag"><i class="fas fa-thumbs-up"></i> 98% lo recomiendan</span>
                                    </div>

                                    <!-- Bloque de Precio y Ahorro -->
                                    <div class="sp-detail-price-box">
                                        <div class="sp-price-primary-row">
                                            <span class="sp-price-current" id="sp-modal-price-display">${activePrice.toFixed(2)}€</span>
                                            ${activeOriginalPrice > activePrice ? `
                                                <span class="sp-price-strikethrough" id="sp-modal-original-price">${activeOriginalPrice.toFixed(2)}€</span>
                                                <span class="sp-discount-pill" id="sp-modal-savings-pill">Ahorras ${savings}€ (-${discount}%)</span>
                                            ` : ''}
                                        </div>
                                        <div class="sp-price-sub-info">
                                            <span><i class="fas fa-receipt"></i> IVA incluido</span>
                                            <span>•</span>
                                            <span style="color: #16a34a; font-weight: 700;"><i class="fas fa-box-open"></i> Envío gratis a partir de 50€</span>
                                            <span>•</span>
                                            <span style="color: #0284c7; font-weight: 700;">Cupón -15%: SOMOSPADEL15</span>
                                        </div>
                                    </div>

                                    <!-- Ticker de Disponibilidad Inmediata -->
                                    <div class="sp-stock-ticker-box">
                                        <div class="sp-stock-live-indicator">
                                            <span class="sp-stock-pulse-dot"></span>
                                            <span class="sp-stock-live-txt"><strong>EN STOCK INMEDIATO</strong> · Almacén central de Barcelona</span>
                                        </div>
                                        <span class="sp-stock-countdown"><i class="fas fa-bolt"></i> Listo para entrega en tu próxima americana o envío 24h</span>
                                    </div>

                                    <!-- Selector de Opciones / Formato (si aplica) -->
                                    ${variants.length ? `
                                        <div class="sp-variants-section">
                                            <div class="sp-variant-label">
                                                <span>Selecciona opción / formato:</span>
                                                <span class="sp-variant-selected-txt" id="sp-modal-variant-name">${this.escapeHtml(activeVariant.name)}</span>
                                            </div>
                                            <div class="sp-variant-chips">
                                                ${variants.map(v => `
                                                    <button type="button" class="sp-variant-chip ${activeVariant && activeVariant.id === v.id ? 'active' : ''}"
                                                        onclick="window.TiendaController && window.TiendaController.selectModalVariant('${v.id}')"
                                                        data-vid="${v.id}">
                                                        <span class="sp-v-name">${this.escapeHtml(v.name)}</span>
                                                        <span class="sp-v-price">${v.price.toFixed(2)}€</span>
                                                        ${v.badge ? `<span class="sp-v-badge">${v.badge}</span>` : ''}
                                                    </button>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- =================================================== -->
                                <!-- 3. BLOQUE DE CANTIDAD, BENEFICIOS, PESTAÑAS Y ACCIONES -->
                                <!-- =================================================== -->
                                <div class="sp-detail-info-col">
                                    <!-- Selector de Cantidad con Cálculo Dinámico -->
                                    <div class="sp-quantity-card">
                                        <div class="sp-qty-label-group">
                                            <span class="sp-qty-label">Cantidad a pedir:</span>
                                            <span class="sp-qty-stock-hint">Disponible para entrega inmediata</span>
                                        </div>
                                        <div class="sp-qty-stepper-wrap">
                                            <button type="button" class="sp-qty-btn" onclick="window.TiendaController && window.TiendaController.changeModalQty(-1)" aria-label="Reducir">
                                                <i class="fas fa-minus"></i>
                                            </button>
                                            <span class="sp-qty-number" id="sp-modal-qty-val">${currentQty}</span>
                                            <button type="button" class="sp-qty-btn" onclick="window.TiendaController && window.TiendaController.changeModalQty(1)" aria-label="Aumentar">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Tarjetas de Garantía Oficial SomosPadel (Trust Strip) -->
                                    <div class="sp-detail-trust-pills">
                                        <div class="sp-trust-pill">
                                            <i class="fas fa-truck-fast"></i>
                                            <div>
                                                <strong>Entrega 24/48h</strong>
                                                <span>O recogida gratis en pista</span>
                                            </div>
                                        </div>
                                        <div class="sp-trust-pill">
                                            <i class="fas fa-shield-halved"></i>
                                            <div>
                                                <strong>Garantía 3 Años</strong>
                                                <span>Distribución oficial directa</span>
                                            </div>
                                        </div>
                                        <div class="sp-trust-pill">
                                            <i class="fas fa-rotate-left"></i>
                                            <div>
                                                <strong>14 Días Cambio</strong>
                                                <span>Directo con el club</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Pestañas Interactivas de Contenido Técnico -->
                                    <div class="sp-detail-tabs-bar" role="tablist">
                                        <button type="button" class="sp-tab-nav-btn ${activeTab === 'rendimiento' ? 'active' : ''}" 
                                            onclick="window.TiendaController && window.TiendaController.switchDetailTab('rendimiento')" 
                                            data-tab="rendimiento" role="tab">
                                            <i class="fas fa-bolt"></i> Rendimiento
                                        </button>
                                        <button type="button" class="sp-tab-nav-btn ${activeTab === 'specs' ? 'active' : ''}" 
                                            onclick="window.TiendaController && window.TiendaController.switchDetailTab('specs')" 
                                            data-tab="specs" role="tab">
                                            <i class="fas fa-sliders"></i> Ficha Técnica
                                        </button>
                                        <button type="button" class="sp-tab-nav-btn ${activeTab === 'club' ? 'active' : ''}" 
                                            onclick="window.TiendaController && window.TiendaController.switchDetailTab('club')" 
                                            data-tab="club" role="tab">
                                            <i class="fas fa-award"></i> Ventajas Club
                                        </button>
                                        <button type="button" class="sp-tab-nav-btn ${activeTab === 'reviews' ? 'active' : ''}" 
                                            onclick="window.TiendaController && window.TiendaController.switchDetailTab('reviews')" 
                                            data-tab="reviews" role="tab">
                                            <i class="fas fa-comments"></i> Opiniones (3)
                                        </button>
                                    </div>

                                    <!-- Paneles de las Pestañas -->
                                    <div class="sp-tab-panels-wrap">
                                        <!-- Pestaña 1: Rendimiento -->
                                        <div class="sp-tab-panel ${activeTab === 'rendimiento' ? 'active' : ''}" id="sp-panel-rendimiento">
                                            <p class="sp-panel-desc">${this.escapeHtml(product.description)}</p>
                                            
                                            <div class="sp-highlights-grid">
                                                ${(product.highlights || [
                                                    'Material de competición testado en pistas de Barcelona',
                                                    'Máxima durabilidad y resistencia contrastada en partidos',
                                                    'Distribución oficial directa con garantía de SomosPadel BCN'
                                                ]).map(h => `
                                                    <div class="sp-highlight-item">
                                                        <i class="fas fa-circle-check"></i>
                                                        <span>${this.escapeHtml(h)}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>

                                        <!-- Pestaña 2: Ficha Técnica -->
                                        <div class="sp-tab-panel ${activeTab === 'specs' ? 'active' : ''}" id="sp-panel-specs">
                                            <div class="sp-specs-table">
                                                <div class="sp-spec-row">
                                                    <span class="sp-spec-key">Marca:</span>
                                                    <span class="sp-spec-val">${this.escapeHtml(product.brand)}</span>
                                                </div>
                                                <div class="sp-spec-row">
                                                    <span class="sp-spec-key">Categoría:</span>
                                                    <span class="sp-spec-val">${this.escapeHtml(categoryName)}</span>
                                                </div>
                                                ${product.specs ? Object.entries(product.specs).map(([k, v]) => `
                                                    <div class="sp-spec-row">
                                                        <span class="sp-spec-key">${this.escapeHtml(k.charAt(0).toUpperCase() + k.slice(1))}:</span>
                                                        <span class="sp-spec-val">${this.escapeHtml(v)}</span>
                                                    </div>
                                                `).join('') : `
                                                    <div class="sp-spec-row">
                                                        <span class="sp-spec-key">Garantía:</span>
                                                        <span class="sp-spec-val">3 Años Oficial SomosPadel</span>
                                                    </div>
                                                `}
                                                <div class="sp-spec-row">
                                                    <span class="sp-spec-key">Proveedor:</span>
                                                    <span class="sp-spec-val">${partner ? this.escapeHtml(partner.name) : 'SomosPadel Barcelona'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Pestaña 3: Ventajas Club -->
                                        <div class="sp-tab-panel ${activeTab === 'club' ? 'active' : ''}" id="sp-panel-club">
                                            <div class="sp-club-perks-box">
                                                <div class="sp-perk-card">
                                                    <div class="sp-perk-icon"><i class="fas fa-ticket"></i></div>
                                                    <div>
                                                        <strong>15% de Descuento Especial:</strong>
                                                        <p>Usa el código <code>SOMOSPADEL15</code> al finalizar tu pedido para rebajar el total.</p>
                                                    </div>
                                                </div>
                                                <div class="sp-perk-card">
                                                    <div class="sp-perk-icon"><i class="fas fa-hand-holding-hand"></i></div>
                                                    <div>
                                                        <strong>Entrega en Pista Directa:</strong>
                                                        <p>Puedes pedir que el organizador o monitor te lo entregue en mano en tu próxima americana.</p>
                                                    </div>
                                                </div>
                                                <div class="sp-perk-card">
                                                    <div class="sp-perk-icon"><i class="fab fa-whatsapp"></i></div>
                                                    <div>
                                                        <strong>Asesoramiento Personalizado:</strong>
                                                        <p>¿No estás seguro de tu elección? Escríbenos y un monitor te aconsejará según tu nivel de juego.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Pestaña 4: Opiniones de Jugadores -->
                                        <div class="sp-tab-panel ${activeTab === 'reviews' ? 'active' : ''}" id="sp-panel-reviews">
                                            <div class="sp-reviews-list">
                                                ${(product.playerReviews || [
                                                    { name: 'Marc Ramos', level: 'Nivel 4.5 · Prat Padel', stars: 5, date: 'Ayer', comment: 'Calidad excelente. El bote y la respuesta son brutales en pista.' },
                                                    { name: 'Laura Gómez', level: 'Nivel 3.5 · Hospitalet', stars: 5, date: 'Hace 4 días', comment: 'Llegó en 24h directamente al club. Trato insuperable.' },
                                                    { name: 'David Ferrer', level: 'Nivel 4.1 · Delfos', stars: 5, date: 'Hace 1 semana', comment: 'Mucho mejor precio que en otras webs con el descuento de socios.' }
                                                ]).map(rev => `
                                                    <div class="sp-review-card">
                                                        <div class="sp-review-top">
                                                            <div class="sp-reviewer-info">
                                                                <span class="sp-reviewer-avatar">${rev.name.charAt(0)}</span>
                                                                <div>
                                                                    <div class="sp-reviewer-name">${this.escapeHtml(rev.name)}</div>
                                                                    <div class="sp-reviewer-level">${this.escapeHtml(rev.level)}</div>
                                                                </div>
                                                            </div>
                                                            <div class="sp-review-stars">
                                                                <span>${'★'.repeat(rev.stars || 5)}</span>
                                                                <span class="sp-review-date">${rev.date}</span>
                                                            </div>
                                                        </div>
                                                        <p class="sp-review-body">"${this.escapeHtml(rev.comment)}"</p>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Franja de Compartir en Redes Sociales -->
                                    <div class="sp-share-strip">
                                        <span class="sp-share-label"><i class="fas fa-share-nodes"></i> Compartir este producto con amigos:</span>
                                        <div class="sp-share-buttons">
                                            <button type="button" class="sp-share-btn sp-share-wa" onclick="window.TiendaController && window.TiendaController.shareWhatsApp('${product.id}')">
                                                <i class="fab fa-whatsapp"></i> WhatsApp
                                            </button>
                                            <button type="button" class="sp-share-btn sp-share-ig" onclick="window.TiendaController && window.TiendaController.shareInstagram('${product.id}')">
                                                <i class="fab fa-instagram"></i> Instagram
                                            </button>
                                            <button type="button" class="sp-share-btn sp-share-fb" onclick="window.TiendaController && window.TiendaController.shareFacebook('${product.id}')">
                                                <i class="fab fa-facebook"></i> Facebook
                                            </button>
                                            <button type="button" class="sp-share-btn sp-share-copy" onclick="window.TiendaController && window.TiendaController.copyProductLink('${product.id}')">
                                                <i class="fas fa-link"></i> Copiar Enlace
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Productos Relacionados ("Completa tu bolsa") -->
                                    ${relatedProducts.length ? `
                                        <div class="sp-related-section">
                                            <h4 class="sp-related-title">
                                                <i class="fas fa-layer-group"></i> Completa tu equipación para la americana
                                            </h4>
                                            <div class="sp-related-grid">
                                                ${relatedProducts.map(rel => `
                                                    <div class="sp-related-card" onclick="window.TiendaController && window.TiendaController.openProductModal('${rel.id}')">
                                                        <img src="${rel.image}" alt="${this.escapeHtml(rel.name)}" class="sp-related-img"
                                                            onerror="window.TiendaView && window.TiendaView.handleImgError(this, '${this.escapeHtml(rel.name)}')">
                                                        <div class="sp-related-details">
                                                            <span class="sp-related-brand">${this.escapeHtml(rel.brand)}</span>
                                                            <div class="sp-related-name" title="${this.escapeHtml(rel.name)}">${this.escapeHtml(rel.name)}</div>
                                                            <div class="sp-related-price">${rel.promoPrice.toFixed(2)}€</div>
                                                        </div>
                                                        <button type="button" class="sp-related-add-btn" 
                                                            onclick="event.stopPropagation(); window.TiendaController && window.TiendaController.addToCart('${rel.id}', 1)"
                                                            title="Añadir rápido a la cesta">
                                                            <i class="fas fa-plus"></i>
                                                        </button>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}

                                </div>
                            </div>
                        </div>

                        <!-- 3. BARRA INFERIOR FIJA DE COMPRA (STICKY BOTTOM BUY BAR) -->
                        <div class="sp-detail-bottom-bar">
                            <div class="sp-bottom-bar-price">
                                <span class="sp-bottom-subtxt">Total a pagar:</span>
                                <div class="sp-bottom-total-row">
                                    <span class="sp-bottom-total-num" id="sp-bottom-total-val">${(activePrice * currentQty).toFixed(2)}€</span>
                                    <span class="sp-bottom-total-unit" id="sp-bottom-qty-subtxt">(${currentQty} ud${currentQty > 1 ? 's' : ''})</span>
                                </div>
                            </div>

                            <div class="sp-bottom-bar-actions">
                                <button type="button" class="sp-btn-buy-primary" id="sp-btn-add-modal" 
                                    onclick="window.TiendaController && window.TiendaController.addModalToCart()">
                                    <i class="fas fa-cart-shopping"></i>
                                    <span>Añadir a la Cesta</span>
                                </button>
                                <button type="button" class="sp-btn-buy-whatsapp" 
                                    onclick="window.TiendaController && window.TiendaController.orderModalWhatsApp()" 
                                    title="Pedir directamente con un monitor por WhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                    <span class="sp-wa-btn-text">Pedir por WhatsApp</span>
                                </button>
                            </div>
                        </div>

                        <!-- 4. LIGHTBOX MODAL PARA VER FOTO EN ALTA RESOLUCIÓN -->
                        <div id="sp-lightbox-root" style="display: none;"></div>

                    </div>
                </div>
            `;
        }

        // ==========================================
        // 🛒 MODAL / DRAWER DEL CARRITO DE COMPRA
        // ==========================================
        renderCartModal() {
            const summary = TiendaService.getCartSummary ? TiendaService.getCartSummary() : { cart: [], count: 0, subtotal: 0, total: 0, freeThreshold: 50, remainingForFree: 50, shippingCost: 0 };
            const cart = summary.cart || [];
            const appliedCoupon = this.appliedCoupon || null;
            
            let couponDiscount = 0;
            if (appliedCoupon && appliedCoupon.rate) {
                couponDiscount = Math.round(summary.subtotal * appliedCoupon.rate * 100) / 100;
            }
            const finalTotal = Math.max(0, Math.round((summary.subtotal - couponDiscount + summary.shippingCost) * 100) / 100);
            const progressPercent = Math.min(100, Math.round((summary.subtotal / (summary.freeThreshold || 50)) * 100));

            return `
                <div class="sp-cart-modal-backdrop" onclick="if(event.target === this) window.TiendaController && window.TiendaController.closeCart()">
                    <div class="sp-cart-drawer">
                        <div>
                            <div class="sp-cart-drawer-header">
                                <h2 class="sp-cart-drawer-title">
                                    <i class="fas fa-cart-shopping" style="color: #15803d;"></i>
                                    <span>Mi Cesta (${summary.count})</span>
                                </h2>
                                <button type="button" class="sp-cart-drawer-close" onclick="window.TiendaController && window.TiendaController.closeCart()">
                                    <i class="fas fa-xmark"></i>
                                </button>
                            </div>

                            <!-- Barra de progreso para Envío Gratis -->
                            <div class="sp-shipping-progress-box">
                                <div class="sp-shipping-progress-text">
                                    ${summary.remainingForFree > 0 ? `
                                        <span><i class="fas fa-truck-fast"></i> Te faltan <strong style="color: #15803d;">${summary.remainingForFree.toFixed(2)}€</strong> para <strong>ENVÍO GRATIS</strong></span>
                                    ` : `
                                        <span style="color: #166534;"><i class="fas fa-circle-check"></i> <strong>¡Enhorabuena! Tienes ENVÍO GRATIS 🎉</strong></span>
                                    `}
                                    <span>${progressPercent}%</span>
                                </div>
                                <div class="sp-shipping-progress-track">
                                    <div class="sp-shipping-progress-fill" style="width: ${progressPercent}%;"></div>
                                </div>
                            </div>

                            <!-- Lista de Productos en la Cesta -->
                            <div class="sp-cart-items-container">
                                ${cart.length === 0 ? `
                                    <div style="text-align: center; padding: 40px 10px; color: #64748b;">
                                        <i class="fas fa-cart-arrow-down" style="font-size: 2.8rem; color: #cbd5e1; margin-bottom: 12px;"></i>
                                        <h3 style="font-size: 1.05rem; color: #0f172a; margin: 0 0 6px 0;">Tu cesta está vacía</h3>
                                        <p style="font-size: 0.8rem; margin: 0 0 16px 0;">Añade palas, zapatillas o accesorios oficiales para comenzar.</p>
                                        <button type="button" class="sp-btn-add-cart" onclick="window.TiendaController && window.TiendaController.closeCart()" style="max-width: 200px; margin: 0 auto;">
                                            Explorar Catálogo
                                        </button>
                                    </div>
                                ` : cart.map(item => `
                                    <div class="sp-cart-item-row">
                                        <img src="${item.image}" alt="${this.escapeHtml(item.name)}" class="sp-cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=200&q=80'">
                                        <div class="sp-cart-item-details">
                                            <span class="sp-cart-item-brand">${this.escapeHtml(item.brand)}</span>
                                            <h4 class="sp-cart-item-title" title="${this.escapeHtml(item.name)}">${this.escapeHtml(item.name)}</h4>
                                            <div class="sp-cart-item-price">${(item.price * (item.qty || 1)).toFixed(2)}€</div>
                                        </div>
                                        <div class="sp-cart-qty-ctrl">
                                            <button type="button" class="sp-cart-qty-btn" onclick="window.TiendaController && window.TiendaController.updateCartQty('${item.id}', ${(item.qty || 1) - 1})">-</button>
                                            <span class="sp-cart-qty-val">${item.qty || 1}</span>
                                            <button type="button" class="sp-cart-qty-btn" onclick="window.TiendaController && window.TiendaController.updateCartQty('${item.id}', ${(item.qty || 1) + 1})">+</button>
                                        </div>
                                        <button type="button" class="sp-cart-item-remove" onclick="window.TiendaController && window.TiendaController.removeFromCart('${item.id}')" title="Eliminar">
                                            <i class="fas fa-trash-can"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Parte Inferior: Cupón y Checkout -->
                        ${cart.length > 0 ? `
                            <div class="sp-cart-summary-box">
                                <!-- Formulario de Cupón -->
                                <div class="sp-cart-coupon-form">
                                    <input type="text" id="sp-cart-coupon-input" class="sp-cart-coupon-input" placeholder="CÓDIGO CUPÓN (EJ: SOMOSPADEL15)" value="${appliedCoupon ? appliedCoupon.code : ''}">
                                    <button type="button" class="sp-cart-coupon-btn" onclick="window.TiendaController && window.TiendaController.applyCoupon(document.getElementById('sp-cart-coupon-input').value)">
                                        Aplicar
                                    </button>
                                </div>
                                ${appliedCoupon ? `
                                    <div style="font-size: 0.72rem; color: #166534; font-weight: 800; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; padding: 4px 8px; border-radius: 6px;">
                                        <span><i class="fas fa-tag"></i> Cupón "${appliedCoupon.code}" aplicado (-${Math.round(appliedCoupon.rate * 100)}%)</span>
                                        <button type="button" onclick="window.TiendaController && window.TiendaController.removeCoupon()" style="background: none; border: none; color: #dc2626; cursor: pointer; font-weight: 900;">✕</button>
                                    </div>
                                ` : ''}

                                <!-- Desglose Económico -->
                                <div class="sp-cart-summary-line">
                                    <span>Subtotal (${summary.count} productos)</span>
                                    <span style="font-weight: 800; color: #0f172a;">${summary.subtotal.toFixed(2)}€</span>
                                </div>
                                ${couponDiscount > 0 ? `
                                    <div class="sp-cart-summary-line" style="color: #166534;">
                                        <span>Descuento cupón (${appliedCoupon.code})</span>
                                        <span style="font-weight: 850;">-${couponDiscount.toFixed(2)}€</span>
                                    </div>
                                ` : ''}
                                <div class="sp-cart-summary-line">
                                    <span>Gastos de envío</span>
                                    <span style="font-weight: 800; color: ${summary.shippingCost === 0 ? '#166534' : '#0f172a'};">
                                        ${summary.shippingCost === 0 ? 'GRATIS' : `${summary.shippingCost.toFixed(2)}€`}
                                    </span>
                                </div>
                                <div class="sp-cart-summary-total">
                                    <span>TOTAL A PAGAR</span>
                                    <span style="color: #0f172a;">${finalTotal.toFixed(2)}€</span>
                                </div>

                                <!-- Botón WhatsApp Checkout -->
                                <button type="button" class="sp-btn-checkout-wa" onclick="window.TiendaController && window.TiendaController.checkoutWhatsApp()">
                                    <i class="fab fa-whatsapp" style="font-size: 1.3rem;"></i>
                                    <span>FINALIZAR PEDIDO POR WHATSAPP</span>
                                </button>
                                <div style="text-align: center; margin-top: 8px; font-size: 0.68rem; color: #64748b;">
                                    <i class="fas fa-lock"></i> Pedido tramitado y confirmado directamente por la dirección del club
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // ==========================================
        // 🛡️ FOOTER DE CONFIANZA Y GARANTÍAS
        // ==========================================
        renderTrustFooter() {
            return `
                <div class="sp-trust-footer">
                    <div class="sp-trust-card">
                        <div class="sp-trust-icon">
                            <i class="fas fa-truck-fast"></i>
                        </div>
                        <div class="sp-trust-text">
                            <h4>Envío Urgente 24/48h</h4>
                            <p>Entrega directa a domicilio o recogida en pistas de SomosPadel Barcelona.</p>
                        </div>
                    </div>
                    <div class="sp-trust-card">
                        <div class="sp-trust-icon">
                            <i class="fas fa-shield-heart"></i>
                        </div>
                        <div class="sp-trust-text">
                            <h4>Garantía Oficial 3 Años</h4>
                            <p>Material 100% original con sello oficial de marca y cambio directo si hay defecto.</p>
                        </div>
                    </div>
                    <div class="sp-trust-card">
                        <div class="sp-trust-icon">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div class="sp-trust-text">
                            <h4>¿Dudas? Habla con nosotros</h4>
                            <p>Atención directa por WhatsApp para resolver cualquier consulta sobre material o pedidos.</p>
                        </div>
                    </div>
                    <div class="sp-trust-card">
                        <div class="sp-trust-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div class="sp-trust-text">
                            <h4>Compra 100% Segura</h4>
                            <p>Atención directa por WhatsApp y confirmación personalizada de cada pedido.</p>
                        </div>
                    </div>
                </div>
            `;
        }


        // ==========================================
        // PESTAÑA: PROVEEDORES Y MARCAS
        // ==========================================
        renderPartnersTab() {
            const partners = TiendaService.getPartners();
            const canManage = TiendaService.hasPermission('manage_partners');

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 1.4rem; font-family: var(--sp-shop-font-title); color: #0f172a; margin: 0 0 4px 0;">Colaboradores y Acuerdos Comerciales</h2>
                        <p style="font-size: 0.85rem; color: #475569; margin: 0;">Gestión de empresas colaboradoras, comisiones negociadas y contratos de patrocinio de SomosPadel Barcelona.</p>
                    </div>
                    ${canManage ? `
                        <button class="sp-btn-buy-ext" onclick="window.TiendaController && window.TiendaController.openCreatePartnerModal()" style="padding: 10px 16px;">
                            <i class="fas fa-plus"></i> Nuevo Proveedor / Marca
                        </button>
                    ` : ''}
                </div>

                <div class="sp-partners-grid">
                    ${partners.map(p => `
                        <div class="sp-partner-card">
                            <div>
                                <div class="sp-partner-card-header">
                                    <div class="sp-partner-logo">${p.logoText || 'SP'}</div>
                                    <div>
                                        <h3 class="sp-partner-name">${this.escapeHtml(p.name)}</h3>
                                        <span class="sp-partner-type">${this.escapeHtml(p.agreementType)}</span>
                                    </div>
                                </div>

                                <div class="sp-partner-data-list">
                                    <div class="sp-partner-data-item">
                                        <i class="fas fa-user"></i>
                                        <span><strong>Contacto:</strong> ${this.escapeHtml(p.contactPerson)}</span>
                                    </div>
                                    <div class="sp-partner-data-item">
                                        <i class="fas fa-envelope"></i>
                                        <span><strong>Email:</strong> ${this.escapeHtml(p.email)}</span>
                                    </div>
                                    <div class="sp-partner-data-item">
                                        <i class="fas fa-phone"></i>
                                        <span><strong>Teléfono:</strong> ${this.escapeHtml(p.phone)}</span>
                                    </div>
                                    <div class="sp-partner-data-item">
                                        <i class="fas fa-globe"></i>
                                        <span><strong>Web:</strong> <a href="${p.web}" target="_blank" style="color: #0284c7; text-decoration: none;">${this.escapeHtml(p.web)}</a></span>
                                    </div>
                                    <div class="sp-partner-data-item">
                                        <i class="fas fa-percent"></i>
                                        <span><strong>Comisión acordada:</strong> <span style="color: #15803d; font-weight: 800;">${p.agreedCommission}</span></span>
                                    </div>
                                    <div class="sp-partner-data-item">
                                        <i class="fas fa-calendar-check"></i>
                                        <span><strong>Renovación:</strong> ${p.renewalDate}</span>
                                    </div>
                                </div>

                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; font-size: 0.75rem; color: #334155; border-left: 3px solid #84cc16;">
                                    <strong>Observaciones internas:</strong><br>
                                    ${this.escapeHtml(p.internalNotes)}
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--sp-shop-border);">
                                <div style="font-size: 0.75rem; color: #64748b;">
                                    Ventas acumuladas: <strong style="color: #0f172a;">${p.totalGeneratedSales}€</strong>
                                </div>
                                ${canManage ? `
                                    <button class="sp-btn-details" style="padding: 6px 12px;" onclick="window.TiendaController && window.TiendaController.openEditPartnerModal('${p.id}')">
                                        <i class="fas fa-pen"></i> Editar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // ==========================================
        // PESTAÑA: CAMPAÑAS Y PROMOCIONES
        // ==========================================
        renderPromotionsTab() {
            const promos = TiendaService.getPromotions();
            return `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 1.4rem; font-family: var(--sp-shop-font-title); color: #0f172a; margin: 0 0 4px 0;">Campañas y Promociones Activas</h2>
                    <p style="font-size: 0.85rem; color: #475569; margin: 0;">Estrategias de fidelización, ofertas semanales y colaboraciones comerciales de la temporada.</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                    ${promos.map(pr => `
                        <div style="background: #ffffff; border: 1px solid var(--sp-shop-border); border-radius: var(--sp-shop-radius); padding: 20px; position: relative; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.05);">
                            <span style="background: #CCFF00; color: #000; font-size: 0.68rem; font-weight: 900; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 10px;">
                                ${pr.badge}
                            </span>
                            <h3 style="font-size: 1.2rem; font-family: var(--sp-shop-font-title); color: #0f172a; margin: 0 0 8px 0;">${this.escapeHtml(pr.title)}</h3>
                            <p style="font-size: 0.82rem; color: #475569; margin: 0 0 14px 0; line-height: 1.45;">${this.escapeHtml(pr.description)}</p>

                            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 12px; margin-bottom: 12px;">
                                <div>
                                    <div style="font-size: 0.68rem; color: #64748b; font-weight: 700;">CUPÓN ACTIVO</div>
                                    <div style="font-family: monospace; font-size: 1rem; font-weight: 900; color: #0284c7;">${pr.code}</div>
                                </div>
                                <button class="sp-btn-details" onclick="window.TiendaController && window.TiendaController.copyCoupon('${pr.code}')">
                                    <i class="fas fa-copy"></i> Copiar
                                </button>
                            </div>

                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b;">
                                <span><i class="fas fa-clock"></i> Válido hasta: <strong style="color: #0f172a;">${pr.validUntil}</strong></span>
                                <span style="color: #15803d; font-weight: 800;">${pr.discountText}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // ==========================================
        // PESTAÑA: DASHBOARD COMERCIAL & PANEL ECONÓMICO
        // ==========================================
        renderAnalyticsTab() {
            const analytics = TiendaService.getAnalytics(this.selectedPeriod);
            const canManage = TiendaService.hasPermission('manage_products');

            return `
                <div class="sp-analytics-header">
                    <div>
                        <h2 style="font-size: 1.4rem; font-family: var(--sp-shop-font-title); color: #0f172a; margin: 0 0 4px 0;">Dashboard Comercial & Panel Económico</h2>
                        <p style="font-size: 0.85rem; color: #475569; margin: 0;">Análisis de tráfico comercial, clics externos generados, conversiones estimadas y comisiones obtenidas.</p>
                    </div>

                    <!-- Selector de Periodo -->
                    <div class="sp-period-selector">
                        <button class="sp-period-btn ${this.selectedPeriod === 'monthly' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.switchPeriod('monthly')">Mensual</button>
                        <button class="sp-period-btn ${this.selectedPeriod === 'quarterly' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.switchPeriod('quarterly')">Trimestral</button>
                        <button class="sp-period-btn ${this.selectedPeriod === 'annual' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.switchPeriod('annual')">Anual</button>
                        <button class="sp-period-btn ${this.selectedPeriod === 'total' ? 'active' : ''}" onclick="window.TiendaController && window.TiendaController.switchPeriod('total')">Histórico Total</button>
                    </div>
                </div>

                <!-- KPI Grid -->
                <div class="sp-kpi-grid">
                    <div class="sp-kpi-card">
                        <div class="sp-kpi-label">Productos Publicados</div>
                        <div class="sp-kpi-value">${analytics.totalProducts}</div>
                        <div class="sp-kpi-subtitle">${analytics.featuredCount} destacados en portada</div>
                    </div>
                    <div class="sp-kpi-card">
                        <div class="sp-kpi-label">Visitas por Producto</div>
                        <div class="sp-kpi-value">${analytics.totalViews}</div>
                        <div class="sp-kpi-subtitle">+18% vs periodo anterior</div>
                    </div>
                    <div class="sp-kpi-card">
                        <div class="sp-kpi-label">Clicks Generados (CTR)</div>
                        <div class="sp-kpi-value">${analytics.totalClicks} <span style="font-size: 0.9rem; color: #0284c7;">(${analytics.ctr}%)</span></div>
                        <div class="sp-kpi-subtitle">Hacia tiendas externas</div>
                    </div>
                    <div class="sp-kpi-card">
                        <div class="sp-kpi-label">Conversiones Registradas</div>
                        <div class="sp-kpi-value">${analytics.totalConversions}</div>
                        <div class="sp-kpi-subtitle">Ventas efectivas validadas</div>
                    </div>
                    <div class="sp-kpi-card">
                        <div class="sp-kpi-label">Facturación Generada</div>
                        <div class="sp-kpi-value">${analytics.totalSalesAmount}€</div>
                        <div class="sp-kpi-subtitle">Volumen de negocio colaboradores</div>
                    </div>
                    <div class="sp-kpi-card" style="border-color: #84cc16;">
                        <div class="sp-kpi-label" style="color: #15803d;">Comisiones Obtenidas</div>
                        <div class="sp-kpi-value" style="color: #15803d;">${analytics.totalCommissions.toFixed(2)}€</div>
                        <div class="sp-kpi-subtitle" style="color: #15803d;">Beneficio neto para SomosPadel</div>
                    </div>
                </div>

                <!-- Top Insights -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div style="background: #ffffff; border: 1px solid var(--sp-shop-border); border-radius: 16px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">🔥 Producto Más Visitado</span>
                        <div style="font-size: 1.1rem; font-weight: 900; color: #0f172a; margin-top: 4px;">
                            ${analytics.topProduct ? analytics.topProduct.name : 'N/A'}
                        </div>
                        <div style="font-size: 0.78rem; color: #15803d; font-weight: 700; margin-top: 2px;">
                            ${analytics.topProduct ? `${analytics.topProduct.views} visitas • ${analytics.topProduct.clicks} clics` : ''}
                        </div>
                    </div>
                    <div style="background: #ffffff; border: 1px solid var(--sp-shop-border); border-radius: 16px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">🤝 Proveedor Más Rentable</span>
                        <div style="font-size: 1.1rem; font-weight: 900; color: #0f172a; margin-top: 4px;">
                            ${analytics.topPartner ? analytics.topPartner.name : 'N/A'}
                        </div>
                        <div style="font-size: 0.78rem; color: #0284c7; font-weight: 700; margin-top: 2px;">
                            ${analytics.topPartner ? `Comisión acumulada: ${analytics.topPartner.accumulatedCommission}€` : ''}
                        </div>
                    </div>
                </div>

                <!-- Tabla Detallada por Producto -->
                <div class="sp-table-container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 1rem; color: #0f172a; margin: 0; font-family: var(--sp-shop-font-title);">Rendimiento por Producto</h3>
                        ${canManage ? `
                            <button class="sp-btn-details" onclick="window.TiendaController && window.TiendaController.simulateConversionPrompt()" style="font-size: 0.72rem; padding: 6px 10px;">
                                <i class="fas fa-plus"></i> Registrar Venta de Prueba
                            </button>
                        ` : ''}
                    </div>
                    <table class="sp-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Marca</th>
                                <th>Proveedor</th>
                                <th>Visitas</th>
                                <th>Clicks Generados</th>
                                <th>Ventas</th>
                                <th>Comisión SomosPadel</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analytics.productsTable.map(row => `
                                <tr>
                                    <td style="font-weight: 700; color: #fff;">${this.escapeHtml(row.name)}</td>
                                    <td><span style="color: #00F0FF; font-weight: 700;">${row.brand}</span></td>
                                    <td>${this.escapeHtml(row.partnerName)}</td>
                                    <td>${row.views}</td>
                                    <td><span style="color: #CCFF00; font-weight: 800;">${row.clicks}</span></td>
                                    <td>${row.conversions}</td>
                                    <td style="font-weight: 900; color: #10B981;">+${row.commission}€</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Tabla Detallada por Proveedor -->
                <div class="sp-table-container">
                    <h3 style="font-size: 1rem; color: #fff; margin: 0 0 12px 0; font-family: var(--sp-shop-font-title);">Rendimiento por Colaborador & Proveedor</h3>
                    <table class="sp-table">
                        <thead>
                            <tr>
                                <th>Proveedor</th>
                                <th>Tipo de Acuerdo</th>
                                <th>Comisión Pactada</th>
                                <th>Facturación Generada</th>
                                <th>Comisión para SomosPadel</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analytics.partnersTable.map(row => `
                                <tr>
                                    <td style="font-weight: 700; color: #fff;">${this.escapeHtml(row.name)}</td>
                                    <td>${this.escapeHtml(row.agreementType)}</td>
                                    <td><span style="color: #CCFF00; font-weight: 800;">${row.commissionRate}</span></td>
                                    <td>${row.totalSales}€</td>
                                    <td style="font-weight: 900; color: #10B981;">${row.commission}€</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // ==========================================
        // MODALES DE GESTIÓN (NUEVO PRODUCTO / PROVEEDOR)
        // ==========================================
        renderProductFormModal(productId = null) {
            const product = productId ? TiendaService.getProductById(productId) : {
                id: '',
                name: '',
                brand: '',
                category: 'palas',
                description: '',
                originalPrice: 100,
                promoPrice: 85,
                externalLink: 'https://',
                partnerId: 'partner-bullpadel',
                featured: true,
                badges: ['Recomendado por SomosPadel'],
                image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=700&q=80',
                gallery: []
            };

            const partners = TiendaService.getPartners();
            const categories = TiendaService.getCategories().filter(c => c.id !== 'todos');

            return `
                <div class="sp-modal-backdrop" onclick="if(event.target === this) window.TiendaController && window.TiendaController.closeModal()">
                    <div class="sp-product-detail-modal" style="max-width: 600px;">
                        <button class="sp-modal-close-btn" onclick="window.TiendaController && window.TiendaController.closeModal()">
                            <i class="fas fa-xmark"></i>
                        </button>
                        <h2 style="font-size: 1.4rem; color: #0f172a; margin: 0 0 16px 0; font-family: var(--sp-shop-font-title);">
                            ${productId ? 'Editar Producto' : 'Crear Nuevo Producto en Catálogo'}
                        </h2>

                        <form id="sp-product-form" onsubmit="window.TiendaController && window.TiendaController.saveProductForm(event, '${productId || ''}'); return false;" style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="font-size: 0.75rem; color: #475569; font-weight: 700;">Nombre del Producto</label>
                                <input type="text" name="name" required value="${this.escapeHtml(product.name)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Marca</label>
                                    <input type="text" name="brand" required value="${this.escapeHtml(product.brand)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Categoría</label>
                                    <select name="category" class="sp-shop-sort-select" style="width: 100%; height: 42px;">
                                        ${categories.map(c => `<option value="${c.id}" ${product.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Precio Original (€)</label>
                                    <input type="number" step="0.01" name="originalPrice" required value="${product.originalPrice}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Precio Promocional (€)</label>
                                    <input type="number" step="0.01" name="promoPrice" required value="${product.promoPrice}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Proveedor Asociado</label>
                                <select name="partnerId" class="sp-shop-sort-select" style="width: 100%; height: 42px;">
                                    ${partners.map(p => `<option value="${p.id}" ${product.partnerId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Enlace a Compra Externa</label>
                                <input type="url" name="externalLink" required value="${this.escapeHtml(product.externalLink)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">URL Imagen Principal</label>
                                <input type="url" name="image" required value="${this.escapeHtml(product.image)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Descripción</label>
                                <textarea name="description" rows="3" class="sp-shop-search-input" style="padding: 10px 14px; font-family: inherit;">${this.escapeHtml(product.description)}</textarea>
                            </div>
                            <button type="submit" class="sp-btn-buy-ext" style="padding: 14px; margin-top: 10px;">
                                <i class="fas fa-check"></i> Guardar Producto
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }

        renderPartnerFormModal(partnerId = null) {
            const partner = partnerId ? TiendaService.getPartnerById(partnerId) : {
                id: '',
                name: '',
                logoText: 'SP',
                contactPerson: '',
                email: '',
                phone: '',
                web: 'https://',
                agreementType: 'Colaborador Oficial',
                agreedCommission: '12%',
                renewalDate: '2027-12-31',
                internalNotes: ''
            };

            return `
                <div class="sp-modal-backdrop" onclick="if(event.target === this) window.TiendaController && window.TiendaController.closeModal()">
                    <div class="sp-product-detail-modal" style="max-width: 550px;">
                        <button class="sp-modal-close-btn" onclick="window.TiendaController && window.TiendaController.closeModal()">
                            <i class="fas fa-xmark"></i>
                        </button>
                        <h2 style="font-size: 1.4rem; color: #0f172a; margin: 0 0 16px 0; font-family: var(--sp-shop-font-title);">
                            ${partnerId ? 'Editar Proveedor / Colaborador' : 'Añadir Nuevo Proveedor / Colaborador'}
                        </h2>

                        <form id="sp-partner-form" onsubmit="window.TiendaController && window.TiendaController.savePartnerForm(event, '${partnerId || ''}'); return false;" style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 0.75rem; color: #475569; font-weight: 700;">Nombre de la Empresa</label>
                                    <input type="text" name="name" required value="${this.escapeHtml(partner.name)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Logo (2 letras)</label>
                                    <input type="text" maxlength="4" name="logoText" value="${this.escapeHtml(partner.logoText)}" class="sp-shop-search-input" style="padding: 10px 14px; text-transform: uppercase;">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Persona de Contacto</label>
                                    <input type="text" name="contactPerson" required value="${this.escapeHtml(partner.contactPerson)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Teléfono</label>
                                    <input type="tel" name="phone" value="${this.escapeHtml(partner.phone)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Email de Contacto</label>
                                <input type="email" name="email" required value="${this.escapeHtml(partner.email)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Página Web</label>
                                <input type="url" name="web" value="${this.escapeHtml(partner.web)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Tipo de Acuerdo</label>
                                    <input type="text" name="agreementType" value="${this.escapeHtml(partner.agreementType)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Comisión Acordada</label>
                                    <input type="text" name="agreedCommission" value="${this.escapeHtml(partner.agreedCommission)}" class="sp-shop-search-input" style="padding: 10px 14px;">
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Fecha de Renovación</label>
                                <input type="date" name="renewalDate" value="${partner.renewalDate}" class="sp-shop-search-input" style="padding: 10px 14px;">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Observaciones Internas</label>
                                <textarea name="internalNotes" rows="2" class="sp-shop-search-input" style="padding: 10px 14px; font-family: inherit;">${this.escapeHtml(partner.internalNotes)}</textarea>
                            </div>
                            <button type="submit" class="sp-btn-buy-ext" style="padding: 14px; margin-top: 10px;">
                                <i class="fas fa-check"></i> Guardar Colaborador
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }

        bindEvents() {
            // Eventos adicionales si son necesarios
        }

        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    return new TiendaViewClass();
}));
