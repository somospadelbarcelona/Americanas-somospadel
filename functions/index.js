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
                    team_a: pairs[i].pair_name || `${pairs[i].player1_name} / ${pairs[i].player2_name || ''}`,
                    team_b: pairs[i + 1].pair_name || `${pairs[i + 1].player1_name} / ${pairs[i + 1].player2_name || ''}`,
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
                    team_a: `${p[0].name} / ${p[3].name}`,
                    team_b: `${p[1].name} / ${p[2].name}`,
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
                    team_a: `${pDocs[0].name} / ${pDocs[3].name}`,
                    team_b: `${pDocs[1].name} / ${pDocs[2].name}`,
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
// 3. NOTIFICACIONES PUSH SERVER-SIDE (MULTI-DISPOSITIVO)
// ==========================================

const sendPushNotificationHandler = async (snapshot, context) => {
    const { userId } = context.params;
    const notification = snapshot.data();

    if (!notification) {
        return null;
    }

    // Omitir si la notificación fue generada internamente por un evento de Topic ya notificado
    if (notification.skipPush) {
        console.log(`✉️ [Push] Notificación interna con skipPush=true para ${userId}, omitiendo push.`);
        return null;
    }

    // 1. Obtener todos los dispositivos registrados en la subcolección 'devices'
    const devicesSnap = await db.collection('players').doc(userId).collection('devices').get();
    
    // 2. Obtener documento del usuario para posible fallback legacy
    const userDoc = await db.collection('players').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const devices = [];
    devicesSnap.forEach(doc => {
        const d = doc.data();
        if (d && d.token && typeof d.token === 'string' && d.token.trim()) {
            devices.push({ id: doc.id, token: d.token.trim(), isLegacy: false });
        }
    });

    // Fallback: Si no tiene subcolección pero sí fcm_token raíz legacy
    if (devices.length === 0 && userData && userData.fcm_token && typeof userData.fcm_token === 'string') {
        devices.push({ id: 'legacy_device', token: userData.fcm_token.trim(), isLegacy: true });
    }

    // Deduplicar tokens
    const uniqueDevices = [];
    const seenTokens = new Set();
    for (const dev of devices) {
        if (!seenTokens.has(dev.token)) {
            seenTokens.add(dev.token);
            uniqueDevices.push(dev);
        }
    }

    if (uniqueDevices.length === 0) {
        console.log(`✉️ [Push] No hay tokens FCM válidos para usuario ${userId}, omitiendo push.`);
        return null;
    }

    const title = notification.title || 'SomosPadel BCN 🎾';
    const body = notification.body || 'Tienes una nueva notificación en SomosPadel';
    const notifData = notification.data || {};
    const targetUrl = notifData.url || notifData.link || 'dashboard';

    // Generar enlace webpush completo
    let fullLink = 'https://americanas-somospadel.firebaseapp.com/';
    if (targetUrl) {
        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
            fullLink = targetUrl;
        } else if (targetUrl.startsWith('/')) {
            fullLink = `https://americanas-somospadel.firebaseapp.com${targetUrl}`;
        } else {
            fullLink = `https://americanas-somospadel.firebaseapp.com/#${targetUrl}`;
        }
    }

    // Normalizar datos: en FCM data payload, todos los valores deben ser Strings
    const dataPayload = {
        url: String(targetUrl),
        notificationId: String(snapshot.id || ''),
        title: String(title),
        body: String(body)
    };

    for (const [key, val] of Object.entries(notifData)) {
        if (val !== undefined && val !== null) {
            dataPayload[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
        }
    }

    // Payload optimizado con soporte webpush completo (icono, badge, fcmOptions.link)
    const multicastMessage = {
        tokens: uniqueDevices.map(d => d.token),
        notification: {
            title: title,
            body: body
        },
        data: dataPayload,
        webpush: {
            notification: {
                title: title,
                body: body,
                icon: '/img/logo_somospadel.png',
                badge: '/img/logo_somospadel.png',
                tag: notification.tag || snapshot.id,
                renotify: true
            },
            fcmOptions: {
                link: fullLink
            }
        }
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(multicastMessage);
        console.log(`🚀 [Push] Enviado a ${userId}: ${response.successCount} éxitos, ${response.failureCount} fallos de ${uniqueDevices.length} dispositivo(s).`);

        // Identificar tokens inválidos o expirados para eliminarlos
        const tokensToDelete = [];
        response.responses.forEach((res, index) => {
            if (!res.success && res.error) {
                const errorCode = res.error.code;
                console.warn(`⚠️ [Push] Error en dispositivo ${uniqueDevices[index].id} (${errorCode}):`, res.error.message);
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/mismatched-credential'
                ) {
                    tokensToDelete.push(uniqueDevices[index]);
                }
            }
        });

        // Limpiar tokens obsoletos en Firestore
        if (tokensToDelete.length > 0) {
            console.log(`🧹 [Push] Eliminando ${tokensToDelete.length} token(s) expirados para usuario ${userId}...`);
            const batch = db.batch();
            tokensToDelete.forEach(dev => {
                if (!dev.isLegacy) {
                    const devRef = db.collection('players').doc(userId).collection('devices').doc(dev.id);
                    batch.delete(devRef);
                }
                if (userData && userData.fcm_token === dev.token) {
                    const userRef = db.collection('players').doc(userId);
                    batch.update(userRef, { fcm_token: admin.firestore.FieldValue.delete() });
                }
            });
            await batch.commit();
            console.log(`✅ [Push] Limpieza de dispositivos obsoletos completada.`);
        }

        return {
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error(`❌ [Push] Error general al enviar multicast a ${userId}:`, error);
        return null;
    }
};

