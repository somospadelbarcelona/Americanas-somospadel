/**
 * AchievementsService.js (Proxy / Alias en Players Module)
 * Redirige o provee acceso transparente al motor oficial de AchievementsService.
 */
(function (global) {
    'use strict';
    let service = (typeof global !== 'undefined' && global.AchievementsService) ? global.AchievementsService : null;
    if (!service && typeof require === 'function') {
        try {
            service = require('../stats/AchievementsService.js');
        } catch (e) {
            // Entorno de navegador sin bundler
        }
    }
    if (service && typeof global !== 'undefined' && !global.AchievementsService) {
        global.AchievementsService = service;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = service || (typeof global !== 'undefined' ? global.AchievementsService : null);
    }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

