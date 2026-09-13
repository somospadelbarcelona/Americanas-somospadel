/**
 * ControlTowerStandings.js
 * Sub-module for rendering world-class standings in ControlTowerView.
 * Version: 5.0 Professional Tournament & Pozo Edition (SomosPadel BCN)
 */
(function () {
    'use strict';

    class ControlTowerStandings {
        static render(matches, eventDoc) {
            if (!window.StandingsService) {
                return '<div style="padding:60px 20px; text-align:center; color:#64748b; font-family:Outfit,sans-serif;">Cargando servicio de posiciones...</div>';
            }

            const isEntreno = !!eventDoc?.isEntreno;
            const isFixedPairs = !!(eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA'));
            const ranking = window.StandingsService.calculate(matches || [], isEntreno ? 'entreno' : 'americana', isFixedPairs, eventDoc?.players || []);
            window.ControlTowerStandings.lastRankingData = ranking;

            const top1 = ranking[0] || null;
            const top2 = ranking[1] || null;
            const top3 = ranking[2] || null;

            // Robust avatar initials (Fixes AUNDEFINED bug)
            const getInitials = (name) => {
                if (!name || typeof name !== 'string') return 'SP';
                const parts = name.trim().split(/\s+/).filter(Boolean);
                if (parts.length >= 2 && parts[0] && parts[1] && parts[0][0] && parts[1][0]) {
                    return (parts[0][0] + parts[1][0]).toUpperCase();
                }
                const clean = name.trim();
                if (clean.length >= 2) return clean.substring(0, 2).toUpperCase();
                if (clean.length === 1) return clean.toUpperCase();
                return 'SP';
            };

            const getLevelColor = (lv) => {
                const num = parseFloat(lv) || 0;
                if (num >= 5.0) return '#ef4444';
                if (num >= 4.0) return '#f59e0b';
                if (num >= 3.0) return '#0ea5e9';
                return '#10b981';
            };

            return `
                <style>
                    .sp-standings-wrap {
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 12px 14px 40px;
                        background: #f8fafc;
                        min-height: 80vh;
                        box-sizing: border-box;
                    }

                    /* Header Actions */
                    .sp-standings-top-bar {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-between;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 16px;
                    }
                    .sp-standings-top-actions {
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    }
                    .sp-btn-nav-back {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        padding: 8px 14px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.72rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                        transition: all 0.2s;
                    }
                    .sp-btn-nav-back:hover {
                        background: #0f172a;
                        color: #ffffff;
                        border-color: #0f172a;
                    }
                    .sp-btn-rules {
                        background: linear-gradient(135deg, rgba(204, 255, 0, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%);
                        color: #0f172a;
                        border: 1px solid rgba(14, 165, 233, 0.4);
                        padding: 8px 14px;
                        border-radius: 12px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    }
                    .sp-btn-rules:hover {
                        background: #0f172a;
                        color: #CCFF00;
                        border-color: #0f172a;
                        transform: translateY(-1px);
                    }
                    .sp-btn-share-ranking {
                        background: #0f172a;
                        color: #ffffff;
                        border: 1px solid #0f172a;
                        padding: 8px 14px;
                        border-radius: 12px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
                        transition: all 0.2s;
                    }
                    .sp-btn-share-ranking:hover {
                        background: #1e293b;
                        transform: translateY(-1px);
                    }

                    /* Official Rules Banner */
                    .sp-rules-banner {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-left: 4px solid #CCFF00;
                        border-radius: 16px;
                        padding: 14px 16px;
                        margin-bottom: 18px;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
                    }
                    .sp-rules-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer;
                        user-select: none;
                    }
                    .sp-rules-header-title {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.78rem;
                        font-weight: 950;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .sp-rules-toggle-icon {
                        font-size: 0.75rem;
                        color: #64748b;
                        transition: transform 0.2s;
                    }
                    .sp-rules-body {
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 1px solid #f1f5f9;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                        gap: 12px;
                    }
                    .sp-rule-box {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 12px;
                    }
                    .sp-rule-box-header {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        color: #0f172a;
                        margin-bottom: 6px;
                        text-transform: uppercase;
                    }
                    .sp-rule-box-desc {
                        font-size: 0.7rem;
                        color: #475569;
                        line-height: 1.45;
                        margin: 0;
                    }

                    /* Olympic Podium */
                    .sp-podium-card {
                        background: linear-gradient(180deg, #0d1829 0%, #080f1d 100%);
                        border-radius: 24px;
                        padding: 22px 14px 18px;
                        color: #ffffff;
                        margin-bottom: 22px;
                        position: relative;
                        overflow: hidden;
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: 0 20px 45px rgba(10, 20, 35, 0.35);
                    }
                    .sp-podium-title {
                        text-align: center;
                        font-size: 0.72rem;
                        font-weight: 900;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        color: #CCFF00;
                        margin-bottom: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    .sp-podium-grid {
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        gap: 12px;
                    }
                    .sp-podium-col {
                        flex: 1;
                        max-width: 120px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    .sp-podium-avatar-wrap {
                        position: relative;
                        margin-bottom: 8px;
                    }
                    .sp-podium-avatar {
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 950;
                        color: #ffffff;
                        position: relative;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
                    }
                    .sp-podium-col.gold .sp-podium-avatar {
                        width: 62px;
                        height: 62px;
                        background: linear-gradient(135deg, #ffd700, #b8860b);
                        border: 3px solid #ffe866;
                        box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
                        font-size: 1.1rem;
                    }
                    .sp-podium-col.silver .sp-podium-avatar {
                        width: 52px;
                        height: 52px;
                        background: linear-gradient(135deg, #cbd5e1, #64748b);
                        border: 2.5px solid #e2e8f0;
                        box-shadow: 0 0 18px rgba(203, 213, 225, 0.4);
                        font-size: 0.95rem;
                    }
                    .sp-podium-col.bronze .sp-podium-avatar {
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #d97706, #92400e);
                        border: 2.5px solid #fbbf24;
                        box-shadow: 0 0 18px rgba(217, 119, 6, 0.4);
                        font-size: 0.9rem;
                    }
                    .sp-podium-crown {
                        position: absolute;
                        top: -14px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 1.1rem;
                        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
                    }
                    .sp-podium-badge-medal {
                        position: absolute;
                        bottom: -4px;
                        right: -4px;
                        width: 22px;
                        height: 22px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.72rem;
                        font-weight: 950;
                        border: 2px solid #0d1829;
                    }
                    .sp-podium-col.gold .sp-podium-badge-medal { background: #ffd700; color: #000; }
                    .sp-podium-col.silver .sp-podium-badge-medal { background: #cbd5e1; color: #000; }
                    .sp-podium-col.bronze .sp-podium-badge-medal { background: #d97706; color: #fff; }

                    .sp-podium-name {
                        font-size: 0.75rem;
                        font-weight: 900;
                        color: #ffffff;
                        line-height: 1.2;
                        max-width: 100px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        text-transform: uppercase;
                    }
                    .sp-podium-col.gold .sp-podium-name {
                        font-size: 0.82rem;
                        color: #CCFF00;
                    }
                    .sp-podium-score-pill {
                        margin-top: 4px;
                        font-size: 0.65rem;
                        font-weight: 800;
                        padding: 2px 8px;
                        border-radius: 10px;
                        background: rgba(255, 255, 255, 0.08);
                        color: rgba(255, 255, 255, 0.85);
                    }
                    .sp-podium-col.gold .sp-podium-score-pill {
                        background: rgba(204, 255, 0, 0.15);
                        border: 1px solid rgba(204, 255, 0, 0.4);
                        color: #CCFF00;
                        font-weight: 950;
                    }

                    /* Main Standings Table Card */
                    .sp-table-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
                    }
                    .sp-table-toolbar {
                        padding: 12px 16px;
                        background: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                    }
                    .sp-table-search {
                        position: relative;
                        flex: 1;
                        max-width: 260px;
                    }
                    .sp-table-search input {
                        width: 100%;
                        background: #ffffff;
                        border: 1px solid #cbd5e1;
                        border-radius: 10px;
                        padding: 6px 10px 6px 30px;
                        font-size: 0.75rem;
                        font-family: inherit;
                        color: #0f172a;
                        outline: none;
                        box-sizing: border-box;
                    }
                    .sp-table-search i {
                        position: absolute;
                        left: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #94a3b8;
                        font-size: 0.72rem;
                    }
                    .sp-legend-pills {
                        display: flex;
                        gap: 6px;
                        font-size: 0.62rem;
                        font-weight: 800;
                        color: #64748b;
                    }
                    .sp-legend-champions {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        background: rgba(14, 165, 233, 0.1);
                        color: #0284c7;
                        padding: 3px 8px;
                        border-radius: 6px;
                    }

                    /* Table Styles */
                    .sp-standings-table-wrap {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .sp-standings-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.75rem;
                        text-align: left;
                    }
                    .sp-standings-table th {
                        background: #f1f5f9;
                        color: #475569;
                        font-weight: 900;
                        padding: 10px 8px;
                        text-transform: uppercase;
                        font-size: 0.62rem;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #e2e8f0;
                        white-space: nowrap;
                    }
                    .sp-standings-table td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #f1f5f9;
                        color: #1e293b;
                        white-space: nowrap;
                    }
                    .sp-row-champions {
                        background: rgba(14, 165, 233, 0.04);
                    }
                    .sp-row-gold {
                        background: rgba(254, 240, 138, 0.15);
                    }

                    .sp-col-pos {
                        font-weight: 950;
                        text-align: center;
                        width: 44px;
                        font-size: 0.85rem;
                    }
                    .sp-trend-icon {
                        font-size: 0.6rem;
                        margin-left: 2px;
                    }
                    .trend-up { color: #10b981; }
                    .trend-down { color: #ef4444; }
                    .trend-same { color: #94a3b8; }

                    .sp-col-player {
                        min-width: 170px;
                    }
                    .sp-player-cell {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .sp-table-avatar {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: #0f172a;
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 800;
                        font-size: 0.68rem;
                        flex-shrink: 0;
                    }
                    .sp-table-player-name {
                        font-weight: 800;
                        color: #0f172a;
                        text-transform: uppercase;
                        line-height: 1.15;
                    }
                    .sp-table-level-badge {
                        font-size: 0.6rem;
                        font-weight: 900;
                        padding: 1px 5px;
                        border-radius: 4px;
                        color: #ffffff;
                        display: inline-block;
                        margin-top: 2px;
                    }

                    .sp-col-num {
                        text-align: center;
                        font-weight: 700;
                    }
                    .sp-col-pts {
                        text-align: center;
                        font-weight: 950;
                        font-size: 0.95rem;
                        color: #0f172a;
                    }
                    .sp-diff-pos { color: #10b981; font-weight: 800; }
                    .sp-diff-neg { color: #ef4444; font-weight: 800; }
                    .sp-diff-zero { color: #94a3b8; }

                    .sp-efic-bar-wrap {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .sp-efic-bar-track {
                        width: 45px;
                        height: 6px;
                        background: #e2e8f0;
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    .sp-efic-bar-fill {
                        height: 100%;
                        border-radius: 6px;
                    }

                    /* Modal de Normas */
                    .sp-rules-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(15, 23, 42, 0.8);
                        backdrop-filter: blur(8px);
                        z-index: 99999;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        padding: 16px;
                        box-sizing: border-box;
                    }
                    .sp-rules-modal-card {
                        background: #ffffff;
                        width: 100%;
                        max-width: 520px;
                        max-height: 88vh;
                        border-radius: 22px;
                        overflow-y: auto;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
                        border: 1px solid #e2e8f0;
                        display: flex;
                        flex-direction: column;
                        animation: spFadeInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    @keyframes spFadeInModal {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .sp-rules-modal-header {
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        color: #ffffff;
                        padding: 16px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        position: sticky;
                        top: 0;
                        z-index: 2;
                    }
                    .sp-rules-modal-header h3 {
                        margin: 0;
                        font-size: 0.9rem;
                        font-weight: 950;
                        letter-spacing: 0.5px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #CCFF00;
                    }
                    .sp-rules-modal-close {
                        background: rgba(255, 255, 255, 0.15);
                        border: none;
                        color: #ffffff;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.85rem;
                        transition: all 0.2s;
                    }
                    .sp-rules-modal-close:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                    .sp-rules-modal-content {
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }
                </style>

                <div class="sp-standings-wrap">
                    <!-- TOP CONTROLS -->
                    <div class="sp-standings-top-bar">
                        <button class="sp-btn-nav-back" onclick="window.ControlTowerView.switchTab('results')">
                            <i class="fas fa-arrow-left"></i>
                            <span>VER RESULTADOS</span>
                        </button>
                        <div class="sp-standings-top-actions">
                            <button class="sp-btn-rules" onclick="window.ControlTowerStandings.toggleRulesModal(true)">
                                <i class="fas fa-book-open"></i>
                                <span>${isEntreno ? 'NORMAS DEL ENTRENO' : 'REGLAS OFICIALES'}</span>
                            </button>
                            <button class="sp-btn-share-ranking" onclick="window.ControlTowerStandings.shareStandings(window.ControlTowerStandings.lastRankingData, window.ControlTowerView?.currentAmericanaDoc)">
                                <i class="fas fa-share-alt"></i>
                                <span>COMPARTIR</span>
                            </button>
                        </div>
                    </div>

                    <!-- BANNER NORMAS Y REGLAS OFICIALES -->
                    <div class="sp-rules-banner" id="sp-rules-banner-card">
                        <div class="sp-rules-header" onclick="window.ControlTowerStandings.toggleRulesBanner()">
                            <div class="sp-rules-header-title">
                                <i class="fas fa-award" style="color:#0284c7;"></i>
                                <span>${isEntreno ? 'NORMAS DEL ENTRENO Y REGLAS DE PUNTUACIÓN' : 'NORMAS OFICIALES DEL TORNEO'}</span>
                            </div>
                            <div class="sp-rules-toggle-icon" id="sp-rules-toggle-icon">
                                <i class="fas fa-chevron-up"></i>
                            </div>
                        </div>
                        <div class="sp-rules-body" id="sp-rules-body-content">
                            <div class="sp-rule-box">
                                <div class="sp-rule-box-header">
                                    <span style="font-size:1.1rem;">🎯</span>
                                    <span>1. Objetivo del Entreno</span>
                                </div>
                                <p class="sp-rule-box-desc">
                                    Mejorar nuestro nivel de juego individual y <strong>ayudar a mejorar el nivel a los compañeros de entreno</strong> en cada punto y partido con el máximo compañerismo.
                                </p>
                            </div>

                            <div class="sp-rule-box">
                                <div class="sp-rule-box-header">
                                    <span style="font-size:1.1rem;">👑</span>
                                    <span>2. Disputar la Victoria (Pista 1)</span>
                                </div>
                                <p class="sp-rule-box-desc">
                                    Intentar <strong>alcanzar la Pista 1 en el último partido del entreno</strong> para poder disputar la victoria del entreno, que sólo sirve de <strong>forma anecdótica</strong> para marcar un objetivo motivador durante la sesión.
                                </p>
                            </div>

                            <div class="sp-rule-box">
                                <div class="sp-rule-box-header">
                                    <span style="font-size:1.1rem;">📈</span>
                                    <span>3. Tu Nivel Oficial SomosPadel</span>
                                </div>
                                <p class="sp-rule-box-desc">
                                    Nuestros <strong>partidos ganados y perdidos</strong>, y nuestros <strong>juegos ganados y perdidos</strong>, se reflejan directamente en nuestro <strong>nivel de jugador</strong> en la app de SomosPadelBarcelona. Puedes consultar tu nivel, el de los compañeros, tablas de logros y ránkings oficiales.
                                </p>
                            </div>

                            <div class="sp-rule-box" style="border-left: 3px solid #0284c7; background: #f0fdf4;">
                                <div class="sp-rule-box-header" style="color:#0369a1;">
                                    <span style="font-size:1.1rem;">⚖️</span>
                                    <span>Clasificación & Desempates</span>
                                </div>
                                <p class="sp-rule-box-desc" style="color:#0f172a;">
                                    <strong>1º Criterio:</strong> Partidos Ganados totales (PG).<br>
                                    <strong>En caso de empate a victorias:</strong> 1º Victoria último partido Pista 1 • 2º Pista final disputada • 3º Ganador última pista • 4º Veces en P1 • 5º Dif. Juegos • 6º Puntos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- MODAL COMPLETO DE NORMAS (ACCESIBLE POR BOTÓN) -->
                    <div id="sp-rules-modal-overlay" class="sp-rules-modal-overlay" onclick="if(event.target === this) window.ControlTowerStandings.toggleRulesModal(false)">
                        <div class="sp-rules-modal-card">
                            <div class="sp-rules-modal-header">
                                <h3>
                                    <i class="fas fa-book-open"></i>
                                    <span>${isEntreno ? 'NORMAS DEL ENTRENO • SOMOSPADEL BCN' : 'REGLAS OFICIALES • SOMOSPADEL BCN'}</span>
                                </h3>
                                <button class="sp-rules-modal-close" onclick="window.ControlTowerStandings.toggleRulesModal(false)">✕</button>
                            </div>
                            <div class="sp-rules-modal-content">
                                <div class="sp-rule-box" style="border-left: 4px solid #10b981;">
                                    <div class="sp-rule-box-header" style="color:#065f46;">
                                        <span style="font-size:1.2rem;">🎯</span>
                                        <span style="font-size:0.82rem;">1. OBJETIVO FORMATIVO Y COMPAÑERISMO</span>
                                    </div>
                                    <p class="sp-rule-box-desc" style="font-size:0.76rem;">
                                        El objetivo primordial del entreno es mejorar nuestro nivel de juego y ayudar a mejorar el nivel a los compañeros de entreno. El respeto, el fair play y el buen ambiente en pista son la máxima prioridad de SomosPadel Barcelona.
                                    </p>
                                </div>

                                <div class="sp-rule-box" style="border-left: 4px solid #f59e0b;">
                                    <div class="sp-rule-box-header" style="color:#92400e;">
                                        <span style="font-size:1.2rem;">👑</span>
                                        <span style="font-size:0.82rem;">2. ALCANZAR LA PISTA 1 EN EL ÚLTIMO PARTIDO</span>
                                    </div>
                                    <p class="sp-rule-box-desc" style="font-size:0.76rem;">
                                        Intentar alcanzar la <strong>Pista 1 en el último partido del entreno</strong> para poder disputar la victoria del entreno. Esta victoria sólo sirve de <strong>forma anecdótica</strong> para marcar un objetivo motivador y dinámico durante la sesión.
                                    </p>
                                </div>

                                <div class="sp-rule-box" style="border-left: 4px solid #0284c7;">
                                    <div class="sp-rule-box-header" style="color:#0369a1;">
                                        <span style="font-size:1.2rem;">📈</span>
                                        <span style="font-size:0.82rem;">3. REFLEJO EN TU NIVEL, LOGROS Y RÁNKINGS</span>
                                    </div>
                                    <p class="sp-rule-box-desc" style="font-size:0.76rem;">
                                        Nuestros <strong>partidos ganados y perdidos</strong>, y nuestros <strong>juegos ganados y perdidos</strong>, se reflejan fielmente en nuestro nivel de jugador en la app oficial de SomosPadelBarcelona. Todos los jugadores pueden consultar su nivel y el de sus compañeros, así como las tablas de logros y rankings actualizados.
                                    </p>
                                </div>

                                <div class="sp-rule-box" style="border-left: 4px solid #8b5cf6; background:#f5f3ff;">
                                    <div class="sp-rule-box-header" style="color:#6d28d9;">
                                        <span style="font-size:1.2rem;">⚖️</span>
                                        <span style="font-size:0.82rem;">SISTEMA OFICIAL DE DESEMPATE Y CLASIFICACIÓN</span>
                                    </div>
                                    <p class="sp-rule-box-desc" style="font-size:0.74rem; color:#334155;">
                                        <strong>1. Partidos Ganados Totales:</strong> El orden de mérito principal se basa en el número de victorias conseguidas en el entreno.<br><br>
                                        <strong>2. Criterios de Desempate (en caso de igual número de victorias):</strong><br>
                                        • <strong>1º:</strong> Pareja ganadora del último partido en Pista 1 (Campeones anecdóticos del entreno).<br>
                                        • <strong>2º:</strong> Finalistas en Pista 1 en la última ronda.<br>
                                        • <strong>3º:</strong> Pista final alcanzada (Pista 1 &gt; Pista 2 &gt; Pista 3...).<br>
                                        • <strong>4º:</strong> Resultado en la última pista (ganador por delante de perdedor).<br>
                                        • <strong>5º:</strong> Veces jugadas en Pista 1 a lo largo del entreno.<br>
                                        • <strong>6º:</strong> Diferencia global de juegos (Juegos a Favor - Juegos en Contra).<br>
                                        • <strong>7º:</strong> Juegos ganados totales (Puntos).
                                    </p>
                                </div>

                                <button class="sp-btn-share-ranking" style="justify-content:center; padding:12px; margin-top:6px;" onclick="window.ControlTowerStandings.toggleRulesModal(false)">
                                    <i class="fas fa-check"></i>
                                    <span>ENTENDIDO, ¡A POR EL PARTIDO!</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    ${ranking.length > 0 ? `
                        <!-- OLYMPIC PODIUM -->
                        <div class="sp-podium-card">
                            <div class="sp-podium-title">
                                <span>🏆 PODIO DE HONOR</span>
                                <span>•</span>
                                <span>SOMOSPADEL BCN</span>
                            </div>
                            <div class="sp-podium-grid">
                                <!-- SILVER (2ND) -->
                                ${top2 ? `
                                    <div class="sp-podium-col silver">
                                        <div class="sp-podium-avatar-wrap">
                                            <div class="sp-podium-avatar">${getInitials(top2.name)}</div>
                                            <div class="sp-podium-badge-medal">2</div>
                                        </div>
                                        <div class="sp-podium-name" title="${top2.name}">${top2.name}</div>
                                        <div class="sp-podium-score-pill">${top2.points} pts • ${top2.won}V</div>
                                    </div>
                                ` : ''}

                                <!-- GOLD (1ST) -->
                                ${top1 ? `
                                    <div class="sp-podium-col gold">
                                        <div class="sp-podium-avatar-wrap">
                                            <div class="sp-podium-crown">👑</div>
                                            <div class="sp-podium-avatar">${getInitials(top1.name)}</div>
                                            <div class="sp-podium-badge-medal">1</div>
                                        </div>
                                        <div class="sp-podium-name" title="${top1.name}">${top1.name}</div>
                                        <div class="sp-podium-score-pill">${top1.points} pts • ${top1.won}V</div>
                                    </div>
                                ` : ''}

                                <!-- BRONZE (3RD) -->
                                ${top3 ? `
                                    <div class="sp-podium-col bronze">
                                        <div class="sp-podium-avatar-wrap">
                                            <div class="sp-podium-avatar">${getInitials(top3.name)}</div>
                                            <div class="sp-podium-badge-medal">3</div>
                                        </div>
                                        <div class="sp-podium-name" title="${top3.name}">${top3.name}</div>
                                        <div class="sp-podium-score-pill">${top3.points} pts • ${top3.won}V</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <!-- DETAILED TECHNICAL STANDINGS TABLE -->
                    <div class="sp-table-card">
                        <div class="sp-table-toolbar">
                            <div class="sp-table-search">
                                <i class="fas fa-search"></i>
                                <input type="text" id="sp-standings-filter" placeholder="Buscar jugador..." oninput="window.ControlTowerStandings.filterTable(this.value)">
                            </div>
                            <div class="sp-legend-pills">
                                <span class="sp-legend-champions"><i class="fas fa-star" style="font-size:0.6rem;"></i> ZONA TOP</span>
                            </div>
                        </div>

                        <div class="sp-standings-table-wrap">
                            <table class="sp-standings-table" id="sp-table-rankings">
                                <thead>
                                    <tr>
                                        <th class="sp-col-pos">#</th>
                                        <th class="sp-col-player">JUGADOR</th>
                                        <th class="sp-col-num" title="Partidos Jugados">PJ</th>
                                        <th class="sp-col-num" title="Partidos Ganados">PG</th>
                                        <th class="sp-col-num" title="Partidos Perdidos">PP</th>
                                        <th class="sp-col-num" title="Juegos a Favor">JF</th>
                                        <th class="sp-col-num" title="Juegos en Contra">JC</th>
                                        <th class="sp-col-num" title="Diferencia de Juegos">DIF</th>
                                        <th class="sp-col-pts" title="Puntos Totales">PTS</th>
                                        <th class="sp-col-num" title="Porcentaje de Efectividad">% EFIC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ranking.length === 0 ? `
                                        <tr>
                                            <td colspan="10" style="text-align:center; padding: 40px 10px; color:#94a3b8; font-style:italic;">
                                                Aún no se han disputado partidos en este evento.
                                            </td>
                                        </tr>
                                    ` : ranking.map((p, i) => {
                                        const rank = i + 1;
                                        const isChamp = rank <= 4;
                                        const isTopGold = rank === 1;
                                        const diff = parseInt(p.diff || (p.points - (p.gamesLost || 0))) || 0;
                                        const diffClass = diff > 0 ? 'sp-diff-pos' : (diff < 0 ? 'sp-diff-neg' : 'sp-diff-zero');
                                        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                                        const winPct = Math.round((p.won / Math.max(1, p.played)) * 100) || 0;
                                        const barColor = winPct >= 65 ? '#10b981' : (winPct >= 40 ? '#f59e0b' : '#ef4444');
                                        const rowClass = isTopGold ? 'sp-row-gold' : (isChamp ? 'sp-row-champions' : '');
                                        
                                        // Trend simulation (based on diff)
                                        const trendIcon = diff > 2 ? '<i class="fas fa-caret-up sp-trend-icon trend-up"></i>' : (diff < -2 ? '<i class="fas fa-caret-down sp-trend-icon trend-down"></i>' : '<i class="fas fa-minus sp-trend-icon trend-same"></i>');

                                        return `
                                            <tr class="${rowClass}" data-name="${(p.name || '').toLowerCase()}">
                                                <td class="sp-col-pos">
                                                    ${rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : rank))}
                                                    ${trendIcon}
                                                </td>
                                                 <td class="sp-col-player">
                                                    <div class="sp-player-cell">
                                                        <div class="sp-table-avatar">${getInitials(p.name)}</div>
                                                        <div>
                                                            <div class="sp-table-player-name">${p.name}</div>
                                                            <div style="display:flex; gap:4px; align-items:center; margin-top:2px;">
                                                                <span class="sp-table-level-badge" style="background:${getLevelColor(p.level || 3.5)}">Nv ${p.level || '3.5'}</span>
                                                                ${isEntreno && p.lastMatchCourt && p.lastMatchCourt < 90 ? `
                                                                    <span style="font-size:0.58rem; font-weight:900; padding:1px 5px; border-radius:4px; background:${p.lastMatchCourt === 1 ? '#CCFF00' : '#e2e8f0'}; color:${p.lastMatchCourt === 1 ? '#000000' : '#475569'}; border:1px solid ${p.lastMatchCourt === 1 ? '#a3e635' : '#cbd5e1'};">
                                                                        ${p.lastMatchCourt === 1 ? '👑 PISTA 1' : `PISTA ${p.lastMatchCourt}`}
                                                                    </span>
                                                                ` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                 </td>
                                                <td class="sp-col-num">${p.played || 0}</td>
                                                <td class="sp-col-num" style="color:#10b981; font-weight:800;">${p.won || 0}</td>
                                                <td class="sp-col-num" style="color:#ef4444;">${p.lost || (p.played - p.won) || 0}</td>
                                                <td class="sp-col-num">${p.points || 0}</td>
                                                <td class="sp-col-num">${p.gamesLost || 0}</td>
                                                <td class="sp-col-num ${diffClass}">${diffStr}</td>
                                                <td class="sp-col-pts">${p.points || 0}</td>
                                                <td class="sp-col-num">
                                                    <div class="sp-efic-bar-wrap">
                                                        <span>${winPct}%</span>
                                                        <div class="sp-efic-bar-track">
                                                            <div class="sp-efic-bar-fill" style="width:${winPct}%; background:${barColor};"></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        static toggleRulesBanner() {
            const body = document.getElementById('sp-rules-body-content');
            const icon = document.getElementById('sp-rules-toggle-icon');
            if (!body) return;
            if (body.style.display === 'none') {
                body.style.display = 'grid';
                if (icon) icon.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                body.style.display = 'none';
                if (icon) icon.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        }

        static toggleRulesModal(isOpen) {
            const overlay = document.getElementById('sp-rules-modal-overlay');
            if (!overlay) return;
            overlay.style.display = isOpen ? 'flex' : 'none';
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        static filterTable(query) {
            const val = (query || '').toLowerCase().trim();
            const rows = document.querySelectorAll('#sp-table-rankings tbody tr');
            rows.forEach(r => {
                const name = r.getAttribute('data-name') || '';
                if (!val || name.includes(val)) {
                    r.style.display = '';
                } else {
                    r.style.display = 'none';
                }
            });
        }

        static async shareStandings(rankingData, eventDoc) {
            try {
                const eventName = eventDoc?.name || 'Entreno / Americana SomosPadel';
                const eventDate = eventDoc?.date || 'Hoy';

                let shareText = `🏆 CLASIFICACIÓN OFICIAL SOMOSPADEL BCN\n`;
                shareText += `🎾 ${eventName}\n📅 ${eventDate}\n\n`;

                const medals = ['🥇', '🥈', '🥉'];
                (rankingData || []).slice(0, 10).forEach((p, i) => {
                    const prefix = i < 3 ? medals[i] : `${i + 1}.`;
                    const diff = p.diff >= 0 ? `+${p.diff}` : `${p.diff}`;
                    shareText += `${prefix} ${p.name.toUpperCase()} — ${p.points} PTS (${p.won}V, DIF: ${diff})\n`;
                });

                shareText += `\n📲 Consulta los cuadros y resultados completos en la app oficial de SomosPadel BCN 🔥`;

                if (navigator.share) {
                    await navigator.share({ title: `Clasificación ${eventName}`, text: shareText });
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareText);
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({ title: '✅ COPIADO', message: 'La clasificación ha sido copiada al portapapeles para compartir por WhatsApp.' });
                    } else {
                        alert('Clasificación copiada al portapapeles.');
                    }
                }
            } catch (err) {
                console.error('Error sharing standings:', err);
            }
        }
    }

    window.ControlTowerStandings = ControlTowerStandings;
})();
