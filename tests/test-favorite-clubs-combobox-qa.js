/**
 * test-favorite-clubs-combobox-qa.js
 * Verificación de QA para los clubes colaboradores favoritos en el combobox y catálogo
 */

const fs = require('fs');
const path = require('path');

console.log("🧪 Iniciando Test de QA: Clubes Colaboradores Favoritos...");

// 1. Verificar archivo de imagen
const imagePath = path.join(__dirname, '..', 'img', 'new_play_padel_pro.png');
if (!fs.existsSync(imagePath)) {
    console.error("❌ ERROR: La imagen img/new_play_padel_pro.png no existe.");
    process.exit(1);
}
const imgStat = fs.statSync(imagePath);
console.log(`✅ Imagen encontrada: img/new_play_padel_pro.png (${(imgStat.size / 1024).toFixed(1)} KB)`);

// 2. Simular entorno DOM mínimo
global.window = {};
global.document = {
    getElementById: (id) => null,
    createElement: (tag) => {
        return {
            tagName: tag,
            style: {},
            classList: { add: () => {} },
            appendChild: () => {},
            querySelectorAll: () => [],
            addEventListener: () => {}
        };
    },
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: () => {}
};

// Cargar Constants.js
const constantsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'core', 'Constants.js'), 'utf8');
eval(constantsContent);

const clubs = window.PADEL_CLUBS_CATALOG;
if (!clubs || clubs.length === 0) {
    console.error("❌ ERROR: PADEL_CLUBS_CATALOG no está definido o está vacío.");
    process.exit(1);
}

// 3. Validar los 4 primeros clubes (favoritos)
const expectedFavorites = [
    { id: 'prat_bcn', namePart: 'Barcelona Pádel el Prat', courts: 14 },
    { id: 'cornella_delfos', namePart: 'Delfos', courts: 8 },
    { id: 'new_play_padel_pro', namePart: 'New Play Pádel Pro', courts: 5 },
    { id: 'hosp_cem_tennis', namePart: 'CEM Tennis', courts: 4 }
];

expectedFavorites.forEach((exp, idx) => {
    const club = clubs[idx];
    if (!club) {
        console.error(`❌ ERROR: No se encontró club en el índice ${idx}`);
        process.exit(1);
    }
    if (club.id !== exp.id) {
        console.error(`❌ ERROR: Club en posición ${idx + 1} tiene id '${club.id}', se esperaba '${exp.id}'`);
        process.exit(1);
    }
    if (!club.name.includes(exp.namePart) && !club.sede.includes(exp.namePart)) {
        console.error(`❌ ERROR: Club en posición ${idx + 1} ('${club.name}') no coincide con '${exp.namePart}'`);
        process.exit(1);
    }
    if (!club.isFavorite) {
        console.error(`❌ ERROR: Club en posición ${idx + 1} debe tener isFavorite = true`);
        process.exit(1);
    }
    if (club.courts !== exp.courts) {
        console.error(`❌ ERROR: Club '${club.name}' tiene ${club.courts} pistas, se esperaban ${exp.courts}`);
        process.exit(1);
    }
    console.log(`✅ Favorito ${idx + 1}: ${club.name} (${club.sede}) | Pistas: ${club.courts} | Img: ${club.image || 'N/A'}`);
});

// 4. Validar EventService.getAutoImage
global.AppConstants = window.AppConstants;
const eventServiceContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'common', 'EventService.js'), 'utf8');
eval(eventServiceContent);

const imgNewPlay = window.EventService.getAutoImage('New Play Pádel Pro', 'open', 'entreno');
if (imgNewPlay !== 'img/new_play_padel_pro.png') {
    console.error(`❌ ERROR: EventService.getAutoImage para New Play Pádel Pro devolvió: ${imgNewPlay}`);
    process.exit(1);
}
console.log(`✅ getAutoImage('New Play Pádel Pro') -> ${imgNewPlay}`);

const cemImgPath = path.join(__dirname, '..', 'img', 'cem_tennis_hospitalet.png');
if (!fs.existsSync(cemImgPath)) {
    console.error("❌ ERROR: La imagen img/cem_tennis_hospitalet.png no existe.");
    process.exit(1);
}
const cemStat = fs.statSync(cemImgPath);
console.log(`✅ Imagen encontrada: img/cem_tennis_hospitalet.png (${(cemStat.size / 1024).toFixed(1)} KB)`);

const imgCem = window.EventService.getAutoImage('CEM Tennis Hospitalet', 'open', 'entreno');
if (imgCem !== 'img/cem_tennis_hospitalet.png') {
    console.error(`❌ ERROR: EventService.getAutoImage para CEM Tennis Hospitalet devolvió: ${imgCem}`);
    process.exit(1);
}
console.log(`✅ getAutoImage('CEM Tennis Hospitalet', 'open', 'entreno') -> ${imgCem}`);

// 5. Validar getAutoImage para Americanas
const imgAmericanaNewPlay = window.EventService.getAutoImage('New Play Pádel Pro', 'open', 'americana');
if (imgAmericanaNewPlay !== 'img/new_play_padel_pro.png') {
    console.error(`❌ ERROR: EventService.getAutoImage para Americana New Play devolvió: ${imgAmericanaNewPlay}`);
    process.exit(1);
}
console.log(`✅ getAutoImage('New Play Pádel Pro', 'open', 'americana') -> ${imgAmericanaNewPlay}`);

const imgAmericanaCem = window.EventService.getAutoImage('CEM Tennis Hospitalet', 'open', 'americana');
if (imgAmericanaCem !== 'img/cem_tennis_hospitalet.png') {
    console.error(`❌ ERROR: EventService.getAutoImage para Americana CEM Hospitalet devolvió: ${imgAmericanaCem}`);
    process.exit(1);
}
console.log(`✅ getAutoImage('CEM Tennis Hospitalet', 'open', 'americana') -> ${imgAmericanaCem}`);

// 6. Validar que admin-americanas.js y organizacion-erp.js contienen los presets y favoritos
const adminAmericanasCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'admin-americanas.js'), 'utf8');
if (!adminAmericanasCode.includes('img/new_play_padel_pro.png')) {
    console.error("❌ ERROR: admin-americanas.js no incluye img/new_play_padel_pro.png");
    process.exit(1);
}
console.log("✅ admin-americanas.js contiene imagen oficial de New Play Pádel Pro");

const orgErpCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'organizacion-erp.js'), 'utf8');
if (!orgErpCode.includes('⭐ CLUBES COLABORADORES (FAVORITOS)')) {
    console.error("❌ ERROR: organizacion-erp.js no incluye sección de favoritos");
    process.exit(1);
}
console.log("✅ organizacion-erp.js contiene sección de favoritos en selector de sede");

console.log("\n🎉 TODOS LOS TESTS DE QA PARA AMERICANAS Y ENTRENOS PASARON CON ÉXITO (9/9).");

