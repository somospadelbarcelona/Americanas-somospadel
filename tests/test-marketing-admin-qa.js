/**
 * test-marketing-admin-qa.js
 * Suite Exhaustiva de Control de Calidad (QA) para MARKETING & COOPATROCINIOS (SUPERADMIN)
 * 
 * Verificaciones:
 * 1. Integridad de archivos y enlaces en admin.html y js/admin.js
 * 2. Seguridad del Superadmin Vault (contraseña 'NOA21', sesiones, bloqueo/desbloqueo, feedback de error)
 * 3. Pestaña 1: Pitch Deck de 7 slides interactivo con navegación y límites
 * 4. Pestaña 1: Dossier Ejecutivo Imprimible (estilos @media print y firmas)
 * 5. Pestaña 1: Generador y copia de textos (Email formal, WhatsApp con wa.me, Elevator Pitch)
 * 6. Pestaña 1: Puesta en valor tecnológica de la App SomosPadel (PWA, no simple WhatsApp)
 * 7. Pestaña 2: Plan de Activaciones con Matriz de Fases y Checklist interactivo persistido
 * 8. Pestaña 3: Showcase Digital Interactivo de la App (Banner, Push, Tienda)
 * 9. Pestaña 4: Calculadora de Retorno e Impactos (ROI) y Bloc de Notas persistido
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("================================================================");
console.log(" 🏆 QA TEST SUITE: MARKETING & COOPATROCINIOS (SUPERADMIN)");
console.log("================================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedCount++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        failedCount++;
    }
}

// =============================================================================
// 1. MOCK DE ENTORNO NAVEGADOR (DOM, SESSIONSTORAGE, LOCALSTORAGE)
// =============================================================================
class MockStorage {
    constructor() { this.store = new Map(); }
    getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
    setItem(key, val) { this.store.set(key, String(val)); }
    removeItem(key) { this.store.delete(key); }
    clear() { this.store.clear(); }
}

class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this._innerHTML = '';
        this.value = '';
        this.type = 'text';
        this.style = {};
        this.className = '';
        this.attributes = new Map();
        this._listeners = new Map();
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(html) {
        this._innerHTML = html;
        this._parseChildIds(html);
    }
    get textContent() {
        return this._innerHTML.replace(/<[^>]*>/g, '').trim();
    }
    set textContent(txt) {
        this._innerHTML = txt;
    }
    _parseChildIds(html) {
        // Simular registro de elementos hijos con id en el documento
        const regex = /id=["']([^"']+)["']/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            const childId = match[1];
            if (!global.document.elementsMap.has(childId)) {
                const el = new MockElement(childId);
                // Si es un input type="range" o password
                if (html.includes(`type="password"`)) el.type = 'password';
                if (html.includes(`type="range"`)) el.type = 'range';
                global.document.elementsMap.set(childId, el);
            }
        }
    }
    focus() {}
    addEventListener(evt, fn) {
        if (!this._listeners.has(evt)) this._listeners.set(evt, []);
        this._listeners.get(evt).push(fn);
    }
    dispatchEvent(evt) {
        const fns = this._listeners.get(evt.type) || [];
        fns.forEach(fn => fn(evt));
    }
}

const mockSessionStorage = new MockStorage();
const mockLocalStorage = new MockStorage();

global.sessionStorage = mockSessionStorage;
global.localStorage = mockLocalStorage;

global.document = {
    elementsMap: new Map(),
    getElementById(id) {
        if (!this.elementsMap.has(id)) {
            const el = new MockElement(id);
            this.elementsMap.set(id, el);
        }
        return this.elementsMap.get(id);
    },
    createElement(tag) {
        return new MockElement('', tag);
    },
    querySelector(selector) {
        return new MockElement('query-' + selector);
    },
    querySelectorAll(selector) {
        return [];
    },
    body: new MockElement('body', 'body')
};

global.window = {
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
    addEventListener(evt, fn) {},
    print() {}
};

// =============================================================================
// FASE 1: INTEGRIDAD DE ARCHIVOS Y RUTAS
// =============================================================================
console.log("▶️ FASE 1: Verificación de Archivos e Integración en Admin");

const adminHtmlPath = path.join(__dirname, '../admin.html');
const adminJsPath = path.join(__dirname, '../js/admin.js');
const marketingJsPath = path.join(__dirname, '../js/modules/admin-marketing.js');

runTest("Archivos del módulo existen físicamente", () => {
    assert(fs.existsSync(adminHtmlPath), "admin.html debe existir");
    assert(fs.existsSync(adminJsPath), "js/admin.js debe existir");
    assert(fs.existsSync(marketingJsPath), "js/modules/admin-marketing.js debe existir");
});

runTest("admin.html contiene el botón y estilos para Marketing Hub en el Sidebar", () => {
    const html = fs.readFileSync(adminHtmlPath, 'utf8');
    assert(html.includes('btn-marketing-hub'), "admin.html debe incluir la clase .btn-marketing-hub");
    assert(html.includes('data-view="marketing"'), "admin.html debe incluir data-view='marketing'");
    assert(html.includes("loadAdminView('marketing')"), "admin.html debe llamar a loadAdminView('marketing')");
    assert(html.includes('MARKETING & COOPATROCINIOS'), "admin.html debe tener el texto MARKETING & COOPATROCINIOS");
    assert(html.includes('SUPERADMIN'), "admin.html debe tener el badge SUPERADMIN en el botón");
    assert(html.includes('.btn-marketing-hub .icon-box'), "admin.html debe contener estilos específicos para el icono");
});

runTest("admin.html incluye la ruta en Mobile Subnav y carga el script", () => {
    const html = fs.readFileSync(adminHtmlPath, 'utf8');
    assert(html.includes("view: 'marketing'"), "ADMIN_ALL_MOBILE_SUBNAV debe incluir view: marketing");
    assert(html.includes("label: 'Marketing Hub'"), "ADMIN_ALL_MOBILE_SUBNAV debe tener label: Marketing Hub");
    assert(html.includes('admin-marketing.js'), "admin.html debe incluir el tag script de admin-marketing.js");
});

runTest("js/admin.js enruta la vista 'marketing' hacia AdminMarketing", () => {
    const js = fs.readFileSync(adminJsPath, 'utf8');
    assert(js.includes("else if (viewName === 'marketing')"), "js/admin.js debe enrutar viewName === 'marketing'");
    assert(js.includes("window.AdminMarketing.init()"), "js/admin.js debe llamar a AdminMarketing.init()");
    assert(js.includes("MARKETING & COOPATROCINIOS (SUPERADMIN)"), "js/admin.js debe actualizar el título de página");
});

// =============================================================================
// FASE 2: CARGA DEL CONTROLADOR Y SEGURIDAD SUPERADMIN (NOA21)
// =============================================================================
console.log("\n▶️ FASE 2: Seguridad Superadmin Vault (Clave 'NOA21')");

const AdminMarketing = require(marketingJsPath);
global.window.AdminMarketing = AdminMarketing;

runTest("El módulo AdminMarketing se instancia con valores por defecto correctos", () => {
    assert(typeof AdminMarketing === 'object', "AdminMarketing debe ser un objeto/instancia");
    assert.strictEqual(AdminMarketing.currentTab, 'dossier', "Pestaña inicial debe ser 'dossier'");
    assert.strictEqual(AdminMarketing.dossierMode, 'slides', "Modo inicial debe ser 'slides'");
    assert.strictEqual(AdminMarketing.currentSlide, 0, "Slide inicial debe ser 0");
    assert.strictEqual(AdminMarketing.totalSlides, 7, "Total de slides debe ser 7");
});

runTest("Estado inicial está bloqueado cuando sessionStorage está vacío", () => {
    mockSessionStorage.clear();
    assert.strictEqual(AdminMarketing.isUnlocked(), false, "isUnlocked() debe retornar false por defecto");
});

runTest("Rechaza contraseñas inválidas y cadenas vacías", () => {
    mockSessionStorage.clear();
    assert.strictEqual(AdminMarketing.unlock('1234'), false, "Clave incorrecta debe ser rechazada");
    assert.strictEqual(AdminMarketing.unlock('ADMIN'), false, "ADMIN no es la clave");
    assert.strictEqual(AdminMarketing.unlock('noa21'), false, "La clave es case-sensitive (NOA21)");
    assert.strictEqual(AdminMarketing.unlock(''), false, "Clave vacía debe ser rechazada");
    assert.strictEqual(AdminMarketing.unlock(null), false, "null debe ser rechazado");
    assert.strictEqual(AdminMarketing.isUnlocked(), false, "isUnlocked() debe continuar siendo false");
});

runTest("Desbloquea con la clave correcta 'NOA21' (incluso con espacios laterales)", () => {
    mockSessionStorage.clear();
    const ok = AdminMarketing.unlock('  NOA21  ');
    assert.strictEqual(ok, true, "unlock('  NOA21  ') debe retornar true");
    assert.strictEqual(AdminMarketing.isUnlocked(), true, "isUnlocked() debe ser true");
    assert.strictEqual(mockSessionStorage.getItem('sp_marketing_unlocked'), 'NOA21', "sessionStorage debe guardar 'NOA21'");
});

runTest("Botón Bloquear (lock) revoca la sesión inmediatamente", () => {
    AdminMarketing.lock();
    assert.strictEqual(AdminMarketing.isUnlocked(), false, "Tras lock(), isUnlocked() debe ser false");
    assert.strictEqual(mockSessionStorage.getItem('sp_marketing_unlocked'), null, "sessionStorage debe limpiarse");
});

runTest("Pantalla del Vault renderiza input, botón y muestra error si la clave falla", () => {
    const container = global.document.getElementById('content-area');
    AdminMarketing.renderVault('Contraseña incorrecta. Acceso denegado a Superadmin.');
    assert(container.innerHTML.includes('SUPERADMIN SECURITY VAULT'), "Debe incluir el título del búnker");
    assert(container.innerHTML.includes('vault-pass-input'), "Debe incluir el input para la clave");
    assert(container.innerHTML.includes('Contraseña incorrecta. Acceso denegado a Superadmin.'), "Debe mostrar el mensaje de error");
    assert(container.innerHTML.includes('DESBLOQUEAR BÚNKER'), "Debe incluir el botón de submit");
});

runTest("Alternar visibilidad de contraseña (togglePasswordVisibility)", () => {
    const passInput = global.document.getElementById('vault-pass-input');
    const eyeIcon = global.document.getElementById('vault-eye-icon');
    passInput.type = 'password';
    AdminMarketing.togglePasswordVisibility();
    assert.strictEqual(passInput.type, 'text', "type debe cambiar a text");
    assert.strictEqual(eyeIcon.className, 'fas fa-eye-slash', "Icono debe cambiar a eye-slash");
    AdminMarketing.togglePasswordVisibility();
    assert.strictEqual(passInput.type, 'password', "type debe volver a password");
    assert.strictEqual(eyeIcon.className, 'fas fa-eye', "Icono debe volver a eye");
});

// =============================================================================
// FASE 3: PESTAÑA 1 — PRESENTACIÓN, DOSSIER Y GENERADOR DE TEXTOS
// =============================================================================
console.log("\n▶️ FASE 3: Pestaña 1 (Pitch Deck 7 Slides, Dossier Ejecutivo, Textos Copiables)");

runTest("Pitch Deck contiene exactamente 7 slides estructurados", () => {
    AdminMarketing.unlock('NOA21');
    AdminMarketing.switchTab('dossier');
    AdminMarketing.switchDossierMode('slides');
    
    assert.strictEqual(AdminMarketing.totalSlides, 7, "totalSlides debe ser 7");
    
    // Slide 1
    AdminMarketing.goToSlide(0);
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('STK (Shot To Kill) × SOMOSPADEL'), "Slide 1 debe tener título STK x SOMOSPADEL");
    assert(html.includes('200+'), "Slide 1 debe destacar +200 jugadores");
    assert(html.includes('8'), "Slide 1 debe destacar 8 equipos");

    // Slide 2
    AdminMarketing.goToSlide(1);
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('La Comunidad en Cifras Reales'), "Slide 2 debe detallar cifras reales");
    assert(html.includes('Barcelona Pádel El Prat'), "Slide 2 debe mencionar la Sede Central");

    // Slide 3: Factor Diferencial App SomosPadel
    AdminMarketing.goToSlide(2);
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('El Factor Diferencial: LA APP SOMOSPADEL'), "Slide 3 debe poner en valor la APP");
    assert(html.includes('No somos un simple grupo de WhatsApp'), "Slide 3 debe contrastar con grupos de WhatsApp");
    assert(html.includes('plataforma tecnológica PWA') || html.includes('APP PWA INSTALABLE'), "Slide 3 debe destacar la app instalable");
    assert(html.includes('2.400'), "Slide 3 debe proyectar 2.400 aperturas al mes");

    // Slide 4: ROI y Prescriptores
    AdminMarketing.goToSlide(3);
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('PATROCINIO TRADICIONAL (1 Jugador)'), "Slide 4 debe comparar con 1 jugador profesional");
    assert(html.includes('200 prescriptores'), "Slide 4 debe destacar los 200 prescriptores");

    // Slide 5: Ejes Win-Win
    AdminMarketing.goToSlide(4);
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('TEST DAYS EN EL PRAT'), "Slide 5 debe incluir Test Days");
    assert(html.includes('PREMIOS & WELCOME PACKS'), "Slide 5 debe incluir Premios");
    assert(html.includes('EQUIPACIONES 8 EQUIPOS'), "Slide 5 debe incluir Equipaciones");

    // Slide 6: Hoja de Ruta Ágil (Piloto 3 meses)
    AdminMarketing.goToSlide(5);
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Piloto de 3 Meses'), "Slide 6 debe proponer el piloto de 3 meses");
    assert(html.includes('MES 1: LANZAMIENTO & TEST'), "Slide 6 debe definir el Mes 1");

    // Slide 7: Contacto Directo
    AdminMarketing.goToSlide(6);
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Alex Coscolin'), "Slide 7 debe contener datos de Alex Coscolin");
    assert(html.includes('Barcelona Pádel El Prat'), "Slide 7 debe confirmar la sede central");
});

runTest("Navegación de slides respeta los límites (0 a 6)", () => {
    AdminMarketing.goToSlide(0);
    AdminMarketing.prevSlide(); // no puede ser menor a 0
    assert.strictEqual(AdminMarketing.currentSlide, 0, "No debe descender por debajo de 0");
    
    for (let i = 0; i < 15; i++) AdminMarketing.nextSlide();
    assert.strictEqual(AdminMarketing.currentSlide, 6, "No debe superar el límite de 6 (total 7 slides)");
    
    AdminMarketing.goToSlide(999);
    assert.strictEqual(AdminMarketing.currentSlide, 6, "goToSlide con índice fuera de rango no debe cambiar");
    
    AdminMarketing.goToSlide(3);
    assert.strictEqual(AdminMarketing.currentSlide, 3, "goToSlide(3) debe posicionar en el slide 3");
});

runTest("Dossier Ejecutivo contiene estilos @media print y estructura completa", () => {
    AdminMarketing.switchDossierMode('executive');
    const html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('printable-executive-dossier'), "Debe tener clase printable-executive-dossier");
    assert(html.includes('@media print'), "Debe incluir estilos para exportación/impresión");
    assert(html.includes('Resumen Ejecutivo'), "Debe incluir sección 1. Resumen Ejecutivo");
    assert(html.includes('Métricas y Alcance Clave'), "Debe incluir sección 2. Métricas y Alcance");
    assert(html.includes('Plan Operativo de Activación'), "Debe incluir tabla de activación operativa");
    assert(html.includes('Compromiso de Inicio Ágil (Piloto 90 Días)'), "Debe incluir la cláusula del piloto de 90 días");
    assert(html.includes('Alex Coscolin — Fundador & Coordinador General'), "Debe incluir firma de Alex Coscolin");
    assert(html.includes('Kilian / Equipo STK'), "Debe incluir bloque de firma para STK");
});

runTest("El Dossier PDF contiene exactamente las 5 Páginas A4 Editoriales requeridas", () => {
    AdminMarketing.switchDossierMode('executive');
    const html = global.document.getElementById('content-area').innerHTML;
    
    // Verificación de las 5 páginas A4
    assert(html.includes('pdf-page-1'), "Debe incluir la Página 1 de portada");
    assert(html.includes('pdf-page-2'), "Debe incluir la Página 2 de comunidad y números");
    assert(html.includes('pdf-page-3'), "Debe incluir la Página 3 del factor tecnológico App");
    assert(html.includes('pdf-page-4'), "Debe incluir la Página 4 de comparativa comercial y 5 pilares");
    assert(html.includes('pdf-page-5'), "Debe incluir la Página 5 de plan piloto y firmas");

    // Página 1: Portada
    assert(html.includes('PROPUESTA ESTRATÉGICA DE COOPATROCINIO & ACTIVACIÓN DE MARCA'), "Página 1 debe incluir título principal");
    assert(html.includes('img/logo_somospadel.png'), "Página 1 debe incluir el logo oficial de SomosPadel (img/logo_somospadel.png)");
    assert(html.includes('pdf-page-1') && html.includes('background: #ffffff !important'), "Página 1 debe tener fondo blanco");
    assert(html.includes('Página 1 de 5'), "Página 1 debe tener pie de página 1 de 5");

    // Página 2: Métricas
    assert(html.includes('+190-200') || html.includes('190 - 200'), "Página 2 debe incluir +190-200 jugadores");
    assert(html.includes('8 Equipos'), "Página 2 debe incluir 8 equipos");
    assert(html.includes('Liga Summa Pádel'), "Página 2 debe incluir Liga Summa Pádel");
    assert(html.includes('52 Semanas'), "Página 2 debe incluir 52 semanas");
    assert(html.includes('Página 2 de 5'), "Página 2 debe tener pie de página 2 de 5");

    // Página 3: Modo Dios Tecnológico App
    assert(html.includes('EL FACTOR DIFERENCIAL DEFINITIVO: LA APP SOMOSPADEL'), "Página 3 debe ensalzar la App");
    assert(html.includes('Banner Oficial en la Home'), "Página 3 debe detallar el banner en home");
    assert(html.includes('Tienda Oficial Integrada'), "Página 3 debe detallar la tienda integrada");
    assert(html.includes('Algoritmo ELO Propio'), "Página 3 debe detallar el algoritmo ELO");
    assert(html.includes('Página 3 de 5'), "Página 3 debe tener pie de página 3 de 5");

    // Página 4: Comparativa y 5 pilares
    assert(html.includes('POR QUÉ SOMOSPADEL vs PATROCINIO TRADICIONAL'), "Página 4 debe contrastar con patrocinio tradicional");
    assert(html.includes('1. Test Days de Palas'), "Página 4 debe incluir Pilar 1");
    assert(html.includes('2. Premios & Torneos'), "Página 4 debe incluir Pilar 2");
    assert(html.includes('3. Equipaciones Liga Summa'), "Página 4 debe incluir Pilar 3");
    assert(html.includes('4. Escaparate en App'), "Página 4 debe incluir Pilar 4");
    assert(html.includes('5. Tarifas & Descuento'), "Página 4 debe incluir Pilar 5");
    assert(html.includes('Página 4 de 5'), "Página 4 debe tener pie de página 4 de 5");

    // Página 5: Piloto y firmas
    assert(html.includes('PLAN PILOTO DE 90 DÍAS & FORMALIZACIÓN'), "Página 5 debe incluir hoja de ruta");
    assert(html.includes('Resumen de Compromisos Mutuos'), "Página 5 debe detallar compromisos");
    assert(html.includes('Página 5 de 5'), "Página 5 debe tener pie de página 5 de 5");
});

runTest("Barra de Herramientas y Botón 'Descargar / Imprimir PDF Oficial' funcionan", () => {
    AdminMarketing.switchTab('dossier');
    let printed = false;
    const oldPrint = global.window.print;
    global.window.print = () => { printed = true; };

    AdminMarketing.triggerPrintPdf();
    assert.strictEqual(printed, true, "triggerPrintPdf debe llamar a window.print()");
    assert.strictEqual(AdminMarketing.dossierMode, 'executive', "triggerPrintPdf debe activar el modo executive");

    // Probar método de impresión en ventana limpia / aislada
    let isolatedPrinted = false;
    global.window.print = () => { isolatedPrinted = true; };
    AdminMarketing.printIsolatedDossier();
    assert.strictEqual(isolatedPrinted, true, "printIsolatedDossier debe llamar a window.print() en entorno de testing o abrir iframe");

    global.window.print = oldPrint;
});

runTest("Modo Edición Rápida en Pantalla (toggleInlineEditMode) activa contenteditable y campos editables", () => {
    AdminMarketing.switchDossierMode('executive');
    assert.strictEqual(AdminMarketing.isInlineEditMode, false, "Inicialmente debe estar desactivado");

    AdminMarketing.toggleInlineEditMode();
    assert.strictEqual(AdminMarketing.isInlineEditMode, true, "toggleInlineEditMode debe activar el modo edición");

    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('contenteditable="true"'), "Los campos deben tener contenteditable=true");
    assert(html.includes('data-text-key='), "Los campos deben tener atributo data-text-key");
    assert(html.includes('Guardar Cambios'), "Debe mostrar botón de Guardar Cambios");
    assert(html.includes('Restablecer Textos Originales'), "Debe mostrar botón de restablecer");

    AdminMarketing.toggleInlineEditMode();
    assert.strictEqual(AdminMarketing.isInlineEditMode, false, "toggleInlineEditMode de nuevo debe desactivar el modo");
});

runTest("Edición y Persistencia de Textos del Dossier (saveCustomTexts y localStorage)", () => {
    mockLocalStorage.clear();
    AdminMarketing.saveCustomTexts({
        p1_motto: '"Propuesta Exclusiva 2026: Liderazgo en el Pádel Catalán"',
        p2_metric1_val: '+250 Jugadores',
        p3_banner_tag: 'CANAL VIP PREMIUM'
    });

    assert.strictEqual(AdminMarketing.getText('p1_motto'), '"Propuesta Exclusiva 2026: Liderazgo en el Pádel Catalán"');
    assert.strictEqual(AdminMarketing.getText('p2_metric1_val'), '+250 Jugadores');

    // Comprobar persistencia en localStorage
    const saved = JSON.parse(mockLocalStorage.getItem('sp_marketing_custom_texts_v1'));
    assert(saved, "Los textos editados deben guardarse en sp_marketing_custom_texts_v1");
    assert.strictEqual(saved.p1_motto, '"Propuesta Exclusiva 2026: Liderazgo en el Pádel Catalán"');

    // Comprobar que se refleja en el HTML del dossier
    AdminMarketing.switchDossierMode('executive');
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Propuesta Exclusiva 2026: Liderazgo en el Pádel Catalán'), "El lema modificado debe aparecer en la portada");
    assert(html.includes('+250 Jugadores'), "La métrica modificada debe aparecer en la página 2");

    // Restablecer textos
    AdminMarketing.resetCustomTexts();
    assert.strictEqual(mockLocalStorage.getItem('sp_marketing_custom_texts_v1'), null, "resetCustomTexts debe borrar del storage");
    assert.strictEqual(AdminMarketing.getText('p1_motto'), '"Retorno real en ventas, comunidad activa de pádel y tecnología propia en pista".');
});

runTest("Editor de Contenidos Estructurado (Modo 'editor') contiene todas las secciones y textarea autoexpandibles", () => {
    AdminMarketing.switchDossierMode('editor');
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Editor de Contenidos del Dossier'), "Debe mostrar el título del editor");
    assert(html.includes('PÁGINA 1: PORTADA'), "Debe incluir sección Página 1");
    assert(html.includes('PÁGINA 2: COMUNIDAD & MÉTRICAS'), "Debe incluir sección Página 2");
    assert(html.includes('PÁGINA 3: TECNOLOGÍA & APP SOMOSPADEL'), "Debe incluir sección Página 3");
    assert(html.includes('PÁGINA 4: COMPARATIVA & PLAN DE ACTIVACIÓN'), "Debe incluir sección Página 4");
    assert(html.includes('PÁGINA 5: PLAN PILOTO 90 DÍAS & COMPROMISOS'), "Debe incluir sección Página 5");
    assert(html.includes('Guardar Todos los Textos'), "Debe incluir botón para guardar");

    // Verificar clases y estilos de no-aplastamiento de textareas
    assert(html.includes('class="ed-textarea ed-textarea-large"'), "Debe tener clase ed-textarea para los párrafos");
    assert(html.includes('min-height: 120px !important'), "Debe forzar min-height cómodo en textareas");
    assert(html.includes('min-height: 145px !important'), "Debe forzar min-height ampliado en párrafos largos");
    assert(!html.includes('&lt;strong&gt;SomosPadel'), "Textarea no debe contener tags HTML sucios en edición");
});

runTest("Limpieza de HTML en edición (stripHtml / cleanForEditor) y visualización", () => {
    const raw = "<strong>SomosPadel</strong> es <b>genial</b><br>en pista";
    const cleaned = AdminMarketing.cleanForEditor(raw);
    assert.strictEqual(cleaned, "SomosPadel es genial\nen pista", "cleanForEditor debe limpiar tags y convertir br a newline");
    const formatted = AdminMarketing.formatDisplayText("Línea 1\nLínea 2");
    assert.strictEqual(formatted, "Línea 1<br/>Línea 2", "formatDisplayText debe convertir newlines a <br/>");
});

runTest("Regla global de textarea en admin.html y style.css no aplasta a 42px", () => {
    const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
    assert(adminHtml.includes('textarea, .modal-content textarea'), "admin.html debe tener regla específica para textarea");
    assert(adminHtml.includes('min-height: 90px !important'), "admin.html debe dar min-height: 90px a textareas");
    assert(!adminHtml.match(/textarea[^{]*\{[^}]*height:\s*42px\s*!important/i), "admin.html NO debe forzar height: 42px !important en textarea");

    const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
    assert(styleCss.includes('textarea {') && styleCss.includes('min-height: 90px !important'), "style.css debe garantizar min-height en textarea");
});

runTest("Verificación de Reglas CSS de Impresión (@media print) contra corte de 5 páginas", () => {
    const cssPath = path.join(__dirname, '../css/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert(cssContent.includes('@media print'), "style.css debe contener reglas @media print");
    assert(cssContent.includes('.app-shell, .main-wrapper, .workspace-area, #content-area'), "Debe anular restricciones de layout en ancestros");
    assert(cssContent.includes('overflow: visible !important'), "Debe liberar overflow a visible");
    assert(cssContent.includes('position: static !important'), "Debe liberar position a static");
    assert(cssContent.includes('page-break-after: always !important'), "Debe forzar salto de página entre hojas");
    assert(cssContent.includes('.pdf-page'), "Debe definir propiedades de página para .pdf-page");
});


runTest("Personalización de Datos de la Propuesta (custom mode) y persistencia", () => {
    AdminMarketing.switchDossierMode('custom');
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Personalizar Datos del Dossier & Propuesta'), "Debe renderizar formulario de personalización");
    assert(html.includes('prop-brand-name'), "Debe incluir input para nombre de la marca");

    // Guardar nuevos datos personalizados
    AdminMarketing.saveProposalData({
        brandName: 'STK PADEL PRO',
        brandContact: 'Kilian Caro (CEO)',
        venueMain: 'Barcelona Pádel El Prat'
    });

    assert.strictEqual(AdminMarketing.proposalData.brandName, 'STK PADEL PRO', "brandName debe actualizarse");
    assert.strictEqual(AdminMarketing.proposalData.brandContact, 'Kilian Caro (CEO)', "brandContact debe actualizarse");
    assert.strictEqual(AdminMarketing.dossierMode, 'executive', "saveProposalData debe cambiar a modo executive");

    // Verificar que los datos se reflejan en el PDF
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('STK PADEL PRO'), "El nuevo nombre debe reflejarse en el PDF");
    assert(html.includes('Kilian Caro (CEO)'), "El nuevo interlocutor debe reflejarse en el PDF");

    // Restaurar defaults para no afectar otros tests
    AdminMarketing.saveProposalData({
        brandName: 'STK (Shot To Kill)',
        brandContact: 'Kilian Caro / Equipo STK'
    });
});

runTest("Generador de Textos provee Email Formal, WhatsApp con enlace y Elevator Pitch", () => {
    AdminMarketing.switchDossierMode('texts');
    const html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Email Formal Post-Reunión (STK)'), "Debe proveer la plantilla de Email Formal");
    assert(html.includes('Mensaje Ágil de WhatsApp para Kilian / STK'), "Debe proveer mensaje directo de WhatsApp");
    assert(html.includes('https://wa.me/?text='), "Debe generar enlace wa.me con texto encodeado");
    assert(html.includes('Pitch Ejecutivo de 1 Minuto (Elevator Pitch)'), "Debe proveer el elevator pitch");
    assert(html.includes('copyToClipboard'), "Debe contar con botones de copiado en 1 clic");
});

// =============================================================================
// FASE 4: PESTAÑAS 2, 3 Y 4 — ACTIVACIONES, SHOWCASE APP, CALCULADORA ROI
// =============================================================================
console.log("\n▶️ FASE 4: Pestañas 2, 3 y 4 (Activaciones, Showcase Digital, ROI y Notas)");

runTest("Pestaña 2: Plan de Activaciones con Matriz de 4 Fases y Checklist persistente", () => {
    mockLocalStorage.clear();
    AdminMarketing.switchTab('activaciones');
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('ROADMAP DE ACTIVACIÓN STK × SOMOSPADEL'), "Debe mostrar el roadmap");
    assert(html.includes('FASE 1 • SEMANAS 1-2'), "Debe incluir Fase 1");
    assert(html.includes('FASE 2 • MES 1-2'), "Debe incluir Fase 2");
    assert(html.includes('FASE 3 • MES 2-3'), "Debe incluir Fase 3");
    assert(html.includes('FASE 4 • MES 3+'), "Debe incluir Fase 4");
    assert(html.includes('Checklist Operativo de Activación'), "Debe incluir el checklist interactivo");

    // Toggle de tarea y persistencia en localStorage
    AdminMarketing.toggleTask('t2');
    const storedTasks = JSON.parse(mockLocalStorage.getItem('sp_marketing_tasks_v1'));
    assert(storedTasks, "Las tareas deben persistirse en localStorage");
    const t2 = storedTasks.find(t => t.id === 't2');
    assert(t2 && t2.done === true, "La tarea t2 debe estar marcada como done: true");

    // Restablecer checklist
    AdminMarketing.resetTasks();
    assert.strictEqual(mockLocalStorage.getItem('sp_marketing_tasks_v1'), null, "resetTasks debe limpiar la clave");
});

runTest("Pestaña 3: Showcase App con Smartphone interactivo y 3 vistas simuladas", () => {
    AdminMarketing.switchTab('app_showcase');
    
    // Vista Banner Home
    AdminMarketing.switchAppMockup('banner');
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('STK SHOT TO KILL ⚡'), "Mockup banner debe mostrar STK SHOT TO KILL");
    assert(html.includes('Reservar Pala de Test 🎾'), "Mockup banner debe tener botón de reservar pala");

    // Vista Push Notification
    AdminMarketing.switchAppMockup('push');
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('¡Prueba las nuevas palas STK!'), "Mockup push debe mostrar notificación de prueba");
    assert(html.includes('SOMOSPADEL • AHORA'), "Mockup push debe emular cabecera de notificación");

    // Vista Tienda Oficial
    AdminMarketing.switchAppMockup('store');
    html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Pala STK Carbon Pro Edition'), "Mockup tienda debe mostrar la ficha del producto");
    assert(html.includes('Pedir por WhatsApp Club'), "Mockup tienda debe tener botón de compra directa");
});

runTest("Pestaña 4: Calculadora interactiva de ROI y Bloc de Notas de Negociación", () => {
    mockLocalStorage.clear();
    AdminMarketing.switchTab('roi_calc');
    let html = global.document.getElementById('content-area').innerHTML;
    assert(html.includes('Simulador de Retorno e Impactos Mensuales'), "Debe tener el simulador de impactos");
    assert(html.includes('Notas de Negociación STK'), "Debe incluir el bloc de notas");

    // Simular inputs de rango y ejecución de updateRoiCalc()
    const rPlayers = global.document.getElementById('roi-players-range');
    const rSessions = global.document.getElementById('roi-sessions-range');
    const rApp = global.document.getElementById('roi-app-range');
    rPlayers.value = '300';
    rSessions.value = '20';
    rApp.value = '15';

    AdminMarketing.updateRoiCalc();

    const impEl = global.document.getElementById('calc-app-impressions');
    const hoursEl = global.document.getElementById('calc-court-hours');
    const testsEl = global.document.getElementById('calc-tests-month');
    const valEl = global.document.getElementById('calc-media-value');

    // 300 jugadores * 15 aperturas = 4500 impresiones
    const expectedImp = (4500).toLocaleString('es-ES');
    assert(impEl.textContent === expectedImp || impEl.textContent === '4.500' || impEl.textContent === '4500', "Impresiones estimadas deben coincidir con cálculo");
    // 300 * 20 * 0.1 = 600 horas
    assert.strictEqual(hoursEl.textContent, '600 h', "Horas de exposición deben ser 600 h");
    // 300 * 0.24 = 72 palas
    assert.strictEqual(testsEl.textContent, '~72 palas', "Pruebas estimadas deben ser ~72 palas");
    // Valor = (4500 * 0.05) + (600 * 2.5) + (72 * 5) = 225 + 1500 + 360 = 2085 €
    const expectedVal = (2085).toLocaleString('es-ES') + ' €';
    assert(valEl.textContent === expectedVal || valEl.textContent === '2.085 €' || valEl.textContent === '2085 €', "Media Value Equivalent debe coincidir con cálculo");

    // Guardado de notas en localStorage
    const textarea = global.document.getElementById('marketing-meeting-notes');
    textarea.value = 'Reunión 11/10: Kilian aprueba envío de 3 palas de test.';
    AdminMarketing.saveNotesManual();
    assert.strictEqual(
        mockLocalStorage.getItem('sp_marketing_meeting_notes_v1'),
        'Reunión 11/10: Kilian aprueba envío de 3 palas de test.',
        "Notas deben quedar persistidas en localStorage"
    );
});

// =============================================================================
// RESUMEN GLOBAL DE RESULTADOS
// =============================================================================
console.log("\n================================================================");
console.log(` RESULTADOS QA: ${passedCount} PASADAS | ${failedCount} FALLIDAS`);
console.log("================================================================");

if (failedCount === 0) {
    console.log("🎉 ¡CERTIFICACIÓN DE CALIDAD APROBADA (100% OK)! Cero regresiones.");
    process.exit(0);
} else {
    console.error("🚨 SE DETECTARON FALLOS EN LA SUITE DE PRUEBAS.");
    process.exit(1);
}
