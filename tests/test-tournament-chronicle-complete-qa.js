/**
 * test-tournament-chronicle-complete-qa.js
 * 
 * 🏆 SUITE DE VALIDACIÓN Y CONTROL DE CALIDAD (QA) INTEGRAL
 * Funcionalidad: "Resumen Crónica Post-Torneo con IA"
 * SomosPádel Barcelona
 * 
 * Módulos auditados:
 * - js/modules/ai/TournamentChronicleService.js
 * - js/modules/ai/TournamentChronicleModal.js
 * - js/modules/americanas/ControlTowerSummary.js
 * - js/modules/americanas/ControlTowerView.js
 * - js/modules/ui/EventModals.js
 * - js/modules/admin-entrenos.js
 * - index.html & admin.html
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("================================================================================");
console.log(" 🏆 AUDITORÍA QA: CRÓNICA POST-TORNEO CON IA & INSTAGRAM STORIES 9:16");
console.log("    SomosPádel BCN - Control de Calidad y Estabilidad Técnica");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;
const testResults = [];

async function test(group, name, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] [${group}] ${name}`);
        passedCount++;
        testResults.push({ group, name, passed: true });
    } catch (err) {
        console.error(`  ❌ [FAIL] [${group}] ${name}`);
        console.error(`     Error: ${err.message}`);
        if (err.stack) {
            const stackLine = err.stack.split('\n')[1];
            if (stackLine) console.error(`    ${stackLine.trim()}`);
        }
        failedCount++;
        testResults.push({ group, name, passed: false, error: err.message });
    }
}

// ================================================================================
// ENTORNO MOCK HEADLESS (DOM, Canvas 2D, Clipboard, Share API)
// ================================================================================

class MockCanvasGradient {
    constructor() {
        this.stops = [];
    }
    addColorStop(offset, color) {
        this.stops.push({ offset, color });
    }
}

class MockCanvasContext2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this.font = '10px sans-serif';
        this.textAlign = 'start';
        this.textBaseline = 'alphabetic';
        this.calls = [];
    }
    createLinearGradient(x0, y0, x1, y1) {
        const grad = new MockCanvasGradient();
        this.calls.push({ type: 'createLinearGradient', args: [x0, y0, x1, y1], grad });
        return grad;
    }
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
        const grad = new MockCanvasGradient();
        this.calls.push({ type: 'createRadialGradient', args: [x0, y0, r0, x1, y1, r1], grad });
        return grad;
    }
    fillRect(x, y, w, h) {
        this.calls.push({ type: 'fillRect', args: [x, y, w, h], fillStyle: this.fillStyle });
    }
    strokeRect(x, y, w, h) {
        this.calls.push({ type: 'strokeRect', args: [x, y, w, h] });
    }
    fillText(text, x, y) {
        this.calls.push({ type: 'fillText', args: [text, x, y], font: this.font, fillStyle: this.fillStyle });
    }
    beginPath() { this.calls.push({ type: 'beginPath' }); }
    closePath() { this.calls.push({ type: 'closePath' }); }
    moveTo(x, y) { this.calls.push({ type: 'moveTo', args: [x, y] }); }
    lineTo(x, y) { this.calls.push({ type: 'lineTo', args: [x, y] }); }
    quadraticCurveTo(cpx, cpy, x, y) { this.calls.push({ type: 'quadraticCurveTo', args: [cpx, cpy, x, y] }); }
    fill() { this.calls.push({ type: 'fill' }); }
    stroke() { this.calls.push({ type: 'stroke' }); }
    save() { this.calls.push({ type: 'save' }); }
    restore() { this.calls.push({ type: 'restore' }); }
    measureText(text) {
        return { width: (text ? String(text).length : 0) * 12 };
    }
}

class MockElement {
    constructor(tagName) {
        this.tagName = String(tagName).toUpperCase();
        this.id = '';
        this.className = '';
        this.children = [];
        this.parentNode = null;
        this.style = {};
        this._innerHTML = '';
        this.attributes = {};
        this.width = 0;
        this.height = 0;
        this._ctx2d = null;
    }
    get innerHTML() {
        return this._innerHTML;
    }
    set innerHTML(val) {
        this._innerHTML = String(val);
    }
    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }
    remove() {
        if (this.parentNode) {
            const idx = this.parentNode.children.indexOf(this);
            if (idx !== -1) {
                this.parentNode.children.splice(idx, 1);
            }
            this.parentNode = null;
        }
    }
    querySelector(selector) {
        if (selector.startsWith('#')) {
            const targetId = selector.slice(1);
            return this._findById(targetId);
        }
        if (selector.startsWith('.')) {
            const targetClass = selector.slice(1);
            return this._findByClass(targetClass);
        }
        return this._findByTag(selector.toUpperCase());
    }
    querySelectorAll(selector) {
        const results = [];
        this._collectAll(selector, results);
        return results;
    }
    _collectAll(selector, results) {
        if (selector.startsWith('.')) {
            const targetClass = selector.slice(1);
            if (this.className && this.className.includes(targetClass)) results.push(this);
        } else if (selector.startsWith('#')) {
            const targetId = selector.slice(1);
            if (this.id === targetId) results.push(this);
        } else if (this.tagName === selector.toUpperCase()) {
            results.push(this);
        }
        for (const child of this.children) {
            child._collectAll(selector, results);
        }
    }
    _findById(id) {
        if (this.id === id) return this;
        for (const child of this.children) {
            const found = child._findById(id);
            if (found) return found;
        }
        return null;
    }
    _findByClass(className) {
        if (this.className && this.className.includes(className)) return this;
        if (this._innerHTML && this._innerHTML.includes(`class="${className}"`)) {
            const mockEl = new MockElement('div');
            mockEl.className = className;
            return mockEl;
        }
        for (const child of this.children) {
            const found = child._findByClass(className);
            if (found) return found;
        }
        return null;
    }
    _findByTag(tag) {
        if (this.tagName === tag) return this;
        for (const child of this.children) {
            const found = child._findByTag(tag);
            if (found) return found;
        }
        return null;
    }
    select() {}
    getContext(type) {
        if (type === '2d') {
            if (!this._ctx2d) {
                this._ctx2d = new MockCanvasContext2D(this);
            }
            return this._ctx2d;
        }
        return null;
    }
    toBlob(callback, type) {
        const mockBlob = { size: 1024, type: type || 'image/png' };
        if (callback) callback(mockBlob);
    }
    click() {
        if (this.onclick) this.onclick();
    }
}

class MockDocument {
    constructor() {
        this.body = new MockElement('BODY');
        this.elementsById = new Map();
    }
    createElement(tagName) {
        return new MockElement(tagName);
    }
    getElementById(id) {
        const foundInBody = this.body._findById(id);
        if (foundInBody) return foundInBody;
        if (this.elementsById.has(id)) return this.elementsById.get(id);
        if (this.body.innerHTML && this.body.innerHTML.includes(`id="${id}"`)) {
            const el = new MockElement('div');
            el.id = id;
            return el;
        }
        return null;
    }
}

// Configurar entorno global
global.document = new MockDocument();
global.window = global;
global.window.document = global.document;
global.window.addEventListener = (event, fn) => {};
global.window.removeEventListener = (event, fn) => {};
global.window.open = (url, target) => { global.window.lastOpenedUrl = url; };
global.window.location = { href: 'https://somospadel.barcelona/dashboard' };
global.requestAnimationFrame = (cb) => setTimeout(cb, 10);
global.URL = {
    createObjectURL: (blob) => 'blob:https://somospadel.barcelona/mock-story-blob',
    revokeObjectURL: (url) => {}
};
global.document.execCommand = (cmd) => true;

const mockNavigator = {
    clipboard: {
        lastWrittenText: '',
        writeText: async (text) => {
            mockNavigator.clipboard.lastWrittenText = text;
            return true;
        }
    },
    share: async (data) => {
        mockNavigator.lastSharedData = data;
        return true;
    },
    vibrate: (pattern) => true
};

Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true,
    enumerable: true
});
global.window.navigator = mockNavigator;

// Cargar servicios
const chronicleService = require('../js/modules/ai/TournamentChronicleService.js');
global.TournamentChronicleService = chronicleService;
const chronicleModal = require('../js/modules/ai/TournamentChronicleModal.js');
global.TournamentChronicleModal = chronicleModal;

// ================================================================================
// FIXTURES DE PRUEBA
// ================================================================================

const sampleAmericanaTwister = {
    id: 'evt_americana_twister_101',
    title: 'Americana Twister Viernes Noche',
    name: 'Americana Twister Viernes Noche',
    type: 'americana',
    format: 'twister',
    category: 'Nivel 3.5 - 4.0',
    date: '2026-09-26',
    location: 'SomosPádel BCN (Barcelona)',
    players: [
        { id: 'p1', name: 'Carlos Alcaraz' },
        { id: 'p2', name: 'Ale Galán' },
        { id: 'p3', name: 'Arturo Coello' },
        { id: 'p4', name: 'Juan Lebrón' },
        { id: 'p5', name: 'Paquito Navarro' },
        { id: 'p6', name: 'Fede Chingotto' },
        { id: 'p7', name: 'Franco Stupaczuk' },
        { id: 'p8', name: 'Martín Di Nenno' }
    ]
};

const sampleTwisterMatches = [
    // Ronda 1: Carlos en Pista 1 (6-4). Chingotto en Pista 2 (7-6)
    { round: 1, court: 1, team_a_names: ['Carlos Alcaraz', 'Ale Galán'], team_b_names: ['Arturo Coello', 'Juan Lebrón'], score_a: 6, score_b: 4, status: 'finished' },
    { round: 1, court: 2, team_a_names: ['Paquito Navarro', 'Fede Chingotto'], team_b_names: ['Franco Stupaczuk', 'Martín Di Nenno'], score_a: 7, score_b: 6, status: 'finished' },
    
    // Ronda 2: Carlos con Chingotto en Pista 1 (6-2). Coello en Pista 2 (6-3)
    { round: 2, court: 1, team_a_names: ['Carlos Alcaraz', 'Fede Chingotto'], team_b_names: ['Ale Galán', 'Paquito Navarro'], score_a: 6, score_b: 2, status: 'finished' },
    { round: 2, court: 2, team_a_names: ['Arturo Coello', 'Martín Di Nenno'], team_b_names: ['Juan Lebrón', 'Franco Stupaczuk'], score_a: 6, score_b: 3, status: 'finished' },

    // Ronda 3: Carlos con Coello en P1 (6-1). Galán con Stupa en P2 (8-7 - Partido ajustado)
    { round: 3, court: 1, team_a_names: ['Carlos Alcaraz', 'Arturo Coello'], team_b_names: ['Fede Chingotto', 'Martín Di Nenno'], score_a: 6, score_b: 1, status: 'finished' },
    { round: 3, court: 2, team_a_names: ['Ale Galán', 'Franco Stupaczuk'], team_b_names: ['Paquito Navarro', 'Juan Lebrón'], score_a: 8, score_b: 7, status: 'finished' },

    // Ronda 4: Carlos con Di Nenno en P1 (7-5). Coello con Paquito en P2 (6-4)
    { round: 4, court: 1, team_a_names: ['Carlos Alcaraz', 'Martín Di Nenno'], team_b_names: ['Ale Galán', 'Fede Chingotto'], score_a: 7, score_b: 5, status: 'finished' },
    { round: 4, court: 2, team_a_names: ['Arturo Coello', 'Paquito Navarro'], team_b_names: ['Juan Lebrón', 'Franco Stupaczuk'], score_a: 6, score_b: 4, status: 'finished' }
];

const sampleEntrenoDoc = {
    id: 'entreno_jueves_tarde_202',
    name: 'Entrenamiento Táctico Avanzado',
    type: 'entreno',
    format: 'pareja fija',
    level: 'Nivel 4.0 - 4.5',
    eventDate: '2026-09-25',
    location: 'SomosPádel Indoor Club'
};

const sampleEntrenoMatches = [
    { round: 1, court: 1, pair_a_name: 'Dúo Dinámico (Marta & Gemma)', pair_b_name: 'Las Guerreras (Bea & Delfi)', score_a: 6, score_b: 4, status: 'completed' },
    { round: 2, court: 1, pair_a_name: 'Dúo Dinámico (Marta & Gemma)', pair_b_name: 'Las Águilas (Paula & Ari)', score_a: 7, score_b: 5, status: 'completed' },
    { round: 3, court: 1, pair_a_name: 'Las Guerreras (Bea & Delfi)', pair_b_name: 'Las Águilas (Paula & Ari)', score_a: 6, score_b: 3, status: 'completed' }
];

// ================================================================================
// SUITE DE TESTS
// ================================================================================

async function runAllTests() {

    // ----------------------------------------------------------------------------
    // BLOQUE 1: VERIFICACIÓN ESTÁTICA Y DE INTEGRACIÓN DE ARCHIVOS
    // ----------------------------------------------------------------------------
    await test('INTEGRACIÓN', 'Referencias correctas de scripts en index.html y admin.html', () => {
        const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
        const adminHtml = fs.readFileSync(path.resolve(__dirname, '../admin.html'), 'utf8');

        assert(indexHtml.includes('TournamentChronicleService.js'), 'index.html debe cargar TournamentChronicleService.js');
        assert(indexHtml.includes('TournamentChronicleModal.js'), 'index.html debe cargar TournamentChronicleModal.js');
        assert(adminHtml.includes('TournamentChronicleService.js'), 'admin.html debe cargar TournamentChronicleService.js');
        assert(adminHtml.includes('TournamentChronicleModal.js'), 'admin.html debe cargar TournamentChronicleModal.js');
    });

    await test('INTEGRACIÓN', 'Puntos de llamada en ControlTowerSummary, ControlTowerView, EventModals y admin-entrenos', () => {
        const ctSummary = fs.readFileSync(path.resolve(__dirname, '../js/modules/americanas/ControlTowerSummary.js'), 'utf8');
        const ctView = fs.readFileSync(path.resolve(__dirname, '../js/modules/americanas/ControlTowerView.js'), 'utf8');
        const evModals = fs.readFileSync(path.resolve(__dirname, '../js/modules/ui/EventModals.js'), 'utf8');
        const adminEntrenos = fs.readFileSync(path.resolve(__dirname, '../js/modules/admin-entrenos.js'), 'utf8');

        assert(ctSummary.includes('TournamentChronicleModal.open'), 'ControlTowerSummary debe invocar TournamentChronicleModal.open');
        assert(ctView.includes('TournamentChronicleModal.open'), 'ControlTowerView debe invocar TournamentChronicleModal.open');
        assert(evModals.includes('TournamentChronicleModal.open'), 'EventModals debe invocar TournamentChronicleModal.open');
        assert(adminEntrenos.includes('TournamentChronicleModal.open'), 'admin-entrenos debe invocar TournamentChronicleModal.open');
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 2: EXTRACCIÓN Y SANITIZACIÓN DE DATOS (TORNEOS Y ENTRENOS)
    // ----------------------------------------------------------------------------
    await test('EXTRACCIÓN', 'Sanitización de torneo Americana Twister con podio', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        
        assert.strictEqual(chronicle.status, 'success');
        assert.strictEqual(chronicle.isFinished, true);
        assert.strictEqual(chronicle.meta.title, 'Americana Twister Viernes Noche');
        assert.strictEqual(chronicle.meta.type, 'americana');
        assert.strictEqual(chronicle.meta.format, 'twister');
        assert.strictEqual(chronicle.meta.category, 'Nivel 3.5 - 4.0');
        assert.strictEqual(chronicle.meta.totalMatches, 8);
        assert.strictEqual(chronicle.podium.length, 3);
        assert.strictEqual(chronicle.podium[0].place, 1);
        assert.strictEqual(chronicle.podium[1].place, 2);
        assert.strictEqual(chronicle.podium[2].place, 3);
    });

    await test('EXTRACCIÓN', 'Sanitización de modalidad Entreno y Parejas Fijas', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleEntrenoDoc, sampleEntrenoMatches);
        
        assert.strictEqual(chronicle.status, 'success');
        assert.strictEqual(chronicle.isFinished, true);
        assert.strictEqual(chronicle.meta.type, 'entreno');
        assert.strictEqual(chronicle.meta.format, 'pareja fija');
        assert.strictEqual(chronicle.meta.totalMatches, 3);
        assert(chronicle.podium.length === 3);
        assert(chronicle.headline.includes('SOMOSPÁDEL') || chronicle.headline.includes('DOMINAN') || chronicle.headline.includes('ÉPICA'));
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 3: IDENTIFICACIÓN MATEMÁTICA DEL MVP
    // ----------------------------------------------------------------------------
    await test('MVP MATH', 'Identificación de Carlos Alcaraz como MVP con 4 victorias e impacto superior', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const mvp = chronicle.mvp;

        assert(mvp, 'Debe existir un MVP');
        assert.strictEqual(mvp.name, 'Carlos Alcaraz');
        assert.strictEqual(mvp.won, 4, 'Carlos debe haber ganado sus 4 partidos');
        assert.strictEqual(mvp.winRatePercent, 100, 'Ratio de victoria debe ser 100%');
        assert.strictEqual(mvp.court1Wins, 4, 'Las 4 victorias fueron en Pista 1');
        assert(mvp.impactScore > 100, `El impactScore (${mvp.impactScore}) debe ser mayor a 100 debido a ponderaciones`);
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 4: DETECCIÓN DE MOMENTOS CUMBRE (HIGHLIGHTS)
    // ----------------------------------------------------------------------------
    await test('HIGHLIGHTS', 'Detección de partido más ajustado (8-7 en Ronda 3)', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const closest = chronicle.highlights.closestMatch;

        assert(closest, 'Debe detectar partido más ajustado');
        assert.strictEqual(closest.diff, 1, 'La diferencia mínima es 1');
        assert.strictEqual(closest.scoreString, '8-7');
        assert.strictEqual(closest.round, 3);
        assert.strictEqual(closest.court, 2);
    });

    await test('HIGHLIGHTS', 'Detección de la Gran Muralla (jugador con menos juegos encajados por partido)', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const def = chronicle.highlights.bestDefense;

        assert(def, 'Debe detectar mejor defensa');
        assert(def.name);
        assert(def.avgLostPerMatch > 0);
        assert(def.matchesPlayed >= 2, 'Debe tener un mínimo de 2 partidos');
    });

    await test('HIGHLIGHTS', 'Detección de racha invicta de victorias', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const streak = chronicle.highlights.longestStreak;

        assert(streak, 'Debe detectar racha ganadora');
        assert.strictEqual(streak.name, 'Carlos Alcaraz');
        assert.strictEqual(streak.streak, 4);
        assert.strictEqual(streak.isInvictus, true);
        assert(streak.description.includes('Invicto'));
    });

    await test('HIGHLIGHTS', 'Detección de escalada de pista (subida de Pista 2 a Pista 1)', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const climber = chronicle.highlights.biggestClimber;

        assert(climber, 'Debe detectar escalada');
        assert(['Paquito Navarro', 'Fede Chingotto'].includes(climber.name), 'Debe ser Paquito Navarro o Fede Chingotto');
        assert.strictEqual(climber.initialCourt, 2);
        assert.strictEqual(climber.finalCourt, 1);
        assert.strictEqual(climber.climbAmount, 1);
        assert.strictEqual(climber.reachedCourt1, true);
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 5: DETECCIÓN DE ASCENSOS Y CÁLCULO DE ELO
    // ----------------------------------------------------------------------------
    await test('PROGRESIÓN', 'Cálculo de ascensos a Pista 1 y subidas estimadas de ELO', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const prog = chronicle.progressions;

        assert(prog, 'Debe existir bloque de progresiones');
        assert(Array.isArray(prog.court1Ascents));
        // Chingotto comenzó en Pista 2 y jugó en Pista 1
        const chingottoAscent = prog.court1Ascents.find(a => a.name === 'Fede Chingotto');
        assert(chingottoAscent, 'Fede Chingotto debe figurar en ascensos a Pista 1');

        // Comprobar TOP ELO Gain (+50 para campeón invicto)
        assert(prog.eloGainList.length > 0);
        const topElo = prog.eloGainList[0];
        assert.strictEqual(topElo.rawGain, 50, 'El campeón debe recibir +50 de ELO estimado');
        assert.strictEqual(topElo.name, 'Carlos Alcaraz');

        // Comprobar recomendación de ascenso de categoría
        assert(prog.categoryPromotions.length > 0);
        assert(prog.categoryPromotions.some(p => p.name === 'Carlos Alcaraz'));
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 6: GENERACIÓN MULTI-ESTILO (EPIC, HYPE, TECHNICAL)
    // ----------------------------------------------------------------------------
    await test('NARRATIVA', 'Generación de crónicas en los 3 tonos (epic, hype, technical)', () => {
        const epic = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches, { tone: 'epic' });
        const hype = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches, { tone: 'hype' });
        const tech = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches, { tone: 'technical' });

        // Tono Epic
        assert(epic.headline.includes('ÉPICA') || epic.headline.includes('TOCA EL CIELO') || epic.headline.includes('BATALLA'));
        assert(epic.act1_intro.includes('Bajo el cielo'));
        assert(epic.fullChronicle.length > 300);

        // Tono Hype
        assert(hype.headline.includes('LOCURA') || hype.headline.includes('🔥'));
        assert(hype.act1_intro.includes('caldera'));
        assert(hype.act3_mvp_ascents.includes('REY DE LA PISTA'));

        // Tono Technical
        assert(tech.headline.includes('REPORTE TÁCTICO'));
        assert(tech.act1_intro.includes('transición defensa-ataque'));
        assert(tech.act3_mvp_ascents.includes('índice de impacto'));
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 7: WHATSAPP FORMAT & SHARE URLS
    // ----------------------------------------------------------------------------
    await test('WHATSAPP', 'Formato enriquecido con Markdown, Emojis y URL de compartir', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const waText = chronicle.whatsAppText;

        assert(waText.includes('🎾 *SOMOSPÁDEL BCN - CRÓNICA POST-TORNEO* 🏆'));
        assert(waText.includes('👑 *MVP DE LA JORNADA:*'));
        assert(waText.includes('Carlos Alcaraz'));
        assert(waText.includes('🏆 *PODIO DE HONOR:*'));
        assert(waText.includes('🔥 *MOMENTOS CUMBRE:*'));
        assert(waText.includes('📈 *Carlos Alcaraz:* +50 pts'));
        assert(waText.includes('#SomosPadelBCN'));

        const shareUrl = chronicleService.getWhatsAppShareUrl(chronicle);
        assert(shareUrl.startsWith('https://api.whatsapp.com/send?text='));
        assert(shareUrl.includes('SOMOSP%C3%81DEL') || shareUrl.includes('SOMOSP'));

        const payload = chronicleService.getSharePayload(sampleAmericanaTwister, sampleTwisterMatches);
        assert(payload.eventId === 'evt_americana_twister_101');
        assert(payload.whatsAppUrl.startsWith('https://api.whatsapp.com'));
        assert(payload.storyData);
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 8: ESTRUCTURA DE DATOS PARA INSTAGRAM STORY 9:16
    // ----------------------------------------------------------------------------
    await test('INSTAGRAM STORY DATA', 'Estructura vertical 9:16 para Canvas y Redes Sociales', () => {
        const chronicle = chronicleService.generateEpicChronicle(sampleAmericanaTwister, sampleTwisterMatches);
        const story = chronicle.instagramStoryData;

        assert.strictEqual(story.ratio, '9:16');
        assert.strictEqual(story.eventTitle, 'Americana Twister Viernes Noche');
        assert.strictEqual(story.category, 'Nivel 3.5 - 4.0');
        assert(story.shortTitle.includes('CARLOS ALCARAZ CAMPEÓN'));
        assert.strictEqual(story.podium.length, 3);
        assert.strictEqual(story.mvp.name, 'Carlos Alcaraz');
        assert(story.mvp.stats.includes('100% V'));
        assert(story.epicStat.includes('8-7'));
        assert(story.hashtags.includes('#SomosPadelBCN'));
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 9: COMPORTAMIENTO DEFENSIVO Y FALLBACKS
    // ----------------------------------------------------------------------------
    await test('FALLBACK DEFENSIVO', 'Generación de previa motivacional con < 2 partidos finalizados', () => {
        const incompleteMatches = [sampleTwisterMatches[0]];
        const preview = chronicleService.generateEpicChronicle(sampleAmericanaTwister, incompleteMatches);

        assert.strictEqual(preview.status, 'preview');
        assert.strictEqual(preview.isFinished, false);
        assert(preview.headline.includes('BATALLA ESTÁ SERVIDA'));
        assert(preview.whatsAppText.includes('PREVIA OFICIAL'));
        assert.strictEqual(preview.podium.length, 0);
        assert.strictEqual(preview.mvp, null);
    });

    await test('FALLBACK DEFENSIVO', 'Manejo resiliente de eventos vacíos o errores no controlados', () => {
        const errorFallback = chronicleService._generateErrorFallback(null, new Error('Simulated Database Error'));

        assert.strictEqual(errorFallback.status, 'error');
        assert.strictEqual(errorFallback.error, 'Simulated Database Error');
        assert(errorFallback.headline.includes('RESUMEN DE JORNADA'));
        assert(errorFallback.fullChronicle.includes('Torneo completado'));
    });

    // ----------------------------------------------------------------------------
    // BLOQUE 10: MODAL TOURNAMENTCHRONICLEMODAL (CICLO DE VIDA, TABS, TONOS, CANVAS)
    // ----------------------------------------------------------------------------
    await test('MODAL UI', 'Apertura de modal, selector de tonos y cambio de pestañas', async () => {
        // Abrir modal con los fixtures
        await chronicleModal.open(sampleAmericanaTwister, sampleTwisterMatches, { tone: 'epic', tab: 'chronicle' });

        assert(chronicleModal.modalEl !== null, 'El modalEl debe haberse creado en DOM');
        assert.strictEqual(chronicleModal.activeTone, 'epic');
        assert.strictEqual(chronicleModal.activeTab, 'chronicle');
        assert(chronicleModal.currentChronicle !== null, 'Debe haber generado la crónica');

        // Cambiar tono a Hype
        chronicleModal.setTone('hype');
        assert.strictEqual(chronicleModal.activeTone, 'hype');
        assert(chronicleModal.currentChronicle.headline.includes('LOCURA') || chronicleModal.currentChronicle.headline.includes('🔥'));

        // Cambiar a Tab Story
        chronicleModal.switchTab('story');
        assert.strictEqual(chronicleModal.activeTab, 'story');

        // Volver a Tab Chronicle
        chronicleModal.switchTab('chronicle');
        assert.strictEqual(chronicleModal.activeTab, 'chronicle');
    });

    await test('MODAL CANVAS HD', 'Renderizado nativo en Canvas 2D (1080 x 1920) y descarga PNG', async () => {
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 1080;
        mockCanvas.height = 1920;
        const ctx = mockCanvas.getContext('2d');

        await chronicleModal._drawStoryOnCanvas(ctx, 1080, 1920);

        // Validar que se realizaron las operaciones gráficas requeridas
        assert(ctx.calls.length > 50, 'El canvas debe ejecutar más de 50 primitivas de renderizado');
        
        const linearGradients = ctx.calls.filter(c => c.type === 'createLinearGradient');
        assert(linearGradients.length >= 2, 'Debe crear gradientes lineales para fondo y tarjetas');

        const radialGradients = ctx.calls.filter(c => c.type === 'createRadialGradient');
        assert(radialGradients.length >= 3, 'Debe crear resplandores de neón violeta, verde y fucsia');

        const textCalls = ctx.calls.filter(c => c.type === 'fillText');
        assert(textCalls.length >= 10, 'Debe dibujar textos de título, MVP, podio y momentos cumbre');

        // Validar que se dibuja el MVP y el Podio
        const hasMvpText = textCalls.some(t => t.args[0].includes('CARLOS ALCARAZ'));
        assert(hasMvpText, 'El canvas debe renderizar el nombre del MVP en mayúsculas');

        // Simular descarga PNG
        await chronicleModal.downloadStoryPng();
    });

    await test('MODAL SHARE & CLOSE', 'Acciones de compartir en WhatsApp, Clipboard y cierre del modal', async () => {
        // WhatsApp
        chronicleModal.shareWhatsApp();
        assert(global.window.lastOpenedUrl.startsWith('https://api.whatsapp.com/send?text='));

        // Portapapeles
        const fakeBtn = document.createElement('button');
        await chronicleModal.copyChronicle(fakeBtn);
        assert(mockNavigator.clipboard.lastWrittenText.includes('SOMOSPÁDEL BCN'));

        // Native Share
        await chronicleModal.shareNative();
        assert(mockNavigator.lastSharedData.title);

        // Cierre
        chronicleModal.close();
        // Esperar transición de cierre
        await new Promise(r => setTimeout(r, 300));
        assert.strictEqual(chronicleModal.modalEl, null, 'El modal debe haberse destruido tras close()');
    });

    // ----------------------------------------------------------------------------
    // RESUMEN FINAL DE LA SUITE
    // ----------------------------------------------------------------------------
    console.log("\n================================================================================");
    console.log(` RESULTADOS QA: ${passedCount} PASADOS / ${failedCount} FALLIDOS`);
    console.log("================================================================================");

    if (failedCount > 0) {
        console.error("❌ LA SUITE HA DETECTADO INCONSISTENCIAS.");
        process.exit(1);
    } else {
        console.log("🎉 TODOS LOS TESTS DE 'CRÓNICA POST-TORNEO CON IA' HAN PASADO EXITOSAMENTE AL 100%.");
        process.exit(0);
    }
}

runAllTests().catch(err => {
    console.error("FATAL SUITE ERROR:", err);
    process.exit(1);
});
