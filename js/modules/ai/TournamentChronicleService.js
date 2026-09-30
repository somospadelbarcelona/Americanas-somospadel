/**
 * TournamentChronicleService.js
 * 🏆 MOTOR DE CRÓNICAS ÉPICAS Y NARRATIVAS DEPORTIVAS
 * 
 * Generación automática de crónicas post-torneo de alto impacto:
 * - Análisis profundo de partidos, clasificación, podio y MVP de la jornada.
 * - Momentos cumbre: partido más ajustado, la gran muralla defensiva, mayor escalada y racha imparable.
 * - Detección de ascensos a Pista 1, subidas de ELO estimadas y progresión de nivel.
 * - Motor de lenguaje natural procedural deportivo multi-estilo ('epic', 'hype', 'technical').
 * - Formatos listos para WhatsApp (emojis, markdown) e Instagram Stories 9:16.
 * - Modo fallback para eventos en curso o previas con baja latencia y sin dependencias externas.
 * 
 * Compatible con Navegadores (window.TournamentChronicleService) y Node.js (module.exports).
 */

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TournamentChronicleService = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const LOG_PREFIX = '[TournamentChronicleService]';

    /**
     * Vocabulario procedural enriquecido para narrativas deportivas de pádel
     */
    const LEXICON = {
        venues: [
            'las pistas de SomosPádel BCN',
            'el templo del pádel barcelonés',
            'la caldera azul de SomosPádel Barcelona',
            'el recinto de competición de SomosPádel'
        ],
        atmosphere: [
            'el ambiente vibraba con una tensión eléctrica digna de las grandes finales',
            'la adrenalina se respiraba en cada rincón desde el primer peloteo',
            'las gradas improvisadas y los banquillos ardían con el aliento de los compañeros',
            'un clima de pura camaradería y competitividad feroz inundó la jornada'
        ],
        shots: [
            'víboras quirúrgicas pegadas al cristal',
            'remates por cuatro suspendidos en el aire',
            'dejadas sutiles que congelaron el aliento de los rivales',
            'bloqueos reflejos en la red a velocidades de vértigo',
            'bajadas de pared demoledoras buscando el cuerpo y la reja'
        ],
        epics: [
            'escribiendo una página dorada en los anales del club',
            'dejando la piel y el alma en cada punto disputado',
            'desafiando las leyes del agotamiento físico y mental',
            'protagonizando una gesta que será recordada en el tercer tiempo'
        ]
    };

    class TournamentChronicleService {
        constructor() {
            this.version = '1.0.0';
            console.log(`${LOG_PREFIX} Servicio de Crónicas Épicas inicializado v${this.version}`);
        }

        /**
         * Genera la crónica post-torneo completa con analítica avanzada y formato multicanal.
         * 
         * @param {Object} eventDoc - Metadata del evento (title/name, date, type, format, category, etc.)
         * @param {Array} matches - Lista de partidos (ronda, pista, resultados, jugadores, etc.)
         * @param {Object} options - Configuración ({ tone: 'epic'|'hype'|'technical', venue: 'SomosPádel BCN' })
         * @returns {Object} Crónica estructurada con analítica, narrativa, WhatsApp e Instagram Story Data
         */
        generateEpicChronicle(eventDoc = {}, matches = [], options = {}) {
            try {
                console.log(`${LOG_PREFIX} Iniciando generación de crónica para evento: "${eventDoc?.title || eventDoc?.name || 'Torneo Sin Título'}"`);

                const sanitizedEvent = this._sanitizeEvent(eventDoc);
                const rawMatches = Array.isArray(matches) ? matches : [];
                const finishedMatches = rawMatches.filter(m => this._isMatchFinished(m));

                const tone = (options.tone || 'epic').toLowerCase();
                const venue = options.venue || sanitizedEvent.location || 'SomosPádel BCN';

                // Caso de robustez: Si no hay suficientes partidos terminados, generar crónica de previa/anticipatoria
                if (finishedMatches.length < 2) {
                    console.warn(`${LOG_PREFIX} Menos de 2 partidos finalizados (${finishedMatches.length}). Activando generador de previa motivacional.`);
                    return this._generatePreviewChronicle(sanitizedEvent, rawMatches, { tone, venue });
                }

                // 1. Obtener Clasificación y Podio
                const standings = this._resolveStandings(sanitizedEvent, finishedMatches);
                const podium = this._extractPodium(standings);

                // 2. Extraer Estadísticas Clave por Jugador
                const playerStats = this._aggregatePlayerStats(finishedMatches, standings);

                // 3. Identificar MVP de la Jornada
                const mvp = this._calculateMVP(playerStats, standings);

                // 4. Calcular Momentos Cumbre (Epic Highlights)
                const highlights = this._extractHighlights(finishedMatches, playerStats);

                // 5. Calcular Ascensos y Progresión ELO
                const progressions = this._calculateProgressions(playerStats, standings, podium);

                // 6. Generar Narrativa en Múltiples Actos según el Tono
                const narrative = this._composeNarrative({
                    event: sanitizedEvent,
                    finishedMatches,
                    podium,
                    mvp,
                    highlights,
                    progressions,
                    tone,
                    venue
                });

                // 7. Formatear para WhatsApp (emojis y bolding)
                const whatsAppText = this._buildWhatsAppText({
                    event: sanitizedEvent,
                    narrative,
                    podium,
                    mvp,
                    highlights,
                    progressions
                });

                // 8. Construir Estructura de Datos para Instagram Story 9:16
                const instagramStoryData = this._buildInstagramStoryData({
                    event: sanitizedEvent,
                    narrative,
                    podium,
                    mvp,
                    highlights,
                    progressions
                });

                const result = {
                    status: 'success',
                    isFinished: true,
                    meta: {
                        eventId: sanitizedEvent.id || null,
                        title: sanitizedEvent.title,
                        date: sanitizedEvent.formattedDate,
                        type: sanitizedEvent.type,
                        format: sanitizedEvent.format,
                        category: sanitizedEvent.category,
                        totalMatches: finishedMatches.length,
                        totalPlayers: standings.length,
                        tone,
                        generatedAt: new Date().toISOString()
                    },
                    podium,
                    mvp,
                    highlights,
                    progressions,
                    headline: narrative.headline,
                    subheadline: narrative.subheadline,
                    act1_intro: narrative.act1_intro,
                    act2_highlights: narrative.act2_highlights,
                    act3_mvp_ascents: narrative.act3_mvp_ascents,
                    act4_outro: narrative.act4_outro,
                    fullChronicle: narrative.fullChronicle,
                    whatsAppText,
                    instagramStoryData
                };

                console.log(`${LOG_PREFIX} Crónica generada con éxito para "${sanitizedEvent.title}". MVP: ${mvp?.name || 'N/A'}`);
                return result;

            } catch (error) {
                console.error(`${LOG_PREFIX} Error fatal al generar crónica épica:`, error);
                return this._generateErrorFallback(eventDoc, error);
            }
        }

        /**
         * Helper para obtener la URL de compartir directamente en WhatsApp.
         * 
         * @param {Object|string} chronicleOrText - Objeto de crónica o texto formateado
         * @returns {string} URL https://api.whatsapp.com/send?text=...
         */
        getWhatsAppShareUrl(chronicleOrText) {
            let text = '';
            if (typeof chronicleOrText === 'string') {
                text = chronicleOrText;
            } else if (chronicleOrText && typeof chronicleOrText === 'object') {
                text = chronicleOrText.whatsAppText || chronicleOrText.fullChronicle || '';
            }

            const encoded = encodeURIComponent(text.trim());
            return `https://api.whatsapp.com/send?text=${encoded}`;
        }

        /**
         * Helper rápido para integraciones de share y consumo API externo.
         * 
         * @param {Object} eventDoc 
         * @param {Array} matches 
         * @param {Object} options 
         * @returns {Object} Payload unificado con URLs de share y datos clave
         */
        getSharePayload(eventDoc, matches, options = {}) {
            const chronicle = this.generateEpicChronicle(eventDoc, matches, options);
            const whatsAppUrl = this.getWhatsAppShareUrl(chronicle);

            return {
                eventId: eventDoc?.id || null,
                headline: chronicle.headline,
                subheadline: chronicle.subheadline,
                whatsAppUrl,
                whatsAppText: chronicle.whatsAppText,
                storyData: chronicle.instagramStoryData,
                fullChronicle: chronicle.fullChronicle,
                mvp: chronicle.mvp,
                podium: chronicle.podium,
                generatedAt: chronicle.meta?.generatedAt || new Date().toISOString()
            };
        }

        // =========================================================================
        // MÉTODOS INTERNOS: ANALÍTICA, PODIO, MVP Y MOMENTOS CUMBRE
        // =========================================================================

        _sanitizeEvent(eventDoc = {}) {
            const rawDate = eventDoc.date || eventDoc.eventDate || eventDoc.createdAt || new Date();
            let formattedDate = '';
            try {
                if (typeof rawDate === 'string') {
                    formattedDate = rawDate;
                } else if (rawDate?.toDate && typeof rawDate.toDate === 'function') {
                    formattedDate = rawDate.toDate().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                } else if (rawDate instanceof Date) {
                    formattedDate = rawDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                } else {
                    formattedDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                }
            } catch (e) {
                formattedDate = new Date().toLocaleDateString('es-ES');
            }

            const rawType = String(eventDoc.type || eventDoc.eventType || 'americana').toLowerCase();
            const type = rawType.includes('entreno') ? 'entreno' : 'americana';

            let format = 'twister';
            const rawFormat = String(eventDoc.format || eventDoc.mode || '').toLowerCase();
            if (rawFormat.includes('fij') || rawFormat.includes('fixed') || eventDoc.isFixedPairs) {
                format = 'pareja fija';
            } else if (rawFormat.includes('suiz') || rawFormat.includes('swiss') || eventDoc.isSwiss) {
                format = 'suizo';
            }

            const category = eventDoc.category || eventDoc.level || eventDoc.nivel || 'Abierto / General';
            const title = eventDoc.title || eventDoc.name || `Americana SomosPádel - ${category}`;

            return {
                id: eventDoc.id || null,
                title,
                rawDate,
                formattedDate,
                type,
                format,
                category,
                location: eventDoc.location || 'SomosPádel BCN (Barcelona)',
                players: Array.isArray(eventDoc.players) ? eventDoc.players : (eventDoc.confirmed_players || [])
            };
        }

        _isMatchFinished(match) {
            if (!match) return false;
            if (match.status === 'finished' || match.status === 'completed') return true;
            const scoreA = parseInt(match.score_a ?? match.scoreA ?? 0, 10);
            const scoreB = parseInt(match.score_b ?? match.scoreB ?? 0, 10);
            return (scoreA + scoreB) > 0;
        }

        _resolveStandings(event, matches) {
            // Intentar utilizar window.StandingsService si está en navegador y disponible
            if (typeof window !== 'undefined' && window.StandingsService && typeof window.StandingsService.calculate === 'function') {
                try {
                    const isFixedPairs = event.format === 'pareja fija';
                    const isSwiss = event.format === 'suizo';
                    const list = window.StandingsService.calculate(
                        matches,
                        event.type,
                        isFixedPairs,
                        event.players || [],
                        isSwiss
                    );
                    if (Array.isArray(list) && list.length > 0) {
                        return list;
                    }
                } catch (e) {
                    console.warn(`${LOG_PREFIX} Excepción usando window.StandingsService, recurriendo a fallback interno:`, e);
                }
            }

            return this._calculateStandingsFallback(matches, event);
        }

        _calculateStandingsFallback(matches, event) {
            const table = {};
            const keyMap = {};

            const ensurePlayer = (identifier, displayName, fallbackId) => {
                const rawName = String(displayName || identifier || 'anon').trim();
                const resolvedKey = keyMap[rawName] || keyMap[String(identifier).trim()] || rawName;

                if (!table[resolvedKey]) {
                    table[resolvedKey] = {
                        id: fallbackId || identifier || resolvedKey,
                        name: rawName,
                        points: 0,
                        gamesLost: 0,
                        diff: 0,
                        matchesPlayed: 0,
                        won: 0,
                        lost: 0,
                        draw: 0,
                        court1Count: 0,
                        bestCourt: 99
                    };
                    keyMap[resolvedKey] = resolvedKey;
                    keyMap[rawName] = resolvedKey;
                    if (identifier) keyMap[String(identifier).trim()] = resolvedKey;
                    if (fallbackId) keyMap[String(fallbackId).trim()] = resolvedKey;
                }
                return table[resolvedKey];
            };

            // Pre-poblar jugadores si existen
            if (Array.isArray(event.players)) {
                event.players.forEach(p => {
                    const pid = p.uid || p.id || p.name;
                    const pname = p.name || p.displayName || pid;
                    if (pname || pid) ensurePlayer(pid, pname, pid);
                });
            }

            matches.forEach(m => {
                const scoreA = parseInt(m.score_a ?? m.scoreA ?? 0, 10);
                const scoreB = parseInt(m.score_b ?? m.scoreB ?? 0, 10);
                const courtNum = parseInt(m.court || 99, 10);

                const teamANames = this._extractNamesList(m.team_a_names || m.team_a || m.pair_a_name);
                const teamBNames = this._extractNamesList(m.team_b_names || m.team_b || m.pair_b_name);

                const applyScore = (names, scoreOwn, scoreRival) => {
                    names.forEach(name => {
                        const rec = ensurePlayer(name, name);
                        rec.matchesPlayed += 1;
                        rec.points += scoreOwn;
                        rec.gamesLost += scoreRival;
                        rec.diff = rec.points - rec.gamesLost;

                        if (scoreOwn > scoreRival) rec.won += 1;
                        else if (scoreOwn < scoreRival) rec.lost += 1;
                        else rec.draw += 1;

                        if (courtNum === 1) rec.court1Count += 1;
                        if (courtNum < rec.bestCourt) rec.bestCourt = courtNum;
                    });
                };

                applyScore(teamANames, scoreA, scoreB);
                applyScore(teamBNames, scoreB, scoreA);
            });

            const list = Object.values(table);
            // Si hay jugadores con partidos jugados, descartar los fantasmas de 0 partidos pre-poblados con keys disjuntas
            const activeList = list.filter(p => p.matchesPlayed > 0);
            const finalList = activeList.length > 0 ? activeList : list;

            return finalList.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.diff !== a.diff) return b.diff - a.diff;
                if (b.won !== a.won) return b.won - a.won;
                return a.gamesLost - b.gamesLost;
            });
        }

        _extractNamesList(raw) {
            if (!raw) return [];
            if (Array.isArray(raw)) {
                return raw.map(s => String(s).trim()).filter(Boolean);
            }
            if (typeof raw === 'string') {
                return raw.split(/[/,&+y-]/)
                    .map(s => s.trim())
                    .filter(Boolean);
            }
            return [String(raw)];
        }

        _extractPodium(standings = []) {
            const getParticipant = (index, badge, label) => {
                const p = standings[index];
                if (!p) {
                    return {
                        place: index + 1,
                        name: `Aspirante ${index + 1}`,
                        badge,
                        label,
                        points: 0,
                        won: 0,
                        matchesPlayed: 0
                    };
                }
                return {
                    place: index + 1,
                    id: p.id || p.uid,
                    name: p.name || `Jugador ${index + 1}`,
                    badge,
                    label,
                    points: p.points || 0,
                    gamesLost: p.gamesLost || 0,
                    diff: p.diff || 0,
                    won: p.won || 0,
                    matchesPlayed: p.matchesPlayed || (p.won + p.lost + p.draw) || 0
                };
            };

            return [
                getParticipant(0, '🥇', 'Campeón de la Jornada'),
                getParticipant(1, '🥈', 'Subcampeón'),
                getParticipant(2, '🥉', 'Tercer Puesto')
            ];
        }

        _aggregatePlayerStats(matches, standings) {
            const stats = {};

            // Inicializar con la lista de standings si existen
            standings.forEach(s => {
                const pName = String(s.name || s.id || '').trim();
                if (pName) {
                    stats[pName] = {
                        name: pName,
                        id: s.id || s.uid || pName,
                        points: 0,
                        gamesLost: 0,
                        diff: 0,
                        won: 0,
                        lost: 0,
                        draw: 0,
                        matchesPlayed: 0,
                        court1Wins: 0,
                        court1Matches: 0,
                        courtsHistory: [],
                        matchResults: [] // { round, court, won, scoreOwn, scoreRival }
                    };
                }
            });

            // Ordenar partidos por ronda
            const sortedMatches = [...matches].sort((a, b) => parseInt(a.round || 0, 10) - parseInt(b.round || 0, 10));

            sortedMatches.forEach(m => {
                const scoreA = parseInt(m.score_a ?? m.scoreA ?? 0, 10);
                const scoreB = parseInt(m.score_b ?? m.scoreB ?? 0, 10);
                const court = parseInt(m.court || 99, 10);
                const round = parseInt(m.round || 1, 10);

                const teamANames = this._extractNamesList(m.team_a_names || m.team_a || m.pair_a_name);
                const teamBNames = this._extractNamesList(m.team_b_names || m.team_b || m.pair_b_name);

                const recordForTeam = (names, ownScore, rivalScore) => {
                    const isWin = ownScore > rivalScore;
                    const isDraw = ownScore === rivalScore && ownScore > 0;
                    names.forEach(name => {
                        const trimmedName = String(name).trim();
                        if (!stats[trimmedName]) {
                            stats[trimmedName] = {
                                name: trimmedName,
                                id: trimmedName,
                                points: 0,
                                gamesLost: 0,
                                diff: 0,
                                won: 0,
                                lost: 0,
                                draw: 0,
                                matchesPlayed: 0,
                                court1Wins: 0,
                                court1Matches: 0,
                                courtsHistory: [],
                                matchResults: []
                            };
                        }
                        const p = stats[trimmedName];
                        p.matchesPlayed += 1;
                        p.points += ownScore;
                        p.gamesLost += rivalScore;
                        p.diff = p.points - p.gamesLost;

                        if (isWin) p.won += 1;
                        else if (isDraw) p.draw += 1;
                        else p.lost += 1;

                        p.courtsHistory.push({ round, court });
                        p.matchResults.push({ round, court, won: isWin, ownScore, rivalScore });

                        if (court === 1) {
                            p.court1Matches += 1;
                            if (isWin) p.court1Wins += 1;
                        }
                    });
                };

                recordForTeam(teamANames, scoreA, scoreB);
                recordForTeam(teamBNames, scoreB, scoreA);
            });

            return stats;
        }

        _calculateMVP(playerStats, standings) {
            const players = Object.values(playerStats);
            if (players.length === 0) {
                return {
                    name: standings[0]?.name || 'Jugador Revelación',
                    impactScore: 100,
                    points: 0,
                    won: 0,
                    winRatePercent: 100,
                    court1Wins: 0,
                    reason: 'Líder de la clasificación general'
                };
            }

            let bestPlayer = null;
            let maxImpact = -Infinity;

            players.forEach(p => {
                const total = p.matchesPlayed || 1;
                const winRate = (p.won / total);
                
                // Fórmula de Impacto Ponderado:
                // Puntos ganados (x2) + Partidos ganados (x12) + Ratio victorias (x25) + Victorias en Pista 1 (x10) + Partidos Pista 1 (x3) + Diferencial positivo
                const impact = (p.points * 2) + 
                               (p.won * 12) + 
                               (winRate * 25) + 
                               (p.court1Wins * 10) + 
                               (p.court1Matches * 3) + 
                               Math.max(0, p.diff * 0.5);

                if (impact > maxImpact) {
                    maxImpact = impact;
                    bestPlayer = {
                        name: p.name,
                        impactScore: Math.round(impact),
                        points: p.points,
                        gamesLost: p.gamesLost,
                        diff: p.diff,
                        won: p.won,
                        matchesPlayed: p.matchesPlayed,
                        winRatePercent: Math.round(winRate * 100),
                        court1Wins: p.court1Wins,
                        court1Matches: p.court1Matches
                    };
                }
            });

            // Si por alguna razón no se encontró, fallback al 1º del standing
            if (!bestPlayer && standings[0]) {
                bestPlayer = {
                    name: standings[0].name,
                    impactScore: 95,
                    points: standings[0].points || 0,
                    gamesLost: standings[0].gamesLost || 0,
                    diff: standings[0].diff || 0,
                    won: standings[0].won || 0,
                    matchesPlayed: standings[0].matchesPlayed || 0,
                    winRatePercent: 100,
                    court1Wins: standings[0].court1Count || 0,
                    court1Matches: standings[0].court1Count || 0
                };
            }

            return bestPlayer;
        }

        _extractHighlights(matches, playerStats) {
            // 1. El Partido Más Ajustado
            let closestMatch = null;
            let minDiff = Infinity;
            let maxTotalGames = -1;

            matches.forEach(m => {
                const scoreA = parseInt(m.score_a ?? m.scoreA ?? 0, 10);
                const scoreB = parseInt(m.score_b ?? m.scoreB ?? 0, 10);
                const total = scoreA + scoreB;
                const diff = Math.abs(scoreA - scoreB);

                const teamANames = this._extractNamesList(m.team_a_names || m.team_a || m.pair_a_name).join(' & ') || 'Pareja A';
                const teamBNames = this._extractNamesList(m.team_b_names || m.team_b || m.pair_b_name).join(' & ') || 'Pareja B';

                if (diff < minDiff || (diff === minDiff && total > maxTotalGames)) {
                    minDiff = diff;
                    maxTotalGames = total;
                    closestMatch = {
                        round: parseInt(m.round || 1, 10),
                        court: parseInt(m.court || 1, 10),
                        teamA: teamANames,
                        teamB: teamBNames,
                        scoreA,
                        scoreB,
                        diff,
                        scoreString: `${scoreA}-${scoreB}`,
                        summary: `${teamANames} (${scoreA}) vs ${teamBNames} (${scoreB}) en Pista ${m.court || 1}`
                    };
                }
            });

            // 2. La Gran Muralla (jugador con menos juegos encajados por partido, mínimo 2 partidos)
            let bestDefense = null;
            let lowestAvgLost = Infinity;

            Object.values(playerStats).forEach(p => {
                const matchesCount = p.matchesPlayed || (p.won + p.lost + p.draw) || 0;
                if (matchesCount >= 2) {
                    const avgLost = p.gamesLost / matchesCount;
                    if (avgLost < lowestAvgLost) {
                        lowestAvgLost = avgLost;
                        bestDefense = {
                            name: p.name,
                            totalGamesLost: p.gamesLost,
                            matchesPlayed: matchesCount,
                            avgLostPerMatch: parseFloat(avgLost.toFixed(2)),
                            badge: '🛡️ La Gran Muralla'
                        };
                    }
                }
            });

            // Fallback si ningún jugador tiene >=2 partidos
            if (!bestDefense && Object.values(playerStats)[0]) {
                const p = Object.values(playerStats)[0];
                bestDefense = {
                    name: p.name,
                    totalGamesLost: p.gamesLost,
                    matchesPlayed: p.matchesPlayed || 1,
                    avgLostPerMatch: parseFloat((p.gamesLost / (p.matchesPlayed || 1)).toFixed(2)),
                    badge: '🛡️ La Gran Muralla'
                };
            }

            // 3. La Mayor Escalada (empezó en pista baja y subió hacia Pista 1)
            let biggestClimber = null;
            let maxClimb = 0;

            Object.values(playerStats).forEach(p => {
                if (p.courtsHistory && p.courtsHistory.length > 1) {
                    const firstCourt = p.courtsHistory[0].court;
                    const bestCourtReached = Math.min(...p.courtsHistory.map(c => c.court));
                    const climb = firstCourt - bestCourtReached; // ej. Empezó en pista 4 y llegó a 1 => 4 - 1 = +3 pistas subidas

                    if (climb > maxClimb) {
                        maxClimb = climb;
                        biggestClimber = {
                            name: p.name,
                            initialCourt: firstCourt,
                            finalCourt: bestCourtReached,
                            climbAmount: climb,
                            reachedCourt1: bestCourtReached === 1,
                            description: `Empezó en Pista ${firstCourt} y escaló ${climb} pista(s) hasta Pista ${bestCourtReached}`
                        };
                    }
                }
            });

            // Si no hay escalada por pistas (ej. torneo suizo o parejas fijas en pistas fijas), buscar remontada por resultados
            if (!biggestClimber) {
                let comebackPlayer = null;
                Object.values(playerStats).forEach(p => {
                    if (p.matchResults && p.matchResults.length >= 2) {
                        // Perdió el primero y luego ganó los siguientes
                        if (!p.matchResults[0].won && p.matchResults.slice(1).every(m => m.won)) {
                            comebackPlayer = {
                                name: p.name,
                                climbAmount: p.matchResults.length - 1,
                                reachedCourt1: false,
                                description: `Remontó el revés inicial encadenando ${p.matchResults.length - 1} triunfos consecutivos`
                            };
                        }
                    }
                });
                biggestClimber = comebackPlayer || {
                    name: Object.values(playerStats)[0]?.name || 'Espíritu de Lucha',
                    climbAmount: 0,
                    reachedCourt1: false,
                    description: 'Constancia y regularidad en cada cruce'
                };
            }

            // 4. Racha Imparable (jugador con mayor número de partidos consecutivos ganados)
            let longestStreak = { name: '', streak: 0, isInvictus: false };

            Object.values(playerStats).forEach(p => {
                let currentStreak = 0;
                let maxStreak = 0;

                (p.matchResults || []).forEach(m => {
                    if (m.won) {
                        currentStreak += 1;
                        if (currentStreak > maxStreak) maxStreak = currentStreak;
                    } else {
                        currentStreak = 0;
                    }
                });

                const isInvictus = p.lost === 0 && p.won > 0;
                if (maxStreak > longestStreak.streak || (maxStreak === longestStreak.streak && isInvictus)) {
                    longestStreak = {
                        name: p.name,
                        streak: maxStreak,
                        isInvictus,
                        description: isInvictus 
                            ? `¡Invicto con ${p.won} victorias consecutivas sin conocer la derrota!`
                            : `Racha prodigiosa de ${maxStreak} victorias consecutivas`
                    };
                }
            });

            return {
                closestMatch,
                bestDefense,
                biggestClimber,
                longestStreak
            };
        }

        _calculateProgressions(playerStats, standings, podium) {
            const court1Ascents = [];
            const eloGainList = [];
            const categoryPromotions = [];

            const championName = podium[0]?.name;

            Object.values(playerStats).forEach(p => {
                // Ascensos a Pista 1
                const playedInC1 = p.court1Matches > 0;
                const startedOutsideC1 = p.courtsHistory?.length > 0 && p.courtsHistory[0].court > 1;
                
                if (playedInC1 && startedOutsideC1) {
                    court1Ascents.push({
                        name: p.name,
                        court1Wins: p.court1Wins,
                        title: `Ascenso consagrado a Pista 1 (${p.court1Wins}V)`
                    });
                }

                // Cálculo de ELO Estimado (+15 a +50)
                let eloGain = 15; // base de participación
                const winRate = p.matchesPlayed > 0 ? (p.won / p.matchesPlayed) : 0;

                if (p.name === championName) {
                    eloGain = 50; // Corona de campeón
                } else if (p.name === podium[1]?.name) {
                    eloGain = 40; // Subcampeón
                } else if (p.name === podium[2]?.name) {
                    eloGain = 32; // 3º puesto
                } else if (winRate >= 0.75) {
                    eloGain = 30;
                } else if (winRate >= 0.5) {
                    eloGain = 22;
                } else {
                    eloGain = 16;
                }

                eloGainList.push({
                    name: p.name,
                    gain: `+${eloGain} pts`,
                    rawGain: eloGain,
                    winRate: `${Math.round(winRate * 100)}%`
                });

                // Candidatos al ascenso de categoría
                if ((p.name === championName && winRate >= 0.75) || (p.won >= 3 && p.lost === 0)) {
                    categoryPromotions.push({
                        name: p.name,
                        reason: 'Dominio categórico e invicto durante toda la competición',
                        recommendation: '⭐ Ascenso de Nivel Recomendado'
                    });
                }
            });

            // Ordenar lista de elo
            eloGainList.sort((a, b) => b.rawGain - a.rawGain);

            return {
                court1Ascents,
                eloGainList: eloGainList.slice(0, 5), // TOP 5 subidas
                categoryPromotions
            };
        }

        // =========================================================================
        // MOTOR NARRATIVO PROCEDURAL (EPIC, HYPE, TECHNICAL)
        // =========================================================================

        _composeNarrative({ event, finishedMatches, podium, mvp, highlights, progressions, tone, venue }) {
            const champ = podium[0]?.name || 'El Campeón';
            const runnerUp = podium[1]?.name || 'El Subcampeón';
            const third = podium[2]?.name || 'Tercer Puesto';
            const mvpName = mvp?.name || champ;

            // Determinar titulares según tono
            let headline = '';
            let subheadline = '';

            if (tone === 'hype') {
                headline = `¡LOCURA ABSOLUTA EN SOMOSPÁDEL! ${mvpName.toUpperCase()} REVIENTA EL CUADRO Y SE LLEVA LA GLORIA 🔥`;
                subheadline = `Jornada no apta para cardíacos en Barcelona: ${finishedMatches.length} partidazos, remontadas salvajes y un MVP desatado.`;
            } else if (tone === 'technical') {
                headline = `REPORTE TÁCTICO: ${champ.toUpperCase()} Y ${mvpName.toUpperCase()} DOMINAN LA JORNADA EN ${venue.toUpperCase()}`;
                subheadline = `Análisis de rendimiento competitivo tras ${finishedMatches.length} partidos oficiales en formato ${event.format}.`;
            } else {
                // 'epic' (por defecto)
                headline = `¡ÉPICA TOTAL EN ${venue.toUpperCase()}! ${champ.toUpperCase()} TOCA EL CIELO TRAS UNA BATALLA LEGENDARIA 🎾`;
                subheadline = `La arena de SomosPádel fue testigo de un espectáculo memorable donde ${mvpName} lideró la rebelión de las palas.`;
            }

            // Acto 1: Introducción y Ambiente
            let act1_intro = '';
            if (tone === 'hype') {
                act1_intro = `El ambiente en ${venue} era de pura locura desde las primeras rondas. Con la categoría ${event.category} en juego y el formato ${event.format} listo para poner a prueba la química y los reflejos, los jugadores saltaron a pista con el cuchillo entre los dientes. Ni un respiro, ni una bola regalada: Barcelona fue una auténtica caldera de pádel non-stop.`;
            } else if (tone === 'technical') {
                act1_intro = `La cita competitiva en ${venue} reunió a jugadores de nivel ${event.category} bajo la modalidad de ${event.format}. Desde los compases iniciales, se evidenció una alta exigencia en la transición defensa-ataque, con un volumen de juego constante y una distribución estratégica enfocada en castigar la reja y ganar la red en velocidad.`;
            } else {
                // epic
                act1_intro = `Bajo el cielo de Barcelona, ${venue} se vistió de gala para acoger una jornada destinada a grabarse en la memoria de la comunidad. Las palas relucían, los latidos se aceleraban y en cada mirada se adivinaba el hambre de gloria. La categoría ${event.category} no concedió tregua alguna: el formato ${event.format} exigió la máxima comunión entre técnica, corazón y resistencia sobre el tapete azul.`;
            }

            // Acto 2: Momentos Cumbre (Highlights)
            let act2_highlights = '';
            const cMatch = highlights.closestMatch;
            const bDef = highlights.bestDefense;
            const cClimb = highlights.biggestClimber;
            const sStreak = highlights.longestStreak;

            const cMatchTxt = cMatch
                ? `El partido más vibrante se desató en la Ronda ${cMatch.round} (Pista ${cMatch.court}), donde un asombroso ${cMatch.scoreString} entre ${cMatch.teamA} y ${cMatch.teamB} forzó un desenlace agónico al filo del reglamento.`
                : `Los marcadores reflejaron una igualdad asombrosa en cada cancha con definiciones decididas por detalles mínimos.`;

            const bDefTxt = bDef
                ? `En defensa, emergió la figura de ${bDef.name} ("La Gran Muralla"), concediendo un promedio insólito de apenas ${bDef.avgLostPerMatch} juegos por partido.`
                : '';

            const cClimbTxt = cClimb && cClimb.climbAmount > 0
                ? `La mayor proeza de superación la firmó ${cClimb.name}, ${cClimb.description}.`
                : '';

            const sStreakTxt = sStreak && sStreak.streak > 1
                ? `${sStreak.name} impuso su ley encadenando una racha prodigiosa de ${sStreak.streak} victorias consecutivas.`
                : '';

            if (tone === 'hype') {
                act2_highlights = `🔥 ¡QUÉ AUTÉNTICA BARBARIDAD DE PUNTOS! ${cMatchTxt} Nadie aflojó un milímetro. ${bDefTxt} Por si fuera poco, ${cClimbTxt} ${sStreakTxt} ¡El ritmo fue frenético de principio a fin!`;
            } else if (tone === 'technical') {
                act2_highlights = `En el desglose táctico de los cruces: ${cMatchTxt} La solidez defensiva quedó refrendada por ${bDefTxt} Asimismo, el factor resiliencia y adaptabilidad lo personificó ${cClimbTxt} ${sStreakTxt}`;
            } else {
                // epic
                act2_highlights = `Las cuatro esquinas de la pista fueron testigo de intercambios antológicos. ${cMatchTxt} Cuando las piernas pesaban, la voluntad se impuso al cansancio: ${bDefTxt} Mientras tanto, ${cClimbTxt} y ${sStreakTxt} sellando una gesta que levantó el aplauso unánime del recinto.`;
            }

            // Acto 3: MVP y Ascensos
            let act3_mvp_ascents = '';
            const ascentsList = progressions.court1Ascents.length > 0
                ? `Conquistas a Pista 1: ${progressions.court1Ascents.map(a => `${a.name} (${a.court1Wins}V en la central)`).join(', ')}.`
                : 'La batalla por la Pista 1 mantuvo un nivel colosal durante toda la rotación.';

            const promoTxt = progressions.categoryPromotions.length > 0
                ? `⭐ Mención Especial de Ascenso: ${progressions.categoryPromotions.map(p => `${p.name} (${p.reason})`).join(', ')}.`
                : '';

            if (tone === 'hype') {
                act3_mvp_ascents = `👑 Y EL REY DE LA PISTA ES... ¡${mvpName.toUpperCase()}! Coronado como MVP con ${mvp.points} puntos anotados y un bestial ${mvp.winRatePercent}% de victorias. En el podio de honor le acompañan ${champ} como campeón estelar, ${runnerUp} en el subcampeonato y ${third} completando la terna de héroes. ${ascentsList} ${promoTxt} ¡Subidón masivo de ELO para todos!`;
            } else if (tone === 'technical') {
                act3_mvp_ascents = `El índice de impacto global condecora a ${mvpName} como MVP absoluto (${mvp.points} juegos ganados, ratio ${mvp.winRatePercent}% de efectividad y ${mvp.court1Wins} triunfos en Pista 1). El cuadro de honor oficial queda establecido con 1º ${champ}, 2º ${runnerUp} y 3º ${third}. En el apartado de evolución de ranking: ${ascentsList} ${promoTxt}`;
            } else {
                // epic
                act3_mvp_ascents = `El laurel de MVP de la jornada es para ${mvpName}, faro indiscutible y líder espiritual en la pista con ${mvp.points} juegos en su casillero y un admirable ${mvp.winRatePercent}% de efectividad en los momentos decisivos. La gloria del podio corona con honores a ${champ} (1º), ${runnerUp} (2º) y ${third} (3º). ${ascentsList} ${promoTxt} El esfuerzo colectivo ha sido recompensado con valiosos puntos de prestigio y ELO.`;
            }

            // Acto 4: Outro y Cierre
            let act4_outro = '';
            if (tone === 'hype') {
                act4_outro = `¡Gracias a toda la familia de SomosPádel BCN por convertir esta jornada en una fiesta inolvidable! El tercer tiempo estuvo a la altura del torneo: risas, cervezas y ya contando las horas para la próxima revancha. ¡Nos vemos en el 20x10! 🚀🎾`;
            } else if (tone === 'technical') {
                act4_outro = `Concluye una nueva jornada de análisis y competición de alto calibre en SomosPádel BCN. Felicitaciones a todos los participantes por la disciplina técnica y deportividad mostradas. Las tablas de ranking y ELO quedan actualizadas para las próximas convocatorias.`;
            } else {
                // epic
                act4_outro = `Cae el telón en SomosPádel BCN, pero el eco de los remates y el espíritu de superación permanecerán intactos. Gracias a cada jugador y jugadora por engrandecer este deporte y demostrar que la pasión no tiene límites. Nos encontramos muy pronto en la próxima batalla sobre el cristal. ¡Larga vida al pádel! 🏆`;
            }

            const fullChronicle = `${headline}\n\n${subheadline}\n\n${act1_intro}\n\n${act2_highlights}\n\n${act3_mvp_ascents}\n\n${act4_outro}`;

            return {
                headline,
                subheadline,
                act1_intro,
                act2_highlights,
                act3_mvp_ascents,
                act4_outro,
                fullChronicle
            };
        }

        // =========================================================================
        // FORMATOS DE SALIDA: WHATSAPP E INSTAGRAM STORY
        // =========================================================================

        _buildWhatsAppText({ event, narrative, podium, mvp, highlights, progressions }) {
            const dateStr = event.formattedDate || 'Hoy';
            const champ = podium[0]?.name || 'Campeón';
            const runnerUp = podium[1]?.name || 'Subcampeón';
            const third = podium[2]?.name || 'Tercer Puesto';

            const cMatch = highlights.closestMatch;
            const bDef = highlights.bestDefense;
            const cClimb = highlights.biggestClimber;

            let cMatchLine = '';
            if (cMatch) {
                cMatchLine = `• *Partido Épico:* ${cMatch.scoreString} (${cMatch.teamA} vs ${cMatch.teamB}) en P1\n`;
            }

            let defLine = '';
            if (bDef) {
                defLine = `• *La Gran Muralla:* ${bDef.name} (${bDef.avgLostPerMatch} juegos encajados/partido)\n`;
            }

            let climbLine = '';
            if (cClimb && cClimb.climbAmount > 0) {
                climbLine = `• *Mayor Escalada:* ${cClimb.name} (${cClimb.description})\n`;
            }

            let eloLines = '';
            if (progressions.eloGainList && progressions.eloGainList.length > 0) {
                eloLines = progressions.eloGainList.slice(0, 3)
                    .map(e => `📈 *${e.name}:* ${e.gain} (${e.winRate} victorias)`)
                    .join('\n');
            }

            return `🎾 *SOMOSPÁDEL BCN - CRÓNICA POST-TORNEO* 🏆\n` +
                   `_${event.title}_\n\n` +
                   `📢 *${narrative.headline}*\n\n` +
                   `📅 *Fecha:* ${dateStr}\n` +
                   `📍 *Lugar:* ${event.location}\n` +
                   `⚔️ *Modalidad:* ${event.type.toUpperCase()} (${event.format}) | Cat: ${event.category}\n\n` +
                   `👑 *MVP DE LA JORNADA:* \n` +
                   `⭐ *${mvp?.name || champ}* (${mvp?.points || 0} pts | ${mvp?.winRatePercent || 100}% victorias | ${mvp?.court1Wins || 0}V en Pista 1)\n\n` +
                   `🏆 *PODIO DE HONOR:*\n` +
                   `🥇 1º ${champ} (${podium[0]?.points || 0} pts)\n` +
                   `🥈 2º ${runnerUp} (${podium[1]?.points || 0} pts)\n` +
                   `🥉 3º ${third} (${podium[2]?.points || 0} pts)\n\n` +
                   `🔥 *MOMENTOS CUMBRE:*\n` +
                   `${cMatchLine}${defLine}${climbLine}\n` +
                   `⚡ *SUBIDAS ESTIMADAS DE ELO:*\n` +
                   `${eloLines}\n\n` +
                   `💬 *RESUMEN:*\n` +
                   `"${narrative.subheadline}"\n\n` +
                   `¡Enhorabuena a todos los participantes y gracias por formar parte de esta gran comunidad! 🍻🙌\n\n` +
                   `#SomosPadelBCN #PadelBarcelona #AmericanasPadel #PadelVibes`;
        }

        _buildInstagramStoryData({ event, narrative, podium, mvp, highlights, progressions }) {
            const champ = podium[0]?.name || 'Campeón';
            const cMatch = highlights.closestMatch;

            return {
                ratio: '9:16',
                eventTitle: event.title,
                date: event.formattedDate,
                category: event.category,
                headline: narrative.headline,
                shortTitle: `¡${champ.toUpperCase()} CAMPEÓN!`,
                podium: [
                    { place: 1, name: champ, badge: '🥇 1º', points: podium[0]?.points || 0 },
                    { place: 2, name: podium[1]?.name || 'Subcampeón', badge: '🥈 2º', points: podium[1]?.points || 0 },
                    { place: 3, name: podium[2]?.name || 'Tercer Puesto', badge: '🥉 3º', points: podium[2]?.points || 0 }
                ],
                mvp: {
                    name: mvp?.name || champ,
                    badge: '👑 MVP DE LA JORNADA',
                    stats: `${mvp?.points || 0} pts | ${mvp?.winRatePercent || 100}% V | ${mvp?.court1Wins || 0} P1`,
                    impactScore: mvp?.impactScore || 99
                },
                epicStat: cMatch 
                    ? `Batalla Épica: ${cMatch.scoreString} en Pista ${cMatch.court}`
                    : `Intensidad Absoluta en ${event.title}`,
                bestDefense: highlights.bestDefense?.name || null,
                climber: highlights.biggestClimber?.name || null,
                topElo: progressions.eloGainList?.[0] 
                    ? `${progressions.eloGainList[0].name} (${progressions.eloGainList[0].gain})`
                    : null,
                summaryPill: narrative.subheadline,
                hashtags: ['#SomosPadelBCN', '#PadelBarcelona', '#AmericanasPadel', '#PadelTorneo']
            };
        }

        // =========================================================================
        // FALLBACK: PREVIA MOTIVACIONAL Y MANEJO DE ERRORES
        // =========================================================================

        _generatePreviewChronicle(event, matches, { tone, venue }) {
            const headline = `¡LA BATALLA ESTÁ SERVIDA EN ${venue.toUpperCase()}! 🔥`;
            const subheadline = `Todo listo para una jornada electrizante de ${event.type} en la categoría ${event.category}.`;
            const act1_intro = `Las palas están afiladas y el ambiente en ${venue} empieza a caldearse. Los jugadores convocados afinan sus mejores golpes en el calentamiento antes del pitido inicial de este torneo en formato ${event.format}.`;
            const act2_highlights = `Se prevén duelos de alta intensidad en cada pista, donde la regularidad, la frialdad en los puntos de oro y la estrategia dictarán quién conquista la codiciada Pista 1.`;
            const act3_mvp_ascents = `Los aspirantes ya velan armas para luchar por la corona de MVP y conseguir valiosos puntos de ELO en el ranking oficial de SomosPádel BCN.`;
            const act4_outro = `¡Que empiece el espectáculo! Permanece atento a las actualizaciones en directo y apoya a tus compañeros. ¡A por todas! 🎾💪`;

            const fullChronicle = `${headline}\n\n${subheadline}\n\n${act1_intro}\n\n${act2_highlights}\n\n${act3_mvp_ascents}\n\n${act4_outro}`;

            const whatsAppText = `🎾 *PREVIA OFICIAL - SOMOSPÁDEL BCN* 🏆\n` +
                                 `_${event.title}_\n\n` +
                                 `🔥 *${headline}*\n\n` +
                                 `📅 *Fecha:* ${event.formattedDate}\n` +
                                 `📍 *Lugar:* ${venue}\n` +
                                 `⚔️ *Modalidad:* ${event.type.toUpperCase()} (${event.format})\n` +
                                 `🎯 *Categoría:* ${event.category}\n\n` +
                                 `¡Las pistas están que arden y el torneo está a punto de decidirse! Síguelo en directo en SomosPádel.\n\n` +
                                 `#SomosPadelBCN #PadelBarcelona #AmericanasPadel`;

            return {
                status: 'preview',
                isFinished: false,
                meta: {
                    eventId: event.id,
                    title: event.title,
                    date: event.formattedDate,
                    totalMatches: matches.length,
                    tone,
                    generatedAt: new Date().toISOString()
                },
                podium: [],
                mvp: null,
                highlights: null,
                progressions: null,
                headline,
                subheadline,
                act1_intro,
                act2_highlights,
                act3_mvp_ascents,
                act4_outro,
                fullChronicle,
                whatsAppText,
                instagramStoryData: {
                    ratio: '9:16',
                    eventTitle: event.title,
                    headline,
                    summaryPill: subheadline,
                    hashtags: ['#SomosPadelBCN', '#PadelBarcelona']
                }
            };
        }

        _generateErrorFallback(eventDoc, error) {
            const title = eventDoc?.title || eventDoc?.name || 'Torneo SomosPádel';
            return {
                status: 'error',
                error: error.message || 'Error inesperado',
                headline: `RESUMEN DE JORNADA - ${title.toUpperCase()}`,
                subheadline: 'Partidos disputados en SomosPádel BCN.',
                fullChronicle: `Torneo completado con éxito en SomosPádel BCN. Gran jornada de pádel y deportividad entre todos los participantes.`,
                whatsAppText: `🎾 *SOMOSPÁDEL BCN* 🏆\nTorneo: ${title}\n¡Gran jornada de pádel! #SomosPadelBCN`,
                instagramStoryData: {
                    eventTitle: title,
                    hashtags: ['#SomosPadelBCN']
                }
            };
        }
    }

    return new TournamentChronicleService();
}));
