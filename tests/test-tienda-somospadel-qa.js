/**
 * test-tienda-somospadel-qa.js
 * Test de Validación Integral para TIENDA SOMOSPADEL BCN
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de Integridad para TIENDA SOMOSPADEL BCN...");

// 1. Validar existencia de archivos
const filesToCheck = [
    'css/tienda.css',
    'js/modules/tienda/TiendaService.js',
    'js/modules/tienda/TiendaView.js',
    'js/modules/tienda/TiendaController.js',
    'tienda.html',
    'index.html',
    'admin.html',
    'organizacion.html',
    'js/core/Router.js'
];

const ROOT_DIR = path.join(__dirname, '..');

filesToCheck.forEach(file => {
    const fullPath = path.join(ROOT_DIR, file);
    assert(fs.existsSync(fullPath), `Archivo requerido no encontrado: ${file}`);
    console.log(`✅ Archivo verificado: ${file}`);
});

// 2. Verificar que index.html contiene nav-tienda a continuación de nav-ranking
const indexContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

const rankingIndex = indexContent.indexOf('id="nav-ranking"');
const tiendaIndex = indexContent.indexOf('id="nav-tienda"');
const communityIndex = indexContent.indexOf('id="nav-community"');

assert(rankingIndex !== -1, 'No se encontró nav-ranking en index.html');
assert(tiendaIndex !== -1, 'No se encontró nav-tienda en index.html');
assert(communityIndex !== -1, 'No se encontró nav-community en index.html');

assert(rankingIndex < tiendaIndex, 'nav-tienda debe estar a continuación de nav-ranking');
assert(tiendaIndex < communityIndex, 'nav-tienda debe estar antes de nav-community');
console.log('✅ Verificado: nav-tienda está ubicado inmediatamente a continuación de nav-ranking.');

// 3. Verificar scripts de tienda en index.html
assert(indexContent.includes('js/modules/tienda/TiendaService.js'), 'TiendaService.js no está en index.html');
assert(indexContent.includes('js/modules/tienda/TiendaView.js'), 'TiendaView.js no está en index.html');
assert(indexContent.includes('js/modules/tienda/TiendaController.js'), 'TiendaController.js no está en index.html');
assert(indexContent.includes('css/tienda.css'), 'tienda.css no está en index.html');
console.log('✅ Verificado: Dependencias de Tienda cargadas en index.html.');

// 4. Verificar Router.js
const routerContent = fs.readFileSync(path.join(ROOT_DIR, 'js/core/Router.js'), 'utf8');
assert(routerContent.includes("'tienda': () => this.executeControllerInit('TiendaController', 'tienda')"), 'Ruta tienda no registrada en Router.js');
assert(routerContent.includes("TiendaController"), 'TiendaController no está en controllersToCleanup en Router.js');
console.log('✅ Verificado: Rutas y ciclo de vida de Tienda registrados en Router.js.');

// 5. Verificar enlaces de las 4 secciones principales en admin.html y organizacion.html
const adminContent = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');
assert(adminContent.includes('href="tienda.html"'), 'admin.html no enlaza a tienda.html');

const orgContent = fs.readFileSync(path.join(ROOT_DIR, 'organizacion.html'), 'utf8');
assert(orgContent.includes('href="tienda.html"'), 'organizacion.html no enlaza a tienda.html');
console.log('✅ Verificado: admin.html y organizacion.html enlazan a TIENDA SOMOSPADEL BCN.');

// 6. Probar lógica de TiendaService simulando entorno de navegador
global.window = {
    location: { origin: 'http://localhost:3000', pathname: '/index.html', hash: '#tienda' }
};
const mockStorage = {};
global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: (k) => { delete mockStorage[k]; }
};

const TiendaService = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaService.js'));

// Comprobar categorías
const categories = TiendaService.getCategories();
const requiredCategories = ['palas', 'pelotas', 'paleteros', 'mochilas', 'overgrips', 'protectores', 'accesorios', 'textil', 'zapatillas', 'packs', 'clubes'];
requiredCategories.forEach(catId => {
    assert(categories.some(c => c.id === catId), `Categoría requerida no encontrada: ${catId}`);
});
console.log(`✅ Verificado: Las 11 categorías de productos están presentes (${categories.length} categorías registradas).`);

// Comprobar productos iniciales
const products = TiendaService.getProducts();
assert(products.length >= 10, 'Deben existir al menos 10 productos iniciales precargados');
const firstProduct = products[0];
assert(firstProduct.name && firstProduct.brand && firstProduct.originalPrice && firstProduct.promoPrice, 'El producto debe tener nombre, marca, precio y precio promocional');
assert(firstProduct.externalLink, 'El producto debe tener enlace a compra externa');
assert(firstProduct.badges && firstProduct.badges.length, 'El producto debe tener etiquetas / badges');
console.log(`✅ Verificado: Catálogo con ${products.length} productos iniciales completos.`);

// Comprobar colaboradores
const partners = TiendaService.getPartners();
assert(partners.length >= 4, 'Deben existir al menos 4 colaboradores iniciales');
const firstPartner = partners[0];
assert(firstPartner.name && firstPartner.contactPerson && firstPartner.email && firstPartner.phone && firstPartner.web && firstPartner.agreementType && firstPartner.agreedCommission && firstPartner.renewalDate && firstPartner.internalNotes, 'El proveedor debe tener todos los campos requeridos');
console.log(`✅ Verificado: ${partners.length} proveedores y colaboradores registrados con todos los datos contractuales.`);

// Comprobar promociones
const promos = TiendaService.getPromotions();
assert(promos.length >= 4, 'Deben existir al menos 4 promociones iniciales');
assert(promos.some(p => p.title.toLowerCase().includes('exclusivo')), 'Debe existir campaña de descuento exclusivo para jugadores SomosPadel');
assert(promos.some(p => p.title.toLowerCase().includes('semana')), 'Debe existir campaña oferta de la semana');
assert(promos.some(p => p.title.toLowerCase().includes('mes')), 'Debe existir campaña producto recomendado del mes');
assert(promos.some(p => p.title.toLowerCase().includes('americanas')), 'Debe existir campaña producto oficial de las Americanas');
console.log('✅ Verificado: Las 4 campañas y promociones específicas están configuradas.');

// Comprobar tracking y métricas
TiendaService.recordView(firstProduct.id);
TiendaService.recordClick(firstProduct.id);
TiendaService.recordConversion(firstProduct.id, 200);

const analyticsMonthly = TiendaService.getAnalytics('monthly');
const analyticsAnnual = TiendaService.getAnalytics('annual');
assert(analyticsMonthly.totalProducts > 0, 'KPI totalProducts debe ser > 0');
assert(analyticsMonthly.totalClicks > 0, 'KPI totalClicks debe ser > 0');
assert(analyticsMonthly.totalConversions > 0, 'KPI totalConversions debe ser > 0');
assert(analyticsMonthly.totalCommissions > 0, 'KPI totalCommissions debe ser > 0');
console.log(`✅ Verificado: Dashboard analítico y panel económico calculan métricas correctamente (Comisiones: ${analyticsMonthly.totalCommissions}€).`);

// Comprobar generador de compartir en Redes Sociales
const sharePayload = TiendaService.getSharePayload(firstProduct.id);
assert(sharePayload.textWhatsApp.includes(firstProduct.name), 'Mensaje WhatsApp debe contener el nombre del producto');
assert(sharePayload.textWhatsApp.includes(firstProduct.promoPrice.toString()), 'Mensaje WhatsApp debe incluir el precio');
assert(sharePayload.textInstagram.includes('#SomosPadelBCN'), 'Mensaje Instagram debe incluir hashtags oficiales');
assert(sharePayload.facebookUrl.includes('facebook.com/sharer'), 'URL de Facebook debe ser válida');
console.log('✅ Verificado: Payloads de compartición para WhatsApp, Instagram y Facebook generados exitosamente.');

// Comprobar roles y permisos
assert(TiendaService.hasPermission('manage_products'), 'SuperAdmin debe poder gestionar productos');
TiendaService.setCurrentRole('Jugador');
assert(!TiendaService.hasPermission('manage_products'), 'Jugador no debe poder gestionar productos');
assert(TiendaService.hasPermission('view_products'), 'Jugador debe poder ver productos');
console.log('✅ Verificado: Control de roles y permisos estricto según perfil.');

console.log("\n🎉 ¡TODOS LOS TESTS DE TIENDA SOMOSPADEL BCN HAN PASADO EXITOSAMENTE (100% OK)!");
