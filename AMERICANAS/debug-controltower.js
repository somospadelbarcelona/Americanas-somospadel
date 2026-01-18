console.log("🔍 VERIFICACIÓN DE CONTROLTOWERVIEW");
console.log("¿Existe window.ControlTowerView?", typeof window.ControlTowerView);
console.log("¿Existe window.EventsController?", typeof window.EventsController);
console.log("¿Existe window.openResultsView?", typeof window.openResultsView);

// Intentar cargar ControlTowerView manualmente
if (typeof window.ControlTowerView === 'undefined') {
    console.error("❌ ControlTowerView NO está cargado");
    console.log("Verificando scripts cargados:");
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    scripts.forEach(s => {
        if (s.src.includes('ControlTower')) {
            console.log("Script ControlTower encontrado:", s.src, "loaded:", s.readyState || 'unknown');
        }
    });
} else {
    console.log("✅ ControlTowerView está correctamente cargado");
}
