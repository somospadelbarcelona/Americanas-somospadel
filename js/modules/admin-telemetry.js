/**
 * js/modules/admin-telemetry.js
 * 🩺 Telemetría y Diagnóstico del Sistema Somospadel (Exclusivo Administrador)
 * Monitoriza latencia Firestore, errores en tiempo real, caché PWA, Service Workers y estado de red.
 */

window.AdminViews = window.AdminViews || {};

(function() {
    'use strict';

    const errors = [];
    let isConnected = null;
    let lastPingMs = null;
    let isPinging = false;

    // Inyectar estilos para el trigger y el panel
    if (!document.getElementById('sp-admin-telemetry-styles')) {
        const style = document.createElement('style');
        style.id = 'sp-admin-telemetry-styles';
        style.innerHTML = `
            @keyframes pulseGlow {
                0% { box-shadow: 0 0 5px rgba(204,255,0,0.3); }
                50% { box-shadow: 0 0 16px rgba(204,255,0,0.75); }
                100% { box-shadow: 0 0 5px rgba(204,255,0,0.3); }
            }
            @keyframes slideInPanel {
                from { transform: translateY(120%) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            .admin-telemetry-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.72rem;
                font-weight: 800;
                letter-spacing: 0.5px;
            }
            .admin-telemetry-pill.success {
                background: rgba(0, 227, 109, 0.15);
                color: #00E36D;
                border: 1px solid rgba(0, 227, 109, 0.3);
            }
            .admin-telemetry-pill.warning {
                background: rgba(245, 158, 11, 0.15);
                color: #f59e0b;
                border: 1px solid rgba(245, 158, 11, 0.3);
            }
            .admin-telemetry-pill.danger {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    // Captura de errores exclusiva de la sesión
    window.addEventListener('error', function(e) {
        if (e.filename && (e.filename.includes('chrome-extension') || e.filename.includes('safari-extension'))) return;
        const d = new Date();
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        errors.push({
            title: 'Crash en Script',
            message: `${e.message} en ${e.filename ? e.filename.split('/').pop() : 'inline'}:${e.lineno || '?'}:${e.colno || '?'}`,
            stack: e.error ? e.error.stack : '',
            time: timeStr
        });
        updatePanelUI();
        if (window._currentAdminView === 'system_telemetry' && window.AdminViews && window.AdminViews.system_telemetry) {
            window.AdminViews.system_telemetry();
        }
    });

    window.addEventListener('unhandledrejection', function(event) {
        const d = new Date();
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        errors.push({
            title: 'Promesa Rechazada',
            message: event.reason ? (event.reason.message || String(event.reason)) : 'Error en promesa asíncrona',
            stack: event.reason ? event.reason.stack : '',
            time: timeStr
        });
        updatePanelUI();
        if (window._currentAdminView === 'system_telemetry' && window.AdminViews && window.AdminViews.system_telemetry) {
            window.AdminViews.system_telemetry();
        }
    });

    async function checkFirebaseStatus() {
        if (isPinging) return;
        isPinging = true;
        try {
            const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
            if (db) {
                const start = Date.now();
                await db.collection('system_metadata').doc('blog_control').get();
                lastPingMs = Date.now() - start;
                isConnected = true;
                console.log(`📡 [Admin Telemetry] Firestore Ping: ${lastPingMs}ms`);
            } else {
                isConnected = false;
                lastPingMs = null;
            }
        } catch (e) {
            console.warn('⚠️ [Admin Telemetry] Firestore check failed:', e);
            isConnected = false;
            lastPingMs = null;
        } finally {
            isPinging = false;
            updatePanelUI();
        }
    }

    // Comprobación periódica cada 20 segundos
    setInterval(() => {
        const panel = document.getElementById('sp-diagnostic-panel');
        if ((panel && panel.style.display !== 'none') || window._currentAdminView === 'system_telemetry') {
            checkFirebaseStatus();
        }
    }, 20000);

    // --- ACCIÓN DE LIMPIAR CACHÉ PWA ---
    window.forceUpdateApp = async function() {
        const btn = document.querySelector('#sp-diagnostic-panel button:last-child, #btn-purge-cache-main');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> LIMPIANDO...`;
            btn.style.opacity = '0.7';
        }
        try {
            console.log('🧹 [Admin Telemetry] Limpiando caché PWA y Service Workers...');
            if ('caches' in window) {
                try {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        await caches.delete(key);
                    }
                } catch (cErr) {
                    console.warn('No se pudo limpiar la caché de objetos:', cErr);
                }
            }
            if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
                try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const reg of regs) {
                        await reg.unregister();
                    }
                } catch (swErr) {
                    console.warn('No se pudo desregistrar Service Worker:', swErr);
                }
            }
            localStorage.removeItem('somospadel_last_news_gen_date');
            localStorage.removeItem('local_ranking_cache');
            sessionStorage.removeItem('sp_recovery_attempt');
            window.location.reload(true);
        } catch (err) {
            alert('Error al limpiar caché: ' + err.message);
            if (btn) {
                btn.innerHTML = `<i class="fas fa-trash-alt"></i> LIMPIAR CACHÉ PWA`;
                btn.style.opacity = '1';
            }
        }
    };

    // --- OVERLAY FLOTANTE RÁPIDO (MODAL TELEMETRÍA) ---
    function toggleDiagnosticPanel() {
        let panel = document.getElementById('sp-diagnostic-panel');
        if (!panel) {
            createDiagnosticPanel();
            panel = document.getElementById('sp-diagnostic-panel');
        }

        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            checkFirebaseStatus();
        } else {
            panel.style.display = 'none';
        }
    }
    window.toggleDiagnosticPanel = toggleDiagnosticPanel;
    window.openDiagnosticPanel = () => {
        let panel = document.getElementById('sp-diagnostic-panel');
        if (!panel) createDiagnosticPanel();
        panel = document.getElementById('sp-diagnostic-panel');
        panel.style.display = 'block';
        checkFirebaseStatus();
    };

    function createDiagnosticPanel() {
        if (document.getElementById('sp-diagnostic-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'sp-diagnostic-panel';
        panel.style = "position:fixed; bottom:25px; right:25px; width:440px; max-width:calc(100vw - 30px); background:rgba(10,10,18,0.97); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1.5px solid rgba(204,255,0,0.35); border-radius:24px; padding:22px; color:white; z-index:99999; font-family:'Outfit',sans-serif; box-shadow:0 25px 60px rgba(0,0,0,0.85); display:none; animation:slideInPanel 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; overflow:hidden;";
        document.body.appendChild(panel);
        updatePanelUI();
    }

    function updatePanelUI() {
        const panel = document.getElementById('sp-diagnostic-panel');
        if (!panel) return;

        const hasErrors = errors.length > 0;
        const statusColor = hasErrors ? '#ef4444' : '#00E36D';
        const statusText = hasErrors ? 'INCIDENCIA' : '100% OPERATIVO';
        const statusShadow = hasErrors ? '0 0 15px rgba(239,68,68,0.6)' : '0 0 15px rgba(0,227,109,0.6)';
        const activeCache = window.CACHE_NAME || 'somospadel-ultra-cache-v827';

        let errorsHtml = '';
        if (hasErrors) {
            errorsHtml = `
                <div style="font-weight:900; color:#ef4444; font-size:0.68rem; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>REGISTRO DE ERRORES (${errors.length})</span>
                    <button onclick="window.clearTelemetryErrors()" style="background:transparent; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:0.6rem; text-decoration:underline;">Limpiar</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; max-height:140px; overflow-y:auto; margin-bottom:15px; padding-right:4px;">
                    ${errors.map((e, idx) => `
                        <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.20); padding:10px; border-radius:12px;">
                            <div style="font-weight:900; color:#ff8080; display:flex; justify-content:space-between;">
                                <span>[${idx+1}] ${e.title}</span>
                                <span style="font-size:0.55rem; opacity:0.6;">${e.time}</span>
                            </div>
                            <div style="color:rgba(255,255,255,0.85); font-family:monospace; font-size:0.65rem; margin-top:4px; word-break:break-all;">${e.message}</div>
                            ${e.stack ? `<details style="margin-top:6px;"><summary style="color:#38bdf8; cursor:pointer; font-weight:800; font-size:0.55rem;">VER DETALLES</summary><pre style="font-size:0.58rem; color:#ccc; overflow-x:auto; margin:4px 0 0 0; white-space:pre-wrap; font-family:monospace; word-break:break-all;">${e.stack}</pre></details>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            errorsHtml = `
                <div style="text-align:center; padding:12px 0; color:rgba(255,255,255,0.5); font-size:0.72rem; font-weight:600;">
                    <i class="fas fa-check-double" style="color:#00E36D; font-size:1.3rem; margin-bottom:6px; display:block;"></i>
                    Sin incidencias de JavaScript registradas.
                </div>
            `;
        }

        let dbStatusHtml = `<span style="color:#fbbf24;"><i class="fas fa-circle-notch fa-spin"></i> Comprobando...</span>`;
        if (isConnected === true) {
            dbStatusHtml = `<span style="color:#00E36D; font-weight:800;"><i class="fas fa-check-circle"></i> CONECTADO ${lastPingMs ? `(${lastPingMs}ms)` : ''}</span>`;
        } else if (isConnected === false) {
            dbStatusHtml = `<span style="color:#ef4444; font-weight:800;"><i class="fas fa-times-circle"></i> DESCONECTADO</span>`;
        }

        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                <div style="display:flex; align-items:center; gap:9px;">
                    <div style="width:10px; height:10px; border-radius:50%; background:${statusColor}; box-shadow:${statusShadow};"></div>
                    <span style="font-weight:950; font-size:0.82rem; letter-spacing:1px; color:#fff; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-heartbeat" style="color:#CCFF00;"></i> TELEMETRÍA DEL SISTEMA
                    </span>
                </div>
                <div onclick="window.toggleDiagnosticPanel()" style="width:26px; height:26px; border-radius:50%; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(255,255,255,0.7); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.18)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                    <i class="fas fa-times" style="font-size:0.75rem;"></i>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:16px; margin-bottom:14px; font-size:0.68rem;">
                <div>
                    <span style="color:rgba(255,255,255,0.4); display:block; font-weight:700;">ESTADO MOTOR:</span>
                    <span style="color:${statusColor}; font-weight:900;">${statusText}</span>
                </div>
                <div>
                    <span style="color:rgba(255,255,255,0.4); display:block; font-weight:700;">FIRESTORE DB:</span>
                    ${dbStatusHtml}
                </div>
                <div style="margin-top:6px;">
                    <span style="color:rgba(255,255,255,0.4); display:block; font-weight:700;">CACHÉ ACTIVA:</span>
                    <span style="color:#38bdf8; font-weight:800; word-break:break-all;">${activeCache}</span>
                </div>
                <div style="margin-top:6px;">
                    <span style="color:rgba(255,255,255,0.4); display:block; font-weight:700;">RED / DISPOSITIVO:</span>
                    <span style="color:#fff; font-weight:800;">${navigator.onLine ? 'ONLINE 🟢' : 'OFFLINE 🔴'}</span>
                </div>
            </div>

            ${errorsHtml}

            <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:10px; margin-top:5px;">
                <button onclick="window.location.reload(true)" style="background:rgba(255,255,255,0.06); color:white; border:1px solid rgba(255,255,255,0.12); padding:10px; border-radius:12px; font-weight:900; font-size:0.68rem; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                    <i class="fas fa-sync-alt"></i> RECARGAR
                </button>
                <button onclick="window.forceUpdateApp()" style="background:#CCFF00; color:black; border:none; padding:10px; border-radius:12px; font-weight:1000; font-size:0.68rem; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(204,255,0,0.25);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 18px rgba(204,255,0,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(204,255,0,0.25)'">
                    <i class="fas fa-trash-alt"></i> LIMPIAR CACHÉ PWA
                </button>
            </div>
            
            <div style="text-align:center; margin-top:10px;">
                <a href="javascript:void(0)" onclick="window.loadAdminView('system_telemetry'); window.toggleDiagnosticPanel();" style="color:#CCFF00; font-size:0.65rem; font-weight:800; text-decoration:none;">
                    Abrir Panel Completo de Telemetría <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
    }

    window.clearTelemetryErrors = function() {
        errors.length = 0;
        updatePanelUI();
        if (window._currentAdminView === 'system_telemetry' && window.AdminViews && window.AdminViews.system_telemetry) {
            window.AdminViews.system_telemetry();
        }
    };

    // --- VISTA COMPLETA DE ADMINISTRACIÓN (system_telemetry) ---
    window.AdminViews.system_telemetry = async function() {
        const content = document.getElementById('content-area');
        if (!content) return;

        await checkFirebaseStatus();

        const hasErrors = errors.length > 0;
        const activeCache = window.CACHE_NAME || 'somospadel-ultra-cache-v827';
        const storageKeysCount = Object.keys(localStorage).length;
        const storageApproxBytes = new Blob(Object.values(localStorage)).size;
        const storageKb = (storageApproxBytes / 1024).toFixed(1);

        let swCount = 0;
        if ('serviceWorker' in navigator) {
            try {
                const regs = await navigator.serviceWorker.getRegistrations();
                swCount = regs.length;
            } catch (e) {}
        }

        let dbStatusBadge = isConnected ? 
            `<span class="admin-telemetry-pill success"><i class="fas fa-check-circle"></i> CONECTADO (${lastPingMs || 0}ms)</span>` :
            `<span class="admin-telemetry-pill danger"><i class="fas fa-times-circle"></i> DESCONECTADO</span>`;

        content.innerHTML = `
            <div class="glass-card-enterprise animate-fade-in" style="padding: 2.5rem; max-width: 1050px; margin: 0 auto; border-color: rgba(204, 255, 0, 0.3);">
                
                <!-- Encabezado -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 style="color: #CCFF00; margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 12px; font-weight: 900;">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; background:rgba(15,23,42,0.9); border:2px solid #CCFF00; box-shadow:0 0 15px rgba(204,255,0,0.5); animation:pulseGlow 2s infinite;">
                                <i class="fas fa-heartbeat" style="font-size:1.1rem; color:#CCFF00;"></i>
                            </span>
                            Telemetría & Salud del Sistema
                        </h2>
                        <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-top: 6px;">
                            Monitor de infraestructura, latencia Firestore, memoria PWA y control de caché en vivo.
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="window.AdminViews.system_telemetry()" class="btn-primary-pro" style="background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 8px 16px; font-size: 0.8rem; border-radius: 10px; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i> TEST DE PING
                        </button>
                        <button id="btn-purge-cache-main" onclick="window.forceUpdateApp()" class="btn-primary-pro" style="background: #CCFF00; color: #000; font-weight: 950; border: none; padding: 8px 16px; font-size: 0.8rem; border-radius: 10px; cursor: pointer; box-shadow: 0 0 15px rgba(204,255,0,0.4);">
                            <i class="fas fa-trash-alt"></i> PURGAR CACHÉ PWA 🚀
                        </button>
                    </div>
                </div>

                <!-- Tarjetas de Estadísticas Principales -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; margin-bottom: 2rem;">
                    
                    <div class="glass-card-enterprise" style="padding: 1.4rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 800; text-transform: uppercase;">FIRESTORE PING</span>
                            <i class="fas fa-satellite-dish" style="color: #CCFF00;"></i>
                        </div>
                        <div style="font-size: 1.6rem; font-weight: 900; color: ${isConnected ? '#00E36D' : '#ef4444'};">
                            ${lastPingMs ? `${lastPingMs} ms` : (isConnected ? 'OK' : 'FAIL')}
                        </div>
                        <div style="margin-top: 8px;">${dbStatusBadge}</div>
                    </div>

                    <div class="glass-card-enterprise" style="padding: 1.4rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 800; text-transform: uppercase;">CACHÉ PWA</span>
                            <i class="fas fa-layer-group" style="color: #38bdf8;"></i>
                        </div>
                        <div style="font-size: 1.1rem; font-weight: 900; color: #38bdf8; word-break: break-all;">
                            ${activeCache}
                        </div>
                        <div style="margin-top: 8px;">
                            <span class="admin-telemetry-pill success"><i class="fas fa-cogs"></i> ${swCount} SW Registrado(s)</span>
                        </div>
                    </div>

                    <div class="glass-card-enterprise" style="padding: 1.4rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 800; text-transform: uppercase;">LOCAL STORAGE</span>
                            <i class="fas fa-database" style="color: #f59e0b;"></i>
                        </div>
                        <div style="font-size: 1.6rem; font-weight: 900; color: #f59e0b;">
                            ~${storageKb} KB
                        </div>
                        <div style="margin-top: 8px;">
                            <span class="admin-telemetry-pill warning">${storageKeysCount} Claves en Memoria</span>
                        </div>
                    </div>

                    <div class="glass-card-enterprise" style="padding: 1.4rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 800; text-transform: uppercase;">ESTADO CLIENTE</span>
                            <i class="fas fa-wifi" style="color: ${navigator.onLine ? '#00E36D' : '#ef4444'};"></i>
                        </div>
                        <div style="font-size: 1.6rem; font-weight: 900; color: #fff;">
                            ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}
                        </div>
                        <div style="margin-top: 8px;">
                            <span class="admin-telemetry-pill ${hasErrors ? 'danger' : 'success'}">
                                ${hasErrors ? `⚠️ ${errors.length} Errores` : '✅ 0 Errores JS'}
                            </span>
                        </div>
                    </div>

                </div>

                <!-- Detalle de Registro de Excepciones -->
                <div class="glass-card-enterprise" style="padding: 1.8rem; border-radius: 18px; background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
                        <h3 style="margin: 0; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-file-medical-alt" style="color: #CCFF00;"></i> Registro de Excepciones en Sesión (${errors.length})
                        </h3>
                        ${hasErrors ? `
                            <button onclick="window.clearTelemetryErrors()" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer;">
                                <i class="fas fa-trash"></i> Limpiar Registro
                            </button>
                        ` : ''}
                    </div>

                    ${hasErrors ? `
                        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto;">
                            ${errors.map((e, idx) => `
                                <div style="background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22); padding: 12px; border-radius: 12px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: 900; color: #ff8080; font-size: 0.8rem;">[#${idx+1}] ${e.title}</span>
                                        <span style="font-size: 0.65rem; color: rgba(255,255,255,0.5);">${e.time}</span>
                                    </div>
                                    <div style="font-family: monospace; font-size: 0.75rem; color: #f1f5f9; margin-top: 6px; word-break: break-all;">
                                        ${e.message}
                                    </div>
                                    ${e.stack ? `
                                        <details style="margin-top: 8px;">
                                            <summary style="color: #38bdf8; cursor: pointer; font-size: 0.65rem; font-weight: 800;">VER STACK TRACE</summary>
                                            <pre style="margin-top: 6px; padding: 10px; background: rgba(0,0,0,0.5); border-radius: 8px; font-size: 0.68rem; color: #94a3b8; overflow-x: auto; white-space: pre-wrap; font-family: monospace;">${e.stack}</pre>
                                        </details>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 2rem 0; color: rgba(255,255,255,0.4);">
                            <i class="fas fa-shield-heart" style="font-size: 2.5rem; color: #00E36D; margin-bottom: 12px; display: block;"></i>
                            <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">Sistema Estable</div>
                            <div style="font-size: 0.75rem; margin-top: 4px;">No se han detectado fallos ni excepciones no controladas.</div>
                        </div>
                    `}
                </div>

                <!-- Botones de Acción Avanzados -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <button onclick="localStorage.removeItem('local_ranking_cache'); alert('✅ Caché de ranking local eliminada.');" class="btn-primary-pro" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
                        <i class="fas fa-eraser"></i> Limpiar Caché Ranking
                    </button>
                    <button onclick="window.location.reload(true)" class="btn-primary-pro" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
                        <i class="fas fa-rotate"></i> Recarga Suave
                    </button>
                    <button onclick="window.forceUpdateApp()" class="btn-primary-pro" style="background: rgba(204,255,0,0.15); border: 1px solid #CCFF00; color: #CCFF00; padding: 12px; border-radius: 12px; font-weight: 900; font-size: 0.75rem; cursor: pointer;">
                        <i class="fas fa-bolt"></i> Limpieza Total & Recarga Forzada
                    </button>
                </div>

            </div>
        `;
    };

    console.log('🩺 [SystemTelemetry] Módulo de telemetría de administración inicializado.');
})();
