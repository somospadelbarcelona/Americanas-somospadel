import urllib.request
import urllib.error
import sys

tournament_id = "46011a01-68b4-433f-b2e3-581ca5fabfdb"

endpoints = [
    f"https://api.app.playtomic.io/v1/tournaments/{tournament_id}",
    f"https://api.app.playtomic.io/v2/tournaments/{tournament_id}",
    f"https://api.app.playtomic.io/v3/tournaments/{tournament_id}",
    f"https://api.app.playtomic.io/v1/tournaments/{tournament_id}/teams",
    f"https://api.app.playtomic.io/v2/tournaments/{tournament_id}/teams",
    f"https://api.app.playtomic.io/v1/tournaments/{tournament_id}/participants",
    f"https://api.app.playtomic.io/v2/tournaments/{tournament_id}/participants",
    f"https://api.app.playtomic.io/v1/tournaments/{tournament_id}/registrations",
    f"https://api.app.playtomic.io/v2/tournaments/{tournament_id}/registrations",
    f"https://api.app.playtomic.io/v2/tournaments/{tournament_id}/matches",
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'com.playtomic.web'
}

for ep in endpoints:
    req = urllib.request.Request(ep, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = resp.read().decode('utf-8')
            print(f"SUCCESS {ep} [{resp.status}]: {data[:200]}", flush=True)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f"HTTPError {ep} [{e.code}]: {body[:150]}", flush=True)
    except Exception as e:
        print(f"Err {ep}: {e}", flush=True)
