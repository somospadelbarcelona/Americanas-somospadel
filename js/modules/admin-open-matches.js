/**
 * admin-open-matches.js
 * View Controller for Open Matches (Partidas Abiertas) and Venues (Clubes/Sedes) Management from Admin Panel.
 * Version: 3.0.0
 * Features 18 premium venues across Barcelona and Baix Llobregat with comarca filters, text search, dynamic selects, and 1-click restore.
 */
console.log("🚀 AdminOpenMatches Loaded (v3.0.0)");

// Inject autocomplete suggestions styling
(function injectAutocompleteCSS() {
    if (document.getElementById('autocomplete-custom-styles')) return;
    const style = document.createElement('style');
    style.id = 'autocomplete-custom-styles';
    style.textContent = `
        .autocomplete-suggestions {
            background: #ffffff !important;
            border: 1.5px solid #000000 !important;
            border-radius: 16px !important;
            box-shadow: 0 12px 30px rgba(0,0,0,0.12) !important;
            z-index: 10000 !important;
            overflow: hidden !important;
        }
        .autocomplete-item {
            padding: 12px 16px !important;
            cursor: pointer !important;
            border-bottom: 1px solid #f1f5f9 !important;
            border-left: 4px solid transparent !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            text-align: left !important;
        }
        .autocomplete-item:hover {
            background-color: rgba(204, 255, 0, 0.15) !important;
            transform: translateX(4px) !important;
            border-left: 4px solid #ccff00 !important;
        }
        .autocomplete-item:last-child {
            border-bottom: none !important;
        }
    `;
    document.head.appendChild(style);
})();

