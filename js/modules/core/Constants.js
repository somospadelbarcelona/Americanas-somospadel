/**
 * Constants.js
 * Single source of truth for application constants, enums, and configuration.
 */

window.AppConstants = {
    STATUS: {
        OPEN: 'open',
        LIVE: 'live',
        FINISHED: 'finished',
        ADJUSTING: 'adjusting', // Intermediate state for modifying pairs without triggering auto-logic
        PAIRING: 'pairing'
    },

    ROLES: {
        SUPER_ADMIN: 'super_admin',
        ADMIN: 'admin',
        CAPTAIN: 'captain',
        PLAYER: 'player',
        ADMIN_PLAYER: 'admin_player'
    },

    EVENT_TYPES: {
        AMERICANA: 'americana',
        ENTRENO: 'entreno'
    },

    PAIR_MODES: {
        FIXED: 'fixed',
        FIXED_ADMIN: 'fixed_admin',
        FIXED_AUTO: 'fixed_auto',
        ROTATING: 'rotating'
    },

    CATEGORIES: {
        MALE: 'male',
        FEMALE: 'female',
        MIXED: 'mixed',
        OPEN: 'open'
    },

    // Default Configuration
    DEFAULTS: {
        MAX_COURTS: 4,
        DURATION: '1h 30m',
        PRICE_MEMBERS: 12,
        PRICE_EXTERNAL: 14,
        TIME: '10:00'
    },

    // Image mappings for auto-sync logic
    IMAGES: {
        PRAT: {
            male: 'img/entreno masculino prat.jpg',
            female: 'img/entreno femenino prat.jpg',
            mixed: 'img/entreno mixto prat.jpg',
            open: 'img/entreno todo prat.jpg'
        },
        DELFOS: {
            male: 'img/entreno masculino delfos.jpg',
            female: 'img/entreno femenino delfos.jpg',
            mixed: 'img/entreno mixto delfos.jpg',
            open: 'img/entreno todo delfos.jpg'
        },
        AMERICANA: {
            male: 'img/americana%20masculina.jpg',
            female: 'img/americana%20femeninas.jpg',
            mixed: 'img/americana%20mixta.jpg',
            open: 'img/americana%20mixta.jpg'
        },
        BALLS: {
            male: 'img/ball-masculina.png',
            female: 'img/ball-femenina.png',
            mixed: 'img/ball-mixta.png'
        }
    },

    // Niveles predefinidos por equipo
    TEAM_LEVELS: {
        '3º Masculino A': 3.75,
        '3º Masculino B': 3.5,
        '4º Masculino': 3,
        '4º Mixto A': 3, // Assuming all 4 mixed are level 3 based on '4ºMIXTO'
        '4º Mixto B': 3,
        '3º Mixto': 3.5,
        '2º Femenino': 3.5,
        '4º Femenino': 3
    },

    // Player Attributes for Smart Matchmaking
    PLAYER_ATTRIBUTES: {
        SIDE: {
            DRIVE: 'DRIVE',
            REVES: 'REVÉS',
            INDIFF: 'INDIFERENTE'
        },
        STYLE: {
            CONTROL: 'CONTROL',
            POTENCIA: 'POTENCIA',
            MIXTO: 'HÍBRIDO / MIXTO',
            ESTRATEGIA: 'ESTRATEGIA'
        }
    },

    // Headquarters Coordinates for Proximity Radar
    LOCATIONS: {
        PRAT: { lat: 41.325, lng: 2.088, radius: 500 }, // 500m radius
        DELFOS: { lat: 41.353, lng: 2.067, radius: 300 }
    },

    // 🎾 Catálogo de Clubes & Sedes de Pádel (L'Hospitalet, Cornellà, El Prat, Barcelona)
    CLUBS: [
        // --- EL PRAT DE LLOBREGAT ---
        {
            id: 'prat_bcn',
            name: "Barcelona Pádel el Prat",
            shortName: "Bcn Pádel Prat",
            zone: "El Prat de Llobregat",
            sede: "Barcelona Pádel el Prat",
            address: "Autovía de Castelldefels, Km 4.6, 08820 El Prat de Llobregat",
            courts: 14,
            coords: { lat: 41.325, lng: 2.088 }
        },
        {
            id: 'prat_estruch',
            name: "CEM Estruch Pádel",
            shortName: "CEM Estruch",
            zone: "El Prat de Llobregat",
            sede: "CEM Estruch El Prat",
            address: "Av. Pare Andreu de Palma, 9, 08820 El Prat de Llobregat",
            courts: 6,
            coords: { lat: 41.331, lng: 2.095 }
        },
        {
            id: 'prat_ct',
            name: "Club Tennis & Pádel El Prat",
            shortName: "CT El Prat",
            zone: "El Prat de Llobregat",
            sede: "CT Pádel El Prat",
            address: "Ctra. de la Marina, s/n, 08820 El Prat de Llobregat",
            courts: 5,
            coords: { lat: 41.328, lng: 2.102 }
        },

        // --- CORNELLÀ DE LLOBREGAT ---
        {
            id: 'cornella_delfos',
            name: "Complex Esportiu Delfos",
            shortName: "Delfos Cornellà",
            zone: "Cornellà de Llobregat",
            sede: "Delfos Cornellá",
            address: "Carrer de la Verge de Montserrat, s/n, 08940 Cornellà de Llobregat",
            courts: 8,
            coords: { lat: 41.353, lng: 2.067 }
        },
        {
            id: 'cornella_aurial',
            name: "Aurial Cornellà",
            shortName: "Aurial Cornellà",
            zone: "Cornellà de Llobregat",
            sede: "Aurial Cornellà",
            address: "Carrer del Progrés, 34, 08940 Cornellà de Llobregat",
            courts: 6,
            coords: { lat: 41.359, lng: 2.075 }
        },
        {
            id: 'cornella_pell',
            name: "Parc Esportiu Llobregat (PELL)",
            shortName: "PELL Cornellà",
            zone: "Cornellà de Llobregat",
            sede: "PELL Cornellà Pádel",
            address: "Av. del Baix Llobregat, s/n, 08940 Cornellà de Llobregat",
            courts: 6,
            coords: { lat: 41.355, lng: 2.060 }
        },
        {
            id: 'cornella_mercader',
            name: "Pádel Can Mercader",
            shortName: "Can Mercader",
            zone: "Cornellà de Llobregat",
            sede: "Can Mercader Cornellà",
            address: "Carretera de l'Hospitalet, s/n, 08940 Cornellà de Llobregat",
            courts: 4,
            coords: { lat: 41.362, lng: 2.083 }
        },

        // --- L'HOSPITALET DE LLOBREGAT ---
        {
            id: 'hosp_cem_tennis',
            name: "CEM Tennis & Pádel Hospitalet",
            shortName: "CEM Hospitalet",
            zone: "L'Hospitalet de Llobregat",
            sede: "CEM Hospitalet Tennis",
            address: "Carrer de la Feixa Llarga, s/n, 08907 L'Hospitalet de Llobregat",
            courts: 8,
            coords: { lat: 41.345, lng: 2.108 }
        },
        {
            id: 'hosp_indoor',
            name: "Pádel Indoor L'Hospitalet",
            shortName: "Indoor Hospitalet",
            zone: "L'Hospitalet de Llobregat",
            sede: "Pádel Indoor Hospitalet",
            address: "Carrer de la Botànica, 25, 08908 L'Hospitalet de Llobregat",
            courts: 7,
            coords: { lat: 41.356, lng: 2.128 }
        },
        {
            id: 'hosp_xaloc',
            name: "Xaloc",
            shortName: "Xaloc",
            zone: "L'Hospitalet de Llobregat",
            sede: "Xaloc",
            address: "Carrer de les Ciències, 45, 08908 L'Hospitalet de Llobregat",
            courts: 6,
            coords: { lat: 41.351, lng: 2.133 }
        },
        {
            id: 'hosp_gogopadel',
            name: "Go go Padel",
            shortName: "Go go Padel",
            zone: "L'Hospitalet de Llobregat",
            sede: "Go go Padel",
            address: "Carrer de Sant Rafael, s/n, 08905 L'Hospitalet de Llobregat",
            courts: 4,
            coords: { lat: 41.371, lng: 2.112 }
        },
        {
            id: 'hosp_bellvitge',
            name: "Complex Bellvitge Sergio Manzano",
            shortName: "Bellvitge Pádel",
            zone: "L'Hospitalet de Llobregat",
            sede: "Complex Bellvitge",
            address: "Av. Mare de Déu de Bellvitge, 7, 08907 L'Hospitalet de Llobregat",
            courts: 4,
            coords: { lat: 41.350, lng: 2.116 }
        },

        // --- GAVÀ / BAIX LLOBREGAT ---
        {
            id: 'gava_padelarium',
            name: "Padelarium Gavá (Indoor)",
            shortName: "Padelarium Gavá",
            zone: "Gavà",
            sede: "Padelarium Gavá",
            address: "Carrer de la Tecnologia, 19, 08850 Gavà",
            courts: 10,
            coords: { lat: 41.298, lng: 2.012 }
        },

        // --- BARCELONA & ALREDEDORES ---
        {
            id: 'bcn_bela',
            name: "Bela Pádel",
            shortName: "Bela Pádel",
            zone: "Barcelona",
            sede: "Bela Pádel",
            address: "Barcelona",
            courts: 16,
            coords: { lat: 41.390, lng: 2.150 }
        },
        {
            id: 'can_via',
            name: "Can Vía Racket Club",
            shortName: "Can Vía",
            zone: "Santa Coloma de Cervelló",
            sede: "Can Vía Racket Club",
            address: "Calle de la Riera, 08690 Santa Coloma de Cervelló",
            courts: 6,
            coords: { lat: 41.365, lng: 2.016 }
        },
        {
            id: 'padel_7',
            name: "Padel 7 Sant Martí",
            shortName: "Padel 7",
            zone: "Barcelona",
            sede: "Padel 7 Sant Martí",
            address: "Carrer de Veneçuela, 08019 Barcelona",
            courts: 7,
            coords: { lat: 41.412, lng: 2.204 }
        }
    ]
};

