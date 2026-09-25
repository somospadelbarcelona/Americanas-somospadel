/**
 * test-superadmin-global-purge-qa.js
 * Valida la lógica de purga global de notificaciones por el SuperAdmin y su sincronización.
 */

const assert = require('assert');
const fs = require('fs');

console.log("🧪 Iniciando pruebas QA para purga global de notificaciones de SuperAdmin...");

// 1. Simulación de entorno Browser / Firebase
const mockDb = {
    _collections: {
        broadcasts: new Map(),
        system_config: new Map(),
        players: new Map()
    },
    collection(name) {
        if (!this._collections[name]) {
            this._collections[name] = new Map();
        }
        const col = this._collections[name];
        return {
            doc: (docId) => {
                return {
                    id: docId,
                    get: async () => {
                        const data = col.get(docId);
                        return {
                            exists: Boolean(data),
                            data: () => data || {}
                        };
                    },
                    set: async (val, options) => {
                        if (options && options.merge && col.has(docId)) {
                            col.set(docId, { ...col.get(docId), ...val });
                        } else {
                            col.set(docId, val);
                        }
                        if (this._listeners[name + '/' + docId]) {
                            this._listeners[name + '/' + docId]({
                                exists: true,
                                data: () => col.get(docId)
                            });
                        }
                    },
                    delete: async () => {
                        col.delete(docId);
                    },
                    collection: (subName) => {
                        const subKey = `${name}/${docId}/${subName}`;
                        if (!this._collections[subKey]) {
                            this._collections[subKey] = new Map();
                        }
                        const subCol = this._collections[subKey];
                        return {
                            doc: (subDocId) => {
                                const finalSubDocId = subDocId || 'doc_' + Math.random().toString(36).substr(2, 9);
                                return {
                                    id: finalSubDocId,
                                    ref: { path: `${subKey}/${finalSubDocId}` },
                                    get: async () => {
                                        const d = subCol.get(finalSubDocId);
                                        return {
                                            exists: Boolean(d),
                                            id: finalSubDocId,
                                            ref: { path: `${subKey}/${finalSubDocId}` },
                                            data: () => d || {}
                                        };
                                    }
                                };
                            },
                            where: (field, op, val) => {
                                return {
                                    get: async () => {
                                        const results = [];
                                        for (const [k, d] of subCol.entries()) {
                                            const parts = field.split('.');
                                            let cur = d;
                                            for (const p of parts) {
                                                cur = cur ? cur[p] : undefined;
                                            }
                                            if (cur === val) {
                                                results.push({
                                                    id: k,
                                                    ref: { path: `${subKey}/${k}` },
                                                    data: () => d
                                                });
                                            }
                                        }
                                        return {
                                            empty: results.length === 0,
                                            forEach: (cb) => results.forEach(cb),
                                            docs: results
                                        };
                                    }
                                };
                            },
                            get: async () => {
                                const docs = [];
                                for (const [k, d] of subCol.entries()) {
                                    docs.push({
                                        id: k,
                                        ref: { path: `${subKey}/${k}` },
                                        data: () => d
                                    });
                                }
                                return {
                                    empty: docs.length === 0,
                                    docs,
                                    forEach: (cb) => docs.forEach(cb)
                                };
                            },
                            orderBy: () => ({
                                limit: () => ({
                                    get: async () => ({
                                        empty: true,
                                        docs: [],
                                        forEach: () => {}
                                    })
                                })
                            })
                        };
                    }
                };
            },
            get: async () => {
                const docs = [];
                for (const [k, d] of col.entries()) {
                    docs.push({
                        id: k,
                        ref: { path: `${name}/${k}` },
                        data: () => d
                    });
                }
                return {
                    empty: docs.length === 0,
                    size: docs.length,
                    docs,
                    forEach: (cb) => docs.forEach(cb)
                };
            },
            limit: () => ({
                get: async () => {
                    const docs = [];
                    for (const [k, d] of col.entries()) {
                        docs.push({
                            id: k,
                            ref: { path: `${name}/${k}` },
                            data: () => d
                        });
                    }
                    return {
                        empty: docs.length === 0,
                        size: docs.length,
                        docs,
                        forEach: (cb) => docs.forEach(cb)
                    };
                }
            })
        };
    },
    _listeners: {},
    batch: () => {
        const ops = [];
        return {
            set: (ref, data) => ops.push({ type: 'set', ref, data }),
            delete: (ref) => ops.push({ type: 'delete', ref }),
            commit: async () => {
                for (const op of ops) {
                    if (op.type === 'delete') {
                        // Extraer path
                        const parts = op.ref.path.split('/');
                        const colKey = `${parts[0]}/${parts[1]}/${parts[2]}`;
                        const docId = parts[3];
                        if (mockDb._collections[colKey]) {
                            mockDb._collections[colKey].delete(docId);
                        }
                    }
                }
            }
        };
    }
};

