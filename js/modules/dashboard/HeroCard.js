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
            const borderColor = urgencyClass === 'urgent' ? '#FF3B30' : urgencyClass === 'soon' ? '#FF9500' : '#CCFF00';

            return `
                <div class="hero-card fade-in" style="
                    background: white;
                    border-left: 5px solid ${borderColor};
                    border-radius: 20px;
                    padding: 24px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                    animation: slideInDown 0.4s ease-out;
                ">
                    ${urgencyClass === 'urgent' ? `
                        <div style="background: #FF3B30; color: white; display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 900; margin-bottom: 12px; letter-spacing: 0.5px; animation: pulse 2s infinite;">
                            🚨 ¡TU PARTIDO EMPIEZA EN ${timeUntil} MINUTOS!
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 0.75rem; font-weight: 800; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                                🎾 TU PRÓXIMO PARTIDO
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 900; color: #000; line-height: 1.1; margin-bottom: 4px;">
                                ${ctx.matchDay} • ${ctx.matchTime}
                            </div>
                            <div style="font-size: 0.9rem; color: #666; font-weight: 600;">
                                ${ctx.tournamentName}
                            </div>
                        </div>
                        <div style="background: #F8F9FA; padding: 12px; border-radius: 12px; text-align: center; min-width: 60px;">
                            <div style="font-size: 0.65rem; color: #888; font-weight: 800; margin-bottom: 4px;">PISTA</div>
                            <div style="font-size: 1.5rem; font-weight: 900; color: #000;">${ctx.court || '2'}</div>
                        </div>
                    </div>

                    <div style="background: #F8F9FA; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 36px; height: 36px; background: #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                👤
                            </div>
                            <div>
                                <div style="font-size: 0.65rem; color: #888; font-weight: 700; text-transform: uppercase;">Compañero</div>
                                <div style="font-size: 0.95rem; font-weight: 800; color: #000;">${ctx.partner || 'Por asignar'}</div>
                            </div>
                        </div>
                        <div style="height: 1px; background: #E0E0E0; margin: 12px 0;"></div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; background: #FF3B30; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ⚔️
                            </div>
                            <div>
                                <div style="font-size: 0.65rem; color: #888; font-weight: 700; text-transform: uppercase;">Rivales</div>
                                <div style="font-size: 0.95rem; font-weight: 800; color: #000;">${ctx.opponents || 'Por asignar'}</div>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <button onclick="Router.navigate('live')" style="
                            background: white;
                            border: 2px solid #E0E0E0;
                            color: #333;
                            padding: 14px;
                            border-radius: 12px;
                            font-weight: 800;
                            font-size: 0.85rem;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.borderColor='#CCFF00'" onmouseout="this.style.borderColor='#E0E0E0'">
                            VER DETALLES
                        </button>
                        <button ${ctx.confirmed ? 'disabled' : ''} onclick="HeroCardActions.confirmAttendance('${ctx.matchId}', '${ctx.matchType}')" style="
                            background: ${ctx.confirmed ? '#34C759' : '#CCFF00'};
                            border: none;
                            color: black;
                            padding: 14px;
                            border-radius: 12px;
                            font-weight: 900;
                            font-size: 0.85rem;
                            cursor: ${ctx.confirmed ? 'default' : 'pointer'};
                            transition: all 0.2s;
                            box-shadow: 0 4px 12px rgba(204,255,0,0.3);
                        ">
                            ${ctx.confirmed ? '✓ CONFIRMADO' : 'CONFIRMAR'}
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
                <div class="hero-card fade-in" style="
                    background: linear-gradient(135deg, #FFFFFF 0%, #F0FFF4 100%);
                    border-left: 5px solid #34C759;
                    border-radius: 20px;
                    padding: 24px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 8px 24px rgba(52,199,89,0.15);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.1;">🏆</div>
                    
                    <div style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 3rem; margin-bottom: 8px; animation: bounce 1s;">🎉</div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: #34C759; margin-bottom: 8px; letter-spacing: -0.5px;">
                            ¡VICTORIA!
                        </div>
                        <div style="font-size: 3rem; font-weight: 900; color: #000; margin-bottom: 4px; line-height: 1;">
                            ${ctx.scoreA} - ${ctx.scoreB}
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-bottom: 16px;">
                            vs ${ctx.opponents}
                        </div>
                        
                        <div style="display: inline-block; background: rgba(52,199,89,0.1); border: 1px solid #34C759; color: #34C759; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; margin-bottom: 20px;">
                            +${ctx.pointsEarned || 3} puntos • Subiste al #${ctx.newRank}
                        </div>

                        <button onclick="Router.navigate('live')" style="
                            background: #34C759;
                            border: none;
                            color: white;
                            padding: 14px 24px;
                            border-radius: 12px;
                            font-weight: 800;
                            font-size: 0.9rem;
                            cursor: pointer;
                            width: 100%;
                            box-shadow: 0 4px 12px rgba(52,199,89,0.3);
                        ">
                            VER ESTADÍSTICAS DEL PARTIDO
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
                    background: white;
                    border-left: 5px solid #007AFF;
                    border-radius: 20px;
                    padding: 24px;
                    margin: 0;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                ">
                    <div style="font-size: 0.75rem; font-weight: 800; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                        📅 ESTA SEMANA
                    </div>
                    <div style="font-size: 1.4rem; font-weight: 900; color: #000; margin-bottom: 16px;">
                        Tienes ${ctx.upcomingMatches} ${ctx.upcomingMatches === 1 ? 'partido' : 'partidos'}
                    </div>
                    
                    <div style="background: #F8F9FA; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: #333; margin-bottom: 8px;">
                            Próximo: ${ctx.matchDay} a las ${ctx.matchTime}
                        </div>
                        <div style="font-size: 0.75rem; color: #666;">
                            ${ctx.tournamentName || ctx.eventName || 'Evento de Pádel'}
                        </div>
                    </div>

                    <button onclick="Router.navigate('agenda')" style="
                        background: white;
                        border: 2px solid #007AFF;
                        color: #007AFF;
                        padding: 14px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.85rem;
                        cursor: pointer;
                        width: 100%;
                    ">
                        VER AGENDA COMPLETA
                    </button>
                </div>
            `;
        }

        /**
         * Estado vacío (sin eventos)
         */
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
    console.log('🎯 HeroCard Component Loaded');
})();
