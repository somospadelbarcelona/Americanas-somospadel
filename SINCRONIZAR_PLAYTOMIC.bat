@echo off
chcp 65001 >nul
title SINCRONIZADOR OFICIAL PLAYTOMIC - SOMOS PADEL BCN
color 0A
cd /d "%~dp0"

echo ========================================================
echo   🎾 SINCRONIZADOR OFICIAL PLAYTOMIC -> SOMOS PADEL BCN
echo ========================================================
echo.
echo [1] Sincronizar enlaces desde archivo scraper\playtomic_tournaments_urls.txt
echo [2] Pegar un enlace directo de Playtomic ahora mismo
echo.

set /p opcion="Selecciona una opcion (1 o 2) [por defecto 1]: "

if "%opcion%"=="2" (
    echo.
    set /p url_playtomic="Pega aqui el enlace completo de Playtomic: "
    echo.
    echo Conectando y extrayendo torneo, cartel HD y enlace...
    python scraper\playtomic_sync.py "%url_playtomic%"
) else (
    echo.
    echo Procesando enlaces de scraper\playtomic_tournaments_urls.txt...
    python scraper\playtomic_sync.py
)

echo.
echo ========================================================
echo   [COMPLETADO] Sincronizacion finalizada con exito.
echo ========================================================
echo.
pause
