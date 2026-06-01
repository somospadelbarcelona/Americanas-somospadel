/**
 * 👑 ROLE SERVICE v1.0 - SOMOSPADEL BCN
 * Centraliza la definición de roles y la generación de badges premium
 */
(function () {
    const RoleService = {
        ROLES: {
            super_admin: {
                name: "SUPER ADMIN",
                emoji: "👑",
                icon: "fa-crown",
                color: "#FFD700",
                bg: "linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%)",
                border: "1px solid rgba(255, 215, 0, 0.4)",
                shadow: "0 0 15px rgba(255, 215, 0, 0.15)",
                text: "#d97706",
                desc: "Creador y desarrollador de la plataforma. Acceso total a base de datos, administración y configuraciones de seguridad."
            },
            admin_player: {
                name: "ADMIN + JUGADOR",
                emoji: "🎖️",
                icon: "fa-award",
                color: "#3b82f6",
                bg: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                shadow: "0 0 15px rgba(59, 130, 246, 0.15)",
                text: "#2563eb",
                desc: "Administrador con privilegios de gobernanza que también participa activamente en partidos y torneos puntuables del club."
            },
            admin: {
                name: "ADMINISTRADOR",
                emoji: "🛡️",
                icon: "fa-shield-halved",
                color: "#a855f7",
                bg: "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                shadow: "0 0 15px rgba(168, 85, 247, 0.15)",
                text: "#7c3aed",
                desc: "Encargado de la gobernanza general, gestión de equipos, validación de nuevos jugadores y creación de eventos."
            },
            captain: {
                name: "CAPITÁN",
                emoji: "🧢",
                icon: "fa-user-shield",
                color: "#10b981",
                bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                shadow: "0 0 15px rgba(16, 185, 129, 0.15)",
                text: "#059669",
                desc: "Líder asignado de un equipo que coordina convocatorias semanales, actas de partidos oficiales y alineaciones."
            },
            player_somospadel: {
                name: "JUGADOR SOMOSPADEL",
                emoji: "🎾",
                icon: "fa-tennis-ball",
                color: "#CCFF00",
                bg: "linear-gradient(135deg, rgba(204, 255, 0, 0.15) 0%, rgba(114, 168, 0, 0.15) 100%)",
                border: "1px solid rgba(204, 255, 0, 0.4)",
                shadow: "0 0 15px rgba(204, 255, 0, 0.15)",
                text: "#72a800",
                desc: "Jugador oficial miembro de la comunidad SomosPadel BCN, con acceso a torneos cerrados y ranking oficial."
            },
            player: {
                name: "JUGADOR EXTERNO",
                emoji: "👤",
                icon: "fa-user",
                color: "#64748b",
                bg: "linear-gradient(135deg, rgba(148, 163, 184, 0.08) 0%, rgba(100, 116, 139, 0.08) 100%)",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                shadow: "none",
                text: "#475569",
                desc: "Jugador invitado o externo registrado para disputar americanas individuales, entrenamientos o ligas abiertas."
            },
            collaborator: {
                name: "COLABORADOR",
                emoji: "🤝",
                icon: "fa-handshake",
                color: "#f59e0b",
                bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                shadow: "0 0 15px rgba(245, 158, 11, 0.15)",
                text: "#d97706",
                desc: "Socio comercial o patrocinador del club que colabora activamente en la gestión de premios y patrocinio de eventos."
            }
        },

        get(roleCode) {
            return this.ROLES[roleCode] || this.ROLES.player;
        },

        getBadgeHtml(roleCode, compact = false) {
            const role = this.get(roleCode);
            if (compact) {
                return `
                    <span class="role-badge-compact" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 0.62rem;
                        font-weight: 800;
                        color: ${role.text};
                        background: ${role.bg};
                        border: ${role.border};
                        padding: 2px 6px;
                        border-radius: 6px;
                    " title="${role.name}">
                        <i class="fas ${role.icon}" style="color: ${role.color}; font-size: 0.6rem;"></i>
                        <span>${role.name}</span>
                    </span>`;
            }
            return `
                <span class="role-badge-premium" style="
                    display: inline-flex; 
                    align-items: center; 
                    gap: 6px; 
                    padding: 6px 12px; 
                    border-radius: 12px; 
                    background: ${role.bg}; 
                    border: ${role.border}; 
                    box-shadow: ${role.shadow}; 
                    color: ${role.text}; 
                    font-size: 0.72rem; 
                    font-weight: 900; 
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                ">
                    <i class="fas ${role.icon}" style="color: ${role.color}; font-size: 0.8rem;"></i>
                    <span>${role.emoji} ${role.name}</span>
                </span>
            `;
        },

        showLegend() {
            // Eliminar modal anterior si existe
            const existing = document.getElementById('roles-legend-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'roles-legend-modal';
            modal.style = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.65);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.25s ease;
            `;

            modal.innerHTML = `
                <div class="glass-card-enterprise" style="
                    background: #ffffff !important;
                    border: 1px solid #cbd5e1 !important;
                    border-radius: 28px !important;
                    width: 92%;
                    max-width: 520px;
                    max-height: 82vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2) !important;
                    padding: 24px;
                    gap: 16px;
                    transform: translateY(20px);
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    color: #0f172a !important;
                    font-family: 'Outfit', sans-serif;
                    box-sizing: border-box;
                ">
                    <style>
                        .role-legend-item {
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                            padding: 14px;
                            border-radius: 18px;
                            border: 1px solid #f1f5f9;
                            background: #f8fafc;
                            transition: all 0.2s ease;
                        }
                        .role-legend-item:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                            border-color: #cbd5e1;
                        }
                        .role-legend-scroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .role-legend-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .role-legend-scroll::-webkit-scrollbar-thumb {
                            background: #cbd5e1;
                            border-radius: 3px;
                        }
                    </style>

                    <!-- Cabecera -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px; color: #84cc16; font-size: 0.65rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">
                                <i class="fas fa-crown"></i> Leyenda Oficial
                            </div>
                            <h3 style="margin: 0; font-weight: 950; font-size: 1.5rem; letter-spacing: -0.5px; text-transform: uppercase;">Roles del Club</h3>
                        </div>
                        <button onclick="window.closeRolesLegendModal()" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; font-size: 0.9rem; transition: 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                            ✕
                        </button>
                    </div>

                    <!-- Listado con scroll -->
                    <div class="role-legend-scroll" style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 4px; text-align: left;">
                        ${Object.keys(this.ROLES).map(key => {
                            const r = this.ROLES[key];
                            const badgeHtml = this.getBadgeHtml(key);
                            return `
                                <div class="role-legend-item">
                                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                                        ${badgeHtml}
                                        <span style="font-size: 0.62rem; font-weight: 950; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">ID: ${key}</span>
                                    </div>
                                    <p style="margin: 4px 0 0 0; font-size: 0.85rem; line-height: 1.5; color: #475569; font-weight: 600;">
                                        ${r.desc}
                                    </p>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Botón de Cierre -->
                    <button onclick="window.closeRolesLegendModal()" style="margin-top: 6px; width: 100%; height: 46px; background: #CCFF00; color: black; border: none; font-weight: 900; font-size: 0.85rem; border-radius: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(204,255,0,0.15); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                        ENTENDIDO, ¡GRACIAS!
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // Transición suave de entrada
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modal.querySelector('.glass-card-enterprise').style.transform = 'translateY(0)';
            });

            // Cerrar al hacer clic fuera del contenedor del modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    window.closeRolesLegendModal();
                }
            });
        },

        closeLegend() {
            const modal = document.getElementById('roles-legend-modal');
            if (!modal) return;
            modal.style.opacity = '0';
            modal.querySelector('.glass-card-enterprise').style.transform = 'translateY(20px)';
            setTimeout(() => {
                modal.remove();
            }, 250);
        }
    };

    window.RoleService = RoleService;
    window.showRolesLegendModal = () => RoleService.showLegend();
    window.closeRolesLegendModal = () => RoleService.closeLegend();
    console.log("👑 RoleService Loaded Successfully");
})();
