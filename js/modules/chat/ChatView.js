/**
 * ChatView.js
 * SomosPadel Barcelona - Playtomic-Inspired Dark Premium Chat View
 * Mobile-first native messaging UI with neon-lime (#CCFF00) accents.
 * Version: 2.0.0 Pro
 */

(function () {
    window._spEventChatRegistry = window._spEventChatRegistry || {};

    class ChatView {
        constructor() {
            this.activeView = null; // 'inbox' | 'room' | null
            this.activeTab = 'events'; // 'events' | 'direct'
            this.activeChatId = null;
            this.activeChatData = null;
            this.activeRoomUnsub = null;
            this.userChatsUnsub = null;
            this.currentChats = [];
            this.currentFilter = '';
            this.pendingAttachment = null;
            this.currentUid = null;

            // Escuchar cambios de autenticación para vincular badge global
            this.bindGlobalAuthListener();
        }

        /* ═══════════════════════════════════════════════════════════════
           1. USER & SESSION MANAGEMENT
           ═══════════════════════════════════════════════════════════════ */
        getCurrentUser() {
            if (window.ChatService && typeof window.ChatService.getCurrentUser === 'function') {
                return window.ChatService.getCurrentUser();
            }
            if (window.Store && typeof window.Store.getState === 'function') {
                const u = window.Store.getState('currentUser');
                if (u) return u;
            }
            try {
                const cached = localStorage.getItem('currentUser');
                if (cached) return JSON.parse(cached);
            } catch (e) { }
            return null;
        }

        bindGlobalAuthListener() {
            const checkAndListen = () => {
                const user = this.getCurrentUser();
                const uid = user ? (user.id || user.uid) : null;
                if (uid && uid !== this.currentUid) {
                    this.currentUid = uid;
                    this.startGlobalUnreadWatcher(uid);
                } else if (!uid && this.currentUid) {
                    this.currentUid = null;
                    if (this.userChatsUnsub) {
                        this.userChatsUnsub();
                        this.userChatsUnsub = null;
                    }
                    this.updateAllUnreadBadges(0);
                }
            };

            // Primer chequeo diferido
            setTimeout(checkAndListen, 800);

            // Re-chequear al recibir eventos de auth o visibilidad
            window.addEventListener('sp_auth_state_changed', checkAndListen);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') checkAndListen();
            });
        }

        startGlobalUnreadWatcher(uid) {
            if (this.userChatsUnsub) {
                this.userChatsUnsub();
                this.userChatsUnsub = null;
            }

            if (!window.ChatService || typeof window.ChatService.getUserChats !== 'function') {
                console.warn("[ChatView] ChatService.getUserChats no disponible todavía.");
                return;
            }

            this.userChatsUnsub = window.ChatService.getUserChats(uid, (chats) => {
                this.currentChats = chats || [];
                const totalUnread = this.calculateTotalUnread(this.currentChats, uid);
                this.updateAllUnreadBadges(totalUnread);

                // Si la bandeja está abierta, repintamos la lista
                if (this.activeView === 'inbox') {
                    this.renderInboxList();
                }
            });
        }

        calculateTotalUnread(chats, uid) {
            if (!Array.isArray(chats) || !uid) return 0;
            let sum = 0;
            chats.forEach(chat => {
                if (chat.unreadCount && typeof chat.unreadCount[uid] === 'number') {
                    sum += chat.unreadCount[uid];
                } else if (chat.lastSenderId && chat.lastSenderId !== uid) {
                    // Fallback basado en timestamp de lectura
                    const lastRead = chat.readTimestamps && chat.readTimestamps[uid];
                    const readTime = lastRead?.toMillis ? lastRead.toMillis() : (lastRead instanceof Date ? lastRead.getTime() : 0);
                    const msgTime = chat.lastMessageTime?.toMillis ? chat.lastMessageTime.toMillis() : (chat.lastMessageTime instanceof Date ? chat.lastMessageTime.getTime() : 0);
                    if (msgTime > readTime) sum += 1;
                }
            });
            return sum;
        }

        updateAllUnreadBadges(count) {
            const badges = document.querySelectorAll('.sp-unread-chat-badge');
            badges.forEach(b => {
                if (count > 0) {
                    b.textContent = count > 99 ? '99+' : count;
                    b.style.display = 'inline-flex';
                } else {
                    b.textContent = '0';
                    b.style.display = 'none';
                }
            });
        }

        /* ═══════════════════════════════════════════════════════════════
           2. MODAL SCAFFOLDING & LIFECYCLE
           ═══════════════════════════════════════════════════════════════ */
        ensureBackdrop() {
            let backdrop = document.getElementById('sp-chat-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'sp-chat-backdrop';
                backdrop.className = 'sp-chat-backdrop';
                backdrop.innerHTML = `<div class="sp-chat-window" id="sp-chat-window"></div>`;
                document.body.appendChild(backdrop);

                // Cerrar al hacer clic en el backdrop fuera del modal (desktop)
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) {
                        this.close();
                    }
                });

                // Soporte tecla Escape
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
                        this.close();
                    }
                });
            }
            return backdrop;
        }

        close() {
            const backdrop = document.getElementById('sp-chat-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
            }
            if (this.activeRoomUnsub) {
                this.activeRoomUnsub();
                this.activeRoomUnsub = null;
            }
            this.activeView = null;
            this.activeChatId = null;
            this.activeChatData = null;
            this.pendingAttachment = null;
        }

        /* ═══════════════════════════════════════════════════════════════
           3. BANDEJA DE MENSAJES ("Mis Mensajes" Inbox)
           ═══════════════════════════════════════════════════════════════ */
        openInbox(tab = 'events') {
            const user = this.getCurrentUser();
            if (!user) {
                if (window.Router && typeof window.Router.navigate === 'function') {
                    window.Router.navigate('profile');
                } else {
                    alert("Debes iniciar sesión para ver tus mensajes y chats.");
                }
                return;
            }

            const uid = user.id || user.uid;
            if (this.currentUid !== uid) {
                this.currentUid = uid;
                this.startGlobalUnreadWatcher(uid);
            }

            // Precarga en segundo plano de jugadores para búsqueda instantánea (0ms)
            if (window.ChatService && typeof window.ChatService.getPlayersPool === 'function') {
                window.ChatService.getPlayersPool().catch(() => {});
            }

            this.activeView = 'inbox';
            this.activeTab = tab;
            this.currentFilter = '';

            const backdrop = this.ensureBackdrop();
            const container = document.getElementById('sp-chat-window');

            container.innerHTML = `
                <!-- HEADER BANDEJA -->
                <div class="sp-chat-header">
                    <div class="sp-chat-header-left">
                        <div class="sp-chat-avatar" style="background: #0f172a; color: var(--sp-chat-neon); box-shadow: 0 0 12px rgba(204,255,0,0.25);">
                            <i class="fas fa-comment-dots"></i>
                        </div>
                        <div class="sp-chat-header-title-wrap">
                            <h2 class="sp-chat-header-title">Mis Mensajes</h2>
                            <div class="sp-chat-header-sub">
                                <span class="sp-chat-live-pulse-dot" style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 6px #10b981;"></span>
                                <span>En directo • SomosPadel BCN</span>
                            </div>
                        </div>
                    </div>
                    <div class="sp-chat-header-actions">
                        <button class="sp-chat-icon-btn" onclick="window.PlayerView?.haptic?.(10); window.ChatView.close()" title="Cerrar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- CUERPO DE LA BANDEJA -->
                <div class="sp-chat-inbox-body">
                    <!-- BUSCADOR -->
                    <div class="sp-chat-search-wrap" style="position: relative;">
                        <div class="sp-chat-search-box">
                            <i class="fas fa-search" style="color: #CCFF00;"></i>
                            <input type="text" 
                                id="sp-chat-search-input" 
                                class="sp-chat-search-input" 
                                placeholder="Buscar chats o jugadores..." 
                                oninput="window.ChatView.handleSearch(this.value)">
                            <button id="sp-chat-search-clear" 
                                    class="sp-chat-search-clear" 
                                    onclick="window.ChatView.clearSearch()" 
                                    style="display: none;" 
                                    title="Limpiar búsqueda">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        </div>
                        <div id="sp-chat-player-results" class="sp-chat-player-results-dropdown"></div>
                    </div>

                    <!-- CARRUSEL DE CONEXIÓN RÁPIDA (JUGADORES EN PISTA) -->
                    <div id="sp-chat-quick-players-bar" class="sp-chat-quick-players-bar"></div>

                    <!-- PESTAÑAS (SEGMENTED CONTROL) -->
                    <div class="sp-chat-tabs">
                        <button class="sp-chat-tab-pill ${this.activeTab === 'events' ? 'active' : ''}" 
                            id="sp-chat-tab-events" 
                            onclick="window.ChatView.switchTab('events')">
                            <i class="fas fa-trophy"></i> Partidos
                            <span class="sp-chat-tab-badge" id="sp-chat-tab-badge-events" style="display:none;"></span>
                        </button>
                        <button class="sp-chat-tab-pill ${this.activeTab === 'direct' ? 'active' : ''}" 
                            id="sp-chat-tab-direct" 
                            onclick="window.ChatView.switchTab('direct')">
                            <i class="fas fa-user-friends"></i> Privados
                            <span class="sp-chat-tab-badge" id="sp-chat-tab-badge-direct" style="display:none;"></span>
                        </button>
                        <button class="sp-chat-tab-pill ${this.activeTab === 'unread' ? 'active' : ''}" 
                            id="sp-chat-tab-unread" 
                            onclick="window.ChatView.switchTab('unread')">
                            <i class="fas fa-bell"></i> No leídos
                            <span class="sp-chat-tab-badge sp-chat-tab-badge-highlight" id="sp-chat-tab-badge-unread" style="display:none;"></span>
                        </button>
                    </div>

                    <!-- LISTA DE CHATS -->
                    <div class="sp-chat-list" id="sp-chat-inbox-list">
                        <div style="text-align:center; padding: 40px 20px; color:#64748b;">
                            <i class="fas fa-circle-notch fa-spin fa-2x" style="color:#0f172a;"></i>
                            <div style="margin-top:12px; font-size:0.82rem; font-weight:700;">Cargando tus conversaciones...</div>
                        </div>
                    </div>
                </div>
            `;

            backdrop.classList.add('active');
            this.loadQuickPlayersBar();
            this.renderInboxList();
        }

        switchTab(tab) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            this.activeTab = tab;
            document.getElementById('sp-chat-tab-events')?.classList.toggle('active', tab === 'events');
            document.getElementById('sp-chat-tab-direct')?.classList.toggle('active', tab === 'direct');
            document.getElementById('sp-chat-tab-unread')?.classList.toggle('active', tab === 'unread');
            this.renderInboxList();
        }

        clearSearch() {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(10);
            const inputEl = document.getElementById('sp-chat-search-input');
            const clearBtn = document.getElementById('sp-chat-search-clear');
            const resultsEl = document.getElementById('sp-chat-player-results');
            if (inputEl) inputEl.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            if (resultsEl) resultsEl.innerHTML = '';
            this.currentFilter = '';
            this.renderInboxList();
        }

        focusSearchInput() {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            const inputEl = document.getElementById('sp-chat-search-input');
            if (inputEl) {
                inputEl.focus();
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        async loadQuickPlayersBar() {
            const barEl = document.getElementById('sp-chat-quick-players-bar');
            if (!barEl) return;

            try {
                let players = [];
                if (window.ChatService && typeof window.ChatService.getPlayersPool === 'function') {
                    players = await window.ChatService.getPlayersPool();
                } else if (Array.isArray(window.allUsersCache)) {
                    players = window.allUsersCache;
                }

                const user = this.getCurrentUser();
                const myUid = user ? (user.id || user.uid) : null;
                const filteredPlayers = (players || []).filter(p => (p.id || p.uid) !== myUid).slice(0, 10);

                if (filteredPlayers.length === 0) {
                    barEl.style.display = 'none';
                    return;
                }

                barEl.style.display = 'flex';
                let html = `
                    <div class="sp-chat-quick-player-item sp-chat-quick-explore" onclick="window.ChatView.focusSearchInput()" title="Buscar jugador">
                        <div class="sp-chat-quick-player-avatar sp-chat-quick-avatar-explore">
                            <i class="fas fa-search"></i>
                        </div>
                        <span class="sp-chat-quick-player-name">Explorar</span>
                    </div>
                `;

                filteredPlayers.forEach(p => {
                    const pid = this.escapeHtml(String(p.id || p.uid || ''));
                    const pName = this.escapeHtml(p.name || p.displayName || 'Jugador');
                    const firstName = pName.split(' ')[0];
                    const photo = p.photo_url || p.photoURL || p.avatar;
                    const level = p.level || p.nivel;
                    const levelBadge = level ? `<span class="sp-chat-quick-player-badge">${level}</span>` : '';
                    const avatarContent = photo 
                        ? `<img src="${photo}" alt="${pName}" loading="lazy">` 
                        : `<span>${this.getInitials(pName)}</span>`;

                    html += `
                        <div class="sp-chat-quick-player-item" 
                             onclick="window.PlayerView?.haptic?.(20); window.ChatView.startDirectChatWithPlayerById('${pid}')" 
                             title="Chatear con ${pName}">
                            <div class="sp-chat-quick-player-avatar">
                                ${avatarContent}
                                ${levelBadge}
                                <span class="sp-chat-online-dot"></span>
                            </div>
                            <span class="sp-chat-quick-player-name">${firstName}</span>
                        </div>
                    `;
                });

                barEl.innerHTML = html;
            } catch (e) {
                console.warn("[ChatView] Error cargando quick players bar:", e);
                if (barEl) barEl.style.display = 'none';
            }
        }

        handleSearch(query) {
            this.currentFilter = (query || '').toLowerCase().trim();
            const clearBtn = document.getElementById('sp-chat-search-clear');
            if (clearBtn) {
                clearBtn.style.display = this.currentFilter ? 'flex' : 'none';
            }

            this.renderInboxList(); // sigue filtrando chats existentes

            // Si hay 2+ caracteres, buscar jugadores también
            const resultsEl = document.getElementById('sp-chat-player-results');
            if (!resultsEl) return;

            if (this.currentFilter.length >= 2) {
                // Búsqueda debounced (300ms)
                clearTimeout(this._playerSearchTimeout);
                this._playerSearchTimeout = setTimeout(async () => {
                    try {
                        const players = await window.ChatService.searchPlayers(this.currentFilter);
                        this.renderPlayerSearchResults(players, this.currentFilter);
                    } catch (e) {
                        console.warn('[ChatView] Player search failed:', e);
                    }
                }, 300);
            } else {
                resultsEl.innerHTML = '';
            }
        }

        /* ── Renderiza resultados de búsqueda de jugadores ── */
        renderPlayerSearchResults(players, query) {
            const resultsEl = document.getElementById('sp-chat-player-results');
            if (!resultsEl) return;

            this._lastSearchResults = Array.isArray(players) ? players : [];

            if (!players || players.length === 0) {
                resultsEl.innerHTML = `<div class="sp-chat-no-players-found">Sin resultados para "${this.escapeHtml(query)}"</div>`;
                return;
            }

            resultsEl.innerHTML = players.map(p => {
                const playerId = this.escapeHtml(String(p.id || p.uid || ''));
                const safeName = this.escapeHtml(p.name || p.displayName || 'Jugador');
                const avatarHtml = (p.photo_url || p.photoURL)
                    ? `<img src="${p.photo_url || p.photoURL}" alt="${safeName}" loading="lazy">`
                    : `${(p.name || p.displayName || '?')[0].toUpperCase()}`;
                const levelLabel = p.level || p.nivel ? `⭐ ${p.level || p.nivel}` : '';
                return `
                <div class="sp-chat-player-result" 
                     data-player-id="${playerId}"
                     onclick="window.ChatView.startDirectChatWithPlayerById('${playerId}')">
                    <div class="sp-chat-player-result-avatar">${avatarHtml}</div>
                    <div class="sp-chat-player-result-info">
                        <span class="sp-chat-player-result-name">${safeName}</span>
                        ${levelLabel ? `<span class="sp-chat-player-result-level">${levelLabel}</span>` : ''}
                    </div>
                    <button class="sp-chat-player-result-btn" 
                            onclick="event.stopPropagation(); window.ChatView.startDirectChatWithPlayerById('${playerId}')"
                            title="Enviar mensaje privado">
                        <i class="fas fa-comment-dots"></i>
                    </button>
                </div>`;
            }).join('');
        }

        /* ── Inicia chat directo desde resultado de búsqueda por ID o por Objeto ── */
        startDirectChatWithPlayerById(playerId) {
            if (!playerId) return;
            const player = (this._lastSearchResults || []).find(p => (p.id || p.uid) === playerId) || { id: playerId, uid: playerId };
            this.startDirectChatWithPlayer(player);
        }

        startDirectChatWithPlayer(player) {
            // Oculta el dropdown de resultados
            const resultsEl = document.getElementById('sp-chat-player-results');
            if (resultsEl) resultsEl.innerHTML = '';
            // Limpia el input
            const inputEl = document.getElementById('sp-chat-search-input');
            if (inputEl) inputEl.value = '';
            const clearBtn = document.getElementById('sp-chat-search-clear');
            if (clearBtn) clearBtn.style.display = 'none';
            this.currentFilter = '';
            // Abre el chat directo
            this.openDirectChat(player);
        }

        calculateTabUnreadCounts(myUid) {
            let eventsUnread = 0;
            let directUnread = 0;

            (this.currentChats || []).forEach(chat => {
                let unread = 0;
                if (chat.unreadCount && typeof chat.unreadCount[myUid] === 'number') {
                    unread = chat.unreadCount[myUid];
                } else if (chat.lastSenderId && chat.lastSenderId !== myUid) {
                    const lastRead = chat.readTimestamps && chat.readTimestamps[myUid];
                    const readTime = lastRead?.toMillis ? lastRead.toMillis() : (lastRead instanceof Date ? lastRead.getTime() : 0);
                    const msgTime = chat.lastMessageTime?.toMillis ? chat.lastMessageTime.toMillis() : (chat.lastMessageTime instanceof Date ? chat.lastMessageTime.getTime() : 0);
                    if (msgTime > readTime) unread = 1;
                }

                if (unread > 0) {
                    const isEvent = chat.type === 'event' || String(chat.id).startsWith('event_');
                    if (isEvent) eventsUnread += unread;
                    else directUnread += unread;
                }
            });

            return {
                eventsUnread,
                directUnread,
                totalUnread: eventsUnread + directUnread
            };
        }

        updateTabBadges(counts) {
            const user = this.getCurrentUser();
            const myUid = user ? (user.id || user.uid) : null;
            const c = counts || this.calculateTabUnreadCounts(myUid);

            const bEvents = document.getElementById('sp-chat-tab-badge-events');
            if (bEvents) {
                bEvents.textContent = c.eventsUnread > 99 ? '99+' : c.eventsUnread;
                bEvents.style.display = c.eventsUnread > 0 ? 'inline-flex' : 'none';
            }

            const bDirect = document.getElementById('sp-chat-tab-badge-direct');
            if (bDirect) {
                bDirect.textContent = c.directUnread > 99 ? '99+' : c.directUnread;
                bDirect.style.display = c.directUnread > 0 ? 'inline-flex' : 'none';
            }

            const bUnread = document.getElementById('sp-chat-tab-badge-unread');
            if (bUnread) {
                bUnread.textContent = c.totalUnread > 99 ? '99+' : c.totalUnread;
                bUnread.style.display = c.totalUnread > 0 ? 'inline-flex' : 'none';
            }
        }

        renderInboxList() {
            const listEl = document.getElementById('sp-chat-inbox-list');
            if (!listEl) return;

            const user = this.getCurrentUser();
            const myUid = user ? (user.id || user.uid) : null;

            // Actualizar contadores de las pestañas
            this.updateTabBadges();

            // Filtrar chats según la pestaña activa
            let filtered = (this.currentChats || []).filter(c => {
                if (this.activeTab === 'events') {
                    return c.type === 'event' || String(c.id).startsWith('event_');
                } else if (this.activeTab === 'direct') {
                    return c.type === 'direct' || String(c.id).startsWith('direct_');
                } else if (this.activeTab === 'unread') {
                    let unread = 0;
                    if (c.unreadCount && typeof c.unreadCount[myUid] === 'number') {
                        unread = c.unreadCount[myUid];
                    } else if (c.lastSenderId && c.lastSenderId !== myUid) {
                        const lastRead = c.readTimestamps && c.readTimestamps[myUid];
                        const readTime = lastRead?.toMillis ? lastRead.toMillis() : (lastRead instanceof Date ? lastRead.getTime() : 0);
                        const msgTime = c.lastMessageTime?.toMillis ? c.lastMessageTime.toMillis() : (c.lastMessageTime instanceof Date ? c.lastMessageTime.getTime() : 0);
                        if (msgTime > readTime) unread = 1;
                    }
                    return unread > 0;
                }
                return true;
            });

            // Filtrar por término de búsqueda
            if (this.currentFilter) {
                filtered = filtered.filter(c => {
                    const title = (c.title || this.getDirectChatTitle(c, myUid) || '').toLowerCase();
                    const lastMsg = (c.lastMessage || '').toLowerCase();
                    return title.includes(this.currentFilter) || lastMsg.includes(this.currentFilter);
                });
            }

            let pinnedHtml = '';
            if (this.activeTab === 'events') {
                const showPinned = !this.currentFilter || 'chat general somospadel comunidad pista social oficial'.includes(this.currentFilter);
                if (showPinned) {
                    pinnedHtml = `
                        <!-- TARJETA FIJADA: CHAT GENERAL SOMOSPADEL -->
                        <div class="sp-chat-card sp-chat-card-pinned" 
                             onclick="window.PlayerView?.haptic?.(20); window.ChatView.openGeneralCommunityChat();"
                             title="Abrir Chat General SomosPadel">
                            <div class="sp-chat-avatar" style="background: rgba(204, 255, 0, 0.18); color: #CCFF00; border: 1.5px solid #CCFF00; box-shadow: 0 0 10px rgba(204,255,0,0.3);">
                                <i class="fas fa-bullhorn"></i>
                            </div>
                            <div class="sp-chat-card-main">
                                <div class="sp-chat-card-top">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="font-size: 0.85rem;">📌</span>
                                        <span class="sp-chat-card-title" style="color: #CCFF00; font-weight: 900; letter-spacing: 0.3px;">🎾 CHAT GENERAL SOMOSPADEL</span>
                                    </div>
                                    <span class="sp-chat-card-time" style="background: #CCFF00; color: #000; font-weight: 950; font-size: 0.60rem; padding: 2px 7px; border-radius: 8px; letter-spacing: 0.4px;">⚡ OFICIAL • EN VIVO</span>
                                </div>
                                <div class="sp-chat-card-bottom">
                                    <span class="sp-chat-card-preview" style="color: #cbd5e1; font-weight: 600; line-height: 1.3;">
                                        La pista social de la comunidad • Habla con todos los jugadores
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                // Excluir el chat general de filtered para evitar duplicado
                filtered = filtered.filter(c => c.id !== 'general_somospadel' && c.id !== 'event_general_somospadel');
            }

            if (filtered.length === 0) {
                if (this.activeTab === 'unread') {
                    listEl.innerHTML = `
                        <div class="sp-chat-empty" style="padding: 36px 20px;">
                            <div class="sp-chat-empty-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="sp-chat-empty-title" style="color: #0f172a;">
                                ¡Estás al día! 🎾
                            </div>
                            <div class="sp-chat-empty-desc">
                                No tienes mensajes pendientes de lectura en tus partidos ni conversaciones privadas.
                            </div>
                        </div>
                    `;
                    return;
                }

                const isEvents = this.activeTab === 'events';
                listEl.innerHTML = pinnedHtml + `
                    <div class="sp-chat-empty" style="${pinnedHtml ? 'padding: 24px 20px;' : 'padding: 36px 20px;'}">
                        <div class="sp-chat-empty-icon">
                            <i class="${isEvents ? 'fas fa-trophy' : 'fas fa-comments'}"></i>
                        </div>
                        <div class="sp-chat-empty-title">
                            ${this.currentFilter ? 'Sin resultados para la búsqueda' : (isEvents ? 'No tienes otros chats de partidos activos' : 'No tienes chats privados todavía')}
                        </div>
                        <div class="sp-chat-empty-desc">
                            ${isEvents 
                                ? 'Únete a un entreno o americana para interactuar con tus compañeros y capitanes.' 
                                : 'Busca a cualquier compañero por su nombre arriba o envía mensajes directamente desde las convocatorias y partidos.'}
                        </div>
                        ${!isEvents && !this.currentFilter ? `
                        <div style="margin-top: 16px;">
                            <button class="sp-chat-quick-start-btn" onclick="window.ChatView.focusSearchInput()">
                                <i class="fas fa-bolt"></i> Buscar Jugadores Ahora
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `;
                return;
            }

            listEl.innerHTML = pinnedHtml + filtered.map(c => this.renderChatCardHtml(c, myUid)).join('');
        }

        getDirectChatTitle(chat, myUid) {
            if (chat.title) return chat.title;
            if (chat.participantDetails) {
                const otherUid = (chat.participants || []).find(id => id !== myUid);
                if (otherUid && chat.participantDetails[otherUid]) {
                    return chat.participantDetails[otherUid].name || 'Jugador SomosPadel';
                }
            }
            return 'Jugador SomosPadel';
        }

        getDirectChatAvatar(chat, myUid) {
            if (chat.participantDetails) {
                const otherUid = (chat.participants || []).find(id => id !== myUid);
                if (otherUid && chat.participantDetails[otherUid]) {
                    return chat.participantDetails[otherUid].avatar || null;
                }
            }
            return null;
        }

        renderChatCardHtml(chat, myUid) {
            const isEvent = chat.type === 'event' || String(chat.id).startsWith('event_');
            const title = isEvent ? (chat.title || 'Evento SomosPadel') : this.getDirectChatTitle(chat, myUid);
            const avatarUrl = isEvent ? null : this.getDirectChatAvatar(chat, myUid);
            const timeStr = this.formatTime(chat.lastMessageTime || chat.updatedAt);
            const lastMsg = chat.lastMessage || 'Conversación iniciada';
            const lastSender = chat.lastSenderName ? (chat.lastSenderId === myUid ? 'Tú' : chat.lastSenderName.split(' ')[0]) : '';

            const user = this.getCurrentUser();
            const isAdmin = user && (user.role === 'admin' || user.role === 'admin_player');
            const canDeleteChat = !isEvent || isAdmin;

            // Contador de no leídos
            let unreadCount = 0;
            if (chat.unreadCount && typeof chat.unreadCount[myUid] === 'number') {
                unreadCount = chat.unreadCount[myUid];
            } else if (chat.lastSenderId && chat.lastSenderId !== myUid) {
                const lastRead = chat.readTimestamps && chat.readTimestamps[myUid];
                const readTime = lastRead?.toMillis ? lastRead.toMillis() : (lastRead instanceof Date ? lastRead.getTime() : 0);
                const msgTime = chat.lastMessageTime?.toMillis ? chat.lastMessageTime.toMillis() : (chat.lastMessageTime instanceof Date ? chat.lastMessageTime.getTime() : 0);
                if (msgTime > readTime) unreadCount = 1;
            }

            const otherParticipantId = (chat.participants || []).find(id => id !== myUid) || chat.id;
            const directColor = this.getPlayerColor(otherParticipantId, title);

            const avatarHtml = isEvent
                ? `<div class="sp-chat-avatar event-avatar"><i class="fas fa-trophy"></i></div>`
                : (avatarUrl
                    ? `<div class="sp-chat-avatar"><img src="${avatarUrl}" alt="${title}"></div>`
                    : `<div class="sp-chat-avatar" style="background:${directColor}15; color:${directColor}; border-color:${directColor}35;">${this.getInitials(title)}</div>`);

            // Escapamos seguro para invocación
            const safeChatId = String(chat.id).replace(/['"\\]/g, '');
            window._spEventChatRegistry[chat.id] = chat;
            if (safeChatId !== chat.id) {
                window._spEventChatRegistry[safeChatId] = chat;
            }

            const lastSenderColor = chat.lastSenderId === myUid ? 'inherit' : this.getPlayerColor(chat.lastSenderId, lastSender);

            return `
                <div class="sp-chat-card" onclick="window.ChatView.openFromCard('${safeChatId}')">
                    ${avatarHtml}
                    <div class="sp-chat-card-main">
                        <div class="sp-chat-card-top">
                            <span class="sp-chat-card-title">${this.escapeHtml(title)}</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="sp-chat-card-time">${timeStr}</span>
                                ${canDeleteChat ? `
                                <button class="sp-chat-card-delete-btn" 
                                        onclick="event.stopPropagation(); window.ChatView.confirmDeleteChat('${safeChatId}', '${this.escapeHtml(title)}')" 
                                        title="Eliminar conversación">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="sp-chat-card-bottom">
                            <span class="sp-chat-card-preview">
                                ${chat.lastSenderId === myUid ? '<span style="color:#38bdf8; font-size:0.75rem; margin-right:3px; font-weight:900;">✓✓</span>' : ''}
                                ${lastSender ? `<strong style="color:${lastSenderColor};">${this.escapeHtml(lastSender)}:</strong> ` : ''}
                                ${this.escapeHtml(lastMsg)}
                            </span>
                            ${unreadCount > 0 ? `<span class="sp-unread-badge sp-chat-unread-pulse">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        openFromCard(chatId) {
            const chat = window._spEventChatRegistry[chatId] || (this.currentChats || []).find(c => c.id === chatId);
            if (!chat) return;

            const isEvent = chat.type === 'event' || String(chat.id).startsWith('event_');
            if (isEvent) {
                this.openEventChat(chat);
            } else {
                const user = this.getCurrentUser();
                const myUid = user ? (user.id || user.uid) : null;
                const otherUid = (chat.participants || []).find(id => id !== myUid);
                const otherDetails = (chat.participantDetails && otherUid) ? chat.participantDetails[otherUid] : {};
                this.openDirectChat({
                    id: otherUid,
                    uid: otherUid,
                    name: otherDetails.name || 'Jugador',
                    photo_url: otherDetails.avatar || null
                });
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           4. CONVERSACIÓN EN EVENTO (Entrenos / Americanas)
           ═══════════════════════════════════════════════════════════════ */
        openGeneralCommunityChat() {
            const generalEventData = {
                id: 'general_somospadel',
                name: 'Chat General SomosPadel',
                category: 'Comunidad Oficial',
                date: 'Siempre Activo',
                club: 'SomosPadel Barcelona',
                type: 'general'
            };
            return this.openEventChat(generalEventData);
        }

        async openEventChat(eventData) {
            const user = this.getCurrentUser();
            if (!user) {
                if (window.Router) window.Router.navigate('profile');
                else alert("Debes iniciar sesión para acceder al chat.");
                return;
            }

            if (!eventData) {
                console.error("[ChatView] openEventChat: eventData es requerido");
                return;
            }

            const rawId = eventData.eventId || eventData.id;
            if (!rawId) {
                console.error("[ChatView] openEventChat: eventData debe contener 'id' o 'eventId'");
                return;
            }

            try {
                const backdrop = this.ensureBackdrop();
                const container = document.getElementById('sp-chat-window');
                
                // Feedback de carga inmediato
                container.innerHTML = `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:#64748b;">
                        <i class="fas fa-circle-notch fa-spin fa-2x" style="color:#0f172a;"></i>
                        <span style="font-size:0.85rem; font-weight:800;">Conectando con el canal del partido...</span>
                    </div>
                `;
                backdrop.classList.add('active');

                // Asegurar/crear el chat en backend
                const chatDoc = await window.ChatService.getOrCreateEventChat(eventData);
                const chatId = chatDoc.id || (String(rawId).startsWith('event_') ? String(rawId) : `event_${rawId}`);

                // Guardar referencia
                this.activeChatId = chatId;
                this.activeChatData = {
                    ...chatDoc,
                    ...eventData,
                    type: 'event',
                    title: eventData.title || eventData.name || chatDoc.title || 'Chat del Partido',
                    date: eventData.date || chatDoc.date || null,
                    category: eventData.category || chatDoc.category || 'open',
                    eventId: eventData.eventId || eventData.id || chatDoc.eventId
                };

                // Marcar como leído
                const uid = user.id || user.uid;
                window.ChatService.markChatAsRead(chatId, uid);

                // Renderizar pantalla de conversación
                this.renderChatRoom(this.activeChatData, 'event');

            } catch (err) {
                console.error("[ChatView] Error abriendo chat de evento:", err);
                alert("No se pudo conectar al chat del evento: " + err.message);
                this.openInbox('events');
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           5. CONVERSACIÓN DIRECTA 1 A 1 (Direct Chat Room)
           ═══════════════════════════════════════════════════════════════ */
        async openDirectChat(targetUser) {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                if (window.Router) window.Router.navigate('profile');
                else alert("Debes iniciar sesión para enviar mensajes privados.");
                return;
            }

            if (!targetUser) {
                console.error("[ChatView] openDirectChat: targetUser es requerido");
                return;
            }

            if (typeof targetUser === 'string') {
                targetUser = { id: targetUser, uid: targetUser, name: 'Jugador' };
            }

            const targetUid = targetUser.id || targetUser.uid;
            const myUid = currentUser.id || currentUser.uid;

            if (targetUid === myUid) {
                alert("No puedes abrir un chat privado contigo mismo.");
                return;
            }

            // Resolver nombre si viene vacío
            if (!targetUser.name || targetUser.name === 'Jugador') {
                const cached = (this._lastSearchResults || []).find(p => (p.id || p.uid) === targetUid)
                    || (window.allUsersCache || []).find(u => u.id === targetUid);
                if (cached) {
                    targetUser = { ...cached, ...targetUser, name: cached.name || cached.displayName || 'Jugador' };
                }
            }

            try {
                const backdrop = this.ensureBackdrop();
                const container = document.getElementById('sp-chat-window');

                container.innerHTML = `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:#64748b;">
                        <i class="fas fa-circle-notch fa-spin fa-2x" style="color:#0f172a;"></i>
                        <span style="font-size:0.85rem; font-weight:800;">Conectando con ${targetUser.name || 'el jugador'}...</span>
                    </div>
                `;
                backdrop.classList.add('active');

                // Backend getOrCreateDirectChat
                const chatDoc = await window.ChatService.getOrCreateDirectChat(targetUser);
                const chatId = chatDoc.id;

                this.activeChatId = chatId;
                this.activeChatData = {
                    ...chatDoc,
                    type: 'direct',
                    targetUser: targetUser,
                    title: targetUser.name || targetUser.displayName || 'Jugador'
                };

                // Marcar como leído
                window.ChatService.markChatAsRead(chatId, myUid);

                // Renderizar pantalla de conversación
                this.renderChatRoom(this.activeChatData, 'direct');

            } catch (err) {
                console.error("[ChatView] Error abriendo chat directo:", err);
                alert("No se pudo iniciar el chat privado: " + err.message);
                this.openInbox('direct');
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           6. RENDERIZADO CHAT ROOM (Header, Mensajes & Dock de Entrada)
           ═══════════════════════════════════════════════════════════════ */
        renderChatRoom(chatData, chatType) {
            this.activeView = 'room';
            const container = document.getElementById('sp-chat-window');
            if (!container) return;

            const isEvent = chatType === 'event';
            const isGeneral = chatData.id === 'general_somospadel' || chatData.eventId === 'general_somospadel' || chatData.type === 'general';
            const title = isGeneral ? 'Chat General SomosPadel' : (chatData.title || (isEvent ? 'Chat del Partido' : 'Jugador'));
            
            // Subtítulo tipo Playtomic (ej: "Viernes, 13 Jun • Masculino" o "Jugador SomosPadel")
            let subTitle = '';
            if (isGeneral) {
                subTitle = 'Comunidad Oficial SomosPadel';
            } else if (isEvent) {
                const parts = [];
                if (chatData.date) parts.push(this.formatEventDate(chatData.date));
                if (chatData.category && chatData.category !== 'open') parts.push(chatData.category.toUpperCase());
                subTitle = parts.join(' • ') || 'SomosPadel Barcelona';
            } else {
                subTitle = 'Chat Privado';
            }

            const targetUid = chatData.targetUser?.id || chatData.targetUser?.uid || title;
            const targetColor = this.getPlayerColor(targetUid, title);

            const avatarHtml = isGeneral
                ? `<div class="sp-chat-avatar" style="background: rgba(204, 255, 0, 0.18); color: #CCFF00; border: 1.5px solid #CCFF00;"><i class="fas fa-comments"></i></div>`
                : (isEvent
                    ? `<div class="sp-chat-avatar event-avatar"><i class="fas fa-trophy"></i></div>`
                    : (chatData.targetUser?.photo_url || chatData.targetUser?.photoURL
                        ? `<div class="sp-chat-avatar"><img src="${chatData.targetUser.photo_url || chatData.targetUser.photoURL}" alt="${title}"><span class="sp-chat-online-dot"></span></div>`
                        : `<div class="sp-chat-avatar" style="background:${targetColor}15; color:${targetColor}; border-color:${targetColor}35;">${this.getInitials(title)}<span class="sp-chat-online-dot"></span></div>`));

            // Botón Detalles para eventos
            const detailsBtnHtml = (isEvent && !isGeneral && chatData.eventId)
                ? `<button class="sp-chat-details-btn" onclick="window.ChatView.navigateToEventDetails('${chatData.eventId}')">
                     <i class="fas fa-info-circle"></i> DETALLES
                   </button>`
                : '';

            container.innerHTML = `
                <!-- HEADER CHAT ROOM (ESTILO PLAYTOMIC) -->
                <div class="sp-chat-header">
                    <div class="sp-chat-header-left">
                        <button class="sp-chat-icon-btn" onclick="window.ChatView.backToInbox('${isEvent ? 'events' : 'direct'}')" title="Volver">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        ${avatarHtml}
                        <div class="sp-chat-header-title-wrap">
                            <h2 class="sp-chat-header-title">${this.escapeHtml(title)}</h2>
                            <div class="sp-chat-header-sub">
                                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
                                ${this.escapeHtml(subTitle)}
                            </div>
                        </div>
                    </div>
                    <div class="sp-chat-header-actions">
                        ${detailsBtnHtml}
                        ${(!isEvent && !isGeneral) ? `
                        <button class="sp-chat-icon-btn" 
                                onclick="window.ChatView.confirmDeleteChat('${chatData.id}', '${this.escapeHtml(title)}')" 
                                title="Eliminar conversación"
                                style="color: #ef4444;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        ` : ''}
                        <button class="sp-chat-icon-btn" onclick="window.ChatView.close()" title="Cerrar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- CUERPO DE MENSAJES -->
                <div class="sp-chat-room-body">
                    <div class="sp-chat-messages-area" id="sp-chat-messages-container">
                        <div style="text-align:center; padding: 40px 20px; color:#64748b;">
                            <i class="fas fa-circle-notch fa-spin fa-2x" style="color:#0f172a;"></i>
                            <div style="margin-top:12px; font-size:0.82rem; font-weight:700;">Cargando mensajes...</div>
                        </div>
                    </div>

                    <!-- BARRA DE ESCRITURA INFERIOR FIJA (DOCKED) -->
                    <div class="sp-chat-dock">
                        <!-- Strip de archivo adjunto si lo hubiera -->
                        <div id="sp-chat-preview-strip" class="sp-chat-preview-strip" style="display: none;">
                            <img id="sp-chat-preview-thumb" class="sp-chat-preview-thumb" src="" alt="Preview">
                            <div class="sp-chat-preview-info">
                                <div style="font-weight: 800;">Foto adjunta</div>
                                <div style="font-size:0.65rem; color:#94a3b8;">Lista para enviar</div>
                            </div>
                            <button class="sp-chat-preview-remove" onclick="window.ChatView.clearAttachment()" title="Quitar">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- RESPUESTAS RÁPIDAS DE PÁDEL (PADEL QUICK CHIPS) -->
                        <div class="sp-chat-quick-replies">
                            <button type="button" class="sp-chat-quick-reply-chip" onclick="window.ChatView.insertQuickReply('🎾 ¡Nos vemos en la pista!')">
                                🎾 ¡Nos vemos en la pista!
                            </button>
                            <button type="button" class="sp-chat-quick-reply-chip" onclick="window.ChatView.insertQuickReply('💪 ¡Gran partido!')">
                                💪 ¡Gran partido!
                            </button>
                            <button type="button" class="sp-chat-quick-reply-chip" onclick="window.ChatView.insertQuickReply('⏱️ Llego en 5 min')">
                                ⏱️ Llego en 5 min
                            </button>
                            <button type="button" class="sp-chat-quick-reply-chip" onclick="window.ChatView.insertQuickReply('📍 ¿Qué pista tenemos?')">
                                📍 ¿Qué pista tenemos?
                            </button>
                            <button type="button" class="sp-chat-quick-reply-chip" onclick="window.ChatView.insertQuickReply('🔥 ¡Vamos con todo!')">
                                🔥 ¡Vamos con todo!
                            </button>
                            <button type="button" class="sp-chat-quick-reply-chip" onclick="window.ChatView.insertQuickReply('🤝 ¿Falta pareja?')">
                                🤝 ¿Falta pareja?
                            </button>
                        </div>

                        <!-- FILA DE ENTRADA -->
                        <div class="sp-chat-input-row">
                            <div class="sp-chat-input-container">
                                <input type="text" 
                                    id="sp-chat-text-input" 
                                    class="sp-chat-input" 
                                    placeholder="Escribir un mensaje..." 
                                    autocomplete="off" 
                                    onkeydown="if(event.key === 'Enter') window.ChatView.sendCurrentMessage()">
                                
                                <label class="sp-chat-attach-btn" title="Adjuntar foto">
                                    <i class="fas fa-camera"></i>
                                    <input type="file" 
                                        id="sp-chat-file-input" 
                                        accept="image/*" 
                                        style="display: none;" 
                                        onchange="window.ChatView.handleFileInput(this)">
                                </label>
                            </div>

                            <button class="sp-chat-send-btn" 
                                id="sp-chat-send-button" 
                                onclick="window.ChatView.sendCurrentMessage()" 
                                title="Enviar mensaje">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Suscribir a mensajes en tiempo real
            this.subscribeToRoomMessages(this.activeChatId);
        }

        insertQuickReply(text) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            const inputEl = document.getElementById('sp-chat-text-input');
            if (!inputEl) return;
            inputEl.value = (inputEl.value ? inputEl.value + ' ' : '') + text;
            inputEl.focus();
            try {
                inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
            } catch(e) {}
        }

        backToInbox(tab) {
            if (this.activeRoomUnsub) {
                this.activeRoomUnsub();
                this.activeRoomUnsub = null;
            }
            this.openInbox(tab || 'events');
        }

        navigateToEventDetails(eventId) {
            this.close();
            if (window.Router && typeof window.Router.navigate === 'function') {
                window.Router.navigate('entrenos');
            } else if (window.EventsController && typeof window.EventsController.openEventModal === 'function') {
                window.EventsController.openEventModal(eventId);
            }
        }

        subscribeToRoomMessages(chatId) {
            if (this.activeRoomUnsub) {
                this.activeRoomUnsub();
                this.activeRoomUnsub = null;
            }

            const container = document.getElementById('sp-chat-messages-container');
            if (!container) return;

            this.activeRoomUnsub = window.ChatService.subscribeToMessages(chatId, (messages) => {
                this.renderMessagesList(messages);
            });
        }

        renderMessagesList(messages) {
            const container = document.getElementById('sp-chat-messages-container');
            if (!container) return;

            const user = this.getCurrentUser();
            const myUid = user ? (user.id || user.uid) : null;
            const isViewerModerator = window.ChatService && typeof window.ChatService.hasModerationPrivileges === 'function'
                ? window.ChatService.hasModerationPrivileges(user)
                : ['superadmin', 'super_admin', 'admin', 'admin_player'].includes(String(user?.role || '').toLowerCase().trim());
            const isGeneral = this.activeChatId === 'event_general_somospadel' || this.activeChatId === 'general_somospadel' || this.activeChatData?.type === 'general';

            let welcomeBannerHtml = '';
            if (isGeneral) {
                welcomeBannerHtml = `
                    <div style="
                        background: linear-gradient(135deg, rgba(9, 14, 26, 0.95) 0%, rgba(23, 36, 60, 0.95) 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.4);
                        border-radius: 16px;
                        padding: 12px 14px;
                        margin: 6px auto 16px;
                        max-width: 95%;
                        color: #ffffff;
                        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), 0 0 10px rgba(204, 255, 0, 0.1);
                        text-align: center;
                    ">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
                            <span style="background: #CCFF00; color: #000; font-size: 0.58rem; font-weight: 950; padding: 2px 6px; border-radius: 5px; letter-spacing: 0.4px;">COMUNIDAD OFICIAL</span>
                            <span style="font-size: 0.82rem; font-weight: 950; color: #ffffff;">SOMOSPADEL BCN</span>
                        </div>
                        <div style="font-size: 0.73rem; color: #cbd5e1; line-height: 1.4;">
                            ¡Bienvenido a la pista social! 🎾 Habla con todos los jugadores, organiza partidos o busca suplentes.<br>
                            <span style="color: #CCFF00; font-weight: 700;">💡 Tip:</span> Toca la foto o nombre de cualquier jugador para ver su nivel o escribirle un privado.
                        </div>
                    </div>
                `;
            }

            if (!messages || messages.length === 0) {
                container.innerHTML = welcomeBannerHtml + `
                    <div class="sp-chat-empty" style="margin-top: 30px;">
                        <div class="sp-chat-empty-icon" style="color:#64748b; border-color:#cbd5e1; background:#f1f5f9;">
                            <i class="fas fa-comment-dots"></i>
                        </div>
                        <div class="sp-chat-empty-title">¡Sé el primero en escribir!</div>
                        <div class="sp-chat-empty-desc">Coordina con tus compañeros de partido o aclara cualquier detalle de la convocatoria.</div>
                    </div>
                `;
                return;
            }

            let html = welcomeBannerHtml;
            let lastDateLabel = '';

            messages.forEach(msg => {
                const dateLabel = this.formatDateLabel(msg.timestamp);
                if (dateLabel && dateLabel !== lastDateLabel) {
                    html += `
                        <div class="sp-chat-date-separator">
                            <span>${dateLabel}</span>
                        </div>
                    `;
                    lastDateLabel = dateLabel;
                }

                // Si es un aviso de sistema o broadcast
                if (msg.type === 'broadcast') {
                    html += `
                        <div class="sp-chat-system-notice">
                            <span class="sp-chat-system-notice-badge"><i class="fas fa-bullhorn"></i> AVISO DE ORGANIZACIÓN</span>
                            <div class="sp-chat-system-notice-text">${this.escapeHtml(msg.text)}</div>
                            <div class="sp-chat-msg-time" style="justify-content:center; margin-top:4px;">${this.formatTime(msg.timestamp)}</div>
                        </div>
                    `;
                    return;
                }

                const isMe = msg.senderId === myUid;
                const canDelete = isMe || isViewerModerator;
                const senderName = msg.senderName || 'Jugador';
                const timeStr = this.formatTime(msg.timestamp);
                const isAdmin = !!msg.isAdmin;
                const playerColor = isMe ? '#059669' : this.getPlayerColor(msg.senderId, senderName);
                const safeSenderName = this.escapeHtml(senderName);
                const safeSenderId = this.escapeHtml(String(msg.senderId || ''));
                const safeSenderAvatar = msg.senderAvatar ? this.escapeHtml(msg.senderAvatar) : '';
                const senderLevel = (msg.senderLevel !== undefined && msg.senderLevel !== null) 
                    ? parseFloat(msg.senderLevel).toFixed(1) 
                    : null;

                const levelBadgeHtml = senderLevel
                    ? `<span style="background: rgba(204,255,0,0.2); border: 1px solid rgba(204,255,0,0.5); color: #65a30d; font-size: 0.62rem; font-weight: 900; padding: 1px 5px; border-radius: 5px; letter-spacing: 0.2px;">⭐ ${senderLevel}</span>`
                    : '';

                const adminBadgeHtml = isAdmin
                    ? `<span style="background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; font-size: 0.58rem; font-weight: 900; padding: 1px 5px; border-radius: 5px; letter-spacing: 0.2px;"><i class="fas fa-shield-alt"></i> ADMIN</span>`
                    : '';

                const avatarHtml = !isMe
                    ? (msg.senderAvatar
                        ? `<div class="sp-chat-msg-avatar" onclick="window.ChatView.showPlayerQuickActions('${safeSenderId}', '${safeSenderName}', '${safeSenderAvatar}', '${senderLevel || ''}')" title="Ver jugador ${safeSenderName}" style="cursor: pointer;"><img src="${msg.senderAvatar}" alt="${safeSenderName}"></div>`
                        : `<div class="sp-chat-msg-avatar" onclick="window.ChatView.showPlayerQuickActions('${safeSenderId}', '${safeSenderName}', '', '${senderLevel || ''}')" title="Ver jugador ${safeSenderName}" style="color:${playerColor}; background:${playerColor}15; border-color:${playerColor}35; cursor: pointer;">${this.getInitials(senderName)}</div>`)
                    : '';

                const senderNameHtml = !isMe
                    ? `<div class="sp-chat-sender-name ${isAdmin ? 'admin' : ''}" 
                            onclick="window.ChatView.showPlayerQuickActions('${safeSenderId}', '${safeSenderName}', '${safeSenderAvatar}', '${senderLevel || ''}')"
                            title="Toca para ver perfil o enviar mensaje privado"
                            style="cursor: pointer; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-bottom: 3px; ${isAdmin ? 'color:#d97706;' : `color:${playerColor};`}">
                         <span style="font-weight: 850;">${safeSenderName}</span>
                         ${levelBadgeHtml}
                         ${adminBadgeHtml}
                       </div>`
                    : `<div class="sp-chat-sender-name self" style="color: #15803d; font-size: 0.66rem; font-weight: 800; margin-bottom: 2px; text-align: right;">
                         Tú
                       </div>`;

                const mediaHtml = msg.attachment
                    ? `<img class="sp-chat-msg-img" src="${msg.attachment}" alt="Adjunto" onclick="window.ChatView.openImageModal(this.src)">`
                    : '';

                html += `
                    <div class="sp-chat-msg-row ${isMe ? 'self' : 'other'}">
                        ${avatarHtml}
                        <div class="sp-chat-bubble">
                            ${senderNameHtml}
                            ${msg.text ? `<div class="sp-chat-msg-text">${this.escapeHtml(msg.text)}</div>` : ''}
                            ${mediaHtml}
                            <div class="sp-chat-msg-time" style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                                <span>${timeStr}</span>
                                ${canDelete ? `
                                <button class="sp-chat-msg-delete-btn ${isViewerModerator && !isMe ? 'sp-chat-msg-delete-btn--mod' : ''}" 
                                        onclick="event.stopPropagation(); window.ChatView.confirmDeleteMessage('${this.activeChatId}', '${msg.id}')" 
                                        title="${isViewerModerator && !isMe ? 'Eliminar mensaje (Moderación)' : 'Eliminar mensaje'}">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                                ` : ''}
                                ${isMe ? '<i class="fas fa-check" style="font-size:0.62rem; color:#16a34a;"></i>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            // Scroll automático al fondo
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }

        /**
         * Muestra una ventana modal flotante con opciones rápidas del jugador (Ver Perfil / Chat Privado)
         */
        showPlayerQuickActions(senderId, senderName, senderAvatar, senderLevel) {
            if (!senderId) return;
            const existing = document.getElementById('sp-player-action-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'sp-player-action-modal';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.68);
                backdrop-filter: blur(4px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.18s ease-out;
            `;

            const levelStr = senderLevel ? `Nivel ⭐ ${senderLevel}` : 'Jugador SomosPadel';
            const avatarImg = senderAvatar 
                ? `<img src="${senderAvatar}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #CCFF00; box-shadow: 0 4px 15px rgba(204,255,0,0.3);">`
                : `<div style="width: 64px; height: 64px; border-radius: 50%; background: #1e293b; border: 2px solid #CCFF00; color: #CCFF00; font-size: 1.4rem; font-weight: 900; display: flex; align-items: center; justify-content: center;">${this.getInitials(senderName)}</div>`;

            overlay.innerHTML = `
                <div style="
                    background: #0f172a;
                    border: 1.5px solid rgba(204, 255, 0, 0.45);
                    border-radius: 22px;
                    width: 100%;
                    max-width: 310px;
                    padding: 22px 18px 18px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.7), 0 0 25px rgba(204,255,0,0.18);
                    font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                    color: #fff;
                ">
                    <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                        ${avatarImg}
                    </div>
                    <div style="font-size: 1.05rem; font-weight: 950; color: #fff; margin-bottom: 3px;">
                        ${this.escapeHtml(senderName)}
                    </div>
                    <div style="display: inline-block; background: rgba(204, 255, 0, 0.12); color: #CCFF00; font-size: 0.72rem; font-weight: 900; padding: 3px 10px; border-radius: 8px; border: 1px solid rgba(204,255,0,0.35); margin-bottom: 18px;">
                        ${levelStr}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button id="btn-player-action-profile" style="
                            background: linear-gradient(135deg, #CCFF00 0%, #a3e635 100%);
                            color: #000;
                            border: none;
                            border-radius: 14px;
                            padding: 12px 16px;
                            font-size: 0.82rem;
                            font-weight: 950;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            cursor: pointer;
                            box-shadow: 0 4px 14px rgba(204,255,0,0.3);
                        ">
                            <i class="fas fa-id-card"></i> VER CARTA / PERFIL
                        </button>

                        <button id="btn-player-action-chat" style="
                            background: #1e293b;
                            color: #fff;
                            border: 1px solid rgba(255,255,255,0.15);
                            border-radius: 14px;
                            padding: 12px 16px;
                            font-size: 0.82rem;
                            font-weight: 800;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            cursor: pointer;
                        ">
                            <i class="fas fa-comment-dots" style="color: #38bdf8;"></i> ENVIAR MENSAJE PRIVADO
                        </button>

                        <button id="btn-player-action-cancel" style="
                            background: transparent;
                            color: #94a3b8;
                            border: none;
                            padding: 8px;
                            font-size: 0.75rem;
                            font-weight: 700;
                            cursor: pointer;
                            margin-top: 4px;
                        ">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            document.getElementById('btn-player-action-cancel')?.addEventListener('click', () => overlay.remove());

            document.getElementById('btn-player-action-profile')?.addEventListener('click', () => {
                overlay.remove();
                if (window.PadelFutCard && typeof window.PadelFutCard.open === 'function') {
                    window.PadelFutCard.open({
                        id: senderId,
                        uid: senderId,
                        name: senderName,
                        photo_url: senderAvatar,
                        level: senderLevel ? parseFloat(senderLevel) : 3.5
                    });
                }
            });

            document.getElementById('btn-player-action-chat')?.addEventListener('click', () => {
                overlay.remove();
                this.openDirectChat({
                    id: senderId,
                    uid: senderId,
                    name: senderName,
                    photo_url: senderAvatar
                });
            });
        }

        /* ═══════════════════════════════════════════════════════════════
           7. ENVÍO DE MENSAJES & ADJUNTOS
           ═══════════════════════════════════════════════════════════════ */
        /**
         * Abre un lightbox flotante a pantalla completa para ver la foto adjunta.
         */
        openImageModal(src) {
            if (!src) return;
            const existing = document.getElementById('sp-chat-image-lightbox');
            if (existing) existing.remove();

            const lightbox = document.createElement('div');
            lightbox.id = 'sp-chat-image-lightbox';
            lightbox.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.92);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                padding: 20px;
                box-sizing: border-box;
                backdrop-filter: blur(8px);
                cursor: zoom-out;
            `;
            lightbox.innerHTML = `
                <div style="position: relative; max-width: 95vw; max-height: 90vh; display: flex; align-items: center; justify-content: center;" onclick="event.stopPropagation()">
                    <button style="position: absolute; top: -16px; right: -16px; background: #0f172a; color: #fff; border: 2px solid rgba(255,255,255,0.8); border-radius: 50%; width: 36px; height: 36px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5); z-index: 10;" onclick="document.getElementById('sp-chat-image-lightbox')?.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${src}" style="max-width: 92vw; max-height: 85vh; object-fit: contain; border-radius: 12px; box-shadow: 0 12px 35px rgba(0,0,0,0.7);" alt="Foto ampliada">
                </div>
            `;
            lightbox.onclick = () => lightbox.remove();
            document.body.appendChild(lightbox);
        }

        /**
         * Comprime y optimiza imágenes cliente mediante canvas para garantizar
         * que queden estrictamente por debajo del límite de Firestore (1 MB).
         */
        async compressImage(file, maxDimension = 1080, quality = 0.72) {
            return new Promise((resolve, reject) => {
                if (!file) return reject(new Error("No se ha proporcionado archivo"));

                // Fallback para entornos no-browser (Node.js tests)
                if (typeof document === 'undefined' || !document.createElement) {
                    return resolve("data:image/jpeg;base64,mockCompressedImage");
                }

                const reader = new FileReader();
                reader.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
                reader.onload = (e) => {
                    const img = new Image();
                    img.onerror = () => reject(new Error("El archivo no es una imagen compatible o válida."));
                    img.onload = () => {
                        try {
                            let width = img.width;
                            let height = img.height;

                            // Escalar proporcionalmente si excede el tamaño máximo
                            if (width > height) {
                                if (width > maxDimension) {
                                    height = Math.round(height * (maxDimension / width));
                                    width = maxDimension;
                                }
                            } else {
                                if (height > maxDimension) {
                                    width = Math.round(width * (maxDimension / height));
                                    height = maxDimension;
                                }
                            }

                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) {
                                return resolve(e.target.result);
                            }

                            ctx.drawImage(img, 0, 0, width, height);

                            let currentQuality = quality;
                            let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

                            // Límite seguro para Firestore: máximo ~650 KB (aprox 650000 caracteres base64)
                            const MAX_SAFE_LENGTH = 650000;
                            let attempts = 0;

                            while (dataUrl.length > MAX_SAFE_LENGTH && attempts < 3) {
                                attempts++;
                                currentQuality -= 0.15;
                                if (currentQuality < 0.3) {
                                    canvas.width = Math.round(canvas.width * 0.75);
                                    canvas.height = Math.round(canvas.height * 0.75);
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    currentQuality = 0.6;
                                }
                                dataUrl = canvas.toDataURL('image/jpeg', Math.max(0.25, currentQuality));
                            }

                            resolve(dataUrl);
                        } catch (err) {
                            reject(err);
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        async handleFileInput(input) {
            const file = input?.files?.[0];
            if (!file) return;

            // Soporta fotos de cámara de móvil de hasta 20 MB optimizándolas
            if (file.size > 20 * 1024 * 1024) {
                alert("La foto seleccionada supera los 20 MB. Selecciona una imagen más ligera.");
                if (input) input.value = '';
                return;
            }

            const strip = document.getElementById('sp-chat-preview-strip');
            const thumb = document.getElementById('sp-chat-preview-thumb');

            // Feedback visual inmediato
            if (strip && thumb) {
                thumb.src = '';
                thumb.style.opacity = '0.35';
                strip.style.display = 'flex';
                const infoEl = strip.querySelector('.sp-chat-preview-info');
                if (infoEl) {
                    infoEl.innerHTML = `
                        <div style="font-weight: 800; color: #0f172a;"><i class="fas fa-spinner fa-spin"></i> Optimizando imagen...</div>
                        <div style="font-size:0.65rem; color:#64748b;">Ajustando para envío ultra rápido</div>
                    `;
                }
            }

            try {
                const compressedDataUrl = await this.compressImage(file);
                this.pendingAttachment = {
                    type: 'image',
                    data: compressedDataUrl
                };

                if (strip && thumb) {
                    thumb.src = compressedDataUrl;
                    thumb.style.opacity = '1';
                    const infoEl = strip.querySelector('.sp-chat-preview-info');
                    if (infoEl) {
                        infoEl.innerHTML = `
                            <div style="font-weight: 800; color: #0f172a;">Foto adjunta</div>
                            <div style="font-size:0.65rem; color:#10b981; font-weight:700;">✓ Optimizada y lista para enviar</div>
                        `;
                    }
                }
            } catch (err) {
                console.error("[ChatView] Error optimizando foto:", err);
                alert("No se pudo procesar la imagen: " + (err.message || "Formato no válido"));
                this.clearAttachment();
            }
        }

        clearAttachment() {
            this.pendingAttachment = null;
            const strip = document.getElementById('sp-chat-preview-strip');
            if (strip) {
                strip.style.display = 'none';
                const thumb = document.getElementById('sp-chat-preview-thumb');
                if (thumb) {
                    thumb.src = '';
                    thumb.style.opacity = '1';
                }
                const infoEl = strip.querySelector('.sp-chat-preview-info');
                if (infoEl) {
                    infoEl.innerHTML = `
                        <div style="font-weight: 800;">Foto adjunta</div>
                        <div style="font-size:0.65rem; color:#94a3b8;">Lista para enviar</div>
                    `;
                }
            }
            const fileInput = document.getElementById('sp-chat-file-input');
            if (fileInput) fileInput.value = '';
        }

        async sendCurrentMessage() {
            const input = document.getElementById('sp-chat-text-input');
            const text = input ? input.value.trim() : '';
            const media = this.pendingAttachment;

            if (!text && !media) return;
            if (!this.activeChatId) return;

            const sendBtn = document.getElementById('sp-chat-send-button');
            if (sendBtn) sendBtn.disabled = true;

            try {
                if (input) input.value = '';
                this.clearAttachment();

                const res = await window.ChatService.sendMessage(this.activeChatId, text, media);
                if (!res.success) {
                    console.error("Error al enviar mensaje:", res.error);
                    alert("No se pudo enviar el mensaje: " + (res.error || "Error desconocido"));
                }
            } catch (err) {
                console.error("Error al enviar mensaje:", err);
                alert("Error al enviar el mensaje: " + (err.message || "Comprueba tu conexión"));
            } finally {
                if (sendBtn) sendBtn.disabled = false;
                if (input) input.focus();
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           7.5 ELIMINACIÓN DE CHATS Y MENSAJES
           ═══════════════════════════════════════════════════════════════ */
        /**
         * Confirmación y eliminación de una conversación completa
         * @param {string} chatId - ID del documento del chat
         * @param {string} title - Nombre del interlocutor o evento
         */
        async confirmDeleteChat(chatId, title = 'este chat') {
            if (!chatId) return;

            const safeTitle = title || 'esta conversación';
            const ok = window.confirm(`¿Seguro que deseas eliminar la conversación con "${safeTitle}"?\n\nSe borrarán todos los mensajes de este chat.`);
            if (!ok) return;

            try {
                if (typeof window.PlayerView?.haptic === 'function') window.PlayerView.haptic(30);

                const res = await window.ChatService.deleteChat(chatId);
                if (res && res.success) {
                    // Si estábamos dentro de este chat, volvemos a la bandeja
                    if (this.activeView === 'room' && this.activeChatId === chatId) {
                        this.backToInbox(this.activeTab || 'direct');
                    } else {
                        // Forzar refresco inmediato de la lista excluyendo el chat borrado
                        this.currentChats = (this.currentChats || []).filter(c => c.id !== chatId);
                        this.renderInboxList();
                    }
                } else {
                    alert("No se pudo eliminar la conversación: " + (res?.error || "Error desconocido"));
                }
            } catch (err) {
                console.error("[ChatView] Error al eliminar chat:", err);
                alert("Error al eliminar la conversación: " + err.message);
            }
        }

        /**
         * Confirmación y eliminación de un mensaje individual
         * @param {string} chatId - ID del chat
         * @param {string} messageId - ID del mensaje
         */
        async confirmDeleteMessage(chatId, messageId) {
            if (!chatId || !messageId) return;

            const ok = window.confirm("¿Deseas eliminar este mensaje?");
            if (!ok) return;

            try {
                if (typeof window.PlayerView?.haptic === 'function') window.PlayerView.haptic(20);

                const res = await window.ChatService.deleteMessage(chatId, messageId);
                if (!res || !res.success) {
                    alert("No se pudo eliminar el mensaje: " + (res?.error || "Error desconocido"));
                }
            } catch (err) {
                console.error("[ChatView] Error al eliminar mensaje:", err);
                alert("Error al eliminar el mensaje: " + err.message);
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           8. HELPERS & EMBEDDED BUTTONS
           ═══════════════════════════════════════════════════════════════ */
        /**
         * Retorna un botón elegante de chat para insertar en tarjetas de partidos/entrenos/americanas
         * @param {Object} eventData - Datos del evento ({ id, title, date, category, ... })
         * @returns {string} HTML string del botón
         */
        renderChatButton(eventData) {
            if (!eventData) return '';
            const rawId = eventData.eventId || eventData.id;
            if (!rawId) return '';
            const eventId = String(rawId);
            const safeKey = eventId.replace(/['"\\]/g, '');

            // Registramos en memoria para acceso seguro sin fallos de comillas HTML
            window._spEventChatRegistry[eventId] = eventData;
            if (safeKey !== eventId) {
                window._spEventChatRegistry[safeKey] = eventData;
            }

            return `
                <button type="button" 
                    class="sp-chat-btn" 
                    data-chat-event-id="${this.escapeHtml(eventId)}"
                    onclick="event.stopPropagation(); window.ChatView.openEventChat(window._spEventChatRegistry['${safeKey}'])" 
                    title="Abrir chat del partido">
                    <i class="fas fa-comment-dots"></i>
                    <span>Chat del partido</span>
                </button>
            `;
        }

        /* ═══════════════════════════════════════════════════════════════
           9. COMPATIBILIDAD CON VISTAS LEGACY
           ═══════════════════════════════════════════════════════════════ */
        async init(eventId, eventName, category = 'open', participantIds = []) {
            return this.openEventChat({
                id: eventId,
                title: eventName,
                category: category,
                participants: participantIds
            });
        }

        toggle() {
            const backdrop = document.getElementById('sp-chat-backdrop');
            if (backdrop && backdrop.classList.contains('active')) {
                this.close();
            } else {
                this.openInbox();
            }
        }

        destroy() {
            this.close();
        }

        /* ═══════════════════════════════════════════════════════════════
           10. UTILIDADES FORMATO, COLORES & SANITIZACIÓN
           ═══════════════════════════════════════════════════════════════ */
        getPlayerColor(id, name) {
            const palette = [
                '#2563eb', // Royal Blue
                '#7c3aed', // Púrpura / Violeta
                '#059669', // Verde Esmeralda
                '#d97706', // Ámbar / Naranja oscuro
                '#db2777', // Fucsia / Deep Pink
                '#0891b2', // Cian oscuro
                '#ea580c', // Naranja fuego
                '#4f46e5', // Índigo moderno
                '#0d9488', // Teal
                '#c026d3', // Violeta brillante
                '#b91c1c', // Rojo carmesí
                '#0284c7'  // Azul cielo oscuro
            ];
            const key = String(id || name || 'player').trim();
            let hash = 0;
            for (let i = 0; i < key.length; i++) {
                hash = (hash << 5) - hash + key.charCodeAt(i);
                hash |= 0;
            }
            const index = Math.abs(hash) % palette.length;
            return palette[index];
        }

        formatTime(timestamp) {
            if (!timestamp) return '';
            let date;
            if (typeof timestamp.toMillis === 'function') date = new Date(timestamp.toMillis());
            else if (timestamp instanceof Date) date = timestamp;
            else if (typeof timestamp === 'number') date = new Date(timestamp);
            else return '';

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        formatDateLabel(timestamp) {
            if (!timestamp) return '';
            let date;
            if (typeof timestamp.toMillis === 'function') date = new Date(timestamp.toMillis());
            else if (timestamp instanceof Date) date = timestamp;
            else if (typeof timestamp === 'number') date = new Date(timestamp);
            else return '';

            const today = new Date();
            const isToday = today.toDateString() === date.toDateString();
            if (isToday) return 'Hoy';

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.toDateString() === date.toDateString()) return 'Ayer';

            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }

        formatEventDate(dateStr) {
            if (!dateStr) return '';
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                }
            } catch (e) { }
            return String(dateStr);
        }

        getInitials(name) {
            if (!name) return 'SP';
            const parts = name.trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }

        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    }

    // Instancia Global
    window.ChatView = new ChatView();

    // Handler global universal para abrir chat privado 1 a 1 desde cualquier punto de la app
    window.openDirectChatWithPlayer = async function (playerOrId, e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        // 1. Cerrar cualquier modal que pudiera estar activo (carta FUT, quick actions, etc.)
        const futModal = document.getElementById('padel-fut-card-modal');
        if (futModal) futModal.remove();
        const actionModal = document.getElementById('sp-player-action-modal');
        if (actionModal) actionModal.remove();

        let targetId = playerOrId;
        if (playerOrId && (typeof playerOrId.stopPropagation === 'function' || playerOrId.target)) {
            targetId = playerOrId.currentTarget?.dataset?.playerId || playerOrId.target?.dataset?.playerId || null;
        }

        if (!targetId) return;

        try {
            let targetUid = null;
            let targetName = null;
            let targetPhoto = null;
            let targetLevel = null;

            if (typeof targetId === 'string') {
                targetUid = targetId.trim();
            } else if (targetId && typeof targetId === 'object') {
                targetUid = targetId.id || targetId.uid || targetId.userId;
                targetName = targetId.name || targetId.displayName;
                targetPhoto = targetId.photo_url || targetId.photoURL || targetId.avatar || targetId.photoUrl;
                targetLevel = targetId.level || targetId.nivel;
            }

            if (!targetUid) return;

            // Si PadelFutCard tiene datos en memoria del jugador actual
            if (window.PadelFutCard?.currentData && (window.PadelFutCard.currentData.userId === targetUid || !targetName)) {
                const cd = window.PadelFutCard.currentData;
                targetName = targetName || cd.name;
                targetPhoto = targetPhoto || cd.photoUrl;
                targetLevel = targetLevel || cd.level;
            }

            // Si faltan datos, buscar en los cachés globales de la app
            if (!targetName || !targetPhoto) {
                const cached = (window.allUsersCache || []).find(u => (u.id === targetUid || u.uid === targetUid)) ||
                               (window.ChatService?._playersCache || []).find(p => (p.id === targetUid || p.uid === targetUid)) ||
                               (window._currentInscritosPlayersMap && window._currentInscritosPlayersMap[targetUid]) ||
                               (window.EventsController?.state?.users?.find?.(u => (u.id === targetUid || u.uid === targetUid)));
                if (cached) {
                    targetName = targetName || cached.name || cached.displayName || 'Jugador';
                    targetPhoto = targetPhoto || cached.photo_url || cached.photoURL || cached.avatar;
                    targetLevel = targetLevel || cached.level || cached.nivel;
                }
            }

            const targetPayload = {
                id: targetUid,
                uid: targetUid,
                name: targetName || 'Jugador',
                photo_url: targetPhoto || null,
                level: targetLevel || 3.5
            };

            if (typeof window.PlayerView?.haptic === 'function') window.PlayerView.haptic(20);

            if (window.ChatView && typeof window.ChatView.openDirectChat === 'function') {
                await window.ChatView.openDirectChat(targetPayload);
            } else {
                console.warn("[openDirectChatWithPlayer] ChatView no inicializado");
                alert("El chat de SomosPadel se está cargando. Inténtalo de nuevo en unos segundos.");
            }
        } catch (err) {
            console.error("❌ Error en openDirectChatWithPlayer:", err);
        }
    };
})();
