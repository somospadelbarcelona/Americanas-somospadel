/**
 * ControlTowerStats.js
 * Sub-module for rendering advanced sports analytics, awards and official tournament press chronicles.
 * Version: 5.2 Press & Sports Analytics Edition (SomosPadel BCN)
 */
(function () {
    'use strict';

    class ControlTowerStats {
        static render(matches, eventDoc) {
            const finishedMatches = (matches || []).filter(m => 
                m.status === 'finished' || m.status === 'finalizado' || (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0
            );

            if (finishedMatches.length === 0) {
                return `
                    <div style="padding: 70px 20px; text-align: center; color: #64748b; font-family: 'Outfit', sans-serif;">
                        <i class="fas fa-newspaper" style="font-size: 3.2rem; margin-bottom: 20px; opacity: 0.25; color: #0ea5e9;"></i>
                        <h3 style="font-weight: 900; color: #0f172a; margin-bottom: 8px;">ESTADÍSTICAS EN PREPARACIÓN</h3>
                        <p style="font-size: 0.8rem; max-width: 280px; margin: 0 auto; color: #64748b;">
                            Las métricas de rendimiento y la crónica de prensa oficial estarán disponibles en cuanto se confirmen los primeros partidos.
                        </p>
                    </div>
                `;
            }

            const isEntreno = !!eventDoc?.isEntreno;
            const isSwiss = !!(eventDoc?.pair_mode === 'swiss' || (eventDoc?.name || '').toUpperCase().includes('SUIZ'));
            const isFija = !isSwiss && !!(eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA'));
            const ranking = window.StandingsService.calculate(matches, isSwiss ? 'swiss' : (isEntreno ? 'entreno' : 'americana'), isFija, eventDoc?.players || [], isSwiss);
            window.ControlTowerStats.lastRankingData = ranking;
            window.ControlTowerStats.lastMatches = matches;
            window.ControlTowerStats.lastEventDoc = eventDoc;

            // 1. Top Cañonero (Most points/games won)
            const topScorer = [...ranking].sort((a, b) => b.points - a.points)[0] || { name: '-', points: 0, won: 0 };

            // 2. Muro Defensivo (Fewest games conceded per match)
            const bestDefense = [...ranking]
                .filter(p => (p.played || 0) > 0)
                .sort((a, b) => ((a.gamesLost || 0) / (a.played || 1)) - ((b.gamesLost || 0) / (b.played || 1)))[0] || { name: '-', gamesLost: 0, played: 1 };

            // 3. Pareja con Mejor Sinergia (Pair with highest joint win margin)
            const pairStats = new Map();
            finishedMatches.forEach(m => {
                const teamA = (m.team_a_names || []).filter(x => x && x !== '---').sort().join(' & ');
                const teamB = (m.team_b_names || []).filter(x => x && x !== '---').sort().join(' & ');
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);

                if (teamA) {
                    if (!pairStats.has(teamA)) pairStats.set(teamA, { name: teamA, won: 0, diff: 0, played: 0 });
                    const st = pairStats.get(teamA);
                    st.played++;
                    st.diff += (scA - scB);
                    if (scA > scB) st.won++;
                }
                if (teamB) {
                    if (!pairStats.has(teamB)) pairStats.set(teamB, { name: teamB, won: 0, diff: 0, played: 0 });
                    const st = pairStats.get(teamB);
                    st.played++;
                    st.diff += (scB - scA);
                    if (scB > scA) st.won++;
                }
            });
            const topPair = Array.from(pairStats.values()).sort((a, b) => b.diff - a.diff)[0] || { name: 'En disputa', diff: 0, won: 0 };

            // 4. Partido Más Disputado (Closest match)
            let epicMatch = null;
            let minDiff = 999;
            finishedMatches.forEach(m => {
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                const diff = Math.abs(scA - scB);
                if (scA + scB > 0 && diff < minDiff) {
                    minDiff = diff;
                    epicMatch = m;
                }
            });

            // 5. Total Tournament Stats
            const totalGames = finishedMatches.reduce((acc, m) => acc + (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)), 0);
            const avgGamesPerMatch = finishedMatches.length > 0 ? (totalGames / finishedMatches.length).toFixed(1) : 0;

            return `
                <style>
                    .sp-stats-wrap {
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 12px 14px 40px;
                        background: #f8fafc;
                        min-height: 80vh;
                        box-sizing: border-box;
                    }

                    /* Top Actions */
                    .sp-stats-top-bar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .sp-stats-btn-back {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        padding: 8px 16px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.72rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                    }
                    .sp-stats-btn-back:hover {
                        background: #0f172a;
                        color: #ffffff;
                    }
                    .sp-stats-btn-chronicle {
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        color: #ffffff;
                        border: 1.5px solid #CCFF00;
                        padding: 8px 18px;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        box-shadow: 0 4px 18px rgba(204, 255, 0, 0.25);
                        transition: all 0.25s;
                    }
                    .sp-stats-btn-chronicle:hover {
                        transform: translateY(-2px) scale(1.02);
                        box-shadow: 0 6px 25px rgba(204, 255, 0, 0.45);
                    }

                    /* Press Chronicle Display Card - Dark Tech Athletic Magazine */
                    .sp-chronicle-card {
                        display: none;
                        box-sizing: border-box;
                        max-width: 100%;
                        word-break: break-word;
                        overflow-wrap: break-word;
                        background: radial-gradient(circle at 90% 10%, rgba(204, 255, 0, 0.08) 0%, transparent 42%), radial-gradient(circle at 10% 90%, rgba(14, 165, 233, 0.08) 0%, transparent 40%), linear-gradient(160deg, #070c18 0%, #0d1629 55%, #080e1a 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.35);
                        border-radius: 24px;
                        padding: 24px;
                        color: #ffffff;
                        margin-bottom: 24px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(204, 255, 0, 0.12);
                        animation: spFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
                        position: relative;
                        overflow: hidden;
                    }
                    @keyframes spFadeInUp {
                        from { opacity: 0; transform: translateY(18px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    /* Chronicle Header */
                    .sp-chronicle-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 18px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        padding-bottom: 14px;
                        gap: 12px;
                        flex-wrap: wrap;
                    }
                    .sp-chronicle-badge {
                        background: linear-gradient(135deg, #CCFF00 0%, #a3e635 100%);
                        color: #000000;
                        font-size: 0.72rem;
                        font-weight: 950;
                        padding: 5px 14px;
                        border-radius: 8px;
                        letter-spacing: 1px;
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        box-shadow: 0 0 16px rgba(204, 255, 0, 0.35);
                        text-transform: uppercase;
                    }
                    .sp-chronicle-date-tag {
                        font-size: 0.76rem;
                        font-weight: 700;
                        color: rgba(255, 255, 255, 0.65);
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .sp-chronicle-close-btn {
                        background: rgba(255, 255, 255, 0.06);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        color: #cbd5e1;
                        width: 32px;
                        height: 32px;
                        border-radius: 9px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.95rem;
                        transition: all 0.2s;
                        margin-left: auto;
                    }
                    .sp-chronicle-close-btn:hover {
                        background: rgba(239, 68, 68, 0.2);
                        border-color: rgba(239, 68, 68, 0.5);
                        color: #ef4444;
                        transform: scale(1.05);
                    }

                    /* Headlines */
                    .sp-chronicle-headline-wrap {
                        margin-bottom: 20px;
                    }
                    .sp-chronicle-headline {
                        font-size: 1.35rem;
                        font-weight: 950;
                        color: #ffffff;
                        line-height: 1.3;
                        letter-spacing: -0.4px;
                        margin: 0 0 8px 0;
                    }
                    .sp-chronicle-subheadline {
                        font-size: 0.82rem;
                        color: #94a3b8;
                        font-weight: 600;
                        line-height: 1.5;
                        margin: 0;
                    }

                    /* Hero Card: MVP / Protagonista de la Portada */
                    .sp-hero-mvp {
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(204, 255, 0, 0.06) 100%);
                        border: 1.5px solid rgba(245, 158, 11, 0.45);
                        border-radius: 20px;
                        padding: 20px 22px;
                        margin-bottom: 20px;
                        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45), 0 0 25px rgba(245, 158, 11, 0.12);
                        position: relative;
                        overflow: hidden;
                    }
                    .sp-hero-badge {
                        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                        color: #000000;
                        font-size: 0.68rem;
                        font-weight: 950;
                        letter-spacing: 1px;
                        padding: 4px 12px;
                        border-radius: 6px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        text-transform: uppercase;
                        margin-bottom: 14px;
                        box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
                    }
                    .sp-hero-profile {
                        display: flex;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .sp-hero-avatar {
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #1e293b, #0f172a);
                        border: 2.5px solid #fbbf24;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.35rem;
                        font-weight: 950;
                        color: #fbbf24;
                        position: relative;
                        box-shadow: 0 0 18px rgba(245, 158, 11, 0.45);
                        flex-shrink: 0;
                    }
                    .sp-hero-crown {
                        position: absolute;
                        top: -10px;
                        right: -6px;
                        font-size: 1.15rem;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
                    }
                    .sp-hero-info {
                        flex: 1;
                        min-width: 0;
                    }
                    .sp-hero-name {
                        font-size: 1.3rem;
                        font-weight: 950;
                        color: #ffffff;
                        letter-spacing: -0.3px;
                        margin-bottom: 6px;
                        text-transform: uppercase;
                    }
                    .sp-hero-editorial {
                        font-size: 0.82rem;
                        color: #e2e8f0;
                        line-height: 1.5;
                        margin-bottom: 14px;
                    }
                    .sp-hero-chips {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .sp-hero-chip {
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        padding: 5px 12px;
                        border-radius: 8px;
                        font-size: 0.74rem;
                        font-weight: 850;
                        color: #ffffff;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .sp-hero-chip.gold {
                        background: rgba(245, 158, 11, 0.16);
                        border-color: rgba(245, 158, 11, 0.45);
                        color: #fbbf24;
                    }
                    .sp-hero-chip.volt {
                        background: rgba(204, 255, 0, 0.16);
                        border-color: rgba(204, 255, 0, 0.45);
                        color: #CCFF00;
                    }
                    .sp-hero-chip.cyan {
                        background: rgba(0, 240, 255, 0.16);
                        border-color: rgba(0, 240, 255, 0.45);
                        color: #00F0FF;
                    }

                    /* Narrative Paragraphs */
                    .sp-chronicle-narrative {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 16px;
                        padding: 18px 20px;
                        margin-bottom: 20px;
                    }
                    .sp-chronicle-narrative p {
                        font-size: 0.86rem;
                        line-height: 1.65;
                        color: #cbd5e1;
                        margin: 0 0 12px 0;
                    }
                    .sp-chronicle-narrative p:last-child {
                        margin-bottom: 0;
                    }
                    .sp-chronicle-narrative strong {
                        color: #ffffff;
                        font-weight: 800;
                    }

                    /* Sports Highlights Grid */
                    .sp-chronicle-highlights {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 14px;
                        margin-bottom: 20px;
                    }
                    .sp-hl-card {
                        background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.4) 100%);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 16px;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        gap: 10px;
                        transition: transform 0.2s, border-color 0.2s;
                    }
                    .sp-hl-card:hover {
                        transform: translateY(-2px);
                        border-color: rgba(204, 255, 0, 0.3);
                    }
                    .sp-hl-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .sp-hl-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.1rem;
                        flex-shrink: 0;
                    }
                    .sp-hl-tag {
                        font-size: 0.65rem;
                        font-weight: 950;
                        letter-spacing: 0.8px;
                        text-transform: uppercase;
                    }
                    .sp-hl-name {
                        font-size: 0.92rem;
                        font-weight: 900;
                        color: #ffffff;
                        text-transform: uppercase;
                        line-height: 1.2;
                    }
                    .sp-hl-desc {
                        font-size: 0.77rem;
                        color: #94a3b8;
                        line-height: 1.45;
                    }
                    .sp-hl-badge {
                        display: inline-block;
                        font-size: 0.7rem;
                        font-weight: 850;
                        padding: 3px 9px;
                        border-radius: 6px;
                        width: fit-content;
                    }

                    /* Community & Level Capsule */
                    .sp-chronicle-community {
                        background: linear-gradient(135deg, rgba(204, 255, 0, 0.06) 0%, rgba(15, 23, 42, 0.85) 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.22);
                        border-radius: 16px;
                        padding: 16px 18px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        margin-bottom: 22px;
                    }
                    .sp-comm-icon {
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        background: rgba(204, 255, 0, 0.12);
                        color: #CCFF00;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.3rem;
                        flex-shrink: 0;
                        border: 1px solid rgba(204, 255, 0, 0.3);
                    }
                    .sp-comm-title {
                        font-size: 0.72rem;
                        font-weight: 950;
                        letter-spacing: 0.8px;
                        color: #CCFF00;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }
                    .sp-comm-desc {
                        font-size: 0.78rem;
                        color: #cbd5e1;
                        line-height: 1.5;
                    }

                    /* Chronicle Actions */
                    .sp-chronicle-actions {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        flex-wrap: wrap;
                    }
                    .sp-btn-wp-chronicle {
                        background: #25D366;
                        color: #ffffff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-size: 0.76rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35);
                        transition: all 0.2s;
                    }
                    .sp-btn-wp-chronicle:hover {
                        background: #22bf5b;
                        transform: translateY(-1px);
                    }
                    .sp-btn-copy-chronicle {
                        background: #CCFF00;
                        color: #000000;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-size: 0.76rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        box-shadow: 0 4px 16px rgba(204, 255, 0, 0.3);
                        transition: all 0.2s;
                    }
                    .sp-btn-copy-chronicle:hover {
                        background: #b8e600;
                        transform: translateY(-1px);
                    }
                    .sp-btn-close-chronicle {
                        background: rgba(255, 255, 255, 0.08);
                        color: #cbd5e1;
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        padding: 10px 18px;
                        border-radius: 12px;
                        font-size: 0.76rem;
                        font-weight: 850;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        transition: all 0.2s;
                        margin-left: auto;
                    }
                    .sp-btn-close-chronicle:hover {
                        background: rgba(255, 255, 255, 0.15);
                        color: #ffffff;
                    }

                    @media (max-width: 640px) {
                        .sp-chronicle-card {
                            padding: 18px 14px;
                            border-radius: 18px;
                        }
                        .sp-chronicle-headline {
                            font-size: 1.15rem;
                        }
                        .sp-hero-profile {
                            gap: 12px;
                        }
                        .sp-hero-avatar {
                            width: 52px;
                            height: 52px;
                            font-size: 1.15rem;
                        }
                        .sp-hero-name {
                            font-size: 1.15rem;
                        }
                        .sp-chronicle-actions {
                            flex-direction: column;
                            width: 100%;
                        }
                        .sp-btn-wp-chronicle,
                        .sp-btn-copy-chronicle,
                        .sp-btn-close-chronicle {
                            width: 100%;
                            justify-content: center;
                            margin-left: 0;
                        }
                    }

                    /* Awards Showcase (Cuadro de Honor) */
                    .sp-awards-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 14px;
                        margin-bottom: 24px;
                    }
                    .sp-award-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 20px;
                        padding: 16px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        position: relative;
                        overflow: hidden;
                    }
                    .sp-award-icon-box {
                        width: 48px;
                        height: 48px;
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.3rem;
                        flex-shrink: 0;
                    }
                    .award-gold-box { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
                    .award-blue-box { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
                    .award-green-box { background: rgba(16, 185, 129, 0.12); color: #10b981; }
                    .award-purple-box { background: rgba(168, 85, 247, 0.12); color: #a855f7; }

                    .sp-award-title {
                        font-size: 0.62rem;
                        font-weight: 950;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #64748b;
                        margin-bottom: 2px;
                    }
                    .sp-award-name {
                        font-size: 0.9rem;
                        font-weight: 950;
                        color: #0f172a;
                        text-transform: uppercase;
                        line-height: 1.2;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 170px;
                    }
                    .sp-award-metric {
                        font-size: 0.72rem;
                        font-weight: 800;
                        color: #0ea5e9;
                        margin-top: 2px;
                    }

                    /* Tournament Macro Stats */
                    .sp-macro-bar {
                        background: #0f172a;
                        color: #ffffff;
                        border-radius: 18px;
                        padding: 14px 20px;
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-around;
                        align-items: center;
                        box-shadow: 0 8px 25px rgba(15, 23, 42, 0.15);
                    }
                    .sp-macro-item {
                        text-align: center;
                    }
                    .sp-macro-val {
                        font-size: 1.3rem;
                        font-weight: 950;
                        color: #CCFF00;
                        line-height: 1;
                    }
                    .sp-macro-lbl {
                        font-size: 0.58rem;
                        font-weight: 800;
                        color: rgba(255, 255, 255, 0.6);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-top: 4px;
                    }

                    /* Player Efficiency Section */
                    .sp-efficiency-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 20px;
                        padding: 18px;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
                    }
                    .sp-efficiency-title {
                        font-weight: 950;
                        font-size: 0.85rem;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 16px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .sp-efficiency-row {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 10px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .sp-efficiency-row:last-child {
                        border-bottom: none;
                    }
                    .sp-eff-rank {
                        width: 24px;
                        font-weight: 950;
                        font-size: 0.75rem;
                        color: #94a3b8;
                    }
                    .sp-eff-name {
                        font-weight: 800;
                        font-size: 0.78rem;
                        color: #0f172a;
                        text-transform: uppercase;
                        flex: 1;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .sp-eff-bar-wrap {
                        flex: 1.5;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .sp-eff-track {
                        flex: 1;
                        height: 8px;
                        background: #f1f5f9;
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    .sp-eff-fill {
                        height: 100%;
                        border-radius: 6px;
                    }
                    .sp-eff-pct {
                        min-width: 40px;
                        text-align: right;
                        font-weight: 950;
                        font-size: 0.8rem;
                        color: #0f172a;
                    }
                </style>

                <div class="sp-stats-wrap">
                    <!-- TOP BAR -->
                    <div class="sp-stats-top-bar">
                        <button class="sp-stats-btn-back" onclick="window.ControlTowerView.switchTab('results')">
                            <i class="fas fa-arrow-left"></i>
                            <span>VER RESULTADOS</span>
                        </button>
                        <button class="sp-stats-btn-chronicle" onclick="window.ControlTowerStats.generatePressChronicle()">
                            <i class="fas fa-newspaper"></i>
                            <span>📰 REDACTAR CRÓNICA OFICIAL</span>
                        </button>
                    </div>

                    <!-- PRESS CHRONICLE DISPLAY CARD (POPULATED DYNAMICALLY) -->
                    <div id="sp-chronicle-box" class="sp-chronicle-card"></div>

                    <!-- CUADRO DE HONOR / EVENT AWARDS -->
                    <div class="sp-awards-grid">
                        <!-- TOP CAÑONERO -->
                        <div class="sp-award-card">
                            <div class="sp-award-icon-box award-gold-box">
                                <i class="fas fa-meteor"></i>
                            </div>
                            <div>
                                <div class="sp-award-title">Top Cañonero (Juegos)</div>
                                <div class="sp-award-name" title="${topScorer.name}">${topScorer.name}</div>
                                <div class="sp-award-metric">${topScorer.points} Juegos Ganados</div>
                            </div>
                        </div>

                        <!-- MURO DEFENSIVO -->
                        <div class="sp-award-card">
                            <div class="sp-award-icon-box award-blue-box">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div>
                                <div class="sp-award-title">Muro Defensivo</div>
                                <div class="sp-award-name" title="${bestDefense.name}">${bestDefense.name}</div>
                                <div class="sp-award-metric">${((bestDefense.gamesLost || 0) / (bestDefense.played || 1)).toFixed(1)} encajados / partido</div>
                            </div>
                        </div>

                        <!-- PAREJA DE ORO -->
                        <div class="sp-award-card">
                            <div class="sp-award-icon-box award-green-box">
                                <i class="fas fa-fire"></i>
                            </div>
                            <div>
                                <div class="sp-award-title">Pareja de Oro</div>
                                <div class="sp-award-name" title="${topPair.name}">${topPair.name}</div>
                                <div class="sp-award-metric">${topPair.won} Victorias • Dif +${topPair.diff}</div>
                            </div>
                        </div>

                        <!-- DUELO ÉPICO -->
                        <div class="sp-award-card">
                            <div class="sp-award-icon-box award-purple-box">
                                <i class="fas fa-bolt"></i>
                            </div>
                            <div>
                                <div class="sp-award-title">Duelo Más Reñido</div>
                                <div class="sp-award-name">
                                    ${epicMatch ? `${ControlTowerStats.formatTeamNames(epicMatch.team_a_names)} vs ${ControlTowerStats.formatTeamNames(epicMatch.team_b_names)}` : 'Sin partidos'}
                                </div>
                                <div class="sp-award-metric">
                                    ${epicMatch ? `Pista ${epicMatch.court} • Score ${epicMatch.score_a} - ${epicMatch.score_b}` : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- MACRO TOURNAMENT BAR -->
                    <div class="sp-macro-bar">
                        <div class="sp-macro-item">
                            <div class="sp-macro-val">${finishedMatches.length}</div>
                            <div class="sp-macro-lbl">Partidos Finalizados</div>
                        </div>
                        <div class="sp-macro-item">
                            <div class="sp-macro-val">${totalGames}</div>
                            <div class="sp-macro-lbl">Juegos Disputados</div>
                        </div>
                        <div class="sp-macro-item">
                            <div class="sp-macro-val">${avgGamesPerMatch}</div>
                            <div class="sp-macro-lbl">Media Juegos / Partido</div>
                        </div>
                    </div>

                    <!-- INDIVIDUAL EFFICIENCY TABLE -->
                    <div class="sp-efficiency-card">
                        <div class="sp-efficiency-title">
                            <i class="fas fa-chart-line" style="color: #0ea5e9;"></i>
                            <span>EFICIENCIA INDIVIDUAL (% VICTORIAS)</span>
                        </div>
                        <div>
                            ${ranking.slice(0, 20).map((p, i) => {
                                const winRate = Math.round((p.won / Math.max(1, p.played)) * 100);
                                const barColor = winRate >= 65 ? '#10b981' : (winRate >= 45 ? '#f59e0b' : '#ef4444');

                                return `
                                    <div class="sp-efficiency-row">
                                        <span class="sp-eff-rank">${i + 1}</span>
                                        <span class="sp-eff-name" title="${p.name}">${p.name}</span>
                                        <div class="sp-eff-bar-wrap">
                                            <div class="sp-eff-track">
                                                <div class="sp-eff-fill" style="width: ${winRate}%; background: ${barColor};"></div>
                                            </div>
                                            <span class="sp-eff-pct">${winRate}%</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Closes / hides the chronicle card.
         */
        static closeChronicle() {
            const chronicleBox = document.getElementById('sp-chronicle-box');
            if (chronicleBox) {
                chronicleBox.style.display = 'none';
            }
        }

        /**
         * Human-readable date formatter in Spanish.
         * Example: "2026-09-06" -> "Domingo, 6 de septiembre de 2026"
         */
        static formatHumanDate(rawDate) {
            if (!rawDate || rawDate === 'Hoy') return 'Hoy';
            try {
                if (typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
                    rawDate = rawDate.toDate();
                }
                if (rawDate instanceof Date) {
                    if (!isNaN(rawDate.getTime())) {
                        const formatted = rawDate.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    }
                }
                const parts = String(rawDate).trim().split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) {
                        const formatted = d.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    }
                }
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                    const formatted = d.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                }
            } catch (e) {}
            return String(rawDate);
        }

        /**
         * Returns player initials for the hero avatar badge.
         */
        static getInitials(name) {
            if (!name || typeof name !== 'string') return 'SP';
            const clean = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
            const parts = clean.split(/\s+/).filter(Boolean);
            if (parts.length === 0) return 'SP';
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        /**
         * Formats team names safely.
         */
        static formatTeamNames(raw) {
            if (!raw) return 'Pareja';
            if (Array.isArray(raw)) {
                const clean = raw.filter(n => n && n !== '---').map(n => String(n).trim()).filter(Boolean);
                return clean.length > 0 ? clean.join(' & ') : 'Pareja';
            }
            if (typeof raw === 'string') {
                const parts = raw.split(/\s*[/&]\s*/).map(n => String(n).trim()).filter(n => n && n !== '---');
                return parts.length > 0 ? parts.join(' & ') : 'Pareja';
            }
            return String(raw);
        }

        /**
         * Generates and formats the official sports chronicle with rich magazine UI and WhatsApp ready text.
         */
        static generatePressChronicle(matchesArg, eventDocArg) {
            const chronicleBox = document.getElementById('sp-chronicle-box');
            if (!chronicleBox) return;

            const matches = matchesArg || window.ControlTowerStats.lastMatches || window.ControlTowerView?.allMatches || [];
            const eventDoc = eventDocArg || window.ControlTowerStats.lastEventDoc || window.ControlTowerView?.currentAmericanaDoc || {};

            let ranking = window.ControlTowerStats.lastRankingData || [];
            const isEntreno = !!eventDoc?.isEntreno;
            const isSwiss = !!(eventDoc?.pair_mode === 'swiss' || (eventDoc?.name || '').toUpperCase().includes('SUIZ'));
            const isFija = !isSwiss && !!(eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA'));

            if ((!ranking || ranking.length === 0) && window.StandingsService && matches.length > 0) {
                ranking = window.StandingsService.calculate(matches, isSwiss ? 'swiss' : (isEntreno ? 'entreno' : 'americana'), isFija, eventDoc?.players || [], isSwiss);
                window.ControlTowerStats.lastRankingData = ranking;
            }

            const rawEventName = (eventDoc?.name || 'Torneo de Pádel').trim();
            const humanDate = this.formatHumanDate(eventDoc?.date || 'Hoy');

            const finishedMatches = (matches || []).filter(m => 
                m.status === 'finished' || m.status === 'finalizado' || (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0
            );

            if (!ranking || ranking.length === 0 || finishedMatches.length === 0) {
                chronicleBox.innerHTML = `
                    <div style="padding: 28px; text-align: center; color: #94a3b8;">
                        <i class="fas fa-info-circle" style="font-size: 2.2rem; margin-bottom: 12px; color: #CCFF00;"></i>
                        <div style="font-weight: 800; font-size: 0.95rem; color: #f8fafc;">Aún no hay suficientes datos para redactar la crónica.</div>
                        <div style="font-size: 0.76rem; color: #64748b; margin-top: 6px;">Confirma los resultados de los partidos disputados para generar la edición de prensa.</div>
                        <button class="sp-btn-close-chronicle" onclick="window.ControlTowerStats.closeChronicle()" style="margin: 16px auto 0;">CERRAR</button>
                    </div>
                `;
                chronicleBox.style.display = 'block';
                return;
            }

            const champion = ranking[0] || { name: 'Campeón', points: 0, won: 0, played: 0 };
            const subchampion = ranking[1] || null;
            const third = ranking[2] || null;

            // 1. Top Cañonero
            const topScorer = [...ranking].sort((a, b) => b.points - a.points)[0] || champion;

            // 2. Muro Defensivo
            const bestDefense = [...ranking]
                .filter(p => (p.played || 0) > 0)
                .sort((a, b) => ((a.gamesLost || 0) / (a.played || 1)) - ((b.gamesLost || 0) / (b.played || 1)))[0] || champion;
            const avgConceded = (bestDefense.played || 0) > 0 ? (((bestDefense.gamesLost || 0) / bestDefense.played)).toFixed(1) : '0.0';

            // 3. Duelo Épico (Partido más apretado)
            let epicMatch = null;
            let minDiff = 999;
            finishedMatches.forEach(m => {
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                const diff = Math.abs(scA - scB);
                if (scA + scB > 0 && diff < minDiff) {
                    minDiff = diff;
                    epicMatch = m;
                }
            });

            const totalGames = finishedMatches.reduce((acc, m) => acc + (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)), 0);
            const avgGamesPerMatch = finishedMatches.length > 0 ? (totalGames / finishedMatches.length).toFixed(1) : '0.0';
            const winPct = champion.played > 0 ? Math.round((champion.won / champion.played) * 100) : 100;
            const championInitials = this.getInitials(champion.name);

            const teamANames = epicMatch ? this.formatTeamNames(epicMatch.team_a_names) : 'Pareja A';
            const teamBNames = epicMatch ? this.formatTeamNames(epicMatch.team_b_names) : 'Pareja B';
            const cleanEventName = rawEventName;

            // Titulares Periodísticos
            const headline = `${champion.name} lidera una jornada frenética de ${totalGames} juegos y máxima entrega`;
            const subheadline = `Crónica oficial de ${cleanEventName}: ${finishedMatches.length} partidos al límite, podio disputado hasta la última bola y un ambiente inmejorable.`;

            // HTML Layout
            let html = `
                <!-- CABECERA EDITORIAL & PRENSA -->
                <div class="sp-chronicle-header">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <div class="sp-chronicle-badge">
                            <i class="fas fa-newspaper"></i>
                            <span>SOMOSPADEL PRESS • CRÓNICA OFICIAL</span>
                        </div>
                        <div class="sp-chronicle-date-tag">
                            <i class="far fa-calendar-alt"></i>
                            <span>${humanDate}</span>
                        </div>
                    </div>
                    <button class="sp-chronicle-close-btn" onclick="window.ControlTowerStats.closeChronicle()" title="Cerrar crónica">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- TITULAR PERIODÍSTICO -->
                <div class="sp-chronicle-headline-wrap">
                    <h2 class="sp-chronicle-headline">${headline}</h2>
                    <p class="sp-chronicle-subheadline">${subheadline}</p>
                </div>

                <!-- HERO CARD: MVP / PORTADA -->
                <div class="sp-hero-mvp">
                    <div class="sp-hero-badge">
                        <i class="fas fa-crown"></i>
                        <span>MVP DE LA JORNADA</span>
                    </div>
                    <div class="sp-hero-profile">
                        <div class="sp-hero-avatar">
                            <span>${championInitials}</span>
                            <div class="sp-hero-crown">👑</div>
                        </div>
                        <div class="sp-hero-info">
                            <div class="sp-hero-name">${champion.name}</div>
                            <div class="sp-hero-editorial">
                                ${isEntreno 
                                    ? 'Dominio y temple de hierro en la Pista 1. Supo gestionar cada punto clave bajo máxima exigencia para alzarse con la primera posición indiscutible.'
                                    : 'Actuación sobresaliente de principio a fin. Mantuvo una regularidad férrea en todos sus partidos para coronar la cima de la tabla general.'}
                            </div>
                            <div class="sp-hero-chips">
                                <div class="sp-hero-chip gold">
                                    <i class="fas fa-trophy"></i>
                                    <span>${champion.won} VICTORIAS</span>
                                </div>
                                <div class="sp-hero-chip volt">
                                    <i class="fas fa-meteor"></i>
                                    <span>${champion.points} JUEGOS GANADOS</span>
                                </div>
                                <div class="sp-hero-chip cyan">
                                    <i class="fas fa-chart-pie"></i>
                                    <span>${winPct}% EFECTIVIDAD</span>
                                </div>
                                ${champion.court1Count > 0 ? `
                                <div class="sp-hero-chip" style="background: rgba(168, 85, 247, 0.16); border-color: rgba(168, 85, 247, 0.45); color: #c084fc;">
                                    <i class="fas fa-star"></i>
                                    <span>${champion.court1Count} PARTIDOS EN PISTA 1</span>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RELATO PERIODÍSTICO -->
                <div class="sp-chronicle-narrative">
                    <p>
                        El ambiente vivido en <strong>${cleanEventName}</strong> fue puro espectáculo de pádel. A lo largo de los <strong>${finishedMatches.length} partidos oficiales</strong> y los <strong>${totalGames} juegos disputados</strong> (con una media de <strong>${avgGamesPerMatch} juegos por encuentro</strong>), la intensidad y la paridad marcaron cada turno de juego. Los intercambios vertiginosos en la red y la entrega defensiva levantaron la admiración de los asistentes en una jornada donde cada punto se peleó con el alma.
                    </p>
                    <p>
                        La pugna por las posiciones de vanguardia se decidió por detalles milimétricos. Mientras <strong>${champion.name}</strong> consolidaba su posición de privilegio con aplomo y solidez${isEntreno ? ' en la Pista 1' : ''}, la batalla por los puestos de escolta mantuvo en vilo a toda la pista, ratificando el altísimo nivel competitivo y el excelente estado de forma de los jugadores.
                    </p>
                </div>

                <!-- GRID DE DESTACADOS (HIGHLIGHTS CARDS) -->
                <div class="sp-chronicle-highlights">
                    <!-- PODIO & ESCOLTAS -->
                    <div class="sp-hl-card">
                        <div>
                            <div class="sp-hl-header">
                                <div class="sp-hl-icon" style="background: rgba(148, 163, 184, 0.15); color: #cbd5e1;">
                                    🥈
                                </div>
                                <div>
                                    <div class="sp-hl-tag" style="color: #94a3b8;">Escoltas de Honor</div>
                                    <div class="sp-hl-name">${subchampion ? subchampion.name : 'Podio'} ${third ? `& ${third.name}` : ''}</div>
                                </div>
                            </div>
                            <div class="sp-hl-desc" style="margin-top: 10px;">
                                ${subchampion && third 
                                    ? `Lucha titánica hasta el último juego entre <strong>${subchampion.name}</strong> (${subchampion.won}V, ${subchampion.points} pts) y <strong>${third.name}</strong> (${third.won}V, ${third.points} pts), demostrando una regularidad y entereza encomiables.`
                                    : (subchampion ? `<strong>${subchampion.name}</strong> completó una jornada de enorme mérito con ${subchampion.won} victorias y ${subchampion.points} puntos conquistados.` : 'Gran paridad en la zona noble de la clasificación.')}
                            </div>
                        </div>
                        <div class="sp-hl-badge" style="background: rgba(148, 163, 184, 0.12); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.25);">
                            🥈🥉 Podio Disputado al Límite
                        </div>
                    </div>

                    <!-- EL CAÑONERO -->
                    <div class="sp-hl-card">
                        <div>
                            <div class="sp-hl-header">
                                <div class="sp-hl-icon" style="background: rgba(0, 240, 255, 0.15); color: #00F0FF;">
                                    ⚡
                                </div>
                                <div>
                                    <div class="sp-hl-tag" style="color: #00F0FF;">Top Cañonero</div>
                                    <div class="sp-hl-name">${topScorer.name}</div>
                                </div>
                            </div>
                            <div class="sp-hl-desc" style="margin-top: 10px;">
                                El brazo más certero y afilado de la competición. Su contundencia ofensiva y pegada letal en los momentos decisivos le permitieron romper las defensas rivales.
                            </div>
                        </div>
                        <div class="sp-hl-badge" style="background: rgba(0, 240, 255, 0.12); color: #00F0FF; border: 1px solid rgba(0, 240, 255, 0.25);">
                            ⚡ ${topScorer.points} Juegos a Favor
                        </div>
                    </div>

                    <!-- EL MURO DEFENSIVO -->
                    <div class="sp-hl-card">
                        <div>
                            <div class="sp-hl-header">
                                <div class="sp-hl-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
                                    🛡️
                                </div>
                                <div>
                                    <div class="sp-hl-tag" style="color: #10b981;">Muro Defensivo</div>
                                    <div class="sp-hl-name">${bestDefense.name}</div>
                                </div>
                            </div>
                            <div class="sp-hl-desc" style="margin-top: 10px;">
                                Auténtico bastión en el fondo de pista. Su colocación milimétrica, templanza y control de las paredes le convirtieron en la defensa más hermética del torneo.
                            </div>
                        </div>
                        <div class="sp-hl-badge" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);">
                            🔒 ${avgConceded} Encajados / Partido
                        </div>
                    </div>

                    <!-- EL DUELO ÉPICO -->
                    <div class="sp-hl-card">
                        <div>
                            <div class="sp-hl-header">
                                <div class="sp-hl-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
                                    ⚔️
                                </div>
                                <div>
                                    <div class="sp-hl-tag" style="color: #f59e0b;">El Duelo Épico</div>
                                    <div class="sp-hl-name">${epicMatch ? `Pista ${epicMatch.court}` : 'Duelo de la Jornada'}</div>
                                </div>
                            </div>
                            <div class="sp-hl-desc" style="margin-top: 10px;">
                                ${epicMatch 
                                    ? `<strong>${teamANames}</strong> vs <strong>${teamBNames}</strong>. Choque electrizante resuelto por detalles milimétricos con un emocionante <strong>${epicMatch.score_a} - ${epicMatch.score_b}</strong> donde ninguna dupla cedió un palmo de pista.`
                                    : 'Choques equilibrados en todas las pistas, obligando a definir cada partido en puntos de oro.'}
                            </div>
                        </div>
                        <div class="sp-hl-badge" style="background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25);">
                            ${epicMatch ? `⚔️ Marcador ${epicMatch.score_a} - ${epicMatch.score_b}` : '🔥 Gran Paridad'}
                        </div>
                    </div>
                </div>

                <!-- CÁPSULA DE COMUNIDAD & NIVEL -->
                <div class="sp-chronicle-community">
                    <div class="sp-comm-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div>
                        <div class="sp-comm-title">🤝 Espíritu SomosPadel BCN & Nivel Oficial</div>
                        <div class="sp-comm-desc">
                            Enorme felicitación a todos los jugadores por su impecable fair play, compañerismo y entrega en cada juego. El rendimiento y tanteos de esta jornada han sido computados en el sistema para la actualización del <strong>Nivel Oficial SomosPadel</strong>. ¡El pádel que nos une sigue creciendo!
                        </div>
                    </div>
                </div>

                <!-- BARRA DE ACCIONES -->
                <div class="sp-chronicle-actions">
                    <button class="sp-btn-wp-chronicle" onclick="window.ControlTowerStats.shareWhatsAppChronicle()">
                        <i class="fab fa-whatsapp" style="font-size: 1rem;"></i>
                        <span>COMPARTIR EN WHATSAPP</span>
                    </button>
                    <button class="sp-btn-copy-chronicle" onclick="window.ControlTowerStats.copyChronicle(this)">
                        <i class="fas fa-copy"></i>
                        <span>COPIAR CRÓNICA</span>
                    </button>
                    <button class="sp-btn-close-chronicle" onclick="window.ControlTowerStats.closeChronicle()">
                        <i class="fas fa-times"></i>
                        <span>CERRAR CRÓNICA</span>
                    </button>
                </div>
            `;

            // TEXTO OPTIMIZADO PARA WHATSAPP
            let wpText = `🎾🔥 *SOMOSPADEL PRESS • CRÓNICA OFICIAL* 🔥🎾\n`;
            wpText += `━━━━━━━━━━━━━━━━━━━━\n`;
            wpText += `🏆 *${cleanEventName.toUpperCase()}*\n`;
            wpText += `📅 *Fecha:* ${humanDate}\n`;
            wpText += `📊 *Balance:* ${finishedMatches.length} partidos oficiales | ${totalGames} juegos disputados (media ${avgGamesPerMatch}/partido)\n\n`;

            wpText += `👑 *MVP & LÍDER INDISCUTIBLE: ${champion.name.toUpperCase()}*\n`;
            wpText += `Exhibición magistral de principio a fin. Se corona en lo más alto de la clasificación sumando *${champion.points} puntos*, *${champion.won} victorias* (efectividad del *${winPct}%*)${champion.court1Count > 0 ? ` y *${champion.court1Count} presencias en Pista 1*` : ''}. ¡Enhorabuena por el liderato!\n\n`;

            if (subchampion || third) {
                wpText += `🥈🥉 *PODIO Y ESCOLTAS DE HONOR*\n`;
                if (subchampion) wpText += `• 2º Puesto: *${subchampion.name}* (${subchampion.won}V - ${subchampion.points} pts)\n`;
                if (third) wpText += `• 3º Puesto: *${third.name}* (${third.won}V - ${third.points} pts)\n`;
                wpText += `Una batalla titánica hasta el último juego por las posiciones de honor del torneo.\n\n`;
            }

            wpText += `🌟 *CUADRO DE HONOR Y HIGHLIGHTS*\n`;
            wpText += `⚡ *Top Cañonero:* *${topScorer.name}* con *${topScorer.points} juegos a favor*.\n`;
            wpText += `🛡️ *Muro Defensivo:* *${bestDefense.name}* con solo *${avgConceded} juegos encajados/partido*.\n`;
            if (epicMatch) {
                wpText += `⚔️ *Duelo Más Reñido:* ${teamANames} (${epicMatch.score_a}) vs ${teamBNames} (${epicMatch.score_b}) [Pista ${epicMatch.court} • Ronda ${epicMatch.round}]\n`;
            }
            wpText += `\n━━━━━━━━━━━━━━━━━━━━\n`;
            wpText += `🤝 *Espíritu SomosPadel:* ¡Gracias a todos por el excepcional fair play, la deportividad y la pasión derrochada en cada punto! Los resultados ya están computados en el sistema para la actualización del *Nivel Oficial SomosPadel BCN*. 🚀💪\n\n`;
            wpText += `🎾 *SomosPadel Barcelona • Más que pádel, una comunidad.*`;

            window.ControlTowerStats.currentChronicleText = wpText;
            chronicleBox.innerHTML = html;
            chronicleBox.style.display = 'block';
            chronicleBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        static copyChronicle(btnElement) {
            const text = window.ControlTowerStats.currentChronicleText || '';
            if (!text) return;

            const triggerFeedback = () => {
                if (btnElement) {
                    const originalHtml = btnElement.innerHTML;
                    btnElement.innerHTML = '<i class="fas fa-check"></i> <span>¡COPIADO!</span>';
                    btnElement.style.background = '#10b981';
                    btnElement.style.color = '#ffffff';
                    setTimeout(() => {
                        btnElement.innerHTML = originalHtml;
                        btnElement.style.background = '';
                        btnElement.style.color = '';
                    }, 2200);
                }
                if (window.PremiumModal && typeof window.PremiumModal.alert === 'function') {
                    window.PremiumModal.alert({ title: '✅ CRÓNICA COPIADA', message: 'La crónica oficial ha sido copiada con formato especial para WhatsApp.' });
                }
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    triggerFeedback();
                }).catch(() => {
                    ControlTowerStats._fallbackCopy(text);
                    triggerFeedback();
                });
            } else {
                ControlTowerStats._fallbackCopy(text);
                triggerFeedback();
            }
        }

        static _fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '0';
            ta.style.left = '0';
            ta.style.width = '2em';
            ta.style.height = '2em';
            ta.style.padding = '0';
            ta.style.border = 'none';
            ta.style.outline = 'none';
            ta.style.boxShadow = 'none';
            ta.style.background = 'transparent';
            ta.style.fontSize = '16px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            if (typeof ta.setSelectionRange === 'function') {
                ta.setSelectionRange(0, 999999);
            }
            try {
                document.execCommand('copy');
            } catch (e) {}
            document.body.removeChild(ta);
        }

        static shareWhatsAppChronicle() {
            const text = window.ControlTowerStats.currentChronicleText || '';
            if (!text) return;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    }

    window.ControlTowerStats = ControlTowerStats;
})();
