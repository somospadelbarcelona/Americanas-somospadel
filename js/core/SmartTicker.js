/**
 * SmartTicker.js
 * Sistema inteligente de ticker que muestra información relevante y actualizada
 * basada en el estado de la aplicación
 */
(function () {
    class SmartTicker {
        constructor() {
            this.tickerElement = null;
            this.updateInterval = null;
            this.messages = [];
        }

        init() {
            this.tickerElement = document.getElementById('ticker-track');
            if (!this.tickerElement) {
                console.warn('Ticker element not found');
                return;
            }

            // Actualizar cada 10 segundos
            this.update();
            this.updateInterval = setInterval(() => this.update(), 10000);
        }

        async update() {
            this.messages = await this.generateSmartMessages();
            this.render();
        }

        async generateSmartMessages() {
            const messages = [];
            const now = new Date();

            try {
                // 1. AMERICANAS ABIERTAS
                if (window.AmericanaService) {
                    const americanas = await window.AmericanaService.getActiveAmericanas();
                    const openAmericanas = americanas.filter(a => a.status === 'open' || a.status === 'upcoming');

                    if (openAmericanas.length > 0) {
                        const next = openAmericanas[0];
                        const spots = (next.max_courts * 4) - (next.players?.length || 0);
                        if (spots > 0 && spots <= 5) {
                            messages.push({
                                label: '🔥 ÚLTIMAS PLAZAS',
                                text: `${next.name} - ¡Solo ${spots} plazas!`
                            });
                        } else if (spots > 5) {
                            messages.push({
                                label: '📢 INSCRIPCIONES',
                                text: `${next.name} - ${next.date} ${next.time}`
                            });
                        }
                    }
                }

                // 2. AMERICANAS EN VIVO
                if (window.AmericanaService) {
                    const americanas = await window.AmericanaService.getActiveAmericanas();
                    const liveAmericanas = americanas.filter(a => a.status === 'live');

                    if (liveAmericanas.length > 0) {
                        liveAmericanas.forEach(live => {
                            messages.push({
                                label: '🔴 EN VIVO',
                                text: `${live.name} - ¡Partidos en juego ahora!`
                            });
                        });
                    }
                }

                // 3. INFORMACIÓN DEL USUARIO
                const user = window.Store ? window.Store.getState('currentUser') : null;
                if (user) {
                    // Próximo partido del usuario
                    if (window.AmericanaService) {
                        const americanas = await window.AmericanaService.getActiveAmericanas();
                        const userAmericanas = americanas.filter(a => {
                            const players = a.players || a.registeredPlayers || [];
                            return players.some(p => p.uid === user.uid || p.id === user.uid);
                        });

                        if (userAmericanas.length > 0) {
                            const next = userAmericanas[0];
                            const eventDate = new Date(next.date);
                            const isToday = eventDate.toDateString() === now.toDateString();

                            if (isToday) {
                                messages.push({
                                    label: '⚡ TU PARTIDO',
                                    text: `Hoy ${next.time} - ${next.name}`
                                });
                            }
                        }
                    }

                    // Nivel del jugador
                    if (user.level || user.self_rate_level) {
                        const level = user.level || user.self_rate_level;
                        messages.push({
                            label: '🎾 TU NIVEL',
                            text: `${level} - ${this.getLevelDescription(level)}`
                        });
                    }
                }

                // 4. RANKING Y ESTADÍSTICAS
                if (window.db) {
                    try {
                        const playersSnapshot = await window.db.collection('players')
                            .orderBy('level', 'desc')
                            .limit(3)
                            .get();

                        if (!playersSnapshot.empty) {
                            const topPlayer = playersSnapshot.docs[0].data();
                            messages.push({
                                label: '👑 TOP PLAYER',
                                text: `${topPlayer.name} - Nivel ${topPlayer.level}`
                            });
                        }
                    } catch (e) {
                        console.warn('Error fetching ranking:', e);
                    }
                }

                // 5. MENSAJES MOTIVACIONALES Y TIPS PRO
                const tips = [
                    { label: '⚡ RECUERDA', text: 'Hidrátate bien antes y durante el partido' },
                    { label: '💡 TÁCTICA', text: 'Controla el centro de la red para dominar el punto' },
                    { label: '🎾 TÉCNICA', text: 'En la volea, mantén la pala siempre alta y armada' },
                    { label: '🧠 MENTAL', text: 'La comunicación con tu pareja es el 50% de la victoria' },
                    { label: '💪 SALUD', text: 'Realiza un calentamiento dinámico de 10 min antes de jugar' },
                    { label: '🏹 ESTRATEGIA', text: 'Busca los pies de tus rivales para forzar el error' },
                    { label: '💥 PUNCH', text: 'En el remate, el impacto debe ser en el punto más alto' },
                    { label: '🛡️ DEFENSA', text: 'Usa las paredes como tus mejores aliadas, dales tiempo' },
                    { label: '🤝 FAIR PLAY', text: 'El respeto al rival es la marca de un verdadero PRO' },
                    { label: '🚀 NIVEL', text: 'Para subir de nivel, juega con gente mejor que tú' },
                    { label: '👀 VISIÓN', text: 'Observa la posición de los rivales antes de golpear' },
                    { label: '👟 CALZADO', text: 'Usa zapatillas con suela de espiga para evitar resbalones' },
                    { label: '⏱️ TIEMPOS', text: 'Llega 15 min antes para estar listo mentalmente' },
                    { label: '🔥 SOMOSPADEL', text: 'Únete a nuestro grupo de WhatsApp para retos diarios' },
                    { label: '📊 ANÁLISIS', text: 'Revisa tus informes de partido para identificar errores' },
                    { label: '🌟 SABÍAS QUE', text: 'El globo es el golpe más importante en el pádel profesional' },
                    { label: '🎾 RECUERDA', text: 'Dobla las rodillas, no la espalda, para bolas bajas' },
                    { label: '💎 CONSEJO', text: 'No intentes ganar el punto en la primera bola, construye' }
                ];

                // Agregar 2-3 tips aleatorios para variar el contenido
                for (let i = 0; i < 3; i++) {
                    const randomTip = tips[Math.floor(Math.random() * tips.length)];
                    if (!messages.find(m => m.text === randomTip.text)) {
                        messages.push(randomTip);
                    }
                }

                // 6. INFORMACIÓN TOP DE JUGADORES (Hitos y Logros)
                if (window.db) {
                    try {
                        // Jugadores con más nivel (Los cracks)
                        const topSnapshot = await window.db.collection('players')
                            .orderBy('level', 'desc')
                            .limit(5)
                            .get();

                        if (!topSnapshot.empty) {
                            const players = topSnapshot.docs.map(d => d.data());
                            const randomWinner = players[Math.floor(Math.random() * players.length)];
                            messages.push({
                                label: '👑 TOP JUGADOR',
                                text: `${randomWinner.name} liderando con nivel ${randomWinner.level}`
                            });
                        }

                        // Buscamos jugadores con muchas victorias o actividad
                        const activeSnapshot = await window.db.collection('players')
                            .orderBy('matches_played', 'desc')
                            .limit(5)
                            .get();

                        if (!activeSnapshot.empty) {
                            const activePlayer = activeSnapshot.docs[Math.floor(Math.random() * activeSnapshot.size)].data();
                            if (activePlayer.matches_played > 10) {
                                messages.push({
                                    label: '🔥 RISING STAR',
                                    text: `${activePlayer.name} ha jugado ${activePlayer.matches_played} partidos este mes`
                                });
                            }
                        }
                    } catch (e) {
                        console.warn('Error fetching detailed highlights:', e);
                    }
                }

                // 7. ESTADÍSTICAS DEL CLUB
                if (window.db) {
                    try {
                        const totalPlayersSnap = await window.db.collection('players').get();
                        const totalEventsSnap = await window.db.collection('americanas').get();

                        messages.push({
                            label: '📈 CLUB TOP',
                            text: `¡Ya somos ${totalPlayersSnap.size} jugadores en la comunidad!`
                        });

                        const finishedDays = totalEventsSnap.docs.filter(d => d.data().status === 'finished').length;
                        if (finishedDays > 0) {
                            messages.push({
                                label: '🏆 ÉXITO',
                                text: `${finishedDays} Torneos organizados con éxito total`
                            });
                        }
                    } catch (e) {
                        console.warn('Error fetching club stats:', e);
                    }
                }

                // 7. PRÓXIMOS EVENTOS (si hay fecha cercana)
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (window.AmericanaService) {
                    const americanas = await window.AmericanaService.getActiveAmericanas();
                    const tomorrowEvents = americanas.filter(a => {
                        const eventDate = new Date(a.date);
                        return eventDate.toDateString() === tomorrow.toDateString();
                    });

                    if (tomorrowEvents.length > 0) {
                        messages.push({
                            label: '📅 MAÑANA',
                            text: `${tomorrowEvents.length} ${tomorrowEvents.length === 1 ? 'Americana' : 'Americanas'} programadas`
                        });
                    }
                }

            } catch (error) {
                console.error('Error generating smart messages:', error);
            }

            // Si no hay mensajes, mostrar mensaje por defecto
            if (messages.length === 0) {
                messages.push(
                    { label: '🎾 BIENVENIDO', text: 'Somospadel BCN - Tu comunidad de pádel' },
                    { label: '🏆 AMERICANAS', text: 'Consulta los próximos torneos disponibles' }
                );
            }

            return messages;
        }

        getLevelDescription(level) {
            const lvl = parseFloat(level);
            if (lvl < 2) return 'Iniciación';
            if (lvl < 3) return 'Básico';
            if (lvl < 4) return 'Intermedio';
            if (lvl < 5) return 'Avanzado';
            if (lvl < 6) return 'Experto';
            return 'Profesional';
        }

        render() {
            if (!this.tickerElement || this.messages.length === 0) return;

            // Shuffle para variedad constante
            const shuffled = [...this.messages].sort(() => Math.random() - 0.5);

            // Duplicar mensajes para efecto continuo
            const duplicatedMessages = [...shuffled, ...shuffled];

            const html = duplicatedMessages.map(msg => `
                <div class="ticker-item">
                    <span>${msg.label}</span>${msg.text}
                </div>
            `).join('');

            this.tickerElement.innerHTML = html;
        }

        destroy() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SmartTicker = new SmartTicker();
            window.SmartTicker.init();
        });
    } else {
        window.SmartTicker = new SmartTicker();
        window.SmartTicker.init();
    }

    console.log('🎯 SmartTicker System Loaded');
})();
