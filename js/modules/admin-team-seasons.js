/**
 * admin-team-seasons.js
 * Módulo de Administración Multi-Temporada para Equipos del Club (SomosPádel Barcelona)
 *
 * Permite al Administrador:
 * 1. Archivar la Temporada 2026 (congelando resultados, estadísticas y plantillas).
 * 2. Crear y activar la Temporada 2027 (y futuras temporadas).
 * 3. Gestionar equipos y plantillas de cada temporada (añadir/quitar jugadores, mover de equipo,
 *    importar inscritos confirmados desde la Campaña de Temporada 2027).
 * 4. Consultar y exportar a CSV el registro completo de participantes por temporada:
 *    Renovados, Nuevos Fichajes, Cambios de Equipo y Bajas, con % de retención del club.
 * 5. Sincronizar `teamHistory` y `teams_somospadel` en los perfiles de jugadores (`players`).
 *
 * Registrado en `window.AdminViews.team_seasons` y `window.AdminTeamSeasons`.
 */
(function () {
    'use strict';

    window.AdminViews = window.AdminViews || {};

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normName(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    class AdminTeamSeasonsController {
        constructor() {
            this.seasons = [];
            this.selectedSeasonId = '2026';
            this.activeTab = 'teams'; // 'teams' | 'movements' | 'summary'
            this.teams = [];
            this.previousTeams = [];
            this.previousSeasonId = null;
            this.movements = null;
            this.campaignInscriptions = [];
            this.statusFilter = 'all';
            this.teamFilter = 'all';
            this.searchQuery = '';
            this.editingTeamId = null;
            this.isLoading = false;
        }

        async init() {
            const contentArea = document.getElementById('content-area');
            if (!contentArea) return;

            // 1. Pintado INSTANTÁNEO (0ms) con datos locales/caché para evitar cualquier spinner colgado
            this._hydrateLocalInstant();
            this._safeRender(contentArea);

            // 2. Refresco silencioso desde Firestore en segundo plano
            try {
                await this.loadData(true);
            } catch (err) {
                console.error('❌ [AdminTeamSeasons] Error refrescando desde Firestore:', err);
            }
            this._safeRender(contentArea);
        }

        _hydrateLocalInstant() {
            const svc = window.TeamSeasonService;
            if (svc) {
                this.seasons = svc.getSeasonsSync();
                if (!this.seasons || this.seasons.length === 0) {
                    this.seasons = [{ id: '2026', label: 'Temporada 2026', status: 'active', isDefault: true, summary: {} }];
                }
                if (!this.seasons.some(s => String(s.id) === String(this.selectedSeasonId))) {
                    this.selectedSeasonId = svc.getActiveSeasonId();
                }
                if (this.teams.length === 0 && Array.isArray(window.ClubTeamsData) && window.ClubTeamsData.length > 0) {
                    this.teams = JSON.parse(JSON.stringify(window.ClubTeamsData));
                }
                this.movements = svc.computeSeasonMovements(this.teams, this.previousTeams || []);
            } else {
                this.seasons = [{ id: '2026', label: 'Temporada 2026', status: 'active', isDefault: true, summary: {} }];
                this.teams = Array.isArray(window.ClubTeamsData) ? JSON.parse(JSON.stringify(window.ClubTeamsData)) : [];
            }
        }

        _safeRender(contentArea) {
            try {
                this.render();
            } catch (renderErr) {
                console.error('❌ [AdminTeamSeasons] Error renderizando vista:', renderErr);
                if (contentArea) {
                    contentArea.innerHTML = `
                        <div style="padding:24px;max-width:720px;margin:24px auto;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;color:#991b1b;font-family:'Outfit',sans-serif;">
                            <h3 style="margin:0 0 8px;">Error al renderizar el Gestor de Temporadas</h3>
                            <p style="margin:0;font-size:0.85rem;">${esc(renderErr.message || String(renderErr))}</p>
                        </div>
                    `;
                }
            }
        }

        async loadData(forceRefresh = false) {
            this.isLoading = true;
            try {
                const svc = window.TeamSeasonService;
                if (!svc) throw new Error('TeamSeasonService no cargado.');

                this.seasons = await svc.getSeasons(forceRefresh);
                if (!this.seasons.some(s => String(s.id) === String(this.selectedSeasonId))) {
                    this.selectedSeasonId = svc.getActiveSeasonId();
                }

                this.teams = await svc.getSeasonTeams(this.selectedSeasonId, forceRefresh);
                this.previousSeasonId = svc.getPreviousSeasonId(this.selectedSeasonId);
                this.previousTeams = this.previousSeasonId
                    ? await svc.getSeasonTeams(this.previousSeasonId, forceRefresh)
                    : [];

                this.movements = svc.computeSeasonMovements(this.teams, this.previousTeams);

                // Cargar inscripciones de campaña 2027 con timeout corto para que nunca bloquee la vista
                if (window.SeasonCampaignService && typeof window.SeasonCampaignService.getAllInscriptions === 'function') {
                    try {
                        this.campaignInscriptions = await Promise.race([
                            window.SeasonCampaignService.getAllInscriptions(),
                            new Promise(resolve => setTimeout(() => resolve([]), 2500))
                        ]);
                    } catch (e) {
                        this.campaignInscriptions = [];
                    }
                }
            } catch (err) {
                console.error('❌ [AdminTeamSeasons] Error cargando datos:', err);
                // Fallback local garantizado para que nunca quede vacío
                if (this.seasons.length === 0) {
                    this.seasons = [{ id: '2026', label: 'Temporada 2026', status: 'active', isDefault: true, summary: {} }];
                }
                if (this.teams.length === 0 && Array.isArray(window.ClubTeamsData)) {
                    this.teams = window.ClubTeamsData;
                }
                if (!this.movements && window.TeamSeasonService) {
                    this.movements = window.TeamSeasonService.computeSeasonMovements(this.teams, []);
                }
            } finally {
                this.isLoading = false;
            }
        }

        async selectSeason(seasonId) {
            this.selectedSeasonId = String(seasonId);
            this.editingTeamId = null;
            this.teamFilter = 'all';
            await this.loadData(true);
            this.render();
        }

        setTab(tab) {
            this.activeTab = tab;
            this.render();
        }

        setStatusFilter(status) {
            this.statusFilter = status;
            this.render();
        }

        setTeamFilter(teamId) {
            this.teamFilter = teamId;
            this.render();
        }

        setSearch(val) {
            this.searchQuery = val || '';
            this.render();
        }

        async handleArchive2026() {
            if (!confirm('¿Archivar y congelar la Temporada 2026?\n\nSe guardará una foto exacta de los equipos, puntos, resultados y plantillas actuales en el histórico (team_seasons/2026).')) {
                return;
            }
            try {
                const res = await window.TeamSeasonService.archiveSeason2026();
                alert(`✅ Temporada 2026 archivada con éxito.\nSe congelaron ${res.teamsCount} equipos y ${res.summary.playersCount} jugadores en el histórico.`);
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error archivando Temporada 2026: ' + err.message);
            }
        }

        async handleCreate2027() {
            const has2027 = this.seasons.some(s => String(s.id) === '2027');
            if (has2027) {
                alert('ℹ️ La Temporada 2027 ya existe. Selecciónala arriba para gestionarla.');
                await this.selectSeason('2027');
                return;
            }

            const copyRoster = confirm(
                '🚀 CREAR TEMPORADA 2027\n\n' +
                'Se clonará la estructura de equipos desde la Temporada 2026 con marcadores a 0.\n\n' +
                '• Pulsa ACEPTAR para copiar también las plantillas actuales (así solo quitas las bajas y añades los nuevos).\n' +
                '• Pulsa CANCELAR para crear los equipos con las plantillas vacías.'
            );

            try {
                // Primero asegurar que 2026 esté archivada para no perder histórico
                const s2026 = this.seasons.find(s => String(s.id) === '2026');
                if (!s2026 || s2026.status !== 'archived') {
                    await window.TeamSeasonService.archiveSeason2026();
                }

                const res = await window.TeamSeasonService.createSeason({
                    id: '2027',
                    label: 'Temporada 2027',
                    leagueName: 'Lliga GuinotPrunera',
                    cloneFromSeasonId: '2026',
                    copyRoster,
                    setActive: false
                });

                alert(`✅ Temporada 2027 creada en modo BORRADOR con ${res.teamsCount} equipos.\n\nAhora puedes editar las plantillas (bajas, renovaciones y nuevos fichajes) y cuando esté lista pulsar "Activar Temporada 2027".`);
                this.selectedSeasonId = '2027';
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error creando Temporada 2027: ' + err.message);
            }
        }

        async handleCreateCustomSeason() {
            const rawId = prompt('Introduce el año / ID de la nueva temporada (ej: 2028):');
            if (!rawId || !rawId.trim()) return;
            const sid = rawId.trim();
            if (this.seasons.some(s => String(s.id) === sid)) {
                alert(`La temporada ${sid} ya existe.`);
                return;
            }
            const label = prompt('Nombre visible de la temporada:', `Temporada ${sid}`) || `Temporada ${sid}`;
            const cloneFrom = this.selectedSeasonId || '2026';
            const copyRoster = confirm(`¿Copiar plantillas iniciales desde Temporada ${cloneFrom}?`);

            try {
                await window.TeamSeasonService.createSeason({
                    id: sid,
                    label,
                    leagueName: 'Lliga GuinotPrunera',
                    cloneFromSeasonId: cloneFrom,
                    copyRoster,
                    setActive: false
                });
                this.selectedSeasonId = sid;
                await this.loadData(true);
                this.render();
                alert(`✅ ${label} creada en borrador.`);
            } catch (err) {
                alert('❌ Error creando temporada: ' + err.message);
            }
        }

        async handleActivateSeason(seasonId) {
            const target = this.seasons.find(s => String(s.id) === String(seasonId));
            const label = target ? target.label : `Temporada ${seasonId}`;
            if (!confirm(`¿Activar ${label} como la temporada EN CURSO?\n\n• Pasará a ser la temporada principal en la app (EQUIPOS).\n• El Robot Summapadel sincronizará sobre esta temporada.\n• Las temporadas anteriores quedarán archivadas en modo histórico.`)) {
                return;
            }
            try {
                await window.TeamSeasonService.setActiveSeason(seasonId);
                alert(`✅ ¡${label} ACTIVADA!\nLos jugadores ya verán esta temporada por defecto y podrán consultar el histórico desde el selector.`);
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error activando temporada: ' + err.message);
            }
        }

        async handleSyncPlayersHistory() {
            const target = this.seasons.find(s => String(s.id) === String(this.selectedSeasonId));
            const label = target ? target.label : `Temporada ${this.selectedSeasonId}`;
            if (!confirm(`¿Sincronizar el historial de ${label} en las fichas de jugadores (colección players)?\n\nEsto guarda en qué equipo jugó cada jugador en ${label} y, si es la temporada activa, actualiza su equipo oficial en la app.`)) {
                return;
            }
            try {
                const res = await window.TeamSeasonService.syncPlayersSeasonHistory(this.selectedSeasonId, this.teams);
                alert(`✅ Sincronización completada.\nSe actualizaron ${res.matched} perfiles de jugadores vinculados.`);
            } catch (err) {
                alert('❌ Error sincronizando jugadores: ' + err.message);
            }
        }

        openNewTeamPrompt() {
            const name = prompt('Nombre oficial del nuevo equipo (ej: SOMOS PÁDEL BCN 2FA):');
            if (!name || !name.trim()) return;
            const category = prompt('Categoría (Masculina / Femenina / Mixta):', 'Femenina') || 'Masculina';
            const division = prompt('División (ej: Segunda, Tercera, Cuarta):', 'Segunda') || 'Tercera';
            const captain = prompt('Capitán/a (o deja "Por definir"):', 'Por definir') || 'Por definir';

            const slug = name.trim().toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            const newTeam = {
                id: slug,
                name: name.trim().toUpperCase(),
                category: category.trim(),
                division: division.trim(),
                group: `Temporada ${this.selectedSeasonId}`,
                captain: captain.trim(),
                subcaptain: 'Por definir',
                logo: 'img/logo_somospadel.png',
                ranking: 0,
                points: 0,
                stats: { pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, df: 0 },
                standings: [],
                schedule: [],
                roster: []
            };

            window.TeamSeasonService.saveTeamToSeason(this.selectedSeasonId, newTeam)
                .then(async () => {
                    await this.loadData(true);
                    this.editingTeamId = newTeam.id;
                    this.render();
                })
                .catch(err => alert('❌ Error creando equipo: ' + err.message));
        }

        toggleEditTeam(teamId) {
            this.editingTeamId = this.editingTeamId === teamId ? null : teamId;
            this.render();
        }

        async saveTeamMeta(teamId) {
            const team = this.teams.find(t => t.id === teamId);
            if (!team) return;

            const nameEl = document.getElementById(`ats-name-${teamId}`);
            const catEl = document.getElementById(`ats-cat-${teamId}`);
            const divEl = document.getElementById(`ats-div-${teamId}`);
            const capEl = document.getElementById(`ats-cap-${teamId}`);
            const subEl = document.getElementById(`ats-sub-${teamId}`);

            const updated = {
                ...team,
                name: nameEl ? nameEl.value.trim() : team.name,
                category: catEl ? catEl.value : team.category,
                division: divEl ? divEl.value.trim() : team.division,
                captain: capEl ? capEl.value.trim() : team.captain,
                subcaptain: subEl ? subEl.value.trim() : team.subcaptain
            };

            try {
                await window.TeamSeasonService.saveTeamToSeason(this.selectedSeasonId, updated);
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error guardando equipo: ' + err.message);
            }
        }

        async deleteTeam(teamId) {
            const team = this.teams.find(t => t.id === teamId);
            if (!team) return;
            if (!confirm(`¿Eliminar el equipo "${team.name}" de la Temporada ${this.selectedSeasonId}?`)) return;
            try {
                await window.TeamSeasonService.deleteTeamFromSeason(this.selectedSeasonId, teamId);
                this.editingTeamId = null;
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error eliminando equipo: ' + err.message);
            }
        }

        async addPlayerToTeam(teamId, playerNameInput = null) {
            const team = this.teams.find(t => t.id === teamId);
            if (!team) return;

            let playerName = playerNameInput;
            if (!playerName) {
                const input = document.getElementById(`ats-add-player-${teamId}`);
                playerName = input ? input.value.trim() : '';
            }
            if (!playerName) return;

            const roster = Array.isArray(team.roster) ? [...team.roster] : [];
            if (roster.some(p => normName(p.name) === normName(playerName))) {
                alert(`"${playerName}" ya está en la plantilla de ${team.name}.`);
                return;
            }

            roster.push({
                name: playerName,
                pts: 0,
                seasonStatus: 'fichaje'
            });

            try {
                await window.TeamSeasonService.saveTeamToSeason(this.selectedSeasonId, { ...team, roster });
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error añadiendo jugador: ' + err.message);
            }
        }

        async removePlayerFromTeam(teamId, playerName) {
            const team = this.teams.find(t => t.id === teamId);
            if (!team) return;
            const roster = (team.roster || []).filter(p => normName(p.name) !== normName(playerName));
            try {
                await window.TeamSeasonService.saveTeamToSeason(this.selectedSeasonId, { ...team, roster });
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error quitando jugador: ' + err.message);
            }
        }

        async movePlayerToAnotherTeam(fromTeamId, playerName, toTeamId) {
            if (!toTeamId || fromTeamId === toTeamId) return;
            const fromTeam = this.teams.find(t => t.id === fromTeamId);
            const toTeam = this.teams.find(t => t.id === toTeamId);
            if (!fromTeam || !toTeam) return;

            const playerObj = (fromTeam.roster || []).find(p => normName(p.name) === normName(playerName)) || { name: playerName, pts: 0 };
            const newFromRoster = (fromTeam.roster || []).filter(p => normName(p.name) !== normName(playerName));
            const newToRoster = Array.isArray(toTeam.roster) ? [...toTeam.roster] : [];

            if (!newToRoster.some(p => normName(p.name) === normName(playerName))) {
                newToRoster.push({ ...playerObj, seasonStatus: 'cambio_equipo' });
            }

            try {
                await window.TeamSeasonService.saveTeamToSeason(this.selectedSeasonId, { ...fromTeam, roster: newFromRoster });
                await window.TeamSeasonService.saveTeamToSeason(this.selectedSeasonId, { ...toTeam, roster: newToRoster });
                await this.loadData(true);
                this.render();
            } catch (err) {
                alert('❌ Error moviendo jugador: ' + err.message);
            }
        }

        exportCSV() {
            const current = this.seasons.find(s => String(s.id) === String(this.selectedSeasonId));
            const prev = this.previousSeasonId ? this.seasons.find(s => String(s.id) === String(this.previousSeasonId)) : null;
            window.TeamSeasonService.exportMovementsCSV(
                current ? current.label : `Temporada ${this.selectedSeasonId}`,
                prev ? prev.label : (this.previousSeasonId ? `Temporada ${this.previousSeasonId}` : 'Anterior'),
                this.movements
            );
        }

        openBulkImportUpload() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    try {
                        const payload = JSON.parse(ev.target.result);
                        const preview = await window.TeamSeasonService.applyBulkSeasonImport(payload, { dryRun: true });
                        const msg =
                            `📊 VISTA PREVIA IMPORTACIÓN ${payload.label || ('TEMPORADA ' + payload.seasonId)}\n\n` +
                            `• Equipos a cargar: ${preview.teamsCount}\n` +
                            `• Nuevos jugadores a crear en BD: ${preview.createCount}\n` +
                            `• Jugadores existentes a actualizar (siguen/cambian): ${preview.updateCount}\n` +
                            `• Bajas a las que se RETIRARÁ permiso de equipo: ${preview.revokeCount}\n\n` +
                            `Además, la Temporada 2026 quedará archivada para siempre.\n\n` +
                            `¿Confirmas aplicar estos cambios masivos en Firebase?`;

                        if (!confirm(msg)) return;
                        const activate = confirm(`¿Quieres ACTIVAR ${payload.label || ('Temporada ' + payload.seasonId)} como temporada en curso en la app ahora mismo?\n\n(Aceptar = Activar ya | Cancelar = Dejar en Borrador para revisar)`);
                        const applied = await window.TeamSeasonService.applyBulkSeasonImport(payload, { dryRun: false, activateSeason: activate });
                        alert(
                            `✅ ¡IMPORTACIÓN COMPLETADA!\n\n` +
                            `• Equipos guardados: ${applied.teamsCount}\n` +
                            `• Nuevos jugadores creados: ${applied.createCount}\n` +
                            `• Jugadores actualizados: ${applied.updateCount}\n` +
                            `• Permisos de equipo retirados (bajas): ${applied.revokeCount}`
                        );
                        this.selectedSeasonId = String(payload.seasonId);
                        await this.loadData(true);
                        this.render();
                    } catch (err) {
                        alert('❌ Error en importación masiva: ' + err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }

        render() {
            const contentArea = document.getElementById('content-area');
            if (!contentArea) return;

            const currentSeason = this.seasons.find(s => String(s.id) === String(this.selectedSeasonId)) || {
                id: this.selectedSeasonId,
                label: `Temporada ${this.selectedSeasonId}`,
                status: 'active'
            };
            const isArchived = currentSeason.status === 'archived';
            const isActive = currentSeason.status === 'active' || currentSeason.isDefault;
            const has2027 = this.seasons.some(s => String(s.id) === '2027');
            const m = this.movements || { hasPrevious: false, global: { totalCurrent: 0, totalPrevious: 0, stayedCount: 0, switchedCount: 0, joinedCount: 0, leftCount: 0, retentionRate: 100 }, byTeam: {}, players: [] };
            const g = m.global;

            contentArea.innerHTML = `
                <div style="padding: 18px 20px 60px; max-width: 1320px; margin: 0 auto; color: #f8fafc; font-family: 'Outfit', sans-serif;">

                    <!-- CABECERA PRINCIPAL -->
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #0f172a 100%); border: 1px solid rgba(204,255,0,0.28); border-radius: 20px; padding: 22px 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(204,255,0,0.12);border:1px solid rgba(204,255,0,0.35);color:#ccff00;padding:4px 12px;border-radius:999px;font-size:0.7rem;font-weight:900;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:8px;">
                                <i class="fas fa-layer-group"></i> HISTÓRICO Y GESTIÓN MULTI-TEMPORADA
                            </div>
                            <h1 style="margin:0;font-size:1.6rem;font-weight:950;letter-spacing:-0.4px;">Temporadas de Equipos & Registro de Jugadores</h1>
                            <p style="margin:6px 0 0;color:#94a3b8;font-size:0.86rem;">
                                Archiva la <strong>Temporada 2026</strong>, prepara la <strong>Temporada 2027</strong> y controla renovaciones, altas, cambios de equipo y bajas.
                            </p>
                        </div>

                        <div style="display:flex;gap:10px;flex-wrap:wrap;">
                            <button onclick="window.AdminTeamSeasons.openBulkImportUpload()"
                                    style="background:rgba(56,189,248,0.16);color:#38bdf8;border:1px solid rgba(56,189,248,0.45);padding:10px 15px;border-radius:12px;font-weight:900;font-size:0.8rem;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">
                                <i class="fas fa-file-import"></i> Importar Paquete Excel 2027
                            </button>
                            <button onclick="window.AdminTeamSeasons.handleArchive2026()"
                                    style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.45);padding:10px 15px;border-radius:12px;font-weight:800;font-size:0.8rem;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">
                                <i class="fas fa-box-archive"></i> Archivar Temp. 2026
                            </button>
                            ${!has2027 ? `
                                <button onclick="window.AdminTeamSeasons.handleCreate2027()"
                                        style="background:#ccff00;color:#0f172a;border:none;padding:10px 16px;border-radius:12px;font-weight:950;font-size:0.82rem;cursor:pointer;display:inline-flex;align-items:center;gap:7px;box-shadow:0 6px 20px rgba(204,255,0,0.28);">
                                    <i class="fas fa-rocket"></i> Crear Temporada 2027
                                </button>
                            ` : `
                                <button onclick="window.AdminTeamSeasons.handleCreateCustomSeason()"
                                        style="background:rgba(56,189,248,0.16);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);padding:10px 15px;border-radius:12px;font-weight:800;font-size:0.8rem;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">
                                    <i class="fas fa-plus"></i> Nueva Temporada
                                </button>
                            `}
                        </div>
                    </div>

                    <!-- SELECTOR DE TEMPORADAS -->
                    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
                        ${this.seasons.map(s => {
                            const selected = String(s.id) === String(this.selectedSeasonId);
                            const badgeColor = s.status === 'active' ? '#10b981' : (s.status === 'archived' ? '#f59e0b' : '#38bdf8');
                            const badgeText = s.status === 'active' ? 'EN CURSO' : (s.status === 'archived' ? 'ARCHIVADA' : 'BORRADOR');
                            const sum = s.summary || {};
                            return `
                                <div onclick="window.AdminTeamSeasons.selectSeason('${esc(s.id)}')"
                                     style="flex:1;min-width:220px;max-width:340px;cursor:pointer;background:${selected ? 'linear-gradient(135deg, rgba(204,255,0,0.14), rgba(15,23,42,0.95))' : '#0f172a'};border:${selected ? '2px solid #ccff00' : '1px solid rgba(255,255,255,0.1)'};border-radius:16px;padding:14px 16px;transition:all 0.18s;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                        <span style="font-size:1.05rem;font-weight:950;color:#fff;">${esc(s.label || ('Temporada ' + s.id))}</span>
                                        <span style="font-size:0.65rem;font-weight:900;padding:3px 8px;border-radius:999px;background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}66;">${badgeText}</span>
                                    </div>
                                    <div style="font-size:0.78rem;color:#94a3b8;display:flex;gap:12px;">
                                        <span><i class="fas fa-shield-alt" style="color:#ccff00;"></i> ${sum.teamsCount ?? '-'} equipos</span>
                                        <span><i class="fas fa-users" style="color:#38bdf8;"></i> ${sum.playersCount ?? '-'} jugadores</span>
                                        <span><i class="fas fa-trophy" style="color:#f59e0b;"></i> ${sum.clubPoints ?? 0} pts</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- BARRA DE ESTADO DE LA TEMPORADA SELECCIONADA -->
                    <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                            <span style="font-size:1rem;font-weight:900;color:#fff;">
                                Editando / Consultando: <span style="color:#ccff00;">${esc(currentSeason.label)}</span>
                            </span>
                            ${this.previousSeasonId ? `
                                <span style="font-size:0.76rem;color:#94a3b8;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:8px;">
                                    Comparando movimientos frente a <strong>Temporada ${esc(this.previousSeasonId)}</strong>
                                </span>
                            ` : `
                                <span style="font-size:0.76rem;color:#94a3b8;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:8px;">
                                    Temporada base del histórico
                                </span>
                            `}
                        </div>

                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            ${!isActive ? `
                                <button onclick="window.AdminTeamSeasons.handleActivateSeason('${esc(currentSeason.id)}')"
                                        style="background:#10b981;color:#fff;border:none;padding:8px 14px;border-radius:10px;font-weight:900;font-size:0.78rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                    <i class="fas fa-check-circle"></i> Activar ${esc(currentSeason.label)} en la App
                                </button>
                            ` : `
                                <span style="background:rgba(16,185,129,0.16);color:#34d399;border:1px solid rgba(16,185,129,0.4);padding:8px 12px;border-radius:10px;font-weight:800;font-size:0.76rem;">
                                    <i class="fas fa-broadcast-tower"></i> Temporada Activa en la App
                                </span>
                            `}
                            <button onclick="window.AdminTeamSeasons.handleSyncPlayersHistory()"
                                    style="background:rgba(139,92,246,0.16);color:#c4b5fd;border:1px solid rgba(139,92,246,0.4);padding:8px 13px;border-radius:10px;font-weight:800;font-size:0.78rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                <i class="fas fa-sync"></i> Guardar Historial en Jugadores
                            </button>
                            <button onclick="window.AdminTeamSeasons.exportCSV()"
                                    style="background:rgba(255,255,255,0.06);color:#e2e8f0;border:1px solid rgba(255,255,255,0.14);padding:8px 13px;border-radius:10px;font-weight:800;font-size:0.78rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                <i class="fas fa-file-csv"></i> Exportar Registro CSV
                            </button>
                        </div>
                    </div>

                    <!-- KPIs DE PARTICIPACIÓN Y RETENCIÓN -->
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(155px, 1fr));gap:12px;margin-bottom:20px;">
                        ${this._kpiCard('Participantes', g.totalCurrent, '#ffffff', 'fa-users')}
                        ${this._kpiCard(m.hasPrevious ? 'Renovados' : 'En Plantilla', g.stayedCount, '#10b981', 'fa-user-check')}
                        ${this._kpiCard('Nuevos Fichajes', g.joinedCount, '#38bdf8', 'fa-user-plus')}
                        ${this._kpiCard('Cambios Equipo', g.switchedCount, '#a78bfa', 'fa-right-left')}
                        ${this._kpiCard('Bajas', g.leftCount, '#f87171', 'fa-user-minus')}
                        ${this._kpiCard('Retención Club', g.retentionRate + '%', '#ccff00', 'fa-chart-line')}
                    </div>

                    <!-- PESTAÑAS INTERNAS -->
                    <div style="display:flex;gap:8px;margin-bottom:18px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;flex-wrap:wrap;">
                        <button onclick="window.AdminTeamSeasons.setTab('teams')"
                                style="padding:9px 16px;border-radius:10px;border:none;font-weight:900;font-size:0.82rem;cursor:pointer;background:${this.activeTab === 'teams' ? '#ccff00' : 'rgba(255,255,255,0.06)'};color:${this.activeTab === 'teams' ? '#0f172a' : '#cbd5e1'};">
                            <i class="fas fa-shield-alt"></i> Equipos y Plantillas (${this.teams.length})
                        </button>
                        <button onclick="window.AdminTeamSeasons.setTab('movements')"
                                style="padding:9px 16px;border-radius:10px;border:none;font-weight:900;font-size:0.82rem;cursor:pointer;background:${this.activeTab === 'movements' ? '#ccff00' : 'rgba(255,255,255,0.06)'};color:${this.activeTab === 'movements' ? '#0f172a' : '#cbd5e1'};">
                            <i class="fas fa-clipboard-list"></i> Registro de Jugadores (${m.players.length})
                        </button>
                        <button onclick="window.AdminTeamSeasons.setTab('summary')"
                                style="padding:9px 16px;border-radius:10px;border:none;font-weight:900;font-size:0.82rem;cursor:pointer;background:${this.activeTab === 'summary' ? '#ccff00' : 'rgba(255,255,255,0.06)'};color:${this.activeTab === 'summary' ? '#0f172a' : '#cbd5e1'};">
                            <i class="fas fa-chart-bar"></i> Movimientos por Equipo
                        </button>
                    </div>

                    <!-- CONTENIDO DE PESTAÑA -->
                    ${this.activeTab === 'teams' ? this._renderTeamsTab(isArchived) : ''}
                    ${this.activeTab === 'movements' ? this._renderMovementsTab(m) : ''}
                    ${this.activeTab === 'summary' ? this._renderSummaryTab(m) : ''}
                </div>
            `;
        }

        _kpiCard(label, value, color, icon) {
            return `
                <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 16px;">
                    <div style="font-size:0.7rem;color:#94a3b8;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <i class="fas ${icon}" style="color:${color};"></i> ${label}
                    </div>
                    <div style="font-size:1.55rem;font-weight:950;color:${color};line-height:1;">${value}</div>
                </div>
            `;
        }

        _renderTeamsTab(isArchived) {
            const confirmedCampaign = (this.campaignInscriptions || []).filter(i => (i.status || '').toLowerCase() !== 'cancelled');
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
                    <div style="font-size:0.84rem;color:#94a3b8;">
                        ${isArchived
                            ? '<i class="fas fa-lock" style="color:#f59e0b;"></i> Temporada archivada (puedes consultarla o editar correcciones si lo necesitas).'
                            : 'Gestiona los equipos y las plantillas de esta temporada. Los movimientos se calculan automáticamente.'}
                    </div>
                    <button onclick="window.AdminTeamSeasons.openNewTeamPrompt()"
                            style="background:#0ea5e9;color:#fff;border:none;padding:9px 14px;border-radius:10px;font-weight:900;font-size:0.8rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                        <i class="fas fa-plus"></i> Añadir Equipo a Temporada ${esc(this.selectedSeasonId)}
                    </button>
                </div>

                ${this.teams.length === 0 ? `
                    <div style="background:#0f172a;border:1px dashed rgba(255,255,255,0.16);border-radius:16px;padding:36px;text-align:center;color:#94a3b8;">
                        No hay equipos configurados todavía en esta temporada.
                    </div>
                ` : `
                    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:14px;">
                        ${this.teams.map(t => this._renderTeamAdminCard(t, confirmedCampaign)).join('')}
                    </div>
                `}
            `;
        }

        _renderTeamAdminCard(team, confirmedCampaign) {
            const isEditing = this.editingTeamId === team.id;
            const roster = team.roster || [];
            const tm = this.movements && this.movements.byTeam ? this.movements.byTeam[team.id] : null;
            const otherTeams = this.teams.filter(x => x.id !== team.id);

            return `
                <div style="background:#0f172a;border:${isEditing ? '1.5px solid #ccff00' : '1px solid rgba(255,255,255,0.09)'};border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                        <div>
                            <div style="font-size:1rem;font-weight:950;color:#fff;">${esc(team.name)}</div>
                            <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">
                                ${esc(team.category || '')} • ${esc(team.division || '')} • <i class="fas fa-crown" style="color:#f59e0b;"></i> ${esc(team.captain || 'Por definir')}
                            </div>
                        </div>
                        <button onclick="window.AdminTeamSeasons.toggleEditTeam('${esc(team.id)}')"
                                style="background:${isEditing ? '#ccff00' : 'rgba(255,255,255,0.08)'};color:${isEditing ? '#0f172a' : '#fff'};border:none;padding:6px 11px;border-radius:8px;font-weight:800;font-size:0.74rem;cursor:pointer;">
                            <i class="fas ${isEditing ? 'fa-chevron-up' : 'fa-pen'}"></i> ${isEditing ? 'Cerrar' : 'Gestionar'}
                        </button>
                    </div>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.72rem;">
                        <span style="background:rgba(255,255,255,0.06);padding:4px 9px;border-radius:8px;color:#e2e8f0;font-weight:800;">
                            👥 ${roster.length} jugadores
                        </span>
                        ${tm && this.movements.hasPrevious ? `
                            <span style="background:rgba(16,185,129,0.15);color:#34d399;padding:4px 8px;border-radius:8px;font-weight:800;">✓ ${tm.stayed.length} siguen</span>
                            <span style="background:rgba(56,189,248,0.15);color:#38bdf8;padding:4px 8px;border-radius:8px;font-weight:800;">+ ${tm.joined.length + tm.switchedIn.length} altas</span>
                            <span style="background:rgba(239,68,68,0.15);color:#f87171;padding:4px 8px;border-radius:8px;font-weight:800;">- ${tm.left.length + tm.switchedOut.length} bajas/salidas</span>
                        ` : ''}
                    </div>

                    ${isEditing ? `
                        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;display:flex;flex-direction:column;gap:10px;">
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                                <input id="ats-name-${esc(team.id)}" value="${esc(team.name)}" placeholder="Nombre equipo" style="grid-column:1/-1;background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 10px;border-radius:8px;font-size:0.8rem;">
                                <select id="ats-cat-${esc(team.id)}" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 10px;border-radius:8px;font-size:0.8rem;">
                                    <option value="Masculina" ${team.category === 'Masculina' ? 'selected' : ''}>Masculina</option>
                                    <option value="Femenina" ${team.category === 'Femenina' ? 'selected' : ''}>Femenina</option>
                                    <option value="Mixta" ${team.category === 'Mixta' ? 'selected' : ''}>Mixta</option>
                                </select>
                                <input id="ats-div-${esc(team.id)}" value="${esc(team.division || '')}" placeholder="División" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 10px;border-radius:8px;font-size:0.8rem;">
                                <input id="ats-cap-${esc(team.id)}" value="${esc(team.captain || '')}" placeholder="Capitán" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 10px;border-radius:8px;font-size:0.8rem;">
                                <input id="ats-sub-${esc(team.id)}" value="${esc(team.subcaptain || '')}" placeholder="Subcapitán" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 10px;border-radius:8px;font-size:0.8rem;">
                            </div>
                            <div style="display:flex;gap:8px;justify-content:space-between;">
                                <button onclick="window.AdminTeamSeasons.saveTeamMeta('${esc(team.id)}')" style="background:#10b981;color:#fff;border:none;padding:7px 12px;border-radius:8px;font-weight:800;font-size:0.76rem;cursor:pointer;">
                                    <i class="fas fa-save"></i> Guardar Datos
                                </button>
                                <button onclick="window.AdminTeamSeasons.deleteTeam('${esc(team.id)}')" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.35);padding:7px 10px;border-radius:8px;font-weight:800;font-size:0.74rem;cursor:pointer;">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>

                            <!-- AÑADIR JUGADOR -->
                            <div style="background:rgba(255,255,255,0.03);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
                                <div style="font-size:0.72rem;font-weight:800;color:#ccff00;margin-bottom:6px;">+ AÑADIR JUGADOR A PLANTILLA</div>
                                <div style="display:flex;gap:6px;">
                                    <input id="ats-add-player-${esc(team.id)}" placeholder="Nombre completo del jugador..." style="flex:1;background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 10px;border-radius:8px;font-size:0.78rem;">
                                    <button onclick="window.AdminTeamSeasons.addPlayerToTeam('${esc(team.id)}')" style="background:#ccff00;color:#0f172a;border:none;padding:7px 12px;border-radius:8px;font-weight:900;font-size:0.76rem;cursor:pointer;">Añadir</button>
                                </div>
                                ${confirmedCampaign.length > 0 ? `
                                    <div style="margin-top:8px;">
                                        <select onchange="if(this.value){ window.AdminTeamSeasons.addPlayerToTeam('${esc(team.id)}', this.value); this.value=''; }"
                                                style="width:100%;background:#1e293b;border:1px solid rgba(56,189,248,0.35);color:#38bdf8;padding:6px 9px;border-radius:8px;font-size:0.74rem;font-weight:700;">
                                            <option value="">📥 Importar desde inscritos Campaña 2027 (${confirmedCampaign.length})...</option>
                                            ${confirmedCampaign.map(c => `<option value="${esc(c.name)}">${esc(c.name)} (${esc(c.category || c.preferredDivision || 'Sin cat')})</option>`).join('')}
                                        </select>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- LISTA DE PLANTILLA ACTUAL -->
                            <div style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
                                ${roster.map(p => `
                                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;background:rgba(255,255,255,0.04);padding:7px 10px;border-radius:8px;font-size:0.78rem;">
                                        <span style="font-weight:700;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.name)}</span>
                                        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                                            ${otherTeams.length > 0 ? `
                                                <select onchange="if(this.value) window.AdminTeamSeasons.movePlayerToAnotherTeam('${esc(team.id)}', '${esc(p.name)}', this.value)"
                                                        style="background:#1e293b;color:#cbd5e1;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:0.68rem;padding:3px 5px;max-width:110px;">
                                                    <option value="">Mover a...</option>
                                                    ${otherTeams.map(ot => `<option value="${esc(ot.id)}">${esc(ot.name.replace(/SOMOS\s*P[AÁ]DEL\s*BCN\s*/i, ''))}</option>`).join('')}
                                                </select>
                                            ` : ''}
                                            <button onclick="window.AdminTeamSeasons.removePlayerFromTeam('${esc(team.id)}', '${esc(p.name)}')" title="Dar de baja del equipo"
                                                    style="background:rgba(239,68,68,0.18);color:#f87171;border:none;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:0.7rem;">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        _renderMovementsTab(m) {
            const q = normName(this.searchQuery);
            const filtered = (m.players || []).filter(p => {
                if (this.statusFilter !== 'all' && p.status !== this.statusFilter) return false;
                if (this.teamFilter !== 'all') {
                    const inCurr = (p.currentTeamIds || []).includes(this.teamFilter);
                    const inPrev = (p.previousTeamIds || []).includes(this.teamFilter);
                    if (!inCurr && !inPrev) return false;
                }
                if (q && !normName(p.name).includes(q)) return false;
                return true;
            });

            const badge = (status) => {
                const map = {
                    renovado: { txt: 'Renovado', bg: 'rgba(16,185,129,0.18)', col: '#34d399' },
                    fichaje: { txt: 'Nuevo Fichaje', bg: 'rgba(56,189,248,0.18)', col: '#38bdf8' },
                    cambio_equipo: { txt: 'Cambio de Equipo', bg: 'rgba(167,139,250,0.18)', col: '#c4b5fd' },
                    baja: { txt: 'Baja', bg: 'rgba(239,68,68,0.18)', col: '#f87171' },
                    participante: { txt: 'Participante', bg: 'rgba(204,255,0,0.15)', col: '#ccff00' }
                };
                const st = map[status] || map.participante;
                return `<span style="background:${st.bg};color:${st.col};padding:3px 9px;border-radius:999px;font-size:0.7rem;font-weight:900;white-space:nowrap;">${st.txt}</span>`;
            };

            return `
                <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;">
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
                        <input type="text" value="${esc(this.searchQuery)}" oninput="window.AdminTeamSeasons.setSearch(this.value)"
                               placeholder="Buscar jugador..." style="flex:1;min-width:180px;background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 12px;border-radius:10px;font-size:0.82rem;">

                        <select onchange="window.AdminTeamSeasons.setStatusFilter(this.value)" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 12px;border-radius:10px;font-size:0.8rem;">
                            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
                            <option value="renovado" ${this.statusFilter === 'renovado' ? 'selected' : ''}>Renovados</option>
                            <option value="fichaje" ${this.statusFilter === 'fichaje' ? 'selected' : ''}>Nuevos fichajes</option>
                            <option value="cambio_equipo" ${this.statusFilter === 'cambio_equipo' ? 'selected' : ''}>Cambios de equipo</option>
                            <option value="baja" ${this.statusFilter === 'baja' ? 'selected' : ''}>Bajas</option>
                            <option value="participante" ${this.statusFilter === 'participante' ? 'selected' : ''}>Participantes</option>
                        </select>

                        <select onchange="window.AdminTeamSeasons.setTeamFilter(this.value)" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 12px;border-radius:10px;font-size:0.8rem;">
                            <option value="all">Todos los equipos</option>
                            ${this.teams.map(t => `<option value="${esc(t.id)}" ${this.teamFilter === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
                        </select>
                    </div>

                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;text-align:left;">
                            <thead>
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:0.72rem;text-transform:uppercase;">
                                    <th style="padding:10px 8px;">Jugador</th>
                                    <th style="padding:10px 8px;">Estado</th>
                                    <th style="padding:10px 8px;">Equipo Temp. ${esc(this.selectedSeasonId)}</th>
                                    <th style="padding:10px 8px;">Equipo ${this.previousSeasonId ? ('Temp. ' + esc(this.previousSeasonId)) : 'Anterior'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `
                                    <tr><td colspan="4" style="padding:24px;text-align:center;color:#64748b;">No hay jugadores con estos filtros.</td></tr>
                                ` : filtered.map(p => `
                                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                        <td style="padding:10px 8px;font-weight:800;color:#fff;">${esc(p.name)}</td>
                                        <td style="padding:10px 8px;">${badge(p.status)}</td>
                                        <td style="padding:10px 8px;color:#cbd5e1;">${(p.currentTeams || []).length ? esc(p.currentTeams.join(', ')) : '<span style="color:#64748b;">—</span>'}</td>
                                        <td style="padding:10px 8px;color:#94a3b8;">${(p.previousTeams || []).length ? esc(p.previousTeams.join(', ')) : '<span style="color:#64748b;">—</span>'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        _renderSummaryTab(m) {
            const entries = Object.values(m.byTeam || {});
            return `
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:14px;">
                    ${entries.map(item => `
                        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;">
                            <div style="font-size:0.95rem;font-weight:950;color:#fff;margin-bottom:10px;">${esc(item.teamName)}</div>
                            ${this._miniGroup('Renovados / Siguen', item.stayed, '#34d399')}
                            ${this._miniGroup('Nuevos Fichajes', item.joined, '#38bdf8')}
                            ${this._miniGroup('Vienen de otro equipo', item.switchedIn, '#c4b5fd')}
                            ${this._miniGroup('Bajas del club', item.left, '#f87171')}
                            ${this._miniGroup('Cambian a otro equipo', item.switchedOut, '#fbbf24')}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        _miniGroup(title, list, color) {
            if (!list || list.length === 0) return '';
            return `
                <div style="margin-bottom:10px;">
                    <div style="font-size:0.7rem;font-weight:900;color:${color};text-transform:uppercase;margin-bottom:4px;">${title} (${list.length})</div>
                    <div style="display:flex;flex-wrap:wrap;gap:5px;">
                        ${list.map(p => `<span style="background:${color}18;border:1px solid ${color}44;color:#f1f5f9;font-size:0.72rem;padding:2px 8px;border-radius:6px;">${esc(p.name)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }

    const instance = new AdminTeamSeasonsController();
    window.AdminTeamSeasons = instance;
    window.AdminViews.team_seasons = () => instance.init();
    console.log('✅ [AdminTeamSeasons] Módulo de Gestión Multi-Temporada registrado.');
})();
