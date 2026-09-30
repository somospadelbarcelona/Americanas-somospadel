/**
 * QA MASTER AUDIT SUITE - SOMOSPADEL BARCELONA
 * Ejecuta todas las validaciones automatizadas de calidad técnica y estabilidad.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log("================================================================");
console.log(" 🏆 AUDITORÍA QA SOMOSPADEL: SUITE INTEGRAL DE CONTROL DE CALIDAD");
console.log("================================================================\n");

const nodeExec = process.execPath;
let overallStatus = true;
const reports = [];

function runSubtest(name, scriptPath) {
    console.log(`▶️ Ejecutando: ${name}...`);
    const fullPath = path.resolve(__dirname, scriptPath);
    const res = spawnSync(nodeExec, [fullPath], { encoding: 'utf8' });
    const passed = res.status === 0;
    if (passed) {
        console.log(`  ✅ PASADO: ${name}`);
    } else {
        console.error(`  ❌ FALLIDO: ${name}`);
        if (res.stderr) console.error(res.stderr.trim());
        if (res.stdout) console.log(res.stdout.trim());
        overallStatus = false;
    }
    reports.push({ name, passed });
}

// 1. Script Integrity Check
runSubtest("Integridad de scripts en HTML", "../tools/VERIFICAR_INTEGRIDAD_SCRIPTS.js");

// 2. Project Health & RGPD
runSubtest("Auditoría básica de proyecto", "../tools/VALIDAR_PROYECTO.js");

// 3. Pozo Logic (Fixed & Rotating)
runSubtest("Lógica de Pozo (Ascensos y Descensos)", "test-pozo-logic.js");

// 4. Twister Full Simulation (6 Rounds Open & Mixed)
runSubtest("Simulación completa Twister 6 Rondas", "test-twister-full.js");

// 5. Smart Ticker & Season Campaign Integration
runSubtest("Smart Ticker & Campaña Equipos", "test-smart-ticker-season-campaign.test.js");

// 6. Battle Ready Modal QA
runSubtest("Battle Ready Modal QA", "test-battle-ready-qa.js");

// 7. Community Home Hub QA
runSubtest("Inicio de Comunidad (CommunityHome QA)", "test-community-home-qa.js");

// 8. Gamification & Achievements System QA
runSubtest("Gamificación y Logros (Achievements QA)", "test-gamification-qa.js");

// 9. Round Advancement & Matchmaking Modes QA (Fixed Pairs, Twister, Suizo)
runSubtest("Avance de Rondas y Modalidades (Fixed, Twister, Suizo)", "test-round-advancement-qa.js");

// 10. Bolsa de Suplentes SOS & Matchmaking Inteligente QA
runSubtest("Bolsa de Suplentes SOS & Matchmaking Inteligente", "test-sos-substitutes-complete-qa.js");

// 11. Resumen Crónica Post-Torneo con IA & Instagram Stories QA
runSubtest("Crónica Post-Torneo con IA & Instagram Stories", "test-tournament-chronicle-complete-qa.js");

// 12. Radar de Climatología Avanzado & Alertas de Lluvia QA
runSubtest("Radar de Climatología Avanzado & Alertas de Lluvia", "test-weather-radar-complete-qa.js");

// 13. Visualización Completa de 6 Rondas & Tabs Compactos QA
runSubtest("Visualización Completa de 6 Rondas & Tabs Compactos", "test-round-tabs-qa.js");

// 14. Centro de Control & Auditoría de Lógica de Torneos y Entrenos QA
runSubtest("Centro de Control & Auditoría de Lógica de Torneos y Entrenos", "test-tournament-logic-lab-complete-qa.js");

// 15. Frontend Enhancements & Clonación Ficticia Lógica Lab QA
runSubtest("Mejoras de Frontend & Clonación Lógica Lab", "test-logic-lab-frontend-enhancements.js");

// 16. Eventos Finalizados y Reordenación de Submenús QA
runSubtest("Eventos Finalizados & Submenús Inmediatos", "test-finished-events-and-submenus-qa.js");

console.log("\n================================================================");
console.log(" RESUMEN GLOBAL DE CALIDAD:");
reports.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
});
console.log("================================================================");

if (overallStatus) {
    console.log("🎉 TODAS LAS SUITES DE PRUEBAS HAN PASADO SATISFACTORIAMENTE.");
    process.exit(0);
} else {
    console.error("🚨 SE HAN DETECTADO FALLOS EN LAS PRUEBAS AUTOMATIZADAS.");
    process.exit(1);
}
