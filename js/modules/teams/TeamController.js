/**
 * TeamController.js - Orchestrates Teams Data and View
 */
(function () {
    class TeamController {
        constructor() {
            this.teams = [];
            this.unsubscribe = null;
            this.localBackup = [];
        }

        async init() {
            console.log("👥 [TeamController] Initializing...");

            // 1. Cargar datos locales inmediatamente para render instantáneo
            if (window.ClubTeamsData && window.ClubTeamsData.length > 0) {
                console.log(`✅ [TeamController] Instantly loading ${window.ClubTeamsData.length} teams from Local Data.`);
                this.localBackup = JSON.parse(JSON.stringify(window.ClubTeamsData));
                this.teams = window.ClubTeamsData;
                this.render();
            }

            // 2. Suscribirse a actualizaciones en tiempo real en Firestore
            if (window.db || (window.firebase && firebase.firestore)) {
                const db = window.db || firebase.firestore();
                
                // Limpiar suscripción previa si existe
                if (this.unsubscribe) {
                    this.unsubscribe();
                    this.unsubscribe = null;
                }

                console.log("📡 [TeamController] Subscribing to real-time updates from Firestore (club_teams)...");
                this.unsubscribe = db.collection('club_teams').onSnapshot((snapshot) => {
                    let newTeams = [];
                    if (!snapshot.empty) {
                        newTeams = snapshot.docs.map(doc => doc.data());
                        console.log(`⚡ [TeamController] Real-Time update: Received ${newTeams.length} teams from Firestore.`);
                    } else {
                        console.warn("⚠️ [TeamController] Firestore collection 'club_teams' is empty.");
                    }

                    // Fusión inteligente: empezar con una copia profunda de nuestro localBackup
                    const mergedTeams = JSON.parse(JSON.stringify(this.localBackup || []));

                    // Para cada equipo de Firestore
                    newTeams.forEach(firestoreTeam => {
                        const localIndex = mergedTeams.findIndex(t => t.id === firestoreTeam.id);
                        if (localIndex !== -1) {
                            // Si existe localmente, lo reemplazamos o actualizamos con los datos de Firestore
                            mergedTeams[localIndex] = { ...mergedTeams[localIndex], ...firestoreTeam };
                        } else {
                            // Si no existe localmente, lo añadimos
                            mergedTeams.push(firestoreTeam);
                        }
                    });

                    // Actualizar datos locales y del controlador
                    this.teams = mergedTeams;
                    window.ClubTeamsData = mergedTeams;
                    
                    // Re-renderizar la vista
                    this.render();
                }, (error) => {
                    console.error("❌ [TeamController] Real-Time listener failed:", error);
                });
            } else {
                console.warn("⚠️ [TeamController] Firebase/Firestore not available for real-time updates.");
            }
        }

        destroy() {
            if (this.unsubscribe) {
                console.log("🔌 [TeamController] Unsubscribing from Firestore real-time listener.");
                this.unsubscribe();
                this.unsubscribe = null;
            }
        }

        setCategory(category) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            window.TeamView.activeCategory = category;
            this.render();
        }

        handleSearch(query) {
            if (window.TeamView) {
                window.TeamView.searchQuery = query;
                window.TeamView.filterDOM();
            }
        }

        clearSearch() {
            const input = document.getElementById('team-search-input');
            if (input) {
                input.value = '';
            }
            if (window.TeamView) {
                window.TeamView.searchQuery = '';
                window.TeamView.filterDOM();
            }
        }

        render() {
            if (window.TeamView) {
                window.TeamView.render(this.teams);
            }
        }

        async showTeamDetail(teamId) {
            const team = this.teams.find(t => t.id === teamId);
            if (!team) return;
            const officialLink = (team.link && team.link.startsWith('http') && team.link !== 'about:blank') ? team.link : 'https://summapadel.com/event/151';

            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);

            // WhatsApp Share Helper
            const getShareUrl = (section) => {
                const text = section === 'roster' 
                    ? `🎾 Jugadores de ${team.name}:\n${team.roster.map(p => `- ${p.name} (${p.pts} pts)`).join('\n')}`
                    : section === 'jornadas'
                    ? `📅 Próximas jornadas de ${team.name}:\n${team.schedule.map(m => `- J${m.j}: vs ${m.opponent} (${m.date})`).join('\n')}`
                    : `📊 Clasificación de ${team.name}:\n${team.groupStandings.slice(0, 3).map(s => `${s.pos}. ${s.team} - ${s.pts} pts`).join('\n')}`;
                return `https://wa.me/?text=${encodeURIComponent(text)}`;
            };

            const shareBtnStyle = `
                width: 100%; margin-top: 20px; background: #25D366; color: white; border: none; 
                padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; 
                cursor: pointer; display: flex; align-items: center; 
                justify-content: center; gap: 8px; transition: 0.3s;
            `;

            // Open original Summapadel link in a controlled way or show modal
            window.PremiumModal.alert({
                title: team.name,
                logo: team.logo || 'img/logo_somospadel.png',
                theme: 'light',
                message: `
                    <div style="text-align: left; padding: 0;">
                        <!-- 📊 MINI DASHBOARD -->
                        <div style="display:flex; justify-content: space-between; margin-bottom: 20px; 
                                    background: linear-gradient(145deg, #ffffff, #f1f5f9); 
                                    padding: 18px; border-radius: 24px; 
                                    box-shadow: 0 10px 25px rgba(0,0,0,0.03); 
                                    border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                                    <div style="width: 110px; height: 110px; border-radius: 30px; background: white; padding: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 4px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                            <img src="${team.logo}" style="width: 100%; height: 100%; object-fit: contain;" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; color:#0f172a; font-size:2.5rem;">
                                <i class="fas fa-trophy"></i>
                            </div>
                        </div>    <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; background: rgba(114,168,0,0.05); border-radius: 50%; filter: blur(20px);"></div>
                            <div style="z-index: 1;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Puntos</div>
                                <div style="font-size: 1.6rem; font-weight: 950; color: #72a800; line-height: 1;">${team.points}</div>
                            </div>
                            <div style="text-align: center; z-index: 1;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Partidos</div>
                                <div style="font-size: 1.6rem; font-weight: 950; color: #0f172a; line-height: 1;">${team.stats.pj}</div>
                            </div>
                            <div style="text-align: right; z-index: 1;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">G / P</div>
                                <div style="font-size: 1.6rem; font-weight: 950; color: #0f172a; line-height: 1;">${team.stats.pg}<span style="color:#cbd5e1; font-weight: 300;">/</span>${team.stats.pp}</div>
                            </div>
                        </div>

                        <!-- ⚡ QUICK INFO ROW (Divided into 2) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                            <!-- NEXT MATCH CARD -->
                            <div style="background: #0f172a; border-radius: 20px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);"
                                 onclick="window.TeamController.switchTab(document.getElementById('btn-tab-jornadas'), 'tab-jornadas', '#0088cc', '#ffffff')">
                                <div style="width: 32px; height: 32px; background: #00d2ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-calendar-day" style="font-size: 0.8rem;"></i>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-size: 0.5rem; color: #00d2ff; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Próximo Partido</div>
                                    <div style="font-size: 0.65rem; color: white; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        vs ${team.schedule?.find(m => m.status !== 'completed')?.opponent || 'Sin asignar'}
                                    </div>
                                </div>
                            </div>

                            <!-- CAPTAINS / INFO CARD -->
                            <div style="background: #ffffff; border-radius: 20px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.02);"
                                 onclick="window.TeamController.switchTab(document.getElementById('btn-tab-info'), 'tab-info', '#f59e0b', '#ffffff')">
                                <div style="width: 32px; height: 32px; background: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-info-circle" style="font-size: 0.8rem;"></i>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-size: 0.5rem; color: #f59e0b; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Capitanes</div>
                                    <div style="font-size: 0.65rem; color: #0f172a; font-weight: 800;">Ver Info Equipo</div>
                                </div>
                            </div>
                        </div>

                        <!-- 🎛️ PREMIUM PILL TABS -->
                        <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: 18px; margin-bottom: 25px; border: 1px solid #e2e8f0; overflow-x: auto; scrollbar-width: none;">
                            <button onclick="window.TeamController.switchTab(this, 'tab-roster', '#0f172a', '#ffffff')" 
                                    style="flex: 1; padding: 10px 5px; border-radius: 14px; background: #0f172a; color: #ffffff; border: none; font-weight: 950; font-size: 0.55rem; cursor: pointer; min-width: 80px;">
                                <i class="fas fa-users" style="margin-right: 4px;"></i> JUGADORES
                            </button>
                            <button id="btn-tab-jornadas" onclick="window.TeamController.switchTab(this, 'tab-jornadas', '#0088cc', '#ffffff')" 
                                    style="flex: 1; padding: 10px 5px; border-radius: 14px; background: transparent; color: #64748b; border: none; font-weight: 800; font-size: 0.55rem; cursor: pointer; min-width: 80px;">
                                <i class="fas fa-calendar-alt" style="margin-right: 4px;"></i> JORNADAS
                            </button>
                            <button onclick="window.TeamController.switchTab(this, 'tab-class', '#72a800', '#ffffff')" 
                                    style="flex: 1; padding: 10px 5px; border-radius: 14px; background: transparent; color: #64748b; border: none; font-weight: 800; font-size: 0.55rem; cursor: pointer; min-width: 80px;">
                                <i class="fas fa-list-ol" style="margin-right: 4px;"></i> TABLA
                            </button>
                            <button id="btn-tab-info" onclick="window.TeamController.switchTab(this, 'tab-info', '#f59e0b', '#ffffff')" 
                                    style="flex: 1; padding: 10px 5px; border-radius: 14px; background: transparent; color: #64748b; border: none; font-weight: 800; font-size: 0.55rem; cursor: pointer; min-width: 80px;">
                                <i class="fas fa-id-card" style="margin-right: 4px;"></i> INFO
                            </button>
                        </div>

                        <div id="team-modal-tabs-content" style="min-height: 250px;">
                            <!-- 👥 ROSTER SECTION -->
                            <div id="tab-roster" style="display: block; animation: fadeIn 0.3s ease-out;">
                                <div class="pm-content-scroll" style="max-height: 300px; overflow-y: auto;">
                                    ${team.roster && team.roster.length > 0 ? team.roster.map(player => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #ffffff; border-radius: 16px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 28px; height: 28px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #cbd5e1;">
                                                    <i class="fas fa-user" style="font-size: 0.6rem;"></i>
                                                </div>
                                                <span style="font-size: 0.8rem; color: #334155; font-weight: 800;">${player.name}</span>
                                            </div>
                                            <span style="font-size: 0.65rem; color: #72a800; font-weight: 950; background: rgba(114,168,0,0.08); padding: 4px 10px; border-radius: 20px;">${player.pts} pts</span>
                                        </div>
                                    `).join('') : '<p style="color:#666; text-align:center;">No hay jugadores disponibles</p>'}
                                </div>
                                <button onclick="window.open('${getShareUrl('roster')}', '_blank')" style="${shareBtnStyle}">
                                    <i class="fab fa-whatsapp"></i> COMPARTIR JUGADORES
                                </button>
                            </div>

                            <!-- 📅 JORNADAS SECTION -->
                            <div id="tab-jornadas" style="display: none; animation: fadeIn 0.3s ease-out;">
                                <div class="pm-content-scroll" style="max-height: 300px; overflow-y: auto;">
                                    ${team.schedule && team.schedule.length > 0 ? team.schedule.map(m => {
                                        const res = (window.TeamView && typeof window.TeamView.getMatchResult === 'function')
                                            ? window.TeamView.getMatchResult(m)
                                            : { valid: false };
                                        
                                        const isWin = res.valid && res.isWin;
                                        const isLoss = res.valid && res.isLoss;
                                        const accentColor = m.status !== 'completed' ? '#0088cc' : (isWin ? '#72a800' : (isLoss ? '#ef4444' : '#64748b'));
                                        
                                        return `
                                        <div style="display: flex; align-items: center; gap: 12px; padding: 15px; margin-bottom: 10px; 
                                                    background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9;
                                                    border-left: 5px solid ${accentColor}; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                            
                                            <div style="width: 45px; text-align: center; border-right: 1px solid #f1f5f9; padding-right: 12px; flex-shrink:0;">
                                                <div style="font-size: 0.8rem; color: ${accentColor}; font-weight: 950;">J${m.j}</div>
                                                <div style="font-size: 0.5rem; color: #94a3b8; font-weight: 900;">${m.date}</div>
                                            </div>

                                            <div style="flex: 1;">
                                                <div style="font-size: 0.8rem; color: #1e293b; font-weight: 900; margin-bottom: 3px; line-height: 1.1;">
                                                    ${m.opponent}
                                                </div>
                                                <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 700;">
                                                    ${m.venue} • ${m.time}h
                                                </div>
                                            </div>

                                            <div style="text-align: right; min-width: 60px;">
                                                ${m.status === 'completed' ? `
                                                    <div style="font-size: 1.1rem; font-weight: 950; color: ${accentColor}; letter-spacing: -0.5px;">${m.score}</div>
                                                ` : `
                                                    <div style="font-size: 0.55rem; font-weight: 950; color: white; background: #0088cc; padding: 5px 8px; border-radius: 8px;">PENDIENTE</div>
                                                `}
                                            </div>
                                        </div>
                                        `;
                                    }).join('') : '<p style="color:#666; text-align:center;">No hay jornadas programadas</p>'}
                                </div>
                                <button onclick="window.open('${getShareUrl('jornadas')}', '_blank')" style="${shareBtnStyle}">
                                    <i class="fab fa-whatsapp"></i> COMPARTIR JORNADAS
                                </button>
                            </div>

                            <!-- 📊 CLASIFICACIÓN AVANZADA SECTION -->
                            <div id="tab-class" style="display: none; animation: fadeIn 0.3s ease-out;">
                                <div class="pm-content-scroll" style="max-height: 300px; overflow-y: auto; background: #ffffff; border-radius: 20px; padding: 10px; border: 1px solid #f1f5f9;">
                                    <table style="width: 100%; border-collapse: separate; border-spacing: 0 5px; text-align: center; font-size: 0.7rem;">
                                        <thead>
                                            <tr style="color: #94a3b8; font-weight: 900; text-transform: uppercase;">
                                                <th style="padding: 10px; text-align: left; font-size: 0.55rem;">Equipo</th>
                                                <th style="padding: 10px 5px; color: #72a800;">Pts</th>
                                                <th style="padding: 10px 5px;">PJ</th>
                                                <th style="padding: 10px 5px;">Dif</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${team.groupStandings ? team.groupStandings.map((s, idx) => `
                                                <tr style="background: ${s.isCurrent ? 'rgba(114,168,0,0.05)' : 'transparent'};">
                                                    <td style="padding: 10px; text-align: left; font-weight: 800; border-radius: 12px 0 0 12px;">
                                                        <div style="display: flex; align-items: center; gap: 8px;">
                                                            <span style="color: ${idx === 0 ? '#eab308' : '#cbd5e1'}; font-weight: 950; width: 12px;">${s.pos}</span>
                                                            <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${s.isCurrent ? 'font-weight: 950; color: #0f172a;' : ''}">${s.team}</span>
                                                        </div>
                                                    </td>
                                                    <td style="padding: 10px 5px; font-weight: 950; color: ${s.isCurrent ? '#72a800' : '#1e293b'};">${s.pts || 0}</td>
                                                    <td style="padding: 10px 5px; color: #94a3b8;">${s.pj || 0}</td>
                                                    <td style="padding: 10px 5px; color: ${(s.df || 0) > 0 ? '#10b981' : (s.df || 0) < 0 ? '#ef4444' : '#94a3b8'}; font-weight: 950; border-radius: 0 12px 12px 0;">${(s.df || 0) > 0 ? '+' : ''}${s.df || 0}</td>
                                                </tr>
                                            `).join('') : ''}
                                        </tbody>
                                    </table>
                                </div>
                                <button onclick="window.open('${getShareUrl('tabla')}', '_blank')" style="${shareBtnStyle}">
                                    <i class="fab fa-whatsapp"></i> COMPARTIR TABLA
                                </button>
                            </div>

                            <!-- ℹ️ INFO EQUIPO SECTION -->
                            <div id="tab-info" style="display: none; animation: fadeIn 0.3s ease-out;">
                                <div class="pm-content-scroll" style="max-height: 300px; overflow-y: auto;">
                                    <!-- CAPITANES -->
                                    <div style="background: #ffffff; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 12px;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                                            <i class="fas fa-user-tie" style="color: #f59e0b;"></i>
                                            <span style="font-size: 0.75rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Liderazgo</span>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Capitán</div>
                                            <div style="font-size: 0.9rem; font-weight: 900; color: #1e293b;">
                                                ${(team.name.includes('3MB') || team.name.includes('3M B')) ? 'Miguel Ángel Méndez Ruiz' : 
                                                  (team.name.includes('3MA') || team.name.includes('3M A')) ? 'Abraham Rosell' : (team.captain || 'Pendiente')}
                                            </div>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Subcapitán</div>
                                            <div style="font-size: 0.9rem; font-weight: 900; color: #1e293b;">
                                                ${(team.name.includes('3MB') || team.name.includes('3M B')) ? 'Alex Cuadra Cabezas' : 
                                                  (team.name.includes('3MA') || team.name.includes('3M A')) ? 'Miquel Muñoz' : 
                                                  (team.name.includes('4MA') || team.name.includes('4M A') || team.name === 'SOMOS PÁDEL BCN 4M') ? 'Alejandro Coscolín' : 'Por definir'}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- SEDE Y HORARIOS -->
                                    <div style="background: #ffffff; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 12px;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                                            <i class="fas fa-clock" style="color: #72a800;"></i>
                                            <span style="font-size: 0.75rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Horario y Sede</span>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Partidos en Casa</div>
                                            <div style="font-size: 0.9rem; font-weight: 900; color: #72a800;">
                                                Sábados • ${ (team.name.includes('3MA') || team.name.includes('3M A')) ? '13:30h' : '16:30h' }
                                            </div>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Club</div>
                                            <div style="font-size: 0.85rem; font-weight: 800; color: #1e293b;">Padel BCN - El Prat</div>
                                            <div style="font-size: 0.65rem; color: #64748b; line-height: 1.4; margin-top: 4px;">B-250, Parc del Riu 3-4, 08820, Prat del Llobregat</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Competición</div>
                                            <div style="font-size: 0.85rem; font-weight: 800; color: #1e293b;">Lliga Guinotprunera 2026</div>
                                            <div style="font-size: 0.65rem; color: #72a800; font-weight: 900; margin-top: 2px;">Masculina - Tercera (Costa Sud)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <a href="${officialLink}" target="_blank" onclick="event.stopPropagation();" 
                           style="text-decoration: none; width: 100%; padding: 18px; margin-top: 10px; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; border: none; border-radius: 20px; font-weight: 950; cursor: pointer; font-size: 0.8rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2); transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fas fa-external-link-alt" style="color: #72a800;"></i> FICHA COMPLETA SUMMAPADEL
                        </a>
                    </div>

                    <style>
                        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                    </style>
                `,
                type: 'info'
            });
        }

        switchTab(btn, tabId, bgColor = '#ffffff', textColor = '#0f172a') {
            // Get all buttons in the same pill container
            const container = btn.parentElement;
            const buttons = container.querySelectorAll('button');
            
            // Update buttons style
            buttons.forEach(b => {
                b.style.background = 'transparent';
                b.style.color = '#64748b';
                b.style.boxShadow = 'none';
                b.style.fontWeight = '800';
            });

            btn.style.background = bgColor;
            btn.style.color = textColor;
            btn.style.boxShadow = `0 4px 12px ${bgColor}40`;
            btn.style.fontWeight = '950';

            // Hide all tabs
            const contentArea = document.getElementById('team-modal-tabs-content');
            const tabs = contentArea.children;
            for(let tab of tabs) {
                tab.style.display = 'none';
            }

            // Show selected tab
            const target = document.getElementById(tabId);
            if(target) target.style.display = 'block';
            
            // Haptic feedback if available
            if(window.navigator.vibrate) window.navigator.vibrate(10);
        }
    }

    window.TeamController = new TeamController();
})();
