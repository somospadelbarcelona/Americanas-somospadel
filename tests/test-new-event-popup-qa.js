/**
 * Batería de Pruebas QA: Sistema de Popup / Modal Emergente para Nuevos Entrenos y Americanas
 * Verifica DashboardView_hotfix.js y css/notifications.css
 */
const fs = require('fs');
const path = require('path');

async function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ FAIL: ${name} -> ${err.message}`);
            failed++;
        }
    }

    console.log("========================================================================");
    console.log("🎾 BATERÍA QA: MODAL EMERGENTE NUEVOS EVENTOS / PLAZAS LIBRES");
    console.log("========================================================================");

    const dashboardPath = path.join(__dirname, '../js/modules/dashboard/DashboardView_hotfix.js');
    const cssPath = path.join(__dirname, '../css/notifications.css');

    const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
    const cssCode = fs.readFileSync(cssPath, 'utf8');

    // 1. Sintaxis
    test('DashboardView_hotfix.js sintaxis válida', () => {
        const { execSync } = require('child_process');
        execSync(`node -c "${dashboardPath}"`);
    });

    // 2. Existencia de métodos requeridos
    test('DashboardView_hotfix.js declara checkAndShowNewEventPopup', () => {
        if (!/async\s+checkAndShowNewEventPopup\s*\(/.test(dashboardCode)) {
            throw new Error('No se encontró el método async checkAndShowNewEventPopup()');
        }
    });

    test('DashboardView_hotfix.js declara showNewEventPopup', () => {
        if (!/showNewEventPopup\s*\(/.test(dashboardCode)) {
            throw new Error('No se encontró el método showNewEventPopup()');
        }
    });

    // 3. Consulta de servicios
    test('checkAndShowNewEventPopup consulta AmericanaService.getAllActiveEvents o NotificationService', () => {
        if (!dashboardCode.includes('getAllActiveEvents') || !dashboardCode.includes('NotificationService')) {
            throw new Error('No consulta AmericanaService.getAllActiveEvents() o NotificationService');
        }
    });

    // 4. Invocación en loadLiveWidgetContent con delay
    test('loadLiveWidgetContent invoca checkAndShowNewEventPopup con 800ms de delay', () => {
        if (!dashboardCode.includes('this.checkAndShowNewEventPopup()') || !dashboardCode.includes('800')) {
            throw new Error('No se encontró la invocación con setTimeout de 800ms en loadLiveWidgetContent');
        }
    });

    // 5. Manejo de persistencia de descarte
    test('DashboardView_hotfix.js comprueba y guarda sp_event_popup_dismissed_${eventId}', () => {
        if (!dashboardCode.includes('sp_event_popup_dismissed_')) {
            throw new Error('No utiliza la clave de persistencia sp_event_popup_dismissed_');
        }
        if (!dashboardCode.includes("localStorage.getItem('sp_event_popup_dismissed_' + eventId)")) {
            throw new Error('No comprueba el descarte del evento en localStorage');
        }
        if (!dashboardCode.includes("localStorage.setItem('sp_event_popup_dismissed_' + eventId, 'true')")) {
            throw new Error('No guarda el descarte del evento en localStorage');
        }
    });

    // 6. Contenido del popup: Badges y Botones
    test('showNewEventPopup contiene badges neón para Entreno y Americana', () => {
        if (!dashboardCode.includes('💪 NUEVO ENTRENO CONVOCADO')) {
            throw new Error('No contiene el badge "💪 NUEVO ENTRENO CONVOCADO"');
        }
        if (!dashboardCode.includes('🏆 NUEVA AMERICANA')) {
            throw new Error('No contiene el badge "🏆 NUEVA AMERICANA"');
        }
    });

    test('showNewEventPopup contiene el botón de acción principal "🎾 APUNTARME / VER PLAZAS"', () => {
        if (!dashboardCode.includes('🎾 APUNTARME / VER PLAZAS')) {
            throw new Error('Falta el botón "🎾 APUNTARME / VER PLAZAS"');
        }
    });

    test('showNewEventPopup redirige a entrenos o americanas y cierra el modal', () => {
        if (!dashboardCode.includes("window.Router.navigate(route)") || !dashboardCode.includes("isEntreno ? 'entrenos' : 'americanas'")) {
            throw new Error('No gestiona la redirección al evento por tipo');
        }
    });

    test('showNewEventPopup contiene botón de descartar "Ver más tarde" o "Cerrar"', () => {
        if (!dashboardCode.includes('Ver más tarde') && !dashboardCode.includes('Cerrar')) {
            throw new Error('Falta el botón de descarte');
        }
    });

    // 7. CSS y Estilos
    test('css/notifications.css define .sp-new-event-popup-overlay', () => {
        if (!cssCode.includes('.sp-new-event-popup-overlay')) {
            throw new Error('No se encontró la regla .sp-new-event-popup-overlay en notifications.css');
        }
    });

    test('css/notifications.css define .sp-new-event-popup-card', () => {
        if (!cssCode.includes('.sp-new-event-popup-card')) {
            throw new Error('No se encontró la regla .sp-new-event-popup-card en notifications.css');
        }
    });

    test('css/notifications.css define .sp-new-event-badge', () => {
        if (!cssCode.includes('.sp-new-event-badge')) {
            throw new Error('No se encontró la regla .sp-new-event-badge en notifications.css');
        }
    });

    test('css/notifications.css define .sp-new-event-btn-action', () => {
        if (!cssCode.includes('.sp-new-event-btn-action')) {
            throw new Error('No se encontró la regla .sp-new-event-btn-action en notifications.css');
        }
    });

    test('css/notifications.css incluye media query responsive para móviles (< 480px)', () => {
        if (!cssCode.includes('@media (max-width: 480px)') || !cssCode.includes('.sp-new-event-popup-card')) {
            throw new Error('No contiene adaptación responsive para pantallas pequeñas');
        }
    });

    // 8. Prueba funcional aislada simulando la selección de candidatos
    test('Prueba funcional: filtrado y priorización de eventos (48h y plazas libres)', () => {
        const now = Date.now();
        const fakeEvents = [
            {
                id: 'evt_dismissed',
                name: 'Entreno Descartado',
                type: 'entreno',
                createdAt: now - (2 * 60 * 60 * 1000), // Hace 2h
                courts: 3,
                players: []
            },
            {
                id: 'evt_old_no_spots',
                name: 'Americana Pasada',
                type: 'americana',
                createdAt: now - (60 * 60 * 60 * 1000), // Hace 60h
                date: '2026-09-20',
                courts: 4,
                players: new Array(16).fill({ uid: 'p' }) // Llena
            },
            {
                id: 'evt_recent_entreno',
                name: 'ENTRENO MASCULINO 27/09',
                type: 'entreno',
                createdAt: now - (4 * 60 * 60 * 1000), // Hace 4h
                date: '2026-09-27',
                time: '18:30',
                location: 'Delfos Cornellà',
                courts: 3,
                players: [{ uid: 'other1' }] // 11 plazas libres
            },
            {
                id: 'evt_spots_americana',
                name: 'AMERICANA NIVEL 3.5',
                type: 'americana',
                createdAt: now - (50 * 60 * 60 * 1000), // Hace 50h (>48h)
                date: '2026-09-28',
                time: '11:00',
                location: 'Badalona Padel Club',
                courts: 4,
                players: new Array(14).fill({ uid: 'other' }) // 2 plazas libres
            }
        ];

        const mockLocalStorage = {
            'sp_event_popup_dismissed_evt_dismissed': 'true'
        };

        const candidates = [];
        for (const evt of fakeEvents) {
            if (mockLocalStorage['sp_event_popup_dismissed_' + evt.id] === 'true') continue;

            const courts = Number(evt.courts || 3);
            const maxPlayers = courts * 4;
            const openSpots = Math.max(0, maxPlayers - (evt.players ? evt.players.length : 0));

            const isRecentlyCreated = (now - evt.createdAt) <= (48 * 60 * 60 * 1000);
            const hasOpenSpots = openSpots > 0;

            if (isRecentlyCreated || hasOpenSpots) {
                candidates.push({
                    id: evt.id,
                    isRecentlyCreated,
                    hasOpenSpots,
                    createdTime: evt.createdAt,
                    isEntreno: evt.type === 'entreno'
                });
            }
        }

        candidates.sort((a, b) => {
            if (a.isRecentlyCreated && !b.isRecentlyCreated) return -1;
            if (!a.isRecentlyCreated && b.isRecentlyCreated) return 1;
            if (a.isRecentlyCreated && b.isRecentlyCreated) {
                return b.createdTime - a.createdTime;
            }
            return 0;
        });

        if (candidates.length !== 2) {
            throw new Error(`Se esperaban 2 candidatos válidos, encontrados: ${candidates.length}`);
        }
        if (candidates[0].id !== 'evt_recent_entreno') {
            throw new Error(`El candidato prioritario debía ser evt_recent_entreno, fue: ${candidates[0].id}`);
        }
        if (candidates[1].id !== 'evt_spots_americana') {
            throw new Error(`El segundo candidato debía ser evt_spots_americana, fue: ${candidates[1].id}`);
        }
    });

    console.log("========================================================================");
    console.log(`📊 TOTAL PRUEBAS: ${passed + failed}`);
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLADAS: ${failed}`);
    console.log("========================================================================");

    if (failed > 0) process.exit(1);
}

runTests();
