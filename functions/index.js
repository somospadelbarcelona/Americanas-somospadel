/**
 * Firebase Cloud Functions - SomosPadel PRO Secure Logic
 * Purpose: Secure Level Recalculation & Matchmaking in the Cloud.
 * To Deploy: Run 'firebase deploy --only functions'
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// ==========================================
// 1. CORE MATCHMAKING & ROUND GENERATION (BÚNKER ANTI-COPIA)
// ==========================================

/**
 * Genera de forma segura los partidos de una ronda en el servidor.
 * Protege la propiedad intelectual de los algoritmos de pozo y rotaciones.
 */
exports.secureGenerateRound = functions.https.onCall(async (data, context) => {
    // 1. Verificar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado: solo usuarios autenticados.');
    }

    const { eventId, eventType, roundNum, force, randomize } = data;
    if (!eventId) {
        throw new functions.https.HttpsError('invalid-argument', 'Se requiere el ID del evento.');
    }

    const eventCollection = eventType === 'americana' ? 'americanas' : 'entrenos';
    const matchCollection = eventType === 'americana' ? 'matches' : 'entrenos_matches';

    // Verificar permisos de admin u organizador
    const callerDoc = await db.collection('players').doc(context.auth.uid).get();
    const callerRole = callerDoc.exists ? callerDoc.data().role : null;
    const isAuthorized = ['admin', 'super_admin', 'admin_player', 'captain', 'organizador'].includes(callerRole);
    
    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'No tienes permisos de administrador u organizador.');
    }

    // Obtener evento
    const eventRef = db.collection(eventCollection).doc(eventId);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Evento no encontrado.');
    }
    const event = eventDoc.data();

    // Obtener partidos existentes
    const matchesSnap = await db.collection(matchCollection)
        .where('americana_id', '==', eventId)
        .get();
    const existingMatches = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const rNum = parseInt(roundNum) || 1;

    // Si la ronda ya existe y no se fuerza, devolver los existentes
    const existingRoundMatches = existingMatches.filter(m => parseInt(m.round) === rNum);
    if (existingRoundMatches.length > 0 && !force) {
        return { success: true, alreadyExists: true, count: existingRoundMatches.length, matches: existingRoundMatches };
    }

    // Calcular partidos de la nueva ronda en el servidor
    const generated = calculateServerRound(event, existingMatches, rNum, randomize);
    if (!generated || generated.length === 0) {
        throw new functions.https.HttpsError('failed-precondition', 'No hay suficientes jugadores para generar la ronda.');
    }

    // Escritura atómica en lote (Batch Write)
    const batch = db.batch();
    const createdMatches = [];

    // Si forzamos y ya existían, borrar los anteriores de esta ronda
    if (force && existingRoundMatches.length > 0) {
        existingRoundMatches.forEach(oldMatch => {
            batch.delete(db.collection(matchCollection).doc(oldMatch.id));
        });
    }

    generated.forEach(m => {
        const matchRef = db.collection(matchCollection).doc();
        const payload = {
            ...m,
            id: matchRef.id,
            americana_id: eventId,
            round: rNum,
            status: 'pending',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            created_by: context.auth.uid
        };
        batch.set(matchRef, payload);
        createdMatches.push(payload);
    });

    await batch.commit();
    return { success: true, count: createdMatches.length, roundNum: rNum, matches: createdMatches };
});

/**
 * Motor de Emparejamiento Seguro (Server-side Engine)
 */
function calculateServerRound(event, existingMatches, roundNum, randomize) {
    const isFixed = event.pair_mode === 'fixed' || (event.fixed_pairs && event.fixed_pairs.length > 0);
    const maxCourts = parseInt(event.max_courts) || 4;
    const category = event.category || 'open';

    if (isFixed) {
        return calculateFixedPairsRound(event, existingMatches, roundNum, maxCourts);
    } else {
        return calculateRotatingPozoRound(event, existingMatches, roundNum, maxCourts, category, randomize);
    }
}

