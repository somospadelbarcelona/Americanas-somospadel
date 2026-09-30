/**
 * test-community-home-qa.js
 * Test Suite de Control de Calidad (QA) para el Inicio de Comunidad de SomosPadel Barcelona
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("================================================================");
console.log(" 🧪 AUDITORÍA QA: INICIO DE COMUNIDAD SOMOSPADEL BARCELONA");
console.log("================================================================\n");

let passedCount = 0;
let failedCount = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedCount++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        failedCount++;
    }
}

// 1. Mock minimal browser environment
class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.style = {};
        this.classList = {
            _classes: new Set(),
            add(c) { this._classes.add(c); },
            remove(c) { this._classes.delete(c); },
            toggle(c, force) {
                if (force === undefined) {
                    if (this._classes.has(c)) this._classes.delete(c);
                    else this._classes.add(c);
                } else if (force) {
                    this._classes.add(c);
                } else {
                    this._classes.delete(c);
                }
            },
            contains(c) { return this._classes.has(c); }
        };
        this.attributes = new Map();
    }
    setAttribute(name, val) { this.attributes.set(name, String(val)); }
    getAttribute(name) { return this.attributes.get(name) || null; }
    querySelector(sel) { return null; }
    querySelectorAll(sel) { return []; }
    remove() {}
}

const mockElements = new Map();
function getOrCreateElement(id, tag = 'div') {
    if (!mockElements.has(id)) {
        mockElements.set(id, new MockElement(id, tag));
    }
    return mockElements.get(id);
}

// Pre-create known elements
getOrCreateElement('content-area');
getOrCreateElement('ch-article-modal-overlay');
getOrCreateElement('ch-article-modal-content');
getOrCreateElement('ch-filter-pills');
getOrCreateElement('ch-news-grid');

const mockDocument = {
    getElementById(id) {
        return getOrCreateElement(id);
    },
    createElement(tag) {
        return new MockElement('', tag);
    },
    querySelectorAll(sel) {
        return [];
    },
    body: getOrCreateElement('body', 'body')
};

const listeners = {};
const mockWindow = {
    document: mockDocument,
    navigator: { vibrate: () => {} },
    location: { search: '', hash: '#comunidad' },
    addEventListener(evt, fn) {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
    },
    removeEventListener(evt, fn) {
        if (listeners[evt]) {
            listeners[evt] = listeners[evt].filter(f => f !== fn);
        }
    },
    open: (url) => { mockWindow._lastOpenedUrl = url; },
    scrollTo: () => {}
};

mockWindow.window = mockWindow;
global.window = mockWindow;
global.document = mockDocument;

// 2. Load View
const viewPath = path.resolve(__dirname, '../js/modules/community/CommunityHomeView.js');
const viewCode = fs.readFileSync(viewPath, 'utf8');
eval(viewCode);

// 3. Load Controller
const controllerPath = path.resolve(__dirname, '../js/modules/community/CommunityHomeController.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');
eval(controllerCode);

(async () => {
    await test("CommunityHomeView se registra en global.window", () => {
        assert(window.CommunityHomeView, "CommunityHomeView debe existir en window");
        assert(typeof window.CommunityHomeView.render === 'function', "render debe ser función");
        assert(typeof window.CommunityHomeView.filterArticles === 'function', "filterArticles debe ser función");
        assert(typeof window.CommunityHomeView.renderArticlesGrid === 'function', "renderArticlesGrid debe ser función");
        assert(typeof window.CommunityHomeView.showArticleModal === 'function', "showArticleModal debe ser función");
        assert(typeof window.CommunityHomeView.closeArticleModal === 'function', "closeArticleModal debe ser función");
    });

    await test("CommunityHomeController se registra en global.window", () => {
        assert(window.CommunityHomeController, "CommunityHomeController debe existir en window");
        assert(typeof window.CommunityHomeController.init === 'function', "init debe ser función");
        assert(typeof window.CommunityHomeController.getCuratedArticles === 'function', "getCuratedArticles debe ser función");
        assert(typeof window.CommunityHomeController.setCategoryFilter === 'function', "setCategoryFilter debe ser función");
        assert(typeof window.CommunityHomeController.openArticleModal === 'function', "openArticleModal debe ser función");
        assert(typeof window.CommunityHomeController.destroy === 'function', "destroy debe ser función");
    });

    await test("CommunityHomeController provee artículos curados oficiales con formato íntegro", () => {
        const articles = window.CommunityHomeController.getCuratedArticles();
        assert(Array.isArray(articles) && articles.length >= 4, "Debe contener al menos 4 artículos oficiales");
        
        articles.forEach(art => {
            assert(art.id, "Cada artículo debe tener id");
            assert(art.title, "Cada artículo debe tener título");
            assert(art.categoryKey, "Cada artículo debe tener categoryKey");
            assert(art.snippet, "Cada artículo debe tener snippet");
            assert(art.content, "Cada artículo debe tener content");
        });

        const hasFairPlay = articles.some(a => a.id === 'fair-play-honor');
        assert(hasFairPlay, "Debe incluir el artículo de Código Fair Play");
    });

    await test("CommunityHomeController.init() carga artículos y renderiza el Hub en content-area sin errores", async () => {
        await window.CommunityHomeController.init();
        const content = mockDocument.getElementById('content-area');
        assert(content.innerHTML.includes('community-home-wrapper'), "El HTML debe contener community-home-wrapper");
        assert(content.innerHTML.includes('COMUNIDAD SOMOSPADEL'), "Debe contener el título principal");
        assert(content.innerHTML.includes('ch-stats-grid'), "Debe incluir la cuadrícula de KPIs");
        assert(content.innerHTML.includes('ch-hub-grid'), "Debe incluir el grid de accesos directos");
        assert(content.innerHTML.includes('ch-news-grid'), "Debe incluir el grid de noticias");
        assert(content.innerHTML.includes('CÓDIGO DE HONOR SOMOSPADEL'), "Debe incluir el código de honor");
        assert(window.CommunityHomeController.state.articles.length > 0, "Debe haber cargado artículos en state");
    });

    await test("CommunityHomeView.filterArticles filtra correctamente por categoría", () => {
        const articles = window.CommunityHomeController.state.articles;
        const all = window.CommunityHomeView.filterArticles(articles, 'todas');
        assert.strictEqual(all.length, articles.length, "Todas debe devolver todos los artículos");

        const valores = window.CommunityHomeView.filterArticles(articles, 'valores');
        assert(valores.length > 0, "Debe haber artículos en 'valores'");
        valores.forEach(a => assert.strictEqual(a.categoryKey, 'valores'));

        const equipos = window.CommunityHomeView.filterArticles(articles, 'equipos');
        assert(equipos.length > 0, "Debe haber artículos en 'equipos'");
        equipos.forEach(a => assert.strictEqual(a.categoryKey, 'equipos'));

        const entrenos = window.CommunityHomeView.filterArticles(articles, 'entrenos');
        assert(entrenos.length > 0, "Debe haber artículos en 'entrenos'");
        entrenos.forEach(a => assert.strictEqual(a.categoryKey, 'entrenos'));
    });

    await test("CommunityHomeView.formatArticleContent parsea títulos y viñetas", () => {
        const markdown = "Intro\n\n### Título Sección\n\n• Elemento 1\n• Elemento 2\n\nTexto final.";
        const html = window.CommunityHomeView.formatArticleContent(markdown);
        assert(html.includes('<h4>Título Sección</h4>'), "Debe convertir ### en <h4>");
        assert(html.includes('<ul><li>Elemento 1</li><li>Elemento 2</li></ul>'), "Debe agrupar viñetas en <ul><li>");
        assert(html.includes('<p>Intro</p>'), "Debe envolver texto en <p>");
    });

    await test("CommunityHomeController.openArticleModal y closeArticleModal gestionan el modal", () => {
        const overlay = mockDocument.getElementById('ch-article-modal-overlay');
        const modalContent = mockDocument.getElementById('ch-article-modal-content');
        
        window.CommunityHomeController.openArticleModal('fair-play-honor');
        assert.strictEqual(overlay.style.display, 'flex', "Overlay debe abrirse en flex");
        assert(modalContent.innerHTML.includes('Código Fair Play'), "El contenido del modal debe tener el artículo");

        window.CommunityHomeController.closeArticleModal();
        assert.strictEqual(overlay.style.display, 'none', "Overlay debe cerrarse");
    });

    await test("CommunityHomeController.shareArticleWhatsApp genera la URL correcta", () => {
        window.CommunityHomeController.shareArticleWhatsApp('fair-play-honor');
        assert(mockWindow._lastOpenedUrl && mockWindow._lastOpenedUrl.startsWith('https://wa.me/?text='), "Debe abrir wa.me con el texto encodeado");
        assert(mockWindow._lastOpenedUrl.includes('SOMOSPADEL'), "Debe incluir mención al club");
    });

    await test("CommunityHomeController.navigateTo delega en window.Router.navigate", () => {
        let navigatedTo = null;
        window.Router = {
            navigate: (route) => { navigatedTo = route; }
        };
        window.CommunityHomeController.navigateTo('my_team');
        assert.strictEqual(navigatedTo, 'my_team', "Debe navegar a 'my_team'");
    });

    await test("CommunityHomeController.destroy limpia listeners y cierra modales", async () => {
        await window.CommunityHomeController.init();
        assert(window.CommunityHomeController.campaignListener !== null, "Debe tener campaignListener activo");
        window.CommunityHomeController.destroy();
        assert(window.CommunityHomeController.campaignListener === null, "campaignListener debe limpiarse");
    });

    // 4. Test Router Integration
    await test("Router.js tiene registradas las rutas de comunidad y gestiona subsecciones", () => {
        const routerPath = path.resolve(__dirname, '../js/core/Router.js');
        const routerCode = fs.readFileSync(routerPath, 'utf8');
        
        // Check routes declaration
        assert(routerCode.includes("'comunidad': () => this.handleCommunityRoute('home')"), "Ruta comunidad registrada");
        assert(routerCode.includes("'community': () => this.handleCommunityRoute('home')"), "Ruta community registrada");
        assert(routerCode.includes("'community_home': () => this.handleCommunityRoute('home')"), "Ruta community_home registrada");
        assert(routerCode.includes("'my_team': () => this.handleCommunityRoute('my_team')"), "Ruta my_team registrada");
        assert(routerCode.includes("'records': () => this.handleCommunityRoute('records')"), "Ruta records registrada");
        assert(routerCode.includes("'inscriptions': () => this.handleCommunityRoute('inscriptions')"), "Ruta inscriptions registrada");

        // Check cleanup
        assert(routerCode.includes("name: 'CommunityHomeController', routes: ['comunidad', 'community', 'community_home']"), "Cleanup de CommunityHomeController configurado");
    });

    // 5. Test index.html Scripts & Integrity
    await test("index.html incluye scripts de CommunityHomeView y CommunityHomeController en orden", () => {
        const indexPath = path.resolve(__dirname, '../index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');

        const viewIdx = indexContent.indexOf('js/modules/community/CommunityHomeView.js');
        const ctrlIdx = indexContent.indexOf('js/modules/community/CommunityHomeController.js');

        assert(viewIdx !== -1, "CommunityHomeView.js debe estar referenciado en index.html");
        assert(ctrlIdx !== -1, "CommunityHomeController.js debe estar referenciado en index.html");
        assert(viewIdx < ctrlIdx, "CommunityHomeView.js debe cargarse antes que CommunityHomeController.js");

        assert(indexContent.includes('id="nav-community"'), "Botón nav-community debe existir en index.html");
        assert(indexContent.includes("window.Router.navigate('comunidad')"), "Botón nav-community debe apuntar a la ruta 'comunidad'");
    });

    console.log("\n================================================================");
    console.log(` RESUMEN DE PRUEBAS QA INICIO DE COMUNIDAD:`);
    console.log(`  PASADAS: ${passedCount}`);
    console.log(`  FALLIDAS: ${failedCount}`);
    console.log("================================================================");

    if (failedCount === 0) {
        console.log("🎉 AUDITORÍA QA DE INICIO DE COMUNIDAD 100% SATISFACTORIA.");
        process.exit(0);
    } else {
        console.error("🚨 SE ENCONTRARON FALLOS EN LA AUDITORÍA DE INICIO DE COMUNIDAD.");
        process.exit(1);
    }
})();
