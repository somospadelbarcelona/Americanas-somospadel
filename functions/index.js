/**
 * Firebase Cloud Functions - SomosPadel PRO Secure Logic
 * Purpose: Secure Level Recalculation & Matchmaking in the Cloud.
 * To Deploy: Run 'firebase deploy --only functions'
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Recalculate Player Level Securely
 * Triggered via HTTP or onCreate/onUpdate Match
 */
exports.secureRecalcLevel = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Solo usuarios registrados.');

    const { matchId, collection } = data;
    const matchRef = db.collection(collection || 'matches').doc(matchId);

    return await db.runTransaction(async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists || matchDoc.data().status !== 'finished') return { success: false, msg: 'Partido no listo' };

        const match = matchDoc.data();
        const scoreA = parseInt(match.score_a);
        const scoreB = parseInt(match.score_b);
        const teamA = match.team_a_ids || [];
        const teamB = match.team_b_ids || [];

        // Fetch Player Stats
        const players = await Promise.all([...teamA, ...teamB].map(id => db.collection('players').doc(id).get()));
        const levelMap = {};
        players.forEach(p => levelMap[p.id] = p.data().level || 3.5);

        // Core ELO logic (Server-side)
        const getAvg = (ids) => ids.map(id => levelMap[id] || 3.5).reduce((a, b) => a + b, 0) / (ids.length || 1);
        const avgA = getAvg(teamA);
        const avgB = getAvg(teamB);

        const calcDelta = (score, rivalScore, myAvg, rivalAvg) => {
            const win = score > rivalScore;
            const total = score + rivalScore;
            let pDelta = (win ? 0.012 : -0.012) + (((score / total) - 0.5) * 0.01);
            let dDelta = win ? (rivalAvg > myAvg ? (rivalAvg - myAvg) * 0.02 : 0.004)
                : (rivalAvg < myAvg ? (rivalAvg - myAvg) * 0.02 : -0.004);
            return pDelta + dDelta;
        };

        const deltaA = calcDelta(scoreA, scoreB, avgA, avgB);
        const deltaB = calcDelta(scoreB, scoreA, avgB, avgA);

        // Batch Updates for Players
        teamA.forEach(id => {
            const oldLevel = levelMap[id];
            const newLevel = Math.max(0, Math.min(7.5, Math.round((oldLevel + deltaA) * 100) / 100));
            transaction.update(db.collection('players').doc(id), { level: newLevel, last_update: admin.firestore.FieldValue.serverTimestamp() });
        });

        teamB.forEach(id => {
            const oldLevel = levelMap[id];
            const newLevel = Math.max(0, Math.min(7.5, Math.round((oldLevel + deltaB) * 100) / 100));
            transaction.update(db.collection('players').doc(id), { level: newLevel, last_update: admin.firestore.FieldValue.serverTimestamp() });
        });

        return { success: true, deltaA, deltaB };
    });
});