// Configurar globals
global.window = {
    db: mockDb,
    firebase: {
        firestore: {
            FieldValue: {
                arrayUnion: (...items) => items,
                serverTimestamp: () => new Date().toISOString()
            }
        }
    },
    localStorage: {
        _store: {},
        getItem(k) { return this._store[k] || null; },
        setItem(k, v) { this._store[k] = String(v); },
        removeItem(k) { delete this._store[k]; }
    },
    auth: {
        currentUser: { uid: 'superadmin_1', role: 'super_admin' },
        onAuthStateChanged: () => {}
    },
    Store: {
        getState: (key) => {
            if (key === 'currentUser') return { uid: 'superadmin_1', role: 'super_admin', name: 'Super Alex' };
            return null;
        },
        subscribe: () => {}
    },
    AdminAuth: {
        user: { uid: 'superadmin_1', role: 'super_admin' },
        hasAdminRole: (role) => ['super_admin', 'superadmin', 'admin'].includes(role)
    },
    addEventListener: () => {}
};

global.localStorage = global.window.localStorage;
global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, appendChild: () => {}, innerHTML: '' }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    readyState: 'complete',
    addEventListener: () => {}
};

// Cargar NotificationService
eval(fs.readFileSync('js/modules/common/NotificationService.js', 'utf8'));

// Test 1: Instanciación e inicialización
console.log("➡️ Test 1: Instanciación e inicialización de NotificationService...");
const notifService = new window.NotificationServiceClass();
assert.ok(notifService.globalPurgedIds instanceof Set, "globalPurgedIds debe ser una instancia de Set");
assert.strictEqual(notifService.globalPurgedIds.size, 0, "globalPurgedIds debe inicializarse vacío");

// Test 2: Inclusión y exclusión reactiva en getMergedNotifications
console.log("➡️ Test 2: Filtrado por id y broadcastId purgados en getMergedNotifications...");
notifService.notifications = [
    { id: 'notif_1', title: 'Aviso Válido', body: 'Cuerpo normal', timestamp: Date.now() },
    { id: 'notif_purge_me', title: 'Aviso a Borrar', body: 'Debe desaparecer', timestamp: Date.now(), data: { broadcastId: 'b_123' } },
    { id: 'notif_2', title: 'Segundo Válido', body: 'Otro cuerpo', timestamp: Date.now() }
];

let merged = notifService.getMergedNotifications();
// Contiene 3 notificaciones + 1 del sistema (Radar & Clima)
assert.strictEqual(merged.length, 4, "Inicialmente debe haber 4 notificaciones (3 de usuario + 1 del sistema)");

// Simular purga del broadcastId 'b_123'
notifService.globalPurgedIds.add('b_123');
merged = notifService.getMergedNotifications();
assert.strictEqual(merged.length, 3, "La notificación asociada a 'b_123' debe haber desaparecido de inmediato");
assert.ok(!merged.some(n => n.id === 'notif_purge_me'), "notif_purge_me no debe estar presente");

// Simular purga del aviso de sistema Radar
notifService.globalPurgedIds.add('system_radar_clima_relocated');
merged = notifService.getMergedNotifications();
assert.strictEqual(merged.length, 2, "El aviso del sistema debe desaparecer al estar purgado globalmente");
assert.ok(!merged.some(n => n.id === 'system_radar_clima_relocated'), "system_radar_clima_relocated no debe estar presente");

