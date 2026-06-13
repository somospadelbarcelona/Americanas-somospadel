/**
 * StandingsService.js
 * Centralizes the calculation logic for tournament and training standings (Pozo/Americanas).
 */
(function () {
    class StandingsService {
        constructor() {
            console.log("🏆 StandingsService Initialized");
        }

        /**
         * Calculates standings from a list of matches.
         * Optimized for Pozo, Americanas, and Entrenos.
         */
        calculate(matches, type = 'americana', isFixedPairs = false, initialPlayers = []) {
            const stats = {};

            // Initialize stats with all participants (to ensure 0-match players appear)
            if (initialPlayers && Array.isArray(initialPlayers)) {
                initialPlayers.forEach(p => {
                    const uid = p.uid || p.id;
                    const name = p.name;
                    if (uid || name) {
                        this._ensurePlayer(stats, uid, name);
                    }
                });
            }

            const seenMatches = new Set();
            const normalizeTeam = (raw) => {
                if (Array.isArray(raw)) return [...raw].sort().join('|');
                if (typeof raw === 'string') return raw.split('/').map(s => s.trim()).sort().join('|');
                return String(raw || '');
            };

            matches.forEach(m => {
                // 🛡️ DEDUPLICATION: Prevent double counting if there are duplicate match docs
                const sigA = normalizeTeam(m.team_a_names);
                const sigB = normalizeTeam(m.team_b_names);
                const signature = `${m.round}-${m.court}-${[sigA, sigB].sort().join('VS')}`;
                
                if (seenMatches.has(signature)) return;
                seenMatches.add(signature);

                const hasScore = (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0;
                if (m.status !== 'finished' && !hasScore) return;

                const scoreA = parseInt(m.score_a || 0);
                const scoreB = parseInt(m.score_b || 0);
                const court = parseInt(m.court || 99);
                const roundNum = parseInt(m.round || 0);

                if (isFixedPairs) {
                    this._processFixedPairTeam(stats, m.team_a_ids, m.team_a_names, scoreA, scoreB, court, roundNum);
                    this._processFixedPairTeam(stats, m.team_b_ids, m.team_b_names, scoreB, scoreA, court, roundNum);
                } else {
                    // Process Team A
                    this._processTeam(stats, m.team_a_ids, m.team_a_names, scoreA, scoreB, court, roundNum);
                    // Process Team B
                    this._processTeam(stats, m.team_b_ids, m.team_b_names, scoreB, scoreA, court, roundNum);
                }
            });

            return Object.values(stats).sort((a, b) => {
                if (type === 'entreno') {
                    // REGLAS DE DESEMPATE ENTRENO (POZO)
                    // 1. Victorias (Wins)
                    if (b.won !== a.won) return b.won - a.won;
                    // 2. Veces en Pista 1 (Court 1 Count)
                    if (b.court1Count !== a.court1Count) return b.court1Count - a.court1Count;
                    // 3. Posición Final (Last Match Court) - Menor es mejor
                    if (a.lastMatchCourt !== b.lastMatchCourt) return a.lastMatchCourt - b.lastMatchCourt;
                    // 4. Puntos Totales (Games Won)
                    return b.points - a.points;
                } else {
                    // AMERICANA STANDARD
                    // 1. Puntos Totales (Games Won)
                    if (b.points !== a.points) return b.points - a.points;
                    // 2. Victorias
                    if (b.won !== a.won) return b.won - a.won;
                    // 3. Diferencia
                    return b.diff - a.diff;
                }
            });
        }

        _processFixedPairTeam(stats, ids, namesRaw, scoreSelf, scoreOther, court, roundNum) {
            let sortedIds = [...(ids || [])].sort();
            let key = sortedIds.join('|');
            let namesArray = [];
            if (Array.isArray(namesRaw)) {
                namesArray = namesRaw;
            } else if (typeof namesRaw === 'string') {
                namesArray = namesRaw.split(' / ').map(s => s.trim());
            }
            if (!key) key = namesArray.join('|');
            if (!key) return; // Cannot identify team

            const displayName = namesArray.length > 0 
                ? namesArray.map(n => (n || '').split(' ')[0]).join(' & ') 
                : key;

            this._ensurePlayer(stats, key, displayName);
            
            // 🛡️ PER-PAIR ROUND DEDUPLICATION
            if (!stats[key]._seenRounds) stats[key]._seenRounds = new Set();
            if (stats[key]._seenRounds.has(roundNum)) return;
            stats[key]._seenRounds.add(roundNum);

            this._updatePlayerStats(stats[key], scoreSelf, scoreOther, court, roundNum);
        }

        _processTeam(stats, ids, namesRaw, scoreSelf, scoreOther, court, roundNum) {
            if (!ids || !Array.isArray(ids)) {
                // Handle case where ids is missing but names might exist
                if (namesRaw) {
                    const names = Array.isArray(namesRaw) ? namesRaw : [namesRaw];
                    names.forEach(name => {
                        if (!name) return;
                        const key = this._ensurePlayer(stats, null, name);
                        this._updatePlayerStats(stats[key], scoreSelf, scoreOther, court, roundNum);
                    });
                }
                return;
            }

            let namesArray = [];
            if (Array.isArray(namesRaw)) {
                namesArray = namesRaw;
            } else if (typeof namesRaw === 'string') {
                namesArray = namesRaw.split(' / ').map(s => s.trim());
            }

            ids.forEach((uid, idx) => {
                const pName = namesArray[idx] || `Jugador ${idx + 1}`;
                const key = this._ensurePlayer(stats, uid, pName);
                
                // 🛡️ PER-PLAYER ROUND DEDUPLICATION: Ensure a player only counts once per round
                if (!stats[key]._seenRounds) stats[key]._seenRounds = new Set();
                if (stats[key]._seenRounds.has(roundNum)) return;
                stats[key]._seenRounds.add(roundNum);

                this._updatePlayerStats(stats[key], scoreSelf, scoreOther, court, roundNum);
            });
        }

        _ensurePlayer(stats, uid, name) {
            const normalizedName = (name || '').trim().toUpperCase();
            
            // 1. Try to find by UID
            if (uid && stats[uid]) return uid;

            // 2. Try to find by Name (crucial to avoid duplicates if UID is missing in some matches)
            const existingKey = Object.keys(stats).find(k => 
                (stats[k].name || '').trim().toUpperCase() === normalizedName
            );

            if (existingKey) {
                // If we found them by name, and we have a new UID, update the record
                if (uid && !stats[existingKey].uid) {
                    stats[existingKey].uid = uid;
                }
                return existingKey;
            }

            // 3. Not found, create new
            const key = uid || name || `p_${Math.random()}`;
            if (!stats[key]) {
                stats[key] = {
                    uid: uid,
                    name: name,
                    played: 0,
                    won: 0,
                    lost: 0,
                    draw: 0,
                    points: 0, // Games Won
                    gamesLost: 0,
                    leaguePoints: 0, // 3 for win, 1 for draw
                    diff: 0,
                    court1Count: 0,
                    bestCourt: 99,
                    lastMatchCourt: 99,
                    lastMatchRound: 0
                };
            }
            return key;
        }

        _updatePlayerStats(p, scoreSelf, scoreOther, court, roundNum) {
            p.played++;
            p.points += scoreSelf;
            p.gamesLost += scoreOther;
            p.diff = p.points - p.gamesLost;

            if (scoreSelf > scoreOther) {
                p.won++;
                p.leaguePoints += 3;
            } else if (scoreSelf === scoreOther && scoreSelf > 0) {
                p.draw++;
                p.leaguePoints += 1;
            } else {
                p.lost++;
            }

            if (parseInt(court) === 1) p.court1Count++;
            if (parseInt(court) < p.bestCourt) p.bestCourt = parseInt(court);

            if (roundNum >= p.lastMatchRound) {
                p.lastMatchRound = roundNum;
                p.lastMatchCourt = parseInt(court);
            }
        }
    }

    window.StandingsService = new StandingsService();
})();