window.renderSelectedClubCardHtml = function(name, comarca, address, courts) {
    const isCustom = !address;
    if (isCustom) {
        return `
            <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 8px;">
                    <span style="font-weight: 950; font-size: 0.95rem; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">${name.toUpperCase()}</span>
                    <span style="background: #64748b; color: #ffffff; font-size: 0.62rem; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">MANUAL</span>
                </div>
                <div style="font-size: 0.72rem; color: #64748B; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-info-circle" style="color: #64748b; font-size: 0.85rem;"></i>
                    Este club no está registrado en la base de datos oficial.
                </div>
            </div>
        `;
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + address)}`;
    return `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 8px;">
                <span style="font-weight: 950; font-size: 0.95rem; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">${name.toUpperCase()}</span>
                <span style="background: #10B981; color: #ffffff; font-size: 0.62rem; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; flex-shrink: 0;">${comarca.toUpperCase()}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #475569; font-weight: 600;">
                    <i class="fas fa-location-dot" style="color: #10B981; flex-shrink: 0;"></i>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; color: #475569;">${address}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
                    <span style="font-size: 0.72rem; color: #64748B; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-table-tennis-paddle-ball" style="color: #10B981;"></i> <span style="color: #0F172A; font-weight: 900;">${courts}</span> pistas
                    </span>
                    <a href="${mapsUrl}" target="_blank" style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid #10B981; color: #10B981; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; cursor: pointer;">
                        <i class="fas fa-map-location-dot"></i> Ver en Maps
                    </a>
                </div>
            </div>
        </div>
    `;
};

window.generateAdminLevelOptionTags = function(selectedVal) {
    let html = '';
    for (let lvl = 1.0; lvl <= 6.0; lvl = parseFloat((lvl + 0.1).toFixed(1))) {
        const selected = Math.abs(lvl - parseFloat(selectedVal)) < 0.05 ? 'selected' : '';
        html += `<option value="${lvl.toFixed(1)}" ${selected}>Nivel ${lvl.toFixed(1)}</option>`;
    }
    return html;
};

window.updateAdminLiveSpotsBadge = function() {
    const isEdit = document.getElementById('edit-open-match-form') !== null;
    const formId = isEdit ? 'edit-open-match-form' : 'create-open-match-form';
    const badgeId = isEdit ? 'admin-edit-live-spots-needed-badge' : 'admin-live-spots-needed-badge';
    const form = document.getElementById(formId);
    if (!form) return;
    
    const p1 = form.querySelector('[name=player_1]')?.value.trim() || '';
    const p2 = form.querySelector('[name=player_2]')?.value.trim() || '';
    const p3 = form.querySelector('[name=player_3]')?.value.trim() || '';
    const p4 = form.querySelector('[name=player_4]')?.value.trim() || '';
    
    let count = 0;
    if (p1) count++;
    if (p2) count++;
    if (p3) count++;
    if (p4) count++;
    
    const spots = Math.max(0, 4 - count);
    const badge = document.getElementById(badgeId);
    if (badge) {
        if (spots === 0) {
            badge.textContent = "COMPLETO";
            badge.style.background = "#ef4444";
        } else if (spots === 1) {
            badge.textContent = "¡ÚLTIMO HUECO!";
            badge.style.background = "#ff9500";
        } else {
            badge.textContent = `FALTAN ${spots} PLAZAS`;
            badge.style.background = "#2E61FF";
        }
    }
};

window.loadAdminPlayersCache = async function() {
    if (window.adminPlayersCache && window.adminPlayersCache.length > 0) return window.adminPlayersCache;
    window.adminPlayersCache = [];
    if (!window.db) return [];
    try {
        const snap = await window.db.collection('players').get();
        snap.forEach(doc => {
            const data = doc.data();
            if (data.name) {
                window.adminPlayersCache.push({
                    name: data.name.trim(),
                    level: parseFloat(data.level || 3.0),
                    phone: data.phone || data.phoneNumber || ""
                });
            }
        });
        console.log(`🧠 [AdminOpenMatches] Loaded ${window.adminPlayersCache.length} players for autocomplete.`);
    } catch (err) {
        console.warn("Error loading admin players cache:", err);
    }
    return window.adminPlayersCache;
};

window.bindAdminPlayerAutocomplete = async function(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const playersList = await window.loadAdminPlayersCache();

    const playerInputs = [
        form.querySelector('[name=player_1]'),
        form.querySelector('[name=player_2]'),
        form.querySelector('[name=player_3]'),
        form.querySelector('[name=player_4]')
    ];

    playerInputs.forEach((inputEl, idx) => {
        if (!inputEl) return;

        let suggestionsContainer = form.querySelector(`#admin-player-suggestions-container-${formId}-${idx + 1}`);
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = `admin-player-suggestions-container-${formId}-${idx + 1}`;
            suggestionsContainer.className = 'autocomplete-suggestions';
            suggestionsContainer.style.cssText = 'display:none; position:absolute; top:100%; left:0; right:0; max-height:180px; overflow-y:auto; margin-top:4px; z-index:99999;';
            const parent = inputEl.parentElement;
            if (parent) {
                parent.style.position = 'relative';
                parent.appendChild(suggestionsContainer);
            }
        }

        const showSuggestions = () => {
            const val = inputEl.value;
            const query = val.toLowerCase().trim();
            let matches = [];
            if (!query) {
                matches = playersList.slice(0, 5);
            } else {
                matches = playersList.filter(p => p.name.toLowerCase().includes(query));
            }

            if (matches.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            let html = '';
            matches.slice(0, 5).forEach(p => {
                html += `
                    <div class="autocomplete-item select-player-suggestion-item" 
                         style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(15, 23, 42, 0.04); text-align: left;"
                         data-name="${p.name}" 
                         data-level="${p.level}" 
                         data-phone="${p.phone}">
                        <div style="font-weight: 850; color: #0F172A; font-size: 0.82rem;">${p.name}</div>
                        <div style="font-size: 0.65rem; color: #64748B; font-weight: 600;">⚡ Nivel: ${p.level.toFixed(2)} ${p.phone ? `• 📞 ${p.phone}` : ''}</div>
                    </div>
                `;
            });

            suggestionsContainer.innerHTML = html;
            suggestionsContainer.style.display = 'block';
        };

        inputEl.addEventListener('focus', showSuggestions);
        inputEl.addEventListener('input', showSuggestions);

        suggestionsContainer.onmousedown = (e) => {
            const item = e.target.closest('.select-player-suggestion-item');
            if (!item) return;

            const name = item.getAttribute('data-name');
            const phone = item.getAttribute('data-phone');

            inputEl.value = name;
            
            if (idx === 0) {
                const creatorNameEl = form.querySelector('[name=creator_name]');
                const creatorPhoneEl = form.querySelector('[name=creator_phone]');
                if (creatorNameEl && !creatorNameEl.value.trim()) {
                    creatorNameEl.value = name;
                }
                if (creatorPhoneEl && !creatorPhoneEl.value.trim() && phone) {
                    creatorPhoneEl.value = phone;
                }
            }

            window.updateAdminLiveSpotsBadge();
            suggestionsContainer.style.display = 'none';
        };

        document.addEventListener('click', (e) => {
            if (!inputEl.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    });
};

window.AdminViews = window.AdminViews || {};

// Collection Names in Firestore
const OPEN_MATCHES_COLLECTION = 'open_matches';
const PADEL_CLUBS_COLLECTION = 'padel_clubs';

// Current active sub-tab state inside Gestor de Partidas ('partidas' | 'clubes')
window.AdminOpenMatchesTab = window.AdminOpenMatchesTab || 'partidas';

// Expanded Seed Data for Clubs (37 premium locations in Barcelona and Baix Llobregat)
const SEED_CLUBS = [
    {
        name: "Barcelona Pádel el Prat",
        address: "Parque de la Riera, Carrer de les Moreres, s/n, 08820 El Prat de Llobregat, Barcelona",
        courts_count: 14,
        comarca: "Baix Llobregat"
    },
    {
        name: "Club Delfos Cornellá",
        address: "Carrer del Verge de Montserrat, 2, 08940 Cornellà de Llobregat, Barcelona",
        courts_count: 10,
        comarca: "Baix Llobregat"
    },
    {
        name: "Can Vía Racket Club",
        address: "Masia Can Via, s/n, 08690 Santa Coloma de Cervelló, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Padel Hospitalet",
        address: "Avinguda de la Riera de l'Escorxador, 15, 08902 L'Hospitalet de Llobregat, Barcelona",
        courts_count: 12,
        comarca: "Baix Llobregat"
    },
    {
        name: "Nick Club Pádel Barcelona",
        address: "Carrer de la Font d'en Fargas, 2, 08032 Barcelona",
        courts_count: 9,
        comarca: "Barcelona"
    },
    {
        name: "Vall d'Hebron Pàdel",
        address: "Passeig de la Vall d'Hebron, 178, 08035 Barcelona",
        courts_count: 7,
        comarca: "Barcelona"
    },
    {
        name: "Padel Indoor Hospitalet",
        address: "Carrer de la Botánica, 110, 08908 L'Hospitalet de Llobregat, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Artós Sports Club",
        address: "Carrer de les Tres Creus, 8, 08017 Barcelona",
        courts_count: 6,
        comarca: "Barcelona"
    },
    {
        name: "Padelarium Gavà",
        address: "Carrer de la Máquina, 11, 08850 Gavà, Barcelona",
        courts_count: 12,
        comarca: "Baix Llobregat"
    },
    {
        name: "Pàdel Club Esplugues",
        address: "Carrer de la Riera d'en Nofre, s/n, 08950 Esplugues de Llobregat, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Castelldefels Padel Plus",
        address: "Passeig Marítim, 271, 08860 Castelldefels, Barcelona",
        courts_count: 10,
        comarca: "Baix Llobregat"
    },
    {
        name: "Slam Club Padel",
        address: "Carrer de les Bruixes, s/n, 08293 Collbató, Barcelona",
        courts_count: 15,
        comarca: "Baix Llobregat"
    },
    {
        name: "Sant Feliu Pàdel Club",
        address: "Carrer de Laureà Miró, 350, 08980 Sant Feliu de Llobregat, Barcelona",
        courts_count: 9,
        comarca: "Baix Llobregat"
    },
    {
        name: "Padel Indoor Gran Via 2",
        address: "Carrer de les Ciències, 75, 08908 L'Hospitalet de Llobregat, Barcelona",
        courts_count: 11,
        comarca: "Baix Llobregat"
    },
    {
        name: "Aurial Padel Sant Boi",
        address: "Carrer del Baldiri Aleu, 3, 08830 Sant Boi de Llobregat, Barcelona",
        courts_count: 14,
        comarca: "Baix Llobregat"
    },
    {
        name: "Padel Club Sant Just",
        address: "Carrer de l'Electricitat, 16, 08960 Sant Just Desvern, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Padel Premium Viladecans",
        address: "Carrer de la Tecnología, 17, 08840 Viladecans, Barcelona",
        courts_count: 10,
        comarca: "Baix Llobregat"
    },
    {
        name: "Real Club de Polo de Barcelona",
        address: "Avinguda de Doctor Marañón, 19, 08028 Barcelona",
        courts_count: 16,
        comarca: "Barcelona"
    },
    {
        name: "Fairplay Padel Club",
        address: "Carrer del Foc, 2, 08038 Barcelona",
        courts_count: 8,
        comarca: "Barcelona"
    },
    {
        name: "Indoor Padel Barcelona",
        address: "Carrer de Veneçuela, 78, 08019 Barcelona",
        courts_count: 8,
        comarca: "Barcelona"
    },
    {
        name: "Club Esportiu Laietà",
        address: "Carrer Pintor Ribalta, 2-8, 08028 Barcelona",
        courts_count: 11,
        comarca: "Barcelona"
    },
    {
        name: "Club Tennis de la Salut",
        address: "Carrer de la Mare de Déu de la Salut, 75, 08024 Barcelona",
        courts_count: 9,
        comarca: "Barcelona"
    },
    {
        name: "Nova Icària Esports Club",
        address: "Avinguda d'Icària, 167, 08005 Barcelona",
        courts_count: 7,
        comarca: "Barcelona"
    },
    {
        name: "Vall Parc Esports",
        address: "Carrer de l'Arrabassada, 107, 08035 Barcelona",
        courts_count: 13,
        comarca: "Barcelona"
    },
    {
        name: "Real Club de Tenis Barcelona 1899",
        address: "Carrer de Bosch i Gimpera, 5, 08034 Barcelona",
        courts_count: 7,
        comarca: "Barcelona"
    },
    {
        name: "Club DIR Diagonal",
        address: "Carrer de Ganduxer, 25, 08021 Barcelona",
        courts_count: 6,
        comarca: "Barcelona"
    },
    {
        name: "CEM Olimpia",
        address: "Carrer de Perú, 215, 08020 Barcelona",
        courts_count: 8,
        comarca: "Barcelona"
    },
    {
        name: "Club Natació Barcelona",
        address: "Passeig de Joan de Borbó, 93, 08039 Barcelona",
        courts_count: 6,
        comarca: "Barcelona"
    },
    {
        name: "Aurial Padel Cornellá",
        address: "Carrer de Tirso de Molina, 32, 08940 Cornellà de Llobregat, Barcelona",
        courts_count: 14,
        comarca: "Baix Llobregat"
    },
    {
        name: "Village Padel Club Sant Feliu",
        address: "Carrer del Treball, 25, 08980 Sant Feliu de Llobregat, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Red Indoor Viladecans",
        address: "Carrer de la Ciència, 35, 08840 Viladecans, Barcelona",
        courts_count: 7,
        comarca: "Baix Llobregat"
    },
    {
        name: "Club Tennis Pàdel Torrelles",
        address: "Camí del Club, s/n, 08629 Torrelles de Llobregat, Barcelona",
        courts_count: 5,
        comarca: "Baix Llobregat"
    },
    {
        name: "Pàdel Club Molins",
        address: "Carrer de la Riera de Vallvidrera, 16, 08750 Molins de Rei, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Sánchez-Casal Academy",
        address: "Autovía de Castelldefels, km 12.5, 08820 El Prat de Llobregat, Barcelona",
        courts_count: 12,
        comarca: "Baix Llobregat"
    },
    {
        name: "Padel Cornellà Indoor",
        address: "Carrer del Progrés, 48, 08940 Cornellà de Llobregat, Barcelona",
        courts_count: 9,
        comarca: "Baix Llobregat"
    },
    {
        name: "Padel Indoor Gavà",
        address: "Carrer del Disseny, 21, 08850 Gavà, Barcelona",
        courts_count: 8,
        comarca: "Baix Llobregat"
    },
    {
        name: "Club Tenis Andrés Gimeno",
        address: "Carrer de de Castelldefels, 58, 08860 Castelldefels, Barcelona",
        courts_count: 11,
        comarca: "Baix Llobregat"
    }
];

// Helper to check and seed clubs if collection is empty
async function checkAndSeedClubs() {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection(PADEL_CLUBS_COLLECTION).limit(1).get();
        if (snapshot.empty) {
            console.log("📍 [AdminOpenMatches] padel_clubs collection is empty. Seeding 37 realistic venues...");
            const batch = window.db.batch();
            SEED_CLUBS.forEach((club) => {
                const docRef = window.db.collection(PADEL_CLUBS_COLLECTION).doc();
                batch.set(docRef, {
                    ...club,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            console.log("✅ [AdminOpenMatches] Successfully seeded 37 popular padel venues!");
        }
    } catch (e) {
        console.warn("⚠️ [AdminOpenMatches] Club seeding checked but skipped or failed:", e.message);
    }
}

// Global service helper to get venues/clubs in alphabetical order
window.loadOpenMatchesClubs = async function () {
    if (!window.db) return [];
    try {
        const snapshot = await window.db.collection(PADEL_CLUBS_COLLECTION).get();
        const clubs = [];
        snapshot.forEach(doc => {
            clubs.push({ id: doc.id, ...doc.data() });
        });
        clubs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        return clubs;
    } catch (err) {
        console.error("Error loading padel_clubs:", err);
        return [];
    }
};

// Global switcher function
window.setAdminOpenMatchesTab = function (tab) {
    window.AdminOpenMatchesTab = tab;
    window.AdminViews.open_matches_mgmt();
};

// 1. GESTOR DE PARTIDAS (Listado Principal Multi-Pestaña)
window.AdminViews.open_matches_mgmt = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Gestor de Partidas Abiertas';

    const updateStatus = (msg) => {
        content.innerHTML = `<div class="loading-container"><div class="loader"></div><p>${msg}</p></div>`;
    };

    updateStatus("🚀 Inicializando módulo...");

    try {
        if (!window.db) throw new Error("Firebase Firestore (window.db) no está inicializado");

        // 🛡️ Auto-seed venues if empty
        await checkAndSeedClubs();

        // Sub-navigation tabular styles
        const activeTab = window.AdminOpenMatchesTab;

        if (activeTab === 'partidas') {
            await renderPartidasTab(content);
        } else {
            await renderClubesTab(content);
        }

    } catch (e) {
        console.error("Error en Gestor de Partidas:", e);
        content.innerHTML = `<div class="error-box" style="padding:40px; text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ff4444; margin-bottom:20px;"></i>
            <h3 style="color:#ff4444;">Error de Carga</h3>
            <p style="color:#000; font-family:monospace; background:rgba(0,0,0,0.05); padding:10px; border-radius:8px;">${e.message}</p>
            <button onclick="loadAdminView('open_matches_mgmt')" style="margin-top:20px; padding:10px 20px; background:#fff; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer;">REINTENTAR</button>
        </div>`;
    }
};

// --- RENDER TAB 1: PARTIDAS ABIERTAS ---
async function renderPartidasTab(content) {
    const snapshot = await window.db.collection(OPEN_MATCHES_COLLECTION).get();
    const matches = [];
    snapshot.forEach(doc => {
        matches.push({ id: doc.id, ...doc.data() });
    });

    matches.sort((a, b) => {
        const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
        return dateB - dateA;
    });

    // Months dynamic list
    const availableMonths = [...new Set(matches.map(m => {
        if (!m.date) return null;
        if (m.date.includes('-')) return m.date.substring(0, 7);
        return null;
    }))].filter(Boolean).sort((a, b) => String(b).localeCompare(String(a)));

    const monthNames = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
    const monthOptions = availableMonths.map(m => {
        const [y, mm] = m.split('-');
        return `<option value="${m}">${(monthNames[mm] || mm).toUpperCase()} ${y}</option>`;
    }).join('');

    const listHtml = matches.map(match => renderOpenMatchCard(match)).join('');

    content.innerHTML = `
        <div class="planning-area" id="open-matches-planning-area" style="display: flex; flex-direction: column; height: calc(100vh - 140px);">
            
            <!-- SUB-TABS SELECTOR -->
            <div class="sub-tab-bar" style="display:flex; gap:8px; margin-bottom: 1.2rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">
                <button class="sub-tab-btn active" onclick="window.setAdminOpenMatchesTab('partidas')" style="background:none; border:none; padding:10px 20px; font-weight:900; font-size:0.85rem; cursor:pointer; color:#2E61FF; border-bottom: 3.5px solid #2E61FF; letter-spacing:0.5px;">🎾 PARTIDAS ABIERTAS</button>
                <button class="sub-tab-btn" onclick="window.setAdminOpenMatchesTab('clubes')" style="background:none; border:none; padding:10px 20px; font-weight:800; font-size:0.85rem; cursor:pointer; color:#64748B; border-bottom: 3.5px solid transparent; letter-spacing:0.5px;">📍 SEDES / CLUBES</button>
            </div>

            <!-- FILTER BAR -->
            <div class="filter-bar-pro" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.2rem; background: rgba(0,0,0,0.03); padding: 15px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); align-items: center;">
                <div style="position:relative; grid-column: span 2;">
                    <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:rgba(0,0,0,0.3); font-size:0.8rem;"></i>
                    <input type="text" id="open-match-search-input" placeholder="Buscar por club o jugador..."
                        style="padding-left:35px; height:45px; font-size:0.9rem; width:100%; border-radius:12px; background:#fff; border: 1px solid #cbd5e1; color: #000;">
                </div>
                <select id="open-match-filter-month" class="pro-input" style="height:45px; font-size: 0.8rem;">
                    <option value="all">MES: TODOS</option>
                    ${monthOptions}
                </select>
                <select id="open-match-filter-status" class="pro-input" style="height:45px; font-size: 0.8rem;">
                    <option value="all">ESTADO: TODOS</option>
                    <option value="active">🟢 ACTIVA</option>
                    <option value="finished">🏁 FINALIZADA</option>
                    <option value="cancelled">⛔ ANULADA</option>
                </select>
                <select id="open-match-filter-level" class="pro-input" style="height:45px; font-size: 0.8rem;">
                    <option value="all">NIVEL: TODOS</option>
                    <option value="low">Nivel < 3.0 (Iniciación)</option>
                    <option value="mid">Nivel 3.0 - 4.0 (Intermedio)</option>
                    <option value="high">Nivel > 4.0 (Avanzado)</option>
                </select>
                <div style="display:flex; gap: 8px;">
                    <button class="btn-outline-pro" onclick="document.getElementById('open-match-search-input').value=''; document.getElementById('open-match-filter-month').value='all'; document.getElementById('open-match-filter-status').value='all'; document.getElementById('open-match-filter-level').value='all'; loadAdminView('open_matches_mgmt')" style="flex:1; height:45px; font-size: 0.7rem; padding: 0;">
                        <i class="fas fa-eraser"></i> LIMPIAR
                    </button>
                    <button class="btn-outline-pro" onclick="loadAdminView('open_matches_mgmt')" style="width: 45px; height:45px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- SCROLLABLE LIST -->
            <div class="entreno-scroll-list" id="open-matches-list-container" style="overflow-y: auto; padding-right: 10px; flex: 1;">
                ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 5rem; color: var(--text-muted);"><i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i><br>No se encontraron partidas abiertas con los filtros actuales.</div>'}
            </div>
        </div>
    `;

    setupOpenMatchesFilters();
}

// --- RENDER TAB 2: GESTIONAR SEDES / CLUBES (Upgraded with Comarcas & Reset) ---
async function renderClubesTab(content) {
    const clubs = await window.loadOpenMatchesClubs();

    const listHtml = clubs.map(club => `
        <div class="glass-card-enterprise club-card-item" 
             data-comarca="${club.comarca || 'Barcelona'}"
             style="margin-bottom: 1rem; padding: 1.2rem; border-left: 6px solid #10B981; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: #000000;">
            
            <div style="display: flex; gap: 1.2rem; align-items: center; flex: 1; min-width: 0;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center; flex-shrink: 0; color:#10B981; font-size:1.1rem;">
                    <i class="fas fa-map-pin"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 950; font-size: 1.05rem; color: #0F172A; margin-bottom: 0.2rem; display:flex; align-items:center; gap:8px;">
                        <span>${club.name.toUpperCase()}</span>
                        <span style="background: rgba(46,97,255,0.08); color:#2E61FF; font-size: 0.62rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform:uppercase; letter-spacing:0.5px;">
                            ${club.comarca || 'Barcelona'}
                        </span>
                    </div>
                    <div style="font-size: 0.76rem; color: #475569; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-location-dot" style="color: #94A3B8;"></i> ${club.address || 'Sin dirección registrada'}
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 15px; flex-shrink: 0;">
                <!-- Pistas Badge -->
                <div style="background: rgba(0,0,0,0.04); border:1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 0.72rem; font-weight: 850; color: #0F172A; text-align: center; min-width:70px;">
                    <span style="display:block; font-size:0.95rem; font-weight:900; color:#10B981; line-height:1;">${club.courts_count || 0}</span>
                    pistas
                </div>

                <!-- Acciones -->
                <div style="display: flex; gap: 6px;">
                    <button class="btn-micro" 
                            style="background: #3B82F6 !important; color: #fff !important; border: none; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick='window.openEditSedeModal(${JSON.stringify(club).replace(/'/g, "&#39;")})' 
                            title="Editar Sede">
                        <i class="fas fa-pen" style="font-size: 0.85rem; color: #fff !important;"></i>
                    </button>
                    <button class="btn-micro" 
                            style="background: #EF4444 !important; color: #fff !important; border: none; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick="window.deleteSede('${club.id}')" 
                            title="Eliminar Sede">
                        <i class="fas fa-trash-alt" style="font-size: 0.85rem; color: #fff !important;"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="planning-area" id="clubes-planning-area" style="display: flex; flex-direction: column; height: calc(100vh - 140px);">
            
            <!-- SUB-TABS SELECTOR -->
            <div class="sub-tab-bar" style="display:flex; gap:8px; margin-bottom: 1.2rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; align-items:center; justify-content:space-between;">
                <div style="display:flex; gap:8px;">
                    <button class="sub-tab-btn" onclick="window.setAdminOpenMatchesTab('partidas')" style="background:none; border:none; padding:10px 20px; font-weight:800; font-size:0.85rem; cursor:pointer; color:#64748B; border-bottom: 3.5px solid transparent; letter-spacing:0.5px;">🎾 PARTIDAS ABIERTAS</button>
                    <button class="sub-tab-btn active" onclick="window.setAdminOpenMatchesTab('clubes')" style="background:none; border:none; padding:10px 20px; font-weight:900; font-size:0.85rem; cursor:pointer; color:#2E61FF; border-bottom: 3.5px solid #2E61FF; letter-spacing:0.5px;">📍 SEDES / CLUBES</button>
                </div>
                
                <!-- Reset/Restore default venues in 1 click -->
                <button onclick="window.resetPadelVenuesToDefault()" class="btn-micro" style="background: rgba(239,68,68,0.08) !important; color: #EF4444 !important; border: 1px solid rgba(239,68,68,0.2) !important; font-weight:900; padding:6px 12px !important; border-radius:10px !important; display:flex; align-items:center; gap:6px; font-size:0.68rem !important; cursor:pointer;" title="Reconstruir base de datos con los 37 clubes premium">
                    <i class="fas fa-rotate-left"></i> REGENERAR 37 SEDES PRO
                </button>
            </div>

            <!-- TAB ACTIONS / SEARCH HEADER (Upgraded filters & search) -->
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 1.2rem; align-items: center;">
                <div style="position:relative;">
                    <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:rgba(0,0,0,0.3); font-size:0.8rem;"></i>
                    <input type="text" id="club-search-input" oninput="window.filterAdminClubs()" placeholder="Buscar por nombre o dirección..."
                        style="padding-left:35px; height:45px; font-size:0.9rem; width:100%; border-radius:12px; background:#fff; border: 1px solid #cbd5e1; color: #000;">
                </div>
                <div>
                    <select id="club-filter-comarca" onchange="window.filterAdminClubs()" class="pro-input" style="height:45px; font-size: 0.8rem;">
                        <option value="all">🔍 COMARCA: TODAS</option>
                        <option value="Barcelona">BARCELONA CIUDAD</option>
                        <option value="Baix Llobregat">BAIX LLOBREGAT</option>
                    </select>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="window.openAddSedeModal()" class="btn-primary-pro" style="height: 45px; margin: 0; width:100%; background: #10B981; color: white !important; font-weight: 800; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:12px; border:none; cursor:pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.15); font-size:0.8rem;">
                        <i class="fas fa-plus-circle"></i> SEDE
                    </button>
                </div>
            </div>

            <!-- Total Results badge -->
            <div style="margin-bottom: 8px; display:flex; align-items:center;">
                <span id="clubs-counter" style="background:#2E61FF; color:white; font-size:0.7rem; font-weight:900; padding:4px 12px; border-radius:12px; letter-spacing:0.5px;">Mostrando ${clubs.length} sedes</span>
            </div>

            <!-- SCROLLABLE LIST -->
            <div class="entreno-scroll-list" id="clubes-list-container" style="overflow-y: auto; padding-right: 10px; flex: 1;">
                ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 5rem; color: var(--text-muted);"><i class="fas fa-map-location-dot" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i><br>No hay sedes registradas. Haz clic en "Sede" para empezar.</div>'}
            </div>
        </div>
    `;
}

// Upgraded multivariable filter (combines Text Search + Comarca Dropdown)
window.filterAdminClubs = function() {
    const queryInput = document.getElementById('club-search-input');
    const comarcaSelect = document.getElementById('club-filter-comarca');
    
    const q = queryInput ? queryInput.value.toLowerCase().trim() : '';
    const comarca = comarcaSelect ? comarcaSelect.value : 'all';

    const cards = document.querySelectorAll('#clubes-list-container > .club-card-item');
    let count = 0;
    
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const cardComarca = card.getAttribute('data-comarca') || 'Barcelona';

        const matchesSearch = !q || text.includes(q);
        const matchesComarca = comarca === 'all' || cardComarca === comarca;

        if (matchesSearch && matchesComarca) {
            card.style.display = 'flex';
            count++;
        } else {
            card.style.display = 'none';
        }
    });

    // Update counter label dynamically in hot-time
    const counterEl = document.getElementById('clubs-counter');
    if (counterEl) {
        counterEl.textContent = `Mostrando ${count} sedes`;
    }
};

// 2. CREAR PARTIDA (Formulario Dinámico con Buscador Predictivo)
window.AdminViews.open_matches_create = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Crear Nueva Partida Abierta';

    const updateStatusIndicator = (msg) => {
        content.innerHTML = `<div class="loading-container"><div class="loader"></div><p>${msg}</p></div>`;
    };

    updateStatusIndicator("📡 Cargando sedes dinámicas...");

    try {
        const clubs = await window.loadOpenMatchesClubs();

        content.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div class="glass-card-enterprise" style="padding: 2.5rem; background: #ffffff; border-radius: 24px; box-shadow: 0 8px 32px rgba(10,25,47,0.04); border: 1px solid rgba(15,23,42,0.08);">
                    <h3 style="color: #0F172A; margin-bottom: 2rem; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(15,23,42,0.08); padding-bottom: 12px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-plus-circle" style="font-size: 1.5rem; color: #2E61FF;"></i> Detalles de la Partida Abierta
                    </h3>
                    
                    <!-- Help Guide Card for New Users -->
                    <div style="background: rgba(204, 255, 0, 0.08); border: 1.5px solid rgba(204, 255, 0, 0.25); border-radius: 18px; padding: 16px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 24px;">
                        <i class="fas fa-lightbulb" style="color: #85a600; font-size: 1.25rem; margin-top: 2px; flex-shrink: 0;"></i>
                        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                            <span style="font-size: 0.75rem; color: #85a600; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">💡 Guía para nuevas partidas</span>
                            <span style="font-size: 0.75rem; color: #334155; font-weight: 600; line-height: 1.45;">
                                Rellena los detalles de la partida. Para inscribir jugadores, escribe sus nombres en la sección del roster. Las plazas libres se calcularán automáticamente.
                            </span>
                        </div>
                    </div>

                    <form id="create-open-match-form" class="pro-form" style="text-align: left;">
                        <!-- Autocomplete Club Search Box -->
                        <div class="form-group" style="margin-bottom: 1.5rem; position: relative;">
                            <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">📍 Club / Ubicación (Buscador Inteligente)</label>
                            <div style="position: relative; display: flex; align-items: center;">
                                <i class="fas fa-search" style="position: absolute; left: 16px; color: #2E61FF; font-size: 0.9rem; z-index: 10;"></i>
                                <input type="text" id="club-search-autocomplete" class="pro-input" style="padding-left: 46px !important; height: 50px; width: 100%; font-size: 0.85rem; font-weight: 800; border-radius: 12px;" placeholder="Escribe para buscar club..." autocomplete="off" required>
                                <input type="hidden" name="club" id="create-match-club-hidden-value">
                            </div>
                            
                            <!-- Suggestions Dropdown -->
                            <div id="create-club-suggestions" class="autocomplete-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; border: 1.5px solid rgba(15,23,42,0.08); border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 2000; max-height: 220px; overflow-y: auto; margin-top: 6px;"></div>
                            
                            <!-- Selected Club Info Badge -->
                            <div id="selected-club-badge" style="display: none; margin-top: 15px; padding: 16px; background: rgba(46,97,255,0.02); border: 1.5px solid #2E61FF; border-radius: 16px; color: #0F172A; flex-direction: column; gap: 8px; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.3s ease;"></div>
                        </div>

                        <!-- Date & Time -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 1.5rem;">
                            <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📅 Fecha del partido</label>
                                <input type="date" name="date" class="pro-input" required style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px;">
                            </div>
                            <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">⏰ Hora de inicio</label>
                                <input type="time" name="time" class="pro-input" value="19:00" required style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px;">
                            </div>
                        </div>

                        <!-- Duration & Levels Group -->
                        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 1.5rem;">
                            <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">⏱ Duración (Minutos)</label>
                                <select name="duration" class="pro-input" style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px; padding: 0 16px;">
                                    <option value="90">90 min</option>
                                    <option value="60">60 min</option>
                                    <option value="120">120 min</option>
                                </select>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                    <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📊 Nivel Mínimo</label>
                                    <select name="level_min" class="pro-input" style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px; padding: 0 16px;">
                                        ${window.generateAdminLevelOptionTags(3.0)}
                                    </select>
                                </div>
                                <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                    <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📈 Nivel Máximo</label>
                                    <select name="level_max" class="pro-input" style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px; padding: 0 16px;">
                                        ${window.generateAdminLevelOptionTags(3.5)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Playtomic Link -->
                        <div class="form-group" style="margin-bottom: 1.5rem; display:flex; flex-direction:column; gap:6px;">
                            <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">🔗 Enlace de Playtomic (Opcional)</label>
                            <input type="text" name="playtomic_url" class="pro-input" placeholder="https://playtomic.io/matches/..." style="font-size: 0.82rem; height: 50px; border-radius: 12px;">
                        </div>

                        <!-- Modalidad Parejas Fijas Checkbox -->
                        <div class="form-group" style="margin-bottom: 1.5rem; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="create-match-fixed-pair" name="is_fixed_pair" style="width:20px; height:20px; cursor:pointer;">
                            <label for="create-match-fixed-pair" style="font-size:0.85rem; font-weight:850; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; margin:0;">🏆 Modalidad: Parejas Fijas</label>
                        </div>

                        <!-- Creator Details -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 1.5rem;">
                            <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">👤 Nombre Organizador (Opcional)</label>
                                <input type="text" name="creator_name" id="admin-create-match-creator" class="pro-input" placeholder="Nombre..." style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px;" oninput="document.getElementById('create-match-player-1').value = this.value; window.updateAdminLiveSpotsBadge();">
                            </div>
                            <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📞 Teléfono Organizador (Opcional)</label>
                                <input type="tel" name="creator_phone" class="pro-input" placeholder="Ej: 600123456..." style="height: 50px; font-size: 0.85rem; font-weight: 800; border-radius: 12px;">
                            </div>
                        </div>

                        <!-- Players Roster Section -->
                        <div style="border-top: 1px solid rgba(15,23,42,0.06); padding-top: 15px; margin-bottom: 2rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <h4 style="font-weight: 850; font-size: 0.75rem; color: #64748B; text-transform: uppercase; margin: 0; letter-spacing:0.5px;">
                                    <i class="fas fa-users"></i> Jugadores Apuntados (Máx 4)
                                </h4>
                                <span id="admin-live-spots-needed-badge" style="background:#2E61FF; color:#ffffff; font-size:0.62rem; font-weight:900; padding:2px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">FALTAN 4 PLAZAS</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 1 (Creador)</span>
                                    <input type="text" name="player_1" id="create-match-player-1" class="pro-input" style="border-radius:10px; height:44px;" placeholder="Nombre..." oninput="window.updateAdminLiveSpotsBadge()">
                                </div>
                                <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 2</span>
                                    <input type="text" name="player_2" id="create-match-player-2" class="pro-input" style="border-radius:10px; height:44px;" placeholder="Nombre..." oninput="window.updateAdminLiveSpotsBadge()">
                                </div>
                                <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 3</span>
                                    <input type="text" name="player_3" id="create-match-player-3" class="pro-input" style="border-radius:10px; height:44px;" placeholder="Nombre..." oninput="window.updateAdminLiveSpotsBadge()">
                                </div>
                                <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 4</span>
                                    <input type="text" name="player_4" id="create-match-player-4" class="pro-input" style="border-radius:10px; height:44px;" placeholder="Nombre..." oninput="window.updateAdminLiveSpotsBadge()">
                                </div>
                            </div>
                        </div>

                        <input type="hidden" name="status" value="active">
                        
                        <div style="display: flex; gap: 15px; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(0,0,0,0.08);">
                            <button type="button" class="btn-outline-pro" onclick="window.loadAdminView('open_matches_mgmt')" style="flex: 1; height: 55px; font-weight: 700; color: #000; border-radius:12px;">
                                CANCELAR
                            </button>
                            <button type="submit" class="btn-primary-pro" style="flex: 2; height: 55px; font-weight: 900; font-size: 1.1rem; background: #2E61FF; color: white !important; box-shadow: 0 8px 25px rgba(46,97,255,0.25); border-radius:12px;">
                                PUBLICAR PARTIDA 🚀
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // 🌟 Autocomplete Predictivo logic
        const autInput = document.getElementById('club-search-autocomplete');
        const hidInput = document.getElementById('create-match-club-hidden-value');
        const sugBox = document.getElementById('create-club-suggestions');
        const bdgBox = document.getElementById('selected-club-badge');

        if (autInput && sugBox) {
            const showSuggestions = (q) => {
                const query = q.toLowerCase().trim();
                const filtered = clubs.filter(c => 
                    (c.name || '').toLowerCase().includes(query) || 
                    (c.address || '').toLowerCase().includes(query)
                );

                if (filtered.length === 0) {
                    sugBox.innerHTML = `
                        <div class="autocomplete-item select-custom-value" style="color: #2E61FF; font-weight: 800;">
                            ✍️ Usar valor manual: "${q}"
                        </div>
                    `;
                } else {
                    let itemsHtml = filtered.map(c => `
                        <div class="autocomplete-item select-club-item" data-name="${c.name}" data-comarca="${c.comarca || 'Barcelona'}" data-pistas="${c.courts_count || 0}" data-address="${c.address || ''}">
                            <span style="font-weight: 850; font-size: 0.85rem; color: #0f172a;">${c.name.toUpperCase()}</span>
                            <span style="font-size: 0.68rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                                <i class="fas fa-location-dot"></i> ${c.comarca || 'Barcelona'} • ${c.courts_count || 0} pistas
                            </span>
                        </div>
                    `).join('');
                    
                    if (query) {
                        itemsHtml += `
                            <div class="autocomplete-item select-custom-value" style="border-top: 1px solid #cbd5e1; color: #2E61FF; font-weight: 800;">
                                ✍️ Usar valor manual: "${q}"
                            </div>
                        `;
                    }
                    sugBox.innerHTML = itemsHtml;
                }
                sugBox.style.display = 'block';
            };

            autInput.addEventListener('focus', () => {
                showSuggestions(autInput.value);
            });

            autInput.addEventListener('input', () => {
                showSuggestions(autInput.value);
            });

            // Selection clicks
            sugBox.addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-item');
                if (!item) return;

                if (item.classList.contains('select-club-item')) {
                    const name = item.getAttribute('data-name');
                    const comarca = item.getAttribute('data-comarca');
                    const pistas = item.getAttribute('data-pistas');
                    const address = item.getAttribute('data-address') || '';

                    autInput.value = name;
                    hidInput.value = name;
                    
                    bdgBox.innerHTML = window.renderSelectedClubCardHtml(name, comarca, address, pistas);
                    bdgBox.style.display = 'flex';
                } else if (item.classList.contains('select-custom-value')) {
                    const customVal = autInput.value.trim();
                    hidInput.value = customVal;
                    bdgBox.innerHTML = window.renderSelectedClubCardHtml(customVal, '', '', 0);
                    bdgBox.style.display = 'flex';
                }

                sugBox.style.display = 'none';
            });

            // Close suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!autInput.contains(e.target) && !sugBox.contains(e.target)) {
                    sugBox.style.display = 'none';
                }
            });
        }

        // Initialize Live Spots Badge
        window.updateAdminLiveSpotsBadge();

        setupCreateOpenMatchFormUpgraded();

        // Bind Player Autocomplete
        window.bindAdminPlayerAutocomplete('create-open-match-form');

    } catch (e) {
        console.error(e);
        content.innerHTML = `<div class="error-box">Error loading form: ${e.message}</div>`;
    }
};

