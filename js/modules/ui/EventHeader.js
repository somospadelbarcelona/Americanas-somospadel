/**
 * EventHeader.js
 * Extracted UI logic for rendering the tournament header and sub-navigation.
 */
(function () {
    window.EventHeader = {
        render(americanaDoc, options = {}) {
            const { activeTab, isPlayingHere, theme } = options;
            const amName = americanaDoc ? americanaDoc.name : "Americana Activa";
            const isFemale = (americanaDoc?.category === 'female');
            const isMixed = (americanaDoc?.category === 'mixed');
            const isMale = (americanaDoc?.category === 'male');

            return `
                <div class="tour-header-context" style="background: ${theme.grad}; padding: 45px 20px 35px; text-align: center; border-bottom: 2px solid rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.2); filter: blur(60px); border-radius: 50%;"></div>
                    
                    <div style="position:absolute; top:20px; right:20px; display:flex; gap:12px; z-index:10; flex-wrap: wrap; justify-content: flex-end;">
                         <div onclick="window.ControlTowerView.replayShuffleAnimation()" 
                               style="background: #ffffff; color: #72a800; padding:8px 16px; border-radius:12px; font-weight:950; font-size:0.65rem; cursor:pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                             <i class="fas fa-random"></i> SORTEO
                         </div>
                         <div onclick="window.ChatView.init('${americanaDoc?.id}', '${amName}')" 
                               style="background: #ffffff; color: #0a192f; padding:8px 16px; border-radius:12px; font-weight:950; font-size:0.65rem; cursor:pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                             <i class="fas fa-comment-dots"></i> CHAT
                         </div>
                         <div onclick="window.openTVMode('${americanaDoc?.id}', '${americanaDoc?.isEntreno ? 'entreno' : 'americana'}')" 
                               style="background: #ffffff; color: #72a800; padding:8px 16px; border-radius:12px; font-weight:950; font-size:0.65rem; cursor:pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                             <i class="fas fa-tv"></i> TV
                         </div>
                    </div>

                    ${isPlayingHere ? `
                        <div style="background: rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); color: ${theme.text}; display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 0.65rem; font-weight: 950; margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase;">
                           PARTICIPANDO EN VIVO ✅
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; position: relative; z-index: 2;">
                        <div style="position: relative;">
                            <img src="${americanaDoc?.image_url || 'img/logo_somospadel.png'}" 
                                 style="width: 85px; height: 85px; border-radius: 50%; border: 4px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.3);"
                                 onerror="this.src='img/logo_somospadel.png'">
                            <div style="position: absolute; bottom: -5px; right: -5px; background: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 1.1rem;">${isFemale ? '♀️' : isMale ? '♂️' : '🎾'}</span>
                            </div>
                        </div>
                        <h1 style="color: ${theme.text}; margin: 0; font-family: 'Outfit'; font-weight: 1000; font-size: 1.8rem; letter-spacing: -1px;">${amName.toUpperCase()}</h1>
                    </div>
                    
                    <div style="color: ${theme.text}; opacity: 0.7; font-size: 0.85rem; margin-top: 15px; font-weight: 900; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <div style="background: rgba(0,0,0,0.05); padding: 4px 12px; border-radius: 8px;">
                            ${americanaDoc?.date || ''} • ${(isMale ? 'MASCULINA' : isFemale ? 'FEMENINA' : isMixed ? 'MIXTA' : 'CATEGORÍA PRO')}
                        </div>
                    </div>
                </div>

                <div class="tour-sub-nav" style="background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); padding: 14px; display: flex; gap: 8px; border-bottom: 2px solid #72a800; position: sticky; top: 62px; z-index: 1001; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow-x: auto;">
                    <button class="tour-menu-item ${activeTab === 'results' ? 'active' : ''}" style="flex:1; min-width: 90px; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${activeTab === 'results' ? theme.grad : '#f1f5f9'}; color: ${activeTab === 'results' ? '#000' : '#64748b'}; border: 1px solid ${activeTab === 'results' ? '#72a800' : '#e2e8f0'}; transition: all 0.3s;" onclick="window.ControlTowerView.switchTab('results')">CALENDARIO</button>
                    ${americanaDoc?.status !== 'scheduled' ? `
                        <button class="tour-menu-item ${activeTab === 'standings' ? 'active' : ''}" style="flex:1; min-width: 90px; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${activeTab === 'standings' ? theme.grad : '#f1f5f9'}; color: ${activeTab === 'standings' ? '#000' : '#64748b'}; border: 1px solid ${activeTab === 'standings' ? '#72a800' : '#e2e8f0'}; transition: all 0.3s;" onclick="window.ControlTowerView.switchTab('standings')">POSICIONES</button>
                        <button class="tour-menu-item ${activeTab === 'brackets' ? 'active' : ''}" style="flex:1; min-width: 90px; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${activeTab === 'brackets' ? theme.grad : '#f1f5f9'}; color: ${activeTab === 'brackets' ? '#000' : '#64748b'}; border: 1px solid ${activeTab === 'brackets' ? '#72a800' : '#e2e8f0'}; transition: all 0.3s;" onclick="window.ControlTowerView.switchTab('brackets')">CUADROS</button>
                        <button class="tour-menu-item ${activeTab === 'summary' ? 'active' : ''}" style="flex:1; min-width: 70px; border-radius: 14px; font-size: 0.65rem; font-weight: 950; background: ${activeTab === 'summary' ? theme.grad : '#f1f5f9'}; color: ${activeTab === 'summary' ? '#000' : '#64748b'}; border: 1px solid ${activeTab === 'summary' ? '#72a800' : '#e2e8f0'}; transition: all 0.3s;" onclick="window.ControlTowerView.switchTab('summary')">STATS</button>
                    ` : ''}
                </div>
            `;
        },

        renderRoundTabs(rounds, currentNum, americanaDoc, allMatches) {
            return `
                <div class="round-tabs-container" style="display:flex; gap:10px; align-items: center; padding: 5px 2px;">
                    ${rounds.map(r => {
                        const isSel = parseInt(r.number) === parseInt(currentNum);
                        // Check if round is finished (all matches in this round are finished)
                        const roundMatches = allMatches.filter(m => parseInt(m.round) === parseInt(r.number));
                        const isFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished');

                        return `
                            <button type="button" 
                                    class="round-tab ${isSel ? 'active' : ''}" 
                                    onclick="window.ControlTowerView.goToRound(${r.number}, event)"
                                    style="background: ${isSel ? 'linear-gradient(135deg, #CCFF00 0%, #00E36D 100%)' : '#f1f5f9'}; 
                                           color: ${isSel ? 'black' : '#64748b'}; 
                                           border: 1px solid ${isSel ? '#72a800' : '#e2e8f0'};
                                           padding: 12px 20px; border-radius: 16px; font-weight: 1000; cursor: pointer; transition: all 0.4s; min-width: 65px;
                                           box-shadow: ${isSel ? '0 8px 25px rgba(114, 168, 0, 0.2)' : 'none'};
                                           position: relative; font-size: 0.8rem;">
                                ${r.number}º
                                ${isFinished ? '<span style="position:absolute; top:-5px; right:-5px; background:#25D366; color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.6rem; border:2px solid #ffffff;">✓</span>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }
    };
})();
