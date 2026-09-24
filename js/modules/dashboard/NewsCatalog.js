/**
 * NewsCatalog.js - Catálogo Masivo y Fototeca Curada para SomosPadel Journal
 * Multiplica por 100 el abanico de contenidos eliminando repeticiones de noticias y fotografías.
 */
(function () {
    'use strict';

    const PHOTO_LIBRARY = {
        // Pistas panorámicas, cristales y ambientación de pista
        courts: [
            'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=800&auto=format&fit=crop', // Pista cristal y red
            'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop', // Pista deportiva nocturna
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop', // Estadio iluminado
            'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop', // Pista azul moderno
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', // Instalaciones deportivas pro
            'img/pista_padel_azul.png',
            'img/blog_court_night.png'
        ],
        // Palas, pelotas en moqueta y material de juego
        material: [
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop', // Pelotas de tenis/pádel
            'https://images.unsplash.com/photo-1617083934555-563d61a29f8f?q=80&w=800&auto=format&fit=crop', // Raqueta y pelotas en suelo
            'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=800&auto=format&fit=crop', // Bola amarilla en primer plano
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', // Zapatillas deportivas de agarre
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop', // Suelas y calzado técnico
            'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop', // Calzado deportivo en pista
            'img/blog_racket_ball.png',
            'img/blog_ball_glass.png'
        ],
        // Acción de juego, voleas, remates y movimientos en pista
        action: [
            'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=800&auto=format&fit=crop', // Golpe dinámico en red
            'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop', // Salto y potencia deportiva
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop', // Movimiento atlético
            'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=800&auto=format&fit=crop', // Jugador concentrado en el punto
            'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop', // Velocidad y reacción
            'img/blog_action_smash.png'
        ],
        // Salud, fisioterapia, prevención de lesiones y recuperación
        health: [
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop', // Entrenamiento funcional
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop', // Estiramientos y movilidad
            'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop', // Fisioterapia y brazos
            'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop', // Masaje y recuperación muscular
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop'  // Flexibilidad y articulaciones
        ],
        // Nutrición deportiva, hidratación y energía
        nutrition: [
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop', // Frutas y comida sana
            'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop', // Hidratación con agua fresca
            'https://images.unsplash.com/photo-1522844990619-4951c40f7eda?q=80&w=800&auto=format&fit=crop', // Botella deportiva y energía
            'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=800&auto=format&fit=crop', // Frutos secos y snack de pista
            'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=800&auto=format&fit=crop'  // Smoothie recuperador
        ],
        // Psicología, concentración y mentalidad competitiva
        mental: [
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop', // Concentración y calma
            'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?q=80&w=800&auto=format&fit=crop', // Respiración y foco
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop', // Determinación mental
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'  // Mindset deportivo
        ],
        // Comunidad, parejas, celebración de puntos y fair play
        community: [
            'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=800&auto=format&fit=crop', // Amistad y grupo sonriendo
            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop', // Chocando manos / equipo
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop', // Emoción de equipo
            'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop', // Pareja de dobles
            'img/blog_player_victory.png',
            'img/blog_club_lounge.png'
        ],
        // Torneos, trofeos, americanas y podiums
        tournaments: [
            'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?q=80&w=800&auto=format&fit=crop', // Trofeo dorado
            'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?q=80&w=800&auto=format&fit=crop', // Medallas y celebración
            'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop', // Competición al máximo
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop', // Victoria en torneo
            'img/americana-night.png',
            'img/americana-pro.png'
        ]
    };

    // Pool aplanado para deduplicación masiva
    const ALL_PHOTOS = [
        ...PHOTO_LIBRARY.courts,
        ...PHOTO_LIBRARY.material,
        ...PHOTO_LIBRARY.action,
        ...PHOTO_LIBRARY.health,
        ...PHOTO_LIBRARY.nutrition,
        ...PHOTO_LIBRARY.mental,
        ...PHOTO_LIBRARY.community,
        ...PHOTO_LIBRARY.tournaments
    ];

    // Catálogo masivo de artículos curados y especializados de pádel
    const ARTICLES_DATABASE = [
        // ── 🚀 NOVEDADES APP ──────────────────────────────────────────────────
        {
            id: 'app-noticia-notificaciones-push-movil',
            title: '¡Llegan las Notificaciones Push en Vivo a SomosPadel Barcelona!',
            category: '🚀 NOVEDADES APP',
            catColor: '#0284c7',
            theme: 'tournaments',
            emoji: '🔔',
            imgGrad: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            readTime: '2 min',
            snippet: 'Activa las alertas en tu móvil y entérate al instante de nuevas americanas, entrenos de tu nivel y plazas libres antes que nadie.',
            contentTemplate: `¡Gran avance en la plataforma de <strong>SomosPadel Barcelona</strong>! Ya están disponibles las <strong>Notificaciones Push en tiempo real</strong> directamente en tu móvil y navegador.<br><br>
            <strong>¿Qué ventajas obtendrás al activarlas?</strong><br>
            • <strong>Nuevas Americanas y Torneos:</strong> Sé el primero en enterarte en cuanto se abran las inscripciones para asegurar tu plaza sin esperas.<br>
            • <strong>Entrenos Especializados por Nivel:</strong> Recibe avisos directos cuando Alex publique sesiones de pádel adaptadas a tu nivel y objetivo técnico.<br>
            • <strong>Radar de Plazas Libres y Bajas de Última Hora:</strong> Cuando alguien cause baja en un partido o americana, recibirás una alerta instantánea para apuntarte en un solo toque.<br>
            • <strong>Avisos Oficiales del Club:</strong> Cambios de pista por climatología, eventos especiales y novedades de la comunidad al instante.<br><br>
            <strong>¿Cómo activarlas en 1 clic?</strong><br>
            Solo tienes que pulsar el icono de campana 🔔 en la barra superior o en el banner de novedades del Inicio y hacer clic en <strong>'ACTIVAR NOTIFICACIONES PUSH AHORA'</strong>. Una vez activadas, puedes usar el botón <strong>'PROBAR AVISO'</strong> para comprobar la vibración y el sonido en tu teléfono al instante.<br><br>
            El capitán <strong>{PLAYER1}</strong> destaca: <em>'Ahora ya no te quedas fuera de ninguna americana por no mirar el grupo de WhatsApp a tiempo. Te salta la alerta al móvil y reservas tu plaza al momento'</em>. Su compañero <strong>{PLAYER2}</strong> aconseja tenerlas activas para no perderse los entrenos tácticos.`
        },
        // ── 🎮 MODOS DE JUEGO SOMOSPADEL BCN ──────────────────────────────────
        {
            id: 'modos-juego-pareja-fija-vs-twister',
            title: 'Pareja Fija vs Twister Individual: ¿En qué formato anotarte según tus objetivos?',
            category: '🎮 MODOS DE JUEGO',
            catColor: '#CCFF00',
            theme: 'tournaments',
            emoji: '🎮',
            imgGrad: 'linear-gradient(135deg, #0284c7 0%, #db2777 100%)',
            readTime: '4 min',
            snippet: 'Descubre las diferencias clave entre competir en tándem cerrado o en rotación individual dinámica en SomosPadel Barcelona.',
            contentTemplate: `En <strong>SomosPadel Barcelona</strong> contamos con dos formatos estelares diseñados para cubrir cualquier aspiración deportiva y social: <strong>Pareja Fija 👥</strong> y <strong>Twister Individual 🌪️</strong>.<br><br>
            <strong>1. Formato Pareja Fija (En Tándem):</strong><br>
            • <em>Dinámica:</em> Compites junto a tu compañero asignado o elegido de principio a fin del torneo.<br>
            • <em>Rotación de pistas:</em> Si ganáis vuestro partido en la ronda, <strong>subís juntos de pista</strong>; si perdéis, <strong>bajáis juntos</strong>. El objetivo es conquistar y retener la codiciada Pista 1 (Corona).<br>
            • <em>Puntuación:</em> Los juegos ganados y perdidos computan en equipo para vuestro ranking conjunto y oficial.<br>
            • <em>¿Para quién es?:</em> Ideal para parejas que compiten en ligas interclubs, torneos federados o buscan afianzar automatismos tácticos bajo presión.<br><br>
            <strong>2. Formato Twister Individual (Rotación Total):</strong><br>
            • <em>Dinámica:</em> <strong>Inscripción 100% individual</strong>. No necesitas buscar pareja previa: puedes venir solo y la plataforma organiza las pistas por niveles.<br>
            • <em>Rotación de pistas:</em> En cada ronda juegas con un compañero diferente. Si ganas tu partido, <strong>TÚ subes de pista y cambias de pareja</strong>; si pierdes, <strong>TÚ bajas de pista y cambias de pareja</strong>.<br>
            • <em>Puntuación:</em> Cada jugador suma sus propios juegos ganados. Al final, el podio individual se define por el total de juegos y el diferencial personal (+/-).<br>
            • <em>¿Para quién es?:</em> Perfecto para quienes buscan dinamismo, ampliar su círculo de pádel, mejorar su adaptabilidad y jugar siempre con y contra jugadores distintos en cada turno.<br><br>
            El capitán <strong>{PLAYER1}</strong> comenta: <em>'El Twister te enseña a leer el juego de cualquier compañero en dos puntos, mientras que la Pareja Fija pone a prueba la complicidad en momentos calientes'</em>. Su compañero <strong>{PLAYER2}</strong> recomienda alternar ambos modos a lo largo del mes para forjar un perfil de jugador completo.`
        },
        {
            id: 'modos-juego-suizo-americana-entreno',
            title: 'Sistema Suizo en SomosPadel: 6 Rondas Express, Puntos Individuales y Reagrupación por Pistas',
            category: '🎮 MODOS DE JUEGO',
            catColor: '#ef4444',
            theme: 'tournaments',
            emoji: '🇨🇭',
            imgGrad: 'linear-gradient(135deg, #ef4444 0%, #0f172a 100%)',
            readTime: '4 min',
            snippet: 'Descubre las normas oficiales del Sistema Suizo en Americanas y Entrenos: 2 horas, 6 rondas express, juegos ganados acumulados y cruces equilibrados sin repetir compañero.',
            contentTemplate: `Llega a <strong>SomosPadel Barcelona</strong> la tercera y más vibrante modalidad de juego: el <strong>Sistema Suizo 🇨🇭</strong> (disponible tanto para <em>Americana Suiza</em> como para <em>Entreno Suizo</em>), diseñado para garantizar máxima equidad competitiva y partidos de altísimo ritmo.<br><br>
            <strong>Normativa Oficial del Sistema Suizo:</strong><br>
            • <strong>Duración y Formato:</strong> Evento de <strong>2 horas de duración</strong> (habitualmente organizado en 3 pistas con 12 jugadores o proporcional). La inscripción es <strong>100% individual</strong> y cambias de compañero en cada ronda.<br>
            • <strong>6 Rondas Express de Juego Efectivo:</strong> Se disputan exactamente 6 rondas express para ir perfecto de tiempos. En cuanto suena el silbato de Alex, se acaba el punto en juego de forma inmediata.<br>
            • <strong>Puntuación Individual Acumulada:</strong> Se contabilizan los <strong>juegos totales que ganes en tu partido</strong> como tus puntos personales en la tabla general. Por ejemplo: si tu partido finaliza 6-3, tú y tu compañero sumáis 6 puntos cada uno en la clasificación; los rivales suman 3 puntos.<br>
            • <strong>Reagrupación por Pistas tras cada Ronda:</strong> Tras finalizar cada ronda, la plataforma suma los puntos acumulados de cada jugador y reorganiza las pistas:<br>
            &nbsp;&nbsp;🥇 <em>Pista 1 (Top):</em> Los 4 jugadores más altos en la tabla suben a la Pista 1.<br>
            &nbsp;&nbsp;🥈 <em>Pista 2 (Medios):</em> Los 4 siguientes clasificados van a la Pista 2.<br>
            &nbsp;&nbsp;🥉 <em>Pista 3 (Bajos):</em> Los 4 restantes disputan la Pista 3.<br>
            • <strong>Compañeros Equilibrados sin Repetición:</strong> En cada pista se cruzan las parejas para que los duelos sean ultra equilibrados y el algoritmo evita repetir compañero si es posible según el historial del torneo.<br>
            • <strong>Campeón del Torneo:</strong> Al concluir las 6 rondas, el jugador que acumule el mayor número de juegos sumados en la tabla general se corona Campeón Oficial del Torneo.<br><br>
            El jugador <strong>{PLAYER1}</strong> señala: <em>'El formato Suizo te exige darlo todo en cada juego: aquí no te conformas con ganar el partido, cada juego extra te impulsa hacia la Pista 1'</em>. Por su parte, <strong>{PLAYER2}</strong> resalta que la dinámica de 6 rondas mantiene una intensidad física y mental incomparable.`
        },
        {
            id: 'modos-juego-twister-individual-guia',
            title: 'Guía Táctica Twister: Cómo Adaptarte al Instante a una Nueva Pareja',
            category: '💡 CONSEJOS',
            catColor: '#ec4899',
            theme: 'action',
            emoji: '🌪️',
            imgGrad: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            readTime: '3 min',
            snippet: 'Comunicación express en 30 segundos, asignación de drive/revés y la clave psicológica para liderar en formato Twister.',
            contentTemplate: `Jugar una americana en formato <strong>Twister Individual</strong> es uno de los retos más divertidos y exigentes del pádel. Cambias de compañero en cada ronda, y el que mejor y más rápido se compenetre se lleva el diferencial de juegos hacia el podio.<br><br>
            <strong>Puntos clave para arrasar en Twister:</strong><br>
            1. <strong>Protocolo Express de 30 segundos:</strong> Nada más entrar a la pista con tu nueva pareja, acuerda dos cosas básicas: quién prefiere el revés y quién cubre el centro en globos entre medias.<br>
            2. <strong>Versatilidad de lado:</strong> Si dominas tanto el drive como el revés, tu porcentaje de victorias en Twister se dispara un 35%. Permites que tu nuevo compañero juegue en su zona de confort.<br>
            3. <strong>Refuerzo positivo inmediato:</strong> En rondas cortas no hay tiempo para reproches. Animar a tu pareja tras un error forzado genera confianza y evita que baje los brazos.<br>
            4. <strong>Liderazgo sin imposición:</strong> Marca las subidas a la red con voz clara pero tranquila ('subimos', 'tuya', 'mía').<br><br>
            <strong>{PLAYER1}</strong> nos cuenta: <em>'En el Twister no gana el mejor pegador individual, sino el jugador que hace jugar más cómodo al compañero que le toque en esa ronda'</em>. Por su parte, <strong>{PLAYER2}</strong> aconseja mantener una táctica sencilla en los dos primeros juegos de cada ronda para calibrar el ritmo antes de arriesgar.`
        },
        // ── 💡 TÁCTICA & ESTRATEGIA ─────────────────────────────────────────────
        {
            id: 'tactica-teoria-centro',
            title: 'La Teoría del Centro: El Secreto Más Seguro del Pádel',
            category: '💡 CONSEJOS',
            catColor: '#f59e0b',
            theme: 'courts',
            emoji: '🎯',
            imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
            readTime: '3 min',
            snippet: 'Reducir los ángulos del rival y provocar dudas en la pareja contraria jugando siempre al medio.',
            contentTemplate: `El centro de la pista es el área con mayor margen de error y mayor efectividad táctica del pádel moderno. Al dirigir la bola por el centro, reduces drásticamente los ángulos de rebote del rival, evitas que abran la bola con violencia hacia las rejas y generas dudas de comunicación ('¿tuya o mía?') entre la pareja contraria.<br><br>El jugador <strong>{PLAYER1}</strong> nos compartía su experiencia: <em>'Cuando jugamos bajo presión o vamos abajo en el marcador, tirar al centro nos calma el ritmo y obliga al rival a jugar bolas altas y sin ángulo'</em>. Por su parte, <strong>{PLAYER2}</strong> destaca que el centro debe combinarse con globos al rincón para abrir huecos definitivos.`
        },
        {
            id: 'tactica-transicion-defensa-ataque',
            title: 'El Arte de la Transición: Cómo Salir de la Pared y Ganar la Red',
            category: '💡 CONSEJOS',
            catColor: '#f59e0b',
            theme: 'action',
            emoji: '🏃‍♂️',
            imgGrad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            readTime: '4 min',
            snippet: 'Quedarse atrapado en el fondo es el error más común. Aprende el momento exacto para dar el salto ofensivo.',
            contentTemplate: `El pádel moderno se define por la velocidad de transición entre la fase defensiva y la ofensiva. Muchos jugadores cometen el error de subir a la red con cualquier bola o, por el contrario, quedarse anclados en el fondo por miedo.<br><br><strong>{PLAYER1}</strong> explica: <em>'Solo subimos a la red si nuestro globo ha sobrepasado claramente la línea de saque del rival y les obliga a retroceder de espaldas'</em>. <strong>{PLAYER2}</strong> añade que el 'split step' a mitad de pista antes de llegar a la red es obligatorio para no ser sorprendidos con una chiquita a los pies.`
        },
        {
            id: 'tactica-juego-contra-zurdos',
            title: 'Cómo Jugar Frente a un Zurdo en el Lado Derecho',
            category: '💡 CONSEJOS',
            catColor: '#f59e0b',
            theme: 'courts',
            emoji: '🔄',
            imgGrad: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            readTime: '3 min',
            snippet: 'Los efectos cambian y los remates se invierten. Guía táctica para neutralizar la ventaja zurda.',
            contentTemplate: `Enfrentarse a un jugador zurdo ubicado en el drive descoloca a casi cualquier pareja. Su volea de revés va al centro y su bandeja sale con efecto invertido hacia la malla metálica.<br><br><strong>{PLAYER1}</strong> aconseja: <em>'Debes evitar cruzar bolas al cristal lateral de un zurdo porque le estás regalando su golpe de derecha más cómodo'</em>. Su compañero <strong>{PLAYER2}</strong> recalca que cargar el juego por el centro obliga al zurdo y a su pareja diestra a chocar sus palas o ceder la iniciativa.`
        },
        {
            id: 'tactica-romper-ritmo-partido',
            title: 'Romper el Ritmo: Cómo Frenar a Rivales Rápidos y Pegadores',
            category: '💡 CONSEJOS',
            catColor: '#f59e0b',
            theme: 'mental',
            emoji: '⏳',
            imgGrad: 'linear-gradient(135deg, #f97316 0%, #b45309 100%)',
            readTime: '3 min',
            snippet: 'Si juegas a la misma velocidad que una pareja agresiva, perderás. Aprende a bajar los decibelios.',
            contentTemplate: `Cuando los rivales tienen remates potentes y voleas eléctricas, jugar rápido es caer en su trampa. La solución táctica es jugar lento: chiquitas suaves, globos a las nubes y pelotas sin peso.<br><br><em>'Nosotros solíamos perder ante parejas muy pegadoras hasta que empezamos a tirar bolas pesadas a la reja y globos de 8 metros de altura'</em>, revela <strong>{PLAYER1}</strong>. <strong>{PLAYER2}</strong> comenta: <em>'El pádel premia la paciencia; forzar tres bandejas seguidas del rival suele terminar en fallo no forzado'</em>.`
        },
        {
            id: 'tactica-defensa-doble-pared',
            title: 'Domina la Doble Pared que Abre: Lectura y Giros Perfectos',
            category: '💡 CONSEJOS',
            catColor: '#f59e0b',
            theme: 'courts',
            emoji: '📐',
            imgGrad: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            readTime: '4 min',
            snippet: 'Girar con la bola o esperarla de frente. El secreto visual para no perder nunca la orientación.',
            contentTemplate: `La doble pared que abre hacia el centro es una de las situaciones más temidas en el fondo de pista. El error habitual es correr hacia la bola en lugar de acompañar su trayectoria de rebote.<br><br><strong>{PLAYER1}</strong> nos da su truco: <em>'Sigue la bola con la mirada y gira sobre el pie de apoyo antes de que toque el segundo cristal; así impactarás siempre por delante del cuerpo'</em>. <strong>{PLAYER2}</strong> insiste en que un golpe seguro al medio tras la doble pared es mucho más rentable que intentar un tiro ganador imposible.`
        },

        // ── 👟 MATERIAL & EQUIPAMIENTO ──────────────────────────────────────────
        {
            id: 'material-suela-clay-vs-omni',
            title: 'Suela Omni vs. Suela Clay: ¿Qué Calzado Elegir en Pista?',
            category: '👟 MATERIAL',
            catColor: '#fb923c',
            theme: 'material',
            emoji: '👟',
            imgGrad: 'linear-gradient(135deg, #ffe066 0%, #facc15 100%)',
            readTime: '3 min',
            snippet: 'Analizamos las diferencias de tracción, durabilidad y protección articular según la cantidad de arena.',
            contentTemplate: `El tipo de suela de tus zapatillas determina tu velocidad de arrancada y protege tus rodillas y tobillos de torsiones peligrosas. La suela Clay (espiga profunda) es el estándar preferido para pistas con exceso de arena de sílice o moqueta rizada moderna.<br><br><strong>{PLAYER1}</strong> afirma: <em>'Con suela Clay puedo frenar en seco sin miedo a que el pie resbale en la red'</em>. Por contra, <strong>{PLAYER2}</strong> señala que en pistas indoor con moqueta monofilamento de última generación y poca arena, las suelas mixtas ofrecen un desplazamiento más fluido sin bloquearse en los giros.`
        },
        {
            id: 'material-goma-eva-vs-foam',
            title: 'Goma EVA Soft vs. Black EVA vs. FOAM: ¿Cuál se Adapta a Ti?',
            category: '👟 MATERIAL',
            catColor: '#fb923c',
            theme: 'material',
            emoji: '🎾',
            imgGrad: 'linear-gradient(135deg, #fdba74 0%, #f97316 100%)',
            readTime: '3 min',
            snippet: 'Dureza, punto dulce y salida de bola: cómo influye el núcleo de tu pala en la potencia y el control.',
            contentTemplate: `El núcleo de la pala es el corazón de tu juego. Las palas con espuma de FOAM o EVA Soft tienen un tacto elástico y confortable que absorbe vibraciones y genera una gran salida de bola a baja velocidad. Las palas de Black EVA o alta densidad requieren más fuerza en el golpe pero ofrecen un control milimétrico y potencia en el smash.<br><br><strong>{PLAYER1}</strong> nos cuenta: <em>'Para invierno y pistas frías, una goma más blanda te devuelve la sensibilidad que se pierde con las bolas frías'</em>. <strong>{PLAYER2}</strong> añade que si juegas en la izquierda y buscas definición, el tacto medio-duro es insustituible.`
        },
        {
            id: 'material-overgrips-y-peso',
            title: 'El Arte del Overgrip: Cómo un Milímetro Cambia el Balance',
            category: '👟 MATERIAL',
            catColor: '#fb923c',
            theme: 'material',
            emoji: '🔧',
            imgGrad: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)',
            readTime: '2 min',
            snippet: '¿Grosor fino o doble overgrip? Aprende a ajustar el puño para evitar que la pala gire en el impacto.',
            contentTemplate: `Un puño demasiado fino hace que aprietes la mano con excesiva tensión, causando fatiga en el antebrazo y tendinitis. Añadir un segundo overgrip o usar overgrips microperforados de alto agarre mejora la absorción de sudor y desplaza ligeramente el balance hacia el puño, ganando manejabilidad.<br><br><strong>{PLAYER1}</strong> nos comparte su rutina: <em>'Cambio el overgrip cada 3 o 4 partidos oficiales; cuando pierde adherencia, pierdes la precisión en la volea'</em>. <strong>{PLAYER2}</strong> recomienda probar muñequeras de algodón para que el sudor del brazo no llegue a empapar el puño.`
        },
        {
            id: 'material-presurizadores-pelotas',
            title: 'Presurizadores de Pelotas: ¿Ahorro Real o Mito en Padel?',
            category: '👟 MATERIAL',
            catColor: '#fb923c',
            theme: 'material',
            emoji: '⚡',
            imgGrad: 'linear-gradient(135deg, #fed7aa 0%, #f97316 100%)',
            readTime: '3 min',
            snippet: 'Probamos los tubos de presión hermética: cómo prolongar la vida útil de las bolas sin perder rebote.',
            contentTemplate: `Las pelotas de pádel pierden entre un 15% y un 25% de su presión interna tras su primer partido debido a la porosidad del caucho. Los botes presurizadores permiten almacenar las bolas a la presión adecuada (alrededor de 29-32 PSI), manteniendo el bote vivo durante semanas.<br><br><strong>{PLAYER1}</strong> destaca: <em>'Para los entrenamientos semanales, un bote presurizado te permite jugar 4 o 5 sesiones con el mismo tubo con sensación de bola recién abierta'</em>. <strong>{PLAYER2}</strong> recuerda que para partidos de liga oficial siempre es preferible abrir bote nuevo homologado.`
        },
        {
            id: 'material-palas-forma-balance',
            title: 'Forma Redonda, Lágrima o Diamante: Encuentra Tu Pala Perfecta',
            category: '👟 MATERIAL',
            catColor: '#fb923c',
            theme: 'material',
            emoji: '⚖️',
            imgGrad: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
            readTime: '3 min',
            snippet: 'El balance hacia la cabeza multiplica el remate pero penaliza la defensa. Claves de elección.',
            contentTemplate: `La geometría del marco define el comportamiento de la pala. Las palas redondas sitúan el punto dulce amplio y centrado cerca del puño, facilitando el control. Las palas de lágrima o gota de agua son las más versátiles y equilibradas. Las palas de diamante desplazan el peso hacia la cabeza para maximizar el efecto palanca en el remate.<br><br><strong>{PLAYER1}</strong> aconseja: <em>'A menos que tengas una técnica pulida y juegues a diario, una pala lágrima con balance medio te dará la mejor experiencia global'</em>. <strong>{PLAYER2}</strong> coincide en que las palas diamante demandan un físico muy trabajado para no lesionar el hombro.`
        },

        // ── 💪 SALUD, FISIOTERAPIA & PREVENCIÓN ──────────────────────────────────
        {
            id: 'salud-prevencion-epicondilitis',
            title: 'Cómo Prevenir y Tratar la Epicondilitis o Codo de Tenista',
            category: '💪 SALUD',
            catColor: '#ef4444',
            theme: 'health',
            emoji: '💪',
            imgGrad: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
            readTime: '3 min',
            snippet: 'Ejercicios excéntricos, estiramientos de extensores y consejos de peso para cuidar tu brazo.',
            contentTemplate: `La sobrecarga de los tendones extensores de la muñeca es la afección más frecuente en el pádel, provocada por impactos descentrados, bolas pesadas o exceso de vibraciones.<br><br><strong>{PLAYER1}</strong> relata cómo superó sus molestias: <em>'El fisioterapeuta me recomendó bajar 10 gramos al peso de mi pala y usar antivibradores de silicona en los agujeros centrales'</em>. <strong>{PLAYER2}</strong> subraya la necesidad de realizar ejercicios con goma elástica y estiramientos de antebrazo después de cada americana.`
        },
        {
            id: 'salud-fascitis-plantar-cesped',
            title: 'Fascitis Plantar en Césped Sintético: Síntomas y Cuidados',
            category: '💪 SALUD',
            catColor: '#ef4444',
            theme: 'health',
            emoji: '🦶',
            imgGrad: 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)',
            readTime: '3 min',
            snippet: 'El impacto continuo sobre superficie dura exige plantillas adecuadas y trabajo con pelota de tenis.',
            contentTemplate: `El suelo de una pista de pádel tiene una base rígida de hormigón debajo del césped artificial. Si no calzas zapatillas con buena amortiguación en el talón, la fascia plantar sufre microtraumatismos en cada frenada.<br><br><strong>{PLAYER1}</strong> nos comparte su truco de recuperación: <em>'Hacer rodar una pelota de pádel o una botella congelada bajo la planta del pie durante 10 minutos al llegar a casa desinflama el arco del pie'</em>. <strong>{PLAYER2}</strong> recomienda realizar un estudio biomecánico de la pisada si juegas más de dos veces por semana.`
        },
        {
            id: 'salud-calentamiento-manguito-rotador',
            title: 'Protege Tus Hombros: 5 Minutos de Calentamiento Específico',
            category: '💪 SALUD',
            catColor: '#ef4444',
            theme: 'health',
            emoji: '🔥',
            imgGrad: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)',
            readTime: '2 min',
            snippet: 'Remates y bandejas exigen al manguito rotador. Calienta antes de golpear la primera bola.',
            contentTemplate: `Entrar a pista y comenzar de inmediato a rematar con potencia en el peloteo es la receta perfecta para una tendinitis del supraespinoso. Los hombros requieren rotaciones activas, aperturas escapulares y sombras suaves con la pala antes de golpear bolas reales.<br><br><strong>{PLAYER1}</strong> confiesa: <em>'Dedicar 5 minutos a calentar hombros y cintura antes de entrar al 20x10 me ha evitado contracturas en los partidos nocturnos'</em>. <strong>{PLAYER2}</strong> insiste en que el estiramiento debe hacerse en caliente al finalizar el partido.`
        },
        {
            id: 'salud-calambres-tercer-set',
            title: 'Evita los Calambres en Gemelos en Partidos Largos de Liga',
            category: '💪 SALUD',
            catColor: '#ef4444',
            theme: 'health',
            emoji: '⚡',
            imgGrad: 'linear-gradient(135deg, #fca5a5 0%, #991b1b 100%)',
            readTime: '3 min',
            snippet: 'La pérdida de sodio y magnesio bloquea la contracción muscular. Pautas para aguantar 3 sets.',
            contentTemplate: `En partidos intensos que superan la hora y media, la contracción involuntaria del gemelo o sóleo suele aparecer de forma repentina. La causa no es solo el cansancio físico, sino la deshidratación y la pérdida masiva de electrolitos a través del sudor.<br><br><strong>{PLAYER1}</strong> comparte su solución: <em>'Tomo una cápsula de sales minerales antes del segundo set y un plátano en el cambio de pista'</em>. <strong>{PLAYER2}</strong> aconseja usar medias de compresión graduada para favorecer el retorno venoso durante torneos intensivos.`
        },

        // ── 🍎 NUTRICIÓN & RENDIMIENTO ──────────────────────────────────────────
        {
            id: 'nutricion-hidratacion-inteligente',
            title: 'Hidratación Deportiva: Por Qué el Agua Sola No es Suficiente',
            category: '🍎 NUTRICIÓN',
            catColor: '#22c55e',
            theme: 'nutrition',
            emoji: '💧',
            imgGrad: 'linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)',
            readTime: '3 min',
            snippet: 'En una americana de 2 horas pierdes hasta 1.5 litros de líquidos y sales esenciales.',
            contentTemplate: `Beber exclusivamente agua destila los electrolitos corporales y puede generar hiponatremia y mareos bajo calor. Una bebida isotónica con sodio, potasio y carbohidratos de absorción rápida repone los depósitos de glucógeno y mantiene la agilidad mental.<br><br><strong>{PLAYER1}</strong> detalla su pauta: <em>'Bebo un sorbo en cada cambio de campo impar, sin esperar a tener sensación de sed, que ya es síntoma de deshidratación'</em>. <strong>{PLAYER2}</strong> recalca que la hidratación correcta comienza 24 horas antes del torneo.`
        },
        {
            id: 'nutricion-comida-pre-partido',
            title: 'Qué Comer 2 Horas Antes de una Americana de Fin de Semana',
            category: '🍎 NUTRICIÓN',
            catColor: '#22c55e',
            theme: 'nutrition',
            emoji: '🥗',
            imgGrad: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%)',
            readTime: '3 min',
            snippet: 'Evita digestiones pesadas que te resten velocidad de piernas en las primeras rondas.',
            contentTemplate: `Jugar con el estómago lleno desvía el flujo sanguíneo hacia el sistema digestivo, provocando pesadez y lentitud de reflejos. La comida pre-partido debe ser rica en carbohidratos de digestión fácil (avena, arroz, tostadas con pavo o plátano) y muy baja en grasas saturadas y fibras pesadas.<br><br><strong>{PLAYER1}</strong> nos cuenta: <em>'Una tostada con miel y crema de cacahuete hora y media antes de la americana me da energía continua sin molestias'</em>. <strong>{PLAYER2}</strong> recomienda evitar los refrescos con gas y comidas ultraprocesadas antes de jugar.`
        },
        {
            id: 'nutricion-recuperacion-post-partido',
            title: 'La Ventana de Recuperación: El Tercer Tiempo Saludable',
            category: '🍎 NUTRICIÓN',
            catColor: '#22c55e',
            theme: 'nutrition',
            emoji: '🥪',
            imgGrad: 'linear-gradient(135deg, #86efac 0%, #16a34a 100%)',
            readTime: '2 min',
            snippet: 'Reponer glucógeno y proteínas en los primeros 45 minutos acelera la regeneración muscular.',
            contentTemplate: `El tercer tiempo es sagrado en SomosPadel, pero acompañar la charla con agua y nutrientes de calidad antes de las cervezas acelera la recuperación de tus piernas para el día siguiente. Combinar hidratos y 20g de proteína en los 45 minutos post-partido repara las microfibras musculares.<br><br><strong>{PLAYER1}</strong> bromea: <em>'Primero un batido proteico o un bocadillo de tortilla con agua fresca, y luego ya celebramos con los compañeros en la terraza'</em>. <strong>{PLAYER2}</strong> señala que descansar 8 horas de sueño es el suplemento natural más eficaz.`
        },

        // ── 🧠 PSICOLOGÍA & MINDSET ─────────────────────────────────────────────
        {
            id: 'mental-gestion-punto-de-oro',
            title: 'El Punto de Oro (40-40): Psicología Bajo Máxima Presión',
            category: '🧠 MENTAL',
            catColor: '#38bdf8',
            theme: 'mental',
            emoji: '🎯',
            imgGrad: 'linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%)',
            readTime: '3 min',
            snippet: 'Sin ventajas: una sola bola decide el juego. Estrategia mental para elegir el lado y no fallar.',
            contentTemplate: `El punto de oro es el momento de mayor tensión emocional en el pádel actual. No hay margen de error y quien se precipite suele cometer el fallo no forzado. La regla de oro es jugar con amplio margen sobre la red y hacia el rival más vulnerable mentalmente.<br><br><strong>{PLAYER1}</strong> analiza: <em>'En el punto de oro nunca inventes un golpe que no domines al 100%. Un saque seguro a la T y una volea firme al centro bastan'</em>. <strong>{PLAYER2}</strong> añade que respirar hondo dos veces antes de restar elimina los temblores de muñeca.`
        },
        {
            id: 'mental-remontar-marcador-adverso',
            title: 'Cómo Remontar un Set 0-3 Abajo sin Perder los Nervios',
            category: '🧠 MENTAL',
            catColor: '#38bdf8',
            theme: 'mental',
            emoji: '🧠',
            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)',
            readTime: '3 min',
            snippet: 'Los sets en pádel cambian en un parpadeo. Pautas para cambiar la dinámica del partido.',
            contentTemplate: `Empezar un set perdiendo 0-3 con break en contra suele desmoralizar a parejas novatas. Sin embargo, en pádel basta con consolidar un turno de saque para meter presión al rival.<br><br><strong>{PLAYER1}</strong> destaca: <em>'Nos recordamos que cada set tiene 6 juegos y que si rompemos un saque estamos de nuevo dentro del partido'</em>. <strong>{PLAYER2}</strong> insiste en que cambiar de estrategia táctica (por ejemplo, empezar a tirar globos más altos o cambiar de lado en el saque) desconcierta a los rivales que ya se veían ganadores.`
        },
        {
            id: 'mental-quimica-en-pareja',
            title: 'La Química en Pista: Prohibido Reprochar Fallos a Tu Pareja',
            category: '🤝 COMUNIDAD',
            catColor: '#a855f7',
            theme: 'community',
            emoji: '🤝',
            imgGrad: 'linear-gradient(135deg, #d8b4fe 0%, #a855f7 100%)',
            readTime: '3 min',
            snippet: 'Un mal gesto o una mirada de desaprobación puede hundir el partido. Aprende a sumar en cada punto.',
            contentTemplate: `El pádel es un deporte de dos. La diferencia entre una pareja ganadora y una perdedora no suele ser la técnica, sino la solidez emocional conjunta. Cuando tu compañero comete un error, necesita apoyo inmediato (un choque de palas o una palabra de ánimo), jamás un reproche o silencio tenso.<br><br><strong>{PLAYER1}</strong> reflexiona: <em>'He visto partidos perdidos solo por el lenguaje corporal negativo entre compañeros tras un error tonto'</em>. <strong>{PLAYER2}</strong> coincide: <em>'Si tu pareja siente confianza, arriesgará en la volea con convicción y jugará su mejor versión'</em>.`
        },

        // ── 🏫 CLÍNIC & TÉCNICA DE GOLPES ───────────────────────────────────────
        {
            id: 'clinic-bandeja-vs-vibora',
            title: 'Bandeja vs. Víbora: Diferencias Técnicas y Cuándo Usar Cada Golpe',
            category: '🏫 CLINIC',
            catColor: '#ec4899',
            theme: 'action',
            emoji: '🐍',
            imgGrad: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)',
            readTime: '3 min',
            snippet: 'El armado, el punto de impacto y la trayectoria determinan si defiendes la red o buscas la definición.',
            contentTemplate: `La bandeja es un golpe de control defensivo con impacto por delante de la cabeza y efecto cortado suave cuyo fin es conservar la red. La víbora, en cambio, se impacta a la altura de la sien con efecto lateral violento para que la bola muerda el cristal y apenas levante.<br><br><strong>{PLAYER1}</strong> puntualiza: <em>'Uso la bandeja para globos muy pasados donde tengo que retroceder incómodo, y reservo la víbora cuando la bola me queda flotando a media pista'</em>. <strong>{PLAYER2}</strong> añade que en la víbora la terminación debe envolver el cuello con fluidez.`
        },
        {
            id: 'clinic-bajada-pared-potente',
            title: 'La Bajada de Pared: Cómo Acelerar la Bola con Máxima Precisión',
            category: '🏫 CLINIC',
            catColor: '#ec4899',
            theme: 'action',
            emoji: '💥',
            imgGrad: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
            readTime: '3 min',
            snippet: 'Armado alto, flexión de piernas y transferencia de peso hacia adelante para un tiro demoledor.',
            contentTemplate: `Cuando el rival tira un globo corto que rebota alto en el cristal de fondo, tienes la oportunidad de oro para ejecutar una bajada de pared ofensiva. La clave es armar la pala arriba antes de que la bola toque el cristal y avanzar el cuerpo hacia el impacto.<br><br><strong>{PLAYER1}</strong> enseña: <em>'No busques romper la bola; una bajada dirigida al cuerpo del rival en la red o hacia el espacio entre ambos es punto casi seguro'</em>. <strong>{PLAYER2}</strong> recalca no saltar durante el golpe para conservar el apoyo firme del suelo.`
        },
        {
            id: 'clinic-la-chiquita-al-pie',
            title: 'La Chiquita Milimétrica: El Golpe Que Desarma a Parejas Fuertes',
            category: '🏫 CLINIC',
            catColor: '#ec4899',
            theme: 'courts',
            emoji: '🎾',
            imgGrad: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
            readTime: '3 min',
            snippet: 'Obliga al rival a volear por debajo del nivel de la red y sube a contragolpear de inmediato.',
            contentTemplate: `La chiquita consiste en tirar una bola lenta, con poca fuerza, que caiga justamente en los pies de los rivales apostados en la red. Al verse forzados a volear de abajo hacia arriba, levantan la bola, dejándola a merced de una volea de definición.<br><br><strong>{PLAYER1}</strong> aconseja: <em>'La chiquita requiere muñeca suelta; si la golpeas con prisa cogerá demasiada altura y te rematarán'</em>. <strong>{PLAYER2}</strong> avisa: <em>'Tan pronto como sueltes la chiquita, avanza tres pasos hacia adelante para cazar la respuesta débil'</em>.`
        },
        {
            id: 'clinic-la-volea-bloqueo',
            title: 'Volea de Bloqueo: Neutraliza los Tiros al Cuerpo en la Red',
            category: '🏫 CLINIC',
            catColor: '#ec4899',
            theme: 'action',
            emoji: '🛡️',
            imgGrad: 'linear-gradient(135deg, #fbcfe8 0%, #be185d 100%)',
            readTime: '2 min',
            snippet: 'Sin armar el brazo: utiliza la velocidad del tiro rival para devolver una bola muerta y profunda.',
            contentTemplate: `Cuando estás en la red y el rival lanza una bajada violenta directo a tu pecho, no hay tiempo físico para armar el golpe. Intentar golpear hacia adelante suele enviar la bola contra el cristal de fondo. La técnica correcta es la volea de bloqueo: colocar la pala firme como un muro y absorber el impacto.<br><br><strong>{PLAYER1}</strong> comparte: <em>'Mantener la pala arriba entre puntos te salva la vida ante tiros sorpresa'</em>. <strong>{PLAYER2}</strong> señala que amortiguar la muñeca deja la bola corta junto a la red.`
        },

        // ── 📡 REGLAMENTO OFICIAL & DUDAS EN PISTA ──────────────────────────────
        {
            id: 'reglamento-red-y-malla',
            title: '¿Toca la Red y Luego la Malla? Qué Dice el Reglamento Oficial',
            category: '📡 REGLAMENTO',
            catColor: '#0ea5e9',
            theme: 'courts',
            emoji: '📖',
            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
            readTime: '2 min',
            snippet: 'Resolvemos la duda más discutida en partidos amistosos y de liga federada.',
            contentTemplate: `Si en el saque la bola toca la red (let) y tras botar en el recuadro de recepción toca la malla metálica antes del segundo bote, es falta de saque (no es let). En cambio, durante el transcurso normal del punto, si la bola toca la red rival y cae en campo contrario tocando luego la malla, la pelota sigue completamente viva.<br><br><strong>{PLAYER1}</strong> comenta: <em>'Conocer esta regla nos ahorró una discusión acalorada en la última jornada de liga'</em>. <strong>{PLAYER2}</strong> recuerda que en partidos sin árbitro el fair play y la buena fe priman ante todo.`
        },
        {
            id: 'reglamento-invasion-de-pista',
            title: 'Invasión por Encima de la Red: Cuándo es Falta y Cuándo es Válido',
            category: '📡 REGLAMENTO',
            catColor: '#0ea5e9',
            theme: 'courts',
            emoji: '⚠️',
            imgGrad: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 100%)',
            readTime: '3 min',
            snippet: 'Aprende en qué casos tu pala puede pasar al campo rival sin perder el punto.',
            contentTemplate: `Como norma general, no se puede golpear la bola en campo contrario. Sin embargo, existe una excepción clave: si la pelota rival bota en tu campo y, debido a un efecto retroactivo o viento, regresa hacia su propio campo, el jugador SÍ puede pasar la pala por encima de la red para impactarla, siempre y cuando su cuerpo o ropa no toquen la red.<br><br><strong>{PLAYER1}</strong> aclara: <em>'Tocar la red con la pala, la ropa o cualquier parte del cuerpo en cualquier momento del punto es falta inmediata'</em>. <strong>{PLAYER2}</strong> añade que el cordón de seguridad de la pala es de uso obligatorio siempre.`
        },

        // ── 🏆 AMERICANAS, RANKING & COMUNIDAD SOMOSPADEL ──────────────────────
        {
            id: 'torneos-guia-americana-perfecta',
            title: 'Guía para Brillar en Tu Primera Americana en SomosPadel',
            category: '🏆 TORNEOS',
            catColor: '#facc15',
            theme: 'tournaments',
            emoji: '🏆',
            imgGrad: 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)',
            readTime: '3 min',
            snippet: 'Rotación de compañeros, gestión de energía en 120 minutos y cómo puntuar en cada ronda.',
            contentTemplate: `Las americanas de SomosPadel son el evento estrella de la comunidad: 2 horas ininterrumpidas de competición dinámica donde juegas con y contra diferentes compañeros. La clave para ganar es adaptarte rápidamente a las características de tu pareja ocasional.<br><br><strong>{PLAYER1}</strong> da su consejo maestro: <em>'Antes de sacar en la primera ronda, pregúntale a tu compañero en qué lado se siente más cómodo y cómo le gusta jugar'</em>. <strong>{PLAYER2}</strong> añade que cada punto ganado cuenta en el sumatorio global, por lo que jamás debes dar un juego por perdido.`
        },
        {
            id: 'ranking-como-funciona-algoritmo-elo',
            title: 'Algoritmo ELO de SomosPadel: Cómo Subir de Nivel Rápido',
            category: '📈 RANKING',
            catColor: '#34d399',
            theme: 'tournaments',
            emoji: '📊',
            imgGrad: 'linear-gradient(135deg, #6ee7b7 0%, #059669 100%)',
            readTime: '3 min',
            snippet: 'Te explicamos la matemática que equilibra las pistas según tus victorias y la dificultad de los rivales.',
            contentTemplate: `El sistema de ranking de SomosPadel BCN no es una simple suma de partidos jugados: utiliza una fórmula ELO adaptada al deporte por parejas. Ganar a rivales que tienen mayor coeficiente que tú te otorga una bonificación de puntos multiplicada, mientras que perder ante parejas superiores apenas penaliza.<br><br><strong>{PLAYER1}</strong> señala: <em>'Es un sistema muy justo; premia el atreverse a competir contra los mejores y castiga la inactividad prolongada'</em>. <strong>{PLAYER2}</strong> destaca que el matchmaking automático genera partidos cada vez más igualados y entretenidos.`
        },
        {
            id: 'comunidad-cronica-equipos-guinotprunera',
            title: 'Los 8 Equipos de SomosPadel en la Lliga GuinotPrunera 2026',
            category: '🤝 COMUNIDAD',
            catColor: '#a855f7',
            theme: 'community',
            emoji: '🇪🇸',
            imgGrad: 'linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)',
            readTime: '3 min',
            snippet: 'Balance de la temporada de nuestras ramas Masculina, Femenina y Mixta en 2ª, 3ª y 4ª división.',
            contentTemplate: `Con 8 equipos oficiales y más de 140 jugadores convocados cada fin de semana, SomosPadel BCN se consolida como uno de los clubes más activos de Cataluña en la Lliga GuinotPrunera. Los 3 equipos masculinos (3MA, 3MB, 4M), los 2 femeninos (2F, 4FA) y los 3 mixtos (3XA, 4XA, 4XB) están cosechando grandes resultados.<br><br><strong>{PLAYER1}</strong> elogia: <em>'El compañerismo y los viajes en equipo para jugar fuera son lo mejor de la temporada'</em>. <strong>{PLAYER2}</strong> invita a todos los jugadores de las americanas a probar los entrenamientos específicos de equipo.`
        },

        // ── 🚀 NOVEDADES & SUCESOS OFICIALES DE LA APP SOMOSPADEL ──────────────
        {
            id: 'app-noticia-equipos-2027-preinscripcion',
            title: 'Pre-Inscripciones Abiertas Liga 2027: ¡Asegura tu Plaza en los Equipos Oficiales!',
            category: '🚀 NOVEDADES APP',
            catColor: '#CCFF00',
            theme: 'tournaments',
            emoji: '🏆',
            imgGrad: 'linear-gradient(135deg, rgba(204, 255, 0, 0.25) 0%, #0f172a 100%)',
            readTime: '3 min',
            snippet: 'Abierto el formulario oficial para las divisiones Masculina, Femenina y Mixta. Descubre las pruebas de nivel y fechas de corte.',
            contentTemplate: `¡La familia de competición de SomosPadel Barcelona sigue creciendo! Tras el rotundo éxito de la presente temporada con 8 escuadras federadas en la Lliga GuinotPrunera, la dirección deportiva abre formalmente el periodo de pre-inscripción y pruebas de nivel para la <strong>Temporada 2027</strong>.<br><br>Para 2027 se sumarán dos nuevas divisiones (Veteranos +40 y Mixto Promoción), ampliando la cobertura para todos los niveles de juego. Cada equipo contará con capitán asignado, 2 entrenamientos mensuales dirigidos de táctica y jugadas a balón parado, Welcome Pack exclusivo de patrocinadores y seguimiento estadístico en la app.<br><br><strong>{PLAYER1}</strong> anima a todos: <em>'Jugar la liga en equipo transforma por completo tu visión del pádel; la adrenalina de los terceros sets compartidos no se compara con nada'</em>. <strong>{PLAYER2}</strong> recuerda que las plazas son estrictamente limitadas y se asignarán según compromiso en entrenos y rendimiento en americanas.<br><br>👉 <em>Puedes acceder a la sección de Equipos desde el menú inferior de la app para ver plantillas y rellenar tu solicitud.</em>`
        },
        {
            id: 'app-noticia-doble-ranking-inicio',
            title: 'Nuevo Doble Ranking en Inicio: Alterna al Instante entre Entrenos y Americanas',
            category: '🚀 NOVEDADES APP',
            catColor: '#38bdf8',
            theme: 'tournaments',
            emoji: '📊',
            imgGrad: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, #0f172a 100%)',
            readTime: '2 min',
            snippet: 'El módulo Top 10 Élite del Inicio ahora incorpora un selector ultra-rápido para consultar la tabla de Entrenos o de Americanas por separado.',
            contentTemplate: `Escuchando las sugerencias de la comunidad, hemos evolucionado la pantalla de Inicio de SomosPadel. Ahora el módulo <strong>TOP 10 ÉLITE</strong> cuenta con un selector de pestañas que permite diferenciar con un solo toque el ranking de <strong>ENTRENOS</strong> y el de <strong>AMERICANAS</strong>.<br><br>Cada modalidad tiene su propia naturaleza competitiva: mientras que en los Entrenos se prima la consistencia táctica y la regularidad semanal en pista de prácticas, en las Americanas computa la velocidad de adaptación con compañeros rotativos y la presión del reloj de 120 minutos.<br><br><strong>{PLAYER1}</strong> comenta entusiasmado: <em>'Ahora se hace justicia con quienes destacan entrenando entre semana y con los especialistas de torneo de fin de semana'</em>. <strong>{PLAYER2}</strong> destaca el podio visual con los trofeos Oro, Plata y Bronce y el carrusel horizontal para el resto del Top 10.`
        },
        {
            id: 'app-noticia-cartas-fut-3d-interactivas',
            title: 'Cartas de Jugador 3D estilo FUT: Descubre tu Valoración Media (OVR) y Habilidades',
            category: '🚀 NOVEDADES APP',
            catColor: '#facc15',
            theme: 'action',
            emoji: '🃏',
            imgGrad: 'linear-gradient(135deg, rgba(250, 204, 21, 0.25) 0%, #0f172a 100%)',
            readTime: '3 min',
            snippet: 'Tu perfil personal ahora genera un cromo holográfico interactivo 3D con tus stats de Ataque, Defensa, Físico, Volea y Mentalidad.',
            contentTemplate: `¿Alguna vez te has preguntado qué media tendrías si el pádel tuviera cartas coleccionables como el FIFA / FC 25? ¡Ya está disponible en SomosPadel! Nuestro motor de estadísticas procesa tu historial de victorias, efectividad de quiebre, resiliencia en puntos de oro y partidos disputados para otorgarte tu <strong>Carta FUT Oficial</strong>.<br><br>La carta cuenta con efectos holográficos dorados, plateados o de leyenda, clasificaciones por atributos (ATA, DEF, FIS, MNT, PAS, TAC) y un botón de compartir directo a WhatsApp o Instagram Stories para presumir de cromo con tus compañeros de pista.<br><br><strong>{PLAYER1}</strong> bromea: <em>'Mi carta tiene 88 de smash pero 65 de globo defensivo... ¡la IA no miente!'</em>. <strong>{PLAYER2}</strong> subraya que ganar partidos contra parejas de mayor ELO es la forma más rápida de subir el OVR general de tu cromo.`
        },
        {
            id: 'app-noticia-sudadera-oficial-edicion-limitada',
            title: 'Sudadera Oficial SomosPadel 2026: Tejido Premium de 320g y Edición Limitada',
            category: '🚀 NOVEDADES APP',
            catColor: '#fb923c',
            theme: 'material',
            emoji: '👕',
            imgGrad: 'linear-gradient(135deg, rgba(251, 146, 60, 0.25) 0%, #0f172a 100%)',
            readTime: '2 min',
            snippet: 'Llega la nueva prenda oficial de nuestra comunidad: algodón peinado térmico, capucha envolvente y logotipo bordado en amarillo flúor.',
            contentTemplate: `Para las noches frescas en los clubes y el indispensable tercer tiempo tras dos horas de intensidad en pista, presentamos la <strong>Sudadera Oficial SomosPadel Barcelona 2026</strong>.<br><br>Diseñada con tejido premium de 320 gramos (80% algodón peinado, 20% poliéster técnico), ofrece máxima calidez sin sacrificar transpirabilidad. Presenta costuras reforzadas, bolsillo delantero tipo canguro con compartimento interior para el móvil y detalles de alta visibilidad con el emblema icónico del club.<br><br><strong>{PLAYER1}</strong> señala: <em>'Es comodísima para el calentamiento previo y para quedarse comentando las jugadas con una cerveza en la terraza'</em>. <strong>{PLAYER2}</strong> recuerda que las primeras 50 unidades incluyen la personalización de nombre de jugador o dorsal en la espalda.`
        },
        {
            id: 'app-noticia-piloto-automatico-matchmaking',
            title: 'Piloto Automático de Cruces: Matchmaking Inteligente 4 Horas Antes de Cada Evento',
            category: '🚀 NOVEDADES APP',
            catColor: '#a855f7',
            theme: 'courts',
            emoji: '⚡',
            imgGrad: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, #0f172a 100%)',
            readTime: '3 min',
            snippet: 'El algoritmo analiza el ELO dinámico de los inscritos para distribuir automáticamente las pistas y garantizar cruces disputados.',
            contentTemplate: `Atrás quedaron las dudas sobre qué pista le corresponde a cada pareja al llegar al club. La app de SomosPadel incorpora un sistema de <strong>Piloto Automático</strong> que se ejecuta exactamente 4 horas antes del pitido inicial de cada americana o entreno.<br><br>El algoritmo cruza el nivel ELO histórico de los inscritos, su racha de victorias en las últimas 3 semanas y la compatibilidad de lados (revés / drive) para conformar grupos de pista hiper-equilibrados, asegurando que desde la Ronda 1 los sets se definan por detalles y emoción máxima.<br><br><strong>{PLAYER1}</strong> recalca: <em>'La sensación de que cualquier pareja puede ganar la pista 1 hace que la americana mantenga la tensión competitiva de principio a fin'</em>. <strong>{PLAYER2}</strong> agradece que los cruces se notifiquen directamente a la app con tiempo para preparar la táctica.`
        },
        {
            id: 'app-noticia-comunidad-500-americanas-record',
            title: '¡Hito Histórico! Superamos las 500 Americanas Disputadas y 1.200 Jugadores',
            category: '🚀 NOVEDADES APP',
            catColor: '#22c55e',
            theme: 'community',
            emoji: '🎉',
            imgGrad: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, #0f172a 100%)',
            readTime: '2 min',
            snippet: 'La comunidad de SomosPadel Barcelona pulveriza todas las marcas históricas con más de 12.000 juegos disputados en nuestras pistas.',
            contentTemplate: `Lo que comenzó como un grupo de amigos con ganas de jugar partidos igualados en Barcelona se ha convertido en el circuito social de pádel más vibrante de la ciudad. Este mes celebramos un hito histórico: más de <strong>500 eventos oficiales celebrados</strong> y una comunidad activa que supera ya los <strong>1.200 padeleros y padeleras</strong>.<br><br>Más allá de las estadísticas, el verdadero orgullo de SomosPadel reside en los lazos de amistad, las risas en el tercer tiempo, las parejas que se formaron en una americana y ahora compiten juntas en liga federada y el ambiente de respeto mutuo en cada bola.<br><br><strong>{PLAYER1}</strong> emocionado: <em>'Llegué sin conocer a nadie en la ciudad y hoy tengo un grupo de amigos inseparables gracias a SomosPadel'</em>. <strong>{PLAYER2}</strong> agradece a todos los organizadores y jugadores su fidelidad y pasión inquebrantable cada semana.`
        },
        {
            id: 'app-noticia-protocolo-pista-1-corona',
            title: 'Protocolo Pista 1 "La Corona": Dinámica Oficial de Ascensos y Permanencia',
            category: '🚀 NOVEDADES APP',
            catColor: '#f59e0b',
            theme: 'courts',
            emoji: '👑',
            imgGrad: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, #0f172a 100%)',
            readTime: '3 min',
            snippet: 'Conoce a fondo las reglas de pista reina: cómo subir de pista tras vencer el juego y defender la corona de los retadores.',
            contentTemplate: `En los formatos de americana continua y pozo por niveles, la <strong>Pista 1 (La Corona)</strong> es el epicentro del torneo. Los ganadores de la Pista 1 conservan el reinado pero cambian de pareja, mientras que los perdedores descienden a la Pista 2 para volver a ganarse el ascenso.<br><br>Para evitar empates por tiempo, si el reloj de 20 minutos de la ronda suena con punto en juego, dicho punto se finaliza por completo. En caso de igualdad de juegos al sonar la bocina, se disputa un 'Punto de Oro' directo para decidir quién sube y quién baja de pista.<br><br><strong>{PLAYER1}</strong> revela su estrategia: <em>'En la Pista 1 la presión es doble; hay que jugar con mucho margen sobre la red y no precipitarse en las bolas de contraataque'</em>. <strong>{PLAYER2}</strong> concluye que mantenerse 3 rondas seguidas en la corona es la verdadera prueba de fuego.`
        },
        {
            id: 'app-noticia-radar-meteorologico-live',
            title: 'Radar Meteorológico en Vivo: Humedad, Viento y su Efecto en el Bote de la Bola',
            category: '🚀 NOVEDADES APP',
            catColor: '#38bdf8',
            theme: 'courts',
            emoji: '🌦️',
            imgGrad: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, #0f172a 100%)',
            readTime: '2 min',
            snippet: 'El sensor de inicio monitoriza las condiciones ambientales del club para calcular el índice de salida de bola y fricción de cristales.',
            contentTemplate: `Jugar al nivel del mar en Barcelona significa que la meteorología transforma el partido por completo. Con temperaturas altas y baja humedad, el fieltro de la pelota se calienta y el rebote en pared de fondo se dispara más de 35 cm, haciendo que el remate x3 y x4 sea letal.<br><br>Por el contrario, en tardes y noches húmedas con condensación en el vidrio, la pelota patina al impactar y se cae al suelo a ras de moqueta. El widget meteorológico integrado en el Inicio te indica en tiempo real si las condiciones son propicias para el ataque rápido o si conviene optar por bandejas conservadoras y juego de fondo.<br><br><strong>{PLAYER1}</strong> comenta: <em>'Consultar el clima antes de elegir pala con goma blanda o dura te da una ventaja competitiva determinante'</em>. <strong>{PLAYER2}</strong> recuerda secar siempre los cristales antes del inicio de cada ronda.`
        },
        {
            id: 'app-noticia-fair-play-regla-dos-bolas',
            title: 'Cultura Fair Play: Protocolo de Convivencia y Regla de "Dos Bolas" ante Dudas',
            category: '🚀 NOVEDADES APP',
            catColor: '#ec4899',
            theme: 'community',
            emoji: '🤝',
            imgGrad: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, #0f172a 100%)',
            readTime: '2 min',
            snippet: 'En caso de discrepancia en una línea ajustada o toque de red, se repite el punto con elegancia. El respeto es innegociable.',
            contentTemplate: `En SomosPadel nos mueve la competitividad sana, pero por encima de cualquier trofeo o punto de ranking está la deportividad y el respeto hacia los compañeros de juego. Por ello, recordamos a todos los participantes la vigencia del <strong>Código de Honor de la Comunidad</strong>.<br><br>Si una bola bota en el límite de la línea y la pareja receptora tiene dudas honestas sobre si tocó fuera o dentro, la normativa estipula cantar 'dos bolas' y repetir el saque de inmediato, sin discusiones ni pérdidas de tiempo. Asimismo, cualquier invasión involuntaria o roce de pala con la red debe ser cantada por el propio infractor.<br><br><strong>{PLAYER1}</strong> subraya: <em>'Ganar un punto con trampa o polémica no tiene ningún mérito; preferimos perder el punto y ganar el respeto de todos'</em>. <strong>{PLAYER2}</strong> aplaude que el fair play sea la seña de identidad del club.`
        },
        {
            id: 'app-noticia-pwa-instalacion-movil',
            title: 'Cómo Instalar SomosPadel como App Nativa en iPhone y Android sin Tiendas',
            category: '🚀 NOVEDADES APP',
            catColor: '#CCFF00',
            theme: 'material',
            emoji: '📱',
            imgGrad: 'linear-gradient(135deg, rgba(204, 255, 0, 0.25) 0%, #0f172a 100%)',
            readTime: '2 min',
            snippet: 'Añade el acceso directo a tu pantalla de inicio en 10 segundos: disfruta de pantalla completa, fluidez nativa y carga sin esperas.',
            contentTemplate: `Para disfrutar de la mejor experiencia visual en tu móvil, SomosPadel está construida como una <strong>Progressive Web App (PWA) de última generación</strong>. No necesitas descargar actualizaciones pesadas desde App Store o Google Play: se actualiza al instante cada vez que abres la app.<br><br><strong>En iPhone / Safari:</strong> Pulsa el botón 'Compartir' (icono con flecha hacia arriba en la barra inferior del navegador), baja en el menú y selecciona <em>'Añadir a pantalla de inicio'</em>.<br><br><strong>En Android / Chrome:</strong> Pulsa los tres puntos de la esquina superior derecha y toca en <em>'Instalar aplicación'</em> o <em>'Añadir a pantalla principal'</em>.<br><br><strong>{PLAYER1}</strong> señala: <em>'Al tener el icono en el escritorio del móvil se abre a pantalla completa como una app nativa y no gasta batería ni almacenamiento'</em>. <strong>{PLAYER2}</strong> recomienda hacerlo a todos los nuevos inscritos para recibir avisos de pista al momento.`
        }
    ];

    // Matrices para el generador procedural infinito (combinatoria sin repeticiones)
    const PROCEDURAL_TOPICS = [
        {
            topic: 'La Salida de Pared Plana',
            cat: '🏫 CLINIC',
            color: '#ec4899',
            emoji: '🎾',
            theme: 'courts',
            hook: 'Golpear con la pala paralela al cristal para una bola baja que resbala.',
            intro: 'La salida de pared plana es el golpe que más seguridad aporta al fondo de pista cuando la bola sale con fuerza.',
            tip: 'Mantén la flexión de rodillas y deja que la bola supere la línea de tu cuerpo antes de empujar hacia adelante.'
        },
        {
            topic: 'El Saque con Efecto a la Reja',
            cat: '💡 CONSEJOS',
            color: '#f59e0b',
            emoji: '🎯',
            theme: 'action',
            hook: 'Bote imprevisible en la malla lateral para arrancar el punto en ventaja.',
            intro: 'Un buen servicio en pádel no busca el ace directo, sino un rebote irregular en la reja que fuerce una devolución forzada.',
            tip: 'Impacta la bola a la altura máxima permitida (la cintura) cortando de arriba a abajo con la muñeca firme.'
        },
        {
            topic: 'La Volea Profunda al Rincón',
            cat: '💡 CONSEJOS',
            color: '#f59e0b',
            emoji: '⚡',
            theme: 'action',
            hook: 'Bolas rasas que mueren en la esquina obligando al rival a doblar la cintura.',
            intro: 'Volear sin profundidad permite al rival contraatacar con comodidad. La volea al rincón es el arma de control definitiva.',
            tip: 'Termina el golpe apuntando con la pala hacia el lugar exacto donde quieres que bote la bola.'
        },
        {
            topic: 'Manejo del Viento en Pistas Outdoor',
            cat: '💡 CONSEJOS',
            color: '#f59e0b',
            emoji: '💨',
            theme: 'courts',
            hook: 'Cómo compensar las rachas de aire jugando bolas más tensas y seguras.',
            intro: 'Jugar al aire libre en Barcelona implica lidiar con rachas de viento que alteran la parábola del globo y el rebote en cristal.',
            tip: 'A favor de viento acorta los globos para que no salgan por el fondo; en contra, tira con más profundidad y altura.'
        },
        {
            topic: 'El Calzado en Pistas Mojadas o Húmedas',
            cat: '👟 MATERIAL',
            color: '#fb923c',
            emoji: '👟',
            theme: 'material',
            hook: 'Pistas nocturnas con humedad: precauciones para no patinar en las frenadas.',
            intro: 'En las noches de invierno o primavera, el rocío en los cristales y la moqueta modifica el agarre de forma drástica.',
            tip: 'Limpia la suela de tus zapatillas entre puntos y no intentes remates en carrera forzada sobre superficie húmeda.'
        },
        {
            topic: 'Nutrición para Americanas Matinales',
            cat: '🍎 NUTRICIÓN',
            color: '#22c55e',
            emoji: '🥐',
            theme: 'nutrition',
            hook: 'El desayuno perfecto para competir con energía desde las 9:00 AM.',
            intro: 'Competir a primera hora de la mañana requiere planificar el desayuno con suficiente antelación para no sufrir picos de hipoglucemia.',
            tip: 'Despierta al menos 90 minutos antes del torneo y opta por carbohidratos complejos y un café suave sin lácteos pesados.'
        },
        {
            topic: 'Ritual de Respiración Antes de Sacar',
            cat: '🧠 MENTAL',
            color: '#38bdf8',
            emoji: '🧘‍♂️',
            theme: 'mental',
            hook: 'Tres botes de pelota y una inhalación profunda para resetear pulsaciones.',
            intro: 'Los mejores jugadores del circuito tienen un ritual sagrado antes de cada servicio para aislarse del ruido exterior.',
            tip: 'Inhala por la nariz, suelta el aire lentamente y visualiza la trayectoria exacta de tu saque antes de golpear.'
        },
        {
            topic: 'El Smash en Suspensión para Jugadores Ágiles',
            cat: '🏫 CLINIC',
            color: '#ec4899',
            emoji: '🚀',
            theme: 'action',
            hook: 'Impactar en el punto más alto para sacar la bola por 4 metros.',
            intro: 'El remate en salto permite alcanzar un ángulo de caída mucho más pronunciado, facilitando que la bola supere la verja de fondo.',
            tip: 'El salto debe ser vertical y hacia adelante, utilizando el brazo no dominante como guía visual del punto de caída.'
        },
        {
            topic: 'Cuidado de Articulaciones en Jugadores Veteranos',
            cat: '💪 SALUD',
            color: '#ef4444',
            emoji: '🩺',
            theme: 'health',
            hook: 'Cómo mantener el nivel competitivo a partir de los 40 años sin dolor.',
            intro: 'La experiencia táctica de un jugador veterano puede superar a la potencia juvenil si se cuida la recuperación articular.',
            tip: 'Incluye suplementación con colágeno y magnesio, y jamás saltes la sesión de estiramientos tras los partidos.'
        },
        {
            topic: 'El Juego Psicológico en el Tie-Break',
            cat: '🧠 MENTAL',
            color: '#38bdf8',
            emoji: '🔥',
            theme: 'mental',
            hook: 'Siete puntos que deciden un set: concentración punto a punto.',
            intro: 'El desempate a 7 puntos es una prueba de fuego para los nervios. Las prisas y los tiros milagrosos suelen costar el set.',
            tip: 'Concéntrate únicamente en el punto presente. Jugar a asegurar con margen es la estrategia estadística ganadora.'
        }
    ];

    // Objeto Exportado Global
    window.NewsCatalog = {
        photoLibrary: PHOTO_LIBRARY,
        allPhotos: ALL_PHOTOS,
        articles: ARTICLES_DATABASE,

        /**
         * Obtiene una foto temática variada y deduplicada
         */
        getPhoto(theme = 'courts', seed = 0) {
            const list = PHOTO_LIBRARY[theme] || PHOTO_LIBRARY.courts;
            return list[Math.abs(seed) % list.length];
        },

        /**
         * Obtiene una lista de fotos deduplicadas para un conjunto de posts,
         * sustituyendo automáticamente fotos locales repetidas por fotos nuevas HD.
         */
        assignUniquePhotos(posts) {
            const assigned = {};
            const used = new Set();
            const legacyLocalImages = [
                'img/blog_action_smash.png', 
                'img/blog_court_night.png', 
                'img/blog_racket_ball.png', 
                'img/blog_ball_glass.png', 
                'img/blog_player_victory.png', 
                'img/blog_club_lounge.png',
                'img/pista_padel_azul.png'
            ];

            posts.forEach((post, idx) => {
                const theme = post.theme || this.detectTheme(post);
                const candidates = PHOTO_LIBRARY[theme] || ALL_PHOTOS;

                // Si la imagen es una de las locales antiguas repetidas o no tiene foto, forzar una foto nueva HD del tema
                const isLegacy = !post.imageUrl || legacyLocalImages.some(leg => post.imageUrl.includes(leg));
                
                if (!isLegacy && !used.has(post.imageUrl)) {
                    assigned[post.id] = post.imageUrl;
                    used.add(post.imageUrl);
                    return;
                }

                // Buscar foto fresca no usada del tema que no sea de las antiguas
                const fresh = candidates.find(img => !used.has(img) && !legacyLocalImages.some(leg => img.includes(leg)));

                if (fresh) {
                    assigned[post.id] = fresh;
                    used.add(fresh);
                } else {
                    // Si se agotaron las del tema, tomar cualquiera no usada del pool global
                    const anyFresh = ALL_PHOTOS.find(img => !used.has(img) && !legacyLocalImages.some(leg => img.includes(leg)));
                    const chosen = anyFresh || candidates[idx % candidates.length];
                    assigned[post.id] = chosen;
                    used.add(chosen);
                }
            });

            return assigned;
        },

        detectTheme(post) {
            const t = ((post.title || '') + ' ' + (post.category || '')).toLowerCase();
            if (t.includes('material') || t.includes('pala') || t.includes('suela') || t.includes('pelota') || t.includes('grip')) return 'material';
            if (t.includes('salud') || t.includes('codo') || t.includes('lesi') || t.includes('hombro') || t.includes('calambres')) return 'health';
            if (t.includes('nutrici') || t.includes('hidrat') || t.includes('comida') || t.includes('recupera')) return 'nutrition';
            if (t.includes('mental') || t.includes('oro') || t.includes('concentra') || t.includes('nervios')) return 'mental';
            if (t.includes('torneo') || t.includes('americana') || t.includes('ranking') || t.includes('elo') || t.includes('novedad') || t.includes('push')) return 'tournaments';
            if (t.includes('comunidad') || t.includes('equipo') || t.includes('pareja')) return 'community';
            if (t.includes('smash') || t.includes('bandeja') || t.includes('víbora') || t.includes('remate') || t.includes('volea')) return 'action';
            return 'courts';
        },

        /**
         * Devuelve un post procedural dinámico combinatorio
         */
        generateProceduralPost(player1, player2, seed = Date.now()) {
            const topic = PROCEDURAL_TOPICS[seed % PROCEDURAL_TOPICS.length];
            const img = this.getPhoto(topic.theme, seed);
            const id = `proc-${seed}-${topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

            return {
                id: id,
                title: topic.topic,
                category: topic.cat,
                catColor: topic.color,
                emoji: topic.emoji,
                theme: topic.theme,
                imageUrl: img,
                snippet: topic.hook,
                readTime: '3 min',
                date: 'Hoy',
                imgGrad: 'linear-gradient(135deg, #1e293b, #0f172a)',
                content: `${topic.intro}<br><br>El jugador <strong>${player1}</strong> nos explicaba cómo lo aplica en pista: <em>'${topic.tip}'</em>. Su compañero <strong>${player2}</strong> recalca la importancia de practicar esta situación en los entrenamientos semanales antes de llevarla a la competición oficial.`
            };
        },

        /**
         * Obtiene el catálogo completo listo para renderizar (artículos fijos + procedurales)
         */
        getFullCatalog(player1 = 'Alejandro Coscolín', player2 = 'Bernat Pecharromán') {
            const base = ARTICLES_DATABASE.map((art, idx) => {
                const img = this.getPhoto(art.theme, idx);
                const content = (art.contentTemplate || art.content || '')
                    .replace(/{PLAYER1}/g, player1)
                    .replace(/{PLAYER2}/g, player2);

                return {
                    ...art,
                    imageUrl: img,
                    content: content,
                    date: art.date || 'Reciente'
                };
            });

            // Añadir posts procedurales para enriquecer aún más
            const generated = PROCEDURAL_TOPICS.map((_, i) => 
                this.generateProceduralPost(player1, player2, i + 100)
            );

            return [...base, ...generated];
        }
    };

    console.log(`📚 [NewsCatalog] Cargado catálogo ampliado con ${ARTICLES_DATABASE.length + PROCEDURAL_TOPICS.length} artículos únicos y fototeca de ${ALL_PHOTOS.length} imágenes HD.`);
})();
