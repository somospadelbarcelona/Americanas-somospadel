/**
 * tests/test-create-matches-atomic-replace.js
 * 
 * Verifica que MatchMakingService._createMatches reemplaza atómicamente
 * los partidos existentes de una ronda en Firestore cuando se regenera,
 * en lugar de ignorarlos silenciosamente.
 */

const assert = require('assert');

// Mock de Firestore batch y collection
class MockDocRef {
    constructor(id) {
        this.id = id || `mock_doc_${Math.random().toString(36).substring(2, 9)}`;
    }
}

class MockBatch {
    constructor() {
        this.ops = [];
    }
    set(docRef, data) {
        this.ops.push({ type: 'set', id: docRef.id, data });
    }
    delete(docRef) {
        this.ops.push({ type: 'delete', id: docRef.id });
    }
    async commit() {
        this.committed = true;
    }
}

const existingDocs = [
    { id: 'old_match_p1', data: () => ({ court: 1, round: 2, team_a_ids: ['wrong_1', 'wrong_2'] }), ref: new MockDocRef('old_match_p1') },
    { id: 'old_match_p2', data: () => ({ court: 2, round: 2, team_a_ids: ['wrong_3', 'wrong_4'] }), ref: new MockDocRef('old_match_p2') }
];

let queryRound = null;
let queryEventId = null;

const mockDbCollection = {
    where(field, op, val) {
        if (field === 'americana_id') queryEventId = val;
        if (field === 'round') queryRound = val;
        return this;
    },
    async get() {
        return {
            empty: existingDocs.length === 0,
            size: existingDocs.length,
            docs: existingDocs
        };
    },
    doc() {
        return new MockDocRef();
    }
};

const mockBatch = new MockBatch();

global.window = {
    db: {
        collection: () => mockDbCollection,
        batch: () => mockBatch
    }
};

const MatchMakingService = require('../js/MatchMakingService');

async function run() {
    console.log('🧪 Iniciando test de reemplazo atómico en _createMatches...');

    const newMatchesData = [
        { court: 1, round: 2, team_a_ids: ['alvaro', 'adria'], team_b_ids: ['anais', 'anas'] },
        { court: 2, round: 2, team_a_ids: ['adrian', 'alex'], team_b_ids: ['agata', 'arnau'] }
    ];

    const result = await MatchMakingService._createMatches('evt_123', newMatchesData, 'americana');

    assert.strictEqual(result.length, 2, 'Debe haber creado los 2 nuevos partidos');
    assert.strictEqual(mockBatch.committed, true, 'El batch debe haberse commiteado');

    // Comprobar que en el batch se eliminaron los viejos Y se crearon los nuevos
    const deleteOps = mockBatch.ops.filter(op => op.type === 'delete');
    const setOps = mockBatch.ops.filter(op => op.type === 'set');

    assert.strictEqual(deleteOps.length, 2, 'Debe haber eliminado los 2 partidos antiguos de R2');
    assert.strictEqual(setOps.length, 2, 'Debe haber insertado los 2 partidos nuevos de R2');

    console.log('✅ Delete Ops:', deleteOps.map(o => o.id));
    console.log('✅ Set Ops:', setOps.map(o => `P${o.data.court}: ${o.data.team_a_ids.join('+')} vs ${o.data.team_b_ids.join('+')}`));
    console.log('🎉 TEST SUPERADO: _createMatches reemplaza atómicamente partidos antiguos en Firestore sin saltárselos.');
}

run().catch(err => {
    console.error('❌ Falló el test:', err);
    process.exit(1);
});
