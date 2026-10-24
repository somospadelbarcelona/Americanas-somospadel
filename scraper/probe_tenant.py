# -*- coding: utf-8 -*-
import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

tenant_id = "bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"
tournament_id = "46011a01-68b4-433f-b2e3-581ca5fabfdb"

endpoints = [
    f"https://api.app.playtomic.io/v1/tenants/{tenant_id}",
    f"https://api.app.playtomic.io/v1/tenants/{tenant_id}/tournaments",
    f"https://api.app.playtomic.io/v1/tenants/{tenant_id}/tournaments/{tournament_id}",
    f"https://api.app.playtomic.io/v2/tenants/{tenant_id}/tournaments/{tournament_id}",
    f"https://manager.playtomic.io/api/tenants/{tenant_id}",
    f"https://manager.playtomic.io/api/v1/tournaments/{tournament_id}",
    f"https://playtomic.io/api/v1/tenants/{tenant_id}",
    f"https://playtomic.io/api/v1/tournaments/{tournament_id}"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
}

for ep in endpoints:
    try:
        req = urllib.request.Request(ep, headers=headers)
        with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
            data = r.read().decode('utf-8')
            print(f"[SUCCESS {r.status}] {ep}: length={len(data)}")
            print("  ", data[:250])
    except urllib.error.HTTPError as e:
        print(f"[HTTP {e.code}] {ep}")
    except Exception as e:
        print(f"[ERR] {ep}: {e}")
