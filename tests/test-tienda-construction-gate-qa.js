/**
 * test-tienda-construction-gate-qa.js
 * Test de Validación Integral para el Control de Estado (Activar/Desactivar) de Tienda Online
 * y Eliminación del Muro de Construcción en la Interfaz de Jugador
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de Integridad para ACTIVACIÓN / DESACTIVACIÓN DE TIENDA Y RETIRADA DE CONSTRUCCIÓN...");

const ROOT_DIR = path.join(__dirname, '..');

// 1. Simulación de entorno DOM y navegador
const mockStorage = {};
const mockSessionStorage = {};
let renderedHtml = '';

global.window = {
    location: { origin: 'http://localhost:3000', pathname: '/index.html', hash: '#tienda' },
    Router: {
        navigate: (r) => { console.log(`Router navigated to: ${r}`); }
    }
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

const domMock = {
    innerHTML: '',
    value: '',
    style: {},
    classList: {
        remove: () => {},
        add: () => {}
    }
};

global.document = {
    createElement: (tag) => ({
        style: {},
        remove: () => {}
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
        if (id === 'sp-tienda-gate-pass') {
            return domMock;
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

// 2. Verificar estado inicial activo por defecto (SIN construcción ni clave requerida para jugadores)
assert.strictEqual(TiendaService.isStoreActive(), true, 'La tienda debe estar activa por defecto');
TiendaController.init('content-area');
assert(renderedHtml.includes('sp-tienda-container'), 'Debe renderizar la tienda comercial directamente');
assert(!renderedHtml.includes('Sección en Construcción'), 'No debe mostrar ningún cartel de sección en construcción');
console.log('✅ Verificado: Tienda activa por defecto, carga directa sin contraseña ni cartel de construcción.');

// 3. Simular que el Administrador desactiva la tienda desde el Backoffice
TiendaService.setStoreStatus('closed');
assert.strictEqual(TiendaService.isStoreActive(), false, 'La tienda debe figurar desactivada');
TiendaController.init('content-area');
assert(renderedHtml.includes('Tienda en Pausa Temporal') || renderedHtml.includes('pausa temporal'), 'Debe mostrar aviso de pausa temporal');
assert(renderedHtml.includes('sp-tienda-gate-pass'), 'Debe incluir acceso con clave para admin');
console.log('✅ Verificado: Al desactivar la tienda, se muestra pantalla de pausa/mantenimiento elegante.');

// 4. Intentar acceder con clave errónea mientras está en pausa
domMock.value = 'CLAVE_ERRONEA';
TiendaController.handleGateLogin({ preventDefault: () => {} });
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'Clave incorrecta no debe autenticar');
assert(renderedHtml.includes('Contraseña incorrecta'), 'Debe mostrar aviso de clave incorrecta');
console.log('✅ Verificado: Clave incorrecta rechazada.');

// 5. Desbloquear con contraseña oficial de admin "PADEL21" mientras está en pausa
domMock.value = 'PADEL21';
TiendaController.handleGateLogin({ preventDefault: () => {} });
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), true, 'PADEL21 debe autenticar');
assert(renderedHtml.includes('sp-tienda-container'), 'Debe mostrar la tienda al admin autenticado');
console.log('✅ Verificado: Admin puede previsualizar la tienda incluso en pausa con PADEL21.');

// 6. Reactivar la tienda desde el servicio
TiendaService.logoutStoreAdmin();
TiendaService.setStoreStatus('open');
assert.strictEqual(TiendaService.isStoreActive(), true, 'La tienda vuelve a estar activa');
TiendaController.init('content-area');
assert(renderedHtml.includes('sp-tienda-container'), 'Jugadores acceden normalmente tras reactivación');
console.log('✅ Verificado: Reactivación de tienda permite acceso directo a todos.');

// 7. Verificar enlaces en index.html sin menciones a "construcción"
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
assert(indexHtml.includes('id="nav-tienda"'), 'index.html debe tener nav-tienda');
assert(!indexHtml.includes('Tienda en construcción: ¡Pronto estará visible'), 'No debe haber mensaje de tienda en construcción en index.html');
assert(indexHtml.includes('Tienda Oficial SomosPadel: Material, palas y equipación'), 'HUD debe mostrar mensaje oficial de tienda');
console.log('✅ Verificado: index.html limpio de avisos de construcción.');

console.log("\n🎉 ¡TODOS LOS TESTS DE ACTIVACIÓN/DESACTIVACIÓN Y RETIRADA DE CONSTRUCCIÓN HAN PASADO CON ÉXITO (100% OK)!\n");
