/**
 * 🎾 CourtScoreboard.js — Marcador Digital de Pista para SomosPadel BCN
 * Diseñado para móvil / tablet apoyado en pista.
 * Fullscreen, alto contraste OLED/Neón, Reglas FIP (Punto de Oro / Ventajas),
 * Tie-break a 7 o 10, síntesis de voz en español, Wake Lock y soporte Bluetooth/Atajos.
 */
(function () {
    'use strict';

    class CourtScoreboard {
        constructor() {
            this.isOpen = false;
            this.wakeLock = null;
            this.speechEnabled = true;
            this.soundEnabled = true;
            this.audioCtx = null;

            // Configuración del partido
            this.config = {
                goldenPoint: true,        // true = Punto de Oro en 40-40, false = Ventajas
                tiebreakAt: 6,            // Juegos para tie-break (normalmente 6-6)
                tiebreakPoints: 7,        // Puntos de tie-break (7 o 10 para super tie-break)
                maxSets: 3,               // 1, 3 o 5 sets
                teamAName: 'Pareja A',
                teamBName: 'Pareja B',
                serverTeam: 'A'           // 'A' o 'B'
            };

            // Estado del partido
            this.state = this.getInitialState();
            this.history = []; // Pila para deshacer (Undo)

            this.initKeyboardShortcuts();
        }

        getInitialState() {
            return {
                pointsA: 0,              // 0=0, 1=15, 2=30, 3=40, 4=Ventaja
                pointsB: 0,
                gamesA: 0,
                gamesB: 0,
                setsA: 0,
                setsB: 0,
                currentSet: 1,
                completedSets: [],       // Array de { a: number, b: number, tbA?: number, tbB?: number }
                isTiebreak: false,
                tiebreakPointsA: 0,
                tiebreakPointsB: 0,
                serverTeam: this.config ? this.config.serverTeam : 'A',
                initialTiebreakServer: 'A',
                isFinished: false,
                winner: null,
                pointNumberInTiebreak: 0
            };
        }

        /**
         * Inicializa o sintetiza audio para beeps usando Web Audio API
         */
        playBeep(freq = 600, type = 'sine', duration = 0.12) {
            if (!this.soundEnabled) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                if (!this.audioCtx) this.audioCtx = new AudioContext();
                if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + duration);
            } catch (e) {
                // Audio no soportado o bloqueado
            }
        }

        playChime(victory = false) {
            if (!this.soundEnabled) return;
            if (victory) {
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                    setTimeout(() => this.playBeep(f, 'triangle', 0.35), i * 140);
                });
            } else {
                this.playBeep(880, 'sine', 0.2);
            }
        }

        /**
         * Síntesis de voz en español nativa del navegador
         */
        speak(text) {
            if (!this.speechEnabled || !('speechSynthesis' in window)) return;
            try {
                window.speechSynthesis.cancel(); // Detener locución previa
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-ES';
                utterance.rate = 1.05;
                utterance.pitch = 1.0;

                const voices = window.speechSynthesis.getVoices();
                const spanishVoice = voices.find(v => v.lang.startsWith('es'));
                if (spanishVoice) utterance.voice = spanishVoice;

                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.warn('Speech error:', e);
            }
        }

        /**
         * Mantiene la pantalla encendida (Wake Lock)
         */
        async requestWakeLock() {
            if ('wakeLock' in navigator) {
                try {
                    this.wakeLock = await navigator.wakeLock.request('screen');
                    this.wakeLock.addEventListener('release', () => {
                        this.wakeLock = null;
                    });
                } catch (err) {
                    console.log('Wake Lock no disponible o denegado:', err.message);
                }
            }
        }

        releaseWakeLock() {
            if (this.wakeLock) {
                this.wakeLock.release().catch(() => {});
                this.wakeLock = null;
            }
        }

        /**
         * Guarda snapshot para la función Deshacer (Undo)
         */
        saveStateForUndo() {
            const snapshot = JSON.stringify(this.state);
            this.history.push(snapshot);
            if (this.history.length > 50) this.history.shift();
        }

        undo() {
            if (this.history.length === 0) {
                this.showNotice('Nada que deshacer');
                return;
            }
            const previous = JSON.parse(this.history.pop());
            this.state = previous;
            this.playBeep(350, 'sawtooth', 0.15);
            this.render();
            this.showNotice('Acción deshecha ↩');
        }

        /**
         * Suma punto a un equipo ('A' o 'B')
         */
        addPoint(team) {
            if (team !== 'A' && team !== 'B') return;
            if (this.state.isFinished) {
                this.showNotice('El partido ya ha finalizado');
                return;
            }

            this.saveStateForUndo();
            const otherTeam = team === 'A' ? 'B' : 'A';

            if (this.state.isTiebreak) {
                this.handleTiebreakPoint(team);
            } else {
                this.handleRegularPoint(team, otherTeam);
            }

            this.render();
        }

        handleRegularPoint(team, otherTeam) {
            const pKey = team === 'A' ? 'pointsA' : 'pointsB';
            const oKey = team === 'A' ? 'pointsB' : 'pointsA';

            const myPts = this.state[pKey];
            const othPts = this.state[oKey];

            // 0, 15, 30 -> 15, 30, 40
            if (myPts < 3) {
                this.state[pKey]++;
                this.playBeep(team === 'A' ? 660 : 540);
                this.speakScore();
                return;
            }

            // Ya estábamos en 40
            if (myPts === 3) {
                if (othPts < 3) {
                    // Gana juego directo (ej. 40-0, 40-15, 40-30)
                    this.winGame(team);
                } else if (othPts === 3) {
                    // 40-40 (Deuce)
                    if (this.config.goldenPoint) {
                        // Con Punto de Oro, este punto gana el juego
                        this.winGame(team, true);
                    } else {
                        // Con Ventaja clásica
                        this.state[pKey] = 4; // Ventaja
                        this.playBeep(750, 'triangle', 0.2);
                        this.speak(`Ventaja ${this.getTeamName(team)}`);
                    }
                } else if (othPts === 4) {
                    // El otro tenía ventaja -> vuelve a iguales
                    this.state[oKey] = 3;
                    this.playBeep(500, 'sine', 0.2);
                    this.speak('Iguales');
                }
                return;
            }

            // Tenía ventaja (myPts === 4) -> Gana el juego
            if (myPts === 4) {
                this.winGame(team);
            }
        }

        handleTiebreakPoint(team) {
            const pKey = team === 'A' ? 'tiebreakPointsA' : 'tiebreakPointsB';
            const oKey = team === 'A' ? 'tiebreakPointsB' : 'tiebreakPointsA';

            this.state[pKey]++;
            this.state.pointNumberInTiebreak++;

            const myTb = this.state[pKey];
            const othTb = this.state[oKey];
            const minPoints = this.config.tiebreakPoints; // 7 o 10

            this.playBeep(team === 'A' ? 700 : 580);

            // Cambio de saque en Tie-break:
            // El primer punto saca el que le tocaba. Luego sacan 2 puntos cada uno.
            // Si punto número 1 terminado -> cambia de sacador.
            // A partir de ahí, cambia cada 2 puntos (puntos 3, 5, 7...).
            const totalPts = myTb + othTb;
            if (totalPts === 1 || (totalPts > 1 && totalPts % 2 === 1)) {
                this.toggleServer(false);
            }

            // Cambio de pista cada 6 puntos
            if (totalPts % 6 === 0) {
                this.showNotice('🔄 CAMBIO DE PISTA (6 puntos)');
                this.speak('Cambio de pista');
            }

            // ¿Ganó el set?
            if (myTb >= minPoints && (myTb - othTb) >= 2) {
                this.winSet(team, true);
            } else {
                this.speak(`${myTb} a ${othTb}`);
            }
        }

        winGame(team, wasGoldenPoint = false) {
            const gKey = team === 'A' ? 'gamesA' : 'gamesB';
            const oKey = team === 'A' ? 'gamesB' : 'gamesA';

            this.state[gKey]++;
            this.state.pointsA = 0;
            this.state.pointsB = 0;

            this.playChime(false);

            const myGames = this.state[gKey];
            const othGames = this.state[oKey];

            // Cambio de saque habitual tras cada juego
            this.toggleServer(true);

            // Aviso de cambio de pista si la suma de juegos es impar
            if ((myGames + othGames) % 2 === 1) {
                this.showNotice('🔄 CAMBIO DE PISTA');
            }

            // Comprobar si se activa Tie-break o se gana Set
            if (myGames === this.config.tiebreakAt && othGames === this.config.tiebreakAt) {
                // Entramos a Tie-break
                this.state.isTiebreak = true;
                this.state.tiebreakPointsA = 0;
                this.state.tiebreakPointsB = 0;
                this.state.pointNumberInTiebreak = 0;
                this.state.initialTiebreakServer = this.state.serverTeam;
                this.speak(`Juego ${this.getTeamName(team)}. 6 iguales. ¡Tie break!`);
                this.showNotice('🔥 ¡TIE-BREAK!');
                return;
            }

            // Ganar set: al menos 6 juegos y diferencia de 2, o 7-5
            if ((myGames >= 6 && (myGames - othGames) >= 2) || (myGames === 7 && othGames === 5)) {
                this.winSet(team, false);
            } else {
                const phrase = wasGoldenPoint 
                    ? `¡Punto de oro! Juego para ${this.getTeamName(team)}`
                    : `Juego para ${this.getTeamName(team)}. ${this.state.gamesA} a ${this.state.gamesB}`;
                this.speak(phrase);
            }
        }

        winSet(team, fromTiebreak = false) {
            const sKey = team === 'A' ? 'setsA' : 'setsB';
            this.state[sKey]++;

            // Guardar historial del set
            const setRecord = {
                a: this.state.gamesA,
                b: this.state.gamesB
            };
            if (fromTiebreak) {
                setRecord.tbA = this.state.tiebreakPointsA;
                setRecord.tbB = this.state.tiebreakPointsB;
                if (team === 'A') {
                    this.state.gamesA = 7;
                    setRecord.a = 7;
                } else {
                    this.state.gamesB = 7;
                    setRecord.b = 7;
                }
            }
            this.state.completedSets.push(setRecord);

            const setsNeeded = Math.ceil(this.config.maxSets / 2);
            if (this.state[sKey] >= setsNeeded) {
                // PARTIDO GANADO
                this.state.isFinished = true;
                this.state.winner = team;
                this.playChime(true);
                this.speak(`¡Set y partido para ${this.getTeamName(team)}! Enhorabuena.`);
                this.launchConfetti();
            } else {
                // Iniciar siguiente set
                this.state.currentSet++;
                this.state.gamesA = 0;
                this.state.gamesB = 0;
                this.state.pointsA = 0;
                this.state.pointsB = 0;
                this.state.isTiebreak = false;
                this.state.tiebreakPointsA = 0;
                this.state.tiebreakPointsB = 0;
                if (fromTiebreak) {
                    // Quien no empezó sacando en el tiebreak saca primero en el siguiente set (Regla FIP)
                    this.state.serverTeam = this.state.initialTiebreakServer === 'A' ? 'B' : 'A';
                }
                this.playChime(true);
                this.speak(`Set para ${this.getTeamName(team)}. Comienza el set ${this.state.currentSet}`);
                this.showNotice(`🏆 Set ${this.state.currentSet - 1} para ${this.getTeamName(team)}`);
            }
        }

        toggleServer(notify = true) {
            this.state.serverTeam = this.state.serverTeam === 'A' ? 'B' : 'A';
            if (notify) {
                this.showNotice(`🎾 Saque: ${this.getTeamName(this.state.serverTeam)}`, 1200);
            }
        }

        swapSides() {
            this.saveStateForUndo();
            // Invertir nombres y lados visuales
            const tempName = this.config.teamAName;
            this.config.teamAName = this.config.teamBName;
            this.config.teamBName = tempName;

            const tempPts = this.state.pointsA;
            this.state.pointsA = this.state.pointsB;
            this.state.pointsB = tempPts;

            const tempGms = this.state.gamesA;
            this.state.gamesA = this.state.gamesB;
            this.state.gamesB = tempGms;

            const tempSets = this.state.setsA;
            this.state.setsA = this.state.setsB;
            this.state.setsB = tempSets;

            const tempTb = this.state.tiebreakPointsA;
            this.state.tiebreakPointsA = this.state.tiebreakPointsB;
            this.state.tiebreakPointsB = tempTb;

            this.state.serverTeam = this.state.serverTeam === 'A' ? 'B' : 'A';

            this.state.completedSets = this.state.completedSets.map(s => ({
                a: s.b,
                b: s.a,
                tbA: s.tbB,
                tbB: s.tbA
            }));

            this.showNotice('🔄 Equipos cambiados de lado');
            this.render();
        }

        getTeamName(team) {
            return team === 'A' ? this.config.teamAName : this.config.teamBName;
        }

        getPointDisplay(points, otherPoints) {
            if (this.state.isTiebreak) return '';
            if (points === 0) return '0';
            if (points === 1) return '15';
            if (points === 2) return '30';
            if (points === 3) {
                if (otherPoints === 3) {
                    return this.config.goldenPoint ? 'ORO' : '40';
                }
                return '40';
            }
            if (points === 4) return 'AD';
            return '0';
        }

        speakScore() {
            if (this.state.isTiebreak) return;
            const pA = this.state.pointsA;
            const pB = this.state.pointsB;

            if (pA === 3 && pB === 3) {
                if (this.config.goldenPoint) {
                    this.speak('¡Punto de oro!');
                } else {
                    this.speak('40 iguales');
                }
                return;
            }

            if (pA === pB && pA > 0) {
                const map = { 1: '15 iguales', 2: '30 iguales' };
                this.speak(map[pA] || 'Iguales');
                return;
            }

            const term = (pts) => ({ 0: 'cero', 1: '15', 2: '30', 3: '40' }[pts] || pts);
            // El sacador se canta primero en pádel tradicional
            if (this.state.serverTeam === 'A') {
                this.speak(`${term(pA)} a ${term(pB)}`);
            } else {
                this.speak(`${term(pB)} a ${term(pA)}`);
            }
        }

        showNotice(msg, duration = 1800) {
            const el = document.getElementById('sp-court-notice');
            if (!el) return;
            el.innerHTML = msg;
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%, 0) scale(1)';
            if (this._noticeTimer) clearTimeout(this._noticeTimer);
            this._noticeTimer = setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translate(-50%, -15px) scale(0.95)';
            }, duration);
        }

        toggleFullscreen() {
            const root = document.getElementById('court-scoreboard-overlay');
            if (!root) return;

            if (!document.fullscreenElement) {
                if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
                else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            }
        }

        initKeyboardShortcuts() {
            window.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;
                // Ignorar si el usuario está escribiendo en un input
                if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

                if (e.key === 'ArrowLeft' || e.key === '1') {
                    e.preventDefault();
                    this.addPoint('A');
                } else if (e.key === 'ArrowRight' || e.key === '2') {
                    e.preventDefault();
                    this.addPoint('B');
                } else if (e.key === 'Backspace' || e.key === 'u' || e.key === 'U') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    this.toggleServer();
                    this.render();
                } else if (e.key === 'f' || e.key === 'F') {
                    e.preventDefault();
                    this.toggleFullscreen();
                } else if (e.key === 'Escape') {
                    // Cerrar si no está en fullscreen
                    if (!document.fullscreenElement) this.close();
                }
            });
        }

        launchConfetti() {
            const canvas = document.getElementById('court-confetti-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const colors = ['#CCFF00', '#00E5FF', '#FF0055', '#FFFFFF', '#FFD700'];

            for (let i = 0; i < 120; i++) {
                particles.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    vx: (Math.random() - 0.5) * 18,
                    vy: (Math.random() - 0.7) * 20,
                    size: Math.random() * 8 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rot: Math.random() * 360,
                    vRot: (Math.random() - 0.5) * 12,
                    opacity: 1
                });
            }

            let frames = 0;
            function animate() {
                if (frames > 140) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    return;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.35; // Gravedad
                    p.rot += p.vRot;
                    p.opacity -= 0.007;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rot * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
                    ctx.restore();
                });
                frames++;
                requestAnimationFrame(animate);
            }
            animate();
        }

        open(options = {}) {
            options = options || {};
            if (options.teamA) this.config.teamAName = options.teamA;
            if (options.teamB) this.config.teamBName = options.teamB;
            if (options.goldenPoint !== undefined) this.config.goldenPoint = !!options.goldenPoint;
            if (options.maxSets !== undefined) this.config.maxSets = Number(options.maxSets) || 3;

            this.isOpen = true;
            this.requestWakeLock();

            // Re-adquirir wakeLock si el usuario cambia de pestaña y vuelve (adjuntar una sola vez)
            if (!this._visibilityBound && typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
                this._visibilityBound = true;
                document.addEventListener('visibilitychange', () => {
                    if (this.isOpen && document.visibilityState === 'visible') {
                        this.requestWakeLock();
                    }
                });
            }

            if (typeof document === 'undefined' || !document.body) return;

            let overlay = document.getElementById('court-scoreboard-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'court-scoreboard-overlay';
                document.body.appendChild(overlay);
            }

            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 999999;
                background: #06070a; color: #ffffff;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                user-select: none; -webkit-user-select: none;
                overflow: hidden; display: flex; flex-direction: column;
            `;

            this.render();
            this.showNotice('🎾 ¡Toca cada mitad de pantalla para sumar punto!', 2500);
        }

        close() {
            this.isOpen = false;
            this.releaseWakeLock();
            if (typeof document !== 'undefined') {
                if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
                    document.exitFullscreen().catch(() => {});
                }
                const overlay = document.getElementById('court-scoreboard-overlay');
                if (overlay && typeof overlay.remove === 'function') overlay.remove();
            }
        }

        openSettings() {
            const modal = document.createElement('div');
            modal.id = 'court-settings-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 1000000;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
                display: flex; align-items: center; justify-content: center; padding: 20px;
            `;

            modal.innerHTML = `
                <div style="background: #11141c; border: 1.5px solid rgba(204,255,0,0.3); border-radius: 24px; padding: 24px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.9); max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 950; color: #CCFF00; letter-spacing: 0.5px;">⚙️ AJUSTES DEL MARCADOR</h3>
                        <button onclick="document.getElementById('court-settings-modal').remove()" style="background: none; border: none; color: #fff; font-size: 1.4rem; cursor: pointer;">✕</button>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="font-size: 0.75rem; color: #8892b0; font-weight: 800; text-transform: uppercase;">Nombre Pareja A (Izquierda)</label>
                            <input id="cfg-team-a" type="text" value="${this.config.teamAName}" style="width: 100%; background: #1a202c; border: 1px solid #334155; color: #00E5FF; padding: 12px; border-radius: 12px; font-weight: 900; margin-top: 6px; font-size: 0.95rem; box-sizing: border-box;">
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: #8892b0; font-weight: 800; text-transform: uppercase;">Nombre Pareja B (Derecha)</label>
                            <input id="cfg-team-b" type="text" value="${this.config.teamBName}" style="width: 100%; background: #1a202c; border: 1px solid #334155; color: #CCFF00; padding: 12px; border-radius: 12px; font-weight: 900; margin-top: 6px; font-size: 0.95rem; box-sizing: border-box;">
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;">
                            <div>
                                <div style="font-weight: 900; font-size: 0.85rem;">Punto de Oro (FIP)</div>
                                <div style="font-size: 0.7rem; color: #8892b0;">Muerte súbita en 40-40 sin ventajas</div>
                            </div>
                            <input type="checkbox" id="cfg-golden-point" ${this.config.goldenPoint ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #CCFF00; cursor: pointer;">
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;">
                            <div>
                                <div style="font-weight: 900; font-size: 0.85rem;">Cantar Puntos por Voz</div>
                                <div style="font-size: 0.7rem; color: #8892b0;">Locución en español nativo</div>
                            </div>
                            <input type="checkbox" id="cfg-speech" ${this.speechEnabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #CCFF00; cursor: pointer;">
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;">
                            <div>
                                <div style="font-weight: 900; font-size: 0.85rem;">Efectos de Sonido</div>
                                <div style="font-size: 0.7rem; color: #8892b0;">Beeps al tocar pantalla</div>
                            </div>
                            <input type="checkbox" id="cfg-sounds" ${this.soundEnabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #CCFF00; cursor: pointer;">
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: #8892b0; font-weight: 800; text-transform: uppercase;">Formato del Partido</label>
                            <select id="cfg-sets" style="width: 100%; background: #1a202c; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 12px; font-weight: 900; margin-top: 6px; font-size: 0.9rem; box-sizing: border-box;">
                                <option value="1" ${this.config.maxSets === 1 ? 'selected' : ''}>1 Solo Set (Modo Express / Pozo)</option>
                                <option value="3" ${this.config.maxSets === 3 ? 'selected' : ''}>Al mejor de 3 Sets (Oficial)</option>
                                <option value="5" ${this.config.maxSets === 5 ? 'selected' : ''}>Al mejor de 5 Sets</option>
                            </select>
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: #8892b0; font-weight: 800; text-transform: uppercase;">Puntos de Tie-break</label>
                            <select id="cfg-tiebreak-pts" style="width: 100%; background: #1a202c; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 12px; font-weight: 900; margin-top: 6px; font-size: 0.9rem; box-sizing: border-box;">
                                <option value="7" ${this.config.tiebreakPoints === 7 ? 'selected' : ''}>Tie-break normal (a 7 puntos)</option>
                                <option value="10" ${this.config.tiebreakPoints === 10 ? 'selected' : ''}>Super Tie-break (a 10 puntos)</option>
                            </select>
                        </div>

                        <button id="cfg-save-btn" style="background: #CCFF00; color: #000; border: none; padding: 14px; border-radius: 14px; font-weight: 950; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; margin-top: 10px;">
                            💾 Guardar Cambios
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('cfg-save-btn').onclick = () => {
                this.config.teamAName = document.getElementById('cfg-team-a').value.trim() || 'Pareja A';
                this.config.teamBName = document.getElementById('cfg-team-b').value.trim() || 'Pareja B';
                this.config.goldenPoint = document.getElementById('cfg-golden-point').checked;
                this.speechEnabled = document.getElementById('cfg-speech').checked;
                this.soundEnabled = document.getElementById('cfg-sounds').checked;
                this.config.maxSets = parseInt(document.getElementById('cfg-sets').value, 10) || 3;
                this.config.tiebreakPoints = parseInt(document.getElementById('cfg-tiebreak-pts').value, 10) || 7;

                modal.remove();
                this.render();
                this.showNotice('Ajustes actualizados');
            };
        }

        confirmReset() {
            if (confirm('¿Estás seguro de que deseas reiniciar el marcador del partido a 0-0?')) {
                this.state = this.getInitialState();
                this.history = [];
                this.render();
                this.showNotice('Marcador reiniciado');
                this.speak('Marcador a cero');
            }
        }

        render() {
            const overlay = document.getElementById('court-scoreboard-overlay');
            if (!overlay) return;

            const isTb = this.state.isTiebreak;
            const ptsDispA = isTb ? this.state.tiebreakPointsA : this.getPointDisplay(this.state.pointsA, this.state.pointsB);
            const ptsDispB = isTb ? this.state.tiebreakPointsB : this.getPointDisplay(this.state.pointsB, this.state.pointsA);

            const isGoldenPointNow = !isTb && this.config.goldenPoint && this.state.pointsA === 3 && this.state.pointsB === 3;

            // Historial de sets
            const setsHistoryHtml = this.state.completedSets.map((s, idx) => `
                <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: clamp(0.7rem, 2vw, 1rem); display: flex; gap: 6px; align-items: center;">
                    <span style="color: #8892b0; font-size: 0.65em;">S${idx + 1}</span>
                    <span style="color: #00E5FF;">${s.a}</span>
                    <span style="color: #555;">-</span>
                    <span style="color: #CCFF00;">${s.b}</span>
                    ${s.tbA !== undefined ? `<span style="color: #FFD700; font-size: 0.6em;">(${Math.min(s.tbA, s.tbB)})</span>` : ''}
                </div>
            `).join('');

            overlay.innerHTML = `
                <!-- CANVAS CONFETTI PARA CELEBRACIÓN -->
                <canvas id="court-confetti-canvas" style="position: absolute; inset: 0; pointer-events: none; z-index: 99;"></canvas>

                <!-- TOP BAR HEADER (Compacta y accesible) -->
                <header style="height: clamp(50px, 8vh, 70px); background: #0b0d13; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; padding: 0 clamp(10px, 3vw, 24px); position: relative; z-index: 10;">
                    
                    <!-- Logo / Brand & Sets Badge -->
                    <div style="display: flex; align-items: center; gap: clamp(8px, 2vw, 16px);">
                        <div style="display: flex; align-items: center; gap: 6px; font-weight: 950; font-size: clamp(0.75rem, 2.2vw, 1.1rem); letter-spacing: 1px; color: #fff;">
                            <span style="color: #CCFF00;">SOMOS</span>PADEL
                            <span style="background: rgba(204,255,0,0.15); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); font-size: 0.55rem; padding: 2px 6px; border-radius: 6px; font-weight: 900;">PISTA</span>
                        </div>
                        
                        <!-- Completed Sets Pills -->
                        <div style="display: flex; gap: 6px;">
                            ${setsHistoryHtml}
                        </div>
                    </div>

                    <!-- Center Mode Badges (Punto de Oro / Tiebreak indicator / Ganador) -->
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.state.isFinished ? `
                            <div style="background: linear-gradient(90deg, #CCFF00, #00E36D); color: #000; font-weight: 950; font-size: clamp(0.7rem, 2vw, 0.95rem); padding: 5px 16px; border-radius: 20px; box-shadow: 0 0 20px rgba(204,255,0,0.7); letter-spacing: 1px; animation: spPulse 1s infinite alternate;">
                                🏆 ¡GANADOR: ${this.getTeamName(this.state.winner).toUpperCase()}!
                            </div>
                        ` : `
                            ${isGoldenPointNow ? `
                                <div style="background: linear-gradient(90deg, #FFD700, #FFA500); color: #000; font-weight: 950; font-size: clamp(0.65rem, 2vw, 0.85rem); padding: 4px 12px; border-radius: 20px; box-shadow: 0 0 15px rgba(255,215,0,0.6); animation: spPulse 1s infinite alternate; letter-spacing: 1px;">
                                    ⚡ PUNTO DE ORO
                                </div>
                            ` : ''}
                            ${isTb ? `
                                <div style="background: #ff0055; color: #fff; font-weight: 950; font-size: clamp(0.65rem, 2vw, 0.85rem); padding: 4px 12px; border-radius: 20px; box-shadow: 0 0 15px rgba(255,0,85,0.6); animation: spPulse 1s infinite alternate; letter-spacing: 1px;">
                                    🔥 TIE-BREAK (${this.config.tiebreakPoints} pts)
                                </div>
                            ` : ''}
                        `}
                    </div>

                    <!-- Controls Toolbar -->
                    <div style="display: flex; align-items: center; gap: clamp(6px, 1.5vw, 12px);">
                        <button onclick="window.CourtScoreboard.undo()" title="Deshacer último punto (U)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            ↩
                        </button>
                        <button onclick="window.CourtScoreboard.swapSides()" title="Cambiar de lado" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            🔄
                        </button>
                        <button onclick="window.CourtScoreboard.toggleServer()" title="Cambiar sacador (S)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            🎾
                        </button>
                        <button onclick="window.CourtScoreboard.toggleFullscreen()" title="Pantalla completa (F)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            ⛶
                        </button>
                        <button onclick="window.CourtScoreboard.openSettings()" title="Ajustes" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            ⚙️
                        </button>
                        <button onclick="window.CourtScoreboard.confirmReset()" title="Reiniciar" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            🗑️
                        </button>
                        <button onclick="window.CourtScoreboard.close()" title="Salir" style="background: rgba(255,255,255,0.12); border: none; color: #fff; width: clamp(34px, 5vw, 42px); height: clamp(34px, 5vw, 42px); border-radius: 12px; font-size: clamp(0.85rem, 2vw, 1.1rem); cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900;">
                            ✕
                        </button>
                    </div>
                </header>

                <!-- NOTIFICACIÓN HUD FLOTANTE -->
                <div id="sp-court-notice" style="position: absolute; top: clamp(65px, 10vh, 85px); left: 50%; transform: translate(-50%, -15px) scale(0.95); opacity: 0; background: rgba(18,22,32,0.95); border: 1.5px solid #CCFF00; color: #fff; padding: 10px 24px; border-radius: 30px; font-weight: 900; font-size: clamp(0.75rem, 2vw, 1rem); letter-spacing: 0.5px; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.8); pointer-events: none; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;"></div>

                <!-- MAIN SPLIT SCREEN AREA (MITAD IZQUIERDA = EQUIPO A, MITAD DERECHA = EQUIPO B) -->
                <main style="flex: 1; display: flex; width: 100%; height: calc(100% - clamp(50px, 8vh, 70px)); position: relative; overflow: hidden;">
                    
                    <!-- COURT NET DIVIDER (Línea central divisoria de pista) -->
                    <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: rgba(255,255,255,0.1); transform: translateX(-50%); z-index: 4; pointer-events: none;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #06070a; border: 1px solid rgba(255,255,255,0.15); border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #8892b0; font-weight: 900;">
                            VS
                        </div>
                    </div>

                    <!-- LEFT HALF: TEAM A (NEON CYAN #00E5FF) -->
                    <div onclick="window.CourtScoreboard.addPoint('A')" style="
                        flex: 1; height: 100%; display: flex; flex-direction: column;
                        justify-content: space-between; padding: clamp(16px, 3vh, 32px) clamp(16px, 3vw, 40px);
                        background: radial-gradient(circle at 30% 50%, rgba(0, 229, 255, 0.08) 0%, #06070a 70%);
                        cursor: pointer; position: relative; transition: background 0.15s ease;
                        border-right: 1px solid rgba(0, 229, 255, 0.1);
                    " onmouseover="this.style.background='radial-gradient(circle at 30% 50%, rgba(0, 229, 255, 0.13) 0%, #06070a 70%)'" onmouseout="this.style.background='radial-gradient(circle at 30% 50%, rgba(0, 229, 255, 0.08) 0%, #06070a 70%)'">
                        
                        <!-- Top Team Info -->
                        <div style="display: flex; justify-content: space-between; align-items: center; z-index: 2;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #00E5FF; font-size: clamp(1rem, 3vw, 1.8rem); font-weight: 950; text-transform: uppercase; letter-spacing: -0.5px;">${this.config.teamAName}</span>
                                    ${this.state.serverTeam === 'A' ? `
                                        <div style="background: rgba(0,229,255,0.2); border: 1.5px solid #00E5FF; color: #00E5FF; padding: 3px 10px; border-radius: 12px; font-size: clamp(0.6rem, 1.5vw, 0.75rem); font-weight: 950; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 12px rgba(0,229,255,0.4); animation: spBounce 1.2s infinite ease-in-out;">
                                            🎾 SAQUE
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="color: #8892b0; font-size: clamp(0.65rem, 1.8vw, 0.85rem); font-weight: 800; text-transform: uppercase; margin-top: 2px;">
                                    SETS GANADOS: <strong style="color: #fff; font-size: 1.1em;">${this.state.setsA}</strong>
                                </div>
                            </div>

                            <!-- Set Games Counter Pill -->
                            <div style="background: rgba(0, 229, 255, 0.12); border: 2px solid #00E5FF; border-radius: 18px; padding: clamp(6px, 1.5vh, 12px) clamp(14px, 2.5vw, 24px); text-align: center; box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);">
                                <div style="color: #00E5FF; font-size: clamp(0.6rem, 1.5vw, 0.75rem); font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">JUEGOS</div>
                                <div style="color: #ffffff; font-size: clamp(1.8rem, 5vw, 3rem); font-weight: 950; line-height: 1;">${this.state.gamesA}</div>
                            </div>
                        </div>

                        <!-- GIGANTIC NEON SCORE -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
                            <div style="
                                font-size: clamp(90px, 23vw, 260px);
                                font-weight: 950;
                                line-height: 0.85;
                                color: #ffffff;
                                text-shadow: 0 0 40px rgba(0, 229, 255, 0.6), 0 0 80px rgba(0, 229, 255, 0.2);
                                font-variant-numeric: tabular-nums;
                                letter-spacing: -2px;
                            ">
                                ${ptsDispA}
                            </div>
                            <div style="margin-top: 10px; color: rgba(0, 229, 255, 0.7); font-weight: 900; font-size: clamp(0.7rem, 1.8vw, 1rem); text-transform: uppercase; letter-spacing: 2px;">
                                TOCAR PARA +1 PUNTO
                            </div>
                        </div>

                        <!-- Bottom Footer Info -->
                        <div style="display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.4); font-size: clamp(0.6rem, 1.5vw, 0.75rem); font-weight: 800; z-index: 2;">
                            <span>SET ${this.state.currentSet} DE ${this.config.maxSets}</span>
                            <span>TECLA [←] O [1]</span>
                        </div>
                    </div>

                    <!-- RIGHT HALF: TEAM B (NEON LIME #CCFF00) -->
                    <div onclick="window.CourtScoreboard.addPoint('B')" style="
                        flex: 1; height: 100%; display: flex; flex-direction: column;
                        justify-content: space-between; padding: clamp(16px, 3vh, 32px) clamp(16px, 3vw, 40px);
                        background: radial-gradient(circle at 70% 50%, rgba(204, 255, 0, 0.08) 0%, #06070a 70%);
                        cursor: pointer; position: relative; transition: background 0.15s ease;
                    " onmouseover="this.style.background='radial-gradient(circle at 70% 50%, rgba(204, 255, 0, 0.13) 0%, #06070a 70%)'" onmouseout="this.style.background='radial-gradient(circle at 70% 50%, rgba(204, 255, 0, 0.08) 0%, #06070a 70%)'">
                        
                        <!-- Top Team Info -->
                        <div style="display: flex; justify-content: space-between; align-items: center; z-index: 2;">
                            <!-- Set Games Counter Pill -->
                            <div style="background: rgba(204, 255, 0, 0.12); border: 2px solid #CCFF00; border-radius: 18px; padding: clamp(6px, 1.5vh, 12px) clamp(14px, 2.5vw, 24px); text-align: center; box-shadow: 0 0 20px rgba(204, 255, 0, 0.2);">
                                <div style="color: #CCFF00; font-size: clamp(0.6rem, 1.5vw, 0.75rem); font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">JUEGOS</div>
                                <div style="color: #ffffff; font-size: clamp(1.8rem, 5vw, 3rem); font-weight: 950; line-height: 1;">${this.state.gamesB}</div>
                            </div>

                            <div style="text-align: right;">
                                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                                    ${this.state.serverTeam === 'B' ? `
                                        <div style="background: rgba(204,255,0,0.2); border: 1.5px solid #CCFF00; color: #CCFF00; padding: 3px 10px; border-radius: 12px; font-size: clamp(0.6rem, 1.5vw, 0.75rem); font-weight: 950; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 12px rgba(204,255,0,0.4); animation: spBounce 1.2s infinite ease-in-out;">
                                            🎾 SAQUE
                                        </div>
                                    ` : ''}
                                    <span style="color: #CCFF00; font-size: clamp(1rem, 3vw, 1.8rem); font-weight: 950; text-transform: uppercase; letter-spacing: -0.5px;">${this.config.teamBName}</span>
                                </div>
                                <div style="color: #8892b0; font-size: clamp(0.65rem, 1.8vw, 0.85rem); font-weight: 800; text-transform: uppercase; margin-top: 2px;">
                                    SETS GANADOS: <strong style="color: #fff; font-size: 1.1em;">${this.state.setsB}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- GIGANTIC NEON SCORE -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
                            <div style="
                                font-size: clamp(90px, 23vw, 260px);
                                font-weight: 950;
                                line-height: 0.85;
                                color: #ffffff;
                                text-shadow: 0 0 40px rgba(204, 255, 0, 0.6), 0 0 80px rgba(204, 255, 0, 0.2);
                                font-variant-numeric: tabular-nums;
                                letter-spacing: -2px;
                            ">
                                ${ptsDispB}
                            </div>
                            <div style="margin-top: 10px; color: rgba(204, 255, 0, 0.7); font-weight: 900; font-size: clamp(0.7rem, 1.8vw, 1rem); text-transform: uppercase; letter-spacing: 2px;">
                                TOCAR PARA +1 PUNTO
                            </div>
                        </div>

                        <!-- Bottom Footer Info -->
                        <div style="display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.4); font-size: clamp(0.6rem, 1.5vw, 0.75rem); font-weight: 800; z-index: 2;">
                            <span>TECLA [→] O [2]</span>
                            <span>REGLA: ${this.config.goldenPoint ? 'PUNTO DE ORO' : 'VENTAJAS'}</span>
                        </div>
                    </div>
                </main>

                <style>
                    @keyframes spPulse {
                        0% { transform: scale(0.96); opacity: 0.9; }
                        100% { transform: scale(1.04); opacity: 1; }
                    }
                    @keyframes spBounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                </style>
            `;
        }
    }

    // Exportar singleton a window
    window.CourtScoreboard = new CourtScoreboard();
    console.log('🎾 [CourtScoreboard] Módulo Marcador Digital de Pista cargado correctamente.');
})();
