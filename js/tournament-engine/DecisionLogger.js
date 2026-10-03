/**
 * DecisionLogger.js
 * Sistema de trazabilidad, depuración y auditoría matemática para el TournamentEngine.
 * Registra cada decisión de emparejamiento, podas en el árbol CSP, penalizaciones y puntuaciones.
 *
 * Compatible con Node.js y navegadores.
 */

(function () {
    'use strict';

    const LOG_LEVELS = {
        SILENT: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
        TRACE: 5
    };

    class DecisionLogger {
        constructor(options = {}) {
            this.level = options.level !== undefined ? options.level : LOG_LEVELS.INFO;
            this.logs = [];
            this.stats = {
                decisions: 0,
                prunes: 0,
                violations: 0,
                evaluations: 0
            };
            this.consoleOutput = !!options.consoleOutput;
        }

        setLevel(level) {
            if (typeof level === 'string') {
                const upper = level.toUpperCase();
                this.level = LOG_LEVELS[upper] !== undefined ? LOG_LEVELS[upper] : LOG_LEVELS.INFO;
            } else if (typeof level === 'number') {
                this.level = level;
            }
        }

        log(level, phase, message, data = null) {
            if (level > this.level) return;

            const entry = {
                timestamp: Date.now(),
                isoTime: new Date().toISOString(),
                level,
                phase,
                message,
                data: data ? JSON.parse(JSON.stringify(data)) : null
            };

            this.logs.push(entry);

            if (this.consoleOutput) {
                const prefix = `[Engine:${phase}]`;
                if (level <= LOG_LEVELS.ERROR) console.error(prefix, message, data || '');
                else if (level <= LOG_LEVELS.WARN) console.warn(prefix, message, data || '');
                else console.log(prefix, message, data || '');
            }
        }

        logDecision(step, details = {}) {
            this.stats.decisions++;
            this.log(LOG_LEVELS.DEBUG, 'DECISION', `Paso: ${step}`, details);
        }

        logPrune(reason, candidate = {}) {
            this.stats.prunes++;
            this.log(LOG_LEVELS.DEBUG, 'PRUNE', `Poda CSP: ${reason}`, candidate);
        }

        logViolation(constraintName, details = {}, penalty = 0) {
            this.stats.violations++;
            this.log(LOG_LEVELS.TRACE, 'VIOLATION', `Restricción violada: ${constraintName} (Penalización: ${penalty})`, {
                constraint: constraintName,
                penalty,
                ...details
            });
        }

        logScore(candidateDesc, score, breakdown = {}) {
            this.stats.evaluations++;
            this.log(LOG_LEVELS.TRACE, 'SCORE', `Evaluación: ${candidateDesc} -> Score: ${score}`, {
                score,
                breakdown
            });
        }

        getLogs() {
            return this.logs;
        }

        getStats() {
            return { ...this.stats };
        }

        clear() {
            this.logs = [];
            this.stats = {
                decisions: 0,
                prunes: 0,
                violations: 0,
                evaluations: 0
            };
        }

        summary() {
            return {
                totalLogs: this.logs.length,
                ...this.stats
            };
        }
    }

    DecisionLogger.LOG_LEVELS = LOG_LEVELS;

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DecisionLogger, LOG_LEVELS };
    }
    if (typeof window !== 'undefined') {
        window.DecisionLogger = DecisionLogger;
        window.TOURNAMENT_LOG_LEVELS = LOG_LEVELS;
    }
})();
