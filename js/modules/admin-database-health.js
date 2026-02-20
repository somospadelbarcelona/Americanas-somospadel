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
                    <button onclick="window.HealthTools.runScan()" class="btn-primary-pro" style="background: #00E36D; color: #000;">
                        <i class="fas fa-search"></i> INICIAR ESCANEO 360º
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

    async purgeOrphans() {
        if (!confirm("Esto eliminará físicamente los partidos que no pertenecen a ningún evento. ¿Continuar?")) return;
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
    }
};

console.log("👻 Ghost Buster Tool Loaded");
