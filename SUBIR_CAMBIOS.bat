@echo off
setlocal EnableDelayedExpansion
echo ===================================================
echo   SUBIENDO CAMBIOS DE AMERICANAS A PRODUCCION (FORZADO)
echo ===================================================
echo.
cd /d "%~dp0"

set "GIT_PATH="

:: 1. Buscar en GitHub Desktop dinamicamente (detecta cualquier version app-*)
for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
    if exist "%%D\resources\app\git\cmd\git.exe" (
        set "GIT_PATH=%%D\resources\app\git\cmd\git.exe"
    )
)

:: 2. Si no esta en GitHub Desktop, buscar en el PATH del sistema
if not defined GIT_PATH (
    where git.exe >nul 2>&1
    if !ERRORLEVEL! equ 0 set "GIT_PATH=git"
)

:: 3. Si aun no se encuentra, buscar en Archivos de Programa
if not defined GIT_PATH (
    if exist "%ProgramFiles%\Git\cmd\git.exe" set "GIT_PATH=%ProgramFiles%\Git\cmd\git.exe"
)

if not defined GIT_PATH (
    echo [ERROR] No se pudo encontrar Git en el equipo.
    pause
    exit /b 1
)

echo Usando Git: !GIT_PATH!
echo.

echo 1. Preparando archivos modificados...
"!GIT_PATH!" add .

echo.
echo 2. Creando punto de guardado (Commit)...
"!GIT_PATH!" commit -m "Actualizacion automatica de cambios"

echo.
echo 3. Subiendo cambios a GitHub (Rama: index.html)...
"!GIT_PATH!" push origin HEAD:index.html --force

echo.
echo ===================================================
echo   Proceso finalizado. Puedes cerrar esta ventana.
echo ===================================================
pause