function setupCreateOpenMatchFormUpgraded() {
    const form = document.getElementById('create-open-match-form');
    if (!form) return;

    // Fill date picker
    const dateInput = form.querySelector('[name=date]');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        try {
            // Use autocomplete text value directly for club
            const autocompleteInput = document.getElementById('club-search-autocomplete');
            const finalClub = autocompleteInput ? autocompleteInput.value.trim() : (data.club || 'Somos Pádel BCN');

            if (!finalClub) throw new Error("Debe seleccionar o escribir un club.");
            if (!data.date) throw new Error("La fecha es obligatoria");

            // Process players
            const players = [];
            if (data.player_1 && data.player_1.trim()) players.push(data.player_1.trim());
            if (data.player_2 && data.player_2.trim()) players.push(data.player_2.trim());
            if (data.player_3 && data.player_3.trim()) players.push(data.player_3.trim());
            if (data.player_4 && data.player_4.trim()) players.push(data.player_4.trim());

            const spotsVal = Math.max(0, 4 - players.length);
            const isFixedPair = !!form.querySelector('[name=is_fixed_pair]')?.checked;

            // Build match payload
            const payload = {
                club: finalClub,
                date: data.date,
                time: data.time || '19:00',
                duration: parseInt(data.duration) || 90,
                level_min: parseFloat(data.level_min) || 3.0,
                level_max: parseFloat(data.level_max) || 3.5,
                players: players,
                spots_needed: spotsVal,
                playtomic_url: data.playtomic_url || '',
                is_fixed_pair: isFixedPair,
                status: 'active',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                creator_uid: "",
                creator_name: (data.creator_name || "").trim() || (players[0] || ""),
                creator_phone: (data.creator_phone || "").replace(/[^0-9]/g, "")
            };

            await window.db.collection(OPEN_MATCHES_COLLECTION).add(payload);

            if (window.NotificationService) {
                window.NotificationService.showToast("Partida Abierta publicada correctamente", "success");
            } else {
                alert("✅ Partida Abierta publicada");
            }

            // Return to matches list
            window.loadAdminView('open_matches_mgmt');

        } catch (err) {
            alert("Error al publicar la partida: " + err.message);
        }
    };
}

