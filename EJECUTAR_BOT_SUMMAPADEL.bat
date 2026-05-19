@echo off
echo ============================================
echo   ROBOT CAZARRECOMPENSAS - SOMOSPADEL BCN
echo   Rastreando todos los equipos del club...
echo ============================================
cd /d "%~dp0.."
python scraper/bot_summapadel.py
echo.
echo ============================================
echo   PROCESO COMPLETADO!
echo   Si el servidor local (http://localhost:8080)
echo   estaba activo, los datos se habrán subido
echo   automáticamente a Firebase en tiempo real.
echo   De lo contrario, inicia el servidor local y
echo   sincroniza manualmente desde el panel admin.
echo ============================================
pause
