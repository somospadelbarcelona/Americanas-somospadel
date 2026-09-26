/**
 * test-tournament-chronicle-ai.js
 * Test de validación integral para TournamentChronicleService
 */

const assert = require('assert');
const path = require('path');

// 1. Cargar el servicio
const chronicleService = require('../js/modules/ai/TournamentChronicleService.js');

console.log('🧪 INICIANDO TESTS DE TOURNAMENT CHRONICLE SERVICE...\n');

// Mock data: Torneo de Americana Twister con 4 rondas y 4 pistas
const mockEventDoc = {
    id: 'evt_test_123',
    title: 'Americana Twister Viernes Noche',
    name: 'Americana Twister Viernes Noche',
    type: 'americana',
    format: 'twister',
    category: 'Nivel 3.5 - 4.0',
    date: '2026-09-26',
    location: 'SomosPádel BCN (Barcelona)',
    players: [
        { id: 'u1', name: 'Carlos Alcaraz' },
        { id: 'u2', name: 'Ale Galán' },
        { id: 'u3', name: 'Arturo Coello' },
        { id: 'u4', name: 'Juan Lebrón' },
        { id: 'u5', name: 'Paquito Navarro' },
        { id: 'u6', name: 'Fede Chingotto' },
        { id: 'u7', name: 'Franco Stupaczuk' },
        { id: 'u8', name: 'Martín Di Nenno' }
    ]
};

const mockMatches = [
    // Ronda 1
    { round: 1, court: 1, team_a_names: ['Carlos Alcaraz', 'Ale Galán'], team_b_names: ['Arturo Coello', 'Juan Lebrón'], score_a: 6, score_b: 4, status: 'finished' },
    { round: 1, court: 2, team_a_names: ['Paquito Navarro', 'Fede Chingotto'], team_b_names: ['Franco Stupaczuk', 'Martín Di Nenno'], score_a: 7, score_b: 6, status: 'finished' },
    
    // Ronda 2
    { round: 2, court: 1, team_a_names: ['Carlos Alcaraz', 'Fede Chingotto'], team_b_names: ['Ale Galán', 'Paquito Navarro'], score_a: 6, score_b: 2, status: 'finished' },
    { round: 2, court: 2, team_a_names: ['Arturo Coello', 'Martín Di Nenno'], team_b_names: ['Juan Lebrón', 'Franco Stupaczuk'], score_a: 6, score_b: 3, status: 'finished' },

    // Ronda 3
    { round: 3, court: 1, team_a_names: ['Carlos Alcaraz', 'Arturo Coello'], team_b_names: ['Fede Chingotto', 'Martín Di Nenno'], score_a: 6, score_b: 1, status: 'finished' },
    { round: 3, court: 2, team_a_names: ['Ale Galán', 'Franco Stupaczuk'], team_b_names: ['Paquito Navarro', 'Juan Lebrón'], score_a: 8, score_b: 7, status: 'finished' },

    // Ronda 4 (Fede Chingotto subió de pista 2 a pista 1)
    { round: 4, court: 1, team_a_names: ['Carlos Alcaraz', 'Martín Di Nenno'], team_b_names: ['Ale Galán', 'Fede Chingotto'], score_a: 7, score_b: 5, status: 'finished' },
    { round: 4, court: 2, team_a_names: ['Arturo Coello', 'Paquito Navarro'], team_b_names: ['Juan Lebrón', 'Franco Stupaczuk'], score_a: 6, score_b: 4, status: 'finished' }
];

// Test 1: Generación Épica (por defecto)
console.log('--- TEST 1: Crónica Épica Completa ---');
const epicChronicle = chronicleService.generateEpicChronicle(mockEventDoc, mockMatches, { tone: 'epic' });

assert.strictEqual(epicChronicle.status, 'success', 'El estado debe ser success');
assert.strictEqual(epicChronicle.isFinished, true, 'El torneo debe estar finalizado');
assert(epicChronicle.podium.length === 3, 'El podio debe tener 3 escalones');
console.log(`🥇 Campeón: ${epicChronicle.podium[0].name} (${epicChronicle.podium[0].points} pts)`);
console.log(`🥈 Subcampeón: ${epicChronicle.podium[1].name} (${epicChronicle.podium[1].points} pts)`);
console.log(`🥉 Tercero: ${epicChronicle.podium[2].name} (${epicChronicle.podium[2].points} pts)`);

// Validar MVP
assert(epicChronicle.mvp, 'Debe haber un MVP');
assert(epicChronicle.mvp.name, 'El MVP debe tener nombre');
console.log(`👑 MVP: ${epicChronicle.mvp.name} con ${epicChronicle.mvp.points} pts y ${epicChronicle.mvp.winRatePercent}% victorias (Score de Impacto: ${epicChronicle.mvp.impactScore})`);

