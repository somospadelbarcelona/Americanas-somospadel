@echo off
title Playtomic Auto Sync Somos Padel
echo ==============================================================
echo  🎾 INICIANDO SINCRONIZADOR AUTÓNOMO PLAYTOMIC - SOMOS PÁDEL
echo ==============================================================
echo Sincronizando torneos de:
echo  - NEW Play Padel Pro Hospitalet (somospadeleugestion@gmail.com)
echo  - Barcelona Padel El Prat (Eduard Bainad Puig)
echo Intervalo de comprobacion: Cada 3 horas
echo ==============================================================

cd /d "%~dp0\.."
python scraper\playtomic_auto_daemon.py --interval-hours 3
pause
