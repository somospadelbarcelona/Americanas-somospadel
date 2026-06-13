/**
 * EventModals.js
 * Extracted UI logic for tournament and training completion modals.
 */
(function () {
    window.EventModals = {
        /**
         * Shows a modal when all matches in a round are finished.
         */
        showRoundFinishedModal(round, americanaDoc, onNextRound, onEdit) {
            if (document.getElementById('round-finished-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'round-finished-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); z-index: 13000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;
            `;

            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #111 0%, #0a0a0a 100%); width: 90%; max-width: 400px; padding: 30px; border-radius: 24px; border: 2px solid #CCFF00; text-align: center; box-shadow: 0 0 50px rgba(204,255,0,0.2); position: relative;">
                    <div style="width: 60px; height: 60px; background: #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(204,255,0,0.6);">
                        <i class="fas fa-flag-checkered" style="font-size: 1.8rem; color: black;"></i>
                    </div>
                    <h2 style="color: white; font-weight: 950; font-size: 1.5rem; margin: 0 0 10px 0;">RONDA ${round} FINALIZADA</h2>
                    <p style="color: #bbb; font-size: 0.9rem; margin-bottom: 25px;">Todos los partidos han terminado. ¿Qué quieres hacer?</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="btn-next-round" style="background: #CCFF00; color: black; border: none; padding: 16px; border-radius: 14px; font-weight: 900; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 5px 15px rgba(204,255,0,0.3);">
                            ✅ SÍ, SIGUIENTE RONDA
                        </button>
                        <button id="btn-edit-round" style="background: transparent; color: white; border: 2px solid #333; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
                            ❌ NO, QUIERO EDITAR
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('btn-next-round').onclick = async () => {
                const btn = document.getElementById('btn-next-round');
                btn.innerHTML = '<div class="loader-spinner"></div> GENERANDO...';
                if (onNextRound) await onNextRound();
            };

            document.getElementById('btn-edit-round').onclick = () => {
                if (onEdit) onEdit();
                const el = document.getElementById('round-finished-modal');
                if (el) el.remove();
            };
        },

        closeRoundFinishedModal() {
            const el = document.getElementById('round-finished-modal');
            if (el) el.remove();
        },

        /**
         * Shows the final podium modal for a finished training session.
         */
        showTrainingFinishedModal(finalRound, matches, americanaDoc, onShare, onTabChange, onMenu) {
            if (document.getElementById('training-finished-modal')) return;

            const isFixedPairs = (americanaDoc?.pair_mode || '').toLowerCase().includes('fix')
                || (americanaDoc?.name || '').toUpperCase().includes('FIJA');

            let rankingItems = (window.StandingsService && matches.length > 0)
                ? window.StandingsService.calculate(matches, 'entreno', isFixedPairs, americanaDoc?.players || [])
                : [];

            const medals = ['🏆', '🥈', '🥉'];
            const podiumColors = [
                { bg: 'linear-gradient(135deg,rgba(204,255,0,0.15),rgba(0,0,0,0))', border: '#CCFF00', nameColor: '#CCFF00', ptsColor: '#CCFF00' },
                { bg: 'rgba(192,192,192,0.1)', border: '#C0C0C0', nameColor: '#fff', ptsColor: '#C0C0C0' },
                { bg: 'rgba(205,127,50,0.1)', border: '#CD7F32', nameColor: '#eee', ptsColor: '#CD7F32' }
            ];

            const podiumHTML = rankingItems.slice(0, 3).map((p, i) => {
                const c = podiumColors[i];
                const statLine = isFixedPairs
                    ? `${p.won || 0} victorias • ${p.played || 0} partidos • +${(p.points - p.gamesLost) >= 0 ? '' : ''}${p.points - p.gamesLost} juegos`
                    : `${p.won || 0} victorias • ${p.played || 0} partidos`;
                const ptsValue = isFixedPairs ? p.won : p.points;
                const ptsLabel = isFixedPairs ? 'V' : 'PTS';
                return `
                    <div style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:16px;
                                background:${c.bg}; border:1px solid ${c.border}; margin-bottom:8px;
                                animation: slideInRow 0.4s ease-out ${i * 0.12}s both;">
                        <span style="font-size:1.6rem; width:36px; text-align:center;">${medals[i]}</span>
                        <div style="flex:1;">
                            <div style="font-weight:950; font-size:0.95rem; text-transform:uppercase; color:${c.nameColor};">${p.name}</div>
                            <div style="font-size:0.65rem; color:#888; font-weight:700; margin-top:2px;">${statLine}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:1.4rem; font-weight:950; color:${c.ptsColor};">${ptsValue}</div>
                            <div style="font-size:0.5rem; color:#666; font-weight:800; text-transform:uppercase;">${ptsLabel}</div>
                        </div>
                    </div>`;
            }).join('');

            const overlay = document.createElement('div');
            overlay.id = 'training-finished-modal';
            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 14000;
                display: flex; align-items: center; justify-content: center;
                background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
                animation: fadeIn 0.4s ease; padding: 20px;
            `;

            overlay.innerHTML = `
                <style>
                    @keyframes confettiFall {
                        0%   { transform: translateY(-60px) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
                    }
                    @keyframes trophyBounce {
                        0%,100% { transform: scale(1); }
                        50%      { transform: scale(1.15); }
                    }
                    @keyframes slideInRow {
                        from { opacity: 0; transform: translateX(-15px); }
                        to   { opacity: 1; transform: translateX(0); }
                    }
                    .confetti-dot {
                        position: absolute; border-radius: 50%;
                        animation: confettiFall linear infinite;
                        pointer-events: none;
                    }
                </style>
                ${[...Array(14)].map((_, i) => {
                    const colors = ['#CCFF00','#00E36D','#FF2D55','#3b82f6','#FFD700'];
                    const left = (i * 7) % 100;
                    const delay = (i * 0.3) % 2.5;
                    const dur = 2 + (i % 3) * 0.6;
                    return `<div class="confetti-dot" style="width:8px;height:8px;background:${colors[i % 5]};left:${left}%;top:-20px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
                }).join('')}
                <div style="background: linear-gradient(135deg, #0d0d0d 0%, #111 100%); width: 100%; max-width: 420px; border-radius: 28px; border: 2px solid #CCFF00; box-shadow: 0 0 60px rgba(204,255,0,0.25); overflow: hidden; position: relative;">
                    <div style="background: linear-gradient(135deg,#CCFF00 0%,#9ccc00 100%); padding:24px; text-align:center;">
                        <div style="font-size:3rem; animation: trophyBounce 1.5s infinite;">🏆</div>
                        <div style="font-size:1.1rem; font-weight:950; color:#000; text-transform:uppercase; letter-spacing:2px; margin-top:6px;">FIN DEL ENTRENO</div>
                        <div style="font-size:0.7rem; font-weight:800; color:rgba(0,0,0,0.6); margin-top:3px; text-transform:uppercase; letter-spacing:1px;">${americanaDoc?.name || 'Entreno'} · ${finalRound} rondas</div>
                    </div>
                    <div style="padding:20px 20px 0;">
                        <div style="font-size:0.6rem; color:#CCFF00; font-weight:900; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; text-align:center;">CLASIFICACIÓN FINAL</div>
                        ${podiumHTML}
                    </div>
                    <div style="padding:20px; display:flex; flex-direction:column; gap:10px;">
                        <button id="btn-tf-share" style="background:linear-gradient(135deg,#CCFF00 0%,#b8e600 100%); color:#000; border:none; padding:15px; border-radius:16px; font-weight:950; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                            📸 COMPARTIR RESULTADO
                        </button>
                        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
                            <button id="btn-tf-tab-pos" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.15); padding:12px 5px; border-radius:14px; font-weight:800; font-size:0.65rem; cursor:pointer;"><i class="fas fa-list-ol"></i><br>POSICIONES</button>
                            <button id="btn-tf-tab-cuadros" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.15); padding:12px 5px; border-radius:14px; font-weight:800; font-size:0.65rem; cursor:pointer;"><i class="fas fa-sitemap"></i><br>CUADROS</button>
                            <button id="btn-tf-tab-stats" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.15); padding:12px 5px; border-radius:14px; font-weight:800; font-size:0.65rem; cursor:pointer;"><i class="fas fa-chart-pie"></i><br>STATS</button>
                        </div>
                        <button id="btn-tf-menu" style="width:100%; background:transparent; color:#888; border:1px solid #333; padding:12px; border-radius:14px; font-weight:800; font-size:0.75rem; cursor:pointer;">🏠 VOLVER AL MENÚ</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            document.getElementById('btn-tf-share').onclick = () => onShare(rankingItems, isFixedPairs);
            document.getElementById('btn-tf-tab-pos').onclick = () => { overlay.remove(); onTabChange('standings'); };
            document.getElementById('btn-tf-tab-cuadros').onclick = () => { overlay.remove(); onTabChange('brackets'); };
            document.getElementById('btn-tf-tab-stats').onclick = () => { overlay.remove(); onTabChange('summary'); };
            document.getElementById('btn-tf-menu').onclick = () => { overlay.remove(); onMenu(); };
        }
    };
})();