exports.sendPushNotification = functions.firestore
    .document('players/{userId}/notifications/{notificationId}')
    .onCreate(sendPushNotificationHandler);

exports.dispatchPushNotification = exports.sendPushNotification;

// ==========================================
// 4. HELPERS PARA NOTIFICACIONES MULTICAST Y TOPICS
// ==========================================

/**
 * Genera el enlace webpush completo compatible con PWA y navegador
 */
function buildFullLink(targetUrl) {
    const baseUrl = 'https://americanas-somospadel.firebaseapp.com/';
    if (!targetUrl) return baseUrl;
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        return targetUrl;
    }
    if (targetUrl.startsWith('/')) {
        return `https://americanas-somospadel.firebaseapp.com${targetUrl}`;
    }
    return `https://americanas-somospadel.firebaseapp.com/#${targetUrl}`;
}

/**
 * Envía una notificación push vía FCM Topic
 */
async function sendTopicNotification(topic, title, body, targetUrl, customData = {}, tag = '') {
    const fullLink = buildFullLink(targetUrl);
    const dataPayload = {
        url: String(targetUrl || 'dashboard'),
        title: String(title),
        body: String(body),
        topic: String(topic)
    };

    for (const [key, val] of Object.entries(customData)) {
        if (val !== undefined && val !== null) {
            dataPayload[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
        }
    }

    const message = {
        topic: topic,
        notification: {
            title: title,
            body: body
        },
        data: dataPayload,
        webpush: {
            notification: {
                title: title,
                body: body,
                icon: '/img/logo_somospadel.png',
                badge: '/img/logo_somospadel.png',
                tag: tag || `topic_${topic}_${Date.now()}`,
                renotify: true
            },
            fcmOptions: {
                link: fullLink
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log(`🚀 [FCM Topic] Push enviada con éxito a topic '${topic}':`, response);
        return { success: true, messageId: response };
    } catch (err) {
        console.error(`❌ [FCM Topic] Error enviando mensaje a topic '${topic}':`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Guarda una notificación interna en el cajón ('notifications') de todos los jugadores activos.
 * Utiliza batches atómicos respetando el límite de 500 operaciones de Firestore.
 */
async function saveInAppNotificationForActivePlayers(notifPayload) {
    try {
        const playersSnap = await db.collection('players').get();
        const activePlayers = playersSnap.docs.filter(doc => {
            const data = doc.data();
            return data && data.status !== 'inactive' && data.status !== 'blocked';
        });

        if (activePlayers.length === 0) {
            console.log('ℹ️ [InAppNotif] No se encontraron jugadores activos para notificar.');
            return 0;
        }

        const BATCH_SIZE = 400;
        let count = 0;
        for (let i = 0; i < activePlayers.length; i += BATCH_SIZE) {
            const chunk = activePlayers.slice(i, i + BATCH_SIZE);
            const batch = db.batch();
            for (const playerDoc of chunk) {
                const notifRef = db.collection('players').doc(playerDoc.id).collection('notifications').doc();
                batch.set(notifRef, {
                    ...notifPayload,
                    read: false,
                    skipPush: true, // Se omite el push individual porque ya fue emitido por FCM Topic
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                count++;
            }
            await batch.commit();
        }
        console.log(`✅ [InAppNotif] Notificación guardada en el cajón de ${count} jugadores activos.`);
        return count;
    } catch (err) {
        console.error('❌ [InAppNotif] Error guardando notificaciones masivas en Firestore:', err);
        return 0;
    }
}

// ==========================================
// 5. GESTIÓN AUTOMÁTICA DE TOPICS FCM POR DISPOSITIVO
// ==========================================

/**
 * Trigger: onDeviceRegistered
 * Cada vez que se registra o actualiza un token en un dispositivo (players/{userId}/devices/{deviceId}),
 * suscribe automáticamente dicho token a los Topics oficiales: 'all_players', 'americanas', 'entrenos', 'news'.
 */
exports.onDeviceRegistered = functions.firestore
    .document('players/{userId}/devices/{deviceId}')
    .onWrite(async (change, context) => {
        const { userId, deviceId } = context.params;
        const topics = ['all_players', 'americanas', 'entrenos', 'news'];

        // Si el dispositivo fue eliminado
        if (!change.after.exists) {
            const beforeData = change.before.data();
            const oldToken = beforeData && beforeData.token ? String(beforeData.token).trim() : null;
            if (oldToken) {
                console.log(`🔌 [FCM Device] Desuscribiendo token de topics al borrar dispositivo (${userId}/${deviceId})`);
                await Promise.allSettled(topics.map(t => admin.messaging().unsubscribeFromTopic([oldToken], t)));
            }
            return null;
        }

        const data = change.after.data();
        const token = data && data.token ? String(data.token).trim() : null;

        if (!token) {
            console.log(`ℹ️ [FCM Device] Dispositivo ${userId}/${deviceId} sin token FCM válido.`);
            return null;
        }

        // Si cambió el token respecto al anterior, desuscribir el token previo
        if (change.before.exists) {
            const beforeToken = change.before.data()?.token ? String(change.before.data().token).trim() : null;
            if (beforeToken && beforeToken !== token) {
                console.log(`🔄 [FCM Device] Token actualizado. Desuscribiendo token previo (${userId}/${deviceId})...`);
                await Promise.allSettled(topics.map(t => admin.messaging().unsubscribeFromTopic([beforeToken], t)));
            }
        }

        console.log(`📡 [FCM Device] Suscribiendo dispositivo ${userId}/${deviceId} a topics [${topics.join(', ')}]...`);
        const subResults = await Promise.allSettled(topics.map(t => admin.messaging().subscribeToTopic([token], t)));
        subResults.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
                console.log(`✅ [FCM Device] Suscrito a topic '${topics[idx]}' (${userId}/${deviceId})`);
            } else {
                console.warn(`⚠️ [FCM Device] Error al suscribir a topic '${topics[idx]}':`, res.reason);
            }
        });

        return { success: true };
    });

// ==========================================
// 6. TRIGGERS AUTOMÁTICOS DE EVENTOS DEL CLUB
// ==========================================

/**
 * Trigger: onNewAmericanaPublished
 * Al crearse una americana, enviar automáticamente notificación push a todos los jugadores
 * por Topic 'americanas' y registrarla en el cajón de notificaciones de jugadores activos.
 */
exports.onNewAmericanaPublished = functions.firestore
    .document('americanas/{id}')
    .onCreate(async (snapshot, context) => {
        const { id } = context.params;
        const data = snapshot.data() || {};

        const title = '🎾 ¡NUEVA AMERICANA PUBLICADA!';
        const body = `${data.name || 'Torneo de Pádel'}: Inscripciones abiertas. ¡Reserva tu plaza!`;
        const targetUrl = 'americanas';

        console.log(`🎾 [onNewAmericanaPublished] Notificando nueva americana ${id} - "${data.name || ''}"`);

        // 1. Enviar push masiva por topic 'americanas'
        await sendTopicNotification('americanas', title, body, targetUrl, {
            id: String(id),
            americanaId: String(id),
            type: 'new_americana'
        }, `americana_${id}`);

        // 2. Guardar en subcolección 'notifications' de cada jugador activo (in-app drawer con badge)
        await saveInAppNotificationForActivePlayers({
            title: title,
            body: body,
            icon: 'trophy',
            data: {
                url: targetUrl,
                id: id,
                americanaId: id,
                type: 'new_americana'
            }
        });

        return { success: true, id };
    });

/**
 * Trigger: onNewEntrenoPublished
 * Al crearse un entreno, enviar push a todos los jugadores por Topic 'entrenos'
 * y registrarla en el cajón de notificaciones de jugadores activos.
 */
exports.onNewEntrenoPublished = functions.firestore
    .document('entrenos/{id}')
    .onCreate(async (snapshot, context) => {
        const { id } = context.params;
        const data = snapshot.data() || {};

        const title = '💪 ¡NUEVO ENTRENO TÁCTICO!';
        const body = `${data.name || 'Sesión de Entrenamiento'}: Plazas abiertas. ¡Mejora tu juego!`;
        const targetUrl = 'entrenos';

        console.log(`💪 [onNewEntrenoPublished] Notificando nuevo entreno ${id} - "${data.name || ''}"`);

        // 1. Enviar push masiva por topic 'entrenos'
        await sendTopicNotification('entrenos', title, body, targetUrl, {
            id: String(id),
            entrenoId: String(id),
            type: 'new_entreno'
        }, `entreno_${id}`);

        // 2. Guardar en subcolección 'notifications' de cada jugador activo
        await saveInAppNotificationForActivePlayers({
            title: title,
            body: body,
            icon: 'dumbbell',
            data: {
                url: targetUrl,
                id: id,
                entrenoId: id,
                type: 'new_entreno'
            }
        });

        return { success: true, id };
    });

/**
 * Trigger: onBroadcastNoticeCreated
 * Al crear el administrador un comunicado urgente o noticia ('broadcasts/{id}'),
 * enviar push a todos los jugadores por Topic y registrar en el cajón interno.
 */
exports.onBroadcastNoticeCreated = functions.firestore
    .document('broadcasts/{id}')
    .onCreate(async (snapshot, context) => {
        const { id } = context.params;
        const data = snapshot.data() || {};

        const title = `📢 ${data.title || 'COMUNICADO SOMOSPADEL'}`;
        const body = `${data.body || data.message || 'Nuevo aviso importante en la app.'}`;
        const targetUrl = `${data.url || 'dashboard'}`;
        const topic = data.topic || 'all_players';

        console.log(`📢 [onBroadcastNoticeCreated] Publicando aviso oficial ${id}: "${title}"`);

        // 1. Enviar push por Topic (por defecto 'all_players' o el configurado)
        await sendTopicNotification(topic, title, body, targetUrl, {
            id: String(id),
            broadcastId: String(id),
            type: 'broadcast'
        }, `broadcast_${id}`);

        // 2. Guardar en subcolección 'notifications' de los jugadores activos
        await saveInAppNotificationForActivePlayers({
            title: title,
            body: body,
            icon: data.icon || 'bullhorn',
            data: {
                url: targetUrl,
                id: id,
                broadcastId: id,
                type: 'broadcast'
            }
        });

        return { success: true, id };
    });

// ==========================================
// 7. HTTPS CALLABLE: EMISIÓN GLOBAL DE COMUNICADOS DEL CLUB (ADMIN)
// ==========================================

/**
 * Callable HTTPS: sendClubBroadcast
 * Permite a organizadores y administradores emitir un aviso global con 1 clic desde el panel de control.
 */
exports.sendClubBroadcast = functions.https.onCall(async (data, context) => {
    // 1. Validar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado: solo usuarios autenticados.');
    }

    // 2. Validar rol de organizador / administrador
    const callerDoc = await db.collection('players').doc(context.auth.uid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole = callerData ? callerData.role : null;
    const isAuthorized = ['admin', 'super_admin', 'admin_player', 'organizador', 'captain'].includes(callerRole);

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'No tienes permisos de administrador para emitir comunicados del club.');
    }

    const { title, body, message, url, topic, icon } = data || {};
    const notifTitle = title ? String(title).trim() : 'COMUNICADO SOMOSPADEL';
    const notifBody = (body || message) ? String(body || message).trim() : 'Nuevo aviso importante en la app.';
    const targetUrl = url ? String(url).trim() : 'dashboard';
    const targetTopic = topic ? String(topic).trim() : 'all_players';
    const notifIcon = icon ? String(icon).trim() : 'bullhorn';

    // 3. Crear documento en 'broadcasts', lo que dispara automáticamente onBroadcastNoticeCreated
    const broadcastRef = await db.collection('broadcasts').add({
        title: notifTitle,
        body: notifBody,
        url: targetUrl,
        topic: targetTopic,
        icon: notifIcon,
        author_uid: context.auth.uid,
        author_name: callerData ? (callerData.name || callerData.nickname || 'Administración') : 'Administración',
        created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📢 [sendClubBroadcast] Comunicado creado con ID ${broadcastRef.id} por admin ${context.auth.uid}`);

    return {
        success: true,
        broadcastId: broadcastRef.id,
        title: notifTitle,
        body: notifBody,
        url: targetUrl,
        topic: targetTopic
    };
});

