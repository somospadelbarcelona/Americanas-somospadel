/**
 * AdminTournaments.js
 * Tournament Management Console for Admins
 */
(function () {
    class AdminTournaments {
        constructor() {
            this.container = null;
            this.tournaments = [];
        }

        async init() {
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            // Update Page Title
            const title = document.getElementById('page-title');
            if (title) title.innerText = "GESTOR DE TORNEOS PRO";

            this.container.innerHTML = `<div class="loading-container"><div class="loader"></div><p>Sincronizando competiciones...</p></div>`;
            
            await this.fetchTournaments();
            this.render();
        }

        async fetchTournaments() {
            try {
                const db = window.db || firebase.firestore();
                const snapshot = await db.collection('tournaments').get();
                const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Función inteligente de parseo de fechas para ordenar de verdad cronológicamente
                const parseTournamentDate = (t) => {
                    if (!t || !t.dates) return new Date(0);
                    const dateStr = t.dates.trim();
                    
                    // 1. Intentar patrón dd/mm/yy o dd/mm/yyyy (ej: 05/06/26 o 05/06/2026)
                    const dmyRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
                    const dmyMatch = dateStr.match(dmyRegex);
                    if (dmyMatch) {
                        const day = parseInt(dmyMatch[1], 10);
                        const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
                        let year = parseInt(dmyMatch[3], 10);
                        if (year < 100) year += 2000; // Asumir siglo 21
                        return new Date(year, month, day);
                    }
                    
                    // 2. Intentar patrón de texto con meses (ej: 08 May - 10 May, 12 de Octubre)
                    const monthsMap = {
                        jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5, jul: 6,
                        aug: 7, ago: 7, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11
                    };
                    
                    const textRegex = /(\d{1,2})\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚ]{3,})/i;
                    const textMatch = dateStr.match(textRegex);
                    if (textMatch) {
                        const day = parseInt(textMatch[1], 10);
                        const monthStr = textMatch[2].toLowerCase().substring(0, 3);
                        const month = monthsMap[monthStr] !== undefined ? monthsMap[monthStr] : new Date().getMonth();
                        const yearRegex = /\b(20\d{2})\b/;
                        const yearMatch = dateStr.match(yearRegex);
                        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
                        return new Date(year, month, day);
                    }
                    
                    if (t.createdAt) {
                        if (typeof t.createdAt.toDate === 'function') return t.createdAt.toDate();
                        return new Date(t.createdAt);
                    }
                    
                    return new Date(0);
                };

                // Ordenar por defecto de más actual (más nueva) a más antigua
                all.sort((a, b) => parseTournamentDate(b) - parseTournamentDate(a));

                this.tournaments = all;

                if (this.tournaments.length === 0) {
                    // Seed the database with the user's requested tournament
                    this.tournaments = [{
                        id: 'seed-siux-11',
                        title: '11º ANIVERSARIO SIUX EVEN PADEL TOUR',
                        poster: 'https://img.freepik.com/vector-premium/cartel-torneo-padel_1284-41144.jpg',
                        category: 'Torneo Challenger',
                        location: 'Padelarium',
                        dates: '08 May - 10 May',
                        status: 'En juego!',
                        link: '#'
                    }];
                }
            } catch (e) {
                console.error("Error fetching tournaments:", e);
            }
        }

        render() {
            this.container.innerHTML = `
                <div class="admin-tournaments-wrapper animate-fade-in" style="padding: 20px;">
                    <!-- HEADER ACTIONS -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                        <div>
                            <h2 style="margin:0; color: white; font-weight: 950; font-size: 1.5rem;">LISTADO DE COMPETICIONES</h2>
                            <p style="margin: 5px 0 0; color: #888; font-size: 0.8rem; font-weight: 600;">Gestiona los torneos visibles en la App del Jugador</p>
                        </div>
                        <button onclick="window.AdminTournaments.openCreateModal()" 
                                style="background: var(--brand-neon, #ccff00); color: black; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 20px rgba(204,255,0,0.2);">
                            <i class="fas fa-plus"></i> CREAR NUEVO TORNEO
                        </button>
                    </div>

                    <!-- DATA GRID -->
                    <div style="display: grid; gap: 15px;">
                        ${this.tournaments.map(t => `
                            <div class="tournament-admin-row" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 18px; padding: 15px; display: flex; align-items: center; gap: 20px;">
                                <img src="${t.poster}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                                <div style="flex: 1;">
                                    <div style="font-weight: 900; color: white; font-size: 1rem;">${t.title}</div>
                                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                                        <span style="font-size: 0.65rem; background: rgba(255,255,255,0.05); color: #888; padding: 2px 8px; border-radius: 4px; font-weight: 800;">${t.category}</span>
                                        <span style="font-size: 0.65rem; background: rgba(0,210,255,0.1); color: #00d2ff; padding: 2px 8px; border-radius: 4px; font-weight: 800;">${t.status}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="window.AdminTournaments.editTournament('${t.id}')" class="btn-micro" style="background: rgba(255,255,255,0.05);">
                                        <i class="fas fa-pen"></i>
                                    </button>
                                    <button onclick="window.AdminTournaments.deleteTournament('${t.id}')" class="btn-micro" style="background: rgba(220,38,38,0.1); color: #dc2626 !important;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- MODAL PARA CREAR/EDITAR -->
                <div id="tournament-modal" class="modal-overlay hidden" style="z-index: 10000;">
                    <div class="modal-content" style="max-width: 600px; background: #1a1a1a;">
                        <div class="modal-header">
                            <h2 id="tournament-modal-title">Configurar Torneo</h2>
                            <button class="close-modal-btn" onclick="window.AdminTournaments.closeModal()">&times;</button>
                        </div>
                        <form id="tournament-form" class="pro-form" style="padding: 20px;">
                            <input type="hidden" name="id">
                            <div class="form-group">
                                <label>TÍTULO DEL TORNEO</label>
                                <input type="text" name="title" class="pro-input" placeholder="Ej: Americanas SomosPadel Open" required>
                            </div>
                            
                            <div class="form-group">
                                <label>POSTER DEL TORNEO (FOTO)</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input type="text" name="poster" id="tournament-poster-url" class="pro-input" placeholder="URL o Imagen subida..." style="flex: 1;">
                                    <button type="button" onclick="document.getElementById('poster-file-input').click()" 
                                            style="background: #3b82f6; color: white; border: none; padding: 0 15px; border-radius: 10px; height: 42px; font-weight: 800; cursor: pointer; white-space: nowrap;">
                                        <i class="fas fa-camera"></i> SUBIR
                                    </button>
                                </div>
                                <input type="file" id="poster-file-input" accept="image/*" style="display: none;" onchange="window.AdminTournaments.handleFileSelect(this)">
                                <div id="poster-preview-container" style="margin-top: 10px; display: none;">
                                    <img id="poster-preview-img" src="" style="width: 100px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid var(--brand-neon);">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div class="form-group">
                                    <label>CATEGORÍA(S)</label>
                                    <input type="text" name="category" class="pro-input" placeholder="Ej: 3ª Masc, 4ª Mixta..." required>
                                </div>
                                <div class="form-group">
                                    <label>ESTADO</label>
                                    <select name="status" class="pro-input">
                                        <option value="Abiertas">Inscripciones Abiertas</option>
                                        <option value="En juego!">En juego!</option>
                                        <option value="Finalizado">Finalizado</option>
                                        <option value="Próximamente">Próximamente</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>UBICACIÓN</label>
                                <input type="text" name="location" class="pro-input" placeholder="Club Padel Somospadel" required>
                            </div>
                            <div class="form-group">
                                <label>FECHAS</label>
                                <input type="text" name="dates" class="pro-input" placeholder="Ej: 15 May - 20 May" required>
                            </div>
                            <div class="form-group">
                                <label>LINK EXTERNO (Opcional)</label>
                                <input type="text" name="link" class="pro-input" placeholder="https://...">
                            </div>
                            <button type="submit" class="btn-primary-pro" style="width: 100%; margin-top: 20px; padding: 15px;">
                                <i class="fas fa-save"></i> GUARDAR COMPETICIÓN
                            </button>
                        </form>
                    </div>
                </div>
            `;

            this.bindForm();
        }

        handleFileSelect(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        // Create a canvas to compress the image
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Max dimension 800px for posters
                        const MAX_SIZE = 800;
                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Export as compressed JPEG (0.7 quality)
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        
                        document.getElementById('tournament-poster-url').value = compressedBase64;
                        const preview = document.getElementById('poster-preview-img');
                        const container = document.getElementById('poster-preview-container');
                        if (preview && container) {
                            preview.src = compressedBase64;
                            container.style.display = 'block';
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(input.files[0]);
            }
        }

        bindForm() {
            const form = document.getElementById('tournament-form');
            if (!form) return;

            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const db = window.db || firebase.firestore();

                try {
                    // Check if it's a real Firebase ID (usually long alphanumeric) or a seed/demo ID
                    const isRealId = data.id && !data.id.includes('seed') && !data.id.includes('demo');

                    if (isRealId) {
                        await db.collection('tournaments').doc(data.id).update(data);
                    } else {
                        delete data.id; // Remove temporary seed ID to let Firebase generate a real one
                        await db.collection('tournaments').add(data);
                    }
                    alert("✅ Torneo guardado con éxito");
                    this.closeModal();
                    this.init();
                } catch (err) {
                    alert("❌ Error al guardar: " + err.message);
                }
            };
        }

        openCreateModal() {
            const modal = document.getElementById('tournament-modal');
            const form = document.getElementById('tournament-form');
            if (modal && form) {
                form.reset();
                form.id.value = "";
                modal.classList.remove('hidden');
            }
        }

        editTournament(id) {
            const t = this.tournaments.find(x => x.id === id);
            if (!t) return;

            const modal = document.getElementById('tournament-modal');
            const form = document.getElementById('tournament-form');
            if (modal && form) {
                modal.classList.remove('hidden');
                for (let key in t) {
                    if (form[key]) form[key].value = t[key];
                }

                // Update Preview
                const preview = document.getElementById('poster-preview-img');
                const container = document.getElementById('poster-preview-container');
                if (t.poster && preview && container) {
                    preview.src = t.poster;
                    container.style.display = 'block';
                } else if (container) {
                    container.style.display = 'none';
                }
            }
        }

        async deleteTournament(id) {
            if (!confirm("¿Seguro que quieres eliminar este torneo?")) return;
            const db = window.db || firebase.firestore();
            try {
                await db.collection('tournaments').doc(id).delete();
                alert("Torneo eliminado");
                this.init();
            } catch (err) {
                alert("Error al eliminar: " + err.message);
            }
        }

        closeModal() {
            const modal = document.getElementById('tournament-modal');
            if (modal) modal.classList.add('hidden');
        }
    }

    window.AdminTournaments = new AdminTournaments();
})();