// Validar Highlights
assert(epicChronicle.highlights.closestMatch, 'Debe detectar el partido más ajustado');
console.log(`⚡ Partido Más Ajustado: ${epicChronicle.highlights.closestMatch.summary} (Score: ${epicChronicle.highlights.closestMatch.scoreString})`);

assert(epicChronicle.highlights.bestDefense, 'Debe detectar la mejor defensa');
console.log(`🛡️ La Gran Muralla: ${epicChronicle.highlights.bestDefense.name} (${epicChronicle.highlights.bestDefense.avgLostPerMatch} juegos encajados/partido)`);

assert(epicChronicle.highlights.biggestClimber, 'Debe detectar al jugador con mayor escalada o remontada');
console.log(`📈 Mayor Escalada / Remontada: ${epicChronicle.highlights.biggestClimber.name} (${epicChronicle.highlights.biggestClimber.description})`);

assert(epicChronicle.highlights.longestStreak, 'Debe detectar la racha más larga');
console.log(`🔥 Racha: ${epicChronicle.highlights.longestStreak.name} (${epicChronicle.highlights.longestStreak.description})`);

// Validar Textos y Actos
assert(epicChronicle.headline, 'Debe tener headline');
assert(epicChronicle.subheadline, 'Debe tener subheadline');
assert(epicChronicle.act1_intro, 'Debe tener act1_intro');
assert(epicChronicle.act2_highlights, 'Debe tener act2_highlights');
assert(epicChronicle.act3_mvp_ascents, 'Debe tener act3_mvp_ascents');
assert(epicChronicle.act4_outro, 'Debe tener act4_outro');
assert(epicChronicle.fullChronicle, 'Debe tener fullChronicle');

console.log('\n--- HEADLINE GENERADO ---');
console.log(epicChronicle.headline);

// Validar WhatsApp Text y Hashtags
assert(epicChronicle.whatsAppText.includes('*SOMOSPÁDEL BCN'), 'Debe incluir header de WhatsApp');
assert(epicChronicle.whatsAppText.includes('#SomosPadelBCN'), 'Debe incluir hashtag oficial');
console.log('\n--- WHATSAPP PREVIEW (primeras 5 líneas) ---');
console.log(epicChronicle.whatsAppText.split('\n').slice(0, 5).join('\n'));

// Validar Instagram Story Data
assert.strictEqual(epicChronicle.instagramStoryData.ratio, '9:16');
assert(epicChronicle.instagramStoryData.podium.length === 3);
assert(epicChronicle.instagramStoryData.mvp.name);
console.log('\n✅ TEST 1 PASADO CON ÉXITO\n');

// Test 2: Modo Hype y Modo Technical
console.log('--- TEST 2: Tonos Hype y Technical ---');
const hypeChronicle = chronicleService.generateEpicChronicle(mockEventDoc, mockMatches, { tone: 'hype' });
assert(hypeChronicle.headline.includes('LOCURA') || hypeChronicle.headline.includes('🔥'), 'El tono hype debe ser llamativo');

const techChronicle = chronicleService.generateEpicChronicle(mockEventDoc, mockMatches, { tone: 'technical' });
assert(techChronicle.headline.includes('REPORTE') || techChronicle.headline.includes('OFICIAL') || techChronicle.headline.includes('TÁCTICO'));
console.log(`Hype Headline: ${hypeChronicle.headline}`);
console.log(`Tech Headline: ${techChronicle.headline}`);
console.log('✅ TEST 2 PASADO CON ÉXITO\n');

// Test 3: Fallback Previa cuando no hay partidos finalizados suficientes
console.log('--- TEST 3: Fallback Previa Motivacional (< 2 partidos) ---');
const previewChronicle = chronicleService.generateEpicChronicle(mockEventDoc, [mockMatches[0]], { tone: 'epic' });
assert.strictEqual(previewChronicle.status, 'preview');
assert.strictEqual(previewChronicle.isFinished, false);
assert(previewChronicle.headline.includes('BATALLA ESTÁ SERVIDA') || previewChronicle.headline.includes('🔥'));
console.log(`Previa Headline: ${previewChronicle.headline}`);
console.log('✅ TEST 3 PASADO CON ÉXITO\n');

// Test 4: Helpers de Share y WhatsApp URL
console.log('--- TEST 4: Helpers de Share ---');
const waUrl = chronicleService.getWhatsAppShareUrl(epicChronicle);
assert(waUrl.startsWith('https://api.whatsapp.com/send?text='));
assert(waUrl.includes('SOMOSP%C3%81DEL') || waUrl.includes('SOMOSP'));

const payload = chronicleService.getSharePayload(mockEventDoc, mockMatches);
assert(payload.headline);
assert(payload.whatsAppUrl);
assert(payload.storyData);
assert(payload.mvp);
console.log(`WhatsApp URL generada: ${waUrl.substring(0, 60)}...`);
console.log('✅ TEST 4 PASADO CON ÉXITO\n');

console.log('🎉 TODOS LOS TESTS HAN PASADO SATISFACTORIAMENTE!');
