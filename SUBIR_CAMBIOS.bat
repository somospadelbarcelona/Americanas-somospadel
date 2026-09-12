@echo off
echo ===================================================
echo   SUBIENDO CAMBIOS DE AMERICANAS A PRODUCCION (FORZADO)
echo ===================================================
echo.
cd /d "c:\Users\acoscolin\OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio\ALEX\AMERICANAS"

for /f "delims=" %%i in ('dir /b /s "%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" 2^>nul') do set GIT_PATH="%%i"
if not defined GIT_PATH set GIT_PATH="C:\Users\acoscolin\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe"

echo 1. Preparando archivos modificados...
%GIT_PATH% add .

echo 2. Creando punto de guardado (Commit)...
%GIT_PATH% commit -m "Mejoras de automatizacion en el AutoBlog Engine v2"

echo 3. Subiendo cambios a GitHub (Rama: index.html)...
%GIT_PATH% push origin index.html --force

echo.
echo ===================================================
echo   Proceso finalizado. Puedes cerrar esta ventana.
echo ===================================================
pause
