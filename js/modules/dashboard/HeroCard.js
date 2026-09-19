/**
 * HeroCard.js
 * Componente principal que muestra la información más importante para el jugador
 * Se adapta según el contexto: próximo partido, inscripción, victoria, etc.
 */
(function () {
    class HeroCard {
        /**
         * Renderiza la Hero Card según el contexto del jugador
         * @param {Object} context - Contexto del jugador
         * @returns {string} HTML de la Hero Card
         */
        static render(context) {
            if (!context) return '';

            // Prioridad de renderizado
            if (context.hasMatchToday) {
                return this.renderUpcomingMatch(context);
            } else if (context.hasRecentVictory) {
                return this.renderVictoryCelebration(context);
            } else if (context.hasMatchThisWeek) {
                return this.renderWeekPreview(context);
            } else {
                return this.renderEmptyIcon(context);
            }
        }

        /**
         * Partido próximo (HOY) - Versión Ultra Compacta, Llamativa e Interactiva
         */
        static renderUpcomingMatch(ctx) {
            const timeUntil = this.getTimeUntil(ctx.matchTime);
            const urgencyClass = timeUntil < 60 ? 'urgent' : timeUntil < 180 ? 'soon' : 'today';
            const accentColor = urgencyClass === 'urgent' ? '#ef4444' : urgencyClass === 'soon' ? '#f59e0b' : '#10b981';
            const accentGradient = urgencyClass === 'urgent' 
                ? 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)' 
                : urgencyClass === 'soon' 
                ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

            const badgeText = urgencyClass === 'urgent'
                ? (timeUntil <= 0 ? '⚡ ¡ENTRAS EN PISTA YA!' : `⚡ ¡A PISTA EN ${timeUntil} MIN!`)
                : urgencyClass === 'soon'
                ? `🔥 ENTRAS EN ${timeUntil} MIN`
                : `🎾 TU PARTIDO DE HOY`;

            return `
                <div class="hero-card-upcoming-compact fade-in" style="
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-left: 4px solid ${accentColor};
                    border-radius: 18px;
                    padding: 12px 14px;
                    margin: 0 0 14px 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 8px 24px -4px ${accentColor}25, 0 2px 6px rgba(0,0,0,0.03);
                    position: relative;
                    overflow: hidden;
                    font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 28px -4px ${accentColor}35, 0 4px 10px rgba(0,0,0,0.05)';"
                   onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 24px -4px ${accentColor}25, 0 2px 6px rgba(0,0,0,0.03)';">

                    <style>
                        @keyframes heroBadgePulse {
                            0%, 100% { transform: scale(1); filter: brightness(1); }
                            50% { transform: scale(1.02); filter: brightness(1.12); }
                        }
                        @keyframes heroShimmerAnim {
                            0% { transform: translateX(-120%) skewX(-20deg); }
                            100% { transform: translateX(250%) skewX(-20deg); }
                        }
                        .hero-shimmer-btn {
                            position: relative;
                            overflow: hidden;
                        }
                        .hero-shimmer-btn::after {
                            content: '';
                            position: absolute;
                            top: 0; left: 0; width: 60%; height: 100%;
                            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
                            transform: skewX(-20deg);
                            animation: heroShimmerAnim 2.8s infinite;
                        }
                    </style>

                    <!-- Glow de fondo decorativo -->
                    <div style="position: absolute; top: -35px; right: -35px; width: 120px; height: 120px; background: radial-gradient(circle, ${accentColor}18 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

                    <!-- Fila 1: Badges superiores (Cuenta atrás + Pista) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 2;">
                        <div style="
                            background: ${accentGradient};
                            color: #ffffff;
                            font-size: 0.65rem;
                            font-weight: 900;
                            padding: 4px 10px;
                            border-radius: 8px;
                            letter-spacing: 0.6px;
                            text-transform: uppercase;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                            box-shadow: 0 3px 10px ${accentColor}40;
                            ${urgencyClass === 'urgent' ? 'animation: heroBadgePulse 1.8s infinite ease-in-out;' : ''}
                        ">
                            ${badgeText}
                        </div>

                        <!-- Badge Pista -->
                        <div style="
                            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            border-radius: 9px;
                            padding: 3px 9px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                        ">
                            <span style="font-size: 0.58rem; font-weight: 850; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">PISTA</span>
                            <span style="font-size: 1.05rem; font-weight: 950; color: ${accentColor}; line-height: 1;">${ctx.court || '?'}</span>
                        </div>
                    </div>

                    <!-- Fila 2: Hora destacada y Fecha/Ronda -->
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; position: relative; z-index: 2;">
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <div style="
                                font-size: 1.85rem;
                                font-weight: 950;
                                color: #0f172a;
                                line-height: 1;
                                letter-spacing: -0.8px;
                                font-family: 'Outfit', sans-serif;
                            ">
                                ${ctx.matchTime || '10:00'}
                            </div>
                            <div style="
                                font-size: 0.76rem;
                                font-weight: 750;
                                color: #64748b;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                <span style="color: #0f172a; font-weight: 900;">HOY</span>
                                <span style="opacity: 0.4;">•</span>
                                <span>${ctx.matchDay || 'Partido'}</span>
                                ${ctx.round ? `<span style="opacity: 0.4;">•</span><span style="background: rgba(15,23,42,0.06); padding: 1px 6px; border-radius: 5px; font-size: 0.68rem; font-weight: 800; color: #334155;">R${ctx.round}</span>` : ''}
                            </div>
                        </div>

                        ${ctx.matchType ? `
                            <span style="
                                font-size: 0.64rem;
                                font-weight: 850;
                                color: #64748b;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                background: rgba(0,0,0,0.04);
                                padding: 2px 7px;
                                border-radius: 6px;
                            ">
                                ${ctx.matchType === 'entreno' ? 'Pozo' : 'Americana'}
                            </span>
                        ` : ''}
                    </div>

                    <!-- Fila 3: Pareja vs Rivales (Ultra-compacto, estructurado y claro) -->
                    <div style="
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 7px 9px;
                        margin-bottom: 10px;
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.02);
                        position: relative;
                        z-index: 2;
                    ">
                        <!-- Fila Compañero -->
                        <div style="display: flex; align-items: center; gap: 7px; min-width: 0;">
                            <div style="
                                width: 22px;
                                height: 22px;
                                border-radius: 7px;
                                background: #eff6ff;
                                border: 1px solid #bfdbfe;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.75rem;
                                flex-shrink: 0;
                            ">🤝</div>
                            <div style="min-width: 0; flex: 1; display: flex; align-items: baseline; gap: 6px; overflow: hidden;">
                                <span style="font-size: 0.58rem; font-weight: 850; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;">COMPAÑERO</span>
                                <span style="
                                    font-size: 0.80rem;
                                    font-weight: 900;
                                    color: #0f172a;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                " title="${ctx.partner || 'Por asignar'}">${ctx.partner || 'Por asignar'}</span>
                            </div>
                        </div>

                        <div style="height: 1px; background: #f1f5f9; margin: 0 2px;"></div>

                        <!-- Fila Rivales -->
                        <div style="display: flex; align-items: center; gap: 7px; min-width: 0;">
                            <div style="
                                width: 22px;
                                height: 22px;
                                border-radius: 7px;
                                background: #fff1f2;
                                border: 1px solid #fecdd3;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.75rem;
                                flex-shrink: 0;
                            ">⚔️</div>
                            <div style="min-width: 0; flex: 1; display: flex; align-items: baseline; gap: 6px; overflow: hidden;">
                                <span style="font-size: 0.58rem; font-weight: 850; color: #e11d48; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;">RIVALES</span>
                                <span style="
                                    font-size: 0.80rem;
                                    font-weight: 900;
                                    color: #0f172a;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                " title="${ctx.opponents || 'Por asignar'}">${ctx.opponents || 'Por asignar'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Fila 4: Botones de Acción Interactivos -->
                    <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 8px; position: relative; z-index: 2;">
                        <button 
                            type="button"
                            onclick="window.PlayerView?.haptic?.(10); Router.navigate('live')" 
                            style="
                                background: #ffffff;
                                border: 1.5px solid #e2e8f0;
                                color: #334155;
                                padding: 8px 10px;
                                border-radius: 11px;
                                font-weight: 850;
                                font-size: 0.74rem;
                                cursor: pointer;
                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                            " 
                            onmouseover="this.style.borderColor='#3b82f6'; this.style.color='#1d4ed8'; this.style.transform='translateY(-1px)';" 
                            onmouseout="this.style.borderColor='#e2e8f0'; this.style.color='#334155'; this.style.transform='none';"
                        >
                            <i class="fas fa-eye" style="font-size: 0.72rem; opacity: 0.7;"></i>
                            <span>Detalles</span>
                        </button>

                        <button 
                            type="button"
                            ${ctx.confirmed ? 'disabled' : ''} 
                            onclick="window.PlayerView?.haptic?.(20); HeroCardActions.confirmAttendance('${ctx.matchId || ''}', '${ctx.matchType || ''}')" 
                            class="${ctx.confirmed ? '' : 'hero-shimmer-btn'}"
                            style="
                                background: ${ctx.confirmed ? '#dcfce7' : accentGradient};
                                border: ${ctx.confirmed ? '1.5px solid #86efac' : 'none'};
                                color: ${ctx.confirmed ? '#166534' : '#ffffff'};
                                padding: 8px 12px;
                                border-radius: 11px;
                                font-weight: 950;
                                font-size: 0.74rem;
                                cursor: ${ctx.confirmed ? 'default' : 'pointer'};
                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                text-transform: uppercase;
                                letter-spacing: 0.6px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                ${ctx.confirmed ? 'box-shadow: 0 1px 4px rgba(34, 197, 94, 0.15);' : `box-shadow: 0 4px 14px ${accentColor}50;`}
                            " 
                            ${ctx.confirmed ? '' : `onmouseover="this.style.transform='translateY(-1px) scale(1.02)'; this.style.boxShadow='0 6px 18px ${accentColor}70';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 14px ${accentColor}50';"`}
                        >
                            <i class="fas ${ctx.confirmed ? 'fa-check-circle' : 'fa-bolt'}" style="font-size: 0.75rem;"></i>
                            <span>${ctx.confirmed ? 'Confirmado' : 'Confirmar'}</span>
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Celebración de victoria
         */
        static renderVictoryCelebration(ctx) {
            return `
                <div class="hero-card victory fade-in" style="
                    background: #ffffff;
                    border-left: 5px solid #34C759;
                    border-radius: 24px;
                    padding: 32px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 10rem; opacity: 0.05; transform: rotate(15deg);">🏆</div>
                    
                    <div style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 3.5rem; margin-bottom: 12px; animation: bounce 1s infinite alternate;">🔥</div>
                        <div style="font-size: 1rem; font-weight: 800; color: #34C759; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase;">
                            ¡VICTORIA ÉPICA!
                        </div>
                        <div style="font-size: 4rem; font-weight: 950; color: #0a192f; margin-bottom: 15px; line-height: 1; letter-spacing: -2px;">
                            ${ctx.scoreA} <span style="font-size: 2rem; opacity: 0.3;">-</span> ${ctx.scoreB}
                        </div>
                        <div style="font-size: 1rem; color: #94a3b8; font-weight: 700; margin-bottom: 25px;">
                            vs ${ctx.opponents}
                        </div>
                        
                        <div style="background: rgba(52,199,89,0.1); border: 1px solid rgba(52,199,89,0.3); color: #34C759; padding: 12px 20px; border-radius: 16px; font-size: 0.85rem; font-weight: 800; margin-bottom: 30px; display: inline-flex; align-items: center; gap: 10px;">
                            <i class="fas fa-arrow-up"></i> +${ctx.pointsEarned || 3} PTS • RÁNKING #${ctx.newRank}
                        </div>

                        <button onclick="Router.navigate('live')" style="
                            background: #34C759;
                            border: none;
                            color: black;
                            padding: 18px 30px;
                            border-radius: 16px;
                            font-weight: 900;
                            font-size: 0.9rem;
                            cursor: pointer;
                            width: 100%;
                            box-shadow: 0 10px 25px rgba(52,199,89,0.4);
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        ">
                            Ver Análisis del Partido
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Inscripción a torneo abierto
         */
        static renderTournamentInscription(ctx) {
            const max = ctx.maxPlayers || 24;
            const current = ctx.currentPlayers || 0;
            const spotsLeft = Math.max(0, max - current);
            const isUrgent = spotsLeft < 5;
            const activeColor = isUrgent ? '#FF2D55' : '#CCFF00';

            return `
                <div class="hero-card fade-in" onclick="HeroCardActions.enrollTournament('${ctx.tournamentId}')" style="
                    background: #ffffff;
                    border: 2px solid ${activeColor};
                    border-radius: 24px;
                    padding: 0;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    animation: borderFlash 2s infinite;
                ">
                    <style>
                        @keyframes borderFlash {
                            0% { box-shadow: 0 0 10px ${activeColor}20; border-color: ${activeColor}80; }
                            50% { box-shadow: 0 0 30px ${activeColor}60; border-color: ${activeColor}; transform: scale(1.005); }
                            100% { box-shadow: 0 0 10px ${activeColor}20; border-color: ${activeColor}80; }
                        }
                    </style>

                    <!-- Background abstract art -->
                    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, ${activeColor}20 0%, transparent 70%); filter: blur(30px);"></div>
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(45deg, ${activeColor}05, ${activeColor}05 10px, transparent 10px, transparent 20px);"></div>
                    
                    <div style="padding: 24px; position: relative; z-index: 2;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                             <div style="
                                background: ${activeColor}; color: #000; 
                                font-size: 0.65rem; font-weight: 950; 
                                padding: 5px 12px; border-radius: 8px; 
                                text-transform: uppercase; letter-spacing: 1px;
                                box-shadow: 0 4px 15px ${activeColor}50;
                                animation: pulse 1s infinite;
                             ">
                                ${isUrgent ? '🔥 ¡ÚLTIMAS PLAZAS!' : '🚀 INSCRIPCIÓN ABIERTA'}
                             </div>
                             <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🏆</div>
                        </div>

                        <h2 style="color: #0a192f; font-weight: 950; font-size: 1.6rem; margin: 0 0 5px 0; line-height: 1;">
                            ${ctx.tournamentName || 'AMERICANA OPEN'}
                        </h2>
                         <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 700; margin-bottom: 25px; display: flex; align-items: center; gap: 8px;">
                             <i class="far fa-clock"></i> ${ctx.tournamentDate} • ${ctx.tournamentTime}
                        </div>

                        <!-- Progress Bar for Spots -->
                        <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="
                                width: ${(current / max) * 100}%; 
                                height: 100%; 
                                background: ${activeColor};
                                box-shadow: 0 0 15px ${activeColor};
                                transition: width 1s ease-out;
                            "></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: #64748b;">
                            <span style="color: #cbd5e1;">${current}/${max} inscritos</span>
                            <span style="color: ${activeColor}; font-weight: 900;">Quedan ${spotsLeft}</span>
                        </div>
                    </div>
                    
                    <!-- Bottom Action Strip -->
                    <div style="background: ${activeColor}; padding: 14px; text-align: center; margin-top: 5px;">
                        <span style="color: #000; font-weight: 950; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">
                            PULSA PARA UNIRTE <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                        </span>
                    </div>
                </div>
            `;
        }

        /**
         * Vista previa de la semana (Ultra compacta, visual e interactiva)
         */
        static renderWeekPreview(ctx) {
            const matchesCount = ctx.upcomingMatches || 1;
            const matchTitle = ctx.tournamentName || ctx.eventName || 'Evento de Pádel';
            const timeStr = ctx.matchTime || '18:00';
            const dayStr = ctx.matchDay || 'Próximo';
            
            // Extraer formato corto de día (ej: "Dom 20/9" o fecha limpia)
            let shortDay = dayStr;
            if (dayStr.toLowerCase().includes('próximo:')) {
                shortDay = dayStr.split(':')[1]?.trim() || dayStr;
            }

            return `
                <div class="hero-card-week-compact fade-in" style="
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border: 1px solid rgba(59, 130, 246, 0.22);
                    border-left: 4px solid #3b82f6;
                    border-radius: 18px;
                    padding: 12px 14px;
                    margin: 0 0 14px 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 8px 24px -4px rgba(59, 130, 246, 0.10), 0 2px 6px rgba(0,0,0,0.03);
                    position: relative;
                    overflow: hidden;
                    font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                ">
                    <!-- Glow de fondo estético -->
                    <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

                    <!-- Fila 1: Header Compacto con Badges -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 2;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="
                                background: #eff6ff;
                                color: #1d4ed8;
                                border: 1px solid #bfdbfe;
                                font-size: 0.62rem;
                                font-weight: 850;
                                padding: 2px 8px;
                                border-radius: 7px;
                                letter-spacing: 0.6px;
                                text-transform: uppercase;
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                            ">
                                <span style="font-size: 0.70rem;">📅</span> ESTA SEMANA
                            </span>
                        </div>
                        <div style="
                            background: rgba(59, 130, 246, 0.10);
                            color: #2563eb;
                            border: 1px solid rgba(59, 130, 246, 0.22);
                            font-size: 0.65rem;
                            font-weight: 900;
                            padding: 2px 8px;
                            border-radius: 7px;
                            letter-spacing: 0.4px;
                        ">
                            ⚡ ${matchesCount} ${matchesCount === 1 ? 'PARTIDO' : 'PARTIDOS'}
                        </div>
                    </div>

                    <!-- Fila 2: Ticket Interactivo de Partido (Click directo a Agenda) -->
                    <div 
                        onclick="window.PlayerView?.haptic?.(15); Router.navigate('agenda');"
                        title="Toca para ver la agenda y detalles del partido"
                        style="
                            display: grid;
                            grid-template-columns: auto 1fr auto;
                            align-items: center;
                            gap: 10px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 13px;
                            padding: 8px 10px;
                            cursor: pointer;
                            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                            position: relative;
                            z-index: 2;
                        "
                        onmouseover="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 4px 14px rgba(59,130,246,0.18)'; this.style.transform='translateY(-1px)';"
                        onmouseout="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.03)'; this.style.transform='none';"
                    >
                        <!-- Badge Ticket Fecha / Hora -->
                        <div style="
                            background: linear-gradient(135deg, #090e1a 0%, #1e293b 100%);
                            border: 1px solid rgba(59, 130, 246, 0.35);
                            border-radius: 9px;
                            padding: 4px 8px;
                            text-align: center;
                            min-width: 52px;
                            box-sizing: border-box;
                        ">
                            <div style="font-size: 0.58rem; font-weight: 900; color: #CCFF00; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1;">
                                ${shortDay}
                            </div>
                            <div style="font-size: 0.90rem; font-weight: 950; color: #ffffff; line-height: 1.1; margin-top: 2px;">
                                ${timeStr}
                            </div>
                        </div>

                        <!-- Detalles del Partido -->
                        <div style="min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                            <div style="
                                font-size: 0.84rem;
                                font-weight: 900;
                                color: #0f172a;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                line-height: 1.25;
                            ">
                                ${matchTitle}
                            </div>
                            <div style="
                                font-size: 0.70rem;
                                color: #64748b;
                                font-weight: 600;
                                margin-top: 2px;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">
                                <span style="color: #2563eb; font-weight: 750;">● Próximo</span>
                                <span>•</span>
                                <span>Ver convocatoria & pista</span>
                            </div>
                        </div>

                        <!-- Botón Acción Directa -->
                        <div style="
                            width: 32px;
                            height: 32px;
                            background: #3b82f6;
                            color: #ffffff;
                            border-radius: 9px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.75rem;
                            box-shadow: 0 3px 9px rgba(59, 130, 246, 0.35);
                            transition: transform 0.2s, background 0.2s;
                            flex-shrink: 0;
                        ">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Icono Flotante de Estado (Radar)
         * Reemplaza la tarjeta grande por un indicador discreto
         */
        static renderEmptyIcon(ctx) {
            return `
                <div onclick="window.Router.navigate('entrenos')" style="
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(59,130,246,0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 999;
                    backdrop-filter: blur(10px);
                    animation: floatUp 0.5s ease-out;
                    cursor: pointer;
                ">
                    <div style="font-size: 1.2rem; animation: pulse 3s infinite;">📡</div>
                    <!-- Badge Notification Dot -->
                    <div style="position: absolute; top: 0; right: 0; width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; border: 2px solid #0f172a;"></div>
                </div>
            `;
        }

        /**
         * Calcula tiempo hasta el partido en minutos
         */
        static getTimeUntil(matchTime) {
            if (!matchTime) return 0;
            try {
                const now = new Date();
                const [hours, minutes] = matchTime.split(':').map(Number);
                const matchDate = new Date();
                matchDate.setHours(hours, minutes, 0, 0);

                const diffMs = matchDate - now;
                const diffMins = Math.floor(diffMs / 60000);

                return Math.max(0, diffMins);
            } catch (e) {
                console.warn('Error calculating time until:', e);
                return 0;
            }
        }
    }

    // Acciones de la Hero Card
    window.HeroCardActions = {
        confirmAttendance: async (matchId, matchType) => {
            try {
                if (!matchId || matchId === 'undefined') {
                    if (window.Router) window.Router.navigate('live');
                    return;
                }
                const user = window.Store.getState('currentUser');
                if (!user) throw new Error("Debes iniciar sesión");

                const collectionName = (matchType === 'entreno') ? 'entrenos_matches' : 'matches';

                // Actualizar en Firestore: confirmations[userId] = true
                await window.db.collection(collectionName).doc(matchId).set({
                    confirmations: {
                        [user.uid || user.id]: true
                    }
                }, { merge: true });

                console.log('✅ Attendance confirmed for:', matchId);

                // Actualizar UI
                if (window.PremiumModal && window.PremiumModal.alert) {
                    window.PremiumModal.alert({
                        title: "✅ ASISTENCIA CONFIRMADA",
                        message: "¡Excelente! El capitán ya sabe que vienes. ¡A por todas! 🎾",
                        type: 'success'
                    });
                }

                // Recargar dashboard forzando actualización de contexto
                if (window.DashboardView && window.DashboardView.render) {
                    const data = window.Store.getState('dashboardData');
                    window.DashboardView.render(data);
                }
            } catch (e) {
                console.error('Error confirming:', e);
                if (window.PremiumModal && window.PremiumModal.alert) {
                    window.PremiumModal.alert({
                        title: "ERROR",
                        message: "No se pudo confirmar la asistencia. Inténtalo de nuevo.",
                        type: 'danger'
                    });
                }
            }
        },

        enrollTournament: async (tournamentId) => {
            try {
                console.log('Enrolling in tournament:', tournamentId);
                // Navegar a vista de entrenos (reemplaza americanas por petición del usuario)
                Router.navigate('entrenos');
            } catch (e) {
                console.error('Error enrolling:', e);
            }
        }
    };

    window.HeroCard = HeroCard;
    console.log('🎯 HeroCard Premium Component Loaded');
})();