window.PADEL_CLUBS_CATALOG = window.AppConstants.CLUBS;

/**
 * 🎾 Searchable Combobox for Sedes / Clubes
 * Allows searching by typing, selecting from dropdown, or writing custom sede freely.
 * Does NOT display the number of courts in the options list.
 */
window.setupSedeCombobox = function (inputElOrId, options = {}) {
    const input = typeof inputElOrId === 'string' ? document.getElementById(inputElOrId) : inputElOrId;
    if (!input) return;

    if (input.dataset.comboboxInitialized === 'true') return;
    input.dataset.comboboxInitialized = 'true';

    const wrapper = input.parentElement;
    let dropdown = wrapper ? wrapper.querySelector('.sede-combobox-dropdown') : null;
    if (!dropdown && wrapper) {
        dropdown = document.createElement('div');
        dropdown.className = 'sede-combobox-dropdown';
        wrapper.appendChild(dropdown);
    }
    if (!dropdown) return;

    const clubs = window.PADEL_CLUBS_CATALOG || [];

    const zones = [
        { label: "📍 EL PRAT DE LLOBREGAT", zoneKey: "El Prat de Llobregat" },
        { label: "📍 CORNELLÀ DE LLOBREGAT", zoneKey: "Cornellà de Llobregat" },
        { label: "📍 L'HOSPITALET DE LLOBREGAT", zoneKey: "L'Hospitalet de Llobregat" },
        { label: "📍 GAVÀ / BAIX LLOBREGAT", zoneKey: "Gavà" },
        { label: "📍 BARCELONA Y ALREDEDORES", zoneKey: "Barcelona" }
    ];

    function renderList(query = '') {
        const q = (query || '').toLowerCase().trim();
        let html = '';

        zones.forEach(z => {
            const isOther = z.zoneKey === 'Barcelona';
            const zoneClubs = clubs.filter(c => {
                if (isOther) {
                    return !["El Prat de Llobregat", "Cornellà de Llobregat", "L'Hospitalet de Llobregat", "Gavà"].includes(c.zone);
                }
                return c.zone === z.zoneKey;
            });

            const matchingClubs = zoneClubs.filter(c => {
                if (!q) return true;
                return (c.name && c.name.toLowerCase().includes(q)) ||
                       (c.sede && c.sede.toLowerCase().includes(q)) ||
                       (c.shortName && c.shortName.toLowerCase().includes(q)) ||
                       (c.address && c.address.toLowerCase().includes(q));
            });

            if (matchingClubs.length > 0) {
                html += `<div class="sede-combobox-group">${z.label}</div>`;
                matchingClubs.forEach(c => {
                    const displayName = c.sede || c.name;
                    const safeSede = displayName.replace(/"/g, '&quot;');
                    const safeClub = (c.name || displayName).replace(/"/g, '&quot;');
                    html += `
                        <div class="sede-combobox-item" 
                             data-sede="${safeSede}" 
                             data-club="${safeClub}" 
                             data-courts="${c.courts || 4}">
                            <span>${displayName}</span>
                        </div>
                    `;
                });
            }
        });

        if (q) {
            const safeQ = q.replace(/"/g, '&quot;');
            html += `
                <div class="sede-combobox-custom-item" data-custom="${safeQ}">
                    <i class="fas fa-pen" style="font-size: 0.75rem;"></i>
                    <span>Usar sede personalizada: <strong>"${query}"</strong></span>
                </div>
            `;
        }

        dropdown.innerHTML = html;

        dropdown.querySelectorAll('.sede-combobox-item').forEach(item => {
            item.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const sede = item.getAttribute('data-sede');
                const club = item.getAttribute('data-club');
                const courts = item.getAttribute('data-courts');

                input.value = sede;
                dropdown.style.display = 'none';

                const clubInputId = options.clubInputId;
                if (clubInputId) {
                    const clubInput = document.getElementById(clubInputId);
                    if (clubInput) {
                        clubInput.value = club;
                    }
                }

                const form = input.closest('form');
                if (form && courts) {
                    const courtsInput = form.querySelector('[name=max_courts]') || 
                                        form.querySelector('#create-courts-input') ||
                                        form.querySelector('#edit-americana-courts-input') ||
                                        form.querySelector('#edit-entreno-courts-input');
                    if (courtsInput) {
                        courtsInput.value = courts;
                    }
                }

                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });

        dropdown.querySelectorAll('.sede-combobox-custom-item').forEach(item => {
            item.addEventListener('click', (ev) => {
                ev.stopPropagation();
                dropdown.style.display = 'none';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    function openDropdown() {
        renderList(input.value);
        dropdown.style.display = 'block';
    }

    function closeDropdown() {
        dropdown.style.display = 'none';
    }

    input.addEventListener('focus', openDropdown);
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        openDropdown();
    });

    input.addEventListener('input', () => {
        openDropdown();
    });

    const toggleBtn = wrapper ? wrapper.querySelector('.sede-combobox-toggle') : null;
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.style.display === 'block') {
                closeDropdown();
            } else {
                input.focus();
                openDropdown();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (wrapper && !wrapper.contains(e.target)) {
            closeDropdown();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });
};

console.log("🚀 AppConstants Loaded with Padel Clubs Catalog & SedeCombobox");

