/**
 * 🛡️ SecurityArmor.js Elite v3.0
 * Cyber-Armor Layer for SOMOSPADEL
 * 
 * protection level: 200% (Cyber-Engineer Grade)
 */
(function () {
    'use strict';

    // 1. Disable Right Click & Long Press (Mobile)
    document.addEventListener('contextmenu', event => event.preventDefault());

    // 2. Disable Inspection & Critical Shortcuts
    document.onkeydown = function (e) {
        // prohibited: F12 (123), I (73), J (74), U (85), S (83), P (80), F (70), C (67)
        const prohibited = [123, 73, 74, 85, 83, 80, 70, 67];
        const isMeta = e.ctrlKey || e.metaKey || e.altKey;

        if (prohibited.includes(e.keyCode) && (isMeta || e.keyCode === 123)) {
            // Special exception for Ctrl+C if on selective inputs (optional)
            return false;
        }
    };

    // 3. Anti-Selection & Premium UI Lock
    const style = document.createElement('style');
    style.innerHTML = `
        * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
            -webkit-touch-callout: none !important;
        }
        input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
        }
        /* Visual Feedback for blocked actions */
        body.blocked {
            filter: blur(10px) grayscale(1);
            pointer-events: none;
            transition: all 0.5s ease;
        }
    `;
    document.head.appendChild(style);

    // 4. Elite DevTools Detection & Auto-Lock
    const secureLock = function () {
        const start = performance.now();
        debugger; // Trap
        const end = performance.now();

        // Detection heuristics
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;
        const isDebugging = end - start > 100;

        if (isDebugging || widthDiff || heightDiff) {
            document.body.classList.add('blocked');
            document.body.innerHTML = `
                <div style="height:100vh; background:#000; color:#00E36D; display:flex; align-items:center; justify-content:center; font-family:'Outfit', sans-serif; text-align:center; padding:40px;">
                    <div style="max-width:600px; border:2px solid #00E36D; padding:40px; border-radius:30px; box-shadow: 0 0 50px rgba(0,227,109,0.3);">
                        <h1 style="font-size:3.5rem; margin-bottom:20px; font-weight:900;">🛡️ ACCESO BLOQUEADO</h1>
                        <p style="font-size:1.2rem; line-height:1.6; color:#888;">El blindaje **Cyber-Armor Elite** ha detectado un intento de inspección o depuración no autorizado.</p>
                        <p style="font-size:1rem; margin-top:20px; color:#555;">Por seguridad, esta sesión ha sido congelada.<br>Cierra las herramientas de desarrollo y recarga la aplicación.</p>
                        <button onclick="location.reload()" style="margin-top:30px; background:#00E36D; color:black; border:none; padding:15px 40px; border-radius:15px; font-weight:950; cursor:pointer; text-transform:uppercase;">REINTENTAR ACCESO</button>
                    </div>
                </div>
            `;
            throw new Error("Cyber-Armor Security Exception: Environment Compromised");
        }
    };

    // Constant monitoring
    setInterval(secureLock, 1500);

    // 5. Console Obfuscation (Stealth Mode)
    const logs = [];
    const originalLog = console.log;

    // Silence common logs but keep Armor activation visible
    console.log = (msg) => { if (typeof msg === 'string' && msg.includes('Armor')) originalLog("%c" + msg, "color: #00E36D; font-weight: bold;"); };
    console.warn = () => { };
    console.error = () => { };
    console.info = () => { };
    console.debug = () => { };
    console.clear();

    console.log("🛡️ Blindaje Cyber-Armor Elite v3.0 [ACTIVE-SECURE]");
})();
