const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
}
console.log('Total scripts found in admin.html:', scripts.length);
let missing = 0;
scripts.forEach(s => {
    if (s.startsWith('http')) return;
    const cleanPath = s.split('?')[0];
    if (!fs.existsSync(cleanPath)) {
        console.error('❌ SCRIPT NOT FOUND ON DISK:', cleanPath, 'from', s);
        missing++;
    }
});
if (missing === 0) {
    console.log('✅ ALL ADMIN LOCAL SCRIPTS EXIST ON DISK!');
} else {
    console.error(`❌ Total missing scripts: ${missing}`);
}