function calculateFixedPairsRound(event, existingMatches, roundNum, maxCourts) {
    let pairs = event.fixed_pairs || [];
    if (pairs.length < 2) return [];

    const matches = [];
    if (roundNum === 1) {
        for (let i = 0; i < pairs.length; i += 2) {
            if (i + 1 < pairs.length) {
                const court = Math.floor(i / 2) + 1;
                matches.push({
                    court: court,
                    team_a: pairs[i].pair_name || ${pairs[i].player1_name} / ,
                    team_b: pairs[i + 1].pair_name || ${pairs[i + 1].player1_name} / ,
                    team_a_ids: [pairs[i].player1_id, pairs[i].player2_id],
                    team_b_ids: [pairs[i + 1].player1_id, pairs[i + 1].player2_id],
                    players: [pairs[i].player1_id, pairs[i].player2_id, pairs[i + 1].player1_id, pairs[i + 1].player2_id]
                });
            }
        }
    } else {
        // Pozo de parejas: Ganadores suben de pista (Court N -> N-1), perdedores bajan (Court N -> N+1)
        const prevMatches = existingMatches.filter(m => parseInt(m.round) === roundNum - 1);
        const courtMap = {};
        for (let c = 1; c <= maxCourts; c++) courtMap[c] = [];

        prevMatches.forEach(m => {
            const sA = parseInt(m.score_a || 0);
            const sB = parseInt(m.score_b || 0);
            const curCourt = parseInt(m.court || 1);
            const winnerIds = sA >= sB ? m.team_a_ids : m.team_b_ids;
            const loserIds = sA >= sB ? m.team_b_ids : m.team_a_ids;
            const winnerName = sA >= sB ? m.team_a : m.team_b;
            const loserName = sA >= sB ? m.team_b : m.team_a;

            const nextWinnerCourt = Math.max(1, curCourt - 1);
            const nextLoserCourt = Math.min(maxCourts, curCourt + 1);

            if (courtMap[nextWinnerCourt]) courtMap[nextWinnerCourt].push({ ids: winnerIds, name: winnerName });
            if (courtMap[nextLoserCourt]) courtMap[nextLoserCourt].push({ ids: loserIds, name: loserName });
        });

        for (let c = 1; c <= maxCourts; c++) {
            const courtPairs = courtMap[c] || [];
            if (courtPairs.length >= 2) {
                matches.push({
                    court: c,
                    team_a: courtPairs[0].name,
                    team_b: courtPairs[1].name,
                    team_a_ids: courtPairs[0].ids,
                    team_b_ids: courtPairs[1].ids,
                    players: [...courtPairs[0].ids, ...courtPairs[1].ids]
                });
            }
        }
    }
    return matches;
}

