/**
 * SocialChannelsService.js
 * Servicio Oficial de Canales, Redes Sociales y Gamificación Social de SomosPadel Barcelona.
 * Gestiona enlaces, apertura optimizada para PWA/móvil, Reto "Embajador del Club" (+150 XP)
 * y modales de promoción e insignias.
 */

(function (global) {
    'use strict';

    const SocialChannelsService = {
        config: {
            instagram: {
                handle: '@somospadelbarcelona_',
                name: 'Instagram Oficial',
                url: 'https://www.instagram.com/somospadelbarcelona_/?hl=es',
                nativeUrl: 'instagram://user?username=somospadelbarcelona_',
                badge: 'FOTOS & STORIES',
                desc: 'Fotos de las americanas, podios, mejores puntos y reels.'
            },
            facebook: {
                name: 'Facebook Oficial',
                handle: 'Somos Padel Barcelona',
                url: 'https://www.facebook.com/?locale=es_ES',
                badge: 'COMUNIDAD',
                desc: 'Álbumes de torneos, actualidad del club y eventos.'
            },
            whatsapp: {
                number: '+34 649 21 93 50',
                url: 'https://wa.me/34649219350?text=Hola%20SomosPadel%20BCN!%20Tengo%20una%20consulta%20sobre%20las%20americanas%20y%20partidas.'
            },
            reward: {
                badgeId: 'embajador_social',
                badgeTitle: 'Embajador del Club',
                badgeIcon: '⭐',
                xp: 150
            },
            contest: {
                title: 'El Puntazo y la Foto del Mes',
                prize: '🎾 Americana Gratis con #SomosPadelBCN',
                deadline: 'Fin de mes',
                hashtag: '#SomosPadelBCN',
                tag: '@somospadelbarcelona_',
                desc: '¡Sube tu foto o vídeo en la pista, menciónanos y gana una americana gratis cada mes!'
            }
        },

        // Estado transitorio del flujo de seguimiento
        _questState: {
            instagramDone: false,
            facebookDone: false
        },

        getCurrentUser() {
            try {
                let user = global.Store ? global.Store.getState('currentUser') : null;
                if (!user) {
                    const cached = localStorage.getItem('currentUser') || localStorage.getItem('adminUser');
                    if (cached) user = JSON.parse(cached);
                }
                return user;
            } catch (e) {
                return null;
            }
        },

        isAmbassadorClaimed() {
            const user = this.getCurrentUser();
            const uid = user ? (user.uid || user.id) : 'guest';
            try {
                if (user && (user.socialAmbassador || user.social_ambassador)) return true;
                const local = localStorage.getItem(`sp_social_claimed_${uid}`) || localStorage.getItem('sp_social_claimed_guest');
                return !!local;
            } catch (e) {
                return false;
            }
        },

        openInstagram(fromQuest = false) {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(15);
            if (fromQuest) {
                this._questState.instagramDone = true;
                this._updateQuestUI();
            }
            window.open(this.config.instagram.url, '_blank', 'noopener,noreferrer');
        },

        openFacebook(fromQuest = false) {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(15);
            if (fromQuest) {
                this._questState.facebookDone = true;
                this._updateQuestUI();
            }
            window.open(this.config.facebook.url, '_blank', 'noopener,noreferrer');
        },

        openWhatsApp() {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(15);
            window.open(this.config.whatsapp.url, '_blank', 'noopener,noreferrer');
        },

        copyTag(btn) {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(20);
            const tag = this.config.instagram.handle;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(tag).then(() => {
                    this._showCopyFeedback(btn, '¡Copiado!');
                }).catch(() => {
                    this._fallbackCopy(tag, btn);
                });
            } else {
                this._fallbackCopy(tag, btn);
            }
        },

        _fallbackCopy(text, btn) {
            const temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            try {
                document.execCommand('copy');
                this._showCopyFeedback(btn, '¡Copiado!');
            } catch (e) {
                this._showCopyFeedback(btn, text);
            }
            document.body.removeChild(temp);
        },

        _showCopyFeedback(btn, text) {
            if (!btn) return;
            const original = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-check"></i> ${text}`;
            btn.style.background = '#00E36D';
            btn.style.color = '#000000';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        },

        _updateQuestUI() {
            const igStep = document.getElementById('quest-step-ig');
            const fbStep = document.getElementById('quest-step-fb');
            const claimBtn = document.getElementById('btn-claim-social-reward');

            if (igStep && this._questState.instagramDone) {
                igStep.innerHTML = `<i class="fas fa-check-circle" style="color: #00E36D; font-size: 1.25rem;"></i>`;
            }
            if (fbStep && this._questState.facebookDone) {
                fbStep.innerHTML = `<i class="fas fa-check-circle" style="color: #00E36D; font-size: 1.25rem;"></i>`;
            }

            if (claimBtn) {
                claimBtn.removeAttribute('disabled');
                claimBtn.style.opacity = '1';
                claimBtn.style.pointerEvents = 'auto';
                claimBtn.style.animation = 'neon-pulse 1.8s infinite ease-in-out';
                claimBtn.innerHTML = `
                    <i class="fas fa-gift" style="font-size: 1.1rem;"></i>
                    <span>¡RECLAMAR INSIGNIA & +150 XP!</span>
                `;
            }
        },

        /**
         * Reclama la insignia oficial de Embajador y otorga XP
         */
        async claimSocialReward(btn) {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(35);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Desbloqueando...`;
            }

            const user = this.getCurrentUser();
            const uid = user ? (user.uid || user.id) : 'guest';
            const badge = {
                id: this.config.reward.badgeId,
                title: this.config.reward.badgeTitle,
                description: 'Seguidor oficial de SomosPadel en Instagram y Facebook.',
                icon: this.config.reward.badgeIcon,
                tier: 'gold',
                xp: this.config.reward.xp
            };

            try {
                // 1. Guardar en localStorage
                localStorage.setItem(`sp_social_claimed_${uid}`, 'true');
                localStorage.setItem('sp_social_claimed_guest', 'true');

                // 2. Si hay AchievementsService, otorgar XP directamente
                if (global.AchievementsService && typeof global.AchievementsService.awardBonusXp === 'function') {
                    await global.AchievementsService.awardBonusXp(uid, badge.xp, 'Insignia Embajador del Club', { badgeId: badge.id });
                }

                // 3. Notificar desbloqueo con fanfarria si AchievementsService soporta notificación
                if (global.AchievementsService && typeof global.AchievementsService.notifyUnlocked === 'function') {
                    global.AchievementsService.notifyUnlocked(badge, user || { name: 'Jugador Pro' });
                }

                // 4. Sincronizar con Firestore si está conectado
                if (user && uid !== 'guest' && global.db) {
                    try {
                        const updateData = {
                            socialAmbassador: true,
                            socialAmbassadorDate: new Date().toISOString()
                        };
                        if (global.firebase?.firestore?.FieldValue?.arrayUnion) {
                            updateData.badges = global.firebase.firestore.FieldValue.arrayUnion(badge.id);
                        }
                        await global.db.collection('users').doc(uid).set(updateData, { merge: true });
                    } catch (fsErr) {
                        console.warn('[SocialChannelsService] Sync Firestore pasivo:', fsErr);
                    }
                }

                // 5. Actualizar UI del modal a estado reclamado
                this._renderClaimedSuccess();

                // 6. Lanzar evento global para que el perfil o dashboard actualice las insignias
                window.dispatchEvent(new CustomEvent('onAchievementUnlocked', {
                    detail: { badge, user: user || { name: 'Jugador Pro' }, isNew: true }
                }));

            } catch (err) {
                console.error('[SocialChannelsService] Error reclamando recompensa:', err);
                this._renderClaimedSuccess();
            }
        },

        _renderClaimedSuccess() {
            const body = document.getElementById('sp-social-modal-body');
            if (!body) return;

            body.innerHTML = `
                <div style="text-align: center; padding: 15px 10px; animation: floatUp 0.35s ease-out;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(204, 255, 0, 0.25) 0%, rgba(204, 255, 0, 0.05) 70%);
                        border: 2px solid #CCFF00;
                        color: #CCFF00;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.4rem;
                        margin: 0 auto 16px auto;
                        box-shadow: 0 0 30px rgba(204,255,0,0.4);
                        animation: neon-pulse 1.8s infinite ease-in-out;
                    ">
                        ⭐
                    </div>

                    <div style="
                        display: inline-block;
                        background: #CCFF00;
                        color: #000;
                        font-weight: 950;
                        font-size: 0.68rem;
                        padding: 4px 12px;
                        border-radius: 12px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        margin-bottom: 8px;
                    ">
                        ¡RETO COMPLETADO!
                    </div>

                    <h3 style="margin: 0 0 6px 0; font-size: 1.4rem; font-weight: 950; color: #ffffff;">
                        Insignia Desbloqueada
                    </h3>
                    <div style="font-size: 1rem; font-weight: 900; color: #CCFF00; margin-bottom: 6px;">
                        ⭐ EMBAJADOR DEL CLUB
                    </div>
                    <p style="font-size: 0.82rem; color: #cbd5e1; margin: 0 0 16px 0; line-height: 1.4;">
                        ¡Has sumado <strong style="color: #CCFF00;">+150 XP</strong> a tu ficha de jugador! Ya formas parte del círculo oficial de SomosPadel Barcelona.
                    </p>

                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 12px;
                        margin-bottom: 20px;
                        font-size: 0.76rem;
                        color: #94a3b8;
                    ">
                        Esta insignia lucirá en tu <strong>Carta de Jugador</strong> y en tu muro de trofeos.
                    </div>

                    <button type="button" onclick="window.SocialChannelsService.closeSocialHubModal()" style="
                        width: 100%;
                        background: #CCFF00;
                        color: #0a192f;
                        border: none;
                        padding: 14px;
                        border-radius: 14px;
                        font-weight: 950;
                        font-size: 0.88rem;
                        cursor: pointer;
                        box-shadow: 0 6px 20px rgba(204,255,0,0.3);
                    ">
                        ¡GENIAL, VOLVER A LA PISTA! 🎾
                    </button>
                </div>
            `;
        },

        /**
         * Modal interactivo principal con el Reto y Enlaces
         */
        openSocialHubModal() {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(20);
            let modal = document.getElementById('sp-social-hub-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'sp-social-hub-modal';
                modal.className = 'sp-social-modal-overlay';
                modal.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(10, 15, 29, 0.88);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.25s ease;
                `;
                document.body.appendChild(modal);
            }

            const isClaimed = this.isAmbassadorClaimed();

            modal.innerHTML = `
                <div class="sp-social-modal-box" style="
                    background: linear-gradient(180deg, #10192d 0%, #0a0f1d 100%);
                    border: 1.5px solid rgba(204, 255, 0, 0.35);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 450px;
                    padding: 24px 20px;
                    color: #ffffff;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(204,255,0,0.15);
                    position: relative;
                    animation: floatUp 0.3s ease-out;
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <!-- Close button -->
                    <button type="button" onclick="window.SocialChannelsService.closeSocialHubModal()" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 36px;
                        height: 36px;
                        border-radius: 12px;
                        background: rgba(255,255,255,0.08);
                        border: 1px solid rgba(255,255,255,0.15);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 1rem;
                        z-index: 10;
                    ">
                        <i class="fas fa-times"></i>
                    </button>

                    <div id="sp-social-modal-body">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 18px;">
                            <div style="
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                background: rgba(204, 255, 0, 0.15);
                                color: #CCFF00;
                                border: 1px solid rgba(204, 255, 0, 0.4);
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 0.68rem;
                                font-weight: 900;
                                letter-spacing: 1px;
                                margin-bottom: 8px;
                            ">
                                <i class="fas fa-trophy"></i> RETO SOCIAL DEL CLUB
                            </div>
                            <h3 style="margin: 0; font-size: 1.35rem; font-weight: 950; letter-spacing: -0.5px;">
                                Insignia de Seguidor Oficial
                            </h3>
                            <p style="margin: 6px 0 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">
                                Sigue a SomosPadel en Instagram y Facebook para ganar tu insignia dorada y sumar <strong style="color: #CCFF00;">+150 XP</strong>.
                            </p>
                        </div>

                        ${isClaimed ? `
                        <!-- ESTADO YA RECLAMADO -->
                        <div style="
                            background: rgba(204, 255, 0, 0.08);
                            border: 1.5px solid rgba(204, 255, 0, 0.4);
                            border-radius: 20px;
                            padding: 16px;
                            text-align: center;
                            margin-bottom: 16px;
                        ">
                            <span style="font-size: 2.2rem; display: block; margin-bottom: 4px;">⭐</span>
                            <div style="font-weight: 950; color: #CCFF00; font-size: 0.95rem;">INSIGNIA ACTIVA EN TU PERFIL</div>
                            <div style="font-size: 0.75rem; color: #e2e8f0; margin-top: 4px;">
                                ¡Eres Embajador Oficial del club! Ya has reclamado tus +150 XP.
                            </div>
                        </div>
                        ` : `
                        <!-- RETO PASO A PASO -->
                        <div style="
                            background: rgba(255, 255, 255, 0.03);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 20px;
                            padding: 14px;
                            margin-bottom: 16px;
                        ">
                            <div style="font-size: 0.7rem; font-weight: 900; color: #CCFF00; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;">
                                2 PASOS RÁPIDOS:
                            </div>

                            <!-- Paso 1: Instagram -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(225, 48, 108, 0.08); border: 1px solid rgba(225, 48, 108, 0.3); border-radius: 14px; margin-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                                    <div id="quest-step-ig">
                                        <i class="fab fa-instagram" style="color: #e1306c; font-size: 1.3rem;"></i>
                                    </div>
                                    <div style="min-width: 0;">
                                        <div style="font-weight: 900; font-size: 0.84rem; color: #fff;">1. Seguir en Instagram</div>
                                        <div style="font-size: 0.65rem; color: #ff9ebb;">@somospadelbarcelona_</div>
                                    </div>
                                </div>
                                <button type="button" onclick="window.SocialChannelsService.openInstagram(true)" style="background: linear-gradient(45deg, #e6683c, #cc2366); color: #fff; border: none; padding: 7px 12px; border-radius: 10px; font-weight: 900; font-size: 0.72rem; cursor: pointer;">
                                    Seguir ➔
                                </button>
                            </div>

                            <!-- Paso 2: Facebook -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(24, 119, 242, 0.08); border: 1px solid rgba(24, 119, 242, 0.3); border-radius: 14px;">
                                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                                    <div id="quest-step-fb">
                                        <i class="fab fa-facebook-f" style="color: #1877f2; font-size: 1.3rem;"></i>
                                    </div>
                                    <div style="min-width: 0;">
                                        <div style="font-weight: 900; font-size: 0.84rem; color: #fff;">2. Seguir en Facebook</div>
                                        <div style="font-size: 0.65rem; color: #93c5fd;">Somos Padel Barcelona</div>
                                    </div>
                                </div>
                                <button type="button" onclick="window.SocialChannelsService.openFacebook(true)" style="background: #1877f2; color: #fff; border: none; padding: 7px 12px; border-radius: 10px; font-weight: 900; font-size: 0.72rem; cursor: pointer;">
                                    Seguir ➔
                                </button>
                            </div>

                            <!-- Botón Reclamar -->
                            <button type="button" id="btn-claim-social-reward" onclick="window.SocialChannelsService.claimSocialReward(this)" style="
                                width: 100%;
                                margin-top: 14px;
                                background: #CCFF00;
                                color: #000;
                                border: none;
                                padding: 14px;
                                border-radius: 14px;
                                font-weight: 1000;
                                font-size: 0.85rem;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                box-shadow: 0 4px 16px rgba(204,255,0,0.3);
                                transition: all 0.2s;
                            ">
                                <i class="fas fa-gift"></i>
                                <span>¡RECLAMAR INSIGNIA & +150 XP!</span>
                            </button>
                        </div>
                        `}

                        <!-- Redes Cards Clásicas para Navegación -->
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                            <div onclick="window.SocialChannelsService.openInstagram()" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(225,48,108,0.3); border-radius: 16px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem;">
                                        <i class="fab fa-instagram"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 900; font-size: 0.85rem; color: #fff;">Visitar Perfil de Instagram</div>
                                        <div style="font-size: 0.65rem; color: #94a3b8;">Ver fotos, stories de torneos y reels</div>
                                    </div>
                                </div>
                                <i class="fas fa-external-link-alt" style="color: #ff6492; font-size: 0.75rem;"></i>
                            </div>

                            <div onclick="window.SocialChannelsService.openFacebook()" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(24,119,242,0.3); border-radius: 16px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 34px; height: 34px; border-radius: 10px; background: #1877f2; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem;">
                                        <i class="fab fa-facebook-f"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 900; font-size: 0.85rem; color: #fff;">Visitar Página de Facebook</div>
                                        <div style="font-size: 0.65rem; color: #94a3b8;">Álbumes oficiales y crónicas del club</div>
                                    </div>
                                </div>
                                <i class="fas fa-external-link-alt" style="color: #60a5fa; font-size: 0.75rem;"></i>
                            </div>
                        </div>

                        <!-- Mención y Tag -->
                        <div style="
                            background: rgba(255, 255, 255, 0.04);
                            border: 1px dashed rgba(204, 255, 0, 0.4);
                            border-radius: 16px;
                            padding: 10px 14px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 10px;
                        ">
                            <div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">ETIQUÉTANOS EN TUS STORIES</div>
                                <div style="font-size: 0.82rem; font-weight: 900; color: #CCFF00;">@somospadelbarcelona_</div>
                            </div>
                            <button type="button" onclick="window.SocialChannelsService.copyTag(this)" style="
                                background: rgba(204, 255, 0, 0.15);
                                color: #CCFF00;
                                border: 1px solid #CCFF00;
                                padding: 6px 12px;
                                border-radius: 10px;
                                font-size: 0.7rem;
                                font-weight: 900;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
        },

        closeSocialHubModal() {
            const modal = document.getElementById('sp-social-hub-modal');
            if (modal) {
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
            }
        },

        /**
         * Modal interactivo del Concurso Mensual "El Puntazo & Foto del Mes"
         */
        openContestModal() {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(20);
            let modal = document.getElementById('sp-contest-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'sp-contest-modal';
                modal.className = 'sp-contest-modal-overlay';
                modal.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(10, 15, 29, 0.88);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.25s ease;
                `;
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div class="sp-contest-modal-box" style="
                    background: linear-gradient(180deg, #131b2e 0%, #0a0e1a 100%);
                    border: 1.5px solid rgba(225, 48, 108, 0.45);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 440px;
                    padding: 24px 20px;
                    color: #ffffff;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 35px rgba(225,48,108,0.25);
                    position: relative;
                    animation: floatUp 0.3s ease-out;
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <!-- Close button -->
                    <button type="button" onclick="window.SocialChannelsService.closeContestModal()" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 36px;
                        height: 36px;
                        border-radius: 12px;
                        background: rgba(255,255,255,0.08);
                        border: 1px solid rgba(255,255,255,0.15);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 1rem;
                    ">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            background: rgba(225, 48, 108, 0.15);
                            color: #ff6492;
                            border: 1px solid rgba(225, 48, 108, 0.4);
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 0.68rem;
                            font-weight: 900;
                            letter-spacing: 1px;
                            margin-bottom: 10px;
                        ">
                            <i class="fas fa-camera-retro"></i> CONCURSO MENSUAL OFICIAL
                        </div>
                        <h3 style="margin: 0; font-size: 1.35rem; font-weight: 950; letter-spacing: -0.5px;">
                            El Puntazo & La Foto del Mes
                        </h3>
                        <p style="margin: 6px 0 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">
                            ¡Sube tu foto o vídeo en la pista, menciónanos y gana premios oficiales del club!
                        </p>
                    </div>

                    <!-- Tarjeta del Premio -->
                    <div style="
                        background: linear-gradient(135deg, rgba(204, 255, 0, 0.12) 0%, rgba(204, 255, 0, 0.03) 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.4);
                        border-radius: 20px;
                        padding: 16px;
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        margin-bottom: 20px;
                    ">
                        <div style="
                            width: 52px;
                            height: 52px;
                            border-radius: 16px;
                            background: #CCFF00;
                            color: #000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.6rem;
                            flex-shrink: 0;
                            box-shadow: 0 4px 15px rgba(204,255,0,0.35);
                        ">
                            👕
                        </div>
                        <div style="min-width: 0;">
                            <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                                PREMIO DEL MES
                            </div>
                            <div style="font-size: 0.95rem; font-weight: 950; color: #ffffff; line-height: 1.2;">
                                Americana Gratis con #SomosPadelBCN
                            </div>
                            <div style="font-size: 0.7rem; color: #cbd5e1; margin-top: 2px;">
                                Se elegirá el mejor punto o foto al finalizar el mes.
                            </div>
                        </div>
                    </div>

                    <!-- 3 Pasos de Participación -->
                    <div style="
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 20px;
                        padding: 16px;
                        margin-bottom: 20px;
                    ">
                        <div style="font-size: 0.68rem; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                            ¿CÓMO PARTICIPAR? (3 PASOS FÁCILES):
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; gap: 10px; align-items: flex-start;">
                                <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 950; font-size: 0.72rem; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">1</span>
                                <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.35;">
                                    Haz una foto o graba un punto durante tu americana, entreno o tercer tiempo en el club.
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px; align-items: flex-start;">
                                <span style="background: rgba(225, 48, 108, 0.2); color: #ff6492; font-weight: 950; font-size: 0.72rem; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">2</span>
                                <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.35;">
                                    Súbelo a tu Instagram (Story, Post o Reel) mencionando a <strong style="color: #ff6492;">@somospadelbarcelona_</strong>.
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px; align-items: flex-start;">
                                <span style="background: rgba(204, 255, 0, 0.2); color: #CCFF00; font-weight: 950; font-size: 0.72rem; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">3</span>
                                <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.35;">
                                    Añade el hashtag oficial <strong style="color: #CCFF00;">#SomosPadelBCN</strong> en el texto o sticker.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Botón Principal: Copiar & Abrir Instagram -->
                    <button type="button" id="btn-participate-contest" onclick="window.SocialChannelsService.participateInContest(this)" style="
                        width: 100%;
                        background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
                        color: #ffffff;
                        border: none;
                        padding: 14px;
                        border-radius: 16px;
                        font-weight: 950;
                        font-size: 0.88rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        box-shadow: 0 6px 20px rgba(220,39,67,0.45);
                        margin-bottom: 12px;
                    ">
                        <i class="fab fa-instagram" style="font-size: 1.15rem;"></i>
                        <span>PARTICIPAR AHORA EN INSTAGRAM</span>
                    </button>

                    <button type="button" onclick="window.SocialChannelsService.closeContestModal()" style="
                        width: 100%;
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.15);
                        color: #94a3b8;
                        padding: 10px;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 800;
                        cursor: pointer;
                    ">
                        Cerrar
                    </button>
                </div>
            `;

            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
        },

        closeContestModal() {
            const modal = document.getElementById('sp-contest-modal');
            if (modal) {
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
            }
        },

        async participateInContest(btn) {
            if (global.PlayerView?.haptic) global.PlayerView.haptic(25);
            const tagAndHashtag = `${this.config.contest.tag} ${this.config.contest.hashtag}`;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(tagAndHashtag);
                }
            } catch (e) {}

            if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = `<i class="fas fa-check"></i> ¡Hashtag copiado! Abriendo...`;
                btn.style.background = '#00E36D';
                btn.style.color = '#000';
                setTimeout(() => {
                    btn.innerHTML = orig;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            }

            setTimeout(() => {
                this.openInstagram();
            }, 300);
        }
    };

    global.SocialChannelsService = SocialChannelsService;
    global.openClubInstagram = (fromQuest = false) => SocialChannelsService.openInstagram(fromQuest);
    global.openClubFacebook = (fromQuest = false) => SocialChannelsService.openFacebook(fromQuest);
    global.openSocialHubModal = () => SocialChannelsService.openSocialHubModal();
    global.claimSocialReward = (btn) => SocialChannelsService.claimSocialReward(btn);
    global.openSocialContestModal = () => SocialChannelsService.openContestModal();

})(window);

