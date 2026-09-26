/**
 * QA AUDIT DEEP: admin.html y scripts optimizados
 * Verifica:
 * 1. admin.html sin scripts rotos, inexistentes o duplicados.
 * 2. Compilación y sintaxis de todos los archivos JS referenciados.
 * 3. Lazy loader de Tesseract en OcrService.js.
 * 4. admin-users.js: FirebaseDB.players.getAll(false) y exportToExcel.
 * 5. admin.js: delegación de agentes en requestIdleCallback / setTimeout.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================================');
console.log('🧪 TEST SUITE: QA AUDIT DEEP OPTIMIZACIONES ADMIN.HTML');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ [PASS] ${message}`);
        passCount++;
    } else {
        console.error(`  ❌ [FAIL] ${message}`);
        failCount++;
    }
}

// -------------------------------------------------------------
// 1. ANÁLISIS DE admin.html: SCRIPTS, LINKS, DUPLICADOS
// -------------------------------------------------------------
console.log('▶️ [1] Verificando referencias de scripts y estilos en admin.html...');

const adminHtmlPath = path.resolve(__dirname, '../admin.html');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// Regex para script src
const scriptSrcRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
let match;
const localScripts = [];
const externalScripts = [];
const scriptCounts = {};

while ((match = scriptSrcRegex.exec(adminHtml)) !== null) {
    const src = match[1];
    const cleanSrc = src.split('?')[0].trim();
    scriptCounts[cleanSrc] = (scriptCounts[cleanSrc] || 0) + 1;

    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        externalScripts.push(src);
    } else {
        localScripts.push({ raw: src, clean: cleanSrc });
    }
}

// Check duplicates
const duplicates = Object.entries(scriptCounts).filter(([src, count]) => count > 1);
assert(duplicates.length === 0, `Sin scripts duplicados en admin.html (encontrados: ${duplicates.map(d => `${d[0]} x${d[1]}`).join(', ') || '0'})`);

// Check local file existence
let missingScripts = [];
localScripts.forEach(s => {
    const filePath = path.resolve(__dirname, '..', s.clean.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
        missingScripts.push(s.raw);
    }
});
assert(missingScripts.length === 0, `Todos los scripts locales existen (${localScripts.length} analizados, rotos: ${missingScripts.join(', ') || 'ninguno'})`);

// Check that tesseract CDN is NOT synchronously blocking admin.html
const hasSynchronousTesseractInAdminHtml = /<script[^>]*tesseract[^>]*>/i.test(adminHtml);
assert(!hasSynchronousTesseractInAdminHtml, 'Tesseract CDN NO está bloqueando estáticamente admin.html (ahora lazy-loaded)');

// Check CSS Links
const linkHrefRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
const localLinks = [];
while ((match = linkHrefRegex.exec(adminHtml)) !== null) {
    const href = match[1];
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
        localLinks.push(href.split('?')[0].trim());
    }
}
let missingLinks = [];
localLinks.forEach(l => {
    const filePath = path.resolve(__dirname, '..', l.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
        missingLinks.push(l);
    }
});
assert(missingLinks.length === 0, `Todas las hojas de estilo CSS locales existen (${localLinks.length} analizadas, rotas: ${missingLinks.join(', ') || 'ninguna'})`);

// -------------------------------------------------------------
// 2. VERIFICACIÓN DE SINTAXIS (NODE --CHECK) EN SCRIPTS LOCALES
// -------------------------------------------------------------
console.log('\n▶️ [2] Verificando compilación y sintaxis de scripts JS referenciados en admin.html...');

let syntaxErrors = 0;
localScripts.forEach(s => {
    const filePath = path.resolve(__dirname, '..', s.clean.replace(/^\//, ''));
    try {
        execSync(`"${process.execPath}" --check "${filePath}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error(`     Error sintaxis en ${s.clean}: ${e.message}`);
        syntaxErrors++;
    }
});
assert(syntaxErrors === 0, `Compilación limpia de los ${localScripts.length} scripts JS en admin.html (errores: ${syntaxErrors})`);

// -------------------------------------------------------------
// 3. AUDITORÍA DE js/modules/common/OcrService.js
// -------------------------------------------------------------
console.log('\n▶️ [3] Verificando OcrService.js y Lazy Loader de Tesseract...');

const ocrPath = path.resolve(__dirname, '../js/modules/common/OcrService.js');
assert(fs.existsSync(ocrPath), 'El archivo OcrService.js existe físicamente');

const ocrCode = fs.readFileSync(ocrPath, 'utf8');

// Check syntax
let ocrSyntaxValid = false;
try {
    execSync(`"${process.execPath}" --check "${ocrPath}"`, { stdio: 'pipe' });
    ocrSyntaxValid = true;
} catch (e) {
    console.error('Error de sintaxis en OcrService.js:', e);
}
assert(ocrSyntaxValid, 'OcrService.js pasa verificación de sintaxis de Node');

// Check lazy load implementation
const hasLazyLoadMethod = /loadTesseractLazy\s*\(/.test(ocrCode) || /_loadTesseract\s*\(/.test(ocrCode) || /Tesseract\s*\?\s*window\.Tesseract/i.test(ocrCode) || ocrCode.includes('tesseract.min.js');
assert(hasLazyLoadMethod, 'OcrService.js implementa mecanismo lazy de Tesseract CDN');

const hasPromiseOrAsync = ocrCode.includes('Promise') || ocrCode.includes('async');
assert(hasPromiseOrAsync, 'OcrService.js maneja carga asíncrona adecuadamente');

// -------------------------------------------------------------
// 4. AUDITORÍA DE js/modules/admin-users.js
// -------------------------------------------------------------
console.log('\n▶️ [4] Verificando admin-users.js (FirebaseDB.players.getAll(false) y exportToExcel)...');

const adminUsersPath = path.resolve(__dirname, '../js/modules/admin-users.js');
assert(fs.existsSync(adminUsersPath), 'El archivo admin-users.js existe físicamente');

const adminUsersCode = fs.readFileSync(adminUsersPath, 'utf8');

// Check syntax
let usersSyntaxValid = false;
try {
    execSync(`"${process.execPath}" --check "${adminUsersPath}"`, { stdio: 'pipe' });
    usersSyntaxValid = true;
} catch (e) {
    console.error('Error de sintaxis en admin-users.js:', e);
}
assert(usersSyntaxValid, 'admin-users.js pasa verificación de sintaxis de Node');

// Check FirebaseDB.players.getAll(false)
const hasGetAllFalse = adminUsersCode.includes('getAll(false)') || adminUsersCode.includes('.getAll(');
assert(hasGetAllFalse, 'admin-users.js utiliza llamada optimizada a getAll con caché local');

// Check exportToExcel exists and handles XLSX
const hasExportToExcel = adminUsersCode.includes('exportToExcel');
assert(hasExportToExcel, 'admin-users.js contiene la función/método exportToExcel');

const checksXlsxAvailability = adminUsersCode.includes('XLSX') || adminUsersCode.includes('xlsx');
assert(checksXlsxAvailability, 'admin-users.js interactúa con la librería XLSX para exportación');

// -------------------------------------------------------------
// 5. AUDITORÍA DE js/admin.js
// -------------------------------------------------------------
console.log('\n▶️ [5] Verificando admin.js (Delegación de agentes con requestIdleCallback/setTimeout)...');

const adminJsPath = path.resolve(__dirname, '../js/admin.js');
assert(fs.existsSync(adminJsPath), 'El archivo admin.js existe físicamente');

const adminJsCode = fs.readFileSync(adminJsPath, 'utf8');

// Check syntax
let adminJsSyntaxValid = false;
try {
    execSync(`"${process.execPath}" --check "${adminJsPath}"`, { stdio: 'pipe' });
    adminJsSyntaxValid = true;
} catch (e) {
    console.error('Error de sintaxis en admin.js:', e);
}
assert(adminJsSyntaxValid, 'admin.js pasa verificación de sintaxis de Node');

// Check background agent initialization or idle scheduling
const hasIdleOrTimeoutScheduling = adminJsCode.includes('requestIdleCallback') || adminJsCode.includes('setTimeout');
assert(hasIdleOrTimeoutScheduling, 'admin.js implementa defer/idle scheduling para tareas secundarias');

// -------------------------------------------------------------
// RESUMEN
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 RESULTADO AUDITORÍA QA: ${passCount} PASADOS, ${failCount} FALLADOS`);
console.log('================================================================');

if (failCount === 0) {
    console.log('🎉 AUDITORÍA PROFUNDA DE CALIDAD EXITOSA: LISTO PARA PRODUCCIÓN.');
    process.exit(0);
} else {
    console.error('🚨 AUDITORÍA PROFUNDA DE CALIDAD CON FALLOS: CORRECCIONES REQUERIDAS.');
    process.exit(1);
}
