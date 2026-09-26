/**
 * WeatherService.js
 * Service to fetch real-time weather data and forecast from Open-Meteo API.
 * Includes Padel Big Data intelligence, hourly event-based forecast,
 * preventive rain alerts, and court playability heuristics.
 * Zero-auth, free for non-commercial use.
 */

const WeatherService = {
    LOCATIONS: {
        'EL_PRAT': { lat: 41.3278, lon: 2.0947, name: 'EL PRAT' },
        'CORNELLA': { lat: 41.3574, lon: 2.0707, name: 'CORNELLÀ' }
    },

    // Cache interno en memoria (fallback para Node.js o navegadores sin localStorage)
    _memoryCache: new Map(),
    _memoryStorage: new Map(),
    _CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutos

    /**
     * Storage helper seguro con fallback a memoria
     */
    _storageGet(key) {
        try {
            if (typeof localStorage !== 'undefined' && localStorage.getItem) {
                return localStorage.getItem(key);
            }
        } catch (e) {
            // Silencioso ante errores de cuota o privacidad
        }
        return this._memoryStorage.get(key) || null;
    },

    /**
     * Storage set helper seguro con fallback a memoria
     */
    _storageSet(key, value) {
        try {
            if (typeof localStorage !== 'undefined' && localStorage.setItem) {
                localStorage.setItem(key, value);
                return;
            }
        } catch (e) {
            // Silencioso ante errores de cuota o privacidad
        }
        this._memoryStorage.set(key, value);
    },

    /**
     * Cache get helper con expiración inteligente (30 minutos)
     */
    _getWeatherCache(cacheKey) {
        const now = Date.now();
        // 1. Probar localStorage
        try {
            const stored = this._storageGet(cacheKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.timestamp && (now - parsed.timestamp < this._CACHE_TTL_MS)) {
                    return parsed.data;
                }
            }
        } catch (e) {
            // Ignorar JSON parse error
        }

        // 2. Probar memoria interna
        const mem = this._memoryCache.get(cacheKey);
        if (mem && (now - mem.timestamp < this._CACHE_TTL_MS)) {
            return mem.data;
        }

        return null;
    },

    /**
     * Cache set helper con expiración inteligente
     */
    _setWeatherCache(cacheKey, data) {
        const payload = {
            timestamp: Date.now(),
            data: data
        };
        try {
            this._storageSet(cacheKey, JSON.stringify(payload));
        } catch (e) {
            // Ignorar cuota de storage
        }
        this._memoryCache.set(cacheKey, payload);
    },

    /**
     * Fetch weather for all defined locations
     */
    async getDashboardWeather() {
        try {
            const promises = Object.values(this.LOCATIONS).map(loc =>
                this.fetchLocationWeather(loc)
            );
            return await Promise.all(promises);
        } catch (e) {
            console.error('[WeatherService] Error fetching dashboard weather:', e);
            return [];
        }
    },

    /**
     * Fetch for a specific location with enhanced "Padel Big Data"
     */
    async fetchLocationWeather(location) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=precipitation_probability,uv_index,visibility&timezone=Europe%2FMadrid&forecast_days=1`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            if (!data || !data.current) {
                throw new Error('Incomplete data received from weather API');
            }

            const current = data.current;
            const hour = new Date().getHours();

            // Intelligence extraction with fallback values
            const uvIndex = (data.hourly && data.hourly.uv_index) ? (data.hourly.uv_index[hour] || 0) : 0;
            const visibility = (data.hourly && data.hourly.visibility) ? (data.hourly.visibility[hour] || 10000) : 10000;
            const rainProb = (data.hourly && data.hourly.precipitation_probability) ? (data.hourly.precipitation_probability[hour] || 0) : 0;
            const pressure = current.surface_pressure || 1013; // Standard hPa if missing

            // Padel Science Calculations
            const intelligence = this.calculatePadelIntelligence({
                temp: current.temperature_2m || 20,
                humidity: current.relative_humidity_2m || 50,
                pressure: pressure,
                wind: current.wind_speed_10m || 0,
                rain: rainProb,
                uv: uvIndex,
                isDay: current.is_day !== undefined ? current.is_day : 1,
                weatherCode: current.weather_code // Passed for logic
            });

            return {
                name: location.name,
                temp: current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : '--',
                condition: this.getWeatherCondition(current.weather_code),
                icon: this.getWeatherIcon(current.weather_code, current.is_day),
                wind: current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : '--',
                humidity: current.relative_humidity_2m || '--',
                rainProb: rainProb,
                uv: uvIndex,
                pressure: pressure,
                visibility: Math.round(visibility / 1000), // km
                intelligence: intelligence,
                isPropitious: intelligence.score > 60
            };
        } catch (e) {
            console.error(`[WeatherService] Failed to fetch for ${location.name}`, e);
            return {
                name: location.name,
                temp: '--',
                intelligence: { score: 0, ballSpeed: 'Variable', recommendation: 'Sin datos' },
                isPropitious: false
            };
        }
    },

    /**
     * Resuelve la geolocalización de la sede del evento.
     * Sedes reconocidas:
     * - El Prat de Llobregat: lat 41.3278, lon 2.0947
     * - Cornellà: lat 41.3574, lon 2.0707
     * - Fallback default: El Prat
     */
    resolveLocation(locationOrEvent) {
        const defaultLoc = { lat: 41.3278, lon: 2.0947, name: 'EL PRAT' };

        if (!locationOrEvent) return defaultLoc;

        // Si ya es un objeto con lat y lon
        if (typeof locationOrEvent === 'object') {
            if (typeof locationOrEvent.lat === 'number' && typeof locationOrEvent.lon === 'number') {
                return {
                    lat: locationOrEvent.lat,
                    lon: locationOrEvent.lon,
                    name: locationOrEvent.name || 'SEDE'
                };
            }
            if (typeof locationOrEvent.latitude === 'number' && typeof locationOrEvent.longitude === 'number') {
                return {
                    lat: locationOrEvent.latitude,
                    lon: locationOrEvent.longitude,
                    name: locationOrEvent.name || 'SEDE'
                };
            }

            // Buscar en campos comunes de evento
            const venueStr = String(
                locationOrEvent.sede ||
                locationOrEvent.club ||
                locationOrEvent.venue ||
                locationOrEvent.location ||
                locationOrEvent.place ||
                locationOrEvent.name ||
                ''
            );
            return this.resolveLocation(venueStr);
        }

        // Si es string
        const str = String(locationOrEvent).trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (str.includes('cornella')) {
            return { lat: 41.3574, lon: 2.0707, name: 'CORNELLÀ' };
        }
        if (str.includes('prat')) {
            return { lat: 41.3278, lon: 2.0947, name: 'EL PRAT' };
        }

        // Por defecto El Prat
        return defaultLoc;
    },

    /**
     * Normaliza cualquier formato de fecha a 'YYYY-MM-DD'
     */
    _normalizeDate(rawDate) {
        if (!rawDate) {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        if (rawDate instanceof Date && !isNaN(rawDate)) {
            const y = rawDate.getFullYear();
            const m = String(rawDate.getMonth() + 1).padStart(2, '0');
            const d = String(rawDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const str = String(rawDate).trim();
        // Formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }

        // Formato DD/MM/YYYY o DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
            const day = String(dmyMatch[1]).padStart(2, '0');
            const month = String(dmyMatch[2]).padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Fallback Date parse
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    /**
     * Extrae hora numérica (0-23) de un string como '18:00', '18h', 18, etc.
     */
    _extractHour(rawTime, defaultHour = 18) {
        if (typeof rawTime === 'number' && !isNaN(rawTime)) {
            return Math.max(0, Math.min(23, Math.floor(rawTime)));
        }
        if (!rawTime) return defaultHour;

        const match = String(rawTime).match(/(\d{1,2})/);
        if (match) {
            const val = parseInt(match[1], 10);
            if (!isNaN(val)) return Math.max(0, Math.min(23, val));
        }
        return defaultHour;
    },

    /**
     * Predicción Horaria Exacta por Evento y Sede
     * @param {Object} eventDoc Documento o datos del evento
     * @returns {Promise<Object>} Pronóstico detallado y métricas del evento
     */
    async getEventWeatherForecast(eventDoc = {}) {
        const location = this.resolveLocation(eventDoc);
        const eventDateStr = this._normalizeDate(eventDoc.date || eventDoc.normDate || eventDoc.fecha || eventDoc.eventDate);

        // Extraer tramo horario: evt.time a evt.time_end o duración de 2h por defecto
        const startHour = this._extractHour(eventDoc.time || eventDoc.startTime || eventDoc.hora, 18);
        let endHour;
        if (eventDoc.time_end || eventDoc.endTime || eventDoc.hora_fin || eventDoc.timeEnd) {
            endHour = this._extractHour(eventDoc.time_end || eventDoc.endTime || eventDoc.hora_fin || eventDoc.timeEnd, startHour + 2);
        } else {
            endHour = startHour + 2;
        }

        // Añadir 1 hora antes y 1 hora después para el contexto de calentamiento y salida
        const bufferStartHour = Math.max(0, startHour - 1);
        const bufferEndHour = Math.min(23, endHour + 1);

        // Clave de caché para la API completa de la sede (válida por 30 minutos)
        const cacheKey = `sp_weather_forecast_hourly_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`;
        let hourlyData = this._getWeatherCache(cacheKey);

        if (!hourlyData) {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Europe%2FMadrid&forecast_days=7`;
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Open-Meteo HTTP status: ${response.status}`);
                }
                const apiResult = await response.json();
                if (apiResult && apiResult.hourly && Array.isArray(apiResult.hourly.time)) {
                    hourlyData = apiResult.hourly;
                    this._setWeatherCache(cacheKey, hourlyData);
                } else {
                    throw new Error('Formato inesperado devuelto por Open-Meteo');
                }
            } catch (err) {
                console.warn('[WeatherService] Error al consultar Open-Meteo, activando fallback realista:', err);
                return this._generateFallbackForecast(location, eventDateStr, startHour, endHour, bufferStartHour, bufferEndHour);
            }
        }

        // Filtrar y extraer las horas exactas del evento (con margen de calentamiento y salida)
        const hoursList = [];
        const times = hourlyData.time || [];
        const temps = hourlyData.temperature_2m || [];
        const hums = hourlyData.relative_humidity_2m || [];
        const probs = hourlyData.precipitation_probability || [];
        const precips = hourlyData.precipitation || [];
        const codes = hourlyData.weather_code || [];
        const winds = hourlyData.wind_speed_10m || [];
        const gusts = hourlyData.wind_gusts_10m || [];

        for (let i = 0; i < times.length; i++) {
            const timeISO = times[i]; // Ej: "2026-09-27T17:00"
            if (!timeISO.startsWith(eventDateStr)) continue;

            const hourPart = timeISO.substring(11, 13);
            const hourNum = parseInt(hourPart, 10);

            if (hourNum >= bufferStartHour && hourNum <= bufferEndHour) {
                const code = codes[i] !== undefined ? codes[i] : 0;
                const isDay = (hourNum >= 7 && hourNum <= 20) ? 1 : 0;

                hoursList.push({
                    hour: `${String(hourNum).padStart(2, '0')}:00`,
                    hourNum: hourNum,
                    isEventWindow: (hourNum >= startHour && hourNum <= endHour),
                    temp: temps[i] !== undefined ? Math.round(temps[i]) : 20,
                    humidity: hums[i] !== undefined ? Math.round(hums[i]) : 55,
                    rainProb: probs[i] !== undefined ? Math.round(probs[i]) : 0,
                    precipitation: precips[i] !== undefined ? Math.round(precips[i] * 10) / 10 : 0,
                    windSpeed: winds[i] !== undefined ? Math.round(winds[i]) : 10,
                    windGusts: gusts[i] !== undefined ? Math.round(gusts[i]) : (winds[i] ? Math.round(winds[i] * 1.3) : 15),
                    weatherCode: code,
                    icon: this.getWeatherIcon(code, isDay),
                    condition: this.getWeatherCondition(code)
                });
            }
        }

        // Si la fecha cae fuera de los 7 días de Open-Meteo o no hubo horas coincidentes
        if (hoursList.length === 0) {
            return this._generateFallbackForecast(location, eventDateStr, startHour, endHour, bufferStartHour, bufferEndHour);
        }

        // Cálculo de métricas consolidadas
        const eventWindowHours = hoursList.filter(h => h.isEventWindow).length > 0
            ? hoursList.filter(h => h.isEventWindow)
            : hoursList;

        const maxRainProb = Math.max(...eventWindowHours.map(h => h.rainProb || 0));
        const maxWindGust = Math.max(...eventWindowHours.map(h => h.windGusts || 0));
        const avgWind = Math.round(eventWindowHours.reduce((acc, h) => acc + (h.windSpeed || 0), 0) / eventWindowHours.length);
        const avgTemp = Math.round(eventWindowHours.reduce((acc, h) => acc + (h.temp || 0), 0) / eventWindowHours.length);
        const avgHumidity = Math.round(eventWindowHours.reduce((acc, h) => acc + (h.humidity || 50), 0) / eventWindowHours.length);

        // Nivel de riesgo según especificaciones:
        // 'safe': <30% lluvia, viento <20km/h
        // 'moderate': 30-69% lluvia o viento 20-35km/h
        // 'high': lluvia >=70% o viento >35km/h
        let riskLevel = 'safe';
        if (maxRainProb >= 70 || avgWind > 35 || maxWindGust > 35) {
            riskLevel = 'high';
        } else if (maxRainProb >= 30 || avgWind >= 20 || maxWindGust >= 28) {
            riskLevel = 'moderate';
        }

        // Indoor recomendado: boolean si lluvia >=70% o viento >35km/h
        const isIndoorRecommended = (maxRainProb >= 70 || avgWind > 35 || maxWindGust > 35);

        // Ball Physics: velocidad de bola y reactividad según temperatura y humedad
        let ballSpeed = 'MEDIA';
        let reactivity = 'Media equilibrada';
        let ballDescription = 'Rebote estándar y buena respuesta al efecto.';

        if (avgTemp >= 26) {
            ballSpeed = 'RÁPIDA';
            reactivity = 'Muy Alta';
            ballDescription = 'Pelota viva y rápida por alta temperatura; mayor rebote en cristal y facilidad para sacarla.';
        } else if (avgTemp <= 14) {
            ballSpeed = 'LENTA';
            reactivity = 'Baja';
            ballDescription = 'Pelota pesada y menor rebote; cuesta sacarla por 3 y exige más esfuerzo físico en la flexión.';
        }

        if (avgHumidity > 80) {
            ballDescription += ' Humedad alta: cristales resbaladizos donde la bola desliza hacia abajo.';
        }

        const ballPhysics = {
            speed: ballSpeed,
            reactivity: reactivity,
            description: ballDescription,
            avgTemp: avgTemp,
            avgHumidity: avgHumidity
        };

        // Tactical advice
        let tacticalAdvice = 'Condiciones óptimas de juego para desplegar tu mejor pádel.';
        if (isIndoorRecommended) {
            tacticalAdvice = '⚠️ Condiciones adversas de viento/lluvia. Muy recomendado jugar en pista cubierta o asegurar pista indoor.';
        } else if (maxRainProb >= 50) {
            tacticalAdvice = '🌧️ Alta probabilidad de llovizna: pista potencialmente deslizante. Prioriza juego de control y cuidado con los apoyos rápidos.';
        } else if (avgWind >= 25 || maxWindGust >= 30) {
            tacticalAdvice = '💨 Viento notable: juega por abajo con margen, reduce la altura de los globos y busca el centro de la pista rival.';
        } else if (avgTemp >= 30) {
            tacticalAdvice = '🔥 Calor intenso: la bola vuela con fuerza. Mantente hidratado, aprovecha las voleas profundas y remates controlados.';
        } else if (avgTemp <= 12) {
            tacticalAdvice = '❄️ Clima frío: la bola apenas sube de la pared. Flexiona rodillas, busca tiros largos a los pies y evita riesgos innecesarios.';
        } else if (avgHumidity >= 85) {
            tacticalAdvice = '💧 Cristales húmedos: evita recurrir a salidas de pared complejas, pues la bola cae al tocar el vidrio.';
        }

        return {
            location: location,
            date: eventDateStr,
            timeRange: `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`,
            bufferRange: `${String(bufferStartHour).padStart(2, '0')}:00 - ${String(bufferEndHour).padStart(2, '0')}:00`,
            hours: hoursList,
            maxRainProb: maxRainProb,
            avgWind: avgWind,
            maxWindGust: maxWindGust,
            avgTemp: avgTemp,
            riskLevel: riskLevel,
            ballPhysics: ballPhysics,
            isIndoorRecommended: isIndoorRecommended,
            tacticalAdvice: tacticalAdvice,
            isFallback: false
        };
    },

    /**
     * Generador de fallback realista ante fallos de conexión o fechas lejanas
     */
    _generateFallbackForecast(location, dateStr, startHour, endHour, bufferStartHour, bufferEndHour) {
        const hoursList = [];
        for (let h = bufferStartHour; h <= bufferEndHour; h++) {
            const isDay = (h >= 7 && h <= 20) ? 1 : 0;
            hoursList.push({
                hour: `${String(h).padStart(2, '0')}:00`,
                hourNum: h,
                isEventWindow: (h >= startHour && h <= endHour),
                temp: 21,
                humidity: 55,
                rainProb: 15,
                precipitation: 0,
                windSpeed: 12,
                windGusts: 18,
                weatherCode: 1,
                icon: isDay ? '🌤️' : '🌙',
                condition: 'Mayormente Despejado (Estimado)'
            });
        }

        return {
            location: location,
            date: dateStr,
            timeRange: `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`,
            bufferRange: `${String(bufferStartHour).padStart(2, '0')}:00 - ${String(bufferEndHour).padStart(2, '0')}:00`,
            hours: hoursList,
            maxRainProb: 15,
            avgWind: 12,
            maxWindGust: 18,
            avgTemp: 21,
            riskLevel: 'safe',
            ballPhysics: {
                speed: 'MEDIA',
                reactivity: 'Media equilibrada',
                description: 'Condiciones estimadas templadas para pádel fluido.',
                avgTemp: 21,
                avgHumidity: 55
            },
            isIndoorRecommended: false,
            tacticalAdvice: 'Condiciones estimadas estables. Juego estándar recomendado.',
            isFallback: true
        };
    },

    /**
     * Aviso Preventivo Automático (Alertas de Lluvia >= 70%)
     * Comprueba si el evento se celebra hoy o en las próximas horas.
     * Si faltan entre 1 y 4 horas para el evento (o forceCheck es true) y maxRainProb >= 70%:
     * Devuelve { alertNeeded: true, maxRainProb, alertType: 'RAIN_RISK', message, hoursBefore }
     */
    async checkPreventiveAlert(eventDoc = {}, options = {}) {
        const forceCheck = Boolean(options.forceCheck || eventDoc.forceCheck);

        // Obtener el pronóstico
        let forecast = options.forecast;
        if (!forecast) {
            forecast = await this.getEventWeatherForecast(eventDoc);
        }

        // Calcular la hora del evento con respecto a ahora
        const eventDateStr = this._normalizeDate(eventDoc.date || eventDoc.normDate || eventDoc.fecha || eventDoc.eventDate);
        const startHour = this._extractHour(eventDoc.time || eventDoc.startTime || eventDoc.hora, 18);
        
        let startMinutes = 0;
        if (eventDoc.time && String(eventDoc.time).includes(':')) {
            const parts = String(eventDoc.time).split(':');
            startMinutes = parseInt(parts[1], 10) || 0;
        }

        // Construir Date del inicio del evento
        const [y, m, d] = eventDateStr.split('-').map(Number);
        const eventStartDateTime = new Date(y, m - 1, d, startHour, startMinutes, 0, 0);

        const now = new Date();
        const diffMs = eventStartDateTime.getTime() - now.getTime();
        const hoursBefore = diffMs / (1000 * 60 * 60);

        const maxRainProb = forecast.maxRainProb !== undefined ? forecast.maxRainProb : 0;
        const isTimeWindowValid = (hoursBefore >= 0.5 && hoursBefore <= 4.5);

        // Si faltan entre 1 y 4 horas para el evento (o forceCheck es true) y maxRainProb >= 70%
        if ((isTimeWindowValid || forceCheck) && maxRainProb >= 70) {
            const venueName = forecast.location?.name || eventDoc.sede || eventDoc.club || 'SomosPadel';
            const roundedHours = Math.max(0, Math.round(hoursBefore * 10) / 10);
            return {
                alertNeeded: true,
                maxRainProb: maxRainProb,
                alertType: 'RAIN_RISK',
                message: `🌧️ Alerta preventiva: ${maxRainProb}% de lluvia prevista para tu partido en ${venueName} (${eventDoc.time || `${startHour}:00`}).`,
                hoursBefore: roundedHours,
                forecast: forecast
            };
        }

        return {
            alertNeeded: false,
            maxRainProb: maxRainProb,
            hoursBefore: Math.max(0, Math.round(hoursBefore * 10) / 10)
        };
    },

    /**
     * Envía aviso preventivo automático a través de NotificationService si está disponible.
     * Registra la alerta en localStorage para no spamear más de una vez cada 2 horas por evento.
     * @param {Object} eventDoc 
     * @param {Object} forecast 
     */
    async sendPreventiveAlert(eventDoc = {}, forecast = null) {
        if (!forecast) {
            forecast = await this.getEventWeatherForecast(eventDoc);
        }

        const eventId = String(eventDoc.id || eventDoc._id || eventDoc.eventId || `evt_${eventDoc.date || 'today'}_${eventDoc.time || '1800'}`);
        const alertKey = `sp_rain_alert_sent_${eventId}`;

        // Control anti-spam: no spamear más de una vez cada 2 horas por evento
        const lastSent = this._storageGet(alertKey);
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        if (lastSent) {
            const timeSince = Date.now() - Number(lastSent);
            if (!isNaN(timeSince) && timeSince < TWO_HOURS_MS) {
                return {
                    success: false,
                    reason: 'ALREADY_SENT_RECENTLY',
                    notifiedCount: 0,
                    lastSent: Number(lastSent)
                };
            }
        }

        const sede = eventDoc.sede || eventDoc.club || eventDoc.venue || eventDoc.location || forecast.location?.name || 'SomosPadel Barcelona';
        const hora = eventDoc.time || eventDoc.hora || 'tu franja horaria';
        const title = `🌧️ AVISO PREVENTIVO: Lluvia prevista en ${sede}`;
        const message = `Probabilidad del ${forecast.maxRainProb}% de lluvia en tu horario (${hora}). El club monitoriza la pista.`;

        const players = Array.isArray(eventDoc.players) ? eventDoc.players : [];
        const notifiedCount = players.length;

        const notificationPayload = {
            id: `rain_alert_${eventId}_${Date.now()}`,
            title: title,
            message: message,
            body: message,
            type: 'weather_alert',
            category: 'weather',
            eventId: eventId,
            venue: sede,
            maxRainProb: forecast.maxRainProb,
            timestamp: Date.now()
        };

        // Si window.NotificationService está disponible en el entorno de ejecución
        if (typeof window !== 'undefined' && window.NotificationService) {
            try {
                if (typeof window.NotificationService.showInAppToast === 'function') {
                    window.NotificationService.showInAppToast(title, message, 'weather', `#event-${eventId}`);
                } else if (typeof window.NotificationService.showToast === 'function') {
                    window.NotificationService.showToast(`${title}: ${message}`, 'warning');
                }

                if (typeof window.NotificationService.createEventNotification === 'function') {
                    window.NotificationService.createEventNotification(notificationPayload);
                }
            } catch (err) {
                console.warn('[WeatherService] Error al emitir notificación en NotificationService:', err);
            }
        }

        // Marcar en storage el timestamp del envío para control anti-spam
        this._storageSet(alertKey, Date.now().toString());

        return {
            success: true,
            notifiedCount: notifiedCount,
            notificationPayload: notificationPayload
        };
    },

    /**
     * Revisa una lista de eventos y retorna aquellos que ocurren en las próximas 24 horas
     * y tienen un riesgo de lluvia moderado o alto (o maxRainProb >= 30%)
     * @param {Array} eventsList Lista de documentos o registros de eventos
     * @returns {Promise<Array>} Lista de eventos con riesgo climático ordenada por severidad
     */
    async scanAllUpcomingEvents(eventsList = []) {
        if (!Array.isArray(eventsList) || eventsList.length === 0) {
            return [];
        }

        const now = new Date();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
        const upcomingRiskyEvents = [];

        for (const evt of eventsList) {
            try {
                const dateStr = this._normalizeDate(evt.date || evt.normDate || evt.fecha || evt.eventDate);
                const startHour = this._extractHour(evt.time || evt.startTime || evt.hora, 18);
                const [y, m, d] = dateStr.split('-').map(Number);
                const eventDateTime = new Date(y, m - 1, d, startHour, 0, 0, 0);

                const diff = eventDateTime.getTime() - now.getTime();
                // Considerar eventos dentro de las próximas 24 horas (desde -1h para los que están empezando)
                if (diff >= -1 * 60 * 60 * 1000 && diff <= TWENTY_FOUR_HOURS_MS) {
                    const forecast = await this.getEventWeatherForecast(evt);
                    if (forecast.riskLevel === 'high' || forecast.riskLevel === 'moderate' || forecast.maxRainProb >= 30) {
                        upcomingRiskyEvents.push({
                            event: evt,
                            forecast: forecast,
                            riskLevel: forecast.riskLevel,
                            maxRainProb: forecast.maxRainProb,
                            isIndoorRecommended: forecast.isIndoorRecommended,
                            tacticalAdvice: forecast.tacticalAdvice
                        });
                    }
                }
            } catch (e) {
                console.warn('[WeatherService] Error escaneando evento individual:', e);
            }
        }

        // Ordenar por severidad: primero 'high', luego mayor probabilidad de lluvia
        upcomingRiskyEvents.sort((a, b) => {
            if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
            if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1;
            return b.maxRainProb - a.maxRainProb;
        });

        return upcomingRiskyEvents;
    },

    /**
     * Calcula métricas heurísticas para juego de pádel
     */
    calculatePadelIntelligence(data) {
        let score = 100;

        // 1. DEDUCTIONS FOR PLAYABILITY
        if (data.rain > 5) score -= (data.rain * 1.5);
        if (data.wind > 15) score -= (data.wind - 15) * 2;
        if (data.temp < 8) score -= 15;
        if (data.temp > 35) score -= 10;
        if (data.humidity > 85) score -= 15;

        score = Math.max(0, Math.min(100, Math.round(score)));

        // 2. BALL SPEED PREDICTION
        let speed = 'MEDIA';
        const speedValue = (data.temp * 1) - (data.humidity / 6) + (1013 - data.pressure);
        if (speedValue > 25) speed = 'RÁPIDA';
        if (speedValue < 12) speed = 'LENTA';

        // 3. CONTEXTUAL RECOMMENDATIONS (SMART AI LOGIC)
        let rec = 'Condiciones de juego estándar.';
        const isRainingNow = data.weatherCode >= 51; // Códigos de lluvia

        // Prioridad 1: Lluvia Activa (Lo que se ve)
        if (isRainingNow) {
            if (data.rain > 70) rec = '⚠️ Lluvia intensa: Pista impracticable. Busca indoor.';
            else rec = '🌧️ Pista mojada: La bola pesará mucho y resbalará.';
        }
        // Prioridad 2: Viento (Molesta mucho)
        else if (data.wind > 28) {
            rec = '💨 Vendaval: Juega por abajo y evita los globos.';
        }
        // Prioridad 3: Calor Extremo
        else if (data.temp > 30) {
            rec = '🔥 Calor sofocante: La bola vuela mucho. ¡Hidrátate!';
        }
        // Prioridad 4: Riesgo de Lluvia (Futuro) pero NO llueve ahora
        else if (data.rain > 30 && !isRainingNow) {
            rec = 'cloud-sun-rain Riesgo de lluvia: El cielo amenaza, pero se puede jugar.';
        }
        // Prioridad 5: Frío
        else if (data.temp < 10) {
            rec = '❄️ Frío: La bola apenas rebota. Usa más fuerza y flexiona.';
        }
        // Prioridad 6: Humedad (Cristales)
        else if (data.humidity > 85) {
            rec = '💧 Humedad alta: Cuidado con los cristales, la bola cae al tocar.';
        }
        // Prioridad 7: Condiciones Ideales
        else {
            if (data.isDay) rec = '☀️ Día perfecto: Condiciones ideales para sacarla x3.';
            else rec = '🌙 Noche despejada: Visibilidad perfecta y temperatura agradable.';
        }

        return {
            score: score,
            ballSpeed: speed,
            recommendation: rec,
            uvLevel: data.uv > 5 ? 'ALTO' : 'BAJO',
            gripStatus: data.humidity > 85 ? 'HÚMEDO' : 'SECO'
        };
    },

    /**
     * Map WMO codes to text
     */
    getWeatherCondition(code) {
        const codes = {
            0: 'Cielo Despejado',
            1: 'Mayormente Despejado',
            2: 'Parcialmente Nublado',
            3: 'Nublado',
            45: 'Niebla', 48: 'Niebla con Escarcha',
            51: 'Llovizna Ligera', 53: 'Llovizna Moderada', 55: 'Llovizna Densa',
            61: 'Lluvia Débil', 63: 'Lluvia Moderada', 65: 'Lluvia Fuerte',
            80: 'Chubascos Aislados', 81: 'Chubascos', 82: 'Chubascos Violentos',
            95: 'Tormenta Eléctrica', 96: 'Tormenta con Granizo', 99: 'Tormenta Severa'
        };
        return codes[code] || 'Condiciones Variables';
    },

    /**
     * Map WMO codes to Emojis
     */
    getWeatherIcon(code, isDay) {
        if (code === 0) return isDay ? '☀️' : '🌙';
        if (code >= 1 && code <= 3) return isDay ? '🌤️' : '☁️';
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 95) return '⛈️';
        return '🌤️';
    }
};

// Compatibilidad dual: Navegador y Node.js
if (typeof window !== 'undefined') {
    window.WeatherService = WeatherService;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherService;
}
