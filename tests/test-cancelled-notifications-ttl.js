/**
 * test-cancelled-notifications-ttl.js
 * Verificación integral del sistema de TTL, timestamps reales y purga global de eventos cancelados.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("========================================================");
console.log("🧪 TEST: TTL, TIMESTAMPS REALES Y PURGA GLOBAL DE EVENTOS");
console.log("========================================================\n");

// Mock de DOM y Firebase
const mockCollections = {
    broadcasts: new Map(),
    system_config: new Map(),
    players: new Map(),
    entrenos: new Map(),
    americanas: new Map()
};

const localStorageStore = {};
const mockLocalStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = String(v); },
    removeItem: (k) => { delete localStorageStore[k]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const mockDb = {
    _collections: mockCollections,
    collection(name) {
        if (!this._collections[name]) {
            this._collections[name] = new Map();
        }
        const col = this._collections[name];
        return {
            doc: (docId) => ({
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
                        doc: (subDocId) => ({
                            id: subDocId,
                            ref: { path: `${subKey}/${subDocId}` },
                            get: async () => ({
                                exists: subCol.has(subDocId),
                                data: () => subCol.get(subDocId) || {}
                            }),
                            set: async (d) => subCol.set(subDocId, d),
                            delete: async () => subCol.delete(subDocId)
                        }),
                        where: (field, op, val) => ({
                            get: async () => {
                                const docs = [];
                                for (const [k, d] of subCol.entries()) {
                                    const parts = field.split('.');
                                    let cur = d;
                                    for (const p of parts) cur = cur ? cur[p] : undefined;
                                    if (cur === val) {
                                        docs.push({ id: k, ref: { path: `${subKey}/${k}` }, data: () => d });
                                    }
                                }
                                return { empty: docs.length === 0, forEach: cb => docs.forEach(cb), docs };
                            }
                        }),
                        get: async () => {
                            const docs = [];
                            for (const [k, d] of subCol.entries()) {
                                docs.push({ id: k, ref: { path: `${subKey}/${k}` }, data: () => d });
                            }
                            return { empty: docs.length === 0, forEach: cb => docs.forEach(cb), docs };
                        },
                        orderBy: () => ({
                            limit: () => ({
                                get: async () => ({ empty: true, forEach: () => {}, docs: [] })
                            })
                        })
                    };
                }
            }),
            orderBy: () => ({
                limit: () => ({
                    get: async () => {
                        const docs = [];
                        for (const [k, d] of col.entries()) {
                            docs.push({ id: k, ref: { path: `${name}/${k}` }, data: () => d });
                        }
                        return { empty: docs.length === 0, forEach: cb => docs.forEach(cb), docs };
                    }
                })
            }),
            limit: () => ({
                get: async () => {
                    const docs = [];
                    for (const [k, d] of col.entries()) {
                        docs.push({ id: k, ref: { path: `${name}/${k}` }, data: () => d });
                    }
                    return { empty: docs.length === 0, forEach: cb => docs.forEach(cb), docs };
                }
            }),
            get: async () => {
                const docs = [];
                for (const [k, d] of col.entries()) {
                    docs.push({ id: k, ref: { path: `${name}/${k}` }, data: () => d });
                }
                return { empty: docs.length === 0, forEach: cb => docs.forEach(cb), docs };
            }
        };
    },
    batch: () => {
        const ops = [];
        return {
            set: (ref, data) => ops.push({ type: 'set', ref, data }),
            delete: (ref) => ops.push({ type: 'delete', ref }),
            commit: async () => {
                for (const op of ops) {
                    if (op.type === 'delete') {
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

global.window = {
    db: mockDb,
    localStorage: mockLocalStorage,
    auth: { currentUser: { uid: 'admin_1', role: 'super_admin' } },
    Store: {
        getState: (k) => k === 'currentUser' ? { uid: 'admin_1', role: 'super_admin' } : null
    },
    AdminAuth: {
        user: { uid: 'admin_1', role: 'super_admin' },
        hasAdminRole: (r) => ['super_admin', 'superadmin', 'admin'].includes(r)
    }
};

global.localStorage = mockLocalStorage;
global.document = { hidden: false };
global.navigator = { userAgent: 'NodeTest' };

// Cargar NotificationService.js
const notifCode = fs.readFileSync(path.resolve('js/modules/common/NotificationService.js'), 'utf8');
eval(notifCode);

const service = new window.NotificationServiceClass();

async function runTests() {
    // -------------------------------------------------------------------------
    // TEST 1: Caducidad y Timestamp en eventos cancelados antiguos (ej: Enero 2026)
    // -------------------------------------------------------------------------
    console.log("▶️ TEST 1: Eventos cancelados antiguos (> 48h) son descartados por TTL...");
    const oldEntreno = {
        name: "ENTRENO MIXTO 18/01",
        date: "2026-01-18",
        time: "17:00",
        status: "cancelado"
    };

    assert.strictEqual(service._isEventCancelledExpired(oldEntreno), true, "Evento del 18/01/2026 debe considerarse expirado");

    // Intentar cancelar el evento antiguo: no debe generar notificación ni guardarse
    mockLocalStorage.clear();
    service.handleEventCancelled('entreno', 'old_ent_18_01', oldEntreno, 'cancelado');
    const logsAfterOld = service._getCancelledEventsLog();
    assert.strictEqual(logsAfterOld.length, 0, "No debe registrarse en sp_cancelled_events_log si está caducado");
    console.log("  ✅ Evento de 18/01 correctamente ignorado por TTL y no añadido al feed.");

    // -------------------------------------------------------------------------
    // TEST 2: Eventos cancelados recientes o futuros se procesan con timestamp real
    // -------------------------------------------------------------------------
    console.log("\n▶️ TEST 2: Eventos cancelados recientes usan timestamp real (no new Date())...");
    // Evento para dentro de unas horas o mañana
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentEntreno = {
        name: "ENTRENO AVANZADO PRO",
        date: futureDate,
        time: "19:00",
        status: "cancelado",
        reason: "Lluvia intensa"
    };

    assert.strictEqual(service._isEventCancelledExpired(recentEntreno), false, "Evento futuro/reciente no debe considerarse expirado");
    service.handleEventCancelled('entreno', 'recent_ent_001', recentEntreno, 'cancelado');
    
    const logsRecent = service._getCancelledEventsLog();
    assert.strictEqual(logsRecent.length, 1, "Debe registrarse en log de eventos cancelados");
    assert.ok(logsRecent[0].title.includes("Entreno Cancelado"), "El título debe indicar Entreno Cancelado");
    // Verificar que el timestamp corresponde a la fecha del evento y no a la hora actual exacta
    const realTs = service._extractEventTimestamp(recentEntreno);
    assert.strictEqual(logsRecent[0].timestamp, realTs, "El timestamp debe ser el real del evento");
    console.log("  ✅ Evento reciente registrado con timestamp real del evento.");

    // -------------------------------------------------------------------------
    // TEST 3: _getCancelledEventsLog purga automáticamente registros caducados
    // -------------------------------------------------------------------------
    console.log("\n▶️ TEST 3: _getCancelledEventsLog sanea registros caducados preexistentes en localStorage...");
    const preExistingLog = [
        {
            id: 'evt_cancelled_entreno_legacy_january',
            title: '⛔ Entreno Cancelado: ENTRENO MIXTO 18/01',
            body: 'El evento previsto para el 2026-01-18 a las 17:00 ha sido cancelado o eliminado...',
            timestamp: '2026-09-25T10:00:00.000Z', // Timestamp engañoso de cuando se cargó
            data: { eventId: 'legacy_january', isCancelled: true }
        },
        {
            id: 'evt_cancelled_entreno_recent_one',
            title: '⛔ Entreno Cancelado: ENTRENO VIGENTE',
            body: `El evento previsto para el ${futureDate} a las 19:00 ha sido cancelado...`,
            timestamp: realTs,
            data: { eventId: 'recent_001', date: futureDate, time: '19:00', isCancelled: true }
        }
    ];
    mockLocalStorage.setItem('sp_cancelled_events_log', JSON.stringify(preExistingLog));

    // Al llamar a _getCancelledEventsLog, el de enero debe ser purgado por detectar 2026-01-18 en el body
    const cleanedLogs = service._getCancelledEventsLog();
    assert.strictEqual(cleanedLogs.length, 1, "Debe quedar solo 1 evento tras purgar el de enero");
    assert.strictEqual(cleanedLogs[0].id, 'evt_cancelled_entreno_recent_one', "El evento reciente debe preservarse");
    
    // Verificar que localStorage se actualizó automáticamente
    const savedInStorage = JSON.parse(mockLocalStorage.getItem('sp_cancelled_events_log'));
    assert.strictEqual(savedInStorage.length, 1, "localStorage debe persistir solo el evento no caducado");
    console.log("  ✅ Registros caducados detectados en localStorage y eliminados automáticamente.");

    // -------------------------------------------------------------------------
    // TEST 4: fetchAllGlobalNotifications consulta entrenos y americanas cancelados
    // -------------------------------------------------------------------------
    console.log("\n▶️ TEST 4: fetchAllGlobalNotifications incluye eventos cancelados de Firestore...");
    mockCollections.entrenos.set('ent_cancelled_db', {
        name: 'ENTRENO FEMENINO 23/09',
        date: '2026-09-24',
        time: '20:00',
        status: 'cancelado',
        cancelReason: 'Falta de inscripciones mínimas'
    });

    const globalNotifs = await service.fetchAllGlobalNotifications();
    const cancelledItem = globalNotifs.find(n => n.id === 'evt_cancelled_entreno_ent_cancelled_db');
    assert.ok(cancelledItem, "fetchAllGlobalNotifications debe encontrar el entreno cancelado");
    assert.strictEqual(cancelledItem.type, 'event_cancelled', "El tipo debe ser event_cancelled");
    assert.ok(cancelledItem.title.includes('ENTRENO FEMENINO 23/09'), "Debe incluir el título del evento");
    console.log("  ✅ fetchAllGlobalNotifications devuelve eventos cancelados de Firestore correctamente.");

    // -------------------------------------------------------------------------
    // TEST 5: deleteNotificationGlobally registra todas las firmas del evento
    // -------------------------------------------------------------------------
    console.log("\n▶️ TEST 5: deleteNotificationGlobally registra firmas múltiples y bloquea en jugadores...");
    
    // Añadir una notificación en la subcolección de un jugador
    const playerNotifCol = mockDb._collections['players/player_test_1/notifications'] = new Map();
    playerNotifCol.set('evt_cancelled_entreno_ent_cancelled_db', {
        title: '⛔ Entreno Cancelado: ENTRENO FEMENINO 23/09',
        eventId: 'ent_cancelled_db',
        data: { eventId: 'ent_cancelled_db' }
    });

    const purgeResult = await service.deleteNotificationGlobally('evt_cancelled_entreno_ent_cancelled_db', {
        eventId: 'ent_cancelled_db',
        title: '⛔ Entreno Cancelado: ENTRENO FEMENINO 23/09'
    });

    assert.strictEqual(purgeResult.success, true, "Purga global debe completarse con éxito");
    assert.ok(service.globalPurgedIds.has('ent_cancelled_db'), "Debe contener el eventId crudo");
    assert.ok(service.globalPurgedIds.has('evt_cancelled_entreno_ent_cancelled_db'), "Debe contener la firma con prefijo");
    assert.ok(service.globalPurgedIds.has('evt_cancelled_americana_ent_cancelled_db'), "Debe contener la variante americana");

    // Verificar que _isItemGloballyPurged bloquea cualquier variante en cualquier dispositivo de jugador
    assert.strictEqual(service._isItemGloballyPurged({ id: 'evt_cancelled_entreno_ent_cancelled_db' }), true);
    assert.strictEqual(service._isItemGloballyPurged({ id: 'notif_cancelled_ent_cancelled_db' }), true);
    assert.strictEqual(service._isItemGloballyPurged({ data: { eventId: 'ent_cancelled_db' } }), true);
    assert.strictEqual(service._isItemGloballyPurged({ title: '⛔ Entreno Cancelado: ENTRENO FEMENINO 23/09' }), true);
    console.log("  ✅ Todas las firmas registradas y _isItemGloballyPurged bloquea reactivamente.");

    // -------------------------------------------------------------------------
    // TEST 6: purgeExpiredAndOldNotifications purga eventos y notificaciones viejas
    // -------------------------------------------------------------------------
    console.log("\n▶️ TEST 6: purgeExpiredAndOldNotifications limpia en masa eventos caducados...");
    mockCollections.entrenos.set('ent_january_old', {
        name: 'ENTRENO MIXTO 18/01',
        date: '2026-01-18',
        time: '17:00',
        status: 'cancelado'
    });

    const massPurgeResult = await service.purgeExpiredAndOldNotifications();
    assert.strictEqual(massPurgeResult.success, true, "Purga masiva debe ser exitosa");
    assert.ok(service.globalPurgedIds.has('ent_january_old'), "El entreno de enero debe estar purgado globalmente");
    assert.ok(service.globalPurgedIds.has('evt_cancelled_entreno_ent_january_old'), "Firma con prefijo registrada");
    console.log("  ✅ purgeExpiredAndOldNotifications ejecutada y verificada.");

    console.log("\n========================================================");
    console.log("🎉 TODAS LAS PRUEBAS DE TTL, TIMESTAMPS Y PURGA PASARON!");
    console.log("========================================================\n");
}

runTests().catch(err => {
    console.error("❌ ERROR EN PRUEBAS:", err);
    process.exit(1);
});