// Client filter
function setupOpenMatchesFilters() {
    const searchInput = document.getElementById('open-match-search-input');
    const monthSelect = document.getElementById('open-match-filter-month');
    const statusSelect = document.getElementById('open-match-filter-status');
    const levelSelect = document.getElementById('open-match-filter-level');

    const applyFilters = () => {
        const query = searchInput?.value.toLowerCase() || '';
        const month = monthSelect?.value || 'all';
        const status = statusSelect?.value || 'all';
        const levelRange = levelSelect?.value || 'all';

        const cards = document.querySelectorAll('#open-matches-list-container > .open-match-card-item');
        cards.forEach(card => {
            const cMonth = card.getAttribute('data-month');
            const cStatus = card.getAttribute('data-status');
            const cMin = parseFloat(card.getAttribute('data-level-min') || 1.0);
            const cMax = parseFloat(card.getAttribute('data-level-max') || 6.0);
            const cText = card.innerText.toLowerCase();

            const matchesSearch = !query || cText.includes(query);
            const matchesMonth = month === 'all' || cMonth === month;
            const matchesStatus = status === 'all' || cStatus === status;

            let matchesLevel = true;
            if (levelRange === 'low') {
                matchesLevel = cMin < 3.0;
            } else if (levelRange === 'mid') {
                matchesLevel = (cMin >= 3.0 && cMin <= 4.0) || (cMax >= 3.0 && cMax <= 4.0);
            } else if (levelRange === 'high') {
                matchesLevel = cMax > 4.0;
            }

            card.style.display = (matchesSearch && matchesMonth && matchesStatus && matchesLevel) ? 'flex' : 'none';
        });
    };

    if (searchInput) searchInput.oninput = applyFilters;
    if (monthSelect) monthSelect.onchange = applyFilters;
    if (statusSelect) statusSelect.onchange = applyFilters;
    if (levelSelect) levelSelect.onchange = applyFilters;
}

