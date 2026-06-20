/**
 * OpenMatchesController.js - Core Logic for 'Partidas Abiertas' v1.0
 * Handles real-time Firestore synchronization and hybrid WhatsApp message parsing.
 */
(function () {
    class OpenMatchesController {
        constructor() {
            this.collectionName = 'open_matches';
            this.unsubscribe = null;
            // Opcional: Clave de API de Gemini (reemplazar con la tuya si quieres IA para texto caótico)
            this.geminiApiKey = ''; 
        }

        init() {
            console.log("🎾 [OpenMatchesController] Initializing Module...");
            
            // 1. Render initial skeleton view
            if (window.OpenMatchesView) {
                window.OpenMatchesView.renderLayout();
            }

            // 2. Start real-time Firestore sync
            this.startRealTimeSync();
        }

        startRealTimeSync() {
            if (!window.db) {
                console.error("❌ [OpenMatchesController] Firebase DB not initialized yet");
                return;
            }

            if (this.unsubscribe) {
                this.unsubscribe();
            }

            const todayStr = new Date().toISOString().split('T')[0];

            console.log("📡 [OpenMatchesController] Connecting to 'open_matches' collection...");
            
            try {
                // Listen to active matches (date filter handled in memory to bypass index requirements)
                this.unsubscribe = window.db.collection(this.collectionName)
                    .where('status', 'in', ['active', 'completed'])
                    .onSnapshot(snapshot => {
                        const matches = [];
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.date && data.date >= todayStr) {
                                matches.push({ id: doc.id, ...data });
                            }
                        });

                        // Sort matches by date and time ascending
                        matches.sort((a, b) => {
                            const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                            const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                            return dateA - dateB;
                        });

                        console.log(`📊 [OpenMatchesController] Received ${matches.length} active matches.`);
                        
                        if (window.OpenMatchesView) {
                            window.OpenMatchesView.renderMatches(matches);
                        }
                    }, error => {
                        console.error("❌ [OpenMatchesController] Firestore subscription failed:", error);
                        if (window.OpenMatchesView) {
                            window.OpenMatchesView.renderError(error.message);
                        }
                    });
            } catch (err) {
                console.error("❌ [OpenMatchesController] Error setting up real-time listener:", err);
            }
        }

        /**
         * Simulates receiving a WhatsApp message, parses it, and uploads it to Firestore.
         */
        async simulateWhatsAppMessage(text) {
            console.log("💬 [OpenMatchesController] Simulating message parsing:", text);

            if (!text || !text.trim()) {
                throw new Error("El mensaje de texto está vacío.");
            }

            // 1. Extract Playtomic link using regex
            const playtomicRegex = /https?:\/\/(?:app\.)?playtomic\.io\/matches\/([a-zA-Z0-9\-]+)/i;
            const match = text.match(playtomicRegex);
            
            if (!match) {
                throw new Error("No se ha encontrado ningún enlace válido de Playtomic (playtomic.io/matches/...) en el mensaje.");
            }

            const playtomicUrl = match[0];
            const matchId = match[1];
            const documentId = `playtomic_${matchId}`;

            let parsedData = null;

            // 2. Try to parse using Gemini if API Key is available
            if (this.geminiApiKey) {
                try {
                    parsedData = await this.parseWithGemini(text, playtomicUrl);
                } catch (geminiErr) {
                    console.warn("⚠️ [OpenMatchesController] Gemini parsing failed, falling back to regex parser:", geminiErr);
                }
            }

            // 3. Fallback: Parse using highly optimized Regular Expressions (Deterministic Parser)
            if (!parsedData) {
                parsedData = this.parseWithRegexFallback(text, playtomicUrl);
            }

            // 4. Save to Firestore (unauthenticated write is allowed by security rule in production)
            console.log("💾 [OpenMatchesController] Saving parsed match to Firestore:", parsedData);
            
            await window.db.collection(this.collectionName).doc(documentId).set({
                ...parsedData,
                status: 'active',
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            return parsedData;
        }

        /**
         * Consumes Gemini API to structure the raw WhatsApp message.
         */
        async parseWithGemini(text, playtomicUrl) {
            console.log("🤖 [OpenMatchesController] Invoking Gemini API...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
            
            const prompt = `
            Eres un asistente experto de Somos Pádel BCN. Tu tarea es analizar el siguiente mensaje recibido en un grupo de WhatsApp y estructurarlo en formato JSON.
            
            Mensaje de WhatsApp:
            """
            ${text}
            """
            
            Extrae de forma precisa:
            1. "club": Nombre del club de pádel (ej: "Can Vía Racket Club"). Si no se menciona o es ambiguo, pon "Somos Pádel BCN".
            2. "date": Fecha en formato YYYY-MM-DD. Si dice "domingo, 31/5/2026", conviértelo a "2026-05-31". Deduce el año actual (2026) si no figura.
            3. "time": Hora de inicio en formato HH:MM (24 horas, ej: "20:00").
            4. "duration": Duración del partido en minutos (entero, ej: 90). Si no se menciona, pon 90.
            5. "level_min": Nivel mínimo (número, ej: 2.79). Si no figura, pon 3.0.
            6. "level_max": Nivel máximo (número, ej: 3.79). Si no figura, pon 3.5.
            7. "spots_needed": Número de plazas libres restantes. Deduce cuántas plazas están libres. Si es un partido de 4 jugadores y se mencionan dos con check (✔), faltan 2 plazas libres. Si no se puede deducir, pon 1.
            8. "players": Lista de nombres de los jugadores apuntados actualmente (máximo 4).
            
            Devuelve ÚNICAMENTE un objeto JSON válido, sin comentarios, sin formato Markdown.
            `;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini HTTP Error ${response.status}`);
            }

            const data = await response.json();
            const jsonText = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(jsonText);

            return {
                club: parsed.club || "Somos Pádel BCN",
                date: parsed.date || new Date().toISOString().split('T')[0],
                time: parsed.time || "19:00",
                duration: parseInt(parsed.duration) || 90,
                level_min: parseFloat(parsed.level_min) || 3.0,
                level_max: parseFloat(parsed.level_max) || 3.5,
                players: Array.isArray(parsed.players) ? parsed.players : [],
                spots_needed: parseInt(parsed.spots_needed) || 1,
                playtomic_url: playtomicUrl,
                original_text: text
            };
        }

        /**
         * Robust Deterministic Regex Parser for Playtomic shared messages.
         */
        parseWithRegexFallback(text, playtomicUrl) {
            console.log("⚙️ [OpenMatchesController] Running Deterministic Regex Parser...");

            // Default values
            let club = "Somos Pádel BCN";
            let dateStr = new Date().toISOString().split('T')[0];
            let timeStr = "19:00";
            let duration = 90;
            let levelMin = 3.0;
            let levelMax = 3.5;
            let players = [];
            let spotsNeeded = 1;

            // 1. Parse Club name
            // Look for "PARTIDO EN [CLUB]"
            const clubMatch = text.match(/PARTIDO EN\s+([^\n💪👑🎾]+)/i);
            if (clubMatch) {
                club = clubMatch[1].trim();
            } else {
                // Try to find club from lines containing 📍
                const locationLine = text.split('\n').find(l => l.includes('📍'));
                if (locationLine) {
                    club = locationLine.replace('📍', '').trim();
                }
            }

            // 2. Parse Date & Time
            // Format: 📅 domingo, 31/5/2026, 20:00 90 min
            const dateTimeLine = text.split('\n').find(l => l.includes('📅'));
            if (dateTimeLine) {
                // Extract duration
                const durationMatch = dateTimeLine.match(/(\d+)\s*min/i);
                if (durationMatch) {
                    duration = parseInt(durationMatch[1]);
                }

                // Extract time (HH:MM)
                const timeMatch = dateTimeLine.match(/(\d{2}:\d{2})/);
                if (timeMatch) {
                    timeStr = timeMatch[1];
                }

                // Extract date (d/m/yyyy or dd/mm/yyyy)
                const dateMatch = dateTimeLine.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                    const day = dateMatch[1].padStart(2, '0');
                    const month = dateMatch[2].padStart(2, '0');
                    const year = dateMatch[3];
                    dateStr = `${year}-${month}-${day}`;
                }
            }

            // 3. Parse Levels
            // Format: 📊 2.79 - 3.79
            const levelLine = text.split('\n').find(l => l.includes('📊'));
            if (levelLine) {
                const levels = levelLine.replace('📊', '').split('-').map(l => parseFloat(l.trim()));
                if (levels.length >= 2 && !isNaN(levels[0]) && !isNaN(levels[1])) {
                    levelMin = levels[0];
                    levelMax = levels[1];
                } else if (levels.length === 1 && !isNaN(levels[0])) {
                    levelMin = levels[0];
                    levelMax = levels[0] + 0.5;
                }
            }

            // 4. Parse Players
            // Format: ✔️ Jordi Díaz Llopis (3.04)
            // Format: ✔️ Carlos Jiménez Lora (3.25)
            // Format: ✔️ ??
            const lines = text.split('\n');
            let blankCount = 0;
            lines.forEach(line => {
                if (line.includes('✔️') || line.includes('✔')) {
                    const cleanLine = line.replace(/[✔️✔]/g, '').trim();
                    if (cleanLine.includes('??') || cleanLine === '?' || cleanLine === '') {
                        blankCount++;
                    } else {
                        players.push(cleanLine);
                    }
                }
            });

            if (blankCount > 0) {
                spotsNeeded = blankCount;
            } else if (players.length > 0) {
                spotsNeeded = Math.max(0, 4 - players.length);
            }

            return {
                club,
                date: dateStr,
                time: timeStr,
                duration: duration,
                level_min: levelMin,
                level_max: levelMax,
                players,
                spots_needed: spotsNeeded,
                playtomic_url: playtomicUrl,
                original_text: text
            };
        }

        async createMatch(matchData) {
            console.log("💾 [OpenMatchesController] Saving new community match to Firestore:", matchData);
            
            if (!window.db) {
                throw new Error("Base de datos no inicializada.");
            }

            // Let Firestore auto-generate a document ID
            const docRef = window.db.collection(this.collectionName).doc();
            
            const payload = {
                ...matchData,
                status: 'active',
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            await docRef.set(payload);
            console.log("✅ [OpenMatchesController] Community match created with ID:", docRef.id);
            return { id: docRef.id, ...payload };
        }

        destroy() {
            console.log("🔌 [OpenMatchesController] Cleaning up database listeners");
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
        }
    }

    window.OpenMatchesController = new OpenMatchesController();
})();
