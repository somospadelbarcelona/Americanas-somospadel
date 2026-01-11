@echo off
echo ========================================
echo   SERVIDOR LOCAL SOMOSPADEL
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8000
echo.
echo IMPORTANTE:
echo - Abre tu navegador en: http://localhost:8000
echo - NO uses file:// (doble clic en index.html)
echo - Para ADMIN: http://localhost:8000/admin.html
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

python -m http.server 8000

pause
