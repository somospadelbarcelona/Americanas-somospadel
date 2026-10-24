# -*- coding: utf-8 -*-
with open('admin.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''                <!-- Info Banner -->
                <div style="background: rgba(0, 198, 255, 0.08); border-left: 4px solid #00C6FF; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 0.8rem; line-height: 1.45; color: #cbd5e1;">
                    <strong style="color: #00C6FF; display: block; margin-bottom: 4px;"><i class="fas fa-magic"></i> Cruce inteligente con la Base de Datos:</strong>
                    Pega abajo los nombres de los jugadores inscritos en Playtomic. Si el jugador ya está registrado en nuestra app, se añadirá automáticamente su <strong>perfil oficial, foto y nivel</strong>. Si aún no está creado, se registrará como <strong>"Jugador Playtomic [Nombre y Apellido]"</strong>.
                </div>'''

replacement = '''                <!-- TABS DE SINCRONIZACIÓN -->
                <div style="display: flex; gap: 8px; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <button type="button" id="tab-playtomic-auto" onclick="window.switchPlaytomicSyncTab('auto')"
                            style="flex: 1; padding: 9px 12px; border-radius: 8px; font-weight: 900; font-size: 0.82rem; cursor: pointer; border: none; background: linear-gradient(135deg, #00C6FF, #0072FF); color: #fff; display: flex; align-items: center; justify-content: center; gap: 7px;">
                        <i class="fas fa-bolt"></i> ⚡ AUTOMÁTICA (API PLAYTOMIC)
                    </button>
                    <button type="button" id="tab-playtomic-manual" onclick="window.switchPlaytomicSyncTab('manual')"
                            style="flex: 1; padding: 9px 12px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 7px;">
                        <i class="fas fa-clipboard-list"></i> 📋 PEGAR NOMBRES
                    </button>
                </div>

                <!-- PANEL AUTOMÁTICO (API PLAYTOMIC) -->
                <div id="panel-playtomic-auto" style="background: rgba(0, 198, 255, 0.06); border: 1.5px solid rgba(0, 198, 255, 0.3); border-radius: 14px; padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <i class="fas fa-robot" style="color: #00C6FF; font-size: 1.3rem;"></i>
                        <div>
                            <strong style="color: #fff; font-size: 0.9rem; display: block;">Conexión Oficial con Playtomic</strong>
                            <span style="font-size: 0.72rem; color: #94a3b8;">Descarga automáticamente los jugadores inscritos mediante la API oficial sin copiar ni pegar.</span>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                        <div>
                            <label style="font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Cuenta Playtomic Organizador</label>
                            <input type="email" id="playtomic-auto-email" value="somospadelbarcelona@gmail.com" readonly
                                   style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 9px 12px; color: #00C6FF; font-size: 0.82rem; font-weight: 700;">
                        </div>
                        <div>
                            <label style="font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Contraseña Playtomic</label>
                            <input type="password" id="playtomic-auto-password" placeholder="Tu contraseña de Playtomic..."
                                   style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; padding: 9px 12px; color: #fff; font-size: 0.82rem;">
                        </div>
                    </div>

                    <button type="button" id="btn-fetch-playtomic-api" onclick="window.fetchPlaytomicAutoPlayers()"
                            style="width: 100%; padding: 12px; border-radius: 10px; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: #fff; font-weight: 900; font-size: 0.88rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,198,255,0.35);">
                        <i class="fas fa-cloud-download-alt"></i> <span>🚀 CONECTAR Y DESCARGAR JUGADORES DE PLAYTOMIC</span>
                    </button>
                    <div id="playtomic-auto-status" style="margin-top: 8px; font-size: 0.72rem; color: #94a3b8; text-align: center;"></div>
                </div>

                <!-- Info Banner Cruce -->
                <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10B981; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.76rem; line-height: 1.4; color: #cbd5e1;">
                    <strong style="color: #10B981;"><i class="fas fa-check-double"></i> Regla de oro de sincronización:</strong>
                    Si el jugador está registrado en la App $\\rightarrow$ se vincula con su <strong>perfil oficial, foto y nivel</strong>. Si aún no está creado $\\rightarrow$ se nombra como <strong>"Jugador Playtomic [Nombre y Apellidos]"</strong>.
                </div>'''

if target in c:
    c = c.replace(target, replacement, 1)
    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated admin.html with Playtomic API tabs and auto-sync panel")
else:
    print("Target not found in admin.html")
