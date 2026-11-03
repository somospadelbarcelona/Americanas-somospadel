@echo off
cd /d "%~dp0.."
netstat -ano | findstr "0.0.0.0:8000" >nul 2>&1
if errorlevel 1 (
    start "" /b pythonw "server.py" >nul 2>&1
)
python "scraper\playtomic_auto_daemon.py" --once >> "scraper\playtomic_cron.log" 2>&1
