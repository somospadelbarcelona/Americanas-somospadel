
window.AdminViews = window.AdminViews || {};

window.AdminViews.menu_mgmt = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Gestor de Menú (3 Pestañas)';
    content.innerHTML = '<div class="loader"></div>';

    let menuItems = [];
    try {
        menuItems = await FirebaseDB.menu.getAll();
    } catch (e) {
        console.error("Error loading menu items:", e);
        menuItems = [];
    }

    // AUTO-INIT: Create default menu items with subcategories
    if (menuItems.length === 0) {
        try {
            await FirebaseDB.menu.create({ title: 'Inicio', icon: 'fas fa-home', action: 'dashboard', subcategory: '', order: 1, active: true });
            await FirebaseDB.menu.create({ title: 'Mi Perfil', icon: 'fas fa-user', action: 'profile', subcategory: '', order: 2, active: true });
            await FirebaseDB.menu.create({ title: 'Inscripciones', icon: 'fas fa-calendar-plus', action: 'inscripciones', subcategory: 'DISPONIBLES', order: 3, active: true });
            await FirebaseDB.menu.create({ title: 'Ver resultados', icon: 'fas fa-chart-bar', action: 'resultados', subcategory: 'FINALIZADAS', order: 4, active: true });
            await FirebaseDB.menu.create({ title: 'Guia de la app', icon: 'fas fa-info-circle', action: 'guia', subcategory: 'INFO', order: 5, active: true });
            await FirebaseDB.menu.create({ title: 'Ranking', icon: 'fas fa-trophy', action: 'ranking', subcategory: '', order: 6, active: true });
            menuItems = await FirebaseDB.menu.getAll(); // Reload
        } catch (e) {
            console.error("Auto-init menu failed", e);
        }
    }

    const sortedItems = menuItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start;">
            
            <!-- LEFT: EDITOR -->
            <div>
                <div class="glass-card-enterprise" style="background: linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(204,255,0,0.02) 100%);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="margin:0; color: var(--brand-neon);">PERSONALIZAR PESTAÑAS</h3>
                            <p style="color:var(--text-muted); font-size:0.8rem; margin:5px 0 0 0;">Configura los botones del MENÚ HAMBURGUESA (3 Rayas).</p>
                        </div>
                        <button class="btn-primary-pro" style="background: var(--brand-neon); color: black;" onclick="window.openMenuModalHandler()">+ AÑADIR PESTAÑA</button>
                    </div>

                    <div style="background:rgba(204,255,0,0.05); border-radius:12px; overflow:hidden; border: 1px solid rgba(204,255,0,0.1);">
                        ${sortedItems.map(item => `
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:15px; border-bottom:1px solid rgba(204,255,0,0.08); transition: background 0.2s; background: ${item.active ? 'rgba(204,255,0,0.03)' : 'transparent'};">
                                <div style="display:flex; align-items:center; gap:15px;">
                                    <div style="width:40px; height:40px; background:rgba(204,255,0,0.1); border-radius:10px; display:flex; align-items:center; justify-content:center; color:${item.active ? 'var(--brand-neon)' : '#666'}; border: 1px solid ${item.active ? 'var(--brand-neon)' : 'rgba(255,255,255,0.1)'};">
                                        <i class="${item.icon || 'fas fa-question'}" style="font-size:1.2rem;"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight:700; color:white; font-size:1rem;">${item.title || 'Sin título'}</div>
                                        <div style="font-size:0.75rem; color:#888; font-family:monospace;">
                                            Route: /${item.action || 'none'} | Orden: ${item.order || 0}
                                            ${item.subcategory ? ` | <span style="color: var(--brand-neon);">Subpestaña: ${item.subcategory}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="padding:4px 8px; border-radius:4px; font-size:0.65rem; font-weight:800; letter-spacing:0.5px; background:${item.active ? 'rgba(204,255,0,0.2)' : 'rgba(255,255,255,0.05)'}; color:${item.active ? 'var(--brand-neon)' : '#888'}; border: 1px solid ${item.active ? 'var(--brand-neon)' : 'transparent'};">
                                        ${item.active ? 'VISIBLE' : 'OCULTO'}
                                    </span>
                                    <button class="btn-micro" style="background:rgba(204,255,0,0.1); color: var(--brand-neon);" onclick='window.openMenuModalHandler(${JSON.stringify(item).replace(/'/g, "&#39;")})'>✏️</button>
                                    <button class="btn-micro" style="background:rgba(239,68,68,0.2); color:#ef4444;" onclick="window.deleteMenuItemHandler('${item.id}')">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- RIGHT: PREVIEW -->
            <div style="position: sticky; top: 20px;">
                <div style="text-align: center; margin-bottom: 10px; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px; color: var(--text-muted);">VISTA PREVIA (HAMBURGUESA)</div>
                <div class="iphone-mockup" style="width: 320px; height: 650px; background: #000; border-radius: 40px; border: 8px solid #333; position: relative; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); margin: 0 auto;">
                    <!-- Top Bar -->
                    <div style="height: 30px; background: rgba(0,0,0,0.8); display:flex; justify-content:space-between; align-items:center; padding: 0 20px; font-size: 10px; color: white;">
                        <span>9:41</span>
                        <div><i class="fas fa-signal"></i> <i class="fas fa-wifi"></i> <i class="fas fa-battery-full"></i></div>
                    </div>
                    
                    <!-- App Content Mock -->
                    <div style="height: calc(100% - 30px); background: #111; position:relative; display:flex; flex-direction:column;">
                        <!-- Header -->
                        <div style="padding: 20px; background: linear-gradient(to bottom, rgba(30,30,30,1), rgba(17,17,17,0)); opacity:0.3;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <img src="img/logo_somospadel.png" style="height: 30px;">
                                <div style="width:30px; height:30px; background:#333; border-radius:50%;"></div>
                            </div>
                            <div style="height: 100px; background: rgba(255,255,255,0.05); margin-top:20px; border-radius:12px;"></div>
                        </div>
                        
                        <!-- SIDE DRAWER PREVIEW -->
                        <div style="position:absolute; top:0; left:0; width:75%; height:100%; background: linear-gradient(180deg, #1e1e1e 0%, #000000 100%); border-right: 1px solid rgba(255,255,255,0.1); box-shadow: 10px 0 30px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
                            <div style="padding: 60px 20px 20px 20px; background: linear-gradient(to bottom, rgba(204, 255, 0, 0.1), transparent); border-bottom: 1px solid rgba(204,255,0,0.2);">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div style="font-weight:800; color:white; font-size:1.2rem; font-family:'Outfit';">MENÚ</div>
                                    <i class="fas fa-times" style="color:white; font-size:1.2rem; opacity:0.7;"></i>
                                </div>
                            </div>
                            <div style="flex:1; padding-top:10px; overflow-y: auto;">
                                ${sortedItems.filter(i => i.active).map(item => `
                                    <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; flex-direction: column; gap: 5px;">
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <i class="${item.icon || 'fas fa-question'}" style="color: var(--brand-neon); font-size: 1.2rem; width: 24px; text-align: center; text-shadow: 0 0 10px rgba(204, 255, 0, 0.5);"></i>
                                            <span style="color: white; font-weight: 700; font-size: 1rem; letter-spacing:0.5px; font-family:'Outfit';">${item.title || 'Sin título'}</span>
                                        </div>
                                        ${item.subcategory ? `<div style="margin-left: 39px; font-size: 0.75rem; color: var(--brand-neon); font-weight: 600; opacity: 0.8;">${item.subcategory}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                            <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <div style="color: #ff4d4d; font-weight:700; font-size:0.9rem; display:flex; gap:10px; align-items:center;">
                                    <i class="fas fa-power-off"></i> Cerrar Sesión
                                </div>
                                <div style="font-size: 0.65rem; color: #444; margin-top:10px;">v1.0.5 PRO</div>
                            </div>
                        </div>
                    </div>

                    <!-- Notch -->
                    <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 120px; height: 30px; background: #333; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;"></div>
                </div>
            </div>
        </div>
    `;

    // Store menuItems in window for access by handlers
    window._currentMenuItems = menuItems;

    // Handler functions
    window.openMenuModalHandler = function (item) {
        const modal = document.getElementById('admin-menu-modal');
        const form = document.getElementById('admin-menu-form');

        if (!modal) {
            alert("Error: Modal no encontrado. Recarga la página.");
            return;
        }

        if (!form) {
            alert("Error: Formulario no encontrado. Recarga la página.");
            return;
        }

        form.reset();

        if (item) {
            try {
                if (form.querySelector('[name=id]')) form.querySelector('[name=id]').value = item.id || '';
                if (form.querySelector('[name=title]')) form.querySelector('[name=title]').value = item.title || '';
                if (form.querySelector('[name=icon]')) form.querySelector('[name=icon]').value = item.icon || '';
                if (form.querySelector('[name=action]')) form.querySelector('[name=action]').value = item.action || '';
                if (form.querySelector('[name=order]')) form.querySelector('[name=order]').value = item.order || 1;
                if (form.querySelector('[name=active]')) form.querySelector('[name=active]').value = String(item.active);

                const subcategoryField = form.querySelector('[name=subcategory]');
                if (subcategoryField) {
                    subcategoryField.value = item.subcategory || '';
                }

                if (window.selectMenuIcon && item.icon) {
                    window.selectMenuIcon(item.icon);
                }
            } catch (err) {
                console.error("Error filling form:", err);
            }
        } else {
            // New item - set default order
            let maxOrder = 0;
            if (window._currentMenuItems && window._currentMenuItems.length > 0) {
                for (let i = 0; i < window._currentMenuItems.length; i++) {
                    if (window._currentMenuItems[i].order > maxOrder) {
                        maxOrder = window._currentMenuItems[i].order;
                    }
                }
            }
            if (form.querySelector('[name=order]')) {
                form.querySelector('[name=order]').value = maxOrder + 1;
            }
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    };

    window.deleteMenuItemHandler = async function (id) {
        if (!confirm('¿Borrar este botón del menú?')) return;
        try {
            await FirebaseDB.menu.delete(id);
            loadAdminView('menu_mgmt');
        } catch (err) {
            alert('Error al borrar: ' + err.message);
        }
    };

    // Form Handler - Ensure clean event binding
    const form = document.getElementById('admin-menu-form');
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            const id = data.id;
            delete data.id;

            // Convert types
            data.order = parseInt(data.order) || 1;
            data.active = data.active === 'true';

            try {
                if (id) {
                    await FirebaseDB.menu.update(id, data);
                } else {
                    await FirebaseDB.menu.create(data);
                }
                const modal = document.getElementById('admin-menu-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
                loadAdminView('menu_mgmt');
            } catch (err) {
                alert('Error al guardar: ' + err.message);
                console.error(err);
            }
        });
    }
};

window.AdminViews.config = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Ajustes del Sistema';
    
    let currentGroupLink = '';
    try {
        const doc = await window.db.collection('system_config').doc('whatsapp').get();
        if (doc.exists && doc.data().group_link) {
            currentGroupLink = doc.data().group_link;
        }
    } catch (e) {
        console.error("Error cargando enlace de WhatsApp en admin:", e);
    }

    content.innerHTML = `
        <div class="glass-card-enterprise" style="border-left: 4px solid var(--primary);">
            <h3>⚙️ HERRAMIENTAS DE MANTENIMIENTO</h3>
            <p style="color:var(--text-muted); margin-bottom: 2rem;">Acciones masivas y configuración avanzada del motor.</p>

            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 1.5rem;">
                <h4 style="color: var(--danger); margin-top: 0;">⚠️ ZONA DE PELIGRO</h4>
                
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px;">
                    <div>
                        <div style="font-weight: 700;">Restablecimiento Masivo de Contraseñas</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">
                            Cambia la contraseña de TODOS los usuarios (menos el tuyo) a <strong>PADEL26</strong>.
                        </div>
                    </div>
                    <button class="btn-primary-pro" style="background: var(--danger); border: none;" onclick="resetAllPasswords()">
                        EJECUTAR RESET
                    </button>
                </div>
            </div>
        </div>

        <!-- 💬 CONFIGURACIÓN DE WHATSAPP -->
        <div class="glass-card-enterprise" style="border-left: 4px solid #25D366; margin-top: 2rem;">
            <h3>💬 AJUSTES DE WHATSAPP</h3>
            <p style="color:var(--text-muted); margin-bottom: 1.5rem;">Configura el enlace de invitación oficial del grupo de WhatsApp para las Partidas Abiertas y notificaciones.</p>
            
            <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
                <label style="font-size: 0.8rem; font-weight: 800; color: #fff;">Enlace del Grupo de WhatsApp</label>
                <div style="display: flex; gap: 10px; width: 100%;">
                    <input type="url" id="wa-group-url-input" class="playtomic-input" 
                        style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px; border-radius: 12px; font-size: 0.85rem;" 
                        placeholder="https://chat.whatsapp.com/..." value="${currentGroupLink}">
                    <button class="btn-primary-pro" style="background: #25D366; color: #000; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 900; cursor: pointer; text-transform: uppercase;" onclick="saveWhatsAppGroupLink()">
                        Guardar
                    </button>
                </div>
                <span style="font-size: 0.7rem; color: var(--text-muted);">Dejar vacío para usar el enlace de soporte por defecto.</span>
            </div>
        </div>

        <!-- 🎾 SINCRONIZADOR DE EQUIPOS MIXTOS -->
        <div class="glass-card-enterprise" style="border-left: 4px solid #72a800; margin-top: 2rem;">
            <h3>🎾 SINCRONIZACIÓN DE EQUIPOS MIXTOS</h3>
            <p style="color:var(--text-muted); margin-bottom: 1.5rem;">Sincroniza de forma definitiva los dos equipos mixtos estáticos de Somos Pádel BCN para que conserven sus estadísticas en tiempo real en la nube.</p>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
                <div>
                    <div style="font-weight: 700; color: #0f172a;">Equipos mixtos: 4XA y 4XB</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        Guarda los rosters, jornadas y clasificaciones en la colección <code>club_teams</code> de Firestore.
                    </div>
                </div>
                <button class="btn-primary-pro" style="background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); color: black !important; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 900; cursor: pointer; text-transform: uppercase;" onclick="window.open('admin_tools/sync_mixta_teams.html', '_blank')">
                    <i class="fas fa-sync-alt" style="margin-right: 6px;"></i> Abrir Sincronizador
                </button>
            </div>
        </div>

        <div class="glass-card-enterprise" style="margin-top: 2rem;">
            <h3>📊 DIAGNÓSTICO DE ROLES</h3>
            <button class="btn-outline-pro" onclick="checkRoleDistribution()">VER DISTRIBUCIÓN DE ROLES</button>
        </div>
    `;

    window.saveWhatsAppGroupLink = async () => {
        const input = document.getElementById('wa-group-url-input');
        if (!input) return;
        const newLink = input.value.trim();

        try {
            await window.db.collection('system_config').doc('whatsapp').set({
                group_link: newLink,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            alert("✅ Enlace del grupo de WhatsApp actualizado correctamente.");
        } catch (err) {
            alert("❌ Error al guardar el enlace: " + err.message);
        }
    };

    window.resetAllPasswords = async () => {
        if (!confirm("⚠️ PELIGRO CRÍTICO\\n\\n¿Estás SEGURO de que quieres cambiar la contraseña de TODOS los usuarios a 'PADEL26'?\\n\\nEsta acción no se puede deshacer. Tu usuario Admin (NOA21) NO se verá afectado.")) return;

        const promptCheck = prompt("Para confirmar, escribe: RESETEAR");
        if (promptCheck !== "RESETEAR") {
            alert("Cancelado.");
            return;
        }

        try {
            const content = document.getElementById('content-area');
            content.innerHTML = '<div class="loader"></div><div style="text-align:center; margin-top:1rem;">Procesando... no cierres la ventana</div>';

            const users = await FirebaseDB.players.getAll();
            let count = 0;
            let skipped = 0;

            let batch = window.db.batch();
            let opCount = 0;

            for (const u of users) {
                if (u.phone === '649219350' || (u.phone && u.phone.endsWith('649219350'))) {
                    console.log(`🛡️ SKIPPING SUPER ADMIN: ${u.name}`);
                    skipped++;
                    continue;
                }
                batch.update(window.db.collection('players').doc(u.id), { password: 'PADEL26' });
                count++;
                opCount++;

                if (opCount >= 450) {
                    await batch.commit();
                    batch = window.db.batch();
                    opCount = 0;
                }
            }

            if (opCount > 0) {
                await batch.commit();
            }

            // Invalidate Cache after batch operation
            if (window.CacheService) window.CacheService.remove('players', 'all');

            alert(`✅ OPERACIÓN COMPLETADA\\n\\n - ${count} contraseñas cambiadas a PADEL26\\n - ${skipped} usuarios admin protegidos (NOA21)\\n\\nAhora todos pueden entrar con 'PADEL26'.`);
            loadAdminView('config');

        } catch (e) {
            console.error("Critical Error:", e);
            alert("❌ ERROR: " + e.message);
            loadAdminView('config');
        }
    };

    window.checkRoleDistribution = async () => {
        const users = await FirebaseDB.players.getAll();
        const counts = {};
        users.forEach(u => {
            const r = u.role || 'player';
            counts[r] = (counts[r] || 0) + 1;
        });
        alert("Distribución de Roles:\\n" + JSON.stringify(counts, null, 2));
    };
};
