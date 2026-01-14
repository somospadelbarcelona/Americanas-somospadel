/**
 * admin.js
 * Core Admin Logic: Authentication, Navigation, and Bootstrapping.
 * Stripped of specific view logic (delegated to modules).
 */

console.log("🚀 Admin JS Loading...");

// --- GLOBAL HELPERS ---
window.calculateMatchTime = (startTime, roundNum) => {
    if (!startTime) return "00:00";
    try {
        const [h, m] = startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        // Each round +20 mins
        date.setMinutes(date.getMinutes() + (roundNum - 1) * 20);
        return date.getHours().toString().padStart(2, '0') + ":" +
            date.getMinutes().toString().padStart(2, '0');
    } catch (e) { return startTime; }
};

// --- AUTHENTICATION ---
window.AdminAuth = {
    token: localStorage.getItem('adminToken'),
    user: (() => {
        try {
            const s = localStorage.getItem('adminUser') || localStorage.getItem('currentUser');
            return JSON.parse(s || 'null');
        } catch (e) { return null; }
    })(),

    hasAdminRole(role) {
        if (!role) return false;
        const r = role.toString().toLowerCase().trim();
        return ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes'].includes(r);
    },

    async init() {
        console.log("🛠️ AdminAuth Init");
        const modal = document.getElementById('admin-auth-modal');
        const isAdmin = this.user && this.hasAdminRole(this.user.role);

        if (isAdmin) {
            console.log("💎 Active Session:", this.user.name);
            if (modal) modal.style.display = 'none';
            if (window.loadAdminView) setTimeout(() => window.loadAdminView('users'), 100);
            this.updateProfileUI();
        } else {
            console.log("🔒 Waiting for PIN...");
            if (localStorage.getItem('admin_remember_pin')) {
                await this.login(localStorage.getItem('admin_remember_pin'), true);
            }
        }
    },

    async login(pin, isAuto = false) {
        const ACCESS_CODES = {
            '212121': { role: 'super_admin', name: 'Super Admin' },
            '501501': { role: 'admin', name: 'Admin' },
            '262524': { role: 'captain', name: 'Capitán' }
        };

        try {
            if (!isAuto) await new Promise(r => setTimeout(r, 600));

            if (ACCESS_CODES[pin]) {
                const user = { ...ACCESS_CODES[pin], status: 'active', lastLogin: new Date().toISOString() };
                this.setUser(user);
            } else {
                throw new Error("CÓDIGO INCORRECTO");
            }
        } catch (e) {
            alert(e.message);
        }
    },

    setUser(user) {
        this.user = user;
        localStorage.setItem('adminUser', JSON.stringify(user));
        document.getElementById('admin-auth-modal').style.display = 'none';
        this.updateProfileUI();
        window.loadAdminView('users');
    },

    logout() {
        localStorage.removeItem('adminUser');
        location.reload();
    },

    updateProfileUI() {
        if (!this.user) return;
        const nameEl = document.getElementById('admin-name');
        const avEl = document.getElementById('admin-avatar');
        if (nameEl) nameEl.textContent = this.user.name;
        if (avEl) avEl.textContent = this.user.name.charAt(0);
    }
};

// --- NAVIGATION ROUTER ---
window.loadAdminView = async function (viewName) {
    console.log("Navigate to:", viewName);

    // Sidebar Active State
    document.querySelectorAll('.nav-item-pro').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item-pro[data-view="${viewName}"]`)?.classList.add('active');

    // Close Mobile Menu
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');

    const content = document.getElementById('content-area');
    if (content) content.innerHTML = '<div class="loader"></div>';

    // ROUTING TABLE
    try {
        if (viewName === 'users' && window.AdminViews.users) {
            await window.AdminViews.users();
        }
        else if (viewName === 'americanas_mgmt' && window.AdminViews.americanas_mgmt) {
            await window.AdminViews.americanas_mgmt();
        }
        else if (viewName === 'entrenos_mgmt' && window.AdminViews.entrenos_mgmt) {
            await window.AdminViews.entrenos_mgmt();
        }
        else if (viewName === 'matches') {
            // "Resultados Americanas" loads the Generic Results View for Americanas
            if (window.loadResultsView) await window.loadResultsView('americana');
            else throw new Error("Results Module not loaded");
        }
        else if (viewName === 'entrenos_results') {
            if (window.loadResultsView) await window.loadResultsView('entreno');
            else throw new Error("Results Module not loaded");
        }
        else if (viewName === 'config' && window.AdminViews.config) {
            await window.AdminViews.config(); // Assuming legacy config exists or imported
        }
        else if (viewName === 'menu_mgmt' && window.AdminViews.menu_mgmt) {
            await window.AdminViews.menu_mgmt();
        }
        else {
            // Fallback for Simulator or others not yet refactored logic
            if (window.AdminViews && window.AdminViews[viewName]) {
                await window.AdminViews[viewName]();
            } else {
                content.innerHTML = `<div style="padding:2rem; text-align:center;">🚧 Módulo ${viewName} en construcción o no encontrado.</div>`;
            }
        }
    } catch (e) {
        console.error("View Load Error:", e);
        if (content) content.innerHTML = `<div class="error-box">Error UI: ${e.message}</div>`;
    }
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    window.AdminAuth.init();
});
