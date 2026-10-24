import urllib.request
import urllib.error
import json
import time

tenant_id = "bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"
email = "somospadeleugestion@gmail.com"
password = "Factor2000!"

test_scopes = [
    [{"role": "ROLE_CUSTOMER", "scope_id": None}],
    [{"role": "ROLE_CUSTOMER", "scope_id": tenant_id}],
    [{"role": "ROLE_TENANT_ADMIN", "scope_id": tenant_id}],
    [{"role": "ROLE_TENANT_ADMIN", "scope_id": None}],
    [{"role": "ROLE_TENANT_MANAGER", "scope_id": tenant_id}],
    [{"role": "ROLE_ADMIN", "scope_id": tenant_id}],
    [{"role": "ROLE_MANAGER", "scope_id": tenant_id}],
    [{"role": "TENANT_ADMIN", "scope_id": tenant_id}],
    [{"role": "TENANT", "scope_id": tenant_id}],
    []
]

url = "https://manager.playtomic.io/api/v3/auth/login"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json, text/plain, */*",
    "x-requested-with": "com.playtomic.manager 1.328.0+build.5972",
    "referer": "https://manager.playtomic.io/auth/login"
}

for scopes in test_scopes:
    payload = {
        "requested_user_scopes": scopes,
        "email": email,
        "password": password
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("\n🎉🎉🎉 SUCCESS! Scopes:", scopes)
            print("Response:", data)
            with open("scraper/playtomic_authenticated_manager.json", "w") as f:
                json.dump(data, f, indent=2)
            break
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f"Scope {scopes} -> {e.code}: {body}")
    except Exception as e:
        print(f"Scope {scopes} -> Err: {e}")
    time.sleep(0.5)
