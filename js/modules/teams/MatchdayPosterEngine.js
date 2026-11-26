/**
 * MatchdayPosterEngine.js - Motor Canvas 2D HD Nativo para Carteleras de Jornada
 * Genera carteles 1080x1920 (Stories 9:16) y 1080x1350 (WhatsApp/Feed 4:5) en <80ms.
 * Sin dependencias externas, sin fallos de CORS/memoria en móvil y 100% nítido.
 */
(function (global) {
    'use strict';

    const THEMES = {
        neon: {
            id: 'neon',
            label: 'Neón Pro',
            bgTop: '#070b14',
            bgBottom: '#111c33',
            glowA: 'rgba(204, 255, 0, 0.22)',
            glowB: 'rgba(56, 189, 248, 0.20)',
            gridColor: 'rgba(255, 255, 255, 0.035)',
            titleColor: '#ffffff',
            accent: '#ccff00',
            accentText: '#0f172a',
            subColor: '#94a3b8',
            cardBg: 'rgba(255, 255, 255, 0.075)',
            cardBorder: 'rgba(255, 255, 255, 0.14)',
            cardText: '#ffffff',
            cardMuted: '#cbd5e1',
            homeBg: 'rgba(16, 185, 129, 0.22)',
            homeText: '#34d399',
            awayBg: 'rgba(59, 130, 246, 0.24)',
            awayText: '#60a5fa',
            winBg: 'rgba(16, 185, 129, 0.24)',
            winText: '#34d399',
            lossBg: 'rgba(239, 68, 68, 0.24)',
            lossText: '#f87171',
            footerBg: 'rgba(204, 255, 0, 0.12)',
            footerText: '#ccff00'
        },
        light: {
            id: 'light',
            label: 'Blanco Club',
            bgTop: '#f8fafc',
            bgBottom: '#e2e8f0',
            glowA: 'rgba(16, 185, 129, 0.16)',
            glowB: 'rgba(2, 132, 199, 0.14)',
            gridColor: 'rgba(15, 23, 42, 0.04)',
            titleColor: '#0f172a',
            accent: '#0f172a',
            accentText: '#ccff00',
            subColor: '#475569',
            cardBg: '#ffffff',
            cardBorder: '#cbd5e1',
            cardText: '#0f172a',
            cardMuted: '#475569',
            homeBg: '#dcfce7',
            homeText: '#15803d',
            awayBg: '#dbeafe',
            awayText: '#1d4ed8',
            winBg: '#dcfce7',
            winText: '#15803d',
            lossBg: '#fee2e2',
            lossText: '#dc2626',
            footerBg: '#0f172a',
            footerText: '#ccff00'
        },
        gold: {
            id: 'gold',
            label: 'Oro Élite',
            bgTop: '#09090b',
            bgBottom: '#1c1917',
            glowA: 'rgba(250, 204, 21, 0.24)',
            glowB: 'rgba(245, 158, 11, 0.16)',
            gridColor: 'rgba(250, 204, 21, 0.04)',
            titleColor: '#ffffff',
            accent: '#facc15',
            accentText: '#09090b',
            subColor: '#a8a29e',
            cardBg: 'rgba(255, 255, 255, 0.06)',
            cardBorder: 'rgba(250, 204, 21, 0.25)',
            cardText: '#ffffff',
            cardMuted: '#d6d3d1',
            homeBg: 'rgba(250, 204, 21, 0.18)',
            homeText: '#fde047',
            awayBg: 'rgba(56, 189, 248, 0.20)',
            awayText: '#7dd3fc',
            winBg: 'rgba(16, 185, 129, 0.25)',
            winText: '#34d399',
            lossBg: 'rgba(239, 68, 68, 0.25)',
            lossText: '#f87171',
            footerBg: 'rgba(250, 204, 21, 0.15)',
            footerText: '#fde047'
        }
    };

    const FORMATS = {
        whatsapp: { id: 'whatsapp', label: 'WhatsApp 4:5', width: 1080, height: 1350 },
        story: { id: 'story', label: 'Stories 9:16', width: 1080, height: 1920 }
    };

    class MatchdayPosterEngine {
        constructor() {
            this.themes = THEMES;
            this.formats = FORMATS;
            this._logoPromise = null;
        }

        _loadLogo() {
            if (this._logoPromise) return this._logoPromise;
            this._logoPromise = new Promise((resolve) => {
                const tryLoad = (src, fallback) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = () => {
                        if (fallback) tryLoad(fallback, null);
                        else resolve(null);
                    };
                    img.src = src;
                };
                tryLoad('img/logo_somospadel.png', 'img/official_ball_logo.png');
            });
            return this._logoPromise;
        }

        _roundRect(ctx, x, y, w, h, r) {
            const radius = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + w, y, x + w, y + h, radius);
            ctx.arcTo(x + w, y + h, x, y + h, radius);
            ctx.arcTo(x, y + h, x, y, radius);
            ctx.arcTo(x, y, x + w, y, radius);
            ctx.closePath();
        }

        _fitText(ctx, text, maxWidth) {
            const str = String(text || '');
            if (ctx.measureText(str).width <= maxWidth) return str;
            let trimmed = str;
            while (trimmed.length > 3 && ctx.measureText(trimmed + '…').width > maxWidth) {
                trimmed = trimmed.slice(0, -1);
            }
            return trimmed + '…';
        }

        _shortTeamName(name) {
            return String(name || 'Equipo').replace(/SOMOS\s+P[AÁ]DEL\s*(BCN)?/i, '').trim() || name;
        }

        _getVenue(match) {
            const raw = match?.location || match?.venue || '';
            return String(raw).replace(/\s+\.$/, '').trim() || 'Club por definir';
        }

        _getResultInfo(match) {
            if (window.TeamView && typeof window.TeamView.getMatchResult === 'function') {
                return window.TeamView.getMatchResult(match);
            }
            return { valid: false };
        }

        /**
         * Recopila las entradas de partidos según el modo:
         * - 'upcoming': próximos partidos pendientes (si no hay ninguno, hace fallback a 'results')
         * - 'results': última jornada jugada de cada equipo
         */
        collectEntries(teams, mode = 'upcoming') {
            const list = Array.isArray(teams) ? teams : [];
            const upcoming = [];
            const results = [];

            list.forEach(team => {
                const sched = Array.isArray(team.schedule)
                    ? [...team.schedule].sort((a, b) => (parseInt(a.j, 10) || 0) - (parseInt(b.j, 10) || 0))
                    : [];

                const next = sched.find(m =>
                    (m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming') &&
                    m.opponent && !String(m.opponent).toUpperCase().includes('BYE')
                );
                if (next) {
                    upcoming.push({ team, match: next, type: 'upcoming' });
                }

                const completed = sched.filter(m =>
                    m.status === 'completed' && m.opponent && !String(m.opponent).toUpperCase().includes('BYE')
                );
                if (completed.length > 0) {
                    results.push({ team, match: completed[completed.length - 1], type: 'results' });
                }
            });

            if (mode === 'results') {
                return { effectiveMode: 'results', entries: results };
            }
            if (upcoming.length > 0) {
                return { effectiveMode: 'upcoming', entries: upcoming };
            }
            return { effectiveMode: 'results', entries: results };
        }

        /**
         * Dibuja el cartel HD en un <canvas> y devuelve { canvas, dataUrl, blob, effectiveMode, count }
         */
        async renderPoster(teams, options = {}) {
            const format = FORMATS[options.format] || FORMATS.whatsapp;
            const theme = THEMES[options.theme] || THEMES.neon;
            const requestedMode = options.mode || 'upcoming';
            const { effectiveMode, entries } = this.collectEntries(teams, requestedMode);

            const W = format.width;
            const H = format.height;
            const isStory = format.id === 'story';

            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');

            // 1. Fondo degradado principal
            const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H);
            bgGrad.addColorStop(0, theme.bgTop);
            bgGrad.addColorStop(1, theme.bgBottom);
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // 2. Halos de luz deportivos
            const radA = ctx.createRadialGradient(W * 0.85, H * 0.08, 20, W * 0.85, H * 0.08, 460);
            radA.addColorStop(0, theme.glowA);
            radA.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = radA;
            ctx.fillRect(0, 0, W, H);

            const radB = ctx.createRadialGradient(W * 0.12, H * 0.86, 20, W * 0.12, H * 0.86, 480);
            radB.addColorStop(0, theme.glowB);
            radB.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = radB;
            ctx.fillRect(0, 0, W, H);

            // 3. Rejilla geométrica sutil tipo pista
            ctx.strokeStyle = theme.gridColor;
            ctx.lineWidth = 2;
            for (let gx = 0; gx < W; gx += 90) {
                ctx.beginPath();
                ctx.moveTo(gx, 0);
                ctx.lineTo(gx, H);
                ctx.stroke();
            }
            for (let gy = 0; gy < H; gy += 90) {
                ctx.beginPath();
                ctx.moveTo(0, gy);
                ctx.lineTo(W, gy);
                ctx.stroke();
            }

            // 4. Barra superior acento
            ctx.fillStyle = theme.accent;
            ctx.fillRect(0, 0, W, 14);

            // 5. Header con logo y títulos
            const padX = 56;
            const headerY = isStory ? 66 : 48;
            const logoSize = isStory ? 114 : 96;

            const logoImg = await this._loadLogo();
            // Caja del logo
            this._roundRect(ctx, padX, headerY, logoSize, logoSize, 26);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            if (logoImg) {
                try {
                    const inset = 10;
                    ctx.drawImage(logoImg, padX + inset, headerY + inset, logoSize - inset * 2, logoSize - inset * 2);
                } catch (e) {}
            }

            const textX = padX + logoSize + 26;
            // Pill Liga
            const pillText = 'LLIGA GUINOTPRUNERA • 2026';
            ctx.font = '800 22px Outfit, Arial, sans-serif';
            const pillW = ctx.measureText(pillText).width + 36;
            this._roundRect(ctx, textX, headerY + 4, pillW, 38, 12);
            ctx.fillStyle = theme.accent;
            ctx.fill();
            ctx.fillStyle = theme.accentText;
            ctx.textBaseline = 'middle';
            ctx.fillText(pillText, textX + 18, headerY + 23);

            // Título principal
            ctx.font = `900 ${isStory ? 58 : 50}px Outfit, Arial, sans-serif`;
            ctx.fillStyle = theme.titleColor;
            ctx.textBaseline = 'top';
            const mainTitle = effectiveMode === 'upcoming' ? 'CARTELERA JORNADA' : 'RESULTADOS LIGA';
            ctx.fillText(mainTitle, textX, headerY + 52);

            // Subtítulo club + contador
            ctx.font = '700 25px Outfit, Arial, sans-serif';
            ctx.fillStyle = theme.subColor;
            const subLine = `SOMOS PÁDEL BARCELONA  •  ${entries.length} EQUIPOS EN COMPETICIÓN`;
            ctx.fillText(this._fitText(ctx, subLine, W - textX - padX), textX, headerY + (isStory ? 116 : 106));

            // 6. Área de tarjetas de partidos
            const listTop = headerY + (isStory ? 175 : 155);
            const footerH = isStory ? 118 : 96;
            const listBottom = H - footerH - 22;
            const availH = listBottom - listTop;

            const maxItems = Math.min(entries.length, 9);
            const gap = maxItems >= 8 ? (isStory ? 18 : 12) : (isStory ? 24 : 16);
            const cardH = maxItems > 0 ? Math.min(isStory ? 190 : 148, Math.floor((availH - gap * (maxItems - 1)) / maxItems)) : 140;
            const cardW = W - padX * 2;

            const catColors = {
                masc: '#38bdf8',
                fem: '#f472b6',
                mixt: '#c084fc',
                def: '#10b981'
            };

            for (let i = 0; i < maxItems; i++) {
                const { team, match, type } = entries[i];
                const y = listTop + i * (cardH + gap);
                const isHome = match.isHome !== false;
                const catLow = String(team.category || '').toLowerCase();
                const barColor = catLow.includes('masc') ? catColors.masc : (catLow.includes('fem') ? catColors.fem : (catLow.includes('mixt') ? catColors.mixt : catColors.def));

                // Fondo tarjeta
                this._roundRect(ctx, padX, y, cardW, cardH, 24);
                ctx.fillStyle = theme.cardBg;
                ctx.fill();
                ctx.strokeStyle = theme.cardBorder;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Barra lateral de categoría
                this._roundRect(ctx, padX, y, 12, cardH, 6);
                ctx.fillStyle = barColor;
                ctx.fill();

                const innerX = padX + 32;
                const rightEdge = padX + cardW - 26;

                // Fila superior de la card: Equipo + Jornada + Badge Casa/Fuera (o Victoria/Derrota)
                const shortT = this._shortTeamName(team.name);
                const teamLabel = `SOMOS PÁDEL ${shortT}`;
                ctx.font = `900 ${cardH < 125 ? 26 : 30}px Outfit, Arial, sans-serif`;
                ctx.fillStyle = theme.cardText;
                ctx.textBaseline = 'top';
                const topRowY = y + Math.max(12, Math.floor(cardH * 0.12));

                // Badge derecho
                let badgeText = isHome ? 'CASA' : 'FUERA';
                let badgeBg = isHome ? theme.homeBg : theme.awayBg;
                let badgeFg = isHome ? theme.homeText : theme.awayText;

                if (type === 'results') {
                    const res = this._getResultInfo(match);
                    if (res.valid) {
                        badgeText = `${res.isWin ? 'VICTORIA' : 'DERROTA'} ${res.displayScore}`;
                        badgeBg = res.isWin ? theme.winBg : theme.lossBg;
                        badgeFg = res.isWin ? theme.winText : theme.lossText;
                    }
                }

                ctx.font = '900 22px Outfit, Arial, sans-serif';
                const badgeW = ctx.measureText(badgeText).width + 34;
                const badgeH = 38;
                this._roundRect(ctx, rightEdge - badgeW, topRowY - 2, badgeW, badgeH, 12);
                ctx.fillStyle = badgeBg;
                ctx.fill();
                ctx.fillStyle = badgeFg;
                ctx.textBaseline = 'middle';
                ctx.fillText(badgeText, rightEdge - badgeW + 17, topRowY - 2 + badgeH / 2);

                // Pill Jornada J#
                const jLabel = `J${match.j || '-'}`;
                ctx.font = '900 21px Outfit, Arial, sans-serif';
                const jW = ctx.measureText(jLabel).width + 24;
                this._roundRect(ctx, innerX, topRowY, jW, 34, 10);
                ctx.fillStyle = barColor;
                ctx.fill();
                ctx.fillStyle = '#0f172a';
                ctx.textBaseline = 'middle';
                ctx.fillText(jLabel, innerX + 12, topRowY + 17);

                // Nombre Equipo
                ctx.font = `900 ${cardH < 125 ? 27 : 31}px Outfit, Arial, sans-serif`;
                ctx.fillStyle = theme.cardText;
                ctx.textBaseline = 'middle';
                const maxTeamW = (rightEdge - badgeW - 18) - (innerX + jW + 16);
                ctx.fillText(this._fitText(ctx, teamLabel, maxTeamW), innerX + jW + 16, topRowY + 17);

                // Fila central: VS RIVAL
                const midY = y + Math.floor(cardH * 0.48);
                ctx.font = `800 ${cardH < 125 ? 25 : 29}px Outfit, Arial, sans-serif`;
                ctx.fillStyle = theme.accent === '#0f172a' ? '#0284c7' : theme.accent;
                ctx.textBaseline = 'middle';
                ctx.fillText('VS', innerX, midY);

                ctx.font = `800 ${cardH < 125 ? 26 : 30}px Outfit, Arial, sans-serif`;
                ctx.fillStyle = theme.cardText;
                ctx.fillText(this._fitText(ctx, match.opponent || 'Por definir', cardW - 120), innerX + 48, midY);

                // Fila inferior: Fecha + Hora + Sede
                const botY = y + Math.floor(cardH * 0.78);
                const venue = this._getVenue(match);
                const timeClean = match.time && match.time !== '00:00h' ? ` • ${match.time}` : '';
                const metaStr = `${match.date || 'Por definir'}${timeClean}   |   ${venue}`;
                ctx.font = `700 ${cardH < 125 ? 20 : 22}px Outfit, Arial, sans-serif`;
                ctx.fillStyle = theme.cardMuted;
                ctx.textBaseline = 'middle';
                ctx.fillText(this._fitText(ctx, metaStr, cardW - 64), innerX, botY);
            }

            // 7. Footer oficial de marca
            const footY = H - footerH;
            this._roundRect(ctx, padX, footY + 12, W - padX * 2, footerH - 28, 20);
            ctx.fillStyle = theme.footerBg;
            ctx.fill();

            ctx.font = '900 26px Outfit, Arial, sans-serif';
            ctx.fillStyle = theme.footerText;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText('SOMOS PÁDEL BARCELONA  •  #AUPASOMOSPADEL', W / 2, footY + 12 + (footerH - 28) / 2);
            ctx.textAlign = 'left';

            // Exportar a Blob + DataURL de máxima calidad
            const blob = await new Promise((resolve) => {
                if (canvas.toBlob) {
                    canvas.toBlob(b => resolve(b), 'image/png', 1.0);
                } else {
                    resolve(null);
                }
            });
            const dataUrl = canvas.toDataURL('image/png', 1.0);

            return {
                canvas,
                blob,
                dataUrl,
                effectiveMode,
                count: entries.length,
                width: W,
                height: H,
                filename: `SomosPadel_${effectiveMode === 'upcoming' ? 'Jornada' : 'Resultados'}_${format.id}_${new Date().toISOString().slice(0, 10)}.png`
            };
        }

        /**
         * Descarga infalible del PNG HD (Blob URL + fallback DataURL)
         */
        triggerDownload(blob, dataUrl, filename) {
            const url = blob ? URL.createObjectURL(blob) : dataUrl;
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'SomosPadel_Cartelera_HD.png';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                if (blob && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            }, 1500);
        }

        /**
         * Compartir en WhatsApp CON IMAGEN HD usando Web Share API Level 2 (móvil)
         * con fallback elegante para escritorio (descarga HD + abre WhatsApp con texto).
         */
        async shareImageWithWhatsApp(blob, dataUrl, filename, text) {
            if (blob && typeof File !== 'undefined' && navigator.share) {
                try {
                    const file = new File([blob], filename || 'SomosPadel_Cartelera_HD.png', { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Cartelera Oficial SomosPádel Barcelona',
                            text: text || ''
                        });
                        return { method: 'native_share_file' };
                    }
                } catch (err) {
                    if (err && err.name === 'AbortError') {
                        return { method: 'cancelled' };
                    }
                    console.warn('Web Share con archivo falló, usando fallback:', err);
                }
            }

            // Fallback (Desktop o navegador sin share de archivos):
            // 1. Descargar la imagen HD para adjuntarla al instante
            this.triggerDownload(blob, dataUrl, filename);

            // 2. Intentar copiar imagen al portapapeles (permite Ctrl+V directo en WhatsApp Web!)
            let copiedImg = false;
            if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    copiedImg = true;
                } catch (e) {}
            }

            // 3. Abrir WhatsApp con el texto resumen
            const encodedText = encodeURIComponent(text || '');
            window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener');
            return { method: 'fallback_download_whatsapp', copiedImg };
        }
    }

    global.MatchdayPosterEngine = new MatchdayPosterEngine();
})(window);
