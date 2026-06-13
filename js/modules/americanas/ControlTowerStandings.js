/**
 * ControlTowerStandings.js
 * Sub-module for rendering standings in ControlTowerView.
 * NOW WITH WOW NEON MODE 🔥
 */
(function () {
    class ControlTowerStandings {
        static render(matches, eventDoc) {
            if (!window.StandingsService) return '<div style="padding:40px; text-align:center; color:white;">Cargando servicio de posiciones...</div>';

            const isEntreno = eventDoc?.isEntreno;
            const isFixedPairs = eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA');
            const ranking = window.StandingsService.calculate(matches, isEntreno ? 'entreno' : 'americana', isFixedPairs, eventDoc?.players || []);
            window.ControlTowerStandings.lastRankingData = ranking;

            return `
                <style>
                    .neon-winner-text {
                        color: #72a800 !important;
                        font-weight: 950 !important;
                    }
                    .standings-row-enter {
                        animation: slideInRow 0.4s ease-out forwards;
                        opacity: 0;
                    }
                    @keyframes slideInRow {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>

                <div class="standings-container fade-in" style="padding: 10px; background: #f8fafc; min-height: 80vh; padding-bottom: 100px;">
                    
                    <!-- HERO HEADER FOR RANKING -->
                     <div style="text-align: center; margin-bottom: 25px; padding-top: 20px;">
                        <h2 style="font-family: 'Outfit', sans-serif; font-weight: 950; font-size: 1.8rem; text-transform: uppercase; color: #0a192f; margin: 0; letter-spacing: -1px;">
                            CLASIFICACIÓN
                        </h2>
                        <div style="font-size: 0.7rem; color: #72a800; letter-spacing: 2px; text-transform: uppercase; font-weight: 900; margin-top: 5px;">TIEMPO REAL 🔥</div>
                    </div>

                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
                        
                        <!-- ACTIONS -->
                        <div style="padding: 15px; display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #e2e8f0;">
                            <button onclick="window.ControlTowerView.switchTab('results')" style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-arrow-left"></i> VOLVER
                            </button>
                            <button onclick="window.ControlTowerStandings.shareStandings(window.ControlTowerStandings.lastRankingData, window.ControlTowerView?.currentAmericanaDoc)" 
                                    style="background: #72a800; color: white; border: none; padding: 6px 14px; border-radius: 10px; font-size: 0.7rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(114,168,0,0.2);">
                                <i class="fas fa-camera"></i> COMPARTIR
                            </button>
                        </div>

                        <!-- LÍDERES (TOP 3) -->
                         <div style="padding: 10px;">
                        ${ranking.length === 0 ? `
                             <div style="padding: 60px 20px; text-align: center; color: #666; font-style: italic;">Esperando resultados...</div>
                        ` : ranking.map((p, i) => {
                let rowStyle = 'background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);';
                let posContent = `<span style="font-size: 1rem; color: #666; font-weight: 800;">${i + 1}</span>`;
                let nameClass = '';
                let nameStyle = 'color: #ddd; font-weight: 700;';
                let statColor = '#888';
                let leaderBadge = '';

                // 🏆 GOLD LEADER
                if (i === 0) {
                    rowStyle = 'background: #f1f5f9; border-left: 6px solid #72a800; margin-bottom: 10px; border-radius: 12px; border: 1px solid #e2e8f0;';
                    posContent = '🏆';
                    nameClass = 'neon-winner-text';
                    nameStyle = 'font-weight: 950; font-size: 1.1rem; letter-spacing: -0.5px; color: #0a192f;';
                    statColor = '#72a800';
                    leaderBadge = '<span style="background: #72a800; color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900;">LÍDER</span>';
                }
                // 🥈 SILVER
                else if (i === 1) {
                    rowStyle = 'background: #ffffff; border-left: 4px solid #94a3b8; margin-bottom: 5px; border-radius: 12px; border: 1px solid #e2e8f0;';
                    posContent = '🥈';
                    nameStyle = 'color: #0a192f; font-weight: 900; font-size: 1rem;';
                    statColor = '#64748b';
                }
                // 🥉 BRONZE
                else if (i === 2) {
                    rowStyle = 'background: #ffffff; border-left: 4px solid #b45309; margin-bottom: 5px; border-radius: 12px; border: 1px solid #e2e8f0;';
                    posContent = '🥉';
                    nameStyle = 'color: #0a192f; font-weight: 800; font-size: 0.95rem;';
                    statColor = '#64748b';
                }

                const delay = i * 0.05;

                return `
                                <div class="standings-row-enter" style="padding: 16px 14px; display: flex; align-items: center; ${rowStyle} animation-delay: ${delay}s; border-bottom: 1px solid #f1f5f9;">
                                    <div style="width: 40px; font-weight: 950; font-size: 1.2rem; text-align: center;">
                                        ${posContent}
                                    </div>
                                    <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                        <div class="${nameClass}" style="${nameStyle} text-transform: uppercase;">${p.name}</div>
                                        ${leaderBadge}
                                    </div>
                                    <div style="width: 50px; text-align: center; font-weight: 700; color: ${statColor}; font-size: 0.85rem;">${p.won} V</div>
                                    <div style="width: 60px; text-align: center;">
                                        <div style="font-weight: 950; color: #0a192f; font-size: 1.2rem; letter-spacing: -0.5px;">${p.points}</div>
                                        <div style="font-size: 0.5rem; color: #64748b; font-weight: 800; text-transform: uppercase;">PTS</div>
                                    </div>
                                </div>
`;
            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        static async shareStandings(rankingData, eventDoc) {
            try {
                const eventName = eventDoc?.name || 'Entreno / Americana';
                const eventDate = eventDoc?.date || 'Hoy';
                const isFixedPairs = (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventName).toUpperCase().includes('FIJA');

                let shareText = `🏆 CLASIFICACIÓN: ${eventName}\n📅 ${eventDate}\n\n`;

                if (isFixedPairs) {
                     // Need to calculate pairs just like in end of training modal
                     const medals = ['🥇', '🥈', '🥉'];
                     rankingData.slice(0, 10).forEach((p, i) => {
                         const prefix = i < 3 ? medals[i] : `${i + 1}.`;
                         shareText += `${prefix} ${p.name} — ${p.won} V\n`;
                     });
                } else {
                     const medals = ['🥇', '🥈', '🥉'];
                     rankingData.slice(0, 10).forEach((p, i) => {
                         const prefix = i < 3 ? medals[i] : `${i + 1}.`;
                         shareText += `${prefix} ${p.name} — ${p.points} pts\n`;
                     });
                }
                
                shareText += `\n🎾 ¡Sigue todos los resultados en SomosPadel!`;

                if (navigator.share) {
                    await navigator.share({ title: `Clasificación ${eventName}`, text: shareText });
                } else {
                    await navigator.clipboard.writeText(shareText);
                    window.PremiumModal.alert({ title: '✅ COPIADO', message: 'Clasificación copiada al portapapeles.' });
                }
            } catch (err) {
                console.error("Error sharing standings:", err);
            }
        }
    }
    window.ControlTowerStandings = ControlTowerStandings;
})();
