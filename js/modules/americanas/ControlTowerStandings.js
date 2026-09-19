/**
 * ControlTowerStandings.js
 * Sub-module for rendering world-class standings in ControlTowerView.
 * Version: 5.3 Mobile Responsive & Detail Card Edition (SomosPadel BCN)
 */
(function () {
    'use strict';

    class ControlTowerStandings {
        static render(matches, eventDoc) {
            if (!window.StandingsService) {
                return '<div style="padding:60px 20px; text-align:center; color:#64748b; font-family:Outfit,sans-serif;">Cargando servicio de posiciones...</div>';
            }

            const isEntreno = !!eventDoc?.isEntreno;
            const isSwiss = !!(eventDoc?.pair_mode === 'swiss' || (eventDoc?.name || '').toUpperCase().includes('SUIZ'));
            const isFixedPairs = !isSwiss && !!(eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA'));
            const ranking = window.StandingsService.calculate(
                matches || [], 
                isSwiss ? 'swiss' : (isEntreno ? 'entreno' : 'americana'), 
                isFixedPairs, 
                eventDoc?.players || [],
                isSwiss
            );
            window.ControlTowerStandings.lastRankingData = ranking;
            window.ControlTowerStandings.lastIsEntreno = isEntreno;
            window.ControlTowerStandings.lastIsSwiss = isSwiss;
            const currentMode = window.ControlTowerStandings.currentViewMode || 'quick';

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
                    .sp-rules-toggle-action {
                        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                        user-select: none;
                    }
                    .sp-rules-toggle-action:hover {
                        background: #bae6fd !important;
                        color: #0369a1 !important;
                        transform: translateY(-1px);
                    }
                    .sp-rules-toggle-icon {
                        font-size: 0.75rem;
                        color: inherit;
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
                        flex-direction: column;
                        gap: 10px;
                    }
                    .sp-toolbar-row-main {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .sp-table-search {
                        position: relative;
                        flex: 1;
                        min-width: 160px;
                        max-width: 260px;
                    }
                    .sp-table-search input {
                        width: 100%;
                        background: #ffffff;
                        border: 1px solid #cbd5e1;
                        border-radius: 10px;
                        padding: 7px 10px 7px 30px;
                        font-size: 0.75rem;
                        font-family: inherit;
                        color: #0f172a;
                        outline: none;
                        box-sizing: border-box;
                        transition: border-color 0.2s, box-shadow 0.2s;
                    }
                    .sp-table-search input:focus {
                        border-color: #0284c7;
                        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
                    }
                    .sp-table-search i {
                        position: absolute;
                        left: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #94a3b8;
                        font-size: 0.72rem;
                    }

                    /* Mode Switcher Segmented Control */
                    .sp-mode-switcher {
                        display: inline-flex;
                        background: #e2e8f0;
                        padding: 2.5px;
                        border-radius: 10px;
                        gap: 3px;
                    }
                    .sp-mode-btn {
                        background: transparent;
                        border: none;
                        color: #64748b;
                        font-size: 0.65rem;
                        font-weight: 800;
                        padding: 5px 10px;
                        border-radius: 7px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        transition: all 0.2s;
                        user-select: none;
                    }
                    .sp-mode-btn.active {
                        background: #0f172a;
                        color: #CCFF00;
                        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
                    }
                    .sp-mode-btn:hover:not(.active) {
                        color: #0f172a;
                    }

                    .sp-toolbar-row-meta {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        flex-wrap: wrap;
                        padding-top: 2px;
                    }
                    .sp-legend-pills {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .sp-legend-champions {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        background: rgba(14, 165, 233, 0.1);
                        color: #0284c7;
                        padding: 3px 8px;
                        border-radius: 6px;
                        font-size: 0.62rem;
                        font-weight: 800;
                    }
                    .sp-hint-tap {
                        font-size: 0.62rem;
                        color: #64748b;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-weight: 600;
                    }
                    .sp-hint-tap i {
                        color: #0284c7;
                    }
                    .sp-scroll-hint {
                        font-size: 0.62rem;
                        font-weight: 800;
                        color: #0284c7;
                        background: rgba(14, 165, 233, 0.12);
                        padding: 3px 8px;
                        border-radius: 6px;
                        display: none;
                        align-items: center;
                        gap: 5px;
                        animation: spPulseHint 2s infinite;
                    }
                    @keyframes spPulseHint {
                        0%, 100% { opacity: 1; transform: translateX(0); }
                        50% { opacity: 0.7; transform: translateX(3px); }
                    }

                    /* Table Styles */
                    .sp-standings-table-wrap {
                        width: 100%;
                        box-sizing: border-box;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .sp-standings-table-wrap::-webkit-scrollbar {
                        height: 6px;
                    }
                    .sp-standings-table-wrap::-webkit-scrollbar-track {
                        background: #f1f5f9;
                    }
                    .sp-standings-table-wrap::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 4px;
                    }
                    .sp-standings-table-wrap::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
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
                    .sp-player-row {
                        cursor: pointer;
                        transition: background 0.15s;
                    }
                    .sp-player-row:hover {
                        background: #f8fafc;
                    }
                    .sp-player-row:active {
                        background: #f1f5f9;
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
                    .sp-col-efic {
                        text-align: center;
                        font-weight: 700;
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

                    /* Responsive Breakpoints & Mobile Optimization */
                    @media (max-width: 640px) {
                        .sp-standings-wrap {
                            padding: 8px 8px 30px;
                        }
                        .sp-standings-top-bar {
                            gap: 6px;
                            margin-bottom: 12px;
                        }
                        .sp-btn-nav-back, .sp-btn-rules, .sp-btn-share-ranking {
                            padding: 6px 10px;
                            font-size: 0.66rem;
                            border-radius: 10px;
                        }
                        .sp-podium-card {
                            padding: 16px 8px 14px;
                            margin-bottom: 14px;
                            border-radius: 18px;
                        }
                        .sp-podium-grid {
                            gap: 6px;
                        }
                        .sp-podium-col {
                            max-width: 95px;
                        }
                        .sp-podium-name {
                            font-size: 0.68rem;
                            max-width: 85px;
                        }
                        .sp-podium-score-pill {
                            font-size: 0.58rem;
                            padding: 2px 6px;
                        }

                        /* Table Toolbar in Mobile */
                        .sp-table-toolbar {
                            padding: 10px 10px;
                            gap: 8px;
                        }
                        .sp-toolbar-row-main {
                            flex-direction: row;
                            width: 100%;
                            justify-content: space-between;
                        }
                        .sp-table-search {
                            max-width: 155px;
                            flex: 1;
                        }
                        .sp-mode-switcher {
                            padding: 2px;
                        }
                        .sp-mode-btn {
                            padding: 4px 8px;
                            font-size: 0.62rem;
                        }
                        .sp-toolbar-row-meta {
                            padding-top: 0;
                        }

                        /* Table Base Mobile */
                        .sp-standings-table th,
                        .sp-standings-table td {
                            padding: 8px 3px;
                            font-size: 0.7rem;
                        }
                        .sp-col-pos {
                            width: 28px !important;
                            min-width: 26px !important;
                            font-size: 0.78rem;
                            padding: 8px 2px !important;
                        }
                        .sp-trend-icon {
                            display: none;
                        }
                        .sp-col-player {
                            min-width: 105px !important;
                            max-width: 130px !important;
                            padding: 8px 4px !important;
                        }
                        .sp-player-cell {
                            gap: 6px;
                        }
                        .sp-table-avatar {
                            width: 24px;
                            height: 24px;
                            font-size: 0.6rem;
                        }
                        .sp-table-player-name {
                            font-size: 0.7rem;
                            max-width: 82px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .sp-table-level-badge {
                            font-size: 0.54rem;
                            padding: 1px 3px;
                        }
                        .sp-court-badge {
                            font-size: 0.52rem !important;
                            padding: 1px 3px !important;
                        }
                        .sp-col-num {
                            width: 26px;
                            min-width: 24px;
                            text-align: center;
                            font-size: 0.72rem;
                        }
                        .sp-col-pts {
                            width: 32px;
                            min-width: 28px;
                            font-size: 0.85rem;
                        }
                        .sp-col-efic {
                            width: 36px;
                            min-width: 32px;
                            text-align: center;
                            font-size: 0.72rem;
                        }

                        /* QUICK MODE (Default Mobile: Fits 100% inside screen without cutting) */
                        .sp-standings-table:not(.sp-force-full) .sp-col-sec {
                            display: none !important;
                        }
                        .sp-standings-table:not(.sp-force-full) .sp-efic-bar-track {
                            display: none !important;
                        }
                        .sp-standings-table:not(.sp-force-full) .sp-efic-bar-wrap {
                            justify-content: center;
                        }

                        /* FULL MODE (Force 10 Columns on Mobile with smooth scroll) */
                        .sp-standings-table.sp-force-full .sp-col-sec {
                            display: table-cell !important;
                        }
                        .sp-standings-table.sp-force-full .sp-col-player {
                            min-width: 135px !important;
                        }
                        .sp-standings-table.sp-force-full .sp-table-player-name {
                            max-width: 105px;
                        }
                        .sp-standings-table.sp-force-full .sp-efic-bar-track {
                            display: block !important;
                            width: 35px;
                            height: 5px;
                        }
                    }

                    /* Tablet (641px - 1024px) */
                    @media (min-width: 641px) and (max-width: 1024px) {
                        .sp-standings-table th,
                        .sp-standings-table td {
                            padding: 9px 5px;
                            font-size: 0.74rem;
                        }
                        .sp-col-player {
                            min-width: 135px;
                            max-width: 175px;
                        }
                        .sp-table-player-name {
                            max-width: 130px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .sp-efic-bar-track {
                            width: 35px;
                        }
                    }

                    /* Desktop (> 1024px) */
                    @media (min-width: 1025px) {
                        .sp-mode-switcher {
                            display: none;
                        }
                        .sp-scroll-hint {
                            display: none !important;
                        }
                    }

                    /* Modal de Ficha Técnica del Jugador */
                    .sp-player-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(15, 23, 42, 0.78);
                        backdrop-filter: blur(6px);
                        z-index: 99999;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        padding: 16px;
                        box-sizing: border-box;
                    }
                    .sp-player-modal-card {
                        background: #ffffff;
                        width: 100%;
                        max-width: 420px;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        border: 1px solid #e2e8f0;
                        animation: spFadeInModal 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                        display: flex;
                        flex-direction: column;
                    }
                    .sp-player-modal-header {
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        color: #ffffff;
                        padding: 20px 18px 16px;
                        position: relative;
                    }
                    .sp-player-modal-close {
                        position: absolute;
                        top: 14px;
                        right: 14px;
                        background: rgba(255, 255, 255, 0.15);
                        border: none;
                        color: #ffffff;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: background 0.2s;
                    }
                    .sp-player-modal-close:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                    .sp-player-modal-profile {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                    }
                    .sp-player-modal-avatar {
                        width: 52px;
                        height: 52px;
                        border-radius: 50%;
                        background: #CCFF00;
                        color: #0f172a;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 950;
                        font-size: 1.2rem;
                        box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);
                        flex-shrink: 0;
                    }
                    .sp-player-modal-name {
                        font-size: 1.05rem;
                        font-weight: 950;
                        color: #ffffff;
                        text-transform: uppercase;
                        line-height: 1.2;
                        margin-bottom: 4px;
                    }
                    .sp-player-modal-badges {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 6px;
                    }
                    .sp-player-modal-body {
                        padding: 18px;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .sp-stat-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                    .sp-stat-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 10px 8px;
                        text-align: center;
                    }
                    .sp-stat-label {
                        font-size: 0.62rem;
                        font-weight: 900;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 4px;
                    }
                    .sp-stat-val {
                        font-size: 1.15rem;
                        font-weight: 950;
                        color: #0f172a;
                        line-height: 1;
                    }
                    .sp-stat-card.highlight {
                        background: rgba(204, 255, 0, 0.12);
                        border-color: rgba(204, 255, 0, 0.5);
                    }
                    .sp-stat-card.highlight .sp-stat-val {
                        color: #0f172a;
                    }
                    .sp-stat-card.won .sp-stat-val { color: #10b981; }
                    .sp-stat-card.lost .sp-stat-val { color: #ef4444; }
                    .sp-stat-card.diff-pos .sp-stat-val { color: #10b981; }
                    .sp-stat-card.diff-neg .sp-stat-val { color: #ef4444; }

                    .sp-efic-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 12px;
                    }
                    .sp-efic-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        color: #0f172a;
                    }
                    .sp-efic-card-bar {
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    .sp-efic-card-fill {
                        height: 100%;
                        border-radius: 6px;
                        transition: width 0.4s ease;
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
                            <button class="sp-btn-rules" onclick="window.ControlTowerStandings.toggleRulesBanner()">
                                <i class="fas fa-book-open"></i>
                                <span>${isEntreno ? 'NORMAS DEL ENTRENO' : 'REGLAS OFICIALES'}</span>
                            </button>
                            <button class="sp-btn-rules" style="background: #0f172a; color: #CCFF00; border: 1.5px solid rgba(204, 255, 0, 0.4);" onclick="window.showPointsPolicyModal ? window.showPointsPolicyModal() : null" title="Consultar Sistema Oficial de Puntos">
                                <i class="fas fa-balance-scale"></i>
                                <span>PUNTOS RANKING</span>
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
                                <i class="fas fa-award" style="color:${isSwiss ? '#dc2626' : '#0284c7'};"></i>
                                <span>${isSwiss ? 'NORMAS OFICIALES • SISTEMA SUIZO EXPRESS (6 RONDAS)' : (isEntreno ? 'NORMAS DEL ENTRENO Y REGLAS DE PUNTUACIÓN' : 'NORMAS OFICIALES DEL TORNEO')}</span>
                            </div>
                            <div class="sp-rules-toggle-action" id="sp-rules-toggle-btn" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 10px; border-radius: 20px; cursor: pointer;"><span>Mostrar más</span> <i class="fas fa-chevron-down" id="sp-rules-toggle-icon"></i></div>
                        </div>
                        <div class="sp-rules-body" id="sp-rules-body-content" style="display: none;">
                            ${isSwiss ? `
                                <div class="sp-rule-box">
                                    <div class="sp-rule-box-header">
                                        <span style="font-size:1.1rem;">⏱️</span>
                                        <span>1. 6 Rondas Express (2h)</span>
                                    </div>
                                    <p class="sp-rule-box-desc">
                                        Partidos express de <strong>6 rondas de juego efectivo</strong> para ir perfecto de tiempos. Al sonar el silbato de la organización se acaba de inmediato el punto en juego.
                                    </p>
                                </div>

                                <div class="sp-rule-box">
                                    <div class="sp-rule-box-header">
                                        <span style="font-size:1.1rem;">📊</span>
                                        <span>2. Puntos = Juegos Ganados</span>
                                    </div>
                                    <p class="sp-rule-box-desc">
                                        Cada juego ganado en tu partido suma <strong>1 punto individual</strong> en tu casillero (ej: si quedáis 6-3, sumas 6 puntos tú y 6 tu compañero; los rivales suman 3).
                                    </p>
                                </div>

                                <div class="sp-rule-box">
                                    <div class="sp-rule-box-header">
                                        <span style="font-size:1.1rem;">✚</span>
                                        <span>3. Reagrupación Suiza</span>
                                    </div>
                                    <p class="sp-rule-box-desc">
                                        Tras cada ronda: <strong>Top 4 clasificados van a Pista 1</strong>, los 4 siguientes a Pista 2, y los 4 restantes a Pista 3. ¡Cruces equilibrados sin repetir compañero!
                                    </p>
                                </div>

                                <div class="sp-rule-box" style="border-left: 3px solid #dc2626; background: #fef2f2;">
                                    <div class="sp-rule-box-header" style="color:#b91c1c;">
                                        <span style="font-size:1.1rem;">👑</span>
                                        <span>Campeón & Desempate</span>
                                    </div>
                                    <p class="sp-rule-box-desc" style="color:#0f172a;">
                                        <strong>1º Criterio:</strong> Total de Juegos Ganados (Puntos).<br>
                                        <strong>Desempates:</strong> 1º Diferencial (+/-) • 2º Partidos Ganados • 3º Menos juegos perdidos. Quien tenga más juegos tras las 6 rondas es el Campeón.
                                    </p>
                                </div>
                            ` : `
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
                            `}
                        </div>
                    </div>

                    <!-- MODAL COMPLETO DE NORMAS (ACCESIBLE POR BOTÓN) -->
                    <div id="sp-rules-modal-overlay" class="sp-rules-modal-overlay" onclick="if(event.target === this) window.ControlTowerStandings.toggleRulesModal(false)">
                        <div class="sp-rules-modal-card">
                            <div class="sp-rules-modal-header">
                                <h3>
                                    <i class="fas fa-book-open"></i>
                                    <span>${isSwiss ? 'NORMAS OFICIALES • SISTEMA SUIZO' : (isEntreno ? 'NORMAS DEL ENTRENO • SOMOSPADEL BCN' : 'REGLAS OFICIALES • SOMOSPADEL BCN')}</span>
                                </h3>
                                <button class="sp-rules-modal-close" onclick="window.ControlTowerStandings.toggleRulesModal(false)">✕</button>
                            </div>
                            <div class="sp-rules-modal-content">
                                ${isSwiss ? `
                                    <div class="sp-rule-box" style="border-left: 4px solid #dc2626;">
                                        <div class="sp-rule-box-header" style="color:#b91c1c;">
                                            <span style="font-size:1.2rem;">⏱️</span>
                                            <span style="font-size:0.82rem;">1. FORMATO Y DURACIÓN (2 HORAS)</span>
                                        </div>
                                        <p class="sp-rule-box-desc" style="font-size:0.76rem;">
                                            El evento consta de <strong>6 rondas express de juego efectivo</strong> (normalmente 3 pistas y 12 jugadores) para ir perfecto de tiempos. Al sonar el silbato de la organización, el punto en juego se da por concluido de inmediato.
                                        </p>
                                    </div>

                                    <div class="sp-rule-box" style="border-left: 4px solid #0284c7;">
                                        <div class="sp-rule-box-header" style="color:#0369a1;">
                                            <span style="font-size:1.2rem;">📊</span>
                                            <span style="font-size:0.82rem;">2. PUNTUACIÓN INDIVIDUAL POR JUEGOS</span>
                                        </div>
                                        <p class="sp-rule-box-desc" style="font-size:0.76rem;">
                                            En cada ronda se computan los juegos ganados de tu partido como tus puntos individuales (ejemplo: si el partido concluye 6-3, tú y tu compañero sumáis 6 puntos cada uno; la pareja rival suma 3 puntos).
                                        </p>
                                    </div>

                                    <div class="sp-rule-box" style="border-left: 4px solid #10b981;">
                                        <div class="sp-rule-box-header" style="color:#065f46;">
                                            <span style="font-size:1.2rem;">✚</span>
                                            <span style="font-size:0.82rem;">3. REAGRUPACIÓN Y PAREJAS CRUZADAS</span>
                                        </div>
                                        <p class="sp-rule-box-desc" style="font-size:0.76rem;">
                                            Al finalizar cada ronda, la tabla se actualiza: <strong>los 4 primeros van a la Pista 1 (Top)</strong>, los siguientes 4 a la Pista 2 (Medios), y los restantes 4 a la Pista 3 (Bajos). Dentro de cada pista se cruzan las parejas para que no repitan compañero y el partido sea de máxima igualdad competitiva.
                                        </p>
                                    </div>

                                    <div class="sp-rule-box" style="border-left: 4px solid #8b5cf6; background:#f5f3ff;">
                                        <div class="sp-rule-box-header" style="color:#6d28d9;">
                                            <span style="font-size:1.2rem;">👑</span>
                                            <span style="font-size:0.82rem;">CAMPEÓN DEL TORNEO Y CRITERIOS DE DESEMPATE</span>
                                        </div>
                                        <p class="sp-rule-box-desc" style="font-size:0.74rem; color:#334155;">
                                            Al concluir las 6 rondas, el jugador con mayor cantidad de juegos sumados en la tabla general se corona <strong>Campeón del Torneo Suizo</strong>.<br><br>
                                            <strong>Criterios de desempate oficiales:</strong><br>
                                            • <strong>1º:</strong> Total de Juegos Ganados (Puntos).<br>
                                            • <strong>2º:</strong> Mayor Diferencial de Juegos (Juegos a Favor - Juegos en Contra).<br>
                                            • <strong>3º:</strong> Mayor número de Partidos Ganados.<br>
                                            • <strong>4º:</strong> Menor cantidad de Juegos Recibidos / Perdidos.
                                        </p>
                                    </div>
                                ` : `
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
                                `}

                                <!-- SECCIÓN DESTACADA: PUNTUACIÓN PARA EL RANKING GENERAL -->
                                <div class="sp-rule-box" style="border-left: 4px solid #CCFF00; background: #0f172a; color: #ffffff; margin-top: 14px; border-radius: 16px; padding: 14px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.25);">
                                    <div class="sp-rule-box-header" style="color: #CCFF00; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 8px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 1.25rem;">📈</span>
                                            <span style="font-size: 0.85rem; font-weight: 950; letter-spacing: 0.3px; color:#CCFF00;">PUNTUACIÓN PARA EL RANKING GENERAL</span>
                                        </div>
                                        <span style="background: rgba(204,255,0,0.18); color: #CCFF00; font-size: 0.60rem; font-weight: 900; padding: 2px 7px; border-radius: 6px;">OFICIAL</span>
                                    </div>

                                    <p class="sp-rule-box-desc" style="font-size: 0.76rem; color: #cbd5e1; margin-top: 4px; line-height: 1.45;">
                                        Tanto los <strong>Entrenos</strong> como las <strong>Americanas</strong> otorgan exactamente los mismos puntos al ranking oficial de SomosPadel Barcelona (mismo peso 1:1):
                                    </p>

                                    <!-- Baremo resumido en tarjetas -->
                                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0;">
                                        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(204,255,0,0.3); border-radius: 8px; padding: 6px 4px; text-align: center;">
                                            <div style="color: #CCFF00; font-size: 0.82rem; font-weight: 950;">1º • 100p</div>
                                            <div style="color: #94a3b8; font-size: 0.58rem;">👑 Campeón</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 4px; text-align: center;">
                                            <div style="color: #ffffff; font-size: 0.82rem; font-weight: 950;">2º • 80p</div>
                                            <div style="color: #94a3b8; font-size: 0.58rem;">🥈 Subcampeón</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 4px; text-align: center;">
                                            <div style="color: #f59e0b; font-size: 0.82rem; font-weight: 950;">3º • 65p</div>
                                            <div style="color: #94a3b8; font-size: 0.58rem;">🥉 Podio</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 4px; text-align: center;">
                                            <div style="color: #38bdf8; font-size: 0.82rem; font-weight: 950;">4º • 55p</div>
                                            <div style="color: #94a3b8; font-size: 0.58rem;">Top 4</div>
                                        </div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px;">
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 3px; text-align: center; font-size: 0.68rem; color: #cbd5e1;">
                                            <strong>5º:</strong> 45p
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 3px; text-align: center; font-size: 0.68rem; color: #cbd5e1;">
                                            <strong>6º:</strong> 38p
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 3px; text-align: center; font-size: 0.68rem; color: #cbd5e1;">
                                            <strong>7º:</strong> 32p
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 3px; text-align: center; font-size: 0.68rem; color: #cbd5e1;">
                                            <strong>8º:</strong> 28p
                                        </div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 10px;">
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 2px; text-align: center; font-size: 0.64rem; color: #cbd5e1;">
                                            <strong>9º:</strong> 24p
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 2px; text-align: center; font-size: 0.64rem; color: #cbd5e1;">
                                            <strong>10º:</strong> 20p
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 2px; text-align: center; font-size: 0.64rem; color: #cbd5e1;">
                                            <strong>11º:</strong> 16p
                                        </div>
                                        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 5px 2px; text-align: center; font-size: 0.64rem; color: #cbd5e1;">
                                            <strong>12º:</strong> 12p
                                        </div>
                                        <div style="background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 5px 2px; text-align: center; font-size: 0.64rem; color: #4ade80;">
                                            <strong>13º+:</strong> 10p
                                        </div>
                                    </div>

                                    <!-- Bonus por victoria -->
                                    <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 8px 12px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                                        <div style="font-size: 0.74rem; color: #e0f2fe;">
                                            ⚡ <strong>Bonus por Victoria:</strong> +2 puntos extra por cada partido ganado (PG).
                                        </div>
                                        <span style="color: #38bdf8; font-weight: 950; font-size: 0.8rem; white-space: nowrap;">+2 pts/PG</span>
                                    </div>

                                    <!-- Reglas por modalidad -->
                                    <div style="font-size: 0.72rem; color: #94a3b8; line-height: 1.45; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
                                        <p style="margin: 0 0 4px;"><strong style="color: #ec4899;">🌪️ TWISTER:</strong> Puesto individual + 2 pts por PG individual.</p>
                                        <p style="margin: 0 0 4px;"><strong style="color: #ef4444;">✚ SUIZO:</strong> Puesto tras 6 rondas + 2 pts por victoria obtenida.</p>
                                        <p style="margin: 0 0 6px;"><strong style="color: #38bdf8;">👥 PAREJA FIJA:</strong> Ambos jugadores reciben los puntos del puesto de la dupla + 2 pts por victoria de la pareja.</p>
                                    </div>

                                    <button type="button" onclick="window.showPointsPolicyModal ? window.showPointsPolicyModal() : null" style="width: 100%; margin-top: 8px; background: rgba(204, 255, 0, 0.15); border: 1px solid rgba(204, 255, 0, 0.4); color: #CCFF00; padding: 9px; border-radius: 10px; font-weight: 900; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.background='#CCFF00'; this.style.color='#000';" onmouseout="this.style.background='rgba(204, 255, 0, 0.15)'; this.style.color='#CCFF00';">
                                        <i class="fas fa-calculator"></i> ABRIR SIMULADOR Y TABLA COMPLETA
                                    </button>
                                </div>

                                <button class="sp-btn-share-ranking" style="justify-content:center; padding:12px; margin-top:12px;" onclick="window.ControlTowerStandings.toggleRulesModal(false)">
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
                            <div class="sp-toolbar-row-main">
                                <div class="sp-table-search">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="sp-standings-filter" placeholder="Buscar jugador..." oninput="window.ControlTowerStandings.filterTable(this.value)">
                                </div>
                                <div class="sp-mode-switcher" id="sp-mode-switcher">
                                    <button type="button" class="sp-mode-btn ${currentMode === 'quick' ? 'active' : ''}" id="sp-btn-view-quick" onclick="window.ControlTowerStandings.setViewMode('quick')" title="Vista adaptada a pantalla móvil">
                                        <i class="fas fa-mobile-alt"></i>
                                        <span>MÓVIL</span>
                                    </button>
                                    <button type="button" class="sp-mode-btn ${currentMode === 'full' ? 'active' : ''}" id="sp-btn-view-full" onclick="window.ControlTowerStandings.setViewMode('full')" title="Vista con las 10 columnas completas">
                                        <i class="fas fa-table-columns"></i>
                                        <span>COMPLETA</span>
                                    </button>
                                </div>
                            </div>
                            <div class="sp-toolbar-row-meta">
                                <div class="sp-legend-pills">
                                    <span class="sp-legend-champions"><i class="fas fa-star" style="font-size:0.6rem;"></i> ZONA TOP</span>
                                    <span class="sp-hint-tap"><i class="fas fa-hand-pointer"></i> Toca un jugador para ver su ficha completa</span>
                                </div>
                                <div class="sp-scroll-hint" id="sp-scroll-hint" style="${currentMode === 'full' ? 'display:inline-flex;' : 'display:none;'}">
                                    <i class="fas fa-arrows-left-right"></i>
                                    <span>Desliza para ver más</span>
                                </div>
                            </div>
                        </div>

                        <div class="sp-standings-table-wrap">
                            <table class="sp-standings-table ${currentMode === 'full' ? 'sp-force-full' : ''}" id="sp-table-rankings">
                                <thead>
                                    <tr>
                                        <th class="sp-col-pos">#</th>
                                        <th class="sp-col-player">JUGADOR</th>
                                        <th class="sp-col-num" title="Partidos Jugados">PJ</th>
                                        <th class="sp-col-num" title="Partidos Ganados">PG</th>
                                        <th class="sp-col-num sp-col-sec" title="Partidos Perdidos">PP</th>
                                        <th class="sp-col-num sp-col-sec" title="Juegos a Favor">JF</th>
                                        <th class="sp-col-num sp-col-sec" title="Juegos en Contra">JC</th>
                                        <th class="sp-col-num" title="Diferencia de Juegos">DIF</th>
                                        <th class="sp-col-pts" title="Puntos Totales">PTS</th>
                                        <th class="sp-col-efic" title="Porcentaje de Efectividad">% EFIC</th>
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
                                            <tr class="${rowClass} sp-player-row" data-name="${(p.name || '').toLowerCase()}" onclick="window.ControlTowerStandings.openPlayerCard(${i})" title="Toca para ver ficha completa">
                                                <td class="sp-col-pos">
                                                    ${rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : rank))}
                                                    ${trendIcon}
                                                </td>
                                                <td class="sp-col-player">
                                                    <div class="sp-player-cell">
                                                        <div class="sp-table-avatar">${getInitials(p.name)}</div>
                                                        <div style="min-width:0; flex:1;">
                                                            <div class="sp-table-player-name" title="${p.name}">${p.name}</div>
                                                            <div style="display:flex; gap:4px; align-items:center; margin-top:2px;">
                                                                <span class="sp-table-level-badge" style="background:${getLevelColor(p.level || 3.5)}">Nv ${p.level || '3.5'}</span>
                                                                ${isEntreno && p.lastMatchCourt && p.lastMatchCourt < 90 ? `
                                                                    <span class="sp-court-badge" style="font-size:0.56rem; font-weight:900; padding:1px 4px; border-radius:4px; background:${p.lastMatchCourt === 1 ? '#CCFF00' : '#e2e8f0'}; color:${p.lastMatchCourt === 1 ? '#000000' : '#475569'}; border:1px solid ${p.lastMatchCourt === 1 ? '#a3e635' : '#cbd5e1'}; white-space:nowrap;">
                                                                        ${p.lastMatchCourt === 1 ? '👑 P1' : `P${p.lastMatchCourt}`}
                                                                    </span>
                                                                ` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="sp-col-num" title="Partidos Jugados">${p.played || 0}</td>
                                                <td class="sp-col-num" style="color:#10b981; font-weight:800;" title="Partidos Ganados">${p.won || 0}</td>
                                                <td class="sp-col-num sp-col-sec" style="color:#ef4444;" title="Partidos Perdidos">${p.lost || (p.played - p.won) || 0}</td>
                                                <td class="sp-col-num sp-col-sec" title="Juegos a Favor">${p.points || 0}</td>
                                                <td class="sp-col-num sp-col-sec" title="Juegos en Contra">${p.gamesLost || 0}</td>
                                                <td class="sp-col-num ${diffClass}" title="Diferencia de Juegos">${diffStr}</td>
                                                <td class="sp-col-pts" title="Puntos Totales">${p.points || 0}</td>
                                                <td class="sp-col-efic" title="Porcentaje de Efectividad">
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

                    <!-- SECCIÓN INTEGRADA: CUADROS Y ESCALERA DE CRUCES -->
                    <div class="sp-standings-brackets-section" id="sp-standings-brackets" style="margin-top: 26px; border-top: 1.5px dashed #cbd5e1; padding-top: 22px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 4px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 32px; height: 32px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; box-shadow: 0 2px 6px rgba(2,132,199,0.15);">
                                    <i class="fas fa-sitemap"></i>
                                </div>
                                <div>
                                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 950; color: #0f172a; letter-spacing: -0.3px;">CUADROS Y ESCALERA DE CRUCES</h3>
                                    <span style="font-size: 0.68rem; font-weight: 700; color: #64748b;">Evolución de parejas y pistas por ronda</span>
                                </div>
                            </div>
                        </div>
                        ${window.ControlTowerBrackets ? window.ControlTowerBrackets.render(matches, eventDoc) : ''}
                    </div>

                    <!-- MODAL DE FICHA TÉCNICA DEL JUGADOR -->
                    <div id="sp-player-modal-overlay" class="sp-player-modal-overlay" onclick="if(event.target === this) window.ControlTowerStandings.closePlayerCard()"></div>
                </div>
            `;
        }

        static setViewMode(mode) {
            const table = document.getElementById('sp-table-rankings');
            const btnQuick = document.getElementById('sp-btn-view-quick');
            const btnFull = document.getElementById('sp-btn-view-full');
            const scrollHint = document.getElementById('sp-scroll-hint');

            window.ControlTowerStandings.currentViewMode = mode;

            if (mode === 'full') {
                if (table) table.classList.add('sp-force-full');
                if (btnQuick) btnQuick.classList.remove('active');
                if (btnFull) btnFull.classList.add('active');
                if (scrollHint) scrollHint.style.display = 'inline-flex';
            } else {
                if (table) table.classList.remove('sp-force-full');
                if (btnQuick) btnQuick.classList.add('active');
                if (btnFull) btnFull.classList.remove('active');
                if (scrollHint) scrollHint.style.display = 'none';
            }
        }

        // Backward compatibility alias
        static setTableViewMode(mode) {
            this.setViewMode(mode);
        }

        static openPlayerCard(index) {
            const ranking = window.ControlTowerStandings.lastRankingData || [];
            const p = ranking[index];
            if (!p) return;

            const overlay = document.getElementById('sp-player-modal-overlay');
            if (!overlay) return;

            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
            const diff = parseInt(p.diff || (p.points - (p.gamesLost || 0))) || 0;
            const diffClass = diff > 0 ? 'diff-pos' : (diff < 0 ? 'diff-neg' : '');
            const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
            const winPct = Math.round((p.won / Math.max(1, p.played)) * 100) || 0;
            const barColor = winPct >= 65 ? '#10b981' : (winPct >= 40 ? '#f59e0b' : '#ef4444');

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

            const isEntreno = !!window.ControlTowerStandings.lastIsEntreno;
            const courtBadge = (isEntreno && p.lastMatchCourt && p.lastMatchCourt < 90) ? `
                <span style="font-size:0.62rem; font-weight:900; padding:2px 7px; border-radius:6px; background:${p.lastMatchCourt === 1 ? '#CCFF00' : '#e2e8f0'}; color:${p.lastMatchCourt === 1 ? '#000000' : '#475569'}; border:1px solid ${p.lastMatchCourt === 1 ? '#a3e635' : '#cbd5e1'};">
                    ${p.lastMatchCourt === 1 ? '👑 PISTA 1 (CAMPEÓN)' : `PISTA ${p.lastMatchCourt}`}
                </span>
            ` : '';

            overlay.innerHTML = `
                <div class="sp-player-modal-card">
                    <div class="sp-player-modal-header">
                        <button class="sp-player-modal-close" onclick="window.ControlTowerStandings.closePlayerCard()">✕</button>
                        <div class="sp-player-modal-profile">
                            <div class="sp-player-modal-avatar">${getInitials(p.name)}</div>
                            <div style="min-width:0; flex:1;">
                                <div class="sp-player-modal-name">${p.name}</div>
                                <div class="sp-player-modal-badges">
                                    <span style="font-size:0.72rem; font-weight:950; background:rgba(255,255,255,0.2); padding:2px 7px; border-radius:6px; color:#fff;">
                                        ${medal} ${rank <= 3 ? 'PODIO' : 'POSICIÓN'}
                                    </span>
                                    <span style="font-size:0.65rem; font-weight:900; background:${getLevelColor(p.level || 3.5)}; padding:2px 6px; border-radius:6px; color:#fff;">
                                        Nivel ${p.level || '3.5'}
                                    </span>
                                    ${courtBadge}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="sp-player-modal-body">
                        <!-- PARTIDOS -->
                        <div>
                            <div style="font-size:0.65rem; font-weight:900; color:#64748b; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">
                                Partidos Disputados
                            </div>
                            <div class="sp-stat-grid">
                                <div class="sp-stat-card">
                                    <div class="sp-stat-label">Jugados</div>
                                    <div class="sp-stat-val">${p.played || 0}</div>
                                </div>
                                <div class="sp-stat-card won">
                                    <div class="sp-stat-label">Ganados</div>
                                    <div class="sp-stat-val">${p.won || 0}</div>
                                </div>
                                <div class="sp-stat-card lost">
                                    <div class="sp-stat-label">Perdidos</div>
                                    <div class="sp-stat-val">${p.lost || (p.played - p.won) || 0}</div>
                                </div>
                            </div>
                        </div>

                        <!-- JUEGOS Y PUNTOS -->
                        <div>
                            <div style="font-size:0.65rem; font-weight:900; color:#64748b; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">
                                Juegos y Puntos
                            </div>
                            <div class="sp-stat-grid">
                                <div class="sp-stat-card highlight">
                                    <div class="sp-stat-label">Puntos / JF</div>
                                    <div class="sp-stat-val">${p.points || 0}</div>
                                </div>
                                <div class="sp-stat-card">
                                    <div class="sp-stat-label">En Contra (JC)</div>
                                    <div class="sp-stat-val">${p.gamesLost || 0}</div>
                                </div>
                                <div class="sp-stat-card ${diffClass}">
                                    <div class="sp-stat-label">Diferencia</div>
                                    <div class="sp-stat-val">${diffStr}</div>
                                </div>
                            </div>
                        </div>

                        <!-- EFECTIVIDAD -->
                        <div class="sp-efic-card">
                            <div class="sp-efic-card-header">
                                <span>Efectividad de Victorias</span>
                                <span style="font-size:0.95rem; font-weight:950; color:${barColor};">${winPct}%</span>
                            </div>
                            <div class="sp-efic-card-bar">
                                <div class="sp-efic-card-fill" style="width:${winPct}%; background:${barColor};"></div>
                            </div>
                        </div>

                        <button class="sp-btn-share-ranking" style="justify-content:center; padding:10px; margin-top:2px;" onclick="window.ControlTowerStandings.closePlayerCard()">
                            <span>CERRAR FICHA</span>
                        </button>
                    </div>
                </div>
            `;

            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        // Backward compatibility alias
        static showPlayerDetailModal(index) {
            this.openPlayerCard(index);
        }

        static closePlayerCard() {
            const overlay = document.getElementById('sp-player-modal-overlay');
            if (!overlay) return;
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }

        // Backward compatibility alias
        static hidePlayerDetailModal() {
            this.closePlayerCard();
        }

        static toggleRulesBanner() {
            const body = document.getElementById('sp-rules-body-content');
            const btn = document.getElementById('sp-rules-toggle-btn');
            const icon = document.getElementById('sp-rules-toggle-icon');
            if (!body) return;
            const isHidden = body.style.display === 'none' || window.getComputedStyle(body).display === 'none';
            if (isHidden) {
                body.style.display = 'grid';
                if (btn) {
                    const textSpan = btn.querySelector('span');
                    if (textSpan) textSpan.textContent = 'Mostrar menos';
                }
                if (icon) {
                    icon.className = 'fas fa-chevron-up';
                }
            } else {
                body.style.display = 'none';
                if (btn) {
                    const textSpan = btn.querySelector('span');
                    if (textSpan) textSpan.textContent = 'Mostrar más';
                }
                if (icon) {
                    icon.className = 'fas fa-chevron-down';
                }
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
            const rows = document.querySelectorAll('#sp-table-rankings tbody tr.sp-player-row');
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
                    const diffVal = p.diff ?? ((p.points || 0) - (p.gamesLost || 0));
                    const diff = diffVal >= 0 ? `+${diffVal}` : `${diffVal}`;
                    const pName = p.name ? String(p.name).toUpperCase() : `JUGADOR ${i + 1}`;
                    shareText += `${prefix} ${pName} — ${p.points || 0} PTS (${p.won || 0}V, DIF: ${diff})\n`;
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
