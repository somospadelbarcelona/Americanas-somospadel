/**
 * FeasibilityValidator.js
 * Validador combinatorio de viabilidad matemática a priori.
 *
 * Analiza el espacio de soluciones antes de ejecutar cualquier algoritmo CSP.
 * Si una configuración es matemáticamente imposible, devuelve un error explícito
 * con la demostración matemática formal y bloquea la generación.
 *
 * Compatible con Node.js y navegadores.
 */

(function () {
    'use strict';

    class FeasibilityValidator {

        /**
         * Valida de manera exhaustiva la viabilidad matemática de un torneo o ronda.
         *
         * @param {object} config
         * @param {Array<object>|number} config.players - Lista de jugadores o conteo
         * @param {number} config.courts - Número de pistas físicas disponibles
         * @param {number} [config.rounds] - Número total de rondas proyectadas (opcional)
         * @param {string} [config.mode] - 'clasica' | 'mexicana' | 'mixta' | 'pozo' | 'rey_pista' | 'entreno_rotaciones' | 'entreno_niveles' | 'entreno_libre'
         * @param {boolean} [config.hardNoRepeatPartner=false] - Exigencia estricta de 0 parejas repetidas
         * @param {boolean} [config.hardNoRepeatOpponent=false] - Exigencia estricta de 0 rivales repetidos
         * @param {boolean} [config.noByesAllowed=false] - Exigencia de no tener descansos
         * @returns {{ valid: boolean, errors: Array<string>, warnings: Array<string>, metrics: object }}
         */
        static validate(config = {}) {
            const errors = [];
            const warnings = [];

            // 1. Normalización de jugadores
            let playersList = [];
            let totalPlayers = 0;

            if (Array.isArray(config.players)) {
                playersList = config.players;
                totalPlayers = config.players.length;
            } else if (typeof config.players === 'number') {
                totalPlayers = config.players;
            }

            const courts = parseInt(config.courts || 0, 10);
            const rounds = parseInt(config.rounds || 1, 10);
            const mode = String(config.mode || 'clasica').toLowerCase();
            const hardNoRepeatPartner = !!config.hardNoRepeatPartner;
            const hardNoRepeatOpponent = !!config.hardNoRepeatOpponent;
            const noByesAllowed = !!config.noByesAllowed;

            // 2. Comprobaciones elementales
            if (courts < 1) {
                errors.push(`Configuración matemáticamente imposible: Se requiere al menos 1 pista disponible (recibido: ${courts}).`);
            }

            if (totalPlayers < 4) {
                errors.push(`Configuración matemáticamente imposible: Se requieren al menos 4 jugadores para formar un partido de pádel (recibido: ${totalPlayers}).`);
            }

            // Si ya hay errores elementales, retornar inmediatamente
            if (errors.length > 0) {
                return { valid: false, errors, warnings, metrics: { totalPlayers, courts, rounds } };
            }

            // 3. Métricas de ocupación y descansos
            const maxCourtsByPlayers = Math.floor(totalPlayers / 4);
            const effectiveCourts = Math.min(courts, maxCourtsByPlayers);
            const activePlayersPerRound = effectiveCourts * 4;
            const byesPerRound = totalPlayers - activePlayersPerRound;

            if (effectiveCourts < 1) {
                errors.push(`Configuración matemáticamente imposible: Con ${totalPlayers} jugadores y ${courts} pistas, no se puede completar ni una sola pista de 4 jugadores.`);
                return { valid: false, errors, warnings, metrics: { totalPlayers, courts, rounds } };
            }

            if (noByesAllowed && byesPerRound > 0) {
                errors.push(`Configuración matemáticamente imposible: Se exigió jugar sin descansos (noByesAllowed), pero ${totalPlayers} jugadores no es divisible entre 4 (sobran ${byesPerRound} jugadores por ronda).`);
            }

            if (courts > maxCourtsByPlayers) {
                warnings.push(`Pistas sobredimensionadas: Se disponen de ${courts} pistas, pero ${totalPlayers} jugadores solo pueden ocupar ${maxCourtsByPlayers} pista(s) simultáneamente.`);
            }

            // 4. Verificaciones combinatorias de repetición de pareja (Hard Constraint)
            // Límite Teórico: Un jugador solo puede tener N - 1 compañeros distintos en todo el torneo.
            const maxTheoreticalUniquePartners = totalPlayers - 1;

            if (hardNoRepeatPartner && rounds > maxTheoreticalUniquePartners) {
                errors.push(`Configuración matemáticamente imposible: Se solicitaron ${rounds} rondas con restricción estricta de NO repetir pareja para ${totalPlayers} jugadores, pero el límite combinatorio máximo absoluto de compañeros únicos por jugador es ${maxTheoreticalUniquePartners}.`);
            }

            // 5. Verificaciones específicas de Americana Mixta
            if (mode === 'mixta' || mode === 'americana_mixta') {
                const getGender = (p) => {
                    const g = String(p.gender || p.sex || '').trim().toLowerCase();
                    if (g.startsWith('m') || g === 'hombre' || g === 'masculino' || g === 'chico') return 'M';
                    if (g.startsWith('f') || g === 'mujer' || g === 'femenino' || g === 'chica') return 'F';
                    return 'UNKNOWN';
                };

                let menCount = 0;
                let womenCount = 0;
                let unknownCount = 0;

                if (playersList.length > 0) {
                    playersList.forEach(p => {
                        const g = getGender(p);
                        if (g === 'M') menCount++;
                        else if (g === 'F') womenCount++;
                        else unknownCount++;
                    });
                } else if (config.menCount !== undefined && config.womenCount !== undefined) {
                    menCount = parseInt(config.menCount, 10);
                    womenCount = parseInt(config.womenCount, 10);
                }

                // Si conocemos el desglose de género:
                if (menCount > 0 || womenCount > 0) {
                    if (menCount < 2 || womenCount < 2) {
                        errors.push(`Configuración matemáticamente imposible: Americana Mixta requiere un mínimo de 2 hombres y 2 mujeres para disputar al menos 1 pista (recibido: ${menCount} hombres, ${womenCount} mujeres).`);
                    }

                    const maxMixedCourtsPossible = Math.min(courts, Math.floor(menCount / 2), Math.floor(womenCount / 2));
                    if (maxMixedCourtsPossible < 1) {
                        errors.push(`Configuración matemáticamente imposible: No hay suficientes hombres (${menCount}) o mujeres (${womenCount}) para formar 1 pista de pádel mixto (2H + 2M).`);
                    }

                    // Exigencia sin descansos en mixta:
                    if (noByesAllowed && menCount !== womenCount) {
                        errors.push(`Configuración matemáticamente imposible: Americana Mixta sin descansos requiere paridad exacta entre hombres y mujeres (recibido: ${menCount} hombres vs ${womenCount} mujeres).`);
                    }

                    // Límite de rondas únicas en mixta:
                    // Un hombre solo puede emparejarse con mujeres (máximo womenCount parejas únicas)
                    // Una mujer solo puede emparejarse con hombres (máximo menCount parejas únicas)
                    const maxMixedRoundsWithoutRepeat = Math.min(menCount, womenCount);
                    if (hardNoRepeatPartner && rounds > maxMixedRoundsWithoutRepeat) {
                        errors.push(`Configuración matemáticamente imposible: En Americana Mixta con ${menCount} hombres y ${womenCount} mujeres, el número máximo combinatorio de rondas sin repetir pareja es ${maxMixedRoundsWithoutRepeat}. Se solicitaron ${rounds} rondas.`);
                    }
                }
            }

            // 6. Verificaciones de Parejas Fijas (Fixed Pairs)
            if (mode === 'fija' || mode === 'fixed' || mode === 'fixed_pairs') {
                const fixedPairsCount = config.fixedPairsCount !== undefined
                    ? parseInt(config.fixedPairsCount, 10)
                    : Math.floor(totalPlayers / 2);

                if (fixedPairsCount < 2) {
                    errors.push(`Configuración matemáticamente imposible: Se requieren al menos 2 parejas completas (4 jugadores) para formar un partido de parejas fijas.`);
                }

                const maxOpponentPairs = fixedPairsCount - 1;
                if (hardNoRepeatOpponent && rounds > maxOpponentPairs) {
                    errors.push(`Configuración matemáticamente imposible: En torneo de parejas fijas con ${fixedPairsCount} parejas, cada pareja solo puede enfrentar a un máximo de ${maxOpponentPairs} parejas rivales distintas. Se solicitaron ${rounds} rondas sin repetir rival.`);
                }
            }

            const metrics = {
                totalPlayers,
                courts,
                effectiveCourts,
                activePlayersPerRound,
                byesPerRound,
                rounds,
                maxTheoreticalUniquePartners
            };

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                metrics
            };
        }

        /**
         * Lanza una excepción si la configuración es matemáticamente inviable.
         */
        static assertFeasible(config = {}) {
            const result = FeasibilityValidator.validate(config);
            if (!result.valid) {
                const mainMsg = result.errors.join(' | ');
                const err = new Error(mainMsg);
                err.feasibilityErrors = result.errors;
                err.feasibilityWarnings = result.warnings;
                err.metrics = result.metrics;
                throw err;
            }
            return result;
        }
    }

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FeasibilityValidator };
    }
    if (typeof window !== 'undefined') {
        window.FeasibilityValidator = FeasibilityValidator;
    }
})();
