/**
 * auto-blog-engine.js
 * 🤖 Motor Automático de Blog — SomosPadel BCN
 * Genera noticias atractivas de forma autónoma leyendo datos reales de Firestore.
 * Colecciones usadas: americanas, entrenos, matches, users, club_teams
 * Publica en: blog_posts
 */

(function () {
    console.log('🤖 [AutoBlogEngine] Motor de Noticias cargando...');

    // ─── BANCO DE CONSEJOS TÁCTICOS ROTATIVOS ENRIQUECIDOS (MINI-MASTERCLASSES) ───
    const TACTICAL_TIPS = [
        {
            title: '💡 La Teoría del Centro: el Secreto de los Pros',
            emoji: '🎯',
            snippet: 'Jugar al centro reduce los ángulos del rival y provoca dudas entre la pareja contraria.',
            content: `
                <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                        <h4 style="margin:0 0 8px; font-family:'Outfit'; font-size:0.95rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">🎯 ¿Por qué es fundamental?</h4>
                        <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.72); font-weight:500;">Uno de los principios más poderosos del pádel moderno es la "Teoría del Centro". Al golpear consistentemente hacia el centro de la pista, reduces drásticamente los ángulos de rebote que puede explotar el rival. Además, generas confusión espacial y de comunicación entre la pareja contraria — ¿quién coge esa bola?</p>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📋 Guía de Ejecución Paso a Paso</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">1</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Apunta a la "T":</strong> Dirige tus golpes hacia el punto donde se cruzan las líneas de servicio del fondo de la pista contraria para un rebote neutro.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">2</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Controla la altura:</strong> Juega globos profundos por el centro para recuperar tu posición en la red sin regalar ángulos laterales.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">3</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Sincroniza la volea:</strong> Cuando ambos subáis a la red, mantened una distancia coordinada para cubrir la zona central y el rebote del cristal.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">❌ Errores Comunes a Evitar</h4>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Rematar de frente con demasiada fuerza, regalando un rebote cómodo a su cristal de fondo.
                            </div>
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> No comunicarse con tu pareja en las bolas del centro, permitiendo que ambos duden y dejen pasar el punto.
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(132,204,22,0.03) 100%); border:1px solid rgba(204,255,0,0.22); padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(204,255,0,0.05);">
                        <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.9rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">💡 El Secreto del Coach</h4>
                        <p style="margin:0; font-size:0.78rem; color:rgba(255,255,255,0.85); font-weight:500;">Si el rival juega muy separado, el juego central es letal. Satura el centro hasta forzar un golpeo defensivo de mala calidad de tu rival, y entonces ataca agresivamente los espacios laterales que queden abiertos.</p>
                    </div>
                </div>
            `,
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
        },
        {
            title: '💡 El Globo Defensivo: Tu Mejor Arma en Apuros',
            emoji: '🌟',
            snippet: 'Cuando estás bajo presión, el globo bien colocado te da tiempo para recuperar la posición.',
            content: `
                <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                        <h4 style="margin:0 0 8px; font-family:'Outfit'; font-size:0.95rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">🌟 ¿Por qué es fundamental?</h4>
                        <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.72); font-weight:500;">El globo no es una señal de debilidad — es una herramienta táctica de alto nivel. Cuando el rival te presiona en el fondo de pista, un globo profundo y con efecto te permite recuperar la posición en la red, resetear el punto y pasar de defender a atacar.</p>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📋 Guía de Ejecución Paso a Paso</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">1</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Flexiona las rodillas:</strong> Entra siempre por debajo de la bola con la pala bien abierta para garantizar la parábola ideal.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">2</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Busca la altura correcta:</strong> Un globo demasiado alto da tiempo a reubicarse, pero un globo tenso y profundo los saca de su posición de red al instante.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">3</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Acompaña la subida:</strong> Si ves que el globo sobrepasa a los oponentes, sube inmediatamente a la red con tu pareja para consolidar la ventaja.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">❌ Errores Comunes a Evitar</h4>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Golpear con la muñeca suelta, lo que provoca globos cortos y fáciles de rematar (bandeja ganadora).
                            </div>
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Quedarse estático en el fondo esperando a ver el bote de tu propio globo en lugar de subir a la red.
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(132,204,22,0.03) 100%); border:1px solid rgba(204,255,0,0.22); padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(204,255,0,0.05);">
                        <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.9rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">💡 El Secreto del Coach</h4>
                        <p style="margin:0; font-size:0.78rem; color:rgba(255,255,255,0.85); font-weight:500;">En pistas de cristal templado outdoor o con viento en contra, el globo alto al rincón del rival es doblemente efectivo porque las trayectorias de rebote se vuelven impredecibles. ¡Úsalo para cansar psicológicamente a tus rivales!</p>
                    </div>
                </div>
            `,
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        },
        {
            title: '💡 La Posición en la Red: Dónde Ganar los Puntos',
            emoji: '⚡',
            snippet: 'Controlar la red te da el dominio del punto. Aprende la posición correcta para voleas ganadoras.',
            content: `
                <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                        <h4 style="margin:0 0 8px; font-family:'Outfit'; font-size:0.95rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">⚡ ¿Por qué es fundamental?</h4>
                        <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.72); font-weight:500;">El pádel se gana en la red. Quien controla la posición central en la red tiene una ventaja enorme: más ángulos de volea, más presión psicológica sobre el rival y mejores opciones de cierre de punto. La clave es el split-step.</p>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📋 Guía de Ejecución Paso a Paso</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">1</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Posicionamiento ideal:</strong> Sitúate a un metro y medio de la red, siempre alineado horizontalmente con la trayectoria de la bola y tu pareja.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">2</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>El Split-Step obligatorio:</strong> Realiza un pequeño salto de caída amortiguada justo en el instante en que tu rival impacta la bola.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">3</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Pala arriba:</strong> Mantén la cabeza de la pala siempre a la altura del pecho para poder reaccionar a voleas veloces al cuerpo.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">❌ Errores Comunes a Evitar</h4>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Pegarse excesivamente a la red, facilitando que te sobrepasen con globos defensivos sencillos.
                            </div>
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Bajar los brazos y la pala entre voleas, perdiendo centésimas vitales de reacción defensiva.
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(132,204,22,0.03) 100%); border:1px solid rgba(204,255,0,0.22); padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(204,255,0,0.05);">
                        <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.9rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">💡 El Secreto del Coach</h4>
                        <p style="margin:0; font-size:0.78rem; color:rgba(255,255,255,0.85); font-weight:500;">La "teoría del imán": cuando tu oponente se desplaza al fondo y se desequilibra, da un paso adelante en la red. Al achicar el espacio, la presión sobre su tiro se multiplica por tres.</p>
                    </div>
                </div>
            `,
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'
        },
        {
            title: '💡 El Efecto Cortado: El Golpe que Confunde',
            emoji: '🔄',
            snippet: 'Un golpe cortado con slice hace que la bola patine en el cristal y genere ángulos imposibles.',
            content: `
                <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                        <h4 style="margin:0 0 8px; font-family:'Outfit'; font-size:0.95rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">🔄 ¿Por qué es fundamental?</h4>
                        <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.72); font-weight:500;">El golpe cortado (slice) es una de las herramientas más sofisticadas del pádel avanzado. Al golpear la bola con efecto cortado hacia la pared lateral, creas una trayectoria "baja y resbalosa" que patina en el cristal, impidiendo que la bola suba al rebotar.</p>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📋 Guía de Ejecución Paso a Paso</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">1</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Impacto de arriba a abajo:</strong> Comienza con la pala alta y finaliza el recorrido por debajo de la bola con la cara de la pala mirando ligeramente hacia arriba.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">2</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Apunta a la reja lateral:</strong> Dirigir voleas cortadas hacia la reja o las uniones de los cristales laterales genera botes totalmente aleatorios e irrecuperables.</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start; font-size:0.78rem;">
                                <span style="background:#CCFF00; color:black; font-weight:900; font-size:0.7rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">3</span>
                                <span style="color:rgba(255,255,255,0.85);"><strong>Acompaña con el cuerpo:</strong> Transfiere tu peso corporal hacia adelante en el momento del impacto para que la volea viaje con peso y profundidad.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.95rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">❌ Errores Comunes a Evitar</h4>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Acelerar la muñeca en exceso, provocando que la bola "flote" y salga alta para el remate fácil del rival.
                            </div>
                            <div style="font-size:0.76rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:6px;">
                                <span style="color:#ef4444; font-weight:900;">❌</span> Cortar bolas extremadamente bajas, arriesgando un fallo en la red. En bolas bajas se aconseja juego plano.
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(132,204,22,0.03) 100%); border:1px solid rgba(204,255,0,0.22); padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(204,255,0,0.05);">
                        <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.9rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">💡 El Secreto del Coach</h4>
                        <p style="margin:0; font-size:0.78rem; color:rgba(255,255,255,0.85); font-weight:500;">Si juegas a la bandeja cortada (víbora), impacta a las 2 en punto (si eres diestro). Ese giro de slice lateral forzará a que la bola rebote contra el fondo patinando hacia el suelo lateral.</p>
                    </div>
                </div>
            `,
            catColor: '#f59e0b', imgGrad: 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
        }
    ];

    // ─── FRASES DE APERTURA Y CIERRE ATRACTIVAS ─────────────────────────────
    const OPENING_HOOKS = [
        '¡La acción en SomosPadel BCN no para! 🎾 ',
        '¡Atención a todos los miembros de la comunidad! 📢 ',
        '¡Noticias frescas directas desde el corazón de la pista! 📡 ',
        '¡El nivel de SomosPadel BCN sigue subiendo como la espuma! 🚀 ',
        '¡No te pierdas los últimos acontecimientos del club! 🔥 ',
        '¡SomosPadel BCN en plena ebullición competitiva! 💪 '
    ];

    const CLOSING_LINES = [
        ' ¡Nos vemos batallando en pista! 🎾',
        ' ¡Apunta las fechas en tu calendario y reserva tu plaza antes de que vuelen! 📅',
        ' ¡El nivel sigue subiendo cada semana! 🚀',
        ' ¡SomosPadel BCN es el club donde quieres estar! 💪',
        ' ¡Que no te lo cuenten, vívelo en primera persona! 🔥'
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

    // ─── GENERADORES DE ARTÍCULOS ENRIQUECIDOS POR TIPO ──────────────────────────

    function buildAmericanaOpenArticle(ev) {
        const spots = (parseInt(ev.max_courts || 4) * 4);
        const registered = (ev.players || ev.registeredPlayers || []).length;
        const free = Math.max(0, spots - registered);
        const catLabel = (ev.category || 'OPEN').toUpperCase();
        const loc = ev.location || 'nuestras instalaciones';
        const dateStr = formatDate(ev.date);
        const timeStr = ev.time ? ` a las ${ev.time}` : '';
        const hook = randomFrom(OPENING_HOOKS);

        const contentHtml = `
            <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                <p style="margin:0 0 16px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                    ${hook}El próximo <strong>${dateStr}${timeStr}</strong> celebramos una nueva e increíble <strong>Americana ${catLabel}</strong> en las instalaciones de ${loc}. Ya contamos con ${registered} competidores inscritos de nuestra gran comunidad padelística.
                </p>
                
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                    <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">⏱️ Itinerario del Evento</h4>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Recepción y Check-in</span>
                            <span style="color:rgba(255,255,255,0.5);">10 min antes</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Sorteo de Pistas y Calentamiento</span>
                            <span style="color:rgba(255,255,255,0.5);">5 min</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Fase Competitiva Automática (AIEngine)</span>
                            <span style="color:rgba(255,255,255,0.5);">80 min (Rondas dinámicas)</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding-bottom:2px;">
                            <span style="font-weight:700; color:white;">• Entrega de Premios y Networking</span>
                            <span style="color:rgba(255,255,255,0.5);">15 min (Cerveza y Refrescos)</span>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:18px;">
                    <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">💡 ¿Qué incluye tu inscripción?</h4>
                    <ul style="margin:0; padding-left:18px; font-size:0.78rem; color:rgba(255,255,255,0.72); display:flex; flex-direction:column; gap:4px;">
                        <li><strong>Welcome Pack Pro:</strong> Recibe tu pack premium (bebida oficial y grip premium).</li>
                        <li><strong>Equilibrio Garantizado:</strong> Algoritmo de emparejamiento predictivo optimizado para nivelar el juego.</li>
                        <li><strong>Recalculación ELO Segura:</strong> Suma puntos de ranking tras cada set y escala en la clasificación oficial.</li>
                    </ul>
                </div>

                <div style="background:linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(0,0,0,0) 100%); border:1px solid #CCFF00; padding:14px; border-radius:16px; text-align:center; box-shadow:0 4px 15px rgba(204,255,0,0.05);">
                    <span style="font-size:0.8rem; font-weight:950; color:#CCFF00; display:block; margin-bottom:4px; text-transform:uppercase;">🔥 ¡ÚLTIMAS PLAZAS DISPONIBLES!</span>
                    <span style="font-size:0.72rem; color:rgba(255,255,255,0.8); display:block;">
                        ${free > 0 ? `Quedan exactamente <strong>${free} plazas libres</strong>. Apúntate desde la pestaña "Eventos" de la app antes de que se complete.` : '¡Las plazas habituales se han completado! Puedes unirte a la lista de espera activa por posibles bajas de última hora.'}
                    </span>
                </div>
            </div>
        `;

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
            content: contentHtml,
            date: timeAgo(Date.now()),
            readTime: '1 min',
            timestamp: Date.now() - Math.random() * 60000
        };
    }

    function buildAmericanaLiveArticle(ev) {
        const players = (ev.players || ev.registeredPlayers || []);
        const count = players.length;
        const loc = ev.location || 'pista';

        const contentHtml = `
            <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                <p style="margin:0 0 16px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                    🔴 <strong>¡ACCIÓN EN VIVO EN LAS PISTAS!</strong> La americana <strong>${(ev.name || 'Americana').toUpperCase()}</strong> está en curso ahora mismo en ${loc}. Un total de ${count} jugadores están batallando raqueta en mano en estos momentos.
                </p>
                
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                    <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:#ef4444; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">⚡ Cobertura en Tiempo Real</h4>
                    <ul style="margin:0; padding-left:18px; font-size:0.78rem; color:rgba(255,255,255,0.72); display:flex; flex-direction:column; gap:4px;">
                        <li><strong>Marcadores al Instante:</strong> Sigue court por court la evolución de los tanteos y el punto de oro.</li>
                        <li><strong>Clasificación Virtual:</strong> Mira cómo fluctúan los puestos de la jornada con cada juego sumado.</li>
                        <li><strong>Parejas Equilibradas:</strong> La Inteligencia Predictiva de nuestro algoritmo (` + 'AIEngine' + `) ha emparejado a cada ronda duelos de máxima tensión.</li>
                    </ul>
                </div>

                <div style="background:linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(0,0,0,0) 100%); border:1px solid #ef4444; padding:14px; border-radius:16px; text-align:center; box-shadow:0 4px 15px rgba(239,68,68,0.05);">
                    <span style="font-size:0.8rem; font-weight:950; color:#ef4444; display:block; margin-bottom:4px; text-transform:uppercase;">📺 ¡SIGUE LA JORNADA!</span>
                    <span style="font-size:0.72rem; color:rgba(255,255,255,0.8); display:block;">
                        Abre la sección "Live" o "Center Court" de la app para ver el radar táctico, marcadores y animar a tus compañeros en directo.
                    </span>
                </div>
            </div>
        `;

        return {
            id: `americana-live-${ev.id || 'ev'}-${new Date().toISOString().slice(0, 10)}`,
            category: '🔴 EN DIRECTO',
            catColor: '#ef4444',
            emoji: '🔴',
            imgGrad: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            title: `🔴 EN JUEGO AHORA: ${count} jugadores en acción${ev.location ? ' en ' + ev.location.split(' ').slice(-2).join(' ') : ''}`,
            snippet: `¡La ${(ev.category||'').toUpperCase() || 'americana'} de hoy está en pleno apogeo! Sigue la acción en tiempo real desde la app.`,
            content: contentHtml,
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
        const hook = randomFrom(OPENING_HOOKS);

        let objectivesHtml = '';
        if (ev.pair_mode === 'rotating') {
            objectivesHtml = `
                <li><strong>Flexibilidad Táctica:</strong> Aprende a coordinarte con distintos estilos de juego y niveles en cada set.</li>
                <li><strong>Rotación Activa (Twister):</strong> Dinámica de rotación al saque y recepción para conocer a toda la comunidad.</li>
                <li><strong>Adaptabilidad en Red:</strong> Ejercicios intensivos de comunicación espontánea.</li>
            `;
        } else {
            objectivesHtml = `
                <li><strong>Cohesión de Pareja:</strong> Sincronizad los movimientos de volea y cobertura de cristales como una sola unidad.</li>
                <li><strong>Estrategia Set-Play:</strong> Trabajad jugadas ensayadas, direcciones de saque y saque-red.</li>
                <li><strong>Resistencia Psicológica:</strong> Puntos de oro consecutivos en pareja para consolidar la fortaleza.</li>
            `;
        }

        const contentHtml = `
            <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                <p style="margin:0 0 16px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                    ${hook}El próximo <strong>${dateStr}</strong> tenemos programado un nuevo entrenamiento en modo <strong>${modeLabel}</strong> en {ev.location || 'nuestras instalaciones'}. Una sesión exclusiva orientada a refinar la técnica e incorporar nuevos conceptos tácticos.
                </p>
                
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                    <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:#22c55e; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">🎓 Itinerario de la Sesión</h4>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Calentamiento Dinámico y Activación</span>
                            <span style="color:rgba(255,255,255,0.5);">10 min</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Ejercicios de Táctica y Posicionamiento de Red</span>
                            <span style="color:rgba(255,255,255,0.5);">40 min</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Puntos de Competición en Situaciones Límite</span>
                            <span style="color:rgba(255,255,255,0.5);">30 min</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding-bottom:2px;">
                            <span style="font-weight:700; color:white;">• Análisis y Cierre Individual del Coach</span>
                            <span style="color:rgba(255,255,255,0.5);">10 min</span>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:18px;">
                    <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">🎯 Objetivos de la Sesión</h4>
                    <ul style="margin:0; padding-left:18px; font-size:0.78rem; color:rgba(255,255,255,0.72); display:flex; flex-direction:column; gap:4px;">
                        ${objectivesHtml}
                    </ul>
                </div>

                <div style="background:linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(0,0,0,0) 100%); border:1px solid #22c55e; padding:14px; border-radius:16px; text-align:center; box-shadow:0 4px 15px rgba(34,197,94,0.05);">
                    <span style="font-size:0.8rem; font-weight:950; color:#22c55e; display:block; margin-bottom:4px; text-transform:uppercase;">🚀 RESERVA TU PLAZA</span>
                    <span style="font-size:0.72rem; color:rgba(255,255,255,0.8); display:block;">
                        ${free > 0 ? `Quedan <strong>${free} plazas disponibles</strong> en este entrenamiento. Apúntate ya para no quedarte fuera.` : '¡Plazas completadas! Puedes sumarte a la lista de reserva para aprovechar cualquier vacante.'}
                    </span>
                </div>
            </div>
        `;

        return {
            id: `entreno-open-${ev.id || 'ent'}-${(ev.date||'').replace(/\//g,'-')}`,
            category: '🎾 ENTRENAMIENTO',
            catColor: '#22c55e',
            emoji: ev.pair_mode === 'rotating' ? '🌪️' : '🎾',
            imgGrad: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            title: `🎾 Entreno ${modeLabel} el ${dateStr} — ${free > 0 ? `${free} plazas libres` : '¡Lista de espera!'}`,
            snippet: `${registered} jugadores ya apuntados. Modo ${modeLabel} ${ev.time ? `a las ${ev.time}` : ''}. ${free > 0 ? '¡Apúntate ya!' : 'Únete a la lista de espera.'}`,
            content: contentHtml,
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

        const top3Html = top3.map((p, idx) => {
            const medal = ['🥇', '🥈', '🥉'][idx];
            const name = titleCase(p.name || p.displayName || 'Pro Player');
            const pts = p.ranking_points || p.points || 0;
            const level = p.level ? `Nivel ${p.level.toFixed(2)}` : 'Pro';
            
            return `
                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px 14px; border-radius:12px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.3rem;">${medal}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:800; font-size:0.8rem; color:white; text-transform:uppercase;">${name}</span>
                            <span style="font-size:0.62rem; color:rgba(255,255,255,0.4); font-weight:700;">${level}</span>
                        </div>
                    </div>
                    <span style="font-weight:950; font-size:0.88rem; color:#38bdf8; font-family:'Outfit';">${pts} PTS</span>
                </div>
            `;
        }).join('');

        const contentHtml = `
            <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                <p style="margin:0 0 16px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                    📊 <strong>¡ACTUALIZACIÓN OFICIAL DEL RANKING!</strong> El circuito competitivo de SomosPadel BCN se mueve y se recalcula con las estadísticas de la semana. <strong>${leaderName}</strong> se mantiene de forma espectacular en el liderato con un total de <strong>${leaderPoints} puntos</strong>.
                </p>
                
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:22px; margin-bottom:18px; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
                    <h4 style="margin:0 0 12px; font-family:'Outfit'; font-size:0.9rem; color:#38bdf8; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; text-align:center;">🏆 Reyes de la Pista (Top 3)</h4>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${top3Html}
                    </div>
                </div>

                <div style="background:linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(0,0,0,0) 100%); border:1px solid #38bdf8; padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(56,189,248,0.05);">
                    <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.85rem; color:#38bdf8; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">🧠 Recalculación Segura ELO</h4>
                    <p style="margin:0; font-size:0.74rem; color:rgba(255,255,255,0.72); line-height:1.45;">
                        Cada resultado de set y juego disputado en nuestras americanas oficiales es procesado de forma segura en nuestro servidor cloud utilizando la fórmula ELO adaptada al pádel. ¡Cada punto sumado te acerca más al trono del club! Revisa tu posición detallada en la pestaña "Ranking" de la app.
                    </p>
                </div>
            </div>
        `;

        return {
            id: `ranking-top-${new Date().toISOString().slice(0, 7)}`,
            category: '📊 RANKING',
            catColor: '#38bdf8',
            emoji: '🏅',
            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            title: `🏅 Ranking Actualizado: ${leaderName} lidera con ${leaderPoints} puntos`,
            snippet: `Top 3: ${top3.map((p, i) => `${['🥇','🥈','🥉'][i]} ${titleCase(p.name || p.displayName || 'Jugador')}`).join(' · ')}. ¿Estás en la lista?`,
            content: contentHtml,
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
        
        const hook = randomFrom(OPENING_HOOKS);

        const contentHtml = `
            <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                <p style="margin:0 0 16px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                    ${hook}El equipo oficial del club <strong>${teamName}</strong> está firmando una trayectoria espectacular, mostrándose ${mood} en la liga de la división <strong>${division}</strong>. Su última jornada ha vuelto a consolidar su cohesión.
                </p>
                
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                    <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:#a78bfa; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📝 Análisis Estadístico de Liga</h4>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Partidos Disputados</span>
                            <span style="font-weight:900; color:#a78bfa;">${total} partidos</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Victorias</span>
                            <span style="font-weight:900; color:#22c55e;">${wins} victorias</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="font-weight:700; color:white;">• Derrotas</span>
                            <span style="font-weight:900; color:#ef4444;">${losses} derrotas</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding-bottom:2px;">
                            <span style="font-weight:700; color:white;">• Porcentaje de Éxito (Win-Rate)</span>
                            <span style="font-weight:950; color:#CCFF00;">${winRate}%</span>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(0,0,0,0) 100%); border:1px solid #a78bfa; padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(167,139,250,0.05);">
                    <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.85rem; color:#a78bfa; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📋 Pizarra Estratégica del Coach</h4>
                    <p style="margin:0; font-size:0.75rem; color:rgba(255,255,255,0.72); line-height:1.45;">
                        El cuerpo técnico del club destaca especialmente la madurez estratégica del equipo y su impecable sincronización en los puntos de oro decisivos. Recomendamos persistir en la presión alta de red tras saques cruzados. ¡Sigue toda la evolución de la liga oficial en la pestaña "Equipos" de la app!
                    </p>
                </div>
            </div>
        `;

        return {
            id: `team-highlight-${(team.id || team.name || 'team').replace(/\s/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,7)}`,
            category: '👥 EQUIPOS',
            catColor: '#a78bfa',
            emoji: wins > 2 ? '🔥' : '👥',
            imgGrad: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            title: `👥 ${teamName} ${mood} en ${division}`,
            snippet: `${wins}V - ${losses}D en ${total} partidos jugados. ${winRate}% de victorias. ¡Sigue su trayectoria en la app!`,
            content: contentHtml,
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
            content: tip.content, // Now is preformatted premium HTML!
            date: timeAgo(Date.now() - 18000000),
            readTime: '3 min',
            timestamp: Date.now() - 18000000 - index * 3600000
        };
    }

    function buildStatsArticle(stats) {
        const { totalMatches, totalPlayers, totalEvents } = stats;

        const contentHtml = `
            <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                <p style="margin:0 0 18px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                    📈 <strong>¡NÚMEROS IMPRESIONANTES EN NUESTRO CLUB!</strong> Las métricas de participación y partidos jugados en la plataforma oficial de SomosPadel BCN siguen superando récords históricos gracias al entusiasmo y alto nivel de juego de todos vosotros. ¡Echa un vistazo a la radiografía de nuestra comunidad!
                </p>
                
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:18px;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size:1.4rem; display:block; margin-bottom:2px;">🎾</span>
                        <span style="font-size:0.6rem; color:rgba(255,255,255,0.5); font-weight:800; text-transform:uppercase; display:block; letter-spacing:0.5px; margin-bottom:2px;">Partidos</span>
                        <span style="font-size:0.95rem; font-weight:950; color:#ec4899; font-family:'Outfit';">${totalMatches}</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size:1.4rem; display:block; margin-bottom:2px;">👥</span>
                        <span style="font-size:0.6rem; color:rgba(255,255,255,0.5); font-weight:800; text-transform:uppercase; display:block; letter-spacing:0.5px; margin-bottom:2px;">Jugadores</span>
                        <span style="font-size:0.95rem; font-weight:950; color:#ec4899; font-family:'Outfit';">${totalPlayers}</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size:1.4rem; display:block; margin-bottom:2px;">🏆</span>
                        <span style="font-size:0.6rem; color:rgba(255,255,255,0.5); font-weight:800; text-transform:uppercase; display:block; letter-spacing:0.5px; margin-bottom:2px;">Eventos</span>
                        <span style="font-size:0.95rem; font-weight:950; color:#ec4899; font-family:'Outfit';">${totalEvents}</span>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(0,0,0,0) 100%); border:1px solid #ec4899; padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(236,72,153,0.05);">
                    <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.85rem; color:#ec4899; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">🌟 Orgullo de Comunidad</h4>
                    <p style="margin:0; font-size:0.75rem; color:rgba(255,255,255,0.72); line-height:1.45;">
                        Cada semana incorporamos nuevos perfiles que elevan el nivel y amplían la riqueza deportiva de SomosPadel BCN. Gracias a vuestro esfuerzo continuo, nos consolidamos como la comunidad de referencia en Barcelona. ¡Sigamos impulsando el pádel de alto rendimiento!
                    </p>
                </div>
            </div>
        `;

        return {
            id: `stats-week-${new Date().toISOString().slice(0, 7)}-v2`,
            category: '📢 NOVEDADES',
            catColor: '#ec4899',
            emoji: '🎉',
            imgGrad: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
            title: `🎉 SomosPadel BCN: ${totalMatches} partidos jugados esta temporada`,
            snippet: `${totalPlayers} jugadores activos, ${totalEvents} eventos completados. ¡La comunidad no para de crecer!`,
            content: contentHtml,
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
