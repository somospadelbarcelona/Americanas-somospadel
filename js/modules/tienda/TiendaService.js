/**
 * TiendaService.js - Motor Comercial, Catálogo, Colaboradores y Analítica
 * Plataforma Oficial SomosPadel Barcelona
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TiendaService = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const STORAGE_KEY_PRODS = 'somospadel_tienda_productos_v1';
    const STORAGE_KEY_PARTNERS = 'somospadel_tienda_proveedores_v1';
    const STORAGE_KEY_PROMOS = 'somospadel_tienda_promociones_v1';
    const STORAGE_KEY_STATS = 'somospadel_tienda_stats_v1';
    const STORAGE_KEY_ROLE = 'somospadel_tienda_current_role';
    const STORAGE_KEY_ORDERS = 'somospadel_tienda_pedidos_v1';
    const STORAGE_KEY_SETTINGS = 'somospadel_tienda_settings_v1';
    const TIENDA_ADMIN_PASSWORD = 'PADEL21';
    const SESSION_AUTH_KEY = 'sp_tienda_admin_auth';

    const DEFAULT_SETTINGS = {
        storeName: 'Tienda Oficial SomosPadel Barcelona',
        whatsappPhone: '34623456789',
        emailContact: 'tienda@somospadelbcn.com',
        freeShippingThreshold: 50,
        shippingCost: 4.95,
        announcementBanner: '🎾 ¡Envíos express en 24/48h y 15% DTO exclusivo con tu ficha SomosPadel!',
        announcementActive: true,
        storeStatus: 'open',
        currency: '€'
    };

    const DEFAULT_ORDERS = [
        {
            id: 'ORD-2026-1001',
            date: '2026-10-06 18:30',
            customerName: 'Carlos Santillana',
            customerPhone: '+34 654 998 877',
            customerEmail: 'carlos.padel@gmail.com',
            products: [
                { id: 'prod-bullpadel-hack', name: 'Bullpadel Hack 03 2026', qty: 1, price: 249.00 }
            ],
            totalAmount: 249.00,
            commission: 37.35,
            paymentMethod: 'Bizum',
            shippingMethod: 'Recogida en Club Pista Central',
            status: 'Pagado',
            notes: 'Entregar en la Americana del sábado 11:00h.'
        },
        {
            id: 'ORD-2026-1002',
            date: '2026-10-06 20:15',
            customerName: 'Marta Domínguez',
            customerPhone: '+34 611 223 344',
            customerEmail: 'marta.d@hotmail.com',
            products: [
                { id: 'prod-asics-gel-resolution', name: 'Zapatillas Asics Gel-Resolution 9 Padel', qty: 1, price: 119.00 },
                { id: 'prod-overgrips-wilson-12', name: 'Tambor Overgrips Wilson Pro (12 Uds)', qty: 1, price: 18.50 }
            ],
            totalAmount: 137.50,
            commission: 17.85,
            paymentMethod: 'Tarjeta de Crédito',
            shippingMethod: 'Envío a Domicilio (Barcelona)',
            status: 'Enviado',
            notes: 'Talla 39 de zapatillas confirmada.'
        },
        {
            id: 'ORD-2026-1003',
            date: '2026-10-07 11:45',
            customerName: 'Javier Navarro',
            customerPhone: '+34 677 334 455',
            customerEmail: 'javi.navarro@empresa.com',
            products: [
                { id: 'prod-cajon-24-head', name: 'Cajón 24 Botes HEAD Padel Pro S', qty: 1, price: 114.90 }
            ],
            totalAmount: 114.90,
            commission: 11.49,
            paymentMethod: 'Transferencia Bancaria',
            shippingMethod: 'Envío Express Club',
            status: 'Entregado',
            notes: 'Para el grupo de entrenos de competición.'
        },
        {
            id: 'ORD-2026-1004',
            date: '2026-10-07 17:10',
            customerName: 'Alejandro Morales',
            customerPhone: '+34 622 887 766',
            customerEmail: 'alex.morales@gmail.com',
            products: [
                { id: 'prod-nox-at10-18k', name: 'NOX AT10 Genius 18K Agustín Tapia', qty: 1, price: 265.00 }
            ],
            totalAmount: 265.00,
            commission: 37.10,
            paymentMethod: 'Bizum',
            shippingMethod: 'Recogida en Pista',
            status: 'Pendiente',
            notes: 'Pendiente de verificar comprobante de Bizum.'
        }
    ];

    // Categorías oficiales
    const CATEGORIES = [
        { id: 'todos', name: 'Todos los Productos', icon: 'fa-boxes-stacked' },
        { id: 'palas', name: 'Palas', icon: 'fa-table-tennis-paddle-ball' },
        { id: 'pelotas', name: 'Pelotas', icon: 'fa-circle-dot' },
        { id: 'paleteros', name: 'Paleteros', icon: 'fa-briefcase' },
        { id: 'mochilas', name: 'Mochilas', icon: 'fa-bag-shopping' },
        { id: 'overgrips', name: 'Overgrips', icon: 'fa-ribbon' },
        { id: 'protectores', name: 'Protectores', icon: 'fa-shield-halved' },
        { id: 'accesorios', name: 'Accesorios', icon: 'fa-toolbox' },
        { id: 'textil', name: 'Textil Deportivo', icon: 'fa-shirt' },
        { id: 'zapatillas', name: 'Zapatillas', icon: 'fa-shoe-prints' },
        { id: 'packs', name: 'Packs Promocionales', icon: 'fa-box-open' },
        { id: 'clubes', name: 'Material para Clubes', icon: 'fa-building' }
    ];

    // Colaboradores y proveedores por defecto
    const DEFAULT_PARTNERS = [
        {
            id: 'partner-bullpadel',
            name: 'Bullpadel España',
            logoText: 'BP',
            contactPerson: 'Marc Soler',
            email: 'comercial.cat@bullpadel.com',
            phone: '+34 934 112 233',
            web: 'https://www.bullpadel.com',
            agreementType: 'Patrocinador Oro & Material Técnico',
            agreedCommission: '15%',
            renewalDate: '2027-06-30',
            internalNotes: 'Proveedor de palas de test y material para premios de Americanas élite. Descuento adicional 5% para monitores SomosPadel.',
            totalGeneratedSales: 4850,
            accumulatedCommission: 727.50
        },
        {
            id: 'partner-padelnuestro',
            name: 'Pádel Nuestro Barcelona',
            logoText: 'PN',
            contactPerson: 'Laura Méndez',
            email: 'bcn-partners@padelnuestro.com',
            phone: '+34 932 889 001',
            web: 'https://www.padelnuestro.com',
            agreementType: 'Afiliación Marketplace & Promociones',
            agreedCommission: '12%',
            renewalDate: '2027-12-31',
            internalNotes: 'Comisiones de afiliación pagaderas mensualmente. Cupón exclusivo SOMOSPADEL10 activo todo el año.',
            totalGeneratedSales: 6320,
            accumulatedCommission: 758.40
        },
        {
            id: 'partner-head',
            name: 'HEAD Padel & Balls',
            logoText: 'HD',
            contactPerson: 'Sergi Rovira',
            email: 'ventas@headpadel.es',
            phone: '+34 938 770 120',
            web: 'https://www.head.com',
            agreementType: 'Pelota Oficial Americanas SomosPadel',
            agreedCommission: '10%',
            renewalDate: '2027-09-15',
            internalNotes: 'Suministro de cajas de pelotas Head Padel Pro S a precio club cerrado con bonus por volumen semestral.',
            totalGeneratedSales: 3410,
            accumulatedCommission: 341.00
        },
        {
            id: 'partner-nox',
            name: 'NOX Sport BCN',
            logoText: 'NX',
            contactPerson: 'Jordi Vila',
            email: 'comercial@noxsport.es',
            phone: '+34 933 456 789',
            web: 'https://www.noxsport.es',
            agreementType: 'Colaborador Oficial Palas & Mochilas',
            agreedCommission: '14%',
            renewalDate: '2027-08-01',
            internalNotes: 'Test de palas serie Agustín Tapia AT10 en torneos organizados.',
            totalGeneratedSales: 3990,
            accumulatedCommission: 558.60
        },
        {
            id: 'partner-somospadel-merch',
            name: 'SomosPadel Merchandising Propio',
            logoText: 'SP',
            contactPerson: 'Álex Coscolín (Dirección)',
            email: 'direccion@somospadelbcn.com',
            phone: '+34 600 000 000',
            web: 'https://somospadelbcn.com',
            agreementType: 'Marca Propia & Merchandising Club',
            agreedCommission: '100%',
            renewalDate: '2030-01-01',
            internalNotes: 'Línea oficial de camisetas técnicas, sudaderas y protectores SomosPadel Barcelona. 100% de beneficio íntegro para el club.',
            totalGeneratedSales: 2150,
            accumulatedCommission: 2150.00
        }
    ];

    // Campañas promocionales activas por defecto
    const DEFAULT_PROMOTIONS = [
        {
            id: 'promo-exclusiva-jugadores',
            title: 'Descuento Exclusivo Jugadores SomosPadel',
            code: 'SOMOSPADEL15',
            discountText: '15% DTO EXTRA',
            validUntil: '2027-12-31',
            badge: 'EXCLUSIVO JUGADORES',
            description: 'Válido en compras directas y en tiendas colaboradoras acreditando tu ficha de SomosPadel BCN.',
            associatedProducts: ['prod-bullpadel-hack', 'prod-asics-gel-resolution', 'prod-sp-camiseta-tecnica']
        },
        {
            id: 'promo-oferta-semana',
            title: 'Oferta de la Semana',
            code: 'SEMANAPADEL',
            discountText: 'SUPER OFERTA',
            validUntil: '2026-10-14',
            badge: 'OFERTA DE LA SEMANA',
            description: 'Pack de overgrips perforados pro y protector ultra-resistente con precio rebajado temporal.',
            associatedProducts: ['prod-overgrips-wilson-12', 'prod-head-pro-s-bote']
        },
        {
            id: 'promo-mes-recomendado',
            title: 'Producto Recomendado del Mes',
            code: 'TOPMES',
            discountText: 'TOP DEL MES',
            validUntil: '2026-10-31',
            badge: 'RECOMENDADO DEL MES',
            description: 'Nox AT10 Genius 18K seleccionada por nuestros organizadores por su manejabilidad y salida de bola.',
            associatedProducts: ['prod-nox-at10-18k']
        },
        {
            id: 'promo-pelota-americanas',
            title: 'Producto Oficial de las Americanas',
            code: 'AMERICANASBALL',
            discountText: 'PELOTA OFICIAL',
            validUntil: '2027-06-30',
            badge: 'OFICIAL AMERICANAS',
            description: 'La pelota de competición utilizada en todas las pistas de Americanas SomosPadel Barcelona.',
            associatedProducts: ['prod-head-pro-s-bote', 'prod-cajon-24-head']
        }
    ];

    // Catálogo inicial con los 11 tipos requeridos
    const DEFAULT_PRODUCTS = [
        {
            id: 'prod-bullpadel-hack',
            name: 'Bullpadel Hack 03 2026',
            brand: 'Bullpadel',
            category: 'palas',
            description: 'Pala de máxima potencia y alto rendimiento diseñada para jugadores profesionales o avanzados. Balance alto, carbono Tricarbon y núcleo MultiEva con sistema Air React Channel.',
            originalPrice: 320.00,
            promoPrice: 249.00,
            externalLink: 'https://www.bullpadel.com/es/palas-pro/hack-03.html?ref=somospadel',
            partnerId: 'partner-bullpadel',
            featured: true,
            badges: ['Recomendado por SomosPadel', 'Oferta', 'Producto oficial'],
            image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                forma: 'Diamante (Potencia extrema)',
                balance: 'Alto (26.5 cm)',
                nucleo: 'MultiEva doble densidad',
                caras: 'Tricarbon 3D Rugoso',
                peso: '365 - 375 gramos',
                nivel: 'Avanzado / Competición Pro'
            },
            highlights: [
                'Sistema Air React Channel para mayor aerodinámica',
                'Protector Metalshield de aluminio ultraligero',
                'Grip Hesacore antivibración incluido de serie'
            ],
            variants: [
                { id: 'var-365', name: '365g (Equilibrado)', price: 249.00, originalPrice: 320.00 },
                { id: 'var-370', name: '370g (Más Pegada)', price: 249.00, originalPrice: 320.00 },
                { id: 'var-360', name: '360g (Ligera)', price: 249.00, originalPrice: 320.00 }
            ],
            playerReviews: [
                { name: 'Javier Navarro', level: 'Nivel 4.8 · Club Delfos', stars: 5, date: 'Hace 3 días', comment: 'Una auténtica bestia en los remates por 3 y víboras. El protector aguanta todo.' },
                { name: 'Pol Guitart', level: 'Nivel 4.2 · Prat Padel', stars: 5, date: 'Hace 1 semana', comment: 'Llegó en 24h para mi americana. Potencia brutal y tacto impecable.' }
            ],
            views: 420,
            clicks: 148,
            conversions: 18,
            commissionRate: 0.15
        },
        {
            id: 'prod-nox-at10-18k',
            name: 'NOX AT10 Genius 18K Agustín Tapia',
            brand: 'NOX',
            category: 'palas',
            description: 'La pala de Agustín Tapia para la temporada actual. Carbono aluminizado 18K y goma MLD Black Eva para una respuesta sólida en voleas y control quirúrgico desde el fondo.',
            originalPrice: 330.00,
            promoPrice: 265.00,
            externalLink: 'https://www.noxsport.es/products/at10-genius-18k?ref=somospadel',
            partnerId: 'partner-nox',
            featured: true,
            badges: ['Top ventas', 'Recomendado por SomosPadel'],
            image: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                forma: 'Gota / Lágrima (Polivalente)',
                balance: 'Medio (Control total)',
                nucleo: 'MLD Black Eva',
                caras: 'Carbon Alum 18K Rugoso',
                peso: '360 - 375 gramos',
                nivel: 'Avanzado / Profesional'
            },
            highlights: [
                'Diseñada y empuñada por el Mozart de Catamarca: Agustín Tapia',
                'Tecnología Pulse System que absorbe el 90% de vibraciones de codo',
                'SmartStrap: cordón de seguridad reemplazable higiénico'
            ],
            variants: [
                { id: 'var-nox-365', name: '365g (Estándar)', price: 265.00, originalPrice: 330.00 },
                { id: 'var-nox-370', name: '370g (Firme)', price: 265.00, originalPrice: 330.00 }
            ],
            playerReviews: [
                { name: 'Sergi Puig', level: 'Nivel 5.0 · SomosPadel Elite', stars: 5, date: 'Hace 2 días', comment: 'El punto dulce es descomunal. No fallas una bajada de pared.' },
                { name: 'Marta Soler', level: 'Nivel 4.0 · Hospitalet', stars: 5, date: 'Hace 5 días', comment: 'Cero dolor en el codo después de jugar 3 americanas seguidas.' }
            ],
            views: 512,
            clicks: 194,
            conversions: 24,
            commissionRate: 0.14
        },
        {
            id: 'prod-head-pro-s-bote',
            name: 'Pelotas HEAD Padel Pro S (Bote 3 Bolas)',
            brand: 'HEAD',
            category: 'pelotas',
            description: 'Pelota oficial del circuito y de las Americanas SomosPadel BCN. Núcleo presurizado reforzado y fieltro de alta visibilidad para un juego rápido, dinámico y con máximo rebote.',
            originalPrice: 6.95,
            promoPrice: 5.20,
            externalLink: 'https://www.head.com/padel/balls/padel-pro-s?ref=somospadel',
            partnerId: 'partner-head',
            featured: true,
            badges: ['Producto oficial', 'Top ventas', 'Oferta'],
            image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                tipo: 'Pelota rápida presurizada (Edición Speed)',
                homologacion: 'Oficial FEP / FIP / Torneos SomosPadel BCN',
                presentacion: 'Tubo presurizado al vacío (3 pelotas)',
                nucleo: 'Caucho técnico de alta densidad',
                fieltro: 'Fieltro sintético anti-humedad de máxima visibilidad',
                durabilidad: '3 - 4 partidos completos sin perder presión'
            },
            highlights: [
                'Pelota oficial en todas las Americanas y Torneos del club',
                'Velocidad y salida de bola óptima para pistas de Barcelona con humedad',
                'Homologada por la Federación Internacional de Pádel (FIP)'
            ],
            variants: [
                { id: 'var-bote-1', name: '1 Bote (3 Bolas)', price: 5.20, originalPrice: 6.95, badge: '-25% DTO' },
                { id: 'var-pack-3', name: 'Pack 3 Botes (9 Bolas)', price: 14.90, originalPrice: 20.85, badge: 'Ahorro Extra 🔥' },
                { id: 'var-cajon-24', name: 'Cajón 24 Botes (Club)', price: 118.00, originalPrice: 155.00, badge: 'Precio Mayorista' }
            ],
            playerReviews: [
                { name: 'Marc Ramos', level: 'Nivel 4.5 · Club Prat', stars: 5, date: 'Ayer', comment: 'La pelota con mejor bote y salida de pared. En Barcelona con humedad responde genial.' },
                { name: 'Laura Gómez', level: 'Nivel 3.5 · Hospitalet', stars: 5, date: 'Hace 4 días', comment: 'Compré 3 botes y llegaron rapidísimo al club antes de mi americana. Calidad 10/10.' },
                { name: 'David Ferrer', level: 'Nivel 4.1 · Delfos', stars: 5, date: 'Hace 1 semana', comment: 'Duran 3 partidos sin perder consistencia. La mejor opción calidad-precio.' }
            ],
            views: 890,
            clicks: 340,
            conversions: 85,
            commissionRate: 0.10
        },
        {
            id: 'prod-cajon-24-head',
            name: 'Cajón 24 Botes HEAD Padel Pro S',
            brand: 'HEAD',
            category: 'clubes',
            description: 'Cajón profesional de 24 botes para clubes, escuelas y organizadores de torneos. Precio exclusivo por volumen para colaboradores SomosPadel.',
            originalPrice: 155.00,
            promoPrice: 118.00,
            externalLink: 'https://www.head.com/padel/clubs/cajon-padel-pro-s?ref=somospadel',
            partnerId: 'partner-head',
            featured: false,
            badges: ['Oferta', 'Producto oficial', 'Precio Club'],
            image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                contenido: '24 Botes presurizados (72 pelotas en total)',
                homologacion: 'Oficial FEP / FIP',
                uso: 'Torneos, americanas y escuelas de competición',
                ahorro: '4.91€ por bote (precio directo distribuidor)'
            },
            highlights: [
                'Tarifa reducida exclusiva para directores de torneos y clubes socios',
                'Entrega paletizada protegida en 24h a pistas',
                'Factura oficial con IVA desglosado'
            ],
            variants: [
                { id: 'var-cajon-1', name: '1 Cajón (24 Botes)', price: 118.00, originalPrice: 155.00 },
                { id: 'var-cajon-2', name: '2 Cajones (48 Botes)', price: 228.00, originalPrice: 310.00, badge: 'Envío Gratis' }
            ],
            playerReviews: [
                { name: 'Alex Coscolín', level: 'Organizador SomosPadel BCN', stars: 5, date: 'Hace 3 días', comment: 'Imprescindible para los fines de semana. Las bolas siempre frescas al abrir el bote.' }
            ],
            views: 210,
            clicks: 65,
            conversions: 12,
            commissionRate: 0.10
        },
        {
            id: 'prod-paletero-bullpadel-tour',
            name: 'Paletero Bullpadel Tour BPN Pro',
            brand: 'Bullpadel',
            category: 'paleteros',
            description: 'Capacidad para 4 palas con compartimento térmico Thermo, bolsillo independiente y aireado para calzado y ropa usada. Materiales ultraligeros de alta resistencia.',
            originalPrice: 85.00,
            promoPrice: 64.90,
            externalLink: 'https://www.bullpadel.com/es/paleteros/tour-pro.html?ref=somospadel',
            partnerId: 'partner-bullpadel',
            featured: false,
            badges: ['Oferta', 'Recomendado por SomosPadel'],
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                capacidad: 'Hasta 4 palas + equipación completa',
                compartimentos: 'Térmico Thermo + zapatillero ventilado + accesorios',
                dimensiones: '60 x 30 x 40 cm',
                material: 'Poliéster 600D reforzado repelente al agua'
            },
            highlights: [
                'Aislamiento térmico para proteger la goma de tu pala del calor',
                'Asas ergonómicas acolchadas en formato mochila'
            ],
            playerReviews: [
                { name: 'Guillem B.', level: 'Nivel 4.4', stars: 5, date: 'Hace 1 semana', comment: 'Cabe absolutamente todo: 2 palas, zapatillas, toalla y neceser. Muy cómodo de llevar en moto.' }
            ],
            views: 310,
            clicks: 88,
            conversions: 14,
            commissionRate: 0.15
        },
        {
            id: 'prod-mochila-nox-pro',
            name: 'Mochila NOX Pro Series Urban',
            brand: 'NOX',
            category: 'mochilas',
            description: 'Mochila técnica compacta y ergonómica. Diseñada para llevar 1 pala protegida, portátil, zapatillas y equipación deportiva.',
            originalPrice: 59.95,
            promoPrice: 44.95,
            externalLink: 'https://www.noxsport.es/products/mochila-pro-series?ref=somospadel',
            partnerId: 'partner-nox',
            featured: false,
            badges: ['Top ventas'],
            image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                capacidad: '32 Litros',
                peso: '650 gramos',
                compartimentos: 'Pala acolchada + Calzado + Laptop 15" + Botella'
            },
            highlights: [
                'Diseño estilizado urbano apto para oficina y pista',
                'Espalda acolchada con canal de ventilación transpirable'
            ],
            playerReviews: [
                { name: 'Arnau F.', level: 'Nivel 3.8', stars: 5, date: 'Hace 4 días', comment: 'Perfecta si vas directo del trabajo a jugar la americana.' }
            ],
            views: 290,
            clicks: 92,
            conversions: 11,
            commissionRate: 0.14
        },
        {
            id: 'prod-overgrips-wilson-12',
            name: 'Overgrips Wilson Pro Comfort (Pack 12 uds)',
            brand: 'Wilson',
            category: 'overgrips',
            description: 'El overgrip número 1 preferido por los jugadores. Sensación de agarre insuperable, máxima absorción del sudor y grosor ultrafino.',
            originalPrice: 22.00,
            promoPrice: 16.50,
            externalLink: 'https://www.padelnuestro.com/overgrip-wilson-pro-12?ref=somospadel',
            partnerId: 'partner-padelnuestro',
            featured: true,
            badges: ['Top ventas', 'Oferta'],
            image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                unidades: '12 overgrips con cinta de cierre adhesiva',
                grosor: '0.6 mm (sensación táctil máxima)',
                tacto: 'Seco y absorbente (no resbala con sudor)'
            },
            highlights: [
                'Overgrip de referencia en el World Padel Tour y Premier Padel',
                'Fieltro ultra-elástico fácil de colocar sin arrugas'
            ],
            variants: [
                { id: 'var-wilson-blanco', name: 'Blanco Clásico (Pack 12)', price: 16.50, originalPrice: 22.00 },
                { id: 'var-wilson-negro', name: 'Negro Pro (Pack 12)', price: 16.50, originalPrice: 22.00 }
            ],
            playerReviews: [
                { name: 'Toni M.', level: 'Nivel 4.9', stars: 5, date: 'Hace 2 días', comment: 'El mejor overgrip que existe. No se me vuelve a girar la pala en volea.' }
            ],
            views: 640,
            clicks: 220,
            conversions: 46,
            commissionRate: 0.12
        },
        {
            id: 'prod-protector-3m-rugoso',
            name: 'Protector Marco 3M Rugoso Anti-Impactos',
            brand: 'SomosPadel',
            category: 'protectores',
            description: 'Protector adhesivo transparente con textura rugosa para salvaguardar el marco de la pala contra roces y golpes en pared o cristal.',
            originalPrice: 8.50,
            promoPrice: 5.90,
            externalLink: 'https://somospadelbcn.com/tienda/protector?ref=somospadel',
            partnerId: 'partner-somospadel-merch',
            featured: false,
            badges: ['Producto oficial', 'Recomendado por SomosPadel'],
            image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                adhesivo: 'Pegamento 3M extra fuerte de máxima fijación',
                textura: 'Superficie rugosa micro-hexagonal anti-arañazos',
                peso: 'Ligero (apenas 8g para no desbalancear la pala)'
            },
            highlights: [
                'Protege el marco de roturas en el cristal de pista',
                'Fácil de pegar con aire templado de secador'
            ],
            playerReviews: [
                { name: 'Raúl V.', level: 'Nivel 3.9', stars: 5, date: 'Hace 1 semana', comment: 'Me ha salvado la pala de un golpe directo contra la reja metálica.' }
            ],
            views: 395,
            clicks: 110,
            conversions: 35,
            commissionRate: 1.00
        },
        {
            id: 'prod-accesorios-munequeras',
            name: 'Pack Muñequeras Pro SomosPadel BCN (Par)',
            brand: 'SomosPadel',
            category: 'accesorios',
            description: 'Muñequeras deportivas de rizo de algodón de alta absorción bordadas con el emblema oficial de SomosPadel Barcelona.',
            originalPrice: 12.00,
            promoPrice: 8.90,
            externalLink: 'https://somospadelbcn.com/tienda/munequeras?ref=somospadel',
            partnerId: 'partner-somospadel-merch',
            featured: false,
            badges: ['Producto oficial'],
            image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                material: '80% Algodón rizado, 15% Nylon, 5% Elastano',
                longitud: '12 cm de cobertura de muñeca',
                presentacion: '2 unidades (un par)'
            },
            highlights: [
                'Emblema bordado en hilo neón de alta calidad',
                'Absorbe el sudor antes de que llegue a la empuñadura'
            ],
            playerReviews: [
                { name: 'Sara L.', level: 'Nivel 3.7', stars: 5, date: 'Hace 3 días', comment: 'Muy suaves y no aprietan de más. El logo queda brutal.' }
            ],
            views: 310,
            clicks: 75,
            conversions: 28,
            commissionRate: 1.00
        },
        {
            id: 'prod-sp-camiseta-tecnica',
            name: 'Camiseta Técnica Oficial SomosPadel 2026',
            brand: 'SomosPadel',
            category: 'textil',
            description: 'Equipación transpirable oficial confeccionada con tejido Dry-Cool antimicrobiano. Corte atlético para máxima movilidad en pista.',
            originalPrice: 32.00,
            promoPrice: 24.00,
            externalLink: 'https://somospadelbcn.com/tienda/camiseta-2026?ref=somospadel',
            partnerId: 'partner-somospadel-merch',
            featured: true,
            badges: ['Producto oficial', 'Recomendado por SomosPadel'],
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                tejido: '100% Poliéster microperforado Dry-Cool',
                corte: 'Athletic Fit (ajuste cómodo deportivo)',
                cuello: 'Redondo ergonómico anti-roces',
                tallas: 'S, M, L, XL, XXL'
            },
            highlights: [
                'Camiseta oficial usada por los monitores y jugadores de torneos',
                'Secado ultra rápido y transpirabilidad continua'
            ],
            variants: [
                { id: 'talla-s', name: 'Talla S', price: 24.00, originalPrice: 32.00 },
                { id: 'talla-m', name: 'Talla M', price: 24.00, originalPrice: 32.00 },
                { id: 'talla-l', name: 'Talla L', price: 24.00, originalPrice: 32.00 },
                { id: 'talla-xl', name: 'Talla XL', price: 24.00, originalPrice: 32.00 }
            ],
            playerReviews: [
                { name: 'Dani O.', level: 'Nivel 4.3', stars: 5, date: 'Hace 5 días', comment: 'Tejido comodísimo, no pesa nada y transpira genial con el calor.' }
            ],
            views: 740,
            clicks: 280,
            conversions: 52,
            commissionRate: 1.00
        },
        {
            id: 'prod-asics-gel-resolution',
            name: 'Zapatillas Asics Gel Resolution 9 Padel Clay',
            brand: 'Asics',
            category: 'zapatillas',
            description: 'Suela de espiga específica para pistas de pádel con arena. Tecnología Dynawall y amortiguación Gel para una estabilidad suprema en desplazamientos laterales.',
            originalPrice: 150.00,
            promoPrice: 119.00,
            externalLink: 'https://www.padelnuestro.com/asics-gel-resolution-9-clay?ref=somospadel',
            partnerId: 'partner-padelnuestro',
            featured: true,
            badges: ['Top ventas', 'Oferta'],
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                suela: 'Espiga profunda (Clay) para máximo agarre en césped con arena',
                amortiguacion: 'GEL visible en retropié y antepié',
                estabilidad: 'Tecnología Dynawall en mediopié para giros rápidos',
                peso: '385 gramos (talla 42)'
            },
            highlights: [
                'La zapatilla más estable y protectora de tobillos del circuito',
                'Puntera PGuard reforzada resistente a arrastres en pista'
            ],
            variants: [
                { id: 'talla-41', name: 'Talla 41 EU', price: 119.00, originalPrice: 150.00 },
                { id: 'talla-42', name: 'Talla 42 EU', price: 119.00, originalPrice: 150.00 },
                { id: 'talla-43', name: 'Talla 43 EU', price: 119.00, originalPrice: 150.00 },
                { id: 'talla-44', name: 'Talla 44 EU', price: 119.00, originalPrice: 150.00 }
            ],
            playerReviews: [
                { name: 'Carles M.', level: 'Nivel 4.6', stars: 5, date: 'Hace 3 días', comment: 'Agarre bestial en césped. Cero resbalones y amortigua perfecto los saltos.' }
            ],
            views: 580,
            clicks: 175,
            conversions: 21,
            commissionRate: 0.12
        },
        {
            id: 'prod-pack-iniciacion-somospadel',
            name: 'Pack Élite Jugador SomosPadel BCN',
            brand: 'SomosPadel',
            category: 'packs',
            description: 'Incluye Pala Bullpadel Hack 03 + Mochila NOX + Bote Pelotas HEAD Pro S + Camiseta Técnica SomosPadel Oficial con precio de ahorro especial.',
            originalPrice: 420.00,
            promoPrice: 329.00,
            externalLink: 'https://somospadelbcn.com/tienda/pack-elite?ref=somospadel',
            partnerId: 'partner-somospadel-merch',
            featured: true,
            badges: ['Oferta', 'Recomendado por SomosPadel', 'Producto oficial'],
            image: 'img/blog_racket_ball.png',
            gallery: [
                'img/blog_racket_ball.png',
                'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
            ],
            specs: {
                incluye: 'Pala Bullpadel Hack 03 + Mochila NOX Urban + Bote HEAD Pro S + Camiseta Técnica',
                ahorro_total: '91.00€ de ahorro frente a compra individual',
                regalo: 'Overgrip Wilson y Protector 3M incluidos de regalo'
            },
            highlights: [
                'El equipamiento definitivo para competir en todas las americanas',
                'Garantía total de 3 años y entrega en pistas del club'
            ],
            playerReviews: [
                { name: 'Ignasi S.', level: 'Nivel 4.0', stars: 5, date: 'Hace 6 días', comment: 'El pack más completo. Te ahorras casi 100€ y la equipación es de primera.' }
            ],
            views: 820,
            clicks: 310,
            conversions: 19,
            commissionRate: 0.25
        }
    ];

    class TiendaServiceClass {
        constructor() {
            this.initData();
        }

        initData() {
            try {
                const storedRaw = localStorage.getItem(STORAGE_KEY_PRODS);
                let storedProds = null;
                if (storedRaw) {
                    try { storedProds = JSON.parse(storedRaw); } catch (e) {}
                }

                if (!storedProds || !Array.isArray(storedProds) || storedProds.length === 0) {
                    localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(DEFAULT_PRODUCTS));
                } else {
                    // Auto-heal broken images and enrich products with specs, variants and reviews
                    let needsSave = false;
                    storedProds = storedProds.map(p => {
                        const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
                        if (def) {
                            let updated = { ...p };
                            // Heal broken or missing images or legacy court images
                            if (!updated.image || updated.image.includes('photo-1568800262145') || updated.image.includes('photo-1517649763962') || (p.id === 'prod-pack-iniciacion-somospadel' && updated.image.includes('photo-1554068865-24cecd4e34b8'))) {
                                updated.image = def.image;
                                needsSave = true;
                            }
                            if (!updated.gallery || !updated.gallery.length || updated.gallery.some(g => g.includes('photo-1568800262145') || g.includes('photo-1517649763962')) || (p.id === 'prod-pack-iniciacion-somospadel' && updated.gallery.some(g => g.includes('photo-1554068865-24cecd4e34b8')))) {
                                updated.gallery = def.gallery;
                                needsSave = true;
                            }
                            if (!updated.specs && def.specs) { updated.specs = def.specs; needsSave = true; }
                            if (!updated.highlights && def.highlights) { updated.highlights = def.highlights; needsSave = true; }
                            if (!updated.variants && def.variants) { updated.variants = def.variants; needsSave = true; }
                            if (!updated.playerReviews && def.playerReviews) { updated.playerReviews = def.playerReviews; needsSave = true; }
                            return updated;
                        }
                        return p;
                    });
                    if (needsSave) {
                        localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(storedProds));
                    }
                }

                if (!localStorage.getItem(STORAGE_KEY_PARTNERS)) {
                    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(DEFAULT_PARTNERS));
                }
                if (!localStorage.getItem(STORAGE_KEY_PROMOS)) {
                    localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(DEFAULT_PROMOTIONS));
                }
                if (!localStorage.getItem(STORAGE_KEY_ROLE)) {
                    localStorage.setItem(STORAGE_KEY_ROLE, 'SuperAdmin');
                }
            } catch (e) {
                console.warn('[TiendaService] Error accediendo a localStorage:', e);
            }
        }

        // ==========================================
        // FAVORITOS / WISHLIST
        // ==========================================
        getFavorites() {
            try {
                const raw = localStorage.getItem('sp_tienda_favorites');
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return [];
            }
        }

        isFavorite(productId) {
            const favs = this.getFavorites();
            return favs.includes(productId);
        }

        toggleFavorite(productId) {
            let favs = this.getFavorites();
            let isFav = false;
            if (favs.includes(productId)) {
                favs = favs.filter(id => id !== productId);
                isFav = false;
            } else {
                favs.push(productId);
                isFav = true;
            }
            try {
                localStorage.setItem('sp_tienda_favorites', JSON.stringify(favs));
            } catch (e) {}
            return isFav;
        }

        // ==========================================
        // ROLES & PERMISOS
        // ==========================================
        getCurrentRole() {
            try {
                // Verificar si hay rol en Store global de la app
                const currentUser = window.Store?.getState?.('currentUser');
                if (currentUser && currentUser.tiendaRole) {
                    return currentUser.tiendaRole;
                }
                return localStorage.getItem(STORAGE_KEY_ROLE) || 'SuperAdmin';
            } catch (e) {
                return 'SuperAdmin';
            }
        }

        setCurrentRole(role) {
            try {
                localStorage.setItem(STORAGE_KEY_ROLE, role);
            } catch (e) {}
        }

        hasPermission(action) {
            const role = this.getCurrentRole();
            switch (role) {
                case 'SuperAdmin':
                    return true;
                case 'Administrador':
                    return true;
                case 'Comercial SomosPadel BCN':
                    return ['manage_products', 'manage_partners', 'manage_promos', 'view_analytics'].includes(action);
                case 'Organizador SomosPadel BCN':
                    return ['view_products', 'view_partners', 'view_promos', 'assign_event_sponsors'].includes(action);
                case 'Jugador':
                default:
                    return ['view_products', 'share_products', 'click_external'].includes(action);
            }
        }

        // ==========================================
        // CATEGORÍAS & PRODUCTOS
        // ==========================================
        getCategories() {
            return CATEGORIES;
        }

        getProducts() {
            try {
                const data = localStorage.getItem(STORAGE_KEY_PRODS);
                const prods = data ? JSON.parse(data) : DEFAULT_PRODUCTS;
                return prods.map(p => ({
                    ...p,
                    stock: typeof p.stock === 'number' ? p.stock : 12,
                    active: p.active !== false
                }));
            } catch (e) {
                return DEFAULT_PRODUCTS.map(p => ({
                    ...p,
                    stock: typeof p.stock === 'number' ? p.stock : 12,
                    active: p.active !== false
                }));
            }
        }

        getProductById(id) {
            const products = this.getProducts();
            return products.find(p => p.id === id) || null;
        }

        saveProduct(productData) {
            const products = this.getProducts();
            const index = products.findIndex(p => p.id === productData.id);
            const sanitized = {
                ...productData,
                stock: typeof productData.stock === 'number' ? productData.stock : (parseInt(productData.stock, 10) || 10),
                active: productData.active !== false
            };
            if (index >= 0) {
                products[index] = { ...products[index], ...sanitized };
            } else {
                sanitized.id = sanitized.id || `prod-${Date.now()}`;
                sanitized.views = 0;
                sanitized.clicks = 0;
                sanitized.conversions = 0;
                products.unshift(sanitized);
            }
            try {
                localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
            } catch (e) {
                console.error('[TiendaService] Error guardando producto:', e);
            }
            return sanitized;
        }

        deleteProduct(id) {
            let products = this.getProducts();
            products = products.filter(p => p.id !== id);
            try {
                localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
            } catch (e) {}
            return true;
        }

        // ==========================================
        // PROVEEDORES & COLABORADORES
        // ==========================================
        getPartners() {
            try {
                const data = localStorage.getItem(STORAGE_KEY_PARTNERS);
                return data ? JSON.parse(data) : DEFAULT_PARTNERS;
            } catch (e) {
                return DEFAULT_PARTNERS;
            }
        }

        getPartnerById(id) {
            const partners = this.getPartners();
            return partners.find(p => p.id === id) || null;
        }

        savePartner(partnerData) {
            const partners = this.getPartners();
            const index = partners.findIndex(p => p.id === partnerData.id);
            if (index >= 0) {
                partners[index] = { ...partners[index], ...partnerData };
            } else {
                partnerData.id = partnerData.id || `partner-${Date.now()}`;
                partnerData.totalGeneratedSales = partnerData.totalGeneratedSales || 0;
                partnerData.accumulatedCommission = partnerData.accumulatedCommission || 0;
                partners.unshift(partnerData);
            }
            try {
                localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
            } catch (e) {}
            return partnerData;
        }

        deletePartner(id) {
            let partners = this.getPartners();
            partners = partners.filter(p => p.id !== id);
            try {
                localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
            } catch (e) {}
            return true;
        }

        // ==========================================
        // PROMOCIONES
        // ==========================================
        getPromotions() {
            try {
                const data = localStorage.getItem(STORAGE_KEY_PROMOS);
                return data ? JSON.parse(data) : DEFAULT_PROMOTIONS;
            } catch (e) {
                return DEFAULT_PROMOTIONS;
            }
        }

        savePromotion(promoData) {
            const promos = this.getPromotions();
            const index = promos.findIndex(p => p.id === promoData.id);
            if (index >= 0) {
                promos[index] = { ...promos[index], ...promoData };
            } else {
                promoData.id = promoData.id || `promo-${Date.now()}`;
                promos.unshift(promoData);
            }
            try {
                localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos));
            } catch (e) {}
            return promoData;
        }

        deletePromotion(id) {
            let promos = this.getPromotions();
            promos = promos.filter(p => p.id !== id);
            try {
                localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos));
            } catch (e) {}
            return true;
        }

        // ==========================================
        // GESTIÓN DE STOCK & ESTADO DE PRODUCTOS
        // ==========================================
        updateProductStock(productId, deltaOrQty, isDelta = false) {
            const products = this.getProducts();
            const p = products.find(x => x.id === productId);
            if (!p) return null;

            if (isDelta) {
                p.stock = Math.max(0, (p.stock || 0) + deltaOrQty);
            } else {
                p.stock = Math.max(0, parseInt(deltaOrQty, 10) || 0);
            }

            try {
                localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
            } catch (e) {}
            return p;
        }

        toggleProductActive(productId) {
            const products = this.getProducts();
            const p = products.find(x => x.id === productId);
            if (!p) return null;

            p.active = !p.active;
            try {
                localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
            } catch (e) {}
            return p;
        }

        toggleProductFeatured(productId) {
            const products = this.getProducts();
            const p = products.find(x => x.id === productId);
            if (!p) return null;

            p.featured = !p.featured;
            try {
                localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
            } catch (e) {}
            return p;
        }

        // ==========================================
        // 🛒 GESTIÓN DE PEDIDOS Y VENTAS (ÓRDENES)
        // ==========================================
        getOrders() {
            try {
                const data = localStorage.getItem(STORAGE_KEY_ORDERS);
                return data ? JSON.parse(data) : DEFAULT_ORDERS;
            } catch (e) {
                return DEFAULT_ORDERS;
            }
        }

        getOrderById(id) {
            const orders = this.getOrders();
            return orders.find(o => o.id === id) || null;
        }

        saveOrder(orderData) {
            const orders = this.getOrders();
            const index = orders.findIndex(o => o.id === orderData.id);
            if (index >= 0) {
                orders[index] = { ...orders[index], ...orderData };
            } else {
                orderData.id = orderData.id || `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                orderData.date = orderData.date || new Date().toISOString().replace('T', ' ').substring(0, 16);
                orders.unshift(orderData);
            }
            try {
                localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
            } catch (e) {
                console.error('[TiendaService] Error guardando pedido:', e);
            }
            return orderData;
        }

        updateOrderStatus(orderId, newStatus) {
            const orders = this.getOrders();
            const order = orders.find(o => o.id === orderId);
            if (!order) return null;

            order.status = newStatus;
            try {
                localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
            } catch (e) {}
            return order;
        }

        deleteOrder(orderId) {
            let orders = this.getOrders();
            orders = orders.filter(o => o.id !== orderId);
            try {
                localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
            } catch (e) {}
            return true;
        }

        // ==========================================
        // ⚙️ AJUSTES & CONFIGURACIÓN DE LA TIENDA
        // ==========================================
        getSettings() {
            try {
                const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
                return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
            } catch (e) {
                return DEFAULT_SETTINGS;
            }
        }

        saveSettings(settingsData) {
            const current = this.getSettings();
            const updated = { ...current, ...settingsData };
            try {
                localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
            } catch (e) {}
            return updated;
        }

        // ==========================================
        // 🔒 SEGURIDAD & AUTENTICACIÓN ADMIN TIENDA
        // Contraseña oficial: "PADEL21"
        // ==========================================
        getAdminPassword() {
            return TIENDA_ADMIN_PASSWORD;
        }

        verifyAdminPassword(password) {
            return String(password || '').trim() === TIENDA_ADMIN_PASSWORD;
        }

        isStoreAdminAuthenticated() {
            try {
                return sessionStorage.getItem(SESSION_AUTH_KEY) === TIENDA_ADMIN_PASSWORD;
            } catch (e) {
                return false;
            }
        }

        loginStoreAdmin(password) {
            if (this.verifyAdminPassword(password)) {
                try {
                    sessionStorage.setItem(SESSION_AUTH_KEY, TIENDA_ADMIN_PASSWORD);
                } catch (e) {}
                return true;
            }
            return false;
        }

        logoutStoreAdmin() {
            try {
                sessionStorage.removeItem(SESSION_AUTH_KEY);
            } catch (e) {}
            return true;
        }

        // ==========================================
        // 🔄 RESTAURACIÓN & EXPORTACIÓN / IMPORTACIÓN
        // ==========================================
        resetToDefaults() {
            try {
                localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(DEFAULT_PRODUCTS));
                localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(DEFAULT_PARTNERS));
                localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(DEFAULT_PROMOTIONS));
                localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));
                localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
                return true;
            } catch (e) {
                console.error('[TiendaService] Error al restaurar valores por defecto:', e);
                return false;
            }
        }

        exportFullBackup() {
            return {
                timestamp: new Date().toISOString(),
                store: this.getSettings(),
                products: this.getProducts(),
                partners: this.getPartners(),
                promotions: this.getPromotions(),
                orders: this.getOrders()
            };
        }

        importBackup(backupData) {
            if (!backupData || typeof backupData !== 'object') return false;
            try {
                if (Array.isArray(backupData.products)) {
                    localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(backupData.products));
                }
                if (Array.isArray(backupData.partners)) {
                    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(backupData.partners));
                }
                if (Array.isArray(backupData.promotions)) {
                    localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(backupData.promotions));
                }
                if (Array.isArray(backupData.orders)) {
                    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(backupData.orders));
                }
                if (backupData.store && typeof backupData.store === 'object') {
                    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(backupData.store));
                }
                return true;
            } catch (e) {
                console.error('[TiendaService] Error importando backup:', e);
                return false;
            }
        }

        // ==========================================
        // TRACKING DE VISITAS, CLICS Y CONVERSIONES
        // ==========================================
        recordView(productId) {
            const products = this.getProducts();
            const p = products.find(x => x.id === productId);
            if (p) {
                p.views = (p.views || 0) + 1;
                try {
                    localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
                } catch (e) {}
            }
        }

        recordClick(productId) {
            const products = this.getProducts();
            const p = products.find(x => x.id === productId);
            if (p) {
                p.clicks = (p.clicks || 0) + 1;
                try {
                    localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
                } catch (e) {}
            }
        }

        recordConversion(productId, saleAmount = null) {
            const products = this.getProducts();
            const p = products.find(x => x.id === productId);
            if (p) {
                p.conversions = (p.conversions || 0) + 1;
                const sale = saleAmount || p.promoPrice || p.originalPrice || 50;
                const commission = sale * (p.commissionRate || 0.12);

                // Actualizar en el partner correspondiente
                if (p.partnerId) {
                    const partners = this.getPartners();
                    const partner = partners.find(pt => pt.id === p.partnerId);
                    if (partner) {
                        partner.totalGeneratedSales = (partner.totalGeneratedSales || 0) + sale;
                        partner.accumulatedCommission = (partner.accumulatedCommission || 0) + commission;
                        try {
                            localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
                        } catch (e) {}
                    }
                }

                try {
                    localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(products));
                } catch (e) {}
            }
        }

        // ==========================================
        // CÁLCULO DE ANALÍTICAS Y PANEL ECONÓMICO
        // ==========================================
        getAnalytics(period = 'monthly') {
            const products = this.getProducts();
            const partners = this.getPartners();

            let factor = 1.0;
            if (period === 'monthly') factor = 0.35;
            else if (period === 'quarterly') factor = 0.65;
            else if (period === 'annual') factor = 0.90;
            else factor = 1.0; // total / histórico

            let totalProducts = products.length;
            let featuredCount = products.filter(p => p.featured).length;

            let totalViews = Math.round(products.reduce((acc, p) => acc + (p.views || 0), 0) * factor);
            let totalClicks = Math.round(products.reduce((acc, p) => acc + (p.clicks || 0), 0) * factor);
            let totalConversions = Math.round(products.reduce((acc, p) => acc + (p.conversions || 0), 0) * factor);

            let totalSalesAmount = Math.round(partners.reduce((acc, pt) => acc + (pt.totalGeneratedSales || 0), 0) * factor);
            let totalCommissions = Math.round(partners.reduce((acc, pt) => acc + (pt.accumulatedCommission || 0), 0) * factor);

            // Producto más visitado
            const sortedByViews = [...products].sort((a, b) => (b.views || 0) - (a.views || 0));
            const topProduct = sortedByViews[0] || null;

            // Proveedor más visitado / con más ventas
            const sortedPartners = [...partners].sort((a, b) => (b.totalGeneratedSales || 0) - (a.totalGeneratedSales || 0));
            const topPartner = sortedPartners[0] || null;

            const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;

            return {
                period,
                totalProducts,
                featuredCount,
                totalViews,
                totalClicks,
                ctr,
                totalConversions,
                totalSalesAmount,
                totalCommissions,
                topProduct,
                topPartner,
                productsTable: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    partnerName: partners.find(pt => pt.id === p.partnerId)?.name || 'SomosPadel',
                    views: Math.round((p.views || 0) * factor),
                    clicks: Math.round((p.clicks || 0) * factor),
                    conversions: Math.round((p.conversions || 0) * factor),
                    commission: Math.round(((p.conversions || 0) * (p.promoPrice || 50) * (p.commissionRate || 0.12)) * factor)
                })),
                partnersTable: partners.map(pt => ({
                    id: pt.id,
                    name: pt.name,
                    agreementType: pt.agreementType,
                    commissionRate: pt.agreedCommission,
                    totalSales: Math.round((pt.totalGeneratedSales || 0) * factor),
                    commission: Math.round((pt.accumulatedCommission || 0) * factor)
                }))
            };
        }

        // ==========================================
        // COMPARTIR EN REDES SOCIALES (WHATSAPP, IG, FB)
        // ==========================================
        getSharePayload(productId) {
            const product = this.getProductById(productId);
            if (!product) return null;

            const appBaseUrl = window.location.origin + window.location.pathname;
            const productDeepLink = `${appBaseUrl}#tienda?producto=${product.id}`;

            const textWhatsApp = `🎾 *¡Mira este producto en la TIENDA SOMOSPADEL BCN!* 🎾\n\n` +
                `⭐ *${product.brand} - ${product.name}*\n` +
                `🔥 Precio Exclusivo Comunidad: *${product.promoPrice}€* (Antes ${product.originalPrice}€)\n` +
                `🏷️ ${product.badges.join(' | ')}\n\n` +
                `👉 Descúbrelo aquí con descuento exclusivo:\n${productDeepLink}\n\n` +
                `_SomosPadel Barcelona - La mayor comunidad de pádel_`;

            const textInstagram = `🎾 TIENDA OFICIAL SOMOSPADEL BCN 🎾\n\n` +
                `⭐ ${product.brand} ${product.name}\n` +
                `💥 ${product.promoPrice}€ (PVP ${product.originalPrice}€)\n` +
                `🔥 Descuento y ventajas exclusivas para jugadores de SomosPadel Barcelona.\n\n` +
                `🔗 Enlace directo en nuestra app: ${productDeepLink}\n\n` +
                `#SomosPadelBCN #PadelBarcelona #PadelStore #OfertasPadel #${product.brand.replace(/\s+/g, '')}`;

            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productDeepLink)}&quote=${encodeURIComponent(`Ofertón en SomosPadel BCN: ${product.name} a solo ${product.promoPrice}€`)}`;

            return {
                product,
                productDeepLink,
                textWhatsApp,
                textInstagram,
                facebookUrl
            };
        }

        // ==========================================
        // 🛒 CARRITO DE COMPRAS DE E-COMMERCE
        // ==========================================
        getCart() {
            try {
                const data = localStorage.getItem('sp_tienda_cart');
                return data ? JSON.parse(data) : [];
            } catch (e) {
                return [];
            }
        }

        saveCart(cart) {
            try {
                localStorage.setItem('sp_tienda_cart', JSON.stringify(cart));
            } catch (e) {}
        }

        addToCart(productId, qty = 1) {
            const product = this.getProductById(productId);
            if (!product) return false;

            const cart = this.getCart();
            const existing = cart.find(item => item.id === productId);

            if (existing) {
                existing.qty = Math.min((existing.qty || 1) + qty, product.stock || 99);
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    price: product.promoPrice,
                    image: product.image,
                    qty: qty,
                    stock: product.stock || 12
                });
            }

            this.saveCart(cart);
            return true;
        }

        updateCartQty(productId, qty) {
            let cart = this.getCart();
            const item = cart.find(i => i.id === productId);
            if (item) {
                if (qty <= 0) {
                    cart = cart.filter(i => i.id !== productId);
                } else {
                    item.qty = Math.min(qty, item.stock || 99);
                }
                this.saveCart(cart);
            }
            return cart;
        }

        removeFromCart(productId) {
            let cart = this.getCart();
            cart = cart.filter(i => i.id !== productId);
            this.saveCart(cart);
            return cart;
        }

        clearCart() {
            this.saveCart([]);
            return [];
        }

        getCartSummary() {
            const cart = this.getCart();
            const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
            const subtotal = Math.round(cart.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 1)), 0) * 100) / 100;
            const settings = this.getSettings();
            const freeThreshold = settings.freeShippingThreshold || 50;
            const shippingCost = subtotal >= freeThreshold || count === 0 ? 0 : (settings.shippingCost || 4.95);
            const total = Math.round((subtotal + shippingCost) * 100) / 100;

            return {
                cart,
                count,
                subtotal,
                shippingCost,
                freeThreshold,
                remainingForFree: Math.max(0, Math.round((freeThreshold - subtotal) * 100) / 100),
                total
            };
        }
    }

    return new TiendaServiceClass();
}));
