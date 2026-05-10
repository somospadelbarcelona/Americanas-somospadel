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
echo   Ahora ve a tu Panel Admin y pulsa:
echo   SINCRO SUMMAPADEL
echo ============================================
pause