// Test 3: deleteNotificationGlobally con permisos de SuperAdmin
console.log("➡️ Test 3: Borrado global con fan-out en subcolecciones de jugadores...");
(async () => {
    // Preparar broadcast en Firestore
    mockDb._collections['broadcasts'].set('broadcast_xyz', {
        title: 'Torneo Relámpago',
        body: 'Inscripciones abiertas',
        timestamp: Date.now()
    });

    // Preparar jugadores y sus subcolecciones
    mockDb._collections['players'].set('player_1', { name: 'Jugador 1' });
    mockDb._collections['players'].set('player_2', { name: 'Jugador 2' });
    mockDb._collections['players/player_1/notifications'] = new Map();
    mockDb._collections['players/player_2/notifications'] = new Map();

    mockDb._collections['players/player_1/notifications'].set('p1_n1', {
        title: 'Torneo Relámpago',
        data: { broadcastId: 'broadcast_xyz' }
    });
    mockDb._collections['players/player_2/notifications'].set('p2_n1', {
        title: 'Torneo Relámpago',
        data: { broadcastId: 'broadcast_xyz' }
    });

    assert.strictEqual(mockDb._collections['broadcasts'].size, 1);
    assert.strictEqual(mockDb._collections['players/player_1/notifications'].size, 1);
    assert.strictEqual(mockDb._collections['players/player_2/notifications'].size, 1);

    const deleteResult = await notifService.deleteNotificationGlobally('broadcast_xyz', { broadcastId: 'broadcast_xyz', title: 'Torneo Relámpago' });
    
    assert.strictEqual(deleteResult.success, true, "El borrado debe retornar success: true");
    assert.strictEqual(deleteResult.broadcastDeleted, true, "El broadcast en Firestore debe ser eliminado");
    assert.strictEqual(deleteResult.deletedFromPlayersCount, 2, "Deben borrarse 2 notificaciones de jugadores");
    assert.strictEqual(mockDb._collections['broadcasts'].size, 0, "La colección broadcasts debe quedar vacía");
    assert.strictEqual(mockDb._collections['players/player_1/notifications'].size, 0, "Subcolección de player_1 limpia");
    assert.strictEqual(mockDb._collections['players/player_2/notifications'].size, 0, "Subcolección de player_2 limpia");

    // Test 4: Verificación de seguridad de rol
    console.log("➡️ Test 4: Rechazo si el rol no es SuperAdmin...");
    window.Store.getState = () => ({ role: 'player' });
    window.AdminAuth.user = { role: 'player' };
    let unauthorizedThrown = false;
    try {
        await notifService.deleteNotificationGlobally('any_id');
    } catch (e) {
        unauthorizedThrown = true;
    }
    assert.ok(unauthorizedThrown, "Debe lanzar error si el usuario no es super_admin");

    // Restaurar rol
    window.Store.getState = () => ({ role: 'super_admin' });
    window.AdminAuth.user = { role: 'super_admin' };

    // Test 5: fetchAllGlobalNotifications
    console.log("➡️ Test 5: fetchAllGlobalNotifications...");
    mockDb._collections['broadcasts'].set('b_new', {
        title: 'Nuevo Aviso Global',
        body: 'Cuerpo del aviso',
        createdAt: '2026-09-24T12:00:00.000Z',
        authorName: 'Alex SuperAdmin'
    });

    const globalList = await notifService.fetchAllGlobalNotifications();
    assert.ok(Array.isArray(globalList), "Debe devolver un array");
    assert.ok(globalList.some(item => item.id === 'b_new'), "Debe incluir el broadcast creado");
    const item = globalList.find(i => i.id === 'b_new');
    assert.strictEqual(item.title, 'Nuevo Aviso Global');
    assert.strictEqual(item.authorName, 'Alex SuperAdmin');

    // Test 6: Delegación en AdminNotifications
    console.log("➡️ Test 6: Delegación de métodos en AdminNotifications...");
    window.NotificationService = notifService;
    eval(fs.readFileSync('js/modules/admin/AdminNotifications.js', 'utf8'));

    assert.ok(typeof window.AdminNotifications.deleteGlobal === 'function', "deleteGlobal debe existir en AdminNotifications");
    assert.ok(typeof window.AdminNotifications.fetchGlobalList === 'function', "fetchGlobalList debe existir en AdminNotifications");

    const adminGlobalList = await window.AdminNotifications.fetchGlobalList();
    assert.ok(Array.isArray(adminGlobalList), "AdminNotifications.fetchGlobalList debe retornar la lista");

    console.log("✅ TODAS LAS PRUEBAS UNITARIAS DE SUPERADMIN GLOBAL PURGE PASARON CON ÉXITO.");
    process.exit(0);
})().catch(err => {
    console.error("❌ Error en tests:", err);
    process.exit(1);
});
