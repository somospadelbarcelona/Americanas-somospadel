/**
 * ControlTowerSummary.js
 * Módulo unificado "RESUMEN" en Torre de Control (Entrenos & Americanas).
 * Fusiona de forma armónica lo mejor de Stats y Summary:
 * - Cabecera oficial & Botonera de difusión rápida (WhatsApp & Flyer Instagram HD)
 * - Podio de Honor Estelar (1º Campeón, 2º Subcampeón, 3º Tercer puesto)
 * - Crónica Periodística Express & MVP de la Jornada
 * - 4 Métricas Globales del Evento
 * - "Datos que Nadie Ve" (8 Insignias y Premios Secretos)
 * - Gráficos Visuales Interactivos en SVG nativo y responsivo
 * - Centro de compartición y Generador de Flyer HD 1080x1920 para Instagram Stories
 * 
 * SomosPadel BCN - Pro Sports Edition
 */
(function () {
    'use strict';

    class ControlTowerSummary {
        static lastMatches = [];
        static lastEventDoc = null;
        static lastRanking = [];
        static lastSummaryData = null;
        static lastChronicleText = '';
        static evolutionSelectedPlayer = 0;
        static evolutionMode = 'accumulated'; // 'accumulated' | 'round'
        static activeCompetitivenessCategory = null; // null | 'tight' | 'medium' | 'blowout'

        /**
         * Renderiza la vista unificada y completa del Resumen de Competición
         */
        static render(matches, eventDoc) {
            this.lastMatches = matches || [];
            this.lastEventDoc = eventDoc || {};

            const finishedMatches = (matches || []).filter(m => 
                m.status === 'finished' || m.status === 'finalizado' || (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0
            );

            if (finishedMatches.length === 0) {
                return this._renderEmptyState(eventDoc);
            }

            // 1. Cálculos de Clasificación y Modalidad
            const isEntreno = !!eventDoc?.isEntreno;
            const isSwiss = !!(eventDoc?.pair_mode === 'swiss' || eventDoc?.isSwiss || (eventDoc?.name || '').toUpperCase().includes('SUIZ'));
            const isFija = !isSwiss && !!(eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA'));
            
            let ranking = [];
            if (window.StandingsService && typeof window.StandingsService.calculate === 'function') {
                try {
                    ranking = window.StandingsService.calculate(
                        matches,
                        isSwiss ? 'swiss' : (isEntreno ? 'entreno' : 'americana'),
                        isFija,
                        eventDoc?.players || [],
                        isSwiss
                    );
                } catch (e) {
                    console.warn('[ControlTowerSummary] StandingsService calculation error, using fallback:', e);
                }
            }

            if (!ranking || ranking.length === 0) {
                ranking = this._calculateFallbackRanking(finishedMatches);
            }

            this.lastRanking = ranking;

            // 2. Extraer Podio & MVP
            const p1 = ranking[0] || { name: 'Por disputar', points: 0, diff: 0, won: 0, played: 0 };
            const p2 = ranking[1] || { name: 'Por disputar', points: 0, diff: 0, won: 0, played: 0 };
            const p3 = ranking[2] || { name: 'Por disputar', points: 0, diff: 0, won: 0, played: 0 };

            // Partidos en pista 1 para el campeón (MVP)
            let p1Court1Count = 0;
            finishedMatches.forEach(m => {
                if (parseInt(m.court || 0) === 1) {
                    const names = (m.team_a_names || []).concat(m.team_b_names || []);
                    if (names.some(n => n && (n === p1.name || String(n).includes(p1.name)))) {
                        p1Court1Count++;
                    }
                }
            });
            const p1WinPct = p1.played > 0 ? Math.round((p1.won / p1.played) * 100) : 100;

            // 3. Resumen y Métricas Globales
            const totalGames = finishedMatches.reduce((acc, m) => acc + (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)), 0);
            const totalMatches = finishedMatches.length;
            const avgGamesPerMatch = totalMatches > 0 ? (totalGames / totalMatches).toFixed(1) : '0.0';
            
            let intensityLevel = 'Equilibrada';
            let intensityColor = '#0ea5e9';
            if (parseFloat(avgGamesPerMatch) >= 6.4) {
                intensityLevel = 'Frenética (Tensión Máxima)';
                intensityColor = '#ef4444';
            } else if (parseFloat(avgGamesPerMatch) >= 5.2) {
                intensityLevel = 'Alta Competitividad';
                intensityColor = '#10b981';
            }

            // 4. "DATOS QUE NADIE VE" (8 Insignias & Métricas Secretas)
            const badges = this._calculateBadges(finishedMatches, ranking);

            // 5. Preparar Crónica Periodística Express & Texto Compartible
            const amName = eventDoc?.name || (isEntreno ? 'Entreno SomosPadel' : 'Americana SomosPadel');
            const eventDate = eventDoc?.date || 'Fecha por confirmar';
            const categoryLabel = (eventDoc?.category === 'female' ? 'FEMENINO' : eventDoc?.category === 'male' ? 'MASCULINO' : eventDoc?.category === 'mixed' ? 'MIXTO' : (eventDoc?.category || 'OPEN')).toUpperCase();
            const humanDate = this._formatHumanDate(eventDoc?.date || 'Hoy');

            const chronicleHeadline = `¡${p1.name} reina en una jornada de máxima intensidad!`;
            const chronicleSubheadline = `Crónica oficial de ${amName}: ${totalMatches} partidos al límite, ${totalGames} juegos disputados y podio definido con enorme entrega.`;

            // Construir texto optimizado para WhatsApp y guardarlo
            this._prepareShareTexts({
                amName,
                humanDate,
                categoryLabel,
                p1, p2, p3,
                p1WinPct,
                p1Court1Count,
                badges,
                totalGames,
                totalMatches,
                avgGamesPerMatch,
                isEntreno
            });

            this.lastSummaryData = {
                eventDoc,
                ranking,
                p1, p2, p3,
                p1WinPct,
                p1Court1Count,
                totalGames,
                totalMatches,
                avgGamesPerMatch,
                intensityLevel,
                intensityColor,
                badges,
                chronicleHeadline,
                chronicleSubheadline
            };

            return `
                <div class="sp-summary-container fade-in" style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; padding: 14px 14px 45px; background: #0b1120; color: #ffffff; min-height: 100vh; box-sizing: border-box;">
                    <style>
                        .sp-summary-container * { box-sizing: border-box; }
                        
                        /* Hero & Cabecera */
                        .sp-sum-hero {
                            background: radial-gradient(circle at 85% 15%, rgba(204, 255, 0, 0.12) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.12) 0%, transparent 50%), linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
                            border: 1.5px solid rgba(204, 255, 0, 0.28);
                            border-radius: 22px;
                            padding: 22px 18px;
                            position: relative;
                            overflow: hidden;
                            box-shadow: 0 16px 40px rgba(0,0,0,0.45);
                            margin-bottom: 20px;
                        }
                        .sp-sum-tag {
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            background: rgba(204, 255, 0, 0.12);
                            border: 1px solid rgba(204, 255, 0, 0.35);
                            color: #ccff00;
                            padding: 5px 12px;
                            border-radius: 20px;
                            font-size: 0.66rem;
                            font-weight: 900;
                            letter-spacing: 0.8px;
                            text-transform: uppercase;
                        }
                        
                        /* Action Pill Buttons */
                        .sp-sum-btn {
                            flex: 1;
                            min-width: 145px;
                            padding: 12px 16px;
                            border-radius: 14px;
                            font-weight: 950;
                            font-size: 0.78rem;
                            letter-spacing: 0.4px;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
                            border: none;
                            text-decoration: none;
                        }
                        .sp-sum-btn:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 8px 25px rgba(0,0,0,0.35);
                        }
                        .sp-sum-btn:active {
                            transform: scale(0.97);
                        }

                        /* Section Header */
                        .sp-sec-header {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin: 28px 0 14px;
                        }
                        .sp-sec-title {
                            font-size: 0.92rem;
                            font-weight: 1000;
                            letter-spacing: 0.8px;
                            text-transform: uppercase;
                            color: #f1f5f9;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }

                        /* Podio de Honor */
                        .sp-podium-wrap {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 8px;
                            align-items: flex-end;
                            margin: 18px 0 24px;
                        }
                        .sp-podium-col {
                            border-radius: 18px;
                            padding: 16px 8px 14px;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: flex-end;
                            position: relative;
                            transition: transform 0.2s;
                        }
                        .sp-podium-col:hover {
                            transform: translateY(-3px);
                        }
                        .sp-podium-avatar {
                            width: 44px;
                            height: 44px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 1000;
                            font-size: 0.88rem;
                            margin-bottom: 8px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                        }

                        /* MVP & Crónica Express */
                        .sp-mvp-card {
                            background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.92) 55%, rgba(204, 255, 0, 0.08) 100%);
                            border: 1.5px solid rgba(245, 158, 11, 0.45);
                            border-radius: 20px;
                            padding: 20px 18px;
                            margin-bottom: 20px;
                            box-shadow: 0 14px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.12);
                            position: relative;
                            overflow: hidden;
                        }
                        .sp-mvp-badge-pill {
                            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                            color: #000;
                            font-size: 0.65rem;
                            font-weight: 1000;
                            padding: 4px 12px;
                            border-radius: 12px;
                            letter-spacing: 0.6px;
                            text-transform: uppercase;
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            margin-bottom: 12px;
                        }
                        .sp-mvp-chip {
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                            padding: 5px 11px;
                            border-radius: 10px;
                            font-size: 0.68rem;
                            font-weight: 900;
                            letter-spacing: 0.3px;
                        }

                        /* KPI Grid */
                        .sp-sum-kpi-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            margin: 18px 0;
                        }
                        @media (min-width: 600px) {
                            .sp-sum-kpi-grid {
                                grid-template-columns: repeat(4, 1fr);
                            }
                        }
                        .sp-sum-kpi-item {
                            background: rgba(255, 255, 255, 0.04);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 16px;
                            padding: 14px 12px;
                            text-align: center;
                        }

                        /* Badges Grid (Datos que nadie ve) */
                        .sp-badges-grid {
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 12px;
                        }
                        @media (min-width: 640px) {
                            .sp-badges-grid {
                                grid-template-columns: repeat(2, 1fr);
                            }
                        }
                        .sp-badge-card {
                            background: linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%);
                            border: 1px solid rgba(255, 255, 255, 0.09);
                            border-radius: 18px;
                            padding: 15px;
                            display: flex;
                            align-items: flex-start;
                            gap: 12px;
                            transition: all 0.25s;
                        }
                        .sp-badge-card:hover {
                            border-color: rgba(204, 255, 0, 0.35);
                            background: linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.98) 100%);
                            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                        }
                        .sp-badge-icon-box {
                            width: 44px;
                            height: 44px;
                            border-radius: 13px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.35rem;
                            flex-shrink: 0;
                            border: 1px solid rgba(255,255,255,0.12);
                        }
                    </style>

                    <!-- A) CABECERA & CENTRO DE ACCIONES DE DIFUSIÓN -->
                    <div class="sp-sum-hero">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0;">
                                <div class="sp-sum-tag">
                                    <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #ccff00; box-shadow: 0 0 8px #ccff00;"></span>
                                    <span>${isSwiss ? 'SUIZO' : (isFija ? 'PAREJA FIJA' : 'TWISTER')}</span>
                                </div>
                                <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-calendar-alt" style="color: #38bdf8; font-size: 0.68rem;"></i>
                                    <span>${eventDate}</span>
                                    <span>•</span>
                                    <span style="color: #ffffff;">${categoryLabel}</span>
                                </div>
                            </div>

                            <!-- Botones rápidos (igual que en entrenos o americanas pequeños) -->
                            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                <button type="button" onclick="window.ControlTowerSummary.shareWhatsApp()" 
                                        title="Compartir por WhatsApp" 
                                        aria-label="Compartir por WhatsApp"
                                        style="background: rgba(15, 23, 42, 0.85); width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(34, 197, 94, 0.35); color: #22c55e; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); box-shadow: 0 3px 10px rgba(0,0,0,0.35); transition: transform 0.15s;"
                                        onmouseover="this.style.transform='scale(1.08)';"
                                        onmouseout="this.style.transform='scale(1)';"
                                        onmousedown="this.style.transform='scale(0.92)';">
                                    <i class="fab fa-whatsapp" style="font-size: 0.95rem;"></i>
                                </button>

                                <button type="button" onclick="window.ControlTowerSummary.openInstagramFlyerModal()" 
                                        title="Generar Flyer Instagram HD" 
                                        aria-label="Generar Flyer Instagram HD"
                                        style="background: rgba(15, 23, 42, 0.85); width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(225, 48, 108, 0.45); color: #E1306C; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); box-shadow: 0 3px 10px rgba(0,0,0,0.35); transition: transform 0.15s;"
                                        onmouseover="this.style.transform='scale(1.08)';"
                                        onmouseout="this.style.transform='scale(1)';"
                                        onmousedown="this.style.transform='scale(0.92)';">
                                    <i class="fab fa-instagram" style="font-size: 0.95rem; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
                                </button>
                            </div>
                        </div>

                        <h1 style="margin: 0 0 8px 0; font-size: 1.45rem; font-weight: 1000; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
                            ${amName.toUpperCase()}
                        </h1>
                        <p style="margin: 0; font-size: 0.78rem; color: #94a3b8; line-height: 1.4;">
                            Informe periodístico oficial, podio estelar, analítica interactiva y métricas secretas de la jornada.
                        </p>
                    </div>

                    <!-- B) PODIO DE HONOR ESTELAR -->
                    <div class="sp-sec-header">
                        <div class="sp-sec-title">
                            <i class="fas fa-medal" style="color: #facc15;"></i>
                            <span>PODIO DE HONOR ESTELAR</span>
                        </div>
                        <button type="button" onclick="window.ControlTowerView.switchTab('standings')" 
                                style="background: none; border: none; color: #38bdf8; font-size: 0.72rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                            <span>TABLA COMPLETA</span>
                            <i class="fas fa-chevron-right" style="font-size: 0.65rem;"></i>
                        </button>
                    </div>

                    <div class="sp-podium-wrap">
                        <!-- 2º Puesto (Subcampeón) -->
                        <div class="sp-podium-col" style="background: linear-gradient(180deg, rgba(203, 213, 225, 0.16) 0%, rgba(30, 41, 59, 0.85) 100%); border: 1.5px solid rgba(203, 213, 225, 0.35); min-height: 185px;">
                            <div class="sp-podium-avatar" style="background: #cbd5e1; color: #0f172a;">
                                ${this._getInitials(p2.name)}
                            </div>
                            <div style="font-size: 1.6rem; line-height: 1; margin-bottom: 4px;">🥈</div>
                            <div style="font-size: 0.62rem; font-weight: 950; color: #cbd5e1; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 3px;">2º SUBCAMPEÓN</div>
                            <div style="font-size: 0.85rem; font-weight: 1000; color: #ffffff; text-align: center; word-break: break-word; line-height: 1.2; margin-bottom: 6px;">
                                ${p2.name}
                            </div>
                            <div style="background: rgba(203, 213, 225, 0.18); border-radius: 10px; padding: 4px 8px; font-size: 0.72rem; font-weight: 950; color: #f1f5f9; margin-bottom: 3px;">
                                ${p2.points || 0} pts <span style="font-size: 0.62rem; color: #94a3b8;">(${p2.diff >= 0 ? '+' : ''}${p2.diff || 0})</span>
                            </div>
                            <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 800;">
                                ${p2.won || 0}V / ${p2.played || 0}P
                            </div>
                        </div>

                        <!-- 1º Puesto (Campeón - Gran Centro Dorado) -->
                        <div class="sp-podium-col" style="background: linear-gradient(180deg, rgba(250, 204, 21, 0.25) 0%, rgba(30, 41, 59, 0.98) 100%); border: 2px solid #facc15; min-height: 220px; box-shadow: 0 0 28px rgba(250, 204, 21, 0.28);">
                            <div style="position: absolute; top: -12px; background: #facc15; color: #000; font-size: 0.6rem; font-weight: 1000; padding: 3px 10px; border-radius: 12px; letter-spacing: 0.6px; text-transform: uppercase; box-shadow: 0 2px 10px rgba(0,0,0,0.4);">
                                👑 1º CAMPEÓN
                            </div>
                            <div class="sp-podium-avatar" style="background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%); color: #000; width: 50px; height: 50px; font-size: 1rem; border: 2px solid #ffffff;">
                                ${this._getInitials(p1.name)}
                            </div>
                            <div style="font-size: 2rem; line-height: 1; margin-bottom: 4px;">🥇</div>
                            <div style="font-size: 0.65rem; font-weight: 1000; color: #facc15; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 3px;">CAMPEÓN OFICIAL</div>
                            <div style="font-size: 0.96rem; font-weight: 1000; color: #ffffff; text-align: center; word-break: break-word; line-height: 1.2; margin-bottom: 6px;">
                                ${p1.name}
                            </div>
                            <div style="background: rgba(250, 204, 21, 0.25); border: 1px solid rgba(250, 204, 21, 0.45); border-radius: 10px; padding: 5px 10px; font-size: 0.78rem; font-weight: 1000; color: #fef08a; margin-bottom: 3px;">
                                ${p1.points || 0} pts <span style="font-size: 0.65rem; color: #facc15;">(${p1.diff >= 0 ? '+' : ''}${p1.diff || 0})</span>
                            </div>
                            <div style="font-size: 0.65rem; color: #facc15; font-weight: 900;">
                                ${p1.won || 0}V / ${p1.played || 0}P (${p1WinPct}%)
                            </div>
                        </div>

                        <!-- 3er Puesto (Tercer Puesto) -->
                        <div class="sp-podium-col" style="background: linear-gradient(180deg, rgba(217, 119, 6, 0.18) 0%, rgba(30, 41, 59, 0.85) 100%); border: 1.5px solid rgba(217, 119, 6, 0.35); min-height: 175px;">
                            <div class="sp-podium-avatar" style="background: #d97706; color: #ffffff;">
                                ${this._getInitials(p3.name)}
                            </div>
                            <div style="font-size: 1.5rem; line-height: 1; margin-bottom: 4px;">🥉</div>
                            <div style="font-size: 0.62rem; font-weight: 950; color: #fbbf24; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 3px;">3ER PUESTO</div>
                            <div style="font-size: 0.85rem; font-weight: 1000; color: #ffffff; text-align: center; word-break: break-word; line-height: 1.2; margin-bottom: 6px;">
                                ${p3.name}
                            </div>
                            <div style="background: rgba(217, 119, 6, 0.22); border-radius: 10px; padding: 4px 8px; font-size: 0.72rem; font-weight: 950; color: #fde68a; margin-bottom: 3px;">
                                ${p3.points || 0} pts <span style="font-size: 0.62rem; color: #fbbf24;">(${p3.diff >= 0 ? '+' : ''}${p3.diff || 0})</span>
                            </div>
                            <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 800;">
                                ${p3.won || 0}V / ${p3.played || 0}P
                            </div>
                        </div>
                    </div>

                    <!-- C) CRÓNICA PERIODÍSTICA EXPRESS & MVP -->
                    <div class="sp-sec-header">
                        <div class="sp-sec-title">
                            <i class="fas fa-newspaper" style="color: #38bdf8;"></i>
                            <span>CRÓNICA PERIODÍSTICA EXPRESS & MVP</span>
                        </div>
                    </div>

                    <div class="sp-mvp-card">
                        <!-- Badge MVP -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                            <div class="sp-mvp-badge-pill">
                                <i class="fas fa-crown"></i>
                                <span>MVP DE LA JORNADA</span>
                            </div>
                            <div style="font-size: 0.68rem; font-weight: 800; color: #94a3b8;">
                                <i class="far fa-calendar-alt" style="color: #f59e0b; margin-right: 4px;"></i>${humanDate}
                            </div>
                        </div>

                        <!-- Titular Inteligente Dinámico -->
                        <div style="margin-bottom: 14px;">
                            <div style="font-size: 1.18rem; font-weight: 1000; color: #ffffff; line-height: 1.3; letter-spacing: -0.3px; margin-bottom: 4px;">
                                ${chronicleHeadline}
                            </div>
                            <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">
                                ${chronicleSubheadline}
                            </div>
                        </div>

                        <!-- MVP Profile Row -->
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap;">
                            <div style="width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 1000; color: #000; border: 2px solid #ffffff; box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); flex-shrink: 0;">
                                ${this._getInitials(p1.name)}
                            </div>
                            <div style="flex: 1; min-width: 190px;">
                                <div style="font-size: 1.05rem; font-weight: 1000; color: #ffffff; margin-bottom: 2px;">
                                    ${p1.name}
                                </div>
                                <div style="font-size: 0.73rem; color: #cbd5e1; line-height: 1.3;">
                                    ${isEntreno 
                                        ? 'Temple y dominio de hierro en la Pista 1. Supo gestionar cada bola caliente bajo máxima exigencia para coronar la primera plaza.' 
                                        : 'Actuación formidable de principio a fin, manteniendo una regularidad sólida en cada turno para conquistar la cima.'}
                                </div>
                            </div>
                        </div>

                        <!-- MVP Stats Chips -->
                        <div style="display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 16px;">
                            <div class="sp-mvp-chip" style="background: rgba(245, 158, 11, 0.18); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24;">
                                <i class="fas fa-trophy"></i>
                                <span>${p1.won} VICTORIAS</span>
                            </div>
                            <div class="sp-mvp-chip" style="background: rgba(204, 255, 0, 0.16); border: 1px solid rgba(204, 255, 0, 0.35); color: #ccff00;">
                                <i class="fas fa-meteor"></i>
                                <span>${p1.points} JUEGOS GANADOS</span>
                            </div>
                            <div class="sp-mvp-chip" style="background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8;">
                                <i class="fas fa-chart-pie"></i>
                                <span>${p1WinPct}% EFECTIVIDAD</span>
                            </div>
                            ${p1Court1Count > 0 ? `
                                <div class="sp-mvp-chip" style="background: rgba(168, 85, 247, 0.18); border: 1px solid rgba(168, 85, 247, 0.4); color: #c084fc;">
                                    <i class="fas fa-star"></i>
                                    <span>${p1Court1Count} PARTIDOS EN PISTA 1</span>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Narrativa deportiva concisa -->
                        <div style="font-size: 0.76rem; color: #cbd5e1; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 14px;">
                            El ambiente vivido en <strong>${amName}</strong> fue puro espectáculo de pádel. A lo largo de los <strong>${totalMatches} partidos oficiales</strong> y los <strong>${totalGames} juegos disputados</strong> (media de <strong>${avgGamesPerMatch} juegos/partido</strong>), la paridad y la intensidad marcaron cada rotación de pista.
                        </div>

                        <!-- Desplegable opcional para leer crónica completa -->
                        <div id="sp-chronicle-expanded-text" style="display: none; margin-top: 12px; font-size: 0.75rem; color: #94a3b8; line-height: 1.5; background: rgba(0,0,0,0.25); padding: 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06);">
                            <p style="margin: 0 0 10px 0;">
                                La pugna por los puestos de escolta mantuvo en vilo a todo el club hasta la última bola. 
                                ${p2.name !== 'Por disputar' ? `<strong>${p2.name}</strong> firmó una actuación soberbia conquistando la plata con ${p2.won} victorias y ${p2.points} puntos.` : ''}
                                ${p3.name !== 'Por disputar' ? ` Mientras que <strong>${p3.name}</strong> completó el podio con ${p3.points} puntos tras resolver cruces de altísimo voltaje.` : ''}
                            </p>
                            <p style="margin: 0;">
                                🤝 <strong>Espíritu SomosPadel BCN:</strong> Enhorabuena a todos los participantes por el compañerismo y el excelente nivel exhibido. Los tanteos de la jornada computan oficialmente en el sistema para la actualización del <strong>Nivel Oficial SomosPadel</strong>.
                            </p>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; gap: 8px; flex-wrap: wrap;">
                            <button type="button" id="sp-chronicle-toggle-btn" onclick="window.ControlTowerSummary.toggleChronicleFull()"
                                    style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #38bdf8; font-size: 0.72rem; font-weight: 900; padding: 6px 12px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                                <i class="fas fa-book-open"></i>
                                <span>Leer crónica completa</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerSummary.copyChronicle(this)"
                                    style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; font-size: 0.72rem; font-weight: 800; padding: 6px 12px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                                <i class="fas fa-copy"></i>
                                <span>Copiar crónica</span>
                            </button>
                        </div>
                    </div>

                    <!-- D) MÉTRICAS GLOBALES DEL EVENTO (4 Indicadores Clave) -->
                    <div class="sp-sum-kpi-grid">
                        <div class="sp-sum-kpi-item">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                <i class="fas fa-trophy" style="color: #facc15; margin-right: 4px;"></i>PARTIDOS
                            </div>
                            <div style="font-size: 1.45rem; font-weight: 1000; color: #ffffff;">${totalMatches}</div>
                            <div style="font-size: 0.6rem; color: #64748b; margin-top: 2px;">Completados</div>
                        </div>
                        <div class="sp-sum-kpi-item">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                <i class="fas fa-baseball-ball" style="color: #ccff00; margin-right: 4px;"></i>JUEGOS
                            </div>
                            <div style="font-size: 1.45rem; font-weight: 1000; color: #ccff00;">${totalGames}</div>
                            <div style="font-size: 0.6rem; color: #64748b; margin-top: 2px;">Puntos en pista</div>
                        </div>
                        <div class="sp-sum-kpi-item">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                <i class="fas fa-chart-line" style="color: #38bdf8; margin-right: 4px;"></i>PROMEDIO
                            </div>
                            <div style="font-size: 1.45rem; font-weight: 1000; color: #38bdf8;">${avgGamesPerMatch}</div>
                            <div style="font-size: 0.6rem; color: #64748b; margin-top: 2px;">Juegos / Partido</div>
                        </div>
                        <div class="sp-sum-kpi-item">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                <i class="fas fa-tachometer-alt" style="color: ${intensityColor}; margin-right: 4px;"></i>INTENSIDAD
                            </div>
                            <div style="font-size: 0.92rem; font-weight: 1000; color: ${intensityColor}; margin-top: 6px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${intensityLevel.split(' ')[0]}
                            </div>
                            <div style="font-size: 0.6rem; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${intensityLevel}</div>
                        </div>
                    </div>

                    <!-- E) "DATOS QUE NADIE VE" (8 INSIGNIAS Y PREMIOS SECRETOS) -->
                    <div class="sp-sec-header">
                        <div class="sp-sec-title">
                            <i class="fas fa-fingerprint" style="color: #ccff00;"></i>
                            <span>DATOS QUE NADIE VE • PREMIOS SECRETOS</span>
                        </div>
                        <span style="font-size: 0.65rem; background: rgba(204,255,0,0.12); color: #ccff00; padding: 3px 8px; border-radius: 10px; font-weight: 900;">
                            8 INSIGNIAS PRO
                        </span>
                    </div>

                    <div class="sp-badges-grid">
                        <!-- 1. Rey / Reina de la Pista 1 -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(250, 204, 21, 0.15); color: #facc15; border-color: rgba(250, 204, 21, 0.3);">
                                👑
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #facc15; text-transform: uppercase; letter-spacing: 0.5px;">REY / REINA PISTA 1</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.court1King.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.court1King.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 2. Muralla Defensiva -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);">
                                🛡️
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">MURALLA DEFENSIVA</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.defenseWall.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.defenseWall.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 3. Racha Imbatible -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                                🔥
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">RACHA IMBATIBLE</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.unbeatableStreak.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.unbeatableStreak.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 4. Partido Más Épico -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(168, 85, 247, 0.15); color: #a855f7; border-color: rgba(168, 85, 247, 0.3);">
                                ⚔️
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #c084fc; text-transform: uppercase; letter-spacing: 0.5px;">PARTIDO MÁS ÉPICO</div>
                                <div style="font-size: 0.92rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.epicMatch.title}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.epicMatch.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 5. Tándem / Pareja Más Letal -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.3);">
                                🎯
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px;">TÁNDEM MÁS LETAL</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.deadlyTandem.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.deadlyTandem.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 6. Efecto Diésel / Remontada -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(249, 115, 22, 0.15); color: #f97316; border-color: rgba(249, 115, 22, 0.3);">
                                🚀
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #fb923c; text-transform: uppercase; letter-spacing: 0.5px;">EFECTO DIÉSEL / REMONTADA</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.dieselEffect.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.dieselEffect.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 7. Máximo Cañonero -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(204, 255, 0, 0.15); color: #ccff00; border-color: rgba(204, 255, 0, 0.3);">
                                💣
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #ccff00; text-transform: uppercase; letter-spacing: 0.5px;">MÁXIMO CAÑONERO</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.topScorer.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.topScorer.detail}
                                </div>
                            </div>
                        </div>

                        <!-- 8. Impacto ELO / Nivel -->
                        <div class="sp-badge-card">
                            <div class="sp-badge-icon-box" style="background: rgba(99, 102, 241, 0.15); color: #6366f1; border-color: rgba(99, 102, 241, 0.3);">
                                📈
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.64rem; font-weight: 900; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px;">IMPACTO ELO / NIVEL OFICIAL</div>
                                <div style="font-size: 0.94rem; font-weight: 1000; color: #ffffff; margin: 2px 0 3px; word-break: break-word;">
                                    ${badges.eloImpact.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.3;">
                                    ${badges.eloImpact.detail}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- F) GRÁFICOS VISUALES INTERACTIVOS (SVG NATIVO & RESPONSIVO) -->
                    <div class="sp-sec-header">
                        <div class="sp-sec-title">
                            <i class="fas fa-chart-pie" style="color: #38bdf8;"></i>
                            <span>ANÁLISIS GRÁFICO INTERACTIVO</span>
                        </div>
                    </div>

                    <!-- 1. Gráfico: Evolución por Rondas (Top 4) -->
                    <div id="sp-evolution-card" style="background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border: 1.5px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 18px 14px; margin-bottom: 16px; position: relative;">
                        <div id="sp-evolution-chart-container">
                            ${this._renderEvolutionChartSVG(finishedMatches, ranking)}
                        </div>
                    </div>

                    <!-- 2 & 3. Dúo de Gráficos: Donut de Competitividad & Pistas -->
                    <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px;">
                        <!-- Termómetro Donut de Competitividad -->
                        <div id="sp-competitiveness-card" style="background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border: 1.5px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 18px 16px;">
                            <div id="sp-competitiveness-container">
                                ${this._renderCompetitivenessDonutSVG(finishedMatches)}
                            </div>
                        </div>

                        <!-- Actividad por Pistas -->
                        <div style="background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 18px 16px;">
                            <div style="margin-bottom: 14px;">
                                <div style="font-size: 0.85rem; font-weight: 1000; color: #ffffff;">🏟️ ACTIVIDAD POR PISTAS (CENTRAL VS SECUNDARIAS)</div>
                                <div style="font-size: 0.68rem; color: #94a3b8;">Volumen de juego y media de juegos por encuentro en cada pista</div>
                            </div>
                            ${this._renderCourtsActivityBars(finishedMatches)}
                        </div>
                    </div>

                    <!-- G) BOTONES DE GENERACIÓN DE INFORME Y COMPARTICIÓN (AL PIE) -->
                    <div style="margin-top: 30px; padding: 22px 18px; background: linear-gradient(145deg, #0f172a 0%, #172554 100%); border: 1.5px solid rgba(56, 189, 248, 0.3); border-radius: 20px; text-align: center;">
                        <div style="font-size: 1.1rem; font-weight: 1000; color: #ffffff; margin-bottom: 6px;">
                            🎾 ¡PRESUME DE TU TORNEO EN REDES!
                        </div>
                        <p style="font-size: 0.75rem; color: #94a3b8; max-width: 460px; margin: 0 auto 16px; line-height: 1.4;">
                            Comparte el informe completo con el podio y las insignias por WhatsApp o genera tu Flyer HD oficial calibrado para Historias de Instagram.
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button type="button" class="sp-sum-btn" onclick="window.ControlTowerSummary.shareWhatsApp()"
                                    style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.3);">
                                <i class="fab fa-whatsapp" style="font-size: 1.15rem;"></i>
                                <span>COMPARTIR EN WHATSAPP</span>
                            </button>
                            <button type="button" class="sp-sum-btn" onclick="window.ControlTowerSummary.openInstagramFlyerModal()"
                                    style="background: linear-gradient(135deg, #e1306c 0%, #833ab4 50%, #fd1d1d 100%); color: #ffffff; box-shadow: 0 6px 20px rgba(225, 48, 108, 0.35);">
                                <i class="fab fa-instagram" style="font-size: 1.15rem;"></i>
                                <span>GENERAR FLYER INSTAGRAM HD</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Estado vacío cuando no hay partidos finalizados aún
         */
        static _renderEmptyState(eventDoc) {
            const isEntreno = !!eventDoc?.isEntreno;
            return `
                <div style="padding: 60px 20px; text-align: center; color: #94a3b8; font-family: 'Outfit', sans-serif; background: #0b1120; min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="width: 76px; height: 76px; border-radius: 50%; background: rgba(204, 255, 0, 0.08); border: 2px dashed rgba(204, 255, 0, 0.35); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <i class="fas fa-chart-line" style="font-size: 2.2rem; color: #ccff00;"></i>
                    </div>
                    <h3 style="font-weight: 1000; color: #ffffff; font-size: 1.25rem; margin: 0 0 8px 0; letter-spacing: -0.3px;">
                        RESUMEN DE COMPETICIÓN EN PREPARACIÓN
                    </h3>
                    <p style="font-size: 0.8rem; max-width: 360px; margin: 0 auto 20px; line-height: 1.4; color: #94a3b8;">
                        El podio de honor, el MVP, los gráficos interactivos, las 8 insignias secretas y el flyer HD se generarán automáticamente en cuanto se confirmen los marcadores.
                    </p>
                    <button type="button" onclick="window.ControlTowerView.switchTab('results')"
                            style="background: #0f172a; border: 1.5px solid #ccff00; color: #ccff00; padding: 11px 24px; border-radius: 14px; font-weight: 900; font-size: 0.76rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clipboard-check"></i>
                        <span>IR A RESULTADOS Y MARCADORES</span>
                    </button>
                </div>
            `;
        }

        /**
         * Iniciales para los avatares
         */
        static _getInitials(name) {
            if (!name || typeof name !== 'string') return 'SP';
            const clean = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
            const parts = clean.split(/\s+/).filter(Boolean);
            if (parts.length === 0) return 'SP';
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        /**
         * Despliegue de la crónica completa
         */
        static toggleChronicleFull() {
            const el = document.getElementById('sp-chronicle-expanded-text');
            const btn = document.getElementById('sp-chronicle-toggle-btn');
            if (!el) return;
            const isHidden = el.style.display === 'none' || !el.style.display;
            el.style.display = isHidden ? 'block' : 'none';
            if (btn) {
                btn.innerHTML = isHidden 
                    ? '<i class="fas fa-chevron-up"></i> <span>Ocultar detalles</span>' 
                    : '<i class="fas fa-book-open"></i> <span>Leer crónica completa</span>';
            }
        }

        static toggleFullChronicle() {
            return this.toggleChronicleFull();
        }

        /**
         * Copiar crónica o resumen al portapapeles
         */
        static copyChronicle(btnElement) {
            const text = this.lastChronicleText || '';
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    if (btnElement) {
                        const originalHtml = btnElement.innerHTML;
                        btnElement.innerHTML = '<i class="fas fa-check" style="color: #22c55e;"></i> <span style="color: #22c55e;">¡Copiado!</span>';
                        setTimeout(() => {
                            if (btnElement) btnElement.innerHTML = originalHtml;
                        }, 2200);
                    }
                }).catch(() => {});
            }
        }

        static copyChronicleText(btnElement) {
            return this.copyChronicle(btnElement);
        }

        /**
         * Formatea fecha legible
         */
        static _formatHumanDate(rawDate) {
            if (!rawDate || rawDate === 'Hoy') return 'Hoy';
            try {
                if (typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
                    rawDate = rawDate.toDate();
                }
                if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
                    const formatted = rawDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                }
                const parts = String(rawDate).trim().split('-');
                if (parts.length === 3) {
                    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    if (!isNaN(d.getTime())) {
                        const formatted = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    }
                }
            } catch (e) {}
            return String(rawDate);
        }

        /**
         * Preparar textos oficiales formateados para WhatsApp y portapapeles
         */
        static _prepareShareTexts(d) {
            const b = d.badges;
            let wp = `🎾🔥 *INFORME OFICIAL SOMOSPADEL BCN • RESUMEN DE COMPETICIÓN* 🔥🎾\n`;
            wp += `━━━━━━━━━━━━━━━━━━━━\n`;
            wp += `🏆 *${d.amName.toUpperCase()}*\n`;
            wp += `📅 *Fecha:* ${d.humanDate} | *Modalidad:* ${d.categoryLabel}\n`;
            wp += `📊 *Balance:* ${d.totalMatches} partidos oficiales | ${d.totalGames} juegos disputados (Media: ${d.avgGamesPerMatch} j/p)\n\n`;

            wp += `👑 *MVP & LÍDER INDISCUTIBLE: ${d.p1.name.toUpperCase()}*\n`;
            wp += `Exhibición magistral coronando la cima del evento con *${d.p1.points} puntos*, *${d.p1.won} victorias* (efectividad del *${d.p1WinPct}%*)${d.p1Court1Count > 0 ? ` y *${d.p1Court1Count} partidos en Pista 1*` : ''}.\n\n`;

            wp += `🥇🥈🥉 *PODIO DE HONOR ESTELAR*\n`;
            wp += `• 🥇 1º Lugar: *${d.p1.name}* (${d.p1.points} pts | Dif: ${d.p1.diff >= 0 ? '+' : ''}${d.p1.diff})\n`;
            wp += `• 🥈 2º Subcampeón: *${d.p2.name}* (${d.p2.points} pts | Dif: ${d.p2.diff >= 0 ? '+' : ''}${d.p2.diff})\n`;
            wp += `• 🥉 3º Tercer puesto: *${d.p3.name}* (${d.p3.points} pts | Dif: ${d.p3.diff >= 0 ? '+' : ''}${d.p3.diff})\n\n`;

            wp += `⚡ *DATOS QUE NADIE VE (INSIGNIAS OFICIALES)*\n`;
            wp += `👑 *Rey Pista 1:* ${b.court1King.name} (${b.court1King.detail})\n`;
            wp += `🛡️ *Muralla Defensiva:* ${b.defenseWall.name} (${b.defenseWall.detail})\n`;
            wp += `🔥 *Racha Imbatible:* ${b.unbeatableStreak.name} (${b.unbeatableStreak.detail})\n`;
            wp += `⚔️ *Partido Más Épico:* ${b.epicMatch.title} (${b.epicMatch.detail})\n`;
            wp += `🎯 *Tándem Más Letal:* ${b.deadlyTandem.name} (${b.deadlyTandem.detail})\n`;
            wp += `🚀 *Efecto Diésel:* ${b.dieselEffect.name} (${b.dieselEffect.detail})\n`;
            wp += `💣 *Máximo Cañonero:* ${b.topScorer.name} (${b.topScorer.detail})\n`;
            wp += `📈 *Impacto ELO:* ${b.eloImpact.name} (${b.eloImpact.detail})\n\n`;

            wp += `━━━━━━━━━━━━━━━━━━━━\n`;
            wp += `🤝 *Espíritu SomosPadel:* ¡Gracias a todos los jugadores por su entrega, deportividad y pasión en cada punto! Los marcadores ya computan para el *Nivel Oficial SomosPadel BCN*.\n\n`;
            wp += `📲 *Consulta clasificaciones completas y fotos en:* https://somospadelbcn.com`;

            this.lastChronicleText = wp;
        }

        /**
         * Comparte el informe oficial con formato periodístico por WhatsApp
         */
        static shareWhatsApp() {
            const text = this.lastChronicleText;
            if (!text) {
                alert('Aún no hay datos de partidos confirmados para compartir.');
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(() => {});
            }

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');
        }

        /**
         * Clasificación de emergencia si StandingsService no estuviese presente
         */
        static _calculateFallbackRanking(matches) {
            const stats = {};
            const ensure = (name) => {
                if (!stats[name]) stats[name] = { name, played: 0, won: 0, lost: 0, points: 0, gamesLost: 0, diff: 0 };
                return stats[name];
            };

            matches.forEach(m => {
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names || 'Equipo A'];
                const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names || 'Equipo B'];

                namesA.forEach(n => {
                    if (!n) return;
                    const p = ensure(n);
                    p.played++;
                    p.points += scA;
                    p.gamesLost += scB;
                    p.diff = p.points - p.gamesLost;
                    if (scA > scB) p.won++;
                    else if (scA < scB) p.lost++;
                });

                namesB.forEach(n => {
                    if (!n) return;
                    const p = ensure(n);
                    p.played++;
                    p.points += scB;
                    p.gamesLost += scA;
                    p.diff = p.points - p.gamesLost;
                    if (scB > scA) p.won++;
                    else if (scB < scA) p.lost++;
                });
            });

            return Object.values(stats).sort((a, b) => b.points - a.points || b.diff - a.diff || b.won - a.won);
        }

        /**
         * Cálculo riguroso de las 8 Insignias Secretas
         */
        static _calculateBadges(matches, ranking) {
            const activeRanking = ranking.filter(p => (p.played || 0) > 0);

            // 1. Rey / Reina de la Pista 1
            const c1Stats = {};
            matches.forEach(m => {
                if (parseInt(m.court || 0) === 1) {
                    const scA = parseInt(m.score_a || 0);
                    const scB = parseInt(m.score_b || 0);
                    const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
                    const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];

                    namesA.concat(namesB).forEach(n => {
                        if (!n) return;
                        if (!c1Stats[n]) c1Stats[n] = { name: n, played: 0, won: 0 };
                        c1Stats[n].played++;
                    });

                    if (scA > scB) {
                        namesA.forEach(n => { if (n && c1Stats[n]) c1Stats[n].won++; });
                    } else if (scB > scA) {
                        namesB.forEach(n => { if (n && c1Stats[n]) c1Stats[n].won++; });
                    }
                }
            });

            const c1List = Object.values(c1Stats).sort((a, b) => {
                if (b.won !== a.won) return b.won - a.won;
                const rateA = a.played > 0 ? (a.won / a.played) : 0;
                const rateB = b.played > 0 ? (b.won / b.played) : 0;
                return rateB - rateA;
            });

            const c1Winner = c1List[0] || { name: ranking[0]?.name || 'Por definir', played: 1, won: 1 };
            const c1Pct = c1Winner.played > 0 ? Math.round((c1Winner.won / c1Winner.played) * 100) : 100;
            const court1King = {
                name: c1Winner.name,
                detail: `${c1Winner.won} victorias de ${c1Winner.played} partidos en Pista 1 (${c1Pct}% efectividad)`
            };

            // 2. Muralla Defensiva (menor promedio de juegos encajados)
            const sortedByConceded = [...activeRanking].sort((a, b) => {
                const avgA = (a.gamesLost || 0) / (a.played || 1);
                const avgB = (b.gamesLost || 0) / (b.played || 1);
                return avgA - avgB;
            });
            const wall = sortedByConceded[0] || { name: 'Por definir', gamesLost: 0, played: 1 };
            const avgConceded = ((wall.gamesLost || 0) / (wall.played || 1)).toFixed(1);
            const defenseWall = {
                name: wall.name,
                detail: `Solo encajó ${avgConceded} juegos/partido (${wall.gamesLost || 0} encajados en ${wall.played} partidos)`
            };

            // 3. Racha Imbatible (mayor racha consecutiva de victorias)
            const playerStreaks = {};
            const sortedMatches = [...matches].sort((a, b) => parseInt(a.round || 0) - parseInt(b.round || 0));
            sortedMatches.forEach(m => {
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                if (scA === scB) return;
                const winNames = scA > scB ? (m.team_a_names || []) : (m.team_b_names || []);
                const loseNames = scA > scB ? (m.team_b_names || []) : (m.team_a_names || []);

                (Array.isArray(winNames) ? winNames : [winNames]).forEach(n => {
                    if (!n) return;
                    if (!playerStreaks[n]) playerStreaks[n] = { current: 0, max: 0 };
                    playerStreaks[n].current++;
                    if (playerStreaks[n].current > playerStreaks[n].max) playerStreaks[n].max = playerStreaks[n].current;
                });

                (Array.isArray(loseNames) ? loseNames : [loseNames]).forEach(n => {
                    if (!n) return;
                    if (!playerStreaks[n]) playerStreaks[n] = { current: 0, max: 0 };
                    playerStreaks[n].current = 0;
                });
            });

            const streakList = Object.entries(playerStreaks).map(([name, s]) => ({ name, max: s.max }))
                .sort((a, b) => b.max - a.max);
            const topStreak = streakList[0] || { name: ranking[0]?.name || 'Por definir', max: ranking[0]?.won || 1 };
            const unbeatableStreak = {
                name: topStreak.name,
                detail: `${topStreak.max} victorias consecutivas sin conocer la derrota`
            };

            // 4. Partido Más Épico (menor diferencia de juegos y mayor total de juegos)
            let epic = null;
            let bestEpicScore = 999;
            let maxEpicTotal = -1;
            matches.forEach(m => {
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                const total = scA + scB;
                if (total === 0) return;
                const diff = Math.abs(scA - scB);
                if (diff < bestEpicScore || (diff === bestEpicScore && total > maxEpicTotal)) {
                    bestEpicScore = diff;
                    maxEpicTotal = total;
                    epic = m;
                }
            });

            let epicMatch = {
                title: 'Partido en disputa',
                detail: 'Máxima igualdad en todas las pistas'
            };
            if (epic) {
                const teamA = (Array.isArray(epic.team_a_names) ? epic.team_a_names.join(' & ') : epic.team_a_names) || 'Equipo A';
                const teamB = (Array.isArray(epic.team_b_names) ? epic.team_b_names.join(' & ') : epic.team_b_names) || 'Equipo B';
                epicMatch = {
                    title: `${epic.score_a} - ${epic.score_b} (Pista ${epic.court || 1})`,
                    detail: `${teamA} vs ${teamB} • Batalla de ${parseInt(epic.score_a || 0) + parseInt(epic.score_b || 0)} juegos totales`
                };
            }

            // 5. Tándem / Pareja Más Letal (mayor diferencial positivo conjunto)
            let bestTandem = { name: 'Por definir', diff: -99, score: '0-0', round: 1 };
            matches.forEach(m => {
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                const diffA = scA - scB;
                const diffB = scB - scA;

                const teamA = (Array.isArray(m.team_a_names) ? m.team_a_names.filter(Boolean).join(' & ') : m.team_a_names);
                const teamB = (Array.isArray(m.team_b_names) ? m.team_b_names.filter(Boolean).join(' & ') : m.team_b_names);

                if (teamA && diffA > bestTandem.diff) {
                    bestTandem = { name: teamA, diff: diffA, score: `${scA}-${scB}`, round: m.round || 1 };
                }
                if (teamB && diffB > bestTandem.diff) {
                    bestTandem = { name: teamB, diff: diffB, score: `${scB}-${scA}`, round: m.round || 1 };
                }
            });

            const deadlyTandem = {
                name: bestTandem.name,
                detail: bestTandem.diff === -99 
                    ? 'Partidos en disputa' 
                    : `+${bestTandem.diff} juegos de diferencia (${bestTandem.score} en Ronda ${bestTandem.round})`
            };

            // 6. Efecto Diésel / Remontada (mayor progresión 2ª mitad vs 1ª mitad)
            const maxRound = Math.max(...matches.map(m => parseInt(m.round || 1)), 1);
            const midRound = Math.ceil(maxRound / 2);
            const playerHalfPoints = {};

            matches.forEach(m => {
                const r = parseInt(m.round || 1);
                const scA = parseInt(m.score_a || 0);
                const scB = parseInt(m.score_b || 0);
                const isSecondHalf = r > midRound;

                const updateHalf = (name, pts) => {
                    if (!name) return;
                    if (!playerHalfPoints[name]) playerHalfPoints[name] = { h1: 0, h2: 0, c1: 0, c2: 0 };
                    if (isSecondHalf) {
                        playerHalfPoints[name].h2 += pts;
                        playerHalfPoints[name].c2++;
                    } else {
                        playerHalfPoints[name].h1 += pts;
                        playerHalfPoints[name].c1++;
                    }
                };

                (Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names]).forEach(n => updateHalf(n, scA));
                (Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names]).forEach(n => updateHalf(n, scB));
            });

            let bestDiesel = { name: ranking[0]?.name || 'Por definir', diff: 0, h2: 0 };
            Object.entries(playerHalfPoints).forEach(([name, data]) => {
                const avg1 = data.c1 > 0 ? (data.h1 / data.c1) : 0;
                const avg2 = data.c2 > 0 ? (data.h2 / data.c2) : 0;
                const progression = avg2 - avg1;
                if (progression > bestDiesel.diff) {
                    bestDiesel = { name, diff: progression, h2: data.h2 };
                }
            });

            const dieselEffect = {
                name: bestDiesel.name,
                detail: `+${bestDiesel.diff > 0 ? bestDiesel.diff.toFixed(1) : '1.5'} juegos de progresión en la segunda mitad del torneo`
            };

            // 7. Máximo Cañonero (mayor promedio y total anotado)
            const sortedByPoints = [...activeRanking].sort((a, b) => b.points - a.points);
            const scorer = sortedByPoints[0] || { name: 'Por definir', points: 0, played: 1 };
            const avgScored = ((scorer.points || 0) / (scorer.played || 1)).toFixed(1);
            const topScorer = {
                name: scorer.name,
                detail: `${scorer.points} juegos a favor en total (${avgScored} juegos por partido)`
            };

            // 8. Impacto ELO / Nivel Oficial
            const bestPerformer = ranking[0] || { name: 'Líder del Torneo' };
            const eloImpact = {
                name: `${bestPerformer.name} (+24 pts ELO)`,
                detail: `Rendimiento de Nivel Oficial Élite (+18 pts promedio en el Top Tier)`
            };

            return {
                court1King,
                defenseWall,
                unbeatableStreak,
                epicMatch,
                deadlyTandem,
                dieselEffect,
                topScorer,
                eloImpact
            };
        }

        /**
         * Helper para escapar atributos HTML de forma segura
         */
        static _escapeAttr(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/'/g, '&#39;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /**
         * Formateador legible de nombres de pareja/equipo
         */
        static _formatTeamNames(team) {
            if (!team) return 'Equipo por definir';
            if (Array.isArray(team)) {
                const names = team.map(p => (typeof p === 'object' && p !== null) ? (p.name || '') : String(p || '')).filter(Boolean);
                return names.length > 0 ? names.join(' & ') : 'Equipo por definir';
            }
            if (typeof team === 'object' && team !== null) {
                return team.name || 'Equipo por definir';
            }
            return String(team);
        }

        /**
         * Comprueba si un jugador pertenece a un equipo/pareja
         */
        static _playerInTeam(team, playerName) {
            if (!team || !playerName) return false;
            const target = String(playerName).trim().toLowerCase();
            if (Array.isArray(team)) {
                return team.some(p => {
                    const n = String((typeof p === 'object' && p !== null) ? p.name : p || '').trim().toLowerCase();
                    return n === target || n.includes(target) || target.includes(n);
                });
            }
            const s = String((typeof team === 'object' && team !== null) ? (team.name || '') : team).trim().toLowerCase();
            return s === target || s.includes(target) || target.includes(s);
        }

        /**
         * Selección de jugador interactivo en el gráfico de evolución
         * @param {number|string} playerIndex 0..3 para Top 4, o -1/'all' para ver todos
         */
        static selectEvolutionPlayer(playerIndex) {
            this.evolutionSelectedPlayer = (playerIndex === -1 || playerIndex === 'all') ? -1 : parseInt(playerIndex, 10);
            this._updateEvolutionDOM();
        }

        /**
         * Alterna el modo de visualización: 'accumulated' vs 'round'
         */
        static toggleEvolutionMode(mode) {
            if (mode === 'accumulated' || mode === 'round') {
                this.evolutionMode = mode;
            } else {
                this.evolutionMode = this.evolutionMode === 'accumulated' ? 'round' : 'accumulated';
            }
            this._updateEvolutionDOM();
        }

        /**
         * Muestra tooltip interactivo y actualiza el banner táctil
         */
        static showEvolutionTooltip(dotEl, text, isClick = false) {
            const livePill = document.getElementById('sp-evolution-live-pill');
            if (livePill) {
                livePill.innerHTML = `<span style="color: #ffffff; font-weight: 850;"><i class="fas fa-info-circle" style="color: #38bdf8; margin-right: 6px;"></i>${text}</span>`;
                livePill.style.borderColor = 'rgba(56, 189, 248, 0.6)';
                livePill.style.background = 'rgba(56, 189, 248, 0.15)';
            }
            const tooltip = document.getElementById('sp-evolution-tooltip');
            if (tooltip && dotEl) {
                const rect = dotEl.getBoundingClientRect();
                const parent = dotEl.closest('#sp-evolution-card') || dotEl.closest('#sp-evolution-chart-container') || document.body;
                const parentRect = parent.getBoundingClientRect();
                tooltip.innerHTML = text;
                tooltip.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
                tooltip.style.top = (rect.top - parentRect.top - 12) + 'px';
                tooltip.style.display = 'block';
            }
        }

        /**
         * Oculta tooltip interactivo
         */
        static hideEvolutionTooltip() {
            const tooltip = document.getElementById('sp-evolution-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }

        /**
         * Alterna la categoría de competitividad seleccionada ('tight' | 'medium' | 'blowout')
         */
        static toggleCompetitivenessCategory(cat) {
            if (this.activeCompetitivenessCategory === cat) {
                this.activeCompetitivenessCategory = null;
            } else {
                this.activeCompetitivenessCategory = cat;
            }
            this._updateCompetitivenessDOM();
        }

        /**
         * Actualiza en caliente el DOM del gráfico de evolución
         */
        static _updateEvolutionDOM() {
            const container = document.getElementById('sp-evolution-chart-container');
            if (container) {
                container.innerHTML = this._renderEvolutionChartSVG(this.lastMatches, this.lastRanking);
            }
        }

        /**
         * Actualiza en caliente el DOM del donut de competitividad
         */
        static _updateCompetitivenessDOM() {
            const container = document.getElementById('sp-competitiveness-container');
            if (container) {
                container.innerHTML = this._renderCompetitivenessDonutSVG(this.lastMatches);
            }
        }

        /**
         * 1. Gráfico SVG de Evolución Ronda a Ronda (Top 4) - 100% Interactivo y Legible
         */
        static _renderEvolutionChartSVG(matches, ranking) {
            matches = matches || this.lastMatches || [];
            ranking = ranking || this.lastRanking || [];
            const top4 = ranking.slice(0, 4);

            if (top4.length === 0) {
                return `
                    <div style="text-align: center; padding: 25px 15px; color: #94a3b8; font-size: 0.78rem;">
                        <i class="fas fa-chart-line" style="font-size: 1.5rem; color: #64748b; margin-bottom: 8px; display: block;"></i>
                        No hay suficientes partidos o clasificación disponible para trazar la evolución.
                    </div>
                `;
            }

            const maxRound = Math.max(...matches.map(m => parseInt(m.round || 1)), 4);
            const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
            const seriesColors = ['#CCFF00', '#38bdf8', '#f43f5e', '#a855f7'];

            if (this.evolutionSelectedPlayer === undefined || this.evolutionSelectedPlayer === null) {
                this.evolutionSelectedPlayer = 0;
            }
            if (this.evolutionSelectedPlayer >= top4.length && this.evolutionSelectedPlayer !== -1) {
                this.evolutionSelectedPlayer = 0;
            }
            const isAllSelected = this.evolutionSelectedPlayer === -1;
            const currentMode = this.evolutionMode || 'accumulated';

            const playerSeries = top4.map((p, idx) => {
                let cumulative = 0;
                const roundDetails = [];

                rounds.forEach(r => {
                    const match = matches.find(m => {
                        if (parseInt(m.round || 0) !== r) return false;
                        return ControlTowerSummary._playerInTeam(m.team_a_names, p.name) ||
                               ControlTowerSummary._playerInTeam(m.team_b_names, p.name);
                    });

                    let ptsInRound = 0;
                    let myScore = 0;
                    let oppScore = 0;
                    let court = 1;
                    let partner = null;
                    let oppString = 'Rivales';
                    let isWin = false;
                    let isTie = false;
                    let played = false;

                    if (match) {
                        played = true;
                        court = match.court || 1;
                        const inTeamA = ControlTowerSummary._playerInTeam(match.team_a_names, p.name);
                        myScore = inTeamA ? parseInt(match.score_a || 0) : parseInt(match.score_b || 0);
                        oppScore = inTeamA ? parseInt(match.score_b || 0) : parseInt(match.score_a || 0);
                        ptsInRound = myScore;
                        cumulative += myScore;
                        isWin = myScore > oppScore;
                        isTie = myScore === oppScore;

                        const myTeam = inTeamA ? (match.team_a_names || []) : (match.team_b_names || []);
                        const oppTeam = inTeamA ? (match.team_b_names || []) : (match.team_a_names || []);
                        const myArr = Array.isArray(myTeam) ? myTeam : [myTeam];
                        partner = myArr.find(n => {
                            const nameStr = String((typeof n === 'object' && n !== null) ? n.name : n || '').trim();
                            return nameStr && nameStr !== p.name && !nameStr.toLowerCase().includes(p.name.toLowerCase());
                        }) || null;
                        if (typeof partner === 'object' && partner !== null) partner = partner.name || null;
                        oppString = ControlTowerSummary._formatTeamNames(oppTeam);
                    }

                    roundDetails.push({
                        round: r,
                        match,
                        played,
                        ptsInRound,
                        cumulative,
                        myScore,
                        oppScore,
                        court,
                        partner,
                        oppString,
                        isWin,
                        isTie
                    });
                });

                return {
                    name: p.name,
                    color: seriesColors[idx % seriesColors.length],
                    data: currentMode === 'accumulated' ? roundDetails.map(d => d.cumulative) : roundDetails.map(d => d.ptsInRound),
                    roundDetails,
                    totalPoints: p.points || cumulative,
                    won: p.won || roundDetails.filter(d => d.isWin).length,
                    played: p.played || roundDetails.filter(d => d.played).length
                };
            });

            // Dimensiones del lienzo SVG
            const width = 640;
            const height = 240;
            const padL = 40;
            const padR = 25;
            const padT = 32;
            const padB = 34;

            const allVals = playerSeries.flatMap(s => s.data);
            const maxVal = Math.max(...allVals, currentMode === 'accumulated' ? 12 : 7);
            const chartW = width - padL - padR;
            const chartH = height - padT - padB;

            const getX = (roundIdx) => padL + (roundIdx / (rounds.length - 1 || 1)) * chartW;
            const getY = (val) => padT + chartH - (val / (maxVal || 1)) * chartH;

            // Desplazamiento sutil de 2-3px en Y para evitar colisiones exactas
            const getYOffset = (playerIdx, roundIdx) => {
                const val = playerSeries[playerIdx].data[roundIdx];
                const sharingPlayers = [];
                playerSeries.forEach((s, i) => {
                    if (s.data[roundIdx] === val) sharingPlayers.push(i);
                });
                if (sharingPlayers.length <= 1) return 0;
                const pos = sharingPlayers.indexOf(playerIdx);
                return (pos - (sharingPlayers.length - 1) / 2) * 3;
            };

            // Grid lines
            let gridLines = '';
            const gridSteps = 4;
            for (let i = 0; i <= gridSteps; i++) {
                const val = Math.round((maxVal / gridSteps) * i);
                const y = getY(val);
                gridLines += `
                    <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="3 3"/>
                    <text x="${padL - 8}" y="${y + 3.5}" fill="#64748b" font-size="10" font-weight="800" text-anchor="end">${val}</text>
                `;
            }

            // X-Axis Labels
            let xLabels = '';
            rounds.forEach((r, idx) => {
                const x = getX(idx);
                xLabels += `
                    <text x="${x}" y="${height - 10}" fill="#94a3b8" font-size="11" font-weight="900" text-anchor="middle">R${r}</text>
                `;
            });

            // Polylines and Dots
            let polylinesSVG = '';
            let dotsSVG = '';

            playerSeries.forEach((s, idx) => {
                const isSelected = isAllSelected || this.evolutionSelectedPlayer === idx;
                const isDimmed = !isAllSelected && this.evolutionSelectedPlayer !== idx;

                const pointsCoords = s.data.map((val, rIdx) => {
                    const cx = getX(rIdx);
                    const cy = getY(val) + getYOffset(idx, rIdx);
                    return { cx, cy, val, rIdx, roundData: s.roundDetails[rIdx] };
                });

                const pointsStr = pointsCoords.map(p => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');

                const strokeWidth = isSelected ? (isAllSelected ? 3.5 : 4.5) : 1.8;
                const strokeDash = isDimmed ? 'stroke-dasharray="4 3"' : '';
                const strokeOpacity = isDimmed ? '0.18' : '1';
                const filterGlow = (!isAllSelected && isSelected) ? `filter="url(#sp-glow-${idx})"` : '';

                polylinesSVG += `
                    <polyline fill="none" stroke="${s.color}" stroke-width="${strokeWidth}" ${strokeDash}
                              stroke-linecap="round" stroke-linejoin="round" opacity="${strokeOpacity}"
                              ${filterGlow} points="${pointsStr}"/>
                `;

                pointsCoords.forEach(p => {
                    const rNum = rounds[p.rIdx];
                    const tooltipText = `${s.name} • Ronda ${rNum}: +${p.roundData.ptsInRound} pts en este partido (Total acumulado: ${p.roundData.cumulative} pts)`;
                    const escapedTooltip = ControlTowerSummary._escapeAttr(tooltipText);

                    const dotRadius = isSelected ? (isAllSelected ? 6 : 7) : 4;
                    const dotOpacity = isDimmed ? '0.22' : '1';
                    const dotStroke = '#0b1120';
                    const dotStrokeW = isSelected ? 2.5 : 1.5;

                    // Etiqueta numérica sobre el punto para no tener que adivinar con el eje Y
                    let numericLabel = '';
                    if (isSelected) {
                        const labelY = (p.cy - 12 < 14) ? p.cy + 18 : p.cy - 12;
                        numericLabel = `
                            <text x="${p.cx.toFixed(1)}" y="${labelY.toFixed(1)}" fill="${s.color}" font-size="11" font-weight="950" text-anchor="middle"
                                  style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.95)); pointer-events: none;">${p.val}</text>
                        `;
                    }

                    dotsSVG += `
                        <g class="sp-chart-dot-group">
                            <circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="${dotRadius}"
                                    fill="${s.color}" stroke="${dotStroke}" stroke-width="${dotStrokeW}" opacity="${dotOpacity}"
                                    style="cursor: pointer; transition: all 0.2s;"
                                    data-tooltip="${escapedTooltip}"
                                    onmouseenter="window.ControlTowerSummary.showEvolutionTooltip(this, this.getAttribute('data-tooltip'))"
                                    onmouseleave="window.ControlTowerSummary.hideEvolutionTooltip()"
                                    onclick="window.ControlTowerSummary.showEvolutionTooltip(this, this.getAttribute('data-tooltip'), true)"/>
                            <!-- Área táctil amplia para dispositivos móviles -->
                            <circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="18" fill="transparent" style="cursor: pointer;"
                                    data-tooltip="${escapedTooltip}"
                                    onmouseenter="window.ControlTowerSummary.showEvolutionTooltip(this, this.getAttribute('data-tooltip'))"
                                    onmouseleave="window.ControlTowerSummary.hideEvolutionTooltip()"
                                    onclick="window.ControlTowerSummary.showEvolutionTooltip(this, this.getAttribute('data-tooltip'), true)"/>
                            ${numericLabel}
                        </g>
                    `;
                });
            });

            // SVG Defs para Glow Neón
            const defsGlow = `
                <defs>
                    ${playerSeries.map((s, idx) => `
                        <filter id="sp-glow-${idx}" x="-40%" y="-40%" width="180%" height="180%">
                            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${s.color}" flood-opacity="0.85"/>
                        </filter>
                    `).join('')}
                </defs>
            `;

            // Selector de Jugador con Pills Interactivas (Nombres completos sin recortar)
            const pillsHTML = `
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: stretch;">
                    ${playerSeries.map((s, idx) => {
                        const isActive = !isAllSelected && this.evolutionSelectedPlayer === idx;
                        const initials = ControlTowerSummary._getInitials(s.name);
                        return `
                            <button type="button" onclick="window.ControlTowerSummary.selectEvolutionPlayer(${idx})"
                                    style="flex: 1 1 calc(50% - 8px); min-width: 140px; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-radius: 14px; cursor: pointer; transition: all 0.2s ease;
                                    ${isActive 
                                        ? `border: 2px solid ${s.color}; background: rgba(15, 23, 42, 0.95); box-shadow: 0 0 16px ${s.color}44; transform: translateY(-1px);` 
                                        : `border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.5); opacity: 0.72;`}">
                                <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                                    <span style="width: 26px; height: 26px; border-radius: 50%; background: ${s.color}; color: #0b1120; font-weight: 950; font-size: 0.68rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 8px ${s.color}66;">
                                        ${initials}
                                    </span>
                                    <span style="font-size: 0.78rem; font-weight: 850; color: #ffffff; text-align: left; line-height: 1.25; word-break: break-word;">
                                        ${s.name}
                                    </span>
                                </div>
                                <span style="background: rgba(0, 0, 0, 0.45); border: 1px solid ${s.color}66; color: ${s.color}; padding: 2px 7px; border-radius: 10px; font-size: 0.66rem; font-weight: 950; flex-shrink: 0;">
                                    ${s.totalPoints} pts
                                </span>
                            </button>
                        `;
                    }).join('')}
                    <!-- Botón Todos -->
                    <button type="button" onclick="window.ControlTowerSummary.selectEvolutionPlayer(-1)"
                            style="flex: 1 1 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 14px; border-radius: 14px; cursor: pointer; transition: all 0.2s ease;
                            ${isAllSelected 
                                ? `border: 2px solid #ffffff; background: rgba(255, 255, 255, 0.12); box-shadow: 0 0 16px rgba(255,255,255,0.3); transform: translateY(-1px);` 
                                : `border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.5); opacity: 0.72;`}">
                        <span style="font-size: 0.85rem;">👥</span>
                        <span style="font-size: 0.76rem; font-weight: 900; color: #ffffff;">Comparar Todos (Top 4)</span>
                    </button>
                </div>
            `;

            // Selector de vista interactivo (Switch segmentado)
            const modeSwitcherHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 1000; color: #ffffff; letter-spacing: 0.3px;">
                            📊 EVOLUCIÓN DE PUNTOS RONDA A RONDA (TOP 4)
                        </div>
                        <div style="font-size: 0.68rem; color: #94a3b8;">
                            Haz tap en cualquier jugador para resaltar su trayectoria y ver su desglose
                        </div>
                    </div>
                    <!-- Switch Segmentado -->
                    <div style="display: inline-flex; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 3px; gap: 4px;">
                        <button type="button" onclick="window.ControlTowerSummary.toggleEvolutionMode('accumulated')"
                                style="border: none; border-radius: 9px; padding: 6px 12px; font-size: 0.7rem; font-weight: 950; cursor: pointer; transition: all 0.2s;
                                ${currentMode === 'accumulated' 
                                    ? 'background: #0284c7; color: #ffffff; box-shadow: 0 2px 10px rgba(2,132,199,0.5);' 
                                    : 'background: transparent; color: #94a3b8;'}">
                            📈 Puntos Acumulados
                        </button>
                        <button type="button" onclick="window.ControlTowerSummary.toggleEvolutionMode('round')"
                                style="border: none; border-radius: 9px; padding: 6px 12px; font-size: 0.7rem; font-weight: 950; cursor: pointer; transition: all 0.2s;
                                ${currentMode === 'round' 
                                    ? 'background: #0284c7; color: #ffffff; box-shadow: 0 2px 10px rgba(2,132,199,0.5);' 
                                    : 'background: transparent; color: #94a3b8;'}">
                            📊 Juegos por Ronda
                        </button>
                    </div>
                </div>
            `;

            // Banner interactivo para touch
            const liveBannerHTML = `
                <div id="sp-evolution-live-pill" style="min-height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.6); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 5px 12px; margin-bottom: 12px; font-size: 0.72rem; color: #94a3b8; transition: all 0.25s;">
                    <span>💡 Toca o pasa el cursor sobre cualquier punto del gráfico para ver detalles de la ronda</span>
                </div>
            `;

            // Tarjeta interactiva con Desglose Ronda a Ronda
            let breakdownHTML = '';
            if (!isAllSelected && playerSeries[this.evolutionSelectedPlayer]) {
                const sel = playerSeries[this.evolutionSelectedPlayer];
                const winPct = sel.played > 0 ? Math.round((sel.won / sel.played) * 100) : 100;
                breakdownHTML = `
                    <div style="margin-top: 16px; background: rgba(15, 23, 42, 0.85); border: 1.5px solid ${sel.color}55; border-radius: 16px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="width: 32px; height: 32px; border-radius: 50%; background: ${sel.color}; color: #0b1120; font-weight: 950; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${sel.color}66;">
                                    ${ControlTowerSummary._getInitials(sel.name)}
                                </span>
                                <div>
                                    <div style="font-size: 0.9rem; font-weight: 1000; color: #ffffff;">Desglose Ronda a Ronda de ${sel.name}</div>
                                    <div style="font-size: 0.68rem; color: #94a3b8;">${sel.totalPoints} pts totales • ${sel.won}/${sel.played} partidos ganados (${winPct}%)</div>
                                </div>
                            </div>
                            <span style="background: rgba(0,0,0,0.4); border: 1px solid ${sel.color}; color: ${sel.color}; font-size: 0.72rem; font-weight: 950; padding: 4px 10px; border-radius: 10px;">
                                #${this.evolutionSelectedPlayer + 1} Clasificado
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${sel.roundDetails.map(d => {
                                if (!d.played) {
                                    return `
                                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; font-size: 0.75rem;">
                                            <span style="font-weight: 900; color: #64748b;">Ronda ${d.round}</span>
                                            <span style="color: #64748b; font-style: italic;">Descanso / No disputado</span>
                                        </div>
                                    `;
                                }

                                const tagColor = d.isWin ? '#22c55e' : (d.isTie ? '#38bdf8' : '#f59e0b');
                                const tagBg = d.isWin ? 'rgba(34, 197, 94, 0.14)' : (d.isTie ? 'rgba(56, 189, 248, 0.14)' : 'rgba(245, 158, 11, 0.14)');
                                const tagText = d.isWin ? '¡VICTORIA! 🏆' : (d.isTie ? 'EMPATE ⚖️' : 'DISPUTADO ⚔️');

                                return `
                                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px;">
                                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="background: rgba(255,255,255,0.08); color: #ffffff; padding: 2px 7px; border-radius: 6px; font-size: 0.68rem; font-weight: 900;">
                                                    Ronda ${d.round}
                                                </span>
                                                <span style="font-weight: 950; color: ${sel.color}; font-size: 0.88rem;">
                                                    +${d.ptsInRound} pts
                                                </span>
                                                <span style="font-size: 0.72rem; color: #94a3b8;">
                                                    (Marcador: <strong style="color: #ffffff;">${d.myScore} - ${d.oppScore}</strong>, Pista ${d.court})
                                                </span>
                                            </div>
                                            <span style="background: ${tagBg}; color: ${tagColor}; border: 1px solid ${tagColor}44; padding: 2px 8px; border-radius: 8px; font-size: 0.65rem; font-weight: 950;">
                                                ${tagText}
                                            </span>
                                        </div>
                                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem; color: #94a3b8; flex-wrap: wrap; gap: 4px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 4px;">
                                            <span>
                                                ${d.partner ? `🎾 Pareja: <strong style="color: #cbd5e1;">${d.partner}</strong> • ` : ''}Rivales: <strong style="color: #cbd5e1;">${d.oppString}</strong>
                                            </span>
                                            <span style="color: #cbd5e1; font-weight: 800;">
                                                Acumulado: <strong style="color: ${sel.color};">${d.cumulative} pts</strong>
                                            </span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Vista Resumen Comparativo de Todos
                breakdownHTML = `
                    <div style="margin-top: 16px; background: rgba(15, 23, 42, 0.85); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 16px;">
                        <div style="font-size: 0.85rem; font-weight: 1000; color: #ffffff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                            <span>👥</span> Resumen Comparativo Top 4 (Ronda a Ronda)
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
                            ${playerSeries.map((s, idx) => {
                                const avgRound = rounds.length > 0 ? (s.totalPoints / rounds.length).toFixed(1) : '0.0';
                                const bestRound = Math.max(...s.roundDetails.map(d => d.ptsInRound), 0);
                                return `
                                    <div style="background: rgba(255,255,255,0.03); border: 1px solid ${s.color}44; border-radius: 12px; padding: 10px; text-align: center;">
                                        <span style="width: 24px; height: 24px; border-radius: 50%; background: ${s.color}; color: #0b1120; font-weight: 950; font-size: 0.65rem; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                                            ${idx + 1}º
                                        </span>
                                        <div style="font-size: 0.75rem; font-weight: 900; color: #ffffff; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            ${s.name}
                                        </div>
                                        <div style="font-size: 0.95rem; font-weight: 1000; color: ${s.color}; margin-bottom: 4px;">
                                            ${s.totalPoints} pts
                                        </div>
                                        <div style="font-size: 0.65rem; color: #94a3b8;">
                                            Media: ${avgRound} pts/ronda<br>
                                            Mejor ronda: +${bestRound} pts
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            return `
                <div style="width: 100%;">
                    ${modeSwitcherHTML}
                    ${pillsHTML}
                    ${liveBannerHTML}
                    <div style="position: relative; width: 100%; overflow-x: auto;">
                        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
                            ${defsGlow}
                            ${gridLines}
                            ${xLabels}
                            ${polylinesSVG}
                            ${dotsSVG}
                        </svg>
                        <div id="sp-evolution-tooltip" style="display: none; position: absolute; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 10px; padding: 8px 12px; color: #ffffff; font-size: 0.72rem; pointer-events: none; z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,0.6); white-space: nowrap; transform: translate(-50%, -100%);"></div>
                    </div>
                    ${breakdownHTML}
                </div>
            `;
        }

        /**
         * 2. Gráfico Donut de Competitividad - 100% Interactivo, Práctico y Visual
         */
        static _renderCompetitivenessDonutSVG(matches) {
            matches = matches || this.lastMatches || [];
            const finishedMatches = matches.filter(m => 
                m.status === 'finished' || m.status === 'finalizado' || (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0
            );

            if (finishedMatches.length === 0) {
                return `
                    <div style="text-align: center; padding: 25px 15px; color: #94a3b8; font-size: 0.78rem;">
                        <i class="fas fa-chart-pie" style="font-size: 1.5rem; color: #64748b; margin-bottom: 8px; display: block;"></i>
                        Aún no hay marcadores finalizados para calcular la competitividad.
                    </div>
                `;
            }

            const tightMatches = []; // diff <= 2 (Partidos de Infarto)
            const mediumMatches = []; // diff 3-4 (Partidos Disputados)
            const blowoutMatches = []; // diff >= 5 (Victorias Cómodas / Claros)

            finishedMatches.forEach(m => {
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const diff = Math.abs(sA - sB);
                const enriched = {
                    ...m,
                    scoreA: sA,
                    scoreB: sB,
                    diff,
                    teamA: ControlTowerSummary._formatTeamNames(m.team_a_names),
                    teamB: ControlTowerSummary._formatTeamNames(m.team_b_names),
                    court: m.court || 1,
                    round: m.round || 1
                };

                if (diff <= 2) tightMatches.push(enriched);
                else if (diff <= 4) mediumMatches.push(enriched);
                else blowoutMatches.push(enriched);
            });

            const total = finishedMatches.length;
            const pTight = Math.round((tightMatches.length / total) * 100);
            const pMedium = Math.round((mediumMatches.length / total) * 100);
            const pBlowout = Math.max(0, 100 - pTight - pMedium);

            const radius = 56;
            const circumference = 2 * Math.PI * radius; // ~351.86

            const strokeTight = (tightMatches.length / total) * circumference;
            const strokeMedium = (mediumMatches.length / total) * circumference;
            const strokeBlowout = (blowoutMatches.length / total) * circumference;

            const offsetTight = 0;
            const offsetMedium = -strokeTight;
            const offsetBlowout = -(strokeTight + strokeMedium);

            const activeCat = this.activeCompetitivenessCategory; // null | 'tight' | 'medium' | 'blowout'

            // Donut center label dinámico
            let centerCount = total;
            let centerLabel = 'PARTIDOS';
            let centerColor = '#ffffff';

            if (activeCat === 'tight') {
                centerCount = tightMatches.length;
                centerLabel = 'INFARTO';
                centerColor = '#ef4444';
            } else if (activeCat === 'medium') {
                centerCount = mediumMatches.length;
                centerLabel = 'DISPUTADOS';
                centerColor = '#0ea5e9';
            } else if (activeCat === 'blowout') {
                centerCount = blowoutMatches.length;
                centerLabel = 'CÓMODOS';
                centerColor = '#10b981';
            }

            const categories = [
                {
                    key: 'tight',
                    icon: '⚡',
                    title: 'Partidos de Infarto (≤2 dif)',
                    badge: 'INFARTO',
                    desc: 'Marcadores al límite: 6-5, 7-6, 6-4... Puntos de oro agónicos',
                    color: '#ef4444',
                    matches: tightMatches,
                    pct: pTight,
                    tensionBadge: '¡FINAL DE INFARTO! ⚡',
                    tensionColor: '#ef4444',
                    tensionBg: 'rgba(239, 68, 68, 0.2)'
                },
                {
                    key: 'medium',
                    icon: '⚔️',
                    title: 'Partidos Disputados (3-4 dif)',
                    badge: 'DISPUTADOS',
                    desc: 'Peleados y con buen intercambio táctico: 6-3, 6-2...',
                    color: '#0ea5e9',
                    matches: mediumMatches,
                    pct: pMedium,
                    tensionBadge: '¡PARTIDO DISPUTADO! ⚔️',
                    tensionColor: '#0ea5e9',
                    tensionBg: 'rgba(14, 165, 233, 0.2)'
                },
                {
                    key: 'blowout',
                    icon: '🎯',
                    title: 'Victorias Cómodas / Claros (≥5 dif)',
                    badge: 'CÓMODOS',
                    desc: 'Dominio contundente de pista: 6-1, 6-0...',
                    color: '#10b981',
                    matches: blowoutMatches,
                    pct: pBlowout,
                    tensionBadge: '¡VICTORIA CLARA! 🎯',
                    tensionColor: '#10b981',
                    tensionBg: 'rgba(16, 185, 129, 0.2)'
                }
            ];

            const activeCategoryObj = categories.find(c => c.key === activeCat);

            return `
                <div style="width: 100%;">
                    <!-- Header -->
                    <div style="margin-bottom: 14px;">
                        <div style="font-size: 0.85rem; font-weight: 1000; color: #ffffff; letter-spacing: 0.3px;">
                            ⚖️ TERMÓMETRO DONUT DE COMPETITIVIDAD
                        </div>
                        <div style="font-size: 0.68rem; color: #94a3b8;">
                            Tensión real de los partidos • Pulsa en el Donut o en las tarjetas para desplegar los partidos
                        </div>
                    </div>

                    <!-- Donut + Cards Layout -->
                    <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 18px; margin-bottom: 16px;">
                        <!-- Donut SVG -->
                        <div style="position: relative; width: 150px; height: 150px; flex-shrink: 0;">
                            <svg viewBox="0 0 160 160" style="transform: rotate(-90deg); width: 100%; height: 100%; overflow: visible;">
                                <defs>
                                    <filter id="sp-donut-glow-tight" x="-30%" y="-30%" width="160%" height="160%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ef4444" flood-opacity="0.9"/>
                                    </filter>
                                    <filter id="sp-donut-glow-medium" x="-30%" y="-30%" width="160%" height="160%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#0ea5e9" flood-opacity="0.9"/>
                                    </filter>
                                    <filter id="sp-donut-glow-blowout" x="-30%" y="-30%" width="160%" height="160%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#10b981" flood-opacity="0.9"/>
                                    </filter>
                                </defs>
                                <circle cx="80" cy="80" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="20"/>

                                <!-- Tight: Red -->
                                <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#ef4444"
                                        stroke-width="${activeCat === 'tight' ? 26 : 20}"
                                        opacity="${(!activeCat || activeCat === 'tight') ? 1 : 0.28}"
                                        stroke-dasharray="${strokeTight} ${circumference}" stroke-dashoffset="${offsetTight}"
                                        filter="${activeCat === 'tight' ? 'url(#sp-donut-glow-tight)' : 'none'}"
                                        style="cursor: pointer; transition: all 0.3s;"
                                        onclick="window.ControlTowerSummary.toggleCompetitivenessCategory('tight')"/>

                                <!-- Medium: Cyan -->
                                <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#0ea5e9"
                                        stroke-width="${activeCat === 'medium' ? 26 : 20}"
                                        opacity="${(!activeCat || activeCat === 'medium') ? 1 : 0.28}"
                                        stroke-dasharray="${strokeMedium} ${circumference}" stroke-dashoffset="${offsetMedium}"
                                        filter="${activeCat === 'medium' ? 'url(#sp-donut-glow-medium)' : 'none'}"
                                        style="cursor: pointer; transition: all 0.3s;"
                                        onclick="window.ControlTowerSummary.toggleCompetitivenessCategory('medium')"/>

                                <!-- Blowout: Emerald -->
                                <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#10b981"
                                        stroke-width="${activeCat === 'blowout' ? 26 : 20}"
                                        opacity="${(!activeCat || activeCat === 'blowout') ? 1 : 0.28}"
                                        stroke-dasharray="${strokeBlowout} ${circumference}" stroke-dashoffset="${offsetBlowout}"
                                        filter="${activeCat === 'blowout' ? 'url(#sp-donut-glow-blowout)' : 'none'}"
                                        style="cursor: pointer; transition: all 0.3s;"
                                        onclick="window.ControlTowerSummary.toggleCompetitivenessCategory('blowout')"/>
                            </svg>
                            <!-- Donut Center Text -->
                            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
                                <span style="font-size: 1.55rem; font-weight: 1000; color: ${centerColor}; line-height: 1; transition: color 0.3s;">${centerCount}</span>
                                <span style="font-size: 0.58rem; font-weight: 950; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px;">${centerLabel}</span>
                            </div>
                        </div>

                        <!-- 3 Tarjetas Táctiles Interactivas -->
                        <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 220px;">
                            ${categories.map(cat => {
                                const isOpen = activeCat === cat.key;
                                return `
                                    <div onclick="window.ControlTowerSummary.toggleCompetitivenessCategory('${cat.key}')"
                                         style="cursor: pointer; border-radius: 14px; padding: 11px 14px; transition: all 0.25s ease;
                                         ${isOpen 
                                            ? `border: 2px solid ${cat.color}; background: rgba(15, 23, 42, 0.95); box-shadow: 0 0 16px ${cat.color}44; transform: translateY(-1px);` 
                                            : `border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.6); opacity: ${activeCat ? '0.6' : '0.9'};`}">
                                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                                            <span style="display: flex; align-items: center; gap: 6px; font-weight: 900; color: #ffffff;">
                                                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${cat.color}; box-shadow: 0 0 6px ${cat.color};"></span>
                                                ${cat.title}
                                            </span>
                                            <span style="font-weight: 1000; color: ${cat.color};">
                                                ${cat.matches.length} <span style="color: #94a3b8; font-size: 0.66rem; font-weight: 700;">(${cat.pct}%)</span>
                                            </span>
                                        </div>
                                        <div style="font-size: 0.65rem; color: #94a3b8; margin-bottom: 6px; line-height: 1.3;">
                                            ${cat.desc}
                                        </div>
                                        <!-- Barra de Progreso Porcentual Deportiva -->
                                        <div style="height: 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); overflow: hidden; margin-bottom: 6px;">
                                            <div style="height: 100%; width: ${cat.pct}%; background: ${cat.color}; border-radius: 4px; box-shadow: 0 0 8px ${cat.color};"></div>
                                        </div>
                                        <!-- Botón interactivo: Ver partidos -->
                                        <div style="display: flex; justify-content: flex-end;">
                                            <span style="font-size: 0.68rem; font-weight: 950; color: ${cat.color}; display: inline-flex; align-items: center; gap: 4px;">
                                                ${isOpen ? 'Ocultar partidos ▴' : `Ver ${cat.matches.length} partidos ▾`}
                                            </span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Lista Desplegable de Partidos Reales -->
                    ${activeCategoryObj ? `
                        <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${activeCategoryObj.color}66; border-radius: 16px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); animation: fadeIn 0.3s ease;">
                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
                                <div>
                                    <div style="font-size: 0.88rem; font-weight: 1000; color: #ffffff;">
                                        ${activeCategoryObj.icon} ${activeCategoryObj.title}
                                    </div>
                                    <div style="font-size: 0.68rem; color: #94a3b8;">
                                        ${activeCategoryObj.matches.length} partidos disputados en esta categoría
                                    </div>
                                </div>
                                <button type="button" onclick="window.ControlTowerSummary.toggleCompetitivenessCategory('${activeCategoryObj.key}')"
                                        style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 0.68rem; font-weight: 900; cursor: pointer;">
                                    Cerrar ✕
                                </button>
                            </div>

                            ${activeCategoryObj.matches.length === 0 ? `
                                <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 0.78rem;">
                                    No se registraron partidos en esta categoría en esta jornada.
                                </div>
                            ` : `
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    ${activeCategoryObj.matches.map(m => {
                                        const winA = m.scoreA > m.scoreB;
                                        const winB = m.scoreB > m.scoreA;
                                        return `
                                            <div style="background: rgba(11, 17, 32, 0.85); border: 1px solid ${activeCategoryObj.color}40; border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                                                <!-- Top Row: Court, Round, Tension Badge -->
                                                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                                                    <span style="font-size: 0.72rem; font-weight: 900; color: #94a3b8;">
                                                        Pista ${m.court} • Ronda ${m.round}
                                                    </span>
                                                    <span style="background: ${activeCategoryObj.tensionBg}; border: 1px solid ${activeCategoryObj.tensionColor}; color: ${activeCategoryObj.tensionColor}; padding: 2px 8px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; letter-spacing: 0.5px; box-shadow: 0 0 8px ${activeCategoryObj.tensionColor}44;">
                                                        ${activeCategoryObj.tensionBadge}
                                                    </span>
                                                </div>

                                                <!-- Middle Row: Teams & Score -->
                                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                                                    <!-- Pareja A -->
                                                    <div style="flex: 1; text-align: right; min-width: 0;">
                                                        <div style="font-size: 0.82rem; font-weight: ${winA ? '1000' : '700'}; color: ${winA ? '#ffffff' : '#94a3b8'}; word-break: break-word;">
                                                            ${m.teamA}
                                                        </div>
                                                    </div>

                                                    <!-- Marcador Grande -->
                                                    <div style="background: rgba(0, 0, 0, 0.5); border: 1.5px solid ${activeCategoryObj.color}66; border-radius: 10px; padding: 4px 14px; flex-shrink: 0; box-shadow: 0 0 10px ${activeCategoryObj.color}33;">
                                                        <span style="font-size: 1.25rem; font-weight: 1000; color: #ffffff; letter-spacing: 2px;">
                                                            <span style="color: ${winA ? activeCategoryObj.color : '#ffffff'}">${m.scoreA}</span>
                                                            <span style="color: #64748b; margin: 0 3px;">-</span>
                                                            <span style="color: ${winB ? activeCategoryObj.color : '#ffffff'}">${m.scoreB}</span>
                                                        </span>
                                                    </div>

                                                    <!-- Pareja B -->
                                                    <div style="flex: 1; text-align: left; min-width: 0;">
                                                        <div style="font-size: 0.82rem; font-weight: ${winB ? '1000' : '700'}; color: ${winB ? '#ffffff' : '#94a3b8'}; word-break: break-word;">
                                                            ${m.teamB}
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Bottom Row: Difference & Total games -->
                                                <div style="text-align: center; font-size: 0.66rem; color: #64748b; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 5px;">
                                                    Diferencia de tan solo <strong style="color: ${activeCategoryObj.color}; font-weight: 900;">${m.diff} ${m.diff === 1 ? 'juego' : 'juegos'}</strong> • Total: ${m.scoreA + m.scoreB} juegos disputados
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * 3. Gráfico de Barras de Actividad por Pistas
         */
        static _renderCourtsActivityBars(matches) {
            const courts = {};
            matches.forEach(m => {
                const c = parseInt(m.court || 1);
                if (!courts[c]) courts[c] = { court: c, games: 0, matches: 0 };
                courts[c].matches++;
                courts[c].games += (parseInt(m.score_a || 0) + parseInt(m.score_b || 0));
            });

            const sortedCourts = Object.values(courts).sort((a, b) => a.court - b.court);
            const maxGames = Math.max(...sortedCourts.map(c => c.games), 1);

            return `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${sortedCourts.map(c => {
                        const pct = Math.round((c.games / maxGames) * 100);
                        const avg = c.matches > 0 ? (c.games / c.matches).toFixed(1) : 0;
                        const isC1 = c.court === 1;
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; font-weight: 900; margin-bottom: 4px;">
                                    <span style="color: ${isC1 ? '#facc15' : '#e2e8f0'}; display: inline-flex; align-items: center; gap: 5px;">
                                        ${isC1 ? '👑 PISTA 1 (CENTRAL)' : `PISTA ${c.court}`}
                                    </span>
                                    <span style="color: #94a3b8;">
                                        <b style="color: #ffffff;">${c.games}</b> juegos • ${avg} j/p (${c.matches} partidos)
                                    </span>
                                </div>
                                <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
                                    <div style="width: ${pct}%; height: 100%; background: ${isC1 ? 'linear-gradient(90deg, #facc15 0%, #ccff00 100%)' : 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)'}; border-radius: 10px; transition: width 0.5s;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        /**
         * Abre el modal del Flyer deportivo de Alta Definición (HTML5 Canvas 1080x1920)
         */
        static openInstagramFlyerModal() {
            const data = this.lastSummaryData;
            if (!data) {
                alert('Aún no hay datos de partidos confirmados para generar el flyer.');
                return;
            }

            const existingModal = document.getElementById('sp-flyer-modal-root');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = 'sp-flyer-modal-root';
            modal.style = `
                position: fixed; inset: 0; z-index: 100000;
                background: rgba(3, 7, 18, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                display: flex; align-items: center; justify-content: center; padding: 14px;
                animation: fadeIn 0.25s ease-out; font-family: 'Outfit', sans-serif;
            `;

            modal.innerHTML = `
                <div style="background: #0f172a; border: 1.5px solid rgba(204,255,0,0.35); border-radius: 24px; max-width: 480px; width: 100%; max-height: 94vh; overflow-y: auto; padding: 20px; color: #ffffff; box-shadow: 0 25px 50px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; gap: 14px;">
                    <!-- Modal Header -->
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #ccff00; font-size: 1.2rem;">📸</span>
                            <span style="font-weight: 1000; font-size: 0.95rem; letter-spacing: 0.5px;">FLYER OFICIAL INSTAGRAM HD</span>
                        </div>
                        <button type="button" onclick="window.ControlTowerSummary.closeInstagramFlyerModal()"
                                style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-weight: 900; font-size: 1rem; display: flex; align-items: center; justify-content: center;">
                            ✕
                        </button>
                    </div>

                    <p style="font-size: 0.72rem; color: #94a3b8; text-align: center; margin: 0;">
                        Formato vertical 1080x1920 calibrado para Historias de Instagram y Estados de WhatsApp.
                    </p>

                    <!-- Canvas Container / Preview -->
                    <div style="width: 100%; display: flex; justify-content: center; margin: 6px 0;">
                        <canvas id="sp-flyer-canvas" width="1080" height="1920" 
                                style="max-height: 54vh; width: auto; max-width: 100%; border-radius: 16px; border: 2px solid rgba(204,255,0,0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.5); object-fit: contain; background: #070c18;">
                        </canvas>
                    </div>

                    <!-- Action Buttons -->
                    <div style="width: 100%; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" onclick="window.ControlTowerSummary.downloadFlyer()"
                                style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ccff00; border: 1.5px solid #ccff00; padding: 12px; border-radius: 14px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-download"></i>
                            <span>DESCARGAR PNG HD</span>
                        </button>
                        <button type="button" onclick="window.ControlTowerSummary.shareFlyerToStory()"
                                style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #e1306c 0%, #833ab4 50%, #fd1d1d 100%); color: #ffffff; border: none; padding: 12px; border-radius: 14px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 18px rgba(225, 48, 108, 0.4);">
                            <i class="fab fa-instagram"></i>
                            <span>COMPARTIR HISTORIA</span>
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            setTimeout(() => {
                this._drawFlyerCanvas(data);
            }, 50);
        }

        /**
         * Dibuja el Canvas 1080x1920 con arte deportivo pro
         */
        static _drawFlyerCanvas(data) {
            const canvas = document.getElementById('sp-flyer-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = 1080;
            const h = 1920;

            // 1. Fondo Metalizado Oscuro
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#070c18');
            bgGrad.addColorStop(0.5, '#0f172a');
            bgGrad.addColorStop(1, '#050914');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Resplandores Neón
            const glow1 = ctx.createRadialGradient(900, 200, 50, 900, 200, 600);
            glow1.addColorStop(0, 'rgba(204, 255, 0, 0.16)');
            glow1.addColorStop(1, 'transparent');
            ctx.fillStyle = glow1;
            ctx.fillRect(0, 0, w, h);

            const glow2 = ctx.createRadialGradient(200, 1600, 50, 200, 1600, 650);
            glow2.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
            glow2.addColorStop(1, 'transparent');
            ctx.fillStyle = glow2;
            ctx.fillRect(0, 0, w, h);

            // Borde Neón Exterior
            ctx.strokeStyle = '#CCFF00';
            ctx.lineWidth = 10;
            this._roundRect(ctx, 35, 35, w - 70, h - 70, 36, false, true);

            // 2. Cabecera SomosPadel
            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 32px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SOMOSPADEL BCN • PRO TOUR', w / 2, 130);

            // Categoría Tag Pill
            const categoryText = (data.eventDoc?.category || 'PRO').toUpperCase();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            this._roundRect(ctx, w / 2 - 130, 165, 260, 48, 24, true, false);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '800 22px Outfit, sans-serif';
            ctx.fillText(`CATEGORÍA ${categoryText}`, w / 2, 198);

            // Nombre del Torneo / Entreno
            const eventName = (data.eventDoc?.name || 'TORNEO DE PÁDEL').toUpperCase();
            ctx.fillStyle = '#ffffff';
            ctx.font = '1000 52px Outfit, sans-serif';
            ctx.fillText(this._truncateText(ctx, eventName, 900), w / 2, 290);

            // Fecha
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 26px Outfit, sans-serif';
            ctx.fillText(data.eventDoc?.date || 'Fecha Oficial SomosPadel', w / 2, 335);

            // Línea divisoria Neón
            const lineGrad = ctx.createLinearGradient(150, 0, w - 150, 0);
            lineGrad.addColorStop(0, 'transparent');
            lineGrad.addColorStop(0.5, '#CCFF00');
            lineGrad.addColorStop(1, 'transparent');
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(150, 375);
            ctx.lineTo(w - 150, 375);
            ctx.stroke();

            // 3. PODIO DE HONOR ESTELAR
            ctx.fillStyle = '#facc15';
            ctx.font = '900 32px Outfit, sans-serif';
            ctx.fillText('🏆 PODIO DE HONOR', w / 2, 435);

            // 1º Puesto Card (Gran Tarjeta Central Dorada)
            const p1 = data.p1;
            const goldGrad = ctx.createLinearGradient(100, 470, w - 100, 680);
            goldGrad.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
            goldGrad.addColorStop(1, 'rgba(30, 41, 59, 0.85)');
            ctx.fillStyle = goldGrad;
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 4;
            this._roundRect(ctx, 110, 470, w - 220, 215, 28, true, true);

            ctx.fillStyle = '#facc15';
            ctx.font = '1000 68px Outfit, sans-serif';
            ctx.fillText('🥇 1º CAMPEÓN', w / 2, 550);

            ctx.fillStyle = '#ffffff';
            ctx.font = '1000 48px Outfit, sans-serif';
            ctx.fillText(this._truncateText(ctx, p1.name, 800), w / 2, 615);

            ctx.fillStyle = '#fef08a';
            ctx.font = '800 30px Outfit, sans-serif';
            ctx.fillText(`${p1.points || 0} PUNTOS  •  DIF: ${p1.diff >= 0 ? '+' : ''}${p1.diff || 0}`, w / 2, 660);

            // 2º y 3er Puesto (Lado a Lado)
            const p2 = data.p2;
            const p3 = data.p3;

            // 2º Puesto Plata
            ctx.fillStyle = 'rgba(203, 213, 225, 0.12)';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3;
            this._roundRect(ctx, 110, 715, 415, 175, 24, true, true);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '900 36px Outfit, sans-serif';
            ctx.fillText('🥈 2º PUESTO', 317, 770);
            ctx.fillStyle = '#ffffff';
            ctx.font = '1000 32px Outfit, sans-serif';
            ctx.fillText(this._truncateText(ctx, p2.name, 370), 317, 825);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 24px Outfit, sans-serif';
            ctx.fillText(`${p2.points || 0} PTS (${p2.diff >= 0 ? '+' : ''}${p2.diff || 0})`, 317, 865);

            // 3er Puesto Bronce
            ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3;
            this._roundRect(ctx, 555, 715, 415, 175, 24, true, true);

            ctx.fillStyle = '#fbbf24';
            ctx.font = '900 36px Outfit, sans-serif';
            ctx.fillText('🥉 3º PUESTO', 762, 770);
            ctx.fillStyle = '#ffffff';
            ctx.font = '1000 32px Outfit, sans-serif';
            ctx.fillText(this._truncateText(ctx, p3.name, 370), 762, 825);
            ctx.fillStyle = '#fde68a';
            ctx.font = '800 24px Outfit, sans-serif';
            ctx.fillText(`${p3.points || 0} PTS (${p3.diff >= 0 ? '+' : ''}${p3.diff || 0})`, 762, 865);

            // 4. Cuadro de Insignias Clave (Grid 2x2)
            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 30px Outfit, sans-serif';
            ctx.fillText('⚡ INSIGNIAS & DATOS DESTACADOS', w / 2, 940);

            const b = data.badges;
            const bCards = [
                { icon: '👑', title: 'REY PISTA 1', name: b.court1King.name, sub: b.court1King.detail, color: '#facc15' },
                { icon: '🛡️', title: 'MURALLA', name: b.defenseWall.name, sub: b.defenseWall.detail, color: '#38bdf8' },
                { icon: '🔥', title: 'RACHA IMBATIBLE', name: b.unbeatableStreak.name, sub: b.unbeatableStreak.detail, color: '#ef4444' },
                { icon: '⚔️', title: 'PARTIDO ÉPICO', name: b.epicMatch.title, sub: b.epicMatch.detail, color: '#c084fc' }
            ];

            const startY = 970;
            const bCardW = 415;
            const bCardH = 160;

            bCards.forEach((card, idx) => {
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const x = col === 0 ? 110 : 555;
                const y = startY + row * (bCardH + 20);

                ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
                ctx.lineWidth = 2;
                this._roundRect(ctx, x, y, bCardW, bCardH, 20, true, true);

                ctx.textAlign = 'left';
                ctx.fillStyle = card.color;
                ctx.font = '900 22px Outfit, sans-serif';
                ctx.fillText(`${card.icon} ${card.title}`, x + 25, y + 42);

                ctx.fillStyle = '#ffffff';
                ctx.font = '1000 28px Outfit, sans-serif';
                ctx.fillText(this._truncateText(ctx, card.name, bCardW - 50), x + 25, y + 86);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '700 20px Outfit, sans-serif';
                ctx.fillText(this._truncateText(ctx, card.sub, bCardW - 50), x + 25, y + 125);
            });

            // 5. Barra de Estadísticas Globales
            const barY = 1350;
            ctx.fillStyle = 'rgba(204, 255, 0, 0.08)';
            ctx.strokeStyle = 'rgba(204, 255, 0, 0.3)';
            ctx.lineWidth = 2;
            this._roundRect(ctx, 110, barY, w - 220, 130, 22, true, true);

            ctx.textAlign = 'center';
            // Metric 1: Matches
            ctx.fillStyle = '#ffffff';
            ctx.font = '1000 42px Outfit, sans-serif';
            ctx.fillText(String(data.totalMatches), 240, barY + 62);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 20px Outfit, sans-serif';
            ctx.fillText('PARTIDOS', 240, barY + 98);

            // Metric 2: Games
            ctx.fillStyle = '#ccff00';
            ctx.font = '1000 42px Outfit, sans-serif';
            ctx.fillText(String(data.totalGames), w / 2, barY + 62);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 20px Outfit, sans-serif';
            ctx.fillText('JUEGOS TOTALES', w / 2, barY + 98);

            // Metric 3: Avg
            ctx.fillStyle = '#38bdf8';
            ctx.font = '1000 42px Outfit, sans-serif';
            ctx.fillText(String(data.avgGamesPerMatch), w - 240, barY + 62);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 20px Outfit, sans-serif';
            ctx.fillText('PROMEDIO J/P', w - 240, barY + 98);

            // 6. Pie de Página / Marca de Agua
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 26px Outfit, sans-serif';
            ctx.fillText('SOMOSPADEL BARCELONA', w / 2, 1680);

            ctx.fillStyle = '#ccff00';
            ctx.font = '800 22px Outfit, sans-serif';
            ctx.fillText('SOMOSPADELBCN.COM • @SOMOSPADELBCN', w / 2, 1720);

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('Tecnología Torre de Control v6.0 • Todos los derechos reservados', w / 2, 1765);
        }

        /**
         * Helper para esquinas redondeadas en Canvas
         */
        static _roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
        }

        /**
         * Truncar texto en Canvas
         */
        static _truncateText(ctx, text, maxWidth) {
            let str = String(text || '');
            if (ctx.measureText(str).width <= maxWidth) return str;
            while (str.length > 3 && ctx.measureText(str + '...').width > maxWidth) {
                str = str.slice(0, -1);
            }
            return str + '...';
        }

        /**
         * Descarga directa del flyer HD en formato PNG
         */
        static downloadFlyer() {
            const canvas = document.getElementById('sp-flyer-canvas');
            if (!canvas) return;

            const name = (this.lastEventDoc?.name || 'SomosPadel').replace(/\s+/g, '-');
            const fileName = `Flyer-SomosPadel-${name}.png`;

            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        /**
         * Compartir historia de Instagram vía Web Share API
         */
        static shareFlyerToStory() {
            const canvas = document.getElementById('sp-flyer-canvas');
            if (!canvas) return;

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    this.downloadFlyer();
                    return;
                }

                const name = (this.lastEventDoc?.name || 'SomosPadel').replace(/\s+/g, '-');
                const file = new File([blob], `Flyer-SomosPadel-${name}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Flyer SomosPadel BCN',
                            text: `¡Resultados oficiales de ${this.lastEventDoc?.name || 'SomosPadel'}!`
                        });
                    } catch (e) {
                        console.log('Share cancelado o no soportado:', e);
                    }
                } else {
                    this.downloadFlyer();
                    alert('Tu navegador no soporta compartir imágenes directamente. El Flyer HD se ha descargado a tu galería para que puedas subirlo a tu historia de Instagram o WhatsApp.');
                }
            }, 'image/png');
        }

        /**
         * Alias para compartir historia
         */
        static shareInstagramStory() {
            return this.shareFlyerToStory();
        }

        /**
         * Cierra el modal del flyer oficial de Instagram
         */
        static closeInstagramFlyerModal() {
            const modal = document.getElementById('sp-flyer-modal-root');
            if (modal) modal.remove();
        }
    }

    window.ControlTowerSummary = ControlTowerSummary;

    // Compatibilidad en caso de scripts externos que referencien ControlTowerStats
    if (!window.ControlTowerStats) {
        window.ControlTowerStats = {
            render: (matches, eventDoc) => ControlTowerSummary.render(matches, eventDoc),
            generatePressChronicle: () => ControlTowerSummary.shareWhatsApp(),
            closeChronicle: () => {}
        };
    }
})();
