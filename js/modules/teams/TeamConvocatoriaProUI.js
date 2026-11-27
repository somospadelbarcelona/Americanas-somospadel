/**
 * TeamConvocatoriaProUI.js
 * Módulo TOP de Convocatorias Interactivas (Solo SÍ / NO) para EQUIPOS — SomosPádel BCN
 *
 * Funcionalidades:
 * 1. Tarjeta de votación en 1 toque (✅ SÍ, VOY / ❌ NO PUEDO) incrustada en cada equipo del jugador.
 * 2. Actualización en tiempo real vía Firestore (`TeamConvocatoriaService.listenConvocatoria`).
 * 3. Desplegable "Ver quién va" con listas claras de Confirmados, No pueden y Pendientes.
 * 4. Panel de Control exclusivo para Capitanes / Subcapitanes / Admin:
 *    - Lanzar nueva convocatoria (Jornada, Rival, Fecha, Hora, Sede, Necesarios, Nota) con notificación in-app.
 *    - Marcar/editar voto manualmente de cualquier jugador (ej. avisos por WhatsApp).
 *    - Recordar a pendientes (notificación in-app).
 *    - Compartir resumen oficial en WhatsApp.
 *    - Cerrar / Reabrir convocatoria.
 *
 * Expuesto globalmente en `window.TeamConvocatoriaProUI`.
 */
