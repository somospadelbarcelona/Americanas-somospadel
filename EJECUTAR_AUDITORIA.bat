@echo off
title Auditor de Calidad Anti-Gravity
echo.
echo ========================================
echo   AUDITANDO CALIDAD DEL PROYECTO
echo ========================================
echo.

node tools/VALIDAR_PROYECTO.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Se han detectado fallos en la auditoria.
) else (
    echo [OK] Tu proyecto cumple con el estandar de calidad.
)

echo.
pause
