/**
 * test-frontend-admin-notifications-purge-qa.js
 * Valida la integración Frontend de:
 * 1. Botón 'notif-manager-purge-old-btn' y método purgeExpiredAndOld().
 * 2. Filtro de categoría 'cancelled' para convocatorias canceladas.
 * 3. Renderizado de tarjetas con badge estilizado, fecha del evento e ID del evento.
 * 4. Envío de eventId en confirmDelete().
 * 5. Consumo seguro en NotificationUi con estado CANCELADO y fechas resilientes.
 */

const assert = require('assert');
const fs = require('fs');

console.log("🧪 Iniciando batería QA Frontend: Purga Masiva y Convocatorias Canceladas...");

// Mock de DOM básico
const domStore = {};
global.document = {
    readyState: 'complete',
    getElementById(id) {
        return domStore[id] || null;
    },
    createElement(tag) {
        return {
            tagName: tag,
            style: {},
            classList: {
                add() {},
                remove() {},
                toggle() {}
            },
            setAttribute() {},
            appendChild() {},
            innerHTML: '',
            dataset: {}
        };
    },
    body: {
        classList: { add() {}, remove() {} },
        appendChild() {}
    },
    head: {
        appendChild() {}
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {}
};

global.window = {
    document: global.document,
    localStorage: {
        _s: {},
        getItem(k) { return this._s[k] || null; },
        setItem(k, v) { this._s[k] = String(v); },
        removeItem(k) { delete this._s[k]; }
    },
    AdminAuth: {
        user: { role: 'super_admin' },
        hasAdminRole: (r) => r === 'super_admin'
    },
    Store: {
        getState: () => ({ role: 'super_admin' })
    },
    addEventListener: () => {},
    PremiumModal: {
        confirmCalled: false,
        alertCalled: false,
        confirm: async (opts) => {
            window.PremiumModal.confirmCalled = true;
            window.PremiumModal.lastConfirmOpts = opts;
            return true; // Simular aceptación de usuario
        },
        alert: async (opts) => {
            window.PremiumModal.alertCalled = true;
            window.PremiumModal.lastAlertOpts = opts;
            return true;
        }
    }
};

// Mock de Firebase DB
const mockDb = {
    _collections: {
        broadcasts: new Map(),
        system_config: new Map(),
        americanas: new Map(),
        entrenos: new Map(),
        players: new Map()
    },
    collection(name) {
        if (!this._collections[name]) this._collections[name] = new Map();
        const col = this._collections[name];
        return {
            doc: (docId) => ({
                id: docId,
                get: async () => ({
                    exists: col.has(docId),
                    data: () => col.get(docId) || {}
                }),
                set: async (val) => { col.set(docId, val); },
                delete: async () => { col.delete(docId); },
                collection: (subName) => {
                    const subKey = `${name}/${docId}/${subName}`;
                    if (!this._collections[subKey]) this._collections[subKey] = new Map();
                    const subCol = this._collections[subKey];
                    return {
                        doc: (sId) => ({
                            id: sId,
                            ref: { path: `${subKey}/${sId}` },
                            get: async () => ({ exists: subCol.has(sId), data: () => subCol.get(sId) || {} })
                        }),
                        where: (field, op, val) => ({
                            get: async () => {
                                const docs = [];
                                for (const [k, d] of subCol.entries()) {
                                    let cur = d;
                                    for (const p of field.split('.')) {
                                        cur = cur ? cur[p] : undefined;
                                    }
                                    if (cur === val) docs.push({ id: k, ref: { path: `${subKey}/${k}` }, data: () => d });
                                }
                                return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb), docs };
                            }
                        }),
                        get: async () => {
                            const docs = [];
                            for (const [k, d] of subCol.entries()) {
                                docs.push({ id: k, ref: { path: `${subKey}/${k}` }, data: () => d });
                            }
                            return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb), docs };
                        }
                    };
                }
            }),
            where: () => ({
                get: async () => ({ empty: true, forEach: () => {}, docs: [] })
            }),
            get: async () => {
                const docs = [];
                for (const [k, d] of col.entries()) {
                    docs.push({ id: k, data: () => d });
                }
                return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb), docs };
            }
        };
    },
    batch: () => ({
        delete: () => {},
        commit: async () => {}
    })
};
window.db = mockDb;

