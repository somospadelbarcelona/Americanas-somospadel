@echo off
echo ===================================================
echo   SUBIENDO CAMBIOS DE AMERICANAS A PRODUCCION (FORZADO)
echo ===================================================
echo.
cd /d "c:\Users\acoscolin\OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio\ALEX\AMERICANAS"
"C:\Users\acoscolin\AppData\Local\GitHubDesktop\app-3.5.12\resources\app\git\cmd\git.exe" push origin index.html --force
echo.
echo ===================================================
echo   Proceso finalizado. Puedes cerrar esta ventana.
echo ===================================================
pause
