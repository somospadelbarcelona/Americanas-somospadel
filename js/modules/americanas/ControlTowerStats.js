/**
 * ControlTowerStats.js
 * Sub-module for rendering advanced sports analytics, awards and official tournament press chronicles.
 * Version: 5.1 Press & Sports Analytics Edition (SomosPadel BCN)
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
            const isFija = !!(eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA'));
            const ranking = window.StandingsService.calculate(matches, isEntreno ? 'entreno' : 'americana', isFija, eventDoc?.players || []);
            window.ControlTowerStats.lastRankingData = ranking;

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

                    /* Press Chronicle Display Card */
                    .sp-chronicle-card {
                        display: none;
                        background: linear-gradient(145deg, #070c18 0%, #0d1629 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.4);
                        border-radius: 22px;
                        padding: 22px;
                        color: #ffffff;
                        margin-bottom: 24px;
                        box-shadow: 0 15px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(204, 255, 0, 0.15);
                        animation: spFadeInUp 0.4s ease-out both;
                    }
                    @keyframes spFadeInUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .sp-chronicle-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        padding-bottom: 12px;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .sp-chronicle-badge {
                        background: #CCFF00;
                        color: #000000;
                        font-size: 0.68rem;
                        font-weight: 950;
                        padding: 4px 12px;
                        border-radius: 8px;
                        letter-spacing: 1px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 0 14px rgba(204, 255, 0, 0.4);
                    }
                    .sp-chronicle-sub {
                        font-size: 0.65rem;
                        font-weight: 800;
                        color: rgba(255, 255, 255, 0.55);
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }

                    /* Rich Chronicle Content */
                    .sp-chronicle-body {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .sp-chronicle-lead {
                        font-size: 0.86rem;
                        line-height: 1.6;
                        color: #e2e8f0;
                        margin-bottom: 4px;
                    }
                    .sp-chronicle-box {
                        border-radius: 12px;
                        padding: 12px 14px;
                        margin-bottom: 2px;
                    }
                    .sp-chronicle-box.gold {
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(10, 16, 30, 0.8) 100%);
                        border-left: 4px solid #f59e0b;
                    }
                    .sp-chronicle-box.silver {
                        background: linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(10, 16, 30, 0.8) 100%);
                        border-left: 4px solid #94a3b8;
                    }
                    .sp-chronicle-box.cyan {
                        background: linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(10, 16, 30, 0.8) 100%);
                        border-left: 4px solid #00F0FF;
                    }
                    .sp-chronicle-box.footer-box {
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #cbd5e1;
                        font-size: 0.78rem;
                        line-height: 1.5;
                    }
                    .sp-box-title {
                        font-size: 0.7rem;
                        font-weight: 950;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }
                    .sp-chronicle-box.gold .sp-box-title { color: #fbbf24; }
                    .sp-chronicle-box.silver .sp-box-title { color: #cbd5e1; }
                    .sp-chronicle-box.cyan .sp-box-title { color: #00F0FF; }

                    .sp-box-name {
                        font-size: 0.95rem;
                        font-weight: 950;
                        color: #ffffff;
                        text-transform: uppercase;
                        margin-bottom: 3px;
                    }
                    .sp-box-desc {
                        font-size: 0.78rem;
                        color: rgba(255, 255, 255, 0.85);
                        line-height: 1.45;
                    }
                    .sp-stat-tag {
                        background: rgba(204, 255, 0, 0.18);
                        border: 1px solid rgba(204, 255, 0, 0.4);
                        color: #CCFF00;
                        padding: 1px 6px;
                        border-radius: 4px;
                        font-weight: 900;
                        font-size: 0.72rem;
                        margin: 0 2px;
                    }
                    .sp-stat-pill {
                        background: rgba(0, 240, 255, 0.18);
                        border: 1px solid rgba(0, 240, 255, 0.4);
                        color: #00F0FF;
                        padding: 1px 6px;
                        border-radius: 4px;
                        font-weight: 900;
                        font-size: 0.72rem;
                        margin: 0 2px;
                    }

                    .sp-chronicle-actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 18px;
                        flex-wrap: wrap;
                    }
                    .sp-btn-copy-chronicle {
                        background: #CCFF00;
                        color: #000000;
                        border: none;
                        padding: 9px 18px;
                        border-radius: 10px;
                        font-size: 0.75rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    }
                    .sp-btn-copy-chronicle:hover {
                        background: #b8e600;
                        transform: translateY(-1px);
                    }
                    .sp-btn-wp-chronicle {
                        background: #25D366;
                        color: #ffffff;
                        border: none;
                        padding: 9px 18px;
                        border-radius: 10px;
                        font-size: 0.75rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
                        transition: all 0.2s;
                    }
                    .sp-btn-wp-chronicle:hover {
                        background: #22bf5b;
                        transform: translateY(-1px);
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

                    <!-- PRESS CHRONICLE DISPLAY CARD -->
                    <div id="sp-chronicle-box" class="sp-chronicle-card">
                        <div class="sp-chronicle-header">
                            <div class="sp-chronicle-badge">
                                <i class="fas fa-newspaper"></i>
                                <span>SOMOSPADEL PRESS</span>
                            </div>
                            <span class="sp-chronicle-sub">EDICIÓN PERIODÍSTICA OFICIAL • SOMOSPADEL BCN</span>
                        </div>
                        <div id="sp-chronicle-content" class="sp-chronicle-body">
                            <!-- Populated with rich formatted HTML -->
                        </div>
                        <div class="sp-chronicle-actions">
                            <button class="sp-btn-copy-chronicle" onclick="window.ControlTowerStats.copyChronicle()">
                                <i class="fas fa-copy"></i> COPIAR TEXTO WHATSAPP
                            </button>
                            <button class="sp-btn-wp-chronicle" onclick="window.ControlTowerStats.shareWhatsAppChronicle()">
                                <i class="fab fa-whatsapp"></i> COMPARTIR EN WHATSAPP
                            </button>
                        </div>
                    </div>

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
                                <div class="sp-award-metric">${(bestDefense.gamesLost / (bestDefense.played || 1)).toFixed(1)} encajados / partido</div>
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
                                    ${epicMatch ? `${(epicMatch.team_a_names || []).join('&')} vs ${(epicMatch.team_b_names || []).join('&')}` : 'Sin partidos'}
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
         * Generates and formats the official sports chronicle with rich magazine UI and WhatsApp ready text.
         */
        static generatePressChronicle() {
            const chronicleBox = document.getElementById('sp-chronicle-box');
            const chronicleContent = document.getElementById('sp-chronicle-content');
            if (!chronicleBox || !chronicleContent) return;

            const ranking = window.ControlTowerStats.lastRankingData || [];
            const eventDoc = window.ControlTowerView?.currentAmericanaDoc;
            const matches = window.ControlTowerView?.allMatches || [];
            const eventName = eventDoc?.name || 'Torneo de Pádel';
            const eventDate = eventDoc?.date || 'Hoy';

            if (ranking.length === 0) {
                chronicleContent.innerHTML = "<div style='color:#94a3b8; font-style:italic;'>Aún no hay suficientes datos para redactar la crónica del evento.</div>";
                chronicleBox.style.display = 'block';
                return;
            }

            const champion = ranking[0];
            const subchampion = ranking[1];
            const third = ranking[2];
            const topScorer = [...ranking].sort((a, b) => b.points - a.points)[0];
            const totalGames = matches.reduce((acc, m) => acc + (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)), 0);

            // 1. RICH MAGAZINE HTML VIEW FOR ON-SCREEN READING
            let html = `
                <div class="sp-chronicle-lead">
                    ¡Jornada de pádel de máxima intensidad en <strong>${eventName}</strong> (${eventDate})! Con un total de <span class="sp-stat-pill">${matches.length} partidos disputados</span> y <span class="sp-stat-pill">${totalGames} juegos disputados</span>, la competición nos ha dejado duelos espectaculares y un nivel altísimo.
                </div>
            `;

            if (champion) {
                html += `
                    <div class="sp-chronicle-box gold">
                        <div class="sp-box-title">🏆 Líder de la Jornada</div>
                        <div class="sp-box-name">${champion.name}</div>
                        <div class="sp-box-desc">
                            Se corona en lo más alto de la clasificación general con una actuación impecable de <span class="sp-stat-tag">${champion.points} PUNTOS</span> y <span class="sp-stat-tag">${champion.won} VICTORIAS</span>.
                        </div>
                    </div>
                `;
            }

            if (subchampion && third) {
                html += `
                    <div class="sp-chronicle-box silver">
                        <div class="sp-box-title">🥈🥉 Podio de Honor</div>
                        <div class="sp-box-desc">
                            La batalla por los puestos de podio estuvo al rojo vivo, con <strong>${subchampion.name}</strong> y <strong>${third.name}</strong> demostrando una solidez y regularidad ejemplares durante todo el evento.
                        </div>
                    </div>
                `;
            }

            if (topScorer) {
                html += `
                    <div class="sp-chronicle-box cyan">
                        <div class="sp-box-title">⚡ Potencia en Pista</div>
                        <div class="sp-box-desc">
                            El cañonero de la jornada fue <strong>${topScorer.name}</strong>, rompiendo defensas rivales con un registro de <span class="sp-stat-tag">${topScorer.points} JUEGOS A FAVOR</span>.
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="sp-chronicle-box footer-box">
                    🤝 ¡Enorme enhorabuena a todos los participantes por el fair play, el compañerismo y la entrega demostrada en cada punto! ¡Nos vemos en la próxima cita deportiva de <strong>SomosPadel BCN</strong>! 🚀💪
                </div>
            `;

            // 2. WHATSAPP NATIVE MARKDOWN TEXT (For seamless WhatsApp sharing with bolding)
            let wpText = `🎾🔥 *CRÓNICA OFICIAL SOMOSPADEL BCN* 🔥🎾\n`;
            wpText += `📅 *Evento:* ${eventName} (${eventDate})\n\n`;
            wpText += `¡Jornada de pádel total y altísima intensidad en las pistas! Con un total de *${matches.length} partidos disputados* y *${totalGames} juegos anotados*, los jugadores lo dieron absolutamente todo.\n\n`;

            if (champion) {
                wpText += `🏆 *LÍDER INDISCUTIBLE:* Felicitaciones a *${champion.name.toUpperCase()}*, quien se corona en lo más alto de la clasificación sumando la impresionante cifra de *${champion.points} puntos* y *${champion.won} victorias*.\n\n`;
            }

            if (subchampion && third) {
                wpText += `🥈🥉 *PODIO DE HONOR:* La batalla por los puestos de plata y bronce estuvo al rojo vivo, con *${subchampion.name.toUpperCase()}* y *${third.name.toUpperCase()}* demostrando una solidez y consistencia ejemplares.\n\n`;
            }

            if (topScorer) {
                wpText += `⚡ *POTENCIA EN PISTA:* El cañonero de la jornada fue *${topScorer.name.toUpperCase()}*, rompiendo defensas con un total de *${topScorer.points} juegos a favor*.\n\n`;
            }

            wpText += `🤝 ¡Gracias a todos los participantes por el enorme fair play, el compañerismo y la pasión demostrada en cada punto! ¡Nos vemos en el próximo evento de *SomosPadel BCN*! 🚀💪`;

            window.ControlTowerStats.currentChronicleText = wpText;
            chronicleContent.innerHTML = html;
            chronicleBox.style.display = 'block';
            chronicleBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        static copyChronicle() {
            const text = window.ControlTowerStats.currentChronicleText || '';
            if (navigator.clipboard && text) {
                navigator.clipboard.writeText(text);
                if (window.PremiumModal) {
                    window.PremiumModal.alert({ title: '✅ CRÓNICA COPIADA', message: 'Texto copiado al portapapeles con formato para WhatsApp.' });
                } else {
                    alert('Crónica copiada al portapapeles.');
                }
            }
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
