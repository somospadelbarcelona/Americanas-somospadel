/**
 * 🎴 PadelFutCard.js — Cartas FIFA Ultimate Team de Pádel, Historial de Partidos & Estadísticas
 * Módulo interactivo para "COTILLEAR" jugadores en SomosPadel BCN.
 * Diseño Clean White (Fondo blanco y letra negra) en las 3 pestañas.
 * SomosPadel BCN — 2026
 */
(function () {
    'use strict';

    const PadelFutCard = {
        currentTab: 'card',
        currentData: null,

        /**
         * Calcula o completa los datos del jugador para su carta FUT y perfil
         * @param {Object} rawData 
         * @returns {Object} FutData completada
         */
        calculateCardData(rawData = {}) {
            rawData = rawData || {};
            const user = rawData.user || rawData || {};
            const stats = rawData.stats || (typeof window !== 'undefined' && window.Store && window.Store.getState('playerStats')?.stats) || {};

            const name = (user.name || user.displayName || 'Jugador SomosPadel').trim();
            const level = parseFloat(user.level || user.nivel || 3.5) || 3.5;
            const photoUrl = user.photo_url || user.photoURL || user.avatar || 'img/logo_somospadel.png';
            const userId = user.id || user.uid || user.userId || rawData.id || rawData.uid || rawData.userId || '';
            const team = (Array.isArray(user.team_somospadel) && user.team_somospadel.length > 0) 
                ? user.team_somospadel[0] 
                : (user.team || 'SomosPadel BCN');
            
            // Posición: Drive (DRV), Revés (REV) o Polivalente (POL)
            let posRaw = String(user.position || user.preferred_side || user.posicion || 'drive').toLowerCase();
            let position = 'DRV';
            let positionFull = 'Drive (Derecha)';
            if (posRaw.includes('rev') || posRaw.includes('izq') || posRaw.includes('left')) {
                position = 'REV';
                positionFull = 'Revés (Izquierda)';
            } else if (posRaw.includes('poli') || posRaw.includes('ambos')) {
                position = 'POL';
                positionFull = 'Polivalente (Ambos lados)';
            }

            // Win rate y partidos
            const matchesCount = stats.matches || (stats.won || 0) + (stats.lost || 0) || user.matches_played || user.total_matches || 10;
            const winsCount = stats.won !== undefined ? stats.won : (user.wins || Math.round(matchesCount * 0.55));
            const winRate = stats.winRate !== undefined ? stats.winRate : (user.win_rate !== undefined ? user.win_rate : Math.round((winsCount / Math.max(1, matchesCount)) * 100));

            // Cálculo del OVR (Overall Rating entre 60 y 99)
            const baseOvrFromLevel = Math.round(42 + (level * 10.2));
            const wrBonus = Math.round((winRate - 50) * 0.12);
            let ovr = Math.min(99, Math.max(60, baseOvrFromLevel + wrBonus));

            // Rareza de carta según OVR
            let cardTier = 'GOLD';
            let tierColor = '#d97706';
            let tierBorder = 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #CCFF00 100%)';
            let glowColor = 'rgba(217, 119, 6, 0.25)';

            if (ovr >= 91) {
                cardTier = 'ICON';
                tierColor = '#0284c7';
                tierBorder = 'linear-gradient(135deg, #00E5FF 0%, #CCFF00 50%, #FF0055 100%)';
                glowColor = 'rgba(2, 132, 199, 0.25)';
            } else if (ovr >= 83) {
                cardTier = 'GOLD PRO';
                tierColor = '#65a30d';
                tierBorder = 'linear-gradient(135deg, #CCFF00 0%, #00E36D 100%)';
                glowColor = 'rgba(101, 163, 13, 0.25)';
            } else if (ovr < 75) {
                cardTier = 'SILVER';
                tierColor = '#64748b';
                tierBorder = 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)';
                glowColor = 'rgba(100, 116, 139, 0.2)';
            }

            // 6 Atributos Clave: REM, VOL, DEF, FIS, TAC, CLU
            const seed = (name.length * 7 + Math.round(level * 10)) % 10;
            const variance = (offset) => Math.min(99, Math.max(50, Math.round(ovr + ((seed + offset) % 9) - 4)));

            let rem = variance(1);
            let vol = variance(3);
            let def = variance(5);
            let fis = variance(7);
            let tac = variance(2);
            let clu = variance(4);

            if (position === 'REV') {
                rem = Math.min(99, rem + 4);
                vol = Math.min(99, vol + 3);
                def = Math.max(55, def - 2);
            } else if (position === 'DRV') {
                def = Math.min(99, def + 4);
                tac = Math.min(99, tac + 3);
                rem = Math.max(55, rem - 2);
            } else {
                tac = Math.min(99, tac + 2);
                clu = Math.min(99, clu + 2);
            }

            return {
                userId,
                name: name.toUpperCase(),
                level: level.toFixed(2),
                ovr,
                position,
                positionFull,
                team,
                photoUrl,
                winRate,
                matchesCount,
                cardTier,
                tierColor,
                tierBorder,
                glowColor,
                attributes: {
                    REM: rem,
                    VOL: vol,
                    DEF: def,
                    FIS: fis,
                    TAC: tac,
                    CLU: clu
                }
            };
        },

        /**
         * Abre un chat directo 1 a 1 con el jugador de la carta actual y cierra el modal
         */
        openChatWithThisPlayer() {
            const data = this.currentData;
            const targetId = data?.userId;
            const modal = document.getElementById('padel-fut-card-modal');
            if (modal) modal.remove();

            if (typeof window.openDirectChatWithPlayer === 'function') {
                window.openDirectChatWithPlayer(data || targetId);
            } else if (window.ChatView && typeof window.ChatView.openDirectChat === 'function') {
                window.ChatView.openDirectChat({
                    id: targetId,
                    uid: targetId,
                    name: data?.name || 'Jugador',
                    photo_url: data?.photoUrl || null,
                    level: data?.level || 3.5
                });
            } else {
                alert("El chat de SomosPadel se está cargando. Inténtalo de nuevo en unos segundos.");
            }
        },

        /**
         * Abre el modal interactivo de Cotillear con fondo blanco y letra negra en las 3 pestañas:
         * 1. CARTA FUT
         * 2. ÚLTIMOS PARTIDOS (con indicador de si ha ganado o perdido)
         * 3. ESTADÍSTICAS
         * @param {Object|string} playerData 
         */
        async open(playerData = {}) {
            if (typeof playerData === 'string') {
                const pId = playerData;
                const cachedUser = (window._currentInscritosPlayersMap && window._currentInscritosPlayersMap[pId]) ||
                    (window.EventsController?.state?.users?.find?.(u => (u.id === pId || u.uid === pId))) ||
                    { id: pId, uid: pId, name: 'Jugador' };
                playerData = cachedUser;
            }

            playerData = playerData || {};
            const data = this.calculateCardData(playerData);
            this.currentData = data;
            this.currentTab = 'card';

            const currentUser = (window.Store && typeof window.Store.getState === 'function' && window.Store.getState('currentUser')) || 
                                window.currentUser || 
                                (window.ChatView && typeof window.ChatView.getCurrentUser === 'function' && window.ChatView.getCurrentUser()) ||
                                null;
            const myUid = currentUser ? (currentUser.id || currentUser.uid) : null;
            const isNotMe = Boolean(data.userId && (!myUid || data.userId !== myUid));

            const existing = document.getElementById('padel-fut-card-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'padel-fut-card-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 99999;
                background: rgba(15, 23, 42, 0.72); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                font-family: 'Outfit', sans-serif; padding: 16px 12px; overflow-y: auto; box-sizing: border-box;
            `;

            modal.innerHTML = `
                <!-- CAJA PRINCIPAL BLANCA -->
                <div style="
                    width: 100%; max-width: 440px; position: relative; display: flex; flex-direction: column; align-items: center;
                    margin: auto 0; padding: 20px 18px 25px; background: #ffffff; border-radius: 28px;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35), 0 0 1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
                    color: #0f172a; box-sizing: border-box;
                ">
                    
                    <!-- BOTÓN CERRAR -->
                    <button onclick="document.getElementById('padel-fut-card-modal').remove()" 
                        style="position: absolute; top: 14px; right: 14px; z-index: 10; background: #f1f5f9; border: 1px solid #cbd5e1; 
                               color: #0f172a; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; 
                               font-size: 0.95rem; font-weight: 900; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        ✕
                    </button>

                    <!-- CABECERA DEL JUGADOR (FONDO BLANCO Y LETRA NEGRA) -->
                    <div style="width: 100%; display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-right: 32px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; border: 2.5px solid #0f172a; overflow: hidden; flex-shrink: 0; background: #f8fafc; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
                            <img src="${data.photoUrl}" alt="${data.name}" onerror="this.src='img/logo_somospadel.png'" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.62rem; color: #0284c7; font-weight: 950; letter-spacing: 1.5px; text-transform: uppercase;">
                                👁️ COTILLEANDO PERFIL
                            </div>
                            <div style="font-size: 1.15rem; font-weight: 950; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                                ${data.name}
                            </div>
                            <div style="font-size: 0.68rem; color: #64748b; font-weight: 800; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                                <span style="color: #0f172a; font-weight: 950; background: #f1f5f9; padding: 1px 6px; border-radius: 6px;">LVL ${data.level}</span>
                                <span>•</span>
                                <span>${data.positionFull}</span>
                                <span>•</span>
                                <span style="color: #059669; font-weight: 900;">${data.team}</span>
                            </div>
                        </div>
                    </div>

                    <!-- BARRA DE PESTAÑAS (TABS) EN BLANCO/GRIS -->
                    <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px; border-radius: 16px; margin-bottom: 16px;">
                        <button id="cotillear-tab-btn-card" onclick="window.PadelFutCard.switchTab('card')" style="
                            background: #0f172a; color: #ffffff; border: none; padding: 9px 4px; border-radius: 12px; font-weight: 950; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                        ">
                            <span>🎴 CARTA FUT</span>
                        </button>
                        <button id="cotillear-tab-btn-matches" onclick="window.PadelFutCard.switchTab('matches')" style="
                            background: transparent; color: #64748b; border: none; padding: 9px 4px; border-radius: 12px; font-weight: 850; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;
                        ">
                            <span>🎾 PARTIDOS</span>
                        </button>
                        <button id="cotillear-tab-btn-stats" onclick="window.PadelFutCard.switchTab('stats')" style="
                            background: transparent; color: #64748b; border: none; padding: 9px 4px; border-radius: 12px; font-weight: 850; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;
                        ">
                            <span>📊 STATS</span>
                        </button>
                    </div>

                    <!-- CONTENEDOR 1: CARTA FUT (FONDO BLANCO Y BOTONES LIMPIOS) -->
                    <div id="cotillear-tab-content-card" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                        
                        <!-- THE 3D FUT CARD -->
                        <div id="padel-fut-card-element" style="
                            width: min(315px, 100%); height: auto; aspect-ratio: 330/490;
                            background: linear-gradient(160deg, #111422 0%, #07090e 60%, #151a0b 100%);
                            border-radius: 26px;
                            position: relative;
                            padding: 3px;
                            box-shadow: 0 16px 40px rgba(0,0,0,0.18);
                            transition: transform 0.3s ease;
                            overflow: hidden;
                        ">
                            <!-- Holographic border shine -->
                            <div style="position: absolute; inset: 0; border-radius: 26px; padding: 2.5px; background: ${data.tierBorder}; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;"></div>

                            <!-- Card Inner Body -->
                            <div style="width: 100%; height: 100%; background: radial-gradient(circle at 50% 20%, rgba(204,255,0,0.06) 0%, #090c14 80%); border-radius: 23px; position: relative; padding: 18px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                                
                                <!-- Carbon Pattern overlay -->
                                <div style="position: absolute; inset: 0; opacity: 0.05; background-image: radial-gradient(#CCFF00 1px, transparent 1px); background-size: 16px 16px; pointer-events: none;"></div>
                                
                                <!-- Top Left: OVR, Position, Club Badge & Flag -->
                                <div style="position: absolute; top: 18px; left: 18px; display: flex; flex-direction: column; align-items: center; z-index: 5;">
                                    <div style="font-size: 2.3rem; font-weight: 950; color: #CCFF00; line-height: 0.9; text-shadow: 0 0 15px rgba(204,255,0,0.4); font-variant-numeric: tabular-nums;">
                                        ${data.ovr}
                                    </div>
                                    <div style="font-size: 0.9rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                                        ${data.position}
                                    </div>
                                    <div style="width: 22px; height: 2px; background: #CCFF00; margin: 5px 0; border-radius: 2px;"></div>
                                    <!-- Escudo SomosPadel -->
                                    <div style="width: 26px; height: 26px; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 8px rgba(204,255,0,0.3); margin-bottom: 3px;" title="SomosPadel BCN">
                                        <img src="img/logo-oficial-somospadel.jpg" alt="SomosPadel BCN" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                                    </div>
                                    <span style="font-size: 0.75rem;">🇪🇸</span>
                                </div>

                                <!-- Top Center / Right: Player Photo -->
                                <div style="width: 100%; height: 200px; display: flex; justify-content: flex-end; align-items: center; position: relative; z-index: 2; margin-top: 4px;">
                                    <div style="width: 180px; height: 190px; border-radius: 22px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 80%);">
                                        <img src="${data.photoUrl}" alt="${data.name}" 
                                             onerror="this.src='img/logo_somospadel.png'"
                                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 18px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8));">
                                    </div>
                                </div>

                                <!-- Center: Player Name & Badge -->
                                <div style="text-align: center; position: relative; z-index: 5; margin-top: 4px; border-bottom: 1.5px solid rgba(255,255,255,0.12); padding-bottom: 6px;">
                                    <div style="font-size: 1.3rem; font-weight: 950; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
                                        ${data.name}
                                    </div>
                                    <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 4px;">
                                        <span style="background: rgba(255,255,255,0.06); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); padding: 2px 8px; border-radius: 10px; font-size: 0.52rem; font-weight: 900; letter-spacing: 1px;">
                                            ${data.cardTier}
                                        </span>
                                        <span style="color: #94a3b8; font-size: 0.58rem; font-weight: 800;">
                                            LVL ${data.level} • WR ${data.winRate}%
                                        </span>
                                    </div>
                                </div>

                                <!-- Bottom: 6 FUT Attributes (2 columns) -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; padding: 9px 12px; background: rgba(0,0,0,0.35); border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); position: relative; z-index: 5;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.95rem; font-weight: 950; color: #fff;">${data.attributes.REM}</span>
                                        <span style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">REM</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.95rem; font-weight: 950; color: #fff;">${data.attributes.FIS}</span>
                                        <span style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">FIS</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.95rem; font-weight: 950; color: #fff;">${data.attributes.VOL}</span>
                                        <span style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">VOL</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.95rem; font-weight: 950; color: #fff;">${data.attributes.TAC}</span>
                                        <span style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">TAC</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.95rem; font-weight: 950; color: #fff;">${data.attributes.DEF}</span>
                                        <span style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">DEF</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.95rem; font-weight: 950; color: #CCFF00;">${data.attributes.CLU}</span>
                                        <span style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">CLU</span>
                                    </div>
                                </div>

                                <!-- Official Footer mark -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; padding: 0 4px; font-size: 0.45rem; font-weight: 900; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px;">
                                    <span>somospadelbarcelona_</span>
                                    <span>★ OFFICIAL CARD</span>
                                </div>

                            </div>
                        </div>

                        <!-- BOTONES INSTAGRAM STORY & DESCARGA (ESTILO CLEAN WHITE) -->
                        <div style="display: flex; flex-direction: column; width: 100%; max-width: 320px; gap: 8px; margin-top: 14px;">
                            ${isNotMe ? `
                            <button onclick="if (window.PadelFutCard && typeof window.PadelFutCard.openChatWithThisPlayer === 'function') { window.PadelFutCard.openChatWithThisPlayer(); } else if (typeof window.openDirectChatWithPlayer === 'function') { window.openDirectChatWithPlayer('${data.userId}'); }" style="
                                background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
                                border: none; color: #ffffff;
                                padding: 12px; border-radius: 14px; font-weight: 950; font-size: 0.8rem;
                                text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 8px;
                                box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); transition: all 0.2s;
                            " onmouseover="this.style.background='#0369a1';" onmouseout="this.style.background='linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';">
                                <i class="fas fa-comment-dots" style="font-size: 1rem; color: #7dd3fc;"></i>
                                <span>💬 ENVIAR MENSAJE PRIVADO</span>
                            </button>
                            ` : ''}

                            <button id="fut-share-story-btn" onclick="window.PadelFutCard.generateAndShareStory()" style="
                                background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
                                border: none; color: #ffffff;
                                padding: 13px; border-radius: 14px; font-weight: 950; font-size: 0.8rem;
                                text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 8px;
                                box-shadow: 0 4px 15px rgba(220,39,67,0.3);
                            ">
                                <i class="fab fa-instagram" style="font-size: 1.1rem;"></i>
                                <span>SUBIR A INSTAGRAM STORY (9:16)</span>
                            </button>

                            <button onclick="window.PadelFutCard.downloadStoryPNG()" style="
                                background: #f8fafc; border: 1.5px solid #cbd5e1;
                                color: #0f172a; padding: 11px; border-radius: 14px; font-weight: 900; font-size: 0.74rem;
                                text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.04);
                            ">
                                <i class="fas fa-download"></i> Guardar Imagen PNG HD
                            </button>
                        </div>
                    </div>

                    <!-- CONTENEDOR 2: ÚLTIMOS PARTIDOS (FONDO BLANCO Y LETRA NEGRA) -->
                    <div id="cotillear-tab-content-matches" style="width: 100%; display: none; flex-direction: column; gap: 10px;">
                        <div id="cotillear-matches-list" style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
                            <div style="text-align: center; padding: 35px 10px; color: #64748b;">
                                <i class="fas fa-circle-notch fa-spin" style="font-size: 1.5rem; color: #0284c7; margin-bottom: 8px;"></i>
                                <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">Cargando historial de partidos...</div>
                            </div>
                        </div>
                    </div>

                    <!-- CONTENEDOR 3: ESTADÍSTICAS (FONDO BLANCO Y LETRA NEGRA) -->
                    <div id="cotillear-tab-content-stats" style="width: 100%; display: none; flex-direction: column; gap: 12px;">
                        <div id="cotillear-stats-container" style="width: 100%;">
                            <!-- Se renderiza dinámicamente con fondo blanco -->
                        </div>
                    </div>

                </div>
            `;

            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });

            // Cargar datos en segundo plano
            this._loadPlayerHistory(data.userId);
        },

        /**
         * Cambia de pestaña activa adaptando el estilo fondo blanco / botón negro
         * @param {'card'|'matches'|'stats'} tabName 
         */
        switchTab(tabName) {
            this.currentTab = tabName;
            const tabs = ['card', 'matches', 'stats'];

            tabs.forEach(t => {
                const btn = document.getElementById(`cotillear-tab-btn-${t}`);
                const content = document.getElementById(`cotillear-tab-content-${t}`);
                if (!btn || !content) return;

                if (t === tabName) {
                    btn.style.background = '#0f172a';
                    btn.style.color = '#ffffff';
                    btn.style.fontWeight = '950';
                    btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                    content.style.display = 'flex';
                } else {
                    btn.style.background = 'transparent';
                    btn.style.color = '#64748b';
                    btn.style.fontWeight = '850';
                    btn.style.boxShadow = 'none';
                    content.style.display = 'none';
                }
            });
        },

        /**
         * Carga los partidos y estadísticas del jugador con fondo blanco y letra negra
         */
        async _loadPlayerHistory(userId) {
            const matchesContainer = document.getElementById('cotillear-matches-list');
            const statsContainer = document.getElementById('cotillear-stats-container');

            try {
                let historyData = null;

                if (window.PlayerHistoryService && typeof window.PlayerHistoryService.getPlayerRecentMatches === 'function') {
                    historyData = await window.PlayerHistoryService.getPlayerRecentMatches(userId, 15);
                }

                const matches = historyData?.matches || [];
                const stats = historyData?.stats || {
                    totalMatches: matches.length,
                    wins: matches.filter(m => m.isWin).length,
                    losses: matches.filter(m => m.result === 'lost').length,
                    winRate: this.currentData.winRate
                };

                // 1. Renderizar Partidos (Fondo blanco, tarjetas limpias, letra negra)
                if (matchesContainer) {
                    if (matches.length === 0) {
                        matchesContainer.innerHTML = `
                            <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 18px; padding: 30px 15px; text-align: center;">
                                <div style="font-size: 2rem; margin-bottom: 6px;">🎾</div>
                                <div style="font-size: 0.9rem; font-weight: 950; color: #0f172a;">Sin partidos registrados todavía</div>
                                <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px; line-height: 1.4;">Los resultados y marcadores oficiales de entrenos y americanas aparecerán aquí.</div>
                            </div>
                        `;
                    } else {
                        matchesContainer.innerHTML = matches.map(m => {
                            const isVictory = m.isWin;
                            const isLoss = m.result === 'lost';
                            const isTie = m.result === 'tied';

                            // Configuración de colores con fuerte diferenciación Verde / Rojo
                            let cardBg = '#f8fafc';
                            let cardBorder = '#e2e8f0';
                            let cardBorderLeft = '6px solid #64748b';
                            let badgeBg = '#475569';
                            let badgeColor = '#ffffff';
                            let badgeText = m.resultLabel || 'EN JUEGO';
                            let icon = '⏱️';
                            let headerColor = '#64748b';
                            let contentBg = '#ffffff';
                            let contentBorder = '#e2e8f0';
                            let scoreBg = '#0f172a';
                            let scoreColor = '#ffffff';
                            let labelPartnerColor = '#64748b';
                            let subtextColor = '#64748b';

                            if (isVictory) {
                                cardBg = '#f0fdf4'; // Verde menta limpio
                                cardBorder = '#86efac'; // Verde pastel
                                cardBorderLeft = '6px solid #16a34a'; // Verde intenso
                                badgeBg = '#16a34a';
                                badgeColor = '#ffffff';
                                badgeText = 'VICTORIA';
                                icon = '🏆';
                                headerColor = '#15803d';
                                contentBg = '#ffffff';
                                contentBorder = '#bbf7d0';
                                scoreBg = '#16a34a';
                                scoreColor = '#ffffff';
                                labelPartnerColor = '#166534';
                                subtextColor = '#166534';
                            } else if (isLoss) {
                                cardBg = '#fef2f2'; // Rojo suave limpio
                                cardBorder = '#fca5a5'; // Rojo pastel
                                cardBorderLeft = '6px solid #dc2626'; // Rojo intenso
                                badgeBg = '#dc2626';
                                badgeColor = '#ffffff';
                                badgeText = 'DERROTA';
                                icon = '📉';
                                headerColor = '#b91c1c';
                                contentBg = '#ffffff';
                                contentBorder = '#fecaca';
                                scoreBg = '#dc2626';
                                scoreColor = '#ffffff';
                                labelPartnerColor = '#991b1b';
                                subtextColor = '#991b1b';
                            } else if (isTie) {
                                cardBg = '#fffbeb';
                                cardBorder = '#fde68a';
                                cardBorderLeft = '6px solid #d97706';
                                badgeBg = '#d97706';
                                badgeColor = '#ffffff';
                                badgeText = 'EMPATE';
                                icon = '🤝';
                                headerColor = '#b45309';
                                contentBg = '#ffffff';
                                contentBorder = '#fef3c7';
                                scoreBg = '#d97706';
                                scoreColor = '#ffffff';
                                labelPartnerColor = '#92400e';
                                subtextColor = '#92400e';
                            }

                            return `
                                <div style="background: ${cardBg}; border: 1.5px solid ${cardBorder}; border-left: ${cardBorderLeft}; border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 9px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.15s ease;">
                                    
                                    <!-- Fila Superior: Badge resultado + Evento y Pista -->
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 11px; border-radius: 8px; font-size: 0.68rem; font-weight: 950; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
                                            <span>${icon}</span>
                                            <span>${badgeText}</span>
                                        </div>
                                        <div style="font-size: 0.70rem; color: ${headerColor}; font-weight: 900;">
                                            🎾 PISTA ${m.court} • R${m.round} • ${m.dateStr}
                                        </div>
                                    </div>

                                    <!-- Fila Central: Marcador y Parejas -->
                                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: ${contentBg}; border: 1.5px solid ${contentBorder}; padding: 10px 12px; border-radius: 12px;">
                                        <div style="flex: 1; min-width: 0;">
                                            <div style="font-size: 0.58rem; color: ${labelPartnerColor}; font-weight: 950; text-transform: uppercase;">SU COMPAÑERO:</div>
                                            <div style="font-size: 0.84rem; font-weight: 950; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                ${m.partnerName}
                                            </div>
                                        </div>

                                        <!-- Marcador Destacado con Color del Resultado -->
                                        <div style="background: ${scoreBg}; color: ${scoreColor}; padding: 5px 12px; border-radius: 10px; font-size: 1.15rem; font-weight: 950; letter-spacing: 1px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                            ${m.scoreDisplay}
                                        </div>

                                        <div style="flex: 1; min-width: 0; text-align: right;">
                                            <div style="font-size: 0.58rem; color: #64748b; font-weight: 900; text-transform: uppercase;">RIVALES:</div>
                                            <div style="font-size: 0.80rem; font-weight: 850; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                ${m.rivalNamesStr}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Subtexto Evento -->
                                    <div style="font-size: 0.64rem; color: ${subtextColor}; font-weight: 850; text-transform: uppercase; letter-spacing: 0.5px;">
                                        ${m.eventName} • ${m.eventType}
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                }

                // 2. Renderizar Estadísticas (Fondo blanco, verde victorias y rojo derrotas)
                if (statsContainer) {
                    const winRate = stats.winRate !== undefined ? stats.winRate : this.currentData.winRate;
                    const totalMatches = stats.totalMatches || (stats.wins + stats.losses) || this.currentData.matchesCount;
                    const wins = stats.wins !== undefined ? stats.wins : Math.round(totalMatches * (winRate / 100));
                    const losses = stats.losses !== undefined ? stats.losses : (totalMatches - wins);
                    const streakText = stats.streakText || '🔥 2V';

                    statsContainer.innerHTML = `
                        <!-- Grid KPIs con diferenciación Verde / Rojo -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; text-align: center;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">PARTIDOS JUGADOS</div>
                                <div style="font-size: 2.1rem; font-weight: 950; color: #0f172a; margin-top: 2px;">${totalMatches}</div>
                            </div>
                            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                                    <div style="font-size: 0.60rem; color: #166534; font-weight: 950;">VICTORIAS</div>
                                    <div style="font-size: 1.6rem; font-weight: 950; color: #16a34a; line-height: 1.1; margin-top: 2px;">${wins}</div>
                                </div>
                                <div style="background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                                    <div style="font-size: 0.60rem; color: #991b1b; font-weight: 950;">DERROTAS</div>
                                    <div style="font-size: 1.6rem; font-weight: 950; color: #dc2626; line-height: 1.1; margin-top: 2px;">${losses}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Win Rate Progress Bar -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 0.72rem; color: #475569; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">EFECTIVIDAD (WIN RATE)</span>
                                <span style="font-size: 1.15rem; color: #0f172a; font-weight: 950;">${winRate}%</span>
                            </div>
                            <div style="width: 100%; height: 9px; background: #e2e8f0; border-radius: 99px; overflow: hidden; display: flex;">
                                <div style="width: ${winRate}%; height: 100%; background: linear-gradient(90deg, #059669, #10b981); border-radius: 99px;"></div>
                            </div>
                        </div>

                        <!-- Fila Información Adicional -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                                <span style="font-size: 0.75rem; color: #64748b; font-weight: 800;">Racha Competitiva:</span>
                                <span style="font-size: 0.88rem; font-weight: 950; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">${streakText}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                                <span style="font-size: 0.75rem; color: #64748b; font-weight: 800;">Lado Habitual:</span>
                                <span style="font-size: 0.82rem; font-weight: 950; color: #0f172a;">${this.currentData.positionFull}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.75rem; color: #64748b; font-weight: 800;">Club / Liga:</span>
                                <span style="font-size: 0.82rem; font-weight: 950; color: #0284c7;">${this.currentData.team}</span>
                            </div>
                        </div>
                    `;
                }

            } catch (err) {
                console.error("❌ Error cargando historial en PadelFutCard:", err);
                if (matchesContainer) {
                    matchesContainer.innerHTML = '<div style="color: #dc2626; font-size: 0.75rem; text-align: center; padding: 15px;">Error al cargar partidos recientes.</div>';
                }
            }
        },

        /**
         * Renderiza la Story en un Canvas nativo 9:16 (1080x1920)
         * @returns {Promise<HTMLCanvasElement>}
         */
        async renderStoryCanvas(data = this.currentData) {
            data = data || this.currentData || this.calculateCardData();
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');

            // 1. Fondo Degradado Neón Sombre
            const bgGrad = ctx.createRadialGradient(540, 700, 100, 540, 960, 1100);
            bgGrad.addColorStop(0, '#151d2f');
            bgGrad.addColorStop(0.5, '#090c15');
            bgGrad.addColorStop(1, '#040508');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1080, 1920);

            // 2. Líneas Decorativas de Pista de Pádel en el fondo
            ctx.save();
            ctx.strokeStyle = 'rgba(204, 255, 0, 0.05)';
            ctx.lineWidth = 4;
            ctx.strokeRect(100, 180, 880, 1560);
            ctx.beginPath();
            ctx.moveTo(100, 960);
            ctx.lineTo(980, 960);
            ctx.moveTo(540, 480);
            ctx.lineTo(540, 1440);
            ctx.stroke();
            ctx.restore();

            // 3. Glow Neón en el centro
            const glow = ctx.createRadialGradient(540, 860, 10, 540, 860, 500);
            glow.addColorStop(0, 'rgba(204, 255, 0, 0.15)');
            glow.addColorStop(0.6, 'rgba(0, 229, 255, 0.05)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 300, 1080, 1200);

            // 4. Header de la Story
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 36px "Outfit", sans-serif';
            ctx.letterSpacing = '8px';
            ctx.fillText('SOMOSPADEL BCN', 540, 190);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '950 64px "Outfit", sans-serif';
            ctx.fillText('¡CARTA OFICIAL EN PISTA!', 540, 270);

            const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
            ctx.fillStyle = '#94A3B8';
            ctx.font = '800 28px "Outfit", sans-serif';
            ctx.fillText(dateStr, 540, 325);
            ctx.restore();

            // 5. CARTA FUT DIBUJADA EN CANVAS
            const cx = 190, cy = 390, cw = 700, ch = 1060, radius = 54;
            
            function roundRect(ctx, x, y, width, height, r) {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + width - r, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + r);
                ctx.lineTo(x + width, y + height - r);
                ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
                ctx.lineTo(x + r, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
            }

            ctx.save();
            const borderGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
            borderGrad.addColorStop(0, '#CCFF00');
            borderGrad.addColorStop(0.5, '#00E5FF');
            borderGrad.addColorStop(1, '#FF0055');
            ctx.strokeStyle = borderGrad;
            ctx.lineWidth = 10;
            ctx.shadowColor = 'rgba(204, 255, 0, 0.4)';
            ctx.shadowBlur = 40;
            roundRect(ctx, cx, cy, cw, ch, radius);
            ctx.stroke();

            const cardInnerGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
            cardInnerGrad.addColorStop(0, '#161c2d');
            cardInnerGrad.addColorStop(0.6, '#0d111d');
            cardInnerGrad.addColorStop(1, '#11190d');
            ctx.fillStyle = cardInnerGrad;
            ctx.fill();
            ctx.restore();

            // OVR y Posición
            ctx.save();
            ctx.textAlign = 'left';
            ctx.fillStyle = '#CCFF00';
            ctx.font = '950 110px "Outfit", sans-serif';
            ctx.shadowColor = 'rgba(204,255,0,0.5)';
            ctx.shadowBlur = 25;
            ctx.fillText(String(data.ovr), cx + 55, cy + 155);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 40px "Outfit", sans-serif';
            ctx.fillText(data.position, cx + 60, cy + 215);

            ctx.strokeStyle = '#CCFF00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx + 60, cy + 240);
            ctx.lineTo(cx + 120, cy + 240);
            ctx.stroke();

            ctx.font = '34px sans-serif';
            ctx.fillText('🎾', cx + 60, cy + 295);
            ctx.fillText('🇪🇸', cx + 60, cy + 345);
            ctx.restore();

            // Foto
            try {
                const img = await this._loadImage(data.photoUrl);
                ctx.save();
                const imgX = cx + 240, imgY = cy + 50, imgW = 410, imgH = 460, imgR = 40;
                roundRect(ctx, imgX, imgY, imgW, imgH, imgR);
                ctx.clip();
                ctx.drawImage(img, imgX, imgY, imgW, imgH);
                ctx.restore();
            } catch (e) {
                ctx.save();
                ctx.fillStyle = '#1e293b';
                roundRect(ctx, cx + 240, cy + 50, 410, 460, 40);
                ctx.fill();
                ctx.fillStyle = '#CCFF00';
                ctx.font = '950 120px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(data.name.substring(0, 1), cx + 445, cy + 310);
                ctx.restore();
            }

            // Nombre
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '950 56px "Outfit", sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.fillText(data.name, cx + (cw / 2), cy + 570);

            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 28px "Outfit", sans-serif';
            ctx.fillText(`${data.cardTier} • NIVEL ${data.level} • WIN RATE ${data.winRate}%`, cx + (cw / 2), cy + 620);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 60, cy + 655);
            ctx.lineTo(cx + cw - 60, cy + 655);
            ctx.stroke();
            ctx.restore();

            // Atributos
            ctx.save();
            const col1X = cx + 90, col2X = cx + 390;
            const startY = cy + 735, gapY = 85;

            const drawAttr = (x, y, val, label, highlight = false) => {
                ctx.textAlign = 'left';
                ctx.fillStyle = highlight ? '#CCFF00' : '#FFFFFF';
                ctx.font = '950 48px "Outfit", sans-serif';
                ctx.fillText(String(val), x, y);

                ctx.fillStyle = '#94A3B8';
                ctx.font = '800 32px "Outfit", sans-serif';
                ctx.fillText(label, x + 85, y - 4);
            };

            drawAttr(col1X, startY, data.attributes.REM, 'REM');
            drawAttr(col1X, startY + gapY, data.attributes.VOL, 'VOL');
            drawAttr(col1X, startY + gapY * 2, data.attributes.DEF, 'DEF');

            drawAttr(col2X, startY, data.attributes.FIS, 'FIS');
            drawAttr(col2X, startY + gapY, data.attributes.TAC, 'TAC');
            drawAttr(col2X, startY + gapY * 2, data.attributes.CLU, 'CLU', true);
            ctx.restore();

            // Sello inferior
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 36px "Outfit", sans-serif';
            ctx.fillText('SOMOSPADEL APP • RESULTADO VERIFICADO', 540, 1540);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 28px "Outfit", sans-serif';
            ctx.fillText('Comparte tu progreso con #SomosPadelBCN', 540, 1595);

            ctx.strokeStyle = 'rgba(204, 255, 0, 0.4)';
            ctx.lineWidth = 3;
            roundRect(ctx, 340, 1640, 400, 75, 25);
            ctx.stroke();

            ctx.fillStyle = '#CCFF00';
            ctx.font = '950 30px "Outfit", sans-serif';
            ctx.fillText('📸 @somospadelbarcelona_', 540, 1688);
            ctx.restore();

            return canvas;
        },

        _loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
                img.src = src;
            });
        },

        /**
         * Comparte la Story en Instagram
         */
        async generateAndShareStory() {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(25);
            const btn = document.getElementById('fut-share-story-btn');
            const originalText = btn ? btn.innerHTML : '';
            if (btn) {
                btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generando Story HD...';
                btn.disabled = true;
            }

            const shareMention = 'Mi Carta Oficial en @somospadelbarcelona_ 🎾 #SomosPadelBCN';
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(shareMention);
                }
            } catch (e) {}

            try {
                const canvas = await this.renderStoryCanvas();
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        this.downloadStoryPNG();
                        return;
                    }
                    const playerName = (this.currentData?.name || 'jugador').replace(/\s+/g, '_');
                    const file = new File([blob], `carta_fut_${playerName}_${Date.now()}.png`, { type: 'image/png' });

                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                title: '¡Mi Carta Oficial en SomosPadel BCN! 🎾',
                                text: 'Mi Carta Oficial en @somospadelbarcelona_ 🎾 #SomosPadelBCN',
                                files: [file]
                            });
                        } catch (shareErr) {
                            console.log('Share cancelado:', shareErr);
                        }
                    } else {
                        this._triggerDownload(blob);
                        if (confirm('✅ ¡Tu Carta FUT HD se ha descargado a tu galería!\n\n¿Quieres abrir Instagram ahora para subirla a tu Historia? (La mención @somospadelbarcelona_ ya está copiada al portapapeles)')) {
                            if (window.SocialChannelsService) {
                                window.SocialChannelsService.openInstagram();
                            } else {
                                window.open('https://www.instagram.com/somospadelbarcelona_/?hl=es', '_blank');
                            }
                        }
                    }

                    if (btn) {
                        btn.innerHTML = '✅ ¡Listo!';
                        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
                    }
                }, 'image/png');

            } catch (err) {
                console.error('Error sharing story:', err);
                this.downloadStoryPNG();
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        },

        /**
         * Descarga directa en formato PNG
         */
        async downloadStoryPNG() {
            try {
                const canvas = await this.renderStoryCanvas();
                canvas.toBlob((blob) => {
                    this._triggerDownload(blob);
                }, 'image/png');
            } catch (err) {
                console.error('Error generating download:', err);
                alert('Error al generar la imagen para descargar.');
            }
        },

        _triggerDownload(blob) {
            const link = document.createElement('a');
            link.download = `story_somospadel_${Date.now()}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 3000);
        }
    };

    window.PadelFutCard = PadelFutCard;
    console.log('🎴 [PadelFutCard] Clean White v2026 cargado.');
})();
