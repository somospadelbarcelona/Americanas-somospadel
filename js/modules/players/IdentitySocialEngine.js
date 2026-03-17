/**
 * IdentitySocialEngine.js
 * Social Content & News Engine for SomosPadel
 */
(function () {
    class IdentitySocialEngine {
        constructor() {}

        generateHeadline(user, stats) {
            const headlines = [
                `¡${user.name} está imparable! Su racha en el MATCHRADAR lo posiciona como el rival a batir.`,
                `${user.name} alcanza un nuevo pico de rendimiento en el PERFORMANCE LAB.`,
                `Los analistas de Big Data señalan a ${user.name} como la revelación de la semana.`,
                `¿Quién podrá frenar a ${user.name}? Su nivel pro sigue escalando posiciones.`,
                `Hito desbloqueado: ${user.name} completa su partido número ${stats.matches} con una efectividad brutal.`
            ];
            return headlines[Math.floor(Math.random() * headlines.length)];
        }

        renderTimeline(matches) {
            const milestones = matches.slice(0, 5).map((m, i) => {
                const date = new Date(m.date);
                const isWin = m.result === 'W';
                return `
                    <div style="display: flex; gap: 15px; position: relative; padding-bottom: 25px;">
                        ${i < 4 ? `<div style="position: absolute; left: 7px; top: 15px; bottom: 0; width: 1px; background: rgba(255,255,255,0.1);"></div>` : ''}
                        <div style="width: 15px; height: 15px; border-radius: 50%; background: ${isWin ? '#CCFF00' : '#444'}; border: 3px solid #09090b; z-index: 2; margin-top: 5px;"></div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${m.date}</div>
                            <div style="font-size: 0.85rem; font-weight: 700; color: #fff;">${m.eventName}</div>
                            <div style="font-size: 0.7rem; color: ${isWin ? '#00E36D' : '#ef4444'}; font-weight: 950; letter-spacing: 0.5px;">
                                ${isWin ? 'VICTORIA ÉPICA' : 'DESAFÍO COMPLETADO'} • ${m.score}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div style="background: rgba(255, 255, 255, 0.02); border-radius: 32px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); margin-top: 25px;">
                    <h3 style="margin: 0 0 20px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-stream" style="color: #CCFF00;"></i> IDENTITY TIMELINE
                    </h3>
                    <div style="display: flex; flex-direction: column;">
                        ${milestones || '<div style="color:#444; font-size:0.75rem; text-align:center;">Empieza a jugar para crear tu historia</div>'}
                    </div>
                </div>
            `;
        }
    }

    window.IdentitySocialEngine = new IdentitySocialEngine();
})();
