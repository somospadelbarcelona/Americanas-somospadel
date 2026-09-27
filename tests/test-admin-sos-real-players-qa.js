/**
 * test-admin-sos-real-players-qa.js
 * 
 * Verificación QA de la suite Real de Convocatorias, Bajas y Mensajería Masiva
 * para Capitanes y Super Admin (SomosPádel BCN).
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log("🚀 Iniciando Test QA: Convocatorias, Jugadores Reales y Mensajería Masiva...");

// Mock environment
global.window = global;
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

// Mock Firestore DB
const mockBroadcasts = [];
const mockNotifications = {};

global.db = {
    collection(name) {
        return {
            where() {
                return {
                    where() {
                        return {
                            get: async () => ({ empty: true, forEach: () => {}, docs: [] })
                        };
                    },
                    get: async () => ({ empty: true, forEach: () => {}, docs: [] })
                };
            },
            doc(id) {
                return {
                    collection(subName) {
                        return {
                            doc() {
                                return { id: `doc_${Date.now()}` };
                            }
                        };
                    },
                    set: async (data) => data,
                    get: async () => ({ exists: false, data: () => null })
                };
            },
            add: async (payload) => {
                const id = `bc_${Date.now()}`;
                mockBroadcasts.push({ ...payload, id });
                return { id };
            },
            batch() {
                return {
                    set(ref, data) {
                        if (!mockNotifications[ref.id]) mockNotifications[ref.id] = [];
                        mockNotifications[ref.id].push(data);
                    },
                    commit: async () => true
                };
            }
        };
    }
};

const firestoreMockFn = () => ({
    batch: () => ({
        set(ref, data) {
            if (!mockNotifications[ref.id]) mockNotifications[ref.id] = [];
            mockNotifications[ref.id].push(data);
        },
        commit: async () => true
    })
});
firestoreMockFn.FieldValue = {
    serverTimestamp: () => new Date()
};

global.firebase = {
    firestore: firestoreMockFn
};

// Mock Players en BBDD
const mockClubPlayers = [
    { id: 'p_1', name: 'ALEJANDRO MARTÍNEZ', gender: 'chico', phone: '654112233', level: 4.25, side: 'reves', role: 'admin' },
    { id: 'p_2', name: 'MARC VALIENTE', gender: 'chico', phone: '677889900', level: 3.85, side: 'drive', role: 'player' },
    { id: 'p_3', name: 'LAURA SÁNCHEZ', gender: 'chica', phone: '612345678', level: 3.50, side: 'drive', role: 'player' },
    { id: 'p_4', name: 'CARLA DOMÍNGUEZ', gender: 'chica', phone: '699001122', level: 4.10, side: 'reves', role: 'player' },
    { id: 'p_5', name: 'CARLOS GÓMEZ', gender: 'chico', phone: '633445566', level: 2.75, side: 'any', role: 'player' }
];

global.FirebaseDB = {
    players: {
        getAll: async () => mockClubPlayers
    },
    entrenos: {
        getAll: async () => [
            {
                id: 'ent_1',
                name: 'Entreno Masculino Competición',
                category: 'male',
                date: '2026-09-27',
                time: '19:30',
                court: 'Pista 2',
                level_min: 3.5,
                level_max: 4.5,
                max_players: 4,
                players: [{ id: 'p_1' }, { id: 'p_2' }, { id: 'p_extra' }] // Faltaría 1 plaza
            },
            {
                id: 'ent_2',
                name: 'Entreno Mixto Perfeccionamiento',
                category: 'mixed',
                date: '2026-09-27',
                time: '20:45',
                court: 'Pista Central',
                level_min: 3.0,
                level_max: 4.0,
                max_players: 4,
                players: [{ id: 'p_1' }, { id: 'p_3' }] // Faltarían 2 plazas
            }
        ]
    },
    americanas: {
        getAll: async () => []
    }
};

global.EventService = {
    getAll: async (type) => {
        if (type === 'entreno') return global.FirebaseDB.entrenos.getAll();
        return [];
    }
};

// Cargar SosSubstitutesService
require('../js/modules/common/SosSubstitutesService.js');
// Cargar AdminSosSubstitutes
require('../js/modules/admin/AdminSosSubstitutes.js');

async function runTests() {
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } catch (e) {
            console.error(`  ❌ [FAIL] ${name}:`, e.message);
            failed++;
        }
    }

    console.log("\n🧪 1. Validación de Datos Reales (Sin Semillas Mock en Modo Real)");

    await test("getActiveSosAlerts con realOnly=true no inyecta alertas falsas si Firestore está vacío", async () => {
        const service = global.SosSubstitutesService;
        const alerts = await service.getActiveSosAlerts({ realOnly: true });
        assert(Array.isArray(alerts), "Debe ser array");
        assert.strictEqual(alerts.length, 0, "No debe inventar alertas si se especifica realOnly");
    });

    await test("getAvailableSubstitutes con realOnly=true no inyecta suplentes falsos si la bolsa está vacía", async () => {
        const service = global.SosSubstitutesService;
        const subs = await service.getAvailableSubstitutes(null, null, { realOnly: true });
        assert(Array.isArray(subs), "Debe ser array");
        assert.strictEqual(subs.length, 0, "No debe inventar suplentes falsos si realOnly=true");
    });

    console.log("\n🧪 2. Censo de Jugadores Reales & Normalización");

    await test("getClubPlayers recupera los jugadores reales de FirebaseDB con género y teléfono", async () => {
        const service = global.SosSubstitutesService;
        const players = await service.getClubPlayers();
        assert(players.length === 5, `Debe haber 5 jugadores reales (obtenidos: ${players.length})`);
        
        const ale = players.find(p => p.id === 'p_1');
        assert(ale, "Alejandro debe existir");
        assert.strictEqual(ale.gender, 'chico');
        assert.strictEqual(ale.phone, '654112233');

        const laura = players.find(p => p.id === 'p_3');
        assert(laura, "Laura debe existir");
        assert.strictEqual(laura.gender, 'chica');
    });

    await test("getClubPlayers filtra por género 'chico' para convocatorias masculinas", async () => {
        const service = global.SosSubstitutesService;
        const chicos = await service.getClubPlayers({ gender: 'chico' });
        assert.strictEqual(chicos.length, 3, "Debe haber 3 chicos");
        assert(chicos.every(c => c.gender === 'chico'), "Todos deben ser chicos");
    });

    await test("getClubPlayers filtra por rango de nivel", async () => {
        const service = global.SosSubstitutesService;
        const nivelAvanzado = await service.getClubPlayers({ levelMin: 3.8, levelMax: 4.5 });
        assert.strictEqual(nivelAvanzado.length, 3, "Deben encajar 3 jugadores entre 3.8 y 4.5");
    });

    console.log("\n🧪 3. Difusión Masiva y Mensajería a Jugadores");

    await test("broadcastConvocatoria para entreno masculino registra comunicado y calcula destinatarios masculinos", async () => {
        const service = global.SosSubstitutesService;
        const res = await service.broadcastConvocatoria({
            title: "⚡ Hueco urgente en Entreno Masculino de Hoy",
            body: "Queda 1 plaza para las 19:30 en Pista 2",
            targetAudience: "male",
            levelMin: 3.5,
            levelMax: 4.5,
            eventId: "ent_1",
            eventType: "entreno",
            sendPush: true,
            createSosAlert: false
        });

        assert(res.success, "Debe ser exitoso");
        assert(res.broadcastId, "Debe tener broadcastId");
        assert.strictEqual(res.recipientCount, 2, "Deben ser 2 chicos en el rango 3.5 a 4.5 (Alejandro 4.25 y Marc 3.85)");
        assert(mockBroadcasts.length > 0, "Debe registrarse en la colección broadcasts de Firestore");
    });

    await test("broadcastConvocatoria para entreno mixto incluye chicos y chicas", async () => {
        const service = global.SosSubstitutesService;
        const res = await service.broadcastConvocatoria({
            title: "👫 Entreno Mixto - Buscamos pareja",
            body: "Plazas abiertas para hoy",
            targetAudience: "mixed",
            levelMin: 3.0,
            levelMax: 4.0,
            eventId: "ent_2",
            eventType: "entreno"
        });

        assert(res.success);
        // En rango 3.0 a 4.0: Marc (3.85 chico) y Laura (3.50 chica)
        assert.strictEqual(res.recipientCount, 2, "Deben encajar Marc y Laura");
    });

    console.log("\n🧪 4. Módulo Administrativo AdminSosSubstitutes");

    await test("AdminSosSubstitutes expone métodos y detecta entrenos con plazas libres", async () => {
        const admin = global.AdminSosSubstitutes;
        assert(admin, "AdminSosSubstitutes debe existir globalmente");
        assert(typeof admin.openBroadcastModal === 'function', "Debe tener openBroadcastModal");
        assert(typeof admin.openCreateAlertModal === 'function', "Debe tener openCreateAlertModal");
        assert(typeof admin.openAssignPlayerToEventModal === 'function', "Debe tener openAssignPlayerToEventModal");

        // Probar carga de eventos incompletos
        const incomplete = await admin._loadIncompleteEvents();
        assert(incomplete.length === 2, "Debe haber detectado los 2 entrenos con huecos libres");
        assert.strictEqual(incomplete[0].freeSlots, 1, "Entreno 1 debe tener 1 plaza libre");
        assert.strictEqual(incomplete[1].freeSlots, 2, "Entreno 2 debe tener 2 plazas libres");
    });

    console.log("\n========================================================");
    console.log(`TOTAL PRUEBAS: ${passed + failed} | SUPERADAS: ${passed} | FALLIDAS: ${failed}`);
    console.log("========================================================");
    if (failed > 0) process.exit(1);
}

runTests();
