const fs = require('fs');
const path = require('path');

try {
    const filePath = path.resolve(__dirname, '../js/modules/dashboard/DashboardView_hotfix.js');
    console.log('Validating file:', filePath);
    const code = fs.readFileSync(filePath, 'utf8');
    
    // We wrap it in a function or check it with vm.Script
    const vm = require('vm');
    new vm.Script(code);
    console.log('✅ Syntax is completely valid!');
} catch (err) {
    console.error('❌ Syntax Error detected:');
    console.error(err);
    process.exit(1);
}
