/**
 * TiendaController.js - Controlador Principal de Tienda SomosPadel BCN
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./TiendaService', './TiendaView'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./TiendaService'), require('./TiendaView'));
    } else {
        root.TiendaController = factory(root.TiendaService, root.TiendaView);
    }
}(typeof self !== 'undefined' ? self : this, function (TiendaService, TiendaView) {

    class TiendaControllerClass {
        constructor() {
            this.containerId = 'content-area';
            this.isModalOpen = false;
            this.isLightboxOpen = false;
            this.currentModalProduct = null;
            this.currentGalleryIndex = 0;
            this.currentModalQty = 1;
            this.currentModalVariant = null;
            this.activeDetailTab = 'rendimiento';

            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                window.addEventListener('popstate', (e) => {
                    if (this.isModalOpen) {
                        this.closeModal(false);
                    }
                });
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        if (this.isLightboxOpen) {
                            this.closeLightbox();
                        } else if (this.isModalOpen) {
                            this.closeModal();
                        }
                    }
                });
            }
        }

        init(containerId = 'content-area') {
            this.containerId = containerId;

            // Verificar si la tienda está desbloqueada por el administrador/clave
            if (!TiendaService.isStoreAdminAuthenticated()) {
                TiendaView.renderUnderConstructionGate(this.containerId);
                return;
            }

            TiendaView.render(this.containerId);

            if (typeof window !== 'undefined' && window.SubnavManager && typeof window.SubnavManager.renderTienda === 'function') {
                window.SubnavManager.renderTienda(TiendaView.selectedCategory || 'todos');
            }

            // Revisar si viene parámetro deep-link de producto en URL (ej: #tienda?producto=prod-bullpadel-hack)
            const hash = window.location.hash || '';
            if (hash.includes('producto=')) {
                const match = hash.match(/producto=([^&]+)/);
                if (match && match[1]) {
                    setTimeout(() => {
                        this.openProductModal(match[1]);
                    }, 150);
                }
            }
        }

        handleGateLogin(e) {
            if (e && e.preventDefault) e.preventDefault();
            const input = document.getElementById('sp-tienda-gate-pass');
            const password = input ? input.value : '';

            if (TiendaService.loginStoreAdmin(password)) {
                this.showToast('¡Acceso concedido a la Tienda! 🎾');
                this.init(this.containerId);
            } else {
                TiendaView.renderUnderConstructionGate(this.containerId, 'Contraseña incorrecta. Esta sección está en construcción.');
            }
        }

        toggleGatePasswordVisibility() {
            const input = document.getElementById('sp-tienda-gate-pass');
            const icon = document.getElementById('sp-tienda-gate-eye-icon');
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

        lockStore() {
            TiendaService.logoutStoreAdmin();
            this.showToast('Tienda bloqueada (Modo En Construcción activo) 🔒');
            TiendaView.renderUnderConstructionGate(this.containerId);
        }

        goBackToApp() {
            if (window.Router && typeof window.Router.navigate === 'function') {
                window.Router.navigate('dashboard');
            } else {
                window.location.href = 'index.html';
            }
        }

        switchTab(tab) {
            TiendaView.activeTab = tab;
            TiendaView.render(this.containerId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        switchPeriod(period) {
            TiendaView.selectedPeriod = period;
            TiendaView.render(this.containerId);
        }

        handleCategory(categoryId) {
            TiendaView.selectedCategory = categoryId;
            TiendaView.render(this.containerId);
            if (typeof window !== 'undefined' && window.SubnavManager && typeof window.SubnavManager.renderTienda === 'function') {
                window.SubnavManager.renderTienda(categoryId);
            }
        }

        handleTag(tag) {
            TiendaView.selectedTag = tag;
            TiendaView.render(this.containerId);
            if (typeof window !== 'undefined' && window.SubnavManager && typeof window.SubnavManager.renderTienda === 'function') {
                window.SubnavManager.renderTienda(tag === 'Oferta' ? 'ofertas' : (TiendaView.selectedCategory || 'todos'));
            }
        }

        handleSearch(query) {
            TiendaView.searchQuery = query;
            const grid = document.getElementById('sp-products-grid');
            if (grid) {
                grid.innerHTML = TiendaView.renderProductCards();
            }
        }

        handleSort(sortBy) {
            TiendaView.sortBy = sortBy;
            const grid = document.getElementById('sp-products-grid');
            if (grid) {
                grid.innerHTML = TiendaView.renderProductCards();
            }
        }

        filterByPartner(partnerId) {
            TiendaView.activeTab = 'catalogo';
            TiendaView.selectedCategory = 'todos';
            TiendaView.selectedTag = 'todos';
            const partner = TiendaService.getPartnerById(partnerId);
            if (partner) {
                TiendaView.searchQuery = partner.name.split(' ')[0];
            }
            TiendaView.render(this.containerId);
        }

        handleBrand(brand) {
            TiendaView.selectedBrand = brand;
            TiendaView.render(this.containerId);
        }

        resetFilters() {
            TiendaView.selectedCategory = 'todos';
            TiendaView.selectedBrand = 'Todas';
            TiendaView.selectedTag = 'todos';
            TiendaView.searchQuery = '';
            TiendaView.render(this.containerId);
        }

        // ==========================================
        // 🛒 GESTIÓN DEL CARRITO DE COMPRA ONLINE
        // ==========================================
        openCart() {
            if (typeof window !== 'undefined' && window.SubnavManager && typeof window.SubnavManager.renderTienda === 'function') {
                window.SubnavManager.renderTienda('cesta');
            }
            const cartRoot = document.getElementById('sp-tienda-cart-root');
            if (cartRoot) {
                cartRoot.innerHTML = TiendaView.renderCartModal();
            }
        }

        closeCart() {
            const cartRoot = document.getElementById('sp-tienda-cart-root');
            if (cartRoot) {
                cartRoot.innerHTML = '';
            }
        }

        addToCart(productId, qty = 1) {
            const ok = TiendaService.addToCart(productId, qty);
            if (ok) {
                const product = TiendaService.getProductById(productId);
                const pName = product ? product.name : 'Producto';
                this.showToast(`¡${pName} añadido a tu cesta! 🛒`);
                this.updateHeaderCartBadge();
                this.openCart();
            } else {
                this.showToast('No se pudo añadir el producto a la cesta');
            }
        }

        updateCartQty(productId, qty) {
            TiendaService.updateCartQty(productId, qty);
            this.updateHeaderCartBadge();
            const cartRoot = document.getElementById('sp-tienda-cart-root');
            if (cartRoot && cartRoot.innerHTML.trim()) {
                cartRoot.innerHTML = TiendaView.renderCartModal();
            }
        }

        removeFromCart(productId) {
            TiendaService.removeFromCart(productId);
            this.updateHeaderCartBadge();
            this.showToast('Producto eliminado de la cesta');
            const cartRoot = document.getElementById('sp-tienda-cart-root');
            if (cartRoot && cartRoot.innerHTML.trim()) {
                cartRoot.innerHTML = TiendaView.renderCartModal();
            }
        }

        updateHeaderCartBadge() {
            const summary = TiendaService.getCartSummary();
            const countEl = document.getElementById('sp-header-cart-count');
            const totalEl = document.getElementById('sp-header-cart-total');
            if (countEl) countEl.textContent = summary.count || 0;
            if (totalEl) totalEl.textContent = `${(summary.total || 0).toFixed(2)}€`;
        }

        applyCoupon(code) {
            if (!code || !code.trim()) {
                this.showToast('Introduce un código de cupón');
                return;
            }
            const cleanCode = code.trim().toUpperCase();
            if (cleanCode === 'SOMOSPADEL15') {
                TiendaView.appliedCoupon = { code: 'SOMOSPADEL15', rate: 0.15 };
                this.showToast('¡Cupón del 15% de descuento aplicado con éxito! 🎟️');
            } else if (cleanCode === 'SEMANAPADEL') {
                TiendaView.appliedCoupon = { code: 'SEMANAPADEL', rate: 0.10 };
                this.showToast('¡Cupón de la semana aplicado (-10%)! 🎟️');
            } else {
                this.showToast('Cupón no válido o expirado ⚠️');
                return;
            }
            const cartRoot = document.getElementById('sp-tienda-cart-root');
            if (cartRoot) {
                cartRoot.innerHTML = TiendaView.renderCartModal();
            }
        }

        removeCoupon() {
            TiendaView.appliedCoupon = null;
            this.showToast('Cupón eliminado');
            const cartRoot = document.getElementById('sp-tienda-cart-root');
            if (cartRoot) {
                cartRoot.innerHTML = TiendaView.renderCartModal();
            }
        }

        checkoutWhatsApp() {
            const summary = TiendaService.getCartSummary();
            const cart = summary.cart || [];
            if (cart.length === 0) {
                this.showToast('Tu cesta de compra está vacía');
                return;
            }

            const appliedCoupon = TiendaView.appliedCoupon || null;
            let couponDiscount = 0;
            if (appliedCoupon && appliedCoupon.rate) {
                couponDiscount = Math.round(summary.subtotal * appliedCoupon.rate * 100) / 100;
            }
            const finalTotal = Math.max(0, Math.round((summary.subtotal - couponDiscount + summary.shippingCost) * 100) / 100);

            const lines = [];
            lines.push(`🎾 *NUEVO PEDIDO - TIENDA SOMOSPADEL BCN* 🎾\n`);
            lines.push(`¡Hola equipo de SomosPadel Barcelona! Deseo tramitar el siguiente pedido:\n`);

            cart.forEach((item, idx) => {
                lines.push(`${idx + 1}. *${item.name}* (${item.brand})`);
                lines.push(`   Cantidad: ${item.qty} ud(s) · ${(item.price * item.qty).toFixed(2)}€`);
            });

            lines.push(`\n---------------------------------`);
            lines.push(`📦 Subtotal: *${summary.subtotal.toFixed(2)}€*`);
            if (appliedCoupon && couponDiscount > 0) {
                lines.push(`🎟️ Cupón aplicado (${appliedCoupon.code}): *- ${couponDiscount.toFixed(2)}€*`);
            }
            lines.push(`🚚 Gastos de envío: *${summary.shippingCost === 0 ? 'GRATIS' : `${summary.shippingCost.toFixed(2)}€`}*`);
            lines.push(`💰 *TOTAL A PAGAR: ${finalTotal.toFixed(2)}€*`);
            lines.push(`---------------------------------\n`);
            lines.push(`👤 *Mis Datos de Entrega:*`);
            lines.push(`- Nombre y Apellidos: `);
            lines.push(`- Teléfono de contacto: `);
            lines.push(`- Recogida en pistas o dirección: `);

            const msgText = lines.join('\n');
            const phone = '34600000000';
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msgText)}`;

            window.open(url, '_blank');
            this.showToast('Abriendo WhatsApp para tramitar tu pedido 🎾');
        }

        consultWhatsApp(productName = '') {
            let text = `¡Hola equipo de SomosPadel Barcelona! 🎾 Deseo resolver una duda y consultar sobre material de la tienda.`;
            if (productName) {
                text = `¡Hola! 🎾 Tengo dudas sobre el producto: *${productName}*. ¿Me podéis asesorar?`;
            }
            const phone = '34600000000';
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
            this.showToast('Conectando por WhatsApp 💬');
        }

        handleRoleChange(role) {
            TiendaService.setCurrentRole(role);
            this.showToast(`Rol comercial cambiado a: ${role}`);
            TiendaView.render(this.containerId);
        }

        // ==========================================
        // MODALES DE PRODUCTOS Y DETALLES (EXPERIENCIA LUXURY APP)
        // ==========================================
        openProductModal(productId) {
            const product = TiendaService.getProductById(productId);
            if (!product) return;

            this.currentModalProduct = product;
            this.currentGalleryIndex = 0;
            this.currentModalQty = 1;
            this.currentModalVariant = product.variants && product.variants.length ? product.variants[0] : null;
            this.activeDetailTab = 'rendimiento';
            this.isModalOpen = true;

            // Bloquear scroll del fondo
            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.add('sp-modal-open');
                document.body.style.overflow = 'hidden';
            }

            // Integración con historial del navegador (para botón retroceder de Android/móvil)
            try {
                if (window.history && window.history.pushState) {
                    window.history.pushState({ spModal: 'product', productId }, '', '#tienda?producto=' + encodeURIComponent(productId));
                }
            } catch (e) {}

            const root = document.getElementById('sp-tienda-modal-root');
            if (root) {
                root.innerHTML = TiendaView.renderProductModal(productId, {
                    currentQty: this.currentModalQty,
                    currentVariant: this.currentModalVariant,
                    activeTab: this.activeDetailTab,
                    galleryIndex: this.currentGalleryIndex
                });
            }
        }

        closeModal(triggerHistory = true) {
            this.isModalOpen = false;
            this.isLightboxOpen = false;
            this.currentModalProduct = null;

            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.remove('sp-modal-open');
                document.body.style.overflow = '';
            }

            const root = document.getElementById('sp-tienda-modal-root');
            if (root) {
                root.innerHTML = '';
            }

            if (triggerHistory) {
                try {
                    if (window.location.hash.includes('producto=')) {
                        window.history.replaceState(null, '', window.location.pathname + '#tienda');
                    }
                } catch (e) {}
            }
        }

        setGalleryImage(index) {
            if (!this.currentModalProduct) return;
            const gallery = this.currentModalProduct.gallery && this.currentModalProduct.gallery.length ? this.currentModalProduct.gallery : [this.currentModalProduct.image];
            if (index < 0 || index >= gallery.length) return;
            
            this.currentGalleryIndex = index;
            const mainImg = document.getElementById('sp-detail-main-img');
            if (mainImg) {
                mainImg.src = gallery[index];
            }
            const counterEl = document.getElementById('sp-gal-curr-idx');
            if (counterEl) {
                counterEl.textContent = index + 1;
            }
            // Actualizar botones de miniaturas
            const thumbBtns = document.querySelectorAll('.sp-gal-thumb-btn');
            thumbBtns.forEach((btn, i) => {
                if (i === index) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            // Actualizar puntos táctiles de galería (Mobile Dots)
            const dotBtns = document.querySelectorAll('.sp-gallery-dot');
            dotBtns.forEach((dot, i) => {
                if (i === index) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        }

        prevGalleryImage() {
            if (!this.currentModalProduct) return;
            const gallery = this.currentModalProduct.gallery && this.currentModalProduct.gallery.length ? this.currentModalProduct.gallery : [this.currentModalProduct.image];
            const nextIdx = (this.currentGalleryIndex - 1 + gallery.length) % gallery.length;
            this.setGalleryImage(nextIdx);
        }

        nextGalleryImage() {
            if (!this.currentModalProduct) return;
            const gallery = this.currentModalProduct.gallery && this.currentModalProduct.gallery.length ? this.currentModalProduct.gallery : [this.currentModalProduct.image];
            const nextIdx = (this.currentGalleryIndex + 1) % gallery.length;
            this.setGalleryImage(nextIdx);
        }

        openLightbox() {
            if (!this.currentModalProduct) return;
            const gallery = this.currentModalProduct.gallery && this.currentModalProduct.gallery.length ? this.currentModalProduct.gallery : [this.currentModalProduct.image];
            const currentImg = gallery[this.currentGalleryIndex] || gallery[0];
            const lightbox = document.getElementById('sp-lightbox-root');
            if (lightbox) {
                this.isLightboxOpen = true;
                lightbox.style.display = 'flex';
                lightbox.className = 'sp-lightbox-overlay';
                lightbox.innerHTML = `
                    <div class="sp-lightbox-content" onclick="event.stopPropagation()">
                        <button type="button" class="sp-lightbox-close" onclick="window.TiendaController && window.TiendaController.closeLightbox()" title="Cerrar ampliación">
                            <i class="fas fa-xmark"></i>
                        </button>
                        <img src="${currentImg}" class="sp-lightbox-img" alt="${this.escapeHtml(this.currentModalProduct.name)}">
                        <div class="sp-lightbox-caption">
                            <span>${this.escapeHtml(this.currentModalProduct.name)}</span>
                            <span>Foto ${this.currentGalleryIndex + 1} de ${gallery.length}</span>
                        </div>
                    </div>
                `;
                lightbox.onclick = () => this.closeLightbox();
            }
        }

        closeLightbox() {
            this.isLightboxOpen = false;
            const lightbox = document.getElementById('sp-lightbox-root');
            if (lightbox) {
                lightbox.style.display = 'none';
                lightbox.innerHTML = '';
            }
        }

        changeModalQty(delta) {
            const newQty = Math.max(1, Math.min(20, (this.currentModalQty || 1) + delta));
            this.currentModalQty = newQty;
            
            const qtyVal = document.getElementById('sp-modal-qty-val');
            if (qtyVal) qtyVal.textContent = newQty;
            
            this._updateModalPricing();
        }

        selectModalVariant(variantId) {
            if (!this.currentModalProduct || !this.currentModalProduct.variants) return;
            const variant = this.currentModalProduct.variants.find(v => v.id === variantId);
            if (!variant) return;

            this.currentModalVariant = variant;
            
            // Actualizar nombre de variante seleccionada
            const nameEl = document.getElementById('sp-modal-variant-name');
            if (nameEl) nameEl.textContent = variant.name;

            // Actualizar clases activas en chips
            document.querySelectorAll('.sp-variant-chip').forEach(btn => {
                if (btn.getAttribute('data-vid') === variantId) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            this._updateModalPricing();
        }

        _updateModalPricing() {
            if (!this.currentModalProduct) return;
            const activePrice = this.currentModalVariant ? this.currentModalVariant.price : this.currentModalProduct.promoPrice;
            const activeOriginal = (this.currentModalVariant && this.currentModalVariant.originalPrice) ? this.currentModalVariant.originalPrice : this.currentModalProduct.originalPrice;
            const discount = activeOriginal > activePrice ? Math.round(((activeOriginal - activePrice) / activeOriginal) * 100) : 0;
            const savings = (activeOriginal - activePrice).toFixed(2);
            const total = (activePrice * (this.currentModalQty || 1)).toFixed(2);

            const priceDisplay = document.getElementById('sp-modal-price-display');
            if (priceDisplay) priceDisplay.textContent = activePrice.toFixed(2) + '€';

            const origDisplay = document.getElementById('sp-modal-original-price');
            if (origDisplay) origDisplay.textContent = activeOriginal.toFixed(2) + '€';

            const savingsDisplay = document.getElementById('sp-modal-savings-pill');
            if (savingsDisplay) {
                if (activeOriginal > activePrice) {
                    savingsDisplay.style.display = 'inline-flex';
                    savingsDisplay.textContent = `Ahorras ${savings}€ (-${discount}%)`;
                } else {
                    savingsDisplay.style.display = 'none';
                }
            }

            const bottomVal = document.getElementById('sp-bottom-total-val');
            if (bottomVal) bottomVal.textContent = total + '€';

            const bottomQtyTxt = document.getElementById('sp-bottom-qty-subtxt');
            if (bottomQtyTxt) {
                const q = this.currentModalQty || 1;
                bottomQtyTxt.textContent = `(${q} ud${q > 1 ? 's' : ''})`;
            }
        }

        switchDetailTab(tabId) {
            this.activeDetailTab = tabId;
            // Actualizar botones de pestañas
            document.querySelectorAll('.sp-tab-nav-btn').forEach(btn => {
                if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            // Actualizar paneles
            document.querySelectorAll('.sp-tab-panel').forEach(panel => {
                if (panel.id === `sp-panel-${tabId}`) panel.classList.add('active');
                else panel.classList.remove('active');
            });
        }

        toggleFavorite(productId) {
            const isFav = TiendaService.toggleFavorite(productId);
            const favBtn = document.getElementById(`sp-fav-btn-${productId}`);
            if (favBtn) {
                if (isFav) {
                    favBtn.classList.add('is-fav');
                    favBtn.innerHTML = '<i class="fas fa-heart text-danger"></i>';
                    favBtn.classList.add('heart-bounce');
                    setTimeout(() => favBtn.classList.remove('heart-bounce'), 600);
                    this.showToast('¡Guardado en tus favoritos de SomosPadel! ❤️');
                } else {
                    favBtn.classList.remove('is-fav');
                    favBtn.innerHTML = '<i class="far fa-heart"></i>';
                    this.showToast('Eliminado de tus favoritos');
                }
            }
        }

        addModalToCart() {
            if (!this.currentModalProduct) return;
            const qty = this.currentModalQty || 1;
            const ok = TiendaService.addToCart(this.currentModalProduct.id, qty);
            if (ok) {
                const btn = document.getElementById('sp-btn-add-modal');
                if (btn) {
                    btn.classList.add('sp-btn-added-success');
                    btn.innerHTML = '<i class="fas fa-check"></i> <span>¡Añadido a la Cesta!</span>';
                    setTimeout(() => {
                        if (btn) {
                            btn.classList.remove('sp-btn-added-success');
                            btn.innerHTML = '<i class="fas fa-cart-shopping"></i> <span>Añadir a la Cesta</span>';
                        }
                    }, 1600);
                }
                this.updateHeaderCartBadge();
                const detailBadge = document.getElementById('sp-detail-cart-badge');
                if (detailBadge) {
                    const s = TiendaService.getCartSummary();
                    detailBadge.textContent = s.count || 0;
                }
                this.showToast(`¡${this.currentModalProduct.name} añadido a tu cesta! 🛒`);
            }
        }

        orderModalWhatsApp() {
            if (!this.currentModalProduct) return;
            const p = this.currentModalProduct;
            const qty = this.currentModalQty || 1;
            const variant = this.currentModalVariant;
            const unitPrice = variant ? variant.price : p.promoPrice;
            const total = (unitPrice * qty).toFixed(2);

            let msg = `🎾 *CONSULTA / PEDIDO - SOMOSPADEL BCN* 🎾\n\n`;
            msg += `¡Hola equipo de SomosPadel Barcelona! Deseo pedir el siguiente producto:\n\n`;
            msg += `📦 *Producto:* ${p.name}\n`;
            msg += `🏷️ *Marca:* ${p.brand}\n`;
            if (variant) {
                msg += `⚙️ *Opción/Formato:* ${variant.name}\n`;
            }
            msg += `🔢 *Cantidad:* ${qty} ud(s)\n`;
            msg += `💰 *Precio Unitario:* ${unitPrice.toFixed(2)}€\n`;
            msg += `💎 *TOTAL A PAGAR:* ${total}€\n\n`;
            msg += `¿Está disponible para recogida en mi próxima americana o para envío? ¡Gracias!`;

            const phone = '34600000000';
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
            this.showToast('Abriendo WhatsApp para pedir producto 🎾');
        }

        escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        handleExternalClick(productId) {
            TiendaService.recordClick(productId);
            this.showToast('Redirigiendo a tienda oficial colaboradora...');
        }

        // ==========================================
        // COMPARTIR EN REDES SOCIALES
        // ==========================================
        shareWhatsApp(productId) {
            const payload = TiendaService.getSharePayload(productId);
            if (!payload) return;

            TiendaService.recordClick(productId);
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(payload.textWhatsApp)}`;
            window.open(url, '_blank');
            this.showToast('Abriendo WhatsApp para compartir oferta 🎾');
        }

        shareInstagram(productId) {
            const payload = TiendaService.getSharePayload(productId);
            if (!payload) return;

            TiendaService.recordClick(productId);
            // Copiar texto formateado listo para stories / bio
            if (navigator.clipboard) {
                navigator.clipboard.writeText(payload.textInstagram).then(() => {
                    this.showToast('¡Texto y enlace copiados para tu Instagram Story / Post! 📸');
                }).catch(() => {
                    this.showToast('Enlace listo para Instagram 📸');
                });
            } else {
                this.showToast('Enlace listo para Instagram 📸');
            }
            window.open('https://www.instagram.com', '_blank');
        }

        shareFacebook(productId) {
            const payload = TiendaService.getSharePayload(productId);
            if (!payload) return;

            TiendaService.recordClick(productId);
            window.open(payload.facebookUrl, '_blank', 'width=600,height=500');
            this.showToast('Abriendo Facebook para compartir producto 🎾');
        }

        copyProductLink(productId) {
            const payload = TiendaService.getSharePayload(productId);
            if (!payload) return;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(payload.productDeepLink).then(() => {
                    this.showToast('¡Enlace de producto copiado al portapapeles!');
                });
            } else {
                this.showToast(`Enlace: ${payload.productDeepLink}`);
            }
        }

        copyCoupon(code) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code).then(() => {
                    this.showToast(`¡Cupón "${code}" copiado al portapapeles! 🎟️`);
                });
            } else {
                this.showToast(`Cupón: ${code}`);
            }
        }

        // ==========================================
        // GESTIÓN DE PRODUCTOS Y PROVEEDORES
        // ==========================================
        openCreateProductModal() {
            const root = document.getElementById('sp-tienda-modal-root');
            if (root) {
                root.innerHTML = TiendaView.renderProductFormModal(null);
            }
        }

        openCreatePartnerModal() {
            const root = document.getElementById('sp-tienda-modal-root');
            if (root) {
                root.innerHTML = TiendaView.renderPartnerFormModal(null);
            }
        }

        openEditPartnerModal(partnerId) {
            const root = document.getElementById('sp-tienda-modal-root');
            if (root) {
                root.innerHTML = TiendaView.renderPartnerFormModal(partnerId);
            }
        }

        saveProductForm(e, productId) {
            e.preventDefault();
            const form = e.target;
            const productData = {
                id: productId || null,
                name: form.name.value,
                brand: form.brand.value,
                category: form.category.value,
                originalPrice: parseFloat(form.originalPrice.value) || 0,
                promoPrice: parseFloat(form.promoPrice.value) || 0,
                partnerId: form.partnerId.value,
                externalLink: form.externalLink.value,
                image: form.image.value,
                description: form.description.value,
                badges: ['Recomendado por SomosPadel'],
                featured: true
            };

            TiendaService.saveProduct(productData);
            this.closeModal();
            this.showToast('Producto guardado correctamente en la Tienda 🎾');
            TiendaView.render(this.containerId);
        }

        savePartnerForm(e, partnerId) {
            e.preventDefault();
            const form = e.target;
            const partnerData = {
                id: partnerId || null,
                name: form.name.value,
                logoText: form.logoText.value.toUpperCase() || 'SP',
                contactPerson: form.contactPerson.value,
                phone: form.phone.value,
                email: form.email.value,
                web: form.web.value,
                agreementType: form.agreementType.value,
                agreedCommission: form.agreedCommission.value,
                renewalDate: form.renewalDate.value,
                internalNotes: form.internalNotes.value
            };

            TiendaService.savePartner(partnerData);
            this.closeModal();
            this.showToast('Proveedor guardado correctamente');
            TiendaView.render(this.containerId);
        }

        simulateConversionPrompt() {
            const products = TiendaService.getProducts();
            if (!products.length) return;
            const p = products[0];
            TiendaService.recordConversion(p.id, p.promoPrice);
            this.showToast(`¡Venta de prueba registrada para ${p.name}! Comisión calculada y sumada.`);
            TiendaView.render(this.containerId);
        }

        showToast(message) {
            if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                window.NotificationService.showToast(message, 'success');
            } else if (window.PlayerView?.haptic) {
                window.PlayerView.haptic(20);
                this.renderInlineToast(message);
            } else {
                this.renderInlineToast(message);
            }
        }

        renderInlineToast(msg) {
            const existing = document.getElementById('sp-tienda-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = 'sp-tienda-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 90px;
                left: 50%;
                transform: translateX(-50%);
                background: #111827;
                border: 1.5px solid #CCFF00;
                color: #fff;
                padding: 12px 20px;
                border-radius: 14px;
                font-size: 0.85rem;
                font-weight: 800;
                box-shadow: 0 10px 25px rgba(0,0,0,0.6);
                z-index: 100000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: fadeIn 0.2s ease;
            `;
            toast.innerHTML = `<i class="fas fa-circle-check" style="color: #CCFF00;"></i> <span>${msg}</span>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3200);
        }

        destroy() {
            this.closeModal();
        }
    }

    return new TiendaControllerClass();
}));
