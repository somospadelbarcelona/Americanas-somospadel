/**
 * EventHeader.js
 * Extracted UI logic for rendering the tournament header and sub-navigation.
 * SomosPadel BCN - Pro Sports Edition
 */
(function () {
    window.EventHeader = {
        render(americanaDoc, options = {}) {
            const { activeTab, isPlayingHere } = options;
            const amName = americanaDoc ? americanaDoc.name : "Americana Activa";
            const isEntreno = !!americanaDoc?.isEntreno;
            const isFemale = (americanaDoc?.category === 'female');
            const isMixed = (americanaDoc?.category === 'mixed');
            const isMale = (americanaDoc?.category === 'male');

            const categoryLabel = isMale ? 'MASCULINO' : isFemale ? 'FEMENINO' : isMixed ? 'MIXTO' : 'CATEGORÍA PRO';
            const categoryEmoji = isFemale ? '♀️' : isMale ? '♂️' : isMixed ? '👥' : '🎾';

            // Theme dinámico de alta fidelidad deportiva
            const heroBg = isEntreno 
                ? 'linear-gradient(145deg, #0a0f1d 0%, #172033 50%, #1e1b4b 100%)' 
                : 'linear-gradient(145deg, #042f2e 0%, #064e3b 50%, #0f172a 100%)';
            const heroAccent = isEntreno ? '#a855f7' : '#ccff00';
            const heroAccentText = isEntreno ? '#d8b4fe' : '#ccff00';

            return `
                <div class="tour-header-context" style="background: ${heroBg}; padding: 26px 16px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; color: #ffffff;">
                    <!-- Ambient dynamic glows -->
                    <div style="position: absolute; top: -70px; left: 50%; transform: translateX(-50%); width: 260px; height: 160px; background: ${isEntreno ? 'rgba(168, 85, 247, 0.22)' : 'rgba(204, 255, 0, 0.18)'}; filter: blur(75px); border-radius: 50%; pointer-events: none;"></div>
                    <div style="position: absolute; bottom: -40px; right: -20px; width: 140px; height: 140px; background: rgba(0, 227, 109, 0.12); filter: blur(55px); border-radius: 50%; pointer-events: none;"></div>

                    <!-- Top Action Bar (Sorteo, Chat, TV) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 18px; position: relative; z-index: 10;">
                        <!-- Event Badge Tag -->
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); padding: 5px 12px; border-radius: 20px;">
                            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${heroAccent}; box-shadow: 0 0 10px ${heroAccent};"></span>
                            <span style="font-size: 0.65rem; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: ${heroAccentText};">
                                ${isEntreno ? 'ENTRENO PRO' : 'TORNEO AMERICANAS'}
                            </span>
                        </div>

                        <!-- Action Buttons Pill Grid -->
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button type="button" onclick="window.ControlTowerView.replayShuffleAnimation()" 
                                    title="Repetir animación de sorteo"
                                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 13px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-random" style="color: ${heroAccent}; font-size: 0.75rem;"></i>
                                <span>SORTEO</span>
                            </button>
                            <button type="button" onclick="window.ChatView.init('${americanaDoc?.id}', '${amName}')" 
                                    title="Abrir chat del evento"
                                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 13px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-comment-dots" style="color: #38bdf8; font-size: 0.75rem;"></i>
                                <span>CHAT</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.switchTab('live_feed') : window.openTVMode('${americanaDoc?.id}', '${isEntreno ? 'entreno' : 'americana'}')" 
                                    title="Abrir Centro en Vivo y Minuto a Minuto"
                                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 13px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-broadcast-tower" style="color: #ef4444; font-size: 0.75rem;"></i>
                                <span>EN VIVO / TV</span>
                            </button>
                            </button>
                        </div>
                    </div>

                    <!-- Live User Playing Banner -->
                    ${isPlayingHere ? `
                        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.18); border: 1px solid rgba(74, 222, 128, 0.4); color: #86efac; padding: 6px 16px; border-radius: 30px; font-size: 0.68rem; font-weight: 950; margin-bottom: 16px; letter-spacing: 0.8px; text-transform: uppercase; box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; animation: livePulseDot 1.5s infinite;"></span>
                            ESTÁS CONVOCADO EN ESTE EVENTO ★
                        </div>
                    ` : ''}

                    <!-- Center Hero Info -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 2;">
                        <div style="position: relative;">
                            <div style="position: absolute; inset: -4px; border-radius: 50%; background: linear-gradient(135deg, ${heroAccent} 0%, #00e36d 100%); filter: blur(6px); opacity: 0.7;"></div>
                            <img src="${americanaDoc?.image_url || 'img/logo_somospadel.png'}" 
                                 alt="Event Logo"
                                 style="width: 74px; height: 74px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.9); object-fit: cover; position: relative; z-index: 1; box-shadow: 0 12px 30px rgba(0,0,0,0.4);"
                                 onerror="this.src='img/logo_somospadel.png'">
                            <div style="position: absolute; bottom: -3px; right: -3px; background: #ffffff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 2; border: 2px solid #0f172a;">
                                <span style="font-size: 0.9rem; line-height: 1;">${categoryEmoji}</span>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; max-width: 92%;">
                            <h1 style="color: #ffffff; margin: 0; font-family: 'Outfit', sans-serif; font-weight: 1000; font-size: 1.45rem; letter-spacing: -0.5px; line-height: 1.2; text-shadow: 0 2px 10px rgba(0,0,0,0.4);">
                                ${amName.toUpperCase()}
                            </h1>
                            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); font-size: 0.72rem; font-weight: 800; color: #cbd5e1;">
                                <i class="fas fa-calendar-alt" style="color: ${heroAccent}; font-size: 0.72rem;"></i>
                                <span>${americanaDoc?.date || 'Fecha por confirmar'}</span>
                                <span style="color: rgba(255,255,255,0.3);">•</span>
                                <span style="color: #ffffff;">${categoryLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sub Navigation Bar (CALENDARIO | EN VIVO | POSICIONES | CUADROS | STATS) -->
                <div class="tour-sub-nav" style="background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 8px 10px; display: flex; gap: 5px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 50px; z-index: 1001; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow-x: auto; scrollbar-width: none;">
                    <button class="tour-subnav-btn ${activeTab === 'results' ? 'active' : ''}" 
                            onclick="window.ControlTowerView.switchTab('results')"
                            style="${activeTab === 'results' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                        <i class="fas fa-calendar-check" style="${activeTab === 'results' ? `color: ${heroAccent};` : ''}"></i>
                        <span>CALENDARIO</span>
                    </button>
                    <button class="tour-subnav-btn ${activeTab === 'live_feed' ? 'active' : ''}" 
                            onclick="window.ControlTowerView.switchTab('live_feed')"
                            style="${activeTab === 'live_feed' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                        <i class="fas fa-broadcast-tower" style="color: #ef4444; animation: livePulseDot 1.8s infinite;"></i>
                        <span>EN VIVO</span>
                    </button>
                    ${americanaDoc?.status !== 'scheduled' ? `
                        <button class="tour-subnav-btn ${activeTab === 'standings' ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('standings')"
                                style="${activeTab === 'standings' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-trophy" style="${activeTab === 'standings' ? 'color: #fbbf24;' : ''}"></i>
                            <span>POSICIONES</span>
                        </button>
                        <button class="tour-subnav-btn ${activeTab === 'brackets' ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('brackets')"
                                style="${activeTab === 'brackets' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-sitemap" style="${activeTab === 'brackets' ? 'color: #38bdf8;' : ''}"></i>
                            <span>CUADROS</span>
                        </button>
                        <button class="tour-subnav-btn ${activeTab === 'summary' ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('summary')"
                                style="${activeTab === 'summary' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-chart-bar" style="${activeTab === 'summary' ? 'color: #ec4899;' : ''}"></i>
                            <span>STATS</span>
                        </button>
                    ` : ''}
                </div>

                <style>
                    .tour-sub-nav::-webkit-scrollbar { display: none; }
                    .tour-subnav-btn {
                        flex: 1;
                        min-width: 80px;
                        padding: 8px 6px;
                        border-radius: 12px;
                        font-size: 0.65rem;
                        font-weight: 950;
                        border: 1px solid;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        cursor: pointer;
                        transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
                        letter-spacing: 0.3px;
                        white-space: nowrap;
                    }
                    .tour-subnav-btn:active {
                        transform: scale(0.96);
                    }
                    @keyframes livePulseDot {
                        0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                        70% { transform: scale(1.4); opacity: 0.7; box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
                        100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                    }
                </style>
            `;
        },

        renderRoundTabs(rounds, currentNum, americanaDoc, allMatches) {
            const matchesArr = Array.isArray(allMatches) ? allMatches : [];
            const isEntreno = !!americanaDoc?.isEntreno;
            const activeColor = isEntreno ? '#8b5cf6' : '#72a800';
            const activeGlow = isEntreno ? 'rgba(139, 92, 246, 0.25)' : 'rgba(114, 168, 0, 0.25)';

            return `
                <div class="round-tabs-container" style="display: flex; gap: 8px; align-items: center; padding: 2px 2px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
                    ${rounds.map(r => {
                        const rNum = parseInt(r.number);
                        const isSel = rNum === parseInt(currentNum);
                        const roundMatches = matchesArr.filter(m => parseInt(m.round) === rNum);
                        const isFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished' || m.status === 'finalizado' || m.isFinished === true);
                        const hasLiveMatch = roundMatches.some(m => (m.status === 'live' || m.status === 'en juego') && !m.isFinished);

                        let chipBg = '#f1f5f9';
                        let chipText = '#64748b';
                        let chipBorder = '#e2e8f0';
                        let chipShadow = 'none';

                        if (isSel) {
                            chipBg = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
                            chipText = '#ffffff';
                            chipBorder = '#0f172a';
                            chipShadow = `0 4px 14px ${activeGlow}`;
                        } else if (isFinished) {
                            chipBg = '#f0fdf4';
                            chipText = '#15803d';
                            chipBorder = '#bbf7d0';
                        }

                        return `
                            <button type="button" 
                                    class="round-tab ${isSel ? 'active' : ''}" 
                                    onclick="window.ControlTowerView.goToRound(${r.number}, event)"
                                    style="background: ${chipBg}; 
                                           color: ${chipText}; 
                                           border: 1px solid ${chipBorder};
                                           padding: 8px 14px; border-radius: 12px; font-weight: 950; cursor: pointer; transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); min-width: 58px;
                                           box-shadow: ${chipShadow};
                                           position: relative; font-size: 0.76rem; display: inline-flex; align-items: center; justify-content: center; gap: 5px; flex-shrink: 0; white-space: nowrap;">
                                <span style="${isSel ? `color: ${isEntreno ? '#c084fc' : '#ccff00'}; font-weight: 1000;` : ''}">${r.number}º</span>
                                ${isFinished ? '<span style="background: #22c55e; color: white; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.52rem; font-weight: 900; line-height: 1;">✓</span>' : ''}
                                ${hasLiveMatch && !isFinished ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: livePulseDot 1.5s infinite;"></span>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
                <style>
                    .round-tabs-container::-webkit-scrollbar { display: none; }
                    .round-tab:active { transform: scale(0.95); }
                </style>
            `;
        }
    };
})();
