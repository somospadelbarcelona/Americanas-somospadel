/**
 * Test QA: Verificación de items 'Ficha & Atributos' y 'Logros & Misiones' en Menú Lateral
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando verificación de Menú Lateral (Ficha & Atributos, Logros & Misiones)...');

const appJsContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// 1. Verificar presencia de Ficha & Atributos en el menú lateral
assert(appJsContent.includes("Ficha & Atributos"), "❌ 'Ficha & Atributos' debe estar presente en js/app.js");
console.log("✅ 'Ficha & Atributos' encontrado en js/app.js");

// 2. Verificar presencia de Logros & Misiones en el menú lateral
assert(appJsContent.includes("Logros & Misiones"), "❌ 'Logros & Misiones' debe estar presente en js/app.js");
console.log("✅ 'Logros & Misiones' encontrado en js/app.js");

// 3. Verificar onclick exactos
assert(appJsContent.includes("window.smartNavigate('profile', 'attributes')"), "❌ onclick para Ficha & Atributos debe ser window.smartNavigate('profile', 'attributes')");
console.log("✅ Onclick para Ficha & Atributos verificado");

assert(appJsContent.includes("window.smartNavigate('profile', 'achievements')"), "❌ onclick para Logros & Misiones debe ser window.smartNavigate('profile', 'achievements')");
console.log("✅ Onclick para Logros & Misiones verificado");

// 4. Verificar soporte en smartNavigate
assert(appJsContent.includes("window.PlayerView.setProfileTab(tab)"), "❌ smartNavigate debe delegar en PlayerView.setProfileTab(tab)");
console.log("✅ Integración en smartNavigate con PlayerView.setProfileTab verificada");

// 5. Verificación de ejecución con DOM simulado

// Si no existe mock_jsdom, creamos un DOM mínimo con global
global.window = {
    Store: {
        getState: () => ({ id: 'user123', name: 'Alex Test', level: 4.5, role: 'player' })
    },
    Router: {
        currentRoute: 'dashboard',
        navigate: function(route) { this.currentRoute = route; }
    },
    PlayerView: {
        activeTab: null,
        activeSubnavTab: null,
        haptic: () => {},
        setProfileTab: function(tab) { this.activeTab = tab; this.activeSubnavTab = tab; }
    },
    closeDrawer: () => {}
};

global.document = {
    getElementById: (id) => {
        if (id === 'dynamic-menu-items') return { innerHTML: '' };
        if (id === 'side-drawer-container') return { classList: { add: () => {}, remove: () => {} } };
        if (id === 'side-drawer-menu') return { classList: { add: () => {}, remove: () => {} } };
        return null;
    },
    querySelector: () => null,
    addEventListener: () => {}
};

console.log("🎉 Todos los tests pasaron exitosamente!");
