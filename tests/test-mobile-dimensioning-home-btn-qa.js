/**
 * 📱 Batería de Pruebas QA: Dimensionamiento Móvil y Botones de Inicio (Header & Footer)
 * Valida:
 * 1. Sintaxis de NotificationUi.js y css/notifications.css.
 * 2. Método goToHome() en NotificationUi.js (cierre de drawer y navegación a 'dashboard').
 * 3. Elementos HTML generados en NotificationUi.prototype.open():
 *    - Botón de Inicio en Header: .notif-header-home-btn con onclick window.NotificationUi.goToHome()
 *    - Barra fija inferior permanente: .notif-drawer-bottom-bar con .btn-notif-go-home
 * 4. Reglas CSS en css/notifications.css para .notif-header-home-btn, .notif-drawer-bottom-bar, .btn-notif-go-home.
 * 5. Media queries responsive en css/notifications.css:
 *    - @media (max-width: 600px)
 *    - @media (max-width: 480px)
 *    - @media (max-width: 420px)
 *    Ajustando .notif-drawer-panel al 100vw, overflow-x: hidden, width: 100% en .notif-card-action-btn y flex-wrap: wrap en permisos push.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        results.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (err) {
        failed++;
        results.push({ name, status: 'FAIL', error: err.message });
        console.error(`❌ FAIL: ${name}\n   -> ${err.message}`);
    }
}

function extractMethodBody(code, methodName) {
    const match = new RegExp(`\\b${methodName}\\s*\\([^)]*\\)\\s*\\{`).exec(code);
    if (!match) return null;
    const braceStart = code.indexOf('{', match.index);
    if (braceStart === -1) return null;
    let depth = 1;
    let idx = braceStart + 1;
    while (idx < code.length && depth > 0) {
        if (code[idx] === '{') depth++;
        else if (code[idx] === '}') depth--;
        idx++;
    }
    return code.slice(braceStart + 1, idx - 1);
}

function extractMediaQueryBlock(css, maxWidthPx) {
    const regex = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidthPx}px\\)`);
    const match = regex.exec(css);
    if (!match) return null;
    const braceStart = css.indexOf('{', match.index);
    if (braceStart === -1) return null;
    let depth = 1;
    let idx = braceStart + 1;
    while (idx < css.length && depth > 0) {
        if (css[idx] === '{') depth++;
        else if (css[idx] === '}') depth--;
        idx++;
    }
    return css.slice(braceStart + 1, idx - 1);
}

console.log('========================================================================');
console.log('📱 QA TEST SUITE: DIMENSIONAMIENTO MÓVIL Y BOTONES DE INICIO EN DRAWER');
console.log('========================================================================\n');

const notifUiPath = path.join(__dirname, '../js/modules/ui/NotificationUi.js');
const cssPath = path.join(__dirname, '../css/notifications.css');

const notifUiCode = fs.readFileSync(notifUiPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// -----------------------------------------------------------------------------
// 1. SINTAXIS DE ARCHIVOS
// -----------------------------------------------------------------------------
test('Sintaxis de js/modules/ui/NotificationUi.js es válida', () => {
    execSync(`node -c "${notifUiPath}"`);
});

// -----------------------------------------------------------------------------
// 2. MÉTODO goToHome() EN NotificationUi.js
// -----------------------------------------------------------------------------
test('NotificationUi declara el método goToHome()', () => {
    if (!/goToHome\s*\(\s*\)\s*\{/.test(notifUiCode)) {
        throw new Error('No se encontró la declaración del método goToHome() en NotificationUi.js');
    }
});

test('goToHome() cierra el drawer llamando a this.close()', () => {
    const body = extractMethodBody(notifUiCode, 'goToHome');
    if (!body) throw new Error('No se pudo extraer el cuerpo de goToHome()');
    if (!body.includes('this.close()')) {
        throw new Error('goToHome() no invoca this.close() para cerrar el drawer');
    }
});

test('goToHome() navega a dashboard (Router.navigate o fallback hash)', () => {
    const body = extractMethodBody(notifUiCode, 'goToHome');
    if (!body) throw new Error('No se pudo extraer el cuerpo de goToHome()');
    if (!body.includes("Router.navigate('dashboard')") && !body.includes('Router.navigate("dashboard")')) {
        throw new Error('goToHome() no incluye navegación vía Router.navigate("dashboard")');
    }
    if (!body.includes('#dashboard')) {
        throw new Error('goToHome() no incluye fallback de navegación con hash #dashboard');
    }
});

// -----------------------------------------------------------------------------
// 3. EJECUCIÓN SIMULADA DE goToHome() EN ENTORNO DOM MOCK
// -----------------------------------------------------------------------------
test('Ejecución de goToHome() redirige a dashboard y cierra estado isOpen con Router', () => {
    let navigatedRoute = null;
    let closedCalled = false;
    let scrolledToTop = false;

    const sandboxWindow = {
        Router: {
            navigate: (route) => { navigatedRoute = route; }
        },
        location: { hash: '' },
        scrollTo: (opts) => { if (opts && opts.top === 0) scrolledToTop = true; },
        NotificationService: { onUpdate: () => {}, unreadCount: 0 },
        addEventListener: () => {}
    };

    const mockUiInstance = {
        isOpen: true,
        close: function() {
            this.isOpen = false;
            closedCalled = true;
        }
    };

    const body = extractMethodBody(notifUiCode, 'goToHome');
    const goToHomeFn = new Function('window', `
        const instance = this;
        function fn() { ${body} }
        return fn.bind(instance);
    `).call(mockUiInstance, sandboxWindow);

    goToHomeFn();

    if (!closedCalled || mockUiInstance.isOpen !== false) {
        throw new Error('goToHome() no cerró el drawer');
    }
    if (navigatedRoute !== 'dashboard') {
        throw new Error(`Ruta esperada 'dashboard', obtenida: '${navigatedRoute}'`);
    }
    if (!scrolledToTop) {
        throw new Error('goToHome() no ejecutó scroll to top suave');
    }
});

test('Ejecución de goToHome() sin Router usa fallback hash #dashboard', () => {
    const sandboxWindow = {
        Router: null,
        location: { hash: '' },
        scrollTo: () => {},
        NotificationService: { onUpdate: () => {}, unreadCount: 0 },
        addEventListener: () => {}
    };

    const mockUiInstance = {
        isOpen: true,
        close: function() { this.isOpen = false; }
    };

    const body = extractMethodBody(notifUiCode, 'goToHome');
    const goToHomeFn = new Function('window', `
        const instance = this;
        function fn() { ${body} }
        return fn.bind(instance);
    `).call(mockUiInstance, sandboxWindow);

    goToHomeFn();

    if (sandboxWindow.location.hash !== '#dashboard') {
        throw new Error(`Hash esperado '#dashboard', obtenido: '${sandboxWindow.location.hash}'`);
    }
});

// -----------------------------------------------------------------------------
// 4. ESTRUCTURA HTML GENERADA EN NotificationUi.prototype.open
// -----------------------------------------------------------------------------
test('open() genera el botón de inicio en header (.notif-header-home-btn)', () => {
    if (!notifUiCode.includes('class="notif-header-home-btn"')) {
        throw new Error('No se encontró el botón con clase .notif-header-home-btn en el header');
    }
    if (!notifUiCode.includes('window.NotificationUi.goToHome()')) {
        throw new Error('El botón .notif-header-home-btn no llama a window.NotificationUi.goToHome()');
    }
    if (!notifUiCode.includes('fa-house')) {
        throw new Error('El botón de inicio no contiene el icono fa-house');
    }
});

test('open() genera la barra fija inferior (.notif-drawer-bottom-bar) con botón (.btn-notif-go-home)', () => {
    if (!notifUiCode.includes('class="notif-drawer-bottom-bar"')) {
        throw new Error('No se encontró el contenedor .notif-drawer-bottom-bar en el layout del drawer');
    }
    if (!notifUiCode.includes('class="btn-notif-go-home"')) {
        throw new Error('No se encontró el botón .btn-notif-go-home dentro de la barra inferior');
    }
    if (!notifUiCode.includes('VOLVER AL INICIO')) {
        throw new Error('El botón .btn-notif-go-home no contiene el texto descriptivo "VOLVER AL INICIO"');
    }
});

// -----------------------------------------------------------------------------
// 5. ESTILOS CSS EN css/notifications.css
// -----------------------------------------------------------------------------
test('css/notifications.css define estilos para .notif-header-home-btn', () => {
    if (!cssCode.includes('.notif-header-home-btn')) {
        throw new Error('No se encontraron estilos para .notif-header-home-btn en css/notifications.css');
    }
    if (!cssCode.includes('.notif-header-home-btn:hover')) {
        throw new Error('No se definió estado :hover para .notif-header-home-btn');
    }
});

test('css/notifications.css define estilos para .notif-drawer-bottom-bar', () => {
    if (!cssCode.includes('.notif-drawer-bottom-bar')) {
        throw new Error('No se encontraron estilos para .notif-drawer-bottom-bar en css/notifications.css');
    }
    const barRule = cssCode.match(/\.notif-drawer-bottom-bar\s*\{([^}]+)\}/);
    if (!barRule) throw new Error('No se pudo encontrar la regla CSS de .notif-drawer-bottom-bar');
    const content = barRule[1];
    if (!content.includes('border-top')) {
        throw new Error('.notif-drawer-bottom-bar debe tener border-top');
    }
    if (!content.includes('flex-shrink: 0')) {
        throw new Error('.notif-drawer-bottom-bar debe tener flex-shrink: 0 para no encogerse');
    }
});

test('css/notifications.css define estilos para .btn-notif-go-home', () => {
    if (!cssCode.includes('.btn-notif-go-home')) {
        throw new Error('No se encontraron estilos para .btn-notif-go-home en css/notifications.css');
    }
    const btnRule = cssCode.match(/\.btn-notif-go-home\s*\{([^}]+)\}/);
    if (!btnRule) throw new Error('No se pudo encontrar la regla CSS de .btn-notif-go-home');
    const content = btnRule[1];
    if (!content.includes('width: 100%')) {
        throw new Error('.btn-notif-go-home debe ocupar el ancho completo width: 100%');
    }
});

// -----------------------------------------------------------------------------
// 6. REGLAS RESPONSIVE Y DIMENSIONAMIENTO MÓVIL
// -----------------------------------------------------------------------------
test('css/notifications.css define media query @media (max-width: 600px)', () => {
    if (!cssCode.includes('@media (max-width: 600px)')) {
        throw new Error('Falta la media query @media (max-width: 600px) en css/notifications.css');
    }
});

test('css/notifications.css define media query @media (max-width: 480px)', () => {
    if (!cssCode.includes('@media (max-width: 480px)')) {
        throw new Error('Falta la media query @media (max-width: 480px) en css/notifications.css');
    }
});

test('css/notifications.css define media query @media (max-width: 420px)', () => {
    if (!cssCode.includes('@media (max-width: 420px)')) {
        throw new Error('Falta la media query @media (max-width: 420px) en css/notifications.css');
    }
});

test('Reglas responsive ajustan .notif-drawer-panel a 100vw en móviles', () => {
    const m600 = extractMediaQueryBlock(cssCode, 600);
    if (!m600 || (!m600.includes('width: 100vw') && !m600.includes('max-width: 100vw'))) {
        throw new Error('@media (max-width: 600px) debe ajustar .notif-drawer-panel a 100vw');
    }

    const m480 = extractMediaQueryBlock(cssCode, 480);
    if (!m480 || (!m480.includes('width: 100vw') && !m480.includes('max-width: 100vw'))) {
        throw new Error('@media (max-width: 480px) debe ajustar .notif-drawer-panel a 100vw');
    }

    const m420 = extractMediaQueryBlock(cssCode, 420);
    if (!m420 || (!m420.includes('width: 100vw') && !m420.includes('max-width: 100vw'))) {
        throw new Error('@media (max-width: 420px) debe ajustar .notif-drawer-panel a 100vw');
    }
});

test('Reglas responsive previenen desbordamiento horizontal con overflow-x: hidden', () => {
    const m600 = extractMediaQueryBlock(cssCode, 600);
    if (!m600 || !m600.includes('overflow-x: hidden')) {
        throw new Error('@media (max-width: 600px) debe incluir overflow-x: hidden');
    }

    const m480 = extractMediaQueryBlock(cssCode, 480);
    if (!m480 || !m480.includes('overflow-x: hidden')) {
        throw new Error('@media (max-width: 480px) debe incluir overflow-x: hidden');
    }

    const m420 = extractMediaQueryBlock(cssCode, 420);
    if (!m420 || !m420.includes('overflow-x: hidden')) {
        throw new Error('@media (max-width: 420px) debe incluir overflow-x: hidden');
    }
});

test('Reglas responsive configuran .notif-card-action-btn con width: 100% en móvil', () => {
    const m600 = extractMediaQueryBlock(cssCode, 600);
    if (!m600 || !m600.includes('.notif-card-action-btn') || !m600.includes('width: 100%')) {
        throw new Error('@media (max-width: 600px) debe incluir .notif-card-action-btn con width: 100%');
    }

    const m480 = extractMediaQueryBlock(cssCode, 480);
    if (!m480 || !m480.includes('.notif-card-action-btn') || !m480.includes('width: 100%')) {
        throw new Error('@media (max-width: 480px) debe incluir .notif-card-action-btn con width: 100%');
    }
});

test('Reglas responsive aplican flex-wrap: wrap en la barra de permisos push (.notif-perm-status-row)', () => {
    const m600 = extractMediaQueryBlock(cssCode, 600);
    if (!m600 || !m600.includes('.notif-perm-status-row') || !m600.includes('flex-wrap: wrap')) {
        throw new Error('@media (max-width: 600px) debe incluir .notif-perm-status-row con flex-wrap: wrap');
    }

    const m480 = extractMediaQueryBlock(cssCode, 480);
    if (!m480 || !m480.includes('.notif-perm-status-row') || !m480.includes('flex-wrap: wrap')) {
        throw new Error('@media (max-width: 480px) debe incluir .notif-perm-status-row con flex-wrap: wrap');
    }
});

// -----------------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------------
console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL PRUEBAS: ${passed + failed} | EXITOSAS: ${passed} | FALLIDAS: ${failed}`);
console.log('------------------------------------------------------------------------');

if (failed > 0) {
    console.error('💥 ERROR: Algunas pruebas de calidad han fallado.');
    process.exit(1);
} else {
    console.log('🎉 TODAS LAS PRUEBAS DE CALIDAD HAN PASADO SATISFACTORIAMENTE.');
    process.exit(0);
}