function calculateRotatingPozoRound(event, existingMatches, roundNum, maxCourts, category, randomize) {
    const players = event.players || [];
    if (players.length < 4) return [];

    const matches = [];
    const totalCourts = Math.min(maxCourts, Math.floor(players.length / 4));

    if (roundNum === 1) {
        let pool = [...players];
        if (randomize) pool.sort(() => 0.5 - Math.random());
        else pool.sort((a, b) => parseFloat(b.level || 3.5) - parseFloat(a.level || 3.5));

        for (let c = 1; c <= totalCourts; c++) {
            const idx = (c - 1) * 4;
            const p = pool.slice(idx, idx + 4);
            if (p.length === 4) {
                matches.push({
                    court: c,
                    team_a: ${p[0].name} / ,
                    team_b: ${p[1].name} / ,
                    team_a_ids: [p[0].id || p[0].uid, p[3].id || p[3].uid],
                    team_b_ids: [p[1].id || p[1].uid, p[2].id || p[2].uid],
                    players: p.map(x => x.id || x.uid)
                });
            }
        }
    } else {
        // Pozo con rotación de pareja: Los 2 ganadores de la pista K suben a K-1 pero se separan;
        // Los 2 perdedores de K bajan a K+1 y se separan.
        const prevMatches = existingMatches.filter(m => parseInt(m.round) === roundNum - 1);
        const courtWinners = {};
        const courtLosers = {};

        prevMatches.forEach(m => {
            const curCourt = parseInt(m.court || 1);
            const sA = parseInt(m.score_a || 0);
            const sB = parseInt(m.score_b || 0);
            
            const winIds = sA >= sB ? m.team_a_ids : m.team_b_ids;
            const loseIds = sA >= sB ? m.team_b_ids : m.team_a_ids;

            // Extraer nombres de jugadores
            courtWinners[curCourt] = winIds || [];
            courtLosers[curCourt] = loseIds || [];
        });

        // Generar partidos combinando ascendidos y descendidos
        for (let c = 1; c <= totalCourts; c++) {
            let courtPlayers = [];
            if (c === 1) {
                // En pista 1: los ganadores de pista 1 se quedan + los ganadores de pista 2 suben
                courtPlayers = [...(courtWinners[1] || []), ...(courtWinners[2] || [])];
            } else if (c === totalCourts) {
                // En última pista: los perdedores de la penúltima bajan + los perdedores de la última se quedan
                courtPlayers = [...(courtLosers[c - 1] || []), ...(courtLosers[c] || [])];
            } else {
                // En pistas intermedias: ganadores de la inferior suben + perdedores de la superior bajan
                courtPlayers = [...(courtLosers[c - 1] || []), ...(courtWinners[c + 1] || [])];
            }

            if (courtPlayers.length === 4) {
                // Encontrar los datos de los 4 jugadores
                const pDocs = courtPlayers.map(id => players.find(p => String(p.id || p.uid) === String(id)) || { name: 'Jugador', id: id });
                // Cruzar parejas para evitar que repitan juntos
                matches.push({
                    court: c,
                    team_a: ${pDocs[0].name} / ,
                    team_b: ${pDocs[1].name} / ,
                    team_a_ids: [pDocs[0].id || pDocs[0].uid, pDocs[3].id || pDocs[3].uid],
                    team_b_ids: [pDocs[1].id || pDocs[1].uid, pDocs[2].id || pDocs[2].uid],
                    players: pDocs.map(x => x.id || x.uid)
                });
            }
        }
    }
    return matches;
}

// ==========================================
// 2. RECALCULO DE NIVEL ELO SEGURO EN SERVIDOR
// ==========================================

exports.secureRecalcLevel = functions.https.onCall(async (data, context) => {
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

        const players = await Promise.all([...teamA, ...teamB].map(id => db.collection('players').doc(id).get()));
        const levelMap = {};
        players.forEach(p => levelMap[p.id] = p.data().level || 3.5);

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

// ==========================================
// 3. NOTIFICACIONES PUSH SERVER-SIDE
// ==========================================

exports.sendPushNotification = functions.firestore
    .document('players/{userId}/notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
        const { userId } = context.params;
        const notification = snapshot.data();

        const userDoc = await db.collection('players').doc(userId).get();
        const userData = userDoc.data();
        const fcmToken = userData ? userData.fcm_token : null;

        if (!fcmToken) {
            console.log(✉️ No FCM token found for user , skipping push.);
            return null;
        }

        const message = {
            notification: {
                title: notification.title || 'Somospadel BCN',
                body: notification.body || 'Tienes una nueva notificación'
            },
            data: {
                ...notification.data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                url: notification.data ? notification.data.url : 'dashboard'
            },
            token: fcmToken
        };

        try {
            const response = await admin.messaging().send(message);
            console.log(🚀 Push sent successfully to :, response);
            return response;
        } catch (error) {
            console.error(❌ Error sending push to :, error);
            if (error.code === 'messaging/registration-token-not-registered') {
                await db.collection('players').doc(userId).update({ fcm_token: admin.firestore.FieldValue.delete() });
            }
            return null;
        }
    });
