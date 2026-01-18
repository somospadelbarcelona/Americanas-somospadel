/**
 * CaptainView.js
 * The UI interface for Capitán SomosPadel.
 */
(function () {
    class CaptainView {
        constructor() {
            this.modalId = 'captain-modal-root';
            this.injectStyles();
        }

        injectStyles() {
            if (document.getElementById('captain-styles')) return;
            const style = document.createElement('style');
            style.id = 'captain-styles';
            style.innerHTML = `
                .captain-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); z-index: 99999;
                    backdrop-filter: blur(12px);
                    display: flex; align-items: flex-end; justify-content: center;
                    opacity: 0; pointer-events: none; transition: opacity 0.3s;
                }
                @media(min-width: 768px) { .captain-overlay { align-items: center; } }
                .captain-overlay.open { opacity: 1; pointer-events: all; }
                .captain-card {
                    width: 100%; max-width: 420px;
                    background: #111827;
                    border-radius: 20px 20px 0 0;
                    border-top: 2px solid #CCFF00;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
                    transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    overflow: hidden; display: flex; flex-direction: column; max-height: 85vh;
                }
                @media(min-width: 768px) {
                    .captain-card { border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid #CCFF00; transform: translateY(20px); }
                }
                .captain-overlay.open .captain-card { transform: translateY(0); }
                .captain-header { padding: 20px; background: linear-gradient(135deg, rgba(204,255,0,0.1), rgba(0,0,0,0)); display: flex; gap: 15px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .captain-avatar { width: 50px; height: 50px; background: #CCFF00; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; box-shadow: 0 0 15px rgba(204,255,0,0.3); }
                .captain-body { padding: 20px; overflow-y: auto; flex: 1; }
                .insight-card { margin-bottom: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 15px; display: flex; gap: 15px; }
                .captain-footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); background: #111827; }
                .btn-captain-close { width: 100%; padding: 14px; background: #CCFF00; color: black; border: none; border-radius: 14px; font-weight: 900; font-size: 1rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
            `;
            document.head.appendChild(style);
        }

        async open(eventDoc = null) {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) { alert("Debes iniciar sesión."); return; }
            this.createModalDOM();
            this.toggle(true);

            const body = document.getElementById('captain-body-content');
            body.innerHTML = `<div style="text-align:center; padding: 40px; color: #64748b;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #CCFF00; margin-bottom: 20px;"></i><p>Conectando con el Capitán...</p></div>`;

            setTimeout(async () => {
                try {
                    if (eventDoc) {
                        const coll = eventDoc.isEntreno ? 'entrenos_matches' : 'matches';
                        const field = 'americana_id';
                        const snaps = await window.db.collection(coll).where(field, '==', eventDoc.id).get();
                        const history = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
                        const insights = window.CaptainService.analyze(user, history, eventDoc);
                        await window.CaptainService.saveAnalysis(user.uid, eventDoc, insights);
                        this.renderInsights(insights, eventDoc);
                    } else {
                        await this.renderHistory(user);
                    }
                } catch (e) {
                    body.innerHTML = `<p style="color:red; text-align:center;">Error al cargar: ${e.message}</p>`;
                }
            }, 500);
        }

        async renderHistory(user) {
            const body = document.getElementById('captain-body-content');
            const reports = await window.CaptainService.getAnalysisHistory(user.uid, 20);

            if (reports.length === 0) {
                body.innerHTML = `
                    <div style="text-align:center; padding: 40px 30px; color: #64748b;">
                        <h3 style="color: #fff; font-weight: 950; margin-bottom: 10px;">¡BIENVENIDO!</h3>
                        <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 25px;">No tengo informes guardados. Voy a buscar tus partidos en la base de datos.</p>
                        <button onclick="window.CaptainView.generateHistoryFromPastEvents('${user.uid}')" 
                                style="background: #CCFF00; color: black; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 950; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 15px rgba(204,255,0,0.4);">
                            RESCATAR PARTIDOS
                        </button>
                    </div>
                `;
                return;
            }

            const evolutionData = this.calculateEvolution(reports);
            body.innerHTML = `
                <div style="padding: 10px;">
                    <h3 style="color: #fff; font-weight: 900; font-size: 1.1rem; margin-bottom: 20px;">TU RENDIMIENTO</h3>
                    ${this.renderEvolutionChart(evolutionData)}
                    ${this.renderStatsSummary(evolutionData)}
                    <h4 style="color: #fff; font-weight: 900; font-size: 0.85rem; margin: 20px 0 10px 0;">HISTORIAL</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${reports.map(r => `<div onclick="window.CaptainView.viewReport('${r.id}')" style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"><div><div style="font-weight: 900; color: #fff; font-size: 0.85rem;">${r.eventName}</div><div style="font-size: 0.7rem; color: #64748b;">${r.eventDate}</div></div><i class="fas fa-chevron-right" style="color:#CCFF00;"></i></div>`).join('')}
                    </div>
                </div>
            `;
        }

        async generateHistoryFromPastEvents(userId) {
            const body = document.getElementById('captain-body-content');
            body.innerHTML = `<div style="text-align:center; padding: 60px 30px;"><i class="fas fa-magic fa-spin" style="font-size: 3rem; color: #CCFF00; margin-bottom: 20px;"></i><h3 style="color: #fff; font-weight: 900;">BUSCANDO PARTIDOS...</h3><p style="color: #64748b; font-size: 0.85rem;">Borrando informes viejos y localizando tus 6 partidos reales.</p></div>`;

            try {
                const user = window.Store.getState('currentUser');

                // 1. CLEAR OLD REPORTS - Forzar borrado radical
                const oldReports = await window.db.collection('players').doc(user.uid).collection('captain_reports').get();
                if (!oldReports.empty) {
                    const batch = window.db.batch();
                    oldReports.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }

                body.innerHTML = `<div style="text-align:center; padding: 60px 30px;"><i class="fas fa-satellite-dish fa-spin" style="font-size: 3rem; color: #CCFF00; margin-bottom: 20px;"></i><h3 style="color: #fff; font-weight: 900;">CALCULANDO VICTORIAS...</h3><p style="color: #64748b; font-size: 0.85rem;">Analizando pista por pista tu rendimiento real.</p></div>`;

                // 2. Fetch Events (Increase limit to reach Jan 11th)
                const [eSnap, aSnap] = await Promise.all([
                    window.db.collection('entrenos').orderBy('date', 'desc').limit(100).get(),
                    window.db.collection('americanas').orderBy('date', 'desc').limit(100).get()
                ]);

                const events = [...eSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'entreno' })), ...aSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'americana' }))];
                events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

                const searchTerms = [user.uid];
                if (user.name) {
                    const clean = user.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    searchTerms.push(clean);
                    clean.split(' ').forEach(p => { if (p.length > 2) searchTerms.push(p); });
                }

                let foundCount = 0;
                for (const evt of events) {
                    const coll = evt.type === 'entreno' ? 'entrenos_matches' : 'matches';
                    const mSnap = await window.db.collection(coll).where('americana_id', '==', evt.id).get();
                    const matches = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    const participated = matches.some(m => {
                        const str = JSON.stringify(m).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        return searchTerms.some(t => str.includes(t));
                    });

                    if (participated) {
                        const finished = matches.filter(m => m.status === 'finished' || m.isFinished || m.score);
                        if (finished.length > 0) {
                            const insights = window.CaptainService.analyze(user, finished, evt);
                            await window.CaptainService.saveAnalysis(user.uid, evt, insights);
                            foundCount++;
                        }
                    }
                }

                if (foundCount > 0) await this.renderHistory(user);
                else body.innerHTML = `<div style="text-align:center; padding:60px 30px;"><i class="fas fa-search-minus" style="font-size:2.5rem; color:#64748b; margin-bottom:20px;"></i><h3 style="color:#fff;">SIN RASTRO</h3><p style="color:#64748b;">No he encontrado partidos para tu ID o nombre "${user.name}".</p></div>`;

            } catch (e) {
                console.error("Captain Error:", e);
                body.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:red;">Error del escáner:</p><p style="color:#fff; font-size:0.8rem; background:rgba(255,0,0,0.1); padding:10px; border-radius:10px;">${e.message}</p></div>`;
            }
        }

        calculateEvolution(reports) {
            const data = { winRates: [], totalMatches: 0, totalWins: 0 };
            const seenEvents = new Set();

            reports.slice().reverse().forEach(r => {
                // Evitar duplicados por evento en el resumen global
                if (seenEvents.has(r.eventId)) return;
                seenEvents.add(r.eventId);

                const s = r.insights?.find(i => i.type === 'event_summary');
                if (!s) return;
                const m = s.message.match(/(\d+)\/(\d+) victorias/);
                if (m) {
                    const w = parseInt(m[1]), t = parseInt(m[2]);
                    data.winRates.push(Math.round((w / t) * 100));
                    data.totalMatches += t; data.totalWins += w;
                }
            });
            return data;
        }

        renderEvolutionChart(data) {
            if (data.winRates.length === 0) return '';
            return `<div style="background: rgba(255,255,255,0.02); border-radius: 16px; padding: 15px; margin-bottom: 12px;"><div style="display: flex; align-items: flex-end; gap: 4px; height: 50px;">${data.winRates.map(r => `<div style="flex:1; height:${r}% ; background:#CCFF00; border-radius:2px; opacity:0.8;"></div>`).join('')}</div></div>`;
        }

        renderStatsSummary(data) {
            const wr = data.totalMatches > 0 ? Math.round((data.totalWins / data.totalMatches) * 100) : 0;
            return `<div style="background: rgba(204,255,0,0.1); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items:center;"><div style="font-size: 1.2rem; font-weight: 950; color: #fff;">${wr}% <span style="font-size:0.6rem; color:#CCFF00; display:block;">GLOBAL</span></div><div style="text-align:right; font-size:0.7rem; color:#64748b;">${data.totalWins} Ganados / ${data.totalMatches} Partidos</div></div>`;
        }

        async viewReport(id) {
            const user = window.Store.getState('currentUser');
            const reports = await window.CaptainService.getAnalysisHistory(user.uid);
            const r = reports.find(x => x.id === id);
            if (r) this.renderInsights(r.insights, { name: r.eventName, date: r.eventDate });
        }

        renderInsights(insights, eventDoc) {
            const body = document.getElementById('captain-body-content');
            body.innerHTML = `
                <button onclick="window.CaptainView.open()" style="background:none; border:none; color:#CCFF00; font-weight:900; font-size:0.7rem; cursor:pointer; margin-bottom:12px;"><i class="fas fa-arrow-left"></i> VOLVER</button>
                <h3 style="color: #fff; font-weight: 900; font-size: 1rem; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">${eventDoc.name}</h3>
                ${insights.map(ins => `<div class="insight-card"><div style="font-size: 1.2rem;">${ins.icon}</div><div><div style="font-weight: 900; color: #fff; font-size: 0.8rem; margin-bottom: 2px;">${ins.title}</div><div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">${ins.message}</div></div></div>`).join('')}
            `;
        }

        createModalDOM() {
            let el = document.getElementById(this.modalId);
            if (!el) {
                el = document.createElement('div');
                el.id = this.modalId; el.className = 'captain-overlay';
                el.innerHTML = `<div class="captain-card"><div class="captain-header"><div class="captain-avatar"><i class="fas fa-robot"></i></div><div><div style="font-size: 1.1rem; font-weight: 950; color: white;">CAPITÁN SOMOSPADEL</div></div></div><div id="captain-body-content" class="captain-body"></div><div class="captain-footer"><button onclick="window.CaptainView.toggle(false)" class="btn-captain-close">CERRAR 🫡</button></div></div>`;
                document.body.appendChild(el);
            }
        }

        toggle(show) {
            const el = document.getElementById(this.modalId);
            if (el) show ? el.classList.add('open') : el.classList.remove('open');
        }
    }
    window.CaptainView = new CaptainView();
})();
