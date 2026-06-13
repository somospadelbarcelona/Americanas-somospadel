/**
 * PerformanceAnalytics.js
 * Big Data Engine for SomosPadel (Monte Carlo Simulations & Stats)
 */
(function () {
    class PerformanceAnalytics {
        constructor() {}

        /**
         * Simulates a match between two levels using Monte Carlo.
         * Runs 1000 iterations to find the win probability.
         */
        simulateMatch(lvlA, lvlB) {
            let winsA = 0;
            const iterations = 1000;
            
            // Base probability derived from level difference
            const diff = lvlA - lvlB;
            const baseProb = 0.5 + (diff * 0.2); // 0.5 level diff = +10% probability
            
            for (let i = 0; i < iterations; i++) {
                // Add some randomness/vibration to represent bad days, luck, etc.
                const vibration = (Math.random() - 0.5) * 0.1;
                if (Math.random() < (baseProb + vibration)) {
                    winsA++;
                }
            }
            
            return Math.round((winsA / iterations) * 100);
        }

        renderSimulator(players) {
            // Simplified: Pick 3 top players to simulate against
            const rivals = players.slice(0, 3);
            const user = window.Store?.getState('currentUser');
            const userLvl = user?.level || 3.5;

            return `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 28px; padding: 25px; margin-bottom: 25px; position: relative; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.4);">
                    <div style="position: absolute; top: -10px; right: -10px; font-size: 6rem; opacity: 0.03; color: #3b82f6; pointer-events: none;"><i class="fas fa-microchip"></i></div>
                    
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="width: 36px; height: 36px; background: #3b82f6; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 0.85rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase;">LAB SIMULATOR</h3>
                            <p style="margin: 0; font-size: 0.6rem; color: #3b82f6; font-weight: 800;">MONTE CARLO ENGINE (1K ITERATIONS)</p>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${rivals.map(r => {
                            const prob = this.simulateMatch(userLvl, r.level || 3.5);
                            return `
                                <div style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.02); padding: 12px 18px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">VS ${r.name.split(' ')[0]}</div>
                                        <div style="font-size: 0.6rem; color: #444; font-weight: 900;">LEVEL ${parseFloat(r.level || 3.5).toFixed(2)}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 1.2rem; font-weight: 950; color: ${prob > 50 ? '#CCFF00' : '#ef4444'};">${prob}%</div>
                                        <div style="font-size: 0.5rem; font-weight: 900; color: #64748b; text-transform: uppercase;">WIN PROB</div>
                                    </div>
                                    <div style="width: 40px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; position: relative; overflow: hidden;">
                                        <div style="position: absolute; top:0; left:0; height:100%; width: ${prob}%; background: ${prob > 50 ? '#CCFF00' : '#ef4444'}; border-radius: 10px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }

    window.PerformanceAnalytics = new PerformanceAnalytics();
})();
