/**
 * test-tienda-subnav-teal-qa.js
 * Test de validación y control de calidad para el submenú horizontal superior
 * de color verde azulado (Teal / Aguamarina Luxury) en la sección TIENDA.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🚀 Iniciando Test de Verificación del Submenú Verde Azulado de TIENDA...');

// 1. Verificar index.html
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
assert(indexHtml.includes('subnav-theme-tienda'), 'index.html no define el tema subnav-theme-tienda');
assert(indexHtml.includes('.tienda-submenu-pro-bar'), 'index.html no define .tienda-submenu-pro-bar');
assert(indexHtml.includes('renderTienda: function'), 'window.SubnavManager no implementa renderTienda');
assert(indexHtml.includes('linear-gradient(135deg, #0d9488'), 'index.html no usa el degradado verde azulado solicitado');
assert(indexHtml.includes('#2dd4bf'), 'index.html no usa los acentos verde azulado neón (#2dd4bf)');

// Verificar las 10 opciones en index.html
const expectedTabs = [
    'CATÁLOGO', 'PALAS', 'PELOTAS', 'PALETEROS', 'MOCHILAS',
    'ZAPATILLAS', 'TEXTIL', 'PACKS AHORRO', 'SUPER OFERTAS', 'MI CESTA'
];
expectedTabs.forEach(tab => {
    assert(indexHtml.includes(tab), `El submenú de index.html no contiene la opción ${tab}`);
});
console.log('✅ Verificado: index.html contiene subnav-theme-tienda, renderTienda y las 10 opciones clave.');

// 2. Verificar css/tienda.css
const tiendaCss = fs.readFileSync(path.join(ROOT_DIR, 'css/tienda.css'), 'utf8');
assert(tiendaCss.includes('.subnav-app-bar.subnav-theme-tienda'), 'css/tienda.css no define .subnav-theme-tienda');
assert(tiendaCss.includes('.tienda-submenu-pro-bar'), 'css/tienda.css no define .tienda-submenu-pro-bar');
assert(tiendaCss.includes('#0d9488'), 'css/tienda.css no incluye el color base verde azulado');
assert(tiendaCss.includes('.badge-teal-fire'), 'css/tienda.css no incluye el micro-badge badge-teal-fire');
console.log('✅ Verificado: css/tienda.css estiliza la barra y las píldoras en verde azulado luxury.');

// 3. Verificar tienda.html
const tiendaHtml = fs.readFileSync(path.join(ROOT_DIR, 'tienda.html'), 'utf8');
assert(tiendaHtml.includes('id="subnav-app-bar"'), 'tienda.html no contiene el contenedor #subnav-app-bar');
assert(tiendaHtml.includes('subnav-theme-tienda'), 'tienda.html no contiene la clase subnav-theme-tienda');
assert(tiendaHtml.includes('SubnavManager.renderTienda'), 'tienda.html no ejecuta renderTienda al inicio');
console.log('✅ Verificado: tienda.html incluye el submenú horizontal superior sincronizado.');

// 4. Verificar Router.js
const routerJs = fs.readFileSync(path.join(ROOT_DIR, 'js/core/Router.js'), 'utf8');
assert(routerJs.includes("const isTienda = ['tienda', 'shop'].includes(newRoute);"), 'Router.js no define isTienda para preservar el subnav');
console.log('✅ Verificado: Router.js preserva el submenú al navegar hacia o desde la tienda.');

// 5. Verificar TiendaController.js
const controllerJs = fs.readFileSync(path.join(ROOT_DIR, 'js/modules/tienda/TiendaController.js'), 'utf8');
assert(controllerJs.includes("window.SubnavManager.renderTienda(TiendaView.selectedCategory"), 'TiendaController no sincroniza el subnav en init');
assert(controllerJs.includes("window.SubnavManager.renderTienda(categoryId)"), 'TiendaController no sincroniza el subnav al cambiar categoría');
assert(controllerJs.includes("window.SubnavManager.renderTienda('cesta')"), 'TiendaController no sincroniza el subnav al abrir la cesta');
console.log('✅ Verificado: TiendaController mantiene el submenú verde azulado reactivo y sincronizado.');

console.log('\n🎉 ¡TODOS LOS TESTS DEL SUBMENÚ VERDE AZULADO DE TIENDA HAN PASADO AL 100%!');
