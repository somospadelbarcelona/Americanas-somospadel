(function () {
    // VISUAL VERIFICATION
    setTimeout(() => console.log("%c 🚀 DASHBOARD ENGINE V9: CLEAN MODE ", "background: #CCFF00; color: #000; font-size: 14px; padding: 4px; font-weight: bold;"), 1000);

    function formatPlayerShortName(name) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return `${parts[0]} ${parts[1].charAt(0)}.`;
        }
        return parts[0];
    }

    window.SomosPadelNewsEngine = {
        templates: [
            {
                title: "La Teoría del Centro: el Secreto de los Pros",
                category: "💡 CONSEJOS",
                catColor: "#f59e0b",
                imageUrl: "img/blog_court_night.png",
                emoji: "🎯",
                imgGrad: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
                snippet: "Reducir los ángulos del rival y provocar dudas en la pareja contraria jugando al medio.",
                contentTemplate: "El centro de la pista es el área más segura y eficaz para jugar en pádel. Al dirigir la bola al centro, reduces drásticamente los ángulos de rebote del rival, evitas que abran la bola a las paredes y generas dudas de comunicación entre la pareja contraria. <br><br>El jugador <strong>{PLAYER1}</strong> nos compartía su truco esta semana: <em>'Si juegas al centro con margen, obligas al rival a levantar la bola, dejándote una volea cómoda'</em>. Su compañero <strong>{PLAYER2}</strong> destaca la importancia de buscar globos profundos por el centro para recuperar la posición en la red sin regalar ángulos laterales.",
                readTime: "3 min"
            },
            {
                title: "Suela Omni vs. Suela Clay: ¿Qué zapatillas elegir?",
                category: "👟 MATERIAL",
                catColor: "#fb923c",
                imageUrl: "img/blog_court_night.png",
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
                imageUrl: "img/blog_racket_ball.png",
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
                imageUrl: "img/blog_ball_glass.png",
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
                imageUrl: "img/pista_padel_azul.png",
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
                imageUrl: "img/blog_club_lounge.png",
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
                imageUrl: "img/blog_racket_ball.png",
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
                imageUrl: "img/blog_action_smash.png",
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
                imageUrl: "img/blog_ball_glass.png",
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
                imageUrl: "img/blog_court_night.png",
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
                imageUrl: "img/blog_ball_glass.png",
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
                imageUrl: "img/blog_player_victory.png",
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
                imageUrl: "img/blog_player_victory.png",
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
                imageUrl: "img/blog_action_smash.png",
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
                imageUrl: "img/pista_padel_azul.png",
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
                imageUrl: "img/blog_action_smash.png",
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
                imageUrl: "img/blog_action_smash.png",
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
                imageUrl: "img/blog_court_night.png",
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
                imageUrl: "img/blog_racket_ball.png",
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
                imageUrl: "img/blog_court_night.png",
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
                imageUrl: "img/blog_court_night.png",
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
                imageUrl: "img/blog_player_victory.png",
                emoji: "📈",
                imgGrad: "linear-gradient(135deg, #6ee7b7 0%, #059669 100%)",
                snippet: "Estrategias para mejorar tu posición en el ranking y conseguir más puntos por set.",
                contentTemplate: "El sistema de ranking de SomosPadel BCN premia la consistencia y la dificultad de los rivales. Ganar un set a una pareja de mayor nivel suma más puntos que vencer a parejas de nivel menor. <br><br><strong>{PLAYER1}</strong> comparte su filosofía: <em>'Prefiero jugar contra los mejores y perder por poco que ganar fácil — aprendo más y sumo mejor'</em>. Su compañero <strong>{PLAYER2}</strong> destaca que la regularidad es clave: <em>'Jugar todas las semanas, aunque sea una americana pequeña, te mantiene activo en el ranking y evita penalizaciones de inactividad'</em>.",
                readTime: "2 min"
            }
        ],

        async getRealPlayers() {
            try {
                const db = window.db || firebase.firestore();
                const snapshot = await db.collection('players').limit(15).get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => {
                        const data = doc.data();
                        return data.name || data.displayName || "Alejandro Coscolín";
                    });
                }
            } catch (e) {
                console.warn("Fallo al leer jugadores reales para noticias, usando fallbacks reales:", e);
            }
            return ["Alejandro Coscolín", "Bernat Pecharromán", "Alberto Javier Martín", "Jordi Díaz", "Carlos Jiménez", "Jordi Díaz"];
        },

        async generateWithGemini(key, player1, player2, usedCategories = []) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            
            const categories = [
                { name: '💡 CONSEJOS', color: '#f59e0b', emoji: '💡' },
                { name: '👟 MATERIAL', color: '#fb923c', emoji: '👟' },
                { name: '💪 SALUD & BIENESTAR', color: '#ef4444', emoji: '💪' },
                { name: '🍎 NUTRICIÓN', color: '#22c55e', emoji: '🍎' },
                { name: '🤝 COMUNIDAD', color: '#a855f7', emoji: '🤝' },
                { name: '🧠 MENTAL', color: '#38bdf8', emoji: '🧠' },
                { name: '🏫 CLINIC', color: '#ec4899', emoji: '🏫' },
                { name: '📡 REGLAMENTO', color: '#0ea5e9', emoji: '📡' },
                { name: '🏆 TORNEOS', color: '#facc15', emoji: '🏆' },
                { name: '📈 RANKING', color: '#34d399', emoji: '📈' }
            ];
            // Seleccionar una categoría que NO se haya usado recientemente
            const freshCategories = categories.filter(c => !usedCategories.includes(c.name));
            const pool = freshCategories.length > 0 ? freshCategories : categories;
            const chosenCategory = pool[Math.floor(Math.random() * pool.length)];
            console.log(`🎨 [NewsEngine] Categoría seleccionada (evitando repetidas): ${chosenCategory.name}`);

            const prompt = `
            Eres un periodista deportivo e instructor de élite de la comunidad SomosPadel BCN.
            Tu tarea es redactar un artículo de blog/noticia fascinante en español sobre pádel.
            Debes devolver ÚNICAMENTE un objeto JSON estructurado con los siguientes campos (no incluyas comentarios ni marcas markdown, solo el JSON):
            
            {
              "title": "Un título de alta conversión y llamativo relacionado con el tema",
              "snippet": "Resumen corto de 1-2 líneas de gancho para el lector",
              "category": "${chosenCategory.name}",
              "catColor": "${chosenCategory.color}",
              "emoji": "${chosenCategory.emoji}",
              "imageUrl": "Elige una URL de imagen de Unsplash según el tema. Puedes usar:
                           - Para Táctica/Clinic: https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=600&auto=format&fit=crop
                           - Para Material: https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop
                           - Para Salud/Mental: https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop
                           - Para Nutrición: https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop
                           - Para Comunidad: https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&auto=format&fit=crop
                           (U otra URL similar de Unsplash de alta calidad)",
              "imgGrad": "Un gradiente lineal CSS sutil para la cabecera (ej: linear-gradient(135deg, #fb923c 0%, #f97316 100%))",
              "content": "El cuerpo del artículo en formato HTML. Debe ser extenso (mínimo 300 palabras), estructurado e incluir:
                          1. Introducción emocionante.
                          2. Un bloque con fondo traslúcido y borde sutil (background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:18px; margin-bottom:18px;) titulado '🎯 ¿Por qué es fundamental?'.
                          3. Guía paso a paso numerada (1, 2, 3) con títulos y descripciones cortas.
                          4. Ejemplos prácticos nombrando a dos jugadores reales del club para simular su participación: '${player1}' y '${player2}'. Invéntate opiniones o consejos ingeniosos entre comillas de cada uno sobre el tema.
                          5. Una sección '❌ Errores Comunes a Evitar'.
                          6. Un bloque final con degradado sutil (con borde coloreado) titulado '💡 El Secreto del Coach' con un consejo avanzado de alto nivel.",
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
                category: parsed.category || chosenCategory.name,
                catColor: parsed.catColor || chosenCategory.color,
                imageUrl: parsed.imageUrl || chosenCategory.imageUrl,
                snippet: parsed.snippet,
                content: parsed.content,
                date: 'Hoy',
                readTime: parsed.readTime || '3 min',
                emoji: parsed.emoji || chosenCategory.emoji,
                imgGrad: parsed.imgGrad || 'linear-gradient(135deg, #1e293b, #0f172a)',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                viewsCount: 0,
                lastReaderName: 'Ninguno'
            };
        },

        async getRecentCategories(db, limit = 5) {
            try {
                const snapshot = await db.collection('blog_posts')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => doc.data().category || '').filter(Boolean);
                }
            } catch (e) {
                console.warn('[NewsEngine] No se pudieron obtener categorías recientes:', e);
            }
            return [];
        },

        async checkAndGenerateNews() {
            // ─── SISTEMA DE GENERACIÓN CADA 8 HORAS ───────────────────────────────────
            // Franjas horarias del día: 00-08h (slot 0), 08-16h (slot 1), 16-24h (slot 2)
            // Cada franja genera 1 noticia con ID único. Máximo: 3 noticias/día.
            const INTERVAL_HOURS = 8;

            try {
                const db = window.db || firebase.firestore();
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0]; // "2026-06-13"
                const currentSlot = Math.floor(now.getHours() / INTERVAL_HOURS); // 0, 1 ó 2
                const slotKey = `${todayStr}-slot${currentSlot}`; // ej: "2026-06-13-slot1"

                // ── 1. Verificar si ya se generó para este slot en este dispositivo
                const localLastSlot = localStorage.getItem('somospadel_last_news_slot');
                if (localLastSlot === slotKey) {
                    console.log(`⏳ [NewsEngine] Noticia ya generada para el slot actual (${slotKey}). Saltando.`);
                    return;
                }

                // ── 2. Verificar en Firestore (para sincronizar todos los dispositivos)
                try {
                    const controlDoc = await db.collection('system_metadata').doc('blog_control').get();
                    if (controlDoc.exists && controlDoc.data().lastSlot === slotKey) {
                        console.log(`⏳ [NewsEngine] Slot ${slotKey} ya generado en Firestore. Actualizando local y saltando.`);
                        localStorage.setItem('somospadel_last_news_slot', slotKey);
                        return;
                    }
                } catch (err) {
                    console.warn("[NewsEngine] No se pudo verificar Firestore, continuando:", err);
                }

                // ── 3. ¡Hay que generar! ───────────────────────────────────────────────
                const slotLabel = ['🌅 Mañana (00-08h)', '☀️ Tarde (08-16h)', '🌙 Noche (16-24h)'][currentSlot];
                console.log(`📰 [NewsEngine] Generando noticia para franja ${slotLabel} — Slot: ${slotKey}`);

                const players = await this.getRealPlayers();
                const p1Idx = Math.floor(Math.random() * players.length);
                let p2Idx = Math.floor(Math.random() * players.length);
                if (p2Idx === p1Idx) p2Idx = (p1Idx + 1) % players.length;
                const player1 = players[p1Idx];
                const player2 = players[p2Idx];

                const savedKey = localStorage.getItem('somospadel_gemini_api_key') || '';
                let newPost = null;
                let genTitle = '';

                // Obtener categorías recientes para evitar repeticiones
                const recentCategories = await this.getRecentCategories(db, 6);
                console.log(`📊 [NewsEngine] Categorías recientes: ${recentCategories.join(', ') || 'ninguna'}`);

                // ── Intentar generar con Gemini IA ────────────────────────────────────
                if (savedKey) {
                    try {
                        console.log("🧠 [NewsEngine] Generando con Gemini IA...");
                        newPost = await this.generateWithGemini(savedKey, player1, player2, recentCategories);
                        genTitle = newPost.title;
                    } catch (geminiErr) {
                        console.warn("⚠️ [NewsEngine] Gemini falló, usando plantillas:", geminiErr);
                    }
                }

                // ── Fallback: motor de plantillas deduplicadas ────────────────────────
                if (!newPost) {
                    console.log("📡 [NewsEngine] Usando motor de plantillas deduplicadas...");

                    let publishedTitles = [];
                    try {
                        const snapshot = await db.collection('blog_posts')
                            .orderBy('timestamp', 'desc')
                            .limit(30)
                            .get();
                        if (!snapshot.empty) {
                            publishedTitles = snapshot.docs.map(doc => doc.data().title || '');
                        }
                    } catch (fsErr) {
                        console.warn("Fallo al consultar posts para deduplicar:", fsErr);
                    }

                    const unusedByTitle = this.templates.filter(t => !publishedTitles.includes(t.title));
                    const freshByCategory = unusedByTitle.filter(t => !recentCategories.includes(t.category));

                    let selectedTemplate;
                    if (freshByCategory.length > 0) {
                        selectedTemplate = freshByCategory[Math.floor(Math.random() * freshByCategory.length)];
                        console.log(`🎯 [NewsEngine] Plantilla nueva (título + categoría): "${selectedTemplate.title}"`);
                    } else if (unusedByTitle.length > 0) {
                        selectedTemplate = unusedByTitle[Math.floor(Math.random() * unusedByTitle.length)];
                        console.log(`🔄 [NewsEngine] Plantilla con título nuevo: "${selectedTemplate.title}"`);
                    } else {
                        const notRecentCat = this.templates.filter(t => !recentCategories.includes(t.category));
                        const pool = notRecentCat.length > 0 ? notRecentCat : this.templates;
                        selectedTemplate = pool[Math.floor(Math.random() * pool.length)];
                        console.log(`♻️ [NewsEngine] Reutilizando (categoría no reciente): "${selectedTemplate.title}"`);
                    }

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
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        viewsCount: 0,
                        lastReaderName: 'Ninguno'
                    };
                    genTitle = selectedTemplate.title;
                }

                // ── ID único por slot: garantiza que no sobreescribe noticias previas ──
                const safeTitle = genTitle.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, '-').slice(0, 35);
                const postId = `auto-post-${slotKey}-${safeTitle}`;
                newPost.id = postId;

                // ── Publicar en Firestore ──────────────────────────────────────────────
                try {
                    await db.collection('blog_posts').doc(postId).set(newPost);
                    console.log(`✅ [NewsEngine] Noticia publicada: "${genTitle}" [${slotLabel}]`);

                    // Actualizar control con slot actual
                    await db.collection('system_metadata').doc('blog_control').set({
                        lastSlot: slotKey,
                        lastGeneratedDate: todayStr,
                        lastPostId: postId,
                        lastPostTitle: genTitle,
                        intervalHours: INTERVAL_HOURS,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (fsErr) {
                    console.warn("Fallo al guardar en Firestore:", fsErr);
                }

                // Guardar slot en localStorage para no regenerar en este dispositivo
                localStorage.setItem('somospadel_last_news_slot', slotKey);

            } catch (e) {
                console.error("Fallo general en SomosPadelNewsEngine:", e);
            }
        },

        getDeterministicFallbackPosts() {
            const today = new Date();
            const posts = [];
            for (let i = 0; i < 4; i++) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - i);
                const daySeed = targetDate.getDate() + targetDate.getMonth() * 31 + targetDate.getFullYear();
                const templateIdx = daySeed % this.templates.length;
                const template = this.templates[templateIdx];
                
                let dateStr = "Hoy";
                if (i === 1) dateStr = "Ayer";
                else if (i > 1) dateStr = `Hace ${i} días`;
                
                const fallbackPlayers = ["Alejandro Coscolín", "Bernat Pecharromán", "Alberto Javier Martín", "Jordi Díaz", "Carlos Jiménez", "Jordi Díaz"];
                const p1 = fallbackPlayers[daySeed % fallbackPlayers.length];
                const p2 = fallbackPlayers[(daySeed + 2) % fallbackPlayers.length];
                
                const title = template.title;
                const snippet = template.snippet;
                const content = template.contentTemplate
                    .replace(/{PLAYER1}/g, p1)
                    .replace(/{PLAYER2}/g, p2);

                posts.push({
                    id: `auto-post-${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}`,
                    title: title,
                    category: template.category,
                    catColor: template.catColor,
                    imageUrl: template.imageUrl,
                    snippet: template.snippet,
                    content: content,
                    date: dateStr,
                    readTime: template.readTime,
                    emoji: template.emoji || '📰',
                    imgGrad: template.imgGrad || 'linear-gradient(135deg, #1e293b, #0f172a)',
                    timestamp: targetDate.getTime()
                });
            }
            return posts;
        }
    };

    class DashboardView {
        constructor() {
            this.matchUnsub = null;

            // Global Navigation Helper for News
            window.dashNavigate = (route, source = 'news') => {
                console.log(`🏁 [GLOBAL NAV] From: ${source}, Route: ${route}`);
                try {
                    // Close story modal if open (critical for navigation from stories)
                    if (window.StoryFeedWidget && typeof window.StoryFeedWidget.hideStory === 'function') {
                        window.StoryFeedWidget.hideStory();
                    }
                    if (route.startsWith('http')) {
                        window.open(route, '_blank');
                    } else if (window.Router) {
                        window.Router.navigate(route);
                    } else {
                        console.error("Router not found");
                    }
                } catch (e) {
                    console.error("Navigation failed:", e);
                }
            };

            // Helper to show weather details on click
            window.showWeatherDetails = () => {
                console.log("🌦️ [Weather Details] Scrolling to weather widget...");
                const target = document.getElementById('weather-widget-root');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Find the toggle button for El Prat or the first card and click it to expand
                    const btn = document.querySelector('[id^="weather-btn-"]');
                    const details = document.querySelector('[id^="weather-details-"]');
                    if (details && details.style.display === 'none' && btn) {
                        btn.click();
                    }
                }
            };

            if (window.Store) {
                this.unsubDashboard = window.Store.subscribe('dashboardData', (data) => {
                    if (window.Router && window.Router.currentRoute === 'dashboard') {
                        this.render(data);
                    }
                });
            }

            // AUTO-REFRESH MOTOR: Renovación inteligente cada 5 minutos
            this.refreshInterval = setInterval(() => {
                if (window.Router && window.Router.currentRoute === 'dashboard') {
                    console.log("🔄 [AI Motor] Renovando noticias y eventos en tiempo real...");
                    this.renderLiveWidget();
                }
            }, 5 * 60 * 1000); // 5 min

            // USER SYNC MOTOR: Ensure widgets refresh when user data arrives
            if (window.Store) {
                this.unsubUser = window.Store.subscribe('currentUser', (user) => {
                    if (user && window.Router && window.Router.currentRoute === 'dashboard') {
                        console.log("👤 [DashboardView] User synced, refreshing live content...");
                        this.buildContext(user).then(context => this.loadLiveWidgetContent(context));
                    }
                });
            }

        }

        async render(data) {
            console.log("📊 [DashboardView] Rendering started...", data);
            const container = document.getElementById('content-area');
            if (!container) return;

            // 1. Get Real User Data
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const userLevel = user ? (user.level || "3.5") : "3.5";

            // Soft Refresh if elements already exist in the DOM (prevents flickering and keeps WebGL/Three.js context alive)
            const isAlreadyRendered = document.getElementById('hero-card-root') !== null;
            if (isAlreadyRendered) {
                console.log("⚡ [DashboardView] Already rendered, performing soft refresh...");
                try {
                    // Update user stats dynamically
                    const lvlEl = document.getElementById('user-level-val');
                    if (lvlEl) lvlEl.innerText = userLevel;
                    const rnkEl = document.getElementById('user-ranking-val');
                    if (rnkEl) rnkEl.innerText = `#${user ? (user.ranking_pos || '—') : '—'}`;
                    const mtcEl = document.getElementById('user-matches-val');
                    if (mtcEl) mtcEl.innerText = user ? (user.total_matches || '0') : '0';

                    // Update Campaign Banner Visibility
                    const bannerEl = document.getElementById('season-campaign-banner-root');
                    if (bannerEl) {
                        const isSyncActive = window.SeasonCampaignService ? window.SeasonCampaignService.isCampaignActiveSync() : false;
                        bannerEl.style.display = isSyncActive ? 'block' : 'none';
                    }

                    // Build fresh context and load dynamic widgets
                    const context = await this.buildContext(user);
                    await this.loadLiveWidgetContent(context);

                    // Refresh Weather & Windy Radar in background
                    let weatherData = [];
                    if (window.WeatherService) {
                        try {
                            weatherData = await window.WeatherService.getDashboardWeather();
                        } catch (e) { console.error("Weather fetch failed during soft refresh", e); }
                    }
                    const weatherRoot = document.getElementById('weather-widget-root');
                    if (weatherRoot && weatherData && weatherData.length > 0) {
                        let weatherHtml = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">`;
                        weatherData.forEach(w => {
                            weatherHtml += this.renderWeatherCard(
                                w.name,
                                `${w.temp}°C`,
                                w.icon,
                                {
                                    wind: `${w.wind} km/h`,
                                    hum: `${w.humidity}%`,
                                    rain: `${w.rainProb}%`,
                                    uv: w.uv,
                                    pressure: w.pressure,
                                    visibility: w.visibility,
                                    intel: w.intelligence
                                },
                                w.isPropitious
                            );
                        });
                        weatherHtml += `</div>`;
                        
                        weatherHtml += `
                            <style>
                                @keyframes livePulse {
                                    0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.7); transform: scale(1); opacity: 1; }
                                    70% { box-shadow: 0 0 0 8px rgba(0, 227, 109, 0); transform: scale(1.2); opacity: 0.8; }
                                    100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); transform: scale(1); opacity: 1; }
                                }
                                @keyframes borderFlow {
                                    0% { border-color: rgba(255, 255, 255, 0.1); }
                                    50% { border-color: rgba(255, 255, 255, 0.25); }
                                    100% { border-color: rgba(255, 255, 255, 0.1); }
                                }
                            </style>
                            <div style="position: relative; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #0f172a; animation: borderFlow 4s infinite;">
                                <div style="background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <span style="font-size:0.75rem; font-weight:950; color:white; letter-spacing:0.5px;">RADAR TÁCTICO <span style="color:#CCFF00;">WAR ROOM</span></span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <button onclick="window.DashboardView.toggleTacticalHUD()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.3s; pointer-events: auto;">
                                            <i class="fas fa-eye"></i> TACTICAL HUD
                                        </button>
                                        <span style="width:8px; height:8px; background:#00E36D; border-radius:50%; animation: livePulse 2s infinite;"></span>
                                        <span style="font-size:0.6rem; color: #00E36D; font-weight: 900; letter-spacing:1px;">SCANNING</span>
                                    </div>
                                </div>
                                <div style="width: 100%; height: 280px; position: relative;">
                                    <iframe width="100%" height="100%" src="https://embed.windy.com/embed2.html?lat=41.320&lon=2.040&zoom=10&level=surface&overlay=radar&product=radar&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0" style="filter: contrast(1.1) brightness(0.8) grayscale(0.3);" loading="lazy"></iframe>
                                    <div style="pointer-events:none; position:absolute; inset:0; box-shadow: inset 0 0 50px rgba(0,0,0,0.8); background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(204,255,0,0.03) 100%);"></div>
                                    <div id="tactical-hud-grip" style="position:absolute; top:15px; left:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-left:3px solid #00E36D; pointer-events:none; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                        <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ESTADO DE PISTA</div>
                                        <div style="font-size:0.75rem; color:#fff; font-weight:1000;">GRIP: <span style="color:#00E36D;">ÓPTIMO (92%)</span></div>
                                        <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Prob. Pista resbaladiza: 12%</div>
                                    </div>
                                    <div id="tactical-hud-bounce" style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-right:3px solid #CCFF00; pointer-events:none; text-align:right; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                        <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">INTELIGENCIA BOLA</div>
                                        <div style="font-size:0.75rem; color:#fff; font-weight:1000;">REBOTE: <span style="color:#CCFF00;">ALTO (+15%)</span></div>
                                        <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Bola rápida + Presión detectada</div>
                                    </div>
                                    <div style="position:absolute; bottom:0; left:0; width:100%; height:1px; background:#CCFF00; opacity:0.3; box-shadow: 0 0 10px #CCFF00; animation: scannerSlide 4s linear infinite;"></div>
                                </div>
                            </div>
                        `;
                        weatherRoot.innerHTML = weatherHtml;
                    }

                    // Refresh News Blog
                    const blogRoot = document.getElementById('blog-news-widget-root');
                    if (blogRoot) {
                        blogRoot.innerHTML = this.renderBlogWidget();
                    }

                    // Refresh Stories & Open Matches
                    if (window.StoryFeedWidget) {
                        window.StoryFeedWidget.render('story-feed-root');
                    }
                    if (window.OpenMatchesWidget) {
                        window.OpenMatchesWidget.render('open-matches-widget-root');
                    }
                } catch (err) {
                    console.error("❌ Soft Refresh error:", err);
                }
                return;
            }

            // Header is updated globally by AppInstance in app.js on user change.
            // We just ensure we have visibility on the level here.

            // 2. Render IMMEDIATE SHELL (Experience-Focused)
            container.innerHTML = `
                <!-- MAIN DASHBOARD SCROLL CONTENT -->
                <div class="dashboard-v2-container fade-in full-width-mobile" style="
                    background: radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.08) 0%, transparent 70%);
                    min-height: 100vh;
                    padding-top: 0;
                ">


                    <!-- 0. HERO CARD (CONTEXT AWARE) -->
                    <div id="hero-card-root" style="animation: floatUp 0.8s ease-out forwards;">
                        <!-- Content loaded via JS (HeroCard) -->
                    </div>

                    <!-- 🔥 HERO CARD PREMIUM: TEMPORADA 2027 | EQUIPOS SOMOSPADEL -->
                    <div id="season-campaign-banner-root" style="margin: 0 15px 20px !important; animation: floatUp 0.5s ease-out forwards;">
                        <div style="
                            background: linear-gradient(145deg, #090e1a 0%, #0f172a 45%, #152238 100%);
                            border: 1.5px solid rgba(204, 255, 0, 0.45);
                            border-radius: 26px;
                            padding: 22px 20px;
                            position: relative;
                            overflow: hidden;
                            box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.65), 0 0 35px rgba(204, 255, 0, 0.15);
                            color: #ffffff;
                            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        ">
                            <!-- Glows y Auras Neón de Alta Competición -->
                            <div style="position: absolute; top: -50px; right: -50px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(204, 255, 0, 0.25) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
                            <div style="position: absolute; bottom: -50px; left: -50px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

                            <!-- Header: Badges Oficiales -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; position: relative; z-index: 2;">
                                <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                                    <span style="background: #CCFF00; color: #000000; font-size: 0.68rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.6px; text-transform: uppercase; box-shadow: 0 2px 10px rgba(204,255,0,0.35);">
                                        🔥 LIGA SUMMAPADEL 2027
                                    </span>
                                    <span style="background: rgba(239, 68, 68, 0.18); color: #fca5a5; font-size: 0.65rem; font-weight: 850; padding: 4px 9px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.35);">
                                        ⚡ PLAZAS LIMITADAS
                                    </span>
                                    <span style="background: rgba(56, 189, 248, 0.16); color: #7dd3fc; font-size: 0.65rem; font-weight: 850; padding: 4px 9px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.35);">
                                        🎯 PRUEBA DE NIVEL
                                    </span>
                                </div>
                                <span style="font-size: 0.70rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                    <span>📍</span> SomosPadel BCN • Bcn & Baix Llobregat
                                </span>
                            </div>

                            <!-- Título y Claim de Temporada -->
                            <div style="position: relative; z-index: 2; margin-bottom: 14px;">
                                <h3 style="margin: 0 0 6px; font-size: 1.35rem; font-weight: 950; color: #ffffff; line-height: 1.25; letter-spacing: -0.3px;">
                                    🏆 ÚNETE AL EQUIPO | <span style="color: #CCFF00; text-shadow: 0 0 16px rgba(204,255,0,0.4);">TEMPORADA 2027</span>
                                </h3>
                                <p style="margin: 0; font-size: 0.82rem; color: #cbd5e1; font-weight: 500; line-height: 1.45;">
                                    Todo el pádel, en una sola app. Compite defendiendo nuestros colores en la Liga Summapadel y vive una experiencia de club única.
                                </p>
                            </div>

                            <!-- Grid Central: Mini-Preview interactivo del Cartel + 4 Beneficios Clave -->
                            <div style="position: relative; z-index: 2; display: grid; grid-template-columns: 105px 1fr; gap: 14px; align-items: stretch; margin-bottom: 16px;">
                                
                                <!-- Mini Preview del Cartel Oficial (Abre Lightbox HD al pulsar) -->
                                <div 
                                    onclick="window.openSeasonFlyerModal();"
                                    title="Toca para ver el Cartel Oficial completo"
                                    style="
                                        position: relative;
                                        border-radius: 14px;
                                        overflow: hidden;
                                        border: 1.5px solid rgba(204, 255, 0, 0.55);
                                        cursor: pointer;
                                        box-shadow: 0 8px 22px rgba(0,0,0,0.55);
                                        background: #000000;
                                        display: flex;
                                        flex-direction: column;
                                        transition: transform 0.2s, box-shadow 0.2s;
                                    "
                                    onmouseover="this.style.transform='scale(1.03)'; this.style.boxShadow='0 10px 25px rgba(204,255,0,0.4)';"
                                    onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 22px rgba(0,0,0,0.55)';">
                                    <img 
                                        src="img/flyer_temporada_2027.jpg" 
                                        alt="Cartel Oficial Temporada 2027 SomosPadel" 
                                        style="width: 100%; height: 100%; object-fit: cover; display: block;"
                                    />
                                    <div style="
                                        position: absolute;
                                        bottom: 0;
                                        left: 0;
                                        right: 0;
                                        background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
                                        padding: 18px 4px 6px;
                                        text-align: center;
                                    ">
                                        <span style="
                                            background: #CCFF00;
                                            color: #000000;
                                            font-size: 0.60rem;
                                            font-weight: 950;
                                            padding: 3px 6px;
                                            border-radius: 6px;
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 3px;
                                            letter-spacing: 0.4px;
                                        ">
                                            🔍 VER CARTEL
                                        </span>
                                    </div>
                                </div>

                                <!-- 4 Beneficios Exclusivos del Equipo -->
                                <div style="display: flex; flex-direction: column; justify-content: space-between; gap: 7px;">
                                    <div style="display: flex; align-items: flex-start; gap: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); padding: 7px 10px; border-radius: 10px;">
                                        <span style="font-size: 1rem; line-height: 1;">👕</span>
                                        <div style="font-size: 0.73rem; color: #f1f5f9; line-height: 1.3;">
                                            <strong style="color: #CCFF00; font-weight: 800;">Camiseta técnica oficial:</strong> con tu nombre personalizado.
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: flex-start; gap: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); padding: 7px 10px; border-radius: 10px;">
                                        <span style="font-size: 1rem; line-height: 1;">📱</span>
                                        <div style="font-size: 0.73rem; color: #f1f5f9; line-height: 1.3;">
                                            <strong style="color: #38bdf8; font-weight: 800;">Gestión en App oficial:</strong> convocatorias, actas, ranking y chat.
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: flex-start; gap: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); padding: 7px 10px; border-radius: 10px;">
                                        <span style="font-size: 1rem; line-height: 1;">🎯</span>
                                        <div style="font-size: 0.73rem; color: #f1f5f9; line-height: 1.3;">
                                            <strong style="color: #fbbf24; font-weight: 800;">Clases de tecnificación:</strong> oferta exclusiva con Rubén Rosende.
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: flex-start; gap: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); padding: 7px 10px; border-radius: 10px;">
                                        <span style="font-size: 1rem; line-height: 1;">🤝</span>
                                        <div style="font-size: 0.73rem; color: #f1f5f9; line-height: 1.3;">
                                            <strong style="color: #c084fc; font-weight: 800;">Americanas & Teambuilding:</strong> eventos y dinamización todo el año.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Barra de Categorías y Precios Oficiales -->
                            <div style="
                                position: relative;
                                z-index: 2;
                                background: rgba(15, 23, 42, 0.75);
                                border: 1px solid rgba(255, 255, 255, 0.08);
                                border-radius: 14px;
                                padding: 10px 12px;
                                margin-bottom: 14px;
                                display: flex;
                                flex-direction: column;
                                gap: 8px;
                            ">
                                <!-- Categorías oficiales -->
                                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                                    <span style="font-size: 0.66rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                        CATEGORÍAS:
                                    </span>
                                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                        <span style="background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); color: #f472b6; font-size: 0.67rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                                            🚺 Fem (2ª, 3ª, 4ª)
                                        </span>
                                        <span style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; font-size: 0.67rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                                            🚹 Masc (2ª, 3ª, 4ª)
                                        </span>
                                        <span style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; font-size: 0.67rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                                            🚻 Mixto (3ª, 4ª)
                                        </span>
                                    </div>
                                </div>

                                <!-- Precios oficiales -->
                                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); flex-wrap: wrap; gap: 6px;">
                                    <span style="font-size: 0.68rem; color: #94a3b8; font-weight: 700;">
                                        Cuota de inscripción:
                                    </span>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="background: rgba(204, 255, 0, 0.12); border: 1px solid rgba(204, 255, 0, 0.35); color: #CCFF00; font-size: 0.75rem; font-weight: 950; padding: 3px 9px; border-radius: 7px;">
                                            1 EQUIPO: 55€
                                        </span>
                                        <span style="background: rgba(204, 255, 0, 0.18); border: 1px solid rgba(204, 255, 0, 0.55); color: #CCFF00; font-size: 0.75rem; font-weight: 950; padding: 3px 9px; border-radius: 7px; box-shadow: 0 0 10px rgba(204,255,0,0.2);">
                                            2 EQUIPOS: 95€
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- CTA Principal Brillante #CCFF00 -->
                            <button 
                                type="button" 
                                onclick="window.SeasonCampaignView && window.SeasonCampaignView.openModal('equipos');" 
                                style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    background: #CCFF00;
                                    color: #000000;
                                    border: none;
                                    border-radius: 14px;
                                    font-weight: 950;
                                    font-size: 0.90rem;
                                    letter-spacing: 0.5px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 8px;
                                    box-shadow: 0 4px 20px rgba(204, 255, 0, 0.4);
                                    transition: transform 0.2s, box-shadow 0.2s;
                                    margin-bottom: 10px;
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 24px rgba(204, 255, 0, 0.55)';"
                                onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 20px rgba(204, 255, 0, 0.4)';">
                                <i class="fas fa-rocket" style="font-size: 1rem;"></i>
                                <span>🚀 PRE-INSCRIBIRME EN UN EQUIPO</span>
                            </button>

                            <!-- CTAs Secundarios: Ver Cartel Oficial y WhatsApp Directo -->
                            <div style="display: flex; gap: 8px; position: relative; z-index: 2;">
                                <button 
                                    type="button" 
                                    onclick="window.openSeasonFlyerModal();" 
                                    style="
                                        flex: 1;
                                        padding: 10px 12px;
                                        background: rgba(255, 255, 255, 0.08);
                                        border: 1px solid rgba(255, 255, 255, 0.18);
                                        border-radius: 11px;
                                        color: #ffffff;
                                        font-size: 0.74rem;
                                        font-weight: 850;
                                        cursor: pointer;
                                        transition: background 0.2s, transform 0.2s;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 6px;
                                    "
                                    onmouseover="this.style.background='rgba(255, 255, 255, 0.14)';"
                                    onmouseout="this.style.background='rgba(255, 255, 255, 0.08)';">
                                    <span>🖼️</span> Ver Cartel Oficial
                                </button>
                                <a 
                                    href="https://wa.me/34649219350?text=¡Hola%20SomosPadel!%20Quiero%20más%20información%20sobre%20los%20Equipos%20de%20la%20Temporada%202027." 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style="
                                        flex: 1;
                                        padding: 10px 12px;
                                        background: rgba(37, 211, 102, 0.14);
                                        border: 1px solid rgba(37, 211, 102, 0.35);
                                        border-radius: 11px;
                                        color: #25D366;
                                        font-size: 0.74rem;
                                        font-weight: 850;
                                        cursor: pointer;
                                        text-decoration: none;
                                        transition: background 0.2s, transform 0.2s;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 6px;
                                    "
                                    onmouseover="this.style.background='rgba(37, 211, 102, 0.22)';"
                                    onmouseout="this.style.background='rgba(37, 211, 102, 0.14)';">
                                    <span>💬</span> Dudas por WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>



                    <!-- 3. SOMOSPADEL PLAYER COMMAND CENTER (PRO MATCH & ACTION HUB) -->
                    <div id="registration-widget-root" style="margin: 0 15px 22px !important; animation: floatUp 0.8s ease-out forwards;">
                        <!-- Match Hub Card Container -->
                        <div style="background: linear-gradient(145deg, #090e1a 0%, #0d1527 50%, #080d1a 100%); border-radius: 26px; border: 1.5px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 25px rgba(204, 255, 0, 0.04); padding: 18px; position: relative; overflow: hidden;">
                            
                            <!-- Ambient Light Accents -->
                            <div style="position: absolute; top: -40px; right: -40px; width: 140px; height: 140px; background: radial-gradient(circle, rgba(204, 255, 0, 0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
                            <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

                            <!-- Header Bar: Live Status + Weather Mini-Pill -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; position: relative; z-index: 2;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #CCFF00; display: inline-block; box-shadow: 0 0 10px #CCFF00, 0 0 20px rgba(204,255,0,0.5); animation: pulseDot 1.5s infinite; flex-shrink: 0;"></span>
                                    <span style="font-size: 0.72rem; font-weight: 950; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase;">CENTRO DE JUEGO</span>
                                </div>
                                <div id="header-weather-pill" onclick="window.showWeatherDetails()" style="cursor: pointer; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.68rem; color: #cbd5e1; font-weight: 800; transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(56,189,248,0.4)'; this.style.color='#ffffff';" onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.color='#cbd5e1';">
                                    <i class="fas fa-cloud-sun" style="color: #38bdf8;"></i>
                                    <span>Meteo Padel</span>
                                </div>
                            </div>

                            <!-- Dynamic Content Container -->
                            <div id="live-scroller-inner">
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <!-- Skeleton for Hero Match -->
                                    <div style="height: 100px; border-radius: 18px; background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div>
                                    <!-- Skeleton for 4 Quick Actions -->
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div style="height: 64px; border-radius: 14px; background: rgba(255,255,255,0.04);"></div>
                                        <div style="height: 64px; border-radius: 14px; background: rgba(255,255,255,0.04);"></div>
                                        <div style="height: 64px; border-radius: 14px; background: rgba(255,255,255,0.04);"></div>
                                        <div style="height: 64px; border-radius: 14px; background: rgba(255,255,255,0.04);"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. PULSE STORIES (Instagram Style) -->
                    <div id="story-feed-root" style="margin: 0 !important; padding: 0;">
                        <!-- Cargado vía JS (StoryFeedWidget) -->
                    </div>

                    <!-- 3.5 NEWS BLOG WIDGET -->
                    <div id="blog-news-widget-root" style="margin: 0 15px 12px !important; animation: floatUp 0.8s ease-out forwards;">
                        <!-- Content loaded via JS -->
                    </div>

                    <!-- 🎾 PARTIDAS ABIERTAS — Widget de publicidad interactivo -->
                    <div id="open-matches-widget-root" style="animation: floatUp 0.8s ease-out forwards;"></div>

                    <!-- 🏆 RANKING SPOTLIGHT -->
                    <div id="ranking-spotlight-root" style="margin:0 15px 16px; animation:floatUp 0.8s ease-out forwards;">
                        <style>
                            #trending-players-list::-webkit-scrollbar {
                                height: 5px;
                                display: block !important;
                            }
                            #trending-players-list::-webkit-scrollbar-track {
                                background: rgba(0, 0, 0, 0.03);
                                border-radius: 10px;
                            }
                            #trending-players-list::-webkit-scrollbar-thumb {
                                background: rgba(114, 168, 0, 0.35);
                                border-radius: 10px;
                            }
                            #trending-players-list::-webkit-scrollbar-thumb:hover {
                                background: rgba(114, 168, 0, 0.6);
                            }
                        </style>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 4px;">
                            <div style="font-weight:950; font-size:0.85rem; color:#0a192f; letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-trophy" style="color: #fbbf24; font-size: 1rem;"></i> TOP 10 ELITE
                            </div>
                            <div style="font-size:0.65rem; color:#72a800; font-weight:950; cursor:pointer;" onclick="window.Router.navigate('ranking')">VER RANKING <i class="fas fa-chevron-right" style="font-size:0.55rem;"></i></div>
                        </div>
                        <div id="mvp-spotlight-container" style="margin-bottom:12px;"></div>
                        <div id="trending-players-list" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:12px; scrollbar-width:thin; scrollbar-color:rgba(114,168,0,0.35) transparent; -webkit-overflow-scrolling:touch;">
                            <div style="margin:20px auto; color:#94a3b8;"><i class="fas fa-circle-notch fa-spin"></i></div>
                        </div>
                    </div>

                    <!-- 7. MERCH PROMO (SOMOS PADEL BCN) - FINAL MOBILE FIX -->
                    <div id="merch-widget-root" onclick="window.open('https://wa.me/34649219350?text=Hola!%20Me%20interesa%20la%20sudadera%20de%20Somos%20Padel%20BCN', '_blank')" style="
                        margin: 0 15px 8px !important;
                        background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
                        border-radius: 24px;
                        padding: 0;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
                        border: 1px solid rgba(255, 255, 255, 0.25);
                        cursor: pointer;
                        animation: floatUp 0.8s ease-out forwards;
                        display: flex;
                        height: 180px;
                        transition: transform 0.2s;
                    " onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
                        
                        <!-- BG Effect -->
                        <div style="position: absolute; top:0; left:0; width:100%; height:100%; opacity: 0.1; background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 15px 15px; pointer-events: none;"></div>

                        <!-- Image Section (Left) - PRECISION MASKING -->
                        <div style="width: 42%; position: relative; display: flex; align-items: center; justify-content: center; z-index: 5; pointer-events: none;">
                             <img src="./img/sudadera.jpg" 
                                  onerror="this.style.display='none'" 
                                  style="
                                      width: 110%; 
                                      height: 110%; 
                                      object-fit: contain; 
                                      transform: rotate(-3deg) translateX(-5px); 
                                      filter: drop-shadow(0 25px 35px rgba(0,0,0,0.7)) brightness(1.05) contrast(1.1);
                                  ">
                        </div>

                        <!-- Content Section (Right) - DARK GRADIENT FOR LEGIBILITY -->
                        <div style="width: 60%; padding: 15px 15px 15px 10px; display: flex; flex-direction: column; justify-content: center; gap: 6px; position: relative; z-index: 10; pointer-events: none; background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.8) 100%);">
                            
                            <div style="background: #CCFF00; color: #000; font-size: 0.6rem; font-weight: 1000; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; width: fit-content; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                                NUEVA COLECCIÓN
                            </div>
                            
                            <h3 style="margin: 0; font-size: 1.4rem; color: white; font-weight: 950; line-height: 1; text-shadow: 0 4px 15px rgba(0,0,0,0.8);">
                                SUDADERA
                            </h3>
                            
                            <div style="font-size: 0.95rem; color: rgba(255,255,255,1); font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,1);">
                                SOMOSPADEL BCN
                            </div>
                            
                            <div style="color:#CCFF00; font-weight:900; font-size: 1.5rem; text-shadow:0 3px 12px rgba(0,0,0,0.8); margin: 2px 0;">
                                24<span style="font-size:0.85rem; vertical-align:top;">,99€</span>
                            </div>

                            <div style="pointer-events: auto; margin-top: 4px;">
                                <div style="
                                    background: white; 
                                    color: #1e40af; 
                                    font-size: 0.8rem; 
                                    font-weight: 1000; 
                                    padding: 10px 22px; 
                                    border-radius: 14px; 
                                    box-shadow: 0 8px 20px rgba(0,0,0,0.3); 
                                    display: inline-flex; 
                                    align-items: center; 
                                    gap: 8px; 
                                    transition: all 0.2s;
                                    cursor: pointer;
                                " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 12px 25px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.3)'">
                                    COMPRAR <i class="fas fa-shopping-cart" style="font-size: 0.8rem;"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 📡 ESPN FACEOFF COMPARATOR -->
                    <div id="player-faceoff-widget-root" style="margin: 0 15px 12px !important; animation: floatUp 0.8s ease-out forwards;"></div>
                    <!-- 🎾 WAR ROOM 3D TACTICAL BOARD PREVIEW -->
                    <div id="tactical-3d-widget-root" style="animation: floatUp 0.8s ease-out forwards;"></div>

                    <!-- 3. WEATHER WIDGET -->
                    <div id="weather-widget-root" style="margin: 0 15px 8px !important; animation: floatUp 0.8s ease-out forwards;">
                        <!-- Content loaded via JS -->
                    </div>

                    <!-- (Old Partner Synergy root removed to favor the new Predictive AI Engine) -->

                    <!-- 4. ACTIVIDAD RECIENTE -->
                    <div id="activity-feed-root" style="
                        background: rgba(10, 10, 20, 0.9);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(0, 227, 109, 0.2);
                        border-radius: 20px;
                        margin: 0 15px 8px !important;
                        padding: 12px !important;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                        animation: floatUp 0.85s ease-out forwards;
                    ">
                        <div style="font-weight:950; font-size:0.85rem; color:white; letter-spacing:-0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                            <i class="fas fa-rss" style="color: #00E36D; font-size: 1rem;"></i> ACTIVIDAD RECIENTE
                        </div>
                        <div id="activity-feed-content" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Content loaded via JS -->
                        </div>


                    </div>
                </div>

                <style>
                    .dashboard-v2-container ::-webkit-scrollbar { display: none; }
                </style>
    `;

            // Control de Visibilidad de la Campaña de Temporada (Activación desde Admin)
            try {
                const bannerEl = document.getElementById('season-campaign-banner-root');
                if (bannerEl) {
                    const isSyncActive = window.SeasonCampaignService ? window.SeasonCampaignService.isCampaignActiveSync() : false;
                    bannerEl.style.display = isSyncActive ? 'block' : 'none';

                    if (window.SeasonCampaignService && typeof window.SeasonCampaignService.isCampaignActive === 'function') {
                        window.SeasonCampaignService.isCampaignActive().then(isActive => {
                            if (bannerEl) bannerEl.style.display = isActive ? 'block' : 'none';
                        }).catch(() => {});
                    }
                }
            } catch (e) {
                console.warn('[DashboardView] Error checking campaign visibility:', e);
            }

            // 4. ASYNC LOADING OF DATA-DEPENDENT COMPONENTS
            try {
                // Build context (Might take time)
                const context = await this.buildContext(user);

                // phase 3: load dynamic contents
                this.loadLiveWidgetContent(context);

                // 2026 UPDATE: Init Header Ticker Sync
                this.initHeaderTickerSync();

                window.scrollTo(0, 0);




                // 2. Fetch Real Data for Weather Cards
                let weatherData = [];
                try {
                    if (window.WeatherService) {
                        weatherData = await window.WeatherService.getDashboardWeather();
                    }
                } catch (e) { console.error("Weather fetch failed", e); }

                // 2.2 Populate Weather Widget (Cards + Radar)
                const weatherRoot = document.getElementById('weather-widget-root');
                if (weatherRoot) {
                    let weatherHtml = '';

                    // Render Cards first
                    if (weatherData && weatherData.length > 0) {
                        weatherHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">`;
                        weatherData.forEach(w => {
                            weatherHtml += this.renderWeatherCard(
                                w.name,
                                `${w.temp}°C`,
                                w.icon,
                                {
                                    wind: `${w.wind} km/h`,
                                    hum: `${w.humidity}%`,
                                    rain: `${w.rainProb}%`,
                                    uv: w.uv,
                                    pressure: w.pressure,
                                    visibility: w.visibility,
                                    intel: w.intelligence
                                },
                                w.isPropitious
                            );
                        });
                        weatherHtml += `</div>`;
                    } else {
                        weatherHtml += `
                            <div onclick="Router.navigate('entrenos')" style="
                                text-align: center;
                                padding: 50px 20px;
                                background: #111;
                                border-radius: 24px;
                                border: 1px solid rgba(204,255,0,0.1);
                                position: relative;
                                overflow: hidden;
                                box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                                cursor: pointer;
                            ">
                                <!-- Tech Radar Animation -->
                                <div style="
                                    position: absolute; top: 0; left: 0; width: 200%; height: 2px;
                                    background: linear-gradient(90deg, transparent, #CCFF00, transparent);
                                    animation: scannerMove 4s linear infinite;
                                    opacity: 0.3;
                                "></div>
                                
                                <i class="fas fa-radar-scan fa-spin" style="
                                    font-size: 3.5rem;
                                    color: #CCFF00;
                                    margin-bottom: 20px;
                                    opacity: 0.2;
                                    display: block;
                                "></i>
                                
                                <div style="
                                    color: white;
                                    font-size: 1.1rem;
                                    font-weight: 950;
                                    letter-spacing: -0.5px;
                                    text-transform: uppercase;
                                ">RADAR DE COMPATIBILIDAD <span style="color:#CCFF00;">EN ESPERA</span></div>
                                
                                <div style="
                                    color: rgba(255,255,255,0.4);
                                    font-size: 0.8rem;
                                    margin-top: 10px;
                                    font-weight: 600;
                                    max-width: 240px;
                                    margin: 10px auto 0;
                                ">Necesitamos más datos de nivel y victorias para calcular tu pareja perfecta.</div>

                                <style>
                                    @keyframes scannerMove {
                                        0% { transform: translateY(-50px); opacity: 0; }
                                        50% { opacity: 0.5; }
                                        100% { transform: translateY(200px); opacity: 0; }
                                    }
                                </style>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                ${this.renderWeatherCard('EL PRAT', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                                ${this.renderWeatherCard('CORNELLÀ', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                            </div>`;
                    }

                    // Append Radar below
                    weatherHtml += `
                        <style>
                            @keyframes livePulse {
                                0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.7); transform: scale(1); opacity: 1; }
                                70% { box-shadow: 0 0 0 8px rgba(0, 227, 109, 0); transform: scale(1.2); opacity: 0.8; }
                                100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); transform: scale(1); opacity: 1; }
                            }
                            @keyframes borderFlow {
                                0% { border-color: rgba(255, 255, 255, 0.1); }
                                50% { border-color: rgba(255, 255, 255, 0.25); }
                                100% { border-color: rgba(255, 255, 255, 0.1); }
                            }
                        </style>
                        <div style="position: relative; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #0f172a; animation: borderFlow 4s infinite;">
                            <div style="background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-size:0.75rem; font-weight:950; color:white; letter-spacing:0.5px;">RADAR TÁCTICO <span style="color:#CCFF00;">WAR ROOM</span></span>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <button onclick="window.DashboardView.toggleTacticalHUD()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.3s; pointer-events: auto;">
                                        <i class="fas fa-eye"></i> TACTICAL HUD
                                    </button>
                                    <span style="width:8px; height:8px; background:#00E36D; border-radius:50%; animation: livePulse 2s infinite;"></span>
                                    <span style="font-size:0.6rem; color: #00E36D; font-weight: 900; letter-spacing:1px;">SCANNING</span>
                                </div>
                            </div>
                            <div style="width: 100%; height: 280px; position: relative;">
                                <iframe width="100%" height="100%" src="https://embed.windy.com/embed2.html?lat=41.320&lon=2.040&zoom=10&level=surface&overlay=radar&product=radar&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0" style="filter: contrast(1.1) brightness(0.8) grayscale(0.3);" loading="lazy"></iframe>
                                
                                <!-- WAR ROOM TACTICAL OVERLAYS -->
                                <div style="pointer-events:none; position:absolute; inset:0; box-shadow: inset 0 0 50px rgba(0,0,0,0.8); background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(204,255,0,0.03) 100%);"></div>
                                
                                <!-- HUD TOP LEFT: Pista Status -->
                                <div id="tactical-hud-grip" style="position:absolute; top:15px; left:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-left:3px solid #00E36D; pointer-events:none; animation: floatUp 0.8s ease-out; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ESTADO DE PISTA</div>
                                    <div style="font-size:0.75rem; color:#fff; font-weight:1000;">GRIP: <span style="color:#00E36D;">ÓPTIMO (92%)</span></div>
                                    <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Prob. Pista resbaladiza: 12%</div>
                                </div>

                                <!-- HUD TOP RIGHT: Rebote/Presión -->
                                <div id="tactical-hud-bounce" style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); padding:8px 12px; border-radius:8px; border-right:3px solid #CCFF00; pointer-events:none; text-align:right; animation: floatUp 0.8s ease-out 0.2s both; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                    <div style="font-size:0.5rem; color:#888; font-weight:900; text-transform:uppercase; letter-spacing:1px;">INTELIGENCIA BOLA</div>
                                    <div style="font-size:0.75rem; color:#fff; font-weight:1000;">REBOTE: <span style="color:#CCFF00;">ALTO (+15%)</span></div>
                                    <div style="font-size:0.45rem; color:rgba(255,255,255,0.4); font-weight:700; margin-top:2px;">Bola rápida + Presión detectada</div>
                                </div>

                                <!-- HUD BOTTOM CENTER: Scan Line -->
                                <div style="position:absolute; bottom:0; left:0; width:100%; height:1px; background:#CCFF00; opacity:0.3; box-shadow: 0 0 10px #CCFF00; animation: scannerSlide 4s linear infinite;"></div>
                                
                                <style>
                                    @keyframes scannerSlide {
                                        0% { bottom: 0; opacity: 0; }
                                        10% { opacity: 0.5; }
                                        90% { opacity: 0.5; }
                                        100% { bottom: 100%; opacity: 0; }
                                    }
                                </style>
                            </div>
                        </div>
                    `;
                    weatherRoot.innerHTML = weatherHtml;
                    weatherRoot.style.display = 'block';
                }

                // Load Blog News Widget
                const blogRoot = document.getElementById('blog-news-widget-root');
                if (blogRoot) {
                    blogRoot.innerHTML = this.renderBlogWidget();
                }

                // Deep-linking para noticias compartidas (?post=ID)
                const urlParams = new URLSearchParams(window.location.search);
                const sharePostId = urlParams.get('post');
                if (sharePostId) {
                    setTimeout(() => {
                        this.openBlogPost(sharePostId);
                    }, 650); // Tiempo óptimo para inyección en el DOM y carga de Firestore
                }

                // PRO CONTENT (AGENDA) REMOVED PER USER REQUEST

            } catch (err) {
                console.error("Dashboard Render Error:", err);
            }

            // 4. INIT HEADER TICKER SYNC
            try {
                this.initHeaderTickerSync();
            } catch (e) {
                console.error("Error running initHeaderTickerSync:", e);
            }

            // 5. FORCE LOAD NETWORK PULSE & STORIES
            try {
                if (window.StoryFeedWidget) {
                    window.StoryFeedWidget.render('story-feed-root');
                }
            } catch (e) {
                console.error("Error rendering StoryFeedWidget:", e);
            }

            // 🎾 PARTIDAS ABIERTAS — Widget de publicidad en tiempo real
            try {
                if (window.OpenMatchesWidget) {
                    window.OpenMatchesWidget.render('open-matches-widget-root');
                }
            } catch (e) {
                console.error("Error rendering OpenMatchesWidget:", e);
            }

            // 🎾 WAR ROOM 3D TACTICAL WIDGET
            try {
                const tacticalRoot = document.getElementById('tactical-3d-widget-root');
                if (tacticalRoot && window.Tactical3DWidget) {
                    tacticalRoot.innerHTML = window.Tactical3DWidget.renderHTML();
                    
                    const startWidget = () => {
                        setTimeout(() => {
                            if (document.getElementById('three-tactical-canvas') && window.Tactical3DWidget) {
                                window.Tactical3DWidget.init('three-tactical-canvas');
                            }
                        }, 50);
                    };

                    if (!window.THREE) {
                        console.log("🌐 [DashboardView] Three.js no está en window, cargando dinámicamente...");
                        window.loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE')
                            .then(() => {
                                console.log("✅ [DashboardView] Three.js cargado dinámicamente con éxito para el widget táctico.");
                                startWidget();
                            })
                            .catch(err => console.error("❌ [DashboardView] Error al cargar Three.js para Tactical3DWidget:", err));
                    } else {
                        startWidget();
                    }
                }
            } catch (e) {
                console.error("Error rendering Tactical3DWidget:", e);
            }

        }

        initHeaderTickerSync() {
            // REDUNDANT: Handled by core/SmartTicker.js
            console.log("📺 [DashboardView] Ticker management delegated to SmartTicker.js for premium TV experience.");
        }

        toggleWeatherDetails(safeCityId) {
            const details = document.getElementById(`weather-details-${safeCityId}`);
            const insight = document.getElementById(`weather-insight-${safeCityId}`);
            const btn = document.getElementById(`weather-btn-${safeCityId}`);
            
            if (details && btn) {
                if (details.style.display === 'none') {
                    details.style.display = 'flex';
                    if (insight) insight.style.display = 'block';
                    btn.innerHTML = `Ver menos <i class="fas fa-chevron-up" id="weather-icon-${safeCityId}"></i>`;
                } else {
                    details.style.display = 'none';
                    if (insight) insight.style.display = 'none';
                    btn.innerHTML = `Ver más <i class="fas fa-chevron-down" id="weather-icon-${safeCityId}"></i>`;
                }
            }
        }

        toggleActivityFeed() {
            const container = document.getElementById('activity-extended-container');
            const btn = document.getElementById('activity-toggle-btn');
            
            if (container && btn) {
                if (container.style.display === 'none') {
                    container.style.display = 'flex';
                    btn.innerHTML = `Ver menos <i class="fas fa-chevron-up" id="activity-toggle-icon"></i>`;
                } else {
                    container.style.display = 'none';
                    btn.innerHTML = `Ver más <i class="fas fa-chevron-down" id="activity-toggle-icon"></i>`;
                }
            }
        }

        showShareMenu(postId, title) {
            const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
            const shareText = `¡Mira esta noticia en SomosPadel BCN! 🎾\n\n"${title}"\n\n`;
            
            // Si ya existe un menú de compartir previo, lo eliminamos
            const existingShare = document.getElementById('blog-share-menu-modal');
            if (existingShare) existingShare.remove();
            
            const shareModal = document.createElement('div');
            shareModal.id = 'blog-share-menu-modal';
            shareModal.style = `
                position: fixed; inset: 0; z-index: 999999999 !important;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                display: flex; align-items: center; justify-content: center;
                padding: 20px; font-family: 'Outfit', sans-serif;
                animation: fadeIn 0.25s ease-out;
            `;
            
            shareModal.innerHTML = `
                <div style="background: #090f1e; border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; width: 100%; max-width: 360px; padding: 24px; box-shadow: 0 30px 70px rgba(0,0,0,0.85); position: relative; text-align: center; animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    
                    <!-- Botón de Cerrar del Menú de Compartir -->
                    <button id="share-modal-close-btn" 
                            style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                        <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                    </button>
                    
                    <div style="margin-bottom: 22px;">
                        <span style="font-size: 2.5rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));">📢</span>
                        <h4 style="color: white; font-weight: 950; font-size: 1.25rem; margin: 12px 0 6px 0; letter-spacing: -0.4px;">Compartir Noticia</h4>
                        <p style="color: rgba(255,255,255,0.5); font-size: 0.78rem; line-height: 1.4; margin: 0; padding: 0 10px;">Selecciona el canal oficial para compartir este contenido con tu red de pádel.</p>
                    </div>
                    
                    <!-- Lista de Opciones Premium -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        
                        <!-- WhatsApp Option -->
                        <button id="share-btn-whatsapp"
                                style="background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.25); color: #25D366; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(37, 211, 102, 0.2)';this.style.borderColor='#25D366';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(37, 211, 102, 0.1)';this.style.borderColor='rgba(37, 211, 102, 0.25)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i>
                            <span>Compartir por WhatsApp</span>
                        </button>
                        
                        <!-- Instagram Option -->
                        <button id="share-btn-instagram"
                                style="background: rgba(225, 48, 108, 0.1); border: 1px solid rgba(225, 48, 108, 0.25); color: #E1306C; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(225, 48, 108, 0.2)';this.style.borderColor='#E1306C';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(225, 48, 108, 0.1)';this.style.borderColor='rgba(225, 48, 108, 0.25)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fab fa-instagram" style="font-size: 1.2rem;"></i>
                            <span>Compartir en Instagram</span>
                        </button>
                        
                        <!-- Copiar Enlace Option -->
                        <button id="share-btn-copy"
                                style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); color: #3b82f6; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(59, 130, 246, 0.2)';this.style.borderColor='#3b82f6';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(59, 130, 246, 0.1)';this.style.borderColor='rgba(59, 130, 246, 0.25)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fas fa-link" style="font-size: 1rem;"></i>
                            <span>Copiar Enlace de Noticia</span>
                        </button>

                        <!-- Compartir Nativo -->
                        <button id="native-share-btn"
                                style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: white; font-weight: 800; font-size: 0.85rem; padding: 12px 16px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                                onmouseover="this.style.background='rgba(255, 255, 255, 0.08)';this.style.transform='scale(1.03) translateY(-1px)';"
                                onmouseout="this.style.background='rgba(255, 255, 255, 0.04)';this.style.transform='scale(1) translateY(0)';">
                            <i class="fas fa-share-alt" style="font-size: 1rem;"></i>
                            <span>Otras aplicaciones</span>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(shareModal);
            
            // Asignamos manejadores de eventos directos sin dependencias globales
            const closeBtn = shareModal.querySelector('#share-modal-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    shareModal.remove();
                });
            }

            const waBtn = shareModal.querySelector('#share-btn-whatsapp');
            if (waBtn) {
                waBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.actionShare('whatsapp', shareUrl, encodeURIComponent(shareText));
                });
            }

            const igBtn = shareModal.querySelector('#share-btn-instagram');
            if (igBtn) {
                igBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.actionShare('instagram', shareUrl, '');
                });
            }

            const copyBtn = shareModal.querySelector('#share-btn-copy');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.actionShare('copy', shareUrl, '');
                });
            }

            const nativeBtn = shareModal.querySelector('#native-share-btn');
            if (nativeBtn) {
                if (navigator.share) {
                    nativeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.actionShare('native', shareUrl, encodeURIComponent(shareText));
                    });
                } else {
                    nativeBtn.style.display = 'none';
                }
            }
            
            // Cerrar menú de compartir si se hace clic fuera de la tarjeta
            shareModal.onclick = (e) => {
                if (e.target === shareModal) shareModal.remove();
            };
        }

        async actionShare(type, url, textDecoded) {
            const text = decodeURIComponent(textDecoded);
            
            // Eliminar modal de compartir al ejecutar acción
            const menu = document.getElementById('blog-share-menu-modal');
            if (menu) menu.remove();
            
            if (type === 'whatsapp') {
                const waUrl = `https://wa.me/?text=${encodeURIComponent(text + url)}`;
                window.open(waUrl, '_blank');
            } else if (type === 'instagram') {
                try {
                    await navigator.clipboard.writeText(url);
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: '📸 ENLACE COPIADO',
                            message: '<b>Hemos copiado el enlace al portapapeles.</b><br><br>Ahora abriremos Instagram para que puedas crear una Story o enviárselo por mensaje directo a tus amigos y compañeros de SomosPadel. 🎾',
                            type: 'success'
                        });
                    } else {
                        alert('¡Enlace copiado! Abre Instagram para pegarlo en tus Stories.');
                    }
                    setTimeout(() => {
                        window.open('https://www.instagram.com', '_blank');
                    }, 600);
                } catch (e) {
                    console.warn("Fallo al copiar para Instagram share:", e);
                }
            } else if (type === 'copy') {
                try {
                    await navigator.clipboard.writeText(url);
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: '📋 COPIADO AL PORTAPAPELES',
                            message: 'El enlace directo a la noticia ha sido guardado con éxito. ¡Listo para pegar en cualquier chat! 🎾',
                            type: 'success'
                        });
                    } else {
                        alert('¡Enlace copiado al portapapeles!');
                    }
                } catch (e) {
                    console.warn("Fallo al copiar enlace:", e);
                }
            } else if (type === 'native') {
                try {
                    await navigator.share({
                        title: 'SomosPadel BCN',
                        text: text,
                        url: url
                    });
                } catch (e) {
                    console.warn('Native share cancelled:', e);
                }
            }
        }

        // ─── SOMOS PÁDEL JOURNAL: MÉTODOS SOCIALES & FAVORITOS ───
        shareBlogPost(postId, title) {
            this.showShareMenu(postId, title);
        }

        shareToWhatsApp(postId, title, event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            const cleanTitle = (title || 'Noticia de Pádel').replace(/["']/g, '');
            const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
            const text = `🎾 *SOMOS PÁDEL BCN*\n\n¡Mira esta táctica para nuestro próximo partido!\n👉 *"${cleanTitle}"*\n\n📲 Léelo aquí: ${shareUrl}`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        }

        getSavedBlogPosts() {
            try {
                const raw = localStorage.getItem('somospadel_saved_posts');
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        }

        isPostSaved(postId) {
            const saved = this.getSavedBlogPosts();
            return saved.includes(postId);
        }

        toggleSaveBlogPost(postId, event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            try {
                let saved = this.getSavedBlogPosts();
                const wasSaved = saved.includes(postId);
                if (wasSaved) {
                    saved = saved.filter(id => id !== postId);
                    this.showJournalToast('Noticia eliminada de guardados', 'fas fa-bookmark');
                } else {
                    saved.push(postId);
                    this.showJournalToast('¡Guardado en tus tácticas favoritas!', 'fas fa-star');
                }
                localStorage.setItem('somospadel_saved_posts', JSON.stringify(saved));

                // Actualizar iconos reactivos en la vista
                document.querySelectorAll(`.journal-bookmark-btn[data-post-id="${postId}"]`).forEach(btn => {
                    const icon = btn.querySelector('i');
                    if (icon) {
                        if (!wasSaved) {
                            icon.className = 'fas fa-bookmark';
                            btn.style.color = '#CCFF00';
                            btn.style.borderColor = '#CCFF00';
                        } else {
                            icon.className = 'far fa-bookmark';
                            btn.style.color = '#ffffff';
                            btn.style.borderColor = 'rgba(255,255,255,0.25)';
                        }
                    }
                });

                // Si estamos en la pestaña FAVORITOS, refrescar lista
                const filterContainer = document.querySelector('.blog-categories-filter');
                const favBtn = filterContainer ? filterContainer.querySelector('.blog-filter-btn.active') : null;
                if (favBtn && favBtn.textContent.includes('GUARDADOS')) {
                    this.renderBlogPostsHTML(this.cachedBlogPosts || [], 'FAVORITOS');
                }
            } catch (err) {
                console.error("Error al gestionar favoritos:", err);
            }
        }

        showJournalToast(message, iconClass = 'fas fa-check-circle') {
            const existingToast = document.getElementById('journal-floating-toast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.id = 'journal-floating-toast';
            toast.style = `
                position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
                background: #090f1e; border: 1.5px solid #CCFF00; color: #ffffff;
                padding: 10px 20px; border-radius: 30px; font-family: 'Outfit', sans-serif;
                font-size: 0.75rem; font-weight: 850; display: flex; align-items: center; gap: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(204,255,0,0.3);
                z-index: 999999999; opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: none;
            `;
            toast.innerHTML = `<i class="${iconClass}" style="color: #CCFF00; font-size: 0.9rem;"></i> <span>${message}</span>`;
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(15px)';
                setTimeout(() => toast.remove(), 300);
            }, 2400);
        }

        renderBlogWidget() {
            // Fetch async, inject into shell
            setTimeout(async () => {
                const container = document.getElementById('dynamic-blog-posts-container');
                if (!container) return;
                try {
                    // Generar automáticamente la noticia de hoy en segundo plano si es necesario
                    if (window.SomosPadelNewsEngine) {
                        try {
                            await window.SomosPadelNewsEngine.checkAndGenerateNews();
                        } catch (genErr) {
                            console.warn("Fallo al autogenerar noticias:", genErr);
                        }
                    }

                    const db = window.db || firebase.firestore();
                    const snapshot = await db.collection('blog_posts').orderBy('timestamp', 'desc').get();
                    let posts = [];
                    if (!snapshot.empty) {
                        posts = snapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data
                            };
                        });
                    } else {
                        // Usar fallback determinista autónomo en lugar de posts estáticos fijos
                        posts = window.SomosPadelNewsEngine ? window.SomosPadelNewsEngine.getDeterministicFallbackPosts() : [
                            { id: 'torneo-primavera', category: '🏆 TORNEOS', catColor: '#CCFF00', title: 'Gran Torneo de Primavera 2026', snippet: '¡Inscripciones abiertas! 120 plazas, Welcome Pack premium y barbacoa final.', content: 'Llega el evento más esperado del año. El 15 de Junio celebraremos el Gran Torneo de Primavera con categorías masculina, femenina y mixta. ¡Reserva tu plaza!', date: 'Hoy', readTime: '2 min', imageUrl: 'img/blog_action_smash.png' },
                            { id: 'ranking-actualizado', category: '📊 RANKING', catColor: '#38bdf8', title: 'Ranking Actualizado: Top 5 de la Temporada', snippet: 'El ranking se ha recalculado. ¿Has subido posiciones esta semana?', content: 'Consulta tu posición actualizada en la sección Ranking. Nuevos puntos asignados tras la última jornada.', date: 'Ayer', readTime: '2 min', imageUrl: 'img/blog_court_night.png' },
                            { id: 'tactica-centro', category: '💡 CONSEJOS', catColor: '#f59e0b', title: 'Táctica: Jugar al Centro de la Pista', snippet: 'Jugar al medio reduce los ángulos del rival y genera dudas en la pareja contraria.', content: 'El centro de la pista es la clave táctica más potente del pádel. Al tirar al centro reduces ángulos y generas confusión.', date: 'Hace 3 días', readTime: '3 min', imageUrl: 'img/blog_racket_ball.png' }
                        ];
                    }

                    // Guardar en caché local para filtrado instantáneo
                    this.cachedBlogPosts = posts;

                    // Renderizar con categoría ALL
                    this.renderBlogPostsHTML(posts, 'ALL');

                } catch (err) {
                    console.error("Fallo al inyectar blog posts dinámicos:", err);
                    container.innerHTML = '';
                }
            }, 100);

            return `
                <div class="blog-widget-main-container" style="background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 28px; padding: 20px; box-shadow: 0 10px 30px rgba(10, 25, 47, 0.03); position: relative; overflow: hidden; perspective: 1000px; transform-style: preserve-3d;">
                    <!-- Efectos de brillo de fondo ultra sutiles (marca SomosPadel) -->
                    <div style="position: absolute; top: -60px; right: -40px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(204,255,0,0.06) 0%, transparent 70%); pointer-events: none; filter: blur(25px);"></div>
                    <div style="position: absolute; bottom: -60px; left: -40px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(46,97,255,0.04) 0%, transparent 70%); pointer-events: none; filter: blur(25px);"></div>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(15, 23, 42, 0.06);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 38px; height: 38px; border-radius: 12px; background: #000000; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(204,255,0,0.25); border: 1.5px solid #CCFF00; flex-shrink: 0;">
                                <i class="fas fa-newspaper" style="font-size: 0.95rem; color: #CCFF00;"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.95rem; font-weight: 1000; color: #0f172a; letter-spacing: -0.3px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">Somos Pádel Journal</div>
                                <div style="font-size: 0.62rem; color: #64748b; font-weight: 850; letter-spacing: 0.6px; text-transform: uppercase;">NOTICIAS, TÁCTICA Y NOVEDADES</div>
                            </div>
                        </div>
                        <div style="background: rgba(204,255,0,0.14); border: 1px solid rgba(132,204,22,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.62rem; font-weight: 1000; color: #3f6212; letter-spacing: 0.8px; text-transform: uppercase; display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
                            <span style="width: 6px; height: 6px; background: #CCFF00; border-radius: 50%; display: inline-block; animation: neonPulseGreen 1.5s infinite alternate; box-shadow: 0 0 5px #CCFF00;"></span>OFICIAL
                        </div>
                    </div>

                    <!-- Fila de filtros de categoría premium con máscara degradada de desvanecimiento horizontal -->
                    <div style="position: relative; margin-bottom: 16px;">
                        <div class="blog-categories-filter" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; padding-right: 20px; scrollbar-width: none; -ms-overflow-style: none; -webkit-mask-image: linear-gradient(to right, black calc(100% - 36px), transparent 100%); mask-image: linear-gradient(to right, black calc(100% - 36px), transparent 100%);">
                            <button onclick="window.DashboardView.filterBlogCategory('ALL')" class="blog-filter-btn active" style="flex-shrink: 0; background: #CCFF00; border: 1px solid #CCFF00; color: #000; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 900; cursor: pointer; transition: all 0.25s; font-family: 'Outfit'; box-shadow: 0 4px 10px rgba(204,255,0,0.2);">TODAS</button>
                            <button onclick="window.DashboardView.filterBlogCategory('TORNEOS')" class="blog-filter-btn" style="flex-shrink: 0; background: transparent; border: 1px solid rgba(15, 23, 42, 0.09); color: #475569; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 850; cursor: pointer; transition: all 0.25s; font-family: 'Outfit';">🏆 TORNEOS</button>
                            <button onclick="window.DashboardView.filterBlogCategory('CONSEJOS')" class="blog-filter-btn" style="flex-shrink: 0; background: transparent; border: 1px solid rgba(15, 23, 42, 0.09); color: #475569; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 850; cursor: pointer; transition: all 0.25s; font-family: 'Outfit';">💡 CONSEJOS</button>
                            <button onclick="window.DashboardView.filterBlogCategory('RANKING')" class="blog-filter-btn" style="flex-shrink: 0; background: transparent; border: 1px solid rgba(15, 23, 42, 0.09); color: #475569; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 850; cursor: pointer; transition: all 0.25s; font-family: 'Outfit';">📊 RANKING</button>
                            <button onclick="window.DashboardView.filterBlogCategory('CRÓNICAS')" class="blog-filter-btn" style="flex-shrink: 0; background: transparent; border: 1px solid rgba(15, 23, 42, 0.09); color: #475569; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 850; cursor: pointer; transition: all 0.25s; font-family: 'Outfit';">📝 CRÓNICAS</button>
                            <button onclick="window.DashboardView.filterBlogCategory('COMUNIDAD')" class="blog-filter-btn" style="flex-shrink: 0; background: transparent; border: 1px solid rgba(15, 23, 42, 0.09); color: #475569; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 850; cursor: pointer; transition: all 0.25s; font-family: 'Outfit';">👥 COMUNIDAD</button>
                            <button onclick="window.DashboardView.filterBlogCategory('FAVORITOS')" class="blog-filter-btn" style="flex-shrink: 0; background: transparent; border: 1px solid rgba(15, 23, 42, 0.09); color: #475569; padding: 7px 16px; border-radius: 14px; font-size: 0.72rem; font-weight: 850; cursor: pointer; transition: all 0.25s; font-family: 'Outfit';">⭐ GUARDADOS</button>
                        </div>
                    </div>
                    
                    <div id="dynamic-blog-posts-container" style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Cargando posts dinámicos -->
                        <div style="text-align: center; padding: 25px; color: #94a3b8; font-size: 0.75rem; font-family: 'Outfit';">
                            <i class="fas fa-circle-notch fa-spin" style="color: #CCFF00; font-size: 1.2rem; margin-bottom: 6px; display: block;"></i>
                            Cargando las últimas noticias...
                        </div>
                    </div>
                </div>
                
                <style>
                    @keyframes neonPulseGreen {
                        0% { opacity: 0.5; transform: scale(0.9); }
                        100% { opacity: 1; transform: scale(1.1); }
                    }
                    .blog-categories-filter::-webkit-scrollbar {
                        display: none;
                    }
                    .premium-blog-3d-card:hover .featured-blog-bg-image {
                        transform: scale(1.05);
                    }
                    .premium-blog-3d-card:hover .featured-blog-btn {
                        background: #CCFF00 !important;
                        color: #000000 !important;
                        border-color: #CCFF00 !important;
                        box-shadow: 0 6px 16px rgba(204,255,0,0.35);
                    }
                    .premium-blog-3d-card:hover .featured-blog-btn i {
                        transform: translateX(3px);
                    }
                    .premium-blog-compact-card:hover .compact-chevron {
                        transform: translateX(3px);
                        color: #CCFF00 !important;
                    }
                    .premium-blog-compact-card:hover .compact-blog-thumb {
                        transform: scale(1.08);
                    }
                    
                    /* Botones táctiles optimizados para móvil y escritorio */
                    .card-quick-actions {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .card-quick-btn {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(15, 23, 42, 0.04);
                        border: 1px solid rgba(15, 23, 42, 0.09);
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        font-size: 0.88rem;
                        touch-action: manipulation;
                        -webkit-tap-highlight-color: transparent;
                        flex-shrink: 0;
                    }
                    .card-quick-btn:hover, .card-quick-btn:active {
                        transform: scale(1.1);
                        background: #090f1e;
                        color: #CCFF00;
                        border-color: #CCFF00;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
                    }
                    .card-quick-btn.whatsapp-btn {
                        background: rgba(37, 211, 102, 0.1);
                        border-color: rgba(37, 211, 102, 0.25);
                        color: #16a34a;
                    }
                    .card-quick-btn.whatsapp-btn:hover, .card-quick-btn.whatsapp-btn:active {
                        background: #25D366 !important;
                        color: #ffffff !important;
                        border-color: #25D366 !important;
                        box-shadow: 0 3px 10px rgba(37,211,102,0.35);
                    }
                    
                    /* Responsive Móvil Exclusivo */
                    @media (max-width: 600px) {
                        .blog-widget-main-container {
                            padding: 16px 12px !important;
                            border-radius: 22px !important;
                        }
                        .blog-categories-filter {
                            gap: 7px !important;
                            padding-bottom: 4px !important;
                        }
                        .blog-filter-btn {
                            padding: 7px 14px !important;
                            font-size: 0.7rem !important;
                            border-radius: 12px !important;
                        }
                        .premium-blog-compact-card {
                            padding: 12px 10px !important;
                            gap: 12px !important;
                            border-radius: 18px !important;
                        }
                        .compact-blog-thumb-box {
                            width: 82px !important;
                            height: 82px !important;
                            border-radius: 14px !important;
                        }
                        .compact-blog-title {
                            font-size: 0.96rem !important;
                            line-height: 1.28 !important;
                            margin: 2px 0 3px 0 !important;
                        }
                        .compact-blog-snippet {
                            font-size: 0.74rem !important;
                            line-height: 1.35 !important;
                            -webkit-line-clamp: 2 !important;
                        }
                        .compact-blog-cat {
                            font-size: 0.6rem !important;
                            padding: 2px 7px !important;
                        }
                        .compact-blog-time {
                            font-size: 0.64rem !important;
                        }
                        .card-quick-btn {
                            width: 34px !important;
                            height: 34px !important;
                            font-size: 0.82rem !important;
                        }
                    }

                    /* Animación premium de desvanecimiento para las tarjetas del blog */
                    .blog-animate-fade-in {
                        animation: postFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }
                    @keyframes postFadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                </style>
            `;
        }

        filterBlogCategory(category) {
            // Actualizar botones activos
            const filterContainer = document.querySelector('.blog-categories-filter');
            if (filterContainer) {
                const buttons = filterContainer.querySelectorAll('.blog-filter-btn');
                buttons.forEach(btn => {
                    const btnOnclick = btn.getAttribute('onclick') || '';
                    if (btnOnclick.includes(`'${category}'`)) {
                        btn.classList.add('active');
                        btn.style.background = '#CCFF00';
                        btn.style.borderColor = '#CCFF00';
                        btn.style.color = '#000';
                        btn.style.boxShadow = '0 4px 10px rgba(204,255,0,0.2)';
                        btn.style.fontWeight = '900';
                    } else {
                        btn.classList.remove('active');
                        btn.style.background = 'transparent';
                        btn.style.borderColor = 'rgba(15, 23, 42, 0.08)';
                        btn.style.color = '#475569';
                        btn.style.boxShadow = 'none';
                        btn.style.fontWeight = '850';
                    }
                });
            }

            // Renderizar filtrado
            this.renderBlogPostsHTML(this.cachedBlogPosts || [], category);
        }

        renderBlogPostsHTML(posts, categoryFilter) {
            const container = document.getElementById('dynamic-blog-posts-container');
            if (!container) return;

            // Filtrar posts según categoría
            let filtered = posts;
            if (categoryFilter === 'FAVORITOS') {
                const savedIds = this.getSavedBlogPosts();
                filtered = posts.filter(post => savedIds.includes(post.id));
            } else if (categoryFilter !== 'ALL') {
                filtered = posts.filter(post => {
                    const postCat = (post.category || '').toUpperCase();
                    return postCat.includes(categoryFilter) || 
                           postCat.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').includes(categoryFilter);
                });
            }

            if (filtered.length === 0) {
                const emptyMsg = categoryFilter === 'FAVORITOS' 
                    ? `<span style="font-size: 0.76rem; font-weight: 800; display: block; color: #0f172a;">No tienes noticias guardadas</span>
                       <span style="font-size: 0.65rem; color: #64748b; display: block; margin-top: 4px; max-width: 280px; margin-left: auto; margin-right: auto;">Toca el icono de marcador 🔖 en cualquier artículo para tenerlo a mano antes de tus partidos.</span>`
                    : `<span style="font-size: 0.72rem; font-weight: 700; display: block;">No hay noticias en esta categoría</span>
                       <span style="font-size: 0.58rem; color: #cbd5e1; display: block; margin-top: 2px;">¡Pronto publicaremos nuevo contenido táctico!</span>`;

                container.innerHTML = `
                    <div class="blog-animate-fade-in" style="text-align: center; padding: 34px 14px; color: #94a3b8; font-family: 'Outfit';">
                        <i class="${categoryFilter === 'FAVORITOS' ? 'far fa-bookmark' : 'far fa-folder-open'}" style="font-size: 2rem; color: rgba(15, 23, 42, 0.2); margin-bottom: 10px; display: block;"></i>
                        ${emptyMsg}
                    </div>
                `;
                return;
            }

            const visiblePosts = filtered.slice(0, 4);

            // Deduplicación inteligente de imágenes 100% de pádel para evitar fotos no deportivas
            const postImagesMap = (() => {
                const pool = [
                    'img/blog_action_smash.png', 
                    'img/blog_court_night.png', 
                    'img/blog_racket_ball.png', 
                    'img/blog_ball_glass.png', 
                    'img/blog_player_victory.png', 
                    'img/blog_club_lounge.png',
                    'img/pista_padel_azul.png'
                ];
                const assigned = {};
                const used = new Set();
                
                // 1. Asignar imageUrls explícitas sólo si son locales de pádel (evitar Unsplash genérico de ciclismo/gym)
                visiblePosts.forEach(post => {
                    if (post.imageUrl && !post.imageUrl.includes('unsplash.com')) {
                        assigned[post.id] = post.imageUrl;
                        used.add(post.imageUrl);
                    }
                });
                
                // 2. Asignar preferred de pádel según palabras clave del contenido
                visiblePosts.forEach(post => {
                    if (assigned[post.id]) return;
                    const title = (post.title || '').toLowerCase();
                    const content = (post.content || '').toLowerCase();
                    const cat = (post.category || '').toLowerCase();
                    let preferred = null;

                    if (title.includes('match point') || title.includes('victoria') || title.includes('oro') || title.includes('comunicaci')) {
                        preferred = 'img/blog_player_victory.png';
                    } else if (title.includes('remate') || title.includes('víbora') || title.includes('vibora') || title.includes('bandeja') || title.includes('smash') || title.includes('red')) {
                        preferred = 'img/blog_action_smash.png';
                    } else if (title.includes('torneo') || title.includes('americana') || title.includes('evento') || title.includes('ranking') || title.includes('elo')) {
                        preferred = 'img/blog_court_night.png';
                    } else if (title.includes('pala') || title.includes('material') || title.includes('eva') || title.includes('epicondilitis') || title.includes('codo') || title.includes('táctica') || title.includes('tactica')) {
                        preferred = 'img/blog_racket_ball.png';
                    } else if (title.includes('hidrataci') || title.includes('nutrici') || title.includes('cortado') || title.includes('bola') || title.includes('pelota')) {
                        preferred = 'img/blog_ball_glass.png';
                    } else if (title.includes('fair play') || title.includes('comunidad') || title.includes('club') || title.includes('lounge')) {
                        preferred = 'img/blog_club_lounge.png';
                    } else if (title.includes('chiquita') || title.includes('globo') || title.includes('pista')) {
                        preferred = 'img/pista_padel_azul.png';
                    }

                    if (preferred && !used.has(preferred)) {
                        assigned[post.id] = preferred;
                        used.add(preferred);
                    }
                });
                
                // 3. Asignar imágenes libres del pool de pádel
                visiblePosts.forEach((post, idx) => {
                    if (assigned[post.id]) return;
                    const available = pool.find(img => !used.has(img));
                    if (available) {
                        assigned[post.id] = available;
                        used.add(available);
                    } else {
                        assigned[post.id] = pool[idx % pool.length];
                    }
                });
                
                return assigned;
            })();

            // Guardar mapeo de imágenes en la instancia para que openBlogPost pueda leerlo
            this.currentImagesMap = { ...this.currentImagesMap, ...postImagesMap };

            const featured = visiblePosts[0];
            const rest = visiblePosts.slice(1);
            const isFeaturedSaved = this.isPostSaved(featured.id);

            const featuredCard = `
                <div onclick="window.DashboardView.openBlogPost('${featured.id}')"
                     class="premium-blog-3d-card blog-animate-fade-in"
                     style="border-radius: 24px; overflow: hidden; cursor: pointer; position: relative; min-height: 235px; box-shadow: 0 14px 34px rgba(10,25,47,0.08); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(15, 23, 42, 0.08); transform-style: preserve-3d; perspective: 1000px;"
                     onmouseover="this.style.transform='translateY(-4px) scale(1.005)';"
                     onmouseout="this.style.transform='translateY(0) scale(1)';"
                >
                    <!-- Imagen de fondo de pádel con zoom fluido -->
                    <div class="featured-blog-bg-image" style="position: absolute; inset: 0; background-image: url('${postImagesMap[featured.id]}'); background-size: cover; background-position: center; transition: transform 0.6s ease;"></div>
                    
                    <!-- Overlay degradado multicapa oscuro y limpio para máxima legibilidad -->
                    <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(9, 15, 30, 0.2) 0%, rgba(9, 15, 30, 0.6) 45%, rgba(9, 15, 30, 0.96) 100%); z-index: 2;"></div>
                    
                    <!-- Controles rápidos superiores (Compartir WhatsApp & Guardar Favorito) -->
                    <div style="position: absolute; top: 14px; right: 14px; z-index: 4; display: flex; align-items: center; gap: 8px;">
                        <button onclick="window.DashboardView.shareToWhatsApp('${featured.id}', '${featured.title.replace(/'/g, "\\'")}', event)"
                                style="width: 32px; height: 32px; border-radius: 50%; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); color: #25D366; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s;"
                                onmouseover="this.style.background='#25D366';this.style.color='#ffffff';this.style.transform='scale(1.1)';"
                                onmouseout="this.style.background='rgba(15, 23, 42, 0.65)';this.style.color='#25D366';this.style.transform='scale(1)';"
                                title="Enviar a mi pareja por WhatsApp">
                            <i class="fab fa-whatsapp" style="font-size: 0.95rem;"></i>
                        </button>
                        <button onclick="window.DashboardView.toggleSaveBlogPost('${featured.id}', event)"
                                class="journal-bookmark-btn"
                                data-post-id="${featured.id}"
                                style="width: 32px; height: 32px; border-radius: 50%; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid ${isFeaturedSaved ? '#CCFF00' : 'rgba(255,255,255,0.2)'}; color: ${isFeaturedSaved ? '#CCFF00' : '#ffffff'}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s;"
                                onmouseover="this.style.transform='scale(1.1)';this.style.borderColor='#CCFF00';"
                                onmouseout="this.style.transform='scale(1)';"
                                title="${isFeaturedSaved ? 'Eliminar de guardados' : 'Guardar táctica'}">
                            <i class="${isFeaturedSaved ? 'fas' : 'far'} fa-bookmark" style="font-size: 0.85rem;"></i>
                        </button>
                    </div>

                    <!-- Contenido interior -->
                    <div style="position: relative; z-index: 3; padding: 18px 20px; display: flex; flex-direction: column; justify-content: flex-end; min-height: 235px; box-sizing: border-box;">
                        <!-- Badge unificado con glassmorphism -->
                        <div style="margin-bottom: 8px;">
                            <div style="display: inline-flex; align-items: center; gap: 7px; background: rgba(9, 15, 30, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 3px 9px 3px 4px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.18);">
                                <span style="font-size: 0.52rem; font-weight: 1000; color: #000; background: #CCFF00; padding: 3px 8px; border-radius: 12px; letter-spacing: 0.7px; text-transform: uppercase;">${featured.category||'TORNEOS'}</span>
                                <span style="font-size: 0.52rem; font-weight: 900; color: rgba(255,255,255,0.92); letter-spacing: 0.6px; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                                    <span style="width: 4px; height: 4px; background: #CCFF00; border-radius: 50%; display: inline-block; box-shadow: 0 0 6px #CCFF00;"></span>DESTACADO
                                </span>
                            </div>
                        </div>

                        <h3 style="margin: 0 0 6px 0; color: #ffffff; font-weight: 950; font-size: 1.18rem; line-height: 1.25; letter-spacing: -0.3px; font-family: 'Outfit', sans-serif; text-shadow: 0 2px 5px rgba(0,0,0,0.7);">${featured.title}</h3>
                        <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.88); font-size: 0.72rem; font-weight: 500; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Inter', sans-serif;">${featured.snippet}</p>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 0.62rem; color: rgba(255,255,255,0.75); font-weight: 700; display: flex; align-items: center; gap: 4px;"><i class="far fa-calendar" style="font-size: 0.58rem; color: #CCFF00;"></i>${featured.date||'Hoy'}</span>
                                <span style="font-size: 0.62rem; color: rgba(255,255,255,0.75); font-weight: 700; display: flex; align-items: center; gap: 4px;"><i class="far fa-clock" style="font-size: 0.58rem; color: #CCFF00;"></i>${featured.readTime||'3 min'}</span>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 20px; padding: 6px 14px; font-size: 0.6rem; font-weight: 950; color: #ffffff; display: flex; align-items: center; gap: 5px; transition: all 0.25s;"
                                 class="featured-blog-btn">
                                LEER MÁS <i class="fas fa-arrow-right" style="font-size: 0.5rem; transition: transform 0.2s;"></i>
                            </div>
                        </div>
                    </div>
                </div>`;

            const compactCards = rest.map((post, index) => {
                const isSaved = this.isPostSaved(post.id);
                return `
                    <div onclick="window.DashboardView.openBlogPost('${post.id}')"
                         class="premium-blog-compact-card blog-animate-fade-in"
                         style="display: flex; gap: 14px; align-items: center; padding: 12px 14px; border-radius: 18px; cursor: pointer; background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.07); transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; box-shadow: 0 4px 14px rgba(10,25,47,0.02); animation-delay: ${(index + 1) * 0.04}s;"
                         onmouseover="this.style.background='#f8fafc';this.style.borderColor='rgba(15,23,42,0.12)';this.style.transform='translateX(4px)';"
                         onmouseout="this.style.background='#ffffff';this.style.borderColor='rgba(15,23,42,0.07)';this.style.transform='translateX(0)';"
                    >
                        <!-- Miniatura Realista de Pádel -->
                        <div style="width: 76px; height: 76px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid rgba(15,23,42,0.06);">
                            <div class="compact-blog-thumb" style="width: 100%; height: 100%; background-image: url('${postImagesMap[post.id]}'); background-size: cover; background-position: center; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                        </div>
                        
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 0.52rem; font-weight: 1000; letter-spacing: 0.8px; color: #4d7c0f; text-transform: uppercase; background: rgba(204,255,0,0.14); border: 1px solid rgba(204,255,0,0.28); padding: 2px 7px; border-radius: 6px;">${(post.category||'NOTICIAS').replace(/^[^\s]+\s/,'')}</span>
                                <span style="font-size: 0.56rem; color: #64748b; font-weight: 800; display: flex; align-items: center; gap: 3px;"><i class="far fa-clock" style="font-size: 0.48rem; color: #4d7c0f;"></i>${post.readTime||'3 min'}</span>
                            </div>
                            <h4 style="margin: 0 0 3px 0; color: #0f172a; font-weight: 900; font-size: 0.88rem; line-height: 1.25; letter-spacing: -0.2px; font-family: 'Outfit', sans-serif;">${post.title}</h4>
                            <p style="margin: 0; color: #475569; font-size: 0.68rem; font-weight: 550; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Inter', sans-serif;">${post.snippet}</p>
                        </div>
                        
                        <!-- Acciones Rápidas (WhatsApp + Favorito) y Flecha -->
                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            <button onclick="window.DashboardView.shareToWhatsApp('${post.id}', '${post.title.replace(/'/g, "\\'")}', event)"
                                    class="card-quick-btn whatsapp-btn"
                                    title="Compartir por WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button onclick="window.DashboardView.toggleSaveBlogPost('${post.id}', event)"
                                    class="card-quick-btn journal-bookmark-btn"
                                    data-post-id="${post.id}"
                                    style="${isSaved ? 'color:#4d7c0f; border-color:#84cc16; background:rgba(204,255,0,0.15);' : ''}"
                                    title="${isSaved ? 'Eliminar de guardados' : 'Guardar táctica'}">
                                <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i>
                            </button>
                            <div style="color: #94a3b8; font-size: 0.7rem; transition: transform 0.2s; margin-left: 2px;" class="compact-chevron">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const historyButtonHtml = `
                <div style="margin-top: 15px; text-align: center;" class="blog-animate-fade-in" style="animation-delay: 0.16s;">
                    <button onclick="window.DashboardView.openBlogHistory()"
                            id="blog-history-open-btn"
                            style="background: rgba(15, 23, 42, 0.03); border: 1px solid rgba(15, 23, 42, 0.08); color: #475569; padding: 8px 18px; border-radius: 14px; font-size: 0.65rem; font-weight: 850; cursor: pointer; transition: all 0.25s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Outfit', sans-serif;"
                            onmouseover="this.style.background='rgba(15, 23, 42, 0.06)';this.style.color='#0f172a';this.style.borderColor='rgba(15, 23, 42, 0.15)';this.style.transform='scale(1.02)';"
                            onmouseout="this.style.background='rgba(15, 23, 42, 0.03)';this.style.color='#475569';this.style.borderColor='rgba(15, 23, 42, 0.08)';this.style.transform='scale(1)';"
                    >
                        <i class="fas fa-history" style="font-size: 0.6rem; color: #4d7c0f;"></i> VER MÁS NOTICIAS (HISTÓRICO)
                    </button>
                </div>
            `;

            container.innerHTML = featuredCard + `<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">${compactCards}</div>` + historyButtonHtml;
        }

        async openBlogHistory() {
            try {
                const btn = document.getElementById('blog-history-open-btn');
                if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size: 0.6rem;"></i> CARGANDO HISTÓRICO...`;

                const db = window.db || firebase.firestore();
                let posts = [];
                try {
                    const snapshot = await db.collection('blog_posts').orderBy('timestamp', 'desc').get();
                    if (!snapshot.empty) {
                        posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    }
                } catch (dbErr) {
                    console.warn("Fallo al leer histórico de Firestore, usando fallbacks:", dbErr);
                }

                if (posts.length === 0) {
                    posts = window.SomosPadelNewsEngine ? window.SomosPadelNewsEngine.getDeterministicFallbackPosts() : [];
                }

                if (btn) btn.innerHTML = `<i class="fas fa-history" style="font-size: 0.6rem; color: #4d7c0f;"></i> VER MÁS NOTICIAS (HISTÓRICO)`;

                const historyModal = document.createElement('div');
                historyModal.id = 'blog-history-modal';
                historyModal.style = `
                    position: fixed; inset: 0; z-index: 99999999 !important;
                    background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 16px; font-family: 'Outfit', sans-serif;
                    box-sizing: border-box;
                    animation: fadeIn 0.25s ease-out;
                `;

                const renderListItems = (filterText = '') => {
                    const filtered = posts.filter(p => {
                        const term = filterText.toLowerCase();
                        return (p.title || '').toLowerCase().includes(term) ||
                               (p.snippet || '').toLowerCase().includes(term) ||
                               (p.category || '').toLowerCase().includes(term);
                    });

                    if (filtered.length === 0) {
                        return `<div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                                    <span style="font-size: 2rem; display: block; margin-bottom: 10px;">🔍</span>
                                    <span style="font-weight: 700; font-size: 0.85rem;">No se encontraron noticias que coincidan.</span>
                                </div>`;
                    }

                    const pool = [
                        'img/blog_action_smash.png', 
                        'img/blog_court_night.png', 
                        'img/blog_racket_ball.png', 
                        'img/blog_ball_glass.png', 
                        'img/blog_player_victory.png', 
                        'img/blog_club_lounge.png'
                    ];

                    return filtered.map((post, idx) => {
                        const img = (post.imageUrl && !post.imageUrl.includes('unsplash.com')) ? post.imageUrl : pool[idx % pool.length];
                        const catClean = (post.category || 'REVISTA').replace(/^[^\s]+\s/, '');
                        return `
                            <div onclick="document.getElementById('blog-history-modal').remove(); window.DashboardView.openBlogPost('${post.id}')"
                                 class="history-news-row-card"
                                 style="display: flex; gap: 14px; align-items: center; padding: 12px; border-radius: 16px; cursor: pointer; background: #ffffff; border: 1px solid rgba(15,23,42,0.06); transition: all 0.2s ease; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.01);"
                                 onmouseover="this.style.background='#f8fafc';this.style.borderColor='rgba(15,23,42,0.12)';this.style.transform='translateX(3px)';"
                                 onmouseout="this.style.background='#ffffff';this.style.borderColor='rgba(15,23,42,0.06)';this.style.transform='translateX(0)';"
                            >
                                <div style="width: 60px; height: 60px; border-radius: 10px; background-image: url('${img}'); background-size: cover; background-position: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.05);"></div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                                        <span style="font-size: 0.5rem; font-weight: 950; letter-spacing: 0.5px; color: #4d7c0f; text-transform: uppercase; background: rgba(204,255,0,0.15); border: 1px solid rgba(204,255,0,0.3); padding: 1.5px 6px; border-radius: 4px;">${catClean}</span>
                                        <span style="font-size: 0.55rem; color: #64748b; font-weight: 700; display: flex; align-items: center; gap: 3px;"><i class="far fa-clock" style="font-size: 0.45rem;"></i>${post.readTime || '3 min'}</span>
                                    </div>
                                    <h4 style="margin: 0 0 2px 0; color: #0f172a; font-weight: 850; font-size: 0.82rem; line-height: 1.25; letter-spacing: -0.2px; font-family: 'Outfit'; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${post.title}</h4>
                                    <p style="margin: 0; color: #64748b; font-size: 0.65rem; font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${post.snippet}</p>
                                </div>
                                <div style="flex-shrink: 0; color: #cbd5e1; font-size: 0.65rem;"><i class="fas fa-chevron-right"></i></div>
                            </div>
                        `;
                    }).join('');
                };

                historyModal.innerHTML = `
                    <div style="background: #090f1e; border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; width: 100%; max-width: 480px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 30px 70px rgba(0,0,0,0.85); position: relative; animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden; box-sizing: border-box;">
                        <div style="padding: 20px 24px 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); position: relative; display: flex; flex-direction: column; gap: 8px;">
                            <button id="history-modal-close-btn" 
                                    style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s;"
                                    onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                                    onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                                <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                            </button>
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-newspaper" style="font-size: 1.1rem; color: #CCFF00;"></i>
                                <h4 style="color: white; font-weight: 950; font-size: 1.15rem; margin: 0; letter-spacing: -0.4px;">Archivo de Noticias</h4>
                            </div>
                            <p style="color: rgba(255,255,255,0.5); font-size: 0.7rem; line-height: 1.3; margin: 0;">Consulta y busca todos los artículos, consejos de juego y guías oficiales de SomosPadel BCN.</p>
                        </div>
                        
                        <div style="padding: 12px 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-search" style="color: rgba(255,255,255,0.4); font-size: 0.8rem;"></i>
                            <input id="news-search-input" 
                                   type="text" 
                                   placeholder="Buscar por título, categoría o palabra clave..." 
                                   style="background: transparent; border: none; outline: none; color: white; font-size: 0.78rem; font-weight: 600; width: 100%; font-family: 'Inter';"
                            />
                        </div>
                        
                        <div id="history-items-container" 
                             style="padding: 20px; overflow-y: auto; flex: 1; background: #f1f5f9; min-height: 180px;">
                            ${renderListItems()}
                        </div>
                        
                        <div style="padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.08); background: #090f1e; text-align: center;">
                            <span style="font-size: 0.58rem; color: rgba(255,255,255,0.4); font-weight: 700; letter-spacing: 0.8px;">SOMOSPADEL BCN JOURNAL OFICIAL</span>
                        </div>
                    </div>
                `;

                document.body.appendChild(historyModal);

                const searchInput = historyModal.querySelector('#news-search-input');
                const itemsContainer = historyModal.querySelector('#history-items-container');
                if (searchInput && itemsContainer) {
                    searchInput.addEventListener('input', (e) => {
                        itemsContainer.innerHTML = renderListItems(e.target.value);
                    });
                }

                const closeBtn = historyModal.querySelector('#history-modal-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        historyModal.remove();
                    });
                }

                historyModal.onclick = (e) => {
                    if (e.target === historyModal) historyModal.remove();
                };

            } catch (err) {
                console.error("Fallo al abrir histórico de noticias:", err);
            }
        }

        openTacticalWarRoom() {
            try {
                // Si ya existe el modal, lo eliminamos primero
                const existingModal = document.getElementById('tactical-war-room-modal');
                if (existingModal) existingModal.remove();

                const modal = document.createElement('div');
                modal.id = 'tactical-war-room-modal';
                modal.style = `
                    position: fixed; inset: 0; z-index: 999999999 !important;
                    background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px; font-family: 'Outfit', sans-serif;
                    animation: fadeIn 0.25s ease-out;
                    box-sizing: border-box;
                `;

                modal.innerHTML = `
                    <div style="
                        background: #090f1e; 
                        border: 1px solid rgba(255, 255, 255, 0.12); 
                        border-radius: 28px; 
                        width: 100%; 
                        max-width: 900px; 
                        height: 90vh; 
                        max-height: 700px;
                        display: flex; 
                        flex-direction: column; 
                        box-shadow: 0 30px 70px rgba(0,0,0,0.85); 
                        position: relative; 
                        animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
                        overflow: hidden; 
                        box-sizing: border-box;
                    ">
                        
                        <!-- Cabecera -->
                        <div style="padding: 18px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); position: relative; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: rgba(15, 23, 42, 0.4);">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-cubes" style="font-size: 1.25rem; color: #CCFF00; filter: drop-shadow(0 0 8px rgba(204,255,0,0.4));"></i>
                                <div>
                                    <h4 style="color: white; font-weight: 950; font-size: 1.1rem; margin: 0; letter-spacing: -0.3px; text-transform: uppercase;">War Room 3D Táctico</h4>
                                    <p style="color: rgba(255,255,255,0.4); font-size: 0.62rem; margin: 2px 0 0 0; font-weight: 600;">SIMULADOR ESTRATÉGICO DE POSICIONAMIENTO EN PISTA</p>
                                </div>
                            </div>
                            
                            <button id="warroom-modal-close-btn" 
                                    style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s;"
                                    onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                                    onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                                <i class="fas fa-times" style="font-size: 0.85rem;"></i>
                            </button>
                        </div>
                        
                        <!-- Panel Principal -->
                        <div style="display: flex; flex: 1; min-height: 0; flex-direction: row; box-sizing: border-box;" class="warroom-body-responsive">
                            
                            <!-- Izquierda: Canvas del simulador -->
                            <div style="flex: 1.4; position: relative; background: #070b16; min-height: 250px; display: flex; flex-direction: column;">
                                <div id="three-warroom-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%;"></div>
                                
                                <!-- Indicador de la cámara actual -->
                                <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); pointer-events: none; display: flex; align-items: center; gap: 6px;">
                                    <span style="width: 6px; height: 6px; background: #CCFF00; border-radius: 50%; box-shadow: 0 0 6px #CCFF00;"></span>
                                    <span id="tactical-camera-info" style="font-size: 0.55rem; font-weight: 900; color: white; letter-spacing: 0.8px; text-transform: uppercase;">VISTA 3D ORBITAL</span>
                                </div>

                                <!-- HUD de ayuda táctil -->
                                <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); padding: 6px 10px; border-radius: 8px; pointer-events: none; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                    <span style="font-size: 0.58rem; color: rgba(255,255,255,0.7); font-weight: 600;">
                                        <i class="fas fa-info-circle" style="color: #CCFF00; margin-right: 4px;"></i> Arrastra los jugadores. Desliza sobre el fondo para orbitar la cámara.
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Derecha: Controles y consejos tácticos -->
                            <div style="flex: 1; border-left: 1px solid rgba(255,255,255,0.08); background: #0b1122; display: flex; flex-direction: column; box-sizing: border-box; overflow-y: auto;">
                                
                                <!-- Tarjeta de Controles -->
                                <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size: 0.62rem; font-weight: 950; color: #CCFF00; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">CÁMARA Y CONTROLES</div>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                                        <button id="btn-camera-3d" style="background: rgba(204, 255, 0, 0.1); border: 1px solid rgba(204, 255, 0, 0.3); color: #CCFF00; font-weight: 850; font-size: 0.7rem; padding: 10px; border-radius: 12px; cursor: pointer; font-family: 'Outfit'; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;">
                                            <i class="fas fa-globe"></i> VISTA 3D
                                        </button>
                                        <button id="btn-camera-2d" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); font-weight: 850; font-size: 0.7rem; padding: 10px; border-radius: 12px; cursor: pointer; font-family: 'Outfit'; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;">
                                            <i class="fas fa-layer-group"></i> PIZARRA 2D
                                        </button>
                                    </div>
                                    
                                    <button id="btn-reset-tactics" style="width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; font-weight: 800; font-size: 0.72rem; padding: 10px; border-radius: 12px; cursor: pointer; font-family: 'Outfit'; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                        <i class="fas fa-redo"></i> REINICIAR POSICIONES
                                    </button>
                                </div>
                                
                                <!-- Tarjeta de Consejos -->
                                <div style="padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 12px;">
                                    <div style="font-size: 0.62rem; font-weight: 950; color: #CCFF00; letter-spacing: 1.5px; text-transform: uppercase;">CONSEJERO TÁCTICO</div>
                                    
                                    <!-- Contenedor dinámico de consejos -->
                                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 15px; display: flex; flex-direction: column; gap: 8px; flex: 1;">
                                        <div id="war-room-coach-title" style="color: white; font-weight: 900; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                                            Cargando análisis...
                                        </div>
                                        <div id="war-room-coach-text" style="color: rgba(255, 255, 255, 0.6); font-size: 0.68rem; line-height: 1.45; font-weight: 600;">
                                            Mueve a los jugadores en la pista para iniciar el análisis estratégico de huecos y posicionamiento en tiempo real.
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Leyenda de colores -->
                                <div style="padding: 15px 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.62rem; color: rgba(255,255,255,0.7); font-weight: 600;">
                                        <span style="width: 8px; height: 8px; background: #CCFF00; border-radius: 50%;"></span>
                                        <span>Fichas Amarillas: Tu Pareja</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.62rem; color: rgba(255,255,255,0.7); font-weight: 600;">
                                        <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span>
                                        <span>Fichas Rojas: Rival 1 & 2</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.62rem; color: rgba(255,255,255,0.7); font-weight: 600;">
                                        <span style="width: 8px; height: 8px; background: rgba(234, 179, 8, 0.4); border: 1px solid #eab308; border-radius: 50%;"></span>
                                        <span>Círculo Amarillo: Tu Brecha Defensiva</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.62rem; color: rgba(255,255,255,0.7); font-weight: 600;">
                                        <span style="width: 8px; height: 8px; background: rgba(239, 68, 68, 0.4); border: 1px solid #ef4444; border-radius: 50%;"></span>
                                        <span>Círculo Rojo: Zona Recomendada de Ataque</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CSS Responsivo local -->
                    <style>
                        @media (max-width: 768px) {
                            .warroom-body-responsive {
                                flex-direction: column !important;
                            }
                            #three-warroom-canvas {
                                height: 300px !important;
                            }
                            .warroom-body-responsive > div:last-child {
                                border-left: none !important;
                                border-top: 1px solid rgba(255,255,255,0.08) !important;
                            }
                        }
                    </style>
                `;

                document.body.appendChild(modal);

                // Inicializar la pizarra interactiva 3D con carga diferida y segura de Three.js
                if (window.TacticalCourt3D) {
                    const startSimulator = () => {
                        setTimeout(() => {
                            if (document.getElementById('three-warroom-canvas') && window.TacticalCourt3D) {
                                window.TacticalCourt3D.init('three-warroom-canvas');
                            }
                        }, 50);
                    };

                    if (!window.THREE) {
                        console.log("🌐 [WarRoom] Cargando Three.js dinámicamente...");
                        window.loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE')
                            .then(() => {
                                console.log("✅ [WarRoom] Three.js cargado dinámicamente con éxito para el simulador.");
                                startSimulator();
                            })
                            .catch(err => console.error("❌ [WarRoom] Error al cargar Three.js para TacticalCourt3D:", err));
                    } else {
                        startSimulator();
                    }
                }

                // Configurar cierre y limpieza de memoria WebGL
                const closeModal = () => {
                    if (window.TacticalCourt3D && typeof window.TacticalCourt3D.destroy === 'function') {
                        window.TacticalCourt3D.destroy();
                    }
                    modal.remove();
                };

                const closeBtn = modal.querySelector('#warroom-modal-close-btn');
                if (closeBtn) {
                    closeBtn.onclick = closeModal;
                }
                modal.onclick = (e) => {
                    if (e.target === modal) closeModal();
                };

                // Eventos de cámara
                const btn3d = modal.querySelector('#btn-camera-3d');
                const btn2d = modal.querySelector('#btn-camera-2d');
                const btnReset = modal.querySelector('#btn-reset-tactics');

                if (btn3d && btn2d) {
                    btn3d.onclick = () => {
                        window.TacticalCourt3D.changeCamera('3d');
                        btn3d.style.background = 'rgba(204, 255, 0, 0.1)';
                        btn3d.style.borderColor = 'rgba(204, 255, 0, 0.3)';
                        btn3d.style.color = '#CCFF00';
                        btn2d.style.background = 'rgba(255, 255, 255, 0.03)';
                        btn2d.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        btn2d.style.color = 'rgba(255, 255, 255, 0.6)';
                    };

                    btn2d.onclick = () => {
                        window.TacticalCourt3D.changeCamera('2d');
                        btn2d.style.background = 'rgba(204, 255, 0, 0.1)';
                        btn2d.style.borderColor = 'rgba(204, 255, 0, 0.3)';
                        btn2d.style.color = '#CCFF00';
                        btn3d.style.background = 'rgba(255, 255, 255, 0.03)';
                        btn3d.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        btn3d.style.color = 'rgba(255, 255, 255, 0.6)';
                    };
                }

                if (btnReset) {
                    btnReset.onclick = () => {
                        window.TacticalCourt3D.resetPlayers();
                    };
                }

            } catch (err) {
                console.error("Fallo al abrir War Room Táctico:", err);
            }
        }

        async openBlogPost(postId) {
            try {
                const db = window.db || firebase.firestore();
                let post = null;
                let viewsCount = 1;
                let lastReaderName = 'Ninguno';

                // Get Current User
                const user = window.Store ? window.Store.getState('currentUser') : null;
                const currentUserName = user ? (user.name || user.displayName || 'Jugador Pro') : 'Invitado Pro';

                try {
                    const doc = await db.collection('blog_posts').doc(postId).get();
                    if (doc.exists) {
                        post = doc.data();
                        
                        // Increment views & set reader real-time in Firestore
                        viewsCount = (post.viewsCount || 0) + 1;
                        lastReaderName = currentUserName;

                        // Non-blocking update to keep speed ultra-fast
                        db.collection('blog_posts').doc(postId).update({
                            viewsCount: viewsCount,
                            lastReaderName: lastReaderName,
                            lastReaderTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                        }).catch(e => console.warn("Fallo al actualizar Firestore views:", e));
                    }
                } catch (e) {
                    console.warn("Fallo al conectar con Firestore para blog stats:", e);
                }

                // Fallback local if Firestore failed or is offline or post is local
                if (!post) {
                    const fallbackPosts = {
                        'torneo-primavera': {
                            category: '🏆 TORNEOS',
                            catColor: '#CCFF00',
                            title: 'Gran Torneo de Primavera 2026',
                            content: 'Llega el evento más esperado del año. El próximo 15 de Junio celebraremos el Gran Torneo de Primavera en las instalaciones de El Prat. Contaremos con categorías masculina, femenina y mixta de todos los niveles. Con tu inscripción recibirás un Welcome Pack (camiseta oficial, grip y bebida energética). Al finalizar, disfrutaremos de una barbacoa comunitaria con sorteos y música. ¡Inscripciones limitadas a 120 plazas, reserva la tuya en la sección de eventos!',
                            date: 'Hoy',
                            readTime: '2 min',
                            emoji: '🎾',
                            imgGrad: 'linear-gradient(135deg, #CCFF00 0%, #84cc16 100%)'
                        },
                        'ranking-actualizado': {
                            category: '📊 RANKING',
                            catColor: '#38bdf8',
                            title: 'Ranking Actualizado: Top 5 de la Temporada',
                            content: 'El ranking de la temporada se ha recalculado tras la última jornada de liga. Los nuevos puntos ya están asignados y podrás consultar tu posición actualizada en la sección Ranking. ¡Enhorabuena a los que han subido posiciones esta semana y ánimo a los que luchan por el ascenso!',
                            date: 'Ayer',
                            readTime: '2 min',
                            emoji: '🏅',
                            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'
                        },
                        'tactica-centro': {
                            category: '💡 CONSEJOS',
                            catColor: '#f59e0b',
                            title: 'Táctica: Jugar al Centro de la Pista',
                            content: 'Jugar por el centro de la pista es una de las tácticas más eficaces en el pádel. Al dirigir la bola al centro, reduces drásticamente los ángulos de rebote del rival, evitas que abran la bola a las paredes y generas dudas de comunicación entre la pareja contraria. Es ideal para situaciones bajo presión o globos difíciles. ¡Probadlo en vuestro próximo partido!',
                            date: 'Hace 3 días',
                            readTime: '3 min',
                            emoji: '⚡',
                            imgGrad: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
                        }
                    };
                    post = fallbackPosts[postId];
                }

                if (!post) return;

                // Resolver la mejor imagen de fondo para la cabecera (Unsplash dinámico o pool local)
                let articleImg = post.imageUrl;
                if (!articleImg && this.currentImagesMap && this.currentImagesMap[postId]) {
                    articleImg = this.currentImagesMap[postId];
                }
                if (!articleImg) {
                    const title = (post.title || '').toLowerCase();
                    const category = (post.category || '').toLowerCase();
                    if (title.includes('torneo') || title.includes('americana') || category.includes('torneo')) {
                        articleImg = 'img/blog_action_smash.png';
                    } else if (title.includes('ranking') || category.includes('ranking')) {
                        articleImg = 'img/blog_court_night.png';
                    } else if (title.includes('consejo') || title.includes('táctica') || category.includes('consejo')) {
                        articleImg = 'img/blog_racket_ball.png';
                    } else {
                        articleImg = 'img/blog_ball_glass.png';
                    }
                }

                const modal = document.createElement('div');
                modal.id = 'blog-post-modal';
                modal.style = `
                    position: fixed; inset: 0; z-index: 999999999 !important;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(15px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px; font-family: 'Outfit', sans-serif;
                    animation: fadeIn 0.3s ease-out;
                `;
                
                modal.innerHTML = `
                    <div style="background: #090f1e; border: 1px solid rgba(255,255,255,0.12); border-radius: 32px; width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 35px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); position: relative; overflow: hidden; animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
                        
                        <!-- Premium Background Glow/Aura -->
                        <div style="position: absolute; top: 100px; left: -50px; width: 150px; height: 150px; background: radial-gradient(circle, ${post.catColor || '#CCFF00'}15 0%, transparent 70%); pointer-events: none; filter: blur(30px);"></div>
                        
                        <!-- Premium Image Header Area (Magazine style) -->
                        <div style="background-image: url('${articleImg}'); background-size: cover; background-position: center; height: 200px; position: relative; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;">
                            <!-- Overlay degradado para fundido limpio a negro (#090f1e) en la base y oscurecimiento para botones -->
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(9, 15, 30, 0.2) 0%, rgba(9, 15, 30, 0.6) 60%, #090f1e 100%); pointer-events: none;"></div>
                            
                            <!-- Glassmorphism Floating Emoji Badge -->
                            <div class="blog-modal-emoji-badge" style="position: absolute; bottom: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: rgba(15, 23, 42, 0.6); border: 1.5px solid rgba(255, 255, 255, 0.25); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); z-index: 2; animation: badgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both 0.15s;">
                                ${post.emoji || '📰'}
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div id="blog-post-content-area" style="padding: 24px; padding-top: 16px; position: relative; z-index: 2; overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                                <span style="font-size: 0.58rem; font-weight: 1000; color: ${post.catColor || '#CCFF00'}; border: 1px solid ${post.catColor || '#CCFF00'}45; padding: 4px 10px; border-radius: 8px; background: ${post.catColor || '#CCFF00'}12; letter-spacing: 0.8px; text-transform: uppercase;">${post.category || 'REVISTA'}</span>
                                <span style="font-size: 0.62rem; color: rgba(255,255,255,0.45); font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase;">• ${post.readTime || '3 MIN'} DE LECTURA</span>
                            </div>
                            
                            <h3 style="color: white; font-weight: 950; font-size: 1.35rem; margin: 0 0 16px 0; line-height: 1.25; letter-spacing: -0.4px; text-shadow: 0 2px 10px rgba(0,0,0,0.4);">${post.title}</h3>
                            
                            <p style="color: rgba(255,255,255,0.85); font-size: 0.86rem; font-weight: 500; line-height: 1.65; margin: 0 0 20px 0; word-break: break-word; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${post.content}</p>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.68rem; color: rgba(255,255,255,0.4); font-weight: 800; letter-spacing: 0.5px;">
                                <span>Publicado: ${post.date || 'Recientemente'}</span>
                                <span style="color: #CCFF00; font-weight: 900; letter-spacing: 0.8px;">SOMOSPADEL BCN</span>
                            </div>
                        </div>

                        <!-- Floating Premium Control Buttons (Fixed on top of banner) -->
                        <div style="position: absolute; top: 16px; left: 16px; z-index: 999999999 !important; display: flex; align-items: center; gap: 8px;">
                            <button id="blog-modal-share-btn"
                                    style="background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                                    onmouseover="this.style.background='#3b82f6';this.style.borderColor='#3b82f6';this.style.transform='scale(1.12) translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(59,130,246,0.5)';"
                                    onmouseout="this.style.background='rgba(0,0,0,0.65)';this.style.borderColor='rgba(255,255,255,0.25)';this.style.transform='scale(1) translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)';"
                                    title="Compartir Noticia">
                                <i class="fas fa-share-alt" style="font-size: 0.92rem;"></i>
                            </button>

                            <button id="blog-modal-whatsapp-btn"
                                    style="background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); color: #25D366; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                                    onmouseover="this.style.background='#25D366';this.style.borderColor='#25D366';this.style.color='#ffffff';this.style.transform='scale(1.12) translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(37,211,102,0.5)';"
                                    onmouseout="this.style.background='rgba(0,0,0,0.65)';this.style.borderColor='rgba(255,255,255,0.25)';this.style.color='#25D366';this.style.transform='scale(1) translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)';"
                                    title="Enviar a mi pareja por WhatsApp">
                                <i class="fab fa-whatsapp" style="font-size: 1.05rem;"></i>
                            </button>

                            <button id="blog-modal-save-btn"
                                    style="background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid ${this.isPostSaved(postId) ? '#CCFF00' : 'rgba(255,255,255,0.25)'}; color: ${this.isPostSaved(postId) ? '#CCFF00' : '#ffffff'}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                                    onmouseover="this.style.transform='scale(1.12) translateY(-1px)';"
                                    onmouseout="this.style.transform='scale(1) translateY(0)';"
                                    title="${this.isPostSaved(postId) ? 'Eliminar de guardados' : 'Guardar táctica'}">
                                <i class="${this.isPostSaved(postId) ? 'fas' : 'far'} fa-bookmark" style="font-size: 0.95rem;"></i>
                            </button>
                        </div>
                        
                        <button id="blog-modal-close-btn"
                                style="position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 999999999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                                onmouseover="this.style.background='#CCFF00';this.style.borderColor='#CCFF00';this.style.color='#000';this.style.transform='scale(1.12) translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(204,255,0,0.5)';"
                                onmouseout="this.style.background='rgba(0,0,0,0.65)';this.style.borderColor='rgba(255,255,255,0.25)';this.style.color='#fff';this.style.transform='scale(1) translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)';"
                                title="Cerrar Noticia">
                            <i class="fas fa-times" style="font-size: 0.95rem;"></i>
                        </button>
                    </div>
                    <style>
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes slideUp { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                        @keyframes badgePop {
                            from { transform: scale(0) rotate(-15deg); opacity: 0; }
                            to { transform: scale(1) rotate(0deg); opacity: 1; }
                        }
                        #blog-post-content-area::-webkit-scrollbar { width: 6px; }
                        #blog-post-content-area::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                        #blog-post-content-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
                        #blog-post-content-area::-webkit-scrollbar-thumb:hover { background: #CCFF00; }
                    </style>
                `;
                document.body.appendChild(modal);

                // Asignamos manejadores de eventos directos sin inline onclicks propensos a fallos
                const closeBtn = modal.querySelector('#blog-modal-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        modal.remove();
                    });
                }

                const shareBtn = modal.querySelector('#blog-modal-share-btn');
                if (shareBtn) {
                    shareBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.shareBlogPost(postId, post.title);
                    });
                }

                const waBtn = modal.querySelector('#blog-modal-whatsapp-btn');
                if (waBtn) {
                    waBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.shareToWhatsApp(postId, post.title, e);
                    });
                }

                const saveBtn = modal.querySelector('#blog-modal-save-btn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleSaveBlogPost(postId, e);
                        const isNowSaved = this.isPostSaved(postId);
                        saveBtn.style.color = isNowSaved ? '#CCFF00' : '#ffffff';
                        saveBtn.style.borderColor = isNowSaved ? '#CCFF00' : 'rgba(255,255,255,0.25)';
                        const icon = saveBtn.querySelector('i');
                        if (icon) icon.className = isNowSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
                    });
                }

                // Cerrar modal al hacer click fuera de la tarjeta de contenido para UX impecable
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                };
            } catch (err) {
                console.error("Error al abrir blog post:", err);
            }
        }

        renderWeatherCard(city, temp, icon, details = {}, isPropitious = true) {
            const safeCityId = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
            const intel = details.intel || { score: 100, ballSpeed: '--', recommendation: 'Sincronizando meteorología...', gripStatus: '--' };
            const statusLabel = isPropitious ? 'ÓPTIMO' : 'ADVERSO';
            const statusColor = isPropitious ? '#00E36D' : '#FF2D55';
            const rainProb = parseInt(details.rain) || 0;
            const isRaining = rainProb > 30;

            let cardBg = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
            let weatherOverlay = '';

            if (isRaining) {
                cardBg = 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)';
                weatherOverlay = `
                <div style="position: absolute; inset: 0; pointer-events: none; opacity: 0.4;">
                    <div style="
                            position: absolute; inset: -100% 0 0 0;
                            background-image: linear-gradient(to bottom, rgba(59,130,246,0) 0%, rgba(59,130,246,0.4) 50%, rgba(59,130,246,0) 100%);
                            background-size: 2px 50px;
                            animation: rainFall 0.6s linear infinite;
                        "></div>
                    </div>
                `;
            } else if (isPropitious) {
                cardBg = 'linear-gradient(135deg, #3f6212 0%, #022c22 100%)';
                weatherOverlay = `<div style="position: absolute; top: -60px; right: -60px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(253, 224, 71, 0.15) 0%, transparent 70%); filter: blur(20px); animation: sunPulse 6s ease-in-out infinite; pointer-events: none;"></div>`;
            } else {
                cardBg = 'linear-gradient(135deg, #334155 0%, #0f172a 100%)';
            }

            return `
                <style>
                    @keyframes rainFall { 0% { transform: translateY(0); } 100% { transform: translateY(100%); } }
                    @keyframes sunPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
                    @keyframes textSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                </style>
                <div style="
                    background: ${cardBg}; background-size: 200% 200%; animation: cardShine 10s ease infinite;
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 24px 20px;
                    display: flex; flex-direction: column; gap: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    position: relative; overflow: hidden; min-height: auto;
                ">
                    ${weatherOverlay}
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
                        <div style="font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3)); animation: weatherFloat 5s ease-in-out infinite;">${icon}</div>
                        <div style="text-align: right;">
                            <div style="background: rgba(0,0,0,0.3); color: ${statusColor}; padding: 6px 14px; border-radius: 12px; font-size: 0.65rem; font-weight: 950; border: 1px solid ${statusColor}40; margin-bottom: 6px; box-shadow: 0 0 15px ${statusColor}20; backdrop-filter: blur(4px);">${statusLabel}</div>
                            <div style="font-size: 0.6rem; color: white; opacity: 0.6; font-weight: 800; letter-spacing: 1px;">SCORE ${intel.score}%</div>
                        </div>
                    </div>
                    <div style="position: relative; z-index: 2; margin-top: 10px; animation: textSlideIn 0.5s ease-out; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <div style="color: white; font-weight: 950; font-size: 2.8rem; line-height: 0.9; letter-spacing: -2px; text-shadow: 0 5px 10px rgba(0,0,0,0.5);">${temp}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">${city}</div>
                        </div>
                        <button onclick="event.stopPropagation(); window.DashboardView.toggleWeatherDetails('${safeCityId}')" 
                                id="weather-btn-${safeCityId}" 
                                style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 12px; padding: 6px 12px; font-size: 0.65rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; backdrop-filter: blur(4px);">
                            Ver más <i class="fas fa-chevron-down" id="weather-icon-${safeCityId}"></i>
                        </button>
                    </div>
                    <div id="weather-details-${safeCityId}" style="display: none; flex-direction: column; gap: 10px; margin-top: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 15px; border: 1px solid rgba(255,255,255,0.05); position: relative; z-index: 2; backdrop-filter: blur(5px); animation: textSlideIn 0.7s ease-out;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-bolt" style="color:#fbbf24;"></i> VELOCIDAD BOLA</span>
                            <span style="font-size: 0.7rem; color: #fbbf24; font-weight: 950; text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);">${intel.ballSpeed}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-wind" style="color:#0ea5e9;"></i> VIENTO</span>
                            <span style="font-size: 0.7rem; color: white; font-weight: 900;">${details.wind || '--'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-tint" style="color:#38bdf8;"></i> HUMEDAD</span>
                            <span style="font-size: 0.7rem; color: white; font-weight: 900;">${details.hum || '--'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.55rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px;"><i class="fas fa-hand-rock" style="color:#00E36D;"></i> AGARRE PISTA</span>
                            <span style="font-size: 0.7rem; color: #00E36D; font-weight: 950;">${intel.gripStatus || 'ÓPTIMO'}</span>
                        </div>
                    </div>
                    <div id="weather-insight-${safeCityId}" style="display: none; margin-top: 12px; padding: 12px 14px; background: rgba(0,0,0,0.2); border-radius: 16px; border-left: 3px solid ${statusColor}; animation: textSlideIn 0.8s ease-out;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
                            <i class="fas fa-brain" style="font-size: 0.65rem; color: ${statusColor}; opacity: 0.9;"></i>
                            <span style="font-size: 0.55rem; font-weight: 950; color: ${statusColor}; letter-spacing: 0.5px; text-transform: uppercase;">INSIGHT TÁCTICO</span>
                        </div>
                        <p style="margin: 0; font-size: 0.7rem; color: rgba(255,255,255,0.7); font-weight: 600; line-height: 1.4;">
                            ${intel.recommendation.replace('la IA', 'el sistema').replace('predictivo', 'estimado')}
                        </p>
                    </div>
                </div>
            `;
        }

        renderAgendaWidget(myEvents) {
            if (myEvents.length === 0) {
                return `
                <div style="min-width: 100%; background: var(--bg-card); border-radius: 32px; padding: 50px 30px; text-align: center; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);">
                        <div style="width: 80px; height: 80px; background: var(--bg-app); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid var(--border-subtle);">
                            <i class="fas fa-calendar-plus" style="font-size: 2.2rem; color: #cbd5e1;"></i>
                        </div>
                        <h3 style="color: var(--text-primary); font-weight: 950; font-size: 1.25rem; margin-bottom: 10px; letter-spacing: -0.5px;">SIN PLANES PRÓXIMOS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">Apúntate a una americana para<br>empezar a sumar en el ranking.</p>
                        <button onclick="Router.navigate('entrenos')" class="btn-3d primary" style="width: auto; padding: 14px 28px;">EXPLORAR EVENTOS</button>
                    </div >
                `;
            }

            return myEvents.map(am => `
                <div class="agenda-card" onclick="window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" style="min-width: 280px; background: var(--bg-card); border-radius: 32px; border: 1px solid var(--border-subtle); padding: 24px; scroll-snap-align: center; position: relative; box-shadow: var(--shadow-md); transition: all 0.2s; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; pointer-events: none;">
                        <div style="color: var(--brand-neon); background: var(--brand-navy); padding: 4px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">${this.formatDateShort(am.date)}</div>
                        ${am.status === 'live' ?
                    `<div style="background: rgba(255, 45, 85, 0.2); color: #FF2D55; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; animation: blink 1s infinite; border: 1px solid #FF2D55;">EN VIVO 🔴</div>` :
                    `<div style="background: rgba(6, 182, 212, 0.1); color: var(--brand-accent); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900;">CONFIRMADO</div>`
                }
                    </div>
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1.3rem; font-weight: 950; letter-spacing: -0.5px; line-height: 1.2; pointer-events: none;">${am.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--border-subtle); pointer-events: none;">
                        <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 800;"><i class="far fa-clock" style="color: var(--brand-neon); margin-right: 8px;"></i> ${am.time}</span>
                        <div style="width: 36px; height: 36px; background: var(--brand-navy); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; box-shadow: var(--shadow-sm);">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>`
            ).join('');
        }

        renderSmartHero(context, userLevel) {
            // SLIDE: VIBRANT GLASS HERO
            let pillText = "INSCRIPCIÓN ABIERTA";
            let btnText = "APUNTARME AHORA";
            let btnClass = "primary";
            let logoText = "AMERICANAS";
            let explainerText = "¡Quedan pocas plazas! No te quedes fuera hoy.";
            let heroImage = "img/ball_hero.jpg";
            let overlayColor = "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.7))";

            if (context.status === 'UPCOMING_EVENT') {
                pillText = "ESTÁS INSCRITO";
                btnText = "VER DETALLES";
                btnClass = "navy";
                logoText = "MI PLAZA";
                explainerText = "¡Prepárate! Tu próximo reto está a punto de empezar.";
                overlayColor = "linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(6, 182, 212, 0.7))";
            } else if (context.status === 'FINISHED') {
                pillText = "EVENTO FINALIZADO";
                btnText = "VER RESUMEN";
                btnClass = "secondary";
                logoText = "HISTORY";
                explainerText = "Consulta los resultados y revive los mejores momentos.";
                overlayColor = "linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(107, 114, 128, 0.7))";
            } else if (context.status === 'LIVE_MATCH') {
                pillText = "¡ESTÁS EN PISTA!";
                btnText = "MARCADOR EN VIVO";
                btnClass = "primary";
                logoText = "LIVE NOW";
                explainerText = "Tu partido está en progreso. ¡A por todas!";
                overlayColor = "linear-gradient(135deg, rgba(225, 29, 72, 0.95), rgba(204, 255, 0, 0.4))";
            }

            return `
                <div class="vibrant-hero-card" onclick="Router.navigate('live')" style="background: ${overlayColor}; backdrop-filter: var(--backdrop-blur); border-radius: 32px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 0; margin-bottom: 30px; overflow: hidden; box-shadow: var(--shadow-xl); position: relative;">
                    <div style="height: 160px; background: url('${heroImage}') center/cover; position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.6));"></div>
                        <div style="position: absolute; top: 20px; left: 20px; background: var(--brand-neon); padding: 6px 16px; border-radius: 12px; font-weight: 950; color: #000; font-size: 0.75rem; box-shadow: var(--shadow-neon); letter-spacing: 1px;">
                            ${pillText}
                        </div>
                    </div>

                    <div style="padding: 28px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; font-size: 0.8rem; font-weight: 900; color: var(--brand-neon); text-transform: uppercase; letter-spacing: 2px;">${logoText}</h4>
                                <h2 style="margin: 8px 0 0; font-size: 1.8rem; font-weight: 950; line-height: 1.1; letter-spacing: -0.5px;">${context.eventName || 'Americana Hoy'}</h2>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.3rem; font-weight: 950; color: var(--brand-neon);">${context.eventTime || context.matchTime || '18:00'}</div>
                                <div style="font-size: 0.75rem; font-weight: 700; opacity: 0.7; letter-spacing: 1px;">${context.matchDay || 'HOY'}</div>
                            </div>
                        </div>

                        <p style="margin: 20px 0 25px; font-size: 0.95rem; color: rgba(255,255,255,0.9); line-height: 1.5; font-weight: 500;">
                            ${explainerText}
                        </p>

                        <button class="btn-3d ${btnClass}" style="margin-top: 0; font-size: 1.1rem; height: 60px;">
                            ${btnText} <i class="fas fa-chevron-right" style="margin-left: 10px; font-size: 0.9rem;"></i>
                        </button>
                    </div>
                </div>`;
        }

        async renderLiveWidget(context = {}) {
            try {
                // 1. DATA GATHERING (INTEL) - Fresh fetch for real-time accuracy
                const [allEvents, weatherData] = await Promise.all([
                    window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                    window.WeatherService ? window.WeatherService.getDashboardWeather() : []
                ]);

                console.log(`🧠[Match Command Center] Processing ${allEvents.length} events for player command hub.`);

                // 2. HEADER WEATHER PILL SYNC
                const weatherPill = document.getElementById('header-weather-pill');
                if (weatherPill && weatherData && weatherData[0]) {
                    const w = weatherData[0];
                    const ballSpeed = w.temp > 20 ? 'Rápida' : 'Lenta';
                    weatherPill.innerHTML = `
                        <span>${w.icon || '☀️'}</span>
                        <span style="color:#ffffff;">${w.temp}°C ${w.name.toUpperCase()}</span>
                        <span style="color:#38bdf8; font-size:0.62rem; font-weight:900;">• BOLA ${ballSpeed.toUpperCase()}</span>
                    `;
                }

                // 3. USER CONTEXT EXTRACTION
                const user = (window.Store ? window.Store.getState('currentUser') : null) || {};
                const userLevel = parseFloat(user.level || user.self_rate_level || 3.5).toFixed(2);
                const userRank = (context && context.newRank && context.newRank !== '-') ? context.newRank : (user.rank || '12');
                const upcomingCount = (context && context.upcomingMatches) ? context.upcomingMatches : 0;

                // Open active events
                const openEvents = allEvents
                    .filter(a => ['open', 'upcoming', 'scheduled'].includes(a.status))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                let hubHtml = '';

                // 4. SMART IMPACT CARD (HERO MATCH OR PRIORITY CHALLENGE)
                if (context && (context.hasMatchToday || context.hasMatchThisWeek)) {
                    // Player has an upcoming match!
                    hubHtml += `
                    <div onclick="window.dashNavigate('agenda', 'match')" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.16) 0%, rgba(15, 23, 42, 0.85) 100%); border: 1.5px solid rgba(34, 197, 94, 0.45); border-radius: 20px; padding: 16px; cursor: pointer; position: relative; overflow: hidden; margin-bottom: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); transition: transform 0.2s;" onmousedown="this.style.transform='scale(0.99)'" onmouseup="this.style.transform='scale(1)'">
                        <div style="position: absolute; top: -25px; right: -25px; width: 90px; height: 90px; background: rgba(34, 197, 94, 0.25); filter: blur(35px); border-radius: 50%; pointer-events: none;"></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; position: relative; z-index: 2;">
                            <span style="background: #22c55e; color: #000000; font-size: 0.58rem; font-weight: 950; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.8px; text-transform: uppercase; box-shadow: 0 0 10px rgba(34,197,94,0.4);">
                                🟢 TU PRÓXIMO PARTIDO
                            </span>
                            <span style="font-size: 0.72rem; color: #86efac; font-weight: 950; background: rgba(0,0,0,0.35); padding: 3px 8px; border-radius: 6px;">
                                ${context.matchTime || 'Hoy'} • PISTA ${context.court || '?'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                            <div style="flex: 1; padding-right: 12px;">
                                <div style="color: #ffffff; font-size: 0.95rem; font-weight: 950; line-height: 1.25; margin-bottom: 4px;">
                                    ${context.eventName || 'Partido Oficial SomosPadel'}
                                </div>
                                <div style="font-size: 0.70rem; color: #cbd5e1; font-weight: 600;">
                                    Pareja: <strong style="color: #ffffff;">${context.partner || 'Asignando...'}</strong>
                                    ${context.opponents ? ` • vs <span style="color:#94a3b8;">${context.opponents}</span>` : ''}
                                </div>
                            </div>
                            <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 0.70rem; font-weight: 900; padding: 9px 14px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">
                                VER PISTA <i class="fas fa-chevron-right" style="font-size: 0.6rem;"></i>
                            </div>
                        </div>
                    </div>
                    `;
                } else if (openEvents.length > 0) {
                    // Open event available to sign up!
                    const topEvt = openEvents[0];
                    const maxPlayers = topEvt.max_players || 24;
                    const currentPlayers = (topEvt.registeredPlayers || topEvt.players || []).length;
                    const spotsLeft = Math.max(0, maxPlayers - currentPlayers);
                    const dateText = this.formatDateShort ? this.formatDateShort(topEvt.date) : 'HOY';

                    hubHtml += `
                    <div onclick="window.dashNavigate('entrenos', 'event')" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(249, 115, 22, 0.1) 45%, rgba(15, 23, 42, 0.85) 100%); border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 16px; cursor: pointer; position: relative; overflow: hidden; margin-bottom: 14px; box-shadow: 0 10px 30px rgba(239,68,68,0.12); transition: transform 0.15s ease; user-select: none; -webkit-tap-highlight-color: transparent;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
                        <div style="position: absolute; top: -30px; right: -30px; width: 110px; height: 110px; background: rgba(239, 68, 68, 0.3); filter: blur(40px); border-radius: 50%; pointer-events: none;"></div>
                        <div style="position: absolute; bottom: -20px; left: -20px; width: 90px; height: 90px; background: rgba(249, 115, 22, 0.2); filter: blur(35px); border-radius: 50%; pointer-events: none;"></div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; position: relative; z-index: 2;">
                            <span style="background: #ef4444; color: #ffffff; font-size: 0.58rem; font-weight: 950; padding: 4px 10px; border-radius: 7px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 0 12px rgba(239,68,68,0.5);">
                                🔥 RETO DESTACADO
                            </span>
                            <span style="font-size: 0.68rem; color: ${spotsLeft > 0 ? '#fed7aa' : '#fca5a5'}; font-weight: 850; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; border: 1px solid ${spotsLeft > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.3)'};">
                                ${spotsLeft > 0 ? `⚡ ${spotsLeft} plazas libres` : '🔴 COMPLETO (RESERVA)'}
                            </span>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; position: relative; z-index: 2;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="color: #ffffff; font-size: 0.96rem; font-weight: 950; line-height: 1.25; margin-bottom: 4px; text-shadow: 0 2px 8px rgba(0,0,0,0.5); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${(topEvt.name || 'Americana SomosPadel').toUpperCase()}
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                    <i class="far fa-calendar-check" style="color: #CCFF00;"></i>
                                    <span>${dateText} • ${topEvt.time || '18:00'}</span>
                                    <span style="color: #94a3b8;">• Nivel 2.5 - 4.5</span>
                                </div>
                            </div>
                            <div style="background: #CCFF00; color: #000000; font-size: 0.75rem; font-weight: 950; padding: 10px 16px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 18px rgba(204,255,0,0.4); flex-shrink: 0; pointer-events: none;">
                                APUNTARME <i class="fas fa-arrow-right" style="font-size: 0.62rem;"></i>
                            </div>
                        </div>
                    </div>
                    `;
                } else {
                    // Quick challenge fallback
                    hubHtml += `
                    <div onclick="window.dashNavigate('partidas_abiertas', 'hub')" style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 20px; padding: 16px; cursor: pointer; margin-bottom: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); user-select: none; -webkit-tap-highlight-color: transparent;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="background: #0ea5e9; color: white; font-size: 0.58rem; font-weight: 950; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">🎾 PISTAS Y PARTIDAS</span>
                                <div style="color: white; font-size: 0.95rem; font-weight: 950; margin-top: 6px;">¿Ganas de jugar hoy?</div>
                                <div style="font-size: 0.70rem; color: #94a3b8; margin-top: 2px;">Encuentra o crea una partida abierta con jugadores de tu nivel.</div>
                            </div>
                            <div style="background: #38bdf8; color: #000; font-size: 0.72rem; font-weight: 950; padding: 9px 14px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; pointer-events: none;">
                                BUSCAR <i class="fas fa-search" style="font-size: 0.65rem;"></i>
                            </div>
                        </div>
                    </div>
                    `;
                }

                // 5. SMART QUICK ACTIONS DOCK (GRID 2x2 WITH LIVE METRICS)
                hubHtml += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; user-select: none; -webkit-tap-highlight-color: transparent;">
                    
                    <!-- 1. AMERICANAS / RETOS -->
                    <div onclick="window.dashNavigate('americanas', 'command_hub')" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 13px 14px; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; position: relative;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'" onmouseover="this.style.background='rgba(255,255,255,0.07)'; this.style.borderColor='rgba(204,255,0,0.35)';" onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.08)';">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.3rem;">🏆</span>
                            <span style="background: rgba(204, 255, 0, 0.12); color: #CCFF00; font-size: 0.60rem; font-weight: 950; padding: 3px 7px; border-radius: 6px; border: 1px solid rgba(204, 255, 0, 0.3);">
                                ${openEvents.length} DISPONIBLES
                            </span>
                        </div>
                        <div style="color: #ffffff; font-size: 0.84rem; font-weight: 950; margin-bottom: 2px;">Americanas</div>
                        <div style="color: #94a3b8; font-size: 0.65rem; font-weight: 650;">Inscripción oficial</div>
                    </div>

                    <!-- 2. PARTIDAS ABIERTAS -->
                    <div onclick="window.dashNavigate('partidas_abiertas', 'command_hub')" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 13px 14px; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; position: relative;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'" onmouseover="this.style.background='rgba(255,255,255,0.07)'; this.style.borderColor='rgba(56,189,248,0.35)';" onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.08)';">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.3rem;">⚡</span>
                            <span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-size: 0.60rem; font-weight: 950; padding: 3px 7px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);">
                                EN VIVO
                            </span>
                        </div>
                        <div style="color: #ffffff; font-size: 0.84rem; font-weight: 950; margin-bottom: 2px;">Partidas Libres</div>
                        <div style="color: #94a3b8; font-size: 0.65rem; font-weight: 650;">Buscar o montar</div>
                    </div>

                    <!-- 3. MI RANKING & NIVEL -->
                    <div onclick="window.dashNavigate('ranking', 'command_hub')" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 13px 14px; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; position: relative;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'" onmouseover="this.style.background='rgba(255,255,255,0.07)'; this.style.borderColor='rgba(245,158,11,0.35)';" onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.08)';">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.3rem;">📈</span>
                            <span style="background: rgba(245, 158, 11, 0.12); color: #fbbf24; font-size: 0.60rem; font-weight: 950; padding: 3px 7px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">
                                #${userRank !== '-' ? userRank : 'PRO'} RANK
                            </span>
                        </div>
                        <div style="color: #ffffff; font-size: 0.84rem; font-weight: 950; margin-bottom: 2px;">Nivel ${userLevel}</div>
                        <div style="color: #94a3b8; font-size: 0.65rem; font-weight: 650;">Ver ranking y progreso</div>
                    </div>

                    <!-- 4. MI AGENDA -->
                    <div onclick="window.dashNavigate('agenda', 'command_hub')" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 13px 14px; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; position: relative;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'" onmouseover="this.style.background='rgba(255,255,255,0.07)'; this.style.borderColor='rgba(168,85,247,0.35)';" onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.08)';">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.3rem;">📅</span>
                            <span style="background: ${upcomingCount > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.1)'}; color: ${upcomingCount > 0 ? '#4ade80' : '#94a3b8'}; font-size: 0.60rem; font-weight: 950; padding: 3px 7px; border-radius: 6px; border: 1px solid ${upcomingCount > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.2)'};">
                                ${upcomingCount} CITAS
                            </span>
                        </div>
                        <div style="color: #ffffff; font-size: 0.84rem; font-weight: 950; margin-bottom: 2px;">Mi Agenda</div>
                        <div style="color: #94a3b8; font-size: 0.65rem; font-weight: 650;">Tus partidos y horarios</div>
                    </div>

                </div>
                `;

                const container = document.getElementById('live-scroller-inner');
                if (container) {
                    container.innerHTML = hubHtml;
                }
                return hubHtml;
            } catch (err) {
                console.error("renderLiveWidget Error:", err);
                return '';
            }
        }

        formatDateShort(dateString) {
            if (!dateString) return 'HOY';
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'HOY';
            if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';

            const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
            return `${days[date.getDay()]} ${date.getDate()} `;
        }

        /**
         * Real data context builder for the Hero Card
         * @param {Object} user - The current logged in user
         */
        async buildContext(user) {
            const context = {
                status: 'EMPTY',
                eventName: null,
                eventDate: null,
                eventTime: null,
                court: null,
                opponents: null,
                partner: null,
                eventDateRaw: null,
                hasMatchToday: false,
                hasOpenTournament: false,
                hasRecentVictory: false,
                hasMatchThisWeek: false,
                activeTournaments: 0,
                upcomingMatches: 0,
                myEvents: [],
                scoreA: null,
                scoreB: null,
                pointsEarned: 0,
                newRank: '-',
                confirmed: false,
                matchId: null,
                matchType: null
            };



            if (!user) return context;

            try {
                // 1. Get All Events & User Stats (Real-time or Cached)
                const [allEvents, rankedPlayers] = await Promise.all([
                    window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                    window.RankingController ? window.RankingController.calculateSilently() : []
                ]);

                const userId = user.uid || user.id;

                // 2. Real Rank Calculation
                if (rankedPlayers.length > 0) {
                    const myRankIndex = rankedPlayers.findIndex(p => p.id === userId);
                    context.newRank = myRankIndex !== -1 ? (myRankIndex + 1).toString() : '-';
                }

                // 3. Victory Detection (Last 24h)
                const winningMatch = await this.checkRecentVictory(user);
                context.hasRecentVictory = !!winningMatch;
                if (winningMatch) {
                    const isTeamA = (winningMatch.team_a_ids || []).includes(userId);
                    context.scoreA = isTeamA ? winningMatch.score_a : winningMatch.score_b;
                    context.scoreB = isTeamA ? winningMatch.score_b : winningMatch.score_a;
                    context.opponents = isTeamA ? winningMatch.team_b_names : winningMatch.team_a_names;
                }

                // 4. Inscriptions & Waitlist Monitor
                const openEvents = allEvents.filter(a => ['open', 'upcoming', 'scheduled'].includes(a.status));
                context.activeTournaments = openEvents.length;
                context.hasOpenTournament = openEvents.length > 0;

                // Populate first available tournament for HeroCard display
                if (context.hasOpenTournament) {
                    const nextTournament = openEvents[0];
                    context.tournamentName = nextTournament.name;
                    context.tournamentDate = this.formatFriendlyDate(nextTournament.date);
                    context.tournamentTime = nextTournament.time || '18:00';
                    context.tournamentId = nextTournament.id;
                    context.maxPlayers = nextTournament.max_players || 24;
                    context.currentPlayers = (nextTournament.registeredPlayers || []).length;
                }

                // 5. STATS & ARCHIVE (Calculated silently in background)
                if (rankedPlayers && rankedPlayers.length > 0) {
                    const me = rankedPlayers.find(p => p.id === userId);
                    if (me) {
                        context.myRank = me.rank;
                        context.rankStatus = me.trend || 'stable';
                    }
                }

                // 2026 UPDATE: Fetch active tournaments for ActionGrid badge
                if (window.AmericanaService) {
                    const activeEvents = await window.AmericanaService.getAllActiveEvents();
                    context.activeTournaments = activeEvents.filter(e => e.type === 'americana' && e.status !== 'finished').length;

                    // Specific active tournament for QuickStats (if user is in one)
                    context.activeTournament = activeEvents.find(e =>
                        e.type === 'americana' &&
                        e.status !== 'finished' &&
                        (e.players || []).some(p => p.id === userId)
                    );
                }

                // 5. User's specific participation (re-ordered)
                context.myEvents = allEvents.filter(a => {
                    const players = a.players || a.registeredPlayers || [];
                    return players.some(p => (p.uid || p.id || p) === userId);
                });

                context.upcomingMatches = context.myEvents.filter(e => e.status !== 'finished').length;
                context.hasMatchThisWeek = context.upcomingMatches > 0;

                // 6. DEEP DIVE: Current/Next Match Details
                const myActiveEvent = context.myEvents.find(e => !['finished', 'closed', 'cancelled'].includes(e.status));

                if (myActiveEvent) {
                    const isTodayMatch = this.isToday(myActiveEvent.date);
                    const isLive = myActiveEvent.status === 'live' || myActiveEvent.status === 'in_progress' || myActiveEvent.status === 'pairing';

                    // FETCH REAL MATCH DATA (Court, Partner, Opponents)
                    // Intentamos obtener detalles independientemente de si es hoy, por si el admin ya generó cruces
                    const matchData = await this.fetchMatchDetails(userId, myActiveEvent.id, myActiveEvent.type, myActiveEvent.status);
                    
                    if (matchData) {
                        context.hasMatchToday = true; // Lo marcamos como "Today" para que HeroCard use renderUpcomingMatch
                        context.status = isLive ? 'LIVE_MATCH' : 'UPCOMING_EVENT';
                        context.eventName = myActiveEvent.name;
                        context.matchTime = myActiveEvent.time || '18:00';
                        context.matchDay = isTodayMatch ? (myActiveEvent.type === 'entreno' ? 'Entreno (Pozo)' : 'Americana') : this.formatFriendlyDate(myActiveEvent.date);
                        context.tournamentName = myActiveEvent.type === 'entreno' ? 'Entreno (Pozo)' : 'Americana';
                        context.eventDateRaw = myActiveEvent.date;
                        context.matchType = myActiveEvent.type;
                        
                        context.matchId = matchData.id;
                        context.court = matchData.court || '?';
                        context.partner = matchData.partnerName || 'Asignando...';
                        context.opponents = matchData.opponentsNames || 'Asignando...';
                        context.confirmed = matchData.confirmations ? !!matchData.confirmations[userId] : false;
                        context.round = matchData.round;
                    } else {
                        // Si no hay partidos pero el evento es hoy o está en vivo, mostramos info general
                        if (isTodayMatch || isLive) {
                            context.hasMatchToday = true;
                            context.status = isLive ? 'LIVE_MATCH' : 'UPCOMING_EVENT';
                            context.eventName = myActiveEvent.name;
                            context.matchTime = myActiveEvent.time || '18:00';
                            context.matchDay = myActiveEvent.type === 'entreno' ? 'Entreno (Pozo)' : 'Americana';
                        } else {
                            context.status = 'UPCOMING_EVENT';
                            context.eventName = myActiveEvent.name;
                            context.matchTime = myActiveEvent.time || '18:00';
                            context.matchDay = this.formatFriendlyDate(myActiveEvent.date);
                        }
                    }
                } else if (context.hasRecentVictory) {
                    context.status = 'VICTORY';
                    context.pointsEarned = 15; // Mock for now, should calculate
                } else if (context.hasOpenTournament) {
                    context.status = 'EMPTY';
                }

            } catch (err) {
                console.error("❌ [DashboardView] Error building user context:", err);
            }



            return context;
        }

        // --- PHASE 1 HELPERS ---

        _normalizeDate(d) {
            if (!d) return '9999-99-99';
            if (String(d).includes('/')) {
                const parts = String(d).split('/');
                if (parts[2] && parts[2].length === 4) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            return d;
        }

        isToday(dateStr) {
            if (!dateStr) return false;
            const norm = this._normalizeDate(dateStr);
            const today = new Date().toISOString().split('T')[0];
            return norm === today;
        }

        formatFriendlyDate(dateStr) {
            if (!dateStr) return '';
            const norm = this._normalizeDate(dateStr);
            const d = new Date(norm + 'T12:00:00'); // Use noon to avoid TZ issues
            if (isNaN(d.getTime())) return dateStr;
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
        }

        _withTimeout(promise, ms, defaultValue = null) {
            let timeoutId;
            const timeoutPromise = new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    console.warn(`⏳ [DashboardView] Promesa de red expirada tras ${ms}ms.`);
                    resolve(defaultValue);
                }, ms);
            });
            return Promise.race([
                promise.then(val => {
                    clearTimeout(timeoutId);
                    return val;
                }),
                timeoutPromise
            ]);
        }

        async fetchMatchDetails(userId, eventId, type, status = 'scheduled') {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                
                // Para eventos programados/recientes, preferimos el primer partido (ASC).
                // Para eventos en vivo, preferimos el último generado (DESC).
                const sortOrder = (status === 'live' || status === 'in_progress') ? 'desc' : 'asc';

                // We fetch matches for this event where the user participates
                // Removed .orderBy('round') because it requires a composite index in Firestore
                // which causes the query to fail silently if it doesn't exist
                let snapshot = await this._withTimeout(
                    window.db.collection(collectionName)
                        .where('americana_id', '==', eventId)
                        .get(),
                    3000,
                    null
                );

                // FALLBACK: Sometimes entreno matches get saved to 'matches' collection or vice-versa
                if (!snapshot || snapshot.empty) {
                    const fallbackCollection = (collectionName === 'entrenos_matches') ? 'matches' : 'entrenos_matches';
                    snapshot = await this._withTimeout(
                        window.db.collection(fallbackCollection)
                            .where('americana_id', '==', eventId)
                            .get(),
                        3000,
                        null
                    );
                }

                if (!snapshot || snapshot.empty) return null;

                const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const currentUserObj = window.Store ? window.Store.getState('currentUser') : null;
                const userIdStr = String(userId);
                const userNameLower = currentUserObj && currentUserObj.name ? currentUserObj.name.toLowerCase() : '';

                // Filter matches involving the user (By ID or By Name as fallback)
                const userMatches = allMatches.filter(m => {
                    const ids = [...(m.team_a_ids || []), ...(m.team_b_ids || [])];
                    if (ids.some(id => String(id) === userIdStr)) return true;

                    // Fallback: Check if user's name is in the team names
                    if (userNameLower) {
                        const allNames = [];
                        if (Array.isArray(m.team_a_names)) allNames.push(...m.team_a_names);
                        else if (typeof m.team_a_names === 'string') allNames.push(...m.team_a_names.split(' / '));

                        if (Array.isArray(m.team_b_names)) allNames.push(...m.team_b_names);
                        else if (typeof m.team_b_names === 'string') allNames.push(...m.team_b_names.split(' / '));

                        return allNames.some(n => n && n.toLowerCase().includes(userNameLower));
                    }
                    return false;
                });

                if (userMatches.length === 0) return null;

                // Sort client-side
                userMatches.sort((a, b) => {
                    const rA = parseInt(a.round) || 1;
                    const rB = parseInt(b.round) || 1;
                    return sortOrder === 'asc' ? rA - rB : rB - rA;
                });

                // Pick the most relevant match based on sorting
                const userMatch = userMatches[0];

                // Determine if user is in Team A (By ID or Name)
                let isTeamA = false;
                if ((userMatch.team_a_ids || []).some(id => String(id) === userIdStr)) {
                    isTeamA = true;
                } else if (userNameLower) {
                    const allNamesA = [];
                    if (Array.isArray(userMatch.team_a_names)) allNamesA.push(...userMatch.team_a_names);
                    else if (typeof userMatch.team_a_names === 'string') allNamesA.push(...userMatch.team_a_names.split(' / '));
                    
                    isTeamA = allNamesA.some(n => n && n.toLowerCase().includes(userNameLower));
                }

                const myTeamIds = isTeamA ? userMatch.team_a_ids : userMatch.team_b_ids;
                const opponentNamesRaw = isTeamA ? userMatch.team_b_names : userMatch.team_a_names;
                const myTeamNamesRaw = isTeamA ? userMatch.team_a_names : userMatch.team_b_names;

                // Extraer el nombre de la pareja de forma robusta
                let partnerName = 'Solo';
                const myNamesList = Array.isArray(myTeamNamesRaw) ? myTeamNamesRaw : (myTeamNamesRaw ? String(myTeamNamesRaw).split(' / ') : []);
                
                if (myNamesList.length > 0) {
                    const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                    const myName = currentUser ? (currentUser.name || "").toLowerCase() : "";
                    
                    // Buscamos el nombre que NO sea el del usuario actual
                    partnerName = myNamesList.find(n => n && !n.toLowerCase().includes(myName)) || myNamesList[1] || myNamesList[0];
                }

                return {
                    id: userMatch.id,
                    court: userMatch.court,
                    partnerName: partnerName,
                    opponentsNames: Array.isArray(opponentNamesRaw) ? opponentNamesRaw.join(' / ') : (opponentNamesRaw || 'Por asignar'),
                    confirmations: userMatch.confirmations || {},
                    round: userMatch.round
                };
            } catch (e) {
                console.warn("fetchMatchDetails error:", e);
                return null;
            }
        }

        async checkRecentVictory(user) {
            try {
                const userId = user.uid || user.id;
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

                const pulls = await this._withTimeout(
                    Promise.all([
                        window.db.collection('matches').where('status', '==', 'finished').where('created_at', '>', yesterday).get(),
                        window.db.collection('entrenos_matches').where('status', '==', 'finished').where('created_at', '>', yesterday).get()
                    ]),
                    3000,
                    [null, null]
                );

                if (!pulls || !pulls[0] || !pulls[1]) return null;

                const allRecentMatches = [...pulls[0].docs, ...pulls[1].docs].map(doc => doc.data());

                return allRecentMatches.find(m => {
                    const isTeamA = (m.team_a_ids || []).includes(userId);
                    const isTeamB = (m.team_b_ids || []).includes(userId);
                    if (!isTeamA && !isTeamB) return false;

                    const scoreA = parseInt(m.score_a || 0);
                    const scoreB = parseInt(m.score_b || 0);

                    if (isTeamA) return scoreA > scoreB;
                    if (isTeamB) return scoreB > scoreA;
                    return false;
                });
            } catch (e) {
                return null;
            }
        }


        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return `${days[date.getDay()]} ${date.getDate()}`;
        }

        /**
         * Normaliza un timestamp de Firestore o JS a milisegundos
         */
        _getTimestampValue(ts) {
            if (!ts) return Date.now();
            if (ts.toMillis) return ts.toMillis();
            if (ts instanceof Date) return ts.getTime();
            if (typeof ts === 'string') {
                const d = new Date(ts);
                return isNaN(d.getTime()) ? Date.now() : d.getTime();
            }
            if (typeof ts === 'number') return ts;
            return Date.now();
        }

        async loadLiveWidgetContent(context) {
            console.log("🧠 [DashboardView] loadLiveWidgetContent started");

            // 0. Render Hero Card (Priority Sync)
            try {
                const heroRoot = document.getElementById('hero-card-root');
                if (heroRoot && window.HeroCard) {
                    heroRoot.innerHTML = window.HeroCard.render(context);

                    // POPUP ALERT: Torneo (Solo ventana emergente)
                    if (context.hasOpenTournament && !context.isSignedUp && window.PremiumModal) {
                        const sessionKey = `popup_tournament_${context.tournamentId}`;
                        if (!sessionStorage.getItem(sessionKey)) {
                            sessionStorage.setItem(sessionKey, 'true');
                            setTimeout(() => {
                                window.PremiumModal.confirm({
                                    title: "INSCRIPCIÓN ABIERTA",
                                    message: `El evento <b>${context.tournamentName}</b> está disponible.<br>¿Quieres ver los detalles y apuntarte?`,
                                    confirmText: "VER DETALLES",
                                    cancelText: "LUEGO",
                                    type: 'success'
                                }).then(res => {
                                    if (res) window.Router.navigate('entrenos');
                                });
                            }, 800);
                        }
                    }
                }
            } catch (e) {
                console.error("❌ HeroCard render failed:", e);
            }
            try {
                await this.renderLiveWidget(context);
            } catch (e) {
                console.error("❌ renderLiveWidget failed:", e);
            }



            try {
                // 3. Load Activity Feed
                const activityContainer = document.getElementById('activity-feed-content');
                if (activityContainer) {
                    this.renderActivityFeed().then(html => {
                        activityContainer.innerHTML = html;
                    }).catch(e => {
                        console.error("Activity Feed failed", e);
                    });
                }

                // 4. Load Trending Players (MVP + Elite list)
                this.renderTrendingPlayers();

                // 5. Load ESPN Player Faceoff (1vs1 comparison simulator)
                this.renderPlayerFaceoff();
            } catch (e) {
                console.error('❌ [DashboardView] Error in core widget loading:', e);
            }
        }

        async renderTrendingPlayers() {
            const root = document.getElementById('trending-players-list');
            const mvpRoot = document.getElementById('mvp-spotlight-container');
            if (!root) return;

            try {
                // Obtenemos los datos del Ranking real
                const players = await (window.RankingController ? window.RankingController.calculateSilently() : []);
                
                // --- 1. MVP SPOTLIGHT (Top 1) ---
                if (mvpRoot) {
                    let mvp = (players && players.length > 0) ? players[0] : null;
                    if (!mvp) {
                        const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                        mvp = currentUser ? {
                            name: currentUser.name || "Alejandro Coscolín",
                            level: currentUser.level || 3.5,
                            stats: {
                                americanas: { points: 2450, played: 12, won: 6 },
                                entrenos: { points: 0, played: 0, won: 0 }
                            },
                            photo_url: currentUser.photo_url || currentUser.photoURL || null,
                            ranking_pos: 1
                        } : {
                            name: "Alejandro Coscolín",
                            level: 3.5,
                            stats: {
                                americanas: { points: 2450, played: 12, won: 6 },
                                entrenos: { points: 0, played: 0, won: 0 }
                            },
                            photo_url: null,
                            ranking_pos: 1
                        };
                    }

                    // Precalculate aggregated stats for FUT card rendering
                    const mvpPoints = (mvp.stats?.americanas?.points || 0) + (mvp.stats?.entrenos?.points || 0);
                    const mvpWon = (mvp.stats?.americanas?.won || 0) + (mvp.stats?.entrenos?.won || 0);
                    const mvpStreak = mvpWon > 0 ? (1 + ((mvp.id ? String(mvp.id).charCodeAt(0) : 0) % Math.min(mvpWon, 4))) : 0;

                    const levelNum = parseFloat(mvp.level || 3.5);

                    // Estadísticas de rendimiento reales
                    const playedAme = mvp.stats?.americanas?.played || 0;
                    const playedEnt = mvp.stats?.entrenos?.played || 0;
                    const totalPlayed = playedAme + playedEnt;

                    const wonAme = mvp.stats?.americanas?.won || 0;
                    const wonEnt = mvp.stats?.entrenos?.won || 0;
                    const totalWon = wonAme + wonEnt;

                    const lostAme = mvp.stats?.americanas?.lost || 0;
                    const lostEnt = mvp.stats?.entrenos?.lost || 0;
                    const totalLost = lostAme + lostEnt;

                    const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

                    const gamesWonAme = mvp.stats?.americanas?.gamesWon || 0;
                    const gamesWonEnt = mvp.stats?.entrenos?.gamesWon || 0;
                    const totalGamesWon = gamesWonAme + gamesWonEnt;

                    const gamesLostAme = mvp.stats?.americanas?.gamesLost || 0;
                    const gamesLostEnt = mvp.stats?.entrenos?.gamesLost || 0;
                    const totalGamesLost = gamesLostAme + gamesLostEnt;

                    const rankBadge = window.RankingController?.getLevelBadge(levelNum) || { label: 'GOLD', color: '#fbbf24' };

                    mvpRoot.innerHTML = `
                        <div class="fut-card-wrapper" onclick="this.classList.toggle('flipped')" style="
                            perspective: 1000px;
                            margin-bottom: 16px;
                            font-family: 'Outfit', 'Inter', sans-serif;
                            cursor: pointer;
                            position: relative;
                            user-select: none;
                            -webkit-tap-highlight-color: transparent;">
                            <style>
                                @keyframes gold-shine {
                                    0% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                    100% { background-position: 0% 50%; }
                                }
                                @keyframes pulse-soft {
                                    0% { opacity: 0.6; transform: scale(1); }
                                    50% { opacity: 1; transform: scale(1.02); }
                                    100% { opacity: 0.6; transform: scale(1); }
                                }
                                .fut-card-flipper {
                                    position: relative;
                                    width: 100%;
                                    transform-style: preserve-3d;
                                    transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                                }
                                .fut-card-wrapper.flipped .fut-card-flipper {
                                    transform: rotateY(180deg);
                                }
                                .fut-card-wrapper:not(.flipped):hover .fut-card-flipper {
                                    transform: rotateY(10deg) rotateX(5deg) scale(1.02);
                                }
                                .fut-card-front, .fut-card-back {
                                    width: 100%;
                                    backface-visibility: hidden;
                                    -webkit-backface-visibility: hidden;
                                    border-radius: 24px;
                                    border: 2px solid #eab308;
                                    box-sizing: border-box;
                                    overflow: hidden;
                                }
                                .fut-card-front {
                                    background: linear-gradient(135deg, #1e1b4b 0%, #030712 100%);
                                    box-shadow: 0 15px 35px rgba(234, 179, 8, 0.15), 0 0 25px rgba(234, 179, 8, 0.05);
                                    position: relative;
                                    z-index: 2;
                                }
                                .fut-card-back {
                                    background: linear-gradient(135deg, #090514 0%, #02010a 100%);
                                    box-shadow: 0 15px 35px rgba(234, 179, 8, 0.15), 0 0 25px rgba(234, 179, 8, 0.05);
                                    transform: rotateY(180deg);
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    height: 100%;
                                    z-index: 1;
                                }
                                .fut-card-inner {
                                    background: radial-gradient(circle at center, #1c1917 0%, #0c0a09 100%);
                                    border-radius: 22px;
                                    padding: 16px;
                                    position: relative;
                                    overflow: hidden;
                                    border: 1px solid rgba(234, 179, 8, 0.25);
                                    height: 100%;
                                    box-sizing: border-box;
                                }
                                .fut-gold-glow {
                                    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                                    background: linear-gradient(45deg, transparent, rgba(234, 179, 8, 0.15), transparent);
                                    transform: rotate(30deg);
                                    pointer-events: none;
                                    animation: gold-shine 6s ease infinite;
                                    background-size: 200% 200%;
                                }
                                .fut-badge-gold {
                                    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
                                    color: #000;
                                    font-weight: 1000;
                                    font-size: 0.55rem;
                                    padding: 3px 8px;
                                    border-radius: 6px;
                                    text-transform: uppercase;
                                    letter-spacing: 1px;
                                    box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
                                    display: inline-block;
                                }
                                .fut-stat-label {
                                    color: rgba(255,255,255,0.4);
                                    font-size: 0.52rem;
                                    font-weight: 800;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                }
                                .fut-stat-value {
                                    color: #fbbf24;
                                    font-size: 0.95rem;
                                    font-weight: 950;
                                    text-shadow: 0 0 5px rgba(251, 191, 36, 0.2);
                                }
                            </style>
                            <div class="fut-card-flipper">
                                <!-- CARA FRONTAL -->
                                <div class="fut-card-front">
                                    <div class="fut-gold-glow"></div>
                                    <div class="fut-card-inner">
                                        <!-- HEADER STATUS -->
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; position: relative; z-index: 5;">
                                            <span class="fut-badge-gold"><i class="fas fa-crown"></i> MVP OF THE WEEK</span>
                                            <span style="color: rgba(251, 191, 36, 0.7); font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;">SOMOSPADEL ELITE</span>
                                        </div>

                                        <!-- CORE DATA ROW -->
                                        <div style="display: flex; align-items: center; gap: 16px; position: relative; z-index: 5; margin-bottom: 14px;">
                                            <!-- Left Column: Score & Rank -->
                                            <div style="text-align: center; border-right: 1px solid rgba(234, 179, 8, 0.2); padding-right: 14px;">
                                                <!-- Real Padel Level -->
                                                <div style="font-size: 2rem; font-weight: 1000; color: #fbbf24; line-height: 0.8; letter-spacing: -1.5px; font-family: 'Outfit';">
                                                    ${parseFloat(mvp.level || 3.5).toFixed(2)}
                                                </div>
                                                <div style="font-size: 0.5rem; color: #fbbf24; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; line-height: 1;">NIVEL</div>
                                                <div style="font-size: 0.65rem; color: #fff; font-weight: 950; margin-top: 8px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
                                                    RANK #1
                                                </div>
                                            </div>

                                            <!-- Center: Player Avatar Frame -->
                                            <div style="position: relative;">
                                                <div style="
                                                    width: 76px; height: 76px; border-radius: 18px;
                                                    border: 2px solid #fbbf24;
                                                    background: ${mvp.photo_url ? `url('${mvp.photo_url}') center/cover` : '#27272a'};
                                                    box-shadow: 0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(234, 179, 8, 0.15);
                                                    overflow: hidden;
                                                    display: flex; align-items: center; justify-content: center;">
                                                    ${!mvp.photo_url ? `<span style="font-size: 2.2rem; font-weight: 1000; color: #fbbf24; font-family: 'Outfit';">${mvp.name.charAt(0).toUpperCase()}</span>` : ''}
                                                </div>
                                                <!-- Small Sparkle icon -->
                                                <div style="position: absolute; bottom: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #fbbf24; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px #fbbf24;">
                                                    <i class="fas fa-star" style="font-size: 0.55rem; color: #000;"></i>
                                                </div>
                                            </div>

                                            <!-- Right: Player Name & Primary Info -->
                                            <div style="flex: 1;">
                                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 1000; color: #fff; letter-spacing: -0.5px; line-height: 1.1; font-family: 'Outfit'; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                                                    ${mvp.name.toUpperCase()}
                                                </h3>
                                                <div style="color: #a3e635; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; gap: 5px; margin-top: 6px;">
                                                    <i class="fas fa-fire"></i> Racha: <span style="font-weight:950;">${mvpStreak} victorias</span>
                                                </div>
                                                <div style="color: rgba(255,255,255,0.4); font-size: 0.55rem; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                                                    <i class="fas fa-satellite"></i> NODO_BCN_ACTIVE
                                                </div>
                                            </div>
                                        </div>

                                        <!-- FIFA STYLE ATRIBUTES COLUMNS -->
                                        <div style="
                                            background: rgba(0, 0, 0, 0.4);
                                            border: 1px solid rgba(234, 179, 8, 0.15);
                                            border-radius: 14px;
                                            padding: 10px 14px;
                                            display: grid;
                                            grid-template-columns: 1fr 1fr 1fr 1fr;
                                            text-align: center;
                                            gap: 8px;
                                            position: relative;
                                            z-index: 5;">
                                            
                                            <div>
                                                <div class="fut-stat-label">NIV</div>
                                                <div class="fut-stat-value">${parseFloat(mvp.level || 3.5).toFixed(2)}</div>
                                            </div>
                                            <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                                <div class="fut-stat-label">PTS</div>
                                                <div class="fut-stat-value">${mvpPoints}</div>
                                            </div>
                                            <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                                <div class="fut-stat-label">RAC</div>
                                                <div class="fut-stat-value">${mvpStreak}</div>
                                            </div>
                                            <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                                <div class="fut-stat-label">VIC</div>
                                                <div class="fut-stat-value">${mvpWon}</div>
                                            </div>
                                        </div>

                                        <!-- HINT TO FLIP -->
                                        <div style="text-align: center; margin-top: 10px; font-size: 0.55rem; color: rgba(251, 191, 36, 0.6); font-weight: 900; letter-spacing: 0.5px; animation: pulse-soft 2s infinite; display: flex; align-items: center; justify-content: center; gap: 4px; position: relative; z-index: 5;">
                                            <i class="fas fa-sync-alt"></i> TOCAR PARA ESTADÍSTICAS REALES
                                        </div>
                                    </div>
                                </div>

                                <!-- CARA TRASERA -->
                                <div class="fut-card-back">
                                    <div class="fut-gold-glow"></div>
                                    <div class="fut-card-inner" style="display: flex; flex-direction: column; justify-content: space-between;">
                                        <!-- HEADER STATUS -->
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 5;">
                                            <span class="fut-badge-gold" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #000;"><i class="fas fa-chart-line"></i> RENDIMIENTO REAL</span>
                                            <span style="color: rgba(251, 191, 36, 0.7); font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;">DATOS OFICIALES</span>
                                        </div>

                                        <!-- CORE STATS -->
                                        <div style="position: relative; z-index: 5; margin: 6px 0; display: flex; flex-direction: column; gap: 8px; flex-grow: 1; justify-content: center;">
                                            <!-- Win rate circular style block -->
                                            <div style="text-align: center;">
                                                <div style="font-size: 0.52rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">EFECTIVIDAD DE VICTORIAS</div>
                                                <div style="font-size: 2.2rem; font-weight: 1000; color: #fbbf24; text-shadow: 0 0 15px rgba(251, 191, 36, 0.35); font-family: 'Outfit'; line-height: 1; margin: 4px 0 2px;">
                                                    ${winRate}%
                                                </div>
                                                <div style="font-size: 0.55rem; color: #a3e635; font-weight: 850; letter-spacing: 0.5px; text-transform: uppercase;">
                                                    ${totalWon} VICTORIAS DE ${totalPlayed} PARTIDOS
                                                </div>
                                            </div>

                                            <!-- COMPARATIVE BARS -->
                                            <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 14px; border: 1px solid rgba(234, 179, 8, 0.15);">
                                                <!-- Partidos: Ganados vs Perdidos -->
                                                <div>
                                                    <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 900; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; margin-bottom: 3px;">
                                                        <span>GANADOS</span>
                                                        <span>PERDIDOS</span>
                                                    </div>
                                                    <div style="height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 3px; overflow: hidden; display: flex; position: relative;">
                                                        <div style="width: ${totalPlayed > 0 ? (totalWon / totalPlayed) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #a3e635, #22c55e); border-radius: 3px 0 0 3px;"></div>
                                                        <div style="width: ${totalPlayed > 0 ? (totalLost / totalPlayed) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #f87171, #ef4444); border-radius: 0 3px 3px 0;"></div>
                                                    </div>
                                                    <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 950; color: #fff; margin-top: 2px;">
                                                        <span style="color: #a3e635;">${totalWon} PG</span>
                                                        <span style="color: #ef4444;">${totalLost} PP</span>
                                                    </div>
                                                </div>

                                                <!-- Juegos: A Favor vs En Contra -->
                                                <div>
                                                    <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 900; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; margin-bottom: 3px;">
                                                        <span>JUEGOS A FAVOR</span>
                                                        <span>JUEGOS EN CONTRA</span>
                                                    </div>
                                                    <div style="height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 3px; overflow: hidden; display: flex; position: relative;">
                                                        <div style="width: ${(totalGamesWon + totalGamesLost) > 0 ? (totalGamesWon / (totalGamesWon + totalGamesLost)) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #fbbf24, #f59e0b); border-radius: 3px 0 0 3px;"></div>
                                                        <div style="width: ${(totalGamesWon + totalGamesLost) > 0 ? (totalGamesLost / (totalGamesWon + totalGamesLost)) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #64748b, #475569); border-radius: 0 3px 3px 0;"></div>
                                                    </div>
                                                    <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 950; color: #fff; margin-top: 2px;">
                                                        <span style="color: #fbbf24;">${totalGamesWon} JG</span>
                                                        <span style="color: #94a3b8;">${totalGamesLost} JP</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- OFFICIAL SUMMARY STATMENT -->
                                            <div style="background: rgba(234, 179, 8, 0.05); border: 1px dashed rgba(234, 179, 8, 0.2); border-radius: 12px; padding: 6px 8px; font-size: 0.55rem; color: #e2e8f0; line-height: 1.3; text-align: center;">
                                                <span style="color: #fbbf24; font-weight: 950;"><i class="fas fa-check-double"></i> FICHA OFICIAL:</span> Clasificado <strong>Rank #1</strong> con Rango <strong>${rankBadge.label}</strong> en Barcelona.
                                            </div>
                                        </div>

                                        <!-- FOOTER STATUS -->
                                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.5rem; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 5px; position: relative; z-index: 5;">
                                            <span><i class="fas fa-shield-alt" style="color: #fbbf24;"></i> SOMOSPADEL OFFICIAL</span>
                                            <span style="animation: pulse-soft 2s infinite; color: rgba(251, 191, 36, 0.6); font-weight: 900;"><i class="fas fa-sync-alt"></i> VOLVER</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // --- 2. TRENDING PLAYERS (Next 9) ---
                const topPlayers = players.slice(1, 10); // Rest of Top 10

                if (topPlayers.length === 0) {
                    root.innerHTML = `<div style="padding:20px; color:#94a3b8; font-size:0.7rem; text-align:center;">Sincronizando ranking...</div>`;
                    return;
                }

                root.innerHTML = topPlayers.map((p, idx) => {
                    const pos = idx + 2;
                    const pts = (p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0);

                    return `
                        <div style="
                            min-width: 110px;
                            padding: 14px 10px;
                            text-align: center;
                            flex-shrink: 0;
                            background: #ffffff;
                            border-radius: 20px;
                            border: 1px solid #e2e8f0;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                            position: relative;
                            overflow: hidden;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)'">
                            <div style="position:relative; width:52px; height:52px; margin:0 auto 10px;">
                                <div style="width:100%; height:100%; border-radius:50%; border:2px solid #e2e8f0; background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#f1f5f9'}; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                                    ${!p.photo_url ? `<span style="font-weight:950; color:#0a192f; font-size:1.1rem;">${p.name.charAt(0)}</span>` : ''}
                                </div>
                                <div style="position:absolute; bottom:-5px; right:-5px; background:${pos === 2 ? '#d1d5db' : pos === 3 ? '#b45309' : '#72a800'}; color:#fff; font-size:0.5rem; font-weight:950; padding:2px 5px; border-radius:10px; border:2px solid #fff;">
                                    #${pos}
                                </div>
                            </div>
                            <div style="font-size: 0.7rem; font-weight: 950; color: #0a192f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom:4px;" title="${p.name}">${formatPlayerShortName(p.name)}</div>
                            <div style="font-size: 0.6rem; color: #72a800; font-weight: 900;">${pts} PTS</div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error("Error rendering trending players:", err);
                if (root) root.innerHTML = "⚠️ Error sync";
            }
        }

        async renderPlayerFaceoff() {
            const root = document.getElementById('player-faceoff-widget-root');
            if (!root) return;

            try {
                // 1. Get ranking players
                const players = await (window.RankingController ? window.RankingController.calculateSilently() : []);
                if (!players || players.length === 0) {
                    root.innerHTML = `<div style="padding:20px; color:#94a3b8; font-size:0.7rem; text-align:center;">Cargando enfrentamiento...</div>`;
                    return;
                }

                // 2. Identify default players
                const currentUser = (window.Store ? window.Store.getState('currentUser') : null) || window.currentUser;
                let playerA = players.find(p => p.id === (currentUser?.uid || currentUser?.id)) || players[0];
                let playerB = players[0] === playerA ? (players[1] || players[0]) : players[0]; // Default player B is MVP

                // Sort players alphabetically A-Z for the select dropdowns
                const sortedPlayers = [...players].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

                // 3. Render container structure with selects and stats
                root.innerHTML = `
                    <style>
                        .faceoff-card {
                            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                            border: 1.5px solid rgba(234, 179, 8, 0.25);
                            border-radius: 24px;
                            padding: 18px;
                            position: relative;
                            overflow: hidden;
                            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(234, 179, 8, 0.05);
                            color: white;
                            font-family: 'Outfit', 'Inter', sans-serif;
                        }
                        .faceoff-glow {
                            position: absolute; inset: 0;
                            background: radial-gradient(circle at 50% -20%, rgba(251, 191, 36, 0.1) 0%, transparent 60%);
                            pointer-events: none;
                        }
                        .faceoff-select {
                            background: rgba(255, 255, 255, 0.08);
                            border: 1px solid rgba(255, 255, 255, 0.15);
                            border-radius: 12px;
                            color: white;
                            font-size: 0.75rem;
                            font-weight: 800;
                            padding: 6px 10px;
                            width: 100%;
                            outline: none;
                            text-align: center;
                            cursor: pointer;
                        }
                        .faceoff-select option {
                            background: #0f172a;
                            color: white;
                        }
                        .faceoff-stat-row {
                            margin: 12px 0;
                        }
                        .faceoff-stat-label-container {
                            display: flex;
                            justify-content: space-between;
                            font-size: 0.65rem;
                            font-weight: 900;
                            text-transform: uppercase;
                            color: rgba(255,255,255,0.5);
                            margin-bottom: 4px;
                            letter-spacing: 0.5px;
                        }
                        .faceoff-bar-outer {
                            height: 8px;
                            background: rgba(255, 255, 255, 0.06);
                            border-radius: 4px;
                            overflow: hidden;
                            display: flex;
                            position: relative;
                        }
                        .faceoff-bar-left {
                            height: 100%;
                            background: linear-gradient(to right, #3b82f6, #60a5fa);
                            transition: width 0.5s ease-out;
                        }
                        .faceoff-bar-right {
                            height: 100%;
                            background: linear-gradient(to left, #fbbf24, #fde047);
                            transition: width 0.5s ease-out;
                            margin-left: auto;
                        }
                        .faceoff-avatar-frame {
                            width: 60px; height: 60px; border-radius: 50%;
                            border: 2px solid #fbbf24;
                            background-size: cover;
                            background-position: center;
                            display: flex; align-items: center; justify-content: center;
                            margin: 0 auto 8px;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            transition: all 0.3s;
                        }
                        .faceoff-vs {
                            font-family: 'Outfit';
                            font-size: 1.6rem;
                            font-weight: 1000;
                            color: #CCFF00;
                            text-shadow: 0 0 10px rgba(204, 255, 0, 0.4);
                            font-style: italic;
                            align-self: center;
                            text-align: center;
                        }
                        .faceoff-btn {
                            background: linear-gradient(135deg, #CCFF00 0%, #72a800 100%);
                            color: #000;
                            border: none;
                            border-radius: 14px;
                            padding: 10px 16px;
                            font-size: 0.8rem;
                            font-weight: 1000;
                            width: 100%;
                            margin-top: 14px;
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);
                            transition: all 0.2s;
                        }
                        .faceoff-btn:active {
                            transform: scale(0.97);
                        }
                        .faceoff-results {
                            margin-top: 14px;
                            background: rgba(0,0,0,0.3);
                            border: 1px solid rgba(234, 179, 8, 0.25);
                            border-radius: 14px;
                            padding: 12px;
                            display: none;
                            animation: fadeIn 0.4s ease-out forwards;
                        }
                    </style>

                    <div class="faceoff-card">
                        <div class="faceoff-glow"></div>
                        
                        <!-- TITLE HEADER -->
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
                            <span style="font-size:0.75rem; font-weight:1000; letter-spacing:1px; color:#CCFF00; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-satellite-dish" style="animation: pulseRadar 1.5s infinite;"></i> ESPN FACEOFF: SIMULADOR 1VS1
                            </span>
                            <span style="font-size:0.55rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-weight:900;">NODO BCN</span>
                        </div>

                        <!-- VS SELECTOR GRID -->
                        <div style="display:grid; grid-template-columns: 1fr 50px 1fr; gap:10px; margin-bottom:16px;">
                            <!-- Player A Select -->
                            <div style="text-align:center;">
                                <div id="faceoff-avatar-a" class="faceoff-avatar-frame" style="background-image: ${playerA.photo_url ? `url('${playerA.photo_url}')` : 'none'}; background-color: #374151;">
                                    ${!playerA.photo_url ? `<span style="font-size:1.5rem; font-weight:1000; color:#fbbf24;">${playerA.name.charAt(0)}</span>` : ''}
                                </div>
                                <select id="faceoff-select-a" class="faceoff-select">
                                    ${sortedPlayers.map(p => `<option value="${p.id}" ${p.id === playerA.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <!-- VS Badge -->
                            <div class="faceoff-vs">VS</div>

                            <!-- Player B Select -->
                            <div style="text-align:center;">
                                <div id="faceoff-avatar-b" class="faceoff-avatar-frame" style="background-image: ${playerB.photo_url ? `url('${playerB.photo_url}')` : 'none'}; background-color: #374151;">
                                    ${!playerB.photo_url ? `<span style="font-size:1.5rem; font-weight:1000; color:#fbbf24;">${playerB.name.charAt(0)}</span>` : ''}
                                </div>
                                <select id="faceoff-select-b" class="faceoff-select">
                                    ${sortedPlayers.map(p => `<option value="${p.id}" ${p.id === playerB.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- COMPARATIVE STATS BARS -->
                        <div id="faceoff-stats-container">
                            <!-- STAT: NIVEL -->
                            <div class="faceoff-stat-row">
                                <div class="faceoff-stat-label-container">
                                    <span id="faceoff-val-a-nivel">${parseFloat(playerA.level || 3.5).toFixed(2)} NIV</span>
                                    <span>NIVEL DE JUEGO</span>
                                    <span id="faceoff-val-b-nivel">${parseFloat(playerB.level || 3.5).toFixed(2)} NIV</span>
                                </div>
                                <div class="faceoff-bar-outer">
                                    <div id="faceoff-bar-a-nivel" class="faceoff-bar-left"></div>
                                    <div id="faceoff-bar-b-nivel" class="faceoff-bar-right"></div>
                                </div>
                            </div>

                            <!-- STAT: PUNTOS -->
                            <div class="faceoff-stat-row">
                                <div class="faceoff-stat-label-container">
                                    <span id="faceoff-val-a-puntos">${playerA.points || 0} PTS</span>
                                    <span>PUNTOS DE RANKING</span>
                                    <span id="faceoff-val-b-puntos">${playerB.points || 0} PTS</span>
                                </div>
                                <div class="faceoff-bar-outer">
                                    <div id="faceoff-bar-a-puntos" class="faceoff-bar-left"></div>
                                    <div id="faceoff-bar-b-puntos" class="faceoff-bar-right"></div>
                                </div>
                            </div>

                            <!-- STAT: RACHA -->
                            <div class="faceoff-stat-row">
                                <div class="faceoff-stat-label-container">
                                    <span id="faceoff-val-a-racha">${playerA.streak || 0} VIC</span>
                                    <span>RACHA ACTUAL</span>
                                    <span id="faceoff-val-b-racha">${playerB.streak || 0} VIC</span>
                                </div>
                                <div class="faceoff-bar-outer">
                                    <div id="faceoff-bar-a-racha" class="faceoff-bar-left"></div>
                                    <div id="faceoff-bar-b-racha" class="faceoff-bar-right"></div>
                                </div>
                            </div>
                        </div>

                        <!-- ACTION BUTTON -->
                        <button id="faceoff-btn-simulate" class="faceoff-btn">⚡ SIMULAR DUELO TÁCTICO</button>

                        <!-- SIMULATION RESULTS -->
                        <div id="faceoff-results-box" class="faceoff-results">
                            <!-- Winner & Percentages -->
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <div style="font-size:0.8rem; font-weight:1000; color:#CCFF00;"><i class="fas fa-chart-line"></i> PREDICCIÓN DE VICTORIA</div>
                                <div id="faceoff-pct-winner" style="font-size:1.1rem; font-weight:1000; color:white;">--%</div>
                            </div>
                            <!-- Winner Name banner -->
                            <div id="faceoff-winner-banner" style="background:rgba(204,255,0,0.15); border:1px solid #CCFF00; border-radius:10px; padding:6px 12px; font-weight:950; font-size:0.8rem; color:white; text-align:center; margin-bottom:10px; text-transform:uppercase;">
                                GANADOR ESTIMADO: --
                            </div>
                            <!-- Analysis Text -->
                            <div id="faceoff-analysis-text" style="font-size:0.68rem; color:rgba(255,255,255,0.9); line-height:1.4; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                                Simulando estadísticas avanzadas...
                            </div>
                        </div>
                    </div>
                `;

                // 4. Init interactive logic
                this._initFaceoffListeners(players, playerA, playerB);

            } catch (err) {
                console.error("Error rendering Player Faceoff:", err);
                root.innerHTML = `<div style="padding:20px; color:#ef4444; font-size:0.7rem; text-align:center;">⚠️ Error al iniciar Faceoff</div>`;
            }
        }

        _initFaceoffListeners(players, pA, pB) {
            const selectA = document.getElementById('faceoff-select-a');
            const selectB = document.getElementById('faceoff-select-b');
            const btnSim = document.getElementById('faceoff-btn-simulate');
            const resBox = document.getElementById('faceoff-results-box');

            if (!selectA || !selectB || !btnSim || !resBox) return;

            let activeA = pA;
            let activeB = pB;

            const updateStatsUI = () => {
                // Hide simulation box when choices change
                resBox.style.display = 'none';
                btnSim.innerHTML = '⚡ SIMULAR DUELO TÁCTICO';
                btnSim.disabled = false;

                // Update Photos
                const avatarA = document.getElementById('faceoff-avatar-a');
                if (avatarA) {
                    avatarA.style.backgroundImage = activeA.photo_url ? `url('${activeA.photo_url}')` : 'none';
                    avatarA.innerHTML = activeA.photo_url ? '' : `<span style="font-size:1.5rem; font-weight:1000; color:#fbbf24;">${activeA.name.charAt(0).toUpperCase()}</span>`;
                }

                const avatarB = document.getElementById('faceoff-avatar-b');
                if (avatarB) {
                    avatarB.style.backgroundImage = activeB.photo_url ? `url('${activeB.photo_url}')` : 'none';
                    avatarB.innerHTML = activeB.photo_url ? '' : `<span style="font-size:1.5rem; font-weight:1000; color:#fbbf24;">${activeB.name.charAt(0).toUpperCase()}</span>`;
                }

                // Precalculate stats (aggregated from Stats nested structure)
                const ptsA = (activeA.stats?.americanas?.points || 0) + (activeA.stats?.entrenos?.points || 0);
                const ptsB = (activeB.stats?.americanas?.points || 0) + (activeB.stats?.entrenos?.points || 0);

                const wonA = (activeA.stats?.americanas?.won || 0) + (activeA.stats?.entrenos?.won || 0);
                const wonB = (activeB.stats?.americanas?.won || 0) + (activeB.stats?.entrenos?.won || 0);

                const rchA = wonA > 0 ? (1 + ((activeA.id ? String(activeA.id).charCodeAt(0) : 0) % Math.min(wonA, 4))) : 0;
                const rchB = wonB > 0 ? (1 + ((activeB.id ? String(activeB.id).charCodeAt(0) : 0) % Math.min(wonB, 4))) : 0;

                // Update text values
                const valANivel = document.getElementById('faceoff-val-a-nivel');
                const valBNivel = document.getElementById('faceoff-val-b-nivel');
                if (valANivel) valANivel.innerText = `${parseFloat(activeA.level || 3.5).toFixed(2)} NIV`;
                if (valBNivel) valBNivel.innerText = `${parseFloat(activeB.level || 3.5).toFixed(2)} NIV`;

                const valAPuntos = document.getElementById('faceoff-val-a-puntos');
                const valBPuntos = document.getElementById('faceoff-val-b-puntos');
                if (valAPuntos) valAPuntos.innerText = `${ptsA} PTS`;
                if (valBPuntos) valBPuntos.innerText = `${ptsB} PTS`;

                const valARacha = document.getElementById('faceoff-val-a-racha');
                const valBRacha = document.getElementById('faceoff-val-b-racha');
                if (valARacha) valARacha.innerText = `${rchA} VIC`;
                if (valBRacha) valBRacha.innerText = `${rchB} VIC`;

                // Calculate ratios to split 100% between left and right bars
                const lvlA = parseFloat(activeA.level || 3.5);
                const lvlB = parseFloat(activeB.level || 3.5);
                const lvlSum = lvlA + lvlB;
                const lvlPctA = (lvlA / lvlSum) * 100;
                const barANivel = document.getElementById('faceoff-bar-a-nivel');
                const barBNivel = document.getElementById('faceoff-bar-b-nivel');
                if (barANivel) barANivel.style.width = `${lvlPctA}%`;
                if (barBNivel) barBNivel.style.width = `${100 - lvlPctA}%`;

                const ptsSum = (ptsA + ptsB) || 1;
                const ptsPctA = (ptsA / ptsSum) * 100;
                const barAPuntos = document.getElementById('faceoff-bar-a-puntos');
                const barBPuntos = document.getElementById('faceoff-bar-b-puntos');
                if (barAPuntos) barAPuntos.style.width = `${ptsPctA}%`;
                if (barBPuntos) barBPuntos.style.width = `${100 - ptsPctA}%`;

                const rchSum = (rchA + rchB) || 1;
                const rchPctA = rchSum === 1 && rchA === 0 && rchB === 0 ? 50 : (rchA / rchSum) * 100;
                const barARacha = document.getElementById('faceoff-bar-a-racha');
                const barBRacha = document.getElementById('faceoff-bar-b-racha');
                if (barARacha) barARacha.style.width = `${rchPctA}%`;
                if (barBRacha) barBRacha.style.width = `${100 - rchPctA}%`;
            };

            // Initial bars setup
            setTimeout(updateStatsUI, 200);

            // Select change handlers
            selectA.addEventListener('change', (e) => {
                const selVal = e.target.value;
                activeA = players.find(p => p.id === selVal) || activeA;
                updateStatsUI();
            });

            selectB.addEventListener('change', (e) => {
                const selVal = e.target.value;
                activeB = players.find(p => p.id === selVal) || activeB;
                updateStatsUI();
            });

            // Simulation handler
            btnSim.addEventListener('click', () => {
                if (activeA.id === activeB.id) {
                    alert("Selecciona dos jugadores diferentes para simular.");
                    return;
                }

                btnSim.disabled = true;
                btnSim.innerHTML = `<i class="fas fa-spinner fa-spin"></i> PROCESANDO MODELO MATEMÁTICO...`;
                resBox.style.display = 'none';

                // Real-time animation wait (simulating TV broadcast computation)
                setTimeout(() => {
                    btnSim.innerHTML = '⚡ DUELO CALCULADO';

                    // Precalculate streaks for simulation
                    const wonA = (activeA.stats?.americanas?.won || 0) + (activeA.stats?.entrenos?.won || 0);
                    const wonB = (activeB.stats?.americanas?.won || 0) + (activeB.stats?.entrenos?.won || 0);
                    const rchA = wonA > 0 ? (1 + ((activeA.id ? String(activeA.id).charCodeAt(0) : 0) % Math.min(wonA, 4))) : 0;
                    const rchB = wonB > 0 ? (1 + ((activeB.id ? String(activeB.id).charCodeAt(0) : 0) % Math.min(wonB, 4))) : 0;

                    // Algorithmic probabilities:
                    const valA = parseFloat(activeA.level || 3.5) + (rchA * 0.1);
                    const valB = parseFloat(activeB.level || 3.5) + (rchB * 0.1);
                    
                    const totalVal = valA + valB;
                    let probA = Math.round((valA / totalVal) * 100);
                    probA = Math.min(90, Math.max(10, probA));
                    const probB = 100 - probA;

                    let winner = probA > probB ? activeA : activeB;
                    let loser = probA > probB ? activeB : activeA;
                    let winPct = probA > probB ? probA : probB;

                    let winnerStreak = winner === activeA ? rchA : rchB;
                    let loserStreak = winner === activeA ? rchB : rchA;

                    // Text Generation
                    let clave = '';
                    const levelDiff = Math.abs(parseFloat(activeA.level || 3.5) - parseFloat(activeB.level || 3.5));
                    
                    if (winnerStreak > 3 && loserStreak < 2) {
                        clave = `La racha destructiva de ${formatPlayerShortName(winner.name)} (${winnerStreak} victorias seguidas) inclina severamente la balanza mental. La solidez en los tie-breaks de la pista central será determinante.`;
                    } else if (levelDiff > 0.4) {
                        clave = `Diferencia de nivel técnico marcada. La versatilidad táctica y posicionamiento de ${formatPlayerShortName(winner.name)} forzará errores no forzados en el juego rápido de fondo de su rival.`;
                    } else {
                        clave = `Duelo de titanes sumamente ajustado. La clave del partido radicará en quién domine la red en las transiciones de defensa a ataque y minimice los fallos en remates globados.`;
                    }

                    const pctWinner = document.getElementById('faceoff-pct-winner');
                    const winnerBanner = document.getElementById('faceoff-winner-banner');
                    const analysisText = document.getElementById('faceoff-analysis-text');

                    if (pctWinner) pctWinner.innerText = `${winPct}%`;
                    if (winnerBanner) winnerBanner.innerText = `PROBABILIDAD A FAVOR DE: ${winner.name.toUpperCase()}`;
                    if (analysisText) analysisText.innerText = clave;
                    resBox.style.display = 'block';

                }, 1200);
            });
        }

        _startActiveMatchListener(context) {
            if (this.matchUnsub) this.matchUnsub();

            const collectionName = context.activeEvent?.type === 'entreno' ? 'entrenos_matches' : 'matches';
            console.log(`📡 [Telemetry] Listening to active match: ${context.activeMatch.id}`);

            this.matchUnsub = window.db.collection(collectionName).doc(context.activeMatch.id)
                .onSnapshot(doc => {
                    if (!doc.exists) return;
                    const updatedMatch = doc.data();

                    if (JSON.stringify(updatedMatch.score) !== JSON.stringify(context.activeMatch.score) ||
                        updatedMatch.status !== context.activeMatch.status) {

                        console.log("⚡ [Telemetry] Live update received for active match");
                        context.activeMatch = { ...context.activeMatch, ...updatedMatch };

                        const heroRoot = document.getElementById('hero-card-root');
                        if (heroRoot && window.HeroCard) {
                            heroRoot.innerHTML = window.HeroCard.render(context);
                        }
                    }
                }, err => {
                    console.error("🛑 [Telemetry] Active match listener failed:", err);
                });
        }

        /**
         * 2026 UPDATE: Show a one-time tip to let the user know about the new Profile capabilities.
         */
        showChatInfo() {
            if (window.PremiumModal) {
                window.PremiumModal.alert({
                    title: '💡 NAVEGACIÓN GESTUAL',
                    message: 'Desliza lateralmente en las historias para navegar rápido entre ellas.<br>Toca los bordes de la pantalla para avanzar o retroceder.',
                    type: 'info'
                });
            } else {
                alert("💡 TIP: Desliza las historias para navegar.");
            }
        }



        // --- PHASE 1 HELPERS ---

        async renderActivityFeed(targetId = null) {
            try {
                if (!document.getElementById('activity-feed-styles')) {
                    const style = document.createElement('style');
                    style.id = 'activity-feed-styles';
                    style.textContent = `
                        @keyframes timelinePulse {
                            0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.4); }
                            70% { box-shadow: 0 0 0 10px rgba(0, 227, 109, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); }
                        }
                        @keyframes showtimeSlide {
                            0% { opacity: 0; transform: translateX(-30px) skewX(-15deg) scale(0.8); filter: brightness(3) blur(10px); }
                            70% { transform: translateX(5px) skewX(0deg) scale(1.05); filter: brightness(1.2) blur(0px); }
                            100% { opacity: 1; transform: translateX(0) skewX(0deg) scale(1); filter: brightness(1) blur(0px); }
                        }
                        @keyframes glint {
                            0% { left: -100%; }
                            20% { left: 100%; }
                            100% { left: 100%; }
                        }
                        .activity-timeline-line {
                            position: absolute;
                            left: 24px;
                            top: 10px;
                            bottom: 10px;
                            width: 2px;
                            background: linear-gradient(to bottom, transparent, rgba(0,227,109,0.3), transparent);
                        }
                        .activity-glass-card {
                            background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 12px;
                            padding: 16px 18px 16px 50px;
                            position: relative;
                            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                            cursor: pointer;
                            overflow: hidden;
                            margin-bottom: 2px;
                        }
                        .activity-glass-card::before {
                            content: '';
                            position: absolute;
                            top: 0; left: -100%;
                            width: 100%; height: 100%;
                            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                            animation: glint 5s infinite linear;
                        }
                        /* Look "TV Show" Scanlines */
                        .activity-glass-card::after {
                            content: '';
                            position: absolute;
                            inset: 0;
                            background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 2px);
                            pointer-events: none;
                        }
                        .activity-glass-card:hover {
                            background: rgba(255, 255, 255, 0.12);
                            transform: scale(1.03) translateX(10px) rotate(-0.5deg);
                            border-color: rgba(204, 255, 0, 0.5);
                            box-shadow: -10px 10px 30px rgba(0,0,0,0.5);
                        }
                        .activity-dot {
                            position: absolute;
                            left: 17px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 14px;
                            height: 14px;
                            border-radius: 4px;
                            z-index: 2;
                            border: 2px solid #000;
                            box-shadow: 0 0 15px currentColor;
                        }
                        .activity-impact-badge {
                            position: absolute;
                            top: 0; left: 0;
                            width: 4px; height: 100%;
                            background: currentColor;
                            box-shadow: 0 0 15px currentColor;
                        }
                    `;
                    document.head.appendChild(style);
                }

                const activities = [];
                const [registrations, urgentAlerts, rankingChanges] = await Promise.all([
                    this.getRecentRegistrations(120),
                    this.getUrgentAlerts(),
                    this.getRankingChanges()
                ]);

                // 2026 UPDATE: Inyectar notificaciones reales (Firestore + Chat)
                const realNotifications = window.NotificationService ? window.NotificationService.getMergedNotifications() : [];
                realNotifications.forEach(notif => {
                    activities.push({
                        type: notif.isChat ? 'chat' : 'notification',
                        icon: notif.isChat ? '💬' : '🔔',
                        title: notif.title || 'Notificación',
                        desc: notif.body || '',
                        time: this.formatRelativeTime(notif.timestamp),
                        color: notif.isChat ? '#CCFF00' : '#38bdf8',
                        timestamp: notif.timestamp,
                        score: 30 // Prioridad alta para notificaciones personales
                    });
                });

                registrations.forEach(reg => {
                    let catColor = '#00E36D'; // Default Green (Entrenos/Other)
                    const lowerName = reg.eventName.toLowerCase();

                    if (lowerName.includes('femenin') || lowerName.includes('chicas') || lowerName.includes('female')) {
                        catColor = '#FF2D55'; // Pink
                    } else if (lowerName.includes('mixt') || lowerName.includes('mix')) {
                        catColor = '#FFD700'; // Yellow
                    } else if (lowerName.includes('masculin') || lowerName.includes('chicos') || lowerName.includes('male')) {
                        catColor = '#00C4FF'; // Blue
                    }

                    // Lógica de colores de equipo idéntica a EventsController_V6
                    const t = reg.playerTeam ? reg.playerTeam.toUpperCase() : '';
                    let teamColor = '#38bdf8'; // Default Cyan (3º)
                    if (t.includes('4º')) teamColor = '#84cc16'; // Neon Green
                    if (t.includes('3º')) teamColor = '#38bdf8'; // Cyan
                    if (t.includes('2º')) teamColor = '#f59e0b'; // Gold/Orange
                    if (t.includes('MIXTO')) teamColor = '#ef4444'; // Red

                    activities.push({
                        type: 'registration',
                        icon: '🎾',
                        title: reg.playerName,
                        desc: `Se ha unido a <span style="color:${catColor}; font-weight:800;">${reg.eventName}</span>${reg.playerTeam ? `<br><span style="color:${teamColor}; font-size:0.65rem; font-weight:950; letter-spacing:1px; text-shadow: 0 0 8px ${teamColor}60; border-bottom: 2px solid ${teamColor}; padding-bottom: 1px;">${t}</span>` : ''}`,
                        time: this.formatRelativeTime(reg.timestamp),
                        color: catColor,
                        timestamp: reg.timestamp,
                        score: 0
                    });
                });

                urgentAlerts.forEach(alert => {
                    activities.push({
                        type: 'urgent',
                        icon: '🚨',
                        title: '¡ÚLTIMA HORA!',
                        desc: alert.title,
                        time: 'ahora',
                        color: '#ef4444',
                        timestamp: alert.timestamp,
                        priority: 'critical',
                        score: 0,
                        action: 'Entrenos'
                    });
                });

                rankingChanges.forEach(change => {
                    activities.push({
                        type: 'ranking',
                        icon: change.position === 1 ? '👑' : '📈',
                        title: change.playerName,
                        desc: `${change.position === 1 ? '¡NUEVO LÍDER!' : `Entra en el TOP ${change.position}`} del ranking`,
                        time: this.formatRelativeTime(change.timestamp),
                        color: '#f59e0b',
                        timestamp: change.timestamp,
                        score: 0
                    });
                });

                activities.sort((a, b) => {
                    const timeA = this._getTimestampValue(a.timestamp);
                    const timeB = this._getTimestampValue(b.timestamp);
                    return timeB - timeA;
                });
                const top6 = activities.slice(0, 6);

                if (top6.length === 0) {
                    return `
                        <div style="text-align: center; padding: 40px 20px;">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                <i class="fas fa-radar" style="color:rgba(255,255,255,0.2); font-size: 1.5rem; animation: pulseGlow 2s infinite;"></i>
                            </div>
                            <div style="color: rgba(255,255,255,0.3); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;">RADAR BUSCANDO ACTIVIDAD...</div>
                        </div>
                    `;
                }

                const alwaysVisible = top6.slice(0, 2);
                const extended = top6.slice(2);

                return `
                    <div style="position: relative;">
                        <div class="activity-timeline-line"></div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${alwaysVisible.map((activity, index) => `
                                <div class="activity-glass-card" 
                                     style="animation: showtimeSlide 0.6s both ${index * 0.12}s; color: ${activity.color};"
                                     onclick="${activity.action ? `window.Router.navigate('${activity.action.toLowerCase()}')` : ''}">
                                    
                                    <div class="activity-impact-badge"></div>
                                    <div class="activity-dot" style="background: ${activity.color}; ${index === 0 ? 'animation: timelinePulse 1.5s infinite;' : ''}"></div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; position: relative; z-index: 1;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                <span style="font-size: 0.95rem; font-weight: 1000; color: white; text-transform: uppercase; letter-spacing: -0.5px; font-style: italic;">${activity.title}</span>
                                                ${activity.priority === 'critical' ? `<span style="background: #ef4444; color: white; font-size: 0.55rem; font-weight: 1000; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; animation: pulse 1s infinite; box-shadow: 0 0 15px #ef4444;">BREAKING</span>` : ''}
                                            </div>
                                            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700; line-height: 1.5; letter-spacing: 0.2px;">${activity.desc}</div>
                                        </div>
                                        <div style="text-align: right; min-width: 70px;">
                                            <div style="font-size: 0.6rem; color: ${activity.color}; font-weight: 1000; text-transform: uppercase; opacity: 0.8; letter-spacing: 1px;">${activity.time}</div>
                                            ${activity.action ? `
                                                <div style="margin-top: 8px; font-size: 0.55rem; font-weight: 1000; color: #000; background: ${activity.color}; padding: 3px 10px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px ${activity.color}40; transform: skewX(-10deg);">
                                                    ${activity.action.toUpperCase()}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}

                            ${extended.length > 0 ? `
                            <div id="activity-extended-container" style="display: none; flex-direction: column; gap: 12px;">
                                ${extended.map((activity, index) => `
                                    <div class="activity-glass-card" 
                                         style="color: ${activity.color};"
                                         onclick="${activity.action ? `window.Router.navigate('${activity.action.toLowerCase()}')` : ''}">
                                        
                                        <div class="activity-impact-badge"></div>
                                        <div class="activity-dot" style="background: ${activity.color};"></div>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; position: relative; z-index: 1;">
                                            <div style="flex: 1;">
                                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                    <span style="font-size: 0.95rem; font-weight: 1000; color: white; text-transform: uppercase; letter-spacing: -0.5px; font-style: italic;">${activity.title}</span>
                                                    ${activity.priority === 'critical' ? `<span style="background: #ef4444; color: white; font-size: 0.55rem; font-weight: 1000; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; animation: pulse 1s infinite; box-shadow: 0 0 15px #ef4444;">BREAKING</span>` : ''}
                                                </div>
                                                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700; line-height: 1.5; letter-spacing: 0.2px;">${activity.desc}</div>
                                            </div>
                                            <div style="text-align: right; min-width: 70px;">
                                                <div style="font-size: 0.6rem; color: ${activity.color}; font-weight: 1000; text-transform: uppercase; opacity: 0.8; letter-spacing: 1px;">${activity.time}</div>
                                                ${activity.action ? `
                                                    <div style="margin-top: 8px; font-size: 0.55rem; font-weight: 1000; color: #000; background: ${activity.color}; padding: 3px 10px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px ${activity.color}40; transform: skewX(-10deg);">
                                                        ${activity.action.toUpperCase()}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>

                        ${extended.length > 0 ? `
                        <div style="text-align: center; margin-top: 15px;">
                            <button onclick="event.stopPropagation(); window.DashboardView.toggleActivityFeed()" 
                                    id="activity-toggle-btn" 
                                    style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white; border-radius: 14px; padding: 10px 24px; font-size: 0.75rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                                Ver más <i class="fas fa-chevron-down" id="activity-toggle-icon"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `;
            } catch (e) {
                console.error('Activity Feed error:', e);
                return '';
            }
        }

        async getRecentRegistrations(hoursAgo = 48) {
            try {
                const cutoff = Date.now() - (hoursAgo * 60 * 60 * 1000);
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const registrations = [];

                events.forEach(event => {
                    const players = event.players || event.registeredPlayers || [];
                    if (players.length > 0) {
                        players.forEach(p => {
                            // Usar el joinedAt real si existe, si no, ignorar registros antiguos o sin fecha
                            const joinDate = p.joinedAt ? new Date(p.joinedAt).getTime() : 0;

                            if (joinDate > cutoff) {
                                registrations.push({
                                    type: 'registration',
                                    playerName: p.name || 'Jugador',
                                    playerTeam: Array.isArray(p.team_somospadel) ? p.team_somospadel[0] : (p.team_somospadel || ''),
                                    eventName: event.name,
                                    timestamp: joinDate,
                                    eventId: event.id
                                });
                            }
                        });
                    }
                });

                return registrations;
            } catch (e) {
                console.error('Error getting registrations:', e);
                return [];
            }
        }

        async getUrgentAlerts() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const alerts = [];

                events.forEach(event => {
                    if (!['open', 'upcoming', 'scheduled'].includes(event.status)) return;
                    const players = (event.players || event.registeredPlayers || []).length;
                    const maxPlayers = (event.max_courts || 0) * 4;
                    const spotsLeft = maxPlayers - players;

                    if (spotsLeft > 0 && spotsLeft <= 2 && maxPlayers > 0) {
                        alerts.push({
                            type: 'urgent',
                            title: `¡ÚLTIMA${spotsLeft === 1 ? '' : 'S'} ${spotsLeft} PLAZA${spotsLeft === 1 ? '' : 'S'}! ${event.name}`,
                            eventName: event.name,
                            spotsLeft,
                            timestamp: Date.now(),
                            priority: 'critical'
                        });
                    }
                });

                return alerts;
            } catch (e) {
                console.error('Error getting urgent alerts:', e);
                return [];
            }
        }

        async getRankingChanges() {
            try {
                if (!window.RankingController) return [];
                const players = await window.RankingController.calculateSilently();
                const changes = [];

                players.slice(0, 3).forEach((player, index) => {
                    const points = player.stats?.americanas?.points || 0;
                    if (points > 0) {
                        changes.push({
                            type: 'ranking',
                            playerName: player.name,
                            position: index + 1,
                            points: points,
                            timestamp: Date.now() - Math.random() * 7200000
                        });
                    }
                });
                return changes;
            } catch (e) {
                console.error('Error getting ranking changes:', e);
                return [];
            }
        }

        calculateActivityScore(activity) {
            let score = 0;
            const minutesAgo = (Date.now() - activity.timestamp) / 60000;
            score += Math.max(0, 100 - minutesAgo);

            const priorityScores = {
                'urgent': 100,
                'registration': 70,
                'ranking': 50,
                'match': 30,
                'event': 20
            };
            score += priorityScores[activity.type] || 0;
            if (activity.priority === 'critical') score += 50;
            return score;
        }

        formatDateTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${hours}:${minutes} ${day}/${month}`;
        }

        formatRelativeTime(timestamp) {
            if (!timestamp) return '';
            return this.formatDateTime(timestamp);
        }

        getPlayerName(playerId) {
            if (typeof playerId === 'string') return 'Alguien';
            if (playerId && playerId.name) return formatPlayerShortName(playerId.name);
            return 'Alguien';
        }

        async renderLiveActivity() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const urgentAm = events.find(am => {
                    const pCount = (am.players || am.registeredPlayers || []).length;
                    const maxP = (am.max_courts || 0) * 4;
                    const spots = maxP - pCount;
                    return maxP > 0 && spots > 0 && spots <= 4;
                }) || events[0];

                if (urgentAm) {
                    const players = urgentAm.players || urgentAm.registeredPlayers || [];
                    const pCount = players.length;
                    const maxP = (urgentAm.max_courts || 0) * 4;
                    const spots = Math.max(0, maxP - pCount);
                    const isFull = spots === 0;

                    const cardBg = isFull ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
                    const btnText = isFull ? 'VER LISTA DE ESPERA' : 'APUNTARME AHORA';
                    const btnBg = isFull ? '#94a3b8' : '#00E36D';
                    const statusDesc = isFull ? '¡Pista completa! Avisaremos bajas.' : `¡Solo <b>${spots} plazas</b>! Se llenará pronto.`;
                    const navigateAction = "window.Router.navigate('entrenos'); setTimeout(() => { if(window.EventsController) window.EventsController.filterByType('entreno'); }, 200);";

                    let html = `
                        <style>
                            @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                            .ticker-marquee-container { overflow: hidden; white-space: nowrap; position: relative; mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
                            .ticker-marquee-content { display: inline-block; animation: marquee-scroll 25s linear infinite; white-space: nowrap; }
                            .ticker-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); padding: 6px 14px; border-radius: 100px; font-size: 0.75rem; color: white; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.1); margin-right: 12px; }
                        </style>
                        <div class="smart-hero-card" onclick="${navigateAction}" style="background: ${cardBg}; border-radius: 16px; padding: 20px; color: white; position: relative; overflow: hidden; margin-bottom: 5px; cursor: pointer;">
                            <div style="position: absolute; top: -20px; right: -20px; font-size: 5rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"><i class="fas fa-star"></i></div>
                            <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; padding: 4px 12px; border-radius: 100px; font-size: 0.6rem; font-weight: 900; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">RECOMENDACIÓN</div>
                            <div style="font-size: 1.4rem; font-weight: 900; margin-bottom: 5px;">${urgentAm.name}</div>
                            <p style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 15px;">${statusDesc}</p>
                            <div style="background: ${btnBg}; color: black; padding: 12px; border-radius: 12px; text-align: center; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                ${btnText} <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    `;

                    const hypeMessages = [`🔥 <b>${pCount + 3} personas</b> viéndolo`, `⚡ <b>Alta Demanda</b>: Se llenará hoy`, `🏆 <b>Nivel Garantizado</b>`];
                    if (players.length > 0) {
                        const randomPlayer = players[Math.floor(Math.random() * players.length)];
                        const pName = formatPlayerShortName(randomPlayer.name || 'Jugador');
                        hypeMessages.unshift(`🚀 <b>${pName}</b> acaba de unirse`);
                    }

                    const tickerItems = [...hypeMessages, ...hypeMessages].map(msg => `<div class="ticker-tag"><div style="width: 6px; height: 6px; border-radius: 50%; background: #00E36D; box-shadow: 0 0 5px #00E36D;"></div>${msg}</div>`).join('');
                    html += `<div class="ticker-marquee-container" style="padding: 5px 0;"><div class="ticker-marquee-content">${tickerItems}</div></div>`;
                    return html;
                }
                return '';
            } catch (e) { return ''; }
        }

        async showChatInfo() {
            const modalId = 'chat-info-modal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 9999999; opacity: 0; transition: opacity 0.3s ease;`;
                modal.onclick = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
                document.body.appendChild(modal);
            }

            const guideItems = [
                { title: 'HISTORIAS LIVE', icon: 'fa-play-circle', color: '#fb7185', desc: 'Sigue la actualidad del club al estilo Instagram. Pulsa derecha para avanzar, izquierda para volver o mantén para pausar.' },
                { title: 'RANKING GLOBAL', icon: 'fa-trophy', color: '#CCFF00', desc: 'Suma puntos en Americanas y Entrenos. El sistema recalcula tu nivel dinámicamente según tus victorias.' },
                { title: 'METEOROLOGÍA', icon: 'fa-cloud-sun', color: '#0ea5e9', desc: 'Análisis en tiempo real de temperatura y humedad. Te indicamos la velocidad de la bola y el agarre de pista óptimo.' },
                { title: 'NOTIFICACIONES PUSH', icon: 'fa-bell', color: '#fbbf24', desc: 'Recibe avisos instantáneos cuando se abran inscripciones o cuando tu partido esté listo para empezar.' },
                { title: 'APP MULTI-MODO', icon: 'fa-layer-group', color: '#a855f7', desc: 'Gestiona Americanas, Entrenos, Clases y Pozo desde un solo lugar con lógica de ascensos automáticos.' },
                { title: 'PILOTO AUTOMÁTICO', icon: 'fa-robot', color: '#34d399', desc: 'El sistema genera cruces 4h antes del evento y notifica a los jugadores para que todo fluya sin esperas.' }
            ];

            modal.innerHTML = `
                <div style="background: #0a0a0b; border-radius: 32px; padding: 0; width: 92%; max-width: 480px; position: relative; box-shadow: 0 0 60px rgba(204,255,0,0.15); border: 1px solid rgba(255,255,255,0.1); animation: modalIn 0.5s cubic-bezier(0.19, 1, 0.22, 1); max-height: 85vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div style="padding: 30px 24px 20px; background: linear-gradient(180deg, rgba(204,255,0,0.05) 0%, transparent 100%); border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <div style="width: 50px; height: 50px; background: #CCFF00; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 0 20px rgba(204,255,0,0.3);">
                            <i class="fas fa-book-open" style="color: black; font-size: 1.4rem;"></i>
                        </div>
                        <h3 style="margin: 0 0 4px 0; color: #fff; font-weight: 950; font-size: 1.5rem; letter-spacing: -0.5px;">GUÍA <span style="color:#CCFF00">SMART</span> JUGADOR</h3>
                        <p style="color: rgba(255,255,255,0.4); font-size: 0.65rem; margin: 0; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Manual de Experiencia SomosPadel</p>
                    </div>

                    <!-- Scrollable Content -->
                    <div style="flex: 1; overflow-y: auto; padding: 20px; padding-right: 15px;">
                        <div style="display: grid; gap: 15px;">
                            ${guideItems.map((item, i) => `
                                <div style="display: flex; gap: 16px; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); animation: itemFadeIn 0.4s both ${i * 0.1}s;">
                                    <div style="width: 44px; height: 44px; background: ${item.color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${item.color}40;">
                                        <i class="fas ${item.icon}" style="color: ${item.color}; font-size: 1.1rem;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="color: white; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.3px;">${item.title}</div>
                                        <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600; line-height: 1.5;">${item.desc}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 20px; background: #0a0a0b;">
                        <button style="width: 100%; background: #CCFF00; color: #000; border: none; height: 58px; border-radius: 18px; font-weight: 950; font-size: 0.95rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 25px rgba(204,255,0,0.2);" onclick="this.closest('#chat-info-modal').click()">TENGO EL CONTROL</button>
                    </div>
                </div>
                <style> 
                    @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } } 
                    @keyframes itemFadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                    #chat-info-modal::-webkit-scrollbar { width: 5px; }
                    #chat-info-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                </style>
            `;
            setTimeout(() => modal.style.opacity = '1', 10);
        }


        toggleTacticalHUD() {
            const grip = document.getElementById('tactical-hud-grip');
            const bounce = document.getElementById('tactical-hud-bounce');
            if (grip && bounce) {
                const isVisible = grip.style.display === 'block';
                grip.style.display = isVisible ? 'none' : 'block';
                bounce.style.display = isVisible ? 'none' : 'block';
            }
        }

        /**
         * Cleans up all active listeners and intervals for the Dashboard.
         * Crucial for Point 2 of the Audit: Preventing Memory Leaks.
         */
        destroy() {
            console.log("🧹 [DashboardView] Cleaning up resources...");
            if (this.matchUnsub) {
                this.matchUnsub();
                this.matchUnsub = null;
            }
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            if (this.unsubDashboard) {
                this.unsubDashboard();
                this.unsubDashboard = null;
            }
            if (this.unsubUser) {
                this.unsubUser();
                this.unsubUser = null;
            }
            if (window.OpenMatchesWidget && typeof window.OpenMatchesWidget.destroy === 'function') {
                window.OpenMatchesWidget.destroy();
            }
        }
    }

    window.DashboardView = new DashboardView();

    /**
     * 🖼️ Lightbox Oficial de Temporada 2027: Cartel SomosPadel
     */
    window.openSeasonFlyerModal = function() {
        let overlay = document.getElementById('sp-season-flyer-lightbox');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sp-season-flyer-lightbox';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(8, 12, 22, 0.88);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                opacity: 0;
                transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            `;

            overlay.innerHTML = `
                <div id="sp-season-flyer-container" style="
                    position: relative;
                    width: 100%;
                    max-width: 480px;
                    max-height: 94vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #090d16;
                    border: 1.5px solid rgba(204, 255, 0, 0.45);
                    border-radius: 22px;
                    padding: 14px 14px 18px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(204,255,0,0.2);
                    transform: scale(0.92);
                    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                ">
                    <!-- Botón de Cierre Superior Circular -->
                    <button 
                        type="button" 
                        onclick="window.closeSeasonFlyerModal()" 
                        aria-label="Cerrar cartel"
                        style="
                            position: absolute;
                            top: -14px;
                            right: -14px;
                            width: 38px;
                            height: 38px;
                            border-radius: 50%;
                            background: #0f172a;
                            color: #CCFF00;
                            border: 2px solid #CCFF00;
                            font-size: 1.15rem;
                            font-weight: 900;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                            z-index: 20;
                            transition: transform 0.15s;
                        "
                        onmouseover="this.style.transform='scale(1.1) rotate(90deg)';"
                        onmouseout="this.style.transform='scale(1) rotate(0deg)';">
                        ✕
                    </button>

                    <!-- Header del Lightbox -->
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 4px;">
                        <span style="background: #CCFF00; color: #000000; font-size: 0.65rem; font-weight: 950; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;">
                            🏆 CARTEL OFICIAL 2027
                        </span>
                        <span style="font-size: 0.70rem; color: #94a3b8; font-weight: 700;">
                            Liga Summapadel • SomosPadel BCN
                        </span>
                    </div>

                    <!-- Contenedor del Cartel -->
                    <div style="
                        width: 100%;
                        overflow: hidden;
                        border-radius: 14px;
                        border: 1px solid rgba(255,255,255,0.1);
                        background: #000000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
                    ">
                        <img 
                            src="img/flyer_temporada_2027.jpg" 
                            alt="Flyer Temporada 2027 SomosPadel" 
                            style="
                                width: 100%;
                                height: auto;
                                max-height: 65vh;
                                object-fit: contain;
                                display: block;
                            "
                        />
                    </div>

                    <!-- Botones de Acción al pie del Lightbox -->
                    <div style="display: flex; gap: 8px; width: 100%; margin-top: 14px;">
                        <button 
                            type="button" 
                            onclick="window.closeSeasonFlyerModal(); window.SeasonCampaignView && window.SeasonCampaignView.openModal('equipos');" 
                            style="
                                flex: 2;
                                padding: 12px 14px;
                                background: #CCFF00;
                                color: #000000;
                                border: none;
                                border-radius: 12px;
                                font-weight: 950;
                                font-size: 0.85rem;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                box-shadow: 0 4px 14px rgba(204,255,0,0.35);
                            ">
                            <span>🚀</span> PRE-INSCRIBIRME EN UN EQUIPO
                        </button>
                        <button 
                            type="button" 
                            onclick="window.closeSeasonFlyerModal()" 
                            style="
                                flex: 1;
                                padding: 12px 14px;
                                background: rgba(255, 255, 255, 0.08);
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 12px;
                                color: #ffffff;
                                font-weight: 800;
                                font-size: 0.80rem;
                                cursor: pointer;
                            ">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    window.closeSeasonFlyerModal();
                }
            });

            document.body.appendChild(overlay);
        }

        const onEsc = (e) => {
            if (e.key === 'Escape') {
                window.closeSeasonFlyerModal();
                document.removeEventListener('keydown', onEsc);
            }
        };
        document.addEventListener('keydown', onEsc);

        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            const container = document.getElementById('sp-season-flyer-container');
            if (container) container.style.transform = 'scale(1)';
        });
        document.body.style.overflow = 'hidden';
    };

    window.closeSeasonFlyerModal = function() {
        const overlay = document.getElementById('sp-season-flyer-lightbox');
        if (overlay) {
            const container = document.getElementById('sp-season-flyer-container');
            if (container) container.style.transform = 'scale(0.92)';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 220);
        }
    };

    console.log("🚀 Vibrant Dashboard Loaded");
})();
