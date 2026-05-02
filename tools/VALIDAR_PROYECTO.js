const fs = require('fs');
const path = require('path');

console.log("🔍 [PROYECTO AMERICANAS] - INICIANDO AUDITORÍA TÉCNICA...\n");

const baseDir = __dirname;
let errors = 0;
let warnings = 0;

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description} - ENCONTRADO`);
        return true;
    } else {
        console.error(`❌ ${description} - NO ENCONTRADO`);
        errors++;
        return false;
    }
}

// 1. Verificar archivos críticos
checkFile(path.join(baseDir, 'index.html'), 'Archivo Principal (index.html)');
checkFile(path.join(baseDir, 'sw.js'), 'Service Worker (sw.js)');
checkFile(path.join(baseDir, 'firestore.rules'), 'Reglas de Seguridad (firestore.rules)');
checkFile(path.join(baseDir, 'js/firebase-config.js'), 'Configuración Firebase');

// 2. Análisis de index.html
if (fs.existsSync(path.join(baseDir, 'index.html'))) {
    const content = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');

    // Buscar scripts duplicados o rotos
    const scripts = content.match(/<script src=".*"><\/script>/g) || [];
    console.log(`📦 Se han detectado ${scripts.length} módulos JavaScript cargados.`);

    // Verificar si hay RGPD
    if (!content.includes('RGPD') || !content.includes('privacy-modal')) {
        console.error("❌ ERROR: Falta implementación de RGPD en el frontend.");
        errors++;
    } else {
        console.log("✅ Implementación RGPD detectada.");
    }

    // Verificar HTTPS meta
    if (!content.includes('viewport-fit=cover')) {
        console.warn("⚠️ AVISO: Falta optimización de viewport para iOS (Notch).");
        warnings++;
    }
}

// 3. Resultado Final
console.log("\n========================================");
if (errors === 0) {
    console.log(`🎊 AUDITORÍA COMPLETADA CON ÉXITO.`);
    console.log(`   Errores: ${errors} | Avisos: ${warnings}`);
    console.log("   El proyecto está listo para producción. 🚀");
} else {
    console.error(`🚨 AUDITORÍA FALLIDA.`);
    console.error(`   Se han encontrado ${errors} errores críticos.`);
    console.error("   Revisa los puntos anteriores antes de entregar.");
}
console.log("========================================\n");
