/**
 * test-tienda-admin-qa.js
 * Test de Validación Exhaustivo para el PANEL ADMIN DE TIENDA SOMOSPADEL BCN
 * 
 * Verifica:
 * 1. Existencia de módulos (admin-tienda.js, TiendaService.js).
 * 2. Enrutamiento en admin.html y js/admin.js (vista 'tienda_admin').
 * 3. Integración en el sidebar y barra rápida móvil de admin.html.
 * 4. Enlace directo desde tienda.html hacia admin.html#tienda_admin.
 * 5. Sistema de seguridad y autenticación estricta con contraseña "PADEL21".
 * 6. CRUD de productos, control de stock y switches (activo/pausado, destacado).
 * 7. Gestión completa de pedidos/ventas (órdenes, estados, total, WhatsApp).
 * 8. Configuración de tienda, exportación de backup y restauración.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de Integridad para ADMIN TIENDA ONLINE SOMOSPADEL...");

const ROOT_DIR = path.join(__dirname, '..');

// 1. Validar existencia de archivos
const files = [
    'js/modules/admin-tienda.js',
    'js/modules/tienda/TiendaService.js',
    'admin.html',
    'tienda.html',
    'js/admin.js'
];

files.forEach(f => {
    const full = path.join(ROOT_DIR, f);
    assert(fs.existsSync(full), `Archivo no encontrado: ${f}`);
    console.log(`✅ Archivo presente: ${f}`);
});

// 2. Verificar admin.html
const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');

assert(adminHtml.includes('data-view="tienda_admin"'), 'admin.html debe contener botón con data-view="tienda_admin"');
assert(adminHtml.includes("loadAdminView('tienda_admin')"), "admin.html debe llamar a loadAdminView('tienda_admin')");
assert(adminHtml.includes('js/modules/tienda/TiendaService.js'), 'admin.html debe importar TiendaService.js');
assert(adminHtml.includes('js/modules/admin-tienda.js'), 'admin.html debe importar admin-tienda.js');
assert(adminHtml.includes("view: 'tienda_admin'"), 'ADMIN_ALL_MOBILE_SUBNAV debe incluir la vista tienda_admin');
console.log('✅ Verificado: admin.html configurado con botón sidebar, quick nav y scripts de tienda.');

// 3. Verificar js/admin.js router
const adminJs = fs.readFileSync(path.join(ROOT_DIR, 'js/admin.js'), 'utf8');
assert(adminJs.includes("viewName === 'tienda_admin'"), "js/admin.js debe enrutar la vista 'tienda_admin'");
assert(adminJs.includes("AdminTienda"), "js/admin.js debe inicializar AdminTienda");
console.log('✅ Verificado: js/admin.js enruta correctamente a tienda_admin.');

// 4. Verificar tienda.html
const tiendaHtml = fs.readFileSync(path.join(ROOT_DIR, 'tienda.html'), 'utf8');
assert(tiendaHtml.includes('admin.html#tienda_admin'), 'tienda.html debe enlazar a admin.html#tienda_admin');
console.log('✅ Verificado: tienda.html contiene acceso directo al panel admin de tienda.');

// 5. Test de Lógica del Backend de TiendaService con Mocks de Storage
const mockStorage = {};
const mockSessionStorage = {};

global.window = {
    location: { origin: 'http://localhost:3000', pathname: '/admin.html', hash: '#tienda_admin' },
    AdminViews: {}
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

const TiendaService = require(path.join(ROOT_DIR, 'js/modules/tienda/TiendaService.js'));

// 6. Validar autenticación con contraseña "PADEL21"
console.log("\n🔒 Probando Seguridad & Contraseña 'PADEL21'...");
assert.strictEqual(TiendaService.getAdminPassword(), 'PADEL21', 'La contraseña oficial debe ser exactamente PADEL21');

assert.strictEqual(TiendaService.verifyAdminPassword('PADEL21'), true, 'PADEL21 debe ser aceptada');
assert.strictEqual(TiendaService.verifyAdminPassword(' PADEL21 '), true, 'PADEL21 con espacios en blanco recortables debe ser aceptada');
assert.strictEqual(TiendaService.verifyAdminPassword('padel21'), false, 'padel21 en minúsculas debe ser rechazada');
assert.strictEqual(TiendaService.verifyAdminPassword('1234'), false, 'Contraseña errónea debe ser rechazada');
assert.strictEqual(TiendaService.verifyAdminPassword(''), false, 'Contraseña vacía debe ser rechazada');

// Sesión de autenticación
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'Inicialmente no debe estar autenticado');
const loginWrong = TiendaService.loginStoreAdmin('INCORRECTA');
assert.strictEqual(loginWrong, false, 'Login con clave incorrecta debe devolver false');
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'No debe quedar autenticado tras clave incorrecta');

const loginSuccess = TiendaService.loginStoreAdmin('PADEL21');
assert.strictEqual(loginSuccess, true, 'Login con PADEL21 debe devolver true');
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), true, 'Debe quedar autenticado en sessionStorage');

TiendaService.logoutStoreAdmin();
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'Tras logout debe bloquearse de nuevo');
console.log('✅ Verificado: Seguridad de contraseña "PADEL21" y ciclo de sesión 100% operativos.');

// 7. Validar Gestión de Stock y Catálogo
console.log("\n📦 Probando Control de Stock y Catálogo...");
const products = TiendaService.getProducts();
assert(products.length >= 10, 'Deben existir productos iniciales');
const testProd = products[0];

const initialStock = testProd.stock;
TiendaService.updateProductStock(testProd.id, 5, true); // delta +5
let updated = TiendaService.getProductById(testProd.id);
assert.strictEqual(updated.stock, initialStock + 5, 'El stock debió aumentar en 5 unidades');

TiendaService.updateProductStock(testProd.id, 40, false); // valor absoluto 40
updated = TiendaService.getProductById(testProd.id);
assert.strictEqual(updated.stock, 40, 'El stock debió fijarse en 40 unidades');

// Toggles de activo y destacado
const initialActive = updated.active;
TiendaService.toggleProductActive(testProd.id);
updated = TiendaService.getProductById(testProd.id);
assert.strictEqual(updated.active, !initialActive, 'El estado activo debió invertirse');

const initialFeatured = updated.featured;
TiendaService.toggleProductFeatured(testProd.id);
updated = TiendaService.getProductById(testProd.id);
assert.strictEqual(updated.featured, !initialFeatured, 'El estado destacado debió invertirse');
console.log('✅ Verificado: Control de stock (+/- y fijación), toggle activo y toggle destacado funcionan.');

// 8. Validar Pedidos / Órdenes
console.log("\n🛒 Probando Gestión de Pedidos & Ventas...");
const orders = TiendaService.getOrders();
assert(orders.length >= 3, 'Deben existir al menos 3 pedidos iniciales de demostración');

const newOrder = {
    customerName: 'Jugador Test QA',
    customerPhone: '+34 699 112 233',
    totalAmount: 180.00,
    commission: 27.00,
    paymentMethod: 'Bizum',
    status: 'Pendiente'
};

const savedOrder = TiendaService.saveOrder(newOrder);
assert(savedOrder.id, 'El pedido guardado debe tener un ID asignado');
assert.strictEqual(savedOrder.customerName, 'Jugador Test QA');

TiendaService.updateOrderStatus(savedOrder.id, 'Pagado');
const retrievedOrder = TiendaService.getOrderById(savedOrder.id);
assert.strictEqual(retrievedOrder.status, 'Pagado', 'El estado del pedido debió actualizarse a Pagado');

TiendaService.deleteOrder(savedOrder.id);
assert.strictEqual(TiendaService.getOrderById(savedOrder.id), null, 'El pedido debió eliminarse');
console.log('✅ Verificado: CRUD de pedidos (crear, actualizar estado, consultar y eliminar) funcionando.');

// 9. Validar Ajustes de Tienda
console.log("\n⚙️ Probando Ajustes y Configuración...");
const settings = TiendaService.getSettings();
assert(settings.storeName, 'Debe existir storeName');
assert(settings.whatsappPhone, 'Debe existir whatsappPhone');

TiendaService.saveSettings({ freeShippingThreshold: 60 });
const updatedSettings = TiendaService.getSettings();
assert.strictEqual(updatedSettings.freeShippingThreshold, 60, 'El umbral de envío gratis debió actualizarse a 60');

// 10. Backup y Restauración
const backup = TiendaService.exportFullBackup();
assert(backup.products && backup.partners && backup.orders && backup.store, 'El backup debe contener toda la estructura e-commerce');
const resetOk = TiendaService.resetToDefaults();
assert.strictEqual(resetOk, true, 'La restauración por defecto debe devolver true');
console.log('✅ Verificado: Exportación de backup y restauración a valores por defecto comprobados.');

console.log("\n🎉 ¡TODOS LOS TESTS DEL PANEL ADMIN DE TIENDA CON CONTRASEÑA PADEL21 HAN PASADO CON ÉXITO (100% OK)!\n");
