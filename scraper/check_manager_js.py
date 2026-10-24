# -*- coding: utf-8 -*-
import urllib.request, ssl, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://manager.playtomic.io/assets/index-BFvobo1d.js'
headers = {'User-Agent': 'Mozilla/5.0'}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
        js = r.read().decode('utf-8')
        print("Manager JS length:", len(js))
        # Look for login endpoints, /api/auth or similar
        endpoints = set(re.findall(r'\"(/api/[a-zA-Z0-9_-]+(?:auth|login|session|user)[a-zA-Z0-9_-]*)\"', js))
        print("Endpoints:", endpoints)
        for ep in endpoints:
            print("  Endpoint:", ep)
except Exception as e:
    print("Err:", e)
