/**
 * admin-blog.js
 * Módulo de Administración de Blog y Noticias dinámicas para Firestore.
 * Incluye: Gestor manual (CRUD) + AutoBlog Engine (generación automática).
 * Estilo Premium Matte Light.
 */

(function () {
    console.log("🚀 Módulo Administrador de Blog Cargando...");

    window.AdminViews = window.AdminViews || {};

    // ─── FALLBACK POSTS ───────────────────────────────────────────────────────
    const FALLBACK_POSTS = [
        {
            id: 'torneo-primavera',
            category: '🏆 TORNEOS',
            catColor: '#CCFF00',
            title: '🏆 Gran Torneo de Primavera 2026',
            emoji: '🎾',
            imgGrad: 'linear-gradient(135deg, #ffe066 0%, #facc15 100%)',
            snippet: '¡Inscripciones abiertas! 120 plazas, Welcome Pack premium y gran barbacoa final en El Prat.',
            content: 'Llega el evento más esperado del año. El próximo 15 de Junio celebraremos el Gran Torneo de Primavera en las instalaciones de El Prat.',
            date: 'Hoy',
            readTime: '2 min',
            timestamp: Date.now() - 1000
        },
        {
            id: 'scouting-rival',
            category: '📡 TECNOLOGÍA',
            catColor: '#38bdf8',
            title: '📡 Scouting de Rivales Activo',
            emoji: '📊',
            imgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            snippet: 'Estudia el histórico de tus rivales y sus puntos débiles antes de pisar la pista.',
            content: 'Nueva herramienta de scouting disponible en la sección de Equipos.',
            date: 'Ayer',
            readTime: '3 min',
            timestamp: Date.now() - 3600 * 1000 * 24
        }
    ];

    // ─── VISTA PRINCIPAL DEL GESTOR ───────────────────────────────────────────
    async function initBlogView() {
        console.log("📖 Iniciando Vista Gestor de Blog...");
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        contentArea.innerHTML = `
            <!-- HEADER -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 30px; border-radius: 20px; margin-bottom: 20px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
                <div>
                    <h1 style="margin: 0; font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; color: #fff;">GESTOR DE BLOG</h1>
                    <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.55); font-size: 0.8rem; font-weight: 500;">Noticias automáticas + publicación manual para el widget del Inicio.</p>
                </div>
                <button class="btn-primary-pro" id="btn-new-post" style="background: #ccff00; border: none; height: 42px; padding: 0 20px; border-radius: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(204,255,0,0.3); color: #000; font-size: 0.8rem;">
                    <i class="fas fa-plus"></i> NUEVO ARTÍCULO
                </button>
            </div>

            <!-- 🤖 AUTOBLOG ENGINE PANEL -->
            <div id="autoblog-panel" style="background: white; border: 1px solid #cbd5e1; border-radius: 20px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;">🤖</div>
                        <div>
                            <h3 style="margin: 0; font-size: 1rem; font-weight: 900; color: #0f172a; text-transform: uppercase;">AutoBlog Engine</h3>
                            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #64748b; font-weight: 500;">Genera noticias automáticas leyendo datos reales de la app.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="btn-autogenerate" onclick="window.triggerAutoBlog()" style="
                            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                            color: white; border: none; padding: 10px 22px; border-radius: 12px;
                            font-weight: 800; font-size: 0.8rem; cursor: pointer;
                            display: flex; align-items: center; gap: 8px;
                            box-shadow: 0 4px 15px rgba(15,23,42,0.2); transition: all 0.2s;
                            letter-spacing: 0.5px;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-robot"></i> GENERAR NOTICIAS
                        </button>
                        <button onclick="window.triggerAutoBlog(true)" style="
                            background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;
                            padding: 10px 16px; border-radius: 12px; font-weight: 700;
                            font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
                        " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                            <i class="fas fa-sync-alt"></i> FORZAR REGENERAR
                        </button>
                    </div>
                </div>

                <!-- Tipos de noticias que genera -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 20px;">
                    ${[
                        { icon: '🏆', label: 'Americanas abiertas', color: '#CCFF00' },
                        { icon: '🔴', label: 'Eventos en directo', color: '#ef4444' },
                        { icon: '🎾', label: 'Próximos entrenos', color: '#22c55e' },
                        { icon: '📊', label: 'Ranking actualizado', color: '#38bdf8' },
                        { icon: '👥', label: 'Equipos destacados', color: '#a78bfa' },
                        { icon: '💡', label: 'Consejos tácticos', color: '#f59e0b' }
                    ].map(t => `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.1rem;">${t.icon}</span>
                            <span style="font-size: 0.7rem; font-weight: 700; color: #475569;">${t.label}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Configuración de IA (Gemini) -->
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.15rem;">🧠</span>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.72rem; font-weight: 800; color: #334155; text-transform: uppercase;">Inteligencia Artificial Gemini</span>
                            <span style="font-size: 0.65rem; color: #64748b;">Escribe artículos 100% únicos y creativos con tu API Key.</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex: 1; min-width: 250px; justify-content: flex-end;">
                        <input type="password" id="admin-gemini-key" placeholder="API Key de Gemini (Opcional)..." style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.75rem; width: 60%; max-width: 250px; box-sizing: border-box;" onchange="window.saveGeminiKey(this.value)">
                        <button onclick="const input = document.getElementById('admin-gemini-key'); input.type = input.type === 'password' ? 'text' : 'password'; this.innerHTML = input.type === 'password' ? '<i class=\'fas fa-eye\'></i>' : '<i class=\'fas fa-eye-slash\'></i>';" style="background: white; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 10px; cursor: pointer; color: #475569;"><i class="fas fa-eye"></i></button>
                    </div>
                </div>

                <!-- Log de actividad -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <div style="width: 8px; height: 8px; background: #94a3b8; border-radius: 50%;"></div>
                        <span style="font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">LOG DE ACTIVIDAD</span>
                    </div>
                    <div id="autoblog-log" style="display: flex; flex-direction: column; gap: 2px; min-height: 40px;">
                        <div style="color: #94a3b8; font-size: 0.75rem; padding: 4px 0;">Pulsa "GENERAR NOTICIAS" para iniciar el motor automático...</div>
                    </div>
                </div>
            </div>

            <!-- TABLA DE ARTÍCULOS PUBLICADOS -->
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 20px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-weight: 800; font-size: 1rem; text-transform: uppercase; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-newspaper" style="color: #0284c7;"></i> ARTÍCULOS PUBLICADOS
                    </h3>
                    <span id="posts-count" style="background: #e2e8f0; color: #0f172a; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800;">Cargando...</span>
                </div>
                
                <div id="blog-table-container">
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px; color: #3b82f6; display: block;"></i>
                        <p style="margin: 0; font-weight: 600;">Conectando con Firestore...</p>
                    </div>
                </div>
            </div>

            <!-- MODAL FORMULARIO CREAR/EDITAR -->
            <div id="blog-form-modal" class="modal-pro" style="display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; padding: 20px;">
                <div class="modal-content" style="background: white; border-radius: 24px; padding: 30px; width: 100%; max-width: 600px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.18); max-height: 90vh; overflow-y: auto; border: 1px solid #e2e8f0; position: relative;">
                    <button onclick="document.getElementById('blog-form-modal').style.display='none'" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569;">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <h2 id="modal-form-title" style="margin: 0 0 25px 0; font-size: 1.3rem; font-weight: 900; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; text-transform: uppercase;">NUEVO ARTÍCULO</h2>
                    
                    <form id="blog-post-form" onsubmit="event.preventDefault();">
                        <input type="hidden" id="post-id">
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;"><i class="fas fa-tag"></i> Categoría</label>
                                <select id="post-category" required style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.85rem; color: #0f172a; background: #f8fafc;">
                                    <option value="🏆 AMERICANAS">🏆 AMERICANAS</option>
                                    <option value="🏆 TORNEOS">🏆 TORNEOS</option>
                                    <option value="📡 TECNOLOGÍA">📡 TECNOLOGÍA</option>
                                    <option value="💡 CONSEJOS">💡 CONSEJOS</option>
                                    <option value="📢 NOVEDADES">📢 NOVEDADES</option>
                                    <option value="🎾 ENTRENAMIENTO">🎾 ENTRENAMIENTO</option>
                                    <option value="📊 RANKING">📊 RANKING</option>
                                    <option value="👥 EQUIPOS">👥 EQUIPOS</option>
                                    <option value="🔴 EN DIRECTO">🔴 EN DIRECTO</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;"><i class="fas fa-clock"></i> Tiempo de Lectura</label>
                                <input type="text" id="post-readtime" placeholder="Ej: 3 min" required style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.85rem; color: #0f172a; background: #f8fafc; box-sizing: border-box;">
                            </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;"><i class="fas fa-heading"></i> Título del Artículo</label>
                            <input type="text" id="post-title" placeholder="Introduce un título llamativo..." required style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.85rem; color: #0f172a; background: #f8fafc; box-sizing: border-box;">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Emoji Principal</label>
                                <input type="text" id="post-emoji" placeholder="🎾, 🔥, 🏆..." required style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 1.1rem; text-align: center; background: #f8fafc; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;"><i class="fas fa-palette"></i> Color Visual</label>
                                <select id="post-imggrad" required style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.82rem; color: #0f172a; background: #f8fafc;">
                                    <option value="linear-gradient(135deg, #ffe066 0%, #facc15 100%)">☀️ Amarillo Oro</option>
                                    <option value="linear-gradient(135deg, #CCFF00 0%, #84cc16 100%)">🟢 Verde Neón</option>
                                    <option value="linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)">💧 Azul Eléctrico</option>
                                    <option value="linear-gradient(135deg, #fb923c 0%, #f97316 100%)">🔥 Naranja Fuego</option>
                                    <option value="linear-gradient(135deg, #4ade80 0%, #22c55e 100%)">🎾 Verde Pista</option>
                                    <option value="linear-gradient(135deg, #f472b6 0%, #ec4899 100%)">💖 Rosa Flúor</option>
                                    <option value="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">🔴 Rojo Vivo</option>
                                    <option value="linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)">💜 Púrpura</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;"><i class="fas fa-quote-left"></i> Resumen</label>
                            <input type="text" id="post-snippet" placeholder="Breve frase introductoria de 1-2 líneas..." required style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.85rem; color: #0f172a; background: #f8fafc; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;"><i class="fas fa-file-alt"></i> Contenido Completo</label>
                            <textarea id="post-content" rows="6" placeholder="Escribe el artículo detallado aquí..." required style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.84rem; color: #0f172a; background: #f8fafc; resize: vertical; min-height: 130px; box-sizing: border-box; font-family: 'Inter', sans-serif; line-height: 1.5;"></textarea>
                        </div>

                        <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 2px solid #f1f5f9; padding-top: 20px;">
                            <button type="button" onclick="document.getElementById('blog-form-modal').style.display='none'" style="background: #e2e8f0; color: #475569; padding: 10px 20px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; font-size: 0.8rem;">
                                CANCELAR
                            </button>
                            <button type="submit" id="btn-save-post" class="btn-primary-pro" style="background: #ccff00; color: #000; padding: 10px 25px; border-radius: 10px; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(204,255,0,0.2); font-size: 0.8rem;">
                                PUBLICAR AHORA
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('btn-new-post').onclick = () => openPostForm();
        document.getElementById('blog-post-form').onsubmit = (e) => {
            e.preventDefault();
            savePost();
        };

        // Exponer función para que el AutoBlog pueda refrescar la tabla
        window.refreshBlogTable = refreshBlogPosts;

        // Exponer función de trigger
        window.triggerAutoBlog = async (forceRefresh = false) => {
            const btn = document.getElementById('btn-autogenerate');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERANDO...';
                btn.disabled = true;
                btn.style.opacity = '0.7';
            }

            try {
                if (!window.AutoBlogEngine) {
                    throw new Error('AutoBlog Engine no cargado. Recarga la página.');
                }
                const result = await window.AutoBlogEngine.generate({ forceRefresh });
                
                // Refresh table
                await refreshBlogPosts();

                if (btn) {
                    btn.innerHTML = `<i class="fas fa-check-circle"></i> ${result.published} NUEVAS`;
                    btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-robot"></i> GENERAR NOTICIAS';
                        btn.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }, 4000);
                }
            } catch (e) {
                console.error('AutoBlog error:', e);
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> ERROR';
                    btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-robot"></i> GENERAR NOTICIAS';
                        btn.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }, 3000);
                }
                if (window.AutoBlogEngine) window.AutoBlogEngine._addLog(`❌ ${e.message}`, 'error');
            }
        };

        // Inicializar API Key de Gemini desde localStorage y Firestore
        setTimeout(async () => {
            let savedKey = localStorage.getItem('somospadel_gemini_api_key') || '';
            const keyInput = document.getElementById('admin-gemini-key');
            if (keyInput && savedKey) {
                keyInput.value = savedKey;
            }

            try {
                const db = window.db || firebase.firestore();
                const configDoc = await db.collection('config').doc('ai_config').get();
                if (configDoc.exists) {
                    const dbKey = configDoc.data().gemini_api_key || '';
                    if (dbKey && dbKey !== savedKey) {
                        savedKey = dbKey;
                        localStorage.setItem('somospadel_gemini_api_key', savedKey);
                        if (keyInput) keyInput.value = savedKey;
                        console.log('🔄 API Key sincronizada desde Firestore.');
                    }
                }
            } catch (err) {
                console.warn('⚠️ No se pudo sincronizar API Key desde Firestore:', err);
            }

            if (savedKey) {
                if (window.OpenMatchesController) window.OpenMatchesController.geminiApiKey = savedKey;
                if (window.SomosPadelNewsEngine) window.SomosPadelNewsEngine.geminiApiKey = savedKey;
                if (window.AutoBlogEngine) window.AutoBlogEngine.geminiApiKey = savedKey;
            }
        }, 100);

        // Cargar tabla de posts
        await refreshBlogPosts();
    }

    // ─── REFRESCAR TABLA DE POSTS ─────────────────────────────────────────────
    async function refreshBlogPosts() {
        const tableContainer = document.getElementById('blog-table-container');
        const countBadge = document.getElementById('posts-count');
        if (!tableContainer) return;

        try {
            const db = window.db || firebase.firestore();
            let snapshot = await db.collection('blog_posts').orderBy('timestamp', 'desc').get();

            if (snapshot.empty) {
                console.log("🌱 Firestore vacío. Alimentando blog con posts semilla...");
                for (const post of FALLBACK_POSTS) {
                    await db.collection('blog_posts').doc(post.id).set(post);
                }
                snapshot = await db.collection('blog_posts').orderBy('timestamp', 'desc').get();
            }

            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (countBadge) {
                countBadge.textContent = `${posts.length} artículos`;
                countBadge.style.background = posts.length > 0 ? '#dcfce7' : '#e2e8f0';
                countBadge.style.color = posts.length > 0 ? '#16a34a' : '#0f172a';
            }

            if (posts.length === 0) {
                tableContainer.innerHTML = `
                    <div style="text-align:center; padding:40px; color:#94a3b8;">
                        <i class="fas fa-newspaper" style="font-size:2.5rem; margin-bottom:12px; display:block;"></i>
                        <p style="margin:0; font-weight:600;">No hay artículos publicados todavía.</p>
                        <p style="margin:4px 0 0; font-size:0.8rem;">Pulsa "GENERAR NOTICIAS" para que el motor automático los cree.</p>
                    </div>
                `;
                return;
            }

            tableContainer.innerHTML = `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif;">
                        <thead>
                            <tr style="border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px 15px; font-size: 0.65rem; font-weight: 800; color: #475569; text-transform: uppercase; text-align: left;">Artículo</th>
                                <th style="padding: 10px 15px; font-size: 0.65rem; font-weight: 800; color: #475569; text-transform: uppercase; text-align: left;">Categoría</th>
                                <th style="padding: 10px 15px; font-size: 0.65rem; font-weight: 800; color: #475569; text-transform: uppercase; text-align: left;">Lectura</th>
                                <th style="padding: 10px 15px; font-size: 0.65rem; font-weight: 800; color: #475569; text-transform: uppercase; text-align: left;">Fecha</th>
                                <th style="padding: 10px 15px; font-size: 0.65rem; font-weight: 800; color: #475569; text-transform: uppercase; text-align: right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${posts.map(post => {
                                const isAuto = post.id && (
                                    post.id.startsWith('americana-') ||
                                    post.id.startsWith('entreno-') ||
                                    post.id.startsWith('ranking-') ||
                                    post.id.startsWith('team-') ||
                                    post.id.startsWith('tactical-') ||
                                    post.id.startsWith('stats-')
                                );
                                return `
                                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;"
                                    onmouseover="this.style.background='#f8fafc'"
                                    onmouseout="this.style.background='transparent'">
                                    <td style="padding: 14px 15px; display: flex; align-items: center; gap: 12px; min-width: 260px;">
                                        <div style="width: 42px; height: 42px; border-radius: 10px; background: ${post.imgGrad || 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.3rem;">
                                            ${post.emoji || '📰'}
                                        </div>
                                        <div style="min-width: 0;">
                                            <div style="font-weight: 700; font-size: 0.85rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px;">${post.title}</div>
                                            <div style="font-size: 0.7rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px; margin-top: 2px;">${post.snippet || ''}</div>
                                        </div>
                                    </td>
                                    <td style="padding: 14px 15px;">
                                        <span style="font-size: 0.6rem; font-weight: 800; color: ${post.catColor || '#64748b'}; border: 1px solid ${(post.catColor || '#64748b')}40; padding: 3px 8px; border-radius: 6px; background: ${(post.catColor || '#64748b')}10; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap;">
                                            ${post.category || 'NOVEDAD'}
                                        </span>
                                        ${isAuto ? '<span style="margin-left: 4px; font-size: 0.55rem; background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">AUTO</span>' : ''}
                                    </td>
                                    <td style="padding: 14px 15px; font-size: 0.8rem; font-weight: 600; color: #475569;">${post.readTime || '1 min'}</td>
                                    <td style="padding: 14px 15px; font-size: 0.78rem; color: #64748b;">${post.date || 'Reciente'}</td>
                                    <td style="padding: 14px 15px; text-align: right; white-space: nowrap;">
                                        <button class="btn-micro" onclick="window.editBlogPost('${post.id}')" style="background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; padding: 6px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer; margin-right: 4px;">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-micro" onclick="window.deleteBlogPost('${post.id}')" style="background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            console.error("Fallo al refrescar blog:", e);
            if (tableContainer) tableContainer.innerHTML = `
                <div style="padding: 25px; border-radius: 12px; background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b;">
                    <h4 style="margin: 0 0 5px 0; font-weight: 800;">⚠️ ERROR EN LA CONSULTA</h4>
                    <p style="margin: 0; font-size: 0.85rem;">${e.message}</p>
                    <p style="margin: 8px 0 0; font-size: 0.75rem; color: #b91c1c;">Puede ser necesario crear un índice compuesto en Firestore para la colección <strong>blog_posts</strong> ordenada por <strong>timestamp desc</strong>.</p>
                </div>
            `;
        }
    }

    // ─── EDITAR POST ──────────────────────────────────────────────────────────
    window.editBlogPost = async function (postId) {
        try {
            const db = window.db || firebase.firestore();
            const doc = await db.collection('blog_posts').doc(postId).get();
            if (!doc.exists) { alert("El artículo no existe."); return; }
            openPostForm(postId, doc.data());
        } catch (e) {
            console.error("Fallo al obtener post:", e);
            alert("Error al cargar datos del post.");
        }
    };

    // ─── ELIMINAR POST ────────────────────────────────────────────────────────
    window.deleteBlogPost = async function (postId) {
        if (!confirm("¿Estás seguro de que quieres eliminar este artículo definitivamente?")) return;
        try {
            const db = window.db || firebase.firestore();
            await db.collection('blog_posts').doc(postId).delete();
            await refreshBlogPosts();
            if (window.AutoBlogEngine) window.AutoBlogEngine._addLog(`🗑️ Artículo eliminado: ${postId}`, 'info');
        } catch (e) {
            console.error("Fallo al eliminar:", e);
            alert("Error al eliminar el artículo.");
        }
    };

    // ─── ABRIR FORMULARIO ─────────────────────────────────────────────────────
    function openPostForm(id = '', data = null) {
        const modal = document.getElementById('blog-form-modal');
        const titleEl = document.getElementById('modal-form-title');
        const saveBtn = document.getElementById('btn-save-post');
        if (!modal) return;

        document.getElementById('post-id').value = id;
        document.getElementById('post-category').value = data ? (data.category || '🏆 AMERICANAS') : '🏆 AMERICANAS';
        document.getElementById('post-readtime').value = data ? (data.readTime || '3 min') : '3 min';
        document.getElementById('post-title').value = data ? (data.title || '') : '';
        document.getElementById('post-emoji').value = data ? (data.emoji || '🎾') : '🎾';
        document.getElementById('post-imggrad').value = data ? (data.imgGrad || 'linear-gradient(135deg, #ffe066 0%, #facc15 100%)') : 'linear-gradient(135deg, #ffe066 0%, #facc15 100%)';
        document.getElementById('post-snippet').value = data ? (data.snippet || '') : '';
        document.getElementById('post-content').value = data ? (data.content || '') : '';

        if (id) {
            titleEl.textContent = "EDITAR ARTÍCULO";
            saveBtn.textContent = "GUARDAR CAMBIOS";
        } else {
            titleEl.textContent = "NUEVO ARTÍCULO";
            saveBtn.textContent = "PUBLICAR AHORA";
        }

        modal.style.display = 'flex';
    }

    // ─── GUARDAR POST ─────────────────────────────────────────────────────────
    async function savePost() {
        const id = document.getElementById('post-id').value;
        const category = document.getElementById('post-category').value;
        const readTime = document.getElementById('post-readtime').value;
        const title = document.getElementById('post-title').value;
        const emoji = document.getElementById('post-emoji').value;
        const imgGrad = document.getElementById('post-imggrad').value;
        const snippet = document.getElementById('post-snippet').value;
        const content = document.getElementById('post-content').value;

        const categoryColors = {
            '🏆 AMERICANAS': '#CCFF00',
            '🏆 TORNEOS': '#CCFF00',
            '📡 TECNOLOGÍA': '#38bdf8',
            '💡 CONSEJOS': '#f59e0b',
            '📢 NOVEDADES': '#ec4899',
            '🎾 ENTRENAMIENTO': '#22c55e',
            '📊 RANKING': '#38bdf8',
            '👥 EQUIPOS': '#a78bfa',
            '🔴 EN DIRECTO': '#ef4444'
        };
        const catColor = categoryColors[category] || '#64748b';

        const targetId = id || title.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
            .slice(0, 60);

        const postData = {
            id: targetId,
            category, catColor, readTime, title, emoji, imgGrad, snippet, content,
            date: id ? 'Editado hoy' : 'Hoy',
            timestamp: Date.now()
        };

        try {
            const db = window.db || firebase.firestore();
            await db.collection('blog_posts').doc(targetId).set(postData, { merge: true });
            document.getElementById('blog-form-modal').style.display = 'none';
            await refreshBlogPosts();
            if (window.AutoBlogEngine) window.AutoBlogEngine._addLog(`✅ Post manual guardado: "${title.slice(0,30)}..."`, 'success');
        } catch (e) {
            console.error("Fallo al guardar post:", e);
            alert("Error al guardar el artículo: " + e.message);
        }
    }

    // ─── GUARDAR GEMINI API KEY EN FIRESTORE Y LOCALSTORAGE ───────────────────
    window.saveGeminiKey = async function (key) {
        localStorage.setItem('somospadel_gemini_api_key', key);
        if (window.OpenMatchesController) window.OpenMatchesController.geminiApiKey = key;
        if (window.SomosPadelNewsEngine) window.SomosPadelNewsEngine.geminiApiKey = key;
        if (window.AutoBlogEngine) window.AutoBlogEngine.geminiApiKey = key;

        try {
            const db = window.db || firebase.firestore();
            await db.collection('config').doc('ai_config').set({ gemini_api_key: key }, { merge: true });
            console.log('💾 API Key de Gemini guardada en Firestore.');
            if (window.AutoBlogEngine) window.AutoBlogEngine._addLog('💾 API Key de Gemini guardada en Firestore y local.', 'success');
        } catch (e) {
            console.error('❌ Error al guardar API Key en Firestore:', e);
            if (window.AutoBlogEngine) window.AutoBlogEngine._addLog(`⚠️ API Key guardada localmente, pero falló en Firestore: ${e.message}`, 'error');
        }
    };

    // ─── REGISTRAR EN ROUTER ──────────────────────────────────────────────────
    window.AdminViews.blog_posts = initBlogView;

})();
