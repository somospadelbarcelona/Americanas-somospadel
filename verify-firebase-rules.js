// ============================================
// FIREBASE SECURITY RULES VERIFICATION SCRIPT
// ============================================
// Ejecuta este script en la consola del navegador para verificar
// que las reglas de seguridad están funcionando correctamente
// ============================================

console.log("🔐 Iniciando verificación de reglas de seguridad...\n");

async function verifyFirebaseRules() {
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    try {
        // ==========================================
        // TEST 1: Verificar autenticación
        // ==========================================
        console.log("📋 TEST 1: Verificando autenticación...");
        if (!auth.currentUser) {
            results.failed.push("❌ No hay usuario autenticado. Inicia sesión primero.");
            console.error("❌ TEST 1 FAILED: No authenticated user");
        } else {
            results.passed.push("✅ Usuario autenticado: " + auth.currentUser.uid);
            console.log("✅ TEST 1 PASSED: User authenticated");
        }

        // ==========================================
        // TEST 2: Verificar perfil de usuario
        // ==========================================
        console.log("\n📋 TEST 2: Verificando perfil de usuario...");
        try {
            const userProfile = await FirebaseDB.players.getById(auth.currentUser.uid);
            if (!userProfile) {
                results.failed.push("❌ No se encontró el perfil del usuario en la base de datos");
                console.error("❌ TEST 2 FAILED: User profile not found");
            } else {
                results.passed.push(`✅ Perfil encontrado: ${userProfile.name} (${userProfile.role})`);
                console.log("✅ TEST 2 PASSED: User profile found", userProfile);

                // Guardar para tests posteriores
                window._testUserProfile = userProfile;
            }
        } catch (e) {
            results.failed.push("❌ Error al leer perfil: " + e.message);
            console.error("❌ TEST 2 FAILED:", e);
        }

        // ==========================================
        // TEST 3: Verificar permisos de lectura
        // ==========================================
        console.log("\n📋 TEST 3: Verificando permisos de lectura...");
        try {
            const players = await FirebaseDB.players.getAll();
            if (players.length > 0) {
                results.passed.push(`✅ Lectura de jugadores OK (${players.length} jugadores)`);
                console.log("✅ TEST 3 PASSED: Can read players");
            } else {
                results.warnings.push("⚠️ No hay jugadores en la base de datos");
                console.warn("⚠️ TEST 3 WARNING: No players found");
            }
        } catch (e) {
            results.failed.push("❌ Error al leer jugadores: " + e.message);
            console.error("❌ TEST 3 FAILED:", e);
        }

        // ==========================================
        // TEST 4: Verificar permisos de admin
        // ==========================================
        console.log("\n📋 TEST 4: Verificando permisos de administrador...");
        const userRole = window._testUserProfile?.role;

        if (!userRole) {
            results.warnings.push("⚠️ No se pudo determinar el rol del usuario");
            console.warn("⚠️ TEST 4 WARNING: User role not found");
        } else if (userRole === 'super_admin' || userRole === 'admin_player') {
            results.passed.push(`✅ Usuario tiene permisos de admin (${userRole})`);
            console.log("✅ TEST 4 PASSED: User is admin");

            // ==========================================
            // TEST 5: Verificar permisos de borrado (SOLO ADMINS)
            // ==========================================
            console.log("\n📋 TEST 5: Verificando permisos de borrado...");
            try {
                // Crear un jugador de prueba
                const testPlayer = await FirebaseDB.players.create({
                    name: "Test Security Rules",
                    phone: "000000000",
                    level: 3.5,
                    gender: "chico",
                    status: "pending",
                    role: "player"
                });

                console.log("✅ Jugador de prueba creado:", testPlayer.id);

                // Intentar borrarlo
                await FirebaseDB.players.delete(testPlayer.id);

                // Verificar que se borró
                const checkDeleted = await db.collection('players').doc(testPlayer.id).get();
                if (!checkDeleted.exists) {
                    results.passed.push("✅ Permisos de borrado funcionan correctamente");
                    console.log("✅ TEST 5 PASSED: Delete permissions work");
                } else {
                    results.failed.push("❌ El jugador de prueba no se borró correctamente");
                    console.error("❌ TEST 5 FAILED: Test player still exists");
                }
            } catch (e) {
                results.failed.push("❌ Error al probar borrado: " + e.message);
                console.error("❌ TEST 5 FAILED:", e);
            }
        } else {
            results.warnings.push(`⚠️ Usuario no es admin (${userRole}). Tests de escritura omitidos.`);
            console.warn("⚠️ TEST 4 WARNING: User is not admin, skipping write tests");
        }

        // ==========================================
        // TEST 6: Verificar reglas de actualización
        // ==========================================
        console.log("\n📋 TEST 6: Verificando reglas de actualización...");
        try {
            // Intentar actualizar el propio perfil (debería funcionar)
            await FirebaseDB.players.update(auth.currentUser.uid, {
                // Campo permitido para todos
                phone: window._testUserProfile.phone
            });
            results.passed.push("✅ Actualización de perfil propio funciona");
            console.log("✅ TEST 6 PASSED: Self-update works");
        } catch (e) {
            results.failed.push("❌ Error al actualizar perfil propio: " + e.message);
            console.error("❌ TEST 6 FAILED:", e);
        }

    } catch (error) {
        results.failed.push("❌ Error general: " + error.message);
        console.error("❌ GENERAL ERROR:", error);
    }

    // ==========================================
    // MOSTRAR RESULTADOS
    // ==========================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESULTADOS DE LA VERIFICACIÓN");
    console.log("=".repeat(60));

    console.log("\n✅ TESTS PASADOS (" + results.passed.length + "):");
    results.passed.forEach(msg => console.log("  " + msg));

    if (results.warnings.length > 0) {
        console.log("\n⚠️ ADVERTENCIAS (" + results.warnings.length + "):");
        results.warnings.forEach(msg => console.warn("  " + msg));
    }

    if (results.failed.length > 0) {
        console.log("\n❌ TESTS FALLIDOS (" + results.failed.length + "):");
        results.failed.forEach(msg => console.error("  " + msg));
    }

    console.log("\n" + "=".repeat(60));

    if (results.failed.length === 0) {
        console.log("🎉 ¡TODAS LAS VERIFICACIONES PASARON!");
        console.log("✅ Las reglas de seguridad están funcionando correctamente.");
    } else {
        console.log("⚠️ ALGUNAS VERIFICACIONES FALLARON");
        console.log("🔧 Revisa los errores arriba y consulta FIREBASE_RULES_DEPLOY.md");
    }

    console.log("=".repeat(60) + "\n");

    return {
        success: results.failed.length === 0,
        passed: results.passed.length,
        failed: results.failed.length,
        warnings: results.warnings.length,
        details: results
    };
}

// Ejecutar verificación
verifyFirebaseRules().then(result => {
    window._securityTestResults = result;
    console.log("\n💾 Resultados guardados en: window._securityTestResults");
});
