/**
 * ShuffleAnimator.js
 * handles ultra-high-impact animations for draw/shuffle events.
 * Version: 4.0 Dark Tech Athletic Edition (SomosPadel BCN)
 */
(function () {
    'use strict';

    class ShuffleAnimator {
        constructor() {
            this.isAnimating = false;
            this._activeTimers = [];
            this._activeIntervals = [];
            this._animFrame = null;
            this._hasFinished = false;
            this._confettiParticles = [];
            this._overlay = null;
            this._onComplete = null;
            this._resizeHandler = null;
            this._finalizeTimer = null;
            this._clockInterval = null;
            this._elapsedSeconds = 0;
        }

        /**
         * Clears all registered timers and intervals cleanly.
         */
        _clearAllTimers() {
            if (this._activeTimers && this._activeTimers.length) {
                this._activeTimers.forEach(t => clearTimeout(t));
                this._activeTimers = [];
            }
            if (this._activeIntervals && this._activeIntervals.length) {
                this._activeIntervals.forEach(i => clearInterval(i));
                this._activeIntervals = [];
            }
            if (this._clockInterval) {
                clearInterval(this._clockInterval);
                this._clockInterval = null;
            }
            if (this._animFrame) {
                cancelAnimationFrame(this._animFrame);
                this._animFrame = null;
            }
            if (this._resizeHandler) {
                window.removeEventListener('resize', this._resizeHandler);
                this._resizeHandler = null;
            }
            if (this._finalizeTimer) {
                clearTimeout(this._finalizeTimer);
                this._finalizeTimer = null;
            }
        }

        _addTimer(fn, delay) {
            const id = setTimeout(() => {
                const idx = this._activeTimers.indexOf(id);
                if (idx > -1) this._activeTimers.splice(idx, 1);
                fn();
            }, delay);
            this._activeTimers.push(id);
            return id;
        }

        _addInterval(fn, delay) {
            const id = setInterval(fn, delay);
            this._activeIntervals.push(id);
            return id;
        }

        /**
         * Resolves player pool once without blocking duplicate database calls.
         */
        /**
         * Resolves player pool once without blocking duplicate database calls.
         */
        async resolvePlayerPool(data = {}) {
            const pool = [];
            const safeData = data || {};
            if (Array.isArray(safeData.players) && safeData.players.length > 0) {
                pool.push(...safeData.players);
            }
            if (Array.isArray(window._allPlayersCache) && window._allPlayersCache.length > 0) {
                pool.push(...window._allPlayersCache);
            }
            if (Array.isArray(window.allUsersCache) && window.allUsersCache.length > 0) {
                pool.push(...window.allUsersCache);
            }

            // If empty and FirebaseDB is available, attempt single fast fetch with strict timeout
            if (pool.length === 0 && window.FirebaseDB && window.FirebaseDB.players) {
                try {
                    const fastFetch = window.FirebaseDB.players.getAll();
                    const timeout = new Promise(resolve => setTimeout(() => resolve([]), 450));
                    const fetched = await Promise.race([fastFetch, timeout]);
                    if (Array.isArray(fetched) && fetched.length > 0) {
                        window._allPlayersCache = fetched;
                        pool.push(...fetched);
                    }
                } catch (e) {
                    console.warn('[ShuffleAnimator] Fast pool fetch fallback:', e);
                }
            }

            return pool;
        }

        /**
         * Main entry point for draw animation
         */
        async animate(data = {}, onComplete) {
            const safeData = data || {};

            // If already animating or overlay exists, clean up previous immediately
            if (this.isAnimating || this._overlay || document.getElementById('shuffle-animator-overlay')) {
                this.finishAnimation(this._overlay, this._onComplete, true);
            }

            this.isAnimating = true;
            this._hasFinished = false;
            this._onComplete = onComplete;
            this._clearAllTimers();

            // 1. Resolve unified pool immediately
            const playerPool = await this.resolvePlayerPool(safeData);

            // 2. Precompute match data synchronously
            const matches = safeData.matches || [];
            const matchesData = this._prepareMatchesData(matches, playerPool);

            // 3. Create Overlay DOM
            const existingOverlay = document.getElementById('shuffle-animator-overlay');
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.id = 'shuffle-animator-overlay';
            this._overlay = overlay;

            const roundNum = safeData.round || 1;
            const maxMatchCourt = matches.length ? Math.max(0, ...matches.map(m => parseInt((m && (m.court || m.pista)) || 0) || 0)) : 0;
            const numCourts = Math.max(safeData.courts || 4, maxMatchCourt, matches.length);

            overlay.innerHTML = `
                <!-- ATMOSPHERIC GLOWS -->
                <div class="sp-ambient-spot light-left"></div>
                <div class="sp-ambient-spot light-right"></div>
                <div class="sp-ambient-spot light-center"></div>

                <canvas id="shuffle-canvas" class="sp-canvas-bg"></canvas>

                <!-- TOP BAR WITH QUICK ACTIONS (Available at Millisecond 0) -->
                <div class="sp-top-actions">
                    <button id="sp-skip-btn" class="sp-action-btn sp-skip-btn" title="Saltar animación y ver resultados al instante">
                        <i class="fas fa-bolt"></i>
                        <span>SALTAR ANIMACIÓN</span>
                    </button>
                    <button id="sp-close-btn" class="sp-action-btn sp-close-btn" title="Cerrar sorteo">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- MAIN HEADER -->
                <header class="sp-draw-header">
                    <div class="sp-live-pill">
                        <span class="sp-pulse-dot"></span>
                        <span>SORTEO OFICIAL • SOMOSPADEL BCN</span>
                    </div>
                    <h1 class="sp-draw-headline">
                        <span class="sp-headline-kicker">SORTEO EN VIVO</span>
                        <span class="sp-headline-main">RONDA ${roundNum}</span>
                    </h1>
                    <p class="sp-draw-subtitle">IMPULSO & FAIR PLAY • PISTAS DEFINIDAS</p>
                </header>

                <!-- COURTS CONTAINER -->
                <main id="shuffle-container" class="sp-courts-grid">
                    <!-- Populated dynamically -->
                </main>

                <!-- BOTTOM DOCK (ATHLETIC HUD) -->
                <footer class="sp-bottom-dock">
                    <div class="sp-dock-inner">
                        <div class="sp-dock-brand">
                            <span class="sp-brand-icon">🎾</span>
                            <span class="sp-brand-tag">BCN</span>
                        </div>
                        <div class="sp-dock-ticker-container">
                            <div id="shuffle-status-marquee" class="sp-dock-ticker">
                                SORTEO OFICIAL EN PROCESO • EMPAREJAMIENTOS POR CRITERIO DE NIVEL • LISTO PARA ENTRAR A PISTA • SOMOSPADEL BCN •
                            </div>
                        </div>
                        <div class="sp-dock-meta">
                            <div class="sp-dock-timer" id="shuffle-timer">00:00</div>
                            <button id="sp-goto-courts-btn" class="sp-dock-cta-btn">
                                <i class="fas fa-arrow-right"></i>
                                <span>IR A PISTAS</span>
                            </button>
                        </div>
                    </div>
                    <div class="sp-dock-progress-bar"><div id="sp-auto-close-bar" class="sp-dock-progress-fill"></div></div>
                </footer>

                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

                    #shuffle-animator-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: 999999;
                        background: radial-gradient(circle at 50% 8%, #0f1a30 0%, #070a13 65%, #04060b 100%);
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        color: #ffffff;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        overflow-x: hidden;
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                        padding: 30px 16px calc(140px + env(safe-area-inset-bottom, 0px));
                        opacity: 0;
                        transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                        box-sizing: border-box;
                    }

                    /* Ambient Background Glows */
                    .sp-ambient-spot {
                        position: fixed;
                        width: 500px;
                        height: 500px;
                        border-radius: 50%;
                        pointer-events: none;
                        filter: blur(140px);
                        opacity: 0.18;
                        z-index: 0;
                    }
                    .sp-ambient-spot.light-left { top: -100px; left: -100px; background: #00C4FF; }
                    .sp-ambient-spot.light-right { top: -100px; right: -100px; background: #CCFF00; }
                    .sp-ambient-spot.light-center { bottom: 10%; left: 50%; transform: translateX(-50%); background: #0066FF; width: 650px; opacity: 0.12; }

                    .sp-canvas-bg {
                        position: fixed;
                        inset: 0;
                        z-index: 1;
                        pointer-events: none;
                    }

                    /* Top Bar Actions */
                    .sp-top-actions {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        z-index: 2000;
                    }
                    .sp-action-btn {
                        border: none;
                        outline: none;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        font-family: 'Outfit', sans-serif;
                        font-weight: 800;
                        border-radius: 12px;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        user-select: none;
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                    }
                    .sp-skip-btn {
                        background: rgba(204, 255, 0, 0.12);
                        color: #CCFF00;
                        border: 1.5px solid rgba(204, 255, 0, 0.4);
                        padding: 10px 18px;
                        font-size: 0.8rem;
                        letter-spacing: 1px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 12px rgba(204, 255, 0, 0.1);
                    }
                    .sp-skip-btn:hover {
                        background: #CCFF00;
                        color: #000000;
                        transform: translateY(-2px) scale(1.02);
                        box-shadow: 0 8px 30px rgba(204, 255, 0, 0.4);
                    }
                    .sp-close-btn {
                        width: 44px;
                        height: 44px;
                        justify-content: center;
                        background: rgba(255, 255, 255, 0.08);
                        color: #ffffff;
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        border-radius: 50%;
                        font-size: 1.1rem;
                    }
                    .sp-close-btn:hover {
                        background: rgba(255, 255, 255, 0.2);
                        color: #CCFF00;
                        transform: scale(1.1) rotate(90deg);
                        border-color: #CCFF00;
                    }

                    /* Header */
                    .sp-draw-header {
                        position: relative;
                        z-index: 10;
                        text-align: center;
                        margin-top: 10px;
                        margin-bottom: 35px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        animation: spFadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }
                    .sp-live-pill {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(204, 255, 0, 0.1);
                        border: 1px solid rgba(204, 255, 0, 0.3);
                        color: #CCFF00;
                        padding: 5px 14px;
                        border-radius: 20px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 1.5px;
                        text-transform: uppercase;
                        margin-bottom: 12px;
                        box-shadow: 0 0 20px rgba(204, 255, 0, 0.2);
                    }
                    .sp-pulse-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #CCFF00;
                        box-shadow: 0 0 10px #CCFF00;
                        animation: spPulse 1.4s infinite ease-in-out;
                    }
                    @keyframes spPulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.35); opacity: 0.6; }
                    }

                    .sp-draw-headline {
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        line-height: 0.95;
                    }
                    .sp-headline-kicker {
                        font-size: clamp(0.9rem, 2vw, 1.2rem);
                        font-weight: 800;
                        letter-spacing: 4px;
                        color: rgba(255, 255, 255, 0.6);
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }
                    .sp-headline-main {
                        font-size: clamp(2.8rem, 7vw, 4.5rem);
                        font-weight: 900;
                        letter-spacing: -2px;
                        background: linear-gradient(180deg, #FFFFFF 20%, #B8E4FF 65%, #00C4FF 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 4px 25px rgba(0, 196, 255, 0.35));
                    }
                    .sp-draw-subtitle {
                        margin: 10px 0 0;
                        font-size: 0.75rem;
                        font-weight: 700;
                        letter-spacing: 3px;
                        color: rgba(255, 255, 255, 0.5);
                        text-transform: uppercase;
                    }

                    /* Courts Grid */
                    .sp-courts-grid {
                        position: relative;
                        z-index: 10;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(340px, 380px));
                        justify-content: center;
                        gap: 24px;
                        width: 100%;
                        max-width: 1600px;
                        margin: 0 auto;
                    }

                    /* Court Card */
                    .sp-court-card {
                        background: rgba(13, 20, 36, 0.75);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 24px;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                        opacity: 0;
                        transform: translateY(25px) scale(0.96);
                        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .sp-court-card.visible {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    .sp-court-card:hover {
                        border-color: rgba(0, 196, 255, 0.4);
                        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 196, 255, 0.15);
                    }

                    /* 3D Padel Court Stage */
                    .sp-court-stage {
                        height: 140px;
                        width: 100%;
                        position: relative;
                        background: linear-gradient(180deg, #07101f 0%, #0d1a33 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        perspective: 600px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    }
                    .sp-court-badge-top {
                        position: absolute;
                        top: 12px;
                        left: 14px;
                        background: #CCFF00;
                        color: #050b14;
                        font-size: 0.75rem;
                        font-weight: 900;
                        padding: 4px 10px;
                        border-radius: 8px;
                        letter-spacing: 0.5px;
                        box-shadow: 0 0 15px rgba(204, 255, 0, 0.5);
                        z-index: 5;
                    }
                    .sp-court-status-tag {
                        position: absolute;
                        top: 12px;
                        right: 14px;
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 0.65rem;
                        font-weight: 800;
                        padding: 4px 10px;
                        border-radius: 20px;
                        letter-spacing: 1px;
                        z-index: 5;
                        transition: all 0.3s;
                    }
                    .sp-court-status-tag.active {
                        background: rgba(0, 196, 255, 0.15);
                        border-color: #00C4FF;
                        color: #00C4FF;
                        box-shadow: 0 0 12px rgba(0, 196, 255, 0.3);
                    }

                    /* 3D Floor Graphic */
                    .sp-padel-carpet {
                        width: 85%;
                        height: 160%;
                        background: #004fb0;
                        transform: rotateX(55deg) translateY(-8%);
                        position: relative;
                        border-radius: 4px;
                        box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 79, 176, 0.4);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        background-image: 
                            radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12) 0%, transparent 70%),
                            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                        background-size: 100% 100%, 20px 20px, 20px 20px;
                    }
                    .sp-carpet-lines {
                        position: absolute;
                        inset: 8%;
                        border: 2px solid rgba(255, 255, 255, 0.85);
                        box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
                    }
                    .sp-carpet-line-center {
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 50%;
                        width: 2px;
                        background: rgba(255, 255, 255, 0.85);
                    }
                    .sp-carpet-line-service {
                        position: absolute;
                        top: 32%;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: rgba(255, 255, 255, 0.85);
                    }
                    .sp-padel-net {
                        position: absolute;
                        top: 50%;
                        left: 0;
                        right: 0;
                        height: 10px;
                        background: repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 4px);
                        border-top: 2px solid #ffffff;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
                        z-index: 3;
                    }
                    .sp-stadium-spot {
                        position: absolute;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 70%);
                        filter: blur(3px);
                        z-index: 4;
                    }
                    .spot-tl { top: 8px; left: 10px; }
                    .spot-tr { top: 8px; right: 10px; }

                    /* Matchup Section */
                    .sp-court-matchup {
                        padding: 18px 18px 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .sp-team-block {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    /* Player Slot */
                    .sp-player-slot {
                        min-height: 52px;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        padding: 6px 12px;
                        gap: 12px;
                        position: relative;
                        overflow: hidden;
                        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .sp-team-a .sp-player-slot {
                        border-left: 3px solid rgba(0, 196, 255, 0.4);
                    }
                    .sp-team-b .sp-player-slot {
                        border-left: 3px solid rgba(204, 255, 0, 0.4);
                    }

                    .sp-player-slot.revealed {
                        background: rgba(255, 255, 255, 0.06);
                        border-color: rgba(255, 255, 255, 0.12);
                    }
                    .sp-team-a .sp-player-slot.revealed {
                        border-left: 4px solid #00C4FF;
                        background: linear-gradient(90deg, rgba(0, 196, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%);
                    }
                    .sp-team-b .sp-player-slot.revealed {
                        border-left: 4px solid #CCFF00;
                        background: linear-gradient(90deg, rgba(204, 255, 0, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%);
                    }

                    /* Avatar styling */
                    .sp-player-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: #111a2e;
                        border: 1.5px solid rgba(255, 255, 255, 0.15);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 800;
                        font-size: 0.75rem;
                        color: #ffffff;
                        flex-shrink: 0;
                        overflow: hidden;
                    }
                    .sp-team-a .sp-player-avatar {
                        background: linear-gradient(135deg, #072a4d, #00C4FF);
                        color: #ffffff;
                    }
                    .sp-team-b .sp-player-avatar {
                        background: linear-gradient(135deg, #1b3307, #CCFF00);
                        color: #000000;
                    }
                    .sp-player-avatar img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    /* Shuffling roller text */
                    .sp-roller-container {
                        flex: 1;
                        overflow: hidden;
                        height: 24px;
                        display: flex;
                        align-items: center;
                    }
                    .sp-roller-text {
                        color: rgba(0, 196, 255, 0.7);
                        font-size: 0.85rem;
                        font-weight: 800;
                        letter-spacing: 0.5px;
                        animation: spRollerFlicker 0.25s infinite alternate ease-in-out;
                    }
                    @keyframes spRollerFlicker {
                        0% { opacity: 0.4; transform: translateY(2px); }
                        100% { opacity: 0.9; transform: translateY(-2px); }
                    }

                    /* Revealed details */
                    .sp-player-details {
                        flex: 1;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .sp-player-name {
                        font-size: 0.98rem;
                        font-weight: 800;
                        color: #ffffff;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        letter-spacing: 0.3px;
                    }
                    .sp-player-meta {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-top: 3px;
                    }
                    .sp-player-team {
                        font-size: 0.65rem;
                        font-weight: 700;
                        color: rgba(255, 255, 255, 0.5);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 150px;
                    }
                    .sp-player-level {
                        font-size: 0.65rem;
                        font-weight: 900;
                        padding: 1px 6px;
                        border-radius: 4px;
                        color: #000000;
                        flex-shrink: 0;
                    }

                    /* VS Divider */
                    .sp-vs-divider {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        margin: 2px 0;
                    }
                    .sp-vs-divider::before, .sp-vs-divider::after {
                        content: '';
                        flex: 1;
                        height: 1px;
                        background: rgba(255, 255, 255, 0.08);
                    }
                    .sp-vs-chip {
                        background: #090f1d;
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        color: #ffffff;
                        font-size: 0.68rem;
                        font-weight: 900;
                        letter-spacing: 1.5px;
                        padding: 3px 12px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    }

                    /* Bottom Floating Dock */
                    .sp-bottom-dock {
                        position: fixed;
                        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
                        left: 50%;
                        transform: translateX(-50%);
                        width: 94%;
                        max-width: 1100px;
                        background: rgba(10, 16, 28, 0.88);
                        backdrop-filter: blur(25px);
                        -webkit-backdrop-filter: blur(25px);
                        border: 1.5px solid rgba(255, 255, 255, 0.12);
                        border-radius: 20px;
                        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 196, 255, 0.1);
                        overflow: hidden;
                        z-index: 1000;
                        display: flex;
                        flex-direction: column;
                        animation: spFadeUp 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }
                    .sp-dock-inner {
                        display: flex;
                        align-items: center;
                        height: 64px;
                        padding: 0 16px;
                        gap: 16px;
                    }
                    .sp-dock-brand {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding-right: 14px;
                        border-right: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .sp-brand-icon { font-size: 1.4rem; }
                    .sp-brand-tag {
                        font-size: 0.72rem;
                        font-weight: 900;
                        background: #CCFF00;
                        color: #000;
                        padding: 2px 6px;
                        border-radius: 4px;
                    }

                    .sp-dock-ticker-container {
                        flex: 1;
                        overflow: hidden;
                        white-space: nowrap;
                    }
                    .sp-dock-ticker {
                        display: inline-block;
                        font-size: 0.85rem;
                        font-weight: 700;
                        letter-spacing: 1px;
                        color: rgba(255, 255, 255, 0.8);
                        text-transform: uppercase;
                        animation: spTickerMarquee 22s linear infinite;
                    }
                    @keyframes spTickerMarquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }

                    .sp-dock-meta {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .sp-dock-timer {
                        font-family: monospace;
                        font-size: 1.1rem;
                        font-weight: 800;
                        color: #CCFF00;
                        padding: 4px 10px;
                        background: rgba(204, 255, 0, 0.08);
                        border-radius: 8px;
                        border: 1px solid rgba(204, 255, 0, 0.2);
                    }
                    .sp-dock-cta-btn {
                        background: linear-gradient(135deg, #CCFF00 0%, #a3e635 100%);
                        color: #050b14;
                        border: none;
                        border-radius: 12px;
                        padding: 10px 18px;
                        font-family: 'Outfit', sans-serif;
                        font-size: 0.82rem;
                        font-weight: 900;
                        letter-spacing: 0.5px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        box-shadow: 0 4px 20px rgba(204, 255, 0, 0.35);
                        white-space: nowrap;
                    }
                    .sp-dock-cta-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 25px rgba(204, 255, 0, 0.5);
                        filter: brightness(1.08);
                    }

                    /* Progress bar for auto-close */
                    .sp-dock-progress-bar {
                        height: 3px;
                        width: 100%;
                        background: rgba(255, 255, 255, 0.05);
                    }
                    .sp-dock-progress-fill {
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, #00C4FF, #CCFF00);
                        transition: width 0.1s linear;
                    }

                    /* Animations */
                    @keyframes spFadeDown {
                        from { opacity: 0; transform: translateY(-25px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes spFadeUp {
                        from { opacity: 0; transform: translate(-50%, 25px); }
                        to { opacity: 1; transform: translate(-50%, 0); }
                    }

                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        #shuffle-animator-overlay {
                            padding: 20px 12px calc(160px + env(safe-area-inset-bottom, 0px));
                        }
                        .sp-top-actions {
                            top: 14px;
                            right: 14px;
                        }
                        .sp-skip-btn span {
                            display: none;
                        }
                        .sp-skip-btn {
                            padding: 10px 12px;
                        }
                        .sp-courts-grid {
                            grid-template-columns: 1fr;
                            gap: 18px;
                        }
                        .sp-bottom-dock {
                            bottom: calc(14px + env(safe-area-inset-bottom, 0px));
                            width: 96%;
                        }
                        .sp-dock-inner {
                            height: 56px;
                            padding: 0 12px;
                            gap: 10px;
                        }
                        .sp-dock-brand {
                            display: none;
                        }
                        .sp-dock-cta-btn span {
                            display: none;
                        }
                        .sp-dock-cta-btn {
                            padding: 8px 12px;
                        }
                    }
                </style>
            `;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });

            // 4. Setup Canvas Particles
            this._initCanvas();

            // 5. Setup Clock Timer
            this._startTimer();

            // 6. Populate Court Cards
            const container = overlay.querySelector('#shuffle-container');
            const slotsMap = new Map();

            for (let i = 1; i <= numCourts; i++) {
                const card = document.createElement('div');
                card.className = 'sp-court-card';
                card.id = `sp-court-card-${i}`;
                card.innerHTML = `
                    <div class="sp-court-stage">
                        <div class="sp-court-badge-top">PISTA ${i}</div>
                        <div class="sp-court-status-tag" id="court-status-${i}">SORTEANDO...</div>
                        <div class="sp-stadium-spot spot-tl"></div>
                        <div class="sp-stadium-spot spot-tr"></div>
                        <div class="sp-padel-carpet">
                            <div class="sp-carpet-lines">
                                <div class="sp-carpet-line-center"></div>
                                <div class="sp-carpet-line-service"></div>
                            </div>
                            <div class="sp-padel-net"></div>
                        </div>
                    </div>
                    <div class="sp-court-matchup">
                        <!-- TEAM A -->
                        <div class="sp-team-block sp-team-a">
                            <div class="sp-player-slot" id="slot-${i}-p1">
                                <div class="sp-player-avatar">?</div>
                                <div class="sp-roller-container">
                                    <div class="sp-roller-text">${this.getRandomName(playerPool)}</div>
                                </div>
                            </div>
                            <div class="sp-player-slot" id="slot-${i}-p2">
                                <div class="sp-player-avatar">?</div>
                                <div class="sp-roller-container">
                                    <div class="sp-roller-text">${this.getRandomName(playerPool)}</div>
                                </div>
                            </div>
                        </div>

                        <div class="sp-vs-divider">
                            <span class="sp-vs-chip">VS</span>
                        </div>

                        <!-- TEAM B -->
                        <div class="sp-team-block sp-team-b">
                            <div class="sp-player-slot" id="slot-${i}-p3">
                                <div class="sp-player-avatar">?</div>
                                <div class="sp-roller-container">
                                    <div class="sp-roller-text">${this.getRandomName(playerPool)}</div>
                                </div>
                            </div>
                            <div class="sp-player-slot" id="slot-${i}-p4">
                                <div class="sp-player-avatar">?</div>
                                <div class="sp-roller-container">
                                    <div class="sp-roller-text">${this.getRandomName(playerPool)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
                slotsMap.set(i, card);

                // Quick staggered card appearance
                this._addTimer(() => {
                    if (card && card.isConnected) card.classList.add('visible');
                }, i * 40);
            }

            // 7. Bind Actions (Available from millisecond 0)
            const closeBtn = overlay.querySelector('#sp-close-btn');
            const skipBtn = overlay.querySelector('#sp-skip-btn');
            const ctaBtn = overlay.querySelector('#sp-goto-courts-btn');

            closeBtn.onclick = () => this.finishAnimation(overlay, onComplete);
            ctaBtn.onclick = () => this.finishAnimation(overlay, onComplete);

            skipBtn.onclick = () => {
                this.skipAnimation(overlay, matchesData, numCourts, onComplete);
            };

            // 8. Start Quick Reveal Sequence
            // A short roller cycle of ~450ms then sequential reveal
            this._addTimer(() => {
                this.revealResults(overlay, matchesData, numCourts, onComplete);
            }, 450);
        }

        /**
         * Reveal results step by step
         */
        revealResults(overlay, matchesData, numCourts, onComplete) {
            if (this._hasFinished) return;

            const revealedCourts = new Set();
            const courtDelay = 120; // Agile court delay
            const playerDelay = 35; // Fast stagger per player

            matchesData.forEach((matchItem, idx) => {
                const c = matchItem.court;
                revealedCourts.add(c);

                this._addTimer(() => {
                    if (this._hasFinished) return;

                    // Update court status tag
                    const statusTag = overlay.querySelector(`#court-status-${c}`);
                    if (statusTag) {
                        statusTag.innerText = 'DEFINIDA';
                        statusTag.classList.add('active');
                    }

                    // Reveal 4 player slots
                    for (let i = 1; i <= 4; i++) {
                        this._addTimer(() => {
                            if (this._hasFinished) return;
                            const slot = overlay.querySelector(`#slot-${c}-p${i}`);
                            if (slot) {
                                const p = matchItem.pData[i - 1];
                                this._renderPlayerSlot(slot, p, i <= 2 ? 'team-a' : 'team-b');
                            }
                        }, i * playerDelay);
                    }
                }, idx * courtDelay);
            });

            const totalRevealTime = (matchesData.length * courtDelay) + (4 * playerDelay);

            // Clean up unassigned courts immediately
            this._addTimer(() => {
                if (this._hasFinished) return;
                for (let i = 1; i <= numCourts; i++) {
                    if (!revealedCourts.has(i)) {
                        const statusTag = overlay.querySelector(`#court-status-${i}`);
                        if (statusTag) {
                            statusTag.innerText = 'DISPONIBLE';
                            statusTag.style.opacity = '0.5';
                        }
                        for (let p = 1; p <= 4; p++) {
                            const slot = overlay.querySelector(`#slot-${i}-p${p}`);
                            if (slot) {
                                slot.classList.add('revealed');
                                slot.innerHTML = `
                                    <div class="sp-player-avatar" style="opacity:0.3;">-</div>
                                    <div class="sp-player-details">
                                        <div class="sp-player-name" style="color:rgba(255,255,255,0.4); font-size:0.85rem;">PISTA LIBRE</div>
                                    </div>
                                `;
                            }
                        }
                    }
                }

                // Trigger celebratory confetti
                this._burstConfetti();

                // Update ticker
                const marquee = overlay.querySelector('#shuffle-status-marquee');
                if (marquee) {
                    marquee.innerText = '✅ SORTEO COMPLETADO • TODOS LOS PARTIDOS DEFINIDOS • ¡A LAS PISTAS! • FAIR PLAY SOMOSPADEL • ';
                }

                // Setup auto-close with visual progress bar (5s)
                this._startAutoCloseProgress(overlay, onComplete, 5000);

            }, totalRevealTime + 80);
        }

        /**
         * Skip animation immediately: reveals all courts in 0ms and triggers confetti.
         */
        skipAnimation(overlay, matchesData, numCourts, onComplete) {
            if (this._hasFinished) return;

            // Clear pending staggered reveal timers without resetting the clock
            if (this._activeTimers && this._activeTimers.length) {
                this._activeTimers.forEach(t => clearTimeout(t));
                this._activeTimers = [];
            }
            this._startTimer(); // Ensure clock is running

            // Rebind buttons
            const closeBtn = overlay.querySelector('#sp-close-btn');
            const ctaBtn = overlay.querySelector('#sp-goto-courts-btn');
            const skipBtn = overlay.querySelector('#sp-skip-btn');
            if (closeBtn) closeBtn.onclick = () => this.finishAnimation(overlay, onComplete);
            if (ctaBtn) ctaBtn.onclick = () => this.finishAnimation(overlay, onComplete);
            if (skipBtn) {
                skipBtn.innerHTML = `<i class="fas fa-check"></i> <span>RESULTADOS LISTOS</span>`;
                skipBtn.onclick = () => this.finishAnimation(overlay, onComplete);
            }

            const revealedCourts = new Set();

            // Reveal all cards instantly
            for (let i = 1; i <= numCourts; i++) {
                const card = overlay.querySelector(`#sp-court-card-${i}`);
                if (card) card.classList.add('visible');
            }

            // Reveal all players instantly
            matchesData.forEach((matchItem) => {
                const c = matchItem.court;
                revealedCourts.add(c);

                const statusTag = overlay.querySelector(`#court-status-${c}`);
                if (statusTag) {
                    statusTag.innerText = 'DEFINIDA';
                    statusTag.classList.add('active');
                }

                for (let i = 1; i <= 4; i++) {
                    const slot = overlay.querySelector(`#slot-${c}-p${i}`);
                    if (slot) {
                        const p = matchItem.pData[i - 1];
                        this._renderPlayerSlot(slot, p, i <= 2 ? 'team-a' : 'team-b');
                    }
                }
            });

            // Mark unassigned
            for (let i = 1; i <= numCourts; i++) {
                if (!revealedCourts.has(i)) {
                    const statusTag = overlay.querySelector(`#court-status-${i}`);
                    if (statusTag) {
                        statusTag.innerText = 'DISPONIBLE';
                        statusTag.style.opacity = '0.5';
                    }
                    for (let p = 1; p <= 4; p++) {
                        const slot = overlay.querySelector(`#slot-${i}-p${p}`);
                        if (slot) {
                            slot.classList.add('revealed');
                            slot.innerHTML = `
                                <div class="sp-player-avatar" style="opacity:0.3;">-</div>
                                <div class="sp-player-details">
                                    <div class="sp-player-name" style="color:rgba(255,255,255,0.4); font-size:0.85rem;">PISTA LIBRE</div>
                                </div>
                            `;
                        }
                    }
                }
            }

            // Burst confetti
            this._burstConfetti();

            // Update ticker
            const marquee = overlay.querySelector('#shuffle-status-marquee');
            if (marquee) {
                marquee.innerText = '⚡ SORTEO REVELADO AL INSTANTE • PARTIDOS LISTOS • ENTRA A PISTA • SOMOSPADEL BCN • ';
            }

            // Auto-close with 4s timer
            this._startAutoCloseProgress(overlay, onComplete, 4000);
        }

        /**
         * Render a revealed player slot with avatar, clean typography and level badge
         */
        _renderPlayerSlot(slot, p, teamSide) {
            slot.classList.add('revealed');
            const levelVal = parseFloat(p.level) || 0;
            const levelColor = this.getLevelColor(levelVal);
            const initials = this._getInitials(p.name);

            slot.innerHTML = `
                <div class="sp-player-avatar">
                    ${p.photo ? `<img src="${p.photo}" alt="${p.name}" onerror="this.parentElement.innerHTML='${initials}'"/>` : `<span>${initials}</span>`}
                </div>
                <div class="sp-player-details">
                    <div class="sp-player-name" title="${p.name}">${p.name}</div>
                    <div class="sp-player-meta">
                        <span class="sp-player-team">${p.team}</span>
                        <span class="sp-player-level" style="background:${levelColor};">${p.level}</span>
                    </div>
                </div>
            `;
        }

        /**
         * Auto close progress indicator and safety finish
         */
        _startAutoCloseProgress(overlay, onComplete, durationMs) {
            const fill = overlay.querySelector('#sp-auto-close-bar');
            const startTime = Date.now();

            const interval = this._addInterval(() => {
                const elapsed = Date.now() - startTime;
                const pct = Math.min(100, (elapsed / durationMs) * 100);
                if (fill) fill.style.width = `${pct}%`;

                if (elapsed >= durationMs) {
                    this.finishAnimation(overlay, onComplete);
                }
            }, 60);
        }

        /**
         * Idempotent finish animation
         */
        finishAnimation(overlay, onComplete, forceImmediate = false) {
            if (this._hasFinished && !forceImmediate) return;
            this._hasFinished = true;
            this._clearAllTimers();

            const targetOverlay = overlay || this._overlay;
            let targetOnComplete = onComplete || this._onComplete;

            const finalize = () => {
                if (this._finalizeTimer) {
                    clearTimeout(this._finalizeTimer);
                    this._finalizeTimer = null;
                }
                if (targetOverlay && targetOverlay.parentNode) {
                    targetOverlay.remove();
                }
                const orphan = document.getElementById('shuffle-animator-overlay');
                if (orphan) orphan.remove();

                this.isAnimating = false;
                this._overlay = null;
                this._onComplete = null;

                if (typeof targetOnComplete === 'function') {
                    const cb = targetOnComplete;
                    targetOnComplete = null;
                    try {
                        cb();
                    } catch (e) {
                        console.error('[ShuffleAnimator] onComplete error:', e);
                    }
                }
            };

            if (forceImmediate || !targetOverlay) {
                finalize();
            } else {
                targetOverlay.style.transition = 'opacity 0.25s ease';
                targetOverlay.style.opacity = '0';
                this._finalizeTimer = setTimeout(finalize, 260);
            }
        }

        /**
         * Data preparation & synchronous matching against pool
         */
        _prepareMatchesData(matches, pool) {
            const normalize = (str) => {
                if (!str) return '';
                return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
            };

            const getP = (id, name) => {
                if (!name || name === '---' || name === 'DISPONIBLE') {
                    return { name: 'DISPONIBLE', level: '0.0', team: 'SOMOSPADEL', photo: null };
                }

                const searchName = normalize(name);
                const searchId = String(id || '').trim();

                // 1. Search by ID / UID
                let p = pool.find(item => {
                    const pid = String(item.id || '').trim();
                    const puid = String(item.uid || '').trim();
                    return (pid && searchId && pid === searchId) || (puid && searchId && puid === searchId);
                });

                // 2. Search by normalized name
                if (!p) {
                    p = pool.find(item => {
                        const pname = normalize(item.name || item.displayName);
                        if (!pname || !searchName) return false;
                        if (pname === searchName) return true;
                        const parts = searchName.split(' ').filter(x => x.length > 2);
                        const pParts = pname.split(' ').filter(x => x.length > 2);
                        const common = parts.filter(pt => pParts.some(pp => pp.includes(pt) || pt.includes(pp)));
                        return common.length >= Math.min(parts.length, 2);
                    });
                }

                const getLevel = (player) => {
                    if (!player) return 0;
                    const val = player.level || player.self_rate_level || player.rating || player.nivel || player.rank || 0;
                    return parseFloat(val) || 0;
                };

                const getTeam = (player) => {
                    if (!player) return '';
                    const t = player.team_somospadel || player.team || player.equipo || '';
                    return Array.isArray(t) ? t[0] : t;
                };

                const finalName = p ? (p.name || p.displayName) : name;
                const finalLevel = getLevel(p).toFixed(1);
                const finalTeam = getTeam(p) || 'SOMOSPADEL TEAM';
                const finalPhoto = p ? (p.photoURL || p.avatar || p.photo || null) : null;

                return {
                    name: String(finalName).toUpperCase(),
                    level: finalLevel,
                    team: String(finalTeam).toUpperCase(),
                    photo: finalPhoto
                };
            };

            return matches.map((m, idx) => {
                if (!m) m = {};
                let val = parseInt(String(m.court || m.pista || '').replace(/\D/g, ''));
                if (isNaN(val) || val <= 0) val = idx + 1;

                const p1_id = m.player1 || (m.team_a_ids && m.team_a_ids[0]) || null;
                const p2_id = m.player2 || (m.team_a_ids && m.team_a_ids[1]) || null;
                const p3_id = m.player3 || (m.team_b_ids && m.team_b_ids[0]) || null;
                const p4_id = m.player4 || (m.team_b_ids && m.team_b_ids[1]) || null;

                const p1_name = m.player1_name || m.p1_name || (m.team_a_names && m.team_a_names[0]) || '---';
                const p2_name = m.player2_name || m.p2_name || (m.team_a_names && m.team_a_names[1]) || '---';
                const p3_name = m.player3_name || m.p3_name || (m.team_b_names && m.team_b_names[0]) || '---';
                const p4_name = m.player4_name || m.p4_name || (m.team_b_names && m.team_b_names[1]) || '---';

                const pData = [
                    getP(p1_id, p1_name),
                    getP(p2_id, p2_name),
                    getP(p3_id, p3_name),
                    getP(p4_id, p4_name)
                ];

                return { match: m, court: val, pData, idx };
            });
        }

        /**
         * Backward compatible helper: extracts player data for a match
         */
        async extractPlayerDataFromMatch(m, allPlayers) {
            const pool = allPlayers && allPlayers.length > 0 ? allPlayers : await this.resolvePlayerPool({});
            const prepared = this._prepareMatchesData([m], pool);
            return prepared[0] ? prepared[0].pData : [];
        }

        _getInitials(name) {
            if (!name || name === '---' || name === 'DISPONIBLE') return '?';
            const parts = name.trim().split(/\s+/).filter(Boolean);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        getRandomName(pool) {
            if (!pool || pool.length === 0) return 'JUGADOR PÁDEL';
            const sample = pool[Math.floor(Math.random() * pool.length)];
            const raw = sample ? (sample.name || sample.displayName || sample) : 'JUGADOR';
            return String(raw).split(' ')[0].toUpperCase();
        }

        getRandomNamesText(players) {
            return this.getRandomName(players);
        }

        getLevelColor(lv) {
            if (lv >= 6.0) return '#FF2A55'; // Elite
            if (lv >= 5.0) return '#FF8800'; // Expert
            if (lv >= 4.0) return '#FFCC00'; // Advanced
            if (lv >= 3.0) return '#00C4FF'; // Intermediate
            if (lv >= 2.0) return '#00E676'; // Improver
            return '#CCFF00';                // Open
        }

        _startTimer() {
            if (this._clockInterval) return;
            this._elapsedSeconds = 0;
            this._clockInterval = setInterval(() => {
                this._elapsedSeconds++;
                const m = Math.floor(this._elapsedSeconds / 60).toString().padStart(2, '0');
                const s = (this._elapsedSeconds % 60).toString().padStart(2, '0');
                const clock = document.getElementById('shuffle-timer');
                if (clock) clock.innerText = `${m}:${s}`;
            }, 1000);
            this._activeIntervals.push(this._clockInterval);
        }

        /**
         * Canvas Particles & Celebratory Confetti Burst
         */
        _initCanvas() {
            const canvas = document.getElementById('shuffle-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let w = canvas.width = window.innerWidth;
            let h = canvas.height = window.innerHeight;

            const handleResize = () => {
                if (!canvas.isConnected || this._hasFinished) {
                    if (this._resizeHandler) {
                        window.removeEventListener('resize', this._resizeHandler);
                        this._resizeHandler = null;
                    }
                    return;
                }
                w = canvas.width = window.innerWidth;
                h = canvas.height = window.innerHeight;
            };
            this._resizeHandler = handleResize;
            window.addEventListener('resize', handleResize);

            // Ambient background dust
            const dustParticles = [];
            for (let i = 0; i < 40; i++) {
                dustParticles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: -(Math.random() * 0.8 + 0.2),
                    s: Math.random() * 1.5 + 0.8,
                    o: Math.random() * 0.4 + 0.1
                });
            }

            const render = () => {
                if (!canvas || !canvas.isConnected || this._hasFinished) return;
                ctx.clearRect(0, 0, w, h);

                // 1. Draw dust particles
                dustParticles.forEach(p => {
                    p.y += p.vy;
                    p.x += p.vx;
                    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                    ctx.fillStyle = `rgba(0, 196, 255, ${p.o})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                    ctx.fill();
                });

                // 2. Draw confetti particles if any
                if (this._confettiParticles && this._confettiParticles.length > 0) {
                    for (let i = this._confettiParticles.length - 1; i >= 0; i--) {
                        const cp = this._confettiParticles[i];
                        cp.x += cp.vx;
                        cp.y += cp.vy;
                        cp.vy += cp.gravity;
                        cp.rotation += cp.vRot;
                        cp.life -= 0.008;

                        if (cp.life <= 0 || cp.y > h + 20) {
                            this._confettiParticles.splice(i, 1);
                            continue;
                        }

                        ctx.save();
                        ctx.translate(cp.x, cp.y);
                        ctx.rotate(cp.rotation);
                        ctx.fillStyle = cp.color;
                        ctx.globalAlpha = Math.max(0, cp.life);
                        ctx.fillRect(-cp.w / 2, -cp.h / 2, cp.w, cp.h);
                        ctx.restore();
                    }
                }

                this._animFrame = requestAnimationFrame(render);
            };

            this._animFrame = requestAnimationFrame(render);
        }

        /**
         * Confetti burst explosion in SomosPadel BCN theme colors
         */
        _burstConfetti() {
            const colors = ['#CCFF00', '#00C4FF', '#ffffff', '#FFD700', '#00E676'];
            const w = window.innerWidth;
            const h = window.innerHeight;

            for (let i = 0; i < 90; i++) {
                this._confettiParticles.push({
                    x: w * 0.5 + (Math.random() - 0.5) * 200,
                    y: h * 0.35 + (Math.random() - 0.5) * 100,
                    vx: (Math.random() - 0.5) * 14,
                    vy: (Math.random() - 0.7) * 14,
                    gravity: 0.28,
                    rotation: Math.random() * Math.PI,
                    vRot: (Math.random() - 0.5) * 0.2,
                    w: Math.random() * 8 + 5,
                    h: Math.random() * 6 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1.0
                });
            }
        }
    }

    window.ShuffleAnimator = new ShuffleAnimator();
})();

