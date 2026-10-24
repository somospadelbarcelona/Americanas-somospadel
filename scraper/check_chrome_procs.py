import subprocess
import re

out = subprocess.check_output('wmic process where "name=\'chrome.exe\'" get CommandLine,ProcessId', shell=True, text=True, errors='ignore')
for line in out.splitlines():
    if '--profile-directory' in line:
        m = re.search(r'--profile-directory="?([^"\s]+)"?', line)
        if m:
            print("Running Profile:", m.group(1))
