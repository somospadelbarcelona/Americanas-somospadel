/**
 * RecordsController.js
 * "Hall of Fame" Logic 🏆 - BIG DATA & SMART EDITION
 */
(function () {
    class RecordsController {
        constructor() {
            this.state = { records: null };
            this.isCalculating = false;
        }

        async init() {
            if (this.isCalculating) return;
            await this.calculateRecords();
        }

        async calculateRecords() {
            if (this.isCalculating) return;

            try {
                this.isCalculating = true;

                // 1. OBTENER DATOS DE SUMMAPADEL DE LOS EQUIPOS DEL CLUB
                const teams = (window.TeamController && window.TeamController.teams && window.TeamController.teams.length > 0)
                    ? window.TeamController.teams
                    : (window.ClubTeamsData || []);

                if (!teams || teams.length === 0) {
                    console.warn("⏳ Records: waiting for ClubTeamsData / SummaPadel data...");
                    if (!this.retryTimeout) {
                        this.retryTimeout = setTimeout(() => {
                            this.retryTimeout = null;
                            this.calculateRecords();
                        }, 500);
                    }
                    return;
                }

                // 2. CRUCE OPCIONAL CON JUGADORES REGISTRADOS EN FIREBASE (Para fotos y roles)
                let registeredPlayers = [];
                try {
                    const db = window.FirebaseDB || window.db;
                    if (db && db.players && typeof db.players.getAll === 'function') {
                        registeredPlayers = await db.players.getAll();
                    }
                } catch (dbErr) {
                    console.warn("Records: Firebase DB not available yet, using SummaPadel rosters.", dbErr);
                }

                const normalizeName = (s) => (s || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();

                const playerMap = new Map();
                registeredPlayers.forEach(p => {
                    if (p && p.name) {
                        playerMap.set(normalizeName(p.name), p);
                        if (p.id) playerMap.set(String(p.id), p);
                    }
                });

                const getRegisteredInfo = (name) => {
                    if (!name) return null;
                    return playerMap.get(normalizeName(name)) || null;
                };

                // 3. PROCESAMIENTO DE JUGADORES DE SUMMAPADEL (Puntos y Categorías)
                const playersStats = {}; // key: normalized name
                teams.forEach(team => {
                    const cat = (team.category || 'General').trim();
                    const teamName = team.name || 'SomosPadel BCN';
                    (team.roster || []).forEach(member => {
                        const rawName = (member.name || '').trim();
                        if (!rawName) return;
                        const norm = normalizeName(rawName);
                        const pts = parseFloat(member.pts || 0);

                        if (!playersStats[norm]) {
                            const reg = getRegisteredInfo(rawName);
                            playersStats[norm] = {
                                id: reg ? String(reg.id) : `summa-${norm.replace(/[^a-z0-9]/g, '-')}`,
                                name: rawName,
                                pts: pts,
                                maxPts: pts,
                                teams: [teamName],
                                categories: new Set([cat]),
                                photo_url: reg?.photo_url || reg?.photoURL || null,
                                level: reg?.level ? parseFloat(reg.level) : (pts > 0 ? parseFloat((pts / 20).toFixed(2)) : 3.0),
                                role: reg?.role || null
                            };
                        } else {
                            if (pts > playersStats[norm].maxPts) playersStats[norm].maxPts = pts;
                            playersStats[norm].pts += pts;
                            if (!playersStats[norm].teams.includes(teamName)) {
                                playersStats[norm].teams.push(teamName);
                            }
                            playersStats[norm].categories.add(cat);
                        }
                    });
                });

                // 4. PROCESAMIENTO DE EQUIPOS DE SUMMAPADEL
                const teamStatsList = teams.map(t => {
                    const pj = parseInt(t.stats?.pj || 0);
                    const pg = parseInt(t.stats?.pg || 0);
                    const pp = parseInt(t.stats?.pp || 0);
                    const winRate = pj > 0 ? parseFloat(((pg / pj) * 100).toFixed(1)) : 0;
                    const rosterCount = (t.roster || []).length;
                    const points = parseInt(t.points || 0);

                    return {
                        id: t.id || t.name,
                        name: t.name,
                        category: t.category,
                        division: t.division || '',
                        group: t.group || '',
                        captain: t.captain || 'Pendiente',
                        points: points,
                        ranking: t.ranking || 1,
                        pj, pg, pp, winRate, rosterCount
                    };
                });

                // 5. PROCESAMIENTO DE CAPITANES DE SUMMAPADEL
                const captainsMap = {};
                teams.forEach(t => {
                    const cap = (t.captain || '').trim();
                    if (!cap || cap.toLowerCase().includes('pendiente') || cap.toLowerCase().includes('definir')) return;
                    const norm = normalizeName(cap);
                    const pg = parseInt(t.stats?.pg || 0);
                    const pj = parseInt(t.stats?.pj || 0);

                    if (!captainsMap[norm]) {
                        const reg = getRegisteredInfo(cap);
                        captainsMap[norm] = {
                            id: reg ? String(reg.id) : `cap-${norm.replace(/[^a-z0-9]/g, '-')}`,
                            name: cap,
                            wins: pg,
                            matches: pj,
                            teams: [t.name],
                            photo_url: reg?.photo_url || reg?.photoURL || null,
                            level: reg?.level ? parseFloat(reg.level) : null,
                            role: reg?.role || 'Capitán'
                        };
                    } else {
                        captainsMap[norm].wins += pg;
                        captainsMap[norm].matches += pj;
                        if (!captainsMap[norm].teams.includes(t.name)) {
                            captainsMap[norm].teams.push(t.name);
                        }
                    }
                });

                // --- 🏺 RECOPILACIÓN DE CANDIDATOS SUMMAPADEL ---
                const allPlayers = Object.values(playersStats);
                const allCaptains = Object.values(captainsMap);

                // Helper para armar Podios
                const makePlayerPodium = (list, sortFn, unitText) => {
                    const sorted = [...list].sort(sortFn);
                    if (sorted.length === 0) return { winner: null, top3: [] };
                    return {
                        winner: sorted[0],
                        top3: sorted.slice(0, 3).map(p => ({
                            id: p.id,
                            name: p.name,
                            photo_url: p.photo_url,
                            level: p.level,
                            role: p.role,
                            value: `${p.maxPts.toFixed(1)} ${unitText}`,
                            raw: p.maxPts,
                            teamName: p.teams ? p.teams[0] : ''
                        }))
                    };
                };

                const makeTeamPodium = (list, sortFn, displayFn, rawProp) => {
                    const sorted = [...list].sort(sortFn);
                    if (sorted.length === 0) return { winner: null, top3: [] };
                    return {
                        winner: sorted[0],
                        top3: sorted.slice(0, 3).map(t => ({
                            id: t.id,
                            name: t.name,
                            photo_url: null,
                            level: null,
                            role: t.category,
                            value: displayFn(t),
                            raw: t[rawProp],
                            division: t.division,
                            pg: t.pg,
                            pj: t.pj
                        }))
                    };
                };

                const makeCaptainPodium = (list, sortFn) => {
                    const sorted = [...list].sort(sortFn);
                    if (sorted.length === 0) return { winner: null, top3: [] };
                    return {
                        winner: sorted[0],
                        top3: sorted.slice(0, 3).map(c => ({
                            id: c.id,
                            name: c.name,
                            photo_url: c.photo_url,
                            level: c.level,
                            role: 'Capitán de Liga',
                            value: `${c.wins} Victorias`,
                            raw: c.wins,
                            teams: c.teams
                        }))
                    };
                };

                // 1. Alpha: MVP SummaPadel (Máximos Puntos SummaPadel)
                const pAlpha = makePlayerPodium(
                    allPlayers.filter(p => p.maxPts > 0),
                    (a, b) => b.maxPts - a.maxPts,
                    "Pts Summa"
                );

                // 2. Punisher: Equipo #1 de Liga (Más puntos en clasificación)
                const pPunisher = makeTeamPodium(
                    teamStatsList,
                    (a, b) => b.points !== a.points ? b.points - a.points : (b.pg - a.pg),
                    (t) => `${t.points} Pts Liga`,
                    'points'
                );

                // 3. Sniper: Efectividad Letal (% Victorias en Liga de SummaPadel)
                const pSniper = makeTeamPodium(
                    teamStatsList.filter(t => t.pj > 0),
                    (a, b) => b.winRate !== a.winRate ? b.winRate - a.winRate : (b.pg - a.pg),
                    (t) => `${t.winRate.toFixed(1)}% Win Rate`,
                    'winRate'
                );

                // 4. Ame: Rey Masculino SummaPadel (Puntos en categoría Masculina)
                const pAme = makePlayerPodium(
                    allPlayers.filter(p => p.categories.has('Masculina') && p.maxPts > 0),
                    (a, b) => b.maxPts - a.maxPts,
                    "Pts Summa"
                );

                // 5. Ent: Reina Femenina SummaPadel (Puntos en categoría Femenina)
                const pEnt = makePlayerPodium(
                    allPlayers.filter(p => p.categories.has('Femenina') && p.maxPts > 0),
                    (a, b) => b.maxPts - a.maxPts,
                    "Pts Summa"
                );

                // 6. Giant: Estrella Mixta SummaPadel (Puntos en categoría Mixta)
                const pGiant = makePlayerPodium(
                    allPlayers.filter(p => p.categories.has('Mixta') && p.maxPts > 0),
                    (a, b) => b.maxPts - a.maxPts,
                    "Pts Summa"
                );

                // 7. Catalyst: Capitán de Oro (Capitán con más victorias de liga)
                const pCatalyst = makeCaptainPodium(
                    allCaptains.filter(c => c.wins > 0),
                    (a, b) => b.wins - a.wins
                );

                // 8. Streak: La Muralla de Liga (Equipo con más victorias acumuladas)
                const pStreak = makeTeamPodium(
                    teamStatsList,
                    (a, b) => b.pg - a.pg,
                    (t) => `${t.pg} Partidos Ganados`,
                    'pg'
                );

                // 9. Wall: Bastión Defensivo (Equipo con menos derrotas en liga)
                const pWall = makeTeamPodium(
                    teamStatsList.filter(t => t.pj > 0),
                    (a, b) => a.pp !== b.pp ? a.pp - b.pp : (b.pg - a.pg),
                    (t) => t.pp === 0 ? '0 Derrotas (Invicto)' : `${t.pp} Derrotas`,
                    'pp'
                );

                // 10. Ironman: Plantilla de Hierro (Equipo con más jugadores en su roster de SummaPadel)
                const pIron = makeTeamPodium(
                    teamStatsList,
                    (a, b) => b.rosterCount - a.rosterCount,
                    (t) => `${t.rosterCount} Jugadores`,
                    'rosterCount'
                );

                // --- HELPER CONSTRUCTOR DE RÉCORD ---
                const build = (key, category, p, title, icon, desc, color, analysis, vac, unit, customValue, customDisplay) => {
                    if (!p || !p.winner) {
                        return {
                            key,
                            category,
                            name: "VACANTE",
                            id: null,
                            player: null,
                            title,
                            icon,
                            desc,
                            deepAnalysis: vac,
                            value: "-",
                            count: "-",
                            unit: unit || "",
                            color: "#64748b",
                            top3: []
                        };
                    }
                    const w = p.winner;
                    const displayStr = customDisplay ? customDisplay(w) : (w.value || (p.top3 && p.top3[0]?.value) || String(w.maxPts || w.points || w.pg || w.wins || 0));
                    const valueStr = customValue ? customValue(w) : (p.top3 && p.top3[0]?.raw !== undefined ? String(p.top3[0].raw) : String(displayStr).split(' ')[0]);

                    return {
                        key,
                        category,
                        id: w.id || null,
                        player: {
                            id: w.id,
                            name: w.name,
                            photo_url: w.photo_url || null,
                            level: w.level || null,
                            role: w.role || (w.division ? `${w.category} • ${w.division}` : null)
                        },
                        name: w.name,
                        title,
                        icon,
                        desc,
                        value: valueStr,
                        count: displayStr,
                        unit: unit || "",
                        color,
                        top3: p.top3,
                        deepAnalysis: analysis(w, p.top3)
                    };
                };

                // --- ENSAMBLAJE FINAL DE LOS 10 RÉCORDS SUMMAPADEL ---
                this.state.records = {
                    alpha: build("alpha", "court", pAlpha, "MVP SummaPadel", "👑", "Jugador del club con mayor puntuación acumulada en el ranking oficial de SummaPadel.", "#f59e0b",
                        (w) => `Líder indiscutible con <b>${w.maxPts.toFixed(1)} puntos oficiales</b> en SummaPadel defendiendo a ${w.teams ? w.teams.join(', ') : 'SomosPadel BCN'}.`,
                        "Ránking de SummaPadel en proceso de actualización.", "Pts Summa"),

                    punisher: build("punisher", "combat", pPunisher, "Equipo #1 de Liga", "🏆", "Equipo del club en lo más alto de la clasificación en SummaPadel.", "#ef4444",
                        (w) => `Líder de la clasificación oficial de SummaPadel con <b>${w.points} puntos</b> y ${w.pg} victorias en ${w.division || 'su categoría'}.`,
                        "Equipos en proceso de disputa de jornadas.", "Pts Liga"),

                    sniper: build("sniper", "combat", pSniper, "Efectividad Letal", "🎯", "Equipo con mayor porcentaje de victorias en competición de liga oficial.", "#10b981",
                        (w) => `Rendimiento quirúrgico: <b>${w.winRate.toFixed(1)}% de victorias</b> en liga de SummaPadel, habiendo ganado ${w.pg} de ${w.pj} partidos disputados.`,
                        "Pendiente de registrar más jornadas.", "% Win Rate"),

                    ame: build("ame", "court", pAme, "Rey Masculino SummaPadel", "⚡", "Máxima puntuación individual en las divisiones masculinas de SummaPadel.", "#8b5cf6",
                        (w) => `El mayor referente masculino del club con <b>${w.maxPts.toFixed(1)} puntos oficiales</b> en SummaPadel.`,
                        "Puntuaciones masculinas en proceso.", "Pts Summa"),

                    ent: build("ent", "court", pEnt, "Reina Femenina SummaPadel", "👑", "Máxima puntuación individual en las divisiones femeninas de SummaPadel.", "#ec4899",
                        (w) => `La reina del club: lidera el ranking oficial femenino con <b>${w.maxPts.toFixed(1)} puntos</b> en SummaPadel.`,
                        "Puntuaciones femeninas en proceso.", "Pts Summa"),

                    giant: build("giant", "combat", pGiant, "Estrella Mixta SummaPadel", "🌟", "Mayor puntuación individual en las divisiones mixtas de SummaPadel.", "#f97316",
                        (w) => `Protagonista en competición mixta: encabeza la tabla con <b>${w.maxPts.toFixed(1)} puntos</b> oficiales.`,
                        "Puntuaciones mixtas en proceso.", "Pts Summa"),

                    catalyst: build("catalyst", "grit", pCatalyst, "Capitán de Oro", "🤝", "Capitán con mayor cantidad de partidos de liga ganados al frente de sus equipos.", "#3b82f6",
                        (w) => `Liderazgo legendario: ha guiado a sus equipos a <b>${w.wins} victorias oficiales</b> en la liga SummaPadel.`,
                        "Capitanes sumando partidos de liga.", "Victorias"),

                    streak: build("streak", "grit", pStreak, "La Muralla de Liga", "🧱", "Equipo de SomosPadel con más triunfos acumulados en la temporada oficial.", "#0ea5e9",
                        (w) => `Imparables en la pista: acumula un balance de <b>${w.pg} victorias oficiales</b> en SummaPadel.`,
                        "Victorias en proceso de conteo.", "Victorias"),

                    wall: build("wall", "grit", pWall, "Bastión Defensivo", "🛡️", "Equipo con menor número de derrotas en competición oficial (Sólido / Invicto).", "#059669",
                        (w) => `Fortaleza inexpugnable: solo ha concedido <b>${w.pp} derrota(s)</b> en competición oficial de liga.`,
                        "Jornadas en juego.", "Derrotas"),

                    ironman: build("ironman", "grit", pIron, "Plantilla de Hierro", "⛓️", "Equipo con el roster más nutrido y comprometido en el registro oficial de SummaPadel.", "#6366f1",
                        (w) => `Plantilla todoterreno: el equipo más numeroso con <b>${w.rosterCount} jugadores oficiales</b> en su acta.`,
                        "Rosters oficiales en preparación.", "Jugadores")
                };

                // Hall of Fame Summary & MVP
                const topMvp = pAlpha.winner || null;
                const activeCount = Object.values(this.state.records).filter(r => r.name !== 'VACANTE').length;

                this.state.summary = {
                    totalRecords: Object.keys(this.state.records).length,
                    activeRecords: activeCount,
                    mvp: topMvp ? {
                        id: topMvp.id,
                        name: topMvp.name,
                        titles: `${topMvp.maxPts.toFixed(0)} PTS`,
                        level: topMvp.level,
                        photo_url: topMvp.photo_url || null,
                        role: 'LÍDER SUMMAPADEL'
                    } : null
                };

                console.log("🏆 SummaPadel Hall of Fame Cooked successfully!", this.state.records);
                if (window.RecordsView) window.RecordsView.render();
            } catch (e) {
                console.error("Error cooking SummaPadel records", e);
            } finally {
                this.isCalculating = false;
            }
        }

        getSummary() { return this.state.summary || null; }

        parseDate(d) { if (!d) return new Date(0); if (d.toDate) return d.toDate(); return new Date(d); }
        getRecords() { return this.state.records; }

        destroy() {
            if (this.retryTimeout) {
                clearTimeout(this.retryTimeout);
                this.retryTimeout = null;
            }
        }
    }
    window.RecordsController = new RecordsController();
})();
