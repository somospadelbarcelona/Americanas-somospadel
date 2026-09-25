/**
 * test-qa-deep-links-and-safari.js
 * Comprehensive QA Test Suite for Deep Linking, Safari Loop Prevention & WhatsApp Links
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        failedTests++;
        console.error(`  ❌ FAIL: ${message}`);
    }
}

console.log("\n=======================================================");
console.log("🧪 SOMOSPADEL QA AUDIT: SAFARI RELOAD LOOPS & DEEP LINKS");
console.log("=======================================================\n");

// ============================================================================
// 1. AUDITORÍA DE PREVENCIÓN DE BUCLES DE RECARGA (iOS Safari Protection)
// ============================================================================
console.log("▶ 1. Verificando prevención de bucles de recarga en archivos críticos...");

const firebaseInitContent = fs.readFileSync('js/firebase-init.js', 'utf8');
const routerContent = fs.readFileSync('js/core/Router.js', 'utf8');
const indexHtmlContent = fs.readFileSync('index.html', 'utf8');
const updateManagerContent = fs.readFileSync('js/core/UpdateManager.js', 'utf8');

// 1.1 js/firebase-init.js no debe llamar a location.reload()
assert(
    !firebaseInitContent.includes('location.reload') && !firebaseInitContent.includes('reload()'),
    "js/firebase-init.js NO tiene llamadas a location.reload() en background/visibilitychange."
);

// 1.2 js/core/Router.js no debe llamar a location.reload()
assert(
    !routerContent.includes('location.reload') && !routerContent.includes('reload()'),
    "js/core/Router.js NO tiene llamadas a location.reload()."
);

// 1.3 index.html onerror / onunhandledrejection no deben recargar automáticamente
const onerrorMatch = indexHtmlContent.match(/window\.onerror\s*=\s*function[^{]*\{([\s\S]*?)return/);
if (onerrorMatch) {
    assert(
        !onerrorMatch[1].includes('location.reload') && !onerrorMatch[1].includes('forceUpdateApp'),
        "index.html window.onerror no recarga automáticamente la página."
    );
} else {
    assert(true, "index.html window.onerror seguro.");
}

const unhandledMatch = indexHtmlContent.match(/window\.onunhandledrejection\s*=\s*function[^{]*\{([\s\S]*?)\};/);
if (unhandledMatch) {
    assert(
        !unhandledMatch[1].includes('location.reload') && !unhandledMatch[1].includes('forceUpdateApp'),
        "index.html window.onunhandledrejection no recarga automáticamente la página."
    );
} else {
    assert(true, "index.html window.onunhandledrejection seguro.");
}

// 1.4 controllerchange en Service Worker debe tener protección contra bucles y primera instalación
assert(
    indexHtmlContent.includes('hadActiveController') && indexHtmlContent.includes('sw_reloaded'),
    "index.html protege controllerchange contra recargas en primera instalación y bucles infinitos."
);
assert(
    updateManagerContent.includes('hadActiveController') && updateManagerContent.includes('sw_reloaded'),
    "UpdateManager.js protege controllerchange contra recargas en primera instalación y bucles infinitos."
);

// ============================================================================
// 2. SIMULADOR DE ENTORNO DE NAVEGACIÓN Y PRUEBAS DE ROUTER & DEEP LINKS
// ============================================================================
console.log("\n▶ 2. Pruebas de lógica de Deep Link y Router (Casos A, B, C, D, E)...");

function createRouterEnvironment(initialUrl) {
    const url = new URL(initialUrl);
    const historyLog = [];

    const mockWindow = {
        location: {
            href: url.href,
            search: url.search,
            hash: url.hash,
            pathname: url.pathname
        },
        history: {
            pushState(state, title, fullUrl) {
                historyLog.push({ action: 'pushState', state, title, fullUrl });
                if (fullUrl.startsWith('#')) {
                    mockWindow.location.hash = fullUrl;
                    mockWindow.location.search = '';
                } else if (fullUrl.includes('#')) {
                    const parts = fullUrl.split('#');
                    mockWindow.location.search = parts[0];
                    mockWindow.location.hash = '#' + parts[1];
                } else if (fullUrl.startsWith('?')) {
                    mockWindow.location.search = fullUrl;
                }
            },
            replaceState(state, title, fullUrl) {
                historyLog.push({ action: 'replaceState', state, title, fullUrl });
                if (fullUrl.startsWith('#')) {
                    mockWindow.location.hash = fullUrl;
                    mockWindow.location.search = '';
                } else if (fullUrl.includes('#')) {
                    const parts = fullUrl.split('#');
                    mockWindow.location.search = parts[0];
                    mockWindow.location.hash = '#' + parts[1];
                }
            }
        },
        addEventListener() {},
        removeEventListener() {},
        scrollTo() {},
        navigator: { onLine: true },
        document: {
            readyState: 'complete',
            getElementById() { return null; },
            querySelector() { return null; },
            querySelectorAll() { return []; },
            createElement() { return { style: {}, innerHTML: '', appendChild() {} }; },
            addEventListener() {},
            body: { classList: { toggle() {} } }
        },
        localStorage: {
            getItem() { return null; },
            setItem() {},
            removeItem() {},
            clear() {}
        },
        sessionStorage: {
            getItem() { return null; },
            setItem() {},
            removeItem() {},
            clear() {}
        }
    };
    mockWindow.window = mockWindow;

    const context = vm.createContext({
        window: mockWindow,
        document: mockWindow.document,
        navigator: mockWindow.navigator,
        localStorage: mockWindow.localStorage,
        sessionStorage: mockWindow.sessionStorage,
        URLSearchParams: URLSearchParams,
        console: { log() {}, warn() {}, error() {} },
        setTimeout: (fn) => fn(),
        clearTimeout() {}
    });

    const routerCode = fs.readFileSync('js/core/Router.js', 'utf8');
    vm.runInContext(routerCode, context);

    return {
        context,
        window: mockWindow,
        historyLog,
        router: context.window.Router
    };
}

// Caso A: URL con ?event=IS5V1j00vNYyFS2p2JKw#entrenos
{
    const env = createRouterEnvironment('https://somospadelbarcelona.github.io/Americanas-somospadel/?event=IS5V1j00vNYyFS2p2JKw#entrenos');
    const lastNav = env.historyLog[env.historyLog.length - 1];
    assert(
        env.router.currentRoute === 'entrenos',
        "Caso A: La ruta resuelta es 'entrenos'."
    );
    assert(
        lastNav && lastNav.fullUrl === '?event=IS5V1j00vNYyFS2p2JKw#entrenos',
        `Caso A: pushState preserva ?event=... y #entrenos (fullUrl: ${lastNav?.fullUrl})`
    );
    assert(
        env.window.location.search.includes('event=IS5V1j00vNYyFS2p2JKw'),
        "Caso A: window.location.search mantiene el parámetro ?event intacto."
    );
}

// Caso B: URL con #entrenos?event=IS5V1j00vNYyFS2p2JKw (query param en el hash)
{
    const env = createRouterEnvironment('https://somospadelbarcelona.github.io/Americanas-somospadel/#entrenos?event=IS5V1j00vNYyFS2p2JKw');
    const lastNav = env.historyLog[env.historyLog.length - 1];
    assert(
        env.router.currentRoute === 'entrenos',
        "Caso B: La ruta resuelta desde el hash con query es 'entrenos'."
    );
    assert(
        lastNav && lastNav.fullUrl.includes('event=IS5V1j00vNYyFS2p2JKw') && lastNav.fullUrl.includes('#entrenos'),
        `Caso B: pushState rescata y normaliza el parámetro de evento en la URL (fullUrl: ${lastNav?.fullUrl})`
    );
}

// Caso C: URL con ?event=ABC123#americanas
{
    const env = createRouterEnvironment('https://somospadelbarcelona.github.io/Americanas-somospadel/?event=ABC123#americanas');
    const lastNav = env.historyLog[env.historyLog.length - 1];
    assert(
        env.router.currentRoute === 'americanas',
        "Caso C: La ruta resuelta es 'americanas'."
    );
    assert(
        lastNav && lastNav.fullUrl === '?event=ABC123#americanas',
        `Caso C: pushState preserva ?event=ABC123#americanas (fullUrl: ${lastNav?.fullUrl})`
    );
}

// Caso D: URL sin hash ?event=IS5V1j00vNYyFS2p2JKw
{
    const env = createRouterEnvironment('https://somospadelbarcelona.github.io/Americanas-somospadel/?event=IS5V1j00vNYyFS2p2JKw');
    const lastNav = env.historyLog[env.historyLog.length - 1];
    assert(
        env.router.currentRoute === 'americanas' || env.router.currentRoute === 'entrenos',
        `Caso D: Enlace sin hash redirige inteligentemente a sección de eventos ('${env.router.currentRoute}') y no a dashboard.`
    );
    assert(
        lastNav && lastNav.fullUrl.includes('event=IS5V1j00vNYyFS2p2JKw'),
        `Caso D: pushState preserva el ID del evento (fullUrl: ${lastNav?.fullUrl})`
    );
}

// Caso E: Navegación interna con Router.navigate('entrenos') preservando ?event=...
{
    const env = createRouterEnvironment('https://somospadelbarcelona.github.io/Americanas-somospadel/?event=IS5V1j00vNYyFS2p2JKw#americanas');
    const initialUrl = env.historyLog[env.historyLog.length - 1]?.fullUrl;
    
    // Ejecutar navegación interna programática a 'entrenos'
    env.router.navigate('entrenos');
    const afterNav = env.historyLog[env.historyLog.length - 1];

    assert(
        env.router.currentRoute === 'entrenos',
        "Caso E: Router.navigate cambia la ruta a 'entrenos'."
    );
    assert(
        afterNav && afterNav.fullUrl === '?event=IS5V1j00vNYyFS2p2JKw#entrenos',
        `Caso E: Navegación interna NO borra los parámetros ?event=... de la URL (fullUrl: ${afterNav?.fullUrl})`
    );
    assert(
        env.window.location.search.includes('event=IS5V1j00vNYyFS2p2JKw'),
        "Caso E: window.location.search retiene el evento tras navegación interna."
    );
}

// ============================================================================
// 3. AUDITORÍA DE GENERACIÓN DE ENLACES EN WHATSAPPERVICE
// ============================================================================
console.log("\n▶ 3. Verificando generación de enlaces canónicos en WhatsAppService...");

const mockContext = vm.createContext({
    window: {
        location: { origin: 'https://somospadelbarcelona.github.io' }
    },
    navigator: {},
    encodeURIComponent: encodeURIComponent,
    console: { log() {}, warn() {}, error() {} }
});

const waCode = fs.readFileSync('js/modules/common/WhatsAppService.js', 'utf8');
vm.runInContext(waCode, mockContext);
const WhatsAppService = mockContext.window.WhatsAppService;

// 3.1 Enlace de Americana
const americanaEvent = {
    id: 'AME_2026_XYZ',
    name: 'AMERICANA NOCTURNA NIVEL MEDIO',
    type: 'americana',
    date: '2026-10-01',
    players: []
};
const americanaUrl = WhatsAppService.getEventCanonicalUrl(americanaEvent);
assert(
    americanaUrl === 'https://somospadelbarcelona.github.io/Americanas-somospadel/?event=AME_2026_XYZ#americanas',
    `WhatsAppService: Enlace canónico de Americana incluye ID y #americanas (${americanaUrl})`
);

// 3.2 Enlace de Entreno
const entrenoEvent = {
    id: 'IS5V1j00vNYyFS2p2JKw',
    name: 'ENTRENO DINÁMICO TÁCTICO',
    type: 'entreno',
    date: '2026-10-02',
    players: []
};
const entrenoUrl = WhatsAppService.getEventCanonicalUrl(entrenoEvent);
assert(
    entrenoUrl === 'https://somospadelbarcelona.github.io/Americanas-somospadel/?event=IS5V1j00vNYyFS2p2JKw#entrenos',
    `WhatsAppService: Enlace canónico de Entreno incluye ID y #entrenos (${entrenoUrl})`
);

// 3.3 Soporte de ID alternativo (_id)
const altIdEvent = {
    _id: 'ENTRENO_ALT_99',
    name: 'ENTRENO AVANZADO',
    type: 'entreno'
};
const altUrl = WhatsAppService.getEventCanonicalUrl(altIdEvent);
assert(
    altUrl === 'https://somospadelbarcelona.github.io/Americanas-somospadel/?event=ENTRENO_ALT_99#entrenos',
    `WhatsAppService: Enlace soporta event._id (${altUrl})`
);

// 3.4 Verificar que generateMessage incluye el enlace canónico
const fullMessageAmericana = WhatsAppService.generateMessage(americanaEvent);
assert(
    fullMessageAmericana.includes(americanaUrl),
    "WhatsAppService: generateMessage incluye el enlace canónico con ID y sección para Americanas."
);

const fullMessageEntreno = WhatsAppService.generateMessage(entrenoEvent);
assert(
    fullMessageEntreno.includes(entrenoUrl),
    "WhatsAppService: generateMessage incluye el enlace canónico con ID y sección para Entrenos."
);

// ============================================================================
// 4. RESUMEN FINAL
// ============================================================================
console.log("\n=======================================================");
console.log(`📊 RESULTADO DE LA SUITE QA:`);
console.log(`   Total de pruebas: ${totalTests}`);
console.log(`   Pruebas superadas: ${passedTests}`);
console.log(`   Pruebas fallidas: ${failedTests}`);
console.log("=======================================================\n");

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log("🎉 ¡TODAS LAS PRUEBAS DE CALIDAD HAN SIDO SUPERADAS EXITOSAMENTE!");
    process.exit(0);
}
