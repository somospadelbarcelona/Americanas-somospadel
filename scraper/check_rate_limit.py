import urllib.request
import urllib.error
import json

url = "https://manager.playtomic.io/api/v3/auth/login"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json, text/plain, */*",
    "x-requested-with": "com.playtomic.manager 1.328.0+build.5972",
    "referer": "https://manager.playtomic.io/auth/login"
}

payload = {
    "requested_user_scopes": [{"role": "ROLE_CUSTOMER", "scope_id": None}],
    "email": "somospadeleugestion@gmail.com",
    "password": "Factor2000!"
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        print("Data:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Err:", e)
