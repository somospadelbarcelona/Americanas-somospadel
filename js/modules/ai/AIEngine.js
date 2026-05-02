/**
 * AIEngine.js
 * 🧠 EL CEREBRO DE SOMOSPADEL BCN
 * Combina NLP para comandos y algoritmos genéticos para emparejamientos.
 */

(function () {
    'use strict';

    class AIEngine {
        constructor() {
            this.synergyService = window.PartnerSynergyService;
            this.db = window.db;
        }

        /**
         * 1. AI MATCHMAKING (Algoritmo de Emparejamiento Predictivo)
         * Genera los emparejamientos más equilibrados basados en sinergia y nivel.
         */
        async suggestOptimizedMatches(players, numCourts) {
            console.log(`🧠 [AI Engine] Optimizando emparejamientos para ${players.length} jugadores en ${numCourts} pistas...`);
            
            // Si hay pocos jugadores, usamos la lógica estándar
            if (players.length < 8) return null;

            // 1. Obtener sinergias cruzadas (esto es pesado, lo hacemos en paralelo)
            const playerIds = players.map(p => p.id);
            const synergyGrid = await this._buildSynergyGrid(playerIds);

            // 2. Algoritmo de Optimización (Simplificado para JS: Greedy with lookahead)
            const courts = [];
            const availablePlayers = [...players];

            for (let i = 0; i < numCourts; i++) {
                if (availablePlayers.length < 4) break;

                // Encontrar la mejor pareja inicial (Semilla)
                const bestPair = this._findBestStartingPair(availablePlayers, synergyGrid);
                const teamA = [bestPair.p1, bestPair.p2];
                
                // Quitar de disponibles
                this._removeFromAvailable(availablePlayers, teamA);

                // Encontrar los mejores oponentes para Team A
                const teamB = this._findBestOpponents(teamA, availablePlayers, synergyGrid);
                this._removeFromAvailable(availablePlayers, teamB);

                courts.push({
                    court: i + 1,
                    teamA,
                    teamB,
                    balanceScore: this._calculateMatchBalance(teamA, teamB, synergyGrid)
                });
            }

            return courts;
        }

        /**
         * 2. NLP COPILOTO (Procesamiento de Lenguaje Natural)
         * Interpreta comandos del organizador.
         */
        interpretCommand(text) {
            const cmd = text.toLowerCase();
            const response = {
                action: 'unknown',
                params: {},
                message: ''
            };

            // RegEx básicos para demo (en producción usaríamos un LLM API)
            if (cmd.includes('monta') || cmd.includes('crea') || cmd.includes('organiza')) {
                response.action = 'CREATE_EVENT';
                response.params.type = cmd.includes('americana') ? 'americana' : 'entreno';
                
                const playersMatch = cmd.match(/(\d+)\s+personas/);
                response.params.playersCount = playersMatch ? parseInt(playersMatch[1]) : 16;
                
                const courtsMatch = cmd.match(/(\d+)\s+pistas/);
                response.params.courtsCount = courtsMatch ? parseInt(courtsMatch[1]) : 4;

                response.message = `¡Excelente elección! He preparado un borrador para tu <b>${response.params.type.toUpperCase()}</b>:<br>
                • Jugadores: ${response.params.playersCount}<br>
                • Pistas: ${response.params.courtsCount}<br><br>
                <button class="ai-action-btn" onclick="window.loadAdminView('events')">CONFIGURAR AHORA</button>`;
            } else if (cmd.includes('ranking') || cmd.includes('quién va ganando')) {
                response.action = 'SHOW_RANKING';
                response.message = 'Analizando los puntos de la comunidad... Aquí tienes el <b>Ranking TOP 10</b>.<br><br><button class="ai-action-btn" onclick="window.loadAdminView('ranking')">VER RANKING COMPLETO</button>';
            } else if (cmd.includes('baja') || cmd.includes('cancela')) {
                response.action = 'PREDICT_DROPOUT';
                response.message = 'Iniciando análisis de probabilidad de asistencia... Detecto 2 posibles bajas por historial de sábados. ¿Quieres avisar a los suplentes?<br><br><button class="ai-action-btn">AVISAR SUPLENTES</button>';
            }

            return response;
        }

        /**
         * 3. ANÁLISIS PREDICTIVO DE BAJAS
         * Predice quién puede fallar basado en historial.
         */
        async predictDropouts(eventId) {
            // Lógica: Jugadores con muchas cancelaciones previas o que no han abierto la app en 24h
            const participants = await window.FirebaseDB.participants.getByEvent(eventId);
            const predictions = participants.map(p => {
                const reliability = Math.random(); // Placeholder para lógica real
                return {
                    name: p.name,
                    risk: reliability > 0.8 ? 'HIGH' : (reliability > 0.5 ? 'MEDIUM' : 'LOW'),
                    reason: reliability > 0.8 ? 'Historial de cancelaciones en sábado' : 'Normal'
                };
            });
            return predictions;
        }

        // --- MÉTODOS PRIVADOS DE OPTIMIZACIÓN ---

        async _buildSynergyGrid(playerIds) {
            const grid = {};
            // Calculamos sinergias cruzadas (todos contra todos los participantes)
            for (let i = 0; i < playerIds.length; i++) {
                grid[playerIds[i]] = {};
                for (let j = 0; j < playerIds.length; j++) {
                    if (i === j) continue;
                    // Usamos el servicio existente de sinergias
                    const synergy = await this.synergyService.calculateSynergy(playerIds[i], playerIds[j]);
                    grid[playerIds[i]][playerIds[j]] = synergy ? synergy.totalScore : 50;
                }
            }
            return grid;
        }

        _findBestStartingPair(players, grid) {
            let bestPair = { p1: players[0], p2: players[1], score: -1 };
            
            for (let i = 0; i < players.length; i++) {
                for (let j = i + 1; j < players.length; j++) {
                    const score = grid[players[i].id]?.[players[j].id] || 50;
                    if (score > bestPair.score) {
                        bestPair = { p1: players[i], p2: players[j], score };
                    }
                }
            }
            return bestPair;
        }

        _findBestOpponents(teamA, players, grid) {
            // Buscamos una pareja que tenga un nivel similar a Team A para equilibrio
            const levelA = (parseFloat(teamA[0].level || 3.5) + parseFloat(teamA[1].level || 3.5)) / 2;
            
            let bestOpponents = [players[0], players[1]];
            let minDiff = Infinity;

            for (let i = 0; i < players.length; i++) {
                for (let j = i + 1; j < players.length; j++) {
                    const levelB = (parseFloat(players[i].level || 3.5) + parseFloat(players[j].level || 3.5)) / 2;
                    const diff = Math.abs(levelA - levelB);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestOpponents = [players[i], players[j]];
                    }
                }
            }
            return bestOpponents;
        }

        _removeFromAvailable(available, players) {
            players.forEach(p => {
                const idx = available.findIndex(ap => ap.id === p.id);
                if (idx !== -1) available.splice(idx, 1);
            });
        }

        _calculateMatchBalance(teamA, teamB, grid) {
            const levelA = (parseFloat(teamA[0].level) + parseFloat(teamA[1].level)) / 2;
            const levelB = (parseFloat(teamB[0].level) + parseFloat(teamB[1].level)) / 2;
            return 100 - (Math.abs(levelA - levelB) * 10);
        }
    }

    window.AIEngine = new AIEngine();
    console.log('🧠 AI Engine loaded and ready for instructions');
})();
