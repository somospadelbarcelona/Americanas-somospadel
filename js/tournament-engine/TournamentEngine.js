/**
 * TournamentEngine.js
 * Fachada Unificada y Registro Extensible de Modalidades de Pádel.
 * Punto de entrada único para validación matemática previa y generación de rondas.
 *
 * Compatible con Node.js y navegadores.
 */

(function () {
    'use strict';

    // Dependencias
    let DecisionLoggerModule, ConstraintsModule, FeasibilityModule, SolverModule;
    let ClasicaModule, MexicanaModule, MixtaModule, ReyPistaModule, PozoModule, TwisterModule;
    let EntrenoRotacionesModule, EntrenoNivelesModule, EntrenoLibreModule;

    if (typeof require !== 'undefined') {
        try {
            DecisionLoggerModule = require('./DecisionLogger');
            ConstraintsModule = require('./TournamentConstraints');
            FeasibilityModule = require('./FeasibilityValidator');
            SolverModule = require('./TournamentSolver');
            ClasicaModule = require('./modes/AmericanaClasicaMode');
            MexicanaModule = require('./modes/AmericanaMexicanaMode');
            MixtaModule = require('./modes/AmericanaMixtaMode');
            ReyPistaModule = require('./modes/ReyDeLaPistaMode');
            PozoModule = require('./modes/PozoAmericanoMode');
            TwisterModule = require('./modes/AmericanaTwisterMode');
            EntrenoRotacionesModule = require('./modes/EntrenoRotacionesMode');
            EntrenoNivelesModule = require('./modes/EntrenoNivelesMode');
            EntrenoLibreModule = require('./modes/EntrenoLibreMode');
        } catch (e) { }
    }

    const DecisionLogger = DecisionLoggerModule?.DecisionLogger ||
        (typeof window !== 'undefined' ? window.DecisionLogger : null);
    const TournamentConstraints = ConstraintsModule?.TournamentConstraints ||
        (typeof window !== 'undefined' ? window.TournamentConstraints : null);
    const FeasibilityValidator = FeasibilityModule?.FeasibilityValidator ||
        (typeof window !== 'undefined' ? window.FeasibilityValidator : null);
    const TournamentSolver = SolverModule?.TournamentSolver ||
        (typeof window !== 'undefined' ? window.TournamentSolver : null);

    const AmericanaClasicaMode = ClasicaModule?.AmericanaClasicaMode ||
        (typeof window !== 'undefined' ? window.AmericanaClasicaMode : null);
    const AmericanaMexicanaMode = MexicanaModule?.AmericanaMexicanaMode ||
        (typeof window !== 'undefined' ? window.AmericanaMexicanaMode : null);
    const AmericanaMixtaMode = MixtaModule?.AmericanaMixtaMode ||
        (typeof window !== 'undefined' ? window.AmericanaMixtaMode : null);
    const ReyDeLaPistaMode = ReyPistaModule?.ReyDeLaPistaMode ||
        (typeof window !== 'undefined' ? window.ReyDeLaPistaMode : null);
    const PozoAmericanoMode = PozoModule?.PozoAmericanoMode ||
        (typeof window !== 'undefined' ? window.PozoAmericanoMode : null);
    const AmericanaTwisterMode = TwisterModule?.AmericanaTwisterMode ||
        (typeof window !== 'undefined' ? window.AmericanaTwisterMode : null);
    const EntrenoRotacionesMode = EntrenoRotacionesModule?.EntrenoRotacionesMode ||
        (typeof window !== 'undefined' ? window.EntrenoRotacionesMode : null);
    const EntrenoNivelesMode = EntrenoNivelesModule?.EntrenoNivelesMode ||
        (typeof window !== 'undefined' ? window.EntrenoNivelesMode : null);
    const EntrenoLibreMode = EntrenoLibreModule?.EntrenoLibreMode ||
        (typeof window !== 'undefined' ? window.EntrenoLibreMode : null);

    class TournamentEngine {
        constructor() {
            this.modes = new Map();
            this._registerDefaultModes();
        }

        _registerDefaultModes() {
            if (AmericanaClasicaMode) {
                const clasica = new AmericanaClasicaMode();
                this.registerMode(clasica);
                this.modes.set('americana_clasica', clasica);
                this.modes.set('clasica', clasica);
            }
            if (AmericanaMexicanaMode) {
                const mexicana = new AmericanaMexicanaMode();
                this.registerMode(mexicana);
                this.modes.set('americana_mexicana', mexicana);
                this.modes.set('swiss', mexicana);
                this.modes.set('suizo', mexicana);
            }
            if (AmericanaMixtaMode) {
                const mixta = new AmericanaMixtaMode();
                this.registerMode(mixta);
                this.modes.set('americana_mixta', mixta);
                this.modes.set('mixed', mixta);
            }
            if (ReyDeLaPistaMode) {
                const rey = new ReyDeLaPistaMode();
                this.registerMode(rey);
                this.modes.set('rey_de_la_pista', rey);
                this.modes.set('king_of_court', rey);
            }
            if (PozoAmericanoMode) {
                const pozo = new PozoAmericanoMode();
                this.registerMode(pozo);
                this.modes.set('pozo_americano', pozo);
                this.modes.set('pozo', pozo);
            }
            if (AmericanaTwisterMode) {
                const twister = new AmericanaTwisterMode();
                this.registerMode(twister);
                this.modes.set('twister', twister);
                this.modes.set('twister_clasico', twister);
                this.modes.set('rotating', twister);
                this.modes.set('rotativa', twister);
            }
            if (EntrenoRotacionesMode) {
                const entrenoRot = new EntrenoRotacionesMode();
                this.registerMode(entrenoRot);
                this.modes.set('entreno', entrenoRot);
            }
            if (EntrenoNivelesMode) {
                const entrenoNiv = new EntrenoNivelesMode();
                this.registerMode(entrenoNiv);
            }
            if (EntrenoLibreMode) {
                const entrenoLib = new EntrenoLibreMode();
                this.registerMode(entrenoLib);
            }
        }

        /**
         * Registra una modalidad personalizada o extiende el motor.
         */
        registerMode(modeInstance) {
            if (!modeInstance || !modeInstance.getId) {
                throw new Error("La modalidad a registrar debe ser una instancia de BaseTournamentMode.");
            }
            this.modes.set(modeInstance.getId().toLowerCase(), modeInstance);
        }

        /**
         * Resuelve una modalidad por su identificador o alias.
         */
        getMode(modeId) {
            if (!modeId) return this.modes.get('clasica');
            const clean = String(modeId).trim().toLowerCase();
            return this.modes.get(clean) || this.modes.get('clasica');
        }

        listModes() {
            const list = [];
            const seen = new Set();
            this.modes.forEach(mode => {
                if (!seen.has(mode.getId())) {
                    seen.add(mode.getId());
                    list.push({
                        id: mode.getId(),
                        name: mode.getName(),
                        description: mode.getDescription()
                    });
                }
            });
            return list;
        }

        /**
         * Valida de manera exhaustiva la viabilidad matemática previa de la configuración.
         *
         * @param {object} config
         * @returns {{ valid: boolean, errors: Array<string>, warnings: Array<string>, metrics: object }}
         */
        validateConfig(config = {}) {
            const modeInstance = this.getMode(config.mode || config.pair_mode);
            return modeInstance.validateFeasibility(config);
        }

        /**
         * Alias para validación de viabilidad previa.
         */
        validateFeasibility(config = {}) {
            return this.validateConfig(config);
        }

        /**
         * Genera una ronda matemáticamente coherente y optimizada.
         *
         * @param {object} params
         * @param {Array<object>} params.players - Jugadores
         * @param {number} params.courts - Pistas disponibles
         * @param {number} [params.roundNum=1] - Número de ronda
         * @param {string} [params.mode='clasica'] - Modalidad
         * @param {Array<object>} [params.matchesHistory=[]] - Partidos de rondas previas
         * @param {object} [params.options={}] - Opciones de configuración
         * @param {object} [params.logger=null] - Instancia personalizada de DecisionLogger
         * @returns {{ success: boolean, round: number, matches: Array<object>, restingPlayers: Array<object>, updatedPlayers: Array<object>, summary: object, logs: Array<object> }}
         */
        generateRound(params = {}) {
            const {
                players = [],
                courts = 1,
                roundNum = 1,
                mode = 'clasica',
                matchesHistory = [],
                options = {},
                logger: customLogger = null
            } = params;

            const modeInstance = this.getMode(mode);
            if (!modeInstance) {
                throw new Error(`Modalidad '${mode}' no reconocida por el motor.`);
            }

            // 1. Verificación matemática previa estricta
            const validationConfig = {
                players,
                courts,
                rounds: options.rounds || roundNum,
                mode: modeInstance.getId(),
                hardNoRepeatPartner: options.hardNoRepeatPartner !== false,
                hardNoRepeatOpponent: !!options.hardNoRepeatOpponent,
                noByesAllowed: !!options.noByesAllowed
            };

            const feasibility = modeInstance.validateFeasibility(validationConfig);
            if (!feasibility.valid) {
                const errMsg = feasibility.errors.join(' | ');
                const error = new Error(errMsg);
                error.feasibility = feasibility;
                throw error;
            }

            // 2. Inicializar subsistemas
            const logger = customLogger || new DecisionLogger({ level: options.logLevel || 3 });
            const constraints = new TournamentConstraints(options.weights || {});
            modeInstance.configureConstraints(constraints, options);

            const solver = new TournamentSolver({ constraints, logger });

            logger.logDecision('ENGINE_GENERATION_START', {
                mode: modeInstance.getId(),
                roundNum,
                playersCount: players.length,
                courts
            });

            // 3. Ejecutar algoritmo de la modalidad seleccionada
            const result = modeInstance.generateRound({
                players,
                courts,
                roundNum,
                matchesHistory,
                solver,
                logger,
                constraints,
                options
            });

            logger.logDecision('ENGINE_GENERATION_COMPLETE', {
                matchesGenerated: result.matches.length,
                restingCount: result.restingPlayers.length
            });

            return {
                success: true,
                round: roundNum,
                mode: modeInstance.getId(),
                matches: result.matches,
                restingPlayers: result.restingPlayers,
                updatedPlayers: result.updatedPlayers,
                summary: logger.summary(),
                logs: logger.getLogs()
            };
        }
    }

    // Singleton universal
    const defaultEngine = new TournamentEngine();

    // Exportar componentes estáticos en la fachada
    defaultEngine.FeasibilityValidator = FeasibilityValidator;
    defaultEngine.TournamentConstraints = TournamentConstraints;
    defaultEngine.TournamentSolver = TournamentSolver;
    defaultEngine.DecisionLogger = DecisionLogger;
    defaultEngine.TournamentEngine = TournamentEngine;

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = defaultEngine;
    }
    if (typeof window !== 'undefined') {
        window.TournamentEngine = defaultEngine;
    }
})();
