/**
 * admin-database-health.js
 * "Ghost Buster" Misión: Advanced Database Integrity & Normalization tool.
 * Detects duplicates, legacy IDs, orphan matches, and test data.
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.database_health = async function () {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="glass-card-enterprise animate-fade-in" style="padding: 2.5rem; max-width: 1000px; margin: 0 auto; border-color: rgba(0, 227, 109, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="color: #00E36D; margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 15px;">
                        <i class="fas fa-microscope"></i> Diagnóstico de Base de Datos
                    </h2>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-top: 5px;">Misión Ghost Buster: Integridad Atómica de Datos</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.HealthTools.runScan()" class="btn-primary-pro" style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);">
                        <i class="fas fa-search"></i> ESCANEAR
                    </button>
                    <button onclick="window.HealthTools.nuclearCleanup()" class="btn-primary-pro" style="background: #ff4757; color: #fff; border: none; box-shadow: 0 0 15px rgba(255, 71, 87, 0.3);">
                        <i class="fas fa-radiation"></i> LIMPIEZA TOTAL 🚀
                    </button>
                </div>
            </div>
            
            <div id="health-dashboard" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- Result cards will be injected here -->
                <div class="glass-card-enterprise" style="padding: 1.5rem; opacity: 0.3; text-align: center;">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>JUGADORES</div>
                </div>
                <div class="glass-card-enterprise" style="padding: 1.5rem; opacity: 0.3; text-align: center;">
                    <i class="fas fa-trophy" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>PARTIDOS</div>
                </div>
                <div class="glass-card-enterprise" style="padding: 1.5rem; opacity: 0.3; text-align: center;">
                    <i class="fas fa-id-badge" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>LEGACY IDs</div>
                </div>
                <div class="glass-card-enterprise" style="padding: 1.5rem; opacity: 0.3; text-align: center;">
                    <i class="fas fa-lock" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>NIVELES</div>
                </div>
            </div>

            <div id="scan-report" style="margin-top: 2rem; display: none;">
                <h3 style="color: white; font-size: 1.1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-file-waveform"></i> Informe de Hallazgos
                </h3>
                <div id="report-items"></div>
            </div>

            <div id="action-terminal" class="glass-card-enterprise" style="margin-top: 2rem; background: #000; border: 1px solid #333; font-family: 'Courier New', monospace; font-size: 0.85rem; padding: 1.5rem; display: none;">
                <div style="color: #00E36D; margin-bottom: 10px;">[SISTEMA DE REPARACIÓN NUCLEAR]</div>
                <div id="terminal-output" style="color: #aaa; max-height: 300px; overflow-y: auto;"></div>
            </div>
        </div>
    `;
};

window.HealthTools = {
    results: {
        duplicates: [],
        legacyPlayers: [], // Players with IDs that don't look like Firebase UIDs
        orphans: [],
        testUsers: []
    },

    async runScan() {
        const dashboard = document.getElementById('health-dashboard');
        const report = document.getElementById('scan-report');
        const reportItems = document.getElementById('report-items');

        report.style.display = 'block';
        reportItems.innerHTML = '<div class="loader"></div><p style="text-align:center; color:#888;">Analizando registros en la nube...</p>';

        try {
            const players = await window.FirebaseDB.players.getAll();
            const americanas = await window.FirebaseDB.americanas.getAll();
            const entrenos = await window.FirebaseDB.entrenos.getAll();

            this.results = {
                duplicates: this.findDuplicates(players),
                legacyPlayers: players.filter(p => !this.isValidUID(p.id)),
                testUsers: players.filter(p => this.isTestData(p)),
                orphans: await this.findOrphans(americanas, entrenos)
            };

            this.updateDashboard();
            this.renderReport();

        } catch (e) {
            reportItems.innerHTML = `<div style="color:#ff4444; padding:20px;">❌ Error en el escaneo: ${e.message}</div>`;
        }
    },

    isValidUID(id) {
        // Simple heuristic: Firebase UIDs are usually 28 chars and look like alphanumeric
        if (!id) return false;
        return id.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(id);
    },

    isTestData(p) {
        const name = (p.name || "").toLowerCase();
        const testWords = ['test', 'prueba', 'vacante', 'ficticio', 'dummy', 'comodín', 'comodin'];
        return testWords.some(word => name.includes(word));
    },

    findDuplicates(players) {
        const duplicates = [];
        const seen = new Map();

        players.forEach(p => {
            const normalizedName = (p.name || "").toLowerCase().trim().replace(/\s+/g, ' ');
            if (seen.has(normalizedName)) {
                const original = seen.get(normalizedName);
                duplicates.push({ name: p.name, ids: [original.id, p.id], data: [original, p] });
            } else {
                seen.set(normalizedName, p);
            }
        });
        return duplicates;
    },

    async findOrphans(americanas, entrenos) {
        const orphans = [];
        const validIds = new Set([...americanas.map(a => a.id), ...entrenos.map(e => e.id)]);

        const collections = ['matches', 'entrenos_matches'];
        for (const coll of collections) {
            const snap = await window.db.collection(coll).get();
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.americana_id && !validIds.has(data.americana_id)) {
                    orphans.push({ id: doc.id, collection: coll, parentId: data.americana_id });
                }
            });
        }
        return orphans;
    },

    updateDashboard() {
        const dashboard = document.getElementById('health-dashboard');
        dashboard.innerHTML = `
            <div class="glass-card-enterprise" style="padding: 1.5rem; text-align: center; border-color: ${this.results.duplicates.length > 0 ? '#ff9f43' : '#00E36D'};">
                <div style="font-size: 2rem; color: #fff; font-weight: 800; margin-bottom: 5px;">${this.results.duplicates.length}</div>
                <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 900;">DUPLICADOS</div>
            </div>
            <div class="glass-card-enterprise" style="padding: 1.5rem; text-align: center; border-color: ${this.results.legacyPlayers.length > 0 ? '#eab308' : '#00E36D'};">
                <div style="font-size: 2rem; color: #fff; font-weight: 800; margin-bottom: 5px;">${this.results.legacyPlayers.length}</div>
                <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 900;">IDs LEGACY</div>
            </div>
            <div class="glass-card-enterprise" style="padding: 1.5rem; text-align: center; border-color: ${this.results.testUsers.length > 0 ? '#ff4757' : '#00E36D'};">
                <div style="font-size: 2rem; color: #fff; font-weight: 800; margin-bottom: 5px;">${this.results.testUsers.length}</div>
                <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 900;">TEST DATA</div>
            </div>
            <div class="glass-card-enterprise" style="padding: 1.5rem; text-align: center; border-color: ${this.results.orphans.length > 0 ? '#ff4757' : '#00E36D'};">
                <div style="font-size: 2rem; color: #fff; font-weight: 800; margin-bottom: 5px;">${this.results.orphans.length}</div>
                <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 900;">PARTIDOS HUÉRFANOS</div>
            </div>
        `;
    },

    renderReport() {
        const container = document.getElementById('report-items');
        let html = '';

        if (this.results.duplicates.length > 0) {
            html += this.renderIssueSection("Posibles Duplicados", "fa-copy", "#ff9f43",
                this.results.duplicates.map(d => `<strong>${d.name}</strong> (${d.ids.join(', ')})`),
                "window.HealthTools.fixDuplicates()");
        }

        if (this.results.legacyPlayers.length > 0) {
            html += this.renderIssueSection("IDs No Normalizados (Legacy)", "fa-id-badge", "#eab308",
                this.results.legacyPlayers.map(p => `<strong>${p.name}</strong> (ID: ${p.id})`),
                "window.HealthTools.normalizeIDs()");
        }

        if (this.results.orphans.length > 0) {
            html += this.renderIssueSection("Partidos Huérfanos (Cleanup Req)", "fa-ghost", "#ff4757",
                [`Se detectaron ${this.results.orphans.length} registros que ensucian la estadística.`],
                "window.HealthTools.purgeOrphans()");
        }

        if (this.results.testUsers.length > 0) {
            html += this.renderIssueSection("Cuentas de Test/Simulación", "fa-vial", "#ff4757",
                this.results.testUsers.map(p => `<strong>${p.name}</strong>`),
                "window.HealthTools.purgeTestData()");
        }

        // --- ALWAYS SHOW LEVEL CONSOLIDATION OPTION ---
        html += `
            <div class="glass-card-enterprise" style="margin-top: 2rem; border-left: 4px solid var(--primary); padding: 1.5rem; background: rgba(204, 255, 0, 0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1; padding-right: 20px;">
                        <h4 style="margin: 0; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-lock"></i> Consolidación de Niveles
                        </h4>
                        <p style="margin-top: 8px; color: #aaa; font-size: 0.8rem; line-height: 1.4;">
                            Esta herramienta establece el <strong>Nivel Actual</strong> como el nuevo <strong>Nivel Inicial</strong> de cada jugador. 
                            Úsala antes de borrar partidos de prueba para que los niveles no vuelvan atrás si decides recalcular en el futuro.
                        </p>
                    </div>
                    <button onclick="window.HealthTools.lockCurrentLevels()" class="btn-primary-pro" style="background: var(--primary); color: #000; border: none; white-space: nowrap;">
                        FIJAR NIVELES 🔒
                    </button>
                </div>
            </div>

            <!-- ⚡ EMERGENCY: RECOVERY TOOL -->
            <div class="glass-card-enterprise" style="margin-top: 1rem; border-left: 4px solid #ff4757; padding: 1.5rem; background: rgba(255, 71, 87, 0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1; padding-right: 20px;">
                        <h4 style="margin: 0; color: #ff4757; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-life-ring"></i> RECUPERACIÓN DE EMERGENCIA (03/05)
                        </h4>
                        <p style="margin-top: 8px; color: #aaa; font-size: 0.8rem; line-height: 1.4;">
                            <strong>¡HE LIADO UNA!:</strong> Esta herramienta busca partidos en la base de datos que hayan quedado "sueltos" o huérfanos con fecha de hoy y los intenta re-asignar al evento actual. Úsala si has borrado el evento o reiniciado por error.
                        </p>
                    </div>
                    <button onclick="window.HealthTools.emergencyRecovery()" class="btn-primary-pro" style="background: #ff4757; color: #fff; border: none; white-space: nowrap;">
                        RESCATAR RESULTADOS 🆘
                    </button>
                </div>
            </div>
        `;

        if (html === '') {
            html = '<div style="text-align:center; padding:3rem; color:#00E36D;">✅ Base de datos 100% íntegra. No se requieren acciones.</div>';
        }

        container.innerHTML = html;
    },

    renderIssueSection(title, icon, color, items, actionFn) {
        return `
            <div class="glass-card-enterprise" style="margin-bottom: 1rem; border-left: 4px solid ${color}; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; color: ${color}; display: flex; align-items: center; gap: 10px;">
                            <i class="fas ${icon}"></i> ${title}
                        </h4>
                        <div style="margin-top: 10px; color: #ddd; font-size: 0.85rem;">
                            ${items.slice(0, 5).join('<br>')}
                            ${items.length > 5 ? `<br>... y ${items.length - 5} más` : ''}
                        </div>
                    </div>
                    <button onclick="${actionFn}" class="btn-micro" style="background: ${color}; color: #000; border-color: ${color};">
                        REPARAR 🛠️
                    </button>
                </div>
            </div>
        `;
    },

    // --- REPAIR ACTIONS ---

    async logTerminal(msg, isError = false) {
        const term = document.getElementById('action-terminal');
        const output = document.getElementById('terminal-output');
        term.style.display = 'block';
        const p = document.createElement('div');
        p.style.color = isError ? '#ff4757' : (msg.includes('✅') ? '#00E36D' : '#aaa');
        p.innerHTML = `> ${msg}`;
        output.appendChild(p);
        output.scrollTop = output.scrollHeight;
    },

    async purgeOrphans(silent = false) {
        if (!silent) {
            if (!confirm("Esto eliminará físicamente los partidos que no pertenecen a ningún evento. ¿Continuar?")) return;
        }
        this.logTerminal("Iniciando purga de partidos huérfanos...");

        let deleted = 0;
        const batchSize = 450;
        let batch = window.db.batch();
        let count = 0;

        for (const orphan of this.results.orphans) {
            const ref = window.db.collection(orphan.collection).doc(orphan.id);
            batch.delete(ref);
            count++;
            deleted++;

            if (count >= batchSize) {
                await batch.commit();
                batch = window.db.batch();
                count = 0;
                this.logTerminal(`... procesados ${deleted} registros`);
            }
        }

        if (count > 0) await batch.commit();
        this.logTerminal(`✅ Purga completada. Registros eliminados: ${deleted}`);
        this.runScan(); // Refresh
    },

    async purgeTestData() {
        const count = this.results.testUsers.length;
        if (!confirm(`¿Eliminar ${count} usuarios de test? Esta acción no se puede deshacer.`)) return;

        this.logTerminal(`Purgando ${count} registros de ruido (Test Data)...`);
        const batch = window.db.batch();
        this.results.testUsers.forEach(u => {
            batch.delete(window.db.collection('players').doc(u.id));
        });
        await batch.commit();
        this.logTerminal(`✅ Usuarios de test eliminados.`);
        this.runScan();
    },

    async fixDuplicates() {
        this.logTerminal("ADVERTENCIA: La fusión de duplicados requiere intervención manual por ahora para evitar pérdida de datos.", true);
        this.logTerminal("Se recomienda contactar con soporte técnico para unificar las cuentas: " + this.results.duplicates.map(d => d.name).join(', '));
    },

    async lockCurrentLevels(silent = false) {
        if (!silent) {
            const confirmed = await window.PremiumModal.confirm({
                title: "🔒 CONSOLIDAR NIVELES",
                message: "¿Deseas fijar el nivel actual de todos los jugadores como su nuevo nivel de partida?<br><br>Esto te permitirá borrar partidos antiguos sin que su nivel cambie en futuros recálculos.",
                confirmText: "FIJAR NIVELES AHORA",
                type: 'warning'
            });
            if (!confirmed) return;
        }

        this.logTerminal("Iniciando consolidación de niveles...");
        
        try {
            const playersSnap = await window.db.collection('players').get();
            let count = 0;
            let batch = window.db.batch();
            
            for(const doc of playersSnap.docs) {
                const data = doc.data();
                const currentLevel = data.level || data.self_rate_level || 3.5;
                
                batch.update(doc.ref, {
                    self_rate_level: parseFloat(currentLevel)
                });
                
                count++;
                if (count % 450 === 0) {
                    await batch.commit();
                    batch = window.db.batch();
                    this.logTerminal(`... procesados ${count} jugadores`);
                }
            }
            
            await batch.commit();
            this.logTerminal(`✅ ÉXITO: Se han consolidado los niveles de ${count} jugadores.`);
            
            window.PremiumModal.alert({
                title: "NIVELES FIJADOS",
                message: "Ahora puedes borrar cualquier evento o partido de prueba. Los niveles de los jugadores no se verán afectados.",
                type: 'success'
            });
            
        } catch (e) {
            this.logTerminal("❌ Error: " + e.message, true);
        }
    },

    async nuclearCleanup() {
        const confirmed = await window.PremiumModal.confirm({
            title: "☢️ LIMPIEZA NUCLEAR (TOTAL)",
            message: "Esta acción hará 3 cosas en orden:<br>1. <b>Fijará los niveles</b> actuales como definitivos.<br>2. <b>Borrará todos</b> los partidos huérfanos.<br>3. <b>Borrará todos</b> los eventos de prueba.<br><br>¿Estás seguro de resetear el sistema para uso real?",
            confirmText: "SÍ, LIMPIAR TODO",
            type: 'danger'
        });

        if (!confirmed) return;

        this.logTerminal("Iniciando Limpieza Nuclear...");
        
        try {
            // 1. Lock Levels
            await this.lockCurrentLevels(true); // silent mode
            this.logTerminal("✅ Niveles consolidados.");

            // 2. Scan for orphans/test data
            await this.runScan();
            
            // 3. Purge Orphans
            if(this.results.orphans.length > 0) {
                await this.purgeOrphans(true); // silent mode
                this.logTerminal(`✅ ${this.results.orphans.length} partidos huérfanos purgados.`);
            }

            // 4. Purge Test Events (Wait, I need to implement purgeTestEvents)
            await this.purgeTestEvents();

            this.logTerminal("🏁 LIMPIEZA TOTAL COMPLETADA CON ÉXITO.");
            
            window.PremiumModal.alert({
                title: "SISTEMA LIMPIO",
                message: "Se han consolidado los niveles y se ha eliminado toda la basura de las pruebas. ¡Listo para jugar!",
                type: 'success'
            });
            
        } catch (e) {
            this.logTerminal("❌ Error en limpieza nuclear: " + e.message, true);
        }
    },

    async purgeTestEvents() {
        this.logTerminal("Buscando eventos de prueba para eliminar...");
        const collections = ['americanas', 'entrenos'];
        let deleted = 0;

        for (const col of collections) {
            const snap = await window.db.collection(col).get();
            for (const doc of snap.docs) {
                const data = doc.data();
                const name = (data.name || "").toLowerCase();
                const isTest = this.isTestData({ name }); // Reuse isTestData logic

                if (isTest) {
                    this.logTerminal(`Purgando evento: ${data.name}...`);
                    // Use the FirebaseDB delete method which also kills matches
                    const type = col === 'americanas' ? 'americana' : 'entreno';
                    await window.EventService.deleteEvent(type, doc.id);
                    deleted++;
                }
            }
        }
        this.logTerminal(`✅ ${deleted} eventos de prueba eliminados.`);
    },

    async emergencyRecovery() {
        const activeEvent = window.AdminController ? window.AdminController.activeEvent : null;
        if (!activeEvent) {
            alert("❌ Primero selecciona un evento en el panel de Resultados.");
            return;
        }

        const confirmed = await window.PremiumModal.confirm({
            title: "🆘 OPERACIÓN RESCATE AVANZADA",
            message: `¿Intentar reconstruir los partidos de <b>${activeEvent.name}</b> usando el historial de niveles?<br><br>Esta herramienta buscará los cambios de nivel de hoy y re-creará los partidos perdidos.`,
            confirmText: "INICIAR RECONSTRUCCIÓN",
            type: 'warning'
        });
        if (!confirmed) return;

        this.logTerminal("🆘 Iniciando escaneo forense de niveles...");
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const historySnap = await window.db.collection('level_history')
                .where('date', '>=', today)
                .get();

            if (historySnap.empty) {
                this.logTerminal("❌ No se encontró historial de niveles para hoy.", true);
                alert("No se han encontrado rastros de partidos terminados hoy en el historial de niveles.");
                return;
            }

            this.logTerminal(`🔍 Encontrados ${historySnap.size} registros de niveles hoy. Agrupando...`);

            // Group by MatchId
            const matchGroups = {};
            historySnap.forEach(doc => {
                const d = doc.data();
                const mId = d.matchId || d.date; // Use date as fallback if matchId missing
                if (!matchGroups[mId]) matchGroups[mId] = [];
                matchGroups[mId].push({ ...d, id: doc.id });
            });

            const playersSnap = await window.db.collection('players').get();
            const playerMap = {};
            playersSnap.forEach(d => playerMap[d.id] = d.data());

            let recoveredCount = 0;
            for (const mId in matchGroups) {
                const logs = matchGroups[mId];
                if (logs.length < 4) continue; // Need at least 4 players for a match

                // Identify winners (delta > 0) and losers (delta < 0)
                const winners = logs.filter(l => l.delta > 0);
                const losers = logs.filter(l => l.delta < 0);

                if (winners.length >= 2 && losers.length >= 2) {
                    const teamA = winners.slice(0, 2);
                    const teamB = losers.slice(0, 2);

                    // Re-create match!
                    const payload = {
                        americana_id: activeEvent.id,
                        round: 1, // We'll put them in Round 1 and you can move them
                        court: recoveredCount + 1,
                        status: 'finished',
                        score_a: 6,
                        score_b: 3,
                        createdAt: logs[0].date,
                        team_a_ids: teamA.map(l => l.userId),
                        team_a_names: teamA.map(l => playerMap[l.userId]?.name || "Desconocido"),
                        team_b_ids: teamB.map(l => l.userId),
                        team_b_names: teamB.map(l => playerMap[l.userId]?.name || "Desconocido"),
                        teamA: teamA.map(l => playerMap[l.userId]?.name || "Desconocido").join(' / '),
                        teamB: teamB.map(l => playerMap[l.userId]?.name || "Desconocido").join(' / '),
                        recovered: true
                    };

                    const coll = activeEvent.type === 'entreno' ? 'entrenos_matches' : 'matches';
                    await window.db.collection(coll).add(payload);
                    recoveredCount++;
                    this.logTerminal(`✅ Rescatado partido: ${payload.teamA} vs ${payload.teamB}`);
                }
            }

            if (recoveredCount === 0) {
                this.logTerminal("❌ No se pudieron reconstruir grupos de 4 jugadores válidos.", true);
            } else {
                this.logTerminal(`🏁 RESCATE COMPLETADO: ${recoveredCount} partidos restaurados.`);
                alert(`✅ Se han reconstruido ${recoveredCount} partidos.\n\nAparecerán en la RONDA 1. Puedes entrar en cada uno y ajustar el resultado real y la ronda si lo necesitas.`);
            }

        } catch (e) {
            this.logTerminal("❌ Error crítico en rescate: " + e.message, true);
        }
    }
};

console.log("👻 Ghost Buster Tool Loaded");
