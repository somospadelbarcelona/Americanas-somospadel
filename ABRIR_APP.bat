@echo off
chcp 65001 >nul
title SOMOSPADEL BCN - SERVIDOR APP & PLAYTOMIC API
color 0B
cd /d "%~dp0"

echo ========================================================
echo   🎾 INICIANDO SOMOSPADEL BCN (APP & PLAYTOMIC EN VIVO)
echo ========================================================
echo.
echo Abriendo navegador en http://localhost:8000...
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

python server.py
