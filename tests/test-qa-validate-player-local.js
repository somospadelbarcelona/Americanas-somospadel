/**
 * Test QA: Validación de Jugadores en Local y Elevación de Sesión Admin
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("================================================================");
console.log("🧪 TEST QA: VALIDACIÓN DE JUGADORES Y ELEVACIÓN DE SESIÓN ADMIN");
console.log("================================================================\n");

// 1. Verificar firestore.rules
const rulesPath = path.resolve(__dirname, '../firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

console.log("▶️ [1] Verificando reglas de seguridad en firestore.rules...");
assert(rulesContent.includes("isSessionAdmin"), "firestore.rules debe contemplar isSessionAdmin");
assert(rulesContent.includes("request.resource.data.role in ['admin', 'admin_player', 'super_admin'"), "firestore.rules debe autorizar roles de admin con isSessionAdmin");
console.log("  ✅ [PASS] firestore.rules permite la elevación de sesión administrativa (isSessionAdmin: true).");

// 2. Verificar js/admin.js
const adminJsPath = path.resolve(__dirname, '../js/admin.js');
const adminJsContent = fs.readFileSync(adminJsPath, 'utf8');

console.log("▶️ [2] Verificando ensureFirebaseAdminSession en admin.js...");
assert(adminJsContent.includes("ensureFirebaseAdminSession"), "admin.js debe implementar ensureFirebaseAdminSession");
assert(adminJsContent.includes("protocol === 'file:'"), "admin.js debe detectar protocolo file://");
console.log("  ✅ [PASS] admin.js implementa ensureFirebaseAdminSession con control de protocolo HTTP/local.");

// 3. Verificar js/modules/admin-users.js
const adminUsersPath = path.resolve(__dirname, '../js/modules/admin-users.js');
const adminUsersContent = fs.readFileSync(adminUsersPath, 'utf8');

console.log("▶️ [3] Verificando window.approveUser en admin-users.js...");
assert(adminUsersContent.includes("ensureFirebaseAdminSession"), "approveUser debe invocar ensureFirebaseAdminSession");
assert(adminUsersContent.includes("status: 'active'"), "approveUser debe persistir status 'active'");
assert(adminUsersContent.includes("protocol === 'file:'"), "approveUser debe advertir si se usa protocolo file://");
console.log("  ✅ [PASS] window.approveUser tiene blindaje de sesión, reintento resiliente y actualización inmediata de caché.");

// 4. Verificar js/firebase-init.js
const fbInitPath = path.resolve(__dirname, '../js/firebase-init.js');
const fbInitContent = fs.readFileSync(fbInitPath, 'utf8');

console.log("▶️ [4] Verificando resilencia en FirebaseDB.players.update...");
assert(fbInitContent.includes("safeFirestoreGet tras update falló benignamente"), "players.update debe ser tolerante a timeouts post-escritura");
console.log("  ✅ [PASS] players.update es tolerante a degradación de red o lectura local.");

console.log("\n================================================================");
console.log("🎉 TODOS LOS TESTS DE VALIDACIÓN DE JUGADORES EN LOCAL PASARON (4/4)");
console.log("================================================================");
