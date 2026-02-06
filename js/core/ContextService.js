/**
 * ContextService.js
 * Centralizes the logic to build the player's personal context (Upcoming matches, victories, etc.)
 */
(function () {
    class ContextService {
        constructor() {
            this.db = window.db;
        }

        async buildPlayerContext(user) {
            if (!user) return null;
            const userId = user.id || user.uid;

            const context = {
                status: 'EMPTY',
                hasMatchToday: false,
                hasMatchThisWeek: false,
                hasRecentVictory: false,
                hasOpenTournament: false,
                upcomingMatches: 0,
                activeTournaments: 0,
                myRank: user.rank || '?',
                rankStatus: 'stable',
                confirmed: false
            };

            try {
                // 1. Fetch All Active Events
                if (!window.AmericanaService) return context;
                const allEvents = await window.AmericanaService.getAllActiveEvents();

                // 2. Filter My Events
                context.myEvents = allEvents.filter(a => {
                    const players = a.players || a.registeredPlayers || [];
                    return players.some(p => (p.uid || p.id || p) === userId);
                });

                const todayStr = new Date().toISOString().split('T')[0];

                // 3. Status Stats (Double safety filtering by date)
                const openEvents = allEvents.filter(a =>
                    ['open', 'upcoming', 'scheduled'].includes(a.status) && a.date >= todayStr
                );
                context.activeTournaments = openEvents.filter(e => e.type === 'americana').length;
                context.hasOpenTournament = context.activeTournaments > 0;

                // Upcoming matches: Only today or future (ignore stale orphaned events)
                const filteredMatches = context.myEvents.filter(e => e.date >= todayStr || e.status === 'live');
                context.upcomingMatches = filteredMatches.length;
                context.hasMatchThisWeek = context.upcomingMatches > 0;

                // 4. Ranking Info
                if (window.RankingController) {
                    const ranked = await window.RankingController.calculateSilently();
                    const me = ranked.find(p => p.id === userId);
                    if (me) {
                        context.myRank = me.rank;
                        context.rankStatus = me.trend || 'stable';
                    }
                }

                // 5. Recent Victory Check
                const victoryMatch = await this.checkRecentVictory(userId);
                if (victoryMatch) {
                    context.hasRecentVictory = true;
                    context.status = 'VICTORY';
                    context.lastMatch = victoryMatch;
                    // Compute score and opponents for HeroCard
                    const isTeamA = (victoryMatch.team_a_ids || []).includes(userId);
                    context.recentScore = isTeamA ? `${victoryMatch.score_a}-${victoryMatch.score_b}` : `${victoryMatch.score_b}-${victoryMatch.score_a}`;
                    context.recentOpponents = isTeamA ? victoryMatch.team_b_names : victoryMatch.team_a_names;
                }

                // 6. Active Match Deep Dive (Prioritize Today / Future)
                const myActiveEvent = filteredMatches.sort((a, b) => {
                    const isAToday = a.date === todayStr;
                    const isBToday = b.date === todayStr;
                    if (isAToday && !isBToday) return -1;
                    if (!isAToday && isBToday) return 1;
                    return 0; // Chronological (default)
                })[0];
                if (myActiveEvent) {
                    const isTodayMatch = this.isToday(myActiveEvent.date);
                    const isLive = myActiveEvent.status === 'live' || myActiveEvent.status === 'in_progress';

                    if (isTodayMatch || isLive) {
                        context.hasMatchToday = true;
                        context.status = isLive ? 'LIVE_MATCH' : 'UPCOMING_EVENT';
                        context.eventName = myActiveEvent.name;
                        context.matchTime = myActiveEvent.time || '18:00';
                        context.matchDay = 'HOY';
                        context.tournamentName = myActiveEvent.type === 'entreno' ? 'Entreno (Pozo)' : 'Americana';
                        context.matchType = myActiveEvent.type;

                        const matchData = await this.fetchMatchDetails(userId, myActiveEvent.id, myActiveEvent.type);
                        if (matchData) {
                            context.matchId = matchData.id;
                            context.court = matchData.court || '?';
                            context.partner = matchData.partnerName || 'Asignando...';
                            context.opponents = matchData.opponentsNames || 'Asignando...';
                            context.confirmed = matchData.confirmations ? !!matchData.confirmations[userId] : false;
                        }
                    } else {
                        // Just an upcoming one later this week
                        if (!context.hasRecentVictory) {
                            context.status = 'UPCOMING_EVENT';
                            context.eventName = myActiveEvent.name;
                            context.matchTime = myActiveEvent.time || '18:00';
                            context.matchDay = this.formatFriendlyDate(myActiveEvent.date);
                        }
                    }
                }

            } catch (err) {
                console.error("❌ [ContextService] Error building context:", err);
            }

            return context;
        }

        isToday(dateStr) {
            if (!dateStr) return false;
            const today = new Date().toISOString().split('T')[0];
            return dateStr === today;
        }

        formatFriendlyDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
        }

        async fetchMatchDetails(userId, eventId, type) {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                const snapshot = await window.db.collection(collectionName)
                    .where('americana_id', '==', eventId)
                    .orderBy('round', 'desc')
                    .limit(10)
                    .get();

                if (snapshot.empty) return null;

                const userMatch = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .find(m => {
                        const ids = [...(m.team_a_ids || []), ...(m.team_b_ids || [])];
                        return ids.includes(userId);
                    });

                if (!userMatch) return null;

                const isTeamA = (userMatch.team_a_ids || []).includes(userId);
                const myTeamIds = isTeamA ? userMatch.team_a_ids : userMatch.team_b_ids;
                const opponentNamesRaw = isTeamA ? userMatch.team_b_names : userMatch.team_a_names;
                const myTeamNamesRaw = isTeamA ? userMatch.team_a_names : userMatch.team_b_names;

                const pId = myTeamIds.find(id => id !== userId);
                let partnerName = 'Solo';
                if (pId && myTeamNamesRaw) {
                    const names = myTeamNamesRaw.split(' / ');
                    const user = window.Store.getState('currentUser');
                    partnerName = names.find(n => !n.toLowerCase().includes((user.name || '').toLowerCase())) || names[1] || names[0];
                }

                return {
                    id: userMatch.id,
                    court: userMatch.court,
                    partnerName: partnerName,
                    opponentsNames: opponentNamesRaw,
                    confirmations: userMatch.confirmations || {},
                    round: userMatch.round
                };
            } catch (e) { return null; }
        }

        async checkRecentVictory(userId) {
            try {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const pulls = await Promise.all([
                    window.db.collection('matches').where('status', '==', 'finished').where('created_at', '>', yesterday).get(),
                    window.db.collection('entrenos_matches').where('status', '==', 'finished').where('created_at', '>', yesterday).get()
                ]);

                const allRecentMatches = [...pulls[0].docs, ...pulls[1].docs].map(doc => ({ id: doc.id, ...doc.data() }));

                return allRecentMatches.find(m => {
                    const isTeamA = (m.team_a_ids || []).includes(userId);
                    const isTeamB = (m.team_b_ids || []).includes(userId);
                    if (!isTeamA && !isTeamB) return false;

                    const scoreA = parseInt(m.score_a || 0);
                    const scoreB = parseInt(m.score_b || 0);

                    if (isTeamA) return scoreA > scoreB;
                    if (isTeamB) return scoreB > scoreA;
                    return false;
                });
            } catch (e) { return null; }
        }
    }

    window.ContextService = new ContextService();
    console.log("🧠 ContextService Loaded");
})();
