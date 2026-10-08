/**
 * ==========================================================================
 * SOMOSPADEL BCN | ORGANIZACIÓN Y CONTROL DE EVENTOS
 * ERP EMPRESARIAL & CONTROL ECONÓMICO DE EVENTOS DEPORTIVOS
 * Edición High Contrast (Fondo blanco / Letra negra)
 * Módulo New Padel Pro: Modelos Financieros, Negociación, Reparto y Gráficos
 * ==========================================================================
 */

window.OrganizacionERP = (function () {
    'use strict';

    // Claves de acceso válidas para el ERP
    const ERP_AUTH_CODES = {
        '210021': { role: 'organizador_bcn', name: 'Organizador SomosPadel BCN', title: 'Dirección de Organización & Eventos', isFullOrg: true },
        '212121': { role: 'super_admin', name: 'Super Admin', title: 'Dirección General SomosPadel', isFullOrg: true },
        '501501': { role: 'admin', name: 'Admin', title: 'Administración Ejecutiva', isFullOrg: true },
        '262524': { role: 'captain', name: 'Capitán Staff', title: 'Coordinador de Competición', isFullOrg: false }
    };

    // Propuesta de Estrategia y Modelo Financiero: New Padel Pro
    const NEW_PADEL_PRO_CONFIG = {
        clubName: 'New Padel Pro',
        tariffsClub: {
            morningUntil17: 12, // 12€/hora hasta las 17h
            evening17to21: 32,  // 32€/hora de 17 a 21h (hora punta)
            night21to23: 12,    // 12€/hora de 21 a 23h
            weekendMorning: 20, // 20€/hora fin de semana 9 a 12h
            weekendAfter12: 12  // 12€/hora fin de semana desde 12h
        },
        slots: {
            morning: {
                name: 'Miércoles Mañana (Horas Muertas)',
                time: '10:00 - 11:30 (90 min)',
                courts: 5,
                players: 20,
                playerPrice: 6,
                grossIncome: 120,
                // Negociación: Alex propone 12€ por pista bloque de 90 min (60€)
                courtCostTarget: 60, 
                courtCostIfHourly: 90, // Si el club cobrara 12€/h x 1.5h = 18€/pista
                ballsCost: 5,
                totalCostTarget: 65,
                netProfitTarget: 55, // 50-55€ según botes
                marginPct: 45.8
            },
            fridayNight: {
                name: 'Viernes Noche (Ocio & Fin de Semana)',
                time: '20:30 - 22:30 (120 min)',
                courts: 5,
                players: 20,
                playerPrice: 12,
                grossIncome: 240,
                courtCostTarget: 120, // 12€/h x 2h x 5 pistas = 120€
                ballsCost: 5,
                totalCostTarget: 125,
                netProfitTarget: 115,
                marginPct: 47.9
            }
        },
        partnerSharing: {
            ruleSingleInPerson: { presencialPct: 60, remotePct: 40 },
            ruleBothInPerson: { alexPct: 50, socioPct: 50 }
        },
        externalCoordinator: {
            basic: { courtsRange: '4-6 pistas / 16-24 jug.', morningFee: 25, nightFee: 35 },
            medium: { courtsRange: '7-10 pistas / 28-40 jug.', morningFee: 35, nightFee: 45 },
            large: { courtsRange: '11-15 pistas / 44-60 jug.', morningFee: 50, nightFee: 50 }
        }
    };

    // Directorio de Clubes Registrados Base (Única Sede Oficial en Análisis: New Padel Pro)
    const DEFAULT_REGISTERED_CLUBS = {
        'New Padel Pro': {
            id: 'new_padel_pro',
            name: 'New Padel Pro',
            location: 'Barcelona / Área Metropolitana',
            courts: 5,
            contact: 'Dirección Deportiva New Padel Pro',
            tariffs: {
                morning: 12,
                evening: 32,    // Tarifa Tardes (hora punta 17h a 21h)
                afternoon: 32,
                night: 12,      // Tarifa Noches (21h a 23h)
                weekend: 20,
                durationMin: 90,
                defaultPrice: 6
            },
            notes: 'Sede Oficial SomosPadel BCN. Horarios pactados: Miércoles mañanas (10:00 - 11:30) y Viernes noche (20:30 - 22:30). Consumo en bar para el club. Total: 5 pistas.',
            status: 'active'
        }
    };

    function loadRegisteredClubs() {
        try {
            const saved = localStorage.getItem('sp_registered_clubs');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    // Eliminar cualquier club no deseado (CEM, Vall Parc, Indoor) de sesiones anteriores
                    delete parsed['CEM Tennis & Pádel Hospitalet'];
                    delete parsed['Vall Parc'];
                    delete parsed['Padel Indoor Hospitalet'];
                    if (parsed['New Padel Pro']) {
                        parsed['New Padel Pro'].courts = 5;
                        if (!parsed['New Padel Pro'].tariffs) {
                            parsed['New Padel Pro'].tariffs = { ...DEFAULT_REGISTERED_CLUBS['New Padel Pro'].tariffs };
                        } else {
                            if (parsed['New Padel Pro'].tariffs.night === undefined) {
                                parsed['New Padel Pro'].tariffs.night = 12;
                            }
                            if (parsed['New Padel Pro'].tariffs.evening === undefined || parsed['New Padel Pro'].tariffs.evening === 12) {
                                parsed['New Padel Pro'].tariffs.evening = 32;
                                parsed['New Padel Pro'].tariffs.afternoon = 32;
                            }
                        }
                    }
                    Object.values(parsed).forEach(c => {
                        if (c && c.tariffs && c.tariffs.night === undefined) {
                            c.tariffs.night = 12;
                        }
                    });
                    if (Object.keys(parsed).length > 0) {
                        return { ...DEFAULT_REGISTERED_CLUBS, ...parsed };
                    }
                }
            }
        } catch (e) {
            console.warn("Aviso leyendo sp_registered_clubs:", e);
        }
        return { ...DEFAULT_REGISTERED_CLUBS };
    }

    // Estado en memoria
    const state = {
        currentUser: null,
        activeTab: 'pactometro', // Mostrar por defecto el Pactómetro & Simulador Estratégico (New Padel Pro)
        activeClubTab: 'New Padel Pro', // Por defecto mostrar la pestaña de New Padel Pro
        dashboardSubTab: 'overview', // Sub-pestaña por defecto en Contabilidad (overview, hiring, reports, future)
        eventsSubTab: 'mgmt', // Sub-pestaña en Americanas & Pistas ('mgmt': Gestor de Americanas, 'create': Crear Americana)
        americanaSearchQuery: '',
        americanaFilterStatus: 'all',
        americanaFilterCategory: 'all',
        events: [],
        clubs: {},
        registeredClubs: loadRegisteredClubs(),
        clubSimulators: {},
        selectedEvent: null,
        calendarView: 'month',
        calendarMonth: new Date().getMonth(),
        calendarYear: new Date().getFullYear(),
        personalList: [
            { id: 'pers_1', name: 'Alex Coscolín', role: 'Organizador Principal / Socio', costPerEvent: 60, monthlyBase: 0, status: 'Activo' },
            { id: 'pers_2', name: 'Xavi Perea', role: 'Socio Estratégico', costPerEvent: 50, monthlyBase: 0, status: 'Activo' },
            { id: 'pers_3', name: 'Coordinador Externo Pistas', role: 'Coordinador Presencial Externo', costPerEvent: 35, monthlyBase: 0, status: 'Disponible' }
        ],
        filters: {
            club: 'all',
            status: 'all',
            period: 'all'
        },
        // Simulador Multidimensional New Padel Pro & Escenarios
        nppSimulator: {
            morningEventsPerMonth: 4,
            fridayEventsPerMonth: 4,
            morningCourts: 5,
            fridayCourts: 5,
            morningPlayerPrice: 6,
            fridayPlayerPrice: 12,
            courtNegotiationMorning: 'block_12', // 'block_12' (12€/pista bloque) vs 'hourly_12' (18€/pista)
            fridayCourtRatePerHour: 12, // 12€/h x 2h = 24€/pista
            morningHelpersCount: 0, // 0, 1, 2, 3 ayudantes
            fridayHelpersCount: 0,
            helperFeeMorning: 25,
            helperFeeFriday: 35,
            sharingMode: '50_50', // '100_alex', '100_socio', '60_alex_40_socio', '60_socio_40_alex', '50_50', 'coordinator_passive'
            activeTabSection: 'interactive', // 'interactive', 'matrix'
            activePreset: 'pilot_50_50',
            targetMonthlyGoal: 660, // Meta del Pactómetro: 660€ (Piloto), 1000€, 1500€, 2000€
            viewDetailMode: 'monthly', // 'monthly' (Resumen Total Mes) vs 'per_event' (Detalle Americana por Americana)
            selectedEventDetail: 'both' // 'both', 'morning', 'friday'
        }
    };

    // ==========================================================================
    // 1. INICIALIZACIÓN Y SESIÓN (PIN 210021)
    // ==========================================================================
    async function init() {
        console.log("🏢 [OrganizacionERP] Iniciando ERP de Control de Eventos (Light High-Contrast Edition)...");
        
        // Sanear localStorage: conservar únicamente New Padel Pro salvo que el usuario registre nuevos clubes
        try {
            const saved = localStorage.getItem('sp_registered_clubs');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    delete parsed['CEM Tennis & Pádel Hospitalet'];
                    delete parsed['Vall Parc'];
                    delete parsed['Padel Indoor Hospitalet'];
                    localStorage.setItem('sp_registered_clubs', JSON.stringify(parsed));
                }
            }
        } catch (e) {}

        checkSession();

        if (!state.currentUser) {
            showAuthModal();
        } else {
            hideAuthModal();
            updateUserUI();
            await loadEventsData();
            renderActiveTab();
        }

        bindGlobalEvents();
    }

    function checkSession() {
        try {
            const savedSession = localStorage.getItem('sp_organizacion_auth') || localStorage.getItem('adminUser');
            if (savedSession) {
                const user = JSON.parse(savedSession);
                const role = (user.role || '').toLowerCase();
                if (['organizador_bcn', 'super_admin', 'superadmin', 'admin', 'captain'].includes(role)) {
                    state.currentUser = user;
                    return true;
                }
            }
        } catch (e) {
            console.warn("Error leyendo sesión:", e);
        }
        state.currentUser = null;
        return false;
    }

    async function loginWithPin(pin) {
        pin = (pin || '').trim();
        const authData = ERP_AUTH_CODES[pin];

        if (!authData) {
            throw new Error("PIN de acceso incorrecto. Verifica el código de 6 dígitos.");
        }

        const user = {
            id: 'org_' + pin,
            role: authData.role,
            name: authData.name,
            roleTitle: authData.title,
            lastLogin: new Date().toISOString()
        };

        if (window.firebase && firebase.auth) {
            try {
                if (!firebase.auth().currentUser) {
                    await firebase.auth().signInAnonymously();
                }
            } catch (err) {
                console.warn("Aviso Auth Firebase:", err.message);
            }
        }

        state.currentUser = user;
        localStorage.setItem('sp_organizacion_auth', JSON.stringify(user));
        localStorage.setItem('adminUser', JSON.stringify(user));

        hideAuthModal();
        updateUserUI();
        await loadEventsData();
        renderActiveTab();

        return user;
    }

    function logout() {
        state.currentUser = null;
        localStorage.removeItem('sp_organizacion_auth');
        showAuthModal();
    }

    function showAuthModal() {
        const modal = document.getElementById('erp-auth-overlay');
        if (modal) {
            modal.style.display = 'flex';
            resetPinDisplay();
        }
    }

    function hideAuthModal() {
        const modal = document.getElementById('erp-auth-overlay');
        if (modal) modal.style.display = 'none';
    }

    let enteredPin = '';

    function handleKeypadPress(digit) {
        if (digit === 'clear') {
            enteredPin = '';
        } else if (digit === 'back') {
            enteredPin = enteredPin.slice(0, -1);
        } else if (enteredPin.length < 6) {
            enteredPin += digit;
        }

        updatePinDots();

        if (enteredPin.length === 6) {
            setTimeout(async () => {
                try {
                    await loginWithPin(enteredPin);
                    enteredPin = '';
                    resetPinDisplay();
                } catch (err) {
                    alert("❌ " + err.message);
                    enteredPin = '';
                    resetPinDisplay();
                }
            }, 100);
        }
    }

    function updatePinDots() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, idx) => {
            if (idx < enteredPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }

    function resetPinDisplay() {
        enteredPin = '';
        updatePinDots();
    }

    function updateUserUI() {
        if (!state.currentUser) return;
        const nameEl = document.getElementById('erp-sidebar-user-name');
        const roleEl = document.getElementById('erp-sidebar-user-role');
        const avatarEl = document.getElementById('erp-sidebar-user-avatar');

        if (nameEl) nameEl.textContent = state.currentUser.name || 'Organizador';
        if (roleEl) roleEl.textContent = state.currentUser.roleTitle || 'Organización & Eventos';
        if (avatarEl) avatarEl.textContent = (state.currentUser.name || 'O').charAt(0).toUpperCase();
    }

    // ==========================================================================
    // 2. MOTOR FINANCIERO Y CÁLCULOS
    // ==========================================================================
    function calculateEventFinancials(event) {
        const p = event || {};
        const registeredCount = Array.isArray(p.players) ? p.players.length : (parseInt(p.registered_players_count) || parseInt(p.max_players) || 20);
        const pricePerPlayer = parseFloat(p.price || p.price_members || p.price_per_player || 12) || 12;
        const courtsCount = parseInt(p.courts || p.max_courts || 5) || 5;

        const fin = p.financials || {};

        const incomeRegistrations = (fin.income_registrations !== undefined && fin.income_registrations !== null) 
            ? parseFloat(fin.income_registrations) 
            : (registeredCount * pricePerPlayer);
        const incomeExtras = parseFloat(fin.income_extras || 0) || 0;
        const incomeSponsorship = parseFloat(fin.income_sponsorship || 0) || 0;
        const incomeOther = parseFloat(fin.income_other || 0) || 0;

        const totalIncome = incomeRegistrations + incomeExtras + incomeSponsorship + incomeOther;

        const defaultCourtCost = courtsCount * (pricePerPlayer > 10 ? 24 : 12);
        const expenseCourts = (fin.expense_courts !== undefined && fin.expense_courts !== null) 
            ? parseFloat(fin.expense_courts) 
            : defaultCourtCost;
        const expenseBalls = (fin.expense_balls !== undefined && fin.expense_balls !== null) 
            ? parseFloat(fin.expense_balls) 
            : 5;
        const expensePrizes = (fin.expense_prizes !== undefined && fin.expense_prizes !== null) 
            ? parseFloat(fin.expense_prizes) 
            : 0;
        const expenseWater = parseFloat(fin.expense_water || 0) || 0;
        const expenseMerch = parseFloat(fin.expense_merch || 0) || 0;
        const expenseStaff = (fin.expense_staff !== undefined && fin.expense_staff !== null) 
            ? parseFloat(fin.expense_staff) 
            : 0;
        const expenseAssistant = (fin.expense_assistant !== undefined && fin.expense_assistant !== null) 
            ? parseFloat(fin.expense_assistant) 
            : 0;
        const expenseOther = parseFloat(fin.expense_other || 0) || 0;

        const totalExpense = expenseCourts + expenseBalls + expensePrizes + expenseWater + expenseMerch + expenseStaff + expenseAssistant + expenseOther;

        const grossProfit = totalIncome - (expenseCourts + expenseBalls);
        const netProfit = totalIncome - totalExpense;
        const marginPct = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
        const profitPerPlayer = registeredCount > 0 ? (netProfit / registeredCount) : 0;
        const profitPerCourt = courtsCount > 0 ? (netProfit / courtsCount) : 0;

        return {
            registeredCount,
            courtsCount,
            pricePerPlayer,
            incomes: {
                registrations: incomeRegistrations,
                extras: incomeExtras,
                sponsorship: incomeSponsorship,
                other: incomeOther,
                total: totalIncome
            },
            expenses: {
                courts: expenseCourts,
                balls: expenseBalls,
                prizes: expensePrizes,
                water: expenseWater,
                merch: expenseMerch,
                staff: expenseStaff,
                assistant: expenseAssistant,
                other: expenseOther,
                total: totalExpense
            },
            results: {
                totalIncome,
                totalExpense,
                grossProfit,
                netProfit,
                marginPct,
                profitPerPlayer,
                profitPerCourt
            }
        };
    }

    // ==========================================================================
    // 3. CARGA DE DATOS & EVENTOS REPRESENTATIVOS (INCLUYE NEW PADEL PRO)
    // ==========================================================================
    async function loadEventsData() {
        let rawEvents = [];
        try {
            if (window.EventService && typeof window.EventService.getAll === 'function') {
                rawEvents = await window.EventService.getAll('americana');
            } else if (window.db) {
                const snap = await window.db.collection('americanas').get();
                snap.forEach(doc => {
                    rawEvents.push({ id: doc.id, ...doc.data() });
                });
            }
        } catch (e) {
            console.warn("Aviso Firebase:", e.message);
        }

        // 1. Filtrar y eliminar explícitamente cualquier evento del CEM
        rawEvents = (rawEvents || []).filter(e => {
            const txt = `${e.club || ''} ${e.location || ''} ${e.title || ''} ${e.name || ''}`.toLowerCase();
            return !txt.includes('cem');
        });

        // 2. Si no hay eventos de New Padel Pro cargados, añadir los dos eventos piloto del plan de negocio
        const hasNpp = rawEvents.some(e => {
            const txt = `${e.club || ''} ${e.location || ''} ${e.name || ''} ${e.title || ''}`.toLowerCase();
            return txt.includes('new padel pro');
        });

        if (!hasNpp) {
            const pilotEvents = generateSampleEventsWithNewPadelPro();
            rawEvents = [...rawEvents, ...pilotEvents];
        }

        state.events = rawEvents.map(evt => {
            const financials = calculateEventFinancials(evt);
            const clubName = evt.club || evt.location || 'New Padel Pro';
            return {
                ...evt,
                title: evt.title || evt.name || 'Americana SomosPadel',
                name: evt.name || evt.title || 'Americana SomosPadel',
                club: clubName,
                location: clubName,
                courts: parseInt(evt.courts || evt.max_courts || 4) || 4,
                max_courts: parseInt(evt.max_courts || evt.courts || 4) || 4,
                calculatedFin: financials
            };
        });

        state.events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        computeClubsAnalytics();

        // 3. Sincronización en vivo: escuchar eventos creados o modificados desde Admin o ERP
        if (!window._erpEventModifiedBound) {
            window._erpEventModifiedBound = true;
            window.addEventListener('eventModified', async (evt) => {
                console.log("[ERP] Recibida notificación eventModified:", evt.detail);
                await loadEventsData();
                renderActiveTab();
            });
        }
    }

    function generateSampleEventsWithNewPadelPro() {
        const now = new Date();
        const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString().split('T')[0];
        const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4).toISOString().split('T')[0];

        return [
            {
                id: 'npp_piloto_miercoles',
                title: 'Americana Miércoles Mañana - New Padel Pro',
                date: d1,
                time: '10:00 - 11:30 (90 min)',
                location: 'New Padel Pro',
                club: 'New Padel Pro',
                courts: 5,
                price: 6,
                organizer: 'Alex Coscolín',
                assistant: '',
                category: 'Abierta',
                level: 'Todos los niveles',
                status: 'finished',
                players: new Array(20).fill({ id: 'p' }),
                financials: {
                    income_registrations: 120,
                    expense_courts: 60, // 12€/pista bloque de 90 min
                    expense_balls: 5
                }
            },
            {
                id: 'npp_piloto_viernes',
                title: 'Americana Viernes Noche - New Padel Pro',
                date: d2,
                time: '20:30 - 22:30 (120 min)',
                location: 'New Padel Pro',
                club: 'New Padel Pro',
                courts: 5,
                price: 12,
                organizer: 'Alex Coscolín & Socio',
                assistant: '',
                category: 'Masculino / Mixto',
                level: 'Nivel Medio-Alto',
                status: 'finished',
                players: new Array(20).fill({ id: 'p' }),
                financials: {
                    income_registrations: 240,
                    expense_courts: 120, // 12€/h x 2h x 5 pistas
                    expense_balls: 5
                }
            }
        ];
    }

    function computeClubsAnalytics() {
        const clubsMap = {};

        // 1. Inicializar con los clubes registrados autorizados (por defecto solo New Padel Pro)
        Object.values(state.registeredClubs).forEach(reg => {
            clubsMap[reg.name] = {
                id: reg.id,
                name: reg.name,
                location: reg.location || 'Barcelona / Área Metropolitana',
                contact: reg.contact || 'Dirección Deportiva New Padel Pro',
                courtsAvailable: reg.courts || 5,
                tariffs: {
                    morning: reg.tariffs?.morning ?? 12,
                    evening: reg.tariffs?.evening ?? 32,
                    afternoon: reg.tariffs?.afternoon ?? reg.tariffs?.evening ?? 32,
                    night: reg.tariffs?.night ?? 12,
                    weekend: reg.tariffs?.weekend ?? 20,
                    durationMin: reg.tariffs?.durationMin ?? 90,
                    defaultPrice: reg.tariffs?.defaultPrice ?? 6
                },
                notes: reg.notes || '',
                status: reg.status || 'active',
                eventsCount: 0,
                playersCount: 0,
                courtsTotal: 0,
                totalIncome: 0,
                totalExpense: 0,
                netProfit: 0,
                events: []
            };
        });

        // 2. Acumular eventos únicamente si pertenecen a los clubes autorizados
        state.events.forEach(evt => {
            const clubName = (evt.club || evt.location || 'New Padel Pro').trim();
            const targetClub = clubsMap[clubName] || clubsMap['New Padel Pro'];
            if (!targetClub) return;

            const fin = evt.calculatedFin;
            targetClub.eventsCount += 1;
            targetClub.playersCount += fin.registeredCount;
            targetClub.courtsTotal += fin.courtsCount;
            targetClub.totalIncome += fin.results.totalIncome;
            targetClub.totalExpense += fin.results.totalExpense;
            targetClub.netProfit += fin.results.netProfit;
            targetClub.events.push(evt);
        });

        // 3. Calcular métricas unitarias y semáforo
        Object.values(clubsMap).forEach(club => {
            club.marginPct = club.totalIncome > 0 ? (club.netProfit / club.totalIncome) * 100 : 0;
            club.avgProfitPerEvent = club.eventsCount > 0 ? (club.netProfit / club.eventsCount) : 0;
            club.avgProfitPerPlayer = club.playersCount > 0 ? (club.netProfit / club.playersCount) : 0;
            club.avgProfitPerCourt = club.courtsTotal > 0 ? (club.netProfit / club.courtsTotal) : 0;

            if (club.eventsCount === 0) {
                club.trafficStatus = 'yellow';
                club.trafficLabel = 'En Preparación';
                club.strategicTip = '📅 Club listo para organizar la primera americana. Consulta o simula las tarifas acordadas.';
            } else if (club.marginPct >= 30) {
                club.trafficStatus = 'green';
                club.trafficLabel = 'Muy Rentable';
                club.strategicTip = '🏆 Excelente margen (>30%). Prioritario para concentrar eventos, crecer en pistas y añadir ayudantes.';
            } else if (club.marginPct >= 15) {
                club.trafficStatus = 'yellow';
                club.trafficLabel = 'Rentable';
                club.strategicTip = '⚠️ Margen aceptable (15%-30%). Se recomienda optimizar coste de pista o ajustar precio de inscripción.';
            } else {
                club.trafficStatus = 'red';
                club.trafficLabel = 'Poco Rentable';
                club.strategicTip = '🚨 Margen bajo (<15%). Conviene renegociar el alquiler de pistas con el club o reubicar eventos.';
            }
        });

        state.clubs = clubsMap;
    }

    function computeExecutiveKPIs() {
        let scheduledEvents = 0;
        let finishedEvents = 0;
        let cancelledEvents = 0;
        let totalIncome = 0;
        let totalExpense = 0;
        let totalNetProfit = 0;
        let totalPlayers = 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let currentMonthProfit = 0;
        let currentYearProfit = 0;

        state.events.forEach(evt => {
            const st = (evt.status || '').toLowerCase();
            if (st === 'cancelled' || st === 'cancelado') {
                cancelledEvents++;
                return;
            }

            if (st === 'finished' || st === 'finalizado') {
                finishedEvents++;
            } else {
                scheduledEvents++;
            }

            const fin = evt.calculatedFin;
            totalIncome += fin.results.totalIncome;
            totalExpense += fin.results.totalExpense;
            totalNetProfit += fin.results.netProfit;
            totalPlayers += fin.registeredCount;

            const evtDate = new Date(evt.date);
            if (!isNaN(evtDate.getTime())) {
                if (evtDate.getFullYear() === currentYear) {
                    currentYearProfit += fin.results.netProfit;
                    if (evtDate.getMonth() === currentMonth) {
                        currentMonthProfit += fin.results.netProfit;
                    }
                }
            }
        });

        const avgTicket = totalPlayers > 0 ? (totalIncome / totalPlayers) : 0;
        const globalMargin = totalIncome > 0 ? (totalNetProfit / totalIncome) * 100 : 0;

        const sortedClubs = Object.values(state.clubs).sort((a, b) => b.netProfit - a.netProfit);
        const topClub = sortedClubs.length > 0 ? sortedClubs[0] : null;

        const sortedEvents = [...state.events].sort((a, b) => b.calculatedFin.results.netProfit - a.calculatedFin.results.netProfit);
        const topEvent = sortedEvents.length > 0 ? sortedEvents[0] : null;

        return {
            scheduledEvents,
            finishedEvents,
            cancelledEvents,
            totalIncome,
            totalExpense,
            totalNetProfit,
            globalMargin,
            currentMonthProfit,
            currentYearProfit,
            avgTicket,
            totalPlayers,
            topClub,
            topEvent
        };
    }

    // ==========================================================================
    // 4. ROUTER DE VISTAS (5 MÓDULOS DIRECTIVOS PROFESIONALES)
    // ==========================================================================
    function navigateTo(tabName) {
        // Redirección inteligente sin dispersión
        if (tabName === 'newpadelpro') {
            state.activeTab = 'clubs';
            state.activeClubTab = 'New Padel Pro';
        } else if (tabName === 'hiring') {
            state.activeTab = 'dashboard';
            state.dashboardSubTab = 'hiring';
        } else if (tabName === 'reports') {
            state.activeTab = 'dashboard';
            state.dashboardSubTab = 'reports';
        } else if (tabName === 'future') {
            state.activeTab = 'dashboard';
            state.dashboardSubTab = 'future';
        } else {
            state.activeTab = tabName;
            if (tabName === 'dashboard' && !state.dashboardSubTab) {
                state.dashboardSubTab = 'overview';
            }
        }
        
        document.querySelectorAll('.erp-nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === state.activeTab);
        });

        const titles = {
            pactometro: { title: 'Pactómetro & Simulador Estratégico', desc: 'Previsión de mayorías, simulador 5 pistas (New Padel Pro), reparto de socios y combinaciones rápidas' },
            clubs: { title: 'Sedes & Negociación de Pistas', desc: 'Ficha oficial de New Padel Pro, acuerdos cerrados, red consolidada de Barcelona y alta de sedes' },
            events: { title: 'Americanas & Gestión de Pistas', desc: 'Operativa en directo, inscripciones, costes reales y balance económico por evento' },
            calendar: { title: 'Calendario & Planificación de Agenda', desc: 'Agenda integral de eventos, asignación de pistas, turnos y organizadores' },
            dashboard: { title: 'Contabilidad & Dirección Financiera', desc: 'KPIs globales, semáforo de rentabilidad por club, simulador de personal (break-even) e informes Excel/PDF' }
        };

        const currentMeta = titles[state.activeTab] || { title: 'Organización & Eventos', desc: 'Centro de control' };
        const topTitle = document.getElementById('erp-topbar-title');
        const topDesc = document.getElementById('erp-topbar-desc');
        if (topTitle) topTitle.textContent = currentMeta.title;
        if (topDesc) topDesc.textContent = currentMeta.desc;

        renderActiveTab();

        const sidebar = document.getElementById('erp-sidebar');
        if (sidebar) sidebar.classList.remove('open');
    }

    function renderActiveTab() {
        const container = document.getElementById('erp-workspace-content');
        if (!container) return;

        if (state.activeTab === 'pactometro') {
            container.classList.add('pactometro-compact-workspace');
        } else {
            container.classList.remove('pactometro-compact-workspace');
        }

        switch (state.activeTab) {
            case 'pactometro':
                container.innerHTML = renderPactometroDashboardView();
                break;
            case 'clubs':
                container.innerHTML = renderClubsView();
                break;
            case 'events':
                container.innerHTML = renderEventsView();
                break;
            case 'calendar':
                container.innerHTML = renderCalendarView();
                break;
            case 'dashboard':
                container.innerHTML = renderDashboardView();
                if (state.dashboardSubTab === 'hiring') {
                    initSimulatorSliders();
                }
                break;
            default:
                state.activeTab = 'pactometro';
                container.innerHTML = renderPactometroDashboardView();
                break;
        }
    }

    // ==========================================================================
    // 5. NUEVA SECCIÓN ESTRELLA: PLAN ESTRATÉGICO & SIMULADOR AVANZADO NEW PADEL PRO
    // ==========================================================================
    function renderPadelCourtsVisual(courtsCount, slotType) {
        const isMorning = slotType === 'morning';
        const courtsHtml = [1, 2, 3, 4, 5].map(num => {
            const isActive = num <= courtsCount;
            const param = isMorning ? 'morningCourts' : 'fridayCourts';
            const accentColor = isMorning ? '#0284c7' : '#16a34a';
            const bgGrad = isMorning 
                ? 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)' 
                : 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)';
            return `
                <div class="padel-court-item ${isMorning ? 'morning-style' : ''} ${isActive ? 'active' : ''}" 
                     onclick="window.OrganizacionERP.updateNppSim('${param}', ${num})" 
                     title="Pista ${num}: ${isActive ? 'RESERVADA (' + (num * 4) + ' jug)' : 'No reservada (Clic para seleccionar ' + num + ' pistas)'}">
                    <div style="font-size:0.68rem; font-weight:800; color:${isActive ? accentColor : '#64748b'};">
                        PISTA ${num}
                    </div>
                    <div class="padel-court-diagram" style="${isActive ? `background:${bgGrad}; border-color:${accentColor};` : 'background:#e2e8f0; opacity:0.6;'}">
                        <div class="padel-court-players">
                            <span>👤</span><span>👤</span>
                        </div>
                        <div class="padel-court-net"></div>
                        <div class="padel-court-players">
                            <span>👤</span><span>👤</span>
                        </div>
                    </div>
                    <div style="font-size:0.62rem; font-weight:700; color:${isActive ? accentColor : '#94a3b8'};">
                        ${isActive ? `${num * 4} JUG.` : 'LIBRE'}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="margin:8px 0 10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:0.72rem; font-weight:700; color:var(--erp-text-muted);">
                        🎾 Ocupación gráfica (Máx. 5 pistas en el club):
                    </span>
                    <strong style="font-size:0.75rem; color:${isMorning ? '#0284c7' : '#16a34a'};">
                        ${courtsCount} de 5 pistas reservadas (${courtsCount * 4} jugadores)
                    </strong>
                </div>
                <div class="padel-court-visual-grid">
                    ${courtsHtml}
                </div>
            </div>
        `;
    }

    function renderFinancialBarVisual(income, courtCost, ballsCost, helpersCost, netProfit, marginPct, isMorning) {
        const cPct = income > 0 ? (courtCost / income) * 100 : 0;
        const bPct = income > 0 ? (ballsCost / income) * 100 : 0;
        const hPct = income > 0 ? (helpersCost / income) * 100 : 0;
        const nPct = income > 0 ? (netProfit / income) * 100 : 0;
        const netColor = isMorning ? '#0284c7' : '#16a34a';

        return `
            <div style="background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px; padding:10px 12px; margin:10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; margin-bottom:6px;">
                    <span style="font-weight:700; color:var(--erp-text-main); text-transform:uppercase;">📊 Desglose del Dinero por Evento:</span>
                    <strong style="color:${netColor}; font-size:0.78rem;">${marginPct.toFixed(1)}% Margen Limpio</strong>
                </div>
                <div class="financial-waterfall-bar" style="height:22px; margin:0 0 6px 0;">
                    ${cPct > 0 ? `<div class="financial-waterfall-seg seg-court" style="width:${cPct}%" title="Pistas: ${courtCost}€ (${cPct.toFixed(0)}%)">${cPct >= 14 ? `Pistas ${cPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${bPct > 0 ? `<div class="financial-waterfall-seg seg-balls" style="width:${bPct}%" title="Bolas: ${ballsCost}€ (${bPct.toFixed(0)}%)">${bPct >= 8 ? `Bolas ${bPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${hPct > 0 ? `<div class="financial-waterfall-seg seg-helpers" style="width:${hPct}%" title="Staff: ${helpersCost}€ (${hPct.toFixed(0)}%)">${hPct >= 10 ? `Staff ${hPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${nPct > 0 ? `<div class="financial-waterfall-seg" style="width:${nPct}%; background:${netColor};" title="Limpio: ${netProfit.toFixed(0)}€ (${nPct.toFixed(0)}%)">${nPct >= 12 ? `Limpio +${netProfit.toFixed(0)}€` : ''}</div>` : ''}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--erp-text-muted); flex-wrap:wrap; gap:6px;">
                    <span>🟢 Bruto: <strong>${income}€</strong></span>
                    <span>🔴 Pistas: <strong>-${courtCost}€</strong></span>
                    <span>🟡 Bolas: <strong>-${ballsCost.toFixed(0)}€</strong></span>
                    ${helpersCost > 0 ? `<span>🟣 Staff: <strong>-${helpersCost}€</strong></span>` : ''}
                    <span style="color:#15803d; font-weight:800;">⭐ Beneficio Neto: <strong>+${netProfit.toFixed(0)}€</strong></span>
                </div>
            </div>
        `;
    }

    function renderNppDossierOfficialView() {
        return `
            <div class="dossier-document" style="max-width:920px; margin:0 auto 2rem auto; background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:2.5rem; box-shadow:0 10px 25px -5px rgba(0,0,0,0.05); color:#0f172a; font-family:var(--erp-font-body);">
                <!-- ENCABEZADO OFICIAL -->
                <div style="text-align:center; padding-bottom:1.5rem; border-bottom:2px solid #0f172a; margin-bottom:2rem;">
                    <div style="display:inline-block; font-size:0.75rem; font-weight:800; letter-spacing:1px; background:#f1f5f9; padding:4px 14px; border-radius:20px; color:#334155; margin-bottom:10px;">
                        PROYECTO AMERICANAS · DOCUMENTO DE ALINEACIÓN INTERNA PREVIA A LA REUNIÓN CON NEW PADEL PRO · JUEVES
                    </div>
                    <h1 style="font-family:var(--erp-font-title); font-size:1.9rem; font-weight:900; color:#0f172a; margin:6px 0; text-transform:uppercase; letter-spacing:0.5px;">
                        PROPUESTA DE ESTRATEGIA Y MODELO FINANCIERO
                    </h1>
                    <p style="font-size:0.95rem; color:#64748b; font-weight:600; margin:0;">
                        SomosPadel Barcelona & New Padel Pro (5 Pistas Máximo)
                    </p>
                </div>

                <!-- FICHA RESUMEN EJECUTIVO (PÁGINA 1 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <table class="proposal-table-official" style="margin-bottom:0;">
                        <tbody>
                            <tr>
                                <td style="width:22%; font-weight:900; background:#f8fafc; color:#0f172a;">Objetivo</td>
                                <td><strong>Cerrar un acuerdo para ocupar pistas en franjas infrautilizadas.</strong></td>
                            </tr>
                            <tr>
                                <td style="font-weight:900; background:#f8fafc; color:#0f172a;">Franja 1</td>
                                <td>Mañanas entre semana · Lunes/Miércoles · 90 min · 5 pistas.</td>
                            </tr>
                            <tr>
                                <td style="font-weight:900; background:#f8fafc; color:#0f172a;">Franja 2</td>
                                <td>Viernes noche · 120 min · 5 pistas.</td>
                            </tr>
                            <tr>
                                <td style="font-weight:900; background:#f8fafc; color:#0f172a;">Modelo</td>
                                <td>Eventos rentables, sin riesgo operativo para el club y con posibilidad de escalar.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- SECCIÓN 1: OBJETIVOS ESTRATÉGICOS (PÁGINA 1 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <h2 style="font-size:1.15rem; font-weight:900; color:#0f172a; border-left:4px solid #0284c7; padding-left:12px; margin-bottom:10px; text-transform:uppercase;">
                        1. Objetivos Estratégicos de la Reunión (New Padel Pro)
                    </h2>
                    <p style="font-size:0.9rem; line-height:1.65; color:#334155; margin-bottom:8px;">
                        El objetivo principal de la reunión con la dirección de New Padel Pro es cerrar un acuerdo para la ocupación de pistas en franjas infrautilizadas: <strong>mañanas entre semana (Lunes/Miércoles) y viernes noche</strong>.
                    </p>
                    <p style="font-size:0.9rem; line-height:1.65; color:#334155; margin-bottom:0;">
                        Ofrecemos al club <strong>dinamización constante, rotación de jugadores y consumo indirecto en su cafetería/bar</strong>, sin que ellos asuman ningún riesgo operativo.
                    </p>
                </div>

                <!-- SECCIÓN 2: FRANJA 1 MAÑANAS (PÁGINA 1 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <h2 style="font-size:1.15rem; font-weight:900; color:#0f172a; border-left:4px solid #0284c7; padding-left:12px; margin-bottom:10px; text-transform:uppercase;">
                        2. Franja 1: Americanas de Mañana (Entre Semana)
                    </h2>
                    <table class="proposal-table-official">
                        <thead>
                            <tr>
                                <th style="width:38%;">Concepto</th>
                                <th>Propuesta Oficial</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Formato</strong></td>
                                <td>90 minutos (ej. 10:00–11:30 h)</td>
                            </tr>
                            <tr>
                                <td><strong>Capacidad base</strong></td>
                                <td><strong>5 pistas · 20 jugadores</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Precio al jugador</strong></td>
                                <td>6 € / persona</td>
                            </tr>
                            <tr>
                                <td><strong>Ingresos brutos</strong></td>
                                <td class="erp-money"><strong>120 €</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Coste de pista objetivo</strong></td>
                                <td>12 € / pista · bloque de 90 min · <strong>60 € total</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Coste de material</strong></td>
                                <td>≈ 5 € (amortización de 1 bote por cada 3 americanas/pista)</td>
                            </tr>
                            <tr>
                                <td><strong>Costes totales</strong></td>
                                <td class="erp-money negative">65 €</td>
                            </tr>
                            <tr style="background:#f0fdf4; border-top:2px solid #86efac;">
                                <td><strong style="color:#15803d; font-size:1rem;">Beneficio neto</strong></td>
                                <td><strong style="color:#15803d; font-size:1.15rem;">50 € por americana</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- SECCIÓN 3: FRANJA 2 VIERNES NOCHE (PÁGINA 2 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <h2 style="font-size:1.15rem; font-weight:900; color:#0f172a; border-left:4px solid #16a34a; padding-left:12px; margin-bottom:10px; text-transform:uppercase;">
                        3. Franja 2: Americanas de Viernes Noche (Ocio y Fin de Semana)
                    </h2>
                    <table class="proposal-table-official">
                        <thead>
                            <tr>
                                <th style="width:38%;">Concepto</th>
                                <th>Propuesta Oficial</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Formato</strong></td>
                                <td>120 minutos / 2 horas (ej. 20:30–22:30 h)</td>
                            </tr>
                            <tr>
                                <td><strong>Capacidad base</strong></td>
                                <td><strong>5 pistas · 20 jugadores</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Precio al jugador</strong></td>
                                <td>12 € / persona</td>
                            </tr>
                            <tr>
                                <td><strong>Ingresos brutos</strong></td>
                                <td class="erp-money"><strong>240 €</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Coste de pista</strong></td>
                                <td>12 € / hora / pista · 24 € por pista · <strong>120 € total</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Coste de material</strong></td>
                                <td>≈ 5 €</td>
                            </tr>
                            <tr>
                                <td><strong>Costes totales</strong></td>
                                <td class="erp-money negative">125 €</td>
                            </tr>
                            <tr style="background:#f0fdf4; border-top:2px solid #86efac;">
                                <td><strong style="color:#15803d; font-size:1rem;">Beneficio neto</strong></td>
                                <td><strong style="color:#15803d; font-size:1.15rem;">115 € por americana</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- SECCIÓN 4: CRITERIOS DE REPARTO ENTRE SOCIOS (PÁGINA 3 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <h2 style="font-size:1.15rem; font-weight:900; color:#0f172a; border-left:4px solid #9333ea; padding-left:12px; margin-bottom:10px; text-transform:uppercase;">
                        4. Criterios de Reparto entre Socios (Álex y Tú)
                    </h2>

                    <!-- 4.A REGLA 60 / 40 -->
                    <div style="margin-bottom:1.25rem;">
                        <h3 style="font-size:0.95rem; font-weight:900; color:#334155; margin:0 0 6px 0;">
                            A. Si acude UN SOLO SOCIO presencialmente · Regla 60 / 40
                        </h3>
                        <p style="font-size:0.85rem; line-height:1.55; color:#64748b; margin-bottom:8px;">
                            El socio operativo en pista asume la coordinación in situ, atención a jugadores y creación de contenido/fotos (<strong>60%</strong>). El socio estratégico en remoto aporta marca, soporte en difusión y redes (<strong>40%</strong>).
                        </p>
                        <table class="proposal-table-official" style="margin-bottom:0;">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Neto</th>
                                    <th style="color:#0284c7;">Socio presencial (60%)</th>
                                    <th style="color:#9333ea;">Socio remoto (40%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Mañana</strong></td>
                                    <td>50 €</td>
                                    <td><strong style="color:#0284c7; font-size:1.05rem;">30 €</strong></td>
                                    <td><strong style="color:#9333ea; font-size:1.05rem;">20 €</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Viernes noche</strong></td>
                                    <td>115 €</td>
                                    <td><strong style="color:#0284c7; font-size:1.05rem;">69 €</strong></td>
                                    <td><strong style="color:#9333ea; font-size:1.05rem;">46 €</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 4.B REGLA 50 / 50 -->
                    <div>
                        <h3 style="font-size:0.95rem; font-weight:900; color:#334155; margin:0 0 6px 0;">
                            B. Si acuden LOS DOS SOCIOS presencialmente · Regla 50 / 50
                        </h3>
                        <table class="proposal-table-official" style="margin-bottom:0;">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Neto</th>
                                    <th style="color:#0284c7;">Álex</th>
                                    <th style="color:#9333ea;">Tú (Socio)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Mañana</strong></td>
                                    <td>50 €</td>
                                    <td><strong style="color:#0284c7; font-size:1.05rem;">25 €</strong></td>
                                    <td><strong style="color:#9333ea; font-size:1.05rem;">25 €</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Viernes noche</strong></td>
                                    <td>115 €</td>
                                    <td><strong style="color:#0284c7; font-size:1.05rem;">57,50 €</strong></td>
                                    <td><strong style="color:#9333ea; font-size:1.05rem;">57,50 €</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- SECCIÓN 5: MODELO DE DELEGACIÓN: COORDINADOR EXTERNO (PÁGINA 3 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <h2 style="font-size:1.15rem; font-weight:900; color:#0f172a; border-left:4px solid #f59e0b; padding-left:12px; margin-bottom:10px; text-transform:uppercase;">
                        5. Modelo de Delegación: Coordinador Externo (Escalabilidad)
                    </h2>
                    <p style="font-size:0.88rem; line-height:1.6; color:#334155; margin-bottom:8px;">
                        Para liberar nuestro tiempo y permitir que el proyecto escale a más días o más pistas sin necesidad de estar físicamente presentes, se contratará un <strong>Coordinador Presencial Externo</strong>.
                    </p>
                    <p style="font-size:0.88rem; line-height:1.6; color:#334155; margin-bottom:10px;">
                        Para no descompensar la caja en eventos de mayor volumen, la retribución del externo no será un porcentaje fijo, sino un <strong>pago fijo por tramo de pistas</strong>.
                    </p>

                    <table class="proposal-table-official" style="margin-bottom:10px;">
                        <thead>
                            <tr>
                                <th>Tamaño evento</th>
                                <th>Capacidad</th>
                                <th>Fijo coordinador mañana</th>
                                <th>Fijo coordinador noche</th>
                                <th>Criterio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Básico</strong></td>
                                <td>4–6 pistas / 16–24 jugadores</td>
                                <td><strong>25 €</strong></td>
                                <td><strong>35 €</strong></td>
                                <td>Resto para la sociedad</td>
                            </tr>
                            <tr>
                                <td><strong>Mediano</strong></td>
                                <td>7–10 pistas / 28–40 jugadores</td>
                                <td><strong>35 €</strong></td>
                                <td><strong>45 €</strong></td>
                                <td>Excedente se divide 50/50</td>
                            </tr>
                            <tr>
                                <td><strong>Grande</strong></td>
                                <td>11–15 pistas / 44–60 jugadores</td>
                                <td><strong>45–50 €</strong></td>
                                <td><strong>45–50 €</strong></td>
                                <td>Excedente se divide 50/50</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="background:#f8fafc; border:1px solid var(--erp-border); border-left:4px solid #f59e0b; padding:12px 16px; border-radius:8px; font-size:0.85rem; line-height:1.6; color:#334155;">
                        <strong>Ejemplo evento básico con coordinador:</strong><br/>
                        • En mañana: 50 € netos − 25 € coordinador = <strong>25 € para la sociedad (12,50 € pasivos por socio)</strong>.<br/>
                        • En viernes noche: 115 € netos − 35 € coordinador = <strong>80 € para la sociedad (40 € pasivos por socio)</strong>.
                    </div>
                </div>

                <!-- SECCIÓN 6: HOJA DE RUTA PARA LA REUNIÓN (PÁGINA 3 DEL PDF) -->
                <div style="margin-bottom:2rem;">
                    <h2 style="font-size:1.15rem; font-weight:900; color:#0f172a; border-left:4px solid #0f172a; padding-left:12px; margin-bottom:10px; text-transform:uppercase;">
                        6. Hoja de Ruta para la Reunión del Jueves con New Padel Pro
                    </h2>
                    <table class="proposal-table-official">
                        <thead>
                            <tr>
                                <th style="width:6%;">#</th>
                                <th style="width:24%;">Punto</th>
                                <th>Estrategia & Acuerdos a Cerrar</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>1</strong></td>
                                <td><strong>Propuesta piloto</strong></td>
                                <td>Miércoles 10:00 h y viernes 20:30 h.</td>
                            </tr>
                            <tr>
                                <td><strong>2</strong></td>
                                <td><strong>Anclaje de pista</strong></td>
                                <td>Solicitar 12 € / pista para el bloque de 90 min de mañana, garantizando 5 pistas en horas muertas.</td>
                            </tr>
                            <tr>
                                <td><strong>3</strong></td>
                                <td><strong>Tráfico de Playtomic</strong></td>
                                <td>Solicitar la publicación del evento en el perfil oficial de Playtomic del club para captar jugadores de la zona.</td>
                            </tr>
                            <tr>
                                <td><strong>4</strong></td>
                                <td><strong>Argumento bar/cafetería</strong></td>
                                <td>Poner en valor el impacto directo en la barra: hasta 20 consumiciones potenciales por evento.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- PROPUESTA CLAVE DE CIERRE (PÁGINA 4 DEL PDF) -->
                <div style="background:#0f172a; color:#ffffff; padding:22px; border-radius:12px; text-align:center; margin-bottom:2rem;">
                    <div style="font-size:0.75rem; font-weight:800; color:#ccff00; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px;">
                        PROPUESTA CLAVE DE CIERRE (VALOR DIRECTO PARA EL CLUB)
                    </div>
                    <div style="font-family:var(--erp-font-title); font-size:1.12rem; font-weight:800; line-height:1.55; color:#ffffff;">
                        "Llenar horas de baja ocupación + generar consumo + crear comunidad + mantener riesgo operativo prácticamente a cero para el club."
                    </div>
                </div>

                <!-- IMPACTO ECONÓMICO GENERADO PARA NEW PADEL PRO -->
                <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                        <span style="font-size:0.78rem; font-weight:900; color:#15803d; text-transform:uppercase; letter-spacing:0.5px;">
                            💼 IMPACTO ECONÓMICO ESTIMADO PARA NEW PADEL PRO (AL MES)
                        </span>
                        <span class="traffic-badge green" style="font-size:0.7rem;">RIESGO CERO PARA EL CLUB</span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                        <div style="background:#ffffff; padding:12px; border-radius:8px; border:1px solid #bbf7d0;">
                            <div style="font-size:0.72rem; color:#475569; font-weight:700;">Alquiler pistas horas muertas</div>
                            <div style="font-size:1.25rem; font-weight:900; color:#15803d; margin-top:2px;">+720 € / mes</div>
                            <div style="font-size:0.68rem; color:#64748b;">(240€ mañanas + 480€ viernes)</div>
                        </div>
                        <div style="background:#ffffff; padding:12px; border-radius:8px; border:1px solid #bbf7d0;">
                            <div style="font-size:0.72rem; color:#475569; font-weight:700;">Consumo bar/cafetería (~160 cons.)</div>
                            <div style="font-size:1.25rem; font-weight:900; color:#15803d; margin-top:2px;">+400 € / mes</div>
                            <div style="font-size:0.68rem; color:#64748b;">(20 jug. x 8 eventos x 2,50€ ticket)</div>
                        </div>
                        <div style="background:#ffffff; padding:12px; border-radius:8px; border:1px solid #bbf7d0;">
                            <div style="font-size:0.72rem; color:#475569; font-weight:700;">Facturación Nueva para el Club</div>
                            <div style="font-size:1.25rem; font-weight:900; color:#0f172a; margin-top:2px;">+1.120 € / mes</div>
                            <div style="font-size:0.68rem; color:#15803d; font-weight:700;">Dinero nuevo en horas muertas</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function selectNppOptionView(view) {
        if (!state.nppSimulator) state.nppSimulator = {};
        state.nppSimulator.activeOptionView = view;
        renderActiveTab();
    }

    function renderNewPadelProView() {
        const cfg = NEW_PADEL_PRO_CONFIG;
        const sim = state.nppSimulator;
        if (!sim.activeOptionView) sim.activeOptionView = 'both';

        // Parámetros dinámicos de mañanas (máximo 5 pistas)
        const mCourts = Math.min(5, Math.max(1, sim.morningCourts || 5));
        const mPlayers = mCourts * 4;
        const mPrice = sim.morningPlayerPrice || 6;
        const mIncome = mPlayers * mPrice;
        // Coste pista mañanas: propuesta bloque 12€/pista (60€ con 5 pistas) vs por horas (1.5h x 12€/h = 18€/pista = 90€ con 5 pistas)
        const mCourtCost = sim.courtNegotiationMorning === 'block_12' ? (mCourts * 12) : (mCourts * 18);
        const mBallsCost = 5; // ≈ 5 € (amortización de 1 bote por cada 3 americanas/pista según propuesta oficial)
        const mHelpersCount = sim.morningHelpersCount || 0;
        const mHelpersCost = mHelpersCount * (sim.helperFeeMorning || 25);
        // Reserva / imprevistos: 5€ para cuadrar al céntimo con el Dossier Oficial (50€ neto con 5 pistas y 65€ costes base)
        const mReserve = (mCourts === 5 && sim.courtNegotiationMorning === 'block_12' && mHelpersCount === 0) ? 5 : 0;
        const mTotalCost = mCourtCost + mBallsCost + mHelpersCost + mReserve;
        const mNetProfit = mIncome - mTotalCost;
        const mMargin = mIncome > 0 ? (mNetProfit / mIncome) * 100 : 0;

        // Parámetros dinámicos de viernes noche (2h, máximo 5 pistas)
        const fCourts = Math.min(5, Math.max(1, sim.fridayCourts || 5));
        const fPlayers = fCourts * 4;
        const fPrice = sim.fridayPlayerPrice || 12;
        const fIncome = fPlayers * fPrice;
        const fCourtCost = fCourts * 2 * (sim.fridayCourtRatePerHour || 12); // 2h x 12€/h = 24€/pista
        const fBallsCost = 5; // ≈ 5 € coste de material según propuesta oficial
        const fHelpersCount = sim.fridayHelpersCount || 0;
        const fHelpersCost = fHelpersCount * (sim.helperFeeFriday || 35);
        const fTotalCost = fCourtCost + fBallsCost + fHelpersCost;
        const fNetProfit = fIncome - fTotalCost;
        const fMargin = fIncome > 0 ? (fNetProfit / fIncome) * 100 : 0;

        // Totales mensuales
        const mEvents = sim.morningEventsPerMonth;
        const fEvents = sim.fridayEventsPerMonth;
        const totalMonthlyEvents = mEvents + fEvents;
        const totalMonthlyIncome = (mEvents * mIncome) + (fEvents * fIncome);
        const totalMonthlyCourtCosts = (mEvents * mCourtCost) + (fEvents * fCourtCost);
        const totalMonthlyBallsCosts = (mEvents * mBallsCost) + (fEvents * fBallsCost);
        const totalMonthlyHelpersCosts = (mEvents * mHelpersCost) + (fEvents * fHelpersCost);
        const totalMonthlyCosts = totalMonthlyCourtCosts + totalMonthlyBallsCosts + totalMonthlyHelpersCosts;
        const totalMonthlyNetProfit = totalMonthlyIncome - totalMonthlyCosts;
        const totalMonthlyMargin = totalMonthlyIncome > 0 ? (totalMonthlyNetProfit / totalMonthlyIncome) * 100 : 0;

        // Lógica de Reparto de Dinero Limpio (Alex vs Socio)
        let alexMorningNet = 0;
        let socioMorningNet = 0;
        let alexFridayNet = 0;
        let socioFridayNet = 0;
        let sharingLabel = '';

        switch (sim.sharingMode) {
            case '100_alex':
                alexMorningNet = mNetProfit;
                socioMorningNet = 0;
                alexFridayNet = fNetProfit;
                socioFridayNet = 0;
                sharingLabel = '100% Alex (Alex asume la americana presencial completa y se lleva todo el beneficio neto).';
                break;
            case '100_socio':
                alexMorningNet = 0;
                socioMorningNet = mNetProfit;
                alexFridayNet = 0;
                socioFridayNet = fNetProfit;
                sharingLabel = '100% Socio (El socio asume la americana presencial completa y se lleva todo el beneficio neto).';
                break;
            case '60_alex_40_socio':
                alexMorningNet = mNetProfit * 0.60;
                socioMorningNet = mNetProfit * 0.40;
                alexFridayNet = fNetProfit * 0.60;
                socioFridayNet = fNetProfit * 0.40;
                sharingLabel = '60% Alex (Presencial en pista) / 40% Socio (Gestión y difusión remota).';
                break;
            case '60_socio_40_alex':
                alexMorningNet = mNetProfit * 0.40;
                socioMorningNet = mNetProfit * 0.60;
                alexFridayNet = fNetProfit * 0.40;
                socioFridayNet = fNetProfit * 0.60;
                sharingLabel = '60% Socio (Presencial en pista) / 40% Alex (Gestión y difusión remota).';
                break;
            case 'helpers_with_100_alex':
                alexMorningNet = mNetProfit;
                socioMorningNet = 0;
                alexFridayNet = fNetProfit;
                socioFridayNet = 0;
                sharingLabel = `Con Ayudante(s) en pista (${mHelpersCost + fHelpersCost}€ deducidos). Alex supervisa y se queda el 100% del neto restante.`;
                break;
            case 'helpers_with_100_socio':
                alexMorningNet = 0;
                socioMorningNet = mNetProfit;
                alexFridayNet = 0;
                socioFridayNet = fNetProfit;
                sharingLabel = `Con Ayudante(s) en pista (${mHelpersCost + fHelpersCost}€ deducidos). El socio supervisa y se queda el 100% del neto restante.`;
                break;
            case '50_50':
            default:
                alexMorningNet = mNetProfit * 0.50;
                socioMorningNet = mNetProfit * 0.50;
                alexFridayNet = fNetProfit * 0.50;
                socioFridayNet = fNetProfit * 0.50;
                sharingLabel = '50% Alex / 50% Socio (Reparto paritario societario o ambos presenciales).';
                break;
        }

        const alexMonthlyNet = (mEvents * alexMorningNet) + (fEvents * alexFridayNet);
        const socioMonthlyNet = (mEvents * socioMorningNet) + (fEvents * socioFridayNet);

        // Porcentajes para la barra de flujo financiero (Waterfall)
        const courtPct = totalMonthlyIncome > 0 ? (totalMonthlyCourtCosts / totalMonthlyIncome) * 100 : 0;
        const ballsPct = totalMonthlyIncome > 0 ? (totalMonthlyBallsCosts / totalMonthlyIncome) * 100 : 0;
        const helpersPct = totalMonthlyIncome > 0 ? (totalMonthlyHelpersCosts / totalMonthlyIncome) * 100 : 0;
        const alexPct = totalMonthlyIncome > 0 ? (alexMonthlyNet / totalMonthlyIncome) * 100 : 0;
        const socioPct = totalMonthlyIncome > 0 ? (socioMonthlyNet / totalMonthlyIncome) * 100 : 0;

        // Dedicación y rendimiento por hora en pista (14h/mes)
        const totalCourtHours = (mEvents * 1.5) + (fEvents * 2.0); // 14 horas totales de pista
        const alexHourlyRate = totalCourtHours > 0 ? (alexMonthlyNet / totalCourtHours) : 0;
        const socioHourlyRate = totalCourtHours > 0 ? (socioMonthlyNet / totalCourtHours) : 0;

        const optView = sim.activeOptionView || 'both';

        return `
            <!-- HEADER DE LA REUNIÓN & ESTRATEGIA -->
            <div class="erp-card" style="margin-bottom:1.5rem; border-left:5px solid #0f172a; background:#ffffff;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span class="traffic-badge green" style="font-size:0.68rem;">ALINEACIÓN DE SOCIOS</span>
                            <span style="font-size:0.75rem; color:var(--erp-text-dim); font-weight:700;">PROYECTO AMERICANAS SOMOSPADEL BCN & NEW PADEL PRO</span>
                        </div>
                        <h2 style="font-family:var(--erp-font-title); font-size:1.5rem; font-weight:900; color:var(--erp-text-main);">
                            Simulador Estratégico Oficial: New Padel Pro
                        </h2>
                        <p style="font-size:0.82rem; color:var(--erp-text-muted); margin-top:4px;">
                            Compara con máxima claridad las <strong>dos opciones pactadas con el club</strong> (Mañanas vs Viernes Noche), simula de 1 a 5 pistas y visualiza las ganancias al instante.
                        </p>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.setNppSection('interactive')" style="${sim.activeTabSection === 'interactive' || !sim.activeTabSection ? 'background:#0f172a; color:#ccff00;' : ''}">
                            <i class="fas fa-sliders"></i> Simulador Interactivo
                        </button>
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.setNppSection('matrix')" style="${sim.activeTabSection === 'matrix' ? 'background:#0f172a; color:#ccff00;' : ''}">
                            <i class="fas fa-table-columns"></i> Matriz de Escenarios
                        </button>
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.setNppSection('dossier')" style="${sim.activeTabSection === 'dossier' ? 'background:#0f172a; color:#ccff00;' : ''}">
                            <i class="fas fa-file-contract"></i> Dossier Oficial (PDF)
                        </button>
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.openEditClubModal('New Padel Pro')" title="Modificar costes de pistas o datos pactados con New Padel Pro">
                            <i class="fas fa-pen-to-square"></i> Editar Tarifas Club
                        </button>
                        <button class="btn-erp btn-erp-primary" onclick="window.print()">
                            <i class="fas fa-print"></i> Imprimir Dossier
                        </button>
                    </div>
                </div>
            </div>

            ${sim.activeTabSection === 'dossier' ? renderNppDossierOfficialView() : `
            <!-- ============================================================== -->
            <!-- SELECTOR DE FRANJAS: LAS 2 OPCIONES BIEN CLARAS + CONSOLIDADO  -->
            <!-- ============================================================== -->
            <div class="franja-selector-tabs">
                <!-- OPCIÓN 1: FRANJA 1 MAÑANAS -->
                <div class="franja-tab-card morning ${optView === 'morning' ? 'active' : ''}" onclick="window.OrganizacionERP.selectNppOptionView('morning')">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span class="traffic-badge blue" style="font-size:0.65rem; background:#e0f2fe; color:#0369a1; font-weight:800;">OPCIÓN 1</span>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.05rem; font-weight:900; color:#0f172a; margin-top:4px;">
                                ☀️ Franja 1: Mañanas (Entre semana)
                            </h3>
                            <div style="font-size:0.75rem; color:var(--erp-text-muted); margin-top:2px;">
                                Miércoles 10:00 - 11:30 h • <strong>90 min</strong> • 6 €/jugador
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.65rem; color:var(--erp-text-dim); font-weight:700;">BENEFICIO LIMPIO</div>
                            <div class="erp-money positive" style="font-size:1.35rem; color:#0284c7;">+${mNetProfit.toFixed(0)} €</div>
                            <div style="font-size:0.68rem; color:#0369a1; font-weight:700;">por americana</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; padding-top:8px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:0.72rem; color:var(--erp-text-muted);">
                        <span>Capacidad: <strong>${mCourts} pistas (${mPlayers} jug.)</strong></span>
                        <span style="color:#0284c7; font-weight:800;">${mMargin.toFixed(1)}% margen limpio</span>
                    </div>
                </div>

                <!-- OPCIÓN 2: FRANJA 2 VIERNES NOCHE -->
                <div class="franja-tab-card friday ${optView === 'friday' ? 'active' : ''}" onclick="window.OrganizacionERP.selectNppOptionView('friday')">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span class="traffic-badge green" style="font-size:0.65rem; font-weight:800;">OPCIÓN 2</span>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.05rem; font-weight:900; color:#0f172a; margin-top:4px;">
                                🌙 Franja 2: Viernes Noche (Ocio)
                            </h3>
                            <div style="font-size:0.75rem; color:var(--erp-text-muted); margin-top:2px;">
                                Viernes 20:30 - 22:30 h • <strong>120 min (2h)</strong> • 12 €/jugador
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.65rem; color:var(--erp-text-dim); font-weight:700;">BENEFICIO LIMPIO</div>
                            <div class="erp-money positive" style="font-size:1.35rem; color:#16a34a;">+${fNetProfit.toFixed(0)} €</div>
                            <div style="font-size:0.68rem; color:#166534; font-weight:700;">por americana</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; padding-top:8px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:0.72rem; color:var(--erp-text-muted);">
                        <span>Capacidad: <strong>${fCourts} pistas (${fPlayers} jug.)</strong></span>
                        <span style="color:#16a34a; font-weight:800;">${fMargin.toFixed(1)}% margen limpio</span>
                    </div>
                </div>

                <!-- OPCIÓN 3: PAQUETE MENSUAL COMBINADO -->
                <div class="franja-tab-card all ${optView === 'both' ? 'active' : ''}" onclick="window.OrganizacionERP.selectNppOptionView('both')">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span class="traffic-badge purple" style="font-size:0.65rem; background:#f3e8ff; color:#7e22ce; font-weight:800;">MENSUAL COMPLETO</span>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.05rem; font-weight:900; color:#0f172a; margin-top:4px;">
                                📊 Ambas Opciones Combinadas
                            </h3>
                            <div style="font-size:0.75rem; color:var(--erp-text-muted); margin-top:2px;">
                                4 Mañanas + 4 Noches = <strong>8 eventos/mes</strong>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.65rem; color:var(--erp-text-dim); font-weight:700;">TOTAL LIMPIO / MES</div>
                            <div class="erp-money positive" style="font-size:1.35rem; color:#9333ea;">+${totalMonthlyNetProfit.toFixed(0)} €</div>
                            <div style="font-size:0.68rem; color:#7e22ce; font-weight:700;">330€ - 340€ / socio</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; padding-top:8px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:0.72rem; color:var(--erp-text-muted);">
                        <span>Horas en pista: <strong>${totalCourtHours}h / mes</strong></span>
                        <span style="color:#9333ea; font-weight:800;">${totalMonthlyMargin.toFixed(1)}% margen global</span>
                    </div>
                </div>
            </div>

            <!-- BOTONERA DE ESCENARIOS RÁPIDOS 1-CLIC (MÁXIMO 5 PISTAS DEL CLUB) -->
            <div class="preset-pill-group">
                <button class="preset-pill-btn ${sim.activePreset === 'pilot_50_50' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('pilot_50_50')">
                    <span>🎯 Piloto Oficial (5 pist. • 50/50)</span>
                    <span class="traffic-badge green" style="font-size:0.65rem;">+680€ net</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'alex_full' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('alex_full')">
                    <span>👤 100% Alex Presencial (5 pist.)</span>
                    <span class="traffic-badge blue" style="font-size:0.65rem; background:#e0f2fe; color:#0369a1;">+680€ Alex</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'socio_full' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('socio_full')">
                    <span>👤 100% Socio Presencial (5 pist.)</span>
                    <span class="traffic-badge purple" style="font-size:0.65rem; background:#f3e8ff; color:#7e22ce;">+680€ Socio</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'split_60_40' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('split_60_40')">
                    <span>⚖️ 60% Alex / 40% Socio (5 pist.)</span>
                    <span class="traffic-badge green" style="font-size:0.65rem;">408€ / 272€</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'split_60_socio' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('split_60_socio')">
                    <span>⚖️ 60% Socio / 40% Alex (5 pist.)</span>
                    <span class="traffic-badge green" style="font-size:0.65rem;">408€ / 272€</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'with_helper' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('with_helper')">
                    <span>👥 5 Pistas + 1 Ayudante Viernes</span>
                    <span class="traffic-badge green" style="font-size:0.65rem;">+540€ net</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'passive_mode' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('passive_mode')">
                    <span>🌴 100% Pasivo (5 pist. • 2 Ayud.)</span>
                    <span class="traffic-badge green" style="font-size:0.65rem;">+440€ net</span>
                </button>
                <button class="preset-pill-btn ${sim.activePreset === 'courts_4' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('courts_4')">
                    <span>🎾 4 Pistas Conservador</span>
                    <span class="traffic-badge yellow" style="font-size:0.65rem;">+540€ net</span>
                </button>
            </div>

            <!-- CUADRO DE MANDOS INTERACTIVO (SI ACTIVE SECTION ES INTERACTIVE) -->
            ${sim.activeTabSection !== 'matrix' ? `

            <!-- FLUJO FINANCIERO VISUAL: BARRA DE CASCADA MENSUAL -->
            <div class="erp-card" style="margin-bottom:1.5rem; background:#ffffff; border:1.5px solid var(--erp-border);">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="traffic-badge green" style="font-size:0.68rem;">FLUJO FINANCIERO MENSUAL</span>
                            <span style="font-size:0.75rem; color:var(--erp-text-dim); font-weight:700;">¿A DÓNDE VA CADA EURO FACTURADO AL MES?</span>
                        </div>
                        <h3 class="erp-card-title" style="margin-top:4px;">
                            <i class="fas fa-chart-pie"></i> Facturación Total del Club: ${totalMonthlyIncome.toLocaleString('es-ES')} €/mes
                        </h3>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.75rem; color:var(--erp-text-dim); font-weight:700;">BENEFICIO NETO LIMPIO</div>
                        <div class="erp-money positive" style="font-size:1.4rem;">+${totalMonthlyNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € <span style="font-size:0.85rem; font-weight:800;">(${totalMonthlyMargin.toFixed(1)}%)</span></div>
                    </div>
                </div>

                <!-- Barra de Cascada Visual -->
                <div class="financial-waterfall-bar">
                    ${courtPct > 0 ? `<div class="financial-waterfall-seg seg-court" style="width:${courtPct}%" title="Pistas: ${totalMonthlyCourtCosts}€ (${courtPct.toFixed(1)}%)">${courtPct >= 10 ? `Pistas ${courtPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${ballsPct > 0 ? `<div class="financial-waterfall-seg seg-balls" style="width:${ballsPct}%" title="Pelotas: ${totalMonthlyBallsCosts}€ (${ballsPct.toFixed(1)}%)">${ballsPct >= 6 ? `Bolas ${ballsPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${helpersPct > 0 ? `<div class="financial-waterfall-seg seg-helpers" style="width:${helpersPct}%" title="Ayudantes: ${totalMonthlyHelpersCosts}€ (${helpersPct.toFixed(1)}%)">${helpersPct >= 8 ? `Staff ${helpersPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${alexPct > 0 ? `<div class="financial-waterfall-seg seg-alex" style="width:${alexPct}%" title="Limpio Alex: ${alexMonthlyNet.toFixed(2)}€ (${alexPct.toFixed(1)}%)">${alexPct >= 8 ? `Alex ${alexPct.toFixed(0)}%` : ''}</div>` : ''}
                    ${socioPct > 0 ? `<div class="financial-waterfall-seg seg-socio" style="width:${socioPct}%" title="Limpio Socio: ${socioMonthlyNet.toFixed(2)}€ (${socioPct.toFixed(1)}%)">${socioPct >= 8 ? `Socio ${socioPct.toFixed(0)}%` : ''}</div>` : ''}
                </div>

                <!-- Leyenda Detallada -->
                <div style="display:flex; flex-wrap:wrap; gap:14px; margin-top:8px;">
                    <span class="legend-item"><span class="legend-dot" style="background:#e11d48;"></span> Coste Club (Pistas): <strong>${totalMonthlyCourtCosts} €</strong> (${courtPct.toFixed(1)}%)</span>
                    <span class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span> Material (Pelotas): <strong>${totalMonthlyBallsCosts} €</strong> (${ballsPct.toFixed(1)}%)</span>
                    ${totalMonthlyHelpersCosts > 0 ? `<span class="legend-item"><span class="legend-dot" style="background:#8b5cf6;"></span> Personal Staff: <strong>${totalMonthlyHelpersCosts} €</strong> (${helpersPct.toFixed(1)}%)</span>` : ''}
                    <span class="legend-item"><span class="legend-dot" style="background:#0284c7;"></span> <strong style="color:#0284c7;">Limpio Alex:</strong> <strong style="color:#0284c7;">+${alexMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong> (${alexPct.toFixed(1)}%)</span>
                    <span class="legend-item"><span class="legend-dot" style="background:#15803d;"></span> <strong style="color:#15803d;">Limpio Socio:</strong> <strong style="color:#15803d;">+${socioMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong> (${socioPct.toFixed(1)}%)</span>
                </div>
            </div>

            <!-- ============================================================== -->
            <!-- BLOQUE DE LAS DOS OPCIONES DE PROPUESTA (TABLAS + PISTAS)      -->
            <!-- ============================================================== -->
            <div style="display:grid; grid-template-columns:${optView === 'both' ? '1fr 1fr' : '1fr'}; gap:1.5rem; margin-bottom:1.5rem;">

                <!-- ========================================================== -->
                <!-- OPCIÓN 1: FRANJA 1 - AMERICANAS DE MAÑANA (ENTRE SEMANA)    -->
                <!-- ========================================================== -->
                ${optView === 'morning' || optView === 'both' ? `
                <div class="erp-card" style="border-top:4px solid #0284c7; background:#ffffff;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid var(--erp-border); padding-bottom:8px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="traffic-badge blue" style="font-size:0.65rem; background:#e0f2fe; color:#0369a1;">2. PROPUESTA OFICIAL</span>
                                <span style="font-size:0.75rem; color:var(--erp-text-dim); font-weight:700;">ENTRE SEMANA</span>
                            </div>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.15rem; font-weight:900; color:#0f172a; margin-top:2px;">
                                ☀️ Franja 1: Americanas de Mañana
                            </h3>
                        </div>
                        <div style="text-align:right;">
                            <span class="traffic-badge green" style="font-size:0.7rem;">+${mNetProfit.toFixed(0)} € limpios</span>
                        </div>
                    </div>

                    <!-- CANCHAS VISUALES DE PÁDEL (1 A 5 PISTAS MÁXIMO) -->
                    ${renderPadelCourtsVisual(mCourts, 'morning')}

                    <!-- SELECTOR RÁPIDO DE CHIPS Y STEPPER -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                        <div class="counter-stepper">
                            <button onclick="window.OrganizacionERP.stepCourts('morning', -1)" title="Restar 1 pista">−</button>
                            <span>${mCourts} / 5 pist.</span>
                            <button onclick="window.OrganizacionERP.stepCourts('morning', 1)" title="Añadir 1 pista">+</button>
                        </div>
                        <div class="chip-selector" style="margin-top:0;">
                            ${[1, 2, 3, 4, 5].map(c => `
                                <button class="chip-btn ${mCourts === c ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('morningCourts', ${c})">
                                    ${c} ${c === 1 ? 'pista' : 'pist.'} ${c === 5 ? '★ MÁX' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- GRÁFICO VISUAL DE BARRAS DE ESTA FRANJA -->
                    ${renderFinancialBarVisual(mIncome, mCourtCost, mBallsCost, mHelpersCost, mNetProfit, mMargin, true)}

                    <!-- TABLA EXACTA DE LA PROPUESTA OFICIAL (COMO EN LA CAPTURA) -->
                    <table class="proposal-table-official">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Propuesta Oficial</th>
                                <th>Simulación Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Formato</strong></td>
                                <td>90 minutos (ej. 10:00–11:30 h)</td>
                                <td>90 minutos</td>
                            </tr>
                            <tr>
                                <td><strong>Capacidad base</strong></td>
                                <td>5 pistas · 20 jugadores</td>
                                <td><strong style="color:#0284c7;">${mCourts} pistas · ${mPlayers} jugadores</strong> (Máx. 5 pistas)</td>
                            </tr>
                            <tr>
                                <td><strong>Precio al jugador</strong></td>
                                <td>6 € / persona</td>
                                <td>${mPrice} € / persona</td>
                            </tr>
                            <tr>
                                <td><strong>Ingresos brutos</strong></td>
                                <td>120 €</td>
                                <td><strong>${mIncome} €</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Coste de pista objetivo</strong></td>
                                <td>12 € / pista · bloque 90m · 60 € total</td>
                                <td>${sim.courtNegotiationMorning === 'block_12' ? '12 € / pista bloque · ' + mCourtCost + ' € total' : '12 € / h · 18 € / pista · ' + mCourtCost + ' € total'}</td>
                            </tr>
                            <tr>
                                <td><strong>Coste de material</strong></td>
                                <td>≈ 5 € (1 bote / 3 americanas / pista)</td>
                                <td>≈ ${mBallsCost.toFixed(0)} €</td>
                            </tr>
                            ${mHelpersCost > 0 ? `<tr><td><strong>Coste Staff</strong></td><td>0 €</td><td style="color:#e11d48;">-${mHelpersCost} €</td></tr>` : ''}
                            <tr>
                                <td><strong>Costes totales</strong></td>
                                <td>65 €</td>
                                <td style="color:#e11d48; font-weight:700;">-${mTotalCost.toFixed(0)} €</td>
                            </tr>
                            <tr class="row-net-profit">
                                <td><strong>Beneficio neto</strong></td>
                                <td><strong>50 € por americana</strong> <span style="font-size:0.65rem; font-weight:normal;">(55€ si amortizadas)</span></td>
                                <td><strong style="font-size:1.1rem; color:#15803d;">+${mNetProfit.toFixed(0)} € por americana</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- TOGGLE DE NEGOCIACIÓN DE PISTAS DE MAÑANA -->
                    <div style="margin-top:10px; padding:8px 10px; background:#f8fafc; border:1px solid var(--erp-border); border-radius:8px; font-size:0.72rem; color:var(--erp-text-muted);">
                        <strong>Condición de Alquiler Pactada:</strong>
                        <div style="margin-top:4px; display:flex; gap:12px; flex-wrap:wrap;">
                            <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                                <input type="radio" name="court_neg_m" value="block_12" ${sim.courtNegotiationMorning === 'block_12' ? 'checked' : ''} onchange="window.OrganizacionERP.updateNppSim('courtNegotiationMorning', this.value)"> 
                                <span><strong>Pacto Alex:</strong> 12€ bloque de 90m (60€ con 5 pist.)</span>
                            </label>
                            <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                                <input type="radio" name="court_neg_m" value="hourly_12" ${sim.courtNegotiationMorning === 'hourly_12' ? 'checked' : ''} onchange="window.OrganizacionERP.updateNppSim('courtNegotiationMorning', this.value)"> 
                                <span><strong>Tarifa hora:</strong> 12€/h (18€/pist. = 90€ con 5 pist.)</span>
                            </label>
                        </div>
                    </div>

                    <div style="background:#f0fdf4; padding:8px 12px; border-radius:8px; font-size:0.75rem; border:1px solid #bbf7d0; display:flex; justify-content:space-between; margin-top:10px;">
                        <span>Limpio Alex: <strong style="color:#0284c7;">+${alexMorningNet.toFixed(2)} €</strong></span>
                        <span>Limpio Socio: <strong style="color:#9333ea;">+${socioMorningNet.toFixed(2)} €</strong></span>
                    </div>
                </div>
                ` : ''}

                <!-- ========================================================== -->
                <!-- OPCIÓN 2: FRANJA 2 - AMERICANAS DE VIERNES NOCHE (OCIO)     -->
                <!-- ========================================================== -->
                ${optView === 'friday' || optView === 'both' ? `
                <div class="erp-card" style="border-top:4px solid #16a34a; background:#ffffff;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid var(--erp-border); padding-bottom:8px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="traffic-badge green" style="font-size:0.65rem;">3. PROPUESTA OFICIAL</span>
                                <span style="font-size:0.75rem; color:var(--erp-text-dim); font-weight:700;">OCIO & FIN DE SEMANA</span>
                            </div>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.15rem; font-weight:900; color:#0f172a; margin-top:2px;">
                                🌙 Franja 2: Americanas de Viernes Noche
                            </h3>
                        </div>
                        <div style="text-align:right;">
                            <span class="traffic-badge green" style="font-size:0.7rem;">+${fNetProfit.toFixed(0)} € limpios</span>
                        </div>
                    </div>

                    <!-- CANCHAS VISUALES DE PÁDEL (1 A 5 PISTAS MÁXIMO) -->
                    ${renderPadelCourtsVisual(fCourts, 'friday')}

                    <!-- SELECTOR RÁPIDO DE CHIPS Y STEPPER -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                        <div class="counter-stepper">
                            <button onclick="window.OrganizacionERP.stepCourts('friday', -1)" title="Restar 1 pista">−</button>
                            <span>${fCourts} / 5 pist.</span>
                            <button onclick="window.OrganizacionERP.stepCourts('friday', 1)" title="Añadir 1 pista">+</button>
                        </div>
                        <div class="chip-selector" style="margin-top:0;">
                            ${[1, 2, 3, 4, 5].map(c => `
                                <button class="chip-btn ${fCourts === c ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('fridayCourts', ${c})">
                                    ${c} ${c === 1 ? 'pista' : 'pist.'} ${c === 5 ? '★ MÁX' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- GRÁFICO VISUAL DE BARRAS DE ESTA FRANJA -->
                    ${renderFinancialBarVisual(fIncome, fCourtCost, fBallsCost, fHelpersCost, fNetProfit, fMargin, false)}

                    <!-- TABLA EXACTA DE LA PROPUESTA OFICIAL (COMO EN LA CAPTURA) -->
                    <table class="proposal-table-official">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Propuesta Oficial</th>
                                <th>Simulación Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Formato</strong></td>
                                <td>120 minutos / 2 horas (ej. 20:30–22:30 h)</td>
                                <td>120 minutos (2h)</td>
                            </tr>
                            <tr>
                                <td><strong>Capacidad base</strong></td>
                                <td>5 pistas · 20 jugadores</td>
                                <td><strong style="color:#16a34a;">${fCourts} pistas · ${fPlayers} jugadores</strong> (Máx. 5 pistas)</td>
                            </tr>
                            <tr>
                                <td><strong>Precio al jugador</strong></td>
                                <td>12 € / persona</td>
                                <td>${fPrice} € / persona</td>
                            </tr>
                            <tr>
                                <td><strong>Ingresos brutos</strong></td>
                                <td>240 €</td>
                                <td><strong>${fIncome} €</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Coste de pista</strong></td>
                                <td>12 € / hora / pista · 24 € por pista · 120 € total</td>
                                <td>12 € / h · 24 € / pista · ${fCourtCost} € total</td>
                            </tr>
                            <tr>
                                <td><strong>Coste de material</strong></td>
                                <td>≈ 5 €</td>
                                <td>≈ ${fBallsCost.toFixed(0)} €</td>
                            </tr>
                            ${fHelpersCost > 0 ? `<tr><td><strong>Coste Staff</strong></td><td>0 €</td><td style="color:#e11d48;">-${fHelpersCost} €</td></tr>` : ''}
                            <tr>
                                <td><strong>Costes totales</strong></td>
                                <td>125 €</td>
                                <td style="color:#e11d48; font-weight:700;">-${fTotalCost.toFixed(0)} €</td>
                            </tr>
                            <tr class="row-net-profit">
                                <td><strong>Beneficio neto</strong></td>
                                <td><strong>115 € por americana</strong></td>
                                <td><strong style="font-size:1.1rem; color:#15803d;">+${fNetProfit.toFixed(0)} € por americana</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-top:10px; padding:8px 10px; background:#f8fafc; border:1px solid var(--erp-border); border-radius:8px; font-size:0.72rem; color:var(--erp-text-muted);">
                        🎾 <strong>Horario Valle Ocio:</strong> 2 horas completas (20:30 a 22:30) en las 5 pistas. Consumo en cafetería íntegro para el club.
                    </div>

                    <div style="background:#f0fdf4; padding:8px 12px; border-radius:8px; font-size:0.75rem; border:1px solid #bbf7d0; display:flex; justify-content:space-between; margin-top:10px;">
                        <span>Limpio Alex: <strong style="color:#0284c7;">+${alexFridayNet.toFixed(2)} €</strong></span>
                        <span>Limpio Socio: <strong style="color:#9333ea;">+${socioFridayNet.toFixed(2)} €</strong></span>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- ============================================================== -->
            <!-- MODELO DE REPARTO & CONFIGURACIÓN DE SOCIOS                    -->
            <!-- ============================================================== -->
            <div class="erp-card" style="margin-bottom:1.5rem; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                    <div>
                        <h4 class="erp-card-title"><i class="fas fa-handshake-simple"></i> Modelo de Reparto y Quién Hace la Americana</h4>
                        <p class="erp-card-subtitle">Asigna cómo se distribuyen las ganancias limpias entre Alex y el Socio</p>
                    </div>
                    <span style="font-size:0.75rem; color:#15803d; font-weight:700;">
                        💡 ${sharingLabel}
                    </span>
                </div>

                <div class="sharing-cards-grid">
                    <div class="sharing-card ${sim.sharingMode === '50_50' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '50_50')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.82rem; color:var(--erp-text-main);">⚖️ 50% / 50% Ambos</strong>
                            <span class="traffic-badge green" style="font-size:0.6rem;">Paritario</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--erp-text-muted); margin-top:4px;">
                            Reparto paritario societario o ambos presenciales en pista.
                        </div>
                    </div>

                    <div class="sharing-card ${sim.sharingMode === '100_alex' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '100_alex')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.82rem; color:#0284c7;">👤 100% Alex</strong>
                            <span class="traffic-badge blue" style="font-size:0.6rem; background:#e0f2fe; color:#0369a1;">Alex en pista</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--erp-text-muted); margin-top:4px;">
                            Alex la asume presencial íntegra y percibe el 100% del dinero limpio.
                        </div>
                    </div>

                    <div class="sharing-card ${sim.sharingMode === '100_socio' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '100_socio')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.82rem; color:#9333ea;">👤 100% Socio</strong>
                            <span class="traffic-badge purple" style="font-size:0.6rem; background:#f3e8ff; color:#7e22ce;">Socio en pista</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--erp-text-muted); margin-top:4px;">
                            El socio la asume presencial íntegra y percibe el 100% del dinero limpio.
                        </div>
                    </div>

                    <div class="sharing-card ${sim.sharingMode === '60_alex_40_socio' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '60_alex_40_socio')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.82rem; color:var(--erp-text-main);">60% Alex / 40% Socio</strong>
                            <span class="traffic-badge green" style="font-size:0.6rem;">Presencial</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--erp-text-muted); margin-top:4px;">
                            Alex presencial en pista (60%) / Socio difusión remota (40%).
                        </div>
                    </div>

                    <div class="sharing-card ${sim.sharingMode === '60_socio_40_alex' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '60_socio_40_alex')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.82rem; color:var(--erp-text-main);">60% Socio / 40% Alex</strong>
                            <span class="traffic-badge green" style="font-size:0.6rem;">Presencial</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--erp-text-muted); margin-top:4px;">
                            Socio presencial en pista (60%) / Alex difusión remota (40%).
                        </div>
                    </div>

                    <div class="sharing-card ${sim.sharingMode === 'with_helper' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', 'helpers_with_100_alex')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.82rem; color:#0284c7;">Ayudante + Alex</strong>
                            <span class="traffic-badge blue" style="font-size:0.6rem; background:#e0f2fe; color:#0369a1;">Supervisado</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--erp-text-muted); margin-top:4px;">
                            Ayudante en pista (coste restado) y Alex supervisa la americana.
                        </div>
                    </div>
                </div>

                <!-- AYUDANTES STAFF -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; background:#ffffff; padding:12px; border-radius:10px; border:1px solid var(--erp-border);">
                    <div>
                        <label style="font-size:0.72rem; font-weight:800; color:var(--erp-text-main); display:block; margin-bottom:4px;">
                            👥 Ayudantes Mañanas (25€ / americana):
                        </label>
                        <div class="chip-selector">
                            ${[0, 1, 2].map(num => `
                                <button class="chip-btn ${mHelpersCount === num ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('morningHelpersCount', ${num})">
                                    ${num === 0 ? 'Sin ayudante (0€)' : `${num} ayudante (${num * 25}€)`}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <label style="font-size:0.72rem; font-weight:800; color:var(--erp-text-main); display:block; margin-bottom:4px;">
                            👥 Ayudantes Viernes (35€ / americana):
                        </label>
                        <div class="chip-selector">
                            ${[0, 1, 2].map(num => `
                                <button class="chip-btn ${fHelpersCount === num ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('fridayHelpersCount', ${num})">
                                    ${num === 0 ? 'Sin ayudante (0€)' : `${num} ayudante (${num * 35}€)`}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- CUADRO EJECUTIVO: DINERO LIMPIO & GANANCIAS POR SOCIO -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
                <!-- FACTURACIÓN BRUTA -->
                <div class="erp-card" style="border-top:4px solid #0f172a;">
                    <div style="font-size:0.72rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Facturación Bruta Mensual</div>
                    <div class="erp-money" style="font-size:1.8rem; color:var(--erp-text-main); margin:4px 0;">${totalMonthlyIncome.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">${(mPlayers * mEvents) + (fPlayers * fEvents)} inscripciones al mes</div>
                </div>

                <!-- COSTES TOTALES -->
                <div class="erp-card" style="border-top:4px solid #e11d48;">
                    <div style="font-size:0.72rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Costes Operativos Totales</div>
                    <div class="erp-money negative" style="font-size:1.8rem; margin:4px 0;">-${totalMonthlyCosts.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">
                        Pistas: ${totalMonthlyCourtCosts}€ • Bolas: ${totalMonthlyBallsCosts.toFixed(0)}€ ${totalMonthlyHelpersCosts > 0 ? `• Staff: ${totalMonthlyHelpersCosts}€` : ''}
                    </div>
                </div>

                <!-- DINERO LIMPIO TOTAL SOCIEDAD -->
                <div class="erp-card" style="border-top:4px solid #16a34a; background:linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
                    <div style="font-size:0.72rem; color:#166534; text-transform:uppercase; font-weight:800;">Beneficio Neto Limpio Total</div>
                    <div class="erp-money positive" style="font-size:2rem; margin:4px 0;">+${totalMonthlyNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</div>
                    <div style="font-size:0.75rem; color:#15803d; font-weight:700;">
                        ${totalMonthlyMargin.toFixed(1)}% Margen Neto Limpio
                    </div>
                </div>

                <!-- DINERO LIMPIO PARA ALEX -->
                <div class="erp-card" style="border-top:4px solid #0284c7; background:linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-size:0.72rem; color:#0369a1; text-transform:uppercase; font-weight:800;">Dinero Limpio Para Alex</div>
                        ${alexHourlyRate > 0 ? `<span class="traffic-badge blue" style="font-size:0.65rem; background:#e0f2fe; color:#0369a1;">${alexHourlyRate.toFixed(1)}€/h</span>` : ''}
                    </div>
                    <div class="erp-money" style="font-size:2rem; color:#0284c7; margin:4px 0;">+${alexMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">
                        <strong>${(alexMonthlyNet * 12).toLocaleString('es-ES')} € al año</strong>
                    </div>
                </div>

                <!-- DINERO LIMPIO PARA EL SOCIO -->
                <div class="erp-card" style="border-top:4px solid #9333ea; background:linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-size:0.72rem; color:#7e22ce; text-transform:uppercase; font-weight:800;">Dinero Limpio Para el Socio</div>
                        ${socioHourlyRate > 0 ? `<span class="traffic-badge purple" style="font-size:0.65rem; background:#f3e8ff; color:#7e22ce;">${socioHourlyRate.toFixed(1)}€/h</span>` : ''}
                    </div>
                    <div class="erp-money" style="font-size:2rem; color:#9333ea; margin:4px 0;">+${socioMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">
                        <strong>${(socioMonthlyNet * 12).toLocaleString('es-ES')} € al año</strong>
                    </div>
                </div>
            </div>
            ` : `
            <!-- MATRIZ COMPARATIVA DE ESCENARIOS (SIDE-BY-SIDE) -->
            <div class="erp-card" style="margin-bottom:1.5rem;">
                <div class="erp-card-header">
                    <div>
                        <h3 class="erp-card-title"><i class="fas fa-table-columns"></i> Matriz Estratégica Comparativa de Escenarios</h3>
                        <p class="erp-card-subtitle">Compara en una sola tabla cuánto se gana según el volumen de pistas, ayudantes y modelo de reparto</p>
                    </div>
                </div>

                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Escenario</th>
                                <th>Pistas & Jugadores</th>
                                <th>Ayudantes</th>
                                <th>Reparto Socios</th>
                                <th>Facturación Mensual</th>
                                <th>Coste Club</th>
                                <th>Coste Staff</th>
                                <th>Dinero Limpio Total</th>
                                <th>Limpio Alex / Mes</th>
                                <th>Limpio Socio / Mes</th>
                                <th>Margen</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- ESCENARIO 1: PILOTO ESTÁNDAR 5 PISTAS (50/50) -->
                            <tr>
                                <td>
                                    <strong style="color:var(--erp-text-main);">1. Piloto Estándar (5 Pistas)</strong>
                                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">4 mañanas + 4 viernes · Reparto 50/50</div>
                                </td>
                                <td>5 pistas (20 jug.)</td>
                                <td>0 ayudantes</td>
                                <td>50% Alex / 50% Socio</td>
                                <td class="erp-money">1.440,00 €</td>
                                <td class="erp-money negative">720,00 €</td>
                                <td class="erp-money">0,00 €</td>
                                <td class="erp-money positive"><strong>+660,00 €</strong></td>
                                <td class="erp-money" style="color:#0284c7; font-size:1.05rem;"><strong>+330,00 €</strong></td>
                                <td class="erp-money" style="color:#9333ea; font-size:1.05rem;"><strong>+330,00 €</strong></td>
                                <td><span class="traffic-badge green">45.8%</span></td>
                            </tr>

                            <!-- ESCENARIO 2: 100% ALEX (5 PISTAS) -->
                            <tr style="background:#f0f9ff;">
                                <td>
                                    <strong style="color:#0284c7;">2. Alex 100% Presencial</strong>
                                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">Alex asume todas las americanas presenciales</div>
                                </td>
                                <td>5 pistas (20 jug.)</td>
                                <td>0 ayudantes</td>
                                <td><strong style="color:#0284c7;">100% Alex</strong></td>
                                <td class="erp-money">1.440,00 €</td>
                                <td class="erp-money negative">720,00 €</td>
                                <td class="erp-money">0,00 €</td>
                                <td class="erp-money positive"><strong>+660,00 €</strong></td>
                                <td class="erp-money" style="color:#0284c7; font-size:1.05rem;"><strong>+660,00 €</strong></td>
                                <td class="erp-money" style="color:var(--erp-text-dim);">0,00 €</td>
                                <td><span class="traffic-badge green">45.8%</span></td>
                            </tr>

                            <!-- ESCENARIO 3: 100% SOCIO (5 PISTAS) -->
                            <tr style="background:#faf5ff;">
                                <td>
                                    <strong style="color:#9333ea;">3. Socio 100% Presencial</strong>
                                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">El socio asume todas las americanas presenciales</div>
                                </td>
                                <td>5 pistas (20 jug.)</td>
                                <td>0 ayudantes</td>
                                <td><strong style="color:#9333ea;">100% Socio</strong></td>
                                <td class="erp-money">1.440,00 €</td>
                                <td class="erp-money negative">720,00 €</td>
                                <td class="erp-money">0,00 €</td>
                                <td class="erp-money positive"><strong>+660,00 €</strong></td>
                                <td class="erp-money" style="color:var(--erp-text-dim);">0,00 €</td>
                                <td class="erp-money" style="color:#9333ea; font-size:1.05rem;"><strong>+660,00 €</strong></td>
                                <td><span class="traffic-badge green">45.8%</span></td>
                            </tr>

                            <!-- ESCENARIO 4: 60% ALEX (PISTA) / 40% SOCIO (REMOTO) -->
                            <tr>
                                <td>
                                    <strong style="color:var(--erp-text-main);">4. Regla 60/40 (Alex Pista / Socio Remoto)</strong>
                                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">Tabla Oficial PDF: 30€/20€ mañanas, 69€/46€ viernes</div>
                                </td>
                                <td>5 pistas (20 jug.)</td>
                                <td>0 ayudantes</td>
                                <td>60% Alex / 40% Socio</td>
                                <td class="erp-money">1.440,00 €</td>
                                <td class="erp-money negative">720,00 €</td>
                                <td class="erp-money">0,00 €</td>
                                <td class="erp-money positive"><strong>+660,00 €</strong></td>
                                <td class="erp-money" style="color:#0284c7; font-size:1.05rem;"><strong>+396,00 €</strong></td>
                                <td class="erp-money" style="color:#9333ea; font-size:1.05rem;"><strong>+264,00 €</strong></td>
                                <td><span class="traffic-badge green">45.8%</span></td>
                            </tr>

                            <!-- ESCENARIO 5: 60% SOCIO (PISTA) / 40% ALEX (REMOTO) -->
                            <tr style="background:#faf5ff;">
                                <td>
                                    <strong style="color:#7e22ce;">5. Regla 60/40 (Socio Pista / Alex Remoto)</strong>
                                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">Tabla Oficial PDF: Socio presencial 60%, Alex 40%</div>
                                </td>
                                <td>5 pistas (20 jug.)</td>
                                <td>0 ayudantes</td>
                                <td>60% Socio / 40% Alex</td>
                                <td class="erp-money">1.440,00 €</td>
                                <td class="erp-money negative">720,00 €</td>
                                <td class="erp-money">0,00 €</td>
                                <td class="erp-money positive"><strong>+660,00 €</strong></td>
                                <td class="erp-money" style="color:#0284c7; font-size:1.05rem;"><strong>+264,00 €</strong></td>
                                <td class="erp-money" style="color:#9333ea; font-size:1.05rem;"><strong>+396,00 €</strong></td>
                                <td><span class="traffic-badge green">45.8%</span></td>
                            </tr>

                            <!-- ESCENARIO 6: 100% PASIVO / COORDINADOR EXTERNO (ESCALABILIDAD) -->
                            <tr style="background:#f0fdf4;">
                                <td>
                                    <strong style="color:#15803d;">6. 100% Pasivo (Coordinador Externo Fijo)</strong>
                                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">Tabla Oficial PDF: 25€ mañanas / 35€ viernes (240€/m)</div>
                                </td>
                                <td>5 pistas (20 jug.)</td>
                                <td><strong>Coordinador externo (240€/m)</strong></td>
                                <td>50% Alex / 50% Socio</td>
                                <td class="erp-money">1.440,00 €</td>
                                <td class="erp-money negative">720,00 €</td>
                                <td class="erp-money negative">240,00 €</td>
                                <td class="erp-money positive"><strong>+420,00 €</strong></td>
                                <td class="erp-money" style="color:#0284c7; font-size:1.05rem;"><strong>+210,00 €</strong> <span style="font-size:0.65rem; color:#15803d; font-weight:800;">PASIVO</span></td>
                                <td class="erp-money" style="color:#9333ea; font-size:1.05rem;"><strong>+210,00 €</strong> <span style="font-size:0.65rem; color:#15803d; font-weight:800;">PASIVO</span></td>
                                <td><span class="traffic-badge green">29.2%</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            `}

            <!-- HOJA DE RUTA Y ARGUMENTOS PARA LA REUNIÓN CON EL CLUB -->
            <div class="erp-card">
                <div class="erp-card-header">
                    <div>
                        <h3 class="erp-card-title"><i class="fas fa-list-check"></i> Hoja de Ruta para la Reunión con New Padel Pro</h3>
                        <p class="erp-card-subtitle">Puntos estratégicos para que Alex y su socio cierren el mejor acuerdo</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem;">
                    <div style="padding:14px; background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px;">
                        <div style="font-weight:900; font-size:0.9rem; color:#0f172a; margin-bottom:6px;">
                            1. Propuesta Piloto Controlado
                        </div>
                        <p style="font-size:0.78rem; color:var(--erp-text-muted);">
                            Miércoles 10:00 h y viernes 20:30 h. 4 semanas de prueba para validar que llenamos las pistas y que el bar factura.
                        </p>
                    </div>

                    <div style="padding:14px; background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px;">
                        <div style="font-weight:900; font-size:0.9rem; color:#0f172a; margin-bottom:6px;">
                            2. Anclaje de Pista en Mañana
                        </div>
                        <p style="font-size:0.78rem; color:var(--erp-text-muted);">
                            Solicitar 12 € / pista para el bloque de 90 min. Garantizamos ocupar 5 pistas en horas donde el club tiene 0 € de ocupación.
                        </p>
                    </div>

                    <div style="padding:14px; background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px;">
                        <div style="font-weight:900; font-size:0.9rem; color:#0f172a; margin-bottom:6px;">
                            3. Tráfico Playtomic Oficial
                        </div>
                        <p style="font-size:0.78rem; color:var(--erp-text-muted);">
                            El club publica la americana en su perfil de Playtomic y nosotros aportamos nuestra base de datos de jugadores.
                        </p>
                    </div>

                    <div style="padding:14px; background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px;">
                        <div style="font-weight:900; font-size:0.9rem; color:#0f172a; margin-bottom:6px;">
                            4. Consumo Directo en Bar
                        </div>
                        <p style="font-size:0.78rem; color:var(--erp-text-muted);">
                            Hasta 20 consumiciones potenciales en barra por evento (160 consumiciones aseguradas al mes para su cafetería).
                        </p>
                    </div>
                </div>
            </div>
            `}
        `;
    }

    function applyPreset(presetKey) {
        state.nppSimulator.activePreset = presetKey;
        switch (presetKey) {
            case 'pilot_50_50':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 0;
                state.nppSimulator.sharingMode = '50_50';
                break;
            case 'alex_full':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 0;
                state.nppSimulator.sharingMode = '100_alex';
                break;
            case 'socio_full':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 0;
                state.nppSimulator.sharingMode = '100_socio';
                break;
            case 'split_60_40':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 0;
                state.nppSimulator.sharingMode = '60_alex_40_socio';
                break;
            case 'split_60_socio':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 0;
                state.nppSimulator.sharingMode = '60_socio_40_alex';
                break;
            case 'with_helper':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 1;
                state.nppSimulator.sharingMode = '50_50';
                break;
            case 'passive_mode':
                state.nppSimulator.morningCourts = 5;
                state.nppSimulator.fridayCourts = 5;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 1;
                state.nppSimulator.fridayHelpersCount = 1;
                state.nppSimulator.sharingMode = '50_50';
                break;
            case 'courts_4':
                state.nppSimulator.morningCourts = 4;
                state.nppSimulator.fridayCourts = 4;
                state.nppSimulator.morningPlayerPrice = 6;
                state.nppSimulator.fridayPlayerPrice = 12;
                state.nppSimulator.courtNegotiationMorning = 'block_12';
                state.nppSimulator.fridayCourtRatePerHour = 12;
                state.nppSimulator.morningHelpersCount = 0;
                state.nppSimulator.fridayHelpersCount = 0;
                state.nppSimulator.sharingMode = '50_50';
                break;
            default:
                break;
        }
        renderActiveTab();
    }

    function stepCourts(slot, delta) {
        if (slot === 'morning') {
            const cur = state.nppSimulator.morningCourts || 5;
            state.nppSimulator.morningCourts = Math.max(1, Math.min(5, cur + delta));
        } else if (slot === 'friday') {
            const cur = state.nppSimulator.fridayCourts || 5;
            state.nppSimulator.fridayCourts = Math.max(1, Math.min(5, cur + delta));
        }
        state.nppSimulator.activePreset = null;
        renderActiveTab();
    }

    function updateNppSim(param, value) {
        if (param !== 'targetMonthlyGoal' && param !== 'viewDetailMode' && param !== 'selectedEventDetail') {
            state.nppSimulator.activePreset = null;
        }
        if (param === 'sharingMode') {
            state.nppSimulator.sharingMode = value;
        } else if (param === 'morningCourts') {
            state.nppSimulator.morningCourts = Math.min(5, Math.max(1, parseInt(value)));
        } else if (param === 'fridayCourts') {
            state.nppSimulator.fridayCourts = Math.min(5, Math.max(1, parseInt(value)));
        } else if (param === 'morningHelpersCount') {
            state.nppSimulator.morningHelpersCount = parseInt(value);
        } else if (param === 'fridayHelpersCount') {
            state.nppSimulator.fridayHelpersCount = parseInt(value);
        } else if (param === 'courtNegotiationMorning') {
            state.nppSimulator.courtNegotiationMorning = value;
        } else if (param === 'mornings') {
            state.nppSimulator.morningEventsPerMonth = parseInt(value);
        } else if (param === 'fridays') {
            state.nppSimulator.fridayEventsPerMonth = parseInt(value);
        } else if (param === 'targetMonthlyGoal') {
            state.nppSimulator.targetMonthlyGoal = parseFloat(value) || 660;
        } else if (param === 'viewDetailMode') {
            state.nppSimulator.viewDetailMode = value;
        } else if (param === 'selectedEventDetail') {
            state.nppSimulator.selectedEventDetail = value;
        }
        renderActiveTab();
    }

    function setNppSection(sectionName) {
        state.nppSimulator.activeTabSection = sectionName;
        renderActiveTab();
    }

    function setDashboardSubTab(subTab) {
        state.dashboardSubTab = subTab;
        renderActiveTab();
    }

    // ==========================================================================
    // 5.5 PACTÓMETRO ELECTORAL DE NEGOCIO (ESTILO 'LA SEXTA' / FERRERAS)
    // ==========================================================================
    function renderPactometroDashboardView() {
        const clubNames = Object.keys(state.clubs).sort((a, b) => {
            if (a === 'New Padel Pro') return -1;
            if (b === 'New Padel Pro') return 1;
            return (state.clubs[b].marginPct || 0) - (state.clubs[a].marginPct || 0);
        });

        // 1. Pestañas de clubes arriba (Sedes diferenciadas + Consolidada)
        const tabsBarHtml = `
            <div class="club-tabs-nav" style="margin-bottom:0.45rem;">
                ${clubNames.map(name => {
                    const c = state.clubs[name] || {};
                    const isActive = state.activeClubTab === name;
                    const badgeClass = c.trafficStatus || 'green';
                    const courtsTxt = name === 'New Padel Pro' ? '5 PISTAS' : `${c.courts || 5} PISTAS`;
                    return `
                        <button class="club-tab-pill ${isActive ? 'active' : ''}" onclick="window.OrganizacionERP.selectClubTab('${escapeHtml(name)}')">
                            <i class="fas fa-table-tennis-paddle-ball"></i>
                            <span>${escapeHtml(name)}</span>
                            <span class="traffic-badge ${badgeClass}" style="font-size:0.6rem; padding:2px 6px;">${courtsTxt}</span>
                        </button>
                    `;
                }).join('')}

                <button class="club-tab-pill ${state.activeClubTab === 'all' ? 'active' : ''}" onclick="window.OrganizacionERP.selectClubTab('all')">
                    <i class="fas fa-network-wired"></i>
                    <span>Vista Consolidada (Red)</span>
                    <span class="traffic-badge green" style="font-size:0.6rem; padding:2px 6px;">${clubNames.length} SEDES</span>
                </button>

                <button class="club-tab-pill-add" onclick="window.OrganizacionERP.openNewClubModal()">
                    <i class="fas fa-plus"></i>
                    <span>+ Añadir Nuevo Club</span>
                </button>
            </div>
        `;

        // Si el usuario tiene seleccionada 'Vista Consolidada' o un club que no es New Padel Pro
        if (state.activeClubTab === 'all') {
            return tabsBarHtml + renderAllClubsConsolidatedView();
        } else if (state.activeClubTab !== 'New Padel Pro') {
            const selectedClub = state.clubs[state.activeClubTab] || Object.values(state.clubs)[0];
            return tabsBarHtml + renderClubDetailView(selectedClub);
        }

        // Renderizado del Pactómetro Interactivo Oficial de New Padel Pro
        const sim = state.nppSimulator;
        const mCourts = Math.min(5, Math.max(1, sim.morningCourts || 5));
        const mPlayers = mCourts * 4;
        const mPrice = sim.morningPlayerPrice || 6;
        const mIncome = mPlayers * mPrice;
        const mCourtCost = sim.courtNegotiationMorning === 'block_12' ? (mCourts * 12) : (mCourts * 18);
        const mBallsCost = 5;
        const mHelpersCount = sim.morningHelpersCount || 0;
        const mHelpersCost = mHelpersCount * (sim.helperFeeMorning || 25);
        const mReserve = (mCourts === 5 && sim.courtNegotiationMorning === 'block_12' && mHelpersCount === 0) ? 5 : 0;
        const mTotalCost = mCourtCost + mBallsCost + mHelpersCost + mReserve;
        const mNetProfit = mIncome - mTotalCost;

        const fCourts = Math.min(5, Math.max(1, sim.fridayCourts || 5));
        const fPlayers = fCourts * 4;
        const fPrice = sim.fridayPlayerPrice || 12;
        const fIncome = fPlayers * fPrice;
        const fCourtCost = fCourts * 2 * (sim.fridayCourtRatePerHour || 12);
        const fBallsCost = 5;
        const fHelpersCount = sim.fridayHelpersCount || 0;
        const fHelpersCost = fHelpersCount * (sim.helperFeeFriday || 35);
        const fTotalCost = fCourtCost + fBallsCost + fHelpersCost;
        const fNetProfit = fIncome - fTotalCost;

        const mEvents = sim.morningEventsPerMonth || 4;
        const fEvents = sim.fridayEventsPerMonth || 4;
        const totalMonthlyIncome = (mEvents * mIncome) + (fEvents * fIncome);
        const totalMonthlyCourtCosts = (mEvents * mCourtCost) + (fEvents * fCourtCost);
        const totalMonthlyBallsCosts = (mEvents * mBallsCost) + (fEvents * fBallsCost);
        const totalMonthlyHelpersCosts = (mEvents * mHelpersCost) + (fEvents * fHelpersCost);
        const totalMonthlyCosts = totalMonthlyCourtCosts + totalMonthlyBallsCosts + totalMonthlyHelpersCosts + (mEvents * mReserve);
        const totalMonthlyNetProfit = totalMonthlyIncome - totalMonthlyCosts;
        const totalMonthlyMargin = totalMonthlyIncome > 0 ? (totalMonthlyNetProfit / totalMonthlyIncome) * 100 : 0;

        let alexMorningNet = 0;
        let socioMorningNet = 0;
        let alexFridayNet = 0;
        let socioFridayNet = 0;
        let pactoTitle = 'Reparto Paritario 50% Alex / 50% Xavi Perea';

        switch (sim.sharingMode) {
            case '100_alex':
                alexMorningNet = mNetProfit;
                socioMorningNet = 0;
                alexFridayNet = fNetProfit;
                socioFridayNet = 0;
                pactoTitle = '100% Alex Presencial (Alex en pista)';
                break;
            case '100_socio':
                alexMorningNet = 0;
                socioMorningNet = mNetProfit;
                alexFridayNet = 0;
                socioFridayNet = fNetProfit;
                pactoTitle = '100% Xavi Perea Presencial (Xavi en pista)';
                break;
            case '60_alex_40_socio':
                alexMorningNet = mNetProfit * 0.60;
                socioMorningNet = mNetProfit * 0.40;
                alexFridayNet = fNetProfit * 0.60;
                socioFridayNet = fNetProfit * 0.40;
                pactoTitle = '60% Alex (Pista) / 40% Xavi Perea (Remoto)';
                break;
            case '60_socio_40_alex':
                alexMorningNet = mNetProfit * 0.40;
                socioMorningNet = mNetProfit * 0.60;
                alexFridayNet = fNetProfit * 0.40;
                socioFridayNet = fNetProfit * 0.60;
                pactoTitle = '60% Xavi Perea (Pista) / 40% Alex (Remoto)';
                break;
            case 'coordinator_passive':
            case 'passive_mode':
                alexMorningNet = mNetProfit * 0.50;
                socioMorningNet = mNetProfit * 0.50;
                pactoTitle = '100% Pasivo (Coordinador Externo Fijo)';
                break;
            case '50_50':
            default:
                alexMorningNet = mNetProfit * 0.50;
                socioMorningNet = mNetProfit * 0.50;
                pactoTitle = 'Reparto Paritario: 50% Alex / 50% Xavi Perea';
                break;
        }

        const alexMonthlyNet = (mEvents * alexMorningNet) + (fEvents * alexFridayNet);
        const socioMonthlyNet = (mEvents * socioMorningNet) + (fEvents * socioFridayNet);

        const totalCourtHours = (mEvents * 1.5) + (fEvents * 2.0); // 14h
        const alexHourlyRate = totalCourtHours > 0 ? (alexMonthlyNet / totalCourtHours) : 0;
        const socioHourlyRate = totalCourtHours > 0 ? (socioMonthlyNet / totalCourtHours) : 0;

        // Meta de Beneficio Mensual
        const targetGoal = sim.targetMonthlyGoal || 660;
        const pctAchieved = Math.min(100, Math.max(0, (totalMonthlyNetProfit / targetGoal) * 100));
        const isGoalMet = totalMonthlyNetProfit >= targetGoal;
        const diffToGoal = totalMonthlyNetProfit - targetGoal;

        // Estilos del indicador de objetivo
        let barColor = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
        let statusClass = 'success';
        let statusTitle = `🟢 ¡OBJETIVO MENSUAL ALCANZADO! (+${totalMonthlyNetProfit.toFixed(0)} € / mes limpios)`;
        let statusSub = `Superas la meta fijada de ${targetGoal.toFixed(0)} € por +${diffToGoal.toFixed(0)} €. Este acuerdo garantiza máxima rentabilidad para Alex y Xavi Perea.`;

        if (pctAchieved < 75) {
            barColor = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
            statusClass = 'danger';
            statusTitle = `🔴 BENEFICIO POR DEBAJO DEL OBJETIVO (${pctAchieved.toFixed(0)}%)`;
            statusSub = `Faltan ${Math.abs(diffToGoal).toFixed(0)} € para alcanzar los ${targetGoal.toFixed(0)} € mensuales fijados. Sube pistas o ajusta el reparto entre Alex y Xavi.`;
        } else if (!isGoalMet) {
            barColor = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
            statusClass = 'warning';
            statusTitle = `🟡 CERCA DEL OBJETIVO (${pctAchieved.toFixed(0)}% DE LA META)`;
            statusSub = `Faltan tan solo ${Math.abs(diffToGoal).toFixed(0)} € para el objetivo de ${targetGoal.toFixed(0)} €. Una pista adicional cerraría la cifra con solvencia para ambos socios.`;
        }

        // Posición del marcador de meta (normalizado)
        const targetMarkerPos = 100; // La meta siempre es el 100% de la barra

        // ======================================================================
        // CÁLCULOS UNITARIOS: DETALLE AMERICANA POR AMERICANA
        // ======================================================================
        const viewMode = sim.viewDetailMode || 'monthly';
        const isPerEvent = viewMode === 'per_event';
        const detailFilter = sim.selectedEventDetail || 'both';

        // Ganancias por evento de la sede (alquiler de pistas + beneficio de bar estimado de ~50€/evento)
        const mNppEventGain = mCourtCost + 50;
        const fNppEventGain = fCourtCost + 50;

        // Medias unitarias ponderadas (sobre las 8 americanas = 4 mañanas + 4 viernes)
        const totalEventsCount = mEvents + fEvents;
        const avgEventIncome = totalEventsCount > 0 ? (totalMonthlyIncome / totalEventsCount) : 0;
        const avgEventCosts = totalEventsCount > 0 ? (totalMonthlyCosts / totalEventsCount) : 0;
        const avgEventNetProfit = totalEventsCount > 0 ? (totalMonthlyNetProfit / totalEventsCount) : 0;
        const avgAlexNet = totalEventsCount > 0 ? (alexMonthlyNet / totalEventsCount) : 0;
        const avgSocioNet = totalEventsCount > 0 ? (socioMonthlyNet / totalEventsCount) : 0;
        const avgNppGain = totalEventsCount > 0 ? ((totalMonthlyCourtCosts + 400) / totalEventsCount) : 0;

        // Variables dinámicas para el Termómetro y los 4 Marcadores de Socios
        let displayNetProfit = totalMonthlyNetProfit;
        let displayNetSub = `/ mes (${totalMonthlyMargin.toFixed(1)}% margen)`;
        let displayNetTitle = 'TERMÓMETRO DE BENEFICIO NETO MENSUAL';
        let displayAlex = `+${alexMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
        let displayAlexSub = `Rendimiento: <strong style="color:#0284c7;">${alexHourlyRate.toFixed(2)} € / h</strong> en pista (14h/mes)`;
        let displaySocio = `+${socioMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
        let displaySocioSub = `Rendimiento: <strong style="color:#9333ea;">${socioHourlyRate.toFixed(2)} € / h</strong> en pista (14h/mes)`;
        let displaySomosPadel = `+${totalMonthlyNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
        let displaySomosPadelSub = `Facturación: <strong>${totalMonthlyIncome.toLocaleString('es-ES')} €</strong> • Margen: <strong style="color:#16a34a;">${totalMonthlyMargin.toFixed(1)}%</strong>`;
        let displayNpp = `+${(totalMonthlyCourtCosts + 400).toLocaleString('es-ES')} €`;
        let displayNppSub = `Pistas: <strong>${totalMonthlyCourtCosts} €</strong> + Bar: <strong>+400 €</strong> (Riesgo Cero)`;

        if (isPerEvent) {
            displayNetTitle = 'BENEFICIO LIMPIO UNITARIO (POR AMERICANA)';
            if (detailFilter === 'morning') {
                displayNetProfit = mNetProfit;
                displayNetSub = `/ americana Mañanas (90 min • ${(mIncome > 0 ? (mNetProfit / mIncome * 100).toFixed(1) : 0)}% margen)`;
                displayAlex = `+${alexMorningNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displayAlexSub = `Por evento de mañanas (1.5h en pista • 5 pistas)`;
                displaySocio = `+${socioMorningNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displaySocioSub = `Por evento de mañanas (1.5h presencial/remoto)`;
                displaySomosPadel = `+${mNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displaySomosPadelSub = `Facturación: <strong>${mIncome.toFixed(2)} €</strong> • Costes: <strong>${mTotalCost.toFixed(2)} €</strong>`;
                displayNpp = `+${mNppEventGain.toLocaleString('es-ES')} €`;
                displayNppSub = `Pistas: <strong>${mCourtCost} €</strong> + Bar: <strong>+50 €</strong>`;
            } else if (detailFilter === 'friday') {
                displayNetProfit = fNetProfit;
                displayNetSub = `/ americana Viernes Noche (120 min • ${(fIncome > 0 ? (fNetProfit / fIncome * 100).toFixed(1) : 0)}% margen)`;
                displayAlex = `+${alexFridayNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displayAlexSub = `Por evento de viernes noche (2.0h en pista • 5 pistas)`;
                displaySocio = `+${socioFridayNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displaySocioSub = `Por evento de viernes noche (2.0h presencial/remoto)`;
                displaySomosPadel = `+${fNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displaySomosPadelSub = `Facturación: <strong>${fIncome.toFixed(2)} €</strong> • Costes: <strong>${fTotalCost.toFixed(2)} €</strong>`;
                displayNpp = `+${fNppEventGain.toLocaleString('es-ES')} €`;
                displayNppSub = `Pistas: <strong>${fCourtCost} €</strong> + Bar: <strong>+50 €</strong>`;
            } else {
                displayNetProfit = avgEventNetProfit;
                displayNetSub = `/ americana (Media unitaria • Rango: +${mNetProfit.toFixed(0)}€ a +${fNetProfit.toFixed(0)}€)`;
                displayAlex = `+${avgAlexNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displayAlexSub = `Mañanas: <strong>+${alexMorningNet.toFixed(0)}€</strong> • Viernes: <strong>+${alexFridayNet.toFixed(0)}€</strong>`;
                displaySocio = `+${avgSocioNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displaySocioSub = `Mañanas: <strong>+${socioMorningNet.toFixed(0)}€</strong> • Viernes: <strong>+${socioFridayNet.toFixed(0)}€</strong>`;
                displaySomosPadel = `+${avgEventNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
                displaySomosPadelSub = `Facturación: <strong>${avgEventIncome.toFixed(0)} €</strong> • Costes: <strong>${avgEventCosts.toFixed(0)} €</strong>`;
                displayNpp = `+${avgNppGain.toFixed(0)} €`;
                displayNppSub = `Mañanas: <strong>+${mNppEventGain}€</strong> • Viernes: <strong>+${fNppEventGain}€</strong>`;
            }
        }

        return tabsBarHtml + `
            <div class="pactometro-one-page">
                <!-- HEADER DE CONTROL ESTRATÉGICO DE SOCIOS -->
                <div class="pactometro-header-card">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="pactometro-live-tag">
                            <i class="fas fa-circle" style="font-size:0.45rem; color:#ef4444;"></i> EN VIVO
                        </span>
                        <h2 style="font-family:var(--erp-font-title); font-size:1.05rem; font-weight:900; color:#ffffff; margin:0;">
                            Simulador de Beneficios y Reparto entre Socios
                        </h2>
                        <span class="traffic-badge green" style="font-size:0.6rem; padding:1px 6px; font-weight:800;">5 PISTAS NPP</span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.setNppSection('dossier')" style="padding:3px 9px; font-size:0.72rem; background:rgba(255,255,255,0.08); border-color:#334155; color:#ffffff;">
                            <i class="fas fa-file-pdf"></i> Dossier PDF
                        </button>
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.openEditClubModal('New Padel Pro')" style="padding:3px 9px; font-size:0.72rem; background:rgba(255,255,255,0.08); border-color:#334155; color:#ffffff;">
                            <i class="fas fa-pen-to-square"></i> Editar Tarifas
                        </button>
                        <button class="btn-erp btn-erp-primary" onclick="window.print()" style="padding:3px 10px; font-size:0.72rem; background:#ccff00; color:#0f172a; font-weight:900;">
                            <i class="fas fa-print"></i> Imprimir Plan
                        </button>
                    </div>
                </div>

                <!-- SELECTOR DE VISTA: RESUMEN MENSUAL TOTAL VS DETALLE AMERICANA POR AMERICANA -->
                <div class="pactometro-view-selector-bar">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span style="font-size:0.75rem; font-weight:900; color:#0f172a; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-sliders" style="color:#0284c7;"></i> MODO DE VISUALIZACIÓN:
                        </span>
                        <button class="pactometro-toggle-pill ${!isPerEvent ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('viewDetailMode', 'monthly')">
                            <i class="fas fa-chart-pie"></i> 📊 Resumen Total Mes (${totalEventsCount} Americanas)
                        </button>
                        <button class="pactometro-toggle-pill ${isPerEvent ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('viewDetailMode', 'per_event')">
                            <i class="fas fa-table-tennis-paddle-ball"></i> 🎾 Detalle Americana por Americana (Unitario)
                        </button>
                    </div>

                    ${isPerEvent ? `
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <span style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase;">FILTRAR MARCADORES:</span>
                            <button class="pactometro-sub-pill ${detailFilter === 'both' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('selectedEventDetail', 'both')">
                                ⚖️ Media Unitaria
                            </button>
                            <button class="pactometro-sub-pill ${detailFilter === 'morning' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('selectedEventDetail', 'morning')">
                                ☀️ Miércoles Mañanas (+${mNetProfit.toFixed(0)}€)
                            </button>
                            <button class="pactometro-sub-pill ${detailFilter === 'friday' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('selectedEventDetail', 'friday')">
                                🌙 Viernes Noches (+${fNetProfit.toFixed(0)}€)
                            </button>
                        </div>
                    ` : `
                        <div style="font-size:0.72rem; color:#64748b; font-weight:600;">
                            <i class="fas fa-circle-info" style="color:#0284c7;"></i> Consolidado global de ${mEvents} mañanas + ${fEvents} viernes noche en New Padel Pro
                        </div>
                    `}
                </div>

                <!-- TERMÓMETRO VISUAL DE BENEFICIO MENSUAL O UNITARIO -->
                <div class="pactometro-meter-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                        <div>
                            <span style="font-size:0.68rem; font-weight:900; color:var(--erp-text-dim); text-transform:uppercase; letter-spacing:0.8px;">${displayNetTitle}</span>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.25rem; font-weight:900; color:var(--erp-text-main); margin:1px 0 0 0;">
                                Beneficio Limpio: <span style="color:#0f172a;">${displayNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                <span style="font-size:0.8rem; font-weight:700; color:var(--erp-text-muted);">${displayNetSub}</span>
                            </h3>
                        </div>

                        <div style="text-align:right;">
                            <span style="font-size:0.68rem; font-weight:800; color:var(--erp-text-dim); text-transform:uppercase;">OBJETIVO MENSUAL:</span>
                            <div class="pactometro-goal-pills">
                                ${[660, 1000, 1500, 2000].map(g => `
                                    <button class="pactometro-goal-btn ${targetGoal === g ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('targetMonthlyGoal', ${g})">
                                        🎯 ${g.toLocaleString('es-ES')} € ${g === 660 ? '(Piloto)' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Barra visual con marca de objetivo -->
                    <div class="pactometro-track-wrap">
                        <div class="pactometro-fill-bar" style="width: ${pctAchieved}%; background: ${barColor};">
                            <span>${pctAchieved.toFixed(0)}%</span>
                        </div>
                        <div class="pactometro-target-marker" style="left: ${targetMarkerPos}%;">
                            <div class="pactometro-target-flag">OBJETIVO: ${targetGoal} €</div>
                        </div>
                    </div>

                    <!-- Banner de Estado de Reparto -->
                    <div class="pactometro-status-banner ${statusClass}">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span>${statusTitle}</span>
                            </div>
                            <div style="font-size:0.72rem; font-weight:500; margin-top:1px;">
                                ${statusSub}
                            </div>
                        </div>
                        <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                            Modelo: ${pactoTitle}
                        </div>
                    </div>
                </div>

                <!-- PANTALLAS DE RESULTADOS (MARCADORES DE REPARTO DE SOCIOS) -->
                <div class="pactometro-scoreboard-grid">
                    <!-- Pantalla Alex -->
                    <div class="pactometro-screen-card" style="border-top:4px solid #0284c7;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <span class="traffic-badge blue" style="font-size:0.6rem; background:#e0f2fe; color:#0369a1; font-weight:800; padding:1px 6px;">SOCIO 1 · DIRECCIÓN</span>
                                <h4 style="font-family:var(--erp-font-title); font-size:1rem; font-weight:900; color:#0f172a; margin:2px 0 0 0;">
                                    Alex Coscolín
                                </h4>
                            </div>
                            <i class="fas fa-user" style="font-size:1.15rem; color:#0284c7;"></i>
                        </div>
                        <div class="erp-money positive" style="font-size:1.4rem; color:#0284c7; margin:3px 0 1px 0;">
                            ${displayAlex}
                        </div>
                        <div style="font-size:0.68rem; color:var(--erp-text-muted);">
                            ${displayAlexSub}
                        </div>
                    </div>

                    <!-- Pantalla Socio -->
                    <div class="pactometro-screen-card" style="border-top:4px solid #9333ea;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <span class="traffic-badge purple" style="font-size:0.6rem; background:#f3e8ff; color:#7e22ce; font-weight:800; padding:1px 6px;">SOCIO 2 · ESTRATEGIA</span>
                                <h4 style="font-family:var(--erp-font-title); font-size:1rem; font-weight:900; color:#0f172a; margin:2px 0 0 0;">
                                    Xavi Perea
                                </h4>
                            </div>
                            <i class="fas fa-handshake" style="font-size:1.15rem; color:#9333ea;"></i>
                        </div>
                        <div class="erp-money positive" style="font-size:1.4rem; color:#9333ea; margin:3px 0 1px 0;">
                            ${displaySocio}
                        </div>
                        <div style="font-size:0.68rem; color:var(--erp-text-muted);">
                            ${displaySocioSub}
                        </div>
                    </div>

                    <!-- Pantalla Sociedad SomosPadel -->
                    <div class="pactometro-screen-card" style="border-top:4px solid #16a34a;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <span class="traffic-badge green" style="font-size:0.6rem; font-weight:800; padding:1px 6px;">TOTAL SOCIEDAD</span>
                                <h4 style="font-family:var(--erp-font-title); font-size:1rem; font-weight:900; color:#0f172a; margin:2px 0 0 0;">
                                    Beneficio SomosPadel
                                </h4>
                            </div>
                            <i class="fas fa-vault" style="font-size:1.15rem; color:#16a34a;"></i>
                        </div>
                        <div class="erp-money positive" style="font-size:1.4rem; color:#16a34a; margin:3px 0 1px 0;">
                            ${displaySomosPadel}
                        </div>
                        <div style="font-size:0.68rem; color:var(--erp-text-muted);">
                            ${displaySomosPadelSub}
                        </div>
                    </div>

                    <!-- Pantalla Club New Padel Pro -->
                    <div class="pactometro-screen-card" style="border-top:4px solid #f59e0b;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <span class="traffic-badge yellow" style="font-size:0.6rem; font-weight:800; padding:1px 6px;">SEDE COLABORADORA</span>
                                <h4 style="font-family:var(--erp-font-title); font-size:1rem; font-weight:900; color:#0f172a; margin:2px 0 0 0;">
                                    Ganancia New Padel Pro
                                </h4>
                            </div>
                            <i class="fas fa-building" style="font-size:1.15rem; color:#f59e0b;"></i>
                        </div>
                        <div class="erp-money" style="font-size:1.4rem; color:#b45309; margin:3px 0 1px 0;">
                            ${displayNpp}
                        </div>
                        <div style="font-size:0.68rem; color:var(--erp-text-muted);">
                            ${displayNppSub}
                        </div>
                    </div>
                </div>

                <!-- ESCENARIOS RÁPIDOS DE REPARTO DE SOCIOS (1-CLIC) -->
                <div class="pactometro-presets-box">
                    <div class="pactometro-presets-title">
                        <i class="fas fa-bolt" style="color:#f59e0b;"></i> ⚡ ESCENARIOS RÁPIDOS DE REPARTO DE SOCIOS (1-CLIC):
                    </div>
                    <div class="preset-pill-group">
                        <button class="preset-pill-btn ${sim.activePreset === 'pilot_50_50' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('pilot_50_50')">
                            <span>🎯 Piloto Oficial (5 pist. • 50/50 Alex & Xavi)</span>
                            <span class="traffic-badge green" style="font-size:0.62rem; padding:1px 5px;">+680€ net</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'alex_full' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('alex_full')">
                            <span>👤 100% Alex Presencial (5 pist.)</span>
                            <span class="traffic-badge blue" style="font-size:0.62rem; background:#e0f2fe; color:#0369a1; padding:1px 5px;">+680€ Alex</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'socio_full' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('socio_full')">
                            <span>👤 100% Xavi Perea Presencial (5 pist.)</span>
                            <span class="traffic-badge purple" style="font-size:0.62rem; background:#f3e8ff; color:#7e22ce; padding:1px 5px;">+680€ Xavi</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'split_60_40' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('split_60_40')">
                            <span>⚖️ 60% Alex / 40% Xavi (5 pist.)</span>
                            <span class="traffic-badge green" style="font-size:0.62rem; padding:1px 5px;">408€ / 272€</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'split_60_socio' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('split_60_socio')">
                            <span>⚖️ 60% Xavi / 40% Alex (5 pist.)</span>
                            <span class="traffic-badge green" style="font-size:0.62rem; padding:1px 5px;">408€ / 272€</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'with_helper' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('with_helper')">
                            <span>👥 5 Pistas + 1 Ayudante Viernes</span>
                            <span class="traffic-badge green" style="font-size:0.62rem; padding:1px 5px;">+540€ net</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'passive_mode' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('passive_mode')">
                            <span>🌴 100% Pasivo (Coordinador Fijo)</span>
                            <span class="traffic-badge green" style="font-size:0.62rem; padding:1px 5px;">+440€ net</span>
                        </button>
                        <button class="preset-pill-btn ${sim.activePreset === 'courts_4' ? 'active' : ''}" onclick="window.OrganizacionERP.applyPreset('courts_4')">
                            <span>🎾 4 Pistas Conservador</span>
                            <span class="traffic-badge yellow" style="font-size:0.62rem; padding:1px 5px;">+540€ net</span>
                        </button>
                    </div>
                </div>

                <!-- CONSOLA INTERACTIVA DE FRANJAS Y MODELO DE REPARTO -->
                <div class="pactometro-moves-grid">
                    <!-- Columna 1: Miércoles Mañanas (10:00 h, 90 min) -->
                    <div class="pactometro-console-box">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <div>
                                <span class="traffic-badge blue" style="font-size:0.6rem; background:#e0f2fe; color:#0369a1; font-weight:800; padding:1px 6px;">FRANJA 1 · MIÉRCOLES</span>
                                <h4 style="font-family:var(--erp-font-title); font-size:0.95rem; font-weight:900; color:#0f172a; margin:1px 0 0 0;">
                                    Mañanas (90 min)
                                </h4>
                            </div>
                            <div style="text-align:right;">
                                <span class="traffic-badge green" style="font-size:0.72rem; font-weight:900; padding:2px 8px;">+${mNetProfit.toFixed(0)} € / evento</span>
                            </div>
                        </div>

                        <!-- Canchas de pádel dinámicas -->
                        ${renderPadelCourtsVisual(mCourts, 'morning')}

                        <!-- Selector de pistas (1 a 5 máximo) -->
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; flex-wrap:wrap; gap:4px;">
                            <span style="font-size:0.7rem; font-weight:700; color:var(--erp-text-dim);">Pistas activas:</span>
                            <div class="chip-selector" style="margin-top:0;">
                                ${[1, 2, 3, 4, 5].map(c => `
                                    <button class="chip-btn ${mCourts === c ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('morningCourts', ${c})" style="padding:2px 6px; font-size:0.7rem;">
                                        ${c} ${c === 5 ? '★ MÁX' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Negociación mañanas -->
                        <div style="margin-top:4px; padding:6px 8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-size:0.7rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span>Tarifa acordada:</span>
                                <strong style="color:#0284c7;">${sim.courtNegotiationMorning === 'block_12' ? '12 €/pista bloque' : '18 €/pista (12€/h)'}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Capacidad:</span>
                                <strong>${mPlayers} jugadores (6 €/jug.)</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Columna 2: Viernes Noche (20:30 h, 120 min) -->
                    <div class="pactometro-console-box">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <div>
                                <span class="traffic-badge green" style="font-size:0.6rem; font-weight:800; padding:1px 6px;">FRANJA 2 · VIERNES NOCHE</span>
                                <h4 style="font-family:var(--erp-font-title); font-size:0.95rem; font-weight:900; color:#0f172a; margin:1px 0 0 0;">
                                    Viernes Noche (120 min)
                                </h4>
                            </div>
                            <div style="text-align:right;">
                                <span class="traffic-badge green" style="font-size:0.72rem; font-weight:900; padding:2px 8px;">+${fNetProfit.toFixed(0)} € / evento</span>
                            </div>
                        </div>

                        <!-- Canchas de pádel dinámicas -->
                        ${renderPadelCourtsVisual(fCourts, 'friday')}

                        <!-- Selector de pistas (1 a 5 máximo) -->
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; flex-wrap:wrap; gap:4px;">
                            <span style="font-size:0.7rem; font-weight:700; color:var(--erp-text-dim);">Pistas activas:</span>
                            <div class="chip-selector" style="margin-top:0;">
                                ${[1, 2, 3, 4, 5].map(c => `
                                    <button class="chip-btn ${fCourts === c ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('fridayCourts', ${c})" style="padding:2px 6px; font-size:0.7rem;">
                                        ${c} ${c === 5 ? '★ MÁX' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Ayudante en viernes noche -->
                        <div style="margin-top:4px; padding:6px 8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-size:0.7rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span>Ayudante / Staff presencial:</span>
                                <div style="display:flex; gap:3px;">
                                    <button class="chip-btn ${fHelpersCount === 0 ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('fridayHelpersCount', 0)" style="padding:1px 6px; font-size:0.68rem;">0</button>
                                    <button class="chip-btn ${fHelpersCount === 1 ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('fridayHelpersCount', 1)" style="padding:1px 6px; font-size:0.68rem;">1 (+35€)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna 3: Modelo de Reparto entre Socios -->
                    <div class="pactometro-console-box">
                        <div style="margin-bottom:4px;">
                            <span class="traffic-badge purple" style="font-size:0.6rem; background:#f3e8ff; color:#7e22ce; font-weight:800; padding:1px 6px;">ACUERDO DE SOCIOS</span>
                            <h4 style="font-family:var(--erp-font-title); font-size:0.95rem; font-weight:900; color:#0f172a; margin:1px 0 0 0;">
                                Modelo de Reparto de Beneficios
                            </h4>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:4px;">
                            <button class="chip-btn pacto-share-tile ${sim.sharingMode === '50_50' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '50_50')">
                                <strong>⚖️ 50% Alex / 50% Xavi</strong>
                                <div style="font-size:0.62rem; opacity:0.85;">Paritario presencial</div>
                            </button>

                            <button class="chip-btn pacto-share-tile ${sim.sharingMode === '60_alex_40_socio' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '60_alex_40_socio')">
                                <strong>🎾 60% Alex / 40% Xavi</strong>
                                <div style="font-size:0.62rem; opacity:0.85;">Alex Pista / Xavi Remoto</div>
                            </button>

                            <button class="chip-btn pacto-share-tile ${sim.sharingMode === '60_socio_40_alex' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '60_socio_40_alex')">
                                <strong>🎾 60% Xavi / 40% Alex</strong>
                                <div style="font-size:0.62rem; opacity:0.85;">Xavi Pista / Alex Remoto</div>
                            </button>

                            <button class="chip-btn pacto-share-tile ${sim.sharingMode === '100_alex' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '100_alex')">
                                <strong>👤 100% Alex</strong>
                                <div style="font-size:0.62rem; opacity:0.85;">Alex asume presencial</div>
                            </button>

                            <button class="chip-btn pacto-share-tile ${sim.sharingMode === '100_socio' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', '100_socio')">
                                <strong>👤 100% Xavi Perea</strong>
                                <div style="font-size:0.62rem; opacity:0.85;">Xavi asume presencial</div>
                            </button>

                            <button class="chip-btn pacto-share-tile ${sim.sharingMode === 'coordinator_passive' || sim.sharingMode === 'passive_mode' ? 'active' : ''}" onclick="window.OrganizacionERP.updateNppSim('sharingMode', 'coordinator_passive')">
                                <strong>🌴 Coordinador (Pasivo)</strong>
                                <div style="font-size:0.62rem; opacity:0.85;">210 €/mes pasivo c/u</div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN COMPLETA DE DESGLOSE INDIVIDUAL AMERICANA POR AMERICANA -->
                <div class="pactometro-console-box" style="margin-top:0.6rem; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:10px; padding:0.85rem 1.1rem; box-shadow:0 3px 12px rgba(0,0,0,0.04);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="traffic-badge blue" style="font-size:0.65rem; background:#e0f2fe; color:#0369a1; font-weight:900; padding:2px 8px;">
                                🎾 DETALLE AMERICANA POR AMERICANA
                            </span>
                            <h3 style="font-family:var(--erp-font-title); font-size:1.05rem; font-weight:900; color:#0f172a; margin:0;">
                                ¿Qué genera cada americana individual en New Padel Pro?
                            </h3>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <span class="traffic-badge green" style="font-size:0.65rem; font-weight:800; padding:2px 8px;">
                                CALENDARIO OFICIAL · 8 EVENTOS AL MES
                            </span>
                        </div>
                    </div>

                    <!-- Comparativa Ficha a Ficha de las 2 Franjas de Americana -->
                    <div class="pactometro-detail-grid">
                        <!-- Ficha 1: Americana Miércoles Mañanas -->
                        <div class="pactometro-detail-card" style="border-left: 4px solid #0284c7;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                <div>
                                    <span style="font-size:0.65rem; font-weight:800; color:#0369a1; text-transform:uppercase;">FRANJA 1 · 90 MINUTOS</span>
                                    <h4 style="margin:2px 0 0; font-size:0.95rem; font-weight:900; color:#0f172a;">Americana Miércoles Mañanas (10:00 - 11:30)</h4>
                                </div>
                                <div class="erp-money positive" style="font-size:1.2rem; font-weight:900; color:#0284c7; text-align:right;">
                                    +${mNetProfit.toFixed(2)} €
                                    <div style="font-size:0.65rem; color:#64748b; font-weight:700;">limpios / evento</div>
                                </div>
                            </div>
                            
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 10px; margin-bottom:8px; font-size:0.74rem;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                                    <span>👥 <strong>Capacidad:</strong> ${mCourts} pistas (${mPlayers} jugadores a ${mPrice}€)</span>
                                    <strong style="color:#0f172a;">Facturación: ${mIncome.toFixed(2)} €</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; color:#dc2626;">
                                    <span>🏟️ <strong>Coste Pistas NPP:</strong> ${mCourts} pistas @ 12€/bloque</span>
                                    <span>-${mCourtCost.toFixed(2)} €</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; color:#64748b;">
                                    <span>🎾 <strong>Pelotas & Fondo Reserva:</strong></span>
                                    <span>-${(mBallsCost + mReserve).toFixed(2)} €</span>
                                </div>
                                <div style="border-top:1px solid #cbd5e1; margin-top:4px; padding-top:4px; display:flex; justify-content:space-between; font-weight:800; color:#0f172a;">
                                    <span>Margen Comercial Limpio:</span>
                                    <span style="color:#16a34a;">${(mIncome > 0 ? (mNetProfit / mIncome * 100).toFixed(1) : 0)}%</span>
                                </div>
                            </div>

                            <!-- Reparto por Americana Miércoles -->
                            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:4px; font-size:0.7rem; text-align:center;">
                                <div style="background:#e0f2fe; padding:4px; border-radius:6px; color:#0369a1;">
                                    <div style="font-size:0.62rem; font-weight:800;">ALEX</div>
                                    <div style="font-weight:900; font-size:0.85rem;">+${alexMorningNet.toFixed(2)} €</div>
                                </div>
                                <div style="background:#f3e8ff; padding:4px; border-radius:6px; color:#7e22ce;">
                                    <div style="font-size:0.62rem; font-weight:800;">XAVI PEREA</div>
                                    <div style="font-weight:900; font-size:0.85rem;">+${socioMorningNet.toFixed(2)} €</div>
                                </div>
                                <div style="background:#fef3c7; padding:4px; border-radius:6px; color:#92400e;">
                                    <div style="font-size:0.62rem; font-weight:800;">CLUB NPP</div>
                                    <div style="font-weight:900; font-size:0.85rem;">+${mNppEventGain.toFixed(2)} €</div>
                                </div>
                            </div>
                        </div>

                        <!-- Ficha 2: Americana Viernes Noche -->
                        <div class="pactometro-detail-card" style="border-left: 4px solid #16a34a;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                <div>
                                    <span style="font-size:0.65rem; font-weight:800; color:#15803d; text-transform:uppercase;">FRANJA 2 · 120 MINUTOS</span>
                                    <h4 style="margin:2px 0 0; font-size:0.95rem; font-weight:900; color:#0f172a;">Americana Viernes Noche (20:30 - 22:30)</h4>
                                </div>
                                <div class="erp-money positive" style="font-size:1.2rem; font-weight:900; color:#16a34a; text-align:right;">
                                    +${fNetProfit.toFixed(2)} €
                                    <div style="font-size:0.65rem; color:#64748b; font-weight:700;">limpios / evento</div>
                                </div>
                            </div>
                            
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 10px; margin-bottom:8px; font-size:0.74rem;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                                    <span>👥 <strong>Capacidad:</strong> ${fCourts} pistas (${fPlayers} jugadores a ${fPrice}€)</span>
                                    <strong style="color:#0f172a;">Facturación: ${fIncome.toFixed(2)} €</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; color:#dc2626;">
                                    <span>🏟️ <strong>Coste Pistas NPP:</strong> ${fCourts} pistas × 2h @ 12€/h</span>
                                    <span>-${fCourtCost.toFixed(2)} €</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; color:#64748b;">
                                    <span>🎾 <strong>Pelotas Oficiales Head:</strong></span>
                                    <span>-${fBallsCost.toFixed(2)} €</span>
                                </div>
                                <div style="border-top:1px solid #cbd5e1; margin-top:4px; padding-top:4px; display:flex; justify-content:space-between; font-weight:800; color:#0f172a;">
                                    <span>Margen Comercial Limpio:</span>
                                    <span style="color:#16a34a;">${(fIncome > 0 ? (fNetProfit / fIncome * 100).toFixed(1) : 0)}%</span>
                                </div>
                            </div>

                            <!-- Reparto por Americana Viernes -->
                            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:4px; font-size:0.7rem; text-align:center;">
                                <div style="background:#e0f2fe; padding:4px; border-radius:6px; color:#0369a1;">
                                    <div style="font-size:0.62rem; font-weight:800;">ALEX</div>
                                    <div style="font-weight:900; font-size:0.85rem;">+${alexFridayNet.toFixed(2)} €</div>
                                </div>
                                <div style="background:#f3e8ff; padding:4px; border-radius:6px; color:#7e22ce;">
                                    <div style="font-size:0.62rem; font-weight:800;">XAVI PEREA</div>
                                    <div style="font-weight:900; font-size:0.85rem;">+${socioFridayNet.toFixed(2)} €</div>
                                </div>
                                <div style="background:#fef3c7; padding:4px; border-radius:6px; color:#92400e;">
                                    <div style="font-size:0.62rem; font-weight:800;">CLUB NPP</div>
                                    <div style="font-weight:900; font-size:0.85rem;">+${fNppEventGain.toFixed(2)} €</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabla Detallada Americana por Americana del Mes -->
                    <div style="border:1.5px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                        <table class="pactometro-detail-table">
                            <thead>
                                <tr>
                                    <th># Evento</th>
                                    <th>Franja & Horario</th>
                                    <th style="text-align:center;">Pistas / Plazas</th>
                                    <th style="text-align:right;">Ingresos</th>
                                    <th style="text-align:right;">Coste Pistas</th>
                                    <th style="text-align:right;">Otros Costes</th>
                                    <th style="text-align:right;">B. Limpio</th>
                                    <th style="text-align:right;">Alex</th>
                                    <th style="text-align:right;">Xavi Perea</th>
                                    <th style="text-align:right;">Club NPP</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.from({ length: 4 }).map((_, i) => `
                                    <tr>
                                        <td><strong>#${(i * 2) + 1}</strong> · Semana ${i + 1}</td>
                                        <td>☀️ Miércoles Mañana (10:00 - 11:30)</td>
                                        <td style="text-align:center;">${mCourts} pistas (${mPlayers} jug.)</td>
                                        <td style="text-align:right; font-weight:700;">${mIncome.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#dc2626;">-${mCourtCost.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#64748b;">-${(mBallsCost + mReserve).toFixed(2)} €</td>
                                        <td style="text-align:right; font-weight:800; color:#16a34a;">+${mNetProfit.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#0284c7; font-weight:700;">+${alexMorningNet.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#9333ea; font-weight:700;">+${socioMorningNet.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#b45309; font-weight:700;">+${mNppEventGain.toFixed(2)} €</td>
                                    </tr>
                                    <tr>
                                        <td><strong>#${(i * 2) + 2}</strong> · Semana ${i + 1}</td>
                                        <td>🌙 Viernes Noche (20:30 - 22:30)</td>
                                        <td style="text-align:center;">${fCourts} pistas (${fPlayers} jug.)</td>
                                        <td style="text-align:right; font-weight:700;">${fIncome.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#dc2626;">-${fCourtCost.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#64748b;">-${fBallsCost.toFixed(2)} €</td>
                                        <td style="text-align:right; font-weight:800; color:#16a34a;">+${fNetProfit.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#0284c7; font-weight:700;">+${alexFridayNet.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#9333ea; font-weight:700;">+${socioFridayNet.toFixed(2)} €</td>
                                        <td style="text-align:right; color:#b45309; font-weight:700;">+${fNppEventGain.toFixed(2)} €</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background:#0f172a; color:#ffffff; font-weight:900;">
                                    <td colspan="2" style="color:#ffffff; font-size:0.78rem;">TOTAL MENSUAL (8 AMERICANAS)</td>
                                    <td style="text-align:center; color:#ffffff;">160 plazas</td>
                                    <td style="text-align:right; color:#ccff00;">${totalMonthlyIncome.toLocaleString('es-ES')} €</td>
                                    <td style="text-align:right; color:#fda4af;">-${totalMonthlyCourtCosts.toLocaleString('es-ES')} €</td>
                                    <td style="text-align:right; color:#cbd5e1;">-${(totalMonthlyBallsCosts + (mEvents * mReserve)).toLocaleString('es-ES')} €</td>
                                    <td style="text-align:right; color:#ccff00; font-size:0.85rem;">+${totalMonthlyNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                    <td style="text-align:right; color:#7dd3fc;">+${alexMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                    <td style="text-align:right; color:#d8b4fe;">+${socioMonthlyNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                    <td style="text-align:right; color:#fde047;">+${(totalMonthlyCourtCosts + 400).toLocaleString('es-ES')} €</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // 6. DASHBOARD GENERAL, EVENTOS, CLUBES, PERSONAL Y CALENDARIO
    // ==========================================================================
    function renderDashboardView() {
        const subTab = state.dashboardSubTab || 'overview';

        const subTabsNav = `
            <div class="club-tabs-nav" style="margin-bottom:1.5rem;">
                <button class="club-tab-pill ${subTab === 'overview' ? 'active' : ''}" onclick="window.OrganizacionERP.setDashboardSubTab('overview')">
                    <i class="fas fa-chart-pie"></i>
                    <span>Balance & Semáforo</span>
                    <span class="traffic-badge green" style="font-size:0.6rem; padding:2px 6px;">KPIs</span>
                </button>
                <button class="club-tab-pill ${subTab === 'perevent' ? 'active' : ''}" onclick="window.OrganizacionERP.setDashboardSubTab('perevent')">
                    <i class="fas fa-table-tennis-paddle-ball"></i>
                    <span>Detalle por Americana</span>
                    <span class="traffic-badge green" style="font-size:0.6rem; padding:2px 6px;">UNITARIO</span>
                </button>
                <button class="club-tab-pill ${subTab === 'hiring' ? 'active' : ''}" onclick="window.OrganizacionERP.setDashboardSubTab('hiring')">
                    <i class="fas fa-user-group"></i>
                    <span>Personal & Break-Even</span>
                    <span class="traffic-badge blue" style="font-size:0.6rem; padding:2px 6px;">SIMULADOR</span>
                </button>
                <button class="club-tab-pill ${subTab === 'reports' ? 'active' : ''}" onclick="window.OrganizacionERP.setDashboardSubTab('reports')">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>Informes & Exportación</span>
                    <span class="traffic-badge green" style="font-size:0.6rem; padding:2px 6px;">EXCEL/PDF</span>
                </button>
                <button class="club-tab-pill ${subTab === 'future' ? 'active' : ''}" onclick="window.OrganizacionERP.setDashboardSubTab('future')">
                    <i class="fas fa-cubes-stacked"></i>
                    <span>Formatos de Expansión</span>
                </button>
            </div>
        `;

        if (subTab === 'pactometro') {
            return subTabsNav + renderPactometroDashboardView();
        }
        if (subTab === 'perevent') {
            return subTabsNav + renderPactometroDashboardView();
        }
        if (subTab === 'hiring') {
            return subTabsNav + renderHiringSimulatorView();
        }
        if (subTab === 'reports') {
            return subTabsNav + renderReportsView();
        }
        if (subTab === 'future') {
            return subTabsNav + renderFutureFormatsView();
        }

        const kpis = computeExecutiveKPIs();

        return subTabsNav + `
            <div class="erp-kpi-grid">
                <div class="erp-kpi-card erp-kpi-hero">
                    <div class="erp-kpi-top">
                        <span class="erp-kpi-label">Beneficio Neto Acumulado</span>
                        <div class="erp-kpi-icon-box"><i class="fas fa-sack-dollar"></i></div>
                    </div>
                    <div class="erp-kpi-val">${kpis.totalNetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                    <div class="erp-kpi-sub">
                        <span>Margen global medio:</span>
                        <strong class="${kpis.globalMargin >= 30 ? 'delta-up' : 'delta-down'}">${kpis.globalMargin.toFixed(1)}%</strong>
                        <span>• Facturación: ${kpis.totalIncome.toLocaleString('es-ES')} €</span>
                    </div>
                </div>

                <div class="erp-kpi-card">
                    <div class="erp-kpi-top">
                        <span class="erp-kpi-label">Beneficio Mes Actual</span>
                        <div class="erp-kpi-icon-box"><i class="fas fa-calendar-check"></i></div>
                    </div>
                    <div class="erp-kpi-val">${kpis.currentMonthProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                    <div class="erp-kpi-sub">
                        <span class="delta-up"><i class="fas fa-arrow-trend-up"></i> Año acumulado:</span>
                        <strong>${kpis.currentYearProfit.toLocaleString('es-ES')} €</strong>
                    </div>
                </div>

                <div class="erp-kpi-card">
                    <div class="erp-kpi-top">
                        <span class="erp-kpi-label">Ticket Medio Jugador</span>
                        <div class="erp-kpi-icon-box"><i class="fas fa-ticket"></i></div>
                    </div>
                    <div class="erp-kpi-val">${kpis.avgTicket.toFixed(2)} €</div>
                    <div class="erp-kpi-sub">
                        <span>Total jugadores:</span>
                        <strong>${kpis.totalPlayers} registrados</strong>
                    </div>
                </div>

                <div class="erp-kpi-card">
                    <div class="erp-kpi-top">
                        <span class="erp-kpi-label">Control de Eventos</span>
                        <div class="erp-kpi-icon-box"><i class="fas fa-clipboard-check"></i></div>
                    </div>
                    <div class="erp-kpi-val">${kpis.finishedEvents} <span style="font-size:1rem; color:var(--erp-text-dim)">/ ${kpis.scheduledEvents + kpis.finishedEvents}</span></div>
                    <div class="erp-kpi-sub">
                        <span style="color:#16a34a;">🟢 ${kpis.scheduledEvents} prog.</span>
                        <span style="color:var(--erp-text-dim);">•</span>
                        <span style="color:#e11d48;">🚫 ${kpis.cancelledEvents} canc.</span>
                    </div>
                </div>

                <div class="erp-kpi-card">
                    <div class="erp-kpi-top">
                        <span class="erp-kpi-label">Costes Operativos Totales</span>
                        <div class="erp-kpi-icon-box" style="color:#e11d48;"><i class="fas fa-receipt"></i></div>
                    </div>
                    <div class="erp-kpi-val" style="color:#e11d48;">${kpis.totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                    <div class="erp-kpi-sub">
                        <span>Pistas, bolas, premios y colaboradores</span>
                    </div>
                </div>

                <div class="erp-kpi-card">
                    <div class="erp-kpi-top">
                        <span class="erp-kpi-label">Club Más Rentable</span>
                        <div class="erp-kpi-icon-box" style="color:#16a34a;"><i class="fas fa-trophy"></i></div>
                    </div>
                    <div class="erp-kpi-val" style="font-size:1.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${kpis.topClub ? kpis.topClub.name : 'N/A'}
                    </div>
                    <div class="erp-kpi-sub">
                        <strong class="delta-up">+${kpis.topClub ? kpis.topClub.netProfit.toLocaleString('es-ES') : 0} €</strong>
                        <span>(${kpis.topClub ? kpis.topClub.marginPct.toFixed(1) : 0}% margen)</span>
                    </div>
                </div>
            </div>

            <div class="erp-card" style="margin-bottom: 2rem;">
                <div class="erp-card-header">
                    <div>
                        <h3 class="erp-card-title"><i class="fas fa-traffic-light"></i> Semáforo de Rentabilidad por Club Colaborador</h3>
                        <p class="erp-card-subtitle">Visión ejecutiva para decidir dónde concentrar eventos o renegociar tarifas</p>
                    </div>
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.navigateTo('clubs')">
                        Ver Todos los Clubes <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                
                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Club Colaborador</th>
                                <th>Eventos</th>
                                <th>Jugadores</th>
                                <th>Facturación</th>
                                <th>Coste Total</th>
                                <th>Beneficio Neto</th>
                                <th>Margen</th>
                                <th>Estado Semáforo</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(state.clubs).map(club => `
                                <tr>
                                    <td>
                                        <strong style="color:var(--erp-text-main); font-size:0.88rem;">${club.name}</strong>
                                    </td>
                                    <td>${club.eventsCount}</td>
                                    <td>${club.playersCount}</td>
                                    <td class="erp-money">${club.totalIncome.toLocaleString('es-ES')} €</td>
                                    <td class="erp-money negative">${club.totalExpense.toLocaleString('es-ES')} €</td>
                                    <td class="erp-money positive"><strong>${club.netProfit.toLocaleString('es-ES')} €</strong></td>
                                    <td><strong>${club.marginPct.toFixed(1)}%</strong></td>
                                    <td>
                                        <span class="traffic-badge ${club.trafficStatus}">
                                            ${club.trafficLabel}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="erp-btn-micro" onclick="window.OrganizacionERP.showClubDetail('${escapeHtml(club.name)}')">
                                            <i class="fas fa-eye"></i> Ficha
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function setEventsSubTab(subTab) {
        state.eventsSubTab = subTab;
        renderActiveTab();
    }

    function onAmericanaSearch(val) {
        state.americanaSearchQuery = (val || '').toLowerCase().trim();
        const tbody = document.getElementById('erp-events-table-body');
        if (tbody) {
            tbody.innerHTML = getFilteredEvents().map(evt => renderEventRow(evt)).join('');
        }
    }

    function onAmericanaFilterChange(type, val) {
        if (type === 'club') state.filters.club = val;
        if (type === 'status') state.americanaFilterStatus = val;
        if (type === 'category') state.americanaFilterCategory = val;
        const tbody = document.getElementById('erp-events-table-body');
        if (tbody) {
            tbody.innerHTML = getFilteredEvents().map(evt => renderEventRow(evt)).join('');
        }
    }

    function getFilteredEvents() {
        return state.events.filter(evt => {
            if (state.filters.club !== 'all') {
                const c = (evt.club || evt.location || '').toLowerCase();
                if (c !== state.filters.club.toLowerCase()) return false;
            }
            if (state.americanaFilterStatus && state.americanaFilterStatus !== 'all') {
                if ((evt.status || 'open') !== state.americanaFilterStatus) return false;
            }
            if (state.americanaFilterCategory && state.americanaFilterCategory !== 'all') {
                const cat = (evt.category || '').toLowerCase();
                if (cat !== state.americanaFilterCategory.toLowerCase()) return false;
            }
            if (state.americanaSearchQuery) {
                const query = state.americanaSearchQuery;
                const txt = `${evt.title || ''} ${evt.name || ''} ${evt.club || ''} ${evt.location || ''} ${evt.organizer || ''} ${evt.category || ''}`.toLowerCase();
                if (!txt.includes(query)) return false;
            }
            return true;
        });
    }

    function renderEventsView() {
        const isCreateTab = state.eventsSubTab === 'create';

        return `
            <!-- SUB-NAVEGACIÓN IDÉNTICA AL GESTOR Y MENÚ DE ADMIN -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:12px; background:#f8fafc; padding:12px 16px; border-radius:12px; border:1px solid var(--erp-border);">
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <button class="btn-erp ${!isCreateTab ? 'btn-erp-primary' : 'btn-erp-secondary'}" onclick="window.OrganizacionERP.setEventsSubTab('mgmt')" style="font-weight:800; font-size:0.85rem; padding:8px 16px;">
                        <i class="fas fa-list-check"></i> Gestor de Americanas (${state.events.length})
                    </button>
                    <button class="btn-erp ${isCreateTab ? 'btn-erp-primary' : 'btn-erp-secondary'}" onclick="window.OrganizacionERP.setEventsSubTab('create')" style="font-weight:800; font-size:0.85rem; padding:8px 16px;">
                        <i class="fas fa-plus-circle"></i> Crear Americana
                    </button>
                </div>

                <div style="display:flex; gap:10px; align-items:center;">
                    ${!isCreateTab ? `
                        <button class="btn-erp btn-erp-primary" onclick="window.OrganizacionERP.openNewEventModal()">
                            <i class="fas fa-plus"></i> Abrir Modal Crear
                        </button>
                    ` : ''}
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.exportToExcel()">
                        <i class="fas fa-file-excel"></i> Exportar a Excel
                    </button>
                </div>
            </div>

            ${isCreateTab ? renderCreateAmericanaPageView() : renderEventsMgmtPageView()}
        `;
    }

    function renderCreateAmericanaPageView() {
        return `
            <div style="max-width: 650px; margin: 0 auto;">
                <div class="glass-card-enterprise fade-in" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); padding: 2.2rem; border: 1px solid #cbd5e1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid #e2e8f0; padding-bottom:1rem;">
                        <h3 style="color: #0f172a; margin:0; display:flex; align-items:center; gap:12px; font-weight:900; font-size:1.2rem; text-transform:uppercase;">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:#0f172a; color:#fff; border-radius:50%; font-size:0.85rem;"><i class="fas fa-plus"></i></span>
                            CREAR NUEVO EVENTO DE AMERICANA
                        </h3>
                        <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.setEventsSubTab('mgmt')" style="font-size:0.75rem; font-weight:800;">
                            <i class="fas fa-arrow-left"></i> GESTOR
                        </button>
                    </div>

                    <!-- Botones de Preset Rápido (Idénticos a la Imagen del Usuario) -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
                        <button type="button" class="btn-micro" onclick="window.OrganizacionERP.applyAmericanaPreset('masc4')" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;">🎾 MASC 4 PISTAS</button>
                        <button type="button" class="btn-micro" onclick="window.OrganizacionERP.applyAmericanaPreset('fem4')" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;">🌸 FEM 4 PISTAS</button>
                        <button type="button" class="btn-micro" onclick="window.OrganizacionERP.applyAmericanaPreset('mixta4')" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;">⚡ MIXTA 4 PISTAS</button>
                        <button type="button" class="btn-micro" onclick="window.OrganizacionERP.applyAmericanaPreset('twister')" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;">🌪️ TWISTER INDIV.</button>
                        <button type="button" class="btn-micro" onclick="window.OrganizacionERP.applyAmericanaPreset('suiza')" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;">🇨🇭 AMERICANA SUIZA (2H • 6 RONDAS)</button>
                        <button type="button" class="btn-micro" onclick="window.OrganizacionERP.applyAmericanaPreset('club')" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;">🏛️ CLUB COLABORADOR</button>
                    </div>

                    <form id="create-americana-form" class="pro-form compact-admin-form" onsubmit="event.preventDefault(); window.OrganizacionERP.saveNewEventFromForm();" style="display:flex; flex-direction:column; gap:16px;">
                        
                        <h3 style="color: #0f172a; font-size: 0.95rem; font-weight:900; margin: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-sliders-h"></i> CONFIGURACIÓN GENERAL
                        </h3>

                        <div class="form-group" style="margin-bottom: 4px;">
                            <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">NOMBRE DEL TORNEO / AMERICANA</label>
                            <input type="text" name="name" id="new-evt-title" class="financial-input" placeholder="Ej: Americana Oro Barcelona" required
                                style="font-weight: 800; font-size: 0.95rem; width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                        </div>

                        <!-- DESCRIPCIÓN & AVISOS PARA JUGADORES -->
                        <div class="form-group" style="margin-bottom: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0;">
                                    <i class="fas fa-align-left" style="color: #0284c7;"></i> DESCRIPCIÓN & AVISOS PARA JUGADORES
                                </label>
                                <span style="font-size: 0.68rem; color: #64748b; font-weight: 500;">(Visible para todos los jugadores)</span>
                            </div>
                            <textarea name="description" id="new-evt-desc" class="financial-input" rows="3" 
                                placeholder="Escribe aquí los detalles que quieras que lean los jugadores: vermut/tapa incluida, premios, sistema de puntuación, pistas, normas, etc."
                                style="width: 100%; text-align:left; resize: vertical; min-height: 65px; font-size: 0.85rem; line-height: 1.4; border: 1px solid #cbd5e1; border-radius: 8px; font-family: var(--erp-font-body);"></textarea>
                        </div>

                        <!-- Tipo de Evento / Club Organizador -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">
                                    <i class="fas fa-building-columns"></i> TIPO DE EVENTO
                                </label>
                                <select name="is_external" id="create-is-external" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700;" onchange="window.OrganizacionERP.toggleCreateClubInput(this.value)">
                                    <option value="false">🏆 OFICIAL SOMOSPADEL</option>
                                    <option value="true">🏛️ CLUB ASOCIADO / EXTERNA</option>
                                </select>
                            </div>
                            <div class="form-group" id="create-club-group" style="display: none;">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">
                                    <i class="fas fa-signature"></i> NOMBRE DEL CLUB
                                </label>
                                <input type="text" name="club" id="create-club-input" class="financial-input" placeholder="Ej: New Padel Pro" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                            </div>
                        </div>

                        <!-- Nombre del Organizador -->
                        <div class="form-group">
                            <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">
                                <i class="fas fa-user-tie" style="color: #16a34a;"></i> ORGANIZADOR DE LA AMERICANA
                            </label>
                            <input type="text" name="organizer" id="new-evt-organizer" class="financial-input" placeholder="Ej: Alex / SomosPadel / Club Pádel" value="Alex Coscolín" style="width: 100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem;">
                        </div>

                        <!-- PRIVACIDAD & ACCESO EXCLUSIVO -->
                        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 0.75rem; font-weight: 800; color: #dc2626; text-transform: uppercase; display: block; margin-bottom: 6px;">
                                        <i class="fas fa-user-lock"></i> PRIVACIDAD
                                    </label>
                                    <select name="is_private" id="create-americana-is-private" class="financial-input" style="width:100%; text-align:left; height:40px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700;" onchange="const pg = document.getElementById('create-americana-pin-group'); if (pg) pg.style.display = (this.value === 'true' ? 'block' : 'none');">
                                        <option value="false" selected>🌐 PÚBLICA (Abierta a todos)</option>
                                        <option value="true">🔒 PRIVADA (Con contraseña)</option>
                                    </select>
                                </div>
                                <div class="form-group" id="create-americana-pin-group" style="margin-bottom: 0; display: none;">
                                    <label style="font-size: 0.75rem; font-weight: 800; color: #0284c7; text-transform: uppercase; display: block; margin-bottom: 6px;">
                                        <i class="fas fa-key"></i> CLAVE / PIN DE ACCESO
                                    </label>
                                    <input type="text" name="access_pin" id="create-americana-pin-input" class="financial-input" placeholder="Ej: 1234" style="font-weight: 800; letter-spacing: 1px; width:100%; text-align:left; height:40px; border: 1px solid #cbd5e1; border-radius: 8px;">
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">FECHA</label>
                                <input type="date" name="date" id="new-evt-date" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;" required>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">INICIO</label>
                                <input type="time" name="time" id="new-evt-time" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;" value="18:00" required>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">FIN</label>
                                <input type="time" name="time_end" id="new-evt-time-end" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;" value="20:00">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">CATEGORÍA</label>
                                <select name="category" id="new-evt-category" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700;">
                                    <option value="male" selected>MASCULINO</option>
                                    <option value="female">FEMENINO</option>
                                    <option value="mixed">MIXTO</option>
                                    <option value="open">TODOS / OPEN</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">
                                    <i class="fas fa-map-marker-alt" style="color: #0284c7;"></i> SEDE / CLUB
                                </label>
                                <select name="location" id="new-evt-club" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700;">
                                    <optgroup label="⭐ CLUBES COLABORADORES (FAVORITOS)">
                                        <option value="Barcelona Pádel el Prat">⭐ Barcelona Pádel el Prat (14 Pistas)</option>
                                        <option value="Delfos Cornellà">⭐ Delfos Cornellà (8 Pistas)</option>
                                        <option value="New Play Pádel Pro" selected>⭐ New Play Pádel Pro (5 Pistas)</option>
                                        <option value="CEM Tennis Hospitalet">⭐ CEM Tennis Hospitalet (4 Pistas)</option>
                                    </optgroup>
                                    <optgroup label="📍 OTRAS SEDES Y CLUBES">
                                        <option value="Padel Indoor Hospitalet">Padel Indoor Hospitalet</option>
                                        <option value="Aurial Cornellà">Aurial Cornellà</option>
                                        <option value="PELL Cornellà Pádel">PELL Cornellà Pádel</option>
                                        <option value="CEM Estruch El Prat">CEM Estruch El Prat</option>
                                        <option value="CT Pádel El Prat">CT Pádel El Prat</option>
                                        <option value="Padelarium Gavá">Padelarium Gavá</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">MODO DE JUEGO</label>
                                <select name="pair_mode" id="create-americana-pair-mode" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 700;" onchange="window.OrganizacionERP.updatePairModeHelper(this, 'create-americana-pair-mode-desc-page')">
                                    <option value="twister" selected>🌪️ TWISTER INDIVIDUAL (Pozo rotativo)</option>
                                    <option value="fixed">🔒 PAREJA FIJA (Dupla todo el torneo)</option>
                                    <option value="swiss">🇨🇭 SUIZO (Puntos acumulados)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">ESTADO</label>
                                <select name="status" id="new-evt-status" class="financial-input" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800;">
                                    <option value="open" selected>🟢 ABIERTA</option>
                                    <option value="pairing">🔀 EMPAREJAMIENTO</option>
                                    <option value="live">🎾 EN JUEGO</option>
                                    <option value="finished">🏁 FINALIZADA</option>
                                    <option value="cancelled">⛔ ANULADO</option>
                                </select>
                            </div>
                        </div>

                        <!-- EXPLICACIÓN DINÁMICA DEL MODO DE JUEGO -->
                        <div id="create-americana-pair-mode-desc-page" style="background: rgba(2, 132, 199, 0.06); border-left: 3px solid #0284c7; padding: 10px 14px; border-radius: 8px; font-size: 0.74rem; color: #334155; line-height: 1.4;">
                            <div style="display:flex; align-items:flex-start; gap:8px;">
                                <span style="font-size: 1.15rem; line-height: 1;">🌪️</span>
                                <div>
                                    <strong style="color: #0284c7; font-size: 0.76rem; text-transform: uppercase;">Modalidad Twister Individual:</strong>
                                    <div style="color: #475569; font-size: 0.72rem; margin-top: 2px;">
                                        Los jugadores compiten individualmente; ganadores suben de pista, perdedores bajan, rotando compañeros sin repetir pareja.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">NIVEL MÍNIMO</label>
                                <input type="text" name="level_min" id="new-evt-level-min" class="financial-input" placeholder="Ej: 3.5" value="3.5" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">NIVEL MÁXIMO</label>
                                <input type="text" name="level_max" id="new-evt-level-max" class="financial-input" placeholder="Ej: 4.5" value="4.5" style="width:100%; text-align:left; height:42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                            </div>
                        </div>

                        <h3 style="color: #0f172a; font-size: 0.95rem; font-weight:900; margin: 8px 0 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-cogs"></i> LOGÍSTICA
                        </h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">PISTAS</label>
                                <input type="number" name="max_courts" id="new-evt-courts" class="financial-input" value="4" min="1" max="5" style="text-align:center; width:100%; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800;">
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">RONDAS</label>
                                <input type="number" name="rounds_count" id="new-evt-rounds" class="financial-input" value="6" style="text-align:center; width:100%; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800;">
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">€ SOCIO</label>
                                <input type="number" name="price_members" id="new-evt-price" step="0.5" class="financial-input" value="12" style="text-align:center; width:100%; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800;">
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.75rem; font-weight: 800; color: #0f172a; text-transform: uppercase; display: block; margin-bottom: 6px;">€ EXT.</label>
                                <input type="number" name="price_external" id="new-evt-price-ext" step="0.5" class="financial-input" value="14" style="text-align:center; width:100%; height:42px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 800;">
                            </div>
                        </div>

                        <!-- Imagen de Portada / Cartel (Idéntico a Admin) -->
                        <div class="form-group" style="margin-top: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label style="margin: 0; font-weight: 800; font-size: 0.75rem; color: #0f172a; text-transform: uppercase;">
                                    <i class="fas fa-camera" style="color: #0284c7;"></i> IMAGEN DE PORTADA / CARTEL
                                </label>
                                <span style="font-size: 0.68rem; color: #64748b; font-weight: 500;">(JPG, PNG o WebP)</span>
                            </div>

                            <!-- Banner Preview & Drop Zone -->
                            <div id="page-americana-img-dropzone" 
                                 onclick="document.getElementById('page-americana-file-input').click()"
                                 style="position: relative; width: 100%; height: 105px; border-radius: 10px; border: 2px dashed #0284c7; background: #f8fafc; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s ease; margin-bottom: 10px;">
                                 
                                <img id="page-americana-img-preview" src="" alt="Portada" 
                                     style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.7; display: none;">
                                
                                <div style="position: relative; z-index: 2; text-align: center; pointer-events: none;">
                                    <div style="background: rgba(15, 23, 42, 0.88); color: #ffffff; font-size: 0.74rem; font-weight: 800; padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <span>SUBIR FOTO O CARTEL DE LA AMERICANA</span>
                                    </div>
                                    <p style="margin: 5px 0 0; font-size: 0.65rem; color: #64748b;">Haz clic para elegir foto desde tu ordenador o arrástrala aquí</p>
                                </div>
                            </div>

                            <!-- Hidden File Input -->
                            <input type="file" id="page-americana-file-input" accept="image/*" style="display: none;" onchange="window.OrganizacionERP.handleAmericanaImageUpload(this, 'erp-americana-img-input', 'page-americana-img-preview')">

                            <!-- URL Input & Secondary Actions -->
                            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                <input type="text" name="image_url" id="erp-americana-img-input" class="financial-input"
                                    placeholder="O escribe una URL directa..." style="width:100%; text-align:left; height:40px; font-size:0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;" oninput="window.OrganizacionERP.updateAmericanaImagePreview(this.value, 'page-americana-img-preview')">
                                <button type="button" class="btn-erp btn-erp-secondary" onclick="document.getElementById('page-americana-file-input').click()" 
                                        title="Subir archivo" style="padding: 0 16px; height: 40px; font-size:0.78rem; font-weight:800; white-space:nowrap; border-radius: 8px;">
                                    <i class="fas fa-folder-open"></i> SUBIR
                                </button>
                            </div>

                            <!-- Quick Image Selectors -->
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                                <span style="font-size: 0.68rem; color: #64748b; font-weight: 800; margin-right: 4px;">PRESETS:</span>
                                <button type="button" class="btn-micro" style="background: #22c55e; color: #ffffff; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:none; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/americana masculina.jpg')">Masc</button>
                                <button type="button" class="btn-micro" style="background: #ec4899; color: #ffffff; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:none; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/americana femeninas.jpg')">Fem</button>
                                <button type="button" class="btn-micro" style="background: #eab308; color: #000000; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:none; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/americana mixta.jpg')">Mixta</button>
                                <button type="button" class="btn-micro" style="background: #f1f5f9; color: #0f172a; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/entreno todo prat.jpg')">Prat</button>
                                <button type="button" class="btn-micro" style="background: #f1f5f9; color: #0f172a; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/entreno todo delfos.jpg')">Delfos</button>
                                <button type="button" class="btn-micro" style="background: #38bdf8; color: #0f172a; padding:4px 10px; font-size:0.72rem; font-weight:900; border-radius:6px; border:none; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/new_play_padel_pro.png')">⭐ New Play</button>
                                <button type="button" class="btn-micro" style="background: #0284c7; color: #ffffff; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:none; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/cem_tennis_hospitalet.png')">⭐ CEM Tennis</button>
                                <button type="button" class="btn-micro" style="background: #0284c7; color: #ffffff; padding:4px 10px; font-size:0.72rem; font-weight:800; border-radius:6px; border:none; cursor:pointer;"
                                    onclick="window.OrganizacionERP.selectCreateAmericanaImage('img/ball-mixta.png')">Pelota</button>
                            </div>
                        </div>

                        <div style="display: flex; gap: 14px; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                            <button type="button" class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.setEventsSubTab('mgmt')" style="flex: 1; height: 48px; font-weight: 800; font-size: 0.9rem; text-transform: uppercase; border-radius: 8px;">
                                CANCELAR
                            </button>
                            <button type="submit" class="btn-erp btn-erp-primary" style="flex: 2; height: 48px; font-weight: 900; font-size: 0.95rem; text-transform: uppercase; border-radius: 8px; background: #0f172a; color: #ffffff;">
                                PUBLICAR AMERICANA 🚀
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    function renderEventsMgmtPageView() {
        const filteredList = getFilteredEvents();

        return `
            <!-- BARRA DE FILTROS Y BÚSQUEDA AVANZADA (IDÉNTICA A GESTOR DE AMERICANAS) -->
            <div style="display:flex; gap:10px; margin-bottom:1.5rem; flex-wrap:wrap; align-items:center; background:#ffffff; padding:12px; border-radius:12px; border:1px solid var(--erp-border);">
                <div style="flex:1; min-width:220px;">
                    <div style="position:relative;">
                        <input type="text" class="financial-input" placeholder="🔍 Buscar americana, sede, organizador..." 
                            value="${escapeHtml(state.americanaSearchQuery)}"
                            oninput="window.OrganizacionERP.onAmericanaSearch(this.value)"
                            style="width:100%; text-align:left; height:38px; padding-left:32px;">
                        <i class="fas fa-search" style="position:absolute; left:10px; top:12px; color:#94a3b8; font-size:0.8rem;"></i>
                    </div>
                </div>

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <select class="financial-input" style="width:160px; height:38px; text-align:left;" onchange="window.OrganizacionERP.onAmericanaFilterChange('club', this.value)">
                        <option value="all" ${state.filters.club === 'all' ? 'selected' : ''}>Todos los Clubes</option>
                        ${Object.keys(state.clubs).map(c => `<option value="${escapeHtml(c)}" ${state.filters.club === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                    </select>

                    <select class="financial-input" style="width:140px; height:38px; text-align:left;" onchange="window.OrganizacionERP.onAmericanaFilterChange('category', this.value)">
                        <option value="all" ${state.americanaFilterCategory === 'all' ? 'selected' : ''}>Categorías</option>
                        <option value="male" ${state.americanaFilterCategory === 'male' ? 'selected' : ''}>Masculino</option>
                        <option value="female" ${state.americanaFilterCategory === 'female' ? 'selected' : ''}>Femenino</option>
                        <option value="mixed" ${state.americanaFilterCategory === 'mixed' ? 'selected' : ''}>Mixto</option>
                        <option value="open" ${state.americanaFilterCategory === 'open' ? 'selected' : ''}>Open</option>
                    </select>

                    <select class="financial-input" style="width:130px; height:38px; text-align:left;" onchange="window.OrganizacionERP.onAmericanaFilterChange('status', this.value)">
                        <option value="all" ${state.americanaFilterStatus === 'all' ? 'selected' : ''}>Estados</option>
                        <option value="open" ${state.americanaFilterStatus === 'open' ? 'selected' : ''}>🟢 Abierta</option>
                        <option value="pairing" ${state.americanaFilterStatus === 'pairing' ? 'selected' : ''}>🔀 Parejas</option>
                        <option value="live" ${state.americanaFilterStatus === 'live' ? 'selected' : ''}>🎾 En Juego</option>
                        <option value="finished" ${state.americanaFilterStatus === 'finished' ? 'selected' : ''}>🏁 Finalizada</option>
                    </select>
                </div>
            </div>

            <div class="erp-table-responsive">
                <table class="erp-table">
                    <thead>
                        <tr>
                            <th>Nombre Americana</th>
                            <th>Fecha & Hora</th>
                            <th>Club / Sede</th>
                            <th>Organizador</th>
                            <th>Pistas</th>
                            <th>Jugadores</th>
                            <th>Ingresos</th>
                            <th>Costes</th>
                            <th>Beneficio</th>
                            <th>Margen</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="erp-events-table-body">
                        ${filteredList.length > 0 
                            ? filteredList.map(evt => renderEventRow(evt)).join('')
                            : `<tr><td colspan="11" style="text-align:center; padding:2rem; color:var(--erp-text-muted);">No se encontraron americanas con los filtros actuales.</td></tr>`
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderEventRow(evt) {
        const f = evt.calculatedFin;
        return `
            <tr>
                <td>
                    <strong style="color:var(--erp-text-main); font-size:0.88rem;">${evt.title || evt.name || 'Americana'}</strong>
                    <div style="font-size:0.7rem; color:var(--erp-text-dim);">${evt.category || 'Categoría General'} • ${evt.level || ''}</div>
                </td>
                <td>
                    <div>${evt.date || 'Pendiente'}</div>
                    <div style="font-size:0.7rem; color:var(--erp-text-muted);">${evt.time || ''}</div>
                </td>
                <td>
                    <strong>${evt.club || evt.location || 'Sede'}</strong>
                </td>
                <td>
                    <div style="font-size:0.78rem; font-weight:700;">${evt.organizer || 'Alex Coscolín'}</div>
                </td>
                <td style="text-align:center;">${f.courtsCount}</td>
                <td style="text-align:center;">${f.registeredCount}</td>
                <td class="erp-money">${f.results.totalIncome.toFixed(2)} €</td>
                <td class="erp-money negative">${f.results.totalExpense.toFixed(2)} €</td>
                <td class="erp-money positive"><strong>${f.results.netProfit.toFixed(2)} €</strong></td>
                <td>
                    <span class="traffic-badge ${f.results.marginPct >= 30 ? 'green' : (f.results.marginPct >= 15 ? 'yellow' : 'red')}" style="padding:4px 8px; font-size:0.65rem;">
                        ${f.results.marginPct.toFixed(1)}%
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="erp-btn-micro" title="Ficha Económica y Costes" onclick="window.OrganizacionERP.openFinancialModal('${evt.id}')">
                            <i class="fas fa-coins" style="color:#0284c7;"></i> Finanzas
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ==========================================================================
    // 5. SISTEMA MULTI-CLUB: PESTAÑAS, VISTA GLOBAL Y ANÁLISIS DETALLADO
    // ==========================================================================
    function selectClubTab(clubName) {
        state.activeClubTab = clubName;
        if (state.activeTab !== 'clubs') {
            state.activeTab = 'clubs';
            document.querySelectorAll('.erp-nav-item').forEach(el => {
                el.classList.toggle('active', el.dataset.tab === 'clubs');
            });
            const titleEl = document.getElementById('erp-topbar-title');
            const descEl = document.getElementById('erp-topbar-desc');
            if (titleEl) titleEl.textContent = 'Análisis por Club de Pádel';
            if (descEl) descEl.textContent = 'Control individual de sedes, rentabilidad y acuerdos comerciales';
        }
        renderActiveTab();
    }

    function openNewClubModal() {
        const modal = document.getElementById('erp-new-club-modal');
        if (!modal) return;
        const nameInp = document.getElementById('new-club-name');
        if (nameInp) nameInp.value = '';
        const notesInp = document.getElementById('new-club-notes');
        if (notesInp) notesInp.value = '';
        modal.classList.add('open');
    }

    function saveNewClubFromForm() {
        const getV = id => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const name = getV('new-club-name');
        if (!name) {
            alert("⚠️ Por favor, introduce el nombre del club.");
            return;
        }

        const courts = parseInt(getV('new-club-courts') || 6);
        const location = getV('new-club-location') || 'Barcelona';
        const contact = getV('new-club-contact') || 'Dirección de Pistas';
        const tariffMorning = parseFloat(getV('new-club-tariff-morning') || 12);
        const tariffEvening = parseFloat(getV('new-club-tariff-evening') || 32);
        const tariffNight = parseFloat(getV('new-club-tariff-night') || 12);
        const tariffWeekend = parseFloat(getV('new-club-tariff-weekend') || 20);
        const defaultPrice = parseFloat(getV('new-club-price') || 14);
        const durationMin = parseInt(getV('new-club-duration') || 120);
        const notes = getV('new-club-notes') || 'Condiciones registradas en el ERP.';

        const clubId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

        const newClub = {
            id: clubId,
            name: name,
            location: location,
            courts: courts,
            contact: contact,
            tariffs: {
                morning: tariffMorning,
                evening: tariffEvening,
                afternoon: tariffEvening,
                night: tariffNight,
                weekend: tariffWeekend,
                durationMin: durationMin,
                defaultPrice: defaultPrice
            },
            notes: notes,
            status: 'active'
        };

        state.registeredClubs[name] = newClub;
        try {
            localStorage.setItem('sp_registered_clubs', JSON.stringify(state.registeredClubs));
        } catch (e) {
            console.warn("Aviso guardando en localStorage:", e);
        }

        computeClubsAnalytics();
        closeModal('erp-new-club-modal');
        state.activeClubTab = name;
        renderActiveTab();
        alert(`🎉 ¡El club "${name}" ha sido dado de alta correctamente! Se ha abierto su pestaña individual.`);
    }

    function openEditClubModal(clubName) {
        if (!clubName) clubName = state.activeClubTab;
        const club = state.clubs[clubName] || state.registeredClubs[clubName];
        if (!club) {
            alert("No se encontró el club para editar.");
            return;
        }

        const modal = document.getElementById('erp-edit-club-modal');
        if (!modal) return;

        const tariffs = club.tariffs || {};

        const origEl = document.getElementById('edit-club-original-name');
        const nameEl = document.getElementById('edit-club-name');
        const courtsEl = document.getElementById('edit-club-courts');
        const locEl = document.getElementById('edit-club-location');
        const contactEl = document.getElementById('edit-club-contact');
        const mornEl = document.getElementById('edit-club-tariff-morning');
        const eveEl = document.getElementById('edit-club-tariff-evening');
        const nightEl = document.getElementById('edit-club-tariff-night');
        const weekEl = document.getElementById('edit-club-tariff-weekend');
        const priceEl = document.getElementById('edit-club-price');
        const durEl = document.getElementById('edit-club-duration');
        const notesEl = document.getElementById('edit-club-notes');
        const subtitleEl = document.getElementById('edit-club-subtitle');

        if (origEl) origEl.value = club.name;
        if (nameEl) nameEl.value = club.name;
        if (courtsEl) courtsEl.value = club.courtsAvailable || club.courts || 5;
        if (locEl) locEl.value = club.location || 'Barcelona';
        if (contactEl) contactEl.value = club.contact || 'Dirección de Pistas';
        if (mornEl) mornEl.value = tariffs.morning !== undefined ? tariffs.morning : 12;
        if (eveEl) eveEl.value = tariffs.evening !== undefined ? tariffs.evening : (tariffs.afternoon !== undefined ? tariffs.afternoon : 32);
        if (nightEl) nightEl.value = tariffs.night !== undefined ? tariffs.night : 12;
        if (weekEl) weekEl.value = tariffs.weekend !== undefined ? tariffs.weekend : 20;
        if (priceEl) priceEl.value = tariffs.defaultPrice || 14;
        if (durEl) durEl.value = tariffs.durationMin || 120;
        if (notesEl) notesEl.value = club.notes || '';
        if (subtitleEl) subtitleEl.textContent = `Edita las tarifas de alquiler, costes pactados y observaciones de ${club.name}`;

        modal.classList.add('open');
    }

    function saveClubEdits() {
        const getV = id => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const originalName = getV('edit-club-original-name');
        const newName = getV('edit-club-name');

        if (!newName) {
            alert("⚠️ El nombre del club no puede estar vacío.");
            return;
        }

        const courts = parseInt(getV('edit-club-courts') || 6);
        const location = getV('edit-club-location') || 'Barcelona';
        const contact = getV('edit-club-contact') || 'Dirección de Pistas';
        const tariffMorning = parseFloat(getV('edit-club-tariff-morning') || 12);
        const tariffEvening = parseFloat(getV('edit-club-tariff-evening') || 32);
        const tariffNight = parseFloat(getV('edit-club-tariff-night') || 12);
        const tariffWeekend = parseFloat(getV('edit-club-tariff-weekend') || 20);
        const defaultPrice = parseFloat(getV('edit-club-price') || 14);
        const durationMin = parseInt(getV('edit-club-duration') || 120);
        const notes = getV('edit-club-notes') || '';

        const existingClub = state.registeredClubs[originalName] || {};

        const updatedClub = {
            ...existingClub,
            id: newName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: newName,
            location: location,
            courts: courts,
            contact: contact,
            tariffs: {
                morning: tariffMorning,
                evening: tariffEvening,
                afternoon: tariffEvening,
                night: tariffNight,
                weekend: tariffWeekend,
                durationMin: durationMin,
                defaultPrice: defaultPrice
            },
            notes: notes,
            status: existingClub.status || 'active'
        };

        if (originalName && originalName !== newName) {
            delete state.registeredClubs[originalName];
            delete state.clubs[originalName];
            // Actualizar referencias en los eventos históricos para no perder el enlace
            state.events.forEach(e => {
                if ((e.club || e.location) === originalName) {
                    e.club = newName;
                    e.location = newName;
                }
            });
            if (state.activeClubTab === originalName) {
                state.activeClubTab = newName;
            }
        }

        state.registeredClubs[newName] = updatedClub;

        // También actualizar el simulador del club con las nuevas tarifas
        if (state.clubSimulators[newName] || state.clubSimulators[originalName]) {
            const sim = state.clubSimulators[originalName] || state.clubSimulators[newName];
            sim.courtCost = tariffMorning;
            sim.playerPrice = defaultPrice;
            if (originalName !== newName) {
                state.clubSimulators[newName] = sim;
                delete state.clubSimulators[originalName];
            }
        }

        try {
            localStorage.setItem('sp_registered_clubs', JSON.stringify(state.registeredClubs));
        } catch (e) {
            console.warn("Aviso guardando en localStorage:", e);
        }

        computeClubsAnalytics();
        closeModal('erp-edit-club-modal');
        renderActiveTab();
        alert(`✅ ¡La ficha de "${newName}", sus tarifas y costes se han actualizado con éxito!`);
    }

    function deleteClub(clubName) {
        if (!clubName) {
            const origEl = document.getElementById('edit-club-original-name');
            clubName = origEl ? origEl.value.trim() : state.activeClubTab;
        }

        if (!clubName || clubName === 'all') return;

        if (!confirm(`¿Estás seguro de que deseas eliminar el club "${clubName}" de la red de sedes? Esta acción retirará su ficha y acuerdos.`)) {
            return;
        }

        delete state.registeredClubs[clubName];
        delete state.clubs[clubName];
        delete state.clubSimulators[clubName];

        try {
            localStorage.setItem('sp_registered_clubs', JSON.stringify(state.registeredClubs));
        } catch (e) {
            console.warn("Aviso guardando en localStorage:", e);
        }

        if (state.activeClubTab === clubName) {
            state.activeClubTab = 'all';
        }

        closeModal('erp-edit-club-modal');
        computeClubsAnalytics();
        renderActiveTab();
        alert(`🗑️ El club "${clubName}" ha sido eliminado de la red.`);
    }

    function getClubSimState(clubName) {
        const maxC = (clubName === 'New Padel Pro') ? 5 : ((state.clubs[clubName] && state.clubs[clubName].courts) || 5);
        if (!state.clubSimulators[clubName]) {
            const club = state.clubs[clubName] || {};
            const tariffs = club.tariffs || {};
            state.clubSimulators[clubName] = {
                courts: maxC,
                playerPrice: tariffs.defaultPrice || 12,
                courtCost: tariffs.morning || 16,
                ballsCost: 5,
                helpersCount: 0,
                helperFee: 30,
                sharingMode: '50_50' // '50_50', '100_alex', '100_socio', '60_alex_40_socio', '60_socio_40_alex'
            };
        } else {
            state.clubSimulators[clubName].courts = Math.min(maxC, Math.max(1, state.clubSimulators[clubName].courts || maxC));
        }
        return state.clubSimulators[clubName];
    }

    function updateClubSim(clubName, param, value) {
        const sim = getClubSimState(clubName);
        const maxC = (clubName === 'New Padel Pro') ? 5 : ((state.clubs[clubName] && state.clubs[clubName].courts) || 5);
        if (param === 'courts') sim.courts = Math.min(maxC, Math.max(1, parseInt(value)));
        else if (param === 'playerPrice') sim.playerPrice = parseFloat(value);
        else if (param === 'courtCost') sim.courtCost = parseFloat(value);
        else if (param === 'helpersCount') sim.helpersCount = parseInt(value);
        else if (param === 'sharingMode') sim.sharingMode = value;
        renderActiveTab();
    }

    function renderClubsView() {
        const clubNames = Object.keys(state.clubs).sort((a, b) => {
            // New Padel Pro primero si existe, luego por margen
            if (a === 'New Padel Pro') return -1;
            if (b === 'New Padel Pro') return 1;
            return (state.clubs[b].marginPct || 0) - (state.clubs[a].marginPct || 0);
        });

        // 1. Barra superior de navegación por pestañas de clubes
        const tabsBarHtml = `
            <div class="club-tabs-nav">
                <button class="club-tab-pill ${state.activeClubTab === 'all' ? 'active' : ''}" onclick="window.OrganizacionERP.selectClubTab('all')">
                    <i class="fas fa-network-wired"></i>
                    <span>Todos los Clubes (Vista Global)</span>
                    <span class="traffic-badge green" style="font-size:0.6rem; padding:2px 6px;">${clubNames.length} SEDES</span>
                </button>

                ${clubNames.map(name => {
                    const c = state.clubs[name];
                    const isActive = state.activeClubTab === name;
                    const badgeClass = c.trafficStatus || 'green';
                    const marginTxt = c.eventsCount > 0 ? `${c.marginPct.toFixed(0)}%` : 'NUEVO';
                    return `
                        <button class="club-tab-pill ${isActive ? 'active' : ''}" onclick="window.OrganizacionERP.selectClubTab('${escapeHtml(name)}')">
                            <i class="fas fa-table-tennis-paddle-ball"></i>
                            <span>${escapeHtml(name)}</span>
                            <span class="traffic-badge ${badgeClass}" style="font-size:0.6rem; padding:2px 6px;">${marginTxt}</span>
                        </button>
                    `;
                }).join('')}

                <button class="club-tab-pill-add" onclick="window.OrganizacionERP.openNewClubModal()">
                    <i class="fas fa-plus"></i>
                    <span>+ Añadir Nuevo Club</span>
                </button>
            </div>
        `;

        // 2. Renderizado según la pestaña activa
        if (state.activeClubTab === 'all') {
            return tabsBarHtml + renderAllClubsConsolidatedView();
        } else if (state.activeClubTab === 'New Padel Pro') {
            return tabsBarHtml + renderNewPadelProView(true);
        } else {
            const selectedClub = state.clubs[state.activeClubTab] || Object.values(state.clubs)[0];
            return tabsBarHtml + renderClubDetailView(selectedClub);
        }
    }

    function renderAllClubsConsolidatedView() {
        const sortedClubs = Object.values(state.clubs).sort((a, b) => b.netProfit - a.netProfit);
        const kpis = computeExecutiveKPIs();

        return `
            <!-- HEADER DE VISTA CONSOLIDADA -->
            <div class="club-header-banner">
                <div>
                    <span style="font-size:0.75rem; font-weight:800; color:var(--erp-text-dim); text-transform:uppercase; letter-spacing:0.5px;">RED DE SEDES DEPORTIVAS</span>
                    <h3 style="font-family:var(--erp-font-title); font-size:1.4rem; font-weight:900; color:var(--erp-text-main); margin:4px 0;">
                        Control Global de Clubes Colaboradores
                    </h3>
                    <p style="font-size:0.8rem; color:var(--erp-text-muted); margin:0;">
                        Compara la rentabilidad económica, margen limpio y volumen de jugadores entre todas las sedes de Barcelona.
                    </p>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button class="btn-erp btn-erp-primary" onclick="window.OrganizacionERP.openNewClubModal()">
                        <i class="fas fa-plus-circle"></i> Registrar Nuevo Club
                    </button>
                </div>
            </div>

            <!-- TARJETAS CONSOLIDADAS DE LA RED -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
                <div class="erp-card" style="border-top:4px solid #0f172a;">
                    <div style="font-size:0.7rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Facturación Global Red</div>
                    <div class="erp-money" style="font-size:1.6rem; color:var(--erp-text-main); margin:4px 0;">${kpis.totalIncome.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.7rem; color:var(--erp-text-muted);">${kpis.totalPlayers} jugadores registrados</div>
                </div>

                <div class="erp-card" style="border-top:4px solid #e11d48;">
                    <div style="font-size:0.7rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Costes de Pistas y Bolas</div>
                    <div class="erp-money negative" style="font-size:1.6rem; margin:4px 0;">-${kpis.totalExpense.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.7rem; color:var(--erp-text-muted);">Alquiler de pistas en todos los clubes</div>
                </div>

                <div class="erp-card" style="border-top:4px solid #16a34a; background:linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
                    <div style="font-size:0.7rem; color:#166534; text-transform:uppercase; font-weight:800;">Dinero Limpio Total Red</div>
                    <div class="erp-money positive" style="font-size:1.75rem; margin:4px 0;">+${kpis.totalNetProfit.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.75rem; color:#15803d; font-weight:700;">${kpis.globalMargin.toFixed(1)}% Margen Medio Limpio</div>
                </div>

                <div class="erp-card" style="border-top:4px solid #0284c7;">
                    <div style="font-size:0.7rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Club Estrella (Más Rentable)</div>
                    <div style="font-size:1.25rem; font-weight:900; color:#0284c7; margin:6px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${kpis.topClub ? kpis.topClub.name : 'Pendiente'}
                    </div>
                    <div style="font-size:0.7rem; color:var(--erp-text-muted);">
                        ${kpis.topClub ? `+${kpis.topClub.netProfit.toLocaleString('es-ES')} € limpios (${kpis.topClub.marginPct.toFixed(1)}%)` : 'Sin datos'}
                    </div>
                </div>
            </div>

            <!-- TARJETAS RESUMEN DE CADA CLUB CON ACCESO A SU PESTAÑA -->
            <div style="margin-bottom:1.5rem;">
                <h4 style="font-family:var(--erp-font-title); font-size:1.05rem; font-weight:900; color:var(--erp-text-main); margin-bottom:1rem;">
                    <i class="fas fa-traffic-light"></i> Ranking de Sedes por Rentabilidad Económica
                </h4>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
                    ${sortedClubs.map(club => `
                        <div class="erp-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div class="erp-card-header" style="margin-bottom:10px;">
                                    <div>
                                        <h3 class="erp-card-title" style="font-size:1.1rem; cursor:pointer;" onclick="window.OrganizacionERP.selectClubTab('${escapeHtml(club.name)}')">
                                            ${escapeHtml(club.name)}
                                        </h3>
                                        <div style="font-size:0.72rem; color:var(--erp-text-dim); margin-top:2px;">
                                            <i class="fas fa-location-dot"></i> ${escapeHtml(club.location || 'Barcelona')} • ${club.eventsCount} eventos realizados
                                        </div>
                                    </div>
                                    <span class="traffic-badge ${club.trafficStatus}">
                                        ${club.trafficLabel}
                                    </span>
                                </div>

                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:12px; background:#f8fafc; border-radius:12px; border:1px solid var(--erp-border); margin-bottom:12px;">
                                    <div>
                                        <div style="font-size:0.65rem; color:var(--erp-text-dim); text-transform:uppercase;">Facturación</div>
                                        <div class="erp-money" style="font-size:1.05rem;">${club.totalIncome.toLocaleString('es-ES')} €</div>
                                    </div>
                                    <div>
                                        <div style="font-size:0.65rem; color:var(--erp-text-dim); text-transform:uppercase;">Costes Pistas</div>
                                        <div class="erp-money negative" style="font-size:1.05rem;">-${club.totalExpense.toLocaleString('es-ES')} €</div>
                                    </div>
                                    <div>
                                        <div style="font-size:0.65rem; color:var(--erp-text-dim); text-transform:uppercase;">Dinero Limpio</div>
                                        <div class="erp-money positive" style="font-size:1.2rem;">+${club.netProfit.toLocaleString('es-ES')} €</div>
                                    </div>
                                    <div>
                                        <div style="font-size:0.65rem; color:var(--erp-text-dim); text-transform:uppercase;">Margen Neto</div>
                                        <div class="erp-money" style="font-size:1.2rem; color:#15803d;">${club.marginPct.toFixed(1)}%</div>
                                    </div>
                                </div>

                                <div style="font-size:0.74rem; border-top:1px solid var(--erp-border); padding-top:8px; margin-bottom:10px;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                        <span style="color:var(--erp-text-muted);">Limpio medio / evento:</span>
                                        <strong>+${club.avgProfitPerEvent.toFixed(2)} €</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span style="color:var(--erp-text-muted);">Limpio medio / jugador:</span>
                                        <strong>+${club.avgProfitPerPlayer.toFixed(2)} €</strong>
                                    </div>
                                </div>

                                <div style="padding:8px 10px; background:#f8fafc; border-radius:8px; font-size:0.72rem; color:var(--erp-text-main); margin-bottom:14px; line-height:1.4;">
                                    ${club.strategicTip}
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr auto; gap:8px;">
                                <button class="btn-erp btn-erp-primary" style="justify-content:center;" onclick="window.OrganizacionERP.selectClubTab('${escapeHtml(club.name)}')">
                                    <i class="fas fa-folder-open"></i> Abrir Pestaña
                                </button>
                                <button class="btn-erp btn-erp-secondary" title="Modificar Datos, Costes y Tarifas" onclick="window.OrganizacionERP.openEditClubModal('${escapeHtml(club.name)}')">
                                    <i class="fas fa-pen-to-square"></i> Editar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- TABLA COMPARATIVA CONSOLIDADA -->
            <div class="erp-card">
                <div class="erp-card-header">
                    <div>
                        <h4 class="erp-card-title"><i class="fas fa-table-list"></i> Matriz Comparativa Detallada de Rendimiento por Sede</h4>
                        <p class="erp-card-subtitle">Métricas unitarias para decidir dónde conviene ampliar pistas o renegociar tarifas</p>
                    </div>
                </div>

                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Club / Sede</th>
                                <th>Ubicación</th>
                                <th style="text-align:center;">Eventos</th>
                                <th style="text-align:center;">Jugadores</th>
                                <th>Facturación</th>
                                <th>Costes</th>
                                <th>Beneficio Limpio</th>
                                <th>Margen</th>
                                <th>Limpio / Evento</th>
                                <th>Limpio / Pista</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedClubs.map(c => `
                                <tr>
                                    <td>
                                        <strong style="color:var(--erp-text-main); cursor:pointer;" onclick="window.OrganizacionERP.selectClubTab('${escapeHtml(c.name)}')">
                                            ${escapeHtml(c.name)}
                                        </strong>
                                    </td>
                                    <td style="font-size:0.75rem; color:var(--erp-text-muted);">${escapeHtml(c.location || 'Barcelona')}</td>
                                    <td style="text-align:center; font-weight:700;">${c.eventsCount}</td>
                                    <td style="text-align:center;">${c.playersCount}</td>
                                    <td class="erp-money">${c.totalIncome.toLocaleString('es-ES')} €</td>
                                    <td class="erp-money negative">-${c.totalExpense.toLocaleString('es-ES')} €</td>
                                    <td class="erp-money positive"><strong>+${c.netProfit.toLocaleString('es-ES')} €</strong></td>
                                    <td>
                                        <span class="traffic-badge ${c.trafficStatus}" style="padding:3px 8px; font-size:0.68rem;">
                                            ${c.marginPct.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td style="font-weight:700; color:#15803d;">+${c.avgProfitPerEvent.toFixed(2)} €</td>
                                    <td style="font-weight:700; color:#0284c7;">+${c.avgProfitPerCourt.toFixed(2)} €</td>
                                    <td>
                                        <button class="erp-btn-micro" onclick="window.OrganizacionERP.selectClubTab('${escapeHtml(c.name)}')">
                                            <i class="fas fa-arrow-right"></i> Pestaña
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderClubDetailView(club) {
        if (!club) return `<div class="erp-card">No se ha encontrado la información del club seleccionado.</div>`;

        const tariffs = club.tariffs || {};
        const sim = getClubSimState(club.name);

        // Cálculos del simulador específico de este club (máx. 5 pistas en New Padel Pro)
        const maxClubCourts = (club.name === 'New Padel Pro') ? 5 : (club.courts || club.courtsAvailable || 5);
        const simCourts = Math.min(maxClubCourts, Math.max(1, sim.courts || maxClubCourts));
        const simPlayers = simCourts * 4;
        const simPlayerPrice = sim.playerPrice || tariffs.defaultPrice || 12;
        const simCourtCost = sim.courtCost || tariffs.morning || 16;
        const simBallsCost = sim.ballsCost || 5;
        const simHelpersCost = (sim.helpersCount || 0) * (sim.helperFee || 30);

        const simIncome = simPlayers * simPlayerPrice;
        const simTotalCourtCost = simCourts * simCourtCost;
        const simTotalCost = simTotalCourtCost + simBallsCost + simHelpersCost;
        const simNetProfit = simIncome - simTotalCost;
        const simMargin = simIncome > 0 ? (simNetProfit / simIncome) * 100 : 0;

        // Reparto de dinero limpio para este club
        let alexClean = 0;
        let socioClean = 0;

        if (sim.sharingMode === '100_alex') {
            alexClean = simNetProfit;
            socioClean = 0;
        } else if (sim.sharingMode === '100_socio') {
            alexClean = 0;
            socioClean = simNetProfit;
        } else if (sim.sharingMode === '60_alex_40_socio') {
            alexClean = simNetProfit * 0.6;
            socioClean = simNetProfit * 0.4;
        } else if (sim.sharingMode === '60_socio_40_alex') {
            alexClean = simNetProfit * 0.4;
            socioClean = simNetProfit * 0.6;
        } else {
            // 50_50
            alexClean = simNetProfit * 0.5;
            socioClean = simNetProfit * 0.5;
        }

        const clubEvents = state.events.filter(e => (e.club || e.location) === club.name);

        return `
            <!-- HEADER DE LA PESTAÑA DEL CLUB -->
            <div class="club-header-banner">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="font-size:0.75rem; font-weight:800; color:var(--erp-text-dim); text-transform:uppercase;">SEDE COLABORADORA</span>
                        <span class="traffic-badge ${club.trafficStatus}">${club.trafficLabel} (${club.marginPct.toFixed(1)}% margen)</span>
                    </div>
                    <h3 style="font-family:var(--erp-font-title); font-size:1.6rem; font-weight:900; color:var(--erp-text-main); margin:2px 0;">
                        ${escapeHtml(club.name)}
                    </h3>
                    <div style="font-size:0.8rem; color:var(--erp-text-muted); display:flex; gap:14px; flex-wrap:wrap; margin-top:4px;">
                        <span><i class="fas fa-location-dot" style="color:#0284c7;"></i> ${escapeHtml(club.location || 'Barcelona')}</span>
                        <span><i class="fas fa-user-tie" style="color:#16a34a;"></i> Contacto: ${escapeHtml(club.contact || 'Dirección de Pistas')}</span>
                        <span><i class="fas fa-table-tennis-paddle-ball" style="color:#9333ea;"></i> ${maxClubCourts} pistas de pádel</span>
                    </div>
                </div>

                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.openEditClubModal('${escapeHtml(club.name)}')">
                        <i class="fas fa-pen-to-square"></i> Modificar Datos & Tarifas
                    </button>
                    <button class="btn-erp btn-erp-primary" onclick="window.OrganizacionERP.openNewEventModal('${escapeHtml(club.name)}')">
                        <i class="fas fa-plus-circle"></i> Planificar Americana Aquí
                    </button>
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.selectClubTab('all')">
                        <i class="fas fa-arrow-left"></i> Volver a Vista Global
                    </button>
                </div>
            </div>

            <!-- CUADRO EJECUTIVO DEL CLUB: 4 KPIS FINANCIEROS ACUMULADOS -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
                <div class="erp-card" style="border-top:4px solid #0f172a;">
                    <div style="font-size:0.7rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Facturación Acumulada</div>
                    <div class="erp-money" style="font-size:1.8rem; color:var(--erp-text-main); margin:4px 0;">${club.totalIncome.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">${club.playersCount} inscripciones totales en esta sede</div>
                </div>

                <div class="erp-card" style="border-top:4px solid #e11d48;">
                    <div style="font-size:0.7rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Costes de Pistas Acumulados</div>
                    <div class="erp-money negative" style="font-size:1.8rem; margin:4px 0;">-${club.totalExpense.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">Pagado al club por alquiler y material</div>
                </div>

                <div class="erp-card" style="border-top:4px solid #16a34a; background:linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
                    <div style="font-size:0.7rem; color:#166534; text-transform:uppercase; font-weight:800;">Dinero Limpio Total Acumulado</div>
                    <div class="erp-money positive" style="font-size:1.9rem; margin:4px 0;">+${club.netProfit.toLocaleString('es-ES')} €</div>
                    <div style="font-size:0.75rem; color:#15803d; font-weight:700;">${club.marginPct.toFixed(1)}% Margen Limpio</div>
                </div>

                <div class="erp-card" style="border-top:4px solid #0284c7;">
                    <div style="font-size:0.7rem; color:var(--erp-text-dim); text-transform:uppercase; font-weight:800;">Rendimiento Unitario</div>
                    <div class="erp-money" style="font-size:1.8rem; color:#0284c7; margin:4px 0;">+${club.avgProfitPerEvent.toFixed(2)} €</div>
                    <div style="font-size:0.72rem; color:var(--erp-text-muted);">Beneficio limpio medio por evento disputado</div>
                </div>
            </div>

            <!-- ACUERDOS VIGENTES Y CONDICIONES PACTADAS -->
            <div style="display:grid; grid-template-columns:1fr 1.3fr; gap:1.25rem; margin-bottom:1.5rem;">
                <div class="erp-card">
                    <div class="erp-card-header">
                        <div>
                            <h4 class="erp-card-title"><i class="fas fa-handshake"></i> Tarifas y Acuerdos de Negociación</h4>
                            <p class="erp-card-subtitle">Condiciones de alquiler pactadas con la dirección del club</p>
                        </div>
                        <button class="erp-btn-micro" onclick="window.OrganizacionERP.openEditClubModal('${escapeHtml(club.name)}')">
                            <i class="fas fa-pen"></i> Editar Tarifas
                        </button>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:10px; font-size:0.8rem;">
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                            <span style="color:var(--erp-text-muted);">Tarifa Mañanas:</span>
                            <strong style="color:#0284c7;">${tariffs.morning || 12} € / pista hora</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                            <span style="color:var(--erp-text-muted);">Tarifa Tardes:</span>
                            <strong style="color:#ea580c;">${tariffs.evening || tariffs.afternoon || 32} € / pista hora</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                            <span style="color:var(--erp-text-muted);">Tarifa Noches:</span>
                            <strong style="color:#16a34a;">${tariffs.night !== undefined ? tariffs.night : 12} € / pista hora</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                            <span style="color:var(--erp-text-muted);">Tarifa Fin de Semana:</span>
                            <strong style="color:#9333ea;">${tariffs.weekend || 20} € / pista hora</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                            <span style="color:var(--erp-text-muted);">Duración Estándar de Torneo:</span>
                            <strong>${tariffs.durationMin || 90} minutos</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0;">
                            <span style="color:var(--erp-text-muted);">Precio Inscripción Recomendado:</span>
                            <strong>${tariffs.defaultPrice || 12} € / jugador</strong>
                        </div>
                    </div>

                    <div style="margin-top:12px; padding:10px; background:#f8fafc; border-radius:8px; border:1px solid var(--erp-border); font-size:0.75rem; color:var(--erp-text-muted); line-height:1.4;">
                        📝 <strong>Notas:</strong> ${escapeHtml(club.notes || 'Sin observaciones registradas.')}
                    </div>
                </div>

                <!-- DIAGNÓSTICO Y RECOMENDACIÓN ESTRATÉGICA -->
                <div class="erp-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div class="erp-card-header">
                            <div>
                                <h4 class="erp-card-title"><i class="fas fa-chart-line"></i> Diagnóstico de Rentabilidad del Club</h4>
                                <p class="erp-card-subtitle">Auditoría automática de rendimiento y viabilidad económica</p>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                            <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid var(--erp-border);">
                                <div style="font-size:0.68rem; color:var(--erp-text-dim);">BENEFICIO / JUGADOR</div>
                                <strong style="font-size:1.15rem; color:#15803d;">+${club.avgProfitPerPlayer.toFixed(2)} €</strong>
                            </div>
                            <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid var(--erp-border);">
                                <div style="font-size:0.68rem; color:var(--erp-text-dim);">BENEFICIO / PISTA</div>
                                <strong style="font-size:1.15rem; color:#0284c7;">+${club.avgProfitPerCourt.toFixed(2)} €</strong>
                            </div>
                        </div>

                        <div style="padding:14px; background:${club.trafficStatus === 'green' ? '#f0fdf4' : (club.trafficStatus === 'yellow' ? '#fefce8' : '#fef2f2')}; border:1px solid ${club.trafficStatus === 'green' ? '#86efac' : (club.trafficStatus === 'yellow' ? '#fde047' : '#fca5a5')}; border-radius:10px; font-size:0.8rem; color:#0f172a; line-height:1.5;">
                            <strong>Dictamen Estratégico:</strong><br>
                            ${club.strategicTip}
                        </div>
                    </div>

                    <div style="margin-top:14px; font-size:0.72rem; color:var(--erp-text-muted); text-align:right;">
                        Datos calculados sobre ${club.eventsCount} eventos disputados en ${escapeHtml(club.name)}.
                    </div>
                </div>
            </div>

            <!-- SIMULADOR INTERACTIVO ESPECÍFICO DE ESTE CLUB -->
            <div class="club-sim-card">
                <div class="erp-card-header" style="margin-bottom:1rem;">
                    <div>
                        <h4 class="erp-card-title"><i class="fas fa-sliders"></i> Simulador Financiero en ${escapeHtml(club.name)}</h4>
                        <p class="erp-card-subtitle">Calcula cuánto ganaréis limpios Alex y su socio según pistas, inscripciones y ayudantes en esta sede</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:14px; margin-bottom:1.25rem;">
                    <!-- REPARTO -->
                    <div style="background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px; padding:10px;">
                        <label style="font-size:0.72rem; font-weight:800; color:var(--erp-text-main); display:block; margin-bottom:4px;">
                            🤝 Quién la hace / Reparto
                        </label>
                        <select class="financial-input" style="width:100%; text-align:left; font-size:0.75rem;" onchange="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'sharingMode', this.value)">
                            <option value="50_50" ${sim.sharingMode === '50_50' ? 'selected' : ''}>50% Alex / 50% Socio</option>
                            <option value="100_alex" ${sim.sharingMode === '100_alex' ? 'selected' : ''}>100% Alex (La hace él)</option>
                            <option value="100_socio" ${sim.sharingMode === '100_socio' ? 'selected' : ''}>100% Socio (La hace él)</option>
                            <option value="60_alex_40_socio" ${sim.sharingMode === '60_alex_40_socio' ? 'selected' : ''}>60% Alex (Presencial) / 40% Socio</option>
                            <option value="60_socio_40_alex" ${sim.sharingMode === '60_socio_40_alex' ? 'selected' : ''}>60% Socio (Presencial) / 40% Alex</option>
                        </select>
                    </div>

                    <!-- PISTAS -->
                    <div style="background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px; padding:10px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <label style="font-size:0.72rem; font-weight:800; color:#0284c7;">Pistas Reservadas (Máx. ${maxClubCourts} en este club)</label>
                            <strong style="font-size:0.85rem; color:#0284c7;">${simCourts} pistas (${simPlayers} jug.)</strong>
                        </div>
                        <input type="range" min="1" max="${maxClubCourts}" value="${simCourts}" class="sim-slider" oninput="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courts', this.value)">
                        <div class="chip-selector" style="margin-top:6px;">
                            ${[2, 3, 4, 5].filter(c => c <= maxClubCourts).map(c => `
                                <button class="chip-btn ${simCourts === c ? 'active' : ''}" onclick="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courts', ${c})">
                                    ${c} pist. ${c === maxClubCourts ? '(Todas) ★' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- PRECIO JUGADOR -->
                    <div style="background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px; padding:10px;">
                        <label style="font-size:0.72rem; font-weight:800; color:var(--erp-text-main); display:block; margin-bottom:4px;">Precio Inscripción (€)</label>
                        <input type="number" value="${simPlayerPrice}" class="financial-input" style="width:100%; text-align:left;" onchange="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'playerPrice', this.value)">
                    </div>

                    <!-- COSTE PISTA CON SELECTOR RÁPIDO DE FRANJA -->
                    <div style="background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px; padding:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <label style="font-size:0.72rem; font-weight:800; color:var(--erp-text-main); margin-bottom:0;">Coste Pista (€ / h)</label>
                            <span style="font-size:0.65rem; color:var(--erp-text-muted); font-weight:600;">Tarifas del club:</span>
                        </div>
                        <input type="number" value="${simCourtCost}" class="financial-input" style="width:100%; text-align:left;" onchange="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courtCost', this.value)">
                        <div class="chip-selector" style="margin-top:6px; flex-wrap:wrap; gap:4px;">
                            <button class="chip-btn ${simCourtCost === (tariffs.morning || 12) ? 'active' : ''}" style="font-size:0.65rem; padding:3px 7px;" title="Tarifa Mañana" onclick="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courtCost', ${tariffs.morning || 12})">Mañana (${tariffs.morning || 12}€)</button>
                            <button class="chip-btn ${simCourtCost === (tariffs.evening || tariffs.afternoon || 32) ? 'active' : ''}" style="font-size:0.65rem; padding:3px 7px;" title="Tarifa Tarde" onclick="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courtCost', ${tariffs.evening || tariffs.afternoon || 32})">Tarde (${tariffs.evening || tariffs.afternoon || 32}€)</button>
                            <button class="chip-btn ${simCourtCost === (tariffs.night !== undefined ? tariffs.night : 12) ? 'active' : ''}" style="font-size:0.65rem; padding:3px 7px;" title="Tarifa Noche" onclick="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courtCost', ${tariffs.night !== undefined ? tariffs.night : 12})">Noche (${tariffs.night !== undefined ? tariffs.night : 12}€)</button>
                            <button class="chip-btn ${simCourtCost === (tariffs.weekend || 20) ? 'active' : ''}" style="font-size:0.65rem; padding:3px 7px;" title="Tarifa Fin de Semana" onclick="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'courtCost', ${tariffs.weekend || 20})">Finde (${tariffs.weekend || 20}€)</button>
                        </div>
                    </div>

                    <!-- AYUDANTES -->
                    <div style="background:#f8fafc; border:1px solid var(--erp-border); border-radius:10px; padding:10px;">
                        <label style="font-size:0.72rem; font-weight:800; color:var(--erp-text-main); display:block; margin-bottom:4px;">Ayudantes en Pista</label>
                        <select class="financial-input" style="width:100%; text-align:left; font-size:0.75rem;" onchange="window.OrganizacionERP.updateClubSim('${escapeHtml(club.name)}', 'helpersCount', this.value)">
                            <option value="0" ${sim.helpersCount === 0 ? 'selected' : ''}>0 ayudantes (0€)</option>
                            <option value="1" ${sim.helpersCount === 1 ? 'selected' : ''}>1 ayudante (30€)</option>
                            <option value="2" ${sim.helpersCount === 2 ? 'selected' : ''}>2 ayudantes (60€)</option>
                        </select>
                    </div>
                </div>

                <!-- RESULTADOS LIMPIOS DEL SIMULADOR -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; padding:14px; background:#f8fafc; border-radius:12px; border:1.5px solid var(--erp-border);">
                    <div>
                        <div style="font-size:0.68rem; color:var(--erp-text-dim); text-transform:uppercase;">Facturación Bruta</div>
                        <div class="erp-money" style="font-size:1.3rem;">${simIncome.toFixed(2)} €</div>
                    </div>
                    <div>
                        <div style="font-size:0.68rem; color:var(--erp-text-dim); text-transform:uppercase;">Costes Pistas + Bolas</div>
                        <div class="erp-money negative" style="font-size:1.3rem;">-${simTotalCost.toFixed(2)} €</div>
                    </div>
                    <div>
                        <div style="font-size:0.68rem; color:#166534; text-transform:uppercase; font-weight:800;">Dinero Limpio Total</div>
                        <div class="erp-money positive" style="font-size:1.4rem;">+${simNetProfit.toFixed(2)} €</div>
                        <span class="traffic-badge ${simMargin >= 30 ? 'green' : (simMargin >= 15 ? 'yellow' : 'red')}" style="font-size:0.65rem;">${simMargin.toFixed(1)}% margen</span>
                    </div>
                    <div style="background:#f0f9ff; padding:8px 12px; border-radius:8px; border:1px solid #bae6fd;">
                        <div style="font-size:0.68rem; color:#0369a1; font-weight:800; text-transform:uppercase;">Limpio Para Alex</div>
                        <div class="erp-money" style="font-size:1.35rem; color:#0284c7;">+${alexClean.toFixed(2)} €</div>
                    </div>
                    <div style="background:#faf5ff; padding:8px 12px; border-radius:8px; border:1px solid #e9d5ff;">
                        <div style="font-size:0.68rem; color:#7e22ce; font-weight:800; text-transform:uppercase;">Limpio Para el Socio</div>
                        <div class="erp-money" style="font-size:1.35rem; color:#9333ea;">+${socioClean.toFixed(2)} €</div>
                    </div>
                </div>
            </div>

            <!-- HISTORIAL DE EVENTOS EN ESTE CLUB -->
            <div class="erp-card">
                <div class="erp-card-header">
                    <div>
                        <h4 class="erp-card-title"><i class="fas fa-clock-rotate-left"></i> Historial de Americanas en ${escapeHtml(club.name)}</h4>
                        <p class="erp-card-subtitle">${clubEvents.length} eventos disputados en esta sede deportiva</p>
                    </div>
                </div>

                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Americana</th>
                                <th>Fecha</th>
                                <th>Organizador</th>
                                <th style="text-align:center;">Pistas</th>
                                <th style="text-align:center;">Jugadores</th>
                                <th>Facturación</th>
                                <th>Costes</th>
                                <th>Beneficio Limpio</th>
                                <th>Margen</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clubEvents.length > 0 ? clubEvents.map(evt => {
                                const f = evt.calculatedFin;
                                return `
                                    <tr>
                                        <td>
                                            <strong style="color:var(--erp-text-main); font-size:0.85rem;">${escapeHtml(evt.title || evt.name || 'Americana')}</strong>
                                            <div style="font-size:0.68rem; color:var(--erp-text-dim);">${escapeHtml(evt.category || '')} • ${escapeHtml(evt.level || '')}</div>
                                        </td>
                                        <td>${evt.date || ''}</td>
                                        <td><strong>${escapeHtml(evt.organizer || 'Alex Coscolín')}</strong></td>
                                        <td style="text-align:center;">${f.courtsCount}</td>
                                        <td style="text-align:center;">${f.registeredCount}</td>
                                        <td class="erp-money">${f.results.totalIncome.toFixed(2)} €</td>
                                        <td class="erp-money negative">-${f.results.totalExpense.toFixed(2)} €</td>
                                        <td class="erp-money positive"><strong>+${f.results.netProfit.toFixed(2)} €</strong></td>
                                        <td>
                                            <span class="traffic-badge ${f.results.marginPct >= 30 ? 'green' : (f.results.marginPct >= 15 ? 'yellow' : 'red')}" style="font-size:0.65rem; padding:2px 6px;">
                                                ${f.results.marginPct.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td>
                                            <button class="erp-btn-micro" onclick="window.OrganizacionERP.openFinancialModal('${evt.id}')">
                                                <i class="fas fa-coins"></i> Finanzas
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="10" style="text-align:center; padding:2rem; color:var(--erp-text-muted);">
                                        No hay americanas registradas aún en este club. Pulsa "Planificar Americana Aquí" para crear la primera.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderHiringSimulatorView() {
        const kpis = computeExecutiveKPIs();
        const avgProfitPerEvent = kpis.finishedEvents > 0 ? (kpis.totalNetProfit / kpis.finishedEvents) : 80;

        return `
            <div class="simulator-container">
                <div class="simulator-controls">
                    <h3 class="erp-card-title" style="margin-bottom:1rem;">
                        <i class="fas fa-user-plus"></i> Simulador de Incorporación de Personal
                    </h3>
                    <p style="font-size:0.78rem; color:var(--erp-text-muted); margin-bottom:1.5rem;">
                        ¿Qué sucede si contratas a un coordinador o ayudante? Modifica los parámetros para proyectar el punto de equilibrio exacto.
                    </p>

                    <div class="sim-slider-group">
                        <div class="sim-slider-header">
                            <span class="sim-slider-label">Coste por Evento del Coordinador / Ayudante</span>
                            <span class="sim-slider-val" id="sim-cost-val">35 € / evento</span>
                        </div>
                        <input type="range" min="15" max="120" step="5" value="35" class="sim-slider" id="sim-cost-slider" oninput="window.OrganizacionERP.updateSimulator()">
                    </div>

                    <div class="sim-slider-group">
                        <div class="sim-slider-header">
                            <span class="sim-slider-label">Número de Americanas al Mes</span>
                            <span class="sim-slider-val" id="sim-events-val">8 americanas</span>
                        </div>
                        <input type="range" min="1" max="30" step="1" value="8" class="sim-slider" id="sim-events-slider" oninput="window.OrganizacionERP.updateSimulator()">
                    </div>

                    <div class="sim-slider-group">
                        <div class="sim-slider-header">
                            <span class="sim-slider-label">Beneficio Limpio Medio por Americana</span>
                            <span class="sim-slider-val" id="sim-profit-val">${Math.round(avgProfitPerEvent)} € / americana</span>
                        </div>
                        <input type="range" min="30" max="250" step="5" value="${Math.round(avgProfitPerEvent)}" class="sim-slider" id="sim-profit-slider" oninput="window.OrganizacionERP.updateSimulator()">
                    </div>
                </div>

                <div class="simulator-result-card">
                    <h3 class="erp-card-title"><i class="fas fa-scale-balanced"></i> Punto de Equilibrio & Impacto</h3>
                    
                    <div class="break-even-pill">
                        <div class="break-even-number" id="sim-breakeven-num">2.4</div>
                        <div class="break-even-text" id="sim-breakeven-text">Americanas al mes para cubrir su coste</div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:12px; margin-top:1.5rem;">
                        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--erp-border);">
                            <span style="color:var(--erp-text-muted);">Coste Mensual del Personal:</span>
                            <strong class="erp-money negative" id="sim-monthly-cost">280.00 €</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--erp-border);">
                            <span style="color:var(--erp-text-muted);">Coste Anual del Personal:</span>
                            <strong class="erp-money negative" id="sim-annual-cost">3,360.00 €</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--erp-border);">
                            <span style="color:var(--erp-text-muted);">Beneficio Mensual Proyectado (Neto):</span>
                            <strong class="erp-money positive" id="sim-projected-profit">360.00 €</strong>
                        </div>
                    </div>

                    <div id="sim-recommendation-box" style="margin-top:1.5rem; padding:12px; background:#f0fdf4; border:1px solid #86efac; border-radius:12px; font-size:0.75rem; color:#166534; line-height:1.4;">
                        💡 <strong>Dictamen:</strong> Viable. Al realizar 8 americanas al mes, el coste queda completamente cubierto y permite generar ingresos pasivos.
                    </div>
                </div>
            </div>
        `;
    }

    function initSimulatorSliders() {
        updateSimulator();
    }

    function updateSimulator() {
        const costSlider = document.getElementById('sim-cost-slider');
        const eventsSlider = document.getElementById('sim-events-slider');
        const profitSlider = document.getElementById('sim-profit-slider');

        if (!costSlider || !eventsSlider || !profitSlider) return;

        const costPerEvent = parseFloat(costSlider.value);
        const eventsPerMonth = parseInt(eventsSlider.value);
        const profitPerEvent = parseFloat(profitSlider.value);

        const costValEl = document.getElementById('sim-cost-val');
        const eventsValEl = document.getElementById('sim-events-val');
        const profitValEl = document.getElementById('sim-profit-val');

        if (costValEl) costValEl.textContent = `${costPerEvent} € / evento`;
        if (eventsValEl) eventsValEl.textContent = `${eventsPerMonth} americanas`;
        if (profitValEl) profitValEl.textContent = `${profitPerEvent} € / americana`;

        const monthlyCost = costPerEvent * eventsPerMonth;
        const annualCost = monthlyCost * 12;
        const rawMonthlyProfit = profitPerEvent * eventsPerMonth;
        const netProjectedProfit = rawMonthlyProfit - monthlyCost;
        const breakEven = profitPerEvent > 0 ? (monthlyCost / profitPerEvent) : 0;

        const monthlyCostEl = document.getElementById('sim-monthly-cost');
        const annualCostEl = document.getElementById('sim-annual-cost');
        const projectedProfitEl = document.getElementById('sim-projected-profit');
        const breakEvenNumEl = document.getElementById('sim-breakeven-num');

        if (monthlyCostEl) monthlyCostEl.textContent = `${monthlyCost.toFixed(2)} €`;
        if (annualCostEl) annualCostEl.textContent = `${annualCost.toFixed(2)} €`;
        if (projectedProfitEl) projectedProfitEl.textContent = `${netProjectedProfit.toFixed(2)} €`;
        if (breakEvenNumEl) breakEvenNumEl.textContent = breakEven.toFixed(1);
    }

    function renderCalendarView() {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const curM = state.calendarMonth;
        const curY = state.calendarYear;

        const monthEvents = state.events.filter(e => {
            const d = new Date(e.date);
            return !isNaN(d.getTime()) && d.getMonth() === curM && d.getFullYear() === curY;
        });

        return `
            <div class="calendar-view-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                    <h3 style="font-family:var(--erp-font-title); font-size:1.25rem; font-weight:900; color:var(--erp-text-main);">
                        ${months[curM].toUpperCase()} ${curY}
                    </h3>
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                    <span style="font-size:0.75rem; color:var(--erp-text-muted); margin-left:8px;">${monthEvents.length} eventos programados</span>
                </div>
            </div>

            ${renderMonthGrid(curY, curM, monthEvents)}
        `;
    }

    function renderMonthGrid(year, month, events) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        let cellsHtml = '';

        for (let i = 0; i < adjustedFirstDay; i++) {
            cellsHtml += `<div class="calendar-day-cell" style="background:#f8fafc; opacity:0.4;"></div>`;
        }

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = isCurrentMonth && today.getDate() === d;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvts = events.filter(e => e.date === dateStr);

            cellsHtml += `
                <div class="calendar-day-cell ${isToday ? 'today' : ''}">
                    <div class="calendar-day-num">${d}</div>
                    ${dayEvts.map(evt => {
                        const net = evt.calculatedFin.results.netProfit;
                        return `
                            <div class="calendar-event-tag profitable" onclick="window.OrganizacionERP.openFinancialModal('${evt.id}')">
                                🎾 ${evt.title || 'Americana'} (+${net.toFixed(0)}€)
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div class="calendar-day-header" style="display:grid; grid-template-columns:repeat(7, 1fr); margin-bottom:4px;">
                ${dayHeaders.map(h => `<div>${h}</div>`).join('')}
            </div>
            <div class="calendar-grid-month">
                ${cellsHtml}
            </div>
        `;
    }

    function renderReportsView() {
        const kpis = computeExecutiveKPIs();

        return `
            <div class="erp-card" style="margin-bottom:2rem;">
                <div class="erp-card-header">
                    <div>
                        <h3 class="erp-card-title"><i class="fas fa-file-invoice-dollar"></i> Generador de Informes de Negocio</h3>
                        <p class="erp-card-subtitle">Balances contables, facturación y márgenes para reuniones de directiva y socios</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-erp btn-erp-primary" onclick="window.OrganizacionERP.exportToExcel()">
                            <i class="fas fa-file-excel"></i> Descargar Excel (.CSV)
                        </button>
                        <button class="btn-erp btn-erp-secondary" onclick="window.print()">
                            <i class="fas fa-print"></i> Imprimir Informe PDF
                        </button>
                    </div>
                </div>

                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Evento</th>
                                <th>Club</th>
                                <th>Inscripciones</th>
                                <th>Extras/Sponsors</th>
                                <th>Coste Pistas</th>
                                <th>Pelotas/Premios</th>
                                <th>B. Neto</th>
                                <th>Margen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.events.map(evt => {
                                const f = evt.calculatedFin;
                                return `
                                    <tr>
                                        <td>${evt.date}</td>
                                        <td><strong>${evt.title || 'Americana'}</strong></td>
                                        <td>${evt.club || evt.location}</td>
                                        <td class="erp-money">${f.incomes.registrations.toFixed(2)} €</td>
                                        <td class="erp-money">${(f.incomes.extras + f.incomes.sponsorship).toFixed(2)} €</td>
                                        <td class="erp-money negative">${f.expenses.courts.toFixed(2)} €</td>
                                        <td class="erp-money negative">${(f.expenses.balls + f.expenses.prizes).toFixed(2)} €</td>
                                        <td class="erp-money positive"><strong>+${f.results.netProfit.toFixed(2)} €</strong></td>
                                        <td><strong>${f.results.marginPct.toFixed(1)}%</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderFutureFormatsView() {
        return `
            <div class="erp-card" style="margin-bottom:2rem;">
                <h3 class="erp-card-title"><i class="fas fa-rocket"></i> Escalabilidad Futura de SomosPadel Barcelona</h3>
                <p style="font-size:0.82rem; color:var(--erp-text-muted); margin-top:6px;">
                    Arquitectura preparada para gestionar torneos, ligas y clínicas deportivas bajo el mismo motor contable:
                </p>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;">
                <div class="erp-card" style="border-top:4px solid #16a34a;">
                    <div style="font-size:2rem; margin-bottom:10px;">🏆</div>
                    <h4 style="font-family:var(--erp-font-title); font-size:1.1rem; margin-bottom:6px;">Torneos Oficiales</h4>
                    <p style="font-size:0.78rem; color:var(--erp-text-muted); margin-bottom:12px;">Cuadros eliminatorios, consolación y patrocinio de marcas.</p>
                    <span class="traffic-badge green">Preparado</span>
                </div>

                <div class="erp-card" style="border-top:4px solid #0284c7;">
                    <div style="font-size:2rem; margin-bottom:10px;">📅</div>
                    <h4 style="font-family:var(--erp-font-title); font-size:1.1rem; margin-bottom:6px;">Ligas Regulares</h4>
                    <p style="font-size:0.78rem; color:var(--erp-text-muted); margin-bottom:12px;">Competición por jornadas con cuotas mensuales recurrentes.</p>
                    <span class="traffic-badge yellow">Fase 2</span>
                </div>

                <div class="erp-card" style="border-top:4px solid #f59e0b;">
                    <div style="font-size:2rem; margin-bottom:10px;">🎓</div>
                    <h4 style="font-family:var(--erp-font-title); font-size:1.1rem; margin-bottom:6px;">Clínics & Masterclasses</h4>
                    <p style="font-size:0.78rem; color:var(--erp-text-muted); margin-bottom:12px;">Entrenamientos intensivos con monitores certificados y márgenes elevados (>45%).</p>
                    <span class="traffic-badge yellow">Fase 2</span>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // 7. MODALES Y EVENT HANDLERS
    // ==========================================================================
    function openFinancialModal(eventId) {
        const evt = state.events.find(e => e.id === eventId);
        if (!evt) return;

        state.selectedEvent = evt;
        const f = evt.calculatedFin;

        const modal = document.getElementById('erp-financial-modal');
        if (!modal) return;

        const titleEl = document.getElementById('erp-fin-modal-title');
        const contentEl = document.getElementById('erp-fin-modal-body');

        if (titleEl) titleEl.textContent = `Ficha Económica: ${evt.title || 'Americana'}`;

        if (contentEl) {
            contentEl.innerHTML = `
                <div style="margin-bottom:1rem; padding:10px 14px; background:#f8fafc; border-radius:10px; font-size:0.8rem; display:flex; justify-content:space-between; border:1px solid var(--erp-border);">
                    <span><strong>Fecha:</strong> ${evt.date}</span>
                    <span><strong>Club:</strong> ${evt.club || evt.location}</span>
                    <span><strong>Pistas:</strong> ${f.courtsCount}</span>
                    <span><strong>Jugadores:</strong> ${f.registeredCount}</span>
                </div>

                <div class="financial-split-grid">
                    <div class="financial-box income">
                        <div class="financial-box-title">
                            <span><i class="fas fa-arrow-down"></i> Ingresos de la Americana</span>
                            <span id="fin-live-income-total">${f.incomes.total.toFixed(2)} €</span>
                        </div>
                        <div class="financial-row">
                            <span class="label">Inscripciones Jugadores</span>
                            <div class="input-wrapper">
                                <input type="number" class="financial-input" id="fin-input-registrations" value="${f.incomes.registrations}" oninput="window.OrganizacionERP.recalcModalFinancials()">
                            </div>
                        </div>
                        <div class="financial-row">
                            <span class="label">Consumos Extras (Bebidas, bar)</span>
                            <div class="input-wrapper">
                                <input type="number" class="financial-input" id="fin-input-extras" value="${f.incomes.extras}" oninput="window.OrganizacionERP.recalcModalFinancials()">
                            </div>
                        </div>
                    </div>

                    <div class="financial-box expense">
                        <div class="financial-box-title">
                            <span><i class="fas fa-arrow-up"></i> Costes & Gastos</span>
                            <span id="fin-live-expense-total">${f.expenses.total.toFixed(2)} €</span>
                        </div>
                        <div class="financial-row">
                            <span class="label">Alquiler de Pistas (Club)</span>
                            <div class="input-wrapper">
                                <input type="number" class="financial-input" id="fin-input-courts" value="${f.expenses.courts}" oninput="window.OrganizacionERP.recalcModalFinancials()">
                            </div>
                        </div>
                        <div class="financial-row">
                            <span class="label">Coste Pelotas</span>
                            <div class="input-wrapper">
                                <input type="number" class="financial-input" id="fin-input-balls" value="${f.expenses.balls}" oninput="window.OrganizacionERP.recalcModalFinancials()">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="financial-summary-banner">
                    <div class="summary-metric">
                        <div class="label">Facturación</div>
                        <div class="value" id="modal-metric-income">${f.results.totalIncome.toFixed(2)} €</div>
                    </div>
                    <div class="summary-metric">
                        <div class="label">Coste Total</div>
                        <div class="value negative" id="modal-metric-expense">${f.results.totalExpense.toFixed(2)} €</div>
                    </div>
                    <div class="summary-metric">
                        <div class="label">Beneficio Neto</div>
                        <div class="value positive" id="modal-metric-profit">${f.results.netProfit.toFixed(2)} €</div>
                    </div>
                    <div class="summary-metric">
                        <div class="label">Margen (%)</div>
                        <div class="value accent" id="modal-metric-margin">${f.results.marginPct.toFixed(1)}%</div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem;">
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.closeModal('erp-financial-modal')">Cancelar</button>
                    <button class="btn-erp btn-erp-primary" onclick="window.OrganizacionERP.saveEventFinancials('${evt.id}')">
                        <i class="fas fa-save"></i> Guardar Balance
                    </button>
                </div>
            `;
        }

        modal.classList.add('open');
    }

    function recalcModalFinancials() {
        const getVal = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
        const totalIncome = getVal('fin-input-registrations') + getVal('fin-input-extras');
        const totalExpense = getVal('fin-input-courts') + getVal('fin-input-balls');
        const netProfit = totalIncome - totalExpense;
        const marginPct = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setTxt('fin-live-income-total', `${totalIncome.toFixed(2)} €`);
        setTxt('fin-live-expense-total', `${totalExpense.toFixed(2)} €`);
        setTxt('modal-metric-income', `${totalIncome.toFixed(2)} €`);
        setTxt('modal-metric-expense', `${totalExpense.toFixed(2)} €`);
        setTxt('modal-metric-profit', `${netProfit.toFixed(2)} €`);
        setTxt('modal-metric-margin', `${marginPct.toFixed(1)}%`);
    }

    async function saveEventFinancials(eventId) {
        const getVal = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
        const financials = {
            income_registrations: getVal('fin-input-registrations'),
            income_extras: getVal('fin-input-extras'),
            expense_courts: getVal('fin-input-courts'),
            expense_balls: getVal('fin-input-balls'),
            updatedAt: new Date().toISOString()
        };

        try {
            if (window.db) {
                await window.db.collection('americanas').doc(eventId).update({ financials });
            }
        } catch (e) {
            console.warn("Aviso Firestore:", e.message);
        }

        const evt = state.events.find(e => e.id === eventId);
        if (evt) {
            evt.financials = financials;
            evt.calculatedFin = calculateEventFinancials(evt);
        }

        computeClubsAnalytics();
        closeModal('erp-financial-modal');
        renderActiveTab();
        alert("✅ Balance económico recalculado con éxito.");
    }

    function openNewEventModal() {
        const modal = document.getElementById('erp-new-event-modal');
        if (modal) modal.classList.add('open');
    }

    function applyAmericanaPreset(type) {
        const form = document.getElementById('create-americana-form') || document.querySelector('#erp-new-event-modal form');
        if (!form) return;

        const setVal = (name, val) => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) el.value = val;
            const byId = document.getElementById(name);
            if (byId) byId.value = val;
        };

        if (type === 'masc4') {
            setVal('name', 'AMERICANA MASCULINA 4 PISTAS');
            setVal('new-evt-title', 'AMERICANA MASCULINA 4 PISTAS');
            setVal('category', 'male');
            setVal('new-evt-category', 'male');
            setVal('pair_mode', 'fixed');
            setVal('max_courts', '4');
            setVal('new-evt-courts', '4');
            setVal('rounds_count', '6');
            setVal('price_members', '12');
            setVal('new-evt-price', '12');
            setVal('price_external', '14');
            selectCreateAmericanaImage('img/americana masculina.jpg');
        } else if (type === 'fem4') {
            setVal('name', 'AMERICANA FEMENINA 4 PISTAS');
            setVal('new-evt-title', 'AMERICANA FEMENINA 4 PISTAS');
            setVal('category', 'female');
            setVal('new-evt-category', 'female');
            setVal('pair_mode', 'fixed');
            setVal('max_courts', '4');
            setVal('new-evt-courts', '4');
            setVal('rounds_count', '6');
            setVal('price_members', '12');
            setVal('new-evt-price', '12');
            setVal('price_external', '14');
            selectCreateAmericanaImage('img/americana femeninas.jpg');
        } else if (type === 'mixta4') {
            setVal('name', 'AMERICANA MIXTA 4 PISTAS');
            setVal('new-evt-title', 'AMERICANA MIXTA 4 PISTAS');
            setVal('category', 'mixed');
            setVal('new-evt-category', 'mixed');
            setVal('pair_mode', 'fixed');
            setVal('max_courts', '4');
            setVal('new-evt-courts', '4');
            setVal('rounds_count', '6');
            setVal('price_members', '12');
            setVal('new-evt-price', '12');
            setVal('price_external', '14');
            selectCreateAmericanaImage('img/americana mixta.jpg');
        } else if (type === 'twister') {
            setVal('name', 'AMERICANA TWISTER INDIVIDUAL');
            setVal('new-evt-title', 'AMERICANA TWISTER INDIVIDUAL');
            setVal('category', 'open');
            setVal('new-evt-category', 'open');
            setVal('pair_mode', 'twister');
            setVal('max_courts', '4');
            setVal('new-evt-courts', '4');
            setVal('rounds_count', '6');
            setVal('price_members', '12');
            setVal('new-evt-price', '12');
            setVal('price_external', '14');
            selectCreateAmericanaImage('img/ball-mixta.png');
        } else if (type === 'suiza') {
            setVal('name', '🇨🇭 AMERICANA SUIZA');
            setVal('new-evt-title', '🇨🇭 AMERICANA SUIZA');
            setVal('category', 'open');
            setVal('new-evt-category', 'open');
            setVal('pair_mode', 'swiss');
            setVal('max_courts', '3');
            setVal('new-evt-courts', '3');
            setVal('rounds_count', '6');
            setVal('time', '18:00');
            setVal('time_end', '20:00');
            setVal('price_members', '14');
            setVal('new-evt-price', '14');
            setVal('price_external', '16');
            selectCreateAmericanaImage('img/padel-event.jpg');
        } else if (type === 'club') {
            setVal('name', 'AMERICANA NEW PADEL PRO (5 PISTAS)');
            setVal('new-evt-title', 'AMERICANA NEW PADEL PRO (5 PISTAS)');
            setVal('is_external', 'true');
            toggleCreateClubInput('true');
            setVal('club', 'New Padel Pro');
            setVal('location', 'New Padel Pro');
            setVal('new-evt-club', 'New Padel Pro');
            setVal('category', 'open');
            setVal('new-evt-category', 'open');
            setVal('pair_mode', 'fixed');
            setVal('max_courts', '5');
            setVal('new-evt-courts', '5');
            setVal('rounds_count', '6');
            setVal('price_members', '12');
            setVal('new-evt-price', '12');
            setVal('price_external', '14');
            selectCreateAmericanaImage('img/new_play_padel_pro.png');
        }

        const pairModeEl = form.querySelector('[name=pair_mode]');
        if (pairModeEl) {
            updatePairModeHelper(pairModeEl, 'create-americana-pair-mode-desc');
            updatePairModeHelper(pairModeEl, 'create-americana-pair-mode-desc-page');
        }
    }

    function updatePairModeHelper(selectEl, descContainerId) {
        const container = document.getElementById(descContainerId || 'create-americana-pair-mode-desc');
        if (!container) return;
        const raw = selectEl ? selectEl.value : 'twister';
        const mode = (raw === 'rotating') ? 'twister' : raw;

        if (mode === 'swiss') {
            container.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:8px;">
                    <span style="font-size: 1.15rem; line-height: 1;">🇨🇭</span>
                    <div>
                        <strong style="color: #dc2626; font-size: 0.76rem; text-transform: uppercase;">Modalidad Sistema Suizo (Puntos acumulados):</strong>
                        <div style="color: #475569; font-size: 0.72rem; margin-top: 2px;">
                            Cada jugador suma sus propios juegos conseguidos; la clasificación acumulada define en qué pista se juega cada ronda.
                        </div>
                    </div>
                </div>
            `;
            container.style.borderLeftColor = '#dc2626';
            container.style.background = 'rgba(239, 68, 68, 0.08)';
        } else if (mode === 'fixed') {
            container.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:8px;">
                    <span style="font-size: 1.15rem; line-height: 1;">🔒</span>
                    <div>
                        <strong style="color: #16a34a; font-size: 0.76rem; text-transform: uppercase;">Modalidad Pareja Fija (Dupla todo el torneo):</strong>
                        <div style="color: #475569; font-size: 0.72rem; margin-top: 2px;">
                            Las duplas compiten juntas todo el evento; suben o bajan juntas de pista según ganen o pierdan.
                        </div>
                    </div>
                </div>
            `;
            container.style.borderLeftColor = '#16a34a';
            container.style.background = 'rgba(34, 197, 94, 0.08)';
        } else {
            container.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:8px;">
                    <span style="font-size: 1.15rem; line-height: 1;">🌪️</span>
                    <div>
                        <strong style="color: #0284c7; font-size: 0.76rem; text-transform: uppercase;">Modalidad Twister Individual (Pozo rotativo):</strong>
                        <div style="color: #475569; font-size: 0.72rem; margin-top: 2px;">
                            Los jugadores juegan individualmente; ganadores suben de pista, perdedores bajan, y en cada pista rotan de pareja sin repetir compañero.
                        </div>
                    </div>
                </div>
            `;
            container.style.borderLeftColor = '#0284c7';
            container.style.background = 'rgba(2, 132, 199, 0.08)';
        }
    }

    function toggleCreateClubInput(val) {
        const groups = document.querySelectorAll('#create-club-group');
        groups.forEach(group => {
            if (group) group.style.display = (val === 'true') ? 'block' : 'none';
        });
    }

    function selectCreateAmericanaImage(url) {
        const inputs = [
            document.getElementById('erp-americana-img-input'),
            document.getElementById('create-americana-img-input')
        ];
        inputs.forEach(input => {
            if (input) input.value = url;
        });
        updateAmericanaImagePreview(url, 'erp-americana-img-preview');
        updateAmericanaImagePreview(url, 'page-americana-img-preview');
    }

    function updateAmericanaImagePreview(url, previewImgId) {
        const preview = document.getElementById(previewImgId || 'erp-americana-img-preview');
        if (!preview) return;
        if (url && url.trim()) {
            preview.src = url.trim();
            preview.style.display = 'block';
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    }

    function handleAmericanaImageUpload(input, targetInputId, previewImgId) {
        if (!input || !input.files || !input.files[0]) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

                const targetInput = document.getElementById(targetInputId);
                if (targetInput) targetInput.value = compressedDataUrl;

                updateAmericanaImagePreview(compressedDataUrl, previewImgId);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function saveNewEventFromForm() {
        const getV = (id, fallback = '') => {
            const el = document.getElementById(id);
            if (el && el.value !== undefined && el.value.trim() !== '') return el.value.trim();
            const formEl = document.querySelector(`[name="${id}"]`);
            if (formEl && formEl.value !== undefined && formEl.value.trim() !== '') return formEl.value.trim();
            return fallback;
        };

        const title = getV('new-evt-title') || getV('name') || 'Americana SomosPadel BCN';
        const date = getV('new-evt-date') || getV('date') || new Date().toISOString().split('T')[0];
        const time = getV('new-evt-time') || getV('time') || '18:00';
        const timeEnd = getV('new-evt-time-end') || getV('time_end') || '20:00';
        const isExternal = (getV('create-is-external') === 'true' || getV('is_external') === 'true');
        const clubName = isExternal 
            ? (getV('create-club-input') || getV('club') || 'New Padel Pro') 
            : (getV('new-evt-club') || getV('location') || 'New Padel Pro');
        const organizer = getV('new-evt-organizer') || getV('organizer') || 'Alex Coscolín';
        const isPrivate = (getV('create-americana-is-private') === 'true' || getV('is_private') === 'true');
        const accessPin = getV('create-americana-pin-input') || getV('access_pin');
        const category = getV('new-evt-category') || getV('category') || 'Masculino';
        const pairMode = getV('create-americana-pair-mode') || getV('pair_mode') || 'twister';
        const status = getV('new-evt-status') || getV('status') || 'open';
        const levelMin = getV('new-evt-level-min') || getV('level_min') || '3.5';
        const levelMax = getV('new-evt-level-max') || getV('level_max') || '4.5';
        let courts = parseInt(getV('new-evt-courts') || getV('max_courts') || 4);
        if (clubName.toLowerCase().includes('new padel pro') && courts > 5) courts = 5; // Regla 5 pistas New Padel Pro
        const rounds = parseInt(getV('new-evt-rounds') || getV('rounds_count') || 6);
        const priceMembers = parseFloat(getV('new-evt-price') || getV('price_members') || 12);
        const priceExternal = parseFloat(getV('new-evt-price-ext') || getV('price_external') || 14);
        const imageUrl = getV('erp-americana-img-input') || getV('image_url') || 'img/americana masculina.jpg';

        const maxPlayers = courts * 4;

        const newEvent = {
            id: 'evt_' + Date.now(),
            title,
            name: title,
            date,
            time: `${time} - ${timeEnd}`,
            time_start: time,
            time_end: timeEnd,
            club: clubName,
            location: clubName,
            courts,
            max_courts: courts,
            rounds_count: rounds,
            price: priceMembers,
            price_members: priceMembers,
            price_external: priceExternal,
            price_per_player: priceMembers,
            max_players: maxPlayers,
            organizer,
            category,
            pair_mode: pairMode,
            level: `${levelMin} - ${levelMax}`,
            level_min: levelMin,
            level_max: levelMax,
            status,
            is_external: isExternal,
            is_private: isPrivate,
            access_pin: accessPin,
            image_url: imageUrl,
            players: [],
            financials: {
                income_registrations: maxPlayers * priceMembers,
                expense_courts: courts * (priceMembers > 10 ? 24 : 12),
                expense_balls: 5
            }
        };

        try {
            if (window.EventService && typeof window.EventService.createEvent === 'function') {
                const created = await window.EventService.createEvent('americana', newEvent);
                if (created && created.id) newEvent.id = created.id;
            } else if (window.db) {
                await window.db.collection('americanas').doc(newEvent.id).set(newEvent);
                window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'americana', id: newEvent.id } }));
            }
        } catch (e) {
            console.warn("Aviso guardando en Firebase:", e.message);
        }

        newEvent.calculatedFin = calculateEventFinancials(newEvent);
        const existingIdx = state.events.findIndex(e => e.id === newEvent.id);
        if (existingIdx >= 0) {
            state.events[existingIdx] = newEvent;
        } else {
            state.events.unshift(newEvent);
        }

        computeClubsAnalytics();

        closeModal('erp-new-event-modal');
        state.eventsSubTab = 'mgmt';
        renderActiveTab();
        alert("🎉 ¡Americana creada y sincronizada con éxito en el ERP y el Administrador!");
    }

    function showClubDetail(clubName) {
        const club = state.clubs[clubName];
        if (!club) return;

        const modal = document.getElementById('erp-club-modal');
        if (!modal) return;

        const titleEl = document.getElementById('erp-club-modal-title');
        const bodyEl = document.getElementById('erp-club-modal-body');

        if (titleEl) titleEl.textContent = `Ficha de Club: ${club.name}`;
        if (bodyEl) {
            bodyEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <div>
                        <div style="font-size:0.75rem; color:var(--erp-text-dim);">SEDE COLABORADORA</div>
                        <h3 style="color:var(--erp-text-main); font-size:1.25rem;">${club.name}</h3>
                    </div>
                    <span class="traffic-badge ${club.trafficStatus}">
                        ${club.trafficLabel} (${club.marginPct.toFixed(1)}% margen)
                    </span>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; padding:12px; background:#f8fafc; border-radius:12px; margin-bottom:1.5rem; border:1px solid var(--erp-border);">
                    <div>
                        <div style="font-size:0.65rem; color:var(--erp-text-dim);">EVENTOS</div>
                        <strong style="font-size:1.1rem; color:var(--erp-text-main);">${club.eventsCount}</strong>
                    </div>
                    <div>
                        <div style="font-size:0.65rem; color:var(--erp-text-dim);">FACTURACIÓN</div>
                        <strong class="erp-money" style="font-size:1.1rem; color:var(--erp-text-main);">${club.totalIncome.toLocaleString('es-ES')} €</strong>
                    </div>
                    <div>
                        <div style="font-size:0.65rem; color:var(--erp-text-dim);">BENEFICIO</div>
                        <strong class="erp-money positive" style="font-size:1.2rem;">+${club.netProfit.toLocaleString('es-ES')} €</strong>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn-erp btn-erp-secondary" onclick="window.OrganizacionERP.closeModal('erp-club-modal')">Cerrar</button>
                </div>
            `;
        }

        modal.classList.add('open');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
    }

    function exportToExcel() {
        const separator = ';';
        const headers = ['Fecha', 'Evento', 'Club', 'Pistas', 'Jugadores', 'Facturacion', 'Costes', 'Beneficio Neto', 'Margen %'];
        const rows = state.events.map(evt => {
            const f = evt.calculatedFin;
            return [
                evt.date || '',
                `"${(evt.title || '').replace(/"/g, '""')}"`,
                `"${(evt.club || evt.location || '').replace(/"/g, '""')}"`,
                f.courtsCount,
                f.registeredCount,
                f.results.totalIncome.toFixed(2).replace('.', ','),
                f.results.totalExpense.toFixed(2).replace('.', ','),
                f.results.netProfit.toFixed(2).replace('.', ','),
                f.results.marginPct.toFixed(1).replace('.', ',')
            ].join(separator);
        });

        const csvContent = '\uFEFF' + headers.join(separator) + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `SomosPadel_BCN_Eventos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function bindGlobalEvents() {
        const timeEl = document.getElementById('erp-live-time');
        if (timeEl) {
            const updateClock = () => {
                const now = new Date();
                timeEl.textContent = now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            };
            updateClock();
            setInterval(updateClock, 30000);
        }

        window.addEventListener('keydown', (e) => {
            const authModal = document.getElementById('erp-auth-overlay');
            if (authModal && authModal.style.display !== 'none') {
                if (e.key >= '0' && e.key <= '9') {
                    handleKeypadPress(e.key);
                } else if (e.key === 'Backspace') {
                    handleKeypadPress('back');
                } else if (e.key === 'Escape') {
                    handleKeypadPress('clear');
                }
            }
        });
    }

    function toggleMobileSidebar() {
        const sidebar = document.getElementById('erp-sidebar');
        if (sidebar) sidebar.classList.toggle('open');
    }

    function changeMonth(delta) {
        let m = state.calendarMonth + delta;
        let y = state.calendarYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        state.calendarMonth = m;
        state.calendarYear = y;
        renderActiveTab();
    }

    function filterEvents() {
        const sel = document.getElementById('erp-filter-club');
        const clubVal = sel ? sel.value : 'all';
        const tbody = document.getElementById('erp-events-table-body');
        if (!tbody) return;

        const filtered = clubVal === 'all' 
            ? state.events 
            : state.events.filter(e => (e.club || e.location) === clubVal);

        tbody.innerHTML = filtered.map(evt => renderEventRow(evt)).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);
    }

    function setViewDetailMode(mode) {
        updateNppSim('viewDetailMode', mode);
    }

    return {
        init,
        loginWithPin,
        logout,
        handleKeypadPress,
        navigateTo,
        selectClubTab,
        openNewClubModal,
        saveNewClubFromForm,
        openEditClubModal,
        saveClubEdits,
        deleteClub,
        updateClubSim,
        openFinancialModal,
        recalcModalFinancials,
        saveEventFinancials,
        openNewEventModal,
        saveNewEventFromForm,
        showClubDetail,
        closeModal,
        exportToExcel,
        toggleMobileSidebar,
        changeMonth,
        filterEvents,
        updateSimulator,
        updateNppSim,
        applyPreset,
        stepCourts,
        setNppSection,
        setDashboardSubTab,
        setEventsSubTab,
        applyAmericanaPreset,
        updatePairModeHelper,
        toggleCreateClubInput,
        selectCreateAmericanaImage,
        updateAmericanaImagePreview,
        handleAmericanaImageUpload,
        onAmericanaSearch,
        onAmericanaFilterChange,
        setViewDetailMode
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.OrganizacionERP.init();
});
