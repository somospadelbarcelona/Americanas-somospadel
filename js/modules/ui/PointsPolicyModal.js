/**
 * PointsPolicyModal.js
 * Modal oficial e interactivo con el Sistema de Ponderación de Puntos para el Ranking Oficial
 * de SomosPadel Barcelona (Entrenos, Americanas, Modos Pareja Fija, Twister y Suizo).
 */
(function() {
    'use strict';

    const POINTS_TABLE = [
        { rank: 1, pts: 100, label: 'Campeón', icon: '👑', color: '#CCFF00', badgeBg: 'rgba(204, 255, 0, 0.18)' },
        { rank: 2, pts: 80,  label: 'Subcampeón', icon: '🥈', color: '#94a3b8', badgeBg: 'rgba(148, 163, 184, 0.18)' },
        { rank: 3, pts: 65,  label: 'Podio', icon: '🥉', color: '#f59e0b', badgeBg: 'rgba(245, 158, 11, 0.18)' },
        { rank: 4, pts: 55,  label: 'Top 4', icon: '⚡', color: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.15)' },
        { rank: 5, pts: 45,  label: 'Top 5', icon: '🎯', color: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.12)' },
        { rank: 6, pts: 38,  label: 'Top 6', icon: '🎾', color: '#a855f7', badgeBg: 'rgba(168, 85, 247, 0.15)' },
        { rank: 7, pts: 32,  label: 'Top 7', icon: '🎾', color: '#a855f7', badgeBg: 'rgba(168, 85, 247, 0.12)' },
        { rank: 8, pts: 28,  label: 'Top 8', icon: '🔥', color: '#ec4899', badgeBg: 'rgba(236, 72, 153, 0.15)' },
        { rank: 9, pts: 24,  label: 'Top 9', icon: '🔥', color: '#ec4899', badgeBg: 'rgba(236, 72, 153, 0.12)' },
        { rank: 10, pts: 20, label: 'Top 10', icon: '⭐', color: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
        { rank: 11, pts: 16, label: 'Top 11', icon: '✨', color: '#64748b', badgeBg: 'rgba(100, 116, 139, 0.15)' },
        { rank: 12, pts: 12, label: 'Top 12', icon: '✨', color: '#64748b', badgeBg: 'rgba(100, 116, 139, 0.12)' },
        { rank: '13º+', pts: 10, label: 'Participación', icon: '🤝', color: '#22c55e', badgeBg: 'rgba(34, 197, 94, 0.15)' }
    ];

    class PointsPolicyModal {
        static getPointsForRank(rankNum) {
            const num = parseInt(rankNum, 10);
            if (isNaN(num) || num <= 0) return 10;
            const found = POINTS_TABLE.find(p => p.rank === num);
            return found ? found.pts : 10;
        }

        static calculateTotal(rankNum, matchesWon) {
            const base = this.getPointsForRank(rankNum);
            const bonus = Math.max(0, parseInt(matchesWon, 10) || 0) * 2;
            return { base, bonus, total: base + bonus };
        }

        static open() {
            let overlay = document.getElementById('sp-points-policy-overlay');
            if (overlay) {
                overlay.remove();
            }

            overlay = document.createElement('div');
            overlay.id = 'sp-points-policy-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 9999999;
                background: rgba(3, 7, 18, 0.88);
                backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                display: flex; align-items: center; justify-content: center;
                padding: 12px; box-sizing: border-box;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: spPointsFadeIn 0.22s ease-out;
            `;

            overlay.innerHTML = `
                <style>
                    @keyframes spPointsFadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes spPointsSlideUp { from { transform: translateY(20px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                    
                    .sp-points-card {
                        background: linear-gradient(155deg, #090e1a 0%, #0f172a 45%, #030712 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.4);
                        border-radius: 24px;
                        width: 100%;
                        max-width: 680px;
                        max-height: 92vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(204,255,0,0.18);
                        animation: spPointsSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                        box-sizing: border-box;
                        color: #ffffff;
                    }
                    .sp-points-scroll {
                        overflow-y: auto;
                        padding: 18px 20px 24px;
                        -webkit-overflow-scrolling: touch;
                    }
                    .sp-points-scroll::-webkit-scrollbar {
                        width: 6px;
                    }
                    .sp-points-scroll::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.04);
                    }
                    .sp-points-scroll::-webkit-scrollbar-thumb {
                        background: rgba(204, 255, 0, 0.35);
                        border-radius: 10px;
                    }
                    .sp-points-grid-table {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
                        gap: 8px;
                    }
                    @media (max-width: 480px) {
                        .sp-points-card {
                            max-height: 94vh;
                            border-radius: 20px;
                        }
                        .sp-points-scroll {
                            padding: 14px 14px 20px;
                        }
                        .sp-points-grid-table {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 6px;
                        }
                    }
                    .sp-pts-row-item {
                        background: rgba(255, 255, 255, 0.035);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 14px;
                        padding: 10px 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        transition: all 0.2s ease;
                    }
                    .sp-pts-row-item:hover {
                        border-color: rgba(204, 255, 0, 0.4);
                        background: rgba(255, 255, 255, 0.06);
                        transform: translateY(-1px);
                    }
                    .sp-mode-box {
                        background: rgba(15, 23, 42, 0.7);
                        border-radius: 16px;
                        padding: 14px;
                        border: 1.5px solid rgba(255, 255, 255, 0.08);
                    }
                </style>

                <div class="sp-points-card" onclick="event.stopPropagation()">
                    <!-- HEADER -->
                    <div style="
                        display: flex; justify-content: space-between; align-items: center;
                        padding: 18px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        background: rgba(15, 23, 42, 0.6);
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="
                                width: 44px; height: 44px; border-radius: 14px;
                                background: linear-gradient(135deg, rgba(204,255,0,0.2) 0%, rgba(204,255,0,0.05) 100%);
                                border: 1.5px solid #CCFF00;
                                display: flex; align-items: center; justify-content: center;
                                font-size: 1.35rem; box-shadow: 0 0 15px rgba(204,255,0,0.25);
                            ">
                                ⚖️
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="color: #CCFF00; font-size: 0.65rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">
                                        OFICIAL SOMOSPADEL BCN
                                    </span>
                                    <span style="background: rgba(204,255,0,0.15); color: #CCFF00; border: 1px solid rgba(204,255,0,0.4); border-radius: 6px; padding: 1px 6px; font-size: 0.58rem; font-weight: 900;">
                                        ACTUALIZADO
                                    </span>
                                </div>
                                <h2 style="margin: 2px 0 0; font-size: 1.25rem; font-weight: 950; color: #ffffff; letter-spacing: -0.3px;">
                                    Sistema de Puntos y Ranking
                                </h2>
                            </div>
                        </div>
                        <button onclick="window.PointsPolicyModal.close()" style="
                            background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
                            color: #94a3b8; width: 34px; height: 34px; border-radius: 10px;
                            font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.color='#ef4444';" onmouseout="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.color='#94a3b8';">
                            ✕
                        </button>
                    </div>

                    <!-- SCROLLABLE BODY -->
                    <div class="sp-points-scroll">

                        <!-- BANNER CLAVE: MISMO PESO (1:1) -->
                        <div style="
                            background: linear-gradient(135deg, rgba(204, 255, 0, 0.12) 0%, rgba(34, 197, 94, 0.08) 100%);
                            border: 1.5px solid rgba(204, 255, 0, 0.4);
                            border-radius: 18px;
                            padding: 14px 16px;
                            margin-bottom: 18px;
                            display: flex;
                            align-items: center;
                            gap: 14px;
                        ">
                            <div style="font-size: 1.8rem; line-height: 1;">🤝</div>
                            <div>
                                <h4 style="margin: 0 0 3px; font-size: 0.95rem; font-weight: 950; color: #CCFF00;">
                                    Mismo peso para Entrenos y Americanas
                                </h4>
                                <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
                                    Tanto los <strong>Entrenos</strong> como las <strong>Americanas</strong> otorgan exactamente los mismos puntos para el Ranking General Oficial. Cada partido cuenta por igual.
                                </p>
                            </div>
                        </div>

                        <!-- 1. TABLA OFICIAL DE PUNTOS POR PUESTO -->
                        <div style="margin-bottom: 22px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
                                <div>
                                    <span style="font-size: 0.65rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">1. BAREMO POR POSICIÓN FINAL</span>
                                    <h3 style="margin: 2px 0 0; font-size: 1.05rem; font-weight: 950; color: #ffffff;">
                                        Puntos por Puesto Final en el Evento
                                    </h3>
                                </div>
                                <span style="font-size: 0.72rem; color: #CCFF00; font-weight: 800;">
                                    Todos suman puntos
                                </span>
                            </div>

                            <div class="sp-points-grid-table">
                                ${POINTS_TABLE.map(item => `
                                    <div class="sp-pts-row-item" style="${item.rank === 1 ? 'border-color: rgba(204,255,0,0.6); background: rgba(204,255,0,0.08);' : ''}">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 1.1rem; line-height: 1;">${item.icon}</span>
                                            <div>
                                                <div style="font-size: 0.82rem; font-weight: 950; color: ${item.color};">
                                                    ${typeof item.rank === 'number' ? `${item.rank}º Puesto` : item.rank}
                                                </div>
                                                <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 600;">
                                                    ${item.label}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="
                                            background: ${item.badgeBg};
                                            color: ${item.color};
                                            font-size: 0.88rem;
                                            font-weight: 950;
                                            padding: 4px 8px;
                                            border-radius: 8px;
                                            letter-spacing: -0.2px;
                                        ">
                                            +${item.pts}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="margin-top: 6px; font-size: 0.70rem; color: #94a3b8; text-align: right;">
                                * Los puestos 13º en adelante reciben <strong>10 pts</strong> como base de participación.
                            </div>
                        </div>

                        <!-- 2. BONUS POR PARTIDO GANADO (+2 PTS) -->
                        <div style="
                            background: rgba(56, 189, 248, 0.08);
                            border: 1.5px solid rgba(56, 189, 248, 0.35);
                            border-radius: 18px;
                            padding: 16px;
                            margin-bottom: 22px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 14px;
                            flex-wrap: wrap;
                        ">
                            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 240px;">
                                <div style="
                                    width: 44px; height: 44px; border-radius: 14px;
                                    background: rgba(56, 189, 248, 0.2); border: 1.5px solid #38bdf8;
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 1.3rem; flex-shrink: 0;
                                ">
                                    ⚡
                                </div>
                                <div>
                                    <span style="font-size: 0.65rem; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px;">2. BONUS DE COMPETITIVIDAD</span>
                                    <h4 style="margin: 2px 0 3px; font-size: 1rem; font-weight: 950; color: #ffffff;">
                                        +2 Puntos extra por cada Victoria (PG)
                                    </h4>
                                    <p style="margin: 0; font-size: 0.76rem; color: #94a3b8; line-height: 1.35;">
                                        Cada partido ganado durante el transcurso del evento suma <strong>+2 puntos adicionales</strong> directos a tu casillero del ranking.
                                    </p>
                                </div>
                            </div>
                            <div style="
                                background: #0f172a;
                                border: 1px solid rgba(56, 189, 248, 0.4);
                                padding: 8px 14px;
                                border-radius: 12px;
                                text-align: center;
                            ">
                                <div style="font-size: 1.15rem; font-weight: 950; color: #38bdf8;">+2 PTS</div>
                                <div style="font-size: 0.60rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Por Victoria</div>
                            </div>
                        </div>

                        <!-- 3. REGLAS POR MODALIDAD DE JUEGO -->
                        <div style="margin-bottom: 22px;">
                            <div style="margin-bottom: 10px;">
                                <span style="font-size: 0.65rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">3. ASIGNACIÓN SEGÚN EL FORMATO</span>
                                <h3 style="margin: 2px 0 0; font-size: 1.05rem; font-weight: 950; color: #ffffff;">
                                    ¿Cómo puntúa cada Modo de Juego?
                                </h3>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <!-- MODO TWISTER -->
                                <div class="sp-mode-box" style="border-left: 4px solid #ec4899;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 1.1rem;">🌪️</span>
                                            <strong style="color: #ec4899; font-size: 0.88rem; font-weight: 950;">TWISTER (Individual Rotativo)</strong>
                                        </div>
                                        <span style="background: rgba(236, 72, 153, 0.18); color: #f472b6; font-size: 0.62rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;">
                                            INDIVIDUAL
                                        </span>
                                    </div>
                                    <p style="margin: 0; font-size: 0.77rem; color: #cbd5e1; line-height: 1.4;">
                                        La clasificación final del evento asigna a cada jugador su <strong>puesto individual</strong>. Cada participante recibe los puntos correspondientes a su posición final + el bonus de <strong>+2 pts por cada partido ganado (PG)</strong> individualmente.
                                    </p>
                                </div>

                                <!-- MODO SUIZO -->
                                <div class="sp-mode-box" style="border-left: 4px solid #ef4444;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; background:#dc2626; color:#fff; border-radius:5px; font-weight:950; font-size:0.8rem; line-height:1;">✚</span>
                                            <strong style="color: #ef4444; font-size: 0.88rem; font-weight: 950;">SUIZO EXPRESS (6 Rondas por Juegos)</strong>
                                        </div>
                                        <span style="background: rgba(239, 68, 68, 0.18); color: #fca5a5; font-size: 0.62rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;">
                                            INDIVIDUAL POR JUEGOS
                                        </span>
                                    </div>
                                    <p style="margin: 0; font-size: 0.77rem; color: #cbd5e1; line-height: 1.4;">
                                        Al concluir las 6 rondas, la tabla final computa a cada participante su <strong>puesto en la tabla global</strong> según juegos y desempates. Recibe los puntos de su puesto alcanzado + <strong>+2 pts por cada victoria obtenida</strong> en las rondas.
                                    </p>
                                </div>

                                <!-- MODO PAREJA FIJA -->
                                <div class="sp-mode-box" style="border-left: 4px solid #0284c7;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 1.1rem;">👥</span>
                                            <strong style="color: #38bdf8; font-size: 0.88rem; font-weight: 950;">PAREJA FIJA (Competición por Duplas)</strong>
                                        </div>
                                        <span style="background: rgba(2, 132, 199, 0.22); color: #7dd3fc; font-size: 0.62rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;">
                                            POR PAREJAS
                                        </span>
                                    </div>
                                    <p style="margin: 0; font-size: 0.77rem; color: #cbd5e1; line-height: 1.4;">
                                        La clasificación se establece por parejas. <strong>AMBOS integrantes de la dupla reciben los mismos puntos</strong> asignados al puesto alcanzado por la pareja en el evento + los <strong>+2 pts por cada partido ganado</strong> por la dupla.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- 4. SIMULADOR INTERACTIVO DE PUNTOS -->
                        <div style="
                            background: rgba(204, 255, 0, 0.04);
                            border: 1.5px dashed rgba(204, 255, 0, 0.4);
                            border-radius: 18px;
                            padding: 16px;
                            margin-bottom: 8px;
                        ">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <span style="font-size: 1.1rem;">🧮</span>
                                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 950; color: #CCFF00;">
                                    Simulador Rápido de Puntos
                                </h4>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                                <div>
                                    <label style="display: block; font-size: 0.68rem; font-weight: 800; color: #94a3b8; margin-bottom: 5px; text-transform: uppercase;">
                                        Puesto Final:
                                    </label>
                                    <select id="sp-sim-rank-select" onchange="window.PointsPolicyModal.recalcSim()" style="
                                        width: 100%; padding: 8px 10px; border-radius: 10px;
                                        background: #0f172a; border: 1px solid rgba(255,255,255,0.15);
                                        color: #ffffff; font-weight: 800; font-size: 0.8rem;
                                    ">
                                        <option value="1">1º (100 pts - Campeón 👑)</option>
                                        <option value="2">2º (80 pts - Subcampeón 🥈)</option>
                                        <option value="3">3º (65 pts - Podio 🥉)</option>
                                        <option value="4">4º (55 pts)</option>
                                        <option value="5">5º (45 pts)</option>
                                        <option value="6">6º (38 pts)</option>
                                        <option value="7">7º (32 pts)</option>
                                        <option value="8">8º (28 pts)</option>
                                        <option value="9">9º (24 pts)</option>
                                        <option value="10">10º (20 pts)</option>
                                        <option value="11">11º (16 pts)</option>
                                        <option value="12">12º (12 pts)</option>
                                        <option value="13">13º o posterior (10 pts)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.68rem; font-weight: 800; color: #94a3b8; margin-bottom: 5px; text-transform: uppercase;">
                                        Partidos Ganados (PG):
                                    </label>
                                    <select id="sp-sim-wins-select" onchange="window.PointsPolicyModal.recalcSim()" style="
                                        width: 100%; padding: 8px 10px; border-radius: 10px;
                                        background: #0f172a; border: 1px solid rgba(255,255,255,0.15);
                                        color: #ffffff; font-weight: 800; font-size: 0.8rem;
                                    ">
                                        <option value="0">0 victorias (+0 pts)</option>
                                        <option value="1">1 victoria (+2 pts)</option>
                                        <option value="2">2 victorias (+4 pts)</option>
                                        <option value="3">3 victorias (+6 pts)</option>
                                        <option value="4" selected>4 victorias (+8 pts)</option>
                                        <option value="5">5 victorias (+10 pts)</option>
                                        <option value="6">6 victorias (+12 pts)</option>
                                    </select>
                                </div>
                            </div>

                            <div id="sp-sim-result-box" style="
                                background: #030712;
                                border: 1.5px solid #CCFF00;
                                border-radius: 14px;
                                padding: 12px 16px;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            ">
                                <div>
                                    <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Total Puntos Obtenidos:</span>
                                    <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 2px;">
                                        <span id="sp-sim-base-text">100 pts (puesto)</span> + <span id="sp-sim-bonus-text">8 pts (4 PG)</span>
                                    </div>
                                </div>
                                <div style="
                                    font-size: 1.6rem;
                                    font-weight: 950;
                                    color: #CCFF00;
                                    letter-spacing: -0.5px;
                                    text-shadow: 0 0 15px rgba(204,255,0,0.4);
                                " id="sp-sim-total-val">
                                    108 PTS
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- FOOTER ACTION -->
                    <div style="
                        padding: 14px 20px;
                        border-top: 1px solid rgba(255, 255, 255, 0.08);
                        background: rgba(15, 23, 42, 0.7);
                        display: flex;
                        justify-content: flex-end;
                    ">
                        <button onclick="window.PointsPolicyModal.close()" style="
                            width: 100%;
                            padding: 12px 20px;
                            background: #CCFF00;
                            color: #000000;
                            border: none;
                            border-radius: 14px;
                            font-weight: 950;
                            font-size: 0.88rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            box-shadow: 0 4px 18px rgba(204, 255, 0, 0.35);
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.02)';" onmouseout="this.style.transform='scale(1)';">
                            <i class="fas fa-check"></i>
                            <span>¡ENTENDIDO! VOLVER A LA APP</span>
                        </button>
                    </div>
                </div>
            `;

            // Overlay click dismiss
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    PointsPolicyModal.close();
                }
            });

            // Escape key listener
            const escListener = (e) => {
                if (e.key === 'Escape') {
                    PointsPolicyModal.close();
                    window.removeEventListener('keydown', escListener);
                }
            };
            window.addEventListener('keydown', escListener);
            overlay._escListener = escListener;

            document.body.appendChild(overlay);

            // Trigger initial calculation in sim
            PointsPolicyModal.recalcSim();
        }

        static recalcSim() {
            const rankSel = document.getElementById('sp-sim-rank-select');
            const winsSel = document.getElementById('sp-sim-wins-select');
            if (!rankSel || !winsSel) return;

            const rank = parseInt(rankSel.value, 10);
            const wins = parseInt(winsSel.value, 10);
            const res = this.calculateTotal(rank, wins);

            const baseEl = document.getElementById('sp-sim-base-text');
            const bonusEl = document.getElementById('sp-sim-bonus-text');
            const totalEl = document.getElementById('sp-sim-total-val');

            if (baseEl) baseEl.textContent = `${res.base} pts (puesto)`;
            if (bonusEl) bonusEl.textContent = `${res.bonus} pts (${wins} PG)`;
            if (totalEl) totalEl.textContent = `${res.total} PTS`;
        }

        static close() {
            const overlay = document.getElementById('sp-points-policy-overlay');
            if (overlay) {
                if (overlay._escListener) {
                    window.removeEventListener('keydown', overlay._escListener);
                }
                overlay.style.animation = 'spPointsFadeIn 0.18s ease-in reverse forwards';
                setTimeout(() => {
                    overlay.remove();
                }, 180);
            }
        }
    }

    // Expose globally
    window.PointsPolicyModal = PointsPolicyModal;
    window.showPointsPolicyModal = function() {
        PointsPolicyModal.open();
    };

    console.log("✅ [PointsPolicyModal] Módulo cargado y listo en window.showPointsPolicyModal()");
})();
