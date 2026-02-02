// SCRIPT DE DIAGNÓSTICO RÁPIDO
// Copia y pega esto en la consola del navegador (F12)

console.clear();
console.log("=".repeat(60));
console.log("🔍 DIAGNÓSTICO DE CONTROLTOWERVIEW");
console.log("=".repeat(60));

// 1. Verificar si existe
console.log("\n1️⃣ ¿Existe window.ControlTowerView?");
console.log("   Tipo:", typeof window.ControlTowerView);
console.log("   Valor:", window.ControlTowerView);

// 2. Verificar EventsController
console.log("\n2️⃣ ¿Existe window.EventsController?");
console.log("   Tipo:", typeof window.EventsController);

// 3. Verificar openResultsView
console.log("\n3️⃣ ¿Existe window.openResultsView?");
console.log("   Tipo:", typeof window.openResultsView);

// 4. Verificar scripts cargados
console.log("\n4️⃣ Scripts de ControlTowerView cargados:");
const scripts = Array.from(document.querySelectorAll('script[src]'));
scripts.forEach(s => {
    if (s.src.includes('ControlTower')) {
        console.log("   ✓", s.src);
        console.log("     Estado:", s.readyState || 'loaded');
    }
});

// 5. Verificar errores en consola
console.log("\n5️⃣ Si ves errores arriba en rojo, cópialos y envíamelos.");

// 6. Test rápido
console.log("\n6️⃣ Test de carga:");
if (typeof window.ControlTowerView !== 'undefined') {
    console.log("   ✅ ControlTowerView está CARGADO correctamente");
    console.log("   Métodos disponibles:", Object.getOwnPropertyNames(Object.getPrototypeOf(window.ControlTowerView)));
} else {
    console.log("   ❌ ControlTowerView NO está cargado");
    console.log("   SOLUCIÓN: Ve a http://localhost:8000/clear-cache.html");
}

console.log("\n" + "=".repeat(60));
