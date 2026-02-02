/**
 * SCRIPT DE EMERGENCIA - Ejecutar desde Consola del Navegador
 * 
 * INSTRUCCIONES:
 * 1. Abre el panel de Admin
 * 2. Presiona F12 para abrir la consola
 * 3. Copia y pega TODO este código
 * 4. Presiona Enter
 * 5. Escribe: fixAllPlayerIDs()
 * 6. Presiona Enter de nuevo
 */

async function fixAllPlayerIDs() {
    console.log('🔧 Iniciando reparación de IDs de jugadores...');

    try {
        let fixed = 0;
        let failed = 0;

        // Obtener todos los jugadores de la BD
        const allPlayers = await window.FirebaseDB.players.getAll();
        console.log(`📋 Jugadores en BD: ${allPlayers.length}`);

        // Reparar ENTRENOS
        console.log('🏃 Reparando Entrenos...');
        const entrenos = await window.EventService.getAll('entreno');

        for (const event of entrenos) {
            if (!event.players || event.players.length === 0) continue;

            let needsUpdate = false;
            const updatedPlayers = event.players.map(player => {
                const playerId = player.id || player.uid || player.player_id;

                if (!playerId && player.name) {
                    // Buscar jugador por nombre
                    const foundPlayer = allPlayers.find(p =>
                        p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
                    );

                    if (foundPlayer) {
                        needsUpdate = true;
                        fixed++;
                        console.log(`  ✅ ${player.name} -> ID: ${foundPlayer.id}`);
                        return {
                            ...player,
                            id: foundPlayer.id,
                            uid: foundPlayer.id
                        };
                    } else {
                        failed++;
                        console.warn(`  ❌ No encontrado: ${player.name}`);
                    }
                }
                return player;
            });

            if (needsUpdate) {
                await window.EventService.updateEvent('entreno', event.id, {
                    players: updatedPlayers
                });
                console.log(`  💾 Actualizado: ${event.name}`);
            }
        }

        // Reparar AMERICANAS
        console.log('🎾 Reparando Americanas...');
        const americanas = await window.EventService.getAll('americana');

        for (const event of americanas) {
            if (!event.players || event.players.length === 0) continue;

            let needsUpdate = false;
            const updatedPlayers = event.players.map(player => {
                const playerId = player.id || player.uid || player.player_id;

                if (!playerId && player.name) {
                    const foundPlayer = allPlayers.find(p =>
                        p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
                    );

                    if (foundPlayer) {
                        needsUpdate = true;
                        fixed++;
                        console.log(`  ✅ ${player.name} -> ID: ${foundPlayer.id}`);
                        return {
                            ...player,
                            id: foundPlayer.id,
                            uid: foundPlayer.id
                        };
                    } else {
                        failed++;
                        console.warn(`  ❌ No encontrado: ${player.name}`);
                    }
                }
                return player;
            });

            if (needsUpdate) {
                await window.EventService.updateEvent('americana', event.id, {
                    players: updatedPlayers
                });
                console.log(`  💾 Actualizado: ${event.name}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════');
        console.log('✅ REPARACIÓN COMPLETADA');
        console.log(`   Jugadores reparados: ${fixed}`);
        console.log(`   No encontrados: ${failed}`);
        console.log('═══════════════════════════════════');
        console.log('');
        console.log('Ahora recarga la página y prueba a eliminar jugadores.');

        return { fixed, failed };

    } catch (error) {
        console.error('❌ ERROR:', error);
        console.error('Detalles:', error.message);
        throw error;
    }
}

// Auto-ejecutar si se detecta que estamos en el admin
if (window.location.pathname.includes('admin.html')) {
    console.log('');
    console.log('═══════════════════════════════════');
    console.log('🔧 SCRIPT DE REPARACIÓN CARGADO');
    console.log('═══════════════════════════════════');
    console.log('');
    console.log('Para reparar los IDs de jugadores, ejecuta:');
    console.log('');
    console.log('  fixAllPlayerIDs()');
    console.log('');
}
