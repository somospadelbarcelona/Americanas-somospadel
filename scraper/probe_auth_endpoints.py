import urllib.request
import urllib.error
import json

test_payloads = [
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!"},
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!", "scope": "playtomic"},
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!", "scope": "app"},
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!", "scope": "user"},
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!", "scope": "PLAYTOMIC"},
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!", "client_id": "playtomic-web"},
    {"email": "somospadeleugestion@gmail.com", "password": "Factor2000!", "client_id": "playtomic-app"},
    {"username": "somospadeleugestion@gmail.com", "password": "Factor2000!"},
]

endpoints = [
    "https://api.app.playtomic.io/v1/auth/login",
    "https://api.app.playtomic.io/v2/auth/login",
    "https://api.app.playtomic.io/v3/auth/login",
    "https://api.app.playtomic.io/v3/auth/token",
    "https://api.playtomic.io/v1/auth/login",
    "https://api.playtomic.io/v2/auth/login",
    "https://api.playtomic.io/v3/auth/login",
]

for ep in endpoints:
    print(f"\n--- Testing endpoint: {ep} ---")
    for payload in test_payloads[:3]:
        req = urllib.request.Request(
            ep,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Playtomic/1.0',
                'Accept': 'application/json'
            }
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"SUCCESS {ep}:", resp.status, resp.read().decode('utf-8')[:200])
                break
        except urllib.error.HTTPError as e:
            res = e.read().decode('utf-8', errors='ignore')
            print(f"Err {ep} with scope={payload.get('scope')}: {e.code} -> {res[:150]}")
