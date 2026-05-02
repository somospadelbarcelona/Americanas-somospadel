
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const uid = "udlE3GafGB4NW6qbNkB7"; // Alejandro

async function debugMatches() {
    console.log("🔍 Analizando partidos de Alejandro...");
    
    const [entrenosSnap, matchesSnap] = await Promise.all([
        db.collection('entrenos_matches').get(),
        db.collection('matches').get()
    ]);

    let all = [];
    entrenosSnap.forEach(doc => {
        const d = doc.data();
        if ((d.team_a_ids || []).includes(uid) || (d.team_b_ids || []).includes(uid)) {
            all.push({ ...d, id: doc.id, _type: 'ENTRENO' });
        }
    });

    matchesSnap.forEach(doc => {
        const d = doc.data();
        if ((d.team_a_ids || []).includes(uid) || (d.team_b_ids || []).includes(uid)) {
            all.push({ ...d, id: doc.id, _type: 'OFFICIAL' });
        }
    });

    // Sort by date (assuming DD/MM/YYYY and HH:mm)
    all.sort((a, b) => {
        const parse = (m) => {
            if (!m.date) return 0;
            const [d, mo, y] = m.date.split('/');
            const [h, mi] = (m.time || '00:00').split(':');
            return new Date(y, mo - 1, d, h, mi).getTime();
        };
        return parse(b) - parse(a);
    });

    console.log(`\n📋 ÚLTIMOS PARTIDOS ENCONTRADOS (${all.length}):`);
    all.slice(0, 10).forEach(m => {
        const isA = (m.team_a_ids || []).includes(uid);
        const sA = parseInt(m.score_a || 0);
        const sB = parseInt(m.score_b || 0);
        const won = isA ? (sA > sB) : (sB > sA);
        console.log(`[${m.date} ${m.time || '??'}] [${m._type}] ID: ${m.id} | Score: ${sA}-${sB} | Resultado: ${won ? '✅ GANADO' : '❌ PERDIDO'}`);
    });
}

debugMatches().catch(console.error);
