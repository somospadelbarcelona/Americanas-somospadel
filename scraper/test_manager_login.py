# -*- coding: utf-8 -*-
import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

api_key = "AIzaSyCngqRMcffLA8NZWS6eMN4KikucDC-_V-Y" # Playtomic Manager Firebase API Key!
email = "somospadeleugestion@gmail.com"
password = "Factor2000!"

url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
payload = json.dumps({
    "email": email,
    "password": password,
    "returnSecureToken": True
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
        print("Playtomic Manager Login Status:", r.status)
        data = json.loads(r.read().decode('utf-8'))
        print("User signed in successfully to Playtomic Manager!")
        print("LocalId (UID):", data.get("localId"))
        print("Email:", data.get("email"))
        id_token = data.get("idToken")
        print("Token prefix:", id_token[:30])
        with open('scraper/manager_session.json', 'w', encoding='utf-8') as out:
            json.dump(data, out, indent=2)
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Err:", e)
