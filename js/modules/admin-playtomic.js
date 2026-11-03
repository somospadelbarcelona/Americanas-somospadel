/**
 * admin-playtomic.js
 * Centro de Control Oficial Playtomic ⇄ SomosPadel BCN
 * 
 * Filtro estricto de organizadores oficiales:
 * 1) Sede: NEW Play Padel Pro Hospitalet -> Organizador: somospadel barcelona (somospadeleugestion@gmail.com)
 * 2) Sede: Barcelona Pádel El Prat -> Organizador: eduard bainad puig (Somos Padel Barcelona)
 * 
 * * EXCLUSIÓN ESTRICTA:
 * - Se descartan marcas externas y organizadores ajenos (Crazyxpadel, Jaleo, Vibra, etc.).
 * - Se descartan de la vista activa todas las americanas ya finalizadas o del día anterior.
 * Permite actualización autónoma y sincronización en tiempo real desde el panel de administración.
 */

(function () {
    'use strict';

    window.AdminViews = window.AdminViews || {};

    const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/americanas";
    const FIREBASE_API_KEY = "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE";

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    class AdminPlaytomicController {
        constructor() {
            this.tournaments = [];
            this.allOfficialTournaments = [];
            this.finishedCount = 0;
            this.activeCount = 0;
            this.loading = false;
            this.lastSync = null;
            this.viewFilter = 'active'; // 'active' (por defecto) o 'finished'
        }

        getTodayStr() {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        normalizeDate(d) {
            if (!d) return '';
            if (d.includes('/')) {
                const parts = d.split('/').map(p => p.trim());
                if (parts.length >= 2) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : String(new Date().getFullYear());
                    return `${year}-${month}-${day}`;
                }
            }
            return d;
        }

        // Validador estricto oficial SomosPadel Barcelona
        isOfficialSomosPadel(t) {
            if (!t) return false;
            const name = (t.name || t.title || '').toLowerCase();
            const loc = (t.location || t.sede || t.club || '').toLowerCase();
            const org = (t.organizer || t.created_by || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();

            // 1. Exclusión estricta de marcas externas y ajenas
            const forbidden = [
                'crazyxpadel', 'crazy', 'jaleo', 'vibra', 'breakfast', 'saturday padel',
                'siux', 'grx', 'xpadelclass', 'xavi perea', 'revolution', 'beerpoint', 'mahou'
            ];
            if (forbidden.some(b => name.includes(b) || org.includes(b) || desc.includes(b))) {
                return false;
            }

            // 2. Club 1: NEW Play Padel Pro Hospitalet
            const isNewPlay = loc.includes('new play') || loc.includes('play padel pro') || loc.includes('hospitalet');
            if (isNewPlay) {
                const isSomosOrg = org.includes('somospadel') || org.includes('somos padel') || org.includes('somospadeleugestion');
                const isSomosName = name.includes('somospadel') || name.includes('somos padel') || name.includes('americana mañanas') || name.includes('sabado party') || name.includes('americana sunday') || name.includes('americana domingo') || name.includes('halloween');
                return isSomosOrg || isSomosName;
            }

            // 3. Club 2: Barcelona Pádel El Prat
            const isElPrat = loc.includes('prat') || name.includes('prat');
            if (isElPrat) {
                const isEduard = org.includes('eduard bainad') || org.includes('bainad');
                const isSomosOrg = org.includes('somospadel') || org.includes('somos padel') || org.includes('somos pádel') || org.includes('alex');
                const isSomosName = name.includes('somospadel') || name.includes('somos padel') || name.includes('somos pádel');
                return (isEduard && (isSomosName || isSomosOrg || desc.includes('somos'))) || isSomosOrg || isSomosName;
            }

            // 4. Si el organizador o nombre pertenece a Somos Pádel
            return org.includes('somospadel') || org.includes('somos padel') || org.includes('somos pádel') || name.includes('somospadel') || name.includes('somos pádel');
        }

        getLocalDeletedSet() {
            try {
                const raw = localStorage.getItem('sp_deleted_playtomic_ids');
                const arr = raw ? JSON.parse(raw) : [];
                return new Set(arr.map(x => String(x).toLowerCase()));
            } catch (_) {
                return new Set();
            }
        }

        addLocalDeletedId(id, uuid) {
            try {
                const set = this.getLocalDeletedSet();
                if (id) set.add(String(id).toLowerCase());
                if (uuid) {
                    const u = String(uuid).toLowerCase();
                    set.add(u);
                    set.add(u.slice(0, 8));
                    set.add(`pt_${u.slice(0, 8)}`);
                }
                localStorage.setItem('sp_deleted_playtomic_ids', JSON.stringify(Array.from(set)));
            } catch (_) {}
        }

        removeLocalDeletedId(uuid) {
            try {
                const set = this.getLocalDeletedSet();
                if (uuid) {
                    const u = String(uuid).toLowerCase();
                    set.delete(u);
                    set.delete(u.slice(0, 8));
                    set.delete(`pt_${u.slice(0, 8)}`);
                }
                localStorage.setItem('sp_deleted_playtomic_ids', JSON.stringify(Array.from(set)));
            } catch (_) {}
        }

        isDeletedTournament(t) {
            if (!t) return true;
            if (t.is_deleted === true || (t.status || '').toLowerCase() === 'deleted') return true;
            const set = this.getLocalDeletedSet();
            const docId = String(t.id || t.doc_id || '').toLowerCase();
            const ptId = String(t.playtomic_id || '').toLowerCase();
            if (docId && set.has(docId)) return true;
            if (ptId && (set.has(ptId) || set.has(ptId.slice(0, 8)) || set.has(`pt_${ptId.slice(0, 8)}`))) return true;
            return false;
        }

        isPastTournament(t) {
            const todayStr = this.getTodayStr();
            const st = (t.status || '').toLowerCase().trim();
            if (st === 'finished' || st === 'finalizado' || st === 'completed' || st === 'cancelled') return true;

            const d = this.normalizeDate(t.normDate || t.date);
            if (d && d < todayStr) return true;

            return false;
        }

        async fetchTournaments() {
            let list = [];
            
            // 1. Intentar desde Firestore en vivo (servidor directo)
            try {
                if (window.db) {
                    const snap = await window.db.collection('americanas').get({ source: 'server' });
                    if (snap && !snap.empty) {
                        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    }
                }
            } catch (errDb) {
                console.warn("[AdminPlaytomic] Fallback a REST Firestore:", errDb);
            }

            // 2. Fallback REST si window.db falló
            if (!list || list.length === 0) {
                try {
                    const res = await fetch(`${FIRESTORE_BASE}?pageSize=100&key=${FIREBASE_API_KEY}&t=${Date.now()}`);
                    if (res.ok) {
                        const data = await res.json();
                        list = (data.documents || []).map(doc => {
                            const id = doc.name.split('/').pop();
                            const f = doc.fields || {};
                            const parseVal = (v) => {
                                if (!v) return null;
                                if (v.stringValue !== undefined) return v.stringValue;
                                if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
                                if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
                                if (v.booleanValue !== undefined) return v.booleanValue;
                                if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(parseVal);
                                if (v.mapValue !== undefined) {
                                    const obj = {};
                                    for (const k in v.mapValue.fields) obj[k] = parseVal(v.mapValue.fields[k]);
                                    return obj;
                                }
                                return null;
                            };
                            const item = { id };
                            for (const k in f) item[k] = parseVal(f[k]);
                            return item;
                        });
                    }
                } catch (eRest) {
                    console.warn("[AdminPlaytomic] Fallback REST falló:", eRest);
                }
            }

            // 3. Complementar o fusionar con snapshot local si estuviera disponible
            try {
                const snapRes = await fetch(`scraper/playtomic_extracted.json?v=${Date.now()}`);
                if (snapRes.ok) {
                    const localData = await snapRes.json();
                    if (Array.isArray(localData)) {
                        const map = new Map(list.map(item => [item.playtomic_id || item.id, item]));
                        localData.forEach(loc => {
                            const key = loc.playtomic_id || loc.id || loc.doc_id;
                            if (key && !map.has(key)) {
                                list.push(loc);
                            }
                        });
                    }
                }
            } catch (_) {}

            // 0. Sincronizar lista de bloqueados/eliminados desde Firestore (playtomic_deleted)
            try {
                if (window.db && typeof window.db.collection === 'function') {
                    const delSnap = await window.db.collection('playtomic_deleted').get();
                    if (delSnap && !delSnap.empty) {
                        const delSet = this.getLocalDeletedSet();
                        delSnap.docs.forEach(d => {
                            const data = d.data() || {};
                            delSet.add(String(d.id).toLowerCase());
                            if (data.uuid) delSet.add(String(data.uuid).toLowerCase());
                            if (data.doc_id) delSet.add(String(data.doc_id).toLowerCase());
                        });
                        localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify([...delSet]));
                    }
                }
            } catch (_) {}

            // Filtrar estrictamente: SOLO Americanas oficiales de SomosPadel Barcelona y NO eliminadas
            const seenKeys = new Set();
            const officialList = [];
            for (const item of list) {
                if (this.isDeletedTournament(item)) continue;
                if (!this.isOfficialSomosPadel(item)) continue;
                const k = (item.playtomic_id || item.id || item.doc_id || '').toLowerCase();
                if (k && seenKeys.has(k)) continue;
                if (k) seenKeys.add(k);
                officialList.push(item);
            }

            const sortActive = (a, b) => {
                const dA = this.normalizeDate(a.normDate || a.date || '9999-99-99');
                const dB = this.normalizeDate(b.normDate || b.date || '9999-99-99');
                if (dA !== dB) return dA.localeCompare(dB);
                return (a.time || '').localeCompare(b.time || '');
            };
            const sortFinished = (a, b) => {
                const dA = this.normalizeDate(a.normDate || a.date || '0000-00-00');
                const dB = this.normalizeDate(b.normDate || b.date || '0000-00-00');
                if (dA !== dB) return dB.localeCompare(dA);
                return (b.time || '').localeCompare(a.time || '');
            };

            this.allOfficialTournaments = officialList;
            const activeArr = officialList.filter(t => !this.isPastTournament(t)).sort(sortActive);
            const finishedArr = officialList.filter(t => this.isPastTournament(t)).sort(sortFinished);
            this.activeCount = activeArr.length;
            this.finishedCount = finishedArr.length;

            // Filtro activo: Por defecto NO mostrar americanas finalizadas ni del día anterior
            if (this.viewFilter === 'finished') {
                this.tournaments = finishedArr;
            } else {
                this.tournaments = activeArr;
            }

            this.lastSync = new Date();
            return this.tournaments;
        }

        setViewFilter(mode) {
            this.viewFilter = mode;
            const sortActive = (a, b) => {
                const dA = this.normalizeDate(a.normDate || a.date || '9999-99-99');
                const dB = this.normalizeDate(b.normDate || b.date || '9999-99-99');
                if (dA !== dB) return dA.localeCompare(dB);
                return (a.time || '').localeCompare(b.time || '');
            };
            const sortFinished = (a, b) => {
                const dA = this.normalizeDate(a.normDate || a.date || '0000-00-00');
                const dB = this.normalizeDate(b.normDate || b.date || '0000-00-00');
                if (dA !== dB) return dB.localeCompare(dA);
                return (b.time || '').localeCompare(a.time || '');
            };
            if (mode === 'finished') {
                this.tournaments = this.allOfficialTournaments.filter(t => this.isPastTournament(t)).sort(sortFinished);
            } else {
                this.tournaments = this.allOfficialTournaments.filter(t => !this.isPastTournament(t)).sort(sortActive);
            }
            this.renderTabs();
            this.renderTournamentCards();
        }

        renderTabs() {
            const tabsContainer = document.getElementById('pt-filter-tabs');
            if (!tabsContainer) return;

            tabsContainer.innerHTML = `
                <button type="button" class="pt-tab-btn ${this.viewFilter === 'active' ? 'active' : ''}" onclick="window.AdminPlaytomic.setViewFilter('active')">
                    <i class="fas fa-play-circle"></i> Activas / Próximas (${this.activeCount})
                </button>
                <button type="button" class="pt-tab-btn ${this.viewFilter === 'finished' ? 'active' : ''}" onclick="window.AdminPlaytomic.setViewFilter('finished')">
                    <i class="fas fa-history"></i> Finalizadas (${this.finishedCount})
                </button>
            `;
        }

        async triggerLocalDaemonSync(uuid = null) {
            const qs = uuid ? `?uuid=${encodeURIComponent(uuid)}` : '';
            const endpoints = [
                `http://localhost:8000/api/sync-playtomic${qs}`,
                `/api/sync-playtomic${qs}`
            ];
            for (const ep of endpoints) {
                try {
                    const ctrl = new AbortController();
                    const tid = setTimeout(() => ctrl.abort(), 12000);
                    const r = await fetch(ep, { method: 'POST', signal: ctrl.signal });
                    clearTimeout(tid);
                    if (r.ok) {
                        return await r.json();
                    }
                } catch (_) {}
            }
            return null;
        }

        async extractAndSaveDirectlyFromBrowser(uuid) {
            const ptUrl = `https://app.playtomic.com/tournaments/${uuid}`;
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(ptUrl)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ptUrl)}`
            ];
            let html = null;
            for (const p of proxies) {
                try {
                    const ctrl = new AbortController();
                    const tid = setTimeout(() => ctrl.abort(), 8000);
                    const r = await fetch(p, { signal: ctrl.signal });
                    clearTimeout(tid);
                    if (r.ok) {
                        const txt = await r.text();
                        if (txt && txt.length > 500) {
                            html = txt;
                            break;
                        }
                    }
                } catch (_) {}
            }
            if (!html) return null;

            let name = 'AMERICANA PLAYTOMIC';
            const mName = html.match(/"alt":"([^"]+)","src":"https:\/\/res\.cloudinary\.com\/playtomic/) || html.match(/<h1[^>]*>([^<]+)<\/h1>/);
            if (mName) name = mName[1].trim();

            const mTenant = html.match(/data-tracking-property-tenant-name="([^"]+)"/);
            const tenantName = mTenant ? mTenant[1].trim() : '';
            const isElPrat = tenantName.toLowerCase().includes('prat') || name.toLowerCase().includes('prat') || html.toLowerCase().includes('el prat');
            const sede = isElPrat ? 'Barcelona Pádel El Prat' : 'NEW Play Padel Pro Hospitalet';
            const organizer = isElPrat ? 'Eduard Bainad Puig' : 'somospadel barcelona';

            // Fecha y hora desde HTML
            let dateStr = this.getTodayStr();
            let timeStr = '18:00';
            let timeEndStr = '20:00';
            const mDt = html.match(/<p[^>]*class="[^"]*text-\[#566670\][^"]*"[^>]*>([^<]+)<\/p>/) || html.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Lun|Mar|Mie|Mié|Jue|Vie|Sab|Sáb|Dom)[^<>\n"]*·\s*([^<>\n"]+)/i);
            if (mDt) {
                const rawDt = (mDt[1] || mDt[0]).replace(/\u00a0/g, ' ');
                const months = { ene:'01', jan:'01', feb:'02', mar:'03', abr:'04', apr:'04', may:'05', jun:'06', jul:'07', ago:'08', aug:'08', sep:'09', set:'09', oct:'10', nov:'11', dic:'12', dec:'12' };
                const mA = rawDt.match(/([a-z]{3,})[a-z]*\s+(\d{1,2})/i);
                const mB = rawDt.match(/(\d{1,2})\s+(?:de\s+)?([a-z]{3,})/i);
                const yr = new Date().getFullYear();
                if (mA && months[mA[1].toLowerCase().slice(0,3)]) {
                    dateStr = `${yr}-${months[mA[1].toLowerCase().slice(0,3)]}-${mA[2].padStart(2, '0')}`;
                } else if (mB && months[mB[2].toLowerCase().slice(0,3)]) {
                    dateStr = `${yr}-${months[mB[2].toLowerCase().slice(0,3)]}-${mB[1].padStart(2, '0')}`;
                }
                const mT = rawDt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                if (mT) {
                    let hr = parseInt(mT[1], 10);
                    const mn = mT[2];
                    const ap = (mT[3] || '').toUpperCase();
                    if (ap === 'PM' && hr < 12) hr += 12;
                    if (ap === 'AM' && hr === 12) hr = 0;
                    timeStr = `${String(hr).padStart(2, '0')}:${mn}`;
                    timeEndStr = `${String(hr + 2).padStart(2, '0')}:${mn}`;
                }
            }

            let spotsLeft = 20, totalSpots = 20;
            const mSpots = html.match(/(\d+)\s*(?:de|of)\s*(\d+)\s*(?:plazas|spots)/i) || html.match(/(\d+)\s*(?:de|of)\s*(\d+)/);
            if (mSpots) {
                spotsLeft = parseInt(mSpots[1], 10);
                totalSpots = parseInt(mSpots[2], 10);
            }
            const occupiedSpots = Math.max(0, totalSpots - spotsLeft);
            const courtsCount = Math.max(2, Math.floor(totalSpots / 4));

            const mImgs = html.match(/https:\/\/res\.cloudinary\.com\/playtomic\/image\/upload\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/g);
            const posterUrl = (mImgs && mImgs.length > 0) ? mImgs[0] : 'img/padel-event.jpg';

            const docId = `pt_${uuid.slice(0, 8)}`;
            const isPast = dateStr < this.getTodayStr();
            const docPayload = {
                name,
                location: sede,
                sede,
                date: dateStr,
                normDate: dateStr,
                time: timeStr,
                time_end: timeEndStr,
                duration: '2h',
                pair_mode: 'twister',
                format: 'twister',
                category: name.toLowerCase().includes('femenin') ? 'femenina' : 'open',
                price: '12',
                price_members: '12',
                price_external: '12',
                max_players: totalSpots,
                occupied_players: occupiedSpots,
                spots_left: spotsLeft,
                max_courts: courtsCount,
                courts: courtsCount,
                image_url: posterUrl,
                playtomic_id: uuid,
                playtomicUrl: ptUrl,
                playtomic_url: ptUrl,
                status: isPast ? 'finished' : 'open',
                is_external: true,
                organizer
            };

            if (window.db) {
                await window.db.collection('americanas').doc(docId).set(docPayload, { merge: true });
            }
            return docPayload;
        }

        async refreshRealtime(btnElement) {
            this.loading = true;
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Actualizando en vivo...</span>`;
            }

            try {
                const feedbackEl = document.getElementById('playtomic-sync-feedback');
                if (feedbackEl) {
                    feedbackEl.style.display = 'block';
                    feedbackEl.className = 'playtomic-feedback-banner info';
                    feedbackEl.innerHTML = `
                        <i class="fas fa-satellite-dish fa-spin"></i>
                        <span>Conectando con la API oficial de Playtomic (somospadeleugestion@gmail.com) y Firestore en tiempo real...</span>
                    `;
                }

                // Disparar sincronización profunda contra el daemon local si está activo
                await this.triggerLocalDaemonSync();

                await this.fetchTournaments();

                this.renderTabs();
                this.renderTournamentCards();

                if (feedbackEl) {
                    feedbackEl.className = 'playtomic-feedback-banner success';
                    feedbackEl.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span><strong>¡Sincronización en tiempo real completada!</strong> Se han detectado y actualizado <strong>${this.activeCount} americanas activas oficiales</strong> (${new Date().toLocaleTimeString('es-ES')}).</span>
                    `;
                }

                // Disparar evento global para que la app cliente también actualice sin recargar
                window.dispatchEvent(new CustomEvent('americanasUpdated', { detail: { events: this.tournaments } }));
                if (window.EventsController && typeof window.EventsController.refreshInstantly === 'function') {
                    window.EventsController.refreshInstantly(null, true);
                }

            } catch (err) {
                console.error("[AdminPlaytomic] Error en sincronización:", err);
                const feedbackEl = document.getElementById('playtomic-sync-feedback');
                if (feedbackEl) {
                    feedbackEl.className = 'playtomic-feedback-banner error';
                    feedbackEl.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Error al sincronizar con Playtomic: ${escapeHtml(err.message || String(err))}</span>
                    `;
                }
            } finally {
                this.loading = false;
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = `<i class="fas fa-bolt"></i> <span>⚡ ACTUALIZAR AHORA EN TIEMPO REAL</span>`;
                }
            }
        }

        async syncCustomUrl() {
            const input = document.getElementById('playtomic-custom-url-input');
            if (!input || !input.value.trim()) {
                alert("Por favor pega un enlace válido de Playtomic (ej. https://app.playtomic.com/tournaments/...)");
                return;
            }

            const url = input.value.trim();
            const match = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
            if (!match) {
                alert("El enlace no contiene un ID de torneo válido de Playtomic.");
                return;
            }

            const uuid = match[1].toLowerCase();
            const feedbackEl = document.getElementById('playtomic-sync-feedback');
            if (feedbackEl) {
                feedbackEl.style.display = 'block';
                feedbackEl.className = 'playtomic-feedback-banner info';
                feedbackEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Sincronizando e importando torneo Playtomic (${uuid.slice(0, 8)}...) con tus credenciales oficiales...</span>`;
            }

            try {
                // 0. Si estaba bloqueado/eliminado previamente, desbloquearlo al pegarlo manualmente
                this.removeLocalDeletedId(uuid);
                try {
                    if (window.db) {
                        await window.db.collection('playtomic_deleted').doc(uuid).delete().catch(() => {});
                        await window.db.collection('playtomic_deleted').doc(`pt_${uuid.slice(0, 8)}`).delete().catch(() => {});
                    }
                } catch (_) {}

                // 1. Guardar en cola de Firestore para que el daemon autónomo lo mantenga siempre monitorizado
                try {
                    if (window.db) {
                        await window.db.collection('playtomic_sync_queue').doc(uuid).set({
                            uuid,
                            url,
                            addedAt: new Date().toISOString()
                        }, { merge: true });
                    }
                } catch (_) {}

                // 2. Intentar sincronización directa vía API local autenticada (trae nombres reales, fotos y niveles)
                const localRes = await this.triggerLocalDaemonSync(uuid);

                // 3. Si el servidor local no respondió (ej. desde móvil), extraer directamente desde el navegador y guardar en Firestore
                if (!localRes || !localRes.success) {
                    await this.extractAndSaveDirectlyFromBrowser(uuid);
                }

                // 4. Recargar torneos y mostrar confirmación inmediata
                await this.fetchTournaments();
                this.renderTabs();
                this.renderTournamentCards();
                input.value = '';

                const found = this.allOfficialTournaments.find(t => (t.playtomic_id || '').toLowerCase() === uuid || (t.id || '').includes(uuid.slice(0, 8)));
                if (feedbackEl) {
                    feedbackEl.className = 'playtomic-feedback-banner success';
                    feedbackEl.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span><strong>¡Enlace de Playtomic sincronizado con éxito!</strong> ${found ? `Torneo: <strong>${escapeHtml(found.name)}</strong> (${escapeHtml(found.date)} ${escapeHtml(found.time)})` : `ID ${uuid.slice(0, 8)} importado y activo.`}</span>
                    `;
                }
            } catch (err) {
                if (feedbackEl) {
                    feedbackEl.className = 'playtomic-feedback-banner error';
                    feedbackEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Error al importar enlace: ${escapeHtml(err.message || String(err))}</span>`;
                }
            }
        }

        async deleteTournament(docId, playtomicId, name) {
            const cleanDocId = (docId || '').trim();
            const cleanPtId = (playtomicId || '').trim();
            const label = name || cleanDocId || 'esta Americana';

            const ok = window.confirm(
                `⚠️ ¿Seguro que quieres ELIMINAR TOTALMENTE "${label}"?\n\n` +
                `• Se borrará inmediatamente de la App y de Firestore.\n` +
                `• Quedará bloqueada en la lista negra para que el sincronizador automático de Playtomic NO vuelva a importarla nunca.`
            );
            if (!ok) return;

            const feedbackEl = document.getElementById('playtomic-sync-feedback');
            if (feedbackEl) {
                feedbackEl.style.display = 'block';
                feedbackEl.className = 'playtomic-feedback-banner info';
                feedbackEl.innerHTML = `<i class="fas fa-trash-alt fa-spin"></i> <span>Eliminando totalmente <strong>${escapeHtml(label)}</strong> y bloqueando re-importación...</span>`;
            }

            try {
                // 1. Bloquear instantáneamente en localStorage
                this.addLocalDeletedId(cleanDocId, cleanPtId);

                // 2. Eliminar inmediatamente de la memoria visual y re-renderizar sin esperar red
                const matchFn = (t) => {
                    const tid = String(t.id || t.doc_id || '').toLowerCase();
                    const tpt = String(t.playtomic_id || '').toLowerCase();
                    if (cleanDocId && tid === cleanDocId.toLowerCase()) return false;
                    if (cleanPtId && (tpt === cleanPtId.toLowerCase() || tid.includes(cleanPtId.slice(0, 8).toLowerCase()))) return false;
                    return true;
                };
                this.allOfficialTournaments = (this.allOfficialTournaments || []).filter(matchFn);
                this.tournaments = (this.tournaments || []).filter(matchFn);
                this.activeCount = this.allOfficialTournaments.filter(t => !this.isPastTournament(t)).length;
                this.finishedCount = this.allOfficialTournaments.filter(t => this.isPastTournament(t)).length;
                this.renderTabs();
                this.renderTournamentCards();

                // 3. Eliminar en Firestore (SDK + REST fallback) y registrar en playtomic_deleted
                const targetDocId = cleanDocId || (cleanPtId ? `pt_${cleanPtId.slice(0, 8)}` : '');
                const blockKey = (cleanPtId || targetDocId).toLowerCase();

                if (window.db && typeof window.db.collection === 'function') {
                    if (targetDocId) {
                        await window.db.collection('americanas').doc(targetDocId).delete().catch(() => {});
                    }
                    if (blockKey) {
                        await window.db.collection('playtomic_deleted').doc(blockKey).set({
                            uuid: cleanPtId || targetDocId,
                            doc_id: targetDocId,
                            name: label,
                            deletedAt: new Date().toISOString()
                        }, { merge: true }).catch(() => {});
                    }
                    if (cleanPtId) {
                        await window.db.collection('playtomic_sync_queue').doc(cleanPtId.toLowerCase()).delete().catch(() => {});
                    }
                }

                // Fallback REST directo a Firestore
                if (targetDocId) {
                    fetch(`${FIRESTORE_BASE}/${encodeURIComponent(targetDocId)}?key=${FIREBASE_API_KEY}`, {
                        method: 'DELETE'
                    }).catch(() => {});
                }

                // 4. Notificar al daemon Python local (server.py) para borrar de playtomic_extracted.json y guardar en playtomic_deleted_uuids.txt
                const qs = `?id=${encodeURIComponent(targetDocId)}&uuid=${encodeURIComponent(cleanPtId)}`;
                const endpoints = [
                    `http://localhost:8000/api/delete-playtomic${qs}`,
                    `/api/delete-playtomic${qs}`
                ];
                for (const ep of endpoints) {
                    try {
                        await fetch(ep, { method: 'POST' });
                    } catch (_) {}
                }

                // 5. Notificar a la App de jugadores en tiempo real
                window.dispatchEvent(new CustomEvent('americanasUpdated', { detail: { deletedId: targetDocId } }));
                if (window.EventsController && typeof window.EventsController.refreshInstantly === 'function') {
                    window.EventsController.refreshInstantly(null, true);
                }

                if (feedbackEl) {
                    feedbackEl.className = 'playtomic-feedback-banner success';
                    feedbackEl.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span><strong>¡Americana eliminada totalmente!</strong> "${escapeHtml(label)}" ha sido borrada de la App y bloqueada para que no vuelva a importarse automáticamente.</span>
                    `;
                }
            } catch (err) {
                console.error("[AdminPlaytomic] Error al eliminar:", err);
                if (feedbackEl) {
                    feedbackEl.className = 'playtomic-feedback-banner error';
                    feedbackEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Error al eliminar: ${escapeHtml(err.message || String(err))}</span>`;
                }
            }
        }

        renderTournamentCards() {
            const container = document.getElementById('playtomic-tournaments-grid');
            if (!container) return;

            if (!this.tournaments || this.tournaments.length === 0) {
                const emptyMsg = this.viewFilter === 'finished' 
                    ? 'No hay Americanas finalizadas en el historial.' 
                    : 'No hay Americanas activas para hoy o días posteriores.';
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; background: #ffffff; border-radius: 16px; padding: 32px 20px; text-align: center; border: 1.5px dashed #cbd5e1;">
                        <i class="fas fa-calendar-check" style="font-size: 2.2rem; color: #10b981; margin-bottom: 12px;"></i>
                        <h4 style="font-size: 1.1rem; color: #0f172a; font-weight: 850; margin: 0 0 6px;">${emptyMsg}</h4>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 16px;">Todo lo anterior al día de hoy se archiva automáticamente en finalizadas.</p>
                        <button type="button" class="btn-pt-action" onclick="window.AdminPlaytomic.refreshRealtime(this)" style="background: linear-gradient(135deg, #00C6FF, #0072FF); color:#fff; border:none; padding:10px 18px; border-radius:10px; font-weight:800; cursor:pointer;">
                            <i class="fas fa-sync-alt"></i> Actualizar en Vivo
                        </button>
                    </div>
                `;
                return;
            }

            let html = '';
            this.tournaments.forEach(t => {
                const name = t.name || 'Americana Playtomic';
                const loc = t.location || t.sede || 'Club Oficial';
                const org = t.organizer || (loc.toLowerCase().includes('prat') ? 'Eduard Bainad Puig' : 'somospadel barcelona');
                const date = t.date || t.normDate || 'Fecha por confirmar';
                const time = t.time || '18:00';
                const timeEnd = t.time_end || '20:00';
                const total = parseInt(t.max_players || t.maxPlayers || 20, 10);
                const occupied = Array.isArray(t.players) ? t.players.length : parseInt(t.occupied_players || 0, 10);
                const spotsLeft = Math.max(0, total - occupied);
                const courts = parseInt(t.courts || t.max_courts || Math.max(2, Math.floor(total / 4)), 10);
                const img = t.image_url || 'img/padel-event.jpg';
                const ptUrl = t.playtomicUrl || t.playtomic_url || (t.playtomic_id ? `https://app.playtomic.com/tournaments/${t.playtomic_id}` : '#');
                const pct = Math.min(100, Math.round((occupied / total) * 100));

                const isElPrat = loc.toLowerCase().includes('prat');
                const clubBadgeColor = isElPrat ? '#0072FF' : '#00C6FF';

                const isPast = this.isPastTournament(t);
                const statusPill = isPast 
                    ? `<span class="pt-status-pill full">FINALIZADA</span>`
                    : `<span class="pt-status-pill ${spotsLeft <= 2 ? 'full' : 'available'}">${spotsLeft === 0 ? 'COMPLETO' : `⚡ ${spotsLeft} libres`}</span>`;

                html += `
                    <div class="playtomic-card-pro" style="${isPast ? 'opacity: 0.85; filter: grayscale(15%);' : ''}">
                        <div class="playtomic-card-header" style="background-image: linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.85) 100%), url('${escapeHtml(img)}');">
                            <span class="pt-club-badge" style="background: ${clubBadgeColor};">
                                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(loc)}
                            </span>
                            ${statusPill}
                        </div>
                        <div class="playtomic-card-body">
                            <h3 class="pt-card-title">${escapeHtml(name)}</h3>
                            
                            <div class="pt-meta-row">
                                <div class="pt-meta-item">
                                    <i class="fas fa-user-shield" style="color: #0072FF;"></i>
                                    <div>
                                        <div class="pt-meta-label">Organizador Oficial</div>
                                        <div class="pt-meta-val verified">${escapeHtml(org)} <i class="fas fa-check-circle" style="color: #10b981; font-size: 0.75rem;"></i></div>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-grid-2col">
                                <div class="pt-meta-item">
                                    <i class="fas fa-calendar-alt" style="color: #64748b;"></i>
                                    <div>
                                        <div class="pt-meta-label">Fecha</div>
                                        <div class="pt-meta-val">${escapeHtml(date)}</div>
                                    </div>
                                </div>
                                <div class="pt-meta-item">
                                    <i class="fas fa-clock" style="color: #64748b;"></i>
                                    <div>
                                        <div class="pt-meta-label">Horario</div>
                                        <div class="pt-meta-val">${escapeHtml(time)} - ${escapeHtml(timeEnd)} h</div>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-progress-wrapper">
                                <div class="pt-progress-header">
                                    <span><strong>${occupied}</strong> de <strong>${total}</strong> plazas ocupadas</span>
                                    <span><strong>${courts}</strong> pistas</span>
                                </div>
                                <div class="pt-progress-bar">
                                    <div class="pt-progress-fill" style="width: ${pct}%;"></div>
                                </div>
                            </div>

                            <div class="pt-card-actions">
                                <a href="${escapeHtml(ptUrl)}" target="_blank" class="btn-pt-link" title="Abrir en Playtomic Oficial">
                                    <i class="fas fa-external-link-alt"></i> Playtomic
                                </a>
                                <button type="button" class="btn-pt-inspect" onclick="window.openInscritosModal && window.openInscritosModal('${escapeHtml(t.id || t.doc_id)}', 'americana')">
                                    <i class="fas fa-users"></i> Cuadro & Inscritos
                                </button>
                                <button type="button" class="btn-pt-delete" onclick="window.AdminPlaytomic.deleteTournament('${escapeHtml(t.id || t.doc_id || '')}', '${escapeHtml(t.playtomic_id || '')}', '${escapeHtml(name)}')" title="Eliminar totalmente de la App y bloquear de Playtomic">
                                    <i class="fas fa-trash-alt"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        async render() {
            const content = document.getElementById('content-area');
            if (!content) return;

            content.innerHTML = `
                <style>
                    .playtomic-mgmt-container {
                        max-width: 1300px;
                        margin: 0 auto;
                        padding: 20px 16px 40px;
                        font-family: 'Outfit', -apple-system, sans-serif;
                    }
                    .pt-hero-banner {
                        background: linear-gradient(135deg, #0b192c 0%, #1e3a8a 50%, #0284c7 100%);
                        border-radius: 24px;
                        padding: 28px 24px;
                        color: #ffffff;
                        box-shadow: 0 15px 35px -10px rgba(2, 132, 199, 0.4);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        margin-bottom: 24px;
                        position: relative;
                        overflow: hidden;
                    }
                    .pt-hero-banner::after {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -10%;
                        width: 300px;
                        height: 300px;
                        background: radial-gradient(circle, rgba(0, 198, 255, 0.25) 0%, transparent 70%);
                        border-radius: 50%;
                        pointer-events: none;
                    }
                    .pt-hero-title {
                        font-size: 1.6rem;
                        font-weight: 900;
                        margin: 0 0 6px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .pt-hero-subtitle {
                        font-size: 0.9rem;
                        opacity: 0.9;
                        margin: 0 0 18px;
                        max-width: 800px;
                        line-height: 1.4;
                    }
                    .pt-sedes-pills {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                    }
                    .pt-sede-pill {
                        background: rgba(255, 255, 255, 0.15);
                        backdrop-filter: blur(8px);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 8px 14px;
                        border-radius: 50px;
                        font-size: 0.8rem;
                        font-weight: 750;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .pt-sede-pill .dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #10b981;
                        box-shadow: 0 0 8px #10b981;
                    }
                    .pt-action-bar {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 14px;
                        align-items: center;
                        justify-content: space-between;
                        background: #ffffff;
                        padding: 18px 20px;
                        border-radius: 18px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
                        margin-bottom: 24px;
                    }
                    .btn-pt-sync-realtime {
                        background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
                        color: #ffffff;
                        border: none;
                        padding: 14px 26px;
                        border-radius: 12px;
                        font-size: 0.95rem;
                        font-weight: 900;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 8px 20px rgba(0, 198, 255, 0.4);
                        transition: all 0.2s ease;
                    }
                    .btn-pt-sync-realtime:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 25px rgba(0, 198, 255, 0.55);
                    }
                    .btn-pt-sync-realtime:active {
                        transform: scale(0.97);
                    }
                    .pt-url-form {
                        display: flex;
                        gap: 8px;
                        flex: 1;
                        min-width: 280px;
                        max-width: 600px;
                    }
                    .pt-url-input {
                        flex: 1;
                        padding: 12px 16px;
                        border: 1.5px solid #cbd5e1;
                        border-radius: 10px;
                        font-size: 0.88rem;
                        font-family: inherit;
                        outline: none;
                        transition: border 0.2s;
                    }
                    .pt-url-input:focus {
                        border-color: #0072FF;
                        box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.15);
                    }
                    .btn-pt-add-url {
                        background: #0f172a;
                        color: #ffffff;
                        border: none;
                        padding: 12px 18px;
                        border-radius: 10px;
                        font-size: 0.85rem;
                        font-weight: 800;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .playtomic-feedback-banner {
                        padding: 14px 18px;
                        border-radius: 12px;
                        margin-bottom: 24px;
                        font-size: 0.88rem;
                        font-weight: 700;
                        display: none;
                        align-items: center;
                        gap: 12px;
                    }
                    .playtomic-feedback-banner.info {
                        background: #eff6ff;
                        border: 1px solid #bfdbfe;
                        color: #1d4ed8;
                        display: flex;
                    }
                    .playtomic-feedback-banner.success {
                        background: #ecfdf5;
                        border: 1px solid #a7f3d0;
                        color: #047857;
                        display: flex;
                    }
                    .playtomic-feedback-banner.error {
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        color: #b91c1c;
                        display: flex;
                    }
                    .pt-tabs-wrapper {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                    }
                    .pt-tab-btn {
                        background: #f1f5f9;
                        border: 1px solid #cbd5e1;
                        color: #475569;
                        padding: 8px 16px;
                        border-radius: 10px;
                        font-weight: 800;
                        font-size: 0.82rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.15s;
                    }
                    .pt-tab-btn.active {
                        background: #0072FF;
                        border-color: #0072FF;
                        color: #ffffff;
                        box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
                    }
                    .playtomic-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                        gap: 20px;
                    }
                    .playtomic-card-pro {
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
                        transition: transform 0.2s, box-shadow 0.2s;
                        display: flex;
                        flex-direction: column;
                    }
                    .playtomic-card-pro:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
                    }
                    .playtomic-card-header {
                        height: 140px;
                        background-size: cover;
                        background-position: center;
                        padding: 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        position: relative;
                    }
                    .pt-club-badge {
                        color: #ffffff;
                        font-size: 0.72rem;
                        font-weight: 900;
                        padding: 4px 10px;
                        border-radius: 20px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    }
                    .pt-status-pill {
                        font-size: 0.72rem;
                        font-weight: 900;
                        padding: 4px 10px;
                        border-radius: 20px;
                    }
                    .pt-status-pill.available {
                        background: #10b981;
                        color: #ffffff;
                    }
                    .pt-status-pill.full {
                        background: #64748b;
                        color: #ffffff;
                    }
                    .playtomic-card-body {
                        padding: 18px 20px;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .pt-card-title {
                        font-size: 1.15rem;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 0;
                        line-height: 1.3;
                    }
                    .pt-meta-row {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .pt-grid-2col {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        background: #f8fafc;
                        padding: 10px 14px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                    }
                    .pt-meta-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .pt-meta-label {
                        font-size: 0.7rem;
                        color: #64748b;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .pt-meta-val {
                        font-size: 0.85rem;
                        color: #0f172a;
                        font-weight: 800;
                    }
                    .pt-meta-val.verified {
                        color: #0072FF;
                    }
                    .pt-progress-wrapper {
                        margin-top: 4px;
                    }
                    .pt-progress-header {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.78rem;
                        color: #475569;
                        margin-bottom: 6px;
                    }
                    .pt-progress-bar {
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    .pt-progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #00C6FF, #0072FF);
                        border-radius: 10px;
                        transition: width 0.3s;
                    }
                    .pt-card-actions {
                        display: flex;
                        gap: 8px;
                        margin-top: auto;
                        padding-top: 8px;
                    }
                    .btn-pt-link {
                        flex: 1;
                        background: #f1f5f9;
                        color: #0f172a;
                        text-decoration: none;
                        padding: 10px;
                        border-radius: 10px;
                        font-size: 0.8rem;
                        font-weight: 800;
                        text-align: center;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        border: 1px solid #cbd5e1;
                        transition: background 0.15s;
                    }
                    .btn-pt-link:hover {
                        background: #e2e8f0;
                    }
                    .btn-pt-inspect {
                        background: #0072FF;
                        color: #ffffff;
                        border: none;
                        padding: 10px 14px;
                        border-radius: 10px;
                        font-size: 0.8rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .btn-pt-delete {
                        background: #fef2f2;
                        color: #dc2626;
                        border: 1px solid #fecaca;
                        padding: 10px 12px;
                        border-radius: 10px;
                        font-size: 0.8rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        transition: all 0.15s ease;
                    }
                    .btn-pt-delete:hover {
                        background: #ef4444;
                        color: #ffffff;
                        border-color: #ef4444;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                    }
                    @media (max-width: 768px) {
                        .playtomic-grid {
                            grid-template-columns: 1fr;
                        }
                        .pt-action-bar {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        .pt-url-form {
                            width: 100%;
                            max-width: 100%;
                        }
                        .btn-pt-sync-realtime {
                            width: 100%;
                            justify-content: center;
                        }
                    }
                </style>

                <div class="playtomic-mgmt-container">
                    <!-- HERO BANNER -->
                    <div class="pt-hero-banner">
                        <div class="pt-hero-title">
                            <i class="fas fa-bolt" style="color: #00C6FF;"></i>
                            <span>CENTRO DE CONTROL PLAYTOMIC (EN VIVO)</span>
                        </div>
                        <div class="pt-hero-subtitle">
                            Gestión y sincronización autónoma en tiempo real de Americanas oficiales de <strong>SomosPadel Barcelona</strong>. 
                            Filtro estricto activo: sólo se incluyen torneos vigentes organizados por nosotros. Todo lo del día anterior se archiva automáticamente.
                        </div>
                        <div class="pt-sedes-pills">
                            <div class="pt-sede-pill">
                                <span class="dot"></span>
                                <span>NEW Play Padel Pro Hospitalet • Organizador: <strong>somospadel barcelona</strong></span>
                            </div>
                            <div class="pt-sede-pill">
                                <span class="dot"></span>
                                <span>Barcelona Pádel El Prat • Organizador: <strong>Eduard Bainad Puig</strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- BARRA DE ACCIÓN Y SINCRONIZACIÓN EN TIEMPO REAL -->
                    <div class="pt-action-bar">
                        <button type="button" class="btn-pt-sync-realtime" onclick="window.AdminPlaytomic.refreshRealtime(this)">
                            <i class="fas fa-bolt"></i>
                            <span>⚡ ACTUALIZAR AHORA EN TIEMPO REAL</span>
                        </button>

                        <div class="pt-url-form">
                            <input type="text" id="playtomic-custom-url-input" class="pt-url-input" 
                                placeholder="Pegar enlace de Playtomic (ej. https://app.playtomic.com/tournaments/...)">
                            <button type="button" class="btn-pt-add-url" onclick="window.AdminPlaytomic.syncCustomUrl()">
                                <i class="fas fa-plus"></i> Sincronizar
                            </button>
                        </div>
                    </div>

                    <!-- BANNER DE FEEDBACK DINÁMICO -->
                    <div id="playtomic-sync-feedback" class="playtomic-feedback-banner"></div>

                    <!-- FILTRO DE PESTAÑAS: ACTIVAS VS FINALIZADAS -->
                    <div id="pt-filter-tabs" class="pt-tabs-wrapper"></div>

                    <div id="playtomic-tournaments-grid" class="playtomic-grid">
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                            <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: #0072FF;"></i>
                            <p style="color: #64748b; font-size: 0.9rem; margin-top: 10px;">Consultando americanas activas en Playtomic...</p>
                        </div>
                    </div>
                </div>
            `;

            // Cargar datos automáticamente al abrir la vista
            await this.fetchTournaments();
            this.renderTabs();
            this.renderTournamentCards();
        }
    }

    const controller = new AdminPlaytomicController();
    window.AdminPlaytomic = controller;
    window.AdminViews['playtomic'] = () => controller.render();

})();