// --- GLOBAL EXPORTS FOR OPEN MATCHES GENERAL ACTIONS --- //

window.updateOpenMatchStatus = async (id, newStatus) => {
    try {
        if (!window.db) throw new Error("Base de datos no inicializada.");
        await window.db.collection(OPEN_MATCHES_COLLECTION).doc(id).update({ status: newStatus });

        if (window.NotificationService) {
            window.NotificationService.showToast("Estado de partida actualizado", "success");
        }
        window.loadAdminView('open_matches_mgmt');
    } catch (e) {
        alert("Error al actualizar estado: " + e.message);
    }
};

window.deleteOpenMatch = async (id) => {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar esta partida abierta permanentemente?")) return;
    try {
        if (!window.db) throw new Error("Base de datos no inicializada.");
        await window.db.collection(OPEN_MATCHES_COLLECTION).doc(id).delete();

        if (window.NotificationService) {
            window.NotificationService.showToast("Partida eliminada correctamente", "success");
        }
        window.loadAdminView('open_matches_mgmt');
    } catch (e) {
        alert("Error al eliminar partida: " + e.message);
    }
};

window.duplicateOpenMatch = async (m) => {
    if (!confirm(`¿Duplicar partida en "${m.club || 'Somos Pádel BCN'}"?`)) return;
    try {
        const copy = { ...m };
        delete copy.id;
        copy.status = 'active';
        copy.players = [];
        copy.spots_needed = 4; // Clear players list and spots
        copy.creator_uid = "";
        copy.creator_name = "";
        copy.creator_phone = "";

        // Add 7 days to date
        if (copy.date) {
            try {
                const d = new Date(copy.date);
                d.setDate(d.getDate() + 7);
                copy.date = d.toISOString().split('T')[0];
            } catch (err) {
                console.warn("Error incrementing date:", err);
            }
        }
        copy.created_at = firebase.firestore.FieldValue.serverTimestamp();

        if (!window.db) throw new Error("Base de datos no inicializada.");
        await window.db.collection(OPEN_MATCHES_COLLECTION).add(copy);

        if (window.NotificationService) {
            window.NotificationService.showToast("Partida duplicada para la próxima semana", "success");
        }
        window.loadAdminView('open_matches_mgmt');
    } catch (err) {
        alert("Error al duplicar partida: " + err.message);
    }
};

let adminPlayersCache = null;

async function loadAdminPlayersCache() {
    if (adminPlayersCache) return adminPlayersCache;
    adminPlayersCache = {};
    if (!window.db) return adminPlayersCache;
    try {
        const snap = await window.db.collection('players').get();
        snap.forEach(doc => {
            const data = doc.data();
            if (data.name) {
                adminPlayersCache[data.name.toLowerCase().trim()] = parseFloat(data.level || 3.0);
            }
        });
    } catch (err) {
        console.warn("Error loading admin players cache:", err);
    }
    return adminPlayersCache;
}

function formatShareDate(dateStr) {
    if (!dateStr) return '---';
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let formatted = d.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

window.launchWhatsAppShareOpenMatch = async (id) => {
    try {
        if (!window.db) throw new Error("Base de datos no inicializada.");
        const doc = await window.db.collection(OPEN_MATCHES_COLLECTION).doc(id).get();
        if (!doc.exists) throw new Error("Partida no encontrada.");

        const m = doc.data();
        const dateFormatted = formatShareDate(m.date);
        const playersList = m.players || [];
        const levelRange = `${parseFloat(m.level_min || 3.0).toFixed(2)} - ${parseFloat(m.level_max || 3.5).toFixed(2)}`;
        
        // Cargar caché de niveles de jugadores
        const cache = await loadAdminPlayersCache();

        let playersLines = [];
        for (let idx = 0; idx < 4; idx++) {
            if (idx < playersList.length) {
                const fullName = playersList[idx];
                const cleanName = fullName.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                
                // Intentar obtener nivel
                let levelVal = (parseFloat(m.level_min || 3.0) + (idx * 0.15)).toFixed(2);
                const parenthesizedMatch = fullName.match(/\((\d+(?:\.\d+)?)\)/);
                const parenthesizedLevel = parenthesizedMatch ? parseFloat(parenthesizedMatch[1]) : null;
                const cachedLevel = cache[cleanName.toLowerCase()];
                
                if (cachedLevel !== null && cachedLevel !== undefined) {
                    levelVal = cachedLevel.toFixed(2);
                } else if (parenthesizedLevel !== null) {
                    levelVal = parenthesizedLevel.toFixed(2);
                }
                
                playersLines.push(`✔️ ${cleanName} (${levelVal})`);
            } else {
                playersLines.push(`⏳ Slot Libre`);
            }
        }
        const playersText = playersLines.join('\n');

        const link = m.playtomic_url || `https://wa.me/34600000000?text=Hola,%20me%20gustaria%20apuntarme%20a%20la%20partida%20de%20padel%20del%20${encodeURIComponent(m.date)}`;

        const messageText = `🎾 *PARTIDO ABIERTO • SOMOSPADEL BCN* 🎾\n\n📍 *Club:* ${m.club || 'Somos Pádel BCN'}\n📅 *Fecha:* ${dateFormatted}\n⏰ *Hora:* ${m.time || '19:00'} (${m.duration || 90} min)\n📊 *Nivel Requerido:* ${levelRange}\n\n👥 *Jugadores apuntados:* \n${playersText}\n\n🔥 _¡Únete al partido y reserva tu plaza aquí!_ 👇\n${link}`;

        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');

    } catch (e) {
        alert("Error al compartir por WhatsApp: " + e.message);
    }
};

// --- DYNAMIC MODAL INJECTOR FOR EDITING MATCHES WITH DYNAMIC CLUBS --- //

window.openEditOpenMatchModal = async function (m) {
    let modal = document.getElementById('admin-open-match-modal');
    if (modal) modal.remove();

    // 1. Fetch dynamic clubs
    const clubs = await window.loadOpenMatchesClubs();

    modal = document.createElement('div');
    modal.id = 'admin-open-match-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;';

    const p = m.players || [];
    const p1 = p[0] || '';
    const p2 = p[1] || '';
    const p3 = p[2] || '';
    const p4 = p[3] || '';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; width: 95%; background:#ffffff; border-radius:16px; display:flex; flex-direction:column; overflow:hidden; max-height: 90vh;">
            <!-- Header -->
            <div style="padding: 20px 25px; border-bottom: 1px solid #cbd5e1; background: #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <i class="fas fa-edit" style="color: #2E61FF; font-size:1.2rem;"></i>
                    <h2 style="margin:0; font-size:1.15rem; font-weight:900; color:#0F172A;">EDITAR PARTIDA ABIERTA</h2>
                </div>
                <button onclick="window.closeOpenMatchModal()" style="background:transparent; border:none; font-size:1.8rem; cursor:pointer; color:#0f172a; line-height:1;">&times;</button>
            </div>

            <!-- Body -->
            <form id="edit-open-match-form" style="padding: 25px; overflow-y:auto; flex:1;" class="pro-form">
                <input type="hidden" name="id" value="${m.id}">

                <!-- Autocomplete Search Box -->
                <div class="form-group" style="margin-bottom: 15px; position: relative;">
                    <label>CLUB / UBICACIÓN (BUSCADOR INTELIGENTE)</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <i class="fas fa-search" style="position: absolute; left: 16px; color: #ccff00; font-size: 0.9rem; z-index: 10;"></i>
                        <input type="text" id="edit-club-search-autocomplete" class="pro-input" style="padding-left: 46px !important; height: 50px; width: 100%;" value="${m.club || ''}" placeholder="Escribe para buscar club..." autocomplete="off" required>
                        <input type="hidden" name="club" id="edit-match-club-hidden-value" value="${m.club || ''}">
                    </div>
                    
                    <!-- Suggestions Dropdown -->
                    <div id="edit-club-suggestions" class="autocomplete-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; border: 1.5px solid #000000; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 2000; max-height: 200px; overflow-y: auto; margin-top: 6px;"></div>
                    
                    <!-- Selected Club Info Badge -->
                    <div id="edit-selected-club-badge" style="display: none; margin-top: 15px; padding: 16px; background: #ffffff; border: 1.5px solid #10B981; border-radius: 16px; color: #0F172A; flex-direction: column; gap: 8px; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.3s ease;"></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label>FECHA</label>
                        <input type="date" name="date" class="pro-input" value="${m.date || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>HORA INICIO</label>
                        <input type="time" name="time" class="pro-input" value="${m.time || '19:00'}" required>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label>DURACIÓN (MINUTOS)</label>
                        <select name="duration" class="pro-input">
                            <option value="90" ${m.duration == 90 ? 'selected' : ''}>90 min</option>
                            <option value="60" ${m.duration == 60 ? 'selected' : ''}>60 min</option>
                            <option value="120" ${m.duration == 120 ? 'selected' : ''}>120 min</option>
                        </select>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; justify-content: flex-end;">
                        <!-- Manual spaces needed dropdown removed, calculated dynamically instead -->
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label>NIVEL MÍNIMO</label>
                        <select name="level_min" class="pro-input">
                            ${window.generateAdminLevelOptionTags(m.level_min || 3.0)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>NIVEL MÁXIMO</label>
                        <select name="level_max" class="pro-input">
                            ${window.generateAdminLevelOptionTags(m.level_max || 3.5)}
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label>URL ENLACE DE PLAYTOMIC</label>
                    <input type="text" name="playtomic_url" class="pro-input" value="${m.playtomic_url || ''}" placeholder="https://...">
                </div>

                <div class="form-group" style="margin-bottom: 15px; display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" id="edit-match-fixed-pair" name="is_fixed_pair" style="width:20px; height:20px; cursor:pointer;" ${m.is_fixed_pair ? 'checked' : ''}>
                    <label for="edit-match-fixed-pair" style="font-size:0.85rem; font-weight:850; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; margin:0;">🏆 Modalidad: Parejas Fijas</label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label>NOMBRE ORGANIZADOR (OPCIONAL)</label>
                        <input type="text" name="creator_name" class="pro-input" value="${m.creator_name || ''}" placeholder="Nombre del organizador...">
                    </div>
                    <div class="form-group">
                        <label>TELÉFONO ORGANIZADOR (OPCIONAL)</label>
                        <input type="tel" name="creator_phone" class="pro-input" value="${m.creator_phone || ''}" placeholder="Ej: 600123456...">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label>ESTADO DE LA PARTIDA</label>
                    <select name="status" class="pro-input" style="font-weight: 800;">
                        <option value="active" ${m.status === 'active' ? 'selected' : ''}>🟢 ACTIVA</option>
                        <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>🏆 COMPLETADA (CON RESULTADO)</option>
                        <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>🏁 FINALIZADA</option>
                        <option value="cancelled" ${m.status === 'cancelled' ? 'selected' : ''}>⛔ ANULADA</option>
                    </select>
                </div>

                <div style="border-top:1px solid #cbd5e1; padding-top:15px; margin-top:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h4 style="margin:0; font-weight:800; font-size:0.75rem; color:#475569;">JUGADORES APUNTADOS (MÁX 4)</h4>
                        <span id="admin-edit-live-spots-needed-badge" style="background:#2E61FF; color:#ffffff; font-size:0.62rem; font-weight:900; padding:2px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">FALTAN 4 PLAZAS</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div class="form-group">
                            <label>JUGADOR 1</label>
                            <input type="text" name="player_1" class="pro-input" value="${p1}" placeholder="Libre..." oninput="window.updateAdminLiveSpotsBadge()">
                        </div>
                        <div class="form-group">
                            <label>JUGADOR 2</label>
                            <input type="text" name="player_2" class="pro-input" value="${p2}" placeholder="Libre..." oninput="window.updateAdminLiveSpotsBadge()">
                        </div>
                        <div class="form-group">
                            <label>JUGADOR 3</label>
                            <input type="text" name="player_3" class="pro-input" value="${p3}" placeholder="Libre..." oninput="window.updateAdminLiveSpotsBadge()">
                        </div>
                        <div class="form-group">
                            <label>JUGADOR 4</label>
                            <input type="text" name="player_4" class="pro-input" value="${p4}" placeholder="Libre..." oninput="window.updateAdminLiveSpotsBadge()">
                        </div>
                    </div>
                </div>
            </form>

            <!-- Footer -->
            <div style="padding: 15px 25px; border-top:1px solid #cbd5e1; background:#f8fafc; display:flex; justify-content:flex-end; gap:12px;">
                <button type="button" onclick="window.closeOpenMatchModal()" class="btn-outline-pro" style="width:auto; padding:10px 20px; font-weight:700; color:#475569; background:transparent; border:1px solid #cbd5e1; border-radius:10px; cursor:pointer;">
                    CANCELAR
                </button>
                <button type="submit" form="edit-open-match-form" class="btn-primary-pro" style="width:auto; padding:0 30px; margin:0; font-weight:900; background:#2E61FF; color:#fff !important; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px rgba(46,97,255,0.2);">
                    GUARDAR CAMBIOS 💾
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Initialize the live spots badge dynamically based on initial player fields
    window.updateAdminLiveSpotsBadge();

    // Initial badge values using premium component card
    const bdgBox = document.getElementById('edit-selected-club-badge');
    const currentClubData = clubs.find(c => c.name === m.club);
    if (currentClubData && bdgBox) {
        bdgBox.innerHTML = window.renderSelectedClubCardHtml(
            currentClubData.name,
            currentClubData.comarca || 'Barcelona',
            currentClubData.address || '',
            currentClubData.courts_count || 0
        );
        bdgBox.style.display = 'flex';
    } else if (m.club && bdgBox) {
        bdgBox.innerHTML = window.renderSelectedClubCardHtml(m.club, '', '', 0);
        bdgBox.style.display = 'flex';
    }

    // 🌟 Autocomplete Predictivo logic
    const autInput = document.getElementById('edit-club-search-autocomplete');
    const hidInput = document.getElementById('edit-match-club-hidden-value');
    const sugBox = document.getElementById('edit-club-suggestions');

    if (autInput && sugBox) {
        const showSuggestions = (q) => {
            const query = q.toLowerCase().trim();
            const filtered = clubs.filter(c => 
                (c.name || '').toLowerCase().includes(query) || 
                (c.address || '').toLowerCase().includes(query)
            );

            if (filtered.length === 0) {
                sugBox.innerHTML = `
                    <div class="autocomplete-item select-custom-value" style="color: #2E61FF; font-weight: 800;">
                        ✍️ Usar valor manual: "${q}"
                    </div>
                `;
            } else {
                let itemsHtml = filtered.map(c => `
                    <div class="autocomplete-item select-club-item" data-name="${c.name}" data-comarca="${c.comarca || 'Barcelona'}" data-pistas="${c.courts_count || 0}" data-address="${c.address || ''}">
                        <span style="font-weight: 850; font-size: 0.85rem; color: #0f172a;">${c.name.toUpperCase()}</span>
                        <span style="font-size: 0.68rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-location-dot"></i> ${c.comarca || 'Barcelona'} • ${c.courts_count || 0} pistas
                        </span>
                    </div>
                `).join('');
                
                if (query) {
                    itemsHtml += `
                        <div class="autocomplete-item select-custom-value" style="border-top: 1px solid #cbd5e1; color: #2E61FF; font-weight: 800;">
                            ✍️ Usar valor manual: "${q}"
                        </div>
                    `;
                }
                sugBox.innerHTML = itemsHtml;
            }
            sugBox.style.display = 'block';
        };

        autInput.addEventListener('focus', () => {
            showSuggestions(autInput.value);
        });

        autInput.addEventListener('input', () => {
            showSuggestions(autInput.value);
        });

        // Selection clicks
        sugBox.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (!item) return;

            if (item.classList.contains('select-club-item')) {
                const name = item.getAttribute('data-name');
                const comarca = item.getAttribute('data-comarca');
                const pistas = item.getAttribute('data-pistas');
                const address = item.getAttribute('data-address') || '';

                autInput.value = name;
                hidInput.value = name;
                
                bdgBox.innerHTML = window.renderSelectedClubCardHtml(name, comarca, address, pistas);
                bdgBox.style.display = 'flex';
            } else if (item.classList.contains('select-custom-value')) {
                const customVal = autInput.value.trim();
                hidInput.value = customVal;
                bdgBox.innerHTML = window.renderSelectedClubCardHtml(customVal, '', '', 0);
                bdgBox.style.display = 'flex';
            }

            sugBox.style.display = 'none';
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!autInput.contains(e.target) && !sugBox.contains(e.target)) {
                sugBox.style.display = 'none';
            }
        });
    }

    // Submit handler
    const form = document.getElementById('edit-open-match-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        const id = data.id;

        try {
            const finalClub = hidInput.value.trim() || autInput.value.trim();
            if (!finalClub) throw new Error("Debe seleccionar o escribir un club.");

            const players = [];
            if (data.player_1 && data.player_1.trim()) players.push(data.player_1.trim());
            if (data.player_2 && data.player_2.trim()) players.push(data.player_2.trim());
            if (data.player_3 && data.player_3.trim()) players.push(data.player_3.trim());
            if (data.player_4 && data.player_4.trim()) players.push(data.player_4.trim());

            const isFixedPair = !!form.querySelector('[name=is_fixed_pair]')?.checked;

            const updatedData = {
                club: finalClub,
                date: data.date,
                time: data.time || '19:00',
                duration: parseInt(data.duration) || 90,
                level_min: parseFloat(data.level_min) || 3.0,
                level_max: parseFloat(data.level_max) || 3.5,
                players: players,
                spots_needed: Math.max(0, 4 - players.length),
                playtomic_url: data.playtomic_url || '',
                is_fixed_pair: isFixedPair,
                status: data.status || 'active',
                creator_name: (data.creator_name || "").trim(),
                creator_phone: (data.creator_phone || "").replace(/[^0-9]/g, "")
            };

            await window.db.collection(OPEN_MATCHES_COLLECTION).doc(id).update(updatedData);

            if (window.NotificationService) {
                window.NotificationService.showToast("Cambios guardados correctamente", "success");
            } else {
                alert("✅ Guardado");
            }

            window.closeOpenMatchModal();
            window.loadAdminView('open_matches_mgmt'); // Refresh list

        } catch (err) {
            alert("Error al guardar cambios: " + err.message);
        }
    };

    // Bind Player Autocomplete
    window.bindAdminPlayerAutocomplete('edit-open-match-form');
};

