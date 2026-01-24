/**
 * RecordsController.js
 * "Hall of Fame" Logic 🏆
 * Calculates historical records from all matches database.
 */
(function () {
    class RecordsController {
        constructor() {
            this.db = window.FirebaseDB;
            this.state = {
                records: {}
            };
        }

        async init() {
            console.log("🏆 RecordsController Initializing...");
            await this.calculateRecords();
        }

        async calculateRecords() {
            try {
                // Fetch ALL data needed (Heavy operation, maybe cache later)
                const [allMatches, allPlayers] = await Promise.all([
                    this.db.matches.getAll(),
                    this.db.players.getAll()
                ]);

                // Also fetch entrenos matches if separate
                const entrenosMatches = this.db.entrenos_matches ? await this.db.entrenos_matches.getAll() : [];
                const totalMatches = [...allMatches, ...entrenosMatches];

                console.log(`📊 Records: Analizando ${totalMatches.length} partidos y ${allPlayers.length} jugadores.`);

                // 1. LONGEST WIN STREAK (La Racha Imparable)
                const streaks = {}; // { userId: { current: 0, max: 0 } }

                // Sort by date asc
                totalMatches.sort((a, b) => {
                    const da = a.date ? new Date(a.date.toDate ? a.date.toDate() : a.date) : new Date(0);
                    const db = b.date ? new Date(b.date.toDate ? b.date.toDate() : b.date) : new Date(0);
                    return da - db;
                });

                totalMatches.forEach(m => {
                    if (!m.status === 'finished' && !m.finished) return;

                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    if (sA === sB) return; // Draws typically break streaks or are ignored? Let's say break.

                    const winners = sA > sB ? (m.team_a_ids || []) : (m.team_b_ids || []);
                    const losers = sA > sB ? (m.team_b_ids || []) : (m.team_a_ids || []);

                    // Update winners
                    winners.forEach(id => {
                        if (!streaks[id]) streaks[id] = { current: 0, max: 0 };
                        streaks[id].current++;
                        if (streaks[id].current > streaks[id].max) streaks[id].max = streaks[id].current;
                    });

                    // Reset losers
                    losers.forEach(id => {
                        if (!streaks[id]) streaks[id] = { current: 0, max: 0 };
                        streaks[id].current = 0;
                    });
                });

                let maxStreak = { id: null, count: 0 };
                for (const [uid, data] of Object.entries(streaks)) {
                    if (data.max > maxStreak.count) maxStreak = { id: uid, count: data.max };
                }


                // 2. MOST APPARITIONS (El Omnipresente - Maratoniano)
                let mostMatches = { id: null, count: 0 };
                allPlayers.forEach(p => {
                    const m = parseInt(p.matches_played || 0);
                    if (m > mostMatches.count) mostMatches = { id: p.id, count: m };
                });


                // 3. HIGHEST WIN RATE (El Francotirador - Min 10 matches)
                let bestWR = { id: null, wr: 0, matches: 0 };
                allPlayers.forEach(p => {
                    const m = parseInt(p.matches_played || 0);
                    const w = parseInt(p.wins || 0);
                    if (m >= 10) {
                        const wr = (w / m) * 100;
                        if (wr > bestWR.wr) bestWR = { id: p.id, wr: wr, matches: m };
                    }
                });

                // 4. BIGGEST WIN (La Apisonadora)
                let biggestDiff = { id: null, diff: 0, score: '', date: '' };
                totalMatches.forEach(m => {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const diff = Math.abs(sA - sB);
                    if (diff > biggestDiff.diff) {
                        biggestDiff = {
                            diff: diff,
                            score: `${sA}-${sB}`,
                            date: m.date,
                            eventName: m.event_name || 'Partido'
                        };
                    }
                });


                // 5. THE FANATIC (El que más entra/participa)
                // Note: Real App Opens tracking might need a new DB field 'app_opens'. 
                // For now, we use 'matches_played' + a randomness factor or just matches as a proxy for engagement
                // pending real tracking implementation.
                let mostActive = { id: null, count: 0 };
                allPlayers.forEach(p => {
                    // Placeholder logic: most active is often the one with most matches or manual field
                    const visits = parseInt(p.app_opens || p.matches_played || 0);
                    if (visits > mostActive.count) mostActive = { id: p.id, count: visits };
                });

                // Map IDs to Names Robustly
                const getName = (id) => {
                    if (!id) return 'Anónimo';
                    const p = allPlayers.find(u => u.id === id || u.uid === id || (u.name && u.name.toLowerCase() === String(id).toLowerCase()));
                    return p ? p.name : 'Jugador'; // Keep Jugador if truly unknown, but search strictly
                };

                // Helper to generate Deep Analysis Text
                const getDeepAnalysis = (type, rec) => {
                    const name = rec.name === 'Jugador' || rec.name === 'Anónimo' ? 'este jugador' : rec.name;
                    if (!rec.id && type !== 'power' || rec.name === 'Anónimo') return "Aún no hay suficientes datos para generar un análisis detallado. El puesto está vacante.";

                    if (type === 'streak') return `El rendimiento de ${name} ha sido excepcional, logrando encadenar ${rec.count} victorias consecutivas sin ceder ni un solo empate. Esta consistencia bajo presión demuestra una fortaleza mental superior a la media del club.`;

                    if (type === 'matches') return `${name} es el pilar de la comunidad. Con ${rec.count} apariciones oficiales, su compromiso y fidelidad son el motor de Somospadel BCN. Su experiencia en pista es un grado que pocos pueden igualar.`;

                    if (type === 'sniper') return `Eficacia pura. ${name} no juega por jugar, juega para ganar. Mantener un Win Rate del ${rec.wr.toFixed(1)}% tras ${rec.matches} partidos indica una selección de tiro y posicionamiento táctico de nivel élite.`;

                    if (type === 'power') return `Una demostración de fuerza absoluta. El marcador ${rec.score} quedará para la historia como el momento en que la balanza se rompió por completo. Un dominio total del juego aéreo y la red.`;

                    if (type === 'fanatic') return `La pasión de ${name} por el pádel va más allá de la pista. Su interacción constante con la plataforma digital demuestra un interés genuino por mejorar y estar al día de toda la competición.`;

                    return "Análisis generado por IA basado en rendimiento estadístico.";
                };

                // Final Object with DESCRIPTIONS AND DEEP ANALYSIS
                this.state.records = {
                    streak: {
                        ...maxStreak,
                        name: getName(maxStreak.id),
                        title: "La Muralla",
                        icon: "🧱",
                        desc: "Se consigue ganando partidos oficiales de forma ininterrumpida.",
                        deepAnalysis: getDeepAnalysis('streak', { ...maxStreak, name: getName(maxStreak.id) }),
                        color: "#FFD700"
                    },
                    matches: {
                        ...mostMatches,
                        name: getName(mostMatches.id),
                        title: "Maratoniano",
                        icon: "🏃",
                        desc: "Jugador con mayor número de partidos oficiales disputados.",
                        deepAnalysis: getDeepAnalysis('matches', { ...mostMatches, name: getName(mostMatches.id) }),
                        color: "#3b82f6"
                    },
                    sniper: {
                        ...bestWR,
                        name: getName(bestWR.id),
                        title: "El Francotirador",
                        icon: "🎯",
                        desc: "Porcentaje de victorias más letal (min. 10 partidos).",
                        deepAnalysis: getDeepAnalysis('sniper', { ...bestWR, name: getName(bestWR.id) }),
                        color: "#ef4444"
                    },
                    power: {
                        ...biggestDiff,
                        title: "Apisonadora",
                        icon: "🚜",
                        desc: "Mayor diferencia de juegos en un solo partido.",
                        deepAnalysis: getDeepAnalysis('power', biggestDiff),
                        color: "#8b5cf6"
                    },
                    fanatic: {
                        ...mostActive,
                        name: getName(mostActive.id),
                        title: "El Fanático",
                        icon: "📱",
                        desc: "Usuario más fiel y activo en la comunidad digital.",
                        deepAnalysis: getDeepAnalysis('fanatic', { ...mostActive, name: getName(mostActive.id) }),
                        color: "#10b981"
                    }
                };

                console.log("🏆 Records Calculated:", this.state.records);
                if (window.RecordsView) window.RecordsView.render();

            } catch (e) {
                console.error("Error calculating records", e);
            }
        }

        getRecords() {
            return this.state.records;
        }
    }

    window.RecordsController = new RecordsController();
})();
