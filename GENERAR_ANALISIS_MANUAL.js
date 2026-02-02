// SOLUCIÓN TEMPORAL: Pega esto en la consola del navegador para generar el análisis manualmente

async function generarAnalisisManual() {
    const user = window.Store.getState('currentUser');
    console.log('👤 Usuario:', user.name, user.uid);

    // Buscar TODOS los entrenos
    const entrenosSnap = await window.db.collection('entrenos').get();
    const allEntrenos = entrenosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filtrar finalizados
    const finished = allEntrenos.filter(e => e.status === 'finished');
    console.log(`📅 Entrenos finalizados: ${finished.length}`);

    let count = 0;

    for (const event of finished) {
        console.log(`\n🔍 ${event.name} (${event.date})`);

        // Obtener partidos
        const matchesSnap = await window.db.collection('entrenos_matches')
            .where('event_id', '==', event.id)
            .get();

        const matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const finishedMatches = matches.filter(m => m.status === 'finished' || m.isFinished);

        // Buscar si jugaste
        const played = finishedMatches.some(m => {
            const inA = (m.team_a_ids || []).includes(user.uid);
            const inB = (m.team_b_ids || []).includes(user.uid);
            const inPlayers = (m.players || []).includes(user.uid);
            return inA || inB || inPlayers;
        });

        if (played) {
            console.log(`   ✅ JUGASTE en este entreno`);

            // Generar análisis
            const insights = window.CaptainService.analyze(user, finishedMatches, event);

            // Guardar
            await window.CaptainService.saveAnalysis(user.uid, event, insights);
            count++;
            console.log(`   💾 Análisis guardado`);
        } else {
            console.log(`   ❌ No jugaste`);
        }
    }

    console.log(`\n🎉 COMPLETADO: ${count} análisis generados`);
    alert(`¡Listo! Se generaron ${count} análisis. Ahora abre el Capitán para verlos.`);
}

// Ejecutar
generarAnalisisManual();
