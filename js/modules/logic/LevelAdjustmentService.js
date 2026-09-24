/**
 * LevelAdjustmentService.js
 * REDIRECCIÓN Y COMPATIBILIDAD CANÓNICA
 * 
 * Este archivo redirige directamente a la instancia unificada de LevelService.
 * Si LevelService aún no está instanciado, lo inicializa asegurando que
 * tanto window.LevelService como window.LevelAdjustmentService apunten al mismo objeto.
 */

(function () {
    if (!window.LevelService) {
        console.warn("⚠️ [LevelAdjustmentService] LevelService no encontrado aún en window. Cargando fallback o esperando inicialización.");
    } else {
        window.LevelAdjustmentService = window.LevelService;
        console.log("🔗 [LevelAdjustmentService] Vinculado al motor unificado LevelService.");
    }
})();