window.closeOpenMatchModal = function () {
    const modal = document.getElementById('admin-open-match-modal');
    if (modal) modal.remove();
};

function renderOpenMatchCard(m) {
    const playersList = m.players || [];
    const spotsNeeded = parseInt(m.spots_needed) !== undefined ? parseInt(m.spots_needed) : (4 - playersList.length);
    const totalPlayers = playersList.length;

    const isCancelled = m.status === 'cancelled';
    const isFinished = m.status === 'finished' || m.status === 'completed';
    const statusLabel = m.status === 'completed' ? 'COMPLETADA' : (m.status === 'finished' ? 'FINALIZADA' : (isCancelled ? 'ANULADA' : 'ACTIVA'));
    const statusColor = m.status === 'completed' ? '#10B981' : (m.status === 'finished' ? '#8b5cf6' : (isCancelled ? '#F43F5E' : '#2E61FF'));

    // Month tracking
    let month = '';
    if (m.date) {
        if (m.date.includes('-')) month = m.date.substring(0, 7);
        else if (m.date.includes('/')) {
            const p = m.date.split('/');
            month = `${p[2]}-${p[1].padStart(2, '0')}`;
        }
    }

    // Players list as bullet tags
    const playersBadges = playersList.map(name => `
        <span style="background: rgba(46,97,255,0.08); color:#2E61FF; font-size: 0.72rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; border: 1.5px solid rgba(46,97,255,0.15); display: inline-flex; align-items: center; gap: 4px;">
            <i class="fas fa-circle-user" style="font-size:0.75rem;"></i> ${name}
        </span>
    `).join(' ') || `<span style="color:#64748b; font-size:0.75rem; font-style:italic;">Sin jugadores apuntados</span>`;

    // Format sets result
    let resultHtml = '';
    if (m.result) {
        const sets = [];
        if (m.result.set1) sets.push(`${m.result.set1.a}-${m.result.set1.b}`);
        if (m.result.set2) sets.push(`${m.result.set2.a}-${m.result.set2.b}`);
        if (m.result.set3) {
            const s3a = parseInt(m.result.set3.a);
            const s3b = parseInt(m.result.set3.b);
            if (!isNaN(s3a) && !isNaN(s3b) && (s3a !== 0 || s3b !== 0)) {
                sets.push(`${s3a}-${s3b}`);
            }
        }
        if (sets.length > 0) {
            resultHtml = `
                <div style="margin-top: 8px; font-size: 0.72rem; font-weight: 900; color: #10B981; display: flex; align-items: center; gap: 6px; width: 100%;">
                    <i class="fas fa-trophy"></i> Marcador: <span style="background: rgba(16, 185, 129, 0.08); padding: 2px 8px; border-radius: 6px; border: 1.5px solid rgba(16, 185, 129, 0.15);">${sets.join(', ')}</span>
                </div>
            `;
        }
    }

    return `
        <div class="glass-card-enterprise open-match-card-item" 
             data-month="${month}" 
             data-status="${m.status || 'active'}" 
             data-level-min="${m.level_min || 1.0}"
             data-level-max="${m.level_max || 6.0}"
             style="margin-bottom: 1.2rem; display: flex; flex-direction: column; padding: 1.2rem; border-left: 6px solid ${statusColor}; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border-radius: 12px; gap: 1rem; color: #000000;">
            
            <div style="display: flex; gap: 1.2rem; align-items: flex-start;">
                <!-- Mini Court Court Graphics -->
                <div class="court-graphic-preview" style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #2E61FF 0%, #1D4ED8 100%); display:flex; align-items:center; justify-content:center; flex-shrink: 0; color:#fff; position: relative; font-size:1.2rem;">
                    <i class="fas fa-table-tennis-paddle-ball"></i>
                </div>
                <div class="entreno-info-pro" style="flex: 1; min-width: 0;">
                    <div style="font-weight: 950; font-size: 1.05rem; color: #0F172A; margin-bottom: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                        ${(m.club || 'Somos Pádel BCN').toUpperCase()}
                    </div>
                    <div style="display: flex; gap: 0.8rem; font-size: 0.75rem; color: #333333; flex-wrap: wrap; align-items: center; margin-bottom: 0.6rem;">
                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-calendar-alt" style="color: #60A5FA;"></i> <span style="color:#333; font-weight: 600;">${formatOpenMatchDate(m.date)}</span></span>
                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-clock" style="color: #A78BFA;"></i> <span style="color:#333; font-weight: 600;">${m.time || '19:00'} (${m.duration || 90}m)</span></span>
                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-chart-line" style="color: #FBBF24;"></i> <span style="color:#333; font-weight: 800;">${parseFloat(m.level_min || 3.0).toFixed(2)} - ${parseFloat(m.level_max || 3.5).toFixed(2)}</span></span>
                         <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-user-group" style="color: #10B981;"></i> <span style="color:#000; font-weight: 900;">${totalPlayers}</span><span style="opacity:0.5;">/4</span> <span style="color:#64748b; font-size:0.7rem; font-weight:600;">(${spotsNeeded} plazas libres)</span></span>
                         ${m.is_fixed_pair ? '<span style="display: inline-flex; align-items: center; gap: 5px; color:#2E61FF; font-weight:800;"><i class="fas fa-people-arrows"></i> Parejas Fijas</span>' : ''}
                    </div>
                    
                    <!-- Players Badges inside match card -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                        ${playersBadges}
                    </div>
                    ${resultHtml}
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 0.5rem; border-top: 1px solid rgba(0,0,0,0.04);">
                <!-- Status Selector -->
                <div style="position: relative; flex: 1; min-width: 120px;">
                    <select onchange="window.updateOpenMatchStatus('${m.id}', this.value)" 
                            style="
                                width: 100%;
                                appearance: none; 
                                background: ${statusColor}15; 
                                color: #000000 !important; 
                                -webkit-text-fill-color: #000000 !important;
                                border: 2px solid ${statusColor}; 
                                padding: 8px 12px; 
                                border-radius: 8px; 
                                font-weight: 800; 
                                font-size: 0.7rem; 
                                cursor: pointer; 
                                text-transform: uppercase;
                                outline: none;
                            ">
                        <option value="active" ${m.status === 'active' ? 'selected' : ''}>🟢 ACTIVA</option>
                        <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>🏆 COMPLETADA (CON RESULTADO)</option>
                        <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>🏁 FINALIZADA</option>
                        <option value="cancelled" ${m.status === 'cancelled' ? 'selected' : ''}>⛔ ANULADA</option>
                    </select>
                </div>

                <!-- Action Group -->
                <div style="display: flex; gap: 8px; flex-shrink: 0; justify-content: flex-end; flex: 1;">
                    <button class="btn-micro" 
                            style="background: #25D366 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick="window.launchWhatsAppShareOpenMatch('${m.id}')"
                            title="WhatsApp">
                        <i class="fab fa-whatsapp" style="font-size: 1.1rem; color: #fff !important;"></i>
                    </button>
                    
                    <button class="btn-micro" 
                            style="background: #475569 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick='window.duplicateOpenMatch(${JSON.stringify(m).replace(/'/g, "&#39;")})' 
                            title="Duplicar">
                        <i class="fas fa-clone" style="font-size: 0.9rem; color: #fff !important;"></i>
                    </button>
                    
                    <button class="btn-micro" 
                            style="background: #3B82F6 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick='window.openEditOpenMatchModal(${JSON.stringify(m).replace(/'/g, "&#39;")})' 
                            title="Editar">
                        <i class="fas fa-pen" style="font-size: 0.9rem; color: #fff !important;"></i>
                    </button>
                    
                    <button class="btn-micro" 
                            style="background: #EF4444 !important; color: #fff !important; border: none; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px;" 
                            onclick="window.deleteOpenMatch('${m.id}')" 
                            title="Eliminar">
                        <i class="fas fa-trash-alt" style="font-size: 0.9rem; color: #fff !important;"></i>
                    </button>
                </div>
            </div>
        </div>`;
}

