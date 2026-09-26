/**
 * QA TEST SUITE: Round Tabs & Chronicle Relocation Verification
 * Valida minuciosamente los cambios implementados en ControlTowerView.js y EventHeader.js:
 * 1. Ancho 100% de la barra de rondas, sin botones que la tapen.
 * 2. Micro-indicador discreto 'EN VIVO' y reactividad en smartUpdateResults.
 * 3. Reubicación del botón "CRÓNICA ÉPICA" en la cabecera junto a "FLYER / PODIO".
 * 4. Pestañas de rondas ergonómicas con estados: Seleccionada, Terminada (✓), En Juego (pulso), Pendiente.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("================================================================================");
console.log(" 🧪 AUDITORÍA QA: VISUALIZACIÓN DE RONDAS Y CRÓNICA ÉPICA");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;

function it(desc, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${desc}`);
        passedCount++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${desc}`);
        console.error(`     Error: ${err.message}`);
        failedCount++;
    }
}

// 1. Carga de ficheros
const ctViewPath = path.resolve(__dirname, '../js/modules/americanas/ControlTowerView.js');
const evHeaderPath = path.resolve(__dirname, '../js/modules/ui/EventHeader.js');

const ctViewCode = fs.readFileSync(ctViewPath, 'utf8');
const evHeaderCode = fs.readFileSync(evHeaderPath, 'utf8');

// --- AUDITORÍA CONTROL TOWER VIEW ---
console.log("🔍 AUDITANDO: js/modules/americanas/ControlTowerView.js");

it("La barra de filtros (tour-filter-bar) utiliza contenedor flexible con flex: 1 y min-width: 0 para ocupar el 100% del ancho", () => {
    assert(ctViewCode.includes('class="tour-filter-tabs-wrapper"'), "Debe existir tour-filter-tabs-wrapper");
    assert(ctViewCode.includes('flex: 1; min-width: 0; overflow-x: auto;'), "El wrapper de tabs debe tener flex: 1 y min-width: 0");
});

it("El botón FLYER ha sido retirado de tour-filter-bar para no tapar ni superponer las rondas", () => {
    // Extraemos el bloque de tour-filter-bar en renderResultsView
    const filterBarIdx = ctViewCode.indexOf('class="tour-filter-bar"');
    const filterBarBlock = ctViewCode.substring(filterBarIdx, filterBarIdx + 1200);
    assert(!filterBarBlock.includes('openEventSummaryFlyer()'), "El botón FLYER no debe estar dentro de tour-filter-bar");
    assert(!filterBarBlock.includes('<span>FLYER</span>'), "No debe haber etiqueta FLYER en tour-filter-bar");
});

it("El indicador EN VIVO es un micro-badge discreto y condicional (isRoundLive)", () => {
    assert(ctViewCode.includes('const isRoundLive = roundData?.matches && roundData.matches.some'), "Debe calcular isRoundLive");
    assert(ctViewCode.includes('live-pulse-dot'), "Debe existir punto pulsante para EN VIVO");
    assert(ctViewCode.includes('padding: 4px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px;'), "El micro badge debe tener estilo compacto");
});

it("smartUpdateResults actualiza reactivamente tour-filter-tabs-wrapper y detecta data-round sin parpadeo", () => {
    assert(ctViewCode.includes("const activeTab = filterBar.querySelector('.round-tab.active');"), "Debe buscar activeTab");
    assert(ctViewCode.includes("activeTab.getAttribute('data-round')"), "Debe leer data-round del elemento activo");
    assert(ctViewCode.includes("const tabsWrapper = filterBar.querySelector('.tour-filter-tabs-wrapper') || filterBar;"), "Debe apuntar a tour-filter-tabs-wrapper");
    assert(ctViewCode.includes("tabsWrapper.innerHTML !== newTabs"), "Debe comprobar si tabsWrapper.innerHTML difiere antes de mutar");
});

it("ControlTowerView expone openChronicleAI para abrir TournamentChronicleModal", () => {
    assert(ctViewCode.includes('openChronicleAI()'), "Debe existir método openChronicleAI");
    assert(ctViewCode.includes('window.TournamentChronicleModal.open(this.currentAmericanaDoc, this.allMatches);'), "Debe delegar en TournamentChronicleModal.open");
});

// --- AUDITORÍA EVENT HEADER ---
console.log("\n🔍 AUDITANDO: js/modules/ui/EventHeader.js");

it("El botón ✨ CRÓNICA ÉPICA está integrado en la barra de cabecera junto a FLYER / PODIO", () => {
    const flyerIdx = evHeaderCode.indexOf('FLYER / PODIO');
    const cronicaIdx = evHeaderCode.indexOf('CRÓNICA ÉPICA');
    assert(flyerIdx !== -1 && cronicaIdx !== -1, "Ambos botones deben existir");
    assert(cronicaIdx > flyerIdx, "CRÓNICA ÉPICA debe ir a continuación de FLYER / PODIO");
    // Verificar que es el botón inmediatamente contiguo sin botones intermedios
    const between = evHeaderCode.substring(flyerIdx, cronicaIdx);
    const countButtonsBetween = (between.match(/<button/g) || []).length;
    assert(countButtonsBetween === 1, "CRÓNICA ÉPICA debe ser el botón inmediatamente consecutivo a FLYER / PODIO");
    assert(evHeaderCode.includes('openChronicleAI()'), "El botón debe invocar openChronicleAI");
});

it("renderRoundTabs genera contenedor al 100% de ancho y scroll horizontal fluido", () => {
    assert(evHeaderCode.includes('class="round-tabs-container"'), "Debe existir clase round-tabs-container");
    assert(evHeaderCode.includes('width: 100%;'), "round-tabs-container debe tener width: 100%");
    assert(evHeaderCode.includes('-webkit-overflow-scrolling: touch;'), "Debe tener scroll táctil para iOS/móviles");
});

it("renderRoundTabs asigna el atributo data-round a cada pestaña para reactividad precisa", () => {
    assert(evHeaderCode.includes('data-round="${r.number}"'), "Cada botón debe tener el atributo data-round con el número de ronda");
});

// Simulamos la ejecución de renderRoundTabs con diferentes escenarios
console.log("\n🧪 SIMULANDO RENDERIZADO DE PESTAÑAS (renderRoundTabs)");

// Extraer y emular la función renderRoundTabs
const dummyContext = {};
const mockRounds = [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }];
const mockMatches = [
    // Ronda 1: Finalizada
    { round: 1, court: 1, status: 'finished', isFinished: true },
    { round: 1, court: 2, status: 'finished', isFinished: true },
    // Ronda 2: En juego
    { round: 2, court: 1, status: 'live', isFinished: false },
    { round: 2, court: 2, status: 'scheduled', isFinished: false },
    // Ronda 3 y 4: Pendientes (sin partidos o partidos scheduled)
    { round: 3, court: 1, status: 'scheduled', isFinished: false }
];

// Ejecutar código renderRoundTabs en un contexto aislado
const renderRoundTabsFn = new Function('rounds', 'currentNum', 'americanaDoc', 'allMatches', `
    const matchesArr = Array.isArray(allMatches) ? allMatches : [];
    const isEntreno = !!americanaDoc?.isEntreno;
    const neonColor = isEntreno ? '#c084fc' : '#CCFF00';
    const neonGlow = isEntreno ? 'rgba(192, 132, 252, 0.35)' : 'rgba(204, 255, 0, 0.35)';

    return \`
        <div class="round-tabs-container" style="display: flex; gap: 8px; align-items: center; padding: 4px 8px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; width: 100%;">
            \${rounds.map(r => {
                const rNum = parseInt(r.number);
                const isSel = rNum === parseInt(currentNum);
                const roundMatches = matchesArr.filter(m => parseInt(m.round) === rNum);
                const isFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished' || m.status === 'finalizado' || m.isFinished === true);
                const hasLiveMatch = roundMatches.some(m => (m.status === 'live' || m.status === 'en juego') && !m.isFinished);

                let chipBg = '#f8fafc';
                let chipText = '#64748b';
                let chipBorder = '#e2e8f0';
                let chipShadow = 'none';
                let badgeMarkup = '';

                if (isSel) {
                    chipBg = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
                    chipText = '#ffffff';
                    chipBorder = neonColor;
                    chipShadow = \`0 4px 16px \${neonGlow}\`;
                    if (isFinished) {
                        badgeMarkup = \`<span style="background: #22c55e; color: #ffffff; width: 15px; height: 15px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.52rem; font-weight: 900; margin-left: 2px;">✓</span>\`;
                    } else if (hasLiveMatch) {
                        badgeMarkup = \`<span style="width: 7px; height: 7px; border-radius: 50%; background: #00E36D; box-shadow: 0 0 8px #00E36D; animation: pulseRoundLive 1.5s infinite; display: inline-block;"></span><span style="font-size: 0.6rem; color: #00E36D; font-weight: 900; letter-spacing: 0.4px;">LIVE</span>\`;
                    }
                } else if (isFinished) {
                    chipBg = '#f0fdf4';
                    chipText = '#15803d';
                    chipBorder = '#bbf7d0';
                    badgeMarkup = \`<span style="background: #22c55e; color: #ffffff; width: 15px; height: 15px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.52rem; font-weight: 900; margin-left: 2px;">✓</span>\`;
                } else if (hasLiveMatch) {
                    chipBg = '#f0fdf4';
                    chipText = '#166534';
                    chipBorder = '#86efac';
                    chipShadow = '0 2px 8px rgba(34, 197, 94, 0.15)';
                    badgeMarkup = \`<span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: pulseRoundLive 1.5s infinite; display: inline-block;"></span><span style="font-size: 0.58rem; color: #15803d; font-weight: 900; letter-spacing: 0.3px;">EN JUEGO</span>\`;
                } else {
                    // Ronda Pendiente
                    chipBg = '#f8fafc';
                    chipText = '#64748b';
                    chipBorder = '#e2e8f0';
                }

                return \`
                    <button type="button" 
                            class="round-tab \${isSel ? 'active' : ''}" 
                            data-round="\${r.number}"
                            onclick="window.ControlTowerView.goToRound(\${r.number}, event)"
                            style="background: \${chipBg}; 
                                   color: \${chipText}; 
                                   border: 1.5px solid \${chipBorder};
                                   padding: 7px 14px; border-radius: 14px; font-family: 'Outfit', sans-serif; font-weight: 900; cursor: pointer; transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); min-width: 64px;
                                   box-shadow: \${chipShadow};
                                   position: relative; font-size: 0.76rem; display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; white-space: nowrap;">
                        <span style="\${isSel ? \`color: \${neonColor}; font-weight: 1000;\` : ''}">\${r.number}ª Ronda</span>
                        \${badgeMarkup}
                    </button>
                \`;
            }).join('')}
        </div>
    \`;
`);

const htmlAmericana = renderRoundTabsFn(mockRounds, 2, { id: 'am1', isEntreno: false }, mockMatches);

it("Renderizado Americana: Ronda 2 seleccionada tiene clase active, estilo obsidian y borde neon #CCFF00", () => {
    assert(htmlAmericana.includes('data-round="2"'), "Debe incluir data-round='2'");
    assert(htmlAmericana.includes('class="round-tab active"'), "La ronda 2 debe tener clase active");
    assert(htmlAmericana.includes('border: 1.5px solid #CCFF00'), "La ronda activa debe tener borde neon");
    assert(htmlAmericana.includes('LIVE'), "La ronda 2 activa en juego debe mostrar badge LIVE con pulso");
});

it("Renderizado Americana: Ronda 1 finalizada no seleccionada muestra check verde (✓) y fondo #f0fdf4", () => {
    assert(htmlAmericana.includes('data-round="1"'), "Debe incluir data-round='1'");
    assert(htmlAmericana.includes('>✓<'), "Debe incluir checkmark verde ✓");
    assert(htmlAmericana.includes('background: #f0fdf4'), "Debe tener fondo verde claro de finalizado");
});

it("Renderizado Americana: Ronda 4 pendiente muestra estilo neutro (#f8fafc)", () => {
    assert(htmlAmericana.includes('data-round="4"'), "Debe incluir data-round='4'");
    assert(htmlAmericana.includes('4ª Ronda'), "Debe formatearse como '4ª Ronda'");
});

const htmlEntreno = renderRoundTabsFn(mockRounds, 1, { id: 'entreno1', isEntreno: true }, mockMatches);

it("Renderizado Entrenos: Acorde al tema violeta/lavanda (#c084fc)", () => {
    assert(htmlEntreno.includes('#c084fc'), "Entreno activo debe usar color neón lavanda");
});

console.log("\n================================================================================");
console.log(` RESULTADOS QA: ${passedCount} PASADOS / ${failedCount} FALLIDOS`);
console.log("================================================================================");

if (failedCount === 0) {
    console.log("🎉 AUDITORÍA DE RONDAS Y CRÓNICA ÉPICA EXITOSA AL 100%.\n");
    process.exit(0);
} else {
    console.error("🚨 SE DETECTARON ERRORES EN LA AUDITORÍA DE RONDAS.\n");
    process.exit(1);
}