(async function runTests() {
    // 1. Cargar scripts
    eval(fs.readFileSync('js/modules/common/NotificationService.js', 'utf8'));
    const notifInstance = new window.NotificationServiceClass();
    window.NotificationService = notifInstance;

    eval(fs.readFileSync('js/modules/admin/AdminNotifications.js', 'utf8'));
    eval(fs.readFileSync('js/modules/admin-notifications-manager.js', 'utf8'));
    eval(fs.readFileSync('js/modules/ui/NotificationUi.js', 'utf8'));

    // Configurar elemento contenedor
    const contentArea = {
        innerHTML: '',
        style: {}
    };
    domStore['content-area'] = contentArea;

    console.log("➡️ TEST 1: Carga de vista y comprobación de botón 'notif-manager-purge-old-btn'...");
    await window.AdminNotificationsManagerCtrl.init();

    assert.ok(contentArea.innerHTML.includes('id="notif-manager-purge-old-btn"'), "El botón con id 'notif-manager-purge-old-btn' debe estar presente en la cabecera");
    assert.ok(contentArea.innerHTML.includes('Purgar Antiguas y Caducadas'), "El texto del botón de purga debe estar presente");
    assert.ok(contentArea.innerHTML.includes('value="cancelled"'), "El selector de categorías debe contener la opción 'cancelled'");
    assert.ok(contentArea.innerHTML.includes('Convocatorias Canceladas'), "El texto 'Convocatorias Canceladas' debe estar presente en el select");
    console.log("  ✅ Test 1 Superado: Botón de purga y selector de categoría presentes en HTML.");

    console.log("➡️ TEST 2: Ejecución de purgeExpiredAndOld()...");
    const purgeBtn = {
        disabled: false,
        innerHTML: '🧹 Purgar Antiguas y Caducadas',
        style: {}
    };
    domStore['notif-manager-purge-old-btn'] = purgeBtn;

    await window.AdminNotificationsManagerCtrl.purgeExpiredAndOld();
    assert.strictEqual(window.PremiumModal.confirmCalled, true, "PremiumModal.confirm debe haber sido invocado");
    assert.ok(window.PremiumModal.lastConfirmOpts.title.includes("Purgar notificaciones"), "El título de confirmación debe coincidir");
    assert.strictEqual(window.PremiumModal.lastConfirmOpts.confirmText, "PURGAR MASIVAMENTE", "ConfirmText debe ser 'PURGAR MASIVAMENTE'");
    assert.strictEqual(window.PremiumModal.alertCalled, true, "PremiumModal.alert debe mostrarse con el éxito de la purga");
    console.log("  ✅ Test 2 Superado: purgeExpiredAndOld ejecutó la purga y mostró alertas correctas.");

    console.log("➡️ TEST 3: Filtrado por categoría 'cancelled'...");
    window.AdminNotificationsManagerCtrl.items = [
        { id: '1', title: 'Aviso Normal', type: 'broadcast' },
        { id: '2', title: 'Entreno Cancelado', type: 'event_cancelled' },
        { id: '3', title: 'Aviso Sistema', type: 'system' }
    ];
    window.AdminNotificationsManagerCtrl.selectedCategory = 'cancelled';
    window.AdminNotificationsManagerCtrl.applyFilters();
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 1, "Solo debe quedar 1 item filtrado");
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems[0].id, '2', "El item debe ser el de tipo event_cancelled");
    console.log("  ✅ Test 3 Superado: Filtro por categoría 'cancelled' funciona con precisión.");

    console.log("➡️ TEST 4: Renderizado de card con Convocatoria Cancelada y meta eventId...");
    const cardHtml = window.AdminNotificationsManagerCtrl.renderItemCard({
        id: 'notif_cancelled_evt_99',
        title: 'Torneo Americana Cancelado',
        body: 'Suspendido por lluvia',
        type: 'event_cancelled',
        createdAt: new Date().toISOString(),
        authorName: 'SomosPadel Admin',
        targetCount: 'Inscritos',
        data: {
            eventId: 'evt_99',
            eventDate: '28/09/2026',
            eventTime: '18:00'
        }
    });

    assert.ok(cardHtml.includes('Convocatoria Cancelada'), "Debe incluir el badge 'Convocatoria Cancelada'");
    assert.ok(cardHtml.includes('fa-calendar-xmark'), "Debe incluir el icono fa-calendar-xmark");
    assert.ok(cardHtml.includes('Fecha prevista:'), "Debe renderizar la fecha prevista del evento");
    assert.ok(cardHtml.includes('28/09/2026'), "Debe mostrar el string de fecha");
    assert.ok(cardHtml.includes('EventID:'), "Debe renderizar la etiqueta EventID");
    assert.ok(cardHtml.includes('evt_99'), "Debe renderizar el ID del evento");
    console.log("  ✅ Test 4 Superado: Tarjeta renderizada con estilo rojo, fecha e ID del evento.");

    console.log("➡️ TEST 5: confirmDelete pasa eventId en meta...");
    let passedMeta = null;
    window.NotificationService.deleteNotificationGlobally = async (id, meta) => {
        passedMeta = meta;
        return { success: true, deletedFromPlayersCount: 1 };
    };

    window.AdminNotificationsManagerCtrl.items = [{
        id: 'notif_cancelled_evt_99',
        title: 'Torneo Americana Cancelado',
        type: 'event_cancelled',
        data: { eventId: 'evt_99' }
    }];

    await window.AdminNotificationsManagerCtrl.confirmDelete('notif_cancelled_evt_99');
    assert.ok(passedMeta, "deleteNotificationGlobally debió recibir meta");
    assert.strictEqual(passedMeta.eventId, 'evt_99', "meta.eventId debe ser evt_99");
    console.log("  ✅ Test 5 Superado: confirmDelete incluye eventId en meta.");

    console.log("➡️ TEST 6: NotificationUi normalización y resiliencia de fechas...");
    const norm = window.NotificationUi._normalizeNotificationItem({
        id: 'test_1',
        title: 'Convocatoria Cancelada',
        type: 'event_cancelled',
        data: { eventId: 'evt_77' },
        createdAt: '2026-09-25T20:00:00.000Z'
    });

    assert.strictEqual(norm.tag.label, 'CANCELADO', "Tag en cliente debe ser CANCELADO");
    assert.strictEqual(norm.tag.cssClass, 'tag-cancelled', "Clase CSS debe ser tag-cancelled");
    assert.ok(typeof norm.timeFormatted === 'string', "timeFormatted debe ser string válido");

    // Probar parseTimestamp con null, undefined, timestamps corruptos
    assert.ok(window.NotificationUi.parseTimestamp(null) instanceof Date, "parseTimestamp(null) retorna Date válido");
    assert.ok(window.NotificationUi.parseTimestamp("fecha_invalida") instanceof Date, "parseTimestamp(invalido) retorna Date válido");
    assert.strictEqual(window.NotificationUi.timeAgo("invalido"), "Ahora", "timeAgo de fecha inválida retorna 'Ahora' sin lanzar excepción");

    console.log("  ✅ Test 6 Superado: NotificationUi normaliza correctamente y resiste fechas inválidas.");

    console.log("\n========================================================");
    console.log("🏆 TODAS LAS PRUEBAS FRONTEND PASARON EXITOSAMENTE (100% PASS).");
    console.log("========================================================\n");
    process.exit(0);
})().catch(err => {
    console.error("❌ Error en tests:", err);
    process.exit(1);
});
