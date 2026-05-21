const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'admin.html');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

console.log("--- BÚSQUEDA EN admin.html ---");
const queries = [/club_teams/gi, /ExtractedTeamsData/gi, /teams_data_auto\.js/gi, /teams_data/gi, /SINCRO/gi];
queries.forEach(regex => {
    let match;
    console.log(`\nResultados para ${regex}:`);
    const lines = adminHtml.split('\n');
    lines.forEach((line, index) => {
        if (regex.test(line)) {
            console.log(`Línea ${index + 1}: ${line.trim().substring(0, 150)}`);
        }
    });
});
