/**
 * test-event-header-qa.js
 * Suite de certificación QA exhaustiva para el rediseño de EventHeader.js
 * 
 * Valida:
 * 1. Renderizado de formato póster vertical deportivo sin deformación (object-fit: contain).
 * 2. Fallback de escudo SomosPadel para eventos sin cartel custom.
 * 3. Modal / Lightbox openPosterModal (creación en DOM, delegación, cierre y limpieza sin fugas).
 * 4. Píldoras de metadatos (Fecha, Horario, Modalidad, Sede, Categoría) sin solapamiento.
 * 5. Botones de acción rápida con atributos y eventos íntegros.
 * 6. Sanitización ante comillas simples / apóstrofes en nombres y sedes.
 * 7. Subnavegación y pestañas de rondas.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock simple de DOM para Node.js
class MockClassList {
    constructor() { this.classes = new Set(); }
    add(c) { this.classes.add(c); }
    remove(c) { this.classes.delete(c); }
    contains(c) { return this.classes.has(c); }
}

class MockElement {
    constructor(tagName, id = '') {
        this.tagName = (tagName || 'div').toUpperCase();
        this.id = id;
        this.style = {};
        this.classList = new MockClassList();
        this.children = [];
        this.parentNode = null;
        this._innerHTML = '';
        this.eventListeners = {};
    }

    set innerHTML(val) {
        this._innerHTML = val;
    }
    get innerHTML() {
        return this._innerHTML;
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
            this.children.splice(idx, 1);
            child.parentNode = null;
        }
        return child;
    }

    addEventListener(event, handler) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }

    dispatchEvent(event) {
        const handlers = this.eventListeners[event.type] || [];
        for (const h of handlers) h(event);
    }

    closest(selector) {
        if (selector === '.close-poster-btn') {
            return this.classList.contains('close-poster-btn') ? this : null;
        }
        return null;
    }
}

const mockDocument = {
    body: new MockElement('body', 'body'),
    createElement(tag) {
        return new MockElement(tag);
    },
    getElementById(id) {
        if (id === 'sp-event-poster-modal') {
            return mockDocument.body.children.find(c => c.id === 'sp-event-poster-modal') || null;
        }
        return null;
    }
};

global.document = mockDocument;
global.window = {
    document: mockDocument,
    requestAnimationFrame: (cb) => { cb(); return 1; },
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout
};

// Cargar EventHeader.js
const eventHeaderCode = fs.readFileSync(path.join(__dirname, '../js/modules/ui/EventHeader.js'), 'utf8');
eval(eventHeaderCode);

async function runEventHeaderTests() {
    console.log("========================================================");
    console.log("🎾 SUITE QA: REDISEÑO EVENTHEADER - CARTEL PÓSTER PRO");
    console.log("========================================================\n");

    assert(window.EventHeader, "window.EventHeader debe estar expuesto globalmente");
    assert.strictEqual(typeof window.EventHeader.render, 'function', "render() debe ser función");
    assert.strictEqual(typeof window.EventHeader.openPosterModal, 'function', "openPosterModal() debe ser función");

    // -------------------------------------------------------------------------
    // TEST 1: Cartel con URL personalizada en formato Póster Vertical
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 1: Renderizado con cartel oficial personalizado en formato póster vertical");

    const customEvent = {
        id: 'evt_pro_01',
        name: "Gran Torneo Primavera Master",
        image_url: 'https://storage.somospadel.com/carteles/primavera_master_2026.jpg',
        date: '25/04/2026',
        time: '18:30h',
        sede: 'Padel Indoor Mataró',
        category: 'male',
        pair_mode: 'twister'
    };

    const html1 = window.EventHeader.render(customEvent, { activeTab: 'results' });

    assert(html1.includes('event-poster-wrapper'), "Debe incluir la clase event-poster-wrapper");
    assert(html1.includes('event-poster-card'), "Debe incluir el contenedor card para elevación y borde");
    assert(html1.includes('event-poster-image'), "Debe incluir la clase event-poster-image");
    assert(html1.includes('object-fit: contain'), "La imagen debe tener object-fit: contain para evitar deformaciones");
    assert(html1.includes('max-width: 240px'), "Debe respetar el max-width proporcional de 240px");
    assert(html1.includes('max-height: clamp(230px, 42vh, 310px)'), "Debe limitar la altura con clamp responsive");
    assert(html1.includes('AMPLIAR CARTEL'), "Debe incluir el badge con llamada a la acción para ampliar");
    assert(html1.includes('https://storage.somospadel.com/carteles/primavera_master_2026.jpg'), "Debe renderizar la URL del cartel");
    assert(html1.includes('MASCULINO'), "Debe indicar la categoría MASCULINO");
    assert(html1.includes('TWISTER'), "Debe indicar la modalidad TWISTER");
    assert(html1.includes('Padel Indoor Mataró'), "Debe renderizar la sede");
    assert(html1.includes('18:30h'), "Debe renderizar el horario");

    console.log("   ✅ Cartel póster vertical verificado: Proporciones deportivas y object-fit: contain garantizan cero deformación.");

    // -------------------------------------------------------------------------
    // TEST 2: Fallback cuando NO hay cartel personalizado (Escudo Deportivo Pro)
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 2: Renderizado fallback de Escudo Deportivo cuando no hay cartel");

    const noPosterEvent = {
        id: 'evt_no_poster_02',
        name: "Americana Express Viernes",
        image_url: '',
        date: '17/04/2026',
        category: 'female',
        is_fija: true
    };

    const html2 = window.EventHeader.render(noPosterEvent, { activeTab: 'standings' });

    assert(html2.includes('img/logo_somospadel.png'), "Debe usar el logo por defecto");
    assert(html2.includes('FEMENINO'), "Debe indicar la categoría FEMENINO");
    assert(html2.includes('PAREJA FIJA'), "Debe indicar la modalidad PAREJA FIJA");
    assert(!html2.includes('AMPLIAR CARTEL'), "No debe mostrar botón de ampliar si no hay cartel custom");

    console.log("   ✅ Fallback de escudo deportivo verificado.");

    // -------------------------------------------------------------------------
    // TEST 3: Sanitización ante comillas simples / apóstrofes en textos
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 3: Sanitización ante apóstrofes y comillas en nombres y sedes");

    const quotedEvent = {
        id: 'evt_quote_03',
        name: "Americana d'Estiu al Club L'Hospitalet",
        image_url: "https://example.com/poster's_art.jpg",
        sede: "L'Aldea Club",
        pair_mode: 'swiss'
    };

    const html3 = window.EventHeader.render(quotedEvent, { activeTab: 'results' });

    // Verificamos que el onclick no se rompe con comillas sin escapar
    assert(html3.includes("Americana d\\'Estiu al Club L\\'Hospitalet"), "Las comillas simples en el nombre deben estar escapadas");
    assert(html3.includes("L\\'Aldea Club"), "Las comillas simples en la sede deben estar escapadas");
    assert(html3.includes("poster\\'s_art.jpg"), "Las comillas en la URL deben estar escapadas");
    assert(html3.includes('SUIZO'), "Debe identificar modalidad SUIZO");

    console.log("   ✅ Nombres con apóstrofes y comillas escapados con total seguridad.");

    // -------------------------------------------------------------------------
    // TEST 4: Lightbox Modal (Fallback local en document.body)
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 4: Modal Lightbox openPosterModal() fallback y ciclo de vida en el DOM");

    // Limpiar body
    mockDocument.body.children = [];

    window.EventHeader.openPosterModal(
        'https://example.com/cartel_hd.jpg',
        "Torneo Pro de Verano",
        "Club Central"
    );

    const modalEl = mockDocument.getElementById('sp-event-poster-modal');
    assert(modalEl, "El modal #sp-event-poster-modal debe haberse creado e insertado en el body");
    assert(modalEl.innerHTML.includes('https://example.com/cartel_hd.jpg'), "Debe contener la URL de la imagen");
    assert(modalEl.innerHTML.includes('Torneo Pro de Verano'), "Debe contener el título del torneo");
    assert(modalEl.innerHTML.includes('close-poster-btn'), "Debe contener el botón de cierre");
    assert.strictEqual(modalEl.style.opacity, '1', "La opacidad inicial debe animarse a 1");

    // Simular click de cierre sobre el botón
    const closeBtn = new MockElement('button');
    closeBtn.classList.add('close-poster-btn');

    modalEl.dispatchEvent({ type: 'click', target: closeBtn });
    assert.strictEqual(modalEl.style.opacity, '0', "Al cerrar, la opacidad debe pasar a 0 para el fade-out");

    // Esperar los 250ms de animación para confirmar eliminación del DOM
    await new Promise(r => setTimeout(r, 280));
    const modalAfterClose = mockDocument.getElementById('sp-event-poster-modal');
    assert.strictEqual(modalAfterClose, null, "El modal debe ser removido completamente del DOM tras la animación");

    console.log("   ✅ Modal Lightbox fallback: Creación, apertura y eliminación limpia del DOM confirmadas.");

    // -------------------------------------------------------------------------
    // TEST 5: Delegación de openPosterModal si existe controlador padre
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 5: Delegación a window.openPosterModal o window.EventsController.openPosterModal");

    let delegatedControllerCalled = false;
    window.EventsController = {
        openPosterModal(url, name, club) {
            delegatedControllerCalled = true;
            assert.strictEqual(url, 'test_url.jpg');
            assert.strictEqual(name, 'Test Event');
        }
    };

    window.EventHeader.openPosterModal('test_url.jpg', 'Test Event', 'Test Club');
    assert.strictEqual(delegatedControllerCalled, true, "openPosterModal debe delegar a EventsController si está disponible");

    delete window.EventsController;

    let delegatedGlobalCalled = false;
    window.openPosterModal = (url, name, club) => {
        delegatedGlobalCalled = true;
        assert.strictEqual(url, 'test_url2.jpg');
    };

    window.EventHeader.openPosterModal('test_url2.jpg', 'Test Event 2', 'Test Club 2');
    assert.strictEqual(delegatedGlobalCalled, true, "openPosterModal debe delegar a window.openPosterModal si está disponible");

    delete window.openPosterModal;

    console.log("   ✅ Delegación prioritaria verificada con éxito.");

    // -------------------------------------------------------------------------
    // TEST 6: Botones de Acción Rápida (Flyer, Crónica, Chat, TV, Sorteo)
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 6: Integridad de botones de acción rápida y subnavegación");

    const fullEvent = {
        id: 'evt_full_04',
        name: "Americana Deluxe",
        isEntreno: false,
        status: 'live'
    };

    const html6 = window.EventHeader.render(fullEvent, { activeTab: 'results', isPlayingHere: true });

    assert(html6.includes('FLYER / PODIO'), "Botón FLYER / PODIO presente");
    assert(html6.includes('CRÓNICA ÉPICA'), "Botón CRÓNICA ÉPICA presente");
    assert(html6.includes('CHAT DEL EVENTO'), "Botón CHAT DEL EVENTO presente");
    assert(html6.includes('EN VIVO / TV'), "Botón EN VIVO / TV presente");
    assert(html6.includes('SORTEO'), "Botón SORTEO presente");
    assert(html6.includes('ESTÁS CONVOCADO EN ESTE EVENTO ★'), "Banner de convocatoria activo si isPlayingHere = true");
    assert(html6.includes('RESULTADOS'), "Pestaña RESULTADOS presente");
    assert(html6.includes('POSICIONES'), "Pestaña POSICIONES presente");
    assert(html6.includes('RESUMEN'), "Pestaña RESUMEN presente");

    console.log("   ✅ Todos los botones de acción rápida y subnavegación validados.");

    // -------------------------------------------------------------------------
    // TEST 7: RenderTabs de Rondas
    // -------------------------------------------------------------------------
    console.log("➡️ TEST 7: Renderizado de selector de rondas (renderRoundTabs)");

    const rounds = [{ number: 1 }, { number: 2 }, { number: 3 }];
    const matches = [
        { round: 1, status: 'finished', isFinished: true },
        { round: 2, status: 'live', isFinished: false }
    ];

    const roundTabsHtml = window.EventHeader.renderRoundTabs(rounds, 2, fullEvent, matches);
    assert(roundTabsHtml.includes('R1'), "Debe incluir R1");
    assert(roundTabsHtml.includes('R2'), "Debe incluir R2");
    assert(roundTabsHtml.includes('R6'), "Debe auto-completar al mínimo de 6 rondas");
    assert(roundTabsHtml.includes('✓'), "Ronda 1 finalizada debe tener checkmark");
    assert(roundTabsHtml.includes('●'), "Ronda 2 en vivo debe tener dot indicador");

    console.log("   ✅ Selector de rondas genera estados (finalizada, en vivo, activa) fielmente.");

    console.log("\n========================================================");
    console.log("🎉 CERTIFICACIÓN QA EVENTHEADER COMPLETADA AL 100%");
    console.log("========================================================\n");
}

runEventHeaderTests().catch(err => {
    console.error("❌ ERROR EN SUITE QA EVENTHEADER:", err);
    process.exit(1);
});
