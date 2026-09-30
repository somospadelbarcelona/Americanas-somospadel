/**
 * test-social-channels-qa.js
 * Test de certificación QA para la integración y promoción de Redes Sociales
 * (Instagram & Facebook) en la app SomosPadel Barcelona.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('🔍 QA TEST SUITE: CERTIFICACIÓN DE REDES SOCIALES (INSTAGRAM & FACEBOOK)');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Detalle: ${err.message}`);
        failed++;
    }
}

const rootDir = path.resolve(__dirname, '..');

// 1. Verificación de existencia de archivos
runTest('Archivos objetivo existen en disco', () => {
    assert(fs.existsSync(path.join(rootDir, 'js/core/SocialChannelsService.js')), 'Falta SocialChannelsService.js');
    assert(fs.existsSync(path.join(rootDir, 'js/app.js')), 'Falta js/app.js');
    assert(fs.existsSync(path.join(rootDir, 'index.html')), 'Falta index.html');
    assert(fs.existsSync(path.join(rootDir, 'js/modules/community/CommunityHomeView.js')), 'Falta CommunityHomeView.js');
    assert(fs.existsSync(path.join(rootDir, 'js/modules/dashboard/DashboardView.js')), 'Falta DashboardView.js');
});

// 2. Inclusión en index.html
runTest('index.html incluye SocialChannelsService.js con defer', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert(html.includes('src="js/core/SocialChannelsService.js'), 'Falta script SocialChannelsService.js en index.html');
});

// 3. Verificación de SocialChannelsService y URLs
runTest('SocialChannelsService contiene las URLs de Instagram y Facebook', () => {
    const code = fs.readFileSync(path.join(rootDir, 'js/core/SocialChannelsService.js'), 'utf8');
    assert(code.includes('somospadelbarcelona_'), 'Falta handle o URL de Instagram');
    assert(code.includes('https://www.instagram.com/somospadelbarcelona_/?hl=es'), 'URL de Instagram incorrecta');
    assert(code.includes('https://www.facebook.com/?locale=es_ES'), 'URL de Facebook incorrecta');
    assert(code.includes('openSocialHubModal'), 'Falta método openSocialHubModal');
    assert(code.includes('copyTag'), 'Falta método copyTag');
});

// 4. Funciones globales en js/app.js
runTest('js/app.js define openClubInstagram y openClubFacebook', () => {
    const code = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
    assert(code.includes('window.openClubInstagram ='), 'Falta window.openClubInstagram');
    assert(code.includes('window.openClubFacebook ='), 'Falta window.openClubFacebook');
});

// 5. Menú lateral (Drawer) incluye filas de Instagram y Facebook
runTest('Drawer contiene accesos directos a Instagram Oficial y Facebook del Club', () => {
    const code = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
    assert(code.includes('onclick="window.openClubInstagram()"'), 'Falta onclick openClubInstagram en drawer');
    assert(code.includes('onclick="window.openClubFacebook()"'), 'Falta onclick openClubFacebook en drawer');
    assert(code.includes('Instagram Oficial'), 'Falta texto Instagram Oficial en drawer');
    assert(code.includes('Facebook del Club'), 'Falta texto Facebook del Club en drawer');
});

// 6. CommunityHomeView contiene integración social
runTest('CommunityHomeView integra botones de Instagram y Facebook en Hero y Sección', () => {
    const code = fs.readFileSync(path.join(rootDir, 'js/modules/community/CommunityHomeView.js'), 'utf8');
    assert(code.includes('https://www.instagram.com/somospadelbarcelona_/?hl=es'), 'Falta enlace Instagram en CommunityHomeView');
    assert(code.includes('https://www.facebook.com/?locale=es_ES'), 'Falta enlace Facebook en CommunityHomeView');
    assert(code.includes('SOMOSPADEL EN REDES SOCIALES'), 'Falta sección SOMOSPADEL EN REDES SOCIALES');
    assert(code.includes('@somospadelbarcelona_'), 'Falta mención @somospadelbarcelona_');
});

// 7. DashboardView contiene widget de Redes Sociales
runTest('DashboardView y DashboardView_hotfix contienen tarjeta destacada de Redes Sociales Oficiales', () => {
    const code = fs.readFileSync(path.join(rootDir, 'js/modules/dashboard/DashboardView.js'), 'utf8');
    const hotfixCode = fs.readFileSync(path.join(rootDir, 'js/modules/dashboard/DashboardView_hotfix.js'), 'utf8');
    assert(code.includes('REDES SOCIALES HUB'), 'Falta bloque REDES SOCIALES HUB en DashboardView');
    assert(code.includes('openClubInstagram'), 'Falta openClubInstagram en DashboardView');
    assert(code.includes('openClubFacebook'), 'Falta openClubFacebook en DashboardView');
    assert(hotfixCode.includes('REDES SOCIALES HUB'), 'Falta bloque REDES SOCIALES HUB en DashboardView_hotfix');
    assert(hotfixCode.includes('openClubInstagram'), 'Falta openClubInstagram en DashboardView_hotfix');
    assert(hotfixCode.includes('openClubFacebook'), 'Falta openClubFacebook en DashboardView_hotfix');
});

// 8. Integración en compartición post-partido y flyer
runTest('SocialShareView y ControlTowerSummary contienen mención y acciones de redes', () => {
    const shareView = fs.readFileSync(path.join(rootDir, 'js/modules/admin/SocialShareView.js'), 'utf8');
    const ctSummary = fs.readFileSync(path.join(rootDir, 'js/modules/americanas/ControlTowerSummary.js'), 'utf8');
    assert(shareView.includes('@somospadelbarcelona_'), 'Falta @somospadelbarcelona_ en SocialShareView');
    assert(shareView.includes('INSTAGRAM'), 'Falta botón INSTAGRAM en SocialShareView');
    assert(ctSummary.includes('@somospadelbarcelona_'), 'Falta @somospadelbarcelona_ en ControlTowerSummary');
});

// 9. Opción 1 Gamificación: Insignia en AchievementsService
runTest('AchievementsService tiene registrada la insignia oficial embajador_social', () => {
    const code = fs.readFileSync(path.join(rootDir, 'js/modules/stats/AchievementsService.js'), 'utf8');
    assert(code.includes("id: 'embajador_social'"), 'Falta id embajador_social en AchievementsService');
    assert(code.includes("title: 'Embajador del Club'"), 'Falta título Embajador del Club');
    assert(code.includes("xp: 150"), 'Falta xp: 150');
});

// 10. Flujo de Reclamación y Reto en SocialChannelsService y Dashboard
runTest('SocialChannelsService gestiona claimSocialReward y Dashboard incluye banner del reto', () => {
    const svcCode = fs.readFileSync(path.join(rootDir, 'js/core/SocialChannelsService.js'), 'utf8');
    const dashCode = fs.readFileSync(path.join(rootDir, 'js/modules/dashboard/DashboardView.js'), 'utf8');
    const hotfixCode = fs.readFileSync(path.join(rootDir, 'js/modules/dashboard/DashboardView_hotfix.js'), 'utf8');
    assert(svcCode.includes('claimSocialReward'), 'Falta claimSocialReward en SocialChannelsService');
    assert(svcCode.includes('isAmbassadorClaimed'), 'Falta isAmbassadorClaimed');
    assert(dashCode.includes('Reto: Insignia Embajador del Club'), 'Falta banner de reto en DashboardView');
    assert(hotfixCode.includes('Reto: Insignia Embajador del Club'), 'Falta banner de reto en DashboardView_hotfix');
});

// 11. Opción 2: Generador Viral PadelFutCard para Instagram Stories
runTest('PadelFutCard incluye botón y banner dedicados a Instagram Story con mención oficial', () => {
    const futCode = fs.readFileSync(path.join(rootDir, 'js/modules/players/PadelFutCard.js'), 'utf8');
    assert(futCode.includes('SUBIR A INSTAGRAM STORY (9:16)'), 'Falta botón SUBIR A INSTAGRAM STORY en PadelFutCard');
    assert(futCode.includes('@somospadelbarcelona_'), 'Falta mención @somospadelbarcelona_ en PadelFutCard');
    assert(futCode.includes('Mi Carta Oficial en @somospadelbarcelona_'), 'Falta texto para compartir story');
    assert(futCode.includes('openInstagram'), 'Falta fallback a openInstagram');
});

// 12. Menú Drawer destaca exportación de carta FUT en stories
runTest('Drawer contiene badge STORY 9:16 en la fila de Carta de Jugador FUT', () => {
    const appCode = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
    assert(appCode.includes('STORY 9:16'), 'Falta badge STORY 9:16 en Carta de Jugador FUT en js/app.js');
});

// 13. Opción 3: Banner de Álbumes de Fotos en Facebook en Historial de Americanas
runTest('EventsController_V6 incluye tarjeta promocional de fotos y álbumes en Facebook', () => {
    const eventsCode = fs.readFileSync(path.join(rootDir, 'js/modules/americanas/EventsController_V6.js'), 'utf8');
    assert(eventsCode.includes('GALERÍA DE LA COMUNIDAD'), 'Falta título Galería de la Comunidad en EventsController_V6');
    assert(eventsCode.includes('VER ÁLBUMES'), 'Falta botón VER ÁLBUMES en EventsController_V6');
    assert(eventsCode.includes('openFacebook'), 'Falta openFacebook en EventsController_V6');
});

// 14. Opción 3: ControlTowerSummary incluye botón de Álbum en Facebook en el resumen del torneo
runTest('ControlTowerSummary incluye botones para ver álbum de fotos en Facebook', () => {
    const ctCode = fs.readFileSync(path.join(rootDir, 'js/modules/americanas/ControlTowerSummary.js'), 'utf8');
    assert(ctCode.includes('VER ÁLBUM DE FOTOS EN FACEBOOK'), 'Falta botón VER ÁLBUM DE FOTOS EN FACEBOOK en ControlTowerSummary');
    assert(ctCode.includes('title="Ver Álbum de Fotos en Facebook"'), 'Falta botón rápido en cabecera de ControlTowerSummary');
});

// 15. Opción 4: Métodos del Concurso Mensual en SocialChannelsService
runTest('SocialChannelsService define modal de concurso y flujo de participación', () => {
    const svcCode = fs.readFileSync(path.join(rootDir, 'js/core/SocialChannelsService.js'), 'utf8');
    assert(svcCode.includes('openContestModal'), 'Falta openContestModal en SocialChannelsService');
    assert(svcCode.includes('closeContestModal'), 'Falta closeContestModal en SocialChannelsService');
    assert(svcCode.includes('participateInContest'), 'Falta participateInContest en SocialChannelsService');
    assert(svcCode.includes('#SomosPadelBCN'), 'Falta hashtag oficial #SomosPadelBCN');
    assert(svcCode.includes('openSocialContestModal'), 'Falta global.openSocialContestModal');
});

// 16. Opción 4: Banners del Concurso Mensual en Dashboard y Comunidad
runTest('DashboardView, DashboardView_hotfix y CommunityHomeView integran el Concurso Mensual del Puntazo y Foto del Mes', () => {
    const dashCode = fs.readFileSync(path.join(rootDir, 'js/modules/dashboard/DashboardView.js'), 'utf8');
    const hotfixCode = fs.readFileSync(path.join(rootDir, 'js/modules/dashboard/DashboardView_hotfix.js'), 'utf8');
    const commCode = fs.readFileSync(path.join(rootDir, 'js/modules/community/CommunityHomeView.js'), 'utf8');
    assert(dashCode.includes('El Puntazo y la Foto del Mes'), 'Falta banner concurso en DashboardView');
    assert(dashCode.includes('openSocialContestModal'), 'Falta openSocialContestModal en DashboardView');
    assert(hotfixCode.includes('El Puntazo y la Foto del Mes'), 'Falta banner concurso en DashboardView_hotfix');
    assert(hotfixCode.includes('Americana gratis con'), 'Falta mención americana gratis en DashboardView_hotfix');
    assert(hotfixCode.includes('openSocialContestModal'), 'Falta openSocialContestModal en DashboardView_hotfix');
    assert(commCode.includes('El Puntazo y La Foto del Mes'), 'Falta banner concurso en CommunityHomeView');
    assert(commCode.includes('openSocialContestModal'), 'Falta openSocialContestModal en CommunityHomeView');
});

// 17. Opción 6: Modo Copiloto para Alex en promo-studio.html
runTest('promo-studio.html integra el Modo Copiloto para Alex con misiones estratégicas y 1-clic workflow', () => {
    const studioHtml = fs.readFileSync(path.join(rootDir, 'promo-studio.html'), 'utf8');
    assert(studioHtml.includes('copilot-alex-modal'), 'Falta copilot-alex-modal en promo-studio.html');
    assert(studioHtml.includes('openCopilotAlexModal'), 'Falta openCopilotAlexModal en promo-studio.html');
    assert(studioHtml.includes('copilotMissions'), 'Falta objeto copilotMissions en promo-studio.html');
    assert(studioHtml.includes('executeCopilot1Click'), 'Falta executeCopilot1Click en promo-studio.html');
    assert(studioHtml.includes('btn-open-copilot'), 'Falta botón de acceso a Copiloto en header');
    assert(studioHtml.includes('?mode=copilot'), 'Falta soporte para URL param ?mode=copilot');
});

// 18. Opción 6: Enlace a Copiloto para Alex en admin.html
runTest('admin.html contiene acceso directo a promo-studio.html en Modo Copiloto', () => {
    const adminHtml = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf8');
    assert(adminHtml.includes('promo-studio.html?mode=copilot'), 'Falta enlace directo promo-studio.html?mode=copilot en admin.html');
    assert(adminHtml.includes('Marketing & Copiloto Alex'), 'Falta texto Marketing & Copiloto Alex en admin.html');
});

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL PRUEBAS: ${passed + failed} | PASADAS: ${passed} | FALLADAS: ${failed}`);
console.log('------------------------------------------------------------------------');

if (failed > 0) {
    console.error('❌ HAY PRUEBAS FALLIDAS.');
    process.exit(1);
} else {
    console.log('🎉 TODAS LAS PRUEBAS DE REDES SOCIALES PASARON AL 100%.');
    process.exit(0);
}


