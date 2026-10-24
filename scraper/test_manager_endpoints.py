# -*- coding: utf-8 -*-
import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://manager.playtomic.io'
}

payload = json.dumps({
    "email": "somospadeleugestion@gmail.com",
    "password": "Factor2000!"
}).encode('utf-8')

endpoints = [
    'https://manager.playtomic.io/api/login',
    'https://manager.playtomic.io/api/v1/login',
    'https://manager.playtomic.io/api/auth/login',
    'https://manager.playtomic.io/api/v1/auth/login',
    'https://manager.playtomic.io/api/sessions',
    'https://manager.playtomic.io/api/v1/sessions',
    'https://thirdparty.playtomic.io/api/v1/oauth/token'
]

for ep in endpoints:
    try:
        req = urllib.request.Request(ep, data=payload, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
            print(f"[SUCCESS {r.status}] {ep}:")
            print("  ", r.read().decode('utf-8')[:300])
    except urllib.error.HTTPError as e:
        print(f"[{e.code}] {ep}: {e.read().decode('utf-8')[:150]}")
    except Exception as e:
        print(f"[ERR] {ep}: {e}")
