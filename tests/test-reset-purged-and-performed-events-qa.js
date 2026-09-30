/**
 * test-reset-purged-and-performed-events-qa.js
 * Test de QA para verificar la eliminación definitiva de eventos y notificaciones realizadas,
 * el reseteo del registro de purgas realizadas a 0 y la prevención de errores de arrayUnion en Firestore.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("🧪 Iniciando batería QA: Eliminación definitiva de realizadas y reseteo de purgas...\n");

// 1. Mock de localStorage
const localStorageStore = {};
global.localStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = String(v); },
    removeItem: (k) => { delete localStorageStore[k]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

// 2. Mock de window y Firebase
global.window = global;
global.window.addEventListener = () => {};
global.document = {
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    getElementById: (id) => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ appendChild: () => {}, style: {}, setAttribute: () => {} }),
    addEventListener: () => {}
};

const mockFirestoreData = {
    system_config: {
        purged_notifications: {
            purgedIds: Array.from({ length: 3683 }, (_, i) => `mock_id_${i}`),
            purgedCount: 3683,
            updatedAt: '2026-09-28T00:00:00.000Z'
        }
    },
    broadcasts: {
        bc_01: { title: 'Comunicado Antiguo', body: 'Texto', timestamp: Date.now() - 100000000 },
        bc_02: { title: 'Comunicado Realizado', body: 'Finalizado', timestamp: Date.now() - 50000000 }
    },
    americanas: {
        ame_past_01: {
            name: 'Americana Fin de Semana Pasada',
            date: '2026-01-10',
            status: 'cancelled',
            isCancelled: true
        }
    },
    entrenos: {
        ent_past_01: {
            title: 'Entreno Técnico Realizado',
            date: '2026-02-01',
            status: 'finished'
        }
    },
    players: {
        player_1: {
            notifications: {
                notif_realizada: {
                    title: 'Americana Realizada - Resultados',
                    body: 'El torneo ha concluido',
                    timestamp: Date.now() - 200000000,
                    data: { eventDate: '2026-01-10' }
                }
            }
        }
    }
};

global.firebase = {
    firestore: {
        FieldValue: {
            serverTimestamp: () => new Date().toISOString(),
            arrayUnion: (...items) => {
                if (items.length > 500) {
                    throw new Error(`FirebaseError: Function arrayUnion() requires at most 500 arguments, but was called with ${items.length} arguments.`);
                }
                return items;
            }
        }
    }
};

global.db = {
    collection: (col) => ({
        doc: (docId) => ({
            get: async () => {
                const colData = mockFirestoreData[col] || {};
                const d = colData[docId];
                return {
                    exists: Boolean(d),
                    id: docId,
                    data: () => d || {}
                };
            },
            set: async (payload, opts) => {
                mockFirestoreData[col] = mockFirestoreData[col] || {};
                if (opts?.merge && mockFirestoreData[col][docId]) {
                    Object.assign(mockFirestoreData[col][docId], payload);
                } else {
                    mockFirestoreData[col][docId] = { ...payload };
                }
            },
            update: async (patch) => {
                if (mockFirestoreData[col] && mockFirestoreData[col][docId]) {
                    Object.assign(mockFirestoreData[col][docId], patch);
                }
            },
            delete: async () => {
                if (mockFirestoreData[col]) {
                    delete mockFirestoreData[col][docId];
                }
            },
            collection: (subCol) => ({
                get: async () => {
                    const playerSub = mockFirestoreData[col]?.[docId]?.[subCol] || {};
                    const docs = Object.keys(playerSub).map(k => ({
                        id: k,
                        data: () => playerSub[k],
                        ref: {
                            delete: async () => { delete playerSub[k]; }
                        }
                    }));
                    return { docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
                },
                doc: (subId) => ({
                    get: async () => {
                        const sData = mockFirestoreData[col]?.[docId]?.[subCol]?.[subId];
                        return { exists: Boolean(sData), id: subId, data: () => sData || {} };
                    },
                    delete: async () => {
                        if (mockFirestoreData[col]?.[docId]?.[subCol]) {
                            delete mockFirestoreData[col]?.[docId]?.[subCol][subId];
                        }
                    }
                })
            })
        }),
        get: async () => {
            const colData = mockFirestoreData[col] || {};
            const docs = Object.keys(colData).map(k => ({
                id: k,
                data: () => colData[k],
                ref: {
                    delete: async () => { delete colData[k]; },
                    update: async (patch) => { Object.assign(colData[k], patch); }
                }
            }));
            return { docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
        }
    }),
    batch: () => {
        const ops = [];
        return {
            delete: (ref) => ops.push(ref.delete()),
            commit: async () => { await Promise.all(ops); }
        };
    }
};

global.AdminAuth = {
    user: { role: 'super_admin' },
    hasAdminRole: () => true
};

// Cargar módulos
require('../js/modules/common/NotificationService.js');
require('../js/modules/admin/AdminNotifications.js');
require('../js/modules/admin-notifications-manager.js');

async function runTests() {
    console.log("▶️ Test 1: Verificación del conteo inicial saturado con 3683 purgas...");
    const initialPurgedCount = await window.AdminNotificationsManagerCtrl.fetchPurgedCount();
    assert.strictEqual(initialPurgedCount, 3683, "Debe reportar 3683 purgas en la configuración inicial");
    console.log("  ✅ Inicialmente hay 3683 purgas reportadas.");

    console.log("▶️ Test 2: Reseteo definitivo del registro de purgas realizadas (resetPurgedRegistry)...");
    const resetResult = await window.NotificationService.resetPurgedRegistry();
    assert.strictEqual(resetResult.success, true, "El reseteo debe retornar success: true");

    const purgedDoc = mockFirestoreData.system_config.purged_notifications;
    assert.strictEqual(purgedDoc.purgedCount, 0, "purgedCount en Firestore debe quedar en 0");
    assert.strictEqual(Array.isArray(purgedDoc.purgedIds) && purgedDoc.purgedIds.length === 0, true, "purgedIds en Firestore debe estar vacío");
    assert.ok(purgedDoc.purgedAllBefore > 0, "purgedAllBefore debe estar establecido");

    const newPurgedCount = await window.AdminNotificationsManagerCtrl.fetchPurgedCount();
    assert.strictEqual(newPurgedCount, 0, "El conteo para el Admin debe ser ahora 0");
    console.log("  ✅ Registro de purgas vaciado para siempre (contador a 0 y purgedAllBefore activo).");

    console.log("▶️ Test 3: Eliminación global de evento cancelado actualiza Firestore con notificationPurged=true...");
    await window.NotificationService.deleteNotificationGlobally('evt_cancelled_americana_ame_past_01', {
        eventId: 'ame_past_01',
        title: 'Americana Fin de Semana Pasada'
    });
    const ameDoc = mockFirestoreData.americanas.ame_past_01;
    assert.strictEqual(ameDoc.notificationPurged, true, "La americana en Firestore debe tener notificationPurged: true");
    assert.strictEqual(ameDoc.hideFromNotifications, true, "La americana debe tener hideFromNotifications: true");
    console.log("  ✅ El evento cancelado fue marcado como notificationPurged=true en Firestore.");

    console.log("▶️ Test 4: fetchAllGlobalNotifications() no vuelve a incluir el evento cancelado purgado...");
    const globalList = await window.NotificationService.fetchAllGlobalNotifications();
    const hasCancelled = globalList.some(item => item.id.includes('ame_past_01'));
    assert.strictEqual(hasCancelled, false, "El evento purgado no debe volver a salir en la lista global");
    console.log("  ✅ La convocatoria cancelada ya no reaparece en la lista global.");

    console.log("▶️ Test 5: Purga de notificaciones realizadas y pasadas de jugadores...");
    await window.NotificationService.purgeExpiredAndOldNotifications({ olderThanMs: 0 });
    const playerNotifs = mockFirestoreData.players.player_1.notifications;
    assert.strictEqual(playerNotifs.notif_realizada, undefined, "La notificación de evento realizado debe haber sido eliminada de Firestore");
    console.log("  ✅ Las notificaciones de eventos realizados fueron eliminadas permanentemente de los jugadores.");

    console.log("▶️ Test 6: Purga total limpia absolutamente todo a 0...");
    await window.NotificationService.purgeExpiredAndOldNotifications({ all: true });
    assert.strictEqual(Object.keys(mockFirestoreData.broadcasts).length, 0, "Todos los comunicados deben ser eliminados en Purga Total");
    assert.strictEqual(mockFirestoreData.system_config.purged_notifications.purgedCount, 0, "El contador de purgas debe estar en 0");
    console.log("  ✅ Purga total exitosa: bandejas vaciadas y contadores a 0.");

    console.log("\n========================================================");
    console.log("🏆 TODAS LAS COMPROBACIONES DE ELIMINACIÓN Y RESETEO PASARON (100% PASS).");
    console.log("========================================================");
    process.exit(0);
}

runTests().catch(err => {
    console.error("❌ Test falló:", err);
    process.exit(1);
});
