
window.AdminViews = window.AdminViews || {};

window.AdminViews.simulator_empty = function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Simulador de americanas';
    content.innerHTML = `
        <div class="glass-card-enterprise" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem;">
            <div style="font-size: 4rem; margin-bottom: 2rem;">📝</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem;">Simulador de americanas</h2>
            <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Esta herramienta selecciona jugadores reales al azar, crea el evento y genera los cruces de las 6 rondas, pero deja los <strong>MARCADORES A 0</strong> y el estado <strong>PENDIENTE</strong>, listo para empezar a jugar.</p>
            
            <div style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                <label style="color: var(--primary); font-weight: 800; display: block; margin-bottom: 1rem; letter-spacing: 1px;">⚙️ CONFIGURACIÓN DE ESCENARIO</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">NÚMERO DE PISTAS</label>
                        <select id="sim-courts-empty" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="2">2 Pistas (8 Jugadores)</option>
                            <option value="3" selected>3 Pistas (12 Jugadores)</option>
                            <option value="4">4 Pistas (16 Jugadores)</option>
                            <option value="5">5 Pistas (20 Jugadores)</option>
                            <option value="6">6 Pistas (24 Jugadores)</option>
                            <option value="7">7 Pistas (28 Jugadores)</option>
                            <option value="8">8 Pistas (32 Jugadores)</option>
                            <option value="9">9 Pistas (36 Jugadores)</option>
                            <option value="10">10 Pistas (40 Jugadores)</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">MODO DE JUEGO</label>
                        <select id="sim-pair-mode-empty" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="rotating" selected>🔄 TWISTER (Individual)</option>
                            <option value="fixed">🔒 PAREJAS FIJAS (Pozo)</option>
                        </select>
                    </div>
                     <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">CATEGORIA</label>
                        <select id="sim-category-empty" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="open" selected>Open / Mixta</option>
                            <option value="male">Masculina</option>
                            <option value="female">Femenina</option>
                            <option value="mixed">Mixto Puro (Parejas H+M)</option>
                        </select>
                    </div>
                </div>

                 <div style="margin-top: 15px;">
                    <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">SEDE DEL EVENTO</label>
                    <select id="sim-location-empty" class="pro-input" style="width: 100%; text-align: center;">
                        <option value="Barcelona Pádel el Prat">Barcelona Pádel el Prat</option>
                        <option value="Delfos Cornellá">Delfos Cornellá</option>
                    </select>
                 </div>
            </div>

            <div id="sim-status-empty" style="display: none; margin-bottom: 2rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: monospace; text-align: left; font-size: 0.8rem; color: #00E36D;"></div>

            <button class="btn-primary-pro" style="padding: 1rem 3rem; font-size: 1.1rem;" onclick="AdminSimulator.runEmptyCycle()">
                🚀 GENERAR AMERICANA (LISTA PARA JUGAR)
            </button>
        </div>
    `;
};

window.AdminViews.entrenos_simulator = function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Simulador de Entrenos';
    content.innerHTML = `
        <div class="glass-card-enterprise" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem;">
            <div style="font-size: 4rem; margin-bottom: 2rem;">🎓</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem;">Simulador de Entrenos</h2>
            <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Herramienta para generar entrenos de prueba con jugadores reales. Ideal para probar algoritmos de Pozo y Twister.</p>
            
            <div style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                <label style="color: var(--primary); font-weight: 800; display: block; margin-bottom: 1rem; letter-spacing: 1px;">⚙️ CONFIGURACIÓN DE ESCENARIO</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">NÚMERO DE PISTAS</label>
                        <select id="sim-training-courts" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="2">2 Pistas (8 Jugadores)</option>
                            <option value="3" selected>3 Pistas (12 Jugadores)</option>
                            <option value="4">4 Pistas (16 Jugadores)</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">MODO DE JUEGO</label>
                        <select id="sim-training-pair-mode" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="rotating" selected>🔄 TWISTER (Individual)</option>
                            <option value="fixed">🔒 PAREJAS FIJAS (Pozo)</option>
                        </select>
                    </div>
                     <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">CATEGORIA</label>
                        <select id="sim-training-category" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="open" selected>Open / Mixta</option>
                            <option value="male">Masculina</option>
                            <option value="female">Femenina</option>
                            <option value="mixed">Mixto Puro (Parejas H+M)</option>
                        </select>
                    </div>
                </div>

                 <div style="margin-top: 15px;">
                    <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">SEDE DEL EVENTO</label>
                    <select id="sim-training-location" class="pro-input" style="width: 100%; text-align: center;">
                        <option value="Barcelona Pádel el Prat">Barcelona Pádel el Prat</option>
                        <option value="Delfos Cornellá">Delfos Cornellá</option>
                    </select>
                 </div>
            </div>

            <div id="sim-training-status" style="display: none; margin-bottom: 2rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: monospace; text-align: left; font-size: 0.8rem; color: #00E36D;"></div>

            <button class="btn-primary-pro" style="padding: 1rem 3rem; font-size: 1.1rem;" onclick="AdminSimulator.runTrainingCycle()">
                🚀 GENERAR ENTRENO DE PRUEBA
            </button>
        </div>
    `;
};
