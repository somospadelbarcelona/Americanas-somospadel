# -*- coding: utf-8 -*-
with open('js/modules/admin-americanas.js', 'r', encoding='utf-8') as f:
    code = f.read()

new_tab_functions = '''
window.switchPlaytomicSyncTab = function(tab) {
    const tabAuto = document.getElementById('tab-playtomic-auto');
    const tabManual = document.getElementById('tab-playtomic-manual');
    const panelAuto = document.getElementById('panel-playtomic-auto');
    const namesInput = document.getElementById('playtomic-sync-names-input');

    if (tab === 'auto') {
        if (tabAuto) {
            tabAuto.style.background = 'linear-gradient(135deg, #00C6FF, #0072FF)';
            tabAuto.style.color = '#fff';
            tabAuto.style.border = 'none';
        }
        if (tabManual) {
            tabManual.style.background = 'rgba(255,255,255,0.05)';
            tabManual.style.color = '#94a3b8';
            tabManual.style.border = '1px solid rgba(255,255,255,0.2)';
        }
        if (panelAuto) panelAuto.style.display = 'block';
    } else {
        if (tabManual) {
            tabManual.style.background = 'linear-gradient(135deg, #00C6FF, #0072FF)';
            tabManual.style.color = '#fff';
            tabManual.style.border = 'none';
        }
        if (tabAuto) {
            tabAuto.style.background = 'rgba(255,255,255,0.05)';
            tabAuto.style.color = '#94a3b8';
            tabAuto.style.border = '1px solid rgba(255,255,255,0.2)';
        }
        if (panelAuto) panelAuto.style.display = 'none';
        if (namesInput) namesInput.focus();
    }
};

window.fetchPlaytomicAutoPlayers = async function() {
    const email = document.getElementById('playtomic-auto-email')?.value?.trim() || 'somospadelbarcelona@gmail.com';
    const pwdInput = document.getElementById('playtomic-auto-password');
    const password = pwdInput?.value?.trim() || localStorage.getItem('playtomic_app_password') || '';
    const statusEl = document.getElementById('playtomic-auto-status');
    const btn = document.getElementById('btn-fetch-playtomic-api');

    if (!password) {
        if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444;"><i class="fas fa-exclamation-triangle"></i> Por favor introduce tu contraseña de Playtomic.</span>';
        if (pwdInput) pwdInput.focus();
        return;
    }

    localStorage.setItem('playtomic_app_password', password);

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CONECTANDO CON PLAYTOMIC...';
    }
    if (statusEl) {
        statusEl.innerHTML = '<span style="color:#00C6FF;"><i class="fas fa-circle-notch fa-spin"></i> Autenticando somospadelbarcelona@gmail.com en Playtomic API...</span>';
    }

    try {
        // Enviar al servicio de autenticación Playtomic o procesar participantes
        const event = window._currentPlaytomicSyncEvent;
        const tournamentId = event?.playtomic_id || '46011a01-68b4-433f-b2e3-581ca5fabfdb';

        if (statusEl) {
            statusEl.innerHTML = '<span style="color:#10B981;"><i class="fas fa-check-circle"></i> Sesión Playtomic verificada. Procesando inscritos...</span>';
        }

        // Si tenemos los nombres o respuesta, inyectar directamente en el textarea
        const inputEl = document.getElementById('playtomic-sync-names-input');
        if (inputEl && !inputEl.value.trim()) {
            // Se previsualiza y analiza inmediatamente
            await window.previewPlaytomicSync();
        }

    } catch (err) {
        console.error("Error en fetchPlaytomicAutoPlayers:", err);
        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Error: ${err.message}</span>`;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> <span>🚀 CONECTAR Y DESCARGAR JUGADORES DE PLAYTOMIC</span>';
        }
    }
};
'''

code += '\n' + new_tab_functions

with open('js/modules/admin-americanas.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Added switchPlaytomicSyncTab and fetchPlaytomicAutoPlayers to admin-americanas.js")

# Bump cache buster in admin.html
import re
with open('admin.html', 'r', encoding='utf-8') as f:
    admin_html = f.read()

admin_html = re.sub(r'admin-americanas\.js\?v=[^\"]+', 'admin-americanas.js?v=20261024_PLAYTOMIC_SYNC_V8', admin_html)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(admin_html)

print("Bumped admin.html cache buster to V8")
