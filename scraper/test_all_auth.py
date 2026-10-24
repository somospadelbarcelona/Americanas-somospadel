# -*- coding: utf-8 -*-
import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

email = 'somospadeleugestion@gmail.com'
password = 'Factor2000!'

endpoints = [
    'https://api.app.playtomic.io/v1/auth/login',
    'https://api.app.playtomic.io/v2/auth/login',
    'https://api.app.playtomic.io/v3/auth/login',
    'https://api.app.playtomic.io/v1/users/login',
    'https://api.app.playtomic.io/v2/users/login',
    'https://api.playtomic.io/v1/auth/login',
    'https://api.playtomic.io/v2/auth/login',
    'https://playtomic.io/api/v1/auth/login'
]

headers = {
    'User-Agent': 'Playtomic/3.67.0 (Android; 14; Mobile)',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'com.playtomic'
}

for ep in endpoints:
    payload = json.dumps({
        'email': email,
        'password': password
    }).encode('utf-8')
    try:
        req = urllib.request.Request(ep, data=payload, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
            print(f"[SUCCESS {r.status}] {ep}")
            print(r.read().decode('utf-8')[:300])
            break
    except urllib.error.HTTPError as e:
        print(f"[{e.code}] {ep}: {e.read().decode('utf-8')[:120]}")
    except Exception as e:
        print(f"[ERR] {ep}: {e}")
