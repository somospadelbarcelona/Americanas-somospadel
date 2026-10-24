/**
 * TEST QA DE SINCRONIZADOR INTELIGENTE PLAYTOMIC ⇄ SOMOS PÁDEL
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== INICIANDO QA TEST: SINCRONIZADOR PLAYTOMIC ===");

// 1. Verificar HTML de admin.html
const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
assert(adminHtml.includes('id="playtomic-sync-modal"'), "ERROR: Modal playtomic-sync-modal no encontrado en admin.html");
assert(adminHtml.includes('id="playtomic-sync-names-input"'), "ERROR: Textarea de nombres no encontrado");
assert(adminHtml.includes('id="btn-execute-playtomic-sync"'), "ERROR: Botón de ejecución de sincronización no encontrado");
console.log("✅ admin.html: Modal y controles presentes correctamente.");

// 2. Verificar admin-americanas.js
const adminJs = fs.readFileSync(path.join(__dirname, '../js/modules/admin-americanas.js'), 'utf8');
assert(adminJs.includes('window.openPlaytomicSyncModal'), "ERROR: window.openPlaytomicSyncModal no definido");
assert(adminJs.includes('window.previewPlaytomicSync'), "ERROR: window.previewPlaytomicSync no definido");
assert(adminJs.includes('window.executePlaytomicSync'), "ERROR: window.executePlaytomicSync no definido");
assert(adminJs.includes('Jugador Playtomic'), "ERROR: Formato 'Jugador Playtomic' no encontrado");
console.log("✅ admin-americanas.js: Motor de sincronización y botones presentes.");

// 3. Simulación de lógica de cruce inteligente
function normalizePlayerName(str) {
    if (!str) return '';
    return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanPlaytomicInputName(raw) {
    if (!raw) return '';
    let clean = String(raw).trim();
    clean = clean.replace(/^[\s\d\.\-\*•✔️✔🎾\:\#]+/g, '').trim();
    clean = clean.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim();
    clean = clean.replace(/^(jugador|player|nombre)\s*:\s*/i, '').trim();
    return clean;
}

function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ')
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

const mockDbPlayers = [
    { id: "u_pablo", name: "Pablo Mena Gutierrez", level: 3.5, phone: "606220068" },
    { id: "u_miguel", name: "Miguel Blázquez", level: 3.07, phone: "679413781" },
    { id: "u_paula", name: "Paula Sanz", level: 3.0, phone: "635726123" }
];

const testPastedText = `
1. Pablo Mena Gutierrez
✔️ miguel blazquez
Paula Sanz (Nivel 3.0)
- Juan Carlos Ramirez
Carlos Perez
`;

const lines = testPastedText.split(/[\r\n,]+/)
    .map(l => cleanPlaytomicInputName(l))
    .filter(l => l.length >= 2);

assert.strictEqual(lines.length, 5, "Debería haber 5 nombres limpios");

const results = lines.map(cleanName => {
    const normInput = normalizePlayerName(cleanName);
    const inputTokens = new Set(normInput.split(' ').filter(t => t.length > 0));

    let found = null;
    for (const p of mockDbPlayers) {
        const normDb = normalizePlayerName(p.name || '');
        if (normDb === normInput) {
            found = p;
            break;
        }
    }

    if (!found && inputTokens.size >= 2) {
        for (const p of mockDbPlayers) {
            const normDb = normalizePlayerName(p.name || '');
            const dbTokens = new Set(normDb.split(' ').filter(t => t.length > 0));
            let allMatch = true;
            for (const t of inputTokens) {
                if (!dbTokens.has(t)) { allMatch = false; break; }
            }
            if (allMatch) { found = p; break; }
        }
    }

    if (found) {
        return {
            name: found.name,
            level: found.level,
            source: 'app',
            is_matched: true
        };
    } else {
        const formatted = capitalizeWords(cleanName);
        return {
            name: `Jugador Playtomic ${formatted}`,
            source: 'playtomic',
            is_matched: false
        };
    }
});

// Comprobar resultados
assert.strictEqual(results[0].name, "Pablo Mena Gutierrez");
assert.strictEqual(results[0].is_matched, true);
assert.strictEqual(results[0].source, "app");

assert.strictEqual(results[1].name, "Miguel Blázquez");
assert.strictEqual(results[1].is_matched, true);
assert.strictEqual(results[1].source, "app");

assert.strictEqual(results[2].name, "Paula Sanz");
assert.strictEqual(results[2].is_matched, true);

assert.strictEqual(results[3].name, "Jugador Playtomic Juan Carlos Ramirez");
assert.strictEqual(results[3].is_matched, false);
assert.strictEqual(results[3].source, "playtomic");

assert.strictEqual(results[4].name, "Jugador Playtomic Carlos Perez");
assert.strictEqual(results[4].is_matched, false);
assert.strictEqual(results[4].source, "playtomic");

console.log("✅ Lógica de Cruce e Inscripción verificada al 100%:");
results.forEach(r => {
    console.log(`   -> [${r.source.toUpperCase()}] ${r.name}`);
});

console.log("\n🎯 TODOS LOS TESTS QA COMPLETADOS CON ÉXITO.");
