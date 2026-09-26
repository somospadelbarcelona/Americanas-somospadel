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

            const categoryLabel = isMale ? 'MASCULINO' : isFemale ? 'FEMENINO' : isMixed ? 'MIXTO' : 'CATEGORÍA OPEN';
            const categoryEmoji = isFemale ? '♀️' : isMale ? '♂️' : isMixed ? '👥' : '🎾';

            // Theme dinámico de alta fidelidad deportiva
            const heroBg = isEntreno 
                ? 'linear-gradient(145deg, #0a0f1d 0%, #172033 50%, #1e1b4b 100%)' 
                : 'linear-gradient(145deg, #042f2e 0%, #064e3b 50%, #0f172a 100%)';
            const heroAccent = isEntreno ? '#a855f7' : '#ccff00';
            const heroAccentText = isEntreno ? '#d8b4fe' : '#ccff00';

            // Modo de juego: PAREJA FIJA, TWISTER o SUIZO
            const isSwissEvent = !!(americanaDoc?.pair_mode === 'swiss' || (americanaDoc?.name || '').toUpperCase().includes('SUIZ'));
            const isFixedEvent = !isSwissEvent && !!(americanaDoc?.is_fija || (americanaDoc?.pair_mode || '').toLowerCase().includes('fix') || (americanaDoc?.name || '').toUpperCase().includes('FIJA'));
            const eventBadgeLabel = isSwissEvent ? 'SUIZO' : (isFixedEvent ? 'PAREJA FIJA' : 'TWISTER');

            return `
                <div class="tour-header-context" style="background: ${heroBg}; padding: 26px 16px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; color: #ffffff;">
                    <!-- Ambient dynamic glows -->
                    <div style="position: absolute; top: -70px; left: 50%; transform: translateX(-50%); width: 260px; height: 160px; background: ${isEntreno ? 'rgba(168, 85, 247, 0.22)' : 'rgba(204, 255, 0, 0.18)'}; filter: blur(75px); border-radius: 50%; pointer-events: none;"></div>
                    <div style="position: absolute; bottom: -40px; right: -20px; width: 140px; height: 140px; background: rgba(0, 227, 109, 0.12); filter: blur(55px); border-radius: 50%; pointer-events: none;"></div>

                    <!-- Top Action Bar (Sorteo, Chat, TV, Crónica) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; position: relative; z-index: 10;">
                        <!-- Event Badge Tag -->
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); padding: 5px 12px; border-radius: 20px;">
                            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${heroAccent}; box-shadow: 0 0 10px ${heroAccent};"></span>
                            <span style="font-size: 0.65rem; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: ${heroAccentText};">
                                ${eventBadgeLabel}
                            </span>
                        </div>

                        <!-- Action Buttons Pill Grid -->
                        <div style="display: flex; gap: 8px; align-items: center; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; max-width: 100%;">
                            <button type="button" onclick="window.ControlTowerView.replayShuffleAnimation()" 
                                    title="Repetir animación de sorteo"
                                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 12px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-random" style="color: ${heroAccent}; font-size: 0.75rem;"></i>
                                <span>SORTEO</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.switchTab('live_feed') : window.openTVMode('${americanaDoc?.id}', '${isEntreno ? 'entreno' : 'americana'}')" 
                                    title="Abrir Centro en Vivo y Minuto a Minuto"
                                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ffffff; padding: 7px 12px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.16); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-broadcast-tower" style="color: #ef4444; font-size: 0.75rem;"></i>
                                <span>EN VIVO / TV</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.openEventSummaryFlyer() : window.openSessionFlyer('${americanaDoc?.id}')" 
                                    title="Ver resumen y flyer de clasificación para compartir en WhatsApp e Instagram"
                                    style="background: linear-gradient(135deg, rgba(204, 255, 0, 0.2) 0%, rgba(204, 255, 0, 0.06) 100%); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #CCFF00; padding: 7px 12px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(204, 255, 0, 0.4); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(204,255,0,0.15); flex-shrink: 0; white-space: nowrap;">
                                <i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.75rem;"></i>
                                <span>FLYER / PODIO</span>
                            </button>
                            <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.openChronicleAI() : (window.TournamentChronicleModal?.open())" 
                                    title="Crónica Épica de la Jornada"
                                    style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(204, 255, 0, 0.12) 100%); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #CCFF00; padding: 7px 12px; border-radius: 12px; font-weight: 900; font-size: 0.68rem; cursor: pointer; border: 1px solid rgba(139, 92, 246, 0.5); display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(139,92,246,0.2); flex-shrink: 0; white-space: nowrap;">
                                <span>✨</span>
                                <span>CRÓNICA ÉPICA</span>
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

                <!-- Sub Navigation Bar (RESULTADOS | POSICIONES | RESUMEN) -->
                <div class="tour-sub-nav" style="background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 8px 10px; display: flex; gap: 5px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 50px; z-index: 1001; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow-x: auto; scrollbar-width: none;">
                    <button class="tour-subnav-btn ${activeTab === 'results' ? 'active' : ''}" 
                            onclick="window.ControlTowerView.switchTab('results')"
                            style="${activeTab === 'results' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                        <i class="fas fa-clipboard-check" style="${activeTab === 'results' ? `color: ${heroAccent};` : ''}"></i>
                        <span>RESULTADOS</span>
                    </button>
                    ${americanaDoc?.status !== 'scheduled' ? `
                        <button class="tour-subnav-btn ${activeTab === 'standings' ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('standings')"
                                style="${activeTab === 'standings' ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-trophy" style="${activeTab === 'standings' ? 'color: #fbbf24;' : ''}"></i>
                            <span>POSICIONES</span>
                        </button>
                        <button class="tour-subnav-btn ${(activeTab === 'resumen' || activeTab === 'summary' || activeTab === 'stats') ? 'active' : ''}" 
                                onclick="window.ControlTowerView.switchTab('resumen')"
                                style="${(activeTab === 'resumen' || activeTab === 'summary' || activeTab === 'stats') ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);' : 'background: #f1f5f9; color: #64748b; border-color: #e2e8f0;'}">
                            <i class="fas fa-chart-line" style="${(activeTab === 'resumen' || activeTab === 'summary' || activeTab === 'stats') ? 'color: #10b981;' : ''}"></i>
                            <span>RESUMEN</span>
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
            const neonColor = isEntreno ? '#c084fc' : '#CCFF00';
            const neonGlow = isEntreno ? 'rgba(192, 132, 252, 0.35)' : 'rgba(204, 255, 0, 0.35)';

            let effectiveRounds = Array.isArray(rounds) && rounds.length > 0 ? [...rounds] : [];
            const minRounds = 6;
            if (effectiveRounds.length < minRounds) {
                const highestNum = effectiveRounds.length > 0 
                    ? Math.max(...effectiveRounds.map(r => parseInt(r.number || 0))) 
                    : 0;
                const targetCount = Math.max(minRounds, highestNum);
                effectiveRounds = Array.from({ length: targetCount }, (_, i) => ({ number: i + 1 }));
            }

            return `
                <div class="round-tabs-container" style="display: flex; gap: 6px; align-items: center; padding: 4px 6px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -webkit-overflow-scrolling: touch; width: 100%;">
                    ${effectiveRounds.map(r => {
                        const rNum = parseInt(r.number);
                        const isSel = rNum === parseInt(currentNum);
                        const roundMatches = matchesArr.filter(m => parseInt(m.round) === rNum);
                        const isFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished' || m.status === 'finalizado' || m.isFinished === true);
                        const hasLiveMatch = roundMatches.some(m => (m.status === 'live' || m.status === 'en juego') && !m.isFinished);

                        let chipBg = '#f8fafc';
                        let chipText = '#64748b';
                        let chipBorder = '#e2e8f0';
                        let chipShadow = 'none';
                        let badgeMarkup = '';

                        if (isSel) {
                            chipBg = '#0f172a';
                            chipText = '#ffffff';
                            chipBorder = neonColor;
                            chipShadow = `0 4px 16px ${neonGlow}`;
                            if (isFinished) {
                                badgeMarkup = `<span style="color: #22c55e; font-weight: 950; font-size: 0.75rem; margin-left: 2px;">✓</span>`;
                            } else if (hasLiveMatch) {
                                badgeMarkup = `<span style="color: #00E36D; font-size: 0.65rem; line-height: 1; margin-left: 2px; animation: pulseRoundLive 1.5s infinite;">●</span>`;
                            }
                        } else if (isFinished) {
                            chipBg = '#f0fdf4';
                            chipText = '#15803d';
                            chipBorder = '#bbf7d0';
                            badgeMarkup = `<span style="color: #16a34a; font-weight: 950; font-size: 0.75rem; margin-left: 2px;">✓</span>`;
                        } else if (hasLiveMatch) {
                            chipBg = '#f0fdf4';
                            chipText = '#166534';
                            chipBorder = '#86efac';
                            chipShadow = '0 2px 8px rgba(34, 197, 94, 0.15)';
                            badgeMarkup = `<span style="color: #22c55e; font-size: 0.65rem; line-height: 1; margin-left: 2px; animation: pulseRoundLive 1.5s infinite;">●</span>`;
                        } else {
                            // Ronda Pendiente
                            chipBg = '#f8fafc';
                            chipText = '#64748b';
                            chipBorder = '#e2e8f0';
                        }

                        return `
                            <button type="button" 
                                    class="round-tab ${isSel ? 'active' : ''}" 
                                    data-round="${r.number}"
                                    onclick="window.ControlTowerView.goToRound(${r.number}, event)"
                                    style="background: ${chipBg}; 
                                           color: ${chipText}; 
                                           border: 1.5px solid ${chipBorder};
                                           padding: 6px 12px; border-radius: 12px; font-family: 'Outfit', sans-serif; font-weight: 950; cursor: pointer; transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); min-width: 50px;
                                           box-shadow: ${chipShadow};
                                           position: relative; font-size: 0.78rem; display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; white-space: nowrap;">
                                <span style="${isSel ? `color: ${neonColor}; font-weight: 1000;` : ''}">R${r.number}</span>
                                ${badgeMarkup}
                            </button>
                        `;
                    }).join('')}
                </div>
                <style>
                    .round-tabs-container::-webkit-scrollbar { display: none; }
                    .round-tab:active { transform: scale(0.96); }
                    @keyframes pulseRoundLive {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.35); opacity: 0.6; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                </style>
            `;
        }
    };
})();
