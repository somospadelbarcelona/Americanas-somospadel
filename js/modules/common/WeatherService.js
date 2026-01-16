/**
 * WeatherService.js
 * Service to fetch real-time weather data from Open-Meteo API
 * Zero-auth, free for non-commercial use.
 */

const WeatherService = {
    LOCATIONS: {
        'EL_PRAT': { lat: 41.3278, lon: 2.0947, name: 'EL PRAT' },
        'CORNELLA': { lat: 41.3574, lon: 2.0707, name: 'CORNELLÀ' }
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
     * Fetch for a specific location
     */
    async fetchLocationWeather(location) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability,visibility&timezone=Europe%2FMadrid&forecast_days=1`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const current = data.current;

            // Get rain probability for the current hour
            const currentHourIndex = new Date().getHours();
            const rainProb = data.hourly?.precipitation_probability?.[currentHourIndex] || 0;

            return {
                name: location.name,
                temp: Math.round(current.temperature_2m),
                condition: this.getWeatherCondition(current.weather_code),
                icon: this.getWeatherIcon(current.weather_code, current.is_day),
                wind: Math.round(current.wind_speed_10m),
                humidity: current.relative_humidity_2m,
                rainProb: rainProb,
                isPropitious: rainProb < 30 && current.wind_speed_10m < 20 // Flag for "OPTIMO"
            };
        } catch (e) {
            console.error(`[WeatherService] Failed to fetch for ${location.name}`, e);
            // Return fallback data if API fails
            return {
                name: location.name,
                temp: '--',
                condition: 'Sin datos',
                icon: '❓',
                wind: 0,
                humidity: 0,
                rainProb: 0,
                isPropitious: false
            };
        }
    },

    /**
     * Map WMO codes to text
     */
    getWeatherCondition(code) {
        const codes = {
            0: 'Despejado',
            1: 'Mayormente Despejado',
            2: 'Parcialmente Nublado',
            3: 'Nublado',
            45: 'Niebla', 48: 'Niebla',
            51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna',
            61: 'Lluvia', 63: 'Lluvia Fuerte', 65: 'Lluvia Intensa',
            80: 'Chubascos', 81: 'Chubascos', 82: 'Chubascos Fuertes',
            95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta Severa'
        };
        return codes[code] || 'Variable';
    },

    /**
     * Map WMO codes to Emojis (or FontAwesome classes in view)
     */
    getWeatherIcon(code, isDay) {
        // Simple mapping to FontAwesome class suffix or Emoji
        if (code === 0) return isDay ? '☀️' : '🌙';
        if (code >= 1 && code <= 3) return isDay ? 'Dg' : '☁️'; // Cloud sun
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 95) return '⛈️';
        return '🌤️';
    }
};

window.WeatherService = WeatherService;
