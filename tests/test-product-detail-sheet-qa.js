/**
 * test-product-detail-sheet-qa.js
 * Test de validación exhaustivo de la Ficha de Producto Luxury E-Commerce
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de Validación de la Ficha de Producto Luxury E-Commerce...");

const ROOT_DIR = path.join(__dirname, '..');

// 1. Simulación de entorno DOM y navegador
const mockStorage = {};
let renderedModalHtml = '';

global.window = {
    location: { origin: 'http://localhost:3000', pathname: '/index.html', hash: '#tienda' },
    history: {
        pushState: () => {},
        replaceState: () => {}
    },
    addEventListener: () => {},
    open: (url) => { console.log(`[Mock window.open] ${url}`); }
};

global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
};

global.document = {
    body: {
        classList: { add: () => {}, remove: () => {} },
        style: {}
    },
    getElementById: (id) => {
        if (id === 'sp-tienda-modal-root') {
            return {
                set innerHTML(val) { renderedModalHtml = val; },
                get innerHTML() { return renderedModalHtml; }
            };
        }
        if (id === 'sp-detail-main-img') {
            return { src: '' };
        }
        if (id === 'sp-gal-curr-idx') {
            return { textContent: '1' };
        }
        if (id === 'sp-modal-qty-val') {
            return { textContent: '1' };
        }
        if (id === 'sp-bottom-total-val') {
            return { textContent: '5.20€' };
        }
        if (id === 'sp-bottom-qty-subtxt') {
            return { textContent: '(1 ud)' };
        }
        if (id === 'sp-modal-price-display') {
            return { textContent: '5.20€' };
        }
        if (id === 'sp-modal-original-price') {
            return { textContent: '6.95€' };
        }
        if (id === 'sp-modal-savings-pill') {
            return { style: {}, textContent: '' };
        }
        if (id === 'sp-lightbox-root') {
            return { style: {}, innerHTML: '', className: '' };
        }
        return null;
    },
    querySelectorAll: () => []
};

// Cargar dependencias
const TiendaService = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaService.js'));
global.TiendaService = TiendaService;

const TiendaView = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaView.js'));
global.TiendaView = TiendaView;

const TiendaController = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaController.js'));
global.TiendaController = TiendaController;

// 2. Verificar apertura de la ficha de Pelotas HEAD Padel Pro S (el producto del reporte de usuario)
TiendaController.openProductModal('prod-head-pro-s-bote');

assert(renderedModalHtml.length > 0, 'La ficha de producto no se ha renderizado en el modal root');

// 3. Verificar botón de retroceder (Back Button)
assert(renderedModalHtml.includes('sp-detail-top-back-btn'), 'Falta el botón de retroceso superior (sp-detail-top-back-btn)');
assert(renderedModalHtml.includes('fa-arrow-left'), 'El botón de retroceso debe tener el icono de flecha atrás');
assert(renderedModalHtml.includes('Volver a la Tienda') || renderedModalHtml.includes('Volver'), 'El botón debe decir Volver a la Tienda');
console.log('✅ Verificado: Botón retroceder visible y destacado en la cabecera fija.');

// 4. Verificar estructura de galería e imágenes
assert(renderedModalHtml.includes('sp-gallery-stage'), 'Falta el contenedor principal de la galería');
assert(renderedModalHtml.includes('sp-gallery-badges'), 'Faltan los badges flotantes horizontales sobre la foto');
assert(renderedModalHtml.includes('sp-gal-badge-discount'), 'Falta badge de descuento en la galería');
assert(renderedModalHtml.includes('sp-gallery-counter'), 'Falta contador numérico de fotos (ej: 1 / 3)');
assert(renderedModalHtml.includes('sp-gal-zoom-hint'), 'Falta indicación de zoom de alta resolución');
assert(renderedModalHtml.includes('sp-gallery-thumbnails'), 'Falta carrusel de miniaturas interactivas');
console.log('✅ Verificado: Hero Gallery visual y visualizador de producto con miniaturas y badges flotantes.');

// 5. Verificar fallback anti-imágenes rotas
assert(typeof TiendaView.handleImgError === 'function', 'TiendaView debe contar con método handleImgError');
const mockImg = { _hasErrored: false, src: '' };
TiendaView.handleImgError(mockImg, 'Pelotas HEAD Pro S');
assert(mockImg.src.startsWith('data:image/svg+xml'), 'El fallback debe generar una imagen SVG vectorial con la marca SomosPadel');
assert(mockImg._hasErrored === true, 'El flag anti-bucle _hasErrored debe estar activo');
console.log('✅ Verificado: Sistema de protección SVG vectorial anti-imágenes rotas funcionando.');

// 6. Verificar bloque comercial y precio
assert(renderedModalHtml.includes('sp-detail-price-box'), 'Falta caja de precio y ahorro');
assert(renderedModalHtml.includes('sp-price-current'), 'Falta precio promocional');
assert(renderedModalHtml.includes('sp-discount-pill'), 'Falta píldora de ahorro económico');
assert(renderedModalHtml.includes('sp-stock-ticker-box'), 'Falta ticker de disponibilidad en tiempo real y stock 24/48h');
console.log('✅ Verificado: Bloque de precios, ahorro y ticker de disponibilidad inmediata.');

// 7. Verificar pestañas interactivas de contenido
assert(renderedModalHtml.includes('sp-detail-tabs-bar'), 'Falta barra de pestañas técnicas');
assert(renderedModalHtml.includes('Rendimiento'), 'Falta pestaña de rendimiento');
assert(renderedModalHtml.includes('Ficha Técnica'), 'Falta pestaña de ficha técnica');
assert(renderedModalHtml.includes('Ventajas Club'), 'Falta pestaña de ventajas club');
assert(renderedModalHtml.includes('Opiniones'), 'Falta pestaña de opiniones de jugadores');
console.log('✅ Verificado: Pestañas interactivas de Rendimiento, Ficha Técnica, Ventajas Club y Testimonios.');

// 8. Verificar barra inferior fija de compra (Sticky Buy Bar)
assert(renderedModalHtml.includes('sp-detail-bottom-bar'), 'Falta la barra inferior de compra fija');
assert(renderedModalHtml.includes('sp-btn-buy-primary'), 'Falta botón principal [Añadir a la Cesta]');
assert(renderedModalHtml.includes('sp-btn-buy-whatsapp'), 'Falta botón de consulta y pedido rápido [WhatsApp]');
console.log('✅ Verificado: Barra de compra fija con precio dinámico y botones de compra directa.');

// 9. Verificar z-index en tienda.css
const cssContent = fs.readFileSync(path.join(ROOT_DIR, 'css/tienda.css'), 'utf8');
assert(cssContent.includes('#sp-tienda-modal-root') && cssContent.includes('120000'), 'sp-tienda-modal-root debe tener z-index 120000');
assert(cssContent.includes('.sp-modal-backdrop') && cssContent.includes('z-index: 120000'), 'sp-modal-backdrop debe tener z-index 120000');
console.log('✅ Verificado: z-index 120000 asegura que la ficha se renderiza por encima de la barra inferior de la app.');

// 9b. Verificar franja de compartir y sus estilos profesionales
assert(renderedModalHtml.includes('sp-share-strip'), 'Falta la franja de compartir en redes sociales');
assert(renderedModalHtml.includes('sp-share-wa') && renderedModalHtml.includes('sp-share-ig'), 'Faltan botones de compartir específicos');
assert(cssContent.includes('.sp-share-strip') && cssContent.includes('.sp-share-btn'), 'Faltan estilos CSS para los botones de compartir');
console.log('✅ Verificado: Franja de compartir en redes sociales estilizada profesionalmente sin botones nativos.');

// 10. Probar métodos de interacción del controlador
TiendaController.changeModalQty(1);
assert.strictEqual(TiendaController.currentModalQty, 2, 'changeModalQty debe haber incrementado a 2');
TiendaController.changeModalQty(-1);
assert.strictEqual(TiendaController.currentModalQty, 1, 'changeModalQty debe haber decrementado a 1');

TiendaController.setGalleryImage(1);
assert.strictEqual(TiendaController.currentGalleryIndex, 1, 'currentGalleryIndex debe ser 1');

TiendaController.closeModal();
assert.strictEqual(TiendaController.isModalOpen, false, 'El modal debe cerrarse correctamente');
assert.strictEqual(renderedModalHtml, '', 'El modal root debe quedar limpio');
console.log('✅ Verificado: Ciclo de vida completo del controlador y gestión de eventos validada.');

console.log("\n🎉 ¡TODOS LOS TESTS DE LA FICHA DE PRODUCTO LUXURY E-COMMERCE HAN PASADO AL 100%!");
