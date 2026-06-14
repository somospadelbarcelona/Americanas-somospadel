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
    const TEMPLATES = [
        {
            title: "La Teoría del Centro: el Secreto de los Pros",
            category: "💡 CONSEJOS",
            catColor: "#f59e0b",
            imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop",
            emoji: "🎯",
            imgGrad: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
            snippet: "Reducir los ángulos del rival y provocar dudas en la pareja contraria jugando al medio.",
            contentTemplate: "El centro de la pista es el área más segura y eficaz para jugar en pádel. Al dirigir la bola al centro, reduces drásticamente los ángulos de rebote del rival, evitas que abran la bola a las paredes and generas dudas de comunicación entre la pareja contraria. <br><br>El jugador <strong>{PLAYER1}</strong> nos compartía su truco esta semana: <em>'Si juegas al centro con margen, obligas al rival a levantar la bola, dejándote una volea cómoda'</em>. Su compañero <strong>{PLAYER2}</strong> destaca la importancia de buscar globos profundos por el centro para recuperar la posición en la red sin regalar ángulos laterales.",
            readTime: "3 min"
        },
        {
            title: "Suela Omni vs. Suela Clay: ¿Qué zapatillas elegir?",
            category: "👟 MATERIAL",
            catColor: "#fb923c",
            imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
            emoji: "👟",
            imgGrad: "linear-gradient(135deg, #ffe066 0%, #facc15 100%)",
            snippet: "Analizamos las diferencias de agarre y durabilidad en pistas con mucha o poca arena.",
            contentTemplate: "Elegir el calzado correcto es fundamental para evitar resbalones y lesiones en el pádel. La suela Clay (o espiga) ofrece el máximo agarre, especialmente en pistas con bastante arena, permitiendo deslizar con control. Por otro lado, la suela Omni (con pequeños puntos) es ideal para pistas más secas o con menos arena. <br><br><strong>{PLAYER1}</strong> comentaba tras su último torneo: <em>'Desde que cambié a zapatillas con suela Clay, siento mucha más seguridad en las arrancadas hacia la red y mis tobillos sufren menos'</em>. Su compañero <strong>{PLAYER2}</strong> añade que la duración de la suela Clay suele ser mayor en pistas de césped artificial moderno.",
            readTime: "2 min"
        },
        {
            title: "Cómo prevenir la Epicondilitis o codo de tenista",
            category: "💪 SALUD",
            catColor: "#ef4444",
            imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop",
            emoji: "💪",
            imgGrad: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
            snippet: "Ejercicios de estiramiento y consejos sobre la elección del peso de tu pala.",
            contentTemplate: "La epicondilitis se produce por la sobrecarga de los tendones del codo debido a impactos repetitivos. Para prevenirla, es vital realizar un buen calentamiento de articulaciones y estiramientos específicos al terminar. <br><br><em>'Añadir un overgrip extra a mi pala me ayudó a relajar el agarre de la mano y alivió las molestias'</em>, nos aconseja <strong>{PLAYER1}</strong>. Su compañero <strong>{PLAYER2}</strong> recalca la importancia de no jugar con pelotas húmedas o excesivamente pesadas, ya que aumentan la vibración transmitida al brazo.",
            readTime: "3 min"
        },
        {
            title: "Nutrición y energía para Americanas de larga duración",
            category: "🍎 NUTRICIÓN",
            catColor: "#22c55e",
            imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop",
            emoji: "🍎",
            imgGrad: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
            snippet: "Pautas de hidratación y alimentación antes y durante competiciones de más de 2 horas.",
            contentTemplate: "Jugar una americana de más de dos horas exige rendimiento físico constante. Es recomendable consumir hidratos de carbono complejos unas horas antes y asegurar una buena hidratación previa. <br><br><strong>{PLAYER1}</strong> suele llevar plátanos y frutos secos en su bolsa: <em>'Una pequeña dosis de potasio y energía a mitad de la americana evita los calambres en las últimas partidas'</em>. Su compañero <strong>{PLAYER2}</strong> coincide en que la clave es hidratarse a pequeños sorbos en cada cambio de pista, incluso si no se siente sed inmediata.",
            readTime: "3 min"
        },
        {
            title: "El Globo: El golpe táctico más subestimado del pádel",
            category: "💡 CONSEJOS",
            catColor: "#38bdf8",
            imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop",
            emoji: "🎈",
            imgGrad: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
            snippet: "Por qué tirar un buen globo es más efectivo para ganar la red que buscar un remate arriesgado.",
            contentTemplate: "Muchos jugadores asocian el pádel con remates espectaculares, pero tácticamente el globo es el golpe más importante de este deporte. Un globo alto y profundo obliga a los rivales a abandonar la red y nos da tiempo para colocarnos en posición de ataque. <br><br><strong>{PLAYER1}</strong> nos explicaba su táctica: <em>'Un buen globo al rincón del rival suele abrir el centro de la pista para definir la siguiente bola con una volea cómoda'</em>. Su compañero <strong>{PLAYER2}</strong> nos recuerda que es mejor fallar un globo por alto (dando tiempo de reacción) que tirarlo plano y corto, facilitando el remate cómodo de los contrarios.",
            readTime: "2 min"
        },
        {
            title: "Fair Play: Cómo gestionar los cantos de bola dudosos",
            category: "🤝 COMUNIDAD",
            catColor: "#a855f7",
            imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&auto=format&fit=crop",
            emoji: "🤝",
            imgGrad: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)",
            snippet: "Consejos de convivencia y reglamento amistoso para mantener el buen ambiente en el club.",
            contentTemplate: "El pádel es un deporte social y el buen ambiente es la seña de identidad de nuestras americanas en SomosPadel. En partidos sin árbitro, es habitual que surjan dudas sobre botes. Lo más deportivo es repetir el punto ('dos bolas') ante cualquier discrepancia. <br><br>El jugador <strong>{PLAYER1}</strong> destaca: <em>'Venimos a disfrutar y a hacer deporte; un punto dudoso no vale la pena si genera mal ambiente en la pista'</em>. Su compañero <strong>{PLAYER2}</strong> añade que mantener una actitud positiva y aplaudir los buenos golpes de los rivales hace que la experiencia del torneo sea mucho mejor para todos.",
            readTime: "2 min"
        },
        {
            title: "Palas Blandas vs. Palas Duras: ¿EVA o FOAM?",
            category: "👟 MATERIAL",
            catColor: "#fb923c",
            imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop",
            emoji: "🎾",
            imgGrad: "linear-gradient(135deg, #fdba74 0%, #f97316 100%)",
            snippet: "Analizamos qué tipo de goma de pala se adapta mejor a tu estilo de juego.",
            contentTemplate: "Las palas blandas (con núcleo de FOAM o EVA Soft) ofrecen más salida de bola y absorben vibraciones, ideales para evitar lesiones. Las palas duras (con EVA de alta densidad) ofrecen mayor control y potencia si tienes fuerza de pegada. <br><br><strong>{PLAYER1}</strong> prefiere las blandas: <em>'Para defender en el fondo son comodísimas, despachan la bola sin esfuerzo'</em>. En cambio, <strong>{PLAYER2}</strong> opta por pala dura: <em>'Me da la precisión exacta en las voleas rápidas en la red y mayor control de dirección'</em>.",
            readTime: "2 min"
        },
        {
            title: "La Posición en la Red: Dónde ganar los puntos",
            category: "💡 CONSEJOS",
            catColor: "#f59e0b",
            imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop",
            emoji: "⚡",
            imgGrad: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
            snippet: "El pádel se gana en la red. Aprende la posición correcta para voleas ganadoras.",
            contentTemplate: "El pádel se gana en la red. Quien controla la posición central en la red tiene una ventaja enorme. Sitúate a un metro y medio de la red, y realiza el split-step obligatorio en el momento del impacto rival. <br><br><strong>{PLAYER1}</strong> aconseja: <em>'Si te pegas demasiado a la red, te pasarán con globos simples. Mantén la distancia adecuada'</em>. Su compañero <strong>{PLAYER2}</strong> nos recuerda que la cabeza de la pala debe estar siempre arriba a la altura del pecho para poder reaccionar a voleas rápidas al cuerpo.",
            readTime: "2 min"
        },
        {
            title: "El Efecto Cortado: El golpe que confunde al rival",
            category: "💡 CONSEJOS",
            catColor: "#f59e0b",
            imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop",
            emoji: "🔄",
            imgGrad: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            snippet: "Un golpe cortado con slice hace que la bola patine en el cristal y caiga rápidamente.",
            contentTemplate: "El golpe cortado (slice) es fundamental en el juego de red. Hace que la bola patine y no levante tras botar, especialmente contra las paredes. Al volear, entra siempre de arriba a abajo. <br><br><strong>{PLAYER1}</strong> comenta: <em>'Una volea cortada profunda a la reja lateral es letal por su bote totalmente aleatorio'</em>. Su pareja <strong>{PLAYER2}</strong> añade que en bolas muy bajas es preferible jugar plano para no arriesgar un fallo directo en la red.",
            readTime: "3 min"
        },
        {
            title: "Calentamiento Dinámico: Prepárate para rendir al 100%",
            category: "💪 SALUD",
            catColor: "#ef4444",
            imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop",
            emoji: "🔥",
            imgGrad: "linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)",
            snippet: "Entrar en calor antes de golpear evita lesiones y mejora tu velocidad de arranque.",
            contentTemplate: "Entrar en calor antes de golpear evita tirones musculares y mejora tu reactividad desde el primer punto. Dedica 5 minutos a carrera continua, desplazamientos laterales y rotación de articulaciones. <br><br><em>'Yo solía entrar frío a la pista hasta que me lesioné el gemelo por una arrancada brusca'</em>, confiesa <strong>{PLAYER1}</strong>. Su compañero <strong>{PLAYER2}</strong> coincide: <em>'Hacer unas sombras de golpes antes de empezar el peloteo te conecta físicamente'</em>.",
            readTime: "2 min"
        },
        {
            title: "Hidratación Inteligente: Qué beber antes y durante el partido",
            category: "🍎 NUTRICIÓN",
            catColor: "#22c55e",
            imageUrl: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop",
            emoji: "💧",
            imgGrad: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
            snippet: "La deshidratación reduce la fuerza y la concentración. Aprende a hidratarte adecuadamente.",
            contentTemplate: "La deshidratación reduce la concentración y la fuerza muscular. Beber solo agua no es suficiente en días calurosos porque perdemos electrolitos vitales por el sudor. <br><br><strong>{PLAYER1}</strong> nos da su fórmula: <em>'Mezclar agua con bebida isotónica en relación 1:1 me mantiene fresco y con energía sin pesadez estomacal'</em>. Su compañero <strong>{PLAYER2}</strong> recalca que debemos beber pequeños sorbos en cada cambio de pista sin esperar a sentir sed.",
            readTime: "2 min"
        },
        {
            title: "Comunicación en Pareja: Hablar en pista salva puntos",
            category: "🤝 COMUNIDAD",
            catColor: "#a855f7",
            imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&auto=format&fit=crop",
            emoji: "🗣️",
            imgGrad: "linear-gradient(135deg, #d8b4fe 0%, #a855f7 100%)",
            snippet: "Cantar la posición de los rivales y coordinar coberturas de pista salva sets.",
            contentTemplate: "Cantar la posición de los rivales cuando tu compañero va a golpear un globo de espaldas es vital. Utiliza comandos cortos como: 'Vienen', 'Atrás' o 'Centro'. <br><br><strong>{PLAYER1}</strong> destaca: <em>'Mi juego mejoró muchísimo cuando aprendí a hablarle a mi compañero entre puntos'</em>. Su compañero <strong>{PLAYER2}</strong> concluye: <em>'Una pareja coordinada que se comunica bien puede ganarle a dos individualistas de mayor nivel'</em>.",
            readTime: "3 min"
        },
        {
            title: "Cómo remontar un Match Point en contra en el punto de oro",
            category: "🧠 MENTAL",
            catColor: "#38bdf8",
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop",
            emoji: "🎯",
            imgGrad: "linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%)",
            snippet: "Ante un punto de partido en contra, la calma y el juego central son tus mejores armas.",
            contentTemplate: "Ante un punto de partido en contra, la clave es no precipitarse ni jugar con prisa. Fuerza un punto largo y deja que la presión pase a la pareja rival. <br><br><strong>{PLAYER1}</strong> recuerda: <em>'Estábamos 40-0 abajo en el set definitivo y decidimos asegurar la bola por el centro. Forzamos su error y remontamos'</em>. Su compañero <strong>{PLAYER2}</strong> añade que mantener una respiración pausada entre puntos reduce el estrés competitivo.",
            readTime: "3 min"
        },
        {
            title: "La Ley de la Concentración: Mantenerse enfocado",
            category: "🧠 MENTAL",
            catColor: "#38bdf8",
            imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop",
            emoji: "🧠",
            imgGrad: "linear-gradient(135deg, #c084fc 0%, #3b82f6 100%)",
            snippet: "El pádel es un deporte de rachas. Evita frustrarte por fallos simples y concéntrate.",
            contentTemplate: "El pádel es un juego de rachas psicológicas. Evita frustrarte por fallos fáciles y mantén el foco en la siguiente bola. <br><br><strong>{PLAYER1}</strong> nos comparte su técnica: <em>'Hago rebotar la pelota tres veces antes del saque para forzarme a concentrarme'</em>. Su compañero <strong>{PLAYER2}</strong> recomienda no discutir tácticas complejas durante el set si hay tensión, sino apoyarse mutuamente con gestos positivos.",
            readTime: "2 min"
        },
        {
            title: "La Chiquita Decisiva: El golpe táctico avanzado",
            category: "🏫 CLINIC",
            catColor: "#ec4899",
            imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop",
            emoji: "🎾",
            imgGrad: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
            snippet: "Cómo y cuándo jugar una bola lenta a los pies del rival para ganar la red.",
            contentTemplate: "La chiquita consiste en golpear una bola lenta a los pies de los rivales que están en la red para obligarles a volear por debajo del nivel de la red. <br><br><strong>{PLAYER1}</strong> nos cuenta: <em>'Si colocas una chiquita al pie, puedes subir rápidamente con tu pareja a bloquear su volea forzada'</em>. Su compañero <strong>{PLAYER2}</strong> advierte que jugarla con demasiada velocidad la convierte en un tiro cómodo para el rival.",
            readTime: "2 min"
        },
        {
            title: "Bandeja vs. Víbora: Diferencias y cuándo usar cada golpe",
            category: "🏫 CLINIC",
            catColor: "#ec4899",
            imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop",
            emoji: "🐍",
            imgGrad: "linear-gradient(135deg, #f472b6 0%, #be185d 100%)",
            snippet: "Aprende a diferenciar el armado y el efecto de los dos golpes aéreos por excelencia.",
            contentTemplate: "La bandeja busca mantener la posición de la red con un golpe seguro y cortado. La víbora es más agresiva, con efecto lateral-cortado para definir o desestabilizar. <br><br><strong>{PLAYER1}</strong> explica: <em>'Uso la bandeja para bolas muy altas, y la víbora cuando la bola queda más cómoda a mi derecha'</em>. Su compañero <strong>{PLAYER2}</strong> añade que la víbora requiere transferir más el peso del cuerpo hacia adelante e impactar a la altura de la sien.",
            readTime: "2 min"
        },
        {
            title: "El Remate por 3 y por 4: Cómo definir el punto",
            category: "📡 REGLAMENTO",
            catColor: "#0ea5e9",
            imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop",
            emoji: "💥",
            imgGrad: "linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)",
            snippet: "Reglas de recuperación fuera de pista tras un remate liftado de los contrarios.",
            contentTemplate: "Un remate 'por 3' hace que la bola salga por el lateral de la pista. Los rivales pueden salir a recuperarla si hay espacio de juego autorizado. Un remate 'por 4' sale por el fondo, siendo punto directo. <br><br><strong>{PLAYER1}</strong> opina: <em>'Para sacar la bola por 3 necesitas golpear con efecto liftado e impacto alto'</em>. Su compañero <strong>{PLAYER2}</strong> destaca que el jugador defensor no puede tocar la red ni invadir el campo contrario al recuperar.",
            readTime: "2 min"
        },
        {
            title: "ELO y Matchmaking: La ciencia detrás de SomosPadel",
            category: "📡 REGLAMENTO",
            catColor: "#0ea5e9",
            imageUrl: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop",
            emoji: "📊",
            imgGrad: "linear-gradient(135deg, #93c5fd 0%, #1e40af 100%)",
            snippet: "Te explicamos cómo nuestro algoritmo equilibra las pistas según tus partidos.",
            contentTemplate: "Nuestro sistema recalcula los puntos tras cada set disputado en americanas usando un algoritmo ELO adaptado. Si vences a parejas de mayor nivel, sumas más puntos de ranking. <br><br><strong>{PLAYER1}</strong> nos decía: <em>'Es genial ver cómo se equilibra el nivel de la americana ronda a ronda'</em>. Su compañero <strong>{PLAYER2}</strong> añade que jugar partidos oficiales asegura una clasificación más ajustada a la realidad de tu nivel.",
            readTime: "2 min"
        },
        {
            title: "Cómo elegir el peso ideal de tu pala de pádel",
            category: "👟 MATERIAL",
            catColor: "#fb923c",
            imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop",
            emoji: "⚖️",
            imgGrad: "linear-gradient(135deg, #fde047 0%, #ca8a04 100%)",
            snippet: "Manejabilidad vs. Potencia: encuentra el gramaje ideal según tu complexión física.",
            contentTemplate: "Una pala ligera (menos de 360g) ofrece manejabilidad y rapidez de red, ideal para jugadores amateurs. Una pala pesada (más de 370g) da más potencia pero fatiga el brazo. <br><br><strong>{PLAYER1}</strong> aconseja: <em>'Empezar con una pala ligera te ayuda a pulir la técnica sin sobrecargar tu codo'</em>. Su compañero <strong>{PLAYER2}</strong> añade que el balance (puño o cabeza) influye tanto como el peso en la sensación de ligereza.",
            readTime: "2 min"
        },
        {
            title: "Táctica: Cómo defender el rebote de pared de fondo",
            category: "💡 CONSEJOS",
            catColor: "#f59e0b",
            imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop",
            emoji: "🎾",
            imgGrad: "linear-gradient(135deg, #fdba74 0%, #f97316 100%)",
            snippet: "Claves de posicionamiento y lectura del rebote para bolas profundas del rival.",
            contentTemplate: "La pared de fondo suele ser difícil al principio. La clave es acompañar la bola en su rebote: colócate siempre por detrás de la bola, flexiona bien las rodillas y mantén la pala baja. <br><br><strong>{PLAYER1}</strong> comparte su truco: <em>'Si dejas pasar la bola con calma y esperas al rebote, tienes mucho más tiempo del que crees para armar el golpe'</em>. Su compañero <strong>{PLAYER2}</strong> destaca mantener el cuerpo erguido en el impacto final.",
            readTime: "2 min"
        },
        {
            title: "Cómo preparar tu Americana: Guía del jugador perfecto",
            category: "🏆 TORNEOS",
            catColor: "#facc15",
            imageUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=600&auto=format&fit=crop",
            emoji: "🏆",
            imgGrad: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
            snippet: "Consejos para llegar en el mejor estado físico y mental a tu próxima americana.",
            contentTemplate: "Las americanas son el formato de torneo más popular del pádel amateur. Para rendir al máximo nivel, hay que prepararse física y tácticamente los días previos. <br><br><strong>{PLAYER1}</strong> nos revela su ritual: <em>'La noche antes duermo 8 horas y preparo el bolso con todo para no salir con estrés de casa'</em>. Su compañero <strong>{PLAYER2}</strong> añade que llegar 30 minutos antes del inicio permite hacer un buen calentamiento y conocer las pistas del torneo.",
            readTime: "3 min"
        },
        {
            title: "Ranking ELO: Cómo subir de nivel en SomosPadel BCN",
            category: "📈 RANKING",
            catColor: "#34d399",
            imageUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a26?q=80&w=600&auto=format&fit=crop",
            emoji: "📈",
            imgGrad: "linear-gradient(135deg, #6ee7b7 0%, #059669 100%)",
            snippet: "Estrategias para mejorar tu posición en el ranking y conseguir más puntos por set.",
            contentTemplate: "El sistema de ranking de SomosPadel BCN premia la consistencia y la dificultad de los rivales. Ganar un set a una pareja de mayor nivel suma más puntos que vencer a parejas de nivel menor. <br><br><strong>{PLAYER1}</strong> comparte su filosofía: <em>'Prefiero jugar contra los mejores y perder por poco que ganar fácil — aprendo más y sumo mejor'</em>. Su compañero <strong>{PLAYER2}</strong> destaca que la regularidad es clave: <em>'Jugar todas las semanas, aunque sea una americana pequeña, te mantiene activo en el ranking y evita penalizaciones de inactividad'</em>.",
            readTime: "2 min"
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

    // buildTacticalTipArticle ha sido unificado en la lógica de generación inteligente.

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

        async _getRealPlayers(db) {
            try {
                let snapshot = await db.collection('players').limit(15).get();
                if (snapshot.empty) {
                    snapshot = await db.collection('users').limit(15).get();
                }
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => {
                        const data = doc.data();
                        return data.name || data.displayName || "Alejandro Coscolín";
                    });
                }
            } catch (e) {
                console.warn("[AutoBlogEngine] Fallo al obtener jugadores reales, usando fallback:", e);
            }
            return ["Alejandro Coscolín", "Bernat Pecharromán", "Alberto Javier Martín", "Jordi Díaz", "Carlos Jiménez", "Jordi Díaz"];
        },

        async _getRecentCategories(db, limit = 5) {
            try {
                const snapshot = await db.collection('blog_posts')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => doc.data().category || '').filter(Boolean);
                }
            } catch (e) {
                console.warn('[AutoBlogEngine] No se pudieron obtener categorías recientes:', e);
            }
            return [];
        },

        async _getRecentFinishedEvents(db, limit = 2) {
            try {
                const snapshot = await db.collection('americanas')
                    .where('status', '==', 'finished')
                    .orderBy('date', 'desc')
                    .limit(limit)
                    .get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (e) {
                console.warn('[AutoBlogEngine] Fallo al leer americanas finalizadas con orden:', e);
                try {
                    const snapshot = await db.collection('americanas')
                        .where('status', '==', 'finished')
                        .limit(limit)
                        .get();
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (e2) {}
            }
            return [];
        },

        async _getRecentMatches(db, limit = 6) {
            try {
                const snapshot = await db.collection('matches')
                    .where('status', '==', 'finished')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (e) {
                console.warn('[AutoBlogEngine] Fallo al leer partidos con orden:', e);
                try {
                    const snapshot = await db.collection('matches')
                        .where('status', '==', 'finished')
                        .limit(limit)
                        .get();
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (e2) {}
            }
            return [];
        },

        async _getFutureEvents(db, limit = 3) {
            try {
                const snapshot = await db.collection('americanas')
                    .where('status', 'in', ['open', 'draft'])
                    .limit(limit)
                    .get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (e) {
                console.warn('[AutoBlogEngine] Fallo al leer eventos futuros:', e);
            }
            return [];
        },

        async _getTopPlayers(db, limit = 5) {
            try {
                let snapshot = await db.collection('players')
                    .orderBy('ranking_points', 'desc')
                    .limit(limit)
                    .get();
                if (snapshot.empty) {
                    snapshot = await db.collection('users')
                        .orderBy('ranking_points', 'desc')
                        .limit(limit)
                        .get();
                }
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (e) {
                console.warn('[AutoBlogEngine] Fallo al leer top players ordenados, buscando sin index:', e);
                try {
                    let snapshot = await db.collection('players').limit(30).get();
                    if (snapshot.empty) {
                        snapshot = await db.collection('users').limit(30).get();
                    }
                    if (!snapshot.empty) {
                        const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        return players
                            .sort((a, b) => (b.ranking_points || b.points || 0) - (a.ranking_points || a.points || 0))
                            .slice(0, limit);
                    }
                } catch (e2) {}
            }
            return [];
        },

        async _generateWithGemini(key, realData, usedCategories = []) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            
            const articleTypes = ['cronica', 'masterclass', 'radar'];
            const chosenType = articleTypes[Math.floor(Math.random() * articleTypes.length)];
            
            let typePrompt = '';
            let categoryName = '💡 CONSEJOS';
            let catColor = '#f59e0b';
            let emoji = '💡';
            
            const formattedMatches = (realData.recentMatches || []).map(m => {
                return `- ${m.team_a_names ? m.team_a_names.join(' y ') : 'Pareja A'} vs ${m.team_b_names ? m.team_b_names.join(' y ') : 'Pareja B'} | Resultado: ${m.score_a || 0}-${m.score_b || 0} (${m.event_name || 'Partido Amistoso'})`;
            }).join('\n');
            
            const formattedEvents = (realData.recentEvents || []).map(e => {
                return `- Americana "${e.name || 'Torneo'}" celebrada el ${e.date || 'Reciente'}. Ubicación: ${e.location || 'Club'}. Estado: Finalizado.`;
            }).join('\n');

            const formattedTopPlayers = (realData.topPlayers || []).map((p, idx) => {
                const medal = ['🥇', '🥈', '🥉', '4º', '5º'][idx] || '•';
                return `${medal} ${p.name || p.displayName || 'Jugador'} - ${p.ranking_points || p.points || 0} PTS (Nivel: ${p.level ? p.level.toFixed(2) : '3.5'})`;
            }).join('\n');
            
            const formattedFutureEvents = (realData.futureEvents || []).map(e => {
                return `- Americana "${e.name || 'Torneo'}" programada para el ${e.date || 'Próximamente'}. Ubicación: ${e.location || 'Club'}.`;
            }).join('\n');
            
            if (chosenType === 'cronica') {
                categoryName = '🏆 TORNEOS';
                catColor = '#CCFF00';
                emoji = '🏆';
                typePrompt = `
                Escribe una CRÓNICA DEPORTIVA real y emocionante sobre los acontecimientos recientes en el club SomosPadel BCN.
                Usa la siguiente información de partidos y torneos jugados recientemente:
                ---
                PARTIDOS RECIENTES FINALIZADOS:
                ${formattedMatches || 'No hay partidos registrados recientemente. Invéntate una crónica sobre la última americana del viernes.'}
                
                ÚLTIMOS TORNEOS/AMERICANAS JUGADOS:
                ${formattedEvents || 'No hay torneos registrados recientemente.'}
                ---
                
                Instrucciones:
                1. El título debe ser llamativo y con tono periodístico deportivo (ej. "Tensión y épica en las pistas: Resumen de la última jornada").
                2. Redacta el artículo en español con un tono motivador, analizando los marcadores y el rendimiento de las parejas.
                3. Haz mención a jugadores reales del club basándote en los datos anteriores (por ejemplo: ${realData.player1} y ${realData.player2}).
                4. Crea una sección '🎯 ¿Qué nos dejó la jornada?' que analice las claves de los partidos.
                5. Incluye opiniones inventadas o declaraciones entre comillas de los jugadores sobre lo reñido que estuvo el punto de oro o la red.
                `;
            } else if (chosenType === 'masterclass') {
                categoryName = '💡 CONSEJOS';
                catColor = '#f59e0b';
                emoji = '⚡';
                
                const strokes = ['la Víbora', 'el Globo de recuperación', 'la Chiquita a los pies', 'la Volea de centro de control', 'la Bandeja de mantenimiento', 'el Remate por 3 liftado'];
                const chosenStroke = strokes[Math.floor(Math.random() * strokes.length)];
                
                typePrompt = `
                Escribe una MASTERCLASS TÁCTICA avanzada para el blog de SomosPadel BCN sobre cómo dominar: "${chosenStroke}".
                
                Instrucciones:
                1. El título debe ser atractivo y orientado a la mejora del nivel del jugador amateur (ej. "El arte de ${chosenStroke}: El secreto para ganar la red").
                2. Explica la técnica de golpeo, el posicionamiento del cuerpo y cuándo utilizarlo tácticamente.
                3. Nombra a dos jugadores reales del club para simular sus testimonios: '${realData.player1}' y '${realData.player2}'. Invéntate consejos cortos o anécdotas entre comillas sobre cómo ellos ejecutan o defienden este golpe.
                4. Crea la sección obligatoria '🎯 ¿Por qué es fundamental?'.
                5. Agrega una guía numerada paso a paso.
                6. Incluye una sección '❌ Errores Comunes a Evitar'.
                7. Cierra con un bloque de degradado titulado '💡 El Secreto del Coach' con un tip técnico avanzado.
                `;
            } else { // radar
                categoryName = '📊 RANKING';
                catColor = '#38bdf8';
                emoji = '📈';
                typePrompt = `
                Escribe un artículo de análisis sobre el RADAR DEL RANKING ELO y las novedades de la comunidad SomosPadel BCN.
                Usa los siguientes datos del ranking actual y los próximos eventos programados:
                ---
                TOP 5 RANKING ELO ACTUAL:
                ${formattedTopPlayers || '1. Bernat Pecharromán - 1200 PTS\n2. Jordi Díaz - 1180 PTS\n3. Alejandro Coscolín - 1150 PTS'}
                
                PRÓXIMAS AMERICANAS Y EVENTOS ABIERTOS:
                ${formattedFutureEvents || 'No hay eventos futuros listados. Anima a la comunidad a reservar pista y estar atentos a la app.'}
                ---
                
                Instrucciones:
                1. El título debe referirse al ranking y la competitividad sana (ej. "¡Terremoto en el Ranking! La lucha por el número 1 de la semana").
                2. Analiza los puntos y niveles de los líderes del club. Felicita al top del ranking y comenta lo ajustado que está el nivel de juego.
                3. Haz mención a ${realData.player1} y ${realData.player2} como contendientes del ranking.
                4. Explica brevemente cómo funciona el algoritmo ELO que recalcula los puntos de nivel tras cada set de americana oficial.
                5. Anima a los jugadores a inscribirse en los eventos futuros descritos arriba para sumar más puntos y subir en la clasificación.
                `;
            }

            const prompt = `
            Eres un periodista deportivo, redactor oficial e instructor de élite de la comunidad SomosPadel BCN.
            Tu tarea es redactar un artículo de blog/noticia fascinante en español sobre pádel.
            
            ${typePrompt}
            
            Debes devolver ÚNICAMENTE un objeto JSON estructurado con los siguientes campos (no incluyas comentarios ni marcas markdown, solo el JSON limpio):
            
            {
              "title": "Un título de alta conversión y llamativo relacionado con el tema",
              "snippet": "Resumen corto de 1-2 líneas de gancho para el lector",
              "category": "${categoryName}",
              "catColor": "${catColor}",
              "emoji": "${emoji}",
              "imageUrl": "Elige una URL de imagen de Unsplash según el tema. Puedes usar:
                           - Para Táctica/Clinic: https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop
                           - Para Material: https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop
                           - Para Salud/Mental: https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop
                           - Para Nutrición/Comunidad: https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&auto=format&fit=crop
                           - Para Ranking/Estadísticas: https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop
                           (U otra URL similar de Unsplash de alta calidad)",
              "imgGrad": "Un gradiente lineal CSS sutil para la cabecera (ej: linear-gradient(135deg, #fb923c 0%, #f97316 100%))",
              "content": "El cuerpo del artículo en formato HTML. Debe ser extenso (mínimo 300 palabras), estructurado e incluir:
                          1. Introducción emocionante.
                          2. Un bloque con fondo traslúcido y borde sutil (background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px;) titulado '🎯 ¿Por qué es fundamental?' o '📊 Lo que revela el análisis'.
                          3. Desarrollo estructurado en varios párrafos con títulos claros o una guía paso a paso.
                          4. Ejemplos prácticos y anécdotas de los jugadores reales del club mencionados.
                          5. Una sección de consejos prácticos o errores comunes a evitar en pista.
                          6. Un bloque final con degradado sutil (con borde coloreado, ej: border-left: 4px solid #CCFF00) titulado '💡 El Secreto del Coach' o '🔥 Conclusión del Analista' con una recomendación de alto nivel.",
              "readTime": "3 min"
            }
            `;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini HTTP Error ${response.status}`);
            }

            const data = await response.json();
            const jsonText = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(jsonText);

            return {
                title: parsed.title,
                category: parsed.category || categoryName,
                catColor: parsed.catColor || catColor,
                imageUrl: parsed.imageUrl || (chosenType === 'cronica' ? 'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop'),
                snippet: parsed.snippet,
                content: parsed.content,
                date: 'Hoy',
                readTime: parsed.readTime || '3 min',
                emoji: parsed.emoji || emoji,
                imgGrad: parsed.imgGrad || 'linear-gradient(135deg, #1e293b, #0f172a)',
                timestamp: Date.now(),
                viewsCount: 0,
                lastReaderName: 'Ninguno'
            };
        },

        async _generateDynamicFallback(db, player1, player2) {
            this._addLog('📡 Construyendo artículo dinámico modular offline...', 'info');
            
            let topLeaderName = 'Alejandro Coscolín';
            let topLeaderPoints = 1200;
            try {
                const topPlayers = await this._getTopPlayers(db, 1);
                if (topPlayers.length > 0) {
                    topLeaderName = topPlayers[0].name || topPlayers[0].displayName || topLeaderName;
                    topLeaderPoints = topPlayers[0].ranking_points || topPlayers[0].points || topLeaderPoints;
                }
            } catch (e) {}

            const topics = [
                {
                    theme: 'la chiquita y la red',
                    category: '💡 CONSEJOS',
                    catColor: '#f59e0b',
                    emoji: '🎯',
                    imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    imageUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop',
                    titles: [
                        `Cómo ejecutar la chiquita perfecta y ganar la red`,
                        `El secreto táctico de la chiquita: de la defensa al ataque`,
                        `¿Bolas a los pies? Domina la chiquita esta semana`
                    ],
                    intro: `El juego moderno de pádel se gana en la red, pero subir de forma descontrolada suele ser sinónimo de regalar el punto. Aquí es donde entra en juego la chiquita: un golpe suave, con control y dirigido a los pies de los rivales que están voleando.`,
                    why: `Jugar una bola baja y lenta obliga al rival a impactar por debajo del nivel de la red. Esto le impide atacar la bola y te otorga el tiempo necesario para presionar hacia adelante junto a tu compañero.`,
                    steps: [
                        `<strong>Preparación corta:</strong> Reduce el armado de la pala para esconder la dirección del golpe y asegurar el control.`,
                        `<strong>Lectura de pies:</strong> Espera a que los rivales retrocedan ligeramente o estén mal posicionados en la red.`,
                        `<strong>Acompañar la bola:</strong> Empuja suavemente de atrás hacia adelante en lugar de golpear de forma brusca.`
                    ],
                    playerQuotes: [
                        `"Cuando juego con {PLAYER1}, siempre me dice que tire la chiquita al centro para que no puedan abrir ángulos en la volea", nos comenta {PLAYER2}.`,
                        `Por su parte, {PLAYER1} destaca: "Es cuestión de paciencia. Si tiras una chiquita con demasiada velocidad, les regalas una volea cómoda a la altura del pecho. La clave es que caiga muerta a sus pies".`
                    ],
                    coachSecret: `El verdadero truco de los profesionales no es solo tirar la chiquita, sino hacer el sprint de transición inmediatamente después del golpe. No te quedes mirando; si la bola baja, tu sitio está pegado a la red.`
                },
                {
                    theme: 'la prevención del codo de tenista (epicondilitis)',
                    category: '💪 SALUD',
                    catColor: '#ef4444',
                    emoji: '💪',
                    imgGrad: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
                    titles: [
                        `Evita el codo de tenista: Guía de salud para padeleros`,
                        `Cómo prevenir lesiones de codo jugando tres veces por semana`,
                        `Salud en pista: Protege tus articulaciones al volear`
                    ],
                    intro: `La epicondilitis lateral, comúnmente llamada codo de tenista, es una de las afecciones más molestas e incapacitantes del pádel amateur. Se genera por la inflamación de los tendones que unen los músculos del antebrazo con el exterior del codo debido a la vibración del impacto.`,
                    why: `Un codo sano te permite golpear con soltura, mantener la precisión en los globos y, sobre todo, disfrutar del deporte sin dolor residual al terminar tus partidos.`,
                    steps: [
                        `<strong>Grip adecuado:</strong> Asegúrate de que el grosor de tu puño sea el correcto (debe quedar un espacio del ancho de un dedo índice entre tus dedos y la palma).`,
                        `<strong>Peso de la pala:</strong> Jugar con una pala demasiado pesada o con balance muy alto sobrecarga tu musculatura innecesariamente.`,
                        `<strong>Calentamiento específico:</strong> Dedica al menos 3 minutos a calentar muñecas, codo y hombro antes de realizar el primer remate.`
                    ],
                    playerQuotes: [
                        `"Yo solía jugar con dolores hasta que {PLAYER1} me recomendó añadir un overgrip extra de absorción", recuerda {PLAYER2}.`,
                        `A esto, {PLAYER1} añade: "Muchos cometen el error de jugar con bolas muy gastadas o mojadas. Esas bolas no rebotan y transmiten toda la fuerza del impacto directamente al codo".`
                    ],
                    coachSecret: `Realizar estiramientos del antebrazo (con el brazo extendido y la palma hacia abajo, tirando de los dedos hacia el cuerpo) durante 20 segundos después de cada partido reducirá la tensión acumulada de forma drástica.`
                },
                {
                    theme: 'la táctica del globo profundo',
                    category: '🏫 CLINIC',
                    catColor: '#ec4899',
                    emoji: '🎈',
                    imgGrad: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)',
                    imageUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop',
                    titles: [
                        `El Globo: La herramienta táctica más poderosa en el pádel`,
                        `Cómo tirar globos defensivos que ahoguen al rival en el fondo`,
                        `Táctica de pádel: Recupera la red con globos milimétricos`
                    ],
                    intro: `Muchos jugadores asocian el pádel con remates potentes y jugadas espectaculares, pero tácticamente el globo es el golpe más decisivo de este deporte. Un buen globo cambia la dinámica del punto por completo, forzando a los rivales a retroceder y ceder la red.`,
                    why: `El globo te da tiempo para recuperar la posición defensiva, reduce la presión del rival y te permite pasar al ataque sin arriesgar un golpe plano de alta dificultad.`,
                    steps: [
                        `<strong>Flexión obligatoria:</strong> Entra por debajo de la bola flexionando las rodillas, no uses solo la muñeca.`,
                        `<strong>Terminación alta:</strong> Lleva la pala hacia el cielo al acabar el golpe para garantizar la altura necesaria.`,
                        `<strong>Dirección estratégica:</strong> Dirige la bola preferentemente al rincón del jugador de revés o al centro de la pista para sembrar dudas.`
                    ],
                    playerQuotes: [
                        `"Un globo corto contra la pareja de {PLAYER1} es un suicidio táctico; te la sacan por 3 inmediatamente", nos confiesa {PLAYER2}.`,
                        `{PLAYER1} sonríe y añade: "Totalmente. El secreto del globo no es que sea bonito, sino que sea alto. Cuanto más alta venga la bola, más difícil es coordinar el remate y más tiempo tenemos para tomar la red".`
                    ],
                    coachSecret: `Cuando estés muy forzado en el fondo de la pista, tira un globo extremadamente alto (globo de vela). Aunque no vaya profundo, la altura te dará el tiempo suficiente para volver a situarte en el centro de tu zona.`
                }
            ];

            const chosenTopic = topics[Math.floor(Math.random() * topics.length)];
            const title = chosenTopic.titles[Math.floor(Math.random() * chosenTopic.titles.length)];
            
            const formattedQuotes = chosenTopic.playerQuotes.map(q => {
                return q.replace(/{PLAYER1}/g, player1).replace(/{PLAYER2}/g, player2);
            }).join('<br><br>');

            const contentHtml = `
                <div style="font-family:'Inter', sans-serif; color:rgba(255,255,255,0.9); line-height:1.65;">
                    <p style="margin:0 0 16px; font-size:0.84rem; color:rgba(255,255,255,0.85); font-weight:500;">
                        ¡La comunidad SomosPadel BCN sigue aprendiendo y subiendo de nivel! Hoy analizamos a fondo <strong>${chosenTopic.theme}</strong>, un tema crucial para todo jugador que aspire a competir en las pistas de alto rendimiento.
                    </p>
                    
                    <p style="margin:0 0 16px; font-size:0.78rem; color:rgba(255,255,255,0.78);">
                        ${chosenTopic.intro}
                    </p>

                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:${chosenTopic.catColor}; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">🎯 ¿Por qué es fundamental?</h4>
                        <p style="margin:0; font-size:0.75rem; color:rgba(255,255,255,0.72); line-height:1.45;">
                            ${chosenTopic.why}
                        </p>
                    </div>

                    <div style="margin-bottom:18px;">
                        <h4 style="margin:0 0 10px; font-family:'Outfit'; font-size:0.9rem; color:white; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">📋 Guía de Ejecución en Pistas</h4>
                        <ol style="margin:0; padding-left:18px; font-size:0.78rem; color:rgba(255,255,255,0.72); display:flex; flex-direction:column; gap:6px;">
                            ${chosenTopic.steps.map(s => `<li>${s}</li>`).join('')}
                        </ol>
                    </div>

                    <div style="background:rgba(0,0,0,0.2); border-left:4px solid ${chosenTopic.catColor}; padding:14px; border-radius:8px; margin-bottom:18px; font-style:italic; font-size:0.75rem; color:rgba(255,255,255,0.85);">
                        ${formattedQuotes}
                    </div>

                    <div style="background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); padding:12px 16px; border-radius:12px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <span style="font-size:0.72rem; color:rgba(255,255,255,0.5);">📊 Estado del Ranking Semanal:</span>
                        <span style="font-size:0.72rem; font-weight:800; color:#38bdf8;">🥇 ${topLeaderName} lidera el club con ${topLeaderPoints} PTS</span>
                    </div>

                    <div style="background:linear-gradient(135deg, rgba(204,255,0,0.06) 0%, rgba(0,0,0,0) 100%); border:1px solid #CCFF00; padding:16px; border-radius:18px; box-shadow: 0 4px 15px rgba(204,255,0,0.03);">
                        <h4 style="margin:0 0 6px; font-family:'Outfit'; font-size:0.85rem; color:#CCFF00; font-weight:950; letter-spacing:0.5px; text-transform:uppercase;">💡 El Secreto del Coach</h4>
                        <p style="margin:0; font-size:0.75rem; color:rgba(255,255,255,0.72); line-height:1.45;">
                            ${chosenTopic.coachSecret}
                        </p>
                    </div>
                </div>
            `;

            return {
                title: title,
                category: chosenTopic.category,
                catColor: chosenTopic.catColor,
                imageUrl: chosenTopic.imageUrl,
                snippet: `${title}. Consejos prácticos de ejecución analizados con ${player1} y ${player2}.`,
                content: contentHtml,
                date: 'Hoy',
                readTime: '3 min',
                emoji: chosenTopic.emoji,
                imgGrad: chosenTopic.imgGrad,
                timestamp: Date.now(),
                viewsCount: 0,
                lastReaderName: 'Ninguno'
            };
        },

        async checkAndGeneratePassive() {
            try {
                const db = await this._getDB();
                if (!db) return;
                
                // 1. Obtener timestamp de última generación
                const statsDoc = await db.collection('config').doc('blog_stats').get();
                const now = Date.now();
                let lastGen = 0;
                
                if (statsDoc.exists) {
                    lastGen = statsDoc.data().last_generation_timestamp || 0;
                }
                
                // Intervalo de generación automática: 12 horas (12 * 3600 * 1000 milisegundos)
                const AUTO_INTERVAL = 12 * 3600 * 1000;
                
                if (now - lastGen >= AUTO_INTERVAL) {
                    console.log('🤖 [AutoBlog] Detectada necesidad de generación automática (más de 12 horas). Ejecutando...');
                    this._log = [];
                    this._addLog('🤖 Iniciando generación automática pasiva...', 'info');
                    
                    // Actualizar timestamp primero para evitar llamadas paralelas
                    await db.collection('config').doc('blog_stats').set({
                        last_generation_timestamp: now,
                        last_generation_date: new Date().toISOString()
                    }, { merge: true });
                    
                    // Ejecutar generación silenciosa
                    await this.generate({ silent: true });
                } else {
                    const diffHours = ((AUTO_INTERVAL - (now - lastGen)) / (3600 * 1000)).toFixed(1);
                    console.log(`🤖 [AutoBlog] Generación pasiva al día. Próxima auto-generación en ${diffHours} horas.`);
                }
            } catch (err) {
                console.warn('⚠️ Error en verificación pasiva de AutoBlog:', err);
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

            // ── GENERACIÓN DINÁMICA DE NOTICIAS DE PÁDEL / CONSEJOS (Gemini o Plantillas Deduplicadas) ──
            try {
                this._addLog('🧠 Iniciando generación de artículo educativo/consejos...', 'info');
                const players = await this._getRealPlayers(db);
                const p1Idx = Math.floor(Math.random() * players.length);
                let p2Idx = Math.floor(Math.random() * players.length);
                if (p2Idx === p1Idx) p2Idx = (p1Idx + 1) % players.length;
                const player1 = players[p1Idx];
                const player2 = players[p2Idx];

                // Sincronizar API Key desde Firestore si no está en localStorage
                let savedKey = localStorage.getItem('somospadel_gemini_api_key') || this.geminiApiKey || '';
                if (!savedKey) {
                    try {
                        const configDoc = await db.collection('config').doc('ai_config').get();
                        if (configDoc.exists) {
                            savedKey = configDoc.data().gemini_api_key || '';
                            if (savedKey) {
                                localStorage.setItem('somospadel_gemini_api_key', savedKey);
                                this.geminiApiKey = savedKey;
                            }
                        }
                    } catch (e) {
                        console.warn('[AutoBlogEngine] Fallo al recuperar API Key de Firestore:', e);
                    }
                }

                let newPost = null;
                let genTitle = '';

                // Obtener categorías de posts recientes
                const recentCategories = await this._getRecentCategories(db, 6);
                this._addLog(`📊 Categorías recientes en Firestore: ${recentCategories.join(', ') || 'ninguna'}`, 'info');

                // 1. Intentar con Gemini
                if (savedKey) {
                    try {
                        this._addLog('🧠 Extrayendo datos reales de Firestore para Gemini...', 'info');
                        const [recentEvents, recentMatches, topPlayers, futureEvents] = await Promise.all([
                            this._getRecentFinishedEvents(db, 2),
                            this._getRecentMatches(db, 6),
                            this._getTopPlayers(db, 5),
                            this._getFutureEvents(db, 3)
                        ]);

                        const realData = {
                            recentEvents,
                            recentMatches,
                            topPlayers,
                            futureEvents,
                            player1,
                            player2
                        };

                        this._addLog('🧠 Llamando a la API de Gemini para redactar artículo original con datos reales...', 'info');
                        newPost = await this._generateWithGemini(savedKey, realData, recentCategories);
                        genTitle = newPost.title;
                    } catch (geminiErr) {
                        this._addLog(`⚠️ Gemini falló: ${geminiErr.message}. Usando fallbacks...`, 'error');
                    }
                }

                // 2. Fallback con Generador Dinámico Modular Offline
                if (!newPost) {
                    try {
                        newPost = await this._generateDynamicFallback(db, player1, player2);
                        genTitle = newPost.title;
                    } catch (fallbackErr) {
                        this._addLog(`⚠️ Fallback dinámico falló: ${fallbackErr.message}. Usando plantilla estática básica...`, 'error');
                        
                        // Fallback de tercer nivel: Plantilla estática simple
                        const selectedTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
                        const content = selectedTemplate.contentTemplate
                            .replace(/{PLAYER1}/g, player1)
                            .replace(/{PLAYER2}/g, player2);

                        newPost = {
                            title: selectedTemplate.title,
                            category: selectedTemplate.category,
                            catColor: selectedTemplate.catColor,
                            imageUrl: selectedTemplate.imageUrl,
                            snippet: selectedTemplate.snippet,
                            content: content,
                            date: 'Hoy',
                            readTime: selectedTemplate.readTime,
                            emoji: selectedTemplate.emoji || '📰',
                            imgGrad: selectedTemplate.imgGrad || 'linear-gradient(135deg, #1e293b, #0f172a)',
                            timestamp: Date.now(),
                            viewsCount: 0,
                            lastReaderName: 'Ninguno'
                        };
                        genTitle = selectedTemplate.title;
                    }
                }

                if (newPost) {
                    const safeTitle = genTitle.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, '-').slice(0, 35);
                    newPost.id = `auto-post-admin-${safeTitle}-${Date.now().toString().slice(-4)}`;
                    articles.push(newPost);
                    this._addLog(`💡 Noticia de aprendizaje añadida para publicar: "${genTitle}"`, 'info');
                }

            } catch (e) {
                this._addLog(`⚠️ Error en consejos/IA: ${e.message}`, 'error');
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