(function (global) {
    'use strict';

    function norm(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    class TeamConvocatoriaProUI {
        constructor() {
            this.unsubscribes = {};
            this.liveDataByTeam = {};
            this.teamsById = {};
            this.expandedTeams = {};
            this.activeCaptainModalTeamId = null;
            this.captainModalMode = 'send'; // 'send' | 'edit'
            this.captainTab = 'lineup'; // 'lineup' | 'roster' | 'config'
            this.captainDraftLineup = {}; // { [teamId]: { p1: [a,b], p2: [a,b], p3: [a,b], reserves: [r1,r2,r3] } }
            this.showCreateFormInModal = false;
            this.captainFilter = 'all'; // 'all' | 'available' | 'unavailable' | 'pending'
            this.captainSearch = '';
            this.PILOT_PHONE = '649219350';
            this._weeklyCheckDone = false;
            this._injectInlineFallbackStyles();
            this._scheduleAutoWeeklyPopup();
        }

        _injectInlineFallbackStyles() {
            if (typeof document === 'undefined' || document.getElementById('tp-convo-pro-styles')) return;
            const style = document.createElement('style');
            style.id = 'tp-convo-pro-styles';
            style.textContent = `
                .tp-convo-pro-slot{margin:10px 0}
                .tp-cp-box{background:#fff;border:1.5px solid #cbd5e1;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.09);display:flex;flex-direction:column}
                .tp-cp-box.cupo-full{border-color:#10b981;box-shadow:0 10px 26px rgba(16,185,129,.18)}
                .tp-cp-hero{background:linear-gradient(135deg,#0f172a 0%,#1e293b 65%,#0f172a 100%);padding:12px 13px;color:#fff}
                .tp-cp-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
                .tp-cp-title-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
                .tp-cp-jtag{font-size:.65rem;font-weight:950;color:#0f172a;background:#ccff00;padding:2px 7px;border-radius:6px}
                .tp-cp-date-light{font-size:.72rem;font-weight:800;color:#cbd5e1}
                .tp-cp-opp-light{font-size:.94rem;font-weight:950;color:#fff;margin-top:7px}
                .tp-cp-venue-light{font-size:.72rem;font-weight:700;color:#94a3b8;margin-top:2px}
                .tp-cp-venue-light i{color:#ccff00;margin-right:4px}
                .tp-cp-note-light{margin-top:7px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.16);font-size:.72rem;color:#e2e8f0;font-style:italic}
                .tp-cp-badge{font-size:.64rem;font-weight:900;padding:3px 8px;border-radius:999px;white-space:nowrap}
                .tp-cp-badge.yes{background:#ecfdf5;color:#059669;border:1px solid #a7f3d0}
                .tp-cp-badge.no{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
                .tp-cp-badge.wait{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
                .tp-cp-badge.closed{background:#f1f5f9;color:#475569;border:1px solid #cbd5e1}
                .tp-cp-body{padding:12px;display:flex;flex-direction:column;gap:9px}
                .tp-cp-vote-label{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.7rem;font-weight:900;color:#334155;text-transform:uppercase}
                .tp-cp-full-pill{background:#ecfdf5;color:#047857;border:1px solid #6ee7b7;padding:2px 7px;border-radius:999px;font-size:.62rem;font-weight:950}
                .tp-cp-vote-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
                .tp-cp-vote-btn{border-radius:12px;padding:11px 10px;font-family:inherit;font-size:.82rem;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all .15s ease}
                .tp-cp-vote-btn.yes{background:#ecfdf5;color:#047857;border:1.5px solid #34d399}
                .tp-cp-vote-btn.yes.selected{background:#059669;color:#fff;border-color:#059669;box-shadow:0 4px 12px rgba(5,150,105,.3)}
                .tp-cp-vote-btn.no{background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5}
                .tp-cp-vote-btn.no.selected{background:#dc2626;color:#fff;border-color:#dc2626;box-shadow:0 4px 12px rgba(220,38,38,.28)}
                .tp-cp-vote-clear-wrap{display:flex;justify-content:center}
                .tp-cp-vote-btn.pending{padding:5px 12px;font-size:.68rem;font-weight:900;border-radius:999px;background:#f8fafc;color:#64748b;border:1px solid #cbd5e1;gap:5px;letter-spacing:.02em}
                .tp-cp-vote-btn.pending.selected{background:#fffbeb;color:#b45309;border-color:#f59e0b;box-shadow:0 2px 8px rgba(245,158,11,.2)}
                .tp-cp-live-strip{display:flex;align-items:center;justify-content:space-between;gap:8px}
                .tp-cp-summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
                .tp-cp-ava-group{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
                .tp-cp-who-txt{font-size:.73rem;font-weight:800;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .tp-cp-avatars{display:flex;align-items:center;flex-shrink:0}
                .tp-cp-ava{width:28px;height:28px;border-radius:50%;color:#fff;font-size:.64rem;font-weight:950;display:inline-flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-7px;box-shadow:0 2px 6px rgba(15,23,42,.18);letter-spacing:-.3px}
                .tp-cp-ava:first-child{margin-left:0}
                .tp-cp-ava.empty{background:#e2e8f0;color:#64748b}
                .tp-cp-ava.extra{background:#0f172a;color:#ccff00;font-size:.6rem}
                .tp-cp-toggle-pill{background:#fff;border:1px solid #cbd5e1;color:#0f172a;font-weight:900;font-size:.68rem;padding:4px 9px;border-radius:999px;cursor:pointer;white-space:nowrap;flex-shrink:0}
                .tp-cp-toggle-pill.open{background:#0f172a;color:#ccff00;border-color:#0f172a}
                .tp-cp-stat-pills{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
                .tp-cp-sp{font-size:.66rem;font-weight:900;padding:3px 8px;border-radius:8px;display:inline-flex;align-items:center;gap:4px}
                .tp-cp-sp.yes{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
                .tp-cp-sp.no{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
                .tp-cp-sp.pend{background:#f1f5f9;color:#475569;border:1px solid #cbd5e1}
                .tp-cp-pct{margin-left:auto;font-size:.7rem;font-weight:950;color:#059669}
                .tp-cp-bar{width:100%;height:7px;border-radius:999px;background:#e2e8f0;overflow:hidden}
                .tp-cp-bar-fill{height:100%;background:linear-gradient(90deg,#10b981,#84cc16);transition:width .3s ease}
                .tp-cp-bar-fill.full{background:linear-gradient(90deg,#059669,#ccff00)}
                .tp-cp-lists{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;font-size:.73rem;display:flex;flex-direction:column;gap:5px}
                .tp-cp-cap-bar{padding-top:8px;border-top:1px dashed #cbd5e1;display:grid;grid-template-columns:1fr 1fr;gap:8px}
                .tp-cp-cap-bar.tri{grid-template-columns:repeat(3,1fr);gap:6px}
                .tp-cp-cap-btn{width:100%;background:#0f172a;color:#fff;border:none;border-radius:10px;padding:9px 8px;font-size:.73rem;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px}
                .tp-cp-cap-btn.launch{background:#1e293b;color:#ccff00;border:1px solid rgba(204,255,0,.35)}
                .tp-cp-cap-btn.wa-quick{background:#25d366;color:#fff}
                .tp-cp-cap-btn i{color:#ccff00}
                .tp-cp-cap-btn.wa-quick i{color:#fff}
                .tp-cp-modal-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.78);backdrop-filter:blur(5px);display:none;align-items:flex-end;justify-content:center;padding:12px}
                @media(min-width:640px){.tp-cp-modal-overlay{align-items:center}}
                .tp-home-convo-pill{position:fixed;right:14px;bottom:84px;z-index:2147482000;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border:1.5px solid #ccff00;border-radius:999px;padding:9px 14px;font-size:.75rem;font-weight:900;display:inline-flex;align-items:center;gap:8px;box-shadow:0 10px 26px rgba(15,23,42,.42);cursor:pointer;animation:tpPulseRing 2.2s infinite}
                .tp-home-convo-pill .dot{width:8px;height:8px;border-radius:50%;background:#ccff00;box-shadow:0 0 8px #ccff00}
                @keyframes tpPulseRing{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
                .tp-cp-modal-card{width:100%;max-width:520px;max-height:88vh;background:#fff;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,.45)}
                .tp-cp-modal-head{background:linear-gradient(135deg,#0f172a,#1e293b);padding:15px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px}
                .tp-cp-tabs-bar{flex-shrink:0;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:9px 14px 10px;display:flex;flex-direction:column;gap:8px}
                .tp-cp-mini-summary{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
                .tp-cp-ms-pill{font-size:.66rem;font-weight:900;padding:3px 8px;border-radius:8px}
                .tp-cp-ms-pill.yes{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
                .tp-cp-ms-pill.no{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
                .tp-cp-ms-pill.pend{background:#f1f5f9;color:#475569;border:1px solid #cbd5e1}
                .tp-cp-ms-status{margin-left:auto;font-size:.62rem;font-weight:950;text-transform:uppercase;padding:3px 8px;border-radius:999px}
                .tp-cp-ms-status.open{background:#0f172a;color:#ccff00}
                .tp-cp-ms-status.closed{background:#e2e8f0;color:#475569}
                .tp-cp-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:#e2e8f0;padding:4px;border-radius:12px}
                .tp-cp-tab{background:transparent;border:none;border-radius:9px;padding:8px 6px;font-family:inherit;font-size:.72rem;font-weight:900;color:#475569;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}
                .tp-cp-tab.active{background:#0f172a;color:#ccff00;box-shadow:0 3px 10px rgba(15,23,42,.22)}
                .tp-cp-modal-body{padding:16px;overflow-y:auto;color:#0f172a}
                .tp-cp-cap-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}
                .tp-cp-act{background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px;font-size:.75rem;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}
                .tp-cp-act.primary{background:#0f172a;color:#ccff00;border-color:#0f172a}
                .tp-cp-act.wa{background:#25d366;color:#fff;border-color:#25d366}
                .tp-cp-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
                .tp-cp-kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:9px 6px;text-align:center}
                .tp-cp-kpi strong{display:block;font-size:1.1rem;font-weight:950}
                .tp-cp-kpi span{font-size:.66rem;font-weight:800;color:#64748b}
                .tp-cp-kpi.yes strong{color:#059669}
                .tp-cp-kpi.no strong{color:#dc2626}
                .tp-cp-filter-bar{display:flex;flex-direction:column;gap:7px;margin-bottom:10px}
                .tp-cp-search-mini{width:100%;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:8px 11px;font-size:.8rem;color:#0f172a}
                .tp-cp-chips{display:flex;gap:6px;overflow-x:auto}
                .tp-cp-chip{background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:999px;padding:5px 10px;font-size:.7rem;font-weight:900;white-space:nowrap;cursor:pointer}
                .tp-cp-chip.active{background:#0f172a;color:#ccff00;border-color:#0f172a}
                .tp-cp-roster-control{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto}
                .tp-cp-player-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:7px 10px}
                .tp-cp-player-info{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
                .tp-cp-player-name{font-size:.8rem;font-weight:800;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .tp-cp-player-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
                .tp-cp-pts-pill{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:.62rem;font-weight:900;padding:1px 6px;border-radius:6px;white-space:nowrap}
                .tp-cp-pts-pill.muted{background:#f1f5f9;color:#64748b;border-color:#cbd5e1}
                .tp-cp-assign-pill{font-size:.6rem;font-weight:950;padding:1px 6px;border-radius:6px;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap}
                .tp-cp-assign-pill.c1{background:#fef3c7;color:#b45309;border:1px solid #f59e0b}
                .tp-cp-assign-pill.c2{background:#e0f2fe;color:#0369a1;border:1px solid #38bdf8}
                .tp-cp-assign-pill.c3{background:#f3e8ff;color:#6d28d9;border:1px solid #c084fc}
                .tp-cp-assign-pill.res{background:#f1f5f9;color:#475569;border:1px solid #94a3b8}
                .tp-cp-lineup-card{background:linear-gradient(155deg,#0f172a 0%,#1e293b 100%);border:1.5px solid rgba(204,255,0,.35);border-radius:14px;padding:11px 12px;margin-bottom:12px;color:#fff}
                .tp-cp-lineup-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:9px}
                .tp-cp-lineup-title{font-size:.7rem;font-weight:950;color:#ccff00;letter-spacing:.6px;display:flex;align-items:center;gap:5px}
                .tp-cp-lineup-sub{font-size:.64rem;color:#cbd5e1;margin-top:2px;line-height:1.3}
                .tp-cp-lineup-wa{background:#25d366;color:#fff;border:none;border-radius:8px;padding:6px 9px;font-size:.68rem;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;gap:4px;flex-shrink:0}
                .tp-cp-lineup-empty{background:rgba(255,255,255,.06);border:1px dashed rgba(255,255,255,.2);border-radius:10px;padding:10px;font-size:.72rem;color:#cbd5e1;line-height:1.4}
                .tp-cp-courts-grid{display:flex;flex-direction:column;gap:7px}
                .tp-cp-court-row{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-left:4px solid #ccff00;border-radius:11px;padding:8px 10px}
                .tp-cp-court-row.c1{border-left-color:#fbbf24;background:rgba(251,191,36,.09)}
                .tp-cp-court-row.c2{border-left-color:#38bdf8;background:rgba(56,189,248,.08)}
                .tp-cp-court-row.c3{border-left-color:#c084fc;background:rgba(192,132,252,.08)}
                .tp-cp-court-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
                .tp-cp-court-badge{font-size:.64rem;font-weight:950;padding:2px 8px;border-radius:999px;letter-spacing:.5px}
                .tp-cp-court-badge.c1{background:#fbbf24;color:#0f172a}
                .tp-cp-court-badge.c2{background:#38bdf8;color:#0f172a}
                .tp-cp-court-badge.c3{background:#c084fc;color:#0f172a}
                .tp-cp-court-pts{font-size:.66rem;font-weight:900;color:#ccff00}
                .tp-cp-court-players{display:flex;flex-direction:column;gap:4px}
                .tp-cp-court-pl{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(15,23,42,.55);border-radius:8px;padding:5px 8px;font-size:.74rem;font-weight:800;color:#f8fafc}
                .tp-cp-court-pl.empty{color:#94a3b8;font-style:italic;border:1px dashed rgba(148,163,184,.3);background:transparent}
                .tp-cp-court-pl-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .tp-cp-reserves-box{margin-top:9px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.18)}
                .tp-cp-reserves-title{font-size:.66rem;font-weight:900;color:#fbbf24;margin-bottom:5px;display:flex;align-items:center;gap:5px}
                .tp-cp-reserves-list{display:flex;flex-wrap:wrap;gap:5px}
                .tp-cp-reserve-chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#e2e8f0;font-size:.66rem;font-weight:750;padding:3px 7px;border-radius:7px}
                .tp-cp-reserve-chip em{font-style:normal;color:#94a3b8}
                .tp-cp-step-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:11px 12px;margin-bottom:12px}
                .tp-cp-step-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:9px}
                .tp-cp-step-title{font-size:.7rem;font-weight:950;color:#0f172a;letter-spacing:.4px}
                .tp-cp-step-sub{font-size:.64rem;color:#64748b;margin-top:2px}
                .tp-cp-mini-action{background:#fff;border:1px solid #cbd5e1;color:#334155;border-radius:8px;padding:4px 8px;font-size:.65rem;font-weight:900;cursor:pointer;white-space:nowrap}
                .tp-cp-mini-action.auto{background:#0f172a;color:#ccff00;border-color:#0f172a}
                .tp-cp-empty-note{font-size:.72rem;color:#64748b;background:#fff;border:1px dashed #cbd5e1;border-radius:10px;padding:10px;line-height:1.4}
                .tp-cp-avail-chips{display:flex;flex-wrap:wrap;gap:6px}
                .tp-cp-avail-chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #cbd5e1;border-radius:10px;padding:5px 8px;font-family:inherit;font-size:.72rem;font-weight:800;color:#0f172a;cursor:pointer}
                .tp-cp-avail-chip.assigned.p1{border-color:#f59e0b;background:#fffbeb}
                .tp-cp-avail-chip.assigned.p2{border-color:#38bdf8;background:#f0f9ff}
                .tp-cp-avail-chip.assigned.p3{border-color:#c084fc;background:#faf5ff}
                .tp-cp-avail-chip.assigned.res{border-color:#94a3b8;background:#f1f5f9}
                .tp-cp-ac-pts{font-size:.64rem;font-weight:900;color:#1d4ed8;background:#eff6ff;padding:1px 5px;border-radius:5px}
                .tp-cp-ac-tag{font-size:.58rem;font-weight:950;padding:1px 5px;border-radius:5px;color:#0f172a;background:#e2e8f0}
                .tp-cp-ac-tag.p1{background:#fbbf24}
                .tp-cp-ac-tag.p2{background:#38bdf8}
                .tp-cp-ac-tag.p3{background:#c084fc}
                .tp-cp-ac-tag.res{background:#475569;color:#fff}
                .tp-cp-order-warn{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(245,158,11,.16);border:1px solid rgba(251,191,36,.5);color:#fde68a;border-radius:9px;padding:6px 9px;font-size:.67rem;font-weight:800;margin-bottom:8px}
                .tp-cp-order-warn button{background:#fbbf24;color:#0f172a;border:none;border-radius:7px;padding:4px 8px;font-size:.65rem;font-weight:950;cursor:pointer;flex-shrink:0}
                .tp-cp-order-ok{background:rgba(16,185,129,.15);border:1px solid rgba(52,211,153,.4);color:#a7f3d0;border-radius:9px;padding:5px 9px;font-size:.66rem;font-weight:850;margin-bottom:8px}
                .tp-cp-slot-row{display:flex;align-items:center;gap:6px;width:100%}
                .tp-cp-slot-select{flex:1;min-width:0;background:#fff;color:#0f172a;border:1.5px solid #cbd5e1;border-radius:9px;padding:7px 9px;font-family:inherit;font-size:.74rem;font-weight:800;cursor:pointer}
                .tp-cp-slot-pts{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:.64rem;font-weight:900;padding:4px 7px;border-radius:7px;white-space:nowrap;flex-shrink:0}
                .tp-cp-slot-clear{width:26px;height:26px;border-radius:7px;border:1px solid rgba(239,68,68,.35);background:#fef2f2;color:#dc2626;font-size:.7rem;font-weight:900;cursor:pointer;flex-shrink:0}
                .tp-cp-reserves-slots{display:flex;flex-direction:column;gap:6px}
                .tp-cp-reserve-slot-wrap{display:flex;align-items:center;gap:7px}
                .tp-cp-res-num{width:28px;height:28px;border-radius:8px;background:#0f172a;color:#ccff00;font-size:.66rem;font-weight:950;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
                .tp-cp-mini-votes{display:flex;gap:6px;flex-shrink:0}
                .tp-cp-mini{width:34px;height:30px;border-radius:8px;border:1.5px solid #cbd5e1;background:#fff;cursor:pointer;font-size:.82rem;opacity:.55}
                .tp-cp-mini.yes.active{background:#059669;border-color:#059669;opacity:1}
                .tp-cp-mini.no.active{background:#dc2626;border-color:#dc2626;opacity:1}
                .tp-cp-toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%) translateY(20px);background:#0f172a;color:#fff;border:1.5px solid #ccff00;padding:10px 16px;border-radius:14px;font-size:.78rem;font-weight:800;z-index:100000;opacity:0;pointer-events:none;transition:all .22s ease;max-width:92vw;text-align:center}
                .tp-cp-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
                @keyframes tpWkPopIn{0%{opacity:0;transform:translateY(20px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
                @keyframes tpWkPulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.4)}}
                .tp-wk-card{max-width:448px;max-height:90vh;border:1px solid rgba(204,255,0,.28);border-radius:28px;box-shadow:0 32px 80px rgba(2,6,23,.72);animation:tpWkPopIn .34s cubic-bezier(.16,1,.3,1) forwards;background:#f1f5f9;overflow:hidden;display:flex;flex-direction:column}
                .tp-wk-head{flex-shrink:0;background:radial-gradient(120% 90% at 50% -20%,rgba(204,255,0,.22) 0%,transparent 58%),radial-gradient(80% 70% at 100% 0%,rgba(56,189,248,.16) 0%,transparent 55%),linear-gradient(165deg,#050914 0%,#0b1326 58%,#101d3a 100%);padding:12px 16px 12px;text-align:center;position:relative;overflow:hidden;border-bottom:1px solid rgba(204,255,0,.3)}
                .tp-wk-top-bar{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
                .tp-wk-brand-chip{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:4px 11px 4px 5px;border-radius:999px}
                .tp-wk-logo-ring{width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,rgba(204,255,0,.25),rgba(15,23,42,.9));border:1px solid rgba(204,255,0,.55);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
                .tp-wk-logo-img{width:22px;height:22px;border-radius:50%;object-fit:contain}
                .tp-wk-brand-tag{font-size:.62rem;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#f8fafc}
                .tp-wk-close{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#cbd5e1;font-size:.8rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
                .tp-wk-hero-logo{position:relative;z-index:2;width:46px;height:46px;margin:0 auto 5px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(204,255,0,.24) 0%,rgba(204,255,0,.03) 68%,transparent 100%)}
                .tp-wk-hero-logo img{width:40px;height:40px;object-fit:contain}
                .tp-wk-pill{position:relative;z-index:2;display:inline-flex;align-items:center;gap:6px;background:rgba(204,255,0,.12);color:#ccff00;border:1px solid rgba(204,255,0,.36);padding:3px 10px;border-radius:999px;font-size:.6rem;font-weight:900;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
                .tp-wk-pill-dot{width:6px;height:6px;border-radius:50%;background:#ccff00;box-shadow:0 0 8px #ccff00;animation:tpWkPulseDot 1.6s ease-in-out infinite}
                .tp-wk-title{position:relative;z-index:2;margin:0;font-size:1.18rem;font-weight:950;color:#fff;line-height:1.14;letter-spacing:-.025em}
                .tp-wk-title span{color:#ccff00}
                .tp-wk-sub{position:relative;z-index:2;margin:4px auto 0;max-width:320px;font-size:.72rem;color:#94a3b8;line-height:1.35}
                .tp-wk-progress-wrap{position:relative;z-index:2;margin-top:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:4px 11px;display:flex;align-items:center;gap:10px}
                .tp-wk-progress-txt{font-size:.64rem;font-weight:850;color:#e2e8f0;white-space:nowrap}
                .tp-wk-progress-bar{flex:1;height:5px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
                .tp-wk-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#ccff00,#10b981);transition:width .35s ease}
                .tp-wk-body{flex:1 1 auto;min-height:0;padding:12px 13px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#f1f5f9}
                .tp-wk-team-box{flex-shrink:0;background:linear-gradient(155deg,#fff 45%,var(--wk-soft,#f8fafc) 100%);border:1.5px solid var(--wk-border,#e2e8f0);border-left:5px solid var(--wk-accent,#0284c7);border-radius:16px;padding:11px 13px 10px;box-shadow:0 8px 20px rgba(15,23,42,.07);position:relative}
                .tp-wk-team-box.voted{border-color:#6ee7b7;border-left-color:#059669;background:linear-gradient(155deg,#fff 40%,#ecfdf5 100%)}
                .tp-wk-team-box.voted-no{border-color:#fca5a5;border-left-color:#dc2626;background:linear-gradient(155deg,#fff 40%,#fef2f2 100%)}
                .tp-wk-team-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
                .tp-wk-team-eyebrow{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px}
                .tp-wk-j-pill{background:var(--wk-grad,linear-gradient(135deg,#0284c7,#2563eb));color:#fff;font-size:.58rem;font-weight:950;letter-spacing:.7px;text-transform:uppercase;padding:3px 8px;border-radius:7px;box-shadow:0 3px 8px rgba(15,23,42,.14)}
                .tp-wk-cat-pill{display:inline-flex;align-items:center;gap:4px;background:var(--wk-soft2,#e0f2fe);color:var(--wk-accent,#0284c7);border:1px solid var(--wk-border,#7dd3fc);font-size:.57rem;font-weight:950;letter-spacing:.6px;text-transform:uppercase;padding:2px 7px;border-radius:7px}
                .tp-wk-team-name{font-size:.9rem;font-weight:950;color:var(--wk-ink,#0f172a);line-height:1.2}
                .tp-wk-match-line{display:flex;align-items:center;gap:7px;font-size:.82rem;font-weight:900;color:#1e293b;margin-top:7px;background:rgba(255,255,255,.78);border:1px solid var(--wk-border,#e2e8f0);border-radius:10px;padding:5px 8px}
                .tp-wk-vs-badge{display:inline-flex;align-items:center;justify-content:center;background:var(--wk-grad,linear-gradient(135deg,#0284c7,#2563eb));color:#fff;font-size:.56rem;font-weight:950;letter-spacing:.7px;padding:3px 7px;border-radius:6px;flex-shrink:0}
                .tp-wk-opp-name{color:#0f172a;font-weight:900;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .tp-wk-meta-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
                .tp-wk-meta-chip{display:inline-flex;align-items:center;gap:5px;font-size:.69rem;font-weight:800;padding:4px 9px;border-radius:9px}
                .tp-wk-meta-chip.date{background:var(--wk-soft2,#e0f2fe);border:1px solid var(--wk-border,#bae6fd);color:var(--wk-ink,#0c4a6e)}
                .tp-wk-meta-chip.date i{color:var(--wk-accent,#0284c7)}
                .tp-wk-meta-chip.venue{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}
                .tp-wk-meta-chip.venue i{color:#ea580c}
                .tp-wk-count{display:inline-flex;align-items:center;gap:4px;background:var(--wk-grad,linear-gradient(135deg,#0284c7,#2563eb));color:#fff;font-size:.7rem;font-weight:950;padding:4px 9px;border-radius:10px;flex-shrink:0;box-shadow:0 4px 10px rgba(15,23,42,.15)}
                .tp-wk-count.full{background:linear-gradient(135deg,#059669,#10b981);color:#fff}
                .tp-wk-foot{flex-shrink:0;padding:10px 14px 12px;background:#fff;border-top:1px solid #e2e8f0;display:flex;justify-content:center}
                .tp-wk-later{width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#64748b;font-size:.74rem;font-weight:800;padding:9px 14px;cursor:pointer}
            `;
            document.head.appendChild(style);
        }

        _normPhone(val) {
            let d = String(val || '').replace(/\D+/g, '');
            if (d.length > 9 && d.startsWith('34')) d = d.slice(2);
            return d;
        }

        isPilotUser() {
            const u = this._getAuthUser();
            if (!u) return false;
            const ph = this._normPhone(u.phone || u.telefono || u.whatsapp || u.id || '');
            if (ph === this.PILOT_PHONE) return true;
            const n = norm(u.name || u.displayName || '');
            return n.includes('coscolin');
        }

        _scheduleAutoWeeklyPopup() {
            if (typeof window === 'undefined') return;
            let attempts = 0;
            const tryRun = () => {
                if (this._weeklyCheckDone) return;
                attempts++;
                if (this._getAuthUser() && window.TeamSeasonService && window.TeamConvocatoriaService) {
                    this._weeklyCheckDone = true;
                    this.checkAndShowWeeklyConvoPopup({ force: false });
                    return;
                }
                if (attempts < 25) {
                    setTimeout(tryRun, 600);
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(tryRun, 500));
            } else {
                setTimeout(tryRun, 500);
            }
            document.addEventListener('AppReady', () => setTimeout(tryRun, 400));

            // Suscribir a cambios de usuario en Store (cuando el login termina tras cargar INICIO)
            if (window.Store && typeof window.Store.subscribe === 'function') {
                window.Store.subscribe('currentUser', (user) => {
                    if (user && !this._weeklyCheckDone) {
                        this._weeklyCheckDone = true;
                        setTimeout(() => this.checkAndShowWeeklyConvoPopup({ force: false }), 500);
                    }
                });
            }

            window.addEventListener('somospadel:user_logged_in', () => {
                this._weeklyCheckDone = false;
                attempts = 0;
                setTimeout(tryRun, 500);
            });
        }

        _detectMyTeamsIndependent(seasonTeams) {
            if (!Array.isArray(seasonTeams) || seasonTeams.length === 0) return [];
            const authUser = this._getAuthUser();
            const userNorm = norm(this._getUserName());
            const results = [];
            const seen = new Set();
            const add = (team, reason) => {
                if (!team || seen.has(team.id)) return;
                seen.add(team.id);
                results.push({ team, reason, isCaptain: this.isCaptainOf(team) });
            };

            // 1. Por nombre (usando _namesMatch con soporte Alex/Alejandro, Miquel/Miguel, Cris/Cristina...) y capitanía
            if (userNorm.length >= 3) {
                seasonTeams.forEach(t => {
                    const inRoster = (t.roster || []).some(p => this._namesMatch(userNorm, norm(typeof p === 'string' ? p : p.name)));
                    if (inRoster || this.isCaptainOf(t)) {
                        add(t, 'roster');
                    }
                });
            }

            // 2. Por perfil del jugador (teams_somospadel / teamHistory)
            const profileTeams = [
                ...(Array.isArray(authUser?.teams_somospadel) ? authUser.teams_somospadel : []),
                ...(authUser?.team_somospadel ? [authUser.team_somospadel] : [])
            ].map(x => norm(x)).filter(Boolean);

            if (profileTeams.length > 0) {
                seasonTeams.forEach(t => {
                    const tid = norm(t.id);
                    const tname = norm(t.name);
                    const code = this._getTeamCodeKey(t);
                    if (profileTeams.some(pt => pt === tid || pt === tname || (code && pt === code) || tname.includes(pt))) {
                        add(t, 'profile');
                    }
                });
            }

            // 3. Combinar también con TeamView si detectó alguno adicional
            if (window.TeamView && typeof window.TeamView.detectUserHeroTeams === 'function') {
                (window.TeamView.detectUserHeroTeams(seasonTeams) || []).forEach(entry => {
                    if (entry && entry.team) add(entry.team, entry.reason || 'view');
                });
            }

            return results;
        }

        _renderHomeFloatingReminder(cards) {
            if (typeof document === 'undefined') return;
            const pendingCount = (cards || []).filter(c => !c.myStatus).length;
            let pill = document.getElementById('tp-home-convo-pill');
            if (pendingCount === 0) {
                if (pill) pill.remove();
                return;
            }
            if (!pill) {
                pill = document.createElement('button');
                pill.id = 'tp-home-convo-pill';
                pill.type = 'button';
                pill.className = 'tp-home-convo-pill';
                pill.onclick = () => this.checkAndShowWeeklyConvoPopup({ force: true });
                document.body.appendChild(pill);
            }
            pill.innerHTML = `<span class="dot"></span><span>📢 Convocatoria (${pendingCount} pend.) · Votar</span>`;
        }

        _showToast(message, tone = 'success') {
            let toast = document.getElementById('tp-cp-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'tp-cp-toast';
                toast.className = 'tp-cp-toast';
                document.body.appendChild(toast);
            }
            toast.className = `tp-cp-toast show ${tone}`;
            toast.innerHTML = `<span>${esc(message)}</span>`;
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, 3200);
        }

        _getAuthUser() {
            try {
                if (window.Store && typeof window.Store.getState === 'function') {
                    const u = window.Store.getState('currentUser');
                    if (u) return u;
                }
                if (window.currentUser) return window.currentUser;
                const raw = localStorage.getItem('currentUser');
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return null;
        }

        _getUserName() {
            const u = this._getAuthUser();
            return String(u?.name || u?.displayName || '').trim();
        }

        isStaff() {
            const u = this._getAuthUser();
            const role = norm(u?.role || '');
            return ['admin', 'admin_player', 'super_admin', 'superadmin', 'organizador', 'organizer', 'organizador_bcn', 'organizer_bcn'].includes(role);
        }

        _getTeamCodeKey(team) {
            const raw = norm((team?.id || '') + ' ' + (team?.name || ''));
            const m = raw.match(/\b([234](?:ma|mb|fa|fb|xa|xb|m|f|x))\b/);
            return m ? m[1] : '';
        }

        /**
         * Obtiene los puntos de liga de un jugador buscando primero en el roster del equipo
         * y, si es 0 o no está informado, haciendo fallback a ClubTeamsData (histórico/liga real).
         */
        _getPlayerLeaguePoints(team, playerName) {
            const targetNorm = norm(playerName);
            if (!targetNorm) return 0;

            const extractPts = (entry) => {
                if (!entry || typeof entry !== 'object') return 0;
                const val = Number(entry.pts ?? entry.points ?? entry.leaguePoints ?? 0);
                return Number.isFinite(val) ? val : 0;
            };

            let pts = 0;
            if (Array.isArray(team?.roster)) {
                for (const p of team.roster) {
                    const pName = typeof p === 'string' ? p : (p?.name || '');
                    if (this._namesMatch(targetNorm, norm(pName))) {
                        pts = Math.max(pts, extractPts(p));
                    }
                }
            }

            if (pts > 0) return pts;

            // Fallback a ClubTeamsData2026 / _InitialClubTeamsData2026 / ClubTeamsData (puntos oficiales de la liga)
            const pools = [
                window.ClubTeamsData2026,
                window._InitialClubTeamsData2026,
                window.ClubTeamsData
            ].filter(Array.isArray);

            for (const clubTeams of pools) {
                for (const ct of clubTeams) {
                    if (!Array.isArray(ct?.roster)) continue;
                    for (const p of ct.roster) {
                        const pName = typeof p === 'string' ? p : (p?.name || '');
                        if (this._namesMatch(targetNorm, norm(pName))) {
                            pts = Math.max(pts, extractPts(p));
                        }
                    }
                }
            }
            return pts;
        }

        /**
         * Inicializa o sincroniza el borrador manual de pistas y reservas del capitán
         * garantizando que todos los jugadores asignados sigan estando disponibles.
         */
        _getOrInitCaptainDraft(teamId, team, availableNames) {
            const availRanked = (availableNames || []).map((name, idx) => ({
                name,
                pts: this._getPlayerLeaguePoints(team, name),
                _idx: idx
            })).sort((a, b) => (b.pts - a.pts) || (a._idx - b._idx));

            const isStillAvailable = (name) => {
                if (!name) return false;
                const n = norm(name);
                return availRanked.some(a => this._namesMatch(norm(a.name), n));
            };

            let draft = this.captainDraftLineup[teamId];
            if (!draft) {
                const resSlots = Math.max(3, Math.max(0, availRanked.length - 6));
                const reserves = [];
                for (let i = 0; i < resSlots; i++) {
                    reserves.push(availRanked[6 + i]?.name || '');
                }
                draft = {
                    p1: [availRanked[0]?.name || '', availRanked[1]?.name || ''],
                    p2: [availRanked[2]?.name || '', availRanked[3]?.name || ''],
                    p3: [availRanked[4]?.name || '', availRanked[5]?.name || ''],
                    reserves
                };
                this.captainDraftLineup[teamId] = draft;
            } else {
                // Limpiar jugadores que ya no estén disponibles
                draft.p1 = draft.p1.map(n => isStillAvailable(n) ? n : '');
                draft.p2 = draft.p2.map(n => isStillAvailable(n) ? n : '');
                draft.p3 = draft.p3.map(n => isStillAvailable(n) ? n : '');
                draft.reserves = (draft.reserves || ['', '', '']).map(n => isStillAvailable(n) ? n : '');
                while (draft.reserves.length < 3) draft.reserves.push('');
            }
            return { draft, availRanked };
        }

        _findPlayerDraftSlot(draft, playerName) {
            const target = norm(playerName);
            if (!target) return null;
            for (const key of ['p1', 'p2', 'p3']) {
                for (let i = 0; i < 2; i++) {
                    if (draft[key][i] && this._namesMatch(norm(draft[key][i]), target)) {
                        return { group: key, index: i, label: key.toUpperCase() };
                    }
                }
            }
            for (let i = 0; i < (draft.reserves || []).length; i++) {
                if (draft.reserves[i] && this._namesMatch(norm(draft.reserves[i]), target)) {
                    return { group: 'reserves', index: i, label: `R${i + 1}` };
                }
            }
            return null;
        }

        setLineupSlot(teamId, group, index, playerName) {
            const team = this.teamsById[teamId];
            if (!team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const { available } = this._computeLists(team, convo);
            const { draft } = this._getOrInitCaptainDraft(teamId, team, available);

            const cleanVal = String(playerName || '').trim();
            if (cleanVal) {
                // Si el jugador ya estaba en otro hueco, lo liberamos de allí para no duplicar
                const existing = this._findPlayerDraftSlot(draft, cleanVal);
                if (existing) {
                    draft[existing.group][existing.index] = '';
                }
            }
            draft[group][index] = cleanVal;
            this.renderCaptainModal(teamId);
        }

        quickAssignAvailablePlayer(teamId, playerName) {
            const team = this.teamsById[teamId];
            if (!team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const { available } = this._computeLists(team, convo);
            const { draft } = this._getOrInitCaptainDraft(teamId, team, available);

            // Si ya está asignado, quitarlo para permitir recolocarlo en 1 toque
            const existing = this._findPlayerDraftSlot(draft, playerName);
            if (existing) {
                draft[existing.group][existing.index] = '';
                this.renderCaptainModal(teamId);
                return;
            }

            // Buscar el primer hueco libre: P1 -> P2 -> P3 -> Reservas
            for (const key of ['p1', 'p2', 'p3']) {
                for (let i = 0; i < 2; i++) {
                    if (!draft[key][i]) {
                        draft[key][i] = playerName;
                        this.renderCaptainModal(teamId);
                        return;
                    }
                }
            }
            for (let i = 0; i < draft.reserves.length; i++) {
                if (!draft.reserves[i]) {
                    draft.reserves[i] = playerName;
                    this.renderCaptainModal(teamId);
                    return;
                }
            }
            draft.reserves.push(playerName);
            this.renderCaptainModal(teamId);
        }

        autoFillLineupByPoints(teamId) {
            delete this.captainDraftLineup[teamId];
            this.renderCaptainModal(teamId);
            this._showToast('⚡ Pistas 1, 2, 3 y reservas rellenadas por puntos de liga.', 'success');
        }

        clearLineupDraft(teamId) {
            this.captainDraftLineup[teamId] = {
                p1: ['', ''],
                p2: ['', ''],
                p3: ['', ''],
                reserves: ['', '', '']
            };
            this.renderCaptainModal(teamId);
        }

        addReserveSlot(teamId) {
            const team = this.teamsById[teamId];
            if (!team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const { available } = this._computeLists(team, convo);
            const { draft } = this._getOrInitCaptainDraft(teamId, team, available);
            draft.reserves.push('');
            this.renderCaptainModal(teamId);
        }

        sortCourtsByPoints(teamId) {
            const team = this.teamsById[teamId];
            if (!team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const { available } = this._computeLists(team, convo);
            const { draft } = this._getOrInitCaptainDraft(teamId, team, available);

            const pairPts = (arr) => (arr[0] ? this._getPlayerLeaguePoints(team, arr[0]) : 0)
                + (arr[1] ? this._getPlayerLeaguePoints(team, arr[1]) : 0);

            const pairs = [draft.p1, draft.p2, draft.p3].sort((a, b) => pairPts(b) - pairPts(a));
            draft.p1 = pairs[0];
            draft.p2 = pairs[1];
            draft.p3 = pairs[2];
            this.renderCaptainModal(teamId);
            this._showToast('✅ Pistas ordenadas de mayor a menor puntuación de pareja.', 'success');
        }

        /**
         * Calcula la alineación recomendada por puntos de liga (Pista 1, Pista 2, Pista 3)
         * a partir de los jugadores disponibles (los que han confirmado "SÍ, VOY").
         * En la pista más alta (Pista 1) juega la pareja con más puntos.
         */
        _buildPointsLineup(team, availableNames, needed = 6) {
            const ranked = (availableNames || []).map((name, idx) => ({
                name,
                pts: this._getPlayerLeaguePoints(team, name),
                _idx: idx
            })).sort((a, b) => (b.pts - a.pts) || (a._idx - b._idx));

            const maxSlots = Math.max(6, Math.ceil(needed / 2) * 2);
            const numCourts = Math.max(3, Math.ceil(Math.min(needed, maxSlots) / 2));
            const startersCount = numCourts * 2;

            const starters = ranked.slice(0, startersCount);
            const reserves = ranked.slice(startersCount);

            const courts = [];
            for (let c = 0; c < numCourts; c++) {
                const p1 = starters[c * 2] || null;
                const p2 = starters[c * 2 + 1] || null;
                const totalPts = (p1 ? p1.pts : 0) + (p2 ? p2.pts : 0);
                courts.push({
                    courtNumber: c + 1,
                    players: [p1, p2],
                    totalPts,
                    isComplete: Boolean(p1 && p2)
                });
            }

            // Mapa rápido por nombre normalizado -> etiqueta de pista o reserva
            const assignmentByNorm = {};
            courts.forEach(ct => {
                ct.players.forEach(p => {
                    if (p) {
                        assignmentByNorm[norm(p.name)] = {
                            type: 'court',
                            courtNumber: ct.courtNumber,
                            label: `P${ct.courtNumber}`
                        };
                    }
                });
            });
            reserves.forEach((p, i) => {
                assignmentByNorm[norm(p.name)] = {
                    type: 'reserve',
                    order: i + 1,
                    label: `RES #${i + 1}`
                };
            });

            return { ranked, courts, starters, reserves, assignmentByNorm };
        }

        _getTeamTheme(team, index = 0) {
            const code = this._getTeamCodeKey(team);
            const cat = norm((team?.category || '') + ' ' + (team?.name || '') + ' ' + code);

            const isFem = cat.includes('fem') || /\b[234]f[ab]?\b/.test(code);
            const isMix = cat.includes('mixt') || /\b[234]x[ab]?\b/.test(code);
            const isMasc = cat.includes('masc') || /\b[234]m[ab]?\b/.test(code);
            const isAlt = code.endsWith('b') || (index % 2 === 1);

            if (isFem) {
                return isAlt ? {
                    label: 'FEMENINO',
                    icon: 'fa-venus',
                    accent: '#e11d48',
                    accent2: '#f43f5e',
                    grad: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
                    soft: '#fff1f2',
                    soft2: '#ffe4e6',
                    border: '#fda4af',
                    ink: '#881337'
                } : {
                    label: 'FEMENINO',
                    icon: 'fa-venus',
                    accent: '#db2777',
                    accent2: '#ec4899',
                    grad: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
                    soft: '#fdf2f8',
                    soft2: '#fce7f3',
                    border: '#f9a8d4',
                    ink: '#831843'
                };
            }

            if (isMix) {
                return isAlt ? {
                    label: 'MIXTO',
                    icon: 'fa-bolt',
                    accent: '#9333ea',
                    accent2: '#c026d3',
                    grad: 'linear-gradient(135deg, #9333ea 0%, #d946ef 100%)',
                    soft: '#faf5ff',
                    soft2: '#f3e8ff',
                    border: '#d8b4fe',
                    ink: '#581c87'
                } : {
                    label: 'MIXTO',
                    icon: 'fa-bolt',
                    accent: '#7c3aed',
                    accent2: '#a855f7',
                    grad: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
                    soft: '#f5f3ff',
                    soft2: '#ede9fe',
                    border: '#c4b5fd',
                    ink: '#4c1d95'
                };
            }

            if (isMasc) {
                return isAlt ? {
                    label: 'MASCULINO',
                    icon: 'fa-mars',
                    accent: '#0891b2',
                    accent2: '#0284c7',
                    grad: 'linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%)',
                    soft: '#ecfeff',
                    soft2: '#cffafe',
                    border: '#67e8f9',
                    ink: '#164e63'
                } : {
                    label: 'MASCULINO',
                    icon: 'fa-mars',
                    accent: '#0284c7',
                    accent2: '#2563eb',
                    grad: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    soft: '#f0f9ff',
                    soft2: '#e0f2fe',
                    border: '#7dd3fc',
                    ink: '#0c4a6e'
                };
            }

            return {
                label: 'EQUIPO',
                icon: 'fa-shield-alt',
                accent: '#059669',
                accent2: '#10b981',
                grad: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                soft: '#ecfdf5',
                soft2: '#d1fae5',
                border: '#6ee7b7',
                ink: '#064e3b'
            };
        }

        _namesMatch(userNorm, targetNorm) {
            if (!userNorm || !targetNorm || userNorm.length < 3 || targetNorm.length < 3) return false;
            if (userNorm === targetNorm || userNorm.includes(targetNorm) || targetNorm.includes(userNorm)) return true;

            // Variantes frecuentes de nombres propios
            const canonical = (s) => s
                .replace(/\balejandro\b/g, 'alex')
                .replace(/\bmiquel\b/g, 'miguel')
                .replace(/\bcristina\b/g, 'cris')
                .replace(/\bantonio\b/g, 'toni')
                .replace(/\bguasch\b/g, 'guash');

            const u = canonical(userNorm);
            const t = canonical(targetNorm);
            if (u === t || u.includes(t) || t.includes(u)) return true;

            const uParts = u.split(/\s+/).filter(Boolean);
            const tParts = t.split(/\s+/).filter(Boolean);
            return tParts.length >= 2 && uParts.length >= 2 && uParts[0] === tParts[0] && uParts.includes(tParts[1]);
        }

        /**
         * Acceso ESTRICTO a Control Capitán: SOLO Capitán o Subcapitán asignado a ESE equipo.
         */
        isCaptainOf(team) {
            if (!team) return false;
            const userNorm = norm(this._getUserName());
            if (userNorm.length < 3) return false;

            // 1. Comprobar campos directos del equipo (captain / subcaptain)
            if (this._namesMatch(userNorm, norm(team.captain || ''))) return true;
            if (this._namesMatch(userNorm, norm(team.subcaptain || ''))) return true;

            // 2. Comprobar directorio oficial de Capitanes/Subcapitanes 2027
            const dir = window.TeamSeasonService && window.TeamSeasonService.officialCaptains2027;
            if (dir) {
                const code = this._getTeamCodeKey(team);
                const entry = code ? dir[code] : null;
                if (entry) {
                    if (this._namesMatch(userNorm, norm(entry.captain))) return true;
                    if (this._namesMatch(userNorm, norm(entry.subcaptain))) return true;
                    if (Array.isArray(entry.aliases) && entry.aliases.some(a => this._namesMatch(userNorm, norm(a)))) return true;
                }
            }

            return false;
        }

        _getTargetJornada(team) {
            if (!team) return '1';
            const sched = Array.isArray(team.schedule) ? team.schedule : [];
            const pending = sched.find(s => s.status !== 'completed' && !s.result);
            if (pending && pending.j) return String(pending.j);
            if (sched.length > 0) return String(sched[sched.length - 1].j || 1);
            return '1';
        }

        _getNextMatch(team) {
            const sched = Array.isArray(team?.schedule) ? team.schedule : [];
            return sched.find(s => s.status !== 'completed' && !s.result) || sched[sched.length - 1] || null;
        }

        cleanup() {
            Object.values(this.unsubscribes).forEach(fn => {
                try { if (typeof fn === 'function') fn(); } catch (e) {}
            });
            this.unsubscribes = {};
        }

        /**
         * Monta las tarjetas interactivas en tiempo real para todos los equipos detectados del jugador.
         */
        mountForTeams(heroTeams) {
            this.cleanup();
            if (!Array.isArray(heroTeams) || heroTeams.length === 0) return;
            const svc = window.TeamConvocatoriaService;
            if (!svc) return;

            heroTeams.forEach(entry => {
                const team = entry.team || entry;
                if (!team || !team.id) return;
                this.teamsById[team.id] = team;
                const j = this._getTargetJornada(team);

                // Render inicial inmediato mientras llega snapshot
                this.renderSlot(team.id);

                this.unsubscribes[team.id] = svc.listenConvocatoria(team.id, j, (convoData) => {
                    this.liveDataByTeam[team.id] = convoData || null;
                    this.renderSlot(team.id);
                    if (this.activeCaptainModalTeamId === team.id) {
                        this.renderCaptainModal(team.id);
                    }
                });
            });
        }

        _computeLists(team, convo) {
            const rosterNames = (team?.roster || []).map(p => typeof p === 'string' ? p : (p.name || '')).filter(Boolean);
            const responses = (convo && convo.responses && typeof convo.responses === 'object') ? convo.responses : {};

            const available = [];
            const unavailable = [];
            const seenPlayers = [];

            Object.entries(responses).forEach(([key, val]) => {
                const name = (typeof val === 'object' && val?.name) ? val.name : key;
                const st = (typeof val === 'object' && val?.status) ? val.status : val;
                const n = norm(name);
                if (!n || (st !== 'available' && st !== 'unavailable')) return;
                // Deduplicar si el mismo jugador aparece con variante (ej. Alex vs Alejandro)
                if (seenPlayers.some(prev => this._namesMatch(prev, n))) return;
                seenPlayers.push(n);
                if (st === 'available') available.push(name);
                else if (st === 'unavailable') unavailable.push(name);
            });

            const pending = rosterNames.filter(rName => {
                const rn = norm(rName);
                return !seenPlayers.some(sp => this._namesMatch(sp, rn));
            });

            // Estado del usuario actual (usando _namesMatch para soportar Alex/Alejandro, etc.)
            const myName = this._getUserName();
            const myNorm = norm(myName);
            let myStatus = null;
            if (myNorm) {
                for (const [key, val] of Object.entries(responses)) {
                    const rName = norm((typeof val === 'object' && val?.name) ? val.name : key);
                    if (this._namesMatch(myNorm, rName)) {
                        const st = (typeof val === 'object' && val?.status) ? val.status : val;
                        if (st === 'available' || st === 'unavailable') {
                            myStatus = st;
                            break;
                        }
                    }
                }
            }

            return { available, unavailable, pending, myStatus };
        }

        renderSlot(teamId) {
            const slot = document.getElementById(`tp-convo-pro-${teamId}`);
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!slot || !team) return;

            const convo = this.liveDataByTeam[teamId];
            const isCap = this.isCaptainOf(team);
            const match = this._getNextMatch(team);
            const jNum = (convo && convo.jornada) || this._getTargetJornada(team);
            const needed = Number(convo?.neededPlayers || convo?.targetCount || 6);
            const isOpen = !convo || convo.status !== 'closed';
            const hasActiveConvo = Boolean(convo && (convo.opponent || convo.date || Object.keys(convo.responses || {}).length > 0 || convo.launchedByCaptain));

            const { available, unavailable, pending, myStatus } = this._computeLists(team, convo);
            const pct = Math.min(100, Math.round((available.length / needed) * 100));
            const expanded = Boolean(this.expandedTeams[teamId]);

            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const opponent = (!isPlaceholder(convo?.opponent) ? convo.opponent : null) || match?.opponent || 'Rival por confirmar';
            const dateTxt = (!isPlaceholder(convo?.date) ? convo.date : null) || match?.date || 'Fecha por confirmar';
            const timeTxt = (!isPlaceholder(convo?.time) ? convo.time : null) || match?.time || '';
            const venueTxt = (!isPlaceholder(convo?.venue) ? convo.venue : null) || match?.location || match?.venue || 'Sede oficial';
            const noteTxt = convo?.note || '';

            const statusBadge = !isOpen
                ? `<span class="tp-cp-badge closed"><i class="fas fa-lock"></i> Cerrada</span>`
                : (myStatus === 'available'
                    ? `<span class="tp-cp-badge yes"><i class="fas fa-check"></i> Vas a jugar</span>`
                    : (myStatus === 'unavailable'
                        ? `<span class="tp-cp-badge no"><i class="fas fa-times"></i> No puedes</span>`
                        : `<span class="tp-cp-badge wait"><i class="fas fa-clock"></i> Sin votar</span>`));

            const avatarColors = ['#0284c7', '#059669', '#7c3aed', '#d97706', '#db2777', '#2563eb'];
            const getInitials = (fullName) => {
                const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
                if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                return (parts[0] || '?').slice(0, 2).toUpperCase();
            };
            const firstNamesPreview = available.length === 0
                ? 'Aún sin confirmados'
                : (available.length <= 2
                    ? available.map(n => n.split(' ')[0]).join(' y ')
                    : `${available.slice(0, 2).map(n => n.split(' ')[0]).join(', ')} +${available.length - 2} más`);
            const visibleAvatars = available.slice(0, 5);
            const extraAvatars = Math.max(0, available.length - visibleAvatars.length);
            const cupoFull = available.length >= needed;

            slot.innerHTML = `
                <div class="tp-cp-box ${cupoFull ? 'cupo-full' : ''}">
                    <!-- CABECERA MATCHDAY PRO -->
                    <div class="tp-cp-hero">
                        <div class="tp-cp-head">
                            <div class="tp-cp-title-wrap">
                                <span class="tp-cp-jtag">📢 JORNADA ${esc(jNum)}</span>
                                <span class="tp-cp-date-light">${esc(dateTxt)}${timeTxt ? ' • ' + esc(timeTxt) : ''}</span>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="tp-cp-opp-light">🆚 ${esc(opponent)}</div>
                        <div class="tp-cp-venue-light"><i class="fas fa-map-marker-alt"></i> ${esc(venueTxt)}</div>
                        ${noteTxt ? `<div class="tp-cp-note-light">💬 "${esc(noteTxt)}"</div>` : ''}
                    </div>

                    <div class="tp-cp-body">
                        <!-- BLOQUE JUGADOR: SIEMPRE VISIBLE EN 1 TOQUE (SOLO SÍ / NO) -->
                        <div class="tp-cp-vote-label">
                            <span><i class="fas fa-hand-pointer"></i> Confirma en 1 toque</span>
                            ${cupoFull ? `<span class="tp-cp-full-pill">🔥 CUPO COMPLETO</span>` : `<span>Faltan ${Math.max(0, needed - available.length)}</span>`}
                        </div>
                        <div class="tp-cp-vote-row">
                            <button type="button"
                                    class="tp-cp-vote-btn yes ${myStatus === 'available' ? 'selected' : ''}"
                                    ${!isOpen ? 'disabled' : ''}
                                    onclick="window.TeamConvocatoriaProUI.vote('${esc(teamId)}', 'available')">
                                <i class="fas fa-check-circle"></i> SÍ, VOY
                            </button>
                            <button type="button"
                                    class="tp-cp-vote-btn no ${myStatus === 'unavailable' ? 'selected' : ''}"
                                    ${!isOpen ? 'disabled' : ''}
                                    onclick="window.TeamConvocatoriaProUI.vote('${esc(teamId)}', 'unavailable')">
                                <i class="fas fa-times-circle"></i> NO PUEDO
                            </button>
                        </div>
                        <div class="tp-cp-vote-clear-wrap">
                            <button type="button"
                                    class="tp-cp-vote-btn pending ${!myStatus ? 'selected' : ''}"
                                    ${!isOpen ? 'disabled' : ''}
                                    onclick="window.TeamConvocatoriaProUI.clearVote('${esc(teamId)}')">
                                <i class="fas fa-clock"></i> SIN VOTAR
                            </button>
                        </div>

                        <!-- RESUMEN VISUAL PRO: AVATARES CON 2 INICIALES + PÍLDORAS + BARRA -->
                        <div class="tp-cp-summary-card">
                            <div class="tp-cp-live-strip">
                                <div class="tp-cp-ava-group">
                                    <div class="tp-cp-avatars">
                                        ${visibleAvatars.length > 0 ? visibleAvatars.map((name, i) => `
                                            <span class="tp-cp-ava" title="${esc(name)}" style="background:${avatarColors[(name.length + i) % avatarColors.length]};">${esc(getInitials(name))}</span>
                                        `).join('') : `<span class="tp-cp-ava empty">0</span>`}
                                        ${extraAvatars > 0 ? `<span class="tp-cp-ava extra">+${extraAvatars}</span>` : ''}
                                    </div>
                                    <span class="tp-cp-who-txt">${esc(firstNamesPreview)}</span>
                                </div>
                                <button type="button" class="tp-cp-toggle-pill ${expanded ? 'open' : ''}" onclick="window.TeamConvocatoriaProUI.toggleExpanded('${esc(teamId)}')">
                                    ${expanded ? 'Ocultar ▲' : 'Ver lista ▼'}
                                </button>
                            </div>

                            <div class="tp-cp-stat-pills">
                                <span class="tp-cp-sp yes"><i class="fas fa-check"></i> ${available.length}/${needed} Van</span>
                                <span class="tp-cp-sp no"><i class="fas fa-times"></i> ${unavailable.length} No</span>
                                <span class="tp-cp-sp pend"><i class="fas fa-clock"></i> ${pending.length} Pend.</span>
                                <span class="tp-cp-pct">${pct}%</span>
                            </div>

                            <div class="tp-cp-bar"><div class="tp-cp-bar-fill ${cupoFull ? 'full' : ''}" style="width:${pct}%;"></div></div>
                        </div>

                        ${expanded ? `
                            <div class="tp-cp-lists">
                                <div><strong style="color:#059669;">✅ Van (${available.length}):</strong> ${available.length ? esc(available.join(', ')) : 'Nadie aún'}</div>
                                <div><strong style="color:#dc2626;">❌ No pueden (${unavailable.length}):</strong> ${unavailable.length ? esc(unavailable.join(', ')) : '—'}</div>
                                <div style="color:#64748b;"><strong>⏳ Pendientes (${pending.length}):</strong> ${pending.length ? esc(pending.join(', ')) : '¡Todos votaron!'}</div>
                            </div>
                        ` : ''}

                        ${isCap ? `
                            <!-- BLOQUE CAPITÁN PRO: EDITAR + CONTROL + WHATSAPP DIRECTO AL GRUPO -->
                            <div class="tp-cp-cap-bar tri">
                                <button type="button" class="tp-cp-cap-btn launch" onclick="window.TeamConvocatoriaProUI.openCaptainModal('${esc(teamId)}', true)">
                                    <i class="fas fa-bullhorn"></i> ${hasActiveConvo ? 'Editar convo' : 'Lanzar'}
                                </button>
                                <button type="button" class="tp-cp-cap-btn" onclick="window.TeamConvocatoriaProUI.openCaptainModal('${esc(teamId)}', false)">
                                    <i class="fas fa-crown"></i> Enviar convo
                                </button>
                                <button type="button" class="tp-cp-cap-btn wa-quick" onclick="window.TeamConvocatoriaProUI.shareWhatsApp('${esc(teamId)}')">
                                    <i class="fab fa-whatsapp"></i> Grupo WA
                                </button>
                            </div>
                        ` : `
                            <!-- BLOQUE CAPITÁN: RESTRINGIDO (ABRE POP-UP INFORMATIVO) -->
                            <div class="tp-cp-cap-bar" style="grid-template-columns:1fr;">
                                <button type="button" class="tp-cp-cap-btn" style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;" onclick="window.TeamConvocatoriaProUI.openCaptainModal('${esc(teamId)}', false)">
                                    <i class="fas fa-lock" style="color:#94a3b8;"></i> Control Capitán (Solo Capitán / Subcapitán)
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        toggleExpanded(teamId) {
            this.expandedTeams[teamId] = !this.expandedTeams[teamId];
            this.renderSlot(teamId);
        }

        async vote(teamId, status, explicitSeasonId = null, explicitJornada = null) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!svc || !team) return;

            const playerName = this._getUserName();
            if (!playerName) {
                alert('Inicia sesión con tu cuenta de jugador para poder confirmar tu asistencia.');
                return;
            }

            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(18);
            const j = explicitJornada || (this.liveDataByTeam[teamId]?.jornada) || this._getTargetJornada(team);
            const sid = explicitSeasonId || team.seasonId || (window.TeamSeasonService ? window.TeamSeasonService.getSelectedSeasonId() : '2026');

            try {
                await svc.submitPlayerResponse(teamId, j, playerName, status, '', sid);
                this._showToast(
                    status === 'available'
                        ? `✅ ¡Apuntado en ${team.name}! El capitán ya te ve en la lista.`
                        : `❌ Baja registrada en ${team.name}.`,
                    status === 'available' ? 'success' : 'warn'
                );
            } catch (err) {
                console.error('❌ [TeamConvocatoriaProUI] Error guardando voto:', err);
                this._showToast('No se pudo guardar tu respuesta. Inténtalo de nuevo.', 'warn');
            }
        }

        async clearVote(teamId, explicitSeasonId = null, explicitJornada = null) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!svc || !team) return;

            const playerName = this._getUserName();
            if (!playerName) {
                alert('Inicia sesión con tu cuenta de jugador para poder gestionar tu asistencia.');
                return;
            }

            const currentConvo = this.liveDataByTeam[teamId];
            const { myStatus } = this._computeLists(team, currentConvo);
            if (!myStatus && !explicitJornada) {
                this._showToast(`⏳ Ya estás como "Sin votar" en ${team.name}.`, 'warn');
                return;
            }

            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(14);
            const j = explicitJornada || (currentConvo?.jornada) || this._getTargetJornada(team);
            const sid = explicitSeasonId || team.seasonId || (window.TeamSeasonService ? window.TeamSeasonService.getSelectedSeasonId() : '2026');

            try {
                const res = await svc.clearPlayerResponse(
                    teamId,
                    j,
                    playerName,
                    sid,
                    (a, b) => this._namesMatch(norm(a), norm(b))
                );
                if (res && res.data) {
                    this.liveDataByTeam[teamId] = res.data;
                }
                try {
                    const convoId = svc.normalizeId(teamId, j, sid);
                    localStorage.removeItem(`sp_convo_voted_v2_${convoId}`);
                } catch (e) {}
                this.renderSlot(teamId);
                if (this.activeCaptainModalTeamId === teamId) {
                    this.renderCaptainModal(teamId);
                }
                this._showToast(`⏳ Voto retirado en ${team.name} (Sin votar).`, 'warn');
            } catch (err) {
                console.error('❌ [TeamConvocatoriaProUI] Error quitando voto:', err);
                this._showToast('No se pudo quitar tu voto. Inténtalo de nuevo.', 'warn');
            }
        }

        // ============================================================
        // 👑 PANEL DE CONTROL DEL CAPITÁN (MODAL / BOTTOM SHEET)
        // ============================================================

        openCaptainModal(teamId, openCreateForm = false) {
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!team) return;
            if (!this.isCaptainOf(team)) {
                this.showCaptainRestrictedPopup(team);
                return;
            }
            this.teamsById[teamId] = team;
            this.activeCaptainModalTeamId = teamId;
            this.showCreateFormInModal = Boolean(openCreateForm);
            this.captainModalMode = openCreateForm ? 'edit' : 'send';
            this.captainTab = openCreateForm ? 'config' : 'lineup';

            let modal = document.getElementById('tp-captain-convo-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'tp-captain-convo-modal';
                modal.className = 'tp-cp-modal-overlay';
                modal.onclick = (e) => { if (e.target === modal) this.closeCaptainModal(); };
                document.body.appendChild(modal);
            }
            modal.style.display = 'flex';
            this.renderCaptainModal(teamId);
        }

        closeCaptainModal() {
            this.activeCaptainModalTeamId = null;
            const modal = document.getElementById('tp-captain-convo-modal');
            if (modal) modal.style.display = 'none';
        }

        showCaptainRestrictedPopup(team) {
            let popup = document.getElementById('tp-captain-restricted-popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'tp-captain-restricted-popup';
                popup.className = 'tp-cp-modal-overlay';
                popup.style.alignItems = 'center';
                popup.onclick = (e) => { if (e.target === popup) popup.style.display = 'none'; };
                document.body.appendChild(popup);
            }

            const cap = team?.captain && !String(team.captain).toLowerCase().includes('pendiente') ? team.captain : 'Por asignar';
            const sub = team?.subcaptain && !String(team.subcaptain).toLowerCase().includes('pendiente') ? team.subcaptain : '';

            popup.innerHTML = `
                <div class="tp-cp-modal-card" style="max-width:390px;text-align:center;" onclick="event.stopPropagation()">
                    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:20px 18px 16px;">
                        <div style="width:52px;height:52px;border-radius:16px;background:rgba(245,158,11,0.16);border:1.5px solid rgba(245,158,11,0.45);color:#fbbf24;display:inline-flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:10px;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div style="font-size:1.05rem;font-weight:950;color:#ffffff;">Acceso solo para Capitanes</div>
                        <div style="font-size:0.74rem;color:#94a3b8;margin-top:3px;">${esc(team?.name || 'Equipo')}</div>
                    </div>
                    <div style="padding:18px;color:#334155;">
                        <p style="margin:0 0 12px;font-size:0.86rem;font-weight:700;line-height:1.45;">
                            No puedes entrar en este panel porque <strong>no eres el Capitán ni el Subcapitán</strong> de este equipo.
                        </p>
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:0.78rem;text-align:left;margin-bottom:14px;">
                            <div><i class="fas fa-crown" style="color:#f59e0b;width:18px;"></i> <strong>Capitán/a:</strong> ${esc(cap)}</div>
                            ${sub ? `<div style="margin-top:4px;"><i class="fas fa-user-shield" style="color:#0284c7;width:18px;"></i> <strong>Subcapitán/a:</strong> ${esc(sub)}</div>` : ''}
                        </div>
                        <button type="button" onclick="document.getElementById('tp-captain-restricted-popup').style.display='none'"
                                style="width:100%;background:#0f172a;color:#ccff00;border:none;border-radius:12px;padding:11px;font-weight:950;font-size:0.82rem;cursor:pointer;">
                            Entendido
                        </button>
                    </div>
                </div>
            `;
            popup.style.display = 'flex';
        }

        renderCaptainModal(teamId) {
            const modal = document.getElementById('tp-captain-convo-modal');
            const team = this.teamsById[teamId];
            if (!modal || !team) return;

            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const jNum = convo.jornada || this._getTargetJornada(team);
            const needed = Number(convo.neededPlayers || convo.targetCount || 6);
            const isOpen = convo.status !== 'closed';
            const { available, unavailable, pending } = this._computeLists(team, convo);
            const pct = Math.min(100, Math.round((available.length / needed) * 100));

            const roster = (team.roster || []).map(p => typeof p === 'string' ? p : (p.name || '')).filter(Boolean);
            const statusOf = (name) => {
                const n = norm(name);
                if (available.some(a => this._namesMatch(norm(a), n))) return 'available';
                if (unavailable.some(u => this._namesMatch(norm(u), n))) return 'unavailable';
                return null;
            };
            const lineup = this._buildPointsLineup(team, available, needed);
            const formatPts = (v) => {
                const n = Number(v || 0);
                return Number.isInteger(n) ? `${n} pts` : `${n.toFixed(1)} pts`;
            };
            const getAssignment = (pName) => {
                const pn = norm(pName);
                for (const [k, val] of Object.entries(lineup.assignmentByNorm)) {
                    if (this._namesMatch(k, pn)) return val;
                }
                return null;
            };
            const sortedRoster = roster.map((pName, idx) => ({
                name: pName,
                pts: this._getPlayerLeaguePoints(team, pName),
                status: statusOf(pName),
                assignment: getAssignment(pName),
                _idx: idx
            })).sort((a, b) => {
                // Primero ordenar por puntos de liga descendente (para ayudar a decidir al capitán)
                if (b.pts !== a.pts) return b.pts - a.pts;
                return a._idx - b._idx;
            });

            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const cleanOpp = (!isPlaceholder(convo.opponent) ? convo.opponent : null) || match?.opponent || '';
            const cleanDate = (!isPlaceholder(convo.date) ? convo.date : null) || match?.date || '';
            const cleanTime = (!isPlaceholder(convo.time) ? convo.time : null) || match?.time || '';
            const cleanVenue = (!isPlaceholder(convo.venue) ? convo.venue : null) || match?.location || match?.venue || 'Padel BCN - El Prat';
            const isEditMode = this.captainModalMode === 'edit';
            const activeTab = isEditMode && this.captainTab === 'lineup' ? 'config' : (this.captainTab || (isEditMode ? 'config' : 'lineup'));
            const { draft, availRanked } = this._getOrInitCaptainDraft(teamId, team, available);

            const courtTotalPts = (pair) => (pair[0] ? this._getPlayerLeaguePoints(team, pair[0]) : 0)
                + (pair[1] ? this._getPlayerLeaguePoints(team, pair[1]) : 0);
            const p1Pts = courtTotalPts(draft.p1);
            const p2Pts = courtTotalPts(draft.p2);
            const p3Pts = courtTotalPts(draft.p3);
            const hasPairOrderIssue = (draft.p2.some(Boolean) && p2Pts > p1Pts)
                || (draft.p3.some(Boolean) && p3Pts > p2Pts);

            const renderSlotSelect = (group, idx, currentVal, placeholder) => `
                <div class="tp-cp-slot-row">
                    <select class="tp-cp-slot-select ${currentVal ? 'filled' : ''}"
                            onchange="window.TeamConvocatoriaProUI.setLineupSlot('${esc(teamId)}', '${group}', ${idx}, this.value)">
                        <option value="">${placeholder}</option>
                        ${availRanked.map(pl => {
                            const selected = currentVal && this._namesMatch(norm(currentVal), norm(pl.name));
                            const slotInfo = this._findPlayerDraftSlot(draft, pl.name);
                            const tag = slotInfo && !selected ? ` [${slotInfo.label}]` : '';
                            return `<option value="${esc(pl.name)}" ${selected ? 'selected' : ''}>${esc(pl.name)} (${formatPts(pl.pts)})${tag}</option>`;
                        }).join('')}
                    </select>
                    ${currentVal ? `
                        <span class="tp-cp-slot-pts">${formatPts(this._getPlayerLeaguePoints(team, currentVal))}</span>
                        <button type="button" class="tp-cp-slot-clear" title="Quitar"
                                onclick="window.TeamConvocatoriaProUI.setLineupSlot('${esc(teamId)}', '${group}', ${idx}, '')">✕</button>
                    ` : ''}
                </div>
            `;

            modal.innerHTML = `
                <div class="tp-cp-modal-card" onclick="event.stopPropagation()">
                    <div class="tp-cp-modal-head" style="flex-shrink:0;">
                        <div style="min-width:0;">
                            <div style="font-size:0.62rem;font-weight:950;color:#ccff00;text-transform:uppercase;letter-spacing:0.8px;">${isEditMode ? '📢 EDITAR CONVOCATORIA' : '👑 ENVIAR CONVOCATORIA'}</div>
                            <div style="font-size:1rem;font-weight:950;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(team.name)} • J${esc(jNum)}</div>
                        </div>
                        <button type="button" onclick="window.TeamConvocatoriaProUI.closeCaptainModal()"
                                style="background:rgba(255,255,255,0.12);border:none;color:#fff;width:32px;height:32px;border-radius:10px;cursor:pointer;font-size:1rem;flex-shrink:0;">✕</button>
                    </div>

                    <!-- RESUMEN MINI SIEMPRE VISIBLE + PESTAÑAS -->
                    <div class="tp-cp-tabs-bar">
                        <div class="tp-cp-mini-summary">
                            <span class="tp-cp-ms-pill yes">✅ ${available.length}/${needed} Van</span>
                            <span class="tp-cp-ms-pill no">❌ ${unavailable.length} No</span>
                            <span class="tp-cp-ms-pill pend">⏳ ${pending.length} Pend.</span>
                            <span class="tp-cp-ms-status ${isOpen ? 'open' : 'closed'}">${isOpen ? 'Abierta' : 'Cerrada'}</span>
                        </div>
                        ${isEditMode ? `
                            <div class="tp-cp-tabs" style="grid-template-columns:repeat(2,1fr);">
                                <button type="button" class="tp-cp-tab ${activeTab === 'config' ? 'active' : ''}"
                                        onclick="window.TeamConvocatoriaProUI.setCaptainTab('config')">
                                    <i class="fas fa-sliders-h"></i> Jornada
                                </button>
                                <button type="button" class="tp-cp-tab ${activeTab === 'roster' ? 'active' : ''}"
                                        onclick="window.TeamConvocatoriaProUI.setCaptainTab('roster')">
                                    <i class="fas fa-users"></i> Plantilla (${roster.length})
                                </button>
                            </div>
                        ` : `
                            <div class="tp-cp-tabs" style="grid-template-columns:repeat(2,1fr);">
                                <button type="button" class="tp-cp-tab ${activeTab === 'lineup' ? 'active' : ''}"
                                        onclick="window.TeamConvocatoriaProUI.setCaptainTab('lineup')">
                                    <i class="fas fa-trophy"></i> Armar Pistas y Reservas
                                </button>
                                <button type="button" class="tp-cp-tab ${activeTab === 'roster' ? 'active' : ''}"
                                        onclick="window.TeamConvocatoriaProUI.setCaptainTab('roster')">
                                    <i class="fas fa-users"></i> Plantilla (${roster.length})
                                </button>
                            </div>
                        `}
                    </div>

                    <div class="tp-cp-modal-body" style="flex:1 1 auto;min-height:0;overflow-y:auto;">
                        ${activeTab === 'lineup' ? `
                            <!-- 1️⃣ TODOS LOS JUGADORES QUE HAN DICHO QUE SÍ -->
                            <div class="tp-cp-step-box">
                                <div class="tp-cp-step-head">
                                    <div>
                                        <div class="tp-cp-step-title">1. DISPONIBLES QUE HAN DICHO SÍ (${availRanked.length})</div>
                                        <div class="tp-cp-step-sub">Ordenados por puntos de liga · Toca un jugador para asignarlo/quitarlo</div>
                                    </div>
                                    ${availRanked.length > 0 ? `
                                        <div style="display:flex;gap:5px;flex-shrink:0;">
                                            <button type="button" class="tp-cp-mini-action auto" onclick="window.TeamConvocatoriaProUI.autoFillLineupByPoints('${esc(teamId)}')">⚡ Auto pts</button>
                                            <button type="button" class="tp-cp-mini-action" onclick="window.TeamConvocatoriaProUI.clearLineupDraft('${esc(teamId)}')">Limpiar</button>
                                        </div>
                                    ` : ''}
                                </div>

                                ${availRanked.length === 0 ? `
                                    <div class="tp-cp-empty-note">
                                        Todavía no ha confirmado ningún jugador con <strong>SÍ, VOY</strong>. Puedes apuntarlos manualmente en la pestaña <strong>Plantilla</strong>.
                                    </div>
                                ` : `
                                    <div class="tp-cp-avail-chips">
                                        ${availRanked.map(pl => {
                                            const slotInfo = this._findPlayerDraftSlot(draft, pl.name);
                                            const slotClass = slotInfo ? (slotInfo.group === 'reserves' ? 'res' : slotInfo.group) : '';
                                            return `
                                                <button type="button"
                                                        class="tp-cp-avail-chip ${slotInfo ? 'assigned ' + slotClass : ''}"
                                                        onclick="window.TeamConvocatoriaProUI.quickAssignAvailablePlayer('${esc(teamId)}', '${esc(pl.name)}')">
                                                    <span class="tp-cp-ac-name">${esc(pl.name)}</span>
                                                    <span class="tp-cp-ac-pts">${formatPts(pl.pts)}</span>
                                                    ${slotInfo ? `<span class="tp-cp-ac-tag ${slotClass}">${slotInfo.label}</span>` : ''}
                                                </button>
                                            `;
                                        }).join('')}
                                    </div>
                                `}
                            </div>

                            <!-- 2️⃣ COLOCAR EN LAS 3 PISTAS SEGÚN PUNTOS -->
                            <div class="tp-cp-lineup-card">
                                <div class="tp-cp-lineup-head">
                                    <div>
                                        <div class="tp-cp-lineup-title"><i class="fas fa-trophy"></i> 2. COLOCAR EN LAS 3 PISTAS</div>
                                        <div class="tp-cp-lineup-sub">Elige quién juega en cada pista · Pista 1 debe ser la pareja con más puntos</div>
                                    </div>
                                </div>

                                ${hasPairOrderIssue ? `
                                    <div class="tp-cp-order-warn">
                                        <span>⚠️ Una pista inferior suma más puntos que una superior.</span>
                                        <button type="button" onclick="window.TeamConvocatoriaProUI.sortCourtsByPoints('${esc(teamId)}')">Ordenar</button>
                                    </div>
                                ` : (availRanked.length >= 2 ? `
                                    <div class="tp-cp-order-ok">✅ Orden de puntos correcto (P1 ≥ P2 ≥ P3)</div>
                                ` : '')}

                                <div class="tp-cp-courts-grid">
                                    <div class="tp-cp-court-row c1">
                                        <div class="tp-cp-court-top">
                                            <span class="tp-cp-court-badge c1">🥇 PISTA 1</span>
                                            <span class="tp-cp-court-pts">${formatPts(p1Pts)} pareja</span>
                                        </div>
                                        <div class="tp-cp-court-players">
                                            ${renderSlotSelect('p1', 0, draft.p1[0], '— Seleccionar Jugador 1 —')}
                                            ${renderSlotSelect('p1', 1, draft.p1[1], '— Seleccionar Jugador 2 —')}
                                        </div>
                                    </div>

                                    <div class="tp-cp-court-row c2">
                                        <div class="tp-cp-court-top">
                                            <span class="tp-cp-court-badge c2">🥈 PISTA 2</span>
                                            <span class="tp-cp-court-pts">${formatPts(p2Pts)} pareja</span>
                                        </div>
                                        <div class="tp-cp-court-players">
                                            ${renderSlotSelect('p2', 0, draft.p2[0], '— Seleccionar Jugador 1 —')}
                                            ${renderSlotSelect('p2', 1, draft.p2[1], '— Seleccionar Jugador 2 —')}
                                        </div>
                                    </div>

                                    <div class="tp-cp-court-row c3">
                                        <div class="tp-cp-court-top">
                                            <span class="tp-cp-court-badge c3">🥉 PISTA 3</span>
                                            <span class="tp-cp-court-pts">${formatPts(p3Pts)} pareja</span>
                                        </div>
                                        <div class="tp-cp-court-players">
                                            ${renderSlotSelect('p3', 0, draft.p3[0], '— Seleccionar Jugador 1 —')}
                                            ${renderSlotSelect('p3', 1, draft.p3[1], '— Seleccionar Jugador 2 —')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 3️⃣ POSICIONES DE RESERVA -->
                            <div class="tp-cp-step-box">
                                <div class="tp-cp-step-head">
                                    <div>
                                        <div class="tp-cp-step-title">3. JUGADORES EN RESERVA</div>
                                        <div class="tp-cp-step-sub">Define el orden de entrada si hay alguna baja de última hora</div>
                                    </div>
                                    <button type="button" class="tp-cp-mini-action" onclick="window.TeamConvocatoriaProUI.addReserveSlot('${esc(teamId)}')">+ Añadir</button>
                                </div>
                                <div class="tp-cp-reserves-slots">
                                    ${draft.reserves.map((rName, idx) => `
                                        <div class="tp-cp-reserve-slot-wrap">
                                            <span class="tp-cp-res-num">R${idx + 1}</span>
                                            ${renderSlotSelect('reserves', idx, rName, `— Reserva ${idx + 1} (opcional) —`)}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- 4️⃣ ENVIAR CONVOCATORIA A WHATSAPP -->
                            <div class="tp-cp-cap-actions" style="margin-bottom:0;">
                                <button type="button" class="tp-cp-act wa" style="grid-column:1/-1;padding:12px;font-size:0.84rem;" onclick="window.TeamConvocatoriaProUI.shareLineupWhatsApp('${esc(teamId)}')">
                                    <i class="fab fa-whatsapp" style="font-size:1.05rem;"></i> Enviar Convocatoria a WhatsApp
                                </button>
                                <button type="button" class="tp-cp-act" onclick="window.TeamConvocatoriaProUI.copyLineupWhatsApp('${esc(teamId)}')">
                                    <i class="fas fa-copy"></i> Copiar Convo
                                </button>
                                <button type="button" class="tp-cp-act" onclick="window.TeamConvocatoriaProUI.notifyPendingPlayers('${esc(teamId)}')">
                                    <i class="fas fa-bell"></i> Recordar (${pending.length})
                                </button>
                            </div>
                        ` : ''}

                        ${activeTab === 'roster' ? `
                            <!-- PESTAÑA 2: PLANTILLA ORDENADA POR PUNTOS -->
                            <div class="tp-cp-filter-bar">
                                <input type="text" value="${esc(this.captainSearch)}" placeholder="Buscar jugador..."
                                       oninput="window.TeamConvocatoriaProUI.setCaptainSearch(this.value)"
                                       class="tp-cp-search-mini">
                                <div class="tp-cp-chips">
                                    <button type="button" class="tp-cp-chip ${this.captainFilter === 'all' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('all')">Todos (${roster.length})</button>
                                    <button type="button" class="tp-cp-chip ${this.captainFilter === 'available' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('available')">✅ Van (${available.length})</button>
                                    <button type="button" class="tp-cp-chip ${this.captainFilter === 'unavailable' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('unavailable')">❌ No (${unavailable.length})</button>
                                    <button type="button" class="tp-cp-chip ${this.captainFilter === 'pending' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('pending')">⏳ Pend (${pending.length})</button>
                                </div>
                            </div>

                            <div class="tp-cp-roster-control" style="max-height:none;">
                                ${sortedRoster.filter(item => {
                                    if (this.captainFilter === 'available' && item.status !== 'available') return false;
                                    if (this.captainFilter === 'unavailable' && item.status !== 'unavailable') return false;
                                    if (this.captainFilter === 'pending' && item.status !== null) return false;
                                    if (this.captainSearch && !norm(item.name).includes(norm(this.captainSearch))) return false;
                                    return true;
                                }).map(item => {
                                    const assign = item.assignment;
                                    const assignBadge = assign
                                        ? (assign.type === 'court'
                                            ? `<span class="tp-cp-assign-pill c${assign.courtNumber}">${assign.label}</span>`
                                            : `<span class="tp-cp-assign-pill res">${assign.label}</span>`)
                                        : '';
                                    return `
                                        <div class="tp-cp-player-row">
                                            <div class="tp-cp-player-info">
                                                <span class="tp-cp-player-name">${esc(item.name)}</span>
                                                <div class="tp-cp-player-meta">
                                                    <span class="tp-cp-pts-pill ${item.pts === 0 ? 'muted' : ''}">${formatPts(item.pts)}</span>
                                                    ${assignBadge}
                                                </div>
                                            </div>
                                            <div class="tp-cp-mini-votes">
                                                <button type="button" class="tp-cp-mini yes ${item.status === 'available' ? 'active' : ''}"
                                                        onclick="window.TeamConvocatoriaProUI.captainSetVote('${esc(teamId)}', '${esc(item.name)}', 'available')">✅</button>
                                                <button type="button" class="tp-cp-mini no ${item.status === 'unavailable' ? 'active' : ''}"
                                                        onclick="window.TeamConvocatoriaProUI.captainSetVote('${esc(teamId)}', '${esc(item.name)}', 'unavailable')">❌</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}

                        ${activeTab === 'config' ? `
                            <!-- PESTAÑA 3: CONFIGURAR Y LANZAR JORNADA -->
                            <form class="tp-cp-form" style="margin-bottom:12px;" onsubmit="window.TeamConvocatoriaProUI.submitLaunchConvo(event, '${esc(teamId)}')">
                                <div style="font-size:0.8rem;font-weight:950;color:#0f172a;margin-bottom:9px;">📢 Datos de la Convocatoria</div>
                                <div class="tp-cp-form-grid">
                                    <label>Jornada<input id="tp-cpf-j" type="number" value="${esc(jNum)}" required></label>
                                    <label>Necesarios<input id="tp-cpf-needed" type="number" value="${esc(needed)}" min="2" max="20" required></label>
                                    <label class="full">Rival<input id="tp-cpf-opp" type="text" value="${esc(cleanOpp)}" placeholder="Ej: CRAZYXPADEL 4M" required></label>
                                    <label>Fecha<input id="tp-cpf-date" type="text" value="${esc(cleanDate)}" placeholder="Sáb 16 Ene" required></label>
                                    <label>Hora<input id="tp-cpf-time" type="text" value="${esc(cleanTime)}" placeholder="11:00h" required></label>
                                    <label class="full">Sede / Club<input id="tp-cpf-venue" type="text" value="${esc(cleanVenue)}" required></label>
                                    <label class="full">Nota del capitán (opcional)<input id="tp-cpf-note" type="text" value="${esc(convo.note || '')}" placeholder="Ej: Llegar 20 min antes..."></label>
                                </div>
                                <button type="submit" class="tp-cp-submit-btn">
                                    🚀 Guardar y Avisar a la Plantilla
                                </button>
                            </form>

                            <div class="tp-cp-cap-actions" style="margin-bottom:10px;">
                                <button type="button" class="tp-cp-act wa" onclick="window.TeamConvocatoriaProUI.shareWhatsApp('${esc(teamId)}')">
                                    <i class="fab fa-whatsapp"></i> Resumen WA
                                </button>
                                <button type="button" class="tp-cp-act" onclick="window.TeamConvocatoriaProUI.copyWhatsAppText('${esc(teamId)}')">
                                    <i class="fas fa-copy"></i> Copiar Texto
                                </button>
                            </div>

                            ${this.isPilotUser() ? `
                                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(204,255,0,0.35);border-radius:12px;padding:10px 12px;">
                                    <div style="font-size:0.64rem;font-weight:950;color:#ccff00;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:7px;">
                                        🧪 PRUEBAS PILOTO (649219350)
                                    </div>
                                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
                                        <button type="button" onclick="window.TeamConvocatoriaProUI.closeCaptainModal(); window.TeamConvocatoriaProUI.checkAndShowWeeklyConvoPopup({ force: true });"
                                                style="background:rgba(204,255,0,0.16);color:#ccff00;border:1px solid rgba(204,255,0,0.45);border-radius:9px;padding:8px;font-size:0.72rem;font-weight:900;cursor:pointer;">
                                            🪟 Pop-up Semanal
                                        </button>
                                        <button type="button" onclick="window.TeamConvocatoriaProUI.sendPilotPushToMe('${esc(teamId)}')"
                                                style="background:rgba(56,189,248,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.45);border-radius:9px;padding:8px;font-size:0.72rem;font-weight:900;cursor:pointer;">
                                            📱 Push a mi Móvil
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
            `;
        }

        setCaptainTab(tab) {
            this.captainTab = tab || 'lineup';
            this.showCreateFormInModal = (this.captainTab === 'config');
            if (this.activeCaptainModalTeamId) this.renderCaptainModal(this.activeCaptainModalTeamId);
        }

        toggleCreateForm() {
            this.setCaptainTab(this.captainTab === 'config' ? 'lineup' : 'config');
        }

        async submitLaunchConvo(event, teamId) {
            event.preventDefault();
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return;

            const j = document.getElementById('tp-cpf-j').value.trim() || '1';
            const needed = parseInt(document.getElementById('tp-cpf-needed').value, 10) || 6;
            const opponent = document.getElementById('tp-cpf-opp').value.trim();
            const date = document.getElementById('tp-cpf-date').value.trim();
            const time = document.getElementById('tp-cpf-time').value.trim();
            const venue = document.getElementById('tp-cpf-venue').value.trim();
            const note = document.getElementById('tp-cpf-note').value.trim();

            const existing = this.liveDataByTeam[teamId] || {};
            const keepResponses = String(existing.jornada || '') === String(j) ? (existing.responses || {}) : {};

            try {
                await svc.saveConvocatoria({
                    id: svc.normalizeId(teamId, j),
                    teamId,
                    teamName: team.name,
                    jornada: j,
                    opponent,
                    date,
                    time,
                    venue,
                    neededPlayers: needed,
                    note,
                    status: 'open',
                    launchedByCaptain: this._getUserName() || 'Capitán',
                    responses: keepResponses
                });

                this.showCreateFormInModal = false;
                await this._sendInAppNotificationToRoster(
                    team,
                    `📢 Convocatoria abierta: ${team.name} (J${j})`,
                    `🆚 ${opponent} • ${date} ${time} (${venue}). Entra en EQUIPOS y confirma SÍ o NO en 1 toque.`
                );
                alert(`✅ Convocatoria J${j} lanzada para ${team.name}. Toda la plantilla ya puede votar SÍ o NO.`);
                this.renderCaptainModal(teamId);
            } catch (err) {
                alert('❌ Error lanzando convocatoria: ' + err.message);
            }
        }

        async captainSetVote(teamId, playerName, status) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return;
            const j = (this.liveDataByTeam[teamId]?.jornada) || this._getTargetJornada(team);
            try {
                await svc.submitPlayerResponse(teamId, j, playerName, status, 'Marcado por capitán');
            } catch (err) {
                alert('Error actualizando estado: ' + err.message);
            }
        }

        async toggleStatus(teamId) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const j = convo.jornada || this._getTargetJornada(team);
            const nextStatus = convo.status === 'closed' ? 'open' : 'closed';
            try {
                await svc.setConvocatoriaStatus(teamId, j, nextStatus);
            } catch (err) {
                alert('Error cambiando estado: ' + err.message);
            }
        }

        async notifyPendingPlayers(teamId) {
            const team = this.teamsById[teamId];
            const convo = this.liveDataByTeam[teamId] || {};
            const { pending } = this._computeLists(team, convo);
            if (pending.length === 0) {
                alert('🎉 ¡Todos los jugadores del equipo ya han votado!');
                return;
            }
            const sent = await this._sendInAppNotificationToRoster(
                team,
                `⏳ Recordatorio convocatoria ${team.name} (J${convo.jornada || '1'})`,
                `Faltas por confirmar si vienes contra ${convo.opponent || 'el rival'}. Toca SÍ o NO en la sección EQUIPOS.`,
                pending
            );
            alert(`🔔 Recordatorio enviado a ${sent || pending.length} jugadores pendientes.`);
        }

        async _sendInAppNotificationToRoster(team, title, body, onlyNames = null, options = {}) {
            const db = window.db || (window.firebase && window.firebase.firestore && window.firebase.firestore());
            if (!db || !team) return 0;

            const seasonSvc = window.TeamSeasonService;
            const currentSeason = seasonSvc ? seasonSvc.getSeasonByIdSync(team.seasonId || seasonSvc.getSelectedSeasonId()) : null;
            const isDraftPilotMode = Boolean(options.pilotOnly || (currentSeason && currentSeason.status === 'draft'));

            const targetSet = new Set(
                (Array.isArray(onlyNames) ? onlyNames : (team.roster || []).map(p => typeof p === 'string' ? p : p.name))
                    .map(n => norm(n))
                    .filter(Boolean)
            );
            if (!isDraftPilotMode && targetSet.size === 0) return 0;

            const j = (this.liveDataByTeam[team.id]?.jornada) || this._getTargetJornada(team);
            const targetUrl = window.TeamConvocatoriaService
                ? window.TeamConvocatoriaService.generateShareUrl(team.id, j)
                : 'index.html#teams';

            try {
                const snap = await db.collection('players').get();
                let sent = 0;
                const nowIso = new Date().toISOString();

                for (const doc of snap.docs) {
                    const d = doc.data() || {};
                    const ph = this._normPhone(d.phone || d.telefono || d.whatsapp || doc.id);
                    const pn = norm(d.name || d.displayName);

                    let match = false;
                    if (isDraftPilotMode) {
                        // En modo borrador/piloto, SOLO enviar push real a 649219350 para no molestar a nadie
                        match = (ph === this.PILOT_PHONE) || pn.includes('coscolin');
                    } else if (pn) {
                        const parts = pn.split(/\s+/).filter(Boolean);
                        match = targetSet.has(pn);
                        if (!match && parts.length >= 2) {
                            for (const t of targetSet) {
                                if (t.includes(parts[0]) && t.includes(parts[1])) { match = true; break; }
                            }
                        }
                    }

                    if (match) {
                        // Esquema oficial idéntico a AdminNotifications.js para activar Cloud Function FCM Push + Campanita
                        await doc.ref.collection('notifications').add({
                            title,
                            body,
                            read: false,
                            timestamp: nowIso,
                            createdAt: nowIso,
                            icon: 'bullhorn',
                            type: 'team_convocatoria',
                            data: {
                                url: targetUrl,
                                teamId: team.id,
                                jornada: String(j)
                            }
                        });
                        sent++;
                    }
                }

                // Aviso inmediato del navegador / PWA si el propio dispositivo tiene permiso Notification concedido
                if (sent > 0 && isDraftPilotMode && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                            const reg = await navigator.serviceWorker.ready;
                            if (reg && typeof reg.showNotification === 'function') {
                                reg.showNotification(title, {
                                    body,
                                    icon: 'img/logo_somospadel.png',
                                    badge: 'img/badge_somospadel.png',
                                    data: { url: targetUrl }
                                });
                            }
                        }
                    } catch (swErr) {}
                }

                return sent;
            } catch (err) {
                console.warn('⚠️ [TeamConvocatoriaProUI] Aviso enviando notificaciones push:', err.message);
                return 0;
            }
        }

        async sendPilotPushToMe(teamId) {
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const j = convo.jornada || this._getTargetJornada(team);
            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const opp = (!isPlaceholder(convo.opponent) ? convo.opponent : null) || match?.opponent || 'Rival de jornada';
            const date = (!isPlaceholder(convo.date) ? convo.date : null) || match?.date || 'Este fin de semana';

            const sent = await this._sendInAppNotificationToRoster(
                team,
                `🎾 Convocatoria ${team.name} (J${j})`,
                `Tienes partido vs ${opp} (${date}). ¡Confirma SÍ o NO en 1 toque! Es súper importante para que tu capitán cierre las parejas y todo fluya 💪`,
                null,
                { pilotOnly: true }
            );
            this._showToast(
                sent > 0
                    ? `📱 Push + campanita enviados a tu cuenta (649219350).`
                    : `⚠️ No se encontró tu documento en players (649219350) o faltan permisos Firestore.`,
                sent > 0 ? 'success' : 'warn'
            );
        }

        // ============================================================
        // 🪟 POP-UP SEMANAL INTELIGENTE (SOLO 1 VEZ POR CONVOCATORIA)
        // ============================================================

        async checkAndShowWeeklyConvoPopup({ force = false } = {}) {
            const seasonSvc = window.TeamSeasonService;
            const convoSvc = window.TeamConvocatoriaService;
            const user = this._getAuthUser();
            if (!seasonSvc || !convoSvc || !user) return;

            const seasons = await seasonSvc.getSeasons();
            // Priorizar temporada activa; si aún está en borrador 2027, permitirla SOLO para la cuenta piloto 649219350
            let targetSeason = seasons.find(s => s.status === 'active');
            if (!targetSeason) {
                const draft2027 = seasons.find(s => String(s.id) === '2027' && s.status === 'draft');
                if (draft2027 && this.isPilotUser()) {
                    targetSeason = draft2027;
                }
            }
            if (!targetSeason) return;

            const seasonTeams = await seasonSvc.getSeasonTeams(targetSeason.id);
            if (!Array.isArray(seasonTeams) || seasonTeams.length === 0) return;

            // Detectar todos los equipos del usuario en esa temporada (funciona también desde INICIO)
            const myMatches = this._detectMyTeamsIndependent(seasonTeams);
            if (!myMatches || myMatches.length === 0) return;

            const allCards = [];
            let hasUnseenPending = false;

            for (const entry of myMatches) {
                const team = entry.team || entry;
                if (!team || !team.id) continue;
                this.teamsById[team.id] = team;
                const j = this._getTargetJornada(team);
                const convoId = convoSvc.normalizeId(team.id, j, targetSeason.id);
                const votedKey = `sp_convo_voted_v2_${convoId}`;
                const sessionKey = `sp_convo_session_v2_${convoId}`;

                let convoData = this.liveDataByTeam[team.id];
                if (!convoData) {
                    try {
                        convoData = await convoSvc.getConvocatoria(team.id, j, targetSeason.id);
                    } catch (e) {
                        convoData = null;
                    }
                }
                if (convoData && convoData.status === 'closed') continue;

                const { myStatus, available } = this._computeLists(team, convoData);
                const needed = Number(convoData?.neededPlayers || convoData?.targetCount || 6);

                // Si el jugador aún no ha votado en este equipo y no ha descartado el pop-up en esta sesión
                if (!myStatus && sessionStorage.getItem(sessionKey) !== 'dismissed') {
                    hasUnseenPending = true;
                }

                const match = this._getNextMatch(team);
                const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
                allCards.push({
                    team,
                    seasonId: targetSeason.id,
                    j,
                    convoId,
                    votedKey,
                    sessionKey,
                    myStatus,
                    confirmedCount: available.length,
                    needed,
                    opponent: (!isPlaceholder(convoData?.opponent) ? convoData.opponent : null) || match?.opponent || 'Rival de la jornada',
                    date: (!isPlaceholder(convoData?.date) ? convoData.date : null) || match?.date || 'Este fin de semana',
                    time: (!isPlaceholder(convoData?.time) ? convoData.time : null) || match?.time || '',
                    venue: (!isPlaceholder(convoData?.venue) ? convoData.venue : null) || match?.location || match?.venue || 'Sede oficial'
                });
            }

            // Mostrar siempre la píldora flotante en INICIO/app si queda algún equipo pendiente de votar
            this._renderHomeFloatingReminder(allCards);

            // Auto-desplegar en INICIO siempre que quede algún equipo pendiente sin votar (o si es force)
            const currentRoute = window.Router?.currentRoute || '';
            const isOnHome = !currentRoute || currentRoute === 'dashboard';
            console.log(`📢 [WeeklyPopup] Temporada ${targetSeason.id} | Equipos: ${allCards.length} | Pendientes: ${hasUnseenPending} | En INICIO: ${isOnHome} | Force: ${force}`);
            if (allCards.length === 0 || (!force && (!hasUnseenPending || !isOnHome))) return;

            // Mostrar primero los equipos pendientes de votar y luego los ya votados
            allCards.sort((a, b) => (a.myStatus ? 1 : 0) - (b.myStatus ? 1 : 0));
            this._weeklyPopupCards = allCards;
            this.renderWeeklyConvoPopup();
        }

        renderWeeklyConvoPopup() {
            const cards = this._weeklyPopupCards || [];
            if (cards.length === 0) return;

            let overlay = document.getElementById('tp-weekly-convo-popup');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'tp-weekly-convo-popup';
                overlay.className = 'tp-cp-modal-overlay';
                overlay.style.alignItems = 'center';
                overlay.style.backdropFilter = 'blur(8px)';
                overlay.style.background = 'rgba(2, 6, 23, 0.82)';
                overlay.onclick = (e) => { if (e.target === overlay) this.dismissWeeklyPopup(); };
                document.body.appendChild(overlay);
            }

            const answeredCount = cards.filter(c => Boolean(c.myStatus)).length;
            const pendingCount = cards.length - answeredCount;
            const progressPct = Math.round((answeredCount / cards.length) * 100);

            overlay.innerHTML = `
                <div class="tp-cp-modal-card tp-wk-card" onclick="event.stopPropagation()">
                    <div class="tp-wk-head">
                        <div class="tp-wk-top-bar">
                            <div class="tp-wk-pill" style="margin-bottom:0;">
                                <span class="tp-wk-pill-dot"></span>
                                MATCHDAY · ${cards.length} ${cards.length === 1 ? 'EQUIPO' : 'EQUIPOS'}
                            </div>
                            <button type="button" class="tp-wk-close" aria-label="Cerrar" onclick="window.TeamConvocatoriaProUI.dismissWeeklyPopup()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <div class="tp-wk-hero-logo">
                            <img src="img/logo_somospadel.png?v=61.0" alt="SomosPádel BCN">
                        </div>
                        <div class="tp-wk-brand-tag" style="position:relative;z-index:2;margin-bottom:7px;opacity:0.8;">SOMOSPÁDEL BCN · EQUIPOS</div>

                        <h3 class="tp-wk-title">¿Juegas esta semana? <span>Confirma en 1 toque</span></h3>
                        <p class="tp-wk-sub">
                            Tu respuesta ayuda al capitán a <strong>cerrar las parejas a tiempo</strong> y salir a ganar.
                        </p>

                        <div class="tp-wk-progress-wrap">
                            <span class="tp-wk-progress-txt">${pendingCount === 0 ? 'Todo confirmado' : `${pendingCount} ${pendingCount === 1 ? 'equipo pendiente' : 'equipos pendientes'}`}</span>
                            <div class="tp-wk-progress-bar">
                                <div class="tp-wk-progress-fill" style="width:${progressPct}%;"></div>
                            </div>
                            <span class="tp-wk-progress-txt">${answeredCount}/${cards.length}</span>
                        </div>
                    </div>

                    <div class="tp-wk-body">
                        ${cards.map((c, idx) => {
                            const isFull = c.confirmedCount >= c.needed;
                            const th = this._getTeamTheme(c.team, idx);
                            const themeStyle = `--wk-accent:${th.accent};--wk-grad:${th.grad};--wk-soft:${th.soft};--wk-soft2:${th.soft2};--wk-border:${th.border};--wk-ink:${th.ink};`;
                            return `
                            <div class="tp-wk-team-box ${c.myStatus === 'available' ? 'voted' : (c.myStatus === 'unavailable' ? 'voted-no' : '')}" style="${themeStyle}">
                                <div class="tp-wk-team-top">
                                    <div style="min-width:0;">
                                        <div class="tp-wk-team-eyebrow">
                                            <span class="tp-wk-j-pill">JORNADA ${esc(c.j)}</span>
                                            <span class="tp-wk-cat-pill"><i class="fas ${th.icon}"></i> ${th.label}</span>
                                        </div>
                                        <div class="tp-wk-team-name">${esc(c.team.name)}</div>
                                    </div>
                                    <span class="tp-wk-count ${isFull ? 'full' : ''}">
                                        <i class="fas fa-users" style="font-size:0.62rem;"></i> ${c.confirmedCount}/${c.needed}
                                    </span>
                                </div>

                                <div class="tp-wk-match-line">
                                    <span class="tp-wk-vs-badge">VS</span>
                                    <span class="tp-wk-opp-name">${esc(c.opponent)}</span>
                                </div>

                                <div class="tp-wk-meta-chips">
                                    <span class="tp-wk-meta-chip date"><i class="far fa-calendar-alt"></i> ${esc(c.date)}${c.time ? ' · ' + esc(c.time) : ''}</span>
                                    <span class="tp-wk-meta-chip venue"><i class="fas fa-map-marker-alt"></i> ${esc(c.venue)}</span>
                                </div>

                                <div class="tp-cp-vote-row">
                                    <button type="button"
                                            class="tp-cp-vote-btn yes ${c.myStatus === 'available' ? 'selected' : ''}"
                                            onclick="window.TeamConvocatoriaProUI.voteFromWeeklyPopup('${esc(c.team.id)}', '${esc(c.j)}', 'available')">
                                        <i class="fas fa-check-circle"></i> SÍ, VOY
                                    </button>
                                    <button type="button"
                                            class="tp-cp-vote-btn no ${c.myStatus === 'unavailable' ? 'selected' : ''}"
                                            onclick="window.TeamConvocatoriaProUI.voteFromWeeklyPopup('${esc(c.team.id)}', '${esc(c.j)}', 'unavailable')">
                                        <i class="fas fa-times-circle"></i> NO PUEDO
                                    </button>
                                </div>
                                <div class="tp-cp-vote-clear-wrap" style="margin-top:7px;">
                                    <button type="button"
                                            class="tp-cp-vote-btn pending ${!c.myStatus ? 'selected' : ''}"
                                            onclick="window.TeamConvocatoriaProUI.voteFromWeeklyPopup('${esc(c.team.id)}', '${esc(c.j)}', 'pending')">
                                        <i class="fas fa-clock"></i> SIN VOTAR
                                    </button>
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>

                    <div class="tp-wk-foot">
                        <button type="button" class="tp-wk-later" onclick="window.TeamConvocatoriaProUI.dismissWeeklyPopup()">
                            Recordármelo más tarde
                        </button>
                    </div>
                </div>
            `;
            overlay.style.display = 'flex';
        }

        async voteFromWeeklyPopup(teamId, jornada, status) {
            const cards = this._weeklyPopupCards || [];
            const card = cards.find(c => c.team.id === teamId);
            const seasonId = (card && card.seasonId) || '2027';

            if (status === 'pending') {
                await this.clearVote(teamId, seasonId, jornada);
                if (card) {
                    if (card.myStatus === 'available') card.confirmedCount = Math.max(0, card.confirmedCount - 1);
                    card.myStatus = null;
                    try {
                        localStorage.removeItem(card.votedKey);
                    } catch (e) {}
                }
                this._renderHomeFloatingReminder(cards);
                this.renderWeeklyConvoPopup();
                return;
            }

            await this.vote(teamId, status, seasonId, jornada);
            if (card) {
                const prev = card.myStatus;
                card.myStatus = status;
                if (status === 'available' && prev !== 'available') card.confirmedCount++;
                else if (status !== 'available' && prev === 'available') card.confirmedCount = Math.max(0, card.confirmedCount - 1);
                try {
                    localStorage.setItem(card.votedKey, status);
                    sessionStorage.setItem(card.sessionKey, 'voted');
                } catch (e) {}
            }
            this._renderHomeFloatingReminder(cards);
            this.renderWeeklyConvoPopup();

            // Si ya votó en todos los equipos mostrados, cerrar automáticamente tras 900ms
            if (cards.length > 0 && cards.every(c => Boolean(c.myStatus))) {
                setTimeout(() => this.dismissWeeklyPopup(), 900);
            }
        }

        dismissWeeklyPopup() {
            const cards = this._weeklyPopupCards || [];
            cards.forEach(c => {
                try {
                    sessionStorage.setItem(c.sessionKey, c.myStatus ? 'voted' : 'dismissed');
                    if (c.myStatus) localStorage.setItem(c.votedKey, c.myStatus);
                } catch (e) {}
            });
            const overlay = document.getElementById('tp-weekly-convo-popup');
            if (overlay) overlay.style.display = 'none';
        }

        setCaptainFilter(filter) {
            this.captainFilter = filter || 'all';
            if (this.activeCaptainModalTeamId) this.renderCaptainModal(this.activeCaptainModalTeamId);
        }

        setCaptainSearch(val) {
            this.captainSearch = val || '';
            if (this.activeCaptainModalTeamId) this.renderCaptainModal(this.activeCaptainModalTeamId);
        }

        _buildWhatsAppMessage(teamId) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return '';
            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const j = convo.jornada || this._getTargetJornada(team);
            const opponent = (!isPlaceholder(convo.opponent) ? convo.opponent : null) || match?.opponent || 'Próximo rival';
            const date = (!isPlaceholder(convo.date) ? convo.date : null) || match?.date || 'Por confirmar';
            const time = (!isPlaceholder(convo.time) ? convo.time : null) || match?.time || '';
            const venue = (!isPlaceholder(convo.venue) ? convo.venue : null) || match?.location || match?.venue || 'Sede oficial';
            const needed = Number(convo.neededPlayers || convo.targetCount || 6);
            const { available, unavailable, pending } = this._computeLists(team, convo);
            const url = svc.generateShareUrl(teamId, j);

            return (
                `🎾 *CONVOCATORIA OFICIAL — ${team.name}*\n` +
                `🏆 *JORNADA ${j}* ${convo.status === 'closed' ? '(CERRADA)' : '(ABIERTA)'}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🆚 *Rival:* ${opponent}\n` +
                `📅 *Fecha:* ${date}${time ? ' • ⏰ ' + time : ''}\n` +
                `📍 *Club:* ${venue}\n` +
                (convo.note ? `💬 *Nota:* ${convo.note}\n` : '') +
                `━━━━━━━━━━━━━━━━━━\n` +
                `✅ *VAN (${available.length}/${needed}):*\n` +
                (available.length ? available.map((n, i) => `${i + 1}. ${n}`).join('\n') : '• Nadie confirmado aún') +
                `\n\n❌ *NO PUEDEN (${unavailable.length}):* ${unavailable.length ? unavailable.join(', ') : '—'}\n` +
                `⏳ *FALTAN POR VOTAR (${pending.length}):* ${pending.length ? pending.join(', ') : '¡Todos han votado!'}\n\n` +
                `📲 *Vota SÍ o NO en 1 toque desde la App:*\n${url}`
            );
        }

        shareWhatsApp(teamId) {
            const text = this._buildWhatsAppMessage(teamId);
            if (!text) return;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            this._showToast('📲 Abriendo WhatsApp... elige el grupo de tu equipo y pulsa enviar.', 'success');
        }

        _buildLineupWhatsAppMessage(teamId) {
            const team = this.teamsById[teamId];
            if (!team) return '';
            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const j = convo.jornada || this._getTargetJornada(team);
            const opponent = (!isPlaceholder(convo.opponent) ? convo.opponent : null) || match?.opponent || 'Próximo rival';
            const date = (!isPlaceholder(convo.date) ? convo.date : null) || match?.date || 'Por confirmar';
            const time = (!isPlaceholder(convo.time) ? convo.time : null) || match?.time || '';
            const venue = (!isPlaceholder(convo.venue) ? convo.venue : null) || match?.location || match?.venue || 'Sede oficial';
            const { available } = this._computeLists(team, convo);
            const { draft } = this._getOrInitCaptainDraft(teamId, team, available);

            const fmtPts = (v) => Number.isInteger(Number(v || 0)) ? `${Number(v || 0)} pts` : `${Number(v || 0).toFixed(1)} pts`;
            const formatCourt = (medal, num, pair) => {
                const p1 = pair[0];
                const p2 = pair[1];
                const pts1 = p1 ? this._getPlayerLeaguePoints(team, p1) : 0;
                const pts2 = p2 ? this._getPlayerLeaguePoints(team, p2) : 0;
                const total = pts1 + pts2;
                const names = [
                    p1 ? `${p1} (${fmtPts(pts1)})` : 'Por definir',
                    p2 ? `${p2} (${fmtPts(pts2)})` : 'Por definir'
                ].join(' + ');
                return `${medal} *PISTA ${num}* (${fmtPts(total)}):\n   • ${names}`;
            };

            const courtsTxt = [
                formatCourt('🥇', 1, draft.p1),
                formatCourt('🥈', 2, draft.p2),
                formatCourt('🥉', 3, draft.p3)
            ].join('\n');

            const filledReserves = (draft.reserves || [])
                .map((name, idx) => ({ name, idx }))
                .filter(r => Boolean(r.name));

            const reservesTxt = filledReserves.length
                ? `\n\n📋 *RESERVAS (${filledReserves.length}):*\n` +
                  filledReserves.map((r, i) => `   R${i + 1}. ${r.name} (${fmtPts(this._getPlayerLeaguePoints(team, r.name))})`).join('\n')
                : '';

            return (
                `🏆 *CONVOCATORIA OFICIAL — ${team.name}*\n` +
                `📅 *JORNADA ${j}* vs *${opponent}*\n` +
                `⏰ ${date}${time ? ' • ' + time : ''} · 📍 ${venue}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `${courtsTxt}${reservesTxt}\n\n` +
                `💪 ¡A por la victoria, equipo!`
            );
        }

        shareLineupWhatsApp(teamId) {
            const text = this._buildLineupWhatsAppMessage(teamId);
            if (!text) return;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            this._showToast('📲 Abriendo WhatsApp con la convocatoria (Pistas + Reservas).', 'success');
        }

        copyLineupWhatsApp(teamId) {
            const text = this._buildLineupWhatsAppMessage(teamId);
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => this._showToast('✅ Convocatoria copiada. Pégalo en tu grupo de WhatsApp.', 'success'))
                    .catch(() => prompt('Copia la convocatoria:', text));
            } else {
                prompt('Copia la convocatoria:', text);
            }
        }

        copyWhatsAppText(teamId) {
            const text = this._buildWhatsAppMessage(teamId);
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => this._showToast('✅ Mensaje copiado. Pégalo directo en el grupo de WhatsApp del equipo.', 'success'))
                    .catch(() => prompt('Copia el mensaje para WhatsApp:', text));
            } else {
                prompt('Copia el mensaje para WhatsApp:', text);
            }
        }
    }

    global.TeamConvocatoriaProUI = new TeamConvocatoriaProUI();
    console.log('📢 [TeamConvocatoriaProUI] Módulo Convocatorias Pro inicializado.');
})(typeof window !== 'undefined' ? window : globalThis);