function formatOpenMatchDate(dateStr) {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// --- Dynamic modal setup for Sedes/Clubes ABM actions ---

window.openAddSedeModal = function () {
    let modal = document.getElementById('admin-venue-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'admin-venue-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; width: 95%; background:#ffffff; border-radius:16px; display:flex; flex-direction:column; overflow:hidden;">
            <!-- Header -->
            <div style="padding: 18px 22px; border-bottom: 1px solid #cbd5e1; background: #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <i class="fas fa-plus-circle" style="color: #10B981; font-size:1.1rem;"></i>
                    <h2 style="margin:0; font-size:1.05rem; font-weight:900; color:#0F172A;">AÑADIR CLUB / SEDE</h2>
                </div>
                <button onclick="window.closeVenueModal()" style="background:transparent; border:none; font-size:1.8rem; cursor:pointer; color:#0f172a; line-height:1;">&times;</button>
            </div>

            <!-- Body -->
            <form id="add-venue-form" style="padding: 22px;" class="pro-form">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>NOMBRE DE LA SEDE</label>
                    <input type="text" name="name" class="pro-input" placeholder="Ej: Club Pádel Cornellá" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>DIRECCIÓN COMPLETA</label>
                    <input type="text" name="address" class="pro-input" placeholder="Ej: Carrer de la Riera 12, Hospitalet" required>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label>NÚMERO DE PISTAS</label>
                        <input type="number" name="courts_count" class="pro-input" value="8" min="1" max="100" required>
                    </div>
                    <div class="form-group">
                        <label>COMARCA</label>
                        <select name="comarca" class="pro-input">
                            <option value="Baix Llobregat" selected>Baix Llobregat</option>
                            <option value="Barcelona">Barcelona</option>
                        </select>
                    </div>
                </div>
            </form>

            <!-- Footer -->
            <div style="padding: 15px 22px; border-top:1px solid #cbd5e1; background:#f8fafc; display:flex; justify-content:flex-end; gap:12px;">
                <button type="button" onclick="window.closeVenueModal()" class="btn-outline-pro" style="width:auto; padding:10px 20px; font-weight:700; color:#475569; background:transparent; border:1px solid #cbd5e1; border-radius:10px; cursor:pointer;">
                    CANCELAR
                </button>
                <button type="submit" form="add-venue-form" class="btn-primary-pro" style="width:auto; padding:0 25px; margin:0; font-weight:900; background:#10B981; color:#fff !important; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.2);">
                    GUARDAR SEDE 💾
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const form = document.getElementById('add-venue-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        try {
            await window.db.collection(PADEL_CLUBS_COLLECTION).add({
                name: data.name.trim(),
                address: data.address.trim(),
                courts_count: parseInt(data.courts_count) || 8,
                comarca: data.comarca,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (window.NotificationService) {
                window.NotificationService.showToast("Nueva sede registrada con éxito", "success");
            }

            window.closeVenueModal();
            window.loadAdminView('open_matches_mgmt'); // Refresh list

        } catch (err) {
            alert("Error al guardar sede: " + err.message);
        }
    };
};

window.openEditSedeModal = function (club) {
    let modal = document.getElementById('admin-venue-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'admin-venue-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; width: 95%; background:#ffffff; border-radius:16px; display:flex; flex-direction:column; overflow:hidden;">
            <!-- Header -->
            <div style="padding: 18px 22px; border-bottom: 1px solid #cbd5e1; background: #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <i class="fas fa-edit" style="color: #3B82F6; font-size:1.1rem;"></i>
                    <h2 style="margin:0; font-size:1.05rem; font-weight:900; color:#0F172A;">EDITAR CLUB / SEDE</h2>
                </div>
                <button onclick="window.closeVenueModal()" style="background:transparent; border:none; font-size:1.8rem; cursor:pointer; color:#0f172a; line-height:1;">&times;</button>
            </div>

            <!-- Body -->
            <form id="edit-venue-form" style="padding: 22px;" class="pro-form">
                <input type="hidden" name="id" value="${club.id}">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>NOMBRE DE LA SEDE</label>
                    <input type="text" name="name" class="pro-input" value="${club.name || ''}" placeholder="Ej: Club Pádel Cornellá" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>DIRECCIÓN COMPLETA</label>
                    <input type="text" name="address" class="pro-input" value="${club.address || ''}" placeholder="Ej: Carrer de la Riera 12, Hospitalet" required>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label>NÚMERO DE PISTAS</label>
                        <input type="number" name="courts_count" class="pro-input" value="${club.courts_count || 8}" min="1" max="100" required>
                    </div>
                    <div class="form-group">
                        <label>COMARCA</label>
                        <select name="comarca" class="pro-input">
                            <option value="Baix Llobregat" ${club.comarca === 'Baix Llobregat' ? 'selected' : ''}>Baix Llobregat</option>
                            <option value="Barcelona" ${club.comarca === 'Barcelona' ? 'selected' : ''}>Barcelona</option>
                        </select>
                    </div>
                </div>
            </form>

            <!-- Footer -->
            <div style="padding: 15px 22px; border-top:1px solid #cbd5e1; background:#f8fafc; display:flex; justify-content:flex-end; gap:12px;">
                <button type="button" onclick="window.closeVenueModal()" class="btn-outline-pro" style="width:auto; padding:10px 20px; font-weight:700; color:#475569; background:transparent; border:1px solid #cbd5e1; border-radius:10px; cursor:pointer;">
                    CANCELAR
                </button>
                <button type="submit" form="edit-venue-form" class="btn-primary-pro" style="width:auto; padding:0 25px; margin:0; font-weight:900; background:#3B82F6; color:#fff !important; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px rgba(59,130,246,0.2);">
                    GUARDAR CAMBIOS 💾
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const form = document.getElementById('edit-venue-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        const id = data.id;

        try {
            await window.db.collection(PADEL_CLUBS_COLLECTION).doc(id).update({
                name: data.name.trim(),
                address: data.address.trim(),
                courts_count: parseInt(data.courts_count) || 8,
                comarca: data.comarca
            });

            if (window.NotificationService) {
                window.NotificationService.showToast("Datos de sede actualizados correctamente", "success");
            }

            window.closeVenueModal();
            window.loadAdminView('open_matches_mgmt'); // Refresh list

        } catch (err) {
            alert("Error al guardar cambios de sede: " + err.message);
        }
    };
};

window.closeVenueModal = function () {
    const modal = document.getElementById('admin-venue-modal');
    if (modal) modal.remove();
};

window.deleteSede = async (id) => {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar esta sede/club permanentemente?")) return;
    try {
        await window.db.collection(PADEL_CLUBS_COLLECTION).doc(id).delete();
        if (window.NotificationService) {
            window.NotificationService.showToast("Sede eliminada correctamente", "success");
        }
        window.loadAdminView('open_matches_mgmt');
    } catch (e) {
        alert("Error al eliminar la sede: " + e.message);
    }
};

// Unified Force 1-click restore function for database seeding
window.resetPadelVenuesToDefault = async () => {
    if (!confirm("⚠️ ¿ATENCIÓN! ¿Seguro que quieres borrar todas las sedes actuales y restablecer los 37 clubes premium por defecto de Barcelona y Baix Llobregat? Se perderá cualquier club creado manualmente.")) return;
    try {
        if (!window.db) throw new Error("Base de datos no inicializada.");
        
        // Loader indicator while batch processing
        const content = document.getElementById('content-area');
        content.innerHTML = `<div class="loading-container"><div class="loader"></div><p>Eliminando sedes antiguas en lote...</p></div>`;

        // 1. Fetch current clubs to delete
        const snapshot = await window.db.collection(PADEL_CLUBS_COLLECTION).get();
        const batch = window.db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        content.innerHTML = `<div class="loading-container"><div class="loader"></div><p>Sembrando 37 clubes premium en lote...</p></div>`;

        // 2. Seed 37 default clubs in Firestore
        const seedBatch = window.db.batch();
        SEED_CLUBS.forEach(club => {
            const docRef = window.db.collection(PADEL_CLUBS_COLLECTION).doc();
            seedBatch.set(docRef, {
                ...club,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await seedBatch.commit();

        if (window.NotificationService) {
            window.NotificationService.showToast("¡Sedes restablecidas con 37 clubes premium!", "success");
        } else {
            alert("✅ Sedes restablecidas con éxito.");
        }
        
        // Reload Tab View
        window.loadAdminView('open_matches_mgmt');
    } catch (err) {
        alert("Error al restablecer sedes: " + err.message);
        window.loadAdminView('open_matches_mgmt');
    }
};

// --- VIEW 3: RESULTADOS DE PARTIDAS ABIERTAS ---
window.AdminViews.open_matches_results = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Resultados de Partidas Abiertas';
    content.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Cargando resultados de partidas...</p></div>';

    try {
        if (!window.db) throw new Error("Firebase Firestore no está inicializado");

        if (window.AdminOpenMatchesResultsUnsubscribe) {
            window.AdminOpenMatchesResultsUnsubscribe();
        }

        window.AdminOpenMatchesResultsUnsubscribe = window.db.collection(OPEN_MATCHES_COLLECTION)
            .onSnapshot(snapshot => {
                const matches = [];
                snapshot.forEach(doc => {
                    matches.push({ id: doc.id, ...doc.data() });
                });

                matches.sort((a, b) => {
                    const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
                    const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
                    return dateB - dateA;
                });

                renderResultsList(content, matches);
            }, err => {
                console.error("Error in real-time results listener:", err);
                content.innerHTML = `<div class="error-box">Error al cargar datos en tiempo real: ${err.message}</div>`;
            });

    } catch (e) {
        console.error("Error loading results view:", e);
        content.innerHTML = `<div class="error-box">Error: ${e.message}</div>`;
    }
};

function renderResultsList(container, matches) {
    const listHtml = matches.map(m => {
        const playersList = m.players || [];
        const p1 = playersList[0] || 'Libre';
        const p2 = playersList[1] || 'Libre';
        const p3 = playersList[2] || 'Libre';
        const p4 = playersList[3] || 'Libre';

        const isCompleted = m.status === 'completed';
        const statusLabel = isCompleted ? 'COMPLETADA' : (m.status === 'finished' ? 'FINALIZADA' : (m.status === 'cancelled' ? 'ANULADA' : 'ACTIVA'));
        const statusColor = isCompleted ? '#10B981' : (m.status === 'finished' ? '#8b5cf6' : (m.status === 'cancelled' ? '#EF4444' : '#2E61FF'));

        // Get sets scores
        const res = m.result || {};
        const s1a = res.set1 ? (res.set1.a !== undefined ? res.set1.a : 0) : 0;
        const s1b = res.set1 ? (res.set1.b !== undefined ? res.set1.b : 0) : 0;
        const s2a = res.set2 ? (res.set2.a !== undefined ? res.set2.a : 0) : 0;
        const s2b = res.set2 ? (res.set2.b !== undefined ? res.set2.b : 0) : 0;
        const s3a = res.set3 ? (res.set3.a !== undefined ? res.set3.a : 0) : 0;
        const s3b = res.set3 ? (res.set3.b !== undefined ? res.set3.b : 0) : 0;

        return `
            <div class="glass-card-enterprise" style="padding: 20px; border-radius: 16px; background: #ffffff; border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; color:#000;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-map-marker-alt" style="color: #2E61FF; font-size: 0.9rem;"></i>
                        <span style="font-weight: 850; font-size: 0.8rem; color: #0F172A; text-transform: uppercase;">${(m.club || 'Somos Pádel BCN').toUpperCase()}</span>
                        ${m.is_fixed_pair ? '<span style="background: rgba(46,97,255,0.08); color: #2E61FF; font-size: 0.62rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; margin-left:6px; text-transform: uppercase;">Parejas Fijas</span>' : ''}
                    </div>
                    <span style="font-size: 0.68rem; font-weight: 900; color: #64748B;">
                        ${formatOpenMatchDate(m.date)} • ${m.time || '19:00'}
                    </span>
                </div>

                <!-- Teams -->
                <div style="display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid rgba(0,0,0,0.03); padding-bottom: 12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size: 0.85rem; font-weight: 850; color: #0F172A; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-user-friends" style="color:#2E61FF; font-size:0.75rem;"></i> ${p1} / ${p2}
                        </span>
                        <span style="font-size: 0.62rem; color: #64748B; font-weight: 850; text-transform: uppercase; letter-spacing: 0.5px;">PAREJA 1</span>
                    </div>
                    <div style="font-size: 0.65rem; font-weight: 900; color: #94a3b8; text-align: left; padding-left: 18px; margin: -4px 0;">vs</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size: 0.85rem; font-weight: 850; color: #0F172A; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-user-friends" style="color:#2E61FF; font-size:0.75rem;"></i> ${p3} / ${p4}
                        </span>
                        <span style="font-size: 0.62rem; color: #64748B; font-weight: 850; text-transform: uppercase; letter-spacing: 0.5px;">PAREJA 2</span>
                    </div>
                </div>

                <!-- Score input panel -->
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <span style="font-size: 0.68rem; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">INTRODUCIR RESULTADO</span>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <!-- Set 1 Card -->
                        <div style="background: #f8fafc; border: 1px solid rgba(15,23,42,0.05); padding: 10px; border-radius: 12px; display:flex; flex-direction:column; gap:8px;">
                            <span style="font-size: 0.65rem; font-weight: 900; color: #0F172A; border-bottom:1px solid #e2e8f0; padding-bottom:4px; text-transform:uppercase;">SET 1</span>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 1, 'a', -1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                                    <span style="font-weight:950; font-size:1.05rem; font-family:monospace; min-width:14px; text-align:center;">${s1a}</span>
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 1, 'a', 1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                                </div>
                                <span style="font-size:0.7rem; color:#94a3b8; font-weight:800;">-</span>
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 1, 'b', -1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                                    <span style="font-weight:950; font-size:1.05rem; font-family:monospace; min-width:14px; text-align:center;">${s1b}</span>
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 1, 'b', 1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>

                        <!-- Set 2 Card -->
                        <div style="background: #f8fafc; border: 1px solid rgba(15,23,42,0.05); padding: 10px; border-radius: 12px; display:flex; flex-direction:column; gap:8px;">
                            <span style="font-size: 0.65rem; font-weight: 900; color: #0F172A; border-bottom:1px solid #e2e8f0; padding-bottom:4px; text-transform:uppercase;">SET 2</span>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 2, 'a', -1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                                    <span style="font-weight:950; font-size:1.05rem; font-family:monospace; min-width:14px; text-align:center;">${s2a}</span>
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 2, 'a', 1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                                </div>
                                <span style="font-size:0.7rem; color:#94a3b8; font-weight:800;">-</span>
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 2, 'b', -1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                                    <span style="font-weight:950; font-size:1.05rem; font-family:monospace; min-width:14px; text-align:center;">${s2b}</span>
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 2, 'b', 1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>

                        <!-- Set 3 Card -->
                        <div style="background: #f8fafc; border: 1px solid rgba(15,23,42,0.05); padding: 10px; border-radius: 12px; display:flex; flex-direction:column; gap:8px;">
                            <span style="font-size: 0.65rem; font-weight: 900; color: #0F172A; border-bottom:1px solid #e2e8f0; padding-bottom:4px; text-transform:uppercase;">SET 3</span>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 3, 'a', -1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                                    <span style="font-weight:950; font-size:1.05rem; font-family:monospace; min-width:14px; text-align:center;">${s3a}</span>
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 3, 'a', 1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                                </div>
                                <span style="font-size:0.7rem; color:#94a3b8; font-weight:800;">-</span>
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 3, 'b', -1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                                    <span style="font-weight:950; font-size:1.05rem; font-family:monospace; min-width:14px; text-align:center;">${s3b}</span>
                                    <button onclick="window.adjustOpenMatchSetScore('${m.id}', 3, 'b', 1)" class="btn-micro" style="width:24px; height:24px; border-radius:50%; border:1px solid #cbd5e1; background:#fff; font-size:0.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.04);">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; display: inline-block;"></span>
                        <span style="font-size: 0.72rem; font-weight: 900; color: #0F172A; text-transform: uppercase;">${statusLabel}</span>
                    </div>

                    <div style="display:flex; gap:8px;">
                        <button onclick="window.markOpenMatchCompleted('${m.id}')" class="btn-outline-pro" style="padding: 6px 12px; font-size: 0.65rem; border-radius:8px; font-weight: 800; cursor:pointer; background: ${isCompleted ? '#10B98115' : 'transparent'}; border-color: ${isCompleted ? '#10B981' : '#cbd5e1'}; color: ${isCompleted ? '#10B981' : '#475569'};">
                            ${isCompleted ? '✓ COMPLETADA' : '🏆 COMPLETAR'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="planning-area" style="max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; height: calc(100vh - 140px);">
            <!-- Help Guide Card -->
            <div style="background: rgba(46,97,255,0.04); border: 1.5px solid rgba(46,97,255,0.1); border-radius: 18px; padding: 16px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px;">
                <i class="fas fa-info-circle" style="color: #2E61FF; font-size: 1.25rem; margin-top: 2px; flex-shrink: 0;"></i>
                <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                    <span style="font-size: 0.75rem; color: #2E61FF; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">🏆 Panel de Control de Marcadores</span>
                    <span style="font-size: 0.75rem; color: #334155; font-weight: 600; line-height: 1.45;">
                        Introduce los resultados de los sets para las partidas abiertas. Los cambios se guardan y sincronizan automáticamente en tiempo real con la app de los jugadores.
                    </span>
                </div>
            </div>

            <!-- Matches List -->
            <div style="flex: 1; overflow-y: auto; padding-right: 6px;">
                ${listHtml || '<div class="glass-card-enterprise text-center" style="padding: 4rem; color: #64748b;"><p>No hay partidas creadas para registrar resultados.</p></div>'}
            </div>
        </div>
    `;
}

window.adjustOpenMatchSetScore = async function (matchId, setNum, teamKey, delta) {
    try {
        if (!window.db) throw new Error("Firebase Firestore no está inicializado");

        const docRef = window.db.collection(OPEN_MATCHES_COLLECTION).doc(matchId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("La partida no existe");

        const data = doc.data();
        let result = data.result || {};

        const setKey = `set${setNum}`;
        if (!result[setKey]) {
            result[setKey] = { a: 0, b: 0 };
        }

        let currentVal = result[setKey][teamKey] !== undefined ? result[setKey][teamKey] : 0;
        let newVal = currentVal + delta;
        if (newVal < 0) newVal = 0;
        if (newVal > 7) newVal = 7;

        result[setKey][teamKey] = newVal;

        const updatePayload = {
            result: result
        };
        if (data.status !== 'completed' && data.status !== 'finished') {
            updatePayload.status = 'completed';
        }

        await docRef.update(updatePayload);

        if (window.NotificationService) {
            window.NotificationService.showToast(`Set ${setNum} actualizado`, "success");
        }
    } catch (err) {
        alert("Error al actualizar marcador: " + err.message);
    }
};

window.markOpenMatchCompleted = async function (matchId) {
    try {
        if (!window.db) throw new Error("Firebase Firestore no está inicializado");
        const docRef = window.db.collection(OPEN_MATCHES_COLLECTION).doc(matchId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("La partida no existe");

        const data = doc.data();
        const nextStatus = data.status === 'completed' ? 'active' : 'completed';
        
        await docRef.update({
            status: nextStatus
        });

        if (window.NotificationService) {
            window.NotificationService.showToast(`Estado cambiado a ${nextStatus.toUpperCase()}`, "success");
        }
    } catch (err) {
        alert("Error al cambiar estado: " + err.message);
    }
};
