const fs = require('fs');
const path = require('path');

// Simulate browser environment
const mockWindow = {};
global.window = mockWindow;

const teamsDataPath = path.join(__dirname, '..', 'js', 'modules', 'teams', 'teams_data.js');
const fileContent = fs.readFileSync(teamsDataPath, 'utf8');

// Evaluate the file
try {
    eval(fileContent);
    const teams = mockWindow.ClubTeamsData || [];
    console.log(`Encontrados ${teams.length} equipos en teams_data.js:`);
    teams.forEach(t => {
        console.log(`- ${t.name} (ID: ${t.id}, Categoría: ${t.category}, Integrantes: ${t.roster ? t.roster.length : 0})`);
    });
} catch (e) {
    console.error("Error al evaluar teams_data.js:", e);
}
