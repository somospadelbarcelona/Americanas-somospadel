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
         * Partido próximo (HOY)
         */
        static renderUpcomingMatch(ctx) {
            const timeUntil = this.getTimeUntil(ctx.matchTime);
            const urgencyClass = timeUntil < 60 ? 'urgent' : timeUntil < 180 ? 'soon' : 'today';
            const accentColor = urgencyClass === 'urgent' ? '#FF2D55' : urgencyClass === 'soon' ? '#FF9500' : '#CCFF00';

            return `
                <div class="hero-card upcoming fade-in" style="
                    background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-left: 5px solid ${accentColor};
                    border-radius: 24px;
                    padding: 28px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${accentColor}20;
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Subtle Glow -->
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: radial-gradient(circle, ${accentColor}15 0%, transparent 70%); filter: blur(30px);"></div>

                    ${urgencyClass === 'urgent' ? `
                        <div style="background: #FF2D55; color: white; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 0.65rem; font-weight: 900; margin-bottom: 20px; letter-spacing: 1px; animation: pulse 2s infinite; border: 1px solid rgba(255,255,255,0.2);">
                            <i class="fas fa-bolt"></i> ¡ENTRAS EN PISTA EN ${timeUntil} MINUTOS!
                        </div>
                    ` : `
                        <div style="background: rgba(255,255,255,0.05); color: ${accentColor}; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; margin-bottom: 20px; letter-spacing: 1px; border: 1px solid ${accentColor}40;">
                            <i class="far fa-calendar-check"></i> TU PRÓXIMO PARTIDO
                        </div>
                    `}
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
                        <div>
                            <div style="font-size: 2.2rem; font-weight: 950; color: white; line-height: 1; margin-bottom: 6px; letter-spacing: -1px;">
                                ${ctx.matchTime}
                            </div>
                            <div style="font-size: 1rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                <span style="color: white; opacity: 0.6;">HOY</span> • ${ctx.matchDay}
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">PISTA</div>
                            <div style="font-size: 1.6rem; font-weight: 950; color: ${accentColor};">${ctx.court || '?'}</div>
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 18px; border-radius: 18px; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 40px; height: 40px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                🤝
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Compañero</div>
                                <div style="font-size: 1rem; font-weight: 800; color: white;">${ctx.partner || 'Por asignar'}</div>
                            </div>
                        </div>
                        <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 14px 0;"></div>
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 40px; height: 40px; background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ⚔️
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Rivales</div>
                                <div style="font-size: 1rem; font-weight: 800; color: white;">${ctx.opponents || 'Por asignar'}</div>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        <button onclick="Router.navigate('live')" style="
                            background: rgba(255,255,255,0.05);
                            border: 1px solid rgba(255,255,255,0.1);
                            color: white;
                            padding: 16px;
                            border-radius: 14px;
                            font-weight: 800;
                            font-size: 0.8rem;
                            cursor: pointer;
                            transition: all 0.2s;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            Detalles
                        </button>
                        <button ${ctx.confirmed ? 'disabled' : ''} onclick="HeroCardActions.confirmAttendance('${ctx.matchId}', '${ctx.matchType}')" style="
                            background: ${ctx.confirmed ? 'rgba(52,199,89,0.2)' : accentColor};
                            border: ${ctx.confirmed ? '1px solid rgba(52,199,89,0.3)' : 'none'};
                            color: ${ctx.confirmed ? '#34C759' : 'black'};
                            padding: 16px;
                            border-radius: 14px;
                            font-weight: 900;
                            font-size: 0.8rem;
                            cursor: ${ctx.confirmed ? 'default' : 'pointer'};
                            transition: all 0.2s;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            ${ctx.confirmed ? '' : `box-shadow: 0 8px 20px ${accentColor}40;`}
                        ">
                            ${ctx.confirmed ? '✓ Confirmado' : 'Confirmar'}
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
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    border-left: 5px solid #34C759;
                    border-radius: 24px;
                    padding: 32px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(52,199,89,0.2);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 10rem; opacity: 0.05; transform: rotate(15deg);">🏆</div>
                    
                    <div style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 3.5rem; margin-bottom: 12px; animation: bounce 1s infinite alternate;">🔥</div>
                        <div style="font-size: 1rem; font-weight: 800; color: #34C759; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase;">
                            ¡VICTORIA ÉPICA!
                        </div>
                        <div style="font-size: 4rem; font-weight: 950; color: white; margin-bottom: 15px; line-height: 1; letter-spacing: -2px;">
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
                    background: #09090b;
                    border: 2px solid ${activeColor};
                    border-radius: 24px;
                    padding: 0;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 0 20px ${activeColor}40;
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

                        <h2 style="color: white; font-weight: 950; font-size: 1.6rem; margin: 0 0 5px 0; line-height: 1; text-shadow: 0 0 20px ${activeColor}80;">
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
         * Vista previa de la semana
         */
        static renderWeekPreview(ctx) {
            return `
                <div class="hero-card fade-in" style="
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border-left: 5px solid #3b82f6;
                    border-radius: 24px;
                    padding: 28px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 0.7rem; font-weight: 900; color: #3b82f6; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
                        📅 ESTA SEMANA
                    </div>
                    <div style="font-size: 1.6rem; font-weight: 950; color: white; margin-bottom: 20px; letter-spacing: -0.5px;">
                        Tienes ${ctx.upcomingMatches} ${ctx.upcomingMatches === 1 ? 'partido' : 'partidos'}
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 16px; margin-bottom: 20px;">
                        <div style="font-size: 0.9rem; font-weight: 800; color: white; margin-bottom: 6px;">
                            Próximo: ${ctx.matchDay}
                        </div>
                        <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 600;">
                            A las ${ctx.matchTime} • ${ctx.tournamentName || ctx.eventName || 'Evento de Pádel'}
                        </div>
                    </div>

                    <button onclick="Router.navigate('agenda')" style="
                        background: transparent;
                        border: 2px solid rgba(59,130,246,0.3);
                        color: #3b82f6;
                        padding: 16px;
                        border-radius: 14px;
                        font-weight: 900;
                        font-size: 0.85rem;
                        cursor: pointer;
                        width: 100%;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(59,130,246,0.1)'" onmouseout="this.style.background='transparent'">
                        VER AGENDA COMPLETA
                    </button>
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
                    background: rgba(15, 23, 42, 0.9);
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
                window.PremiumModal.alert({
                    title: "✅ ASISTENCIA CONFIRMADA",
                    message: "¡Excelente! El capitán ya sabe que vienes. ¡A por todas! 🎾",
                    type: 'success'
                });

                // Recargar dashboard forzando actualización de contexto
                if (window.DashboardView && window.DashboardView.render) {
                    const data = window.Store.getState('dashboardData');
                    window.DashboardView.render(data);
                }
            } catch (e) {
                console.error('Error confirming:', e);
                window.PremiumModal.alert({
                    title: "ERROR",
                    message: "No se pudo confirmar la asistencia. Inténtalo de nuevo.",
                    type: 'danger'
                });
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