@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================================================
echo   SOMOSPADEL - AUDITORIA Y SIMULACION RIGUROSA DE TORNEOS Y ENTRENOS
echo ===============================================================================
echo   Modalidades evaluadas en 6 Rondas completas [8, 12, 16 y 20 jugadores]:
echo     1. Entrenos Twister [Pozo individual rotativo]
echo     2. Entrenos con Pareja Fija [Ordenacion por nivel]
echo     3. Americanas Twister [Pozo individual rotativo]
echo     4. Americanas con Pareja Fija [Fidelidad 100%% y cruces canonicos]
echo     5. Simulacion de Eventos Reales Programados [Base de Datos SomosPadel]
echo ===============================================================================
echo.

node tools/audit-all-modes-simulator.js
set EXIT_CODE=%ERRORLEVEL%

echo.
if "%EXIT_CODE%"=="0" (
    echo ===============================================================================
    echo   AUDITORIA COMPLETADA CON EXITO: 100%% DE COMPROBACIONES SUPERADAS
    echo   Reporte detallado guardado en: REPORTE_AUDITORIA_LOGICA.md
    echo ===============================================================================
) else (
    echo ===============================================================================
    echo   SE DETECTARON DISCREPANCIAS EN LA AUDITORIA [Codigo de salida: %EXIT_CODE%]
    echo   Consulta REPORTE_AUDITORIA_LOGICA.md para mas detalles.
    echo ===============================================================================
)

echo.
pause
