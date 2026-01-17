/**
 * ControlTowerStandings.js
 * Sub-module for rendering standings in ControlTowerView.
 */
(function () {
    class ControlTowerStandings {
        static render(matches, eventDoc) {
            if (!window.StandingsService) return '<div style="padding:40px; text-align:center;">Cargando servicio de posiciones...</div>';

            const isEntreno = eventDoc?.isEntreno;
            const ranking = window.StandingsService.calculate(matches, isEntreno ? 'entreno' : 'americana');

            return `
                <div class="standings-container fade-in" style="padding: 24px; background: white; min-height: 80vh; padding-bottom: 100px;">
                    <div style="background: #fff; border: 1px solid #eeeff2; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                        <div style="padding: 18px; background: #fafafa; font-size: 0.65rem; font-weight: 800; color: #999; display: flex; border-bottom: 1px solid #f0f0f0; letter-spacing: 1px;">
                            <div style="width: 45px;">POS</div>
                            <div style="flex: 1;">JUGADOR</div>
                            <div style="width: 50px; text-align: center;">V</div>
                            <div style="width: 50px; text-align: center;">PTS</div>
                        </div>
                        ${ranking.length === 0 ? `
                             <div style="padding: 60px 20px; text-align: center; color: #ccc;">No hay datos aún.</div>
                        ` : ranking.map((p, i) => {
                let rowStyle = 'background: white;';
                let posContent = i + 1;

                if (i === 0) {
                    rowStyle = 'background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(255,255,255,0)); border-left: 5px solid #FFD700;';
                    posContent = '🏆';
                } else if (i === 1) {
                    rowStyle = 'background: linear-gradient(90deg, rgba(192,192,192,0.15), rgba(255,255,255,0)); border-left: 5px solid #C0C0C0;';
                    posContent = '🥈';
                } else if (i === 2) {
                    posContent = '🥉';
                }

                return `
                                <div style="padding: 16px 18px; display: flex; align-items: center; border-bottom: 1px solid #f9f9f9; ${rowStyle} transition: all 0.2s;">
                                    <div style="width: 45px; font-weight: 950; font-size: 1.1rem; color: ${i < 3 ? '#000' : '#bbb'};">
                                        ${posContent}
                                    </div>
                                    <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                        <div style="font-weight: ${i < 3 ? '950' : '700'}; color: #111; font-size: 0.95rem;">${p.name.toUpperCase()}</div>
                                        ${i === 0 ? '<span style="background: #CCFF00; color: #000; padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900;">LÍDER</span>' : ''}
                                    </div>
                                    <div style="width: 50px; text-align: center; font-weight: 700; color: #666; font-size: 0.8rem;">${p.won} V</div>
                                    <div style="width: 60px; text-align: center;">
                                        <div style="font-weight: 950; color: #000; font-size: 1.1rem; letter-spacing: -0.5px;">${p.points}</div>
                                        <div style="font-size: 0.5rem; color: #999; font-weight: 800; text-transform: uppercase;">${isEntreno ? 'PARTIDOS' : 'PTS'}</div>
                                    </div>
                                </div>`;
            }).join('')}
                    </div>
                </div>
            `;
        }
    }
    window.ControlTowerStandings = ControlTowerStandings;
})();
