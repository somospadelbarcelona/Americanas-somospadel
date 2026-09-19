const fs = require('fs');
const path = require('path');

console.log('🔍 [QA AUDIT] Verificando existencia física de scripts referenciados en HTMLs...\n');

function checkHtmlScripts(htmlFile) {
    const filePath = path.resolve(__dirname, '..', htmlFile);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf8');
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let match;
    let missing = [];
    let found = 0;
    while ((match = scriptSrcRegex.exec(content)) !== null) {
        let src = match[1];
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
            continue; // External CDN
        }
        const cleanSrc = src.split('?')[0].replace(/^\//, '');
        const targetPath = path.resolve(__dirname, '..', cleanSrc);
        if (!fs.existsSync(targetPath)) {
            missing.push({ html: htmlFile, src: cleanSrc });
        } else {
            found++;
        }
    }
    return { found, missing };
}

const htmlFiles = ['index.html', 'admin.html', 'promo-studio.html', 'resultados.html', 'presentation.html', 'live.html', 'admin-login.html'];
let totalErrors = 0;

htmlFiles.forEach(f => {
    const res = checkHtmlScripts(f);
    if (!res) return;
    if (res.missing.length === 0) {
        console.log(`✅ ${f}: ${res.found} scripts encontrados (0 rotos)`);
    } else {
        console.error(`❌ ${f}: ${res.missing.length} scripts NO EXISTEN en disco:`);
        res.missing.forEach(m => console.error(`   - ${m.src}`));
        totalErrors += res.missing.length;
    }
});

console.log(`\n========================================`);
if (totalErrors === 0) {
    console.log(`🎉 Todos los scripts locales de los archivos HTML existen correctamente.`);
} else {
    console.error(`🚨 Se encontraron ${totalErrors} referencias a scripts inexistentes (posibles errores 404).`);
}
console.log(`========================================\n`);
