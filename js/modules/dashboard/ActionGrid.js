/**
 * ActionGrid.js
 * Grid de acciones rápidas con badges informativos
 * Solo muestra 4 acciones principales con contexto
 */
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
                <!-- WRAPPER SCROLL HORIZONTAL (Action Grid) -->
                <div style="width: 100%; overflow: hidden;">
                    <div class="dash-menu-grid" style="display: flex; overflow-x: auto; gap: 12px; padding: 10px 20px 20px 20px; scrollbar-width: none;">
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
                    id: 'agenda',
                    icon: '📅',
                    title: 'Mi Agenda',
                    badge: context.upcomingMatches || 0,
                    badgeText: context.upcomingMatches === 1 ? 'próximo' : 'próximos',
                    route: 'agenda',
                    color: '#007AFF'
                },
                {
                    id: 'tournaments',
                    icon: '🏆',
                    title: 'Americanas',
                    badge: context.activeTournaments || 0,
                    badgeText: context.activeTournaments === 1 ? 'activo' : 'activos',
                    route: 'americanas',
                    color: '#CCFF00',
                    highlight: context.activeTournaments > 0
                },
                {
                    id: 'ranking',
                    icon: '🥇',
                    title: 'Ranking',
                    badge: null,
                    badgeText: 'Global SP',
                    route: 'ranking',
                    color: '#FFD700'
                },
                {
                    id: 'profile',
                    icon: '👤',
                    title: 'Mi Perfil',
                    badge: null,
                    badgeText: 'Mis Datos',
                    route: 'profile',
                    color: '#FF9500'
                }
            ];
        }

        /**
         * Renderiza una acción individual
         */
        static renderAction(action) {
            const hasNotification = action.badge !== null && action.badge !== 0;
            const isHighlight = action.highlight;

            return `
                <div 
                    onclick="Router.navigate('${action.route}')" 
                    class="menu-card ${isHighlight ? 'highlight' : ''}"
                    style="
                        /* Overridden by CSS class .menu-card but kept for fallback inline specifics if needed */
                        border: ${isHighlight ? '2px solid ' + action.color : '1px solid #E0E0E0'};
                    "
                >
                    ${hasNotification && typeof action.badge === 'number' && action.badge > 0 ? `
                        <div style="position: absolute; top: 8px; right: 8px; background: #FF3B30; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 900; box-shadow: 0 2px 5px rgba(255,59,48,0.4);">
                            ${action.badge}
                        </div>
                    ` : ''}

                    <div class="icon-box" style="color: ${isHighlight ? 'black' : action.color}; background: ${isHighlight ? action.color : '#F3F4F6'};">
                        ${action.icon}
                    </div>

                    <div class="menu-title" style="font-size: 0.8rem;">
                        ${action.title}
                    </div>

                    <div class="menu-desc" style="display:none;">
                         <!-- Hidden desc for compact view -->
                    </div>
                        ${action.badge && typeof action.badge === 'number' && action.badge > 0
                    ? `${action.badge} ${action.badgeText}`
                    : action.badgeText
                }
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza versión compacta (para estados específicos)
         */
        static renderCompact(context = {}) {
            const actions = this.getActions(context).slice(0, 2); // Solo 2 acciones

            return `
                <div style="padding: 0 20px; margin-bottom: 20px;">
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
