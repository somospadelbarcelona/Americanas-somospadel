/**
 * 🔄 ROLE & COMMUNITY MIGRATION UTIL v1.0 - SOMOSPADEL BCN
 * Permite normalizar y migrar la base de datos de jugadores:
 * 1. Fija 'membership' = 'somospadel_bcn' (todos pertenecen a la comunidad SomosPadel).
 * 2. Normaliza roles legacy:
 *    - 'player_americanas' -> 'player' (Jugador SomosPadel perfil raso)
 *    - 'admin_player' -> 'admin' (Administrador unificado)
 */
(function() {
    const RoleMigrationUtil = {
        async previewMigration() {
            try {
                console.log("🔍 [RoleMigration] Analizando base de datos de jugadores...");
                const players = await window.FirebaseDB?.players?.getAll(true) || [];
                
                let countMembershipFix = 0;
                let countAmericanasToPlayer = 0;
                let countAdminPlayerToAdmin = 0;
                let alreadyClean = 0;

                players.forEach(p => {
                    const needsMem = (p.membership !== 'somospadel_bcn');
                    const isAmer = (p.role === 'player_americanas');
                    const isAdminPlay = (p.role === 'admin_player');

                    if (needsMem) countMembershipFix++;
                    if (isAmer) countAmericanasToPlayer++;
                    if (isAdminPlay) countAdminPlayerToAdmin++;

                    if (!needsMem && !isAmer && !isAdminPlay) {
                        alreadyClean++;
                    }
                });

                const summary = {
                    totalJugadores: players.length,
                    membresiaANormalizar: countMembershipFix,
                    americanasAJugadorRaso: countAmericanasToPlayer,
                    adminPlayerAAdmin: countAdminPlayerToAdmin,
                    yaCorrectos: alreadyClean
                };

                console.table(summary);

                if (window.PremiumModal) {
                    await window.PremiumModal.alert({
                        title: "📊 DIAGNÓSTICO DE MIGRACIÓN",
                        message: `Total Jugadores: ${players.length}\n` +
                                 `• Membresías a fijar en SomosPadel: ${countMembershipFix}\n` +
                                 `• Jugadores Americanas a convertir en Jugador Raso: ${countAmericanasToPlayer}\n` +
                                 `• Admin+Jugador a unificar en Admin: ${countAdminPlayerToAdmin}\n` +
                                 `• Perfiles ya actualizados: ${alreadyClean}`,
                        type: 'info'
                    });
                }

                return summary;
            } catch (err) {
                console.error("❌ [RoleMigration] Error en preview:", err);
                if (window.PremiumModal) {
                    window.PremiumModal.alert({
                        title: "❌ ERROR DE ANÁLISIS",
                        message: err.message || "Error al obtener los perfiles.",
                        type: 'error'
                    });
                }
                throw err;
            }
        },

        async runMigration() {
            try {
                const confirmed = await window.PremiumModal?.confirm({
                    title: "🚀 MIGRACIÓN DE ROLES Y COMUNIDAD",
                    message: "Esta acción unificará a todos los jugadores en la comunidad SomosPadel y normalizará los roles simplificados. ¿Deseas continuar?",
                    confirmText: "SÍ, EJECUTAR MIGRACIÓN",
                    cancelText: "CANCELAR"
                });

                if (!confirmed && window.PremiumModal) {
                    console.log("⏹️ [RoleMigration] Migración cancelada por el usuario.");
                    return;
                }

                console.log("⏳ [RoleMigration] Iniciando actualización en Firestore...");
                const db = firebase.firestore();
                const snapshot = await db.collection('players').get();

                if (snapshot.empty) {
                    console.warn("⚠️ [RoleMigration] No se encontraron jugadores en Firestore.");
                    return;
                }

                const BATCH_SIZE = 400;
                let batches = [];
                let currentBatch = db.batch();
                let opCount = 0;
                let totalUpdated = 0;

                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    let needsUpdate = false;
                    const updates = {};

                    // 1. Membresía: Todos deben ser somospadel_bcn
                    if (data.membership !== 'somospadel_bcn') {
                        updates.membership = 'somospadel_bcn';
                        needsUpdate = true;
                    }

                    // 2. Roles: Unificar a roles limpios
                    if (data.role === 'player_americanas' || data.role === 'externo') {
                        updates.role = 'player';
                        needsUpdate = true;
                    } else if (data.role === 'admin_player') {
                        updates.role = 'admin';
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        updates.updated_at = firebase.firestore.FieldValue.serverTimestamp();
                        currentBatch.update(docSnap.ref, updates);
                        opCount++;
                        totalUpdated++;

                        if (opCount >= BATCH_SIZE) {
                            batches.push(currentBatch.commit());
                            currentBatch = db.batch();
                            opCount = 0;
                        }
                    }
                });

                if (opCount > 0) {
                    batches.push(currentBatch.commit());
                }

                if (batches.length > 0) {
                    await Promise.all(batches);
                    console.log(`✅ [RoleMigration] Migración completada con éxito. ${totalUpdated} documentos actualizados.`);
                } else {
                    console.log("✨ [RoleMigration] Todos los jugadores ya estaban al día. No se requirieron escrituras.");
                }

                // Refrescar cachés globales
                if (window.FirebaseDB?.players?.getAll) {
                    const fresh = await window.FirebaseDB.players.getAll(true);
                    window.allUsersCache = fresh;
                    window.filteredUsers = [...fresh];
                    window._allPlayersCache = fresh;
                }

                if (window.PremiumModal) {
                    await window.PremiumModal.alert({
                        title: "🎉 MIGRACIÓN COMPLETADA",
                        message: `Se han actualizado y normalizado ${totalUpdated} perfiles de jugadores.\nTodos pertenecen ahora a SomosPadel BCN con roles limpios.`,
                        type: 'success'
                    });
                }

                // Si estamos en la vista de usuarios del admin, refrescar la tabla
                if (typeof window.multiFilterUsers === 'function') {
                    window.multiFilterUsers();
                }

                return { success: true, updatedCount: totalUpdated };
            } catch (err) {
                console.error("❌ [RoleMigration] Error durante la migración:", err);
                if (window.PremiumModal) {
                    window.PremiumModal.alert({
                        title: "❌ ERROR EN MIGRACIÓN",
                        message: err.message || "Ocurrió un error al ejecutar la migración.",
                        type: 'error'
                    });
                }
                throw err;
            }
        }
    };

    window.RoleMigrationUtil = RoleMigrationUtil;
    console.log("🔄 RoleMigrationUtil cargado con éxito.");
})();
