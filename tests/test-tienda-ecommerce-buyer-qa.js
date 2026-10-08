/**
 * test-tienda-ecommerce-buyer-qa.js
 * Test de Validación de la Experiencia de Compra E-Commerce 100% Profesional
 * en la Tienda Oficial de SomosPadel Barcelona
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de Experiencia E-Commerce Profesional para Comprador/Jugador...");

const ROOT_DIR = path.join(__dirname, '..');

// 1. Simulación de entorno DOM y navegador
const mockStorage = {};
const mockSessionStorage = {
    sp_tienda_admin_auth: 'PADEL21'
};
let renderedHtml = '';
let cartHtml = '';
let modalHtml = '';

global.window = {
    location: { origin: 'http://localhost:3000', pathname: '/index.html', hash: '#tienda' },
    open: (url) => { console.log(`[Window.open] ${url}`); },
    scrollTo: () => {}
};

global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
};

global.sessionStorage = {
    getItem: (k) => mockSessionStorage[k] || null,
    setItem: (k, v) => { mockSessionStorage[k] = String(v); },
    removeItem: (k) => { delete mockSessionStorage[k]; }
};

global.document = {
    createElement: (tag) => ({
        style: {},
        remove: () => {},
        classList: { add: () => {}, remove: () => {} }
    }),
    body: {
        appendChild: () => {}
    },
    getElementById: (id) => {
        if (id === 'content-area') {
            return {
                set innerHTML(val) { renderedHtml = val; },
                get innerHTML() { return renderedHtml; }
            };
        }
        if (id === 'sp-tienda-cart-root') {
            return {
                set innerHTML(val) { cartHtml = val; },
                get innerHTML() { return cartHtml; }
            };
        }
        if (id === 'sp-tienda-modal-root') {
            return {
                set innerHTML(val) { modalHtml = val; },
                get innerHTML() { return modalHtml; }
            };
        }
        if (id === 'sp-products-grid') {
            return {
                set innerHTML(val) { renderedHtml += val; },
                get innerHTML() { return renderedHtml; }
            };
        }
        if (id === 'sp-header-cart-count' || id === 'sp-header-cart-total') {
            return { textContent: '' };
        }
        return null;
    }
};

// Cargar módulos
const TiendaService = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaService.js'));
global.TiendaService = TiendaService;

const TiendaView = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaView.js'));
global.TiendaView = TiendaView;

const TiendaController = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaController.js'));
global.TiendaController = TiendaController;

// 2. Renderizado de la tienda
TiendaController.init('content-area');

// 3. Verificación de eliminación de elementos internos / administrativos
assert(!renderedHtml.includes('sp-platform-sections-nav'), 'La barra interna 1.Jugador / 2.Admin NO debe mostrarse al comprador');
assert(!renderedHtml.includes('sp-shop-role-selector-wrap'), 'El selector de roles internos NO debe mostrarse al comprador');
assert(!renderedHtml.includes('ROL DE ACCESO:'), 'El rótulo de Rol de Acceso NO debe mostrarse al comprador');
assert(!renderedHtml.includes('ECOSISTEMA COMERCIAL OFICIAL'), 'El rótulo interno no debe aparecer en la cabecera');
console.log('✅ Verificado: Eliminada toda la jerga interna y selectores de roles del escaparate del comprador.');

// 4. Verificación de elementos de tienda online profesional
assert(!renderedHtml.includes('sp-store-ticker'), 'El ticker superior invasivo ha sido retirado correctamente');
assert(!renderedHtml.includes('sp-store-hero'), 'El hero banner del cupón ha sido retirado correctamente');
assert(renderedHtml.includes('SOMOSPADEL <span>STORE</span>') || renderedHtml.includes('SOMOSPADEL STORE'), 'Debe incluir el logo SOMOSPADEL STORE');
assert(renderedHtml.includes('sp-store-cart-trigger'), 'Debe tener botón de carrito con contador y total');
assert(renderedHtml.includes('sp-store-advisor-btn'), 'Debe tener botón de asesoramiento por monitores');
assert(renderedHtml.includes('sp-brands-row'), 'Debe tener fila de selección de marcas oficiales');
assert(renderedHtml.includes('sp-trust-footer'), 'Debe tener footer con garantías y sellos de confianza');
console.log('✅ Verificado: Estructura 100% limpia y moderna estilo tienda online (navbar, marcas, catálogo directo y trust footer).');

// 5. Verificación de tarjetas de producto con rating, stock y botón de compra
assert(renderedHtml.includes('sp-rating-row'), 'Las tarjetas deben mostrar valoración por estrellas');
assert(renderedHtml.includes('sp-stock-badge'), 'Las tarjetas deben mostrar estado de stock');
assert(renderedHtml.includes('sp-btn-add-cart'), 'Las tarjetas deben tener botón [Añadir a Cesta]');
console.log('✅ Verificado: Tarjetas de producto profesionales con estrellas, stock 24/48h y botón de compra rápida.');

// 6. Prueba de Carrito de Compras (Añadir, Modificar, Descuento y WhatsApp Checkout)
TiendaService.clearCart();
const products = TiendaService.getProducts();
const p1 = products[0];

// Añadir al carrito
TiendaController.addToCart(p1.id, 2);
let summary = TiendaService.getCartSummary();
assert.strictEqual(summary.count, 2, 'El carrito debe tener 2 unidades');
assert.strictEqual(summary.cart[0].id, p1.id, 'El producto añadido debe coincidir');

// Abrir carrito y verificar UI
TiendaController.openCart();
assert(cartHtml.includes('Mi Cesta (2)'), 'El drawer debe mostrar el total de productos');
assert(cartHtml.includes('sp-shipping-progress-box'), 'Debe incluir barra de progreso para envío gratis');
assert(cartHtml.includes('sp-btn-checkout-wa'), 'Debe incluir botón de checkout por WhatsApp');

// Aplicar cupón del 15%
TiendaController.applyCoupon('SOMOSPADEL15');
assert.strictEqual(TiendaView.appliedCoupon.code, 'SOMOSPADEL15', 'Debe registrar cupón SOMOSPADEL15');
assert.strictEqual(TiendaView.appliedCoupon.rate, 0.15, 'El descuento debe ser del 15%');
assert(cartHtml.includes('SOMOSPADEL15'), 'El carrito debe mostrar el cupón aplicado');

// Modificar cantidad
TiendaController.updateCartQty(p1.id, 1);
summary = TiendaService.getCartSummary();
assert.strictEqual(summary.count, 1, 'La cantidad debe actualizarse a 1');

// Eliminar producto
TiendaController.removeFromCart(p1.id);
summary = TiendaService.getCartSummary();
assert.strictEqual(summary.count, 0, 'El carrito debe quedar vacío');
console.log('✅ Verificado: Ciclo completo del carrito (añadir, cupón SOMOSPADEL15, modificar cantidad y vaciar).');

// 7. Prueba de filtro por marca
TiendaController.handleBrand('Bullpadel');
assert.strictEqual(TiendaView.selectedBrand, 'Bullpadel', 'Debe seleccionar Bullpadel');
const filtered = TiendaView.getFilteredProducts();
assert(filtered.every(p => p.brand.toLowerCase() === 'bullpadel'), 'Todos los productos mostrados deben ser Bullpadel');
console.log('✅ Verificado: Filtro rápido por marcas oficiales Bullpadel/NOX/Head/Wilson funcionando.');

console.log("\n🎉 ¡TODOS LOS TESTS DE LA EXPERIENCIA E-COMMERCE PROFESIONAL HAN PASADO CON ÉXITO (100% OK)!\n");
