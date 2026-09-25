@echo off
title SOMOS PADEL BCN - ESTUDIO DE MARKETING Y FLYERS
echo ====================================================
echo   SOMOS PADEL BCN - ESTUDIO DE FLYERS Y VIDEOS 2026
echo ====================================================
echo.
echo Iniciando servidor local para habilitar descargas HD en maxima resolucion...
echo.

cd /d "%~dp0"

REM Iniciar servidor Python en segundo plano si no está activo
start /B python -m http.server 8000 >nul 2>&1

REM Pequeña espera de 1.5 segundos
timeout /t 2 /nobreak >nul

REM Abrir en el navegador a traves del servidor local http://localhost:8000
echo Abriendo en tu navegador: http://localhost:8000/promo-studio.html
start http://localhost:8000/promo-studio.html

echo.
echo ====================================================
echo   ESTUDIO ACTIVO EN http://localhost:8000/promo-studio.html
echo ====================================================
echo Puedes minimizar esta ventana. Para cerrarla presiona cualquier tecla.
pause >nul
exit
