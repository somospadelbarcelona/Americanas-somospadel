import urllib.request
import urllib.error
import json

base_urls = [
    "https://api.app.playtomic.io/v3/auth/login",
    "https://playtomic.io/api/v3/auth/login",
    "https://api.playtomic.io/v3/auth/login"
]

payload = {
    "email": "somospadeleugestion@gmail.com",
    "password": "Factor2000!"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "com.playtomic.web"
}

for url in base_urls:
    print(f"\nTrying {url} ...")
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(">>> SUCCESS! <<<")
            print("Response keys:", list(data.keys()))
            if "access_token" in data:
                print("access_token:", data["access_token"][:30] + "...")
                with open("scraper/playtomic_token.json", "w") as f:
                    json.dump(data, f, indent=2)
                break
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code, e.read().decode('utf-8'))
    except Exception as e:
        print("Exception:", e)
