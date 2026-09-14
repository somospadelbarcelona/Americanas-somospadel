(function () {
    class ActionGrid {
        /**
         * Renderiza el grid de acciones
         * @param {Object} context - Contexto del jugador
         * @returns {string} HTML del grid
         */
        static render(context = {}) {
            const actions = this.getActions(context);

            return `
                <div class="action-grid-v2-container" style="padding: 0; margin-bottom: 6px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${actions.map(action => this.renderAction(action)).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Define las acciones disponibles con su contexto
         */
        static getActions(context) {
            return [
                {
                    id: 'courtScoreboard',
                    icon: '📟',
                    title: 'Marcador Pista',
                    badge: 'LIVE',
                    badgeText: 'Modo Pista',
                    badgeBg: '#CCFF00',
                    badgeColor: '#000000',
                    badgeGlow: 'rgba(204,255,0,0.5)',
                    cardBorder: '1.5px solid #72a800',
                    cardBg: 'linear-gradient(135deg, #ffffff 0%, #f7fdf0 100%)',
                    cardGlow: '0 6px 20px rgba(114, 168, 0, 0.15)',
                    onClick: 'window.PlayerView?.haptic?.(20); window.CourtScoreboard && window.CourtScoreboard.open()',
                    iconBg: 'rgba(204, 255, 0, 0.25)',
                    color: '#4d7c0f',
                    highlight: true
                },
                {
                    id: 'futCard',
                    icon: '🎴',
                    title: 'Carta FUT',
                    badge: 'PRO',
                    badgeText: 'Ultimate Team',
                    badgeBg: '#fbbf24',
                    badgeColor: '#000000',
                    badgeGlow: 'rgba(251, 191, 36, 0.5)',
                    cardBorder: '1.5px solid #f59e0b',
                    cardBg: 'linear-gradient(135deg, #ffffff 0%, #fffdf2 100%)',
                    cardGlow: '0 6px 20px rgba(245, 158, 11, 0.15)',
                    onClick: 'window.PlayerView?.haptic?.(20); window.PadelFutCard && window.PadelFutCard.open(window.Store ? window.Store.getState("currentUser") : {})',
                    iconBg: 'rgba(251, 191, 36, 0.22)',
                    color: '#d97706',
                    highlight: true
                },
                {
                    id: 'agenda',
                    icon: '📅',
                    title: 'Mi Agenda',
                    badge: context.upcomingMatches || 0,
                    badgeText: context.upcomingMatches === 1 ? 'próximo' : 'próximos',
                    badgeBg: '#3b82f6',
                    badgeColor: '#ffffff',
                    badgeGlow: 'rgba(59, 130, 246, 0.4)',
                    cardBorder: '1px solid #e2e8f0',
                    cardBg: '#ffffff',
                    cardGlow: '0 4px 14px rgba(0,0,0,0.03)',
                    route: 'agenda',
                    color: '#0284c7',
                    iconBg: 'rgba(59, 130, 246, 0.10)'
                },
                {
                    id: 'tournaments',
                    icon: '🏆',
                    title: 'Americanas',
                    badge: context.activeTournaments || 0,
                    badgeText: context.activeTournaments === 1 ? 'activo' : 'activos',
                    badgeBg: '#CCFF00',
                    badgeColor: '#000000',
                    badgeGlow: 'rgba(204, 255, 0, 0.4)',
                    cardBorder: context.activeTournaments > 0 ? '1.5px solid #CCFF00' : '1px solid #e2e8f0',
                    cardBg: '#ffffff',
                    cardGlow: context.activeTournaments > 0 ? '0 4px 16px rgba(204,255,0,0.2)' : '0 4px 14px rgba(0,0,0,0.03)',
                    route: 'americanas',
                    color: '#0284c7',
                    iconBg: 'rgba(6, 182, 212, 0.12)',
                    highlight: context.activeTournaments > 0
                },
                {
                    id: 'ranking',
                    icon: '🥇',
                    title: 'Ranking',
                    badge: null,
                    badgeText: 'Global SP',
                    cardBorder: '1px solid #e2e8f0',
                    cardBg: '#ffffff',
                    cardGlow: '0 4px 14px rgba(0,0,0,0.03)',
                    route: 'ranking',
                    color: '#d97706',
                    iconBg: 'rgba(234, 179, 8, 0.12)'
                },
                {
                    id: 'profile',
                    icon: '👤',
                    title: 'Mi Perfil',
                    badge: null,
                    badgeText: 'Mis Datos',
                    cardBorder: '1px solid #e2e8f0',
                    cardBg: '#ffffff',
                    cardGlow: '0 4px 14px rgba(0,0,0,0.03)',
                    route: 'profile',
                    color: '#475569',
                    iconBg: 'rgba(100, 116, 139, 0.12)'
                }
            ];
        }

        /**
         * Renderiza una acción individual
         */
        static renderAction(action) {
            const hasNotification = action.badge !== null && action.badge !== undefined && action.badge !== 0;
            const clickHandler = action.onClick ? action.onClick : `window.PlayerView?.haptic?.(20); window.Router && window.Router.navigate('${action.route}')`;
            const badgeBg = action.badgeBg || (typeof action.badge === 'string' ? '#CCFF00' : '#FF3B30');
            const badgeColor = action.badgeColor || (typeof action.badge === 'string' ? '#000000' : '#ffffff');
            const badgeGlow = action.badgeGlow || 'rgba(0,0,0,0.2)';
            const borderStyle = action.cardBorder || '1px solid #e2e8f0';
            const bgStyle = action.cardBg || '#ffffff';
            const shadowStyle = action.cardGlow || '0 4px 14px rgba(0,0,0,0.03)';

            return `
                <div 
                    onclick="${clickHandler}" 
                    style="
                        background: ${bgStyle};
                        padding: 16px 14px;
                        border-radius: 20px;
                        border: ${borderStyle};
                        box-shadow: ${shadowStyle};
                        cursor: pointer;
                        transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease;
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        user-select: none;
                        -webkit-tap-highlight-color: transparent;
                    "
                    onmouseover="this.style.transform='translateY(-2px) scale(1.01)';"
                    onmouseout="this.style.transform='translateY(0) scale(1)';"
                    onmousedown="this.style.transform='scale(0.97)';"
                    onmouseup="this.style.transform='scale(1)';"
                >
                    ${hasNotification ? `
                        <div style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: ${badgeBg};
                            color: ${badgeColor};
                            padding: ${typeof action.badge === 'string' ? '2px 8px' : '0'};
                            min-width: 22px;
                            height: 20px;
                            border-radius: ${typeof action.badge === 'string' ? '8px' : '50%'};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.62rem;
                            font-weight: 950;
                            letter-spacing: 0.6px;
                            box-shadow: 0 2px 8px ${badgeGlow};
                            z-index: 2;
                        ">
                            ${action.badge}
                        </div>
                    ` : ''}

                    <div style="
                        background: ${action.iconBg || '#F8F9FA'};
                        width: 44px;
                        height: 44px;
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.45rem;
                        margin-bottom: 10px;
                        border: 1px solid rgba(0,0,0,0.04);
                    ">
                        ${action.icon}
                    </div>

                    <div>
                        <div style="
                            font-size: 0.95rem;
                            font-weight: 950;
                            color: #0a192f;
                            margin-bottom: 3px;
                            line-height: 1.2;
                            letter-spacing: -0.2px;
                        ">
                            ${action.title}
                        </div>

                        <div style="
                            font-size: 0.68rem;
                            color: ${action.color || '#64748b'};
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.6px;
                        ">
                            ${action.badge && typeof action.badge === 'number' && action.badge > 0
                                ? `${action.badge} ${action.badgeText}`
                                : action.badgeText
                            }
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza versión compacta (para estados específicos)
         */
        static renderCompact(context = {}) {
            const actions = this.getActions(context).slice(0, 2);

            return `
                <div class="action-grid-compact-container" style="padding: 0; margin-bottom: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${actions.map(action => this.renderAction(action)).join('')}
                    </div>
                </div>
            `;
        }
    }

    window.ActionGrid = ActionGrid;
    console.log('🎯 ActionGrid Component Loaded');
})();
