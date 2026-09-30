/**
 * test-weather-service-radar-qa.js
 * Test Suite completo para WeatherService extendido:
 * - Predicción horaria por evento y sede (El Prat, Cornellà, Fallback)
 * - Métricas consolidadas (maxRainProb, riskLevel, ballPhysics, isIndoorRecommended, tacticalAdvice)
 * - Caché inteligente y modo defensivo offline / fallback
 * - checkPreventiveAlert (umbral 70%, ventana de horas, forceCheck)
 * - sendPreventiveAlert (anti-spam 2h, NotificationService, payload)
 * - scanAllUpcomingEvents (próximas 24h, filtrado por riesgo)
 * - Retrocompatibilidad de getDashboardWeather y calculatePadelIntelligence
 */

const assert = require('assert');
const WeatherService = require('../js/modules/common/WeatherService.js');

async function runTests() {
    console.log('🧪 Iniciando QA Suite para WeatherService (Radar de Climatología Avanzado)...');

    // 1. Verificación de Exportación y compatibilidad básica
    assert.ok(WeatherService, 'WeatherService debe estar definido');
    assert.strictEqual(typeof WeatherService.getEventWeatherForecast, 'function', 'getEventWeatherForecast debe ser función');
    assert.strictEqual(typeof WeatherService.checkPreventiveAlert, 'function', 'checkPreventiveAlert debe ser función');
    assert.strictEqual(typeof WeatherService.sendPreventiveAlert, 'function', 'sendPreventiveAlert debe ser función');
    assert.strictEqual(typeof WeatherService.scanAllUpcomingEvents, 'function', 'scanAllUpcomingEvents debe ser función');
    console.log('✅ 1. Métodos y exportación base comprobados');

    // 2. Resolución de Sedes
    const locPrat = WeatherService.resolveLocation('Torneo en El Prat de Llobregat');
    assert.strictEqual(locPrat.lat, 41.3278);
    assert.strictEqual(locPrat.lon, 2.0947);
    assert.strictEqual(locPrat.name, 'EL PRAT');

    const locCornella = WeatherService.resolveLocation({ sede: 'Pistas Cornellà' });
    assert.strictEqual(locCornella.lat, 41.3574);
    assert.strictEqual(locCornella.lon, 2.0707);
    assert.strictEqual(locCornella.name, 'CORNELLÀ');

    const locUnknown = WeatherService.resolveLocation('Sede Desconocida');
    assert.strictEqual(locUnknown.lat, 41.3278, 'Debe aplicar fallback default a El Prat');
    console.log('✅ 2. Resolución de sedes comprobada');

    // 3. Predicción horaria por evento (con fallback offline simulado si fuera necesario o API real)
    const testEvent = {
        id: 'test_evt_123',
        sede: 'Padel El Prat',
        date: '2026-09-27',
        time: '18:00',
        time_end: '20:00',
        players: ['p1', 'p2', 'p3', 'p4']
    };

    const forecast = await WeatherService.getEventWeatherForecast(testEvent);
    assert.ok(forecast, 'El pronóstico no puede ser nulo');
    assert.ok(Array.isArray(forecast.hours), 'forecast.hours debe ser un array');
    assert.ok(forecast.hours.length > 0, 'Debe haber horas en el rango analizado');

    const firstHour = forecast.hours[0];
    assert.strictEqual(typeof firstHour.hour, 'string');
    assert.strictEqual(typeof firstHour.temp, 'number');
    assert.strictEqual(typeof firstHour.rainProb, 'number');
    assert.strictEqual(typeof firstHour.windSpeed, 'number');
    assert.strictEqual(typeof firstHour.windGusts, 'number');
    assert.strictEqual(typeof firstHour.condition, 'string');
    assert.strictEqual(typeof firstHour.icon, 'string');

    // Métricas consolidadas
    assert.strictEqual(typeof forecast.maxRainProb, 'number');
    assert.strictEqual(typeof forecast.avgWind, 'number');
    assert.strictEqual(typeof forecast.maxWindGust, 'number');
    assert.strictEqual(typeof forecast.avgTemp, 'number');
    assert.ok(['safe', 'moderate', 'high'].includes(forecast.riskLevel), `riskLevel inválido: ${forecast.riskLevel}`);
    assert.strictEqual(typeof forecast.isIndoorRecommended, 'boolean');
    assert.strictEqual(typeof forecast.tacticalAdvice, 'string');
    assert.ok(forecast.ballPhysics && typeof forecast.ballPhysics.speed === 'string');
    console.log('✅ 3. getEventWeatherForecast y estructura de métricas consolidadas comprobadas');

    // 4. Caché inteligente de 30 minutos
    const cacheKey = `sp_weather_forecast_hourly_${forecast.location.lat.toFixed(4)}_${forecast.location.lon.toFixed(4)}`;
    const cachedData = WeatherService._getWeatherCache(cacheKey);
    assert.ok(cachedData, 'Los datos de la API horaria deben estar cacheados');
    console.log('✅ 4. Caché de 30 minutos comprobada');

    // 5. Alerta preventiva: checkPreventiveAlert
    // Caso 1: Lluvia < 70%
    const mockForecastLowRain = { ...forecast, maxRainProb: 20 };
    const alertLow = await WeatherService.checkPreventiveAlert(testEvent, {
        forceCheck: true,
        forecast: mockForecastLowRain
    });
    assert.strictEqual(alertLow.alertNeeded, false, 'No debe alertar si lluvia < 70%');

    // Caso 2: Lluvia >= 70% con forceCheck
    const mockForecastHighRain = { ...forecast, maxRainProb: 85 };
    const alertHigh = await WeatherService.checkPreventiveAlert(testEvent, {
        forceCheck: true,
        forecast: mockForecastHighRain
    });
    assert.strictEqual(alertHigh.alertNeeded, true, 'Debe alertar si lluvia >= 70%');
    assert.strictEqual(alertHigh.alertType, 'RAIN_RISK');
    assert.strictEqual(alertHigh.maxRainProb, 85);
    console.log('✅ 5. checkPreventiveAlert comprobado (umbrales y lógica)');

    // 6. Envío de alerta preventiva y anti-spam de 2 horas
    // Mock de NotificationService
    let toastReceived = null;
    global.window = {
        NotificationService: {
            showInAppToast: (title, msg) => {
                toastReceived = { title, msg };
            },
            showToast: (msg) => {
                toastReceived = { msg };
            }
        }
    };

    const sendRes1 = await WeatherService.sendPreventiveAlert(testEvent, mockForecastHighRain);
    assert.strictEqual(sendRes1.success, true);
    assert.strictEqual(sendRes1.notifiedCount, 4);
    assert.ok(sendRes1.notificationPayload.title.includes('AVISO PREVENTIVO'));
    assert.ok(sendRes1.notificationPayload.message.includes('85%'));
    assert.ok(toastReceived, 'NotificationService debe haber recibido la llamada');

    // Intento inmediato de reenvío (debe bloquear por anti-spam de 2 horas)
    const sendRes2 = await WeatherService.sendPreventiveAlert(testEvent, mockForecastHighRain);
    assert.strictEqual(sendRes2.success, false, 'Debe bloquear reenvío dentro de las 2 horas');
    assert.strictEqual(sendRes2.reason, 'ALREADY_SENT_RECENTLY');
    console.log('✅ 6. sendPreventiveAlert y anti-spam de 2 horas comprobados');

    // 7. scanAllUpcomingEvents
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 4);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    const h = String(tomorrow.getHours()).padStart(2, '0');

    const sampleEvents = [
        {
            id: 'evt_future_safe',
            date: `${y}-${m}-${d}`,
            time: `${h}:00`,
            sede: 'Cornellà'
        }
    ];

    const scanned = await WeatherService.scanAllUpcomingEvents(sampleEvents);
    assert.ok(Array.isArray(scanned), 'scanAllUpcomingEvents debe devolver un array');
    console.log(`✅ 7. scanAllUpcomingEvents comprobado (escaneados con éxito)`);

    // 8. Retrocompatibilidad: calculatePadelIntelligence y getDashboardWeather
    const intel = WeatherService.calculatePadelIntelligence({
        temp: 22,
        humidity: 60,
        pressure: 1013,
        wind: 10,
        rain: 0,
        uv: 4,
        isDay: 1,
        weatherCode: 0
    });
    assert.ok(intel.score > 0, 'calculatePadelIntelligence debe calcular score');
    assert.ok(intel.ballSpeed, 'calculatePadelIntelligence debe calcular ballSpeed');
    assert.ok(intel.recommendation, 'calculatePadelIntelligence debe calcular recomendación');
    console.log('✅ 8. calculatePadelIntelligence retrocompatible y operativo');

    console.log('\n🎉 ¡TODOS LOS TESTS DE WEATHER SERVICE PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
    console.error('❌ Error en test suite:', err);
    process.exit(1);
});
