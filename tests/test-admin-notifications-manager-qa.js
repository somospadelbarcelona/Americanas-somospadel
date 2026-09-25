/**
 * test-admin-notifications-manager-qa.js
 * Suite integral de pruebas QA para la funcionalidad de Gestión y Eliminación Global
 * de Notificaciones de SuperAdmin en SomosPadel.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("🧪 Iniciando batería integral de pruebas QA: Gestor Global de Notificaciones (SuperAdmin)...\n");

// ============================================================================
// BLOQUE 1: Verificación Estática de Archivos y Enlaces en HTML y JS
// ============================================================================
console.log("▶️ BLOQUE 1: Verificación estática de admin.html y js/admin.js");

const adminHtmlPath = path.resolve('admin.html');
const adminJsPath = path.resolve('js/admin.js');
const managerJsPath = path.resolve('js/modules/admin-notifications-manager.js');

assert.ok(fs.existsSync(adminHtmlPath), "admin.html debe existir");
assert.ok(fs.existsSync(adminJsPath), "js/admin.js debe existir");
assert.ok(fs.existsSync(managerJsPath), "js/modules/admin-notifications-manager.js debe existir");

const adminHtmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
const adminJsContent = fs.readFileSync(adminJsPath, 'utf8');
const managerJsContent = fs.readFileSync(managerJsPath, 'utf8');

// 1.1 Botón del menú lateral en admin.html
assert.ok(
    adminHtmlContent.includes('btn-notif-cleaner'),
    "admin.html debe contener el botón con la clase .btn-notif-cleaner"
);
assert.ok(
    adminHtmlContent.includes('data-view="notifications_manager"'),
    "admin.html debe contener el atributo data-view=\"notifications_manager\""
);
assert.ok(
    adminHtmlContent.includes("loadAdminView('notifications_manager')"),
    "admin.html debe vincular onclick con loadAdminView('notifications_manager')"
);
console.log("  ✅ admin.html contiene botón .btn-notif-cleaner con data-view=\"notifications_manager\".");

// 1.2 Inclusión del script en admin.html
assert.ok(
    adminHtmlContent.includes('js/modules/admin-notifications-manager.js'),
    "admin.html debe importar el script js/modules/admin-notifications-manager.js"
);
console.log("  ✅ admin.html incluye <script src=\"js/modules/admin-notifications-manager.js\">.");

// 1.3 Ruta de navegación en js/admin.js
assert.ok(
    adminJsContent.includes("viewName === 'notifications_manager'"),
    "js/admin.js debe contener la bifurcación para 'notifications_manager'"
);
assert.ok(
    adminJsContent.includes("window.AdminViews.notifications_manager"),
    "js/admin.js debe invocar window.AdminViews.notifications_manager"
);
console.log("  ✅ js/admin.js incluye la ruta de navegación para 'notifications_manager'.");


// ============================================================================
// BLOQUE 2: Simulación de Entorno DOM y Firestore
// ============================================================================
console.log("\n▶️ BLOQUE 2: Configuración de entorno simulado (DOM, Firebase, Storage)");

const mockCollections = {
    broadcasts: new Map(),
    system_config: new Map(),
    players: new Map()
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
                        doc: (subDocId) => {
                            const finalSubDocId = subDocId || 'subdoc_' + Math.random().toString(36).substr(2, 7);
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
                        where: (field, op, val) => ({
                            get: async () => {
                                const results = [];
                                for (const [k, d] of subCol.entries()) {
                                    const parts = field.split('.');
                                    let cur = d;
                                    for (const p of parts) cur = cur ? cur[p] : undefined;
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
                        }),
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
            }),
            orderBy: () => ({
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
            }),
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
            }),
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

// Mock simple de DOM
const elementsMap = new Map();
function createMockElement(id = '', tag = 'div') {
    const el = {
        id,
        tagName: tag.toUpperCase(),
        _innerHTML: '',
        style: {},
        value: '',
        disabled: false,
        get innerHTML() { return this._innerHTML; },
        set innerHTML(val) {
            this._innerHTML = val;
            // Parse ids dentro del HTML para getElementById
            const idMatches = [...val.matchAll(/id=["']([^"']+)["']/g)];
            for (const match of idMatches) {
                if (!elementsMap.has(match[1])) {
                    elementsMap.set(match[1], createMockElement(match[1]));
                }
            }
        },
        querySelector: (sel) => null,
        querySelectorAll: (sel) => [],
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null
    };
    if (id) elementsMap.set(id, el);
    return el;
}

const contentArea = createMockElement('content-area');

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
        currentUser: { uid: 'superadmin_test', role: 'super_admin' }
    },
    Store: {
        getState: (key) => {
            if (key === 'currentUser') return { uid: 'superadmin_test', role: 'super_admin', name: 'SuperAdmin QA' };
            return null;
        }
    },
    AdminAuth: {
        user: { uid: 'superadmin_test', role: 'super_admin' },
        hasAdminRole: (r) => ['super_admin', 'superadmin', 'admin', 'admin_player'].includes(r)
    },
    PremiumModal: {
        confirm: async () => true,
        alert: async () => true
    },
    addEventListener: () => {},
    AdminViews: {}
};

global.document = {
    getElementById: (id) => elementsMap.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement('', tag),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    readyState: 'complete',
    addEventListener: () => {}
};

global.localStorage = global.window.localStorage;

// Cargar NotificationService
eval(fs.readFileSync('js/modules/common/NotificationService.js', 'utf8'));
const notifService = new window.NotificationServiceClass();
window.NotificationService = notifService;

// Cargar AdminNotifications
eval(fs.readFileSync('js/modules/admin/AdminNotifications.js', 'utf8'));

// Cargar admin-notifications-manager.js
eval(managerJsContent);

console.log("  ✅ Entorno simulado inicializado y scripts cargados correctamente.");


// ============================================================================
// BLOQUE 3: Prueba de Control de Acceso y Rechazo de No Autorizados
// ============================================================================
console.log("\n▶️ BLOQUE 3: Verificación de RBAC (Control de Acceso de Roles)");

(async () => {
    // 3.1 Usuario sin rol SuperAdmin (ej. organizador)
    window.AdminAuth.user = { role: 'organizer' };
    window.Store.getState = () => ({ role: 'organizer' });
    
    assert.strictEqual(
        window.AdminNotificationsManagerCtrl.hasPrivileges(),
        false,
        "Organizador NO debe tener privilegios en AdminNotificationsManagerCtrl"
    );

    await window.AdminNotificationsManagerCtrl.init();
    assert.ok(
        contentArea.innerHTML.includes('ACCESO RESTRINGIDO A SUPERADMIN'),
        "Debe renderizar mensaje de acceso restringido para organizadores"
    );
    console.log("  ✅ Organizador es bloqueado con pantalla de 'ACCESO RESTRINGIDO A SUPERADMIN'.");

    // 3.2 Usuario jugador estándar
    window.AdminAuth.user = { role: 'player' };
    window.Store.getState = () => ({ role: 'player' });

    assert.strictEqual(
        window.AdminNotificationsManagerCtrl.hasPrivileges(),
        false,
        "Jugador NO debe tener privilegios en AdminNotificationsManagerCtrl"
    );

    let rejected = false;
    try {
        await notifService.deleteNotificationGlobally('notif_test');
    } catch (e) {
        rejected = true;
        assert.ok(e.message.includes('SuperAdmin'), "El mensaje de error debe indicar requerimiento de SuperAdmin");
    }
    assert.ok(rejected, "deleteNotificationGlobally debe rechazar a usuarios no superadmin");
    console.log("  ✅ Jugador es rechazado adecuadamente al invocar deleteNotificationGlobally.");

    // Restaurar usuario SuperAdmin para las siguientes pruebas
    window.AdminAuth.user = { uid: 'superadmin_test', role: 'super_admin' };
    window.Store.getState = () => ({ uid: 'superadmin_test', role: 'super_admin' });
    assert.strictEqual(window.AdminNotificationsManagerCtrl.hasPrivileges(), true, "SuperAdmin debe tener privilegios");
    console.log("  ✅ SuperAdmin verificado con privilegios plenos.");


    // ============================================================================
    // BLOQUE 4: Renderizado de la Vista, Métricas y Filtros
    // ============================================================================
    console.log("\n▶️ BLOQUE 4: Renderizado de vista, métricas, buscador y filtros");

    assert.strictEqual(
        typeof window.AdminViews.notifications_manager,
        'function',
        "window.AdminViews.notifications_manager debe estar definida como función"
    );

    // Sembrar notificaciones de prueba en Firestore broadcasts
    mockCollections.broadcasts.set('bc_001', {
        title: 'Torneo Nocturno de Verano',
        body: 'Abiertas las inscripciones para el torneo nocturno en Cornellà.',
        createdAt: '2026-09-24T18:00:00.000Z',
        authorName: 'Alex Admin',
        targetCount: '50 Jugadores'
    });
    mockCollections.broadcasts.set('bc_002', {
        title: 'Mantenimiento de Pistas 3 y 4',
        body: 'Las pistas 3 y 4 estarán en mantenimiento técnico de moqueta.',
        createdAt: '2026-09-23T10:00:00.000Z',
        authorName: 'Soporte Pistas',
        targetCount: 'Todos'
    });

    // Sembrar purga previa en system_config/purged_notifications
    mockCollections.system_config.set('purged_notifications', {
        purgedIds: ['old_spam_alert_1', 'old_spam_alert_2'],
        updatedAt: '2026-09-20T00:00:00.000Z'
    });

    // Ejecutar renderizado
    await window.AdminViews.notifications_manager();

    const renderedHTML = contentArea.innerHTML;

    // Verificar encabezado y badge
    assert.ok(renderedHTML.includes('GESTOR GLOBAL DE NOTIFICACIONES'), "Debe incluir título principal");
    assert.ok(renderedHTML.includes('SUPERADMIN'), "Debe incluir insignia SUPERADMIN");
    assert.ok(renderedHTML.includes('Seguridad & Moderación Global'), "Debe incluir sub-badge");
    console.log("  ✅ Cabecera y badge de SuperAdmin generados correctamente.");

    // Verificar tarjetas de métricas
    assert.ok(renderedHTML.includes('Notificaciones Activas'), "Debe contener métrica Notificaciones Activas");
    assert.ok(renderedHTML.includes('Comunicados Oficiales'), "Debe contener métrica Comunicados Oficiales");
    assert.ok(renderedHTML.includes('Purgas Realizadas'), "Debe contener métrica Purgas Realizadas");
    assert.strictEqual(window.AdminNotificationsManagerCtrl.purgedCount, 2, "purgedCount debe ser 2");
    console.log("  ✅ Tarjetas de métricas calculadas y renderizadas (Purgas previas: 2).");

    // Verificar buscador y filtros
    assert.ok(elementsMap.has('notif-search-input'), "Debe contener input #notif-search-input");
    assert.ok(elementsMap.has('notif-category-filter'), "Debe contener select #notif-category-filter");
    assert.ok(elementsMap.has('notifications-list-container'), "Debe contener #notifications-list-container");
    console.log("  ✅ Buscador en tiempo real y selector de categoría presentes en DOM.");

    // Verificar renderizado de elementos en la lista y botones de eliminación
    assert.strictEqual(window.AdminNotificationsManagerCtrl.items.length, 3, "Debe haber cargado 3 notificaciones (2 broadcasts + 1 aviso del sistema)");
    assert.ok(renderedHTML.includes('Torneo Nocturno de Verano'), "Debe listar el Torneo Nocturno");
    assert.ok(renderedHTML.includes('Mantenimiento de Pistas 3 y 4'), "Debe listar el Mantenimiento de Pistas");
    assert.ok(renderedHTML.includes('Radar Táctico y Clima de Pistas'), "Debe listar el Radar de Clima");
    assert.ok(renderedHTML.includes('ELIMINAR DE TODAS LAS CUENTAS'), "Debe incluir botón ELIMINAR DE TODAS LAS CUENTAS");
    assert.ok(renderedHTML.includes('id="btn-purge-bc_001"'), "Debe incluir botón con ID btn-purge-bc_001");
    console.log("  ✅ Lista de notificaciones y botones 'ELIMINAR DE TODAS LAS CUENTAS' generados.");

    // Probar filtrado por búsqueda
    window.AdminNotificationsManagerCtrl.onSearch('Nocturno');
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 1, "Debe quedar 1 item coincidente con Nocturno");
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems[0].id, 'bc_001');

    window.AdminNotificationsManagerCtrl.onSearch('inmueble_inexistente');
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 0, "No debe haber coincidencias");
    const listContainer = document.getElementById('notifications-list-container');
    assert.ok(listContainer && listContainer.innerHTML.includes('No se encontraron notificaciones'), "Muestra estado vacío en contenedor");

    window.AdminNotificationsManagerCtrl.onSearch('');
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 3, "Restaura todos los items al limpiar búsqueda");
    console.log("  ✅ Búsqueda en tiempo real filtra y restaura correctamente.");

    // Probar filtrado por categoría
    window.AdminNotificationsManagerCtrl.onCategoryChange('broadcast');
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 2, "Debe mostrar 2 comunicados oficiales");
    window.AdminNotificationsManagerCtrl.onCategoryChange('system');
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 1, "Debe mostrar 1 aviso del sistema");
    window.AdminNotificationsManagerCtrl.onCategoryChange('all');
    assert.strictEqual(window.AdminNotificationsManagerCtrl.filteredItems.length, 3, "Restaura todos los items al seleccionar todas");
    console.log("  ✅ Filtro por categoría ('broadcast', 'system', 'all') funciona correctamente.");


    // ============================================================================
    // BLOQUE 5: Purga Global, Fan-out en Jugadores y Filtrado en getMergedNotifications
    // ============================================================================
    console.log("\n▶️ BLOQUE 5: Purga global vía AdminNotifications.deleteGlobal y supresión inmediata");

    // Preparar estado de jugadores en mockDb
    mockCollections.players.set('player_ana', { name: 'Ana García' });
    mockCollections.players.set('player_carlos', { name: 'Carlos Ruíz' });
    mockCollections['players/player_ana/notifications'] = new Map();
    mockCollections['players/player_carlos/notifications'] = new Map();

    mockCollections['players/player_ana/notifications'].set('n_ana_1', {
        title: 'Torneo Nocturno de Verano',
        data: { broadcastId: 'bc_001' }
    });
    mockCollections['players/player_carlos/notifications'].set('n_carlos_1', {
        title: 'Torneo Nocturno de Verano',
        data: { broadcastId: 'bc_001' }
    });

    // Simular bandeja activa de notificaciones del cliente
    notifService.notifications = [
        { id: 'notif_normal', title: 'Entreno Confirmado', body: 'Tu pista 1', timestamp: Date.now() },
        { id: 'notif_to_purge', title: 'Torneo Nocturno de Verano', body: 'Abiertas...', timestamp: Date.now(), data: { broadcastId: 'bc_001' } }
    ];

    // Verificar que antes de la purga la notificación está activa
    let merged = notifService.getMergedNotifications();
    assert.ok(merged.some(n => n.id === 'notif_to_purge'), "notif_to_purge debe figurar en getMergedNotifications antes de purgar");

    // Ejecutar purga a través de AdminNotifications.deleteGlobal
    const purgeResult = await window.AdminNotifications.deleteGlobal('bc_001', {
        broadcastId: 'bc_001',
        title: 'Torneo Nocturno de Verano'
    });

    assert.strictEqual(purgeResult.success, true, "Purga global debe devolver success: true");
    assert.strictEqual(purgeResult.broadcastDeleted, true, "El broadcast debe haber sido borrado de Firestore");
    assert.strictEqual(purgeResult.deletedFromPlayersCount, 2, "Deben haberse borrado 2 notificaciones en cuentas de jugadores");

    // Comprobar persistencia en system_config/purged_notifications
    const purgedConfigSnap = await mockDb.collection('system_config').doc('purged_notifications').get();
    const purgedIds = purgedConfigSnap.data().purgedIds || [];
    assert.ok(purgedIds.includes('bc_001'), "bc_001 debe estar registrado en system_config/purged_notifications");
    assert.ok(purgedIds.includes('Torneo Nocturno de Verano'), "Título debe estar registrado en system_config/purged_notifications");
    console.log("  ✅ Purga registrada exitosamente en system_config/purged_notifications.");

    // Comprobar fan-out en subcolecciones
    assert.strictEqual(mockCollections['players/player_ana/notifications'].size, 0, "Bandeja de Ana debe estar purgada");
    assert.strictEqual(mockCollections['players/player_carlos/notifications'].size, 0, "Bandeja de Carlos debe estar purgada");
    console.log("  ✅ Subcolecciones de notificaciones de los jugadores purgadas en masa.");

    // Comprobar reactividad inmediata en getMergedNotifications()
    merged = notifService.getMergedNotifications();
    assert.ok(
        !merged.some(n => n.id === 'notif_to_purge' || n.data?.broadcastId === 'bc_001'),
        "notif_to_purge debe desaparecer instantáneamente de getMergedNotifications() para todos los jugadores"
    );
    console.log("  ✅ getMergedNotifications() filtra reactivamente la notificación purgada.");

    console.log("\n========================================================");
    console.log("🏆 TODAS LAS COMPROBACIONES DE QA PARA EL GESTOR GLOBAL DE NOTIFICACIONES PASARON EXITOSAMENTE (100% PASS).");
    console.log("========================================================\n");
    process.exit(0);
})().catch(err => {
    console.error("❌ ERROR EN QA SUITE:", err);
    process.exit(1);
});
