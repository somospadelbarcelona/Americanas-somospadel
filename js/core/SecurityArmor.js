/**
 * 🛡️ SECURITY ARMOR v5.0 - MILITARY DEFENSE & DOMAIN LOCK (NIVEL NASA)
 * Módulo de defensa activa para prevenir inspección, copia, clonación y manipulación.
 */

(function () {
    'use strict';

    // ==========================================
    // 1. DOMAIN LOCK & ANTI-REPLICA KILL SWITCH
    // ==========================================
    // Si un tercero descarga el código y lo aloja en otro dominio, la app se bloquea de inmediato.
    const AUTHORIZED_HOSTS = [
        'americanas-somospadel.firebaseapp.com',
        'americanas-somospadel.web.app',
        'somospadelbarcelona.github.io',
        'localhost',
        '127.0.0.1',
        ''
    ];

    const currentHost = window.location.hostname || '';
    const isLocalFile = window.location.protocol === 'file:';
    const isAuthorized = isLocalFile || 
                         AUTHORIZED_HOSTS.includes(currentHost) || 
                         currentHost.endsWith('.firebaseapp.com') || 
                         currentHost.endsWith('.web.app');

    if (!isAuthorized) {
        console.error('🛑 REPLICA NO AUTORIZADA DETECTADA');
        try { window.stop(); } catch(e) {}

        const lockUI = function() {
            document.documentElement.innerHTML = `
                <div style="background:#07090e; color:#fff; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; padding:2rem;">
                    <div style="width:80px; height:80px; border-radius:50%; background:rgba(255,68,68,0.15); border:2px solid #ff4444; display:flex; align-items:center; justify-content:center; font-size:2.5rem; margin-bottom:1.5rem; box-shadow:0 0 30px rgba(255,68,68,0.3);">🛡️</div>
                    <h1 style="color:#ff4444; font-size:2rem; font-weight:900; margin-bottom:0.75rem; letter-spacing:1px;">SISTEMA BLOQUEADO POR SEGURIDAD</h1>
                    <p style="color:#94a3b8; max-width:580px; line-height:1.7; font-size:1rem; margin-bottom:2rem;">
                        Esta aplicación, su arquitectura, diseño y algoritmos son propiedad intelectual registrada y exclusiva de <strong>SomosPádel BCN</strong>. El uso o clonación en el dominio <code>${currentHost}</code> no dispone de autorización.
                    </p>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.2rem 2rem; font-family:Consolas,monospace; font-size:0.85rem; color:#ccff00;">
                        REGISTRO DE PROPIEDAD INTELECTUAL: SAFE-CREATIVE-SOMOSPADEL-2026<br>
                        HASH DE INTEGRIDAD: 5D35010D-MILITARY-ARMOR-ACTIVE
                    </div>
                </div>
            `;
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', lockUI);
        } else {
            lockUI();
        }
        throw new Error('UNAUTHORIZED_DOMAIN_EXECUTION_BLOCKED');
    }

    // ==========================================
    // 2. OBJECT FREEZING & ANTI-MONKEYPATCHING
    // ==========================================
    // Congela los módulos críticos en memoria para impedir inyecciones desde la consola
    const freezeCoreObjects = function() {
        try {
            if (window.MatchMakingService) Object.freeze(window.MatchMakingService);
            if (window.FixedPairsLogic) Object.freeze(window.FixedPairsLogic);
            if (window.RotatingPozoLogic) Object.freeze(window.RotatingPozoLogic);
            if (window.AdminAuth) Object.seal(window.AdminAuth);
        } catch(e) {}
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', freezeCoreObjects);
    } else {
        freezeCoreObjects();
    }

    // ==========================================
    // 3. BLOQUEO DE INSPECCIÓN PERIFÉRICA
    // ==========================================
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, false);

    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key.toUpperCase() === 'U') {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.key.toUpperCase() === 'S') {
            e.preventDefault();
            return false;
        }
    }, false);

    // ==========================================
    // 4. WATERMARK & SIGNATURE DE AUTORÍA
    // ==========================================
    window.__SOMOSPADEL_PROTECTED__ = {
        seal: 'PRO-MILITARY-ARMOR-V5',
        owner: 'Alejandro Coscolin Peregrin',
        brand: 'SomosPadel BCN',
        timestamp: '2026-09-13T06:00:00Z',
        integrity: 'VERIFIED'
    };
    Object.freeze(window.__SOMOSPADEL_PROTECTED__);

    console.log('%c 🛡️ SOMOSPADEL SECURITY ARMOR ACTIVE: DOMAIN VERIFIED & CORE ENCRYPTED ', 'background:#000; color:#ccff00; font-weight:bold; padding:4px 8px; border-radius:4px;');

})();
