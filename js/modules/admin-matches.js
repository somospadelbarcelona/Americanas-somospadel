
window.AdminViews = window.AdminViews || {};

/**
 * CENTRO DE RESULTADOS DE AMERICANAS (MÓDULO DE CONTROL)
 * Migrado desde el núcleo monolítico de admin.js
 */
window.AdminViews.americanas_results = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Resultados de Americanas';

    // 1. Obtener datos iniciales
    const americanas = await FirebaseDB.americanas.getAll();
    // Prioridad: Americana en juego, o abierta, o la última creada
    let activeAmericana = americanas.find(a => a.status === 'in_progress' || a.status === 'live' || a.status === 'open') || americanas[0];

    if (!activeAmericana) {
        content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"> <p>No hay americanas activas.</p></div>`;
        return;
    }

    // 2. Renderizar Estructura Principal
    content.innerHTML = `
        <div class="dashboard-header-pro" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0a0a0a 0%, #000 100%); padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="width: 70px; height: 70px; background: rgba(204,255,0,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; border: 1px solid rgba(204,255,0,0.3); box-shadow: 0 0 20px rgba(204,255,0,0.1);">🏆</div>
                    <div>
                        <h1 style="margin:0; color: white; font-size: 2.4rem; font-weight: 950; letter-spacing: -1.5px; line-height: 1;">${activeAmericana.name}</h1>
                        <div style="color: var(--primary); font-weight: 800; font-size: 0.85rem; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; opacity: 0.9;">MÓDULO DE CONTROL DE RESULTADOS</div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button class="btn-outline-pro" onclick="resetRoundScores('${activeAmericana.id}', window.currentAdminRound)" style="border-color: #ff4d4d; color: #ff4d4d; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🚨 REINICIAR PARTIDO</button>
                    <button class="btn-primary-pro" onclick="simulateRoundScores('${activeAmericana.id}', window.currentAdminRound)" style="background: #25D366; color: black; border-color: #25D366; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🎲 SIMULAR PARTIDO</button>
                    <button class="btn-primary-pro" onclick="simulateAllAmericanaMatches('${activeAmericana.id}')" style="background: var(--primary); color: black; border-color: var(--primary); font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🎮 SIMULAR TORNEO COMPLETO</button>
                </div>
            </div>

            <div id="filter-bar" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; background: rgba(255,255,255,0.03); padding: 1.8rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; flex-direction: column; gap: 10px; flex: 2;">
                    <label style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Buscador de Evento:</label>
                    <select id="americana-select" onchange="loadSpecificAmericana(this.value)" class="pro-input" style="width: 100%; height: 60px !important; font-size: 1.1rem !important; font-weight: 800 !important; background: #ffffff !important; color: #000000 !important; border-radius: 14px; border: 3px solid var(--primary-muted) !important; padding: 0 15px !important; cursor: pointer;">
                        ${americanas.map(a => `<option value="${a.id}" ${a.id === activeAmericana.id ? 'selected' : ''}>${a.name ? a.name.toUpperCase() : 'SIN NOMBRE'} — ${a.date || 'Sin fecha'}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; flex: 2;">
                    <label style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Buscador Rápido Jugador:</label>
                    <input type="text" placeholder="Escribe nombre para destacar..." class="pro-input" style="height: 60px !important; border-radius: 14px; background: #ffffff !important; color: #000000 !important; border: 3px solid var(--primary-muted) !important; padding: 0 15px !important; font-weight: 700 !important; font-size: 1.1rem !important;" onkeyup="highlightPlayer(this.value)">
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; max-width: 150px;">
                    <label style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Nº Pistas:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="number" id="quick-max-courts" value="${activeAmericana.max_courts || 0}" min="1" max="20" class="pro-input" style="width: 100%; height: 60px !important; text-align: center; font-size: 1.4rem !important; font-weight: 800 !important; background: #ffffff !important; color: #000000 !important; border-radius: 14px; border: 3px solid var(--primary-muted) !important;">
                        <button class="btn-primary-pro" onclick="updateMaxCourtsQuick('${activeAmericana.id}')" style="height: 60px; min-width: 60px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 14px; font-size: 1.5rem;" title="Guardar Pistas">💾</button>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem; overflow-x: auto; padding-bottom: 8px;">
                ${[1, 2, 3, 4, 5, 6].map(r => `<button class="btn-round-tab" id="btn-round-${r}" onclick="renderMatchesForAmericana('${activeAmericana.id}', ${r})" style="flex: 1; min-width: 150px; height: 55px; font-weight: 900; font-size: 0.95rem; border-radius: 14px; cursor: pointer; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #888;">PARTIDO ${r}</button>`).join('')}
                <button class="btn-round-tab" id="btn-round-summary" onclick="renderAmericanaSummary('${activeAmericana.id}')" style="flex: 1.3; min-width: 180px; height: 55px; font-weight: 900; background: var(--secondary); border: none; border-radius: 14px; color: white; display: flex; align-items: center; justify-content: center; gap: 8px;">📊 INFORME FINAL</button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2.5fr 1.2fr; gap: 2.5rem;">
            <div id="matches-container"><div class="loader"></div></div>

            <div class="glass-card-enterprise" style="height: fit-content; padding: 2rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem;">
                    <h3 style="margin:0; color:white; font-size: 1.1rem; font-weight: 900; letter-spacing: 1px;">📊 CLASIFICACIÓN</h3>
                    <span style="font-size:0.7rem; color: var(--primary); font-weight: 800; background: rgba(204,255,0,0.1); padding: 4px 10px; border-radius: 20px;">EN VIVO</span>
                </div>
                <div id="standings-container" style="max-height: 800px; overflow-y: auto; padding-right: 5px;">
                    <!-- Standings inserted here -->
                </div>
            </div>
        </div>
    `;

    // 3. Inicializar primer partido
    window.currentAdminRound = 1;
    renderMatchesForAmericana(activeAmericana.id, 1);
};

/**
 * FUNCIONES GLOBALES DE SOPORTE (Expuestas para los onclick de la interfaz)
 */

window.loadSpecificAmericana = (id) => {
    window.selectedAmericanaId = id;
    window.AdminViews.americanas_results();
};

window.renderMatchesForAmericana = async (americanaId, roundNum = window.currentAdminRound) => {
    window.currentAdminRound = roundNum;
    document.querySelectorAll('.btn-round-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-round-${roundNum}`)?.classList.add('active');

    const container = document.getElementById('matches-container');
    if (container) container.innerHTML = '<div class="loader"></div>';

    try {
        const matches = await FirebaseDB.matches.getByAmericana(americanaId);
        const americana = await FirebaseDB.americanas.getById(americanaId);
        const roundMatches = matches.filter(m => m.round === roundNum);

        // Renderizar Partidos
        if (roundMatches.length === 0) {
            container.innerHTML = `
                <div class="glass-card-enterprise text-center" style="padding:4rem;">
                    <p style="color:var(--text-muted);">No hay partidos generados para esta ronda.</p>
                </div>`;
        } else {
            const courtColors = ['#CCFF00', '#00E36D', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'];
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${roundMatches.sort((a, b) => a.court - b.court).map(m => `
                        <div class="glass-card-enterprise match-card" data-players="${(m.team_a_names + ' ' + m.team_b_names).toLowerCase()}" style="padding: 0; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
                             <div style="padding: 1rem; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${courtColors[m.court - 1] || '#666'};">
                                <span style="font-weight: 800; color: ${courtColors[m.court - 1] || '#ccc'}; letter-spacing: 1px;">PISTA ${m.court}</span>
                                <span style="font-size: 0.7rem; color: #555;">${m.status === 'finished' ? '<span style="color:#25D366; font-weight:800;">FINALIZADO</span>' : 'EN JUEGO'}</span>
                            </div>
                            <div style="padding: 1.5rem; display: flex; align-items: center; gap: 1rem; justify-content: space-between;">
                                <div style="flex: 1; text-align: right; font-weight: 700; color: white;">${m.team_a_names}</div>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="number" value="${m.score_a || 0}" class="pro-input score-input" style="width: 50px; text-align: center; font-size: 1.2rem; font-weight: 950; background: black !important; border-color: var(--primary) !important;" onchange="updateMatchScore('${m.id}', 'a', this.value)">
                                    <span style="color: var(--text-muted); font-weight: 900;">VS</span>
                                    <input type="number" value="${m.score_b || 0}" class="pro-input score-input" style="width: 50px; text-align: center; font-size: 1.2rem; font-weight: 950; background: black !important; border-color: var(--primary) !important;" onchange="updateMatchScore('${m.id}', 'b', this.value)">
                                </div>
                                <div style="flex: 1; font-weight: 700; color: white;">${m.team_b_names}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Renderizar Clasificación (Standalone Logic for Standings)
        renderLiveStandings(matches, americana);

    } catch (e) {
        console.error(e);
        if (container) container.innerHTML = `<div class="error-box">${e.message}</div>`;
    }
};

/**
 * Cálculo y Renderizado de Clasificación en Vivo
 */
function renderLiveStandings(matches, americana) {
    const stContainer = document.getElementById('standings-container');
    if (!stContainer) return;

    const isFixedPairs = americana.pair_mode === 'fixed';
    const stats = {};

    matches.forEach(m => {
        if (m.status === 'finished' || (m.score_a > 0 || m.score_b > 0)) {
            const teamA = m.team_a_names;
            const teamB = m.team_b_names;
            const sA = parseInt(m.score_a || 0);
            const sB = parseInt(m.score_b || 0);

            if (!stats[teamA]) stats[teamA] = { name: teamA, played: 0, won: 0, games: 0 };
            if (!stats[teamB]) stats[teamB] = { name: teamB, played: 0, won: 0, games: 0 };

            stats[teamA].played++;
            stats[teamB].played++;
            stats[teamA].games += sA;
            stats[teamB].games += sB;

            if (sA > sB) stats[teamA].won++;
            else if (sB > sA) stats[teamB].won++;
        }
    });

    const ranking = Object.values(stats).sort((a, b) => b.games - a.games || b.won - a.won);
    const maxGames = ranking.length > 0 ? Math.max(...ranking.map(r => r.games)) : 1;

    stContainer.innerHTML = ranking.map((r, i) => {
        const isPodium = i < 3;
        const barWidth = (r.games / maxGames) * 100;
        const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

        return `
            <div style="position: relative; margin-bottom: 8px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${barWidth}%; background: rgba(204,255,0,0.05); z-index: 0;"></div>
                <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: 900; color: var(--primary); width: 25px;">${icon}</span>
                        <div>
                            <div style="font-weight: 700; color: white; font-size: 0.85rem;">${r.name}</div>
                            <div style="font-size: 0.65rem; color: #888;">${r.played} partidos</div>
                        </div>
                    </div>
                    <div style="font-weight: 900; color: var(--primary); font-size: 1.1rem;">${r.games} <span style="font-size:0.6rem; opacity:0.5;">PTS</span></div>
                </div>
            </div>
        `;
    }).join('') || '<div style="text-align:center; color:#666; padding:2rem;">Esperando resultados...</div>';
}

/**
 * Acciones de Simulación y Control
 */
window.updateMatchScore = async (id, team, val) => {
    const score = parseInt(val) || 0;
    const upd = team === 'a' ? { score_a: score } : { score_b: score };
    upd.status = 'finished'; // Auto-finish on edit
    await FirebaseDB.matches.update(id, upd);

    // Trigger Automation
    if (window.AmericanaService && window.AmericanaService.generateNextRound) {
        setTimeout(() => {
            window.AmericanaService.generateNextRound(window.selectedAmericanaId, window.currentAdminRound, 'americana');
        }, 500);
    }

    // Renderizado reactivo local si es necesario, o recargar ronda
    // renderMatchesForAmericana(window.selectedAmericanaId, window.currentAdminRound);
};

window.resetRoundScores = async (americanaId, round) => {
    if (!confirm(`¿Reiniciar todos los resultados de la Ronda ${round}?`)) return;
    const matches = await FirebaseDB.matches.getByAmericana(americanaId);
    const roundMatches = matches.filter(m => m.round === parseInt(round));
    await Promise.all(roundMatches.map(m => FirebaseDB.matches.update(m.id, { score_a: 0, score_b: 0, status: 'scheduled' })));
    renderMatchesForAmericana(americanaId, round);
};

window.simulateRoundScores = async (americanaId, round) => {
    const matches = await FirebaseDB.matches.getByAmericana(americanaId);
    const roundMatches = matches.filter(m => m.round === parseInt(round));
    await Promise.all(roundMatches.map(m => {
        const sA = Math.floor(Math.random() * 7);
        const sB = Math.floor(Math.random() * 7);
        return FirebaseDB.matches.update(m.id, { score_a: sA, score_b: sB, status: 'finished' });
    }));

    // Trigger Automation
    if (window.AmericanaService && window.AmericanaService.generateNextRound) {
        setTimeout(() => {
            window.AmericanaService.generateNextRound(americanaId, round, 'americana');
        }, 500);
    }

    renderMatchesForAmericana(americanaId, round);
};

window.simulateAllAmericanaMatches = async (americanaId) => {
    if (!confirm("¿Simular TODO el torneo con resultados aleatorios?")) return;
    const matches = await FirebaseDB.matches.getByAmericana(americanaId);
    await Promise.all(matches.map(m => {
        const sA = Math.floor(Math.random() * 7);
        const sB = Math.floor(Math.random() * 7);
        return FirebaseDB.matches.update(m.id, { score_a: sA, score_b: sB, status: 'finished' });
    }));
    renderMatchesForAmericana(americanaId, window.currentAdminRound);
};

window.updateMaxCourtsQuick = async (id) => {
    const val = document.getElementById('quick-max-courts').value;
    await FirebaseDB.americanas.update(id, { max_courts: parseInt(val) });
    alert("Pistas actualizadas");
};

window.highlightPlayer = (query) => {
    const q = query.toLowerCase();
    document.querySelectorAll('.match-card').forEach(card => {
        const players = card.getAttribute('data-players') || '';
        card.style.opacity = (q === '' || players.includes(q)) ? '1' : '0.15';
        card.style.transform = (q !== '' && players.includes(q)) ? 'scale(1.02)' : 'scale(1)';
        card.style.borderColor = (q !== '' && players.includes(q)) ? 'var(--primary)' : 'rgba(255,255,255,0.08)';
    });
};

window.renderAmericanaSummary = (id) => {
    // Redirigir a la vista pública o informe
    if (window.ControlTowerView) {
        document.getElementById('content-area').innerHTML = '';
        window.ControlTowerView.load(id);
    }
};

/**
 * VISTA COMPATIBILIDAD 'matches'
 */
window.AdminViews.matches = window.AdminViews.americanas_results;
