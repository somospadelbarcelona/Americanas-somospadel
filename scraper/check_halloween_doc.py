# -*- coding: utf-8 -*-
import subprocess
import json

url = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/americanas/pt_46011a01_halloween"
cmd = ["curl.exe", "-s", "-L", url]
proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")

if proc.returncode == 0:
    data = json.loads(proc.stdout)
    fields = data.get("fields", {})
    print("Tournament:", fields.get("name", {}).get("stringValue", ""))
    print("Price:", fields.get("price", {}))
    print("Price Members:", fields.get("price_members", {}))
    print("Price External:", fields.get("price_external", {}))
    print("Players:")
    raw_p = fields.get("players", {}).get("arrayValue", {}).get("values", [])
    for p in raw_p:
        pmap = p.get("mapValue", {}).get("fields", {})
        print("  - ID:", pmap.get("id", {}).get("stringValue", ""), "| Name:", pmap.get("name", {}).get("stringValue", ""), "| Source:", pmap.get("source", {}).get("stringValue", ""))
