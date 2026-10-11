/**
 * admin-marketing.js
 * Módulo de Marketing Estratégico & Coopatrocinios (SomosPadel Barcelona)
 * 
 * Acceso protegido de Superadmin (Contraseña: "NOA21")
 * 
 * Características:
 * 1. Vault de Seguridad Superadmin con persistencia en sessionStorage
 * 2. Dossier Ejecutivo y Pitch Deck Interactivo de 7 Slides (STK × SomosPadel)
 * 3. Textos y cartas formales post-reunión copiables en 1 clic (Email, WhatsApp, Elevator Pitch)
 * 4. Plan de Activaciones con Matriz de Fases y Checklist interactivo persistido
 * 5. Showcase Digital interactivo (Simulación de integración en App PWA)
 * 6. Calculadora de Retorno e Impactos y Bloc de Notas de Negociación persistido
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AdminMarketing = factory();
        if (!root.AdminViews) root.AdminViews = {};
        root.AdminViews.marketing = () => root.AdminMarketing.init();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SUPERADMIN_PASS = 'NOA21';
    const SESSION_KEY = 'sp_marketing_unlocked';
    const STORAGE_TASKS_KEY = 'sp_marketing_tasks_v1';
    const STORAGE_NOTES_KEY = 'sp_marketing_meeting_notes_v1';
    const STORAGE_CUSTOM_TEXTS_KEY = 'sp_marketing_custom_texts_v1';

    class AdminMarketingController {
        constructor() {
            this.containerId = 'content-area';
            this.currentTab = 'dossier'; // 'dossier' | 'activaciones' | 'app_showcase' | 'roi_calc'
            this.dossierMode = 'slides'; // 'slides' | 'executive' | 'texts' | 'custom' | 'editor'
            this.currentSlide = 0;
            this.totalSlides = 7;
            this.activeAppMockup = 'banner'; // 'banner' | 'push' | 'store'
            this.keyListenerAttached = false;
            this.isInlineEditMode = false;
            this.proposalData = this.loadProposalData();
            this.customTexts = this.loadCustomTexts();
        }

        escapeForJs(str) {
            if (!str) return '';
            return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        stripHtml(html) {
            if (!html) return '';
            return String(html)
                .replace(/<br\s*[\/]?>/gi, '\n')
                .replace(/<\/?[^>]+(>|$)/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
        }

        cleanForEditor(str) {
            return this.stripHtml(str);
        }

        formatDisplayText(val) {
            if (!val) return '';
            if (val.includes('\n') && !/<br\s*[\/]?>/i.test(val)) {
                return val.replace(/\r\n|\r|\n/g, '<br/>');
            }
            return val;
        }

        getDefaultTexts(proposalData = this.proposalData) {
            const data = proposalData || {};
            const brand = data.brandName || 'STK (Shot To Kill)';
            const venue = data.venueMain || 'Barcelona Pádel El Prat';
            const contact = data.brandContact || 'Kilian Caro / Equipo STK';
            const contactRole = data.brandContactRole || 'Dirección Comercial & Alianzas';
            const sender = data.senderName || 'Alex Coscolin';
            const senderRole = data.senderRole || 'Fundador & Coordinador General';

            return {
                // PÁGINA 1: PORTADA
                p1_badge_confidential: 'DOCUMENTO CONFIDENCIAL',
                p1_subbadge: 'PROPUESTA ESTRATÉGICA DE COOPATROCINIO & ACTIVACIÓN DE MARCA',
                p1_brand_name: brand,
                p1_club_name: 'SOMOSPADEL BCN',
                p1_motto: '"Retorno real en ventas, comunidad activa de pádel y tecnología propia en pista".',
                p1_card1_val: '+200',
                p1_card1_lbl: 'Jugadores Activos / Sem.',
                p1_card1_sub: 'Compradores y prescriptores',
                p1_card2_val: '8 Equipos',
                p1_card2_lbl: 'Liga Summa Pádel',
                p1_card2_sub: 'Competición por equipos',
                p1_card3_val: '100% PWA',
                p1_card3_lbl: 'App Móvil Propia',
                p1_card3_sub: 'Canal directo sin intermediarios',

                // PÁGINA 2: COMUNIDAD & MÉTRICAS
                p2_section_header: 'QUIÉNES SOMOS & LA FUERZA DE NUESTRA COMUNIDAD',
                p2_exec_title: '1. Resumen Ejecutivo',
                p2_exec_p1: `<strong>SomosPadel Barcelona</strong> es una de las comunidades deportivas con mayor tracción, fidelización y actividad continua de Barcelona y el Baix Llobregat. Con base de operaciones y sede central de entrenamientos en <strong>${venue}</strong>, dinamizamos de forma permanente a más de <strong>190 - 200 jugadores activos semanales</strong>, coordinando <strong>8 equipos oficiales en la Liga Summa Pádel</strong> y gestionando todo nuestro ecosistema mediante tecnología propia.`,
                p2_exec_p2: `La presente propuesta formal plantea la incorporación de <strong>${brand}</strong> como <strong>Pala Oficial & Marca Deportiva Co-Patrocinadora</strong> de nuestra comunidad. No buscamos un patrocinio pasivo de logo invisible: construimos una maquinaria de prescripción en pista para que el jugador pruebe vuestras palas y las compre.`,
                p2_metrics_title: '2. Métricas y Alcance Clave',
                p2_metric1_val: '+190-200',
                p2_metric1_lbl: 'Jugadores Activos / Sem.',
                p2_metric1_desc: 'Compradores recurrentes en pista semana tras semana.',
                p2_metric2_val: '8 Equipos',
                p2_metric2_lbl: 'Liga Summa Pádel',
                p2_metric2_desc: '8 Equipos compitiendo frente a más de 1.200 rivales.',
                p2_metric3_val: '3 Sedes',
                p2_metric3_lbl: 'Hubs Barcelona',
                p2_metric3_desc: "El Prat (Central) + Cornellà y L'Hospitalet.",
                p2_metric4_val: '52 Semanas',
                p2_metric4_lbl: 'Actividad Continua',
                p2_metric4_desc: 'Entrenamientos dirigidos, americanas y torneos todo el año.',
                p2_player_title: '🎯 El Poder de Prescripción del Jugador SomosPadel',
                p2_player_item1: '<strong>Poder Adquisitivo Medio-Alto:</strong> Perfil de 25 a 55 años con gasto anual medio en equipamiento de pádel superior a 450 €.',
                p2_player_item2: '<strong>Tasa de Renovación Acelerada:</strong> Renuevan de 1 a 2 palas por temporada debido a la alta intensidad de partidos (3-5 partidos/semana).',
                p2_player_item3: '<strong>Efecto Rebaño Inmediato:</strong> Cuando Alex Coscolin o los capitanes de equipo recomiendan y ponen una pala de test en la mano del jugador, la confianza se traduce en compra instantánea.',

                // PÁGINA 3: TECNOLOGÍA APP
                p3_section_header: 'EL FACTOR DIFERENCIAL DEFINITIVO: LA APP SOMOSPADEL',
                p3_tech_title: 'La Plataforma Tecnológica que Ningún Otro Club Posee',
                p3_intro: 'A diferencia del 99% de monitores y clubes que gestionan a sus jugadores en grupos caóticos de WhatsApp de 500 personas (donde los mensajes publicitarios se pierden en 30 segundos), SomosPadel ha desarrollado su <strong>propia plataforma de software PWA nativa</strong> instalada en la pantalla de inicio del smartphone de cada jugador.',
                p3_asset1_title: 'Banner Oficial en la Home',
                p3_asset1_desc: `Presencia visual monopolizada en la pantalla principal de la app. Cada vez que un jugador entra a ver su horario de entreno o pista, visualiza el logotipo y llamada a la acción de <strong>${brand}</strong>.`,
                p3_asset2_title: 'Tienda Oficial Integrada',
                p3_asset2_desc: 'Catálogo completo de palas y accesorios dentro de la app con fotos de alta definición, PVP especial club y botón 1-clic de pedido directo y reserva sin intermediarios.',
                p3_asset3_title: 'Avisos Push & Comunicaciones',
                p3_asset3_desc: 'Envío de alertas directas a los dispositivos convocando a los Test Days en Barcelona Pádel El Prat y anunciando lanzamientos de producto y descuentos exclusivos.',
                p3_asset4_title: 'Algoritmo ELO Propio',
                p3_asset4_desc: 'Motor de cálculo de nivel deportivo en tiempo real tras cada americana. Genera una hiper-frecuencia de apertura: <strong>más de 2.400 accesos al mes</strong> de jugadores consultando sus puntos.',
                p3_banner_tag: 'CANAL CAUTIVO Y PRIVADO',
                p3_banner_title: 'Impacto Publicitario 100% Medible',
                p3_banner_subtitle: 'Cero algoritmos de redes sociales. Tu marca llega directamente al teléfono del jugador.',
                p3_banner_metric_val: '+2.400',
                p3_banner_metric_lbl: 'Aperturas App / mes',

                // PÁGINA 4: COMPARATIVA & 5 PILARES
                p4_section_header: 'POR QUÉ SOMOSPADEL vs PATROCINIO TRADICIONAL',
                p4_comp_th_pro: 'PATROCINIO TRADICIONAL (1 JUGADOR PRO)',
                p4_comp_th_sp: 'COOPATROCINIO SOMOSPADEL (+200 JUGADORES)',
                p4_comp_row1_pro: '❌ Inversión elevada con logo pequeño en camiseta visible solo en fotos.',
                p4_comp_row1_sp: '✅ Inversión ágil y basada en producto con presencia activa en pista.',
                p4_comp_row2_pro: '❌ El aficionado ve la pala desde la grada o TV sin poder tocarla.',
                p4_comp_row2_sp: '✅ 200 jugadores prueban físicamente las palas en cada entrenamiento.',
                p4_comp_row3_pro: '❌ Cero canal de venta directo (esperar a que vayan a una tienda).',
                p4_comp_row3_sp: '✅ Canal de compra directa en la App SomosPadel en 1 clic.',
                p4_comp_row4_pro: '❌ Retorno de inversión prácticamente imposible de medir.',
                p4_comp_row4_sp: '✅ Métricas semanales: palas probadas, clics en la app y pedidos generados.',
                p4_plan_title: '3. Plan Operativo de Activación',
                p4_pillar1_title: '1. Test Days de Palas',
                p4_pillar1_action: 'Pack de 3-4 palas de prueba en rotación continua en los entrenamientos dirigidos por Alex.',
                p4_pillar1_impact: 'Prueba física en juego real: conversión de prueba a compra superior al 35%.',
                p4_pillar1_venue: venue,
                p4_pillar2_title: '2. Premios & Torneos',
                p4_pillar2_action: 'Pala o paletero como premio oficial estelar en las Americanas mensuales con entrega en podium.',
                p4_pillar2_impact: 'Asociación de marca con el éxito deportivo, status y trofeo de campeón.',
                p4_pillar2_venue: 'Americanas Oficiales',
                p4_pillar3_title: '3. Equipaciones Liga Summa',
                p4_pillar3_action: 'Logotipo visible en el pecho o manga de las equipaciones oficiales de los 8 equipos del club.',
                p4_pillar3_impact: 'Presencia visual continua en pistas de toda Cataluña ante rivales de la Liga Summa.',
                p4_pillar3_venue: 'Liga Summa Pádel',
                p4_pillar4_title: '4. Escaparate en App',
                p4_pillar4_action: 'Banner en portada de la PWA + ficha técnica detallada en la sección Tienda del club.',
                p4_pillar4_impact: 'Tráfico recurrente y canal cautivo directo en el teléfono de los 200 socios.',
                p4_pillar4_venue: 'App SomosPadel',
                p4_pillar5_title: '5. Tarifas & Descuento',
                p4_pillar5_action: 'Código promocional y condiciones ventajosas de colaborador para miembros activos.',
                p4_pillar5_impact: 'Monetización directa inmediata y liquidación ágil de existencias.',
                p4_pillar5_venue: 'Club & Tienda Web',

                // PÁGINA 5: PILOTO 90 DÍAS & FORMALIZACIÓN
                p5_section_header: 'PLAN PILOTO DE 90 DÍAS & FORMALIZACIÓN',
                p5_pilot_title: '4. Compromiso de Inicio Ágil (Piloto 90 Días)',
                p5_pilot_desc: 'Para agilizar la puesta en marcha sin fricciones burocráticas ni compromisos a ciegas, se establece un periodo piloto de <strong>90 días</strong> durante el cual ambas partes evaluarán la aceptación en pista, la interacción en la App y las ventas generadas antes de formalizar la extensión anual de la alianza.',
                p5_phase1_title: 'Llegada a Pista',
                p5_phase1_item1: 'Entrega pack de palas de test.',
                p5_phase1_item2: `1er Test Day en ${venue}.`,
                p5_phase1_item3: 'Alta de banner en la App.',
                p5_phase2_title: 'Americana Oficial',
                p5_phase2_item1: 'Torneo con pala STK de premio.',
                p5_phase2_item2: 'Activación código descuento.',
                p5_phase2_item3: 'Balance intermedio de ventas.',
                p5_phase3_title: 'Consolidación',
                p5_phase3_item1: 'Auditoría de retorno y ventas.',
                p5_phase3_item2: 'Integración en equipaciones.',
                p5_phase3_item3: 'Firma de renovación anual.',
                p5_commitments_title: 'Resumen de Compromisos Mutuos',
                p5_brand_commit_title: `Por parte de ${brand}:`,
                p5_brand_c1: 'Cesión de 3-4 palas de test para dinamización en pista.',
                p5_brand_c2: 'Material de premio para torneos en condiciones preferentes.',
                p5_brand_c3: 'Suministro ágil de material solicitado por jugadores.',
                p5_sp_commit_title: 'Por parte de SomosPadel Barcelona:',
                p5_sp_c1: 'Prescripción activa en entrenamientos por Alex Coscolin.',
                p5_sp_c2: 'Espacio preferente en la App oficial (banner + tienda).',
                p5_sp_c3: 'Reporte mensual de métricas de uso y compras.',
                p5_sign_sp_entity: 'Por SomosPadel Barcelona',
                p5_sign_sp_rep: `${sender} — ${senderRole}`,
                p5_sign_brand_entity: `Por ${brand}`,
                p5_sign_brand_rep: contact,
                p5_sign_brand_sub: `${contactRole}`
            };
        }

        loadCustomTexts() {
            try {
                if (typeof localStorage !== 'undefined') {
                    const saved = localStorage.getItem(STORAGE_CUSTOM_TEXTS_KEY);
                    if (saved) return JSON.parse(saved);
                }
            } catch (e) {}
            return {};
        }

        saveCustomTexts(texts) {
            this.customTexts = { ...this.customTexts, ...texts };
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(STORAGE_CUSTOM_TEXTS_KEY, JSON.stringify(this.customTexts));
                }
            } catch (e) {}
            this.showToast('💾 Textos personalizados guardados');
        }

        resetCustomTexts() {
            this.customTexts = {};
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(STORAGE_CUSTOM_TEXTS_KEY);
                }
            } catch (e) {}
            this.isInlineEditMode = false;
            this.showToast('🔄 Textos originales restablecidos');
            this.render();
        }

        getText(key) {
            if (this.customTexts && this.customTexts[key] !== undefined && this.customTexts[key] !== '') {
                return this.customTexts[key];
            }
            const defaults = this.getDefaultTexts();
            return defaults[key] !== undefined ? defaults[key] : '';
        }

        toggleInlineEditMode() {
            this.isInlineEditMode = !this.isInlineEditMode;
            if (this.isInlineEditMode) {
                this.showToast('✏️ Modo Edición Rápida Activo: Haz clic en cualquier texto');
            }
            this.render();
        }

        handleSaveInlineTexts() {
            if (typeof document === 'undefined') return;
            const elements = document.querySelectorAll('[data-text-key]');
            const updated = { ...this.customTexts };
            elements.forEach(el => {
                const key = el.getAttribute('data-text-key');
                if (key) {
                    updated[key] = el.innerHTML.trim();
                }
            });
            this.saveCustomTexts(updated);
            this.isInlineEditMode = false;
            this.showToast('✅ ¡Textos del dossier guardados correctamente!');
            this.render();
        }

        editableField(key, extraStyle = '', tag = 'span') {
            const rawVal = this.getText(key);
            const val = this.formatDisplayText(rawVal);
            const isEditing = this.isInlineEditMode;
            const editStyle = isEditing
                ? 'outline: 1.5px dashed #38bdf8 !important; background: rgba(56, 189, 248, 0.08) !important; border-radius: 4px; padding: 2px 4px; cursor: text;'
                : '';
            return `<${tag} class="sp-editable-field" data-text-key="${key}" contenteditable="${isEditing ? 'true' : 'false'}" style="${extraStyle} ${editStyle}">${val}</${tag}>`;
        }

        loadProposalData() {
            const defaults = {
                brandName: 'STK (Shot To Kill)',
                brandContact: 'Kilian Caro / Equipo STK',
                brandContactRole: 'Dirección Comercial & Alianzas',
                senderName: 'Alex Coscolin',
                senderRole: 'Fundador & Coordinador General',
                senderPhone: '+34 600 000 000',
                senderEmail: 'alex@somospadelbcn.es',
                venueMain: 'Barcelona Pádel El Prat',
                venueSats: "Cornellà y L'Hospitalet",
                activePlayers: '190 - 200',
                officialTeams: '8',
                season: 'Temporada 2026'
            };
            try {
                if (typeof localStorage !== 'undefined') {
                    const saved = localStorage.getItem('sp_marketing_proposal_data_v1');
                    if (saved) return { ...defaults, ...JSON.parse(saved) };
                }
            } catch (e) {}
            return defaults;
        }

        saveProposalData(data) {
            this.proposalData = { ...this.proposalData, ...data };
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('sp_marketing_proposal_data_v1', JSON.stringify(this.proposalData));
                }
            } catch (e) {}
            this.showToast('✅ Datos de propuesta guardados correctamente');
            this.switchDossierMode('executive');
        }

        handleSaveCustomProposal() {
            const brandName = document.getElementById('prop-brand-name')?.value || this.proposalData.brandName;
            const brandContact = document.getElementById('prop-brand-contact')?.value || this.proposalData.brandContact;
            const brandContactRole = document.getElementById('prop-brand-contact-role')?.value || this.proposalData.brandContactRole;
            const senderName = document.getElementById('prop-sender-name')?.value || this.proposalData.senderName;
            const senderRole = document.getElementById('prop-sender-role')?.value || this.proposalData.senderRole;
            const senderPhone = document.getElementById('prop-sender-phone')?.value || this.proposalData.senderPhone;
            const senderEmail = document.getElementById('prop-sender-email')?.value || this.proposalData.senderEmail;
            const venueMain = document.getElementById('prop-venue-main')?.value || this.proposalData.venueMain;
            const season = document.getElementById('prop-season')?.value || this.proposalData.season;

            this.saveProposalData({
                brandName,
                brandContact,
                brandContactRole,
                senderName,
                senderRole,
                senderPhone,
                senderEmail,
                venueMain,
                season
            });
        }

        // Verifica si el candado está desbloqueado
        isUnlocked() {
            try {
                return sessionStorage.getItem(SESSION_KEY) === SUPERADMIN_PASS;
            } catch (e) {
                return false;
            }
        }

        // Desbloquear sesión
        unlock(password) {
            if ((password || '').trim() === SUPERADMIN_PASS) {
                try {
                    sessionStorage.setItem(SESSION_KEY, SUPERADMIN_PASS);
                } catch (e) {}
                this.render();
                return true;
            }
            return false;
        }

        // Bloquear sesión
        lock() {
            try {
                sessionStorage.removeItem(SESSION_KEY);
            } catch (e) {}
            this.renderVault();
        }

        // Inicialización
        async init(containerId = 'content-area') {
            this.containerId = containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            // Vincular listener de teclado para navegación de slides si no está vinculado
            if (!this.keyListenerAttached) {
                window.addEventListener('keydown', (e) => {
                    if (!this.isUnlocked() || this.currentTab !== 'dossier' || this.dossierMode !== 'slides') return;
                    // No capturar flechas si el usuario está escribiendo en un input o textarea
                    if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

                    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                        e.preventDefault();
                        this.nextSlide();
                    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                        e.preventDefault();
                        this.prevSlide();
                    }
                });
                this.keyListenerAttached = true;
            }

            if (!this.isUnlocked()) {
                this.renderVault();
            } else {
                this.render();
            }
        }

        // =========================================================================
        // 🔒 1. SUPERADMIN SECURITY VAULT (PANTALLA DE BLOQUEO SOFISTICADA)
        // =========================================================================
        renderVault(errorMsg = '') {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div style="min-height: 82vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: radial-gradient(circle at 50% 20%, #1e293b 0%, #0b0f17 100%); font-family: 'Outfit', sans-serif;">
                    <div style="max-width: 460px; width: 100%; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px); border: 1.5px solid rgba(245, 158, 11, 0.3); border-radius: 28px; padding: 42px 36px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.15); text-align: center; color: #f8fafc; position: relative; overflow: hidden;">
                        
                        <!-- Glow decorativo superior -->
                        <div style="position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 220px; height: 120px; background: radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%); filter: blur(20px); pointer-events: none;"></div>
                        
                        <!-- Badge SUPERADMIN AREA -->
                        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-size: 0.72rem; font-weight: 900; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase; margin-bottom: 22px;">
                            <i class="fas fa-shield-halved" style="color: #f59e0b;"></i>
                            <span>SUPERADMIN SECURITY VAULT</span>
                        </div>

                        <!-- Icono Búnker -->
                        <div style="width: 82px; height: 82px; margin: 0 auto 22px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.05) 100%); border: 2px solid rgba(245, 158, 11, 0.4); border-radius: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(245, 158, 11, 0.15);">
                            <i class="fas fa-lock" style="font-size: 2.2rem; color: #fbbf24;"></i>
                        </div>

                        <h2 style="font-size: 1.65rem; font-weight: 900; margin: 0 0 8px; color: #ffffff; letter-spacing: -0.5px;">
                            MARKETING & MARCAS
                        </h2>
                        <p style="color: #94a3b8; font-size: 0.88rem; margin: 0 0 28px; line-height: 1.55;">
                            Área confidencial para acuerdos comerciales, pitch decks a marcas, dossiers ejecutivos y planes de coopatrocinio de <strong style="color: #ccff00;">SomosPadel Barcelona</strong>.
                        </p>

                        ${errorMsg ? `
                            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 12px 16px; border-radius: 12px; font-size: 0.84rem; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; text-align: left;">
                                <i class="fas fa-circle-exclamation" style="color: #ef4444; font-size: 1.1rem;"></i>
                                <span>${errorMsg}</span>
                            </div>
                        ` : ''}

                        <!-- Formulario de Desbloqueo -->
                        <form id="marketing-vault-form" onsubmit="event.preventDefault(); window.AdminMarketing.handleUnlockSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
                            <div style="position: relative;">
                                <input type="password" id="vault-pass-input" placeholder="Clave de Superadmin" autocomplete="current-password"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.7); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 14px; padding: 15px 48px 15px 18px; color: #ffffff; font-size: 1rem; font-weight: 700; outline: none; transition: all 0.2s;"
                                    onfocus="this.style.borderColor='#f59e0b'; this.style.boxShadow='0 0 0 3px rgba(245,158,11,0.2)';"
                                    onblur="this.style.borderColor='rgba(245,158,11,0.35)'; this.style.boxShadow='none';"
                                    autofocus />
                                <button type="button" onclick="window.AdminMarketing.togglePasswordVisibility();"
                                    style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 4px;">
                                    <i id="vault-eye-icon" class="fas fa-eye"></i>
                                </button>
                            </div>

                            <button type="submit"
                                style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; border: none; border-radius: 14px; padding: 16px; font-size: 0.95rem; font-weight: 950; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35); transition: transform 0.15s, box-shadow 0.15s; display: flex; align-items: center; justify-content: center; gap: 10px;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 28px rgba(245, 158, 11, 0.45)';"
                                onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 24px rgba(245, 158, 11, 0.35)';">
                                <i class="fas fa-key"></i>
                                <span>DESBLOQUEAR BÚNKER</span>
                            </button>
                        </form>

                        <div style="margin-top: 24px; font-size: 0.75rem; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-lock"></i>
                            <span>Cifrado de sesión activa • SomosPadel Hub 2026</span>
                        </div>
                    </div>
                </div>
            `;

            setTimeout(() => {
                const input = document.getElementById('vault-pass-input');
                if (input) input.focus();
            }, 100);
        }

        togglePasswordVisibility() {
            const input = document.getElementById('vault-pass-input');
            const icon = document.getElementById('vault-eye-icon');
            if (!input || !icon) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }

        handleUnlockSubmit() {
            const input = document.getElementById('vault-pass-input');
            const pass = input ? input.value : '';
            if (this.unlock(pass)) {
                // Desbloqueado con éxito
            } else {
                this.renderVault('Contraseña incorrecta. Acceso denegado a Superadmin.');
            }
        }

        // =========================================================================
        // 🎛️ 2. RENDER PRINCIPAL DE LA SECCIÓN MARKETING
        // =========================================================================
        render() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="marketing-admin-wrapper" style="padding: 24px 28px; max-width: 1440px; margin: 0 auto; color: #f8fafc; font-family: 'Outfit', sans-serif;">
                    
                    <!-- TOP HEADER BAR -->
                    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 20px; padding: 22px 28px; margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
                        <div style="display: flex; align-items: center; gap: 18px;">
                            <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 100%); border: 1.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);">
                                <i class="fas fa-bullhorn" style="font-size: 1.6rem; color: #fbbf24;"></i>
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                                    <h1 style="font-size: 1.6rem; font-weight: 950; margin: 0; color: #ffffff; letter-spacing: -0.5px;">
                                        MARKETING & COOPATROCINIOS
                                    </h1>
                                    <span style="background: #f59e0b; color: #000; font-size: 0.65rem; font-weight: 900; padding: 3px 10px; border-radius: 6px; letter-spacing: 1px;">SUPERADMIN</span>
                                    <span style="background: rgba(204, 255, 0, 0.15); border: 1px solid #ccff00; color: #ccff00; font-size: 0.65rem; font-weight: 800; padding: 3px 10px; border-radius: 6px;">STK × SOMOSPADEL</span>
                                </div>
                                <p style="margin: 0; color: #94a3b8; font-size: 0.86rem;">
                                    Hub estratégico de alianzas, pitch deck para marcas, activaciones en pista y monetización del ecosistema.
                                </p>
                            </div>
                        </div>

                        <!-- ACCIONES RÁPIDAS DEL HEADER -->
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <button onclick="window.AdminMarketing.lock();"
                                style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; padding: 10px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;"
                                onmouseover="this.style.background='rgba(239, 68, 68, 0.25)';"
                                onmouseout="this.style.background='rgba(239, 68, 68, 0.12)';">
                                <i class="fas fa-lock"></i>
                                <span>Bloquear Acceso</span>
                            </button>
                        </div>
                    </div>

                    <!-- BARRA DE PESTAÑAS PRINCIPALES -->
                    <div style="display: flex; gap: 10px; margin-bottom: 24px; border-bottom: 2px solid rgba(255,255,255,0.08); padding-bottom: 12px; overflow-x: auto;">
                        <button onclick="window.AdminMarketing.switchTab('dossier')"
                            style="padding: 12px 22px; border-radius: 14px; font-weight: 800; font-size: 0.92rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 9px; transition: all 0.2s; white-space: nowrap; ${this.currentTab === 'dossier' ? 'background: #f59e0b; color: #000; box-shadow: 0 4px 15px rgba(245,158,11,0.35);' : 'background: rgba(255,255,255,0.05); color: #cbd5e1;'}">
                            <i class="fas fa-file-powerpoint"></i>
                            <span>1. Dossier & Pitch Deck STK</span>
                        </button>
                        <button onclick="window.AdminMarketing.switchTab('activaciones')"
                            style="padding: 12px 22px; border-radius: 14px; font-weight: 800; font-size: 0.92rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 9px; transition: all 0.2s; white-space: nowrap; ${this.currentTab === 'activaciones' ? 'background: #f59e0b; color: #000; box-shadow: 0 4px 15px rgba(245,158,11,0.35);' : 'background: rgba(255,255,255,0.05); color: #cbd5e1;'}">
                            <i class="fas fa-calendar-check"></i>
                            <span>2. Plan de Activaciones & Tareas</span>
                        </button>
                        <button onclick="window.AdminMarketing.switchTab('app_showcase')"
                            style="padding: 12px 22px; border-radius: 14px; font-weight: 800; font-size: 0.92rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 9px; transition: all 0.2s; white-space: nowrap; ${this.currentTab === 'app_showcase' ? 'background: #f59e0b; color: #000; box-shadow: 0 4px 15px rgba(245,158,11,0.35);' : 'background: rgba(255,255,255,0.05); color: #cbd5e1;'}">
                            <i class="fas fa-mobile-screen-button"></i>
                            <span>3. Ecosistema App (Showcase)</span>
                        </button>
                        <button onclick="window.AdminMarketing.switchTab('roi_calc')"
                            style="padding: 12px 22px; border-radius: 14px; font-weight: 800; font-size: 0.92rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 9px; transition: all 0.2s; white-space: nowrap; ${this.currentTab === 'roi_calc' ? 'background: #f59e0b; color: #000; box-shadow: 0 4px 15px rgba(245,158,11,0.35);' : 'background: rgba(255,255,255,0.05); color: #cbd5e1;'}">
                            <i class="fas fa-calculator"></i>
                            <span>4. Calculadora de Retorno & Notas</span>
                        </button>
                    </div>

                    <!-- CONTENIDO DE LA PESTAÑA ACTIVA -->
                    <div id="marketing-tab-content">
                        ${this.renderActiveTabContent()}
                    </div>

                </div>
            `;
        }

        switchTab(tab) {
            this.currentTab = tab;
            this.render();
        }

        renderActiveTabContent() {
            switch (this.currentTab) {
                case 'dossier':
                    return this.renderDossierTab();
                case 'activaciones':
                    return this.renderActivacionesTab();
                case 'app_showcase':
                    return this.renderAppShowcaseTab();
                case 'roi_calc':
                    return this.renderRoiCalcTab();
                default:
                    return this.renderDossierTab();
            }
        }

        // =========================================================================
        // 📊 PESTAÑA 1: DOSSIER PDF PROFESIONAL DE VENTA & PROPUESTA COMERCIAL
        // =========================================================================
        renderDossierTab() {
            return `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    
                    <!-- TOP TOOLBAR: DESCARGA PDF OFICIAL & SELECTOR DE MODO -->
                    <div class="no-print marketing-toolbar" style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%); border: 1.5px solid rgba(204, 255, 0, 0.3); border-radius: 20px; padding: 18px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
                        
                        <!-- Lado izquierdo: Selector de Formato/Vista -->
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <span style="font-size: 0.8rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Vista Comercial:</span>
                            <div style="display: flex; background: rgba(0,0,0,0.45); padding: 5px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 4px;">
                                <button onclick="window.AdminMarketing.switchDossierMode('executive')"
                                    style="padding: 9px 18px; border-radius: 10px; font-weight: 850; font-size: 0.84rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; ${this.dossierMode === 'executive' ? 'background: #ccff00; color: #000; box-shadow: 0 2px 10px rgba(204,255,0,0.4);' : 'background: transparent; color: #cbd5e1;'}">
                                    <i class="fas fa-file-pdf"></i>
                                    <span>📄 Previsualización PDF (Páginas A4)</span>
                                </button>
                                <button onclick="window.AdminMarketing.switchDossierMode('editor')"
                                    style="padding: 9px 18px; border-radius: 10px; font-weight: 850; font-size: 0.84rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; ${this.dossierMode === 'editor' ? 'background: #ec4899; color: #ffffff; box-shadow: 0 2px 10px rgba(236,72,153,0.4);' : 'background: transparent; color: #cbd5e1;'}">
                                    <i class="fas fa-pen-nib"></i>
                                    <span>✏️ Editor de Contenidos</span>
                                </button>
                                <button onclick="window.AdminMarketing.switchDossierMode('custom')"
                                    style="padding: 9px 18px; border-radius: 10px; font-weight: 850; font-size: 0.84rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; ${this.dossierMode === 'custom' ? 'background: #38bdf8; color: #000; box-shadow: 0 2px 10px rgba(56,189,248,0.4);' : 'background: transparent; color: #cbd5e1;'}">
                                    <i class="fas fa-sliders"></i>
                                    <span>⚙️ Personalizar Datos</span>
                                </button>
                                <button onclick="window.AdminMarketing.switchDossierMode('slides')"
                                    style="padding: 9px 18px; border-radius: 10px; font-weight: 850; font-size: 0.84rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; ${this.dossierMode === 'slides' ? 'background: #f59e0b; color: #000; box-shadow: 0 2px 10px rgba(245,158,11,0.4);' : 'background: transparent; color: #cbd5e1;'}">
                                    <i class="fas fa-desktop"></i>
                                    <span>🖥️ Modo Presentación (Pitch Deck)</span>
                                </button>
                                <button onclick="window.AdminMarketing.switchDossierMode('texts')"
                                    style="padding: 9px 18px; border-radius: 10px; font-weight: 850; font-size: 0.84rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; ${this.dossierMode === 'texts' ? 'background: #22c55e; color: #000; box-shadow: 0 2px 10px rgba(34,197,94,0.4);' : 'background: transparent; color: #cbd5e1;'}">
                                    <i class="fas fa-copy"></i>
                                    <span>📋 Copiar Textos (Email / WhatsApp)</span>
                                </button>
                            </div>
                        </div>

                        <!-- Lado derecho: Botón Principal de Descarga / Impresión PDF Limpio -->
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <button onclick="window.AdminMarketing.triggerPrintPdf();"
                                title="Genera el documento en 5 páginas A4 limpias sin encabezados, fechas ni URLs locales del navegador"
                                style="background: linear-gradient(135deg, #ccff00 0%, #a3e635 100%); color: #000; border: none; border-radius: 12px; padding: 12px 24px; font-size: 0.95rem; font-weight: 950; letter-spacing: 0.3px; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 6px 20px rgba(204,255,0,0.4); transition: transform 0.15s, box-shadow 0.15s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(204,255,0,0.55)';"
                                onmouseout="this.style.transform='none'; this.style.boxShadow='0 6px 20px rgba(204,255,0,0.4)';">
                                <i class="fas fa-file-arrow-down" style="font-size: 1.15rem;"></i>
                                <span>📥 Descargar / Imprimir PDF Oficial (5 Hojas Limpias)</span>
                            </button>
                        </div>
                    </div>

                    <!-- CONTENIDO SEGÚN MODO -->
                    ${this.dossierMode === 'slides' ? this.renderPitchDeckSlides() : ''}
                    ${this.dossierMode === 'executive' ? this.renderExecutiveDossier() : ''}
                    ${this.dossierMode === 'editor' ? this.renderTextEditor() : ''}
                    ${this.dossierMode === 'custom' ? this.renderCustomProposalForm() : ''}
                    ${this.dossierMode === 'texts' ? this.renderCopyableTexts() : ''}

                </div>
            `;
        }

        triggerPrintPdf() {
            this.printIsolatedDossier();
        }

        printIsolatedDossier() {
            if (this.dossierMode !== 'executive') {
                this.dossierMode = 'executive';
                this.render();
            }

            if (typeof document === 'undefined' || typeof document.querySelector !== 'function' || typeof document.createElement !== 'function') {
                if (typeof window !== 'undefined' && typeof window.print === 'function') {
                    window.print();
                }
                return;
            }

            const dossierEl = document.querySelector('.printable-executive-dossier');
            if (!dossierEl || typeof dossierEl.cloneNode !== 'function') {
                if (typeof window !== 'undefined' && typeof window.print === 'function') {
                    window.print();
                }
                return;
            }

            // Clonar dossier y retirar controles interactivos de edición
            const clone = dossierEl.cloneNode(true);
            clone.querySelectorAll('.no-print, .inline-edit-toolbar, .edit-mode-badge').forEach(el => el.remove());
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

            // Eliminar iframe previo si existe
            const existingIframe = document.getElementById('sp-isolated-pdf-frame');
            if (existingIframe && existingIframe.parentNode) {
                existingIframe.parentNode.removeChild(existingIframe);
            }

            const iframe = document.createElement('iframe');
            iframe.id = 'sp-isolated-pdf-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentWindow ? iframe.contentWindow.document : (iframe.contentDocument || null);
            if (!iframeDoc) {
                window.print();
                return;
            }

            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title></title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900;950&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 0 !important;
                        }
                        * {
                            box-sizing: border-box;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            color: #0f172a !important;
                            font-family: 'Outfit', sans-serif !important;
                            overflow: visible !important;
                            height: auto !important;
                            width: 100% !important;
                        }
                        .no-print, .inline-edit-toolbar, .edit-mode-badge {
                            display: none !important;
                        }
                        .printable-executive-dossier {
                            position: static !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                        }
                        .pdf-page {
                            position: relative !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: space-between !important;
                            width: 100% !important;
                            min-height: 265mm !important;
                            height: 272mm !important;
                            max-height: 275mm !important;
                            box-sizing: border-box !important;
                            page-break-after: always !important;
                            page-break-inside: avoid !important;
                            break-after: page !important;
                            break-inside: avoid !important;
                            padding: 10mm 12mm !important;
                            margin: 0 !important;
                            background: #ffffff !important;
                            color: #0f172a !important;
                        }
                        .pdf-page:last-child {
                            page-break-after: auto !important;
                            break-after: auto !important;
                        }
                        .pdf-page-1 {
                            background: #ffffff !important;
                            color: #0f172a !important;
                            border: none !important;
                        }
                    </style>
                </head>
                <body>
                    ${clone.outerHTML}
                </body>
                </html>
            `);
            iframeDoc.close();

            setTimeout(() => {
                try {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } else {
                        window.print();
                    }
                } catch (e) {
                    window.print();
                }
            }, 450);
        }

        switchDossierMode(mode) {
            this.dossierMode = mode;
            this.render();
        }

        // =========================================================================
        // 🖥️ SUB-MODO: PITCH DECK DE 7 SLIDES
        // =========================================================================
        renderPitchDeckSlides() {
            const slidesData = [
                // Slide 1: Portada
                {
                    badge: "ALIANZA ESTRATÉGICA 2026",
                    title: "STK (Shot To Kill) × SOMOSPADEL",
                    subtitle: "Comunidad real, impacto en pista y ecosistema digital de pádel en Barcelona",
                    content: `
                        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: center; height: 100%;">
                            <div>
                                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                                    <span style="background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; color: #fbbf24; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800;">
                                        ⚡ MARCA INNOVADORA
                                    </span>
                                    <span style="background: rgba(204,255,0,0.15); border: 1px solid #ccff00; color: #ccff00; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800;">
                                        🎾 CLUB & COMUNIDAD PRO
                                    </span>
                                </div>
                                <h3 style="font-size: 2.2rem; font-weight: 950; line-height: 1.15; margin: 0 0 16px; color: #ffffff;">
                                    Una alianza win-win donde el pádel ocurre de verdad: <span style="color: #ccff00;">en la pista y en el bolsillo del jugador.</span>
                                </h3>
                                <p style="font-size: 1.05rem; color: #94a3b8; line-height: 1.6; margin: 0 0 24px;">
                                    Frente al patrocinio tradicional de jugadores aislados que nadie ve competir, SomosPadel pone una marca delante de <strong style="color: #ffffff;">cientos de jugadores activos semanales</strong> con palas en mano, partidos de liga federada y una app móvil propia.
                                </p>
                                <div style="display: flex; gap: 16px;">
                                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 18px;">
                                        <div style="font-size: 1.4rem; font-weight: 950; color: #ccff00;">200+</div>
                                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Jugadores Activos</div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 18px;">
                                        <div style="font-size: 1.4rem; font-weight: 950; color: #38bdf8;">8</div>
                                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Equipos Oficiales</div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 18px;">
                                        <div style="font-size: 1.4rem; font-weight: 950; color: #fbbf24;">1</div>
                                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">App Móvil Propia</div>
                                    </div>
                                </div>
                            </div>
                            <div style="background: radial-gradient(circle at center, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.8) 70%); border: 1.5px solid rgba(245,158,11,0.3); border-radius: 24px; padding: 32px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
                                <div style="font-size: 4rem; margin-bottom: 12px;">🤝</div>
                                <div style="font-size: 1.3rem; font-weight: 900; color: #ffffff; margin-bottom: 8px;">STK × SOMOSPADEL</div>
                                <div style="font-size: 0.85rem; color: #fbbf24; font-weight: 800; letter-spacing: 1px; margin-bottom: 16px; text-transform: uppercase;">Propuesta de Coopatrocinio</div>
                                <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    "No queremos un sponsor pasivo que solo pone un logo; queremos que STK sea la marca de referencia en el club y que los jugadores quieran comprar y jugar con vuestro material."
                                </p>
                            </div>
                        </div>
                    `
                },
                // Slide 2: La Comunidad en Cifras
                {
                    badge: "AUDIENCIA & RETENCIÓN",
                    title: "La Comunidad en Cifras Reales",
                    subtitle: "Volumen, frecuencia de juego y alcance consolidado en Barcelona y Baix Llobregat",
                    content: `
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                            <div style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(204,255,0,0.25); border-radius: 18px; padding: 22px 18px; text-align: center;">
                                <div style="font-size: 2.4rem; font-weight: 950; color: #ccff00; margin-bottom: 4px;">+190-200</div>
                                <div style="font-size: 0.85rem; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Jugadores Activos</div>
                                <p style="font-size: 0.75rem; color: #94a3b8; margin: 0; line-height: 1.4;">Comunidad fidelizada que juega cada semana sin excepción.</p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(56,189,248,0.25); border-radius: 18px; padding: 22px 18px; text-align: center;">
                                <div style="font-size: 2.4rem; font-weight: 950; color: #38bdf8; margin-bottom: 4px;">8 Equipos</div>
                                <div style="font-size: 0.85rem; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Liga Summa Pádel</div>
                                <p style="font-size: 0.75rem; color: #94a3b8; margin: 0; line-height: 1.4;">Competición de liga por equipos en Barcelona y Cataluña.</p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(245,158,11,0.25); border-radius: 18px; padding: 22px 18px; text-align: center;">
                                <div style="font-size: 2.4rem; font-weight: 950; color: #fbbf24; margin-bottom: 4px;">3 Sedes</div>
                                <div style="font-size: 0.85rem; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Hubs de Barcelona</div>
                                <p style="font-size: 0.75rem; color: #94a3b8; margin: 0; line-height: 1.4;">Barcelona Pádel El Prat (Sede Central) + Cornellà + L'Hospitalet.</p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(168,85,247,0.25); border-radius: 18px; padding: 22px 18px; text-align: center;">
                                <div style="font-size: 2.4rem; font-weight: 950; color: #c084fc; margin-bottom: 4px;">52 Semanas</div>
                                <div style="font-size: 0.85rem; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Actividad Continua</div>
                                <p style="font-size: 0.75rem; color: #94a3b8; margin: 0; line-height: 1.4;">Entrenamientos semanales y americanas con rotación completa todo el año.</p>
                            </div>
                        </div>

                        <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                            <div>
                                <h4 style="font-size: 1rem; color: #ccff00; margin: 0 0 10px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-bullseye"></i> Perfil del Jugador SomosPadel
                                </h4>
                                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 0.86rem; line-height: 1.6;">
                                    <li>Poder adquisitivo medio-alto (25 a 55 años).</li>
                                    <li>Renuevan pala 1 a 2 veces por año y consumen equipación regularmente.</li>
                                    <li>Fidelidad absoluta a la recomendación del club y de sus compañeros de pista.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 style="font-size: 1rem; color: #38bdf8; margin: 0 0 10px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-trophy"></i> Efecto Multiplicador en Competición
                                </h4>
                                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 0.86rem; line-height: 1.6;">
                                    <li>Cada fin de semana, 8 equipos viajan a clubes rivales vistiendo la marca.</li>
                                    <li>Contacto visual directo con más de 1.000 jugadores oponentes por temporada.</li>
                                    <li>Presencia continuada en la Liga Summa Pádel.</li>
                                </ul>
                            </div>
                        </div>
                    `
                },
                // Slide 3: El Gran Factor Diferencial: LA APP SOMOSPADEL
                {
                    badge: "TECNOLOGÍA PROPIA",
                    title: "El Factor Diferencial: LA APP SOMOSPADEL",
                    subtitle: "No somos un simple grupo de WhatsApp: somos una plataforma tecnológica PWA nativa",
                    content: `
                        <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 28px; align-items: center;">
                            <div>
                                <div style="display: inline-block; background: rgba(56,189,248,0.15); border: 1px solid #38bdf8; color: #38bdf8; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; margin-bottom: 14px;">
                                    📱 APP PWA INSTALABLE EN IOS & ANDROID
                                </div>
                                <h3 style="font-size: 1.7rem; font-weight: 900; color: #ffffff; margin: 0 0 14px; line-height: 1.25;">
                                    Un canal publicitario directo en el bolsillo de 200 jugadores, sin intermediarios.
                                </h3>
                                <p style="font-size: 0.92rem; color: #94a3b8; line-height: 1.6; margin: 0 0 20px;">
                                    Cualquier club depende de mensajes desorganizados en WhatsApp que se pierden en segundos. En SomosPadel los jugadores entran diariamente a nuestra aplicación para inscribirse a partidos, consultar su ranking ELO, revisar horarios y ver la tienda.
                                </p>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px;">
                                        <i class="fas fa-chart-simple" style="color: #ccff00; font-size: 1.1rem;"></i>
                                        <span style="font-size: 0.86rem; color: #e2e8f0;"><strong>Algoritmo de nivel ELO propio:</strong> Consultas continuas de estadísticas y resultados.</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px;">
                                        <i class="fas fa-bag-shopping" style="color: #fbbf24; font-size: 1.1rem;"></i>
                                        <span style="font-size: 0.86rem; color: #e2e8f0;"><strong>Tienda E-Commerce integrada:</strong> Espacio exclusivo para palas y ropa STK con 1-clic a WhatsApp.</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px;">
                                        <i class="fas fa-bell" style="color: #38bdf8; font-size: 1.1rem;"></i>
                                        <span style="font-size: 0.86rem; color: #e2e8f0;"><strong>Notificaciones directas:</strong> Lanzamiento de ofertas flash y días de test con impacto inmediato.</span>
                                    </div>
                                </div>
                            </div>
                            <div style="background: rgba(15,23,42,0.8); border: 2px solid rgba(56,189,248,0.3); border-radius: 24px; padding: 26px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #38bdf8; color: #000; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;">
                                    <i class="fas fa-mobile-screen"></i>
                                </div>
                                <h4 style="font-size: 1.1rem; color: #ffffff; margin: 0 0 8px;">MÉTRICAS ESTIMADAS APP</h4>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0;">
                                    <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 12px;">
                                        <div style="font-size: 1.4rem; font-weight: 900; color: #ccff00;">~2.400</div>
                                        <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Aperturas / mes</div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 12px;">
                                        <div style="font-size: 1.4rem; font-weight: 900; color: #38bdf8;">100%</div>
                                        <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Jugadores en Target</div>
                                    </div>
                                </div>
                                <p style="font-size: 0.82rem; color: #94a3b8; margin: 0;">
                                    Ninguna otra comunidad amateur de pádel en Barcelona ofrece esta capa digital como activo comercial para marcas.
                                </p>
                            </div>
                        </div>
                    `
                },
                // Slide 4: Retorno Real vs Patrocinio Tradicional
                {
                    badge: "RETORNO DE INVERSIÓN (ROI)",
                    title: "¿Por qué SomosPadel vs un Jugador Individual?",
                    subtitle: "Comparativa de impacto real: un jugador profesional vs 200 prescriptores en pista",
                    content: `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                            <!-- Columna 1: Patrocinar a 1 Jugador -->
                            <div style="background: rgba(239, 68, 68, 0.05); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 20px; padding: 26px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                                    <span style="font-size: 1.5rem;">❌</span>
                                    <h4 style="font-size: 1.2rem; font-weight: 900; color: #f87171; margin: 0;">PATROCINIO TRADICIONAL (1 Jugador)</h4>
                                </div>
                                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 0.88rem; line-height: 1.8;">
                                    <li><strong>Dependencia deportiva:</strong> Si pierde en 1ª ronda o se lesiona, la visibilidad de la marca cae a cero.</li>
                                    <li><strong>Poca interacción directa:</strong> El público lo mira de lejos; nadie puede probar su pala durante el partido.</li>
                                    <li><strong>Coste elevado sin trazabilidad:</strong> Cientos o miles de euros sin saber cuántas ventas reales genera.</li>
                                    <li><strong>Efecto pasajero:</strong> Un post en Instagram que desaparece del feed a las 24 horas.</li>
                                </ul>
                            </div>

                            <!-- Columna 2: Coopatrocinar SomosPadel -->
                            <div style="background: rgba(204, 255, 0, 0.05); border: 1.5px solid rgba(204, 255, 0, 0.35); border-radius: 20px; padding: 26px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                                    <span style="font-size: 1.5rem;">✅</span>
                                    <h4 style="font-size: 1.2rem; font-weight: 900; color: #ccff00; margin: 0;">COOPATROCINIO SOMOSPADEL (Comunidad)</h4>
                                </div>
                                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 0.88rem; line-height: 1.8;">
                                    <li><strong>200 prescriptores activos:</strong> Si 10 capitanes y jugadores clave juegan con STK, todo el grupo quiere probarla.</li>
                                    <li><strong>Palas de test circulando en pista:</strong> Probar la pala jugando un entreno es el mayor acelerador de compra que existe.</li>
                                    <li><strong>Visibilidad 365 días al año:</strong> Entrenamientos martes/jueves, americanas fines de semana y partidos de liga.</li>
                                    <li><strong>Canal de venta directo:</strong> Ficha de producto en la App con enlace directo para adquirir el material.</li>
                                </ul>
                            </div>
                        </div>

                        <div style="margin-top: 20px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 14px 20px; text-align: center; color: #fbbf24; font-size: 0.9rem; font-weight: 800;">
                            💡 En el pádel amateur, las palas se venden por el "boca a oreja" en pista y la recomendación directa entre compañeros de partido.
                        </div>
                    `
                },
                // Slide 5: Ejes de Activación Win-Win
                {
                    badge: "EJES DE COLABORACIÓN",
                    title: "Ejes de Activación Win-Win",
                    subtitle: "Propuesta de acciones concretas diseñadas para maximizar ventas e imagen de marca",
                    content: `
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;">
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">🎾</div>
                                <h4 style="font-size: 1rem; color: #ccff00; margin: 0 0 8px; font-weight: 900;">1. TEST DAYS EN EL PRAT</h4>
                                <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    Jornadas de prueba de palas durante los entrenamientos oficiales en Barcelona Pádel El Prat. Jugadores con palas STK en situaciones reales de juego.
                                </p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">🏆</div>
                                <h4 style="font-size: 1rem; color: #38bdf8; margin: 0 0 8px; font-weight: 900;">2. PREMIOS & WELCOME PACKS</h4>
                                <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    Presencia de producto STK (paleteros, grips, gorras, palas) como premios en las americanas y torneos internos mensuales de SomosPadel.
                                </p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">👕</div>
                                <h4 style="font-size: 1rem; color: #fbbf24; margin: 0 0 8px; font-weight: 900;">3. EQUIPACIONES 8 EQUIPOS</h4>
                                <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    Inclusión del logo STK en la manga o frontal de las camisetas oficiales de los 8 equipos que compiten en ligas de Cataluña.
                                </p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">📲</div>
                                <h4 style="font-size: 1rem; color: #c084fc; margin: 0 0 8px; font-weight: 900;">4. SHOWCASE EN LA APP</h4>
                                <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    Banner patrocinador destacado en la home de la app y ficha oficial del catálogo STK en la tienda con botón de compra directa.
                                </p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">🏷️</div>
                                <h4 style="font-size: 1rem; color: #f43f5e; margin: 0 0 8px; font-weight: 900;">5. CÓDIGO CLUB EXCLUSIVO</h4>
                                <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    Condiciones comerciales preferentes (ej. 15-20% de descuento) para miembros activos del club, incentivando la compra masiva.
                                </p>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">📸</div>
                                <h4 style="font-size: 1rem; color: #34d399; margin: 0 0 8px; font-weight: 900;">6. CONTENIDO AUDIOVISUAL</h4>
                                <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin: 0;">
                                    Fotos y reels en pista de alta calidad con producto STK para las redes de SomosPadel e Instagram de los propios jugadores.
                                </p>
                            </div>
                        </div>
                    `
                },
                // Slide 6: Hoja de Ruta Ágil (Piloto 3 meses)
                {
                    badge: "PLAN DE ACCIÓN ÁGIL",
                    title: "Hoja de Ruta: Piloto de 3 Meses",
                    subtitle: "Sin compromisos a ciegas: validamos acogida, ventas e interacción antes de consolidar",
                    content: `
                        <div style="display: flex; flex-direction: column; gap: 18px;">
                            <div style="background: rgba(15,23,42,0.6); border: 1.5px solid rgba(245,158,11,0.25); border-radius: 18px; padding: 24px;">
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; position: relative;">
                                    
                                    <!-- MES 1 -->
                                    <div style="background: rgba(255,255,255,0.03); border-radius: 14px; padding: 18px; border-left: 4px solid #ccff00;">
                                        <div style="font-size: 0.75rem; font-weight: 900; color: #ccff00; letter-spacing: 1px; margin-bottom: 6px;">MES 1: LANZAMIENTO & TEST</div>
                                        <h4 style="font-size: 1.05rem; color: #ffffff; margin: 0 0 10px;">Desembarco en Pista</h4>
                                        <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 0.82rem; line-height: 1.6;">
                                            <li>Entrega de palas de test para capitanes y entrenadores.</li>
                                            <li>1er Test Day en Barcelona Pádel El Prat.</li>
                                            <li>Publicación del banner y ficha en la App SomosPadel.</li>
                                        </ul>
                                    </div>

                                    <!-- MES 2 -->
                                    <div style="background: rgba(255,255,255,0.03); border-radius: 14px; padding: 18px; border-left: 4px solid #38bdf8;">
                                        <div style="font-size: 0.75rem; font-weight: 900; color: #38bdf8; letter-spacing: 1px; margin-bottom: 6px;">MES 2: ACTIVACIÓN & VENTAS</div>
                                        <h4 style="font-size: 1.05rem; color: #ffffff; margin: 0 0 10px;">Americana Oficial STK</h4>
                                        <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 0.82rem; line-height: 1.6;">
                                            <li>Torneo / Americana con premios STK (palas / paleteros).</li>
                                            <li>Campaña con código de descuento exclusivo en la App.</li>
                                            <li>Primer balance de interacción y pedidos generados.</li>
                                        </ul>
                                    </div>

                                    <!-- MES 3 -->
                                    <div style="background: rgba(255,255,255,0.03); border-radius: 14px; padding: 18px; border-left: 4px solid #fbbf24;">
                                        <div style="font-size: 0.75rem; font-weight: 900; color: #fbbf24; letter-spacing: 1px; margin-bottom: 6px;">MES 3: REVISIÓN & ESCALADO</div>
                                        <h4 style="font-size: 1.05rem; color: #ffffff; margin: 0 0 10px;">Alianza Anual</h4>
                                        <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 0.82rem; line-height: 1.6;">
                                            <li>Auditoría de retorno: palas probadas y volumen vendido.</li>
                                            <li>Integración en las equipaciones de la siguiente fase de liga.</li>
                                            <li>Firma de renovación y consolidación anual.</li>
                                        </ul>
                                    </div>

                                </div>
                            </div>

                            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.25); border-radius: 14px; padding: 16px 24px;">
                                <div style="display: flex; align-items: center; gap: 14px;">
                                    <i class="fas fa-handshake" style="font-size: 1.6rem; color: #38bdf8;"></i>
                                    <div>
                                        <div style="font-weight: 900; color: #ffffff; font-size: 0.95rem;">Flexibilidad Total y Enfoque Realista</div>
                                        <div style="font-size: 0.82rem; color: #94a3b8;">Construimos una relación a largo plazo empezando por hechos tangibles en pista.</div>
                                    </div>
                                </div>
                                <span style="background: #38bdf8; color: #000; font-weight: 900; font-size: 0.75rem; padding: 6px 14px; border-radius: 8px;">PILOTO SIN BARRERAS</span>
                            </div>
                        </div>
                    `
                },
                // Slide 7: Contacto Directo
                {
                    badge: "CONTACTO & PRÓXIMOS PASOS",
                    title: "¿Hablamos y Cerramos Fechas?",
                    subtitle: "Alex Coscolin — Fundador & Coordinador de SomosPadel Barcelona",
                    content: `
                        <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; align-items: center;">
                            <div>
                                <h3 style="font-size: 1.8rem; font-weight: 950; color: #ffffff; margin: 0 0 12px;">
                                    Llevemos STK a las pistas donde realmente se juega.
                                </h3>
                                <p style="font-size: 0.92rem; color: #94a3b8; line-height: 1.6; margin: 0 0 24px;">
                                    Estamos listos para coordinar el primer envío de palas de prueba para los entrenamientos de esta misma semana y activar la presencia en la App.
                                </p>
                                <div style="display: flex; flex-direction: column; gap: 14px;">
                                    <div style="display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.04); padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                                        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(204,255,0,0.15); display: flex; align-items: center; justify-content: center; color: #ccff00;">
                                            <i class="fas fa-user-tie"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Contacto Principal</div>
                                            <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff;">Alex Coscolin</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.04); padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                                        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(56,189,248,0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                                            <i class="fas fa-location-dot"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Sede Central</div>
                                            <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff;">Barcelona Pádel El Prat (El Prat de Llobregat, BCN)</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.04); padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                                        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(34,197,94,0.15); display: flex; align-items: center; justify-content: center; color: #22c55e;">
                                            <i class="fab fa-whatsapp"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">WhatsApp Directo</div>
                                            <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff;">+34 600 000 000 (Alex)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="background: radial-gradient(circle at center, rgba(204,255,0,0.1) 0%, rgba(15,23,42,0.9) 70%); border: 1.5px solid rgba(204,255,0,0.3); border-radius: 24px; padding: 32px; text-align: center;">
                                <div style="font-size: 3.5rem; margin-bottom: 12px;">🚀</div>
                                <h4 style="font-size: 1.25rem; font-weight: 900; color: #ffffff; margin: 0 0 8px;">PRÓXIMO PASO SUGERIDO</h4>
                                <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px;">
                                    Definir qué 2-3 modelos de palas STK queréis que entren como pack inicial de test en los entrenamientos de esta semana.
                                </p>
                                <button onclick="window.AdminMarketing.switchDossierMode('texts');"
                                    style="background: linear-gradient(135deg, #ccff00 0%, #a3e635 100%); color: #000; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 15px rgba(204,255,0,0.35);">
                                    <i class="fas fa-paper-plane"></i> Ver Propuesta Copiable (Email)
                                </button>
                            </div>
                        </div>
                    `
                }
            ];

            const current = slidesData[this.currentSlide] || slidesData[0];

            return `
                <div style="background: linear-gradient(145deg, #0f172a 0%, #0b0f17 100%); border: 1.5px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 36px 42px; min-height: 520px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 20px 50px rgba(0,0,0,0.6); position: relative;">
                    
                    <!-- SLIDE HEADER -->
                    <div style="margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="display: inline-block; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; font-size: 0.72rem; font-weight: 900; letter-spacing: 1px; padding: 4px 12px; border-radius: 6px; text-transform: uppercase; margin-bottom: 8px;">
                                ${current.badge}
                            </span>
                            <h2 style="font-size: 1.7rem; font-weight: 950; margin: 0 0 6px; color: #ffffff;">
                                ${current.title}
                            </h2>
                            <p style="font-size: 0.88rem; color: #94a3b8; margin: 0;">
                                ${current.subtitle}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 14px; font-weight: 900; font-size: 0.85rem; color: #ccff00;">
                                SLIDE ${this.currentSlide + 1} / ${this.totalSlides}
                            </div>
                            <div style="font-size: 0.68rem; color: #64748b; margin-top: 4px;">Usa ◄ ► en teclado</div>
                        </div>
                    </div>

                    <!-- SLIDE BODY -->
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; margin-bottom: 28px;">
                        ${current.content}
                    </div>

                    <!-- SLIDE CONTROLS FOOTER -->
                    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px;">
                        <button onclick="window.AdminMarketing.prevSlide();" ${this.currentSlide === 0 ? 'disabled' : ''}
                            style="padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 0.88rem; border: none; cursor: ${this.currentSlide === 0 ? 'not-allowed' : 'pointer'}; background: ${this.currentSlide === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)'}; color: ${this.currentSlide === 0 ? '#475569' : '#ffffff'}; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-chevron-left"></i>
                            <span>Anterior</span>
                        </button>

                        <!-- DOTS INDICATORS -->
                        <div style="display: flex; gap: 8px;">
                            ${slidesData.map((_, idx) => `
                                <button onclick="window.AdminMarketing.goToSlide(${idx});"
                                    title="Ir a slide ${idx + 1}"
                                    style="width: ${this.currentSlide === idx ? '28px' : '10px'}; height: 10px; border-radius: 5px; border: none; cursor: pointer; transition: all 0.25s; background: ${this.currentSlide === idx ? '#ccff00' : 'rgba(255,255,255,0.2)'};">
                                </button>
                            `).join('')}
                        </div>

                        <button onclick="window.AdminMarketing.nextSlide();" ${this.currentSlide === this.totalSlides - 1 ? 'disabled' : ''}
                            style="padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 0.88rem; border: none; cursor: ${this.currentSlide === this.totalSlides - 1 ? 'not-allowed' : 'pointer'}; background: ${this.currentSlide === this.totalSlides - 1 ? 'rgba(255,255,255,0.03)' : '#ccff00'}; color: ${this.currentSlide === this.totalSlides - 1 ? '#475569' : '#000000'}; display: flex; align-items: center; gap: 8px; box-shadow: ${this.currentSlide === this.totalSlides - 1 ? 'none' : '0 4px 15px rgba(204,255,0,0.3)'};">
                            <span>Siguiente</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                </div>
            `;
        }

        nextSlide() {
            if (this.currentSlide < this.totalSlides - 1) {
                this.currentSlide++;
                this.render();
            }
        }

        prevSlide() {
            if (this.currentSlide > 0) {
                this.currentSlide--;
                this.render();
            }
        }

        goToSlide(index) {
            if (index >= 0 && index < this.totalSlides) {
                this.currentSlide = index;
                this.render();
            }
        }

        // =========================================================================
        // ⚙️ SUB-MODO: FORMULARIO DE PERSONALIZACIÓN DE LA PROPUESTA
        // =========================================================================
        renderCustomProposalForm() {
            const data = this.proposalData;
            return `
                <div class="no-print" style="max-width: 900px; margin: 0 auto; background: rgba(15, 23, 42, 0.85); border: 1.5px solid rgba(56, 189, 248, 0.3); border-radius: 24px; padding: 36px 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 18px; margin-bottom: 28px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(56,189,248,0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.3rem;">
                                <i class="fas fa-sliders"></i>
                            </div>
                            <div>
                                <h2 style="font-size: 1.4rem; font-weight: 950; margin: 0; color: #ffffff;">Personalizar Datos del Dossier & Propuesta</h2>
                                <p style="font-size: 0.84rem; color: #94a3b8; margin: 0;">Los cambios se aplicarán en tiempo real al PDF de 5 páginas y a las plantillas de email y WhatsApp.</p>
                            </div>
                        </div>
                        <button onclick="window.AdminMarketing.switchDossierMode('executive');"
                            style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; padding: 8px 16px; border-radius: 10px; font-size: 0.82rem; font-weight: 800; cursor: pointer;">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>

                    <form onsubmit="event.preventDefault(); window.AdminMarketing.handleSaveCustomProposal();" style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Nombre de la Marca Patrocinadora</label>
                                <input type="text" id="prop-brand-name" value="${this.escapeForJs(data.brandName)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Contacto de la Marca (Interlocutor)</label>
                                <input type="text" id="prop-brand-contact" value="${this.escapeForJs(data.brandContact)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Cargo del Interlocutor</label>
                                <input type="text" id="prop-brand-contact-role" value="${this.escapeForJs(data.brandContactRole)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Temporada / Edición</label>
                                <input type="text" id="prop-season" value="${this.escapeForJs(data.season)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Representante SomosPadel</label>
                                <input type="text" id="prop-sender-name" value="${this.escapeForJs(data.senderName)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Cargo de Alex</label>
                                <input type="text" id="prop-sender-role" value="${this.escapeForJs(data.senderRole)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Teléfono / WhatsApp de Contacto</label>
                                <input type="text" id="prop-sender-phone" value="${this.escapeForJs(data.senderPhone)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Email de Contacto</label>
                                <input type="text" id="prop-sender-email" value="${this.escapeForJs(data.senderEmail)}"
                                    style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">Sede Central de Entrenamientos</label>
                            <input type="text" id="prop-venue-main" value="${this.escapeForJs(data.venueMain)}"
                                style="width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.8); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #ffffff; font-weight: 700; font-size: 0.95rem; outline: none;" />
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 14px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
                            <button type="submit"
                                style="background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); color: #000; border: none; border-radius: 12px; padding: 14px 28px; font-size: 0.95rem; font-weight: 950; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(56,189,248,0.4);">
                                <i class="fas fa-save"></i>
                                <span>Guardar y Ver Dossier PDF</span>
                            </button>
                        </div>
                    </form>
                </div>
            `;
        }

        // =========================================================================
        // 📄 SUB-MODO: DOSSIER EDITORIAL PROFESIONAL (5 PÁGINAS A4 PARA IMPRIMIR/PDF)
        // =========================================================================
        renderExecutiveDossier() {
            const data = this.proposalData;

            return `
                <div class="printable-executive-dossier" style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6;">
                    
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 0 !important;
                        }
                        @media print {
                            html, body, .app-shell, .main-wrapper, .workspace-area, #content-area, .marketing-admin-wrapper {
                                overflow: visible !important;
                                height: auto !important;
                                max-height: none !important;
                                position: static !important;
                                display: block !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            #admin-sidebar, 
                            .top-bar, 
                            .top-header,
                            .admin-mobile-subnav, 
                            #admin-mobile-subnav, 
                            .no-print, 
                            .marketing-header, 
                            .marketing-tabs-nav, 
                            .marketing-toolbar,
                            .inline-edit-toolbar, 
                            .edit-mode-badge,
                            .drawer-close-btn,
                            #sidebar-overlay {
                                display: none !important;
                            }
                            .printable-executive-dossier {
                                position: static !important;
                                width: 100% !important;
                                display: block !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                background: #ffffff !important;
                            }
                            .pdf-page {
                                position: relative !important;
                                display: flex !important;
                                flex-direction: column !important;
                                justify-content: space-between !important;
                                width: 100% !important;
                                min-height: 260mm !important;
                                height: 270mm !important;
                                max-height: 275mm !important;
                                box-sizing: border-box !important;
                                page-break-after: always !important;
                                page-break-inside: avoid !important;
                                break-after: page !important;
                                break-inside: avoid !important;
                                padding: 10mm 12mm !important;
                                margin: 0 !important;
                                border: none !important;
                                box-shadow: none !important;
                                background: #ffffff !important;
                                color: #0f172a !important;
                            }
                            .pdf-page-1 {
                                background: radial-gradient(circle at 80% 10%, #1e293b 0%, #0a0f1d 70%, #030712 100%) !important;
                                color: #ffffff !important;
                                border: 2px solid rgba(204, 255, 0, 0.35) !important;
                            }
                            .pdf-page:last-child {
                                page-break-after: auto !important;
                                break-after: auto !important;
                            }
                        }
                        @media screen {
                            .pdf-page {
                                max-width: 840px;
                                min-height: 1120px;
                                margin: 0 auto 36px;
                                background: #ffffff;
                                border-radius: 16px;
                                padding: 52px 56px;
                                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.1);
                                position: relative;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                box-sizing: border-box;
                            }
                        }
                        .sp-editable-field {
                            transition: outline 0.15s, background-color 0.15s;
                        }
                        .sp-editable-field[contenteditable="true"]:hover {
                            outline: 1.5px dashed #38bdf8 !important;
                            background: rgba(56, 189, 248, 0.08) !important;
                            cursor: text;
                        }
                        .sp-editable-field[contenteditable="true"]:focus {
                            outline: 2px solid #ccff00 !important;
                            background: rgba(204, 255, 0, 0.12) !important;
                            cursor: text;
                        }
                    </style>

                    <!-- TOOLBAR FLOTANTE DE EDICIÓN EN PANTALLA -->
                    <div class="no-print inline-edit-toolbar" style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${this.isInlineEditMode ? '#ccff00' : 'rgba(255,255,255,0.12)'}; border-radius: 16px; padding: 14px 22px; margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px);">
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <button onclick="window.AdminMarketing.toggleInlineEditMode();"
                                style="background: ${this.isInlineEditMode ? '#ccff00' : 'rgba(255,255,255,0.08)'}; color: ${this.isInlineEditMode ? '#000' : '#ffffff'}; border: 1px solid ${this.isInlineEditMode ? '#ccff00' : 'rgba(255,255,255,0.2)'}; padding: 9px 18px; border-radius: 10px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-pen-to-square"></i>
                                <span>${this.isInlineEditMode ? '✖️ Desactivar Edición en Pantalla' : '✏️ Modo Edición Rápida en Pantalla (Clic para editar texto)'}</span>
                            </button>
                            <button onclick="window.AdminMarketing.switchDossierMode('editor');"
                                style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.35); padding: 9px 16px; border-radius: 10px; font-weight: 850; font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-list-check"></i>
                                <span>📝 Editor Formulario Completo</span>
                            </button>
                            ${this.isInlineEditMode ? `
                                <span class="edit-mode-badge" style="color: #ccff00; font-size: 0.82rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-circle-info"></i>
                                    <span>Haz clic sobre cualquier texto para escribir. Al finalizar pulsa Guardar Cambios.</span>
                                </span>
                            ` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            ${this.isInlineEditMode ? `
                                <button onclick="window.AdminMarketing.handleSaveInlineTexts();"
                                    style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 950; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(34,197,94,0.4);">
                                    <i class="fas fa-floppy-disk"></i>
                                    <span>💾 Guardar Cambios</span>
                                </button>
                            ` : ''}
                            <button onclick="window.AdminMarketing.resetCustomTexts();"
                                title="Restablece todos los textos a la redacción oficial de SomosPadel"
                                style="background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); padding: 9px 16px; border-radius: 10px; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-rotate-left"></i>
                                <span>🔄 Restablecer Textos Originales</span>
                            </button>
                        </div>
                    </div>

                    <!-- =================================================================== -->
                    <!-- 🏆 PÁGINA 1: PORTADA EDITORIAL DE ALTO IMPACTO (BLANCO & NEGRO)      -->
                    <!-- =================================================================== -->
                    <div class="pdf-page pdf-page-1" style="background: #ffffff !important; color: #0f172a !important; border: 1.5px solid #e2e8f0; position: relative; overflow: hidden;">
                        
                        <!-- Header de Portada con Logo Oficial -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; position: relative; z-index: 2;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <img src="img/logo_somospadel.png" alt="SomosPadel Logo" style="height: 48px; width: auto; object-fit: contain;" />
                                <div>
                                    <div style="font-size: 1.25rem; font-weight: 950; letter-spacing: 0.5px; color: #0f172a;">SOMOSPADEL</div>
                                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">BARCELONA • HUB OFICIAL</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: #0f172a; color: #ffffff; font-size: 0.72rem; font-weight: 900; letter-spacing: 1px; padding: 6px 14px; border-radius: 999px; text-transform: uppercase;">
                                    ${this.editableField('p1_badge_confidential')}
                                </span>
                                <span style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-size: 0.72rem; font-weight: 800; padding: 6px 12px; border-radius: 999px;">
                                    ${data.season}
                                </span>
                            </div>
                        </div>

                        <!-- Bloque Central de Portada -->
                        <div style="margin: auto 0; position: relative; z-index: 2; padding: 26px 0;">
                            
                            <div style="display: inline-flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #0284c7; color: #0284c7; font-size: 0.8rem; font-weight: 900; letter-spacing: 1.5px; padding: 8px 18px; border-radius: 8px; text-transform: uppercase; margin-bottom: 22px;">
                                <i class="fas fa-handshake"></i>
                                <span>${this.editableField('p1_subbadge')}</span>
                            </div>

                            <h1 style="font-size: 3.2rem; font-weight: 950; line-height: 1.1; margin: 0 0 18px; color: #0f172a; letter-spacing: -1px;">
                                <span style="color: #0369a1;">${this.editableField('p1_brand_name')}</span>
                                <br />
                                <span style="font-size: 2.2rem; color: #94a3b8; font-weight: 800;">×</span>
                                <span style="color: #0f172a;"> ${this.editableField('p1_club_name')}</span>
                            </h1>

                            <p style="font-size: 1.25rem; color: #334155; line-height: 1.5; margin: 0 0 32px; max-width: 700px; font-weight: 600;">
                                ${this.editableField('p1_motto')}
                            </p>

                            <!-- Mini-cajas de impacto en portada (Fondo claro y bordes sutiles) -->
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 26px;">
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; text-align: center;">
                                    <div style="font-size: 2rem; font-weight: 950; color: #0f172a; margin-bottom: 2px;">${this.editableField('p1_card1_val')}</div>
                                    <div style="font-size: 0.75rem; font-weight: 850; color: #0284c7; text-transform: uppercase;">${this.editableField('p1_card1_lbl')}</div>
                                    <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">${this.editableField('p1_card1_sub')}</div>
                                </div>
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; text-align: center;">
                                    <div style="font-size: 2rem; font-weight: 950; color: #0f172a; margin-bottom: 2px;">${this.editableField('p1_card2_val')}</div>
                                    <div style="font-size: 0.75rem; font-weight: 850; color: #0284c7; text-transform: uppercase;">${this.editableField('p1_card2_lbl')}</div>
                                    <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">${this.editableField('p1_card2_sub')}</div>
                                </div>
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; text-align: center;">
                                    <div style="font-size: 2rem; font-weight: 950; color: #0f172a; margin-bottom: 2px;">${this.editableField('p1_card3_val')}</div>
                                    <div style="font-size: 0.75rem; font-weight: 850; color: #0284c7; text-transform: uppercase;">${this.editableField('p1_card3_lbl')}</div>
                                    <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">${this.editableField('p1_card3_sub')}</div>
                                </div>
                            </div>

                        </div>

                        <!-- Footer de Portada -->
                        <div style="border-top: 2px solid #e2e8f0; padding-top: 18px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 2;">
                            <div>
                                <div style="font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 850; letter-spacing: 1px; margin-bottom: 4px;">PRESENTADO POR:</div>
                                <div style="font-size: 1.15rem; font-weight: 950; color: #0f172a;">${data.senderName}</div>
                                <div style="font-size: 0.82rem; color: #0284c7; font-weight: 800;">${data.senderRole}</div>
                                <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">Sede Central: ${data.venueMain}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 850; letter-spacing: 1px; margin-bottom: 4px;">DESTINATARIO:</div>
                                <div style="font-size: 1.15rem; font-weight: 950; color: #0f172a;">${data.brandContact}</div>
                                <div style="font-size: 0.82rem; color: #0284c7; font-weight: 800;">${data.brandName} • ${data.brandContactRole}</div>
                                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 8px;">SomosPadel Barcelona × STK | Dossier de Coopatrocinio 2026 | Página 1 de 5</div>
                            </div>
                        </div>

                    </div>

                    <!-- =================================================================== -->
                    <!-- 📊 PÁGINA 2: QUIÉNES SOMOS & LA FUERZA DE NUESTRA COMUNIDAD        -->
                    <!-- =================================================================== -->
                    <div class="pdf-page pdf-page-2">
                        
                        <!-- Header Editorial -->
                        <div style="border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="background: #0f172a; color: #ccff00; font-size: 0.75rem; font-weight: 950; padding: 4px 10px; border-radius: 6px;">01</span>
                                <h3 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${this.editableField('p2_section_header')}
                                </h3>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 800; color: #64748b;">SomosPadel Barcelona</span>
                        </div>

                        <!-- 1. RESUMEN EJECUTIVO -->
                        <section style="margin-bottom: 24px;">
                            <h2 style="font-size: 1.25rem; font-weight: 950; color: #0f172a; border-left: 5px solid #ccff00; padding-left: 12px; margin-bottom: 12px;">
                                ${this.editableField('p2_exec_title')}
                            </h2>
                            <p style="font-size: 0.95rem; color: #334155; margin: 0 0 12px; text-align: justify; line-height: 1.6;">
                                ${this.editableField('p2_exec_p1', '', 'span')}
                            </p>
                            <p style="font-size: 0.95rem; color: #334155; margin: 0; text-align: justify; line-height: 1.6;">
                                ${this.editableField('p2_exec_p2', '', 'span')}
                            </p>
                        </section>

                        <!-- 2. MÉTRICAS Y ALCANCE CLAVE -->
                        <section style="margin-bottom: 24px;">
                            <h2 style="font-size: 1.25rem; font-weight: 950; color: #0f172a; border-left: 5px solid #0284c7; padding-left: 12px; margin-bottom: 14px;">
                                ${this.editableField('p2_metrics_title')}
                            </h2>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px;">
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                                    <div style="font-size: 1.85rem; font-weight: 950; color: #0f172a; margin-bottom: 2px;">${this.editableField('p2_metric1_val')}</div>
                                    <div style="font-size: 0.72rem; font-weight: 900; color: #0284c7; text-transform: uppercase;">${this.editableField('p2_metric1_lbl')}</div>
                                    <p style="font-size: 0.68rem; color: #64748b; margin: 4px 0 0; line-height: 1.3;">${this.editableField('p2_metric1_desc')}</p>
                                </div>
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                                    <div style="font-size: 1.85rem; font-weight: 950; color: #0284c7; margin-bottom: 2px;">${this.editableField('p2_metric2_val')}</div>
                                    <div style="font-size: 0.72rem; font-weight: 900; color: #0f172a; text-transform: uppercase;">${this.editableField('p2_metric2_lbl')}</div>
                                    <p style="font-size: 0.68rem; color: #64748b; margin: 4px 0 0; line-height: 1.3;">${this.editableField('p2_metric2_desc')}</p>
                                </div>
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                                    <div style="font-size: 1.85rem; font-weight: 950; color: #16a34a; margin-bottom: 2px;">${this.editableField('p2_metric3_val')}</div>
                                    <div style="font-size: 0.72rem; font-weight: 900; color: #0f172a; text-transform: uppercase;">${this.editableField('p2_metric3_lbl')}</div>
                                    <p style="font-size: 0.68rem; color: #64748b; margin: 4px 0 0; line-height: 1.3;">${this.editableField('p2_metric3_desc')}</p>
                                </div>
                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                                    <div style="font-size: 1.85rem; font-weight: 950; color: #d97706; margin-bottom: 2px;">${this.editableField('p2_metric4_val')}</div>
                                    <div style="font-size: 0.72rem; font-weight: 900; color: #0f172a; text-transform: uppercase;">${this.editableField('p2_metric4_lbl')}</div>
                                    <p style="font-size: 0.68rem; color: #64748b; margin: 4px 0 0; line-height: 1.3;">${this.editableField('p2_metric4_desc')}</p>
                                </div>
                            </div>
                        </section>

                        <!-- 3. PERFIL COMERCIAL DEL JUGADOR Y PRESCRIPCIÓN -->
                        <section style="margin-bottom: 20px;">
                            <div style="background: #f1f5f9; border-left: 4px solid #0f172a; border-radius: 0 12px 12px 0; padding: 16px 20px;">
                                <h4 style="font-size: 0.98rem; font-weight: 950; color: #0f172a; margin: 0 0 8px;">
                                    ${this.editableField('p2_player_title')}
                                </h4>
                                <ul style="margin: 0; padding-left: 20px; font-size: 0.88rem; color: #334155; line-height: 1.6;">
                                    <li>${this.editableField('p2_player_item1')}</li>
                                    <li>${this.editableField('p2_player_item2')}</li>
                                    <li>${this.editableField('p2_player_item3')}</li>
                                </ul>
                            </div>
                        </section>

                        <!-- Footer Editorial -->
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #64748b; margin-top: auto;">
                            <span>SomosPadel Barcelona × ${data.brandName} • Dossier Oficial</span>
                            <span>Página 2 de 5</span>
                        </div>

                    </div>

                    <!-- =================================================================== -->
                    <!-- 📱 PÁGINA 3: EL FACTOR DIFERENCIAL DEFINITIVO: LA APP SOMOSPADEL    -->
                    <!-- =================================================================== -->
                    <div class="pdf-page pdf-page-3">
                        
                        <!-- Header Editorial -->
                        <div style="border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="background: #0f172a; color: #ccff00; font-size: 0.75rem; font-weight: 950; padding: 4px 10px; border-radius: 6px;">02</span>
                                <h3 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${this.editableField('p3_section_header')}
                                </h3>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 800; color: #64748b;">Tecnología Propia</span>
                        </div>

                        <!-- INTRODUCCIÓN TECNOLÓGICA -->
                        <section style="margin-bottom: 20px;">
                            <h2 style="font-size: 1.25rem; font-weight: 950; color: #0f172a; border-left: 5px solid #38bdf8; padding-left: 12px; margin-bottom: 10px;">
                                ${this.editableField('p3_tech_title')}
                            </h2>
                            <p style="font-size: 0.92rem; color: #334155; margin: 0 0 14px; text-align: justify; line-height: 1.55;">
                                ${this.editableField('p3_intro')}
                            </p>
                        </section>

                        <!-- LOS 4 ACTIVOS DIGITALES EXCLUSIVOS -->
                        <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(204,255,0,0.2); color: #65a30d; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.9rem;">1</div>
                                    <h4 style="font-size: 0.98rem; font-weight: 900; color: #0f172a; margin: 0;">${this.editableField('p3_asset1_title')}</h4>
                                </div>
                                <p style="font-size: 0.82rem; color: #475569; margin: 0; line-height: 1.5;">
                                    ${this.editableField('p3_asset1_desc')}
                                </p>
                            </div>

                            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(56,189,248,0.2); color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.9rem;">2</div>
                                    <h4 style="font-size: 0.98rem; font-weight: 900; color: #0f172a; margin: 0;">${this.editableField('p3_asset2_title')}</h4>
                                </div>
                                <p style="font-size: 0.82rem; color: #475569; margin: 0; line-height: 1.5;">
                                    ${this.editableField('p3_asset2_desc')}
                                </p>
                            </div>

                            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(245,158,11,0.2); color: #d97706; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.9rem;">3</div>
                                    <h4 style="font-size: 0.98rem; font-weight: 900; color: #0f172a; margin: 0;">${this.editableField('p3_asset3_title')}</h4>
                                </div>
                                <p style="font-size: 0.82rem; color: #475569; margin: 0; line-height: 1.5;">
                                    ${this.editableField('p3_asset3_desc')}
                                </p>
                            </div>

                            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(168,85,247,0.2); color: #7c3aed; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.9rem;">4</div>
                                    <h4 style="font-size: 0.98rem; font-weight: 900; color: #0f172a; margin: 0;">${this.editableField('p3_asset4_title')}</h4>
                                </div>
                                <p style="font-size: 0.82rem; color: #475569; margin: 0; line-height: 1.5;">
                                    ${this.editableField('p3_asset4_desc')}
                                </p>
                            </div>
                        </section>

                        <!-- BANNER DESTACADO DE AUDIENCIA DIGITAL -->
                        <section style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; border-radius: 14px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div>
                                <div style="font-size: 0.72rem; color: #ccff00; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">${this.editableField('p3_banner_tag')}</div>
                                <div style="font-size: 1.15rem; font-weight: 950; margin: 4px 0 2px;">${this.editableField('p3_banner_title')}</div>
                                <div style="font-size: 0.82rem; color: #94a3b8;">${this.editableField('p3_banner_subtitle')}</div>
                            </div>
                            <div style="text-align: right; border-left: 2px solid rgba(255,255,255,0.15); padding-left: 20px;">
                                <div style="font-size: 1.8rem; font-weight: 950; color: #38bdf8;">${this.editableField('p3_banner_metric_val')}</div>
                                <div style="font-size: 0.7rem; color: #cbd5e1; text-transform: uppercase;">${this.editableField('p3_banner_metric_lbl')}</div>
                            </div>
                        </section>

                        <!-- Footer Editorial -->
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #64748b; margin-top: auto;">
                            <span>SomosPadel Barcelona × ${data.brandName} • Dossier Oficial</span>
                            <span>Página 3 de 5</span>
                        </div>

                    </div>

                    <!-- =================================================================== -->
                    <!-- 🥊 PÁGINA 4: COMPARATIVA TRADICIONAL & PLAN OPERATIVO DE ACTIVACIÓN -->
                    <!-- =================================================================== -->
                    <div class="pdf-page pdf-page-4">
                        
                        <!-- Header Editorial -->
                        <div style="border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="background: #0f172a; color: #ccff00; font-size: 0.75rem; font-weight: 950; padding: 4px 10px; border-radius: 6px;">03</span>
                                <h3 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${this.editableField('p4_section_header')}
                                </h3>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 800; color: #64748b;">Retorno Real</span>
                        </div>

                        <!-- COMPARATIVA DEMOLEDORA -->
                        <section style="margin-bottom: 22px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                                <thead>
                                    <tr>
                                        <th style="background: #475569; color: #ffffff; padding: 10px 14px; text-align: left; width: 48%;">${this.editableField('p4_comp_th_pro')}</th>
                                        <th style="background: #0f172a; color: #ccff00; padding: 10px 14px; text-align: left; width: 52%;">${this.editableField('p4_comp_th_sp')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                                        <td style="padding: 10px 14px; color: #64748b;">${this.editableField('p4_comp_row1_pro')}</td>
                                        <td style="padding: 10px 14px; color: #0f172a; font-weight: 800; background: #f0fdf4;">${this.editableField('p4_comp_row1_sp')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                                        <td style="padding: 10px 14px; color: #64748b;">${this.editableField('p4_comp_row2_pro')}</td>
                                        <td style="padding: 10px 14px; color: #0f172a; font-weight: 800; background: #f0fdf4;">${this.editableField('p4_comp_row2_sp')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                                        <td style="padding: 10px 14px; color: #64748b;">${this.editableField('p4_comp_row3_pro')}</td>
                                        <td style="padding: 10px 14px; color: #0f172a; font-weight: 800; background: #f0fdf4;">${this.editableField('p4_comp_row3_sp')}</td>
                                    </tr>
                                    <tr style="background: #f8fafc;">
                                        <td style="padding: 10px 14px; color: #64748b;">${this.editableField('p4_comp_row4_pro')}</td>
                                        <td style="padding: 10px 14px; color: #0f172a; font-weight: 800; background: #f0fdf4;">${this.editableField('p4_comp_row4_sp')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <!-- 3. PLAN OPERATIVO DE ACTIVACIÓN (TABLA DE LOS 5 EJES) -->
                        <section style="margin-bottom: 20px;">
                            <h2 style="font-size: 1.25rem; font-weight: 950; color: #0f172a; border-left: 5px solid #16a34a; padding-left: 12px; margin-bottom: 12px;">
                                ${this.editableField('p4_plan_title')}
                            </h2>
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
                                <thead>
                                    <tr style="background: #0f172a; color: #ffffff;">
                                        <th style="padding: 10px 12px; border-radius: 6px 0 0 0;">EJE DE ACTIVACIÓN</th>
                                        <th style="padding: 10px 12px;">ACCIÓN CONCRETA</th>
                                        <th style="padding: 10px 12px;">IMPACTO PARA ${data.brandName.toUpperCase()}</th>
                                        <th style="padding: 10px 12px; border-radius: 0 6px 0 0;">UBICACIÓN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 9px 12px; font-weight: 900; color: #0f172a;">${this.editableField('p4_pillar1_title')}</td>
                                        <td style="padding: 9px 12px; color: #334155;">${this.editableField('p4_pillar1_action')}</td>
                                        <td style="padding: 9px 12px; color: #16a34a; font-weight: 800;">${this.editableField('p4_pillar1_impact')}</td>
                                        <td style="padding: 9px 12px; color: #64748b;">${this.editableField('p4_pillar1_venue')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                                        <td style="padding: 9px 12px; font-weight: 900; color: #0f172a;">${this.editableField('p4_pillar2_title')}</td>
                                        <td style="padding: 9px 12px; color: #334155;">${this.editableField('p4_pillar2_action')}</td>
                                        <td style="padding: 9px 12px; color: #16a34a; font-weight: 800;">${this.editableField('p4_pillar2_impact')}</td>
                                        <td style="padding: 9px 12px; color: #64748b;">${this.editableField('p4_pillar2_venue')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 9px 12px; font-weight: 900; color: #0f172a;">${this.editableField('p4_pillar3_title')}</td>
                                        <td style="padding: 9px 12px; color: #334155;">${this.editableField('p4_pillar3_action')}</td>
                                        <td style="padding: 9px 12px; color: #16a34a; font-weight: 800;">${this.editableField('p4_pillar3_impact')}</td>
                                        <td style="padding: 9px 12px; color: #64748b;">${this.editableField('p4_pillar3_venue')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                                        <td style="padding: 9px 12px; font-weight: 900; color: #0f172a;">${this.editableField('p4_pillar4_title')}</td>
                                        <td style="padding: 9px 12px; color: #334155;">${this.editableField('p4_pillar4_action')}</td>
                                        <td style="padding: 9px 12px; color: #16a34a; font-weight: 800;">${this.editableField('p4_pillar4_impact')}</td>
                                        <td style="padding: 9px 12px; color: #64748b;">${this.editableField('p4_pillar4_venue')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 9px 12px; font-weight: 900; color: #0f172a;">${this.editableField('p4_pillar5_title')}</td>
                                        <td style="padding: 9px 12px; color: #334155;">${this.editableField('p4_pillar5_action')}</td>
                                        <td style="padding: 9px 12px; color: #16a34a; font-weight: 800;">${this.editableField('p4_pillar5_impact')}</td>
                                        <td style="padding: 9px 12px; color: #64748b;">${this.editableField('p4_pillar5_venue')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <!-- Footer Editorial -->
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #64748b; margin-top: auto;">
                            <span>SomosPadel Barcelona × ${data.brandName} • Dossier Oficial</span>
                            <span>Página 4 de 5</span>
                        </div>

                    </div>

                    <!-- =================================================================== -->
                    <!-- 🤝 PÁGINA 5: PLAN PILOTO DE 90 DÍAS & FORMALIZACIÓN DE LA ALIANZA  -->
                    <!-- =================================================================== -->
                    <div class="pdf-page pdf-page-5">
                        
                        <!-- Header Editorial -->
                        <div style="border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="background: #0f172a; color: #ccff00; font-size: 0.75rem; font-weight: 950; padding: 4px 10px; border-radius: 6px;">04</span>
                                <h3 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${this.editableField('p5_section_header')}
                                </h3>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 800; color: #64748b;">Arranque Ágil</span>
                        </div>

                        <!-- 4. COMPROMISO DE INICIO ÁGIL (PILOTO 90 DÍAS) -->
                        <section style="margin-bottom: 20px;">
                            <h2 style="font-size: 1.25rem; font-weight: 950; color: #0f172a; border-left: 5px solid #f59e0b; padding-left: 12px; margin-bottom: 10px;">
                                ${this.editableField('p5_pilot_title')}
                            </h2>
                            <p style="font-size: 0.92rem; color: #334155; margin: 0 0 16px; text-align: justify; line-height: 1.55;">
                                ${this.editableField('p5_pilot_desc')}
                            </p>

                            <!-- Matriz de las 3 fases del piloto -->
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px;">
                                <div style="background: #f8fafc; border: 1.5px solid #ccff00; border-radius: 12px; padding: 14px;">
                                    <div style="font-size: 0.7rem; font-weight: 950; color: #65a30d; letter-spacing: 0.5px; text-transform: uppercase;">MES 1: DESEMBARCO</div>
                                    <h4 style="font-size: 0.95rem; font-weight: 900; color: #0f172a; margin: 4px 0 6px;">${this.editableField('p5_phase1_title')}</h4>
                                    <ul style="margin: 0; padding-left: 16px; font-size: 0.78rem; color: #475569; line-height: 1.45;">
                                        <li>${this.editableField('p5_phase1_item1')}</li>
                                        <li>${this.editableField('p5_phase1_item2')}</li>
                                        <li>${this.editableField('p5_phase1_item3')}</li>
                                    </ul>
                                </div>

                                <div style="background: #f8fafc; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 14px;">
                                    <div style="font-size: 0.7rem; font-weight: 950; color: #0284c7; letter-spacing: 0.5px; text-transform: uppercase;">MES 2: ACTIVACIÓN</div>
                                    <h4 style="font-size: 0.95rem; font-weight: 900; color: #0f172a; margin: 4px 0 6px;">${this.editableField('p5_phase2_title')}</h4>
                                    <ul style="margin: 0; padding-left: 16px; font-size: 0.78rem; color: #475569; line-height: 1.45;">
                                        <li>${this.editableField('p5_phase2_item1')}</li>
                                        <li>${this.editableField('p5_phase2_item2')}</li>
                                        <li>${this.editableField('p5_phase2_item3')}</li>
                                    </ul>
                                </div>

                                <div style="background: #f8fafc; border: 1.5px solid #f59e0b; border-radius: 12px; padding: 14px;">
                                    <div style="font-size: 0.7rem; font-weight: 950; color: #d97706; letter-spacing: 0.5px; text-transform: uppercase;">MES 3: ESCALADO</div>
                                    <h4 style="font-size: 0.95rem; font-weight: 900; color: #0f172a; margin: 4px 0 6px;">${this.editableField('p5_phase3_title')}</h4>
                                    <ul style="margin: 0; padding-left: 16px; font-size: 0.78rem; color: #475569; line-height: 1.45;">
                                        <li>${this.editableField('p5_phase3_item1')}</li>
                                        <li>${this.editableField('p5_phase3_item2')}</li>
                                        <li>${this.editableField('p5_phase3_item3')}</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <!-- COMPROMISOS MUTUOS -->
                        <section style="background: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
                            <h4 style="font-size: 0.92rem; font-weight: 950; color: #0f172a; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${this.editableField('p5_commitments_title')}
                            </h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; font-size: 0.84rem; color: #334155;">
                                <div>
                                    <strong style="color: #0f172a;">${this.editableField('p5_brand_commit_title')}</strong>
                                    <ul style="margin: 4px 0 0; padding-left: 18px; line-height: 1.5;">
                                        <li>${this.editableField('p5_brand_c1')}</li>
                                        <li>${this.editableField('p5_brand_c2')}</li>
                                        <li>${this.editableField('p5_brand_c3')}</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong style="color: #0f172a;">${this.editableField('p5_sp_commit_title')}</strong>
                                    <ul style="margin: 4px 0 0; padding-left: 18px; line-height: 1.5;">
                                        <li>${this.editableField('p5_sp_c1')}</li>
                                        <li>${this.editableField('p5_sp_c2')}</li>
                                        <li>${this.editableField('p5_sp_c3')}</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <!-- BLOQUE FORMAL DE FIRMAS -->
                        <section style="margin-top: auto; border-top: 2px dashed #94a3b8; padding-top: 24px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                                <div style="border-top: 2px solid #0f172a; padding-top: 12px;">
                                    <div style="font-weight: 950; font-size: 0.98rem; color: #0f172a;">${this.editableField('p5_sign_sp_entity')}</div>
                                    <div style="font-size: 0.88rem; font-weight: 800; color: #334155; margin-top: 2px;">${this.editableField('p5_sign_sp_rep')}</div>
                                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">${data.senderEmail} • ${data.senderPhone}</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${data.venueMain} • Barcelona</div>
                                    <div style="margin-top: 16px; height: 35px; border-bottom: 1px dotted #cbd5e1;"></div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; text-align: center; margin-top: 4px;">Firma y Sello</div>
                                </div>

                                <div style="border-top: 2px solid #0f172a; padding-top: 12px;">
                                    <div style="font-weight: 950; font-size: 0.98rem; color: #0f172a;">${this.editableField('p5_sign_brand_entity')}</div>
                                    <div style="font-size: 0.88rem; font-weight: 800; color: #334155; margin-top: 2px;">${this.editableField('p5_sign_brand_rep')}</div>
                                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Kilian / Equipo STK • ${this.editableField('p5_sign_brand_sub')}</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">Dirección Comercial & Alianzas</div>
                                    <div style="margin-top: 16px; height: 35px; border-bottom: 1px dotted #cbd5e1;"></div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; text-align: center; margin-top: 4px;">Firma y Sello</div>
                                </div>
                            </div>
                        </section>

                        <!-- Footer Editorial -->
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #64748b; margin-top: 18px;">
                            <span>SomosPadel Barcelona × ${data.brandName} • Dossier Oficial</span>
                            <span>Página 5 de 5</span>
                        </div>

                    </div>

                </div>
            `;
        }

        // =========================================================================
        // ✏️ SUB-MODO: EDITOR DE CONTENIDOS DEL DOSSIER (FORMULARIO ESTRUCTURADO)
        // =========================================================================
        renderTextEditor() {
            return `
                <div class="no-print" style="max-width: 1040px; margin: 0 auto; background: rgba(15, 23, 42, 0.92); border: 1.5px solid rgba(236, 72, 153, 0.35); border-radius: 24px; padding: 36px 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <style>
                        .marketing-admin-wrapper textarea,
                        .marketing-admin-wrapper .ed-textarea,
                        .ed-textarea {
                            height: auto !important;
                            min-height: 120px !important;
                            max-height: none !important;
                            resize: vertical !important;
                            line-height: 1.6 !important;
                            font-size: 0.92rem !important;
                            font-family: inherit !important;
                            padding: 12px 16px !important;
                            border-radius: 12px !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                            background: rgba(15, 23, 42, 0.95) !important;
                            border: 1px solid rgba(255, 255, 255, 0.18) !important;
                            color: #ffffff !important;
                            -webkit-text-fill-color: #ffffff !important;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                        }
                        .marketing-admin-wrapper textarea:focus,
                        .marketing-admin-wrapper .ed-textarea:focus,
                        .ed-textarea:focus {
                            border-color: #38bdf8 !important;
                            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
                            outline: none !important;
                        }
                        .marketing-admin-wrapper textarea.ed-textarea-large,
                        .ed-textarea-large,
                        #ed_p2_exec_p1,
                        #ed_p2_exec_p2,
                        #ed_p3_intro,
                        #ed_p5_pilot_desc {
                            min-height: 145px !important;
                        }
                        .marketing-admin-wrapper input[type="text"],
                        .marketing-admin-wrapper .ed-input,
                        .ed-input {
                            height: 46px !important;
                            padding: 12px 16px !important;
                            font-size: 0.92rem !important;
                            border-radius: 10px !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                            background: rgba(15, 23, 42, 0.95) !important;
                            border: 1px solid rgba(255, 255, 255, 0.18) !important;
                            color: #ffffff !important;
                            -webkit-text-fill-color: #ffffff !important;
                        }
                        .marketing-admin-wrapper input[type="text"]:focus,
                        .marketing-admin-wrapper .ed-input:focus,
                        .ed-input:focus {
                            border-color: #38bdf8 !important;
                            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
                            outline: none !important;
                        }
                    </style>

                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 18px; margin-bottom: 28px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 50px; height: 50px; border-radius: 14px; background: rgba(236, 72, 153, 0.15); display: flex; align-items: center; justify-content: center; color: #ec4899; font-size: 1.4rem;">
                                <i class="fas fa-pen-fancy"></i>
                            </div>
                            <div>
                                <h2 style="font-size: 1.5rem; font-weight: 950; margin: 0; color: #ffffff;">Editor de Contenidos del Dossier</h2>
                                <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">Modifica cualquier texto de las 5 páginas A4. Se guardará de forma persistente y se reflejará en la previsualización y el PDF.</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.AdminMarketing.switchDossierMode('executive');"
                                style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; padding: 10px 18px; border-radius: 12px; font-size: 0.84rem; font-weight: 800; cursor: pointer;">
                                <i class="fas fa-eye"></i> Ver PDF A4
                            </button>
                        </div>
                    </div>

                    <form onsubmit="event.preventDefault(); window.AdminMarketing.handleSaveEditorTexts();" style="display: flex; flex-direction: column; gap: 28px;">
                        
                        <!-- SECCIÓN PÁGINA 1 -->
                        <div style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px;">
                            <h3 style="color: #fbbf24; font-size: 1.1rem; font-weight: 900; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
                                <span>📄 PÁGINA 1: PORTADA</span>
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Subtítulo Superior (Badge)</label>
                                    <input type="text" id="ed_p1_subbadge" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p1_subbadge')))}" />
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Nombre de Marca</label>
                                        <input type="text" id="ed_p1_brand_name" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p1_brand_name')))}" />
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Nombre del Club</label>
                                        <input type="text" id="ed_p1_club_name" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p1_club_name')))}" />
                                    </div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Lema / Frase Destacada</label>
                                    <input type="text" id="ed_p1_motto" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p1_motto')))}" />
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN PÁGINA 2 -->
                        <div style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px;">
                            <h3 style="color: #38bdf8; font-size: 1.1rem; font-weight: 900; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
                                <span>📊 PÁGINA 2: COMUNIDAD & MÉTRICAS</span>
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Resumen Ejecutivo - Párrafo 1</label>
                                    <textarea id="ed_p2_exec_p1" class="ed-textarea ed-textarea-large" rows="6">${this.cleanForEditor(this.getText('p2_exec_p1'))}</textarea>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Resumen Ejecutivo - Párrafo 2</label>
                                    <textarea id="ed_p2_exec_p2" class="ed-textarea ed-textarea-large" rows="6">${this.cleanForEditor(this.getText('p2_exec_p2'))}</textarea>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                                    <div>
                                        <label style="display: block; font-size: 0.72rem; font-weight: 850; color: #cbd5e1; margin-bottom: 4px;">Métrica 1 (Valor)</label>
                                        <input type="text" id="ed_p2_metric1_val" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p2_metric1_val')))}" />
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.72rem; font-weight: 850; color: #cbd5e1; margin-bottom: 4px;">Métrica 2 (Valor)</label>
                                        <input type="text" id="ed_p2_metric2_val" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p2_metric2_val')))}" />
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.72rem; font-weight: 850; color: #cbd5e1; margin-bottom: 4px;">Métrica 3 (Valor)</label>
                                        <input type="text" id="ed_p2_metric3_val" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p2_metric3_val')))}" />
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.72rem; font-weight: 850; color: #cbd5e1; margin-bottom: 4px;">Métrica 4 (Valor)</label>
                                        <input type="text" id="ed_p2_metric4_val" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p2_metric4_val')))}" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN PÁGINA 3 -->
                        <div style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px;">
                            <h3 style="color: #ccff00; font-size: 1.1rem; font-weight: 900; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
                                <span>📱 PÁGINA 3: TECNOLOGÍA & APP SOMOSPADEL</span>
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Introducción Factor Tecnológico</label>
                                    <textarea id="ed_p3_intro" class="ed-textarea ed-textarea-large" rows="6">${this.cleanForEditor(this.getText('p3_intro'))}</textarea>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Activo 1: Banner Home (Descripción)</label>
                                        <textarea id="ed_p3_asset1_desc" class="ed-textarea" rows="4">${this.cleanForEditor(this.getText('p3_asset1_desc'))}</textarea>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Activo 2: Tienda Oficial (Descripción)</label>
                                        <textarea id="ed_p3_asset2_desc" class="ed-textarea" rows="4">${this.cleanForEditor(this.getText('p3_asset2_desc'))}</textarea>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Activo 3: Notificaciones (Descripción)</label>
                                        <textarea id="ed_p3_asset3_desc" class="ed-textarea" rows="4">${this.cleanForEditor(this.getText('p3_asset3_desc'))}</textarea>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Activo 4: Algoritmo ELO (Descripción)</label>
                                        <textarea id="ed_p3_asset4_desc" class="ed-textarea" rows="4">${this.cleanForEditor(this.getText('p3_asset4_desc'))}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN PÁGINA 4 -->
                        <div style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px;">
                            <h3 style="color: #a855f7; font-size: 1.1rem; font-weight: 900; margin: 0 0 16px; display: center; align-items: center; gap: 8px;">
                                <span>🥊 PÁGINA 4: COMPARATIVA & PLAN DE ACTIVACIÓN</span>
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Pilar 1: Test Days (Acción e Impacto)</label>
                                    <input type="text" id="ed_p4_pillar1_action" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p4_pillar1_action')))}" style="margin-bottom: 8px;" />
                                    <input type="text" id="ed_p4_pillar1_impact" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p4_pillar1_impact')))}" />
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Pilar 2: Premios & Torneos (Acción e Impacto)</label>
                                    <input type="text" id="ed_p4_pillar2_action" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p4_pillar2_action')))}" style="margin-bottom: 8px;" />
                                    <input type="text" id="ed_p4_pillar2_impact" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p4_pillar2_impact')))}" />
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN PÁGINA 5 -->
                        <div style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px;">
                            <h3 style="color: #f59e0b; font-size: 1.1rem; font-weight: 900; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
                                <span>🤝 PÁGINA 5: PLAN PILOTO 90 DÍAS & COMPROMISOS</span>
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Compromiso del Piloto de 90 Días</label>
                                    <textarea id="ed_p5_pilot_desc" class="ed-textarea ed-textarea-large" rows="6">${this.cleanForEditor(this.getText('p5_pilot_desc'))}</textarea>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Compromisos de la Marca</label>
                                        <input type="text" id="ed_p5_brand_c1" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p5_brand_c1')))}" style="margin-bottom: 8px;" />
                                        <input type="text" id="ed_p5_brand_c2" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p5_brand_c2')))}" style="margin-bottom: 8px;" />
                                        <input type="text" id="ed_p5_brand_c3" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p5_brand_c3')))}" />
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.78rem; font-weight: 850; color: #cbd5e1; margin-bottom: 6px;">Compromisos de SomosPadel</label>
                                        <input type="text" id="ed_p5_sp_c1" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p5_sp_c1')))}" style="margin-bottom: 8px;" />
                                        <input type="text" id="ed_p5_sp_c2" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p5_sp_c2')))}" style="margin-bottom: 8px;" />
                                        <input type="text" id="ed_p5_sp_c3" class="ed-input" value="${this.escapeForJs(this.cleanForEditor(this.getText('p5_sp_c3')))}" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- BOTONES DE ACCIÓN DEL FORMULARIO -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 22px;">
                            <button type="button" onclick="window.AdminMarketing.resetCustomTexts();"
                                style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 12px 20px; border-radius: 12px; font-weight: 850; font-size: 0.88rem; cursor: pointer;">
                                <i class="fas fa-rotate-left"></i> Restablecer Textos Originales
                            </button>
                            <div style="display: flex; gap: 12px;">
                                <button type="button" onclick="window.AdminMarketing.switchDossierMode('executive');"
                                    style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; padding: 12px 22px; border-radius: 12px; font-weight: 850; font-size: 0.88rem; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: #ffffff; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 950; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(236,72,153,0.4);">
                                    <i class="fas fa-floppy-disk"></i> Guardar Todos los Textos
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            `;
        }

        handleSaveEditorTexts() {
            if (typeof document === 'undefined') return;
            const updated = { ...this.customTexts };
            const fields = [
                'p1_subbadge', 'p1_brand_name', 'p1_club_name', 'p1_motto',
                'p2_exec_p1', 'p2_exec_p2', 'p2_metric1_val', 'p2_metric2_val', 'p2_metric3_val', 'p2_metric4_val',
                'p3_intro', 'p3_asset1_desc', 'p3_asset2_desc', 'p3_asset3_desc', 'p3_asset4_desc',
                'p4_pillar1_action', 'p4_pillar1_impact', 'p4_pillar2_action', 'p4_pillar2_impact',
                'p5_pilot_desc', 'p5_brand_c1', 'p5_brand_c2', 'p5_brand_c3', 'p5_sp_c1', 'p5_sp_c2', 'p5_sp_c3'
            ];

            fields.forEach(f => {
                const el = document.getElementById(`ed_${f}`);
                if (el && el.value !== undefined) {
                    updated[f] = this.cleanForEditor(el.value);
                }
            });

            this.saveCustomTexts(updated);
            this.showToast('✅ ¡Textos del dossier guardados correctamente!');
            this.switchDossierMode('executive');
        }

        // =========================================================================
        // 📋 SUB-MODO: TEXTOS Y CARTAS COPIABLES EN 1 CLIC
        // =========================================================================
        renderCopyableTexts() {
            const emailSubject = "Propuesta Alianza Estratégica SomosPadel Barcelona × STK (Shot To Kill)";
            const emailBody = `Hola Kilian / Equipo STK,

Un placer haber podido conversar contigo sobre el proyecto y la evolución de SomosPadel Barcelona.

Tal y como comentamos, te hago llegar el resumen ejecutivo de la propuesta de coopatrocinio y activación de marca con STK (Shot To Kill):

1. ¿QUIÉNES SOMOS Y DÓNDE ESTAMOS?
• Comunidad consolidada de más de 190-200 jugadores activos semanales.
• Sede central de entrenamientos en Barcelona Pádel El Prat (+ sedes satélite en Cornellà y L'Hospitalet).
• 8 equipos compitiendo en la Liga Summa Pádel y torneos de Cataluña.
• App Móvil propia (PWA) para iOS y Android donde los jugadores gestionan sus partidos, convocatorias, rankings ELO y tienda.

2. EL FACTOR DIFERENCIAL (POR QUÉ SOMOSPADEL VS PATROCINIO INDIVIDUAL):
En lugar de patrocinar a un jugador profesional aislado que apenas genera impacto comercial directo, en SomosPadel ponemos las palas y la marca STK directamente en las manos de más de 200 jugadores que renuevan material cada año y prescriben el producto a sus rivales de pista cada fin de semana.

3. EJES DE ACTIVACIÓN PROPUESTOS (WIN-WIN):
• Test Days en entrenamientos: 3-4 palas de prueba en Barcelona Pádel El Prat para que los jugadores jueguen y sientan la pala en partidos reales.
• Premios y Welcome Packs en Americanas: Visibilidad de paleteros y material STK en los torneos mensuales del club.
• Equipaciones de los 8 equipos: Presencia del logotipo STK en las camisetas oficiales de la Liga Summa.
• Ecosistema Digital: Banner patrocinador en la portada de nuestra App y ficha de producto en la tienda oficial para compra directa.
• Código preferente de compra para los socios de la comunidad.

4. PROPUESTA DE ARRANQUE ÁGIL (PILOTO 90 DÍAS):
Nuestra intención es empezar sin fricciones: arrancamos con un piloto de 3 meses para que podáis comprobar de primera mano la acogida, el feedback de los jugadores y las ventas antes de cerrar el marco anual definitivo.

Quedo a vuestra disposición para concretar los 2 o 3 modelos de test con los que iniciamos y organizar el primer Test Day esta misma semana.

Un abrazo,

Alex Coscolin
Fundador & Responsable SomosPadel Barcelona
Tel / WhatsApp: +34 600 000 000
Web: https://somospadelbcn.es`;

            const whatsappMessage = `¡Hola Kilian! 👋 Qué tal, soy Alex de SomosPadel Barcelona. 

Un placer haber hablado. Te resumo por aquí los puntos clave que comentamos para la colaboración con STK:

🎾 *SomosPadel en Cifras:* +190 jugadores activos semanales, 8 equipos oficiales en la Liga Summa Pádel y sede central en Barcelona Pádel El Prat.
📱 *App Propia:* Plataforma móvil propia donde 200 jugadores consultan resultados, ELO y tienda cada semana.
🤝 *Propuesta STK:* 
1. Test Days con palas de prueba en nuestros entrenamientos.
2. Premios STK en nuestras americanas oficiales.
3. Presencia de marca en las equipaciones de los 8 equipos y banner en la App.
4. Código de descuento y compra preferente para la comunidad.

La idea es arrancar con un *piloto ágil de 3 meses* sin complicaciones para que veáis el retorno en pista y ventas. 

¿Cuándo te vendría bien que coordinemos las palas de test para el primer entreno? ¡Un abrazo!`;

            const elevatorPitch = `SomosPadel es una comunidad activa de 200 jugadores en Barcelona con 8 equipos federados, entrenamientos semanales en El Prat y una app móvil propia. Frente a patrocinar a un jugador individual que nadie ve competir, nosotros ponemos las palas de STK directamente en la mano de 200 compradores reales a través de Test Days en pista, premios en torneos, presencia en equipaciones y venta directa en nuestra app. Proponemos un piloto de 3 meses para validar ventas y consolidar la alianza.`;

            return `
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    
                    <!-- 1. EMAIL FORMAL -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid rgba(56, 189, 248, 0.25); border-radius: 20px; padding: 28px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(56,189,248,0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.2rem;">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin: 0;">
                                        1. Email Formal Post-Reunión (STK)
                                    </h3>
                                    <span style="font-size: 0.8rem; color: #94a3b8;">Asunto: ${emailSubject}</span>
                                </div>
                            </div>
                            <button onclick="window.AdminMarketing.copyToClipboard('${this.escapeForJs(emailSubject + '\n\n' + emailBody)}', 'Email completo copiado al portapapeles')"
                                style="background: #38bdf8; color: #000; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(56,189,248,0.3);">
                                <i class="fas fa-copy"></i>
                                <span>Copiar Email Completo</span>
                            </button>
                        </div>
                        <div style="background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; font-family: monospace; font-size: 0.84rem; color: #cbd5e1; white-space: pre-wrap; line-height: 1.6; max-height: 300px; overflow-y: auto;">${emailBody}</div>
                    </div>

                    <!-- 2. WHATSAPP ÁGIL -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid rgba(34, 197, 94, 0.25); border-radius: 20px; padding: 28px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(34,197,94,0.15); display: flex; align-items: center; justify-content: center; color: #22c55e; font-size: 1.2rem;">
                                    <i class="fab fa-whatsapp"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin: 0;">
                                        2. Mensaje Ágil de WhatsApp para Kilian / STK
                                    </h3>
                                    <span style="font-size: 0.8rem; color: #94a3b8;">Formato optimizado con emojis y negritas para lectura rápida</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="window.AdminMarketing.copyToClipboard('${this.escapeForJs(whatsappMessage)}', 'Mensaje de WhatsApp copiado al portapapeles')"
                                    style="background: #22c55e; color: #000; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(34,197,94,0.3);">
                                    <i class="fas fa-copy"></i>
                                    <span>Copiar WhatsApp</span>
                                </button>
                                <a href="https://wa.me/?text=${encodeURIComponent(whatsappMessage)}" target="_blank"
                                    style="background: rgba(34,197,94,0.15); border: 1px solid #22c55e; color: #22c55e; border-radius: 10px; padding: 10px 16px; font-weight: 900; font-size: 0.85rem; text-decoration: none; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-external-link-alt"></i>
                                    <span>Abrir Web WhatsApp</span>
                                </a>
                            </div>
                        </div>
                        <div style="background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; font-family: monospace; font-size: 0.84rem; color: #cbd5e1; white-space: pre-wrap; line-height: 1.6;">${whatsappMessage}</div>
                    </div>

                    <!-- 3. ELEVATOR PITCH -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid rgba(245, 158, 11, 0.25); border-radius: 20px; padding: 28px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.2rem;">
                                    <i class="fas fa-bolt"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin: 0;">
                                        3. Pitch Ejecutivo de 1 Minuto (Elevator Pitch)
                                    </h3>
                                    <span style="font-size: 0.8rem; color: #94a3b8;">Ideal para llamadas telefónicas, audios de voz o reuniones rápidas</span>
                                </div>
                            </div>
                            <button onclick="window.AdminMarketing.copyToClipboard('${this.escapeForJs(elevatorPitch)}', 'Pitch de 1 minuto copiado')"
                                style="background: #fbbf24; color: #000; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(245,158,11,0.3);">
                                <i class="fas fa-copy"></i>
                                <span>Copiar Pitch</span>
                            </button>
                        </div>
                        <div style="background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; font-family: 'Outfit', sans-serif; font-size: 0.95rem; color: #ffffff; line-height: 1.6; font-style: italic;">
                            "${elevatorPitch}"
                        </div>
                    </div>

                </div>
            `;
        }

        // =========================================================================
        // 🗓️ PESTAÑA 2: PLAN DE ACTIVACIONES & EVENTOS (MATRIZ + CHECKLIST)
        // =========================================================================
        renderActivacionesTab() {
            const defaultTasks = [
                { id: 't1', phase: 'Fase 1', title: 'Enviar email formal y propuesta resumida a Kilian (STK)', done: true },
                { id: 't2', phase: 'Fase 1', title: 'Recepción del pack de test (3 palas STK para entrenamientos)', done: false },
                { id: 't3', phase: 'Fase 1', title: 'Configurar banner de bienvenida STK en la App SomosPadel', done: false },
                { id: 't4', phase: 'Fase 2', title: 'Organizar 1er Test Day oficial en Barcelona Pádel El Prat', done: false },
                { id: 't5', phase: 'Fase 2', title: 'Celebrar Americana Oficial con Pala STK como Premio Oro', done: false },
                { id: 't6', phase: 'Fase 2', title: 'Habilitar cupón descuento STK en la tienda online del club', done: false },
                { id: 't7', phase: 'Fase 3', title: 'Diseñar camiseta oficial de los 8 equipos con logo STK en manga', done: false },
                { id: 't8', phase: 'Fase 3', title: 'Publicar Reels & Fotos de jugadores probando las palas en Instagram', done: false },
                { id: 't9', phase: 'Fase 4', title: 'Reunión de balance de 90 días y firma de renovación anual', done: false }
            ];

            let tasks = defaultTasks;
            try {
                const stored = localStorage.getItem(STORAGE_TASKS_KEY);
                if (stored) {
                    tasks = JSON.parse(stored);
                }
            } catch (e) {}

            const completedCount = tasks.filter(t => t.done).length;
            const progressPct = Math.round((completedCount / tasks.length) * 100);

            return `
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    
                    <!-- BARRA DE PROGRESO DE ACTIVACIONES -->
                    <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px 26px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;">
                        <div>
                            <div style="font-size: 0.8rem; font-weight: 900; color: #fbbf24; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
                                ROADMAP DE ACTIVACIÓN STK × SOMOSPADEL
                            </div>
                            <h3 style="font-size: 1.4rem; font-weight: 950; margin: 0; color: #ffffff;">
                                Progreso Global del Acuerdo: <span style="color: #ccff00;">${progressPct}%</span>
                            </h3>
                        </div>
                        <div style="flex: 1; max-width: 400px; min-width: 200px;">
                            <div style="height: 12px; background: rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; position: relative;">
                                <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, #f59e0b 0%, #ccff00 100%); border-radius: 6px; transition: width 0.4s ease;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8; margin-top: 6px;">
                                <span>${completedCount} de ${tasks.length} acciones completadas</span>
                                <span>Fase 1 en progreso</span>
                            </div>
                        </div>
                    </div>

                    <!-- MATRIZ DE FASES -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(245,158,11,0.3); border-radius: 16px; padding: 18px;">
                            <div style="background: rgba(245,158,11,0.15); color: #fbbf24; font-size: 0.72rem; font-weight: 900; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 10px;">
                                FASE 1 • SEMANAS 1-2
                            </div>
                            <h4 style="font-size: 0.95rem; font-weight: 900; color: #ffffff; margin: 0 0 8px;">Desembarco & Test</h4>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4;">Llegada de palas, asignación a capitanes y alta del banner en la App.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(56,189,248,0.3); border-radius: 16px; padding: 18px;">
                            <div style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.72rem; font-weight: 900; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 10px;">
                                FASE 2 • MES 1-2
                            </div>
                            <h4 style="font-size: 0.95rem; font-weight: 900; color: #ffffff; margin: 0 0 8px;">Torneo & Promoción</h4>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4;">Americana STK con pala de premio y cupón con descuento en tienda.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(204,255,0,0.3); border-radius: 16px; padding: 18px;">
                            <div style="background: rgba(204,255,0,0.15); color: #ccff00; font-size: 0.72rem; font-weight: 900; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 10px;">
                                FASE 3 • MES 2-3
                            </div>
                            <h4 style="font-size: 0.95rem; font-weight: 900; color: #ffffff; margin: 0 0 8px;">Equipaciones Liga Summa</h4>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4;">Presencia en camisetas de los 8 equipos y generación de contenidos.</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; padding: 18px;">
                            <div style="background: rgba(168,85,247,0.15); color: #c084fc; font-size: 0.72rem; font-weight: 900; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 10px;">
                                FASE 4 • MES 3+
                            </div>
                            <h4 style="font-size: 0.95rem; font-weight: 900; color: #ffffff; margin: 0 0 8px;">Alianza Anual</h4>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4;">Auditoría de ventas generadas y firma del acuerdo anual completo.</p>
                        </div>
                    </div>

                    <!-- CHECKLIST INTERACTIVO CON PERSISTENCIA -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 26px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                            <h3 style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin: 0; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-list-check" style="color: #ccff00;"></i>
                                <span>Checklist Operativo de Activación</span>
                            </h3>
                            <button onclick="window.AdminMarketing.resetTasks();"
                                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 0.75rem; padding: 6px 12px; border-radius: 8px; cursor: pointer;">
                                Restablecer Checklist
                            </button>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${tasks.map((task, idx) => `
                                <div onclick="window.AdminMarketing.toggleTask('${task.id}');"
                                    style="display: flex; align-items: center; justify-content: space-between; background: ${task.done ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid ${task.done ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.06)'}; border-radius: 12px; padding: 14px 18px; cursor: pointer; transition: all 0.2s;"
                                    onmouseover="this.style.transform='translateX(4px)';"
                                    onmouseout="this.style.transform='none';">
                                    <div style="display: flex; align-items: center; gap: 14px;">
                                        <div style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid ${task.done ? '#22c55e' : '#64748b'}; background: ${task.done ? '#22c55e' : 'transparent'}; display: flex; align-items: center; justify-content: center; color: #000; font-size: 0.75rem; font-weight: 950;">
                                            ${task.done ? '<i class="fas fa-check"></i>' : ''}
                                        </div>
                                        <span style="font-size: 0.88rem; font-weight: 700; color: ${task.done ? '#86efac' : '#e2e8f0'}; text-decoration: ${task.done ? 'line-through' : 'none'};">
                                            ${task.title}
                                        </span>
                                    </div>
                                    <span style="font-size: 0.7rem; font-weight: 800; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px; color: #94a3b8;">
                                        ${task.phase}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                </div>
            `;
        }

        toggleTask(taskId) {
            try {
                let tasks = JSON.parse(localStorage.getItem(STORAGE_TASKS_KEY) || '[]');
                if (!tasks || !tasks.length) {
                    tasks = [
                        { id: 't1', phase: 'Fase 1', title: 'Enviar email formal y propuesta resumida a Kilian (STK)', done: true },
                        { id: 't2', phase: 'Fase 1', title: 'Recepción del pack de test (3 palas STK para entrenamientos)', done: false },
                        { id: 't3', phase: 'Fase 1', title: 'Configurar banner de bienvenida STK en la App SomosPadel', done: false },
                        { id: 't4', phase: 'Fase 2', title: 'Organizar 1er Test Day oficial en Barcelona Pádel El Prat', done: false },
                        { id: 't5', phase: 'Fase 2', title: 'Celebrar Americana Oficial con Pala STK como Premio Oro', done: false },
                        { id: 't6', phase: 'Fase 2', title: 'Habilitar cupón descuento STK en la tienda online del club', done: false },
                        { id: 't7', phase: 'Fase 3', title: 'Diseñar camiseta oficial de los 8 equipos con logo STK en manga', done: false },
                        { id: 't8', phase: 'Fase 3', title: 'Publicar Reels & Fotos de jugadores probando las palas en Instagram', done: false },
                        { id: 't9', phase: 'Fase 4', title: 'Reunión de balance de 90 días y firma de renovación anual', done: false }
                    ];
                }
                const target = tasks.find(t => t.id === taskId);
                if (target) {
                    target.done = !target.done;
                    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
                    this.render();
                }
            } catch (e) {}
        }

        resetTasks() {
            localStorage.removeItem(STORAGE_TASKS_KEY);
            this.render();
        }

        // =========================================================================
        // 📱 PESTAÑA 3: ECOSISTEMA APP (SHOWCASE DIGITAL INTERACTIVO)
        // =========================================================================
        renderAppShowcaseTab() {
            return `
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px 28px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
                        <div>
                            <span style="font-size: 0.75rem; font-weight: 900; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase;">
                                DEMOSTRADOR VISUAL INTERACTIVO
                            </span>
                            <h3 style="font-size: 1.4rem; font-weight: 950; margin: 4px 0 0; color: #ffffff;">
                                Así se ve STK dentro de la App de los Jugadores
                            </h3>
                        </div>
                        
                        <!-- SELECTOR DE SIMULACIÓN -->
                        <div style="display: flex; background: rgba(0,0,0,0.4); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                            <button onclick="window.AdminMarketing.switchAppMockup('banner');"
                                style="padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; border: none; cursor: pointer; ${this.activeAppMockup === 'banner' ? 'background: #ccff00; color: #000;' : 'background: transparent; color: #cbd5e1;'}">
                                🏠 Banner en Home
                            </button>
                            <button onclick="window.AdminMarketing.switchAppMockup('push');"
                                style="padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; border: none; cursor: pointer; ${this.activeAppMockup === 'push' ? 'background: #ccff00; color: #000;' : 'background: transparent; color: #cbd5e1;'}">
                                🔔 Push Notification
                            </button>
                            <button onclick="window.AdminMarketing.switchAppMockup('store');"
                                style="padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; border: none; cursor: pointer; ${this.activeAppMockup === 'store' ? 'background: #ccff00; color: #000;' : 'background: transparent; color: #cbd5e1;'}">
                                🛍️ Ficha Tienda Oficial
                            </button>
                        </div>
                    </div>

                    <!-- MOCKUP DEL SMARTPHONE -->
                    <div style="display: flex; justify-content: center; padding: 20px 0;">
                        <div style="width: 360px; height: 680px; background: #000000; border: 8px solid #334155; border-radius: 46px; box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(56,189,248,0.2); position: relative; overflow: hidden; display: flex; flex-direction: column;">
                            
                            <!-- BARRITA SUPERIOR / ISLA DEL MÓVIL -->
                            <div style="height: 28px; background: #000000; display: flex; align-items: center; justify-content: center; position: relative;">
                                <div style="width: 110px; height: 16px; background: #1e293b; border-radius: 10px;"></div>
                            </div>

                            <!-- PANTALLA SIMULADA DE SOMOSPADEL APP -->
                            <div style="flex: 1; background: #0b0f17; overflow-y: auto; padding: 16px; color: #ffffff; font-family: 'Outfit', sans-serif;">
                                
                                <!-- APP HEADER -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 28px; height: 28px; border-radius: 8px; background: #ccff00; color: #000; font-weight: 950; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">SP</div>
                                        <span style="font-weight: 900; font-size: 0.9rem; letter-spacing: 0.5px;">SOMOSPADEL</span>
                                    </div>
                                    <div style="display: flex; gap: 10px; color: #94a3b8; font-size: 0.9rem;">
                                        <i class="fas fa-bell"></i>
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                </div>

                                <!-- CONTENIDO SEGÚN MOCKUP SELECCIONADO -->
                                ${this.renderMockupScreen()}

                            </div>

                            <!-- BARRA DE NAVEGACIÓN INFERIOR DEL MÓVIL -->
                            <div style="height: 52px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-around; align-items: center; color: #94a3b8; font-size: 0.72rem;">
                                <div style="display: flex; flex-direction: column; align-items: center; color: #ccff00;">
                                    <i class="fas fa-home" style="font-size: 1rem;"></i>
                                    <span>Inicio</span>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <i class="fas fa-trophy" style="font-size: 1rem;"></i>
                                    <span>Torneos</span>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <i class="fas fa-ranking-star" style="font-size: 1rem;"></i>
                                    <span>Ranking</span>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <i class="fas fa-bag-shopping" style="font-size: 1rem;"></i>
                                    <span>Tienda</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            `;
        }

        switchAppMockup(type) {
            this.activeAppMockup = type;
            this.render();
        }

        renderMockupScreen() {
            if (this.activeAppMockup === 'banner') {
                return `
                    <!-- BANNER PATROCINADOR STK -->
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1.5px solid #f59e0b; border-radius: 16px; padding: 14px; margin-bottom: 16px; box-shadow: 0 8px 20px rgba(245,158,11,0.25);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="background: #f59e0b; color: #000; font-size: 0.6rem; font-weight: 950; padding: 2px 6px; border-radius: 4px;">PATROCINADOR OFICIAL</span>
                            <span style="font-size: 0.65rem; color: #ccff00; font-weight: 800;">TEST DAYS</span>
                        </div>
                        <h4 style="font-size: 1.05rem; font-weight: 950; margin: 0 0 4px; color: #ffffff;">STK SHOT TO KILL ⚡</h4>
                        <p style="font-size: 0.72rem; color: #94a3b8; margin: 0 0 10px; line-height: 1.4;">
                            Prueba gratis este sábado en los entrenamientos de El Prat las nuevas palas de carbono y máxima potencia.
                        </p>
                        <button style="width: 100%; background: #ccff00; color: #000; border: none; border-radius: 8px; padding: 7px; font-weight: 900; font-size: 0.75rem; cursor: pointer;">
                            Reservar Pala de Test 🎾
                        </button>
                    </div>

                    <!-- WIDGETS HABITUALES DE LA APP -->
                    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">PRÓXIMO PARTIDO</div>
                        <div style="font-size: 0.85rem; font-weight: 800;">Americana Oro • Sábado 10:30h</div>
                        <div style="font-size: 0.7rem; color: #38bdf8;">Barcelona Pádel El Prat (Pista 4)</div>
                    </div>

                    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 12px;">
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">TU NIVEL ELO</div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 1.1rem; font-weight: 900; color: #ccff00;">1.425 pts</div>
                            <span style="font-size: 0.7rem; color: #86efac;">▲ +35 esta semana</span>
                        </div>
                    </div>
                `;
            } else if (this.activeAppMockup === 'push') {
                return `
                    <div style="padding-top: 20px;">
                        <!-- NOTIFICACIÓN PUSH SIMULADA -->
                        <div style="background: rgba(30, 41, 59, 0.95); border: 1.5px solid #38bdf8; border-radius: 16px; padding: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); margin-bottom: 24px; animation: pulse 2s infinite;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="width: 18px; height: 18px; border-radius: 4px; background: #ccff00; color: #000; font-size: 0.55rem; font-weight: 950; display: flex; align-items: center; justify-content: center;">SP</div>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8;">SOMOSPADEL • AHORA</span>
                                </div>
                                <i class="fas fa-chevron-right" style="font-size: 0.65rem; color: #64748b;"></i>
                            </div>
                            <h4 style="font-size: 0.85rem; font-weight: 900; margin: 0 0 4px; color: #ffffff;">⚡ ¡Prueba las nuevas palas STK!</h4>
                            <p style="font-size: 0.72rem; color: #cbd5e1; margin: 0; line-height: 1.35;">
                                Este fin de semana en El Prat podrás jugar con el nuevo modelo STK Carbon Attack. Plazas de test limitadas para jugadores federados.
                            </p>
                        </div>

                        <div style="text-align: center; color: #94a3b8; font-size: 0.78rem; padding: 20px;">
                            <i class="fas fa-bell" style="font-size: 2rem; color: #38bdf8; margin-bottom: 12px; display: block;"></i>
                            <strong>Tasa de apertura superior al 70%:</strong> Los jugadores tienen notificaciones activas para no perder su plaza de partido.
                        </div>
                    </div>
                `;
            } else {
                return `
                    <!-- FICHA DE TIENDA SIMULADA -->
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; margin-bottom: 14px;">
                        <div style="height: 150px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; position: relative;">
                            <i class="fas fa-table-tennis-paddle-ball" style="font-size: 4rem; color: #f59e0b;"></i>
                            <span style="position: absolute; top: 10px; right: 10px; background: #ccff00; color: #000; font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 4px;">TEST EXCLUSIVO</span>
                        </div>
                        <div style="padding: 14px;">
                            <div style="font-size: 0.68rem; color: #f59e0b; font-weight: 900; text-transform: uppercase;">STK (SHOT TO KILL)</div>
                            <h4 style="font-size: 0.95rem; font-weight: 900; margin: 2px 0 6px; color: #ffffff;">Pala STK Carbon Pro Edition</h4>
                            <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 1.15rem; font-weight: 950; color: #ccff00;">185,00 €</span>
                                <span style="font-size: 0.75rem; color: #64748b; text-decoration: line-through;">230,00 €</span>
                                <span style="font-size: 0.65rem; color: #86efac; font-weight: 800;">-20% Club</span>
                            </div>
                            <p style="font-size: 0.7rem; color: #94a3b8; margin: 0 0 12px; line-height: 1.4;">
                                Pala de máxima potencia y balance medio. Balance testado por los jugadores de SomosPadel.
                            </p>
                            <button style="width: 100%; background: #22c55e; color: #000; border: none; border-radius: 8px; padding: 9px; font-weight: 900; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="fab fa-whatsapp"></i>
                                <span>Pedir por WhatsApp Club</span>
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        // =========================================================================
        // 🧮 PESTAÑA 4: CALCULADORA DE RETORNO (ROI) & NOTAS DE REUNIÓN
        // =========================================================================
        renderRoiCalcTab() {
            let savedNotes = '';
            try {
                savedNotes = localStorage.getItem(STORAGE_NOTES_KEY) || '';
            } catch (e) {}

            return `
                <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px;">
                    
                    <!-- CALCULADORA DE IMPACTOS -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 26px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(204,255,0,0.15); display: flex; align-items: center; justify-content: center; color: #ccff00; font-size: 1.2rem;">
                                <i class="fas fa-calculator"></i>
                            </div>
                            <div>
                                <h3 style="font-size: 1.2rem; font-weight: 900; color: #ffffff; margin: 0;">
                                    Simulador de Retorno e Impactos Mensuales
                                </h3>
                                <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">Calcula el valor publicitario estimado generado para la marca</p>
                            </div>
                        </div>

                        <!-- INPUTS CONFIGURABLES -->
                        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 800; margin-bottom: 6px;">
                                    <span style="color: #e2e8f0;">Jugadores Activos en el Club:</span>
                                    <span id="roi-players-val" style="color: #ccff00;">200</span>
                                </div>
                                <input type="range" id="roi-players-range" min="100" max="400" value="200" step="10"
                                    style="width: 100%; accent-color: #ccff00; cursor: pointer;"
                                    oninput="window.AdminMarketing.updateRoiCalc();" />
                            </div>

                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 800; margin-bottom: 6px;">
                                    <span style="color: #e2e8f0;">Sesiones de Pista / Entrenos al Mes:</span>
                                    <span id="roi-sessions-val" style="color: #38bdf8;">16</span>
                                </div>
                                <input type="range" id="roi-sessions-range" min="8" max="32" value="16" step="2"
                                    style="width: 100%; accent-color: #38bdf8; cursor: pointer;"
                                    oninput="window.AdminMarketing.updateRoiCalc();" />
                            </div>

                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 800; margin-bottom: 6px;">
                                    <span style="color: #e2e8f0;">Aperturas de App por Jugador al Mes:</span>
                                    <span id="roi-app-val" style="color: #fbbf24;">12</span>
                                </div>
                                <input type="range" id="roi-app-range" min="4" max="30" value="12" step="1"
                                    style="width: 100%; accent-color: #fbbf24; cursor: pointer;"
                                    oninput="window.AdminMarketing.updateRoiCalc();" />
                            </div>
                        </div>

                        <!-- RESULTADOS CALCULADOS DINÁMICAMENTE -->
                        <div style="background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px;">
                            <h4 style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; margin: 0 0 14px; font-weight: 900;">
                                Impactos Estimados en 30 Días
                            </h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                <div style="background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 12px;">
                                    <div id="calc-app-impressions" style="font-size: 1.4rem; font-weight: 950; color: #fbbf24;">2.400</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8;">Impresiones Directas App</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 12px;">
                                    <div id="calc-court-hours" style="font-size: 1.4rem; font-weight: 950; color: #38bdf8;">320 h</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8;">Horas Exposición en Pista</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 12px;">
                                    <div id="calc-tests-month" style="font-size: 1.4rem; font-weight: 950; color: #ccff00;">~48 palas</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8;">Pruebas de Test Mensuales</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 12px;">
                                    <div id="calc-media-value" style="font-size: 1.4rem; font-weight: 950; color: #86efac;">1.150 €</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8;">Media Value Equivalent (MVE)</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- BLOC DE NOTAS DE REUNIONES Y ACUERDOS -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 26px; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-clipboard-list" style="color: #fbbf24; font-size: 1.2rem;"></i>
                                <h3 style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin: 0;">
                                    Notas de Negociación STK
                                </h3>
                            </div>
                            <span id="notes-saved-indicator" style="font-size: 0.75rem; color: #86efac; display: none;">
                                <i class="fas fa-check"></i> Guardado
                            </span>
                        </div>

                        <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 12px;">
                            Apunta acuerdos tomados con Kilian, fechas de test, modelos acordados y condiciones pactadas. Se guardan automáticamente en este navegador.
                        </p>

                        <textarea id="marketing-meeting-notes" rows="12"
                            placeholder="Escribe aquí las notas de las llamadas con STK...&#10;Ej:&#10;- 11/10: Hablado con Kilian, muy buena sintonía.&#10;- Acordado enviar 3 palas de test para entrenos en El Prat.&#10;- Pendiente fijar fecha del primer Test Day."
                            style="flex: 1; width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.7); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #ffffff; font-family: monospace; font-size: 0.85rem; line-height: 1.5; resize: vertical; outline: none; margin-bottom: 12px;"
                            oninput="window.AdminMarketing.autoSaveNotes();">${savedNotes}</textarea>

                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button onclick="window.AdminMarketing.saveNotesManual();"
                                style="background: #fbbf24; color: #000; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-save"></i>
                                <span>Guardar Notas</span>
                            </button>
                        </div>
                    </div>

                </div>
            `;
        }

        updateRoiCalc() {
            const players = parseInt(document.getElementById('roi-players-range')?.value || '200', 10);
            const sessions = parseInt(document.getElementById('roi-sessions-range')?.value || '16', 10);
            const appOpens = parseInt(document.getElementById('roi-app-range')?.value || '12', 10);

            const pVal = document.getElementById('roi-players-val');
            const sVal = document.getElementById('roi-sessions-val');
            const aVal = document.getElementById('roi-app-val');

            if (pVal) pVal.textContent = players;
            if (sVal) sVal.textContent = sessions;
            if (aVal) aVal.textContent = appOpens;

            const totalImpressions = players * appOpens;
            const courtHours = Math.round(players * sessions * 0.1);
            const testsMonth = Math.round(players * 0.24);
            const mediaValue = Math.round((totalImpressions * 0.05) + (courtHours * 2.5) + (testsMonth * 5));

            const impEl = document.getElementById('calc-app-impressions');
            const hoursEl = document.getElementById('calc-court-hours');
            const testsEl = document.getElementById('calc-tests-month');
            const valEl = document.getElementById('calc-media-value');

            if (impEl) impEl.textContent = totalImpressions.toLocaleString('es-ES');
            if (hoursEl) hoursEl.textContent = courtHours + ' h';
            if (testsEl) testsEl.textContent = '~' + testsMonth + ' palas';
            if (valEl) valEl.textContent = mediaValue.toLocaleString('es-ES') + ' €';
        }

        autoSaveNotes() {
            const textarea = document.getElementById('marketing-meeting-notes');
            if (!textarea) return;
            try {
                localStorage.setItem(STORAGE_NOTES_KEY, textarea.value);
                const ind = document.getElementById('notes-saved-indicator');
                if (ind) {
                    ind.style.display = 'inline-block';
                    clearTimeout(this._notesTimer);
                    this._notesTimer = setTimeout(() => { ind.style.display = 'none'; }, 2000);
                }
            } catch (e) {}
        }

        saveNotesManual() {
            this.autoSaveNotes();
            this.showToast('✅ Notas de negociación guardadas');
        }

        // =========================================================================
        // 🛠️ UTILIDADES (CLIPBOARD, ESCAPING, TOASTS)
        // =========================================================================
        escapeForJs(str) {
            return (str || '')
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '&quot;')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '');
        }

        async copyToClipboard(text, successMsg = 'Copiado al portapapeles') {
            const rawText = text.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/&quot;/g, '"');
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(rawText);
                } else {
                    const temp = document.createElement('textarea');
                    temp.value = rawText;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    document.body.removeChild(temp);
                }
                this.showToast('✅ ' + successMsg);
            } catch (err) {
                console.error('Error al copiar:', err);
                this.showToast('⚠️ No se pudo copiar automáticamente. Selecciónalo manualmente.');
            }
        }

        showToast(msg) {
            let toast = document.getElementById('marketing-pro-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'marketing-pro-toast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: #0f172a;
                    color: #ffffff;
                    border: 1.5px solid #ccff00;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(204,255,0,0.25);
                    padding: 14px 22px;
                    border-radius: 12px;
                    font-size: 0.88rem;
                    font-weight: 800;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: opacity 0.3s, transform 0.3s;
                    font-family: 'Outfit', sans-serif;
                `;
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';

            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(15px)';
            }, 3000);
        }
    }

    return new AdminMarketingController();
}));
