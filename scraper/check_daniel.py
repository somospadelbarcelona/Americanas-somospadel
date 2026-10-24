# -*- coding: utf-8 -*-
import subprocess, json

url = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/players/u_646603954"
cmd = ["curl.exe", "-s", "-L", url]
out = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore").stdout
print(out[:500])
