@echo off
chcp 65001 >nul
title AUTOMATISMO AUTÓNOMO PLAYTOMIC - SOMOSPADEL BARCELONA
color 0B
cd /d "%~dp0"

echo ====================================================================
echo   🎾 AUTOMATISMO AUTÓNOMO PLAYTOMIC ⇄ SOMOSPADEL BARCELONA
echo ====================================================================
echo.
echo Sedes Oficiales Monitoreadas:
echo   1. NEW Play Padel Pro Hospitalet (Organizador: somospadel barcelona)
echo   2. Barcelona Pádel El Prat (Organizador: eduard bainad puig)
echo.
echo Filtro Estricto:
echo   - Se analizan y descubren nuevas americanas publicadas en Playtomic.
echo   - Se descartan marcas y organizadores ajenos (Crazyxpadel, Jaleo, etc.).
echo   - Se sincronizan plazas, jugadores, pistas y carteles HD a Firestore.
echo.
echo [1] Ejecutar sincronización y escaneo AHORA MISMO (1 ciclo)
echo [2] Iniciar Modo Autónomo Diario (queda activo en segundo plano 24/7)
echo.

set /p opcion="Selecciona una opción [1 o 2] (por defecto 1): "

if "%opcion%"=="2" (
    echo.
    echo 🔄 Iniciando Servicio Autónomo Playtomic... (Comprobación continua y diaria)
    echo    Para detenerlo cierra esta ventana.
    echo.
    python scraper\playtomic_auto_daemon.py --daily
) else (
    echo.
    echo 🚀 Ejecutando escaneo y sincronización en tiempo real...
    python scraper\playtomic_auto_daemon.py --once
    echo.
    echo ====================================================================
    echo   [COMPLETADO] Sincronización finalizada con éxito.
    echo ====================================================================
    echo.
    pause
)
