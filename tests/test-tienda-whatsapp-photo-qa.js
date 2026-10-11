/**
 * test-tienda-whatsapp-photo-qa.js
 * Test de Calidad & Verificación Específica:
 * WhatsApp con Fotos y Metadatos en la Tienda Oficial de SomosPadel BCN
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de QA: WhatsApp con Fotos y Metadatos en Tienda SomosPadel BCN...\n");

const ROOT_DIR = path.join(__dirname, '..');

// ============================================================
// 1. Simulación de entorno DOM y navegador
// ============================================================
const mockStorage = {};
const mockSessionStorage = {
    sp_tienda_admin_auth: 'PADEL21'
};

let lastOpenedUrl = null;
let lastOpenedTarget = null;
let lastSharedPayload = null;
let toasts = [];

global.window = {
    location: {
        origin: 'https://somospadel.eu',
        pathname: '/tienda.html',
        search: '',
        hash: '#tienda'
    },
    open: (url, target) => {
        lastOpenedUrl = url;
        lastOpenedTarget = target;
    },
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

// Cargar módulos
const TiendaService = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaService.js'));
global.TiendaService = TiendaService;

const TiendaView = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaView.js'));
global.TiendaView = TiendaView;

const TiendaController = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaController.js'));
global.TiendaController = TiendaController;

// Mock showToast para verificar feedbacks al usuario
TiendaController.showToast = (msg) => {
    toasts.push(msg);
};

// ============================================================
// 2. PRUEBAS DE TiendaService.getAbsolutePath
// ============================================================
console.log("📦 [1/5] Verificando TiendaService.getAbsolutePath...");

// 2.1 Fallback por defecto en caso de valor nulo, vacío o undefined
const defaultFallback = TiendaService.getAbsolutePath(null);
const defaultFallbackEmpty = TiendaService.getAbsolutePath('');
const defaultFallbackUndefined = TiendaService.getAbsolutePath(undefined);

assert.strictEqual(defaultFallback, 'https://somospadel.eu/img/logo_somospadel.png', 'Fallback nulo debe ser el logo oficial');
assert.strictEqual(defaultFallbackEmpty, 'https://somospadel.eu/img/logo_somospadel.png', 'Fallback vacío debe ser el logo oficial');
assert.strictEqual(defaultFallbackUndefined, 'https://somospadel.eu/img/logo_somospadel.png', 'Fallback undefined debe ser el logo oficial');
console.log("  ✅ Fallback por defecto correcto ante valores nulos o vacíos.");

// 2.2 URLs absolutas existentes deben mantenerse intactas (http / https)
const httpsUrl = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80';
const httpUrl = 'http://cdn.somospadelbcn.com/material/pala-hack.jpg';

assert.strictEqual(TiendaService.getAbsolutePath(httpsUrl), httpsUrl, 'URL HTTPS absoluta debe preservarse íntegra');
assert.strictEqual(TiendaService.getAbsolutePath(httpUrl), httpUrl, 'URL HTTP absoluta debe preservarse íntegra');
console.log("  ✅ Preservación de URLs absolutas externas (HTTPS y HTTP).");

// 2.3 Resolución de rutas relativas con y sin barra inicial
const relPathWithSlash = '/img/productos/overgrips.png';
const relPathWithoutSlash = 'img/productos/bullpadel-hack.png';

const resolvedSlash = TiendaService.getAbsolutePath(relPathWithSlash);
const resolvedNoSlash = TiendaService.getAbsolutePath(relPathWithoutSlash);

assert.strictEqual(resolvedSlash, 'https://somospadel.eu/img/productos/overgrips.png', 'Debe concatenar el origen con la ruta sin duplicar barras');
assert.strictEqual(resolvedNoSlash, 'https://somospadel.eu/img/productos/bullpadel-hack.png', 'Debe concatenar el origen con la ruta relativa');
console.log("  ✅ Resolución correcta de rutas relativas locales a URL absoluta.");

// ============================================================
// 3. PRUEBAS DE TiendaService.getSharePayload
// ============================================================
console.log("\n📲 [2/5] Verificando TiendaService.getSharePayload...");

const products = TiendaService.getProducts();
assert(products && products.length > 0, 'Debe haber productos disponibles');
const sampleProduct = products[0];

const payload = TiendaService.getSharePayload(sampleProduct.id);
assert(payload, 'El payload de compartición no debe ser nulo');

// Verificar productImageUrl
assert(payload.productImageUrl, 'El payload debe contener productImageUrl');
assert(/^https?:\/\//i.test(payload.productImageUrl), 'productImageUrl debe ser una URL absoluta válida');
assert.strictEqual(payload.productImageUrl, TiendaService.getAbsolutePath(sampleProduct.image), 'productImageUrl debe coincidir con TiendaService.getAbsolutePath');
console.log(`  ✅ productImageUrl validado: ${payload.productImageUrl}`);

// Verificar deep link funcional
assert(payload.productDeepLink, 'El payload debe contener productDeepLink');
assert(payload.productDeepLink.includes(`producto=${sampleProduct.id}`), 'El deep link debe contener el parámetro del producto');
console.log(`  ✅ productDeepLink validado: ${payload.productDeepLink}`);

// Verificar textWhatsApp con sección de foto
assert(payload.textWhatsApp, 'El payload debe contener textWhatsApp');
assert(payload.textWhatsApp.includes('📸 *Foto del producto:*'), 'textWhatsApp debe incluir encabezado "📸 *Foto del producto:*"');
assert(payload.textWhatsApp.includes(payload.productImageUrl), 'textWhatsApp debe incluir la URL directa de la foto del producto');
assert(payload.textWhatsApp.includes(sampleProduct.name), 'textWhatsApp debe contener el nombre del producto');
assert(payload.textWhatsApp.includes(sampleProduct.brand), 'textWhatsApp debe contener la marca del producto');
assert(payload.textWhatsApp.includes(String(sampleProduct.promoPrice)), 'textWhatsApp debe contener el precio promocional');
console.log("  ✅ textWhatsApp incluye 📸 *Foto del producto:*, URL de imagen, datos y deep link.");

// Caso borde: producto inexistente
const nullPayload = TiendaService.getSharePayload('producto-inexistente-xyz');
assert.strictEqual(nullPayload, null, 'getSharePayload con ID inválido debe retornar null de forma segura');
console.log("  ✅ Manejo seguro ante ID de producto inexistente.");

// ============================================================
// 4. PRUEBAS DE TiendaController.orderModalWhatsApp
// ============================================================
console.log("\n💬 [3/5] Verificando TiendaController.orderModalWhatsApp...");

// 4.1 Simular modal abierto con producto base (sin variante)
lastOpenedUrl = null;
toasts = [];
TiendaController.currentModalProduct = sampleProduct;
TiendaController.currentModalQty = 2;
TiendaController.currentModalVariant = null;

TiendaController.orderModalWhatsApp();

assert(lastOpenedUrl, 'window.open debe haber sido invocado');
assert.strictEqual(lastOpenedTarget, '_blank', 'Debe abrirse en una pestaña nueva (_blank)');

const parsedUrl = new URL(lastOpenedUrl);
assert.strictEqual(parsedUrl.hostname, 'api.whatsapp.com', 'Debe dirigirse a api.whatsapp.com');

const settings = TiendaService.getSettings();
const expectedPhone = (settings && settings.whatsappPhone) || '34623456789';
assert.strictEqual(parsedUrl.searchParams.get('phone'), expectedPhone, `El teléfono de destino debe ser el oficial (${expectedPhone})`);

const decodedText = parsedUrl.searchParams.get('text');
assert(decodedText, 'El parámetro text debe contener el mensaje codificado');
assert(decodedText.includes(sampleProduct.name), 'El mensaje debe incluir el nombre del producto');
assert(decodedText.includes(sampleProduct.brand), 'El mensaje debe incluir la marca del producto');
assert(decodedText.includes('2 ud(s)'), 'El mensaje debe reflejar la cantidad seleccionada');
const expectedUnit = sampleProduct.promoPrice.toFixed(2);
const expectedTotal = (sampleProduct.promoPrice * 2).toFixed(2);
assert(decodedText.includes(`${expectedUnit}€`), `El mensaje debe incluir el precio unitario (${expectedUnit}€)`);
assert(decodedText.includes(`${expectedTotal}€`), `El mensaje debe incluir el total (${expectedTotal}€)`);
assert(decodedText.includes('📸 *Foto del producto:*'), 'El mensaje debe incluir la sección "📸 *Foto del producto:*"');
assert(decodedText.includes(TiendaService.getAbsolutePath(sampleProduct.image)), 'El mensaje debe incluir la URL de la foto');
assert(decodedText.includes('🔗 *Ver producto en Tienda:*'), 'El mensaje debe incluir "🔗 *Ver producto en Tienda:*"');
assert(toasts.some(t => t.includes('WhatsApp')), 'Debe mostrar toast de confirmación al usuario');
console.log("  ✅ Pedido estándar por WhatsApp verificado (teléfono, datos, precios, foto y deep link).");

// 4.2 Simular modal con variante de producto (ej. talla o formato)
lastOpenedUrl = null;
TiendaController.currentModalQty = 1;
TiendaController.currentModalVariant = {
    id: 'var-talla-l',
    name: 'Talla L / 38mm',
    price: 89.50
};

TiendaController.orderModalWhatsApp();
const parsedVariantUrl = new URL(lastOpenedUrl);
const decodedVariantText = parsedVariantUrl.searchParams.get('text');
assert(decodedVariantText.includes('⚙️ *Opción/Formato:* Talla L / 38mm'), 'El mensaje debe incluir la variante seleccionada');
assert(decodedVariantText.includes('89.50€'), 'El mensaje debe reflejar el precio de la variante');
console.log("  ✅ Pedido con variante/opción personalizada reflejado correctamente en el mensaje.");

// ============================================================
// 5. PRUEBAS DE TiendaController.shareWhatsApp (Web Share API & Fallback)
// ============================================================
console.log("\n🔄 [4/5] Verificando TiendaController.shareWhatsApp...");

(async () => {
    // 5.1 Caso A: Web Share API Nivel 2 compatible con archivos nativos
    let shareCalledWith = null;
    const mockNavigatorShare = {
        canShare: (data) => Boolean(data && data.files && data.files.length),
        share: async (data) => {
            shareCalledWith = data;
            return Promise.resolve();
        }
    };
    Object.defineProperty(global, 'navigator', {
        value: mockNavigatorShare,
        configurable: true,
        writable: true
    });

    // Mock getProductImageFile simulando generación de File
    const originalGetProductImageFile = TiendaService.getProductImageFile;
    TiendaService.getProductImageFile = async (product) => {
        return {
            name: `${product.id}.jpg`,
            type: 'image/jpeg',
            size: 1024
        };
    };

    lastOpenedUrl = null;
    toasts = [];

    await TiendaController.shareWhatsApp(sampleProduct.id);

    assert(shareCalledWith, 'navigator.share debió ser invocado');
    assert.strictEqual(shareCalledWith.title, `${sampleProduct.brand} - ${sampleProduct.name}`, 'El título compartido debe coincidir');
    assert(shareCalledWith.text.includes('📸 *Foto del producto:*'), 'El texto en share debe contener la foto');
    assert(shareCalledWith.files && shareCalledWith.files.length === 1, 'Debe adjuntar el archivo de imagen nativo');
    assert.strictEqual(lastOpenedUrl, null, 'No debe recurrir a window.open si Web Share tuvo éxito');
    assert(toasts.some(t => t.includes('Compartido con foto exitosamente')), 'Debe mostrar toast de éxito con foto');
    console.log("  ✅ Caso Web Share API con archivos nativos: Ejecutado exitosamente con adjunto.");

    // 5.2 Caso B: Fallback (Desktop o navegadores sin canShare de archivos)
    const mockNavigatorFallback = {
        canShare: () => false,
        share: undefined
    };
    Object.defineProperty(global, 'navigator', {
        value: mockNavigatorFallback,
        configurable: true,
        writable: true
    });
    lastOpenedUrl = null;
    toasts = [];

    await TiendaController.shareWhatsApp(sampleProduct.id);

    assert(lastOpenedUrl, 'En ausencia de Web Share API debe utilizar el fallback window.open');
    const fallbackUrl = new URL(lastOpenedUrl);
    assert.strictEqual(fallbackUrl.hostname, 'api.whatsapp.com', 'El fallback debe invocar api.whatsapp.com');
    const fallbackText = fallbackUrl.searchParams.get('text');
    assert(fallbackText.includes('📸 *Foto del producto:*'), 'El fallback debe incluir la foto');
    assert(fallbackText.includes(TiendaService.getAbsolutePath(sampleProduct.image)), 'El fallback debe incluir la URL de la imagen');
    assert(toasts.some(t => t.includes('Abriendo WhatsApp para compartir oferta con foto')), 'Debe mostrar toast de fallback');
    console.log("  ✅ Caso Fallback URL: Redirección a api.whatsapp.com con mensaje y foto verificado.");

    // Restaurar método original
    TiendaService.getProductImageFile = originalGetProductImageFile;

    // ============================================================
    // 6. PRUEBAS DE META ETIQUETAS EN tienda.html
    // ============================================================
    console.log("\n🏷️ [5/5] Verificando Meta Etiquetas Open Graph y Twitter Cards en tienda.html...");

    const tiendaHtmlPath = path.join(ROOT_DIR, 'tienda.html');
    assert(fs.existsSync(tiendaHtmlPath), 'El archivo tienda.html debe existir');
    const tiendaHtml = fs.readFileSync(tiendaHtmlPath, 'utf8');

    // Validar etiquetas Open Graph
    assert(tiendaHtml.includes('<meta property="og:type" content="product">'), 'Debe existir meta property="og:type" con valor "product"');
    console.log('  ✅ <meta property="og:type" content="product"> presente.');

    assert(tiendaHtml.includes('property="og:title"'), 'Debe existir meta property="og:title"');
    assert(tiendaHtml.includes('property="og:description"'), 'Debe existir meta property="og:description"');
    console.log('  ✅ <meta property="og:title"> y <meta property="og:description"> presentes.');

    assert(tiendaHtml.includes('property="og:image"'), 'Debe existir meta property="og:image"');
    assert(tiendaHtml.includes('property="og:image:secure_url"'), 'Debe existir meta property="og:image:secure_url"');
    console.log('  ✅ <meta property="og:image"> y <meta property="og:image:secure_url"> presentes.');

    // Validar Twitter Cards
    assert(tiendaHtml.includes('<meta name="twitter:card" content="summary_large_image">'), 'Debe existir twitter:card "summary_large_image"');
    assert(tiendaHtml.includes('name="twitter:image"'), 'Debe existir meta name="twitter:image"');
    console.log('  ✅ <meta name="twitter:card"> y <meta name="twitter:image"> presentes.');

    // Validar presencia del script de actualización dinámica updateProductOpenGraph
    assert(tiendaHtml.includes('updateProductOpenGraph'), 'tienda.html debe contener la función updateProductOpenGraph');
    assert(tiendaHtml.includes('window.TiendaService.getAbsolutePath(prod.image)'), 'updateProductOpenGraph debe usar TiendaService.getAbsolutePath para asegurar URL canónica');
    console.log('  ✅ Función updateProductOpenGraph presente con soporte para imagen canónica de producto.');

    console.log("\n============================================================");
    console.log("🎉 ¡TODOS LOS TESTS DE WHATSAPP CON FOTO Y METADATOS HAN PASADO AL 100%!");
    console.log("============================================================\n");
})();
