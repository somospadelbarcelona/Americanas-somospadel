# -*- coding: utf-8 -*-
import subprocess

cmd = ["powershell", "-Command", "Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object ProcessName, MainWindowTitle"]
proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
print(proc.stdout)
