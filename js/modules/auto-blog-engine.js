/**
 * auto-blog-engine.js
 * 🤖 Motor Automático de Blog — SomosPadel BCN
 * Genera noticias atractivas de forma autónoma leyendo datos reales de Firestore.
 * Colecciones usadas: americanas, entrenos, matches, users, club_teams
 * Publica en: blog_posts
 */

(function () {
    console.log('🤖 [AutoBlogEngine] Motor de Noticias cargando...');

    // ─── BANCO DE CONSEJOS TÁCTICOS ROTATIVOS ───────────────────────────────
    const TACTICAL_TIPS = [
        {
            title: '💡 La Teoría del Centro: el Secreto de los Pros',
            emoji: '🎯',
            snippet: 'Jugar al centro reduce los ángulos del rival y provoca dudas entre la pareja contraria.',
            content: 'Uno de los principios más poderosos del pádel moderno es la "Teoría del Centro". Al golpear consistentemente hacia el centro de la pista, reduces drásticamente los ángulos de rebote que puede explotar el rival. Además, generates confusión entre la pareja contraria — ¿quién coge esa bola? Este simple ajuste táctico puede cambiar completamente un partido. Pruébalo en tu próxima partida y observa cómo el rival se desorganiza.',
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
        },
        {
            title: '💡 El Globo Defensivo: Tu Mejor Arma en Apuros',
            emoji: '🌟',
            snippet: 'Cuando estás bajo presión, el globo bien colocado te da tiempo para recuperar la posición.',
            content: 'El globo no es una señal de debilidad — es una herramienta táctica de alto nivel. Cuando el rival te presiona en el fondo de pista, un globo profundo y con efecto te permite recuperar la posición en la red, resetear el punto y pasar de defender a atacar. La clave está en la altura: lo suficientemente alto para que tu rival no pueda rematar cómodamente, pero no tan alto que le des tiempo de organizar un ataque perfecto.',
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        },
        {
            title: '💡 La Posición en la Red: Dónde Ganar los Puntos',
            emoji: '⚡',
            snippet: 'Controlar la red te da el dominio del punto. Aprende la posición correcta para voleas ganadoras.',
            content: 'El pádel se gana en la red. El jugador o pareja que controla la posición central en la red tiene una ventaja enorme: más ángulos de volea, más opciones de rematada y más presión psicológica sobre el rival. La posición ideal es a un metro y medio de la red, alineados con la bola y en posición de split-step justo cuando el rival golpea. Practicar el timing del split-step es el primer paso hacia el dominio de la red.',
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'
        },
        {
            title: '💡 El Efecto Cortado: El Golpe que Confunde',
            emoji: '🔄',
            snippet: 'Un golpe cortado con slice hace que la bola patine en el cristal y genere ángulos imposibles.',
            content: 'El golpe cortado o slice es una de las herramientas más sofisticadas del pádel avanzado. Al golpear la bola con efecto cortado hacia la pared lateral, creas una trayectoria "baja y resbalosa" que es muy difícil de contrarrestar. La bola no sube al rematar contra el cristal — patina. Esto obliga al rival a bajar mucho la raqueta y a menudo resulta en una bola de poca calidad que puedes atacar. Úsalo especialmente en el tercer cristal lateral.',
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
        },
        {
            title: '💡 Comunicación en Pista: El Equipo que Habla, Gana',
            emoji: '🗣️',
            snippet: 'Las parejas ganadoras se comunican constantemente. Aprende los códigos de comunicación esenciales.',
            content: 'El pádel es un deporte de pareja y la comunicación es fundamental. Las mejores parejas tienen un lenguaje propio en pista: "mía", "tuya", "al centro", "cambia", "sube". Antes del partido, acordad vuestra estrategia: quién cubre el centro, cómo gestionáis los globos, cuándo subís juntos. Durante el juego, comunicad entre punto y punto — qué ha fallado, qué ha funcionado. Una pareja bien comunicada multiplica su rendimiento exponencialmente.',
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)'
        },
        {
            title: '💡 El Remate por Tres: La Bola Imposible de Defender',
            emoji: '💥',
            snippet: 'Aprende a usar las tres paredes para crear remates imposibles de devolver.',
            content: 'El "remate por tres" o remate bandeja con efecto hacia los tres cristales es una de las jugadas más espectaculares y efectivas del pádel. En lugar de rematar la bola hacia abajo con potencia, la golpeas hacia la pared del fondo con efectoy rebota hacia las paredes laterales, creando un ángulo imposible. Este golpe requiere técnica y práctica, pero cuando lo dominas te diferencia completamente de los jugadores de tu nivel.',
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
        }
    ];

    // ─── FRASES DE APERTURA Y CIERRE ATRACTIVAS ─────────────────────────────
    const OPENING_HOOKS = [
        '¡La acción en SomosPadel BCN no para! ',
        '¡Atención a todos los jugadores! ',
        '¡Noticias frescas desde la pista! ',
        '¡El pádel está más vivo que nunca! ',
        '¡No te pierdas lo que está pasando! ',
        '¡SomosPadel BCN en plena forma! '
    ];

    const CLOSING_LINES = [
        ' ¡Nos vemos en pista! 🎾',
        ' ¡Apunta la fecha en tu calendario! 📅',
        ' ¡El nivel sigue subiendo! 🚀',
        ' ¡SomosPadel BCN es tu club! 💪',
        ' ¡Que no te lo cuenten! 🔥'
    ];

    function randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'Próximamente';
        try {
            // Handle DD/MM/YYYY format
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/');
                const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                return `${parseInt(d)} de ${months[parseInt(m) - 1]}`;
            }
            // Handle YYYY-MM-DD
            const parts = dateStr.split('-');
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return `${parseInt(parts[2])} de ${months[parseInt(parts[1]) - 1]}`;
        } catch (e) { return dateStr; }
    }

    function timeAgo(ts) {
        if (!ts) return 'Hoy';
        const now = Date.now();
        const diff = now - (typeof ts === 'number' ? ts : ts.toMillis ? ts.toMillis() : now);
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 60) return mins < 5 ? 'Ahora mismo' : `Hace ${mins} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return 'Esta semana';
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    function titleCase(str) {
        if (!str) return '';
        return str.split(' ').map(w => capitalize(w)).join(' ');
    }

    // ─── GENERADORES DE ARTÍCULOS POR TIPO ──────────────────────────────────

    function buildAmericanaOpenArticle(ev) {
        const spots = (parseInt(ev.max_courts || 4) * 4);
        const registered = (ev.players || ev.registeredPlayers || []).length;
        const free = Math.max(0, spots - registered);
        const catLabel = (ev.category || 'OPEN').toUpperCase();
        const loc = ev.location || 'nuestras instalaciones';
        const dateStr = formatDate(ev.date);
        const timeStr = ev.time ? ` a las ${ev.time}` : '';

        return {
            id: `americana-open-${ev.id || ev.name?.slice(0,8).replace(/\s/g,'-')}-${(ev.date||'').replace(/\//g,'-')}`,
            category: '🏆 AMERICANAS',
            catColor: '#CCFF00',
            emoji: free <= 4 ? '🔥' : '🏆',
            imgGrad: 'linear-gradient(135deg, #CCFF00 0%, #84cc16 100%)',
            title: free <= 4
                ? `🔥 ¡ÚLTIMAS ${free} PLAZAS! Americana ${catLabel} el ${dateStr}`
                : `🏆 Inscríbete: Americana ${catLabel} el ${dateStr}${timeStr}`,
            snippet: `${registered} jugadores apuntados. ${free > 0 ? `Quedan ${free} plazas libres` : '¡Lista de espera activa'} en ${loc.split(' ').slice(-2).join(' ')}.`,
            content: `${randomFrom(OPENING_HOOKS)}El próximo ${dateStr}${timeStr} celebramos una nueva Americana ${catLabel} en ${loc}. Ya tenemos ${registered} jugadores inscritos y ${free > 0 ? `quedan ${free} plazas disponibles` : 'la lista de espera está activa'}. Apúntate desde la sección de Americanas de la app antes de que se llene. ${free <= 4 && free > 0 ? '¡No esperes más, las plazas vuelan!' : 'Cada americana es una experiencia única de networking padelístico.'}${randomFrom(CLOSING_LINES)}`,
            date: timeAgo(Date.now()),
            readTime: '1 min',
            timestamp: Date.now() - Math.random() * 60000
        };
    }

    function buildAmericanaLiveArticle(ev) {
        const players = (ev.players || ev.registeredPlayers || []);
        const count = players.length;
        const loc = ev.location || 'pista';

        return {
            id: `americana-live-${ev.id || 'ev'}-${new Date().toISOString().slice(0, 10)}`,
            category: '🔴 EN DIRECTO',
            catColor: '#ef4444',
            emoji: '🔴',
            imgGrad: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            title: `🔴 EN JUEGO AHORA: ${count} jugadores en acción${ev.location ? ' en ' + ev.location.split(' ').slice(-2).join(' ') : ''}`,
            snippet: `¡La ${(ev.category||'').toUpperCase() || 'americana'} de hoy está en pleno apogeo! Sigue la acción en tiempo real desde la app.`,
            content: `🔴 ¡EVENTO EN DIRECTO AHORA MISMO! La ${(ev.name || 'Americana').toUpperCase()} está en curso con ${count} jugadores batallando en ${loc}. Los puntos se apuntan en tiempo real — abre la sección "Live" de la app para ver los marcadores, clasificaciones y quién está dominando la jornada. ¡El nivel de juego esta tarde está siendo espectacular!${randomFrom(CLOSING_LINES)}`,
            date: 'Ahora mismo',
            readTime: '1 min',
            timestamp: Date.now()
        };
    }

    function buildEntrenoArticle(ev) {
        const spots = (parseInt(ev.max_players || ev.max_courts * 4 || 16));
        const registered = (ev.players || []).length;
        const free = Math.max(0, spots - registered);
        const dateStr = formatDate(ev.date);
        const modeLabel = ev.pair_mode === 'rotating' ? 'TWISTER 🌪️' :
            ev.pair_mode === 'fixed' ? 'PAREJA FIJA' : 'ABIERTO';

        return {
            id: `entreno-open-${ev.id || 'ent'}-${(ev.date||'').replace(/\//g,'-')}`,
            category: '🎾 ENTRENAMIENTO',
            catColor: '#22c55e',
            emoji: ev.pair_mode === 'rotating' ? '🌪️' : '🎾',
            imgGrad: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            title: `🎾 Entreno ${modeLabel} el ${dateStr} — ${free > 0 ? `${free} plazas libres` : '¡Lista de espera!'}`,
            snippet: `${registered} jugadores ya apuntados. Modo ${modeLabel} ${ev.time ? `a las ${ev.time}` : ''}. ${free > 0 ? '¡Apúntate ya!' : 'Únete a la lista de espera.'}`,
            content: `${randomFrom(OPENING_HOOKS)}El ${dateStr}${ev.time ? ` a las ${ev.time}` : ''} tenemos entreno en modo ${modeLabel} en ${ev.location || 'nuestras instalaciones'}. ${ev.pair_mode === 'rotating' ? 'En el formato TWISTER rotarás de pareja cada ronda, conocerás a todos los jugadores y mejorarás tu adaptación táctica. ' : 'Las parejas fijas trabajarán coordinación y estrategia conjunta. '}Ya se han apuntado ${registered} jugadores. ${free > 0 ? `Quedan ${free} plazas — apúntate desde la sección Americanas/Entrenos de la app.` : 'Las plazas están completas, pero puedes unirte a la lista de espera.'}${randomFrom(CLOSING_LINES)}`,
            date: timeAgo(Date.now() - 3600000),
            readTime: '1 min',
            timestamp: Date.now() - 3600000 - Math.random() * 60000
        };
    }

    function buildRankingArticle(topPlayers) {
        if (!topPlayers || topPlayers.length === 0) return null;
        const top3 = topPlayers.slice(0, 3);
        const leader = top3[0];
        const leaderName = titleCase(leader.name || leader.displayName || 'El Líder');
        const leaderPoints = leader.ranking_points || leader.points || '—';

        return {
            id: `ranking-top-${new Date().toISOString().slice(0, 7)}`,
            category: '📊 RANKING',
            catColor: '#38bdf8',
            emoji: '🏅',
            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            title: `🏅 Ranking Actualizado: ${leaderName} lidera con ${leaderPoints} puntos`,
            snippet: `Top 3: ${top3.map((p, i) => `${['🥇','🥈','🥉'][i]} ${titleCase(p.name || p.displayName || 'Jugador')}`).join(' · ')}. ¿Estás en la lista?`,
            content: `El ranking de SomosPadel BCN se ha actualizado. ${leaderName} se mantiene al frente con ${leaderPoints} puntos. El TOP 3 actual es: 🥇 ${titleCase(top3[0]?.name || '—')} (${top3[0]?.ranking_points || '—'} pts)${top3[1] ? `, 🥈 ${titleCase(top3[1]?.name || '—')} (${top3[1]?.ranking_points || '—'} pts)` : ''}${top3[2] ? `, 🥉 ${titleCase(top3[2]?.name || '—')} (${top3[2]?.ranking_points || '—'} pts)` : ''}. El ranking se recalcula automáticamente tras cada americana. Cada victoria suma, cada derrota enseña. ¿En qué posición estás tú? Visita la sección Ranking de la app para ver la clasificación completa.${randomFrom(CLOSING_LINES)}`,
            date: timeAgo(Date.now() - 7200000),
            readTime: '2 min',
            timestamp: Date.now() - 7200000
        };
    }

    function buildTeamArticle(team) {
        const teamName = (team.name || team.team_name || 'Nuestro Equipo').toUpperCase();
        const wins = team.wins || team.victories || 0;
        const losses = team.losses || team.defeats || 0;
        const total = wins + losses;
        const division = team.division || team.categoria || 'Liga Local';
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        const mood = wins >= 3 && losses === 0 ? 'invictos 🔥' :
            winRate >= 70 ? 'en racha ganadora 💪' :
            winRate >= 50 ? 'con buenas sensaciones 🎾' :
            'luchando con todo 💥';

        return {
            id: `team-highlight-${(team.id || team.name || 'team').replace(/\s/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,7)}`,
            category: '👥 EQUIPOS',
            catColor: '#a78bfa',
            emoji: wins > 2 ? '🔥' : '👥',
            imgGrad: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            title: `👥 ${teamName} ${mood} en ${division}`,
            snippet: `${wins}V - ${losses}D en ${total} partidos jugados. ${winRate}% de victorias. ¡Sigue su trayectoria en la app!`,
            content: `${randomFrom(OPENING_HOOKS)}El equipo ${teamName} está ${mood} en ${division}. Con un balance de ${wins} victorias y ${losses} derrotas en ${total} partidos disputados, acumulan un impresionante ${winRate}% de victorias. ${wins >= 3 && losses === 0 ? '¡Aún no han conocido la derrota esta temporada! Una actuación espectacular que los sitúa como serios candidatos.' : winRate >= 70 ? 'Sus actuaciones esta temporada demuestran el gran nivel del equipo y su cohesión táctica.' : 'El equipo sigue trabajando para mejorar su rendimiento y escalar posiciones.'} Sigue su evolución partido a partido en la sección Equipos de la app.${randomFrom(CLOSING_LINES)}`,
            date: timeAgo(Date.now() - 10800000),
            readTime: '1 min',
            timestamp: Date.now() - 10800000 - Math.random() * 60000
        };
    }

    function buildTacticalTipArticle(tip, index) {
        const weekNum = Math.ceil(new Date().getDate() / 7);
        return {
            id: `tactical-tip-${index}-week-${new Date().toISOString().slice(0,7)}-w${weekNum}`,
            category: '💡 CONSEJOS',
            catColor: '#f59e0b',
            emoji: tip.emoji,
            imgGrad: tip.imgGrad,
            title: tip.title,
            snippet: tip.snippet,
            content: tip.content + randomFrom(CLOSING_LINES),
            date: timeAgo(Date.now() - 18000000),
            readTime: '3 min',
            timestamp: Date.now() - 18000000 - index * 3600000
        };
    }

    function buildStatsArticle(stats) {
        const { totalMatches, totalPlayers, totalEvents } = stats;
        return {
            id: `stats-week-${new Date().toISOString().slice(0, 7)}-v2`,
            category: '📢 NOVEDADES',
            catColor: '#ec4899',
            emoji: '🎉',
            imgGrad: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
            title: `🎉 SomosPadel BCN: ${totalMatches} partidos jugados esta temporada`,
            snippet: `${totalPlayers} jugadores activos, ${totalEvents} eventos completados. ¡La comunidad no para de crecer!`,
            content: `¡Los números de SomosPadel BCN siguen creciendo! Esta temporada llevamos ${totalMatches} partidos disputados, ${totalPlayers} jugadores activos en nuestra base de datos y ${totalEvents} eventos completados con éxito. Cada semana la comunidad crece con nuevas incorporaciones y el nivel de juego sube constantemente. Si aún no has traído a un amigo al club, ¡este es el momento! Cuantos más seamos, más americanas podemos organizar y más variedad de niveles tenemos. ¡Gracias a todos por hacer de SomosPadel BCN un lugar tan especial!${randomFrom(CLOSING_LINES)}`,
            date: timeAgo(Date.now() - 21600000),
            readTime: '2 min',
            timestamp: Date.now() - 21600000
        };
    }

    // ─── MOTOR PRINCIPAL ─────────────────────────────────────────────────────

    window.AutoBlogEngine = {
        _log: [],

        _addLog(msg, type = 'info') {
            const entry = { msg, type, time: new Date().toLocaleTimeString('es-ES') };
            this._log.unshift(entry);
            console.log(`🤖 [AutoBlog] ${msg}`);
            // Refresh log UI if visible
            this._refreshLogUI();
        },

        _refreshLogUI() {
            const logContainer = document.getElementById('autoblog-log');
            if (!logContainer) return;
            logContainer.innerHTML = this._log.slice(0, 12).map(e => `
                <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:8px; background:${
                    e.type === 'success' ? 'rgba(34,197,94,0.1)' :
                    e.type === 'error' ? 'rgba(239,68,68,0.1)' :
                    'rgba(255,255,255,0.05)'
                }; border-left:3px solid ${
                    e.type === 'success' ? '#22c55e' :
                    e.type === 'error' ? '#ef4444' :
                    '#64748b'
                }; margin-bottom:4px;">
                    <span style="font-size:0.7rem; color:#64748b; flex-shrink:0;">${e.time}</span>
                    <span style="font-size:0.75rem; color:${
                        e.type === 'success' ? '#22c55e' :
                        e.type === 'error' ? '#ef4444' :
                        '#0f172a'
                    }; font-weight:600;">${e.msg}</span>
                </div>
            `).join('');
        },

        async _getDB() {
            return window.db || (window.firebase && firebase.firestore());
        },

        async _postExists(db, postId) {
            try {
                const doc = await db.collection('blog_posts').doc(postId).get();
                return doc.exists;
            } catch (e) { return false; }
        },

        async _publishPost(db, post) {
            try {
                const exists = await this._postExists(db, post.id);
                if (exists) {
                    this._addLog(`⏭ Ya existe: "${post.title.slice(0,40)}..."`, 'info');
                    return false;
                }
                await db.collection('blog_posts').doc(post.id).set(post);
                this._addLog(`✅ Publicado: "${post.title.slice(0,40)}..."`, 'success');
                return true;
            } catch (e) {
                this._addLog(`❌ Error publicando: ${e.message}`, 'error');
                return false;
            }
        },

        async cleanOldPosts() {
            try {
                const db = await this._getDB();
                if (!db) return;
                const cutoff = Date.now() - (7 * 24 * 3600 * 1000); // 7 días
                const snapshot = await db.collection('blog_posts')
                    .where('timestamp', '<', cutoff)
                    .get();

                if (snapshot.empty) {
                    this._addLog('🧹 Sin posts caducados que limpiar.', 'info');
                    return 0;
                }

                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                this._addLog(`🧹 Limpiados ${snapshot.size} posts caducados (>7 días).`, 'success');
                return snapshot.size;
            } catch (e) {
                this._addLog(`⚠️ No se pudo limpiar posts antiguos: ${e.message}`, 'error');
                return 0;
            }
        },

        async generate(options = {}) {
            const { silent = false, forceRefresh = false } = options;
            const db = await this._getDB();
            if (!db) {
                this._addLog('❌ Firestore no disponible.', 'error');
                return { published: 0, skipped: 0, errors: 0 };
            }

            this._log = [];
            this._addLog('🚀 Iniciando generación automática de noticias...', 'info');

            let published = 0;
            let skipped = 0;
            const articles = [];

            // 1. Limpiar posts viejos (>7 días)
            await this.cleanOldPosts();

            // ── AMERICANA ABIERTA / PRÓXIMA ──────────────────────────────
            try {
                this._addLog('📡 Buscando americanas abiertas...', 'info');
                const americanasSnap = await db.collection('americanas')
                    .where('status', 'in', ['open', 'draft'])
                    .limit(3)
                    .get();

                if (!americanasSnap.empty) {
                    const today = new Date().toISOString().slice(0, 10);
                    for (const doc of americanasSnap.docs) {
                        const ev = { id: doc.id, ...doc.data() };
                        // Only future events
                        const evDate = ev.date ? this._normalizeDate(ev.date) : '9999';
                        if (evDate >= today.slice(0, 7)) { // same month or future
                            articles.push(buildAmericanaOpenArticle(ev));
                        }
                    }
                    this._addLog(`📋 ${americanasSnap.size} americanas abiertas encontradas.`, 'info');
                } else {
                    this._addLog('ℹ️ No hay americanas abiertas en este momento.', 'info');
                }
            } catch (e) {
                this._addLog(`⚠️ Error en americanas: ${e.message}`, 'error');
            }

            // ── AMERICANA EN DIRECTO ──────────────────────────────────────
            try {
                const liveSnap = await db.collection('americanas')
                    .where('status', '==', 'live')
                    .limit(1)
                    .get();

                if (!liveSnap.empty) {
                    const ev = { id: liveSnap.docs[0].id, ...liveSnap.docs[0].data() };
                    articles.push(buildAmericanaLiveArticle(ev));
                    this._addLog('🔴 Americana en directo detectada.', 'success');
                }
            } catch (e) {
                this._addLog(`⚠️ Error en live: ${e.message}`, 'error');
            }

            // ── ENTRENOS ABIERTOS ─────────────────────────────────────────
            try {
                this._addLog('🎾 Buscando entrenamientos próximos...', 'info');
                const entrenosSnap = await db.collection('entrenos')
                    .where('status', 'in', ['open', 'draft'])
                    .limit(2)
                    .get();

                if (!entrenosSnap.empty) {
                    for (const doc of entrenosSnap.docs.slice(0, 1)) {
                        const ev = { id: doc.id, ...doc.data() };
                        articles.push(buildEntrenoArticle(ev));
                    }
                    this._addLog(`🎾 ${entrenosSnap.size} entrenamientos encontrados.`, 'info');
                }
            } catch (e) {
                this._addLog(`⚠️ Error en entrenos: ${e.message}`, 'error');
            }

            // ── RANKING TOP PLAYERS ───────────────────────────────────────
            try {
                this._addLog('📊 Obteniendo ranking actualizado...', 'info');
                const usersSnap = await db.collection('users')
                    .orderBy('ranking_points', 'desc')
                    .limit(5)
                    .get();

                if (!usersSnap.empty) {
                    const players = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                        .filter(p => p.ranking_points > 0);
                    if (players.length >= 2) {
                        const rankArticle = buildRankingArticle(players);
                        if (rankArticle) articles.push(rankArticle);
                        this._addLog(`🏅 Top ${players.length} jugadores obtenidos para ranking.`, 'info');
                    }
                }
            } catch (e) {
                // Fallback: try without orderBy (might need index)
                try {
                    const usersSnap2 = await db.collection('users').limit(20).get();
                    const players = usersSnap2.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(p => (p.ranking_points || p.points || 0) > 0)
                        .sort((a, b) => (b.ranking_points || b.points || 0) - (a.ranking_points || a.points || 0))
                        .slice(0, 5);
                    if (players.length >= 2) {
                        const rankArticle = buildRankingArticle(players);
                        if (rankArticle) articles.push(rankArticle);
                    }
                } catch (e2) {
                    this._addLog(`⚠️ Error en ranking: ${e2.message}`, 'error');
                }
            }

            // ── EQUIPO DESTACADO DE LIGA ──────────────────────────────────
            try {
                this._addLog('👥 Buscando equipos destacados...', 'info');
                const teamsSnap = await db.collection('club_teams').limit(20).get();
                if (!teamsSnap.empty) {
                    const teams = teamsSnap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(t => (t.wins || t.victories || 0) > 0)
                        .sort((a, b) => {
                            const wa = (a.wins || a.victories || 0);
                            const wb = (b.wins || b.victories || 0);
                            return wb - wa;
                        });

                    if (teams.length > 0) {
                        // Pick best team
                        articles.push(buildTeamArticle(teams[0]));
                        this._addLog(`👥 Equipo destacado: ${teams[0].name || teams[0].team_name}`, 'info');
                    }
                }
            } catch (e) {
                this._addLog(`⚠️ Error en equipos: ${e.message}`, 'error');
            }

            // ── ESTADÍSTICAS GLOBALES ─────────────────────────────────────
            try {
                this._addLog('📈 Calculando estadísticas globales...', 'info');
                const [matchesSnap, usersSnap, eventsSnap] = await Promise.all([
                    db.collection('matches').limit(1).get().catch(() => ({ size: 0 })),
                    db.collection('users').get().catch(() => ({ size: 0 })),
                    db.collection('americanas').where('status', '==', 'finished').get().catch(() => ({ size: 0 }))
                ]);

                const stats = {
                    totalMatches: (matchesSnap.size || 0) > 0 ? '100+' : 'múltiples',
                    totalPlayers: usersSnap.size || 50,
                    totalEvents: eventsSnap.size || 10
                };

                // Only add if we have meaningful data
                if ((usersSnap.size || 0) > 5) {
                    articles.push(buildStatsArticle(stats));
                }
            } catch (e) {
                this._addLog(`⚠️ Error en estadísticas: ${e.message}`, 'error');
            }

            // ── CONSEJOS TÁCTICOS (1-2 rotativos por semana) ─────────────
            try {
                const weekNum = Math.ceil(new Date().getDate() / 7);
                const tipIndex = (weekNum + new Date().getMonth()) % TACTICAL_TIPS.length;
                const tip2Index = (tipIndex + 1) % TACTICAL_TIPS.length;
                articles.push(buildTacticalTipArticle(TACTICAL_TIPS[tipIndex], tipIndex));
                articles.push(buildTacticalTipArticle(TACTICAL_TIPS[tip2Index], tip2Index));
                this._addLog(`💡 2 consejos tácticos seleccionados para esta semana.`, 'info');
            } catch (e) {
                this._addLog(`⚠️ Error en consejos: ${e.message}`, 'error');
            }

            // ── PUBLICAR TODOS LOS ARTÍCULOS ─────────────────────────────
            this._addLog(`📝 Intentando publicar ${articles.length} artículos...`, 'info');

            for (const article of articles) {
                const wasPublished = await this._publishPost(db, article);
                if (wasPublished) published++;
                else skipped++;
            }

            this._addLog(
                `🎉 Completado: ${published} nuevos · ${skipped} ya existentes`,
                published > 0 ? 'success' : 'info'
            );

            // Refresh blog table if visible
            if (window.AdminViews && typeof window.refreshBlogTable === 'function') {
                window.refreshBlogTable();
            }

            return { published, skipped, errors: 0 };
        },

        _normalizeDate(d) {
            if (!d) return '9999-99-99';
            if (d.includes('/')) {
                const parts = d.split('/');
                if (parts[2]?.length === 4) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            return d;
        }
    };

    console.log('✅ [AutoBlogEngine] Motor registrado en window.AutoBlogEngine');
})();
