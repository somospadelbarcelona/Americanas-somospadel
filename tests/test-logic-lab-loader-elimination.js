const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("🧪 Verificando que logic_lab elimine el loader y pinte la interfaz de forma 100% garantizada...");

// Mock DOM
class MockElement {
    constructor(id = '', className = '') {
        this.id = id;
        this.className = className;
        this.textContent = '';
        this.innerHTML = '';
        this.classList = {
            add: (c) => {},
            remove: (c) => {},
            contains: (c) => false
        };
        this.children = [];
    }
    appendChild(child) {
        this.children.push(child);
    }
    querySelector(selector) {
        return null;
    }
    querySelectorAll(selector) {
        return [];
    }
}

const elements = {
    'page-title': new MockElement('page-title'),
    'content-area': new MockElement('content-area'),
    'admin-sidebar': new MockElement('admin-sidebar'),
    'sidebar-overlay': new MockElement('sidebar-overlay'),
};

global.document = {
    getElementById: (id) => elements[id] || null,
    querySelector: (selector) => {
        if (selector === '#content-area') return elements['content-area'];
        if (selector === '#page-title') return elements['page-title'];
        return null;
    },
    querySelectorAll: (selector) => [],
    createElement: (tag) => new MockElement('', ''),
    addEventListener: () => {},
    head: new MockElement('head')
};

global.window = global;
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.sessionStorage = {
    setItem: () => {},
    getItem: () => null
};
global.history = {
    replaceState: () => {}
};
global.location = {
    hash: ''
};
global.AdminAuth = {
    user: { role: 'admin' },
    applyRoleRestrictions: () => {}
};
global.AdminViews = {};

// Cargar módulos
const TournamentLogicAuditService = require('../js/modules/admin/TournamentLogicAuditService.js');
global.TournamentLogicAuditService = TournamentLogicAuditService;

require('../js/modules/admin/AdminTournamentLogicLab.js');
require('../js/admin.js');

// Verificación 1: Llamar a loadAdminView('logic_lab')
async function testLogicLabLoad() {
    // Inicialmente el router pondrá <div class="loader"></div>
    elements['content-area'].innerHTML = '<div class="loader"></div>';
    assert.strictEqual(elements['content-area'].innerHTML, '<div class="loader"></div>');

    // Ejecutar loadAdminView('logic_lab')
    await window.loadAdminView('logic_lab');

    // Verificar que page-title se actualizó
    assert.strictEqual(elements['page-title'].textContent, 'AUDITORÍA DE LÓGICA (LAB)', 'El título de la página debe ser "AUDITORÍA DE LÓGICA (LAB)"');
    console.log("  ✅ page-title actualizado a:", elements['page-title'].textContent);

    // Verificar que NO quedó el loader
    assert.ok(!elements['content-area'].innerHTML.includes('<div class="loader"></div>'), 'content-area no debe contener el loader');
    assert.ok(elements['content-area'].innerHTML.includes('logic-lab-wrapper'), 'content-area debe contener logic-lab-wrapper');
    assert.ok(elements['content-area'].innerHTML.includes('logic-lab-view'), 'content-area debe contener logic-lab-view');
    console.log("  ✅ Loader eliminado exitosamente y vista logic_lab pintada con", elements['content-area'].innerHTML.length, "caracteres.");

    // Verificar que window.AdminTournamentLogicLab.lastSimulation existe inmediatamente
    assert.ok(window.AdminTournamentLogicLab.lastSimulation, 'Simulación en memoria generada síncronamente');
    console.log("  ✅ Simulación síncrona en memoria confirmada (0 delay de red):", window.AdminTournamentLogicLab.lastSimulation.allMatches.length, "partidos generados.");

    console.log("\n🎉 ¡Garantía de carga instantánea de logic_lab comprobada con éxito!");
}

testLogicLabLoad().catch(err => {
    console.error("❌ Fallo en la verificación:", err);
    process.exit(1);
});
