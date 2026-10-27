@echo off
cd /d "%~dp0.."
python "scraper\playtomic_auto_daemon.py" --once >> "scraper\playtomic_cron.log" 2>&1
