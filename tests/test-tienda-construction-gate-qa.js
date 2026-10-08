/**
 * test-tienda-construction-gate-qa.js
 * Test de Validación Integral para el Muro de Acceso "En Construcción" con Contraseña "PADEL21"
 * en la Interfaz de Usuario / Jugador de TIENDA SOMOSPADEL BCN
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🚀 Iniciando Test de Integridad para MURO EN CONSTRUCCIÓN CON CONTRASEÑA EN TIENDA JUGADOR...");

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

// 2. Verificar estado inicial bloqueado
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'Inicialmente la sesión no debe estar autenticada');

// 3. Probar que init() carga el muro "En Construcción"
TiendaController.init('content-area');
assert(renderedHtml.includes('Sección en Construcción') || renderedHtml.includes('Construcción'), 'Debe mostrar indicativo de Construcción');
assert(renderedHtml.includes('Pronto estará visible para todos los jugadores') || renderedHtml.includes('Pronto estará visible'), 'Debe informar al jugador que pronto estará visible');
assert(renderedHtml.includes('sp-tienda-gate-pass'), 'Debe contener el input de contraseña sp-tienda-gate-pass');
assert(renderedHtml.includes('DESBLOQUEAR TIENDA'), 'Debe incluir botón de desbloqueo');
console.log('✅ Verificado: Pantalla "En Construcción" con mensaje al jugador y formulario de clave mostrada correctamente.');

// 4. Intentar acceder con contraseña errónea
domMock.value = 'CLAVE_ERRONEA';
TiendaController.handleGateLogin({ preventDefault: () => {} });
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'Clave incorrecta no debe autenticar');
assert(renderedHtml.includes('Contraseña incorrecta'), 'Debe mostrar advertencia de contraseña incorrecta');
console.log('✅ Verificado: Contraseña incorrecta rechazada y advertencia visible.');

// 5. Acceder con la contraseña correcta "PADEL21"
domMock.value = 'PADEL21';
TiendaController.handleGateLogin({ preventDefault: () => {} });
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), true, 'PADEL21 debe autenticar con éxito');
assert(renderedHtml.includes('sp-tienda-container'), 'Debe renderizar el contenedor de tienda tras login');
assert(renderedHtml.includes('Escaparate & Catálogo') || renderedHtml.includes('TIENDA SOMOSPADEL BCN'), 'Debe mostrar el catálogo comercial');
console.log('✅ Verificado: Desbloqueo exitoso con "PADEL21" y renderizado del catálogo completo.');

// 6. Probar botón de Bloquear
TiendaController.lockStore();
assert.strictEqual(TiendaService.isStoreAdminAuthenticated(), false, 'lockStore debe cerrar sesión');
assert(renderedHtml.includes('Sección en Construcción'), 'Tras bloquear debe volver a la pantalla de construcción');
console.log('✅ Verificado: Bloqueo de tienda restablece el muro en construcción.');

// 7. Verificar enlaces en index.html
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
assert(indexHtml.includes('id="nav-tienda"'), 'index.html debe tener nav-tienda');
assert(indexHtml.includes('Tienda en construcción: ¡Pronto estará visible para todos los jugadores!'), 'HUD message debe anunciar construcción');
console.log('✅ Verificado: index.html anuncia "Tienda en construcción: Pronto estará visible".');

console.log("\n🎉 ¡TODOS LOS TESTS DEL MURO EN CONSTRUCCIÓN CON CONTRASEÑA PADEL21 HAN PASADO CON ÉXITO (100% OK)!\n");
