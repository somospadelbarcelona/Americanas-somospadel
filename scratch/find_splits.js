const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'brain' && f !== '.antigravity') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath);
        }
    });
}

const baseDir = '.';
const pattern = /\.split\(['"]\s*['"]\)/;

walkDir(baseDir, (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (pattern.test(line)) {
                console.log(`${filePath}:${idx + 1}: ${line.trim()}`);
            }
        });
    }
});
