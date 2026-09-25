/**
 * journalCatalog.js - Catálogo Curado de Artículos para SomosPadel Journal
 * Utilizado por Firebase Cloud Functions para la emisión automática de la Noticia del Día.
 * Redacción editorial de alta calidad técnica, táctica y deportiva de pádel.
 */

const JOURNAL_CATALOG = [
    {
        id: 'cultura-fair-play',
        title: "Cultura Fair Play: Protocolo de Convivencia y Regla de 'Dos Bolas' ante Dudas",
        category: '🤝 COMUNIDAD',
        icon: 'users',
        summary: 'El respeto al rival y la honestidad en cada bote definen a SomosPadel Barcelona. Descubre el código de etiqueta y cómo resolver bolas dudosas con deportividad ejemplar.',
        body: 'En SomosPadel Barcelona el resultado siempre queda en segundo plano frente a los valores compartidos. Una comunidad sana se construye punto a punto cuando ambos lados de la red compiten con máxima intensidad pero con absoluta nobleza arbitral.\n\nLa regla de oro ante bolas milimétricas en la línea o el alambre es sencilla: si la pareja que recibe tiene una duda razonable, el punto debe repetirse de inmediato sin discusión ("dos bolas nuevas"). Cantar a favor del rival ante la duda no te hace más débil, consolida tu reputación y prestigio deportivo en el club.\n\nAsimismo, pedir disculpas tras una cinta afortunada, no celebrar los errores no forzados ajenos y estrechar la mano con una sonrisa sincera en el tercer tiempo son los pilares innegociables de nuestras americanas y entrenos.'
    },
    {
        id: 'match-point-oro',
        title: 'El Punto de Oro (40-40): Psicología y Táctica de Resto sin Margen de Error',
        category: '🧠 MENTAL',
        icon: 'brain',
        summary: 'Sin ventajas ni segundas oportunidades: una sola bola decide el juego. Estrategias frías de resto, elección del receptor y gestión de la adrenalina.',
        body: 'El Punto de Oro (Punto Decisivo) introducido por el pádel moderno transforma el clásico 40-40 en una ruleta rusa de alta tensión táctica. La pareja que resta tiene el poder de decidir quién recibe el servicio, una ventaja estratégica que debe meditarse con frialdad y no por inercia.\n\nElige al receptor no por quién tenga el golpe más vistoso, sino por quién posea mayor solidez psicológica y porcentaje de restos dentro. El objetivo prioritario jamás es ganar el punto con el resto: es neutralizar el saque a la T o al cristal y obligar al sacador a jugar una primera volea incómoda por debajo del plano de la cinta.\n\nSi estás sacando, busca un primer saque profundo y sin riesgo excesivo de doble falta; mantén la volea al centro para tapar huecos y fuerza al rival a jugarse el tiro ganador bajo presión extrema.'
    },
    {
        id: 'palas-control-potencia',
        title: 'Palas de Control vs Potencia: ¿Qué Formato Maximiza Tu Rendimiento Real?',
        category: '👟 MATERIAL',
        icon: 'table-tennis-paddle-ball',
        summary: 'Redonda, lágrima o diamante: analiza el balance, la dureza del plano y el punto dulce para evitar lesiones de codo y definir con soltura.',
        body: 'Elegir la pala correcta es el primer paso para desbloquear tu verdadero potencial en pista. Una pala inadecuada no solo merma tu precisión defensiva, sino que sobrecarga las articulaciones del antebrazo y hombro por culpa de vibraciones descompensadas.\n\nLas palas redondas destacan por su balance bajo y un amplísimo punto dulce centrado, siendo idóneas para jugadores de drive que priorizan el volumen de bola, la defensa de fondo y el control milimétrico de la chiquita.\n\nPor contra, las formas de diamante desplazan su masa hacia la cabeza (balance alto), ofreciendo palanca demoledora para el remate x3 y la víbora agresiva a costa de exigir un timing perfecto. Si buscas versatilidad total, el formato lágrima o gota proporciona el equilibrio perfecto entre pegada y maniobrabilidad.'
    },
    {
        id: 'nutricion-hidratacion',
        title: 'Hidratación Inteligente: Por Qué el Agua Sola No Evita el Bajón en el Tercer Set',
        category: '🍎 NUTRICIÓN',
        icon: 'bottle-water',
        summary: 'En 120 minutos de americana pierdes hasta 1.8 litros de sudor y electrolitos clave. Aprende a pautar sales minerales para evitar calambres y niebla mental.',
        body: 'Durante un partido intenso de pádel o una americana de dos horas en indoor, la temperatura corporal y la tasa de sudoración se disparan. Beber únicamente agua pura en grandes volúmenes puede diluir aún más los niveles de sodio en sangre (hiponatremia leve), acelerando la aparición de fatiga central y calambres.\n\nLa pauta profesional recomienda consumir pequeños sorbos de 100-150 ml en cada cambio de pista impar, combinando agua con una solución isotónica rica en sodio, potasio y magnesio (entre 400 y 600 mg de sodio por litro).\n\nAñadir carbohidratos de absorción rápida como maltodextrina o fructosa en el bidón mantendrá estables tus niveles de glucemia, garantizando reflejos afilados en las voleas decisivas del tramo final del torneo.'
    },
    {
        id: 'tactica-defensa-cristal',
        title: 'Defensa de Doble Pared: Los Giros Mecánicos y la Lectura del Rebote',
        category: '💡 CONSEJOS',
        icon: 'arrows-spin',
        summary: 'Acompañar la trayectoria en lugar de perseguir la bola: domina la apertura de apoyos y sal del cristal con globos milimétricos al rincón.',
        body: 'La doble pared (fondo-lateral o lateral-fondo) es la pesadilla del jugador intermedio pero el patio de recreo del avanzado. El secreto biomecánico fundamental radica en no correr hacia la bola, sino dejarla pasar y acompañar su curvatura natural girando sobre el pie de apoyo.\n\nIdentifica el ángulo de entrada: si la bola toca primero el cristal de fondo y luego el lateral hacia adentro, realiza un giro envolvente manteniendo la pala armada baja y compacta por debajo de la cintura.\n\nNo intentes acelerar una bola que sale muriendo del cristal. Flexiona las rodillas, impacta delante de tu cadera y ejecuta un globo profundo cruzado para comprar tiempo, obligar al rival a retroceder y recuperar la posición de red de inmediato.'
    },
    {
        id: 'app-noticia-notificaciones-push-movil',
        title: '¡Notificaciones Push en Tiempo Real: Tu Pista y Tus Torneos Siempre al Día!',
        category: '🚀 NOVEDADES APP',
        icon: 'bell',
        summary: 'Entérate al instante de convocatorias abiertas, sustituciones de última hora, pistas asignadas y noticias tácticas exclusivas en tu móvil.',
        body: 'La aplicación de SomosPadel Barcelona estrena su motor de notificaciones push de última generación integrado con Firebase Cloud Messaging. Ya no tendrás que refrescar la web para enterarte de plazas vacantes o novedades del club.\n\nRecibirás alertas instantáneas cuando se publique una nueva americana de tu categoría, cuando falte un jugador de nivel similar para completar pista en un entreno o cuando se abra el plazo para los torneos de fin de semana.\n\nAsegúrate de permitir las notificaciones en los ajustes de tu navegador o dispositivo móvil para disfrutar de la experiencia SomosPadel PRO sin interrupciones.'
    },
    {
        id: 'tactica-teoria-centro',
        title: 'La Teoría del Centro: El Embudo Táctico Más Rentable del Pádel Moderno',
        category: '💡 CONSEJOS',
        icon: 'bullseye',
        summary: 'Reducir los ángulos de contragolpe del rival y sembrar la duda entre compañeros jugando con determinación por la línea divisoria.',
        body: 'En el pádel el camino más corto hacia la victoria suele ser el medio de la pista. Tirar constantemente a las rejas o buscar las esquinas conlleva un margen de error muy estrecho contra el cristal lateral, mientras que jugar al centro ofrece máxima seguridad.\n\nAl enviar la bola profunda al centro de la pista rival, provocas tres efectos demoledores: primero, creas el "vacío de responsabilidad" donde ambos rivales dudan sobre quién debe impactar; segundo, anulas los ángulos de apertura para que te pasen por fuera; y tercero, la red se encuentra en su punto más bajo (0.88m), otorgándote mayor margen de seguridad.\n\nAplica esta regla de oro: en situaciones de duda o defensa apurada, bola al centro a los pies; en situación de ataque con volea cómoda, abre hueco hacia las esquinas.'
    },
    {
        id: 'modos-juego-pareja-fija-vs-twister',
        title: 'Pareja Fija vs Twister Individual: ¿En Qué Formato Explotar Tu Pádel?',
        category: '🎮 MODOS DE JUEGO',
        icon: 'gamepad',
        summary: 'Descubre las diferencias competitivas entre consolidar automatismos en tándem cerrado o demostrar versatilidad y resiliencia en rotación individual.',
        body: 'En SomosPadel ofrecemos dos modalidades emblemáticas diseñadas para enriquecer facetas complementarias de tu juego: el Torneo por Pareja Fija y la Americana Twister Individual.\n\nLa Pareja Fija es el laboratorio idóneo para consolidar la sincronización táctica, establecer coberturas automáticas en el centro y preparar torneos oficiales federados. Jugar siempre con el mismo compañero forja complicidad en momentos de tensión y define roles claros de drive y revés.\n\nPor su parte, el formato Twister pone a prueba tu capacidad de adaptación: cambiar de compañero en cada ronda te obliga a comunicarte con rapidez, calibrar virtudes y debilidades ajenas en dos minutos y mantener una mentalidad positiva constante.'
    },
    {
        id: 'modos-juego-suizo-americana-entreno',
        title: 'El Sistema Suizo en SomosPadel: Dinámica de Ascensos y Cruces Equilibrados',
        category: '🎮 MODOS DE JUEGO',
        icon: 'flag-checkered',
        summary: '6 rondas intensas de 20 minutos donde cada juego suma: los ganadores escalan hacia la Pista 1 y los partidos se nivelan al milímetro.',
        body: 'El Sistema Suizo es el rey indiscutible de nuestras americanas por su capacidad de equilibrar la competitividad en tiempo récord. No hay eliminación directa: todos los jugadores disputan íntegramente las dos horas de competición.\n\nTras cada manga express, la pareja ganadora sube de pista hacia la Pista Central (Pista 1) y los derrotados descienden una posición. Este flujo continuo garantiza que, a partir de la tercera ronda, cada partido sea una batalla equilibrada entre contendientes en estado de forma similar.\n\nRecuerda que cada juego individual ganado cuenta en la clasificación general. Aunque vayas perdiendo un parcial 4-1, luchar ese último juego hasta el 4-2 puede significar subir al podio al finalizar la jornada.'
    },
    {
        id: 'clinic-bandeja-vs-vibora',
        title: 'Clinic Pro: Bandeja vs Víbora: Biomecánica, Punto de Contacto y Efecto',
        category: '🏫 CLINIC',
        icon: 'bolt',
        summary: 'Aprende a diferenciar el armado alto de seguridad de la bandeja frente al impacto lateral cortado y agresivo de la víbora para demoler el cristal.',
        body: 'Muchos jugadores confunden la bandeja y la víbora, ejecutando híbridos ineficaces que terminan flotando en el cristal de fondo. Aunque ambos son golpes aéreos ejecutados sin dejar botar el globo rival, sus objetivos y mecánicas son opuestos.\n\nLa Bandeja es un golpe de control defensivo-transitorio: se prepara de perfil con la pala plana orientada al cielo, impactando a la altura de los ojos ligeramente delante del cuerpo. Su objetivo es devolver una bola baja, profunda y sin rebote para conservar la red.\n\nLa Víbora, en cambio, es un golpe ofensivo de definición o presión alta. El impacto se realiza a la altura de la sien, golpeando el lateral de la bola con efecto cortado-helicoidal. Cuando la víbora toca el cristal, muerde el suelo y abre una trayectoria impredecible pegada a la pared.'
    },
    {
        id: 'salud-prevencion-epicondilitis',
        title: 'Blindaje del Codo: Prevención y Ejercicios Excéntricos para Evitar la Epicondilitis',
        category: '💪 SALUD',
        icon: 'hand-holding-medical',
        summary: 'El codo de tenista es la lesión más común en el 20x10. Rutinas de fortalecimiento del extensor radial, elección de grips y balance de pala.',
        body: 'La epicondilitis lateral se origina por microtraumatismos repetitivos en la inserción de los tendones extensores de la muñeca. En el pádel, suele detonarse por impactar la bola tarde con la muñeca flexionada o por usar palas con balance excesivamente cabezón.\n\nPara prevenirla, introduce ejercicios excéntricos de flexo-extensión de muñeca con mancuernas ligeras (1-2 kg) o barras flexibles tipo Tyler Twist dos veces por semana. Fortalecer el complejo del antebrazo disipa las fuerzas de torsión antes de que lleguen al tendón.\n\nRevisa además tu material: un grip demasiado fino obliga a apretar la mano con exceso de fuerza isométrica; añade overgrips hasta que quepa el dedo índice entre la punta de tus dedos y la palma de la mano al empuñar.'
    },
    {
        id: 'tactica-transicion-defensa-ataque',
        title: 'El Arte de la Transición: Cómo Salir del Fondo y Conquistar la Red con Éxito',
        category: '💡 CONSEJOS',
        icon: 'person-running',
        summary: 'Quedarse anclado en tierra de nadie es regalar el punto. Claves para sincronizar la subida, leer el globo y clavar el split step a mitad de pista.',
        body: 'El 80% de los puntos en pádel se ganan en la red, pero subir precipitadamente sin la bola adecuada es un suicidio táctico. La zona intermedia ("tierra de nadie", entre la línea de saque y dos metros de la red) es donde más bolas se fallan por falta de posicionamiento.\n\nPara realizar una transición impecable, espera a generar una situación de desequilibrio: un globo alto y profundo que sobrepase a los rivales o una chiquita quirúrgica que caiga por debajo de la cinta a sus pies.\n\nEn cuanto sueltes el golpe, avanza con determinación en bloque junto a tu compañero. Pero atención: en el instante exacto en que el rival vaya a impactar la bola, frena en seco y ejecuta un split step. Estarás perfectamente equilibrado para volear hacia adelante.'
    },
    {
        id: 'material-suela-clay-vs-omni',
        title: 'Suela Clay vs Omni vs All Court: ¿Qué Tracción Requieren Tus Articulaciones?',
        category: '👟 MATERIAL',
        icon: 'shoe-prints',
        summary: 'Césped rizado de última generación vs arena vista tradicional: elige el dibujo adecuado para deslizar con control y blindar tus rodillas.',
        body: 'El calzado es el elemento de equipamiento más determinante para la salud articular del padelero. Una zapatilla con agarre incorrecto puede provocar bloqueos bruscos de rodilla en césped seco o resbalones peligrosos en pistas húmedas.\n\nLa suela Clay (espiga completa en zigzag) es la reina indiscutible en pistas de césped tradicional con arena de sílice visible. Sus surcos profundos expulsan la arena y permiten deslizar controladamente en frenadas extremas, protegiendo tobillos y meniscos.\n\nPor otro lado, en pistas modernas con césped monofilamento rizado (tipo World Padel Tour o Premier Padel) donde la arena queda atrapada en la base, las suelas Omni (puntos) o suelas híbridas All Court ofrecen la tracción óptima sin clavar el pie de forma agresiva en los giros.'
    },
    {
        id: 'mental-quimica-en-pareja',
        title: 'La Química en Pista: Comunicación Positiva y Blindaje Emocional en el Tándem',
        category: '🤝 COMUNIDAD',
        icon: 'handshake',
        summary: 'Un mal gesto o un reproche silencioso puede dinamitar el partido. Aprende a construir sinergia ganadora y apoyar en los baches de juego.',
        body: 'El pádel es un deporte individual que se juega de a dos: tu compañero de pista es tu mayor activo, no tu adversario. Estudios deportivos demuestran que las parejas con comunicación gestual positiva puntúan hasta un 25% más en momentos de máxima presión.\n\nCuando tu compañero cometa un error no forzado o falle un remate decisivo, la única respuesta admisible es chocar palas de inmediato y transmitir serenidad con una palabra de aliento. Los reproches con la mirada o los bufidos solo consiguen crispar al compañero y acelerar su bloqueo.\n\nPacten antes de entrar al 20x10 un código de comunicación breve para los descansos: hablar de táctica constructiva ("vamos a tirar más globos al de la izquierda") en lugar de lamentar lo que ya no tiene remedio.'
    },
    {
        id: 'clinic-la-chiquita-al-pie',
        title: 'La Chiquita Milimétrica: El Golpe Que Neutraliza a las Parejas Agresivas',
        category: '🏫 CLINIC',
        icon: 'feather',
        summary: 'Quita la inercia del pegador enviando una bola lenta y rasa a los pies del voleador para forzar un tiro forzado y contraatacar en la red.',
        body: 'Cuando los rivales se adueñan de la red con voleas firmes y remates amenazantes, tirar melones a media pista es regalarles el punto. La solución técnica más elegante y efectiva para desactivar su pegada es la chiquita.\n\nLa chiquita se ejecuta con un armado muy corto, flexionando profundamente el centro de gravedad e impactando la bola suavemente por debajo con efecto liftado o plano controlado. El objetivo no es hacer un punto ganador directo, sino depositar la bola a los pies del rival.\n\nAl obligar al voleador a impactar por debajo del nivel de la cinta, su único recurso biomecánico es levantar la bola hacia arriba. Es en ese instante cuando debes anticipar el paso al frente y castigar su devolución con una volea definitiva al hueco.'
    },
    {
        id: 'material-goma-eva-vs-foam',
        title: 'Núcleos de Pala: Diferencias Reales entre EVA Soft, Black EVA y Polietileno/FOAM',
        category: '👟 MATERIAL',
        icon: 'shield-halved',
        summary: 'Salida de bola, absorción de vibraciones y durabilidad térmica: cómo influye la densidad de la goma en tu control y en tu pegada.',
        body: 'El comportamiento de una pala de pádel depende en un 70% de las propiedades viscoelásticas de su núcleo interior. Conocer la densidad de la goma te permitirá escoger el arma perfecta según tu estilo y la temperatura del club.\n\nEl FOAM o polietileno destaca por su tacto ultrasuave y extraordinaria absorción de impacto, siendo la opción número uno para jugadores propensos a molestias articulares. Ofrece una enorme salida de bola a baja velocidad, facilitando la defensa con poco esfuerzo.\n\nLas gomas EVA Soft y Black EVA presentan una memoria elástica superior y mayor densidad. Proporcionan un control quirúrgico en voleas bloqueadas y transmiten toda la energía de tu brazo en remates de potencia, manteniendo sus propiedades intactas en los meses calurosos de verano.'
    },
    {
        id: 'salud-calentamiento-manguito-rotador',
        title: 'Protocolo Manguito Rotador: 6 Minutos para Prevenir Lesiones de Hombro',
        category: '💪 SALUD',
        icon: 'fire',
        summary: 'Bandejas, víboras y remates cargan la articulación glenohumeral. Rutina de activación con bandas elásticas y movilidad escapular previa al partido.',
        body: 'El hombro del jugador de pádel soporta cargas de desaceleración brutales en cada golpe aéreo sobre la cabeza. Entrar a pista en frío y empezar a rematar bolas en el peloteo de cortesía es la vía directa a la tendinopatía del supraespinoso.\n\nDedica 6 minutos fuera del 20x10 a un protocolo de activación específico con goma elástica de resistencia media: rotaciones externas e internas pegando el codo al tronco (15 repeticiones por lado), diagonales en polea y elevaciones escapulares en "Y" y "T".\n\nFinaliza con sombras suaves de volea y bandeja sin impacto para activar los propioceptores del manguito rotador. Entrarás al primer punto con el hombro suelto, rápido y blindado contra microtraumatismos.'
    },
    {
        id: 'nutricion-comida-pre-partido',
        title: 'Nutrición Competitiva: Qué y Cuándo Comer Antes de una Americana de Fin de Semana',
        category: '🍎 NUTRICIÓN',
        icon: 'utensils',
        summary: 'Pautas de carga de glucógeno y digestión ligera para evitar pesadez gastrointestinal y saltar a la pista con máxima agilidad física y mental.',
        body: 'Llegar a una americana tras un desayuno copioso o un almuerzo con grasas saturadas arruinará tus desplazamientos laterales. Durante el esfuerzo anaeróbico intermitente del pádel, el sistema digestivo compite con los músculos por el flujo sanguíneo.\n\nLa comida principal debe completarse entre 2 y 3 horas antes del partido. Prioriza carbohidratos complejos de fácil digestión como arroz blanco, avena cocida o pasta integral suave, acompañados de una porción moderada de proteína magra (pechuga de pavo, claras de huevo o tofu) y mínima fibra/grasa.\n\nEntre 30 y 45 minutos antes de ingresar a pista, un snack rápido compuesto por un plátano maduro o un puñado de dátiles proveerá glucosa inmediata para nutrir tus reflejos y arranques explosivos en la red.'
    },
    {
        id: 'ranking-como-funciona-algoritmo-elo',
        title: 'El Algoritmo ELO de SomosPadel: Matemáticas y Justicia en Tu Nivel Dinámico',
        category: '📈 RANKING',
        icon: 'chart-line',
        summary: '¿Por qué varía tu puntuación tras cada jornada? Conoce cómo pondera el sistema la dificultad de tus rivales y el peso de cada juego sumado.',
        body: 'En SomosPadel Barcelona decimos adiós a los niveles arbitrarios basados en autopercepciones subjetivas. Nuestro sistema implementa una adaptación matemática del prestigioso algoritmo ELO con factores de ponderación diseñados para el pádel por parejas.\n\nEl algoritmo calcula la probabilidad esperada de victoria antes de cada partido en función del diferencial de nivel entre ambas duplas. Si vences a rivales con mayor puntuación acumulada, el salto de puntos que recibes es exponencialmente superior al de una victoria estándar.\n\nAdemás, el margen de juegos ganados y la regularidad frente a oponentes de élite modulan el factor K de ajuste, garantizando que tu nivel en la app refleje con total fidelidad tu momento de forma real en la pista.'
    },
    {
        id: 'clinic-bajada-pared-potente',
        title: 'La Bajada de Pared Ofensiva: Transferencia de Peso y Aceleración sin Pérdida de Control',
        category: '🏫 CLINIC',
        icon: 'burst',
        summary: 'Armado alto anticipado, flexión de piernas y balanceo de cadera para castigar bolas altas que rebotan del cristal de fondo hacia el cuerpo rival.',
        body: 'La bajada de pared es el golpe de contraataque definitivo: transforma un globo rival aparentemente cómodo en un misil teledirigido. El fallo más repetido es saltar o golpear con el peso del cuerpo cayendo hacia atrás por precipitación.\n\nPara ejecutarla como un profesional, perfila el cuerpo en cuanto identifiques el globo largo, armando la pala arriba con la cabeza bien vertical por detrás de la nuca. Flexiona las rodillas esperando a que la bola alcance la cúspide de su rebote en el cristal.\n\nEn el momento del impacto, transfiere todo el peso de la pierna trasera a la delantera, pegando delante del hombro con la pala ligeramente plana o cortada. Busca el cuerpo del rival en la red o el espacio entre ambos para forzar el bloqueo defensivo.'
    },
    {
        id: 'tactica-romper-ritmo-partido',
        title: 'Guerra de Ritmos: Cómo Frenar a Rivales Jóvenes, Rápidos y Pegadores',
        category: '💡 CONSEJOS',
        icon: 'clock',
        summary: 'Si compites a la velocidad de una pareja agresiva tienes las de perder. Aprende a enfriar el partido con bolas pesadas, globos estratosféricos y pausas.',
        body: 'Frente a parejas con pegada descomunal y velocidad de piernas vertiginosa, el peor error táctico es aceptar el intercambio a ritmo frenético de metralla. Un pegador se alimenta de la velocidad que tú le imprimes a la bola.\n\nLa estrategia maestra consiste en bajar drásticamente los decibelios del choque. Utiliza globos milimétricos muy altos (que toquen casi el techo sin rozarlo) para obligarles a recular, romper su posicionamiento de red y dejar que la gravedad enfríe la bola.\n\nCombina los globos con chiquitas sin fuerza y bolas pesadas con mucho corte que mueran antes de tocar el cristal. Al privar al rival de ritmo y forzarlo a generar potencia desde cero, comenzará a desesperarse y a encadenar errores no forzados.'
    },
    {
        id: 'salud-fascitis-plantar-cesped',
        title: 'Fascitis Plantar en Pistas de Pádel: Causas, Calzado y Alivio Miofascial',
        category: '💪 SALUD',
        icon: 'socks',
        summary: 'Los continuos frenazos y arrancadas sobre solera de hormigón inflaman la fascia. Consejos biomecánicos y automasaje liberador para tus pies.',
        body: 'El césped artificial de las pistas de pádel descansa directamente sobre una losa rígida de hormigón poroso. Esta superficie absorbe un porcentaje mínimo del impacto, transmitiendo toda la sobrecarga elástica a la fascia plantar en cada arrancada y frenada brusca.\n\nEl primer síntoma es un dolor punzante en el talón al dar los primeros pasos matutinos. Para combatirlo, revisa el estado de la mediasuela de tus zapatillas: tras 6-8 meses de uso continuo, el material amortiguador colapsa aunque la suela exterior parezca intacta.\n\nAplica este protocolo de alivio diario: haz rodar una pelota de pádel o una botella de agua semicongelada bajo la planta del pie durante 10 minutos con presión controlada, y complementa estirando los gemelos y el tendón de Aquiles contra la pared.'
    },
    {
        id: 'mental-remontar-marcador-adverso',
        title: 'Psicología de la Remontada: Cómo Dar la Vuelta a un Set 1-4 Abajo con Calma',
        category: '🧠 MENTAL',
        icon: 'compass',
        summary: 'El pádel es un deporte de rachas y dinámicas emocionales. Descubre las tres claves psicológicas y tácticas para revertir un marcador adverso.',
        body: 'Estar un break abajo o ver un 1-4 en el marcador provoca a menudo una espiral de frustración y precipitación que liquida el set en cinco minutos. Sin embargo, en el pádel dos rotaciones tácticas acertadas son suficientes para cambiar la dinámica del encuentro.\n\nLa primera regla es dejar de mirar el marcador global: divide el set en micro-objetivos, concentrándote única y exclusivamente en ganar el punto que estás a punto de disputar. Olvídate de los errores de los juegos anteriores; el pasado ya no existe en la pista.\n\nLa segunda regla es simplificar tu libreto de juego: reduce al mínimo los golpes arriesgados, aumenta el volumen de bola al centro y obliga a la pareja rival a ganar tres o cuatro golpes por punto. El rival que va ganando sentirá de pronto la presión de cerrar y empezará a dudar.'
    },
    {
        id: 'material-overgrips-y-peso',
        title: 'La Alquimia del Overgrip: Cómo un Milímetro Modifica el Balance y la Potencia',
        category: '👟 MATERIAL',
        icon: 'wrench',
        summary: 'Grosor de puño, colocación estratégica de tiras de plomo y absorción de sudor: afina la empuñadura para prevenir lesiones y mejorar la maniobrabilidad.',
        body: 'El puño de la pala es el único punto de contacto físico entre tu cuerpo y el juego. Modificar la cantidad de overgrips colocados altera drásticamente no solo la comodidad de la mano, sino también el balance general y el peso estático de la pala.\n\nCada overgrip estándar añade entre 5 y 6 gramos en la base del mango. Colocar dos o tres overgrips baja el punto de equilibrio hacia el puño, transformando una pala cabezona en una herramienta mucho más ágil y manejable en volea rápida.\n\nAsimismo, cambiar el overgrip con frecuencia (cada 3-5 partidos) asegura una adherencia óptima sin necesidad de apretar el mango con tensión excesiva, previniendo directamente sobrecargas en los músculos flexores y el túnel carpiano.'
    },
    {
        id: 'tactica-juego-contra-zurdos',
        title: 'El Desafío Zurdo: Pautas Tácticas para Neutralizar a Rivales Diestros Invertidos',
        category: '💡 CONSEJOS',
        icon: 'shuffle',
        summary: 'Las trayectorias de rebote cambian y las dos palas cubren el medio: aprende a leer sus ángulos de salida y desmontar su ventaja natural.',
        body: 'Enfrentarse a un jugador zurdo colocado en el drive (lado derecho) descoloca los patrones habituales aprendidos tras jugar cientos de partidos contra parejas diestras. En esta formación, ambos jugadores disponen de su derecha en el centro de la pista.\n\nEsto significa que la clásica "teoría del centro" debe aplicarse con extrema precisión quirúrgica: un globo al medio poco profundo caerá directamente en la bandeja o víbora de derecha de ambos rivales, facilitando remates letales.\n\nPara neutralizar al zurdo, busca su punto débil: tira globos profundos sobre su hombro derecho (su revés) obligándolo a jugar bandejas forzadas de espaldas, y juega bolas con ángulo hacia su reja lateral donde el rebote invertido le dificultará la salida de pared.'
    },
    {
        id: 'salud-calambres-tercer-set',
        title: 'Calambres en Gemelos en Rondas Decisivas: Fisiología, Sodio y Prevención',
        category: '💪 SALUD',
        icon: 'battery-half',
        summary: 'El agotamiento neuromuscular y el déficit salino bloquean las fibras musculares. Consejos de nutrición intra-partido y compresión vascular para rendir al 100%.',
        body: 'Pocos momentos son tan frustrantes como tener que abandonar un partido decisivo o una final de americana por un calambre agudo en los gemelos o en los isquiotibiales. La ciencia deportiva ha demostrado que el calambre no se debe solo a la falta de agua, sino a un fallo de excitación neuromuscular detonado por fatiga y desbalance iónico.\n\nEl músculo pierde la capacidad de relajarse tras contracciones repetitivas a máxima intensidad en pista dura. Para blindarte, ingiere cápsulas de sales minerales o bebidas ricas en sodio y citrato de magnesio antes de comenzar los sets definitivos.\n\nEl uso de pantorrilleras o medias de compresión graduada favorece el retorno venoso, amortigua las vibraciones musculares producidas por los saltos y disminuye significativamente la acumulación de fatiga en el tríceps sural.'
    },
    {
        id: 'reglamento-invasion-de-pista',
        title: 'Reglamento FIP: Invasión por Encima de la Red, Tocar la Malla y Puntos Nulos',
        category: '📡 REGLAMENTO',
        icon: 'book-open',
        summary: '¿Cuándo puedes golpear la bola en campo contrario? Despeja las dudas más polémicas de la normativa oficial para evitar discusiones en pista.',
        body: 'Las situaciones de invasión en la red generan discusiones acaloradas en los partidos si no se conoce con exactitud el Reglamento Oficial de la Federación Internacional de Pádel (FIP). Conocer la norma te evitará perder puntos innecesarios.\n\nLa regla fundamental estipula que jamás se puede impactar la bola en el campo contrario, excepto en un único supuesto: cuando la bola, tras botar en tu propio campo y rebotar en la pared o cristal, regresa hacia el campo rival por efecto retroceso o viento. En ese caso, sí puedes pasar la pala por encima de la red para impactar.\n\nSin embargo, existe una condición infranqueable en cualquier circunstancia: bajo ningún concepto el jugador, su pala, su vestimenta o sus zapatillas pueden tocar la red, los postes de sujeción ni el terreno rival mientras el punto esté en juego. Cualquier roce accidental supone la pérdida automática del punto.'
    },
    {
        id: 'torneos-guia-americana-perfecta',
        title: 'Manual de la Americana Perfecta: Gestión de Energía, Comunicación y Estrategia',
        category: '🏆 TORNEOS',
        icon: 'trophy',
        summary: '2 horas sin descanso, 6 parejas distintas y cada juego en disputa: cómo dosificar el esfuerzo, sincronizarse en 30 segundos y liderar el podio.',
        body: 'Disputar una americana de SomosPadel con éxito exige habilidades deportivas muy diferentes a las de un partido convencional a tres sets. En este formato express, cada juego no sumado o regalado por despiste puede alejarte del trofeo al finalizar la noche.\n\nAplica el "protocolo de los 30 segundos" en cada cambio de pista: presenta tu estilo de juego a tu nuevo compañero, acuerden quién cubrirá las bolas dudosas al centro y establezcan de antemano el lado de resto de cada uno sin titubeos.\n\nGestiona tus reservas de energía con inteligencia: no derroches aceleraciones innecesarias en bolas que no vas a alcanzar y mantén una ingesta continua de pequeños sorbos de isotónico y fruta en cada descanso. La constancia y el volumen de bola ganan más americanas que los tiros inverosímiles.'
    },
    {
        id: 'app-noticia-doble-ranking-inicio',
        title: 'Doble Ranking en el Panel de Inicio: Entrenos Técnicos y Americanas Diferenciados',
        category: '🚀 NOVEDADES APP',
        icon: 'list-ol',
        summary: 'Nuevo conmutador ultrarrápido en el panel de inicio para auditar clasificaciones independientes de entrenamientos y torneos competitivos con un solo toque.',
        body: 'La comunidad de SomosPadel Barcelona pedía a gritos una diferenciación clara entre el rendimiento en sesiones de entrenamiento formativo y la competición pura en americanas oficiales. ¡Dicho y hecho!\n\nLa pantalla principal de la aplicación incorpora ahora un selector biométrico de doble pestaña que te permite alternar entre el Ranking Oficial de Americanas y la Clasificación Pro de Entrenamientos Técnicos en tiempo real.\n\nConsulta tu evolución particular, analiza el historial de puntos acumulados, revisa las estadísticas de partidos disputados y escala puestos en las clasificaciones para acceder a las codiciadas pistas de Primera Categoría.'
    },
    {
        id: 'app-noticia-cartas-fut-3d-interactivas',
        title: 'Cartas de Jugador FUT 3D: Conoce Tu Valoración Global (OVR) y Atributos Pro',
        category: '🚀 NOVEDADES APP',
        icon: 'id-card',
        summary: 'Tu perfil de jugador cobra vida con un cromo holográfico 3D interactivo con métricas dinámicas de Ataque, Defensa, Volea, Físico y Mentalidad.',
        body: 'SomosPadel revoluciona la experiencia gamer en el pádel amateur con el lanzamiento de las Cartas de Jugador 3D inspiradas en la estética FUT de élite. Tu perfil genera de forma automática un cromo holográfico tridimensional con efectos de inclinación giroscópica.\n\nLa carta sintetiza tus estadísticas de juego en cinco atributos clave calibrados por el algoritmo de rendimiento: Ataque (remates y bajadas), Defensa (salidas de pared y globos), Volea (control en la red), Físico (resistencia en partidos largos) y Mentalidad (puntos de oro ganados).\n\nDescubre tu valoración media (OVR), compara tu cromo con el de tus compañeros de club y comparte tu carta en redes sociales para lucir tus galones de SomosPadel.'
    }
];

const JOURNAL_DAILY_ARTICLES = JOURNAL_CATALOG;

module.exports = {
    JOURNAL_CATALOG,
    JOURNAL_DAILY_ARTICLES
};
