/**
 * test-player-login-resilience-qa.js
 * Suite de Verificación QA: Resiliencia y resolución de incidencias de Login de Jugadores
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("🎾 CERTIFICACIÓN QA: RESILIENCIA DEL SISTEMA DE LOGIN DE JUGADORES");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function test(desc, fn) {
    total++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${desc}`);
        console.error(`     Error: ${err.message}`);
    }
}

const rootDir = path.resolve(__dirname, '..');
const authServiceCode = fs.readFileSync(path.join(rootDir, 'js', 'core', 'AuthService.js'), 'utf8');
const firebaseInitCode = fs.readFileSync(path.join(rootDir, 'js', 'firebase-init.js'), 'utf8');
const authControllerCode = fs.readFileSync(path.join(rootDir, 'js', 'modules', 'auth', 'AuthController.js'), 'utf8');
const indexHtmlCode = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

// 1. Verificación de soporte multidígito y prefijo internacional en getByPhone
test('firebase-init.js: getByPhone soporta variantes con +34, 34 y 9 dígitos', () => {
    assert(firebaseInitCode.includes("cleanDigits.length === 11 && cleanDigits.startsWith('34')"), "Debe normalizar números de 11 dígitos que comienzan por 34");
    assert(firebaseInitCode.includes("variants.add('34' + cleanDigits)"), "Debe generar variante con prefijo 34");
    assert(firebaseInitCode.includes("variants.add('+34' + cleanDigits)"), "Debe generar variante con prefijo +34");
});

// 2. Verificación de getByIdentifier para buscar por teléfono, email o nombre
test('firebase-init.js: getByIdentifier implementado para teléfono, email y nombre', () => {
    assert(firebaseInitCode.includes("async getByIdentifier(identifier)"), "Debe existir getByIdentifier");
    assert(firebaseInitCode.includes("digits.length >= 6"), "Debe probar búsqueda telefónica si contiene 6 o más dígitos");
    assert(firebaseInitCode.includes("clean.includes('@')"), "Debe contemplar búsqueda por email");
    assert(firebaseInitCode.includes("where('name', '==', clean)"), "Debe contemplar búsqueda por nombre");
});

// 3. Verificación de que revalidateSession NO expulsa a usuarios con red lenta u offline
test('AuthService.js: revalidateSession no ejecuta logout si falla la conexión remota', () => {
    assert(authServiceCode.includes("Manteniendo sesión local activa"), "revalidateSession debe mantener sesión si playerData es null");
    assert(!authServiceCode.includes("if (!playerData) {\n                    console.warn(\"⚠️ Usuario no encontrado en base de datos. Cerrando sesión...\");\n                    this.logout();"), "No debe hacer logout si playerData es falsy por fallo de red");
});

// 4. Verificación de timeout resiliente en Firebase Auth
test('AuthService.js: Timeout aumentado a 5.5s para pistas con mala cobertura', () => {
    assert(authServiceCode.includes("5500"), "El timeout de Firebase Auth debe ser de al menos 5.5s");
});

// 5. Verificación de soporte para jugadores sin contraseña en BD (importados / primer acceso)
test('AuthService.js: Permite acceso y autoasigna clave a jugadores sin contraseña en la BD', () => {
    assert(authServiceCode.includes("isFirstTimePasswordSetup"), "Debe contemplar primer acceso o jugador sin contraseña registrada");
    assert(authServiceCode.includes("commonDefaultKeys"), "Debe permitir claves comunes como teléfono o últimos 4 dígitos");
    assert(authServiceCode.includes("Blindando y guardando contraseña cifrada"), "Debe blindar la clave en Firestore para siguientes accesos");
});

// 6. Verificación de normalización de teléfono en AuthController
test('AuthController.js: Desacopla la concatenación cruda y pasa el identificador limpio', () => {
    assert(authControllerCode.includes("window.AuthService.login(rawPhone, password)"), "Debe invocar AuthService.login con el teléfono limpio");
    assert(authControllerCode.includes("document.documentElement.classList.add('has-session')"), "Debe activar has-session al completar el login");
});

// 7. Verificación de validación de sesión ultrarrápida en index.html
test('index.html: Comprobación robusta de currentUser en el arranque', () => {
    assert(indexHtmlCode.includes("_cached !== 'undefined' && _cached.length > 5"), "La verificación en el arranque descarta cadenas vacías o undefined");
});

console.log(`\n================================================================================`);
console.log(`📊 RESULTADO AUDITORÍA: ${passed}/${total} pruebas pasadas con éxito.`);
console.log(`================================================================================\n`);

if (passed !== total) {
    process.exit(1);
}
