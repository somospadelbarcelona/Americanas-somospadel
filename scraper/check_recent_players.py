# -*- coding: utf-8 -*-
import subprocess
import json

url = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/players?pageSize=300"
cmd = ["curl.exe", "-s", "-L", url]
proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")

if proc.returncode == 0:
    data = json.loads(proc.stdout)
    docs = data.get("documents", [])
    print(f"Total players in DB: {len(docs)}")
    
    # Sort by updateTime
    sorted_docs = sorted(docs, key=lambda d: d.get("updateTime", ""), reverse=True)
    print("Top 10 recently updated players in DB:")
    for d in sorted_docs[:10]:
        doc_id = d.get("name", "").split("/")[-1]
        fields = d.get("fields", {})
        name = fields.get("name", {}).get("stringValue", "")
        level = fields.get("level", {}).get("doubleValue", fields.get("level", {}).get("integerValue", "?"))
        update_time = d.get("updateTime", "")
        print(f"  [{update_time}] ID={doc_id} | Name={name} | Level={level}")
