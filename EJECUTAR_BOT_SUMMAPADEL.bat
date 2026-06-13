@echo off
echo ============================================
echo   ROBOT CAZARRECOMPENSAS - SOMOSPADEL BCN
echo   Rastreando todos los equipos del club...
echo ============================================
cd /d "%~dp0"

:: 1. Arrancar el servidor local en segundo plano
echo.
echo [SERVIDOR] Iniciando servidor local en http://localhost:8080...
start /b python -m http.server 8080 > nul 2>&1

:: 2. Esperar 4 segundos a que el servidor esté listo
echo [SERVIDOR] Esperando que el servidor arranque (4 seg)...
timeout /t 4 /nobreak > nul

:: 3. Verificar que el servidor responde
curl -s -o nul -w "%%{http_code}" http://localhost:8080 > nul 2>&1
echo [SERVIDOR] Servidor activo. Lanzando bot...

:: 4. Ejecutar el bot scraper
echo.
python scraper/bot_summapadel.py

:: 5. Matar el servidor al terminar
echo.
echo [SERVIDOR] Cerrando servidor local...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080"') do (
    taskkill /PID %%a /F > nul 2>&1
)

echo.
echo ============================================
echo   PROCESO COMPLETADO!
echo   Los datos se han subido a Firebase.
echo ============================================
pause
